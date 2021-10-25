import { SmartC } from '../smartc'

describe('Mix trying to break algorithm', () => {
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d; if (a==b&&!(c==d)) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nBNE $a $b :__if1_endif\nBEQ $c $d :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d; if (!(a==b)&&c==d) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nBEQ $a $b :__if1_endif\nBNE $c $d :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d; if (a==b==c) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nBNE $a $b :__CMP_2_sF\nSET @r0 #0000000000000001\nJMP :__CMP_2_end\n__CMP_2_sF:\nCLR @r0\n__CMP_2_end:\nBNE $r0 $c :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d; if ((a==b)==c) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nBNE $a $b :__CMP_2_sF\nSET @r0 #0000000000000001\nJMP :__CMP_2_end\n__CMP_2_sF:\nCLR @r0\n__CMP_2_end:\nBNE $r0 $c :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d, e, f, g, h; if (a==b&&c==d&&e==f&&g==h) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBNE $a $b :__if1_endif\nBNE $c $d :__if1_endif\nBNE $e $f :__if1_endif\nBNE $g $h :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d, e, f, g, h; if (a==b||c==d||e==f||g==h) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBEQ $a $b :__if1_start\nBEQ $c $d :__if1_start\nBEQ $e $f :__if1_start\nBEQ $g $h :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d, e, f, g, h; if ((a==b||c==d)&&(e==f||g==h)) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBEQ $a $b :__AND_2_next\nBEQ $c $d :__AND_2_next\nJMP :__if1_endif\n__AND_2_next:\nBEQ $e $f :__if1_start\nBEQ $g $h :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d, e, f, g, h; if ((a==b && c==d) || (e==f && g==h)) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBNE $a $b :__OR_2_next\nBNE $c $d :__OR_2_next\nJMP :__if1_start\n__OR_2_next:\nBNE $e $f :__if1_endif\nBNE $g $h :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d, e, f, g, h; if ((a>=b && c>=d) || (e!=f && g!=h)) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBLT $a $b :__OR_2_next\nBLT $c $d :__OR_2_next\nJMP :__if1_start\n__OR_2_next:\nBEQ $e $f :__if1_endif\nBEQ $g $h :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d, e, f, g, h; if ((a>=b&&c>=d)||!(e==f&&g==h)) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBLT $a $b :__OR_2_next\nBLT $c $d :__OR_2_next\nJMP :__if1_start\n__OR_2_next:\nBNE $e $f :__if1_start\nBNE $g $h :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d, e, f, g, h; if ((a<=b||c<d)&&!(e==f||g==h)) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBLE $a $b :__AND_2_next\nBLT $c $d :__AND_2_next\nJMP :__if1_endif\n__AND_2_next:\nBEQ $e $f :__if1_endif\nBEQ $g $h :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d, e, f, g, h; if (!(a<=b||c<d)&&(e==f||g==h)) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBLE $a $b :__if1_endif\nBLT $c $d :__if1_endif\nBEQ $e $f :__if1_start\nBEQ $g $h :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b; if (a==~-b) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @r0\nSUB @r0 $b\nNOT @r0\nBNE $a $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b; if (a==!~-b) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @r0\nSUB @r0 $b\nNOT @r0\nBNZ $r0 :__NOT_2_sF\nSET @r0 #0000000000000001\nJMP :__NOT_2_end\n__NOT_2_sF:\nCLR @r0\n__NOT_2_end:\nBNE $a $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d, e; if (a||(b&&c&&d)||e) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nBNZ $a :__if1_start\nBZR $b :__OR_2_next\nBZR $c :__OR_2_next\nBZR $d :__OR_2_next\nJMP :__if1_start\n__OR_2_next:\nBNZ $e :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d, e; if (a&&(b||c||d)&&e) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nBZR $a :__if1_endif\nBNZ $b :__AND_2_next\nBNZ $c :__AND_2_next\nBNZ $d :__AND_2_next\nJMP :__if1_endif\n__AND_2_next:\nBZR $e :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d, e; if (a||(b&&!c&&d)||e) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nBNZ $a :__if1_start\nBZR $b :__OR_2_next\nBNZ $c :__OR_2_next\nBZR $d :__OR_2_next\nJMP :__if1_start\n__OR_2_next:\nBNZ $e :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d, e; if (a&&(b||!c||d)&&e) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nBZR $a :__if1_endif\nBNZ $b :__AND_2_next\nBZR $c :__AND_2_next\nBNZ $d :__AND_2_next\nJMP :__if1_endif\n__AND_2_next:\nBZR $e :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d, e; if (a==0&&(b==0||c==0&&d==0)&&e==0) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nBNZ $a :__if1_endif\nBZR $b :__AND_2_next\nBNZ $c :__if1_endif\nBNZ $d :__if1_endif\n__AND_2_next:\nBNZ $e :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b; if (!(!(!(a==b)))) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBEQ $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b; if (!(!(!(!(a==b))))) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBNE $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d, z; if (( ( (a==5 || b==z) && c==z) || d==z ) && a==25+b) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare z\n\nSET @r0 #0000000000000005\nBEQ $a $r0 :__AND_4_next\nBEQ $b $z :__AND_4_next\nJMP :__OR_3_next\n__AND_4_next:\nBNE $c $z :__OR_3_next\nJMP :__AND_2_next\n__OR_3_next:\nBEQ $d $z :__AND_2_next\nJMP :__if1_endif\n__AND_2_next:\nSET @r0 #0000000000000019\nADD @r0 $b\nBNE $a $r0 :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d, e, f, g, h; if (a||b&&c||d && e||f&&g||h) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBNZ $a :__if1_start\nBZR $b :__OR_4_next\nBZR $c :__OR_4_next\nJMP :__if1_start\n__OR_4_next:\nBZR $d :__OR_3_next\nBZR $e :__OR_3_next\nJMP :__if1_start\n__OR_3_next:\nBZR $f :__OR_2_next\nBZR $g :__OR_2_next\nJMP :__if1_start\n__OR_2_next:\nBNZ $h :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d, e, f, g, h; if ((a||b)&&(c||d)&&(e||f)&&(g||h)) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBNZ $a :__AND_4_next\nBNZ $b :__AND_4_next\nJMP :__if1_endif\n__AND_4_next:\nBNZ $c :__AND_3_next\nBNZ $d :__AND_3_next\nJMP :__if1_endif\n__AND_3_next:\nBNZ $e :__AND_2_next\nBNZ $f :__AND_2_next\nJMP :__if1_endif\n__AND_2_next:\nBNZ $g :__if1_start\nBNZ $h :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d, e, f, g, h; if (((a&&b)||(c&&d)) && ((e&&f)||(g&&h))) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBZR $a :__OR_3_next\nBZR $b :__OR_3_next\nJMP :__AND_2_next\n__OR_3_next:\nBZR $c :__if1_endif\nBZR $d :__if1_endif\n__AND_2_next:\nBZR $e :__OR_6_next\nBZR $f :__OR_6_next\nJMP :__if1_start\n__OR_6_next:\nBZR $g :__if1_endif\nBZR $h :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d; if (!((a&&b)||(c&&d))) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nBZR $a :__OR_2_next\nBZR $b :__OR_2_next\nJMP :__if1_endif\n__OR_2_next:\nBZR $c :__if1_start\nBZR $d :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: crazy mix', () => {
        const code = 'long a, b, c, d; if (!((a||b)&&(c||d))) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nBNZ $a :__AND_2_next\nBNZ $b :__AND_2_next\nJMP :__if1_start\n__AND_2_next:\nBNZ $c :__if1_endif\nBNZ $d :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})
