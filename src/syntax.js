"use strict";

// Author: Rui Deleterium
// Project: https://github.com/deleterium/BurstAT-Compiler
// License: BSD 3-Clause License

// Traverse an AST created by parser to create another AST tree based on
//  simple operations. Only unary or binary operations permitted here.
//  Uses precedence values to decide the operations order.

// Note also other important funcion below: bigastProcessSyntax(baps_Big_ast)

function createSyntacticTree(ast) {

    if (ast === undefined)
        throw new SyntaxError("Undefined AST to create syntactic tree");
    if (ast.length == 0)
        return {};

    //precedente evaluation loop
    var i, j;
    var end = false;
    for (j=11; j>1 && end === false ; j--) {
        for (i=0; i<ast.length; i++) {
            if (ast[i].precedence == j) {
                end = true;
                break;
            }
        }
    }

    if (end === false) {
        // he have only precedente <= 1: variable, constant, codecave, array, codedomain, member)

        if (ast[0].type === "Variable"){
            if (ast.length == 1) {
                return ast[0];
            }
            var Node = ast[0];
            Node.param_type = [];
            Node.params = [];
            for (i=1; i< ast.length; i++){
                if (ast[i].type === "Arr") {
                    Node.param_type.push("Arr");
                    Node.params.push(createSyntacticTree(ast[i].params));
                } else if (ast[i].type === "Member") {
                    Node.param_type.push("Member");
                    i++;
                    Node.params.push(createSyntacticTree(ast[i]));
                }
                else {
                    throw new TypeError("At line: "+ast[i].line+". Invalid type of variable modifier: "+ast[i].type);
                }
            }
            return Node;
        }

        if ( ast[0].type === "Constant") {
            if (ast.length == 1) {
                return ast[0];
            }
        }

        if (ast[0].type === "Keyword"){
            if (ast.length == 1) {
                return ast[0];
            } else {
                return { Left:     ast[0],
                        Operation: {type: "Keyword", line: ast[0].line },
                        Right:     createSyntacticTree(ast.slice(1)) };
            }
        }

        if (ast[0].type === "CodeCave"){
            if (ast.length == 1) {
                return createSyntacticTree(ast[0].params);
            }
            //if (ast.length > 1) {
            throw new SyntaxError("At line: "+ast[0].line+". Modifiers for CodeCave not implemented");
        }

        if (ast[0].type === "CodeDomain"){
            if (ast.length == 1) {
                return createSyntacticTree(ast[0].params);
            }
        }

        if (ast[0].type === "Function" &&  ast.length == 2) {
            if (ast[1].type === "CodeCave"){
                return { Left:      ast[0],
                        Operation: {type: "FunctionCall", line: ast[0].line },
                        Right:     createSyntacticTree(ast[1].params) };
            }
        }

        throw new SyntaxError("At line: "+ast[0].line+". Unknown token sequence: "+ast[0].type+" with value: "+ast[0].value);

    // Here we start to process operations tokens (precedente >= 2)
    } else if (ast[i].type == "Operator") {

        //optimize tempvar assigment for binary commutative operations
        if (ast[i].value == "+" || ast[i].value == "*" || ast[i].value == "&" || ast[i].value == "^" || ast[i].value == "|" )
            return { Right: createSyntacticTree(ast.slice(0,i)),
                Operation: ast[i],
                Left:      createSyntacticTree(ast.slice(i+1)) };
        else
            return { Left:  createSyntacticTree(ast.slice(0,i)),
                Operation: ast[i],
                Right:     createSyntacticTree(ast.slice(i+1)) };

    } else if (ast[i].type == "Assignment" || ast[i].type == "SetOperator") {

        return { Left:      createSyntacticTree(ast.slice(0,i)),
                Operation: ast[i],
                Right:     createSyntacticTree(ast.slice(i+1)) };

    } else if (ast[i].type == "Comparision" || ast[i].type == "Delimiter") {

        return { Left:      createSyntacticTree(ast.slice(0,i)),
                Operation: ast[i],
                Right:     createSyntacticTree(ast.slice(i+1)) };

    } else if (ast[i].type == "Keyword") {
        if (ast.length == 1) {
            return ast[0];
        }
        return { Left:      createSyntacticTree(ast.slice(0,i+1)),
                Operation: ast[i],
                Right:     createSyntacticTree(ast.slice(i+1)) };

    } else if (ast[i].type == "UnaryOperator" && i==0 ){

        if (ast[i].value === "*" && ast.length > i) 
            if (ast[i+1].type !== "Variable" && ast[i+1].type !== "CodeCave")
                throw new SyntaxError("Invalid lvalue for pointer operation. Can not have type "+ast[i+1].type);
        return { Center:    createSyntacticTree(ast.slice(i+1)),
                Operation: ast[i] };

    } else if (ast[0].type == "SetUnaryOperator" && ast.length == 2 && ast[1].type == "Variable") {

        return { Left:      ast[1],
                Operation: ast[0] };

    } else if (ast[0].type == "Variable" && ast.length == 2 && ast[1].type == "SetUnaryOperator"){

        return { Right:     ast[0],
                Operation: ast[1] };
    }

    throw new SyntaxError("At line: "+ast[0].line+". Unknown token found:"+ast[0].type+" with value:"+ast[0].value);
}


// Traverse Bigast transforming:
//    code[Tokens{}]      to opTrees[OpTree{}]
//    condition[Tokens{}] to ConditionOpTree{}
// This transformation involves check operators precedence and let
//    operations in correct order for assembler.
function bigastProcessSyntax(baps_Big_ast) {
    
    
    // Process recursively one Sentence object, creating an OpTree object that was
    //   processed sintacticly.
    function processSentence(ps_Sntc) {

        for (const prop in ps_Sntc) {

            if (prop === "condition") {
                ps_Sntc.ConditionOpTree = createSyntacticTree(ps_Sntc.condition);
                delete ps_Sntc.condition;

            } else if (prop === "code") {
                ps_Sntc.OpTree = createSyntacticTree(ps_Sntc.code);
                delete ps_Sntc.code;

            } else if (prop === "if_true") {
                ps_Sntc.if_true.forEach(stnc => processSentence(stnc));

            } else if (prop === "if_false") {
                ps_Sntc.if_false.forEach(stnc => processSentence(stnc));

            } else if (prop === "while_true") {
                ps_Sntc.while_true.forEach(stnc => processSentence(stnc));

            } else if (prop === "three_sentences") {
                ps_Sntc.three_sentences.forEach(stnc => processSentence(stnc));
            }
        }
    }

    baps_Big_ast.Global.sentences.forEach(stnc => processSentence(stnc));

    baps_Big_ast.functions.forEach(func => func.sentences.forEach(stnc => processSentence(stnc)));

    return baps_Big_ast;
}
