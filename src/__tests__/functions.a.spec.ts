import { SmartC } from '../smartc'

describe('Special functions', () => {
    it('should compile: main() no return', () => {
        const code = '#pragma optimizationLevel 0\nlong a; void main(void) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nJMP :__fn_main\n\n__fn_main:\nPCS\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: main() with return at end', () => {
        const code = '#pragma optimizationLevel 0\nlong a; void main() { a++; return; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nJMP :__fn_main\n\n__fn_main:\nPCS\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: main() with return at middle', () => {
        const code = '#pragma optimizationLevel 0\nlong a; void main() { a++; return; a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nJMP :__fn_main\n\n__fn_main:\nPCS\nINC @a\nFIN\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: catch() regular use', () => {
        const code = '#pragma optimizationLevel 0\n#program activationAmount 0\nlong table[20];\nvoid main (void) { const long a = 0; while (true) { table[a] = fibbonacci(a); halt; a++; } }\nlong fibbonacci(long n) { if(n == 0){ return 0; } else if(n == 1) { return 1; } else { return (fibbonacci(n-1) + fibbonacci(n-2)); } }\nvoid catch(void) { long a++; }'
        const assembly = '^program activationAmount 0\n^declare r0\n^declare r1\n^declare r2\n^declare table\n^const SET @table #0000000000000004\n^declare table_0\n^declare table_1\n^declare table_2\n^declare table_3\n^declare table_4\n^declare table_5\n^declare table_6\n^declare table_7\n^declare table_8\n^declare table_9\n^declare table_10\n^declare table_11\n^declare table_12\n^declare table_13\n^declare table_14\n^declare table_15\n^declare table_16\n^declare table_17\n^declare table_18\n^declare table_19\n^declare main_a\n^declare fibbonacci_n\n^declare catch_a\n\nERR :__fn_catch\nJMP :__fn_main\n\n__fn_main:\nPCS\n^const SET @main_a #0000000000000000\n__loop1_continue:\n__loop1_start:\nSET @fibbonacci_n $main_a\nJSR :__fn_fibbonacci\nSET @r0 $r0\nSET @($table + $main_a) $r0\nSTP\nINC @main_a\nJMP :__loop1_continue\n__loop1_break:\nFIN\n\n__fn_fibbonacci:\nBNZ $fibbonacci_n :__if2_else\n__if2_start:\nCLR @r0\nSET @r0 $r0\nRET\nJMP :__if2_endif\n__if2_else:\nSET @r0 #0000000000000001\nBNE $fibbonacci_n $r0 :__if3_else\n__if3_start:\nSET @r0 #0000000000000001\nSET @r0 $r0\nRET\nJMP :__if3_endif\n__if3_else:\nPSH $fibbonacci_n\nSET @r0 $fibbonacci_n\nDEC @r0\nSET @fibbonacci_n $r0\nJSR :__fn_fibbonacci\nSET @r0 $r0\nPOP @fibbonacci_n\nPSH $fibbonacci_n\nSET @r1 $fibbonacci_n\nSET @r2 #0000000000000002\nSUB @r1 $r2\nSET @fibbonacci_n $r1\nPSH $r0\nJSR :__fn_fibbonacci\nSET @r1 $r0\nPOP @r0\nPOP @fibbonacci_n\nADD @r0 $r1\nSET @r0 $r0\nRET\n__if3_endif:\n__if2_endif:\nRET\n\n__fn_catch:\nPCS\nINC @catch_a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: catch() and no main function', () => {
        const code = '#pragma optimizationLevel 0\nlong b, a = 0; while (true) { a++; } void catch() { long a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare b\n^declare a\n^declare catch_a\n\nERR :__fn_catch\nCLR @a\n__loop1_continue:\n__loop1_start:\nINC @a\nJMP :__loop1_continue\n__loop1_break:\nFIN\n\n__fn_catch:\nPCS\nINC @catch_a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: catch() with return statement', () => {
        const code = '#pragma optimizationLevel 0\nlong b, a = 0; void catch(void) { if (a) return; a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare b\n^declare a\n\nERR :__fn_catch\nCLR @a\nFIN\n\n__fn_catch:\nPCS\nBZR $a :__if1_endif\n__if1_start:\nFIN\n__if1_endif:\nINC @a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: using main retuning something', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a; long main(void) { return a; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})

describe('User defined functions', () => {
    it('should compile: void fun() with return at end', () => {
        const code = '#pragma optimizationLevel 0\nlong a; void test(void) { a++; return; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nFIN\n\n__fn_test:\nINC @a\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: void fun() with return at middle', () => {
        const code = '#pragma optimizationLevel 0\nlong a; void test(void) { a++; return; a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nFIN\n\n__fn_test:\nINC @a\nRET\nINC @a\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: calling void fun()', () => {
        const code = '#pragma optimizationLevel 0\nlong a; test(); void test(void) { a++; return; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nJSR :__fn_test\nFIN\n\n__fn_test:\nINC @a\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: getting return value of void fun()', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a; a=test(); void test(void) { a++; return; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Conditionals with void fun()', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a; if (test()) a++; void test(void) {}'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: definition: fun(argument)', () => {
        const code = '#pragma optimizationLevel 0\nlong a; void test2(long b) { b++; return; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare test2_b\n\nFIN\n\n__fn_test2:\nINC @test2_b\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: passing values in argument', () => {
        const code = '#pragma optimizationLevel 0\nlong a; long test2(long b) { b++; return b; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare test2_b\n\nFIN\n\n__fn_test2:\nINC @test2_b\nSET @r0 $test2_b\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: passing values and getting return value', () => {
        const code = '#pragma optimizationLevel 0\nlong a=0; a=test2(a); long test2(long b) { b++; return b; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare test2_b\n\nCLR @a\nSET @test2_b $a\nJSR :__fn_test2\nSET @r0 $r0\nSET @a $r0\nFIN\n\n__fn_test2:\nINC @test2_b\nSET @r0 $test2_b\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Ununsed function after main() (unreacheable code)', () => {
        const code = '#pragma optimizationLevel 0\nlong a=0; void main(void){ a++; test2(a); exit; } void test2(long b) { b++; return; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare test2_b\n\nCLR @a\nJMP :__fn_main\n\n__fn_main:\nPCS\nINC @a\nSET @test2_b $a\nJSR :__fn_test2\nFIN\n\n__fn_test2:\nINC @test2_b\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: two functions with same name', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a=0; long b; a++; void test(void) { a++; } long tt(void) { a++;} long test(void) {a++; return a; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: function returning long_ptr', () => {
        const code = '#pragma optimizationLevel 0\nlong *a; a=test(); long *test(void) { long b; return &b; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare test_b\n\nJSR :__fn_test\nSET @a $r0\nFIN\n\n__fn_test:\nSET @r0 #0000000000000004\nSET @r0 $r0\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: function returning long_ptr assigned to long var', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a; a=test(); long *test(void) { long b; return &b; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: long_ptr functions trying to return long var', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong *a; a=test(); long *test(void) { long b; return b; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: return void in functions with return type', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\ntest(); long test(void) { return; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: return value in functions with return void', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\ntest(); void test(void) { return 5; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: function returning struct', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nstruct KOMBI { long driver; long collector; long passenger; } car, car2; car = teste(); struct KOMBI teste(void){ return car; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: wrong variable types on function arguments', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a, b; teste(a, b); void teste(long *fa, long fb) { fb++; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: check variable types on function arguments', () => {
        const code = '#pragma optimizationLevel 0\nlong * a, b; teste(a, b); void teste(long *fa, long fb) { fb++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare teste_fa\n^declare teste_fb\n\nSET @teste_fb $b\nSET @teste_fa $a\nJSR :__fn_teste\nFIN\n\n__fn_teste:\nINC @teste_fb\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: check variable types on function arguments', () => {
        const code = '#pragma optimizationLevel 0\nlong * a, b; teste(a, *a); void teste(long *fa, long fb) { fb++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare teste_fa\n^declare teste_fb\n\nSET @teste_fb $($a)\nSET @teste_fa $a\nJSR :__fn_teste\nFIN\n\n__fn_teste:\nINC @teste_fb\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: check variable types on function arguments', () => {
        const code = '#pragma optimizationLevel 0\nlong * a, b; teste(&b, b); void teste(long *fa, long fb) { fb++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare teste_fa\n^declare teste_fb\n\nSET @teste_fb $b\nSET @teste_fa #0000000000000004\nJSR :__fn_teste\nFIN\n\n__fn_teste:\nINC @teste_fb\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: pass two struct pointer as argument', () => {
        const code = '#pragma optimizationLevel 0\nstruct KOMBI { long driver, collector, passenger; } car1, car2; long a, b; test(&car1, &car2); void test(struct KOMBI * lptr, struct KOMBI * rptr) { lptr-> driver = rptr-> driver; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car1_driver\n^declare car1_collector\n^declare car1_passenger\n^declare car2_driver\n^declare car2_collector\n^declare car2_passenger\n^declare a\n^declare b\n^declare test_lptr\n^declare test_rptr\n\nSET @test_rptr #0000000000000006\nSET @test_lptr #0000000000000003\nJSR :__fn_test\nFIN\n\n__fn_test:\nSET @r0 $($test_rptr)\nSET @($test_lptr) $r0\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: pass struct pointer as second argument', () => {
        const code = '#pragma optimizationLevel 0\nstruct KOMBI { long driver, collector, passenger; } car; long a, b; test(a, &car); void test(long a, struct KOMBI * sptr) { sptr-> driver = a; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^declare a\n^declare b\n^declare test_a\n^declare test_sptr\n\nSET @test_sptr #0000000000000003\nSET @test_a $a\nJSR :__fn_test\nFIN\n\n__fn_test:\nSET @($test_sptr) $test_a\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: pass struct by value as second argument', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nstruct KOMBI { long driver, collector, passenger; } car; long a, b; test(a, car); void test(long a, struct KOMBI sptr) { sptr. driver = a; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: wrong variable types on function arguments', () => {
        expect(() => {
            const code = "#pragma optimizationLevel 0\nstruct KOMBI { long driver; long collector; long passenger; } ;struct KOMBI car, *pcar;long a, b;pcar=&car;\n teste(car);\n void teste(struct KOMBI * value) { value->driver = 'Zé'; }"
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: check variable types on function arguments', () => {
        const code = "#pragma optimizationLevel 0\nstruct KOMBI { long driver; long collector; long passenger; } ;struct KOMBI car, *pcar;long a, b;pcar=&car;\n teste(pcar);\n void teste(struct KOMBI * value) { value->driver = 'Zé'; }"
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^declare pcar\n^declare a\n^declare b\n^declare teste_value\n\nSET @pcar #0000000000000003\nSET @teste_value $pcar\nJSR :__fn_teste\nFIN\n\n__fn_teste:\nSET @r0 #0000000000a9c35a\nSET @($teste_value) $r0\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Passing long inside struct (with offset)', () => {
        const code = '#pragma optimizationLevel 0\nstruct KOMBI { long driver; long collector; long passenger; } ;struct KOMBI car[2]; long a;\nteste(car[a].collector);\n void teste(long value) { value++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^declare a\n^declare teste_value\n\nSET @r0 #0000000000000003\nMUL @r0 $a\nINC @r0\nSET @teste_value $($car + $r0)\nJSR :__fn_teste\nFIN\n\n__fn_teste:\nINC @teste_value\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Support SetUnaryOperator in struct members', () => {
        const code = '#pragma optimizationLevel 0\nstruct KOMBI { long driver; long collector; long passenger[4]; } car; long a, b; ++car.driver; a=car.collector++;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^const SET @car_passenger #0000000000000006\n^declare car_passenger_0\n^declare car_passenger_1\n^declare car_passenger_2\n^declare car_passenger_3\n^declare a\n^declare b\n\nINC @car_driver\nSET @a $car_collector\nINC @car_collector\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: Support SetUnaryOperator in struct members, but not if it is an array', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nstruct KOMBI { long driver; long collector; long passenger[4]; } car; long a, b; ++car.passenger[a]; '
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: Function returning struct pointer', () => {
        const code = '#pragma optimizationLevel 0\nstruct KOMBI { long driver, collector, passenger; } *val; val = teste(); val = test2(); struct KOMBI *teste(void) { struct KOMBI tt2; return &tt2; } struct KOMBI *test2(void) { struct KOMBI *stt2; return stt2; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare val\n^declare teste_tt2_driver\n^declare teste_tt2_collector\n^declare teste_tt2_passenger\n^declare test2_stt2\n\nJSR :__fn_teste\nSET @r0 $r0\nSET @val $r0\nJSR :__fn_test2\nSET @r0 $r0\nSET @val $r0\nFIN\n\n__fn_teste:\nSET @r0 #0000000000000004\nSET @r0 $r0\nRET\n\n__fn_test2:\nSET @r0 $test2_stt2\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: Error check Function return pointer', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nstruct KOMBI { long driver, collector, passenger; } *val; val = teste(); struct KOMBI *teste(void) { struct KOMBI tt2; return tt2; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: Recursive functions', () => {
        const code = '#pragma optimizationLevel 0\nlong a; long counter = 0; a = fibbonacci(12); \nlong fibbonacci(long n) {if(n == 0){ return 0; } else if(n == 1) { return 1; } else { return (fibbonacci(n-1) + fibbonacci(n-2)); } }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare counter\n^declare fibbonacci_n\n\nCLR @counter\nSET @fibbonacci_n #000000000000000c\nJSR :__fn_fibbonacci\nSET @a $r0\nFIN\n\n__fn_fibbonacci:\nBNZ $fibbonacci_n :__if1_else\n__if1_start:\nCLR @r0\nSET @r0 $r0\nRET\nJMP :__if1_endif\n__if1_else:\nSET @r0 #0000000000000001\nBNE $fibbonacci_n $r0 :__if2_else\n__if2_start:\nSET @r0 #0000000000000001\nSET @r0 $r0\nRET\nJMP :__if2_endif\n__if2_else:\nPSH $fibbonacci_n\nSET @r0 $fibbonacci_n\nDEC @r0\nSET @fibbonacci_n $r0\nJSR :__fn_fibbonacci\nSET @r0 $r0\nPOP @fibbonacci_n\nPSH $fibbonacci_n\nSET @r1 $fibbonacci_n\nSET @r2 #0000000000000002\nSUB @r1 $r2\nSET @fibbonacci_n $r1\nPSH $r0\nJSR :__fn_fibbonacci\nSET @r1 $r0\nPOP @r0\nPOP @fibbonacci_n\nADD @r0 $r1\nSET @r0 $r0\nRET\n__if2_endif:\n__if1_endif:\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: function with void_ptr arguments and return', () => {
        const code = `#pragma optimizationLevel 0\nstruct KOMBI { long driver; long collector; long passenger; } *pstruct; long *plong; void * pvoid;
teste(pvoid, pvoid); teste(pvoid, pstruct); plong = ret(pvoid, plong); pstruct = ret(pvoid, plong);
void teste( long *aa, void *bb) { aa++, bb++; }
void *ret(long *aa, void *bb) { aa++; return aa; }`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare pstruct\n^declare plong\n^declare pvoid\n^declare teste_aa\n^declare teste_bb\n^declare ret_aa\n^declare ret_bb\n\nSET @teste_bb $pvoid\nSET @teste_aa $pvoid\nJSR :__fn_teste\nSET @teste_bb $pstruct\nSET @teste_aa $pvoid\nJSR :__fn_teste\nSET @ret_bb $plong\nSET @ret_aa $pvoid\nJSR :__fn_ret\nSET @r0 $r0\nSET @plong $r0\nSET @ret_bb $plong\nSET @ret_aa $pvoid\nJSR :__fn_ret\nSET @r0 $r0\nSET @pstruct $r0\nFIN\n\n__fn_teste:\nINC @teste_aa\nINC @teste_bb\nRET\n\n__fn_ret:\nINC @ret_aa\nSET @r0 $ret_aa\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: function returning NULL pointer, return of long_ptr at function returning void pointer, Assign this return value to a long_ptr', () => {
        const code = '#pragma optimizationLevel 0\nlong *plong; plong = malloc(); void *malloc(void) { if (current >=20) { return NULL; } long current++; long mem[20]; return (&mem[current]); }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare plong\n^declare malloc_current\n^declare malloc_mem\n^const SET @malloc_mem #0000000000000006\n^declare malloc_mem_0\n^declare malloc_mem_1\n^declare malloc_mem_2\n^declare malloc_mem_3\n^declare malloc_mem_4\n^declare malloc_mem_5\n^declare malloc_mem_6\n^declare malloc_mem_7\n^declare malloc_mem_8\n^declare malloc_mem_9\n^declare malloc_mem_10\n^declare malloc_mem_11\n^declare malloc_mem_12\n^declare malloc_mem_13\n^declare malloc_mem_14\n^declare malloc_mem_15\n^declare malloc_mem_16\n^declare malloc_mem_17\n^declare malloc_mem_18\n^declare malloc_mem_19\n\nJSR :__fn_malloc\nSET @plong $r0\nFIN\n\n__fn_malloc:\nSET @r0 #0000000000000014\nBLT $malloc_current $r0 :__if1_endif\n__if1_start:\nCLR @r0\nSET @r0 $r0\nRET\n__if1_endif:\nINC @malloc_current\nSET @r0 $malloc_mem\nADD @r0 $malloc_current\nSET @r0 $r0\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: Wrong arguments', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a, b; test(); void test() { c++; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Wrong arguments', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a, b; test(b); void test(d++) { long c; c++; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Wrong arguments', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a, b; test(b, a); void test(d) { long c; c++; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Wrong arguments', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a, b; test(b); void test(d; a) { long c; c++; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Wrong arguments', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a, test_b; test(a); void test(long b) { long c; c++; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Wrong arguments quantity', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nlong a, b; test(b, a); void test(long c) { }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})
