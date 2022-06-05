import utils from '../utils'

describe('codeGenerator utils functions (long)', () => {
    it('should calculate: addConstants long, long', () => {
        expect(utils.addConstants(
            { value: '000a000', declaration: 'long' },
            { value: 'aaa0aaa', declaration: 'long' }
        )).toStrictEqual({ value: 0xaaaaaaan, declaration: 'long' })
        expect(utils.addConstants(
            { value: 139840123, declaration: 'long' },
            { value: 93364483, declaration: 'long' }
        )).toStrictEqual({ value: 0xde66b7en, declaration: 'long' })
        expect(utils.addConstants(
            { value: 'fffffffffffffff6', declaration: 'long' },
            { value: 20, declaration: 'long' }
        )).toStrictEqual({ value: 0xan, declaration: 'long' })
    })
    it('should calculate: subConstants long, long', () => {
        expect(utils.subConstants(
            { value: '0000', declaration: 'long' },
            { value: 'a', declaration: 'long' }
        )).toStrictEqual({ value: 0xfffffffffffffff6n, declaration: 'long' })
        expect(utils.subConstants(
            { value: 20, declaration: 'long' },
            { value: 10, declaration: 'long' }
        )).toStrictEqual({ value: 0xan, declaration: 'long' })
    })
    it('should calculate: mulHexContents long, long', () => {
        expect(utils.mulConstants(
            { value: '0000', declaration: 'long' },
            { value: 'a', declaration: 'long' }
        )).toStrictEqual({ value: 0n, declaration: 'long' })
        expect(utils.mulConstants(
            { value: 20, declaration: 'long' },
            { value: 10, declaration: 'long' }
        )).toStrictEqual({ value: 0xc8n, declaration: 'long' })
        expect(utils.mulConstants(
            { value: '89528e28c0542dba', declaration: 'long' },
            { value: 4, declaration: 'long' }
        )).toStrictEqual({ value: 0x254a38a30150b6e8n, declaration: 'long' })
    })
    it('should calculate: divHexContents long, long', () => {
        expect(utils.divConstants(
            { value: 11, declaration: 'long' },
            { value: 2, declaration: 'long' }
        )).toStrictEqual({ value: 0x5n, declaration: 'long' })
        expect(utils.divConstants(
            { value: 0, declaration: 'long' },
            { value: 10, declaration: 'long' }
        )).toStrictEqual({ value: 0n, declaration: 'long' })
    })
    test('should throw: divHexContents long, long', () => {
        expect(() => {
            utils.divConstants(
                { value: 11, declaration: 'long' },
                { value: '', declaration: 'long' }
            )
        }).toThrowError('Division by zero')
    })
    it('should create: createConstantMemObj Number', () => {
        const MemObj = utils.createConstantMemObj(32)
        expect(MemObj.hexContent).toBe('0000000000000020')
        expect(MemObj.declaration).toBe('long')
        expect(MemObj.size).toBe(1)
    })
    it('should create: createConstantMemObj Bigint', () => {
        const MemObj = utils.createConstantMemObj(320n)
        expect(MemObj.hexContent).toBe('0000000000000140')
        expect(MemObj.declaration).toBe('long')
    })
    it('should create: createConstantMemObj Bigint overflow', () => {
        const MemObj = utils.createConstantMemObj(18446744073709551616n)
        expect(MemObj.hexContent).toBe('00000000000000010000000000000000')
        expect(MemObj.declaration).toBe('long')
        expect(MemObj.size).toBe(2)
    })
    test('should throw: createConstantMemObj Fixed', () => {
        expect(() => {
            utils.createConstantMemObj(1.5)
        }).toThrowError('Internal error')
    })
    it('should create: createConstantMemObj String', () => {
        const MemObj = utils.createConstantMemObj('feff')
        expect(MemObj.hexContent).toBe('000000000000feff')
        expect(MemObj.declaration).toBe('long')
    })
})

describe('codeGenerator utils functions (mixed long/fixed)', () => {
    it('should calculate: addConstants (mixed)', () => {
        expect(utils.addConstants(
            { value: '000a000', declaration: 'long' },
            { value: 'aaa0aaa', declaration: 'fixed' }
        )).toStrictEqual({ value: 0x3B9B74A0AAAn, declaration: 'fixed' })
        expect(utils.addConstants(
            { value: 139840123, declaration: 'fixed' },
            { value: 93364483, declaration: 'fixed' }
        )).toStrictEqual({ value: 0xde66b7en, declaration: 'fixed' })
        expect(utils.addConstants(
            { value: 0x3b9aca01, declaration: 'fixed' },
            { value: 'fffffffffffffff6', declaration: 'long' }
        )).toStrictEqual({ value: 0x1n, declaration: 'fixed' })
    })
    it('should calculate: subConstants (mixed)', () => {
        expect(utils.subConstants(
            { value: '0000', declaration: 'long' },
            { value: 'a', declaration: 'fixed' }
        )).toStrictEqual({ value: 0xfffffffffffffff6n, declaration: 'fixed' })
        expect(utils.subConstants(
            { value: 200000002, declaration: 'fixed' },
            { value: 1, declaration: 'long' }
        )).toStrictEqual({ value: 100000002n, declaration: 'fixed' })
        expect(utils.subConstants(
            { value: 300000003, declaration: 'fixed' },
            { value: 200000002, declaration: 'fixed' }
        )).toStrictEqual({ value: 100000001n, declaration: 'fixed' })
    })
    it('should calculate: mulHexContents (mixed)', () => {
        expect(utils.mulConstants(
            { value: '0000', declaration: 'fixed' },
            { value: 'a', declaration: 'long' }
        )).toStrictEqual({ value: 0n, declaration: 'fixed' })
        expect(utils.mulConstants(
            { value: 20, declaration: 'long' },
            { value: 10, declaration: 'fixed' }
        )).toStrictEqual({ value: 0xc8n, declaration: 'fixed' })
        expect(utils.mulConstants(
            { value: 300000003, declaration: 'fixed' },
            { value: 200000002, declaration: 'fixed' }
        )).toStrictEqual({ value: 600000012n, declaration: 'fixed' })
    })
    it('should calculate: divHexContents (mixed)', () => {
        expect(utils.divConstants(
            { value: 11, declaration: 'fixed' },
            { value: 2, declaration: 'long' }
        )).toStrictEqual({ value: 0x5n, declaration: 'fixed' })
        expect(utils.divConstants(
            { value: 0, declaration: 'long' },
            { value: 10, declaration: 'fixed' }
        )).toStrictEqual({ value: 0n, declaration: 'fixed' })
        expect(utils.divConstants(
            { value: 1, declaration: 'long' },
            { value: 10000000, declaration: 'fixed' }
        )).toStrictEqual({ value: 1000000000n, declaration: 'fixed' })
        expect(utils.divConstants(
            { value: 200000002, declaration: 'fixed' },
            { value: 300030000, declaration: 'fixed' }
        )).toStrictEqual({ value: 66660001n, declaration: 'fixed' })
    })
})
