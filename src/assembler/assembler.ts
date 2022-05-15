import { assertNotUndefined } from '../repository/repository'
import { MACHINE_OBJECT } from '../typings/contractTypes'
import hashMachineCode from './hashMachineCode'

type MEMORY_INFO = {
    name: string
    value: bigint
}
/**
 *     O: OpCode --
 *     B: Branch (byte index) --
 *     J: Jump (integer index) --
 *     F: API Function Code (short index) --
 *     I: Variable (Integer index) --
 *     L: Long value
 */
type INSTRUCTION_PARAM_TYPES = 'O' | 'B' | 'J' | 'F' | 'I' | 'L';
type INSTRUCTION_CODE_VALUES = {
    type: INSTRUCTION_PARAM_TYPES
    value: bigint
}
type CODE_INSTRUCTION = {
    /** Line source code */
    source: string
    /** Address of current compiled instruction (in bytes) */
    address: number
    /** Label for current instruction */
    station: string
    /** If current instruction has jumps, indicate label of destinantion */
    jumpLabel?: string
    /** If current instruction is branch, indicate label of destinantion */
    branchLabel?: string
    /** Current instruction size (in bytes) */
    size: number
    /** Opcode and its params */
    instructionValues: INSTRUCTION_CODE_VALUES[]
    /** Compiled hex string for current instruction */
    compiledInstruction: string
}
type ASM_OBJECT = {
    /** Memory name and starting values */
    memory: MEMORY_INFO[]
    /** All code and details */
    code: CODE_INSTRUCTION[]
    /** All labels and address */
    labels: {
        label: string
        address: number
    }[]
    /** Program Name */
    PName: string
    /** Program description */
    PDescription: string
    /** Program activation amount */
    PActivationAmount: string
    /** Selected size for user stack */
    PUserStackPages: number
    /** Selected size for code stack */
    PCodeStackPages: number
    /** hexstring of compiled program */
    bytecode: string
    /** hexstring for memory starting values */
    bytedata: string
}
type OPCODE_RULE = {
    /** Instruction code */
    opCode: number
    /** Instruction name */
    name: string
    /** Instruction size (in bytes) */
    size: number
    /** Type of instruction arguments and number */
    argsType: INSTRUCTION_PARAM_TYPES[]
    /** Matching regex rule to instruction */
    regex: RegExp
}
type APICODE_RULE = {
    /** API Function name */
    name: string
    /** API Function code */
    apiCode: number
    /** Matching opcode to API Function */
    opCode: number
}

/**
 * Transforms assembly code into machine code
 * @param assemblyCode string
 * @returns {MACHINE_OBJECT} with all details needed for
 * smart contract deployment.
 * @throws {Error} on any source code mistake.
 */
