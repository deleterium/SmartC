import { SmartC } from '../smartc'

describe('Warnings', () => {
    it('should not warn: add or sub pointers with longs values (struct_ptr)', () => {
        const code = 'search(2);\nstruct PLAYER { long address, balance, VDLS; } players[2];\nstruct PLAYER * search(long playerAddress) {\nlong nPlayers=0;\n    struct PLAYER * foundPlayer;\n    foundPlayer = &players[0];\n    for (long auxI = 0; auxI < nPlayers; auxI++) {\n        if (foundPlayer->address == playerAddress) {\n            return foundPlayer;\n        }\n        foundPlayer += (sizeof(struct PLAYER));\n        foundPlayer = foundPlayer + (sizeof(struct PLAYER));\n        foundPlayer++;\n    }\n    return NULL;\n}'
        const warnings = ''
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getMachineCode().Warnings).toBe(warnings)
    })
    it('should warn: longs used before initialization', () => {
        const code = 'struct PLAYER { long sb; } player;\nlong a, b;\nlong message[4];\n\na+=1;\na = message[b];\na = player.sb;\n'
        const warnings = "Warning: at line 5:1. Variable 'a' is used but not initialized.\nWarning: at line 6:13. Variable 'b' is used but not initialized.\nWarning: at line 7:12. Variable 'player_sb' is used but not initialized."
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getMachineCode().Warnings).toBe(warnings)
    })
    it('should not warn: same as before but initialized', () => {
        const code = 'struct PLAYER { long sb; } player;\nlong a, b;\nlong message[4];\n\na=b=1;\na = message[b];\nplayer.sb=message[2];\na = player.sb;\n'
        const warnings = ''
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getMachineCode().Warnings).toBe(warnings)
    })
    it('should compile with warning: unused global variable', () => {
        const code = 'long la=0, lb; fixed fa, fb=0.0; fa = fb - (fixed)la;'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare f100000000\n^const SET @f100000000 #0000000005f5e100\n^declare la\n^declare lb\n^declare fa\n^declare fb\n\nCLR @la\nCLR @fb\nSET @r0 $la\nMUL @r0 $f100000000\nSET @fa $fb\nSUB @fa $r0\nFIN\n'
        const warnings = "Warning: Unused global variable 'lb'."
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
        expect(compiler.getMachineCode().Warnings).toBe(warnings)
    })
    it('should warn: Variable not used inside a function', () => {
        const code = 'search(2); struct PLAYER { long address, balance, VDLS; } *playerPtr, players[2]; struct PLAYER * search(long playerAddress) {    long nPlayers=0;    struct PLAYER * foundPlayer;    playerPtr = &players[0];    for (long auxI = 0; auxI < nPlayers; auxI++) {        if (playerPtr->address == playerAddress) {            return playerPtr;        }        playerPtr += (sizeof(struct PLAYER));        playerPtr = playerPtr + (sizeof(struct PLAYER));        playerPtr++;    }    return NULL;}'
        const warnings = "Warning: Unused variable 'foundPlayer' in function 'search'."
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getMachineCode().Warnings).toBe(warnings)
    })
})
