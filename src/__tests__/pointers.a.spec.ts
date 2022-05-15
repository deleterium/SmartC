import { SmartC } from '../smartc'

describe('Pointer assignment', () => {
    it('should compile: pointer regular use', () => {
        const code = 'long *pa, *pb, va, vb;\npa = pb; pa = &pb; pa = &vb; *pa= vb;\n *pa= *pb; va = vb; va = *pb;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare pa\n^declare pb\n^declare va\n^declare vb\n\nSET @pa $pb\nSET @pa #0000000000000004\nSET @pa #0000000000000006\nSET @($pa) $vb\nSET @r0 $($pb)\nSET @($pa) $r0\nSET @va $vb\nSET @va $($pb)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: pointer wrong types', () => {
        expect(() => {
            const code = 'long *pa, *pb, va, vb; pa=vb; pa=*pb; *pa=pb; *pa=&pb; *pa=&vb; va=pb; va=&pb; va=&vb;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: pointer + setOperator', () => {
        const code = 'long *pa, *pb, va, vb; pa+=vb;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare pa\n^declare pb\n^declare va\n^declare vb\n\nADD @pa $vb\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Pointer + SetOperator + operator', () => {
        const code = 'long *pa, *pb, va, vb; pa+=vb+1;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare pa\n^declare pb\n^declare va\n^declare vb\n\nSET @r0 $vb\nINC @r0\nADD @pa $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: pointer + setOperator', () => {
        const code = 'long *pa, *pb, va, vb; pa-=vb;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare pa\n^declare pb\n^declare va\n^declare vb\n\nSUB @pa $vb\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: operator with pointer', () => {
        const code = 'long *pa, *pb, va, vb; pa=pa-vb;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare pa\n^declare pb\n^declare va\n^declare vb\n\nSET @r0 $pa\nSUB @r0 $vb\nSET @pa $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: pointer of pointer', () => {
        expect(() => {
            const code = 'long *pa, *pb, va, vb; va=*vb;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: wrong type (assignment)', () => {
        expect(() => {
            const code = 'long *pa, *pb, va, vb; *va=vb;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: invalid left side (operation on deferenced pointer)', () => {
        expect(() => {
            const code = 'long *a, *a+1=0;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Invalid operator for pointer', () => {
        expect(() => {
            const code = 'long *a, *(a*3)=0;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})

describe('Pointer/Array assignment', () => {
    it('should compile: regular use', () => {
        const code = 'long a[4], *b, c; *b=a[0]; a[0]=*b; b=a; *b=a[c]; a[c]=*b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @($b) $a_0\nSET @a_0 $($b)\nSET @b $a\nSET @r0 $($a + $c)\nSET @($b) $r0\nSET @r0 $($b)\nSET @($a + $c) $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: can not reassing an array', () => {
        expect(() => {
            const code = 'long a[4], *b, c; a=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: Address of array to pointer', () => {
        const code = 'long a[4], *b, c; b=&a; b=&a[0]; b=&c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @b #0000000000000003\nSET @b #0000000000000004\nSET @b #0000000000000009\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: Address of array to regular variable', () => {
        expect(() => {
            const code = 'long a[4], *b, c; c=&a; c=&a[0]; c=&c;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: Address of array to regular variable (disregard warning)', () => {
        const code = '#pragma warningToError false\nlong a[4], *b, c; c=&a; c=&a[0]; c=&c;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @c #0000000000000003\nSET @c #0000000000000004\nSET @c #0000000000000009\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Operation with pointer before deferencing', () => {
        const code = 'long *a, b, c;\n*(a+1)=b; *(a+30)=b; *(a+c)=b;\nb=*(a+1); b=*(a+30); b=*(a+c);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @r0 $a\nINC @r0\nSET @($r0) $b\nSET @r0 #000000000000001e\nADD @r0 $a\nSET @($r0) $b\nSET @r0 $a\nADD @r0 $c\nSET @($r0) $b\nSET @b $a\nINC @b\nSET @b $($b)\nSET @b #000000000000001e\nADD @b $a\nSET @b $($b)\nSET @b $a\nADD @b $c\nSET @b $($b)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Operations with array variable', () => {
        const code = 'long *a, b, Array[4]; a=Array+2; a=Array-b; a+=7; a++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare Array\n^const SET @Array #0000000000000006\n^declare Array_0\n^declare Array_1\n^declare Array_2\n^declare Array_3\n\nSET @a $Array\nINC @a\nINC @a\nSET @a $Array\nSUB @a $b\nSET @r0 #0000000000000007\nADD @a $r0\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: Forbidden operations with array variables', () => {
        expect(() => {
            const code = 'long *a, b, Array[4]; a=Array*2;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})
