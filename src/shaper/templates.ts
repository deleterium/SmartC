import { SC_FUNCTION } from '../typings/contractTypes'
import {
    REGISTER_TYPE_DEFINITION, LONG_TYPE_DEFINITION, STRUCT_TYPE_DEFINITION, MEMORY_BASE_TYPES, MEMORY_SLOT, FIXED_TYPE_DEFINITION
} from '../typings/syntaxTypes'

type ObjectTypeDefinition<T> = T extends 'register' ? REGISTER_TYPE_DEFINITION :
    T extends 'long' ? LONG_TYPE_DEFINITION :
    T extends 'fixed' ? LONG_TYPE_DEFINITION :
    T extends 'struct' ? STRUCT_TYPE_DEFINITION :
    never;

export function getTypeDefinitionTemplate<T extends 'register'|'long'|'fixed'|'struct'|'void'> (
    templateType: T
) : ObjectTypeDefinition<T> {
    let RetObj: REGISTER_TYPE_DEFINITION | LONG_TYPE_DEFINITION | STRUCT_TYPE_DEFINITION | FIXED_TYPE_DEFINITION
    switch (templateType) {
    case 'register':
        RetObj = {
            type: 'register',
            name: '',
            MemoryTemplate: getMemoryTemplate('register')
        }
        RetObj.MemoryTemplate.declaration = 'long'
        RetObj.MemoryTemplate.size = 1
        RetObj.MemoryTemplate.isDeclared = true
        break
    case 'long':
    case 'void':
        RetObj = {
            type: 'long',
            name: '',
            MemoryTemplate: getMemoryTemplate('long')
        }
        RetObj.MemoryTemplate.declaration = 'long'
        RetObj.MemoryTemplate.size = 1
        break
    case 'fixed':
        RetObj = {
            type: 'fixed',
            name: '',
            MemoryTemplate: getMemoryTemplate('fixed')
        }
        RetObj.MemoryTemplate.declaration = 'fixed'
        RetObj.MemoryTemplate.size = 1
        break
    case 'struct':
        RetObj = {
            name: '',
            type: 'struct',
            structMembers: [],
            structAccumulatedSize: [],
            MemoryTemplate: getMemoryTemplate('struct')
        }
        RetObj.MemoryTemplate.typeDefinition = ''
        RetObj.MemoryTemplate.declaration = 'struct'
        break
    default:
        throw new Error('Internal error')
    }
    return RetObj as ObjectTypeDefinition<T>
}

const longArg : MEMORY_SLOT = {
    address: -1,
    name: 'dummy',
    asmName: 'dummy_dummy',
    type: 'long',
    scope: 'dummy',
    declaration: 'long',
    size: 1,
    isDeclared: true
}

const longPtrArg : MEMORY_SLOT = {
    address: -1,
    name: 'dummy',
    asmName: 'dummy_dummy',
    type: 'long',
    scope: 'dummy',
    declaration: 'long_ptr',
    size: 1,
    isDeclared: true
}

const fixedArg : MEMORY_SLOT = {
    address: -1,
    name: 'dummy',
    asmName: 'dummy_dummy',
    type: 'fixed',
    scope: 'dummy',
    declaration: 'fixed',
    size: 1,
    isDeclared: true
}

export const autoCounterTemplate : MEMORY_SLOT = {
    address: -1,
    asmName: '_counterTimestamp',
    declaration: 'long',
    isDeclared: true,
    name: '_counterTimestamp',
    scope: '',
    size: 1,
    type: 'long'
}

