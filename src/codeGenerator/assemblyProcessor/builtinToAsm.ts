import { assertNotUndefined } from '../../repository/repository'
import { CONTRACT } from '../../typings/contractTypes'
import { BUILTIN_TYPES, MEMORY_SLOT, TOKEN } from '../../typings/syntaxTypes'
import { FLATTEN_MEMORY_RETURN_OBJECT } from '../codeGeneratorTypes'

import utils from '../utils'
import { flattenMemory } from './createInstruction'

/** Create assembly code for built-in functions */
export function createBuiltinInstruction (
    Program: CONTRACT, BuiltinToken: TOKEN, builtinType: BUILTIN_TYPES|undefined, RetMem: MEMORY_SLOT, argsMem: MEMORY_SLOT[]
) : string {
    let AuxRegister: MEMORY_SLOT
    let auxFlatMem: FLATTEN_MEMORY_RETURN_OBJECT
    let assemblyCode = ''

    function createBuiltinInstructionMain () : string {
        switch (builtinType) {
        case 'fourArgsPlus':
            return fourArgsPlusToAsm()
        case 'loop':
            return loopToAsm()
        case 'special':
            return specialToAsm()
        case 'internal':
            return internalToAsm()
        case 'blockchain':
            return blockchainToAsm()
        case 'receive':
            return receiveToAsm()
        case 'send':
            return sendToAsm()
        case 'contract':
            return contractToAsm()
        case 'maps':
            return mapsToAsm()
        case 'assets':
            return assetsToAsm()
        default:
            throw new Error('Internal error')
        }
    }

    function freeAll (tmpArg: FLATTEN_MEMORY_RETURN_OBJECT) {
        if (tmpArg.isNew) {
            Program.Context.freeRegister(tmpArg.FlatMem.address)
        }
    }

    /** Create assembly code for built-in functions */
    function fourArgsPlusToAsm () : string {
        let auxFlatMemA: FLATTEN_MEMORY_RETURN_OBJECT
        let auxFlatMemB: FLATTEN_MEMORY_RETURN_OBJECT

        switch (BuiltinToken.value) {
        case 'checkSignature':
            auxFlatMemA = flattenMemory(Program, argsMem[3], BuiltinToken.line)
            auxFlatMemB = flattenMemory(Program, argsMem[4], BuiltinToken.line)
            assemblyCode += auxFlatMemA.asmCode + auxFlatMemB.asmCode +
                `FUN set_A1_A2 $${auxFlatMemA.FlatMem.asmName} $${auxFlatMemB.FlatMem.asmName}\n`
            Program.Context.freeRegister(auxFlatMemA.FlatMem.address)
            Program.Context.freeRegister(auxFlatMemB.FlatMem.address)
            auxFlatMemA = flattenMemory(Program, argsMem[5], BuiltinToken.line)
            auxFlatMemB = flattenMemory(Program, argsMem[0], BuiltinToken.line)
            assemblyCode += auxFlatMemA.asmCode + auxFlatMemB.asmCode +
                `FUN set_A3 $${auxFlatMemA.FlatMem.asmName}\n` +
                `FUN set_B2 $${auxFlatMemB.FlatMem.asmName}\n`
            Program.Context.freeRegister(auxFlatMemA.FlatMem.address)
            Program.Context.freeRegister(auxFlatMemB.FlatMem.address)

            auxFlatMemA = flattenMemory(Program, argsMem[1], BuiltinToken.line)
            auxFlatMemB = flattenMemory(Program, argsMem[2], BuiltinToken.line)
            assemblyCode += auxFlatMemA.asmCode + auxFlatMemB.asmCode +
                `FUN set_B3_B4 $${auxFlatMemA.FlatMem.asmName} $${auxFlatMemB.FlatMem.asmName}\n` +
                `FUN @${RetMem.asmName} Check_Sig_B_With_A\n`
            Program.Context.freeRegister(auxFlatMemA.FlatMem.address)
            Program.Context.freeRegister(auxFlatMemB.FlatMem.address)
            return assemblyCode
        case 'distributeToHolders':
        case 'distributeToHoldersFx':
            auxFlatMemA = flattenMemory(Program, argsMem[0], BuiltinToken.line)
            auxFlatMemB = flattenMemory(Program, argsMem[1], BuiltinToken.line)
            assemblyCode += auxFlatMemA.asmCode + auxFlatMemB.asmCode +
                `FUN set_B1_B2 $${auxFlatMemA.FlatMem.asmName} $${auxFlatMemB.FlatMem.asmName}\n`
            Program.Context.freeRegister(auxFlatMemA.FlatMem.address)
            Program.Context.freeRegister(auxFlatMemB.FlatMem.address)

            auxFlatMemA = flattenMemory(Program, argsMem[2], BuiltinToken.line)
            assemblyCode += auxFlatMemA.asmCode +
                `FUN set_A1 $${auxFlatMemA.FlatMem.asmName}\n`
            Program.Context.freeRegister(auxFlatMemA.FlatMem.address)

            auxFlatMemA = flattenMemory(Program, argsMem[3], BuiltinToken.line)
            auxFlatMemB = flattenMemory(Program, argsMem[4], BuiltinToken.line)
            assemblyCode += auxFlatMemA.asmCode + auxFlatMemB.asmCode +
                `FUN set_A3_A4 $${auxFlatMemA.FlatMem.asmName} $${auxFlatMemB.FlatMem.asmName}\n` +
                'FUN Distribute_To_Asset_Holders\n'
            Program.Context.freeRegister(auxFlatMemA.FlatMem.address)
            Program.Context.freeRegister(auxFlatMemB.FlatMem.address)
            return assemblyCode
        case 'sendQuantityAndAmount':
        case 'sendQuantityAndAmountFx':
            auxFlatMemA = flattenMemory(Program, argsMem[3], BuiltinToken.line)
            auxFlatMemB = flattenMemory(Program, argsMem[1], BuiltinToken.line)
            assemblyCode += auxFlatMemA.asmCode + auxFlatMemB.asmCode +
                `FUN set_B1_B2 $${auxFlatMemA.FlatMem.asmName} $${auxFlatMemB.FlatMem.asmName}\n`
            Program.Context.freeRegister(auxFlatMemA.FlatMem.address)
            Program.Context.freeRegister(auxFlatMemB.FlatMem.address)
            auxFlatMemA = flattenMemory(Program, argsMem[2], BuiltinToken.line)
            auxFlatMemB = flattenMemory(Program, argsMem[0], BuiltinToken.line)
            assemblyCode += auxFlatMemA.asmCode + auxFlatMemB.asmCode +
                `FUN set_B3 $${auxFlatMemA.FlatMem.asmName}\n` +
                `FUN send_to_Address_in_B $${auxFlatMemB.FlatMem.asmName}\n`
            Program.Context.freeRegister(auxFlatMemA.FlatMem.address)
            Program.Context.freeRegister(auxFlatMemB.FlatMem.address)
            return assemblyCode
        default:
            throw new Error('Internal error')
        }
    }

    function loopToAsm () : string {
        const newJump = '__GNT_' + Program.Context.getNewJumpID()
        const tempArgsMem = argsMem.map((VarObj) => flattenMemory(Program, VarObj, BuiltinToken.line))
        switch (BuiltinToken.value) {
        case 'getNextTx':
            assemblyCode = 'FUN A_to_Tx_after_Timestamp $_counterTimestamp\n' +
                `FUN @${RetMem.asmName} get_A1\n` +
                `BZR $${RetMem.asmName} :${newJump}\n` +
                'FUN @_counterTimestamp get_Timestamp_for_Tx_in_A\n' +
                `${newJump}:\n`
            break
        case 'getNextTxFromBlockheight':
            assemblyCode = tempArgsMem[0].asmCode
            if (Program.Context.isTemp(tempArgsMem[0].FlatMem.address)) {
                AuxRegister = tempArgsMem[0].FlatMem
            } else {
                AuxRegister = Program.Context.getNewRegister()
                assemblyCode += `SET @${AuxRegister.asmName} $${tempArgsMem[0].FlatMem.asmName}\n`
            }
            auxFlatMem = flattenMemory(Program, utils.createConstantMemObj(32), BuiltinToken.line)
            assemblyCode += auxFlatMem.asmCode +
                `SHL @${AuxRegister.asmName} $${auxFlatMem.FlatMem.asmName}\n` +
                `FUN A_to_Tx_after_Timestamp $${AuxRegister.asmName}\n` +
                `FUN @${RetMem.asmName} get_A1\n` +
                `BZR $${RetMem.asmName} :${newJump}\n` +
                'FUN @_counterTimestamp get_Timestamp_for_Tx_in_A\n' +
                `${newJump}:\n`
            Program.Context.freeRegister(auxFlatMem.FlatMem.address)
            Program.Context.freeRegister(AuxRegister.address)
            break
        default:
            throw new Error('Internal error')
        }
        tempArgsMem.forEach(freeAll)
        return assemblyCode
    }

    function specialToAsm () : string {
        const tempArgsMem = argsMem.map((VarObj) => flattenMemory(Program, VarObj, BuiltinToken.line))
        switch (BuiltinToken.value) {
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
        default:
            throw new Error('Internal error')
        }
        tempArgsMem.forEach(freeAll)
        return assemblyCode
    }

    function internalToAsm () : string {
        let memcopyType : 'SIMPLE' | 'MIXED_LEFT' | 'MIXED_RIGHT' | 'COMPLEX'
        const tempArgsMem = argsMem.map((VarObj) => flattenMemory(Program, VarObj, BuiltinToken.line))
        if (BuiltinToken.value === 'memcopy') {
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
                assemblyCode = `SET @${Program.Context.getMemoryObjectByLocation(argsMem[0].hexContent).asmName} $${Program.Context.getMemoryObjectByLocation(argsMem[1].hexContent).asmName}\n`
                break
            case 'MIXED_LEFT':
                argsMem[0].hexContent = assertNotUndefined(argsMem[0].hexContent)
                assemblyCode = tempArgsMem[1].asmCode +
                    `SET @${Program.Context.getMemoryObjectByLocation(argsMem[0].hexContent).asmName} $($${tempArgsMem[1].FlatMem.asmName})\n`
                break
            case 'MIXED_RIGHT':
                argsMem[1].hexContent = assertNotUndefined(argsMem[1].hexContent)
                assemblyCode = tempArgsMem[0].asmCode +
                    `SET @($${tempArgsMem[0].FlatMem.asmName}) $${Program.Context.getMemoryObjectByLocation(argsMem[1].hexContent).asmName}\n`
                break
            default:
                // 'COMPLEX'
                AuxRegister = Program.Context.getNewRegister()
                assemblyCode = tempArgsMem[1].asmCode +
                    tempArgsMem[0].asmCode +
                    `SET @${AuxRegister.asmName} $($${tempArgsMem[1].FlatMem.asmName})\n` +
                    `SET @($${tempArgsMem[0].FlatMem.asmName}) $${AuxRegister.asmName}\n`
                Program.Context.freeRegister(AuxRegister.address)
                break
            }
            tempArgsMem.forEach(freeAll)
            return assemblyCode
        }
        throw new Error('Internal error')
    }

    function blockchainToAsm () : string {
        switch (BuiltinToken.value) {
        case 'getCurrentBlockheight':
            assemblyCode = `FUN @${RetMem.asmName} get_Block_Timestamp\n`
            auxFlatMem = flattenMemory(Program, utils.createConstantMemObj(32), BuiltinToken.line)
            assemblyCode += auxFlatMem.asmCode +
                `SHR @${RetMem.asmName} $${auxFlatMem.FlatMem.asmName}\n`
            Program.Context.freeRegister(auxFlatMem.FlatMem.address)
            break
        case 'getWeakRandomNumber':
            assemblyCode = 'FUN Put_Last_Block_GSig_In_A\n' +
                `FUN @${RetMem.asmName} get_A2\n`
            break
        default:
            throw new Error('Internal error')
        }
        return assemblyCode
    }

    function receiveToAsm () : string {
        let AuxRegisterA: MEMORY_SLOT
        const tempArgsMem = argsMem.map((VarObj) => flattenMemory(Program, VarObj, BuiltinToken.line))
        switch (BuiltinToken.value) {
        case 'getBlockheight':
            assemblyCode = tempArgsMem[0].asmCode +
                `FUN set_A1 $${tempArgsMem[0].FlatMem.asmName}\n` +
                `FUN @${RetMem.asmName} get_Timestamp_for_Tx_in_A\n`
            Program.Context.freeRegister(tempArgsMem[0].FlatMem.address)
            auxFlatMem = flattenMemory(Program, utils.createConstantMemObj(32), BuiltinToken.line)
            assemblyCode += auxFlatMem.asmCode +
                `SHR @${RetMem.asmName} $${auxFlatMem.FlatMem.asmName}\n`
            Program.Context.freeRegister(auxFlatMem.FlatMem.address)
            break
        case 'getAmount':
        case 'getAmountFx':
            auxFlatMem = flattenMemory(Program, utils.createConstantMemObj(0n), BuiltinToken.line)
            assemblyCode = tempArgsMem[0].asmCode + auxFlatMem.asmCode +
                `FUN set_A1_A2 $${tempArgsMem[0].FlatMem.asmName} $${auxFlatMem.FlatMem.asmName}\n` +
                `FUN @${RetMem.asmName} get_Amount_for_Tx_in_A\n`
            Program.Context.freeRegister(auxFlatMem.FlatMem.address)
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
        case 'readMessage':
            assemblyCode = readMessageToAsm(tempArgsMem)
            break
        case 'readShortMessage':
            assemblyCode = readShortMessageToAsm(tempArgsMem)
            break
        case 'readAssets':
            assemblyCode = tempArgsMem[0].asmCode +
            `FUN set_A1 $${tempArgsMem[0].FlatMem.asmName}\n` +
            'FUN B_To_Assets_Of_Tx_In_A\n'
            if (argsMem[1].type === 'constant' || (argsMem[1].type === 'array' && argsMem[1].Offset === undefined)) {
                argsMem[1].hexContent = assertNotUndefined(argsMem[1].hexContent)
                const m1 = Program.Context.getMemoryObjectByLocation(argsMem[1].hexContent).asmName
                const m2 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(argsMem[1].hexContent, 1)).asmName
                const m3 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(argsMem[1].hexContent, 2)).asmName
                const m4 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(argsMem[1].hexContent, 3)).asmName
                assemblyCode +=
                    `FUN @${m1} get_B1\n` +
                    `FUN @${m2} get_B2\n` +
                    `FUN @${m3} get_B3\n` +
                    `FUN @${m4} get_B4\n`
                break
            }
            Program.Context.freeRegister(tempArgsMem[0].FlatMem.address)
            assemblyCode += tempArgsMem[1].asmCode
            if (Program.Context.isTemp(tempArgsMem[1].FlatMem.address)) {
                AuxRegister = tempArgsMem[1].FlatMem
            } else {
                AuxRegister = Program.Context.getNewRegister()
                assemblyCode += `SET @${AuxRegister.asmName} $${tempArgsMem[1].FlatMem.asmName}\n`
            }
            AuxRegisterA = Program.Context.getNewRegister()
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
            Program.Context.freeRegister(AuxRegister.address)
            Program.Context.freeRegister(AuxRegisterA.address)
            break
        case 'getQuantity':
            assemblyCode = tempArgsMem[0].asmCode + tempArgsMem[1].asmCode +
                `FUN set_A1_A2 $${tempArgsMem[0].FlatMem.asmName} $${tempArgsMem[1].FlatMem.asmName}\n` +
                `FUN @${RetMem.asmName} get_Amount_for_Tx_in_A\n`
            break
        default:
            throw new Error('Internal error')
        }
        tempArgsMem.forEach(freeAll)
        return assemblyCode
    }

    function sendToAsm () : string {
        const tempArgsMem = argsMem.map((VarObj) => flattenMemory(Program, VarObj, BuiltinToken.line))
        switch (BuiltinToken.value) {
        case 'sendAmount':
        case 'sendAmountFx':
            auxFlatMem = flattenMemory(Program, utils.createConstantMemObj(0n), BuiltinToken.line)
            assemblyCode = tempArgsMem[0].asmCode + tempArgsMem[1].asmCode + auxFlatMem.asmCode +
                `FUN set_B1_B2 $${tempArgsMem[1].FlatMem.asmName} $${auxFlatMem.FlatMem.asmName}\n` +
                `FUN send_to_Address_in_B $${tempArgsMem[0].FlatMem.asmName}\n`
            Program.Context.freeRegister(auxFlatMem.FlatMem.address)
            break
        case 'sendBalance':
            assemblyCode = tempArgsMem[0].asmCode +
                `FUN set_B1 $${tempArgsMem[0].FlatMem.asmName}\n` +
                'FUN send_All_to_Address_in_B\n'
            break
        case 'sendQuantity':
            auxFlatMem = flattenMemory(Program, utils.createConstantMemObj(0n), BuiltinToken.line)
            assemblyCode = tempArgsMem[0].asmCode + tempArgsMem[1].asmCode + tempArgsMem[2].asmCode + auxFlatMem.asmCode +
                `FUN set_B1_B2 $${tempArgsMem[2].FlatMem.asmName} $${tempArgsMem[1].FlatMem.asmName}\n` +
                `FUN set_B3 $${auxFlatMem.FlatMem.asmName}\n` +
                `FUN send_to_Address_in_B $${tempArgsMem[0].FlatMem.asmName}\n`
            break
        case 'sendMessage':
        case 'sendAmountAndMessage':
        case 'sendAmountAndMessageFx':
            assemblyCode = sendMessagePlusToAsm(tempArgsMem)
            break
        case 'sendShortMessage':
            assemblyCode = sendShortMessageToAsm(tempArgsMem)
            break
        default:
            throw new Error('Internal error')
        }
        tempArgsMem.forEach(freeAll)
        return assemblyCode
    }

    function contractToAsm () : string {
        const tempArgsMem = argsMem.map((VarObj) => flattenMemory(Program, VarObj, BuiltinToken.line))
        switch (BuiltinToken.value) {
        case 'getCreator':
            auxFlatMem = flattenMemory(Program, utils.createConstantMemObj(0n), BuiltinToken.line)
            assemblyCode = auxFlatMem.asmCode +
                `FUN set_B2 $${auxFlatMem.FlatMem.asmName}\n` +
                'FUN B_to_Address_of_Creator\n' +
                `FUN @${RetMem.asmName} get_B1\n`
            Program.Context.freeRegister(auxFlatMem.FlatMem.address)
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
        case 'getActivationOf':
        case 'getActivationOfFx':
            assemblyCode = tempArgsMem[0].asmCode +
                `FUN set_B2 $${tempArgsMem[0].FlatMem.asmName}\n` +
                `FUN @${RetMem.asmName} Get_Activation_Fee\n`
            break
        case 'getCurrentBalance':
        case 'getCurrentBalanceFx':
            auxFlatMem = flattenMemory(Program, utils.createConstantMemObj(0n), BuiltinToken.line)
            assemblyCode = auxFlatMem.asmCode +
                `FUN set_B2 $${auxFlatMem.FlatMem.asmName}\n` +
                `FUN @${RetMem.asmName} get_Current_Balance\n`
            Program.Context.freeRegister(auxFlatMem.FlatMem.address)
            break
        case 'getAssetBalance':
            assemblyCode = tempArgsMem[0].asmCode +
                `FUN set_B2 $${tempArgsMem[0].FlatMem.asmName}\n` +
                `FUN @${RetMem.asmName} get_Current_Balance\n`
            break
        default:
            throw new Error('Internal error')
        }
        tempArgsMem.forEach(freeAll)
        return assemblyCode
    }

    function mapsToAsm () : string {
        const tempArgsMem = argsMem.map((VarObj) => flattenMemory(Program, VarObj, BuiltinToken.line))
        switch (BuiltinToken.value) {
        case 'getMapValue':
        case 'getMapValueFx':
            auxFlatMem = flattenMemory(Program, utils.createConstantMemObj(0n), BuiltinToken.line)
            assemblyCode = tempArgsMem[0].asmCode + tempArgsMem[1].asmCode + auxFlatMem.asmCode +
                `FUN set_A1_A2 $${tempArgsMem[0].FlatMem.asmName} $${tempArgsMem[1].FlatMem.asmName}\n` +
                `FUN set_A3 $${auxFlatMem.FlatMem.asmName}\n` +
                `FUN @${RetMem.asmName} Get_Map_Value_Keys_In_A\n`
            Program.Context.freeRegister(auxFlatMem.FlatMem.address)
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
        default:
            throw new Error('Internal error')
        }
        tempArgsMem.forEach(freeAll)
        return assemblyCode
    }

    function assetsToAsm () : string {
        const tempArgsMem = argsMem.map((VarObj) => flattenMemory(Program, VarObj, BuiltinToken.line))
        switch (BuiltinToken.value) {
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
        case 'getAssetHoldersCount':
            assemblyCode = tempArgsMem[0].asmCode + tempArgsMem[1].asmCode +
                `FUN set_B1_B2 $${tempArgsMem[0].FlatMem.asmName} $${tempArgsMem[1].FlatMem.asmName}\n` +
                `FUN @${RetMem.asmName} Get_Asset_Holders_Count\n`
            break
        case 'getAssetCirculating':
            assemblyCode = tempArgsMem[0].asmCode +
                `FUN set_B2 $${tempArgsMem[0].FlatMem.asmName}\n` +
                `FUN @${RetMem.asmName} Get_Asset_Circulating\n`
            break
        case 'getAccountBalance':
        case 'getAccountBalanceFx':
            auxFlatMem = flattenMemory(Program, utils.createConstantMemObj(0n), BuiltinToken.line)
            assemblyCode = tempArgsMem[0].asmCode + auxFlatMem.asmCode +
                        `FUN set_B1_B2 $${tempArgsMem[0].FlatMem.asmName} $${auxFlatMem.FlatMem.asmName}\n` +
                `FUN @${RetMem.asmName} Get_Account_Balance\n`
            Program.Context.freeRegister(auxFlatMem.FlatMem.address)
            break
        case 'getAccountQuantity':
            assemblyCode = tempArgsMem[0].asmCode + tempArgsMem[1].asmCode +
                        `FUN set_B1_B2 $${tempArgsMem[0].FlatMem.asmName} $${tempArgsMem[1].FlatMem.asmName}\n` +
                        `FUN @${RetMem.asmName} Get_Account_Balance\n`
            break
        default:
            throw new Error('Internal error')
        }
        tempArgsMem.forEach(freeAll)
        return assemblyCode
    }

    function readMessageToAsm (tempArgsMem: FLATTEN_MEMORY_RETURN_OBJECT[]) {
        let retAsm: string
        retAsm = tempArgsMem[0].asmCode + tempArgsMem[1].asmCode +
            `FUN set_A1_A2 $${tempArgsMem[0].FlatMem.asmName} $${tempArgsMem[1].FlatMem.asmName}\n` +
            'FUN message_from_Tx_in_A_to_B\n'
        Program.Context.freeRegister(tempArgsMem[0].FlatMem.address)
        Program.Context.freeRegister(tempArgsMem[1].FlatMem.address)
        if (argsMem[2].type === 'constant' || (argsMem[2].type === 'array' && argsMem[2].Offset === undefined)) {
            argsMem[2].hexContent = assertNotUndefined(argsMem[2].hexContent)
            const m1 = Program.Context.getMemoryObjectByLocation(argsMem[2].hexContent).asmName
            const m2 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(argsMem[2].hexContent, 1)).asmName
            const m3 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(argsMem[2].hexContent, 2)).asmName
            const m4 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(argsMem[2].hexContent, 3)).asmName
            return retAsm +
                `FUN @${m1} get_B1\n` +
                `FUN @${m2} get_B2\n` +
                `FUN @${m3} get_B3\n` +
                `FUN @${m4} get_B4\n`
        }
        assemblyCode += tempArgsMem[2].asmCode
        if (Program.Context.isTemp(tempArgsMem[2].FlatMem.address)) {
            AuxRegister = tempArgsMem[2].FlatMem
        } else {
            AuxRegister = Program.Context.getNewRegister()
            retAsm += `SET @${AuxRegister.asmName} $${tempArgsMem[2].FlatMem.asmName}\n`
        }
        const AuxRegisterA = Program.Context.getNewRegister()
        retAsm +=
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
        Program.Context.freeRegister(AuxRegister.address)
        Program.Context.freeRegister(AuxRegisterA.address)
        return retAsm
    }

    function readShortMessageToAsm (tempArgsMem: FLATTEN_MEMORY_RETURN_OBJECT[]) : string {
        let retAsm: string
        if (argsMem[2].type !== 'constant') {
            throw new Error(`At line: ${BuiltinToken.line}. Only constants supported for length in 'sendShortMessage'.`)
        }
        Program.Context.freeRegister(tempArgsMem[2].FlatMem.address)
        auxFlatMem = flattenMemory(Program, utils.createConstantMemObj(0n), BuiltinToken.line)
        retAsm = tempArgsMem[0].asmCode + auxFlatMem.asmCode +
            `FUN set_A1_A2 $${tempArgsMem[0].FlatMem.asmName} $${auxFlatMem.FlatMem.asmName}\n` +
            'FUN message_from_Tx_in_A_to_B\n'
        Program.Context.freeRegister(tempArgsMem[0].FlatMem.address)
        Program.Context.freeRegister(auxFlatMem.FlatMem.address)
        const len = Number('0x' + argsMem[2].hexContent)
        if (Number.isNaN(len) || len > 4) {
            throw new Error(`At line: ${BuiltinToken.line}. Argument 'length' outside range (0 <= length <= 4) in 'readShortMessage'.`)
        }
        if (len === 0) {
            return ''
        }
        if (argsMem[1].type === 'constant' || (argsMem[1].type === 'array' && argsMem[1].Offset === undefined)) {
            argsMem[1].hexContent = assertNotUndefined(argsMem[1].hexContent)
            let m1, m2, m3, m4 : string
            switch (len) {
            case 1:
                m1 = Program.Context.getMemoryObjectByLocation(argsMem[1].hexContent).asmName
                retAsm += `FUN @${m1} get_B1\n`
                break
            case 2:
                m1 = Program.Context.getMemoryObjectByLocation(argsMem[1].hexContent).asmName
                m2 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(argsMem[1].hexContent, 1)).asmName
                retAsm +=
                    `FUN @${m1} get_B1\n` +
                    `FUN @${m2} get_B2\n`
                break
            case 3:
                m1 = Program.Context.getMemoryObjectByLocation(argsMem[1].hexContent).asmName
                m2 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(argsMem[1].hexContent, 1)).asmName
                m3 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(argsMem[1].hexContent, 2)).asmName
                retAsm +=
                    `FUN @${m1} get_B1\n` +
                    `FUN @${m2} get_B2\n` +
                    `FUN @${m3} get_B3\n`
                break
            case 4:
                m1 = Program.Context.getMemoryObjectByLocation(argsMem[1].hexContent).asmName
                m2 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(argsMem[1].hexContent, 1)).asmName
                m3 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(argsMem[1].hexContent, 2)).asmName
                m4 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(argsMem[1].hexContent, 3)).asmName
                retAsm +=
                    `FUN @${m1} get_B1\n` +
                    `FUN @${m2} get_B2\n` +
                    `FUN @${m3} get_B3\n` +
                    `FUN @${m4} get_B4\n`
            }
            return retAsm
        }
        retAsm += tempArgsMem[1].asmCode
        if (len === 1) {
            // simple case
            AuxRegister = Program.Context.getNewRegister()
            retAsm +=
                `FUN @${AuxRegister.asmName} get_B1\n` +
                `SET @($${tempArgsMem[1].FlatMem.asmName}) $${AuxRegister.asmName}\n`
            Program.Context.freeRegister(AuxRegister.address)
            return retAsm
        }
        if (Program.Context.isTemp(tempArgsMem[1].FlatMem.address)) {
            AuxRegister = tempArgsMem[1].FlatMem
        } else {
            AuxRegister = Program.Context.getNewRegister()
            retAsm += `SET @${AuxRegister.asmName} $${tempArgsMem[1].FlatMem.asmName}\n`
        }
        const AuxRegisterA = Program.Context.getNewRegister()
        switch (len) {
        case 2:
            retAsm +=
                `FUN @${AuxRegisterA.asmName} get_B1\n` +
                `SET @($${AuxRegister.asmName}) $${AuxRegisterA.asmName}\n` +
                `FUN @${AuxRegisterA.asmName} get_B2\n` +
                `INC @${AuxRegister.asmName}\n` +
                `SET @($${AuxRegister.asmName}) $${AuxRegisterA.asmName}\n`
            break
        case 3:
            retAsm +=
                `FUN @${AuxRegisterA.asmName} get_B1\n` +
                `SET @($${AuxRegister.asmName}) $${AuxRegisterA.asmName}\n` +
                `FUN @${AuxRegisterA.asmName} get_B2\n` +
                `INC @${AuxRegister.asmName}\n` +
                `SET @($${AuxRegister.asmName}) $${AuxRegisterA.asmName}\n` +
                `FUN @${AuxRegisterA.asmName} get_B3\n` +
                `INC @${AuxRegister.asmName}\n` +
                `SET @($${AuxRegister.asmName}) $${AuxRegisterA.asmName}\n`
            break
        case 4:
            retAsm +=
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
        }
        Program.Context.freeRegister(AuxRegister.address)
        Program.Context.freeRegister(AuxRegisterA.address)
        return retAsm
    }

    function sendMessagePlusToAsm (tempArgsMem: FLATTEN_MEMORY_RETURN_OBJECT[]) {
        let retAsm: string
        let amountArg = 0
        let messageArg = 1
        let recipientArg = 2
        if (BuiltinToken.value === 'sendMessage') {
            amountArg = -1
            messageArg = 0
            recipientArg = 1
        }
        if (amountArg !== -1) {
            auxFlatMem = flattenMemory(Program, utils.createConstantMemObj(0n), BuiltinToken.line)
            retAsm = tempArgsMem[amountArg].asmCode + tempArgsMem[recipientArg].asmCode + auxFlatMem.asmCode +
                `FUN set_B1_B2 $${tempArgsMem[recipientArg].FlatMem.asmName} $${auxFlatMem.FlatMem.asmName}\n` +
                `FUN send_to_Address_in_B $${tempArgsMem[amountArg].FlatMem.asmName}\n`
            Program.Context.freeRegister(tempArgsMem[amountArg].FlatMem.address)
            Program.Context.freeRegister(auxFlatMem.FlatMem.address)
        } else {
            retAsm = tempArgsMem[recipientArg].asmCode +
                `FUN set_B1 $${tempArgsMem[recipientArg].FlatMem.asmName}\n`
        }
        Program.Context.freeRegister(tempArgsMem[recipientArg].FlatMem.address)
        if (argsMem[messageArg].type === 'constant' || (argsMem[messageArg].type === 'array' && argsMem[messageArg].Offset === undefined)) {
            const theHexContent = assertNotUndefined(argsMem[messageArg].hexContent)
            const m1 = Program.Context.getMemoryObjectByLocation(theHexContent).asmName
            const m2 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(theHexContent, 1)).asmName
            const m3 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(theHexContent, 2)).asmName
            const m4 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(theHexContent, 3)).asmName
            return retAsm +
                `FUN set_A1_A2 $${m1} $${m2}\n` +
                `FUN set_A3_A4 $${m3} $${m4}\n` +
                'FUN send_A_to_Address_in_B\n'
        }
        retAsm += tempArgsMem[messageArg].asmCode
        if (Program.Context.isTemp(tempArgsMem[messageArg].FlatMem.address)) {
            AuxRegister = tempArgsMem[messageArg].FlatMem
        } else {
            AuxRegister = Program.Context.getNewRegister()
            retAsm += `SET @${AuxRegister.asmName} $${tempArgsMem[messageArg].FlatMem.asmName}\n`
        }
        const AuxRegisterA = Program.Context.getNewRegister()
        const AuxRegisterB = Program.Context.getNewRegister()
        retAsm +=
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
        Program.Context.freeRegister(AuxRegister.address)
        Program.Context.freeRegister(AuxRegisterA.address)
        Program.Context.freeRegister(AuxRegisterB.address)
        return retAsm
    }

    function sendShortMessageToAsm (tempArgsMem: FLATTEN_MEMORY_RETURN_OBJECT[]) : string {
        let retAsm: string
        if (argsMem[1].type !== 'constant') {
            throw new Error(`At line: ${BuiltinToken.line}. Only constants supported for length in 'sendShortMessage'.`)
        }
        Program.Context.freeRegister(tempArgsMem[1].FlatMem.address)
        const len = Number('0x' + argsMem[1].hexContent)
        if (Number.isNaN(len) || len > 4) {
            throw new Error(`At line: ${BuiltinToken.line}. Argument 'length' outside range (0 <= length <= 4) in 'sendShortMessage'.`)
        }
        if (len === 0) {
            return ''
        }
        retAsm = tempArgsMem[2].asmCode +
        `FUN set_B1 $${tempArgsMem[2].FlatMem.asmName}\n`
        Program.Context.freeRegister(tempArgsMem[2].FlatMem.address)
        if (argsMem[0].type === 'constant' || (argsMem[0].type === 'array' && argsMem[0].Offset === undefined)) {
            let m1, m2, m3, m4
            const theHexContent = assertNotUndefined(argsMem[0].hexContent)
            Program.Context.freeRegister(tempArgsMem[0].FlatMem.address)
            switch (len) {
            case 1:
                m1 = Program.Context.getMemoryObjectByLocation(theHexContent).asmName
                retAsm +=
                    'FUN clear_A\n' +
                    `FUN set_A1 $${m1}\n` +
                    'FUN send_A_to_Address_in_B\n'
                break
            case 2:
                m1 = Program.Context.getMemoryObjectByLocation(theHexContent).asmName
                m2 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(theHexContent, 1)).asmName
                retAsm +=
                    'FUN clear_A\n' +
                    `FUN set_A1_A2 $${m1} $${m2}\n` +
                    'FUN send_A_to_Address_in_B\n'
                break
            case 3:
                m1 = Program.Context.getMemoryObjectByLocation(theHexContent).asmName
                m2 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(theHexContent, 1)).asmName
                m3 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(theHexContent, 2)).asmName
                auxFlatMem = flattenMemory(Program, utils.createConstantMemObj(0n), BuiltinToken.line)
                retAsm += auxFlatMem.asmCode +
                    `FUN set_A1_A2 $${m1} $${m2}\n` +
                    `FUN set_A3_A4 $${m3} $${auxFlatMem.FlatMem.asmName}\n` +
                    'FUN send_A_to_Address_in_B\n'
                Program.Context.freeRegister(auxFlatMem.FlatMem.address)
                break
            case 4:
                m1 = Program.Context.getMemoryObjectByLocation(theHexContent).asmName
                m2 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(theHexContent, 1)).asmName
                m3 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(theHexContent, 2)).asmName
                m4 = Program.Context.getMemoryObjectByLocation(utils.addHexSimple(theHexContent, 3)).asmName
                retAsm +=
                    `FUN set_A1_A2 $${m1} $${m2}\n` +
                    `FUN set_A3_A4 $${m3} $${m4}\n` +
                    'FUN send_A_to_Address_in_B\n'
            }
            return retAsm
        }
        retAsm += tempArgsMem[0].asmCode
        if (len === 1) {
            // simple case
            AuxRegister = Program.Context.getNewRegister()
            retAsm +=
                'FUN clear_A\n' +
                `SET @${AuxRegister.asmName} $($${tempArgsMem[0].FlatMem.asmName})\n` +
                `FUN set_A1 $${AuxRegister.asmName}\n` +
                'FUN send_A_to_Address_in_B\n'
            Program.Context.freeRegister(AuxRegister.address)
            return retAsm
        }
        if (Program.Context.isTemp(tempArgsMem[0].FlatMem.address)) {
            AuxRegister = tempArgsMem[0].FlatMem
        } else {
            AuxRegister = Program.Context.getNewRegister()
            retAsm += `SET @${AuxRegister.asmName} $${tempArgsMem[0].FlatMem.asmName}\n`
        }
        const AuxRegisterA = Program.Context.getNewRegister()
        const AuxRegisterB = Program.Context.getNewRegister()
        switch (len) {
        case 2:
            retAsm +=
                'FUN clear_A\n' +
                `SET @${AuxRegisterA.asmName} $($${AuxRegister.asmName})\n` +
                `INC @${AuxRegister.asmName}\n` +
                `SET @${AuxRegisterB.asmName} $($${AuxRegister.asmName})\n` +
                `FUN set_A1_A2 $${AuxRegisterA.asmName} $${AuxRegisterB.asmName}\n` +
                'FUN send_A_to_Address_in_B\n'
            break
        case 3:
            retAsm +=
                `SET @${AuxRegisterA.asmName} $($${AuxRegister.asmName})\n` +
                `INC @${AuxRegister.asmName}\n` +
                `SET @${AuxRegisterB.asmName} $($${AuxRegister.asmName})\n` +
                `FUN set_A1_A2 $${AuxRegisterA.asmName} $${AuxRegisterB.asmName}\n` +
                `INC @${AuxRegister.asmName}\n` +
                `SET @${AuxRegisterA.asmName} $($${AuxRegister.asmName})\n` +
                `CLR @${AuxRegisterB.asmName}\n` +
                `FUN set_A3_A4 $${AuxRegisterA.asmName} $${AuxRegisterB.asmName}\n` +
                'FUN send_A_to_Address_in_B\n'
            break
        case 4:
            retAsm +=
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
        }
        Program.Context.freeRegister(AuxRegister.address)
        Program.Context.freeRegister(AuxRegisterA.address)
        Program.Context.freeRegister(AuxRegisterB.address)
        return retAsm
    }

    return createBuiltinInstructionMain()
}
