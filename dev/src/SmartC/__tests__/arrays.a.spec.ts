import { SmartC } from '../smartc'

describe('Array assignment (left side)', () => {
    it('should compile: Array variable index', () => {
        const code = 'long a[4]; long b; long c; a[b]=c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @($a + $b) $c\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Array constant index', () => {
        const code = 'long a[4]; long b; long c; a[0]=b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @a_0 $b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Array constant index', () => {
        const code = 'long a[4]; long b; long c; a[2]=b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @a_2 $b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Multi long string assignment', () => {
        const code = "long a[4]; a[]='aaaaaaaazzzzzzz';"
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n\nSET @a_0 #6161616161616161\nSET @a_1 #007a7a7a7a7a7a7a\nCLR @a_2\nCLR @a_3\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Multi long array assignment', () => {
        const code = 'long a[4]; a[]=0x3333333333333333222222222222222211111111111111110000000000000000;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n\nCLR @a_0\nSET @a_1 #1111111111111111\nSET @a_2 #2222222222222222\nSET @a_3 #3333333333333333\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: SetOperator + variable', () => {
        const code = 'long a[4]; long b; long c; a[b]+=c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @r0 $($a + $b)\nADD @r0 $c\nSET @($a + $b) $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: SetOperator + zero', () => {
        const code = 'long a[4]; long b; long c; a[0]-=b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSUB @a_0 $b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: SetOperator + constant', () => {
        const code = 'long a[4]; long b; long c; a[2]*=b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nMUL @a_2 $b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a[4]; long b; a[b]=2;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n\nSET @r0 #0000000000000002\nSET @($a + $b) $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a[4]; a[0]=0xFF;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n\nSET @a_0 #00000000000000ff\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a[4]; a[2]="Ho ho";'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n\nSET @a_2 #0000006f68206f48\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: optimization: array with constant index is used for reuseAssignedVar', () => {
        const code = 'long a[2], b; a[1]=b+1;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare b\n\nSET @a_1 $b\nINC @a_1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Support for array notation on pointer variable.', () => {
        const code = 'long b; void teste(long * poper) { poper[3]=0; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare b\n^declare teste_poper\n\nFIN\n\n__fn_teste:\nPOP @teste_poper\nCLR @r0\nSET @r1 #0000000000000003\nSET @($teste_poper + $r1) $r0\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})

describe('Array assignment (right side)', () => {
    it('should compile: variable index', () => {
        const code = 'long a[4]; long b; long c; c=a[b];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @c $($a + $b)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: constant index', () => {
        const code = 'long a[4]; long b; long c; c=a[0];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @c $a_0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: constant index', () => {
        const code = 'long a[4]; long b; long c; c=a[3];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @c $a_3\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: SetOperator + variable', () => {
        const code = 'long a[4]; long b; long c; c/=a[b];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @r0 $($a + $b)\nDIV @c $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: SetOperator + zero', () => {
        const code = 'long a[4]; long b; long c; c&=a[0];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nAND @c $a_0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: SetOperator + constant', () => {
        const code = 'long a[4]; long b; long c; c^=a[3];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nXOR @c $a_3\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Array both sides of assignment', () => {
        const code = 'long a[4]; long b; long c[4]; long d; a[b]=c[d];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n^const SET @c #000000000000000a\n^declare c_0\n^declare c_1\n^declare c_2\n^declare c_3\n^declare d\n\nSET @r0 $($c + $d)\nSET @($a + $b) $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Array both sides of setOperator', () => {
        const code = 'long a[4]; long b; long c[4]; long d; a[b]+=c[d];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n^const SET @c #000000000000000a\n^declare c_0\n^declare c_1\n^declare c_2\n^declare c_3\n^declare d\n\nSET @r0 $($a + $b)\nSET @r1 $($c + $d)\nADD @r0 $r1\nSET @($a + $b) $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix operator', () => {
        const code = 'long a, b[4], c, d; a=b[c]/b[d];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a $($b + $c)\nSET @r0 $($b + $d)\nDIV @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix operator', () => {
        const code = 'long a, b[4], c, d; a=b[c]<<b[2];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a $($b + $c)\nSHL @a $b_2\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix UnaryOperator', () => {
        const code = 'long a, b[4], c, d; a=b[~c];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a $c\nNOT @a\nSET @a $($b + $a)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix UnaryOperator', () => {
        const code = 'long a, b[4], c, d; a=~b[c];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a $($b + $c)\nNOT @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: mix SetUnaryOperator forbidden', () => {
        expect(() => {
            const code = 'long a, b[4], c, d; a=b[c]++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: mix SetUnaryOperator forbidden', () => {
        expect(() => {
            const code = 'long a, b[4], c, d; a=b++[c];'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: mix SetUnaryOperator forbidden', () => {
        expect(() => {
            const code = 'long a, b[4], c, d; a=--b[c];'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: mix CheckOperator(Unary)', () => {
        const code = 'long a, b[4], c, d; a=-b[c];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nCLR @a\nSET @r0 $($b + $c)\nSUB @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix CheckOperator(Unary)', () => {
        const code = 'long a, b[4], c, d; a=+b[c];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a $($b + $c)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: CheckOperator(Unary)', () => {
        const code = 'long a, b[4], c, d; a=b[-c];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nCLR @a\nSUB @a $c\nSET @a $($b + $a)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix CheckOperator(Unary)', () => {
        const code = 'long a, b[4], c, d; a=b[+c];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a $($b + $c)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: using regular variable as pointer inside array notation', () => {
        expect(() => {
            const code = 'long a, b[4], c, d; a=b[*c];'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: mix', () => {
        const code = 'long a, b[4], c, d[2], e; a=b[c]-d[e];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n^const SET @d #000000000000000b\n^declare d_0\n^declare d_1\n^declare e\n\nSET @a $($b + $c)\nSET @r0 $($d + $e)\nSUB @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b[4], c, d[2], e; a=b[c]+d[e];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n^const SET @d #000000000000000b\n^declare d_0\n^declare d_1\n^declare e\n\nSET @a $($b + $c)\nSET @r0 $($d + $e)\nADD @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b[4], c, d[2], e; a=b[c]*d[e];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n^const SET @d #000000000000000b\n^declare d_0\n^declare d_1\n^declare e\n\nSET @a $($b + $c)\nSET @r0 $($d + $e)\nMUL @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b[4], c, d[2], e; a=b[c]&d[e];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n^const SET @d #000000000000000b\n^declare d_0\n^declare d_1\n^declare e\n\nSET @a $($b + $c)\nSET @r0 $($d + $e)\nAND @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b[4], c, d; a=b[c-d];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a $c\nSUB @a $d\nSET @a $($b + $a)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b[4], c, d; a=b[c+d];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a $c\nADD @a $d\nSET @a $($b + $a)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b[4], c, d; a=b[c*d];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a $c\nMUL @a $d\nSET @a $($b + $a)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = 'long a, b[4], c, d; a=b[c&d];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a $c\nAND @a $d\nSET @a $($b + $a)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: Trying to deference an array', () => {
        expect(() => {
            const code = 'long a, b[4], c, d; a=*b[c];'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: address of element', () => {
        const code = 'long a[4], *b, c,d; b=&a[c];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n^declare d\n\nSET @b $a\nADD @b $c\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: Address of inside array notation', () => {
        expect(() => {
            const code = 'long a, b[4], c, d; a=b[&c];'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: Pointer operation inside array index', () => {
        const code = 'long a, b, *c, d[2]; if ( d[  *(c+1)  ]  ) a++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000007\n^declare d_0\n^declare d_1\n\nSET @r0 $c\nINC @r0\nSET @r1 $($r0)\nSET @r0 $($d + $r1)\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix delimiter', () => {
        const code = 'long a[3],b,c[3],d,e[3],f; a[2]=b,c[2]*=d,e[2]+=f;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare b\n^declare c\n^const SET @c #0000000000000009\n^declare c_0\n^declare c_1\n^declare c_2\n^declare d\n^declare e\n^const SET @e #000000000000000e\n^declare e_0\n^declare e_1\n^declare e_2\n^declare f\n\nSET @a_2 $b\nMUL @c_2 $d\nADD @e_2 $f\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix delimiter', () => {
        const code = 'long a,b[3],c,d[3],e; a=b[c],d[0]=e;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare c\n^declare d\n^const SET @d #000000000000000a\n^declare d_0\n^declare d_1\n^declare d_2\n^declare e\n\nSET @a $($b + $c)\nSET @d_0 $e\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})
