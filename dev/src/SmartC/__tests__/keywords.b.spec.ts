import { SmartC } from '../smartc'

describe('Keywords wrong usage', () => {
    test('should throw: long with missing variable and delimiter', () => {
        expect(() => {
            const code = 'long ,b;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: if empty condition', () => {
        expect(() => {
            const code = 'long a; if () { a++; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: if else empty condition', () => {
        expect(() => {
            const code = 'long a; if () { a++; } else { b--; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: while empty condition', () => {
        expect(() => {
            const code = 'long a; while () { a++; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: do while empty condition', () => {
        expect(() => {
            const code = 'long a; do { a++; } while ();'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: sleep without argument', () => {
        expect(() => {
            const code = 'long a; sleep; a++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: const without arguments', () => {
        expect(() => {
            const code = 'long a; const ;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: goto without argument', () => {
        expect(() => {
            const code = 'long a; goto; a++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: halt must have no arguments', () => {
        expect(() => {
            const code = 'long a, b; halt 1; a++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: break must have no arguments', () => {
        expect(() => {
            const code = 'long a, b; break 1; a++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: continue must have no arguments', () => {
        expect(() => {
            const code = 'long a, b; continue a; a++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: wrong for usage', () => {
        expect(() => {
            const code = 'long a, b; for a++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: goto: label with same name as one variable', () => {
        expect(() => {
            const code = 'long a; goto a; a++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: return in global code', () => {
        expect(() => {
            const code = 'long a; return;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: label with same name from one variable', () => {
        expect(() => {
            const code = 'long a, b; goto a; a++; a: b++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: label declared twice', () => {
        expect(() => {
            const code = 'long a=0; mylabel: a++; void temp(void) { a++; mylabel: a++; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: unexpected else', () => {
        expect(() => {
            const code = 'long a, b; else a++; a: b++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: wrong do while use', () => {
        expect(() => {
            const code = 'long a, b; do { a++; };'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: wrong do while use', () => {
        expect(() => {
            const code = 'long a, b; do { a++; } long long;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: wrong do while use', () => {
        expect(() => {
            const code = 'long a, b; do { a++; } long (a);'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: wrong do while use', () => {
        expect(() => {
            const code = 'long a, b; do { a++; } while (a) b++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: unexpected break', () => {
        expect(() => {
            const code = 'long a, b; break; b++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: unexpected continue', () => {
        expect(() => {
            const code = 'long a, b; continue; b++;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: non-sense address of in const sentence', () => {
        expect(() => {
            const code = 'long a, b, *c, d[2]; const d=&a;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: setting "const" same var two times', () => {
        expect(() => {
            const code = 'long a, b, *c, d[2]; const long e=3; a++; const e=4;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Wrong asm instruction', () => {
        expect(() => {
            const code = 'long a; asm PSH $A;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Wrong asm instruction. No ending }', () => {
        expect(() => {
            const code = 'long a; asm { PSH $A;'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})
