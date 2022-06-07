import { SmartC } from '../smartc'

describe('Castings arithmetic', () => {
    it('should compile: special verification on long <=> fixed', () => {
        const code = '#pragma optimizationLevel 0\nfixed fa, fb; long la, lb;\n la = lb + (long)fa; fa = la + (fixed)lb;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare fa\n^declare fb\n^declare la\n^declare lb\n\nSET @la $fa\nDIV @la $f100000000\nADD @la $lb\nSET @fa $lb\nMUL @fa $f100000000\nSET @r0 $la\nMUL @r0 $f100000000\nADD @fa $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: from void to all', () => {
        const code = ' #pragma optimizationLevel 0\n void *pv; long l, *pl; fixed f, *pf; struct TEST { long aa, bb; } s, *ps;\n l = (long)(); f = (fixed)(); pv = (void *)(); pl = (long *)(); pf = (fixed *)(); ps = (struct BB *)();'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare pv\n^declare l\n^declare pl\n^declare f\n^declare pf\n^declare s_aa\n^declare s_bb\n^declare ps\n\nCLR @l\nCLR @f\nCLR @pv\nCLR @pl\nCLR @pf\nCLR @ps\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: from all to void', () => {
        const code = ' #pragma optimizationLevel 0\nvoid *pv; long l, *pl; fixed f, *pf; struct TEST { long aa, bb; } s, *ps;\n (void)(l+1); (void)(f+1.2);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare pv\n^declare l\n^declare pl\n^declare f\n^declare pf\n^declare s_aa\n^declare s_bb\n^declare ps\n\nSET @r0 $l\nINC @r0\nSET @r0 #0000000007270e00\nADD @r0 $f\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: from long to all', () => {
        const code = '#pragma optimizationLevel 0\nvoid *pv;long l, *pl;fixed f, *pf;struct TEST { long aa, bb; } s, *ps;\n l = (long)l; f = (fixed)l; pv = (void *)l; pl = (long *)l; pf = (fixed *)l; ps = (struct BB *)l;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare pv\n^declare l\n^declare pl\n^declare f\n^declare pf\n^declare s_aa\n^declare s_bb\n^declare ps\n\nSET @f $l\nMUL @f $f100000000\nSET @pv $l\nSET @pl $l\nSET @pf $l\nSET @ps $l\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: from fixed to pointers', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nvoid *pv;long l, *pl;fixed f, *pf;struct TEST { long aa, bb; } s, *ps;\n pv = (void *)f;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: from struct to all', () => {
        const code = '#pragma optimizationLevel 0\nvoid *pv;long l, *pl;fixed f, *pf;struct TEST { long aa, bb; } s, *ps;\n pv = (void *)s; pl = (long *)s; pf = (fixed *)s; ps = (struct BB *)s;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare pv\n^declare l\n^declare pl\n^declare f\n^declare pf\n^declare s_aa\n^declare s_bb\n^declare ps\n\nSET @pv #0000000000000009\nSET @pl #0000000000000009\nSET @pf #0000000000000009\nSET @ps #0000000000000009\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: from struct to long', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nvoid *pv;long l, *pl;fixed f, *pf;struct TEST { long aa, bb; } s, *ps;\n l = (long)s;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: from struct to fixed', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nvoid *pv;long l, *pl;fixed f, *pf;struct TEST { long aa, bb; } s, *ps;\n f = (fixed)s;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: from pointer to all', () => {
        const code = '#pragma optimizationLevel 0\nvoid *pv;long l, *pl;fixed f, *pf;struct TEST { long aa, bb; } s, *ps;\n l = (long)pl; pv = (void *)pl; pl = (long *)pl; pf = (fixed *)pl; ps = (struct BB *)pl;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare pv\n^declare l\n^declare pl\n^declare f\n^declare pf\n^declare s_aa\n^declare s_bb\n^declare ps\n\nSET @l $pl\nSET @pv $pl\nSET @pf $pl\nSET @ps $pl\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: from pointer to fixed', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nvoid *pv;long l, *pl;fixed f, *pf;struct TEST { long aa, bb; } s, *ps;\n f = (fixed)pv;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: complex hack', () => {
        const code = '#pragma optimizationLevel 0\nfixed fa, *pf; long la, *pl; la = *((long*)(&fa)); fa = *((fixed*)(&la));'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare fa\n^declare pf\n^declare la\n^declare pl\n\nSET @la $fa\nSET @fa $la\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: casting hack on returning function', () => {
        const code = '#pragma optimizationLevel 0\n#include APIFunctions\nfixed a, b; a = b + (*(fixed *)(&Get_A1()));'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare a\n^declare b\n\nFUN @r0 get_A1\nSET @a $b\nADD @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})

describe('Castings logical', () => {
    it('should compile: all permitted types', () => {
        const code = '#pragma optimizationLevel 0\nlong la, lb, *pl; fixed fa, fb, *pf; void * pv;\n if (la > fb) la++; if (fa > lb) la++; if (fa >= fb) la++; if (la < pl) la++; if (la <= pf) la++; if (pv == pl) la++; if (pf != pl) la++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare la\n^declare lb\n^declare pl\n^declare fa\n^declare fb\n^declare pf\n^declare pv\n\nSET @r0 $la\nMUL @r0 $f100000000\nBLE $r0 $fb :__if1_endif\n__if1_start:\nINC @la\n__if1_endif:\nSET @r0 $lb\nMUL @r0 $f100000000\nBLE $fa $r0 :__if2_endif\n__if2_start:\nINC @la\n__if2_endif:\nBLT $fa $fb :__if3_endif\n__if3_start:\nINC @la\n__if3_endif:\nBGE $la $pl :__if4_endif\n__if4_start:\nINC @la\n__if4_endif:\nBGT $la $pf :__if5_endif\n__if5_start:\nINC @la\n__if5_endif:\nBNE $pv $pl :__if6_endif\n__if6_start:\nINC @la\n__if6_endif:\nBEQ $pf $pl :__if7_endif\n__if7_start:\nINC @la\n__if7_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: pointer vs fixed', () => {
        expect(() => {
            const code = 'long la, lb, *pl; fixed fa, fb, *pf; void * pv;\n if (la > fb) la++; if (fa > pv) la++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})
