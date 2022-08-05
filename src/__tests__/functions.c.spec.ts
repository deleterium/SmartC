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
})
