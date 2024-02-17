import { assertNotUndefined, isDeclarationType } from '../repository/repository'
import { AST, LOOKUP_ASN, TOKEN } from '../typings/syntaxTypes'

/**
 * Traverse an array of tokens to create a real AST based on
 * simple operations. Uses precedence values to decide the operations order.
 */
export default function createTree (tokenArray: TOKEN[] | undefined): AST {
    const tokenToAst = assertNotUndefined(tokenArray,
        'Internal error. Undefined AST to create syntactic tree')
    if (tokenToAst.length === 0) {
        return { type: 'nullASN' }
    }
    const needle = findSplitTokenIndex(tokenToAst)
    switch (tokenToAst[needle].type) {
    case 'Constant':
        return ConstantToAST(tokenToAst)
    case 'Variable':
        return VariableToAST(tokenToAst)
    case 'CodeCave':
        return CodeCaveToAST(tokenToAst)
    case 'Operator':
    case 'Assignment':
    case 'SetOperator':
    case 'Comparision':
    case 'Delimiter':
        return BinariesToAST(tokenToAst, needle)
    case 'Keyword':
        return KeywordToAST(tokenToAst, needle)
    case 'UnaryOperator':
        return UnaryOperatorToAST(tokenToAst, needle)
    case 'SetUnaryOperator':
        if (needle === 0) {
            return preSetUnaryToAST(tokenToAst)
        }
        if (needle === tokenToAst.length - 1) {
            return postSetUnaryToAST(tokenToAst)
        }
        throw new Error(`At line: ${tokenToAst[needle].line}.` +
        ` Invalid use of 'SetUnaryOperator' '${tokenToAst[needle].value}'.`)
    default:
        // Never
        throw new Error(`Internal error at line: ${tokenToAst[0].line}.` +
        ` Token '${tokenToAst[0].type}' with value '${tokenToAst[0].value}' does not match any syntax rules.`)
    }
}

/** Finds the position for the next split position. */
function findSplitTokenIndex (tokens: TOKEN[]) : number {
    const precedenceOnly = tokens.map(tok => tok.precedence)
    const maxPrecedence = Math.max(...precedenceOnly)
    switch (maxPrecedence) {
    case 0:
        // Precedence zero is handled in lookupASN
        // inside VariableToAST.
        return 0
    case 12:
    case 10:
    case 2:
        // Right to left associativity for
        // 12) Terminator, semi, keywords
        // 10) Assignment operators
        //  2) Unary operators
        return precedenceOnly.indexOf(maxPrecedence)
    default:
        // Left to right associativity for others
        return precedenceOnly.lastIndexOf(maxPrecedence)
    }
}

function ConstantToAST (tokens: TOKEN[]) : AST {
    if (tokens.length !== 1) {
        throw new Error(`At line: ${tokens[0].line}. Constants cannot have modifiers.`)
    }
    return { type: 'endASN', Token: tokens[0] }
}

function VariableToAST (tokens: TOKEN[]) : AST {
    if (tokens.length === 1) {
        return { type: 'endASN', Token: tokens[0] }
    }
    // We have a combination for structs and/or arrays.
    let idx = 1
    if (tokens[1].type === 'Function') {
        // Stores function name at extValue
        tokens[1].extValue = tokens[0].value
        idx++
    }
    const retNode: LOOKUP_ASN = {
        type: 'lookupASN',
        Token: tokens[idx - 1],
        modifiers: []
    }
    if (retNode.Token.type === 'Function') {
        retNode.FunctionArgs = createTree(retNode.Token.params)
        delete retNode.Token.params
    }

    for (; idx < tokens.length; idx++) {
        switch (tokens[idx].type) {
        case 'Arr':
            retNode.modifiers.push({
                type: 'Array',
                Center: createTree(tokens[idx].params)
            })
            break
        case 'Member':
            if (tokens[idx + 1]?.type === 'Variable') {
                break
            }
            throw new Error(`At line: ${tokens[idx].line}.` +
            ` Expecting a variable for '${tokens[idx].value}' modifier.`)
        case 'Variable':
            if (tokens[idx - 1].type !== 'Member') {
                throw new Error(`At line: ${tokens[idx].line}.` +
                ` Probable missing ';'. Expecting a member modifier before '${tokens[idx].value}'.`)
            }

            if (tokens[idx - 1].value === '.') {
                retNode.modifiers.push({
                    type: 'MemberByVal',
                    Center: tokens[idx]
                })
                break
            }
            retNode.modifiers.push({
                type: 'MemberByRef',
                Center: tokens[idx]
            })
            break
        default:
            throw new Error(`At line: ${tokens[idx].line}.` +
            ` Probable missing ';'. Invalid type of variable modifier: '${tokens[idx].type}'.`)
        }
    }
    return retNode
}

