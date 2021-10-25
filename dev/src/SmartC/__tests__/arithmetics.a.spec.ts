import { SmartC } from '../smartc'

describe('Void compilation', () => {
    it('should compile: nothing', () => {
        const code = ''
        const assembly = '^declare r0\n^declare r1\n^declare r2\n\nFIN\n'
        const machinecode = '28'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
        expect(compiler.getMachineCode().ByteCode).toBe(machinecode)
    })
    it('should compile: ;', () => {
        const code = ';;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n\nFIN\n'
        const machinecode = '28'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
        expect(compiler.getMachineCode().ByteCode).toBe(machinecode)
    })
    it('should compile: var;', () => {
        const code = 'long a; a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nFIN\n'
        const machinecode = '28'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
        expect(compiler.getMachineCode().ByteCode).toBe(machinecode)
    })
    it('should compile: 2;', () => {
        const code = '2;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n\nFIN\n'
        const machinecode = '28'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
        expect(compiler.getMachineCode().ByteCode).toBe(machinecode)
    })
})

describe('Assignment / SetOperator', () => {
    it('should compile: =', () => {
        const code = 'long a, b; a=b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: += -= *= /= %= &= |= ^= <<= >>= ', () => {
        const code = 'long a; long b; a+=b; a-=b; a*=b;a/=b;a%=b; a&=b; a|=b; a^=b; a<<=b; a>>=b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nADD @a $b\nSUB @a $b\nMUL @a $b\nDIV @a $b\nMOD @a $b\nAND @a $b\nBOR @a $b\nXOR @a $b\nSHL @a $b\nSHR @a $b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: missing right side of assignment', () => {
        expect(() => {
            const code = 'long a=;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: missing left side of SetOperator', () => {
        expect(() => {
            const code = 'long a; +=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})

describe('Constant', () => {
    it('should compile: number', () => {
        const code = 'long a; a=2;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #0000000000000002\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: hex number', () => {
        const code = 'long a; a=0xAbC;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #0000000000000abc\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: zero', () => {
        const code = 'long a; a=0;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nCLR @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a; a+=2;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nINC @a\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a; a+=0xfffffff;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 #000000000fffffff\nADD @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: accountRS', () => {
        const code = "long a; a='S-MKCL-2226-W6AH-7ARVS';"
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #5c6ee8000049c552\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: empty string', () => {
        const code = "long a; a='';"
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nCLR @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: long number', () => {
        const code = 'long a; a=6660515985630020946;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #5c6ee8000049c552\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: max unsigned long', () => {
        const code = 'long a; a=18446744073709551615;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #ffffffffffffffff\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: number with _ separator', () => {
        const code = 'long a, b, c, d; a=5_0000_0000; b=5_0000_0000; c=0x00ff_00fe_7fff; d=0x00ff00fe7fff;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a #000000001dcd6500\nSET @b #000000001dcd6500\nSET @c #000000ff00fe7fff\nSET @d #000000ff00fe7fff\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: string', () => {
        const code = 'long a; a="Hi there";'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #6572656874206948\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: long overflow', () => {
        expect(() => {
            const code = 'long a; a=18446744073709551616;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: long overflow', () => {
        expect(() => {
            const code = 'long a; a=18446744073709551617;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: string overflow', () => {
        expect(() => {
            const code = 'long a; a="Hi there big";'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: invalid assignment', () => {
        expect(() => {
            const code = 'long a; 2=a;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: invalid RS decode', () => {
        expect(() => {
            const code = 'long a = "TS-MPMZ-8CD9-HZMD-A7R1X";'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: invalid RS decode 2', () => {
        expect(() => {
            const code = 'long a = "TS-MPMZ-8CD9-HZMD-A9R2X"'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})

describe('Operator', () => {
    it('should compile: /', () => {
        const code = 'long a, b, c; a=b/c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nDIV @a $c\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: %', () => {
        const code = 'long a, b, c; a=b%c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nMOD @a $c\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: <<', () => {
        const code = 'long a, b, c; a=b<<c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nSHL @a $c\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: >>', () => {
        const code = 'long a, b, c; a=b>>c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nSHR @a $c\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: |', () => {
        const code = 'long a, b, c; a=b|c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nBOR @a $c\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: ^', () => {
        const code = 'long a, b, c; a=b^c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nXOR @a $c\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})

describe('UnaryOperator', () => {
    it('should compile: !', () => {
        const code = 'long a, b; a=!b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBNZ $b :__NOT_1_sF\nSET @a #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @a\n__NOT_1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: ~', () => {
        const code = 'long a, b; a=~b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $b\nNOT @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b; a^=~b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $b\nNOT @r0\nXOR @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b; a=~0xff;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a #00000000000000ff\nNOT @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c; a>>=b^~c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @r0 $c\nNOT @r0\nXOR @r0 $b\nSHR @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b; a=~~b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $b\nNOT @a\nNOT @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c; a=~b/c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nNOT @a\nDIV @a $c\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c; a=~b/~c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nNOT @a\nSET @r0 $c\nNOT @r0\nDIV @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c; a=b/~c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @r0 $c\nNOT @r0\nSET @a $b\nDIV @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: invalid assignment', () => {
        expect(() => {
            const code = 'long a, b; ~a=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})
