"use strict";

// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

/*
    keywords_forbidden
        "auto", "double", "float", "register", "volatile"
    keywords_not_implemented
        "case", "char", "default", "enum", "extern",
        "int", "short", "sizeof", "signed", "static",
        "switch", "typedef", "union", "unsigned"
*/

function tokenizer(input) {
    const single_tokens_specs = [
        { char: '=', tokenType: 'equal' },
        { char: '*', tokenType: 'star' },
        { char: '!', tokenType: 'not' },
        { char: '[', tokenType: 'bracket' },
        { char: ']', tokenType: 'bracket' },
        { char: '-', tokenType: 'minus' },
        { char: '+', tokenType: 'plus' },
        { char: '\\', tokenType: 'backslash' },
        { char: '/', tokenType: 'forwardslash' },
        { char: '.', tokenType: 'dot' },
        { char: '<', tokenType: 'less' },
        { char: '>', tokenType: 'greater' },
        { char: '|', tokenType: 'pipe' },
        { char: '&', tokenType: 'and' },
        { char: '%', tokenType: 'percent' },
        { char: '^', tokenType: 'caret' },
        { char: ',', tokenType: 'comma' },
        { char: ';', tokenType: 'semi' },
        { char: '~', tokenType: 'tilde' },
        { char: '`', tokenType: 'grave' },
        { char: '(', tokenType: 'paren' },
        { char: ')', tokenType: 'paren' },
        { char: ':', tokenType: 'colon' },
        { char: '{', tokenType: 'curly' },
        { char: '}', tokenType: 'curly' },
        { char: '#', tokenType: 'SPECIAL' },
    ];

    const regex_single_tokens_specs = [
        {   //comment single line
            start:     /^(\/\/.*)/,
            tokenType: null,
            addLength: 0,
        },
        {   //spaces, tabs, newlines
            start:     /^([\s\t\n]+)/,
            tokenType: null,
            addLength: 0,
        },
        {   //decimal numbers
            start:     /^(\d[\d_]*\b)/,
            tokenType: "numberDec",
            addLength: 0,
        },
        {   //hexadecimal numbers
            start:     /^0[xX]([\da-fA-F][\da-fA-F_]*\b)/,
            tokenType: "numberHex",
            addLength: 2,
        },
        {   //regular keywords
            start:     /^(break|const|continue|do|else|exit|for|goto|halt|if|long|return|sleep|struct|void|while)/,
            tokenType: "keyword",
            addLength: 0,
        },
        {   //exception
            start:     /^(asm)/,
            tokenType: "SPECIAL",
            addLength: 0,
        },
        {   //names for variables (or functions)
            start:     /^(\w+)/,
            tokenType: "variable",
            addLength: 0,
        },
    ];

    const regex_double_tokens_specs = [
        {   //multi line comments
            start: /^\/\*/,
            end:   /([\s\S]*?\*\/)/,
            tokenType: null,
            startLength: 2,
            removeTrailing: 0,
            errormsg: "Missing '*/' to end comment section.",
        },
        {   //strings surrounded by double quotes
            start: /^\"/,
            end:   /([\s\S]*?\")/,
            tokenType: "string",
            startLength: 1,
            removeTrailing: 1,
            errormsg: "Missing '\"' to end string.",
        },
        {   //strings surrounded by single quotes
            start: /^\'/,
            end: /([\s\S]*?\')/,
            tokenType: "string",
            startLength: 1,
            removeTrailing: 1,
            errormsg: "Missing \"'\" to end string.",
        },
    ];

    var currChar, search, remaining_text;
    var endParts, startParts, val, lines, found;
    var i;

    var current = 0;
    var tokens = [];
    var curr_line = 1;

    while(current < input.length) {
        currChar = input.charAt(current);
        remaining_text=input.slice(current);

        // Resolve double regex tokens
        found = regex_double_tokens_specs.find( function (ruleN) {
            startParts=ruleN.start.exec(remaining_text);
            if (startParts != null) {
                endParts = ruleN.end.exec(remaining_text.slice(ruleN.startLength));
                current += ruleN.startLength;
                if (endParts !== null) {
                    if (ruleN.tokenType === null) {
                        curr_line += (endParts[1].match(/\n/g) || '').length;
                        current+=endParts[1].length;
                        return true;//break
                    }
                    tokens.push({ type: ruleN.tokenType, value: endParts[1].slice(0,-ruleN.removeTrailing), line: curr_line });
                    curr_line += (endParts[1].match(/\n/g) || '').length;
                    current+=endParts[1].length;
                    return true;//break
                }
                throw new TypeError('At line:'+curr_line+". "+ruleN.errormsg);
            }
            return false;
        });
        if (found !== undefined) {
            continue;
        }

        // Resolve single regex tokens
        found = regex_single_tokens_specs.find( function (ruleN) {
            startParts=ruleN.start.exec(remaining_text);
            if (startParts != null) {
                if (ruleN.tokenType === null) {
                    curr_line += (startParts[1].match(/\n/g) || '').length;
                    current+=startParts[1].length+ruleN.addLength;
                    return true;//break
                }
                if (ruleN.tokenType === "SPECIAL") {
                    //handle asm case
                    var asmParts;
                    asmParts = /^(asm[^\w]*\{([\s\S]*?)\})/.exec(remaining_text);
                    if (asmParts === null) {
                        throw new TypeError('At line:'+curr_line+" Error parsing `asm { ... }` keyword");
                    }
                    tokens.push({ type: 'keyword', value: "asm", line: curr_line, asmText: asmParts[2] });
                    curr_line += (asmParts[1].match(/\n/g) || '').length;
                    current+=asmParts[1].length;
                    return true;//break
                }
                tokens.push({ type: ruleN.tokenType, value: startParts[1], line: curr_line });
                curr_line += (startParts[1].match(/\n/g) || '').length;
                current+=startParts[1].length+ruleN.addLength;
                return true;//break
            }
            return false;
        });
        if (found !== undefined) {
            continue;
        }

        // Resolve all single tokens
        search=single_tokens_specs.find(charDB => charDB.char === currChar);
        if (search!==undefined) {
            if (search.tokenType == null) {
                current++;
                continue;
            } else if (search.tokenType == "SPECIAL") {
                if (search.char == '#') {
                    current++;
                    lines=input.slice(current).split("\n");
                    for (i=0, val=""; i<lines.length ; i++) {
                        val+=lines[i];
                        current+=lines[i].length+1;//newline!
                        curr_line++;
                        if (lines[i].endsWith("\\")){
                            val=val.slice(0,-1);
                            continue;
                        }
                        break;
                    }
                    tokens.push({ type: 'macro', value: val, line: curr_line - i - 1 });
                    continue;
                }
                throw new TypeError('At line:'+curr_line+". SPECIAL rule not implemented!");
            }
            tokens.push({ type: search.tokenType, value: currChar, line: curr_line });
            current++;
            continue;
        }

        throw new TypeError("At line:"+curr_line+". Forbidden character: " + currChar);
    }

    return tokens;
}
