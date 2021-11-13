import { CONTRACT } from '../typings/contractTypes'
import { MEMORY_SLOT, SENTENCES } from '../typings/syntaxTypes'
import setupGenCode from './astProcessor/setupGenCode'

import { optimize } from './optimizer'
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
        currFunctionIndex: -1,
        currSourceLine: 0,
        getNewJumpID: function (line: number) {
            // Any changes here, also change function auxvarsGetNewJumpID
            let id = ''
            if (this.Program.Config.enableLineLabels) {
                id += line + '_'
            }
            if (this.Program.Config.enableRandom === true) {
                return id + Math.random().toString(36).substr(2, 5)
            }

            this.jumpId++
            return id + this.jumpId.toString(36)
        },
        getLatestLoopID: function () {
            // error check must be in code!
            return this.latestLoopId[this.latestLoopId.length - 1]
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
        Program.Global.sentences.forEach(compileSentence)
        // jump to main function, or program ends.
        if (Program.functions.find(obj => obj.name === 'main') === undefined) {
            writeAsmLine('FIN')
        } else {
            writeAsmLine('JMP :__fn_main')
        }
        // For every function:
        Program.functions.forEach((currentFunction, index) => {
            GlobalCodeVars.currFunctionIndex = index
            writeAsmLine('') // blank line to be nice to debugger!
            functionHeaderGenerator()
            // add code for functions sentences.
            if (currentFunction.sentences !== undefined) {
                currentFunction.sentences.forEach(compileSentence)
            }
            functionTailGenerator()
        })
        // Optimize code;
        if (Program.Config.globalOptimization) {
            return optimize(GlobalCodeVars.assemblyCode, Program.Config.maxConstVars)
        }
        return GlobalCodeVars.assemblyCode
    }

    function writeAsmLine (lineContent: string, sourceCodeLine: number = 0) {
        if (Program.Config.outputSourceLineNumber === true &&
            sourceCodeLine !== 0 &&
            sourceCodeLine !== GlobalCodeVars.currSourceLine) {
            GlobalCodeVars.assemblyCode += `^comment line ${sourceCodeLine}\n`
            GlobalCodeVars.currSourceLine = sourceCodeLine
        }
        GlobalCodeVars.assemblyCode += lineContent + '\n'
    }

    function writeAsmCode (lines: string, sourceCodeLine: number = 0) {
        if (lines.length === 0) {
            return
        }
        if (Program.Config.outputSourceLineNumber === true &&
            sourceCodeLine !== 0 &&
            sourceCodeLine !== GlobalCodeVars.currSourceLine) {
            GlobalCodeVars.assemblyCode += `^comment line ${sourceCodeLine}\n`
            GlobalCodeVars.currSourceLine = sourceCodeLine
        }
        GlobalCodeVars.assemblyCode += lines
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
        if (Program.Config.PUserStackPages !== 0) {
            writeAsmLine(`^program userStackPages ${Program.Config.PUserStackPages}`)
        }
        if (Program.Config.PCodeStackPages !== 0) {
            writeAsmLine(`^program codeStackPages ${Program.Config.PCodeStackPages}`)
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
        Program.functions[GlobalCodeVars.currFunctionIndex].argsMemObj.forEach(Obj => {
            writeAsmLine(`POP @${Obj.asmName}`)
        })
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
            if (Program.functions[GlobalCodeVars.currFunctionIndex].declaration === 'void') {
                writeAsmLine('RET')
                return
            }
            // return zero to prevent stack overflow
            writeAsmLine('CLR @r0')
            writeAsmLine('PSH $r0')
            writeAsmLine('RET')
        }
    }

    /** Hot stuff!!! Assemble sentences!! */
    function compileSentence (Sentence: SENTENCES) {
        let sentenceID: string
        let assemblyCode: string
        switch (Sentence.type) {
        case 'phrase':
            writeAsmCode(
                setupGenCode(GlobalCodeVars, { InitialAST: Sentence.CodeAST }, Sentence.line),
                Sentence.line
            )
            break
        case 'ifEndif':
            sentenceID = '__if' + GlobalCodeVars.getNewJumpID(Sentence.line)
            assemblyCode = setupGenCode(GlobalCodeVars, {
                InitialAST: Sentence.ConditionAST,
                initialJumpTarget: sentenceID + '_endif',
                initialJumpNotTarget: sentenceID + '_start'
            }, Sentence.line)
            writeAsmCode(assemblyCode, Sentence.line)
            writeAsmLine(sentenceID + '_start:')
            Sentence.trueBlock.forEach(compileSentence)
            writeAsmLine(sentenceID + '_endif:')
            break
        case 'ifElse':
            sentenceID = '__if' + GlobalCodeVars.getNewJumpID(Sentence.line)
            assemblyCode = setupGenCode(GlobalCodeVars, {
                InitialAST: Sentence.ConditionAST,
                initialJumpTarget: sentenceID + '_else',
                initialJumpNotTarget: sentenceID + '_start'
            }, Sentence.line)
            writeAsmCode(assemblyCode, Sentence.line)
            writeAsmLine(sentenceID + '_start:')
            Sentence.trueBlock.forEach(compileSentence)
            writeAsmLine('JMP :' + sentenceID + '_endif')
            writeAsmLine(sentenceID + '_else:')
            Sentence.falseBlock.forEach(compileSentence)
            writeAsmLine(sentenceID + '_endif:')
            break
        case 'while':
            sentenceID = '__loop' + GlobalCodeVars.getNewJumpID(Sentence.line)
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
            break
        case 'do':
            sentenceID = '__loop' + GlobalCodeVars.getNewJumpID(Sentence.line)
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
            break
        case 'for':
            sentenceID = '__loop' + GlobalCodeVars.getNewJumpID(Sentence.line)
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
            break
        case 'struct':
            // Nothing to do here
        }
    }

    return generateMain()
}
