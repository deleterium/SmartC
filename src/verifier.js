"use strict";

// Author: Rui Deleterium
// Project: https://github.com/deleterium/BurstAT-Compiler
// License: BSD 3-Clause License

// Verifies if an ast produced by parser complies with our syntax rules.
// Also sets if a Variable/Codecave is pointer operation (to be later used
// in rules). Returns almost the same input (but with right Variable/
// CodeCave parameters), so it can be chained during operation.
 
function verify(ast) {
    
    // y-> Yes, possible combination
    // n-> No, not possible combination
    // npo-> no pointer, possible only if variable is not pointer operation
    // po->  pointer, possible only if variable is pointer operation
    const language_rules = [
        { Current: "Variable", Next: "UnaryOperator", Possible: "n"},
        { Current: "Variable", Next: "SetUnaryOperator", Possible: "npo"},
        { Current: "Variable", Next: "SetOperator", Possible: "y"},
        { Current: "Variable", Next: "Operator", Possible: "y"},
        { Current: "Variable", Next: "NewCodeLine", Possible: "y"},
        { Current: "Variable", Next: "end", Possible: "y"},
        { Current: "Variable", Next: "Comparision", Possible: "y"},
        { Current: "Variable", Next: "CodeCave", Possible: "n"},
        { Current: "Variable", Next: "Assignment", Possible: "y"},
        { Current: "Variable", Next: "Arr", Possible: "npo"},
        { Current: "UnaryOperator", Next: "Variable", Possible: "y"},
        { Current: "UnaryOperator", Next: "UnaryOperator", Possible: "y"},
        { Current: "UnaryOperator", Next: "SetUnaryOperator", Possible: "y"},
        { Current: "UnaryOperator", Next: "SetOperator", Possible: "n"},
        { Current: "UnaryOperator", Next: "Operator", Possible: "n"},
        { Current: "UnaryOperator", Next: "NewCodeLine", Possible: "n"},
        { Current: "UnaryOperator", Next: "end", Possible: "n"},
        { Current: "UnaryOperator", Next: "Constant", Possible: "y"},
        { Current: "UnaryOperator", Next: "Comparision", Possible: "n"},
        { Current: "UnaryOperator", Next: "CodeCave", Possible: "y"},
        { Current: "UnaryOperator", Next: "Assignment", Possible: "n"},
        { Current: "UnaryOperator", Next: "Arr", Possible: "n"},
        { Current: "SetUnaryOperator", Next: "Variable", Possible: "npo"},
        { Current: "SetUnaryOperator", Next: "UnaryOperator", Possible: "n"},
        { Current: "SetUnaryOperator", Next: "SetUnaryOperator", Possible: "n"},
        { Current: "SetUnaryOperator", Next: "SetOperator", Possible: "y"},
        { Current: "SetUnaryOperator", Next: "Operator", Possible: "y"},
        { Current: "SetUnaryOperator", Next: "NewCodeLine", Possible: "y"},
        { Current: "SetUnaryOperator", Next: "end", Possible: "y"},
        { Current: "SetUnaryOperator", Next: "Constant", Possible: "n"},
        { Current: "SetUnaryOperator", Next: "Comparision", Possible: "y"},
        { Current: "SetUnaryOperator", Next: "CodeCave", Possible: "n"},
        { Current: "SetUnaryOperator", Next: "Assignment", Possible: "n"},
        { Current: "SetUnaryOperator", Next: "Arr", Possible: "n"},
        { Current: "SetOperator", Next: "Variable", Possible: "y"},
        { Current: "SetOperator", Next: "UnaryOperator", Possible: "y"},
        { Current: "SetOperator", Next: "SetUnaryOperator", Possible: "y"},
        { Current: "SetOperator", Next: "SetOperator", Possible: "n"},
        { Current: "SetOperator", Next: "Operator", Possible: "n"},
        { Current: "SetOperator", Next: "NewCodeLine", Possible: "n"},
        { Current: "SetOperator", Next: "end", Possible: "n"},
        { Current: "SetOperator", Next: "Constant", Possible: "y"},
        { Current: "SetOperator", Next: "Comparision", Possible: "n"},
        { Current: "SetOperator", Next: "CodeCave", Possible: "y"},
        { Current: "SetOperator", Next: "Assignment", Possible: "n"},
        { Current: "SetOperator", Next: "Arr", Possible: "n"},
        { Current: "Operator", Next: "Variable", Possible: "y"},
        { Current: "Operator", Next: "UnaryOperator", Possible: "y"},
        { Current: "Operator", Next: "SetUnaryOperator", Possible: "y"},
        { Current: "Operator", Next: "SetOperator", Possible: "n"},
        { Current: "Operator", Next: "Operator", Possible: "n"},
        { Current: "Operator", Next: "NewCodeLine", Possible: "n"},
        { Current: "Operator", Next: "end", Possible: "n"},
        { Current: "Operator", Next: "Constant", Possible: "y"},
        { Current: "Operator", Next: "Comparision", Possible: "n"},
        { Current: "Operator", Next: "CodeCave", Possible: "y"},
        { Current: "Operator", Next: "Assignment", Possible: "n"},
        { Current: "Operator", Next: "Arr", Possible: "n"},
        { Current: "NewCodeLine", Next: "Variable", Possible: "y"},
        { Current: "NewCodeLine", Next: "UnaryOperator", Possible: "y"},
        { Current: "NewCodeLine", Next: "SetUnaryOperator", Possible: "y"},
        { Current: "NewCodeLine", Next: "SetOperator", Possible: "n"},
        { Current: "NewCodeLine", Next: "Operator", Possible: "n"},
        { Current: "NewCodeLine", Next: "NewCodeLine", Possible: "y"},
        { Current: "NewCodeLine", Next: "end", Possible: "y"},
        { Current: "NewCodeLine", Next: "Constant", Possible: "y"},
        { Current: "NewCodeLine", Next: "Comparision", Possible: "n"},
        { Current: "NewCodeLine", Next: "CodeCave", Possible: "y"},
        { Current: "NewCodeLine", Next: "Assignment", Possible: "n"},
        { Current: "NewCodeLine", Next: "Arr", Possible: "n"},
        { Current: "Constant", Next: "UnaryOperator", Possible: "n"},
        { Current: "Constant", Next: "SetUnaryOperator", Possible: "n"},
        { Current: "Constant", Next: "SetOperator", Possible: "n"},
        { Current: "Constant", Next: "Operator", Possible: "y"},
        { Current: "Constant", Next: "NewCodeLine", Possible: "y"},
        { Current: "Constant", Next: "end", Possible: "y"},
        { Current: "Constant", Next: "Comparision", Possible: "y"},
        { Current: "Constant", Next: "CodeCave", Possible: "n"},
        { Current: "Constant", Next: "Assignment", Possible: "n"},
        { Current: "Constant", Next: "Arr", Possible: "n"},
        { Current: "Comparision", Next: "Variable", Possible: "y"},
        { Current: "Comparision", Next: "UnaryOperator", Possible: "y"},
        { Current: "Comparision", Next: "SetUnaryOperator", Possible: "y"},
        { Current: "Comparision", Next: "SetOperator", Possible: "n"},
        { Current: "Comparision", Next: "Operator", Possible: "n"},
        { Current: "Comparision", Next: "NewCodeLine", Possible: "n"},
        { Current: "Comparision", Next: "end", Possible: "n"},
        { Current: "Comparision", Next: "Constant", Possible: "y"},
        { Current: "Comparision", Next: "Comparision", Possible: "n"},
        { Current: "Comparision", Next: "CodeCave", Possible: "y"},
        { Current: "Comparision", Next: "Assignment", Possible: "n"},
        { Current: "Comparision", Next: "Arr", Possible: "n"},
        { Current: "CodeCave", Next: "Variable", Possible: "n"},
        { Current: "CodeCave", Next: "UnaryOperator", Possible: "n"},
        { Current: "CodeCave", Next: "SetUnaryOperator", Possible: "n"},
        { Current: "CodeCave", Next: "SetOperator", Possible: "po"},
        { Current: "CodeCave", Next: "Operator", Possible: "y"},
        { Current: "CodeCave", Next: "NewCodeLine", Possible: "y"},
        { Current: "CodeCave", Next: "end", Possible: "y"},
        { Current: "CodeCave", Next: "Constant", Possible: "n"},
        { Current: "CodeCave", Next: "Comparision", Possible: "y"},
        { Current: "CodeCave", Next: "CodeCave", Possible: "n"},
        { Current: "CodeCave", Next: "Assignment", Possible: "po"},
        { Current: "CodeCave", Next: "Arr", Possible: "n"},
        { Current: "begin", Next: "Variable", Possible: "y"},
        { Current: "begin", Next: "UnaryOperator", Possible: "y"},
        { Current: "begin", Next: "SetUnaryOperator", Possible: "y"},
        { Current: "begin", Next: "SetOperator", Possible: "n"},
        { Current: "begin", Next: "Operator", Possible: "n"},
        { Current: "begin", Next: "NewCodeLine", Possible: "y"},
        { Current: "begin", Next: "Constant", Possible: "y"},
        { Current: "begin", Next: "Comparision", Possible: "n"},
        { Current: "begin", Next: "CodeCave", Possible: "y"},
        { Current: "begin", Next: "Assignment", Possible: "n"},
        { Current: "begin", Next: "Arr", Possible: "n"},
        { Current: "Assignment", Next: "Variable", Possible: "y"},
        { Current: "Assignment", Next: "UnaryOperator", Possible: "y"},
        { Current: "Assignment", Next: "SetUnaryOperator", Possible: "y"},
        { Current: "Assignment", Next: "SetOperator", Possible: "n"},
        { Current: "Assignment", Next: "Operator", Possible: "n"},
        { Current: "Assignment", Next: "NewCodeLine", Possible: "n"},
        { Current: "Assignment", Next: "end", Possible: "n"},
        { Current: "Assignment", Next: "Constant", Possible: "y"},
        { Current: "Assignment", Next: "Comparision", Possible: "n"},
        { Current: "Assignment", Next: "CodeCave", Possible: "y"},
        { Current: "Assignment", Next: "Assignment", Possible: "n"},
        { Current: "Assignment", Next: "Assignment", Possible: "n"},
        { Current: "Assignment", Next: "Arr", Possible: "n"},
        { Current: "Arr", Next: "Variable", Possible: "n"},
        { Current: "Arr", Next: "UnaryOperator", Possible: "n"},
        { Current: "Arr", Next: "SetUnaryOperator", Possible: "n"},
        { Current: "Arr", Next: "SetOperator", Possible: "y"},
        { Current: "Arr", Next: "Operator", Possible: "y"},
        { Current: "Arr", Next: "NewCodeLine", Possible: "y"},
        { Current: "Arr", Next: "end", Possible: "y"},
        { Current: "Arr", Next: "Constant", Possible: "n"},
        { Current: "Arr", Next: "Comparision", Possible: "y"},
        { Current: "Arr", Next: "CodeCave", Possible: "n"},
        { Current: "Arr", Next: "Assignment", Possible: "y"},
        { Current: "Arr", Next: "Arr", Possible: "n"} ];

    function checkRules(value, index, array) {
        var search;
        
        if (index==0) {
            search=language_rules.find(rules => rules.Current === "begin" && rules.Next === value.type);
            if (search===undefined)
                throw new SyntaxError("Combination not found on verifier rules: " + search.Current + " and " + search.Current);
            if (search.Possible==="n")
                throw new SyntaxError("Forbidden combination during rules verification: " + search.Current + " and " + search.Current);
            if (search.Possible==="po" && value.pointer !== "yes")
                throw new SyntaxError("Combination allowed only for pointer operation: " + search.Current + " and " + search.Current);
            if (search.Possible==="npo")
                if (search.Current === "Variable" && value.pointer !== "no")
                    throw new SyntaxError("Combination not allowed for pointer operation: " + search.Current + " and " + search.Next);
                else if (search.Next === "SetUnaryOperator" && array[index+1].pointer !== "no")
                    throw new SyntaxError("Combination not allowed for pointer operation: " + search.Current + " and " + search.Next);
        }

        if (index == array.length-1) {
            search=language_rules.find(rules => rules.Current === value.type && rules.Next === "end");
        } else {
            search=language_rules.find(rules => rules.Current === value.type && rules.Next === array[index+1].type);
        }
        if (search===undefined)
            throw new SyntaxError("Combination not found on verifier rules: " + search.Current + " and " + search.Next);
        if (search.Possible==="n")
            throw new SyntaxError("Forbidden combination during rules verification: " + search.Current + " and " + search.Next);
        if (search.Possible==="po" && value.pointer !== "yes")
            throw new SyntaxError("Combination allowed only for pointer operation: " + search.Current + " and " + search.Next);
        if (search.Possible==="npo")
            if (search.Current === "Variable" && value.pointer !== "no")
                throw new SyntaxError("Combination not allowed for pointer operation: " + search.Current + " and " + search.Next);
            else if (search.Current === "SetUnaryOperator" && array[index+1].pointer !== "no")
                throw new SyntaxError("Combination not allowed for pointer operation: " + search.Current + " and " + search.Next);

        if (search.Current === "UnaryOperator" && value.value === "*" && (search.Next === "Variable" || search.Next === "CodeCave"))
            array[index+1].pointer="yes";

        if (value.type === "CodeCave")
            verify(value.params);
    }

    ast.forEach(checkRules);

    return ast;
}
