import { PRE_TOKEN, TOKEN, TOKEN_TYPES } from '../typings/syntaxTypes'

/** Translate an array of pre tokens to an array of tokens. First phase of parsing.
 * @param tokens Array of pre-tokens
 * @returns Array of TOKENS. Recursive on Arr, CodeCave and CodeDomain types
 * @throws {Error} at any mistakes
 */
export default function parser (preTokens: PRE_TOKEN[]): TOKEN[] {
    let mainLoopIndex: number

    function getNextRawToken () {
        mainLoopIndex++
        return preTokens[mainLoopIndex - 1]
    }
    // Will run once
    function parseMain () : TOKEN[] {
        const tokenTrain: TOKEN[] = []
        mainLoopIndex = 0
        while (mainLoopIndex < preTokens.length) {
            tokenTrain.push(getNextToken())
        }
        return tokenTrain
    }

    // Process element preTokens started at position mainLoopIndex (outer scope) and returns a functional token
    function getNextToken () {
        const CurrentPreToken = getNextRawToken()
        let RetToken: TOKEN

        if (CurrentPreToken.type !== 'PreToken') {
            return CurrentPreToken
        }
        // take care of recursive tokens
        switch (CurrentPreToken.value) {
        case ']':
        case ')':
        case '}':
            throw new Error(`At line: ${CurrentPreToken.line}. Unexpected closing '${CurrentPreToken.value}'.`)
        case '[':
            RetToken = { type: 'Arr', value: '', precedence: 0, line: CurrentPreToken.line }
            RetToken.params = getTokensUntil(']', RetToken.type, RetToken.line)
            return RetToken
        case '(':
            if (mainLoopIndex > 1 && preTokens[mainLoopIndex - 2].type === 'Variable') {
                RetToken = { type: 'Function', value: '', precedence: 0, line: CurrentPreToken.line }
            } else {
                RetToken = { type: 'CodeCave', value: '', precedence: 0, line: CurrentPreToken.line }
            }
            RetToken.params = getTokensUntil(')', RetToken.type, RetToken.line)
            return RetToken
        case '{':
            RetToken = { type: 'CodeDomain', value: '', precedence: 0, line: CurrentPreToken.line }
            RetToken.params = getTokensUntil('}', RetToken.type, RetToken.line)
            return RetToken
        default:
            throw new Error(`At line: ${CurrentPreToken.line}.` +
            ` Unexpected token '${CurrentPreToken.value}' - type: '${CurrentPreToken.type}'.`)
        }
    }

    // Process element preTokens started at position mainLoopIndex (outer scope) and returns a array of tokens
    // until endChar is found
    function getTokensUntil (endChar: ')'|'}'|']', parentType: TOKEN_TYPES, line: string) : TOKEN [] {
        const returnedTokens : TOKEN [] = []
        if (mainLoopIndex >= preTokens.length) {
            throw new Error('At line: end of file. ' +
            `Missing closing '${endChar}' for for '${parentType}' started at line: ${line}.`)
        }
        while (preTokens[mainLoopIndex].value !== endChar) {
            returnedTokens.push(getNextToken())
            // getNextToken will increase mainLoopIndex for loop
            if (mainLoopIndex >= preTokens.length) {
                throw new Error('At line: end of file. ' +
                `Missing closing '${endChar}' for for '${parentType}' started at line: ${line}.`)
            }
        }
        // discard closing char
        mainLoopIndex++
        return returnedTokens
    }

    return parseMain()
}
