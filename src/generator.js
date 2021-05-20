"use strict";

// Author: Rui Deleterium
// Project: https://github.com/deleterium/BurstAT-Compiler
// License: BSD 3-Clause License


function bigastCompile(bc_Big_ast){

    // holds variables needed during compilation
    const bc_auxVars = {
        latest_loop_id: [],
        jump_id: 0,
        assemblyCode: "",
        current_function: -1,

        getNewJumpID: function () {
            if (bc_Big_ast.Config.enableRandom === true)
                return Math.random().toString(36).substr(2,5);

            this.jump_id++;
            return this.jump_id.toString(36);
        },

        getLatestLoopId: function () {
            //error check must be in code!
            return this.latest_loop_id[this.latest_loop_id.length-1];
        }
    };

    //main function for bigastCompile method, only run once.
    function bigastCompile_main(){


        // add variables declaration
        if ( bc_Big_ast.Config.useVariableDeclaration) {
            bc_Big_ast.memory.forEach( assemblerDeclarationGenerator );
        }

        // Add code for global sentences
        bc_auxVars.current_function = -1;
        bc_Big_ast.Global.sentences.forEach( compileSentence );

        // For every function:
        bc_auxVars.current_function = 0;
        while (bc_auxVars.current_function < bc_Big_ast.functions.length) {

            writeAsmLine(""); //blank line to be nice to debugger!

            functionHeaderGenerator();

            // add code for functions sentences.
            bc_Big_ast.functions[bc_auxVars.current_function].sentences.forEach( compileSentence );

            functionTailGenerator();

            bc_auxVars.current_function++;
        }

        //always end with FIN!
        if (bc_auxVars.assemblyCode.lastIndexOf("FIN")+4 != bc_auxVars.assemblyCode.length) {
            writeAsmLine("FIN");
        }

        //TODO Optimize code;

        return bc_auxVars.assemblyCode;
    }


    // Traverse the AST created by syntaxer and creates a stream of assembly
    //   instructions. Due to caracteristics of Burstcoin's AT language, I
    //   decided to make use of auxiliary variables as registers because it
    //   is more effective than handle user stack.
    // cg_jumpTarget must be set if the evaluation is part of conditionals or
    //   loops. It shall be the location where to jump if the evaluated 
    //   expression is false.
    function codeGenerator(cg_ast, cg_jumpTarget) {

        const auxVars = {

            tmpvars: [ ],
            status:  [ ],
            postOperations: "",
            funcArgs: [],
            declaring: "",
            pointer_codecave: false,
            left_side_of_assignment: false,

            isTemp: function(loc) {
                if (loc == -1) return false;
                let MemObj=getMemoryObjectByLocation(loc);
                var id=this.tmpvars.indexOf(MemObj.asm_name);
                if (id >=0 ) {
                    if (this.status[id]===true) {
                        return true;
                    }
                }
                return false;
            },

            getNewRegister: function() {
                var id=this.status.indexOf(false);
                if (id==-1)
                    throw new RangeError("No more registers available. Try to reduce nested operations or increase 'max_auxVars'");
                this.status[id]=true;
                return getMemoryObjectByName(this.tmpvars[id]);
            },

            freeRegister: function(loc) {
                if (loc === undefined || loc === -1) {
                    return;
                }
                let MemObj=getMemoryObjectByLocation(loc);
                var id=this.tmpvars.indexOf(MemObj.asm_name);
                if (id==-1) return;
                this.status[id]=false;
            },

            createTmpVarsTable: function () {
                for (let i=0; i<bc_Big_ast.Config.maxAuxVars; i++){
                    this.tmpvars.push("r"+i);
                    this.status.push(false);
                }
            },

            getPostOperations: function () {
                var ret = this.postOperations;
                this.postOperations = "";
                return ret;
            },
        };


        // main function for codeGenerator method. Runs only once.
        function codeGenerator_main(){
            auxVars.createTmpVarsTable();

            var code, jmpTrueTarget;

            if (cg_jumpTarget === undefined) {
                code=genCode(cg_ast, false, false, cg_jumpTarget, jmpTrueTarget);
                if (code.MemObj !== undefined && auxVars.isTemp(code.MemObj.location) && code.MemObj.type.indexOf("_ptr") == -1 ) {
                    var line;
                    if (cg_ast.line !== undefined) {
                        line = cg_ast.line;
                    } else if (cg_ast.Operation.line !== undefined) {
                        line = cg_ast.Operation.line;
                    }
                    if (bc_Big_ast.Config.warningToError) {
                        throw new TypeError("At line: "+line+". Warning: sentence returned a value that is not being used.");
                    }
                }
            } else {
                jmpTrueTarget= cg_jumpTarget.slice(0,cg_jumpTarget.lastIndexOf("_"))+"_start";
                code=genCode(cg_ast,  true, false, cg_jumpTarget, jmpTrueTarget);
            }

            code.instructionset+=auxVars.postOperations;
            if (cg_jumpTarget !== undefined)
                code.instructionset+=createInstruction({type: "Label"},jmpTrueTarget);

            //optimizations for jumps and labels
            if (code.instructionset.indexOf(":") >=0) {
                if (cg_ast.type !== undefined) {
                    if (cg_ast.type === "Keyword" && cg_ast.value === "label") {
                        return code.instructionset; //do not optimize!!!
                    }
                }
                //code.instructionset+="\n\n"+optimizeJumps(code.instructionset);
                code.instructionset=optimizeJumps(code.instructionset);
            }

            return code.instructionset;
        }

        function mulHexContents(param1, param2){
            let n1, n2;
            if (typeof (param1) === "number") {
                n1 = BigInt(param1);
            } else if (typeof (param1) === 'string') {
                n1 = BigInt("0x"+param1);
            } else throw new TypeError("wrong type in mulHexContents");

            if (typeof (param2) === "number") {
                n2 = BigInt(param2);
            } else if (typeof (param1) === 'string') {
                n2 = BigInt("0x"+param2);
            } else throw new TypeError("wrong type in mulHexContents");

            return (n1*n2).toString(16).padStart(16,"0").slice(-16);
        }
        function addHexContents(param1, param2){
            let n1, n2;
            if (typeof (param1) === "number") {
                n1 = BigInt(param1);
            } else if (typeof (param1) === 'string') {
                n1 = BigInt("0x"+param1);
            } else throw new TypeError("wrong type in addHexContents");

            if (typeof (param2) === "number") {
                n2 = BigInt(param2);
            } else if (typeof (param1) === 'string') {
                n2 = BigInt("0x"+param2);
            } else throw new TypeError("wrong type in addHexContents");

            return (n1+n2).toString(16).padStart(16,"0").slice(-16);
        }
        function createConstantMemObj(value){
            let param;
            if (typeof (value) === "number") {
                param = value.toString(16).padStart(16,"0").slice(-16);
            } else if (typeof (value) === 'string') {
                param = value.padStart(16,"0").slice(-16);
            } else if (typeof (value) === 'undefined') {
                param = "";
            } else throw new TypeError("wrong type in createConstantMemObj");

            return {
                location: -1,
                name: "",
                asm_name: "",
                type: "constant",
                type_name: null,
                scope: "",
                size: 1,
                declaration: "long",
                dec_in_generator: true,
                hex_content: param };
        }
        function genMulToken(line){
            if (line===undefined) line=-1;
            return { "type": "Operator", "precedence": 3, "value": "*", "line": line };
        }
        function genAddToken(line){
            if (line===undefined) line=-1;
            return { "type": "Operator", "precedence": 4, "value": "+", "line": line };
        }
        function genSubToken(line){
            if (line===undefined) line=-1;
            return { "type": "Operator", "precedence": 4, "value": "-", "line": line };
        }
        function genAssignmentToken(){
            return { "type": "Assignment", "precedence": 9, "name": "Set", "value": "=", "line": -1 };
        }
        function genIncToken(){
            return { "type": "SetUnaryOperator", "precedence": 2, "value": "++", "line": -1 };
        }
        function genDecToken(){
            return { "type": "SetUnaryOperator", "precedence": 2, "value": "--", "line": -1 };
        }
        // here the hardwork to compile expressions
        function genCode(objTree, logicalOp, gc_revLogic, gc_jumpFalse, gc_jumpTrue) {

            let LGenObj, RGenObj, CGenObj;
            let M_Obj;
            let instructionstrain="";

            if (objTree.Operation === undefined) { //end object

                if (isEmpty(objTree)) {
                    return { instructionset: "" };
                }

                if (logicalOp === true) {
                    if (objTree.type === "Constant" && objTree.name === "NumberDecimalStr") {
                        if (gc_revLogic === false)
                            if (objTree.value === "0")
                                return { instructionset: createInstruction({type: "Jump"}, gc_jumpFalse)};
                            else
                                return { instructionset: "" };
                        else
                            if (objTree.value !== "0")
                                return { instructionset: createInstruction({type: "Jump"}, gc_jumpTrue)};
                            else
                                return { instructionset: "" };
                    }
                    if (objTree.type === "Variable") {
                        return genCode(truthVerObj(objTree.value), false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                    }
                    throw new TypeError("At line: "+objTree.line+". Object type '"+objTree.type+" at logical operation... Do not know what to do.");
                } else {

                    if (objTree.type === 'Variable') {
                        M_Obj = getMemoryObjectByName(objTree.value, objTree.line, auxVars.declaring);
                        if (bc_Big_ast.Config.useVariableDeclaration === false) {
                            if (auxVars.pointer_codecave) {
                                M_Obj.type+="_ptr";
                            }
                        }
                        if (objTree.params !== undefined) {
                            let array_idx=-1;
                            for (let idx=0; idx < objTree.params.length; idx++){

                                if (objTree.param_type[idx] === "Member->") {
                                    let TypeD = bc_Big_ast.typesDefinitions.find( obj => obj.type==="struct" && obj.type_name===M_Obj.type_name );
                                    if (TypeD === undefined) {
                                        throw new TypeError("At line: "+objTree.line+". Array type definition not found...");
                                    }
                                    if (objTree.params[idx].type !== "Variable") {
                                        throw new TypeError("At line: "+objTree.line+". Can not use variables as struct members.");
                                    }
                                    if (M_Obj.declaration !== "struct_ptr") {
                                        throw new TypeError("At line: "+objTree.line+". Variable '"+M_Obj.name+"' not defined as struct pointer.");
                                    }
                                    let member_name = objTree.params[idx].value;
                                    let member_id = -1;
                                    for (let i=0; i< TypeD.struct_size_acc.length; i++) {
                                        if (TypeD.struct_size_acc[i][0] === member_name) {
                                            member_id = i;
                                            break;
                                        }
                                    }
                                    if (member_id == -1) {
                                        throw new TypeError("At line: "+objTree.line+". Member '"+member_name+"' not found on struct type definition.");
                                    }

                                    let TmpMemObj;
                                    if (M_Obj.offset_type === undefined) {
                                        TmpMemObj = auxVars.getNewRegister();

                                        let adder=0;
                                        if (TypeD.struct_members[member_id].type === "array") {
                                            adder = 1;
                                        }
                                        instructionstrain += createInstruction(genAssignmentToken(),
                                                             getMemoryObjectByLocation(TmpMemObj.location, objTree.line),
                                                             createConstantMemObj( addHexContents(adder, TypeD.struct_size_acc[member_id][1]) ));
                                        M_Obj.declaration=TypeD.struct_members[member_id].declaration;
                                        M_Obj.name=TypeD.struct_members[member_id].name;
                                        M_Obj.type_name=TypeD.struct_members[member_id].type_name;
                                        if (TypeD.struct_members[member_id].type === "array"){
                                            M_Obj.type=TypeD.struct_members[member_id].type;
                                        }
                                        array_idx=-1;
                                        M_Obj.offset_type = "variable";
                                        M_Obj.offset_value = TmpMemObj.location;

                                    } else if (M_Obj.offset_type === "constant") {
                                        throw new TypeError("Inspection needed.");

                                    } else /* if (M_Obj.offset_type === "variable")*/ {
                                        throw new TypeError("Inspection needed.");
                                    }
                                }

                                if (objTree.param_type[idx] === "Member.") {
                                    let TypeD;
                                    if (M_Obj.arr_item_type === "struct") { // array of struct
                                        TypeD = bc_Big_ast.typesDefinitions.find( obj => obj.type==="struct" && obj.type_name===M_Obj.arr_item_type_name );
                                    } else { //regular case
                                        TypeD = bc_Big_ast.typesDefinitions.find( obj => obj.type==="struct" && obj.type_name===M_Obj.type_name );
                                    }
                                    if (TypeD === undefined) {
                                        throw new TypeError("At line: "+objTree.line+". Array type definition not found...");
                                    }
                                    if (objTree.params[idx].type !== "Variable") {
                                        throw new TypeError("At line: "+objTree.line+". Can not use variables as struct members.");
                                    }
                                    if (M_Obj.declaration === "struct_ptr") {
                                        throw new TypeError("At line: "+objTree.line+". Using wrong member notation. Try to use '->' instead.");
                                    }
                                    let member_name = objTree.params[idx].value;
                                    let member_id = -1;
                                    for (let i=0; i< TypeD.struct_size_acc.length; i++) {
                                        if (TypeD.struct_size_acc[i][0] === member_name) {
                                            member_id = i;
                                            break;
                                        }
                                    }
                                    if (member_id == -1) {
                                        throw new TypeError("At line: "+objTree.line+". Member '"+member_name+"' not found on struct type definition.");
                                    }

                                    if (M_Obj.offset_type === undefined) {
                                        M_Obj = getMemoryObjectByLocation(addHexContents(M_Obj.hex_content, TypeD.struct_size_acc[member_id][1] ));
                                        array_idx=-1;

                                    } else if (M_Obj.offset_type === "constant") {
                                        let adder = addHexContents(M_Obj.offset_value, M_Obj.hex_content);
                                        M_Obj = getMemoryObjectByLocation(addHexContents(adder, TypeD.struct_size_acc[member_id][1] ));
                                        array_idx=-1;

                                    } else /* if (M_Obj.offset_type === "variable")*/ {
                                        let adder=0;
                                        if (TypeD.struct_members[member_id].type === "array") {
                                            adder = 1;
                                        }
                                        instructionstrain += createInstruction(genAddToken(objTree.line),
                                                             getMemoryObjectByLocation(M_Obj.offset_value, objTree.line),
                                                             createConstantMemObj( addHexContents(adder, TypeD.struct_size_acc[member_id][1]) ));
                                        M_Obj.declaration=TypeD.struct_members[member_id].declaration;
                                        M_Obj.name=TypeD.struct_members[member_id].name;
                                        M_Obj.type_name=TypeD.struct_members[member_id].type_name;
                                        array_idx=-1;
                                    }
                                }

                                if (objTree.param_type[idx] === "Arr") {
                                    array_idx++;
                                    let TmpMemObj;
                                    let TypeD; // = bc_Big_ast.typesDefinitions.find( obj => obj.type==="array" && obj.type_name===objTree.value );
                                    if (M_Obj.type_name === undefined) {//array of structs
                                        TypeD = bc_Big_ast.typesDefinitions.find( obj => obj.type==="array" && obj.type_name===M_Obj.name );
                                    } else if (objTree.value === M_Obj.type_name) { //array simple
                                        TypeD = bc_Big_ast.typesDefinitions.find( obj => obj.type==="array" && obj.type_name===M_Obj.type_name );
                                    } else { // array inside struct
                                        TypeD = bc_Big_ast.typesDefinitions.find( obj => obj.type==="array" && obj.type_name.indexOf("_"+M_Obj.type_name) > 0 );
                                    }
                                    if (TypeD === undefined) {
                                        throw new TypeError("At line: "+objTree.line+". Array type definition not found. Is '"+M_Obj.name+"' declared as array?");
                                    }
                                    if (M_Obj.type !== "array" && M_Obj.type !== "struct" && M_Obj.offset_type !== undefined){
                                        throw new TypeError("At line: "+objTree.line+". Can not use array notation on regular variables.");
                                    }
                                    let Param_Obj = genCode(objTree.params[idx], false, false); // gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                                    instructionstrain+=Param_Obj.instructionset;

                                    //big decision tree depending on M_Obj.offset_value and Param_Obj.location
                                    let mobj_offvalue = M_Obj.offset_value; // undefined if does not exist, "constant", or variable location that can be temp or not (will be checked!)
                                    if (typeof(M_Obj.offset_value) === "string") {
                                        mobj_offvalue = -1; //only if offset_type is constant 
                                    }
                                    let param_loc = Param_Obj.MemObj.location; //-1 if it is constant, other value represents a variable that can be temp or not (will be checked!)

                                    if (bc_Big_ast.Config.useVariableDeclaration) { //used checking types for operations/assignment
                                        if (M_Obj.declaration.indexOf("_ptr") > 0) {
                                            M_Obj.declaration = M_Obj.declaration.slice(0,-4);
                                        }
                                    }

                                    if (mobj_offvalue === undefined) {
                                        if (param_loc == -1 ) {
                                            M_Obj.offset_type = "constant";
                                            M_Obj.offset_value = mulHexContents(Param_Obj.MemObj.hex_content, TypeD.arr_multiplier_dim[array_idx]);

                                        } else if (auxVars.isTemp(param_loc)) {
                                            instructionstrain += createInstruction(genMulToken(objTree.line), Param_Obj.MemObj, createConstantMemObj(TypeD.arr_multiplier_dim[array_idx]));
                                            M_Obj.offset_type = "variable";
                                            M_Obj.offset_value = Param_Obj.MemObj.location;

                                        } else /* if ( param_loc is variable ) */ {
                                            M_Obj.offset_type = "variable";
                                            if (TypeD.arr_multiplier_dim[array_idx] == 1) {
                                                M_Obj.offset_value = Param_Obj.MemObj.location;
                                            } else {
                                                TmpMemObj = auxVars.getNewRegister();
                                                instructionstrain += createInstruction(genAssignmentToken(), TmpMemObj, Param_Obj.MemObj);
                                                M_Obj.offset_value = TmpMemObj.location;
                                                instructionstrain += createInstruction(genMulToken(objTree.line), TmpMemObj, createConstantMemObj(TypeD.arr_multiplier_dim[array_idx]));
                                            }
                                        }

                                    } else if (mobj_offvalue === -1 ) {
                                        if (param_loc == -1) {
                                            M_Obj.offset_value = addHexContents(M_Obj.offset_value, mulHexContents(Param_Obj.MemObj.hex_content, TypeD.arr_multiplier_dim[array_idx]));

                                        } else if (auxVars.isTemp(param_loc)) {
                                            instructionstrain += createInstruction(genMulToken(objTree.line), Param_Obj.MemObj, createConstantMemObj(TypeD.arr_multiplier_dim[array_idx]));
                                            instructionstrain += createInstruction(genAddToken(objTree.line), Param_Obj.MemObj, createConstantMemObj(M_Obj.offset_value));
                                            M_Obj.offset_type = "variable";
                                            M_Obj.offset_value = Param_Obj.MemObj.location;

                                        } else /* if ( param_loc is variable  ) */ {
                                            if (TypeD.arr_multiplier_dim[array_idx] == 1 && M_Obj.offset_value === "0000000000000000") {
                                                M_Obj.offset_type = "variable";
                                                M_Obj.offset_value = Param_Obj.MemObj.location;
                                            } else {
                                                TmpMemObj = auxVars.getNewRegister();
                                                instructionstrain += createInstruction(genAssignmentToken(), TmpMemObj, Param_Obj.MemObj);
                                                instructionstrain += createInstruction(genMulToken(objTree.line), TmpMemObj, createConstantMemObj(TypeD.arr_multiplier_dim[array_idx]));
                                                instructionstrain += createInstruction(genAddToken(objTree.line), TmpMemObj, createConstantMemObj(M_Obj.offset_value));
                                                M_Obj.offset_type = "variable";
                                                M_Obj.offset_value = TmpMemObj.location;
                                            }
                                        }

                                    } else if (auxVars.isTemp(mobj_offvalue)) {
                                        if (param_loc == -1 ) {
                                            let adder = mulHexContents(Param_Obj.MemObj.hex_content, TypeD.arr_multiplier_dim[array_idx]);
                                            instructionstrain += createInstruction(genAddToken(objTree.line), getMemoryObjectByLocation(M_Obj.offset_value, objTree.line), createConstantMemObj(  adder  ));

                                        } else if (auxVars.isTemp(param_loc)) {
                                            instructionstrain+=createInstruction(genMulToken(objTree.line), Param_Obj.MemObj, createConstantMemObj(TypeD.arr_multiplier_dim[array_idx]));
                                            instructionstrain+=createInstruction(genAddToken(objTree.line), getMemoryObjectByLocation(M_Obj.offset_value, objTree.line), Param_Obj.MemObj);
                                            auxVars.freeRegister(Param_Obj.MemObj.location);

                                        } else /* if (param_loc is variable ) */ {
                                            if (TypeD.arr_multiplier_dim[array_idx] == 1) {
                                                instructionstrain+=createInstruction(genAddToken(objTree.line), getMemoryObjectByLocation(M_Obj.offset_value, objTree.line), Param_Obj.MemObj);
                                            } else {
                                                TmpMemObj = auxVars.getNewRegister();
                                                instructionstrain+=createInstruction(genAssignmentToken(), TmpMemObj, Param_Obj.MemObj);
                                                instructionstrain+=createInstruction(genMulToken(objTree.line), TmpMemObj, createConstantMemObj(TypeD.arr_multiplier_dim[array_idx]));
                                                instructionstrain+=createInstruction(genAddToken(objTree.line), getMemoryObjectByLocation(M_Obj.offset_value, objTree.line), TmpMemObj);
                                                auxVars.freeRegister(TmpMemObj.location);
                                            }
                                        }

                                    } else /* if ( mobj_offvalue is variable ) */ {
                                        if (param_loc == -1 ) {
                                            if (Param_Obj.MemObj.hex_content !== "0000000000000000") {
                                                TmpMemObj = auxVars.getNewRegister();
                                                instructionstrain+=createInstruction(genAssignmentToken(), TmpMemObj,  createConstantMemObj(Param_Obj.MemObj.hex_content));
                                                instructionstrain+=createInstruction(genMulToken(objTree.line), TmpMemObj, createConstantMemObj(TypeD.arr_multiplier_dim[array_idx]));
                                                instructionstrain+=createInstruction(genAddToken(objTree.line), TmpMemObj, getMemoryObjectByLocation(M_Obj.offset_value, objTree.line));
                                                M_Obj.offset_value= TmpMemObj.location;
                                            }

                                        } else if (auxVars.isTemp(param_loc)) {
                                            instructionstrain+=createInstruction(genMulToken(objTree.line), Param_Obj.MemObj, createConstantMemObj(TypeD.arr_multiplier_dim[array_idx]));
                                            instructionstrain+=createInstruction(genAddToken(objTree.line), Param_Obj.MemObj, getMemoryObjectByLocation(M_Obj.offset_value, objTree.line));
                                            M_Obj.offset_value = Param_Obj.MemObj.location;

                                        } else /* if (param_loc is variable )) */ {
                                            TmpMemObj = auxVars.getNewRegister();
                                            instructionstrain+=createInstruction(genAssignmentToken(), TmpMemObj, Param_Obj.MemObj);
                                            instructionstrain+=createInstruction(genMulToken(objTree.line), TmpMemObj, createConstantMemObj(TypeD.arr_multiplier_dim[array_idx]));
                                            instructionstrain+=createInstruction(genAddToken(objTree.line), TmpMemObj, getMemoryObjectByLocation(M_Obj.offset_value, objTree.line));
                                            M_Obj.offset_value = TmpMemObj.location;
                                        }
                                    }
                                }
                            }
                        }

                        return {MemObj: M_Obj, instructionset: instructionstrain }
                    }

                    if (objTree.type === 'Keyword'){

                        if (objTree.value === 'break' || objTree.value === 'continue'
                            || objTree.value === 'label' || objTree.value === 'asm'
                            || objTree.value === 'exit' || objTree.value === 'halt') {
                            return { instructionset: createInstruction( objTree ) };
                        }

                        if (objTree.value === 'return') { // this is 'return;'
                            if (bc_auxVars.current_function == -1 ) {
                                throw new TypeError("At line: "+objTree.line+". Can not use 'return' in global statements.");
                            }
                            if (bc_Big_ast.functions[bc_auxVars.current_function].return_type !== 'void') {
                                throw new TypeError("At line: "+objTree.line+". Function '"
                                       +bc_Big_ast.functions[bc_auxVars.current_function].name+"' must return a '"
                                       +bc_Big_ast.functions[bc_auxVars.current_function].return_type+"' value.");
                            }
                            if (bc_Big_ast.functions[bc_auxVars.current_function].name === 'main') {
                                return { instructionset: createInstruction( { type: 'Keyword', value: 'exit' } ) };
                            }
                            return { instructionset: createInstruction( objTree ) };
                        }

                        if (objTree.value === 'sleep' || objTree.value === 'goto') {
                            throw new TypeError("At line: "+objTree.line+". Missing argument for keyword '"+objTree.value+"'.");
                        }
                        throw new TypeError("At line: "+objTree.line+". Keywords '"+objTree.value+"' not implemented.");
                    }

                    if (objTree.type === 'Constant') { //ok
                        M_Obj = createConstantMemObj();
                        M_Obj.size = objTree.value.length/16;
                        M_Obj.hex_content = objTree.value;
                        if (auxVars.pointer_codecave===true) {
                            M_Obj.type+="_ptr";
                        }
                        return { MemObj: M_Obj, instructionset: "" } ;
                    }
                    throw new TypeError("At line:"+objTree.line+". End object not implemented: "+objTree.type+" "+objTree.name);
                    //return { instructionset: "" };
                }

            } else { //operation object

                let TmpMemObj;
                let tempvar, makeJump;
                let isAPI=false;

                if (objTree.Operation.type === 'FunctionCall') {

                    let APIargs=[];

                    let search = bc_Big_ast.functions.find(val => val.name === objTree.Left.value );
                    if (search === undefined) {
                        if (bc_Big_ast.Config.APIFunctions){
                            search = bc_Big_ast.Global.APIFunctions.find(val => val.name === objTree.Left.value );
                            if (search === undefined) {
                                throw new TypeError("At line: "+objTree.Left.line+". Function '"+objTree.Left.value+"' not declared.");
                            }
                            isAPI = true;
                        } else {
                            throw new TypeError("At line: "+objTree.Left.line+". Function '"+objTree.Left.value+"' not declared.");
                        }
                    }
                    if ( ! isAPI) {
                        if (bc_auxVars.current_function >=0 && search.name === bc_Big_ast.functions[bc_auxVars.current_function].name) {
                            throw new TypeError("At line: "+objTree.Left.line+". Recursive functions not allowed.");
                        }
                    }

                    if (isAPI){
                        if (search.return_type === "void") {
                            tempvar = "";
                        } else {
                            tempvar=auxVars.getNewTemp(); //reserve tempvar for return type
                        }
                    }

                    if ( !isEmpty(objTree.Right)) {
                        let sub_sentences = splitSubSentences(objTree.Right);

                        if (sub_sentences.length != search.arguments.length){
                            throw new TypeError("At line: "+objTree.Left.line+". Wrong number of arguments for function '"+search.name+"'. It must have '"+search.arguments.length+"' args.");
                        }

                        if (isAPI){
                            sub_sentences.forEach( function (stnc) {
                                right=genCode(stnc, false, false );
                                instructionstrain+=right.instructionset;
                                APIargs.push( right.varname );
                            });
                        } else {
                            sub_sentences.forEach( function (stnc) {
                                right=genCode(stnc, false, false );
                                instructionstrain+=right.instructionset;
                                instructionstrain+=createInstruction( {type: "Push"} , right.varname );
                                auxVars.freeVar(right.varname);
                            });
                        }
                    } else {
                        if (search.arguments.length != 0 ){
                            throw new TypeError("At line: "+objTree.Left.line+". Wrong number of arguments for function '"+search.name+"'. It must have '"+search.arguments.length+"' args.");
                        }

                    }

                    if (isAPI){
                        instructionstrain+=createInstruction( {type: "APICall", value: search.asmName}, tempvar, APIargs);
                        APIargs.forEach(varnm => auxVars.freeVar(varnm));
                    } else {
                        instructionstrain+=createInstruction( objTree.Operation, objTree.Left.value );
                    }

                    if (search.return_type === "void") {
                        return { instructionset: instructionstrain } ;
                    }

                    if ( ! isAPI ) {
                        tempvar=auxVars.getNewTemp();
                        instructionstrain+=createInstruction( { type: "Pop"}, tempvar );
                    }

                    if (logicalOp === true) { //maybe logical operation was requested
                        makeJump=genCode(truthVerObj(tempvar), true, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        instructionstrain+=makeJump.instructionset;
                        auxVars.freeVar(tempvar);
                        return { instructionset: instructionstrain };
                    }

                    return { varname: tempvar, instructionset: instructionstrain } ;
                }

                if (objTree.Operation.type === 'UnaryOperator') {

                    if (objTree.Operation.value === "!") { //logical NOT

                        if (logicalOp === true) {
                            return genCode(objTree.Center, true, !gc_revLogic, gc_jumpTrue, gc_jumpFalse);

                        } else {

                            let IDNotSF, IDNotST, IDEnd, rnd;

                            rnd=bc_auxVars.getNewJumpID();

                            IDNotSF = "__NOT_"+rnd+"_sF";//set false
                            IDNotST = "__NOT_"+rnd+"_sT";//set true
                            IDEnd   = "__NOT_"+rnd+"_end";

                            center=genCode(objTree.Center, true, !gc_revLogic, IDNotST, IDNotSF);
                            instructionstrain+=center.instructionset;

                            if (auxVars.isTemp(center.varname)) { //maybe it was an arithmetic operation
                                makeJump=genCode(truthVerObj(center.varname), false, !gc_revLogic, IDNotST, IDNotSF);
                                instructionstrain+=makeJump.instructionset;
                            }

                            tempvar=auxVars.getNewTemp();
                            instructionstrain += createInstruction({type: "Label"},IDNotST);
                            instructionstrain += createInstruction({type: "Assignment"},tempvar,"#0000000000000001");
                            instructionstrain += createInstruction({type: "Jump"}, IDEnd);
                            instructionstrain += createInstruction({type: "Label"},IDNotSF);
                            instructionstrain += createInstruction({type: "Assignment"},tempvar,"#0000000000000000");
                            instructionstrain += createInstruction({type: "Label"}, IDEnd);

                            auxVars.freeVar(center.varname);
                            return { varname: tempvar, instructionset: instructionstrain };
                        }
                    }

                    // Other Unary Objects, not logic.

                    if (objTree.Operation.value === "+") { //unary plus -> do nothing
                        return genCode(objTree.Center, logicalOp, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                    }

                    if (objTree.Operation.value === "*") { //unary star -> pointer operation

                        if (auxVars.declaring.length != 0) {
                            // do not do any other operation when declaring a pointer.
                            return genCode(objTree.Center, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        }

                        CGenObj=genCode(objTree.Center, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        instructionstrain+=CGenObj.instructionset;
        
                        /* TODO */
                        if (logicalOp === true) { //maybe logical operation was requested
                            makeJump=genCode(truthVerObj(center.varname+"$"), true, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                            instructionstrain+=makeJump.instructionset;
                            auxVars.freeVar(center.varname);
                            return { instructionset: instructionstrain };
                        }

                        if (bc_Big_ast.Config.useVariableDeclaration){
                            if (CGenObj.MemObj.declaration.lastIndexOf("_ptr") != CGenObj.MemObj.declaration.length - 4) {
                                if ( !auxVars.isTemp(CGenObj.MemObj.location) ) { // do not care about temp variables
                                    if (bc_Big_ast.Config.warningToError) {
                                        throw new TypeError("At line: "+objTree.Operation.line+". Trying to read content of Variable '"+objTree.Center.value+"' that is not declared as pointer.");
                                    }
                                }
                            } else {
                                CGenObj.MemObj.declaration = CGenObj.MemObj.declaration.slice(0,-4);
                            }
                        }
                        CGenObj.MemObj.type  += "_ptr";

                        if ( !auxVars.left_side_of_assignment) {
                            let TmpMemObj = auxVars.getNewRegister();
                            instructionstrain += createInstruction(genAssignmentToken(), TmpMemObj, CGenObj.MemObj);
                            auxVars.freeRegister(CGenObj.MemObj.location);
                            return { MemObj: TmpMemObj, instructionset: instructionstrain };
                        } else {
                            return { MemObj: CGenObj.MemObj, instructionset: instructionstrain };
                        }
                    }

                    CGenObj=genCode(objTree.Center, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                    instructionstrain+=CGenObj.instructionset;

                    if (objTree.Operation.value === "-") {
                        TmpMemObj=auxVars.getNewRegister();
                        instructionstrain+=createInstruction(genAssignmentToken(), TmpMemObj, createConstantMemObj(0));
                        instructionstrain+=createInstruction(genSubToken(objTree.line), TmpMemObj, CGenObj.MemObj);
                        auxVars.freeRegister(CGenObj.MemObj.location)

                        // TODO
                        if (logicalOp === true) {
                            makeJump=genCode(truthVerObj(tempvar), true, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                            instructionstrain+=makeJump.instructionset;
                            auxVars.freeVar(tempvar);
                            return { instructionset: instructionstrain };
                        }

                        return { MemObj: TmpMemObj, instructionset: instructionstrain } ;
                    }

                    if (objTree.Operation.value === "~") {
                        let clear_var=false;

                        if (!auxVars.isTemp(CGenObj.MemObj.location)){
                            TmpMemObj=auxVars.getNewRegister();
                            instructionstrain+=createInstruction(genAssignmentToken(),TmpMemObj,CGenObj.MemObj);
                            clear_var = true;
                        } else {
                            TmpMemObj=CGenObj.MemObj;
                        }
                        instructionstrain+= createInstruction(objTree.Operation, TmpMemObj);

                        //TODO
                        if (logicalOp === true) {
                            makeJump=genCode(truthVerObj(tempvar), true, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                            instructionstrain+=makeJump.instructionset;
                            auxVars.freeVar(center.varname);
                            auxVars.freeVar(tempvar);
                            return { instructionset: instructionstrain };
                        }

                        if (clear_var){
                            auxVars.freeRegister(CGenObj.MemObj.location);
                        }

                        return { MemObj: TmpMemObj, instructionset: instructionstrain } ;
                    }

                    if (objTree.Operation.value === "&") {
                        if (CGenObj.MemObj === undefined) {
                            throw new TypeError("At line: "+objTree.Operation.line+". Trying to get address of void value");
                        }
                        if (CGenObj.MemObj.type === "register" || CGenObj.MemObj.type === "register_ptr") {
                            if (bc_Big_ast.Config.warningToError) {
                                throw new TypeError("WARNING: At line: "+objTree.Operation.line+". Returning address of a register");
                            }
                        }
                        if (CGenObj.MemObj.type === "constant") {
                            throw new TypeError("At line: "+objTree.Operation.line+". Trying to get address of a constant value");
                        }
                        let TmpMemObj;
                        if (CGenObj.MemObj.type === "array") {
                            if (CGenObj.MemObj.offset_type !== undefined ) {
                                if (CGenObj.MemObj.offset_type === "constant") {
                                    TmpMemObj = createConstantMemObj( addHexContents(CGenObj.MemObj.hex_content, CGenObj.MemObj.offset_value) );
                                } else {
                                    throw new TypeError("At line: "+objTree.Operation.line+". Compiler can not resolve address of an variable location.");
                                }
                            } else {
                                TmpMemObj = createConstantMemObj(CGenObj.MemObj.location);
                            }
                        } else if (CGenObj.MemObj.type === "struct") {
                            TmpMemObj = createConstantMemObj(CGenObj.MemObj.hex_content);
                        } else if (CGenObj.MemObj.type === "long" || CGenObj.MemObj.type === "long_ptr" || CGenObj.MemObj.type === "struct_ptr" ) {
                            TmpMemObj = createConstantMemObj(CGenObj.MemObj.location);
                        }
                        if (bc_Big_ast.Config.useVariableDeclaration){
                            TmpMemObj.declaration += "_ptr";
                        }
                        return { MemObj: TmpMemObj, instructionset: instructionstrain } ;
                    }

                    throw new TypeError("At line: "+objTree.Operation.line+". Unknow unary operator: "+objTree.Operation.value);
                }

                if (objTree.Operation.type === 'SetUnaryOperator') {

                    if (cg_jumpTarget !== undefined)
                        throw new SyntaxError("At line: "+objTree.Operation.line+". Can not use SetUnaryOperator (++ or --) during logical operations with branches");
                    if (gc_jumpFalse !== undefined)
                        throw new SyntaxError("At line: "+objTree.Operation.line+". Can not use SetUnaryOperator (++ or --) during logical operations with branches");

                    if( objTree.Left !== undefined) {
                        LGenObj = genCode(objTree.Left, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        instructionstrain+= createInstruction(objTree.Operation,LGenObj.MemObj);
                        return { MemObj: LGenObj.MemObj, instructionset: instructionstrain };
                    } else {
                        RGenObj = genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        auxVars.postOperations+=createInstruction(objTree.Operation, RGenObj.MemObj);
                        return { MemObj: RGenObj.MemObj, instructionset: "" };
                    }
                }

                if (objTree.Operation.type === "Comparision") {


                    if (logicalOp === false && gc_jumpFalse === undefined) {// need to transform arithmetic to logical

                        let IDCompSF, IDCompST, IDEnd, rnd, ret;

                        rnd=bc_auxVars.getNewJumpID();

                        IDCompSF = "__CMP_"+rnd+"_sF";//set false
                        IDCompST = "__CMP_"+rnd+"_sT";//set true
                        IDEnd    = "__CMP_"+rnd+"_end";

                        if (objTree.Operation.value === "||") { // Code optimization
                            ret=genCode(objTree, true, true, IDCompSF, IDCompST); //do it again, now with jump defined
                            instructionstrain+=ret.instructionset;
                            tempvar=auxVars.getNewTemp();
                            instructionstrain += createInstruction({type: "Label"},IDCompSF);
                            instructionstrain += createInstruction({type: "Assignment"},tempvar,"#0000000000000000");
                            instructionstrain += createInstruction({type: "Jump"}, IDEnd);
                            instructionstrain += createInstruction({type: "Label"},IDCompST);
                            instructionstrain += createInstruction({type: "Assignment"},tempvar,"#0000000000000001");
                            instructionstrain += createInstruction({type: "Label"}, IDEnd);
                        } else {
                            gc_jumpTrue=IDCompST;
                            ret=genCode(objTree, true ,false, IDCompSF, IDCompST); //do it again, now with jump defined
                            instructionstrain+=ret.instructionset;
                            tempvar=auxVars.getNewTemp();
                            instructionstrain += createInstruction({type: "Label"},IDCompST);
                            instructionstrain += createInstruction({type: "Assignment"},tempvar,"#0000000000000001");
                            instructionstrain += createInstruction({type: "Jump"}, IDEnd);
                            instructionstrain += createInstruction({type: "Label"},IDCompSF);
                            instructionstrain += createInstruction({type: "Assignment"},tempvar,"#0000000000000000");
                            instructionstrain += createInstruction({type: "Label"}, IDEnd);
                        }

                        auxVars.freeVar(ret.varname);
                        return { varname: tempvar, instructionset: instructionstrain };
                    }

                    if (objTree.Operation.value === "||") {

                        let IDNextStmt, rnd;

                        rnd=bc_auxVars.getNewJumpID();

                        IDNextStmt = "__OR_"+rnd+"_next";

                        left=genCode(objTree.Left, true, true, IDNextStmt, gc_jumpTrue);
                        instructionstrain+=left.instructionset;
                        if (auxVars.isTemp(left.varname)) { //maybe it was an arithmetic operation
                            makeJump=genCode(truthVerObj(left.varname), true, true, gc_jumpFalse, gc_jumpTrue);
                            instructionstrain+=makeJump.instructionset;
                        }

                        instructionstrain+=createInstruction({type: "Label"},IDNextStmt);

                        right=genCode(objTree.Right, true, true, gc_jumpFalse, gc_jumpTrue);
                        instructionstrain+=right.instructionset;
                        if (auxVars.isTemp(right.varname)) { //maybe it was an arithmetic operation
                            makeJump=genCode(truthVerObj(right.varname), true, true, gc_jumpFalse, gc_jumpTrue);
                            instructionstrain+=makeJump.instructionset;
                        }

                        instructionstrain+=createInstruction({type: "Jump"}, gc_jumpFalse);

                        return { instructionset: instructionstrain } ;
                    }

                    if (objTree.Operation.value === "&&") {

                        let IDNextStmt, rnd;

                        rnd=bc_auxVars.getNewJumpID();

                        IDNextStmt = "__AND_"+rnd+"_next";

                        left=genCode(objTree.Left, true, false, gc_jumpFalse, IDNextStmt);
                        instructionstrain+=left.instructionset;
                        if (auxVars.isTemp(left.varname)) { //maybe it was an arithmetic operation
                            makeJump=genCode(truthVerObj(left.varname), true, false, gc_jumpFalse, gc_jumpTrue);
                            instructionstrain+=makeJump.instructionset;
                        }

                        instructionstrain+=createInstruction({type: "Label"},IDNextStmt);

                        right=genCode(objTree.Right, true, false, gc_jumpFalse, gc_jumpTrue);
                        instructionstrain+=right.instructionset;
                        if (auxVars.isTemp(right.varname)) { //maybe it was an arithmetic operation
                            makeJump=genCode(truthVerObj(right.varname), true, false, gc_jumpFalse, gc_jumpTrue);
                            instructionstrain+=makeJump.instructionset;
                        }

                        instructionstrain+=createInstruction({type: "Jump"}, gc_jumpTrue);

                        return { instructionset: instructionstrain } ;
                    }

                    // other comparisions operators: ==, !=, <, >, <=, >=

                    left=genCode(objTree.Left, false, gc_revLogic); //, gc_jumpFalse, gc_jumpTrue); must be undefined to evaluate expressions
                    instructionstrain+=left.instructionset;

                    right=genCode(objTree.Right, false, gc_revLogic); //, gc_jumpFalse, gc_jumpTrue); must be undefined to evaluate expressions
                    instructionstrain+=right.instructionset;

                    instructionstrain+=createInstruction(objTree.Operation, left.varname, right.varname, gc_revLogic, gc_jumpFalse, gc_jumpTrue);

                    auxVars.freeVar(left.varname);
                    auxVars.freeVar(right.varname);
                    return { instructionset: instructionstrain } ;
                }

                if (objTree.Operation.type === "Delimiter" ) {

                    if (cg_jumpTarget !== undefined)
                        throw new TypeError("At line: "+objTree.Operation.line+". Only one expression at a time if cg_jumpTarget is set.");

                    LGenObj=genCode(objTree.Left, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                    instructionstrain+=LGenObj.instructionset;
                    instructionstrain+=auxVars.getPostOperations();

                    RGenObj=genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                    instructionstrain+=RGenObj.instructionset;
                    //Note: RGenObj always have MemObj, because cg_jumpTarget is undefined.
                    auxVars.freeRegister(RGenObj.MemObj.location);
                    instructionstrain+=auxVars.getPostOperations();

                    return { MemObj: LGenObj.MemObj, instructionset: instructionstrain } ;
                }

                if (objTree.Operation.type === "Operator" ) {

                    LGenObj=genCode(objTree.Left, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                    instructionstrain+=LGenObj.instructionset;

                    RGenObj=genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                    instructionstrain+=RGenObj.instructionset;

                    //Error handling
                    if (LGenObj.MemObj === undefined || RGenObj.MemObj === undefined) {
                        throw new TypeError("At line: "+objTree.Operation.line+". Trying to make operations with undefined variables");
                    }
                    //optimization on constant codes:
                    if (LGenObj.MemObj.type === "constant" && RGenObj.MemObj.type === "constant"){
                        TmpMemObj;
                        // TODO: expand for more operators
                        if (objTree.Operation.value === "+") {
                            TmpMemObj = createConstantMemObj(addHexContents(LGenObj.MemObj.hex_content, RGenObj.MemObj.hex_content));
                            return { MemObj: TmpMemObj, instructionset: instructionstrain };
                        } else if (objTree.Operation.value === "*") {
                            TmpMemObj = createConstantMemObj(mulHexContents(LGenObj.MemObj.hex_content, RGenObj.MemObj.hex_content));
                            return { MemObj: TmpMemObj, instructionset: instructionstrain };
                        }
                    }
                    //optimization if one parameter is constant and operation is commutative
                    if (LGenObj.MemObj.type === "constant"){
                        if (objTree.Operation.value === "+" || objTree.Operation.value === "*" || objTree.Operation.value === "&" || objTree.Operation.value === "^" || objTree.Operation.value === "|" ) {
                            let temp=RGenObj;
                            RGenObj=LGenObj;
                            LGenObj=temp;
                        }
                    }
                    if (!auxVars.isTemp(LGenObj.MemObj.location)){
                        TmpMemObj=auxVars.getNewRegister();
                        TmpMemObj.declaration=LGenObj.MemObj.declaration;
                        instructionstrain+=createInstruction(genAssignmentToken(), TmpMemObj, LGenObj.MemObj);
                        auxVars.freeRegister(LGenObj.MemObj.location);
                    } else {
                        TmpMemObj=LGenObj.MemObj;
                    }

                    instructionstrain+=createInstruction(objTree.Operation, TmpMemObj, RGenObj.MemObj);

                    //TODO 
                    if (logicalOp === true) {
                        makeJump=genCode(truthVerObj(tempvar), true, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        instructionstrain+=makeJump.instructionset;
                        auxVars.freeVar(right.varname);
                        auxVars.freeVar(tempvar);
                        return { instructionset: instructionstrain };
                    }

                    auxVars.freeRegister(RGenObj.MemObj.location);
                    return {MemObj: TmpMemObj , instructionset: instructionstrain } ;
                }

                if (objTree.Operation.type === "Assignment" || objTree.Operation.type === "SetOperator") {

                    if (gc_jumpFalse !== undefined)
                        throw new SyntaxError("At line: "+objTree.Operation.line+". Can not use assignment during logical operations with branches");

                    auxVars.left_side_of_assignment = true;
                    LGenObj=genCode(objTree.Left, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                    instructionstrain+=LGenObj.instructionset;
                    auxVars.left_side_of_assignment = false;

                    if (LGenObj.MemObj === undefined)
                        throw new SyntaxError("At line: "+objTree.Operation.line+". Trying to assign undefined variable");
                    if (LGenObj.MemObj.location == -1)
                        throw new TypeError("At line: "+objTree.Operation.line+". Invalid left value for "+objTree.Operation.type);
                    if (auxVars.isTemp(LGenObj.MemObj.location) && LGenObj.MemObj.type.lastIndexOf("_ptr") !== LGenObj.MemObj.type.length-4){
                        throw new TypeError("At line: "+objTree.Operation.line+". Invalid left value for "+objTree.Operation.type);
                    }
                    if ( LGenObj.MemObj.type === "array" &&  LGenObj.MemObj.offset_type === undefined ) {
                        throw new TypeError("At line: "+objTree.Operation.line+". Invalid left value for "+objTree.Operation.type);
                    }

                    let temp_declare="";
                    if (auxVars.declaring.length != 0) {
                        temp_declare = auxVars.declaring;
                        auxVars.declaring="";
                    }
                    //check if we can reuse variables used on assignment
                    //then add it to auxVars.tmpvars
                    //TODO Do it better!!!
                    if ( objTree.Operation.type === "Assignment"
                        && bc_Big_ast.Config.reuseAssignedVar === true
                        && LGenObj.MemObj.type === "long"
                        && CanReuseAssignedVar(LGenObj.MemObj.location, objTree.Right) ){
                        auxVars.tmpvars.unshift(LGenObj.MemObj.asm_name);
                        auxVars.status.unshift(false);
                        RGenObj=genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        auxVars.tmpvars.shift();
                        auxVars.status.shift();
                    } else
                        RGenObj=genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                    instructionstrain+=RGenObj.instructionset;
                    if ( temp_declare.length != 0 ){
                        auxVars.declaring=temp_declare;
                    }

                    if (RGenObj.MemObj === undefined) {
                        throw new TypeError("At line: "+objTree.Operation.line+". Invalid right value for "+objTree.Operation.type+". Possible void value.");
                    }
                    if (bc_Big_ast.Config.useVariableDeclaration){
                        if ( !auxVars.isTemp(RGenObj.MemObj.location) ){
                            if (LGenObj.MemObj.declaration != RGenObj.MemObj.declaration){
                                if (LGenObj.MemObj.declaration.indexOf("_ptr") == -1 || RGenObj.MemObj.declaration.indexOf("_ptr") == -1 ) {//skipt check if both sides are pointers
                                    if (bc_Big_ast.Config.warningToError) {
                                        throw new TypeError("WARNING: At line: "+objTree.Operation.line+". Left and right values does not match. Values are: '"+LGenObj.MemObj.declaration+"' and '"+RGenObj.MemObj.declaration+"'.");
                    }   }   }   }   }
                    instructionstrain+=createInstruction(objTree.Operation, LGenObj.MemObj, RGenObj.MemObj);

                    //TODO check if there is offset!!!
                    auxVars.freeRegister(RGenObj.MemObj.location);
                    auxVars.freeRegister(RGenObj.MemObj.location);
                    return { MemObj: LGenObj.MemObj, instructionset: instructionstrain } ;
                }

                if (objTree.Operation.type === "Keyword" ) {

                    if (objTree.Left.value === "long" || objTree.Left.value === "void") {
                        auxVars.declaring=objTree.Left.value;
                        let ret = genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        return ret;
                    }

                    if (objTree.Left.value === "return" ) {
                        if (bc_auxVars.current_function == -1 ) {
                            throw new TypeError("At line: "+objTree.Left.line+". Can not use 'return' in global statements.");
                        }
                        if (bc_Big_ast.functions[bc_auxVars.current_function].return_type === 'void') {
                            throw new TypeError("At line: "+objTree.Left.line+". Function '"
                                   +bc_Big_ast.functions[bc_auxVars.current_function].name+"' must return a '"
                                   +bc_Big_ast.functions[bc_auxVars.current_function].return_type+"' value.");
                        }
                        if (bc_Big_ast.functions[bc_auxVars.current_function].name === "main") {
                            throw new TypeError("At line: "+objTree.Left.line+". main() Function must return void");
                        }
                        RGenObj=genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        instructionstrain+=RGenObj.instructionset;
                        instructionstrain+=auxVars.getPostOperations();

                        instructionstrain+=createInstruction(objTree.Left, RGenObj.MemObj);

                        auxVars.freeRegister(RGenObj.MemObj.location);
                        return { instructionset: instructionstrain } ;
                    }

                    if (objTree.Left.value === "goto" || objTree.Left.value === "sleep" ) {
                        RGenObj=genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        instructionstrain+=RGenObj.instructionset;
                        instructionstrain+=auxVars.getPostOperations();

                        //TODO: goto: check if label exists
                        instructionstrain+=createInstruction(objTree.Left, RGenObj.MemObj);

                        auxVars.freeRegister(RGenObj.MemObj.location);
                        return { instructionset: instructionstrain } ;
                    }
                    if (objTree.Left.value === "exit" || objTree.Left.value === "halt" ) {
                        throw new TypeError("At line: "+objTree.Left.line+". Keyword '"+objTree.Left.value+"' does not accept arguments.");
                    }
                    if (objTree.Left.value === "struct" ) { //nothing to do here
                        return { instructionset: "" } ;
                    }
                }
                throw new TypeError("At line: "+objTree.Operation.line+". Code generation error: Unknown operation "+objTree.Operation.type);
            }
        }


        // Returns an object that can be used to create a instruction to
        //   verify if it is true. True if var != 0, false if var == 0
        function truthVerObj(variable_to_test) {

            return { Left:      { "type": "Variable",   "precedence": 0, "value": variable_to_test },
                    Operation: { "type": "Comparision","precedence": 6, "value": "!=" },
                    Right:     { "type": "Constant",   "precedence": 0, "name": "NumberDecimalStr", "value": "0" } };
        }


        // Traverse an AST searching a variable name. In this case is the
        //   right side of an assignment. If variable 'name' is found, it
        //   can not be reused as temporary var (register)
        function CanReuseAssignedVar(loc, ast_code) {

            let SeekObj = getMemoryObjectByLocation(loc);
            let vname = SeekObj.asm_name;

            if (ast_code.Operation === undefined) { //end object
                if (ast_code.type === 'Variable'){
                    if (ast_code.value == vname) {
                        return false;
                    } else {
                        if (ast_code.params !== undefined){
                            for (let i=0; i< ast_code.params.length; i++){
                                if (CanReuseAssignedVar(loc,  ast_code.params[i]) === false){
                                    return false;
                                }
                            }
                            return true;
                        }
                        return true;
                    }
                }
                if (ast_code.type === 'Constant')
                    return true;
                if (ast_code.type === 'Function')
                    return true;
                if (isEmpty(ast_code))
                    return true;
            } else {
                if (ast_code.Center !== undefined)
                    if (CanReuseAssignedVar(loc, ast_code.Center))
                        return true;
                    else
                        return false;
                let left, right;

                if (ast_code.Left  !== undefined)
                    left = CanReuseAssignedVar(loc, ast_code.Left);
                else
                    left = true;

                if (ast_code.Right !== undefined)
                    right = CanReuseAssignedVar(loc, ast_code.Right);
                else
                    right = true;

                if (left && right)
                    return true;
                else
                    return false;
            }
            throw new TypeError("Something wrong here");
        }


        function chooseBranch(value, useBZR, cb_logic) {
            if (useBZR) {
                if (cb_logic) {
                    if (value === '==')
                        return "BZR";
                    if (value === '!=')
                        return "BNZ";
                } else {
                    if (value === '==')
                        return "BNZ";
                    if (value === '!=')
                        return "BZR";
                }
                throw new TypeError("Invalid use of Branch Zero: "+value);
            } else {
                if (cb_logic) {
                    if (value === '>')
                        return "BGT";
                    if (value === '>=')
                        return "BGE";
                    if (value === '<')
                        return "BLT";
                    if (value === '<=')
                        return "BLE";
                    if (value === '==')
                        return "BEQ";
                    if (value === '!=')
                        return "BNE";
                } else {
                    if (value === '>')
                        return "BLE";
                    if (value === '>=')
                        return "BLT";
                    if (value === '<')
                        return "BGE";
                    if (value === '<=')
                        return "BGT";
                    if (value === '==')
                        return "BNE";
                    if (value === '!=')
                        return "BEQ";
                }
            }
            throw new TypeError("Unknow branch operation: "+value);
        }


        // Translate one single instruction from ast to assembly code
        function createInstruction(objoperator, param1, param2, ci_revLogic, ci_jumpFalse, ci_jumpTrue) {
            let retinstr="";

            if (objoperator.type === 'Assignment') {

                if (param1.type === "constant" || param1.type === "constant_ptr") {
                    throw new TypeError("Invalid left side for assigment.");
                }
                if (param1.type === "register" || param1.type === "long") { //param 1 can be direct assigned

                    if (param2.type === "constant" ) { // Can use SET_VAL or CLR_DAT
                        if (param2.hex_content === "0000000000000000") {
                            return "CLR @"+param1.asm_name+"\n";
                        } else {
                            if (param2.hex_content.length > 17) {
                                throw new RangeError("Overflow on long value assignment (value bigger than 64 bits)");
                            }
                            return "SET @"+param1.asm_name+" #"+param2.hex_content+"\n";
                        }

                    } else if (param2.type === "register" || param2.type === "long") { // Can use SET_DAT
                        if (param1.location == param2.location) return "";
                        else return "SET @"+param1.asm_name+" $"+param2.asm_name+"\n";

                    } else if (param2.type === "register_ptr" || param2.type === "long_ptr") {
                        return "SET @"+param1.asm_name+" $($"+param2.asm_name+")\n";

                    } else if (param2.type === "constant_ptr") {
                        return "SET @"+param1.asm_name+" $($"+getMemoryObjectByLocation(param2.hex_content,objoperator.line).asm_nam+")\n";

                    } else if (param2.type === "array" || param2.type === "struct") {
                        if (param2.offset_type === undefined) {
                            return "SET @"+param1.asm_name+" $"+param2.asm_name+"\n";
                        }
                        if (param2.offset_type === "constant" ) {
                            return "SET @"+param1.asm_name+" $"+getMemoryObjectByLocation(addHexContents(param2.hex_content, param2.offset_value), objoperator.line).asm_name+"\n";
                        } else {
                            return "SET @"+param1.asm_name+" $($"+param2.asm_name+" + $"+getMemoryObjectByLocation(param2.offset_value,objoperator.line).asm_name+")\n";
                        }
                    }
                    throw new TypeError("At line: "+objoperator.line+". Unknow combination at createInstruction: param1 type '"+param1.type+"' and param2 type: '"+param2.type+"'.");

                } else if (param1.type === "register_ptr" || param1.type === "long_ptr") {
                    if (param2.type === "constant" ) { // Can use SET_VAL or CLR_DAT
                        if (param2.hex_content.length > 17) {
                            throw new RangeError("Overflow on long value assignment (value bigger than 64 bits)");
                        }
                        let TmpMemObj=auxVars.getNewRegister();
                        retinstr+=createInstruction(genAssignmentToken(), TmpMemObj, param2);
                        retinstr+="SET @($"+param1.asm_name+") $"+TmpMemObj.asm_name+"\n";
                        auxVars.freeRegister(TmpMemObj.location);
                        return retinstr;
                    } else if (param2.type === "register" || param2.type === "long") { // Can use SET_DAT
                        return "SET @($"+param1.asm_name+") $"+param2.asm_name+"\n";
                    } else if (param2.type === "register_ptr" || param2.type === "long_ptr") {
                        let TmpMemObj=auxVars.getNewRegister();
                        retinstr+=createInstruction(genAssignmentToken(), TmpMemObj, param2);
                        retinstr+="SET @($"+param1.asm_name+") $"+TmpMemObj.asm_name+"\n";
                        auxVars.freeRegister(TmpMemObj.location);
                        return retinstr;
                    } else if (param2.type === "constant_ptr") {
                        return "SET @"+param1.asm_name+" #"+param2.hex_content+"\n";

                    } else if (param2.type === "array") {
                        if (param2.offset_type === "constant" ) {
                            return "SET @($"+param1.asm_name+") $"+getMemoryObjectByLocation(addHexContents(param2.hex_content, param2.offset_value), objoperator.line).asm_name+"\n";
                        } else {
                            let TmpMemObj=auxVars.getNewRegister();
                            retinstr+=createInstruction(genAssignmentToken(), TmpMemObj, param2);
                            retinstr+="SET @($"+param1.asm_name+") $"+TmpMemObj.asm_name+"\n";
                            auxVars.freeRegister(TmpMemObj.location);
                            return retinstr;
                        }
                    }
                    throw new TypeError("At line: "+objoperator.line+". Unknow combination at createInstruction: param1 type '"+param1.type+"' and param2 type: '"+param2.type+"'.");

                } else if (param1.type === "array") {
                    if (param1.offset_type === "constant" ) {
                        return createInstruction(objoperator,getMemoryObjectByLocation(addHexContents(param1.hex_content, param1.offset_value), objoperator.line), param2);
                    }
                    if (param2.type === "constant" ) {
                        if (param2.hex_content.length > 17) {
                            throw new RangeError("Overflow on long value assignment (value bigger than 64 bits)");
                        }
                        let TmpMemObj=auxVars.getNewRegister();
                        retinstr+=createInstruction(genAssignmentToken(), TmpMemObj, param2);
                        retinstr+= "SET @($"+param1.asm_name+" + $"+getMemoryObjectByLocation(param1.offset_value,objoperator.line).asm_name+") $"+TmpMemObj.asm_name+"\n";
                        auxVars.freeRegister(TmpMemObj.location);
                        return retinstr;
                    } else if (param2.type === "register" || param2.type === "long") {
                        return "SET @($"+param1.asm_name+" + $"+getMemoryObjectByLocation(param1.offset_value,objoperator.line).asm_name+") $"+param2.asm_name+"\n";
                    } else if (param2.type === "register_ptr" || param2.type === "long_ptr") {
                        let TmpMemObj=auxVars.getNewRegister();
                        retinstr+=createInstruction(genAssignmentToken(), TmpMemObj, param2);
                        retinstr+= "SET @($"+param1.asm_name+" + $"+getMemoryObjectByLocation(param1.offset_value,objoperator.line).asm_name+") $"+TmpMemObj.asm_name+"\n";
                        auxVars.freeRegister(TmpMemObj.location);
                        return retinstr;
                    } else if (param2.type === "array") {
                        if (param2.offset_type === "constant" ) {
                            return "SET @($"+param1.asm_name+" + $"+getMemoryObjectByLocation(param1.offset_value,objoperator.line).asm_name+") $"+getMemoryObjectByLocation(addHexContents(param2.hex_content, param2.offset_value), objoperator.line).asm_name+"\n";
                        } else {
                            let TmpMemObj=auxVars.getNewRegister();
                            retinstr+=createInstruction(genAssignmentToken(), TmpMemObj, param2);
                            retinstr+="SET @($"+param1.asm_name+" + $"+getMemoryObjectByLocation(param1.offset_value,objoperator.line).asm_name+") $"+TmpMemObj.asm_name+"\n";
                            auxVars.freeRegister(TmpMemObj.location);
                            return retinstr;
                        }
                    }
                    throw new TypeError("At line: "+objoperator.line+". Unknow combination at createInstruction: param1 type '"+param1.type+"' and param2 type: '"+param2.type+"'.");

                } else if (param1.type === "struct") {
                    if (param1.offset_type === undefined && param1.declaration === "struct_ptr") {
                        if (param2.type === "constant" ) {
                            return "SET @"+param1.asm_name+" #"+param2.hex_content+"\n";
                        }
                    } else if (param1.offset_type === "constant" ) {
                        //not possible;
                    } else /* if (param1.offset_type === "variable" ) */ {
                        if (param2.type === "constant" ) {
                            if (param2.hex_content.length > 17) {
                                throw new RangeError("At line: "+objoperator.line+". Overflow on long value assignment (value bigger than 64 bits)");
                            }
                            let TmpMemObj=auxVars.getNewRegister();
                            retinstr+=createInstruction(genAssignmentToken(), TmpMemObj, param2);
                            retinstr+= "SET @($"+param1.asm_name+" + $"+getMemoryObjectByLocation(param1.offset_value,objoperator.line).asm_name+") $"+TmpMemObj.asm_name+"\n";
                            auxVars.freeRegister(TmpMemObj.location);
                            return retinstr;
                        }
                    }
                }
                throw new TypeError("At line: "+objoperator.line+". Unknow combination at createInstruction: param1 type '"+param1.type+"' and param2 type: '"+param2.type+"'.");
            }

            if (objoperator.type === 'Operator' || objoperator.type === 'SetOperator') {

                let TmpMemObj1, TmpMemObj2 ;
                let free_param1=false;
                let allow_optimization = false;
                let optimized = false;


                if (param1.type === "constant" ) {
                    throw new TypeError("At line: "+objoperator.line+". Can not createInstruction with param1 type '"+param1.type+"'.");
                } else if (param1.type === "register" || param1.type === "long") {
                    TmpMemObj1 = param1;
                } else if (param1.type === "register_ptr" || param1.type === "long_ptr") {
                    TmpMemObj1=auxVars.getNewRegister();
                    retinstr+=createInstruction(genAssignmentToken(), TmpMemObj1, param1);
                    free_param1=true;
                } else if (param1.type === "array") {
                    if (param1.offset_type === "constant") { //Looks like an array but can be converted to regular variable
                        TmpMemObj1 = getMemoryObjectByLocation( addHexContents(param1.hex_content, param1.offset_value), objoperator.line);
                    } else {
                        TmpMemObj1=auxVars.getNewRegister();
                        retinstr+=createInstruction(genAssignmentToken(), TmpMemObj1, param1);
                        free_param1=true;
                    }
                } else if (param1.type === "struct") {
                    if ( bc_Big_ast.Config.useVariableDeclaration === false) {
                        throw new TypeError("At line: "+objoperator.line+". Can not use struct if 'useVariableDeclaration' is false.");
                    }
                    if (param1.declaration !== "struct_ptr") {
                        throw new TypeError("At line: "+objoperator.line+". Can not make operations in struct.");
                    }
                    if (param1.offset_type === undefined) {
                        TmpMemObj1 = param1;
                    } else if (param1.offset_type === "constant") {
                        TmpMemObj1=auxVars.getNewRegister();
                        retinstr+=createInstruction(genAssignmentToken(), TmpMemObj1, createConstantMemObj(param1.offset_value));
                        free_param1=true;
                    } else {
                        TmpMemObj1 = getMemoryObjectByLocation( param1.offset_value, objoperator.line);
                    }

                } else {
                    throw new TypeError("At line: "+objoperator.line+". Not implemented type in createInstruction for Operator: param1 type '"+param1.type+"'.");
                }

                if (param2.type === "constant" ) {
                    TmpMemObj2=auxVars.getNewRegister();
                    retinstr+=createInstruction(genAssignmentToken(), TmpMemObj2, param2);
                    allow_optimization=true;
                } else if (param2.type === "register" || param2.type === "long") {
                    TmpMemObj2 = param2;
                } else if (param2.type === "register_ptr" || param2.type === "long_ptr") {
                    TmpMemObj2=auxVars.getNewRegister();
                    retinstr+=createInstruction(genAssignmentToken(), TmpMemObj2, param2);
                } else if (param2.type === "array") {
                    if (param2.offset_type === "constant") { //Looks like an array but can be converted to regular variable
                        TmpMemObj2 = getMemoryObjectByLocation( addHexContents(param2.hex_content, param2.offset_value), objoperator.line);
                    } else {
                        TmpMemObj2=auxVars.getNewRegister();
                        retinstr+=createInstruction(genAssignmentToken(), TmpMemObj2, param2);
                    }
                } else if (param2.type === "struct") {
                    if ( bc_Big_ast.Config.useVariableDeclaration === false) {
                        throw new TypeError("At line: "+objoperator.line+". Can not use struct if 'useVariableDeclaration' is false.");
                    }
                    if (param2.declaration !== "struct_ptr") {
                        throw new TypeError("At line: "+objoperator.line+". Can not make operations in struct.");
                    }
                    if (param2.offset_type === undefined) {
                        TmpMemObj2 = param2;
                    } else if (param2.offset_type === "constant") {
                        TmpMemObj2=auxVars.getNewRegister();
                        retinstr+=createInstruction(genAssignmentToken(), TmpMemObj2, createConstantMemObj(param2.offset_value));
                    } else {
                        TmpMemObj2 = getMemoryObjectByLocation( param2.offset_value, objoperator.line);
                    }
                } else {
                    throw new TypeError("At line: "+objoperator.line+". Not implemented type in createInstruction for Operator: param2 type '"+param2.type+"'.");
                }

                if (allow_optimization === true) {
                    function removeLastButOne() {
                        if ( retinstr.length > 0 ){
                            let codes=retinstr.split("\n");
                            codes.pop();
                            codes.pop();
                            retinstr=codes.join("\n");
                        }
                    }
                    if (       objoperator.value === '+' || objoperator.value === '+=') {
                        if (param2.hex_content === "0000000000000000") {
                            auxVars.freeRegister(TmpMemObj2.location);
                            return "";
                        }
                        if (param2.hex_content === "0000000000000001") {
                            auxVars.freeRegister(TmpMemObj2.location);
                            removeLastButOne();
                            retinstr+=createInstruction(genIncToken(objoperator.line), TmpMemObj1);
                            optimized=true;
                        }
                        if (param2.hex_content === "0000000000000002") {
                            auxVars.freeRegister(TmpMemObj2.location);
                            removeLastButOne();
                            retinstr += createInstruction(genIncToken(objoperator.line), TmpMemObj1)
                            retinstr += createInstruction(genIncToken(objoperator.line), TmpMemObj1)
                            optimized =true;
                        }
                    } else if ( objoperator.value === '-' || objoperator.value === '-=') {
                        if (param2.hex_content === "0000000000000000") {
                            auxVars.freeRegister(TmpMemObj2.location);
                            return "";
                        }
                        if (param2.hex_content === "0000000000000001") {
                            auxVars.freeRegister(TmpMemObj2.location);
                            removeLastButOne();
                            retinstr+=createInstruction(genDecToken(objoperator.line), TmpMemObj1);
                            optimized=true;
                        }
                    } else if ( objoperator.value === '*' || objoperator.value === '*=') {
                        if (param2.hex_content === "0000000000000000") {
                            auxVars.freeRegister(TmpMemObj2.location);
                            removeLastButOne();
                            retinstr += createInstruction(genAssignmentToken(), TmpMemObj1, param2);
                            optimized=true;
                        }
                        if (param2.hex_content === "0000000000000001") {
                            auxVars.freeRegister(TmpMemObj2.location);
                            return "";
                        }
                    } else if ( objoperator.value === '/' || objoperator.value === '/=') {
                        if (param2.hex_content === "0000000000000001") {
                            auxVars.freeRegister(TmpMemObj2.location);
                            return "";
                        }
                    }
                }

                if (optimized === false) {
                    if (       objoperator.value === '+' || objoperator.value === '+=') {
                        retinstr+= "ADD";
                    } else if (objoperator.value === '-' || objoperator.value === '-=') {
                        retinstr+= "SUB";
                    } else if (objoperator.value === '*' || objoperator.value === '*=') {
                        retinstr+= "MUL";
                    } else if (objoperator.value === '/' || objoperator.value === '/=') {
                        retinstr+= "DIV";
                    } else if (objoperator.value === '|' || objoperator.value === '|=') {
                        retinstr+= "BOR";
                    } else if (objoperator.value === '&' || objoperator.value === '&=') {
                        retinstr+= "AND";
                    } else if (objoperator.value === '^' || objoperator.value === '^=') {
                        retinstr+= "XOR";
                    } else if (objoperator.value === '%' || objoperator.value === '%=') {
                        retinstr+= "MOD";
                    } else if (objoperator.value === '<<' || objoperator.value === '<<=') {
                        retinstr+= "SHL";
                    } else if (objoperator.value === '>>' || objoperator.value === '>>=') {
                        retinstr+= "SHR";
                    } else
                        throw new TypeError("Operator not supported "+objoperator.value);

                    retinstr +=" @"+TmpMemObj1.asm_name+" $"+TmpMemObj2.asm_name+"\n";

                    auxVars.freeRegister(TmpMemObj2.location);
                }

                if (free_param1 === true) {
                    retinstr+=createInstruction(genAssignmentToken(), param1, TmpMemObj1);
                    auxVars.freeRegister(TmpMemObj1.location);
                }

                return retinstr;
            }

            if (objoperator.type === 'UnaryOperator' || objoperator.type === 'SetUnaryOperator') {

                if (objoperator.value === '++') {
                    return "INC @"+param1.asm_name+"\n";
                }
                if (objoperator.value === '--') {
                    return "DEC @"+param1.asm_name+"\n";
                }
                if (objoperator.value === '~') {
                    return "NOT @"+param1.asm_name+"\n";
                }
                if (objoperator.value === '+') {
                    return;
                }
                throw new TypeError("Unary operator not supported: "+objoperator.value);
            }

            if (objoperator.type === 'Delimiter') {
                return param1+"\n"+param2;
            }

            if (objoperator.type === 'Jump') {
                return "JMP :"+param1+"\n";
            }

            if (objoperator.type === 'Label') {
                return param1+":\n";
            }

            if (objoperator.type === 'Comparision') {

                if (ci_jumpFalse === undefined || ci_jumpTrue === undefined)
                    throw new TypeError("Missing label to ci_jumpFalse / ci_jumpTrue.");

                let id;
                let retstr = "";
                let tempparam1="";
                let tempparam2="";
                let freeParam1=false;
                let freeParam2=false;
                let useBranchZero=false;
                let jump;

                if  (param1.indexOf("#") >= 0 || param1.indexOf("$") >= 0) {
                    tempparam1=auxVars.getNewTemp();
                    freeParam1=true;
                    retstr+=createInstruction({type: "Assignment"}, tempparam1, param1);
                } else {
                    tempparam1 = param1;
                }

                if  (param2.indexOf("#") >= 0 || param2.indexOf("$") >= 0) {
                    if (param2==="#0000000000000000" && (objoperator.value === '!=' || objoperator.value === '==')) {
                        useBranchZero=true;
                    } else {
                        tempparam2=auxVars.getNewTemp();
                        freeParam2=true;
                        retstr+=createInstruction({type: "Assignment"}, tempparam2, param2);
                    }
                } else {
                    tempparam2 = param2;
                }

                retstr += chooseBranch(objoperator.value, useBranchZero, ci_revLogic);

                if (ci_revLogic)
                    jump = ci_jumpTrue;
                else
                    jump = ci_jumpFalse;

                if (useBranchZero)
                    retstr +=" $"+tempparam1+" :"+jump+"\n";
                else
                    retstr +=" $"+tempparam1+" $"+tempparam2+" :"+jump+"\n";

                if (freeParam1===true)
                    auxVars.freeVar(tempparam1);
                if (freeParam2===true)
                    auxVars.freeVar(tempparam2);
                return retstr;
            }

            if (objoperator.type === 'FunctionCall') {
                return "JSR :__fn_"+param1+"\n";
            }

            if (objoperator.type === 'APICall') {
                let retinstr="";
                let tempvar=[];

                param2.forEach(function (varnm) {
                    if (varnm.indexOf("#") >= 0 || varnm.indexOf("$") >= 0) {
                        tempvar.push(auxVars.getNewTemp());
                        retinstr+=createInstruction({type: "Assignment"}, tempvar[tempvar.length-1], varnm);
                    } else {
                        tempvar.push(varnm);
                    }
                })

                retinstr+= "FUN";
                if (param1.length != 0) {
                    retinstr+=" @"+param1;
                }
                retinstr+=" "+objoperator.value;
                tempvar.forEach(arg => retinstr+=" $"+arg);
                retinstr+="\n";

                tempvar.forEach(arg => auxVars.freeVar(arg));
                return retinstr;
            }

            if (objoperator.type === 'Pop') {
                return "POP @"+param1+"\n";
            }

            if (objoperator.type === 'Push') {

                let retinstr="";
                let tempvar;

                if (param1.indexOf("#") >= 0 || param1.indexOf("$") >= 0) {
                    tempvar=auxVars.getNewTemp();
                    retinstr+=createInstruction({type: "Assignment"}, tempvar, param1);
                } else {
                    tempvar=param1;
                }

                retinstr+= "PSH $"+tempvar+"\n";
                auxVars.freeVar(tempvar);
                return retinstr;
            }

            if (objoperator.type === 'Keyword') {
                if (objoperator.value === 'break' || objoperator.value === 'continue' ){
                    return "JMP :"+bc_auxVars.getLatestLoopId()+"_"+objoperator.value+"\n";
                }
                if (objoperator.value === 'label'){
                    return objoperator.id+":\n";
                }
                if (objoperator.value === 'goto'){
                    return "JMP :"+param1.name+"\n";
                }
                if (objoperator.value === 'halt'){
                    return "STP\n";
                }
                if (objoperator.value === 'exit'){
                    return "FIN\n";
                }
                if (objoperator.value === 'return' || objoperator.value === 'sleep' ){
                    if (param1 === undefined && objoperator.value === 'return') {
                        return "RET\n";
                    }

                    let retinstr="";
                    let TmpMemObj1;


                    if (param1.type === "constant" ) {
                        TmpMemObj1=auxVars.getNewRegister();
                        retinstr+=createInstruction(genAssignmentToken(), TmpMemObj1, param1);
                    } else if (param1.type === "register" || param1.type === "long") {
                        TmpMemObj1 = param1;
                    } else if (param1.type === "register_ptr" || param1.type === "long_ptr") {
                        TmpMemObj1=auxVars.getNewRegister();
                        retinstr+=createInstruction(genAssignmentToken(), TmpMemObj1, param1);
                    } else if (param1.type === "array") {
                        if (param1.offset_type === "constant") { //Looks like an array but can be converted to regular variable
                            TmpMemObj1 = getMemoryObjectByLocation( addHexContents(param1.hex_content, param1.offset_value), objoperator.line);
                        } else {
                            TmpMemObj1=auxVars.getNewRegister();
                            retinstr+=createInstruction(genAssignmentToken(), TmpMemObj1, param1);
                            free_param1=true;
                        }
                    } else {
                        throw new TypeError("At line: "+objoperator.line+". Not implemented type in createInstruction for keyword: param1 type '"+param1.type+"'.");
                    }

                    if (objoperator.value === 'return') {
                        retinstr+= "PSH $"+TmpMemObj1.asm_name+"\n";
                        retinstr+= "RET\n";
                    } else if ( objoperator.value === 'sleep' ){
                        retinstr+= "SLP $"+TmpMemObj1.asm_name+"\n";
                    }

                    auxVars.freeRegister(TmpMemObj1.location);
                    auxVars.freeRegister(param1.location);
                    return retinstr;
                }
                if (objoperator.value === 'asm'){
                    let lines=objoperator.asmText.split("\n");
                    lines=lines.map(function (value){ return value.trim()});
                    return lines.join("\n").trim()+"\n";
                }
            }
            throw new TypeError(objoperator.type+" not supported");
        }



        // Input: Assembler code from genCode()
        // Output: Optimized assembler
        // Optimizations:
        //   1) Remove unused labels
        //   2) Removed unreachable jumps
        //   3) Remove dummy jumps (jumps to next instruction)
        //   4) Do it until no more lines are optimized
        function optimizeJumps(in_code) {

            var tmplines = in_code.split("\n")
            var jumpToLabels,labels;
            var jmpto, lbl;
            var optimized_lines;

            do {
                jumpToLabels=[];
                labels=[];

                optimized_lines = tmplines.length;
                //Collect information
                tmplines.forEach( function (value) {
                        jmpto = /.+\s:(\w+)$/.exec(value);
                        lbl = /^(\w+):$/.exec(value);
                        if (jmpto!== null) {
                            jumpToLabels.push(jmpto[1]);
                        }
                        if (lbl!== null) {
                            labels.push(lbl[1]);
                        }
                    });

                //remove labels without reference
                tmplines = tmplines.filter( function (value){
                        lbl = /^(\w+):$/.exec(value);
                        if (lbl !== null)
                            if (jumpToLabels.indexOf(lbl[1]) != -1)
                                return true;
                            else
                                return false;
                        else
                            return true;
                    });

                //remove unreachable jumps
                tmplines = tmplines.filter( function (value, index, array){
                        jmpto = /^JMP\s+.+/.exec(value);
                        if (jmpto !== null)
                            if ( /^JMP\s+.+/.exec(array[index-1]) !== null)
                                return false;
                            else
                                return true;
                        else
                            return true;
                    });

                //remove meaningless jumps
                tmplines = tmplines.filter( function (value, index, array){
                        jmpto = /.+\s:(\w+)$/.exec(value);
                        if (jmpto !== null) {
                            let i=index;
                            while (++i<array.length-1) {
                                lbl = /^(\w+):$/.exec(array[i]);
                                if ( lbl === null)
                                    return true;
                                if (jmpto[1] === lbl[1])
                                    return false;
                                else
                                    return true;
                            }
                            return true;
                        } else
                            return true;
                    });

                optimized_lines -= tmplines.length;

            } while (optimized_lines != 0);

            return tmplines.join("\n");
        }


        //Splits a phrase with delimiters in an array of phrases without delimiters
        function splitSubSentences(Phrase) {
            var ret=[];

            function recursiveSplit(phrs) {
                if (phrs.Operation === undefined) {
                    ret.push(phrs);
                    return;
                }
                if (phrs.Operation.type === "Delimiter") {
                    recursiveSplit(phrs.Left);
                    recursiveSplit(phrs.Right);
                    return;
                } else {
                    ret.push(phrs);
                    return;
                }
            }

            recursiveSplit(Phrase);

            return ret;
        }

        return codeGenerator_main();
    }


    function isEmpty(obj) {
        for(var prop in obj) {
            if(obj.hasOwnProperty(prop))
                return false;
        }
        return true;
    }

    function writeAsmLine(line){
        //if (line.length != 0){
            bc_auxVars.assemblyCode+=line+"\n";
        //}
    }
    function writeAsmCode(lines){
        bc_auxVars.assemblyCode+=lines;
    }

    //Não verififcado!
    function declareFunctionArguments (phrase) {
        if (phrase.type !== "phrase"){
            throw new TypeError("Unexpected sentence in function arguments");
        }
        // alteration here, do also in shape.js code 3Ewuinl
        for (var i=0; i< phrase.code.length; i++) {
            let MemObj;
            if (i+1 < tokens.length && phrase.code[i].type === "Keyword" && phrase.code[i].value !== "struct" && phrase.code[i+1].type === "Variable") {
                MemObj=getMemoryObjectByName(phrase.code[i+1].name);
            } else if ( i+2 < phrase.code.length && phrase.code[i].type === "Keyword" && phrase.code[i+1].value === "*" && phrase.code[i+2].type === "Variable") {
                MemObj=getMemoryObjectByName(phrase.code[i+2].name);
            } else if ( i+3 < phrase.code.length && phrase.code[i].type === "Keyword" && phrase.code[i].value === "struct" && phrase.code[i+1].type === "Variable" && phrase.code[i+2].value === "*" && phrase.code[i+3].type === "Variable") {
                MemObj=getMemoryObjectByName(phrase.code[i+3].name);
            } else {
                throw new SyntaxError("Unexpected sentence in function arguments");
            }

            if (MemObj === undefined){
                throw new SyntaxError("At line: "+phrase.code[i+1].line+". Could not find memory object for '"+phrase.code[i+1].name+"'.");
            } else {
                //TODO true for all struc elements also code bbdD))k
                MemObj.dec_in_generator=true;
            }

        }
    }


    // handles variables declarations to assembly code.
    function assemblerDeclarationGenerator (MemObj) {
        if (MemObj.location != -1){
            writeAsmLine("^declare "+MemObj.asm_name);
            if (MemObj.hex_content !== undefined) {
                writeAsmLine("SET @"+MemObj.asm_name+" #"+MemObj.hex_content);
            }
        }
    }


    // Search and return a memory object with name varname
    // Object can be global or local function scope.
    // if not found, throws exception.
    function getMemoryObjectByName(var_name, line, declaration) {
        let search;
        if (declaration === undefined) {
            declaration = "";
        }
        if (bc_auxVars.current_function != -1) { //find function scope variable
            search = bc_Big_ast.memory.find(obj => obj.name == var_name && obj.scope === bc_Big_ast.functions[bc_auxVars.current_function].name );
        }
        if (search !== undefined){
            return JSON.parse(JSON.stringify(search));
        }
        // do a global scope search
        search = bc_Big_ast.memory.find(obj => obj.name == var_name && obj.scope === "" );

        if (bc_Big_ast.Config.useVariableDeclaration === false) {
            if (search === undefined) {
                let fakevar = {
                    "location": bc_Big_ast.memory.length,
                    "name": var_name,
                    "asm_name": var_name,
                    "type": "long",
                    "type_name": null,
                    "scope": "",
                    "size": 1,
                    "dec_as_pointer": false,
                    "dec_in_generator": true };
                bc_Big_ast.memory.push(fakevar);
                return JSON.parse(JSON.stringify(fakevar));
            }
            return JSON.parse(JSON.stringify(search));
        }

        // Checks to allow use:
        if (declaration.length != 0) { //we are in declarations sentence
            if (search === undefined) {
                throw new SyntaxError("At line: "+line+". Variable '"+var_name+"' not declared. BugReport Please");
            }
            search.dec_in_generator=true;
            // TODO If array or struct, need to set all elements to TRUE!!!
            //TODO true for all struc elements also code bbdD))k
            return JSON.parse(JSON.stringify(search));
        }
        //else, not in declaration:
        if (search === undefined) {
            //maybe this is a label. Check!
            if (bc_auxVars.current_function != -1) {
                search = bc_Big_ast.labels.find(obj => obj.name == var_name && obj.scope === bc_Big_ast.functions[bc_auxVars.current_function].name );
            }
            if (search === undefined) { //global search label
                search = bc_Big_ast.labels.find(obj => obj.name == var_name && obj.scope === "" );
            }
            if (search === undefined) {
                throw new SyntaxError("At line: "+line+". Using Variable '"+var_name+"' before declaration.");
            }
            return JSON.parse(JSON.stringify(search));
        }

        return JSON.parse(JSON.stringify(search));
    }

    function getMemoryObjectByLocation(loc, line) {
        let search, addr;

        if ( typeof(loc) === "number") {
            addr = loc;
        } else if (typeof (loc) === 'string') {
            addr = parseInt(loc, 16);
        } else throw new TypeError("wrong type in getMemoryObjectByLocation");

        search = bc_Big_ast.memory.find(obj => obj.location == addr );

        if (search === undefined) {
            throw new SyntaxError("At line: "+line+". No variable found at address '0x"+addr+"'.");
        }

        return JSON.parse(JSON.stringify(search));
    }


    //Handle function initialization
    function functionHeaderGenerator () {

        var Node;
        var fname= bc_Big_ast.functions[bc_auxVars.current_function].name;

        if (fname === "main") {
            writeAsmLine("__fn_"+fname+":");
            writeAsmLine("PCS");
            return;
        }

        writeAsmLine("JMP :"+"__fn_"+fname+"_end");
        writeAsmLine("__fn_"+fname+":");
        for (var i=bc_Big_ast.functions[bc_auxVars.current_function].arguments.length-1; i>=0; i--) {
            Node = bc_Big_ast.functions[bc_auxVars.current_function].arguments[i];
            writeAsmLine("POP @"+Node.asmName);
        }
    }

    //Handle function end
    function functionTailGenerator () {

        var fname = bc_Big_ast.functions[bc_auxVars.current_function].name;

        if (fname === "main") {
            if (bc_auxVars.assemblyCode.lastIndexOf("FIN")+4 != bc_auxVars.assemblyCode.length) {
                writeAsmLine("FIN");
            }
            return;
        }

        if (bc_auxVars.assemblyCode.lastIndexOf("RET")+4 != bc_auxVars.assemblyCode.length) {
            if ( bc_Big_ast.functions[bc_auxVars.current_function].return_type === "void" ) {
                writeAsmLine("RET");
            } else { // return zero to prevent stack overflow
                writeAsmLine("CLR @r0");
                writeAsmLine("PSH $r0");
                writeAsmLine("RET");
            }
        }
        writeAsmLine("__fn_"+fname+"_end:");
    }

    //Hot stuff!!! Assemble sentences!!
    function compileSentence( Sentence ){
        var sent_id;

        if (Sentence.type === "phrase") {
            writeAsmCode( codeGenerator( Sentence.OpTree ) );

        } else if (Sentence.type === "if_endif") {
            sent_id = "__if"+bc_auxVars.getNewJumpID();
            if (isEmpty(Sentence.ConditionOpTree)) {
                throw new TypeError("At line: " + Sentence.line + ". Condition can not be empty.");
            }
            writeAsmCode( codeGenerator(Sentence.ConditionOpTree, sent_id+"_endif"));
            Sentence.if_true.forEach( compileSentence );
            writeAsmLine( sent_id+"_endif:" );

        } else if (Sentence.type === "if_else") {
            sent_id = "__if"+bc_auxVars.getNewJumpID();
            if (isEmpty(Sentence.ConditionOpTree)) {
                throw new TypeError("At line: " + Sentence.line + ". Condition can not be empty.");
            }
            writeAsmCode( codeGenerator(Sentence.ConditionOpTree, sent_id+"_else") );
            Sentence.if_true.forEach( compileSentence );
            writeAsmLine( "JMP :" + sent_id + "_endif" );
            writeAsmLine( sent_id+"_else:" );
            Sentence.if_false.forEach( compileSentence );
            writeAsmLine( sent_id+"_endif:" );

        } else if (Sentence.type === "while") {
            sent_id = "__loop"+bc_auxVars.getNewJumpID();
            writeAsmLine( sent_id+"_continue:" );
            if (isEmpty(Sentence.ConditionOpTree)) {
                throw new TypeError("At line: " + Sentence.line + ". Condition can not be empty.");
            }
            writeAsmCode( codeGenerator(Sentence.ConditionOpTree, sent_id+"_break") );
            bc_auxVars.latest_loop_id.push(sent_id);
            Sentence.while_true.forEach( compileSentence );
            bc_auxVars.latest_loop_id.pop();
            writeAsmLine( "JMP :" + sent_id + "_continue" );
            writeAsmLine( sent_id+"_break:" );

        } else if (Sentence.type === "do") {
            sent_id = "__loop"+bc_auxVars.getNewJumpID();
            writeAsmLine( sent_id+"_continue:" );
            bc_auxVars.latest_loop_id.push(sent_id);
            Sentence.while_true.forEach( compileSentence );
            bc_auxVars.latest_loop_id.pop();
            if (isEmpty(Sentence.ConditionOpTree)) {
                throw new TypeError("At line: " + Sentence.line + ". Condition can not be empty.");
            }
            writeAsmCode( codeGenerator(Sentence.ConditionOpTree, sent_id+"_break") );
            writeAsmLine( "JMP :" + sent_id + "_continue" );
            writeAsmLine( sent_id+"_break:" );

        } else if (Sentence.type === "for") {
            sent_id = "__loop"+bc_auxVars.getNewJumpID();
            writeAsmCode( codeGenerator(Sentence.three_sentences[0].OpTree) );
            writeAsmLine( sent_id+"_condition:" );
            if (isEmpty(Sentence.three_sentences[1].OpTree)) {
                throw new TypeError("At line: " + Sentence.line + ". Condition can not be empty.");
            }
            writeAsmCode( codeGenerator(Sentence.three_sentences[1].OpTree, sent_id+"_break") );
            bc_auxVars.latest_loop_id.push(sent_id);
            Sentence.while_true.forEach( compileSentence );
            bc_auxVars.latest_loop_id.pop();
            writeAsmLine( sent_id+"_continue:" );
            writeAsmCode( codeGenerator(Sentence.three_sentences[2].OpTree));
            writeAsmLine( "JMP :" + sent_id + "_condition" );
            writeAsmLine( sent_id + "_break:" );

        } else if (Sentence.type === "struct") {
            return;
            //writeAsmCode( codeGenerator( Sentence.Phrase.OpTree ) );

        } else {
            throw new TypeError("At line: " + Sentence.line + ". Unknow Sentence type: " + Sentence.type);
        }
    }

    return bigastCompile_main();
}
