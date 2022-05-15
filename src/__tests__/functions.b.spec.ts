import { SmartC } from '../smartc'

describe('API functions', () => {
    it('should compile: right use', () => {
        const code = '#pragma optimizationLevel 0\n#include APIFunctions\nlong a;Set_A1(a);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nFUN set_A1 $a\nFIN\n'
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
