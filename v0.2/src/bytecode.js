"use strict";

// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License


function bytecode(assembly_source) {

    const ciyam_spec = {
        op_code_table: [
            { op_code: 0xf0, name: "blank",   size:  0, args_type: "",    regex:   /^\s*$/  },
            { op_code: 0xf1, name: "label",   size:  0, args_type: "",    regex:   /^\s*(\w+):\s*$/  },
            { op_code: 0xf2, name: "comment", size:  0, args_type: "",    regex:   /^\s*\^comment\s+(.*)/ },
            { op_code: 0xf3, name: "declare", size:  0, args_type: "",    regex:   /^\s*\^declare\s+(\w+)\s*$/  },
            { op_code: 0xf4, name: "const",   size:  0, args_type: "",    regex:   /^\s*\^const\s+SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/  },
            { op_code: 0xf5, name: "program", size:  0, args_type: "",    regex:   /^\s*\^program\s+(\w+)\s+([\s\S]+)$/  },
            { op_code: 0x01, name: "SET_VAL", size: 13, args_type: "IL",  regex:   /^\s*SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/  },          // SET @var #0000000000000001
            { op_code: 0x02, name: "SET_DAT", size:  9, args_type: "II",  regex:   /^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/  },                   // SET @var $var
            { op_code: 0x03, name: "CLR_DAT", size:  5, args_type: "I",   regex:   /^\s*CLR\s+@(\w+)\s*$/  },
            { op_code: 0x04, name: "INC_DAT", size:  5, args_type: "I",   regex:   /^\s*INC\s+@(\w+)\s*$/  },
            { op_code: 0x05, name: "DEC_DAT", size:  5, args_type: "I",   regex:   /^\s*DEC\s+@(\w+)\s*$/  },
            { op_code: 0x06, name: "ADD_DAT", size:  9, args_type: "II",  regex:   /^\s*ADD\s+@(\w+)\s+\$(\w+)\s*$/  },
            { op_code: 0x07, name: "SUB_DAT", size:  9, args_type: "II",  regex:   /^\s*SUB\s+@(\w+)\s+\$(\w+)\s*$/  },
            { op_code: 0x08, name: "MUL_DAT", size:  9, args_type: "II",  regex:   /^\s*MUL\s+@(\w+)\s+\$(\w+)\s*$/  },
            { op_code: 0x09, name: "DIV_DAT", size:  9, args_type: "II",  regex:   /^\s*DIV\s+@(\w+)\s+\$(\w+)\s*$/  },
            { op_code: 0x0a, name: "BOR_DAT", size:  9, args_type: "II",  regex:   /^\s*BOR\s+@(\w+)\s+\$(\w+)\s*$/  },
            { op_code: 0x0b, name: "AND_DAT", size:  9, args_type: "II",  regex:   /^\s*AND\s+@(\w+)\s+\$(\w+)\s*$/  },
            { op_code: 0x0c, name: "XOR_DAT", size:  9, args_type: "II",  regex:   /^\s*XOR\s+@(\w+)\s+\$(\w+)\s*$/  },
            { op_code: 0x0d, name: "NOT_DAT", size:  5, args_type: "I",   regex:   /^\s*NOT\s+@(\w+)\s*$/  },
            { op_code: 0x0e, name: "SET_IND", size:  9, args_type: "II",  regex:   /^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\)\s*$/  },
            { op_code: 0x0f, name: "SET_IDX", size: 13, args_type: "III", regex:   /^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\s*\+\s*\$(\w+)\)\s*$/  },
            { op_code: 0x10, name: "PSH_DAT", size:  5, args_type: "I",   regex:   /^\s*PSH\s+\$(\w+)\s*$/  },
            { op_code: 0x11, name: "POP_DAT", size:  5, args_type: "I",   regex:   /^\s*POP\s+@(\w+)\s*$/  },
            { op_code: 0x12, name: "JMP_SUB", size:  5, args_type: "J",   regex:   /^\s*JSR\s+:(\w+)\s*$/  },                             // JSR :function
            { op_code: 0x13, name: "RET_SUB", size:  1, args_type: "",    regex:   /^\s*RET\s*$/  },
            { op_code: 0x14, name: "IND_DAT", size:  9, args_type: "II",  regex:   /^\s*SET\s+@\(\$(\w+)\)\s+\$(\w+)\s*$/  },
            { op_code: 0x15, name: "IDX_DAT", size: 13, args_type: "III", regex:   /^\s*SET\s+@\(\$(\w+)\s*\+\s*\$(\w+)\)\s+\$(\w+)\s*$/  },
            { op_code: 0x16, name: "MOD_DAT", size:  9, args_type: "II",  regex:   /^\s*MOD\s+@(\w+)\s+\$(\w+)\s*$/  },
            { op_code: 0x17, name: "SHL_DAT", size:  9, args_type: "II",  regex:   /^\s*SHL\s+@(\w+)\s+\$(\w+)\s*$/  },
            { op_code: 0x18, name: "SHR_DAT", size:  9, args_type: "II",  regex:   /^\s*SHR\s+@(\w+)\s+\$(\w+)\s*$/  },
            { op_code: 0x1a, name: "JMP_ADR", size:  5, args_type: "J",   regex:   /^\s*JMP\s+:(\w+)\s*$/  },                             // JMP :label
            { op_code: 0x1b, name: "BZR_DAT", size:  6, args_type: "IB",  regex:   /^\s*BZR\s+\$(\w+)\s+:(\w+)\s*$/  },                   // BZR $var :label
            { op_code: 0x1e, name: "BNZ_DAT", size:  6, args_type: "IB",  regex:   /^\s*BNZ\s+\$(\w+)\s+:(\w+)\s*$/  },                   // BZR $var :label
            { op_code: 0x1f, name: "BGT_DAT", size: 10, args_type: "IIB", regex:   /^\s*BGT\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/  },         // BGT $var $var :label
            { op_code: 0x20, name: "BLT_DAT", size: 10, args_type: "IIB", regex:   /^\s*BLT\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/  },         // BLT $var $var :label
            { op_code: 0x21, name: "BGE_DAT", size: 10, args_type: "IIB", regex:   /^\s*BGE\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/  },         // BGE $var $var :label
            { op_code: 0x22, name: "BLE_DAT", size: 10, args_type: "IIB", regex:   /^\s*BLE\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/  },         // BLE $var $var :label
            { op_code: 0x23, name: "BEQ_DAT", size: 10, args_type: "IIB", regex:   /^\s*BEQ\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/  },         // BEQ $var $var :label
            { op_code: 0x24, name: "BNE_DAT", size: 10, args_type: "IIB", regex:   /^\s*BNE\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/  },         // BNE $var $var :label
            { op_code: 0x25, name: "SLP_DAT", size:  5, args_type: "I",   regex:   /^\s*SLP\s+\$(\w+)\s*$/  },
            { op_code: 0x26, name: "FIZ_DAT", size:  5, args_type: "I",   regex:   /^\s*FIZ\s+\$(\w+)\s*$/  },
            { op_code: 0x27, name: "STZ_DAT", size:  5, args_type: "I",   regex:   /^\s*STZ\s+\$(\w+)\s*$/  },
            { op_code: 0x28, name: "FIN_IMD", size:  1, args_type: "",    regex:   /^\s*FIN\s*$/  },
            { op_code: 0x29, name: "STP_IMD", size:  1, args_type: "",    regex:   /^\s*STP\s*$/  },
            { op_code: 0x2b, name: "ERR_ADR", size:  5, args_type: "J",   regex:   /^\s*ERR\s+:(\w+)\s*$/  },                             // ERR :label
            { op_code: 0x30, name: "SET_PCS", size:  1, args_type: "",    regex:   /^\s*PCS\s*$/  },
            { op_code: 0x32, name: "EXT_FUN", size:  3, args_type: "F",   regex:   /^\s*FUN\s+(\w+)\s*$/  },
            { op_code: 0x33, name: "EXT_FUN_DAT", size: 7, args_type: "FI", regex:   /^\s*FUN\s+(\w+)\s+\$(\w+)\s*$/  },
            { op_code: 0x34, name: "EXT_FUN_DAT_2", size: 11, args_type: "FII", regex:   /^\s*FUN\s+(\w+)\s+\$(\w+)\s+\$(\w+)\s*$/  },
            { op_code: 0x35, name: "EXT_FUN_RET",   size: 7,  args_type: "FI",  regex:   /^\s*FUN\s+@(\w+)\s+(\w+)\s*$/  },
            { op_code: 0x36, name: "EXT_FUN_RET_DAT", size: 11, args_type: "FII", regex:   /^\s*FUN\s+@(\w+)\s+(\w+)\s+\$(\w+)\s*$/  },
            { op_code: 0x37, name: "EXT_FUN_RET_DAT_2", size: 15, args_type: "FIII", regex:   /^\s*FUN\s+@(\w+)\s+(\w+)\s+\$(\w+)\s+\$(\w+)\s*$/  },
            { op_code: 0x7f, name: "NOP",     size:  1, args_type: "",    regex: /^\s*NOP\s*$/  },
        ],

        api_code_table: [
            { name: "get_A1",           api_code: 0x0100, op_code: 0x35 },
            { name: "get_A2",           api_code: 0x0101, op_code: 0x35 },
            { name: "get_A3",           api_code: 0x0102, op_code: 0x35 },
            { name: "get_A4",           api_code: 0x0103, op_code: 0x35 },
            { name: "get_B1",           api_code: 0x0104, op_code: 0x35 },
            { name: "get_B2",           api_code: 0x0105, op_code: 0x35 },
            { name: "get_B3",           api_code: 0x0106, op_code: 0x35 },
            { name: "get_B4",           api_code: 0x0107, op_code: 0x35 },
            { name: "set_A1",           api_code: 0x0110, op_code: 0x33 },
            { name: "set_A2",           api_code: 0x0111, op_code: 0x33 },
            { name: "set_A3",           api_code: 0x0112, op_code: 0x33 },
            { name: "set_A4",           api_code: 0x0113, op_code: 0x33 },
            { name: "set_A1_A2",        api_code: 0x0114, op_code: 0x34 },
            { name: "set_A3_A4",        api_code: 0x0115, op_code: 0x34 },
            { name: "set_B1",           api_code: 0x0116, op_code: 0x33 },
            { name: "set_B2",           api_code: 0x0117, op_code: 0x33 },
            { name: "set_B3",           api_code: 0x0118, op_code: 0x33 },
            { name: "set_B4",           api_code: 0x0119, op_code: 0x33 },
            { name: "set_B1_B2",        api_code: 0x011a, op_code: 0x34 },
            { name: "set_B3_B4",        api_code: 0x011b, op_code: 0x34 },
            { name: "clear_A",          api_code: 0x0120, op_code: 0x32 },
            { name: "clear_B",          api_code: 0x0121, op_code: 0x32 },
            { name: "clear_A_B",        api_code: 0x0122, op_code: 0x32 },
            { name: "copy_A_From_B",    api_code: 0x0123, op_code: 0x32 },
            { name: "copy_B_From_A",    api_code: 0x0124, op_code: 0x32 },
            { name: "check_A_Is_Zero",  api_code: 0x0125, op_code: 0x35 },
            { name: "check_B_Is_Zero",  api_code: 0x0126, op_code: 0x35 },
            { name: "check_A_equals_B", api_code: 0x0127, op_code: 0x35 },
            { name: "swap_A_and_B",     api_code: 0x0128, op_code: 0x32 },
            { name: "OR_A_with_B",      api_code: 0x0129, op_code: 0x32 },
            { name: "OR_B_with_A",      api_code: 0x012a, op_code: 0x32 },
            { name: "AND_A_with_B",     api_code: 0x012b, op_code: 0x32 },
            { name: "AND_B_with_A",     api_code: 0x012c, op_code: 0x32 },
            { name: "XOR_A_with_B",     api_code: 0x012d, op_code: 0x32 },
            { name: "XOR_B_with_A",     api_code: 0x012e, op_code: 0x32 },
            { name: "add_A_to_B",       api_code: 0x0140, op_code: 0x32 },
            { name: "add_B_to_A",       api_code: 0x0141, op_code: 0x32 },
            { name: "sub_A_from_B",     api_code: 0x0142, op_code: 0x32 },
            { name: "sub_B_from_A",     api_code: 0x0143, op_code: 0x32 },
            { name: "mul_A_by_B",       api_code: 0x0144, op_code: 0x32 },
            { name: "mul_B_by_A",       api_code: 0x0145, op_code: 0x32 },
            { name: "div_A_by_B",       api_code: 0x0146, op_code: 0x32 },
            { name: "div_B_by_A",       api_code: 0x0147, op_code: 0x32 },
            { name: "MD5_A_to_B",             api_code: 0x0200, op_code: 0x32 },
            { name: "check_MD5_A_with_B",     api_code: 0x0201, op_code: 0x35 },
            { name: "HASH160_A_to_B",         api_code: 0x0202, op_code: 0x32 },
            { name: "check_HASH160_A_with_B", api_code: 0x0203, op_code: 0x35 },
            { name: "SHA256_A_to_B",          api_code: 0x0204, op_code: 0x32 },
            { name: "check_SHA256_A_with_B",  api_code: 0x0205, op_code: 0x35 },
            { name: "get_Block_Timestamp",       api_code: 0x0300, op_code: 0x35 },
            { name: "get_Creation_Timestamp",    api_code: 0x0301, op_code: 0x35 },
            { name: "get_Last_Block_Timestamp",  api_code: 0x0302, op_code: 0x35 },
            { name: "put_Last_Block_Hash_In_A",  api_code: 0x0303, op_code: 0x32 },
            { name: "A_to_Tx_after_Timestamp",   api_code: 0x0304, op_code: 0x33 },
            { name: "get_Type_for_Tx_in_A",      api_code: 0x0305, op_code: 0x35 },
            { name: "get_Amount_for_Tx_in_A",    api_code: 0x0306, op_code: 0x35 },
            { name: "get_Timestamp_for_Tx_in_A", api_code: 0x0307, op_code: 0x35 },
            { name: "get_Ticket_Id_for_Tx_in_A", api_code: 0x0308, op_code: 0x35 },
            { name: "message_from_Tx_in_A_to_B", api_code: 0x0309, op_code: 0x32 },
            { name: "B_to_Address_of_Tx_in_A",   api_code: 0x030a, op_code: 0x32 },
            { name: "B_to_Address_of_Creator",   api_code: 0x030b, op_code: 0x32 },
            { name: "get_Current_Balance",      api_code: 0x0400, op_code: 0x35 },
            { name: "get_Previous_Balance",     api_code: 0x0401, op_code: 0x35 },
            { name: "send_to_Address_in_B",     api_code: 0x0402, op_code: 0x33 },
            { name: "send_All_to_Address_in_B", api_code: 0x0403, op_code: 0x32 },
            { name: "send_Old_to_Address_in_B", api_code: 0x0404, op_code: 0x32 },
            { name: "send_A_to_Address_in_B",   api_code: 0x0405, op_code: 0x32 },
            { name: "add_Minutes_to_Timestamp", api_code: 0x0406, op_code: 0x37 },
        ],
    };

    const AsmObj = {
        memory:   [], // 'name'
        code:     [], // { source: "", address: 0, station: "", jumpLabel: "", branchLabel: "", size: 0, content: [], content_type: [], hexstring: "" }
        data:     [], // [ 0n, 0n, 1200n ]
        labels:   [], // { label: "asdf", address: 1234}
        PName:    "",
        PDescription: "",
        PActivationAmount: "",
        bytecode: "",
        bytedata: "",
    };

    const Code_Template = { source: "",
                        address: -1,
                        station: "",
                        jumpLabel: "",
                        branchLabel: "",
                        size: 0,
                        content: [ ],
                        content_type: [],
                        hexstring: "" };

    function bytecode_main() {

        //process line by line
        var line = assembly_source.split("\n")

        //first pass, fill address, opcodes, apicodes, constants
        line.forEach( function (asm_line) {

            var parts, j;
            //loop thru all regex expressions
            for (j=0; j<ciyam_spec.op_code_table.length; j++) {
                parts=ciyam_spec.op_code_table[j].regex.exec(asm_line);
                if (parts !== null) {
                    process(parts, ciyam_spec.op_code_table[j]);
                    return;
                }
            }

            throw new TypeError("bytecode compiling error #1");
        });

        //second pass, solve branches offsets
        do {
            AsmObj.labels = [];
            AsmObj.code.reduce( fillAddress, 0);
        } while ( ! AsmObj.code.every( checkBranches ));

        //third pass, push jump an branches.
        AsmObj.code.forEach( fillJumpsAndBranches );

        //last pass, join all contents in little endian notation (code and data)
        AsmObj.code.forEach( finishHim );
        AsmObj.data.forEach( fatality );

        return buildRetObj();
    }

    function process(parts, instruction) {

        function getMemoryAddress(asm_name) {
            let idx = AsmObj.memory.findIndex(value => value === asm_name);
            if (idx == -1) {
                AsmObj.memory.push(asm_name);
                return AsmObj.memory.length-1;
            }
            return idx;
        }

        var CodeObj = JSON.parse(JSON.stringify(Code_Template));

        if (instruction.op_code == 0xF0) {
            return;
        }

        //debug helper
        CodeObj.source=parts[0];

        // label:
        if (instruction.op_code == 0xF1) {
                CodeObj.station = parts[1];
            AsmObj.code.push(CodeObj);
            return;
        }

        // ^comment user_comment
        if (instruction.op_code == 0xF2) {
            return;
        }

        // ^declare asm_name
        if (instruction.op_code == 0xF3) {
            getMemoryAddress(parts[1]);
            return;
        }

        //^const SET @(asm_name) #(hex_content)
        if (instruction.op_code == 0xF4) {
            //This can cause a bug if const instruction become before declare instruction.
            //But this is forbidden by generator, so only bug if compiling from wronng man
            //made assembly code.
            let addr = getMemoryAddress(parts[1]);
            if (AsmObj.data.length > addr) {
                AsmObj.data[addr]=BigInt("0x"+parts[2]);
                return;
            }
            for (let i=AsmObj.data.length; i<addr; i++) {
                AsmObj.data.push(0n);
            }
            AsmObj.data.push(BigInt("0x"+parts[2]));
            return;
        }

        // ^program type information
        if (instruction.op_code == 0xF5) {
            if (parts[1]== 'name') {
                AsmObj.PName = parts[2];
            }
            if (parts[1]== 'description') {
                AsmObj.PDescription = parts[2];
            }
            if (parts[1]== 'activationAmount') {
                AsmObj.PActivationAmount = parts[2];
            }
            return;
        }

        //push OpCode at content[]
        CodeObj.size = instruction.size;
        CodeObj.content.push(instruction.op_code);
        CodeObj.content_type.push("O");

        let i=0;
        if (instruction.op_code >= 0x35 && instruction.op_code <= 0x37 ) {
            //0x35, 0x36 and 0x37 are exceptions for args order, treat now
            let search = ciyam_spec.api_code_table.find( obj => obj.name===parts[2] && obj.op_code == instruction.op_code);
            if (search === undefined) {
                throw new TypeError("bytecode compiling error #2");
            }
            CodeObj.content.push(search.api_code);
            CodeObj.content_type.push("F");
            CodeObj.content.push(getMemoryAddress(parts[1]));
            CodeObj.content_type.push("I");
            i=2;
        }
        for ( ; i < instruction.args_type.length; i++) {
            let type=instruction.args_type.charAt(i);
            if (type == "I") {
                CodeObj.content.push(getMemoryAddress(parts[i+1]));
                CodeObj.content_type.push(type);
                continue;
            }
            if (type == "L") {
                CodeObj.content.push(BigInt("0x"+parts[i+1]));
                CodeObj.content_type.push(type);
                continue;
            }
            if (type == "B") { //branch offset will be processed later
                CodeObj.branchLabel = parts[i+1];
                continue;
            }
            if (type == "J") { //jump will be processed later
                CodeObj.jumpLabel = parts[i+1];
                continue;
            }
            if (type == "F") { //function name for opCodes 0x32, 0x33, 0x34
                let search = ciyam_spec.api_code_table.find( obj => obj.name===parts[1] && obj.op_code == instruction.op_code);
                if (search === undefined) {
                    throw new TypeError("bytecode compiling error #3");
                }
                CodeObj.content.push(search.api_code);
                CodeObj.content_type.push(type);
                continue;
            }
        }
        AsmObj.code.push(CodeObj);
    }

    function fillAddress( currAddr, currItem) {

        currItem.address=currAddr;
        if (currItem.station.length != 0) {
            AsmObj.labels.push({ label: currItem.station, address: currAddr});
        }
        return currAddr+currItem.size;
    }

    function checkBranches(CodeObj, idx) {

        if (CodeObj.branchLabel.length != 0) {
            let search = AsmObj.labels.find( obj => obj.label=== CodeObj.branchLabel );
            if (search === undefined) {
                throw new TypeError("bytecode compiling error #4");
            }
            let offset = search.address - CodeObj.address;

            if (offset < -128 || offset > 127 ) {
                // branch offset overflow
                //create jump operation
                let JumpCode =  JSON.parse(JSON.stringify(Code_Template));
                JumpCode.source = "JUMP: "+CodeObj.source;
                JumpCode.size = 5;
                JumpCode.jumpLabel = CodeObj.branchLabel;
                JumpCode.content.push(0x1a);
                JumpCode.content_type.push("O");

                //change op_code
                switch (CodeObj.content[0]) {
                    case 0x1b: CodeObj.content[0] = 0x1e; break; // BZR_DAT -> BNZ_DAT 
                    case 0x1e: CodeObj.content[0] = 0x1b; break; // BNZ_DAT -> BZR_DAT
                    case 0x1f: CodeObj.content[0] = 0x22; break; // BGT_DAT -> BLE_DAT
                    case 0x22: CodeObj.content[0] = 0x1f; break; // BLE_DAT -> BGT_DAT 
                    case 0x21: CodeObj.content[0] = 0x20; break; // BGE_DAT -> BLT_DAT
                    case 0x20: CodeObj.content[0] = 0x21; break; // BLT_DAT -> BGE_DAT
                    case 0x23: CodeObj.content[0] = 0x24; break; // BEQ_DAT -> BNE_DAT
                    case 0x24: CodeObj.content[0] = 0x23; break; // BNE_DAT -> BEQ_DAT
                }
                // change branch destination
                CodeObj.branchLabel = "__"+CodeObj.address;
                if (AsmObj.code[idx+1].station.length != 0) {
                    //station already filled, add a new code for label
                    let LabelCode =  JSON.parse(JSON.stringify(Code_Template));
                    LabelCode.source = "JUMP: "+CodeObj.source;
                    LabelCode.size = 0;
                    LabelCode.station = "__"+CodeObj.address;
                    AsmObj.code.splice(idx+1, 0, JumpCode, LabelCode);
                } else {
                    AsmObj.code[idx+1].station = "__"+CodeObj.address;
                    // insert jump operation
                    AsmObj.code.splice(idx+1, 0, JumpCode);
                }
                return false; // do it again.
            }
        }
        return true;
    }

    function fillJumpsAndBranches(CodeObj) {

        if (CodeObj.branchLabel.length != 0) {
            let search = AsmObj.labels.find( obj => obj.label=== CodeObj.branchLabel );
            let offset = search.address - CodeObj.address;
            CodeObj.content.push(offset);
            CodeObj.content_type.push("B");
        } else if (CodeObj.jumpLabel.length != 0) {
            let search = AsmObj.labels.find( obj => obj.label=== CodeObj.jumpLabel );
            if (search === undefined) {
                throw new TypeError("bytecode compiling error #5");
            }
            CodeObj.content.push(search.address);
            CodeObj.content_type.push("J");
        }
        delete CodeObj.branchLabel;
        delete CodeObj.jumpLabel;
    }

    function buildRetObj() {

        let cspages=0, uspages=0, codepages, datapages, minimumfee;
        if (assembly_source.indexOf("JSR ") != -1 || assembly_source.indexOf("RET") != -1) {
            cspages=1;
        }
        if (assembly_source.indexOf("POP ") != -1 || assembly_source.indexOf("PSH ") != -1) {
            uspages=1;
        }
        datapages=Math.ceil(AsmObj.memory.length/32);
        codepages=Math.ceil(AsmObj.bytecode.length / (32 * 16));
        minimumfee=(cspages+uspages+datapages+codepages)*7350000;
        return {
            DataPages: datapages,
            CodeStackPages: cspages,
            UserStackPages: uspages,
            CodePages: codepages,
            MinimumFeeNQT: minimumfee,
            ByteCode: AsmObj.bytecode,
            ByteData: AsmObj.bytedata,
            Memory: AsmObj.memory,
            Labels: AsmObj.labels,
            PName:  AsmObj.PName,
            PDescription: AsmObj.PDescription,
            PActivationAmount: AsmObj.PActivationAmount,
            //DevInfo: AsmObj.code,
            //DevInfo2: AsmObj.data,
        };
    }

    function finishHim(CodeObj) {

        for (var i=0; i< CodeObj.content.length; i++ ){
            CodeObj.hexstring+=number2hexstring(CodeObj.content[i], CodeObj.content_type[i]);
        }
        AsmObj.bytecode += CodeObj.hexstring;
    }

    function fatality(dataNum) {

        AsmObj.bytedata += number2hexstring(dataNum, "L");
    }

    function number2hexstring(value, type) {

        if (type == "O") {
            return value.toString(16).padStart(2,"0");
        }

        if (type == "B") {
            if (value >= 0) {
                return value.toString(16).padStart(2,"0");
            } else {
                return (256 + value).toString(16).padStart(2,"0");
            }
        }

        let bytes=0;
        let ret_str="";
        let conv_value=BigInt(value);

        if (type == "F") bytes=2;
        if (type == "J") bytes=4;
        if (type == "I") bytes=4;
        if (type == "L") bytes=8;

        for (let i=0, base=256n ; i<bytes; i++) {
            ret_str += (conv_value % base).toString(16).padStart(2,"0");
            conv_value = conv_value / base;
        }

        return ret_str;
    }

    return bytecode_main();
}
