import { SmartC } from '../smartc'

describe('SmartC class (no compiling)', () => {
    test('wrong language', () => {
        expect(() => {
            // eslint-disable-next-line
            const compiler = new SmartC({
                // @ts-expect-error
                language: 'c',
                sourceCode: ''
            })
            compiler.compile()
        }).toThrow()
    })
    test('wrong usage', () => {
        expect(() => {
            const compiler = new SmartC({
                language: 'C',
                sourceCode: ''
            })
            compiler.getAssemblyCode()
        }).toThrow()
    })
    test('wrong usage', () => {
        expect(() => {
            const compiler = new SmartC({
                language: 'C',
                sourceCode: ''
            })
            compiler.getMachineCode()
        }).toThrow()
    })
})
describe('SmartC class (void compiling)', () => {
    it('should compile sucessfull void C code 1x', () => {
        const compiler = new SmartC({
            language: 'C',
            sourceCode: ''
        })
        expect(compiler.compile().getAssemblyCode()).toBe('^declare r0\n^declare r1\n^declare r2\n\nFIN\n')
    })
    it('should compile sucessfull void C code 2x', () => {
        const compiler = new SmartC({
            language: 'C',
            sourceCode: ''
        })
        compiler.compile()
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe('^declare r0\n^declare r1\n^declare r2\n\nFIN\n')
    })
    it('should compile sucessfull void Assembly code', () => {
        const compiler = new SmartC({
            language: 'Assembly',
            sourceCode: ''
        })
        expect(compiler.compile().getAssemblyCode()).toBe('')
        expect(compiler.getMachineCode().ByteCode).toBe('')
    })
})
