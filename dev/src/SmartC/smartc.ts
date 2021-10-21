import { preprocess } from './preprocessor/preprocessor'
import { tokenize } from './tokenizer/tokenizer'
import { parse } from './parser/parser'
import { shape } from './shaper/shaper'
import { syntaxProcess } from './syntaxProcessor/syntaxProcessor'
import { codeGenerate } from './codeGenerator/codeGenerator'
import { byteCode } from './byteCoder/byteCoder'

import { PRE_TOKEN, TOKEN } from './typings/syntaxTypes'
import { CONTRACT, MACHINE_OBJECT } from './typings/contractTypes'

/**
 * SmartC Compiler class.
 *
 * SmartC can compile C code or Assembly code for signum blockchain. Choose desired language with
 * argument options. Method `compile()` will compile entire code. If something wrong occurs, it will throw error.
 * Get the compiled instructions with methods `getAssemblyCode` or `getMachineCode`
 *
 * Example: Simple compilation test
 * ```ts
 * try {
 *     const startUpTest = new SmartC({
 *         language: 'C',
 *         sourceCode: '#pragma maxAuxVars 1\nlong a, b, c; a=b/~c;'
 *     })
 *     startUpTest.compile()
 *     const assemblyText = startUpTest.getAssemblyCode()
 *     const machineObject = startUpTest.getMachineCode()
 *     // Do something
 * } catch (e) {
 *     return "Compilation error: " + e.message
 * }
 *```
 * @module SmartC
 */
export class SmartC {
    private readonly language
    private readonly sourceCode
    private preprocessed?: string
    private tokenized?: PRE_TOKEN[]
    private parsed?: TOKEN[]
    private shaped?: CONTRACT
    private syntaxProcessed?: CONTRACT
    private codeGenerated?: string
    private byteCoded?: MACHINE_OBJECT

    constructor (options: { language: 'C' | 'Assembly', sourceCode: string }) {
        this.language = options.language
        this.sourceCode = options.sourceCode
    }

    /**
     * Triggers compilation process
     * @throws {Error} if compilation is not sucessfull */
    compile () : SmartC {
        if (this.byteCoded) {
            return this
        }
        switch (this.language) {
        case 'C':
            this.preprocessed = preprocess(this.sourceCode)
            this.tokenized = tokenize(this.preprocessed)
            this.parsed = parse(this.tokenized)
            this.shaped = shape(this.parsed)
            this.syntaxProcessed = syntaxProcess(this.shaped)
            this.codeGenerated = codeGenerate(this.syntaxProcessed)
            break
        case 'Assembly':
            this.codeGenerated = this.sourceCode
            break
        default:
            throw new Error('Invalid usage. Language must be "C" or "Assembly".')
        }
        this.byteCoded = byteCode(this.codeGenerated)
        return this
    }

    /**
     * @returns Sucessfull compiled assembly code
     * @throws {Error} if compilation was not done
     */
    getAssemblyCode () : string {
        if (!this.byteCoded) {
            throw new Error('Source code was not compiled.')
        }
        return this.codeGenerated ?? ''
    }

    /**
     * @returns Sucessfull compiled machine code
     * @throws {Error} if compilation was not done
     */
    getMachineCode () : MACHINE_OBJECT {
        if (!this.byteCoded) {
            throw new Error('Source code was not compiled.')
        }
        return this.byteCoded
    }
}
