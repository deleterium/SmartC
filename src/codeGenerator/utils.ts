import { assertNotUndefined } from '../repository/repository'
import { MEMORY_SLOT, TOKEN, AST, DECLARATION_TYPES, LOOKUP_ASN, BINARY_ASN, END_ASN, EXCEPTION_ASN, NULL_ASN, UNARY_ASN, SWITCH_ASN } from '../typings/syntaxTypes'

type OBJECT_ASN_TYPE<T> = T extends 'binaryASN' ? BINARY_ASN :
T extends 'unaryASN' ? UNARY_ASN :
T extends 'nullASN' ? NULL_ASN :
T extends 'endASN' ? END_ASN :
T extends 'lookupASN' ? LOOKUP_ASN :
T extends 'exceptionASN' ? EXCEPTION_ASN :
T extends 'switchASN' ? SWITCH_ASN :
never;

type HEXCONTENTS = number | string | undefined

/**
 * Simple functions that do not depend external variables.
 */
export default {
    /** Creates a constant Memory Object */
    createConstantMemObj (value?: number | bigint | string): MEMORY_SLOT {
        let param: string
        let declaration : 'long' | 'fixed' = 'long'
        switch (typeof (value)) {
        case 'number':
            if (value % 1 !== 0) {
                const intPart = BigInt(Math.trunc(value))
                const fractionalPart = BigInt(Math.trunc((value % 1) * 100000000))
                param = (intPart * 100000000n + fractionalPart).toString(16)
                declaration = 'fixed'
                break
            }
            param = value.toString(16)
            break
        case 'bigint':
            param = value.toString(16)
            break
        case 'string':
            param = value
            break
        default:
            param = ''
        }
        param = param.padStart((Math.floor((param.length - 1) / 16) + 1) * 16, '0')
        return {
            address: -1,
            name: '',
            asmName: '',
            type: 'constant',
            scope: '',
            size: param.length / 16,
            declaration,
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
    genAssignmentToken (line: number): TOKEN {
        return { type: 'Assignment', precedence: 9, value: '=', line: line }
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
    genBuiltInToken (line: number, name?: string): TOKEN {
        return { type: 'BuiltInCall', precedence: 0, value: assertNotUndefined(name), line: line }
    },
    genPushToken (line: number): TOKEN {
        return { type: 'Push', precedence: 12, value: '', line: line }
    },
    mulHexContents (param1: HEXCONTENTS, param2: HEXCONTENTS) {
        const n1 = this.HexContentsToBigint(param1)
        const n2 = this.HexContentsToBigint(param2)
        return (n1 * n2).toString(16).padStart(16, '0').slice(-16)
    },
    divHexContents (param1: HEXCONTENTS, param2: HEXCONTENTS) {
        const n1 = this.HexContentsToBigint(param1)
        const n2 = this.HexContentsToBigint(param2)
        if (n2 === 0n) {
            throw new Error('Division by zero')
        }
        return (n1 / n2).toString(16).padStart(16, '0').slice(-16)
    },
    addHexContents (param1: HEXCONTENTS, param2: HEXCONTENTS) {
        const n1 = this.HexContentsToBigint(param1)
        const n2 = this.HexContentsToBigint(param2)
        return (n1 + n2).toString(16).padStart(16, '0').slice(-16)
    },
    subHexContents (param1: HEXCONTENTS, param2: HEXCONTENTS) {
        const n1 = this.HexContentsToBigint(param1)
        const n2 = this.HexContentsToBigint(param2)
        let sub = n1 - n2
        if (sub < 0) {
            sub += 18446744073709551616n
        }
        return sub.toString(16).padStart(16, '0').slice(-16)
    },
    /** Converts a hex string or number to bigint */
    HexContentsToBigint (arg: HEXCONTENTS) : bigint {
        if (typeof arg === 'undefined') {
            return 0n
        }
        if (typeof arg === 'number') {
            return BigInt(arg)
        }
        return BigInt('0x' + arg)
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
            case 'switchASN':
                return false
            }
        }
        function lookupAsn (InspAst: LOOKUP_ASN): boolean {
            const parts = vname.split('_')
            if (parts.find(part => part === InspAst.Token.value)) {
                return false
            }
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
    },
    assertAsnType<T extends 'binaryASN'|'unaryASN'|'nullASN'|'endASN'|'lookupASN'|'exceptionASN'|'switchASN'> (templateType: T,
        testObject: AST) : OBJECT_ASN_TYPE<T> {
        if (testObject.type !== undefined && testObject.type === templateType) {
            return testObject as OBJECT_ASN_TYPE<T>
        }
        throw new Error('Internal error')
    }
}
