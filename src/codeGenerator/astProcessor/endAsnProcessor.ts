import { assertNotUndefined } from '../../repository/repository'
import { CONTRACT } from '../../typings/contractTypes'
import { END_ASN, LONG_TYPE_DEFINITION, MEMORY_SLOT, STRUCT_TYPE_DEFINITION } from '../../typings/syntaxTypes'
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
        const RetMemObj = utils.createConstantMemObj(CurrentNode.Token.value)
        if (CurrentNode.Token.extValue === 'fixed') {
            RetMemObj.declaration = 'fixed'
        }
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
        if (AuxVars.isRegisterSentence) {
            return registerProc(retMemObj)
        }
        return { SolvedMem: retMemObj, asmCode: '' }
    }

    function registerProc (retMemObj: MEMORY_SLOT) : GENCODE_SOLVED_OBJECT {
        const lastFreeRegister = AuxVars.registerInfo.filter(Reg => Reg.inUse === false).reverse()[0]
        if (lastFreeRegister === undefined || lastFreeRegister.Template.asmName === 'r0') {
            throw new Error(`At line: ${CurrentNode.Token.line}. ` +
            'No more registers available. ' +
            `Increase the number with '#pragma maxAuxVars ${Program.Config.maxAuxVars + 1}' or try to reduce nested operations.`)
        }
        lastFreeRegister.inUse = true
        AuxVars.scopedRegisters.push(lastFreeRegister.Template.asmName)
        const varPrevAsmName = retMemObj.asmName
        const motherMemory = assertNotUndefined(Program.memory.find(obj => obj.asmName === retMemObj.asmName), 'Internal error')
        retMemObj.address = lastFreeRegister.Template.address
        retMemObj.asmName = lastFreeRegister.Template.asmName
        motherMemory.address = retMemObj.address
        motherMemory.asmName = retMemObj.asmName
        if (Program.Config.verboseAssembly) {
            return { SolvedMem: retMemObj, asmCode: `^comment scope ${lastFreeRegister.Template.asmName}:${varPrevAsmName}\n` }
        }
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
        case 'sleep':
            return {
                SolvedMem: utils.createVoidMemObj(),
                asmCode: createInstruction(AuxVars, CurrentNode.Token)
            }
        case 'void':
            throw new Error(`At line: ${CurrentNode.Token.line}. ` +
            "Invalid use of keyword 'void'.")
        case 'long': {
            const LongTypeDefinition = Program.typesDefinitions.find(
                Obj => Obj.type === 'long'
            ) as LONG_TYPE_DEFINITION | undefined
            return {
                SolvedMem: assertNotUndefined(LongTypeDefinition).MemoryTemplate,
                asmCode: ''
            }
        }
        case 'struct': {
            let StructTypeDefinition = Program.typesDefinitions.find(
                Obj => Obj.type === 'struct' && Obj.name === CurrentNode.Token.extValue
            ) as STRUCT_TYPE_DEFINITION | undefined
            if (StructTypeDefinition === undefined && AuxVars.CurrentFunction !== undefined) {
                StructTypeDefinition = Program.typesDefinitions.find(
                    Obj => Obj.type === 'struct' && Obj.name === AuxVars.CurrentFunction?.name + '_' + CurrentNode.Token.extValue
                ) as STRUCT_TYPE_DEFINITION | undefined
            }
            if (StructTypeDefinition === undefined) {
                throw new Error(`At line: ${CurrentNode.Token.line}. ` +
                    `Struct type definition for '${CurrentNode.Token.extValue}' not found.`)
            }
            return {
                SolvedMem: StructTypeDefinition.MemoryTemplate,
                asmCode: ''
            }
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
