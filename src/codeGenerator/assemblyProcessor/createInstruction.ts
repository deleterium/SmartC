import { assertExpression, assertNotUndefined } from '../../repository/repository'
import { MEMORY_SLOT, OFFSET_MODIFIER_CONSTANT, TOKEN } from '../../typings/syntaxTypes'
import { FLATTEN_MEMORY_RETURN_OBJECT, GENCODE_AUXVARS, GENCODE_SOLVED_OBJECT } from '../codeGeneratorTypes'

import utils from '../utils'
import assignmentToAsm from './assignmentToAsm'
import comparisionToAsm from './comparisionToAsm'
import keywordToAsm from './keywordToAsm'
import operatorToAsm from './operatorToAsm'

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
    AuxVars: GENCODE_AUXVARS, InSolved: GENCODE_SOLVED_OBJECT, line: number
) : GENCODE_SOLVED_OBJECT {
    const retObj = flattenMemory(AuxVars, InSolved.SolvedMem, line)

    if (!AuxVars.isTemp(retObj.FlatMem.address)) {
        const inType = utils.getDeclarationFromMemory(InSolved.SolvedMem)
        const TmpMemObj = AuxVars.getNewRegister(line)
        retObj.asmCode += `SET @${TmpMemObj.asmName} $${retObj.FlatMem.asmName}\n`
        utils.setMemoryDeclaration(TmpMemObj, inType)
        AuxVars.freeRegister(retObj.FlatMem.address)
        AuxVars.freeRegister(InSolved.SolvedMem.address)
        retObj.FlatMem = TmpMemObj
    }
    if (retObj.isNew === true) {
        AuxVars.freeRegister(InSolved.SolvedMem.address)
    }
    return {
        SolvedMem: retObj.FlatMem,
        asmCode: InSolved.asmCode + retObj.asmCode
    }
}

