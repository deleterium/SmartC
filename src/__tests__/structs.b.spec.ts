import { SmartC } from '../smartc'

describe('structs (pointer / arrays)', () => {
    it('should compile: pointer to struct (longs)', () => {
        const code = `#pragma optimizationLevel 0
struct KOMBI { long driver; long collector; long passenger; } ;
struct KOMBI car, *pcar;
long a, b, *c, d[2];
pcar=&car;\n
pcar->passenger='Ze';
pcar->driver=a;
pcar->driver=*c;
pcar->driver=d[1];
pcar->driver=d[a];
pcar->driver=pcar->collector;\n
a=pcar->collector;
*c=pcar->collector;
d[1]=pcar->collector;
d[a]=pcar->collector;`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^declare pcar\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #000000000000000b\n^declare d_0\n^declare d_1\n\nSET @pcar #0000000000000003\nSET @r0 #000000000000655a\nSET @r1 #0000000000000002\nSET @($pcar + $r1) $r0\nSET @($pcar) $a\nSET @r0 $($c)\nSET @($pcar) $r0\nSET @($pcar) $d_1\nSET @r0 $($d + $a)\nSET @($pcar) $r0\nSET @r1 #0000000000000001\nSET @r0 $($pcar + $r1)\nSET @($pcar) $r0\nSET @a #0000000000000001\nSET @a $($pcar + $a)\nSET @r1 #0000000000000001\nSET @r0 $($pcar + $r1)\nSET @($c) $r0\nSET @d_1 #0000000000000001\nSET @d_1 $($pcar + $d_1)\nSET @r1 #0000000000000001\nSET @r0 $($pcar + $r1)\nSET @($d + $a) $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: pointer to struct (longs+array[constant]) ', () => {
        const code = `#pragma optimizationLevel 0
struct KOMBI { long driver; long collector; long passenger[4]; } ;
struct KOMBI car, *pcar;
long a, b, *c, d[2];
pcar=&car;\n
pcar->passenger[2]='Ze';
pcar->passenger[2]=a;
pcar->passenger[2]=*c;
pcar->passenger[2]=d[1];
pcar->passenger[2]=d[a];
pcar->passenger[2]=pcar->collector;
pcar->passenger[2]=pcar->passenger[1];\n
a=pcar->passenger[2];
*c=pcar->passenger[2];
d[1]=pcar->passenger[2];
d[a]=pcar->passenger[2];`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^const SET @car_passenger #0000000000000006\n^declare car_passenger_0\n^declare car_passenger_1\n^declare car_passenger_2\n^declare car_passenger_3\n^declare pcar\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #000000000000000f\n^declare d_0\n^declare d_1\n\nSET @pcar #0000000000000003\nSET @r0 #000000000000655a\nSET @r1 #0000000000000005\nSET @($pcar + $r1) $r0\nSET @r0 #0000000000000005\nSET @($pcar + $r0) $a\nSET @r0 $($c)\nSET @r1 #0000000000000005\nSET @($pcar + $r1) $r0\nSET @r0 #0000000000000005\nSET @($pcar + $r0) $d_1\nSET @r0 $($d + $a)\nSET @r1 #0000000000000005\nSET @($pcar + $r1) $r0\nSET @r1 #0000000000000001\nSET @r0 $($pcar + $r1)\nSET @r1 #0000000000000005\nSET @($pcar + $r1) $r0\nSET @r1 #0000000000000004\nSET @r0 $($pcar + $r1)\nSET @r1 #0000000000000005\nSET @($pcar + $r1) $r0\nSET @a #0000000000000005\nSET @a $($pcar + $a)\nSET @r1 #0000000000000005\nSET @r0 $($pcar + $r1)\nSET @($c) $r0\nSET @d_1 #0000000000000005\nSET @d_1 $($pcar + $d_1)\nSET @r1 #0000000000000005\nSET @r0 $($pcar + $r1)\nSET @($d + $a) $r0\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: pointer to struct (longs+array) address of', () => {
        const code = `#pragma optimizationLevel 0
struct KOMBI { long driver; long collector; long passenger[4]; } ;
struct KOMBI car[2], *pcar;
long a, b, *c, d[2];
pcar=&car[a];`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^const SET @car_0_passenger #0000000000000007\n^declare car_0_passenger_0\n^declare car_0_passenger_1\n^declare car_0_passenger_2\n^declare car_0_passenger_3\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^const SET @car_1_passenger #000000000000000e\n^declare car_1_passenger_0\n^declare car_1_passenger_1\n^declare car_1_passenger_2\n^declare car_1_passenger_3\n^declare pcar\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000017\n^declare d_0\n^declare d_1\n\nSET @r0 #0000000000000007\nMUL @r0 $a\nSET @r1 $car\nADD @r1 $r0\nSET @pcar $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: pointer to struct (longs+array[variable])', () => {
        const code = `#pragma optimizationLevel 0
struct KOMBI { long driver; long collector; long passenger[4]; } ;
struct KOMBI car, *pcar;
long a, b, *c, d[2];
pcar=&car;\n
pcar->passenger[a]='Ze';
pcar->passenger[a]=a;
pcar->passenger[a]=*c;
pcar->passenger[a]=d[1];
pcar->passenger[a]=d[a];
pcar->passenger[a]=pcar->collector;
pcar->passenger[a]=pcar->passenger[b];\n
a=pcar->passenger[b];
*c=pcar->passenger[b];
d[1]=pcar->passenger[b];
d[a]=pcar->passenger[b];`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^const SET @car_passenger #0000000000000006\n^declare car_passenger_0\n^declare car_passenger_1\n^declare car_passenger_2\n^declare car_passenger_3\n^declare pcar\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #000000000000000f\n^declare d_0\n^declare d_1\n\nSET @pcar #0000000000000003\nSET @r0 $a\nSET @r1 #0000000000000003\nADD @r0 $r1\nSET @r1 #000000000000655a\nSET @($pcar + $r0) $r1\nSET @r0 $a\nSET @r1 #0000000000000003\nADD @r0 $r1\nSET @($pcar + $r0) $a\nSET @r0 $a\nSET @r1 #0000000000000003\nADD @r0 $r1\nSET @r1 $($c)\nSET @($pcar + $r0) $r1\nSET @r0 $a\nSET @r1 #0000000000000003\nADD @r0 $r1\nSET @($pcar + $r0) $d_1\nSET @r0 $a\nSET @r1 #0000000000000003\nADD @r0 $r1\nSET @r1 $($d + $a)\nSET @($pcar + $r0) $r1\nSET @r0 $a\nSET @r1 #0000000000000003\nADD @r0 $r1\nSET @r2 #0000000000000001\nSET @r1 $($pcar + $r2)\nSET @($pcar + $r0) $r1\nSET @r0 $a\nSET @r1 #0000000000000003\nADD @r0 $r1\nSET @r1 $b\nSET @r2 #0000000000000003\nADD @r1 $r2\nSET @r2 $($pcar + $r1)\nSET @($pcar + $r0) $r2\nSET @a $b\nSET @r0 #0000000000000003\nADD @a $r0\nSET @a $($pcar + $a)\nSET @r0 $b\nSET @r1 #0000000000000003\nADD @r0 $r1\nSET @r1 $($pcar + $r0)\nSET @($c) $r1\nSET @d_1 $b\nSET @r0 #0000000000000003\nADD @d_1 $r0\nSET @d_1 $($pcar + $d_1)\nSET @r0 $b\nSET @r1 #0000000000000003\nADD @r0 $r1\nSET @r1 $($pcar + $r0)\nSET @($d + $a) $r1\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Recursive struct pointer declaration', () => {
        const code = '#pragma optimizationLevel 0\nstruct KOMBI { long driver; long collector; struct KOMBI *next; } ; struct KOMBI car, *pcar, *pnext; pcar=&car; pnext=pcar->next->next;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_next\n^declare pcar\n^declare pnext\n\nSET @pcar #0000000000000003\nSET @r1 #0000000000000002\nSET @r0 $($pcar + $r1)\nSET @r1 #0000000000000002\nSET @pnext $($r0 + $r1)\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: NOT IMPLEMMENTED. Arrays of struct pointers', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nstruct KOMBI { long driver; long collector; long passenger; } ; struct KOMBI car, *pcar[2];'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})

describe('Logical operations with structs', () => {
    it('should compile: simple member', () => {
        const code = `#pragma optimizationLevel 0
struct KOMBI { long driver; long collector; long passenger; } car;
long a, b;
if (car.driver=='Ze') { b++; }
if (a<=car.collector) { b--; }`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^declare a\n^declare b\n\nSET @r0 #000000000000655a\nBNE $car_driver $r0 :__if1_endif\n__if1_start:\nINC @b\n__if1_endif:\nBGT $a $car_collector :__if2_endif\n__if2_start:\nDEC @b\n__if2_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: constant array struct', () => {
        const code = `#pragma optimizationLevel 0
struct KOMBI { long driver; long collector; long passenger; } car[2];
long a, b;
if (car[1].driver=='Ze') { b++; }
if (a<=car[0].collector) { b--; }`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^declare a\n^declare b\n\nSET @r0 #000000000000655a\nBNE $car_1_driver $r0 :__if1_endif\n__if1_start:\nINC @b\n__if1_endif:\nBGT $a $car_0_collector :__if2_endif\n__if2_start:\nDEC @b\n__if2_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: variable array struct', () => {
        const code = `#pragma optimizationLevel 0
struct KOMBI { long driver; long collector; long passenger; } car[2];
long a, b;
if (car[b].driver=='Ze') { b++; }
if (a<=car[b].collector) { b--; }`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^declare a\n^declare b\n\nSET @r0 #0000000000000003\nMUL @r0 $b\nSET @r1 $($car + $r0)\nSET @r0 #000000000000655a\nBNE $r1 $r0 :__if1_endif\n__if1_start:\nINC @b\n__if1_endif:\nSET @r0 #0000000000000003\nMUL @r0 $b\nINC @r0\nSET @r1 $($car + $r0)\nBGT $a $r1 :__if2_endif\n__if2_start:\nDEC @b\n__if2_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: variable array struct (separated definition)', () => {
        const code = `#pragma optimizationLevel 0
struct KOMBI { long driver; long collector; long passenger; }; struct KOMBI car[2];
long a, b;
if (car[b].driver=='Ze') { b++; }
if (a<=car[b].collector) { b--; }`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^declare a\n^declare b\n\nSET @r0 #0000000000000003\nMUL @r0 $b\nSET @r1 $($car + $r0)\nSET @r0 #000000000000655a\nBNE $r1 $r0 :__if1_endif\n__if1_start:\nINC @b\n__if1_endif:\nSET @r0 #0000000000000003\nMUL @r0 $b\nINC @r0\nSET @r1 $($car + $r0)\nBGT $a $r1 :__if2_endif\n__if2_start:\nDEC @b\n__if2_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: constant array member', () => {
        const code = `#pragma optimizationLevel 0
struct KOMBI { long driver; long collector; long passenger[3]; } car;
long a, b;
if (car.passenger[0]=='Ze') { b++; }
if (a<=car.passenger[2]) { b--; }`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^const SET @car_passenger #0000000000000006\n^declare car_passenger_0\n^declare car_passenger_1\n^declare car_passenger_2\n^declare a\n^declare b\n\nSET @r0 #000000000000655a\nBNE $car_passenger_0 $r0 :__if1_endif\n__if1_start:\nINC @b\n__if1_endif:\nBGT $a $car_passenger_2 :__if2_endif\n__if2_start:\nDEC @b\n__if2_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = `#pragma optimizationLevel 0
struct KOMBI { long driver; long collector; long passenger[3]; } car[2];
long a, b;
if (car[0].passenger[0]=='Ze') { b++; }
if (a<=car[b].passenger[2]) { b--; }`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^const SET @car_0_passenger #0000000000000007\n^declare car_0_passenger_0\n^declare car_0_passenger_1\n^declare car_0_passenger_2\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^const SET @car_1_passenger #000000000000000d\n^declare car_1_passenger_0\n^declare car_1_passenger_1\n^declare car_1_passenger_2\n^declare a\n^declare b\n\nSET @r0 #000000000000655a\nBNE $car_0_passenger_0 $r0 :__if1_endif\n__if1_start:\nINC @b\n__if1_endif:\nSET @r0 #0000000000000006\nMUL @r0 $b\nSET @r1 #0000000000000003\nADD @r0 $r1\nINC @r0\nINC @r0\nSET @r1 $($car + $r0)\nBGT $a $r1 :__if2_endif\n__if2_start:\nDEC @b\n__if2_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: mix', () => {
        const code = `#pragma optimizationLevel 0
struct KOMBI { long driver; long collector; long passenger[3]; } car[2];
long a, b;
if (car[0].passenger[b]=='Ze') { b++; }
if (a<=car[b].passenger[a]) { b--; }`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^const SET @car_0_passenger #0000000000000007\n^declare car_0_passenger_0\n^declare car_0_passenger_1\n^declare car_0_passenger_2\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^const SET @car_1_passenger #000000000000000d\n^declare car_1_passenger_0\n^declare car_1_passenger_1\n^declare car_1_passenger_2\n^declare a\n^declare b\n\nSET @r0 $($car_0_passenger + $b)\nSET @r1 #000000000000655a\nBNE $r0 $r1 :__if1_endif\n__if1_start:\nINC @b\n__if1_endif:\nSET @r0 #0000000000000006\nMUL @r0 $b\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $a\nSET @r1 $($car + $r0)\nBGT $a $r1 :__if2_endif\n__if2_start:\nDEC @b\n__if2_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: struct pointer', () => {
        const code = `#pragma optimizationLevel 0
struct KOMBI { long driver; long collector; long passenger; } ;
struct KOMBI car[2], *pcar;
long a, b;
pcar=&car[1];
if (pcar->driver=='Ze') { b++; }
if (a<=pcar->collector) { b--; }`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^declare pcar\n^declare a\n^declare b\n\nSET @pcar #0000000000000007\nSET @r0 $($pcar)\nSET @r1 #000000000000655a\nBNE $r0 $r1 :__if1_endif\n__if1_start:\nINC @b\n__if1_endif:\nSET @r1 #0000000000000001\nSET @r0 $($pcar + $r1)\nBGT $a $r0 :__if2_endif\n__if2_start:\nDEC @b\n__if2_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: struct declaration inside function', () => {
        const code = `search(2);
struct PLAYER * search(long playerAddress) {
    struct PLAYER {
        long address, balance, VDLS;
    } *playerPtr, players[2];
    long nPlayers;
    struct PLAYER * foundPlayer;
    nPlayers = sizeof(struct PLAYER);
    return NULL;
}`
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare search_playerAddress\n^declare search_playerPtr\n^declare search_players\n^const SET @search_players #0000000000000006\n^declare search_players_0_address\n^declare search_players_0_balance\n^declare search_players_0_VDLS\n^declare search_players_1_address\n^declare search_players_1_balance\n^declare search_players_1_VDLS\n^declare search_nPlayers\n^declare search_foundPlayer\n\nSET @r0 #0000000000000002\nPSH $r0\nJSR :__fn_search\nPOP @r0\nFIN\n\n__fn_search:\nPOP @search_playerAddress\nSET @search_nPlayers #0000000000000003\nCLR @r0\nPSH $r0\nRET\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
})

describe('structs (pointer / arrays) wrong usage', () => {
    test('should throw: array declaration without struct definition', () => {
        expect(() => {
            const code = '#pragma optimizationLevel 0\nstruct KOMBI car[2];'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})
