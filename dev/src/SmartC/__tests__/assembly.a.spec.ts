import { SmartC } from '../smartc'

describe('Assembly compilation:', () => {
    it('should compile: regular opCodes', () => {
        const code = 'SET @a #0000000000000100\nSET @b $a\nCLR @b\nINC @b\nDEC @a\nADD @a $b\nSUB @a $b\nMUL @a $b\nDIV @a $b\nBOR @a $b\nAND @a $b\nXOR @a $b\nSET @a $b\nNOT @a\nSET @a $($b)\nSET @a $c\nADD @a $b\nSET @a $($b + $c)\nPSH $b\nJSR :__fn_teste\nPOP @a\nSET @($a) $b\nSET @($a + $b) $c\nMOD @a $b\nSHL @a $b\nSHR @a $b\nSLP $a\nJMP :__fn_main\n\n__fn_teste:\nPOP @teste_d\nSET @r0 $teste_d\nINC @r0\nPSH $r0\nRET\n\n__fn_main:\nPCS\nINC @a\nFIN'
        const MachineCode = '010000000000010000000000000201000000000000000301000000040100000005000000000600000000010000000700000000010000000800000000010000000900000000010000000a00000000010000000b00000000010000000c00000000010000000200000000010000000d000000000e00000000010000000200000000020000000600000000010000000f000000000100000002000000100100000012e400000011000000001400000000010000001500000000010000000200000016000000000100000017000000000100000018000000000100000025000000001afd0000001103000000020400000003000000040400000010040000001330040000000028'
        const MachineData = ''
        const result = new SmartC({ language: 'Assembly', sourceCode: code }).compile().getMachineCode()
        expect(result.ByteCode).toBe(MachineCode)
        expect(result.ByteData).toBe(MachineData)
    })
    it('should compile: opCodes for api functions', () => {
        const code = 'FUN clear_A_B\nFUN set_A1 $a\nFUN set_A1_A2 $a $b\nFUN @a check_A_equals_B\nFUN @a add_Minutes_to_Timestamp $b $c\nFIN\n'
        const MachineCode = '3222013310010000000034140100000000010000003527010000000037060400000000010000000200000028'
        const MachineData = ''
        const result = new SmartC({ language: 'Assembly', sourceCode: code }).compile().getMachineCode()
        expect(result.ByteCode).toBe(MachineCode)
        expect(result.ByteData).toBe(MachineData)
    })
    it('should compile: rare opCodes ', () => {
        const code = 'FIZ $a\nSTZ $a\nERR :__error\nINC @a\nNOP\nNOP\n__error:\nDEC @a'
        const MachineCode = '260000000027000000002b1600000004000000007f7f0500000000'
        const MachineData = ''
        const result = new SmartC({ language: 'Assembly', sourceCode: code }).compile().getMachineCode()
        expect(result.ByteCode).toBe(MachineCode)
        expect(result.ByteData).toBe(MachineData)
    })
    it('should compile: all branches opCodes with positive offset (no overflow)', () => {
        const code = 'BZR $a :__if1_endif\nINC @b\n__if1_endif:\nBNZ $a :__if2_endif\nINC @b\n__if2_endif:\nBLE $a $b :__if3_endif\nINC @b\n__if3_endif:\nBGE $a $b :__if4_endif\nINC @b\n__if4_endif:\nBLT $a $b :__if5_endif\nINC @b\n__if5_endif:\nBGT $a $b :__if6_endif\nINC @b\n__if6_endif:\nBNE $a $b :__if7_endif\nINC @b\n__if7_endif:\nBEQ $a $b :__if8_endif\nINC @b\n__if8_endif:\nFIN\n'
        const MachineCode = '1b000000000b04010000001e000000000b04010000002200000000010000000f04010000002100000000010000000f04010000002000000000010000000f04010000001f00000000010000000f04010000002400000000010000000f04010000002300000000010000000f040100000028'
        const MachineData = ''
        const result = new SmartC({ language: 'Assembly', sourceCode: code }).compile().getMachineCode()
        expect(result.ByteCode).toBe(MachineCode)
        expect(result.ByteData).toBe(MachineData)
    })
    it('should compile: all branches with negative offset (no overflow)', () => {
        const code = '__loop1_continue:\nINC @a\nBNZ $a :__loop1_continue\nBZR $a :__loop1_continue\nBEQ $a $b :__loop1_continue\nBNE $a $b :__loop1_continue\nBGT $a $b :__loop1_continue\nBLT $a $b :__loop1_continue\nBGE $a $b :__loop1_continue\nBLE $a $b :__loop1_continue\n__loop1_break:\nINC @b\nFIN\n'
        const MachineCode = '04000000001e00000000fb1b00000000f5230000000001000000ef240000000001000000e51f0000000001000000db200000000001000000d1210000000001000000c7220000000001000000bd040100000028'
        const MachineData = ''
        const result = new SmartC({ language: 'Assembly', sourceCode: code }).compile().getMachineCode()
        expect(result.ByteCode).toBe(MachineCode)
        expect(result.ByteData).toBe(MachineData)
    })
    it('should compile: branch opcode with max positive offset (127 bytes)', () => {
        const code = 'BZR $a :__if1_endif\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSTP\nSTP\nSTP\nSTP\n__if1_endif:\nINC @b\nFIN\n'
        const MachineCode = '1b000000007f01000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000029292929040100000028'
        const MachineData = ''
        const result = new SmartC({ language: 'Assembly', sourceCode: code }).compile().getMachineCode()
        expect(result.ByteCode).toBe(MachineCode)
        expect(result.ByteData).toBe(MachineData)
    })
    it('should compile: branch opcode with first positive offset overflow (128 bytes)', () => {
        const code = 'BZR $a :__if1_endif\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSTP\nSTP\nSTP\nSTP\nSTP\n__if1_endif:\nINC @b\nFIN\n'
        const MachineCode = '1e000000000b1a850000000100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000002929292929040100000028'
        const MachineData = ''
        const result = new SmartC({ language: 'Assembly', sourceCode: code }).compile().getMachineCode()
        expect(result.ByteCode).toBe(MachineCode)
        expect(result.ByteData).toBe(MachineData)
    })
    it('should compile: all branches opcodes with negative offset overflow', () => {
        const code = '__loop1_continue:\nSET @a #0000000000000001\nSET @b #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nBNZ $a :__loop1_continue\nBZR $a :__loop1_continue\nBEQ $a $b :__loop1_continue\nBNE $a $b :__loop1_continue\nBGT $a $b :__loop1_continue\nBLT $a $b :__loop1_continue\nBGE $a $b :__loop1_continue\nBLE $a $b :__loop1_continue\n__loop1_break:\nINC @b\nFIN\n'
        const MachineCode = '010000000001000000000000000101000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000001b000000000b1a000000001e000000000b1a000000002400000000010000000f1a000000002300000000010000000f1a000000002200000000010000000f1a000000002100000000010000000f1a000000002000000000010000000f1a000000001f00000000010000000f1a00000000040100000028'
        const MachineData = ''
        const result = new SmartC({ language: 'Assembly', sourceCode: code }).compile().getMachineCode()
        expect(result.ByteCode).toBe(MachineCode)
        expect(result.ByteData).toBe(MachineData)
    })
    it('should compile: branch opcode with max negative offset (-128 bytes)', () => {
        const code = '__loop1_continue:\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nADD @a $b\nSTP\nSTP\nBNZ $a :__loop1_continue\n__loop1_break:\nINC @b\nFIN'
        const MachineCode = '01000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000006000000000100000029291e0000000080040100000028'
        const MachineData = ''
        const result = new SmartC({ language: 'Assembly', sourceCode: code }).compile().getMachineCode()
        expect(result.ByteCode).toBe(MachineCode)
        expect(result.ByteData).toBe(MachineData)
    })
    it('should compile: branch opcode with first negative offset overflow (-129 bytes)', () => {
        const code = '__loop1_continue:\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nADD @a $b\nSTP\nSTP\nSTP\nBNZ $a :__loop1_continue\n__loop1_break:\nINC @b\nFIN'
        const MachineCode = '0100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000000600000000010000002929291b000000000b1a00000000040100000028'
        const MachineData = ''
        const result = new SmartC({ language: 'Assembly', sourceCode: code }).compile().getMachineCode()
        expect(result.ByteCode).toBe(MachineCode)
        expect(result.ByteData).toBe(MachineData)
    })
    it('should compile: ^const directive to machineData', () => {
        const code = 'SET @a #0000000000000005\nSET @b #0000000000000004\n^const SET @c #9887766554433221\nINC @a\nFIN\n'
        const MachineCode = '0100000000050000000000000001010000000400000000000000040000000028'
        const MachineData = '000000000000000000000000000000002132435465768798'
        const result = new SmartC({ language: 'Assembly', sourceCode: code }).compile().getMachineCode()
        expect(result.ByteCode).toBe(MachineCode)
        expect(result.ByteData).toBe(MachineData)
    })
    it('should compile: ^declare directive shall reserve variable position', () => {
        const code = '^declare r0\n^declare a\n^declare b\n^declare c\n\n^const SET @c #9887766554433221\nSET @a #0000000000000005\nSET @b #0000000000000004\nINC @a\nFIN\n'
        const MachineCode = '0101000000050000000000000001020000000400000000000000040100000028'
        const MachineData = '0000000000000000000000000000000000000000000000002132435465768798'
        const result = new SmartC({ language: 'Assembly', sourceCode: code }).compile().getMachineCode()
        expect(result.ByteCode).toBe(MachineCode)
        expect(result.ByteData).toBe(MachineData)
    })
    it('should compile: ^const directive with no const in between variables (shall fill zeros)', () => {
        const code = '^declare r0\n^declare a\n^declare b\n^declare c\n\n^const SET @c #9887766554433221\n^const SET @a #000000000000fafe\nSET @b #0000000000000004\nINC @a\nFIN\n'
        const MachineCode = '01020000000400000000000000040100000028'
        const MachineData = '0000000000000000fefa00000000000000000000000000002132435465768798'
        const result = new SmartC({ language: 'Assembly', sourceCode: code }).compile().getMachineCode()
        expect(result.ByteCode).toBe(MachineCode)
        expect(result.ByteData).toBe(MachineData)
    })
    it('should compile: ^comment directive and multi spaces', () => {
        const code = 'SET  @b     #0000000000000001\n   INC @b\n^comment INC @b   \nFIN'
        const MachineCode = '01000000000100000000000000040000000028'
        const MachineData = ''
        const result = new SmartC({ language: 'Assembly', sourceCode: code }).compile().getMachineCode()
        expect(result.ByteCode).toBe(MachineCode)
        expect(result.ByteData).toBe(MachineData)
    })
    it('should compile: all ^program directives', () => {
        const code = '^program name MyName\n^program description MyDescription with spaces\n^program activationAmount 1000\n^program userStackPages 10\n^program codeStackPages 10'
        const result = new SmartC({ language: 'Assembly', sourceCode: code }).compile().getMachineCode()
        expect(result.PName).toBe('MyName')
        expect(result.PDescription).toBe('MyDescription with spaces')
        expect(result.PActivationAmount).toBe('1000')
        expect(result.UserStackPages).toBe(10)
        expect(result.CodeStackPages).toBe(10)
    })
    it('should compile: hashMachineCode test', () => {
        const code = '^declare var00\n^declare var01\n^declare var02\n^declare var03\n^declare var04\n^declare var05\n\nFUN set_B1 $var05\nFUN send_All_to_Address_in_B\nFIN'
        const result = new SmartC({ language: 'Assembly', sourceCode: code }).compile().getMachineCode()
        expect(result.MachineCodeHashId).toBe('17223659044509638052')
    })
})

