import { SmartC } from '../smartc'

describe('Assignment', () => {
    it('should compile: = fixed/fixed', () => {
        const code = '#pragma optimizationLevel 0\nfixed a, b; a=b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSET @a $b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: = fixed/long', () => {
        const code = '#pragma optimizationLevel 0\nfixed a; long b; a=b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSET @a $b\nMUL @a $f100000000\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: = long/fixed', () => {
        const code = '#pragma optimizationLevel 0\nfixed a; long b; b=a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSET @b $a\nDIV @b $f100000000\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: = fixed/constantfixed', () => {
        const code = '#pragma optimizationLevel 0\nfixed a, b; a=2.23;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSET @a #000000000d4ab5c0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: = fixed/constantlong', () => {
        const code = '#pragma optimizationLevel 0\nfixed a; long b; a=55;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSET @a #0000000000000037\nMUL @a $f100000000\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: = long/constantfixed', () => {
        const code = '#pragma optimizationLevel 0\nfixed a; long b; b=32.3;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSET @b #00000000c085e380\nDIV @b $f100000000\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})

describe('SetOperator', () => {
    it('should compile: += -= fixed/fixed fixed/long fixed/constantlong', () => {
        const code = '#pragma optimizationLevel 0\nfixed fa, fb; long lc; fa+=fb; fa-=fb; fa+=lc; fa-=lc; fa+=2; fa-=2;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare fa\n^declare fb\n^declare lc\n\nADD @fa $fb\nSUB @fa $fb\nSET @r0 $lc\nMUL @r0 $f100000000\nADD @fa $r0\nSET @r0 $lc\nMUL @r0 $f100000000\nSUB @fa $r0\nSET @r0 #0000000000000002\nMUL @r0 $f100000000\nADD @fa $r0\nSET @r0 #0000000000000002\nMUL @r0 $f100000000\nSUB @fa $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: += -= long/fixed long/constantfixed', () => {
        const code = '#pragma optimizationLevel 0\nfixed fa, fb; long lc; lc+=fa; lc-=fb; lc+=2.2; lc-=2.2;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare fa\n^declare fb\n^declare lc\n\nSET @r0 $fa\nDIV @r0 $f100000000\nADD @lc $r0\nSET @r0 $fb\nDIV @r0 $f100000000\nSUB @lc $r0\nSET @r0 #000000000d1cef00\nDIV @r0 $f100000000\nADD @lc $r0\nSET @r0 #000000000d1cef00\nDIV @r0 $f100000000\nSUB @lc $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: *= /= fixed/fixed fixed/long fixed/constantlong', () => {
        const code = '#pragma optimizationLevel 0\nfixed fa, fb; long lc; fa*=fb; fa/=fb; fa*=lc; fa/=lc; fa*=2; fa/=2;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare fa\n^declare fb\n^declare lc\n\nMDV @fa $fb $f100000000\nMDV @fa $f100000000 $fb\nMUL @fa $lc\nDIV @fa $lc\nSET @r0 #0000000000000002\nMUL @fa $r0\nSET @r0 #0000000000000002\nDIV @fa $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: *= /= long/fixed long/constantfixed', () => {
        const code = '#pragma optimizationLevel 0\nfixed fa, fb; long lc; lc*=fa; lc/=fb; lc*=2.2; lc/=2.2;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare fa\n^declare fb\n^declare lc\n\nSET @r0 $fa\nDIV @r0 $f100000000\nMUL @lc $r0\nSET @r0 $fb\nDIV @r0 $f100000000\nDIV @lc $r0\nSET @r0 #000000000d1cef00\nDIV @r0 $f100000000\nMUL @lc $r0\nSET @r0 #000000000d1cef00\nDIV @r0 $f100000000\nDIV @lc $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: %= ', () => {
        expect(() => {
            const code = 'fixed a; fixed b; a%=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: &= ', () => {
        expect(() => {
            const code = 'fixed a; fixed b; a&=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: |= ', () => {
        expect(() => {
            const code = 'fixed a; fixed b; a|=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: ^= ', () => {
        expect(() => {
            const code = 'fixed a; fixed b; a^=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: <<= >>=  with long', () => {
        const code = '#pragma optimizationLevel 0\nfixed a; long b; a>>=3; a<<=3; a>>=b; a<<=b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSET @r0 #0000000000000003\nSHR @a $r0\nSET @r0 #0000000000000003\nSHL @a $r0\nSHR @a $b\nSHL @a $b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: <<= ', () => {
        expect(() => {
            const code = 'fixed a; fixed b; a<<=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: >>= ', () => {
        expect(() => {
            const code = 'fixed a; fixed b; a>>=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})

describe('Operator', () => {
    it('should compile: / ', () => {
        const code = '#pragma optimizationLevel 0\n long la; fixed fa, fb, fresult; fresult = la / fa; fresult = fa / la; fresult = fa / fb;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare la\n^declare fa\n^declare fb\n^declare fresult\n\nSET @fresult $la\nMUL @fresult $f100000000\nMDV @fresult $f100000000 $fa\nSET @fresult $fa\nDIV @fresult $la\nSET @fresult $fa\nMDV @fresult $f100000000 $fb\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: % ', () => {
        expect(() => {
            const code = 'long la; fixed fa, fr; fr=fa%la;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: & ', () => {
        expect(() => {
            const code = 'long la; fixed fa, fr; fr=fa&la;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: | ', () => {
        expect(() => {
            const code = 'long la; fixed fa, fr; fr=fa|la;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: ^ ', () => {
        expect(() => {
            const code = 'long la; fixed fa, fr; fr=fa^la;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: << >> right usage', () => {
        const code = 'long la; fixed fa, fb, fresult; fresult = fa << la; fresult = fa >> la; fb;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare la\n^declare fa\n^declare fb\n^declare fresult\n\nSET @fresult $fa\nSHL @fresult $la\nSET @fresult $fa\nSHR @fresult $la\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: >> wrong ', () => {
        expect(() => {
            const code = 'long la; fixed fa, fr; fr=la>>fa;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: << wrong ', () => {
        expect(() => {
            const code = 'long la; fixed fa, fr; fr=la<<fa;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})

describe('Constants', () => {
    it('should compile: Assignment', () => {
        const code = '#pragma optimizationLevel 0\nfixed fa; fa=2.5;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare fa\n\nSET @fa #000000000ee6b280\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})

describe('UnaryOperator', () => {
    it('should compile: !', () => {
        const code = '#pragma optimizationLevel 0\nlong a; fixed b; a=!b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nBNZ $b :__NOT_1_sF\n__NOT_1_sT:\nSET @a #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @a\n__NOT_1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: ~', () => {
        const code = '#pragma optimizationLevel 0\nfixed a, b; a=~b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSET @a $b\nNOT @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})

describe('SetUnaryOperator', () => {
    it('should compile: ++ post', () => {
        const code = 'fixed a, b; b=a++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSET @b $a\nADD @a $f100000000\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: -- post', () => {
        const code = 'fixed a, b; b=a--;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSET @b $a\nSUB @a $f100000000\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: ++ pre', () => {
        const code = 'fixed a, b; b=++a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nADD @a $f100000000\nSET @b $a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: -- pre', () => {
        const code = 'fixed a, b; b=--a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSUB @a $f100000000\nSET @b $a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})

describe('CheckOperator Unary', () => {
    it('should compile: - ', () => {
        const code = 'fixed a, b; b=-a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nCLR @b\nSUB @b $a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: + ', () => {
        const code = 'fixed a, b; b=+a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSET @b $a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: & ', () => {
        const code = 'fixed a, *b; b=&a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSET @b #0000000000000004\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: * ', () => {
        const code = 'fixed a, *b; a=*b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSET @a $($b)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: *() ', () => {
        const code = 'fixed a, *b; a=*(b+1);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSET @a $b\nINC @a\nSET @a $($a)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: *() ', () => {
        const code = 'fixed a, *b; a=*(b+3);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSET @a #0000000000000003\nADD @a $b\nSET @a $($a)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: *() ', () => {
        const code = 'fixed a, *b;long la; a=*(b+la);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n^declare la\n\nSET @a $b\nADD @a $la\nSET @a $($a)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: * on left side', () => {
        const code = 'fixed a, *b; *b=a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSET @($b) $a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: *() on left side paren opt', () => {
        const code = 'fixed a, *b; *(b + 1)=a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSET @r0 $b\nINC @r0\nSET @($r0) $a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: *() on left side paren not opt', () => {
        const code = 'fixed a, *b; *(b + 3)=a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nSET @r0 #0000000000000003\nADD @r0 $b\nSET @($r0) $a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})

describe('CheckOperator Binary', () => {
    it('should compile: + -', () => {
        const code = '#pragma optimizationLevel 0\nlong la; fixed fa, fb, fresult; fresult = la + fa; fresult = fa + la; fresult = la - fa; fresult = fa - la; fresult = fa + fb; fresult = fa - fb;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare la\n^declare fa\n^declare fb\n^declare fresult\n\nSET @fresult $la\nMUL @fresult $f100000000\nADD @fresult $fa\nSET @fresult $la\nMUL @fresult $f100000000\nADD @fresult $fa\nSET @fresult $la\nMUL @fresult $f100000000\nSUB @fresult $fa\nSET @fresult $fa\nSET @r0 $la\nMUL @r0 $f100000000\nSUB @fresult $r0\nSET @fresult $fa\nADD @fresult $fb\nSET @fresult $fa\nSUB @fresult $fb\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: *', () => {
        const code = '#pragma optimizationLevel 0\n long la; fixed fa, fb, fresult; fresult = la * fa; fresult = fa * la; fresult = fa * fb;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare la\n^declare fa\n^declare fb\n^declare fresult\n\nSET @fresult $la\nMUL @fresult $f100000000\nMDV @fresult $fa $f100000000\nSET @fresult $fa\nMUL @fresult $la\nSET @fresult $fa\nMDV @fresult $fb $f100000000\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: & ', () => {
        expect(() => {
            const code = 'long la; fixed fa, fr; fr=la&fa;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})
