import preprocess from '../preprocessor'

describe('preprocessor right tests', () => {
    it('#define test', () => {
        const code = '#define MAX 4\nlong a; a=MAX; long MAXimus=2;'
        const result = '\nlong a; a=4; long MAXimus=2;'
        expect(preprocess(code)).toBe(result)
    })
    it('#define test', () => {
        const code = '#define MAX 4\n long a; a=MAX;\n #define MAX 2\n long MAXimus=MAX;'
        const result = '\n long a; a=4;\n\n long MAXimus=2;'
        expect(preprocess(code)).toBe(result)
    })
    it('#define test', () => {
        const code = '#define MAX 4\n long a; a=MAX;\n #define MAX \n long MAXimus=MAX;'
        const result = '\n long a; a=4;\n\n long MAXimus=;'
        expect(preprocess(code)).toBe(result)
    })
    it('#define test', () => {
        const code = '#define 444 4\nlong a; a=444;\n #undef 444\nlong MAXimus=444;'
        const result = '\nlong a; a=4;\n\nlong MAXimus=444;'
        expect(preprocess(code)).toBe(result)
    })
    it('#define test', () => {
        const code = '#define MAX 4\n#define MAX1 (MAX + 1)\n long a; if (a > MAX1) a++;'
        const result = '\n\n long a; if (a > (4 + 1)) a++;'
        expect(preprocess(code)).toBe(result)
    })
    it('#define test', () => {
        const code = '#define MAX 4\n#define MAX1 (MAX + 1)\n#undef MAX\n long a; if (a > MAX1) a++;'
        const result = '\n\n\n long a; if (a > (4 + 1)) a++;'
        expect(preprocess(code)).toBe(result)
    })

    it('#ifdef test', () => {
        const code = '#define debug\n#ifdef debug\n#pragma maxAuxVars 1\n#endif\nlong a; a++;'
        const result = '\n\n#pragma maxAuxVars 1\n\nlong a; a++;'
        expect(preprocess(code)).toBe(result)
    })
    it('#ifdef test', () => {
        const code = '#ifdef debug\n#pragma maxAuxVars 1\n#endif\nlong a; a++;'
        const result = '\n\n\nlong a; a++;'
        expect(preprocess(code)).toBe(result)
    })
    it('#ifdef test', () => {
        const code = '#ifdef debug\n#pragma maxAuxVars 1\n#else\n#pragma maxAuxVars 5\n#endif\nlong a; a++;'
        const result = '\n\n\n#pragma maxAuxVars 5\n\nlong a; a++;'
        expect(preprocess(code)).toBe(result)
    })
    it('#ifdef test', () => {
        const code = '#define A1\n#define A2\n\n#ifdef A1\nlong a1;\n# ifdef A2\nlong a2;\n# endif\n#endif\n\n#ifdef A1\na1++;\n#endif\n\n#ifdef A2\na2++;\n#endif'
        const result = '\n\n\n\nlong a1;\n\nlong a2;\n\n\n\n\na1++;\n\n\n\na2++;\n'
        expect(preprocess(code)).toBe(result)
    })
    it('#ifdef test', () => {
        const code = '#define A1\n\n#ifdef A1\nlong a1;\n# ifdef A2\nlong a2;\n# endif\n#endif\n\n#ifdef A1\na1++;\n#endif\n\n#ifdef A2\na2++;\n#endif'
        const result = '\n\n\nlong a1;\n\n\n\n\n\n\na1++;\n\n\n\n\n'
        expect(preprocess(code)).toBe(result)
    })
    it('#ifdef test', () => {
        const code = '#ifdef A1\nlong a1;\n# ifdef A2\nlong a2;\n# endif\n#endif\n\n#ifdef A1\na1++;\n#endif\n\n#ifdef A2\na2++;\n#endif'
        const result = '\n\n\n\n\n\n\n\n\n\n\n\n\n'
        expect(preprocess(code)).toBe(result)
    })
    it('#ifdef test', () => {
        const code = '#define A2\n\n#ifdef A1\nlong a1;\n# ifdef A2\nlong a2;\n# endif\n#endif\n\n#ifdef A1\na1++;\n#endif\n\n#ifdef A2\na2++;\n#endif'
        const result = '\n\n\n\n\n\n\n\n\n\n\n\n\n\na2++;\n'
        expect(preprocess(code)).toBe(result)
    })
    it('#ifndef test', () => {
        const code = '\n#ifndef debug\n#pragma maxAuxVars 1\n#endif\nlong a; a++;'
        const result = '\n\n#pragma maxAuxVars 1\n\nlong a; a++;'
        expect(preprocess(code)).toBe(result)
    })
    it('#ifndef test', () => {
        const code = '#define debug\n#ifndef debug\n#pragma maxAuxVars 1\n#endif\nlong a; a++;'
        const result = '\n\n\n\nlong a; a++;'
        expect(preprocess(code)).toBe(result)
    })
    it('#ifndef test', () => {
        const code = '#define debug\n#ifndef debug\n#pragma maxAuxVars 1\n#else\n#pragma maxAuxVars 5\n#endif\nlong a; a++;'
        const result = '\n\n\n\n#pragma maxAuxVars 5\n\nlong a; a++;'
        expect(preprocess(code)).toBe(result)
    })
    it('#define, #undef at line not active test', () => {
        const code = '#ifdef debug\n#define A1 44\n#ifndef impossible\na++;\n#endif\n#define A2\n#undef true\n#endif\nlong a; a=A1+A2+true;'
        const result = '\n\n\n\n\n\n\n\nlong a; a=A1+A2+1;'
        expect(preprocess(code)).toBe(result)
    })
    it('#define, #undef at line active test', () => {
        const code = '#define debug \n#ifdef debug\n#define A1 44\n#define A2\n#undef true\n#endif\nlong a; a=A1+A2+true;'
        const result = '\n\n\n\n\n\nlong a; a=44++true;'
        expect(preprocess(code)).toBe(result)
    })
})

describe('preprocessor wrong code', () => {
    test('no #endif', () => {
        expect(() => {
            const code = '#ifdef debug\nlong a; a++;'
            preprocess(code)
        }).toThrowError(/^At line/)
    })
    test('unmatched #else', () => {
        expect(() => {
            const code = '#else\nlong a; a++;'
            preprocess(code)
        }).toThrowError(/^At line/)
    })
    test('no #ifdef/#ifndef', () => {
        expect(() => {
            const code = '#endif\nlong a; a++;'
            preprocess(code)
        }).toThrowError(/^At line/)
    })
    test('many #else', () => {
        expect(() => {
            const code = '#ifdef debug\n#pragma maxAuxVars 1\n#else\n#pragma maxAuxVars 5\n#else\n#pragma maxAuxVars 7\n#endif\nlong a; a++;'
            preprocess(code)
        }).toThrowError(/^At line/)
    })
})
