 "use strict";

// Author: Rui Deleterium
// Project: https://github.com/deleterium/BurstAT-Compiler
// License: BSD 3-Clause License

// Arrange sentences into Globalsentences or in functions
// calls.

 function shapeProgram(sP_ast) {

    var Big_ast = { Global: {}, functions: [] , memory: [], labels: [], typesDefinitions: [], Config: {} };
    var curr=0;
    var latest_loop_id = [];

    // configurations for compiler
    Big_ast.Config = {
        compiler_version: "0",   //sets this compiler version!!!
        enableRandom:     false, //enable with #pragma enableRandom true
        enableLineLabels: false, //enable with #pragma enableLineLabels true
        globalOptimization: false, //enable with #pragma globalOptimization true
        maxAuxVars:       5,     //change with #pragma maxAuxVars N
        maxConstVars:     0,     //change with #pragma maxConstVars N
        reuseAssignedVar: true,  //disable with #pragma reuseAssignedVar false
        useVariableDeclaration: true, //change with #pragma useVariableDeclaration false
        version: "0",            //change with #pragma version 0
        warningToError:   true,  //change with #pragma warningToError false
        APIFunctions:     false, //enable with #include APIFunctions
        PName:            "",    //set with #program name
        PDescription:     "",    //set with #program description
        PActivationAmount: "",   //set with #program activationAmount

    };

    //main function for shapeProgram method, only run once.
    function shapeProgram_main() {

        prepareBigAst();

        curr=0;
        Big_ast.Global.sentences = code2sentenceS(Big_ast.Global.code)
        delete Big_ast.Global.code;

        Big_ast.functions.forEach(function (func) {
            curr=0;
            func.sentences= code2sentenceS(func.code);
            delete func.code;
        });

        // Macro handler
        Big_ast.Global.macros.forEach( processMacro );
        if (Big_ast.Config.version !== Big_ast.Config.compiler_version) {
            new TypeError("This compiler is version '"+Big_ast.Config.compiler_version+"'. File needs a compiler version '"+Big_ast.Config.version+"'.");
        }

        Big_ast.typesDefinitions = createDefaultTypesTable();

        addRegistersInMemory();

        addConstantsInMemory();

        createMemoryTable(Big_ast.Global.sentences, "", false);

        for (let i=0; i< Big_ast.functions.length; i++) {
            createMemoryTable(Big_ast.functions[i].arguments, Big_ast.functions[i].name, true);
            createMemoryTable(Big_ast.functions[i].sentences, Big_ast.functions[i].name, false);
        };

        if (Big_ast.Config.APIFunctions) {
            Big_ast.Global.APIFunctions = createAPItable();
        }

        checkDoublesDefinitions();

        consolidateMemory();

        shapeFunctionArgs();

        return Big_ast;
    }


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
                        // alteration here, do also in generator.js code 3Ewuinl
                        for (var i=0; i< tokens.length; i++) {
                            if (tokens[i].type === "Keyword" && tokens[i].value === "void" ) {
                                if ( i!=0 || tokens.length > 1 )
                                    throw new SyntaxError("At line: " + tokens[i].line + ". Invalid use of void in function definition" );
                                break;
                            }
                            if (i+1 >= tokens.length)
                                throw new SyntaxError("At line: " + tokens[i].line + ". Wrong function definition.");
                            if (tokens[i].type === "Keyword" && tokens[i].value !== "struct" && tokens[i+1].type === "Variable") {
                                let curr_prev=curr;
                                curr=0;
                                args=args.concat( code2sentence( [ tokens[i], tokens[i+1] , { type: 'Terminator', value: ';' } ] ) );
                                curr=curr_prev;
                                i++;
                                continue;
                            }
                            if ( i+2 < tokens.length && tokens[i].type === "Keyword" && tokens[i+1].value === "*" && tokens[i+2].type === "Variable") {
                                let curr_prev=curr;
                                curr=0;
                                args=args.concat( code2sentence( [ tokens[i], tokens[i+1], tokens[i+2], { type: 'Terminator', value: ';' } ] ) );
                                curr=curr_prev;
                                i+=2;
                                continue;
                            }
                            if ( i+3 < tokens.length && tokens[i].type === "Keyword" && tokens[i].value === "struct" && tokens[i+1].type === "Variable" && tokens[i+2].value === "*" && tokens[i+3].type === "Variable") {
                                let curr_prev=curr;
                                curr=0;
                                args=args.concat( code2sentence( [ tokens[i], tokens[i+1], tokens[i+2], tokens[i+3], { type: 'Terminator', value: ';' } ] ) );
                                curr=curr_prev;
                                i+=3;
                                continue;
                            }
                                if (tokens[i].type === "Delimiter")
                                continue;
                            throw new SyntaxError("At line: " + tokens[i].line + ". Token '"+tokens[i].type+ "' not allowed in function declaration");
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
        return { type: fields[0], property: fields[1], value: fields.slice(2).join(" "), line: Token.line }
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
                    if (phrase.length > 1) {
                        throw new SyntaxError("At line: " + phrase[0].line + ". Statement including 'if' in wrong way. Possible missing ';'.");
                    }
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
                    if (phrase.length > 1) {
                        throw new SyntaxError("At line: " + phrase[0].line + ". Statement including 'while' in wrong way. Possible missing ';'.");
                    }
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
                    if (phrase.length > 1) {
                        throw new SyntaxError("At line: " + phrase[0].line + ". Statement including 'for' in wrong way. Possible missing ';'.");
                    }
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
                        throw new SyntaxError("At line: " + codetrain[curr-1].line + ". Incomplete do{}while(); sentence ");
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

                if (codetrain[curr].value === "struct") {
                    if (curr + 2 >= codetrain.length)
                        throw new SyntaxError("At line: " + codetrain[curr].line + ". Missing arguments for 'struct' sentence.");
                    if (codetrain[curr+1].type !== "Variable")
                        throw new SyntaxError("At line: " + codetrain[curr].line + ". Missing 'name' for  'struct' sentence ");
                    if (codetrain[curr+2].type === "CodeDomain") {
                        curr+=2;
                        Node = { type: "struct",
                            line: codetrain[curr-2].line,
                            name: codetrain[curr-1].value,
                            members: code2sentence(codetrain),
                            Phrase: {type: "phrase", code: [] } };
                        Node.Phrase.code.push(codetrain[curr-2], codetrain[curr-1]);
                        curr++;
                        while (curr < codetrain.length) {
                            if (codetrain[curr].type === "Terminator") {
                                return [ Node ];
                            }
                            Node.Phrase.code.push(codetrain[curr]);
                            curr++;
                        }
                        throw new SyntaxError("At end of file. Wrong 'struct' declaration. Missing ';'");
                    }
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
    function createMemoryTable(sntcs, scope_name, set_dec_in_generator) {
        var table=[];
        var prefix = "";
        if (scope_name.length > 0) {
            prefix=scope_name+"_";
        }

        function get_array_size(tkn) {
            if (tkn.length !== 1 || tkn[0].type !== "Constant") {
                throw new TypeError("At line: " + tkn.line + ". Wrong array declaration. Only constant size declarations allowed.");
            }
            return parseInt(tkn[0].value,16);
        }

        function struct2typedefinition(stru_phrase){

            //create struct type definition
            let StructTypeD = { type_name: prefix+stru_phrase.name,
                type: "struct",
                struct_members: [],
                struct_size_acc: [] };

            let old_prefix = prefix;
            prefix = "";
            stru_phrase.members.forEach ( function (struphrs) {
                StructTypeD.struct_members = StructTypeD.struct_members.concat(phrase2memoryObject(struphrs,stru_phrase.name));
            });

            StructTypeD.Memory_template = {
                location: -1,
                name: "",
                type: "struct",
                type_name: StructTypeD.type_name,
                scope: scope_name,
                size: StructTypeD.struct_members.length,
                dec_in_generator: set_dec_in_generator,
                declaration: "struct",
            };

            let size_acc=0;
            StructTypeD.struct_members.forEach ( function (memb){
                StructTypeD.struct_size_acc.push([ memb.name, size_acc ]);
                if (memb.type!=="struct" || memb.declaration.indexOf("_ptr") !=-1) //Remeber to change here code yolj1A
                    size_acc++;
            });
            prefix = old_prefix;
            Big_ast.typesDefinitions.push(StructTypeD);
        }

        // takes a phrase and returns an array of Memory {}
        //   fills types definitions of necessary
        function phrase2memoryObject(phrs, structName){

            let Token;
            let Memory_template;
            let ret = [];
            let ispointer = false;
            if (structName === undefined) structName="";
            else structName+="_";

            if (phrs.type === undefined) {
                throw new TypeError("Unknow object type arrived at phrase2memoryObject.");
            }
            if (phrs.code.length == 0) { //empty statement
                return;
            }

            if (phrs.code[0].type === "Keyword" && phrs.code[0].value === "label" ) {
                //transform this label in a fake variable
                Big_ast.labels.push({
                    name: phrs.code[0].id,
                    type: phrs.code[0].value,
                    scope: scope_name  });
                return;
            }

            if (phrs.code.length<2)
                return;
            if (phrs.code[0].type === "Keyword") {

                let const_token;

                if (   phrs.code[0].value === "return"
                    || phrs.code[0].value === "goto")
                    return;

                if ( phrs.code[0].value === "const" ) {
                    //remove token so no influence in declarations
                    const_token = phrs.code.shift();
                }

                if (   phrs.code[0].value === "struct"){
                    if (phrs.code.length<3){
                        return;
                    }
                    let search = Big_ast.typesDefinitions.find(obj => obj.type_name == phrs.code[1].value && obj.type === phrs.code[0].value );
                    if (search === undefined && prefix.length > 0 ) {
                        search = Big_ast.typesDefinitions.find(obj => obj.type_name == prefix+phrs.code[1].value && obj.type === phrs.code[0].value );
                    }
                    if (search === undefined) {
                        throw new TypeError("At line: "+phrs.code[1].line+". Could not find type definition for 'struct' '"+phrs.code[1].value);
                    }

                    let idx = 2;
                    while (idx < phrs.code.length) {
                        let dimensions = [];
                        Memory_template = JSON.parse(JSON.stringify(search.Memory_template));

                        if ( phrs.code[idx].type === "Delimiter") {
                            idx++;
                            continue;
                        }
                        if ( phrs.code[idx].value === "*" && idx+1 < phrs.code.length && phrs.code[idx+1].type === "Variable" ) {
                            ispointer = true;
                            Memory_template.declaration+="_ptr";
                            idx++;
                        }
                        Memory_template.name = phrs.code[idx].value;
                        Memory_template.asm_name = prefix+phrs.code[idx].value;
                        Memory_template.scope = scope_name;
                        Memory_template.dec_in_generator=set_dec_in_generator;

                        if ( phrs.code[idx].type === "Variable") {
                            while (idx+1<phrs.code.length) {
                                if (phrs.code[idx+1].type === "Arr") { //Array declaration
                                    idx++;
                                    dimensions.push(get_array_size(phrs.code[idx].params));
                                } else {
                                    break;
                                }
                            }

                            if (dimensions.length>0){ //is array of structs
                                Memory_template.type="array";
                                Memory_template.type_name= Memory_template.asm_name;
                                Memory_template.asm_name = prefix+Memory_template.name;
                                Memory_template.arr_item_type=search.type;
                                Memory_template.arr_item_type_name=search.type_name;
                                Memory_template.declaration += "_ptr";
                                Memory_template.arr_total_size = 1+ dimensions.reduce(function (total, num) {
                                    return total * num; }, search.Memory_template.size);

                                ret.push(Memory_template);
                                for (let x=0, i=0 ; x < dimensions.length ; x++) {
                                    for (let y=0; y<dimensions[x]; y++) {
                                        ret=ret.concat(assignStructVariable(phrs.code[1].value,phrs.code[idx-dimensions.length].value+"_"+i, ispointer));
                                        i++;
                                    }
                                }

                                // create array type definition
                                if (dimensions.length > 0) {
                                    let TypeD = { type_name: prefix+phrs.code[idx-dimensions.length].value,
                                        type: "array",
                                        arr_dimensions: dimensions,
                                        arr_multiplier_dim: [] };
                                    let j = dimensions.length-1;
                                    let acc=search.Memory_template.size;
                                    do {
                                        TypeD.arr_multiplier_dim.unshift(acc);
                                        acc*=dimensions[j];
                                        j--;
                                    } while (j>=0);
                                    Big_ast.typesDefinitions.push(TypeD);
                                }

                            } else { //is not array of structs
                                if (ispointer) {
                                    ret=ret.concat(Memory_template);
                                } else {
                                    ret=ret.concat(assignStructVariable(phrs.code[1].value,phrs.code[idx].value, ispointer));
                                }
                            }
                            idx++;
                            continue;
                        }
                        if ( phrs.code[idx].type === "Terminator") {
                            break;
                        }
                        throw new TypeError("At line: "+phrs.code[idx].line+". Invalid element (type: '"+phrs.code[idx].type+"' value: '"+phrs.code[idx].value+"') found in struct definition!");
                    }
                    return ret;
                }

                if ( phrs.code[0].value === "long" ){
                    let idx = 1;
                    let valid=true;
                    while (idx < phrs.code.length) {
                        if ( phrs.code[idx].type === "Delimiter") {
                            idx++;
                            valid=true;
                            continue;
                        }

                        if ( valid === true && phrs.code[idx].value === "*" && idx+1 < phrs.code.length && phrs.code[idx+1].type === "Variable" ) {
                            ispointer = true;
                            idx++;
                        }

                        if (valid === true) {
                            let dimensions = [];

                            let search = Big_ast.typesDefinitions.find(obj => obj.type === phrs.code[0].value );
                            if (search === undefined) {
                                throw "não achei type definition";
                            }
                            Memory_template = JSON.parse(JSON.stringify(search.Memory_template));
                            Memory_template.name = phrs.code[idx].value;
                            Memory_template.asm_name = prefix+phrs.code[idx].value;
                            Memory_template.scope = scope_name;
                            if (ispointer) {
                                Memory_template.declaration += "_ptr";
                            }
                            Memory_template.dec_in_generator=set_dec_in_generator;

                            while (idx+1<phrs.code.length) {
                                if (phrs.code[idx+1].type === "Arr") { //Array declaration
                                    idx++;
                                    dimensions.push(get_array_size(phrs.code[idx].params));
                                } else {
                                    break;
                                }
                            }

                            // fill more information if it is an array
                            if (dimensions.length>0){
                                Memory_template.type="array";
                                Memory_template.type_name= Memory_template.asm_name;
                                Memory_template.arr_item_type=search.type;
                                Memory_template.declaration += "_ptr";
                                Memory_template.arr_total_size = 1+ dimensions.reduce(function (total, num) {
                                    return total * num; }, 1);
                            }

                            //Create item in memory_template
                            ret.push(Memory_template);

                            if (Memory_template.type==="array"){
                                //Create array items in memory_template
                                for (let i=1; i< Memory_template.arr_total_size; i++) {
                                    let Mem2 = JSON.parse(JSON.stringify(search.Memory_template));
                                    Mem2.name = Memory_template.name+"_"+(i-1),
                                    Mem2.asm_name = Memory_template.asm_name+"_"+(i-1),
                                    Mem2.scope = scope_name;
                                    ret.push(Mem2);
                                }

                                // create array type definition
                                if (Memory_template.arr_total_size > 1) {
                                    let TypeD = { type_name: structName+Memory_template.asm_name,
                                        type: "array",
                                        arr_dimensions: dimensions,
                                        arr_multiplier_dim: [] };
                                    let j = dimensions.length-1;
                                    let acc=1;
                                    do {
                                        TypeD.arr_multiplier_dim.unshift(acc);
                                        acc*=dimensions[j];
                                        j--;
                                    } while (j>=0);
                                    Big_ast.typesDefinitions.push(TypeD);
                                }
                            }
                            valid = false;
                            ispointer = false;
                        }
                        idx++;
                    }
                }

                if (const_token !== undefined) {
                    //give token back!
                    phrs.code.unshift(const_token);
                }
            }
            return ret;
        }

        function assignStructVariable(struc_name, variable_name, ispointer) {

            let search = Big_ast.typesDefinitions.find(obj => obj.type === "struct" && obj.type_name === struc_name);
            if (search === undefined && prefix.length > 0 ) {
                search = Big_ast.typesDefinitions.find(obj => obj.type === "struct" && obj.type_name === prefix+struc_name );
            }
            if (search === undefined) {
                throw new TypeError("Could not find type definition for 'struct' '"+struc_name);
            }

            let newmemory = [ JSON.parse(JSON.stringify(search.Memory_template)) ];
            if (!ispointer) {
                newmemory= newmemory.concat( JSON.parse(JSON.stringify(search.struct_members)) );
            }
            newmemory.forEach( function (Mem){
                if (Mem.name === "") {
                    Mem.name = variable_name;
                } else {
                    Mem.name = variable_name+"_"+Mem.name;
                }
                Mem.asm_name = prefix+Mem.name;
            });
            return newmemory;
        }

        // createMemoryTable() code
        sntcs.forEach( function (phrs) {
            let memory_template;
            if (phrs.type === "struct") {
                struct2typedefinition(phrs);
                memory_template = phrase2memoryObject(phrs.Phrase);
            } else if (phrs.type === "phrase") {
                memory_template = phrase2memoryObject(phrs);
            }

            if (memory_template !== undefined && memory_template.length > 0) {
                Big_ast.memory = Big_ast.memory.concat(memory_template);
            }

        });
        return ;
    }

    // read macros values and put them into Big_ast.Config object
    function processMacro( Token ) {

        function get_val(val){
            if (val === undefined || val === "") {
                return true;
            }
            if (val === "true" || val === "1") {
                return true;
            }
            if (val === "false" || val === "0") {
                return false;
            }
            return undefined;
        }

        if (Token.type === "pragma") {
            if (Token.property === "maxAuxVars") {
                if (Token.value !== undefined) {
                    var num = parseInt(Token.value);
                    if (num < 1 || num > 10) {
                        throw new RangeError("At line: "+Token.line+". Value out of permitted range 1..10.");
                    }
                    Big_ast.Config.maxAuxVars = num;
                    return;
                }
            }
            if (Token.property === "maxConstVars") {
                if (Token.value !== undefined) {
                    var num = parseInt(Token.value);
                    if (num < 0 || num > 10) {
                        throw new RangeError("At line: "+Token.line+". Value out of permitted range 0..10.");
                    }
                    Big_ast.Config.maxConstVars = num;
                    return;
                }
            }
            if (Token.property === "reuseAssignedVar") {
                Big_ast.Config.reuseAssignedVar = get_val(Token.value);
                if (Big_ast.Config.reuseAssignedVar !== undefined)
                    return;
            }
            if (Token.property === "enableRandom") {
                Big_ast.Config.enableRandom = get_val(Token.value);
                if (Big_ast.Config.enableRandom !== undefined)
                    return;
            }
            if (Token.property === "enableLineLabels") {
                Big_ast.Config.enableLineLabels = get_val(Token.value);
                if (Big_ast.Config.enableLineLabels !== undefined)
                    return;
            }
            if (Token.property === "globalOptimization") {
                Big_ast.Config.globalOptimization = get_val(Token.value);
                if (Big_ast.Config.globalOptimization !== undefined)
                    return;
            }
            if (Token.property === "useVariableDeclaration") {
                Big_ast.Config.useVariableDeclaration = get_val(Token.value);
                if (Big_ast.Config.useVariableDeclaration !== undefined)
                    return;
            }
            if (Token.property === "version") {
                Big_ast.Config.version = Token.value;
                if (Big_ast.Config.version !== undefined)
                    return;
            }
            if (Token.property === "warningToError") {
                Big_ast.Config.warningToError = get_val(Token.value);
                if (Big_ast.Config.warningToError !== undefined)
                    return;
            }
        }

        if (Token.type === "include") {
            if (Token.property === "APIFunctions") {
                Big_ast.Config.APIFunctions = get_val(Token.value);
                if (Big_ast.Config.APIFunctions !== undefined)
                    return;
            }
        }

        if (Token.type === "program") {
            var parts;
            if (Token.property === "name") {
                parts=/^[0-9a-zA-Z]{1,30}$/.exec(Token.value);
                if (parts === null) {
                    throw new TypeError("At line: "+Token.line+". Program name must contains only letters [a-z][A-Z][0-9], from 1 to 30 chars.");
                }
                Big_ast.Config.PName = Token.value;
                return;
            }
            if (Token.property === "description") {
                if (Token.value.length >= 1000) {
                    throw new TypeError("At line: "+Token.line+". Program description max lenght is 1000 chars. It is "+Token.value.length+" chars.");
                }
                Big_ast.Config.PDescription = Token.value;
                return;
            }
            if (Token.property === "activationAmount") {
                parts=/^[0-9]{1,20}$/.exec(Token.value);
                if (parts === null) {
                    throw new TypeError("At line: "+Token.line+". Program activation must be only numbers.");
                }
                Big_ast.Config.PActivationAmount = Token.value;
                return;
            }
        }

        throw new TypeError("At line: "+Token.line+". Unknow macro property and/or value: #"+Token.type+" "+Token.property+" "+Token.value);
    }

    function addRegistersInMemory(){
        if ( Big_ast.Config.useVariableDeclaration) {
            let search = Big_ast.typesDefinitions.find(obj => obj.type === "register");
            if (search === undefined){
                throw new TypeError("Not found type 'register' at types definitions.");
            }
            for (var i=0; i< Big_ast.Config.maxAuxVars; i++){
                let Memory_template = JSON.parse(JSON.stringify(search.Memory_template));
                Memory_template.name = "r"+i;
                Memory_template.asm_name = "r"+i;
                Big_ast.memory.push(Memory_template);
            }
        }
    }

    function addConstantsInMemory(){
        if ( Big_ast.Config.useVariableDeclaration) {
            let search = Big_ast.typesDefinitions.find(obj => obj.type === "register");
            if (search === undefined){
                throw new TypeError("Not found type 'register' at types definitions.");
            }
            for (var i=1; i<= Big_ast.Config.maxConstVars; i++){
                let Memory_template = JSON.parse(JSON.stringify(search.Memory_template));
                Memory_template.name = "n"+i;
                Memory_template.asm_name = "n"+i;
                Memory_template.hex_content = i.toString(16).padStart(16,"0");
                Big_ast.memory.push(Memory_template);
            }
        }
    }
    
    function checkDoublesDefinitions() {
        var i,j;
        if (Big_ast.Config.useVariableDeclaration === false) {
            return;
        }
        for ( i=0; i< Big_ast.memory.length -1 ; i++) {
            for (j=i+1; j< Big_ast.memory.length; j++) {
                if (Big_ast.memory[i].asm_name === Big_ast.memory[j].asm_name) {
                    throw new TypeError("Error: Variable '"+Big_ast.memory[i].name+"' was declared more than one time.");
                }
            }
        }
        for ( i=0; i< Big_ast.functions.length ; i++) {
            for (j=i+1; j< Big_ast.functions.length; j++) {
                if (Big_ast.functions[i].name == Big_ast.functions[j].name) {
                    throw new TypeError("Error: Function '"+Big_ast.functions[i].name+"' was declared more than one time.");
                }
            }
            if (Big_ast.Config.APIFunctions === true) {
                for (j=0; j< Big_ast.Global.APIFunctions.length; j++) {
                    if (   Big_ast.functions[i].name === Big_ast.Global.APIFunctions[j].name
                        || Big_ast.functions[i].name === Big_ast.Global.APIFunctions[j].asmName) {
                        throw new TypeError("Error: Function '"+Big_ast.functions[i].name+"' has same name of one API Functions.");
                    }
                }
            }
        }
        for ( i=0; i< Big_ast.labels.length -1 ; i++) {
            for (j=i+1; j< Big_ast.labels.length; j++) {
                if (Big_ast.labels[i].asm_name === Big_ast.labels[j].asm_name) {
                    throw new TypeError("Error: Label '"+Big_ast.labels[i].name+"' was declared more than one time.");
                }
            }
        }
    }

    //process function arguments and arrange them in form or MemObj.
    //This will make easier to check declaration types during function calls
    //  to avoid wrong types to be passed to function (causing their DEATH)
    //Shall be consistent with phrase2memoryObject() function
    function shapeFunctionArgs() {
        var fn;

        function getMemObj(var_name) {
            return Big_ast.memory.find(obj => obj.name == var_name && obj.scope === Big_ast.functions[fn].name );
        }

        function phrase2MemObj(phrs){

            if (phrs.type === undefined) {
                throw new TypeError("Unknow object type arrived at phrase2MemObj.");
            }
            if (phrs.code.length == 0) { //empty statement (void declaration)
                return;
            }
            if (phrs.code.length<2){
                throw new TypeError("At line: "+phrs.code[0].line+". Invalid statement in function declaration. Only 'struct' and 'long' allowed.");;
            }

            if (phrs.code[0].type === "Keyword") {

                if (   phrs.code[0].value === "struct"){
                    if (phrs.code.length == 4 ){
                        if ( phrs.code[2].value === "*" && phrs.code[3].type === "Variable" ) {
                            return getMemObj(phrs.code[3].value);
                        }
                        throw new TypeError("At line: "+phrs.code[0].line+". Only 'struct TYPE * name' allowed on function declaration.");
                    }
                    throw new TypeError("At line: "+phrs.code[0].line+". Only struct pointers allowed on function declaration");

                } else if ( phrs.code[0].value === "long" ){
                    if (phrs.code.length == 2 ){
                        return getMemObj(phrs.code[1].value);
                    } else if (phrs.code.length == 3 && phrs.code[1].value === "*"){
                        return getMemObj(phrs.code[2].value);
                    } else {
                        throw new TypeError("At line: "+phrs.code[0].line+". Only 'long name' or 'long * name' allowed on function declaration.");
                    }
                }
                throw new TypeError("At line: "+phrs.code[0].line+". Invalid keyword in function declaration. Only 'struct' and 'long' allowed.");
            }
            throw new TypeError("At line: "+phrs.code[0].line+". Invalid statement in function declaration. Only 'struct' and 'long' allowed.");
        }

        for (fn=0; fn< Big_ast.functions.length; fn++) {
            let ret = [];
            Big_ast.functions[fn].arguments.forEach(function (Phrase) {
                ret.push(phrase2MemObj(Phrase))
            });
            Big_ast.functions[fn].argsMemObj = ret;
            delete Big_ast.functions[fn].arguments;
        }
    }



    function consolidateMemory(){
        var var_counter=0;
        Big_ast.memory.forEach( function (thisvar){
            if (thisvar.type === "struct" && thisvar.declaration.indexOf("_ptr") == -1) {//Remeber to change here code yolj1A
                thisvar.hex_content=var_counter.toString(16).padStart(16,"0");
            } else if (thisvar.type === "array") {
                thisvar.location=var_counter;
                var_counter++;
                thisvar.hex_content=var_counter.toString(16).padStart(16,"0");
            } else {
                thisvar.location=var_counter;
                var_counter++;
            }
        });
    }

    function createDefaultTypesTable(){
        return [ {
            type: 'register',
            Memory_template: {
                location: -1,
                name: "",
                asm_name: "",
                type: "register",
                type_name: null,
                scope: "",
                declaration: "long",
                size: 1,
                dec_in_generator: true,
            }
        }, {
            type: 'long',
            Memory_template: {
                location: -1,
                name: "",
                asm_name: "",
                type: "long",
                type_name: null,
                scope: "",
                declaration: "long",
                size: 1,
                dec_in_generator: false,
            }
        } ];
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

    return shapeProgram_main();
}


