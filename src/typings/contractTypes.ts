import { DECLARATION_TYPES, MEMORY_SLOT, SENTENCES, TOKEN, TYPE_DEFINITIONS } from './syntaxTypes'

export type SC_CONFIG = {
    /** Hardcoded compiler version!!! */
    compilerVersion: string,
    /** Number of auxiliary vars to be declared by compiler: #pragma maxAuxVars */
    maxAuxVars: number,
    /** Number of auxiliary Constants to be declared by compiler: #pragma maxConstVars */
    maxConstVars: number,
    /** Make final global optimization: #pragma optimizationLevel */
    optimizationLevel: number,
    /** Try to reuse variable at left side of assigment: #pragma reuseAssignedVar */
    reuseAssignedVar: boolean,
    /** Support for API Functions: #include APIFunctions */
    APIFunctions: boolean,
    /** Support for API Functions with fixed numbers: #include fixedAPIFunctions */
    fixedAPIFunctions: boolean,
    /** Program Name: #program name */
    PName: string,
    /** Program description: #program description */
    PDescription: string,
    /** Program activationAmount: #program activationAmount */
    PActivationAmount: string,
    /** Program creator: Used only in SC-Simulator. Ignored in machine code output. */
    PCreator: string,
    /** Program contract ID: Used only in SC-Simulator. Ignored in machine code output. */
    PContract: string,
    /** User stack pages to be available: #program userStackPages */
    PUserStackPages: number,
    /** Code stack pages to be available:: #program codeStackPages */
    PCodeStackPages: number,
    /** Machine code hash id to be matched during compilation: #program codeHashId */
    PCodeHashId: string,
    /** Adds a comment in generated assembly code with source code line number and content */
    verboseAssembly: boolean,
}

export type SC_MACRO = {
    /** pragma, program or include */
    type: string
    /** Macro property, only one word */
    property: string
    /** Macro value, allowed many words */
    value: string
    line: number
}

export type SC_FUNCTION = {
    /** type of function declaration */
    declaration: DECLARATION_TYPES
    /** type definition if is a struct function */
    typeDefinition?: string
    /** Function name */
    name: string
    /** Temporary, holding function arguments tokens */
    arguments?: TOKEN[]
    /** Variables of function arguments */
    argsMemObj: MEMORY_SLOT[]
    /** Temporary, holding function block tokens */
    code?: TOKEN[]
    /** Definitive sentences for function block. */
    sentences: SENTENCES[]
    /** Line number of function declaration */
    line?: number
    /** Assembly name for API Functions only */
    asmName?: string
}

export type SC_GLOBAL = {
    /** Definitions for Built-In functions */
    BuiltInFunctions: SC_FUNCTION[]
    /** Definitions for API functions */
    APIFunctions: SC_FUNCTION[]
    /** macros values */
    macros: SC_MACRO[]
    /** Temporary, holding tokens objects */
    code?: TOKEN[]
    /** Definitive structure for compilation */
    sentences: SENTENCES[]
}

export type CONTRACT = {
    /** Source code splitted by lines */
    sourceLines: string[],
    /** Global statements and information */
    Global: SC_GLOBAL,
    /** Declared functions */
    functions: SC_FUNCTION[],
    /** Variables, constants and labels in memory */
    memory: MEMORY_SLOT[],
    /** Extended information for arrays and structs */
    typesDefinitions: TYPE_DEFINITIONS[],
    /** Compiler configurations */
    Config: SC_CONFIG,
    /** Compilation warnings */
    warnings: string[],
}

export type MACHINE_OBJECT = {
    /** Warnings found */
    Warnings: string
    /** Number of data pages (Memory size) */
    DataPages: number
    /** Number of code stack pages (code stack size) */
    CodeStackPages: number
    /** Number of user stack pages (user stack size) */
    UserStackPages: number
    /** Number of machine instructions pages */
    CodePages: number
    /** Calculated minimum fee for contract deployment */
    MinimumFeeNQT: string
    /** Hex string with contract machine code */
    ByteCode: string
    /** Hash ID for compiled machine code */
    MachineCodeHashId: string
    /** Hex string with contract starting memory values */
    ByteData: string
    /** Array with variables names ordered in memory */
    Memory: string[]
    /** Array with labels and their addresses (not ordered) */
    Labels: {
        label: string
        address: number
    }[]
    /** Program assembly source code */
    AssemblyCode: string
    /** Program name */
    PName: string
    /** Program description */
    PDescription: string
    /** Program activation amount */
    PActivationAmount: string
}
