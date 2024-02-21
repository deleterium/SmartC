import { SmartC } from '../smartc'

describe('Keyword inline', () => {
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
describe('Keyword register', () => {
    it('should compile: register simple', () => {
        const code = '#pragma optimizationLevel 0\nregister long a;a=1;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n\nSET @r2 #0000000000000001\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: register simple delim', () => {
        const code = '#pragma optimizationLevel 0\nregister long a=1, b=2;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n\nSET @r2 #0000000000000001\nSET @r1 #0000000000000002\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: register multi scope', () => {
        const code = '#pragma optimizationLevel 0\n#include APIFunctions\nlong G = teste(2, 3);\nlong teste(long arg_a, long arg_b) { register long a=2; if (arg_a) { register long b = Get_A1(); a+=b; } else { register long c = Get_A2(); a+=c; } register long d=0; return a+d; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare G\n^declare teste_arg_a\n^declare teste_arg_b\n\nSET @teste_arg_b #0000000000000003\nSET @teste_arg_a #0000000000000002\nJSR :__fn_teste\nSET @G $r0\nFIN\n\n__fn_teste:\nSET @r2 #0000000000000002\nBZR $teste_arg_a :__if1_else\n__if1_start:\nFUN @r1 get_A1\nADD @r2 $r1\nJMP :__if1_endif\n__if1_else:\nFUN @r1 get_A2\nADD @r2 $r1\n__if1_endif:\nCLR @r1\nSET @r0 $r2\nADD @r0 $r1\nSET @r0 $r0\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: register in use and function call (push/pop)', () => {
        const code = `#pragma optimizationLevel 0\n#include APIFunctions\n long G = teste(2, 3);
            long teste(long arg_a, long arg_b) {
                register long a=2;
                if (arg_a) {
                    register long b = Get_A1();
                    a+=inc(b);
                } else {
                    register long c = Get_A2();
                    a+=c;
                }
                return a+inc(a);
            }
            long inc(long val) { return val+1; }`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare G\n^declare teste_arg_a\n^declare teste_arg_b\n^declare inc_val\n\nSET @teste_arg_b #0000000000000003\nSET @teste_arg_a #0000000000000002\nJSR :__fn_teste\nSET @G $r0\nFIN\n\n__fn_teste:\nSET @r2 #0000000000000002\nBZR $teste_arg_a :__if1_else\n__if1_start:\nFUN @r1 get_A1\nSET @inc_val $r1\nPSH $r2\nPSH $r1\nJSR :__fn_inc\nSET @r0 $r0\nPOP @r1\nPOP @r2\nADD @r2 $r0\nJMP :__if1_endif\n__if1_else:\nFUN @r1 get_A2\nADD @r2 $r1\n__if1_endif:\nSET @inc_val $r2\nPSH $r2\nJSR :__fn_inc\nSET @r0 $r0\nPOP @r2\nADD @r0 $r2\nSET @r0 $r0\nRET\n\n__fn_inc:\nSET @r0 $inc_val\nINC @r0\nSET @r0 $r0\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: register increment on a function call argument (detecting right actual registers vs register variable type', () => {
        const code = '#pragma optimizationLevel 0\n#include APIFunctions\nlong G = teste(2, 3); long teste(long arg_a, long arg_b) { register long a=2; return a+inc(a+1); } long inc(long val) { return val+1; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare G\n^declare teste_arg_a\n^declare teste_arg_b\n^declare inc_val\n\nSET @teste_arg_b #0000000000000003\nSET @teste_arg_a #0000000000000002\nJSR :__fn_teste\nSET @G $r0\nFIN\n\n__fn_teste:\nSET @r2 #0000000000000002\nSET @r0 $r2\nINC @r0\nSET @inc_val $r0\nPSH $r2\nJSR :__fn_inc\nSET @r0 $r0\nPOP @r2\nADD @r0 $r2\nSET @r0 $r0\nRET\n\n__fn_inc:\nSET @r0 $inc_val\nINC @r0\nSET @r0 $r0\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: register missing type', () => {
        expect(() => {
            const code = 'register a=2;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: register alone in the dark', () => {
        expect(() => {
            const code = 'register;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: register wrong type', () => {
        expect(() => {
            const code = 'struct ASM { long a, b;}; register struct ASM a;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: register on arrays', () => {
        expect(() => {
            const code = 'register long a[5];'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: register on function definition', () => {
        expect(() => {
            const code = 'long G = teste(2, 3); register teste(long arg_a, long arg_b) { return arg_a+arg_b; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: register on function arguments', () => {
        expect(() => {
            const code = 'long G = teste(2, 3); long teste(register long arg_a, long arg_b) { return arg_a+arg_b; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: register out of scope', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\n#include APIFunctions\n long G = teste(2, 3); long teste(long arg_a, long arg_b) { register long a=2; if (arg_a) { register long b = Get_A1(); a+=b; } return b; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: running out of register', () => {
        expect(() => {
            const code = '#pragma maxAuxVars 4\nregister fixed a=1., b=2.;\nregister fixed c=3.;\nregister long d=4;\n'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line: 4/)
    })
    it('should compile: register multi scope (verbose assembly)', () => {
        const code = '#pragma verboseAssembly\n#pragma optimizationLevel 0\n#include APIFunctions\nlong G = teste(2, 3);\nlong teste(long arg_a, long arg_b) {\nregister long a=2;\nif (arg_a) {\nregister long b = Get_A1();\na+=b;\n} else {\nregister long c = Get_A2(); a+=c;\n}\nregister long d=0;\nreturn a+d;\n}\n'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare G\n^declare teste_arg_a\n^declare teste_arg_b\n\n^comment scope r0,r1,r2\n^comment line 4 long G = teste(2, 3);\nSET @teste_arg_b #0000000000000003\nSET @teste_arg_a #0000000000000002\nJSR :__fn_teste\nSET @G $r0\n^comment scope r0,r1,r2\nFIN\n\n^comment line 5 long teste(long arg_a, long arg_b) {\n__fn_teste:\n^comment scope r0,r1,r2\n^comment line 6 register long a=2;\n^comment scope r2:teste_a\nSET @r2 #0000000000000002\n^comment line 7 if (arg_a) {\nBZR $teste_arg_a :__if1_else\n__if1_start:\n^comment scope r0,r1\n^comment line 8 register long b = Get_A1();\n^comment scope r1:teste_b\nFUN @r1 get_A1\n^comment line 9 a+=b;\nADD @r2 $r1\n^comment scope r0,r1\nJMP :__if1_endif\n__if1_else:\n^comment scope r0,r1\n^comment line 11 register long c = Get_A2(); a+=c;\n^comment scope r1:teste_c\nFUN @r1 get_A2\nADD @r2 $r1\n__if1_endif:\n^comment scope r0,r1\n^comment line 13 register long d=0;\n^comment scope r1:teste_d\nCLR @r1\n^comment line 14 return a+d;\nSET @r0 $r2\nADD @r0 $r1\nSET @r0 $r0\nRET\n^comment scope r0,r1,r2\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})