export const BuiltInTemplate: SC_FUNCTION[] = [
    /* Note here: asmName and name shall be the same */
    {
        argsMemObj: [longArg, longArg],
        asmName: 'pow',
        declaration: 'long',
        sentences: [],
        name: 'pow'
    },
    {
        argsMemObj: [longArg, longArg, longArg],
        asmName: 'mdv',
        declaration: 'long',
        sentences: [],
        name: 'mdv'
    },
    {
        argsMemObj: [longArg, fixedArg],
        asmName: 'powf',
        declaration: 'long',
        sentences: [],
        name: 'powf'
    },
    {
        argsMemObj: [
            {
                address: -1,
                name: 'addr1',
                asmName: 'memcopy_addr1',
                type: 'long',
                scope: 'memcopy',
                declaration: 'void_ptr',
                size: 1,
                isDeclared: true
            },
            {
                address: -1,
                name: 'addr2',
                asmName: 'memcopy_addr2',
                type: 'long',
                scope: 'memcopy',
                declaration: 'void_ptr',
                size: 1,
                isDeclared: true
            }
        ],
        asmName: 'memcopy',
        declaration: 'void',
        sentences: [],
        name: 'memcopy'
    },
    {
        argsMemObj: [fixedArg],
        asmName: 'bcftol',
        declaration: 'long',
        sentences: [],
        name: 'bcftol'
    },
    {
        argsMemObj: [longArg],
        asmName: 'bcltof',
        declaration: 'fixed',
        sentences: [],
        name: 'bcltof'
    },
    {
        argsMemObj: [],
        asmName: 'getNextTx',
        declaration: 'long',
        sentences: [],
        name: 'getNextTx'
    },
    {
        argsMemObj: [longArg],
        asmName: 'getNextTxFromBlockheight',
        declaration: 'long',
        sentences: [],
        name: 'getNextTxFromBlockheight'
    },
    {
        argsMemObj: [longArg],
        asmName: 'getBlockheight',
        declaration: 'long',
        sentences: [],
        name: 'getBlockheight'
    },
    {
        argsMemObj: [],
        asmName: 'getCurrentBlockheight',
        declaration: 'long',
        sentences: [],
        name: 'getCurrentBlockheight'
    },
    {
        argsMemObj: [longArg],
        asmName: 'getAmount',
        declaration: 'long',
        sentences: [],
        name: 'getAmount'
    },
    {
        argsMemObj: [longArg],
        asmName: 'getSender',
        declaration: 'long',
        sentences: [],
        name: 'getSender'
    },
    {
        argsMemObj: [longArg],
        asmName: 'getType',
        declaration: 'long',
        sentences: [],
        name: 'getType'
    },
    {
        argsMemObj: [],
        asmName: 'getCreator',
        declaration: 'long',
        sentences: [],
        name: 'getCreator'
    },
    {
        argsMemObj: [longArg],
        asmName: 'getCreatorOf',
        declaration: 'long',
        sentences: [],
        name: 'getCreatorOf'
    },
    {
        argsMemObj: [longArg],
        asmName: 'getCodeHashOf',
        declaration: 'long',
        sentences: [],
        name: 'getCodeHashOf'
    },
    {
        argsMemObj: [],
        asmName: 'getWeakRandomNumber',
        declaration: 'long',
        sentences: [],
        name: 'getWeakRandomNumber'
    },
    {
        argsMemObj: [longArg],
        asmName: 'getActivationOf',
        declaration: 'long',
        sentences: [],
        name: 'getActivationOf'
    },
    {
        argsMemObj: [],
        asmName: 'getCurrentBalance',
        declaration: 'long',
        sentences: [],
        name: 'getCurrentBalance'
    },
    {
        argsMemObj: [longArg, longArg, longPtrArg],
        asmName: 'readMessage',
        declaration: 'void',
        sentences: [],
        name: 'readMessage'
    },
    {
        argsMemObj: [longPtrArg, longArg],
        asmName: 'sendMessage',
        declaration: 'void',
        sentences: [],
        name: 'sendMessage'
    },
    {
        argsMemObj: [longArg, longPtrArg, longArg],
        asmName: 'sendAmountAndMessage',
        declaration: 'void',
        sentences: [],
        name: 'sendAmountAndMessage'
    },
    {
        argsMemObj: [longArg, longArg],
        asmName: 'sendAmount',
        declaration: 'void',
        sentences: [],
        name: 'sendAmount'
    },
    {
        argsMemObj: [longArg],
        asmName: 'sendBalance',
        declaration: 'void',
        sentences: [],
        name: 'sendBalance'
    },
    {
        argsMemObj: [longArg, longArg],
        asmName: 'getMapValue',
        declaration: 'long',
        sentences: [],
        name: 'getMapValue'
    },
    {
        argsMemObj: [longArg, longArg, longArg],
        asmName: 'getExtMapValue',
        declaration: 'long',
        sentences: [],
        name: 'getExtMapValue'
    },
    {
        argsMemObj: [longArg, longArg, longArg],
        asmName: 'setMapValue',
        declaration: 'void',
        sentences: [],
        name: 'setMapValue'
    },
    {
        argsMemObj: [longArg, longArg, longArg],
        asmName: 'issueAsset',
        declaration: 'long',
        sentences: [],
        name: 'issueAsset'
    },
    {
        argsMemObj: [longArg, longArg],
        asmName: 'mintAsset',
        declaration: 'void',
        sentences: [],
        name: 'mintAsset'
    },
    {
        argsMemObj: [longArg, longArg, longArg],
        asmName: 'sendQuantity',
        declaration: 'void',
        sentences: [],
        name: 'sendQuantity'
    },
    {
        argsMemObj: [longArg],
        asmName: 'getAssetBalance',
        declaration: 'long',
        sentences: [],
        name: 'getAssetBalance'
    },
    {
        argsMemObj: [longArg, longArg, longArg, longArg, longArg, longArg],
        asmName: 'checkSignature',
        declaration: 'long',
        sentences: [],
        name: 'checkSignature'
    },
    {
        argsMemObj: [longArg, longArg, longArg, longArg, longArg],
        asmName: 'distributeToHolders',
        declaration: 'void',
        sentences: [],
        name: 'distributeToHolders'
    },
    {
        argsMemObj: [longArg, longArg],
        asmName: 'getAssetHoldersCount',
        declaration: 'long',
        sentences: [],
        name: 'getAssetHoldersCount'
    },
    {
        argsMemObj: [longArg, longPtrArg],
        asmName: 'readAssets',
        declaration: 'void',
        sentences: [],
        name: 'readAssets'
    },
    {
        argsMemObj: [longArg, longArg],
        asmName: 'getQuantity',
        declaration: 'long',
        sentences: [],
        name: 'getQuantity'
    },
    {
        argsMemObj: [longArg],
        asmName: 'getAssetCirculating',
        declaration: 'long',
        sentences: [],
        name: 'getAssetCirculating'
    },

    /* fixed number versions */
    {
        argsMemObj: [longArg],
        asmName: 'getAmountFx',
        declaration: 'fixed',
        sentences: [],
        name: 'getAmountFx'
    },
    {
        argsMemObj: [longArg],
        asmName: 'getActivationOfFx',
        declaration: 'fixed',
        sentences: [],
        name: 'getActivationOfFx'
    },
    {
        argsMemObj: [],
        asmName: 'getCurrentBalanceFx',
        declaration: 'fixed',
        sentences: [],
        name: 'getCurrentBalanceFx'
    },
    {
        argsMemObj: [fixedArg, longPtrArg, longArg],
        asmName: 'sendAmountAndMessageFx',
        declaration: 'void',
        sentences: [],
        name: 'sendAmountAndMessageFx'
    },
    {
        argsMemObj: [fixedArg, longArg],
        asmName: 'sendAmountFx',
        declaration: 'void',
        sentences: [],
        name: 'sendAmountFx'
    },
    {
        argsMemObj: [longArg, longArg],
        asmName: 'getMapValueFx',
        declaration: 'fixed',
        sentences: [],
        name: 'getMapValueFx'
    },
    {
        argsMemObj: [longArg, longArg, longArg],
        asmName: 'getExtMapValueFx',
        declaration: 'fixed',
        sentences: [],
        name: 'getExtMapValueFx'
    },
    {
        argsMemObj: [longArg, longArg, fixedArg],
        asmName: 'setMapValueFx',
        declaration: 'void',
        sentences: [],
        name: 'setMapValueFx'
    },
    {
        argsMemObj: [longArg, longArg, fixedArg, longArg, longArg],
        asmName: 'distributeToHoldersFx',
        declaration: 'void',
        sentences: [],
        name: 'distributeToHoldersFx'
    }
]

