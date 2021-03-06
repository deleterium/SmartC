import { assertNotUndefined } from '../../repository/repository'
import { CONTRACT } from '../../typings/contractTypes'
import { createInstruction } from '../assemblyProcessor/createInstruction'
import { GENCODE_AUXVARS, GENCODE_ARGS, GENCODE_SOLVED_OBJECT } from '../codeGeneratorTypes'
import utils from '../utils'
import genCode from './genCode'

export default function exceptionAsnProcessor (
    Program: CONTRACT, AuxVars: GENCODE_AUXVARS, ScopeInfo: GENCODE_ARGS
) : GENCODE_SOLVED_OBJECT {
    const CurrentNode = utils.assertAsnType('exceptionASN', ScopeInfo.RemAST)
    if (ScopeInfo.jumpFalse !== undefined) {
        throw new Error(`At line: ${CurrentNode.Operation.line}.` +
        ' Can not use SetUnaryOperator (++ or --) during logical operations with branches')
    }
    if (CurrentNode.Left !== undefined) {
        const LGenObj = genCode(Program, AuxVars, {
            RemAST: CurrentNode.Left,
            logicalOp: false,
            revLogic: ScopeInfo.revLogic,
            jumpFalse: ScopeInfo.jumpFalse,
            jumpTrue: ScopeInfo.jumpTrue
        })
        LGenObj.asmCode += createInstruction(AuxVars, CurrentNode.Operation, LGenObj.SolvedMem)
        return LGenObj
    }
    const RGenObj = genCode(Program, AuxVars, {
        RemAST: assertNotUndefined(CurrentNode.Right),
        logicalOp: false,
        revLogic: ScopeInfo.revLogic,
        jumpFalse: ScopeInfo.jumpFalse,
        jumpTrue: ScopeInfo.jumpTrue
    })
    AuxVars.postOperations += createInstruction(AuxVars, CurrentNode.Operation, RGenObj.SolvedMem)
    return RGenObj
}
