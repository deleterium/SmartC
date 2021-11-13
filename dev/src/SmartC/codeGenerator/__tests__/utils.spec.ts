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
    test('should throw: Fractional number in createConstantMemObj', () => {
        expect(() => {
            utils.createConstantMemObj(1.5)
        }).toThrowError('Only integer numbers in createConstantMemObj().')
    })
})