export function getMemoryTemplate (memType: MEMORY_BASE_TYPES) : MEMORY_SLOT {
    return {
        type: memType,
        asmName: '',
        isDeclared: false,
        declaration: '',
        address: -1,
        name: '',
        scope: '',
        size: -1
    }
}

export const fixedBaseTemplate : MEMORY_SLOT = {
    address: -1,
    asmName: 'f100000000',
    declaration: 'fixed',
    isDeclared: false,
    name: 'f100000000',
    hexContent: '0000000005f5e100',
    scope: '',
    size: 1,
    type: 'fixed'
}

export const APITableTemplate: SC_FUNCTION[] = [
    {
        argsMemObj: [],
        asmName: 'get_A1',
        declaration: 'long',
        sentences: [],
        name: 'Get_A1'
    },
    {
        argsMemObj: [],
        asmName: 'get_A2',
        declaration: 'long',
        sentences: [],
        name: 'Get_A2'
    },
    {
        argsMemObj: [],
        asmName: 'get_A3',
        declaration: 'long',
        sentences: [],
        name: 'Get_A3'
    },
    {
        argsMemObj: [],
        asmName: 'get_A4',
        declaration: 'long',
        sentences: [],
        name: 'Get_A4'
    },
    {
        argsMemObj: [],
        asmName: 'get_B1',
        declaration: 'long',
        sentences: [],
        name: 'Get_B1'
    },
    {
        argsMemObj: [],
        asmName: 'get_B2',
        declaration: 'long',
        sentences: [],
        name: 'Get_B2'
    },
    {
        argsMemObj: [],
        asmName: 'get_B3',
        declaration: 'long',
        sentences: [],
        name: 'Get_B3'
    },
    {
        argsMemObj: [],
        asmName: 'get_B4',
        declaration: 'long',
        sentences: [],
        name: 'Get_B4'
    },
    {
        argsMemObj: [longArg],
        asmName: 'set_A1',
        declaration: 'void',
        sentences: [],
        name: 'Set_A1'
    },
    {
        argsMemObj: [longArg],
        asmName: 'set_A2',
        declaration: 'void',
        sentences: [],
        name: 'Set_A2'
    },
    {
        argsMemObj: [longArg],
        asmName: 'set_A3',
        declaration: 'void',
        sentences: [],
        name: 'Set_A3'
    },
    {
        argsMemObj: [longArg],
        asmName: 'set_A4',
        declaration: 'void',
        sentences: [],
        name: 'Set_A4'
    },
    {
        argsMemObj: [longArg, longArg],
        asmName: 'set_A1_A2',
        declaration: 'void',
        sentences: [],
        name: 'Set_A1_A2'
    },
    {
        argsMemObj: [longArg, longArg],
        asmName: 'set_A3_A4',
        declaration: 'void',
        sentences: [],
        name: 'Set_A3_A4'
    },
    {
        argsMemObj: [longArg],
        asmName: 'set_B1',
        declaration: 'void',
        sentences: [],
        name: 'Set_B1'
    },
    {
        argsMemObj: [longArg],
        asmName: 'set_B2',
        declaration: 'void',
        sentences: [],
        name: 'Set_B2'
    },
    {
        argsMemObj: [longArg],
        asmName: 'set_B3',
        declaration: 'void',
        sentences: [],
        name: 'Set_B3'
    },
    {
        argsMemObj: [longArg],
        asmName: 'set_B4',
        declaration: 'void',
        sentences: [],
        name: 'Set_B4'
    },
    {
        argsMemObj: [longArg, longArg],
        asmName: 'set_B1_B2',
        declaration: 'void',
        sentences: [],
        name: 'Set_B1_B2'
    },
    {
        argsMemObj: [longArg, longArg],
        asmName: 'set_B3_B4',
        declaration: 'void',
        sentences: [],
        name: 'Set_B3_B4'
    },
    {
        argsMemObj: [],
        asmName: 'clear_A',
        declaration: 'void',
        sentences: [],
        name: 'Clear_A'
    },
    {
        argsMemObj: [],
        asmName: 'clear_B',
        declaration: 'void',
        sentences: [],
        name: 'Clear_B'
    },
    {
        argsMemObj: [],
        asmName: 'clear_A_B',
        declaration: 'void',
        sentences: [],
        name: 'Clear_A_And_B'
    },
    {
        argsMemObj: [],
        asmName: 'copy_A_From_B',
        declaration: 'void',
        sentences: [],
        name: 'Copy_A_From_B'
    },
    {
        argsMemObj: [],
        asmName: 'copy_B_From_A',
        declaration: 'void',
        sentences: [],
        name: 'Copy_B_From_A'
    },
    {
        argsMemObj: [],
        asmName: 'check_A_Is_Zero',
        declaration: 'long',
        sentences: [],
        name: 'Check_A_Is_Zero'
    },
    {
        argsMemObj: [],
        asmName: 'check_B_Is_Zero',
        declaration: 'long',
        sentences: [],
        name: 'Check_B_Is_Zero'
    },
    {
        argsMemObj: [],
        asmName: 'check_A_equals_B',
        declaration: 'long',
        sentences: [],
        name: 'Check_A_Equals_B'
    },
    {
        argsMemObj: [],
        asmName: 'swap_A_and_B',
        declaration: 'void',
        sentences: [],
        name: 'Swap_A_and_B'
    },
    {
        argsMemObj: [],
        asmName: 'OR_A_with_B',
        declaration: 'void',
        sentences: [],
        name: 'OR_A_with_B'
    },
    {
        argsMemObj: [],
        asmName: 'OR_B_with_A',
        declaration: 'void',
        sentences: [],
        name: 'OR_B_with_A'
    },
    {
        argsMemObj: [],
        asmName: 'AND_A_with_B',
        declaration: 'void',
        sentences: [],
        name: 'AND_A_with_B'
    },
    {
        argsMemObj: [],
        asmName: 'AND_B_with_A',
        declaration: 'void',
        sentences: [],
        name: 'AND_B_with_A'
    },
    {
        argsMemObj: [],
        asmName: 'XOR_A_with_B',
        declaration: 'void',
        sentences: [],
        name: 'XOR_A_with_B'
    },
    {
        argsMemObj: [],
        asmName: 'XOR_B_with_A',
        declaration: 'void',
        sentences: [],
        name: 'XOR_B_with_A'
    },
    {
        argsMemObj: [],
        asmName: 'add_A_to_B',
        declaration: 'void',
        sentences: [],
        name: 'Add_A_To_B'
    },
    {
        argsMemObj: [],
        asmName: 'add_B_to_A',
        declaration: 'void',
        sentences: [],
        name: 'Add_B_To_A'
    },
    {
        argsMemObj: [],
        asmName: 'sub_A_from_B',
        declaration: 'void',
        sentences: [],
        name: 'Sub_A_From_B'
    },
    {
        argsMemObj: [],
        asmName: 'sub_B_from_A',
        declaration: 'void',
        sentences: [],
        name: 'Sub_B_From_A'
    },
    {
        argsMemObj: [],
        asmName: 'mul_A_by_B',
        declaration: 'void',
        sentences: [],
        name: 'Mul_A_By_B'
    },
    {
        argsMemObj: [],
        asmName: 'mul_B_by_A',
        declaration: 'void',
        sentences: [],
        name: 'Mul_B_By_A'
    },
    {
        argsMemObj: [],
        asmName: 'div_A_by_B',
        declaration: 'void',
        sentences: [],
        name: 'Div_A_By_B'
    },
    {
        argsMemObj: [],
        asmName: 'div_B_by_A',
        declaration: 'void',
        sentences: [],
        name: 'Div_B_By_A'
    },
    {
        argsMemObj: [],
        asmName: 'MD5_A_to_B',
        declaration: 'void',
        sentences: [],
        name: 'MD5_A_To_B'
    },
    {
        argsMemObj: [],
        asmName: 'check_MD5_A_with_B',
        declaration: 'long',
        sentences: [],
        name: 'Check_MD5_A_With_B'
    },
    {
        argsMemObj: [],
        asmName: 'HASH160_A_to_B',
        declaration: 'void',
        sentences: [],
        name: 'HASH160_A_To_B'
    },
    {
        argsMemObj: [],
        asmName: 'check_HASH160_A_with_B',
        declaration: 'long',
        sentences: [],
        name: 'Check_HASH160_A_With_B'
    },
    {
        argsMemObj: [],
        asmName: 'SHA256_A_to_B',
        declaration: 'void',
        sentences: [],
        name: 'SHA256_A_To_B'
    },
    {
        argsMemObj: [],
        asmName: 'check_SHA256_A_with_B',
        declaration: 'long',
        sentences: [],
        name: 'Check_SHA256_A_With_B'
    },
    {
        argsMemObj: [],
        asmName: 'get_Block_Timestamp',
        declaration: 'long',
        sentences: [],
        name: 'Get_Block_Timestamp'
    },
    {
        argsMemObj: [],
        asmName: 'get_Creation_Timestamp',
        declaration: 'long',
        sentences: [],
        name: 'Get_Creation_Timestamp'
    },
    {
        argsMemObj: [],
        asmName: 'get_Last_Block_Timestamp',
        declaration: 'long',
        sentences: [],
        name: 'Get_Last_Block_Timestamp'
    },
    {
        argsMemObj: [],
        asmName: 'put_Last_Block_Hash_In_A',
        declaration: 'void',
        sentences: [],
        name: 'Put_Last_Block_Hash_In_A'
    },
    {
        argsMemObj: [longArg],
        asmName: 'A_to_Tx_after_Timestamp',
        declaration: 'void',
        sentences: [],
        name: 'A_To_Tx_After_Timestamp'
    },
    {
        argsMemObj: [],
        asmName: 'get_Type_for_Tx_in_A',
        declaration: 'long',
        sentences: [],
        name: 'Get_Type_For_Tx_In_A'
    },
    {
        argsMemObj: [],
        asmName: 'get_Amount_for_Tx_in_A',
        declaration: 'long',
        sentences: [],
        name: 'Get_Amount_For_Tx_In_A'
    },
    {
        argsMemObj: [],
        asmName: 'get_Timestamp_for_Tx_in_A',
        declaration: 'long',
        sentences: [],
        name: 'Get_Timestamp_For_Tx_In_A'
    },
    {
        argsMemObj: [],
        asmName: 'get_Ticket_Id_for_Tx_in_A',
        declaration: 'long',
        sentences: [],
        name: 'Get_Random_Id_For_Tx_In_A'
    },
    {
        argsMemObj: [],
        asmName: 'message_from_Tx_in_A_to_B',
        declaration: 'void',
        sentences: [],
        name: 'Message_From_Tx_In_A_To_B'
    },
    {
        argsMemObj: [],
        asmName: 'B_to_Address_of_Tx_in_A',
        declaration: 'void',
        sentences: [],
        name: 'B_To_Address_Of_Tx_In_A'
    },
    {
        argsMemObj: [],
        asmName: 'B_to_Address_of_Creator',
        declaration: 'void',
        sentences: [],
        name: 'B_To_Address_Of_Creator'
    },
    {
        argsMemObj: [],
        asmName: 'get_Current_Balance',
        declaration: 'long',
        sentences: [],
        name: 'Get_Current_Balance'
    },
    {
        argsMemObj: [],
        asmName: 'get_Previous_Balance',
        declaration: 'long',
        sentences: [],
        name: 'Get_Previous_Balance'
    },
    {
        argsMemObj: [longArg],
        asmName: 'send_to_Address_in_B',
        declaration: 'void',
        sentences: [],
        name: 'Send_To_Address_In_B'
    },
    {
        argsMemObj: [],
        asmName: 'send_All_to_Address_in_B',
        declaration: 'void',
        sentences: [],
        name: 'Send_All_To_Address_In_B'
    },
    {
        argsMemObj: [],
        asmName: 'send_Old_to_Address_in_B',
        declaration: 'void',
        sentences: [],
        name: 'Send_Old_To_Address_In_B'
    },
    {
        argsMemObj: [],
        asmName: 'send_A_to_Address_in_B',
        declaration: 'void',
        sentences: [],
        name: 'Send_A_To_Address_In_B'
    },
    {
        argsMemObj: [longArg, longArg],
        asmName: 'add_Minutes_to_Timestamp',
        declaration: 'long',
        sentences: [],
        name: 'Add_Minutes_To_Timestamp'
    },
    {
        argsMemObj: [],
        asmName: 'Check_Sig_B_With_A',
        declaration: 'long',
        sentences: [],
        name: 'Check_Sig_B_With_A'
    },
    {
        argsMemObj: [],
        asmName: 'Get_Code_Hash_Id',
        declaration: 'long',
        sentences: [],
        name: 'Get_Code_Hash_Id'
    },
    {
        argsMemObj: [],
        asmName: 'B_To_Assets_Of_Tx_In_A',
        declaration: 'void',
        sentences: [],
        name: 'B_To_Assets_Of_Tx_In_A'
    },
    {
        argsMemObj: [],
        asmName: 'Get_Map_Value_Keys_In_A',
        declaration: 'long',
        sentences: [],
        name: 'Get_Map_Value_Keys_In_A'
    },
    {
        argsMemObj: [],
        asmName: 'Set_Map_Value_Keys_In_A',
        declaration: 'void',
        sentences: [],
        name: 'Set_Map_Value_Keys_In_A'
    },
    {
        argsMemObj: [],
        asmName: 'Issue_Asset',
        declaration: 'long',
        sentences: [],
        name: 'Issue_Asset'
    },
    {
        argsMemObj: [],
        asmName: 'Mint_Asset',
        declaration: 'void',
        sentences: [],
        name: 'Mint_Asset'
    },
    {
        argsMemObj: [],
        asmName: 'Distribute_To_Asset_Holders',
        declaration: 'void',
        sentences: [],
        name: 'Distribute_To_Asset_Holders'
    },
    {
        argsMemObj: [],
        asmName: 'Get_Asset_Holders_Count',
        declaration: 'long',
        sentences: [],
        name: 'Get_Asset_Holders_Count'
    },
    {
        argsMemObj: [],
        asmName: 'Get_Activation_Fee',
        declaration: 'long',
        sentences: [],
        name: 'Get_Activation_Fee'
    },
    {
        argsMemObj: [],
        asmName: 'Put_Last_Block_GSig_In_A',
        declaration: 'void',
        sentences: [],
        name: 'Put_Last_Block_GSig_In_A'
    },
    {
        argsMemObj: [],
        asmName: 'Get_Asset_Circulating',
        declaration: 'long',
        sentences: [],
        name: 'Get_Asset_Circulating'
    }
]

