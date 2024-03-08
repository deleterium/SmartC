import preprocessor from '../preprocessor'

function createFakeProgram (sourceCode: string) {
    return {
        sourceLines: sourceCode.split('\n'),
        Config: {
            compilerVersion: '0.0.0',
            maxAuxVars: 3,
            maxConstVars: 0,
            optimizationLevel: 2,
            reuseAssignedVar: true,
            APIFunctions: false,
            fixedAPIFunctions: false,
            PName: '',
            PDescription: '',
            PActivationAmount: '',
            PCreator: '',
            PContract: '',
            PUserStackPages: 0,
            PCodeStackPages: 0,
            PCodeHashId: '',
            verboseAssembly: false,
            verboseScope: false
        },
        Context: {
            formatError (line: string, error: string) {
                return (`At line: ${line}. ${error}`)
            }
        }
    }
}

describe('preprocessor right tests', () => {
    it('#define test', () => {
        const code = createFakeProgram('#define MAX 4\nlong a; a=MAX; long MAXimus=2;')
        const result = '\nlong a; a=4#13#; long MAXimus=2;'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })
    it('#define test', () => {
        const code = createFakeProgram('#define MAX 4\n long a; a=MAX;\n #define MAX 2\n long MAXimus=MAX;')
        const result = '\n long a; a=4#14#;\n\n long MAXimus=2#17#;'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })
    it('#define test', () => {
        const code = createFakeProgram('#define MAX 4\n long a; a=MAX;\n #define MAX \n long MAXimus=MAX;')
        const result = '\n long a; a=4#14#;\n\n long MAXimus=#17#;'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })
    it('#define test', () => {
        const code = createFakeProgram('#define 444 4\nlong a; a=444;\n #undef 444\nlong MAXimus=444;')
        const result = '\nlong a; a=4#13#;\n\nlong MAXimus=444;'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })
    it('#define test', () => {
        const code = createFakeProgram('#define MAX 4\n#define MAX1 (MAX + 1)\n long a; if (a > MAX1) a++;')
        const result = '\n\n long a; if (a > (4#4# + 1)#21#) a++;'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })
    it('#define test', () => {
        const code = createFakeProgram('#define MAX 4\n#define MAX1 (MAX + 1)\n#undef MAX\n long a; if (a > MAX1) a++;')
        const result = '\n\n\n long a; if (a > (4#4# + 1)#21#) a++;'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })

    it('#define macro (simple)', () => {
        const code = createFakeProgram('#define DEF(top, bottom) (((top) << 8) | (bottom))\nlong a,b,c;\na = DEF(b, c);\n')
        const result = '\nlong a,b,c;\na = (((b) << 8) | (c))#13#;\n'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })
    it('#define macro (empty argument)', () => {
        const code = createFakeProgram('#define DEF() (Get_Current_Timestamp(  ) >> 32)\nlong a;\na = DEF() ;\n')
        const result = '\nlong a;\na = (Get_Current_Timestamp(  ) >> 32)#9# ;\n'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })
    it('#define macro (complex)', () => {
        const code = createFakeProgram('#define DEF(top, bottom) (((top) << 8) | (bottom))\nlong a,b,c;\na = DEF(mdv(a,b, c), c) + DEF(22, 25);\n')
        const result = '\nlong a,b,c;\na = (((mdv(a,b, c)) << 8) | (c))#23# + (((22) << 8) | (25))#37#;\n'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })
    it('#define macro (with define constant)', () => {
        const code = createFakeProgram('#define ONE n1\n#define DEF(top, bottom) (((top) << 8) | (bottom + ONE))\n#undef ONE\nlong a,b,c;\na = DEF(mdv(a,b, c), c);\n')
        const result = '\n\n\nlong a,b,c;\na = (((mdv(a,b, c)) << 8) | (c + n1#29#))#23#;\n'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })
    it('#define replace multiple times same line', () => {
        const code = createFakeProgram('long a, b, c; if (a == NULL && b == NULL) c++;')
        const result = 'long a, b, c; if (a == (void *)(0)#27# && b == (void *)(0)#40#) c++;'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })

    it('#ifdef test', () => {
        const code = createFakeProgram('#define debug\n#ifdef debug\n#pragma maxAuxVars 1\n#endif\nlong a; a++;')
        const result = '\n\n\n\nlong a; a++;'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
        expect(code.Config.maxAuxVars).toBe(1)
    })
    it('#ifdef test', () => {
        const code = createFakeProgram('#ifdef debug\n#pragma maxAuxVars 1\n#endif\nlong a; a++;')
        const result = '\n\n\nlong a; a++;'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
        expect(code.Config.maxAuxVars).toBe(3)
    })
    it('#ifdef test', () => {
        const code = createFakeProgram('#ifdef debug\n#pragma maxConstVars 1\n #else\n#pragma maxConstVars 5\n#endif  \nlong a; a++;')
        const result = '\n\n\n\n\nlong a; a++;'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
        expect(code.Config.maxConstVars).toBe(5)
    })
    it('#ifdef test', () => {
        const code = createFakeProgram('#define A1\n#define A2\n\n#ifdef A1\nlong a1;\n# ifdef A2\nlong a2;\n# endif\n#endif\n\n#ifdef A1\na1++;\n#endif\n\n#ifdef A2\na2++;\n#endif')
        const result = '\n\n\n\nlong a1;\n\nlong a2;\n\n\n\n\na1++;\n\n\n\na2++;\n'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })
    it('#ifdef test', () => {
        const code = createFakeProgram('#define A1\n\n#ifdef A1\nlong a1;\n# ifdef A2\nlong a2;\n# endif\n#endif\n\n#ifdef A1\na1++;\n#endif\n\n#ifdef A2\na2++;\n#endif')
        const result = '\n\n\nlong a1;\n\n\n\n\n\n\na1++;\n\n\n\n\n'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })
    it('#ifdef test', () => {
        const code = createFakeProgram('#ifdef A1\nlong a1;\n# ifdef A2\nlong a2;\n# endif\n#endif\n\n#ifdef A1\na1++;\n#endif\n\n#ifdef A2\na2++;\n#endif')
        const result = '\n\n\n\n\n\n\n\n\n\n\n\n\n'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })
    it('#ifdef test', () => {
        const code = createFakeProgram('#define A2\n\n#ifdef A1\nlong a1;\n# ifdef A2\nlong a2;\n# endif\n#endif\n\n#ifdef A1\na1++;\n#endif\n\n#ifdef A2\na2++;\n#endif')
        const result = '\n\n\n\n\n\n\n\n\n\n\n\n\n\na2++;\n'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })
    it('#ifndef test', () => {
        const code = createFakeProgram('\n#ifndef debug\n#pragma verboseAssembly\n#endif\nlong a; a++;')
        const result = '\n\n\n\nlong a; a++;'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
        expect(code.Config.verboseAssembly).toBe(true)
    })
    it('#ifndef test', () => {
        const code = createFakeProgram('#define debug\n#ifndef debug\n#pragma maxAuxVars 1\n#endif\nlong a; a++;')
        const result = '\n\n\n\nlong a; a++;'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })
    it('#ifndef test', () => {
        const code = createFakeProgram('#define debug\n#ifndef debug\n#program codeStackPages 2\n#else\n#program codeStackPages 5\n#endif\nlong a; a++;')
        const result = '\n\n\n\n\n\nlong a; a++;'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
        expect(code.Config.PCodeStackPages).toBe(5)
    })
    it('#define, #undef at line not active test', () => {
        const code = createFakeProgram('#ifdef debug\n#define A1 44\n#ifndef impossible\na++;\n#endif\n#define A2\n#undef true\n#endif\nlong a; a=A1+A2+true;')
        const result = '\n\n\n\n\n\n\n\nlong a; a=A1+A2+1#20#;'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })
    it('#define, #undef at line active test', () => {
        const code = createFakeProgram('#define debug \n#ifdef debug\n#define A1 44\n#define A2\n#undef true\n#endif\nlong a; a=A1+A2+true;')
        const result = '\n\n\n\n\n\nlong a; a=44#12#+#15#+true;'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })
    it('escaping new line', () => {
        const code = createFakeProgram('asdf\nqwer\\\ntyui\n')
        const result = 'asdf\nqwertyui\n\n'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })
    it('two escaping new lines', () => {
        const code = createFakeProgram('asdf\nqwer\\\ntyui\\\nop\n')
        const result = 'asdf\nqwertyuiop\n\n\n'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })
    it('escaping new line at EOF', () => {
        const code = createFakeProgram('asdf\nqwer\ntyui\\')
        const result = 'asdf\nqwer\ntyui'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })
    it('many escaping new lines at EOF', () => {
        const code = createFakeProgram('asdf\nqwer\\\ntyui\\')
        const result = 'asdf\nqwertyui\n'
        // @ts-expect-error TS2345
        expect(preprocessor(code)).toBe(result)
    })
})

