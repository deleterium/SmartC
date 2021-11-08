import { assertNotUndefined } from '../../repository/repository'
import { CONTRACT, SC_FUNCTION } from '../../typings/contractTypes'
import { LOOKUP_ASN, AST, MEMORY_SLOT } from '../../typings/syntaxTypes'
import { createSimpleInstruction, createInstruction, createAPICallInstruction } from '../assemblyProcessor/createInstruction'
import { GENCODE_AUXVARS, GENCODE_ARGS, GENCODE_SOLVED_OBJECT } from '../typings/codeGeneratorTypes'
import { utils } from '../utils'
import { genCode } from './genCode'

export function functionSolver (Program: CONTRACT, AuxVars: GENCODE_AUXVARS, ScopeInfo: GENCODE_ARGS): GENCODE_SOLVED_OBJECT {
    let CurrentNode: LOOKUP_ASN

    function functionSolverMain (): GENCODE_SOLVED_OBJECT {
        if (ScopeInfo.RemAST.type !== 'lookupASN' || ScopeInfo.RemAST.Token.type !== 'Function') {
            throw new TypeError('Internal error.')
        }
        CurrentNode = ScopeInfo.RemAST
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
    return functionSolverMain()
}