export default function assembler (assemblyCode: string): MACHINE_OBJECT {
    const opCodeTable: OPCODE_RULE[] = [
        { opCode: 0xf0, name: 'blank', size: 0, argsType: [], regex: /^\s*$/ },
        { opCode: 0xf1, name: 'label', size: 0, argsType: [], regex: /^\s*(\w+):\s*$/ },
        { opCode: 0xf2, name: 'comment', size: 0, argsType: [], regex: /^\s*\^comment\s+(.*)/ },
        { opCode: 0xf3, name: 'declare', size: 0, argsType: [], regex: /^\s*\^declare\s+(\w+)\s*$/ },
        { opCode: 0xf4, name: 'const', size: 0, argsType: [], regex: /^\s*\^const\s+SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/ },
        { opCode: 0xf5, name: 'program', size: 0, argsType: [], regex: /^\s*\^program\s+(\w+\b)(.*)$/ },
        { opCode: 0x01, name: 'SET_VAL', size: 13, argsType: ['I', 'L'], regex: /^\s*SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/ },
        { opCode: 0x02, name: 'SET_DAT', size: 9, argsType: ['I', 'I'], regex: /^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/ },
        { opCode: 0x03, name: 'CLR_DAT', size: 5, argsType: ['I'], regex: /^\s*CLR\s+@(\w+)\s*$/ },
        { opCode: 0x04, name: 'INC_DAT', size: 5, argsType: ['I'], regex: /^\s*INC\s+@(\w+)\s*$/ },
        { opCode: 0x05, name: 'DEC_DAT', size: 5, argsType: ['I'], regex: /^\s*DEC\s+@(\w+)\s*$/ },
        { opCode: 0x06, name: 'ADD_DAT', size: 9, argsType: ['I', 'I'], regex: /^\s*ADD\s+@(\w+)\s+\$(\w+)\s*$/ },
        { opCode: 0x07, name: 'SUB_DAT', size: 9, argsType: ['I', 'I'], regex: /^\s*SUB\s+@(\w+)\s+\$(\w+)\s*$/ },
        { opCode: 0x08, name: 'MUL_DAT', size: 9, argsType: ['I', 'I'], regex: /^\s*MUL\s+@(\w+)\s+\$(\w+)\s*$/ },
        { opCode: 0x09, name: 'DIV_DAT', size: 9, argsType: ['I', 'I'], regex: /^\s*DIV\s+@(\w+)\s+\$(\w+)\s*$/ },
        { opCode: 0x0a, name: 'BOR_DAT', size: 9, argsType: ['I', 'I'], regex: /^\s*BOR\s+@(\w+)\s+\$(\w+)\s*$/ },
        { opCode: 0x0b, name: 'AND_DAT', size: 9, argsType: ['I', 'I'], regex: /^\s*AND\s+@(\w+)\s+\$(\w+)\s*$/ },
        { opCode: 0x0c, name: 'XOR_DAT', size: 9, argsType: ['I', 'I'], regex: /^\s*XOR\s+@(\w+)\s+\$(\w+)\s*$/ },
        { opCode: 0x0d, name: 'NOT_DAT', size: 5, argsType: ['I'], regex: /^\s*NOT\s+@(\w+)\s*$/ },
        { opCode: 0x0e, name: 'SET_IND', size: 9, argsType: ['I', 'I'], regex: /^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\)\s*$/ },
        { opCode: 0x0f, name: 'SET_IDX', size: 13, argsType: ['I', 'I', 'I'], regex: /^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\s*\+\s*\$(\w+)\)\s*$/ },
        { opCode: 0x10, name: 'PSH_DAT', size: 5, argsType: ['I'], regex: /^\s*PSH\s+\$(\w+)\s*$/ },
        { opCode: 0x11, name: 'POP_DAT', size: 5, argsType: ['I'], regex: /^\s*POP\s+@(\w+)\s*$/ },
        { opCode: 0x12, name: 'JMP_SUB', size: 5, argsType: ['J'], regex: /^\s*JSR\s+:(\w+)\s*$/ },
        { opCode: 0x13, name: 'RET_SUB', size: 1, argsType: [], regex: /^\s*RET\s*$/ },
        { opCode: 0x14, name: 'IND_DAT', size: 9, argsType: ['I', 'I'], regex: /^\s*SET\s+@\(\$(\w+)\)\s+\$(\w+)\s*$/ },
        { opCode: 0x15, name: 'IDX_DAT', size: 13, argsType: ['I', 'I', 'I'], regex: /^\s*SET\s+@\(\$(\w+)\s*\+\s*\$(\w+)\)\s+\$(\w+)\s*$/ },
        { opCode: 0x16, name: 'MOD_DAT', size: 9, argsType: ['I', 'I'], regex: /^\s*MOD\s+@(\w+)\s+\$(\w+)\s*$/ },
        { opCode: 0x17, name: 'SHL_DAT', size: 9, argsType: ['I', 'I'], regex: /^\s*SHL\s+@(\w+)\s+\$(\w+)\s*$/ },
        { opCode: 0x18, name: 'SHR_DAT', size: 9, argsType: ['I', 'I'], regex: /^\s*SHR\s+@(\w+)\s+\$(\w+)\s*$/ },
        { opCode: 0x1a, name: 'JMP_ADR', size: 5, argsType: ['J'], regex: /^\s*JMP\s+:(\w+)\s*$/ },
        { opCode: 0x1b, name: 'BZR_DAT', size: 6, argsType: ['I', 'B'], regex: /^\s*BZR\s+\$(\w+)\s+:(\w+)\s*$/ },
        { opCode: 0x1e, name: 'BNZ_DAT', size: 6, argsType: ['I', 'B'], regex: /^\s*BNZ\s+\$(\w+)\s+:(\w+)\s*$/ },
        { opCode: 0x1f, name: 'BGT_DAT', size: 10, argsType: ['I', 'I', 'B'], regex: /^\s*BGT\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/ },
        { opCode: 0x20, name: 'BLT_DAT', size: 10, argsType: ['I', 'I', 'B'], regex: /^\s*BLT\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/ },
        { opCode: 0x21, name: 'BGE_DAT', size: 10, argsType: ['I', 'I', 'B'], regex: /^\s*BGE\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/ },
        { opCode: 0x22, name: 'BLE_DAT', size: 10, argsType: ['I', 'I', 'B'], regex: /^\s*BLE\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/ },
        { opCode: 0x23, name: 'BEQ_DAT', size: 10, argsType: ['I', 'I', 'B'], regex: /^\s*BEQ\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/ },
        { opCode: 0x24, name: 'BNE_DAT', size: 10, argsType: ['I', 'I', 'B'], regex: /^\s*BNE\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/ },
        { opCode: 0x25, name: 'SLP_DAT', size: 5, argsType: ['I'], regex: /^\s*SLP\s+\$(\w+)\s*$/ },
        { opCode: 0x26, name: 'FIZ_DAT', size: 5, argsType: ['I'], regex: /^\s*FIZ\s+\$(\w+)\s*$/ },
        { opCode: 0x27, name: 'STZ_DAT', size: 5, argsType: ['I'], regex: /^\s*STZ\s+\$(\w+)\s*$/ },
        { opCode: 0x28, name: 'FIN_IMD', size: 1, argsType: [], regex: /^\s*FIN\s*$/ },
        { opCode: 0x29, name: 'STP_IMD', size: 1, argsType: [], regex: /^\s*STP\s*$/ },
        { opCode: 0x2b, name: 'ERR_ADR', size: 5, argsType: ['J'], regex: /^\s*ERR\s+:(\w+)\s*$/ },
        { opCode: 0x30, name: 'SET_PCS', size: 1, argsType: [], regex: /^\s*PCS\s*$/ },
        { opCode: 0x32, name: 'EXT_FUN', size: 3, argsType: ['F'], regex: /^\s*FUN\s+(\w+)\s*$/ },
        { opCode: 0x33, name: 'EXT_FUN_DAT', size: 7, argsType: ['F', 'I'], regex: /^\s*FUN\s+(\w+)\s+\$(\w+)\s*$/ },
        { opCode: 0x34, name: 'EXT_FUN_DAT_2', size: 11, argsType: ['F', 'I', 'I'], regex: /^\s*FUN\s+(\w+)\s+\$(\w+)\s+\$(\w+)\s*$/ },
        { opCode: 0x35, name: 'EXT_FUN_RET', size: 7, argsType: ['F', 'I'], regex: /^\s*FUN\s+@(\w+)\s+(\w+)\s*$/ },
        { opCode: 0x36, name: 'EXT_FUN_RET_DAT', size: 11, argsType: ['F', 'I', 'I'], regex: /^\s*FUN\s+@(\w+)\s+(\w+)\s+\$(\w+)\s*$/ },
        { opCode: 0x37, name: 'EXT_FUN_RET_DAT_2', size: 15, argsType: ['F', 'I', 'I', 'I'], regex: /^\s*FUN\s+@(\w+)\s+(\w+)\s+\$(\w+)\s+\$(\w+)\s*$/ },
        { opCode: 0x7f, name: 'NOP', size: 1, argsType: [], regex: /^\s*NOP\s*$/ }
    ]
    const apiCodeTable: APICODE_RULE[] = [
        { name: 'get_A1', apiCode: 0x0100, opCode: 0x35 },
        { name: 'get_A2', apiCode: 0x0101, opCode: 0x35 },
        { name: 'get_A3', apiCode: 0x0102, opCode: 0x35 },
        { name: 'get_A4', apiCode: 0x0103, opCode: 0x35 },
        { name: 'get_B1', apiCode: 0x0104, opCode: 0x35 },
        { name: 'get_B2', apiCode: 0x0105, opCode: 0x35 },
        { name: 'get_B3', apiCode: 0x0106, opCode: 0x35 },
        { name: 'get_B4', apiCode: 0x0107, opCode: 0x35 },
        { name: 'set_A1', apiCode: 0x0110, opCode: 0x33 },
        { name: 'set_A2', apiCode: 0x0111, opCode: 0x33 },
        { name: 'set_A3', apiCode: 0x0112, opCode: 0x33 },
        { name: 'set_A4', apiCode: 0x0113, opCode: 0x33 },
        { name: 'set_A1_A2', apiCode: 0x0114, opCode: 0x34 },
        { name: 'set_A3_A4', apiCode: 0x0115, opCode: 0x34 },
        { name: 'set_B1', apiCode: 0x0116, opCode: 0x33 },
        { name: 'set_B2', apiCode: 0x0117, opCode: 0x33 },
        { name: 'set_B3', apiCode: 0x0118, opCode: 0x33 },
        { name: 'set_B4', apiCode: 0x0119, opCode: 0x33 },
        { name: 'set_B1_B2', apiCode: 0x011a, opCode: 0x34 },
        { name: 'set_B3_B4', apiCode: 0x011b, opCode: 0x34 },
        { name: 'clear_A', apiCode: 0x0120, opCode: 0x32 },
        { name: 'clear_B', apiCode: 0x0121, opCode: 0x32 },
        { name: 'clear_A_B', apiCode: 0x0122, opCode: 0x32 },
        { name: 'copy_A_From_B', apiCode: 0x0123, opCode: 0x32 },
        { name: 'copy_B_From_A', apiCode: 0x0124, opCode: 0x32 },
        { name: 'check_A_Is_Zero', apiCode: 0x0125, opCode: 0x35 },
        { name: 'check_B_Is_Zero', apiCode: 0x0126, opCode: 0x35 },
        { name: 'check_A_equals_B', apiCode: 0x0127, opCode: 0x35 },
        { name: 'swap_A_and_B', apiCode: 0x0128, opCode: 0x32 },
        { name: 'OR_A_with_B', apiCode: 0x0129, opCode: 0x32 },
        { name: 'OR_B_with_A', apiCode: 0x012a, opCode: 0x32 },
        { name: 'AND_A_with_B', apiCode: 0x012b, opCode: 0x32 },
        { name: 'AND_B_with_A', apiCode: 0x012c, opCode: 0x32 },
        { name: 'XOR_A_with_B', apiCode: 0x012d, opCode: 0x32 },
        { name: 'XOR_B_with_A', apiCode: 0x012e, opCode: 0x32 },
        { name: 'add_A_to_B', apiCode: 0x0140, opCode: 0x32 },
        { name: 'add_B_to_A', apiCode: 0x0141, opCode: 0x32 },
        { name: 'sub_A_from_B', apiCode: 0x0142, opCode: 0x32 },
        { name: 'sub_B_from_A', apiCode: 0x0143, opCode: 0x32 },
        { name: 'mul_A_by_B', apiCode: 0x0144, opCode: 0x32 },
        { name: 'mul_B_by_A', apiCode: 0x0145, opCode: 0x32 },
        { name: 'div_A_by_B', apiCode: 0x0146, opCode: 0x32 },
        { name: 'div_B_by_A', apiCode: 0x0147, opCode: 0x32 },
        { name: 'MD5_A_to_B', apiCode: 0x0200, opCode: 0x32 },
        { name: 'check_MD5_A_with_B', apiCode: 0x0201, opCode: 0x35 },
        { name: 'HASH160_A_to_B', apiCode: 0x0202, opCode: 0x32 },
        { name: 'check_HASH160_A_with_B', apiCode: 0x0203, opCode: 0x35 },
        { name: 'SHA256_A_to_B', apiCode: 0x0204, opCode: 0x32 },
        { name: 'check_SHA256_A_with_B', apiCode: 0x0205, opCode: 0x35 },
        { name: 'get_Block_Timestamp', apiCode: 0x0300, opCode: 0x35 },
        { name: 'get_Creation_Timestamp', apiCode: 0x0301, opCode: 0x35 },
        { name: 'get_Last_Block_Timestamp', apiCode: 0x0302, opCode: 0x35 },
        { name: 'put_Last_Block_Hash_In_A', apiCode: 0x0303, opCode: 0x32 },
        { name: 'A_to_Tx_after_Timestamp', apiCode: 0x0304, opCode: 0x33 },
        { name: 'get_Type_for_Tx_in_A', apiCode: 0x0305, opCode: 0x35 },
        { name: 'get_Amount_for_Tx_in_A', apiCode: 0x0306, opCode: 0x35 },
        { name: 'get_Timestamp_for_Tx_in_A', apiCode: 0x0307, opCode: 0x35 },
        { name: 'get_Ticket_Id_for_Tx_in_A', apiCode: 0x0308, opCode: 0x35 },
        { name: 'message_from_Tx_in_A_to_B', apiCode: 0x0309, opCode: 0x32 },
        { name: 'B_to_Address_of_Tx_in_A', apiCode: 0x030a, opCode: 0x32 },
        { name: 'B_to_Address_of_Creator', apiCode: 0x030b, opCode: 0x32 },
        { name: 'get_Current_Balance', apiCode: 0x0400, opCode: 0x35 },
        { name: 'get_Previous_Balance', apiCode: 0x0401, opCode: 0x35 },
        { name: 'send_to_Address_in_B', apiCode: 0x0402, opCode: 0x33 },
        { name: 'send_All_to_Address_in_B', apiCode: 0x0403, opCode: 0x32 },
        { name: 'send_Old_to_Address_in_B', apiCode: 0x0404, opCode: 0x32 },
        { name: 'send_A_to_Address_in_B', apiCode: 0x0405, opCode: 0x32 },
        { name: 'add_Minutes_to_Timestamp', apiCode: 0x0406, opCode: 0x37 }
    ]
    const AsmObj: ASM_OBJECT = {
        memory: [],
        code: [],
        labels: [],
        PName: '',
        PDescription: '',
        PActivationAmount: '',
        PUserStackPages: 0,
        PCodeStackPages: 0,
        bytecode: '',
        bytedata: ''
    }

    /* * * Main function! * * */
    function assemblerMain (): MACHINE_OBJECT {
        // process line by line
        const line = assemblyCode.split('\n')
        // first pass, fill address, opcodes, apicodes, constants
        line.forEach((codeLine, idx) => {
            for (const CurrRule of opCodeTable) {
                const parts = CurrRule.regex.exec(codeLine)
                if (parts !== null) {
                    process(parts, CurrRule)
                    return
                }
            }
            throw new Error(`assembler() error #1. No rule found to process line ${idx}: "${codeLine}".`)
        })
        // second pass, solve branches offsets
        do {
            AsmObj.labels = []
            let currAddr = 0
            // Rebuild AsmObj.labels
            AsmObj.code.forEach(Element => {
                Element.address = currAddr
                if (Element.station.length !== 0) {
                    AsmObj.labels.push({ label: Element.station, address: currAddr })
                }
                currAddr += Element.size
            })
        } while (!AsmObj.code.every(checkBranches))
        // third pass, push jump an branches.
        AsmObj.code.forEach(fillJumpsAndBranches)
        // last pass, join all contents in little endian notation (code and data)
        AsmObj.code.forEach(finishHim)
        AsmObj.bytedata = fatality(AsmObj.memory)
        return buildRetObj()
    }

    /** Get and/or assign a variable address */
    function getMemoryAddress (varName: string) {
        const idx = AsmObj.memory.findIndex(Obj => Obj.name === varName)
        if (idx === -1) {
            return AsmObj.memory.push({ name: varName, value: 0n }) - 1
        }
        return idx
    }

    /** Process one matched instruction */
    function process (parts: RegExpExecArray, Instruction: OPCODE_RULE) {
        // Create a new object
        const CodeObj = genCodeInstr()
        CodeObj.source = parts[0]
        switch (Instruction.opCode) {
        case 0xF0:
            // blank line
            return
        case 0xF1:
            // label:
            CodeObj.station = parts[1]
            AsmObj.code.push(CodeObj)
            return
        case 0xF2:
            // '^comment user_comment'
            return
        case 0xF3:
            // '^declare varName'
            getMemoryAddress(parts[1])
            return
        case 0xF4:
            // '^const SET @(varName) #(hex_content)'
            AsmObj.memory[getMemoryAddress(parts[1])].value = BigInt('0x' + parts[2])
            return
        case 0xF5:
            // '^program type information'
            switch (parts[1]) {
            case 'name':
                AsmObj.PName = parts[2].trim()
                break
            case 'description':
                AsmObj.PDescription = parts[2].trim()
                break
            case 'activationAmount':
                AsmObj.PActivationAmount = parts[2].trim()
                break
            case 'userStackPages':
                AsmObj.PUserStackPages = Number(parts[2].trim())
                break
            case 'codeStackPages':
                AsmObj.PCodeStackPages = Number(parts[2].trim())
                break
            default:
                throw new Error(`assembler() error #7. Unknow '^program' directive: '${parts[1]}'`)
            }
            return
        }
        CodeObj.size = Instruction.size
        CodeObj.instructionValues.push({ type: 'O', value: BigInt(Instruction.opCode) })
        let i = 0
        if (Instruction.opCode >= 0x35 && Instruction.opCode <= 0x37) {
            // 0x35, 0x36 and 0x37 are exceptions for args order, treat now
            CodeObj.instructionValues.push({
                type: 'F',
                value: BigInt(getApiCode(parts[2], Instruction.opCode, CodeObj.source))
            })
            CodeObj.instructionValues.push({
                type: 'I',
                value: BigInt(getMemoryAddress(parts[1]))
            })
            i = 2
        }
        for (; i < Instruction.argsType.length; i++) {
            // process generic instructions
            switch (Instruction.argsType[i]) {
            case 'I':
                CodeObj.instructionValues.push({ type: 'I', value: BigInt(getMemoryAddress(parts[i + 1])) })
                break
            case 'L':
                CodeObj.instructionValues.push({ type: 'L', value: BigInt('0x' + parts[i + 1]) })
                break
            case 'B':
                // branch offset will be processed later
                CodeObj.branchLabel = parts[i + 1]
                break
            case 'J':
                // jump will be processed later
                CodeObj.jumpLabel = parts[i + 1]
                break
            case 'F': {
                // function name for opCodes 0x32, 0x33, 0x34
                CodeObj.instructionValues.push({
                    type: 'F',
                    value: BigInt(getApiCode(parts[1], Instruction.opCode, CodeObj.source))
                })
                break
            }
            default:
                // Fix opCodeTable.argsType!!
                throw new Error('Internal error.')
            }
        }
        AsmObj.code.push(CodeObj)
    }

    /** Returns a skeleton code instruction object */
    function genCodeInstr (): CODE_INSTRUCTION {
        return {
            source: '',
            address: -1,
            station: '',
            size: 0,
            instructionValues: [],
            compiledInstruction: ''
        }
    }

    /** Finds and return an API Code for a given name, or throws if not found */
    function getApiCode (nameToSearch: string, currOpCode: number, currentCodeLine:string) : number {
        const query = apiCodeTable.find(Obj => Obj.name === nameToSearch && Obj.opCode === currOpCode)
        if (query) {
            return query.apiCode
        }
        throw new Error(`assembler() error #2. API function not found. Instruction: '${currentCodeLine}'`)
    }

    /**
     * Check if branches offsets are in range. If not, update AsmObj
     * inverting branches and adding jump instruction.
     * @param CurrItem Current instruction to update address
     * @param idx Current index of asmObj
     * @returns true if instruction is not branch or if branch offset
     * is in range. False if AsmObj was modified and process need to
     * be restarted.
     */
    function checkBranches (CurrItem: CODE_INSTRUCTION, idx: number) {
        if (CurrItem.branchLabel !== undefined) {
            const FoundLabel = AsmObj.labels.find(obj => obj.label === CurrItem.branchLabel)
            if (FoundLabel === undefined) {
                throw new Error('assembler() error #4.' +
                ` Unknow label ${CurrItem.branchLabel}. Instruction: '${CurrItem.source}'`)
            }
            const offset = FoundLabel.address - CurrItem.address
            if (offset < -128 || offset > 127) {
                // We have branch offset overflow: solve it!
                // create jump operation
                const JumpCode = genCodeInstr()
                JumpCode.source = `JUMP: ${CurrItem.source}`
                JumpCode.size = 5
                JumpCode.jumpLabel = CurrItem.branchLabel
                JumpCode.instructionValues.push({ type: 'O', value: 0x1an })
                // change opCode
                switch (CurrItem.instructionValues[0].value) {
                case 0x1bn: CurrItem.instructionValues[0].value = 0x1en; break // BZR_DAT -> BNZ_DAT
                case 0x1en: CurrItem.instructionValues[0].value = 0x1bn; break // BNZ_DAT -> BZR_DAT
                case 0x1fn: CurrItem.instructionValues[0].value = 0x22n; break // BGT_DAT -> BLE_DAT
                case 0x22n: CurrItem.instructionValues[0].value = 0x1fn; break // BLE_DAT -> BGT_DAT
                case 0x21n: CurrItem.instructionValues[0].value = 0x20n; break // BGE_DAT -> BLT_DAT
                case 0x20n: CurrItem.instructionValues[0].value = 0x21n; break // BLT_DAT -> BGE_DAT
                case 0x23n: CurrItem.instructionValues[0].value = 0x24n; break // BEQ_DAT -> BNE_DAT
                case 0x24n: CurrItem.instructionValues[0].value = 0x23n; break // BNE_DAT -> BEQ_DAT
                }
                // change branch destination
                CurrItem.branchLabel = `__${CurrItem.address}`
                if (AsmObj.code[idx + 1].station.length !== 0) {
                    // station already filled, add a new code for label
                    const LabelCode = genCodeInstr()
                    LabelCode.source = `JUMP: ${CurrItem.source}`
                    LabelCode.size = 0
                    LabelCode.station = `__${CurrItem.address}`
                    // insert jump+label operation
                    AsmObj.code.splice(idx + 1, 0, JumpCode, LabelCode)
                } else {
                    // station is free, no need to add a new code for label
                    AsmObj.code[idx + 1].station = `__${CurrItem.address}`
                    // insert jump operation
                    AsmObj.code.splice(idx + 1, 0, JumpCode)
                }
                // AsmObj modified... Do it again.
                return false
            }
        }
        // Item has no branch property or branch is in range
        return true
    }

    /**
     * Get values from 'branchLabel' or 'jumpLabel' and pushes into
     * 'content' and 'content_type'
     * @param CurrItem Current instruction
     */
    function fillJumpsAndBranches (CurrItem: CODE_INSTRUCTION) {
        if (CurrItem.branchLabel !== undefined) {
            const FoundLabel = assertNotUndefined(AsmObj.labels.find(obj => obj.label === CurrItem.branchLabel))
            const offset = FoundLabel.address - CurrItem.address
            CurrItem.instructionValues.push({ type: 'B', value: BigInt(offset) })
            delete CurrItem.branchLabel
        } else if (CurrItem.jumpLabel !== undefined) {
            const FoundLabel = AsmObj.labels.find(obj => obj.label === CurrItem.jumpLabel)
            if (FoundLabel === undefined) {
                throw new Error(`assembler() error #5: Unknow jump label ${CurrItem.jumpLabel}. Source: "${CurrItem.source}"`)
            }
            CurrItem.instructionValues.push({ type: 'J', value: BigInt(FoundLabel.address) })
            delete CurrItem.jumpLabel
        }
    }

    /** Builds returnObject with values from AsmObj */
    function buildRetObj (): MACHINE_OBJECT {
        let cspages = 0; let uspages = 0
        if (AsmObj.PCodeStackPages > 0) {
            cspages = AsmObj.PCodeStackPages
        } else {
            if (assemblyCode.indexOf('JSR ') !== -1 || assemblyCode.indexOf('RET') !== -1) {
                cspages = 1
            }
        }
        if (AsmObj.PUserStackPages > 0) {
            uspages = AsmObj.PUserStackPages
        } else {
            if (assemblyCode.indexOf('POP ') !== -1 || assemblyCode.indexOf('PSH ') !== -1) {
                uspages = 1
            }
        }
        const datapages = Math.ceil(AsmObj.memory.length / 32)
        const codepages = Math.ceil(AsmObj.bytecode.length / (32 * 16))
        const minimumfee = (cspages + uspages + datapages + codepages) * 7350000
        return {
            DataPages: datapages,
            CodeStackPages: cspages,
            UserStackPages: uspages,
            CodePages: codepages,
            MinimumFeeNQT: minimumfee.toString(10),
            ByteCode: AsmObj.bytecode,
            MachineCodeHashId: hashMachineCode(AsmObj.bytecode),
            ByteData: AsmObj.bytedata,
            Memory: AsmObj.memory.map(Obj => Obj.name),
            Labels: AsmObj.labels,
            PName: AsmObj.PName,
            PDescription: AsmObj.PDescription,
            PActivationAmount: AsmObj.PActivationAmount
        }
    }

    /**
     * Translate obj.content to obj.hexstring
     * @param CurrItem Current instruction object
     */
    function finishHim (CurrItem: CODE_INSTRUCTION) {
        CurrItem.instructionValues.forEach(InstrObj => {
            CurrItem.compiledInstruction += number2hexstring(InstrObj.value, InstrObj.type)
        })
        AsmObj.bytecode += CurrItem.compiledInstruction
    }

    /** Finds last non zero memory value and returns hexstring with memory values from zero until last non zero. */
    function fatality (mem: MEMORY_INFO[]) {
        let lastIndex = -1
        let retString = ''
        for (let i = mem.length - 1; i >= 0; i--) {
            if (mem[i].value !== 0n) {
                lastIndex = i
                break
            }
        }
        for (let i = 0; i <= lastIndex; i++) {
            retString += number2hexstring(mem[i].value, 'L')
        }
        return retString
    }

    /**
     *
     * @param value Value to be converted
     * @param valType To indicate number of bytes
     * @returns Value in hexstring in little endian format
     */
    function number2hexstring (value: bigint, valType: INSTRUCTION_PARAM_TYPES) {
        let bytes = 0
        let retString = ''
        switch (valType) {
        case 'O':
            return value.toString(16).padStart(2, '0')
        case 'B':
            return ((256n + value) % 256n).toString(16).padStart(2, '0')
        case 'F':
            bytes = 2
            break
        case 'J':
        case 'I':
            bytes = 4
            break
        case 'L':
            bytes = 8
        }
        for (let i = 0, base = 256n; i < bytes; i++) {
            retString += (value % base).toString(16).padStart(2, '0')
            value = value / base
        }
        return retString
    }

    return assemblerMain()
}
