import { assertNotUndefined } from '../../repository/repository'
import { CONTRACT } from '../../typings/contractTypes'
import { MEMORY_SLOT, OFFSET_MODIFIER_CONSTANT, TOKEN } from '../../typings/syntaxTypes'
import { FLATTEN_MEMORY_RETURN_OBJECT, GENCODE_SOLVED_OBJECT } from '../codeGeneratorTypes'

import utils from '../utils'
import assignmentToAsm from './assignmentToAsm'
import comparisionToAsm from './comparisionToAsm'
import keywordToAsm from './keywordToAsm'
import operatorToAsm from './operatorToAsm'

/** Transforms a instruction into const instruction */
export function setConstAsmCode (progMemory: MEMORY_SLOT[], code: string, line: string) {
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
            throw new Error(`Internal error at line ${line}`)
        }
        const FoundMem = assertNotUndefined(progMemory.find(obj => obj.asmName === parts[1]))
        if (FoundMem.hexContent !== undefined) {
            throw new Error(`At line: ${line}. ` +
            "Left side of an assigment with 'const' keyword already has been set.")
        }
        FoundMem.hexContent = parts[2]
        retlines.push('^const ' + instruction)
    })
    return retlines.join('\n')
}

/** Creates one simple assembly instruction */
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
    case 'LongToFixed':
        return `MUL @${param1} $f100000000\n`
    case 'FixedToLong':
        return `DIV @${param1} $f100000000\n`
    default:
        throw new Error(`Unknow simple instruction: ${instruction}`)
    }
}

export function toRegister (
    Program: CONTRACT, InSolved: GENCODE_SOLVED_OBJECT, line: string
) : GENCODE_SOLVED_OBJECT {
    const retObj = flattenMemory(Program, InSolved.SolvedMem, line)

    if (!Program.Context.isTemp(retObj.FlatMem.address)) {
        const inType = utils.getDeclarationFromMemory(InSolved.SolvedMem)
        const TmpMemObj = Program.Context.getNewRegister(line)
        retObj.asmCode += `SET @${TmpMemObj.asmName} $${retObj.FlatMem.asmName}\n`
        utils.setMemoryDeclaration(TmpMemObj, inType)
        Program.Context.freeRegister(retObj.FlatMem.address)
        Program.Context.freeRegister(InSolved.SolvedMem.address)
        retObj.FlatMem = TmpMemObj
    }
    if (retObj.isNew === true) {
        Program.Context.freeRegister(InSolved.SolvedMem.address)
    }
    return {
        SolvedMem: retObj.FlatMem,
        asmCode: InSolved.asmCode + retObj.asmCode
    }
}

/** Create assembly code for one api function call */
export function createAPICallInstruction (
    Program: CONTRACT, ApiToken: TOKEN, RetMem: MEMORY_SLOT, argsMem: MEMORY_SLOT[]
) : string {
    let assemblyCode = ''
    const tempArgsMem: MEMORY_SLOT[] = []
    argsMem.forEach((VarObj) => {
        const Temp = flattenMemory(Program, VarObj, '0:0')
        assemblyCode += Temp.asmCode
        tempArgsMem.push(Temp.FlatMem)
    })
    assemblyCode += 'FUN'
    if (RetMem.type !== 'void') {
        assemblyCode += ` @${RetMem.asmName}`
    }
    assemblyCode += ` ${ApiToken.value}`
    tempArgsMem.forEach(Arg => {
        assemblyCode += ` $${Arg.asmName}`
    })
    tempArgsMem.forEach(Arg => Program.Context.freeRegister(Arg.address))
    return assemblyCode + '\n'
}

