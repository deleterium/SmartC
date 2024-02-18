import { SmartC } from '../smartc'

describe('SetUnaryOperator', () => {
    it('should compile: ++ post', () => {
        const code = 'long a; a++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: -- post', () => {
        const code = 'long a; a--;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nDEC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: ++ pre', () => {
        const code = 'long a; ++a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: -- pre', () => {
        const code = 'long a; --a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nDEC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c; a=b++/c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nDIV @a $c\nINC @b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c; a=--b/c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nDEC @b\nSET @a $b\nDIV @a $c\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c; a=~--b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nDEC @b\nSET @a $b\nNOT @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c; a+=~b++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @r0 $b\nNOT @r0\nADD @a $r0\nINC @b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c; a=~b++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nNOT @a\nINC @b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a; a++=2;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #0000000000000002\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: increment constant', () => {
        expect(() => {
            const code = 'long a; a=2++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: increment constant', () => {
        expect(() => {
            const code = 'long a; a=++2;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: no varible to apply', () => {
        expect(() => {
            const code = '--;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: increment constant alone', () => {
        expect(() => {
            const code = '2++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: -- double meaning (ok for new parser)', () => {
        const code = 'long a, b, c; a=b- -c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nCLR @r0\nSUB @r0 $c\nSET @a $b\nSUB @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})

describe('CheckOperator Unary', () => {
    it('should compile: -', () => {
        const code = 'long a, b; a+=-b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @r0\nSUB @r0 $b\nADD @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: -', () => {
        const code = 'long a, b; a=-b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @a\nSUB @a $b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c; a=b/-c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nCLR @r0\nSUB @r0 $c\nSET @a $b\nDIV @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c; a=-b/c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nCLR @a\nSUB @a $b\nDIV @a $c\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: optimization on constant', () => {
        const code = 'long a, b; a=-2;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a #fffffffffffffffe\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b; a=-~b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $b\nNOT @r0\nCLR @a\nSUB @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b; a=~-b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @a\nSUB @a $b\nNOT @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b; a=-b-- ;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @a\nSUB @a $b\nDEC @b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: - invalid usage', () => {
        expect(() => {
            const code = 'long a, b; a=---b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: +', () => {
        const code = 'long a, b; a=+b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c; a=b/+c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nDIV @a $c\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c; a=+b/-c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nCLR @r0\nSUB @r0 $c\nSET @a $b\nDIV @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c; a=+b/+c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nDIV @a $c\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: +', () => {
        const code = 'long a; a=+2;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #0000000000000002\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a; a-=+~2;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 #0000000000000002\nNOT @r0\nSUB @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a; a=~+2;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #0000000000000002\nNOT @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: + invalid usage', () => {
        const code = 'long a; a=+;'
        expect(() => {
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: &', () => {
        const code = 'long *a, b; a=&b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a #0000000000000004\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: address of void', () => {
        expect(() => {
            const code = 'long a; a=&test(); void test(void) {}'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: address of register', () => {
        expect(() => {
            const code = 'long a; a=&(a+1);'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: address of a constant', () => {
        expect(() => {
            const code = 'long a; a=&2;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: address of a label', () => {
        expect(() => {
            const code = 'long a; a=&a:'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })

    it('should compile: * (pointer)', () => {
        const code = 'long a, *b; a=*b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $($b)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: pointer on left side', () => {
        const code = 'long *a, b; *a=b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @($a) $b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix pointer', () => {
        const code = 'long a, *b; a=*b/5;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $($b)\nSET @r0 #0000000000000005\nDIV @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix pointer', () => {
        const code = 'long a, *b; a=5/ *b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a #0000000000000005\nSET @r0 $($b)\nDIV @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix pointer', () => {
        const code = 'long a, *b; a*=*b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $($b)\nMUL @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix pointer', () => {
        const code = 'long a, *b, *c; a=*b<<*c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $($b)\nSET @r0 $($c)\nSHL @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix pointer', () => {
        const code = 'long a, *b; a=~*b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $($b)\nNOT @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix pointer', () => {
        const code = 'long a, *b; a=-*b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @a\nSET @r0 $($b)\nSUB @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: pointer pre decrement', () => {
        const code = 'long a, *b; a=*--b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nDEC @b\nSET @a $($b)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: pointer post decrement', () => {
        const code = 'long a, *b; a=*b--;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $($b)\nDEC @b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: pointer invalid usage', () => {
        expect(() => {
            const code = 'long a, b; a=*~b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: pre increment deferenced pointer', () => {
        expect(() => {
            const code = 'long a, b; a=++*b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: pointer of pointer (invalid usage)', () => {
        expect(() => {
            const code = 'long a, b; a=**b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})
