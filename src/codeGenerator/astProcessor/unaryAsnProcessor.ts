import { deepCopy } from '../../repository/repository'
import { CONTRACT } from '../../typings/contractTypes'
import { MEMORY_SLOT, DECLARATION_TYPES, UNARY_ASN } from '../../typings/syntaxTypes'
import { createSimpleInstruction, createInstruction } from '../assemblyProcessor/createInstruction'
import { typeCasting } from '../assemblyProcessor/typeCastingToAsm'
import { GENCODE_AUXVARS, GENCODE_ARGS, GENCODE_SOLVED_OBJECT } from '../codeGeneratorTypes'
import utils from '../utils'
import genCode from './genCode'

export default function unaryAsnProcessor (
    Program: CONTRACT, AuxVars: GENCODE_AUXVARS, ScopeInfo: GENCODE_ARGS
): GENCODE_SOLVED_OBJECT {
    let CurrentNode: UNARY_ASN

    function unaryAsnProcessorMain () : GENCODE_SOLVED_OBJECT {
        CurrentNode = utils.assertAsnType('unaryASN', ScopeInfo.RemAST)
        switch (CurrentNode.Operation.type) {
        case 'UnaryOperator':
            return UnaryOperatorProcessor()
        case 'Keyword':
            return unaryKeywordProcessor()
        case 'CodeCave':
            return CodeCaveProcessor()
        default:
            throw new Error(`Internal error at line: ${CurrentNode.Operation.line}.`)
        }
    }

    function UnaryOperatorProcessor () : GENCODE_SOLVED_OBJECT {
        switch (CurrentNode.Operation.value) {
        case '!':
            return notOpProc()
        case '+':
            return traverseDefault()
        case '*':
            return pointerOpProc()
        case '-':
            return unaryMinusOpProc()
        case '~':
            return bitwiseNotOpProc()
        case '&':
            return addressOfOpProc()
        default:
            throw new Error(`Internal error at line: ${CurrentNode.Operation.line}.`)
        }
    }

    function notOpProc () :GENCODE_SOLVED_OBJECT {
        if (ScopeInfo.logicalOp === true) {
            return genCode(Program, AuxVars, {
                RemAST: CurrentNode.Center,
                logicalOp: true,
                revLogic: !ScopeInfo.revLogic,
                jumpFalse: ScopeInfo.jumpTrue, // Yes, this is swapped!
                jumpTrue: ScopeInfo.jumpFalse // Yes, this is swapped!
            })
        }
        const rnd = AuxVars.getNewJumpID(CurrentNode.Operation.line)
        const idNotSF = '__NOT_' + rnd + '_sF' // set false
        const idNotST = '__NOT_' + rnd + '_sT' // set true
        const idEnd = '__NOT_' + rnd + '_end'
        const CGenObj = genCode(Program, AuxVars, {
            RemAST: CurrentNode.Center,
            logicalOp: true,
            revLogic: !ScopeInfo.revLogic,
            jumpFalse: idNotST,
            jumpTrue: idNotSF
        })
        const TmpMemObj = AuxVars.getNewRegister()
        // Logical return is long value!
        CGenObj.asmCode += createSimpleInstruction('Label', idNotST)
        CGenObj.asmCode += createInstruction(
            AuxVars,
            utils.genAssignmentToken(CurrentNode.Operation.line),
            TmpMemObj,
            utils.createConstantMemObj(1)
        )
        CGenObj.asmCode += createSimpleInstruction('Jump', idEnd)
        CGenObj.asmCode += createSimpleInstruction('Label', idNotSF)
        CGenObj.asmCode += createInstruction(
            AuxVars,
            utils.genAssignmentToken(CurrentNode.Operation.line),
            TmpMemObj,
            utils.createConstantMemObj(0)
        )
        CGenObj.asmCode += createSimpleInstruction('Label', idEnd)
        AuxVars.freeRegister(CGenObj.SolvedMem.address)
        return { SolvedMem: TmpMemObj, asmCode: CGenObj.asmCode }
    }

    function traverseDefault () : GENCODE_SOLVED_OBJECT {
        return genCode(Program, AuxVars, {
            RemAST: CurrentNode.Center,
            logicalOp: ScopeInfo.logicalOp,
            revLogic: ScopeInfo.revLogic,
            jumpFalse: ScopeInfo.jumpFalse,
            jumpTrue: ScopeInfo.jumpTrue
        })
    }

    function traverseNotLogical () : GENCODE_SOLVED_OBJECT {
        return genCode(Program, AuxVars, {
            RemAST: CurrentNode.Center,
            logicalOp: false,
            revLogic: ScopeInfo.revLogic,
            jumpFalse: ScopeInfo.jumpFalse,
            jumpTrue: ScopeInfo.jumpTrue
        })
    }

    function pointerOpProc () : GENCODE_SOLVED_OBJECT {
        const CGenObj = traverseNotLogical()
        if (AuxVars.isDeclaration.length !== 0) {
            // do not do any other operation when declaring a pointer.
            return CGenObj
        }
        const declar = utils.getDeclarationFromMemory(CGenObj.SolvedMem)
        if (declar.includes('_ptr') === false) {
            if (CurrentNode.Center.type === 'endASN' || CurrentNode.Center.type === 'lookupASN') {
                throw new Error(`At line: ${CurrentNode.Operation.line}.` +
                ` Trying to read/set content of variable ${CurrentNode.Center.Token.value}` +
                ' that is not declared as pointer.')
            }
            throw new Error(`At line: ${CurrentNode.Operation.line}.` +
            ' Trying to read/set content of a value that is not declared as pointer.')
        }
        if (CGenObj.SolvedMem.Offset) {
            // Double deference: deference and continue
            const TmpMemObj = AuxVars.getNewRegister()
            TmpMemObj.declaration = utils.getDeclarationFromMemory(CGenObj.SolvedMem)
            CGenObj.asmCode += createInstruction(AuxVars, utils.genAssignmentToken(CurrentNode.Operation.line), TmpMemObj, CGenObj.SolvedMem)
            if (CGenObj.SolvedMem.Offset.type === 'variable') {
                AuxVars.freeRegister(CGenObj.SolvedMem.Offset.addr)
            }
            AuxVars.freeRegister(CGenObj.SolvedMem.address)
            CGenObj.SolvedMem = TmpMemObj
        }
        CGenObj.SolvedMem.Offset = {
            type: 'constant',
            value: 0,
            declaration: declar.slice(0, -4) as DECLARATION_TYPES
        }
        if (ScopeInfo.logicalOp === true) {
            CGenObj.asmCode += createInstruction(
                AuxVars,
                utils.genNotEqualToken(),
                CGenObj.SolvedMem,
                utils.createConstantMemObj(0),
                ScopeInfo.revLogic,
                ScopeInfo.jumpFalse,
                ScopeInfo.jumpTrue
            )
            AuxVars.freeRegister(CGenObj.SolvedMem.address)
            return { SolvedMem: utils.createVoidMemObj(), asmCode: CGenObj.asmCode }
        }
        return CGenObj
    }

    function unaryMinusOpProc () : GENCODE_SOLVED_OBJECT {
        let { SolvedMem: CGenObj, asmCode } = traverseNotLogical()
        if (CGenObj.type === 'constant') {
            return {
                SolvedMem: utils.createConstantMemObjWithDeclaration(utils.subConstants(
                    { value: 0, declaration: 'long' },
                    utils.memoryToConstantContent(CGenObj)
                )),
                asmCode: asmCode
            }
        }
        const TmpMemObj = AuxVars.getNewRegister()
        TmpMemObj.declaration = utils.getDeclarationFromMemory(CGenObj)
        asmCode += createInstruction(AuxVars, utils.genAssignmentToken(CurrentNode.Operation.line), TmpMemObj, utils.createConstantMemObj(0))
        asmCode += createInstruction(AuxVars, utils.genSubToken(CurrentNode.Operation.line), TmpMemObj, CGenObj)
        AuxVars.freeRegister(CGenObj.address)
        if (ScopeInfo.logicalOp === true) {
            asmCode += createInstruction(
                AuxVars,
                utils.genNotEqualToken(),
                TmpMemObj,
                utils.createConstantMemObj(0),
                ScopeInfo.revLogic,
                ScopeInfo.jumpFalse,
                ScopeInfo.jumpTrue
            )
            AuxVars.freeRegister(TmpMemObj.address)
            return { SolvedMem: utils.createVoidMemObj(), asmCode: asmCode }
        }
        return { SolvedMem: TmpMemObj, asmCode: asmCode }
    }

    function bitwiseNotOpProc () : GENCODE_SOLVED_OBJECT {
        let clearVar = false
        let { SolvedMem: CGenObj, asmCode } = traverseNotLogical()
        let TmpMemObj: MEMORY_SLOT
        if (!AuxVars.isTemp(CGenObj.address)) {
            TmpMemObj = AuxVars.getNewRegister()
            TmpMemObj.declaration = utils.getDeclarationFromMemory(CGenObj)
            asmCode += createInstruction(AuxVars, utils.genAssignmentToken(CurrentNode.Operation.line), TmpMemObj, CGenObj)
            clearVar = true
        } else {
            TmpMemObj = CGenObj
        }
        asmCode += createInstruction(AuxVars, CurrentNode.Operation, TmpMemObj)
        if (ScopeInfo.logicalOp === true) {
            asmCode += createInstruction(
                AuxVars,
                utils.genNotEqualToken(),
                TmpMemObj,
                utils.createConstantMemObj(0),
                ScopeInfo.revLogic,
                ScopeInfo.jumpFalse,
                ScopeInfo.jumpTrue
            )
            AuxVars.freeRegister(CGenObj.address)
            AuxVars.freeRegister(TmpMemObj.address)
            return { SolvedMem: utils.createVoidMemObj(), asmCode: asmCode }
        }
        if (clearVar) {
            AuxVars.freeRegister(CGenObj.address)
        }
        return { SolvedMem: TmpMemObj, asmCode: asmCode }
    }

    function addressOfOpProc () : GENCODE_SOLVED_OBJECT {
        if (ScopeInfo.jumpFalse !== undefined) {
            throw new Error(`At line: ${CurrentNode.Operation.line}. ` +
            "Can not use UnaryOperator '&' during logical operations with branches.")
        }
        let { SolvedMem: RetMem, asmCode } = traverseNotLogical()
        let TmpMemObj: MEMORY_SLOT
        switch (RetMem.type) {
        case 'void':
            throw new Error(`At line: ${CurrentNode.Operation.line}. ` +
            'Trying to get address of void value.')
        case 'register':
            throw new Error(`At line: ${CurrentNode.Operation.line}. ` +
                'Returning address of a register.')
        case 'constant':
            throw new Error(`At line: ${CurrentNode.Operation.line}. ` +
            'Trying to get address of a constant value.')
        case 'array':
            if (RetMem.Offset !== undefined) {
                if (RetMem.Offset.type === 'constant') {
                    TmpMemObj = utils.createConstantMemObj(
                        utils.addHexSimple(RetMem.hexContent, RetMem.Offset.value)
                    )
                    TmpMemObj.declaration = RetMem.declaration
                    break
                }
                const Copyvar = deepCopy(RetMem)
                delete Copyvar.Offset
                TmpMemObj = AuxVars.getNewRegister()
                TmpMemObj.declaration = RetMem.declaration
                asmCode += createInstruction(AuxVars, utils.genAssignmentToken(CurrentNode.Operation.line), TmpMemObj, Copyvar)
                asmCode += createInstruction(
                    AuxVars,
                    utils.genAddToken(),
                    TmpMemObj,
                    AuxVars.getMemoryObjectByLocation(RetMem.Offset.addr)
                )
                break
            }
            TmpMemObj = utils.createConstantMemObj(RetMem.address)
            break
        case 'struct':
            TmpMemObj = utils.createConstantMemObj(RetMem.hexContent)
            TmpMemObj.declaration = 'struct_ptr'
            break
        case 'structRef':
            if (RetMem.Offset !== undefined) {
                throw new Error(`Internal error at line: ${CurrentNode.Operation.line}. ` +
                "Get address of 'structRef' with offset not implemented. ")
            }
            TmpMemObj = utils.createConstantMemObj(RetMem.address)
            TmpMemObj.declaration = 'struct_ptr'
            break
        case 'long':
        case 'fixed':
            TmpMemObj = utils.createConstantMemObj(RetMem.address)
            TmpMemObj.declaration = RetMem.type
            break
        default:
            throw new Error(`Internal error at line ${CurrentNode.Operation.line}.`)
        }
        if (!TmpMemObj.declaration.includes('_ptr')) {
            TmpMemObj.declaration += '_ptr'
        }
        return { SolvedMem: TmpMemObj, asmCode: asmCode }
    }

    function unaryKeywordProcessor () : GENCODE_SOLVED_OBJECT {
        switch (CurrentNode.Operation.value) {
        case 'long':
        case 'fixed':
        case 'void':
            AuxVars.isDeclaration = CurrentNode.Operation.value
            return traverseNotLogical()
        case 'const':
            AuxVars.isConstSentence = true
            return traverseNotLogical()
        case 'return':
            return returnKeyProc()
        case 'goto':
            return gotoKeyProc()
        case 'sleep':
            return sleepKeyProc()
        case 'sizeof':
            return sizeofKeyProc()
        case 'struct':
            // nothing to do here
            return { SolvedMem: utils.createVoidMemObj(), asmCode: '' }
        default:
            throw new Error(`Internal error: At line: ${CurrentNode.Operation.line}. ` +
            `Invalid use of keyword '${CurrentNode.Operation.value}'`)
        }
    }

    function returnKeyProc () : GENCODE_SOLVED_OBJECT {
        if (AuxVars.CurrentFunction === undefined) {
            throw new Error(`At line: ${CurrentNode.Operation.line}.` +
            " Can not use 'return' in global statements.")
        }
        if (AuxVars.CurrentFunction.declaration === 'void') {
            throw new Error(`At line: ${CurrentNode.Operation.line}.` +
            ` Function '${AuxVars.CurrentFunction.name}' must return` +
            ` a ${AuxVars.CurrentFunction.declaration}' value.`)
        }
        if (AuxVars.CurrentFunction.name === 'main' || AuxVars.CurrentFunction.name === 'catch') {
            throw new Error(`At line: ${CurrentNode.Operation.line}. ` +
            ` Special function ${AuxVars.CurrentFunction.name} must return void value.`)
        }
        const CGenObj = traverseNotLogical()
        CGenObj.asmCode += AuxVars.getPostOperations()
        if (utils.isNotValidDeclarationOp(AuxVars.CurrentFunction.declaration, CGenObj.SolvedMem)) {
            throw new Error(`At line: ${CurrentNode.Operation.line}.` +
                ` Function ${AuxVars.CurrentFunction.name} must return` +
                ` '${AuxVars.CurrentFunction.declaration}' value,` +
                ` but it is returning '${CGenObj.SolvedMem.declaration}'.`)
        }
        CGenObj.asmCode += createInstruction(AuxVars, CurrentNode.Operation, CGenObj.SolvedMem)
        AuxVars.freeRegister(CGenObj.SolvedMem.address)
        return { SolvedMem: utils.createVoidMemObj(), asmCode: CGenObj.asmCode }
    }

    function gotoKeyProc () : GENCODE_SOLVED_OBJECT {
        const CGenObj = traverseNotLogical()
        CGenObj.asmCode += AuxVars.getPostOperations()
        if (CGenObj.SolvedMem.type !== 'label') {
            throw new Error(`At line: ${CurrentNode.Operation.line}. Argument for keyword 'goto' is not a label.`)
        }
        CGenObj.asmCode += createInstruction(AuxVars, CurrentNode.Operation, CGenObj.SolvedMem)
        AuxVars.freeRegister(CGenObj.SolvedMem.address)
        return { SolvedMem: utils.createVoidMemObj(), asmCode: CGenObj.asmCode }
    }

    function sleepKeyProc () : GENCODE_SOLVED_OBJECT {
        const CGenObj = traverseNotLogical()
        CGenObj.asmCode += AuxVars.getPostOperations()
        CGenObj.asmCode += createInstruction(AuxVars, CurrentNode.Operation, CGenObj.SolvedMem)
        AuxVars.freeRegister(CGenObj.SolvedMem.address)
        return { SolvedMem: utils.createVoidMemObj(), asmCode: CGenObj.asmCode }
    }

    function sizeofKeyProc () : GENCODE_SOLVED_OBJECT {
        const CGenObj = traverseNotLogical()
        if (CGenObj.SolvedMem.type === 'structRef' && CGenObj.SolvedMem.Offset !== undefined) {
            throw new Error(`At line: ${CurrentNode.Operation.line}. Struct pointer members not supported by 'sizeof'.`)
        }
        let size = CGenObj.SolvedMem.size
        if (CGenObj.SolvedMem.Offset === undefined && CGenObj.SolvedMem.ArrayItem !== undefined) {
            size = CGenObj.SolvedMem.ArrayItem.totalSize
        }
        return { SolvedMem: utils.createConstantMemObj(size), asmCode: CGenObj.asmCode }
    }

    function CodeCaveProcessor () : GENCODE_SOLVED_OBJECT {
        if (CurrentNode.Operation.declaration === '' || CurrentNode.Operation.declaration === undefined) {
            throw new Error('Internal error.')
        }
        const CGenObj = traverseNotLogical()
        const cDecl = utils.getDeclarationFromMemory(CGenObj.SolvedMem)
        if (cDecl === CurrentNode.Operation.declaration) {
            return CGenObj
        }
        return typeCasting(AuxVars, CGenObj, CurrentNode.Operation.declaration, CurrentNode.Operation.line)
    }

    return unaryAsnProcessorMain()
}
