// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

import { assertNotUndefined, deepCopy } from '../repository/repository'
import { CONTRACT } from '../typings/contractTypes'
import { AST, DECLARATION_TYPES, MEMORY_SLOT, SENTENCES } from '../typings/syntaxTypes'
import { genCode } from './astProcessor/genCode'

import { optimize } from './optimizer'
import { CODEGENERATE_AUXVARS, CODEGEN_INFO, GENCODE_AUXVARS } from './typings/codeGeneratorTypes'
import { utils } from './utils'

/**
 * Code generator. Translates a Program into assembly source code
 * @param incomingProgram object holding information
 * @returns assembly source code
 */
export function codeGenerate (incomingProgram: CONTRACT) {
    // holds variables needed during compilation
    const generateUtils: CODEGENERATE_AUXVARS = {
        Program: incomingProgram,
        latestLoopId: [],
        jumpId: 0,
        assemblyCode: '',
        currFunctionIndex: -1,
        currSourceLine: 0,
        getNewJumpID: function (line: number) {
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
        incomingProgram.memory.forEach(assemblerDeclarationGenerator)
        writeAsmLine('') // blank line to be nice to debugger!

        // First instruction is add error handling function
        if (incomingProgram.functions.findIndex(obj => obj.name === 'catch') !== -1) {
            writeAsmLine('ERR :__fn_catch')
        }

        // Add code for global sentences
        generateUtils.currFunctionIndex = -1
        incomingProgram.Global.sentences.forEach(compileSentence)

        // jump to main function, or program ends.
        if (incomingProgram.functions.find(obj => obj.name === 'main') === undefined) {
            writeAsmLine('FIN')
        } else {
            writeAsmLine('JMP :__fn_main')
        }

        // For every function:
        incomingProgram.functions.forEach((currentFunction, index) => {
            generateUtils.currFunctionIndex = index
            writeAsmLine('') // blank line to be nice to debugger!
            functionHeaderGenerator()
            // add code for functions sentences.
            if (currentFunction.sentences !== undefined) {
                currentFunction.sentences.forEach(compileSentence)
            }

            functionTailGenerator()
        })

        // Optimize code;
        if (incomingProgram.Config.globalOptimization) {
            return optimize(generateUtils.assemblyCode, incomingProgram.Config.maxConstVars)
        }

        return generateUtils.assemblyCode
    }

    function writeAsmLine (lineContent: string, sourceCodeLine: number = 0) {
        if (incomingProgram.Config.outputSourceLineNumber === true &&
            sourceCodeLine !== 0 &&
            sourceCodeLine !== generateUtils.currSourceLine) {
            generateUtils.assemblyCode += `^comment line ${sourceCodeLine}\n`
            generateUtils.currSourceLine = sourceCodeLine
        }
        generateUtils.assemblyCode += lineContent + '\n'
    }
    function writeAsmCode (lines: string, sourceCodeLine: number = 0) {
        if (lines.length === 0) {
            return
        }
        if (incomingProgram.Config.outputSourceLineNumber === true &&
            sourceCodeLine !== 0 &&
            sourceCodeLine !== generateUtils.currSourceLine) {
            generateUtils.assemblyCode += `^comment line ${sourceCodeLine}\n`
            generateUtils.currSourceLine = sourceCodeLine
        }
        generateUtils.assemblyCode += lines
    }

    /** Add content of macro 'program' information to assembly code */
    function configDeclarationGenerator () {
        if (incomingProgram.Config.PName !== '') {
            writeAsmLine(`^program name ${incomingProgram.Config.PName}`)
        }
        if (incomingProgram.Config.PDescription !== '') {
            writeAsmLine(`^program description ${incomingProgram.Config.PDescription}`)
        }
        if (incomingProgram.Config.PActivationAmount !== '') {
            writeAsmLine('^program activationAmount ' + incomingProgram.Config.PActivationAmount)
        }
        if (incomingProgram.Config.PUserStackPages !== 0) {
            writeAsmLine(`^program userStackPages ${incomingProgram.Config.PUserStackPages}`)
        }
        if (incomingProgram.Config.PCodeStackPages !== 0) {
            writeAsmLine(`^program codeStackPages ${incomingProgram.Config.PCodeStackPages}`)
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
        const fname = incomingProgram.functions[generateUtils.currFunctionIndex].name
        if (fname === 'main' || fname === 'catch') {
            writeAsmLine(`__fn_${fname}:`, incomingProgram.functions[generateUtils.currFunctionIndex].line)
            writeAsmLine('PCS')
            return
        }
        writeAsmLine(`__fn_${fname}:`, incomingProgram.functions[generateUtils.currFunctionIndex].line)
        incomingProgram.functions[generateUtils.currFunctionIndex].argsMemObj.forEach(Obj => {
            writeAsmLine(`POP @${Obj.asmName}`)
        })
    }

    /**
     * Handle function end
     */
    function functionTailGenerator () {
        const fname = incomingProgram.functions[generateUtils.currFunctionIndex].name
        if (fname === 'main' || fname === 'catch') {
            if (generateUtils.assemblyCode.lastIndexOf('FIN') + 4 !== generateUtils.assemblyCode.length) {
                writeAsmLine('FIN')
            }
            return
        }
        if (generateUtils.assemblyCode.lastIndexOf('RET') + 4 !== generateUtils.assemblyCode.length) {
            if (incomingProgram.functions[generateUtils.currFunctionIndex].declaration === 'void') {
                writeAsmLine('RET')
            } else { // return zero to prevent stack overflow
                writeAsmLine('CLR @r0')
                writeAsmLine('PSH $r0')
                writeAsmLine('RET')
            }
        }
    }

    /** Hot stuff!!! Assemble sentences!! */
    function compileSentence (Sentence: SENTENCES) {
        let sentenceID:string

        switch (Sentence.type) {
        case 'phrase':
            writeAsmCode(setupGenCode({
                InitialAST: Sentence.CodeAST
            }, Sentence.line), Sentence.line)
            break
        case 'ifEndif':
            sentenceID = '__if' + generateUtils.getNewJumpID(Sentence.line)
            writeAsmCode(setupGenCode({
                InitialAST: Sentence.ConditionAST,
                initialJumpTarget: sentenceID + '_endif',
                initialJumpNotTarget: sentenceID + '_start'
            }, Sentence.line), Sentence.line)
            writeAsmLine(sentenceID + '_start:')
            Sentence.trueBlock.forEach(compileSentence)
            writeAsmLine(sentenceID + '_endif:')
            break
        case 'ifElse':
            sentenceID = '__if' + generateUtils.getNewJumpID(Sentence.line)
            writeAsmCode(setupGenCode({
                InitialAST: Sentence.ConditionAST,
                initialJumpTarget: sentenceID + '_else',
                initialJumpNotTarget: sentenceID + '_start'
            }, Sentence.line), Sentence.line)
            writeAsmLine(sentenceID + '_start:')
            Sentence.trueBlock.forEach(compileSentence)
            writeAsmLine('JMP :' + sentenceID + '_endif')
            writeAsmLine(sentenceID + '_else:')
            Sentence.falseBlock.forEach(compileSentence)
            writeAsmLine(sentenceID + '_endif:')
            break
        case 'while':
            sentenceID = '__loop' + generateUtils.getNewJumpID(Sentence.line)
            writeAsmLine(sentenceID + '_continue:', Sentence.line)
            writeAsmCode(setupGenCode({
                InitialAST: Sentence.ConditionAST,
                initialJumpTarget: sentenceID + '_break',
                initialJumpNotTarget: sentenceID + '_start'
            }, Sentence.line))
            writeAsmLine(sentenceID + '_start:')
            generateUtils.latestLoopId.push(sentenceID)
            Sentence.trueBlock.forEach(compileSentence)
            generateUtils.latestLoopId.pop()
            writeAsmLine('JMP :' + sentenceID + '_continue')
            writeAsmLine(sentenceID + '_break:')
            break
        case 'do':
            sentenceID = '__loop' + generateUtils.getNewJumpID(Sentence.line)
            writeAsmLine(sentenceID + '_continue:', Sentence.line)
            generateUtils.latestLoopId.push(sentenceID)
            Sentence.trueBlock.forEach(compileSentence)
            generateUtils.latestLoopId.pop()
            writeAsmCode(setupGenCode({
                InitialAST: Sentence.ConditionAST,
                initialJumpTarget: sentenceID + '_break',
                initialJumpNotTarget: sentenceID + '_continue',
                initialIsReversedLogic: true
            }, Sentence.line))
            writeAsmLine(sentenceID + '_break:')
            break
        case 'for':
            sentenceID = '__loop' + generateUtils.getNewJumpID(Sentence.line)
            writeAsmCode(setupGenCode({
                InitialAST: Sentence.threeSentences[0].CodeAST
            }, Sentence.line), Sentence.line)
            writeAsmLine(sentenceID + '_condition:')
            writeAsmCode(setupGenCode({
                InitialAST: Sentence.threeSentences[1].CodeAST,
                initialJumpTarget: sentenceID + '_break',
                initialJumpNotTarget: sentenceID + '_start'
            }, Sentence.line), Sentence.line)
            writeAsmLine(sentenceID + '_start:')
            generateUtils.latestLoopId.push(sentenceID)
            Sentence.trueBlock.forEach(compileSentence)
            generateUtils.latestLoopId.pop()
            writeAsmLine(sentenceID + '_continue:')
            writeAsmCode(setupGenCode({
                InitialAST: Sentence.threeSentences[2].CodeAST
            }, Sentence.line), Sentence.line)
            writeAsmLine('JMP :' + sentenceID + '_condition')
            writeAsmLine(sentenceID + '_break:')
            break
        case 'struct':
            // Nothing to do here
        }
    }

    function setupGenCode (CodeGenInfo: CODEGEN_INFO, sentenceLine: number) : string {
        const auxVars: GENCODE_AUXVARS = {
            CurrentFunction: incomingProgram.functions[generateUtils.currFunctionIndex],
            memory: incomingProgram.memory,
            jumpId: generateUtils.jumpId,
            registerInfo: [],
            postOperations: '',
            isDeclaration: '',
            isLeftSideOfAssignment: false,
            isConstSentence: false,
            hasVoidArray: false,
            isTemp (loc) {
                if (loc === -1) return false
                const id = this.registerInfo.find(OBJ => OBJ.Template.address === loc)
                if (id?.inUse === true) {
                    return true
                }
                return false
            },
            getNewRegister (line: number = sentenceLine) {
                const id = this.registerInfo.find(OBJ => OBJ.inUse === false)
                if (id === undefined) {
                    throw new RangeError(`At line: ${line}. ` +
                    "No more registers available. Try to reduce nested operations or increase 'maxAuxVars'.")
                }
                id.inUse = true
                return deepCopy(id.Template)
            },
            freeRegister (loc) {
                if (loc === undefined || loc === -1) {
                    return
                }
                const id = this.registerInfo.find(OBJ => OBJ.Template.address === loc)
                if (id === undefined) return
                id.inUse = false
            },
            getPostOperations () {
                const ret = this.postOperations
                this.postOperations = ''
                return ret
            },
            getMemoryObjectByName (
                varName: string, line: number = sentenceLine, varDeclaration: DECLARATION_TYPES = ''
            ) : MEMORY_SLOT {
                let MemFound: MEMORY_SLOT | undefined
                if (this.CurrentFunction !== undefined) { // find function scope variable
                    MemFound = this.memory.find(obj => {
                        return obj.name === varName && obj.scope === this.CurrentFunction?.name
                    })
                }
                if (MemFound === undefined) {
                    // do a global scope search
                    MemFound = this.memory.find(obj => obj.name === varName && obj.scope === '')
                }
                if (MemFound === undefined) {
                    throw new Error(`At line: ${line}. Using variable '${varName}' before declaration.`)
                }
                if (varDeclaration !== '') { // we are in declarations sentence
                    MemFound.isDeclared = true
                    return deepCopy(MemFound)
                }
                return deepCopy(MemFound)
            },
            getMemoryObjectByLocation (loc: number|string, line: number = sentenceLine): MEMORY_SLOT {
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
                const search = this.memory.find(obj => obj.address === addr)
                if (search === undefined) {
                    throw new SyntaxError(`At line: ${line}. No variable found at address '0x${addr}'.`)
                }
                return deepCopy(search)
            },
            getNewJumpID (line: number) {
                let id = ''
                if (incomingProgram.Config.enableLineLabels) {
                    id += line + '_'
                }
                if (incomingProgram.Config.enableRandom === true) {
                    return id + Math.random().toString(36).substr(2, 5)
                }
                this.jumpId++
                return id + this.jumpId.toString(36)
            }
        }

        function setupGenCodeMain (): string {
            CodeGenInfo.InitialAST = assertNotUndefined(CodeGenInfo.InitialAST)
            CodeGenInfo.initialIsReversedLogic = CodeGenInfo.initialIsReversedLogic ?? false
            // Create registers array
            auxVars.memory.filter(OBJ => /^r\d$/.test(OBJ.asmName)).forEach(MEM => {
                auxVars.registerInfo.push({
                    inUse: false,
                    Template: MEM
                })
            })
            const code = genCode(incomingProgram, auxVars, {
                RemAST: CodeGenInfo.InitialAST,
                logicalOp: CodeGenInfo.initialJumpTarget !== undefined,
                revLogic: CodeGenInfo.initialIsReversedLogic,
                jumpFalse: CodeGenInfo.initialJumpTarget,
                jumpTrue: CodeGenInfo.initialJumpNotTarget
            })
            validateReturnedVariable(CodeGenInfo.InitialAST, code.SolvedMem)
            code.asmCode += auxVars.postOperations
            generateUtils.jumpId = auxVars.jumpId
            // Check throw conditions that were out-of-scope
            const analysyCode = code.asmCode.split('\n')
            code.asmCode = analysyCode.map(line => {
                if (line.startsWith('JMP :%generateUtils.getLatestLoopId()%')) {
                    return line.replace('%generateUtils.getLatestLoopId()%', generateUtils.getLatestLoopID())
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
            if (incomingProgram.Config.warningToError &&
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

        return setupGenCodeMain()
    }

    return generateMain()
}
