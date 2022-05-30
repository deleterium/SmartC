import utils from '../utils'

describe('codeGenerator utils functions', () => {
    it('should calculate: addHexContents', () => {
        expect(utils.addHexContents(
            '000a000', 'aaa0aaa'
        )).toBe('000000000aaaaaaa')
        expect(utils.addHexContents(
            139840123, 93364483
        )).toBe('000000000de66b7e')
        expect(utils.addHexContents(
            'fffffffffffffff6', 20
        )).toBe('000000000000000a')
    })
    it('should calculate: subHexContents', () => {
        expect(utils.subHexContents(
            '0000', 'a'
        )).toBe('fffffffffffffff6')
        expect(utils.subHexContents(
            20, 10
        )).toBe('000000000000000a')
    })
    it('should calculate: mulHexContents', () => {
        expect(utils.mulHexContents(
            '0000', 'a'
        )).toBe('0000000000000000')
        expect(utils.mulHexContents(
            20, 10
        )).toBe('00000000000000c8')
        expect(utils.mulHexContents(
            '89528e28c0542dba', 4
        )).toBe('254a38a30150b6e8')
    })
    it('should calculate: divHexContents', () => {
        expect(utils.divHexContents(
            11, 2
        )).toBe('0000000000000005')
        expect(utils.divHexContents(
            0, 10
        )).toBe('0000000000000000')
    })
    test('should throw: divHexContents', () => {
        expect(() => {
            utils.divHexContents(11, undefined)
        }).toThrowError('Division by zero')
    })
    test('should throw: divHexContents', () => {
        expect(() => {
            utils.divHexContents(11, undefined)
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
    it('should create: createConstantMemObj Fixed', () => {
        const MemObj = utils.createConstantMemObj(1.5)
        expect(MemObj.hexContent).toBe('0000000008f0d180')
        expect(MemObj.declaration).toBe('fixed')
    })
    it('should create: createConstantMemObj String', () => {
        const MemObj = utils.createConstantMemObj('feff')
        expect(MemObj.hexContent).toBe('000000000000feff')
        expect(MemObj.declaration).toBe('long')
    })
})
