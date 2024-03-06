import { CONTRACT, SC_FUNCTION } from '../typings/contractTypes'
import {
    TOKEN, DECLARATION_TYPES, SENTENCES, SENTENCE_STRUCT,
    MEMORY_SLOT,
    REGISTER_TYPE_DEFINITION
} from '../typings/syntaxTypes'
import { assertNotUndefined, deepCopy } from '../repository/repository'
import {
    APITableTemplate, getMemoryTemplate, getTypeDefinitionTemplate, BuiltInTemplate, fixedBaseTemplate, fixedAPITableTemplate, autoCounterTemplate
} from './templates'
import sentencesProcessor from './sentencesProcessor'
import memoryProcessor from './memoryProcessor'

/** Translate an array of tokens into the object representing the program.
 * This is the second phase of parser
 * @param Program Skeleton program to received processed tokens
 * @param tokenAST Array of tokens
 * @returns {void} but Program will be updated.
 * @throws {Error} at any mistakes
 */
export default function shaper (Program: CONTRACT, tokenAST: TOKEN[]): void {
    /* * * Main function! * * */
    function shapeMain () : void {
        splitCode()
        Program.typesDefinitions = [
            getTypeDefinitionTemplate('register'),
            getTypeDefinitionTemplate('long'),
            getTypeDefinitionTemplate('fixed')
        ]
        Program.memory.push(...addRegistersInMemory(Program.Config.maxAuxVars))
        Program.memory.push(...addConstantsInMemory(Program.Config.maxConstVars))
        if (Program.Config.fixedAPIFunctions || Program.Context.TokenizerDetection.hasFixed) {
            Program.memory.push(fixedBaseTemplate)
        }
        if (Program.Context.TokenizerDetection.hasAutoCounter) {
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
                    throw new Error(Program.Context.formatError(tokenAST[tokenIndex].line,
                        'Function returning a struct currently not implemented.'))
                }
                validateFunctionReturnType(tokenAST[tokenIndex])
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
                validateFunctionReturnType(tokenAST[tokenIndex])
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
                throw new Error(Program.Context.formatError(tokenAST[tokenIndex].line,
                    'Invalid use for inline keyword. Expecting a type and a function definition.'))
            }
            // Not function neither macro, so it is global statement
            Program.Global.code.push(tokenAST[tokenIndex])
            tokenIndex++
        }
    }

    function validateFunctionReturnType (Tkn: TOKEN) {
        switch (Tkn.value) {
        case 'void':
        case 'long':
        case 'fixed':
        case 'struct':
            return
        }
        throw new Error(Program.Context.formatError(Tkn.line,
            "Invalid function declaration type. Expecting 'void', 'long', 'fixed' or 'struct'"))
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

    /** Process global code, transforming them into global sentences properties  */
    function processGlobalCode () : void {
        Program.Context.ShaperContext.currentScopeName = ''
        Program.Context.ShaperContext.currentPrefix = ''
        Program.Global.sentences = sentencesProcessor(Program, Program.Global.code)
        Program.Global.sentences.forEach(createMemoryTable)
        delete Program.Global.code
    }

    /** Recursive.
     *  This creates only global variables or function scope variables  */
    function createMemoryTable (Sentence: SENTENCES) : void {
        switch (Sentence.type) {
        case 'phrase':
            Program.memory.push(...memoryProcessor(Program, assertNotUndefined(Sentence.code)))
            return
        case 'scope':
            Sentence.alwaysBlock.forEach(createMemoryTable)
            break
        case 'ifElse':
            Sentence.falseBlock.forEach(createMemoryTable)
        // eslint-disable-next-line no-fallthrough
        case 'ifEndif':
        case 'while':
        case 'do':
            Sentence.trueBlock.forEach(createMemoryTable)
            return
        case 'for':
            Program.memory.push(...memoryProcessor(Program, assertNotUndefined(Sentence.threeSentences[0].code)))
            Sentence.trueBlock.forEach(createMemoryTable)
            return
        case 'struct':
            structToTypeDefinition(Sentence)
            Program.memory.push(...memoryProcessor(Program, assertNotUndefined(Sentence.Phrase.code)))
            return
        case 'switch':
            Sentence.block.forEach(createMemoryTable)
            return
        case 'label': {
            const MemTempl = getMemoryTemplate('label')
            MemTempl.asmName = Sentence.id
            MemTempl.name = Sentence.id
            MemTempl.isDeclared = true
            MemTempl.line = Sentence.line
            Program.memory.push(MemTempl)
        }
        }
    }

    /** From a struct sentence, create and store a Struct Type Definition
     * in `Program.typesDefinitions` property */
    function structToTypeDefinition (StructPhrase: SENTENCE_STRUCT) {
        // create struct type definition
        const NewStructTD = getTypeDefinitionTemplate('struct')
        NewStructTD.name = Program.Context.ShaperContext.currentPrefix + StructPhrase.name
        NewStructTD.MemoryTemplate.typeDefinition = Program.Context.ShaperContext.currentPrefix + StructPhrase.name
        NewStructTD.MemoryTemplate.isDeclared = Program.Context.ShaperContext.isFunctionArgument
        const savedPrefix = Program.Context.ShaperContext.currentPrefix
        Program.Context.ShaperContext.currentPrefix = ''
        StructPhrase.members.forEach(StruPhrs => {
            if (StruPhrs.type !== 'phrase') {
                throw new Error(Program.Context.formatError(StruPhrs.line, 'Invalid sentence in struct members.'))
            }
            if (StruPhrs.code !== undefined) {
                NewStructTD.structMembers.push(...memoryProcessor(
                    Program,
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
        Program.Context.ShaperContext.currentPrefix = savedPrefix
        Program.typesDefinitions.push(NewStructTD)
    }

    /** Process/checks function arguments and code, transforming them
     * into argsMemObj and sentences properties  */
    function processFunctionCodeAndArguments (CurrentFunction: SC_FUNCTION, fnNum: number) {
        CurrentFunction.sentences = sentencesProcessor(Program, CurrentFunction.code)
        Program.Context.ShaperContext.currentScopeName = CurrentFunction.name
        Program.Context.ShaperContext.currentPrefix = Program.Context.ShaperContext.currentScopeName + '_'
        Program.Context.ShaperContext.isFunctionArgument = true
        const sentence = sentencesProcessor(Program, CurrentFunction.arguments, true)
        if (sentence.length !== 1 || sentence[0].type !== 'phrase' || sentence[0].code === undefined) {
            throw new Error(Program.Context.formatError(CurrentFunction.line,
                `Wrong arguments for function '${CurrentFunction.name}'.`))
        }
        CurrentFunction.argsMemObj = memoryProcessor(Program, sentence[0].code)
        Program.memory = Program.memory.concat(CurrentFunction.argsMemObj)
        Program.Context.ShaperContext.isFunctionArgument = false
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
                    if (Program.memory[i].type === 'label' || Program.memory[j].type === 'label') {
                        throw new Error(Program.Context.formatError(Program.memory[j].line,
                            `Label '${Program.memory[i].name}' was declared more than one time, ` +
                            `first declaration at line ${Program.memory[i].line}.` +
                            'Labels also cannot have same name from variables.'))
                    }
                    throw new Error(Program.Context.formatError(Program.memory[j].line,
                        `Variable '${Program.memory[i].name}' was first declared at line ${Program.memory[i].line}.`))
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
                    throw new Error(Program.Context.formatError(Program.functions[j].line,
                        `Found second definition for function '${Program.functions[j].name}'.`))
                }
            }
            for (j = 0; j < Program.Global.BuiltInFunctions.length; j++) {
                if (Program.functions[i].name === Program.Global.BuiltInFunctions[j].name) {
                    throw new Error(Program.Context.formatError(Program.functions[i].line,
                        `Function '${Program.functions[i].name}' has same name of one built-in Functions.`))
                }
            }
            if (Program.Config.APIFunctions === true) {
                for (j = 0; j < Program.Global.APIFunctions.length; j++) {
                    if (Program.functions[i].name === Program.Global.APIFunctions[j].name ||
                        Program.functions[i].name === Program.Global.APIFunctions[j].asmName) {
                        throw new Error(Program.Context.formatError(Program.functions[i].line,
                            `Function '${Program.functions[i].name}' has same name of one API Functions.`))
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
                if (CurrMem.toBeRegister) {
                    // do not allocate variables modified as register
                    if (Program.Config.verboseAssembly) {
                        // It will be needed by Simulator
                        Program.Config.verboseScope = true
                    }
                    return
                }
                CurrMem.address = memoryAddress
                memoryAddress++
            }
        })
    }

    return shapeMain()
}
