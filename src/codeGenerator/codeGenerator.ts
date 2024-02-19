import { assertNotUndefined, deepCopy } from '../repository/repository'
import { CONTRACT } from '../typings/contractTypes'
import { AST, DECLARATION_TYPES, MEMORY_SLOT, SENTENCES } from '../typings/syntaxTypes'
import optimizer from './assemblyProcessor/optimizer'
import genCode from './astProcessor/genCode'

type SETUPGENCODE_ARGS = {
    InitialAST?: AST
    initialJumpTarget?: string
    initialJumpNotTarget?:string
    initialIsReversedLogic?: boolean
}

/**
 * Code generator. Translates a Program into assembly source code
 * @param Program object holding information
 * @returns assembly source code
 */
export default function codeGenerator (Program: CONTRACT) {
    // holds variables needed during compilation
    Program.Context = {
        registerInfo: [],
        isTemp,
        getNewRegister,
        freeRegister,
        latestLoopId: [],
        jumpId: 0,
        assemblyCode: '',
        errors: '',
        currFunctionIndex: -1,
        currSourceLine: 0,
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
        startScope: function (scopeName: string) {
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
        getMemoryObjectByName,
        getMemoryObjectByLocation,
        SentenceContext: {
            isDeclaration: '',
            isLeftSideOfAssignment: false,
            isConstSentence: false,
            isRegisterSentence: false,
            hasVoidArray: false,
            postOperations: '',
            getAndClearPostOperations: function () {
                const ret = this.postOperations
                this.postOperations = ''
                return ret
            }
        }
    }

    // main function for bigastCompile method, only run once.
    function generateMain () {
        // add Config Info
        configDeclarationGenerator()
        // add variables declaration
        Program.memory.forEach(assemblerDeclarationGenerator)
        writeAsmLine('') // blank line to be nice to debugger!
        // First instruction is add error handling function
        if (Program.functions.findIndex(obj => obj.name === 'catch') !== -1) {
            writeAsmLine('ERR :__fn_catch')
        }
        // Set up registers info
        Program.memory.filter(OBJ => /^r\d$/.test(OBJ.asmName) && OBJ.type === 'register').forEach(MEM => {
            Program.Context.registerInfo.push({
                endurance: 'Standard',
                inUse: false,
                Template: MEM
            })
        })

        // Add code for global sentences
        Program.Context.currFunctionIndex = -1
        Program.Context.startScope('global')
        Program.Global.sentences.forEach(compileSentence)
        Program.Context.stopScope('global')
        // jump to main function, or program ends.
        if (Program.functions.find(obj => obj.name === 'main') === undefined) {
            writeAsmLine('FIN')
        } else {
            writeAsmLine('JMP :__fn_main')
        }
        // For every function:
        Program.functions.forEach((currentFunction, index) => {
            if (currentFunction.isInline) {
                if (currentFunction.name === 'main' || currentFunction.name === 'catch') {
                    throw new Error(`At line: ${currentFunction.line}.` +
                    " Functions 'main' and 'catch' cannot be inline.")
                }
                return
            }
            Program.Context.currFunctionIndex = index
            writeAsmLine('') // blank line to be nice to debugger!
            functionHeaderGenerator()
            // add code for functions sentences.
            if (currentFunction.sentences !== undefined) {
                Program.Context.startScope(currentFunction.name)
                currentFunction.sentences.forEach(compileSentence)
                Program.Context.stopScope(currentFunction.name)
            }
            functionTailGenerator()
        })
        let calls = 0
        while (/^%inline\.(\w+)%$/m.test(Program.Context.assemblyCode)) {
            calls++
            Program.Context.assemblyCode = Program.Context.assemblyCode.replace(/^%inline\.(\w+)%$/m, substituteInlineFunction)
            if (calls > 200) {
                throw new Error('At line: unknow. Maximum number of inline substitutions. ' +
                    'Inline cannot be used in recursive functions neither have circular dependency of each other.')
            }
        }
        checkUnusedVariables()
        // Inspect if there were errros and throw now
        if (Program.Context.errors.length !== 0) {
            throw new Error(Program.Context.errors + Program.warnings)
        }
        return optimizer(
            Program.Config.optimizationLevel,
            Program.Context.assemblyCode,
            Program.memory.filter(Obj => Obj.type === 'label').map(Res => Res.asmName)
        )
    }

    function substituteInlineFunction (match: string, g1: string) {
        Program.Context.currFunctionIndex = Program.functions.findIndex(fn => fn.name === g1)
        const func = Program.functions[Program.Context.currFunctionIndex]
        const inlineId = Program.Context.getNewJumpID()
        const EndOfPreviousCode = Program.Context.assemblyCode.length
        // add code for functions sentences.
        if (func.sentences !== undefined) {
            Program.Context.startScope(`inline_${inlineId}`)
            func.sentences.forEach(compileSentence)
            Program.Context.stopScope(`inline_${inlineId}`)
        }
        // Function code is in the end of assembly code, it will be substituded in the middle.
        const functionCode = Program.Context.assemblyCode.slice(EndOfPreviousCode)
        return `__inline${inlineId}_start:\n` +
            functionCode.replace(/RET/g, `JMP :__inline${inlineId}_end`) +
            `__inline${inlineId}_end:`
    }

    function writeAsmLine (lineContent: string, sourceCodeLine: string = '0:0') {
        const location = sourceCodeLine.split(':')
        const lineNumber = Number(location[0])
        if (Program.Config.verboseAssembly === true &&
            sourceCodeLine !== '0:0' &&
            lineNumber !== Program.Context.currSourceLine) {
            Program.Context.assemblyCode += `^comment line ${location[0]} ${Program.sourceLines[lineNumber - 1]}\n`
            Program.Context.currSourceLine = lineNumber
        }
        Program.Context.assemblyCode += lineContent + '\n'
    }

    function writeAsmCode (lines: string, sourceCodeLine: string = '0:0') {
        if (lines.length === 0) {
            return
        }
        const location = sourceCodeLine.split(':')
        const lineNumber = Number(location[0])
        if (Program.Config.verboseAssembly === true &&
            lineNumber !== 0 &&
            lineNumber !== Program.Context.currSourceLine) {
            Program.Context.assemblyCode += `^comment line ${location[0]} ${Program.sourceLines[lineNumber - 1]}\n`
            Program.Context.currSourceLine = lineNumber
        }
        Program.Context.assemblyCode += lines
    }

    function addError (erroMessage: string) {
        Program.Context.errors += erroMessage + '\n'
    }

    /** Add content of macro 'program' information to assembly code */
    function configDeclarationGenerator () {
        if (Program.Config.PName !== '') {
            writeAsmLine(`^program name ${Program.Config.PName}`)
        }
        if (Program.Config.PDescription !== '') {
            writeAsmLine(`^program description ${Program.Config.PDescription}`)
        }
        if (Program.Config.PActivationAmount !== '') {
            writeAsmLine('^program activationAmount ' + Program.Config.PActivationAmount)
        }
        if (Program.Config.PCreator !== '') {
            writeAsmLine(`^program creator ${Program.Config.PCreator}`)
        }
        if (Program.Config.PContract !== '') {
            writeAsmLine(`^program contract ${Program.Config.PContract}`)
        }
        if (Program.Config.PUserStackPages !== 0) {
            writeAsmLine(`^program userStackPages ${Program.Config.PUserStackPages}`)
        }
        if (Program.Config.PCodeStackPages !== 0) {
            writeAsmLine(`^program codeStackPages ${Program.Config.PCodeStackPages}`)
        }
        if (Program.Config.PCodeHashId !== '') {
            writeAsmLine(`^program codeHashId ${Program.Config.PCodeHashId}`)
        }
    }

    /** Handles variables declarations to assembly code. */
    function assemblerDeclarationGenerator (MemObj: MEMORY_SLOT) {
        if (MemObj.address !== -1) {
            writeAsmLine(`^declare ${MemObj.asmName}`)
            if (MemObj.hexContent !== undefined) {
                writeAsmLine(`^const SET @${MemObj.asmName} #${MemObj.hexContent}`)
            }
        }
    }

    /**
     *  Handle function initialization
    */
    function functionHeaderGenerator () {
        const fname = Program.functions[Program.Context.currFunctionIndex].name
        if (fname === 'main' || fname === 'catch') {
            writeAsmLine(`__fn_${fname}:`, Program.functions[Program.Context.currFunctionIndex].line)
            writeAsmLine('PCS')
            return
        }
        writeAsmLine(`__fn_${fname}:`, Program.functions[Program.Context.currFunctionIndex].line)
    }

    /**
     * Handle function end
     */
    function functionTailGenerator () {
        const fname = Program.functions[Program.Context.currFunctionIndex].name
        if (fname === 'main' || fname === 'catch') {
            if (Program.Context.assemblyCode.lastIndexOf('FIN') + 4 !== Program.Context.assemblyCode.length) {
                writeAsmLine('FIN')
            }
            return
        }
        if (Program.Context.assemblyCode.lastIndexOf('RET') + 4 !== Program.Context.assemblyCode.length) {
            writeAsmLine('RET')
        }
    }

    function checkUnusedVariables () {
        Program.memory.forEach(Mem => {
            if (Mem.isSet === false) {
                if (Mem.scope) {
                    Program.warnings.push(`Warning: Unused variable '${Mem.name}' in function '${Mem.scope}'.`)
                    return
                }
                Program.warnings.push(`Warning: Unused global variable '${Mem.name}'.`)
            }
        })
    }

    /** Hot stuff!!! Assemble sentences!! */
    function compileSentence (Sentence: SENTENCES) {
        let sentenceID: string
        let assemblyCode: string
        switch (Sentence.type) {
        case 'phrase':
            try {
                writeAsmCode(
                    setupGenCode({ InitialAST: Sentence.CodeAST }),
                    Sentence.line
                )
            } catch (err) {
                if (err instanceof Error) {
                    addError(err.message)
                    break
                }
                // Fatal error
                throw err
            }
            break
        case 'ifEndif':
            sentenceID = '__if' + Program.Context.getNewJumpID()
            assemblyCode = setupGenCode({
                InitialAST: Sentence.ConditionAST,
                initialJumpTarget: sentenceID + '_endif',
                initialJumpNotTarget: sentenceID + '_start'
            })
            writeAsmCode(assemblyCode, Sentence.line)
            writeAsmLine(sentenceID + '_start:')
            Program.Context.startScope(`scope_${sentenceID}`)
            Sentence.trueBlock.forEach(compileSentence)
            writeAsmLine(sentenceID + '_endif:')
            Program.Context.stopScope(`scope_${sentenceID}`)
            break
        case 'ifElse':
            sentenceID = '__if' + Program.Context.getNewJumpID()
            assemblyCode = setupGenCode({
                InitialAST: Sentence.ConditionAST,
                initialJumpTarget: sentenceID + '_else',
                initialJumpNotTarget: sentenceID + '_start'
            })
            writeAsmCode(assemblyCode, Sentence.line)
            writeAsmLine(sentenceID + '_start:')
            Program.Context.startScope(`scope_${sentenceID}`)
            Sentence.trueBlock.forEach(compileSentence)
            Program.Context.stopScope(`scope_${sentenceID}`)
            writeAsmLine('JMP :' + sentenceID + '_endif')
            writeAsmLine(sentenceID + '_else:')
            Program.Context.startScope(`scope2_${sentenceID}`)
            Sentence.falseBlock.forEach(compileSentence)
            writeAsmLine(sentenceID + '_endif:')
            Program.Context.stopScope(`scope2_${sentenceID}`)
            break
        case 'while':
            sentenceID = '__loop' + Program.Context.getNewJumpID()
            Program.Context.startScope(`scope_${sentenceID}`)
            writeAsmLine(sentenceID + '_continue:', Sentence.line)
            assemblyCode = setupGenCode({
                InitialAST: Sentence.ConditionAST,
                initialJumpTarget: sentenceID + '_break',
                initialJumpNotTarget: sentenceID + '_start'
            })
            writeAsmCode(assemblyCode)
            writeAsmLine(sentenceID + '_start:')
            Program.Context.latestLoopId.push(sentenceID)
            Sentence.trueBlock.forEach(compileSentence)
            Program.Context.latestLoopId.pop()
            writeAsmLine('JMP :' + sentenceID + '_continue')
            writeAsmLine(sentenceID + '_break:')
            Program.Context.stopScope(`scope_${sentenceID}`)
            break
        case 'do':
            sentenceID = '__loop' + Program.Context.getNewJumpID()
            Program.Context.startScope(`scope2_${sentenceID}`)
            writeAsmLine(sentenceID + '_continue:', Sentence.line)
            Program.Context.latestLoopId.push(sentenceID)
            Sentence.trueBlock.forEach(compileSentence)
            Program.Context.latestLoopId.pop()
            assemblyCode = setupGenCode({
                InitialAST: Sentence.ConditionAST,
                initialJumpTarget: sentenceID + '_break',
                initialJumpNotTarget: sentenceID + '_continue',
                initialIsReversedLogic: true
            })
            writeAsmCode(assemblyCode)
            writeAsmLine(sentenceID + '_break:')
            Program.Context.stopScope(`scope2_${sentenceID}`)
            break
        case 'for':
            sentenceID = '__loop' + Program.Context.getNewJumpID()
            Program.Context.startScope(`scope_${sentenceID}`)
            assemblyCode = setupGenCode({
                InitialAST: Sentence.threeSentences[0].CodeAST
            })
            writeAsmCode(assemblyCode, Sentence.line)
            writeAsmLine(sentenceID + '_condition:')
            assemblyCode = setupGenCode({
                InitialAST: Sentence.threeSentences[1].CodeAST,
                initialJumpTarget: sentenceID + '_break',
                initialJumpNotTarget: sentenceID + '_start'
            })
            writeAsmCode(assemblyCode, Sentence.line)
            writeAsmLine(sentenceID + '_start:')
            Program.Context.latestLoopId.push(sentenceID)
            Sentence.trueBlock.forEach(compileSentence)
            Program.Context.latestLoopId.pop()
            writeAsmLine(sentenceID + '_continue:')
            assemblyCode = setupGenCode({
                InitialAST: Sentence.threeSentences[2].CodeAST
            })
            writeAsmCode(assemblyCode, Sentence.line)
            writeAsmLine('JMP :' + sentenceID + '_condition')
            writeAsmLine(sentenceID + '_break:')
            Program.Context.stopScope(`scope_${sentenceID}`)
            break
        case 'switch': {
            sentenceID = '__switch' + Program.Context.getNewJumpID()
            Program.Context.startScope(`scope_${sentenceID}`)
            let jumpTgt = sentenceID
            jumpTgt += Sentence.hasDefault ? '_default' : '_break'
            assemblyCode = setupGenCode({
                InitialAST: Sentence.JumpTable,
                initialJumpTarget: sentenceID,
                initialJumpNotTarget: jumpTgt,
                initialIsReversedLogic: false
            })
            writeAsmCode(assemblyCode, Sentence.line)
            Program.Context.latestLoopId.push(sentenceID)
            Sentence.block.forEach(compileSentence)
            Program.Context.latestLoopId.pop()
            writeAsmLine(sentenceID + '_break:')
            Program.Context.stopScope(`scope_${sentenceID}`)
            break
        }
        case 'case':
            writeAsmLine(Program.Context.getLatestLoopID() + Sentence.caseId + ':', Sentence.line)
            break
        case 'default':
            writeAsmLine(Program.Context.getLatestLoopID() + '_default:', Sentence.line)
            break
        case 'label':
            writeAsmLine(Sentence.id + ':', Sentence.line)
            break
        case 'struct':
            // Nothing to do here
        }
    }

    function getMemoryObjectByName (
        varName: string, line: string, varDeclaration: DECLARATION_TYPES = ''
    ) : MEMORY_SLOT {
        let MemFound: MEMORY_SLOT | undefined
        if (Program.Context.currFunctionIndex >= 0) { // find function scope variable
            MemFound = Program.memory.find(obj => {
                return obj.name === varName && obj.scope === Program.functions[Program.Context.currFunctionIndex].name
            })
        }
        if (MemFound === undefined) {
            // do a global scope search
            MemFound = Program.memory.find(obj => obj.name === varName && obj.scope === '')
        }
        if (MemFound === undefined) {
            throw new Error(`At line: ${line}. Using variable '${varName}' before declaration.`)
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
    }

    function getMemoryObjectByLocation (loc: number|bigint|string, line: string): MEMORY_SLOT {
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
    }

    function detectAndSetNotInitialized (Memory: MEMORY_SLOT, line: string, isInitialization: boolean) {
        if (Program.Context.SentenceContext.isLeftSideOfAssignment || Memory.hexContent) {
            Memory.isSet = true
            return
        }
        if (isInitialization) {
            return
        }
        Program.warnings.push(`Warning: at line ${line}. Variable '${Memory.name}' is used but not initialized.`)
        Memory.isSet = true // No more warning for same variable
    }

    function isTemp (loc: number) : boolean {
        if (loc === -1) return false
        const id = Program.Context.registerInfo.find(OBJ => OBJ.Template.address === loc)
        if (id === undefined) {
            return false
        }
        if (Program.Context.scopedRegisters.find(items => items === id.Template.asmName)) {
            // It is a register, but scoped. Do not mess!!!
            return false
        }
        return true
    }

    function getNewRegister (line: string): MEMORY_SLOT {
        const id = Program.Context.registerInfo.find(OBJ => OBJ.inUse === false)
        if (id === undefined) {
            throw new Error(`At line: ${line}. ` +
                'No more registers available. ' +
                `Increase the number with '#pragma maxAuxVars ${Program.Config.maxAuxVars + 1}' or try to reduce nested operations.`)
        }
        id.inUse = true
        return deepCopy(id.Template)
    }

    function freeRegister (loc: number|undefined): void {
        if (loc === undefined || loc === -1) {
            return
        }
        const RegInfo = Program.Context.registerInfo.find(OBJ => OBJ.Template.address === loc)
        if (RegInfo === undefined) return
        if (RegInfo.endurance === 'Scope') return
        RegInfo.inUse = false
    }

    /** Run to start compilation in each sentence. */
    function setupGenCode (CodeGenInfo: SETUPGENCODE_ARGS): string {
        CodeGenInfo.InitialAST = assertNotUndefined(CodeGenInfo.InitialAST)
        CodeGenInfo.initialIsReversedLogic = CodeGenInfo.initialIsReversedLogic ?? false
        Program.Context.SentenceContext.isDeclaration = ''
        Program.Context.SentenceContext.isLeftSideOfAssignment = false
        Program.Context.SentenceContext.isConstSentence = false
        Program.Context.SentenceContext.isRegisterSentence = false
        Program.Context.SentenceContext.hasVoidArray = false
        Program.Context.SentenceContext.postOperations = ''

        const code = genCode(Program, {
            RemAST: CodeGenInfo.InitialAST,
            logicalOp: CodeGenInfo.initialJumpTarget !== undefined,
            revLogic: CodeGenInfo.initialIsReversedLogic,
            jumpFalse: CodeGenInfo.initialJumpTarget,
            jumpTrue: CodeGenInfo.initialJumpNotTarget
        })

        validateReturnedVariable(CodeGenInfo.InitialAST, code.SolvedMem, CodeGenInfo.initialJumpTarget)
        code.asmCode += Program.Context.SentenceContext.postOperations
        if (code.SolvedMem.Offset?.type === 'variable') {
            Program.Context.freeRegister(code.SolvedMem.Offset.addr)
        }
        Program.Context.freeRegister(code.SolvedMem.address)
        Program.Context.registerInfo = Program.Context.registerInfo.filter(Item => Item.endurance !== 'Sentence')

        return code.asmCode
    }

    function validateReturnedVariable (InitAST: AST, RetObj: MEMORY_SLOT, initialJumpTarget: string | undefined) {
        if (initialJumpTarget === undefined &&
                RetObj.type === 'register') {
            if ((InitAST.type === 'unaryASN' && InitAST.Operation.value !== '*') ||
                    (InitAST.type === 'binaryASN' &&
                        (InitAST.Operation.type === 'Comparision' || InitAST.Operation.type === 'Operator'))) {
                throw new Error(`At line: ${InitAST.Operation.line}. ` +
                    'Operation returning a value that is not being used. Use casting to (void) to avoid this error.')
            }
        }
    }

    return generateMain()
}
