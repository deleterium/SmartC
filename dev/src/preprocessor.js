"use strict";
// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License
/**
 * Process macro substitutions on source code
 * @param sourcecode Source code input
 * @returns preprocessed string
 */
// eslint-disable-next-line no-unused-vars
function preprocess(sourcecode) {
    const preprocessorCodes = [
        { regex: /^\s*#define\s+(\w+)\s*$/, type: 'DEFINE_NULL' },
        { regex: /^\s*#define\s+(\w+)\s+(.*)\s*$/, type: 'DEFINE_VAL' },
        { regex: /^\s*#undef\s+(\w+)\s*$/, type: 'UNDEF' }
    ];
    let preprocessorReplacements = [
        { cname: 'true', value: '1' },
        { cname: 'false', value: '0' },
        { cname: 'NULL', value: '0' }
        // {cname: "SMARTC", value: ""},
    ];
    function getPrepRule(codeline) {
        for (let i = 0; i < preprocessorCodes.length; i++) {
            const parts = preprocessorCodes[i].regex.exec(codeline);
            if (parts !== null) {
                return {
                    Code: preprocessorCodes[i],
                    parts: parts
                };
            }
        }
        return null;
    }
    function replaceDefines(codeline) {
        preprocessorReplacements.forEach(function (replacement) {
            const rep = new RegExp('\\b' + replacement.cname + '\\b', 'g');
            codeline = codeline.replace(rep, replacement.value);
        });
        return codeline;
    }
    const lines = sourcecode.split('\n');
    const ret = [];
    lines.forEach(currentLine => {
        const PrepRule = getPrepRule(currentLine);
        let idx;
        if (PrepRule === null) {
            ret.push(replaceDefines(currentLine));
            return;
        }
        switch (PrepRule.Code.type) {
            case 'DEFINE_NULL':
                idx = preprocessorReplacements.findIndex(obj => obj.cname === PrepRule.parts[1]);
                if (idx === -1) {
                    preprocessorReplacements.push({ cname: PrepRule.parts[1], value: '' });
                }
                else {
                    preprocessorReplacements[idx].value = '';
                }
                break;
            case 'DEFINE_VAL':
                idx = preprocessorReplacements.findIndex(obj => obj.cname === PrepRule.parts[1]);
                if (idx === -1) {
                    preprocessorReplacements.push({ cname: PrepRule.parts[1], value: replaceDefines(PrepRule.parts[2]) });
                }
                else {
                    preprocessorReplacements[idx].value = PrepRule.parts[2];
                }
                break;
            case 'UNDEF':
                preprocessorReplacements = preprocessorReplacements.filter(obj => obj.cname !== PrepRule.parts[1]);
                break;
            default:
            // not implementd
        }
        // push empty line so line numbers will not be messed
        ret.push('');
    });
    return ret.join('\n');
}
