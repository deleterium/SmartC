import { CONTRACT } from '../../typings/contractTypes'
import { END_ASN } from '../../typings/syntaxTypes'
import { createSimpleInstruction, createInstruction } from '../assemblyProcessor/createInstruction'
import { GENCODE_AUXVARS, GENCODE_ARGS, GENCODE_SOLVED_OBJECT } from '../codeGeneratorTypes'
import utils from '../utils'
import genCode from './genCode'

export default function endAsnProcessor (
    Program: CONTRACT, AuxVars: GENCODE_AUXVARS, ScopeInfo: GENCODE_ARGS
) : GENCODE_SOLVED_OBJECT {
    let CurrentNode: END_ASN

    function endAsnProcessorMain () : GENCODE_SOLVED_OBJECT {
        CurrentNode = utils.assertAsnType('endASN', ScopeInfo.RemAST)
        switch (CurrentNode.Token.type) {
        case 'Constant':
            return constantProc()
        case 'Variable':
            return variableProc()
        case 'Keyword':
            return keywordProc()
        default:
            throw new Error(`Internal error at line: ${CurrentNode.Token.line}.`)
        }
    }

    function constantProc () : GENCODE_SOLVED_OBJECT {
        if (ScopeInfo.logicalOp) {
            if (ScopeInfo.revLogic === false) {
                if (CurrentNode.Token.value === '0000000000000000') {
                    return {
                        SolvedMem: utils.createVoidMemObj(),
                        asmCode: createSimpleInstruction('Jump', ScopeInfo.jumpFalse)
                    }
                }
                return { SolvedMem: utils.createVoidMemObj(), asmCode: '' }
            }
            if (CurrentNode.Token.value !== '0000000000000000') {
                return {
                    SolvedMem: utils.createVoidMemObj(),
                    asmCode: createSimpleInstruction('Jump', ScopeInfo.jumpTrue)
                }
            }
            return { SolvedMem: utils.createVoidMemObj(), asmCode: '' }
        }
        const RetMemObj = utils.createConstantMemObj()
        RetMemObj.size = CurrentNode.Token.value.length / 16
        RetMemObj.hexContent = CurrentNode.Token.value
        return { SolvedMem: RetMemObj, asmCode: '' }
    }

    function variableProc () : GENCODE_SOLVED_OBJECT {
        if (ScopeInfo.logicalOp) {
            let { SolvedMem, asmCode } = genCode(Program, AuxVars, {
                RemAST: CurrentNode,
                logicalOp: false,
                revLogic: ScopeInfo.revLogic
            })
            asmCode += createInstruction(
                AuxVars,
                utils.genNotEqualToken(),
                SolvedMem,
                utils.createConstantMemObj(0),
                ScopeInfo.revLogic,
                ScopeInfo.jumpFalse,
                ScopeInfo.jumpTrue
            )
            AuxVars.freeRegister(SolvedMem.address)
            return { SolvedMem: utils.createVoidMemObj(), asmCode: asmCode }
        }
        const retMemObj = AuxVars.getMemoryObjectByName(
            CurrentNode.Token.value,
            CurrentNode.Token.line,
            AuxVars.isDeclaration
        )
        return { SolvedMem: retMemObj, asmCode: '' }
    }

    function keywordProc () : GENCODE_SOLVED_OBJECT {
        if (ScopeInfo.logicalOp) {
            throw new Error(`At line: ${CurrentNode.Token.line}. ` +
            `Cannot use of keyword '${CurrentNode.Token.value}' in logical statements.`)
        }
        switch (CurrentNode.Token.value) {
        case 'break':
        case 'continue':
        case 'asm':
        case 'exit':
        case 'halt':
            return {
                SolvedMem: utils.createVoidMemObj(),
                asmCode: createInstruction(AuxVars, CurrentNode.Token)
            }
        case 'return':
            // this is 'return;'
            if (AuxVars.CurrentFunction === undefined) {
                throw new Error(`At line: ${CurrentNode.Token.line}.` +
                " Can not use 'return' in global statements.")
            }
            if (AuxVars.CurrentFunction.declaration !== 'void') {
                throw new Error(`At line: ${CurrentNode.Token.line}.` +
                ` Function '${AuxVars.CurrentFunction.name}'` +
                ` must return a '${AuxVars.CurrentFunction.declaration}' value.`)
            }
            if (AuxVars.CurrentFunction.name === 'main' || AuxVars.CurrentFunction.name === 'catch') {
                return {
                    SolvedMem: utils.createVoidMemObj(),
                    asmCode: createSimpleInstruction('exit')
                }
            }
            return {
                SolvedMem: utils.createVoidMemObj(),
                asmCode: createInstruction(AuxVars, CurrentNode.Token)
            }
        default:
            throw new Error(`Internal error at line: ${CurrentNode.Token.line}.`)
        }
    }

    return endAsnProcessorMain()
}
