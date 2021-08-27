// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

/* global DECLARATION_TYPES TOKEN AST */

interface SC_CONFIG {
    /** This compiler version!!! */
    compilerVersion: 'dev',
    /** Add random string to labels: #pragma enableRandom  */
    enableRandom: boolean,
    /** Add line number to labels: #pragma enableLineLabels */
    enableLineLabels: boolean,
    /** Make final global optimization: #pragma globalOptimization */
    globalOptimization: boolean,
    /** Number of auxiliary vars to be declared by compiler: #pragma maxAuxVars */
    maxAuxVars: number,
    /** Number of auxiliary Constants to be declared by compiler: #pragma maxConstVars */
    maxConstVars: number,
    /** Try to reuse variable at left side of assigment: #pragma reuseAssignedVar */
    reuseAssignedVar: boolean,
    /** Enforces declaration of variables: #pragma useVariableDeclaration */
    useVariableDeclaration: boolean,
    /** Compiler version asked by program: #pragma version */
    version: string,
    /** Warning to error: #pragma warningToError */
    warningToError: boolean,
    /** Support for API Functions: #include APIFunctions */
    APIFunctions: boolean,
    /** Program Name: #program name */
    PName: string,
    /** Program description: #program description */
    PDescription: string,
    /** Program activationAmount: #program activationAmount */
    PActivationAmount: string,
}

interface SC_MACRO {
    /** pragma, program or include */
    type: string
    /** Macro property, only one word */
    property: string
    /** Macro value, allowed many words */
    value: string
    line: number
}

type MEMORY_BASE_TYPES = 'register' | 'long' | 'constant' | 'struct' | 'array' | 'label' | 'void' | 'register_ptr' | 'long_ptr'

interface MEMORY_SLOT {
    /** Variable base types: 'register' | 'long' | 'constant' | 'struct' | 'array' | 'label' | 'void' */
    type: MEMORY_BASE_TYPES
    /** Variable name in assembly code */
    asmName?: string
    /** Controls if variable was already defined an can be used. */
    isDeclared: boolean
    /** Variable type during declaration */
    declaration: DECLARATION_TYPES
    /** Offset in memory. -1 if this slot is not in memory */
    address: number
    /** Variable name */
    name: string
    /** Variable scope */
    scope: string
    /** Variable size in longs */
    size: number
    /** struct type definition OR array type definition  */
    typeDefinition?: string
    /** For constants: content */
    hexContent?: string
    /** Array only property: base type */
    arrayItemType?: string
    /** Array only property: type definition of vase type (could be structs!) */
    arrayItemTypeDefinition?: string
    /** Total size of array. (is the same as size???) */
    arrayTotalSize?: number
}

// eslint-disable-next-line no-use-before-define
type SENTENCES = SENTENCE_PHRASE | SENTENCE_IF_ENDIF | SENTENCE_IF_ELSE | SENTENCE_WHILE | SENTENCE_DO | SENTENCE_FOR | SENTENCE_STRUCT

interface SENTENCE_PHRASE {
    type: 'phrase'
    /** Array of tokens, recursive on Arr, Codecave and CodeDomain */
    code?: TOKEN[]
    /** Tokens organized in an AST */
    CodeAST?: AST
}
interface SENTENCE_IF_ENDIF {
    type: 'ifEndif'
    id: string
    line: number
    condition?: TOKEN[]
    /** Tokens organized in an AST */
    ConditionAST?: AST
    trueBlock: SENTENCES[]
}
interface SENTENCE_IF_ELSE {
    type: 'ifElse'
    id: string
    line: number
    condition?: TOKEN[]
    ConditionAST?: AST
    trueBlock: SENTENCES[]
    falseBlock: SENTENCES[]
}
interface SENTENCE_WHILE {
    type: 'while'
    id: string
    line: number
    condition?: TOKEN[]
    ConditionAST?: AST
    trueBlock: SENTENCES[]
}
interface SENTENCE_DO {
    type: 'do'
    id: string
    line: number
    condition?: TOKEN[]
    ConditionAST?: AST
    trueBlock: SENTENCES[]
}
interface SENTENCE_FOR {
    type: 'for'
    id: string
    line: number
    threeSentences: SENTENCE_PHRASE[]
    trueBlock: SENTENCES[]
}
interface SENTENCE_STRUCT {
    type: 'struct',
    line: number,
    name: string,
    members: SENTENCES[],
    Phrase: SENTENCE_PHRASE
}

interface STRUCT_TYPE_DEFINITION {
    type: 'struct',
    name: string,
    structMembers: MEMORY_SLOT[],
    structAccumulatedSize: [string, number][],
    MemoryTemplate: MEMORY_SLOT
}
interface ARRAY_TYPE_DEFINITION {
    type: 'array'
    name: string
    // TODO is temporary?
    arrayDimensions: number[]
    arrayMultiplierDim: number[]
    MemoryTemplate: MEMORY_SLOT
}
interface REGISTER_TYPE_DEFINITION {
    type: 'register'
    name: '',
    MemoryTemplate: MEMORY_SLOT
}
interface LONG_TYPE_DEFINITION {
    type: 'long'
    name: '',
    MemoryTemplate: MEMORY_SLOT
}
type TYPE_DEFINITIONS = STRUCT_TYPE_DEFINITION | ARRAY_TYPE_DEFINITION | REGISTER_TYPE_DEFINITION | LONG_TYPE_DEFINITION

interface SC_FUNCTION {
    /** type of function declaration */
    declaration: DECLARATION_TYPES
    /** Function name */
    name: string
    /** Temporary, holding function arguments tokens */
    arguments?: TOKEN[]
    /** Variables of function arguments */
    argsMemObj: MEMORY_SLOT[]
    /** Temporary, holding function block tokens */
    code?: TOKEN[]
    /** Definitive sentences for function block. Not used on API Functions */
    sentences?: SENTENCES[]
    /** Line number of function declaration */
    line?: number
    /** Assembly name for API Functions only */
    asmName?: string
}

interface SC_GLOBAL {
    /** Definitions for API functions */
    APIFunctions: SC_FUNCTION[]
    /** macros values */
    macros: SC_MACRO[]
    /** Temporary, holding tokens objects */
    code?: TOKEN[]
    /** Definitive structure for compilation */
    sentences: SENTENCES[]
}

interface CONTRACT {
    /** Global statements and information */
    Global: SC_GLOBAL,
    /** Declared functions */
    functions: SC_FUNCTION[],
    /** Variables and constants in memory */
    memory: MEMORY_SLOT[],
    /** All labels used in program */
    labels: string[],
    /** Extended information for arrays and structs */
    typesDefinitions: TYPE_DEFINITIONS[],
    /** Compiler configurations */
    Config: SC_CONFIG,
}

/** Translate an array of tokens to an object representing the program.
 * This is the second phase of parser
 * @param tokenAST Array of tokens
 * @returns CONTRACT object in final type, but still incomplete.
 * @throws {TypeError | SyntaxError} at any mistakes
 */
