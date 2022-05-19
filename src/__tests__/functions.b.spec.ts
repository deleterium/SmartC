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

describe('Built-in functions', () => {
    it('should compile: mdv()', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c, d; a = mdv(b, c, d);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $b\nMDV @a $c $d\nFIN\n'
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
})
