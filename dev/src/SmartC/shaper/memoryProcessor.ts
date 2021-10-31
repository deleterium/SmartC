// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

import { assertExpression, assertNotEqual, assertNotUndefined, deepCopy } from '../repository/repository'
import { ARRAY_TYPE_DEFINITION, MEMORY_SLOT, STRUCT_TYPE_DEFINITION, TOKEN, TYPE_DEFINITIONS } from '../typings/syntaxTypes'
import { SHAPER_AUXVARS } from './shaper'
import { getMemoryTemplate, getTypeDefinitionTemplate } from './templates'

/** Process a tokens sequence from a Sentence phrase and return the variables
 * that were defined, in Memory object form
 * @param ProgramTD Side effect: Program.typesDefinitions will receive new arrays definitions, if declared in code.
 * @param AuxVars Read only. It contains information about current function beeing processed.
 * @param phraseCode Code to be analyzed
 * @param structPrefix Optional. If processing struct members, set as struct name + '_'.
 * @returns Array of memory objects declared
 * @throws {Error} on any mistakes
 */
export function phraseToMemoryObject (ProgramTD: TYPE_DEFINITIONS[], AuxVars: SHAPER_AUXVARS, phraseCode: TOKEN [], structPrefix: string = ''): MEMORY_SLOT[] {
    let ptmoCounter = 0

    /* * * Main function * * */
    function ptmoMain () : MEMORY_SLOT[] {
        const retMem: MEMORY_SLOT[] = []

        if (phraseCode.length === 0) { // empty statement
            return retMem
        }

        ptmoCounter = 0
        while (phraseCode[ptmoCounter]?.type === 'Keyword') {
            switch (phraseCode[ptmoCounter].value) {
            case 'label':
                retMem.push(...labelToMemory(phraseCode[ptmoCounter].extValue, phraseCode[ptmoCounter].line))
                break
            case 'long':
            case 'void':
                retMem.push(...longOrVoidProcessControl(phraseCode, phraseCode[ptmoCounter].value as 'long'|'void'))
                break
            case 'struct':
                retMem.push(...structProcessControl(phraseCode))
                break
            default:
                ptmoCounter++
            }
        }
        return retMem
    }

    /** Checks and return an array with one label memory type */
    function labelToMemory (labelName: string = '', line: number = -1): MEMORY_SLOT[] {
        assertNotEqual(labelName, '',
            `Internal error at line ${line}. Found a label without id.`)
        ptmoCounter++
        const MemTempl = getMemoryTemplate('label')
        MemTempl.asmName = labelName
        MemTempl.name = labelName
        MemTempl.isDeclared = true
        return [MemTempl]
    }

    /** From Code containing long/void declaration, return an array of memory objects.
     * Handle regular variables, arrays and pointers. This is control flow */
    function longOrVoidProcessControl (phraseCode: TOKEN [], definition: 'long'|'void') : MEMORY_SLOT[] {
        const retMemory : MEMORY_SLOT[] = []
        const keywordIndex = ptmoCounter
        let valid = true

        ptmoCounter++
        while (ptmoCounter < phraseCode.length) {
            switch (phraseCode[ptmoCounter].type) {
            case 'Delimiter':
                if (keywordIndex + 1 === ptmoCounter) {
                    throw new TypeError(`At line: ${phraseCode[ptmoCounter].line}. Delimiter ',' not expected.`)
                }
                ptmoCounter++
                valid = true
                break
            case 'Terminator':
            case 'Keyword':
                return retMemory
            case 'Variable': {
                if (valid === false) {
                    ptmoCounter++
                    break
                }
                retMemory.push(...longOrVoidToMemoryObject(definition))
                valid = false
                ptmoCounter++
                break
            }
            default:
                ptmoCounter++
            }
        }
        return retMemory
    }

    /** Return an array of memory objects. Handle regular variables, arrays and pointers.
     * This is the actual processing code. */
    function longOrVoidToMemoryObject (definition: 'long'|'void') : MEMORY_SLOT[] {
        const longTD = getTypeDefinitionTemplate('long')
        const isLovPointer = isItPointer()
        const startingPmtoCounter = ptmoCounter
        const lovDimensions = getArrayDimensions()
        // pmtoCounter was advanced by structArrDimensions.length

        // prepare lovHeader
        const lovHeader = deepCopy(longTD.MemoryTemplate)
        lovHeader.name = phraseCode[startingPmtoCounter].value
        lovHeader.asmName = AuxVars.currentPrefix + phraseCode[startingPmtoCounter].value
        lovHeader.scope = AuxVars.currentScopeName
        if (definition === 'void') {
            if (isLovPointer === false) {
                throw new TypeError(`At line: ${phraseCode[startingPmtoCounter].line}. Can not declare variables as void.`)
            }
            lovHeader.declaration = 'void_ptr'
        } else { // phraseCode[keywordIndex].value === 'long'
            if (isLovPointer) {
                lovHeader.declaration += '_ptr'
            }
        }
        lovHeader.isDeclared = AuxVars.setIsDeclared

        // If is not an array, just send the header
        if (lovDimensions.length === 0) {
            return [lovHeader]
        }
        // But if it IS an array, update header
        lovHeader.type = 'array'
        lovHeader.typeDefinition = structPrefix + lovHeader.asmName
        lovHeader.arrItem = {
            type: 'long',
            declaration: lovHeader.declaration,
            typeDefinition: structPrefix + lovHeader.asmName,
            totalSize: 0
        }
        if (isLovPointer === false) {
            lovHeader.declaration += '_ptr'
        }
        lovHeader.arrItem.totalSize = 1 + lovDimensions.reduce(function (total, num) {
            return total * num
        }, 1)

        // Push items into memory
        const retArrMem = [lovHeader]
        for (let i = 1; i < lovHeader.arrItem.totalSize; i++) {
            const Mem2 = deepCopy(longTD.MemoryTemplate)
            Mem2.name = `${lovHeader.name}_${i - 1}`
            Mem2.asmName = `${lovHeader.asmName}_${i - 1}`
            Mem2.scope = AuxVars.currentScopeName
            Mem2.declaration = lovHeader.arrItem.declaration
            retArrMem.push(Mem2)
        }

        // create array type definition
        ProgramTD.push(createArrayTypeDefinition(lovHeader, lovDimensions))

        return retArrMem
    }

    /** Return current item Array dimensions, if there is any. It advances ptmoCounter! */
    function getArrayDimensions () : number[] {
        const dimensions: number[] = []
        while (ptmoCounter + 1 < phraseCode.length) {
            if (phraseCode[ptmoCounter + 1].type === 'Arr') { // Array declaration
                ptmoCounter++
                dimensions.push(getArraySize(phraseCode[ptmoCounter].params, phraseCode[ptmoCounter].line))
            } else {
                break
            }
        }
        return dimensions
    }

    /** Inspect one item to get array dimension */
    function getArraySize (tkn: TOKEN[] = [], line: number = -1) {
        if (tkn.length !== 1 || tkn[0].type !== 'Constant') {
            throw new TypeError('At line: ' + line + '. Wrong array declaration. Only constant size declarations allowed.')
        }
        return parseInt(tkn[0].value, 16)
    }

    function isItPointer () : boolean {
        if (phraseCode[ptmoCounter - 1].value === '*') {
            return true
        }
        return false
    }

    function createArrayTypeDefinition (header: MEMORY_SLOT, dimensions: number[]) : ARRAY_TYPE_DEFINITION {
        const retTypeD: ARRAY_TYPE_DEFINITION = {
            name: assertNotUndefined(header.typeDefinition, 'Internal error. Missing type definion.'),
            type: 'array',
            arrayDimensions: deepCopy(dimensions),
            arrayMultiplierDim: [],
            // CHECK unneed?
            MemoryTemplate: header
        }
        let j = dimensions.length - 1
        let acc = header.size
        do {
            retTypeD.arrayMultiplierDim.unshift(acc)
            acc *= dimensions[j]
            j--
        } while (j >= 0)
        return retTypeD
    }

    /** From Code containing a struct, return an array of memory objects.
     * Handle regular structs, arrays of structs and struct pointers. This
     * is the control flow */
    function structProcessControl (phraseCode: TOKEN []) : MEMORY_SLOT[] {
        const retMemory : MEMORY_SLOT[] = []
        const keywordIndex = ptmoCounter
        assertExpression(phraseCode[ptmoCounter].value === 'struct',
            'Internal error.')
        const structNameDef = assertNotEqual(phraseCode[keywordIndex].extValue, '', 'Internal error. Unknow type definition')

        ptmoCounter++
        while (ptmoCounter < phraseCode.length) {
            const line = phraseCode[ptmoCounter].line

            switch (phraseCode[ptmoCounter].type) {
            case 'Delimiter':
                if (keywordIndex + 1 === ptmoCounter) {
                    throw new TypeError(`At line: ${line}. Delimiter ',' not expected.`)
                }
                ptmoCounter++
                break
            case 'Terminator':
            case 'Keyword':
                return retMemory
            case 'UnaryOperator':
            case 'Operator':
                if (phraseCode[ptmoCounter].value === '*') {
                    ptmoCounter++
                    break
                }
                throw new TypeError(`At line: ${line}. Invalid element (value: '${phraseCode[ptmoCounter].value}') found in struct definition.`)
            case 'Variable':
                retMemory.push(...structToMemoryObject(structNameDef, phraseCode[keywordIndex].line))
                ptmoCounter++
                break
            default:
                throw new TypeError('At line: ' + phraseCode[ptmoCounter].line + ". Invalid element (type: '" + phraseCode[ptmoCounter].type + "' value: '" + phraseCode[ptmoCounter].value + "') found in struct definition!")
            }
        }
        return retMemory
    }

    /** Return an array of memory objects. Handle regular structs, arrays of structs
     * and struct pointers. This is the actual processing code */
    function structToMemoryObject (currentStructNameDef: string, startingLine: number) : MEMORY_SLOT[] {
        const retStructMemory : MEMORY_SLOT[] = []
        const structTD = findSTD(currentStructNameDef)
        let structMemHeader : MEMORY_SLOT
        const isStructPointer = isItPointer()
        const startingPmtoCounter = ptmoCounter
        const structArrDimensions = getArrayDimensions()
        // pmtoCounter was advanced by structArrDimensions.length

        if (structArrDimensions.length === 0) {
            // It IS NOT array of structs
            if (isStructPointer === false) {
                if (structTD === undefined) {
                    throw new TypeError(`At line: ${startingLine}. Could not find type definition for 'struct' '${currentStructNameDef}'.`)
                }
                return createMemoryObjectFromSTD(currentStructNameDef, phraseCode[ptmoCounter].value, isStructPointer)
            }
            // isStructPointer is true
            if (structTD === undefined) {
                // Maybe recursive definition.
                structMemHeader = getMemoryTemplate('structRef')
                // Recursive struct works only with global definitions
                structMemHeader.typeDefinition = currentStructNameDef
                structMemHeader.size = 1
                structMemHeader.declaration = 'struct_ptr'
            } else {
                // not recursive definition
                structMemHeader = deepCopy(structTD.MemoryTemplate)
                structMemHeader.declaration = 'struct_ptr'
                structMemHeader.type = 'structRef'
            }
            structMemHeader.name = phraseCode[startingPmtoCounter].value
            structMemHeader.asmName = AuxVars.currentPrefix + phraseCode[startingPmtoCounter].value
            structMemHeader.scope = AuxVars.currentScopeName
            structMemHeader.isDeclared = AuxVars.setIsDeclared
            return [structMemHeader]
        }

        // It IS array of structs
        if (structTD === undefined) {
            throw new TypeError(`At line: ${startingLine}. Could not find type definition for 'struct' '${currentStructNameDef}'.`)
        }

        // Prepare structMemHeader
        structMemHeader = deepCopy(structTD.MemoryTemplate)
        if (isStructPointer) {
            structMemHeader.declaration = 'struct_ptr'
        }
        structMemHeader.name = phraseCode[startingPmtoCounter].value
        structMemHeader.asmName = AuxVars.currentPrefix + phraseCode[startingPmtoCounter].value
        structMemHeader.scope = AuxVars.currentScopeName
        structMemHeader.isDeclared = AuxVars.setIsDeclared
        structMemHeader.type = 'array'
        structMemHeader.typeDefinition = structMemHeader.asmName
        structMemHeader.arrItem = {
            type: structMemHeader.type,
            declaration: structMemHeader.declaration,
            typeDefinition: AuxVars.currentPrefix + currentStructNameDef,
            totalSize: 0
        }

        if (isStructPointer === false) {
            // Update info after using it n arrItem
            structMemHeader.declaration += '_ptr'
        }
        structMemHeader.arrItem.totalSize = 1 + structArrDimensions.reduce(function (total, num) {
            return total * num
        }, structMemHeader.size)

        // Push items in memory
        retStructMemory.push(structMemHeader)
        for (let x = 0, i = 0; x < structArrDimensions.length; x++) {
            for (let y = 0; y < structArrDimensions[x]; y++) {
                retStructMemory.push(...createMemoryObjectFromSTD(currentStructNameDef, phraseCode[ptmoCounter - structArrDimensions.length].value + '_' + i, isStructPointer))
                i++
            }
        }

        // create array type definition
        ProgramTD.push(createArrayTypeDefinition(structMemHeader, structArrDimensions))

        return retStructMemory
    }

    /** Find and return a struct type definiton with a given structTypeName */
    function findSTD (structTypeName: string = ''): STRUCT_TYPE_DEFINITION | undefined {
        let search = ProgramTD.find(obj => obj.type === 'struct' && obj.name === structTypeName) as (STRUCT_TYPE_DEFINITION | undefined)
        if (search === undefined && AuxVars.currentPrefix.length > 0) {
            search = ProgramTD.find(obj => obj.type === 'struct' && obj.name === AuxVars.currentPrefix + structTypeName) as (STRUCT_TYPE_DEFINITION | undefined)
        }
        return search
    }

    /** Create an array of memory objects from a given structTypeName.
     * The memory objects will be named variableName. */
    function createMemoryObjectFromSTD (structTypeName: string, variableName: string, ispointer: boolean) : MEMORY_SLOT[] {
        const structTD = assertNotUndefined(findSTD(structTypeName),
            'Internal error.')
        const newmemory = [deepCopy(structTD.MemoryTemplate)]
        if (!ispointer) {
            newmemory.push(...deepCopy(structTD.structMembers))
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

    return ptmoMain()
}
