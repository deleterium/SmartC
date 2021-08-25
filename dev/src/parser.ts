
interface PRE_TOKEN {
    line: number
    type: string
    value: string
    /** Only applicable for asm token */
    asmText?: string
}

// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

/** Allowed token types */
type TOKEN_TYPES = 'Variable' | 'Constant' | 'Operator' | 'UnaryOperator' |
'SetUnaryOperator' | 'Assignment'| 'SetOperator'|'Comparision'|'CheckOperator'|
'Arr'|'CodeCave'|'CodeDomain'|'Delimiter'|'Terminator'|'Macro'|'Member'|'Colon'|
'Keyword'|'Function'// | string;

type DECLARATION_TYPES = 'void' | 'long' | 'struct' | 'void_ptr' | 'long_ptr' | 'struct_ptr'

interface TOKEN {
    line: number
    precedence: number
    type: TOKEN_TYPES
    declaration?: DECLARATION_TYPES
    /** Empty string for Arr, CodeCave, CodeDomain */
    value: string
    /** Only applicable to Arr, CodeCave, CodeDomain, Variable with modifier */
    params?: TOKEN[]
    /** Only applicable to variable with modifier like array or struct */
    variableModifier?: { type: string, content: any }[]
    /** Only applicable to types: asm, break, continue or label */
    extValue?: string
}

/** Translate an array of pre tokens to an array of tokens. First phase of parsing.
 * @param tokens Array of pre-tokens
 * @returns Array of TOKENS. Recursive on Arr, CodeCave and CodeDomain types
 * @throws {TypeError | SyntaxError} at any mistakes
 */