export const fixedAPITableTemplate: SC_FUNCTION[] = [
    {
        argsMemObj: [],
        asmName: 'get_A1',
        declaration: 'fixed',
        sentences: [],
        name: 'F_Get_A1'
    },
    {
        argsMemObj: [],
        asmName: 'get_A2',
        declaration: 'fixed',
        sentences: [],
        name: 'F_Get_A2'
    },
    {
        argsMemObj: [],
        asmName: 'get_A3',
        declaration: 'fixed',
        sentences: [],
        name: 'F_Get_A3'
    },
    {
        argsMemObj: [],
        asmName: 'get_A4',
        declaration: 'fixed',
        sentences: [],
        name: 'F_Get_A4'
    },
    {
        argsMemObj: [],
        asmName: 'get_B1',
        declaration: 'fixed',
        sentences: [],
        name: 'F_Get_B1'
    },
    {
        argsMemObj: [],
        asmName: 'get_B2',
        declaration: 'fixed',
        sentences: [],
        name: 'F_Get_B2'
    },
    {
        argsMemObj: [],
        asmName: 'get_B3',
        declaration: 'fixed',
        sentences: [],
        name: 'F_Get_B3'
    },
    {
        argsMemObj: [],
        asmName: 'get_B4',
        declaration: 'fixed',
        sentences: [],
        name: 'F_Get_B4'
    },
    {
        argsMemObj: [fixedArg],
        asmName: 'set_A1',
        declaration: 'void',
        sentences: [],
        name: 'F_Set_A1'
    },
    {
        argsMemObj: [fixedArg],
        asmName: 'set_A2',
        declaration: 'void',
        sentences: [],
        name: 'F_Set_A2'
    },
    {
        argsMemObj: [fixedArg],
        asmName: 'set_A3',
        declaration: 'void',
        sentences: [],
        name: 'F_Set_A3'
    },
    {
        argsMemObj: [fixedArg],
        asmName: 'set_A4',
        declaration: 'void',
        sentences: [],
        name: 'F_Set_A4'
    },
    {
        argsMemObj: [fixedArg],
        asmName: 'set_B1',
        declaration: 'void',
        sentences: [],
        name: 'F_Set_B1'
    },
    {
        argsMemObj: [fixedArg],
        asmName: 'set_B2',
        declaration: 'void',
        sentences: [],
        name: 'F_Set_B2'
    },
    {
        argsMemObj: [fixedArg],
        asmName: 'set_B3',
        declaration: 'void',
        sentences: [],
        name: 'F_Set_B3'
    },
    {
        argsMemObj: [fixedArg],
        asmName: 'set_B4',
        declaration: 'void',
        sentences: [],
        name: 'F_Set_B4'
    },
    {
        argsMemObj: [],
        asmName: 'get_Amount_for_Tx_in_A',
        declaration: 'fixed',
        sentences: [],
        name: 'F_Get_Amount_For_Tx_In_A'
    },
    {
        argsMemObj: [],
        asmName: 'get_Current_Balance',
        declaration: 'fixed',
        sentences: [],
        name: 'F_Get_Current_Balance'
    },
    {
        argsMemObj: [],
        asmName: 'get_Previous_Balance',
        declaration: 'fixed',
        sentences: [],
        name: 'F_Get_Previous_Balance'
    },
    {
        argsMemObj: [fixedArg],
        asmName: 'send_to_Address_in_B',
        declaration: 'void',
        sentences: [],
        name: 'F_Send_To_Address_In_B'
    },
    {
        argsMemObj: [],
        asmName: 'Get_Map_Value_Keys_In_A',
        declaration: 'fixed',
        sentences: [],
        name: 'F_Get_Map_Value_Keys_In_A'
    },
    {
        argsMemObj: [],
        asmName: 'Get_Activation_Fee',
        declaration: 'fixed',
        sentences: [],
        name: 'F_Get_Activation_Fee'
    },
    {
        argsMemObj: [],
        asmName: 'Get_Asset_Circulating',
        declaration: 'fixed',
        sentences: [],

        name: 'F_Get_Asset_Circulating'
    }
]
