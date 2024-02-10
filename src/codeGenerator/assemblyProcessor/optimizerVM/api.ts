import { CONTRACT, MemoryObj, unknownValue } from './index'

interface T_EXT {
    funName: string
}
interface T_EXT_FUN extends T_EXT{
    execute(ContractState: CONTRACT): boolean|null
}
interface T_EXT_FUN_DAT extends T_EXT{
    execute(ContractState: CONTRACT, value: MemoryObj): boolean|null
}
interface T_EXT_FUN_DAT_2 extends T_EXT{
    execute(ContractState: CONTRACT, value1: MemoryObj, value2: MemoryObj): boolean|null
}
interface T_EXT_FUN_RET extends T_EXT{
    execute(ContractState: CONTRACT, RetVar: MemoryObj): boolean|null
}
interface T_EXT_FUN_RET_DAT_2 extends T_EXT{
    execute(ContractState: CONTRACT, RetVar: MemoryObj, value1: MemoryObj, value2: MemoryObj): boolean|null
}

function metaUnknownSuperRegisterA (ContractState: CONTRACT) : boolean {
    ContractState.unknownSuperRegisterA()
    return true
}
function metaUnknownSuperRegisterB (ContractState: CONTRACT) : boolean {
    ContractState.unknownSuperRegisterB()
    return true
}
export function metaDoNothing () : boolean {
    return true
}
function metaUB1ZB2ZB3ZB4 (ContractState: CONTRACT) : boolean {
    const B1 = ContractState.getMemoryByName('B1')
    const B2 = ContractState.getMemoryByName('B2')
    const B3 = ContractState.getMemoryByName('B3')
    const B4 = ContractState.getMemoryByName('B4')
    ContractState.unknownAndRevoke(B1)
    ContractState.zeroAndRevoke(B2)
    ContractState.zeroAndRevoke(B3)
    ContractState.zeroAndRevoke(B4)
    return true
}
function metaSetAndRevokeVariable (ContractState: CONTRACT, ContentVar: MemoryObj, variableName: string) : boolean|null {
    const superReg = ContractState.getMemoryByName(variableName)
    if (superReg.shadow === ContentVar.varName) {
        // Optimize setting same variable content
        return null
    }
    if (superReg.value !== unknownValue && superReg.value === ContentVar.value) {
        // Optimize setting same constant content
        return null
    }
    ContractState.setAndRevoke(superReg, ContentVar)
    return true
}
function metaDoubleSetSuperregister (ContractState: CONTRACT, ContentVar1: MemoryObj, ContentVar2: MemoryObj, reg1: string, reg2: string) : boolean|null {
    const superReg1 = ContractState.getMemoryByName(reg1)
    const superReg2 = ContractState.getMemoryByName(reg2)
    if ((superReg1.shadow === ContentVar1.varName || (superReg1.value !== unknownValue && superReg1.value === ContentVar1.value)) &&
        (superReg2.shadow === ContentVar2.varName || (superReg2.value !== unknownValue && superReg2.value === ContentVar2.value))) {
        // Optimize setting same variable/constant content
        return null
    }
    ContractState.setAndRevoke(superReg1, ContentVar1)
    ContractState.setAndRevoke(superReg2, ContentVar2)
    return true
}
function metaUnknowAndRevokeVariable (ContractState: CONTRACT, RetVar: MemoryObj) : boolean {
    ContractState.unknownAndRevoke(RetVar)
    return true
}
function metaGetSuperregister (ContractState: CONTRACT, RetVar: MemoryObj, reg: string) : boolean|null {
    const superReg = ContractState.getMemoryByName(reg)
    if (superReg.shadow === RetVar.varName || (superReg.value !== unknownValue && superReg.value === RetVar.value)) {
        // Optimize same content
        return null
    }
    ContractState.unknownAndRevoke(RetVar)
    RetVar.shadow = superReg.varName
    superReg.shadow = RetVar.varName
    return true
}

