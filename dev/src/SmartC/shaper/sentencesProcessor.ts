// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

import { assertNotEqual } from '../repository/repository'
import { TOKEN, SENTENCES, SENTENCE_PHRASE, SENTENCE_STRUCT } from '../typings/syntaxTypes'
import { SHAPER_AUXVARS } from './shaperTypings'

/** Expect one or more sentences in codetrain and converts it
 * to items in sentences array */
export default function codeToSentenceArray (AuxVars: SHAPER_AUXVARS, codetrain: TOKEN[] = [], addTerminator: boolean = false) : SENTENCES[] {
    if (addTerminator) {
        codetrain.push({ type: 'Terminator', value: ';', precedence: 11, line: -1 })
    }
    let sentences: SENTENCES[] = []
    for (; AuxVars.currentToken < codetrain.length; AuxVars.currentToken++) {
        sentences = sentences.concat(codeToOneSentence(AuxVars, codetrain))
    }
    return sentences
}

/** Expects only one sentence in codetrain and converts it
 * to one item sentences array */
function codeToOneSentence (AuxVars: SHAPER_AUXVARS, codetrain: TOKEN[]): SENTENCES[] {
    const phrase: TOKEN[] = []
    const lineOfFirstInstruction = codetrain[AuxVars.currentToken]?.line ?? -1

    if (codetrain[AuxVars.currentToken].type === 'CodeDomain') {
        const savedPosition = AuxVars.currentToken
        AuxVars.currentToken = 0
        const temp = codeToSentenceArray(AuxVars, codetrain[savedPosition].params)
        AuxVars.currentToken = savedPosition
        return temp
    }

    // One sentence ending with terminator (or maybe another loop/conditional)
    while (AuxVars.currentToken < codetrain.length) {
        const line = codetrain[AuxVars.currentToken].line
        if (codetrain[AuxVars.currentToken].type === 'Terminator') {
            // end of sentence!
            return [{ type: 'phrase', code: phrase, line: lineOfFirstInstruction }]
        }
        switch (codetrain[AuxVars.currentToken].value) {
        case 'struct':
            // Handle struct. It can be type:phrase or type:struct
            if (codetrain[AuxVars.currentToken + 1]?.type === 'CodeDomain') {
                // Struct definition -> type is 'struct'
                return structCodeToSentence(AuxVars, codetrain)
            }
            // Consider type: 'phrase' with struct variable declaration
            phrase.push(codetrain[AuxVars.currentToken])
            AuxVars.currentToken++
            continue
        case 'long':
        case 'const':
        case 'void':
        case 'goto':
        case 'halt':
        case 'return':
        case 'sleep':
        case 'exit':
            // Handle type:phrase keywords
            phrase.push(codetrain[AuxVars.currentToken])
            AuxVars.currentToken++
            continue
        }
        if (codetrain[AuxVars.currentToken].type === 'Keyword' && phrase.length > 0) {
            throw new Error(`At line: ${phrase[0].line}. Statement including '${codetrain[AuxVars.currentToken].value}' in wrong way. Possible missing ';'.`)
        }
        switch (codetrain[AuxVars.currentToken].value) {
        // Handle special type:phrase keywords and exceptions
        case 'if':
            return ifCodeToSentence(AuxVars, codetrain)
        case 'while':
            return whileCodeToSentence(AuxVars, codetrain)
        case 'for':
            return forCodeToSentence(AuxVars, codetrain)
        case 'else':
            throw new Error(`At line: ${line}. 'else' not associated with an 'if(){}else{}' sentence`)
        case 'asm':
            return [{ type: 'phrase', code: [codetrain[AuxVars.currentToken]], line: line }]
        case 'label':
            return [{ type: 'phrase', code: [codetrain[AuxVars.currentToken]], line: line }]
        case 'do':
            return doCodeToSentence(AuxVars, codetrain)
        case 'break':
        case 'continue':
            if (AuxVars.latestLoopId.length === 0) {
                throw new Error(`At line: ${line}. '${codetrain[AuxVars.currentToken].value}' outside a loop.`)
            }
            // Just update information and continue on loop
            codetrain[AuxVars.currentToken].extValue = AuxVars.latestLoopId[AuxVars.latestLoopId.length - 1]
            break
        }
        phrase.push(codetrain[AuxVars.currentToken])
        AuxVars.currentToken++
    }
    if (phrase.length !== 0) {
        throw new Error(`At line: ${codetrain[AuxVars.currentToken - 1].line}. Missing ';'. `)
    }
    // Never
    throw new Error(`Internal error processing line ${codetrain[AuxVars.currentToken - 1].line}.`)
}

