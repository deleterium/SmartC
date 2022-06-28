import { SmartC } from '../smartc'

describe('Warnings', () => {
    it('should not warn: add or sub pointers with longs values (struct_ptr)', () => {
        const code = 'search(2);\nstruct PLAYER { long address, balance, VDLS; } *playerPtr, players[2];\nstruct PLAYER * search(long playerAddress) {\nlong nPlayers;\n    struct PLAYER * foundPlayer;\n    foundPlayer = &players[0];\n    for (long auxI = 0; auxI < nPlayers; auxI++) {\n        if (foundPlayer->address == playerAddress) {\n            return foundPlayer;\n        }\n        foundPlayer += (sizeof(struct PLAYER));\n        foundPlayer = foundPlayer + (sizeof(struct PLAYER));\n        foundPlayer++;\n    }\n    return NULL;\n}'
        const warnings = ''
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getMachineCode().Warnings).toBe(warnings)
    })
})