export class API_MICROCODE {
    static readonly EXT_FUN: T_EXT_FUN[] = [
        {
            funName: 'clear_A',
            execute (ContractState) {
                const A1 = ContractState.getMemoryByName('A1')
                const A2 = ContractState.getMemoryByName('A2')
                const A3 = ContractState.getMemoryByName('A3')
                const A4 = ContractState.getMemoryByName('A4')
                if (A1.value === 0n && A2.value === 0n && A3.value === 0n && A4.value === 0n) {
                    // Optimize: already all zero
                    return null
                }
                ContractState.zeroAndRevoke(A1)
                ContractState.zeroAndRevoke(A2)
                ContractState.zeroAndRevoke(A3)
                ContractState.zeroAndRevoke(A4)
                return true
            }
        },
        {
            funName: 'clear_B',
            execute (ContractState) {
                const B1 = ContractState.getMemoryByName('B1')
                const B2 = ContractState.getMemoryByName('B2')
                const B3 = ContractState.getMemoryByName('B3')
                const B4 = ContractState.getMemoryByName('B4')
                if (B1.value === 0n && B2.value === 0n && B3.value === 0n && B4.value === 0n) {
                    // Optimize: already all zero
                    return null
                }
                ContractState.zeroAndRevoke(B1)
                ContractState.zeroAndRevoke(B2)
                ContractState.zeroAndRevoke(B3)
                ContractState.zeroAndRevoke(B4)
                return true
            }
        },
        {
            funName: 'clear_A_B',
            execute (ContractState) {
                const A1 = ContractState.getMemoryByName('A1')
                const A2 = ContractState.getMemoryByName('A2')
                const A3 = ContractState.getMemoryByName('A3')
                const A4 = ContractState.getMemoryByName('A4')
                const B1 = ContractState.getMemoryByName('B1')
                const B2 = ContractState.getMemoryByName('B2')
                const B3 = ContractState.getMemoryByName('B3')
                const B4 = ContractState.getMemoryByName('B4')
                if (A1.value === 0n && A2.value === 0n && A3.value === 0n && A4.value === 0n &&
                    B1.value === 0n && B2.value === 0n && B3.value === 0n && B4.value === 0n) {
                    // Optimize: already all zero
                    return null
                }
                ContractState.zeroAndRevoke(A1)
                ContractState.zeroAndRevoke(A2)
                ContractState.zeroAndRevoke(A3)
                ContractState.zeroAndRevoke(A4)
                ContractState.zeroAndRevoke(B1)
                ContractState.zeroAndRevoke(B2)
                ContractState.zeroAndRevoke(B3)
                ContractState.zeroAndRevoke(B4)
                return true
            }
        },
        {
            funName: 'copy_A_From_B',
            execute: metaUnknownSuperRegisterA
        },
        {
            funName: 'copy_B_From_A',
            execute: metaUnknownSuperRegisterB
        },
        {
            funName: 'swap_A_and_B',
            execute (ContractState) {
                ContractState.unknownSuperRegisterA()
                ContractState.unknownSuperRegisterB()
                return true
            }
        },
        {
            funName: 'OR_A_with_B',
            execute: metaUnknownSuperRegisterA
        },
        {
            funName: 'OR_B_with_A',
            execute: metaUnknownSuperRegisterB
        },
        {
            funName: 'AND_A_with_B',
            execute: metaUnknownSuperRegisterA
        },
        {
            funName: 'AND_B_with_A',
            execute: metaUnknownSuperRegisterB
        },
        {
            funName: 'XOR_A_with_B',
            execute: metaUnknownSuperRegisterA
        },
        {
            funName: 'XOR_B_with_A',
            execute: metaUnknownSuperRegisterB
        },
        {
            funName: 'add_A_to_B',
            execute: metaUnknownSuperRegisterB
        },
        {
            funName: 'add_B_to_A',
            execute: metaUnknownSuperRegisterA
        },
        {
            funName: 'sub_A_from_B',
            execute: metaUnknownSuperRegisterB
        },
        {
            funName: 'sub_B_from_A',
            execute: metaUnknownSuperRegisterA
        },
        {
            funName: 'mul_A_by_B',
            execute: metaUnknownSuperRegisterB
        },
        {
            funName: 'mul_B_by_A',
            execute: metaUnknownSuperRegisterA
        },
        {
            funName: 'div_A_by_B',
            execute: metaUnknownSuperRegisterB
        },
        {
            funName: 'div_B_by_A',
            execute: metaUnknownSuperRegisterA
        },
        {
            funName: 'MD5_A_to_B',
            execute: metaUnknownSuperRegisterB
        },
        {
            funName: 'HASH160_A_to_B',
            execute: metaUnknownSuperRegisterB
        },
        {
            funName: 'SHA256_A_to_B',
            execute: metaUnknownSuperRegisterB
        },
        {
            funName: 'put_Last_Block_Hash_In_A',
            execute: metaUnknownSuperRegisterA
        },
        {
            funName: 'message_from_Tx_in_A_to_B',
            execute: metaUnknownSuperRegisterB
        },
        {
            funName: 'B_to_Address_of_Tx_in_A',
            execute: metaUB1ZB2ZB3ZB4
        },
        {
            funName: 'B_to_Address_of_Creator',
            execute: metaUB1ZB2ZB3ZB4
        },
        {
            funName: 'B_To_Assets_Of_Tx_In_A',
            execute: metaUnknownSuperRegisterB
        },
        {
            funName: 'send_All_to_Address_in_B',
            execute: metaDoNothing
        },
        {
            funName: 'send_Old_to_Address_in_B',
            execute: metaDoNothing
        },
        {
            funName: 'send_A_to_Address_in_B',
            execute: metaDoNothing
        },
        {
            funName: 'Set_Map_Value_Keys_In_A',
            execute: metaDoNothing
        },
        {
            funName: 'Mint_Asset',
            execute: metaDoNothing
        },
        {
            funName: 'Distribute_To_Asset_Holders',
            execute: metaDoNothing
        },
        {
            funName: 'Put_Last_Block_GSig_In_A',
            execute: metaUnknownSuperRegisterA
        }
    ]

