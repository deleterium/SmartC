import { TOKEN, MEMORY_SLOT } from '../../typings/syntaxTypes'
import { GENCODE_AUXVARS } from '../typings/codeGeneratorTypes'
import { utils } from '../utils'
import { createInstruction, flattenMemory } from './opToAssembly'

export function assignmentToAsm (auxVars: GENCODE_AUXVARS, objoperator: TOKEN, param1?: MEMORY_SLOT, param2?: MEMORY_SLOT, rLogic?:boolean, jpFalse?: string, jpTrue?:string) : string {
    let retinstr = ''

    if (objoperator.type !== 'Assignment') {
        throw new Error('Internal error')
    }

    if (param1 === undefined || param2 === undefined) {
        throw new TypeError(`At line: ${objoperator.line}. Missing parameters. BugReport please.`)
    }
    switch (param1.type) {
    case 'constant':
        throw new TypeError(`At line: ${objoperator.line}. Invalid left side for assigment.`)
    case 'register':
    case 'long':
        if (param1.Offset === undefined) {
            switch (param2.type) {
            case 'constant':
                if (param2.hexContent === undefined) {
                    throw new TypeError(`At line: ${objoperator.line}. Missing hexContent parameter. BugReport please.`)
                }
                if (param2.hexContent === '0000000000000000') {
                    return 'CLR @' + param1.asmName + '\n'
                }
                if (auxVars.memory.find(MEM => MEM.asmName === 'n' + Number('0x' + param2.hexContent) && MEM.hexContent === param2.hexContent)) {
                    return `SET @${param1.asmName} $n${(Number('0x' + param2.hexContent))}\n`
                }
                if (param2.hexContent.length > 17) {
                    throw new RangeError('At line: ' + objoperator.line + '.Overflow on long value assignment (value bigger than 64 bits)')
                }
                return 'SET @' + param1.asmName + ' #' + param2.hexContent + '\n'
            case 'register':
            case 'long':
                if (param2.Offset === undefined) {
                    if ((param1.declaration === param2.declaration) ||
                            (param1.declaration === 'long_ptr' && param2.declaration === 'void_ptr') ||
                            (param1.declaration === 'void_ptr' && param2.declaration === 'long_ptr')) {
                        if (param1.address === param2.address) return ''
                        else return 'SET @' + param1.asmName + ' $' + param2.asmName + '\n'
                    } else {
                        if ((param1.declaration === 'long' && param2.declaration === 'long_ptr') ||
                                (param1.declaration === 'long' && param2.declaration === 'void_ptr')) {
                            return `SET @${param1.asmName} $($${param2.asmName})\n`
                        }
                        if ((param1.declaration === 'long_ptr' && param2.declaration === 'long') ||
                                (param1.declaration === 'void_ptr' && param2.declaration === 'long')) {
                            return `SET @($${param1.asmName}) $${param2.asmName}\n`
                        }
                        throw new RangeError(`At line: ${objoperator.line}. Strange param declaration. BugReport Please.`)
                    }
                } else if (param2.Offset.type === 'constant') {
                    if (!param2.declaration.includes('_ptr')) {
                        throw new Error('Strange error')
                    }
                    if (param2.Offset.value === 0) {
                        retinstr += `SET @${param1.asmName} $($${param2.asmName})\n`
                    } else {
                        const FlatOffset = flattenMemory(auxVars, utils.createConstantMemObj(param2.Offset.value), objoperator.line)
                        retinstr += FlatOffset.instructionset
                        retinstr += `SET @${param1.asmName} $($${param2.asmName} + $${FlatOffset.MoldedObj.asmName})\n`
                        if (FlatOffset.isNew) auxVars.freeRegister(FlatOffset.MoldedObj.address)
                    }
                    return retinstr
                } else { // param2.Offset.type === 'variable'
                    if (!param2.declaration.includes('_ptr')) {
                        throw new Error('Strange error')
                    }
                    return `SET @${param1.asmName} $($${param2.asmName} + $${auxVars.getMemoryObjectByLocation(param2.Offset.addr, objoperator.line).asmName})\n`
                }
            case 'array':
                if (param2.Offset === undefined) {
                    return 'SET @' + param1.asmName + ' $' + param2.asmName + '\n'
                } else if (param2.Offset.type === 'constant') {
                    return 'SET @' + param1.asmName + ' $' + auxVars.getMemoryObjectByLocation(utils.addHexContents(param2.hexContent, param2.Offset.value), objoperator.line).asmName + '\n'
                } else { // param2.Offset.type === 'variable'
                    return 'SET @' + param1.asmName + ' $($' + param2.asmName + ' + $' + auxVars.getMemoryObjectByLocation(param2.Offset.addr, objoperator.line).asmName + ')\n'
                }
            case 'struct':
            // Impossible condition because struct variables have their type changed during LOOKUP_ASN processing
                throw new Error(`At line: ${objoperator.line}. Strange error. BugReport please.`)
            case 'structRef':
                if (param2.Offset === undefined) {
                    if (param1.declaration === 'long_ptr' || param1.declaration === 'void_ptr') {
                        if (param1.address === param2.address) return ''
                        else return `SET @${param1.asmName} $${param2.asmName}\n`
                    }
                    throw new TypeError(`At line: ${objoperator.line}. Forbidden assignment: '${param1.declaration}' and '${param2.declaration}'.`)
                } else if (param2.Offset.type === 'constant') {
                    const FlatConstant = flattenMemory(auxVars, utils.createConstantMemObj(param2.Offset.value), objoperator.line)
                    retinstr += FlatConstant.instructionset
                    retinstr += `SET @${param1.asmName} $($${param2.asmName} + $${FlatConstant.MoldedObj.asmName})\n`
                    if (FlatConstant.isNew) auxVars.freeRegister(FlatConstant.MoldedObj.address)
                    return retinstr
                } else { // param2.Offset.type === 'variable'
                    retinstr += `SET @${param1.asmName} $($${param2.asmName} + $${auxVars.getMemoryObjectByLocation(param2.Offset.addr, objoperator.line).asmName})\n`
                    return retinstr
                }
            }
            throw new TypeError('At line: ' + objoperator.line + ". Unknow combination at createInstruction: param1 type '" + param1.type + "' and param2 type: '" + param2.type + "'.")
        } else if (param1.Offset.type === 'constant') {
            const FlatMem = flattenMemory(auxVars, param2, objoperator.line)
            retinstr += FlatMem.instructionset
            if (param1.Offset.value === 0) {
                retinstr += `SET @($${param1.asmName}) $${FlatMem.MoldedObj.asmName}\n`
            } else {
                const FlatConstant = flattenMemory(auxVars, utils.createConstantMemObj(param1.Offset.value), objoperator.line)
                retinstr += FlatConstant.instructionset
                retinstr += `SET @($${param1.asmName} + $${FlatConstant.MoldedObj.asmName}) $${FlatMem.MoldedObj.asmName}\n`
                if (FlatConstant.isNew) auxVars.freeRegister(FlatConstant.MoldedObj.address)
            }
            if (FlatMem.isNew) auxVars.freeRegister(FlatMem.MoldedObj.address)
            return retinstr
        } else { // param1.Offset.type === 'variable'
            const FlatMem = flattenMemory(auxVars, param2, objoperator.line)
            retinstr += FlatMem.instructionset
            retinstr += `SET @($${param1.asmName} + $${auxVars.getMemoryObjectByLocation(param1.Offset.addr).asmName}) $${FlatMem.MoldedObj.asmName}\n`
            if (FlatMem.isNew) auxVars.freeRegister(FlatMem.MoldedObj.address)
            return retinstr
        }
    case 'array':
        if (param1.Offset === undefined) {
            if (param2.type === 'constant') {
            // special case for multi-long text assignment
                if (param1.ArrayItem === undefined || param2.hexContent === undefined) {
                    throw new RangeError(`At line: ${objoperator.line}. Anomaly detected. BugReport please.`)
                }
                const arraySize = param1.ArrayItem.totalSize - 1
                if (param2.size > arraySize) {
                    throw new RangeError('At line: ' + objoperator.line + '. Overflow on array value assignment (value bigger than array size).')
                }
                const paddedLong = param2.hexContent.padStart(arraySize * 16, '0')
                for (let i = 0; i < arraySize; i++) {
                    retinstr += createInstruction(auxVars,
                        utils.genAssignmentToken(),
                        auxVars.getMemoryObjectByLocation(utils.addHexContents(param1.hexContent, i), objoperator.line),
                        utils.createConstantMemObj(paddedLong.slice(16 * (arraySize - i - 1), 16 * (arraySize - i))))
                }
                return retinstr
            }
        } else if (param1.Offset.type === 'constant') {
            return createInstruction(auxVars, objoperator, auxVars.getMemoryObjectByLocation(utils.addHexContents(param1.hexContent, param1.Offset.value), objoperator.line), param2)
        } else { // param1.Offset.type === 'variable'
            const FlatMem = flattenMemory(auxVars, param2, objoperator.line)
            retinstr += FlatMem.instructionset
            // retinstr += `SET @($${param1.asmName}) $${FlatMem.MoldedObj.asmName}\n`
            retinstr += `SET @($${param1.asmName} + $${auxVars.getMemoryObjectByLocation(param1.Offset.addr, objoperator.line).asmName}) $${FlatMem.MoldedObj.asmName}\n`
            if (FlatMem.isNew) auxVars.freeRegister(FlatMem.MoldedObj.address)
            return retinstr
        }
        throw new TypeError('At line: ' + objoperator.line + ". Unknow combination at createInstruction: param1 type '" + param1.type + "' and param2 type: '" + param2.type + "'.")
    case 'struct':
    // Impossible condition because struct variables have their type changed during LOOKUP_ASN processing
        throw new Error(`At line: ${objoperator.line}. Strange error. BugReport please.`)
    case 'structRef':
        if (param1.Offset === undefined) {
        // no modifier
            switch (param2.type) {
            case 'constant':
                if (param2.hexContent === undefined) {
                    throw new TypeError(`At line: ${objoperator.line}. Missing hexContent parameter. BugReport please.`)
                }
                if (param2.hexContent.length > 17) {
                    throw new RangeError('At line: ' + objoperator.line + '. Overflow on long value assignment (value bigger than 64 bits)')
                }
                if (param2.hexContent === '0000000000000000') {
                    return `CLR @${param1.asmName}\n`
                }
                if (auxVars.memory.find(MEM => MEM.asmName === 'n' + Number('0x' + param2.hexContent) && MEM.hexContent === param2.hexContent)) {
                    return `SET @${param1.asmName} $n${(Number('0x' + param2.hexContent))}\n`
                }
                return `SET @${param1.asmName} #${param2.hexContent}\n`
            case 'register':
            case 'long':
                if (param2.Offset === undefined) {
                    if (param2.declaration === 'long_ptr' || param2.declaration === 'struct_ptr' || param2.declaration === 'void_ptr') {
                        return `SET @${param1.asmName} $${param2.asmName}\n`
                    }
                    throw new TypeError(`At line: ${objoperator.line}. Forbidden assignment: '${param1.declaration}' and '${param2.declaration}'.`)
                } else if (param2.Offset.type === 'constant') {
                    const FlatOffset = flattenMemory(auxVars, utils.createConstantMemObj(param2.Offset.value), objoperator.line)
                    retinstr += FlatOffset.instructionset
                    retinstr += `SET @${param1.asmName} $($${param2.asmName} + $${FlatOffset.MoldedObj.asmName})\n`
                    if (FlatOffset.isNew) auxVars.freeRegister(FlatOffset.MoldedObj.address)
                    return retinstr
                } else {
                    return `SET @${param1.asmName} $($${param2.asmName} + $${auxVars.getMemoryObjectByLocation(param2.Offset.addr, objoperator.line).asmName})\n`
                }
            case 'array':
                throw new TypeError('Not implemented: structRef -> array')
            case 'structRef':
                if (param2.Offset === undefined) {
                    return `SET @${param1.asmName} $${param2.asmName}\n`
                } else if (param2.Offset.type === 'constant') {
                    if (param2.Offset.declaration !== 'long_ptr' && param2.Offset.declaration !== 'struct_ptr' && param2.Offset.declaration !== 'void_ptr') {
                        throw new TypeError(`At line: ${objoperator.line}. Forbidden assignment: '${param1.declaration}' and '${param2.Offset.declaration}'.`)
                    }
                    const FlatOffset = flattenMemory(auxVars, utils.createConstantMemObj(param2.Offset.value), objoperator.line)
                    retinstr += FlatOffset.instructionset
                    retinstr += `SET @${param1.asmName} $($${param2.asmName} + $${FlatOffset.MoldedObj.asmName})\n`
                    if (FlatOffset.isNew) auxVars.freeRegister(FlatOffset.MoldedObj.address)
                    return retinstr
                } else { // param2.Offset.type === 'variable'
                    if (param2.Offset.declaration !== 'long_ptr' && param2.Offset.declaration !== 'struct_ptr' && param2.Offset.declaration !== 'void_ptr') {
                        throw new TypeError(`At line: ${objoperator.line}. Forbidden assignment: '${param1.declaration}' and '${param2.Offset.declaration}'.`)
                    }
                    return `SET @${param1.asmName} $($${param2.asmName} + $${auxVars.getMemoryObjectByLocation(param2.Offset.addr, objoperator.line).asmName})\n`
                }
            }
        } else if (param1.Offset.type === 'constant') {
            const FlatP2 = flattenMemory(auxVars, param2, objoperator.line)
            retinstr += FlatP2.instructionset
            if (FlatP2.isNew) {
                auxVars.freeRegister(param2.address)
                if (param2.Offset?.type === 'variable') {
                    auxVars.freeRegister(param2.Offset.addr)
                }
            }
            const FlatOffset = flattenMemory(auxVars, utils.createConstantMemObj(param1.Offset.value), objoperator.line)
            retinstr += FlatOffset.instructionset
            retinstr += `SET @($${param1.asmName} + $${FlatOffset.MoldedObj.asmName}) $${FlatP2.MoldedObj.asmName}\n`
            if (FlatOffset.isNew) auxVars.freeRegister(FlatOffset.MoldedObj.address)
            if (FlatP2.isNew) auxVars.freeRegister(FlatP2.MoldedObj.address)
            return retinstr
        } else { // param1.Offset.type === 'variable'
            const FlatP2 = flattenMemory(auxVars, param2, objoperator.line)
            retinstr += FlatP2.instructionset
            retinstr += `SET @($${param1.asmName} + $${auxVars.getMemoryObjectByLocation(param1.Offset.addr, objoperator.line).asmName}) $${FlatP2.MoldedObj.asmName}\n`
            if (FlatP2.isNew) auxVars.freeRegister(FlatP2.MoldedObj.address)
            return retinstr
        }
    }
    throw new TypeError(`At line: ${objoperator.line}. Unknow combination at createInstruction: param1 '${param1.type}' and param2 '${param2.type}'.`)
}
