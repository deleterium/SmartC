import { DECLARATION_TYPES } from '../../typings/syntaxTypes'
import { GENCODE_AUXVARS, GENCODE_SOLVED_OBJECT } from '../codeGeneratorTypes'
import utils from '../utils'
import { createSimpleInstruction, toRegister } from './createInstruction'

export function typeCasting (
    AuxVars: GENCODE_AUXVARS, InSolved: GENCODE_SOLVED_OBJECT, toType: DECLARATION_TYPES, line: number
) : GENCODE_SOLVED_OBJECT {
    const fromType = utils.getDeclarationFromMemory(InSolved.SolvedMem)
    if (fromType === toType) {
        return InSolved
    }

    function typeCastingMain () : GENCODE_SOLVED_OBJECT {
        switch (toType) {
        case 'void':
            // From anything to void
            AuxVars.freeRegister(InSolved.SolvedMem.address)
            InSolved.SolvedMem = utils.createVoidMemObj()
            return InSolved
        case 'long':
            return toLong()
        case 'fixed':
            return toFixed()
        case 'void_ptr':
        case 'long_ptr':
        case 'fixed_ptr':
        case 'struct_ptr':
            return toPointer()
        case 'struct':
        default:
            throw new Error('Internal error')
        }
    }

    function toFixed () : GENCODE_SOLVED_OBJECT {
        switch (fromType) {
        case 'long':
            // From long to fixed
            InSolved = toRegister(AuxVars, InSolved, line)
            InSolved.asmCode += createSimpleInstruction('LongToFixed', InSolved.SolvedMem.asmName)
            utils.setMemoryDeclaration(InSolved.SolvedMem, 'fixed')
            return InSolved
        case 'void':
            // From void to fixed
            InSolved.SolvedMem = AuxVars.getNewRegister(line)
            InSolved.asmCode += `CLR @${InSolved.SolvedMem.asmName}\n`
            utils.setMemoryDeclaration(InSolved.SolvedMem, 'fixed')
            return InSolved
        case 'struct':
        case 'void_ptr':
        case 'long_ptr':
        case 'fixed_ptr':
        case 'struct_ptr':
            throw new Error(`At line: ${line}. It is not possible to cast ${fromType} to fixed number.`)
        default:
            throw new Error('Internal error')
        }
    }

    function toLong () : GENCODE_SOLVED_OBJECT {
        switch (fromType) {
        case 'void':
            // From void to long
            InSolved.SolvedMem = AuxVars.getNewRegister(line)
            InSolved.asmCode += `CLR @${InSolved.SolvedMem.asmName}\n`
            utils.setMemoryDeclaration(InSolved.SolvedMem, 'long')
            return InSolved
        case 'fixed':
            InSolved = toRegister(AuxVars, InSolved, line)
            InSolved.asmCode += createSimpleInstruction('FixedToLong', InSolved.SolvedMem.asmName)
            utils.setMemoryDeclaration(InSolved.SolvedMem, 'long')
            return InSolved
        case 'struct':
            throw new Error(`At line: ${line}. It is not possible to cast ${fromType} to long number.`)
        case 'void_ptr':
        case 'long_ptr':
        case 'fixed_ptr':
        case 'struct_ptr':
            utils.setMemoryDeclaration(InSolved.SolvedMem, 'long')
            return InSolved
        default:
            throw new Error('Internal error')
        }
    }

    function toPointer () : GENCODE_SOLVED_OBJECT {
        switch (fromType) {
        case 'void':
            // From void to pointer (NULL)
            InSolved.SolvedMem = utils.createConstantMemObj(0)
            utils.setMemoryDeclaration(InSolved.SolvedMem, toType)
            return InSolved
        case 'long':
            // From long to any pointer
            utils.setMemoryDeclaration(InSolved.SolvedMem, toType)
            return InSolved
        case 'fixed':
            // From fixed to any pointer
            throw new Error(`At line: ${line}. It is not possible to cast ${fromType} to a pointer type.`)
        case 'struct':
            // From struct to pointer (address of first value in struct)
            InSolved.SolvedMem = utils.createConstantMemObj(InSolved.SolvedMem.hexContent)
            utils.setMemoryDeclaration(InSolved.SolvedMem, toType)
            return InSolved
        case 'void_ptr':
        case 'long_ptr':
        case 'fixed_ptr':
        case 'struct_ptr':
            // From any pointer to any pointer
            utils.setMemoryDeclaration(InSolved.SolvedMem, toType)
            return InSolved
        default:
            throw new Error('Internal error')
        }
    }

    return typeCastingMain()
}