describe('Assembly wrong code', () => {
    test('should throw: Unknow instruction', () => {
        expect(() => {
            const code = 'INC @a\nlaravel\n'
            const result = new SmartC({ language: 'Assembly', sourceCode: code })
            result.compile()
        }).toThrowError(/^assembler/)
    })
    test('should throw: Unknow API function (with return value)', () => {
        expect(() => {
            const code = '^declare a\nFUN @a getA1\nFIN'
            const result = new SmartC({ language: 'Assembly', sourceCode: code })
            result.compile()
        }).toThrowError(/^assembler/)
    })
    test('should throw: Unknow API function (without return value)', () => {
        expect(() => {
            const code = 'SET @a #0000000000000005\nFUN send_to_TO_Address_in_B $a\nFIN'
            const result = new SmartC({ language: 'Assembly', sourceCode: code })
            result.compile()
        }).toThrowError(/^assembler/)
    })
    test('should throw: Unknow ^program directive', () => {
        expect(() => {
            const code = '^program word processor\nFIN'
            const result = new SmartC({ language: 'Assembly', sourceCode: code })
            result.compile()
        }).toThrowError(/^assembler/)
    })
    test('should throw: Invalid jump location', () => {
        expect(() => {
            const code = 'INC @a\nJMP :nowhere\nINC @a\nFIN'
            const result = new SmartC({ language: 'Assembly', sourceCode: code })
            result.compile()
        }).toThrowError(/^assembler/)
    })
    test('should throw: Invalid branch location', () => {
        expect(() => {
            const code = 'INC @a\nBZR $a :nowhere\nINC @a\nFIN'
            const result = new SmartC({ language: 'Assembly', sourceCode: code })
            result.compile()
        }).toThrowError(/^assembler/)
    })
})
