import { deepCopy } from '../../repository/repository'
import { CONTRACT } from '../../typings/contractTypes'
import { MEMORY_SLOT, DECLARATION_TYPES, BINARY_ASN } from '../../typings/syntaxTypes'
import { createSimpleInstruction, createInstruction, setConstAsmCode, toRegister } from '../assemblyProcessor/createInstruction'
import { typeCasting } from '../assemblyProcessor/typeCastingToAsm'
import { GENCODE_AUXVARS, GENCODE_ARGS, GENCODE_SOLVED_OBJECT } from '../codeGeneratorTypes'
import utils from '../utils'
import genCode from './genCode'

/** Process one binary abstract syntax node */
export default function binaryAsnProcessor (
    Program: CONTRACT, AuxVars: GENCODE_AUXVARS, ScopeInfo: GENCODE_ARGS
) : GENCODE_SOLVED_OBJECT {
    let assemblyCode = ''
    let CurrentNode : BINARY_ASN

    function binaryAsnProcessorMain () : GENCODE_SOLVED_OBJECT {
        CurrentNode = utils.assertAsnType('binaryASN', ScopeInfo.RemAST)
        switch (CurrentNode.Operation.type) {
        case 'Delimiter':
            return delimiterProc()
        case 'Operator':
            return operatorProc()
        case 'Assignment':
        case 'SetOperator':
            return assignmentProc()
        case 'Comparision':
            return binaryComparisionProc()
        default:
            throw new Error('Internal error.')
        }
    }

    function delimiterProc () : GENCODE_SOLVED_OBJECT {
        if (ScopeInfo.jumpFalse !== undefined) {
            throw new Error(`At line: ${CurrentNode.Operation.line}.` +
            ' It is not possible to evaluate multiple sentences in logical operations.')
        }
        const LGenObj = genCode(Program, AuxVars, {
            RemAST: CurrentNode.Left,
            logicalOp: false,
            revLogic: ScopeInfo.revLogic,
            jumpFalse: ScopeInfo.jumpFalse,
            jumpTrue: ScopeInfo.jumpTrue
        })
        LGenObj.asmCode += AuxVars.getPostOperations()
        const RGenObj = genCode(Program, AuxVars, {
            RemAST: CurrentNode.Right,
            logicalOp: false,
            revLogic: ScopeInfo.revLogic,
            jumpFalse: ScopeInfo.jumpFalse,
            jumpTrue: ScopeInfo.jumpTrue
        })
        LGenObj.asmCode += RGenObj.asmCode
        LGenObj.asmCode += AuxVars.getPostOperations()
        // Note: RGenObj always have MemObj, because jumpTarget is undefined.
        AuxVars.freeRegister(RGenObj.SolvedMem.address)
        return LGenObj
    }

    function operatorProc () : GENCODE_SOLVED_OBJECT {
        let LGenObj = genCode(Program, AuxVars, {
            RemAST: CurrentNode.Left,
            logicalOp: false,
            revLogic: ScopeInfo.revLogic,
            jumpFalse: ScopeInfo.jumpFalse,
            jumpTrue: ScopeInfo.jumpTrue
        })
        let RGenObj = genCode(Program, AuxVars, {
            RemAST: CurrentNode.Right,
            logicalOp: false,
            revLogic: ScopeInfo.revLogic,
            jumpFalse: ScopeInfo.jumpFalse,
            jumpTrue: ScopeInfo.jumpTrue
        })
        LGenObj.asmCode += RGenObj.asmCode
        // Error handling
        if (LGenObj.SolvedMem.type === 'void' || RGenObj.SolvedMem.type === 'void') {
            throw new Error(`At line: ${CurrentNode.Operation.line}. Can not make operations with void values.`)
        }
        // Optimizations 1
        const PossibleRetObj = OperatorOptConstantConstant(
            LGenObj.SolvedMem,
            RGenObj.SolvedMem,
            CurrentNode.Operation.value
        )
        if (PossibleRetObj) {
            return { SolvedMem: PossibleRetObj, asmCode: LGenObj.asmCode }
        }
        // Optimizations 2
        if (OperatorOptBySwap(LGenObj.SolvedMem, RGenObj.SolvedMem, CurrentNode.Operation.value)) {
            const Temp = RGenObj
            RGenObj = LGenObj
            LGenObj = Temp
            LGenObj.asmCode = RGenObj.asmCode
        }
        const leftDeclaration = utils.getDeclarationFromMemory(LGenObj.SolvedMem)
        const rightDeclaration = utils.getDeclarationFromMemory(RGenObj.SolvedMem)
        // Prepare return object
        LGenObj = toRegister(AuxVars, LGenObj, CurrentNode.Operation.line)
        // implicit type casting tests and operations
        const castSide = implicitTypeCastingTest(CurrentNode.Operation.value, leftDeclaration, rightDeclaration)
        switch (castSide) {
        case 'left':
            LGenObj = typeCasting(AuxVars, LGenObj, rightDeclaration, CurrentNode.Operation.line)
            break
        case 'right': {
            const oldAsm = RGenObj.asmCode
            RGenObj = typeCasting(AuxVars, RGenObj, leftDeclaration, CurrentNode.Operation.line)
            // append only the diff
            LGenObj.asmCode += RGenObj.asmCode.slice(oldAsm.length)
        }
        }
        // Create instruction
        LGenObj.asmCode += createInstruction(AuxVars, CurrentNode.Operation, LGenObj.SolvedMem, RGenObj.SolvedMem)
        // Handle logical operation
        if (ScopeInfo.logicalOp === true) {
            LGenObj.asmCode += createInstruction(
                AuxVars,
                utils.genNotEqualToken(),
                LGenObj.SolvedMem,
                utils.createConstantMemObj(0),
                ScopeInfo.revLogic,
                ScopeInfo.jumpFalse,
                ScopeInfo.jumpTrue
            )
            AuxVars.freeRegister(RGenObj.SolvedMem.address)
            AuxVars.freeRegister(LGenObj.SolvedMem.address)
            return { SolvedMem: utils.createVoidMemObj(), asmCode: LGenObj.asmCode }
        }
        // Return arithmetic result
        AuxVars.freeRegister(RGenObj.SolvedMem.address)
        return LGenObj
    }

    function assignmentProc () : GENCODE_SOLVED_OBJECT {
        assignmentStartErrorTests()
        AuxVars.isLeftSideOfAssignment = true
        AuxVars.hasVoidArray = false
        const LGenObj = genCode(Program, AuxVars, {
            RemAST: CurrentNode.Left,
            logicalOp: false,
            revLogic: ScopeInfo.revLogic,
            jumpFalse: ScopeInfo.jumpFalse,
            jumpTrue: ScopeInfo.jumpTrue
        })
        AuxVars.isLeftSideOfAssignment = false
        assignmentLeftSideErrorTests(LGenObj.SolvedMem)
        // Clear isDeclaration before right side evaluation.
        let savedDeclaration: DECLARATION_TYPES = ''
        if (AuxVars.isDeclaration.length !== 0) {
            savedDeclaration = AuxVars.isDeclaration
            AuxVars.isDeclaration = ''
        }
        // If it is an array item we know, change to the item
        if (LGenObj.SolvedMem.type === 'array' &&
            LGenObj.SolvedMem.Offset?.type === 'constant') {
            if (LGenObj.SolvedMem.ArrayItem !== undefined && LGenObj.SolvedMem.ArrayItem.totalSize <= LGenObj.SolvedMem.Offset.value + 1) {
                throw new Error(`At line ${CurrentNode.Operation.line}. ` +
                    'Array index is outside array size.')
            }
            LGenObj.SolvedMem = AuxVars.getMemoryObjectByLocation(
                utils.addHexContents(LGenObj.SolvedMem.hexContent, LGenObj.SolvedMem.Offset.value)
            )
        }
        // Get right side gencode object
        let RGenObj = assignmentRightSideSolver(LGenObj.SolvedMem)
        // Restore isDeclaration value
        AuxVars.isDeclaration = savedDeclaration
        // Error check for Right side
        if (RGenObj.SolvedMem.type === 'void') {
            throw new Error(`At line: ${CurrentNode.Operation.line}. ` +
            `Invalid right value for '${CurrentNode.Operation.type}'. Possible void value.`)
        }
        // Implicit type casting on assignment
        const lDecl = utils.getDeclarationFromMemory(LGenObj.SolvedMem)
        const rDecl = utils.getDeclarationFromMemory(RGenObj.SolvedMem)
        const castSide = implicitTypeCastingTest(CurrentNode.Operation.value, lDecl, rDecl)
        switch (castSide) {
        case 'left':
            throw new Error('Internal error')
        case 'right':
            RGenObj = typeCasting(AuxVars, RGenObj, lDecl, CurrentNode.Operation.line)
        }
        // Create instruction
        LGenObj.asmCode += RGenObj.asmCode + createInstruction(AuxVars, CurrentNode.Operation, LGenObj.SolvedMem, RGenObj.SolvedMem)
        // Process use of 'const' keyword
        if (AuxVars.isConstSentence === true) {
            return assignmentConstSolver(
                LGenObj.SolvedMem,
                RGenObj.SolvedMem,
                LGenObj.asmCode,
                CurrentNode.Operation.line
            )
        }
        AuxVars.freeRegister(RGenObj.SolvedMem.address)
        return LGenObj
    }

    function assignmentStartErrorTests () : void {
        if (ScopeInfo.jumpFalse !== undefined) {
            throw new Error(`At line: ${CurrentNode.Operation.line}. ` +
            'Can not use assignment during logical operations with branches')
        }
        if (CurrentNode.Left.type === 'binaryASN' ||
            (CurrentNode.Left.type === 'unaryASN' && CurrentNode.Left.Operation.value !== '*')) {
            throw new Error(`At line: ${CurrentNode.Operation.line}. Invalid left value for assignment.`)
        }
    }

    function assignmentLeftSideErrorTests (Left: MEMORY_SLOT) : void {
        if (Left.address === -1) {
            throw new Error(`At line: ${CurrentNode.Operation.line}. ` +
            `Invalid left value for ${CurrentNode.Operation.type}.`)
        }
        if (Left.type === 'array' && AuxVars.hasVoidArray === false) {
            if (Left.Offset === undefined ||
                (Left.Offset.type === 'variable' &&
                Left.Offset.addr === 0 &&
                Left.Offset.declaration.includes('_ptr'))) {
                // Array assignment base type || Array assignment inside struct
                throw new Error(`At line: ${CurrentNode.Operation.line}. ` +
                `Invalid left value for '${CurrentNode.Operation.type}'. Can not reassign an array.`)
            }
        }
        if (AuxVars.hasVoidArray &&
            (CurrentNode.Right.type !== 'endASN' ||
            (CurrentNode.Right.type === 'endASN' &&
            CurrentNode.Right.Token.type !== 'Constant'))) {
            throw new Error(`At line: ${CurrentNode.Operation.line}. ` +
            'Invalid right value for multi-array assignment. It must be a constant.')
        }
    }

    /** Checks if left side can be reused and solve right side of assigment */
    function assignmentRightSideSolver (Left: MEMORY_SLOT) : GENCODE_SOLVED_OBJECT {
        if (CurrentNode.Operation.type !== 'Assignment' ||
            Program.Config.reuseAssignedVar === false ||
            (Left.type !== 'long' && Left.type !== 'fixed') ||
            Left.Offset !== undefined ||
            !utils.findVarNameInAst(Left.name, CurrentNode.Right)) {
            // Can not reuse assigned var.
            return genCode(Program, AuxVars, {
                RemAST: CurrentNode.Right,
                logicalOp: false,
                revLogic: ScopeInfo.revLogic,
                jumpFalse: ScopeInfo.jumpFalse,
                jumpTrue: ScopeInfo.jumpTrue
            })
        }
        const registerInitialState = deepCopy(AuxVars.registerInfo)
        const NewRegister: MEMORY_SLOT = deepCopy(Left)
        NewRegister.type = 'register'
        NewRegister.declaration = Left.declaration
        AuxVars.registerInfo.unshift({
            inUse: false,
            Template: NewRegister
        })
        const RetGenObj = genCode(Program, AuxVars, {
            RemAST: CurrentNode.Right,
            logicalOp: false,
            revLogic: ScopeInfo.revLogic,
            jumpFalse: ScopeInfo.jumpFalse,
            jumpTrue: ScopeInfo.jumpTrue
        })
        AuxVars.registerInfo.shift()
        const registerFinalState = deepCopy(AuxVars.registerInfo)
        // if returning var is not the reused one, put it in that returning location and solve right side again
        if (RetGenObj.SolvedMem.address !== Left.address && AuxVars.isTemp(RetGenObj.SolvedMem.address)) {
            const index = RetGenObj.SolvedMem.address + 1
            AuxVars.registerInfo = registerInitialState
            AuxVars.registerInfo.splice(index, 0, { inUse: false, Template: NewRegister })
            const TestRetGenObj = genCode(Program, AuxVars, {
                RemAST: CurrentNode.Right,
                logicalOp: false,
                revLogic: ScopeInfo.revLogic,
                jumpFalse: ScopeInfo.jumpFalse,
                jumpTrue: ScopeInfo.jumpTrue
            })
            // Verify if alteration suceed in optimization
            if (TestRetGenObj.SolvedMem.address === Left.address) {
                // alteration suceed!
                // RetGenObj = TestRGenObj
                AuxVars.registerInfo.splice(index, 1)
                return TestRetGenObj
            }
            // not suceed, undo changes.
            AuxVars.registerInfo = registerFinalState
        }
        return RetGenObj
    }

    /** Tests if implicit type casting is needed and also checks valid operations for binary operators.
     * @returns the side needed to be changed
     * @throws Error if operation is not allowed */
    function implicitTypeCastingTest (operVal: string, lDecl: DECLARATION_TYPES, rDecl: DECLARATION_TYPES) : 'left' | 'right' | 'none' {
        if (lDecl === rDecl) {
            if (lDecl === 'fixed') {
                return fixedFixedImplicitTC(operVal)
            }
            return 'none'
        }
        const fixedRet = fixedLongImplicitTC(operVal, lDecl, rDecl)
        if (fixedRet !== 'notFixedLong') {
            return fixedRet
        }
        const pointerRet = remainingImplicitTC(operVal, lDecl, rDecl)
        return pointerRet
    }

    function fixedLongImplicitTC (operVal: string, lDecl: DECLARATION_TYPES, rDecl: DECLARATION_TYPES) : 'left' | 'right' | 'none' | 'notFixedLong' {
        let fixedSide: 'left' | 'right' | 'none' = 'none'
        if (lDecl === 'long' && rDecl === 'fixed') {
            fixedSide = 'right'
        }
        if (lDecl === 'fixed' && rDecl === 'long') {
            fixedSide = 'left'
        }
        if (fixedSide === 'none') {
            return 'notFixedLong'
        }
        // now there is only one fixed and one long
        switch (operVal) {
        case '=':
        case '+=':
        case '-=':
            return 'right'
        case '+':
        case '-':
            return fixedSide === 'left' ? 'right' : 'left'
        case '/':
        case '*':
            return fixedSide === 'left' ? 'none' : 'left'
        case '%':
        case '&':
        case '|':
        case '^':
        case '%=':
        case '&=':
        case '|=':
        case '^=':
            throw new Error(`At line ${CurrentNode.Operation.line}. Cannot use operator ${operVal} with fixed type numbers.`)
        case '>>':
        case '<<':
        case '>>=':
        case '<<=':
            if (fixedSide === 'right') {
                throw new Error(`At line ${CurrentNode.Operation.line}. Cannot use operator ${operVal} with fixed type numbers on right side.`)
            }
            return 'none'
        case '/=':
        case '*=':
            return fixedSide === 'left' ? 'none' : 'right'
        case '==':
        case '!=':
        case '<=':
        case '>=':
        case '<':
        case '>':
            return fixedSide === 'left' ? 'right' : 'left'
        default:
            throw new Error('Internal error')
        }
    }

    function fixedFixedImplicitTC (operVal: string) : 'left' | 'right' | 'none' {
        switch (operVal) {
        case '%':
        case '&':
        case '|':
        case '^':
        case '%=':
        case '&=':
        case '|=':
        case '^=':
        case '>>':
        case '<<':
            throw new Error(`At line ${CurrentNode.Operation.line}. Cannot use operator ${operVal} with fixed type numbers.`)
        case '>>=':
        case '<<=':
            throw new Error(`At line ${CurrentNode.Operation.line}. Cannot use operator ${operVal} with fixed type numbers on right side.`)
        default:
            return 'none'
        }
    }

    function remainingImplicitTC (operVal: string, lDecl: DECLARATION_TYPES, rDecl: DECLARATION_TYPES) : 'left' | 'right' | 'none' {
        switch (operVal) {
        case '=':
            if ((lDecl === 'void_ptr' && rDecl.includes('_ptr')) ||
                    (lDecl.includes('_ptr') && rDecl === 'void_ptr')) {
                return 'right'
            }
            if (lDecl.includes('ptr') && rDecl === 'long' && AuxVars.hasVoidArray) {
                return 'none'
            }
            throw new Error(`At line ${CurrentNode.Operation.line}. Left and right side of assigment does not match. Types are '${lDecl}' and '${rDecl}'.`)
        case '+=':
        case '-=':
            if (lDecl === rDecl + '_ptr') {
                return 'none'
            }
            throw new Error(`At line ${CurrentNode.Operation.line}. Left and right side of ${operVal} does not match. Types are '${lDecl}' and '${rDecl}'.`)
        case '+':
        case '-':
            if (lDecl.includes('_ptr') && rDecl === 'long') {
                return 'right'
            }
            if (rDecl.includes('_ptr') && lDecl === 'long') {
                return 'left'
            }
            throw new Error(`At line ${CurrentNode.Operation.line}. Left and right side of ${operVal} does not match. Types are '${lDecl}' and '${rDecl}'.`)
        case '==':
        case '!=':
        case '<=':
        case '>=':
        case '<':
        case '>':
            if (lDecl.includes('_ptr') && rDecl.includes('_ptr')) {
                return 'right'
            }
            if (lDecl.includes('_ptr') && rDecl === 'long') {
                return 'right'
            }
            if (lDecl === 'long' && rDecl.includes('_ptr')) {
                return 'left'
            }
            throw new Error(`At line ${CurrentNode.Operation.line}. Left and right side of ${operVal} does not match. Types are '${lDecl}' and '${rDecl}'.`)
        default:
            // / * % & | ^ %= &= |= ^= >> << >>= <<= /= *=
            throw new Error(`At line ${CurrentNode.Operation.line}. Left and right side of ${operVal} does not match. Types are '${lDecl}' and '${rDecl}'.`)
        }
    }

    function assignmentConstSolver (
        Left: MEMORY_SLOT, Right: MEMORY_SLOT, assemblyInstructions: string, line: number
    ) : GENCODE_SOLVED_OBJECT {
        if (Right.address !== -1 || Right.type !== 'constant' || Right.hexContent === undefined) {
            throw new Error(`At line: ${line}. ` +
            "Right side of an assigment with 'const' keyword must be a constant.")
        }
        // Inspect ASM code and change accordingly
        assemblyInstructions = setConstAsmCode(AuxVars.memory, assemblyInstructions, line)
        return { SolvedMem: Left, asmCode: assemblyInstructions }
    }

    function binaryComparisionProc () : GENCODE_SOLVED_OBJECT {
        if (ScopeInfo.logicalOp === false && ScopeInfo.jumpFalse === undefined) {
            return logicalToArithmeticOpProc()
        }
        switch (CurrentNode.Operation.value) {
        case '||':
            return orLogicalOpProc()
        case '&&':
            return andLogicalOpProc()
        case '==':
        case '!=':
        case '<=':
        case '>=':
        case '<':
        case '>':
            return defaultLogicalOpProc()
        default:
            throw new Error('Internal error')
        }
    }

    function logicalToArithmeticOpProc () : GENCODE_SOLVED_OBJECT {
        const rnd = AuxVars.getNewJumpID(CurrentNode.Operation.line)
        const idCompSF = '__CMP_' + rnd + '_sF' // set false
        const idCompST = '__CMP_' + rnd + '_sT' // set true
        const idEnd = '__CMP_' + rnd + '_end'
        let swapLogic = false
        // Code optimization
        if (CurrentNode.Operation.value === '||') {
            swapLogic = true
        }
        let { SolvedMem: RedoAsLogical, asmCode } = genCode(Program, AuxVars, {
            RemAST: CurrentNode,
            logicalOp: true,
            revLogic: swapLogic,
            jumpFalse: idCompSF,
            jumpTrue: idCompST
        })
        const TmpMemObj = AuxVars.getNewRegister()
        asmCode += createSimpleInstruction('Label', swapLogic ? idCompSF : idCompST)
        asmCode += createInstruction(
            AuxVars,
            utils.genAssignmentToken(CurrentNode.Operation.line),
            TmpMemObj,
            utils.createConstantMemObj(swapLogic ? 0 : 1)
        )
        asmCode += createSimpleInstruction('Jump', idEnd)
        asmCode += createSimpleInstruction('Label', swapLogic ? idCompST : idCompSF)
        asmCode += createInstruction(
            AuxVars,
            utils.genAssignmentToken(CurrentNode.Operation.line),
            TmpMemObj,
            utils.createConstantMemObj(swapLogic ? 1 : 0)
        )
        asmCode += createSimpleInstruction('Label', idEnd)
        AuxVars.freeRegister(RedoAsLogical.address)
        return { SolvedMem: TmpMemObj, asmCode: asmCode }
    }

    function orLogicalOpProc () : GENCODE_SOLVED_OBJECT {
        const rnd = AuxVars.getNewJumpID(CurrentNode.Operation.line)
        const idNextStmt = '__OR_' + rnd + '_next'
        const LGenObj = genCode(Program, AuxVars, {
            RemAST: CurrentNode.Left,
            logicalOp: true,
            revLogic: true,
            jumpFalse: idNextStmt,
            jumpTrue: ScopeInfo.jumpTrue
        })
        assemblyCode += LGenObj.asmCode
        assemblyCode += createSimpleInstruction('Label', idNextStmt)
        const RGenObj = genCode(Program, AuxVars, {
            RemAST: CurrentNode.Right,
            logicalOp: true,
            revLogic: true,
            jumpFalse: ScopeInfo.jumpFalse,
            jumpTrue: ScopeInfo.jumpTrue
        })
        assemblyCode += RGenObj.asmCode
        assemblyCode += createSimpleInstruction('Jump', ScopeInfo.jumpFalse)
        return { SolvedMem: utils.createVoidMemObj(), asmCode: assemblyCode }
    }

    function andLogicalOpProc () : GENCODE_SOLVED_OBJECT {
        const rnd = AuxVars.getNewJumpID(CurrentNode.Operation.line)
        const idNextStmt = '__AND_' + rnd + '_next'
        const LGenObj = genCode(Program, AuxVars, {
            RemAST: CurrentNode.Left,
            logicalOp: true,
            revLogic: false,
            jumpFalse: ScopeInfo.jumpFalse,
            jumpTrue: idNextStmt
        })
        assemblyCode += LGenObj.asmCode
        assemblyCode += createSimpleInstruction('Label', idNextStmt)
        const RGenObj = genCode(Program, AuxVars, {
            RemAST: CurrentNode.Right,
            logicalOp: true,
            revLogic: false,
            jumpFalse: ScopeInfo.jumpFalse,
            jumpTrue: ScopeInfo.jumpTrue
        })
        assemblyCode += RGenObj.asmCode
        assemblyCode += createSimpleInstruction('Jump', ScopeInfo.jumpTrue)
        return { SolvedMem: utils.createVoidMemObj(), asmCode: assemblyCode }
    }

    function defaultLogicalOpProc () : GENCODE_SOLVED_OBJECT {
        let LGenObj = genCode(Program, AuxVars, {
            RemAST: CurrentNode.Left,
            logicalOp: false,
            revLogic: ScopeInfo.revLogic
        }) // ScopeInfo.jumpFalse and ScopeInfo.jumpTrue must be undefined to evaluate expressions
        let RGenObj = genCode(Program, AuxVars, {
            RemAST: CurrentNode.Right,
            logicalOp: false,
            revLogic: ScopeInfo.revLogic
        }) // ScopeInfo.jumpFalse and ScopeInfo.jumpTrue must be undefined to evaluate expressions
        const leftDeclaration = utils.getDeclarationFromMemory(LGenObj.SolvedMem)
        const rightDeclaration = utils.getDeclarationFromMemory(RGenObj.SolvedMem)
        const castSide = implicitTypeCastingTest(CurrentNode.Operation.value, leftDeclaration, rightDeclaration)
        switch (castSide) {
        case 'left':
            LGenObj = typeCasting(AuxVars, LGenObj, rightDeclaration, CurrentNode.Operation.line)
            break
        case 'right':
            RGenObj = typeCasting(AuxVars, RGenObj, leftDeclaration, CurrentNode.Operation.line)
        }
        assemblyCode = LGenObj.asmCode + RGenObj.asmCode
        assemblyCode += createInstruction(
            AuxVars,
            CurrentNode.Operation,
            LGenObj.SolvedMem,
            RGenObj.SolvedMem,
            ScopeInfo.revLogic,
            ScopeInfo.jumpFalse,
            ScopeInfo.jumpTrue
        )
        AuxVars.freeRegister(LGenObj.SolvedMem.address)
        AuxVars.freeRegister(RGenObj.SolvedMem.address)
        return { SolvedMem: utils.createVoidMemObj(), asmCode: assemblyCode }
    }

    function OperatorOptConstantConstant (
        Left: MEMORY_SLOT, Right: MEMORY_SLOT, operatorVal: string
    ) : MEMORY_SLOT | undefined {
        // If left and right side are constants, do the math now for basic operations
        if (Left.type === 'constant' && Right.type === 'constant') {
            switch (operatorVal) {
            case '+':
                return utils.createConstantMemObj(utils.addHexContents(Left.hexContent, Right.hexContent))
            case '*':
                return utils.createConstantMemObj(utils.mulHexContents(Left.hexContent, Right.hexContent))
            case '/':
                return utils.createConstantMemObj(utils.divHexContents(Left.hexContent, Right.hexContent))
            case '-':
                return utils.createConstantMemObj(utils.subHexContents(Left.hexContent, Right.hexContent))
            }
        }
    }

    // Test if it is possible to optimize by swapping left and right values. Only commutative operations.
    function OperatorOptBySwap (Left: MEMORY_SLOT, Right: MEMORY_SLOT, operatorVal: string) : boolean {
        switch (operatorVal) {
        case '+':
        case '*':
        case '&':
        case '^':
        case '|':
            // commutative operation, ok to proceed
            break
        default:
            return false
        }
        if (Left.declaration === 'fixed' && Right.declaration === 'long') {
            return operatorVal === '+'
        }
        // Try optimization if left side is constant (only commutativa operations!)
        if (checkOperatorOptimization(operatorVal, Left)) {
            return true
        }
        // Try optimization if operation is commutative, right side is register and left side is not
        if (AuxVars.isTemp(Right.address) && !AuxVars.isTemp(Left.address)) {
            return true
        }
        // Try optimization if right side is constant, but do not mess if already optimized
        if (Right.type === 'constant' && !checkOperatorOptimization(operatorVal, Right)) {
            return true
        }
        return false
    }

    // all cases here must be implemented in createInstruction code oKSx4ab
    // place here only commutative operations!!!
    function checkOperatorOptimization (operator: string, ConstantMemObj: MEMORY_SLOT) {
        if (operator === '+' || operator === '+=') {
            if (ConstantMemObj.hexContent === '0000000000000000' ||
                    ConstantMemObj.hexContent === '0000000000000001' ||
                    ConstantMemObj.hexContent === '0000000000000002') {
                return true
            }
        } else if (operator === '*' || operator === '*=') {
            if (ConstantMemObj.hexContent === '0000000000000000' ||
                    ConstantMemObj.hexContent === '0000000000000001') {
                return true
            }
        }
        return false
    }

    return binaryAsnProcessorMain()
}
