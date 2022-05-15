import { SmartC } from '../smartc'

describe('Adress Of', () => {
    it('should compile: address of', () => {
        const code = 'long a, b; a=(b);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: deferencing variable not pointer on left side', () => {
        expect(() => {
            const code = 'long a, b, c, d; *(a+1)=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})
