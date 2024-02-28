import { assertNotUndefined } from '../../repository/repository'
import { CONTRACT } from '../../typings/contractTypes'
import {
    MEMORY_SLOT, ARRAY_TYPE_DEFINITION, STRUCT_TYPE_DEFINITION, DECLARATION_TYPES, LOOKUP_ASN, TOKEN_MODIFIER, TOKEN_MODIFIER_ARRAY, TOKEN_MODIFIER_MEMBER
} from '../../typings/syntaxTypes'
import { createInstruction } from '../assemblyProcessor/createInstruction'
import { GENCODE_ARGS, GENCODE_SOLVED_OBJECT } from '../codeGeneratorTypes'
import utils from '../utils'
import functionSolver from './functionSolver'
import genCode from './genCode'

export default function lookupAsnProcessor (
    Program: CONTRACT, ScopeInfo: GENCODE_ARGS
) : GENCODE_SOLVED_OBJECT {
    let arrayIndex = -1
    let CurrentNode: LOOKUP_ASN

    function lookupAsnProcessorMain () : GENCODE_SOLVED_OBJECT {
        CurrentNode = utils.assertAsnType('lookupASN', ScopeInfo.RemAST)
        let StartObj: GENCODE_SOLVED_OBJECT
        switch (CurrentNode.Token.type) {
        case 'Variable':
            StartObj = {
                SolvedMem: Program.Context.getMemoryObjectByName(
                    CurrentNode.Token.value,
                    CurrentNode.Token.line,
                    Program.Context.SentenceContext.isDeclaration
                ),
                asmCode: ''
            }
            break
        case 'Function':
            StartObj = functionSolver(Program, ScopeInfo)
            break
        default:
            throw new Error(`Internal error at line: ${CurrentNode.Token.line}.`)
        }
        if (CurrentNode.modifiers.length !== 0 && StartObj.SolvedMem.type === 'void') {
            throw new Error(Program.Context.formatError(CurrentNode.Token.line,
                'Function returning void value can not have modifiers.'))
        }
        const EndObj = CurrentNode.modifiers.reduce(modifierProcessor, StartObj)
        if (ScopeInfo.logicalOp === true) {
            if (EndObj.SolvedMem.type === 'void') {
                throw new Error(Program.Context.formatError(CurrentNode.Token.line,
                    'Function returning void value can not be used in conditionals decision.'))
            }
            EndObj.asmCode += createInstruction(
                Program,
                utils.genNotEqualToken(),
                EndObj.SolvedMem,
                utils.createConstantMemObj(0),
                ScopeInfo.revLogic,
                ScopeInfo.jumpFalse,
                ScopeInfo.jumpTrue
            )
            Program.Context.freeRegister(EndObj.SolvedMem.address)
            return { SolvedMem: utils.createVoidMemObj(), asmCode: EndObj.asmCode }
        }
        return EndObj
    }

    function modifierProcessor (
        PreviousRetObj: GENCODE_SOLVED_OBJECT, CurrentModifier: TOKEN_MODIFIER
    ) : GENCODE_SOLVED_OBJECT {
        switch (CurrentModifier.type) {
        case 'MemberByVal':
        case 'MemberByRef':
            return memberProcessor(PreviousRetObj, CurrentModifier)
        case 'Array':
            return arrayProcessor(PreviousRetObj, CurrentModifier)
        }
    }

    function memberProcessor (
        Previous: GENCODE_SOLVED_OBJECT, CurrentModifier: TOKEN_MODIFIER_MEMBER
    ) : GENCODE_SOLVED_OBJECT {
        const memberName = CurrentModifier.Center.value
        const memberLine = CurrentModifier.Center.line
        if (memberName === 'length' && CurrentModifier.type === 'MemberByVal') {
            return memberLengthProc(Previous.SolvedMem)
        }
        const TypeD = getStructTypeDefinition(Previous.SolvedMem)
        const memberIdx = getStructMemberIndex(TypeD, memberName)
        let memOffset = 0
        const MembersDefinitions = TypeD.structMembers[memberIdx]
        if (MembersDefinitions.ArrayItem) {
            // Update arrItem information
            Previous.SolvedMem.ArrayItem = {
                declaration: MembersDefinitions.ArrayItem.declaration,
                totalSize: MembersDefinitions.ArrayItem.totalSize,
                type: MembersDefinitions.ArrayItem.type,
                typeDefinition: MembersDefinitions.ArrayItem.typeDefinition
            }
            memOffset = 1
        }
        // Reset array dimension counter
        arrayIndex = -1
        if (CurrentModifier.type === 'MemberByRef') {
            if (utils.getDeclarationFromMemory(Previous.SolvedMem) !== 'struct_ptr') {
                throw new Error(Program.Context.formatError(CurrentNode.Token.line,
                    `Variable '${Previous.SolvedMem.name}' not defined as struct pointer. Try to use '.' instead.`))
            }
            if (Previous.SolvedMem.Offset === undefined) {
                Previous.SolvedMem.Offset = {
                    type: 'constant',
                    value: memOffset + TypeD.structAccumulatedSize[memberIdx][1],
                    declaration: MembersDefinitions.declaration,
                    typeDefinition: MembersDefinitions.typeDefinition
                }
                return Previous
            }
            if (Previous.SolvedMem.Offset.type === 'constant') {
                // Deference location and continue
                const TmpMemObj = Program.Context.getNewRegister()
                TmpMemObj.declaration = Previous.SolvedMem.Offset.declaration
                TmpMemObj.typeDefinition = Previous.SolvedMem.Offset.typeDefinition
                Previous.asmCode += createInstruction(
                    Program,
                    utils.genAssignmentToken(CurrentNode.Token.line),
                    TmpMemObj,
                    Previous.SolvedMem
                )
                TmpMemObj.Offset = {
                    type: 'constant',
                    value: TypeD.structAccumulatedSize[memberIdx][1],
                    declaration: MembersDefinitions.declaration,
                    typeDefinition: MembersDefinitions.typeDefinition
                }
                return {
                    SolvedMem: TmpMemObj,
                    asmCode: Previous.asmCode
                }
            }
            // else Previous.MemObj.Offset.type is "variable"
            throw new Error(`Internal error at line: ${memberLine}. Inspection needed.`)
        }
        // from now on CurrentModifier.type is 'MemberByVal') {
        if (utils.getDeclarationFromMemory(Previous.SolvedMem) === 'struct_ptr') {
            throw new Error(Program.Context.formatError(memberLine,
                "Using wrong member notation. Try to use '->' instead."))
        }
        if (Previous.SolvedMem.Offset === undefined) {
            Previous.SolvedMem = Program.Context.getMemoryObjectByLocation(Number('0x' + Previous.SolvedMem.hexContent) +
                TypeD.structAccumulatedSize[memberIdx][1], memberLine)
            return Previous
        }
        if (Previous.SolvedMem.Offset.type === 'constant') {
            const newLoc = Previous.SolvedMem.Offset.value + Number('0x' + Previous.SolvedMem.hexContent)
            Previous.SolvedMem = Program.Context.getMemoryObjectByLocation(newLoc + TypeD.structAccumulatedSize[memberIdx][1], memberLine)
            return Previous
        }
        // finally Previous.MemObj.offset_type is "variable"
        Previous.asmCode += createInstruction(Program, utils.genAddToken(memberLine),
            Program.Context.getMemoryObjectByLocation(Previous.SolvedMem.Offset.addr, memberLine),
            utils.createConstantMemObj(memOffset + TypeD.structAccumulatedSize[memberIdx][1]))
        Previous.SolvedMem.Offset.declaration = MembersDefinitions.declaration
        Previous.SolvedMem.Offset.typeDefinition = MembersDefinitions.typeDefinition
        return Previous
    }

    function memberLengthProc (Memory: MEMORY_SLOT) : GENCODE_SOLVED_OBJECT {
        const TypeD = getArrayTypeDefinition(Memory)
        if (TypeD === undefined) {
            throw new Error(Program.Context.formatError(CurrentNode.Token.line,
                `Array type definition not found for variable '${Memory.name}'.`))
        }
        const len = assertNotUndefined(TypeD.MemoryTemplate.ArrayItem?.totalSize)
        if (Memory.Offset?.type === 'variable') {
            Program.Context.freeRegister(Memory.Offset.addr)
        }
        Program.Context.freeRegister(Memory.address)
        return {
            SolvedMem: utils.createConstantMemObj((len - 1) / TypeD.MemoryTemplate.size),
            asmCode: ''
        }
    }

    function getStructTypeDefinition (Memory: MEMORY_SLOT) : STRUCT_TYPE_DEFINITION {
        // Precedence 2: regular case
        let typeName = Memory.typeDefinition
        if (Memory.Offset?.declaration === 'struct') {
            // Precedence 1: Info on Offset
            typeName = Memory.Offset.typeDefinition
        }
        if (typeName === undefined) {
            throw new Error(Program.Context.formatError(CurrentNode.Token.line,
                `Variable '${Memory.name}' has no struct type definition`))
        }
        const StructTypeDefinition = Program.typesDefinitions.find(Obj =>
            Obj.type === 'struct' && Obj.name === typeName
        ) as STRUCT_TYPE_DEFINITION | undefined
        return assertNotUndefined(StructTypeDefinition)
    }

    function getStructMemberIndex (TypeD: STRUCT_TYPE_DEFINITION, memberName: string) : number {
        let memberIdx = -1
        memberIdx = TypeD.structAccumulatedSize.findIndex(item => item[0] === memberName)
        if (memberIdx === -1) {
            throw new Error(Program.Context.formatError(CurrentNode.Token.line,
                `Member '${memberName}' not found on struct type definition.`))
        }
        return memberIdx
    }

    // Previous object will be updated and returned.
    function arrayProcessor (
        Previous: GENCODE_SOLVED_OBJECT, CurrentModifier: TOKEN_MODIFIER_ARRAY
    ) : GENCODE_SOLVED_OBJECT {
        // When dealing multi dimensional arrays, this index will keep increasing
        arrayIndex++
        const multiplier = getArrayDimensionMultipler(Previous.SolvedMem, arrayIndex)
        // pointer operation pre-processing
        if (Previous.SolvedMem.ArrayItem === undefined) {
            if (Previous.SolvedMem.Offset !== undefined) {
                throw new Error('Internal error.')
            }
            Previous.SolvedMem.ArrayItem = {
                type: Previous.SolvedMem.type,
                declaration: Previous.SolvedMem.declaration === 'void_ptr'
                    ? 'long'
                    : Previous.SolvedMem.declaration.slice(0, -4) as DECLARATION_TYPES,
                typeDefinition: '',
                totalSize: 0
            }
        }
        // Solve array parameter AST
        const ParamMemObj = genCode(Program, {
            RemAST: CurrentModifier.Center,
            logicalOp: false,
            revLogic: false
        })
        if (ParamMemObj.SolvedMem.Offset) {
            // Need to deference array index...
            const TmpMemObj = Program.Context.getNewRegister()
            TmpMemObj.declaration = utils.getDeclarationFromMemory(ParamMemObj.SolvedMem)
            ParamMemObj.asmCode += createInstruction(Program, utils.genAssignmentToken(CurrentNode.Token.line), TmpMemObj, ParamMemObj.SolvedMem)
            if (ParamMemObj.SolvedMem.Offset.type === 'variable') {
                Program.Context.freeRegister(ParamMemObj.SolvedMem.Offset.addr)
            }
            Program.Context.freeRegister(ParamMemObj.SolvedMem.address)
            ParamMemObj.SolvedMem = TmpMemObj
        }
        Previous.asmCode += ParamMemObj.asmCode
        // special case for left side void array multi long assignment
        if (ParamMemObj.SolvedMem.type === 'void') {
            Program.Context.SentenceContext.hasVoidArray = true
            return Previous
        }
        // big decision tree depending on Previous.MemObj.Offset.value and ParamMemObj.address
        if (Previous.SolvedMem.Offset === undefined) {
            return arrProcOffsetUndef(Previous, ParamMemObj.SolvedMem, multiplier)
        }
        if (Previous.SolvedMem.Offset.type === 'constant') {
            return arrProcOffsetConstant(Previous, ParamMemObj.SolvedMem, multiplier)
        }
        Previous.SolvedMem.Offset.declaration = Previous.SolvedMem.ArrayItem.declaration
        Previous.SolvedMem.Offset.typeDefinition = Previous.SolvedMem.ArrayItem.typeDefinition
        if (Program.Context.isTemp(Previous.SolvedMem.Offset.addr)) {
            return arrProcOffsetRegister(Previous, ParamMemObj.SolvedMem, multiplier)
        }
        // Finally Previous.MemObj.Offset.addr is variable and not register
        // Code removed because it is impossible to reach with current rules for arrays and structs.
        throw new Error('Internal error.')
    }

    function getArrayDimensionMultipler (Memory: MEMORY_SLOT, desiredDimension: number) : number {
        const TypeDefinition = getArrayTypeDefinition(Memory)
        if (TypeDefinition !== undefined) {
            return TypeDefinition.arrayMultiplierDim[desiredDimension]
        }
        if (utils.getDeclarationFromMemory(Memory).includes('_ptr') === false) {
            throw new Error(Program.Context.formatError(CurrentNode.Token.line,
                `Array type definition not found. Is '${Memory}' declared as array or pointer?`))
        }
        return 1 // allow use of array notation on pointer variables.
    }

    function getArrayTypeDefinition (Memory: MEMORY_SLOT) : ARRAY_TYPE_DEFINITION | undefined {
        // Precedence 2: base memory type definition
        let typeDef = Memory.typeDefinition
        // precedence 1: type definition in offset property
        if (Memory.Offset && Memory.Offset.declaration !== 'struct') {
            typeDef = Memory.Offset?.typeDefinition
        }
        return Program.typesDefinitions.find(obj => {
            return obj.type === 'array' && obj.name === typeDef
        }) as ARRAY_TYPE_DEFINITION | undefined
    }

    function arrProcOffsetUndef (
        Previous: GENCODE_SOLVED_OBJECT, Param: MEMORY_SLOT, multiplier: number
    ) : GENCODE_SOLVED_OBJECT {
        const paramType = getMemoryType(Param.address)
        let TmpMemObj: MEMORY_SLOT
        if (Previous.SolvedMem.ArrayItem === undefined) {
            throw new Error('Internal error.')
        }
        if (utils.getDeclarationFromMemory(Param) === 'fixed') {
            throw new Error(Program.Context.formatError(CurrentNode.Token.line,
                'Array index cannot be fixed type.'))
        }
        switch (paramType) {
        case 'constant':
            Previous.SolvedMem.Offset = {
                type: 'constant',
                value: Number(`0x${Param.hexContent}`) * multiplier,
                declaration: Previous.SolvedMem.ArrayItem.declaration,
                typeDefinition: Previous.SolvedMem.ArrayItem.typeDefinition
            }
            return Previous
        case 'register':
            Previous.SolvedMem.Offset = {
                type: 'variable',
                addr: Param.address,
                declaration: Previous.SolvedMem.ArrayItem.declaration,
                typeDefinition: Previous.SolvedMem.ArrayItem.typeDefinition
            }
            Previous.asmCode += createInstruction(
                Program,
                utils.genMulToken(CurrentNode.Token.line),
                Param,
                utils.createConstantMemObj(multiplier)
            )
            return Previous
        case 'regularVariable':
            if (multiplier === 1) {
                Previous.SolvedMem.Offset = {
                    type: 'variable',
                    addr: Param.address,
                    declaration: Previous.SolvedMem.ArrayItem.declaration,
                    typeDefinition: Previous.SolvedMem.ArrayItem.typeDefinition
                }
                return Previous
            }
            TmpMemObj = Program.Context.getNewRegister()
            Previous.asmCode += createInstruction(
                Program, utils.genAssignmentToken(CurrentNode.Token.line), TmpMemObj, utils.createConstantMemObj(multiplier)
            )
            Previous.asmCode += createInstruction(Program, utils.genMulToken(CurrentNode.Token.line), TmpMemObj, Param)
            Previous.SolvedMem.Offset = {
                type: 'variable',
                addr: TmpMemObj.address,
                declaration: Previous.SolvedMem.ArrayItem.declaration,
                typeDefinition: Previous.SolvedMem.ArrayItem.typeDefinition
            }
            return Previous
        }
    }

    function arrProcOffsetConstant (
        Previous: GENCODE_SOLVED_OBJECT, Param: MEMORY_SLOT, multiplier: number
    ) : GENCODE_SOLVED_OBJECT {
        const paramType = getMemoryType(Param.address)
        let TmpMemObj: MEMORY_SLOT
        if (Previous.SolvedMem.ArrayItem === undefined || Previous.SolvedMem.Offset?.type !== 'constant') {
            throw new Error('Internal error.')
        }
        switch (paramType) {
        case 'constant':
            Previous.SolvedMem.Offset.value += Number(`0x${Param.hexContent}`) * multiplier
            Previous.SolvedMem.Offset.declaration = Previous.SolvedMem.ArrayItem.declaration
            Previous.SolvedMem.Offset.typeDefinition = Previous.SolvedMem.ArrayItem.typeDefinition
            return Previous
        case 'register':
            Previous.asmCode += createInstruction(
                Program,
                utils.genMulToken(CurrentNode.Token.line),
                Param,
                utils.createConstantMemObj(multiplier)
            )
            Previous.asmCode += createInstruction(
                Program,
                utils.genAddToken(CurrentNode.Token.line),
                Param,
                utils.createConstantMemObj(Previous.SolvedMem.Offset.value)
            )
            Previous.SolvedMem.Offset = {
                type: 'variable',
                addr: Param.address,
                declaration: Previous.SolvedMem.ArrayItem.declaration,
                typeDefinition: Previous.SolvedMem.ArrayItem.typeDefinition
            }
            return Previous
        case 'regularVariable':
            if (multiplier === 1 && Previous.SolvedMem.Offset.value === 0) {
                Previous.SolvedMem.Offset = {
                    type: 'variable',
                    addr: Param.address,
                    declaration: Previous.SolvedMem.ArrayItem.declaration,
                    typeDefinition: Previous.SolvedMem.ArrayItem.typeDefinition
                }
                return Previous
            }
            TmpMemObj = Program.Context.getNewRegister()
            Previous.asmCode += createInstruction(Program, utils.genAssignmentToken(CurrentNode.Token.line), TmpMemObj, Param)
            Previous.asmCode += createInstruction(
                Program,
                utils.genMulToken(CurrentNode.Token.line),
                TmpMemObj,
                utils.createConstantMemObj(multiplier)
            )
            Previous.asmCode += createInstruction(
                Program,
                utils.genAddToken(CurrentNode.Token.line),
                TmpMemObj,
                utils.createConstantMemObj(Previous.SolvedMem.Offset.value)
            )
            Previous.SolvedMem.Offset = {
                type: 'variable',
                addr: TmpMemObj.address,
                declaration: Previous.SolvedMem.ArrayItem.declaration,
                typeDefinition: Previous.SolvedMem.ArrayItem.typeDefinition
            }
            return Previous
        }
    }

    function arrProcOffsetRegister (
        Previous: GENCODE_SOLVED_OBJECT, Param: MEMORY_SLOT, multiplier: number
    ) : GENCODE_SOLVED_OBJECT {
        const paramType = getMemoryType(Param.address)
        let TmpMemObj: MEMORY_SLOT
        if (Previous.SolvedMem.Offset === undefined || Previous.SolvedMem.Offset.type !== 'variable') {
            throw new Error('Internal error.')
        }
        switch (paramType) {
        case 'constant': {
            multiplier *= Number('0x' + Param.hexContent)
            Previous.asmCode += createInstruction(
                Program,
                utils.genAddToken(CurrentNode.Token.line),
                Program.Context.getMemoryObjectByLocation(Previous.SolvedMem.Offset.addr, CurrentNode.Token.line),
                utils.createConstantMemObj(multiplier)
            )
            return Previous
        }
        case 'register':
            Previous.asmCode += createInstruction(
                Program,
                utils.genMulToken(CurrentNode.Token.line),
                Param,
                utils.createConstantMemObj(multiplier)
            )
            Previous.asmCode += createInstruction(
                Program,
                utils.genAddToken(CurrentNode.Token.line),
                Program.Context.getMemoryObjectByLocation(Previous.SolvedMem.Offset.addr, CurrentNode.Token.line),
                Param
            )
            Program.Context.freeRegister(Param.address)
            return Previous
        case 'regularVariable':
            if (multiplier === 1) {
                Previous.asmCode += createInstruction(
                    Program,
                    utils.genAddToken(CurrentNode.Token.line),
                    Program.Context.getMemoryObjectByLocation(Previous.SolvedMem.Offset.addr, CurrentNode.Token.line),
                    Param
                )
                return Previous
            }
            TmpMemObj = Program.Context.getNewRegister()
            Previous.asmCode += createInstruction(Program, utils.genAssignmentToken(CurrentNode.Token.line), TmpMemObj, Param)
            Previous.asmCode += createInstruction(
                Program,
                utils.genMulToken(CurrentNode.Token.line),
                TmpMemObj,
                utils.createConstantMemObj(multiplier)
            )
            Previous.asmCode += createInstruction(
                Program,
                utils.genAddToken(CurrentNode.Token.line),
                Program.Context.getMemoryObjectByLocation(Previous.SolvedMem.Offset.addr, CurrentNode.Token.line),
                TmpMemObj
            )
            Program.Context.freeRegister(TmpMemObj.address)
            return Previous
        }
    }

    function getMemoryType (loc: number) : 'constant'|'register'|'regularVariable' {
        if (loc === -1) {
            return 'constant'
        }
        if (Program.Context.isTemp(loc)) {
            return 'register'
        }
        return 'regularVariable'
    }

    return lookupAsnProcessorMain()
}
