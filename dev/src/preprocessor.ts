// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

interface PREPROCESSOR_RULES {
    regex: RegExp
    type: 'DEFINE_NULL' | 'DEFINE_VAL' | 'UNDEF'
}

// Preprocessor function. Takes source code as input and returns it preprocessed
function preprocessor (sourcecode: string) {
    const PreprocessorCodes: PREPROCESSOR_RULES[] = [
        { regex: /^\s*#define\s+(\w+)\s*$/, type: 'DEFINE_NULL' },
        { regex: /^\s*#define\s+(\w+)\s+(.*)\s*$/, type: 'DEFINE_VAL' },
        { regex: /^\s*#undef\s+(\w+)\s*$/, type: 'UNDEF' }
    ]
    let PreprocessorReplacements = [
        { cname: 'true', value: '1' },
        { cname: 'false', value: '0' },
        { cname: 'NULL', value: '0' }
        // {cname: "SMARTC", value: ""},
    ]

    function getPrepRule (codeline: string) {
        let parts

        for (let i = 0; i < PreprocessorCodes.length; i++) {
            parts = PreprocessorCodes[i].regex.exec(codeline)
            if (parts !== null) {
                return {
                    Code: PreprocessorCodes[i],
                    parts: parts
                }
            }
        }
        return null
    }

    function replaceDefines (codeline: string) {
        PreprocessorReplacements.forEach(function (replacement) {
            const rep = new RegExp('\\b' + replacement.cname + '\\b', 'g')
            codeline = codeline.replace(rep, replacement.value)
        })

        return codeline
    }

    const lines = sourcecode.split('\n')
    const ret: string[] = []

    lines.forEach(currentLine => {
        const PrepRule = getPrepRule(currentLine)
        let idx: number
        if (PrepRule === null) {
            ret.push(replaceDefines(currentLine))
            return
        }
        switch (PrepRule.Code.type) {
        case 'DEFINE_NULL':
            idx = PreprocessorReplacements.findIndex(obj => obj.cname === PrepRule.parts[1])
            if (idx === -1) {
                PreprocessorReplacements.push({ cname: PrepRule.parts[1], value: '' })
            } else {
                PreprocessorReplacements[idx].value = ''
            }
            break
        case 'DEFINE_VAL':
            idx = PreprocessorReplacements.findIndex(obj => obj.cname === PrepRule.parts[1])
            if (idx === -1) {
                PreprocessorReplacements.push({ cname: PrepRule.parts[1], value: replaceDefines(PrepRule.parts[2]) })
            } else {
                PreprocessorReplacements[idx].value = PrepRule.parts[2]
            }
            break
        case 'UNDEF':
            PreprocessorReplacements = PreprocessorReplacements.filter(obj => obj.cname !== PrepRule.parts[1])
            break
        default:
                // not implementd
        }
        // push empty line so line numbers will not be messed
        ret.push('')
    })

    return ret.join('\n')
}