    static readonly EXT_FUN_DAT: T_EXT_FUN_DAT[] = [
        {
            funName: 'set_A1',
            execute (ContractState, ContentVar) {
                return metaSetAndRevokeVariable(ContractState, ContentVar, 'A1')
            }
        },
        {
            funName: 'set_A2',
            execute (ContractState, ContentVar) {
                return metaSetAndRevokeVariable(ContractState, ContentVar, 'A2')
            }
        },
        {
            funName: 'set_A3',
            execute (ContractState, ContentVar) {
                return metaSetAndRevokeVariable(ContractState, ContentVar, 'A3')
            }
        },
        {
            funName: 'set_A4',
            execute (ContractState, ContentVar) {
                return metaSetAndRevokeVariable(ContractState, ContentVar, 'A4')
            }
        },
        {
            funName: 'set_B1',
            execute (ContractState, ContentVar) {
                return metaSetAndRevokeVariable(ContractState, ContentVar, 'B1')
            }
        },
        {
            funName: 'set_B2',
            execute (ContractState, ContentVar) {
                return metaSetAndRevokeVariable(ContractState, ContentVar, 'B2')
            }
        },
        {
            funName: 'set_B3',
            execute (ContractState, ContentVar) {
                return metaSetAndRevokeVariable(ContractState, ContentVar, 'B3')
            }
        },
        {
            funName: 'set_B4',
            execute (ContractState, ContentVar) {
                return metaSetAndRevokeVariable(ContractState, ContentVar, 'B4')
            }
        },
        {
            funName: 'A_to_Tx_after_Timestamp',
            execute (ContractState, value) {
                const A1 = ContractState.getMemoryByName('A1')
                const A2 = ContractState.getMemoryByName('A2')
                const A3 = ContractState.getMemoryByName('A3')
                const A4 = ContractState.getMemoryByName('A4')
                ContractState.unknownAndRevoke(A1)
                ContractState.zeroAndRevoke(A2)
                ContractState.zeroAndRevoke(A3)
                ContractState.zeroAndRevoke(A4)
                return true
            }
        },
        {
            funName: 'send_to_Address_in_B',
            execute: metaDoNothing
        }
    ]

