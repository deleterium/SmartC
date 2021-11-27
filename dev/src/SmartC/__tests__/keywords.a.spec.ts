import { SmartC } from '../smartc'

describe('Keywords right usage', () => {
    it('should compile: long declaration', () => {
        const code = '#pragma optimizationLevel 0\nlong a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: long declaration inside nested statements', () => {
        const code = '#pragma optimizationLevel 0\n long a, b; while (a==0) { a++; if (a==5) { long c=3; a=c; } }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\n__loop1_continue:\nBNZ $a :__loop1_break\n__loop1_start:\nINC @a\nSET @r0 #0000000000000005\nBNE $a $r0 :__if2_endif\n__if2_start:\nSET @c #0000000000000003\nSET @a $c\n__if2_endif:\nJMP :__loop1_continue\n__loop1_break:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: long declaration with assignment', () => {
        const code = '#pragma optimizationLevel 0\nlong a=3;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #0000000000000003\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: long declaration and delimiter', () => {
        const code = '#pragma optimizationLevel 0\nlong a,b;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: long declaration with delimiter and assigment', () => {
        const code = '#pragma optimizationLevel 0\nlong a,b=3;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @b #0000000000000003\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: if', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; if (a) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBZR $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: if else', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; if (a) { a++; } else { b--; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBZR $a :__if1_else\n__if1_start:\nINC @a\nJMP :__if1_endif\n__if1_else:\nDEC @b\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: while', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; while (a) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n__loop1_continue:\nBZR $a :__loop1_break\n__loop1_start:\nINC @a\nJMP :__loop1_continue\n__loop1_break:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: for', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; for (a=0;a<10;a++) { b++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @a\n__loop1_condition:\nSET @r0 #000000000000000a\nBGE $a $r0 :__loop1_break\n__loop1_start:\nINC @b\n__loop1_continue:\nINC @a\nJMP :__loop1_condition\n__loop1_break:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: for with empty fields', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; for (;;) { b++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n__loop1_condition:\n__loop1_start:\nINC @b\n__loop1_continue:\nJMP :__loop1_condition\n__loop1_break:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: do while', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; do { a++; } while (a<b);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n__loop1_continue:\nINC @a\nBLT $a $b :__loop1_continue\n__loop1_break:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: if (no codedomain)', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; if (a) a++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBZR $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: if else (no codedomain)', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; if (a) a++; else b--;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBZR $a :__if1_else\n__if1_start:\nINC @a\nJMP :__if1_endif\n__if1_else:\nDEC @b\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: while (no codedomain)', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; while (a) a++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n__loop1_continue:\nBZR $a :__loop1_break\n__loop1_start:\nINC @a\nJMP :__loop1_continue\n__loop1_break:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: for  (no codedomain)', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; for (a=0;a<10;a++) b++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @a\n__loop1_condition:\nSET @r0 #000000000000000a\nBGE $a $r0 :__loop1_break\n__loop1_start:\nINC @b\n__loop1_continue:\nINC @a\nJMP :__loop1_condition\n__loop1_break:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: do while  (no codedomain)', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; do a++; while (a<b);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n__loop1_continue:\nINC @a\nBLT $a $b :__loop1_continue\n__loop1_break:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: break', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; while (a) { a++; if (a==5) break; b++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n__loop1_continue:\nBZR $a :__loop1_break\n__loop1_start:\nINC @a\nSET @r0 #0000000000000005\nBNE $a $r0 :__if2_endif\n__if2_start:\nJMP :__loop1_break\n__if2_endif:\nINC @b\nJMP :__loop1_continue\n__loop1_break:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: continue', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; while (a) { a++; if (a==5) continue; b++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n__loop1_continue:\nBZR $a :__loop1_break\n__loop1_start:\nINC @a\nSET @r0 #0000000000000005\nBNE $a $r0 :__if2_endif\n__if2_start:\nJMP :__loop1_continue\n__if2_endif:\nINC @b\nJMP :__loop1_continue\n__loop1_break:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: goto and label', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c; a++; goto alabel; b++; alabel: c++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nINC @a\nJMP :alabel\nINC @b\nalabel:\nINC @c\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: multiple gotos and labels', () => {
        const code = '#pragma optimizationLevel 0\nlong temp; temp = 2; if (temp>0) goto label1; if (temp==0) goto label2; goto label3; label1: temp++; label2: temp++; label3: temp++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare temp\n\nSET @temp #0000000000000002\nCLR @r0\nBLE $temp $r0 :__if1_endif\n__if1_start:\nJMP :label1\n__if1_endif:\nBNZ $temp :__if2_endif\n__if2_start:\nJMP :label2\n__if2_endif:\nJMP :label3\nlabel1:\nINC @temp\nlabel2:\nINC @temp\nlabel3:\nINC @temp\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: asm', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; a++; asm { PSH $a\nPOP @b } b++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nINC @a\nPSH $a\nPOP @b\nINC @b\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: sleep', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; a++; sleep 1;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nINC @a\nSET @r0 #0000000000000001\nSLP $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: exit', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; exit; a++; '
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nFIN\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: halt', () => {
        const code = '#pragma optimizationLevel 0\nhalt;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n\nSTP\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: switch (simple)', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; switch (a) { case 1: a++; break; case b: a--; break; default: a = 0;}'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 #0000000000000001\nBEQ $a $r0 :__switch1_0\nBEQ $a $b :__switch1_1\nJMP :__switch1_default\n__switch1_0:\nINC @a\nJMP :__switch1_break\n__switch1_1:\nDEC @a\nJMP :__switch1_break\n__switch1_default:\nCLR @a\n__switch1_break:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: switch (minimal)', () => {
        const code = '#pragma optimizationLevel 0\n long a, b; switch (a) { case 1: a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 #0000000000000001\nBEQ $a $r0 :__switch1_0\nJMP :__switch1_break\n__switch1_0:\nINC @a\n__switch1_break:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: switch (expressions)', () => {
        const code = '#pragma optimizationLevel 0\n#pragma maxConstVars 2\n long a, b; switch (a%2) { default: a--; break; case (b%2): a=0; break; case 1: a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare n1\n^const SET @n1 #0000000000000001\n^declare n2\n^const SET @n2 #0000000000000002\n^declare a\n^declare b\n\nSET @r0 $a\nMOD @r0 $n2\nSET @r1 $b\nMOD @r1 $n2\nBEQ $r0 $r1 :__switch1_0\nBEQ $r0 $n1 :__switch1_1\nJMP :__switch1_default\n__switch1_default:\nDEC @a\nJMP :__switch1_break\n__switch1_0:\nCLR @a\nJMP :__switch1_break\n__switch1_1:\nINC @a\n__switch1_break:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: switch (logical true)', () => {
        const code = '#pragma optimizationLevel 0\n long a, b; switch (true) { case (b%2 == 3): a=0; break; case (b == 1):  a--; case a: a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $b\nSET @r1 #0000000000000002\nMOD @r0 $r1\nSET @r1 #0000000000000003\nBEQ $r0 $r1 :__switch1_0\n__switch1_0_next:\nSET @r0 #0000000000000001\nBEQ $b $r0 :__switch1_1\n__switch1_1_next:\nBNZ $a :__switch1_2\n__switch1_2_next:\nJMP :__switch1_break\n__switch1_0:\nCLR @a\nJMP :__switch1_break\n__switch1_1:\nDEC @a\n__switch1_2:\nINC @a\n__switch1_break:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: switch (logical false)', () => {
        const code = '#pragma optimizationLevel 0\n long a, b; switch (false) { case (b%2 == 3): a=0; break; case (b == 1):  a--; case a: a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $b\nSET @r1 #0000000000000002\nMOD @r0 $r1\nSET @r1 #0000000000000003\nBNE $r0 $r1 :__switch1_0\n__switch1_0_next:\nSET @r0 #0000000000000001\nBNE $b $r0 :__switch1_1\n__switch1_1_next:\nBZR $a :__switch1_2\n__switch1_2_next:\nJMP :__switch1_break\n__switch1_0:\nCLR @a\nJMP :__switch1_break\n__switch1_1:\nDEC @a\n__switch1_2:\nINC @a\n__switch1_break:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: switch (many logical - use jump next)', () => {
        const code = '#pragma optimizationLevel 0\n long a, b; switch (true) { case (a && b): a=0; break; case (b == 1):  a--; case a: a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBZR $a :__switch1_0_next\n__AND_2_next:\nBZR $b :__switch1_0_next\nJMP :__switch1_0\n__switch1_0_next:\nSET @r0 #0000000000000001\nBEQ $b $r0 :__switch1_1\n__switch1_1_next:\nBNZ $a :__switch1_2\n__switch1_2_next:\nJMP :__switch1_break\n__switch1_0:\nCLR @a\nJMP :__switch1_break\n__switch1_1:\nDEC @a\n__switch1_2:\nINC @a\n__switch1_break:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: continue inside switch', () => {
        const code = '#pragma optimizationLevel 0\n long a, b; while (a==0) { a++; switch (a) { case 1: a=0; break; case 2: continue; default: a++; } b++;}'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n__loop1_continue:\nBNZ $a :__loop1_break\n__loop1_start:\nINC @a\nSET @r0 #0000000000000001\nBEQ $a $r0 :__switch2_0\nSET @r0 #0000000000000002\nBEQ $a $r0 :__switch2_1\nJMP :__switch2_default\n__switch2_0:\nCLR @a\nJMP :__switch2_break\n__switch2_1:\nJMP :__loop1_continue\n__switch2_default:\nINC @a\n__switch2_break:\nINC @b\nJMP :__loop1_continue\n__loop1_break:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: nested if', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c; if (a) { a++; if (b) { b++; if (c) { c++; } } }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nBZR $a :__if1_endif\n__if1_start:\nINC @a\nBZR $b :__if2_endif\n__if2_start:\nINC @b\nBZR $c :__if3_endif\n__if3_start:\nINC @c\n__if3_endif:\n__if2_endif:\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: nested if else', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, c; if (a) {\n a++;\n} else if (b) {\n b++;\n} else if (c) {\n c++;\n}'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nBZR $a :__if1_else\n__if1_start:\nINC @a\nJMP :__if1_endif\n__if1_else:\nBZR $b :__if2_else\n__if2_start:\nINC @b\nJMP :__if2_endif\n__if2_else:\nBZR $c :__if3_endif\n__if3_start:\nINC @c\n__if3_endif:\n__if2_endif:\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: const (all types)', () => {
        const code = '#pragma optimizationLevel 0\nstruct KOMBI { long driver; long collector; long passenger[4]; } car[2]; long a, b, *c, d[2];\nconst a=353; const d[1]=354; const car[1].driver=355; const car[0].passenger[1]=356;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^const SET @car_0_passenger #0000000000000007\n^declare car_0_passenger_0\n^declare car_0_passenger_1\n^declare car_0_passenger_2\n^declare car_0_passenger_3\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^const SET @car_1_passenger #000000000000000e\n^declare car_1_passenger_0\n^declare car_1_passenger_1\n^declare car_1_passenger_2\n^declare car_1_passenger_3\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000016\n^declare d_0\n^declare d_1\n\n^const SET @a #0000000000000161\n^const SET @d_1 #0000000000000162\n^const SET @car_1_driver #0000000000000163\n^const SET @car_0_passenger_1 #0000000000000164\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: const during declaration', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, *c, d[2]; a++; const long e=5; a++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000007\n^declare d_0\n^declare d_1\n^declare e\n\nINC @a\n^const SET @e #0000000000000005\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: incrementing a const declared value', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, *c, d[2]; a++; const long e=5; a++; e++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000007\n^declare d_0\n^declare d_1\n^declare e\n\nINC @a\n^const SET @e #0000000000000005\nINC @a\nINC @e\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: const with constants operations', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b, *c, d[2]; a++; const b=3+3+4;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000007\n^declare d_0\n^declare d_1\n\nINC @a\n^const SET @b #000000000000000a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: const in multiline assignment', () => {
        // when const declaration in multilong assigment, change CLR to SET #0
        const code = "#pragma optimizationLevel 0\nlong a[3]; const a[]='alow'; a[]='tchau';"
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n\n^const SET @a_0 #00000000776f6c61\n^const SET @a_1 #0000000000000000\n^const SET @a_2 #0000000000000000\nSET @a_0 #0000007561686374\nCLR @a_1\nCLR @a_2\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw:', () => {
        // After above optimizations, this code was being executed wrong
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a, b[5]; b[]=&a;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: Nested of CodeDomains', () => {
        const code = '#pragma optimizationLevel 0\nlong a;{{a++;}}'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})
