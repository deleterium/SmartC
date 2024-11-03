import { BitField, ReedSalomonAddressDecode, STREAM_PAIR, StringStream, parseDecimalNumber, stringToHexstring } from '../repository/repository'
import { CONTRACT } from '../typings/contractTypes'
import { PRE_TOKEN } from '../typings/syntaxTypes'

/**
 * Transforms inputSourceCode into an array of pre tokens.
 * This array is not recursive.
 * @param inputSourceCode source code text
 * @returns array of pre tokens
 */
export default function tokenizer (Program: CONTRACT, inputSourceCode: string): PRE_TOKEN[] {
    const preTokens: PRE_TOKEN[] = []
    let detectionHasFixed: boolean = false
    let detectionHasAutoCounter: boolean = false
    const Stream = new StringStream(inputSourceCode)

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
        } while (!Stream.EOF())
        return preTokens
    }

    function stateStart () : PRE_TOKEN | undefined {
        let current: STREAM_PAIR
        while (true) {
            current = Stream.advance()
            if (current.char === undefined) {
                return undefined
            }
            if (BitField.typeTable[current.code] & BitField.isBlank) {
                continue
            }
            const nextStateFunction = startStateFunctionTable[current.code]
            if (nextStateFunction) {
                return nextStateFunction()
            }
            throw new Error(Program.Context.formatError(Stream.lineCol,
                `Invalid character '${current.char}' found.`))
        }
    }

    function stateReadDot () : PRE_TOKEN { // char .
        const tokenLineCol = Stream.lineCol
        const next = Stream.testNext()
        if (next.char && BitField.typeTable[next.code] & BitField.isDigit) {
            return stateReadNumber()
        }
        return { type: 'Member', precedence: 0, value: '.', line: tokenLineCol }
    }

    function stateReadWord () : PRE_TOKEN {
        const tokenLineCol = Stream.lineCol
        const tokenStartIndex = Stream.index
        let current: STREAM_PAIR
        do {
            current = Stream.advance()
        } while (current.char && BitField.typeTable[current.code] & BitField.isWord)
        const tokenValue = inputSourceCode.slice(tokenStartIndex, Stream.index)
        Stream.rewind()
        return stateCheckWord(tokenValue, tokenLineCol)
    }

    function stateCheckWord (tokenValue: string, lineCol: string) : PRE_TOKEN {
        if (easyKeywordTokens.includes(tokenValue)) {
            if (!detectionHasFixed && tokenValue === 'fixed') {
                detectionHasFixed = true
                Program.Context.TokenizerDetection.hasFixed = true
            }
            return { type: 'Keyword', precedence: 12, value: tokenValue, line: lineCol }
        }
        switch (tokenValue) {
        case 'sizeof':
            return { type: 'Keyword', precedence: 2, value: tokenValue, line: lineCol }
        case 'asm':
            return stateReadAsmStart()
        case 'struct':
            return stateReadStructStart()
        }
        if (!detectionHasAutoCounter && (tokenValue === 'getNextTx' || tokenValue === 'getNextTxFromBlockheight')) {
            detectionHasAutoCounter = true
            Program.Context.TokenizerDetection.hasAutoCounter = true
        }
        return { type: 'Variable', precedence: 0, value: tokenValue, line: lineCol }
    }

    function stateReadAsmStart () : PRE_TOKEN {
        const tokenLineCol = Stream.lineCol
        let current: STREAM_PAIR
        do {
            current = Stream.advance()
            if (current.char === undefined) {
                throw new Error(Program.Context.formatError(tokenLineCol,
                    "Invalid asm { ... } sentence. Expecting '{', found end of file."))
            }
            if (BitField.typeTable[current.code] & BitField.isBlank) {
                continue
            }
            if (current.char === '{') {
                return stateReadAsmBrackets()
            }
            throw new Error(Program.Context.formatError(Stream.lineCol,
                `Invalid asm { ... } sentence. Expecting '{', found '${current.char}'.`))
        } while (true)
    }

    function stateReadAsmBrackets () : PRE_TOKEN {
        const line = Stream.lineCol
        const tokenStartIndex = Stream.index
        let current: STREAM_PAIR
        do {
            current = Stream.advance()
            if (current.char === undefined) {
                throw new Error(Program.Context.formatError(line,
                    "Invalid asm { ... } sentence. Expecting '}', found end of file."))
            }
        } while (current.char !== '}')
        const tokenValue = inputSourceCode.slice(tokenStartIndex + 1, Stream.index)
        return { type: 'Keyword', precedence: 12, value: 'asm', line, extValue: tokenValue }
    }

    function stateReadStructStart () : PRE_TOKEN {
        const line = Stream.lineCol
        const nextToken = stateStart()
        if (nextToken === undefined) {
            throw new Error(Program.Context.formatError(line,
                'struct sentence. Expecting a type name, but found EOF or comments.'))
        }
        if (nextToken.type === 'Variable') {
            return { type: 'Keyword', precedence: 12, value: 'struct', line, extValue: nextToken.value }
        }
        throw new Error(Program.Context.formatError(Stream.lineCol,
            `Invalid struct sentence. Expecting a type name, found '${nextToken.value}'`))
    }

    function stateReadNumber () : PRE_TOKEN {
        const line = Stream.lineCol
        const tokenStartIndex = Stream.index
        let current: STREAM_PAIR
        do {
            current = Stream.advance()
        } while (current.char && BitField.typeTable[current.code] & BitField.isNumber)
        const tokenValue = inputSourceCode.slice(tokenStartIndex, Stream.index)
        Stream.rewind()

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
        const line = Stream.lineCol
        const tokenStartIndex = Stream.index
        let current = Stream.advance()
        if (current.char !== 'x' && current.char !== 'X') {
            Stream.rewind()
            return stateReadNumber()
        }
        do {
            current = Stream.advance()
        } while (BitField.typeTable[current.code] & BitField.isNumberHex)
        const tokenValue = inputSourceCode.slice(tokenStartIndex + 2, Stream.index)
        Stream.rewind()

        let val = tokenValue.replace(/_/g, '').toLowerCase()
        val = val.padStart((Math.floor((val.length - 1) / 16) + 1) * 16, '0')
        return { type: 'Constant', precedence: 0, value: val, line, extValue: 'long' }
    }

    function stateSlashStart () : PRE_TOKEN | undefined {
        const line = Stream.lineCol
        const current = Stream.advance()
        switch (current.char) {
        case '/':
            return stateReadCommentSingleLine()
        case '*':
            return stateReadCommentMultiLine()
        case '=':
            return { type: 'SetOperator', precedence: 10, value: '/=', line }
        }
        Stream.rewind()
        return { type: 'Operator', precedence: 3, value: '/', line }
    }

    function stateReadCommentSingleLine () : undefined {
        let current: STREAM_PAIR
        do {
            current = Stream.advance()
        } while (current.char && current.code !== '\n'.charCodeAt(0))
        return undefined
    }

    function stateReadCommentMultiLine () : undefined {
        const tokenLine = Stream.line
        const tokenCol = Stream.col
        let current: STREAM_PAIR
        while (true) {
            current = Stream.advance()
            if (current.char === undefined) {
                throw new Error(Program.Context.formatError(tokenLine + ':' + (tokenCol - 1),
                    "End of file reached while trying to find '*/' to end this comment section."))
            }
            if (current.char === '*') {
                current = Stream.advance()
                if (current.char === '/') {
                    return undefined
                }
            }
        }
    }

    function stateReadMacro () : undefined {
        const line = Stream.lineCol
        const tokenStartIndex = Stream.index
        let current: STREAM_PAIR
        while (true) {
            current = Stream.advance()
            if (BitField.typeTable[current.code] & BitField.isDigit) {
                continue
            }
            if (current.char === '#') {
                break
            }
            throw new Error(Program.Context.formatError(line, 'Wrong use of preprocessor directive'))
        }
        const tokenValue = inputSourceCode.slice(tokenStartIndex + 1, Stream.index)
        Stream.col = parseInt(tokenValue)
        return undefined
    }

    function stateReadString () : PRE_TOKEN {
        const delimitator = Stream.read()
        const line = Stream.lineCol
        const tokenStartIndex = Stream.index
        let current: STREAM_PAIR
        do {
            current = Stream.advance()
            if (current.char === '\\') {
                current = Stream.advance()
                if (current.char === delimitator.char) {
                    // escaped quote, read next
                    current = Stream.advance()
                }
            }
            if (current.char === undefined) {
                throw new Error(Program.Context.formatError(line,
                    `End of file reached while trying to find \`${delimitator}\` string delimitator.`))
            }
        } while (current.char !== delimitator.char)
        const tokenValue = inputSourceCode.slice(tokenStartIndex + 1, Stream.index)

        let val = stringToHexstring(tokenValue, line)
        const parts = /^(BURST-|S-|TS-)([0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{5})/.exec(tokenValue)
        if (parts !== null) {
            val = ReedSalomonAddressDecode(parts[2], line)
        }
        return { type: 'Constant', precedence: 0, value: val, line }
    }

    function stateReadStar () : PRE_TOKEN { // char *
        const line = Stream.lineCol
        const current = Stream.advance()
        if (current.char === '=') {
            return { type: 'SetOperator', precedence: 10, value: '*=', line }
        }
        if (current.char === '/') {
            throw new Error(Program.Context.formatError(line, 'Ending a comment that was not started.'))
        }
        Stream.rewind()
        if (isBinaryOperator()) {
            return { type: 'Operator', precedence: 3, value: '*', line }
        }
        return { type: 'UnaryOperator', precedence: 2, value: '*', line }
    }

    function stateReadLess () : PRE_TOKEN { // char <
        const line = Stream.lineCol
        let current = Stream.advance()
        if (current.char === '<') {
            current = Stream.advance()
            if (current.char === '=') {
                return { type: 'SetOperator', precedence: 10, value: '<<=', line }
            }
            Stream.rewind()
            return { type: 'Operator', precedence: 5, value: '<<', line }
        }
        if (current.char === '=') {
            return { type: 'Comparision', precedence: 6, value: '<=', line }
        }
        Stream.rewind()
        return { type: 'Comparision', precedence: 6, value: '<', line }
    }

    function stateReadEqual () : PRE_TOKEN { // char =
        const line = Stream.lineCol
        const current = Stream.advance()
        if (current.char === '=') {
            return { type: 'Comparision', precedence: 6, value: '==', line }
        }
        Stream.rewind()
        return { type: 'Assignment', precedence: 10, value: '=', line }
    }

    function stateReadGreater () : PRE_TOKEN { // char >
        const line = Stream.lineCol
        let current = Stream.advance()
        if (current.char === '>') {
            current = Stream.advance()
            if (current.char === '=') {
                return { type: 'SetOperator', precedence: 10, value: '>>=', line }
            }
            Stream.rewind()
            return { type: 'Operator', precedence: 5, value: '>>', line }
        }
        if (current.char === '=') {
            return { type: 'Comparision', precedence: 6, value: '>=', line }
        }
        Stream.rewind()
        return { type: 'Comparision', precedence: 6, value: '>', line }
    }

    function stateReadPlus () : PRE_TOKEN { // char +
        const line = Stream.lineCol
        const current = Stream.advance()
        if (current.char === '+') {
            return { type: 'SetUnaryOperator', precedence: 1, value: '++', line }
        }
        if (current.char === '=') {
            return { type: 'SetOperator', precedence: 10, value: '+=', line }
        }
        Stream.rewind()
        if (isBinaryOperator()) {
            return { type: 'Operator', precedence: 4, value: '+', line }
        }
        return { type: 'UnaryOperator', precedence: 2, value: '+', line }
    }

    function stateReadMinus () : PRE_TOKEN { // char -
        const line = Stream.lineCol
        const current = Stream.advance()
        switch (current.char) {
        case '-':
            return { type: 'SetUnaryOperator', precedence: 1, value: '--', line }
        case '=':
            return { type: 'SetOperator', precedence: 10, value: '-=', line }
        case '>':
            return { type: 'Member', precedence: 0, value: '->', line }
        }
        Stream.rewind()
        if (isBinaryOperator()) {
            return { type: 'Operator', precedence: 4, value: '-', line }
        }
        return { type: 'UnaryOperator', precedence: 2, value: '-', line }
    }

    function stateReadAnd () : PRE_TOKEN { // char &
        const line = Stream.lineCol
        const current = Stream.advance()
        if (current.char === '&') {
            return { type: 'Comparision', precedence: 8, value: '&&', line }
        }
        if (current.char === '=') {
            return { type: 'SetOperator', precedence: 10, value: '&=', line }
        }
        Stream.rewind()
        if (isBinaryOperator()) {
            return { type: 'Operator', precedence: 7, value: '&', line }
        }
        return { type: 'UnaryOperator', precedence: 2, value: '&', line }
    }

    function stateReadPipe () : PRE_TOKEN { // char |
        const line = Stream.lineCol
        const current = Stream.advance()
        if (current.char === '|') {
            return { type: 'Comparision', precedence: 9, value: '||', line }
        }
        if (current.char === '=') {
            return { type: 'SetOperator', precedence: 10, value: '|=', line }
        }
        Stream.rewind()
        return { type: 'Operator', precedence: 7, value: '|', line }
    }

    function stateReadCaret () : PRE_TOKEN { // char ^
        const line = Stream.lineCol
        const current = Stream.advance()
        if (current.char === '=') {
            return { type: 'SetOperator', precedence: 10, value: '^=', line }
        }
        Stream.rewind()
        return { type: 'Operator', precedence: 7, value: '^', line }
    }

    function stateReadPercent () : PRE_TOKEN { // char %
        const line = Stream.lineCol
        const current = Stream.advance()
        if (current.char === '=') {
            return { type: 'SetOperator', precedence: 10, value: '%=', line }
        }
        Stream.rewind()
        return { type: 'Operator', precedence: 3, value: '%', line }
    }

    function stateReadExclamation () : PRE_TOKEN { // char !
        const line = Stream.lineCol
        const current = Stream.advance()
        if (current.char === '=') {
            return { type: 'Comparision', precedence: 6, value: '!=', line }
        }
        Stream.rewind()
        return { type: 'UnaryOperator', precedence: 2, value: '!', line }
    }

    function stateReadTilde () : PRE_TOKEN { // char ~
        const line = Stream.lineCol
        return { type: 'UnaryOperator', precedence: 2, value: '~', line }
    }

    function stateReadComma () : PRE_TOKEN { // char ,
        const line = Stream.lineCol
        return { type: 'Delimiter', precedence: 11, value: ',', line }
    }

    function stateReadSemicolon () : PRE_TOKEN { // char ;
        const line = Stream.lineCol
        return { type: 'Terminator', precedence: 12, value: ';', line }
    }

    function stateReadColon () : PRE_TOKEN { // char :
        const line = Stream.lineCol
        return { type: 'Colon', precedence: 0, value: ':', line }
    }

    function stateReadRecursive () : PRE_TOKEN { // chars { } ( ) [ ]
        const line = Stream.lineCol
        return { type: 'PreToken', precedence: -1, value: Stream.read().char, line }
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
