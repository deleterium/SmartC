import { SmartC } from '../smartc'

describe('Warnings', () => {
    it('should not warn: add or sub pointers with longs values (struct_ptr)', () => {
        const code = 'search(2);\nstruct PLAYER { long address, balance, VDLS; } *playerPtr, players[2];\nstruct PLAYER * search(long playerAddress) {\nlong nPlayers=0;\n    struct PLAYER * foundPlayer;\n    foundPlayer = &players[0];\n    for (long auxI = 0; auxI < nPlayers; auxI++) {\n        if (foundPlayer->address == playerAddress) {\n            return foundPlayer;\n        }\n        foundPlayer += (sizeof(struct PLAYER));\n        foundPlayer = foundPlayer + (sizeof(struct PLAYER));\n        foundPlayer++;\n    }\n    return NULL;\n}'
        const warnings = ''
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getMachineCode().Warnings).toBe(warnings)
    })
    it('should warn: longs used before initialization', () => {
        const code = 'struct PLAYER { long sa, sb; } player;\nlong a, b;\nlong message[4];\n\na+=1;\na = message[b];\na = player.sb;\n'
        const warnings = "Warning: at line 5. Variable 'a' is used but not initialized.\nWarning: at line 6. Variable 'b' is used but not initialized.\nWarning: at line 7. Variable 'player_sb' is used but not initialized."
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getMachineCode().Warnings).toBe(warnings)
    })
    it('should not warn: same as before but initialized', () => {
        const code = 'struct PLAYER { long sa, sb; } player;\nlong a, b;\nlong message[4];\n\na=b=1;\na = message[b];\nplayer.sb=message[2];\na = player.sb;\n'
        const warnings = ''
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getMachineCode().Warnings).toBe(warnings)
    })
})