function ifCodeToSentence (AuxVars: SHAPER_AUXVARS, codetrain: TOKEN[] = []) : SENTENCES[] {
    const line = codetrain[AuxVars.currentToken].line
    const id = `__if${line}`
    AuxVars.currentToken++
    if (codetrain[AuxVars.currentToken] === undefined || codetrain[AuxVars.currentToken].type !== 'CodeCave') {
        throw new Error(`At line: ${codetrain[AuxVars.currentToken - 1].line}. Expecting condition for 'if' statement.`)
    }
    const condition = codetrain[AuxVars.currentToken].params
    AuxVars.currentToken++
    const trueBlock = codeToOneSentence(AuxVars, codetrain)
    if (codetrain[AuxVars.currentToken + 1]?.type === 'Keyword' && codetrain[AuxVars.currentToken + 1]?.value === 'else') {
        AuxVars.currentToken += 2
        return [{
            type: 'ifElse',
            id: id,
            line: line,
            condition: condition,
            trueBlock: trueBlock,
            falseBlock: codeToOneSentence(AuxVars, codetrain)
        }]
    }
    return [{
        type: 'ifEndif',
        id: id,
        line: line,
        condition: condition,
        trueBlock: trueBlock
    }]
}

function whileCodeToSentence (AuxVars: SHAPER_AUXVARS, codetrain: TOKEN[] = []) : SENTENCES[] {
    const line = codetrain[AuxVars.currentToken].line
    const id = `__loop${line}`
    AuxVars.currentToken++
    if (codetrain[AuxVars.currentToken] === undefined || codetrain[AuxVars.currentToken].type !== 'CodeCave') {
        throw new Error(`At line: ${codetrain[AuxVars.currentToken - 1].line}. Expecting condition for 'while' statement.`)
    }
    const condition = codetrain[AuxVars.currentToken].params
    AuxVars.currentToken++
    AuxVars.latestLoopId.push(id)
    const trueBlock = codeToOneSentence(AuxVars, codetrain)
    AuxVars.latestLoopId.pop()
    return [{
        type: 'while',
        id: id,
        line: line,
        condition: condition,
        trueBlock: trueBlock
    }]
}

function forCodeToSentence (AuxVars: SHAPER_AUXVARS, codetrain: TOKEN[] = []) : SENTENCES[] {
    const line = codetrain[AuxVars.currentToken].line
    const id = `__loop${line}`
    AuxVars.currentToken++
    if (codetrain[AuxVars.currentToken] === undefined || codetrain[AuxVars.currentToken]?.type !== 'CodeCave') {
        throw new Error(`At line: ${codetrain[AuxVars.currentToken - 1].line}. Expecting condition for 'for' statement.`)
    }
    const savePosition = AuxVars.currentToken
    AuxVars.currentToken = 0
    const threeSentences = codeToSentenceArray(AuxVars, codetrain[savePosition].params, true)
    AuxVars.currentToken = savePosition
    if (threeSentences.length !== 3) {
        throw new Error(`At line: ${line}. Expected 3 sentences for 'for(;;){}' loop. Got ${threeSentences.length}`)
    }
    if (!threeSentences.every(Obj => Obj.type === 'phrase')) {
        throw new Error(`At line: ${line}. Sentences inside 'for(;;)' can not be other loops or conditionals`)
    }
    AuxVars.currentToken++
    AuxVars.latestLoopId.push(id)
    const trueBlock = codeToOneSentence(AuxVars, codetrain)
    AuxVars.latestLoopId.pop()
    return [{
        type: 'for',
        id: id,
        line: line,
        threeSentences: threeSentences as SENTENCE_PHRASE[],
        trueBlock: trueBlock
    }]
}

function doCodeToSentence (AuxVars: SHAPER_AUXVARS, codetrain: TOKEN[] = []) : SENTENCES[] {
    const line = codetrain[AuxVars.currentToken].line
    const id = `__loop${line}`
    AuxVars.currentToken++
    AuxVars.latestLoopId.push(id)
    const trueBlock = codeToOneSentence(AuxVars, codetrain)
    AuxVars.latestLoopId.pop()
    AuxVars.currentToken++
    if (codetrain[AuxVars.currentToken]?.value === 'while' &&
            codetrain[AuxVars.currentToken + 1]?.type === 'CodeCave' &&
            codetrain[AuxVars.currentToken + 2]?.type === 'Terminator') {
        AuxVars.currentToken += 2
        return [{
            type: 'do',
            id: id,
            line: line,
            trueBlock: trueBlock,
            condition: codetrain[AuxVars.currentToken - 1].params
        }]
    }
    throw new Error(`At line: ${codetrain[AuxVars.currentToken].line}. Wrong do{}while(); sentence.`)
}

function structCodeToSentence (AuxVars: SHAPER_AUXVARS, codetrain: TOKEN[] = []) : SENTENCES[] {
    const line = codetrain[AuxVars.currentToken].line
    const structName = assertNotEqual(codetrain[AuxVars.currentToken].extValue, '', 'Internal error. Missing struct type name.')
    AuxVars.currentToken++
    const Node: SENTENCE_STRUCT = {
        type: 'struct',
        line: line,
        name: structName,
        members: codeToOneSentence(AuxVars, codetrain),
        Phrase: { type: 'phrase', line: codetrain[AuxVars.currentToken - 1].line }
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
    throw new Error(`At line: end of file. Missing ';' to end 'struct' statement started at line ${line}.`)
}
