import { SmartC } from '../smartc'

describe('Arrays', () => {
    describe('Array assignment (left side)', () => {
        it('should compile: Array long constant index', () => {
            const code = '#pragma optimizationLevel 0\nfixed a[4]; long b; fixed c; a[3]=c;'
            const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^const SET @a #0000000000000005\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @a_3 $c\nFIN\n'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
            expect(compiler.getAssemblyCode()).toBe(assembly)
        })
        test('should throw: array fixed constant index', () => {
            expect(() => {
                const code = 'fixed a[4]; long b; fixed c; a[3.0]=c;'
                const compiler = new SmartC({ language: 'C', sourceCode: code })
                compiler.compile()
            }).toThrowError(/^At line/)
        })
        it('should compile: Array long variable index', () => {
            const code = '#pragma optimizationLevel 0\nfixed a[4]; long b; fixed c; a[b]=c;'
            const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^const SET @a #0000000000000005\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @($a + $b) $c\nFIN\n'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
            expect(compiler.getAssemblyCode()).toBe(assembly)
        })
        test('should throw: array fixed variable index', () => {
            expect(() => {
                const code = 'fixed a[4]; long b; fixed c; a[c]=c;'
                const compiler = new SmartC({ language: 'C', sourceCode: code })
                compiler.compile()
            }).toThrowError(/^At line/)
        })
    })
    describe('Array assignment (right side)', () => {
        it('should compile: Array long constant index', () => {
            const code = '#pragma optimizationLevel 0\nfixed a[4]; long b; fixed c; c=a[3];'
            const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^const SET @a #0000000000000005\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @c $a_3\nFIN\n'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
            expect(compiler.getAssemblyCode()).toBe(assembly)
        })
        test('should throw: array fixed constant index', () => {
            expect(() => {
                const code = 'fixed a[4]; long b; fixed c; c=a[3.0];'
                const compiler = new SmartC({ language: 'C', sourceCode: code })
                compiler.compile()
            }).toThrowError(/^At line/)
        })
        it('should compile: Array long variable index', () => {
            const code = '#pragma optimizationLevel 0\nfixed a[4]; long b; fixed c; c=a[b];'
            const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^const SET @a #0000000000000005\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @c $($a + $b)\nFIN\n'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
            expect(compiler.getAssemblyCode()).toBe(assembly)
        })
        test('should throw: array fixed variable index', () => {
            expect(() => {
                const code = 'fixed a[4]; long b; fixed c; c=a[c];'
                const compiler = new SmartC({ language: 'C', sourceCode: code })
                compiler.compile()
            }).toThrowError(/^At line/)
        })
    })
    describe('Array assignment (both sides)', () => {
        it('should compile: Array long constant/constant index', () => {
            const code = '#pragma optimizationLevel 0\nfixed a[4], b[4]; long c,d; a[2]=b[3];'
            const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^const SET @a #0000000000000005\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^const SET @b #000000000000000a\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a_2 $b_3\nFIN\n'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
            expect(compiler.getAssemblyCode()).toBe(assembly)
        })
        it('should compile: Array long long/constant index', () => {
            const code = '#pragma optimizationLevel 0\nfixed a[4], b[4]; long c,d; a[c]=b[3];'
            const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^const SET @a #0000000000000005\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^const SET @b #000000000000000a\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @($a + $c) $b_3\nFIN\n'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
            expect(compiler.getAssemblyCode()).toBe(assembly)
        })
        it('should compile: Array long constant/long index', () => {
            const code = '#pragma optimizationLevel 0\nfixed a[4], b[4]; long c,d; a[3]=b[d];'
            const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^const SET @a #0000000000000005\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^const SET @b #000000000000000a\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a_3 $($b + $d)\nFIN\n'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
            expect(compiler.getAssemblyCode()).toBe(assembly)
        })
        it('should compile: Array long long/long index', () => {
            const code = '#pragma optimizationLevel 0\nfixed a[4], b[4]; long c,d; a[c]=b[d];'
            const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^const SET @a #0000000000000005\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^const SET @b #000000000000000a\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @r0 $($b + $d)\nSET @($a + $c) $r0\nFIN\n'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
            expect(compiler.getAssemblyCode()).toBe(assembly)
        })
    })

    describe('Multi dimensional Arrays assignment (left side)', () => {
        it('should compile: constants', () => {
            const code = 'fixed a[4][2]; long b, c; a[2][1]=4.0;'
            const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^const SET @a #0000000000000005\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n^declare c\n\nSET @a_5 #0000000017d78400\nFIN\n'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
            expect(compiler.getAssemblyCode()).toBe(assembly)
        })
        it('should compile: variable+constants', () => {
            const code = 'fixed a[4][2]; long b, c; a[b][1]=4.0;'
            const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^const SET @a #0000000000000005\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n^declare c\n\nSET @r0 #0000000000000002\nMUL @r0 $b\nINC @r0\nSET @r1 #0000000017d78400\nSET @($a + $r0) $r1\nFIN\n'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
            expect(compiler.getAssemblyCode()).toBe(assembly)
        })
        it('should compile: variable+zero', () => {
            const code = 'fixed a[4][2]; long b, c; a[b][0]=4.0;'
            const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^const SET @a #0000000000000005\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n^declare c\n\nSET @r0 #0000000000000002\nMUL @r0 $b\nSET @r1 #0000000017d78400\nSET @($a + $r0) $r1\nFIN\n'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
            expect(compiler.getAssemblyCode()).toBe(assembly)
        })
        it('should compile: zero+variable', () => {
            const code = 'fixed a[4][2]; long b, c; a[0][b]=4.0;'
            const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^const SET @a #0000000000000005\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n^declare c\n\nSET @r0 #0000000017d78400\nSET @($a + $b) $r0\nFIN\n'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
            expect(compiler.getAssemblyCode()).toBe(assembly)
        })
        it('should compile: constant+variable', () => {
            const code = 'fixed a[4][2]; long b, c; a[3][b]=4.0;'
            const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^const SET @a #0000000000000005\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n^declare c\n\nSET @r0 $b\nSET @r1 #0000000000000006\nADD @r0 $r1\nSET @r1 #0000000017d78400\nSET @($a + $r0) $r1\nFIN\n'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
            expect(compiler.getAssemblyCode()).toBe(assembly)
        })
        it('should compile: variable+variable', () => {
            const code = 'fixed a[4][2]; long b, c; a[b][c]=4.0;'
            const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^const SET @a #0000000000000005\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n^declare c\n\nSET @r0 #0000000000000002\nMUL @r0 $b\nADD @r0 $c\nSET @r1 #0000000017d78400\nSET @($a + $r0) $r1\nFIN\n'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
            expect(compiler.getAssemblyCode()).toBe(assembly)
        })
    })
})
