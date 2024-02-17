import { assertNotUndefined } from '../repository/repository'
import { CONTRACT } from '../typings/contractTypes'
import { MEMORY_SLOT, SENTENCES } from '../typings/syntaxTypes'
import optimizer from './assemblyProcessor/optimizer'
import setupGenCode from './astProcessor/setupGenCode'

import { GLOBAL_AUXVARS } from './codeGeneratorTypes'

/**
 * Code generator. Translates a Program into assembly source code
 * @param Program object holding information
 * @returns assembly source code
 */
export default function codeGenerator (Program: CONTRACT) {
    // holds variables needed during compilation
    const GlobalCodeVars: GLOBAL_AUXVARS = {
        Program: Program,
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
            GlobalCodeVars.assemblyCode += `^comment scope ${registers}\n`
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
                }
            } while (liberationNeeded !== scopeName)
            if (Program.Config.verboseScope) {
                this.printFreeRegisters()
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
        // Add code for global sentences
        GlobalCodeVars.currFunctionIndex = -1
        GlobalCodeVars.startScope('global')
        Program.Global.sentences.forEach(compileSentence)
        GlobalCodeVars.stopScope('global')
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
            GlobalCodeVars.currFunctionIndex = index
            writeAsmLine('') // blank line to be nice to debugger!
            functionHeaderGenerator()
            // add code for functions sentences.
            if (currentFunction.sentences !== undefined) {
                GlobalCodeVars.startScope(currentFunction.name)
                currentFunction.sentences.forEach(compileSentence)
                GlobalCodeVars.stopScope(currentFunction.name)
            }
            functionTailGenerator()
        })
        let calls = 0
        while (/^%inline\.(\w+)%$/m.test(GlobalCodeVars.assemblyCode)) {
            calls++
            GlobalCodeVars.assemblyCode = GlobalCodeVars.assemblyCode.replace(/^%inline\.(\w+)%$/m, substituteInlineFunction)
            if (calls > 200) {
                throw new Error('At line: unknow. Maximum number of inline substitutions. ' +
                    'Inline cannot be used in recursive functions neither have circular dependency of each other.')
            }
        }
        // Inspect if there were errros and throw now
        if (GlobalCodeVars.errors.length !== 0) {
            throw new Error(GlobalCodeVars.errors + Program.warnings)
        }
        return optimizer(
            Program.Config.optimizationLevel,
            GlobalCodeVars.assemblyCode,
            Program.memory.filter(Obj => Obj.type === 'label').map(Res => Res.asmName)
        )
    }

    function substituteInlineFunction (match: string, g1: string) {
        GlobalCodeVars.currFunctionIndex = Program.functions.findIndex(fn => fn.name === g1)
        const func = Program.functions[GlobalCodeVars.currFunctionIndex]
        const inlineId = GlobalCodeVars.getNewJumpID()
        const EndOfPreviousCode = GlobalCodeVars.assemblyCode.length
        // add code for functions sentences.
        if (func.sentences !== undefined) {
            GlobalCodeVars.startScope(`inline_${inlineId}`)
            func.sentences.forEach(compileSentence)
            GlobalCodeVars.stopScope(`inline_${inlineId}`)
        }
        // Function code is in the end of assembly code, it will be substituded in the middle.
        const functionCode = GlobalCodeVars.assemblyCode.slice(EndOfPreviousCode)
        return `__inline${inlineId}_start:\n` +
            functionCode.replace(/RET/g, `JMP :__inline${inlineId}_end`) +
            `__inline${inlineId}_end:`
    }

    function writeAsmLine (lineContent: string, sourceCodeLine: string = '0:0') {
        const location = sourceCodeLine.split(':')
        const lineNumber = Number(location[0])
        if (Program.Config.verboseAssembly === true &&
            sourceCodeLine !== '0:0' &&
            lineNumber !== GlobalCodeVars.currSourceLine) {
            GlobalCodeVars.assemblyCode += `^comment line ${location[0]} ${Program.sourceLines[lineNumber - 1]}\n`
            GlobalCodeVars.currSourceLine = lineNumber
        }
        GlobalCodeVars.assemblyCode += lineContent + '\n'
    }

    function writeAsmCode (lines: string, sourceCodeLine: string = '0:0') {
        if (lines.length === 0) {
            return
        }
        const location = sourceCodeLine.split(':')
        const lineNumber = Number(location[0])
        if (Program.Config.verboseAssembly === true &&
            lineNumber !== 0 &&
            lineNumber !== GlobalCodeVars.currSourceLine) {
            GlobalCodeVars.assemblyCode += `^comment line ${location[0]} ${Program.sourceLines[lineNumber - 1]}\n`
            GlobalCodeVars.currSourceLine = lineNumber
        }
        GlobalCodeVars.assemblyCode += lines
    }

    function addError (erroMessage: string) {
        GlobalCodeVars.errors += erroMessage + '\n'
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
        const fname = Program.functions[GlobalCodeVars.currFunctionIndex].name
        if (fname === 'main' || fname === 'catch') {
            writeAsmLine(`__fn_${fname}:`, Program.functions[GlobalCodeVars.currFunctionIndex].line)
            writeAsmLine('PCS')
            return
        }
        writeAsmLine(`__fn_${fname}:`, Program.functions[GlobalCodeVars.currFunctionIndex].line)
    }

    /**
     * Handle function end
     */
    function functionTailGenerator () {
        const fname = Program.functions[GlobalCodeVars.currFunctionIndex].name
        if (fname === 'main' || fname === 'catch') {
            if (GlobalCodeVars.assemblyCode.lastIndexOf('FIN') + 4 !== GlobalCodeVars.assemblyCode.length) {
                writeAsmLine('FIN')
            }
            return
        }
        if (GlobalCodeVars.assemblyCode.lastIndexOf('RET') + 4 !== GlobalCodeVars.assemblyCode.length) {
            writeAsmLine('RET')
        }
    }

    /** Hot stuff!!! Assemble sentences!! */
    function compileSentence (Sentence: SENTENCES) {
        let sentenceID: string
        let assemblyCode: string
        switch (Sentence.type) {
        case 'phrase':
            try {
                writeAsmCode(
                    setupGenCode(GlobalCodeVars, { InitialAST: Sentence.CodeAST }, Sentence.line),
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
            sentenceID = '__if' + GlobalCodeVars.getNewJumpID()
            assemblyCode = setupGenCode(GlobalCodeVars, {
                InitialAST: Sentence.ConditionAST,
                initialJumpTarget: sentenceID + '_endif',
                initialJumpNotTarget: sentenceID + '_start'
            }, Sentence.line)
            writeAsmCode(assemblyCode, Sentence.line)
            writeAsmLine(sentenceID + '_start:')
            GlobalCodeVars.startScope(`scope_${sentenceID}`)
            Sentence.trueBlock.forEach(compileSentence)
            writeAsmLine(sentenceID + '_endif:')
            GlobalCodeVars.stopScope(`scope_${sentenceID}`)
            break
        case 'ifElse':
            sentenceID = '__if' + GlobalCodeVars.getNewJumpID()
            assemblyCode = setupGenCode(GlobalCodeVars, {
                InitialAST: Sentence.ConditionAST,
                initialJumpTarget: sentenceID + '_else',
                initialJumpNotTarget: sentenceID + '_start'
            }, Sentence.line)
            writeAsmCode(assemblyCode, Sentence.line)
            writeAsmLine(sentenceID + '_start:')
            GlobalCodeVars.startScope(`scope_${sentenceID}`)
            Sentence.trueBlock.forEach(compileSentence)
            GlobalCodeVars.stopScope(`scope_${sentenceID}`)
            writeAsmLine('JMP :' + sentenceID + '_endif')
            writeAsmLine(sentenceID + '_else:')
            GlobalCodeVars.startScope(`scope2_${sentenceID}`)
            Sentence.falseBlock.forEach(compileSentence)
            writeAsmLine(sentenceID + '_endif:')
            GlobalCodeVars.stopScope(`scope2_${sentenceID}`)
            break
        case 'while':
            sentenceID = '__loop' + GlobalCodeVars.getNewJumpID()
            GlobalCodeVars.startScope(`scope_${sentenceID}`)
            writeAsmLine(sentenceID + '_continue:', Sentence.line)
            assemblyCode = setupGenCode(GlobalCodeVars, {
                InitialAST: Sentence.ConditionAST,
                initialJumpTarget: sentenceID + '_break',
                initialJumpNotTarget: sentenceID + '_start'
            }, Sentence.line)
            writeAsmCode(assemblyCode)
            writeAsmLine(sentenceID + '_start:')
            GlobalCodeVars.latestLoopId.push(sentenceID)
            Sentence.trueBlock.forEach(compileSentence)
            GlobalCodeVars.latestLoopId.pop()
            writeAsmLine('JMP :' + sentenceID + '_continue')
            writeAsmLine(sentenceID + '_break:')
            GlobalCodeVars.stopScope(`scope_${sentenceID}`)
            break
        case 'do':
            sentenceID = '__loop' + GlobalCodeVars.getNewJumpID()
            GlobalCodeVars.startScope(`scope2_${sentenceID}`)
            writeAsmLine(sentenceID + '_continue:', Sentence.line)
            GlobalCodeVars.latestLoopId.push(sentenceID)
            Sentence.trueBlock.forEach(compileSentence)
            GlobalCodeVars.latestLoopId.pop()
            assemblyCode = setupGenCode(GlobalCodeVars, {
                InitialAST: Sentence.ConditionAST,
                initialJumpTarget: sentenceID + '_break',
                initialJumpNotTarget: sentenceID + '_continue',
                initialIsReversedLogic: true
            }, Sentence.line)
            writeAsmCode(assemblyCode)
            writeAsmLine(sentenceID + '_break:')
            GlobalCodeVars.stopScope(`scope2_${sentenceID}`)
            break
        case 'for':
            sentenceID = '__loop' + GlobalCodeVars.getNewJumpID()
            GlobalCodeVars.startScope(`scope_${sentenceID}`)
            assemblyCode = setupGenCode(GlobalCodeVars, {
                InitialAST: Sentence.threeSentences[0].CodeAST
            }, Sentence.line)
            writeAsmCode(assemblyCode, Sentence.line)
            writeAsmLine(sentenceID + '_condition:')
            assemblyCode = setupGenCode(GlobalCodeVars, {
                InitialAST: Sentence.threeSentences[1].CodeAST,
                initialJumpTarget: sentenceID + '_break',
                initialJumpNotTarget: sentenceID + '_start'
            }, Sentence.line)
            writeAsmCode(assemblyCode, Sentence.line)
            writeAsmLine(sentenceID + '_start:')
            GlobalCodeVars.latestLoopId.push(sentenceID)
            Sentence.trueBlock.forEach(compileSentence)
            GlobalCodeVars.latestLoopId.pop()
            writeAsmLine(sentenceID + '_continue:')
            assemblyCode = setupGenCode(GlobalCodeVars, {
                InitialAST: Sentence.threeSentences[2].CodeAST
            }, Sentence.line)
            writeAsmCode(assemblyCode, Sentence.line)
            writeAsmLine('JMP :' + sentenceID + '_condition')
            writeAsmLine(sentenceID + '_break:')
            GlobalCodeVars.stopScope(`scope_${sentenceID}`)
            break
        case 'switch': {
            sentenceID = '__switch' + GlobalCodeVars.getNewJumpID()
            GlobalCodeVars.startScope(`scope_${sentenceID}`)
            let jumpTgt = sentenceID
            jumpTgt += Sentence.hasDefault ? '_default' : '_break'
            assemblyCode = setupGenCode(GlobalCodeVars, {
                InitialAST: Sentence.JumpTable,
                initialJumpTarget: sentenceID,
                initialJumpNotTarget: jumpTgt,
                initialIsReversedLogic: false
            }, Sentence.line)
            writeAsmCode(assemblyCode, Sentence.line)
            GlobalCodeVars.latestLoopId.push(sentenceID)
            Sentence.block.forEach(compileSentence)
            GlobalCodeVars.latestLoopId.pop()
            writeAsmLine(sentenceID + '_break:')
            GlobalCodeVars.stopScope(`scope_${sentenceID}`)
            break
        }
        case 'case':
            writeAsmLine(GlobalCodeVars.getLatestLoopID() + Sentence.caseId + ':', Sentence.line)
            break
        case 'default':
            writeAsmLine(GlobalCodeVars.getLatestLoopID() + '_default:', Sentence.line)
            break
        case 'label':
            writeAsmLine(Sentence.id + ':', Sentence.line)
            break
        case 'struct':
            // Nothing to do here
        }
    }

    return generateMain()
}
