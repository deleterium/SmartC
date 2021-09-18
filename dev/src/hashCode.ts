// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

/* LICENSE notes for function binb_sha256:
 *
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

/**
 * Calculates a digest ID of a given machine code.
 * @param hexCode Machine code to be calculated, as hex string.
 * @returns A string representing a hash ID of given contract
 */
// eslint-disable-next-line no-unused-vars
function hashMachineCode (hexCode: string): string {
    // Pad input to match codepage length
    const hexLen = Number(((BigInt(hexCode.length) / 512n) + 1n) * 512n)
    hexCode = hexCode.padEnd(hexLen, '0')
    // Split program into words (32-bit)
    const parts = hexCode.match(/[\s\S]{8}/g)
    if (parts === null) {
        return 'ERROR'
    }
    // Translate hex text to words.
    const codeWordArr = parts.map(str => unsigned2signed(Number('0x' + str)))
    // Calculate sha-256 and toggle result to little endian
    const wordsHash = toggleEndianWordsArr(binb_sha256(codeWordArr, 4 * 8 * codeWordArr.length))
    // Get parts for digest ID
    const lsp = BigInt(signed2unsigned(wordsHash[0]))
    const msp = BigInt(signed2unsigned(wordsHash[1]))
    // Calculate ID value and return it as string.
    return ((msp << 32n) + lsp).toString(10)

    function toggleEndianWordsArr (wordArr: number[]) {
        const bi = wordArr.map(x => signed2unsigned(x))
        const retArr: number[] = []
        let val: number
        for (let i = 0; i < bi.length; i++) {
            val = (bi[i] >> 24) & 0xff
            val |= ((bi[i] >> 16) & 0xff) << 8
            val |= ((bi[i] >> 8) & 0xff) << 16
            val |= (bi[i] & 0xff) << 24
            retArr.push(unsigned2signed(val))
        }
        return retArr
    }

    // For 32-bit Number
    function unsigned2signed (unsigned: number) {
        if (unsigned >= 0x80000000) {
            return unsigned - 0x100000000
        }
        return unsigned
    }

    // For 32-bit Number
    function signed2unsigned (signed: number) {
        if (signed < 0) {
            return (signed + 0x100000000)
        }
        return signed
    }

    /* eslint-disable camelcase */
    /* Calculate the SHA-256 of an array of big-endian words, and a bit length. */
    function binb_sha256 (m: number[], l: number) {
        function safe_add (x: number, y: number) {
            const lsw = (x & 0xFFFF) + (y & 0xFFFF)
            const msw = (x >> 16) + (y >> 16) + (lsw >> 16)
            return (msw << 16) | (lsw & 0xFFFF)
        }
        /* sha256 support functions */
        function sha256_S (X: number, n: number) {
            return (X >>> n) | (X << (32 - n))
        }
        function sha256_R (X: number, n: number) {
            return (X >>> n)
        }
        function sha256_Ch (x: number, y: number, z: number) {
            return ((x & y) ^ ((~x) & z))
        }
        function sha256_Maj (x: number, y: number, z: number) {
            return ((x & y) ^ (x & z) ^ (y & z))
        }
        function sha256_Sigma0256 (x: number) {
            return (sha256_S(x, 2) ^ sha256_S(x, 13) ^ sha256_S(x, 22))
        }
        function sha256_Sigma1256 (x: number) {
            return (sha256_S(x, 6) ^ sha256_S(x, 11) ^ sha256_S(x, 25))
        }
        function sha256_Gamma0256 (x: number) {
            return (sha256_S(x, 7) ^ sha256_S(x, 18) ^ sha256_R(x, 3))
        }
        function sha256_Gamma1256 (x: number) {
            return (sha256_S(x, 17) ^ sha256_S(x, 19) ^ sha256_R(x, 10))
        }
        /* Main sha256 function */
        const sha256_K = [
            1116352408, 1899447441, -1245643825, -373957723, 961987163, 1508970993,
            -1841331548, -1424204075, -670586216, 310598401, 607225278, 1426881987,
            1925078388, -2132889090, -1680079193, -1046744716, -459576895, -272742522,
            264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986,
            -1740746414, -1473132947, -1341970488, -1084653625, -958395405, -710438585,
            113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291,
            1695183700, 1986661051, -2117940946, -1838011259, -1564481375, -1474664885,
            -1035236496, -949202525, -778901479, -694614492, -200395387, 275423344,
            430227734, 506948616, 659060556, 883997877, 958139571, 1322822218,
            1537002063, 1747873779, 1955562222, 2024104815, -2067236844, -1933114872,
            -1866530822, -1538233109, -1090935817, -965641998
        ]

        const HASH = [1779033703, -1150833019, 1013904242, -1521486534,
            1359893119, -1694144372, 528734635, 1541459225]
        const W = new Array(64)
        let a, b, c, d, e, f, g, h
        let i, j, T1, T2

        /* append padding */
        m[l >> 5] |= 0x80 << (24 - l % 32)
        m[((l + 64 >> 9) << 4) + 15] = l

        for (i = 0; i < m.length; i += 16) {
            a = HASH[0]
            b = HASH[1]
            c = HASH[2]
            d = HASH[3]
            e = HASH[4]
            f = HASH[5]
            g = HASH[6]
            h = HASH[7]

            for (j = 0; j < 64; j++) {
                if (j < 16) {
                    W[j] = m[j + i]
                } else {
                    W[j] = safe_add(safe_add(safe_add(sha256_Gamma1256(W[j - 2]), W[j - 7]),
                        sha256_Gamma0256(W[j - 15])), W[j - 16])
                }

                T1 = safe_add(safe_add(safe_add(safe_add(h, sha256_Sigma1256(e)), sha256_Ch(e, f, g)),
                    sha256_K[j]), W[j])
                T2 = safe_add(sha256_Sigma0256(a), sha256_Maj(a, b, c))
                h = g
                g = f
                f = e
                e = safe_add(d, T1)
                d = c
                c = b
                b = a
                a = safe_add(T1, T2)
            }

            HASH[0] = safe_add(a, HASH[0])
            HASH[1] = safe_add(b, HASH[1])
            HASH[2] = safe_add(c, HASH[2])
            HASH[3] = safe_add(d, HASH[3])
            HASH[4] = safe_add(e, HASH[4])
            HASH[5] = safe_add(f, HASH[5])
            HASH[6] = safe_add(g, HASH[6])
            HASH[7] = safe_add(h, HASH[7])
        }
        return HASH
    }
    /* eslint-enable camelcase */
}
