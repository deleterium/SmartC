import { assertExpression, assertNotEqual, assertNotUndefined, deepCopy } from '../repository/repository'
import {
    ARRAY_TYPE_DEFINITION, MEMORY_SLOT, STRUCT_TYPE_DEFINITION, TOKEN, TYPE_DEFINITIONS
} from '../typings/syntaxTypes'
import { SHAPER_AUXVARS } from './shaperTypes'
import { getMemoryTemplate, getTypeDefinitionTemplate } from './templates'

/** Process a tokens sequence from a Sentence phrase and return the variables
 * that were defined, in Memory object form
 * @param programTD Side effect: Program.typesDefinitions will receive
 * new arrays definitions, if declared in code.
 * @param AuxVars Read only. It contains information about current function beeing processed.
 * @param phraseCode Code to be analyzed
 * @param structPrefix Optional. If processing struct members, set as struct name + '_'.
 * @returns Array of memory objects declared
 * @throws {Error} on any mistakes
 */
export default function memoryProcessor (
    programTD: TYPE_DEFINITIONS[], AuxVars: SHAPER_AUXVARS, phraseCode: TOKEN [], structPrefix: string = ''
): MEMORY_SLOT[] {
    let tokenCounter = 0

    /* * * Main function * * */
    function memoryProcessorMain () : MEMORY_SLOT[] {
        const retMem: MEMORY_SLOT[] = []
        if (phraseCode.length === 0) { // empty statement
            return retMem
        }
        tokenCounter = 0
        while (phraseCode[tokenCounter]?.type === 'Keyword') {
            switch (phraseCode[tokenCounter].value) {
            case 'long':
            case 'void':
                retMem.push(...longOrVoidProcessControl(phraseCode[tokenCounter].value as 'long'|'void'))
                break
            case 'struct':
                retMem.push(...structProcessControl())
                break
            default:
                tokenCounter++
            }
        }
        return retMem
    }

    /** From Code containing long/void declaration, return an array of memory objects.
     * Handle regular variables, arrays and pointers. This is control flow */
    function longOrVoidProcessControl (definition: 'long'|'void') : MEMORY_SLOT[] {
        const retMemory : MEMORY_SLOT[] = []
        const keywordIndex = tokenCounter
        let valid = true
        tokenCounter++
        while (tokenCounter < phraseCode.length) {
            switch (phraseCode[tokenCounter].type) {
            case 'Delimiter':
                if (keywordIndex + 1 === tokenCounter) {
                    throw new Error(`At line: ${phraseCode[tokenCounter].line}. Delimiter ',' not expected.`)
                }
                tokenCounter++
                valid = true
                break
            case 'Keyword':
                return retMemory
            case 'Variable': {
                if (valid === false) {
                    tokenCounter++
                    break
                }
                retMemory.push(...longOrVoidToMemoryObject(definition))
                valid = false
                tokenCounter++
                break
            }
            default:
                tokenCounter++
            }
        }
        return retMemory
    }

    /** Return an array of memory objects. Handle regular variables, arrays and pointers.
     * This is the actual processing code. */
    function longOrVoidToMemoryObject (definition: 'long'|'void') : MEMORY_SLOT[] {
        const LongTD = getTypeDefinitionTemplate('long')
        const isLovPointer = isItPointer()
        const startingTokenCounter = tokenCounter
        const lovDimensions = getArrayDimensions()
        // tokenCounter was advanced by structArrDimensions.length
        // prepare lovHeader
        const LovHeader = deepCopy(LongTD.MemoryTemplate)
        LovHeader.name = phraseCode[startingTokenCounter].value
        LovHeader.asmName = AuxVars.currentPrefix + phraseCode[startingTokenCounter].value
        LovHeader.scope = AuxVars.currentScopeName
        if (definition === 'void') {
            if (isLovPointer === false) {
                throw new Error(`At line: ${phraseCode[startingTokenCounter].line}.` +
                ' Can not declare variables as void.')
            }
            LovHeader.declaration = 'void_ptr'
        } else { // phraseCode[keywordIndex].value === 'long'
            if (isLovPointer) {
                LovHeader.declaration += '_ptr'
            }
        }
        LovHeader.isDeclared = AuxVars.isFunctionArgument
        // If is not an array, just send the header
        if (lovDimensions.length === 0) {
            return [LovHeader]
        }
        // But if it IS an array, update header
        LovHeader.type = 'array'
        LovHeader.typeDefinition = structPrefix + LovHeader.asmName
        LovHeader.ArrayItem = {
            type: 'long',
            declaration: LovHeader.declaration,
            typeDefinition: structPrefix + LovHeader.asmName,
            totalSize: 0
        }
        if (isLovPointer === false) {
            LovHeader.declaration += '_ptr'
        }
        LovHeader.ArrayItem.totalSize = 1 + lovDimensions.reduce(function (total, num) {
            return total * num
        }, 1)
        // Push items into memory
        const retArrMem = [LovHeader]
        for (let i = 1; i < LovHeader.ArrayItem.totalSize; i++) {
            const Mem2 = deepCopy(LongTD.MemoryTemplate)
            Mem2.name = `${LovHeader.name}_${i - 1}`
            Mem2.asmName = `${LovHeader.asmName}_${i - 1}`
            Mem2.scope = AuxVars.currentScopeName
            Mem2.declaration = LovHeader.ArrayItem.declaration
            retArrMem.push(Mem2)
        }
        // create array type definition
        programTD.push(createArrayTypeDefinition(LovHeader, lovDimensions))
        return retArrMem
    }

    /** Return current item Array dimensions, if there is any. It advances ptmoCounter! */
    function getArrayDimensions () : number[] {
        const dimensions: number[] = []
        while (tokenCounter + 1 < phraseCode.length) {
            if (phraseCode[tokenCounter + 1].type === 'Arr') { // Array declaration
                tokenCounter++
                dimensions.push(getArraySize(phraseCode[tokenCounter].params, phraseCode[tokenCounter].line))
            } else {
                break
            }
        }
        return dimensions
    }

    /** Inspect one item to get array dimension */
    function getArraySize (tkn: TOKEN[] = [], line: number = -1) {
        if (tkn.length !== 1 || tkn[0].type !== 'Constant') {
            throw new Error(`At line: ${line}.` +
            ' Wrong array declaration. Only constant size declarations allowed.')
        }
        return parseInt(tkn[0].value, 16)
    }

    function isItPointer () : boolean {
        if (phraseCode[tokenCounter - 1].value === '*') {
            return true
        }
        return false
    }

    function createArrayTypeDefinition (Header: MEMORY_SLOT, dimensions: number[]) : ARRAY_TYPE_DEFINITION {
        const RetTypeD: ARRAY_TYPE_DEFINITION = {
            name: assertNotUndefined(Header.typeDefinition, 'Internal error. Missing type definion.'),
            type: 'array',
            arrayDimensions: deepCopy(dimensions),
            arrayMultiplierDim: [],
            MemoryTemplate: Header
        }
        let j = dimensions.length - 1
        let acc = Header.size
        do {
            RetTypeD.arrayMultiplierDim.unshift(acc)
            acc *= dimensions[j]
            j--
        } while (j >= 0)
        return RetTypeD
    }

    /** From Code containing a struct, return an array of memory objects.
     * Handle regular structs, arrays of structs and struct pointers. This
     * is the control flow */
    function structProcessControl () : MEMORY_SLOT[] {
        const retMemory : MEMORY_SLOT[] = []
        let isPointer = false
        const keywordIndex = tokenCounter
        assertExpression(phraseCode[tokenCounter].value === 'struct', 'Internal error.')
        const structNameDef = assertNotEqual(
            phraseCode[keywordIndex].extValue,
            '',
            'Internal error. Unknow type definition'
        )
        tokenCounter++
        while (tokenCounter < phraseCode.length) {
            const line = phraseCode[tokenCounter].line
            switch (phraseCode[tokenCounter].type) {
            case 'Delimiter':
                if (keywordIndex + 1 === tokenCounter) {
                    throw new Error(`At line: ${line}. Delimiter ',' not expected.`)
                }
                tokenCounter++
                isPointer = false
                break
            case 'Keyword':
                return retMemory
            case 'UnaryOperator':
            case 'Operator':
                if (phraseCode[tokenCounter].value === '*') {
                    isPointer = true
                    tokenCounter++
                    break
                }
                throw new Error(`At line: ${line}.` +
                ` Invalid element (value: '${phraseCode[tokenCounter].value}') found in struct definition.`)
            case 'Variable':
                if (AuxVars.isFunctionArgument && !isPointer) {
                    throw new Error(`At line: ${line}.` +
                    ' Passing struct by value as argument is not supported. Pass by reference.')
                }
                retMemory.push(...structToMemoryObject(structNameDef, phraseCode[keywordIndex].line))
                tokenCounter++
                break
            default:
                throw new Error(`At line: ${line}.` +
                ` Invalid element (type: '${phraseCode[tokenCounter].type}' ` +
                ` value: '${phraseCode[tokenCounter].value}') found in struct definition!`)
            }
        }
        return retMemory
    }

    /** Return an array of memory objects. Handle regular structs, arrays of structs
     * and struct pointers. This is the actual processing code */
    function structToMemoryObject (currentStructNameDef: string, startingLine: number) : MEMORY_SLOT[] {
        const retStructMemory : MEMORY_SLOT[] = []
        const StructTD = findSTD(currentStructNameDef)
        let StructMemHeader : MEMORY_SLOT
        const isStructPointer = isItPointer()
        const startingTokenCounter = tokenCounter
        const structArrDimensions = getArrayDimensions()
        if (structArrDimensions.length === 0) {
            // It IS NOT array of structs
            if (isStructPointer === false) {
                if (StructTD === undefined) {
                    throw new Error(`At line: ${startingLine}.` +
                    ` Could not find type definition for 'struct' '${currentStructNameDef}'.`)
                }
                return createMemoryObjectFromSTD(currentStructNameDef, phraseCode[tokenCounter].value, isStructPointer)
            }
            // isStructPointer is true
            if (StructTD === undefined) {
                // Maybe recursive definition.
                StructMemHeader = getMemoryTemplate('structRef')
                // Recursive struct works only with global definitions
                StructMemHeader.typeDefinition = currentStructNameDef
                StructMemHeader.size = 1
                StructMemHeader.declaration = 'struct_ptr'
            } else {
                // not recursive definition
                StructMemHeader = deepCopy(StructTD.MemoryTemplate)
                StructMemHeader.declaration = 'struct_ptr'
                StructMemHeader.type = 'structRef'
            }
            StructMemHeader.name = phraseCode[startingTokenCounter].value
            StructMemHeader.asmName = AuxVars.currentPrefix + phraseCode[startingTokenCounter].value
            StructMemHeader.scope = AuxVars.currentScopeName
            StructMemHeader.isDeclared = AuxVars.isFunctionArgument
            return [StructMemHeader]
        }
        // It IS array of structs
        if (StructTD === undefined) {
            throw new Error(`At line: ${startingLine}.` +
            ` Could not find type definition for 'struct' '${currentStructNameDef}'.`)
        }
        // Prepare structMemHeader
        StructMemHeader = deepCopy(StructTD.MemoryTemplate)
        if (isStructPointer) {
            throw new Error(`At line: ${startingLine}. Arrays of struct pointers are not currently supported.`)
        }
        StructMemHeader.name = phraseCode[startingTokenCounter].value
        StructMemHeader.asmName = AuxVars.currentPrefix + phraseCode[startingTokenCounter].value
        StructMemHeader.scope = AuxVars.currentScopeName
        StructMemHeader.isDeclared = AuxVars.isFunctionArgument
        StructMemHeader.type = 'array'
        StructMemHeader.typeDefinition = StructMemHeader.asmName
        StructMemHeader.ArrayItem = {
            type: StructMemHeader.type,
            declaration: StructMemHeader.declaration,
            typeDefinition: AuxVars.currentPrefix + currentStructNameDef,
            totalSize: 0
        }
        StructMemHeader.ArrayItem.totalSize = 1 + structArrDimensions.reduce(function (total, num) {
            return total * num
        }, StructMemHeader.size)
        // Push items in memory
        retStructMemory.push(StructMemHeader)
        for (let x = 0, i = 0; x < structArrDimensions.length; x++) {
            for (let y = 0; y < structArrDimensions[x]; y++) {
                retStructMemory.push(...createMemoryObjectFromSTD(
                    currentStructNameDef,
                    phraseCode[tokenCounter - structArrDimensions.length].value + '_' + i,
                    isStructPointer
                ))
                i++
            }
        }
        // create array type definition
        programTD.push(createArrayTypeDefinition(StructMemHeader, structArrDimensions))
        return retStructMemory
    }

    /** Find and return a struct type definiton with a given structTypeName */
    function findSTD (structTypeName: string = ''): STRUCT_TYPE_DEFINITION | undefined {
        let FoundTD = programTD.find(obj => {
            return obj.type === 'struct' && obj.name === structTypeName
        }) as (STRUCT_TYPE_DEFINITION | undefined)
        if (FoundTD === undefined && AuxVars.currentPrefix.length > 0) {
            FoundTD = programTD.find(obj => {
                return obj.type === 'struct' && obj.name === AuxVars.currentPrefix + structTypeName
            }) as (STRUCT_TYPE_DEFINITION | undefined)
        }
        return FoundTD
    }

    /** Create an array of memory objects from a given structTypeName.
     * The memory objects will be named variableName. */
    function createMemoryObjectFromSTD (
        structTypeName: string, variableName: string, ispointer: boolean
    ) : MEMORY_SLOT[] {
        const StructTD = assertNotUndefined(findSTD(structTypeName),
            'Internal error.')
        const newmemory = [deepCopy(StructTD.MemoryTemplate)]
        if (!ispointer) {
            newmemory.push(...deepCopy(StructTD.structMembers))
        }
        newmemory.forEach(Mem => {
            if (Mem.name === '') {
                Mem.name = variableName
            } else {
                Mem.name = variableName + '_' + Mem.name
            }
            Mem.asmName = AuxVars.currentPrefix + Mem.name
        })
        return newmemory
    }

    return memoryProcessorMain()
}
