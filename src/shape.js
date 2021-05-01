 
 "use strict";

// Author: Rui Deleterium
// Project: https://github.com/deleterium/BurstAT-Compiler
// License: BSD 3-Clause License

// Arrange sentences into Globalsentences or in functions
// calls.

 function shapeProgram(sP_ast) {

    var Big_ast = { Global: {}, functions: [] };
    var curr=0;
    var latest_loop_id = [];

    // Organize these variables in the Big_ast:
    //   functions[].ReturnType
    //   functions[].ReturnPointer
    //   functions[].Name
    //   functions[].Arguments
    function prepareBigAst() {

        var args=[];
        var tokens;
        var Node;
        var function_name;

        Big_ast.Global.code = [];
        Big_ast.Global.macros = [];

        for (curr =0; curr < sP_ast.length; curr++) {
            if (sP_ast[curr].type === "Function") {
                function_name = sP_ast[curr].value;
                if (sP_ast.length >curr +2) {
                    if (sP_ast[curr-1].type == "Keyword" && sP_ast[curr+1].type == "CodeCave" && sP_ast[curr+2].type == "CodeDomain") {
                        args=[];
                        tokens = sP_ast[curr+1].params;
                        for (var i=0; i< tokens.length; i++) {
                            if (tokens[i].type === "Keyword" && tokens[i].value === "void" ) {
                                if ( i!=0 || tokens.length > 1 )
                                    throw new SyntaxError("At line: " + tokens[i].line + ". Invalid use of void in function definition" );
                                break;
                            }
                            if (i+1 >= tokens.length)
                                throw new SyntaxError("At line: " + tokens[i].line + ". Wrong function definition.");
                            if (tokens[i].type === "Keyword" && tokens[i+1].type === "Variable") {
                                Node = tokens[i+1];
                                Node.declaration=tokens[i].value;
                                args.push(Node);
                                i++;
                                continue;
                            }
                            if (tokens[i].type === "Delimiter")
                                continue;
                            throw new SyntaxError("At line: " + tokens[i].line + ". Token not allowed: " + tokens[i].type );
                        }
                        Big_ast.Global.code.pop();
                        Big_ast.functions.push(
                            { return_type: sP_ast[curr-1].value,
                            return_pointer: sP_ast[curr].pointer,
                            name: sP_ast[curr].value,
                            arguments: args,
                            code: sP_ast[curr+2].params
                            } );
                        curr+=2;
                        continue;
                    }
                } else {
                    throw new SyntaxError("Unexpected end of file during function call. Function: "+function_name);
                }
            }
            if (sP_ast[curr].type === "Macro") {
                Big_ast.Global.macros.push(parseMacro(sP_ast[curr]));
                continue;
            }
            Big_ast.Global.code.push(sP_ast[curr]);
        }
    }


    function parseMacro(Token){
        var fields = Token.value.replace(/\s\s+/g, ' ').split(" ");
        return { type: fields[0], property: fields[1], value: fields[2], line: Token.line }
    }


    function code2sentenceS(codetrain){

        for (var sentences=[]; curr < codetrain.length; curr++ ) {
            sentences = sentences.concat( code2sentence(codetrain) );
        }

        return sentences;
    }


    function code2sentence(codetrain){

        var phrase=[];
        var Node;
        var temp;

        var curr_prev;

        if ( codetrain[curr].type ===  "CodeDomain") {
            curr_prev = curr;
            curr=0;
            temp =  code2sentenceS(codetrain[curr_prev].params);
            curr = curr_prev;
            return temp;
        }

        // One sentence ending with terminator (or maybe another loop/conditional)
        while (curr < codetrain.length) {

            if (codetrain[curr].type === "Terminator") {
                return [ { type: "phrase", code: phrase } ];
            }

            if (codetrain[curr].type === "CodeCave") {

                if (codetrain[curr-1].value === "if") {
                    phrase.pop();
                    Node = { type: "",
                            id: "__if"+codetrain[curr].line,
                            line: codetrain[curr].line,
                            condition: codetrain[curr].params, };

                    curr++;
                    Node.if_true = code2sentence(codetrain);

                    if (curr+1 < codetrain.length){
                        if ( codetrain[curr+1].type ===  "Keyword" && codetrain[curr+1].value ===  "else") {
                            curr+=2;
                            Node.if_false = code2sentence(codetrain);
                            Node.type= "if_else";
                        } else
                            Node.type = "if_endif";
                    } else
                        Node.type = "if_endif";

                    return [ Node ];
                }

                if (codetrain[curr-1].value === "while") {
                    phrase.pop();
                    Node = { type: "while",
                            id: "__loop"+codetrain[curr].line,
                            line: codetrain[curr].line,
                            condition: codetrain[curr].params, };

                    curr++;
                    latest_loop_id.push(Node.id);
                    Node.while_true = code2sentence(codetrain);
                    latest_loop_id.pop();

                    return [ Node ];
                }

                if (codetrain[curr-1].value === "for") {
                    phrase.pop();
                    Node = { type: "for",
                            id: "__loop"+codetrain[curr].line,
                            line: codetrain[curr].line, };

                    curr_prev = curr;
                    curr=0;
                    codetrain[curr_prev].params.push({ type: 'Terminator', value: ';', precedence: 11, line:  codetrain[curr].line });
                    Node.three_sentences =  code2sentenceS(codetrain[curr_prev].params);
                    curr = curr_prev;
                    if (Node.three_sentences.length != 3)
                        throw new SyntaxError("At line: " + codetrain[curr].line + ". Expected 3 sentences for 'for(;;){}' loop. Got '"+Node.three_sentences.length);
                    if (Node.three_sentences[0].type !== "phrase" || Node.three_sentences[1].type !== "phrase" || Node.three_sentences[2].type !== "phrase" )
                        throw new SyntaxError("At line: " + codetrain[curr].line + ". Sentences inside 'for(;;)' can not be other loops or conditionals");

                    curr++;
                    latest_loop_id.push(Node.id);
                    Node.while_true = code2sentence(codetrain);
                    latest_loop_id.pop();

                    return [ Node ];
                }
            }

            if (codetrain[curr].type === "Keyword") {

                if (codetrain[curr].value === "do") {

                    Node = { type: "do",
                            id: "__loop"+codetrain[curr].line,
                            line: codetrain[curr].line, };

                    curr++;
                    latest_loop_id.push(Node.id);
                    Node.while_true = code2sentence(codetrain);
                    latest_loop_id.pop();

                    curr++;
                    if (curr +2 >= codetrain.length)
                        throw new SyntaxError("At line: " + codetrain[curr].line + ". Incomplete do{}while(); sentence ");
                    if (codetrain[curr].type !== "Keyword")
                        throw new SyntaxError("At line: " + codetrain[curr].line + ". Wrong do{}while(); sentence ");
                    if (codetrain[curr].value !== "while")
                        throw new SyntaxError("At line: " + codetrain[curr].line + ". Wrong do{}while(); sentence ");

                    curr++;
                    if (codetrain[curr].type !== "CodeCave") {
                        throw new SyntaxError("At line: " + codetrain[curr].line + ". Wrong do{}while(); sentence ");
                    }
                    Node.condition = codetrain[curr].params;

                    curr++;
                    if (codetrain[curr].type !== "Terminator")
                        throw new SyntaxError("At line: " + codetrain[curr].line + ". Missing ';', found " + codetrain[curr].type);

                    return [ Node ];
                }

                if (codetrain[curr].value === "asm" || codetrain[curr].value === "label") {
                    return [ { type: "phrase", code: [codetrain[curr]] } ];
                }

                if (codetrain[curr].value === "break" || codetrain[curr].value === "continue") {
                    if (latest_loop_id.length==0)
                        throw new SyntaxError("At line: " + codetrain[curr].line + ". '" + codetrain[curr].value + "' outside a loop.");
                    codetrain[curr].id=latest_loop_id[latest_loop_id.length-1];
                }

                if (codetrain[curr].value === "else") {
                    throw new SyntaxError("At line: " + codetrain[curr].line + ". 'else' not associated with an 'if(){}else{}' sentence");
                }
            }

            phrase.push(codetrain[curr]);
            curr++;
        }

        if (phrase.length != 0)
            throw new SyntaxError("At line: " + codetrain[curr-1].line + ". Missing ';'. ");

        //Never reaches this point?
        throw new SyntaxError("At line: " + codetrain[curr-1].line + ". Strange error. ");
    }


    // Not recursive. Only top level declarations allowed.
    // This creates only global variables or function scope variables.
    function createVariablesTable(sntcs) {
        var table=[];
        var Token;

        function get_array_size(tkn) {
            if (tkn.length !== 1 || tkn[0].type !== "Constant") {
                throw new TypeError("At line: " + tkn.line + ". Wrong array declaration. Only constant size declarations allowed.");
            }
            if ( tkn[0].name === 'NumberDecimalStr')
                return parseInt(tkn[0].value,10);
            else if (tkn[0].name === 'NumberHexStr')
                return parseInt(tkn[0].value.replace("0x",""),16);
            else
                throw new TypeError("At line: " + phrs.code[2].line + ". Wrong array declaration.");
        }

        sntcs.forEach(function (phrs) {
            if (phrs.type !== "phrase")
                return;
            if (phrs.code.length<2)
                return;
            if (phrs.code[0].type === "Keyword") {

                if (   phrs.code[0].value === "return"
                    || phrs.code[0].value === "goto")
                    return;

                let idx = 1;
                let valid=true;
                while (idx < phrs.code.length) {
                    if ( phrs.code[idx].type === "Delimiter") {
                        idx++;
                        valid=true;
                        continue;
                    }

                    if ( valid === true && phrs.code[idx].value === "*" && idx+1 < phrs.code.length && phrs.code[idx+1].type === "Variable" ) {
                        idx++;
                    }

                    if (valid === true) {
                        Token = phrs.code[idx];
                        Token.declaration = phrs.code[0].value;
                        Token.dec_in_generator = "no";
                        Token.size = 1;
                        Token.dec_as_array="no";

                        if (idx+1<phrs.code.length) {
                            if (phrs.code[idx+1].type === "Arr") { //Array declaration
                                idx++;
                                Token.size = 1+get_array_size(phrs.code[idx].params);
                                Token.dec_as_array="yes";
                            }
                        }

                        table.push(Token);
                        valid = false;
                    }
                    idx++;
                }
            }
        });

        return table;
    }

    //Create table, it will be used for any real program
    function createAPItable(){
        return [
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Get_A1",
                "arguments": [],
                "asmName": "get_A1",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Get_A2",
                "arguments": [],
                "asmName": "get_A2",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Get_A3",
                "arguments": [],
                "asmName": "get_A3",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Get_A4",
                "arguments": [],
                "asmName": "get_A4",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Get_B1",
                "arguments": [],
                "asmName": "get_B1",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Get_B2",
                "arguments": [],
                "asmName": "get_B2",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Get_B3",
                "arguments": [],
                "asmName": "get_B3",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Get_B4",
                "arguments": [],
                "asmName": "get_B4",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Set_A1",
                "arguments": [
                    {
                        "type": "Variable",
                        "pointer": "no",
                        "precedence": 0,
                        "value": "addr",
                        "line": 9,
                        "declaration": "long"
                    }
                ],
                "asmName": "set_A1",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Set_A2",
                "arguments": [
                    {
                        "type": "Variable",
                        "pointer": "no",
                        "precedence": 0,
                        "value": "addr",
                        "line": 10,
                        "declaration": "long"
                    }
                ],
                "asmName": "set_A2",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Set_A3",
                "arguments": [
                    {
                        "type": "Variable",
                        "pointer": "no",
                        "precedence": 0,
                        "value": "addr",
                        "line": 11,
                        "declaration": "long"
                    }
                ],
                "asmName": "set_A3",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Set_A4",
                "arguments": [
                    {
                        "type": "Variable",
                        "pointer": "no",
                        "precedence": 0,
                        "value": "addr",
                        "line": 12,
                        "declaration": "long"
                    }
                ],
                "asmName": "set_A4",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Set_A1_A2",
                "arguments": [
                    {
                        "type": "Variable",
                        "pointer": "no",
                        "precedence": 0,
                        "value": "addr1",
                        "line": 13,
                        "declaration": "long"
                    },
                    {
                        "type": "Variable",
                        "pointer": "no",
                        "precedence": 0,
                        "value": "addr2",
                        "line": 13,
                        "declaration": "long"
                    }
                ],
                "asmName": "set_A1_A2",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Set_A3_A4",
                "arguments": [
                    {
                        "type": "Variable",
                        "pointer": "no",
                        "precedence": 0,
                        "value": "addr1",
                        "line": 14,
                        "declaration": "long"
                    },
                    {
                        "type": "Variable",
                        "pointer": "no",
                        "precedence": 0,
                        "value": "addr2",
                        "line": 14,
                        "declaration": "long"
                    }
                ],
                "asmName": "set_A3_A4",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Set_B1",
                "arguments": [
                    {
                        "type": "Variable",
                        "pointer": "no",
                        "precedence": 0,
                        "value": "addr",
                        "line": 15,
                        "declaration": "long"
                    }
                ],
                "asmName": "set_B1",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Set_B2",
                "arguments": [
                    {
                        "type": "Variable",
                        "pointer": "no",
                        "precedence": 0,
                        "value": "addr",
                        "line": 16,
                        "declaration": "long"
                    }
                ],
                "asmName": "set_B2",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Set_B3",
                "arguments": [
                    {
                        "type": "Variable",
                        "pointer": "no",
                        "precedence": 0,
                        "value": "addr",
                        "line": 17,
                        "declaration": "long"
                    }
                ],
                "asmName": "set_B3",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Set_B4",
                "arguments": [
                    {
                        "type": "Variable",
                        "pointer": "no",
                        "precedence": 0,
                        "value": "addr",
                        "line": 18,
                        "declaration": "long"
                    }
                ],
                "asmName": "set_B4",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Set_B1_B2",
                "arguments": [
                    {
                        "type": "Variable",
                        "pointer": "no",
                        "precedence": 0,
                        "value": "addr1",
                        "line": 19,
                        "declaration": "long"
                    },
                    {
                        "type": "Variable",
                        "pointer": "no",
                        "precedence": 0,
                        "value": "addr2",
                        "line": 19,
                        "declaration": "long"
                    }
                ],
                "asmName": "set_B1_B2",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Set_B3_B4",
                "arguments": [
                    {
                        "type": "Variable",
                        "pointer": "no",
                        "precedence": 0,
                        "value": "addr1",
                        "line": 20,
                        "declaration": "long"
                    },
                    {
                        "type": "Variable",
                        "pointer": "no",
                        "precedence": 0,
                        "value": "addr2",
                        "line": 20,
                        "declaration": "long"
                    }
                ],
                "asmName": "set_B3_B4",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Clear_A",
                "arguments": [],
                "asmName": "clear_A",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Clear_B",
                "arguments": [],
                "asmName": "clear_B",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Clear_A_And_B",
                "arguments": [],
                "asmName": "clear_A_B",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Copy_A_From_B",
                "arguments": [],
                "asmName": "copy_A_From_B",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Copy_B_From_A",
                "arguments": [],
                "asmName": "copy_B_From_A",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Check_A_Is_Zero",
                "arguments": [],
                "asmName": "check_A_Is_Zero",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Check_B_Is_Zero",
                "arguments": [],
                "asmName": "check_B_Is_Zero",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Check_A_Equals_B",
                "arguments": [],
                "asmName": "check_A_equals_B",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Swap_A_and_B",
                "arguments": [],
                "asmName": "swap_A_and_B",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "OR_A_with_B",
                "arguments": [],
                "asmName": "OR_A_with_B",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "OR_B_with_A",
                "arguments": [],
                "asmName": "OR_B_with_A",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "AND_A_with_B",
                "arguments": [],
                "asmName": "AND_A_with_B",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "AND_B_with_A",
                "arguments": [],
                "asmName": "AND_B_with_A",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "XOR_A_with_B",
                "arguments": [],
                "asmName": "XOR_A_with_B",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "XOR_B_with_A",
                "arguments": [],
                "asmName": "XOR_B_with_A",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Add_A_To_B",
                "arguments": [],
                "asmName": "add_A_to_B",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Add_B_To_A",
                "arguments": [],
                "asmName": "add_B_to_A",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Sub_A_From_B",
                "arguments": [],
                "asmName": "sub_A_from_B",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Sub_B_From_A",
                "arguments": [],
                "asmName": "sub_B_from_A",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Mul_A_By_B",
                "arguments": [],
                "asmName": "mul_A_by_B",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Mul_B_By_A",
                "arguments": [],
                "asmName": "mul_B_by_A",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Div_A_By_B",
                "arguments": [],
                "asmName": "div_A_by_B",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Div_B_By_A",
                "arguments": [],
                "asmName": "div_B_by_A",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "MD5_A_To_B",
                "arguments": [],
                "asmName": "MD5_A_to_B",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Check_MD5_A_With_B",
                "arguments": [],
                "asmName": "check_MD5_A_with_B",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "HASH160_A_To_B",
                "arguments": [],
                "asmName": "HASH160_A_to_B",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Check_HASH160_A_With_B",
                "arguments": [],
                "asmName": "check_HASH160_A_with_B",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "SHA256_A_To_B",
                "arguments": [],
                "asmName": "SHA256_A_to_B",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Check_SHA256_A_With_B",
                "arguments": [],
                "asmName": "check_SHA256_A_with_B",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Get_Block_Timestamp",
                "arguments": [],
                "asmName": "get_Block_Timestamp",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Get_Creation_Timestamp",
                "arguments": [],
                "asmName": "get_Creation_Timestamp",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Get_Last_Block_Timestamp",
                "arguments": [],
                "asmName": "get_Last_Block_Timestamp",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Put_Last_Block_Hash_In_A",
                "arguments": [],
                "asmName": "put_Last_Block_Hash_In_A",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "A_To_Tx_After_Timestamp",
                "arguments": [
                    {
                        "type": "Variable",
                        "pointer": "no",
                        "precedence": 0,
                        "value": "addr",
                        "line": 54,
                        "declaration": "long"
                    }
                ],
                "asmName": "A_to_Tx_after_Timestamp",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Get_Type_For_Tx_In_A",
                "arguments": [],
                "asmName": "get_Type_for_Tx_in_A",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Get_Amount_For_Tx_In_A",
                "arguments": [],
                "asmName": "get_Amount_for_Tx_in_A",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Get_Timestamp_For_Tx_In_A",
                "arguments": [],
                "asmName": "get_Timestamp_for_Tx_in_A",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Get_Random_Id_For_Tx_In_A",
                "arguments": [],
                "asmName": "get_Ticket_Id_for_Tx_in_A",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Message_From_Tx_In_A_To_B",
                "arguments": [],
                "asmName": "message_from_Tx_in_A_to_B",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "B_To_Address_Of_Tx_In_A",
                "arguments": [],
                "asmName": "B_to_Address_of_Tx_in_A",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "B_To_Address_Of_Creator",
                "arguments": [],
                "asmName": "B_to_Address_of_Creator",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Get_Current_Balance",
                "arguments": [],
                "asmName": "get_Current_Balance",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Get_Previous_Balance",
                "arguments": [],
                "asmName": "get_Previous_Balance",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Send_To_Address_In_B",
                "arguments": [
                    {
                        "type": "Variable",
                        "pointer": "no",
                        "precedence": 0,
                        "value": "addr",
                        "line": 64,
                        "declaration": "long"
                    }
                ],
                "asmName": "send_to_Address_in_B",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Send_All_To_Address_In_B",
                "arguments": [],
                "asmName": "send_All_to_Address_in_B",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Send_Old_To_Address_In_B",
                "arguments": [],
                "asmName": "send_Old_to_Address_in_B",
            },
            {
                "return_type": "void",
                "return_pointer": "no",
                "name": "Send_A_To_Address_In_B",
                "arguments": [],
                "asmName": "send_A_to_Address_in_B",
            },
            {
                "return_type": "long",
                "return_pointer": "no",
                "name": "Add_Minutes_To_Timestamp",
                "arguments": [
                    {
                        "type": "Variable",
                        "pointer": "no",
                        "precedence": 0,
                        "value": "addr2",
                        "line": 68,
                        "declaration": "long"
                    },
                    {
                        "type": "Variable",
                        "pointer": "no",
                        "precedence": 0,
                        "value": "addr3",
                        "line": 68,
                        "declaration": "long"
                    }
                ],
                "asmName": "add_Minutes_to_Timestamp",
            }
        ];
    }

    prepareBigAst();

    curr=0;
    Big_ast.Global.sentences = code2sentenceS(Big_ast.Global.code)
    delete Big_ast.Global.code;

    Big_ast.functions.forEach(function (func) {
        curr=0;
        func.sentences= code2sentenceS(func.code);
        delete func.code;
    });

    Big_ast.Global.declared_vars = createVariablesTable(Big_ast.Global.sentences);

    Big_ast.functions.forEach(function (func) {
        func.declared_vars= createVariablesTable(func.sentences);
    });

    //TODO:
    //  Check for doubles definitions (variables and functions)

    Big_ast.Global.APIFunctions = createAPItable();

    return Big_ast;
}


