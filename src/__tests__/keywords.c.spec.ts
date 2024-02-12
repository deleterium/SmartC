import { SmartC } from '../smartc'

describe('More keywords', () => {
    test('should throw: inline wrong usage', () => {
        expect(() => {
            const code = 'inline long a;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: inline simple', () => {
        const code = '#pragma optimizationLevel 0\n long a, b; a = inc(b); inline long inc (long num) { return num+1; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare inc_num\n\nSET @inc_num $b\n__inline1_start:\nSET @r0 $inc_num\nINC @r0\nSET @r0 $r0\nJMP :__inline1_end\n__inline1_end:\nSET @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: inline call inside inline function', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; a = inc(b); inline long inc (long num) { return add2(num)-1; } inline long add2(long newnum) { return newnum+2; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare inc_num\n^declare add2_newnum\n\nSET @inc_num $b\n__inline1_start:\nSET @add2_newnum $inc_num\n__inline2_start:\nSET @r0 $add2_newnum\nINC @r0\nINC @r0\nSET @r0 $r0\nJMP :__inline2_end\n__inline2_end:\nSET @r0 $r0\nDEC @r0\nSET @r0 $r0\nJMP :__inline1_end\n__inline1_end:\nSET @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: calling two times same inline function', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; a = inc(b); b = inc(a); inline long inc (long num) { if (num) return num+1; return -1; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare inc_num\n\nSET @inc_num $b\n__inline1_start:\nBZR $inc_num :__if2_endif\n__if2_start:\nSET @r0 $inc_num\nINC @r0\nSET @r0 $r0\nJMP :__inline1_end\n__if2_endif:\nSET @r0 #ffffffffffffffff\nSET @r0 $r0\nJMP :__inline1_end\n__inline1_end:\nSET @a $r0\nSET @inc_num $a\n__inline3_start:\nBZR $inc_num :__if4_endif\n__if4_start:\nSET @r0 $inc_num\nINC @r0\nSET @r0 $r0\nJMP :__inline3_end\n__if4_endif:\nSET @r0 #ffffffffffffffff\nSET @r0 $r0\nJMP :__inline3_end\n__inline3_end:\nSET @b $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: inline call inside argument of inline function', () => {
        const code = '#pragma optimizationLevel 0\n long a, b; a = inc(1+inc(b)); inline long inc (long num) { if (num) return num+1; return -1; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare inc_num\n\nSET @inc_num $b\n__inline1_start:\nBZR $inc_num :__if2_endif\n__if2_start:\nSET @r0 $inc_num\nINC @r0\nSET @r0 $r0\nJMP :__inline1_end\n__if2_endif:\nSET @r0 #ffffffffffffffff\nSET @r0 $r0\nJMP :__inline1_end\n__inline1_end:\nSET @a $r0\nINC @a\nSET @inc_num $a\n__inline3_start:\nBZR $inc_num :__if4_endif\n__if4_start:\nSET @r0 $inc_num\nINC @r0\nSET @r0 $r0\nJMP :__inline3_end\n__if4_endif:\nSET @r0 #ffffffffffffffff\nSET @r0 $r0\nJMP :__inline3_end\n__inline3_end:\nSET @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: inline circular loop', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\n long a, b; a = inc(1); inline long inc (long num) { return add2(num)-1; } inline long add2(long newnum) {  return inc(newnum)+1; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: inline main function', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\n long a, b; inline void main(void) {a = 1/}'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: inline catch function', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\n long a, b; a++; inline void catch (void) {a = 1;}'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})
