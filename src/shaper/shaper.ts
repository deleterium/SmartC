import { CONTRACT, SC_FUNCTION, SC_MACRO } from '../typings/contractTypes'
import {
    TOKEN, DECLARATION_TYPES, SENTENCES, SENTENCE_STRUCT,
    MEMORY_SLOT,
    REGISTER_TYPE_DEFINITION
} from '../typings/syntaxTypes'
import { assertNotUndefined, deepCopy, parseDecimalNumber } from '../repository/repository'
import {
    APITableTemplate, getMemoryTemplate, getTypeDefinitionTemplate, BuiltInTemplate, fixedBaseTemplate, fixedAPITableTemplate, autoCounterTemplate
} from './templates'
import sentencesProcessor from './sentencesProcessor'
import memoryProcessor from './memoryProcessor'
import { SHAPER_AUXVARS } from './shaperTypes'

/** Translate an array of tokens into the object representing the program.
 * This is the second phase of parser
 * @param Program Skeleton program to received processed tokens
 * @param tokenAST Array of tokens
 * @returns {void} but Program will be updated.
 * @throws {Error} at any mistakes
 */
export default function shaper (Program: CONTRACT, tokenAST: TOKEN[]): void {
    const AuxVars: SHAPER_AUXVARS = {
        latestLoopId: [],
        isFunctionArgument: false,
        currentScopeName: '',
        currentPrefix: ''
    }

    /* * * Main function! * * */
    function shapeMain () : void {
        splitCode()
        Program.Global.macros.forEach(processMacroControl)
        Program.typesDefinitions = [
            getTypeDefinitionTemplate('register'),
            getTypeDefinitionTemplate('long'),
            getTypeDefinitionTemplate('fixed')
        ]
        Program.memory.push(...addRegistersInMemory(Program.Config.maxAuxVars))
        Program.memory.push(...addConstantsInMemory(Program.Config.maxConstVars))
        if (Program.Config.fixedAPIFunctions || fixedDetected(tokenAST)) {
            Program.memory.push(fixedBaseTemplate)
        }
        if (autoCounterDetected(tokenAST)) {
            Program.memory.push(autoCounterTemplate)
        }
        processGlobalCode()
        Program.functions.forEach(processFunctionCodeAndArguments)
        if (Program.Config.APIFunctions) {
            Program.Global.APIFunctions = APITableTemplate.slice()
        }
        if (Program.Config.fixedAPIFunctions) {
            Program.Global.APIFunctions.push(...fixedAPITableTemplate)
        }
        Program.Global.BuiltInFunctions = BuiltInTemplate.slice()
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
        let tokenIndex = 0
        let isInline = false
        while (tokenIndex < tokenAST.length) {
            if (tokenAST[tokenIndex].type === 'Keyword' &&
                tokenAST[tokenIndex].value === 'inline') {
                tokenIndex++
                isInline = true
                continue
            }
            if (tokenAST[tokenIndex].type === 'Keyword' &&
                tokenAST[tokenIndex + 1]?.type === 'Variable' &&
                tokenAST[tokenIndex + 2]?.type === 'Function' &&
                tokenAST[tokenIndex + 3]?.type === 'CodeDomain') {
                // Function found. Does not return pointer
                if (tokenAST[tokenIndex].value === 'struct') {
                    throw new Error(`At line: ${tokenAST[tokenIndex].line}.` +
                    ' Function returning a struct currently not implemented.')
                }
                Program.functions.push({
                    argsMemObj: [],
                    sentences: [],
                    declaration: tokenAST[tokenIndex].value as DECLARATION_TYPES,
                    isInline,
                    line: tokenAST[tokenIndex + 1].line,
                    name: tokenAST[tokenIndex + 1].value,
                    arguments: tokenAST[tokenIndex + 2].params,
                    code: tokenAST[tokenIndex + 3].params
                })
                tokenIndex += 4
                isInline = false
                continue
            }
            if (tokenAST[tokenIndex].type === 'Keyword' &&
                tokenAST[tokenIndex + 1]?.type === 'UnaryOperator' &&
                tokenAST[tokenIndex + 1]?.value === '*' &&
                tokenAST[tokenIndex + 2]?.type === 'Variable' &&
                tokenAST[tokenIndex + 3]?.type === 'Function' &&
                tokenAST[tokenIndex + 4]?.type === 'CodeDomain') {
                Program.functions.push({
                    argsMemObj: [],
                    sentences: [],
                    declaration: (tokenAST[tokenIndex].value + '_ptr') as DECLARATION_TYPES,
                    isInline,
                    typeDefinition: tokenAST[tokenIndex].extValue,
                    line: tokenAST[tokenIndex + 2].line,
                    name: tokenAST[tokenIndex + 2].value,
                    arguments: tokenAST[tokenIndex + 3].params,
                    code: tokenAST[tokenIndex + 4].params
                })
                tokenIndex += 5
                isInline = false
                continue
            }
            if (tokenAST[tokenIndex].type === 'Macro') {
                const fields = tokenAST[tokenIndex].value.replace(/\s\s+/g, ' ').split(' ')
                Program.Global.macros.push({
                    type: fields[0],
                    property: fields[1],
                    value: fields.slice(2).join(' '),
                    line: tokenAST[tokenIndex].line
                })
                tokenIndex++
                continue
            }
            if (isInline) {
                throw new Error(`At line: ${tokenAST[tokenIndex].line}. Invalid use for inline keyword. Expecting a type and a function definition.`)
            }
            // Not function neither macro, so it is global statement
            Program.Global.code.push(tokenAST[tokenIndex])
            tokenIndex++
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
            if (Token.property === 'fixedAPIFunctions') {
                Program.Config.fixedAPIFunctions = boolVal
                usedBoolVal = true
                break
            }
            throw new Error(`At line: ${Token.line}.` +
            ` Unknow macro property '#${Token.type} ${Token.property}'.` +
            " Do you mean 'APIFunctions'? Check valid values on Help page")
        case 'program':
            processMacroProgram(Token)
            break
        default:
            throw new Error(`At line: ${Token.line}.` +
            ` Unknow macro: '#${Token.type}'. Please check valid values on Help page`)
        }
        // Check if there was an error assign boolean values
        if (throwBoolVal && usedBoolVal) {
            throw new Error(`At line: ${Token.line}.` +
            ` Macro: '#${Token.type} ${Token.property}' with wrong value. Please check valid values on Help page.`)
        }
    }

    /** Process all macro pragma options. Return true if bool was used in assignment. */
    function processMacroPragma (MacroToken: SC_MACRO, bool: boolean): boolean {
        const num = parseInt(MacroToken.value)
        switch (MacroToken.property) {
        case 'maxAuxVars':
            if (num >= 0 && num <= 10) {
                Program.Config.maxAuxVars = num
                return false
            }
            throw new Error(`At line: ${MacroToken.line}. Value out of permitted range 1..10.`)
        case 'maxConstVars':
            if (num >= 0 && num <= 10) {
                Program.Config.maxConstVars = num
                return false
            }
            throw new Error(`At line: ${MacroToken.line}. Value out of permitted range 0..10.`)
        case 'reuseAssignedVar':
            Program.Config.reuseAssignedVar = bool
            return true
        case 'optimizationLevel':
            if (num >= 0 && num <= 4) {
                Program.Config.optimizationLevel = num
                return false
            }
            throw new Error(`At line: ${MacroToken.line}. Value out of permitted range 0..3.`)
        case 'version':
            // Nothing to do. 'version' is a reminder for programmers.
            return false
        case 'verboseAssembly':
            Program.Config.verboseAssembly = bool
            return true
        default:
            throw new Error(`At line: ${MacroToken.line}.` +
            ` Unknow macro property: '#${MacroToken.type} ${MacroToken.property}'.` +
            ' Please check valid values on Help page')
        }
    }

    /** Process all macro Program options */
    function processMacroProgram (MacroToken: SC_MACRO) : void {
        switch (MacroToken.property) {
        case 'name':
            if (/^[0-9a-zA-Z]{1,30}$/.test(MacroToken.value)) {
                Program.Config.PName = MacroToken.value
                return
            }
            throw new Error(`At line: ${MacroToken.line}.` +
            ' Program name must contains only letters [a-z][A-Z][0-9], from 1 to 30 chars.')
        case 'description':
            if (MacroToken.value.length >= 1000) {
                throw new Error(`At line: ${MacroToken.line}.` +
                ` Program description max lenght is 1000 chars. It is ${MacroToken.value.length} chars.`)
            }
            Program.Config.PDescription = MacroToken.value
            return
        case 'activationAmount':
            Program.Config.PActivationAmount = parseDecimalNumber(MacroToken.value, MacroToken.line).value.toString(10)
            return
        case 'creator':
            Program.Config.PCreator = parseDecimalNumber(MacroToken.value, MacroToken.line).value.toString(10)
            return
        case 'contract':
            Program.Config.PContract = parseDecimalNumber(MacroToken.value, MacroToken.line).value.toString(10)
            return
        case 'userStackPages':
            if (/^\d\s*$|^10\s*$/.test(MacroToken.value)) {
                Program.Config.PUserStackPages = Number(MacroToken.value)
                return
            }
            throw new Error(`At line: ${MacroToken.line}.` +
            ' Program user stack pages must be a number between 0 and 10, included.')
        case 'codeStackPages':
            if (/^\d\s*$|^10\s*$/.test(MacroToken.value)) {
                Program.Config.PCodeStackPages = Number(MacroToken.value)
                return
            }
            throw new Error(`At line: ${MacroToken.line}.` +
            ' Program code stack pages must be a number between 0 and 10, included.')
        case 'codeHashId':
            if (/^\d+\s*$/.test(MacroToken.value)) {
                Program.Config.PCodeHashId = MacroToken.value.trim()
                return
            }
            throw new Error(`At line: ${MacroToken.line}.` +
            ' Program code hash id must be a decimal number. Use 0 to let compiler fill the value at assembly output.')
        case 'compilerVersion':
            // Nothing to do. compilerVersion is a reminder for programmers.
            break
        default:
            throw new Error(`At line: ${MacroToken.line}.` +
            ` Unknow macro property: '#${MacroToken.type} ${MacroToken.property}'.` +
            ' Please check valid values on Help page')
        }
    }

    function addRegistersInMemory (howMany: number) : MEMORY_SLOT[] {
        const RegisterTD = getRegisterTypeDefinition()
        const retObj: MEMORY_SLOT[] = []
        for (let i = 0; i < howMany; i++) {
            const MemTemplate = deepCopy(RegisterTD.MemoryTemplate)
            MemTemplate.name = `r${i}`
            MemTemplate.asmName = `r${i}`
            retObj.push(MemTemplate)
        }
        return retObj
    }

    function getRegisterTypeDefinition () : REGISTER_TYPE_DEFINITION {
        const FoundTD = Program.typesDefinitions.find(obj => {
            return obj.type === 'register'
        }) as (REGISTER_TYPE_DEFINITION | undefined)
        return assertNotUndefined(FoundTD, 'Internal error.')
    }

    function addConstantsInMemory (howMany: number) : MEMORY_SLOT[] {
        const RegisterTD = getRegisterTypeDefinition()
        const retObj: MEMORY_SLOT[] = []
        for (let i = 1; i <= howMany; i++) {
            const MemTemplate = deepCopy(RegisterTD.MemoryTemplate)
            MemTemplate.name = `n${i}`
            MemTemplate.asmName = `n${i}`
            MemTemplate.hexContent = i.toString(16).padStart(16, '0')
            retObj.push(MemTemplate)
        }
        return retObj
    }

    /** Detects if fixed point calculations will be needed */
    function fixedDetected (tokenTrain: TOKEN[] | undefined) : boolean {
        if (tokenTrain === undefined) return false
        return !!tokenTrain.find((Tkn) => {
            if ((Tkn.type === 'Keyword' && Tkn.value === 'fixed') ||
                (Tkn.type === 'Constant' && Tkn.extValue === 'fixed')) {
                return true
            }
            if (Tkn.type === 'CodeDomain' || Tkn.type === 'CodeCave') {
                return fixedDetected(Tkn.params)
            }
            return false
        })
    }

    /** Detects if hidden variable for timestamp loop will be needed */
    function autoCounterDetected (tokenTrain: TOKEN[] | undefined) : boolean {
        if (tokenTrain === undefined) return false
        return !!tokenTrain.find((Tkn) => {
            if (Tkn.type === 'Variable' && (Tkn.value === 'getNextTx' || Tkn.value === 'getNextTxFromBlockheight')) {
                return true
            }
            if (Tkn.type === 'CodeDomain' || Tkn.type === 'CodeCave') {
                return autoCounterDetected(Tkn.params)
            }
            return false
        })
    }

    /** Process global code, transforming them into global sentences properties  */
    function processGlobalCode () : void {
        AuxVars.currentScopeName = ''
        AuxVars.currentPrefix = ''
        Program.Global.sentences = sentencesProcessor(AuxVars, Program.Global.code)
        Program.Global.sentences.forEach(createMemoryTable)
        delete Program.Global.code
    }

    /** Recursive.
     *  This creates only global variables or function scope variables  */
    function createMemoryTable (Sentence: SENTENCES) : void {
        switch (Sentence.type) {
        case 'phrase':
            Program.memory.push(...memoryProcessor(Program.typesDefinitions, AuxVars, assertNotUndefined(Sentence.code)))
            return
        case 'ifElse':
            Sentence.falseBlock.forEach(createMemoryTable)
        // eslint-disable-next-line no-fallthrough
        case 'ifEndif':
        case 'while':
        case 'do':
            Sentence.trueBlock.forEach(createMemoryTable)
            return
        case 'for':
            Program.memory.push(...memoryProcessor(Program.typesDefinitions, AuxVars, assertNotUndefined(Sentence.threeSentences[0].code)))
            Sentence.trueBlock.forEach(createMemoryTable)
            return
        case 'struct':
            structToTypeDefinition(Sentence)
            Program.memory.push(...memoryProcessor(Program.typesDefinitions, AuxVars, assertNotUndefined(Sentence.Phrase.code)))
            return
        case 'switch':
            Sentence.block.forEach(createMemoryTable)
            return
        case 'label': {
            const MemTempl = getMemoryTemplate('label')
            MemTempl.asmName = Sentence.id
            MemTempl.name = Sentence.id
            MemTempl.isDeclared = true
            Program.memory.push(MemTempl)
        }
        }
    }

    /** From a struct sentence, create and store a Struct Type Definition
     * in `Program.typesDefinitions` property */
    function structToTypeDefinition (StructPhrase: SENTENCE_STRUCT) {
        // create struct type definition
        const NewStructTD = getTypeDefinitionTemplate('struct')
        NewStructTD.name = AuxVars.currentPrefix + StructPhrase.name
        NewStructTD.MemoryTemplate.typeDefinition = AuxVars.currentPrefix + StructPhrase.name
        NewStructTD.MemoryTemplate.isDeclared = AuxVars.isFunctionArgument
        const savedPrefix = AuxVars.currentPrefix
        AuxVars.currentPrefix = ''
        StructPhrase.members.forEach(StruPhrs => {
            if (StruPhrs.type !== 'phrase') {
                throw new Error(`At line: ${StruPhrs.line}. Invalid sentence in struct members.`)
            }
            if (StruPhrs.code !== undefined) {
                NewStructTD.structMembers.push(...memoryProcessor(
                    Program.typesDefinitions,
                    AuxVars,
                    StruPhrs.code,
                    StructPhrase.name + '_'
                ))
            }
        })
        NewStructTD.MemoryTemplate.size = NewStructTD.structMembers.length
        let accumulatedSize = 0
        NewStructTD.structMembers.forEach((MemberMem) => {
            NewStructTD.structAccumulatedSize.push([MemberMem.name, accumulatedSize])
            if (MemberMem.type !== 'struct') { // Remeber to change here code yolj1A
                accumulatedSize++
            }
        })
        AuxVars.currentPrefix = savedPrefix
        Program.typesDefinitions.push(NewStructTD)
    }

    /** Process/checks function arguments and code, transforming them
     * into argsMemObj and sentences properties  */
    function processFunctionCodeAndArguments (CurrentFunction: SC_FUNCTION, fnNum: number) {
        CurrentFunction.sentences = sentencesProcessor(AuxVars, CurrentFunction.code)
        AuxVars.currentScopeName = CurrentFunction.name
        AuxVars.currentPrefix = AuxVars.currentScopeName + '_'
        AuxVars.isFunctionArgument = true
        const sentence = sentencesProcessor(AuxVars, CurrentFunction.arguments, true)
        if (sentence.length !== 1 || sentence[0].type !== 'phrase' || sentence[0].code === undefined) {
            throw new Error(`At line: ${CurrentFunction.line}.` +
            `Wrong arguments for function '${CurrentFunction.name}'.`)
        }
        CurrentFunction.argsMemObj = memoryProcessor(Program.typesDefinitions, AuxVars, sentence[0].code)
        Program.memory = Program.memory.concat(CurrentFunction.argsMemObj)
        AuxVars.isFunctionArgument = false
        delete Program.functions[fnNum].arguments
        delete Program.functions[fnNum].code
        CurrentFunction.sentences.forEach(createMemoryTable)
    }

    /** Checks variables for double definitions and against label names */
    function validateMemory () {
        let i, j
        for (i = 0; i < Program.memory.length - 1; i++) {
            for (j = i + 1; j < Program.memory.length; j++) {
                if (Program.memory[i].asmName === Program.memory[j].asmName) {
                    if (Program.memory[i].type !== Program.memory[j].type) {
                        throw new Error('At line: unknown.' +
                        ` Global check: it was found that variable '${Program.memory[i].name}' was declared more` +
                        ` one time with types '${Program.memory[i].type}' and '${Program.memory[j].type}'.`)
                    }
                    if (Program.memory[i].type === 'label') {
                        throw new Error('At line: unknow.' +
                        ` Global check: it was found that label '${Program.memory[i].name}' was` +
                        ' declared more than one time.')
                    }
                    throw new Error('At line: unknow.' +
                    ` Global check: it was found that variable '${Program.memory[i].name}' was` +
                    ' declared more than one time.')
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
                    throw new Error(`At line: ${Program.functions[j].line}.` +
                    ` Found second definition for function '${Program.functions[j].name}'.`)
                }
            }
            for (j = 0; j < Program.Global.BuiltInFunctions.length; j++) {
                if (Program.functions[i].name === Program.Global.BuiltInFunctions[j].name) {
                    throw new Error(`At line: ${Program.functions[i].line}.` +
                    ` Function '${Program.functions[i].name}' has same name of one built-in Functions.`)
                }
            }
            if (Program.Config.APIFunctions === true) {
                for (j = 0; j < Program.Global.APIFunctions.length; j++) {
                    if (Program.functions[i].name === Program.Global.APIFunctions[j].name ||
                        Program.functions[i].name === Program.Global.APIFunctions[j].asmName) {
                        throw new Error(`At line: ${Program.functions[i].line}.` +
                        ` Function '${Program.functions[i].name}' has same name of one API Functions.`)
                    }
                }
            }
        }
    }

    /** Fills the correct address of memory objects. */
    function consolidateMemory () {
        let memoryAddress = 0
        Program.memory.forEach((CurrMem) => {
            switch (CurrMem.type) {
            case 'struct':
                // Remeber to change here code yolj1A
                CurrMem.hexContent = memoryAddress.toString(16).padStart(16, '0')
                return
            case 'array':
                CurrMem.address = memoryAddress
                memoryAddress++
                CurrMem.hexContent = memoryAddress.toString(16).padStart(16, '0')
                return
            case 'label':
                return
            default:
                CurrMem.address = memoryAddress
                memoryAddress++
            }
        })
    }

    return shapeMain()
}
