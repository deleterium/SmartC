"use strict";

// Author: Rui Deleterium
// Project: https://github.com/deleterium/BurstAT-Compiler
// License: BSD 3-Clause License

/* **************************** LICENSE ***************************** *
 * This file is heavily based on project CaptCC (BSD 3-Clause) from   *
 *   Arash Tohidi Chafi available at                                  *
 *   https://github.com/Captainarash/CaptCC                           *
 * See full license at the end of file                                *
 * ****************************************************************** */

// Now we start parsing. We define a function named parser which accepts our tokens array.
function parser(tokens) {

  var current = 0;
  var maxlen=tokens.length;

  // Inside it, we define another function called walk() which enables use to do some recursive acrobatics
  function walk() {
    var token = tokens[current];
    
    /* if the the current token type is equal, then we should check all different possibilities
    such as == and = */
    if (token.type === 'equal') {
        current++;
        if (current < maxlen) {
            if (tokens[current].type == 'equal') {
                ++current;
                return { type: 'Comparision', precedence: 6, name: 'EqualTo', value: '==', line: tokens[current-1].line};
            }
        } 
        return { type: 'Assignment', precedence: 9, name: 'Set', value: token.value, line: tokens[current-1].line };
    }
    if (token.type === 'star') {
        current++;
        if (current < maxlen) {
            if (tokens[current].type === 'equal') {
                ++current;
                return { type: 'SetOperator', precedence: 9,value: token.value + "=", line: tokens[current-1].line };
            }
        }
        if (isBinaryOperator(current))
           return {  type: 'Operator', precedence: 3, value: token.value, line: tokens[current-1].line };
        else
            return {  type: 'UnaryOperator', precedence: 2, value: token.value, line: tokens[current-1].line };
    }
    if (token.type === 'not') {
        current++;
        if (current < maxlen) {
            if (tokens[current].type === 'equal') {
                ++current;
                return { type: 'Comparision', precedence: 6, name: 'NotEqualTo', value: token.value + "=", line: tokens[current-1].line };
            }
        }
        return { type: 'UnaryOperator', precedence: 2, name: 'Not', value: token.value, line: tokens[current-1].line };
    }
    if (token.type === 'plus') {
        current++;
        if (current < maxlen) {
            if (tokens[current].type === 'equal') {
                ++current;
                return { type: 'SetOperator', precedence: 9, value: "+=", line: tokens[current-1].line };
            } else if (tokens[current].type === 'plus') {
                ++current;
                return { type: 'SetUnaryOperator', precedence: 2, value: "++", line: tokens[current-1].line };
            }
        }            
        if (isBinaryOperator(current))
            return {  type: 'Operator', precedence: 4, value: token.value, line: tokens[current-1].line };
        else
            return {  type: 'UnaryOperator', precedence: 2, value: token.value, line: tokens[current-1].line };
    }
    if (token.type === 'forwardslash') {
        current++;
        if (current < maxlen)
            if (tokens[current].type === 'equal') {
                ++current;
                return { type: 'SetOperator', precedence: 9, value: token.value + "=", line: tokens[current-1].line };
            }
        return { type: 'Operator', precedence: 3, value: token.value, line: tokens[current-1].line };
    }
    if (token.type === 'tilde') {
        current++;
        return { type: 'UnaryOperator', precedence: 2, value: token.value, line: tokens[current-1].line };
    }
    if (token.type === 'minus') {
        current++;
        if (current < maxlen) {
            if(tokens[current].type === 'minus') {
                current++;
                return { type: 'SetUnaryOperator', precedence: 2, value: "--", line: tokens[current-1].line };
            } else if (tokens[current].type === 'equal') {
                current++;
                return { type: 'SetOperator', precedence: 9, value: "-=", line: tokens[current-1].line };
            }
        }
        if (isBinaryOperator(current))
            return {  type: 'Operator', precedence: 4, value: token.value, line: tokens[current-1].line };
        else
            return {  type: 'UnaryOperator', precedence: 2, value: token.value, line: tokens[current-1].line };
    }
    if (token.type === 'variable') {
        current++;
        if (current < maxlen) {
            if (tokens[current].type === 'colon') {
                current++;
                return { type: 'Keyword', precedence: 11, value: 'label', id: token.value, line: tokens[current-2].line };
            }
        }
        var node = { type: 'Variable', pointer: "no", mod_array: "no", precedence: 0, value: token.value, line: tokens[current-1].line };
       return node;
    }
    if (token.type === 'keyword') {
        current++;
        var node = { type: 'Keyword', precedence: 11, value: token.value, line: tokens[current-1].line };
        if (token.value === "asm") {
            node.asmText = token.asmText;
        }
       return node;
    }
    if (token.type === 'semi') {
        current++;
        return {
          type: 'Terminator',
          value: token.value,
          precedence: 11,
          line: tokens[current-1].line };
    }
    if (token.type === 'comma') {
        current++;
        return {
          type: 'Delimiter',
          value: token.value,
          precedence: 10,
          line: tokens[current-1].line };
    }
    if (token.type === 'colon') {
        current++;
        return {
          type: 'Colon',
          value: token.value
        };
    }
    if (token.type === 'macro') {
        current++;
        return {
          type: 'Macro',
          value: token.value,
          line: token.line };
    }
    if (token.type === 'percent') {
        current++;
        if (current < maxlen) {
            if (tokens[current].type === 'equal') {
                current++;
                return { type: 'SetOperator', precedence: 9, value: "%=" , line: tokens[current-1].line };
            }
        }
        return {  type: 'Operator', precedence: 3, value: token.value, line: tokens[current-1].line };
    }
    if (token.type === 'less') {
        current++;
        if (current < maxlen) {
            if(tokens[current].type === 'equal') {
                current++;
                return {type: "Comparision", precedence: 6, value: "<=", line: tokens[current-1].line };
            }
            if(tokens[current].type === 'less') {
                current++;
                if (current < maxlen) {
                    if(tokens[current].type === 'equal') {
                        current++;
                        return { type: "SetOperator",  precedence: 9, value: "<<=", line: tokens[current-1].line };
                    }
                }
                return { type: 'Operator', precedence: 5, value: "<<", line: tokens[current-1].line };
            }
        }
        return { type: 'Comparision',  precedence: 6, value: "<", line: tokens[current-1].line };
    }
    if (token.type === 'and') {
        current++;
        if (current < maxlen) {
            if(tokens[current].type === 'and') {
                current++;
                return { type: 'Comparision', precedence: 8, value: "&&", line: tokens[current-1].line };
            }
            if(tokens[current].type === 'equal') {
                current++;
                return { type: 'SetOperator', precedence: 9, value: "&=", line: tokens[current-1].line };
            }
        }
        if (isBinaryOperator(current))
            return { type: 'Operator', precedence: 7, value: token.value, line: tokens[current-1].line };
        else
            return { type: 'UnaryOperator', precedence: 2, value: token.value, line: tokens[current-1].line };
    }
    if (token.type === 'pipe') {
        current++;
        if (current < maxlen) {
            if(tokens[current].type === 'pipe') {
                current++;
                return { type: 'Comparision', precedence: 8, value: "||", line: tokens[current-1].line };
            }
            if(tokens[current].type === 'equal') {
                current++;
                return { type: 'SetOperator', precedence: 9, value: "|=", line: tokens[current-1].line };
            }
        }
        return { type: 'Operator', precedence: 7, value: token.value, line: tokens[current-1].line };
    }
    if (token.type === 'greater') {
        current++;
        if (current < maxlen) {
            if(tokens[current].type === 'equal') {
                current++;
                return {type: "Comparision", precedence: 6, value: ">=", line: tokens[current-1].line };
            }
            if(tokens[current].type === 'greater') {
                current++;
                if (current < maxlen) {
                    if(tokens[current].type === 'equal') {
                        current++;
                        return { type: "SetOperator", precedence: 9, value: ">>=", line: tokens[current-1].line };
                    }
                }
                return { type: 'Operator', precedence: 5, value: ">>", line: tokens[current-1].line };
            }
        }
        return { type: 'Comparision', precedence: 6, value: ">", line: tokens[current-1].line };
    }
    if (token.type === 'caret') {
        current++;
        if (current < maxlen) {
            if(tokens[current].type === 'equal') {
                current++;
                return { type: 'SetOperator', precedence: 9, name: 'XorEqual', value: '^=', line: tokens[current-1].line };
            }
        }
        return { type: 'Operator', precedence: 7, name: 'Xor', value: token.value, line: tokens[current-1].line };
    }
    if (token.type === 'numberDec') {
        current++;
        return { type: 'Constant', precedence: 0, name: 'NumberDecimalStr', value: token.value, line: tokens[current-1].line };
    }
    if (token.type === 'numberHex') {
        current++;
        return { type: 'Constant', precedence: 0,name: 'NumberHexStr', value: token.value, line: tokens[current-1].line };
    }
    if (token.type === 'string') {
        current++;
        return { type: 'Constant', precedence: 0, name: 'String', value: token.value, line: tokens[current-1].line };
    }

    /* here we perform some recursive acrobatics. If we encounter an opening bracket, we create a
    new node, call our walk fuction again and push whatever there is inside the bracket,
    inside a child node. When we reach the closing bracket, we stop and push the child node,
    in its parent node */
    if (token.type === 'bracket' && token.value === '[' ) {
        token = tokens[++current];
        var node = { type: 'Arr', precedence: 1, params: [], line: tokens[current-1].line };
        while (    (token.type !== 'bracket')
                || (token.type === 'bracket' && token.value !== ']') ) {
            node.params.push(walk());
            token = tokens[current];
            if (token === undefined) {
                throw new SyntaxError("At end of file. Missing closing ']' for Arr started at line: "+node.line+".");
            }

        }
        current++;
        return node;
    }

    // same as brackets and curly braces but for paranthesis, we call it 'CodeCave'
    if (token.type === 'paren' && token.value === '(' ) {
        token = tokens[++current];
        var node= { type: 'CodeCave', precedence: 1, pointer: "no", mod_array: "no", params: [], line: tokens[current-1].line };
        while (    (token.type !== 'paren')
                || (token.type === 'paren' && token.value !== ')') ) {
            node.params.push(walk());
            token = tokens[current];
            if (token === undefined) {
                throw new SyntaxError("At end of file. Missing closing ')' for CodeCave started at line: "+node.line+".");
            }
        }
        current++;
        return node;
    }

    // same story here. This time we call it a 'CodeDomain'.
    if (token.type === 'curly' &&  token.value === '{' ) {
        token = tokens[++current];
        var node = { type: 'CodeDomain', params: [], line: tokens[current-1].line };
        while (   (token.type !== 'curly')
                || (token.type === 'curly' && token.value !== '}') ) {
            node.params.push(walk());
            token = tokens[current];
            if (token === undefined) {
                throw new SyntaxError("At end of file. Missing closing '}' for CodeDomain started at line: "+node.line+".");
            }
        }
        current++;
        return node;
    }


    //if we don't recognize the token, we throw an error.
    throw new TypeError("At line: "+token.line+". Unknow token found: '"+token.type+"'.");
  }
  
  function isBinaryOperator(position) {
    if (position >= 2 ) {
        if (   tokens[current-2].type ===  'variable'
            || tokens[current-2].type ===  'numberDec'
            || tokens[current-2].type ===  'numberHex'
            || tokens[current-2].type ===  'string'
            || tokens[current-2].value ===  ']'
            || tokens[current-2].value ===  ')' )
            return true;
    }
    if (position >=3) {
        if (( tokens[current-2].type ===  'plus' && tokens[current-3].type ===  'plus')
         || ( tokens[current-2].type ===  'minus' && tokens[current-3].type ===  'minus') )
            return true;
    }
    return false;      
  }

  // we declare this variable named AST, and start our walk() function to parse our tokens.
  let ast = [];

  while (current < tokens.length) {
    ast.push(walk(0));
  }

  return ast;
}

/*

BSD 3-Clause License

Copyright (c) 2017, Arash Tohidi Chafi
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of the copyright holder nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
