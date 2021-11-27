import { SmartC } from '../smartc'

describe('Tests for bugfixes', () => {
    it('should compile: bug 1, goto failed with undeclared variable', () => {
        const code = '#pragma optimizationLevel 0\nvoid  teste(long ret) { long temp = 2; goto newlabel; ret = temp; newlabel: temp++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare teste_ret\n^declare teste_temp\n\nFIN\n\n__fn_teste:\nPOP @teste_ret\nSET @teste_temp #0000000000000002\nJMP :newlabel\nSET @teste_ret $teste_temp\nnewlabel:\nINC @teste_temp\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: bug 2, failed when declaring pointer on function declaration', () => {
        const code = '#pragma optimizationLevel 0\nvoid  teste(long * ret) { long temp = 2; goto newlabel; ret[temp] = temp; newlabel: temp++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare teste_ret\n^declare teste_temp\n\nFIN\n\n__fn_teste:\nPOP @teste_ret\nSET @teste_temp #0000000000000002\nJMP :newlabel\nSET @($teste_ret + $teste_temp) $teste_temp\nnewlabel:\nINC @teste_temp\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: bug 2', () => {
        const code = '#pragma optimizationLevel 0\nvoid  teste(long * ret) { long temp = 2; goto newlabel; *(ret+temp) = temp; newlabel: temp++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare teste_ret\n^declare teste_temp\n\nFIN\n\n__fn_teste:\nPOP @teste_ret\nSET @teste_temp #0000000000000002\nJMP :newlabel\nSET @r0 $teste_ret\nADD @r0 $teste_temp\nSET @($r0) $teste_temp\nnewlabel:\nINC @teste_temp\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: bug 3, ReuseAssignedVar not working inside a function.', () => {
        const code = "#pragma optimizationLevel 0\n#pragma maxAuxVars 2\nlong itoa(long val) {\n    long ret, temp;\n    if (val >= 0 && val <= 99999999) { ret = (ret << 8) + temp; return ret; }\n    return '#error';\n}"
        const assembly = '^declare r0\n^declare r1\n^declare itoa_val\n^declare itoa_ret\n^declare itoa_temp\n\nFIN\n\n__fn_itoa:\nPOP @itoa_val\nCLR @r0\nBLT $itoa_val $r0 :__if1_endif\n__AND_2_next:\nSET @r0 #0000000005f5e0ff\nBGT $itoa_val $r0 :__if1_endif\nJMP :__if1_start\n__if1_start:\nSET @r0 $itoa_ret\nSET @r1 #0000000000000008\nSHL @r0 $r1\nADD @r0 $itoa_temp\nSET @itoa_ret $r0\nPSH $itoa_ret\nRET\n__if1_endif:\nSET @r0 #0000726f72726523\nPSH $r0\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: bug 4, Double declaration causing array pointer to point wrong location.', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a=0; long b; a++; long a=3;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: bug 5, reuseAssignedVar not working inside functions.', () => {
        const code = '#pragma optimizationLevel 0\nvoid test(void) { long t, a; t = a+1; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare test_t\n^declare test_a\n\nFIN\n\n__fn_test:\nSET @test_t $test_a\nINC @test_t\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    // REMOVED. bug 6 warning when function returning long had no assignment. (deprecated)
    it('should compile: bug 7, array type definition not found when declaring array inside functions.', () => {
        const code = '#pragma optimizationLevel 0\nvoid test(void) { long t[2], a; t[a] = 1; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare test_t\n^const SET @test_t #0000000000000004\n^declare test_t_0\n^declare test_t_1\n^declare test_a\n\nFIN\n\n__fn_test:\nSET @r0 #0000000000000001\nSET @($test_t + $test_a) $r0\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: bug 8, wrong order of stack for function call', () => {
        const code = '#pragma optimizationLevel 0\nlong ga, gb, gc; test(ga, gb, gc); void test(long a, long b, long c) { a+=b+c; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare ga\n^declare gb\n^declare gc\n^declare test_a\n^declare test_b\n^declare test_c\n\nPSH $gc\nPSH $gb\nPSH $ga\nJSR :__fn_test\nFIN\n\n__fn_test:\nPOP @test_a\nPOP @test_b\nPOP @test_c\nSET @r0 $test_b\nADD @r0 $test_c\nADD @test_a $r0\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: bug 9, missing comma before if, while and for keywords lead to no error and statement being ignored.', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a, b; test2() if (a) a++; long test2(void) { b++; return b; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: bug 9, but right', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; test2(); if (a) a++; long test2(void) { b++; return b; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nJSR :__fn_test2\nPOP @r0\nBZR $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n\n__fn_test2:\nINC @b\nPSH $b\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: bug 10, functions calls destroying content of registers. Implemented saving them in user stack', () => {
        const code = "#pragma optimizationLevel 0\nlong a[5], b, c; b=atoi(c); a[b+1]=atoi('2'); a[b+1]=(b*2)/atoi('2'); long atoi(long val){return val+1;}"
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare b\n^declare c\n^declare atoi_val\n\nPSH $c\nJSR :__fn_atoi\nPOP @b\nSET @r0 $b\nINC @r0\nPSH $r0\nSET @r1 #0000000000000032\nPSH $r1\nJSR :__fn_atoi\nPOP @r1\nPOP @r0\nSET @($a + $r0) $r1\nSET @r0 $b\nINC @r0\nSET @r1 #0000000000000002\nMUL @r1 $b\nPSH $r1\nPSH $r0\nSET @r2 #0000000000000032\nPSH $r2\nJSR :__fn_atoi\nPOP @r2\nPOP @r0\nPOP @r1\nDIV @r1 $r2\nSET @($a + $r0) $r1\nFIN\n\n__fn_atoi:\nPOP @atoi_val\nSET @r0 $atoi_val\nINC @r0\nPSH $r0\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: bug 11, function calls inside array brackets lead to error.', () => {
        const code = '#pragma optimizationLevel 0\nlong a[5], b, c; b=a[atoi("2")+1]; long atoi(long val){ return val+1;}'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare b\n^declare c\n^declare atoi_val\n\nSET @b #0000000000000032\nPSH $b\nJSR :__fn_atoi\nPOP @b\nINC @b\nSET @b $($a + $b)\nFIN\n\n__fn_atoi:\nPOP @atoi_val\nSET @r0 $atoi_val\nINC @r0\nPSH $r0\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: bug 12: bug when changing branch with offset overflow (this code causes error on v0.1)', () => {
        const code = 'BNE $var1 $var15 :lab_aa6\nBNE $var1 $var15 :lab_de2\nlab_aa6:\nSET @var02 #2065726120756f59\nSET @var02 #2065726120756f59\nSET @var02 #2065726120756f59\nSET @var02 #656e776f20746f6e\nSET @var02 #65746920666f2072\nSET @var02 #0000000000002e6d\nFIN\nlab_af3:\nSET @var02 #65746920666f2072\nSET @var02 #65746920666f2072\nSET @var02 #65746920666f2072\nlab_de2:\nFIN\n'
        const MachineCode = '240000000001000000192300000000010000000f1a8f0000000102000000596f7520617265200102000000596f7520617265200102000000596f75206172652001020000006e6f74206f776e65010200000072206f662069746501020000006d2e00000000000028010200000072206f6620697465010200000072206f6620697465010200000072206f662069746528'
        const MachineData = ''
        const result = new SmartC({ language: 'Assembly', sourceCode: code }).compile().getMachineCode()
        expect(result.ByteCode).toBe(MachineCode)
        expect(result.ByteData).toBe(MachineData)
    })
    it('should compile: bug 13, optimization deleting assembly compiler directives', () => {
        const code = '#pragma optimizationLevel 3\nwhile (1) halt; const long n8=8, n10=10, n0xff=0xff; long atoi(long val) { return 3; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare n8\n^declare n10\n^declare n0xff\n^declare atoi_val\n\n__loop1_continue:\nSTP\nJMP :__loop1_continue\n^const SET @n8 #0000000000000008\n^const SET @n10 #000000000000000a\n^const SET @n0xff #00000000000000ff\n\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: bug 14, (more) optimization deleting assembly compiler directives', () => {
        const code = '#pragma optimizationLevel 3\n teste(); exit; const long n0xff=0xff; void teste(void) { const long b=5; b++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare n0xff\n^declare teste_b\n\nJSR :__fn_teste\nFIN\n^const SET @n0xff #00000000000000ff\n\n__fn_teste:\n^const SET @teste_b #0000000000000005\nINC @teste_b\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: bug 15, Need to be more restrictive on optimizationLevel 3 for PSH and POP', () => {
        const code = '#pragma optimizationLevel 3\n long a, b; a=b;insertPlayer(a); void insertPlayer(long address) { long id; id=(address >> 27); }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare insertPlayer_address\n^declare insertPlayer_id\n\nSET @a $b\nPSH $a\nJSR :__fn_insertPlayer\nFIN\n\n__fn_insertPlayer:\nPOP @insertPlayer_address\nSET @insertPlayer_id $insertPlayer_address\nSET @r0 #000000000000001b\nSHR @insertPlayer_id $r0\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: bug 16, Could not return or sleep with array and variable index', () => {
        const code = 'long a, slot[4]; sleep slot[a];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare slot\n^const SET @slot #0000000000000005\n^declare slot_0\n^declare slot_1\n^declare slot_2\n^declare slot_3\n\nSET @r0 $($slot + $a)\nSLP $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: bug 17 Could not start program with function', () => {
        const code = 'XOR_A_with_B();\n#include APIFunctions'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n\nFUN XOR_A_with_B\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: bug 18 Fix infinite recursion loop with wrong code', () => {
        expect(() => {
            const code = 'Send_To_Address_In_B(sendEachBlockNQT) sleep SLP_BLOCKS;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: bug19 Optimization creating wrong code. Removed optimization on double SET instruction', () => {
        const code = '#pragma optimizationLevel 3\nlong _idx, uCount; _idx = ~(_idx+uCount); uCount = _idx; _idx++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare _idx\n^declare uCount\n\nSET @r0 $_idx\nADD @r0 $uCount\nNOT @r0\nSET @_idx $r0\nSET @uCount $_idx\nINC @_idx\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: bug 20 Fixes some wrong translation of RS-accounts', () => {
        const code = "long a='S-D3HS-T6ML-SJHU-2R5R2';"
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #005c77c9272585f8\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: bug 21 Memory was not assigned when declaring struct after a struct pointer', () => {
        const code = '#pragma optimizationLevel 0\nstruct KOMBI { long driver; long collector; long passenger; }; void teste(void) { struct KOMBI tt2, *stru, tt, *stru2; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare teste_tt2_driver\n^declare teste_tt2_collector\n^declare teste_tt2_passenger\n^declare teste_stru\n^declare teste_tt_driver\n^declare teste_tt_collector\n^declare teste_tt_passenger\n^declare teste_stru2\n\nFIN\n\n__fn_teste:\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: bug 22 Function/API Functions on conditional not being evaluated', () => {
        const code = '#pragma optimizationLevel 0\nlong a=0; if (test2(a)){ a++; } long test2(long b) { b++; return b; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare test2_b\n\nCLR @a\nPSH $a\nJSR :__fn_test2\nPOP @r0\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n\n__fn_test2:\nPOP @test2_b\nINC @test2_b\nPSH $test2_b\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: bug 22 ', () => {
        const code = '#pragma optimizationLevel 0\n#include APIFunctions\n long a=0; if (Get_A1()){ a++;} '
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nCLR @a\nFUN @r0 get_A1\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: bug 23 Parser trying to get property of undefined variable', () => {
        expect(() => {
            const code = 'long a, b; *a + 1 = b'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: bug 24 Wrong code being sucessfull compiled: ASM and Label disregarding information before them.', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nvoid  teste(long ret) { long temp = 2; if (temp==2){ goto div_end: } ret = temp; div_end: temp++; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: bug 24 ', () => {
        expect(() => {
            const code = 'long a, b; a++; long c, asm { PSH $a\nPOP @b } b++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: bug 25 Incompatibility with const keyword and optimization for contants value', () => {
        const code = '#pragma maxConstVars 3\nconst long a = 1;const long n256 = 256;const long ac = 256;long ad = 256, ae = ac;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare n1\n^const SET @n1 #0000000000000001\n^declare n2\n^const SET @n2 #0000000000000002\n^declare n3\n^const SET @n3 #0000000000000003\n^declare a\n^declare n256\n^declare ac\n^declare ad\n^declare ae\n\n^const SET @a #0000000000000001\n^const SET @n256 #0000000000000100\n^const SET @ac #0000000000000100\nSET @ad $n256\nSET @ae $ac\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: bug 26 Keyword substring in variable name causing error', () => {
        const code = 'long doing; doing++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare doing\n\nINC @doing\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: bug 27 Infinite loop during level 2 optimization', () => {
        const code = '#pragma optimizationLevel 2\nvoid main(void) { long a; if (a==1) { exit; } }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare main_a\n\n\nPCS\nSET @r0 #0000000000000001\nBNE $main_a $r0 :__if1_endif\nFIN\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})
