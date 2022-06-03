import { assertNotUndefined, deepCopy } from '../../repository/repository'
import { AST, MEMORY_SLOT, DECLARATION_TYPES } from '../../typings/syntaxTypes'
import { GLOBAL_AUXVARS, SETUPGENCODE_ARGS, GENCODE_AUXVARS } from '../codeGeneratorTypes'
import genCode from './genCode'

/** Translates global variables to scope auxvars to be used by genCode.
 * Also handles return value with some tests, alterations and optimizations. */
export default function setupGenCode (
    Globals: GLOBAL_AUXVARS, CodeGenInfo: SETUPGENCODE_ARGS, sentenceLine: number
) : string {
    const AuxVars: GENCODE_AUXVARS = {
        CurrentFunction: Globals.Program.functions[Globals.currFunctionIndex],
        memory: Globals.Program.memory,
        jumpId: Globals.jumpId,
        registerInfo: [],
        postOperations: '',
        isDeclaration: '',
        isLeftSideOfAssignment: false,
        isConstSentence: false,
        hasVoidArray: false,
        isTemp: auxvarsIsTemp,
        getNewRegister: auxvarsGetNewRegister,
        freeRegister: auxvarsFreeRegister,
        getPostOperations: auxvarsGetPostOperations,
        getMemoryObjectByName: auxvarsGetMemoryObjectByName,
        getMemoryObjectByLocation: auxvarsGetMemoryObjectByLocation,
        getNewJumpID: auxvarsGetNewJumpID
    }

    function setupGenCodeMain (): string {
        CodeGenInfo.InitialAST = assertNotUndefined(CodeGenInfo.InitialAST)
        CodeGenInfo.initialIsReversedLogic = CodeGenInfo.initialIsReversedLogic ?? false
        // Create registers array
        AuxVars.memory.filter(OBJ => /^r\d$/.test(OBJ.asmName)).forEach(MEM => {
            AuxVars.registerInfo.push({
                inUse: false,
                Template: MEM
            })
        })
        const code = genCode(Globals.Program, AuxVars, {
            RemAST: CodeGenInfo.InitialAST,
            logicalOp: CodeGenInfo.initialJumpTarget !== undefined,
            revLogic: CodeGenInfo.initialIsReversedLogic,
            jumpFalse: CodeGenInfo.initialJumpTarget,
            jumpTrue: CodeGenInfo.initialJumpNotTarget
        })
        validateReturnedVariable(CodeGenInfo.InitialAST, code.SolvedMem)
        code.asmCode += AuxVars.postOperations
        Globals.jumpId = AuxVars.jumpId
        // Check throw conditions that were out-of-scope
        const analysyCode = code.asmCode.split('\n')
        code.asmCode = analysyCode.map(line => {
            if (line.includes('%generateUtils.getLatestLoopId()%')) {
                return line.replace('%generateUtils.getLatestLoopId()%', Globals.getLatestLoopID())
            }
            if (line.includes('%generateUtils.getLatestPureLoopId()%')) {
                return line.replace('%generateUtils.getLatestPureLoopId()%', Globals.getLatestPureLoopID())
            }
            return line
        }).join('\n')
        return code.asmCode
    }

    function validateReturnedVariable (InitAST: AST, RetObj: MEMORY_SLOT) {
        if (CodeGenInfo.initialJumpTarget === undefined &&
                RetObj.type === 'register') {
            if ((InitAST.type === 'unaryASN' && InitAST.Operation.value !== '*') ||
                    (InitAST.type === 'binaryASN' &&
                        (InitAST.Operation.type === 'Comparision' || InitAST.Operation.type === 'Operator'))) {
                throw new Error(`At line: ${InitAST.Operation.line}. ` +
                    'Operation returning a value that is not being used. Use casting to (void) to avoid this error.')
            }
        }
    }

    function auxvarsIsTemp (loc: number) : boolean {
        if (loc === -1) return false
        const id = AuxVars.registerInfo.find(OBJ => OBJ.Template.address === loc)
        if (id?.inUse === true) {
            return true
        }
        return false
    }

    function auxvarsGetNewRegister (line: number = sentenceLine): MEMORY_SLOT {
        const id = AuxVars.registerInfo.find(OBJ => OBJ.inUse === false)
        if (id === undefined) {
            throw new Error(`At line: ${line}. ` +
                "No more registers available. Try to reduce nested operations or increase 'maxAuxVars'.")
        }
        id.inUse = true
        return deepCopy(id.Template)
    }

    function auxvarsFreeRegister (loc: number|undefined): void {
        if (loc === undefined || loc === -1) {
            return
        }
        const id = AuxVars.registerInfo.find(OBJ => OBJ.Template.address === loc)
        if (id === undefined) return
        id.inUse = false
    }

    function auxvarsGetPostOperations (): string {
        const ret = AuxVars.postOperations
        AuxVars.postOperations = ''
        return ret
    }

    function auxvarsGetMemoryObjectByName (
        varName: string, line: number = sentenceLine, varDeclaration: DECLARATION_TYPES = ''
    ) : MEMORY_SLOT {
        let MemFound: MEMORY_SLOT | undefined
        if (AuxVars.CurrentFunction !== undefined) { // find function scope variable
            MemFound = AuxVars.memory.find(obj => {
                return obj.name === varName && obj.scope === AuxVars.CurrentFunction?.name
            })
        }
        if (MemFound === undefined) {
            // do a global scope search
            MemFound = AuxVars.memory.find(obj => obj.name === varName && obj.scope === '')
        }
        if (MemFound === undefined) {
            throw new Error(`At line: ${line}. Using variable '${varName}' before declaration.`)
        }
        if (varDeclaration !== '') { // we are in declarations sentence
            MemFound.isDeclared = true
            return deepCopy(MemFound)
        }
        return deepCopy(MemFound)
    }

    function auxvarsGetMemoryObjectByLocation (loc: number|string, line: number = sentenceLine): MEMORY_SLOT {
        let addr:number
        if (typeof loc === 'number') {
            addr = loc
        } else {
            addr = parseInt(loc, 16)
        }
        const FoundMemory = AuxVars.memory.find(obj => obj.address === addr)
        if (FoundMemory === undefined) {
            throw new Error(`At line: ${line}. No variable found at address '${addr}'.`)
        }
        return deepCopy(FoundMemory)
    }

    function auxvarsGetNewJumpID (line: number) : string {
        // This code shall be equal GlobalCodeVars.getNewJumpID()
        let id = ''
        if (Globals.Program.Config.enableLineLabels) {
            id += line + '_'
        }
        if (Globals.Program.Config.enableRandom === true) {
            return id + Math.random().toString(36).substr(2, 5)
        }
        AuxVars.jumpId++
        return id + AuxVars.jumpId.toString(36)
    }

    return setupGenCodeMain()
}
