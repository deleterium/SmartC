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

// We start by tokenizing our input by declaring a function named tokenizer()
function tokenizer(input) {
  // variable current will be our index counter
  var current = 0;
  // tokens will be holding all the tokens we found in our input
  var tokens = [];

  // some regex for later use
  var NAMES = /\w/;
  var NUMBERS = /[0-9]/;
  var NEWLINE = /\n/;
  var BACKSLASH = /\\/;
  var WHITESPACE = /\s/;

  // now we start looping through each character of our input
  while(current < input.length) {
    var char = input[current];

    /* From here on, we just compare our current character against all the characters
      thet we accept. If there is a match we add 1 to our current variable, push our
      character as a token to our tokens[] array and continue our loop */
    if (char === '=') {
      tokens.push({
        type: 'equal',
        value: '='
      });
      current++;
      continue;
    }

    if (char === '*') {
      tokens.push({
        type: 'star',
        value: '*'
      });
      current++;
      continue;
    }

    if (char === '!') {
      tokens.push({
        type: 'not',
        value: '!'
      });
      current++;
      continue;
    }


    if (char === '[' || char === ']') {
      tokens.push({
        type: 'bracket',
        value: char
      });
      current++;
      continue;
    }

    if (char === '-') {
      tokens.push({
        type: 'minus',
        value: '-'
      });
      current++;
      continue;
    }

    if (char === '+') {
      tokens.push({
        type: 'plus',
        value: '+'
      });
      current++;
      continue;
    }

    if (char === '/') {
      // a single slash
        tokens.push({
          type: 'forwardslash',
          value: '/'
        });
      current++;
      continue;
    }


    if (BACKSLASH.test(char)) {
      tokens.push({
        type: 'backslash',
        value: '\\'
      });
      current++;
      continue;
    }

    if (char === '<') {
      tokens.push({
        type: 'less',
        value: '<'
      });
      current++;
      continue;
    }

    if (char === '>') {
      tokens.push({
        type: 'greater',
        value: '>'
      });
      current++;
      continue;
    }

    if (char === '|') {
        tokens.push({
          type: 'pipe',
          value: '|'
        });
        current++;
        continue;
    }

    if (char === '&') {
      tokens.push({
        type: 'and',
        value: '&'
      });
      current++;
      continue;
    }

    if (char === '%') {
      tokens.push({
        type: 'percent',
        value: '%'
      });
      current++;
      continue;
    }

    if (char === '^') {
      tokens.push({
        type: 'caret',
        value: '^'
      });
      current++;
      continue;
    }

    if (char === ',') {
      tokens.push({
        type: 'comma',
        value: ','
      });
      current++;
      continue;
    }

    if (char === '~') {
      tokens.push({
        type: 'tilde',
        value: '~'
      });
      current++;
      continue;
    }

    if (char === '`') {
      tokens.push({
        type: 'grave',
        value: '`'
      });
      current++;
      continue;
    }

    if (char === '(' || char === ')') {
      tokens.push({
        type: 'paren',
        value: char
      });
      current++;
      continue;
    }

    if(NEWLINE.test(char)) {
        tokens.push({
            type: 'comma',
            value: ',' });
        current++;
        continue;
    }
    if(WHITESPACE.test(char)) {
      current++;
      continue;
    }

    /* If the character is a number, we need to check if the next character is also a number
    in order to push them altogether as 1 number. i.e. if there is 762, we push "762" not "7","6","2" */
    if(NAMES.test(input.charAt(current))) {      //matches [a-zA-Z0-9_]
      let val = '';
      if(NUMBERS.test(input.charAt(current))) {  // matches [0-9]
        if(input[current+2]=='x') {       // matches [0-9]x
          while(NAMES.test(input.charAt(current)) && current<input.length) {
            val += input.charAt(current);
            current++;
          }
          tokens.push({
            type: 'numberHex',
            value: val
          });
          continue;
        } else {                          // matches [0-9]+ but not [0-9]x.*
          while(NAMES.test(input.charAt(current)) && current<input.length) {
            val += input.charAt(current);
            current++;
          }
          tokens.push({
            type: 'numberDec',
            value: val
          });
          continue;
        }
      } else {                            // matches [a-zA-Z_]
        while(NAMES.test(input[current]) && current<input.length) {
          val += input.charAt(current);
          current++;
        }
        tokens.push({
            type: 'variable',
            value: val
          });
        continue;
      }
    }

    /* if the character is a sigle quote or a double quote, we will treat it as a string.
    Until we haven't found the next double quote or single quote, we continue looping.
    When found, then we push the whole value as a string. */
    if(char === '\'') {
      var value = '';
      char = input[++current];

      while(char !== '\''){
        value += char;
        char = input[++current];
      }
      char = input[++current];
      tokens.push({
        type: 'string',
        value: value
      });
      continue;
    }

    if(char === '"') {
      var value = '';
      char = input[++current];

      while(char !== '"'){
        value += char;
        char = input[++current];
      }
      char = input[++current];
      tokens.push({
        type: 'string',
        value: value
      });
      continue;
    }

      /*whatever else, we don't know jack! */
    throw new TypeError('Type Error! Unrecognized Character: ' + char);
  }
  return tokens;
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
