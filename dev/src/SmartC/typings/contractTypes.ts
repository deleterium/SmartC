import { DECLARATION_TYPES, MEMORY_SLOT, SENTENCES, TOKEN, TYPE_DEFINITIONS } from './syntaxTypes'

export interface SC_CONFIG {
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
    /** User stack pages to be available: #program userStackPages */
    PUserStackPages: number,
    /** Code stack pages to be available:: #program codeStackPages */
    PCodeStackPages: number,
    /** Adds a comment in generated assembly code with the respective C source code line number  */
    outputSourceLineNumber: boolean,
}

export interface SC_MACRO {
    /** pragma, program or include */
    type: string
    /** Macro property, only one word */
    property: string
    /** Macro value, allowed many words */
    value: string
    line: number
}

export interface SC_FUNCTION {
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
    /** Definitive sentences for function block. Not used on API Functions */
    sentences?: SENTENCES[]
    /** Line number of function declaration */
    line?: number
    /** Assembly name for API Functions only */
    asmName?: string
}

export interface SC_GLOBAL {
    /** Definitions for API functions */
    APIFunctions: SC_FUNCTION[]
    /** macros values */
    macros: SC_MACRO[]
    /** Temporary, holding tokens objects */
    code?: TOKEN[]
    /** Definitive structure for compilation */
    sentences: SENTENCES[]
}

export interface CONTRACT {
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
}

export interface MACHINE_OBJECT {
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
    /** Program name */
    PName: string
    /** Program description */
    PDescription: string
    /** Program activation amount */
    PActivationAmount: string
}
