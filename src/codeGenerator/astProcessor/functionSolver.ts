import { assertExpression, assertNotUndefined } from '../../repository/repository'
import { CONTRACT, SC_FUNCTION } from '../../typings/contractTypes'
import { LOOKUP_ASN, AST, MEMORY_SLOT } from '../../typings/syntaxTypes'
import { createBuiltinInstruction } from '../assemblyProcessor/builtinToAsm'
import {
    createSimpleInstruction, createInstruction, createAPICallInstruction, forceSetMemFromR0
} from '../assemblyProcessor/createInstruction'
import { GENCODE_AUXVARS, GENCODE_ARGS, GENCODE_SOLVED_OBJECT } from '../codeGeneratorTypes'
import utils from '../utils'
import genCode from './genCode'

export default function functionSolver (
    Program: CONTRACT, AuxVars: GENCODE_AUXVARS, ScopeInfo: GENCODE_ARGS
) : GENCODE_SOLVED_OBJECT {
    let CurrentNode: LOOKUP_ASN

    function functionSolverMain (): GENCODE_SOLVED_OBJECT {
        CurrentNode = utils.assertAsnType('lookupASN', ScopeInfo.RemAST)
        assertExpression(CurrentNode.Token.type === 'Function')
        const fnName = assertNotUndefined(CurrentNode.Token.extValue)
        const FnToCall = Program.functions.find(val => val.name === fnName)
        const ApiToCall = Program.Global.APIFunctions.find(val => val.name === fnName)
        const BuiltInToCall = Program.Global.BuiltInFunctions.find(val => val.name === fnName)
        const subSentences = utils.splitASTOnDelimiters(assertNotUndefined(CurrentNode.FunctionArgs))
        if (FnToCall) {
            return userFunctionSolver(FnToCall, subSentences)
        }
        if (BuiltInToCall) {
            return internalFunctionSolver('builtin', BuiltInToCall, subSentences)
        }
        if (ApiToCall) {
            return internalFunctionSolver('api', ApiToCall, subSentences)
        }
        throw new Error(`At line: ${CurrentNode.Token.line}. Function '${fnName}' not declared.`)
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
            throw new Error(`At line: ${CurrentNode.Token.line}.` +
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
                throw new Error(`At line: ${CurrentNode.Token.line}.` +
                    ` Type of function argument #${i + 1} is different from variable: ` +
                    ` Expecting '${fnArg.declaration}', got '${ArgGenObj.SolvedMem.declaration}'.`)
            }
            if (ArgGenObj.SolvedMem.size !== 1 && ArgGenObj.SolvedMem.Offset === undefined) {
                throw new Error(`At line: ${CurrentNode.Token.line}.` +
                ' Overflow in argument size.')
            }
            returnAssemblyCode += ArgGenObj.asmCode
            returnAssemblyCode += createInstruction(
                AuxVars,
                utils.genAssignmentToken(CurrentNode.Token.line),
                fnArg,
                ArgGenObj.SolvedMem
            )
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
            returnAssemblyCode += forceSetMemFromR0(AuxVars, FnRetObj, CurrentNode.Token.line)
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

    function internalFunctionSolver (type: 'builtin' | 'api', ifnToCall: SC_FUNCTION, rawArgs: AST[]) : GENCODE_SOLVED_OBJECT {
        let FnRetObj: MEMORY_SLOT
        const processedArgs: MEMORY_SLOT [] = []
        let returnAssemblyCode = ''
        if (ifnToCall.declaration === 'void' || ifnToCall.name === 'bcftol' || ifnToCall.name === 'bcltof') {
            FnRetObj = utils.createVoidMemObj()
        } else {
            FnRetObj = AuxVars.getNewRegister() // reserve tempvar for return type
            FnRetObj.declaration = ifnToCall.declaration
        }
        if (rawArgs[0].type === 'nullASN') {
            rawArgs.pop()
        }
        if (rawArgs.length !== ifnToCall.argsMemObj.length) {
            throw new Error(`At line: ${CurrentNode.Token.line}.` +
            ` Wrong number of arguments for function '${ifnToCall.name}'.` +
            ` It must have '${ifnToCall.argsMemObj.length}' args.`)
        }
        rawArgs.forEach((RawSentence, idx) => {
            const ArgGenObj = genCode(Program, AuxVars, {
                RemAST: RawSentence,
                logicalOp: false,
                revLogic: false
            })
            returnAssemblyCode += ArgGenObj.asmCode
            if (utils.isNotValidDeclarationOp(ifnToCall.argsMemObj[idx].declaration, ArgGenObj.SolvedMem)) {
                throw new Error(`At line: ${CurrentNode.Token.line}.` +
                    ` Type of API Function argument #${idx + 1} is different from variable. ` +
                    ` Expecting '${ifnToCall.argsMemObj[idx].declaration}', got '${ArgGenObj.SolvedMem.declaration}'.`)
            }
            if (ArgGenObj.SolvedMem.size !== 1 && ArgGenObj.SolvedMem.Offset === undefined) {
                throw new Error(`At line: ${CurrentNode.Token.line}.` +
                ' Overflow in argument size.')
            }
            processedArgs.push(ArgGenObj.SolvedMem)
        })
        if (type === 'api') {
            returnAssemblyCode += createAPICallInstruction(
                AuxVars,
                utils.genAPICallToken(CurrentNode.Token.line, ifnToCall.asmName),
                FnRetObj,
                processedArgs
            )
        } else {
            if (ifnToCall.name === 'bcftol' || ifnToCall.name === 'bcltof') {
                utils.setMemoryDeclaration(processedArgs[0], ifnToCall.declaration)
                return { SolvedMem: processedArgs[0], asmCode: returnAssemblyCode }
            }
            returnAssemblyCode += createBuiltinInstruction(
                AuxVars,
                utils.genBuiltInToken(CurrentNode.Token.line, ifnToCall.asmName),
                ifnToCall.builtin,
                FnRetObj,
                processedArgs
            )
        }
        processedArgs.forEach(varnm => AuxVars.freeRegister(varnm.address))
        return { SolvedMem: FnRetObj, asmCode: returnAssemblyCode }
    }
    return functionSolverMain()
}
