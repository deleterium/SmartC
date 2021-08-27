
// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

/* global TOKEN AST MEMORY_SLOT */

/**
 * Simple functions that do not depend external variables.
 */
// eslint-disable-next-line no-unused-vars
const utils = {
    /** Creates a constant Memory Object */
    createConstantMemObj (value: number|string = ''): MEMORY_SLOT {
        let param: string
        if (typeof (value) === 'number') {
            param = value.toString(16).padStart(16, '0').slice(-16)
        } else if (typeof (value) === 'string') {
            param = value.padStart(16, '0').slice(-16)
        } else {
            throw new TypeError('Unknow value arrived at createConstantMemObj().')
        }
        return {
            address: -1,
            name: '',
            asmName: '',
            type: 'constant',
            scope: '',
            size: 1,
            declaration: 'long',
            isDeclared: true,
            hexContent: param
        }
    },
    /** Creates a constant Memory Object */
    createVoidMemObj (): MEMORY_SLOT {
        return {
            address: -1,
            name: '',
            asmName: '',
            type: 'void',
            scope: '',
            size: 0,
            declaration: 'void',
            isDeclared: true
        }
    },
    genMulToken (line: number = -1): TOKEN {
        return { type: 'Operator', precedence: 3, value: '*', line: line }
    },
    genAddToken (line: number = -1): TOKEN {
        return { type: 'Operator', precedence: 4, value: '+', line: line }
    },
    genSubToken (line: number = -1): TOKEN {
        return { type: 'Operator', precedence: 4, value: '-', line: line }
    },
    genAssignmentToken (): TOKEN {
        return { type: 'Assignment', precedence: 9, value: '=', line: -1 }
    },
    genIncToken (): TOKEN {
        return { type: 'SetUnaryOperator', precedence: 2, value: '++', line: -1 }
    },
    genDecToken (): TOKEN {
        return { type: 'SetUnaryOperator', precedence: 2, value: '--', line: -1 }
    },
    genNotEqualToken (): TOKEN {
        return { type: 'Comparision', precedence: 6, value: '!=', line: -1 }
    },
    genAPICallToken (line: number, name?: string): TOKEN {
        if (name === undefined) {
            throw new TypeError('Wrong APICall name in genAPICallToken')
        }
        return { type: 'APICall', precedence: 0, value: name, line: line }
    },
    genPushToken (line: number): TOKEN {
        return { type: 'Push', precedence: 12, value: '', line: line }
    },
    mulHexContents (param1?: number|string, param2?: number|string) {
        let n1: bigint, n2: bigint
        if (typeof (param1) === 'number') {
            n1 = BigInt(param1)
        } else if (typeof (param1) === 'string') {
            n1 = BigInt('0x' + param1)
        } else throw new TypeError('Wrong type in mulHexContents')

        if (typeof (param2) === 'number') {
            n2 = BigInt(param2)
        } else if (typeof (param1) === 'string') {
            n2 = BigInt('0x' + param2)
        } else throw new TypeError('Wrong type in mulHexContents')

        return (n1 * n2).toString(16).padStart(16, '0').slice(-16)
    },
    divHexContents (param1?: number|string, param2?: number|string) {
        let n1: bigint, n2: bigint
        if (typeof (param1) === 'number') {
            n1 = BigInt(param1)
        } else if (typeof (param1) === 'string') {
            n1 = BigInt('0x' + param1)
        } else throw new TypeError('Wrong type in divHexContents')

        if (typeof (param2) === 'number') {
            n2 = BigInt(param2)
        } else if (typeof (param1) === 'string') {
            n2 = BigInt('0x' + param2)
        } else throw new TypeError('Wrong type in divHexContents')

        return (n1 / n2).toString(16).padStart(16, '0').slice(-16)
    },
    addHexContents (param1?: number|string, param2?: number|string) {
        let n1: bigint, n2: bigint
        if (typeof (param1) === 'number') {
            n1 = BigInt(param1)
        } else if (typeof (param1) === 'string') {
            n1 = BigInt('0x' + param1)
        } else throw new TypeError('Wrong type in addHexContents')

        if (typeof (param2) === 'number') {
            n2 = BigInt(param2)
        } else if (typeof (param1) === 'string') {
            n2 = BigInt('0x' + param2)
        } else throw new TypeError('Wrong type in addHexContents')

        return (n1 + n2).toString(16).padStart(16, '0').slice(-16)
    },
    subHexContents (param1?: number|string, param2?: number|string) {
        let n1: bigint, n2: bigint
        if (typeof (param1) === 'number') {
            n1 = BigInt(param1)
        } else if (typeof (param1) === 'string') {
            n1 = BigInt('0x' + param1)
        } else throw new TypeError('Wrong type in addHexContents')

        if (typeof (param2) === 'number') {
            n2 = BigInt(param2)
        } else if (typeof (param1) === 'string') {
            n2 = BigInt('0x' + param2)
        } else throw new TypeError('Wrong type in addHexContents')

        let sub = n1 - n2
        if (sub < 0) {
            sub += 18446744073709551616n
        }
        return sub.toString(16).padStart(16, '0').slice(-16)
    },
    /** Splits an AST into array of AST based on delimiters */
    splitASTOnDelimiters (Obj: AST) {
        const ret: AST[] = []

        function recursiveSplit (recursiveAST: AST) {
            if (recursiveAST.type === 'endASN' || recursiveAST.type === 'lookupASN') {
                ret.push(recursiveAST)
                return
            }
            if (recursiveAST.type === 'binaryASN' && recursiveAST.Operation.type === 'Delimiter') {
                recursiveSplit(recursiveAST.Left)
                recursiveSplit(recursiveAST.Right)
            } else {
                ret.push(recursiveAST)
            }
        }
        recursiveSplit(Obj)
        return ret
    },
    /**
     * Simple otimization:
     * 1) Remove unused labels
     * 2) Removed unreachable jumps
     * 3) Remove dummy jumps (jumps to next instruction)
     */
    miniOptimizeJumps (asmCode: string) {
        let tmpCodeLines = asmCode.split('\n')
        let jumpToLabels: string[], labels: string[]
        let optimizedLines: number

        do {
            jumpToLabels = []
            labels = []

            optimizedLines = tmpCodeLines.length
            // Collect information
            tmpCodeLines.forEach(value => {
                const jmp = /.+\s:(\w+)$/.exec(value)
                const lbl = /^(\w+):$/.exec(value)
                if (jmp !== null) {
                    jumpToLabels.push(jmp[1])
                }
                if (lbl !== null) {
                    labels.push(lbl[1])
                }
            })

            // remove labels without reference
            tmpCodeLines = tmpCodeLines.filter((value) => {
                const lbl = /^(\w+):$/.exec(value)
                if (lbl !== null) {
                    if (jumpToLabels.indexOf(lbl[1]) !== -1) {
                        return true
                    } else {
                        return false
                    }
                } else {
                    return true
                }
            })

            // remove unreachable jumps
            tmpCodeLines = tmpCodeLines.filter((value, index, array) => {
                const jmp = /^JMP\s+.+/.exec(value)
                if (jmp !== null) {
                    if (/^JMP\s+.+/.exec(array[index - 1]) !== null) {
                        return false
                    } else {
                        return true
                    }
                } else {
                    return true
                }
            })

            // remove meaningless jumps
            tmpCodeLines = tmpCodeLines.filter((value, index, array) => {
                const jmpto = /.+\s:(\w+)$/.exec(value)
                if (jmpto !== null) {
                    const i = index + 1
                    const lbl = /^(\w+):$/.exec(array[i])
                    if (lbl === null) {
                        return true
                    }
                    if (jmpto[1] === lbl[1]) {
                        return false
                    }
                    return true
                }
                return true
            })

            optimizedLines -= tmpCodeLines.length
        } while (optimizedLines !== 0)

        return tmpCodeLines.join('\n')
    }
}
