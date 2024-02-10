import { Constants, CONTRACT, unknownValue, utils } from './index'
import { API_MICROCODE, metaDoNothing } from './api'

interface CPU_MICROCODE {
    name: string
    regex: RegExp
    execute (ContractState: CONTRACT, regexParts: RegExpExecArray) : boolean|null
}

function metaUnknowAndRevokeVariableAtOne (ContractState: CONTRACT, regexParts: RegExpExecArray) {
    const variable1 = ContractState.getMemoryByName(regexParts[1])
    ContractState.unknownAndRevoke(variable1)
    return true
}
function metaReset (ContractState: CONTRACT) : boolean|null {
    ContractState.unknownMemory(false, false)
    return true
}

export class CPU {
    static readonly cpuMicrocode: CPU_MICROCODE[] = [
        {
            name: 'blank',
            regex: /^\s*$/,
            execute: metaDoNothing
        },
        {
            name: 'label',
            regex: /^\s*(\w+):\s*$/,
            execute (ContractState, regexParts) {
                if (regexParts[1].startsWith('__opt_') || regexParts[1].startsWith('__GNT_')) {
                    // Optimization with __opt just swap to RET or FIN, so no destruction inside this branch
                    // Same with __GNT_ that is a simple loop of getNextTx().
                    return false
                }
                return metaReset(ContractState)
            }
        },
        {
            name: 'comment',
            regex: /^\s*\^comment\s+(.*)/,
            execute: metaDoNothing
        },
        {
            name: 'declare',
            regex: /^\s*\^declare\s+(\w+)\s*$/,
            execute (ContractState, regexParts) {
                if (ContractState.Memory.find(mem => mem.varName === regexParts[1]) === undefined) {
                    let value = unknownValue
                    if (/^n\d+$/.test(regexParts[1])) {
                        value = BigInt(regexParts[1].substring(1))
                    }
                    ContractState.Memory.push({ varName: regexParts[1], value, shadow: '' })
                }
                return false
            }
        },
        {
            name: 'const',
            regex: /^\s*\^const\s+SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/,
            execute: metaDoNothing
        },
        {
            name: 'program',
            regex: /^\s*\^program\s(.+)$/,
            execute: metaDoNothing
        },
        {
            name: 'SET_VAL',
            regex: /^\s*SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/,
            execute (ContractState, regexParts) {
                const variable = ContractState.getMemoryByName(regexParts[1])
                const val = BigInt('0x' + regexParts[2])
                if (variable.value !== unknownValue && variable.value === val) {
                    // Optimize set val same content
                    return null
                }
                variable.value = BigInt('0x' + regexParts[2])
                variable.shadow = ''
                ContractState.revokeShadow(variable.varName)
                return true
            }
        },
        {
            name: 'SET_DAT',
            regex: /^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.getMemoryByName(regexParts[1])
                const variable2 = ContractState.getMemoryByName(regexParts[2])
                if (variable1.value !== unknownValue && variable1.value === variable2.value) {
                    // Optimize: same content
                    return null
                }
                if (variable1.shadow === variable2.varName) {
                    // Optimize: Same variable
                    return null
                }
                ContractState.setAndRevoke(variable1, variable2)
                return true
            }
        },
        {
            name: 'CLR',
            regex: /^\s*CLR\s+@(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.getMemoryByName(regexParts[1])
                if (variable1.value === 0n) {
                    // Optimize setting zero to something with zero
                    return null
                }
                ContractState.zeroAndRevoke(variable1)
                return true
            }
        },
        {
            name: 'INC',
            regex: /^\s*INC\s+@(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.getMemoryByName(regexParts[1])
                if (variable1.value !== unknownValue) {
                    variable1.value = (variable1.value + 1n) % 18446744073709551616n
                }
                variable1.shadow = ''
                ContractState.revokeShadow(variable1.varName)
                return true
            }
        },
        {
            name: 'DEC',
            regex: /^\s*DEC\s+@(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.getMemoryByName(regexParts[1])
                if (variable1.value !== unknownValue) {
                    if (variable1.value === 0n) {
                        variable1.value = Constants.minus1
                    } else {
                        variable1.value = variable1.value - 1n
                    }
                }
                variable1.shadow = ''
                ContractState.revokeShadow(variable1.varName)
                return true
            }
        },
        {
            name: 'ADD',
            regex: /^\s*ADD\s+@(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.getMemoryByName(regexParts[1])
                const variable2 = ContractState.getMemoryByName(regexParts[2])
                if (variable2.value === 0n) {
                    // Optimize adding zero
                    return null
                }
                if (variable1.value !== unknownValue && variable2.value !== unknownValue) {
                    variable1.value = (variable1.value + variable2.value) % Constants.pow2to64
                } else {
                    variable1.value = unknownValue
                }
                variable1.shadow = ''
                ContractState.revokeShadow(variable1.varName)
                return true
            }
        },
        {
            name: 'SUB',
            regex: /^\s*SUB\s+@(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.getMemoryByName(regexParts[1])
                const variable2 = ContractState.getMemoryByName(regexParts[2])
                if (variable2.value === 0n) {
                    // Optimize subtracting zero
                    return null
                }
                if (variable1.value !== unknownValue && variable2.value !== unknownValue) {
                    variable1.value = (Constants.pow2to64 + variable1.value - variable2.value) % Constants.pow2to64
                } else {
                    variable1.value = unknownValue
                }
                variable1.shadow = ''
                ContractState.revokeShadow(variable1.varName)
                return true
            }
        },
        {
            name: 'MUL',
            regex: /^\s*MUL\s+@(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.getMemoryByName(regexParts[1])
                const variable2 = ContractState.getMemoryByName(regexParts[2])
                if (variable2.value === 1n) {
                    // Optimize multiply by one
                    return null
                }
                if (variable1.value !== unknownValue && variable2.value !== unknownValue) {
                    variable1.value = (variable1.value * variable2.value) % Constants.pow2to64
                } else {
                    variable1.value = unknownValue
                }
                variable1.shadow = ''
                ContractState.revokeShadow(variable1.varName)
                return true
            }
        },
        {
            name: 'DIV',
            regex: /^\s*DIV\s+@(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.getMemoryByName(regexParts[1])
                const variable2 = ContractState.getMemoryByName(regexParts[2])
                if (variable2.value === 1n) {
                    // Optimize divide by one
                    return null
                }
                if (variable1.value !== unknownValue && variable2.value !== unknownValue) {
                    const val1 = utils.unsigned2signed(variable1.value)
                    const val2 = utils.unsigned2signed(variable2.value)

                    variable1.value = utils.signed2unsigned(val1 / val2)
                } else {
                    variable1.value = unknownValue
                }
                variable1.shadow = ''
                ContractState.revokeShadow(variable1.varName)
                return true
            }
        },
        {
            name: 'BOR / AND / XOR',
            regex: /^\s*(?:BOR|AND|XOR)\s+@(\w+)\s+\$(\w+)\s*$/,
            execute: metaUnknowAndRevokeVariableAtOne
        },
        {
            name: 'NOT',
            regex: /^\s*NOT\s+@(\w+)\s*$/,
            execute: metaUnknowAndRevokeVariableAtOne
        },
        {
            name: 'SET_IND',
            regex: /^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\)\s*$/,
            execute: metaUnknowAndRevokeVariableAtOne
        },
        {
            name: 'SET_IDX',
            regex: /^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\s*\+\s*\$(\w+)\)\s*$/,
            execute: metaUnknowAndRevokeVariableAtOne
        },
        {
            name: 'PSH',
            regex: /^\s*PSH\s+\$(\w+)\s*$/,
            execute: metaDoNothing
        },
        {
            name: 'POP',
            regex: /^\s*POP\s+@(\w+)\s*$/,
            execute: metaUnknowAndRevokeVariableAtOne
        },
        {
            name: 'JMP_SUB',
            regex: /^\s*JSR\s+:(\w+)\s*$/,
            execute: metaReset
        },
        {
            name: 'RET_SUB',
            regex: /^\s*RET\s*$/,
            execute: metaDoNothing
        },
        {
            name: 'IND_DAT',
            regex: /^\s*SET\s+@\(\$(\w+)\)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.getMemoryByName(regexParts[1])
                const variable2 = ContractState.getMemoryByName(regexParts[2])
                const addr = Number(variable1.value)
                if (variable1.value !== unknownValue) {
                    ContractState.Memory[addr].value = variable2.value
                    ContractState.Memory[addr].shadow = variable2.varName
                } else {
                    // It is not possible to know which variable was updated. Unknow to all memory variable.
                    ContractState.unknownMemory(true, true)
                }
                return true
            }
        },
        {
            name: 'IDX_DAT',
            regex: /^\s*SET\s+@\(\$(\w+)\s*\+\s*\$(\w+)\)\s+\$(\w+)\s*$/,
            execute (ContractState, _regexParts) {
                // It is not possible to know which variable was updated. Unknow to all memory variable.
                ContractState.unknownMemory(true, true)
                return true
            }
        },
        {
            name: 'MOD_DAT',
            regex: /^\s*MOD\s+@(\w+)\s+\$(\w+)\s*$/,
            execute: metaUnknowAndRevokeVariableAtOne
        },
        {
            name: 'SHL / SHR',
            regex: /^\s*(?:SHL|SHR)\s+@(\w+)\s+\$(\w+)\s*$/,
            execute: metaUnknowAndRevokeVariableAtOne
        },
        {
            name: 'POW_DAT',
            regex: /^\s*POW\s+@(\w+)\s+\$(\w+)\s*$/,
            execute: metaUnknowAndRevokeVariableAtOne
        },
        {
            name: 'JMP_ADR',
            regex: /^\s*JMP\s+:(\w+)\s*$/,
            execute: metaDoNothing
        },
        {
            name: 'BZR / BNZ',
            regex: /^\s*(BZR|BNZ)\s+\$(\w+)\s+:(\w+)\s*$/,
            execute: metaDoNothing
        },
        {
            name: 'BGT / BLT / BGE / BLE / BEQ / BNE',
            regex: /^\s*(BGT|BLT|BGE|BLE|BEQ|BNE)\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/,
            execute: metaDoNothing
        },
        {
            name: 'SLP_DAT',
            regex: /^\s*SLP\s+\$(\w+)\s*$/,
            execute: metaDoNothing
        },
        {
            name: 'SLP_IMD',
            regex: /^\s*SLP\s*$/,
            execute: metaDoNothing
        },
        {
            name: 'FIZ_DAT',
            regex: /^\s*FIZ\s+\$(\w+)\s*$/,
            execute: metaDoNothing
        },
        {
            name: 'STZ_DAT',
            regex: /^\s*STZ\s+\$(\w+)\s*$/,
            execute: metaDoNothing
        },
        {
            name: 'FIN_IMD',
            regex: /^\s*FIN\s*$/,
            execute: metaDoNothing
        },
        {
            name: 'STP_IMD',
            regex: /^\s*STP\s*$/,
            execute: metaDoNothing
        },
        {
            name: 'ERR_ADR',
            regex: /^\s*ERR\s+:(\w+)\s*$/,
            execute: metaDoNothing
        },
        {
            name: 'SET_PCS',
            regex: /^\s*PCS\s*$/,
            execute: metaReset
        },
        {
            name: 'MDV_DAT',
            regex: /^\s*MDV\s+@(\w+)\s+\$(\w+)\s+\$(\w+)\s*$/,
            execute: metaUnknowAndRevokeVariableAtOne
        },
        {
            name: 'EXT_FUN',
            regex: /^\s*FUN\s+(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const Api = API_MICROCODE.EXT_FUN.find(Obj => Obj.funName === regexParts[1])
                if (Api === undefined) {
                    throw new Error(`Unknow API Function ${regexParts[1]}`)
                }
                return Api.execute(ContractState)
            }
        },
        {
            name: 'EXT_FUN_DAT',
            regex: /^\s*FUN\s+(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const Api = API_MICROCODE.EXT_FUN_DAT.find(Obj => Obj.funName === regexParts[1])
                if (Api === undefined) {
                    throw new Error(`Unknow API Function ${regexParts[1]}`)
                }
                const variable1 = ContractState.getMemoryByName(regexParts[2])
                return Api.execute(ContractState, variable1)
            }
        },
        {
            name: 'EXT_FUN_DAT_2',
            regex: /^\s*FUN\s+(\w+)\s+\$(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const Api = API_MICROCODE.EXT_FUN_DAT_2.find(Obj => Obj.funName === regexParts[1])
                if (Api === undefined) {
                    throw new Error(`Unknow API Function ${regexParts[1]}`)
                }
                const variable1 = ContractState.getMemoryByName(regexParts[2])
                const variable2 = ContractState.getMemoryByName(regexParts[3])
                return Api.execute(ContractState, variable1, variable2)
            }
        },
        {
            name: 'EXT_FUN_RET',
            regex: /^\s*FUN\s+@(\w+)\s+(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const Api = API_MICROCODE.EXT_FUN_RET.find(Obj => Obj.funName === regexParts[2])
                if (Api === undefined) {
                    throw new Error(`Unknow API Function ${regexParts[1]}`)
                }
                const retVar = ContractState.getMemoryByName(regexParts[1])
                return Api.execute(ContractState, retVar)
            }
        },
        {
            name: 'EXT_FUN_RET_DAT',
            regex: /^\s*FUN\s+@(\w+)\s+(\w+)\s+\$(\w+)\s*$/,
            execute (_ContractState, regexParts) {
                throw new Error(`Unknow API Function ${regexParts[2]}`)
            }
        },
        {
            name: 'EXT_FUN_RET_DAT_2',
            regex: /^\s*FUN\s+@(\w+)\s+(\w+)\s+\$(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const Api = API_MICROCODE.EXT_FUN_RET_DAT_2.find(Obj => Obj.funName === regexParts[2])
                if (Api === undefined) {
                    throw new Error(`Unknow API Function ${regexParts[2]}`)
                }
                const retVar = ContractState.getMemoryByName(regexParts[1])
                const variable1 = ContractState.getMemoryByName(regexParts[3])
                const variable2 = ContractState.getMemoryByName(regexParts[4])
                return Api.execute(ContractState, retVar, variable1, variable2)
            }
        },
        {
            name: 'NOP',
            regex: /^\s*NOP\s*$/,
            execute: metaDoNothing
        }
    ]

    /** Process one line of assembly code.
      * @returns true or false for no optimization
      * null if line can be optimized (deleted)  */
    static cpu (ContractState: CONTRACT, line: number) {
        const currLine = ContractState.asmCodeArr[line]

        const InstructionObj = this.cpuMicrocode.find(currCode => {
            if (currCode.regex.exec(currLine) === null) {
                return false
            }
            return true
        })

        if (InstructionObj === undefined) {
            throw new Error(`Wrong line of code: '${currLine}'`)
        }
        const currParts = InstructionObj.regex.exec(currLine)
        if (currParts === null) {
            throw new Error(`Wrong line of code: '${currLine}'`)
        }

        return InstructionObj.execute(ContractState, currParts)
    }

    /**
     * Loop all lines colecting assembly directives
     *
     * @param {CONTRACT} ContractState - Contract to execute function
     * */
    static cpuDeploy (ContractState: CONTRACT) {
        let lastExecResult: RegExpExecArray | null, currCode: CPU_MICROCODE | undefined

        ContractState.asmCodeArr.forEach(line => {
            if (/^\s*\^.*/.exec(line) !== null) {
                // visit all compiler directives to deploy contract
                currCode = CPU.cpuMicrocode.find(instr => {
                    lastExecResult = instr.regex.exec(line)
                    if (lastExecResult === null) {
                        return false
                    }
                    return true
                })
                if (currCode !== undefined && lastExecResult !== null) {
                    currCode.execute(ContractState, lastExecResult)
                }
            }
        })
    }
}
