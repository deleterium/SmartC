// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

/*  Keywords forbidden:
        auto, double, float, register, volatile
    Keywords not implemented:
        case, char, default, enum, extern,
        int, short, sizeof, signed, static,
        switch, typedef, union, unsigned
*/
import { assertExpression } from '../repository/repository'
import { PRE_TOKEN } from '../typings/syntaxTypes'

/**
 * Transforms inputSourceCode into an array of pre tokens.
 * This array is not recursive.
 * @param inputSourceCode source code text
 * @returns array of pre tokens
 */
export default function tokenize (inputSourceCode: string): PRE_TOKEN[] {
    type SIMPLE_PRETOKEN_SPECS = {
        char: string
        pretokenType: 'equal'|'star'|'not'|'bracket'|'minus'|'plus'|'backslash'|
        'forwardslash'|'dot'|'less'|'greater'|'pipe'|'and'|'percent'|'caret'|'comma'|
        'semi'|'tilde'|'grave'|'paren'|'colon'|'curly'|'SPECIAL'
    }
    const simpleTokensSpecs : SIMPLE_PRETOKEN_SPECS[] = [
        { char: '=', pretokenType: 'equal' },
        { char: '*', pretokenType: 'star' },
        { char: '!', pretokenType: 'not' },
        { char: '[', pretokenType: 'bracket' },
        { char: ']', pretokenType: 'bracket' },
        { char: '-', pretokenType: 'minus' },
        { char: '+', pretokenType: 'plus' },
        { char: '\\', pretokenType: 'backslash' },
        { char: '/', pretokenType: 'forwardslash' },
        { char: '.', pretokenType: 'dot' },
        { char: '<', pretokenType: 'less' },
        { char: '>', pretokenType: 'greater' },
        { char: '|', pretokenType: 'pipe' },
        { char: '&', pretokenType: 'and' },
        { char: '%', pretokenType: 'percent' },
        { char: '^', pretokenType: 'caret' },
        { char: ',', pretokenType: 'comma' },
        { char: ';', pretokenType: 'semi' },
        { char: '~', pretokenType: 'tilde' },
        { char: '`', pretokenType: 'grave' },
        { char: '(', pretokenType: 'paren' },
        { char: ')', pretokenType: 'paren' },
        { char: ':', pretokenType: 'colon' },
        { char: '{', pretokenType: 'curly' },
        { char: '}', pretokenType: 'curly' },
        { char: '#', pretokenType: 'SPECIAL' }
    ]

    type SINGLE_PRETOKEN_SPECS = {
            start: RegExp
            pretokenType: 'NONE'|'numberDec'|'numberHex'|'keyword'|'ASM'|'STRUCT'|'variable'
            addLength: number
    }
    const regexSingleTokensSpecs : SINGLE_PRETOKEN_SPECS[] = [
        { // comment single line
            start: /^(\/\/.*)/,
            pretokenType: 'NONE',
            addLength: 0
        },
        { // spaces, tabs, newlines
            start: /^(\s+)/,
            pretokenType: 'NONE',
            addLength: 0
        },
        { // decimal numbers
            start: /^(\d[\d_]*\b)/,
            pretokenType: 'numberDec',
            addLength: 0
        },
        { // hexadecimal numbers
            start: /^0[xX]([\da-fA-F][\da-fA-F_]*\b)/,
            pretokenType: 'numberHex',
            addLength: 2
        },
        { // regular keywords
            start: /^(break|const|continue|do|else|exit|for|goto|halt|if|long|return|sleep|void|while)\b/,
            pretokenType: 'keyword',
            addLength: 0
        },
        { // exception
            start: /^(asm)/,
            pretokenType: 'ASM',
            addLength: 0
        },
        { // exception
            start: /^(struct)/,
            pretokenType: 'STRUCT',
            addLength: 0
        },
        { // names for variables (or functions)
            start: /^(\w+)/,
            pretokenType: 'variable',
            addLength: 0
        }
    ]

    type DOUBLE_PRETOKEN_SPECS = {
            start: RegExp
            end: RegExp
            pretokenType: 'NONE' | 'string'
            startLength: number
            removeTrailing: number
            errorMsg: string
    }

    const regexDoubleTokensSpecs : DOUBLE_PRETOKEN_SPECS [] = [
        { // multi line comments
            start: /^\/\*/,
            end: /^([\s\S]*?\*\/)/,
            pretokenType: 'NONE',
            startLength: 2,
            removeTrailing: 0,
            errorMsg: "Missing '*/' to end comment section."
        },
        { // strings surrounded by double quotes
            start: /^"/,
            end: /^([\s\S]*?")/,
            pretokenType: 'string',
            startLength: 1,
            removeTrailing: 1,
            errorMsg: "Missing '\"' to end string."
        },
        { // strings surrounded by single quotes
            start: /^'/,
            end: /^([\s\S]*?')/,
            pretokenType: 'string',
            startLength: 1,
            removeTrailing: 1,
            errorMsg: "Missing \"'\" to end string."
        }
    ]

    const AuxVars : {
        currentChar: string
        remainingText: string
        current: number
        preTokens: PRE_TOKEN[]
        currentLine: number
    } = {
        currentChar: '',
        remainingText: '',
        current: 0,
        preTokens: [],
        currentLine: 1
    }

    function tokenizeMain () : PRE_TOKEN[] {
        while (AuxVars.current < inputSourceCode.length) {
            AuxVars.currentChar = inputSourceCode.charAt(AuxVars.current)
            AuxVars.remainingText = inputSourceCode.slice(AuxVars.current)
            // Resolve double regex preTokens
            if (regexDoubleTokensSpecs.find(findAndProcessDoubleTokens)) {
                continue
            }
            // Resolve single regex preTokens
            if (regexSingleTokensSpecs.find(findAndProcessSingleTokens)) {
                continue
            }
            // Resolve all simple preTokens
            if (simpleTokensSpecs.find(findAndProcessSimpleTokens)) {
                continue
            }
            throw new TypeError(`At line: ${AuxVars.currentLine}. Forbidden character found: '${AuxVars.currentChar}'.`)
        }
        return AuxVars.preTokens
    }

    function findAndProcessDoubleTokens (ruleN: DOUBLE_PRETOKEN_SPECS) {
        const startParts = ruleN.start.exec(AuxVars.remainingText)
        if (startParts === null) {
            return false
        }
        const endParts = ruleN.end.exec(AuxVars.remainingText.slice(ruleN.startLength))
        AuxVars.current += ruleN.startLength
        if (endParts === null) {
            throw new TypeError(`At line: ${AuxVars.currentLine}. ${ruleN.errorMsg}`)
        }
        if (ruleN.pretokenType === 'NONE') {
            AuxVars.currentLine += (endParts[1].match(/\n/g) || '').length
            AuxVars.current += endParts[1].length
            return true// breaks find function
        }
        AuxVars.preTokens.push({ type: ruleN.pretokenType, value: endParts[1].slice(0, -ruleN.removeTrailing), line: AuxVars.currentLine })
        AuxVars.currentLine += (endParts[1].match(/\n/g) || '').length
        AuxVars.current += endParts[1].length
        return true// breaks find function
    }

    function findAndProcessSingleTokens (ruleN: SINGLE_PRETOKEN_SPECS) {
        const startParts = ruleN.start.exec(AuxVars.remainingText)
        if (startParts === null) {
            return false
        }
        switch (ruleN.pretokenType) {
        case 'NONE':
            AuxVars.currentLine += (startParts[1].match(/\n/g) || '').length
            AuxVars.current += startParts[1].length + ruleN.addLength
            return true
        case 'ASM': {
            const asmParts = /^(asm[^\w]*\{)([\s\S]*)/.exec(AuxVars.remainingText)
            if (asmParts === null) {
                throw new TypeError(`At line: ${AuxVars.currentLine}. Error parsing 'asm { ... }' keyword`)
            }
            const endLocation = asmParts[2].indexOf('}')
            if (endLocation === -1) {
                throw new TypeError(`At line: ${AuxVars.currentLine}. Ending '}' not found for 'asm { ... }' keyword.`)
            }
            const asmText = asmParts[2].slice(0, endLocation)
            const asmCode = asmParts[1] + asmText + '}'
            AuxVars.preTokens.push({ type: 'keyword', value: 'asm', line: AuxVars.currentLine, extValue: asmText })
            AuxVars.currentLine += (asmCode.match(/\n/g) || '').length
            AuxVars.current += asmCode.length
            return true
        }
        case 'STRUCT': {
            const structParts = /^(struct\s+(\w+))/.exec(AuxVars.remainingText)
            if (structParts === null) {
                throw new TypeError(`At line: ${AuxVars.currentLine}. 'struct' keyword must be followed by a type name`)
            }
            AuxVars.preTokens.push({ type: 'keyword', value: 'struct', line: AuxVars.currentLine, extValue: structParts[2] })
            AuxVars.currentLine += (structParts[1].match(/\n/g) || '').length
            AuxVars.current += structParts[1].length
            return true
        }
        default:
            AuxVars.preTokens.push({ type: ruleN.pretokenType, value: startParts[1], line: AuxVars.currentLine })
            AuxVars.currentLine += (startParts[1].match(/\n/g) || '').length
            AuxVars.current += startParts[1].length + ruleN.addLength
            return true
        }
    }

    function findAndProcessSimpleTokens (item: SIMPLE_PRETOKEN_SPECS) : boolean {
        if (item.char !== AuxVars.currentChar) {
            return false
        }
        if (item.pretokenType === 'SPECIAL') {
            assertExpression(item.char === '#',
                'Internal error at tokenizer.')
            AuxVars.current++
            const lines = inputSourceCode.slice(AuxVars.current).split('\n')
            let i = 0; let val = ''
            for (; i < lines.length; i++) {
                val += lines[i]
                AuxVars.current += lines[i].length + 1 // newline!
                AuxVars.currentLine++
                if (lines[i].endsWith('\\')) {
                    val = val.slice(0, -1)
                    continue
                }
                break
            }
            AuxVars.preTokens.push({ type: 'macro', value: val, line: AuxVars.currentLine - i - 1 })
            return true
        }
        AuxVars.preTokens.push({ type: item.pretokenType, value: AuxVars.currentChar, line: AuxVars.currentLine })
        AuxVars.current++
        return true
    }

    return tokenizeMain()
}
