import { CONTRACT } from '../../typings/contractTypes'
import { SWITCH_ASN } from '../../typings/syntaxTypes'
import { createInstruction, createSimpleInstruction } from '../assemblyProcessor/createInstruction'
import { GENCODE_AUXVARS, GENCODE_ARGS, GENCODE_SOLVED_OBJECT } from '../codeGeneratorTypes'
import utils from '../utils'
import genCode from './genCode'

export default function switchAsnProcessor (
    Program: CONTRACT, AuxVars: GENCODE_AUXVARS, ScopeInfo: GENCODE_ARGS
) : GENCODE_SOLVED_OBJECT {
    let CurrentNode: SWITCH_ASN

    function switchAsnProcessorMain () : GENCODE_SOLVED_OBJECT {
        CurrentNode = utils.assertAsnType('switchASN', ScopeInfo.RemAST)
        let assemblyCode = ''

        const Expression = genCode(Program, AuxVars, {
            RemAST: CurrentNode.Expression,
            logicalOp: false,
            revLogic: ScopeInfo.revLogic
        })
        assemblyCode += Expression.asmCode

        if (Expression.SolvedMem.type === 'constant') {
            if (Expression.SolvedMem.hexContent === '0000000000000000') {
                return switchLogical(false)
            }
            return switchLogical(true)
        }
        CurrentNode.caseConditions.forEach((Cond, index) => {
            const OneCondition = genCode(Program, AuxVars, {
                RemAST: Cond,
                logicalOp: false,
                revLogic: ScopeInfo.revLogic
            })
            assemblyCode += OneCondition.asmCode
            assemblyCode += createInstruction(
                AuxVars,
                utils.genNotEqualToken(),
                Expression.SolvedMem,
                OneCondition.SolvedMem,
                ScopeInfo.revLogic,
                ScopeInfo.jumpFalse + '_' + index,
                ScopeInfo.jumpTrue
            )
        })
        assemblyCode += createSimpleInstruction('Jump', ScopeInfo.jumpTrue)
        return {
            SolvedMem: utils.createVoidMemObj(),
            asmCode: assemblyCode
        }
    }

    function switchLogical (switchTrue: boolean) : GENCODE_SOLVED_OBJECT {
        let assemblyCode = ''
        CurrentNode.caseConditions.forEach((Cond, index) => {
            const Args = {
                RemAST: Cond,
                logicalOp: true,
                revLogic: true,
                jumpFalse: ScopeInfo.jumpFalse + '_' + index + '_next',
                jumpTrue: ScopeInfo.jumpFalse + '_' + index
            }
            if (!switchTrue) {
                Args.revLogic = false
                Args.jumpFalse = ScopeInfo.jumpFalse + '_' + index
                Args.jumpTrue = ScopeInfo.jumpFalse + '_' + index + '_next'
            }
            const OneCondition = genCode(Program, AuxVars, Args)
            assemblyCode += OneCondition.asmCode
            assemblyCode += createSimpleInstruction('Label', ScopeInfo.jumpFalse + '_' + index + '_next')
        })
        assemblyCode += createSimpleInstruction('Jump', ScopeInfo.jumpTrue)
        return {
            SolvedMem: utils.createVoidMemObj(),
            asmCode: assemblyCode
        }
    }

    return switchAsnProcessorMain()
}
