import { SmartC } from '../smartc'

describe('API functions', () => {
    it('should compile: right use', () => {
        const code = '#pragma optimizationLevel 0\n#include APIFunctions\nlong a;Set_A1(a);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nFUN set_A1 $a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: all API (atv2)', () => {
        const code = '#include APIFunctions\nlong a, b, c, d;\n\n// Get/Set functions for “pseudo registers” \na = Get_A1();\na = Get_A2();\na = Get_A3();\na = Get_A4();\nb = Get_B1();\nb = Get_B2();\nb = Get_B3();\nb = Get_B4();\nSet_A1(c);\nSet_A2(c);\nSet_A3(c);\nSet_A4(c);\nSet_A1_A2(a, b);\nSet_A3_A4(a, b);\nSet_B1(c);\nSet_B2(c);\nSet_B3(c);\nSet_B4(c);\nSet_B1_B2(a, b);\nSet_B3_B4(a, b);\nClear_A();\nClear_B();\nClear_A_And_B();\nCopy_A_From_B();\nCopy_B_From_A();\na = Check_A_Is_Zero();\nb = Check_B_Is_Zero();\na = Check_A_Equals_B();\nSwap_A_and_B();\nOR_A_with_B();\nOR_B_with_A();\nAND_A_with_B();\nAND_B_with_A();\nXOR_A_with_B();\nXOR_B_with_A();\nAdd_A_To_B();\nAdd_B_To_A();\nSub_A_From_B();\nSub_B_From_A();\nMul_A_By_B();\nMul_B_By_A();\nDiv_A_By_B();\nDiv_B_By_A();\n\n// Functions that perform hash operations\nMD5_A_To_B();\na = Check_MD5_A_With_B();\nHASH160_A_To_B();\na = Check_HASH160_A_With_B();\nSHA256_A_To_B();\na = Check_SHA256_A_With_B();\n\n// Generic functions that get block and tx info\na = Get_Block_Timestamp();\na = Get_Creation_Timestamp();\na = Get_Last_Block_Timestamp();\nPut_Last_Block_Hash_In_A();\nA_To_Tx_After_Timestamp(c);\na = Get_Type_For_Tx_In_A();\na = Get_Amount_For_Tx_In_A();\na = Get_Timestamp_For_Tx_In_A();\na = Get_Random_Id_For_Tx_In_A();\nMessage_From_Tx_In_A_To_B();\nB_To_Address_Of_Tx_In_A();\nB_To_Address_Of_Creator();\n\n// Generic functions that check balances and perform ops\na = Get_Current_Balance();\na = Get_Previous_Balance();\nSend_To_Address_In_B(c);\nSend_All_To_Address_In_B();\nSend_Old_To_Address_In_B();\nSend_A_To_Address_In_B();\na = Add_Minutes_To_Timestamp(c, d);\n'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nFUN @a get_A1\nFUN @a get_A2\nFUN @a get_A3\nFUN @a get_A4\nFUN @b get_B1\nFUN @b get_B2\nFUN @b get_B3\nFUN @b get_B4\nFUN set_A1 $c\nFUN set_A2 $c\nFUN set_A3 $c\nFUN set_A4 $c\nFUN set_A1_A2 $a $b\nFUN set_A3_A4 $a $b\nFUN set_B1 $c\nFUN set_B2 $c\nFUN set_B3 $c\nFUN set_B4 $c\nFUN set_B1_B2 $a $b\nFUN set_B3_B4 $a $b\nFUN clear_A\nFUN clear_B\nFUN clear_A_B\nFUN copy_A_From_B\nFUN copy_B_From_A\nFUN @a check_A_Is_Zero\nFUN @b check_B_Is_Zero\nFUN @a check_A_equals_B\nFUN swap_A_and_B\nFUN OR_A_with_B\nFUN OR_B_with_A\nFUN AND_A_with_B\nFUN AND_B_with_A\nFUN XOR_A_with_B\nFUN XOR_B_with_A\nFUN add_A_to_B\nFUN add_B_to_A\nFUN sub_A_from_B\nFUN sub_B_from_A\nFUN mul_A_by_B\nFUN mul_B_by_A\nFUN div_A_by_B\nFUN div_B_by_A\nFUN MD5_A_to_B\nFUN @a check_MD5_A_with_B\nFUN HASH160_A_to_B\nFUN @a check_HASH160_A_with_B\nFUN SHA256_A_to_B\nFUN @a check_SHA256_A_with_B\nFUN @a get_Block_Timestamp\nFUN @a get_Creation_Timestamp\nFUN @a get_Last_Block_Timestamp\nFUN put_Last_Block_Hash_In_A\nFUN A_to_Tx_after_Timestamp $c\nFUN @a get_Type_for_Tx_in_A\nFUN @a get_Amount_for_Tx_in_A\nFUN @a get_Timestamp_for_Tx_in_A\nFUN @a get_Ticket_Id_for_Tx_in_A\nFUN message_from_Tx_in_A_to_B\nFUN B_to_Address_of_Tx_in_A\nFUN B_to_Address_of_Creator\nFUN @a get_Current_Balance\nFUN @a get_Previous_Balance\nFUN send_to_Address_in_B $c\nFUN send_All_to_Address_in_B\nFUN send_Old_to_Address_in_B\nFUN send_A_to_Address_in_B\nFUN @a add_Minutes_to_Timestamp $c $d\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: all new API (atv3)', () => {
        const code = '#include APIFunctions\nlong a;\na = Check_Sig_B_With_A();\na = Get_Code_Hash_Id();\na = Get_Activation_Fee();\nPut_Last_Block_GSig_In_A();\nSet_Map_Value_Keys_In_A();\na = Get_Map_Value_Keys_In_A();\na = Issue_Asset();\nMint_Asset();\nDistribute_To_Asset_Holders();\na = Get_Asset_Holders_Count();\na = Get_Asset_Circulating();\nB_To_Assets_Of_Tx_In_A();\n'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nFUN @a Check_Sig_B_With_A\nFUN @a Get_Code_Hash_Id\nFUN @a Get_Activation_Fee\nFUN Put_Last_Block_GSig_In_A\nFUN Set_Map_Value_Keys_In_A\nFUN @a Get_Map_Value_Keys_In_A\nFUN @a Issue_Asset\nFUN Mint_Asset\nFUN Distribute_To_Asset_Holders\nFUN @a Get_Asset_Holders_Count\nFUN @a Get_Asset_Circulating\nFUN B_To_Assets_Of_Tx_In_A\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: missing argument', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\n#include APIFunctions\nSet_A1();'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: Function with same name as API but not including it', () => {
        const code = '#pragma optimizationLevel 0\nlong a=0; void Get_B1(void) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nCLR @a\nFIN\n\n__fn_Get_B1:\nINC @a\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: Function with same name as API and including it', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\n#include APIFunctions\nlong a=0; void Get_B1(void) { a++; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: wrong variable types on API Function argument', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\n#include APIFunctions\nlong * a;Set_A1(a);'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: Passing long inside struct (with offset)', () => {
        const code = '#include APIFunctions\n#pragma optimizationLevel 0\nstruct KOMBI { long driver; long collector; long passenger; } ;struct KOMBI car[2]; long a;\nSet_A1(car[a].collector);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^declare a\n\nSET @r0 #0000000000000003\nMUL @r0 $a\nINC @r0\nSET @r1 $($car + $r0)\nFUN set_A1 $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: Undeclared function when APIFunction is declared', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\n#include APIFunctions\nlong b, a = 0; test();'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})

describe('fixed API functions', () => {
    it('should compile: right use', () => {
        const code = '#pragma optimizationLevel 0\n#include fixedAPIFunctions\n fixed fa;F_Set_A1(fa);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare fa\n\nFUN set_A1 $fa\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: all fixed API', () => {
        const code = '#include fixedAPIFunctions\nfixed fa; fa = F_Get_A1();\n fa = F_Get_A2();\n fa = F_Get_A3();\n fa = F_Get_A4();\n fa = F_Get_B1();\n fa = F_Get_B2();\n fa = F_Get_B3();\n fa = F_Get_B4();\n F_Set_A1(fa);\n F_Set_A2(fa);\n F_Set_A3(fa);\n F_Set_A4(fa);\n F_Set_B1(fa);\n F_Set_B2(fa);\n F_Set_B3(fa);\n F_Set_B4(2.33);\n fa = F_Get_Amount_For_Tx_In_A();\n fa = F_Get_Current_Balance();\n fa = F_Get_Previous_Balance();\n F_Send_To_Address_In_B(fa);\n fa = F_Get_Map_Value_Keys_In_A();\n fa = F_Get_Activation_Fee();\n '
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare fa\n\nFUN @fa get_A1\nFUN @fa get_A2\nFUN @fa get_A3\nFUN @fa get_A4\nFUN @fa get_B1\nFUN @fa get_B2\nFUN @fa get_B3\nFUN @fa get_B4\nFUN set_A1 $fa\nFUN set_A2 $fa\nFUN set_A3 $fa\nFUN set_A4 $fa\nFUN set_B1 $fa\nFUN set_B2 $fa\nFUN set_B3 $fa\nSET @r0 #000000000de34c40\nFUN set_B4 $r0\nFUN @fa get_Amount_for_Tx_in_A\nFUN @fa get_Current_Balance\nFUN @fa get_Previous_Balance\nFUN send_to_Address_in_B $fa\nFUN @fa Get_Map_Value_Keys_In_A\nFUN @fa Get_Activation_Fee\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: wrong argument (expect long, got fixed)', () => {
        expect(() => {
            const code = '#include APIFunctions\nfixed fa; Set_A1(fa);'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: wrong argument (expected fixed, got long)', () => {
        expect(() => {
            const code = '#include APIFunctions\nlong a; F_Set_A1(a);'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})

describe('Built-in functions', () => {
    it('should compile: mdv()', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c, d; a = mdv(b, c, d);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $b\nMDV @a $c $d\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mdv() (using flatmem)', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c, d; a = mdv(2, 4, 6);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @r0 #0000000000000002\nSET @a $r0\nSET @r1 #0000000000000004\nSET @r2 #0000000000000006\nMDV @a $r1 $r2\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: pow()', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c; a=pow(b,c);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nPOW @a $c\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: pow() (using flatmem)', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c; a=pow(2,4);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @r0 #0000000000000002\nSET @a $r0\nSET @r1 #0000000000000004\nPOW @a $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: powf()', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; fixed fc; a=powf(b,fc);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n^declare fc\n\nSET @a $b\nPOW @a $fc\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: memcopy()', () => {
        const code = '#pragma optimizationLevel 0\nfixed fa, *pf; long la, *pl; memcopy(&fa, &la); memcopy(pf, &la); memcopy(&la, pf); memcopy(pf, pl); memcopy(pf+1, pl+4);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare fa\n^declare pf\n^declare la\n^declare pl\n\nSET @fa $la\nSET @($pf) $la\nSET @la $($pf)\nSET @r0 $($pl)\nSET @($pf) $r0\nSET @r0 $pf\nINC @r0\nSET @r1 #0000000000000004\nADD @r1 $pl\nSET @r2 $($r1)\nSET @($r0) $r2\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: bcltof() and bcftol()', () => {
        const code = '#pragma optimizationLevel 0\n#include APIFunctions\n#include fixedAPIFunctions\n fixed fa; long la; fa = bcltof(Get_A1()+25); la = bcftol(F_Get_A1()+25.0);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare fa\n^declare la\n\nFUN @r0 get_A1\nSET @fa #0000000000000019\nADD @fa $r0\nFUN @r0 get_A1\nSET @la #000000009502f900\nADD @la $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getNextTx()', () => {
        const code = '#pragma optimizationLevel 0\n long currTxId = getNextTx(); if (currTxId == 0) currTxId++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare _counterTimestamp\n^declare currTxId\n\nFUN A_to_Tx_after_Timestamp $_counterTimestamp\nFUN @currTxId get_A1\nBZR $currTxId :__GNT_1\nFUN @_counterTimestamp get_Timestamp_for_Tx_in_A\n__GNT_1:\nBNZ $currTxId :__if2_endif\n__if2_start:\nINC @currTxId\n__if2_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getNextTx() inside a function', () => {
        const code = '#pragma optimizationLevel 0\n getNextTxDetails(); void getNextTxDetails(void) { long tx = getNextTx(); }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare _counterTimestamp\n^declare getNextTxDetails_tx\n\nJSR :__fn_getNextTxDetails\nFIN\n\n__fn_getNextTxDetails:\nFUN A_to_Tx_after_Timestamp $_counterTimestamp\nFUN @getNextTxDetails_tx get_A1\nBZR $getNextTxDetails_tx :__GNT_1\nFUN @_counterTimestamp get_Timestamp_for_Tx_in_A\n__GNT_1:\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getNextTx() inside a codecave', () => {
        const code = '#pragma optimizationLevel 0\n long a, b, c; while ((a = getNextTx()) != 0) b++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare _counterTimestamp\n^declare a\n^declare b\n^declare c\n\n__loop1_continue:\nFUN A_to_Tx_after_Timestamp $_counterTimestamp\nFUN @a get_A1\nBZR $a :__GNT_2\nFUN @_counterTimestamp get_Timestamp_for_Tx_in_A\n__GNT_2:\nBZR $a :__loop1_break\n__loop1_start:\nINC @b\nJMP :__loop1_continue\n__loop1_break:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getNextTxFromBlockheight()', () => {
        const code = '#pragma optimizationLevel 0\n long block; long currTxId = getNextTxFromBlockheight(100900); if (currTxId == 0) currTxId++; currTxId = getNextTxFromBlockheight(block);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare _counterTimestamp\n^declare block\n^declare currTxId\n\nSET @r0 #0000000000018a24\nSET @r1 #0000000000000020\nSHL @r0 $r1\nFUN A_to_Tx_after_Timestamp $r0\nFUN @currTxId get_A1\nBZR $currTxId :__GNT_1\nFUN @_counterTimestamp get_Timestamp_for_Tx_in_A\n__GNT_1:\nBNZ $currTxId :__if2_endif\n__if2_start:\nINC @currTxId\n__if2_endif:\nSET @r0 $block\nSET @r1 #0000000000000020\nSHL @r0 $r1\nFUN A_to_Tx_after_Timestamp $r0\nFUN @currTxId get_A1\nBZR $currTxId :__GNT_3\nFUN @_counterTimestamp get_Timestamp_for_Tx_in_A\n__GNT_3:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getBlockheight()', () => {
        const code = '#pragma optimizationLevel 0\n long block = getBlockheight(0xad);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare block\n\nSET @r0 #00000000000000ad\nFUN set_A1 $r0\nFUN @block get_Timestamp_for_Tx_in_A\nSET @r0 #0000000000000020\nSHR @block $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getCurrentBlockheight()', () => {
        const code = '#pragma optimizationLevel 0\n long block = getCurrentBlockheight();'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare block\n\nFUN @block get_Block_Timestamp\nSET @r0 #0000000000000020\nSHR @block $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getAmount(); getAmountFx()', () => {
        const code = '#pragma optimizationLevel 0\nlong la; fixed fa; la=getAmount(1234); fa=getAmountFx(0xfffe);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare la\n^declare fa\n\nSET @r0 #00000000000004d2\nCLR @r1\nFUN set_A1_A2 $r0 $r1\nFUN @la get_Amount_for_Tx_in_A\nSET @r0 #000000000000fffe\nCLR @r1\nFUN set_A1_A2 $r0 $r1\nFUN @fa get_Amount_for_Tx_in_A\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getSender()', () => {
        const code = '#pragma optimizationLevel 0\n long a=getSender(1234);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 #00000000000004d2\nFUN set_A1 $r0\nFUN B_to_Address_of_Tx_in_A\nFUN @a get_B1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getType()', () => {
        const code = '#pragma optimizationLevel 0\n long a=getType(1234);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 #00000000000004d2\nFUN set_A1 $r0\nFUN @a get_Type_for_Tx_in_A\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getCreator()', () => {
        const code = '#pragma optimizationLevel 0\n long a=getCreator();'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nCLR @r0\nFUN set_B2 $r0\nFUN B_to_Address_of_Creator\nFUN @a get_B1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getCreatorOf()', () => {
        const code = '#pragma optimizationLevel 0\n long a=getCreatorOf(1234);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 #00000000000004d2\nFUN set_B2 $r0\nFUN B_to_Address_of_Creator\nFUN @a get_B1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getCodeHashOf()', () => {
        const code = '#pragma optimizationLevel 0\n long a=getCodeHashOf(1234);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 #00000000000004d2\nFUN set_B2 $r0\nFUN @a Get_Code_Hash_Id\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getWeakRandomNumber()', () => {
        const code = '#pragma optimizationLevel 0\n long a=getWeakRandomNumber();'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nFUN Put_Last_Block_GSig_In_A\nFUN @a get_A2\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getActivationOf(); getActivationOfFx', () => {
        const code = '#pragma optimizationLevel 0\n long a=getActivationOf(1234); fixed b=getActivationOfFx(1234);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSET @r0 #00000000000004d2\nFUN set_B2 $r0\nFUN @a Get_Activation_Fee\nSET @r0 #00000000000004d2\nFUN set_B2 $r0\nFUN @b Get_Activation_Fee\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getCurrentBalance(); getCurrentBalanceFx() ', () => {
        const code = '#pragma optimizationLevel 0\n long a=getCurrentBalance(); fixed b=getCurrentBalanceFx();'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nCLR @r0\nFUN set_A2 $r0\nFUN @a get_Current_Balance\nCLR @r0\nFUN set_A2 $r0\nFUN @b get_Current_Balance\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: readMessage()', () => {
        const code = '#pragma optimizationLevel 0\n long buffer[4], *bufPtr; readMessage(0xdede,    1, buffer); readMessage(0xfafa,    0, bufPtr); readMessage(0xfefe,    0,  bufPtr+1);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare buffer\n^const SET @buffer #0000000000000004\n^declare buffer_0\n^declare buffer_1\n^declare buffer_2\n^declare buffer_3\n^declare bufPtr\n\nSET @r0 #000000000000dede\nSET @r1 #0000000000000001\nFUN set_A1_A2 $r0 $r1\nFUN message_from_Tx_in_A_to_B\nFUN @buffer_0 get_B1\nFUN @buffer_1 get_B2\nFUN @buffer_2 get_B3\nFUN @buffer_3 get_B4\nSET @r0 #000000000000fafa\nCLR @r1\nFUN set_A1_A2 $r0 $r1\nFUN message_from_Tx_in_A_to_B\nSET @r0 $bufPtr\nFUN @r1 get_B1\nSET @($r0) $r1\nFUN @r1 get_B2\nINC @r0\nSET @($r0) $r1\nFUN @r1 get_B3\nINC @r0\nSET @($r0) $r1\nFUN @r1 get_B4\nINC @r0\nSET @($r0) $r1\nSET @r0 $bufPtr\nINC @r0\nSET @r1 #000000000000fefe\nCLR @r2\nFUN set_A1_A2 $r1 $r2\nFUN message_from_Tx_in_A_to_B\nFUN @r1 get_B1\nSET @($r0) $r1\nFUN @r1 get_B2\nINC @r0\nSET @($r0) $r1\nFUN @r1 get_B3\nINC @r0\nSET @($r0) $r1\nFUN @r1 get_B4\nINC @r0\nSET @($r0) $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: sendMessage()', () => {
        const code = '#pragma optimizationLevel 0\n#pragma verboseAssembly\nlong a, b, msg[4], *msgPtr;\nsendMessage(msg, getCreator());\nsendMessage(&msg[0], getCreator());\nsendMessage(&msg[a], getCreator());\nsendMessage(msgPtr, getCreator());\nsendMessage(&a, getCreator());'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare msg\n^const SET @msg #0000000000000006\n^declare msg_0\n^declare msg_1\n^declare msg_2\n^declare msg_3\n^declare msgPtr\n\n^comment line 4 sendMessage(msg, getCreator());\nCLR @r1\nFUN set_B2 $r1\nFUN B_to_Address_of_Creator\nFUN @r0 get_B1\nFUN set_B1 $r0\nFUN set_A1_A2 $msg_0 $msg_1\nFUN set_A3_A4 $msg_2 $msg_3\nFUN send_A_to_Address_in_B\n^comment line 5 sendMessage(&msg[0], getCreator());\nCLR @r1\nFUN set_B2 $r1\nFUN B_to_Address_of_Creator\nFUN @r0 get_B1\nFUN set_B1 $r0\nFUN set_A1_A2 $msg_0 $msg_1\nFUN set_A3_A4 $msg_2 $msg_3\nFUN send_A_to_Address_in_B\n^comment line 6 sendMessage(&msg[a], getCreator());\nSET @r0 $msg\nADD @r0 $a\nCLR @r2\nFUN set_B2 $r2\nFUN B_to_Address_of_Creator\nFUN @r1 get_B1\nFUN set_B1 $r1\nSET @r1 $($r0)\nINC @r0\nSET @r2 $($r0)\nFUN set_A1_A2 $r1 $r2\nINC @r0\nSET @r1 $($r0)\nINC @r0\nSET @r2 $($r0)\nFUN set_A3_A4 $r1 $r2\nFUN send_A_to_Address_in_B\n^comment line 7 sendMessage(msgPtr, getCreator());\nCLR @r1\nFUN set_B2 $r1\nFUN B_to_Address_of_Creator\nFUN @r0 get_B1\nFUN set_B1 $r0\nSET @r0 $msgPtr\nSET @r1 $($r0)\nINC @r0\nSET @r2 $($r0)\nFUN set_A1_A2 $r1 $r2\nINC @r0\nSET @r1 $($r0)\nINC @r0\nSET @r2 $($r0)\nFUN set_A3_A4 $r1 $r2\nFUN send_A_to_Address_in_B\n^comment line 8 sendMessage(&a, getCreator());\nCLR @r1\nFUN set_B2 $r1\nFUN B_to_Address_of_Creator\nFUN @r0 get_B1\nFUN set_B1 $r0\nFUN set_A1_A2 $a $b\nFUN set_A3_A4 $msg $msg_0\nFUN send_A_to_Address_in_B\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: sendAmountAndMessage()', () => {
        const code = '#pragma optimizationLevel 0\n #pragma verboseAssembly\n long a, b, msg[4], *msgPtr;\n sendAmountAndMessage(1200, msg, 0xdede);\n sendAmountAndMessage(1200, msgPtr, 0xdede);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare msg\n^const SET @msg #0000000000000006\n^declare msg_0\n^declare msg_1\n^declare msg_2\n^declare msg_3\n^declare msgPtr\n\n^comment line 4  sendAmountAndMessage(1200, msg, 0xdede);\nSET @r0 #00000000000004b0\nSET @r1 #000000000000dede\nCLR @r2\nFUN set_B1_B2 $r1 $r2\nFUN send_to_Address_in_B $r0\nFUN set_A1_A2 $msg_0 $msg_1\nFUN set_A3_A4 $msg_2 $msg_3\nFUN send_A_to_Address_in_B\n^comment line 5  sendAmountAndMessage(1200, msgPtr, 0xdede);\nSET @r0 #00000000000004b0\nSET @r1 #000000000000dede\nCLR @r2\nFUN set_B1_B2 $r1 $r2\nFUN send_to_Address_in_B $r0\nSET @r0 $msgPtr\nSET @r1 $($r0)\nINC @r0\nSET @r2 $($r0)\nFUN set_A1_A2 $r1 $r2\nINC @r0\nSET @r1 $($r0)\nINC @r0\nSET @r2 $($r0)\nFUN set_A3_A4 $r1 $r2\nFUN send_A_to_Address_in_B\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: sendAmount(); sendAmountFx()', () => {
        const code = '#pragma optimizationLevel 0\n long a; fixed b; sendAmount(1_0000, 0xdede); sendAmountFx(0.2, 0xfafa);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSET @r0 #0000000000002710\nSET @r1 #000000000000dede\nCLR @r2\nFUN set_B1_B2 $r1 $r2\nFUN send_to_Address_in_B $r0\nSET @r0 #0000000001312d00\nSET @r1 #000000000000fafa\nCLR @r2\nFUN set_B1_B2 $r1 $r2\nFUN send_to_Address_in_B $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: sendBalance()()', () => {
        const code = '#pragma optimizationLevel 0\n sendBalance(0xdede);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n\nSET @r0 #000000000000dede\nFUN set_B1 $r0\nFUN send_All_to_Address_in_B\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getMapValue(); getMapValueFx()', () => {
        const code = '#pragma optimizationLevel 0\n long a = getMapValue(0, 1); fixed b = getMapValueFx(2, 3);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nCLR @r0\nSET @r1 #0000000000000001\nCLR @r2\nFUN set_A1_A2 $r0 $r1\nFUN set_A3 $r2\nFUN @a Get_Map_Value_Keys_In_A\nSET @r0 #0000000000000002\nSET @r1 #0000000000000003\nCLR @r2\nFUN set_A1_A2 $r0 $r1\nFUN set_A3 $r2\nFUN @b Get_Map_Value_Keys_In_A\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getExtMapValue(); getExtMapValueFx()', () => {
        const code = '#pragma optimizationLevel 0\n long a = getExtMapValue(0, 1, 0xdede); fixed b = getExtMapValueFx(2, 3, 0xfafa);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nCLR @r0\nSET @r1 #0000000000000001\nSET @r2 #000000000000dede\nFUN set_A1_A2 $r0 $r1\nFUN set_A3 $r2\nFUN @a Get_Map_Value_Keys_In_A\nSET @r0 #0000000000000002\nSET @r1 #0000000000000003\nSET @r2 #000000000000fafa\nFUN set_A1_A2 $r0 $r1\nFUN set_A3 $r2\nFUN @b Get_Map_Value_Keys_In_A\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: setMapValue(); setMapValueFx()', () => {
        const code = '#pragma optimizationLevel 0\n setMapValue(0, 1, 1_0000); setMapValueFx(2, 3, 0.2222);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n\nCLR @r0\nSET @r1 #0000000000000001\nSET @r2 #0000000000002710\nFUN set_A1_A2 $r0 $r1\nFUN set_A4 $r2\nFUN Set_Map_Value_Keys_In_A\nSET @r0 #0000000000000002\nSET @r1 #0000000000000003\nSET @r2 #0000000001530ce0\nFUN set_A1_A2 $r0 $r1\nFUN set_A4 $r2\nFUN Set_Map_Value_Keys_In_A\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: issueAsset()', () => {
        const code = '#pragma optimizationLevel 0\n long asset = issueAsset("ABCDEFGH", "IJ", 4);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare asset\n\nSET @r0 #4847464544434241\nSET @r1 #0000000000004a49\nSET @r2 #0000000000000004\nFUN set_A1_A2 $r0 $r1\nFUN set_B1 $r2\nFUN @asset Issue_Asset\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mintAsset()', () => {
        const code = '#pragma optimizationLevel 0\n mintAsset(1_0000, 0xa5531);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n\nSET @r0 #0000000000002710\nSET @r1 #00000000000a5531\nFUN set_B1_B2 $r1 $r0\nFUN Mint_Asset\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: sendQuantity()', () => {
        const code = '#pragma optimizationLevel 0\n sendQuantity(1_000, 0xa5531, 0xdede);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n\nSET @r0 #00000000000003e8\nSET @r1 #00000000000a5531\nSET @r2 #000000000000dede\nFUN set_B1_B2 $r2 $r1\nFUN send_to_Address_in_B $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: sendQuantityAndAmount(); sendQuantityAndAmountFx()', () => {
        const code = '#pragma optimizationLevel 0\n sendQuantityAndAmount(1_000, 0xa5531, 22, 0xdede); sendQuantityAndAmountFx(1_000, 0xa5531, .02, 0xdede); '
        const assembly = '^declare r0\n^declare r1\n^declare r2\n\nSET @r0 #000000000000dede\nSET @r1 #00000000000a5531\nFUN set_B1_B2 $r0 $r1\nSET @r0 #0000000000000016\nSET @r1 #00000000000003e8\nFUN set_B3 $r0\nFUN send_to_Address_in_B $r1\nSET @r0 #000000000000dede\nSET @r1 #00000000000a5531\nFUN set_B1_B2 $r0 $r1\nSET @r0 #00000000001e8480\nSET @r1 #00000000000003e8\nFUN set_B3 $r0\nFUN send_to_Address_in_B $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getAssetBalance()', () => {
        const code = '#pragma optimizationLevel 0\n long a = getAssetBalance(0xa5531);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 #00000000000a5531\nFUN set_B2 $r0\nFUN @a get_Current_Balance\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: checkSignature()', () => {
        const code = '#pragma optimizationLevel 0\n #pragma maxAuxVars 6\n long msg2, msg3, msg4, txId, page, creator; long result = checkSignature(msg2, msg3, msg4, txId, page, creator); asm { ^comment break } result = checkSignature("msg2", "msg3", "msg4", "txId", "page", "creator");'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare r5\n^declare msg2\n^declare msg3\n^declare msg4\n^declare txId\n^declare page\n^declare creator\n^declare result\n\nFUN set_A1_A2 $txId $page\nFUN set_A3 $creator\nFUN set_B2 $msg2\nFUN set_B3_B4 $msg3 $msg4\nFUN @result Check_Sig_B_With_A\n^comment break\nSET @r0 #0000000064497874\nSET @r1 #0000000065676170\nFUN set_A1_A2 $r0 $r1\nSET @r0 #00726f7461657263\nSET @r1 #000000003267736d\nFUN set_A3 $r0\nFUN set_B2 $r1\nSET @r0 #000000003367736d\nSET @r1 #000000003467736d\nFUN set_B3_B4 $r0 $r1\nFUN @result Check_Sig_B_With_A\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: distributeToHolders()', () => {
        const code = '#pragma optimizationLevel 0\n #pragma maxAuxVars 5\n long holdersAssetMinQuantity, holdersAsset, amountToDistribute, assetToDistribute, quantityToDistribute; distributeToHolders(holdersAssetMinQuantity, holdersAsset, amountToDistribute, assetToDistribute, quantityToDistribute); asm { ^comment break } distributeToHoldersFx(1, 2, 3.3, 4, 5);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare holdersAssetMinQuantity\n^declare holdersAsset\n^declare amountToDistribute\n^declare assetToDistribute\n^declare quantityToDistribute\n\nFUN set_B1_B2 $holdersAssetMinQuantity $holdersAsset\nFUN set_A1 $amountToDistribute\nFUN set_A3_A4 $assetToDistribute $quantityToDistribute\nFUN Distribute_To_Asset_Holders\n^comment break\nSET @r0 #0000000000000001\nSET @r1 #0000000000000002\nFUN set_B1_B2 $r0 $r1\nSET @r0 #0000000013ab6680\nFUN set_A1 $r0\nSET @r0 #0000000000000004\nSET @r1 #0000000000000005\nFUN set_A3_A4 $r0 $r1\nFUN Distribute_To_Asset_Holders\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getAssetHoldersCount()', () => {
        const code = '#pragma optimizationLevel 0\n long block = getAssetHoldersCount(1000, 0xa55e1);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare block\n\nSET @r0 #00000000000003e8\nSET @r1 #00000000000a55e1\nFUN set_B1_B2 $r0 $r1\nFUN @block Get_Asset_Holders_Count\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: readAssets()', () => {
        const code = '#pragma optimizationLevel 0\n long txId, assets[4], *assetsPtr; readAssets(txId, assets); asm { ^comment b} readAssets(25, assets); asm { ^comment b} readAssets(25, assetsPtr); asm { ^comment c} readAssets(txId, assetsPtr + 1);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare txId\n^declare assets\n^const SET @assets #0000000000000005\n^declare assets_0\n^declare assets_1\n^declare assets_2\n^declare assets_3\n^declare assetsPtr\n\nFUN set_A1 $txId\nFUN B_To_Assets_Of_Tx_In_A\nFUN @assets_0 get_B1\nFUN @assets_1 get_B2\nFUN @assets_2 get_B3\nFUN @assets_3 get_B4\n^comment b\nSET @r0 #0000000000000019\nFUN set_A1 $r0\nFUN B_To_Assets_Of_Tx_In_A\nFUN @assets_0 get_B1\nFUN @assets_1 get_B2\nFUN @assets_2 get_B3\nFUN @assets_3 get_B4\n^comment b\nSET @r0 #0000000000000019\nFUN set_A1 $r0\nFUN B_To_Assets_Of_Tx_In_A\nSET @r0 $assetsPtr\nFUN @r1 get_B1\nSET @($r0) $r1\nFUN @r1 get_B2\nINC @r0\nSET @($r0) $r1\nFUN @r1 get_B3\nINC @r0\nSET @($r0) $r1\nFUN @r1 get_B4\nINC @r0\nSET @($r0) $r1\n^comment c\nSET @r0 $assetsPtr\nINC @r0\nFUN set_A1 $txId\nFUN B_To_Assets_Of_Tx_In_A\nFUN @r1 get_B1\nSET @($r0) $r1\nFUN @r1 get_B2\nINC @r0\nSET @($r0) $r1\nFUN @r1 get_B3\nINC @r0\nSET @($r0) $r1\nFUN @r1 get_B4\nINC @r0\nSET @($r0) $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getQuantity()', () => {
        const code = '#pragma optimizationLevel 0\n long txId, asset; long qty = getQuantity(txId, asset); asm { ^comment b} qty = getQuantity(1234, 0xA55E1);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare txId\n^declare asset\n^declare qty\n\nFUN set_A1_A2 $txId $asset\nFUN @qty get_Amount_for_Tx_in_A\n^comment b\nSET @r0 #00000000000004d2\nSET @r1 #00000000000a55e1\nFUN set_A1_A2 $r0 $r1\nFUN @qty get_Amount_for_Tx_in_A\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: getAssetCirculating()', () => {
        const code = '#pragma optimizationLevel 0\n long a = getAssetCirculating(0xa55e1);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 #00000000000a55e1\nFUN set_A2 $r0\nFUN @a Get_Asset_Circulating\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})
