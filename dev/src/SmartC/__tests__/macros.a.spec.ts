import { SmartC } from '../smartc'

/* preprocessor macros test are in preprocessor folder */
describe('#program', () => {
    it('should compile: name', () => {
        const code = '#program name tEst2\n long a;  a++;'
        const assembly = '^program name tEst2\n^declare r0\n^declare r1\n^declare r2\n^declare a\n\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
        expect(compiler.getMachineCode().PName).toBe('tEst2')
    })
    it('should compile: description', () => {
        const code = '#program description test teste tesssttt\n long a;  a++;'
        const assembly = '^program description test teste tesssttt\n^declare r0\n^declare r1\n^declare r2\n^declare a\n\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
        expect(compiler.getMachineCode().PDescription).toBe('test teste tesssttt')
    })
    it('should compile: activationAmount', () => {
        const code = '#program activationAmount 100000\n long a;  a++;'
        const assembly = '^program activationAmount 100000\n^declare r0\n^declare r1\n^declare r2\n^declare a\n\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
        expect(compiler.getMachineCode().PActivationAmount).toBe('100000')
    })
    test('should throw: forbidden char in name', () => {
        expect(() => {
            const code = '#program name test-2\n long a;  a++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: forbidden char in name', () => {
        expect(() => {
            const code = '#program name test2 d\n long a;  a++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: forbiden activation amount in hex', () => {
        expect(() => {
            const code = '#program activationAmount 0xff\n long a;  a++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: allow _ in activationAmount', () => {
        const code = '#program activationAmount 5_0000_0000'
        const assembly = '^program activationAmount 500000000\n^declare r0\n^declare r1\n^declare r2\n\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
        expect(compiler.getMachineCode().PActivationAmount).toBe('500000000')
    })
    it('should compile: codeStackPages', () => {
        const code = '#program codeStackPages    10   \nlong a; void test(void) { a++; return; a++; }'
        const assembly = '^program codeStackPages 10\n^declare r0\n^declare r1\n^declare r2\n^declare a\n\nFIN\n\n__fn_test:\nINC @a\nRET\nINC @a\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: codeStackPages  userStackPages ', () => {
        const code = '#program codeStackPages    0   \n#program userStackPages 5\n long a; void test(long aa) { a++; return; a++; }'
        const assembly = '^program userStackPages 5\n^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare test_aa\n\nFIN\n\n__fn_test:\nPOP @test_aa\nINC @a\nRET\nINC @a\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: codeStackPages wrong usage', () => {
        expect(() => {
            const code = '#program codeStackPages a\n#program userStackPages  0\nlong a; void test(void) { a++; return; a++; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: userStackPages wrong usage', () => {
        expect(() => {
            const code = '#program codeStackPages 1\n#program userStackPages  100\nlong a; void test(void) { a++; return; a++; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})

describe('#pragma', () => {
    it('should compile: outputSourceLineNumber', () => {
        const code = '#pragma outputSourceLineNumber\nlong a=5;\nif (a==6){\na--;\n}\n'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\n^comment line 2\nSET @a #0000000000000005\n^comment line 3\nSET @r0 #0000000000000006\nBNE $a $r0 :__if1_endif\n__if1_start:\n^comment line 4\nDEC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})
