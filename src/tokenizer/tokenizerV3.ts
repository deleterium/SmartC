import { ReedSalomonAddressDecode, parseDecimalNumber, stringToHexstring } from '../repository/repository'
import { CONTRACT } from '../typings/contractTypes'
import { PRE_TOKEN } from '../typings/syntaxTypes'

/**
 * Transforms inputSourceCode into an array of pre tokens.
 * This array is not recursive.
 * @param inputSourceCode source code text
 * @returns array of pre tokens
 */
export default function tokenizer (Program: CONTRACT, inputSourceCode: string): PRE_TOKEN[] {
    const explodedText = inputSourceCode.split('')
    const explodedTextCodes = explodedText.map(str => str.charCodeAt(0))
    const preTokens: PRE_TOKEN[] = []
    let detectionHasFixed: boolean = false
    let detectionHasAutoCounter: boolean = false

    let streamCurrentLine = 1
    let streamCurrentCol = 0
    let streamCurrentIndex = -1
    let streamLastLineLength = 0
    let streamLastChar = ''

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

    /* These are charCodes from 0 to 126 and the next state function for state 'start'. Summary:
     * Function           |  Char code of
     * -------------------|---------------
     * stateReadCHARNAME  | !%&*+,-.:;<=>^|~
     * stateReadRecursive | [](){}
     * stateSlashStart    | /
     * stateReadMacro     | #
     * stateReadString    | '"
     * stateReadNumberHex | 0
     * stateReadNumber    | 1-9
     * stateReadWord      | a-zA-Z_
     */
    const startStateFunctionTable = [
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, stateReadExclamation, stateReadString, stateReadMacro, undefined, stateReadPercent, stateReadAnd, stateReadString,
        stateReadRecursive, stateReadRecursive, stateReadStar, stateReadPlus, stateReadComma, stateReadMinus, stateReadDot, stateSlashStart, stateReadNumberHex,
        stateReadNumber, stateReadNumber, stateReadNumber, stateReadNumber, stateReadNumber, stateReadNumber, stateReadNumber, stateReadNumber, stateReadNumber, stateReadColon,
        stateReadSemicolon, stateReadLess, stateReadEqual, stateReadGreater, undefined, undefined, stateReadWord, stateReadWord, stateReadWord, stateReadWord,
        stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord,
        stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord,
        stateReadWord, stateReadWord, stateReadRecursive, undefined, stateReadRecursive, stateReadCaret, stateReadWord, undefined, stateReadWord, stateReadWord,
        stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord,
        stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord, stateReadWord,
        stateReadWord, stateReadWord, stateReadWord, stateReadRecursive, stateReadPipe, stateReadRecursive, stateReadTilde
    ]
    /* Not all here, just the easy */
    const easyKeywordTokens = [
        'break', 'case', 'const', 'continue', 'default', 'do', 'else', 'exit', 'fixed', 'for', 'goto',
        'halt', 'if', 'inline', 'long', 'register', 'return', 'sleep', 'switch', 'void', 'while'
    ]

    function tokenizerMain () {
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

    function streamRead () {
        streamLastChar = explodedText[streamCurrentIndex]
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
        let currentCharCode: number
        while (true) {
            currentChar = streamAdvance()
            currentCharCode = explodedTextCodes[streamCurrentIndex]
            if (currentChar === undefined) {
                return undefined
            }
            if (bitFieldTypeTable[currentCharCode] & bitFieldIsBlank) {
                continue
            }
            const nextStateFunction = startStateFunctionTable[currentCharCode]
            if (nextStateFunction) {
                return nextStateFunction()
            }
            throw new Error(`At line: ${streamCurrentLine}:${streamCurrentCol}. Invalid character '${currentChar}' found.`)
        }
    }

    function stateReadDot () : PRE_TOKEN { // char .
        const tokenLine = streamCurrentLine
        const tokenCol = streamCurrentCol
        const nextChar = explodedText[streamCurrentIndex + 1]
        if (nextChar && bitFieldTypeTable[nextChar.charCodeAt(0)] & bitFieldIsDigit) {
            return stateReadNumber()
        }
        return { type: 'Member', precedence: 0, value: '.', line: `${tokenLine}:${tokenCol}` }
    }

    function stateReadWord () : PRE_TOKEN {
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

    function stateCheckWord (tokenValue: string, tokenLine: number, tokenCol: number) : PRE_TOKEN {
        const line = `${tokenLine}:${tokenCol}`
        if (easyKeywordTokens.includes(tokenValue)) {
            if (!detectionHasFixed && tokenValue === 'fixed') {
                detectionHasFixed = true
                Program.Context.TokenizerDetection.hasFixed = true
            }
            return { type: 'Keyword', precedence: 12, value: tokenValue, line }
        }
        switch (tokenValue) {
        case 'sizeof':
            return { type: 'Keyword', precedence: 2, value: tokenValue, line }
        case 'asm':
            return stateReadAsmStart()
        case 'struct':
            return stateReadStructStart()
        }
        if (!detectionHasAutoCounter && (tokenValue === 'getNextTx' || tokenValue === 'getNextTxFromBlockheight')) {
            detectionHasAutoCounter = true
            Program.Context.TokenizerDetection.hasAutoCounter = true
        }
        return { type: 'Variable', precedence: 0, value: tokenValue, line }
    }

    function stateReadAsmStart () : PRE_TOKEN {
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

    function stateReadAsmBrackets () : PRE_TOKEN {
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        const tokenStartIndex = streamCurrentIndex
        let currentChar: string
        do {
            currentChar = streamAdvance()
            if (currentChar === undefined) {
                throw new Error(`At line: ${line}. Invalid asm { ... } sentence. Expecting '}', found end of file.`)
            }
        } while (currentChar !== '}')
        const tokenValue = inputSourceCode.slice(tokenStartIndex + 1, streamCurrentIndex)
        return { type: 'Keyword', precedence: 12, value: 'asm', line, extValue: tokenValue }
    }

    function stateReadStructStart () : PRE_TOKEN {
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        const nextToken = stateStart()
        if (nextToken === undefined) {
            throw new Error(`At line: ${line}. struct sentence. Expecting a type name, but found EOF or comments.`)
        }
        if (nextToken.type === 'Variable') {
            return { type: 'Keyword', precedence: 12, value: 'struct', line, extValue: nextToken.value }
        }
        throw new Error(`At line: ${streamCurrentLine}:${streamCurrentCol}. Invalid struct sentence. Expecting a type name, found '${nextToken.value}'`)
    }

    function stateReadNumber () : PRE_TOKEN {
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        const tokenStartIndex = streamCurrentIndex
        let currentChar: string
        do {
            currentChar = streamAdvance()
        } while (currentChar && bitFieldTypeTable[explodedTextCodes[streamCurrentIndex]] & bitFieldIsNumber)
        const tokenValue = inputSourceCode.slice(tokenStartIndex, streamCurrentIndex)
        streamRewind()

        const Parsed = parseDecimalNumber(tokenValue, line)
        const valString = Parsed.value.toString(16)
        const paddedValString = valString.padStart((Math.floor((valString.length - 1) / 16) + 1) * 16, '0')
        if (!detectionHasFixed && Parsed.declaration === 'fixed') {
            detectionHasFixed = true
            Program.Context.TokenizerDetection.hasFixed = true
        }
        return { type: 'Constant', precedence: 0, value: paddedValString, line, extValue: Parsed.declaration }
    }

    function stateReadNumberHex () : PRE_TOKEN {
        const line = `${streamCurrentLine}:${streamCurrentCol}`
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

        let val = tokenValue.replace(/_/g, '').toLowerCase()
        val = val.padStart((Math.floor((val.length - 1) / 16) + 1) * 16, '0')
        return { type: 'Constant', precedence: 0, value: val, line, extValue: 'long' }
    }

    function stateSlashStart () : PRE_TOKEN | undefined {
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        const currentChar = streamAdvance()
        switch (currentChar) {
        case '/':
            return stateReadCommentSingleLine()
        case '*':
            return stateReadCommentMultiLine()
        case '=':
            return { type: 'SetOperator', precedence: 10, value: '/=', line }
        }
        streamRewind()
        return { type: 'Operator', precedence: 3, value: '/', line }
    }

    function stateReadCommentSingleLine () : undefined {
        let currentChar: string
        do {
            currentChar = streamAdvance()
        } while (currentChar && explodedTextCodes[streamCurrentIndex] !== '\n'.charCodeAt(0))
        return undefined
    }

    function stateReadCommentMultiLine () : undefined {
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
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        const tokenStartIndex = streamCurrentIndex
        let currentChar: string
        do {
            currentChar = streamAdvance()
        } while (currentChar && explodedTextCodes[streamCurrentIndex] !== '\n'.charCodeAt(0))
        const tokenValue = inputSourceCode.slice(tokenStartIndex + 1, streamCurrentIndex)
        return { type: 'Macro', precedence: 0, value: tokenValue, line }
    }

    function stateReadString () : PRE_TOKEN {
        const delimitator = streamRead()
        const line = `${streamCurrentLine}:${streamCurrentCol}`
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
                throw new Error(`At line: ${line}. End of file reached while trying to find \`${delimitator}\` string delimitator.`)
            }
        } while (currentChar !== delimitator)
        const tokenValue = inputSourceCode.slice(tokenStartIndex + 1, streamCurrentIndex)

        let val = stringToHexstring(tokenValue, line)
        const parts = /^(BURST-|S-|TS-)([0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{5})/.exec(tokenValue)
        if (parts !== null) {
            val = ReedSalomonAddressDecode(parts[2], line)
        }
        return { type: 'Constant', precedence: 0, value: val, line }
    }

    function stateReadStar () : PRE_TOKEN { // char *
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        const currentChar = streamAdvance()
        if (currentChar === '=') {
            return { type: 'SetOperator', precedence: 10, value: '*=', line }
        }
        if (currentChar === '/') {
            throw new Error(`At line: ${line}. Ending a comment that was not started.`)
        }
        streamRewind()
        if (isBinaryOperator()) {
            return { type: 'Operator', precedence: 3, value: '*', line }
        }
        return { type: 'UnaryOperator', precedence: 2, value: '*', line }
    }

    function stateReadLess () : PRE_TOKEN { // char <
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        let currentChar = streamAdvance()
        if (currentChar === '<') {
            currentChar = streamAdvance()
            if (currentChar === '=') {
                return { type: 'SetOperator', precedence: 10, value: '<<=', line }
            }
            streamRewind()
            return { type: 'Operator', precedence: 5, value: '<<', line }
        }
        if (currentChar === '=') {
            return { type: 'Comparision', precedence: 6, value: '<=', line }
        }
        streamRewind()
        return { type: 'Comparision', precedence: 6, value: '<', line }
    }

    function stateReadEqual () : PRE_TOKEN { // char =
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        const currentChar = streamAdvance()
        if (currentChar === '=') {
            return { type: 'Comparision', precedence: 6, value: '==', line }
        }
        streamRewind()
        return { type: 'Assignment', precedence: 10, value: '=', line }
    }

    function stateReadGreater () : PRE_TOKEN { // char >
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        let currentChar = streamAdvance()
        if (currentChar === '>') {
            currentChar = streamAdvance()
            if (currentChar === '=') {
                return { type: 'SetOperator', precedence: 10, value: '>>=', line }
            }
            streamRewind()
            return { type: 'Operator', precedence: 5, value: '>>', line }
        }
        if (currentChar === '=') {
            return { type: 'Comparision', precedence: 6, value: '>=', line }
        }
        streamRewind()
        return { type: 'Comparision', precedence: 6, value: '>', line }
    }

    function stateReadPlus () : PRE_TOKEN { // char +
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        const currentChar = streamAdvance()
        if (currentChar === '+') {
            return { type: 'SetUnaryOperator', precedence: 1, value: '++', line }
        }
        if (currentChar === '=') {
            return { type: 'SetOperator', precedence: 10, value: '+=', line }
        }
        streamRewind()
        if (isBinaryOperator()) {
            return { type: 'Operator', precedence: 4, value: '+', line }
        }
        return { type: 'UnaryOperator', precedence: 2, value: '+', line }
    }

    function stateReadMinus () : PRE_TOKEN { // char -
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        const currentChar = streamAdvance()
        switch (currentChar) {
        case '-':
            return { type: 'SetUnaryOperator', precedence: 1, value: '--', line }
        case '=':
            return { type: 'SetOperator', precedence: 10, value: '-=', line }
        case '>':
            return { type: 'Member', precedence: 0, value: '->', line }
        }
        streamRewind()
        if (isBinaryOperator()) {
            return { type: 'Operator', precedence: 4, value: '-', line }
        }
        return { type: 'UnaryOperator', precedence: 2, value: '-', line }
    }

    function stateReadAnd () : PRE_TOKEN { // char &
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        const currentChar = streamAdvance()
        if (currentChar === '&') {
            return { type: 'Comparision', precedence: 8, value: '&&', line }
        }
        if (currentChar === '=') {
            return { type: 'SetOperator', precedence: 10, value: '&=', line }
        }
        streamRewind()
        if (isBinaryOperator()) {
            return { type: 'Operator', precedence: 7, value: '&', line }
        }
        return { type: 'UnaryOperator', precedence: 2, value: '&', line }
    }

    function stateReadPipe () : PRE_TOKEN { // char |
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        const currentChar = streamAdvance()
        if (currentChar === '|') {
            return { type: 'Comparision', precedence: 9, value: '||', line }
        }
        if (currentChar === '=') {
            return { type: 'SetOperator', precedence: 10, value: '|=', line }
        }
        streamRewind()
        return { type: 'Operator', precedence: 7, value: '|', line }
    }

    function stateReadCaret () : PRE_TOKEN { // char ^
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        const currentChar = streamAdvance()
        if (currentChar === '=') {
            return { type: 'SetOperator', precedence: 10, value: '^=', line }
        }
        streamRewind()
        return { type: 'Operator', precedence: 7, value: '^', line }
    }

    function stateReadPercent () : PRE_TOKEN { // char %
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        const currentChar = streamAdvance()
        if (currentChar === '=') {
            return { type: 'SetOperator', precedence: 10, value: '%=', line }
        }
        streamRewind()
        return { type: 'Operator', precedence: 3, value: '%', line }
    }

    function stateReadExclamation () : PRE_TOKEN { // char !
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        const currentChar = streamAdvance()
        if (currentChar === '=') {
            return { type: 'Comparision', precedence: 6, value: '!=', line }
        }
        streamRewind()
        return { type: 'UnaryOperator', precedence: 2, value: '!', line }
    }

    function stateReadTilde () : PRE_TOKEN { // char ~
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        return { type: 'UnaryOperator', precedence: 2, value: '~', line }
    }

    function stateReadComma () : PRE_TOKEN { // char ,
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        return { type: 'Delimiter', precedence: 11, value: ',', line }
    }

    function stateReadSemicolon () : PRE_TOKEN { // char ;
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        return { type: 'Terminator', precedence: 12, value: ';', line }
    }

    function stateReadColon () : PRE_TOKEN { // char :
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        return { type: 'Colon', precedence: 0, value: ':', line }
    }

    function stateReadRecursive () : PRE_TOKEN { // chars { } ( ) [ ]
        const line = `${streamCurrentLine}:${streamCurrentCol}`
        return { type: 'PreToken', precedence: -1, value: streamRead(), line }
    }

    function isBinaryOperator () {
        if (preTokens.length === 0) {
            return false
        }
        switch (preTokens[preTokens.length - 1].type) {
        case 'PreToken':
            switch (preTokens[preTokens.length - 1].value) {
            case ']':
            case ')':
                return true
            }
            return false
        case 'Variable':
        case 'Constant':
        case 'SetUnaryOperator':
            return true
        }
        return false
    }

    return tokenizerMain()
}
