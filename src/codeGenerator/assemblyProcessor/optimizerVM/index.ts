import { CPU } from './cpu'

export const unknownValue = -1n

/**
 * Object for memory entries
 *
 * @member {string} varName Variable name defined in assembly
 * @member {bigint} value Variable value (64-bit unsigned)
 * @member {string} shadow If content is the same as other variable,
 * this will have the other variable name.
 */
export interface MemoryObj {
    varName: string
    value: bigint
    shadow: string
}

export const Constants = {
    // do not change these
    minus1: 18446744073709551615n, // -1 in 64-bit unsigned
    pow2to64: 18446744073709551616n, // 2^64
    maxPositive: 9223372036854775807n, // (2^63)-1
    numberMaxPositive: 9223372036854775000
}

export const utils = {
    unsigned2signed (unsigned: bigint): bigint {
        unsigned %= 1n << 64n
        if (unsigned >= (1n << 63n)) {
            return unsigned - (1n << 64n)
        }
        return unsigned
    },

    signed2unsigned (signed: bigint): bigint {
        signed %= 18446744073709551616n
        if (signed < 0) {
            return signed + 18446744073709551616n
        }
        return signed
    }
}

export class CONTRACT {
    Memory: MemoryObj[]
    asmCodeArr: string[]
    // userStack: MemoryObj[]

    constructor (asmCode: string[]) {
        this.Memory = []
        this.asmCodeArr = asmCode
        // this.userStack = []
        CPU.cpuDeploy(this)
        this.Memory.push(
            { varName: 'A1', value: unknownValue, shadow: '' },
            { varName: 'A2', value: unknownValue, shadow: '' },
            { varName: 'A3', value: unknownValue, shadow: '' },
            { varName: 'A4', value: unknownValue, shadow: '' },
            { varName: 'B1', value: unknownValue, shadow: '' },
            { varName: 'B2', value: unknownValue, shadow: '' },
            { varName: 'B3', value: unknownValue, shadow: '' },
            { varName: 'B4', value: unknownValue, shadow: '' })
    }

    unknowAll () : void {
        this.unknowMemory(false, false)
    }

    unknowMemory (keepRegisters: boolean, keepSuperRegisters: boolean) : void {
        this.Memory.forEach((Mem) => {
            if (keepRegisters && /^r\d$/.test(Mem.varName)) {
                return
            }
            if (keepSuperRegisters && /^[AB][1234]$/.test(Mem.varName)) {
                return
            }
            if (/^n\d+$/.test(Mem.varName)) {
                Mem.value = BigInt(Mem.varName.substring(1))
                Mem.shadow = ''
                return
            }
            Mem.value = unknownValue
            Mem.shadow = ''
        })
    }

    unknowSuperRegisters () : void {
        this.Memory.forEach((Mem) => {
            if (/^[AB][1234]$/.test(Mem.varName)) {
                Mem.value = unknownValue
                Mem.shadow = ''
                return
            }
            if (/^[AB][1234]$/.test(Mem.shadow)) {
                Mem.shadow = ''
            }
        })
    }

    unknowSuperRegisterA () : void {
        this.Memory.forEach((Mem) => {
            if (/^[A][1234]$/.test(Mem.varName)) {
                Mem.value = unknownValue
                Mem.shadow = ''
                return
            }
            if (/^[A][1234]$/.test(Mem.shadow)) {
                Mem.shadow = ''
            }
        })
    }

    unknowSuperRegisterB () : void {
        this.Memory.forEach((Mem) => {
            if (/^[B][1234]$/.test(Mem.varName)) {
                Mem.value = unknownValue
                Mem.shadow = ''
                return
            }
            if (/^[B][1234]$/.test(Mem.shadow)) {
                Mem.shadow = ''
            }
        })
    }

    getMemoryByName (name: string): MemoryObj {
        const RetObj = this.Memory.find(Mem => Mem.varName === name)
        if (RetObj === undefined) {
            throw new Error('Internal error')
        }
        return RetObj
    }

    revokeShadow (changedVar: string) : void {
        this.Memory.forEach((Mem) => {
            if (Mem.shadow === changedVar) {
                Mem.shadow = ''
            }
        })
    }

    unknownAndRevoke (Var: MemoryObj) {
        Var.value = unknownValue
        Var.shadow = ''
        this.revokeShadow(Var.varName)
    }

    setAndRevoke (AssignedVar: MemoryObj, Variable: MemoryObj) {
        AssignedVar.value = Variable.value
        AssignedVar.shadow = Variable.varName
        this.revokeShadow(AssignedVar.varName)
        Variable.shadow = AssignedVar.varName
    }

    zeroAndRevoke (Var: MemoryObj) {
        if (Var.value !== 0n) {
            Var.value = 0n
            Var.shadow = ''
            this.revokeShadow(Var.varName)
        }
    }

    /**
     * Runs only one instruction (step into)
     *
     * @return string indicating error/status. Empty string on success.
     */
    optimize (): string[] {
        let cpuExitCode: boolean|null

        this.asmCodeArr.forEach((code, line) => {
            cpuExitCode = CPU.cpu(this, line)
            if (cpuExitCode === null) {
                this.asmCodeArr[line] = 'DELETE'
            }
        })
        return this.asmCodeArr.filter(code => code !== 'DELETE')
    }
}
