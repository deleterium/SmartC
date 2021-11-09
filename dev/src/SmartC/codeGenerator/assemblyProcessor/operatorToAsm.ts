
import { TOKEN, MEMORY_SLOT } from '../../typings/syntaxTypes'
import { GENCODE_AUXVARS } from '../typings/codeGeneratorTypes'
import { utils } from '../utils'
import { createInstruction, flattenMemory } from './createInstruction'

export function operatorToAsm (auxVars: GENCODE_AUXVARS, objoperator: TOKEN, param1?: MEMORY_SLOT, param2?: MEMORY_SLOT, rLogic?:boolean, jpFalse?: string, jpTrue?:string): string {
    let retinstr = ''

    let allowOptimization = false
    let optimized = false

    if (objoperator.type !== 'Operator' && objoperator.type !== 'SetOperator') {
        throw new Error('Internal error')
    }

    if (param1 === undefined || param2 === undefined) {
        throw new TypeError(`At line: ${objoperator.line}. Missing parameters. BugReport please.`)
    }

    if (param1.type === 'constant') {
        throw new TypeError(`At line: ${objoperator.line}. Can not createInstruction. BugReport please.`)
    }
    const TmpMemObj1 = flattenMemory(auxVars, param1, objoperator.line)
    retinstr += TmpMemObj1.asmCode

    if (param2.type === 'constant') {
        allowOptimization = true
    }
    const TmpMemObj2 = flattenMemory(auxVars, param2, objoperator.line)
    retinstr += TmpMemObj2.asmCode

    if (allowOptimization === true) {
        function removeLastButOne () {
            if (retinstr.length > 0) {
                const codes = retinstr.split('\n')
                codes.pop()
                codes.pop()
                codes.push('')
                retinstr = codes.join('\n')
            }
        }
        // if add new condition here, add also in checkOperatorOptimization code oKSx4ab
        // here we can have optimizations for all operations.
        if (objoperator.value === '+' || objoperator.value === '+=') {
            if (param2.hexContent === '0000000000000000') {
                auxVars.freeRegister(TmpMemObj2.FlatMem.address)
                return ''
            }
            if (param2.hexContent === '0000000000000001') {
                auxVars.freeRegister(TmpMemObj2.FlatMem.address)
                removeLastButOne()
                retinstr += createInstruction(auxVars, utils.genIncToken(), TmpMemObj1.FlatMem)
                optimized = true
            }
            if (param2.hexContent === '0000000000000002') {
                auxVars.freeRegister(TmpMemObj2.FlatMem.address)
                removeLastButOne()
                const OptMem = auxVars.memory.find(MEM => MEM.asmName === 'n2' && MEM.hexContent === '0000000000000002')
                if (OptMem === undefined) {
                    retinstr += createInstruction(auxVars, utils.genIncToken(), TmpMemObj1.FlatMem)
                    retinstr += createInstruction(auxVars, utils.genIncToken(), TmpMemObj1.FlatMem)
                    optimized = true
                }
            }
        } else if (objoperator.value === '-' || objoperator.value === '-=') {
            if (param2.hexContent === '0000000000000000') {
                auxVars.freeRegister(TmpMemObj2.FlatMem.address)
                return ''
            }
            if (param2.hexContent === '0000000000000001') {
                auxVars.freeRegister(TmpMemObj2.FlatMem.address)
                removeLastButOne()
                retinstr += createInstruction(auxVars, utils.genDecToken(), TmpMemObj1.FlatMem)
                optimized = true
            }
        } else if (objoperator.value === '*' || objoperator.value === '*=') {
            if (param2.hexContent === '0000000000000000') {
                auxVars.freeRegister(TmpMemObj2.FlatMem.address)
                removeLastButOne()
                retinstr += createInstruction(auxVars, utils.genAssignmentToken(), TmpMemObj1.FlatMem, param2)
                optimized = true
            }
            if (param2.hexContent === '0000000000000001') {
                auxVars.freeRegister(TmpMemObj2.FlatMem.address)
                return ''
            }
        } else if (objoperator.value === '/' || objoperator.value === '/=') {
            if (param2.hexContent === '0000000000000001') {
                auxVars.freeRegister(TmpMemObj2.FlatMem.address)
                return ''
            }
        }
    }

    if (optimized === false) {
        if (objoperator.value === '+' || objoperator.value === '+=') {
            retinstr += 'ADD'
        } else if (objoperator.value === '-' || objoperator.value === '-=') {
            retinstr += 'SUB'
        } else if (objoperator.value === '*' || objoperator.value === '*=') {
            retinstr += 'MUL'
        } else if (objoperator.value === '/' || objoperator.value === '/=') {
            retinstr += 'DIV'
        } else if (objoperator.value === '|' || objoperator.value === '|=') {
            retinstr += 'BOR'
        } else if (objoperator.value === '&' || objoperator.value === '&=') {
            retinstr += 'AND'
        } else if (objoperator.value === '^' || objoperator.value === '^=') {
            retinstr += 'XOR'
        } else if (objoperator.value === '%' || objoperator.value === '%=') {
            retinstr += 'MOD'
        } else if (objoperator.value === '<<' || objoperator.value === '<<=') {
            retinstr += 'SHL'
        } else if (objoperator.value === '>>' || objoperator.value === '>>=') {
            retinstr += 'SHR'
        } else {
            throw new TypeError('At line: ' + objoperator.line + '.Operator not supported ' + objoperator.value)
        }

        retinstr += ' @' + TmpMemObj1.FlatMem.asmName + ' $' + TmpMemObj2.FlatMem.asmName + '\n'

        auxVars.freeRegister(TmpMemObj2.FlatMem.address)
    }

    if (TmpMemObj1.isNew === true) {
        retinstr += createInstruction(auxVars, utils.genAssignmentToken(), param1, TmpMemObj1.FlatMem)
        auxVars.freeRegister(TmpMemObj1.FlatMem.address)
    }

    return retinstr
}
