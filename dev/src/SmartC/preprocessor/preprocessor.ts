// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

/**
 * Process macro substitutions on source code
 * @param sourcecode Source code input
 * @returns preprocessed string
 */
export default function preprocess (sourcecode: string) {
    const preprocessorCodes: {
        regex: RegExp
        type: 'DEFINE_NULL' | 'DEFINE_VAL' | 'UNDEF' | 'IFDEF' | 'IFNDEF' | 'ELSE' | 'ENDIF' | 'MATCHES_ALL'
    } [] = [
        // Regex order is important!
        { regex: /^\s*#\s*define\s+(\w+)\s*$/, type: 'DEFINE_NULL' },
        { regex: /^\s*#\s*define\s+(\w+\b)(.+)$/, type: 'DEFINE_VAL' },
        { regex: /^\s*#\s*undef\s+(\w+)\s*$/, type: 'UNDEF' },
        { regex: /^\s*#\s*ifdef\s+(\w+)\s*$/, type: 'IFDEF' },
        { regex: /^\s*#\s*ifndef\s+(\w+)\s*$/, type: 'IFNDEF' },
        { regex: /^\s*#\s*else\s*$/, type: 'ELSE' },
        { regex: /^\s*#\s*endif\s*$/, type: 'ENDIF' },
        { regex: /^[\s\S]*$/, type: 'MATCHES_ALL' }
    ]
    let preprocessorReplacements = [
        { cname: 'true', value: '1' },
        { cname: 'false', value: '0' },
        { cname: 'NULL', value: '0' },
        { cname: 'SMARTC', value: '' }
    ]

    type IF_INFO = {
        active: boolean
        flipped: boolean
    }
    const ifActive: IF_INFO[] = [{ active: true, flipped: false }]
    let currentIfLevel = 0

    function preprocessMain () : string {
        const lines = sourcecode.split('\n')
        const retLines = lines.map(processLine)
        if (ifActive.length !== 1) {
            throw new Error("At line: EOF. Unmatched directive '#ifdef' or '#ifndef'.")
        }
        if (ifActive[0].flipped === true) {
            throw new Error("At line: EOF. Unmatched directives '#else'.")
        }
        return retLines.join('\n')
    }

    function getPrepRule (codeline: string) {
        for (const currCode of preprocessorCodes) {
            const parts = currCode.regex.exec(codeline)
            if (parts !== null) {
                return {
                    Code: currCode,
                    parts: parts
                }
            }
        }
        // Never reached code
        throw new Error('Internal error.')
    }

    function replaceDefines (codeline: string) {
        preprocessorReplacements.forEach(function (replacement) {
            const rep = new RegExp('\\b' + replacement.cname + '\\b', 'g')
            codeline = codeline.replace(rep, replacement.value)
        })
        return codeline
    }

    function processLine (currentLine: string, lineNo: number) : string {
        const PrepRule = getPrepRule(currentLine)
        const ifTemplateObj = { active: true, flipped: false }
        let idx: number

        if (currentIfLevel < 0) {
            throw new Error(`At line: ${lineNo}. Unmatched '#endif' directive.`)
        }
        if (ifActive.length === 0) {
            // Skew between currentIfLevel and ifActive.length
            throw new Error('Internal error.')
        }
        const lastIfInfo = ifActive[ifActive.length - 1]
        const lineActive = ifActive[currentIfLevel].active

        // Process rules that does not depend on lineActive
        switch (PrepRule.Code.type) {
        case 'IFDEF':
            currentIfLevel += lineActive ? 1 : 0
            idx = preprocessorReplacements.findIndex(obj => obj.cname === PrepRule.parts[1])
            if (idx === -1) {
                ifTemplateObj.active = false
            }
            ifActive.push(ifTemplateObj)
            return ''
        case 'IFNDEF':
            currentIfLevel += lineActive ? 1 : 0
            idx = preprocessorReplacements.findIndex(obj => obj.cname === PrepRule.parts[1])
            if (idx !== -1) {
                ifTemplateObj.active = false
            }
            ifActive.push(ifTemplateObj)
            return ''
        case 'ELSE':
            if (lastIfInfo.flipped === true) {
                throw new Error(`At line: ${lineNo + 1}. Unmatched '#else' directive.`)
            }
            lastIfInfo.flipped = true
            lastIfInfo.active = !lastIfInfo.active
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
        switch (PrepRule.Code.type) {
        case 'DEFINE_NULL':
            idx = preprocessorReplacements.findIndex(obj => obj.cname === PrepRule.parts[1])
            if (idx === -1) {
                preprocessorReplacements.push({ cname: PrepRule.parts[1], value: '' })
                return ''
            }
            preprocessorReplacements[idx].value = ''
            return ''
        case 'DEFINE_VAL':
            idx = preprocessorReplacements.findIndex(obj => obj.cname === PrepRule.parts[1])
            if (idx === -1) {
                preprocessorReplacements.push({ cname: PrepRule.parts[1], value: replaceDefines(PrepRule.parts[2]).trim() })
                return ''
            }
            preprocessorReplacements[idx].value = PrepRule.parts[2].trim()
            return ''
        case 'UNDEF':
            preprocessorReplacements = preprocessorReplacements.filter(obj => obj.cname !== PrepRule.parts[1])
            return ''
        case 'MATCHES_ALL':
            return replaceDefines(currentLine)
        default:
            // Never reached code.
            throw new Error('Internal error.')
        }
    }

    return preprocessMain()
}
