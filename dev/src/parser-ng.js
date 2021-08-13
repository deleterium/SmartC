"use strict";

// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

function parser(tokens) {

    //stores current id for processing tokens
    var mainLoopIndex = 0;

    // This object stores a recipe to transform one or more element tokens into one
    //   functional token. All non-recursive items are here. The order they are
    //   arrange are important to decide in cases where same element token can be
    //   more than one functional token depending the other tokens after it.
    // Recursive tokens will be treated on getNextToken() function.
    const not_recursive_tokens_specs = [

        //single-tokens easy
        {
            sequence: [ 'tilde' ],
            action: function (tokenID) {
                return  { type: 'UnaryOperator',precedence:  2, value: "~", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'semi' ],
            action: function (tokenID) {
                return  { type: 'Terminator',   precedence: 12, value: ";",  line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'comma' ],
            action: function (tokenID) {
                return  { type: 'Delimiter',    precedence: 11, value: ",", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'colon' ],
            action: function (tokenID) {
                return  { type: 'Colon',        precedence:  0, value: ":", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'dot' ],
            action: function (tokenID) {
                return  { type: 'Member',       precedence:  0, value: ".",  line: tokens[tokenID].line }
            }
        },

        //single-tokens medium
        {
            sequence: [ 'macro' ],
            action: function (tokenID) {
                return  { type: 'Macro',        precedence:  0, value: tokens[tokenID].value, line: tokens[tokenID].line }
            }
        },

        //single-tokens hard
        {
            sequence: [ 'keyword' ],
            action: function (tokenID) {
                let node = { type: 'Keyword', precedence: 12, value:  tokens[tokenID].value, line: tokens[tokenID].line };
                if (tokens[tokenID].value === "asm") {
                    node.asmText = tokens[tokenID].asmText;
                }
                return node;
            }
        },
        {
            sequence: [ 'numberDec' ],
            action: function (tokenID) {
                let tkn = tokens[tokenID]
                let val = BigInt(tkn.value.replace(/_/g,"")).toString(16)
                val = val.padStart((Math.floor((val.length-1)/16)+1)*16, '0')
                return { type: 'Constant', precedence: 0, value: val, line: tkn.line }
            }
        },
        {
            sequence: [ 'numberHex' ],
            action: function (tokenID) {
                let tkn = tokens[tokenID]
                let val = tkn.value.replace(/_/g,"").toLowerCase();
                val = val.padStart((Math.floor((val.length-1)/16)+1)*16, '0');
                return { type: 'Constant', precedence: 0, value: val, line: tkn.line };
            }
        },
        {
            sequence: [ 'string' ],
            action: function (tokenID) {
                let val;
                let tkn = tokens[tokenID]
                let parts = /^(BURST\-|S\-|TS\-)([2-9A-HJ-NP-Z]{4}\-[2-9A-HJ-NP-Z]{4}\-[2-9A-HJ-NP-Z]{4}\-[2-9A-HJ-NP-Z]{5})/.exec(tkn.value)
                if ( parts !== null ) {
                    val = rsDecode(parts[2]);
                } else {
                    val = str2long(tkn.value);
                }
                return { type: 'Constant', precedence: 0, value: val, line: tkn.line };
            }
        },

        //multi-tokens easy
        {
            sequence: [ 'equal', 'equal' ],
            action: function (tokenID) {
                return  { type: 'Comparision',  precedence:  6, value: '==', line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'equal' ],
            action: function (tokenID) {
                return  { type: 'Assignment',   precedence: 10, value: '=', line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'not', 'equal' ],
            action: function (tokenID) {
                return  { type: 'Comparision',  precedence:  6, value: "!=", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'not' ],
            action: function (tokenID) {
                return  { type: 'UnaryOperator',precedence:  2, value: "!", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'forwardslash', 'equal' ],
            action: function (tokenID) {
                return  { type: 'SetOperator',  precedence: 10, value: "/=", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'forwardslash' ],
            action: function (tokenID) {
                return  { type: 'Operator',     precedence:  3, value: "/", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'percent', 'equal' ],
            action: function (tokenID) {
                return  { type: 'SetOperator',  precedence: 10, value: "%=" , line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'percent' ],
            action: function (tokenID) {
                return  { type: 'Operator',     precedence:  3, value: "%", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'less', 'less', 'equal' ],
            action: function (tokenID) {
                return  { type: "SetOperator",  precedence: 10, value: "<<=", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'less', 'less' ],
            action: function (tokenID) {
                return  { type: 'Operator',     precedence:  5, value: "<<", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'less', 'equal' ],
            action: function (tokenID) {
                return  { type: "Comparision",  precedence:  6, value: "<=", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'less' ],
            action: function (tokenID) {
                return  { type: 'Comparision',  precedence:  6, value: "<", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'pipe', 'pipe' ],
            action: function (tokenID) {
                return  { type: 'Comparision',  precedence:  9, value: "||", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'pipe', 'equal' ],
            action: function (tokenID) {
                return  { type: 'SetOperator',  precedence: 10, value: "|=", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'pipe' ],
            action: function (tokenID) {
                return  { type: 'Operator',     precedence:  7, value: "|", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'greater', 'equal' ],
            action: function (tokenID) {
                return  {type: "Comparision",   precedence:  6, value: ">=", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'greater', 'greater', 'equal' ],
            action: function (tokenID) {
                return  { type: "SetOperator",  precedence: 10, value: ">>=", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'greater', 'greater'],
            action: function (tokenID) {
                return  { type: 'Operator',     precedence:  5, value: ">>", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'greater' ],
            action: function (tokenID) {
                return  { type: 'Comparision',  precedence:  6, value: ">", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'caret', 'equal' ],
            action: function (tokenID) {
                return  { type: 'SetOperator',  precedence: 10, value: "^=", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'caret' ],
            action: function (tokenID) {
                return  { type: 'Operator',     precedence:  7, value: "^", line: tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'variable', 'colon' ],
            action: function (tokenID) {
                return { type: 'Keyword',       precedence: 12, value: "label", id: tokens[tokenID].value, line: tokens[tokenID].line };
            }
        },
        {
            sequence: [ 'variable' ],
            action: function (tokenID) {
                return  { type: 'Variable',     precedence:  0, value: tokens[tokenID].value, pointer: "no", mod_array: "no", line: tokens[tokenID].line }
            }
        },

        //multi-tokens medium
        {
            sequence: [ 'star', 'equal'],
            action: function (tokenID) {
                return { type: 'SetOperator',   precedence: 10, value: "*=", line:tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'star' ],
            action: function (tokenID) {
                if (isBinaryOperator(tokenID))
                    return {  type: 'Operator',      precedence: 3, value: "*", line:tokens[tokenID].line }
                else
                    return {  type: 'UnaryOperator', precedence: 2, value: "*", line:tokens[tokenID].line };
            }
        },
        {
            sequence: [ 'plus', 'equal'],
            action: function (tokenID) {
                return { type: 'SetOperator',   precedence: 10, value: "+=", line:tokens[tokenID].line };
            }
        },
        {
            sequence: [ 'plus', 'plus' ],
            action: function (tokenID) {
                return { type: 'SetUnaryOperator', precedence: 2, value: "++", line:tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'plus' ],
            action: function (tokenID) {
                if (isBinaryOperator(tokenID))
                    return {  type: 'Operator',      precedence: 4, value: "+", line:tokens[tokenID].line };
                else
                    return {  type: 'UnaryOperator', precedence: 2, value: "+", line:tokens[tokenID].line };
            }
        },
        {
            sequence: [ 'minus', 'minus' ],
            action: function (tokenID) {
                return { type: 'SetUnaryOperator', precedence: 2, value: "--", line:tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'minus', 'equal' ],
            action: function (tokenID) {
                return { type: 'SetOperator',   precedence: 10, value: "-=", line:tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'minus', 'greater' ],
            action: function (tokenID) {
                return { type: 'Member',        precedence: 0, value: "->", line:tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'minus' ],
            action: function (tokenID) {
                if (isBinaryOperator(tokenID))
                    return {  type: 'Operator',      precedence: 4, value: "-", line:tokens[tokenID].line }
                else
                    return {  type: 'UnaryOperator', precedence: 2, value: "-", line:tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'and', 'and' ],
            action: function (tokenID) {
                return { type: 'Comparision',   precedence:  8, value: "&&", line:tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'and', 'equal' ],
            action: function (tokenID) {
                return { type: 'SetOperator',   precedence: 10, value: "&=", line:tokens[tokenID].line }
            }
        },
        {
            sequence: [ 'and' ],
            action: function (tokenID) {
                if (isBinaryOperator(tokenID))
                    return { type: 'Operator',      precedence: 7, value: "&", line:tokens[tokenID].line }
                else
                    return { type: 'UnaryOperator', precedence: 2, value: "&", line:tokens[tokenID].line }
            }
        },

    ];

    //main function, runs only once
    function parser_main() {
        let ast = [];

        while (mainLoopIndex < tokens.length) {
            ast.push(getNextToken());
        }

        return ast;
    }

    // Process element tokens started at position mainLoopIndex (outer scope) and returns a functional token
    function getNextToken() {

        let tkn = tokens[mainLoopIndex]
        let auxObj

        //take care of not recursive tokens
        let found = not_recursive_tokens_specs.find(matchRule)
        if (found !== undefined) {
            auxObj = found.action(mainLoopIndex)
            mainLoopIndex += found.sequence.length
            return auxObj
        }

        //take care of recursive tokens
        switch (tkn.value) {
            case ']':
            case ')':
            case '}':
                throw new SyntaxError("At line: "+tkn.line+". Unmatched closing '"+tkn.value+"'.")

            case '[':
                auxObj = { type: 'Arr', precedence: 1, params: [], line: tkn.line }
                mainLoopIndex++
                while ( tokens[mainLoopIndex].value !== ']') {
                    auxObj.params.push(getNextToken())
                    //getNextToken will increase mainLoopIndex for loop
                    if (tokens[mainLoopIndex] === undefined) {
                            throw new SyntaxError("At end of file. Missing closing ']' for Arr started at line: "+auxObj.line+".")
                    }
                }
                //discard closing bracket
                mainLoopIndex++
                return auxObj

            case '(':
                auxObj = { type: 'CodeCave', precedence: 1, pointer: "no", mod_array: "no", params: [], line: tkn.line }
                mainLoopIndex++
                while ( tokens[mainLoopIndex].value !== ')') {
                    auxObj.params.push(getNextToken())
                    //getNextToken will increase mainLoopIndex for loop
                    if (tokens[mainLoopIndex] === undefined) {
                        throw new SyntaxError("At end of file. Missing closing ')' for CodeCave started at line: "+auxObj.line+".")
                    }
                }
                mainLoopIndex++
                return auxObj

            case '{':
                auxObj = { type: 'CodeDomain', params: [], line: tkn.line }
                mainLoopIndex++
                while (  tokens[mainLoopIndex].value !== '}' ) {
                    auxObj.params.push(getNextToken())
                    //getNextToken will increase mainLoopIndex for loop
                    if (tokens[mainLoopIndex] === undefined) {
                        throw new SyntaxError("At end of file. Missing closing '}' for CodeDomain started at line: "+auxObj.line+".")
                    }
                }
                mainLoopIndex++
                return auxObj
            default:
                throw new TypeError("At line: "+tkn.line+". Unknow token found: type: '"+tkn.type+"' value: '"+tkn.value+"'.")
        }
    }

    function matchRule(ruleN) {
        for (let i=0; i < ruleN.sequence.length; i++) {
            if (tokens[mainLoopIndex+i].type == ruleN.sequence[i])
                continue
            return false //proceed to next rule
        }
        return true //all sequence matched!
    }

    //Use to detect if a token at some position is Binary or Unary
    function isBinaryOperator(position) {
        if (position >= 1 ) {
            if (   tokens[position-1].type ===  'variable'
                || tokens[position-1].type ===  'numberDec'
                || tokens[position-1].type ===  'numberHex'
                || tokens[position-1].type ===  'string'
                || tokens[position-1].value ===  ']'
                || tokens[position-1].value ===  ')' )
                return true;
        }
        if (position >=2) {
            if (   ( tokens[position-1].type ===  'plus'  && tokens[position-2].type ===  'plus' )
                || ( tokens[position-1].type ===  'minus' && tokens[position-2].type ===  'minus') )
                return true;
        }
        return false;
    }

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

        //fixes a='S-D3HS-T6ML-SJHU-2R5R2';
        return big_val.toString(16).padStart(16,"0");
    }

    return parser_main();
}
