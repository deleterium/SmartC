import { assertNotUndefined } from '../../repository/repository'
import { CONTRACT } from '../../typings/contractTypes'
import { TOKEN, MEMORY_SLOT } from '../../typings/syntaxTypes'
import { FLATTEN_MEMORY_RETURN_OBJECT } from '../codeGeneratorTypes'
import { flattenMemory } from './createInstruction'

/**
 * Create instruction for keywords asm, break, continue, exit, goto, halt, label, return and sleep.
 */
export default function keywordToAsm (
    Program: CONTRACT, OperatorToken: TOKEN, FlatMem?: MEMORY_SLOT
): string {
    let TmpMemObj: FLATTEN_MEMORY_RETURN_OBJECT
    switch (OperatorToken.value) {
    case 'break':
        return `JMP :${Program.Context.getLatestLoopID()}_${OperatorToken.value}\n`
    case 'continue':
        return `JMP :${Program.Context.getLatestPureLoopID()}_${OperatorToken.value}\n`
    case 'goto':
        return `JMP :${assertNotUndefined(FlatMem).name}\n`
    case 'halt':
        return 'STP\n'
    case 'exit':
        return 'FIN\n'
    case 'return':
        if (FlatMem === undefined) {
            return 'RET\n'
        }
        TmpMemObj = flattenMemory(Program, FlatMem, OperatorToken.line)
        TmpMemObj.asmCode += `SET @r0 $${TmpMemObj.FlatMem.asmName}\n`
        TmpMemObj.asmCode += 'RET\n'
        Program.Context.freeRegister(FlatMem.address)
        if (TmpMemObj.isNew === true) {
            Program.Context.freeRegister(TmpMemObj.FlatMem.address)
        }
        return TmpMemObj.asmCode
    case 'sleep':
        if (FlatMem === undefined) {
            return 'SLP\n'
        }
        TmpMemObj = flattenMemory(Program, assertNotUndefined(FlatMem), OperatorToken.line)
        TmpMemObj.asmCode += `SLP $${TmpMemObj.FlatMem.asmName}\n`
        Program.Context.freeRegister(FlatMem.address)
        if (TmpMemObj.isNew === true) {
            Program.Context.freeRegister(TmpMemObj.FlatMem.address)
        }
        return TmpMemObj.asmCode
    case 'asm': {
        let lines = assertNotUndefined(OperatorToken.extValue).split('\n')
        lines = lines.map(value => value.trim())
        return lines.join('\n').trim() + '\n'
    }
    default:
        throw new Error('Internal error.')
    }
}