function CodeCaveToAST (tokens: TOKEN[]) : AST {
    if (tokens.length === 1) {
        const newAST = createTree(tokens[0].params)
        delete tokens[0].params
        return newAST
    }
    if (tokens[0].params === undefined) {
        return createTree(tokens.slice(1))
    }
    if (tokens.length === 2) {
        const remainingAST = createTree(tokens.slice(1))
        const askedType = tokens[0].params.reduce((previous, Tkn) => {
            // Get declaration for type casting from params!
            if (Tkn.type === 'Keyword') return previous + Tkn.value
            if (Tkn.value === '*') return previous + '_ptr'
            throw new Error(`At line: ${tokens[0].line}. Unexpected '${Tkn.type}' with value '${Tkn.value}' during type casting.`)
        }, '')
        if (!isDeclarationType(askedType)) {
            throw new Error(`At line: ${tokens[0].line}. Unexpected declaration '${askedType}' during type casting.`)
        }
        if (askedType === 'struct') {
            throw new Error(`At line: ${tokens[0].line}. 'struct' is not allowed for type casting.`)
        }
        tokens[0].declaration = askedType
        delete tokens[0].params
        return {
            type: 'unaryASN',
            Operation: tokens[0],
            Center: remainingAST
        }
    }
    throw new Error(`At line: ${tokens[0].line}. Modifiers not implemented on '${tokens[0].type}'.`)
}

function BinariesToAST (tokens: TOKEN[], operatorLoc: number) : AST {
    if (operatorLoc === 0) {
        throw new Error(`At line: ${tokens[0].line}.` +
        ` Missing left value for binary operator '${tokens[operatorLoc].value}'.`)
    }
    if (operatorLoc === tokens.length - 1) {
        throw new Error(`At line: ${tokens[0].line}.` +
        ` Missing right value for binary operator '${tokens[operatorLoc].value}'.`)
    }
    return {
        type: 'binaryASN',
        Left: createTree(tokens.slice(0, operatorLoc)),
        Operation: tokens[operatorLoc],
        Right: createTree(tokens.slice(operatorLoc + 1))
    }
}

function KeywordToAST (tokens: TOKEN[], keywordLoc: number) : AST {
    if (keywordLoc !== 0) {
        throw new Error(`At line: ${tokens[keywordLoc].line}.` +
        ` Probable missing ';' before keyword ${tokens[keywordLoc].value}.`)
    }
    switch (tokens[0].value) {
    case 'goto':
    case 'const':
    case 'sizeof':
        if (tokens.length === 1) {
            throw new Error(`At line: ${tokens[0].line}. Missing arguments for keyword '${tokens[0].value}'.`)
        }
        return {
            type: 'unaryASN',
            Operation: tokens[0],
            Center: createTree(tokens.slice(1))
        }
    case 'exit':
    case 'halt':
    case 'break':
    case 'continue':
    case 'label':
    case 'asm':
        if (tokens.length !== 1) {
            throw new Error(`At line: ${tokens[0].line}. Keyword '${tokens[0].value}' does not accept arguments.`)
        }
        return { type: 'endASN', Token: tokens[0] }
    case 'long':
    case 'fixed':
    case 'void':
    case 'struct':
        if (tokens.length === 1) {
            // To be used by sizeof
            return { type: 'endASN', Token: tokens[0] }
        }
        if (tokens.length === 2 && tokens[1].value === '*') {
            // To be used by sizeof. Pointers are treated as 'long' in operations
            tokens[0].value = 'long'
            return { type: 'endASN', Token: tokens[0] }
        }
        return {
            type: 'unaryASN',
            Operation: tokens[0],
            Center: createTree(tokens.slice(1))
        }
    case 'return':
    case 'sleep':
        if (tokens.length === 1) {
            return { type: 'endASN', Token: tokens[0] }
        }
        return {
            type: 'unaryASN',
            Operation: tokens[0],
            Center: createTree(tokens.slice(1))
        }
    case 'register':
        if (tokens.length === 1) {
            throw new Error(`At line: ${tokens[0].line}. Missing the variable type for 'register' use.`)
        }
        validateRegisterNextToken(tokens[1])
        return {
            type: 'unaryASN',
            Operation: tokens[0],
            Center: createTree(tokens.slice(1))
        }
    default:
        // Never
        throw new Error(`Internal error at line: ${tokens[0].line}. Keyword '${tokens[0].value}' shown up.`)
    }
}

