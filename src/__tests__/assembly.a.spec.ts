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
    it('should compile: all api functions (atv2)', () => {
        const code = '^program name AllApiCodes\n^program description All Api Codes for AT version 2\n^program activationAmount 1000000000\n^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nFUN @a get_A1\nFUN @a get_A2\nFUN @a get_A3\nFUN @a get_A4\nFUN @b get_B1\nFUN @b get_B2\nFUN @b get_B3\nFUN @b get_B4\nFUN set_A1 $c\nFUN set_A2 $c\nFUN set_A3 $c\nFUN set_A4 $c\nFUN set_A1_A2 $a $b\nFUN set_A3_A4 $a $b\nFUN set_B1 $c\nFUN set_B2 $c\nFUN set_B3 $c\nFUN set_B4 $c\nFUN set_B1_B2 $a $b\nFUN set_B3_B4 $a $b\nFUN clear_A\nFUN clear_B\nFUN clear_A_B\nFUN copy_A_From_B\nFUN copy_B_From_A\nFUN @a check_A_Is_Zero\nFUN @b check_B_Is_Zero\nFUN @a check_A_equals_B\nFUN swap_A_and_B\nFUN OR_A_with_B\nFUN OR_B_with_A\nFUN AND_A_with_B\nFUN AND_B_with_A\nFUN XOR_A_with_B\nFUN XOR_B_with_A\nFUN add_A_to_B\nFUN add_B_to_A\nFUN sub_A_from_B\nFUN sub_B_from_A\nFUN mul_A_by_B\nFUN mul_B_by_A\nFUN div_A_by_B\nFUN div_B_by_A\nFUN MD5_A_to_B\nFUN @a check_MD5_A_with_B\nFUN HASH160_A_to_B\nFUN @a check_HASH160_A_with_B\nFUN SHA256_A_to_B\nFUN @a check_SHA256_A_with_B\nFUN @a get_Block_Timestamp\nFUN @a get_Creation_Timestamp\nFUN @a get_Last_Block_Timestamp\nFUN put_Last_Block_Hash_In_A\nFUN A_to_Tx_after_Timestamp $c\nFUN @a get_Type_for_Tx_in_A\nFUN @a get_Amount_for_Tx_in_A\nFUN @a get_Timestamp_for_Tx_in_A\nFUN @a get_Ticket_Id_for_Tx_in_A\nFUN message_from_Tx_in_A_to_B\nFUN B_to_Address_of_Tx_in_A\nFUN B_to_Address_of_Creator\nFUN @a get_Current_Balance\nFUN @a get_Previous_Balance\nFUN send_to_Address_in_B $c\nFUN send_All_to_Address_in_B\nFUN send_Old_to_Address_in_B\nFUN send_A_to_Address_in_B\nFUN @a add_Minutes_to_Timestamp $c $d\nFIN\n'
        const MachineCode = '3500010300000035010103000000350201030000003503010300000035040104000000350501040000003506010400000035070104000000331001050000003311010500000033120105000000331301050000003414010300000004000000341501030000000400000033160105000000331701050000003318010500000033190105000000341a010300000004000000341b010300000004000000322001322101322201322301322401352501030000003526010400000035270103000000322801322901322a01322b01322c01322d01322e013240013241013242013243013244013245013246013247013200023501020300000032020235030203000000320402350502030000003500030300000035010303000000350203030000003203033304030500000035050303000000350603030000003507030300000035080303000000320903320a03320b0335000403000000350104030000003302040500000032030432040432050437060403000000050000000600000028'
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
    it('should compile: atv3 opCodes and apiCodes', () => {
        const code = '^comment new opCodes SIP-37\nSLP\nPOW @base $exp\nMDV @x $y $den\n^comment new APICodes SIP-37\nFUN @ret Check_Sig_B_With_A\nFUN @ret Get_Code_Hash_Id\nFUN @ret Get_Activation_Fee\nFUN Put_Last_Block_GSig_In_A\n^comment new APICodes SIP-38\nFUN @ret Get_Map_Value_Keys_In_A\nFUN Set_Map_Value_Keys_In_A\n^comment new APICodes SIP-39\nFUN @ret Issue_Asset\nFUN Mint_Asset\nFUN Distribute_To_Asset_Holders\nFUN @ret Get_Asset_Holders_Count\nFUN @ret Get_Asset_Circulating\nFUN B_To_Assets_Of_Tx_In_A\n'
        const MachineCode = '2a1900000000010000002c02000000030000000400000035060205000000350c0305000000350d0405000000320e043507040500000032080435090405000000320a04320b04350c0405000000350f0405000000320d03'
        const MachineData = ''
        const result = new SmartC({ language: 'Assembly', sourceCode: code }).compile().getMachineCode()
        expect(result.ByteCode).toBe(MachineCode)
        expect(result.ByteData).toBe(MachineData)
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
