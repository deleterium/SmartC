// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

import { assertNotEqual } from '../repository/repository'
import { TOKEN, SENTENCES, SENTENCE_PHRASE, SENTENCE_STRUCT } from '../typings/syntaxTypes'
import { SHAPER_AUXVARS } from './shaperTypes'

/** Expect one or more sentences in codetrain and converts it
 * to items in sentences array */
export default function sentencesProcessor (
    AuxVars: SHAPER_AUXVARS, codetrain: TOKEN[] = [], addTerminator: boolean = false
) : SENTENCES[] {
    /** Current scope counter for sentence processing */
    let currentToken = 0

    function sentencesProcessorMain () : SENTENCES[] {
        if (addTerminator) {
            codetrain.push({ type: 'Terminator', value: ';', precedence: 11, line: -1 })
        }
        let sentences: SENTENCES[] = []
        for (; currentToken < codetrain.length; currentToken++) {
            sentences = sentences.concat(processOneSentence())
        }
        return sentences
    }

    /** Expects only one sentence in codetrain and converts it
     * to one item sentences array */
    function processOneSentence (): SENTENCES[] {
        const phrase: TOKEN[] = []
        const lineOfFirstInstruction = codetrain[currentToken]?.line ?? -1

        if (codetrain[currentToken].type === 'CodeDomain') {
            const temp = sentencesProcessor(AuxVars, codetrain[currentToken].params)
            return temp
        }

        // One sentence ending with terminator (or maybe another loop/conditional)
        while (currentToken < codetrain.length) {
            const line = codetrain[currentToken].line
            if (codetrain[currentToken].type === 'Terminator') {
                // end of sentence!
                return [{ type: 'phrase', code: phrase, line: lineOfFirstInstruction }]
            }
            switch (codetrain[currentToken].value) {
            case 'struct':
                // Handle struct. It can be type:phrase or type:struct
                if (codetrain[currentToken + 1]?.type === 'CodeDomain') {
                    // Struct definition -> type is 'struct'
                    return structCodeToSentence()
                }
                // Consider type: 'phrase' with struct variable declaration
                phrase.push(codetrain[currentToken])
                currentToken++
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
                phrase.push(codetrain[currentToken])
                currentToken++
                continue
            }
            if (codetrain[currentToken].type === 'Keyword' && phrase.length > 0) {
                throw new Error(`At line: ${phrase[0].line}.` +
                ` Statement including '${codetrain[currentToken].value}' in wrong way. Possible missing ';'.`)
            }
            switch (codetrain[currentToken].value) {
            // Handle special type:phrase keywords and exceptions
            case 'if':
                return ifCodeToSentence()
            case 'while':
                return whileCodeToSentence()
            case 'for':
                return forCodeToSentence()
            case 'else':
                throw new Error(`At line: ${line}. 'else' not associated with an 'if(){}else{}' sentence`)
            case 'asm':
                return [{ type: 'phrase', code: [codetrain[currentToken]], line: line }]
            case 'label':
                return [{ type: 'phrase', code: [codetrain[currentToken]], line: line }]
            case 'do':
                return doCodeToSentence()
            case 'break':
            case 'continue':
                if (AuxVars.latestLoopId.length === 0) {
                    throw new Error(`At line: ${line}. '${codetrain[currentToken].value}' outside a loop.`)
                }
                // Just update information and continue on loop
                codetrain[currentToken].extValue = AuxVars.latestLoopId[AuxVars.latestLoopId.length - 1]
                break
            }
            phrase.push(codetrain[currentToken])
            currentToken++
        }
        if (phrase.length !== 0) {
            throw new Error(`At line: ${codetrain[currentToken - 1].line}. Missing ';'. `)
        }
        // Never
        throw new Error(`Internal error processing line ${codetrain[currentToken - 1].line}.`)
    }

    function ifCodeToSentence () : SENTENCES[] {
        const line = codetrain[currentToken].line
        const id = `__if${line}`
        currentToken++
        if (codetrain[currentToken] === undefined || codetrain[currentToken].type !== 'CodeCave') {
            throw new Error(`At line: ${codetrain[currentToken - 1].line}.` +
            " Expecting condition for 'if' statement.")
        }
        const condition = codetrain[currentToken].params
        currentToken++
        const trueBlock = processOneSentence()
        if (codetrain[currentToken + 1]?.type === 'Keyword' &&
            codetrain[currentToken + 1]?.value === 'else') {
            currentToken += 2
            return [{
                type: 'ifElse',
                id: id,
                line: line,
                condition: condition,
                trueBlock: trueBlock,
                falseBlock: processOneSentence()
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

    function whileCodeToSentence () : SENTENCES[] {
        const line = codetrain[currentToken].line
        const id = `__loop${line}`
        currentToken++
        if (codetrain[currentToken] === undefined || codetrain[currentToken].type !== 'CodeCave') {
            throw new Error(`At line: ${codetrain[currentToken - 1].line}.` +
            " Expecting condition for 'while' statement.")
        }
        const condition = codetrain[currentToken].params
        currentToken++
        AuxVars.latestLoopId.push(id)
        const trueBlock = processOneSentence()
        AuxVars.latestLoopId.pop()
        return [{
            type: 'while',
            id: id,
            line: line,
            condition: condition,
            trueBlock: trueBlock
        }]
    }

    function forCodeToSentence () : SENTENCES[] {
        const line = codetrain[currentToken].line
        const id = `__loop${line}`
        currentToken++
        if (codetrain[currentToken] === undefined || codetrain[currentToken]?.type !== 'CodeCave') {
            throw new Error(`At line: ${codetrain[currentToken - 1].line}.` +
            " Expecting condition for 'for' statement.")
        }
        const threeSentences = sentencesProcessor(AuxVars, codetrain[currentToken].params, true)
        if (threeSentences.length !== 3) {
            throw new Error(`At line: ${line}. Expected 3 sentences for 'for(;;){}' loop. Got ${threeSentences.length}`)
        }
        if (!threeSentences.every(Obj => Obj.type === 'phrase')) {
            throw new Error(`At line: ${line}. Sentences inside 'for(;;)' can not be other loops or conditionals`)
        }
        currentToken++
        AuxVars.latestLoopId.push(id)
        const trueBlock = processOneSentence()
        AuxVars.latestLoopId.pop()
        return [{
            type: 'for',
            id: id,
            line: line,
            threeSentences: threeSentences as SENTENCE_PHRASE[],
            trueBlock: trueBlock
        }]
    }

    function doCodeToSentence () : SENTENCES[] {
        const line = codetrain[currentToken].line
        const id = `__loop${line}`
        currentToken++
        AuxVars.latestLoopId.push(id)
        const trueBlock = processOneSentence()
        AuxVars.latestLoopId.pop()
        currentToken++
        if (codetrain[currentToken]?.value === 'while' &&
            codetrain[currentToken + 1]?.type === 'CodeCave' &&
            codetrain[currentToken + 2]?.type === 'Terminator') {
            currentToken += 2
            return [{
                type: 'do',
                id: id,
                line: line,
                trueBlock: trueBlock,
                condition: codetrain[currentToken - 1].params
            }]
        }
        throw new Error(`At line: ${codetrain[currentToken].line}. Wrong do{}while(); sentence.`)
    }

    function structCodeToSentence () : SENTENCES[] {
        const line = codetrain[currentToken].line
        const structName = assertNotEqual(
            codetrain[currentToken].extValue,
            '',
            'Internal error. Missing struct type name.'
        )
        currentToken++
        const Node: SENTENCE_STRUCT = {
            type: 'struct',
            line: line,
            name: structName,
            members: processOneSentence(),
            Phrase: { type: 'phrase', line: codetrain[currentToken - 1].line }
        }
        Node.Phrase.code = [codetrain[currentToken - 1]]
        currentToken++
        while (currentToken < codetrain.length) {
            if (codetrain[currentToken].type === 'Terminator') {
                return [Node]
            }
            Node.Phrase.code.push(codetrain[currentToken])
            currentToken++
        }
        throw new Error(`At line: end of file. Missing ';' to end 'struct' statement started at line ${line}.`)
    }

    return sentencesProcessorMain()
}
