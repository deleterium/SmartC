"use strict";

// Author: Rui Deleterium
// Project:
// License:

// Traverse an AST created by parser to create another AST tree based on
//  simple operations. Only unary or binary operations permitted here.
//  Uses precedence values to decide the operations order.

function createSyntacticTree(ast) {

    if (ast === undefined)
        throw new SyntaxError("Undefined AST to create syntactic tree");
    if (ast.length == 0)
        return {};

    //precedente evaluation loop
    var i, j;
    var end = false;
    for (j=10; j>1 && end === false ; j--) {
        for (i=0; i<ast.length; i++) {
            if (ast[i].precedence == j) {
                end = true;
                break;
            }
        }
    }

    if (end === false) {
        // he have only precedente <= 1: variable, constants, codecave and array)
        if (ast.length == 1) {
            if (ast[0].type == "Variable" || ast[0].type == "Constant"){
                return ast[0];
            }
            if (ast[0].type == "CodeCave"){
                return createSyntacticTree(ast[0].params);
            }
        } else if (ast.length == 2) {
           if (ast[0].type == "Variable" && ast[1].type == "Arr"){
                return { Left:      ast[0],
                         Operation: {type: "Arr"},
                         Right:     createSyntacticTree(ast[1].params) };
            }
        }
        throw new SyntaxError("Unknown tokens sequence. Type:"+ast[0].type+" Value:"+ast[0].value);
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
    } else if (ast[i].type == "Comparision" || ast[i].type == "NewCodeLine") {
        return { Left:      createSyntacticTree(ast.slice(0,i)),
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

    throw new SyntaxError("Unknown tokens sequence. Type:"+ast[0].type+" Value:"+ast[0].value);
}
