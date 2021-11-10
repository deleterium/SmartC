import { assertNotUndefined } from '../../repository/repository'
import { CONTRACT } from '../../typings/contractTypes'
import { createInstruction } from '../assemblyProcessor/createInstruction'
import { GENCODE_AUXVARS, GENCODE_ARGS, GENCODE_SOLVED_OBJECT } from '../typings/codeGeneratorTypes'
import { genCode } from './genCode'

export function exceptionAsnProcessor (
    Program: CONTRACT, AuxVars: GENCODE_AUXVARS, ScopeInfo: GENCODE_ARGS
) : GENCODE_SOLVED_OBJECT {
    if (ScopeInfo.RemAST.type !== 'exceptionASN') {
        throw new Error('Internal error.')
    }
    const CurrentNode = ScopeInfo.RemAST
    if (ScopeInfo.jumpFalse !== undefined) {
        throw new SyntaxError(`At line: ${CurrentNode.Operation.line}.` +
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
