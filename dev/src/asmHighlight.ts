// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License
// Some parts based on w3schools code for highlighting howto

/**
 * Converts assembly code in HTML code with syntax highlight
 * @param asmSourceCode plain text assembly program
 * @returns same text with syntax highlight in html
 */
// eslint-disable-next-line no-unused-vars
export function asmHighlight (asmSourceCode: string) {
    const Config = {
        divId: 'asmCodeline',
        divClass: 'asmLine',
        spanErrorClass: 'asmError',
        spanLabelClass: 'asmLabel',
        spanNumberClass: 'asmNumber',
        spanCommentClass: 'asmComment',
        spanVariableClass: 'asmVariable',
        spanDirectiveClass: 'asmDirective',
        spanInstructionClass: 'asmInstruction'
    }
    type codeRule = {
        opCode: number
        size: number
        regex: RegExp
    }
    const allowedCodes: codeRule[] = [
        { opCode: 0xf0, size: 0, regex: /^\s*$/ },
        { opCode: 0xf1, size: 0, regex: /^\s*(\w+):\s*$/ },
        { opCode: 0xf2, size: 0, regex: /^(\s*\^comment)(\s+.*)/ },
        { opCode: 0xf3, size: 0, regex: /^(\s*\^declare)(\s+\w+\s*)$/ },
        { opCode: 0xf4, size: 0, regex: /^(\s*\^const)(\s+.*)/ },
        { opCode: 0xf5, size: 0, regex: /^(\s*\^program\s+\w+\b)(.*)$/ },
        { opCode: 0x01, size: 13, regex: /^(\s*SET\s+)(@\w+\s+)(#[\da-f]{16}\b\s*)$/ }, // SET @var #0000000000000001
        { opCode: 0x02, size: 9, regex: /^(\s*SET\s+)(@\w+\s+)(\$\w+\s*)$/ }, // SET @var $var
        { opCode: 0x03, size: 5, regex: /^(\s*CLR\s+)(@\w+\s*)$/ },
        { opCode: 0x04, size: 5, regex: /^(\s*INC\s+)(@\w+\s*)$/ },
        { opCode: 0x05, size: 5, regex: /^(\s*DEC\s+)(@\w+\s*)$/ },
        { opCode: 0x06, size: 9, regex: /^(\s*ADD\s+)(@\w+\s+)(\$\w+\s*)$/ },
        { opCode: 0x07, size: 9, regex: /^(\s*SUB\s+)(@\w+\s+)(\$\w+\s*)$/ },
        { opCode: 0x08, size: 9, regex: /^(\s*MUL\s+)(@\w+\s+)(\$\w+\s*)$/ },
        { opCode: 0x09, size: 9, regex: /^(\s*DIV\s+)(@\w+\s+)(\$\w+\s*)$/ },
        { opCode: 0x0a, size: 9, regex: /^(\s*BOR\s+)(@\w+\s+)(\$\w+\s*)$/ },
        { opCode: 0x0b, size: 9, regex: /^(\s*AND\s+)(@\w+\s+)(\$\w+\s*)$/ },
        { opCode: 0x0c, size: 9, regex: /^(\s*XOR\s+)(@\w+\s+)(\$\w+\s*)$/ },
        { opCode: 0x0d, size: 5, regex: /^(\s*NOT\s+)(@\w+\s*)$/ },
        { opCode: 0x0e, size: 9, regex: /^(\s*SET\s+)(@\w+)(\s+\$\()(\$\w+)(\)\s*)$/ },
        { opCode: 0x0f, size: 13, regex: /^(\s*SET\s+)(@\w+\s+)(\$\()(\$\w+)(\s*\+\s*)(\$\w+)(\)\s*)$/ },
        { opCode: 0x10, size: 5, regex: /^(\s*PSH\s+)(\$\w+\s*)$/ },
        { opCode: 0x11, size: 5, regex: /^(\s*POP\s+)(@\w+\s*)$/ },
        { opCode: 0x12, size: 5, regex: /^(\s*JSR\s+)(:\w+\s*)$/ }, // JSR :function
        { opCode: 0x13, size: 1, regex: /^\s*RET\s*$/ },
        { opCode: 0x14, size: 9, regex: /^(\s*SET\s+)(@\()(\$\w+)(\)\s+)(\$\w+\s*)$/ },
        { opCode: 0x15, size: 13, regex: /^(\s*SET\s+)(@\()(\$\w+)(\s*\+\s*)(\$\w+)(\)\s+)(\$\w+\s*)$/ },
        { opCode: 0x16, size: 9, regex: /^(\s*MOD\s+)(@\w+\s+)(\$\w+\s*)$/ },
        { opCode: 0x17, size: 9, regex: /^(\s*SHL\s+)(@\w+\s+)(\$\w+\s*)$/ },
        { opCode: 0x18, size: 9, regex: /^(\s*SHR\s+)(@\w+\s+)(\$\w+\s*)$/ },
        { opCode: 0x1a, size: 5, regex: /^(\s*JMP\s+)(:\w+\s*)$/ }, // JMP :label
        { opCode: 0x1b, size: 6, regex: /^(\s*BZR\s+)(\$\w+\s+)(:\w+\s*)$/ }, // BZR $var :label
        { opCode: 0x1e, size: 6, regex: /^(\s*BNZ\s+)(\$\w+\s+)(:\w+\s*)$/ }, // BZR $var :label
        { opCode: 0x1f, size: 10, regex: /^(\s*BGT\s+)(\$\w+\s+)(\$\w+\s+)(:\w+\s*)$/ }, // BGT $var $var :label
        { opCode: 0x20, size: 10, regex: /^(\s*BLT\s+)(\$\w+\s+)(\$\w+\s+)(:\w+\s*)$/ }, // BLT $var $var :label
        { opCode: 0x21, size: 10, regex: /^(\s*BGE\s+)(\$\w+\s+)(\$\w+\s+)(:\w+\s*)$/ }, // BGE $var $var :label
        { opCode: 0x22, size: 10, regex: /^(\s*BLE\s+)(\$\w+\s+)(\$\w+\s+)(:\w+\s*)$/ }, // BLE $var $var :label
        { opCode: 0x23, size: 10, regex: /^(\s*BEQ\s+)(\$\w+\s+)(\$\w+\s+)(:\w+\s*)$/ }, // BEQ $var $var :label
        { opCode: 0x24, size: 10, regex: /^(\s*BNE\s+)(\$\w+\s+)(\$\w+\s+)(:\w+\s*)$/ }, // BNE $var $var :label
        { opCode: 0x25, size: 5, regex: /^(\s*SLP\s+)(\$\w+\s*)$/ },
        { opCode: 0x26, size: 5, regex: /^(\s*FIZ\s+)(\$\w+\s*)$/ },
        { opCode: 0x27, size: 5, regex: /^(\s*STZ\s+)(\$\w+\s*)$/ },
        { opCode: 0x28, size: 1, regex: /^\s*FIN\s*$/ },
        { opCode: 0x29, size: 1, regex: /^\s*STP\s*$/ },
        { opCode: 0x2b, size: 5, regex: /^(\s*ERR\s+)(:\w+\s*)$/ }, // ERR :label
        { opCode: 0x30, size: 1, regex: /^\s*PCS\s*$/ },
        { opCode: 0x32, size: 3, regex: /^(\s*FUN\s+)(\w+\s*)$/ },
        { opCode: 0x33, size: 7, regex: /^(\s*FUN\s+)(\w+\s+)(\$\w+\s*)$/ },
        { opCode: 0x34, size: 11, regex: /^(\s*FUN\s+)(\w+\s+)(\$\w+\s+)(\$(\w+)\s*)$/ },
        { opCode: 0x35, size: 7, regex: /^(\s*FUN\s+)(@\w+\s+)(\w+\s*)$/ },
        { opCode: 0x36, size: 11, regex: /^\s*(FUN)\s+@(\w+)\s+(\w+)\s+\$(\w+)\s*$/ },
        { opCode: 0x37, size: 15, regex: /^(\s*FUN\s+)(@\w+\s+)(\w+\s+)(\$\w+\s+)(\$\w+\s*)$/ },
        { opCode: 0x7f, size: 1, regex: /^\s*NOP\s*$/ }
    ]

    const allowedFunctions = [
        { fnCode: 0x0100, fnName: 'get_A1' },
        { fnCode: 0x0101, fnName: 'get_A2' },
        { fnCode: 0x0102, fnName: 'get_A3' },
        { fnCode: 0x0103, fnName: 'get_A4' },
        { fnCode: 0x0104, fnName: 'get_B1' },
        { fnCode: 0x0105, fnName: 'get_B2' },
        { fnCode: 0x0106, fnName: 'get_B3' },
        { fnCode: 0x0107, fnName: 'get_B4' },
        { fnCode: 0x0110, fnName: 'set_A1' },
        { fnCode: 0x0111, fnName: 'set_A2' },
        { fnCode: 0x0112, fnName: 'set_A3' },
        { fnCode: 0x0113, fnName: 'set_A4' },
        { fnCode: 0x0114, fnName: 'set_A1_A2' },
        { fnCode: 0x0115, fnName: 'set_A3_A4' },
        { fnCode: 0x0116, fnName: 'set_B1' },
        { fnCode: 0x0117, fnName: 'set_B2' },
        { fnCode: 0x0118, fnName: 'set_B3' },
        { fnCode: 0x0119, fnName: 'set_B4' },
        { fnCode: 0x011a, fnName: 'set_B1_B2' },
        { fnCode: 0x011b, fnName: 'set_B3_B4' },
        { fnCode: 0x0120, fnName: 'clear_A' },
        { fnCode: 0x0121, fnName: 'clear_B' },
        { fnCode: 0x0122, fnName: 'clear_A_B' },
        { fnCode: 0x0123, fnName: 'copy_A_From_B' },
        { fnCode: 0x0124, fnName: 'copy_B_From_A' },
        { fnCode: 0x0125, fnName: 'check_A_Is_Zero' },
        { fnCode: 0x0126, fnName: 'check_B_Is_Zero' },
        { fnCode: 0x0127, fnName: 'check_A_equals_B' },
        { fnCode: 0x0128, fnName: 'swap_A_and_B' },
        { fnCode: 0x0129, fnName: 'OR_A_with_B' },
        { fnCode: 0x012a, fnName: 'OR_B_with_A' },
        { fnCode: 0x012b, fnName: 'AND_A_with_B' },
        { fnCode: 0x012c, fnName: 'AND_B_with_A' },
        { fnCode: 0x012d, fnName: 'XOR_A_with_B' },
        { fnCode: 0x012e, fnName: 'XOR_B_with_A' },
        { fnCode: 0x0140, fnName: 'add_A_to_B' },
        { fnCode: 0x0141, fnName: 'add_B_to_A' },
        { fnCode: 0x0142, fnName: 'sub_A_from_B' },
        { fnCode: 0x0143, fnName: 'sub_B_from_A' },
        { fnCode: 0x0144, fnName: 'mul_A_by_B' },
        { fnCode: 0x0145, fnName: 'mul_B_by_A' },
        { fnCode: 0x0146, fnName: 'div_A_by_B' },
        { fnCode: 0x0147, fnName: 'div_B_by_A' },
        { fnCode: 0x0200, fnName: 'MD5_A_to_B' },
        { fnCode: 0x0201, fnName: 'check_MD5_A_with_B' },
        { fnCode: 0x0202, fnName: 'HASH160_A_to_B' },
        { fnCode: 0x0203, fnName: 'check_HASH160_A_with_B' },
        { fnCode: 0x0204, fnName: 'SHA256_A_to_B' },
        { fnCode: 0x0205, fnName: 'check_SHA256_A_with_B' },
        { fnCode: 0x0300, fnName: 'get_Block_Timestamp' },
        { fnCode: 0x0301, fnName: 'get_Creation_Timestamp' },
        { fnCode: 0x0302, fnName: 'get_Last_Block_Timestamp' },
        { fnCode: 0x0303, fnName: 'put_Last_Block_Hash_In_A' },
        { fnCode: 0x0304, fnName: 'A_to_Tx_after_Timestamp' },
        { fnCode: 0x0305, fnName: 'get_Type_for_Tx_in_A' },
        { fnCode: 0x0306, fnName: 'get_Amount_for_Tx_in_A' },
        { fnCode: 0x0307, fnName: 'get_Timestamp_for_Tx_in_A' },
        { fnCode: 0x0308, fnName: 'get_Ticket_Id_for_Tx_in_A' },
        { fnCode: 0x0309, fnName: 'message_from_Tx_in_A_to_B' },
        { fnCode: 0x030a, fnName: 'B_to_Address_of_Tx_in_A' },
        { fnCode: 0x030b, fnName: 'B_to_Address_of_Creator' },
        { fnCode: 0x0400, fnName: 'get_Current_Balance' },
        { fnCode: 0x0401, fnName: 'get_Previous_Balance' },
        { fnCode: 0x0402, fnName: 'send_to_Address_in_B' },
        { fnCode: 0x0403, fnName: 'send_All_to_Address_in_B' },
        { fnCode: 0x0404, fnName: 'send_Old_to_Address_in_B' },
        { fnCode: 0x0405, fnName: 'send_A_to_Address_in_B' },
        { fnCode: 0x0406, fnName: 'add_Minutes_to_Timestamp' }
    ]

    /**
     * Main function to loop thru lines
     * @param assemblySource
     * @param addDivLine true: add a <div> for every line; false: add <br>
     * @returns HTML string
     */
    function toHTML (assemblySource: string, addDivLine: boolean = true): string {
        // process line by line
        const lines = assemblySource.split('\n')
        let ret = ''
        // loop thru all lines
        lines.forEach((line, idx) => {
            if (addDivLine === true) {
                ret += `<div id='${Config.divId}${idx}' class='${Config.divClass}'>`
            }
            // Find a rule for instruction
            const FoundRule = allowedCodes.find(Rule => Rule.regex.exec(line) !== null)
            ret += colorThisLine(line, FoundRule)
            if (addDivLine === true) ret += '</div>'
            else ret += '<br>'
        })
        return ret
    }

    function toSpan (text: string, classname: string) {
        return `<span class='${classname}'>${text}</span>`
    }

    function colorThisLine (asmLine: string, Rule: codeRule | undefined): string {
        let apiName: string
        if (Rule === undefined) {
            return toSpan(asmLine, Config.spanErrorClass)
        }
        const parts = Rule.regex.exec(asmLine)
        if (parts === null) {
            return toSpan(asmLine, Config.spanErrorClass)
        }
        switch (Rule.opCode) {
        case 0xf0: // is empty line
            return asmLine
        case 0xf1: // is label line
            return toSpan(parts[0], Config.spanLabelClass)
        case 0xf2: // comment
            return toSpan(parts[1], Config.spanDirectiveClass) +
                toSpan(parts[2], Config.spanCommentClass)
        case 0xf3: // declare
            return toSpan(parts[1], Config.spanDirectiveClass) +
                toSpan(parts[2], Config.spanVariableClass)
        case 0xf4: { // const
            const SetRule = allowedCodes.find(Obj => Obj.opCode === 0x01)
            return toSpan(parts[1], Config.spanDirectiveClass) +
                colorThisLine(parts[2], SetRule)
        }
        case 0xf5: // program
            return toSpan(parts[1], Config.spanDirectiveClass) +
                parts[2]
        case 0x01:
            return toSpan(parts[1], Config.spanInstructionClass) +
                toSpan(parts[2], Config.spanVariableClass) +
                toSpan(parts[3], Config.spanNumberClass)
        case 0x02:
        case 0x06:
        case 0x07:
        case 0x08:
        case 0x09:
        case 0x0a:
        case 0x0b:
        case 0x0c:
        case 0x16:
        case 0x17:
        case 0x18:
            return toSpan(parts[1], Config.spanInstructionClass) +
                toSpan(parts[2], Config.spanVariableClass) +
                toSpan(parts[3], Config.spanVariableClass)
        case 0x03:
        case 0x04:
        case 0x05:
        case 0x0d:
        case 0x10:
        case 0x11:
        case 0x25:
        case 0x26:
        case 0x27:
            return toSpan(parts[1], Config.spanInstructionClass) +
                toSpan(parts[2], Config.spanVariableClass)
        case 0x13:
        case 0x28:
        case 0x29:
        case 0x30:
        case 0x7f:
            return toSpan(parts[0], Config.spanInstructionClass)
        case 0x0e:
            return toSpan(parts[1], Config.spanInstructionClass) +
                toSpan(parts[2], Config.spanVariableClass) +
                parts[3] +
                toSpan(parts[4], Config.spanVariableClass) +
                parts[5]
        case 0x0f:
            return toSpan(parts[1], Config.spanInstructionClass) +
                toSpan(parts[2], Config.spanVariableClass) +
                parts[3] +
                toSpan(parts[4], Config.spanVariableClass) +
                parts[5] +
                toSpan(parts[6], Config.spanVariableClass) +
                parts[7]
        case 0x14:
            return toSpan(parts[1], Config.spanInstructionClass) +
                parts[2] +
                toSpan(parts[3], Config.spanVariableClass) +
                parts[4] +
                toSpan(parts[5], Config.spanVariableClass)
        case 0x15:
            return toSpan(parts[1], Config.spanInstructionClass) +
                parts[2] +
                toSpan(parts[3], Config.spanVariableClass) +
                parts[4] +
                toSpan(parts[5], Config.spanVariableClass) +
                parts[6] +
                toSpan(parts[7], Config.spanVariableClass)
        case 0x12:
        case 0x1a:
        case 0x2b:
            return toSpan(parts[1], Config.spanInstructionClass) +
                toSpan(parts[2], Config.spanLabelClass)
        case 0x1b:
        case 0x1e:
            return toSpan(parts[1], Config.spanInstructionClass) +
                toSpan(parts[2], Config.spanVariableClass) +
                toSpan(parts[3], Config.spanLabelClass)
        case 0x1f:
        case 0x20:
        case 0x21:
        case 0x22:
        case 0x23:
        case 0x24:
            return toSpan(parts[1], Config.spanInstructionClass) +
                toSpan(parts[2], Config.spanVariableClass) +
                toSpan(parts[3], Config.spanVariableClass) +
                toSpan(parts[4], Config.spanLabelClass)
        case 0x32:
            apiName = parts[2].trim()
            if (allowedFunctions.findIndex(Obj => Obj.fnName === apiName) === -1) {
                return toSpan(parts[1], Config.spanInstructionClass) +
                    toSpan(parts[2], Config.spanErrorClass)
            } else {
                return toSpan(parts[0], Config.spanInstructionClass)
            }
        case 0x33:
            apiName = parts[2].trim()
            if (allowedFunctions.findIndex(Obj => Obj.fnName === apiName) === -1) {
                return toSpan(parts[1], Config.spanInstructionClass) +
                    toSpan(parts[2], Config.spanErrorClass) +
                    toSpan(parts[3], Config.spanVariableClass)
            } else {
                return toSpan(parts[1] + parts[2], Config.spanInstructionClass) +
                    toSpan(parts[3], Config.spanVariableClass)
            }
        case 0x34:
            apiName = parts[2].trim()
            if (allowedFunctions.findIndex(Obj => Obj.fnName === apiName) === -1) {
                return toSpan(parts[1], Config.spanInstructionClass) +
                    toSpan(parts[2], Config.spanErrorClass) +
                    toSpan(parts[3], Config.spanVariableClass) +
                    toSpan(parts[4], Config.spanVariableClass)
            } else {
                return toSpan(parts[1] + parts[2], Config.spanInstructionClass) +
                    toSpan(parts[3], Config.spanVariableClass) +
                    toSpan(parts[4], Config.spanVariableClass)
            }
        case 0x35:
            apiName = parts[3].trim()
            if (allowedFunctions.findIndex(Obj => Obj.fnName === apiName) === -1) {
                return toSpan(parts[1], Config.spanInstructionClass) +
                    toSpan(parts[2], Config.spanVariableClass) +
                    toSpan(parts[3], Config.spanErrorClass)
            } else {
                return toSpan(parts[1], Config.spanInstructionClass) +
                    toSpan(parts[2], Config.spanVariableClass) +
                    toSpan(parts[3], Config.spanInstructionClass)
            }
        case 0x37:
            apiName = parts[3].trim()
            if (allowedFunctions.findIndex(Obj => Obj.fnName === apiName) === -1) {
                return toSpan(parts[1], Config.spanInstructionClass) +
                    toSpan(parts[2], Config.spanVariableClass) +
                    toSpan(parts[3], Config.spanInstructionClass) +
                    toSpan(parts[4], Config.spanVariableClass) +
                    toSpan(parts[5], Config.spanVariableClass)
            } else {
                return toSpan(parts[1], Config.spanInstructionClass) +
                    toSpan(parts[2], Config.spanVariableClass) +
                    toSpan(parts[3], Config.spanErrorClass) +
                    toSpan(parts[4], Config.spanVariableClass) +
                    toSpan(parts[5], Config.spanVariableClass)
            }
        case 0x36:
        default:
        }
        // this should never be reached
        return toSpan(asmLine, Config.spanErrorClass)
    }

    return toHTML(asmSourceCode, false)
}
