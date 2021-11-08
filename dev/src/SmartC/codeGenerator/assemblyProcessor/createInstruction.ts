// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

import { MEMORY_SLOT, TOKEN } from '../../typings/syntaxTypes'
import { GENCODE_AUXVARS } from '../typings/codeGeneratorTypes'

import { utils } from '../utils'
import { assignmentToAsm } from './assignmentToAsm'
import { comparisionToAsm } from './comparisionToAsm'
import { keywordToAsm } from './keywordToAsm'
import { operatorToAsm } from './operatorToAsm'
import { unaryOperatorToAsm } from './unaryOperatorToAsm'

export interface MOLD_OBJECT {
    MoldedObj: MEMORY_SLOT
    instructionset: string
    isNew: boolean
}

/** Transforms a instruction into const instruction */
export function setConstAsmCode (progMemory: MEMORY_SLOT[], code: string, line: number) {
    const codelines = code.split('\n')
    const retlines: string[] = []

    codelines.forEach(instruction => {
        if (instruction.length === 0) {
            retlines.push('')
            return
        }
        const parts = /^\s*SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/.exec(instruction)
        if (parts === null) {
            const clrpart = /^\s*CLR\s+@(\w+)\s*$/.exec(instruction)
            if (clrpart !== null) {
                // allow CLR instruction and change to SET zero
                retlines.push('^const SET @' + clrpart[1] + ' #0000000000000000')
                return
            }
            const setpart = /^\s*SET\s+@(\w+)\s+\$n(\d+)\s*$/.exec(instruction)
            if (setpart !== null) {
                // allow set const on optimized const vars
                retlines.push(`^const SET @${setpart[1]} #${BigInt(setpart[2]).toString(16).padStart(16, '0')}`)
                return
            }
            throw new TypeError(`At line: ${line}. No operations can be done during 'const' assignment.`)
        }
        const search = progMemory.find(obj => obj.asmName === parts[1])
        if (search === undefined) {
            throw new TypeError(`At line: ${line}. Variable ${parts[1]} not found in memory.`)
        }
        if (search.hexContent !== undefined) {
            throw new TypeError(`At line: ${line}. Left side of an assigment with 'const' keyword already has been set.`)
        }
        search.hexContent = parts[2]
        retlines.push('^const ' + instruction)
    })

    return retlines.join('\n')
}

// Creates one simple assembly instruction
export function createSimpleInstruction (instruction: string, param1: string = '') {
    switch (instruction) {
    case 'Jump':
        return `JMP :${param1}\n`
    case 'Push':
        return `PSH $${param1}\n`
    case 'Pop':
        return `POP @${param1}\n`
    case 'exit':
        return 'FIN\n'
    case 'Label':
        return `${param1}:\n`
    case 'Function':
        return `JSR :__fn_${param1}\n`
    default:
        throw new TypeError(`Unknow simple instruction: ${instruction}`)
    }
}

export function createAPICallInstruction (astAuxVars: GENCODE_AUXVARS, objoperator: TOKEN, param1: MEMORY_SLOT, param2: MEMORY_SLOT[]) {
    let retinstr = ''
    const tempvar: MOLD_OBJECT[] = []

    param2.forEach((varObj) => {
        const Temp = flattenMemory(astAuxVars, varObj, -1)
        retinstr += Temp.instructionset
        tempvar.push(Temp)
    })

    retinstr += 'FUN'
    if (param1.type !== 'void') {
        retinstr += ' @' + param1.asmName
    }
    retinstr += ' ' + objoperator.value
    tempvar.forEach(arg => {
        retinstr += ' $' + arg.MoldedObj.asmName
    })
    retinstr += '\n'

    tempvar.forEach(arg => astAuxVars.freeRegister(arg.MoldedObj.address))
    return retinstr
}

