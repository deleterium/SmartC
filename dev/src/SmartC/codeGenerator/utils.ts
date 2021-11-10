
// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

import { assertNotUndefined } from '../repository/repository'
import { MEMORY_SLOT, TOKEN, AST, DECLARATION_TYPES, LOOKUP_ASN } from '../typings/syntaxTypes'

/**
 * Simple functions that do not depend external variables.
 */
export default {
    /** Creates a constant Memory Object */
    createConstantMemObj (value: number | string = ''): MEMORY_SLOT {
        let param: string
        if (typeof (value) === 'number') {
            if (value % 1 !== 0) {
                throw new Error('Only integer numbers in createConstantMemObj().')
            }
            param = value.toString(16).padStart(16, '0').slice(-16)
        } else {
            param = value.padStart(16, '0').slice(-16)
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
        return { type: 'APICall', precedence: 0, value: assertNotUndefined(name), line: line }
    },
    genPushToken (line: number): TOKEN {
        return { type: 'Push', precedence: 12, value: '', line: line }
    },
    mulHexContents (param1: number | string = 'Error', param2: number | string = 'Error') {
        let n1: bigint, n2: bigint
        if (typeof (param1) === 'number') {
            n1 = BigInt(param1)
        } else {
            n1 = BigInt('0x' + param1)
        }
        if (typeof (param2) === 'number') {
            n2 = BigInt(param2)
        } else {
            n2 = BigInt('0x' + param2)
        }
        return (n1 * n2).toString(16).padStart(16, '0').slice(-16)
    },
    divHexContents (param1: number | string = 'Error', param2: number | string = 'Error') {
        let n1: bigint, n2: bigint
        if (typeof (param1) === 'number') {
            n1 = BigInt(param1)
        } else {
            n1 = BigInt('0x' + param1)
        }
        if (typeof (param2) === 'number') {
            n2 = BigInt(param2)
        } else {
            n2 = BigInt('0x' + param2)
        }
        return (n1 / n2).toString(16).padStart(16, '0').slice(-16)
    },
    addHexContents (param1: number | string = 'Error', param2: number | string = 'Error') {
        let n1: bigint, n2: bigint
        if (typeof (param1) === 'number') {
            n1 = BigInt(param1)
        } else {
            n1 = BigInt('0x' + param1)
        }
        if (typeof (param2) === 'number') {
            n2 = BigInt(param2)
        } else {
            n2 = BigInt('0x' + param2)
        }
        return (n1 + n2).toString(16).padStart(16, '0').slice(-16)
    },
    subHexContents (param1: number | string = 'Error', param2: number | string = 'Error') {
        let n1: bigint, n2: bigint
        if (typeof (param1) === 'number') {
            n1 = BigInt(param1)
        } else {
            n1 = BigInt('0x' + param1)
        }
        if (typeof (param2) === 'number') {
            n2 = BigInt(param2)
        } else {
            n2 = BigInt('0x' + param2)
        }
        let sub = n1 - n2
        if (sub < 0) {
            sub += 18446744073709551616n
        }
        return sub.toString(16).padStart(16, '0').slice(-16)
    },
    /** Splits an AST into array of AST based on delimiters */
    splitASTOnDelimiters (Obj: AST) {
        const ret: AST[] = []
        function recursiveSplit (RecursiveAST: AST) {
            if (RecursiveAST.type === 'endASN' || RecursiveAST.type === 'lookupASN') {
                ret.push(RecursiveAST)
                return
            }
            if (RecursiveAST.type === 'binaryASN' && RecursiveAST.Operation.type === 'Delimiter') {
                recursiveSplit(RecursiveAST.Left)
                recursiveSplit(RecursiveAST.Right)
            } else {
                ret.push(RecursiveAST)
            }
        }
        recursiveSplit(Obj)
        return ret
    },
    /**
     * Checks declaration types and return true if operation is not allowed.
     * @param desiredDeclaration Should be this type
     * @param MemoObj Object to test
     * @returns return true if operation is NOT allowed.
     */
    isNotValidDeclarationOp (desiredDeclaration: DECLARATION_TYPES, MemoObj: MEMORY_SLOT) {
        const memoDeclaration = this.getDeclarationFromMemory(MemoObj)
        if (desiredDeclaration === 'void' || memoDeclaration === 'void') {
            return true
        }
        if (desiredDeclaration === memoDeclaration) {
            return false
        }
        if (desiredDeclaration === 'void_ptr' &&
            (memoDeclaration === 'long_ptr' || memoDeclaration === 'struct_ptr')) {
            return false
        }
        if (memoDeclaration === 'void_ptr' &&
            (desiredDeclaration === 'long_ptr' || desiredDeclaration === 'struct_ptr')) {
            return false
        }
        if (desiredDeclaration.includes('_ptr') && MemoObj.type === 'constant') {
            // manual pointer assignment or multi byte array assignment.
            return false
        }
        return true
    },
    getDeclarationFromMemory (MemoObj: MEMORY_SLOT): DECLARATION_TYPES {
        if (MemoObj.Offset === undefined) {
            return MemoObj.declaration
        }
        return MemoObj.Offset.declaration
    },
    setMemoryDeclaration (MemoObj: MEMORY_SLOT, dec: DECLARATION_TYPES) {
        if (MemoObj.Offset === undefined) {
            MemoObj.declaration = dec
        } else {
            MemoObj.Offset.declaration = dec
        }
    },
    /**
     * Simple otimization:
     * 1) Remove unused labels
     * 2) Removed unreachable jumps
     * 3) Remove dummy jumps (jumps to next instruction)
     */
    miniOptimizeJumps (asmCode: string) {
        let tmpCodeLines = asmCode.split('\n')
        let optimizedLines: number

        do {
            const jumpToLabels: string[] = []

            optimizedLines = tmpCodeLines.length
            // Collect information
            tmpCodeLines.forEach(value => {
                const jmp = /^.+\s:(\w+)$/.exec(value)
                if (jmp !== null) {
                    jumpToLabels.push(jmp[1])
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
                const jmpto = /^.+\s:(\w+)$/.exec(value)
                if (jmpto !== null) {
                    const lbl = /^(\w+):$/.exec(array[index + 1])
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
    },
    /** Traverse an AST searching a variable name. In this case is the
     *  right side of an assignment. If variable 'name' is found, it
     *   can not be reused as temporary var (register)
     */
    findVarNameInAst (vname: string, ObjAST: AST): boolean {
        function recursiveFind (InspAst: AST): boolean {
            let left: boolean, right: boolean
            switch (InspAst.type) {
            case 'nullASN':
                return true
            case 'endASN':
                if (InspAst.Token.type === 'Variable' && InspAst.Token.value === vname) {
                    return false
                }
                return true
            case 'lookupASN':
                return lookupAsn(InspAst)
            case 'unaryASN':
                return recursiveFind(InspAst.Center)
            case 'binaryASN':
                left = recursiveFind(InspAst.Left)
                right = recursiveFind(InspAst.Right)
                if (left && right) {
                    return true
                }
                return false
            case 'exceptionASN':
                if (InspAst.Left !== undefined) {
                    return recursiveFind(InspAst.Left)
                }
                return recursiveFind(assertNotUndefined(InspAst.Right))
            }
        }
        function lookupAsn (InspAst: LOOKUP_ASN): boolean {
            const CanReuse = InspAst.modifiers.find(CurrentModifier => {
                if (CurrentModifier.type === 'Array') {
                    if (recursiveFind(CurrentModifier.Center) === false) {
                        return true
                    }
                }
                return false
            })
            if (CanReuse === undefined) {
                if (InspAst.Token.type === 'Function' && InspAst.FunctionArgs !== undefined) {
                    return recursiveFind(InspAst.FunctionArgs)
                }
                return true
            }
            return false
        }
        return recursiveFind(ObjAST)
    }
}
