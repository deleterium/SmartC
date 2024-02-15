// Note: Use assert functions only in cases for internal error or debug purposes.
// Using them with regular error messages will lead to condition not beeing checked
// in coverage report.

import { CONSTANT_CONTENT, DECLARATION_TYPES } from '../typings/syntaxTypes'

/**
 * Ensure the value is not undefined
 * @param argument Anything
 * @returns Anything, but not undefined
 * @throws {Typerror} if value is undefined
 */
export function assertNotUndefined<Type> (
    argument: Type | undefined, errorMessage: string = 'Internal error.'
) : Exclude<Type, undefined> {
    if (argument === undefined) {
        throw new Error(errorMessage)
    }
    return argument as Exclude<Type, undefined>
}

/**
 * Ensure the argument is not undefined and not equal param
 * @param argument to check
 * @param param to compare
 * @param errorMessage to throw
 * @returns Argument without undefined type
 * @throws {Error} if not pass condition
 */
export function assertNotEqual<T> (
    argument: T | undefined, param: T, errorMessage: string
) : Exclude<T, undefined> {
    if (argument !== undefined && argument !== param) {
        return argument as Exclude<T, undefined>
    }
    throw new Error(errorMessage)
}

/**
 * Ensure the argument is true
 * @param argument to check
 * @param errorMessage to throw
 * @returns true
 * @throws {Error} if expression is false
 */
export function assertExpression (argument: boolean, errorMessage: string = 'Internal error.'): true {
    if (!argument) {
        throw new Error(errorMessage)
    }
    return true
}

// Note: Found at https://gist.github.com/sunnyy02/2477458d4d1c08bde8cc06cd8f56702e
// https://javascript.plainenglish.io/deep-clone-an-object-and-preserve-its-type-with-typescript-d488c35e5574
/**
 * Create a deep copy of one variable.
 */
export function deepCopy<T1> (source: T1): T1 {
    if (Array.isArray(source)) {
        return source.map(item => deepCopy(item)) as unknown as T1
    }
    if (source instanceof Date) {
        return new Date(source.getTime()) as unknown as T1
    }
    if (source && typeof source === 'object') {
        return Object.getOwnPropertyNames(source).reduce((o, prop) => {
            Object.defineProperty(o, prop, Object.getOwnPropertyDescriptor(source, prop)!)
            o[prop] = deepCopy((source as { [key: string]: any })[prop])
            return o
        }, Object.create(Object.getPrototypeOf(source)))
    }
    return source
}

/**
 * Converts a utf-16 string to utf-8 hexstring. Also process escape chars
 * \n \r \t \\ \' \" \xHH \uHHHH
 *
 * @param inStr Input string
 * @returns Same string converted, padded and reversed.
 * (multiple of 8 bytes)
 */