/**
 * From ParamMemObj create an memory object suitable for assembly operations (a regular long variable). Do do rely in createInstruction,
 * all hardwork done internally. Returns also instructions maybe needed for conversion and a boolean to indicate if it is
 * a new object (that must be free later on).
*/
export function flattenMemory (auxVars: GENCODE_AUXVARS, ParamMemObj: MEMORY_SLOT, line: number): MOLD_OBJECT {
    let RetObj: MEMORY_SLOT
    let retInstructions = ''
    let retIsNew = false
    const paramDec = utils.getDeclarationFromMemory(ParamMemObj)

    if (ParamMemObj.type === 'constant') {
        if (ParamMemObj.hexContent === undefined) {
            throw new TypeError(`At line: ${line}. Missing hexContent parameter. BugReport please.`)
        }
        if (ParamMemObj.hexContent.length > 17) {
            throw new RangeError(`At line: ${line}. Overflow on long value assignment. Value bigger than 64 bits).`)
        }
        const OptMem = auxVars.memory.find(MEM => MEM.asmName === 'n' + Number('0x' + ParamMemObj.hexContent) && MEM.hexContent === ParamMemObj.hexContent)
        if (OptMem) {
            return { MoldedObj: OptMem, instructionset: '', isNew: false }
        }
        RetObj = auxVars.getNewRegister()
        RetObj.declaration = paramDec
        if (ParamMemObj.hexContent === '0000000000000000') {
            retInstructions += `CLR @${RetObj.asmName}\n`
        } else {
            retInstructions += `SET @${RetObj.asmName} #${ParamMemObj.hexContent}\n`
        }
        return { MoldedObj: RetObj, instructionset: retInstructions, isNew: true }
    }

    if (ParamMemObj.Offset === undefined) {
        return { MoldedObj: ParamMemObj, instructionset: '', isNew: false }
    }

    if (ParamMemObj.type === 'register' || ParamMemObj.type === 'long') {
        if (ParamMemObj.Offset.type === 'constant') {
            RetObj = auxVars.getNewRegister()
            RetObj.declaration = paramDec
            if (ParamMemObj.Offset.value === 0) {
                retInstructions += `SET @${RetObj.asmName} $($${ParamMemObj.asmName})\n`
            } else {
                const FlatConstant = flattenMemory(auxVars, utils.createConstantMemObj(ParamMemObj.Offset.value), line)
                retInstructions += FlatConstant.instructionset
                retInstructions += `SET @${RetObj.asmName} $($${ParamMemObj.asmName} + $${FlatConstant.MoldedObj.asmName})\n`
                if (FlatConstant.isNew) auxVars.freeRegister(FlatConstant.MoldedObj.address)
            }
            retIsNew = true
        } else { // ParamMemObj.Offset.type === 'variable'
            RetObj = auxVars.getNewRegister()
            RetObj.declaration = paramDec
            retInstructions += `SET @${RetObj.asmName} $($${ParamMemObj.asmName} + $${auxVars.getMemoryObjectByLocation(ParamMemObj.Offset.addr, line).asmName})\n`
            retIsNew = true
        }
    } else if (ParamMemObj.type === 'array') {
        if (ParamMemObj.Offset.type === 'constant') { // Looks like an array but can be converted to regular variable
            RetObj = auxVars.getMemoryObjectByLocation(utils.addHexContents(ParamMemObj.hexContent, ParamMemObj.Offset.value), line)
            auxVars.freeRegister(ParamMemObj.address)
            retIsNew = true
        } else { // ParamMemObj.Offset.type === 'variable'
            RetObj = auxVars.getNewRegister()
            RetObj.declaration = paramDec
            retInstructions += `SET @${RetObj.asmName} $($${ParamMemObj.asmName} + $${auxVars.getMemoryObjectByLocation(ParamMemObj.Offset.addr, line).asmName})\n`
            retIsNew = true
        }
    } else if (ParamMemObj.type === 'struct') {
        // Impossible condition because struct variables have their type changed during LOOKUP_ASN processing
        throw new Error(`At line: ${line}. Strange error. BugReport please.`)
    } else if (ParamMemObj.type === 'structRef') {
        if (ParamMemObj.Offset.type === 'constant') {
            RetObj = auxVars.getNewRegister()
            RetObj.declaration = paramDec
            const FlatConstant = flattenMemory(auxVars, utils.createConstantMemObj(ParamMemObj.Offset.value), line)
            retInstructions += FlatConstant.instructionset
            retInstructions += `SET @${RetObj.asmName} $($${ParamMemObj.asmName} + $${FlatConstant.MoldedObj.asmName})\n`
            if (FlatConstant.isNew) auxVars.freeRegister(FlatConstant.MoldedObj.address)
            retIsNew = true
        } else { // ParamMemObj.Offset.type === 'variable') {
            RetObj = auxVars.getNewRegister()
            RetObj.declaration = paramDec
            retInstructions += `SET @${RetObj.asmName} $($${ParamMemObj.asmName} + $${auxVars.getMemoryObjectByLocation(ParamMemObj.Offset.addr, line).asmName})\n`
            retIsNew = true
        }
    } else {
        throw new TypeError(`At line: ${line}. Not implemented type in flattenMemory(): ParamMemObj.type = '${ParamMemObj.type}'.`)
    }

    return { MoldedObj: RetObj, instructionset: retInstructions, isNew: retIsNew }
}

// Translate one single instruction from ast to assembly code
export function createInstruction (auxVars: GENCODE_AUXVARS, objoperator: TOKEN, param1?: MEMORY_SLOT, param2?: MEMORY_SLOT, rLogic?:boolean, jpFalse?: string, jpTrue?:string) : string {
    let retinstr = ''

    if (objoperator.type === 'Assignment') {
        return assignmentToAsm(auxVars, objoperator, param1, param2, rLogic, jpFalse, jpTrue)
    }

    if (objoperator.type === 'Operator' || objoperator.type === 'SetOperator') {
        return operatorToAsm(auxVars, objoperator, param1, param2, rLogic, jpFalse, jpTrue)
    }

    if (objoperator.type === 'UnaryOperator' || objoperator.type === 'SetUnaryOperator') {
        return unaryOperatorToAsm(auxVars, objoperator, param1, param2, rLogic, jpFalse, jpTrue)
    }

    if (objoperator.type === 'Comparision') {
        return comparisionToAsm(auxVars, objoperator, param1, param2, rLogic, jpFalse, jpTrue)
    }

    if (objoperator.type === 'Push') {
        if (param1 === undefined) {
            throw new TypeError(`At line: ${objoperator.line}. Missing parameter for PSH. BugReport please.`)
        }

        const TmpMemObj = flattenMemory(auxVars, param1, objoperator.line)
        retinstr += TmpMemObj.instructionset
        retinstr += 'PSH $' + TmpMemObj.MoldedObj.asmName + '\n'

        if (TmpMemObj.isNew === true) {
            auxVars.freeRegister(TmpMemObj.MoldedObj.address)
        }
        return retinstr
    }

    if (objoperator.type === 'Keyword') {
        return keywordToAsm(auxVars, objoperator, param1, param2, rLogic, jpFalse, jpTrue)
    }
    throw new TypeError('At line: ' + objoperator.line + '. ' + objoperator.type + ' not supported')
}
