import preprocessor from './preprocessor/preprocessor'
import tokenizer from './tokenizer/tokenizer'
import parser from './parser/parser'
import shaper from './shaper/shaper'
import syntaxProcessor from './syntaxProcessor/syntaxProcessor'
import codeGenerator from './codeGenerator/codeGenerator'
import assembler from './assembler/assembler'

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
    private preAssemblyCode?: string
    private MachineCode?: MACHINE_OBJECT
    private Program: CONTRACT = {
        sourceLines: [],
        Global: {
            BuiltInFunctions: [],
            APIFunctions: [],
            macros: [],
            sentences: []
        },
        functions: [],
        memory: [],
        typesDefinitions: [],
        // Default configuration for compiler
        Config: {
            compilerVersion: '2.1.1',
            maxAuxVars: 3,
            maxConstVars: 0,
            optimizationLevel: 2,
            reuseAssignedVar: true,
            APIFunctions: false,
            fixedAPIFunctions: false,
            PName: '',
            PDescription: '',
            PActivationAmount: '',
            PCreator: '',
            PContract: '',
            PUserStackPages: 0,
            PCodeStackPages: 0,
            PCodeHashId: '',
            verboseAssembly: false
        },
        warnings: []
    }

    constructor (Options: { language: 'C' | 'Assembly', sourceCode: string }) {
        this.Program.sourceLines = Options.sourceCode.split('\n')
        this.language = Options.language
        this.sourceCode = Options.sourceCode
    }

    /**
     * Triggers compilation process
     * @throws {Error} if compilation is not sucessfull */
    compile () : SmartC {
        let preprocessed : string
        let tokenized: PRE_TOKEN[]
        let parsed: TOKEN[]
        if (this.MachineCode) {
            return this
        }
        switch (this.language) {
        case 'C':
            preprocessed = preprocessor(this.sourceCode)
            tokenized = tokenizer(preprocessed)
            parsed = parser(tokenized)
            shaper(this.Program, parsed)
            syntaxProcessor(this.Program)
            this.preAssemblyCode = codeGenerator(this.Program)
            break
        case 'Assembly':
            this.preAssemblyCode = this.sourceCode
            break
        default:
            throw new Error('Invalid usage. Language must be "C" or "Assembly".')
        }
        this.MachineCode = assembler(this.preAssemblyCode)
        this.MachineCode.Warnings = this.Program.warnings.join('\n')
        return this
    }

    /**
     * @returns Sucessfull compiled assembly code
     * @throws {Error} if compilation was not done
     */
    getAssemblyCode () : string {
        if (!this.MachineCode) {
            throw new Error('Source code was not compiled.')
        }
        return this.MachineCode.AssemblyCode
    }

    /**
     * @returns Sucessfull compiled machine code
     * @throws {Error} if compilation was not done
     */
    getMachineCode () : MACHINE_OBJECT {
        if (!this.MachineCode) {
            throw new Error('Source code was not compiled.')
        }
        return this.MachineCode
    }

    /**
     * Ask for current compiler version
     * @returns compiler version string
     */
    getCompilerVersion () : string {
        return this.Program.Config.compilerVersion
    }
}

if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    // @ts-ignore: Browser only
    window.SmartC = SmartC
}
