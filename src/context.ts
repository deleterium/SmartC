import { GLOBAL_CONTEXT } from './codeGenerator/codeGeneratorTypes'
import { assertNotUndefined, deepCopy } from './repository/repository'
import { CONTRACT } from './typings/contractTypes'
import { DECLARATION_TYPES, MEMORY_SLOT } from './typings/syntaxTypes'

export function createContext (Program: CONTRACT) : GLOBAL_CONTEXT {
    function detectAndSetNotInitialized (Memory: MEMORY_SLOT, line: string, isInitialization: boolean) {
        if (Program.Context.SentenceContext.isLeftSideOfAssignment || Memory.hexContent) {
            Memory.isSet = true
            return
        }
        if (isInitialization) {
            return
        }
        Program.Context.warnings.push('Warning! ' + Program.Context.formatError(line,
            `Variable '${Memory.name}' is used but not initialized.`))
        Memory.isSet = true // No more warning for same variable
    }

    return {
        registerInfo: [],
        isTemp (loc: number) : boolean {
            if (loc === -1) return false
            const id = this.registerInfo.find(OBJ => OBJ.Template.address === loc)
            if (id === undefined) {
                return false
            }
            if (this.scopedRegisters.find(items => items === id.Template.asmName)) {
                // It is a register, but scoped. Do not mess!!!
                return false
            }
            return true
        },
        getNewRegister (line: string): MEMORY_SLOT {
            const id = this.registerInfo.find(OBJ => OBJ.inUse === false)
            if (id === undefined) {
                throw new Error(`At line: ${line}. ` +
                    'No more registers available. ' +
                    `Increase the number with '#pragma maxAuxVars ${Program.Config.maxAuxVars + 1}' or try to reduce nested operations.`)
            }
            id.inUse = true
            return deepCopy(id.Template)
        },
        freeRegister (loc: number|undefined): void {
            if (loc === undefined || loc === -1) {
                return
            }
            const RegInfo = this.registerInfo.find(OBJ => OBJ.Template.address === loc)
            if (RegInfo === undefined) return
            if (RegInfo.endurance === 'Scope') return
            RegInfo.inUse = false
        },
        latestLoopId: [],
        jumpId: 0,
        assemblyCode: '',
        warnings: [],
        errors: [],
        currFunctionIndex: -1,
        currSourceLine: 0,
        formatError (line: string, message: string) : string {
            let error = `At line: ${line}. ${message}\n`
            const lineNo = Number(line.split(':')[0])
            const colNo = Number(line.split(':')[1])
            if (line === undefined || line === '0:0' || Number.isNaN(lineNo) || Number.isNaN(colNo)) {
                return error
            }
            error += ' |' + Program.sourceLines[lineNo - 1] + '\n'
            error += ' |' + '^'.padStart(colNo)
            return error
        },
        scopedRegisters: [],
        getNewJumpID: function () {
            // Any changes here, also change function auxvarsGetNewJumpID
            this.jumpId++
            return this.jumpId.toString(36)
        },
        getLatestLoopID: function () {
            // error check must be in code!
            return this.latestLoopId[this.latestLoopId.length - 1]
        },
        getLatestPureLoopID: function () {
            // error check must be in code!
            return this.latestLoopId.reduce((previous, current) => {
                if (current.includes('loop')) {
                    return current
                }
                return previous
            }, '')
        },
        printFreeRegisters () {
            let registers = 'r0'
            for (let i = 1; i < Program.Config.maxAuxVars; i++) {
                if (this.scopedRegisters.findIndex(item => item === `r${i}`) === -1) {
                    registers += `,r${i}`
                }
            }
            this.assemblyCode += `^comment scope ${registers}\n`
        },
        startScope (scopeName: string) {
            this.scopedRegisters.push(scopeName)
            if (Program.Config.verboseScope) {
                this.printFreeRegisters()
            }
        },
        stopScope: function (scopeName: string) {
            let liberationNeeded: string
            do {
                liberationNeeded = assertNotUndefined(this.scopedRegisters.pop(), 'Internal error')
                if (/^r\d$/.test(liberationNeeded)) {
                    const motherMemory = assertNotUndefined(Program.memory.find(obj =>
                        obj.asmName === liberationNeeded &&
                        obj.type !== 'register'
                    ), 'Internal error')
                    motherMemory.address = -1
                    motherMemory.asmName = ''
                    const Reg = assertNotUndefined(this.registerInfo.find(Item => Item.Template.asmName === liberationNeeded))
                    Reg.inUse = false
                    Reg.endurance = 'Standard'
                }
            } while (liberationNeeded !== scopeName)
            if (Program.Config.verboseScope) {
                this.printFreeRegisters()
            }
        },
        getMemoryObjectByName (
            varName: string, line: string, varDeclaration: DECLARATION_TYPES = ''
        ) : MEMORY_SLOT {
            let MemFound: MEMORY_SLOT | undefined
            if (this.currFunctionIndex >= 0) { // find function scope variable
                MemFound = Program.memory.find(obj => {
                    return obj.name === varName && obj.scope === Program.functions[this.currFunctionIndex].name
                })
            }
            if (MemFound === undefined) {
                // do a global scope search
                MemFound = Program.memory.find(obj => obj.name === varName && obj.scope === '')
            }
            if (MemFound === undefined) {
                throw new Error(Program.Context.formatError(line, `Using variable '${varName}' before declaration.`))
            }
            if (MemFound.toBeRegister && MemFound.asmName === '') {
                throw new Error(`At line: ${line}. Using variable '${varName}' out of scope!`)
            }
            if (!MemFound.isSet) {
                detectAndSetNotInitialized(MemFound, line, varDeclaration !== '')
            }
            if (varDeclaration !== '') { // we are in declarations sentence
                MemFound.isDeclared = true
                return deepCopy(MemFound)
            }
            return deepCopy(MemFound)
        },
        getMemoryObjectByLocation (loc: number|bigint|string, line: string): MEMORY_SLOT {
            let addr:number
            switch (typeof loc) {
            case 'number': addr = loc; break
            case 'string': addr = parseInt(loc, 16); break
            default: addr = Number(loc)
            }
            const FoundMemory = Program.memory.find(obj => obj.address === addr)
            if (FoundMemory === undefined) {
                throw new Error(`At line: ${line}. No variable found at address '${addr}'.`)
            }
            if (!FoundMemory.isSet) {
                detectAndSetNotInitialized(FoundMemory, line, false)
            }
            return deepCopy(FoundMemory)
        },
        SentenceContext: {
            isDeclaration: '',
            isLeftSideOfAssignment: false,
            leftSideReserved: -1,
            isConstSentence: false,
            isRegisterSentence: false,
            hasVoidArray: false,
            postOperations: '',
            getAndClearPostOperations: function () {
                const ret = this.postOperations
                this.postOperations = ''
                return ret
            }
        },
        TokenizerDetection: {
            hasFixed: false,
            hasAutoCounter: false
        }
    }
}
