import { assertExpression, assertNotEqual, assertNotUndefined, deepCopy } from '../repository/repository'
import { CONTRACT } from '../typings/contractTypes'
import {
    ARRAY_TYPE_DEFINITION, MEMORY_SLOT, STRUCT_TYPE_DEFINITION, TOKEN
} from '../typings/syntaxTypes'
import { getMemoryTemplate, getTypeDefinitionTemplate } from './templates'

/** Process a tokens sequence from a Sentence phrase and return the variables
 * that were defined, in Memory object form
 * @param Program - Helper and Context.
 * @param phraseCode Code to be analyzed
 * @param structPrefix Optional. If processing struct members, set as struct name + '_'.
 * @returns Array of memory objects declared
 * @throws {Error} on any mistakes
 */
export default function memoryProcessor (
    Program: CONTRACT, phraseCode: TOKEN [], structPrefix: string = ''
): MEMORY_SLOT[] {
    let tokenCounter = 0
    let isRegister = false

    type LFV = 'long'|'fixed'|'void'

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
            case 'fixed':
            case 'void':
                retMem.push(...lfvProcessControl(phraseCode[tokenCounter].value as LFV))
                break
            case 'struct':
                retMem.push(...structProcessControl())
                break
            case 'register':
                if (Program.Context.ShaperContext.isFunctionArgument) {
                    throw new Error(Program.Context.formatError(phraseCode[tokenCounter].line,
                        'Arguments for functions cannot be register type.'))
                }
                tokenCounter++
                isRegister = true
                break
            default:
                tokenCounter++
            }
        }
        return retMem
    }

    /** From Code containing long/fixed/void declaration, return an array of memory objects.
     * Handle regular variables, arrays and pointers. This is control flow */
    function lfvProcessControl (definition: LFV) : MEMORY_SLOT[] {
        const retMemory : MEMORY_SLOT[] = []
        const keywordIndex = tokenCounter
        let valid = true
        tokenCounter++
        while (tokenCounter < phraseCode.length) {
            switch (phraseCode[tokenCounter].type) {
            case 'Delimiter':
                if (keywordIndex + 1 === tokenCounter) {
                    throw new Error(Program.Context.formatError(phraseCode[tokenCounter].line,
                        "Delimiter ',' not expected."))
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
                retMemory.push(...lfvToMemoryObject(definition))
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
    function lfvToMemoryObject (definition: LFV) : MEMORY_SLOT[] {
        const definitionTD = getTypeDefinitionTemplate(definition)
        const isPointer = isItPointer()
        const startingTokenCounter = tokenCounter
        const dimensions = getArrayDimensions()
        // tokenCounter was advanced by structArrDimensions.length
        // prepare lovHeader
        const header = deepCopy(definitionTD.MemoryTemplate)
        header.name = phraseCode[startingTokenCounter].value
        header.asmName = Program.Context.ShaperContext.currentPrefix + phraseCode[startingTokenCounter].value
        header.scope = Program.Context.ShaperContext.currentScopeName
        if (definition === 'void') {
            if (isPointer === false) {
                throw new Error(Program.Context.formatError(phraseCode[startingTokenCounter].line,
                    'Can not declare variables as void.'))
            }
            header.declaration = 'void_ptr'
        } else { // phraseCode[keywordIndex].value === 'long' | 'fixed'
            if (isPointer) {
                header.declaration += '_ptr'
            }
        }
        header.isDeclared = Program.Context.ShaperContext.isFunctionArgument
        header.isSet = Program.Context.ShaperContext.isFunctionArgument
        header.toBeRegister = isRegister
        // If is not an array, just send the header
        if (dimensions.length === 0) {
            return [header]
        }
        // But if it IS an array, update header
        if (isRegister) {
            throw new Error(Program.Context.formatError(phraseCode[tokenCounter].line,
                "'register' modifier on arrays is not implemented."))
        }
        header.type = 'array'
        header.typeDefinition = structPrefix + header.asmName
        header.ArrayItem = {
            type: 'long',
            declaration: header.declaration,
            typeDefinition: structPrefix + header.asmName,
            totalSize: 0
        }
        if (isPointer === false) {
            header.declaration += '_ptr'
        }
        header.ArrayItem.totalSize = 1 + dimensions.reduce(function (total, num) {
            return total * num
        }, 1)
        // Push items into memory
        const retArrMem = [header]
        for (let i = 1; i < header.ArrayItem.totalSize; i++) {
            const Mem2 = deepCopy(definitionTD.MemoryTemplate)
            Mem2.name = `${header.name}_${i - 1}`
            Mem2.asmName = `${header.asmName}_${i - 1}`
            Mem2.scope = Program.Context.ShaperContext.currentScopeName
            Mem2.declaration = header.ArrayItem.declaration
            Mem2.isSet = true // No way to track array items for using before initialized
            retArrMem.push(Mem2)
        }
        // create array type definition
        Program.typesDefinitions.push(createArrayTypeDefinition(header, dimensions))
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
    function getArraySize (tkn: TOKEN[] = [], line: string = '0:0') {
        if (tkn.length !== 1 || tkn[0].type !== 'Constant') {
            throw new Error(Program.Context.formatError(line,
                'Wrong array declaration. Only constant size declarations allowed.'))
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
                    throw new Error(Program.Context.formatError(line, "Delimiter ',' not expected."))
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
                throw new Error(Program.Context.formatError(line,
                    `Invalid element (value: '${phraseCode[tokenCounter].value}') found in struct definition.`))
            case 'Variable':
                if (Program.Context.ShaperContext.isFunctionArgument && !isPointer) {
                    throw new Error(Program.Context.formatError(line,
                        'Passing struct by value as argument is not supported. Pass by reference.'))
                }
                retMemory.push(...structToMemoryObject(structNameDef, phraseCode[keywordIndex].line))
                tokenCounter++
                break
            default:
                throw new Error(Program.Context.formatError(line,
                    `Invalid element (type: '${phraseCode[tokenCounter].type}' ` +
                    ` value: '${phraseCode[tokenCounter].value}') found in struct definition!`))
            }
        }
        return retMemory
    }

    /** Return an array of memory objects. Handle regular structs, arrays of structs
     * and struct pointers. This is the actual processing code */
    function structToMemoryObject (currentStructNameDef: string, startingLine: string) : MEMORY_SLOT[] {
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
                    throw new Error(Program.Context.formatError(startingLine,
                        `Could not find type definition for 'struct' '${currentStructNameDef}'.`))
                }
                return createMemoryObjectFromSTD(currentStructNameDef, phraseCode[tokenCounter].value, isStructPointer, false)
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
                StructMemHeader.size = 1
            }
            StructMemHeader.name = phraseCode[startingTokenCounter].value
            StructMemHeader.asmName = Program.Context.ShaperContext.currentPrefix + phraseCode[startingTokenCounter].value
            StructMemHeader.scope = Program.Context.ShaperContext.currentScopeName
            StructMemHeader.isDeclared = Program.Context.ShaperContext.isFunctionArgument
            StructMemHeader.isSet = Program.Context.ShaperContext.isFunctionArgument
            return [StructMemHeader]
        }
        // It IS array of structs
        if (StructTD === undefined) {
            throw new Error(Program.Context.formatError(startingLine,
                `Could not find type definition for 'struct' '${currentStructNameDef}'.`))
        }
        // Prepare structMemHeader
        StructMemHeader = deepCopy(StructTD.MemoryTemplate)
        if (isStructPointer) {
            throw new Error(Program.Context.formatError(startingLine,
                'Arrays of struct pointers are not currently supported.'))
        }
        StructMemHeader.name = phraseCode[startingTokenCounter].value
        StructMemHeader.asmName = Program.Context.ShaperContext.currentPrefix + phraseCode[startingTokenCounter].value
        StructMemHeader.scope = Program.Context.ShaperContext.currentScopeName
        StructMemHeader.isDeclared = Program.Context.ShaperContext.isFunctionArgument
        StructMemHeader.isSet = true // do not control using variables in array
        StructMemHeader.type = 'array'
        StructMemHeader.typeDefinition = StructMemHeader.asmName
        StructMemHeader.ArrayItem = {
            type: StructMemHeader.type,
            declaration: StructMemHeader.declaration,
            typeDefinition: Program.Context.ShaperContext.currentPrefix + currentStructNameDef,
            totalSize: 0
        }
        StructMemHeader.ArrayItem.totalSize = 1 + structArrDimensions.reduce(function (total, num) {
            return total * num
        }, StructMemHeader.size)
        // Push items in memory
        retStructMemory.push(StructMemHeader)
        for (let i = 1; i < StructMemHeader.ArrayItem.totalSize; i += StructMemHeader.size) {
            retStructMemory.push(...createMemoryObjectFromSTD(
                currentStructNameDef,
                phraseCode[tokenCounter - structArrDimensions.length].value + '_' + ((i - 1) / StructMemHeader.size).toString(),
                isStructPointer,
                true
            ))
        }
        // create array type definition
        Program.typesDefinitions.push(createArrayTypeDefinition(StructMemHeader, structArrDimensions))
        return retStructMemory
    }

    /** Find and return a struct type definiton with a given structTypeName */
    function findSTD (structTypeName: string = ''): STRUCT_TYPE_DEFINITION | undefined {
        let FoundTD = Program.typesDefinitions.find(obj => {
            return obj.type === 'struct' && obj.name === structTypeName
        }) as (STRUCT_TYPE_DEFINITION | undefined)
        if (FoundTD === undefined && Program.Context.ShaperContext.currentPrefix.length > 0) {
            FoundTD = Program.typesDefinitions.find(obj => {
                return obj.type === 'struct' && obj.name === Program.Context.ShaperContext.currentPrefix + structTypeName
            }) as (STRUCT_TYPE_DEFINITION | undefined)
        }
        return FoundTD
    }

    /** Create an array of memory objects from a given structTypeName.
     * The memory objects will be named variableName. */
    function createMemoryObjectFromSTD (
        structTypeName: string, variableName: string, ispointer: boolean, isArray: boolean
    ) : MEMORY_SLOT[] {
        const StructTD = assertNotUndefined(findSTD(structTypeName),
            'Internal error.')
        const newmemory = [deepCopy(StructTD.MemoryTemplate)]
        if (!ispointer) {
            newmemory.push(...deepCopy(StructTD.structMembers))
        }
        newmemory.forEach(Mem => {
            if (isArray) {
                Mem.isSet = true
            }
            if (Mem.name === '') {
                Mem.name = variableName
            } else {
                Mem.name = variableName + '_' + Mem.name
            }
            Mem.asmName = Program.Context.ShaperContext.currentPrefix + Mem.name
        })
        return newmemory
    }

    return memoryProcessorMain()
}
