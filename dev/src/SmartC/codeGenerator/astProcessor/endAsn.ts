import { CONTRACT } from '../../typings/contractTypes'
import { END_ASN } from '../../typings/syntaxTypes'
import { createSimpleInstruction, createInstruction } from '../assemblyProcessor/createInstruction'
import { GENCODE_AUXVARS, GENCODE_ARGS, GENCODE_SOLVED_OBJECT } from '../typings/codeGeneratorTypes'
import { utils } from '../utils'
import { genCode } from './genCode'

export function endAsnProcessor (
    Program: CONTRACT, AuxVars: GENCODE_AUXVARS, ScopeInfo: GENCODE_ARGS
) : GENCODE_SOLVED_OBJECT {
    let currentNode: END_ASN

    function endAsnProcessorMain () : GENCODE_SOLVED_OBJECT {
        if (ScopeInfo.RemAST.type !== 'endASN') {
            throw new Error('Internal error.')
        }
        currentNode = ScopeInfo.RemAST
        switch (currentNode.Token.type) {
        case 'Constant':
            return constantProc()
        case 'Variable':
            return variableProc()
        case 'Keyword':
            return keywordProc()
        default:
            throw new Error(`Internal error at line: ${currentNode.Token.line}.`)
        }
    }

    function constantProc () : GENCODE_SOLVED_OBJECT {
        if (ScopeInfo.logicalOp) {
            if (ScopeInfo.revLogic === false) {
                if (currentNode.Token.value === '0000000000000000') {
                    return {
                        SolvedMem: utils.createVoidMemObj(),
                        asmCode: createSimpleInstruction('Jump', ScopeInfo.jumpFalse)
                    }
                }
                return { SolvedMem: utils.createVoidMemObj(), asmCode: '' }
            }
            if (currentNode.Token.value !== '0000000000000000') {
                return {
                    SolvedMem: utils.createVoidMemObj(),
                    asmCode: createSimpleInstruction('Jump', ScopeInfo.jumpTrue)
                }
            }
            return { SolvedMem: utils.createVoidMemObj(), asmCode: '' }
        }
        const RetMemObj = utils.createConstantMemObj()
        RetMemObj.size = currentNode.Token.value.length / 16
        RetMemObj.hexContent = currentNode.Token.value
        return { SolvedMem: RetMemObj, asmCode: '' }
    }

    function variableProc () : GENCODE_SOLVED_OBJECT {
        if (ScopeInfo.logicalOp) {
            let { SolvedMem, asmCode } = genCode(Program, AuxVars, {
                RemAST: currentNode,
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
            currentNode.Token.value,
            currentNode.Token.line,
            AuxVars.isDeclaration
        )
        return { SolvedMem: retMemObj, asmCode: '' }
    }

    function keywordProc () : GENCODE_SOLVED_OBJECT {
        if (ScopeInfo.logicalOp) {
            throw new Error(`Internal error at line: ${currentNode.Token.line}. ` +
            `Invalid use of keyword '${currentNode.Token.value}'.`)
        }
        switch (currentNode.Token.value) {
        case 'break':
        case 'continue':
        case 'label':
        case 'asm':
        case 'exit':
        case 'halt':
            return {
                SolvedMem: utils.createVoidMemObj(),
                asmCode: createInstruction(AuxVars, currentNode.Token)
            }
        case 'return':
            // this is 'return;'
            if (AuxVars.CurrentFunction === undefined) {
                throw new Error(`At line: ${currentNode.Token.line}.` +
                " Can not use 'return' in global statements.")
            }
            if (AuxVars.CurrentFunction.declaration !== 'void') {
                throw new Error(`At line: ${currentNode.Token.line}.` +
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
                asmCode: createInstruction(AuxVars, currentNode.Token)
            }
        default:
            throw new Error(`Internal error at line: ${currentNode.Token.line}.`)
        }
    }

    return endAsnProcessorMain()
}
