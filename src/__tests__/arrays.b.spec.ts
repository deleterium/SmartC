import { SmartC } from '../smartc'

describe('Multi dimensional Arrays assignment (left side)', () => {
    it('should compile: constants', () => {
        const code = 'long a[4][2]; a[2][1]=0;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n\nCLR @a_5\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: variable+constants', () => {
        const code = 'long a[4][2]; long b; a[b][1]=0;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n\nSET @r0 #0000000000000002\nMUL @r0 $b\nINC @r0\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: variable+zero', () => {
        const code = 'long a[4][2]; long b; a[b][0]=0;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n\nSET @r0 #0000000000000002\nMUL @r0 $b\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: zero+variable', () => {
        const code = 'long a[4][2]; long b; a[0][b]=0;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n\nCLR @r0\nSET @($a + $b) $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: constant+variable', () => {
        const code = 'long a[4][2]; long b; a[1][b]=0;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n\nSET @r0 $b\nINC @r0\nINC @r0\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: 3-D constant', () => {
        const code = 'long a[3][3][3]; long b; long c; a[1][2][2]=0;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare a_8\n^declare a_9\n^declare a_10\n^declare a_11\n^declare a_12\n^declare a_13\n^declare a_14\n^declare a_15\n^declare a_16\n^declare a_17\n^declare a_18\n^declare a_19\n^declare a_20\n^declare a_21\n^declare a_22\n^declare a_23\n^declare a_24\n^declare a_25\n^declare a_26\n^declare b\n^declare c\n\nCLR @a_17\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: 3D constant+variable', () => {
        const code = 'long a[3][3][3]; long b; long c; a[1][2][b]=0;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare a_8\n^declare a_9\n^declare a_10\n^declare a_11\n^declare a_12\n^declare a_13\n^declare a_14\n^declare a_15\n^declare a_16\n^declare a_17\n^declare a_18\n^declare a_19\n^declare a_20\n^declare a_21\n^declare a_22\n^declare a_23\n^declare a_24\n^declare a_25\n^declare a_26\n^declare b\n^declare c\n\nSET @r0 $b\nSET @r1 #000000000000000f\nADD @r0 $r1\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: 3D constant+variable', () => {
        const code = 'long a[3][3][3]; long b; long c; a[1][b][2]=0;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare a_8\n^declare a_9\n^declare a_10\n^declare a_11\n^declare a_12\n^declare a_13\n^declare a_14\n^declare a_15\n^declare a_16\n^declare a_17\n^declare a_18\n^declare a_19\n^declare a_20\n^declare a_21\n^declare a_22\n^declare a_23\n^declare a_24\n^declare a_25\n^declare a_26\n^declare b\n^declare c\n\nSET @r0 $b\nSET @r1 #0000000000000003\nMUL @r0 $r1\nSET @r1 #0000000000000009\nADD @r0 $r1\nINC @r0\nINC @r0\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: 3D constant+variable', () => {
        const code = 'long a[3][3][3]; long b; long c; a[b][2][2]=0;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare a_8\n^declare a_9\n^declare a_10\n^declare a_11\n^declare a_12\n^declare a_13\n^declare a_14\n^declare a_15\n^declare a_16\n^declare a_17\n^declare a_18\n^declare a_19\n^declare a_20\n^declare a_21\n^declare a_22\n^declare a_23\n^declare a_24\n^declare a_25\n^declare a_26\n^declare b\n^declare c\n\nSET @r0 #0000000000000009\nMUL @r0 $b\nSET @r1 #0000000000000006\nADD @r0 $r1\nINC @r0\nINC @r0\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: 3D variable', () => {
        const code = 'long a[3][3][3]; long b; long c; a[b][b][b]=0;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare a_8\n^declare a_9\n^declare a_10\n^declare a_11\n^declare a_12\n^declare a_13\n^declare a_14\n^declare a_15\n^declare a_16\n^declare a_17\n^declare a_18\n^declare a_19\n^declare a_20\n^declare a_21\n^declare a_22\n^declare a_23\n^declare a_24\n^declare a_25\n^declare a_26\n^declare b\n^declare c\n\nSET @r0 #0000000000000009\nMUL @r0 $b\nSET @r1 $b\nSET @r2 #0000000000000003\nMUL @r1 $r2\nADD @r0 $r1\nADD @r0 $b\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})

describe('Multi dimensional Arrays assignment (right side)', () => {
    it('should compile: 2D address of item', () => {
        const code = 'long a[4][2], *b, c,d; b=&a[c][d];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n^declare c\n^declare d\n\nSET @r0 #0000000000000002\nMUL @r0 $c\nADD @r0 $d\nSET @b $a\nADD @b $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: 2D both sides of assignment', () => {
        const code = 'long a[4][2]; long b; a[1][b]=a[b][1];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n\nSET @r0 $b\nINC @r0\nINC @r0\nSET @r1 #0000000000000002\nMUL @r1 $b\nINC @r1\nSET @r2 $($a + $r1)\nSET @($a + $r0) $r2\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: registers on index', () => {
        const code = 'long a[5][5]; long b, c; c+=a[b+3][b+4];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare a_8\n^declare a_9\n^declare a_10\n^declare a_11\n^declare a_12\n^declare a_13\n^declare a_14\n^declare a_15\n^declare a_16\n^declare a_17\n^declare a_18\n^declare a_19\n^declare a_20\n^declare a_21\n^declare a_22\n^declare a_23\n^declare a_24\n^declare b\n^declare c\n\nSET @r0 #0000000000000003\nADD @r0 $b\nSET @r1 #0000000000000005\nMUL @r0 $r1\nSET @r1 #0000000000000004\nADD @r1 $b\nADD @r0 $r1\nSET @r1 $($a + $r0)\nADD @c $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: constant + registers on index', () => {
        const code = 'long a[5][5]; long b, c; c+=a[3][b+4];'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare a_8\n^declare a_9\n^declare a_10\n^declare a_11\n^declare a_12\n^declare a_13\n^declare a_14\n^declare a_15\n^declare a_16\n^declare a_17\n^declare a_18\n^declare a_19\n^declare a_20\n^declare a_21\n^declare a_22\n^declare a_23\n^declare a_24\n^declare b\n^declare c\n\nSET @r0 #0000000000000004\nADD @r0 $b\nSET @r1 #000000000000000f\nADD @r0 $r1\nSET @r1 $($a + $r0)\nADD @c $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: multidimensional array of structs', () => {
        const code = `#pragma optimizationLevel 0
struct BIDS {
    long sender, value;
} orderBook[3][3];
struct BIDS *pbids;
long a, b;
a = orderBook[2][1].value;
a = orderBook[b][1].value;
pbids = &orderBook[2][1];
pbids = &orderBook[b][1];
orderBook[2][1].value = a;
orderBook[b][1].value = a;`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare orderBook\n^const SET @orderBook #0000000000000004\n^declare orderBook_0_sender\n^declare orderBook_0_value\n^declare orderBook_1_sender\n^declare orderBook_1_value\n^declare orderBook_2_sender\n^declare orderBook_2_value\n^declare orderBook_3_sender\n^declare orderBook_3_value\n^declare orderBook_4_sender\n^declare orderBook_4_value\n^declare orderBook_5_sender\n^declare orderBook_5_value\n^declare orderBook_6_sender\n^declare orderBook_6_value\n^declare orderBook_7_sender\n^declare orderBook_7_value\n^declare orderBook_8_sender\n^declare orderBook_8_value\n^declare pbids\n^declare a\n^declare b\n\nSET @a $orderBook_7_value\nSET @a #0000000000000006\nMUL @a $b\nINC @a\nINC @a\nINC @a\nSET @a $($orderBook + $a)\nSET @pbids #0000000000000012\nSET @r0 #0000000000000006\nMUL @r0 $b\nINC @r0\nINC @r0\nSET @r1 $orderBook\nADD @r1 $r0\nSET @pbids $r1\nSET @orderBook_7_value $a\nSET @r0 #0000000000000006\nMUL @r0 $b\nINC @r0\nINC @r0\nINC @r0\nSET @($orderBook + $r0) $a\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})

describe('Array wrong usage:', () => {
    test('should throw: declaring array with variable size', () => {
        expect(() => {
            const code = 'long a;long b[a];'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: reassign an array', () => {
        expect(() => {
            const code = 'long a, b[2], *c; b=c;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: reassign an array inside struct', () => {
        expect(() => {
            const code = 'struct KOMBI { long driver; long collector; long passenger[2]; } car[2]; long a, *c; car[a].passenger = c;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: overflow on multi long assignment', () => {
        expect(() => {
            const code = 'long a[2]; a[]="aaaaaaaazzzzzzzzsdsd";'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})

describe('array.length property', () => {
    it('should compile: get length', () => {
        const code = 'long a, b[4], c[3][3]; struct KOMBI { long driver; long passenger[6]; } car[2]; a=b.length; a=c.length; a=car.length; a=car[1].passenger.length; a=car[a].passenger.length;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^const SET @c #000000000000000a\n^declare c_0\n^declare c_1\n^declare c_2\n^declare c_3\n^declare c_4\n^declare c_5\n^declare c_6\n^declare c_7\n^declare c_8\n^declare car\n^const SET @car #0000000000000014\n^declare car_0_driver\n^declare car_0_passenger\n^const SET @car_0_passenger #0000000000000016\n^declare car_0_passenger_0\n^declare car_0_passenger_1\n^declare car_0_passenger_2\n^declare car_0_passenger_3\n^declare car_0_passenger_4\n^declare car_0_passenger_5\n^declare car_1_driver\n^declare car_1_passenger\n^const SET @car_1_passenger #000000000000001e\n^declare car_1_passenger_0\n^declare car_1_passenger_1\n^declare car_1_passenger_2\n^declare car_1_passenger_3\n^declare car_1_passenger_4\n^declare car_1_passenger_5\n\nSET @a #0000000000000004\nSET @a #0000000000000009\nSET @a #0000000000000002\nSET @a #0000000000000006\nSET @a #0000000000000006\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Get property LENGTH of an array in a struct pointer', () => {
        const code = 'long a; struct KOMBI { long driver; long passenger[6]; } *pcar; a=pcar->passenger.length;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare pcar\n\nSET @a #0000000000000006\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: get length of pointer', () => {
        expect(() => {
            const code = 'long a, *c; a=c.length;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})
