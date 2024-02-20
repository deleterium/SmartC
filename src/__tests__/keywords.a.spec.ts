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
    it('should compile: sleep (no arguments)', () => {
        const code = '#pragma optimizationLevel 0\nlong a, b; a++; sleep;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nINC @a\nSLP\nFIN\n'
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
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\n__scope1_start:\n__scope2_start:\nINC @a\n__scope2_end:\n__scope1_end:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: many nested of CodeDomains + scoped registers', () => {
        const code = '#pragma optimizationLevel 0\n#include APIFunctions\n#pragma maxAuxVars 6\nlong a; a=1; { register long b = Get_A1(); { register long c = Get_A2(); { register long d = Get_A3(); { register long e = Get_A4(); a+=e+d+c+b+10; } a-=d; } a-=c; } a-=b; { register long c1 = Get_A2(); { register long d1 = Get_A3(); { register long e1 = Get_A4(); a+=e1+d1+c1+b+10; } a-=d1; } a-=c1; } a-=b; } a--;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare r5\n^declare a\n\nSET @a #0000000000000001\n__scope1_start:\nFUN @r5 get_A1\n__scope2_start:\nFUN @r4 get_A2\n__scope3_start:\nFUN @r3 get_A3\n__scope4_start:\nFUN @r2 get_A4\nSET @r0 $r2\nADD @r0 $r3\nADD @r0 $r4\nADD @r0 $r5\nSET @r1 #000000000000000a\nADD @r1 $r0\nADD @a $r1\n__scope4_end:\nSUB @a $r3\n__scope3_end:\nSUB @a $r4\n__scope2_end:\nSUB @a $r5\n__scope5_start:\nFUN @r4 get_A2\n__scope6_start:\nFUN @r3 get_A3\n__scope7_start:\nFUN @r2 get_A4\nSET @r0 $r2\nADD @r0 $r3\nADD @r0 $r4\nADD @r0 $r5\nSET @r1 #000000000000000a\nADD @r1 $r0\nADD @a $r1\n__scope7_end:\nSUB @a $r3\n__scope6_end:\nSUB @a $r4\n__scope5_end:\nSUB @a $r5\n__scope1_end:\nDEC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: sizeof long and long array', () => {
        const code = '#pragma optimizationLevel 0\nlong a, arr[2]; a=sizeof(a); a=sizeof(arr); a=sizeof(arr[1]); a=sizeof(long);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare arr\n^const SET @arr #0000000000000005\n^declare arr_0\n^declare arr_1\n\nSET @a #0000000000000001\nSET @a #0000000000000003\nSET @a #0000000000000001\nSET @a #0000000000000001\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: sizeof struct and struct array', () => {
        const code = '#pragma optimizationLevel 0\n struct BIDS { long aa, bb[2];} stru, struArr[2]; long a; a=sizeof(stru); a=sizeof(struArr); a=sizeof(struArr[1]); a=sizeof(struArr[1].aa); a=sizeof(struArr[1].bb); a=sizeof(struArr[1].bb[0]); a=sizeof(struct BIDS);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare stru_aa\n^declare stru_bb\n^const SET @stru_bb #0000000000000005\n^declare stru_bb_0\n^declare stru_bb_1\n^declare struArr\n^const SET @struArr #0000000000000008\n^declare struArr_0_aa\n^declare struArr_0_bb\n^const SET @struArr_0_bb #000000000000000a\n^declare struArr_0_bb_0\n^declare struArr_0_bb_1\n^declare struArr_1_aa\n^declare struArr_1_bb\n^const SET @struArr_1_bb #000000000000000e\n^declare struArr_1_bb_0\n^declare struArr_1_bb_1\n^declare a\n\nSET @a #0000000000000004\nSET @a #0000000000000009\nSET @a #0000000000000004\nSET @a #0000000000000001\nSET @a #0000000000000003\nSET @a #0000000000000001\nSET @a #0000000000000004\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: sizeof pointers', () => {
        const code = '#pragma optimizationLevel 0\n long a, *pa; void * pv; struct BIDS { long aa, bb[2];} *c; a=sizeof pa ; a=sizeof pv; a=sizeof c; a=sizeof (long *); a=sizeof(void *); a=sizeof(struct BIDS *);'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare pa\n^declare pv\n^declare c\n\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})
