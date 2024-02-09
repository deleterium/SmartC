import { SmartC } from '../smartc'

describe('Built-in functions', () => {
    it('should compile: readShortMessage() (a)', () => {
        const code = '#pragma optimizationLevel 0\n#pragma verboseAssembly\nlong txid, buffer[4];\nreadShortMessage(txid, buffer, 0);\nreadShortMessage(22333, buffer, 1);\nreadShortMessage(txid, buffer, 2);\nreadShortMessage(22333, buffer, 3);\nreadShortMessage(txid, buffer, buffer.length);\n'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare txid\n^declare buffer\n^const SET @buffer #0000000000000005\n^declare buffer_0\n^declare buffer_1\n^declare buffer_2\n^declare buffer_3\n\n^comment line 5 readShortMessage(22333, buffer, 1);\nSET @r0 #000000000000573d\nCLR @r1\nFUN set_A1_A2 $r0 $r1\nFUN message_from_Tx_in_A_to_B\nFUN @buffer_0 get_B1\n^comment line 6 readShortMessage(txid, buffer, 2);\nCLR @r0\nFUN set_A1_A2 $txid $r0\nFUN message_from_Tx_in_A_to_B\nFUN @buffer_0 get_B1\nFUN @buffer_1 get_B2\n^comment line 7 readShortMessage(22333, buffer, 3);\nSET @r0 #000000000000573d\nCLR @r1\nFUN set_A1_A2 $r0 $r1\nFUN message_from_Tx_in_A_to_B\nFUN @buffer_0 get_B1\nFUN @buffer_1 get_B2\nFUN @buffer_2 get_B3\n^comment line 8 readShortMessage(txid, buffer, buffer.length);\nCLR @r0\nFUN set_A1_A2 $txid $r0\nFUN message_from_Tx_in_A_to_B\nFUN @buffer_0 get_B1\nFUN @buffer_1 get_B2\nFUN @buffer_2 get_B3\nFUN @buffer_3 get_B4\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: readShortMessage() (b)', () => {
        const code = '#pragma optimizationLevel 0\n#pragma verboseAssembly\nlong txid, b, *c;\nreadShortMessage(2233, c, 0);\nreadShortMessage(2233, c, 1);\nreadShortMessage(3344, &b, 1);\nreadShortMessage(2233, c, 2);\nreadShortMessage(txid, c, 3);\nreadShortMessage(2333, c, 4);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare txid\n^declare b\n^declare c\n\n^comment line 5 readShortMessage(2233, c, 1);\nSET @r0 #00000000000008b9\nCLR @r1\nFUN set_A1_A2 $r0 $r1\nFUN message_from_Tx_in_A_to_B\nFUN @r0 get_B1\nSET @($c) $r0\n^comment line 6 readShortMessage(3344, &b, 1);\nSET @r0 #0000000000000d10\nCLR @r2\nFUN set_A1_A2 $r0 $r2\nFUN message_from_Tx_in_A_to_B\nFUN @b get_B1\n^comment line 7 readShortMessage(2233, c, 2);\nSET @r0 #00000000000008b9\nCLR @r1\nFUN set_A1_A2 $r0 $r1\nFUN message_from_Tx_in_A_to_B\nSET @r0 $c\nFUN @r1 get_B1\nSET @($r0) $r1\nFUN @r1 get_B2\nINC @r0\nSET @($r0) $r1\n^comment line 8 readShortMessage(txid, c, 3);\nCLR @r0\nFUN set_A1_A2 $txid $r0\nFUN message_from_Tx_in_A_to_B\nSET @r0 $c\nFUN @r1 get_B1\nSET @($r0) $r1\nFUN @r1 get_B2\nINC @r0\nSET @($r0) $r1\nFUN @r1 get_B3\nINC @r0\nSET @($r0) $r1\n^comment line 9 readShortMessage(2333, c, 4);\nSET @r0 #000000000000091d\nCLR @r1\nFUN set_A1_A2 $r0 $r1\nFUN message_from_Tx_in_A_to_B\nSET @r0 $c\nFUN @r1 get_B1\nSET @($r0) $r1\nFUN @r1 get_B2\nINC @r0\nSET @($r0) $r1\nFUN @r1 get_B3\nINC @r0\nSET @($r0) $r1\nFUN @r1 get_B4\nINC @r0\nSET @($r0) $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: readShortMessage wrong usage', () => {
        expect(() => {
            const code = 'long txid, b, *c;readShortMessage(2233, c, b);'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: readShortMessage wrong usage', () => {
        expect(() => {
            const code = 'long txid, b, *c;readShortMessage(2233, c, 5);'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: sendShortMessage() (a)', () => {
        const code = '#pragma optimizationLevel 0\n#pragma verboseAssembly\nlong recipient, buffer[4];\nsendShortMessage(buffer, 0, recipient);\nsendShortMessage(buffer, 1, 2233);\nsendShortMessage(buffer, 2, recipient);\nsendShortMessage(buffer, 3, 2244);\nsendShortMessage(buffer, buffer.length, recipient);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare recipient\n^declare buffer\n^const SET @buffer #0000000000000005\n^declare buffer_0\n^declare buffer_1\n^declare buffer_2\n^declare buffer_3\n\n^comment line 5 sendShortMessage(buffer, 1, 2233);\nSET @r1 #00000000000008b9\nFUN set_B1 $r1\nFUN clear_A\nFUN set_A1 $buffer_0\nFUN send_A_to_Address_in_B\n^comment line 6 sendShortMessage(buffer, 2, recipient);\nFUN set_B1 $recipient\nFUN clear_A\nFUN set_A1_A2 $buffer_0 $buffer_1\nFUN send_A_to_Address_in_B\n^comment line 7 sendShortMessage(buffer, 3, 2244);\nSET @r1 #00000000000008c4\nFUN set_B1 $r1\nCLR @r0\nFUN set_A1_A2 $buffer_0 $buffer_1\nFUN set_A3_A4 $buffer_2 $r0\nFUN send_A_to_Address_in_B\n^comment line 8 sendShortMessage(buffer, buffer.length, recipient);\nFUN set_B1 $recipient\nFUN set_A1_A2 $buffer_0 $buffer_1\nFUN set_A3_A4 $buffer_2 $buffer_3\nFUN send_A_to_Address_in_B\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: sendShortMessage() (b)', () => {
        const code = '#pragma optimizationLevel 0\n#pragma verboseAssembly\nlong recipient, b, *c;\nsendShortMessage(c, 0, 22333);\nsendShortMessage(c, 1, 22333);\nsendShortMessage(&b, 1, recipient);\nsendShortMessage(c, 2, recipient);\nsendShortMessage(c, 3, 22333);\nsendShortMessage(c, 4, recipient);\n'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare recipient\n^declare b\n^declare c\n\n^comment line 5 sendShortMessage(c, 1, 22333);\nSET @r1 #000000000000573d\nFUN set_B1 $r1\nFUN clear_A\nSET @r0 $($c)\nFUN set_A1 $r0\nFUN send_A_to_Address_in_B\n^comment line 6 sendShortMessage(&b, 1, recipient);\nFUN set_B1 $recipient\nFUN clear_A\nFUN set_A1 $b\nFUN send_A_to_Address_in_B\n^comment line 7 sendShortMessage(c, 2, recipient);\nFUN set_B1 $recipient\nSET @r0 $c\nFUN clear_A\nSET @r1 $($r0)\nINC @r0\nSET @r2 $($r0)\nFUN set_A1_A2 $r1 $r2\nFUN send_A_to_Address_in_B\n^comment line 8 sendShortMessage(c, 3, 22333);\nSET @r1 #000000000000573d\nFUN set_B1 $r1\nSET @r0 $c\nSET @r1 $($r0)\nINC @r0\nSET @r2 $($r0)\nFUN set_A1_A2 $r1 $r2\nINC @r0\nSET @r1 $($r0)\nCLR @r2\nFUN set_A3_A4 $r1 $r2\nFUN send_A_to_Address_in_B\n^comment line 9 sendShortMessage(c, 4, recipient);\nFUN set_B1 $recipient\nSET @r0 $c\nSET @r1 $($r0)\nINC @r0\nSET @r2 $($r0)\nFUN set_A1_A2 $r1 $r2\nINC @r0\nSET @r1 $($r0)\nINC @r0\nSET @r2 $($r0)\nFUN set_A3_A4 $r1 $r2\nFUN send_A_to_Address_in_B\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: readShortMessage wrong usage', () => {
        expect(() => {
            const code = 'long recipient, b, *c;sendShortMessage(2233, b, recipient);'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: readShortMessage wrong usage', () => {
        expect(() => {
            const code = 'long recipient, b, *c;sendShortMessage(2233, 5, recipient);'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: getAccountQuantity()', () => {
        const code = '#pragma optimizationLevel 0\n long a = getAccountQuantity(0xa5531, 0x2222222222222222);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 #00000000000a5531\nSET @r1 #2222222222222222\nFUN set_B1_B2 $r0 $r1\nFUN @a Get_Account_Balance\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getAccountBalance()', () => {
        const code = '#pragma optimizationLevel 0\n long a = getAccountBalance(0xa5531);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 #00000000000a5531\nCLR @r1\nFUN set_B1_B2 $r0 $r1\nFUN @a Get_Account_Balance\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getAccountBalanceFx()', () => {
        const code = '#pragma optimizationLevel 0\n fixed a = getAccountBalanceFx(0xa5531);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n\nSET @r0 #00000000000a5531\nCLR @r1\nFUN set_B1_B2 $r0 $r1\nFUN @a Get_Account_Balance\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: APIFunctions Get_Account_Balance() and F_Get_Account_Balance()', () => {
        const code = '#pragma optimizationLevel 0\n#include APIFunctions\n#include fixedAPIFunctions\n\nlong a = Get_Account_Balance();\nfixed b = F_Get_Account_Balance();\n'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nFUN @a Get_Account_Balance\nFUN @b Get_Account_Balance\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})
