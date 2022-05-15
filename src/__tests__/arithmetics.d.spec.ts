import { SmartC } from '../smartc'

describe('CodeCave', () => {
    it('should compile: simple ()', () => {
        const code = 'long a, b; a=(b);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: simple ()', () => {
        const code = 'long a, b; a*=(b);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nMUL @a $b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: simple ()', () => {
        const code = 'long a; a=(2);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #0000000000000002\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: simple ()', () => {
        const code = 'long a, *b, c, d; a=*(b);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $($b)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: sum for pointer before deferencing', () => {
        const code = 'long a, *b, c, d; a=*(b+c);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $b\nADD @a $c\nSET @a $($a)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: sum for pointer before deferencing', () => {
        const code = 'long a, b, *c, d; a=*(b+c);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $b\nADD @a $c\nSET @a $($a)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: sum for pointer before deferencing', () => {
        const code = 'long a, b, *c, d; a=*(5+c);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a #0000000000000005\nADD @a $c\nSET @a $($a)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: sum for pointer before deferencing on left side', () => {
        const code = 'long *a, b, c, d; *(a+1)=b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @r0 $a\nINC @r0\nSET @($r0) $b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c, d; a=(b*c)*d;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $b\nMUL @a $c\nMUL @a $d\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c, d; a=(b/c)/d;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $b\nDIV @a $c\nDIV @a $d\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c, d; a=~(0xFF<<8);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a #00000000000000ff\nSET @r0 #0000000000000008\nSHL @a $r0\nNOT @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c, d; a=~(b/c)/d;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $b\nDIV @a $c\nNOT @a\nDIV @a $d\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c, d; a=(b/c)/~d;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $b\nDIV @a $c\nSET @r0 $d\nNOT @r0\nDIV @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c, d; a=~(b/c/d);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $b\nDIV @a $c\nDIV @a $d\nNOT @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c, d, e; a=(b+c)*(d+e);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nSET @a $b\nADD @a $c\nSET @r0 $d\nADD @r0 $e\nMUL @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c, d, e; a=(b+c)/(d+e);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nSET @a $b\nADD @a $c\nSET @r0 $d\nADD @r0 $e\nDIV @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b, c, d, e; a%=1-((b+c)*(d+e));'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nSET @r0 $b\nADD @r0 $c\nSET @r1 $d\nADD @r1 $e\nMUL @r0 $r1\nSET @r1 #0000000000000001\nSUB @r1 $r0\nMOD @a $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: invalid use of pre decrement', () => {
        expect(() => {
            const code = 'long a, b, c, d; a=--(b);'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: invalid use of post increment', () => {
        expect(() => {
            const code = 'long a, b, c, d; a=(b+c)++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: deferencing variable not pointer on left side', () => {
        expect(() => {
            const code = 'long a, b, c, d; *(a+1)=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: deferencing variable not pointer on left side', () => {
        expect(() => {
            const code = 'long a, b, c, d; *(a+c)=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: deferencing variable not pointer', () => {
        expect(() => {
            const code = 'long a, b, c, d; a=*(b+1);'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: deferencing variable not pointer', () => {
        expect(() => {
            const code = 'long a, b, c, d; a=*(b+c);'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: no ending )', () => {
        expect(() => {
            const code = 'long a, b, c, d; a=b+(c+d;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: unexpected )', () => {
        expect(() => {
            const code = 'long a, b, c, d; a=b+c)+d;;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})

describe('MISC combination', () => {
    it('should compile: crazy code', () => {
        const code = 'long a, *b; a=~-*b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @a\nSET @r0 $($b)\nSUB @a $r0\nNOT @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy code', () => {
        const code = 'long a, *b; a=~-~-*b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @r0\nSET @a $($b)\nSUB @r0 $a\nNOT @r0\nCLR @a\nSUB @a $r0\nNOT @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy code', () => {
        const code = 'long a, *b; a=~-~-*b+1;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @r0\nSET @a $($b)\nSUB @r0 $a\nNOT @r0\nCLR @a\nSUB @a $r0\nNOT @a\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: precedence test', () => {
        const code = 'long a, b, c, d, e; a=b+c/d-e;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nSET @a $c\nDIV @a $d\nADD @a $b\nSUB @a $e\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: precedence test', () => {
        const code = 'long a, b, c, d, e; a=b<<c+d<<e;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nSET @r0 $c\nADD @r0 $d\nSET @a $b\nSHL @a $r0\nSHL @a $e\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: precedence test', () => {
        const code = 'long a, b, c, d, e; a=b&c<<d^e;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nSET @a $c\nSHL @a $d\nAND @a $b\nXOR @a $e\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: pointer operations test', () => {
        const code = 'long *a, b, c; *(a+1)=b; *(a+30)=b; *(a+c)=b; b=*(a+1); b=*(a+30); b=*(a+c);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @r0 $a\nINC @r0\nSET @($r0) $b\nSET @r0 #000000000000001e\nADD @r0 $a\nSET @($r0) $b\nSET @r0 $a\nADD @r0 $c\nSET @($r0) $b\nSET @b $a\nINC @b\nSET @b $($b)\nSET @b #000000000000001e\nADD @b $a\nSET @b $($b)\nSET @b $a\nADD @b $c\nSET @b $($b)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: invalid code (array modifier on pointer)', () => {
        expect(() => {
            const code = 'long a, b, c; a=b%(1+*b[c]);'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})

describe('MISC errors', () => {
    test('should throw: not using operation result', () => {
        expect(() => {
            const code = 'long a, b; a|b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: invalid left side', () => {
        expect(() => {
            const code = 'long a, b; a|b=c;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: not using operation result', () => {
        expect(() => {
            const code = 'long a, b; a/b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: invalid left side', () => {
        expect(() => {
            const code = 'long a, b; -a=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: invalid left side', () => {
        expect(() => {
            const code = 'long a, b; +a=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: invalid left side', () => {
        expect(() => {
            const code = 'long a, b; &a=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: missing value to apply operator', () => {
        expect(() => {
            const code = '&;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: missing value to apply operator', () => {
        expect(() => {
            const code = '+;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: missing values to apply operator', () => {
        expect(() => {
            const code = '=;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: missing left side', () => {
        expect(() => {
            const code = '<=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: missing values to apply operator', () => {
        expect(() => {
            const code = '/;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: missing left side', () => {
        expect(() => {
            const code = 'long a, b; /a;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})
