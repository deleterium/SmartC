import { assertNotUndefined } from '../../repository/repository'
import { TOKEN, MEMORY_SLOT } from '../../typings/syntaxTypes'
import { FLATTEN_MEMORY_RETURN_OBJECT, GENCODE_AUXVARS } from '../codeGeneratorTypes'
import { flattenMemory } from './createInstruction'

/**
 * Create instruction for keywords asm, break, continue, exit, goto, halt, label, return and sleep.
 */
export default function keywordToAsm (
    AuxVars: GENCODE_AUXVARS, OperatorToken: TOKEN, FlatMem?: MEMORY_SLOT
): string {
    let TmpMemObj: FLATTEN_MEMORY_RETURN_OBJECT
    switch (OperatorToken.value) {
    case 'break':
        return `JMP :%generateUtils.getLatestLoopId()%_${OperatorToken.value}\n`
    case 'continue':
        return `JMP :%generateUtils.getLatestPureLoopId()%_${OperatorToken.value}\n`
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
        TmpMemObj = flattenMemory(AuxVars, FlatMem, OperatorToken.line)
        TmpMemObj.asmCode += `PSH $${TmpMemObj.FlatMem.asmName}\n`
        TmpMemObj.asmCode += 'RET\n'
        AuxVars.freeRegister(FlatMem.address)
        if (TmpMemObj.isNew === true) {
            AuxVars.freeRegister(TmpMemObj.FlatMem.address)
        }
        return TmpMemObj.asmCode
    case 'sleep':
        if (FlatMem === undefined) {
            return 'SLP\n'
        }
        TmpMemObj = flattenMemory(AuxVars, assertNotUndefined(FlatMem), OperatorToken.line)
        TmpMemObj.asmCode += `SLP $${TmpMemObj.FlatMem.asmName}\n`
        AuxVars.freeRegister(FlatMem.address)
        if (TmpMemObj.isNew === true) {
            AuxVars.freeRegister(TmpMemObj.FlatMem.address)
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
