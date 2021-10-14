// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

/**
 * Process macro substitutions on source code
 * @param sourcecode Source code input
 * @returns preprocessed string
 */
// eslint-disable-next-line no-unused-vars
function preprocess (sourcecode: string) {
    const preprocessorCodes: {
        regex: RegExp
        type: 'DEFINE_NULL' | 'DEFINE_VAL' | 'UNDEF' | 'IFDEF' | 'IFNDEF' | 'ELSE' | 'ENDIF'
    } [] = [
        // Regex order is important!
        { regex: /^\s*#\s*define\s+(\w+)\s*$/, type: 'DEFINE_NULL' },
        { regex: /^\s*#\s*define\s+(\w+\b)(.+)$/, type: 'DEFINE_VAL' },
        { regex: /^\s*#\s*undef\s+(\w+)\s*$/, type: 'UNDEF' },
        { regex: /^\s*#\s*ifdef\s+(\w+)\s*$/, type: 'IFDEF' },
        { regex: /^\s*#\s*ifndef\s+(\w+)\s*$/, type: 'IFNDEF' },
        { regex: /^\s*#\s*else\s*$/, type: 'ELSE' },
        { regex: /^\s*#\s*endif\s*$/, type: 'ENDIF' }
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
        return null
    }

    function replaceDefines (codeline: string) {
        preprocessorReplacements.forEach(function (replacement) {
            const rep = new RegExp('\\b' + replacement.cname + '\\b', 'g')
            codeline = codeline.replace(rep, replacement.value)
        })

        return codeline
    }

    const lines = sourcecode.split('\n')
    const ret: string[] = []

    lines.forEach((currentLine, lineNo) => {
        const PrepRule = getPrepRule(currentLine)
        const lineActive = ifActive[currentIfLevel].active
        let idx: number
        if (PrepRule === null) {
            if (lineActive) {
                ret.push(replaceDefines(currentLine))
            } else {
                // push empty line so line numbers will not be messed
                ret.push('')
            }
            return
        }
        switch (PrepRule.Code.type) {
        case 'DEFINE_NULL':
            if (lineActive === false) break
            idx = preprocessorReplacements.findIndex(obj => obj.cname === PrepRule.parts[1])
            if (idx === -1) {
                preprocessorReplacements.push({ cname: PrepRule.parts[1], value: '' })
            } else {
                preprocessorReplacements[idx].value = ''
            }
            break
        case 'DEFINE_VAL':
            if (lineActive === false) break
            idx = preprocessorReplacements.findIndex(obj => obj.cname === PrepRule.parts[1])
            if (idx === -1) {
                preprocessorReplacements.push({ cname: PrepRule.parts[1], value: replaceDefines(PrepRule.parts[2]) })
            } else {
                preprocessorReplacements[idx].value = PrepRule.parts[2]
            }
            break
        case 'UNDEF':
            if (lineActive === false) break
            preprocessorReplacements = preprocessorReplacements.filter(obj => obj.cname !== PrepRule.parts[1])
            break
        case 'IFDEF':
            if (lineActive) currentIfLevel++
            idx = preprocessorReplacements.findIndex(obj => obj.cname === PrepRule.parts[1])
            if (idx !== -1) ifActive.push({ active: true, flipped: false })
            else ifActive.push({ active: false, flipped: false })
            break
        case 'IFNDEF':
            if (lineActive) currentIfLevel++
            idx = preprocessorReplacements.findIndex(obj => obj.cname === PrepRule.parts[1])
            if (idx === -1) ifActive.push({ active: true, flipped: false })
            else ifActive.push({ active: false, flipped: false })
            break
        case 'ELSE': {
            idx = preprocessorReplacements.findIndex(obj => obj.cname === PrepRule.parts[1])
            const lastIfInfo = ifActive.pop()
            if (lastIfInfo === undefined) throw new SyntaxError(`At line: ${lineNo + 1}. Unmatched '#else' directive.`)
            if (lastIfInfo.flipped === true) throw new SyntaxError(`At line: ${lineNo + 1}. Unmatched '#else' directive.`)
            ifActive.push({ active: !lastIfInfo.active, flipped: true })
            if (ifActive.length === 1) {
                throw new SyntaxError(`At line: ${lineNo + 1}. '#else' directive not associated with '#ifdef', '#ifndef' nor '#if'.`)
            }
            break
        }
        case 'ENDIF':
            if (ifActive.length - 1 === currentIfLevel) currentIfLevel--
            ifActive.pop()
            if (ifActive.length === 0) {
                throw new SyntaxError(`At line: ${lineNo + 1}. '#endif' directive not associated with '#ifdef', '#ifndef' nor '#if'.`)
            }
            break
        default:
                // not implementd
        }
        // push empty line so line numbers will not be messed
        ret.push('')
    })

    if (ifActive.length !== 1) {
        throw new SyntaxError("At line: EOF. Unmatched directives '#ifdef', '#ifndef' nor '#if'.")
    }

    return ret.join('\n')
}
