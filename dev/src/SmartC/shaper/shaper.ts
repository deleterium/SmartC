// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

import { CONTRACT, SC_FUNCTION, SC_MACRO } from '../typings/contractTypes'
import {
    TOKEN, DECLARATION_TYPES, SENTENCES, SENTENCE_STRUCT,
    MEMORY_SLOT,
    REGISTER_TYPE_DEFINITION
} from '../typings/syntaxTypes'
import { assertNotUndefined, deepCopy } from '../repository/repository'
import { APITableTemplate, getTypeDefinitionTemplate } from './templates'
import { codeToSentenceArray } from './sentencesProcessor'
import { phraseToMemoryObject } from './memoryProcessor'

export interface SHAPER_AUXVARS {
    currentToken: number
    /** current loop name to be used if break or continue keywords are found. */
    latestLoopId: string[]
    /** If true, compilation loop on generator() will not expect the variable to be declared. Used in function arguments. */
    isFunctionArgument: boolean
    /** Variables scope (function name) */
    currentScopeName:string
    /** Prefix to be used in variables names (function name + '_') */
    currentPrefix: string
}

/** Translate an array of tokens into the object representing the program.
 * This is the second phase of parser
 * @param Program Skeleton program to received processed tokens
 * @param tokenAST Array of tokens
 * @returns {void} but Program will be updated.
 * @throws {TypeError | SyntaxError} at any mistakes
 */
