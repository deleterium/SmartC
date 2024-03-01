export type HEX_CONTENT = number | bigint | string

export type CONSTANT_CONTENT = {
    value: HEX_CONTENT
    declaration: 'long' | 'fixed'
}

/** Allowed token types. 'PreToken' type only in first phase (not recursive). */
export type TOKEN_TYPES = 'Variable' | 'Constant' | 'Operator' | 'UnaryOperator' |
'SetUnaryOperator' | 'Assignment'| 'SetOperator'|'Comparision'|'CheckOperator'|
'Arr'|'CodeCave'|'CodeDomain'|'Delimiter'|'Terminator'|'Macro'|'Member'|'Colon'|
'Keyword'|'Function' | 'APICall' | 'BuiltInCall' | 'Push' | 'PreToken'

export type DECLARATION_TYPES = 'void' | 'long' | 'fixed' | 'struct' | 'void_ptr' | 'long_ptr' | 'fixed_ptr' | 'struct_ptr' | ''

export interface PRE_TOKEN {
    /** Line follows the scheme 'line:column' or '0:0' if unknown */
    line: string
    precedence: number
    type: TOKEN_TYPES
    /** Empty string for Arr, CodeCave, CodeDomain */
    value: string
    /** Only applicable to types: asm, break, continue, constant, struct or label */
    extValue?: string
}

export interface TOKEN extends PRE_TOKEN {
    declaration?: DECLARATION_TYPES
    /** Only applicable to Arr, CodeCave, CodeDomain, Variable with modifier */
    params?: TOKEN[]
}

export type MEMORY_BASE_TYPES = 'register' | 'long' | 'fixed' | 'constant' | 'struct' | 'structRef' | 'array' | 'label' | 'void'

/** If constant, it is the number to shift. If variable, it is the address containing the value to shift.
 * Stores information about variable it is pointing to.
 */
export type OFFSET_MODIFIER_CONSTANT = {
    type: 'constant',
    value: number,
    declaration: DECLARATION_TYPES,
    typeDefinition?: string
}
export type OFFSET_MODIFIER_VARIABLE = {
    type: 'variable',
    addr: number,
    declaration: DECLARATION_TYPES,
    typeDefinition?: string
}
export type OFFSET_MODIFIER = OFFSET_MODIFIER_CONSTANT | OFFSET_MODIFIER_VARIABLE

