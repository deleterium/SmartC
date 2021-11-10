import { assertNotUndefined, deepCopy } from '../../repository/repository'
import { AST, MEMORY_SLOT, DECLARATION_TYPES } from '../../typings/syntaxTypes'
import { GLOBAL_AUXVARS, SETUPGENCODE_ARGS, GENCODE_AUXVARS } from '../codeGeneratorTypes'
import utils from '../utils'
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
            if (line.startsWith('JMP :%generateUtils.getLatestLoopId()%')) {
                return line.replace('%generateUtils.getLatestLoopId()%', Globals.getLatestLoopID())
            }
            return line
        }).join('\n')
        // optimizations for jumps and labels
        if (code.asmCode.indexOf(':') >= 0) {
            if (CodeGenInfo.InitialAST.type === 'endASN') {
                if (CodeGenInfo.InitialAST.Token.type === 'Keyword' &&
                        CodeGenInfo.InitialAST.Token.value === 'label') {
                    return code.asmCode // do not optimize!!!
                }
            }
            code.asmCode = utils.miniOptimizeJumps(code.asmCode)
        }
        return code.asmCode
    }

    function validateReturnedVariable (InitAST: AST, RetObj: MEMORY_SLOT) {
        if (Globals.Program.Config.warningToError &&
                CodeGenInfo.initialJumpTarget === undefined &&
                RetObj.type === 'register') {
            if ((InitAST.type === 'unaryASN' && InitAST.Operation.value !== '*') ||
                    (InitAST.type === 'binaryASN' &&
                        (InitAST.Operation.type === 'Comparision' || InitAST.Operation.type === 'Operator'))) {
                throw new TypeError(`At line: ${InitAST.Operation.line}. ` +
                    'Warning: Operation returning a value that is not being used.')
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
            throw new RangeError(`At line: ${line}. ` +
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
        switch (typeof (loc)) {
        case 'number':
            addr = loc
            break
        case 'string':
            addr = parseInt(loc, 16)
            break
        default:
            throw new TypeError('Internal error. Wrong type in getMemoryObjectByLocation.')
        }
        const search = AuxVars.memory.find(obj => obj.address === addr)
        if (search === undefined) {
            throw new SyntaxError(`At line: ${line}. No variable found at address '0x${addr}'.`)
        }
        return deepCopy(search)
    }

    function auxvarsGetNewJumpID (line: number) : string {
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
