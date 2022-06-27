import { assertNotEqual } from '../repository/repository'

type PREPROCESSOR_RULE = {
    regex: RegExp
    type: 'DEFINE_NULL' | 'DEFINE_MACRO' | 'DEFINE_VAL' | 'UNDEF' | 'IFDEF' | 'IFNDEF' | 'ELSE' | 'ENDIF' | 'MATCHES_REMAINING'
}
type IF_INFO = {
    active: boolean
    flipped: boolean
}
type REPLACEMENTS = {
    cname: string
    regex: RegExp
    value: string
    macro?: string
}
type PROCESSED_RULE = {
    Code: PREPROCESSOR_RULE
    parts: RegExpExecArray
}

/**
 * Process macro substitutions on source code
 * @param sourcecode Source code input
 * @returns preprocessed string
 */
export default function preprocessor (sourcecode: string) : string {
    const preprocessorCodes: PREPROCESSOR_RULE[] = [
        // Regex order is important!
        { regex: /^\s*#\s*define\s+(\w+)\s*$/, type: 'DEFINE_NULL' },
        { regex: /^\s*#\s*define\s+(\w+)\s*(\([^)]*\))\s*(\(.+\))\s*$/, type: 'DEFINE_MACRO' },
        { regex: /^\s*#\s*define\s+(\w+\b)(.+)$/, type: 'DEFINE_VAL' },
        { regex: /^\s*#\s*undef\s+(\w+)\s*$/, type: 'UNDEF' },
        { regex: /^\s*#\s*ifdef\s+(\w+)\s*$/, type: 'IFDEF' },
        { regex: /^\s*#\s*ifndef\s+(\w+)\s*$/, type: 'IFNDEF' },
        { regex: /^\s*#\s*else\s*$/, type: 'ELSE' },
        { regex: /^\s*#\s*endif\s*$/, type: 'ENDIF' },
        { regex: /^[\s\S]*$/, type: 'MATCHES_REMAINING' }
    ]
    let preprocessorReplacements: REPLACEMENTS[] = [
        { cname: 'true', regex: /\btrue\b/, value: '1' },
        { cname: 'false', regex: /\bfalse\b/, value: '0' },
        { cname: 'NULL', regex: /\bNULL\b/, value: '(void *)(0)' },
        { cname: 'SMARTC', regex: /\bSMARTC\b/, value: '' }
    ]
    const ifActive: IF_INFO[] = [{ active: true, flipped: false }]
    let currentIfLevel = 0

    function preprocessMain () : string {
        const sourceArray = sourcecode.split('\n')
        const lines = treatEscapedNewLines(sourceArray)
        const retLines = lines.map(processLine)
        if (ifActive.length !== 1) {
            throw new Error("At line: EOF. Unmatched directive '#ifdef' or '#ifndef'.")
        }
        if (ifActive[0].flipped === true) {
            throw new Error("At line: EOF. Unmatched directives '#else'.")
        }
        if (sourceArray.length !== retLines.length) {
            throw new Error('Internal error at preprocessor')
        }
        return retLines.join('\n')
    }

    function treatEscapedNewLines (src: string[]) : string[] {
        const retArr : string [] = []
        let escapedLines = 0
        src.forEach((line, index) => {
            if (line.endsWith('\\')) {
                if (escapedLines === 0) {
                    escapedLines = 1
                    retArr.push(line.slice(0, -1))
                } else {
                    retArr[retArr.length - 1] += line.slice(0, -1)
                    escapedLines++
                }
            } else {
                if (escapedLines !== 0) {
                    retArr[retArr.length - 1] += line
                    retArr.push(...Array(escapedLines).fill(''))
                    escapedLines = 0
                } else {
                    retArr.push(line)
                }
            }
        })
        if (escapedLines > 1) {
            retArr.push(...Array(escapedLines - 1).fill(''))
        }
        return retArr
    }

    function getPrepRule (codeline: string) : PROCESSED_RULE {
        for (const CurrRule of preprocessorCodes) {
            const parts = CurrRule.regex.exec(codeline)
            if (parts !== null) {
                return {
                    Code: CurrRule,
                    parts: parts
                }
            }
        }
        // Never reached code
        throw new Error('Internal error.')
    }

    function replaceDefines (codeline: string, lineNo: number) : string {
        let retLine = codeline
        preprocessorReplacements.forEach((Replacement) => {
            if (Replacement.macro) {
                while (true) {
                    const foundCname = Replacement.regex.exec(retLine)
                    if (foundCname === null) {
                        return
                    }
                    let replaced = Replacement.macro
                    const currExtArgs = extractArgs(retLine, foundCname.index + 1, lineNo)
                    const origExtArgs = extractArgs(Replacement.value, 0, lineNo)
                    if (origExtArgs.argArray.length !== currExtArgs.argArray.length) {
                        throw new Error(`At line: ${lineNo + 1}. ` +
                            `Wrong number of arguments for macro '${Replacement.cname}'. ` +
                            `Expected ${origExtArgs.argArray.length}, got ${currExtArgs.argArray.length}.`)
                    }
                    for (let currArg = 0; currArg < origExtArgs.argArray.length; currArg++) {
                        replaced = replaced.replace(new RegExp(`\\b${origExtArgs.argArray[currArg]}\\b`, 'g'), currExtArgs.argArray[currArg])
                    }
                    retLine = retLine.slice(0, foundCname.index) + replaced + retLine.slice(currExtArgs.endPosition)
                }
            }
            retLine = retLine.replace(Replacement.regex, Replacement.value)
        })
        return retLine
    }

    function extractArgs (fnArgString: string, needle: number, line: number): { argArray: string[], endPosition: number} {
        const argArray : string [] = []
        let currArg: string = ''
        let pLevel = 0
        let started = false
        for (;;needle++) {
            const currChar = fnArgString.charAt(needle)
            if (currChar === '') {
                throw new Error(`At line: ${line + 1}. Unmatched parenthesis or unexpected end of line.`)
            }
            if (currChar === '(') {
                pLevel++
                if (pLevel === 1) {
                    started = true
                    continue
                }
            }
            if (!started) continue
            if (currChar === ')') {
                pLevel--
                if (pLevel === 0) {
                    const endArg = currArg.trim()
                    if (endArg.length === 0 && argArray.length !== 0) {
                        throw new Error(`At line: ${line + 1}. Found empty argument on macro declaration.`)
                    }
                    if (endArg.length !== 0) {
                        argArray.push(currArg.trim())
                    }
                    break
                }
            }
            if (currChar === ',' && pLevel === 1) {
                const newArg = currArg.trim()
                if (newArg.length === 0) {
                    throw new Error(`At line: ${line + 1}. Found empty argument on macro declaration.`)
                }
                argArray.push(currArg.trim())
                currArg = ''
                continue
            }
            currArg += currChar
        }
        return {
            argArray,
            endPosition: needle + 1
        }
    }

    function processLine (currentLine: string, lineNo: number) : string {
        const PrepRule = getPrepRule(currentLine)
        const IfTemplateObj = { active: true, flipped: false }
        let idx: number
        if (currentIfLevel < 0) {
            throw new Error(`At line: ${lineNo + 1}. Unmatched '#endif' directive.`)
        }
        assertNotEqual(ifActive.length, 0, 'Internal error')
        const LastIfInfo = ifActive[ifActive.length - 1]
        const lineActive = ifActive[currentIfLevel].active
        // Process rules that depend on lineActive
        switch (PrepRule.Code.type) {
        case 'IFDEF':
            currentIfLevel += lineActive ? 1 : 0
            idx = preprocessorReplacements.findIndex(Obj => Obj.cname === PrepRule.parts[1])
            if (idx === -1) {
                IfTemplateObj.active = false
            }
            ifActive.push(IfTemplateObj)
            return ''
        case 'IFNDEF':
            currentIfLevel += lineActive ? 1 : 0
            idx = preprocessorReplacements.findIndex(Obj => Obj.cname === PrepRule.parts[1])
            if (idx !== -1) {
                IfTemplateObj.active = false
            }
            ifActive.push(IfTemplateObj)
            return ''
        case 'ELSE':
            if (LastIfInfo.flipped === true) {
                throw new Error(`At line: ${lineNo + 1}. Unmatched '#else' directive.`)
            }
            LastIfInfo.flipped = true
            LastIfInfo.active = !LastIfInfo.active
            return ''
        case 'ENDIF':
            if (ifActive.length - 1 === currentIfLevel) {
                currentIfLevel--
            }
            ifActive.pop()
            return ''
        }
        if (lineActive === false) {
            return ''
        }
        // Process rules that does not depend on lineActive
        switch (PrepRule.Code.type) {
        case 'DEFINE_NULL':
            idx = preprocessorReplacements.findIndex(Obj => Obj.cname === PrepRule.parts[1])
            if (idx === -1) {
                preprocessorReplacements.push({
                    cname: PrepRule.parts[1],
                    regex: new RegExp('\\b' + PrepRule.parts[1] + '\\b', 'g'),
                    value: ''
                })
                return ''
            }
            preprocessorReplacements[idx].value = ''
            return ''
        case 'DEFINE_VAL':
            idx = preprocessorReplacements.findIndex(Obj => Obj.cname === PrepRule.parts[1])
            if (idx === -1) {
                preprocessorReplacements.push({
                    cname: PrepRule.parts[1],
                    regex: new RegExp('\\b' + PrepRule.parts[1] + '\\b', 'g'),
                    value: replaceDefines(PrepRule.parts[2], lineNo).trim()
                })
                return ''
            }
            preprocessorReplacements[idx].value = replaceDefines(PrepRule.parts[2], lineNo).trim()
            return ''
        case 'DEFINE_MACRO':
            idx = preprocessorReplacements.findIndex(Obj => Obj.cname === PrepRule.parts[1])
            if (idx !== -1) {
                throw new Error(`At line: ${lineNo + 1}. Cannot redefine macro '${PrepRule.parts[1]}'.`)
            }
            preprocessorReplacements.push({
                cname: PrepRule.parts[1],
                regex: new RegExp(`\\b${PrepRule.parts[1]}\\s*\\(`, 'g'),
                value: replaceDefines(PrepRule.parts[2], lineNo),
                macro: replaceDefines(PrepRule.parts[3], lineNo)
            })
            return ''
        case 'UNDEF':
            preprocessorReplacements = preprocessorReplacements.filter(obj => obj.cname !== PrepRule.parts[1])
            return ''
        case 'MATCHES_REMAINING':
            return replaceDefines(currentLine, lineNo)
        default:
            // Never reached code.
            throw new Error('Internal error.')
        }
    }

    return preprocessMain()
}