function validateRegisterNextToken (nextToken: TOKEN) {
    if (nextToken.type !== 'Keyword') {
        throw new Error(`At line: ${nextToken.line}. Missing the variable type for 'register' use.`)
    }
    if (nextToken.value !== 'long' && nextToken.value !== 'fixed' && nextToken.value !== 'void') {
        throw new Error(`At line: ${nextToken.line}. 'registers' can be only types: 'long', 'fixed' or 'void'. ` +
            `Found '${nextToken.value}'.`)
    }
}

function UnaryOperatorToAST (tokens: TOKEN[], operatorLoc: number) : AST {
    if (operatorLoc !== 0) {
        throw new Error(`At line: ${tokens[operatorLoc].line}.` +
        ` Invalid use of 'UnaryOperator' '${tokens[operatorLoc].value}'.`)
    }
    if (tokens.length === 1) {
        throw new Error(`At line: ${tokens[0].line}. Missing value to apply unary operator '${tokens[0].value}'.`)
    }
    if (tokens[0].value === '*' && tokens.length > 0) {
        if (tokens[1].type !== 'Variable' &&
            tokens[1].type !== 'CodeCave' &&
            tokens[1].type !== 'SetUnaryOperator') {
            throw new Error(`At line: ${tokens[1].line}.` +
            ` Invalid lvalue for pointer operation. Can not have type '${tokens[1].type}'.`)
        }
    }
    return {
        type: 'unaryASN',
        Center: createTree(tokens.slice(1)),
        Operation: tokens[0]
    }
}

function preSetUnaryToAST (tokens: TOKEN[]) : AST {
    if (tokens.length === 1) {
        throw new Error(`At line: ${tokens[0].line}.` +
        ` Missing value to apply 'SetUnaryOperator' '${tokens[0].value}'.`)
    }
    if (tokens[1].type !== 'Variable') {
        throw new Error(`At line: ${tokens[0].line}.` +
        ` 'SetUnaryOperator' '${tokens[0].value}' expecting a variable, got a '${tokens[1].type}'.`)
    }
    for (let j = 1; j < tokens.length; j++) {
        if (tokens[j].type === 'Variable' || tokens[j].type === 'Member') {
            continue
        }
        throw new Error(`At line: ${tokens[0].line}.` +
        ` Can not use 'SetUnaryOperator' with types '${tokens[j].type}'.`)
    }
    return {
        type: 'exceptionASN',
        Left: createTree(tokens.slice(1)),
        Operation: tokens[0]
    }
}

function postSetUnaryToAST (tokens: TOKEN[]) : AST {
    const operatorLoc = tokens.length - 1
    // Process exceptions for post increment and post decrement (left-to-right associativity)
    if (tokens[0].type !== 'Variable') {
        throw new Error(`At line: ${tokens[0].line}.` +
        ` 'SetUnaryOperator' '${tokens[operatorLoc].value}' expecting a variable, got a '${tokens[0].type}'.`)
    }
    for (let j = 1; j < tokens.length - 1; j++) {
        if (tokens[j].type === 'Variable' || tokens[j].type === 'Member') {
            continue
        }
        throw new Error(`At line: ${tokens[0].line}.` +
        ` Can not use 'SetUnaryOperator' with types  '${tokens[j].type}'.`)
    }
    return {
        type: 'exceptionASN',
        Right: createTree(tokens.slice(0, operatorLoc)),
        Operation: tokens[operatorLoc]
    }
}