/**
 * From ParamMemObj create an memory object suitable for assembly operations (a regular long variable).
 * Do do rely in createInstruction, all hardwork done internally. Returns also instructions maybe needed for
 * conversion and a boolean to indicate if it is a new object (that must be free later on).
*/
export function flattenMemory (
    Program: CONTRACT, StuffedMemory: MEMORY_SLOT, line: string
) : FLATTEN_MEMORY_RETURN_OBJECT {
    const paramDec = utils.getDeclarationFromMemory(StuffedMemory)

    function flattenMemoryMain (): FLATTEN_MEMORY_RETURN_OBJECT {
        let retInstructions = ''
        if (StuffedMemory.type === 'constant') {
            switch (StuffedMemory.Offset?.type) {
            case undefined:
                return flattenConstant(StuffedMemory.hexContent)
            case 'constant':
                return flattenConstantWithOffsetConstant(StuffedMemory.Offset)
            default:
                // 'variable'
                throw new Error('Not implemented')
            }
        }
        if (StuffedMemory.Offset === undefined) {
            return { FlatMem: StuffedMemory, asmCode: '', isNew: false }
        }
        let RetObj: MEMORY_SLOT
        if (StuffedMemory.Offset.type === 'variable') {
            RetObj = Program.Context.getNewRegister()
            RetObj.declaration = paramDec
            const offsetVarName = Program.Context.getMemoryObjectByLocation(StuffedMemory.Offset.addr, line).asmName
            retInstructions += `SET @${RetObj.asmName} $($${StuffedMemory.asmName} + $${offsetVarName})\n`
            Program.Context.freeRegister(StuffedMemory.Offset.addr)
            return { FlatMem: RetObj, asmCode: retInstructions, isNew: true }
        }
        // StuffedMemory.Offset.type is 'constant'
        let FlatConstant: FLATTEN_MEMORY_RETURN_OBJECT
        switch (StuffedMemory.type) {
        case 'register':
        case 'long':
        case 'structRef':
            RetObj = Program.Context.getNewRegister()
            RetObj.declaration = paramDec
            if (StuffedMemory.Offset.value === 0) {
                retInstructions += `SET @${RetObj.asmName} $($${StuffedMemory.asmName})\n`
                return { FlatMem: RetObj, asmCode: retInstructions, isNew: true }
            }
            FlatConstant = flattenConstant(StuffedMemory.Offset.value)
            retInstructions += FlatConstant.asmCode
            retInstructions += `SET @${RetObj.asmName} $($${StuffedMemory.asmName} + $${FlatConstant.FlatMem.asmName})\n`
            if (FlatConstant.isNew) {
                Program.Context.freeRegister(FlatConstant.FlatMem.address)
            }
            return { FlatMem: RetObj, asmCode: retInstructions, isNew: true }
        case 'array':
            // Looks like an array but can be converted to regular variable
            RetObj = Program.Context.getMemoryObjectByLocation(
                utils.addHexSimple(StuffedMemory.hexContent, StuffedMemory.Offset.value), line
            )
            Program.Context.freeRegister(StuffedMemory.address)
            return { FlatMem: RetObj, asmCode: retInstructions, isNew: true }
        default:
            throw new Error(`Internal error at line: ${line}. Not implemented type in flattenMemory()`)
        }
    }

    function flattenConstantWithOffsetConstant (ConstOffset: OFFSET_MODIFIER_CONSTANT) : FLATTEN_MEMORY_RETURN_OBJECT {
        const deferencedVar = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(ConstOffset.value, StuffedMemory.hexContent), line)
        if (Program.Context.isTemp(deferencedVar.address)) {
            deferencedVar.declaration = paramDec
        }
        return { FlatMem: deferencedVar, asmCode: '', isNew: false }
    }

    function flattenConstant (hexParam: string|number|undefined): FLATTEN_MEMORY_RETURN_OBJECT {
        hexParam = assertNotUndefined(hexParam)
        let hexString: string
        if (typeof (hexParam) === 'number') {
            hexString = hexParam.toString(16)
        } else {
            hexString = hexParam
        }
        hexString = hexString.padStart(16, '0')
        if (hexString.length > 16) {
            throw new Error(Program.Context.formatError(StuffedMemory.line,
                'Value overflow. Is the string longer than 8 bytes, or the number greater than 64-bits?'))
        }
        let prefix = 'n'
        if (paramDec === 'fixed') {
            prefix = 'f'
        }
        const OptMem = Program.memory.find(MEM => {
            return MEM.asmName === prefix + Number('0x' + hexString) && MEM.hexContent === hexString
        })
        if (OptMem) {
            return { FlatMem: OptMem, asmCode: '', isNew: false }
        }
        const RetObj = Program.Context.getNewRegister()
        RetObj.declaration = paramDec
        let asmInstruction = ''
        if (hexString === '0000000000000000') {
            asmInstruction += `CLR @${RetObj.asmName}\n`
        } else {
            asmInstruction += `SET @${RetObj.asmName} #${hexString}\n`
        }
        return { FlatMem: RetObj, asmCode: asmInstruction, isNew: true }
    }

    return flattenMemoryMain()
}

