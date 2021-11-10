
// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

import { PRE_TOKEN, TOKEN, TOKEN_TYPES } from '../typings/syntaxTypes'
import { stringToHexstring, ReedSalomonAddressDecode } from '../repository/repository'

/** Translate an array of pre tokens to an array of tokens. First phase of parsing.
 * @param tokens Array of pre-tokens
 * @returns Array of TOKENS. Recursive on Arr, CodeCave and CodeDomain types
 * @throws {TypeError | SyntaxError} at any mistakes
 */
export function parse (preTokens: PRE_TOKEN[]): TOKEN[] {
    type TOKEN_SPEC = {
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
                if (preTokens[tokenID].value === 'asm' || preTokens[tokenID].value === 'struct') {
                    node.extValue = preTokens[tokenID].extValue
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
                const ptkn = preTokens[tokenID]
                let val = stringToHexstring(ptkn.value)
                const parts = /^(BURST-|S-|TS-)([0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{5})/.exec(ptkn.value)
                if (parts !== null) {
                    val = ReedSalomonAddressDecode(parts[2], ptkn.line)
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
                }
                return { type: 'UnaryOperator', precedence: 2, value: '*', line: preTokens[tokenID].line }
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
                return { type: 'SetUnaryOperator', precedence: 1, value: '++', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['plus'],
            action (tokenID): TOKEN {
                if (isBinaryOperator(tokenID)) {
                    return { type: 'Operator', precedence: 4, value: '+', line: preTokens[tokenID].line }
                }
                return { type: 'UnaryOperator', precedence: 2, value: '+', line: preTokens[tokenID].line }
            }
        },
        {
            sequence: ['minus', 'minus'],
            action (tokenID): TOKEN {
                return { type: 'SetUnaryOperator', precedence: 1, value: '--', line: preTokens[tokenID].line }
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
                }
                return { type: 'UnaryOperator', precedence: 2, value: '-', line: preTokens[tokenID].line }
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
                }
                return { type: 'UnaryOperator', precedence: 2, value: '&', line: preTokens[tokenID].line }
            }
        }
    ]

    const AuxVars = {
        mainLoopIndex: 0
    }

    // Will run once
    function parseMain () : TOKEN[] {
        const tokenTrain: TOKEN[] = []
        while (AuxVars.mainLoopIndex < preTokens.length) {
            tokenTrain.push(getNextToken())
        }
        return tokenTrain
    }

    // Process element preTokens started at position mainLoopIndex (outer scope) and returns a functional token
    function getNextToken () {
        const currentPreToken = preTokens[AuxVars.mainLoopIndex]
        let retToken: TOKEN

        // take care of not recursive tokens
        const foundRule = notRecursiveTokensSpecs.find(matchRule)
        if (foundRule !== undefined) {
            retToken = foundRule.action(AuxVars.mainLoopIndex)
            AuxVars.mainLoopIndex += foundRule.sequence.length
            return retToken
        }

        // take care of recursive tokens
        switch (currentPreToken.value) {
        case ']':
        case ')':
        case '}':
            throw new SyntaxError(`At line: ${currentPreToken.line}. Unexpected closing '${currentPreToken.value}'.`)
        case '[':
            retToken = { type: 'Arr', value: '', precedence: 0, line: currentPreToken.line }
            AuxVars.mainLoopIndex++
            retToken.params = getTokensUntil(']', retToken.type, retToken.line)
            return retToken
        case '(':
            if (AuxVars.mainLoopIndex > 0 && preTokens[AuxVars.mainLoopIndex - 1].type === 'variable') {
                retToken = { type: 'Function', value: '', precedence: 0, line: currentPreToken.line }
            } else {
                retToken = { type: 'CodeCave', value: '', precedence: 0, line: currentPreToken.line }
            }
            AuxVars.mainLoopIndex++
            retToken.params = getTokensUntil(')', retToken.type, retToken.line)
            return retToken
        case '{':
            retToken = { type: 'CodeDomain', value: '', precedence: 0, line: currentPreToken.line }
            AuxVars.mainLoopIndex++
            retToken.params = getTokensUntil('}', retToken.type, retToken.line)
            return retToken
        default:
            throw new TypeError(`Internal error. Unknow token found: type: '${currentPreToken.type}' value: '${currentPreToken.value}'.`)
        }
    }

    // Process element preTokens started at position mainLoopIndex (outer scope) and returns a array of tokens
    // until endChar is found
    function getTokensUntil (endChar: ')'|'}'|']', parentType: TOKEN_TYPES, line: number) : TOKEN [] {
        const returnedTokens : TOKEN [] = []
        while (preTokens[AuxVars.mainLoopIndex].value !== endChar) {
            returnedTokens.push(getNextToken())
            // getNextToken will increase mainLoopIndex for loop
            if (AuxVars.mainLoopIndex >= preTokens.length) {
                throw new SyntaxError(`At line: end of file. Missing closing '${endChar}' for for '${parentType}' started at line: ${line}.`)
            }
        }
        // discard closing char
        AuxVars.mainLoopIndex++
        return returnedTokens
    }

    function matchRule (ruleN: TOKEN_SPEC) {
        for (let i = 0; i < ruleN.sequence.length; i++) {
            if (preTokens[AuxVars.mainLoopIndex + i]?.type === ruleN.sequence[i]) continue
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

    return parseMain()
}
