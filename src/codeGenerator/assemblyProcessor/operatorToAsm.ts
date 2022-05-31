import { assertExpression } from '../../repository/repository'
import { TOKEN, MEMORY_SLOT } from '../../typings/syntaxTypes'
import { GENCODE_AUXVARS } from '../codeGeneratorTypes'
import utils from '../utils'
import { createInstruction, flattenMemory } from './createInstruction'

/**
 * Create assembly intructions for binary operators or SetOperators.
 * @returns the assembly code necessary for the assignment to happen
 */
export default function operatorToAsm (
    AuxVars: GENCODE_AUXVARS, OperatorToken: TOKEN, LeftMem: MEMORY_SLOT, RightMem: MEMORY_SLOT
) : string {
    const FlatLeft = flattenMemory(AuxVars, LeftMem, OperatorToken.line)
    const FlatRight = flattenMemory(AuxVars, RightMem, OperatorToken.line)
    let assemblyCode = ''

    function operatorToAsmMain () : string {
        assertExpression(LeftMem.type !== 'constant')

        switch (FlatLeft.FlatMem.declaration) {
        case 'fixed':
            return leftFixedToAsm()
        default:
            if (FlatRight.FlatMem.declaration === 'fixed') {
                throw new Error('Internal error')
            }
            return leftRegularRightRegularToAsm()
        }
    }

    function leftFixedToAsm () : string {
        switch (FlatRight.FlatMem.declaration) {
        case 'fixed':
            return leftFixedRightFixedToAsm()
        default:
            return leftFixedRightRegularToAsm()
        }
    }

    function leftFixedRightFixedToAsm () : string {
        switch (OperatorToken.value) {
        case '%':
        case '%=':
        case '&':
        case '&=':
        case '|':
        case '|=':
        case '^':
        case '^=':
            throw new Error(`At line ${OperatorToken.line}. ` +
            `Cannot use operator ${OperatorToken.value} with 'fixed' types.`)
        case '<<':
        case '<<=':
        case '>>':
        case '>>=':
            throw new Error(`At line ${OperatorToken.line}. ` +
                `Cannot use operator ${OperatorToken.value} with 'fixed' type on right side.`)
        case '*':
        case '*=':
            assemblyCode = `MDV @${FlatLeft.FlatMem.asmName} $${FlatRight.FlatMem.asmName} $f100000000\n`
            break
        case '/':
        case '/=':
            assemblyCode = `MDV @${FlatLeft.FlatMem.asmName} $f100000000 $${FlatRight.FlatMem.asmName}\n`
            break
        default: // + -
            assemblyCode = chooseOperator(OperatorToken.value) +
                ` @${FlatLeft.FlatMem.asmName} $${FlatRight.FlatMem.asmName}\n`
        }
        freeRegisters()
        return FlatLeft.asmCode + FlatRight.asmCode + assemblyCode
    }

    function leftFixedRightRegularToAsm () : string {
        switch (OperatorToken.value) {
        case '%':
        case '%=':
        case '&':
        case '&=':
        case '|':
        case '|=':
        case '^':
        case '^=':
            throw new Error(`At line ${OperatorToken.line}. ` +
                `Cannot use operator ${OperatorToken.value} with 'fixed' types.`)
        case '+':
        case '+=':
        case '-':
        case '-=':
            if (FlatRight.isNew === true) {
                assemblyCode = `MUL @${FlatRight.FlatMem.asmName} $f100000000\n`
                assemblyCode += chooseOperator(OperatorToken.value) +
                        ` @${FlatLeft.FlatMem.asmName} $${FlatRight.FlatMem.asmName}\n`
            } else {
                const RetObj = AuxVars.getNewRegister()
                assemblyCode = `SET @${RetObj.asmName} $${FlatRight.FlatMem.asmName}\n`
                assemblyCode += `MUL @${RetObj.asmName} $f100000000\n`
                assemblyCode += chooseOperator(OperatorToken.value) +
                        ` @${FlatLeft.FlatMem.asmName} $${RetObj.asmName}\n`
                AuxVars.freeRegister(RetObj.address)
            }
            break
        default: // << >>
            assemblyCode = chooseOperator(OperatorToken.value) +
                ` @${FlatLeft.FlatMem.asmName} $${FlatRight.FlatMem.asmName}\n`
        }
        freeRegisters()
        return FlatLeft.asmCode + FlatRight.asmCode + assemblyCode
    }

    function leftRegularRightRegularToAsm () : string {
        const optimized = tryOptimization()
        if (optimized !== undefined) {
            return optimized
        }
        assemblyCode = chooseOperator(OperatorToken.value) +
            ` @${FlatLeft.FlatMem.asmName} $${FlatRight.FlatMem.asmName}\n`
        AuxVars.freeRegister(FlatRight.FlatMem.address)
        if (FlatLeft.isNew === true) {
            assemblyCode += createInstruction(AuxVars, utils.genAssignmentToken(OperatorToken.line), LeftMem, FlatLeft.FlatMem)
            AuxVars.freeRegister(FlatLeft.FlatMem.address)
        }
        return FlatLeft.asmCode + FlatRight.asmCode + assemblyCode
    }

    function tryOptimization () : string | undefined {
        if (RightMem.type === 'constant') {
            const optimizationResult = testOptimizations()
            if (optimizationResult === undefined) {
                AuxVars.freeRegister(FlatRight.FlatMem.address)
                return ''
            }
            if (optimizationResult.length > 0) {
                // Optimizations before already flat left side.
                assertExpression(FlatLeft.isNew === false, 'Internal error. Expecting not new item.')
                return FlatLeft.asmCode + optimizationResult
            }
        }
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
            return testOptimizationsPlus()
        case '-':
        case '-=':
            return testOptimizationsMinus()
        case '*':
        case '*=':
            return testOptimizationsMultiply()
        case '/':
        case '/=':
            return testOptimizationsDivide()
        default:
            return ''
        }
    }

    function testOptimizationsPlus () : string|undefined {
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
    }

    function testOptimizationsMinus () : string|undefined {
        if (RightMem.hexContent === '0000000000000000') {
            return
        }
        if (RightMem.hexContent === '0000000000000001') {
            AuxVars.freeRegister(FlatRight.FlatMem.address)
            return createInstruction(AuxVars, utils.genDecToken(), FlatLeft.FlatMem)
        }
        return ''
    }

    function testOptimizationsMultiply () : string|undefined {
        if (RightMem.hexContent === '0000000000000001') {
            AuxVars.freeRegister(FlatRight.FlatMem.address)
            return
        }
        if (RightMem.hexContent === '0000000000000000') {
            AuxVars.freeRegister(FlatRight.FlatMem.address)
            return createInstruction(AuxVars, utils.genAssignmentToken(OperatorToken.line), FlatLeft.FlatMem, RightMem)
        }
        return ''
    }

    function testOptimizationsDivide () : string|undefined {
        if (RightMem.hexContent === '0000000000000001') {
            AuxVars.freeRegister(FlatRight.FlatMem.address)
            return
        }
        return ''
    }

    function freeRegisters () : void {
        AuxVars.freeRegister(FlatRight.FlatMem.address)
        if (FlatLeft.isNew === true) {
            assemblyCode += createInstruction(AuxVars, utils.genAssignmentToken(OperatorToken.line), LeftMem, FlatLeft.FlatMem)
            AuxVars.freeRegister(FlatLeft.FlatMem.address)
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
