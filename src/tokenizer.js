"use strict";

// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
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
  var curr_line = 1;
  // some regex for later use
  var NAMES = /\w/;
  var NUMBERS = /[0-9]/;
  var NEWLINE = /\n/;
  var BACKSLASH = /\\/;
  var WHITESPACE = /\s/;

  var keywords_bd = [
   "asm", "break", "const", "continue", "do", "else", "for", "goto", "if",
   "long", "return", "void", "while", "sleep", "exit", "halt"
   , "struct"
  ];

  var keywords_bd_forbidden = [
    "auto", "double", "float", "register", "volatile"
  ];

  var keywords_bd_not_implemented = [
    "case", "char", "default", "enum", "extern",
    "int", "short", "sizeof", "signed", "static",
    "switch", "typedef", "union", "unsigned"
  ];

  // now we start looping through each character of our input
  while(current < input.length) {
    var char = input[current];

    /* From here on, we just compare our current character against all the characters
      thet we accept. If there is a match we add 1 to our current variable, push our
      character as a token to our tokens[] array and continue our loop */
    if (char === '=') {
      tokens.push({
        type: 'equal',
        value: '=',
        line: curr_line
      });
      current++;
      continue;
    }

    if (char === '*') {
      tokens.push({
        type: 'star',
        value: '*',
        line: curr_line
      });
      current++;
      continue;
    }

    if (char === '!') {
      tokens.push({
        type: 'not',
        value: '!',
        line: curr_line
      });
      current++;
      continue;
    }


    if (char === '[' || char === ']') {
      tokens.push({
        type: 'bracket',
        value: char,
        line: curr_line
      });
      current++;
      continue;
    }

    if (char === '-') {
      tokens.push({
        type: 'minus',
        value: '-',
        line: curr_line
      });
      current++;
      continue;
    }

    if (char === '+') {
      tokens.push({
        type: 'plus',
        value: '+',
        line: curr_line
      });
      current++;
      continue;
    }

    if (char === '/') {
      current++;
      // 1) one-line comments
      if (input.charAt(current) === '/') {
        while (current < input.length && !NEWLINE.test(input[current])) {
          current++;
        }
      }
      // 2) multiline comments
      else if (input.charAt(current) === '*') {
        current++;
        while (true) {
          if (input.charAt(current) === '*' && input.charAt(current+1) === '/') {
            current+=2;
            break;
          }
          if (input.charAt(current) === '') {
            throw new TypeError('At line: '+curr_line+". Missing multiline comment '*/' end token.");
          }
          if ( NEWLINE.test(input[current]) ) {
            curr_line++;
          }
          current++;
        }
      }
      // a single slash
      else {
        tokens.push({
          type: 'forwardslash',
          value: '/',
          line: curr_line
        });
      }
      continue;
    }

    if (BACKSLASH.test(char)) {
      tokens.push({
        type: 'backslash',
        value: '\\',
        line: curr_line
      });
      current++;
      continue;
    }

    if (char === '.') {
      tokens.push({
        type: 'dot',
        value: '.',
        line: curr_line
      });
      current++;
      continue;
    }

    if (char === '<') {
      tokens.push({
        type: 'less',
        value: '<',
        line: curr_line
      });
      current++;
      continue;
    }

    if (char === '>') {
      tokens.push({
        type: 'greater',
        value: '>',
        line: curr_line
      });
      current++;
      continue;
    }

    if (char === '|') {
      tokens.push({
        type: 'pipe',
        value: '|',
        line: curr_line
      });
      current++;
      continue;
    }

    if (char === '&') {
      tokens.push({
        type: 'and',
        value: '&',
        line: curr_line
      });
      current++;
      continue;
    }

    if (char === '%') {
      tokens.push({
        type: 'percent',
        value: '%',
        line: curr_line
      });
      current++;
      continue;
    }

    if (char === '^') {
      tokens.push({
        type: 'caret',
        value: '^',
        line: curr_line
      });
      current++;
      continue;
    }

    if (char === ',') {
      tokens.push({
        type: 'comma',
        value: ',',
        line: curr_line
      });
      current++;
      continue;
    }

    if (char === ';') {
      tokens.push({
        type: 'semi',
        value: ';',
        line: curr_line
      });
      current++;
      continue;
    }

    if (char === '~') {
      tokens.push({
        type: 'tilde',
        value: '~',
        line: curr_line
      });
      current++;
      continue;
    }

    if (char === '`') {
      tokens.push({
        type: 'grave',
        value: '`',
        line: curr_line
      });
      current++;
      continue;
    }

    if (char === '(' || char === ')') {
      tokens.push({
        type: 'paren',
        value: char,
        line: curr_line
      });
      current++;
      continue;
    }

    if (char === ':') {
      tokens.push({
        type: 'colon',
        value: ':'
      });
      current++;
      continue;
    }

    if (char === '#') {
      current++;
      var val = "";
      while (current < input.length && !NEWLINE.test(input[current])) {
          val+=input[current];
          current++;
      }
      tokens.push({
        type: 'macro',
        value: val,
        line: curr_line
      });
      continue;
    }

    if (char === '{' || char === '}') {
      tokens.push({
        type: 'curly',
        value: char,
        line: curr_line
      });
      current++;
      continue;
    }

    if(NEWLINE.test(char)) {
      current++;
      curr_line++;
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
        if(input.charAt(current+1)=='x') {       // matches [0-9]x
          while(NAMES.test(input.charAt(current)) && current<input.length) {
            val += input.charAt(current);
            current++;
          }
          tokens.push({
            type: 'numberHex',
            value: val,
            line: curr_line
          });
          continue;
        } else {                          // matches [0-9]+ but not [0-9]x.*
          while(NAMES.test(input.charAt(current)) && current<input.length) {
            val += input.charAt(current);
            current++;
          }
          tokens.push({
            type: 'numberDec',
            value: val,
            line: curr_line
          });
          continue;
        }
      } else {                            // matches [a-zA-Z_]
        while(NAMES.test(input[current]) && current<input.length) {
          val += input.charAt(current);
          current++;
        }
        
        let search=keywords_bd.find(word => word === val);
        if (search!==undefined) {
          if (val === "asm") {          // matches asm keyword (must be treated in this step)
            let started=false;
            let asmCode="";
            while(input.charAt(current) !== '}') {

              if (input.charAt(current) === '') {
                throw new TypeError("At end of file. Missing closing curly '}'.")
              }
              if (input.charAt(current) === '{') {
                started=true;
                asmCode = "";
                current++;
                continue;
              }
              if(NEWLINE.test(input.charAt(current))) {
                asmCode+=input.charAt(current);
                current++;
                curr_line++;
                continue;
              }
              if(WHITESPACE.test(input.charAt(current))) {
                asmCode+=input.charAt(current);
                current++;
                continue;
              }
              if (started===false)
                throw new TypeError("At line: "+curr_line+". Expected '{' but found '"+ input.charAt(current) +"'.")
              asmCode+=input.charAt(current);
              current++;
            }

            tokens.push({
              type: 'keyword',
              value: val,
              line: curr_line,
              asmText: asmCode
            });
            current++;
            continue;
          }
          tokens.push({
            type: 'keyword',
            value: val,
            line: curr_line
          });
          continue;
        }

        search=keywords_bd_forbidden.find(word => word === val);
        if (search!==undefined) {
          throw new TypeError('At line:'+curr_line+". Keyword "+val+" can not be used in SmartC");
        }

        search=keywords_bd_not_implemented.find(word => word === val);
        if (search!==undefined) {
          throw new TypeError('At line:'+curr_line+". Keyword "+val+" was not implemented");
        }

        tokens.push({
          type: 'variable',
          value: val,
          line: curr_line
        });
        continue;
      }
    }

    /* if the character is a sigle quote or a double quote, we will treat it as a string.
    Until we haven't found the next double quote or single quote, we continue looping.
    When found, then we push the whole value as a string. */
    if(char === '\'' || char === '"') {
      var quote = char;
      var value = '';
      char = input[++current];

      while(char !== quote){
        value += char;
        char = input.charAt(++current);
        if (char === ''){
          throw new TypeError('At end of file. Missing ending quote for string.');
        }
      }
      char = input[++current];
      tokens.push({
        type: 'string',
        value: value,
        line: curr_line
      });
      continue;
    }

      /*whatever else, we don't know jack! */
    throw new TypeError("At line:"+curr_line+". Unrecognized Character: " + char);
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
