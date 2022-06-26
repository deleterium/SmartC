import { Constants, CONTRACT, unknownValue, utils } from './index'
import { API_MICROCODE } from './api'

interface CPU_MICROCODE {
    name: string
    stepFee: bigint
    regex: RegExp
    execute (ContractState: CONTRACT, regexParts: RegExpExecArray): boolean|null
}

export class CPU {
    static cpuMicrocode: CPU_MICROCODE[] = [
        {
            name: 'blank',
            stepFee: 0n,
            regex: /^\s*$/,
            execute (ContractState, regexParts) {
                return false
            }
        },
        {
            name: 'label',
            stepFee: 0n,
            regex: /^\s*(\w+):\s*$/,
            execute (ContractState, regexParts) {
                if (regexParts[1].startsWith('__opt_') || regexParts[1].startsWith('__GNT_')) {
                    // Optimization with __opt just swap to RET or FIN, so no destruction inside this branch
                    // Same with __GNT_ that is a simple loop of getNextTx().
                    return false
                }
                ContractState.unknowAll()
                return false
            }
        },
        {
            name: 'comment',
            stepFee: 0n,
            regex: /^\s*\^comment\s+(.*)/,
            execute (ContractState, regexParts) {
                return false
            }
        },
        {
            name: 'declare',
            stepFee: 0n,
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
            stepFee: 0n,
            regex: /^\s*\^const\s+SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/,
            execute (ContractState, regexParts) {
                return false
            }
        },
        {
            name: 'program',
            stepFee: 0n,
            regex: /^\s*\^program\s+(\w+)\s+([\s\S]+)$/,
            execute (ContractState, regexParts) {
                return false
            }
        },
        {
            name: 'SET_VAL',
            stepFee: 1n,
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
            stepFee: 1n,
            regex: /^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.getMemoryByName(regexParts[1])
                const variable2 = ContractState.getMemoryByName(regexParts[2])
                if (variable1.value !== unknownValue && variable1.value === variable2.value) {
                    // Optimize: same content
                    return null
                }
                if (variable1.shadow === variable2.varName) {
                    // Optimize: already assigned before. Same content
                    return null
                }
                ContractState.setAndRevoke(variable1, variable2)
                return true
            }
        },
        {
            name: 'CLR',
            stepFee: 1n,
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
            stepFee: 1n,
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
            stepFee: 1n,
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
            stepFee: 1n,
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
                }
                variable1.shadow = ''
                ContractState.revokeShadow(variable1.varName)
                return true
            }
        },
        {
            name: 'SUB',
            stepFee: 1n,
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
                }
                variable1.shadow = ''
                ContractState.revokeShadow(variable1.varName)
                return true
            }
        },
        {
            name: 'MUL',
            stepFee: 1n,
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
                }
                variable1.shadow = ''
                ContractState.revokeShadow(variable1.varName)
                return true
            }
        },
        {
            name: 'DIV',
            stepFee: 1n,
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
                }
                variable1.shadow = ''
                ContractState.revokeShadow(variable1.varName)
                return true
            }
        },
        {
            name: 'BOR / AND / XOR',
            stepFee: 1n,
            regex: /^\s*(BOR|AND|XOR)\s+@(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.getMemoryByName(regexParts[2])
                ContractState.unknownAndRevoke(variable1)
                return true
            }
        },
        {
            name: 'NOT',
            stepFee: 1n,
            regex: /^\s*NOT\s+@(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.getMemoryByName(regexParts[1])
                ContractState.unknownAndRevoke(variable1)
                return true
            }
        },
        {
            name: 'SET_IND',
            stepFee: 1n,
            regex: /^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.getMemoryByName(regexParts[1])
                ContractState.unknownAndRevoke(variable1)
                return true
            }
        },
        {
            name: 'SET_IDX',
            stepFee: 1n,
            regex: /^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\s*\+\s*\$(\w+)\)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.getMemoryByName(regexParts[1])
                ContractState.unknownAndRevoke(variable1)
                return true
            }
        },
        {
            name: 'PSH',
            stepFee: 1n,
            regex: /^\s*PSH\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                // TODO control also user stack
                // const variable1 = ContractState.getMemoryByName(regexParts[1])
                // ContractState.UserStack.push(val1)
                // if (ContractState.UserStack.length > 16 * ContractState.UserStackPages) {
                //     if (ContractState.ERR === null) {
                //         ContractState.dead = true
                //         ContractState.exception = 'User Stack buffer overflow'
                //         return true
                //     }
                //     ContractState.instructionPointer = ContractState.ERR
                //     return true
                // }
                return true
            }
        },
        {
            name: 'POP',
            stepFee: 1n,
            regex: /^\s*POP\s+@(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.getMemoryByName(regexParts[1])
                // TODO control also user stack
                // const val1 = ContractState.UserStack.pop()
                // if (val1 === undefined) {
                //     if (ContractState.ERR === null) {
                //         ContractState.dead = true
                //         ContractState.exception = 'User Stack buffer underflow'
                //         return true
                //     }
                //     ContractState.instructionPointer = ContractState.ERR
                //     return true
                // }
                // if (variable1 === undefined) {
                //     ContractState.Memory.push({ varName: regexParts[1], value: val1 })
                // } else {
                //     variable1.value = val1
                // }
                ContractState.unknownAndRevoke(variable1)
                return true
            }
        },
        {
            name: 'JMP_SUB',
            stepFee: 1n,
            regex: /^\s*JSR\s+:(\w+)\s*$/,
            execute (ContractState, regexParts) {
                ContractState.unknowAll()
                return true
            }
        },
        {
            name: 'RET_SUB',
            stepFee: 1n,
            regex: /^\s*RET\s*$/,
            execute (ContractState, regexParts) {
                return true
            }
        },
        {
            name: 'IND_DAT',
            stepFee: 1n,
            regex: /^\s*SET\s+@\(\$(\w+)\)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.getMemoryByName(regexParts[1])
                const variable2 = ContractState.getMemoryByName(regexParts[2])
                const addr = Number(variable1.value)
                if (variable1.value !== unknownValue) {
                    ContractState.Memory[addr].value = variable2.value
                    ContractState.Memory[addr].shadow = variable2.varName
                    return true
                }
                // It is not possible to know which variable was updated. Unknow to all memory variable.
                ContractState.unknowMemory(true, true)
                return true
            }
        },
        {
            name: 'IDX_DAT',
            stepFee: 1n,
            regex: /^\s*SET\s+@\(\$(\w+)\s*\+\s*\$(\w+)\)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                // It is not possible to know which variable was updated. Unknow to all memory variable.
                ContractState.unknowMemory(true, true)
                return true
            }
        },
        {
            name: 'MOD_DAT',
            stepFee: 1n,
            regex: /^\s*MOD\s+@(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.getMemoryByName(regexParts[1])
                ContractState.unknownAndRevoke(variable1)
                return true
            }
        },
        {
            name: 'SHL / SHR',
            stepFee: 1n,
            regex: /^\s*(SHL|SHR)\s+@(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.getMemoryByName(regexParts[2])
                ContractState.unknownAndRevoke(variable1)
                return true
            }
        },
        {
            name: 'POW_DAT',
            stepFee: 1n,
            regex: /^\s*POW\s+@(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.getMemoryByName(regexParts[1])
                ContractState.unknownAndRevoke(variable1)
                return true
            }
        },
        {
            name: 'JMP_ADR',
            stepFee: 1n,
            regex: /^\s*JMP\s+:(\w+)\s*$/,
            execute (ContractState, regexParts) {
                return true
            }
        },
        {
            name: 'BZR / BNZ',
            stepFee: 1n,
            regex: /^\s*(BZR|BNZ)\s+\$(\w+)\s+:(\w+)\s*$/,
            execute (ContractState, regexParts) {
                return true
            }
        },
        {
            name: 'BGT / BLT / BGE / BLE / BEQ / BNE',
            stepFee: 1n,
            regex: /^\s*(BGT|BLT|BGE|BLE|BEQ|BNE)\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/,
            execute (ContractState, regexParts) {
                return true
            }
        },
        {
            name: 'SLP_DAT',
            stepFee: 1n,
            regex: /^\s*SLP\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                return true
            }
        },
        {
            name: 'SLP_IMD',
            stepFee: 1n,
            regex: /^\s*SLP\s*$/,
            execute (ContractState, regexParts) {
                return true
            }
        },
        {
            name: 'FIZ_DAT',
            stepFee: 1n,
            regex: /^\s*FIZ\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                return true
            }
        },
        {
            name: 'STZ_DAT',
            stepFee: 1n,
            regex: /^\s*STZ\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                return true
            }
        },
        {
            name: 'FIN_IMD',
            stepFee: 1n,
            regex: /^\s*FIN\s*$/,
            execute (ContractState, regexParts) {
                return true
            }
        },
        {
            name: 'STP_IMD',
            stepFee: 1n,
            regex: /^\s*STP\s*$/,
            execute (ContractState, regexParts) {
                return true
            }
        },
        {
            name: 'ERR_ADR',
            stepFee: 1n,
            regex: /^\s*ERR\s+:(\w+)\s*$/,
            execute (ContractState, regexParts) {
                return true
            }
        },
        {
            name: 'SET_PCS',
            stepFee: 1n,
            regex: /^\s*PCS\s*$/,
            execute (ContractState, regexParts) {
                ContractState.unknowAll()
                // Program can restart with any values in memory
                return true
            }
        },
        {
            name: 'MDV_DAT',
            stepFee: 1n,
            regex: /^\s*MDV\s+@(\w+)\s+\$(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.getMemoryByName(regexParts[1])
                ContractState.unknownAndRevoke(variable1)
                return true
            }
        },
        {
            name: 'EXT_FUN',
            stepFee: 10n,
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
            stepFee: 10n,
            regex: /^\s*FUN\s+(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const Api = API_MICROCODE.EXT_FUN_DAT.find(Obj => Obj.funName === regexParts[1])
                if (Api === undefined) {
                    throw new Error(`Unknow API Function ${regexParts[1]}`)
                }
                const variable1 = ContractState.getMemoryByName(regexParts[2])
                if (variable1 === undefined) {
                    throw new Error(`Undeclared variable '${regexParts[2]}'`)
                }
                return Api.execute(ContractState, variable1)
            }
        },
        {
            name: 'EXT_FUN_DAT_2',
            stepFee: 10n,
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
            stepFee: 10n,
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
            stepFee: 10n,
            regex: /^\s*FUN\s+@(\w+)\s+(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                throw new Error(`Unknow API Function ${regexParts[2]}`)
            }
        },
        {
            name: 'EXT_FUN_RET_DAT_2',
            stepFee: 10n,
            regex: /^\s*FUN\s+@(\w+)\s+(\w+)\s+\$(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const Api = API_MICROCODE.EXT_FUN_RET_DAT_2.find(Obj => Obj.funName === regexParts[2])
                if (Api === undefined) {
                    throw new Error(`Unknow API Function ${regexParts[1]}`)
                }
                const variable1 = ContractState.getMemoryByName(regexParts[2])
                const variable2 = ContractState.getMemoryByName(regexParts[3])
                return Api.execute(ContractState, variable1, variable2)
            }
        },
        {
            name: 'NOP',
            stepFee: 1n,
            regex: /^\s*NOP\s*$/,
            execute (ContractState, regexParts) {
                return true
            }
        }
    ]

    /** Process one line of assembly code.
      * @returns true if something was executed
      * false if line is valid but nothing executed
      * null if line can be optimized  */
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
     * Loop all lines colecting assembly directives and put
     * instruction pointer at first instruction
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
