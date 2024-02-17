import { CONTRACT, SC_FUNCTION } from '../typings/contractTypes'
import { AST, DECLARATION_TYPES, MEMORY_SLOT } from '../typings/syntaxTypes'

export type GLOBAL_AUXVARS = {
    /** Holds incoming program. To be read-only */
    Program: CONTRACT
    /** Stack saving loops IDs */
    latestLoopId: string[]
    /** Auto incrementing index for labels generation */
    jumpId: number
    /** Assembly code being created */
    assemblyCode: string
    /** Errors found */
    errors: string
    /** Current function being processed */
    currFunctionIndex: number
    /** Line counter for source code */
    currSourceLine: number
    /** Handle register allocation and liberation in each scope */
    scopedRegisters: string[]
    /** Get a new jump id according to current Configs (global scope) */
    getNewJumpID(): string
    /** Query the value of last loop id */
    getLatestLoopID(): string
    /** Query the value of last loop id that is a pure loop (excluding 'switch' ids) */
    getLatestPureLoopID(): string
    /** Helper for debugger to know what are the free registers. */
    printFreeRegisters(): void
    /** Operations to start a new scope for registers */
    startScope(arg :string): void
    /** Operations to close a scope for registers */
    stopScope(arg :string): void
}

export type SETUPGENCODE_ARGS = {
    InitialAST?: AST
    initialJumpTarget?: string
    initialJumpNotTarget?:string
    initialIsReversedLogic?: boolean
}

export type GENCODE_ARGS = {
    /** AST to traverse */
    RemAST: AST,
    /** true if wanted return object to be suitable for logical operations */
    logicalOp: boolean,
    /** true if wanted to reverse logic for logical operations */
    revLogic: boolean,
    /** Label to jump if logical operation is false */
    jumpFalse?: string,
    /** Label to jump if logical operatio is true */
    jumpTrue?: string
}

export type GENCODE_AUXVARS = {
    /** Current function, or undefined if Global code */
    CurrentFunction: SC_FUNCTION | undefined
    /** Program memory that will be used and (and property isDeclared can be modified) by codeGenerator */
    memory: MEMORY_SLOT[]
    /** Auxiliary variables used as registers */
    registerInfo: {
        inUse: boolean
        Template: MEMORY_SLOT
    }[]
    /** Auto incrementing index for labels generation in genCode scope */
    jumpId: number
    /** Post increment or decrement that shall be included at last */
    postOperations: string
    /** Flag to inform lower level AST that it is declaration sentence */
    isDeclaration: DECLARATION_TYPES
    /** Flag to inform lower level AST that it is left side of assignment */
    isLeftSideOfAssignment: boolean
    /** Flag to inform lower level AST that it is const declaration sentence */
    isConstSentence: boolean
    /** Flag to inform lower level AST that it is register declaration sentence */
    isRegisterSentence: boolean
    /** Flag to inform lower level AST that there are an void array assignment */
    hasVoidArray: boolean
    /** Warnings found */
    warnings: string[]
    scopedRegisters: string[]
    /** Verifies if a variable at loc address is register or temporary reused var */
    isTemp(loc: number): boolean
    /** Get a new register variable */
    getNewRegister(line?: string): MEMORY_SLOT
    /** Informs that variable at loc address can be free */
    freeRegister(loc: number | undefined): void
    /** Get all post operations and clear its value */
    getPostOperations(): string
    /**
     * Search and return a copy of memory object with name varname.
     * Object can be global or local function scope.
     * if not found, throws exception with line number. Also sets 'isDeclared'
     * to manage use of undeclared variables.
     */
    getMemoryObjectByName (varName: string, line?: string, varDeclaration?: DECLARATION_TYPES): MEMORY_SLOT
    /**
     * Search and return a copy of memory object in addres 'loc'.
     * Object can be global or local function scope.
     * if not found, throws exception with line number.
     */
    getMemoryObjectByLocation (loc: number|bigint|string, line?: string): MEMORY_SLOT
    /** Get a new jump id according to current Configs (genCode scope) */
    getNewJumpID(): string
}

export type GENCODE_SOLVED_OBJECT = {
    /** Memory object representing solved AST */
    SolvedMem: MEMORY_SLOT
    /** Assembly sourcecode needed to solve AST */
    asmCode: string
}

export type FLATTEN_MEMORY_RETURN_OBJECT = {
    FlatMem: MEMORY_SLOT
    asmCode: string
    isNew: boolean
}
