import { SmartC } from '../smartc'

describe('Miscelaneous', () => {
    it('should compile: Modifier on Function -> arr on pointer return value', () => {
        const code = 'long valLong = teste()[1]; long *teste(void) { long message[4]; return message; }'
        const assembly =
            '^declare r0\n^declare r1\n^declare r2\n^declare valLong\n^declare teste_message\n^const SET @teste_message #0000000000000005\n^declare teste_message_0\n^declare teste_message_1\n^declare teste_message_2\n^declare teste_message_3\n\nJSR :__fn_teste\nSET @valLong $r0\nSET @r0 #0000000000000001\nSET @valLong $($valLong + $r0)\nFIN\n\n__fn_teste:\nSET @r0 $teste_message\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: void pointer assigment -> long_ptr, struct_ptr and void_ptr tests', () => {
        const code = 'struct KOMBI { long driver; long collector; long passenger; } *pstruct; long *plong; void * pvoid; pvoid = plong; plong = pvoid; pvoid = pstruct; pstruct = pvoid;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare pstruct\n^declare plong\n^declare pvoid\n\nSET @pvoid $plong\nSET @plong $pvoid\nSET @pvoid $pstruct\nSET @pstruct $pvoid\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Array of pointers and double deference', () => {
        const code = 'long a, b, *c, *d[2]; c = d[1]; a = *d[1]; a++; c = d[b]; a = *d[b]; a++; d[0]=c; *d[1]=a; a++; d[b]=c; *d[b]=a;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000007\n^declare d_0\n^declare d_1\n\nSET @c $d_1\nSET @a $d_1\nSET @a $($a)\nINC @a\nSET @c $($d + $b)\nSET @a $($d + $b)\nSET @a $($a)\nINC @a\nSET @d_0 $c\nSET @r0 $d_1\nSET @($r0) $a\nINC @a\nSET @($d + $b) $c\nSET @r0 $($d + $b)\nSET @($r0) $a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Muldimensional arrays inside structs', () => {
        const code = 'struct KOMBI { long driver, collector, passenger[3][3]; } car; long a, b, c; car.passenger[2][2]=c; car.passenger[a][2]=c; car.passenger[2][b]=c; car.passenger[a][b]=c; c=car.passenger[2][2]; c=car.passenger[a][2]; c=car.passenger[2][b]; c=car.passenger[a][b];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^const SET @car_passenger #0000000000000006\n^declare car_passenger_0\n^declare car_passenger_1\n^declare car_passenger_2\n^declare car_passenger_3\n^declare car_passenger_4\n^declare car_passenger_5\n^declare car_passenger_6\n^declare car_passenger_7\n^declare car_passenger_8\n^declare a\n^declare b\n^declare c\n\nSET @car_passenger_8 $c\nSET @r0 #0000000000000003\nMUL @r0 $a\nINC @r0\nINC @r0\nSET @($car_passenger + $r0) $c\nSET @r0 $b\nSET @r1 #0000000000000006\nADD @r0 $r1\nSET @($car_passenger + $r0) $c\nSET @r0 #0000000000000003\nMUL @r0 $a\nADD @r0 $b\nSET @($car_passenger + $r0) $c\nSET @c $car_passenger_8\nSET @c #0000000000000003\nMUL @c $a\nINC @c\nINC @c\nSET @c $($car_passenger + $c)\nSET @c $b\nSET @r0 #0000000000000006\nADD @c $r0\nSET @c $($car_passenger + $c)\nSET @c #0000000000000003\nMUL @c $a\nADD @c $b\nSET @c $($car_passenger + $c)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})

describe('Wrong code to check error safeguards', () => {
    test('should throw: unexpected }', () => {
        expect(() => {
            const code = '};'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: unexpected ]', () => {
        expect(() => {
            const code = '];'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: unexpected )', () => {
        expect(() => {
            const code = ');'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: unexpected :', () => {
        expect(() => {
            const code = 'long a;: a++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: not ending ]', () => {
        expect(() => {
            const code = 'long a[ ;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: not ending }', () => {
        expect(() => {
            const code = 'void main (void) { long a++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: not ending } (at end of file)', () => {
        expect(() => {
            const code = 'long a, b; test (b); void test(long c) {'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('Endless comment', () => {
        expect(() => {
            const code = 'long a;/*asdf'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('Endless string "', () => {
        expect(() => {
            const code = 'long a="asdf;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test("Endless '", () => {
        expect(() => {
            const code = "long a='asdf;"
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })

    test('should throw: missing comma', () => {
        expect(() => {
            const code = 'long a, b; test2() while (a) a++; long test2(void) { b++; return b; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: missing comma', () => {
        expect(() => {
            const code = 'long a, b; test2() for (;;) a++; long test2(void) { b++; return b; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: SetUnaryOperator on function', () => {
        expect(() => {
            const code = 'long a, b; test()++; a++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Modifier on function returning long', () => {
        expect(() => {
            const code = 'long a = test()[4]; void test(void) {}'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Modifier on codecave', () => {
        expect(() => {
            const code = 'long a; a = (a).length;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Operator addition on void returning function', () => {
        expect(() => {
            const code = 'long a, b; a = b + test(); void test(void) { a++; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Operator addition on void returning function', () => {
        expect(() => {
            const code = '#pragma crazy\n long a=5;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Invalid char', () => {
        expect(() => {
            const code = 'long a; a?b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Unexpected token at parser', () => {
        expect(() => {
            const code = 'long a; a\\b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Arr modifiers on constants', () => {
        expect(() => {
            const code = '2[2]=2;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Member modifiers on constants', () => {
        expect(() => {
            const code = '2.driver =="Ze";'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Invalid use of unaryOperator', () => {
        expect(() => {
            const code = '2!;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Invalid use of unaryOperator', () => {
        expect(() => {
            const code = 'a~;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Two variables in a row', () => {
        expect(() => {
            const code = 'car driver=="Ze";'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: function as modifier', () => {
        expect(() => {
            const code = 'a.a()=2;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})

describe('Warnings', () => {
    it('should compile with warning: right side of operator', () => {
        const code = 'long la=0, lb; fixed fa, fb=0.0; fa = fb - la;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare la\n^declare lb\n^declare fa\n^declare fb\n\nCLR @la\nCLR @fb\nSET @fa $fb\nSET @r0 $la\nMUL @r0 $f100000000\nSUB @fa $r0\nFIN\n'
        const warnings = "Warning: at line 1. Implicit type casting conversion on right side of operator '-'."
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
        expect(compiler.getMachineCode().Warnings).toBe(warnings)
    })
    it('should compile with warning: left side of operator', () => {
        const code = 'long la=2, lb; fixed fa, fb=0.0; fa = la - fb;\n#pragma optimizationLevel 0'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare la\n^declare lb\n^declare fa\n^declare fb\n\nSET @la #0000000000000002\nCLR @fb\nSET @fa $la\nMUL @fa $f100000000\nSUB @fa $fb\nFIN\n'
        const warnings = "Warning: at line 1. Implicit type casting conversion on left side of operator '-'."
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
        expect(compiler.getMachineCode().Warnings).toBe(warnings)
    })
    it('should compile with warning: rigth side of comparision', () => {
        const code = 'long la, lb=10; fixed fa=1.0; if(fa < lb) la=1;\n#pragma optimizationLevel 0'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare la\n^declare lb\n^declare fa\n\nSET @lb #000000000000000a\nSET @fa $f100000000\nSET @r0 $lb\nMUL @r0 $f100000000\nBGE $fa $r0 :__if1_endif\n__if1_start:\nSET @la #0000000000000001\n__if1_endif:\nFIN\n'
        const warnings = "Warning: at line 1. Implicit type casting conversion on right side of comparision '<'."
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
        expect(compiler.getMachineCode().Warnings).toBe(warnings)
    })
    it('should compile with warning: left side of comparision', () => {
        const code = 'long la=1, lb; fixed fa, fb=1.1; if(la < fb) la++;\n#pragma optimizationLevel 0\n'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare la\n^declare lb\n^declare fa\n^declare fb\n\nSET @la #0000000000000001\nSET @fb #00000000068e7780\nSET @r0 $la\nMUL @r0 $f100000000\nBGE $r0 $fb :__if1_endif\n__if1_start:\nINC @la\n__if1_endif:\nFIN\n'
        const warnings = "Warning: at line 1. Implicit type casting conversion on left side of comparision '<'."
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
        expect(compiler.getMachineCode().Warnings).toBe(warnings)
    })
    it('should compile with warning: right side of assignment', () => {
        const code = 'long la, lb; fixed fa, fb=0.0; la = fb;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare la\n^declare lb\n^declare fa\n^declare fb\n\nCLR @fb\nSET @la $fb\nDIV @la $f100000000\nFIN\n'
        const warnings = "Warning: at line 1. Implicit type casting conversion on right side of assignment '='."
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
        expect(compiler.getMachineCode().Warnings).toBe(warnings)
    })
})
