import { assertNotUndefined } from '../../repository/repository'
import { CONTRACT, SC_FUNCTION } from '../../typings/contractTypes'
import { MEMORY_SLOT, AST, ARRAY_TYPE_DEFINITION, STRUCT_TYPE_DEFINITION, DECLARATION_TYPES, LOOKUP_ASN, TOKEN_MODIFIER } from '../../typings/syntaxTypes'
import { createAPICallInstruction, createSimpleInstruction, createInstruction } from '../assemblyProcessor/opToAssembly'
import { GENCODE_AUXVARS, GENCODE_ARGS, GENCODE_SOLVED_OBJECT } from '../typings/codeGeneratorTypes'
import { utils } from '../utils'
import { genCode } from './genCode'

export function lookupAsnProcessor (Program: CONTRACT, AuxVars: GENCODE_AUXVARS, ScopeInfo: GENCODE_ARGS): GENCODE_SOLVED_OBJECT {
    let arrayIndex = -1
    let CurrentNode: LOOKUP_ASN

    function lookupAsnProcessorMain () : GENCODE_SOLVED_OBJECT {
        if (ScopeInfo.RemAST.type !== 'lookupASN') {
            throw new TypeError('Internal error.')
        }
        CurrentNode = ScopeInfo.RemAST
        let StartObj: GENCODE_SOLVED_OBJECT
        switch (CurrentNode.Token.type) {
        case 'Variable':
            StartObj = {
                SolvedMem: AuxVars.getMemoryObjectByName(CurrentNode.Token.value, CurrentNode.Token.line, AuxVars.isDeclaration),
                asmCode: ''
            }
            break
        case 'Function':
            StartObj = functionSolver()
            break
        default:
            throw new TypeError(`Internal error at line: ${CurrentNode.Token.line}.` +
                ` Modifiers on '${CurrentNode.Token.type}' not implemmented.`)
        }
        if (CurrentNode.modifiers.length !== 0 && StartObj.SolvedMem.type === 'void') {
            throw new TypeError(`At line: ${CurrentNode.Token.line}.` +
                ' Function returning void value can not have modifiers.')
        }
        const EndObj = CurrentNode.modifiers.reduce(modifierProcessor, StartObj)
        if (ScopeInfo.logicalOp === true) {
            if (EndObj.SolvedMem.type === 'void') {
                throw new TypeError(`At line: ${CurrentNode.Token.line}.` +
                    ' Function returning void value can not be used in conditionals decision.')
            }
            EndObj.asmCode += createInstruction(AuxVars, utils.genNotEqualToken(), EndObj.SolvedMem, utils.createConstantMemObj(0), ScopeInfo.revLogic, ScopeInfo.jumpFalse, ScopeInfo.jumpTrue)
            AuxVars.freeRegister(EndObj.SolvedMem.address)
            return { SolvedMem: utils.createVoidMemObj(), asmCode: EndObj.asmCode }
        }
        return EndObj
    }

    function functionSolver () : GENCODE_SOLVED_OBJECT {
        const fnName = assertNotUndefined(CurrentNode.Token.extValue)
        const FnToCall = Program.functions.find(val => val.name === fnName)
        const ApiToCall = Program.Global.APIFunctions.find(val => val.name === fnName)
        const subSentences = utils.splitASTOnDelimiters(assertNotUndefined(CurrentNode.FunctionArgs))
        if (FnToCall) {
            return userFunctionSolver(FnToCall, subSentences)
        }
        if (ApiToCall) {
            return apiFunctionSolver(ApiToCall, subSentences)
        }
        throw new TypeError(`At line: ${CurrentNode.Token.line}. Function '${fnName}' not declared.`)
    }

    function userFunctionSolver (FunctionToCall: SC_FUNCTION, rawArgs: AST[]) : GENCODE_SOLVED_OBJECT {
        let FnRetObj: MEMORY_SLOT
        let returnAssemblyCode = ''
        // It is regular function call
        let isRecursive = false
        if (FunctionToCall.name === AuxVars.CurrentFunction?.name) {
            isRecursive = true
            // stack current scope variables
            AuxVars.memory.filter(OBJ => OBJ.scope === FunctionToCall.name && OBJ.address > 0).reverse().forEach(MEM => {
                returnAssemblyCode += createSimpleInstruction('Push', MEM.asmName)
            })
        }
        // Save registers currently in use in stack. Function execution will overwrite them
        const registerStack = AuxVars.registerInfo.filter(OBJ => OBJ.inUse === true).reverse()
        registerStack.forEach(OBJ => {
            returnAssemblyCode += createSimpleInstruction('Push', OBJ.Template.asmName)
        })
        // Check function arguments
        if (rawArgs[0].type === 'nullASN') {
            rawArgs.pop()
        }
        if (rawArgs.length !== FunctionToCall.argsMemObj.length) {
            throw new TypeError(`At line: ${CurrentNode.Token.line}.` +
            ` Wrong number of arguments for function '${FunctionToCall.name}'.` +
            ` It must have '${FunctionToCall.argsMemObj.length}' args.`)
        }
        // Push arguments into stack
        for (let i = rawArgs.length - 1; i >= 0; i--) {
            const ArgGenObj = genCode(Program, AuxVars, {
                RemAST: rawArgs[i],
                logicalOp: false,
                revLogic: false
            })
            const fnArg = FunctionToCall.argsMemObj[i]
            if (utils.isNotValidDeclarationOp(fnArg.declaration, ArgGenObj.SolvedMem)) {
                if (Program.Config.warningToError) {
                    throw new TypeError(`At line: ${CurrentNode.Token.line}.` +
                        ` Warning: Function parameter type is different from variable: '${fnArg.declaration}'` +
                        ` and '${ArgGenObj.SolvedMem.declaration}'.`)
                }
                // Override declaration protection rules
                utils.setMemoryDeclaration(ArgGenObj.SolvedMem, fnArg.declaration)
            }
            returnAssemblyCode += ArgGenObj.asmCode
            returnAssemblyCode += createInstruction(AuxVars, utils.genPushToken(CurrentNode.Token.line), ArgGenObj.SolvedMem)
            AuxVars.freeRegister(ArgGenObj.SolvedMem.address)
        }
        // Create instruction
        returnAssemblyCode += createSimpleInstruction('Function', FunctionToCall.name)
        // Pop return value from stack
        if (FunctionToCall.declaration === 'void') {
            FnRetObj = utils.createVoidMemObj()
        } else {
            FnRetObj = AuxVars.getNewRegister()
            FnRetObj.declaration = FunctionToCall.declaration
            FnRetObj.typeDefinition = FunctionToCall.typeDefinition
            returnAssemblyCode += createSimpleInstruction('Pop', FnRetObj.asmName)
        }
        // Load registers again
        registerStack.reverse()
        registerStack.forEach(OBJ => {
            returnAssemblyCode += createSimpleInstruction('Pop', OBJ.Template.asmName)
        })
        if (isRecursive) {
            // unstack current scope variables
            AuxVars.memory.filter(OBJ => OBJ.scope === FunctionToCall.name && OBJ.address > 0).forEach(MEM => {
                returnAssemblyCode += createSimpleInstruction('Pop', MEM.asmName)
            })
        }
        return { SolvedMem: FnRetObj, asmCode: returnAssemblyCode }
    }

    function apiFunctionSolver (apiToCall: SC_FUNCTION, rawArgs: AST[]) : GENCODE_SOLVED_OBJECT {
        let FnRetObj: MEMORY_SLOT
        const processedArgs: MEMORY_SLOT [] = []
        let returnAssemblyCode = ''
        if (apiToCall.declaration === 'void') {
            FnRetObj = utils.createVoidMemObj()
        } else {
            FnRetObj = AuxVars.getNewRegister() // reserve tempvar for return type
        }
        if (rawArgs[0].type === 'nullASN') {
            rawArgs.pop()
        }
        if (rawArgs.length !== apiToCall.argsMemObj.length) {
            throw new TypeError(`At line: ${CurrentNode.Token.line}.` +
                ` Wrong number of arguments for function '${apiToCall.name}'.` +
                ` It must have '${apiToCall.argsMemObj.length}' args.`)
        }
        rawArgs.forEach(rawSentence => {
            const ArgGenObj = genCode(Program, AuxVars, {
                RemAST: rawSentence,
                logicalOp: false,
                revLogic: false
            })
            returnAssemblyCode += ArgGenObj.asmCode
            if (utils.getDeclarationFromMemory(ArgGenObj.SolvedMem) !== 'long') {
                if (Program.Config.warningToError) {
                    throw new TypeError(`At line: ${CurrentNode.Token.line}.` +
                        ' Warning: API Function parameter type is different from variable: ' +
                        ` 'long' and '${ArgGenObj.SolvedMem.declaration}'.`)
                }
                // Override declaration protection rules
                utils.setMemoryDeclaration(ArgGenObj.SolvedMem, 'long')
            }
            processedArgs.push(ArgGenObj.SolvedMem)
        })
        returnAssemblyCode += createAPICallInstruction(AuxVars, utils.genAPICallToken(CurrentNode.Token.line, apiToCall.asmName), FnRetObj, processedArgs)
        processedArgs.forEach(varnm => AuxVars.freeRegister(varnm.address))
        return { SolvedMem: FnRetObj, asmCode: returnAssemblyCode }
    }

    function modifierProcessor (PreviousRetObj: GENCODE_SOLVED_OBJECT, CurrentModifier: TOKEN_MODIFIER) : GENCODE_SOLVED_OBJECT {
        switch (CurrentModifier.type) {
        case 'MemberByVal':
        case 'MemberByRef':
            return memberProcessor(PreviousRetObj, CurrentModifier)
        case 'Array':
            return arrayProcessor(PreviousRetObj, CurrentModifier)
        }
    }

    function memberProcessor (Previous: GENCODE_SOLVED_OBJECT, CurrentModifier: TOKEN_MODIFIER) : GENCODE_SOLVED_OBJECT {
        if (CurrentModifier.Center.type !== 'Variable') {
            throw new TypeError(`At line: ${CurrentNode.Token.line}.` +
                ' Can not use variables as struct members.')
        }
        const memberName = CurrentModifier.Center.value
        if (memberName === 'length' && CurrentModifier.type === 'MemberByVal') {
            return memberLengthProc(Previous.SolvedMem)
        }
        const TypeD = getStrucTypeDefinition(Previous.SolvedMem)
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
                throw new TypeError(`At line: ${CurrentNode.Token.line}. ` +
                    ` Variable '${Previous.SolvedMem.name}' not defined as struct pointer. Try to use '.' instead.`)
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
                if (utils.getDeclarationFromMemory(Previous.SolvedMem) === 'struct_ptr') {
                    // Deference location and continue
                    const TmpMemObj = AuxVars.getNewRegister()
                    TmpMemObj.declaration = Previous.SolvedMem.Offset.declaration
                    TmpMemObj.typeDefinition = Previous.SolvedMem.Offset.typeDefinition
                    Previous.asmCode += createInstruction(AuxVars, utils.genAssignmentToken(), TmpMemObj, Previous.SolvedMem)
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
                Previous.SolvedMem.Offset.value += memOffset + TypeD.structAccumulatedSize[memberIdx][1]
                Previous.SolvedMem.Offset.declaration = MembersDefinitions.declaration
                Previous.SolvedMem.Offset.typeDefinition = MembersDefinitions.typeDefinition
                return Previous
            }
            // else Previous.MemObj.Offset.type is "variable"
            throw new TypeError(`Internal error at line: ${CurrentNode.Token.line}. Inspection needed.`)
        }
        // from now on CurrentModifier.type is 'MemberByVal') {
        if (utils.getDeclarationFromMemory(Previous.SolvedMem) === 'struct_ptr') {
            throw new TypeError(`At line: ${CurrentNode.Token.line}.` +
                " Using wrong member notation. Try to use '->' instead.")
        }
        if (Previous.SolvedMem.Offset === undefined) {
            Previous.SolvedMem = AuxVars.getMemoryObjectByLocation(Number('0x' + Previous.SolvedMem.hexContent) +
                TypeD.structAccumulatedSize[memberIdx][1])
            return Previous
        }
        if (Previous.SolvedMem.Offset.type === 'constant') {
            const newLoc = Previous.SolvedMem.Offset.value + Number('0x' + Previous.SolvedMem.hexContent)
            Previous.SolvedMem = AuxVars.getMemoryObjectByLocation(newLoc + TypeD.structAccumulatedSize[memberIdx][1])
            return Previous
        }
        // finally Previous.MemObj.offset_type is "variable"
        Previous.asmCode += createInstruction(AuxVars, utils.genAddToken(CurrentNode.Token.line),
            AuxVars.getMemoryObjectByLocation(Previous.SolvedMem.Offset.addr, CurrentNode.Token.line),
            utils.createConstantMemObj(memOffset + TypeD.structAccumulatedSize[memberIdx][1]))
        Previous.SolvedMem.Offset.declaration = MembersDefinitions.declaration
        Previous.SolvedMem.Offset.typeDefinition = MembersDefinitions.typeDefinition
        return Previous
    }

    function memberLengthProc (Memory: MEMORY_SLOT) : GENCODE_SOLVED_OBJECT {
        const TypeD = getArrayTypeDefinition(Memory)
        if (TypeD === undefined) {
            throw new TypeError(`At line: ${CurrentNode.Token.line}.` +
                ` Array type definition not found for variable '${Memory.name}'.`)
        }
        const len = TypeD.MemoryTemplate.ArrayItem?.totalSize
        if (len === undefined) {
            throw new TypeError(`At line: ${CurrentNode.Token.line}.` +
                ` Array total size not found for '${Memory.name}'.`)
        }
        if (Memory.Offset?.type === 'variable') {
            AuxVars.freeRegister(Memory.Offset.addr)
        }
        AuxVars.freeRegister(Memory.address)
        return {
            SolvedMem: utils.createConstantMemObj((len - 1) / TypeD.MemoryTemplate.size),
            asmCode: ''
        }
    }

    function getStrucTypeDefinition (Memory: MEMORY_SLOT) : STRUCT_TYPE_DEFINITION {
        // Precedence 2: regular case
        let typeName = Memory.typeDefinition
        if (Memory.Offset?.declaration === 'struct') {
            // Precedence 1: Info on Offset
            typeName = Memory.Offset.typeDefinition
        }
        if (typeName === undefined) {
            throw new TypeError(`At line: ${CurrentNode.Token.line}. ` +
                `Variable '${Memory.name}' has no struct type definition`)
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
            throw new TypeError(`At line: ${CurrentNode.Token.line}. ` +
                `Member '${memberName}' not found on struct type definition.`)
        }
        return memberIdx
    }

    // Previous object will be updated and returned.
    function arrayProcessor (Previous: GENCODE_SOLVED_OBJECT, CurrentModifier: TOKEN_MODIFIER) : GENCODE_SOLVED_OBJECT {
        let TmpMemObj: MEMORY_SLOT
        // When dealing multi dimensional arrays, this index will keep increasing
        arrayIndex++
        if (CurrentModifier.type !== 'Array') {
            throw new Error('Internal error')
        }
        let multiplier = getArrayDimensionMultipler(Previous.SolvedMem, arrayIndex)
        // pointer operation pre-processing
        if (Previous.SolvedMem.ArrayItem === undefined) {
            // Create generic array definition from variable declaration
            if (Previous.SolvedMem.Offset === undefined) {
                Previous.SolvedMem.ArrayItem = {
                    type: Previous.SolvedMem.type,
                    declaration: Previous.SolvedMem.declaration === 'void_ptr' ? 'long' : Previous.SolvedMem.declaration.slice(0, -4) as DECLARATION_TYPES,
                    typeDefinition: '',
                    totalSize: 0
                }
            } else {
                // Copy information from Offset
                Previous.SolvedMem.ArrayItem = {
                    type: 'long',
                    declaration: Previous.SolvedMem.Offset.declaration === 'void_ptr' ? 'long' : Previous.SolvedMem.Offset.declaration.slice(0, -4) as DECLARATION_TYPES,
                    typeDefinition: Previous.SolvedMem.Offset.typeDefinition,
                    totalSize: 0
                }
            }
        }
        // Solve array parameter AST
        const ParamMemObj = genCode(Program, AuxVars, {
            RemAST: CurrentModifier.Center,
            logicalOp: false,
            revLogic: false
        })
        Previous.asmCode += ParamMemObj.asmCode
        // special case for left side void array multi long assignment
        if (ParamMemObj.SolvedMem.type === 'void') {
            AuxVars.hasVoidArray = true
            return Previous
        }
        // big decision tree depending on Previous.MemObj.Offset.value and ParamMemObj.address
        const paramType = getMemoryType(ParamMemObj.SolvedMem.address)
        if (Previous.SolvedMem.Offset === undefined) {
            switch (paramType) {
            case 'constant':
                Previous.SolvedMem.Offset = {
                    type: 'constant',
                    value: Number(`0x${ParamMemObj.SolvedMem.hexContent}`) * multiplier,
                    declaration: Previous.SolvedMem.ArrayItem.declaration,
                    typeDefinition: Previous.SolvedMem.ArrayItem.typeDefinition
                }
                return Previous
            case 'register':
                Previous.SolvedMem.Offset = {
                    type: 'variable',
                    addr: ParamMemObj.SolvedMem.address,
                    declaration: Previous.SolvedMem.ArrayItem.declaration,
                    typeDefinition: Previous.SolvedMem.ArrayItem.typeDefinition

                }
                Previous.asmCode += createInstruction(AuxVars, utils.genMulToken(CurrentNode.Token.line), ParamMemObj.SolvedMem, utils.createConstantMemObj(multiplier))
                return Previous
            case 'regularVariable':
                if (multiplier === 1) {
                    Previous.SolvedMem.Offset = {
                        type: 'variable',
                        addr: ParamMemObj.SolvedMem.address,
                        declaration: Previous.SolvedMem.ArrayItem.declaration,
                        typeDefinition: Previous.SolvedMem.ArrayItem.typeDefinition
                    }
                    return Previous
                }
                TmpMemObj = AuxVars.getNewRegister()
                Previous.asmCode += createInstruction(AuxVars, utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(multiplier))
                Previous.asmCode += createInstruction(AuxVars, utils.genMulToken(CurrentNode.Token.line), TmpMemObj, ParamMemObj.SolvedMem)
                Previous.SolvedMem.Offset = {
                    type: 'variable',
                    addr: TmpMemObj.address,
                    declaration: Previous.SolvedMem.ArrayItem.declaration,
                    typeDefinition: Previous.SolvedMem.ArrayItem.typeDefinition
                }
                return Previous
            }
        }
        if (Previous.SolvedMem.Offset.type === 'constant') {
            switch (paramType) {
            case 'constant':
                Previous.SolvedMem.Offset.value += Number(`0x${ParamMemObj.SolvedMem.hexContent}`) * multiplier
                Previous.SolvedMem.Offset.declaration = Previous.SolvedMem.ArrayItem.declaration
                Previous.SolvedMem.Offset.typeDefinition = Previous.SolvedMem.ArrayItem.typeDefinition
                return Previous
            case 'register':
                Previous.asmCode += createInstruction(AuxVars, utils.genMulToken(CurrentNode.Token.line), ParamMemObj.SolvedMem, utils.createConstantMemObj(multiplier))
                Previous.asmCode += createInstruction(AuxVars, utils.genAddToken(CurrentNode.Token.line), ParamMemObj.SolvedMem, utils.createConstantMemObj(Previous.SolvedMem.Offset.value))
                Previous.SolvedMem.Offset = {
                    type: 'variable',
                    addr: ParamMemObj.SolvedMem.address,
                    declaration: Previous.SolvedMem.ArrayItem.declaration,
                    typeDefinition: Previous.SolvedMem.ArrayItem.typeDefinition
                }
                return Previous
            case 'regularVariable':
                if (multiplier === 1 && Previous.SolvedMem.Offset.value === 0) {
                    Previous.SolvedMem.Offset = {
                        type: 'variable',
                        addr: ParamMemObj.SolvedMem.address,
                        declaration: Previous.SolvedMem.ArrayItem.declaration,
                        typeDefinition: Previous.SolvedMem.ArrayItem.typeDefinition
                    }
                    return Previous
                }
                TmpMemObj = AuxVars.getNewRegister()
                Previous.asmCode += createInstruction(AuxVars, utils.genAssignmentToken(), TmpMemObj, ParamMemObj.SolvedMem)
                Previous.asmCode += createInstruction(AuxVars, utils.genMulToken(CurrentNode.Token.line), TmpMemObj, utils.createConstantMemObj(multiplier))
                Previous.asmCode += createInstruction(AuxVars, utils.genAddToken(CurrentNode.Token.line), TmpMemObj, utils.createConstantMemObj(Previous.SolvedMem.Offset.value))
                Previous.SolvedMem.Offset = {
                    type: 'variable',
                    addr: TmpMemObj.address,
                    declaration: Previous.SolvedMem.ArrayItem.declaration,
                    typeDefinition: Previous.SolvedMem.ArrayItem.typeDefinition
                }
                return Previous
            }
        }
        // Necessary for all remaining cases
        Previous.SolvedMem.Offset.declaration = Previous.SolvedMem.ArrayItem.declaration
        Previous.SolvedMem.Offset.typeDefinition = Previous.SolvedMem.ArrayItem.typeDefinition
        if (AuxVars.isTemp(Previous.SolvedMem.Offset.addr)) {
            switch (paramType) {
            case 'constant': {
                multiplier *= Number('0x' + ParamMemObj.SolvedMem.hexContent)
                Previous.asmCode += createInstruction(AuxVars, utils.genAddToken(CurrentNode.Token.line), AuxVars.getMemoryObjectByLocation(Previous.SolvedMem.Offset.addr, CurrentNode.Token.line), utils.createConstantMemObj(multiplier))
                return Previous
            }
            case 'register':
                Previous.asmCode += createInstruction(AuxVars, utils.genMulToken(CurrentNode.Token.line), ParamMemObj.SolvedMem, utils.createConstantMemObj(multiplier))
                Previous.asmCode += createInstruction(AuxVars, utils.genAddToken(CurrentNode.Token.line), AuxVars.getMemoryObjectByLocation(Previous.SolvedMem.Offset.addr, CurrentNode.Token.line), ParamMemObj.SolvedMem)
                AuxVars.freeRegister(ParamMemObj.SolvedMem.address)
                return Previous
            case 'regularVariable':
                if (multiplier === 1) {
                    Previous.asmCode += createInstruction(AuxVars, utils.genAddToken(CurrentNode.Token.line), AuxVars.getMemoryObjectByLocation(Previous.SolvedMem.Offset.addr, CurrentNode.Token.line), ParamMemObj.SolvedMem)
                    return Previous
                }
                TmpMemObj = AuxVars.getNewRegister()
                Previous.asmCode += createInstruction(AuxVars, utils.genAssignmentToken(), TmpMemObj, ParamMemObj.SolvedMem)
                Previous.asmCode += createInstruction(AuxVars, utils.genMulToken(CurrentNode.Token.line), TmpMemObj, utils.createConstantMemObj(multiplier))
                Previous.asmCode += createInstruction(AuxVars, utils.genAddToken(CurrentNode.Token.line), AuxVars.getMemoryObjectByLocation(Previous.SolvedMem.Offset.addr, CurrentNode.Token.line), TmpMemObj)
                AuxVars.freeRegister(TmpMemObj.address)
                return Previous
            }
        }
        // finally Previous.MemObj.Offset.addr is variable and not register
        switch (paramType) {
        case 'constant':
            if (ParamMemObj.SolvedMem.hexContent === '0000000000000000') {
                return Previous
            }
            TmpMemObj = AuxVars.getNewRegister()
            Previous.asmCode += createInstruction(AuxVars, utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(ParamMemObj.SolvedMem.hexContent))
            Previous.asmCode += createInstruction(AuxVars, utils.genMulToken(CurrentNode.Token.line), TmpMemObj, utils.createConstantMemObj(multiplier))
            Previous.asmCode += createInstruction(AuxVars, utils.genAddToken(CurrentNode.Token.line), TmpMemObj, AuxVars.getMemoryObjectByLocation(Previous.SolvedMem.Offset.addr, CurrentNode.Token.line))
            Previous.SolvedMem.Offset.addr = TmpMemObj.address
            return Previous
        case 'register':
            Previous.asmCode += createInstruction(AuxVars, utils.genMulToken(CurrentNode.Token.line), ParamMemObj.SolvedMem, utils.createConstantMemObj(multiplier))
            Previous.asmCode += createInstruction(AuxVars, utils.genAddToken(CurrentNode.Token.line), ParamMemObj.SolvedMem, AuxVars.getMemoryObjectByLocation(Previous.SolvedMem.Offset.addr, CurrentNode.Token.line))
            Previous.SolvedMem.Offset.addr = ParamMemObj.SolvedMem.address
            return Previous
        case 'regularVariable':
            TmpMemObj = AuxVars.getNewRegister()
            Previous.asmCode += createInstruction(AuxVars, utils.genAssignmentToken(), TmpMemObj, ParamMemObj.SolvedMem)
            Previous.asmCode += createInstruction(AuxVars, utils.genMulToken(CurrentNode.Token.line), TmpMemObj, utils.createConstantMemObj(multiplier))
            Previous.asmCode += createInstruction(AuxVars, utils.genAddToken(CurrentNode.Token.line), TmpMemObj, AuxVars.getMemoryObjectByLocation(Previous.SolvedMem.Offset.addr, CurrentNode.Token.line))
            Previous.SolvedMem.Offset.addr = TmpMemObj.address
            return Previous
        }
    }

    function getArrayDimensionMultipler (Memory: MEMORY_SLOT, desiredDimension: number) : number {
        const TypeDefinition = getArrayTypeDefinition(Memory)
        if (TypeDefinition !== undefined) {
            return TypeDefinition.arrayMultiplierDim[desiredDimension]
        }
        if (utils.getDeclarationFromMemory(Memory).includes('_ptr') === false) {
            throw new TypeError(`At line: ${CurrentNode.Token.line}.` +
                ` Array type definition not found. Is '${Memory}' declared as array or pointer?`)
        }
        return 1 // allow use of array notation on pointer variables.
    }

    function getArrayTypeDefinition (Memory: MEMORY_SLOT) : ARRAY_TYPE_DEFINITION | undefined {
        // Precedence 2: base memory type definition
        let typeDef = Memory.typeDefinition
        // precedence 1: type definition in offset property
        if (Memory.Offset) {
            typeDef = Memory.Offset?.typeDefinition
        }
        return Program.typesDefinitions.find(obj => obj.type === 'array' && obj.name === typeDef) as ARRAY_TYPE_DEFINITION | undefined
    }

    function getMemoryType (loc: number) : 'constant'|'register'|'regularVariable' {
        if (loc === -1) {
            return 'constant'
        }
        if (AuxVars.isTemp(loc)) {
            return 'register'
        }
        return 'regularVariable'
    }

    return lookupAsnProcessorMain()
}