export function shape (Program: CONTRACT, tokenAST: TOKEN[]): void {
    const AuxVars: SHAPER_AUXVARS = {
        currentToken: 0,
        latestLoopId: [],
        isFunctionArgument: false,
        currentScopeName: '',
        currentPrefix: ''
    }

    /* * * Main function! * * */
    function shapeMain () : void {
        splitCode()
        Program.Global.macros.forEach(processMacroControl)
        checkCompilerVersion()
        Program.typesDefinitions = [getTypeDefinitionTemplate('register'), getTypeDefinitionTemplate('long')]
        Program.memory.push(...addRegistersInMemory(Program.Config.maxAuxVars))
        Program.memory.push(...addConstantsInMemory(Program.Config.maxConstVars))
        processGlobalCode()
        Program.functions.forEach(processFunctionCodeAndArguments)
        if (Program.Config.APIFunctions) {
            Program.Global.APIFunctions = APITableTemplate.slice()
        }
        validateFunctions()
        validateMemory()
        consolidateMemory()
    }

    /**
     * Organize incoming tokens (tokenAST) into only three posibilities:
     * 1) global statements
     * 2) macros
     * 3) functions
     * */
    function splitCode () : void {
        Program.Global.code = []

        for (AuxVars.currentToken = 0; AuxVars.currentToken < tokenAST.length; AuxVars.currentToken++) {
            if (tokenAST[AuxVars.currentToken].type === 'Keyword' &&
                tokenAST[AuxVars.currentToken + 1]?.type === 'Variable' &&
                tokenAST[AuxVars.currentToken + 2]?.type === 'Function' &&
                tokenAST[AuxVars.currentToken + 3]?.type === 'CodeDomain') {
                // Function found. Does not return pointer
                if (tokenAST[AuxVars.currentToken].value === 'struct') {
                    throw new SyntaxError(`At line: ${tokenAST[AuxVars.currentToken].line}. Function returning a struct currently not implemented.`)
                }

                Program.functions.push({
                    argsMemObj: [],
                    sentences: [],
                    declaration: tokenAST[AuxVars.currentToken].value as DECLARATION_TYPES,
                    line: tokenAST[AuxVars.currentToken + 1].line,
                    name: tokenAST[AuxVars.currentToken + 1].value,
                    arguments: tokenAST[AuxVars.currentToken + 2].params,
                    code: tokenAST[AuxVars.currentToken + 3].params
                })
                AuxVars.currentToken += 3
                continue
            }
            if (tokenAST[AuxVars.currentToken].type === 'Keyword' &&
                tokenAST[AuxVars.currentToken + 1]?.type === 'UnaryOperator' &&
                tokenAST[AuxVars.currentToken + 1]?.value === '*' &&
                tokenAST[AuxVars.currentToken + 2]?.type === 'Variable' &&
                tokenAST[AuxVars.currentToken + 3]?.type === 'Function' &&
                tokenAST[AuxVars.currentToken + 4]?.type === 'CodeDomain') {
                Program.functions.push(
                    {
                        argsMemObj: [],
                        sentences: [],
                        declaration: (tokenAST[AuxVars.currentToken].value + '_ptr') as DECLARATION_TYPES,
                        typeDefinition: tokenAST[AuxVars.currentToken].extValue,
                        line: tokenAST[AuxVars.currentToken + 2].line,
                        name: tokenAST[AuxVars.currentToken + 2].value,
                        arguments: tokenAST[AuxVars.currentToken + 3].params,
                        code: tokenAST[AuxVars.currentToken + 4].params
                    })
                AuxVars.currentToken += 4
                continue
            }
            if (tokenAST[AuxVars.currentToken].type === 'Macro') {
                const fields = tokenAST[AuxVars.currentToken].value.replace(/\s\s+/g, ' ').split(' ')
                Program.Global.macros.push({ type: fields[0], property: fields[1], value: fields.slice(2).join(' '), line: tokenAST[AuxVars.currentToken].line })
                continue
            }
            // Not function neither macro, so it is global statement
            Program.Global.code.push(tokenAST[AuxVars.currentToken])
        }
    }

    /** Reads/verifies one macro token and add it into Program.Config object */
    function processMacroControl (Token: SC_MACRO) : void {
        let boolVal: boolean | undefined
        let throwBoolVal = false
        let usedBoolVal = false

        switch (Token.value) {
        case undefined:
        case '':
        case 'true':
        case '1':
            boolVal = true
            break
        case 'false':
        case '0':
            boolVal = false
            break
        default:
            boolVal = true
            throwBoolVal = true
        }

        switch (Token.type) {
        case 'pragma':
            usedBoolVal = processMacroPragma(Token, boolVal)
            break
        case 'include':
            if (Token.property === 'APIFunctions') {
                Program.Config.APIFunctions = boolVal
                usedBoolVal = true
                break
            }
            throw new TypeError(`At line: ${Token.line}. Unknow macro property '#${Token.type} ${Token.property}'. Do you mean 'APIFunctions'? Check valid values on Help page`)
        case 'program':
            processMacroProgram(Token)
            break
        default:
            throw new TypeError(`At line: ${Token.line}. Unknow macro: '#${Token.type}'. Please check valid values on Help page`)
        }
        // Check if there was an error assign boolean values
        if (throwBoolVal && usedBoolVal) {
            throw new TypeError(`At line: ${Token.line}. Macro: '#${Token.type} ${Token.property}' with wrong value. Please check valid values on Help page.`)
        }
    }

    /** Process all macro pragma options. Return true if bool was used in assignment. */
    function processMacroPragma (macroToken: SC_MACRO, bool: boolean): boolean {
        const num = parseInt(macroToken.value)
        switch (macroToken.property) {
        case 'maxAuxVars':
            if (num >= 1 && num <= 10) {
                Program.Config.maxAuxVars = num
                return false
            }
            throw new RangeError(`At line: ${macroToken.line}. Value out of permitted range 1..10.`)
        case 'maxConstVars':
            if (num >= 0 && num <= 10) {
                Program.Config.maxConstVars = num
                return false
            }
            throw new RangeError(`At line: ${macroToken.line}. Value out of permitted range 0..10.`)
        case 'reuseAssignedVar':
            Program.Config.reuseAssignedVar = bool
            return true
        case 'enableRandom':
            Program.Config.enableRandom = bool
            return true
        case 'enableLineLabels':
            Program.Config.enableLineLabels = bool
            return true
        case 'globalOptimization':
            Program.Config.globalOptimization = bool
            return true
        case 'version':
            Program.Config.sourcecodeVersion = macroToken.value
            return false
        case 'warningToError':
            Program.Config.warningToError = bool
            return true
        case 'outputSourceLineNumber':
            Program.Config.outputSourceLineNumber = bool
            return true
        default:
            throw new TypeError(`At line: ${macroToken.line}. Unknow macro property: '#${macroToken.type} ${macroToken.property}'. Please check valid values on Help page`)
        }
    }

    /** Process all macro Program options */
    function processMacroProgram (macroToken: SC_MACRO) : void {
        switch (macroToken.property) {
        case 'name':
            if (/^[0-9a-zA-Z]{1,30}$/.test(macroToken.value)) {
                Program.Config.PName = macroToken.value
                return
            }
            throw new TypeError(`At line: ${macroToken.line}. Program name must contains only letters [a-z][A-Z][0-9], from 1 to 30 chars.`)
        case 'description':
            if (macroToken.value.length >= 1000) {
                throw new TypeError(`At line: ${macroToken.line}. Program description max lenght is 1000 chars. It is ${macroToken.value.length} chars.`)
            }
            Program.Config.PDescription = macroToken.value
            return
        case 'activationAmount':
            if (/^[0-9_]{1,20}$/.test(macroToken.value)) {
                Program.Config.PActivationAmount = macroToken.value.replace(/_/g, '')
                return
            }
            throw new TypeError(`At line: ${macroToken.line}. Program activation must be only numbers or '_'.`)
        case 'userStackPages':
            if (/^\d\s*$|^10\s*$/.test(macroToken.value)) {
                Program.Config.PUserStackPages = Number(macroToken.value)
                return
            }
            throw new TypeError(`At line: ${macroToken.line}. Program user stack pages must be a number between 0 and 10, included.`)
        case 'codeStackPages':
            if (/^\d\s*$|^10\s*$/.test(macroToken.value)) {
                Program.Config.PCodeStackPages = Number(macroToken.value)
                return
            }
            throw new TypeError(`At line: ${macroToken.line}. Program code stack pages must be a number between 0 and 10, included.`)
        default:
            throw new TypeError(`At line: ${macroToken.line}. Unknow macro property: '#${macroToken.type} ${macroToken.property}'. Please check valid values on Help page`)
        }
    }

    /** Checks sourcecodeVersion and compiler current version.
     * @throws {TypeError} if not pass rules checks.
     */
    function checkCompilerVersion () : void {
        if (Program.Config.sourcecodeVersion === '') {
            if (!Program.Config.compilerVersion.includes('dev')) {
                throw new TypeError(`Compiler version not set. Pin current compiler version in your program adding '#pragma version ${Program.Config.compilerVersion}' to code.`)
            }
            Program.Config.sourcecodeVersion = Program.Config.compilerVersion
        }
        if (Program.Config.sourcecodeVersion !== Program.Config.compilerVersion) {
            if (Program.Config.sourcecodeVersion !== 'dev') {
                throw new TypeError(`This compiler is version '${Program.Config.compilerVersion}'. File needs a compiler version '${Program.Config.sourcecodeVersion}'. Update '#pragma version' macro or run another SmartC version.`)
            }
            Program.Config.sourcecodeVersion = Program.Config.compilerVersion
        }
    }

    function addRegistersInMemory (howMany: number) : MEMORY_SLOT[] {
        const registerTD = getRegisterTypeDefinition()
        const retObj: MEMORY_SLOT[] = []
        for (let i = 0; i < howMany; i++) {
            const MemTemplate = deepCopy(registerTD.MemoryTemplate)
            MemTemplate.name = `r${i}`
            MemTemplate.asmName = `r${i}`
            retObj.push(MemTemplate)
        }
        return retObj
    }

    function getRegisterTypeDefinition () : REGISTER_TYPE_DEFINITION {
        const search = Program.typesDefinitions.find(obj => obj.type === 'register') as (REGISTER_TYPE_DEFINITION | undefined)
        return assertNotUndefined(search, 'Internal error.')
    }

    function addConstantsInMemory (howMany: number) : MEMORY_SLOT[] {
        const registerTD = getRegisterTypeDefinition()
        const retObj: MEMORY_SLOT[] = []
        for (let i = 1; i <= howMany; i++) {
            const MemTemplate = deepCopy(registerTD.MemoryTemplate)
            MemTemplate.name = `n${i}`
            MemTemplate.asmName = `n${i}`
            MemTemplate.hexContent = i.toString(16).padStart(16, '0')
            retObj.push(MemTemplate)
        }
        return retObj
    }

    /** Process global code, transforming them into global sentences properties  */
    function processGlobalCode () : void {
        AuxVars.currentScopeName = ''
        AuxVars.currentPrefix = ''
        AuxVars.currentToken = 0
        Program.Global.sentences = codeToSentenceArray(AuxVars, Program.Global.code)
        createMemoryTable(Program.Global.sentences)
        delete Program.Global.code
    }

    /** Not recursive. Only top level declarations allowed.
     *  This creates only global variables or function scope variables. */
    function createMemoryTable (sntcs: SENTENCES[] = []) {
        sntcs.forEach(function (phrs) {
            if (phrs.type === 'phrase' && phrs.code !== undefined) {
                Program.memory.push(...phraseToMemoryObject(Program.typesDefinitions, AuxVars, phrs.code))
                return
            }
            if (phrs.type === 'struct' && phrs.Phrase.code !== undefined) {
                structToTypeDefinition(phrs)
                Program.memory.push(...phraseToMemoryObject(Program.typesDefinitions, AuxVars, phrs.Phrase.code))
            }
        })
    }

    /** From a struct sentence, create and store a Struct Type Definition
     * in `Program.typesDefinitions` property */
    function structToTypeDefinition (structPhrase: SENTENCE_STRUCT) {
        // create struct type definition
        const NewStructTD = getTypeDefinitionTemplate('struct')
        NewStructTD.name = AuxVars.currentPrefix + structPhrase.name
        NewStructTD.MemoryTemplate.typeDefinition = AuxVars.currentPrefix + structPhrase.name
        NewStructTD.MemoryTemplate.isDeclared = AuxVars.isFunctionArgument

        const savedPrefix = AuxVars.currentPrefix
        AuxVars.currentPrefix = ''
        structPhrase.members.forEach(struphrs => {
            if (struphrs.type !== 'phrase') {
                throw new TypeError(`At line: ${struphrs.line}. Invalid sentence in struct members.`)
            }
            if (struphrs.code !== undefined) {
                NewStructTD.structMembers.push(...phraseToMemoryObject(Program.typesDefinitions, AuxVars, struphrs.code, structPhrase.name + '_'))
            }
        })

        NewStructTD.MemoryTemplate.size = NewStructTD.structMembers.length

        let accumulatedSize = 0
        NewStructTD.structMembers.forEach(function (memb) {
            NewStructTD.structAccumulatedSize.push([memb.name, accumulatedSize])
            if (memb.type !== 'struct') { // Remeber to change here code yolj1A
                accumulatedSize++
            }
        })
        AuxVars.currentPrefix = savedPrefix
        Program.typesDefinitions.push(NewStructTD)
    }

    /** Process/checks function arguments and code, transforming them into argsMemObj and sentences properties  */
    function processFunctionCodeAndArguments (currentFunction: SC_FUNCTION, fnNum: number) {
        AuxVars.currentToken = 0
        currentFunction.sentences = codeToSentenceArray(AuxVars, currentFunction.code)

        let expectVoid = false
        if (currentFunction.arguments?.length === 1 && currentFunction.arguments[0].type === 'Keyword' && currentFunction.arguments[0].value === 'void') {
            expectVoid = true
        }
        AuxVars.currentScopeName = currentFunction.name
        AuxVars.currentPrefix = AuxVars.currentScopeName + '_'
        AuxVars.isFunctionArgument = true
        AuxVars.currentToken = 0
        const sentence = codeToSentenceArray(AuxVars, currentFunction.arguments, true)
        if (sentence.length !== 1 || sentence[0].type !== 'phrase' || sentence[0].code === undefined) {
            throw new TypeError(`At line: ${currentFunction.line}. Wrong arguments for function '${currentFunction.name}'.`)
        }
        currentFunction.argsMemObj = phraseToMemoryObject(Program.typesDefinitions, AuxVars, sentence[0].code)
        if (currentFunction.argsMemObj.length === 0 && expectVoid === false) {
            throw new TypeError(`At line: ${currentFunction.line}. No variables in arguments for function '${currentFunction.name}'. Do you mean 'void'?`)
        }
        Program.memory = Program.memory.concat(currentFunction.argsMemObj)
        AuxVars.isFunctionArgument = false

        delete Program.functions[fnNum].arguments
        delete Program.functions[fnNum].code

        createMemoryTable(currentFunction.sentences)
    }

    /** Checks variables for double definitions and against label names */
    function validateMemory () {
        let i, j
        for (i = 0; i < Program.memory.length - 1; i++) {
            for (j = i + 1; j < Program.memory.length; j++) {
                if (Program.memory[i].asmName === Program.memory[j].asmName) {
                    if (Program.memory[i].type !== Program.memory[j].type) {
                        throw new TypeError(`At line: unknown. Global check: it was found a variable and a label with same name. Change variable named '${Program.memory[i].name}'`)
                    }
                    if (Program.memory[i].type === 'label') {
                        throw new TypeError(`At line: unknow. Global check: it was found that label '${Program.memory[i].name}' was declared more than one time.`)
                    }
                    throw new TypeError(`At line: unknow. Global check: it was found that variable '${Program.memory[i].name}' was declared more than one time.`)
                }
            }
        }
    }

    /** Checks functions for double definition or same name from API */
    function validateFunctions () {
        let i, j
        for (i = 0; i < Program.functions.length; i++) {
            for (j = i + 1; j < Program.functions.length; j++) {
                if (Program.functions[i].name === Program.functions[j].name) {
                    throw new TypeError(`At line: ${Program.functions[j].line}. Found second definition for function '${Program.functions[j].name}'.`)
                }
            }
            if (Program.Config.APIFunctions === true) {
                for (j = 0; j < Program.Global.APIFunctions.length; j++) {
                    if (Program.functions[i].name === Program.Global.APIFunctions[j].name ||
                        Program.functions[i].name === Program.Global.APIFunctions[j].asmName) {
                        throw new TypeError(`At line: ${Program.functions[i].line}. Function '${Program.functions[i].name}' has same name of one API Functions.`)
                    }
                }
            }
        }
    }

    /** Fills the correct address of memory objects. */
    function consolidateMemory () {
        let counter = 0
        Program.memory.forEach(function (thisvar) {
            switch (thisvar.type) {
            case 'struct':
                // Remeber to change here code yolj1A
                thisvar.hexContent = counter.toString(16).padStart(16, '0')
                return
            case 'array':
                thisvar.address = counter
                counter++
                thisvar.hexContent = counter.toString(16).padStart(16, '0')
                return
            case 'label':
                return
            default:
                thisvar.address = counter
                counter++
            }
        })
    }

    return shapeMain()
}
