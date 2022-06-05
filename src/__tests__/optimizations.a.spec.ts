import optimizer from '../codeGenerator/assemblyProcessor/optimizer'
import { SmartC } from '../smartc'

describe('Optimizations level zero', () => {
    it('should compile: swap register order on division', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; a=b/a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $b\nDIV @r0 $a\nSET @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: swap register order on division (many)', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c; a=1+(b/(c/a));'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @r0 $c\nDIV @r0 $a\nSET @r1 $b\nDIV @r1 $r0\nINC @r1\nSET @a $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Optimization with const nX variables', () => {
        const code = '#pragma optimizationLevel 0\nconst long n233 = 233; long a, b[2]; b[a]=233; b[0]=233; while (a<233) { a++; };'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare n233\n^declare a\n^declare b\n^const SET @b #0000000000000006\n^declare b_0\n^declare b_1\n\n^const SET @n233 #00000000000000e9\nSET @($b + $a) $n233\nSET @b_0 $n233\n__loop1_continue:\nBGE $a $n233 :__loop1_break\n__loop1_start:\nINC @a\nJMP :__loop1_continue\n__loop1_break:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Optimization with const fX variables', () => {
        const code = '#pragma optimizationLevel 0\nconst fixed f20000000 = .2; fixed fb; long a= fb * .2;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare f20000000\n^declare fb\n^declare a\n\n^const SET @f20000000 #0000000001312d00\nSET @a $f20000000\nMDV @a $fb $f100000000\nDIV @a $f100000000\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Specifc operator optimization with WRONG const n2 variables', () => {
        const code = '#pragma optimizationLevel 0\nlong a , b; const long n2 = 20; a=b+2;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare n2\n\n^const SET @n2 #0000000000000014\nSET @a $b\nINC @a\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Optimization with const nX variables as struct index', () => {
        const code = '#pragma optimizationLevel 0\nconst long n2 = 2; struct KOMBI { long driver; long collector; long passenger; } *pcar; pcar->passenger="Ze";'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare n2\n^declare pcar\n\n^const SET @n2 #0000000000000002\nSET @r0 #000000000000655a\nSET @($pcar + $n2) $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Optimization constant x constant basic operations + - * /', () => {
        const code = '#pragma optimizationLevel 0\nlong a = 7+5; a = 7-5; a = 7*5; a = 7/5;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #000000000000000c\nSET @a #0000000000000002\nSET @a #0000000000000023\nSET @a #0000000000000001\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Optimization variable x constant basic commutative operations + *', () => {
        const code = '#pragma optimizationLevel 0\nlong a , b; a = b * 1; a--; a = 0 * b; b = a+1; a--; b=0+a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $b\nDEC @a\nSET @a $b\nCLR @a\nSET @b $a\nINC @b\nDEC @a\nSET @b $a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Non commutative operations: Optimization with constants and operation - /', () => {
        const code = '#pragma optimizationLevel 0\nlong a , b; a = b - 1; a++; a = b - 0; b = a/1;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $b\nDEC @a\nINC @a\nSET @a $b\nSET @b $a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})

describe('Optimizations level 1', () => {
    it('should compile: Remove unused labels', () => {
        const code = '#pragma optimizationLevel 1\nlong a,b; for (a=0;a<10;a++) { b++; } b--;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @a\n__loop1_condition:\nSET @r0 #000000000000000a\nBGE $a $r0 :__loop1_break\nINC @b\nINC @a\nJMP :__loop1_condition\n__loop1_break:\nDEC @b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Delete unused code', () => {
        const code = '#pragma optimizationLevel 1\nvoid teste(void) { long a; a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare teste_a\n\nFIN\n\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: delete set same variable', () => {
        const code = '#pragma optimizationLevel 1\nlong a[2]; a[1] = a[1];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: delete jump to next instruction', () => {
        const code = '#pragma optimizationLevel 1\nvoid main (void) { long a=1;}'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare main_a\n\n\nPCS\nSET @main_a #0000000000000001\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})

describe('Optimizations level 2', () => {
    it('should compile: Swap branch ', () => {
        const code = '#pragma optimizationLevel 2\nlong a,b; while (1) { if (a) break;  a++; } a--;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n__loop1_continue:\nBNZ $a :__loop1_break\nINC @a\nJMP :__loop1_continue\n__loop1_break:\nDEC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Swap ALL branches types ', () => {
        const code = '#pragma optimizationLevel 2\nlong a,b; while (1) { if (a) break; if (!a) break; if (a<b) break; if (a<=b) break; if (a>b) break; if (a>=b) break; if (a==b) break; if (a!=b) break; a++; } a--;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n__loop1_continue:\nBNZ $a :__loop1_break\nBZR $a :__loop1_break\nBLT $a $b :__loop1_break\nBLE $a $b :__loop1_break\nBGT $a $b :__loop1_break\nBGE $a $b :__loop1_break\nBEQ $a $b :__loop1_break\nBNE $a $b :__loop1_break\nINC @a\nJMP :__loop1_continue\n__loop1_break:\nDEC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: branchOpt', () => {
        const code = '#pragma optimizationLevel 2\nlong a,b; start: a++; if (a) a--; goto start;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nstart:\nINC @a\nBZR $a :start\nDEC @a\nJMP :start\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: branchOpt (exit)', () => {
        const code = '#pragma optimizationLevel 2\nlong a,b; if (a) a--;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBNZ $a :__opt_1\nFIN\n__opt_1:\nDEC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Jump to jump', () => {
        const code = '#pragma optimizationLevel 2\nlong a,b; while (a) {if (a) a--; else b++;} a++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n__loop1_continue:\nBZR $a :__loop1_break\nBZR $a :__if2_else\nDEC @a\nJMP :__loop1_continue\n__if2_else:\nINC @b\nJMP :__loop1_continue\n__loop1_break:\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Jump to exit', () => {
        const code = '#pragma optimizationLevel 2\nlong a,b; if (a) a--; else b++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBZR $a :__if1_else\nDEC @a\nFIN\n__if1_else:\nINC @b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: bitwise not optimizer', () => {
        const code = '#pragma optimizationLevel 2\nlong a; a=~a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nNOT @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Pop+Push', () => {
        const code = '#pragma optimizationLevel 2\n long a, b; tt(teste(b)); long teste(long c){ return ++c; } void tt(long d){ d++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare teste_c\n^declare tt_d\n\nPSH $b\nJSR :__fn_teste\nJSR :__fn_tt\nFIN\n\n__fn_teste:\nPOP @teste_c\nINC @teste_c\nPSH $teste_c\nRET\n\n__fn_tt:\nPOP @tt_d\nINC @tt_d\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mul+div to mdv', () => {
        const code = '#pragma optimizationLevel 2\n long a, b, c, d; a = b * c / d;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $b\nMDV @a $c $d\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})

/* Please note that these optimizations are not well tested. Code generated by smartc
mostly have this safely coded during AST processing. */
describe('Optimizations level 3', () => {
    it('should optimize: pop+set = pop', () => {
        const code = 'SET @r0 #000000000000655a\nPOP @r0\nSET @pcar $r0\nFIN\n'
        const assembly = 'SET @r0 #000000000000655a\nPOP @pcar\nFIN\n'
        const result = optimizer(3, code, [])
        expect(result).toBe(assembly)
    })
    it('should compile: clear+pointer = pointer', () => {
        const code = '#pragma optimizationLevel 3\nlong a, d[2]; a=0; d[a]=5; d[1]=d[a];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare d\n^const SET @d #0000000000000005\n^declare d_0\n^declare d_1\n\nSET @r0 #0000000000000005\nSET @($d) $r0\nSET @d_1 $($d)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: set+pointer = pointer with old var', () => {
        const code = '#pragma optimizationLevel 3\nlong a, b, d[2]; a=b; d[a]=5; d[1]=d[a];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare d\n^const SET @d #0000000000000006\n^declare d_0\n^declare d_1\n\nSET @r0 #0000000000000005\nSET @($d + $b) $r0\nSET @d_1 $($d + $b)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})
