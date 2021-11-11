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
        // Analysis for start tokens
        if (codetrain[currentToken].type === 'CodeDomain') {
            return sentencesProcessor(AuxVars, codetrain[currentToken].params)
        }
        switch (codetrain[currentToken].value) {
        // These keywords must start one sentence.
        case 'if':
            return ifCodeToSentence()
        case 'while':
            return whileCodeToSentence()
        case 'for':
            return forCodeToSentence()
        case 'else':
            throw new Error(`At line: ${lineOfFirstInstruction}. 'else' not associated with an 'if(){}else{}' sentence`)
        case 'asm':
        case 'label':
            return [{ type: 'phrase', code: [codetrain[currentToken]], line: lineOfFirstInstruction }]
        case 'do':
            return doCodeToSentence()
        case 'break':
        case 'continue':
            if (AuxVars.latestLoopId.length === 0) {
                throw new Error(`At line: ${lineOfFirstInstruction}. '${codetrain[currentToken].value}' outside a loop.`)
            }
            if (codetrain[currentToken + 1]?.type === 'Terminator') {
                currentToken++
                codetrain[currentToken - 1].extValue = AuxVars.latestLoopId[AuxVars.latestLoopId.length - 1]
                return [{ type: 'phrase', code: [codetrain[currentToken - 1]], line: lineOfFirstInstruction }]
            }
            throw new Error(`At line: ${lineOfFirstInstruction}. Missing ';' after '${codetrain[currentToken].value}' keyword.`)
        case 'struct':
            // Handle struct. It can be type:phrase or type:struct. handle here only type:struct
            if (codetrain[currentToken + 1]?.type === 'CodeDomain') {
                return structCodeToSentence()
            }
        }
        // Analysis for type:phrase
        while (currentToken < codetrain.length) {
            if (codetrain[currentToken].type === 'Terminator') {
                // end of sentence!
                return [{ type: 'phrase', code: phrase, line: lineOfFirstInstruction }]
            }
            switch (codetrain[currentToken].value) {
            case 'if':
            case 'while':
            case 'for':
            case 'else':
            case 'asm':
            case 'label':
            case 'do':
            case 'break':
            case 'continue':
                // These keywords must start a sentence treated before. Throw if found now.
                throw new Error(`At line: ${codetrain[currentToken].line}.` +
                ` Statement including '${codetrain[currentToken].value}' in wrong way. Possible missing ';' before it.`)
            }
            phrase.push(codetrain[currentToken])
            currentToken++
        }
        throw new Error(`At line: ${codetrain[currentToken - 1].line}. Missing ';'. `)
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
