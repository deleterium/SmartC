export interface PRE_TOKEN {
    line: number
    type: string
    value: string
    /** Applicable for asm and struct tokens */
    extValue?: string
}

/** Allowed token types */
export type TOKEN_TYPES = 'Variable' | 'Constant' | 'Operator' | 'UnaryOperator' |
'SetUnaryOperator' | 'Assignment'| 'SetOperator'|'Comparision'|'CheckOperator'|
'Arr'|'CodeCave'|'CodeDomain'|'Delimiter'|'Terminator'|'Macro'|'Member'|'Colon'|
'Keyword'|'Function' | 'APICall' | 'Push'

export type DECLARATION_TYPES = 'void' | 'long' | 'struct' | 'void_ptr' | 'long_ptr' | 'struct_ptr' | ''

export interface TOKEN {
    line: number
    precedence: number
    type: TOKEN_TYPES
    declaration?: DECLARATION_TYPES
    /** Empty string for Arr, CodeCave, CodeDomain */
    value: string
    /** Only applicable to Arr, CodeCave, CodeDomain, Variable with modifier */
    params?: TOKEN[]
    /** Only applicable to types: asm, break, continue, struct or label */
    extValue?: string
}

export type MEMORY_BASE_TYPES = 'register' | 'long' | 'constant' | 'struct' | 'structRef' | 'array' | 'label' | 'void'

/** If constant, it is the number to shift. If variable, it is the address containing the value to shift.
 * Stores information about variable it is pointing to.
 */
export type OFFSET_MODIFIER = { type: 'constant', value: number, declaration: DECLARATION_TYPES, typeDefinition?: string } |
    { type: 'variable', addr: number, declaration: DECLARATION_TYPES, typeDefinition?: string }

export interface MEMORY_SLOT {
    /** Variable base types: 'register' | 'long' | 'constant' | 'struct' | 'structRef' | 'array' | 'label' | 'void' */
    type: MEMORY_BASE_TYPES
    /** Variable name in assembly code */
    asmName: string
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
    /** Info about items of array. */
    arrItem?: {
        /** item base type */
        type: MEMORY_BASE_TYPES,
        /** item base declaration */
        declaration: DECLARATION_TYPES,
        /** Item type definion (for structs) */
        typeDefinition?: string,
        /** Item total size */
        totalSize: number
    }
    /** Indicates to apply a shift to this memory address. Value must be deferenced to be evaluated. */
    Offset?: OFFSET_MODIFIER
}

// eslint-disable-next-line no-use-before-define
export type AST = UNARY_ASN | BINARY_ASN | NULL_ASN | END_ASN | LOOKUP_ASN | EXCEPTION_ASN

export interface UNARY_ASN {
    /** Unary Abstract Syntax Node */
    type: 'unaryASN'
    /** Unary operator token */
    Operation: TOKEN
    /** Continuation of AST */
    Center: AST
}
export interface BINARY_ASN {
    /** Binary Abstract Syntax Node */
    type: 'binaryASN'
    /** Binary operator token */
    Operation: TOKEN
    /** Left side AST */
    Left: AST
    /** Right side AST */
    Right: AST
}

export interface NULL_ASN {
    /** End Abstract Syntax Node */
    type: 'nullASN'
}

export interface END_ASN {
    /** End Abstract Syntax Node */
    type: 'endASN'
    /** End token. May be undefined, but most of times this situation leads to error. */
    Token: TOKEN
}
export type TOKEN_MODIFIER = {type: 'Array', Center: AST} | {type: 'MemberByVal', Center: TOKEN} | {type: 'MemberByRef', Center: TOKEN}

export interface LOOKUP_ASN {
    /** Abstract Syntax Node for variables with modifiers to be evaluated in chain  */
    type: 'lookupASN'
    /** End token with type == 'Variable' or 'Function' */
    Token: TOKEN
    /** Function arguments AST */
    FunctionArgs?: AST
    /** Value modifiers like Arr or Members */
    modifiers: TOKEN_MODIFIER[]
}
export interface EXCEPTION_ASN {
    /** exception Abstract Syntax Node. Used for SetUnaryOperator */
    type: 'exceptionASN'
    /** Binary operator token. Currently only SetUnaryOperator */
    Operation: TOKEN
    /** Left side AST. Indicating pre-increment or pre-decrement */
    Left?: AST
    /** Rigth side AST. Indicating post-increment or post-decrement */
    Right?: AST
}

// eslint-disable-next-line no-use-before-define
export type SENTENCES = SENTENCE_PHRASE | SENTENCE_IF_ENDIF | SENTENCE_IF_ELSE | SENTENCE_WHILE | SENTENCE_DO | SENTENCE_FOR | SENTENCE_STRUCT
export interface SENTENCE_PHRASE {
    type: 'phrase'
    /** phrase starting line number */
    line: number
    /** Array of tokens, recursive on Arr, Codecave and CodeDomain */
    code?: TOKEN[]
    /** Tokens organized in an AST */
    CodeAST?: AST
}
export interface SENTENCE_IF_ENDIF {
    type: 'ifEndif'
    id: string
    line: number
    condition?: TOKEN[]
    /** Tokens organized in an AST */
    ConditionAST?: AST
    trueBlock: SENTENCES[]
}
export interface SENTENCE_IF_ELSE {
    type: 'ifElse'
    id: string
    line: number
    condition?: TOKEN[]
    ConditionAST?: AST
    trueBlock: SENTENCES[]
    falseBlock: SENTENCES[]
}
export interface SENTENCE_WHILE {
    type: 'while'
    id: string
    line: number
    condition?: TOKEN[]
    ConditionAST?: AST
    trueBlock: SENTENCES[]
}
export interface SENTENCE_DO {
    type: 'do'
    id: string
    line: number
    condition?: TOKEN[]
    ConditionAST?: AST
    trueBlock: SENTENCES[]
}
export interface SENTENCE_FOR {
    type: 'for'
    id: string
    line: number
    threeSentences: SENTENCE_PHRASE[]
    trueBlock: SENTENCES[]
}
export interface SENTENCE_STRUCT {
    type: 'struct',
    line: number,
    name: string,
    members: SENTENCES[],
    Phrase: SENTENCE_PHRASE
}

export interface STRUCT_TYPE_DEFINITION {
    type: 'struct',
    name: string,
    structMembers: MEMORY_SLOT[],
    structAccumulatedSize: [string, number][],
    MemoryTemplate: MEMORY_SLOT
}
export interface ARRAY_TYPE_DEFINITION {
    type: 'array'
    name: string
    arrayDimensions: number[]
    arrayMultiplierDim: number[]
    MemoryTemplate: MEMORY_SLOT
}
export interface REGISTER_TYPE_DEFINITION {
    type: 'register'
    name: '',
    MemoryTemplate: MEMORY_SLOT
}
export interface LONG_TYPE_DEFINITION {
    type: 'long'
    name: '',
    MemoryTemplate: MEMORY_SLOT
}
export type TYPE_DEFINITIONS = STRUCT_TYPE_DEFINITION | ARRAY_TYPE_DEFINITION | REGISTER_TYPE_DEFINITION | LONG_TYPE_DEFINITION
