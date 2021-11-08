
import { TOKEN, MEMORY_SLOT } from '../../typings/syntaxTypes'
import { GENCODE_AUXVARS } from '../typings/codeGeneratorTypes'

export function unaryOperatorToAsm (auxVars: GENCODE_AUXVARS, objoperator: TOKEN, param1?: MEMORY_SLOT, param2?: MEMORY_SLOT, rLogic?:boolean, jpFalse?: string, jpTrue?:string): string {
    if (param1 === undefined) {
        throw new TypeError(`At line: ${objoperator.line}. Missing parameters. BugReport please.`)
    }

    if (objoperator.value === '++') {
        return 'INC @' + param1.asmName + '\n'
    }
    if (objoperator.value === '--') {
        return 'DEC @' + param1.asmName + '\n'
    }
    if (objoperator.value === '~') {
        return 'NOT @' + param1.asmName + '\n'
    }
    if (objoperator.value === '+') {
        return ''
    }
    throw new TypeError('At line: ' + objoperator.line + '. Unary operator not supported: ' + objoperator.value)
}
