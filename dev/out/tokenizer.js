"use strict";
// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License
/**
 * Transforms input source code into an array of pre tokens.
 * This array is not recursive.
 * @param input source code
 * @returns array of pre tokens
 */
// eslint-disable-next-line no-unused-vars
function tokenize(input) {
    const singleTokensSpecs = [
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
        { char: '#', tokenType: 'SPECIAL' }
    ];
    const regexSingleTokensSpecs = [
        {
            start: /^(\/\/.*)/,
            tokenType: 'NONE',
            addLength: 0
        },
        {
            start: /^([\s\t\n]+)/,
            tokenType: 'NONE',
            addLength: 0
        },
        {
            start: /^(\d[\d_]*\b)/,
            tokenType: 'numberDec',
            addLength: 0
        },
        {
            start: /^0[xX]([\da-fA-F][\da-fA-F_]*\b)/,
            tokenType: 'numberHex',
            addLength: 2
        },
        {
            start: /^(break|const|continue|do|else|exit|for|goto|halt|if|long|return|sleep|void|while)/,
            tokenType: 'keyword',
            addLength: 0
        },
        {
            start: /^(asm)/,
            tokenType: 'ASM',
            addLength: 0
        },
        {
            start: /^(struct)/,
            tokenType: 'STRUCT',
            addLength: 0
        },
        {
            start: /^(\w+)/,
            tokenType: 'variable',
            addLength: 0
        }
    ];
    const regexDoubleTokensSpecs = [
        {
            start: /^\/\*/,
            end: /([\s\S]*?\*\/)/,
            tokenType: 'NONE',
            startLength: 2,
            removeTrailing: 0,
            errorMsg: "Missing '*/' to end comment section."
        },
        {
            start: /^"/,
            end: /([\s\S]*?")/,
            tokenType: 'string',
            startLength: 1,
            removeTrailing: 1,
            errorMsg: "Missing '\"' to end string."
        },
        {
            start: /^'/,
            end: /([\s\S]*?')/,
            tokenType: 'string',
            startLength: 1,
            removeTrailing: 1,
            errorMsg: "Missing \"'\" to end string."
        }
    ];
    let currentChar, remainingText;
    let current = 0;
    const preTokens = [];
    let currentLine = 1;
    while (current < input.length) {
        currentChar = input.charAt(current);
        remainingText = input.slice(current);
        // Resolve double regex preTokens
        const found = regexDoubleTokensSpecs.find(ruleN => {
            const startParts = ruleN.start.exec(remainingText);
            if (startParts != null) {
                const endParts = ruleN.end.exec(remainingText.slice(ruleN.startLength));
                current += ruleN.startLength;
                if (endParts !== null) {
                    if (ruleN.tokenType === 'NONE') {
                        currentLine += (endParts[1].match(/\n/g) || '').length;
                        current += endParts[1].length;
                        return true; // breaks find function
                    }
                    preTokens.push({ type: ruleN.tokenType, value: endParts[1].slice(0, -ruleN.removeTrailing), line: currentLine });
                    currentLine += (endParts[1].match(/\n/g) || '').length;
                    current += endParts[1].length;
                    return true; // breaks find function
                }
                throw new TypeError(`At line: ${currentLine}. ${ruleN.errorMsg}`);
            }
            return false;
        });
        if (found !== undefined) {
            // item already processed
            continue;
        }
        // Resolve single regex preTokens
        const found2 = regexSingleTokensSpecs.find(ruleN => {
            const startParts = ruleN.start.exec(remainingText);
            if (startParts != null) {
                if (ruleN.tokenType === 'NONE') {
                    currentLine += (startParts[1].match(/\n/g) || '').length;
                    current += startParts[1].length + ruleN.addLength;
                    return true; // breaks find function
                }
                if (ruleN.tokenType === 'ASM') {
                    const asmParts = /^(asm[^\w]*\{([\s\S]*?)\})/.exec(remainingText);
                    if (asmParts === null) {
                        throw new TypeError('At line:' + currentLine + ' Error parsing `asm { ... }` keyword');
                    }
                    preTokens.push({ type: 'keyword', value: 'asm', line: currentLine, extValue: asmParts[2] });
                    currentLine += (asmParts[1].match(/\n/g) || '').length;
                    current += asmParts[1].length;
                    return true; // breaks find function
                }
                if (ruleN.tokenType === 'STRUCT') {
                    const structParts = /^(struct\s+(\w+))/.exec(remainingText);
                    if (structParts === null) {
                        throw new TypeError(`At line: ${currentLine}. 'struct' keyword must be followed by a type name`);
                    }
                    preTokens.push({ type: 'keyword', value: 'struct', line: currentLine, extValue: structParts[2] });
                    currentLine += (structParts[1].match(/\n/g) || '').length;
                    current += structParts[1].length;
                    return true; // breaks find function
                }
                preTokens.push({ type: ruleN.tokenType, value: startParts[1], line: currentLine });
                currentLine += (startParts[1].match(/\n/g) || '').length;
                current += startParts[1].length + ruleN.addLength;
                return true; // breaks find function
            }
            return false;
        });
        if (found2 !== undefined) {
            continue;
        }
        // Resolve all single preTokens
        const search = singleTokensSpecs.find(charDB => charDB.char === currentChar);
        if (search !== undefined) {
            if (search.tokenType === 'NONE') {
                current++;
                continue;
            }
            else if (search.tokenType === 'SPECIAL') {
                if (search.char === '#') {
                    current++;
                    const lines = input.slice(current).split('\n');
                    let i = 0;
                    let val = '';
                    for (; i < lines.length; i++) {
                        val += lines[i];
                        current += lines[i].length + 1; // newline!
                        currentLine++;
                        if (lines[i].endsWith('\\')) {
                            val = val.slice(0, -1);
                            continue;
                        }
                        break;
                    }
                    preTokens.push({ type: 'macro', value: val, line: currentLine - i - 1 });
                    continue;
                }
                throw new TypeError(`At line: ${currentLine}. SPECIAL rule not implemented in tokenizer().`);
            }
            preTokens.push({ type: search.tokenType, value: currentChar, line: currentLine });
            current++;
            continue;
        }
        throw new TypeError(`At line: ${currentLine}. Forbidden character found: '${currentChar}'.`);
    }
    return preTokens;
}
