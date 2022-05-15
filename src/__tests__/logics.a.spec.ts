import { SmartC } from '../smartc'

describe('Assignment of logical results', () => {
    it('should compile: ==', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, z; z=a==b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare z\n\nBNE $a $b :__CMP_1_sF\n__CMP_1_sT:\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: !=', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, z; z=a!=b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare z\n\nBEQ $a $b :__CMP_1_sF\n__CMP_1_sT:\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: <=', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, z; z=2<=b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare z\n\nSET @z #0000000000000002\nBGT $z $b :__CMP_1_sF\n__CMP_1_sT:\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: <', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, z; z=a<2;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare z\n\nSET @z #0000000000000002\nBGE $a $z :__CMP_1_sF\n__CMP_1_sT:\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: >=', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, z; z=a>=b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare z\n\nBLT $a $b :__CMP_1_sF\n__CMP_1_sT:\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: >', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, z; z=a>b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare z\n\nBLE $a $b :__CMP_1_sF\n__CMP_1_sT:\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: !', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, z; z=!a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare z\n\nBNZ $a :__NOT_1_sF\n__NOT_1_sT:\nSET @z #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @z\n__NOT_1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, z; z=!!a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare z\n\nBZR $a :__NOT_1_sF\n__NOT_1_sT:\nSET @z #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @z\n__NOT_1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: &&', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, z; z=a&&b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare z\n\nBZR $a :__CMP_1_sF\n__AND_2_next:\nBZR $b :__CMP_1_sF\nJMP :__CMP_1_sT\n__CMP_1_sT:\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: ||', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, z; z=a||b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare z\n\nBNZ $a :__CMP_1_sT\n__OR_2_next:\nBNZ $b :__CMP_1_sT\nJMP :__CMP_1_sF\n__CMP_1_sF:\nCLR @z\nJMP :__CMP_1_end\n__CMP_1_sT:\nSET @z #0000000000000001\n__CMP_1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c; a=2+b==c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nINC @a\nINC @a\nBNE $a $c :__CMP_1_sF\n__CMP_1_sT:\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c; a=2+(b==c);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nBNE $b $c :__CMP_1_sF\n__CMP_1_sT:\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nINC @a\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c; a=b==~c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $c\nNOT @a\nBNE $b $a :__CMP_1_sF\n__CMP_1_sT:\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c; a=b==!c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nBNZ $c :__NOT_2_sF\n__NOT_2_sT:\nSET @a #0000000000000001\nJMP :__NOT_2_end\n__NOT_2_sF:\nCLR @a\n__NOT_2_end:\nBNE $b $a :__CMP_1_sF\n__CMP_1_sT:\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c; a=!b==c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nBNZ $b :__NOT_2_sF\n__NOT_2_sT:\nSET @a #0000000000000001\nJMP :__NOT_2_end\n__NOT_2_sF:\nCLR @a\n__NOT_2_end:\nBNE $a $c :__CMP_1_sF\n__CMP_1_sT:\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c; a=!b==!c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nBNZ $b :__NOT_2_sF\n__NOT_2_sT:\nSET @a #0000000000000001\nJMP :__NOT_2_end\n__NOT_2_sF:\nCLR @a\n__NOT_2_end:\nBNZ $c :__NOT_3_sF\n__NOT_3_sT:\nSET @r0 #0000000000000001\nJMP :__NOT_3_end\n__NOT_3_sF:\nCLR @r0\n__NOT_3_end:\nBNE $a $r0 :__CMP_1_sF\n__CMP_1_sT:\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c; a=!(b+c);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nADD @a $c\nBNZ $a :__NOT_1_sF\n__NOT_1_sT:\nSET @a #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @a\n__NOT_1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c; a=!(b==c);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nBEQ $b $c :__NOT_1_sF\n__NOT_1_sT:\nSET @a #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @a\n__NOT_1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c, d; a=!(b==c)==d;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nBEQ $b $c :__NOT_2_sF\n__NOT_2_sT:\nSET @a #0000000000000001\nJMP :__NOT_2_end\n__NOT_2_sF:\nCLR @a\n__NOT_2_end:\nBNE $a $d :__CMP_1_sF\n__CMP_1_sT:\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c, d, z; z=1+((a&&b)||(c&&d));'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare z\n\nBZR $a :__OR_2_next\n__AND_3_next:\nBZR $b :__OR_2_next\nJMP :__CMP_1_sT\n__OR_2_next:\nBZR $c :__CMP_1_sF\n__AND_4_next:\nBZR $d :__CMP_1_sF\nJMP :__CMP_1_sT\nJMP :__CMP_1_sF\n__CMP_1_sF:\nCLR @z\nJMP :__CMP_1_end\n__CMP_1_sT:\nSET @z #0000000000000001\n__CMP_1_end:\nINC @z\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c, d, z; z=1+!((a&&b)||(c&&d));'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare z\n\nBZR $a :__OR_2_next\n__AND_3_next:\nBZR $b :__OR_2_next\nJMP :__NOT_1_sF\n__OR_2_next:\nBZR $c :__NOT_1_sT\n__AND_4_next:\nBZR $d :__NOT_1_sT\nJMP :__NOT_1_sF\nJMP :__NOT_1_sT\n__NOT_1_sT:\nSET @z #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @z\n__NOT_1_end:\nINC @z\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c, d; a=b+(++c==d++);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nINC @c\nBNE $c $d :__CMP_1_sF\n__CMP_1_sT:\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nADD @a $b\nINC @d\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c, d, z; z=1+((a||b)&&(c||d));'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare z\n\nBNZ $a :__AND_2_next\n__OR_3_next:\nBNZ $b :__AND_2_next\nJMP :__CMP_1_sF\n__AND_2_next:\nBNZ $c :__CMP_1_sT\n__OR_4_next:\nBNZ $d :__CMP_1_sT\nJMP :__CMP_1_sF\nJMP :__CMP_1_sT\n__CMP_1_sT:\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nINC @z\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c, d, z; z=1+!((a||b)&&(c||d));'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare z\n\nBNZ $a :__AND_2_next\n__OR_3_next:\nBNZ $b :__AND_2_next\nJMP :__NOT_1_sT\n__AND_2_next:\nBNZ $c :__NOT_1_sF\n__OR_4_next:\nBNZ $d :__NOT_1_sF\nJMP :__NOT_1_sT\nJMP :__NOT_1_sF\n__NOT_1_sT:\nSET @z #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @z\n__NOT_1_end:\nINC @z\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: using SetUnaryOperator in logical operations', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a, b, c, d; a=b+(++c&&d++);'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: not using logical operation result ==', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a, b; a==b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: not using logical operation result !=', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a, b; a!=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: not using logical operation result <=', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong b; 2<=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: not using logical operation result <', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a; a<2;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: not using logical operation result >=', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a, b; a>=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: not using logical operation result >', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a, b; a>b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: not using logical operation result !', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a; !a;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: not using logical operation result &&', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a, b; a&&b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: not using logical operation result ||', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a, b; a||b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})
