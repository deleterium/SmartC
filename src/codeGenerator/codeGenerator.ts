import { assertNotUndefined } from '../repository/repository'
import { CONTRACT } from '../typings/contractTypes'
import { AST, MEMORY_SLOT, SENTENCES } from '../typings/syntaxTypes'
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
            throw new Error(Program.Context.errors + Program.Context.warnings.join('\n'))
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
                    Program.Context.warnings.push(`Warning: Unused variable '${Mem.name}' in function '${Mem.scope}'.`)
                    return
                }
                Program.Context.warnings.push(`Warning: Unused global variable '${Mem.name}'.`)
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
