import { CONTRACT, MemoryObj, unknownValue } from './index'

interface T_EXT {
    funName: string
    opCode: number
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
    execute(ContractState: CONTRACT, value1: MemoryObj, value2: MemoryObj): boolean|null
}

export class API_MICROCODE {
    static EXT_FUN: T_EXT_FUN[] = [
        {
            funName: 'clear_A',
            opCode: 0x32,
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
            opCode: 0x32,
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
            opCode: 0x32,
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
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterA()
                return true
            }
        },
        {
            funName: 'copy_B_From_A',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterB()
                return true
            }
        },
        {
            funName: 'swap_A_and_B',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisters()
                return true
            }
        },
        {
            funName: 'OR_A_with_B',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterA()
                return true
            }
        },
        {
            funName: 'OR_B_with_A',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterB()
                return true
            }
        },
        {
            funName: 'AND_A_with_B',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterA()
                return true
            }
        },
        {
            funName: 'AND_B_with_A',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterB()
                return true
            }
        },
        {
            funName: 'XOR_A_with_B',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterA()
                return true
            }
        },
        {
            funName: 'XOR_B_with_A',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterB()
                return true
            }
        },
        {
            funName: 'add_A_to_B',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterB()
                return true
            }
        },
        {
            funName: 'add_B_to_A',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterA()
                return true
            }
        },
        {
            funName: 'sub_A_from_B',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterB()
                return true
            }
        },
        {
            funName: 'sub_B_from_A',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterA()
                return true
            }
        },
        {
            funName: 'mul_A_by_B',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterB()
                return true
            }
        },
        {
            funName: 'mul_B_by_A',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterA()
                return true
            }
        },
        {
            funName: 'div_A_by_B',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterB()
                return true
            }
        },
        {
            funName: 'div_B_by_A',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterA()
                return true
            }
        },
        {
            funName: 'MD5_A_to_B',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterB()
                return true
            }
        },
        {
            funName: 'HASH160_A_to_B',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterB()
                return true
            }
        },
        {
            funName: 'SHA256_A_to_B',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterB()
                return true
            }
        },
        {
            funName: 'put_Last_Block_Hash_In_A',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterA()
                return true
            }
        },
        {
            funName: 'message_from_Tx_in_A_to_B',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterB()
                return true
            }
        },
        {
            funName: 'B_to_Address_of_Tx_in_A',
            opCode: 0x32,
            execute (ContractState) {
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
        },
        {
            funName: 'B_to_Address_of_Creator',
            opCode: 0x32,
            execute (ContractState) {
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
        },
        {
            funName: 'B_To_Assets_Of_Tx_In_A',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterB()
                return true
            }
        },
        {
            funName: 'send_All_to_Address_in_B',
            opCode: 0x32,
            execute (ContractState) {
                return true
            }
        },
        {
            funName: 'send_Old_to_Address_in_B',
            opCode: 0x32,
            execute (ContractState) {
                return true
            }
        },
        {
            funName: 'send_A_to_Address_in_B',
            opCode: 0x32,
            execute (ContractState) {
                return true
            }
        },
        {
            funName: 'Set_Map_Value_Keys_In_A',
            opCode: 0x32,
            execute (ContractState) {
                return true
            }
        },
        {
            funName: 'Mint_Asset',
            opCode: 0x32,
            execute (ContractState) {
                return true
            }
        },
        {
            funName: 'Distribute_To_Asset_Holders',
            opCode: 0x32,
            execute (ContractState) {
                return true
            }
        },
        {
            funName: 'Put_Last_Block_GSig_In_A',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.unknowSuperRegisterA()
                return true
            }
        }
    ]

    static EXT_FUN_DAT: T_EXT_FUN_DAT[] = [
        {
            funName: 'set_A1',
            opCode: 0x33,
            execute (ContractState, ContentVar) {
                const superReg = ContractState.getMemoryByName('A1')
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
        },
        {
            funName: 'set_A2',
            opCode: 0x33,
            execute (ContractState, ContentVar) {
                const superReg = ContractState.getMemoryByName('A2')
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
        },
        {
            funName: 'set_A3',
            opCode: 0x33,
            execute (ContractState, ContentVar) {
                const superReg = ContractState.getMemoryByName('A3')
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
        },
        {
            funName: 'set_A4',
            opCode: 0x33,
            execute (ContractState, ContentVar) {
                const superReg = ContractState.getMemoryByName('A4')
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
        },
        {
            funName: 'set_B1',
            opCode: 0x33,
            execute (ContractState, ContentVar) {
                const superReg = ContractState.getMemoryByName('B1')
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
        },
        {
            funName: 'set_B2',
            opCode: 0x33,
            execute (ContractState, ContentVar) {
                const superReg = ContractState.getMemoryByName('B2')
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
        },
        {
            funName: 'set_B3',
            opCode: 0x33,
            execute (ContractState, ContentVar) {
                const superReg = ContractState.getMemoryByName('B3')
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
        },
        {
            funName: 'set_B4',
            opCode: 0x33,
            execute (ContractState, ContentVar) {
                const superReg = ContractState.getMemoryByName('B4')
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
        },
        {
            funName: 'A_to_Tx_after_Timestamp',
            opCode: 0x33,
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
            opCode: 0x33,
            execute (ContractState, value) {
                return true
            }
        }
    ]

    static EXT_FUN_DAT_2: T_EXT_FUN_DAT_2[] = [
        {
            funName: 'set_A1_A2',
            opCode: 0x34,
            execute (ContractState, ContentVar1, ContentVar2) {
                const superReg1 = ContractState.getMemoryByName('A1')
                const superReg2 = ContractState.getMemoryByName('A2')
                if ((superReg1.shadow === ContentVar1.varName || (superReg1.value !== unknownValue && superReg1.value === ContentVar1.value)) &&
                    (superReg2.shadow === ContentVar2.varName || (superReg2.value !== unknownValue && superReg2.value === ContentVar2.value))) {
                    // Optimize setting same variable/constant content
                    return null
                }
                ContractState.setAndRevoke(superReg1, ContentVar1)
                ContractState.setAndRevoke(superReg2, ContentVar2)
                return true
            }
        },
        {
            funName: 'set_A3_A4',
            opCode: 0x34,
            execute (ContractState, ContentVar1, ContentVar2) {
                const superReg1 = ContractState.getMemoryByName('A3')
                const superReg2 = ContractState.getMemoryByName('A4')
                if ((superReg1.shadow === ContentVar1.varName || (superReg1.value !== unknownValue && superReg1.value === ContentVar1.value)) &&
                    (superReg2.shadow === ContentVar2.varName || (superReg2.value !== unknownValue && superReg2.value === ContentVar2.value))) {
                    // Optimize setting same variable/constant content
                    return null
                }
                ContractState.setAndRevoke(superReg1, ContentVar1)
                ContractState.setAndRevoke(superReg2, ContentVar2)
                return true
            }
        },
        {
            funName: 'set_B1_B2',
            opCode: 0x34,
            execute (ContractState, ContentVar1, ContentVar2) {
                const superReg1 = ContractState.getMemoryByName('B1')
                const superReg2 = ContractState.getMemoryByName('B2')
                if ((superReg1.shadow === ContentVar1.varName || (superReg1.value !== unknownValue && superReg1.value === ContentVar1.value)) &&
                    (superReg2.shadow === ContentVar2.varName || (superReg2.value !== unknownValue && superReg2.value === ContentVar2.value))) {
                    // Optimize setting same variable/constant content
                    return null
                }
                ContractState.setAndRevoke(superReg1, ContentVar1)
                ContractState.setAndRevoke(superReg2, ContentVar2)
                return true
            }
        },
        {
            funName: 'set_B3_B4',
            opCode: 0x34,
            execute (ContractState, ContentVar1, ContentVar2) {
                const superReg1 = ContractState.getMemoryByName('B3')
                const superReg2 = ContractState.getMemoryByName('B4')
                if ((superReg1.shadow === ContentVar1.varName || (superReg1.value !== unknownValue && superReg1.value === ContentVar1.value)) &&
                    (superReg2.shadow === ContentVar2.varName || (superReg2.value !== unknownValue && superReg2.value === ContentVar2.value))) {
                    // Optimize setting same variable/constant content
                    return null
                }
                ContractState.setAndRevoke(superReg1, ContentVar1)
                ContractState.setAndRevoke(superReg2, ContentVar2)
                return true
            }
        }
    ]

    static EXT_FUN_RET: T_EXT_FUN_RET[] = [
        {
            funName: 'get_A1',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                const superReg = ContractState.getMemoryByName('A1')
                if (superReg.shadow === RetVar.varName || (superReg.value !== unknownValue && superReg.value === RetVar.value)) {
                    // Optimize same content
                    return null
                }
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'get_A2',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                const superReg = ContractState.getMemoryByName('A2')
                if (superReg.shadow === RetVar.varName || (superReg.value !== unknownValue && superReg.value === RetVar.value)) {
                    // Optimize same content
                    return null
                }
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'get_A3',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                const superReg = ContractState.getMemoryByName('A3')
                if (superReg.shadow === RetVar.varName || (superReg.value !== unknownValue && superReg.value === RetVar.value)) {
                    // Optimize same content
                    return null
                }
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'get_A4',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                const superReg = ContractState.getMemoryByName('A4')
                if (superReg.shadow === RetVar.varName || (superReg.value !== unknownValue && superReg.value === RetVar.value)) {
                    // Optimize same content
                    return null
                }
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'get_B1',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                const superReg = ContractState.getMemoryByName('B1')
                if (superReg.shadow === RetVar.varName || (superReg.value !== unknownValue && superReg.value === RetVar.value)) {
                    // Optimize same content
                    return null
                }
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'get_B2',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                const superReg = ContractState.getMemoryByName('B2')
                if (superReg.shadow === RetVar.varName || (superReg.value !== unknownValue && superReg.value === RetVar.value)) {
                    // Optimize same content
                    return null
                }
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'get_B3',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                const superReg = ContractState.getMemoryByName('B3')
                if (superReg.shadow === RetVar.varName || (superReg.value !== unknownValue && superReg.value === RetVar.value)) {
                    // Optimize same content
                    return null
                }
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'get_B4',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                const superReg = ContractState.getMemoryByName('B4')
                if (superReg.shadow === RetVar.varName || (superReg.value !== unknownValue && superReg.value === RetVar.value)) {
                    // Optimize same content
                    return null
                }
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'check_A_Is_Zero',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'check_B_Is_Zero',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'check_A_equals_B',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'check_MD5_A_with_B',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'check_HASH160_A_with_B',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'check_SHA256_A_with_B',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'Check_Sig_B_With_A',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'get_Block_Timestamp',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'get_Creation_Timestamp',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'get_Last_Block_Timestamp',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'get_Type_for_Tx_in_A',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'get_Amount_for_Tx_in_A',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'get_Timestamp_for_Tx_in_A',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'get_Ticket_Id_for_Tx_in_A',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'get_Current_Balance',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'get_Previous_Balance',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'Get_Code_Hash_Id',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'Get_Map_Value_Keys_In_A',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'Issue_Asset',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'Get_Asset_Holders_Count',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'Get_Activation_Fee',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        },
        {
            funName: 'Get_Asset_Circulating',
            opCode: 0x35,
            execute (ContractState, RetVar) {
                ContractState.unknownAndRevoke(RetVar)
                return true
            }
        }
    ]

    static EXT_FUN_RET_DAT_2: T_EXT_FUN_RET_DAT_2[] = [
        {
            funName: 'add_Minutes_to_Timestamp',
            opCode: 0x37,
            execute (ContractState, timestamp, minutes) {
                return true
            }
        }
    ]
}
