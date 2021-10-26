// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

import { SmartC } from './SmartC/smartc'
import { tests, bytecodeTests, jestTests, jestBytecodeTests } from './templateTests'

export type CTestType = [string, boolean|null, string]
export type AssemblyTestType = [ string, boolean, string, string]

export function runTestCases (jestTest: boolean = false) {
    function encodedStr (rawStr: string) {
        return rawStr.replace(/[\u00A0-\u9999<>&]/g, function (i) {
            return '&#' + i.charCodeAt(0) + ';'
        })
    }

    function processOneAssemblyTest (currentByteTest: AssemblyTestType, idx: number) {
        let testFailed = true
        let testMessageA = ''
        let testMessageB = ''
        let testError = ''
        try {
            const asmCompiler = new SmartC({
                language: 'Assembly',
                sourceCode: currentByteTest[0]
            })
            asmCompiler.compile()
            testMessageA = asmCompiler.getMachineCode().ByteCode
            testMessageB = asmCompiler.getMachineCode().ByteData
            testFailed = false
        } catch (e) {
            testError = e
        }
        if (currentByteTest[1] === testFailed && testMessageA === currentByteTest[2] && testMessageB === currentByteTest[3]) {
            itemPass++
            return `Pass! (${idx})`
        } else {
            itemFail++
            return `<span style='color:red'>Fail...</span> Code: <span style='color:purple'>${encodedStr(currentByteTest[0])}</span>
GOT: ${testMessageA}
Error: ${testError}`
        }
    }

    function processOneCTest (currentTest: CTestType) {
        if (currentTest[1] === null) {
            subItemCount = 0
            return `\n<h4>${currentTest[0]}</h4>`
        }
        let testFailed = true
        let testMessage = ''
        let testError = ''
        subItemCount++
        try {
            const cCompiler = new SmartC({
                language: 'C',
                sourceCode: currentTest[0]
            })
            cCompiler.compile()
            testMessage = cCompiler.getAssemblyCode()
            testFailed = false
        } catch (e) {
            testError = e
        }
        if (currentTest[1] === testFailed && testMessage === currentTest[2]) {
            itemPass++
            return `Pass! (${subItemCount}) Code: <span style='color:blue'>${encodedStr(currentTest[0])}</span>`
        } else {
            itemFail++
            return `<span style='color:red'>Fail...</span> (${subItemCount}) Code: <span style='color:blue'>${encodedStr(currentTest[0])}</span> Expected:
${currentTest[2]}
GOT output: ${testMessage}
GOT error:  ${testError}`
        }
    }

    let itemPass = 0
    let itemFail = 0
    let subItemCount = 0

    if (jestTest) {
        jestTests.forEach(processOneCTest)
        jestBytecodeTests.forEach(processOneAssemblyTest)
        if (itemPass !== 4) {
            throw new Error('Browser test testcases failed.')
        }
        return 'Test tescases ok!'
    }
    const AssemblyResultTable = bytecodeTests.map(processOneAssemblyTest)
    const CResultTable = tests.map(processOneCTest)

    return `Tests completed: ${itemPass} Passed; ${itemFail} Failed.\n\n` +
        '<h3>Assembly tests</h3>' +
        AssemblyResultTable.join('\n') +
        '<h3>Full tests</h3>' +
        CResultTable.join('\n')
}
