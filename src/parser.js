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


    // Input: javascript string (utf-16)
    // Output: string representing same string in hexadecimal utf-8
    function str2long(in_str)
    {
        if ( !(typeof in_str === 'string' || in_str instanceof String) )
            return undefined;

        var byarr = [];
        var ret = "";
        var c,c1, i, j;

        for (i=0; i<in_str.length; i++) {
            c = in_str.charCodeAt(i);

            if (c < 128)
                byarr.push(c);
            else {
                if (c < 2048) {
                    byarr.push(c>>6 | 0xc0);    //ok
                    byarr.push((c & 63) | 128); //ok
                } else {
                    if (c < 55296 || c > 57343) {
                        byarr.push(((c >> 12 ) & 63) | 0xe0); //ok
                        byarr.push(((c >> 6 ) & 63) | 128); //ok
                        byarr.push((c & 63) | 128); //ok
                    } else {
                        i++;
                        c1 = in_str.charCodeAt(i);
                        if ((c & 0xFC00) == 0xd800 && (c1 & 0xFC00) == 0xDC00) {
                            c = ((c & 0x3FF) << 10) + (c1 & 0x3FF) + 0x10000;
                            byarr.push(((c >> 18 ) & 63) | 0xf0); //ok
                            byarr.push(((c >> 12 ) & 63) | 128); //ok
                            byarr.push(((c >> 6 ) & 63) | 128); //ok
                            byarr.push((c & 63) | 128); //ok
                        }
                    }
                }
            }
        }
        for (j=0; j < (Math.floor((byarr.length-1)/8)+1)*8; j++){
            if (j >= byarr.length)
                ret="00"+ret;
            else
                ret=byarr[j].toString(16).padStart(2, '0')+ret;
        }
        return(ret);
    }

    //Decode REED-SALOMON burst address from string to long value
    //Adapted from https://github.com/burst-apps-team/burstkit4j
    function rsDecode(cypher_string) {

        var gexp = [ 1, 2, 4, 8, 16, 5, 10, 20, 13, 26, 17, 7, 14, 28, 29, 31, 27, 19, 3, 6, 12, 24, 21, 15, 30, 25, 23, 11, 22, 9, 18, 1 ];
        var glog = [ 0, 0, 1, 18, 2, 5, 19, 11, 3, 29, 6, 27, 20, 8, 12, 23, 4, 10, 30, 17, 7, 22, 28, 26, 21, 25, 9, 16, 13, 14, 24, 15 ];
        var alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
        var codeword_map = [ 3, 2, 1, 0, 7, 6, 5, 4, 13, 14, 15, 16, 12, 8, 9, 10, 11 ];

        function gmult(a, b) {
            if (a == 0 || b == 0) {
                return 0;
            }
            var idx = (glog[a] + glog[b]) % 31;
            return gexp[idx];
        }

        function is_codeword_valid(codeword) {
            var sum = 0;
            var i, j, t, pos;

            for ( i = 1; i < 5; i++) {
                t = 0;
                for ( j = 0; j < 31; j++) {
                    if (j > 12 && j < 27) {
                        continue;
                    }
                    pos = j;
                    if (j > 26) {
                        pos -= 14;
                    }
                    t ^= gmult(codeword[pos], gexp[(i * j) % 31]);
                }
                sum |= t;
            }

            return sum == 0;
        }

        var codeword_length = 0;
        var codeword = [];
        var i;
        var codework_index;

        for (i=0; i < cypher_string.length; i++ ) {
            var position_in_alphabet = alphabet.indexOf(cypher_string.charAt(i));
            if (position_in_alphabet <= -1) {
                continue;
            }
            codework_index = codeword_map[codeword_length];
            codeword[codework_index] = position_in_alphabet;
            codeword_length++;
        }
        if (codeword_length != 17 || !is_codeword_valid(codeword)) {
            throw new TypeError("Error decoding BURST address: BURST-"+cypher_string);
        }

        //base32 to base10 conversion
        var length = 13;
        var big_val=0n;
        var big_mul=1n;
        for (i = 0; i < length; i++) {
            big_val += big_mul * BigInt(codeword[i]);
            big_mul *= 32n;
        }

        return big_val.toString(16);
    }


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
        return { type: 'Assignment', precedence: 10, name: 'Set', value: token.value, line: tokens[current-1].line };
    }
    if (token.type === 'star') {
        current++;
        if (current < maxlen) {
            if (tokens[current].type === 'equal') {
                ++current;
                return { type: 'SetOperator', precedence: 10,value: token.value + "=", line: tokens[current-1].line };
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
                return { type: 'SetOperator', precedence: 10, value: "+=", line: tokens[current-1].line };
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
                return { type: 'SetOperator', precedence: 10, value: token.value + "=", line: tokens[current-1].line };
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
                return { type: 'SetOperator', precedence: 10, value: "-=", line: tokens[current-1].line };
            } else if (tokens[current].type === 'greater') {
                current++;
                return { type: 'Member', precedence: 0, value: "->", line: tokens[current-1].line };
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
                return { type: 'Keyword', precedence: 12, value: 'label', id: token.value, line: tokens[current-2].line };
            }
        }
        var node = { type: 'Variable', pointer: "no", mod_array: "no", precedence: 0, value: token.value, line: tokens[current-1].line };
       return node;
    }
    if (token.type === 'keyword') {
        current++;
        var node = { type: 'Keyword', precedence: 12, value: token.value, line: tokens[current-1].line };
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
          precedence: 12,
          line: tokens[current-1].line };
    }
    if (token.type === 'comma') {
        current++;
        return {
          type: 'Delimiter',
          value: token.value,
          precedence: 11,
          line: tokens[current-1].line };
    }
    if (token.type === 'colon') {
        current++;
        return {
          type: 'Colon',
          value: token.value
        };
    }
    if (token.type === 'dot') {
        current++;
        return {
          type: 'Member',
          value: token.value,
          precedence: 0,
          line: token.line };
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
                return { type: 'SetOperator', precedence: 10, value: "%=" , line: tokens[current-1].line };
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
                        return { type: "SetOperator",  precedence: 10, value: "<<=", line: tokens[current-1].line };
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
                return { type: 'SetOperator', precedence: 10, value: "&=", line: tokens[current-1].line };
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
                return { type: 'Comparision', precedence: 9, value: "||", line: tokens[current-1].line };
            }
            if(tokens[current].type === 'equal') {
                current++;
                return { type: 'SetOperator', precedence: 10, value: "|=", line: tokens[current-1].line };
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
                        return { type: "SetOperator", precedence: 10, value: ">>=", line: tokens[current-1].line };
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
                return { type: 'SetOperator', precedence: 10, name: 'XorEqual', value: '^=', line: tokens[current-1].line };
            }
        }
        return { type: 'Operator', precedence: 7, name: 'Xor', value: token.value, line: tokens[current-1].line };
    }
    if (token.type === 'numberDec') {
        current++;
        let val = BigInt(token.value).toString(16);
        val = val.padStart((Math.floor((val.length-1)/16)+1)*16, '0');
        return { type: 'Constant', precedence: 0, value: val, line: tokens[current-1].line };
    }
    if (token.type === 'numberHex') {
        current++;
        let val = token.value.replace("0x","").toLowerCase();
        val = val.padStart((Math.floor((val.length-1)/16)+1)*16, '0');
        return { type: 'Constant', precedence: 0, value: val, line: tokens[current-1].line };
    }
    if (token.type === 'string') {
        current++;
        let val;
        if ( token.value.startsWith("BURST-") ) {
            val = rsDecode(token.value.slice(6)).padStart(16, '0');
        } else {
            val = str2long(token.value);
        }
        return { type: 'Constant', precedence: 0, value: val, line: tokens[current-1].line };
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