// eslint-disable-next-line no-unused-vars
function shape (tokenAST: TOKEN[]): CONTRACT {
    const Program: CONTRACT = {
        Global: {
            APIFunctions: [],
            macros: [],
            sentences: []
        },
        functions: [],
        memory: [],
        labels: [],
        typesDefinitions: [],
        // Default configuration for compiler
        Config: {
            compilerVersion: 'dev',
            enableRandom: false,
            enableLineLabels: false,
            globalOptimization: false,
            maxAuxVars: 5,
            maxConstVars: 0,
            reuseAssignedVar: true,
            useVariableDeclaration: true,
            version: 'dev',
            warningToError: true,
            APIFunctions: false,
            PName: '',
            PDescription: '',
            PActivationAmount: ''
        }
    }

    const AuxVars: {
        currentToken: number
        /** current loop name to be used if break or continue keywords are found. */
        latestLoopId: string[]
        /** If true, compilation loop on generator() will not expect the variable to be declared. Used in function arguments. */
        setIsDeclared: boolean
        /** Variables scope (function name) */
        currentScopeName:string
        /** Prefix to be used in variables names (function name + '_') */
        currentPrefix: string
    } = {
        currentToken: 0,
        latestLoopId: [],
        setIsDeclared: false,
        currentScopeName: '',
        currentPrefix: ''
    }

    /* * * Main function! * * */
    function shapeMain () {
        splitGlobalAndFunctions()

        if (Program.Global.macros !== undefined) {
            Program.Global.macros.forEach(processMacro)
        }
        if (Program.Config.version === '') {
            throw new TypeError(`Compiler version not set. Pin current compiler version in your program adding '#pragma version ${Program.Config.compilerVersion}' to code.`)
        }
        if (Program.Config.version !== Program.Config.compilerVersion) {
            throw new TypeError(`This compiler is version '${Program.Config.compilerVersion}'. File needs a compiler version '${Program.Config.version}'. Update '#pragma version' macro or run another SmartC version.`)
        }

        Program.typesDefinitions = createDefaultTypesTable()

        addRegistersInMemory()

        addConstantsInMemory()

        AuxVars.currentScopeName = ''
        AuxVars.currentPrefix = ''
        AuxVars.currentToken = 0
        Program.Global.sentences = code2sentenceS(Program.Global.code)
        createMemoryTable(Program.Global.sentences)
        delete Program.Global.code

        for (let i = 0; i < Program.functions.length; i++) {
            processFunction(i)
            delete Program.functions[i].arguments
            delete Program.functions[i].code

            const fnSentences = Program.functions[i].sentences
            if (fnSentences !== undefined && fnSentences.length > 0) {
                createMemoryTable(fnSentences)
            }
        };

        if (Program.Config.APIFunctions) {
            Program.Global.APIFunctions = createAPItable()
        }

        checkDoublesDefinitions()

        consolidateMemory()

        return Program
    }

    /**
     * Organize incoming tokens (tokenAST) into only tree posibilities:
     * 1) global statements,
     * 2) macros or
     * 3) functions
     * */
    function splitGlobalAndFunctions () {
        Program.Global.code = []

        for (AuxVars.currentToken = 0; AuxVars.currentToken < tokenAST.length; AuxVars.currentToken++) {
            if (AuxVars.currentToken + 3 < tokenAST.length &&
                tokenAST[AuxVars.currentToken].type === 'Keyword' &&
                tokenAST[AuxVars.currentToken + 1].type === 'Variable' &&
                tokenAST[AuxVars.currentToken + 2].type === 'Function' &&
                tokenAST[AuxVars.currentToken + 3].type === 'CodeDomain') {
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
            if (AuxVars.currentToken + 4 < tokenAST.length &&
                tokenAST[AuxVars.currentToken].type === 'Keyword' &&
                tokenAST[AuxVars.currentToken + 1].type === 'UnaryOperator' &&
                tokenAST[AuxVars.currentToken + 1].value === '*' &&
                tokenAST[AuxVars.currentToken + 2].type === 'Variable' &&
                tokenAST[AuxVars.currentToken + 3].type === 'Function' &&
                tokenAST[AuxVars.currentToken + 4].type === 'CodeDomain') {
                // Function found. Does return pointer
                if (tokenAST[AuxVars.currentToken].value === 'struct') {
                    throw new SyntaxError(`At line: ${tokenAST[AuxVars.currentToken].line}. Function returning a struct currently not implemented.`)
                }
                Program.functions.push(
                    {
                        argsMemObj: [],
                        sentences: [],
                        declaration: (tokenAST[AuxVars.currentToken].value + '_ptr') as DECLARATION_TYPES,
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

    // Expects one or more sentences inside codetrain
    function code2sentenceS (codetrain: TOKEN[] = [], addTerminator: boolean = false) {
        if (addTerminator) {
            codetrain.push({ type: 'Terminator', value: ';', precedence: 11, line: codetrain[AuxVars.currentToken].line })
        }
        let sentences: SENTENCES[] = []
        for (; AuxVars.currentToken < codetrain.length; AuxVars.currentToken++) {
            sentences = sentences.concat(code2sentence(codetrain))
        }
        return sentences
    }

    // Expects only one sentence in codetrain
    function code2sentence (codetrain: TOKEN[]): SENTENCES[] {
        const phrase: TOKEN[] = []

        if (codetrain[AuxVars.currentToken].type === 'CodeDomain') {
            const savedPosition = AuxVars.currentToken
            AuxVars.currentToken = 0
            const temp = code2sentenceS(codetrain[savedPosition].params)
            AuxVars.currentToken = savedPosition
            return temp
        }

        // One sentence ending with terminator (or maybe another loop/conditional)
        while (AuxVars.currentToken < codetrain.length) {
            if (codetrain[AuxVars.currentToken].type === 'Terminator') {
                // end of sentence!
                return [{ type: 'phrase', code: phrase }]
            }

            if (codetrain[AuxVars.currentToken].type === 'CodeCave') {
                if (codetrain[AuxVars.currentToken - 1].value === 'if') {
                    if (phrase.length > 1) {
                        throw new SyntaxError(`At line: ${phrase[0].line}. Statement including 'if' in wrong way. Possible missing ';'.`)
                    }
                    phrase.pop()
                    const id = `__if${codetrain[AuxVars.currentToken].line}`
                    const line = codetrain[AuxVars.currentToken].line
                    const condition = codetrain[AuxVars.currentToken].params
                    AuxVars.currentToken++
                    const trueBlock = code2sentence(codetrain)

                    if (AuxVars.currentToken + 1 < codetrain.length) {
                        if (codetrain[AuxVars.currentToken + 1].type === 'Keyword' && codetrain[AuxVars.currentToken + 1].value === 'else') {
                            AuxVars.currentToken += 2
                            return [{
                                type: 'ifElse',
                                id: id,
                                line: line,
                                condition: condition,
                                trueBlock: trueBlock,
                                falseBlock: code2sentence(codetrain)
                            }]
                        }
                    }
                    return [{
                        type: 'ifEndif',
                        id: id,
                        line: line,
                        condition: condition,
                        trueBlock: trueBlock
                    }]
                }

                if (codetrain[AuxVars.currentToken - 1].value === 'while') {
                    if (phrase.length > 1) {
                        throw new SyntaxError(`At line: ${phrase[0].line}'. Statement including 'while' in wrong way. Possible missing ';'.`)
                    }
                    phrase.pop()
                    const id = `__loop${codetrain[AuxVars.currentToken].line}`
                    const line = codetrain[AuxVars.currentToken].line
                    const condition = codetrain[AuxVars.currentToken].params
                    AuxVars.currentToken++
                    AuxVars.latestLoopId.push(id)
                    const trueBlock = code2sentence(codetrain)
                    AuxVars.latestLoopId.pop()
                    return [{
                        type: 'while',
                        id: id,
                        line: line,
                        condition: condition,
                        trueBlock: trueBlock
                    }]
                }

                if (codetrain[AuxVars.currentToken - 1].value === 'for') {
                    if (phrase.length > 1) {
                        throw new SyntaxError(`At line: ${phrase[0].line}. Statement including 'for' in wrong way. Possible missing ';'.`)
                    }
                    if (codetrain[AuxVars.currentToken].type !== 'CodeCave') {
                        throw new SyntaxError(`At line: ${phrase[0].line}. Expected '(' in 'for(;;){}' loop.`)
                    }
                    phrase.pop()
                    const id = `__loop${codetrain[AuxVars.currentToken].line}`
                    const line = codetrain[AuxVars.currentToken].line

                    // codetrain[AuxVars.currentToken].params.push();
                    const savePosition = AuxVars.currentToken
                    AuxVars.currentToken = 0
                    const threeSentences = code2sentenceS(codetrain[savePosition].params, true)
                    AuxVars.currentToken = savePosition
                    if (threeSentences.length !== 3) {
                        throw new SyntaxError(`At line: ${codetrain[AuxVars.currentToken].line}. Expected 3 sentences for 'for(;;){}' loop. Got ${threeSentences.length}`)
                    }
                    if (threeSentences[0].type !== 'phrase' || threeSentences[1].type !== 'phrase' || threeSentences[2].type !== 'phrase') {
                        throw new SyntaxError(`At line: ${codetrain[AuxVars.currentToken].line}. Sentences inside 'for(;;)' can not be other loops or conditionals`)
                    }

                    AuxVars.currentToken++
                    AuxVars.latestLoopId.push(id)
                    const trueBlock = code2sentence(codetrain)
                    AuxVars.latestLoopId.pop()

                    return [{
                        type: 'for',
                        id: id,
                        line: line,
                        threeSentences: threeSentences as SENTENCE_PHRASE[],
                        trueBlock: trueBlock
                    }]
                }
            }

            if (codetrain[AuxVars.currentToken].type === 'Keyword') {
                if (codetrain[AuxVars.currentToken].value === 'else') {
                    throw new SyntaxError('At line: ' + codetrain[AuxVars.currentToken].line + ". 'else' not associated with an 'if(){}else{}' sentence")
                }

                if (codetrain[AuxVars.currentToken].value === 'asm' || codetrain[AuxVars.currentToken].value === 'label') {
                    return [{ type: 'phrase', code: [codetrain[AuxVars.currentToken]] }]
                }

                if (codetrain[AuxVars.currentToken].value === 'do') {
                    const id = `__loop${codetrain[AuxVars.currentToken].line}`
                    const line = codetrain[AuxVars.currentToken].line

                    AuxVars.currentToken++
                    AuxVars.latestLoopId.push(id)
                    const trueBlock = code2sentence(codetrain)
                    AuxVars.latestLoopId.pop()

                    AuxVars.currentToken++
                    if (AuxVars.currentToken + 2 >= codetrain.length) {
                        throw new SyntaxError(`At line: ${codetrain[AuxVars.currentToken].line}. Incomplete do{}while(); sentence.`)
                    }
                    if (codetrain[AuxVars.currentToken].type !== 'Keyword' || codetrain[AuxVars.currentToken].value !== 'while') {
                        throw new SyntaxError(`At line: ${codetrain[AuxVars.currentToken].line}. Wrong do{}while(); sentence.`)
                    }
                    AuxVars.currentToken++
                    if (codetrain[AuxVars.currentToken].type !== 'CodeCave') {
                        throw new SyntaxError(`At line: ${codetrain[AuxVars.currentToken].line}. Wrong do{}while(); sentence.`)
                    }
                    const condition = codetrain[AuxVars.currentToken].params

                    AuxVars.currentToken++
                    if (codetrain[AuxVars.currentToken].type !== 'Terminator') {
                        throw new SyntaxError(`At line: ${codetrain[AuxVars.currentToken].line}. Missing ';', found '${codetrain[AuxVars.currentToken].type}'.`)
                    }

                    return [{
                        type: 'do',
                        id: id,
                        line: line,
                        trueBlock: trueBlock,
                        condition: condition
                    }]
                }

                if (codetrain[AuxVars.currentToken].value === 'struct') {
                    if (AuxVars.currentToken + 1 >= codetrain.length) {
                        throw new SyntaxError(`At line: ${codetrain[AuxVars.currentToken].line}. Missing arguments for 'struct' sentence.`)
                    }
                    if (codetrain[AuxVars.currentToken + 1].type === 'CodeDomain') {
                        const structName = codetrain[AuxVars.currentToken].extValue
                        if (structName === undefined || structName === '') {
                            throw new SyntaxError(`At line: ${codetrain[AuxVars.currentToken].line}. Missing struct type name.`)
                        }
                        AuxVars.currentToken++
                        const Node: SENTENCE_STRUCT = {
                            type: 'struct',
                            line: codetrain[AuxVars.currentToken - 1].line,
                            name: structName,
                            members: code2sentence(codetrain),
                            Phrase: { type: 'phrase' }
                        }
                        Node.Phrase.code = [codetrain[AuxVars.currentToken - 1]]
                        AuxVars.currentToken++
                        while (AuxVars.currentToken < codetrain.length) {
                            if (codetrain[AuxVars.currentToken].type === 'Terminator') {
                                return [Node]
                            }
                            Node.Phrase.code.push(codetrain[AuxVars.currentToken])
                            AuxVars.currentToken++
                        }
                        throw new SyntaxError("At end of file. Wrong 'struct' declaration. Missing ';'")
                    }
                }

                if (codetrain[AuxVars.currentToken].value === 'break' || codetrain[AuxVars.currentToken].value === 'continue') {
                    if (AuxVars.latestLoopId.length === 0) {
                        throw new SyntaxError('At line: ' + codetrain[AuxVars.currentToken].line + ". '" + codetrain[AuxVars.currentToken].value + "' outside a loop.")
                    }
                    // Just update information and continue on loop
                    codetrain[AuxVars.currentToken].extValue = AuxVars.latestLoopId[AuxVars.latestLoopId.length - 1]
                }
            }

            phrase.push(codetrain[AuxVars.currentToken])
            AuxVars.currentToken++
        }

        if (phrase.length !== 0) {
            throw new SyntaxError('At line: ' + codetrain[AuxVars.currentToken - 1].line + ". Missing ';'. ")
        }
        // Never reach this point
        throw new SyntaxError('At line: ' + codetrain[AuxVars.currentToken - 1].line + '. Strange error. ')
    }

    // Not recursive. Only top level declarations allowed.
    // This creates only global variables or function scope variables.
    function createMemoryTable (sntcs: SENTENCES[]) {
        sntcs.forEach(function (phrs) {
            let memTemplate: MEMORY_SLOT[] | undefined
            if (phrs.type === 'struct') {
                struct2typedefinition(phrs)
                memTemplate = phrase2memoryObject(phrs.Phrase)
            } else if (phrs.type === 'phrase') {
                memTemplate = phrase2memoryObject(phrs)
            }

            if (memTemplate !== undefined && memTemplate.length > 0) {
                Program.memory = Program.memory.concat(memTemplate)
            }
        })
    }

    function getArraySize (tkn: TOKEN[] = [], line: number) {
        if (tkn.length !== 1 || tkn[0].type !== 'Constant') {
            throw new TypeError('At line: ' + line + '. Wrong array declaration. Only constant size declarations allowed.')
        }
        return parseInt(tkn[0].value, 16)
    }

    function struct2typedefinition (structPhrase: SENTENCE_STRUCT) {
        // create struct type definition
        const StructTypeD: STRUCT_TYPE_DEFINITION = {
            name: AuxVars.currentPrefix + structPhrase.name,
            type: 'struct',
            structMembers: [],
            structAccumulatedSize: [],
            MemoryTemplate: {
                address: -1,
                name: '',
                type: 'struct',
                typeDefinition: AuxVars.currentPrefix + structPhrase.name,
                scope: AuxVars.currentScopeName,
                size: -1,
                isDeclared: AuxVars.setIsDeclared,
                declaration: 'struct'
            }
        }

        const savedPrefix = AuxVars.currentPrefix
        AuxVars.currentPrefix = ''
        structPhrase.members.forEach(struphrs => {
            const memobj = phrase2memoryObject(struphrs, structPhrase.name)
            if (memobj !== undefined) {
                StructTypeD.structMembers = StructTypeD.structMembers.concat(memobj)
            }
        })

        StructTypeD.MemoryTemplate.size = StructTypeD.structMembers.length

        let accumulatedSize = 0
        StructTypeD.structMembers.forEach(function (memb) {
            StructTypeD.structAccumulatedSize.push([memb.name, accumulatedSize])
            if (memb.type !== 'struct' || memb.declaration.indexOf('_ptr') !== -1) { // Remeber to change here code yolj1A
                accumulatedSize++
            }
        })
        AuxVars.currentPrefix = savedPrefix
        Program.typesDefinitions.push(StructTypeD)
    }

    /** Takes a phrase and process variables to MEMORY_SLOT
         * Fills types definitions of necessary
         * Inserts labels at Program.labels */
    function phrase2memoryObject (phrs: SENTENCES, structName = ''): MEMORY_SLOT[] | undefined {
        let ret: MEMORY_SLOT[] = []
        let ispointer = false
        if (structName !== '') {
            structName += '_'
        }

        if (phrs.type === undefined || phrs.type !== 'phrase') {
            throw new TypeError('Unknow object type arrived at phrase2memoryObject.')
        }
        const phraseCode = phrs.code
        if (phraseCode === undefined || phraseCode.length === 0) { // empty statement
            return
        }

        if (phraseCode[0].type === 'Keyword' && phraseCode[0].value === 'label') {
            const labelID = phraseCode[0].extValue
            if (labelID === undefined || labelID === '') {
                throw new TypeError(`At line: ${phraseCode[0].line}. Found a label without id.`)
            }
            if (Program.labels.find(val => val === labelID) !== undefined) {
                throw new TypeError(`At line: ${phraseCode[0].line}. Label name already in use.`)
            }
            Program.labels.push(labelID)
            return
        }

        if (phraseCode.length < 2) {
            return
        }

        if (phraseCode[0].type === 'Keyword') {
            let TokenConst:TOKEN | undefined

            if (phraseCode[0].value === 'return' ||
                    phraseCode[0].value === 'goto') {
                return
            }

            if (phraseCode[0].value === 'const') {
                // remove token so no influence in declarations
                TokenConst = phraseCode.shift()
            }

            let keywordIndex = 0
            let end = false
            while (end === false) {
                end = true

                if (phraseCode[keywordIndex].value === 'struct') {
                    if (keywordIndex + 2 > phraseCode.length) {
                        return
                    }
                    const structNameDef = phraseCode[keywordIndex].extValue
                    let search = Program.typesDefinitions.find(obj => obj.name === structNameDef && obj.type === 'struct')
                    if (search === undefined && AuxVars.currentPrefix.length > 0) {
                        search = Program.typesDefinitions.find(obj => obj.name === AuxVars.currentPrefix + structNameDef && obj.type === 'struct')
                    }
                    if (search === undefined) {
                        throw new TypeError(`At line: ${phraseCode[keywordIndex].line}. Could not find type definition for 'struct' '${phraseCode[keywordIndex].extValue}'.`)
                    }

                    let idx = keywordIndex + 1
                    while (idx < phraseCode.length) {
                        const dimensions: number[] = []
                        const MemTemplate: MEMORY_SLOT = JSON.parse(JSON.stringify(search.MemoryTemplate))

                        if (phraseCode[idx].type === 'Delimiter') {
                            idx++
                            continue
                        }
                        if (phraseCode[idx].type === 'Keyword') {
                            keywordIndex = idx
                            end = false
                            break
                        }
                        if (phraseCode[idx].value === '*' && idx + 1 < phraseCode.length && phraseCode[idx + 1].type === 'Variable') {
                            ispointer = true
                            MemTemplate.declaration += '_ptr'
                            idx++
                        } else {
                            ispointer = false
                        }
                        MemTemplate.name = phraseCode[idx].value
                        MemTemplate.asmName = AuxVars.currentPrefix + phraseCode[idx].value
                        MemTemplate.scope = AuxVars.currentScopeName
                        MemTemplate.isDeclared = AuxVars.setIsDeclared

                        if (phraseCode[idx].type === 'Variable') {
                            while (idx + 1 < phraseCode.length) {
                                if (phraseCode[idx + 1].type === 'Arr') { // Array declaration
                                    idx++
                                    dimensions.push(getArraySize(phraseCode[idx].params, phraseCode[idx].line))
                                } else {
                                    break
                                }
                            }

                            if (dimensions.length > 0) { // is array of structs
                                MemTemplate.type = 'array'
                                MemTemplate.typeDefinition = MemTemplate.asmName
                                MemTemplate.asmName = AuxVars.currentPrefix + MemTemplate.name
                                MemTemplate.arrayItemType = search.type
                                MemTemplate.arrayItemTypeDefinition = search.name
                                MemTemplate.declaration += '_ptr'
                                MemTemplate.arrayTotalSize = 1 + dimensions.reduce(function (total, num) {
                                    return total * num
                                }, search.MemoryTemplate.size)

                                ret.push(MemTemplate)
                                for (let x = 0, i = 0; x < dimensions.length; x++) {
                                    for (let y = 0; y < dimensions[x]; y++) {
                                        ret = ret.concat(assignStructVariable(phraseCode[0].extValue, phraseCode[idx - dimensions.length].value + '_' + i, ispointer))
                                        i++
                                    }
                                }

                                // create array type definition
                                if (dimensions.length > 0) {
                                    const TypeD: ARRAY_TYPE_DEFINITION = {
                                        name: AuxVars.currentPrefix + phraseCode[idx - dimensions.length].value,
                                        type: 'array',
                                        arrayDimensions: dimensions,
                                        arrayMultiplierDim: [],
                                        // CHECK unneed?
                                        MemoryTemplate: MemTemplate
                                    }
                                    let j = dimensions.length - 1
                                    let acc = search.MemoryTemplate.size
                                    do {
                                        TypeD.arrayMultiplierDim.unshift(acc)
                                        acc *= dimensions[j]
                                        j--
                                    } while (j >= 0)
                                    Program.typesDefinitions.push(TypeD)
                                }
                            } else { // is not array of structs
                                if (ispointer) {
                                    ret = ret.concat(MemTemplate)
                                } else {
                                    ret = ret.concat(assignStructVariable(phraseCode[0].extValue, phraseCode[idx].value, ispointer))
                                }
                            }
                            idx++
                            continue
                        }
                        if (phraseCode[idx].type === 'Terminator') {
                            break
                        }
                        throw new TypeError('At line: ' + phraseCode[idx].line + ". Invalid element (type: '" + phraseCode[idx].type + "' value: '" + phraseCode[idx].value + "') found in struct definition!")
                    }
                    if (phraseCode[idx] !== undefined && phraseCode[idx].type === 'Keyword') {
                        continue
                    }
                    return ret
                }

                if (phraseCode[keywordIndex].value === 'long') {
                    let idx = keywordIndex + 1
                    let valid = true
                    while (idx < phraseCode.length) {
                        if (phraseCode[idx].type === 'Delimiter') {
                            if (keywordIndex + 1 === idx) {
                                throw new TypeError(`At line: ${phraseCode[idx].line}. Delimiter ',' not expected.`)
                            }
                            idx++
                            valid = true
                            continue
                        }
                        if (phraseCode[idx].type === 'Keyword') {
                            keywordIndex = idx
                            end = false
                            break
                        }

                        if (valid === true && phraseCode[idx].value === '*' && idx + 1 < phraseCode.length && phraseCode[idx + 1].type === 'Variable') {
                            ispointer = true
                            idx++
                        } else {
                            ispointer = false
                        }

                        if (valid === true) {
                            const dimensions: number[] = []
                            const search = Program.typesDefinitions.find(obj => obj.type === 'long') as (LONG_TYPE_DEFINITION | undefined)
                            if (search === undefined) {
                                throw new TypeError(`At line: ${phraseCode[idx].line}. Type definition for 'long' not found`)
                            }
                            const MemTemplate: MEMORY_SLOT = JSON.parse(JSON.stringify(search.MemoryTemplate))
                            MemTemplate.name = phraseCode[idx].value
                            MemTemplate.asmName = AuxVars.currentPrefix + phraseCode[idx].value
                            MemTemplate.scope = AuxVars.currentScopeName
                            if (ispointer) {
                                MemTemplate.declaration += '_ptr'
                            }
                            MemTemplate.isDeclared = AuxVars.setIsDeclared

                            while (idx + 1 < phraseCode.length) {
                                if (phraseCode[idx + 1].type === 'Arr') { // Array declaration
                                    idx++
                                    dimensions.push(getArraySize(phraseCode[idx].params, phraseCode[idx].line))
                                } else {
                                    break
                                }
                            }

                            if (dimensions.length === 0) {
                                // NOT array
                                ret.push(MemTemplate)
                            } else {
                                // IS array
                                // fill more information in memory template
                                MemTemplate.type = 'array'
                                MemTemplate.typeDefinition = MemTemplate.asmName
                                MemTemplate.arrayItemType = search.type
                                MemTemplate.declaration += '_ptr'
                                MemTemplate.arrayTotalSize = 1 + dimensions.reduce(function (total, num) {
                                    return total * num
                                }, 1)

                                // Create item in memory_template
                                ret.push(MemTemplate)

                                // Create array items in memory_template
                                for (let i = 1; i < MemTemplate.arrayTotalSize; i++) {
                                    const Mem2: MEMORY_SLOT = JSON.parse(JSON.stringify(search.MemoryTemplate))
                                    Mem2.name = `${MemTemplate.name}_${i - 1}`
                                    Mem2.asmName = `${MemTemplate.asmName}_${i - 1}`
                                    Mem2.scope = AuxVars.currentScopeName
                                    ret.push(Mem2)
                                }

                                // create array type definition
                                if (MemTemplate.arrayTotalSize > 1) {
                                    const TypeD: ARRAY_TYPE_DEFINITION = {
                                        name: structName + MemTemplate.asmName,
                                        type: 'array',
                                        arrayDimensions: dimensions,
                                        arrayMultiplierDim: [],
                                        // CHECK unneed?
                                        MemoryTemplate: MemTemplate
                                    }
                                    let j = dimensions.length - 1
                                    let acc = 1
                                    do {
                                        TypeD.arrayMultiplierDim.unshift(acc)
                                        acc *= dimensions[j]
                                        j--
                                    } while (j >= 0)
                                    Program.typesDefinitions.push(TypeD)
                                }
                            }
                            valid = false
                        }
                        idx++
                    }
                }
            }

            if (TokenConst !== undefined) {
                // give token back!
                phraseCode.unshift(TokenConst)
            }
        }
        return ret
    }

    function assignStructVariable (structName: string = '', varName: string, ispointer: boolean) {
        let search = Program.typesDefinitions.find(obj => obj.type === 'struct' && obj.name === structName) as (STRUCT_TYPE_DEFINITION | undefined)
        if (search === undefined && AuxVars.currentPrefix.length > 0) {
            search = Program.typesDefinitions.find(obj => obj.type === 'struct' && obj.name === AuxVars.currentPrefix + structName) as (STRUCT_TYPE_DEFINITION | undefined)
        }
        if (search === undefined) {
            throw new TypeError(`Could not find type definition for 'struct' '${structName}'`)
        }

        let newmemory: MEMORY_SLOT[] = [JSON.parse(JSON.stringify(search.MemoryTemplate))]
        if (!ispointer) {
            newmemory = newmemory.concat(JSON.parse(JSON.stringify(search.structMembers)))
        }
        newmemory.forEach(Mem => {
            if (Mem.name === '') {
                Mem.name = varName
            } else {
                Mem.name = varName + '_' + Mem.name
            }
            Mem.asmName = AuxVars.currentPrefix + Mem.name
        })
        return newmemory
    }

    /** Reads/verifies one macro token and add it into Program.Config object
     * */
    function processMacro (Token: SC_MACRO) {
        let boolVal: boolean | undefined

        if (Token.value === undefined || Token.value === '') {
            boolVal = true
        } else if (Token.value === 'true' || Token.value === '1') {
            boolVal = true
        } else if (Token.value === 'false' || Token.value === '0') {
            boolVal = false
        }

        if (Token.type === 'pragma') {
            if (Token.property === 'maxAuxVars') {
                if (Token.value !== undefined) {
                    const num = parseInt(Token.value)
                    if (num < 1 || num > 10) {
                        throw new RangeError(`At line: ${Token.line}. Value out of permitted range 1..10.`)
                    }
                    Program.Config.maxAuxVars = num
                    return
                }
            }
            if (Token.property === 'maxConstVars') {
                if (Token.value !== undefined) {
                    const num = parseInt(Token.value)
                    if (num < 0 || num > 10) {
                        throw new RangeError(`At line: ${Token.line}. Value out of permitted range 0..10.`)
                    }
                    Program.Config.maxConstVars = num
                    return
                }
            }
            if (Token.property === 'reuseAssignedVar' && boolVal !== undefined) {
                Program.Config.reuseAssignedVar = boolVal
                return
            }
            if (Token.property === 'enableRandom' && boolVal !== undefined) {
                Program.Config.enableRandom = boolVal
                return
            }
            if (Token.property === 'enableLineLabels' && boolVal !== undefined) {
                Program.Config.enableLineLabels = boolVal
                return
            }
            if (Token.property === 'globalOptimization' && boolVal !== undefined) {
                Program.Config.globalOptimization = boolVal
                return
            }
            if (Token.property === 'useVariableDeclaration' && boolVal !== undefined) {
                Program.Config.useVariableDeclaration = boolVal
                return
            }
            if (Token.property === 'version') {
                Program.Config.version = Token.value
                if (Program.Config.version !== undefined) {
                    return
                }
            }
            if (Token.property === 'warningToError' && boolVal !== undefined) {
                Program.Config.warningToError = boolVal
                return
            }
        }

        if (Token.type === 'include') {
            if (Token.property === 'APIFunctions' && boolVal !== undefined) {
                Program.Config.APIFunctions = boolVal
                return
            }
        }

        if (Token.type === 'program') {
            if (Token.property === 'name') {
                const parts = /^[0-9a-zA-Z]{1,30}$/.exec(Token.value)
                if (parts === null) {
                    throw new TypeError(`At line: ${Token.line}. Program name must contains only letters [a-z][A-Z][0-9], from 1 to 30 chars.`)
                }
                Program.Config.PName = Token.value
                return
            }
            if (Token.property === 'description') {
                if (Token.value.length >= 1000) {
                    throw new TypeError(`At line: ${Token.line}. Program description max lenght is 1000 chars. It is ${Token.value.length} chars.`)
                }
                Program.Config.PDescription = Token.value
                return
            }
            if (Token.property === 'activationAmount') {
                const parts = /^[0-9_]{1,20}$/.exec(Token.value)
                if (parts === null) {
                    throw new TypeError(`At line: ${Token.line}. Program activation must be only numbers or '_'.`)
                }
                Program.Config.PActivationAmount = Token.value.replace(/_/g, '')
                return
            }
        }

        throw new TypeError(`At line: ${Token.line}. Unknow macro property and/or value: '#${Token.type} ${Token.property} ${Token.value}'. Please check valid values on Help page`)
    }

    function addRegistersInMemory () {
        if (Program.Config.useVariableDeclaration) {
            const search = Program.typesDefinitions.find(obj => obj.type === 'register') as (REGISTER_TYPE_DEFINITION | undefined)
            if (search === undefined) {
                throw new TypeError("Not found type 'register' at types definitions.")
            }
            for (let i = 0; i < Program.Config.maxAuxVars; i++) {
                const MemTemplate: MEMORY_SLOT = JSON.parse(JSON.stringify(search.MemoryTemplate))
                MemTemplate.name = `r${i}`
                MemTemplate.asmName = `r${i}`
                Program.memory.push(MemTemplate)
            }
        }
    }

    function addConstantsInMemory () {
        if (Program.Config.useVariableDeclaration) {
            const search = Program.typesDefinitions.find(obj => obj.type === 'register') as (REGISTER_TYPE_DEFINITION | undefined)
            if (search === undefined) {
                throw new TypeError("Not found type 'register' at types definitions.")
            }
            for (let i = 1; i <= Program.Config.maxConstVars; i++) {
                const MemTemplate: MEMORY_SLOT = JSON.parse(JSON.stringify(search.MemoryTemplate))
                MemTemplate.name = `n${i}`
                MemTemplate.asmName = `n${i}`
                MemTemplate.hexContent = i.toString(16).padStart(16, '0')
                Program.memory.push(MemTemplate)
            }
        }
    }

    /** Process/checks function arguments and code, transforming them into argsMemObj and sentences properties  */
    function processFunction (fnNum: number) {
        const currentFunction = Program.functions[fnNum]
        if (currentFunction.code === undefined) {
            currentFunction.sentences = []
        } else {
            AuxVars.currentToken = 0
            currentFunction.sentences = code2sentenceS(currentFunction.code)
        }

        if (currentFunction.arguments === undefined || currentFunction.arguments.length === 0) {
            throw new TypeError(`At line: ${currentFunction.line}. Missing arguments for function '${currentFunction.name}'. Do you mean 'void'?`)
        }
        if (currentFunction.arguments.length === 1 && currentFunction.arguments[0].type === 'Keyword' && currentFunction.arguments[0].value === 'void') {
            currentFunction.arguments.pop()
        }
        AuxVars.currentScopeName = currentFunction.name
        AuxVars.currentPrefix = AuxVars.currentScopeName + '_'
        if (currentFunction.arguments.length === 0) {
            currentFunction.argsMemObj = []
        } else {
            AuxVars.setIsDeclared = true
            AuxVars.currentToken = 0
            const sentence = code2sentenceS(currentFunction.arguments, true)
            if (sentence.length > 1) {
                throw new TypeError(`At line: ${currentFunction.line}. Wrong arguments for function '${currentFunction.name}'.`)
            }
            const memObj = phrase2memoryObject(sentence[0])
            if (memObj === undefined) {
                throw new TypeError(`At line: ${currentFunction.line}. Error in one or more arguments for function '${currentFunction.name}'.`)
            }
            currentFunction.argsMemObj = memObj
            Program.memory = Program.memory.concat(memObj)
            AuxVars.setIsDeclared = false
        }
    }

    function checkDoublesDefinitions () {
        let i, j
        if (Program.Config.useVariableDeclaration === false) {
            return
        }
        for (i = 0; i < Program.memory.length - 1; i++) {
            for (j = i + 1; j < Program.memory.length; j++) {
                if (Program.memory[i].asmName === Program.memory[j].asmName) {
                    throw new TypeError(`Error: Variable '${Program.memory[i].name}' was declared more than one time.`)
                }
            }
        }
        for (i = 0; i < Program.functions.length; i++) {
            for (j = i + 1; j < Program.functions.length; j++) {
                if (Program.functions[i].name === Program.functions[j].name) {
                    throw new TypeError("Error: Function '" + Program.functions[i].name + "' was declared more than one time.")
                }
            }
            if (Program.Config.APIFunctions === true) {
                for (j = 0; j < Program.Global.APIFunctions.length; j++) {
                    if (Program.functions[i].name === Program.Global.APIFunctions[j].name ||
                        Program.functions[i].name === Program.Global.APIFunctions[j].asmName) {
                        throw new TypeError("Error: Function '" + Program.functions[i].name + "' has same name of one API Functions.")
                    }
                }
            }
        }
    }

    // Fills the correct address of memory objects.
    function consolidateMemory () {
        let counter = 0
        Program.memory.forEach(function (thisvar) {
            if (thisvar.type === 'struct' && thisvar.declaration.indexOf('_ptr') === -1) { // Remeber to change here code yolj1A
                thisvar.hexContent = counter.toString(16).padStart(16, '0')
            } else if (thisvar.type === 'array') {
                thisvar.address = counter
                counter++
                thisvar.hexContent = counter.toString(16).padStart(16, '0')
            } else {
                thisvar.address = counter
                counter++
            }
        })
    }

    function createDefaultTypesTable (): TYPE_DEFINITIONS[] {
        return [{
            type: 'register',
            name: '',
            MemoryTemplate: {
                address: -1,
                name: '',
                asmName: '',
                type: 'register',
                scope: '',
                declaration: 'long',
                size: 1,
                isDeclared: true
            }
        }, {
            type: 'long',
            name: '',
            MemoryTemplate: {
                address: -1,
                name: '',
                asmName: '',
                type: 'long',
                scope: '',
                declaration: 'long',
                size: 1,
                isDeclared: false
            }
        }]
    }

    // Returns the API functions object
    function createAPItable (): SC_FUNCTION[] {
        return [
            {
                argsMemObj: [],
                asmName: 'get_A1',
                declaration: 'long',
                name: 'Get_A1'
            },
            {
                argsMemObj: [],
                asmName: 'get_A2',
                declaration: 'long',
                name: 'Get_A2'
            },
            {
                argsMemObj: [],
                asmName: 'get_A3',
                declaration: 'long',
                name: 'Get_A3'
            },
            {
                argsMemObj: [],
                asmName: 'get_A4',
                declaration: 'long',
                name: 'Get_A4'
            },
            {
                argsMemObj: [],
                asmName: 'get_B1',
                declaration: 'long',
                name: 'Get_B1'
            },
            {
                argsMemObj: [],
                asmName: 'get_B2',
                declaration: 'long',
                name: 'Get_B2'
            },
            {
                argsMemObj: [],
                asmName: 'get_B3',
                declaration: 'long',
                name: 'Get_B3'
            },
            {
                argsMemObj: [],
                asmName: 'get_B4',
                declaration: 'long',
                name: 'Get_B4'
            },
            {
                argsMemObj: [
                    {
                        address: -1,
                        name: 'addr',
                        asmName: 'Set_A1_addr',
                        type: 'long',
                        scope: 'Set_A1',
                        declaration: 'long',
                        size: 1,
                        isDeclared: true
                    }
                ],
                asmName: 'set_A1',
                declaration: 'void',
                name: 'Set_A1'
            },
            {
                argsMemObj: [
                    {
                        address: -1,
                        name: 'addr',
                        asmName: 'Set_A2_addr',
                        type: 'long',
                        scope: 'Set_A2',
                        declaration: 'long',
                        size: 1,
                        isDeclared: true
                    }
                ],
                asmName: 'set_A2',
                declaration: 'void',
                name: 'Set_A2'
            },
            {
                argsMemObj: [
                    {
                        address: -1,
                        name: 'addr',
                        asmName: 'Set_A3_addr',
                        type: 'long',
                        scope: 'Set_A3',
                        declaration: 'long',
                        size: 1,
                        isDeclared: true
                    }
                ],
                asmName: 'set_A3',
                declaration: 'void',
                name: 'Set_A3'
            },
            {
                argsMemObj: [
                    {
                        address: -1,
                        name: 'addr',
                        asmName: 'Set_A4_addr',
                        type: 'long',
                        scope: 'Set_A4',
                        declaration: 'long',
                        size: 1,
                        isDeclared: true
                    }
                ],
                asmName: 'set_A4',
                declaration: 'void',
                name: 'Set_A4'
            },
            {
                argsMemObj: [
                    {
                        address: -1,
                        name: 'addr1',
                        asmName: 'Set_A1_A2_addr1',
                        type: 'long',
                        scope: 'Set_A1_A2',
                        declaration: 'long',
                        size: 1,
                        isDeclared: true
                    },
                    {
                        address: -1,
                        name: 'addr2',
                        asmName: 'Set_A1_A2_addr2',
                        type: 'long',
                        scope: 'Set_A1_A2',
                        declaration: 'long',
                        size: 1,
                        isDeclared: true
                    }
                ],
                asmName: 'set_A1_A2',
                declaration: 'void',
                name: 'Set_A1_A2'
            },
            {
                argsMemObj: [
                    {
                        address: -1,
                        name: 'addr1',
                        asmName: 'Set_A3_A4_addr1',
                        type: 'long',
                        scope: 'Set_A3_A4',
                        declaration: 'long',
                        size: 1,
                        isDeclared: true
                    },
                    {
                        address: -1,
                        name: 'addr2',
                        asmName: 'Set_A3_A4_addr2',
                        type: 'long',
                        scope: 'Set_A3_A4',
                        declaration: 'long',
                        size: 1,
                        isDeclared: true
                    }
                ],
                asmName: 'set_A3_A4',
                declaration: 'void',
                name: 'Set_A3_A4'
            },
            {
                argsMemObj: [
                    {
                        address: -1,
                        name: 'addr',
                        asmName: 'Set_B1_addr',
                        type: 'long',
                        scope: 'Set_B1',
                        declaration: 'long',
                        size: 1,
                        isDeclared: true
                    }
                ],
                asmName: 'set_B1',
                declaration: 'void',
                name: 'Set_B1'
            },
            {
                argsMemObj: [
                    {
                        address: -1,
                        name: 'addr',
                        asmName: 'Set_B2_addr',
                        type: 'long',
                        scope: 'Set_B2',
                        declaration: 'long',
                        size: 1,
                        isDeclared: true
                    }
                ],
                asmName: 'set_B2',
                declaration: 'void',
                name: 'Set_B2'
            },
            {
                argsMemObj: [
                    {
                        address: -1,
                        name: 'addr',
                        asmName: 'Set_B3_addr',
                        type: 'long',
                        scope: 'Set_B3',
                        declaration: 'long',
                        size: 1,
                        isDeclared: true
                    }
                ],
                asmName: 'set_B3',
                declaration: 'void',
                name: 'Set_B3'
            },
            {
                argsMemObj: [
                    {
                        address: -1,
                        name: 'addr',
                        asmName: 'Set_B4_addr',
                        type: 'long',
                        scope: 'Set_B4',
                        declaration: 'long',
                        size: 1,
                        isDeclared: true
                    }
                ],
                asmName: 'set_B4',
                declaration: 'void',
                name: 'Set_B4'
            },
            {
                argsMemObj: [
                    {
                        address: -1,
                        name: 'addr1',
                        asmName: 'Set_B1_B2_addr1',
                        type: 'long',
                        scope: 'Set_B1_B2',
                        declaration: 'long',
                        size: 1,
                        isDeclared: true
                    },
                    {
                        address: -1,
                        name: 'addr2',
                        asmName: 'Set_B1_B2_addr2',
                        type: 'long',
                        scope: 'Set_B1_B2',
                        declaration: 'long',
                        size: 1,
                        isDeclared: true
                    }
                ],
                asmName: 'set_B1_B2',
                declaration: 'void',
                name: 'Set_B1_B2'
            },
            {
                argsMemObj: [
                    {
                        address: -1,
                        name: 'addr1',
                        asmName: 'Set_B3_B4_addr1',
                        type: 'long',
                        scope: 'Set_B3_B4',
                        declaration: 'long',
                        size: 1,
                        isDeclared: true
                    },
                    {
                        address: -1,
                        name: 'addr2',
                        asmName: 'Set_B3_B4_addr2',
                        type: 'long',
                        scope: 'Set_B3_B4',
                        declaration: 'long',
                        size: 1,
                        isDeclared: true
                    }
                ],
                asmName: 'set_B3_B4',
                declaration: 'void',
                name: 'Set_B3_B4'
            },
            {
                argsMemObj: [],
                asmName: 'clear_A',
                declaration: 'void',
                name: 'Clear_A'
            },
            {
                argsMemObj: [],
                asmName: 'clear_B',
                declaration: 'void',
                name: 'Clear_B'
            },
            {
                argsMemObj: [],
                asmName: 'clear_A_B',
                declaration: 'void',
                name: 'Clear_A_And_B'
            },
            {
                argsMemObj: [],
                asmName: 'copy_A_From_B',
                declaration: 'void',
                name: 'Copy_A_From_B'
            },
            {
                argsMemObj: [],
                asmName: 'copy_B_From_A',
                declaration: 'void',
                name: 'Copy_B_From_A'
            },
            {
                argsMemObj: [],
                asmName: 'check_A_Is_Zero',
                declaration: 'long',
                name: 'Check_A_Is_Zero'
            },
            {
                argsMemObj: [],
                asmName: 'check_B_Is_Zero',
                declaration: 'long',
                name: 'Check_B_Is_Zero'
            },
            {
                argsMemObj: [],
                asmName: 'check_A_equals_B',
                declaration: 'long',
                name: 'Check_A_Equals_B'
            },
            {
                argsMemObj: [],
                asmName: 'swap_A_and_B',
                declaration: 'void',
                name: 'Swap_A_and_B'
            },
            {
                argsMemObj: [],
                asmName: 'OR_A_with_B',
                declaration: 'void',
                name: 'OR_A_with_B'
            },
            {
                argsMemObj: [],
                asmName: 'OR_B_with_A',
                declaration: 'void',
                name: 'OR_B_with_A'
            },
            {
                argsMemObj: [],
                asmName: 'AND_A_with_B',
                declaration: 'void',
                name: 'AND_A_with_B'
            },
            {
                argsMemObj: [],
                asmName: 'AND_B_with_A',
                declaration: 'void',
                name: 'AND_B_with_A'
            },
            {
                argsMemObj: [],
                asmName: 'XOR_A_with_B',
                declaration: 'void',
                name: 'XOR_A_with_B'
            },
            {
                argsMemObj: [],
                asmName: 'XOR_B_with_A',
                declaration: 'void',
                name: 'XOR_B_with_A'
            },
            {
                argsMemObj: [],
                asmName: 'add_A_to_B',
                declaration: 'void',
                name: 'Add_A_To_B'
            },
            {
                argsMemObj: [],
                asmName: 'add_B_to_A',
                declaration: 'void',
                name: 'Add_B_To_A'
            },
            {
                argsMemObj: [],
                asmName: 'sub_A_from_B',
                declaration: 'void',
                name: 'Sub_A_From_B'
            },
            {
                argsMemObj: [],
                asmName: 'sub_B_from_A',
                declaration: 'void',
                name: 'Sub_B_From_A'
            },
            {
                argsMemObj: [],
                asmName: 'mul_A_by_B',
                declaration: 'void',
                name: 'Mul_A_By_B'
            },
            {
                argsMemObj: [],
                asmName: 'mul_B_by_A',
                declaration: 'void',
                name: 'Mul_B_By_A'
            },
            {
                argsMemObj: [],
                asmName: 'div_A_by_B',
                declaration: 'void',
                name: 'Div_A_By_B'
            },
            {
                argsMemObj: [],
                asmName: 'div_B_by_A',
                declaration: 'void',
                name: 'Div_B_By_A'
            },
            {
                argsMemObj: [],
                asmName: 'MD5_A_to_B',
                declaration: 'void',
                name: 'MD5_A_To_B'
            },
            {
                argsMemObj: [],
                asmName: 'check_MD5_A_with_B',
                declaration: 'long',
                name: 'Check_MD5_A_With_B'
            },
            {
                argsMemObj: [],
                asmName: 'HASH160_A_to_B',
                declaration: 'void',
                name: 'HASH160_A_To_B'
            },
            {
                argsMemObj: [],
                asmName: 'check_HASH160_A_with_B',
                declaration: 'long',
                name: 'Check_HASH160_A_With_B'
            },
            {
                argsMemObj: [],
                asmName: 'SHA256_A_to_B',
                declaration: 'void',
                name: 'SHA256_A_To_B'
            },
            {
                argsMemObj: [],
                asmName: 'check_SHA256_A_with_B',
                declaration: 'long',
                name: 'Check_SHA256_A_With_B'
            },
            {
                argsMemObj: [],
                asmName: 'get_Block_Timestamp',
                declaration: 'long',
                name: 'Get_Block_Timestamp'
            },
            {
                argsMemObj: [],
                asmName: 'get_Creation_Timestamp',
                declaration: 'long',
                name: 'Get_Creation_Timestamp'
            },
            {
                argsMemObj: [],
                asmName: 'get_Last_Block_Timestamp',
                declaration: 'long',
                name: 'Get_Last_Block_Timestamp'
            },
            {
                argsMemObj: [],
                asmName: 'put_Last_Block_Hash_In_A',
                declaration: 'void',
                name: 'Put_Last_Block_Hash_In_A'
            },
            {
                argsMemObj: [
                    {
                        address: -1,
                        name: 'addr',
                        asmName: 'A_To_Tx_After_Timestamp_addr',
                        type: 'long',
                        scope: 'A_To_Tx_After_Timestamp',
                        declaration: 'long',
                        size: 1,
                        isDeclared: true
                    }
                ],
                asmName: 'A_to_Tx_after_Timestamp',
                declaration: 'void',
                name: 'A_To_Tx_After_Timestamp'
            },
            {
                argsMemObj: [],
                asmName: 'get_Type_for_Tx_in_A',
                declaration: 'long',
                name: 'Get_Type_For_Tx_In_A'
            },
            {
                argsMemObj: [],
                asmName: 'get_Amount_for_Tx_in_A',
                declaration: 'long',
                name: 'Get_Amount_For_Tx_In_A'
            },
            {
                argsMemObj: [],
                asmName: 'get_Timestamp_for_Tx_in_A',
                declaration: 'long',
                name: 'Get_Timestamp_For_Tx_In_A'
            },
            {
                argsMemObj: [],
                asmName: 'get_Ticket_Id_for_Tx_in_A',
                declaration: 'long',
                name: 'Get_Random_Id_For_Tx_In_A'
            },
            {
                argsMemObj: [],
                asmName: 'message_from_Tx_in_A_to_B',
                declaration: 'void',
                name: 'Message_From_Tx_In_A_To_B'
            },
            {
                argsMemObj: [],
                asmName: 'B_to_Address_of_Tx_in_A',
                declaration: 'void',
                name: 'B_To_Address_Of_Tx_In_A'
            },
            {
                argsMemObj: [],
                asmName: 'B_to_Address_of_Creator',
                declaration: 'void',
                name: 'B_To_Address_Of_Creator'
            },
            {
                argsMemObj: [],
                asmName: 'get_Current_Balance',
                declaration: 'long',
                name: 'Get_Current_Balance'
            },
            {
                argsMemObj: [],
                asmName: 'get_Previous_Balance',
                declaration: 'long',
                name: 'Get_Previous_Balance'
            },
            {
                argsMemObj: [
                    {
                        address: -1,
                        name: 'addr',
                        asmName: 'Send_To_Address_In_B_addr',
                        type: 'long',
                        scope: 'Send_To_Address_In_B',
                        declaration: 'long',
                        size: 1,
                        isDeclared: true
                    }
                ],
                asmName: 'send_to_Address_in_B',
                declaration: 'void',
                name: 'Send_To_Address_In_B'
            },
            {
                argsMemObj: [],
                asmName: 'send_All_to_Address_in_B',
                declaration: 'void',
                name: 'Send_All_To_Address_In_B'
            },
            {
                argsMemObj: [],
                asmName: 'send_Old_to_Address_in_B',
                declaration: 'void',
                name: 'Send_Old_To_Address_In_B'
            },
            {
                argsMemObj: [],
                asmName: 'send_A_to_Address_in_B',
                declaration: 'void',
                name: 'Send_A_To_Address_In_B'
            },
            {
                argsMemObj: [
                    {
                        address: -1,
                        name: 'addr2',
                        asmName: 'Add_Minutes_To_Timestamp_addr2',
                        type: 'long',
                        scope: 'Add_Minutes_To_Timestamp',
                        declaration: 'long',
                        size: 1,
                        isDeclared: true
                    },
                    {
                        address: -1,
                        name: 'addr3',
                        asmName: 'Add_Minutes_To_Timestamp_addr3',
                        type: 'long',
                        scope: 'Add_Minutes_To_Timestamp',
                        declaration: 'long',
                        size: 1,
                        isDeclared: true
                    }
                ],
                asmName: 'add_Minutes_to_Timestamp',
                declaration: 'long',
                name: 'Add_Minutes_To_Timestamp'
            }
        ]
    }

    return shapeMain()
}