describe('preprocessor wrong code', () => {
    test('no #endif', () => {
        expect(() => {
            const code = createFakeProgram('#ifdef debug\nlong a; a++;')
            // @ts-expect-error TS2345
            preprocessor(code)
        }).toThrowError(/^At line/)
    })
    test('unmatched #else', () => {
        expect(() => {
            const code = createFakeProgram('#else\nlong a; a++;')
            // @ts-expect-error TS2345
            preprocessor(code)
        }).toThrowError(/^At line/)
    })
    test('no #ifdef/#ifndef', () => {
        expect(() => {
            const code = createFakeProgram('#endif\nlong a; a++;')
            // @ts-expect-error TS2345
            preprocessor(code)
        }).toThrowError(/^At line/)
    })
    test('many #else', () => {
        expect(() => {
            const code = createFakeProgram('#ifdef debug\n#pragma maxAuxVars 1\n#else\n#pragma maxAuxVars 5\n#else\n#pragma maxAuxVars 7\n#endif\nlong a; a++;')
            // @ts-expect-error TS2345
            preprocessor(code)
        }).toThrowError(/^At line/)
    })
    test('wrong number of macro arguments', () => {
        expect(() => {
            const code = createFakeProgram('#define DEF(top) ((top) << 8))\nlong a,b,c,n1;\na = DEF(b, c);')
            // @ts-expect-error TS2345
            preprocessor(code)
        }).toThrowError(/^At line/)
    })
    test('error parsing macro arguments', () => {
        expect(() => {
            const code = createFakeProgram('#define DEF(top) ((top) << 8)\nlong a,b,c,n1;\na = DEF(b();')
            // @ts-expect-error TS2345
            preprocessor(code)
        }).toThrowError(/^At line/)
    })
    test('macro redefinition', () => {
        expect(() => {
            const code = createFakeProgram('#define DEF(top) ((top) << 8)\n#define DEF(top, bottom) ((top) << 8) | (bottom))\nlong a,b,c,n1;\na = DEF(b);')
            // @ts-expect-error TS2345
            preprocessor(code)
        }).toThrowError(/^At line/)
    })
    test('macro wrong numbers of arguments (empty)', () => {
        expect(() => {
            const code = createFakeProgram('#define getCurrentBlock(  )  (Get_Block_Timestamp() >> 32)\n long a; a = getCurrentBlock(  s  );')
            // @ts-expect-error TS2345
            preprocessor(code)
        }).toThrowError(/^At line/)
    })
    test('macro wrong numbers of arguments (empty, something)', () => {
        expect(() => {
            const code = createFakeProgram('#define getCurrentBlock( , a )  (Get_Block_Timestamp(a) >> 32)\n long ll; ll = getCurrentBlock( ll , ll  );')
            // @ts-expect-error TS2345
            preprocessor(code)
        }).toThrowError(/^At line/)
    })
    test('macro wrong numbers of arguments (something, empty)', () => {
        expect(() => {
            const code = createFakeProgram('#define getCurrentBlock( a)  (Get_Block_Timestamp(a) >> 32)\n long ll; ll = getCurrentBlock( ll , );')
            // @ts-expect-error TS2345
            preprocessor(code)
        }).toThrowError(/^At line/)
    })
    test('preprocessor wrong chars', () => {
        expect(() => {
            const code = createFakeProgram('#defin ad 25\n long ll; ll = 1')
            // @ts-expect-error TS2345
            preprocessor(code)
        }).toThrowError(/^At line/)
    })
})
