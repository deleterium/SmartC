
import { assertExpression } from '../../repository/repository'
import { TOKEN, MEMORY_SLOT } from '../../typings/syntaxTypes'
import { GENCODE_AUXVARS } from '../typings/codeGeneratorTypes'
import { utils } from '../utils'
import { createInstruction, flattenMemory } from './createInstruction'

/**
 * Create assembly intructions for binary operators or SetOperators.
 * @returns the assembly code necessary for the assignment to happen
 */
export function operatorToAsm (
    AuxVars: GENCODE_AUXVARS, OperatorToken: TOKEN, LeftMem: MEMORY_SLOT, RightMem: MEMORY_SLOT
) : string {
    const FlatLeft = flattenMemory(AuxVars, LeftMem, OperatorToken.line)
    const FlatRight = flattenMemory(AuxVars, RightMem, OperatorToken.line)

    function operatorToAsmMain () {
        assertExpression(LeftMem.type !== 'constant')
        let assemblyCode = ''
        if (RightMem.type === 'constant') {
            const optimizationResult = testOptimizations()
            if (optimizationResult === undefined) {
                AuxVars.freeRegister(FlatRight.FlatMem.address)
                return ''
            }
            if (optimizationResult.length > 0) {
                if (FlatLeft.isNew === true) {
                    AuxVars.freeRegister(FlatRight.FlatMem.address)
                    assemblyCode = createInstruction(AuxVars, utils.genAssignmentToken(), LeftMem, FlatLeft.FlatMem)
                    AuxVars.freeRegister(FlatLeft.FlatMem.address)
                }
                return FlatLeft.asmCode + optimizationResult + assemblyCode
            }
        }
        // No optimization was possible, do regular operations
        assemblyCode = chooseOperator(OperatorToken.value) +
            ` @${FlatLeft.FlatMem.asmName} $${FlatRight.FlatMem.asmName}\n`
        AuxVars.freeRegister(FlatRight.FlatMem.address)
        if (FlatLeft.isNew === true) {
            assemblyCode += createInstruction(AuxVars, utils.genAssignmentToken(), LeftMem, FlatLeft.FlatMem)
            AuxVars.freeRegister(FlatLeft.FlatMem.address)
        }
        return FlatLeft.asmCode + FlatRight.asmCode + assemblyCode
    }

    /** Check and do optimization on a constant right side.
     * Returns undefined if optimization is do nothing
     * Returns empty string if no optimization was found
     * Returns assembly code with optimized code
     */
    function testOptimizations () : string|undefined {
        // if add new condition here, add also in checkOperatorOptimization code oKSx4ab
        // here we can have optimizations for all operations.
        switch (OperatorToken.value) {
        case '+':
        case '+=':
            switch (RightMem.hexContent) {
            case '0000000000000000':
                return
            case '0000000000000001':
                AuxVars.freeRegister(FlatRight.FlatMem.address)
                return createInstruction(AuxVars, utils.genIncToken(), FlatLeft.FlatMem)
            case '0000000000000002':
                AuxVars.freeRegister(FlatRight.FlatMem.address)
                if (!AuxVars.memory.find(MEM => MEM.asmName === 'n2' && MEM.hexContent === '0000000000000002')) {
                    return createInstruction(AuxVars, utils.genIncToken(), FlatLeft.FlatMem) +
                    createInstruction(AuxVars, utils.genIncToken(), FlatLeft.FlatMem)
                }
            }
            return ''
        case '-':
        case '-=':
            if (RightMem.hexContent === '0000000000000000') {
                return
            }
            if (RightMem.hexContent === '0000000000000001') {
                AuxVars.freeRegister(FlatRight.FlatMem.address)
                return createInstruction(AuxVars, utils.genDecToken(), FlatLeft.FlatMem)
            }
            return ''
        case '*':
        case '*=':
            if (RightMem.hexContent === '0000000000000001') {
                AuxVars.freeRegister(FlatRight.FlatMem.address)
                return
            }
            if (RightMem.hexContent === '0000000000000000') {
                AuxVars.freeRegister(FlatRight.FlatMem.address)
                return createInstruction(AuxVars, utils.genAssignmentToken(), FlatLeft.FlatMem, RightMem)
            }
            return ''
        case '/':
        case '/=':
            if (RightMem.hexContent === '0000000000000001') {
                AuxVars.freeRegister(FlatRight.FlatMem.address)
                return
            }
            return ''
        default:
            return ''
        }
    }

    return operatorToAsmMain()
}

function chooseOperator (value: string) : string {
    switch (value) {
    case '+':
    case '+=':
        return 'ADD'
    case '-':
    case '-=':
        return 'SUB'
    case '*':
    case '*=':
        return 'MUL'
    case '/':
    case '/=':
        return 'DIV'
    case '|':
    case '|=':
        return 'BOR'
    case '&':
    case '&=':
        return 'AND'
    case '^':
    case '^=':
        return 'XOR'
    case '%':
    case '%=':
        return 'MOD'
    case '<<':
    case '<<=':
        return 'SHL'
    case '>>':
    case '>>=':
        return 'SHR'
    default:
        throw new Error('Internal error.')
    }
}