/** Used in function calls. Mem shall be a memory not stuffed */
export function forceSetMemFromR0 (Program: CONTRACT, Mem: MEMORY_SLOT, line: string) {
    const Temp = flattenMemory(Program, Mem, line)
    if (Temp.isNew) {
        // Debug this, force set should be simple instruction
        throw new Error('Internal error')
    }
    return Temp.asmCode + `SET @${Temp.FlatMem.asmName} $r0\n`
}

/** Translate one single instruction from ast to assembly code */
export function createInstruction (
    Program: CONTRACT, OperatorToken: TOKEN, MemParam1?: MEMORY_SLOT, MemParam2?: MEMORY_SLOT,
    rLogic?:boolean, jpFalse?: string, jpTrue?:string
) : string {
    switch (OperatorToken.type) {
    case 'Assignment':
        return assignmentToAsm(
            Program,
            assertNotUndefined(MemParam1),
            assertNotUndefined(MemParam2),
            OperatorToken.line
        )
    case 'Operator':
    case 'SetOperator':
        return operatorToAsm(Program, OperatorToken, assertNotUndefined(MemParam1), assertNotUndefined(MemParam2))
    case 'UnaryOperator':
    case 'SetUnaryOperator':
        return unaryOperatorToAsm(OperatorToken, assertNotUndefined(MemParam1))
    case 'Comparision':
        return comparisionToAsm(
            Program,
            OperatorToken,
            assertNotUndefined(MemParam1),
            assertNotUndefined(MemParam2),
            assertNotUndefined(rLogic),
            assertNotUndefined(jpFalse),
            assertNotUndefined(jpTrue)
        )
    case 'Push': {
        const FlatParam = flattenMemory(Program, assertNotUndefined(MemParam1), OperatorToken.line)
        FlatParam.asmCode += `PSH $${FlatParam.FlatMem.asmName}\n`
        if (FlatParam.isNew === true) {
            Program.Context.freeRegister(FlatParam.FlatMem.address)
        }
        return FlatParam.asmCode
    }
    case 'Keyword':
        return keywordToAsm(Program, OperatorToken, MemParam1)
    default:
        throw new Error(`Internal error at line: ${OperatorToken.line}.`)
    }
}

/** Create instruction for SetUnaryOperator `++`, `--`. Create instruction for Unary operator `~` and `+`. */
function unaryOperatorToAsm (OperatorToken: TOKEN, Variable: MEMORY_SLOT): string {
    if (Variable.declaration === 'fixed') {
        switch (OperatorToken.value) {
        case '++':
            return `ADD @${Variable.asmName} $f100000000\n`
        case '--':
            return `SUB @${Variable.asmName} $f100000000\n`
        case '~':
            return `NOT @${Variable.asmName}\n`
        default:
            throw new Error(`Internal error at line: ${OperatorToken.line}.`)
        }
    }
    switch (OperatorToken.value) {
    case '++':
        return `INC @${Variable.asmName}\n`
    case '--':
        return `DEC @${Variable.asmName}\n`
    case '~':
        return `NOT @${Variable.asmName}\n`
    default:
        throw new Error(`Internal error at line: ${OperatorToken.line}.`)
    }
}
