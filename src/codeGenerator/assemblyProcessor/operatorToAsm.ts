import { assertExpression } from '../../repository/repository'
import { CONTRACT } from '../../typings/contractTypes'
import { TOKEN, MEMORY_SLOT } from '../../typings/syntaxTypes'
import utils from '../utils'
import { createInstruction, flattenMemory } from './createInstruction'

/**
 * Create assembly intructions for binary operators or SetOperators.
 * @returns the assembly code necessary for the assignment to happen
 */
export default function operatorToAsm (
    Program: CONTRACT, OperatorToken: TOKEN, LeftMem: MEMORY_SLOT, RightMem: MEMORY_SLOT
) : string {
    const FlatLeft = flattenMemory(Program, LeftMem, OperatorToken.line)
    const FlatRight = flattenMemory(Program, RightMem, OperatorToken.line)

    function operatorToAsmMain () : string {
        assertExpression(LeftMem.type !== 'constant')

        if (FlatLeft.FlatMem.declaration === 'fixed') {
            return leftFixedToAsm()
        }
        if (FlatRight.FlatMem.declaration === 'fixed') {
            throw new Error('Internal error')
        }
        return leftRegularRightRegularToAsm()
    }

    function leftFixedToAsm () : string {
        if (FlatRight.FlatMem.declaration === 'fixed') {
            return leftFixedRightFixedToAsm()
        }
        return leftFixedRightRegularToAsm()
    }

    function leftFixedRightFixedToAsm () : string {
        switch (OperatorToken.value) {
        case '+':
        case '+=':
        case '-':
        case '-=':
            return returnThisCode(chooseOperator(OperatorToken.value) +
                ` @${FlatLeft.FlatMem.asmName} $${FlatRight.FlatMem.asmName}\n`)
        case '*':
        case '*=':
            return returnThisCode(`MDV @${FlatLeft.FlatMem.asmName} $${FlatRight.FlatMem.asmName} $f100000000\n`)
        case '/':
        case '/=':
            return returnThisCode(`MDV @${FlatLeft.FlatMem.asmName} $f100000000 $${FlatRight.FlatMem.asmName}\n`)
        default:
            // % & | ^ << >>
            throw new Error('Internal error')
        }
    }

    function leftFixedRightRegularToAsm () : string {
        switch (OperatorToken.value) {
        case '/':
        case '/=':
        case '*':
        case '*=':
        case '>>':
        case '>>=':
        case '<<':
        case '<<=':
            return returnThisCode(chooseOperator(OperatorToken.value) +
                ` @${FlatLeft.FlatMem.asmName} $${FlatRight.FlatMem.asmName}\n`)
        default:
            // + - % & | ^
            throw new Error('Internal error')
        }
    }

    function leftRegularRightRegularToAsm () : string {
        const optimized = tryOptimization()
        if (optimized !== undefined) {
            return optimized
        }
        return returnThisCode(chooseOperator(OperatorToken.value) +
            ` @${FlatLeft.FlatMem.asmName} $${FlatRight.FlatMem.asmName}\n`)
    }

    function tryOptimization () : string | undefined {
        if (RightMem.type === 'constant') {
            const optimizationResult = testOptimizations()
            if (optimizationResult === undefined) {
                Program.Context.freeRegister(FlatRight.FlatMem.address)
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
            Program.Context.freeRegister(FlatRight.FlatMem.address)
            return createInstruction(Program, utils.genIncToken(), FlatLeft.FlatMem)
        case '0000000000000002':
            Program.Context.freeRegister(FlatRight.FlatMem.address)
            if (!Program.memory.find(MEM => MEM.asmName === 'n2' && MEM.hexContent === '0000000000000002')) {
                return createInstruction(Program, utils.genIncToken(), FlatLeft.FlatMem) +
                createInstruction(Program, utils.genIncToken(), FlatLeft.FlatMem)
            }
        }
        return ''
    }

    function testOptimizationsMinus () : string|undefined {
        if (RightMem.hexContent === '0000000000000000') {
            return
        }
        if (RightMem.hexContent === '0000000000000001') {
            Program.Context.freeRegister(FlatRight.FlatMem.address)
            return createInstruction(Program, utils.genDecToken(), FlatLeft.FlatMem)
        }
        return ''
    }

    function testOptimizationsMultiply () : string|undefined {
        if (RightMem.hexContent === '0000000000000001') {
            Program.Context.freeRegister(FlatRight.FlatMem.address)
            return
        }
        if (RightMem.hexContent === '0000000000000000') {
            Program.Context.freeRegister(FlatRight.FlatMem.address)
            return createInstruction(Program, utils.genAssignmentToken(OperatorToken.line), FlatLeft.FlatMem, RightMem)
        }
        return ''
    }

    function testOptimizationsDivide () : string|undefined {
        if (RightMem.hexContent === '0000000000000001') {
            Program.Context.freeRegister(FlatRight.FlatMem.address)
            return
        }
        return ''
    }

    function returnThisCode (asm : string) : string {
        Program.Context.freeRegister(FlatRight.FlatMem.address)
        if (FlatLeft.isNew === true) {
            asm += createInstruction(Program, utils.genAssignmentToken(OperatorToken.line), LeftMem, FlatLeft.FlatMem)
            Program.Context.freeRegister(FlatLeft.FlatMem.address)
        }
        return FlatLeft.asmCode + FlatRight.asmCode + asm
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
