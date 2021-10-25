import { SmartC } from '../smartc'

describe('Optimizations', () => {
    it('should compile: swap register order on division', () => {
        const code = 'long a, b; a=b/a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $b\nDIV @r0 $a\nSET @a $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: swap register order on division (many)', () => {
        const code = 'long a, b, c; a=1+(b/(c/a));'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @r0 $c\nDIV @r0 $a\nSET @r1 $b\nDIV @r1 $r0\nINC @r1\nSET @a $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Optimization with const nX variables', () => {
        const code = 'const long n233 = 233; long a, b[2]; b[a]=233; b[0]=233; while (a<233) { a++; };'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare n233\n^declare a\n^declare b\n^const SET @b #0000000000000006\n^declare b_0\n^declare b_1\n\n^const SET @n233 #00000000000000e9\nSET @($b + $a) $n233\nSET @b_0 $n233\n__loop1_continue:\nBGE $a $n233 :__loop1_break\n__loop1_start:\nINC @a\nJMP :__loop1_continue\n__loop1_break:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Optimization with const nX variables as struct index', () => {
        const code = 'const long n2 = 2; struct KOMBI { long driver; long collector; long passenger; } *pcar; pcar->passenger="Ze";'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare n2\n^declare pcar\n\n^const SET @n2 #0000000000000002\nSET @r0 #000000000000655a\nSET @($pcar + $n2) $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})

describe('Global Optimization', () => {
    it('should compile:', () => {
        const code = '#pragma globalOptimization\nlong a,b; for (a=0;a<10;a++) { b++; } b--;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @a\n__loop1_condition:\nSET @r0 #000000000000000a\nBGE $a $r0 :__loop1_break\nINC @b\nINC @a\nJMP :__loop1_condition\n__loop1_break:\nDEC @b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = '#pragma globalOptimization\nlong a,b; while (b) {a++; while (1) { if (a) break;  } } a++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n__loop1_continue:\nBZR $b :__loop1_break\nINC @a\n__loop2_continue:\nBZR $a :__loop2_continue\nJMP :__loop1_continue\n__loop1_break:\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = '#pragma globalOptimization\nlong a,b; if (!b) {a++; } b++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBNZ $b :__if1_endif\nINC @a\n__if1_endif:\nINC @b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = '#pragma globalOptimization\nlong a,b; void main (void) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n\nPCS\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = '#pragma globalOptimization\nlong a,b; if (!b) {a++; } else { b++;} '
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBNZ $b :__if1_else\nINC @a\nFIN\n__if1_else:\nINC @b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = '#pragma globalOptimization\nlong a,b; test(); void test (void) { if (a) a++; else b++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nJSR :__fn_test\nFIN\n\n__fn_test:\nBZR $a :__if1_else\nINC @a\nRET\n__if1_else:\nINC @b\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = '#pragma globalOptimization\nlong a,b; test(); exit; a++; void test (void) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nJSR :__fn_test\nFIN\n\n__fn_test:\nINC @a\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = '#pragma globalOptimization\nlong a,b; test(); void test (void) { return; a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nJSR :__fn_test\nFIN\n\n__fn_test:\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = '#pragma globalOptimization\nlong a,b; test(); void test (void) { if (a) a++; else b++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nJSR :__fn_test\nFIN\n\n__fn_test:\nBZR $a :__if1_else\nINC @a\nRET\n__if1_else:\nINC @b\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = '#pragma globalOptimization\nlong a, b, c, d; a=(b*c)*d;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $b\nMUL @a $c\nMUL @a $d\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = '#pragma globalOptimization\nlong a[4][2], *b, c,d; b=&a[c][d];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n^declare c\n^declare d\n\nSET @r0 #0000000000000002\nMUL @r0 $c\nADD @r0 $d\nSET @b $a\nADD @b $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = '#pragma globalOptimization\n long a; a=0; void test(void){ a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nCLR @a\nFIN\n\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = `#pragma globalOptimization\nstruct KOMBI { long driver; long collector; long passenger; } ;struct KOMBI car, *pcar;long a, b, *c, d[2],z;pcar=&car;
pcar->passenger='Ze';
pcar->driver=a;
b+=-a;
a=0;
d[a]=5;
for (a=0;a<10;a++) d[a]=1;\n
pcar->driver=*c;pcar->driver=d[1];pcar->driver=d[a];pcar->driver=pcar->collector;
a=pcar->collector;z++;*c=pcar->driver;d[1]=pcar->collector;d[a]=pcar->collector;`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^declare pcar\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #000000000000000b\n^declare d_0\n^declare d_1\n^declare z\n\nSET @pcar #0000000000000003\nSET @r0 #000000000000655a\nSET @r1 #0000000000000002\nSET @($pcar + $r1) $r0\nSET @($pcar) $a\nCLR @r0\nSUB @r0 $a\nADD @b $r0\nSET @r0 #0000000000000005\nSET @($d) $r0\nCLR @a\n__loop1_condition:\nSET @r0 #000000000000000a\nBGE $a $r0 :__loop1_break\nSET @r0 #0000000000000001\nSET @($d + $a) $r0\nINC @a\nJMP :__loop1_condition\n__loop1_break:\nSET @r0 $($c)\nSET @($pcar) $r0\nSET @($pcar) $d_1\nSET @r0 $($d + $a)\nSET @($pcar) $r0\nSET @r1 #0000000000000001\nSET @r0 $($pcar + $r1)\nSET @($pcar) $r0\nSET @r0 #0000000000000001\nSET @a $($pcar + $r0)\nINC @z\nSET @r0 $($pcar)\nSET @($c) $r0\nSET @r0 #0000000000000001\nSET @d_1 $($pcar + $r0)\nSET @r1 #0000000000000001\nSET @r0 $($pcar + $r1)\nSET @($d + $a) $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = '#pragma globalOptimization\n long d[2]; d[1]=d[1]+1;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare d\n^const SET @d #0000000000000004\n^declare d_0\n^declare d_1\n\nINC @d_1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = `#pragma globalOptimization\n#pragma maxConstVars 3\nstruct KOMBI { long driver; long collector; long passenger; } ;struct KOMBI car, *pcar;long a, b, *c, d[2],z;pcar=&car;
pcar->passenger='Ze';
pcar->driver=a;
b+=-a;
a=0;
d[a]=5;
for (a=0;a<10;a++) d[a]=1;\n
pcar->driver=*c;pcar->driver=d[1];pcar->driver=d[a];pcar->driver=pcar->collector;
a=pcar->collector;z++;*c=pcar->driver;d[1]=pcar->collector;d[a]=pcar->collector;`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare n1\n^const SET @n1 #0000000000000001\n^declare n2\n^const SET @n2 #0000000000000002\n^declare n3\n^const SET @n3 #0000000000000003\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^declare pcar\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #000000000000000e\n^declare d_0\n^declare d_1\n^declare z\n\nSET @pcar #0000000000000006\nSET @r0 #000000000000655a\nSET @($pcar + $n2) $r0\nSET @($pcar) $a\nCLR @r0\nSUB @r0 $a\nADD @b $r0\nSET @r0 #0000000000000005\nSET @($d) $r0\nCLR @a\n__loop1_condition:\nSET @r0 #000000000000000a\nBGE $a $r0 :__loop1_break\nSET @($d + $a) $n1\nINC @a\nJMP :__loop1_condition\n__loop1_break:\nSET @r0 $($c)\nSET @($pcar) $r0\nSET @($pcar) $d_1\nSET @r0 $($d + $a)\nSET @($pcar) $r0\nSET @r0 $($pcar + $n1)\nSET @($pcar) $r0\nSET @a $($pcar + $n1)\nINC @z\nSET @r0 $($pcar)\nSET @($c) $r0\nSET @d_1 $($pcar + $n1)\nSET @r0 $($pcar + $n1)\nSET @($d + $a) $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = '#pragma globalOptimization\n#pragma maxConstVars 3\nlong a, b, c; teste(a, 2); void teste(long aa, long bb) { aa=bb;} '
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare n1\n^const SET @n1 #0000000000000001\n^declare n2\n^const SET @n2 #0000000000000002\n^declare n3\n^const SET @n3 #0000000000000003\n^declare a\n^declare b\n^declare c\n^declare teste_aa\n^declare teste_bb\n\nPSH $n2\nPSH $a\nJSR :__fn_teste\nFIN\n\n__fn_teste:\nPOP @teste_aa\nPOP @teste_bb\nSET @teste_aa $teste_bb\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = '#pragma globalOptimization\n#pragma maxConstVars 3\nsleep 1;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare n1\n^const SET @n1 #0000000000000001\n^declare n2\n^const SET @n2 #0000000000000002\n^declare n3\n^const SET @n3 #0000000000000003\n\nSLP $n1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = '#pragma globalOptimization\n long a,b; if ( a==4 && (b || a )) { a++; a=4;} b++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 #0000000000000004\nBNE $a $r0 :__if1_endif\nBNZ $b :__if1_start\nBZR $a :__if1_endif\n__if1_start:\nINC @a\nSET @a #0000000000000004\n__if1_endif:\nINC @b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = '#pragma globalOptimization\n long a,b, c; if ( a==4 && (b || a>c )) { a++; a=4; } b++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @r0 #0000000000000004\nBNE $a $r0 :__if1_endif\nBNZ $b :__if1_start\nBLE $a $c :__if1_endif\n__if1_start:\nINC @a\nSET @a #0000000000000004\n__if1_endif:\nINC @b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = '#pragma globalOptimization\n long a; a=~a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nNOT @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = '#pragma globalOptimization\n long a, b; tt(teste(b)); long teste(long c){ return ++c; } void tt(long d){ d++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare teste_c\n^declare tt_d\n\nPSH $b\nJSR :__fn_teste\nJSR :__fn_tt\nFIN\n\n__fn_teste:\nPOP @teste_c\nINC @teste_c\nPSH $teste_c\nRET\n\n__fn_tt:\nPOP @tt_d\nINC @tt_d\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile:', () => {
        const code = '#pragma globalOptimization\n long a, b; /* No opt: interference with reuseVariable */ a=teste(teste(b)); tt(a); long teste(long c){ return ++c; } void tt(long d){ d++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare teste_c\n^declare tt_d\n\nPSH $b\nJSR :__fn_teste\nPOP @a\nPSH $a\nJSR :__fn_teste\nPOP @a\nPSH $a\nJSR :__fn_tt\nFIN\n\n__fn_teste:\nPOP @teste_c\nINC @teste_c\nPSH $teste_c\nRET\n\n__fn_tt:\nPOP @tt_d\nINC @tt_d\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})
