import { preprocess } from './preprocessor/preprocessor.js'
import { tokenize } from './tokenizer/tokenizer.js'
import { parse } from './parser/parser.js'
import { shape } from './shaper/shaper.js'
import { syntaxProcess } from './syntaxProcessor/syntaxProcessor.js'
import { codeGenerate } from './codeGenerator/codeGenerator.js'
import { byteCode } from './byteCoder/byteCoder.js'

import { PRE_TOKEN, TOKEN } from './typings/syntaxTypes'
import { CONTRACT, MACHINE_OBJECT } from './typings/contractTypes'

export class SmartC {
    private language: 'C' | 'Assembly'
    private preprocessed?: string
    private tokenized?: PRE_TOKEN[]
    private parsed?: TOKEN[]
    private shaped?: CONTRACT
    private syntaxProcessed?: CONTRACT
    private codeGenerated?: string
    private byteCoded?: MACHINE_OBJECT

    constructor (language: 'C' | 'Assembly') {
        this.language = language
    }

    compile (sourceCode: string) {
        if (this.language === 'C') {
            this.preprocessed = preprocess(sourceCode)
            this.tokenized = tokenize(this.preprocessed)
            this.parsed = parse(this.tokenized)
            this.shaped = shape(this.parsed)
            this.syntaxProcessed = syntaxProcess(this.shaped)
            this.codeGenerated = codeGenerate(this.syntaxProcessed)
        } else {
            this.codeGenerated = sourceCode
        }
        this.byteCoded = byteCode(this.codeGenerated)
    }

    getAssemblyCode () {
        return this.codeGenerated
    }

    getMachineCode () {
        return this.byteCoded
    }
}
