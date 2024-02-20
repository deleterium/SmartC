import { CONTRACT } from '../../typings/contractTypes'
import { TOKEN, MEMORY_SLOT } from '../../typings/syntaxTypes'
import { flattenMemory } from './createInstruction'

/** Create assembly intructions for comparisions.
 * @returns the assembly code necessary for branch operations
 */
export default function comparisionToAsm (
    Program: CONTRACT, OperatorToken: TOKEN, LeftMem: MEMORY_SLOT, RightMem: MEMORY_SLOT,
    rLogic:boolean, jpFalse: string, jpTrue:string
): string {
    let assemblyCode = ''
    let jumpToLabel = jpFalse
    if (rLogic) {
        jumpToLabel = jpTrue
    }
    const FlatLeft = flattenMemory(Program, LeftMem, OperatorToken.line)
    if (FlatLeft.isNew) {
        if (LeftMem.Offset?.type === 'variable') {
            Program.Context.freeRegister(LeftMem.Offset.addr)
        }
        Program.Context.freeRegister(LeftMem.address)
    }
    if (RightMem.type === 'constant' && RightMem.hexContent === '0000000000000000' &&
        (OperatorToken.value === '==' || OperatorToken.value === '!=')) {
        assemblyCode += chooseBranchZero(OperatorToken.value, rLogic)
        assemblyCode += ` $${FlatLeft.FlatMem.asmName} :${jumpToLabel}\n`
        if (FlatLeft.isNew === true) {
            Program.Context.freeRegister(FlatLeft.FlatMem.address)
        }
        return FlatLeft.asmCode + assemblyCode
    }
    const FlatRight = flattenMemory(Program, RightMem, OperatorToken.line)
    assemblyCode += chooseBranch(OperatorToken.value, rLogic)
    assemblyCode += ` $${FlatLeft.FlatMem.asmName} $${FlatRight.FlatMem.asmName} :${jumpToLabel}\n`
    if (FlatLeft.isNew === true) {
        Program.Context.freeRegister(FlatLeft.FlatMem.address)
    }
    if (FlatRight.isNew === true) {
        Program.Context.freeRegister(FlatRight.FlatMem.address)
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
