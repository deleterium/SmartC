import { CONTRACT } from '../typings/contractTypes'
import { SENTENCES } from '../typings/syntaxTypes'
import { assertNotUndefined } from '../repository/repository'
import createTree from './createTree'

/**
 * Traverse Program transforming some sentences properties from arrays of
 * tokens into an actually abstract syntax tree. Check operators
 * precedence and let operations in correct order for assembler.
 * This is parser third and final pass.
 * @param Program to be processed
 * @returns {void} but Program will be updated.
 * @throws {Error} on any mistake.
 */
export default function syntaxProcessor (Program: CONTRACT) : void {
    /* * * Main function! * * */
    function syntaxProcessMain () : void {
        Program.Global.sentences.forEach(processSentence)
        Program.functions.forEach(CurrentFunction => {
            CurrentFunction.sentences.forEach(processSentence)
        })
    }

    // Process recursively one Sentence object, creating an CodeAST, that was
    //   processed sintacticly.
    function processSentence (SentenceObj: SENTENCES) {
        switch (SentenceObj.type) {
        case 'phrase':
            SentenceObj.CodeAST = createTree(
                assertNotUndefined(SentenceObj.code,
                    'Internal error. Unknow object arrived at processSentence')
            )
            delete SentenceObj.code
            break
        case 'ifElse':
            SentenceObj.falseBlock.forEach(processSentence)
        // eslint-disable-next-line no-fallthrough
        case 'ifEndif':
        case 'while':
        case 'do':
            if (assertNotUndefined(SentenceObj.condition).length === 0) {
                throw new Error(`At line ${SentenceObj.line}. Sentence condition can not be empty`)
            }
            SentenceObj.ConditionAST = createTree(SentenceObj.condition)
            delete SentenceObj.condition
            SentenceObj.trueBlock.forEach(processSentence)
            break
        case 'for':
            SentenceObj.threeSentences.forEach(processSentence)
            SentenceObj.trueBlock.forEach(processSentence)
            break
        case 'struct':
            processSentence(SentenceObj.Phrase)
            break
        case 'switch':
            SentenceObj.JumpTable = {
                type: 'switchASN',
                Expression: createTree(SentenceObj.expression),
                caseConditions: assertNotUndefined(SentenceObj.cases).map(Sentence => createTree(Sentence))
            }
            delete SentenceObj.expression
            delete SentenceObj.cases
            SentenceObj.block.forEach(processSentence)
            break
        case 'case':
            delete SentenceObj.condition
            break
        }
    }

    return syntaxProcessMain()
}
