import { assertExpression, assertNotUndefined } from '../../repository/repository'
import { MEMORY_SLOT, OFFSET_MODIFIER_CONSTANT } from '../../typings/syntaxTypes'
import { FLATTEN_MEMORY_RETURN_OBJECT, GENCODE_AUXVARS } from '../codeGeneratorTypes'
import utils from '../utils'
import { flattenMemory } from './createInstruction'

/**
 * Create assembly intructions for an assignment.
 * @returns the assembly code necessary for the assignment to happen
 */
export default function assignmentToAsm (
    auxVars: GENCODE_AUXVARS, Left: MEMORY_SLOT, Right: MEMORY_SLOT, operationLine: number
) : string {
    /** Main function */
    function assignmentToAsmMain (): string {
        switch (Left.type) {
        case 'register':
        case 'long':
        case 'structRef':
            return leftRegularToAsm()
        case 'array':
            return leftArrayToAsm()
        default:
            throw new Error(`Internal error at line: ${operationLine}.`)
        }
    }

    /** Left side type is 'register', 'long' or 'structRef'. Create assembly instruction. */
    function leftRegularToAsm (): string {
        let RightMem: FLATTEN_MEMORY_RETURN_OBJECT
        let offsetVarName: string
        let assemblyCode: string
        switch (Left.Offset?.type) {
        case undefined:
            switch (Right.type) {
            case 'constant':
                return leftRegularOffsetUndefinedAndRightConstantToAsm()
            case 'register':
            case 'long':
            case 'structRef':
                return leftRegularOffsetUndefinedAndRightRegularToAsm()
            case 'array':
                return leftRegularOffsetUndefinedAndRightArrayToAsm()
            default:
                throw new Error(`Internal error at line: ${operationLine}.`)
            }
        case 'constant':
            return leftRegularOffsetConstantToAsm(Left.Offset)
        case 'variable':
            RightMem = flattenMemory(auxVars, Right, operationLine)
            offsetVarName = auxVars.getMemoryObjectByLocation(Left.Offset.addr).asmName
            assemblyCode = `SET @($${Left.asmName} + $${offsetVarName}) $${RightMem.FlatMem.asmName}\n`
            freeIfItIsNew(RightMem)
            return RightMem.asmCode + assemblyCode
        }
    }

    /** Left type is 'register', 'long' or ''structRef', with offset undefined. Right type is 'constant'.
     * Create assembly instruction. */
    function leftRegularOffsetUndefinedAndRightConstantToAsm () : string {
        Right.hexContent = assertNotUndefined(Right.hexContent)
        if (Right.hexContent.length > 17) {
            throw new Error(`At line: ${operationLine}.` +
            ' Overflow on long value assignment (value bigger than 64 bits)')
        }
        if (Right.hexContent === '0000000000000000') {
            return `CLR @${Left.asmName}\n`
        }
        const findOpt = auxVars.memory.find(MEM => {
            return MEM.asmName === `n${Number('0x' + Right.hexContent)}` && MEM.hexContent === Right.hexContent
        })
        if (findOpt) {
            return `SET @${Left.asmName} $${findOpt.asmName}\n`
        }
        return `SET @${Left.asmName} #${Right.hexContent}\n`
    }

    /** Left type is 'register', 'long' or 'structRef', with offset undefined. Right type is 'register', 'long' or
     * 'structRef'. Create assembly instruction. */
    function leftRegularOffsetUndefinedAndRightRegularToAsm () : string {
        let offsetVarName: string
        switch (Right.Offset?.type) {
        case undefined:
            return leftRegularOffsetUndefinedAndRightRegularOffsetUndefinedToAsm()
        case 'constant':
            return leftRegularOffsetUndefinedAndRightRegularOffsetConstantToAsm(Right.Offset)
        case 'variable':
            offsetVarName = auxVars.getMemoryObjectByLocation(Right.Offset.addr, operationLine).asmName
            return `SET @${Left.asmName} $($${Right.asmName} + $${offsetVarName})\n`
        }
    }

    /** Left type is 'register', 'long' or 'structRef', with offset undefined. Right type is 'register', 'long', or
     * 'structRef' with offset undefined. Create assembly instruction. */
    function leftRegularOffsetUndefinedAndRightRegularOffsetUndefinedToAsm (): string {
        if ((Left.declaration === Right.declaration) ||
            (Left.declaration === 'void_ptr' && Right.declaration.includes('ptr')) ||
            (Left.declaration.includes('ptr') && Right.declaration === 'void_ptr')) {
            if (Left.address === Right.address) {
                return ''
            }
            return `SET @${Left.asmName} $${Right.asmName}\n`
        }
        throw new Error(`Internal error at line: ${operationLine}.`)
    }

    /** Left type is 'register', 'long' or 'structRef', with offset undefined. Right type is 'register', 'long' or
     * 'structRef' with offset constant. Create assembly instruction. */
    function leftRegularOffsetUndefinedAndRightRegularOffsetConstantToAsm (
        RightOffset: OFFSET_MODIFIER_CONSTANT
    ) : string {
        if (RightOffset.value === 0) {
            return `SET @${Left.asmName} $($${Right.asmName})\n`
        }
        const MemOffset = flattenMemory(auxVars, utils.createConstantMemObj(RightOffset.value), operationLine)
        const assemblyCode = `SET @${Left.asmName} $($${Right.asmName} + $${MemOffset.FlatMem.asmName})\n`
        freeIfItIsNew(MemOffset)
        return MemOffset.asmCode + assemblyCode
    }

    /** Left type is 'register', 'long' or 'structRef', with offset undefined. Right type is 'array'.
     * Create assembly instruction. */
    function leftRegularOffsetUndefinedAndRightArrayToAsm (): string {
        if (Right.Offset === undefined) {
            return `SET @${Left.asmName} $${Right.asmName}\n`
        }
        if (Right.Offset.type === 'constant') {
            const memLoc = utils.addHexContents(Right.hexContent, Right.Offset.value)
            const RightMem = auxVars.getMemoryObjectByLocation(memLoc, operationLine)
            return `SET @${Left.asmName} $${RightMem.asmName}\n`
        }
        // Right.Offset.type is 'variable'
        const offsetVarName = auxVars.getMemoryObjectByLocation(Right.Offset.addr, operationLine).asmName
        return `SET @${Left.asmName} $($${Right.asmName} + $${offsetVarName})\n`
    }

    /** Left type is 'register', 'long' or 'structRef', with offset constant. Create assembly instruction. */
    function leftRegularOffsetConstantToAsm (LeftOffset: OFFSET_MODIFIER_CONSTANT) : string {
        const RightMem = flattenMemory(auxVars, Right, operationLine)
        let assemblyCode: string
        if (LeftOffset.value === 0) {
            assemblyCode = `SET @($${Left.asmName}) $${RightMem.FlatMem.asmName}\n`
            if (RightMem.isNew) {
                auxVars.freeRegister(RightMem.FlatMem.address)
            }
            return RightMem.asmCode + assemblyCode
        }
        const MemOffset = flattenMemory(auxVars, utils.createConstantMemObj(LeftOffset.value), operationLine)
        assemblyCode = `SET @($${Left.asmName} + $${MemOffset.FlatMem.asmName}) $${RightMem.FlatMem.asmName}\n`
        freeIfItIsNew(MemOffset)
        freeIfItIsNew(RightMem)
        return RightMem.asmCode + MemOffset.asmCode + assemblyCode
    }

    /** Left type is 'array'. Create assembly instruction. */
    function leftArrayToAsm (): string {
        let RightMem: FLATTEN_MEMORY_RETURN_OBJECT
        let assemblyCode: string
        let leftOffsetVarName: string
        switch (Left.Offset?.type) {
        case undefined:
            return leftArrayOffsetUndefinedToAsm()
        case 'constant':
            // Optimimization steps before lead to impossible reach code
            throw new Error(`Internal error at line: ${operationLine}.`)
        case 'variable':
            RightMem = flattenMemory(auxVars, Right, operationLine)
            leftOffsetVarName = auxVars.getMemoryObjectByLocation(Left.Offset.addr, operationLine).asmName
            assemblyCode = `SET @($${Left.asmName} + $${leftOffsetVarName}) $${RightMem.FlatMem.asmName}\n`
            freeIfItIsNew(RightMem)
            return RightMem.asmCode + assemblyCode
        }
    }

    /** Left type is 'array', with offset undefined. Create assembly instruction. */
    function leftArrayOffsetUndefinedToAsm (): string {
        assertExpression(Right.type === 'constant',
            `Internal error at line: ${operationLine}.`)
        // special case for multi-long text assignment
        const arraySize = assertNotUndefined(Left.ArrayItem).totalSize - 1
        if (Right.size > arraySize) {
            throw new Error(`At line: ${operationLine}.` +
            ' Overflow on array value assignment (value bigger than array size).')
        }
        const paddedLong = assertNotUndefined(Right.hexContent).padStart(arraySize * 16, '0')
        let assemblyCode = ''
        for (let i = 0; i < arraySize; i++) {
            const newLeft = auxVars.getMemoryObjectByLocation(utils.addHexContents(Left.hexContent, i), operationLine)
            const newRight = utils.createConstantMemObj(
                paddedLong.slice(16 * (arraySize - i - 1), 16 * (arraySize - i))
            )
            assemblyCode += assignmentToAsm(auxVars, newLeft, newRight, operationLine)
        }
        return assemblyCode
    }

    function freeIfItIsNew (FlatObj: FLATTEN_MEMORY_RETURN_OBJECT): void {
        if (FlatObj.isNew) {
            auxVars.freeRegister(FlatObj.FlatMem.address)
        }
    }

    return assignmentToAsmMain()
}