export type MEMORY_SLOT = {
    /** Variable base types: 'register' | 'long' | 'constant' | 'struct' | 'structRef' | 'array' | 'label' | 'void' */
    type: MEMORY_BASE_TYPES
    /** Variable name in assembly code */
    asmName: string
    /** Controls if variable was already defined an can be used. */
    isDeclared: boolean
    /** Variable type during declaration */
    declaration: DECLARATION_TYPES
    /** Control warning if using variables before setting it. */
    isSet: boolean
    /** Control if a specific register to be used in this variable */
    toBeRegister: boolean
    /** Offset in memory. -1 if this slot is not in memory */
    address: number
    /** Variable name */
    name: string
    /** Variable scope */
    scope: string
    /** Line of declaration */
    line: string
    /** Variable size in longs */
    size: number
    /** struct type definition OR array type definition  */
    typeDefinition?: string
    /** For constants: content */
    hexContent?: string
    /** Info about items of array. */
    ArrayItem?: {
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
export type AST = UNARY_ASN | BINARY_ASN | NULL_ASN | END_ASN | LOOKUP_ASN | EXCEPTION_ASN | SWITCH_ASN

export type UNARY_ASN = {
    /** Unary Abstract Syntax Node */
    type: 'unaryASN'
    /** Unary operator token */
    Operation: TOKEN
    /** Continuation of AST */
    Center: AST
}
export type BINARY_ASN = {
    /** Binary Abstract Syntax Node */
    type: 'binaryASN'
    /** Binary operator token */
    Operation: TOKEN
    /** Left side AST */
    Left: AST
    /** Right side AST */
    Right: AST
}

export type NULL_ASN = {
    /** End Abstract Syntax Node */
    type: 'nullASN'
}

export type END_ASN = {
    /** End Abstract Syntax Node */
    type: 'endASN'
    /** End token. May be undefined, but most of times this situation leads to error. */
    Token: TOKEN
}
export type TOKEN_MODIFIER_ARRAY = {type: 'Array', Center: AST}
export type TOKEN_MODIFIER_MEMBER = {type: 'MemberByVal'|'MemberByRef', Center: TOKEN}
export type TOKEN_MODIFIER = TOKEN_MODIFIER_ARRAY | TOKEN_MODIFIER_MEMBER

export type LOOKUP_ASN = {
    /** Abstract Syntax Node for variables with modifiers to be evaluated in chain  */
    type: 'lookupASN'
    /** End token with type == 'Variable' or 'Function' */
    Token: TOKEN
    /** Function arguments AST */
    FunctionArgs?: AST
    /** Value modifiers like Arr or Members */
    modifiers: TOKEN_MODIFIER[]
}
export type EXCEPTION_ASN = {
    /** exception Abstract Syntax Node. Used for SetUnaryOperator */
    type: 'exceptionASN'
    /** Binary operator token. Currently only SetUnaryOperator */
    Operation: TOKEN
    /** Left side AST. Indicating pre-increment or pre-decrement */
    Left?: AST
    /** Rigth side AST. Indicating post-increment or post-decrement */
    Right?: AST
}
export type SWITCH_ASN = {
    /** Abstract Syntax Node for switch statements that will be evaluated for jump table.  */
    type: 'switchASN'
    /** switch expression part */
    Expression: AST
    /** One item for each case statement in switch block */
    caseConditions: AST[]
}

// eslint-disable-next-line no-use-before-define
export type SENTENCES = SENTENCE_PHRASE | SENTENCE_IF_ENDIF | SENTENCE_IF_ELSE | SENTENCE_WHILE | SENTENCE_DO | SENTENCE_FOR | SENTENCE_STRUCT | SENTENCE_SWITCH | SENTENCE_CASE | SENTENCE_DEFAULT | SENTENCE_LABEL | SENTENCE_SCOPE
export type SENTENCE_PHRASE = {
    type: 'phrase'
    /** phrase starting location ('line:column' scheme) */
    line: string
    /** Array of tokens, recursive on Arr, Codecave and CodeDomain */
    code?: TOKEN[]
    /** Tokens organized in an AST */
    CodeAST?: AST
}
export type SENTENCE_IF_ENDIF = {
    type: 'ifEndif'
    id: string
    line: string
    condition?: TOKEN[]
    /** Tokens organized in an AST */
    ConditionAST?: AST
    trueBlock: SENTENCES[]
}
export type SENTENCE_IF_ELSE = {
    type: 'ifElse'
    id: string
    line: string
    condition?: TOKEN[]
    ConditionAST?: AST
    trueBlock: SENTENCES[]
    falseBlock: SENTENCES[]
}
export type SENTENCE_WHILE = {
    type: 'while'
    id: string
    line: string
    condition?: TOKEN[]
    ConditionAST?: AST
    trueBlock: SENTENCES[]
}
export type SENTENCE_DO = {
    type: 'do'
    id: string
    line: string
    condition?: TOKEN[]
    ConditionAST?: AST
    trueBlock: SENTENCES[]
}
export type SENTENCE_FOR = {
    type: 'for'
    id: string
    line: string
    threeSentences: SENTENCE_PHRASE[]
    trueBlock: SENTENCES[]
}
export type SENTENCE_STRUCT = {
    type: 'struct',
    line: string,
    name: string,
    members: SENTENCES[],
    Phrase: SENTENCE_PHRASE
}
export type SENTENCE_CASE = {
    type: 'case'
    line: string
    caseId: string
    condition?: TOKEN[]
}
export type SENTENCE_DEFAULT = {
    type: 'default'
    line: string
}
export type SENTENCE_SWITCH = {
    type: 'switch'
    line: string
    expression?: TOKEN[]
    cases?: TOKEN[][]
    hasDefault: boolean
    block: SENTENCES[]
    JumpTable?: SWITCH_ASN
}
export type SENTENCE_LABEL = {
    type: 'label'
    line: string
    id: string
}
export type SENTENCE_SCOPE = {
    type: 'scope'
    id: string
    line: string
    ConditionAST?: AST
    alwaysBlock: SENTENCES[]
}

export type STRUCT_TYPE_DEFINITION = {
    type: 'struct',
    name: string,
    structMembers: MEMORY_SLOT[],
    structAccumulatedSize: [string, number][],
    MemoryTemplate: MEMORY_SLOT
}
export type ARRAY_TYPE_DEFINITION = {
    type: 'array'
    name: string
    arrayDimensions: number[]
    arrayMultiplierDim: number[]
    MemoryTemplate: MEMORY_SLOT
}
export type REGISTER_TYPE_DEFINITION = {
    type: 'register'
    name: '',
    MemoryTemplate: MEMORY_SLOT
}
export type LONG_TYPE_DEFINITION = {
    type: 'long'
    name: '',
    MemoryTemplate: MEMORY_SLOT
}
export type FIXED_TYPE_DEFINITION = {
    type: 'fixed'
    name: '',
    MemoryTemplate: MEMORY_SLOT
}
export type TYPE_DEFINITIONS = STRUCT_TYPE_DEFINITION | ARRAY_TYPE_DEFINITION | REGISTER_TYPE_DEFINITION | LONG_TYPE_DEFINITION | FIXED_TYPE_DEFINITION

export type BUILTIN_TYPES = 'loop'|'receive'|'send'|'blockchain'|'contract'|'maps'|'fourArgsPlus'|'assets'|'special'|'internal'