    static readonly EXT_FUN_DAT_2: T_EXT_FUN_DAT_2[] = [
        {
            funName: 'set_A1_A2',
            execute (ContractState, ContentVar1, ContentVar2) {
                return metaDoubleSetSuperregister(ContractState, ContentVar1, ContentVar2, 'A1', 'A2')
            }
        },
        {
            funName: 'set_A3_A4',
            execute (ContractState, ContentVar1, ContentVar2) {
                return metaDoubleSetSuperregister(ContractState, ContentVar1, ContentVar2, 'A3', 'A4')
            }
        },
        {
            funName: 'set_B1_B2',
            execute (ContractState, ContentVar1, ContentVar2) {
                return metaDoubleSetSuperregister(ContractState, ContentVar1, ContentVar2, 'B1', 'B2')
            }
        },
        {
            funName: 'set_B3_B4',
            execute (ContractState, ContentVar1, ContentVar2) {
                return metaDoubleSetSuperregister(ContractState, ContentVar1, ContentVar2, 'B3', 'B4')
            }
        }
    ]

    static readonly EXT_FUN_RET: T_EXT_FUN_RET[] = [
        {
            funName: 'get_A1',
            execute (ContractState, RetVar) {
                return metaGetSuperregister(ContractState, RetVar, 'A1')
            }
        },
        {
            funName: 'get_A2',
            execute (ContractState, RetVar) {
                return metaGetSuperregister(ContractState, RetVar, 'A2')
            }
        },
        {
            funName: 'get_A3',
            execute (ContractState, RetVar) {
                return metaGetSuperregister(ContractState, RetVar, 'A3')
            }
        },
        {
            funName: 'get_A4',
            execute (ContractState, RetVar) {
                return metaGetSuperregister(ContractState, RetVar, 'A4')
            }
        },
        {
            funName: 'get_B1',
            execute (ContractState, RetVar) {
                return metaGetSuperregister(ContractState, RetVar, 'B1')
            }
        },
        {
            funName: 'get_B2',
            execute (ContractState, RetVar) {
                return metaGetSuperregister(ContractState, RetVar, 'B2')
            }
        },
        {
            funName: 'get_B3',
            execute (ContractState, RetVar) {
                return metaGetSuperregister(ContractState, RetVar, 'B3')
            }
        },
        {
            funName: 'get_B4',
            execute (ContractState, RetVar) {
                return metaGetSuperregister(ContractState, RetVar, 'B4')
            }
        },
        {
            funName: 'check_A_Is_Zero',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'check_B_Is_Zero',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'check_A_equals_B',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'check_MD5_A_with_B',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'check_HASH160_A_with_B',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'check_SHA256_A_with_B',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'Check_Sig_B_With_A',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'get_Block_Timestamp',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'get_Creation_Timestamp',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'get_Last_Block_Timestamp',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'get_Type_for_Tx_in_A',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'get_Amount_for_Tx_in_A',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'get_Timestamp_for_Tx_in_A',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'get_Ticket_Id_for_Tx_in_A',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'get_Current_Balance',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'get_Previous_Balance',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'Get_Code_Hash_Id',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'Get_Map_Value_Keys_In_A',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'Issue_Asset',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'Get_Asset_Holders_Count',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'Get_Activation_Fee',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'Get_Asset_Circulating',
            execute: metaUnknowAndRevokeVariable
        },
        {
            funName: 'Get_Account_Balance',
            execute: metaUnknowAndRevokeVariable
        }
    ]

    static readonly EXT_FUN_RET_DAT_2: T_EXT_FUN_RET_DAT_2[] = [
        {
            funName: 'add_Minutes_to_Timestamp',
            execute: metaUnknowAndRevokeVariable
        }
    ]
}
