import { TOKEN, MEMORY_SLOT } from '../../typings/syntaxTypes'
import { GENCODE_AUXVARS } from '../typings/codeGeneratorTypes'
import { flattenMemory } from './createInstruction'

/** Create assembly intructions for comparisions.
 * @returns the assembly code necessary for branch operations
 */
export function comparisionToAsm (
    AuxVars: GENCODE_AUXVARS, OperatorToken: TOKEN, LeftMem: MEMORY_SLOT, RightMem: MEMORY_SLOT,
    rLogic:boolean, jpFalse: string, jpTrue:string
): string {
    let assemblyCode = ''
    let jumpToLabel = jpFalse
    if (rLogic) {
        jumpToLabel = jpTrue
    }
    const FlatLeft = flattenMemory(AuxVars, LeftMem, OperatorToken.line)
    if (FlatLeft.isNew) {
        if (LeftMem.Offset?.type === 'variable') {
            AuxVars.freeRegister(LeftMem.Offset.addr)
        }
        AuxVars.freeRegister(LeftMem.address)
    }
    if (RightMem.type === 'constant' && RightMem.hexContent === '0000000000000000' &&
        (OperatorToken.value === '==' || OperatorToken.value === '!=')) {
        assemblyCode += chooseBranchZero(OperatorToken.value, rLogic)
        assemblyCode += ` $${FlatLeft.FlatMem.asmName} :${jumpToLabel}\n`
        if (FlatLeft.isNew === true) {
            AuxVars.freeRegister(FlatLeft.FlatMem.address)
        }
        return FlatLeft.asmCode + assemblyCode
    }
    const FlatRight = flattenMemory(AuxVars, RightMem, OperatorToken.line)
    assemblyCode += chooseBranch(OperatorToken.value, rLogic)
    assemblyCode += ` $${FlatLeft.FlatMem.asmName} $${FlatRight.FlatMem.asmName} :${jumpToLabel}\n`
    if (FlatLeft.isNew === true) {
        AuxVars.freeRegister(FlatLeft.FlatMem.address)
    }
    if (FlatRight.isNew === true) {
        AuxVars.freeRegister(FlatRight.FlatMem.address)
    }
    return FlatLeft.asmCode + FlatRight.asmCode + assemblyCode
}

function chooseBranch (value: string, cbRevLogic: boolean): string {
    let operator = ''
    switch (value) {
    case '>': operator = 'BLE'; break
    case '<': operator = 'BGE'; break
    case '>=': operator = 'BLT'; break
    case '<=': operator = 'BGT'; break
    case '==': operator = 'BNE'; break
    case '!=': operator = 'BEQ'; break
    }
    if (cbRevLogic === false) {
        return operator
    }
    switch (value) {
    case '>': return 'BGT'
    case '<': return 'BLT'
    case '>=': return 'BGE'
    case '<=': return 'BLE'
    case '==': return 'BEQ'
    case '!=': return 'BNE'
    }
    return 'Internal error.'
}

function chooseBranchZero (value: '=='|'!=', cbRevLogic: boolean) : string {
    if (cbRevLogic) {
        if (value === '==') return 'BZR'
        return 'BNZ'
    }
    if (value === '==') return 'BNZ'
    return 'BZR'
}