export function stringToHexstring (inStr: string, line: string) : string {
    const byarr : number [] = []
    const hexDigits = [ // charCodes of /[0-9A-Fa-f]/ are ones here
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0,
        0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
        1, 1, 1
    ]
    const hexValues = [ // charCodes of /[0-9A-Fa-f]/ and their value in HEX
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 0,
        0, 0, 0, 0, 0, 10, 11, 12, 13, 14, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 11, 12,
        13, 14, 15

    ]
    if (inStr.length === 0) byarr.push(0)
    let charCode, nextCharCode: number
    let helperUnicode: number[]
    let i = 0
    let state = 0
    for (i = 0; !Number.isNaN(charCode = inStr.charCodeAt(i)); i++) {
        switch (state) {
        case 0: // Regular chars
            switch (true) {
            case (charCode < 0x80):
                if (charCode === 92) { // Starting escape sequence with \
                    state = 1
                    break
                }
                byarr.push(charCode)
                break
            case (charCode < 0x800):
                byarr.push(0xc0 | (charCode >> 6))
                byarr.push(0x80 | (charCode & 0x3f))
                break
            case (charCode < 0xd800):
            case (charCode > 0xdfff):
                byarr.push(0xe0 | (0x3f & (charCode >> 12)))
                byarr.push(0x80 | (0x3f & (charCode >> 6)))
                byarr.push(0x80 | (0x3f & charCode))
                break
            default:
                nextCharCode = inStr.charCodeAt(i + 1)
                if (Number.isNaN(nextCharCode)) {
                    throw new Error(`At line: ${line}. String with invalid character at index ${i}.`)
                }
                if ((charCode & 0xfc00) === 0xd800 && (nextCharCode & 0xfc00) === 0xdc00) {
                    i++
                    const newCharCode = ((charCode & 0x3ff) << 10) + (nextCharCode & 0x3ff) + 0x10000
                    byarr.push(0xf0 | (0x3f & (newCharCode >> 18)))
                    byarr.push(0x80 | (0x3f & (newCharCode >> 12)))
                    byarr.push(0x80 | (0x3f & (newCharCode >> 6)))
                    byarr.push(0x80 | (0x3f & newCharCode))
                    break
                }
                throw new Error(`At line: ${line}. String with invalid character at index ${i}.`)
            }
            break
        case 1: // Possible escape char
            state = 0
            switch (charCode) {
            case 110: // 'n'
                byarr.push('\n'.charCodeAt(0))
                break
            case 114: // 'r'
                byarr.push('\r'.charCodeAt(0))
                break
            case 116: // 't'
                byarr.push('\t'.charCodeAt(0))
                break
            case 92: // '\\'
                byarr.push('\\'.charCodeAt(0))
                break
            case 39: // '\''
                byarr.push('\''.charCodeAt(0))
                break
            case 34: // '"'
                byarr.push('"'.charCodeAt(0))
                break
            case 120: // 'x'
                state = 2
                break
            case 117: // 'u'
                state = 3
                break
            default:
                // not escaping char
                throw new Error(`At line: ${line}. String with invalid escaping character '\\${String.fromCharCode(charCode)}.`)
            }
            break
        case 2: // Read escaped \xHH
            nextCharCode = inStr.charCodeAt(++i)
            state = 0
            if (!(hexDigits[charCode] && hexDigits[nextCharCode])) {
                throw new Error(`At line: ${line}. String with malformed escaping '\\x' character. ` +
                    'Expected 2 hexadecimal chars, but found invalid char or end of string.')
            }
            byarr.push(hexValues[charCode] * 16 + hexValues[nextCharCode])
            break
        case 3: // Read escaped \uHHHH (unicode)
            helperUnicode = [
                charCode,
                inStr.charCodeAt(++i),
                inStr.charCodeAt(++i),
                inStr.charCodeAt(++i)
            ]
            state = 0
            if (!helperUnicode.every(code => hexDigits[code] === 1)) {
                throw new Error(`At line: ${line}. String with malformed escaping '\\u' (unicode) character. ` +
                    'Expected 4 hexadecimal chars, but found invalid char or end of string.')
            }
            // Change input string to include
            inStr = inStr.slice(0, i - 5) +
                String.fromCharCode(
                    hexValues[helperUnicode[0]] * 4096 + hexValues[helperUnicode[1]] * 256 +
                    hexValues[helperUnicode[2]] * 16 + hexValues[helperUnicode[3]]
                ) +
                inStr.slice(i + 1)
            i -= 6
            break
        }
    }
    const byteSize = (Math.floor((byarr.length - 1) / 8) + 1) * 8
    byarr.reverse()
    const hexstring = byarr.map(num => num.toString(16).padStart(2, '0')).join('')
    return hexstring.padStart(byteSize * 2, '0')
}

/**
 * Decode REED-SALOMON signum address from string to long value
 * Adapted from https://github.com/signum-network/signumj
 *
 * @param RSString String without S-, TS- nor BURST- prefix. Invalid
 * chars are skipped
 * @param currLine Will be used in throw message if error in decoding
 * @returns hexstring little endian equivalent for RS address
 * @throws {Error} on decoding error
 */
