import { SmartC } from '../smartc'

describe('structs definiton and members', () => {
    it('should compile: simple struct', () => {
        const code = `struct KOMBI { long driver; long collector; long passenger; } car;
long a, b, *c, d[2];\n
car.passenger="Ze";
car.passenger=a;
car.passenger=*c;
car.passenger=d[1];
car.passenger=d[a];
car.passenger=car.collector;\n
a=car.driver;
*c=car.driver;
d[1]=car.driver;
d[a]=car.driver;`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #000000000000000a\n^declare d_0\n^declare d_1\n\nSET @car_passenger #000000000000655a\nSET @car_passenger $a\nSET @car_passenger $($c)\nSET @car_passenger $d_1\nSET @car_passenger $($d + $a)\nSET @car_passenger $car_collector\nSET @a $car_driver\nSET @($c) $car_driver\nSET @d_1 $car_driver\nSET @($d + $a) $car_driver\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: array of structs (constant notation)', () => {
        const code = `struct KOMBI { long driver; long collector; long passenger; } car[3];
long a, b, *c, d[2];\n
car[1].passenger='Ze';
car[1].passenger=a;
car[1].passenger=*c;
car[1].passenger=d[1];
car[1].passenger=d[a];
car[1].passenger=car[2].collector;\n
a=car[1].driver;
*c=car[1].driver;
d[1]=car[1].driver;
d[a]=car[1].driver;`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^declare car_2_driver\n^declare car_2_collector\n^declare car_2_passenger\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000011\n^declare d_0\n^declare d_1\n\nSET @car_1_passenger #000000000000655a\nSET @car_1_passenger $a\nSET @car_1_passenger $($c)\nSET @car_1_passenger $d_1\nSET @car_1_passenger $($d + $a)\nSET @car_1_passenger $car_2_collector\nSET @a $car_1_driver\nSET @($c) $car_1_driver\nSET @d_1 $car_1_driver\nSET @($d + $a) $car_1_driver\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: array of structs (variable notation) on rigth side', () => {
        const code = `struct KOMBI { long driver; long collector; long passenger; } car[3];
long a, b, *c, d[2];\n
car[a].passenger='Ze';
car[a].passenger=a;
car[a].passenger=*c;
car[a].passenger=d[1];
car[a].passenger=d[a];
car[a].passenger=car[2].collector;
car[a].passenger=car[b].collector;`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^declare car_2_driver\n^declare car_2_collector\n^declare car_2_passenger\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000011\n^declare d_0\n^declare d_1\n\nSET @r0 #0000000000000003\nMUL @r0 $a\nINC @r0\nINC @r0\nSET @r1 #000000000000655a\nSET @($car + $r0) $r1\nSET @r0 #0000000000000003\nMUL @r0 $a\nINC @r0\nINC @r0\nSET @($car + $r0) $a\nSET @r0 #0000000000000003\nMUL @r0 $a\nINC @r0\nINC @r0\nSET @r1 $($c)\nSET @($car + $r0) $r1\nSET @r0 #0000000000000003\nMUL @r0 $a\nINC @r0\nINC @r0\nSET @($car + $r0) $d_1\nSET @r0 #0000000000000003\nMUL @r0 $a\nINC @r0\nINC @r0\nSET @r1 $($d + $a)\nSET @($car + $r0) $r1\nSET @r0 #0000000000000003\nMUL @r0 $a\nINC @r0\nINC @r0\nSET @($car + $r0) $car_2_collector\nSET @r0 #0000000000000003\nMUL @r0 $a\nINC @r0\nINC @r0\nSET @r1 #0000000000000003\nMUL @r1 $b\nINC @r1\nSET @r2 $($car + $r1)\nSET @($car + $r0) $r2\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: array of structs (variable notation) on left side', () => {
        const code = `struct KOMBI { long driver; long collector; long passenger; } car[3];
long a, b, *c, d[2];\n
a=car[b].driver;
*c=car[b].driver;
d[1]=car[b].driver;
d[a]=car[b].driver;`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^declare car_2_driver\n^declare car_2_collector\n^declare car_2_passenger\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000011\n^declare d_0\n^declare d_1\n\nSET @a #0000000000000003\nMUL @a $b\nSET @a $($car + $a)\nSET @r0 #0000000000000003\nMUL @r0 $b\nSET @r1 $($car + $r0)\nSET @($c) $r1\nSET @d_1 #0000000000000003\nMUL @d_1 $b\nSET @d_1 $($car + $d_1)\nSET @r0 #0000000000000003\nMUL @r0 $b\nSET @r1 $($car + $r0)\nSET @($d + $a) $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: struct with array member (constant notation)', () => {
        const code = `struct KOMBI { long driver; long collector; long passenger[4]; } car;
long a, b, *c, d[2];\n
car.passenger[1]='Ze';
car.passenger[1]=a;
car.passenger[1]=*c;
car.passenger[1]=d[1];
car.passenger[1]=d[a];
car.passenger[1]=car.driver;
car.passenger[1]=car.passenger[2];\n
a=car.passenger[3];
*c=car.passenger[3];
d[1]=car.passenger[3];
d[a]=car.passenger[3];`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^const SET @car_passenger #0000000000000006\n^declare car_passenger_0\n^declare car_passenger_1\n^declare car_passenger_2\n^declare car_passenger_3\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #000000000000000e\n^declare d_0\n^declare d_1\n\nSET @car_passenger_1 #000000000000655a\nSET @car_passenger_1 $a\nSET @car_passenger_1 $($c)\nSET @car_passenger_1 $d_1\nSET @car_passenger_1 $($d + $a)\nSET @car_passenger_1 $car_driver\nSET @car_passenger_1 $car_passenger_2\nSET @a $car_passenger_3\nSET @($c) $car_passenger_3\nSET @d_1 $car_passenger_3\nSET @($d + $a) $car_passenger_3\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: struct with array member (variable notation', () => {
        const code = `struct KOMBI { long driver; long collector; long passenger[4]; } car;
long a, b, *c, d[2];\n
car.passenger[a]='Ze';
car.passenger[a]=a;
car.passenger[a]=*c;
car.passenger[a]=d[1];
car.passenger[a]=d[a];
car.passenger[a]=car.driver;
car.passenger[a]=car.passenger[b];\n
a=car.passenger[b];
*c=car.passenger[b];
d[1]=car.passenger[b];
d[a]=car.passenger[b];`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^const SET @car_passenger #0000000000000006\n^declare car_passenger_0\n^declare car_passenger_1\n^declare car_passenger_2\n^declare car_passenger_3\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #000000000000000e\n^declare d_0\n^declare d_1\n\nSET @r0 #000000000000655a\nSET @($car_passenger + $a) $r0\nSET @($car_passenger + $a) $a\nSET @r0 $($c)\nSET @($car_passenger + $a) $r0\nSET @($car_passenger + $a) $d_1\nSET @r0 $($d + $a)\nSET @($car_passenger + $a) $r0\nSET @($car_passenger + $a) $car_driver\nSET @r0 $($car_passenger + $b)\nSET @($car_passenger + $a) $r0\nSET @a $($car_passenger + $b)\nSET @r0 $($car_passenger + $b)\nSET @($c) $r0\nSET @d_1 $($car_passenger + $b)\nSET @r0 $($car_passenger + $b)\nSET @($d + $a) $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: array of struct with array member (both constant notation', () => {
        const code = `struct KOMBI { long driver; long collector; long passenger[4]; } car[2];
long a, b, *c, d[2];\n
car[1].passenger[2]='Ze';
car[1].passenger[2]=a;
car[1].passenger[2]=*c;
car[1].passenger[2]=d[1];
car[1].passenger[2]=d[a];
car[1].passenger[2]=car[0].driver;
car[1].passenger[2]=car[0].passenger[3];\n
a=car[1].passenger[3];
*c=car[1].passenger[3];
d[1]=car[1].passenger[3];
d[a]=car[1].passenger[3];`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^const SET @car_0_passenger #0000000000000007\n^declare car_0_passenger_0\n^declare car_0_passenger_1\n^declare car_0_passenger_2\n^declare car_0_passenger_3\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^const SET @car_1_passenger #000000000000000e\n^declare car_1_passenger_0\n^declare car_1_passenger_1\n^declare car_1_passenger_2\n^declare car_1_passenger_3\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000016\n^declare d_0\n^declare d_1\n\nSET @car_1_passenger_2 #000000000000655a\nSET @car_1_passenger_2 $a\nSET @car_1_passenger_2 $($c)\nSET @car_1_passenger_2 $d_1\nSET @car_1_passenger_2 $($d + $a)\nSET @car_1_passenger_2 $car_0_driver\nSET @car_1_passenger_2 $car_0_passenger_3\nSET @a $car_1_passenger_3\nSET @($c) $car_1_passenger_3\nSET @d_1 $car_1_passenger_3\nSET @($d + $a) $car_1_passenger_3\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: array of struct with array member (struct contant notation and member variable notation', () => {
        const code = `struct KOMBI { long driver; long collector; long passenger[4]; } car[2];
long a, b, *c, d[2];\n
car[1].passenger[a]='Ze';
car[1].passenger[a]=a;
car[1].passenger[a]=*c;
car[1].passenger[a]=d[1];
car[1].passenger[a]=d[a];
car[1].passenger[a]=car[0].driver;
car[1].passenger[a]=car[0].passenger[b];\n
a=car[1].passenger[b];
*c=car[1].passenger[b];
d[1]=car[1].passenger[b];
d[a]=car[1].passenger[b];`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^const SET @car_0_passenger #0000000000000007\n^declare car_0_passenger_0\n^declare car_0_passenger_1\n^declare car_0_passenger_2\n^declare car_0_passenger_3\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^const SET @car_1_passenger #000000000000000e\n^declare car_1_passenger_0\n^declare car_1_passenger_1\n^declare car_1_passenger_2\n^declare car_1_passenger_3\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000016\n^declare d_0\n^declare d_1\n\nSET @r0 #000000000000655a\nSET @($car_1_passenger + $a) $r0\nSET @($car_1_passenger + $a) $a\nSET @r0 $($c)\nSET @($car_1_passenger + $a) $r0\nSET @($car_1_passenger + $a) $d_1\nSET @r0 $($d + $a)\nSET @($car_1_passenger + $a) $r0\nSET @($car_1_passenger + $a) $car_0_driver\nSET @r0 $($car_0_passenger + $b)\nSET @($car_1_passenger + $a) $r0\nSET @a $($car_1_passenger + $b)\nSET @r0 $($car_1_passenger + $b)\nSET @($c) $r0\nSET @d_1 $($car_1_passenger + $b)\nSET @r0 $($car_1_passenger + $b)\nSET @($d + $a) $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: array of struct with array member (both variable notation', () => {
        const code = `struct KOMBI { long driver; long collector; long passenger[4]; } car[2];
long a, b, *c, d[2];\n
car[b].passenger[a]='Ze';
car[b].passenger[a]=a;
car[b].passenger[a]=*c;
car[b].passenger[a]=d[1];
car[b].passenger[a]=d[a];
car[b].passenger[a]=car[b].driver;
car[b].passenger[a]=car[b].passenger[b];\n
a=car[a].passenger[b];
*c=car[a].passenger[b];
d[1]=car[a].passenger[b];
d[a]=car[a].passenger[b];`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^const SET @car_0_passenger #0000000000000007\n^declare car_0_passenger_0\n^declare car_0_passenger_1\n^declare car_0_passenger_2\n^declare car_0_passenger_3\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^const SET @car_1_passenger #000000000000000e\n^declare car_1_passenger_0\n^declare car_1_passenger_1\n^declare car_1_passenger_2\n^declare car_1_passenger_3\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000016\n^declare d_0\n^declare d_1\n\nSET @r0 #0000000000000007\nMUL @r0 $b\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $a\nSET @r1 #000000000000655a\nSET @($car + $r0) $r1\nSET @r0 #0000000000000007\nMUL @r0 $b\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $a\nSET @($car + $r0) $a\nSET @r0 #0000000000000007\nMUL @r0 $b\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $a\nSET @r1 $($c)\nSET @($car + $r0) $r1\nSET @r0 #0000000000000007\nMUL @r0 $b\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $a\nSET @($car + $r0) $d_1\nSET @r0 #0000000000000007\nMUL @r0 $b\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $a\nSET @r1 $($d + $a)\nSET @($car + $r0) $r1\nSET @r0 #0000000000000007\nMUL @r0 $b\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $a\nSET @r1 #0000000000000007\nMUL @r1 $b\nSET @r2 $($car + $r1)\nSET @($car + $r0) $r2\nSET @r0 #0000000000000007\nMUL @r0 $b\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $a\nSET @r1 #0000000000000007\nMUL @r1 $b\nSET @r2 #0000000000000003\nADD @r1 $r2\nADD @r1 $b\nSET @r2 $($car + $r1)\nSET @($car + $r0) $r2\nSET @r0 #0000000000000007\nMUL @r0 $a\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $b\nSET @a $($car + $r0)\nSET @r0 #0000000000000007\nMUL @r0 $a\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $b\nSET @r1 $($car + $r0)\nSET @($c) $r1\nSET @d_1 #0000000000000007\nMUL @d_1 $a\nSET @r0 #0000000000000003\nADD @d_1 $r0\nADD @d_1 $b\nSET @d_1 $($car + $d_1)\nSET @r0 #0000000000000007\nMUL @r0 $a\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $b\nSET @r1 $($car + $r0)\nSET @($d + $a) $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Struct declaration and operations inside a function', () => {
        const code = `test();
void test(void) {
  struct KOMBI { long driver; long collector; long passenger; } car;
  long a, b, *c, d[2];
  car.passenger="Ze";
  car.passenger=a;
  car.passenger=*c;
  car.passenger=d[1];
  car.passenger=d[a];
  car.passenger=car.collector;
  a=car.driver;
  *c=car.driver;
  d[1]=car.driver;
  d[a]=car.driver;
}`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare test_car_driver\n^declare test_car_collector\n^declare test_car_passenger\n^declare test_a\n^declare test_b\n^declare test_c\n^declare test_d\n^const SET @test_d #000000000000000a\n^declare test_d_0\n^declare test_d_1\n\nJSR :__fn_test\nFIN\n\n__fn_test:\nSET @test_car_passenger #000000000000655a\nSET @test_car_passenger $test_a\nSET @test_car_passenger $($test_c)\nSET @test_car_passenger $test_d_1\nSET @test_car_passenger $($test_d + $test_a)\nSET @test_car_passenger $test_car_collector\nSET @test_a $test_car_driver\nSET @($test_c) $test_car_driver\nSET @test_d_1 $test_car_driver\nSET @($test_d + $test_a) $test_car_driver\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})

describe('structs definiton and members Wrong usage', () => {
    test('should throw: Using member in long variable', () => {
        expect(() => {
            const code = 'struct KOMBI { long driver, collector, passenger; } car; long carro; carro.driver=0;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Wrong member name', () => {
        expect(() => {
            const code = 'struct KOMBI { long driver, collector, passenger; } car; car.nobody=0;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Wrong member notation', () => {
        expect(() => {
            const code = 'struct KOMBI { long driver, collector, passenger; } car; car->driver=0;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Wrong member notation', () => {
        expect(() => {
            const code = 'struct KOMBI { long driver, collector, passenger; } *car; car.driver=0;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Trying to reassing a array in struct', () => {
        expect(() => {
            const code = 'struct KOMBI { long driver, collector[4]; } car; long *b; car.collector=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Wrong struct instruction', () => {
        expect(() => {
            const code = 'long a; struct { long b; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: incomplete sentence', () => {
        expect(() => {
            const code = 'struct 2 f; long a;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: incomplete sentence', () => {
        expect(() => {
            const code = 'struct 2 && { long a; };'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: missing ; to end struct', () => {
        expect(() => {
            const code = 'struct KOMBI { long a; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: unexpected , in definition', () => {
        expect(() => {
            const code = 'struct KOMBI , long a;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: unexpected UnaryOperator in definition', () => {
        expect(() => {
            const code = 'struct KOMBI { long driver, collector[4]; }; struct KOMBI &car; long *b; car.collector=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: unexpected value in definition', () => {
        expect(() => {
            const code = 'struct KOMBI { long driver, collector[4]; }; struct KOMBI ++ car; long *b; car.collector=b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Other types of sentence inside members declaration', () => {
        expect(() => {
            const code = 'long a; struct KOMBI { long driver; if (a) a++; } car;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})
