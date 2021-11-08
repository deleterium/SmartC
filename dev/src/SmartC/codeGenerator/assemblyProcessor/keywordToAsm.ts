import { TOKEN, MEMORY_SLOT } from '../../typings/syntaxTypes'
import { GENCODE_AUXVARS } from '../typings/codeGeneratorTypes'
import { flattenMemory } from './opToAssembly'

export function keywordToAsm (auxVars: GENCODE_AUXVARS, objoperator: TOKEN, param1?: MEMORY_SLOT, param2?: MEMORY_SLOT, rLogic?:boolean, jpFalse?: string, jpTrue?:string): string {
    if (objoperator.value === 'break' || objoperator.value === 'continue') {
        return `JMP :%generateUtils.getLatestLoopId()%_${objoperator.value}\n`
    }
    if (objoperator.value === 'label') {
        return objoperator.extValue + ':\n'
    }
    if (objoperator.value === 'goto') {
        if (param1 === undefined) {
            throw new TypeError(`At line: ${objoperator.line}. Missing parameter for goto. BugReport please.`)
        }
        return 'JMP :' + param1.name + '\n'
    }
    if (objoperator.value === 'halt') {
        return 'STP\n'
    }
    if (objoperator.value === 'exit') {
        return 'FIN\n'
    }
    if (objoperator.value === 'return' || objoperator.value === 'sleep') {
        if (param1 === undefined) {
            if (objoperator.value === 'return') {
                return 'RET\n'
            }
            throw new TypeError(`At line: ${objoperator.line}. Missing parameter for sleep. BugReport please.`)
        }

        let retinstr = ''
        const TmpMemObj = flattenMemory(auxVars, param1, objoperator.line)
        retinstr += TmpMemObj.instructionset

        if (objoperator.value === 'return') {
            retinstr += 'PSH $' + TmpMemObj.MoldedObj.asmName + '\n'
            retinstr += 'RET\n'
        } else if (objoperator.value === 'sleep') {
            retinstr += 'SLP $' + TmpMemObj.MoldedObj.asmName + '\n'
        }

        auxVars.freeRegister(param1.address)
        if (TmpMemObj.isNew === true) {
            auxVars.freeRegister(TmpMemObj.MoldedObj.address)
        }
        return retinstr
    }
    if (objoperator.value === 'asm') {
        if (objoperator.extValue === undefined) {
            throw new TypeError(`At line: ${objoperator.line}. Missing extValue for asm. BugReport please.`)
        }

        let lines = objoperator.extValue.split('\n')
        lines = lines.map(value => value.trim())
        return lines.join('\n').trim() + '\n'
    }
    throw new Error('Internal error.')
}
