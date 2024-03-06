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
        { cname: 'true', regex: /\btrue\b/g, value: '1' },
        { cname: 'false', regex: /\bfalse\b/g, value: '0' },
        { cname: 'NULL', regex: /\bNULL\b/g, value: '(void *)(0)' },
        { cname: 'SMARTC', regex: /\bSMARTC\b/g, value: '' }
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
        src.forEach((line) => {
            if (line.endsWith('\\')) {
                if (escapedLines === 0) {
                    escapedLines = 1
                    retArr.push(line.slice(0, -1))
                } else {
                    retArr[retArr.length - 1] += line.slice(0, -1)
                    escapedLines++
                }
                return
            }
            if (escapedLines !== 0) {
                retArr[retArr.length - 1] += line
                retArr.push(...Array(escapedLines).fill(''))
                escapedLines = 0
            } else {
                retArr.push(line)
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
    /** Reads/verifies one macro token and add it into Program.Config object */
    function getBoolVal (currTokenLine: PREP_LINE) : boolean {
        switch (currTokenLine.value) {
        case undefined:
        case '':
        case 'true':
        case '1':
            return true
        case 'false':
        case '0':
            return false
        default:
            throw new Error(Program.Context.formatError(currTokenLine.line,
                `Macro: '#${currTokenLine.type} ${currTokenLine.property}' with wrong value. Please check valid values on Help page.`))
        }
    }

    /** Process all macro pragma options. */
    function processPragma (MacroToken: PREP_LINE) {
        const num = parseInt(MacroToken.value)
        switch (MacroToken.property) {
        case 'maxAuxVars':
            if (num >= 0 && num <= 10) {
                Program.Config.maxAuxVars = num
                return
            }
            throw new Error(Program.Context.formatError(MacroToken.line, 'Value out of permitted range 1..10.'))
        case 'maxConstVars':
            if (num >= 0 && num <= 10) {
                Program.Config.maxConstVars = num
                return
            }
            throw new Error(Program.Context.formatError(MacroToken.line, 'Value out of permitted range 0..10.'))
        case 'reuseAssignedVar':
            Program.Config.reuseAssignedVar = getBoolVal(MacroToken)
            return
        case 'optimizationLevel':
            if (num >= 0 && num <= 4) {
                Program.Config.optimizationLevel = num
                return
            }
            throw new Error(Program.Context.formatError(MacroToken.line, 'Value out of permitted range 0..3.'))
        case 'version':
            // Nothing to do. 'version' is a reminder for programmers.
            return false
        case 'verboseAssembly':
            Program.Config.verboseAssembly = getBoolVal(MacroToken)
            return true
        case 'verboseScope':
            Program.Config.verboseScope = getBoolVal(MacroToken)
            return true
        default:
            throw new Error(Program.Context.formatError(MacroToken.line,
                `Unknow macro property: '#${MacroToken.type} ${MacroToken.property}'.` +
                ' Please check valid values on Help page'))
        }
    }

    /** Process all macro Program options */
    function processProgram (MacroToken: PREP_LINE) : void {
        switch (MacroToken.property) {
        case 'name':
            if (/^[0-9a-zA-Z]{1,30}$/.test(MacroToken.value)) {
                Program.Config.PName = MacroToken.value
                return
            }
            throw new Error(Program.Context.formatError(MacroToken.line,
                'Program name must contains only letters [a-z][A-Z][0-9], from 1 to 30 chars.'))
        case 'description':
            if (MacroToken.value.length >= 1000) {
                throw new Error(Program.Context.formatError(MacroToken.line,
                    `Program description max lenght is 1000 chars. It is ${MacroToken.value.length} chars.`))
            }
            Program.Config.PDescription = MacroToken.value
            return
        case 'activationAmount':
            Program.Config.PActivationAmount = parseDecimalNumber(MacroToken.value, MacroToken.line).value.toString(10)
            return
        case 'creator':
            Program.Config.PCreator = parseDecimalNumber(MacroToken.value, MacroToken.line).value.toString(10)
            return
        case 'contract':
            Program.Config.PContract = parseDecimalNumber(MacroToken.value, MacroToken.line).value.toString(10)
            return
        case 'userStackPages':
            if (/^\d\s*$|^10\s*$/.test(MacroToken.value)) {
                Program.Config.PUserStackPages = Number(MacroToken.value)
                return
            }
            throw new Error(Program.Context.formatError(MacroToken.line,
                'Program user stack pages must be a number between 0 and 10, included.'))
        case 'codeStackPages':
            if (/^\d\s*$|^10\s*$/.test(MacroToken.value)) {
                Program.Config.PCodeStackPages = Number(MacroToken.value)
                return
            }
            throw new Error(Program.Context.formatError(MacroToken.line,
                'Program code stack pages must be a number between 0 and 10, included.'))
        case 'codeHashId':
            if (/^\d+\s*$/.test(MacroToken.value)) {
                Program.Config.PCodeHashId = MacroToken.value.trim()
                return
            }
            throw new Error(Program.Context.formatError(MacroToken.line,
                'Program code hash id must be a decimal number. Use 0 to let compiler fill the value at assembly output.'))
        case 'compilerVersion':
            // Nothing to do. compilerVersion is a reminder for programmers.
            break
        default:
            throw new Error(Program.Context.formatError(MacroToken.line,
                `Unknow macro property: '#${MacroToken.type} ${MacroToken.property}'.` +
                ' Please check valid values on Help page'))
        }
    }

    return preprocessMain()
}
