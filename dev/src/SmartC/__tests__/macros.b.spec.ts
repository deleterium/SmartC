import { SmartC } from '../smartc'

describe('#pragma warningToError false', () => {
    it('should compile: regular variable as pointer + warningToError false', () => {
        const code = '#pragma warningToError false\nlong *pa, *pb, va, vb;\n pa=vb; pa=*pb; *pa=pb; *pa=&pb; *pa=&vb; va=pb; va=&pb; va=&vb;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare pa\n^declare pb\n^declare va\n^declare vb\n\nSET @pa $vb\nSET @pa $($pb)\nSET @($pa) $pb\nSET @r0 #0000000000000004\nSET @($pa) $r0\nSET @r0 #0000000000000006\nSET @($pa) $r0\nSET @va $pb\nSET @va #0000000000000004\nSET @va #0000000000000006\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: function argument', () => {
        const code = '#pragma warningToError false\n long a, *b; test(a); void test(long *arg) {}'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare test_arg\n\nPSH $a\nJSR :__fn_test\nFIN\n\n__fn_test:\nPOP @test_arg\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: function return', () => {
        const code = '#pragma warningToError false\nlong a, *b; b = test(); long test(void) { return 5; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nJSR :__fn_test\nPOP @b\nFIN\n\n__fn_test:\nSET @r0 #0000000000000005\nPSH $r0\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: function return 2', () => {
        const code = '#pragma warningToError false\n long a, *b; b = test(); long test(void) { return b; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nJSR :__fn_test\nPOP @b\nFIN\n\n__fn_test:\nPSH $b\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: API function argument', () => {
        const code = '#pragma warningToError false\n#include APIFunctions\nlong a, *b; Set_A1(b);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nFUN set_A1 $b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: API function return', () => {
        const code = '#pragma warningToError false\n#include APIFunctions\nlong a, *b; b = Get_A1();'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nFUN @b get_A1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Address of an register', () => {
        const code = '#pragma warningToError false\nlong a, *b; b = &r1;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @b #0000000000000001\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Using regular variable as pointer', () => {
        const code = '#pragma warningToError false\nlong a, b; a=*(b+1);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $b\nINC @a\nSET @a $($a)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: forbidden char in name', () => {
        expect(() => {
            const code = '#program name test2 d\n long a;  a++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})
