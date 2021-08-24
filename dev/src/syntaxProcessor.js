"use strict";
// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License
/**
 * Traverse Program transforming some sentences properties from arrays of
 * tokens into an actually abstract syntax tree. Check operators
 * precedence and let operations in correct order for assembler.
 * This is parser third and final pass.
 * @param Program to be processed
 * @returns Program processed
 * @throws {TypeError|SyntaxError} on any mistake.
 */
// eslint-disable-next-line no-unused-vars
function syntaxProcess(Program) {
    /**
     * Traverse an array of tokens to create a real AST based on
     * simple operations. Only unary or binary operations permitted here
     * and the tree will always end in a END NODE.
     * Uses precedence values to decide the operations order.
     */
    function createSyntacticTree(tokenArray) {
        if (tokenArray === undefined) {
            throw new SyntaxError('Undefined AST to create syntactic tree');
        }
        if (tokenArray.length === 0) {
            return { type: 'endASN' };
        }
        // precedente evaluation loop
        let currentIdx = 0;
        let end = false;
        for (let precedenceHeight = 12; precedenceHeight > 1 && end === false; precedenceHeight--) {
            if (precedenceHeight === 12 || precedenceHeight === 10 || precedenceHeight === 2) {
                // Right to left associativity for
                // 12) Terminator, semi, keywords
                // 10) Assignment operators
                //  2) Unary operators
                for (currentIdx = 0; currentIdx < tokenArray.length; currentIdx++) {
                    if (tokenArray[currentIdx].precedence === precedenceHeight) {
                        end = true;
                        break;
                    }
                }
            }
            else {
                // Left to right associativity for others
                for (currentIdx = tokenArray.length - 1; currentIdx > 0; currentIdx--) {
                    if (tokenArray[currentIdx].precedence === precedenceHeight) {
                        end = true;
                        break;
                    }
                }
            }
        }
        if (end === false) {
            // he have only precedente <= 1: variable, constant, codecave, array, codedomain, member)
            if (tokenArray[0].type === 'Variable') {
                if (tokenArray.length === 1) {
                    return { type: 'endASN', Token: tokenArray[0] };
                }
                const Node = tokenArray[0];
                Node.variableModifier = [];
                for (currentIdx = 1; currentIdx < tokenArray.length; currentIdx++) {
                    if (tokenArray[currentIdx].type === 'Arr') {
                        Node.variableModifier.push({
                            type: 'Arr',
                            content: createSyntacticTree(tokenArray[currentIdx].params)
                        });
                    }
                    else if (tokenArray[currentIdx].type === 'Member') {
                        Node.variableModifier.push({
                            type: `Member${tokenArray[currentIdx].value}`,
                            content: tokenArray[currentIdx + 1]
                        });
                        currentIdx++;
                    }
                    else if (tokenArray[currentIdx].type === 'Variable') {
                        Node.variableModifier.push({
                            type: 'Variable',
                            content: tokenArray[currentIdx]
                        });
                    }
                    else {
                        throw new TypeError(`At line: ${tokenArray[currentIdx].line}. Invalid type of variable modifier: '${tokenArray[currentIdx].type}'.`);
                    }
                }
                return { type: 'endASN', Token: Node };
            }
            if (tokenArray[0].type === 'Constant') {
                if (tokenArray.length === 1) {
                    return { type: 'endASN', Token: tokenArray[0] };
                }
            }
            if (tokenArray[0].type === 'Keyword') {
                if (tokenArray.length === 1) {
                    return { type: 'endASN', Token: tokenArray[0] };
                }
                else {
                    return {
                        type: 'binaryASN',
                        Left: { type: 'endASN', Token: tokenArray[0] },
                        Operation: tokenArray[0],
                        Right: createSyntacticTree(tokenArray.slice(1))
                    };
                }
            }
            if (tokenArray[0].type === 'CodeCave' || tokenArray[0].type === 'CodeDomain') {
                if (tokenArray.length === 1 && tokenArray[0].params !== undefined) {
                    return createSyntacticTree(tokenArray[0].params);
                }
                // if (tokenArray.length > 1) {
                throw new SyntaxError(`At line: ${tokenArray[0].line}. Modifiers for ${tokenArray[0].type} not implemented.`);
            }
            if (tokenArray[0].type === 'Function' && tokenArray.length === 2) {
                if (tokenArray[1].type === 'CodeCave' && tokenArray[1].params !== undefined) {
                    return {
                        type: 'binaryASN',
                        Left: { type: 'endASN', Token: tokenArray[0] },
                        Operation: tokenArray[0],
                        Right: createSyntacticTree(tokenArray[1].params)
                    };
                }
            }
            throw new SyntaxError(`At line: ${tokenArray[0].line}. Unknown token sequence: '${tokenArray[0].type}' with value: '${tokenArray[0].value}'.`);
            // Here we start to process operations tokens (precedente >= 2)
        }
        else if (tokenArray[currentIdx].type === 'Operator' ||
            tokenArray[currentIdx].type === 'Assignment' ||
            tokenArray[currentIdx].type === 'SetOperator' ||
            tokenArray[currentIdx].type === 'Comparision' ||
            tokenArray[currentIdx].type === 'Delimiter') {
            return {
                type: 'binaryASN',
                Left: createSyntacticTree(tokenArray.slice(0, currentIdx)),
                Operation: tokenArray[currentIdx],
                Right: createSyntacticTree(tokenArray.slice(currentIdx + 1))
            };
        }
        else if (tokenArray[currentIdx].type === 'Keyword') {
            if (tokenArray.length === 1) {
                return { type: 'endASN', Token: tokenArray[0] };
            }
            if (currentIdx !== 0) {
                throw new SyntaxError(`At line: ${tokenArray[0].line}. Sentence not starting with keyword... Missing ';'?`);
            }
            return {
                type: 'binaryASN',
                Left: createSyntacticTree(tokenArray.slice(0, currentIdx + 1)),
                Operation: tokenArray[currentIdx],
                Right: createSyntacticTree(tokenArray.slice(currentIdx + 1))
            };
        }
        else if (tokenArray[currentIdx].type === 'UnaryOperator' && currentIdx === 0) {
            if (tokenArray[currentIdx].value === '*' && tokenArray.length > currentIdx) {
                if (tokenArray[currentIdx + 1].type !== 'Variable' && tokenArray[currentIdx + 1].type !== 'CodeCave') {
                    throw new SyntaxError(`At line: ${tokenArray[currentIdx + 1].line}. Invalid lvalue for pointer operation. Can not have type '${tokenArray[currentIdx + 1].type}'.`);
                }
            }
            return {
                type: 'unaryASN',
                Center: createSyntacticTree(tokenArray.slice(currentIdx + 1)),
                Operation: tokenArray[currentIdx]
            };
        }
        else if (tokenArray[0].type === 'SetUnaryOperator' && tokenArray[1].type === 'Variable') {
            for (let j = 1; j < tokenArray.length; j++) {
                if (tokenArray[j].type === 'Variable' || tokenArray[j].type === 'Member') {
                    continue;
                }
                throw new SyntaxError('At line: ' + tokenArray[0].line + ". Can not use 'SetUnaryOperator' with types  '" + tokenArray[j].type + "'.");
            }
            return {
                type: 'exceptionASN',
                Left: createSyntacticTree(tokenArray.slice(1)),
                Operation: tokenArray[0]
            };
        }
        else if (tokenArray[0].type === 'Variable' && tokenArray[tokenArray.length - 1].type === 'SetUnaryOperator') {
            // Process exceptions for post increment and post decrement (left-to-right associativity)
            for (let j = 1; j < tokenArray.length - 1; j++) {
                if (tokenArray[j].type === 'Variable' || tokenArray[j].type === 'Member') {
                    continue;
                }
                throw new SyntaxError('At line: ' + tokenArray[0].line + ". Can not use 'SetUnaryOperator' with types  '" + tokenArray[j].type + "'.");
            }
            return {
                type: 'exceptionASN',
                Right: createSyntacticTree(tokenArray.slice(0, tokenArray.length - 1)),
                Operation: tokenArray[tokenArray.length - 1]
            };
        }
        throw new SyntaxError('At line: ' + tokenArray[0].line + ". Token '" + tokenArray[0].type + "' with value '" + tokenArray[0].value + "' does not match any syntax rules.");
    }
    // Process recursively one Sentence object, creating an OpTree object that was
    //   processed sintacticly.
    function processSentence(SentenceObj) {
        switch (SentenceObj.type) {
            case 'phrase':
                if (SentenceObj.code === undefined) {
                    throw new TypeError('Unknow object arrived at processSentence');
                }
                SentenceObj.OpTree = createSyntacticTree(SentenceObj.code);
                delete SentenceObj.code;
                break;
            case 'ifElse':
                SentenceObj.falseBlock.forEach(processSentence);
            // eslint-disable-next-line no-fallthrough
            case 'ifEndif':
            case 'while':
            case 'do':
                if (SentenceObj.condition === undefined) {
                    throw new TypeError(`At line ${SentenceObj.line}.Unknow object arrived at processSentence`);
                }
                if (SentenceObj.condition.length === 0) {
                    throw new SyntaxError(`At line ${SentenceObj.line}. Sentence condition can not be empty`);
                }
                SentenceObj.ConditionOpTree = createSyntacticTree(SentenceObj.condition);
                delete SentenceObj.condition;
                SentenceObj.trueBlock.forEach(processSentence);
                break;
            case 'for':
                SentenceObj.threeSentences.forEach(processSentence);
                SentenceObj.trueBlock.forEach(processSentence);
                break;
            case 'struct':
                processSentence(SentenceObj.Phrase);
                break;
        }
    }
    /* * * Main function! * * */
    if (Program === undefined || Program.Global.sentences === undefined) {
        throw new TypeError('Undefined AST arrived at syntax()');
    }
    Program.Global.sentences.forEach(processSentence);
    Program.functions.forEach(CurrentFunction => {
        if (CurrentFunction.sentences === undefined) {
            throw new TypeError('Undefined AST arrived at syntax()');
        }
        CurrentFunction.sentences.forEach(processSentence);
    });
    return Program;
}