/** Create assembly code for one api function call */
export function createAPICallInstruction (
    AstAuxVars: GENCODE_AUXVARS, ApiToken: TOKEN, RetMem: MEMORY_SLOT, argsMem: MEMORY_SLOT[]
) : string {
    let assemblyCode = ''
    const tempArgsMem: MEMORY_SLOT[] = []
    argsMem.forEach((VarObj) => {
        const Temp = flattenMemory(AstAuxVars, VarObj, -1)
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
    tempArgsMem.forEach(Arg => AstAuxVars.freeRegister(Arg.address))
    return assemblyCode + '\n'
}

/** Create assembly code for built-in functions */
export function createBuiltInInstruction (
    AstAuxVars: GENCODE_AUXVARS, BuiltInToken: TOKEN, RetMem: MEMORY_SLOT, argsMem: MEMORY_SLOT[]
) : string {
    let memcopyType : 'SIMPLE' | 'MIXED_LEFT' | 'MIXED_RIGHT' | 'COMPLEX'
    let AuxRegister: MEMORY_SLOT
    let AuxRegisterA: MEMORY_SLOT
    let AuxRegisterB: MEMORY_SLOT
    let newJump: string
    let auxFlatMem: FLATTEN_MEMORY_RETURN_OBJECT
    let assemblyCode = ''

    switch (BuiltInToken.value) {
    case 'checkSignature':
    case 'distributeToHolders':
    case 'distributeToHoldersFx':
    case 'sendQuantityAndAmount':
    case 'sendQuantityAndAmountFx':
        return createBuiltIn4ArgsPlusInstruction(AstAuxVars, BuiltInToken, RetMem, argsMem)
    }

    const tempArgsMem = argsMem.map((VarObj) => flattenMemory(AstAuxVars, VarObj, BuiltInToken.line))
    switch (BuiltInToken.value) {
    case 'pow':
    case 'powf':
        assemblyCode = tempArgsMem[0].asmCode +
            `SET @${RetMem.asmName} $${tempArgsMem[0].FlatMem.asmName}\n` +
            tempArgsMem[1].asmCode +
            `POW @${RetMem.asmName} $${tempArgsMem[1].FlatMem.asmName}\n`
        break
    case 'mdv':
        assemblyCode = tempArgsMem[0].asmCode +
            `SET @${RetMem.asmName} $${tempArgsMem[0].FlatMem.asmName}\n` +
            tempArgsMem[1].asmCode +
            tempArgsMem[2].asmCode +
            `MDV @${RetMem.asmName} $${tempArgsMem[1].FlatMem.asmName} $${tempArgsMem[2].FlatMem.asmName}\n`
        break
    case 'memcopy':
        memcopyType = 'COMPLEX'
        if (argsMem[0].type === 'constant' || argsMem[1].type === 'constant') {
            if (argsMem[0].type === 'constant' && argsMem[1].type === 'constant') {
                memcopyType = 'SIMPLE'
            } else if (argsMem[0].type === 'constant') {
                memcopyType = 'MIXED_LEFT'
            } else {
                memcopyType = 'MIXED_RIGHT'
            }
        }
        switch (memcopyType) {
        case 'SIMPLE':
            argsMem[0].hexContent = assertNotUndefined(argsMem[0].hexContent)
            argsMem[1].hexContent = assertNotUndefined(argsMem[1].hexContent)
            assemblyCode = `SET @${AstAuxVars.getMemoryObjectByLocation(argsMem[0].hexContent).asmName} $${AstAuxVars.getMemoryObjectByLocation(argsMem[1].hexContent).asmName}\n`
            break
        case 'MIXED_LEFT':
            argsMem[0].hexContent = assertNotUndefined(argsMem[0].hexContent)
            assemblyCode = tempArgsMem[1].asmCode +
                `SET @${AstAuxVars.getMemoryObjectByLocation(argsMem[0].hexContent).asmName} $($${tempArgsMem[1].FlatMem.asmName})\n`
            break
        case 'MIXED_RIGHT':
            argsMem[1].hexContent = assertNotUndefined(argsMem[1].hexContent)
            assemblyCode = tempArgsMem[0].asmCode +
                `SET @($${tempArgsMem[0].FlatMem.asmName}) $${AstAuxVars.getMemoryObjectByLocation(argsMem[1].hexContent).asmName}\n`
            break
        default:
            // 'COMPLEX'
            AuxRegister = AstAuxVars.getNewRegister()
            assemblyCode = tempArgsMem[1].asmCode +
                tempArgsMem[0].asmCode +
                `SET @${AuxRegister.asmName} $($${tempArgsMem[1].FlatMem.asmName})\n` +
                `SET @($${tempArgsMem[0].FlatMem.asmName}) $${AuxRegister.asmName}\n`
            AstAuxVars.freeRegister(AuxRegister.address)
            break
        }
        break
    case 'getNextTx':
        newJump = '__GNT_' + AstAuxVars.getNewJumpID(BuiltInToken.line)
        assemblyCode = 'FUN A_to_Tx_after_Timestamp $_counterTimestamp\n' +
            `FUN @${RetMem.asmName} get_A1\n` +
            `BZR $${RetMem.asmName} :${newJump}\n` +
            'FUN @_counterTimestamp get_Timestamp_for_Tx_in_A\n' +
            `${newJump}:\n`
        break
    case 'getNextTxFromBlockheight':
        newJump = '__GNT_' + AstAuxVars.getNewJumpID(BuiltInToken.line)
        assemblyCode = tempArgsMem[0].asmCode
        if (AstAuxVars.isTemp(tempArgsMem[0].FlatMem.address)) {
            AuxRegister = tempArgsMem[0].FlatMem
        } else {
            AuxRegister = AstAuxVars.getNewRegister()
            assemblyCode += `SET @${AuxRegister.asmName} $${tempArgsMem[0].FlatMem.asmName}\n`
        }
        auxFlatMem = flattenMemory(AstAuxVars, utils.createConstantMemObj(32), BuiltInToken.line)
        assemblyCode += auxFlatMem.asmCode +
            `SHL @${AuxRegister.asmName} $${auxFlatMem.FlatMem.asmName}\n` +
            `FUN A_to_Tx_after_Timestamp $${AuxRegister.asmName}\n` +
            `FUN @${RetMem.asmName} get_A1\n` +
            `BZR $${RetMem.asmName} :${newJump}\n` +
            'FUN @_counterTimestamp get_Timestamp_for_Tx_in_A\n' +
            `${newJump}:\n`
        AstAuxVars.freeRegister(auxFlatMem.FlatMem.address)
        AstAuxVars.freeRegister(AuxRegister.address)
        break
    case 'getBlockheight':
        assemblyCode = tempArgsMem[0].asmCode +
            `FUN set_A1 $${tempArgsMem[0].FlatMem.asmName}\n` +
            `FUN @${RetMem.asmName} get_Timestamp_for_Tx_in_A\n`
        AstAuxVars.freeRegister(tempArgsMem[0].FlatMem.address)
        auxFlatMem = flattenMemory(AstAuxVars, utils.createConstantMemObj(32), BuiltInToken.line)
        assemblyCode += auxFlatMem.asmCode +
            `SHR @${RetMem.asmName} $${auxFlatMem.FlatMem.asmName}\n`
        AstAuxVars.freeRegister(auxFlatMem.FlatMem.address)
        break
    case 'getCurrentBlockheight':
        assemblyCode = `FUN @${RetMem.asmName} get_Block_Timestamp\n`
        auxFlatMem = flattenMemory(AstAuxVars, utils.createConstantMemObj(32), BuiltInToken.line)
        assemblyCode += auxFlatMem.asmCode +
            `SHR @${RetMem.asmName} $${auxFlatMem.FlatMem.asmName}\n`
        AstAuxVars.freeRegister(auxFlatMem.FlatMem.address)
        break
    case 'getAmount':
    case 'getAmountFx':
        auxFlatMem = flattenMemory(AstAuxVars, utils.createConstantMemObj(0n), BuiltInToken.line)
        assemblyCode = tempArgsMem[0].asmCode + auxFlatMem.asmCode +
            `FUN set_A1_A2 $${tempArgsMem[0].FlatMem.asmName} $${auxFlatMem.FlatMem.asmName}\n` +
            `FUN @${RetMem.asmName} get_Amount_for_Tx_in_A\n`
        AstAuxVars.freeRegister(auxFlatMem.FlatMem.address)
        break
    case 'getSender':
        assemblyCode = tempArgsMem[0].asmCode +
            `FUN set_A1 $${tempArgsMem[0].FlatMem.asmName}\n` +
            'FUN B_to_Address_of_Tx_in_A\n' +
            `FUN @${RetMem.asmName} get_B1\n`
        break
    case 'getType':
        assemblyCode = tempArgsMem[0].asmCode +
            `FUN set_A1 $${tempArgsMem[0].FlatMem.asmName}\n` +
            `FUN @${RetMem.asmName} get_Type_for_Tx_in_A\n`
        break
    case 'getCreator':
        auxFlatMem = flattenMemory(AstAuxVars, utils.createConstantMemObj(0n), BuiltInToken.line)
        assemblyCode = auxFlatMem.asmCode +
            `FUN set_B2 $${auxFlatMem.FlatMem.asmName}\n` +
            'FUN B_to_Address_of_Creator\n' +
            `FUN @${RetMem.asmName} get_B1\n`
        AstAuxVars.freeRegister(auxFlatMem.FlatMem.address)
        break
    case 'getCreatorOf':
        assemblyCode = tempArgsMem[0].asmCode +
            `FUN set_B2 $${tempArgsMem[0].FlatMem.asmName}\n` +
            'FUN B_to_Address_of_Creator\n' +
            `FUN @${RetMem.asmName} get_B1\n`
        break
    case 'getCodeHashOf':
        assemblyCode = tempArgsMem[0].asmCode +
            `FUN set_B2 $${tempArgsMem[0].FlatMem.asmName}\n` +
            `FUN @${RetMem.asmName} Get_Code_Hash_Id\n`
        break
    case 'getWeakRandomNumber':
        assemblyCode = 'FUN Put_Last_Block_GSig_In_A\n' +
        `FUN @${RetMem.asmName} get_A2\n`
        break
    case 'getActivationOf':
    case 'getActivationOfFx':
        assemblyCode = tempArgsMem[0].asmCode +
            `FUN set_B2 $${tempArgsMem[0].FlatMem.asmName}\n` +
            `FUN @${RetMem.asmName} Get_Activation_Fee\n`
        break
    case 'getCurrentBalance':
    case 'getCurrentBalanceFx':
        auxFlatMem = flattenMemory(AstAuxVars, utils.createConstantMemObj(0n), BuiltInToken.line)
        assemblyCode = auxFlatMem.asmCode +
            `FUN set_B2 $${auxFlatMem.FlatMem.asmName}\n` +
            `FUN @${RetMem.asmName} get_Current_Balance\n`
        AstAuxVars.freeRegister(auxFlatMem.FlatMem.address)
        break
    case 'readMessage':
        assemblyCode = tempArgsMem[0].asmCode + tempArgsMem[1].asmCode +
            `FUN set_A1_A2 $${tempArgsMem[0].FlatMem.asmName} $${tempArgsMem[1].FlatMem.asmName}\n` +
            'FUN message_from_Tx_in_A_to_B\n'
        AstAuxVars.freeRegister(tempArgsMem[0].FlatMem.address)
        AstAuxVars.freeRegister(tempArgsMem[1].FlatMem.address)
        if (argsMem[2].type === 'constant' || (argsMem[2].type === 'array' && argsMem[2].Offset === undefined)) {
            argsMem[2].hexContent = assertNotUndefined(argsMem[2].hexContent)
            const m1 = AstAuxVars.getMemoryObjectByLocation(argsMem[2].hexContent).asmName
            const m2 = AstAuxVars.getMemoryObjectByLocation(utils.addHexSimple(argsMem[2].hexContent, 1)).asmName
            const m3 = AstAuxVars.getMemoryObjectByLocation(utils.addHexSimple(argsMem[2].hexContent, 2)).asmName
            const m4 = AstAuxVars.getMemoryObjectByLocation(utils.addHexSimple(argsMem[2].hexContent, 3)).asmName
            assemblyCode +=
                `FUN @${m1} get_B1\n` +
                `FUN @${m2} get_B2\n` +
                `FUN @${m3} get_B3\n` +
                `FUN @${m4} get_B4\n`
            break
        }
        assemblyCode += tempArgsMem[2].asmCode
        if (AstAuxVars.isTemp(tempArgsMem[2].FlatMem.address)) {
            AuxRegister = tempArgsMem[2].FlatMem
        } else {
            AuxRegister = AstAuxVars.getNewRegister()
            assemblyCode += `SET @${AuxRegister.asmName} $${tempArgsMem[2].FlatMem.asmName}\n`
        }
        AuxRegisterA = AstAuxVars.getNewRegister()
        assemblyCode +=
            `FUN @${AuxRegisterA.asmName} get_B1\n` +
            `SET @($${AuxRegister.asmName}) $${AuxRegisterA.asmName}\n` +
            `FUN @${AuxRegisterA.asmName} get_B2\n` +
            `INC @${AuxRegister.asmName}\n` +
            `SET @($${AuxRegister.asmName}) $${AuxRegisterA.asmName}\n` +
            `FUN @${AuxRegisterA.asmName} get_B3\n` +
            `INC @${AuxRegister.asmName}\n` +
            `SET @($${AuxRegister.asmName}) $${AuxRegisterA.asmName}\n` +
            `FUN @${AuxRegisterA.asmName} get_B4\n` +
            `INC @${AuxRegister.asmName}\n` +
            `SET @($${AuxRegister.asmName}) $${AuxRegisterA.asmName}\n`
        AstAuxVars.freeRegister(AuxRegister.address)
        AstAuxVars.freeRegister(AuxRegisterA.address)
        break
    case 'sendMessage':
    case 'sendAmountAndMessage':
    case 'sendAmountAndMessageFx': {
        let amountArg = 0
        let messageArg = 1
        let recipientArg = 2
        if (BuiltInToken.value === 'sendMessage') {
            amountArg = -1
            messageArg = 0
            recipientArg = 1
        }
        if (amountArg !== -1) {
            auxFlatMem = flattenMemory(AstAuxVars, utils.createConstantMemObj(0n), BuiltInToken.line)
            assemblyCode = tempArgsMem[amountArg].asmCode + tempArgsMem[recipientArg].asmCode + auxFlatMem.asmCode +
                `FUN set_B1_B2 $${tempArgsMem[recipientArg].FlatMem.asmName} $${auxFlatMem.FlatMem.asmName}\n` +
                `FUN send_to_Address_in_B $${tempArgsMem[amountArg].FlatMem.asmName}\n`
            AstAuxVars.freeRegister(tempArgsMem[amountArg].FlatMem.address)
            AstAuxVars.freeRegister(auxFlatMem.FlatMem.address)
        } else {
            assemblyCode = tempArgsMem[recipientArg].asmCode +
                `FUN set_B1 $${tempArgsMem[recipientArg].FlatMem.asmName}\n`
        }
        AstAuxVars.freeRegister(tempArgsMem[recipientArg].FlatMem.address)
        if (argsMem[messageArg].type === 'constant' || (argsMem[messageArg].type === 'array' && argsMem[messageArg].Offset === undefined)) {
            const theHexContent = assertNotUndefined(argsMem[messageArg].hexContent)
            const m1 = AstAuxVars.getMemoryObjectByLocation(theHexContent).asmName
            const m2 = AstAuxVars.getMemoryObjectByLocation(utils.addHexSimple(theHexContent, 1)).asmName
            const m3 = AstAuxVars.getMemoryObjectByLocation(utils.addHexSimple(theHexContent, 2)).asmName
            const m4 = AstAuxVars.getMemoryObjectByLocation(utils.addHexSimple(theHexContent, 3)).asmName
            assemblyCode +=
                `FUN set_A1_A2 $${m1} $${m2}\n` +
                `FUN set_A3_A4 $${m3} $${m4}\n` +
                'FUN send_A_to_Address_in_B\n'
            break
        }
        assemblyCode += tempArgsMem[messageArg].asmCode
        if (AstAuxVars.isTemp(tempArgsMem[messageArg].FlatMem.address)) {
            AuxRegister = tempArgsMem[messageArg].FlatMem
        } else {
            AuxRegister = AstAuxVars.getNewRegister()
            assemblyCode += `SET @${AuxRegister.asmName} $${tempArgsMem[messageArg].FlatMem.asmName}\n`
        }
        AuxRegisterA = AstAuxVars.getNewRegister()
        AuxRegisterB = AstAuxVars.getNewRegister()
        assemblyCode +=
            `SET @${AuxRegisterA.asmName} $($${AuxRegister.asmName})\n` +
            `INC @${AuxRegister.asmName}\n` +
            `SET @${AuxRegisterB.asmName} $($${AuxRegister.asmName})\n` +
            `FUN set_A1_A2 $${AuxRegisterA.asmName} $${AuxRegisterB.asmName}\n` +
            `INC @${AuxRegister.asmName}\n` +
            `SET @${AuxRegisterA.asmName} $($${AuxRegister.asmName})\n` +
            `INC @${AuxRegister.asmName}\n` +
            `SET @${AuxRegisterB.asmName} $($${AuxRegister.asmName})\n` +
            `FUN set_A3_A4 $${AuxRegisterA.asmName} $${AuxRegisterB.asmName}\n` +
            'FUN send_A_to_Address_in_B\n'
        AstAuxVars.freeRegister(AuxRegister.address)
        AstAuxVars.freeRegister(AuxRegisterA.address)
        AstAuxVars.freeRegister(AuxRegisterB.address)
        break
    }
    case 'sendAmount':
    case 'sendAmountFx':
        auxFlatMem = flattenMemory(AstAuxVars, utils.createConstantMemObj(0n), BuiltInToken.line)
        assemblyCode = tempArgsMem[0].asmCode + tempArgsMem[1].asmCode + auxFlatMem.asmCode +
            `FUN set_B1_B2 $${tempArgsMem[1].FlatMem.asmName} $${auxFlatMem.FlatMem.asmName}\n` +
            `FUN send_to_Address_in_B $${tempArgsMem[0].FlatMem.asmName}\n`
        AstAuxVars.freeRegister(auxFlatMem.FlatMem.address)
        break
    case 'sendBalance':
        assemblyCode = tempArgsMem[0].asmCode +
            `FUN set_B1 $${tempArgsMem[0].FlatMem.asmName}\n` +
            'FUN send_All_to_Address_in_B\n'
        break
    case 'getMapValue':
    case 'getMapValueFx':
        auxFlatMem = flattenMemory(AstAuxVars, utils.createConstantMemObj(0n), BuiltInToken.line)
        assemblyCode = tempArgsMem[0].asmCode + tempArgsMem[1].asmCode + auxFlatMem.asmCode +
            `FUN set_A1_A2 $${tempArgsMem[0].FlatMem.asmName} $${tempArgsMem[1].FlatMem.asmName}\n` +
            `FUN set_A3 $${auxFlatMem.FlatMem.asmName}\n` +
            `FUN @${RetMem.asmName} Get_Map_Value_Keys_In_A\n`
        AstAuxVars.freeRegister(auxFlatMem.FlatMem.address)
        break
    case 'getExtMapValue':
    case 'getExtMapValueFx':
        assemblyCode = tempArgsMem[0].asmCode + tempArgsMem[1].asmCode + tempArgsMem[2].asmCode +
            `FUN set_A1_A2 $${tempArgsMem[0].FlatMem.asmName} $${tempArgsMem[1].FlatMem.asmName}\n` +
            `FUN set_A3 $${tempArgsMem[2].FlatMem.asmName}\n` +
            `FUN @${RetMem.asmName} Get_Map_Value_Keys_In_A\n`
        break
    case 'setMapValue':
    case 'setMapValueFx':
        assemblyCode = tempArgsMem[0].asmCode + tempArgsMem[1].asmCode + tempArgsMem[2].asmCode +
            `FUN set_A1_A2 $${tempArgsMem[0].FlatMem.asmName} $${tempArgsMem[1].FlatMem.asmName}\n` +
            `FUN set_A4 $${tempArgsMem[2].FlatMem.asmName}\n` +
            'FUN Set_Map_Value_Keys_In_A\n'
        break
    case 'issueAsset':
        assemblyCode = tempArgsMem[0].asmCode + tempArgsMem[1].asmCode + tempArgsMem[2].asmCode +
            `FUN set_A1_A2 $${tempArgsMem[0].FlatMem.asmName} $${tempArgsMem[1].FlatMem.asmName}\n` +
            `FUN set_B1 $${tempArgsMem[2].FlatMem.asmName}\n` +
            `FUN @${RetMem.asmName} Issue_Asset\n`
        break
    case 'mintAsset':
        assemblyCode = tempArgsMem[0].asmCode + tempArgsMem[1].asmCode +
        `FUN set_B1_B2 $${tempArgsMem[0].FlatMem.asmName} $${tempArgsMem[1].FlatMem.asmName}\n` +
        'FUN Mint_Asset\n'
        break
    case 'sendQuantity':
        auxFlatMem = flattenMemory(AstAuxVars, utils.createConstantMemObj(0n), BuiltInToken.line)
        assemblyCode = tempArgsMem[0].asmCode + tempArgsMem[1].asmCode + tempArgsMem[2].asmCode + auxFlatMem.asmCode +
                `FUN set_B1_B2 $${tempArgsMem[2].FlatMem.asmName} $${tempArgsMem[1].FlatMem.asmName}\n` +
                `FUN set_B3 $${auxFlatMem.FlatMem.asmName}\n` +
                `FUN send_to_Address_in_B $${tempArgsMem[0].FlatMem.asmName}\n`
        break
    case 'getAssetBalance':
        assemblyCode = tempArgsMem[0].asmCode +
            `FUN set_B2 $${tempArgsMem[0].FlatMem.asmName}\n` +
            `FUN @${RetMem.asmName} get_Current_Balance\n`
        break
    case 'getAssetHoldersCount':
        assemblyCode = tempArgsMem[0].asmCode + tempArgsMem[1].asmCode +
            `FUN set_B1_B2 $${tempArgsMem[0].FlatMem.asmName} $${tempArgsMem[1].FlatMem.asmName}\n` +
            `FUN @${RetMem.asmName} Get_Asset_Holders_Count\n`
        break
    case 'readAssets':
        assemblyCode = tempArgsMem[0].asmCode +
            `FUN set_A1 $${tempArgsMem[0].FlatMem.asmName}\n` +
            'FUN B_To_Assets_Of_Tx_In_A\n'
        if (argsMem[1].type === 'constant' || (argsMem[1].type === 'array' && argsMem[1].Offset === undefined)) {
            argsMem[1].hexContent = assertNotUndefined(argsMem[1].hexContent)
            const m1 = AstAuxVars.getMemoryObjectByLocation(argsMem[1].hexContent).asmName
            const m2 = AstAuxVars.getMemoryObjectByLocation(utils.addHexSimple(argsMem[1].hexContent, 1)).asmName
            const m3 = AstAuxVars.getMemoryObjectByLocation(utils.addHexSimple(argsMem[1].hexContent, 2)).asmName
            const m4 = AstAuxVars.getMemoryObjectByLocation(utils.addHexSimple(argsMem[1].hexContent, 3)).asmName
            assemblyCode +=
                `FUN @${m1} get_B1\n` +
                `FUN @${m2} get_B2\n` +
                `FUN @${m3} get_B3\n` +
                `FUN @${m4} get_B4\n`
            break
        }
        AstAuxVars.freeRegister(tempArgsMem[0].FlatMem.address)
        assemblyCode += tempArgsMem[1].asmCode
        if (AstAuxVars.isTemp(tempArgsMem[1].FlatMem.address)) {
            AuxRegister = tempArgsMem[1].FlatMem
        } else {
            AuxRegister = AstAuxVars.getNewRegister()
            assemblyCode += `SET @${AuxRegister.asmName} $${tempArgsMem[1].FlatMem.asmName}\n`
        }
        AuxRegisterA = AstAuxVars.getNewRegister()
        assemblyCode +=
            `FUN @${AuxRegisterA.asmName} get_B1\n` +
            `SET @($${AuxRegister.asmName}) $${AuxRegisterA.asmName}\n` +
            `FUN @${AuxRegisterA.asmName} get_B2\n` +
            `INC @${AuxRegister.asmName}\n` +
            `SET @($${AuxRegister.asmName}) $${AuxRegisterA.asmName}\n` +
            `FUN @${AuxRegisterA.asmName} get_B3\n` +
            `INC @${AuxRegister.asmName}\n` +
            `SET @($${AuxRegister.asmName}) $${AuxRegisterA.asmName}\n` +
            `FUN @${AuxRegisterA.asmName} get_B4\n` +
            `INC @${AuxRegister.asmName}\n` +
            `SET @($${AuxRegister.asmName}) $${AuxRegisterA.asmName}\n`
        AstAuxVars.freeRegister(AuxRegister.address)
        AstAuxVars.freeRegister(AuxRegisterA.address)
        break
    case 'getQuantity':
        assemblyCode = tempArgsMem[0].asmCode + tempArgsMem[1].asmCode +
            `FUN set_A1_A2 $${tempArgsMem[0].FlatMem.asmName} $${tempArgsMem[1].FlatMem.asmName}\n` +
            `FUN @${RetMem.asmName} get_Amount_for_Tx_in_A\n`
        break
    case 'getAssetCirculating':
        assemblyCode = tempArgsMem[0].asmCode +
            `FUN set_A2 $${tempArgsMem[0].FlatMem.asmName}\n` +
            `FUN @${RetMem.asmName} Get_Asset_Circulating\n`
        break
    default:
        throw new Error(`Internal error at line: ${BuiltInToken.line}. Built-in function not implemented.`)
    }
    tempArgsMem.forEach(tmpArg => {
        if (tmpArg.isNew) {
            AstAuxVars.freeRegister(tmpArg.FlatMem.address)
        }
    })
    return assemblyCode
}

/** Create assembly code for built-in functions */
export function createBuiltIn4ArgsPlusInstruction (
    AstAuxVars: GENCODE_AUXVARS, BuiltInToken: TOKEN, RetMem: MEMORY_SLOT, argsMem: MEMORY_SLOT[]
) : string {
    let auxFlatMemA: FLATTEN_MEMORY_RETURN_OBJECT
    let auxFlatMemB: FLATTEN_MEMORY_RETURN_OBJECT
    let assemblyCode = ''

    switch (BuiltInToken.value) {
    case 'checkSignature':
        auxFlatMemA = flattenMemory(AstAuxVars, argsMem[3], BuiltInToken.line)
        auxFlatMemB = flattenMemory(AstAuxVars, argsMem[4], BuiltInToken.line)
        assemblyCode += auxFlatMemA.asmCode + auxFlatMemB.asmCode +
            `FUN set_A1_A2 $${auxFlatMemA.FlatMem.asmName} $${auxFlatMemB.FlatMem.asmName}\n`
        AstAuxVars.freeRegister(auxFlatMemA.FlatMem.address)
        AstAuxVars.freeRegister(auxFlatMemB.FlatMem.address)
        auxFlatMemA = flattenMemory(AstAuxVars, argsMem[5], BuiltInToken.line)
        auxFlatMemB = flattenMemory(AstAuxVars, argsMem[0], BuiltInToken.line)
        assemblyCode += auxFlatMemA.asmCode + auxFlatMemB.asmCode +
            `FUN set_A3 $${auxFlatMemA.FlatMem.asmName}\n` +
            `FUN set_B2 $${auxFlatMemB.FlatMem.asmName}\n`
        AstAuxVars.freeRegister(auxFlatMemA.FlatMem.address)
        AstAuxVars.freeRegister(auxFlatMemB.FlatMem.address)

        auxFlatMemA = flattenMemory(AstAuxVars, argsMem[1], BuiltInToken.line)
        auxFlatMemB = flattenMemory(AstAuxVars, argsMem[2], BuiltInToken.line)
        assemblyCode += auxFlatMemA.asmCode + auxFlatMemB.asmCode +
            `FUN set_B3_B4 $${auxFlatMemA.FlatMem.asmName} $${auxFlatMemB.FlatMem.asmName}\n` +
            `FUN @${RetMem.asmName} Check_Sig_B_With_A\n`
        AstAuxVars.freeRegister(auxFlatMemA.FlatMem.address)
        AstAuxVars.freeRegister(auxFlatMemB.FlatMem.address)
        return assemblyCode
    case 'distributeToHolders':
    case 'distributeToHoldersFx':
        auxFlatMemA = flattenMemory(AstAuxVars, argsMem[0], BuiltInToken.line)
        auxFlatMemB = flattenMemory(AstAuxVars, argsMem[1], BuiltInToken.line)
        assemblyCode += auxFlatMemA.asmCode + auxFlatMemB.asmCode +
            `FUN set_B1_B2 $${auxFlatMemA.FlatMem.asmName} $${auxFlatMemB.FlatMem.asmName}\n`
        AstAuxVars.freeRegister(auxFlatMemA.FlatMem.address)
        AstAuxVars.freeRegister(auxFlatMemB.FlatMem.address)

        auxFlatMemA = flattenMemory(AstAuxVars, argsMem[2], BuiltInToken.line)
        assemblyCode += auxFlatMemA.asmCode +
            `FUN set_A1 $${auxFlatMemA.FlatMem.asmName}\n`
        AstAuxVars.freeRegister(auxFlatMemA.FlatMem.address)

        auxFlatMemA = flattenMemory(AstAuxVars, argsMem[3], BuiltInToken.line)
        auxFlatMemB = flattenMemory(AstAuxVars, argsMem[4], BuiltInToken.line)
        assemblyCode += auxFlatMemA.asmCode + auxFlatMemB.asmCode +
            `FUN set_A3_A4 $${auxFlatMemA.FlatMem.asmName} $${auxFlatMemB.FlatMem.asmName}\n` +
            'FUN Distribute_To_Asset_Holders\n'
        AstAuxVars.freeRegister(auxFlatMemA.FlatMem.address)
        AstAuxVars.freeRegister(auxFlatMemB.FlatMem.address)
        return assemblyCode
    case 'sendQuantityAndAmount':
    case 'sendQuantityAndAmountFx':
        auxFlatMemA = flattenMemory(AstAuxVars, argsMem[3], BuiltInToken.line)
        auxFlatMemB = flattenMemory(AstAuxVars, argsMem[1], BuiltInToken.line)
        assemblyCode += auxFlatMemA.asmCode + auxFlatMemB.asmCode +
            `FUN set_B1_B2 $${auxFlatMemA.FlatMem.asmName} $${auxFlatMemB.FlatMem.asmName}\n`
        AstAuxVars.freeRegister(auxFlatMemA.FlatMem.address)
        AstAuxVars.freeRegister(auxFlatMemB.FlatMem.address)
        auxFlatMemA = flattenMemory(AstAuxVars, argsMem[2], BuiltInToken.line)
        auxFlatMemB = flattenMemory(AstAuxVars, argsMem[0], BuiltInToken.line)
        assemblyCode += auxFlatMemA.asmCode + auxFlatMemB.asmCode +
            `FUN set_B3 $${auxFlatMemA.FlatMem.asmName}\n` +
            `FUN send_to_Address_in_B $${auxFlatMemB.FlatMem.asmName}\n`
        AstAuxVars.freeRegister(auxFlatMemA.FlatMem.address)
        AstAuxVars.freeRegister(auxFlatMemB.FlatMem.address)
        return assemblyCode
    default:
        throw new Error('Internal error')
    }
}

/**
 * From ParamMemObj create an memory object suitable for assembly operations (a regular long variable).
 * Do do rely in createInstruction, all hardwork done internally. Returns also instructions maybe needed for
 * conversion and a boolean to indicate if it is a new object (that must be free later on).
*/
export function flattenMemory (
    AuxVars: GENCODE_AUXVARS, StuffedMemory: MEMORY_SLOT, line: number
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
            RetObj = AuxVars.getNewRegister()
            RetObj.declaration = paramDec
            const offsetVarName = AuxVars.getMemoryObjectByLocation(StuffedMemory.Offset.addr, line).asmName
            retInstructions += `SET @${RetObj.asmName} $($${StuffedMemory.asmName} + $${offsetVarName})\n`
            return { FlatMem: RetObj, asmCode: retInstructions, isNew: true }
        }
        // StuffedMemory.Offset.type is 'constant'
        let FlatConstant: FLATTEN_MEMORY_RETURN_OBJECT
        switch (StuffedMemory.type) {
        case 'register':
        case 'long':
        case 'structRef':
            RetObj = AuxVars.getNewRegister()
            RetObj.declaration = paramDec
            if (StuffedMemory.Offset.value === 0) {
                retInstructions += `SET @${RetObj.asmName} $($${StuffedMemory.asmName})\n`
                return { FlatMem: RetObj, asmCode: retInstructions, isNew: true }
            }
            FlatConstant = flattenConstant(StuffedMemory.Offset.value)
            retInstructions += FlatConstant.asmCode
            retInstructions += `SET @${RetObj.asmName} $($${StuffedMemory.asmName} + $${FlatConstant.FlatMem.asmName})\n`
            if (FlatConstant.isNew) {
                AuxVars.freeRegister(FlatConstant.FlatMem.address)
            }
            return { FlatMem: RetObj, asmCode: retInstructions, isNew: true }
        case 'array':
            // Looks like an array but can be converted to regular variable
            RetObj = AuxVars.getMemoryObjectByLocation(
                utils.addHexSimple(StuffedMemory.hexContent, StuffedMemory.Offset.value), line
            )
            AuxVars.freeRegister(StuffedMemory.address)
            return { FlatMem: RetObj, asmCode: retInstructions, isNew: true }
        default:
            throw new Error(`Internal error at line: ${line}. Not implemented type in flattenMemory()`)
        }
    }

    function flattenConstantWithOffsetConstant (ConstOffset: OFFSET_MODIFIER_CONSTANT) : FLATTEN_MEMORY_RETURN_OBJECT {
        const deferencedVar = AuxVars.getMemoryObjectByLocation(utils.addHexSimple(ConstOffset.value, StuffedMemory.hexContent), line)
        if (AuxVars.isTemp(deferencedVar.address)) {
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
        assertExpression(hexString.length <= 16)
        let prefix = 'n'
        if (paramDec === 'fixed') {
            prefix = 'f'
        }
        const OptMem = AuxVars.memory.find(MEM => {
            return MEM.asmName === prefix + Number('0x' + hexString) && MEM.hexContent === hexString
        })
        if (OptMem) {
            return { FlatMem: OptMem, asmCode: '', isNew: false }
        }
        const RetObj = AuxVars.getNewRegister()
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

/** Translate one single instruction from ast to assembly code */
export function createInstruction (
    AuxVars: GENCODE_AUXVARS, OperatorToken: TOKEN, MemParam1?: MEMORY_SLOT, MemParam2?: MEMORY_SLOT,
    rLogic?:boolean, jpFalse?: string, jpTrue?:string
) : string {
    switch (OperatorToken.type) {
    case 'Assignment':
        return assignmentToAsm(
            AuxVars,
            assertNotUndefined(MemParam1),
            assertNotUndefined(MemParam2),
            OperatorToken.line
        )
    case 'Operator':
    case 'SetOperator':
        return operatorToAsm(AuxVars, OperatorToken, assertNotUndefined(MemParam1), assertNotUndefined(MemParam2))
    case 'UnaryOperator':
    case 'SetUnaryOperator':
        return unaryOperatorToAsm(OperatorToken, assertNotUndefined(MemParam1))
    case 'Comparision':
        return comparisionToAsm(
            AuxVars,
            OperatorToken,
            assertNotUndefined(MemParam1),
            assertNotUndefined(MemParam2),
            assertNotUndefined(rLogic),
            assertNotUndefined(jpFalse),
            assertNotUndefined(jpTrue)
        )
    case 'Push': {
        const FlatParam = flattenMemory(AuxVars, assertNotUndefined(MemParam1), OperatorToken.line)
        FlatParam.asmCode += `PSH $${FlatParam.FlatMem.asmName}\n`
        if (FlatParam.isNew === true) {
            AuxVars.freeRegister(FlatParam.FlatMem.address)
        }
        return FlatParam.asmCode
    }
    case 'Keyword':
        return keywordToAsm(AuxVars, OperatorToken, MemParam1)
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
