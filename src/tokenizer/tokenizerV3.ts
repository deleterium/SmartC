import { PRE_TOKEN } from '../typings/syntaxTypes'

/**
 * Transforms inputSourceCode into an array of pre tokens.
 * This array is not recursive.
 * @param inputSourceCode source code text
 * @returns array of pre tokens
 */
export default function tokenizer (inputSourceCode: string): PRE_TOKEN[] {
    const explodedText = inputSourceCode.split('')
    const explodedTextCodes = explodedText.map(str => str.charCodeAt(0))

    let streamCurrentLine = 1
    let streamCurrentCol = 0
    let streamCurrentIndex = -1
    let streamLastLineLength = 0
    let streamLastChar = ''

    /* Not all here, just the easy */
    const simpleTokensMap = new Map<string, string>([
        ['*', 'star'], ['!', 'not'], ['[', 'bracket'], [']', 'bracket'], ['-', 'minus'],
        ['+', 'plus'], ['\\', 'backslash'], ['<', 'less'], ['>', 'greater'], ['|', 'pipe'],
        ['&', 'and'], ['%', 'percent'], ['^', 'caret'], [',', 'comma'], ['~', 'tilde'],
        ['`', 'grave'], ['(', 'paren'], [')', 'paren'], [':', 'colon'], ['{', 'curly'],
        ['}', 'curly'], ['=', 'equal'], [';', 'semi']
    ])

    const bitFieldIsBlank = 0x01 // matches '/r', '/t', '/n', ' '
    const bitFieldIsDigit = 0x02 // matches 0-9
    const bitFieldIsWord = 0x04 // matches a-zA-Z_
    const bitFieldIsNumber = 0x08 // matches 0-9._
    const bitFieldIsNumberHex = 0x10 // matches 0-9a-fA-F_

    /* These are charCodes from 0 to 122 and the char classes as used here.
     * Bit field: isBlank isDigit isWord isNumber isNumberHex */
    const bitFieldTypeTable = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 8, 0, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 0, 0,
        0, 0, 0, 0, 0, 20, 20, 20, 20, 20, 20, 4, 4, 4, 4, 4, 4, 4, 4, 4,
        4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 28, 0, 20, 20, 20,
        20, 20, 20, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
        4, 4, 4
    ]

    /* These are charCodes from 0 to 122 and the next state function for state 'start'. */
    const startStateFunctionTable = [
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, stateReadString, stateReadMacro, undefined, undefined, undefined, stateReadString,
        undefined, undefined, undefined, undefined, undefined, undefined, stateReadDot, stateSlashStart, stateReadNumberHex, stateReadNumber,
        stateReadNumber, stateReadNumber, stateReadNumber, stateReadNumber, stateReadNumber, stateReadNumber, stateReadNumber, stateReadNumber, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord,
        stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord,
        stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord,
        stateReadWord, undefined, undefined, undefined, undefined, stateReadWord, undefined, stateReadWord, stateReadWord, stateReadWord,
        stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord,
        stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord,
        stateReadWord, stateReadWord, stateReadWord
    ]

    /* Not all here, just the easy */
    const easyKeywordTokens = [
        'break', 'case', 'const', 'continue', 'default', 'do', 'else', 'exit', 'fixed', 'for', 'goto',
        'halt', 'if', 'inline', 'long', 'return', 'sleep', 'sizeof', 'switch', 'void', 'while'
    ]

    function tokenizerMain () {
        const preTokens: PRE_TOKEN[] = []
        let nextToken: PRE_TOKEN | undefined
        do {
            nextToken = stateStart()
            if (nextToken) {
                preTokens.push(nextToken)
            }
        } while (streamCurrentIndex < inputSourceCode.length)
        return preTokens
    }

    function streamAdvance () {
        streamCurrentIndex++
        streamLastChar = explodedText[streamCurrentIndex]
        if (streamLastChar === '\n') {
            streamCurrentLine++
            streamCurrentCol = 0
            return streamLastChar
        }
        streamCurrentCol++
        streamLastLineLength = streamCurrentCol
        return streamLastChar
    }

    function streamRewind () {
        if (streamLastChar === '\n') {
            streamCurrentLine--
            streamCurrentCol = streamLastLineLength
        }
        streamCurrentIndex--
        streamCurrentCol--
        streamLastChar = ''
    }

    function stateStart () : PRE_TOKEN | undefined {
        let currentChar: string
        while (true) {
            currentChar = streamAdvance()
            if (currentChar === undefined) {
                return undefined
            }
            if (bitFieldTypeTable[explodedTextCodes[streamCurrentIndex]] & bitFieldIsBlank) {
                continue
            }
            const nextStateFunction = startStateFunctionTable[explodedTextCodes[streamCurrentIndex]]
            if (nextStateFunction) {
                return nextStateFunction()
            }
            const simpleToken = simpleTokensMap.get(currentChar)
            if (simpleToken) {
                return { type: simpleToken, value: currentChar, line: `${streamCurrentLine}:${streamCurrentCol}` }
            }
            throw new Error(`At line: ${streamCurrentLine}:${streamCurrentCol}. Invalid character ${currentChar} found.`)
        }
    }

    function stateReadDot () {
        const tokenLine = streamCurrentLine
        const tokenCol = streamCurrentCol
        const nextChar = explodedText[streamCurrentIndex + 1]
        if (nextChar && bitFieldTypeTable[nextChar.charCodeAt(0)] & bitFieldIsDigit) {
            return stateReadNumber()
        }
        return { type: 'dot', value: '.', line: `${tokenLine}:${tokenCol}` }
    }

    function stateReadWord () {
        const tokenLine = streamCurrentLine
        const tokenCol = streamCurrentCol
        const tokenStartIndex = streamCurrentIndex
        let currentChar: string
        do {
            currentChar = streamAdvance()
        } while (currentChar && bitFieldTypeTable[explodedTextCodes[streamCurrentIndex]] & bitFieldIsWord)
        const tokenValue = inputSourceCode.slice(tokenStartIndex, streamCurrentIndex)
        streamRewind()
        return stateCheckWord(tokenValue, tokenLine, tokenCol)
    }

    function stateCheckWord (tokenValue: string, tokenLine: number, tokenCol: number) {
        if (easyKeywordTokens.includes(tokenValue)) {
            return { type: 'keyword', value: tokenValue, line: `${tokenLine}:${tokenCol}` }
        }
        if (tokenValue === 'asm') {
            return stateReadAsmStart()
        }
        if (tokenValue === 'struct') {
            return stateReadStructStart()
        }
        return { type: 'variable', value: tokenValue, line: `${tokenLine}:${tokenCol}` }
    }

    function stateReadAsmStart () {
        const tokenLine = streamCurrentLine
        const tokenCol = streamCurrentCol
        let currentChar: string
        do {
            currentChar = streamAdvance()
            if (currentChar === undefined) {
                throw new Error(`At line: ${tokenLine}:${tokenCol}. Invalid asm { ... } sentence. Expecting '{', found end of file.`)
            }
            if (bitFieldTypeTable[explodedTextCodes[streamCurrentIndex]] & bitFieldIsBlank) {
                continue
            }
            if (currentChar === '{') {
                return stateReadAsmBrackets()
            }
            throw new Error(`At line: ${streamCurrentLine}:${streamCurrentCol}. Invalid asm { ... } sentence. Expecting '{', found '${currentChar}'.`)
        } while (true)
    }

    function stateReadAsmBrackets () {
        const tokenLine = streamCurrentLine
        const tokenCol = streamCurrentCol
        const tokenStartIndex = streamCurrentIndex
        let currentChar: string
        do {
            currentChar = streamAdvance()
            if (currentChar === undefined) {
                throw new Error(`At line: ${tokenLine}:${tokenCol}. Invalid asm { ... } sentence. Expecting '}', found end of file.`)
            }
        } while (currentChar !== '}')
        const tokenValue = inputSourceCode.slice(tokenStartIndex + 1, streamCurrentIndex)
        return { type: 'keyword', value: 'asm', line: `${tokenLine}:${tokenCol}`, extValue: tokenValue }
    }

    function stateReadStructStart () {
        const tokenLine = streamCurrentLine
        const tokenCol = streamCurrentCol
        const nextToken = stateStart()
        if (nextToken === undefined) {
            throw new Error(`At line: ${tokenLine}:${tokenCol}. struct sentence. Expecting a type name, but found EOF or comments.`)
        }
        if (nextToken.type === 'variable') {
            return { type: 'keyword', value: 'struct', line: `${tokenLine}:${tokenCol}`, extValue: nextToken.value }
        }
        throw new Error(`At line: ${streamCurrentLine}:${streamCurrentCol}. Invalid struct sentence. Expecting a type name, found '${nextToken.value}'`)
    }

    function stateReadNumber () {
        const tokenLine = streamCurrentLine
        const tokenCol = streamCurrentCol
        const tokenStartIndex = streamCurrentIndex
        let currentChar: string
        do {
            currentChar = streamAdvance()
        } while (currentChar && bitFieldTypeTable[explodedTextCodes[streamCurrentIndex]] & bitFieldIsNumber)
        const tokenValue = inputSourceCode.slice(tokenStartIndex, streamCurrentIndex)
        streamRewind()
        return { type: 'numberDec', value: tokenValue, line: `${tokenLine}:${tokenCol}` }
    }

    function stateReadNumberHex () {
        const tokenLine = streamCurrentLine
        const tokenCol = streamCurrentCol
        const tokenStartIndex = streamCurrentIndex
        const currentChar = streamAdvance()
        if (currentChar !== 'x' && currentChar !== 'X') {
            streamRewind()
            return stateReadNumber()
        }
        do {
            streamAdvance()
        } while (bitFieldTypeTable[explodedTextCodes[streamCurrentIndex]] & bitFieldIsNumberHex)
        const tokenValue = inputSourceCode.slice(tokenStartIndex + 2, streamCurrentIndex)
        streamRewind()
        return { type: 'numberHex', value: tokenValue, line: `${tokenLine}:${tokenCol}` }
    }

    function stateSlashStart () : PRE_TOKEN | undefined {
        const tokenLine = streamCurrentLine
        const tokenCol = streamCurrentCol
        const currentChar = streamAdvance()
        if (currentChar === '/') {
            return stateReadCommentSingleLine()
        }
        if (currentChar === '*') {
            return stateReadCommentMultiLine()
        }
        streamRewind()
        return { type: 'forwardslash', value: '/', line: `${tokenLine}:${tokenCol}` }
    }

    function stateReadCommentSingleLine () {
        let currentChar: string
        do {
            currentChar = streamAdvance()
        } while (currentChar && explodedTextCodes[streamCurrentIndex] !== '\n'.charCodeAt(0))
        return undefined
    }

    function stateReadCommentMultiLine () {
        const tokenLine = streamCurrentLine
        const tokenCol = streamCurrentCol
        let currentChar: string
        while (true) {
            currentChar = streamAdvance()
            if (currentChar === undefined) {
                throw new Error(`At line: ${tokenLine}:${tokenCol - 1}. End of file reached while trying to find '*/' to end this comment section.`)
            }
            if (currentChar === '*') {
                currentChar = streamAdvance()
                if (currentChar === '/') {
                    return undefined
                }
            }
        }
    }

    function stateReadMacro () : PRE_TOKEN {
        const tokenLine = streamCurrentLine
        const tokenCol = streamCurrentCol
        const tokenStartIndex = streamCurrentIndex
        let currentChar: string
        do {
            currentChar = streamAdvance()
        } while (currentChar && explodedTextCodes[streamCurrentIndex] !== '\n'.charCodeAt(0))
        const tokenValue = inputSourceCode.slice(tokenStartIndex + 1, streamCurrentIndex)
        return { type: 'macro', value: tokenValue, line: `${tokenLine}:${tokenCol}` }
    }

    function stateReadString () : PRE_TOKEN {
        const delimitator = streamLastChar
        const tokenLine = streamCurrentLine
        const tokenCol = streamCurrentCol
        const tokenStartIndex = streamCurrentIndex
        let currentChar: string
        do {
            currentChar = streamAdvance()
            if (currentChar === '\\') {
                currentChar = streamAdvance()
                if (currentChar === delimitator) {
                    // escaped quote, read next
                    currentChar = streamAdvance()
                }
            }
            if (currentChar === undefined) {
                throw new Error(`At line: ${tokenLine}:${tokenCol}. End of file reached while trying to find \`${delimitator}\` string delimitator.`)
            }
        } while (currentChar !== delimitator)
        const tokenValue = inputSourceCode.slice(tokenStartIndex + 1, streamCurrentIndex)
        return { type: 'string', value: tokenValue, line: `${tokenLine}:${tokenCol}` }
    }

    return tokenizerMain()
}