// eslint-disable-next-line no-unused-vars
function parse (preTokens: PRE_TOKEN[]): TOKEN[] {
    interface TOKEN_SPEC {
        sequence: string[]
        action(item: number): TOKEN
    }
    // This object stores a recipe to transform one or more pre_tokens into one
    //   token. All non-recursive items are here. The order they are
    //   arrange are important to decide in cases where same element token can be
    //   more than one functional token depending the other tokens after it.
    // Recursive tokens will be treated on getNextToken() function.
    const notRecursiveTokensSpecs: TOKEN_SPEC[] = [

        // single-tokens easy
        {
            sequence: ['tilde'],
            action (tokenID): TOKEN {
                return { type: 'UnaryOperator', precedence: 2, value: '~', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['semi'],
            action (tokenID): TOKEN {
                return { type: 'Terminator', precedence: 12, value: ';', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['comma'],
            action (tokenID): TOKEN {
                return { type: 'Delimiter', precedence: 11, value: ',', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['colon'],
            action (tokenID): TOKEN {
                return { type: 'Colon', precedence: 0, value: ':', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['dot'],
            action (tokenID): TOKEN {
                return { type: 'Member', precedence: 0, value: '.', line: preTokens[tokenID].line }
            }
        },

        // single-tokens medium
        {
            sequence: ['macro'],
            action (tokenID): TOKEN {
                return { type: 'Macro', precedence: 0, value: preTokens[tokenID].value, line: preTokens[tokenID].line }
            }
        },

        // single-tokens hard
        {
            sequence: ['keyword'],
            action (tokenID): TOKEN {
                const node: TOKEN = { type: 'Keyword', precedence: 12, value: preTokens[tokenID].value, line: preTokens[tokenID].line }
                if (preTokens[tokenID].value === 'asm') {
                    node.extValue = preTokens[tokenID].asmText
                }
                return node
            }
        },
        {
            sequence: ['numberDec'],
            action (tokenID): TOKEN {
                const ptkn = preTokens[tokenID]
                let val = BigInt(ptkn.value.replace(/_/g, '')).toString(16)
                val = val.padStart((Math.floor((val.length - 1) / 16) + 1) * 16, '0')
                return { type: 'Constant', precedence: 0, value: val, line: ptkn.line }
            }
        },
        {
            sequence: ['numberHex'],
            action (tokenID): TOKEN {
                const ptkn = preTokens[tokenID]
                let val = ptkn.value.replace(/_/g, '').toLowerCase()
                val = val.padStart((Math.floor((val.length - 1) / 16) + 1) * 16, '0')
                return { type: 'Constant', precedence: 0, value: val, line: ptkn.line }
            }
        },
        {
            sequence: ['string'],
            action (tokenID): TOKEN {
                let val: string
                const ptkn = preTokens[tokenID]
                const parts = /^(BURST-|S-|TS-)([2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{5})/.exec(ptkn.value)
                if (parts !== null) {
                    val = rsDecode(parts[2])
                } else {
                    val = str2long(ptkn.value)
                }
                return { type: 'Constant', precedence: 0, value: val, line: ptkn.line }
            }
        },

        // multi-tokens easy
        {
            sequence: ['equal', 'equal'],
            action (tokenID): TOKEN {
                return { type: 'Comparision', precedence: 6, value: '==', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['equal'],
            action (tokenID): TOKEN {
                return { type: 'Assignment', precedence: 10, value: '=', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['not', 'equal'],
            action (tokenID): TOKEN {
                return { type: 'Comparision', precedence: 6, value: '!=', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['not'],
            action (tokenID): TOKEN {
                return { type: 'UnaryOperator', precedence: 2, value: '!', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['forwardslash', 'equal'],
            action (tokenID): TOKEN {
                return { type: 'SetOperator', precedence: 10, value: '/=', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['forwardslash'],
            action (tokenID): TOKEN {
                return { type: 'Operator', precedence: 3, value: '/', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['percent', 'equal'],
            action (tokenID): TOKEN {
                return { type: 'SetOperator', precedence: 10, value: '%=', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['percent'],
            action (tokenID): TOKEN {
                return { type: 'Operator', precedence: 3, value: '%', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['less', 'less', 'equal'],
            action (tokenID): TOKEN {
                return { type: 'SetOperator', precedence: 10, value: '<<=', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['less', 'less'],
            action (tokenID): TOKEN {
                return { type: 'Operator', precedence: 5, value: '<<', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['less', 'equal'],
            action (tokenID): TOKEN {
                return { type: 'Comparision', precedence: 6, value: '<=', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['less'],
            action (tokenID): TOKEN {
                return { type: 'Comparision', precedence: 6, value: '<', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['pipe', 'pipe'],
            action (tokenID): TOKEN {
                return { type: 'Comparision', precedence: 9, value: '||', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['pipe', 'equal'],
            action (tokenID): TOKEN {
                return { type: 'SetOperator', precedence: 10, value: '|=', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['pipe'],
            action (tokenID): TOKEN {
                return { type: 'Operator', precedence: 7, value: '|', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['greater', 'equal'],
            action (tokenID): TOKEN {
                return { type: 'Comparision', precedence: 6, value: '>=', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['greater', 'greater', 'equal'],
            action (tokenID): TOKEN {
                return { type: 'SetOperator', precedence: 10, value: '>>=', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['greater', 'greater'],
            action (tokenID): TOKEN {
                return { type: 'Operator', precedence: 5, value: '>>', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['greater'],
            action (tokenID): TOKEN {
                return { type: 'Comparision', precedence: 6, value: '>', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['caret', 'equal'],
            action (tokenID): TOKEN {
                return { type: 'SetOperator', precedence: 10, value: '^=', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['caret'],
            action (tokenID): TOKEN {
                return { type: 'Operator', precedence: 7, value: '^', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['variable', 'colon'],
            action (tokenID): TOKEN {
                return { type: 'Keyword', precedence: 12, value: 'label', extValue: preTokens[tokenID].value, line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['variable'],
            action (tokenID): TOKEN {
                if (preTokens[tokenID + 1] !== undefined && preTokens[tokenID + 1].value === '(') {
                    return { type: 'Function', precedence: 0, value: preTokens[tokenID].value, line: preTokens[tokenID].line }
                }
                return { type: 'Variable', precedence: 0, value: preTokens[tokenID].value, line: preTokens[tokenID].line }
            }
        },

        // multi-tokens medium
        {
            sequence: ['star', 'equal'],
            action (tokenID): TOKEN {
                return { type: 'SetOperator', precedence: 10, value: '*=', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['star'],
            action (tokenID): TOKEN {
                if (isBinaryOperator(tokenID)) {
                    return { type: 'Operator', precedence: 3, value: '*', line: preTokens[tokenID].line }
                } else {
                    return { type: 'UnaryOperator', precedence: 2, value: '*', line: preTokens[tokenID].line }
                }
            }
        },
        {
            sequence: ['plus', 'equal'],
            action (tokenID): TOKEN {
                return { type: 'SetOperator', precedence: 10, value: '+=', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['plus', 'plus'],
            action (tokenID): TOKEN {
                return { type: 'SetUnaryOperator', precedence: 2, value: '++', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['plus'],
            action (tokenID): TOKEN {
                if (isBinaryOperator(tokenID)) {
                    return { type: 'Operator', precedence: 4, value: '+', line: preTokens[tokenID].line }
                } else {
                    return { type: 'UnaryOperator', precedence: 2, value: '+', line: preTokens[tokenID].line }
                }
            }
        },
        {
            sequence: ['minus', 'minus'],
            action (tokenID): TOKEN {
                return { type: 'SetUnaryOperator', precedence: 2, value: '--', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['minus', 'equal'],
            action (tokenID): TOKEN {
                return { type: 'SetOperator', precedence: 10, value: '-=', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['minus', 'greater'],
            action (tokenID): TOKEN {
                return { type: 'Member', precedence: 0, value: '->', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['minus'],
            action (tokenID): TOKEN {
                if (isBinaryOperator(tokenID)) {
                    return { type: 'Operator', precedence: 4, value: '-', line: preTokens[tokenID].line }
                } else {
                    return { type: 'UnaryOperator', precedence: 2, value: '-', line: preTokens[tokenID].line }
                }
            }
        },
        {
            sequence: ['and', 'and'],
            action (tokenID): TOKEN {
                return { type: 'Comparision', precedence: 8, value: '&&', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['and', 'equal'],
            action (tokenID): TOKEN {
                return { type: 'SetOperator', precedence: 10, value: '&=', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['and'],
            action (tokenID): TOKEN {
                if (isBinaryOperator(tokenID)) {
                    return { type: 'Operator', precedence: 7, value: '&', line: preTokens[tokenID].line }
                } else {
                    return { type: 'UnaryOperator', precedence: 2, value: '&', line: preTokens[tokenID].line }
                }
            }
        }

    ]

    // Process element preTokens started at position mainLoopIndex (outer scope) and returns a functional token
    function getNextToken () {
        const currentPreToken = preTokens[mainLoopIndex]
        let retToken: TOKEN

        // take care of not recursive tokens
        const foundRule = notRecursiveTokensSpecs.find(matchRule)
        if (foundRule !== undefined) {
            retToken = foundRule.action(mainLoopIndex)
            mainLoopIndex += foundRule.sequence.length
            return retToken
        }

        // take care of recursive tokens
        switch (currentPreToken.value) {
        case ']':
        case ')':
        case '}':
            throw new SyntaxError(`At line: ${currentPreToken.line}. Unmatched closing '${currentPreToken.value}'.`)

        case '[':
            retToken = { type: 'Arr', value: '', precedence: 1, line: currentPreToken.line }
            mainLoopIndex++
            retToken.params = []
            while (preTokens[mainLoopIndex].value !== ']') {
                retToken.params.push(getNextToken())
                // getNextToken will increase mainLoopIndex for loop
                if (preTokens[mainLoopIndex] === undefined) {
                    throw new SyntaxError(`At end of file. Missing closing ']' for Arr started at line: ${retToken.line}.`)
                }
            }
            // discard closing bracket
            mainLoopIndex++
            return retToken

        case '(':
            retToken = { type: 'CodeCave', value: '', precedence: 1, line: currentPreToken.line }
            mainLoopIndex++
            retToken.params = []
            while (preTokens[mainLoopIndex].value !== ')') {
                retToken.params.push(getNextToken())
                // getNextToken will increase mainLoopIndex for loop
                if (preTokens[mainLoopIndex] === undefined) {
                    throw new SyntaxError(`At end of file. Missing closing ')' for CodeCave started at line: ${retToken.line}.`)
                }
            }
            mainLoopIndex++
            return retToken

        case '{':
            retToken = { type: 'CodeDomain', value: '', precedence: 1, line: currentPreToken.line }
            mainLoopIndex++
            retToken.params = []
            while (preTokens[mainLoopIndex].value !== '}') {
                retToken.params.push(getNextToken())
                // getNextToken will increase mainLoopIndex for loop
                if (preTokens[mainLoopIndex] === undefined) {
                    throw new SyntaxError(`At end of file. Missing closing '}' for CodeDomain started at line: ${retToken.line}.`)
                }
            }
            mainLoopIndex++
            return retToken
        }
        throw new TypeError(`At line: ${currentPreToken.line}. Unknow token found: type: '${currentPreToken.type}' value: '${currentPreToken.value}'.`)
    }

    function matchRule (ruleN: TOKEN_SPEC) {
        for (let i = 0; i < ruleN.sequence.length; i++) {
            if (preTokens[mainLoopIndex + i].type === ruleN.sequence[i]) continue
            return false // proceed to next rule
        }
        return true // all sequence matched!
    }

    // Use to detect if a token at some position is Binary or Unary
    function isBinaryOperator (position: number) {
        if (position >= 2) {
            if ((preTokens[position - 1].type === 'plus' && preTokens[position - 2].type === 'plus') ||
                (preTokens[position - 1].type === 'minus' && preTokens[position - 2].type === 'minus')) {
                return true
            }
            if ((preTokens[position - 1].type === 'variable' &&
                preTokens[position - 2].type === 'keyword') &&
                preTokens[position - 2].value === 'struct') {
                return false
            }
        }
        if (position >= 1) {
            if (preTokens[position - 1].type === 'variable' ||
                preTokens[position - 1].type === 'numberDec' ||
                preTokens[position - 1].type === 'numberHex' ||
                preTokens[position - 1].type === 'string' ||
                preTokens[position - 1].value === ']' ||
                preTokens[position - 1].value === ')') {
                return true
            }
        }
        return false
    }

    // Input: javascript string (utf-16)
    // Output: string representing same string in hexadecimal utf-8
    function str2long (inStr: string) {
        if (!(typeof inStr === 'string')) {
            return ''
        }

        const byarr = []
        let ret = ''
        let c, c1, i, j

        for (i = 0; i < inStr.length; i++) {
            c = inStr.charCodeAt(i)

            if (c < 128) {
                byarr.push(c)
            } else {
                if (c < 2048) {
                    byarr.push(c >> 6 | 0xc0) // ok
                    byarr.push((c & 63) | 128) // ok
                } else {
                    if (c < 55296 || c > 57343) {
                        byarr.push(((c >> 12) & 63) | 0xe0) // ok
                        byarr.push(((c >> 6) & 63) | 128) // ok
                        byarr.push((c & 63) | 128) // ok
                    } else {
                        i++
                        c1 = inStr.charCodeAt(i)
                        if ((c & 0xFC00) === 0xd800 && (c1 & 0xFC00) === 0xDC00) {
                            c = ((c & 0x3FF) << 10) + (c1 & 0x3FF) + 0x10000
                            byarr.push(((c >> 18) & 63) | 0xf0) // ok
                            byarr.push(((c >> 12) & 63) | 128) // ok
                            byarr.push(((c >> 6) & 63) | 128) // ok
                            byarr.push((c & 63) | 128) // ok
                        }
                    }
                }
            }
        }
        for (j = 0; j < (Math.floor((byarr.length - 1) / 8) + 1) * 8; j++) {
            if (j >= byarr.length) {
                ret = '00' + ret
            } else {
                ret = byarr[j].toString(16).padStart(2, '0') + ret
            }
        }
        return (ret)
    }

    /* eslint-disable camelcase */
    // Decode REED-SALOMON burst address from string to long value
    // Adapted from https://github.com/burst-apps-team/burstkit4j
    function rsDecode (cypher_string: string) {
        const gexp = [1, 2, 4, 8, 16, 5, 10, 20, 13, 26, 17, 7, 14, 28, 29, 31, 27, 19, 3, 6, 12, 24, 21, 15, 30, 25, 23, 11, 22, 9, 18, 1]
        const glog = [0, 0, 1, 18, 2, 5, 19, 11, 3, 29, 6, 27, 20, 8, 12, 23, 4, 10, 30, 17, 7, 22, 28, 26, 21, 25, 9, 16, 13, 14, 24, 15]
        const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
        const codeword_map = [3, 2, 1, 0, 7, 6, 5, 4, 13, 14, 15, 16, 12, 8, 9, 10, 11]

        function gmult (a: number, b: number) {
            if (a === 0 || b === 0) {
                return 0
            }
            const idx = (glog[a] + glog[b]) % 31
            return gexp[idx]
        }

        function is_codeword_valid (codeword: number[]) {
            let sum = 0
            let i: number, j: number, t: number, pos: number

            for (i = 1; i < 5; i++) {
                t = 0
                for (j = 0; j < 31; j++) {
                    if (j > 12 && j < 27) {
                        continue
                    }
                    pos = j
                    if (j > 26) {
                        pos -= 14
                    }
                    t ^= gmult(codeword[pos], gexp[(i * j) % 31])
                }
                sum |= t
            }

            return sum === 0
        }

        let codeword_length = 0
        const codeword: number[] = []
        let codework_index: number

        for (let i = 0; i < cypher_string.length; i++) {
            const position_in_alphabet = alphabet.indexOf(cypher_string.charAt(i))
            if (position_in_alphabet <= -1) {
                continue
            }
            codework_index = codeword_map[codeword_length]
            codeword[codework_index] = position_in_alphabet
            codeword_length++
        }
        if (codeword_length !== 17 || !is_codeword_valid(codeword)) {
            throw new TypeError(`Error decoding address: S-${cypher_string}`)
        }

        // base32 to base10 conversion
        const length = 13
        let val = 0n
        let mul = 1n
        for (let i = 0; i < length; i++) {
            val += mul * BigInt(codeword[i])
            mul *= 32n
        }

        return val.toString(16).padStart(16, '0')
    }
    /* eslint-enable camelcase */

    /* * * Main function! * * */
    let mainLoopIndex = 0
    const tokenTrain: TOKEN[] = []
    // this is the mainLoop!
    while (mainLoopIndex < preTokens.length) {
        tokenTrain.push(getNextToken())
    }
    return tokenTrain
}