export function ReedSalomonAddressDecode (RSString: string, currLine: string) : string {
    const gexp = [1, 2, 4, 8, 16, 5, 10, 20, 13, 26, 17, 7, 14, 28, 29, 31, 27, 19, 3, 6, 12, 24, 21, 15, 30, 25, 23, 11, 22, 9, 18, 1]
    const glog = [0, 0, 1, 18, 2, 5, 19, 11, 3, 29, 6, 27, 20, 8, 12, 23, 4, 10, 30, 17, 7, 22, 28, 26, 21, 25, 9, 16, 13, 14, 24, 15]

    function gmult (a: number, b: number) : number {
        if (a === 0 || b === 0) {
            return 0
        }
        const idx = (glog[a] + glog[b]) % 31
        return gexp[idx]
    }

    function isCodewordValid (codewordToTest: number[]) : boolean {
        let sum = 0
        for (let i = 1; i < 5; i++) {
            let t = 0
            for (let j = 0; j < 31; j++) {
                if (j > 12 && j < 27) {
                    continue
                }
                let pos = j
                if (j > 26) {
                    pos -= 14
                }
                t ^= gmult(codewordToTest[pos], gexp[(i * j) % 31])
            }
            sum |= t
        }
        return sum === 0
    }

    function run () : string {
        const codeword: number[] = []
        const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
        const codewordMap = [3, 2, 1, 0, 7, 6, 5, 4, 13, 14, 15, 16, 12, 8, 9, 10, 11]

        const validChars = RSString.replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ]/g, '')
        validChars.split('').forEach((char, index) => {
            const positionInAlphabet = alphabet.indexOf(char)
            codeword[codewordMap[index]] = positionInAlphabet
        })
        if (validChars.length !== 17 || !isCodewordValid(codeword)) {
            throw new Error(`At line: ${currLine}. Error decoding address: S-${RSString}`)
        }
        // base32 to bigint conversion. Disregard checking bytes on indexes above 13.
        const accountId = codeword.slice(0, 13).reduce((previousValue, currentValue, currentIndex) => {
            return previousValue + (BigInt(currentValue) * (1n << (5n * BigInt(currentIndex))))
        }, 0n)
        if (accountId >= 18446744073709551616n) {
            throw new Error(`At line: ${currLine}. Error decoding address: S-${RSString}`)
        }
        return accountId.toString(16).padStart(16, '0')
    }

    return run()
}

/** Parse a string supposed to be a decimal (no negative)
 * @returns Object with value and type
 * @throws Error if string is not valid
 */
export function parseDecimalNumber (strNum: string, line: string): CONSTANT_CONTENT {
    strNum = strNum.replace(/_/g, '')
    let value: bigint
    let type : 'long'|'fixed'
    if (strNum.includes('.')) {
        const parts = strNum.split('.')
        if (parts.length !== 2) {
            throw new Error(`At line ${line}. ` +
            ' Found more than one decimal point in number.')
        }
        if (parts[1].length > 8) {
            throw new Error(`At line ${line}. ` +
            'Fixed numbers cannot have more than 8 digits as decimal fraction.')
        }
        value = BigInt(parts[0]) * 100000000n + BigInt(parts[1].padEnd(8, '0'))
        type = 'fixed'
    } else {
        value = BigInt(strNum)
        type = 'long'
    }
    return {
        value,
        declaration: type
    }
}

export function isDeclarationType (str: string) : str is DECLARATION_TYPES {
    switch (str) {
    case 'void':
    case 'long':
    case 'fixed':
    case 'struct':
    case 'void_ptr':
    case 'long_ptr':
    case 'fixed_ptr':
    case 'struct_ptr':
        return true
    }
    return false
}
