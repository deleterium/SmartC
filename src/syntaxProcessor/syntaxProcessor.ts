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
            try {
                SentenceObj.CodeAST = createTree(
                    Program,
                    assertNotUndefined(SentenceObj.code, 'Internal error. Unknow object arrived at processSentence')
                )
                delete SentenceObj.code
            } catch (err) {
                if (err instanceof Error) {
                    Program.Context.errors.push(err.message)
                    // delete the offending sentence and continue.
                    SentenceObj.CodeAST = {
                        type: 'nullASN'
                    }
                    delete SentenceObj.code
                    break
                }
                // Fatal error
                throw err
            }
            break
        case 'scope':
            SentenceObj.alwaysBlock.forEach(processSentence)
            break
        case 'ifElse':
            SentenceObj.falseBlock.forEach(processSentence)
        // eslint-disable-next-line no-fallthrough
        case 'ifEndif':
        case 'while':
        case 'do':
            if (assertNotUndefined(SentenceObj.condition).length === 0) {
                throw new Error(Program.Context.formatError(SentenceObj.line, 'Sentence condition can not be empty.'))
            }
            SentenceObj.ConditionAST = createTree(Program, SentenceObj.condition)
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
                Expression: createTree(Program, SentenceObj.expression),
                caseConditions: assertNotUndefined(SentenceObj.cases).map(Sentence => createTree(Program, Sentence))
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
