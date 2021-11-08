import { TOKEN, MEMORY_SLOT } from '../../typings/syntaxTypes'
import { GENCODE_AUXVARS } from '../typings/codeGeneratorTypes'
import { flattenMemory } from './opToAssembly'

export function comparisionToAsm (auxVars: GENCODE_AUXVARS, objoperator: TOKEN, param1?: MEMORY_SLOT, param2?: MEMORY_SLOT, rLogic?:boolean, jpFalse?: string, jpTrue?:string): string {
    let retinstr = ''

    if (param1 === undefined || param2 === undefined || rLogic === undefined || jpFalse === undefined || jpTrue === undefined) {
        throw new TypeError(`At line: ${objoperator.line}. Missing parameters. BugReport please.`)
    }

    let jump = jpFalse
    if (rLogic) {
        jump = jpTrue
    }

    const TmpMemObj1 = flattenMemory(auxVars, param1, objoperator.line)
    retinstr += TmpMemObj1.instructionset
    if (TmpMemObj1.isNew) {
        if (param1.Offset?.type === 'variable') {
            auxVars.freeRegister(param1.Offset.addr)
        }
        auxVars.freeRegister(param1.address)
    }

    if (param2.type === 'constant' && param2.hexContent === '0000000000000000' && (objoperator.value === '!=' || objoperator.value === '==')) {
        retinstr += chooseBranch(objoperator.value, true, rLogic)
        retinstr += ' $' + TmpMemObj1.MoldedObj.asmName + ' :' + jump + '\n'
        if (TmpMemObj1.isNew === true) {
            auxVars.freeRegister(TmpMemObj1.MoldedObj.address)
        }
        return retinstr
    }

    const TmpMemObj2 = flattenMemory(auxVars, param2, objoperator.line)
    retinstr += TmpMemObj2.instructionset
    retinstr += chooseBranch(objoperator.value, false, rLogic)
    retinstr += ' $' + TmpMemObj1.MoldedObj.asmName + ' $' + TmpMemObj2.MoldedObj.asmName + ' :' + jump + '\n'

    if (TmpMemObj1.isNew === true) {
        auxVars.freeRegister(TmpMemObj1.MoldedObj.address)
    }
    if (TmpMemObj2 !== undefined && TmpMemObj2.isNew === true) {
        auxVars.freeRegister(TmpMemObj2.MoldedObj.address)
    }

    return retinstr
}

function chooseBranch (value: string, useBZR: boolean, cbRevLogic: boolean) {
    if (useBZR) {
        if (cbRevLogic) {
            if (value === '==') return 'BZR'
            if (value === '!=') return 'BNZ'
        } else {
            if (value === '==') return 'BNZ'
            if (value === '!=') return 'BZR'
        }
        throw new TypeError(`Invalid use of Branch Zero: ${value}`)
    } else {
        if (cbRevLogic) {
            if (value === '>') return 'BGT'
            if (value === '>=') return 'BGE'
            if (value === '<') return 'BLT'
            if (value === '<=') return 'BLE'
            if (value === '==') return 'BEQ'
            if (value === '!=') return 'BNE'
        } else {
            if (value === '>') return 'BLE'
            if (value === '>=') return 'BLT'
            if (value === '<') return 'BGE'
            if (value === '<=') return 'BGT'
            if (value === '==') return 'BNE'
            if (value === '!=') return 'BEQ'
        }
    }
    throw new TypeError(`Unknow branch operation: ${value}`)
}
