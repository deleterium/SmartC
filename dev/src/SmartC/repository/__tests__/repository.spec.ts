import { stringToHexstring, ReedSalomonAddressDecode } from '../repository'

describe('Strings to hexstring', () => {
    it('should convert: simple string', () => {
        const str = 'Simple'
        const hexstring = '00 00 65 6c 70 6d 69 53'
        const result = stringToHexstring(str)
        expect(result).toBe(hexstring.replace(/ /g, ''))
    })
    it('should convert: low special char (2 bytes)', () => {
        const str = 'Até'
        const hexstring = '00 00 00 00 a9 c3 74 41'
        const result = stringToHexstring(str)
        expect(result).toBe(hexstring.replace(/ /g, ''))
    })
    it('should convert: utf split between longs', () => {
        const str = 'aaaaaaéa'
        const hexstring = ' 00 00 00 00 00 00 00 61 a9 c3 61 61 61 61 61 61'
        const result = stringToHexstring(str)
        expect(result).toBe(hexstring.replace(/ /g, ''))
    })
    it('should convert string sucessfully (chinese)', () => {
        const str = '中华人民共和国'
        const hexstring = '000000bd9be58c92e5b185e591b0e6babae48e8de5adb8e4'
        const result = stringToHexstring(str)
        expect(result).toBe(hexstring.replace(/ /g, ''))
    })
    it('should convert string sucessfully (empty string)', () => {
        const str = ''
        const hexstring = '00 00 00 00 00 00 00 00'
        const result = stringToHexstring(str)
        expect(result).toBe(hexstring.replace(/ /g, ''))
    })
    it('should convert string sucessfully (over 65535)', () => {
        const str = '🨁'
        const hexstring = '00 00 00 00 81 a8 9f f0'
        const result = stringToHexstring(str)
        expect(result).toBe(hexstring.replace(/ /g, ''))
    })
})

describe('Reed-Salomon decode', () => {
    it('should convert: EYCN-TQE9-K5RV-GQZFF', () => {
        const str = 'EYCN-TQE9-K5RV-GQZFF'
        const hexstring = 'e6 b7 f6 cd 98 76 79 54'
        const result = ReedSalomonAddressDecode(str, 0)
        expect(result).toBe(hexstring.replace(/ /g, ''))
    })
    it('should convert: 2222-2622-Y8GQ-22222', () => {
        const str = '2222-2622-Y8GQ-22222'
        const hexstring = '00 00 00 01 00 00 00 00'
        const result = ReedSalomonAddressDecode(str, 0)
        expect(result).toBe(hexstring.replace(/ /g, ''))
    })
    it('should convert: 2222-2222-2222-22222 (id zero)', () => {
        const str = '2222-2222-2222-22222'
        const hexstring = '00 00 00 00 00 00 00 00'
        const result = ReedSalomonAddressDecode(str, 0)
        expect(result).toBe(hexstring.replace(/ /g, ''))
    })
    test('should throw: Address overflow (id >= 2^64)', () => {
        expect(() => {
            const code = '2223-2222-AUZT-J2222'
            ReedSalomonAddressDecode(code, 0)
        }).toThrowError(/^At line/)
    })
    test('should throw: wrong address', () => {
        expect(() => {
            const code = 'LQSJ-DXPH-8HZG-CZXQC'
            ReedSalomonAddressDecode(code, 0)
        }).toThrowError(/^At line/)
    })
    test('should throw: wrong address', () => {
        expect(() => {
            const code = 'LQSJ-DXPH-HHZG-CZXQH'
            ReedSalomonAddressDecode(code, 0)
        }).toThrowError(/^At line/)
    })
})
