/* eslint-disable */
"use strict";

// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License


function generate(bc_Big_ast){

    // holds variables needed during compilation
    const bc_auxVars = {
        latest_loop_id: [],
        jump_id: 0,
        assemblyCode: "",
        current_function: -1,

        getNewJumpID: function (line) {
            var id="";
            if (bc_Big_ast.Config.enableLineLabels) {
                id+=line+"_";
            }
            if (bc_Big_ast.Config.enableRandom === true)
                return id+Math.random().toString(36).substr(2,5);

            this.jump_id++;
            return id+this.jump_id.toString(36);
        },

        getLatestLoopId: function () {
            //error check must be in code!
            return this.latest_loop_id[this.latest_loop_id.length-1];
        }
    };

    //main function for bigastCompile method, only run once.
    function bigastCompile_main(){

        // add Config Info
        configDeclarationGenerator();

        // add variables declaration
        if ( bc_Big_ast.Config.useVariableDeclaration) {
            bc_Big_ast.memory.forEach( assemblerDeclarationGenerator );
            writeAsmLine(""); //blank line to be nice to debugger!
        }

        // Add code for global sentences
        bc_auxVars.current_function = -1;
        bc_Big_ast.Global.sentences.forEach( compileSentence );

        // jump to main function, or program ends.
        if (bc_Big_ast.functions.find(obj => obj.name === "main") === undefined) {
            writeAsmLine("FIN");
        } else {
            writeAsmLine("JMP :__fn_main");
        }

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

        //Optimize code;
        if ( bc_Big_ast.Config.globalOptimization) {
            doGlobalOptimization();
        }

        return bc_auxVars.assemblyCode;
    }


    // Traverse the AST created by syntaxer and creates a stream of assembly
    //   instructions. Due to caracteristics of CIYAM assembly language, I
    //   decided to make use of auxiliary variables as registers because it
    //   is more effective than handle user stack.
    // cg_jumpTarget must be set if the evaluation is part of conditionals or
    //   loops. It shall be the location where to jump if the evaluated 
    //   expression is false.
    // cg_jumpNotTarget It is the jump location for complementary logic.
    // cg_revLogic to use reverse logic for expression evaluation.
    function codeGenerator(cg_ast, cg_jumpTarget, cg_jumpNotTarget, cg_revLogic) {

        const auxVars = {

            tmpvars: [ ],
            status:  [ ],
            postOperations: "",
            funcArgs: [],
            declaring: "",
            pointer_codecave: false,
            left_side_of_assignment: false,
            const_sentence: false,

            isTemp: function(loc) {
                if (loc == -1) return false;
                let MemObj=getMemoryObjectByLocation(loc);
                var id=this.tmpvars.indexOf(MemObj.name);
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
                var id=this.tmpvars.indexOf(MemObj.name);
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

            var code;

            if (cg_revLogic===undefined) {
                cg_revLogic=false;
            }

            if (cg_jumpTarget === undefined) {
                code=genCode(cg_ast, false, cg_revLogic, cg_jumpTarget, cg_jumpNotTarget);
                if (code.MemObj !== undefined && auxVars.isTemp(code.MemObj.address) && code.MemObj.type.indexOf("_ptr") == -1 ) {
                    if ( cg_ast.Operation === undefined || cg_ast.Operation.type !== "Function") {
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
                }
            } else {
                code=genCode(cg_ast,  true, cg_revLogic, cg_jumpTarget, cg_jumpNotTarget);
            }

            code.instructionset+=auxVars.postOperations;

            //optimizations for jumps and labels
            if (code.instructionset.indexOf(":") >=0) {
                if (cg_ast.type === "endASN") {
                    if (cg_ast.Token.type === "Keyword" && cg_ast.Token.value === "label") {
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
        function divHexContents(param1, param2){
            let n1, n2;
            if (typeof (param1) === "number") {
                n1 = BigInt(param1);
            } else if (typeof (param1) === 'string') {
                n1 = BigInt("0x"+param1);
            } else throw new TypeError("wrong type in divHexContents");

            if (typeof (param2) === "number") {
                n2 = BigInt(param2);
            } else if (typeof (param1) === 'string') {
                n2 = BigInt("0x"+param2);
            } else throw new TypeError("wrong type in divHexContents");

            return (n1/n2).toString(16).padStart(16,"0").slice(-16);
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
        function subHexContents(param1, param2){
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

            let sub=n1-n2;
            if (sub < 0) {
                sub+=18446744073709551616n;
            }
            return sub.toString(16).padStart(16,"0").slice(-16);
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
                address: -1,
                name: "",
                asmName: "",
                type: "constant",
                typeDefinition: null,
                scope: "",
                size: 1,
                declaration: "long",
                isDeclared: true,
                hexContent: param };
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
        function genNotEqualToken(){
            return { "type": "Comparision", "precedence": 6, "value": "!="};
        }
        // here the hardwork to compile expressions
        function genCode(objTree, logicalOp, gc_revLogic, gc_jumpFalse, gc_jumpTrue) {

            let LGenObj, RGenObj, CGenObj;
            let M_Obj;
            let instructionstrain="";

            if (objTree.type === 'endASN' /*objTree.Operation === undefined*/) { //end object

                if (objTree.Token === undefined /* isEmpty(objTree)*/) {
                    return { instructionset: "" };
                }

                if (logicalOp === true) {
                    if (objTree.Token.type === "Constant") {
                        if (gc_revLogic === false)
                            if (objTree.Token.value === "0000000000000000")
                                return { instructionset: createInstruction({type: "Jump"}, gc_jumpFalse)};
                            else
                                return { instructionset: "" };
                        else
                            if (objTree.Token.value !== "0000000000000000")
                                return { instructionset: createInstruction({type: "Jump"}, gc_jumpTrue)};
                            else
                                return { instructionset: "" };
                    }
                    if (objTree.Token.type === "Variable") {
                        LGenObj=genCode(objTree, false, gc_revLogic);
                        instructionstrain+=LGenObj.instructionset;
                        instructionstrain+=createInstruction(genNotEqualToken() ,LGenObj.MemObj, createConstantMemObj(0), gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        auxVars.freeRegister(LGenObj.MemObj.address);
                        return { instructionset: instructionstrain } ;
                    }
                    throw new TypeError("At line: "+objTree.Token.line+". Object type '"+objTree.Token.type+" at logical operation... Do not know what to do.");
                } else {

                    if (objTree.Token.type === 'Variable') {
                        M_Obj = getMemoryObjectByName(objTree.Token.value, objTree.Token.line, auxVars.declaring);
                        if (bc_Big_ast.Config.useVariableDeclaration === false) {
                            if (auxVars.pointer_codecave) {
                                M_Obj.type+="_ptr";
                            }
                        }
                        return {MemObj: M_Obj, instructionset: instructionstrain }
                    }

                    if (objTree.Token.type === 'Keyword'){

                        if (objTree.Token.value === 'break' || objTree.Token.value === 'continue'
                            || objTree.Token.value === 'label' || objTree.Token.value === 'asm'
                            || objTree.Token.value === 'exit' || objTree.Token.value === 'halt') {
                            return { instructionset: createInstruction( objTree.Token ) };
                        }

                        if (objTree.Token.value === 'return') { // this is 'return;'
                            if (bc_auxVars.current_function == -1 ) {
                                throw new TypeError("At line: "+objTree.Token.line+". Can not use 'return' in global statements.");
                            }
                            if (bc_Big_ast.functions[bc_auxVars.current_function].declaration !== 'void') {
                                throw new TypeError("At line: "+objTree.Token.line+". Function '"
                                       +bc_Big_ast.functions[bc_auxVars.current_function].name+"' must return a '"
                                       +bc_Big_ast.functions[bc_auxVars.current_function].declaration+"' value.");
                            }
                            if (bc_Big_ast.functions[bc_auxVars.current_function].name === 'main') {
                                return { instructionset: createInstruction( { type: 'Keyword', value: 'exit' } ) };
                            }
                            return { instructionset: createInstruction( objTree.Token ) };
                        }

                        if (objTree.Token.value === 'sleep' || objTree.Token.value === 'goto') {
                            throw new TypeError("At line: "+objTree.Token.line+". Missing argument for keyword '"+objTree.Token.value+"'.");
                        }

                        if (objTree.Token.value === 'const') {
                            throw new TypeError("At line: "+objTree.Token.line+". Missing statement for keyword '"+objTree.Token.value+"'.");
                        }

                        throw new TypeError("At line: "+objTree.Token.line+". Keywords '"+objTree.Token.value+"' not implemented.");
                    }

                    if (objTree.Token.type === 'Constant') { //ok
                        M_Obj = createConstantMemObj();
                        M_Obj.size = objTree.Token.value.length/16;
                        M_Obj.hexContent = objTree.Token.value;
                        if (auxVars.pointer_codecave===true) {
                            M_Obj.type+="_ptr";
                        }
                        return { MemObj: M_Obj, instructionset: "" } ;
                    }
                    throw new TypeError("At line:"+objTree.Token.line+". End object not implemented: "+objTree.Token.type+" "+objTree.Token.name);
                    //return { instructionset: "" };
                }

            } else if (objTree.type === 'lookupASN') {


                if (objTree.Token.type !== 'Variable') {
                    throw new TypeError(`At line: ${objTree.Token.line}. Modifiers implemented only for variables`);
                }
                M_Obj = getMemoryObjectByName(objTree.Token.value, objTree.Token.line, auxVars.declaring);

                    let array_idx=-1;
                    //for (let idx=0; idx < objTree.Token.variableModifier.length; idx++){
                    objTree.modifiers.forEach( CurrentModifier => {

                        if (CurrentModifier.type === "MemberByRef") {
                            let TypeD = bc_Big_ast.typesDefinitions.find( obj => obj.type==="struct" && obj.name===M_Obj.typeDefinition );
                            if (TypeD === undefined) {
                                throw new TypeError("At line: "+objTree.Token.line+". Array type definition not found...");
                            }
                            if (CurrentModifier.Center.type !== "Variable") {
                                throw new TypeError("At line: "+objTree.Token.line+". Can not use variables as struct members.");
                            }
                            if (M_Obj.declaration !== "struct_ptr") {
                                throw new TypeError("At line: "+objTree.Token.line+". Variable '"+M_Obj.name+"' not defined as struct pointer.");
                            }
                            let member_name = CurrentModifier.Center.value;
                            let member_id = -1;
                            for (let i=0; i< TypeD.structAccumulatedSize.length; i++) {
                                if (TypeD.structAccumulatedSize[i][0] === member_name) {
                                    member_id = i;
                                    break;
                                }
                            }
                            if (member_id == -1) {
                                throw new TypeError("At line: "+objTree.Token.line+". Member '"+member_name+"' not found on struct type definition.");
                            }

                            let TmpMemObj;
                            if (M_Obj.offset_type === undefined) {
                                let adder=0;
                                if (TypeD.structMembers[member_id].type === "array") {
                                    adder = 1;
                                }
                                M_Obj.declaration=TypeD.structMembers[member_id].declaration;
                                M_Obj.name=TypeD.structMembers[member_id].name;
                                M_Obj.typeDefinition=TypeD.structMembers[member_id].typeDefinition;
                                if (TypeD.structMembers[member_id].type === "array"){
                                    M_Obj.type=TypeD.structMembers[member_id].type;
                                }
                                array_idx=-1;
                                M_Obj.offset_type = "constant";
                                M_Obj.offset_value = addHexContents(adder, TypeD.structAccumulatedSize[member_id][1]);

                            } else if (M_Obj.offset_type === "constant") {
                                throw new TypeError("At line: "+objTree.Token.line+". Inspection needed.");

                            } else /* if (M_Obj.offset_type === "variable")*/ {
                                throw new TypeError("At line: "+objTree.Token.line+". Inspection needed.");
                            }
                        }

                        if (CurrentModifier.type === "MemberByVal") {
                            let TypeD;
                            if (M_Obj.arrayItemType === "struct") { // array of struct
                                TypeD = bc_Big_ast.typesDefinitions.find( obj => obj.type==="struct" && obj.name===M_Obj.arrayItemTypeDefinition );
                            } else { //regular case
                                TypeD = bc_Big_ast.typesDefinitions.find( obj => obj.type==="struct" && obj.name===M_Obj.typeDefinition );
                            }
                            if (TypeD === undefined) {
                                throw new TypeError("At line: "+objTree.Token.line+". Array type definition not found...");
                            }
                            if (CurrentModifier.Center.type !== "Variable") {
                                throw new TypeError("At line: "+objTree.Token.line+". Can not use variables as struct members.");
                            }
                            if (M_Obj.declaration === "struct_ptr") {
                                throw new TypeError("At line: "+objTree.Token.line+". Using wrong member notation. Try to use '->' instead.");
                            }
                            let member_name = CurrentModifier.Center.value;
                            let member_id = -1;
                            for (let i=0; i< TypeD.structAccumulatedSize.length; i++) {
                                if (TypeD.structAccumulatedSize[i][0] === member_name) {
                                    member_id = i;
                                    break;
                                }
                            }
                            if (member_id == -1) {
                                throw new TypeError("At line: "+objTree.Token.line+". Member '"+member_name+"' not found on struct type definition.");
                            }

                            if (M_Obj.offset_type === undefined) {
                                M_Obj = getMemoryObjectByLocation(addHexContents(M_Obj.hexContent, TypeD.structAccumulatedSize[member_id][1] ));
                                array_idx=-1;

                            } else if (M_Obj.offset_type === "constant") {
                                let adder = addHexContents(M_Obj.offset_value, M_Obj.hexContent);
                                M_Obj = getMemoryObjectByLocation(addHexContents(adder, TypeD.structAccumulatedSize[member_id][1] ));
                                array_idx=-1;

                            } else /* if (M_Obj.offset_type === "variable")*/ {
                                let adder=0;
                                if (TypeD.structMembers[member_id].type === "array") {
                                    adder = 1;
                                }
                                instructionstrain += createInstruction(genAddToken(objTree.Token.line),
                                                     getMemoryObjectByLocation(M_Obj.offset_value, objTree.Token.line),
                                                     createConstantMemObj( addHexContents(adder, TypeD.structAccumulatedSize[member_id][1]) ));
                                M_Obj.declaration=TypeD.structMembers[member_id].declaration;
                                M_Obj.name=TypeD.structMembers[member_id].name;
                                M_Obj.typeDefinition=TypeD.structMembers[member_id].typeDefinition;
                                array_idx=-1;
                            }
                        }

                        if (CurrentModifier.type === "Array") {
                            if (bc_Big_ast.Config.useVariableDeclaration === false){
                                throw new TypeError ("At line: "+objTree.Token.line+". Can not use arrays if 'useVariableDefinition' is 'false'");
                            }
                            array_idx++;
                            let TmpMemObj;
                            let pointer_operation = false;
                            let TypeD; // = bc_Big_ast.typesDefinitions.find( obj => obj.type==="array" && obj.name===objTree.Token.value );
                            if (M_Obj.typeDefinition === undefined) {//array of structs
                                TypeD = bc_Big_ast.typesDefinitions.find( obj => obj.type==="array" && obj.name===M_Obj.name );
                            } else if (objTree.Token.value === M_Obj.name) { //array simple
                                TypeD = bc_Big_ast.typesDefinitions.find( obj => obj.type==="array" && obj.name===M_Obj.typeDefinition );
                            } else { // array inside struct
                                TypeD = bc_Big_ast.typesDefinitions.find( obj => obj.type==="array" && obj.name.indexOf("_"+M_Obj.typeDefinition) > 0 );
                            }
                            if (TypeD === undefined) {
                                if (M_Obj.declaration.indexOf("_ptr") == -1) {
                                    throw new TypeError("At line: "+objTree.Token.line+". Array type definition not found. Is '"+M_Obj.name+"' declared as array or pointer?");
                                }
                                pointer_operation = true; //allow use of array notation on pointer variables.
                            }
                            if (M_Obj.type !== "array" && M_Obj.type !== "struct" && M_Obj.offset_type !== undefined){
                                throw new TypeError("At line: "+objTree.Token.line+". Can not use array notation on regular variables.");
                            }

                            // allow some paranauê
                            let oldLeftState = auxVars.left_side_of_assignment;
                            auxVars.left_side_of_assignment = false;

                            let Param_Obj = genCode(CurrentModifier.Center, false, false); // gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                            instructionstrain+=Param_Obj.instructionset;

                            // undo paranauê
                            auxVars.left_side_of_assignment = oldLeftState;

                            if (M_Obj.declaration.indexOf("_ptr") > 0) {
                                M_Obj.declaration = M_Obj.declaration.slice(0,-4);
                            }

                            if (Param_Obj.MemObj === undefined) { //special case for text assignment
                                return {MemObj: M_Obj, instructionset: instructionstrain }
                            }
                            //big decision tree depending on M_Obj.offset_value and Param_Obj.address
                            let mobj_offvalue = M_Obj.offset_value; // undefined if does not exist, "constant", or variable address that can be temp or not (will be checked!)
                            if (typeof(M_Obj.offset_value) === "string") {
                                mobj_offvalue = -1; //only if offset_type is constant 
                            }
                            let param_loc = Param_Obj.MemObj.address; //-1 if it is constant, other value represents a variable that can be temp or not (will be checked!)

                            if (mobj_offvalue === undefined) {
                                if (param_loc == -1 ) {
                                    if (pointer_operation) {
                                        TmpMemObj = auxVars.getNewRegister();
                                        instructionstrain += createInstruction(genAssignmentToken(), TmpMemObj, Param_Obj.MemObj);
                                        M_Obj.type = "array";
                                        M_Obj.offset_type = "variable";
                                        M_Obj.offset_value = TmpMemObj.address;
                                    } else {
                                        M_Obj.offset_type = "constant";
                                        M_Obj.offset_value = mulHexContents(Param_Obj.MemObj.hexContent, TypeD.arrayMultiplierDim[array_idx]);
                                    }
                                } else if (auxVars.isTemp(param_loc)) {
                                    if (pointer_operation) {
                                        M_Obj.type = "array";
                                    } else {
                                        instructionstrain += createInstruction(genMulToken(objTree.Token.line), Param_Obj.MemObj, createConstantMemObj(TypeD.arrayMultiplierDim[array_idx]));
                                    }
                                    M_Obj.offset_type = "variable";
                                    M_Obj.offset_value = Param_Obj.MemObj.address;

                                } else /* if ( param_loc is variable ) */ {
                                    M_Obj.offset_type = "variable";
                                    if (pointer_operation || TypeD.arrayMultiplierDim[array_idx] == 1) {
                                        if (pointer_operation) {
                                            M_Obj.type = "array";
                                        }
                                        M_Obj.offset_value = Param_Obj.MemObj.address;
                                    } else {
                                        TmpMemObj = auxVars.getNewRegister();
                                        instructionstrain += createInstruction(genAssignmentToken(), TmpMemObj, Param_Obj.MemObj);
                                        M_Obj.offset_value = TmpMemObj.address;
                                        instructionstrain += createInstruction(genMulToken(objTree.Token.line), TmpMemObj, createConstantMemObj(TypeD.arrayMultiplierDim[array_idx]));
                                    }
                                }

                            } else if (mobj_offvalue === -1 ) {
                                if (param_loc == -1) {
                                    M_Obj.offset_value = addHexContents(M_Obj.offset_value, mulHexContents(Param_Obj.MemObj.hexContent, TypeD.arrayMultiplierDim[array_idx]));

                                } else if (auxVars.isTemp(param_loc)) {
                                    instructionstrain += createInstruction(genMulToken(objTree.Token.line), Param_Obj.MemObj, createConstantMemObj(TypeD.arrayMultiplierDim[array_idx]));
                                    instructionstrain += createInstruction(genAddToken(objTree.Token.line), Param_Obj.MemObj, createConstantMemObj(M_Obj.offset_value));
                                    M_Obj.offset_type = "variable";
                                    M_Obj.offset_value = Param_Obj.MemObj.address;

                                } else /* if ( param_loc is variable  ) */ {
                                    if (TypeD.arrayMultiplierDim[array_idx] == 1 && M_Obj.offset_value === "0000000000000000") {
                                        M_Obj.offset_type = "variable";
                                        M_Obj.offset_value = Param_Obj.MemObj.address;
                                    } else {
                                        TmpMemObj = auxVars.getNewRegister();
                                        instructionstrain += createInstruction(genAssignmentToken(), TmpMemObj, Param_Obj.MemObj);
                                        instructionstrain += createInstruction(genMulToken(objTree.Token.line), TmpMemObj, createConstantMemObj(TypeD.arrayMultiplierDim[array_idx]));
                                        instructionstrain += createInstruction(genAddToken(objTree.Token.line), TmpMemObj, createConstantMemObj(M_Obj.offset_value));
                                        M_Obj.offset_type = "variable";
                                        M_Obj.offset_value = TmpMemObj.address;
                                    }
                                }

                            } else if (auxVars.isTemp(mobj_offvalue)) {
                                if (param_loc == -1 ) {
                                    let adder = mulHexContents(Param_Obj.MemObj.hexContent, TypeD.arrayMultiplierDim[array_idx]);
                                    instructionstrain += createInstruction(genAddToken(objTree.Token.line), getMemoryObjectByLocation(M_Obj.offset_value, objTree.Token.line), createConstantMemObj(  adder  ));

                                } else if (auxVars.isTemp(param_loc)) {
                                    instructionstrain+=createInstruction(genMulToken(objTree.Token.line), Param_Obj.MemObj, createConstantMemObj(TypeD.arrayMultiplierDim[array_idx]));
                                    instructionstrain+=createInstruction(genAddToken(objTree.Token.line), getMemoryObjectByLocation(M_Obj.offset_value, objTree.Token.line), Param_Obj.MemObj);
                                    auxVars.freeRegister(Param_Obj.MemObj.address);

                                } else /* if (param_loc is variable ) */ {
                                    if (TypeD.arrayMultiplierDim[array_idx] == 1) {
                                        instructionstrain+=createInstruction(genAddToken(objTree.Token.line), getMemoryObjectByLocation(M_Obj.offset_value, objTree.Token.line), Param_Obj.MemObj);
                                    } else {
                                        TmpMemObj = auxVars.getNewRegister();
                                        instructionstrain+=createInstruction(genAssignmentToken(), TmpMemObj, Param_Obj.MemObj);
                                        instructionstrain+=createInstruction(genMulToken(objTree.Token.line), TmpMemObj, createConstantMemObj(TypeD.arrayMultiplierDim[array_idx]));
                                        instructionstrain+=createInstruction(genAddToken(objTree.Token.line), getMemoryObjectByLocation(M_Obj.offset_value, objTree.Token.line), TmpMemObj);
                                        auxVars.freeRegister(TmpMemObj.address);
                                    }
                                }

                            } else /* if ( mobj_offvalue is variable ) */ {
                                if (param_loc == -1 ) {
                                    if (Param_Obj.MemObj.hexContent !== "0000000000000000") {
                                        TmpMemObj = auxVars.getNewRegister();
                                        instructionstrain+=createInstruction(genAssignmentToken(), TmpMemObj,  createConstantMemObj(Param_Obj.MemObj.hexContent));
                                        if (!pointer_operation){
                                            instructionstrain+=createInstruction(genMulToken(objTree.Token.line), TmpMemObj, createConstantMemObj(TypeD.arrayMultiplierDim[array_idx]));
                                        }
                                        instructionstrain+=createInstruction(genAddToken(objTree.Token.line), TmpMemObj, getMemoryObjectByLocation(M_Obj.offset_value, objTree.Token.line));
                                        M_Obj.offset_value= TmpMemObj.address;
                                    }

                                } else if (auxVars.isTemp(param_loc)) {
                                    if (!pointer_operation){
                                        instructionstrain+=createInstruction(genMulToken(objTree.Token.line), Param_Obj.MemObj, createConstantMemObj(TypeD.arrayMultiplierDim[array_idx]));
                                    }
                                    instructionstrain+=createInstruction(genAddToken(objTree.Token.line), Param_Obj.MemObj, getMemoryObjectByLocation(M_Obj.offset_value, objTree.Token.line));
                                    M_Obj.offset_value = Param_Obj.MemObj.address;

                                } else /* if (param_loc is variable )) */ {
                                    TmpMemObj = auxVars.getNewRegister();
                                    instructionstrain+=createInstruction(genAssignmentToken(), TmpMemObj, Param_Obj.MemObj);
                                    if (!pointer_operation){
                                        instructionstrain+=createInstruction(genMulToken(objTree.Token.line), TmpMemObj, createConstantMemObj(TypeD.arrayMultiplierDim[array_idx]));
                                    }
                                    instructionstrain+=createInstruction(genAddToken(objTree.Token.line), TmpMemObj, getMemoryObjectByLocation(M_Obj.offset_value, objTree.Token.line));
                                    M_Obj.offset_value = TmpMemObj.address;
                                }
                            }
                        }
                    })

                    //Fix special case where struct pointer with array member with constant index has incomplete information.
                    // This does not allow constants on struct: code Yyx_sSkA
                    if (M_Obj.hexContent === undefined && M_Obj.offset_type === "constant") {
                        let TmpMemObj = auxVars.getNewRegister();
                        instructionstrain+=createInstruction(genAssignmentToken(), TmpMemObj, createConstantMemObj(M_Obj.offset_value));
                        M_Obj.offset_type = "variable";
                        M_Obj.offset_value = TmpMemObj.address;
                    }

                    if (logicalOp === true) {
                        instructionstrain+=createInstruction(genNotEqualToken() ,M_Obj, createConstantMemObj(0), gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        auxVars.freeRegister(M_Obj.offset_value);
                        auxVars.freeRegister(M_Obj.address);
                        return { instructionset: instructionstrain };
                    }

                    return {MemObj: M_Obj, instructionset: instructionstrain }

            } else { //operation object

                let TmpMemObj;

                if (objTree.Operation.type === 'Function') {

                    let isAPI=false;
                    let APIargs=[];
                    let sub_sentences;

                    let search = bc_Big_ast.functions.find(val => val.name === objTree.Left.Token.value );
                    if (search === undefined) {
                        if (bc_Big_ast.Config.APIFunctions){
                            search = bc_Big_ast.Global.APIFunctions.find(val => val.name === objTree.Left.Token.value );
                            if (search === undefined) {
                                throw new TypeError("At line: "+objTree.Left.Token.line+". Function '"+objTree.Left.Token.value+"' not declared.");
                            }
                            isAPI = true;
                        } else {
                            throw new TypeError("At line: "+objTree.Left.Token.line+". Function '"+objTree.Left.Token.value+"' not declared.");
                        }
                    }

                    if (isAPI){
                        if (search.declaration === "void") {
                            TmpMemObj = undefined;
                        } else {
                            TmpMemObj=auxVars.getNewRegister(); //reserve tempvar for return type
                        }

                        sub_sentences = splitSubSentences(objTree.Right);
                        if (sub_sentences[0].type === "endASN" && sub_sentences[0].Token === undefined) {
                            sub_sentences.pop();
                        }
                        if (sub_sentences.length != search.argsMemObj.length){
                            throw new TypeError("At line: "+objTree.Left.Token.line+". Wrong number of arguments for function '"+search.name+"'. It must have '"+search.argsMemObj.length+"' args.");
                        }
                        
                        sub_sentences.forEach( stnc => {
                            RGenObj=genCode(stnc, false, false );
                            instructionstrain+=RGenObj.instructionset;
                            if (bc_Big_ast.Config.useVariableDeclaration){
                                if (RGenObj.MemObj.declaration.indexOf("_ptr") != -1) {
                                    if (bc_Big_ast.Config.warningToError) {
                                        throw new TypeError("WARNING: At line: "+objTree.Operation.line+". API Function parameter type is different from variable: 'long' and '"+RGenObj.MemObj.declaration+"'.");
                            }   }   }
                            APIargs.push( RGenObj.MemObj );
                        });

                        instructionstrain+=createInstruction( {type: "APICall", value: search.asmName}, TmpMemObj, APIargs);
                        APIargs.forEach(varnm => auxVars.freeRegister(varnm.address));

                        if (search.declaration === "void") {
                            return { instructionset: instructionstrain } ;
                        }

                        if (TmpMemObj.MemObj !== undefined && logicalOp === true) { //maybe logical operation was requested
                            instructionstrain+=createInstruction(genNotEqualToken() ,TmpMemObj.MemObj, createConstantMemObj(0), gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                            auxVars.freeRegister(CGenOTmpMemObjbj.MemObj.address);
                            return { instructionset: instructionstrain };
                        }

                        return { MemObj: TmpMemObj, instructionset: instructionstrain } ;

                    } else { // if is regular function call
                        if (bc_auxVars.current_function >=0 && search.name === bc_Big_ast.functions[bc_auxVars.current_function].name) {
                            throw new TypeError("At line: "+objTree.Left.Token.line+". Recursive functions not allowed.");
                        }

                        //Save registers currently in use in stack. Function execution will overwrite them
                        let stack_registers=[];
                        for (let i=auxVars.status.length-1; i>=0; i--) {
                            if (auxVars.status[i] === true) {
                                instructionstrain+=createInstruction({type: "Push"} , getMemoryObjectByName(auxVars.tmpvars[i], objTree.Operation.line) );
                                stack_registers.push(i);
                            }
                        }

                        sub_sentences = splitSubSentences(objTree.Right);
                        if (sub_sentences[0].type === "endASN" && sub_sentences[0].Token === undefined) {
                            sub_sentences.pop();
                        }
                        if (sub_sentences.length != search.argsMemObj.length){
                            throw new TypeError("At line: "+objTree.Left.Token.line+". Wrong number of arguments for function '"+search.name+"'. It must have '"+search.argsMemObj.length+"' args.");
                        }
                        for (let i=sub_sentences.length-1; i>=0; i--) {
                            RGenObj=genCode(sub_sentences[i], false, false );

                            if (bc_Big_ast.Config.useVariableDeclaration){
                                if ( !auxVars.isTemp(RGenObj.MemObj.address) ){
                                    let fn_arg = search.argsMemObj[i];
                                    if (fn_arg.declaration != RGenObj.MemObj.declaration){
                                        if (fn_arg.declaration.indexOf("_ptr") == -1 || RGenObj.MemObj.declaration.indexOf("_ptr") == -1 ) {//skipt check if both sides are pointers
                                            if (bc_Big_ast.Config.warningToError) {
                                                throw new TypeError("WARNING: At line: "+objTree.Operation.line+". Function parameter type is different from variable: '"+fn_arg.declaration+"' and '"+RGenObj.MemObj.declaration+"'.");
                            }   }   }   }   }

                            instructionstrain+=RGenObj.instructionset;
                            instructionstrain+=createInstruction( {type: "Push"} , RGenObj.MemObj );
                            auxVars.freeRegister(RGenObj.MemObj.address);
                        }

                        instructionstrain+=createInstruction( objTree.Operation, objTree.Left.Token.value );

                        if (search.declaration !== "void") {
                            TmpMemObj=auxVars.getNewRegister();
                            TmpMemObj.declaration = search.declaration;
                            instructionstrain+=createInstruction( { type: "Pop"}, TmpMemObj );
                        }

                        //Load registers again
                        while (stack_registers.length > 0) {
                            instructionstrain+=createInstruction({type: "Pop"} , getMemoryObjectByName(auxVars.tmpvars[stack_registers.pop()], objTree.Operation.line) );
                        }

                        if (search.declaration === "void") {
                            return { instructionset: instructionstrain } ;
                        }

                        if (TmpMemObj.MemObj !== undefined && logicalOp === true) { //maybe logical operation was requested
                            instructionstrain+=createInstruction(genNotEqualToken() ,TmpMemObj.MemObj, createConstantMemObj(0), gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                            auxVars.freeRegister(CGenOTmpMemObjbj.MemObj.address);
                            return { instructionset: instructionstrain };
                        }

                        return { MemObj: TmpMemObj, instructionset: instructionstrain } ;
                    }
                }

                if (objTree.Operation.type === 'UnaryOperator') {

                    if (objTree.Operation.value === "!") { //logical NOT

                        if (logicalOp === true) {
                            return genCode(objTree.Center, true, !gc_revLogic, gc_jumpTrue, gc_jumpFalse);

                        } else {

                            let IDNotSF, IDNotST, IDEnd, rnd;

                            rnd=bc_auxVars.getNewJumpID(objTree.Operation.line);

                            IDNotSF = "__NOT_"+rnd+"_sF";//set false
                            IDNotST = "__NOT_"+rnd+"_sT";//set true
                            IDEnd   = "__NOT_"+rnd+"_end";

                            CGenObj=genCode(objTree.Center, true, !gc_revLogic, IDNotST, IDNotSF);
                            instructionstrain+=CGenObj.instructionset;

                            if (CGenObj.MemObj !== undefined && auxVars.isTemp(CGenObj.MemObj.address)) { //maybe it was an arithmetic operation
                                instructionstrain+=createInstruction(genNotEqualToken() ,CGenObj.MemObj, createConstantMemObj(0), !gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                            }

                            TmpMemObj=auxVars.getNewRegister();
                            instructionstrain += createInstruction({type: "Label"},IDNotST);
                            instructionstrain += createInstruction(genAssignmentToken(),TmpMemObj,createConstantMemObj(1));
                            instructionstrain += createInstruction({type: "Jump"}, IDEnd);
                            instructionstrain += createInstruction({type: "Label"},IDNotSF);
                            instructionstrain += createInstruction(genAssignmentToken(),TmpMemObj,createConstantMemObj(0));
                            instructionstrain += createInstruction({type: "Label"}, IDEnd);

                            if (CGenObj.MemObj !== undefined) {
                                auxVars.freeRegister(CGenObj.MemObj.address);
                            }
                            return { MemObj: TmpMemObj, instructionset: instructionstrain };
                        }
                    }

                    // Other Unary Objects, not logic.

                    if (objTree.Operation.value === "+") { //unary plus -> do nothing
                        if (auxVars.left_side_of_assignment === true) {
                            throw new TypeError("At line: "+objTree.Operation.line+". Can not have unary operator '+' on left side of assignment.");
                        }
                        return genCode(objTree.Center, logicalOp, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                    }

                    if (objTree.Operation.value === "*") { //unary star -> pointer operation

                        if (auxVars.declaring.length != 0) {
                            // do not do any other operation when declaring a pointer.
                            return genCode(objTree.Center, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        }

                        CGenObj=genCode(objTree.Center, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        instructionstrain+=CGenObj.instructionset;
        
                        if (logicalOp === true) {
                            CGenObj.MemObj.type  += "_ptr";
                            instructionstrain+=createInstruction(genNotEqualToken() ,CGenObj.MemObj, createConstantMemObj(0), gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                            auxVars.freeRegister(CGenObj.MemObj.address);
                            return { instructionset: instructionstrain };
                        }

                        if (bc_Big_ast.Config.useVariableDeclaration){
                            if (CGenObj.MemObj.declaration.lastIndexOf("_ptr") != CGenObj.MemObj.declaration.length - 4) {
                                if ( !auxVars.isTemp(CGenObj.MemObj.address) ) { // do not care about temp variables
                                    if (bc_Big_ast.Config.warningToError) {
                                        throw new TypeError("At line: "+objTree.Operation.line+". Trying to read content of Variable '"+objTree.Center.Token.value+"' that is not declared as pointer.");
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
                            auxVars.freeRegister(CGenObj.MemObj.address);
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
                        auxVars.freeRegister(CGenObj.MemObj.address)

                        if (logicalOp === true) {
                            instructionstrain+=createInstruction(genNotEqualToken() ,TmpMemObj, createConstantMemObj(0), gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                            auxVars.freeRegister(TmpMemObj.address);
                            return { instructionset: instructionstrain };
                        }

                        return { MemObj: TmpMemObj, instructionset: instructionstrain } ;
                    }

                    if (objTree.Operation.value === "~") {
                        let clear_var=false;

                        if (!auxVars.isTemp(CGenObj.MemObj.address)){
                            TmpMemObj=auxVars.getNewRegister();
                            instructionstrain+=createInstruction(genAssignmentToken(),TmpMemObj,CGenObj.MemObj);
                            clear_var = true;
                        } else {
                            TmpMemObj=CGenObj.MemObj;
                        }
                        instructionstrain+= createInstruction(objTree.Operation, TmpMemObj);

                        if (logicalOp === true) {
                            instructionstrain+=createInstruction(genNotEqualToken() ,TmpMemObj, createConstantMemObj(0), gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                            auxVars.freeRegister(CGenObj.MemObj.address);
                            auxVars.freeRegister(TmpMemObj.address);
                            return { instructionset: instructionstrain };
                        }

                        if (clear_var){
                            auxVars.freeRegister(CGenObj.MemObj.address);
                        }

                        return { MemObj: TmpMemObj, instructionset: instructionstrain } ;
                    }

                    if (objTree.Operation.value === "&") {
                        if (cg_jumpTarget !== undefined)
                            throw new SyntaxError("At line: "+objTree.Operation.line+". Can not use UnaryOperator '&' during logical operations with branches");
                        if (gc_jumpFalse !== undefined)
                            throw new SyntaxError("At line: "+objTree.Operation.line+". Can not use UnaryOperator '&' during logical operations with branches");
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
                                    TmpMemObj = createConstantMemObj( addHexContents(CGenObj.MemObj.hexContent, CGenObj.MemObj.offset_value) );
                                } else {
                                    let Copyvar = JSON.parse(JSON.stringify(CGenObj.MemObj));
                                    delete Copyvar.offset_type;
                                    delete Copyvar.offset_value;
                                    TmpMemObj=auxVars.getNewRegister();
                                    instructionstrain+=createInstruction(genAssignmentToken(), TmpMemObj, Copyvar);
                                    instructionstrain+=createInstruction(genAddToken(), TmpMemObj, getMemoryObjectByLocation(CGenObj.MemObj.offset_value));
                                }
                            } else {
                                TmpMemObj = createConstantMemObj(CGenObj.MemObj.address);
                            }
                        } else if (CGenObj.MemObj.type === "struct") {
                            TmpMemObj = createConstantMemObj(CGenObj.MemObj.hexContent);
                        } else if (CGenObj.MemObj.type === "long" || CGenObj.MemObj.type === "long_ptr" || CGenObj.MemObj.type === "struct_ptr" ) {
                            TmpMemObj = createConstantMemObj(CGenObj.MemObj.address);
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

                    if (auxVars.left_side_of_assignment) {
                        throw new SyntaxError(`At line: ${objTree.Operation.line}. Can not use SetUnaryOperator '${objTree.Operation.value}' on left side or assignment.`);
                    }

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

                if (objTree.Operation.type === 'CodeCave') {

                    return genCode(objTree.Center, logicalOp, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                }

                if (objTree.Operation.type === "Comparision") {

                    if (logicalOp === false && gc_jumpFalse === undefined) {// need to transform arithmetic to logical

                        let IDCompSF, IDCompST, IDEnd, rnd, ret;

                        rnd=bc_auxVars.getNewJumpID(objTree.Operation.line);

                        IDCompSF = "__CMP_"+rnd+"_sF";//set false
                        IDCompST = "__CMP_"+rnd+"_sT";//set true
                        IDEnd    = "__CMP_"+rnd+"_end";

                        if (objTree.Operation.value === "||") { // Code optimization
                            ret=genCode(objTree, true, true, IDCompSF, IDCompST); //do it again, now with jump defined
                            instructionstrain+=ret.instructionset;
                            TmpMemObj=auxVars.getNewRegister();
                            instructionstrain += createInstruction({type: "Label"},IDCompSF);
                            instructionstrain += createInstruction(genAssignmentToken(),TmpMemObj,createConstantMemObj(0));
                            instructionstrain += createInstruction({type: "Jump"}, IDEnd);
                            instructionstrain += createInstruction({type: "Label"},IDCompST);
                            instructionstrain += createInstruction(genAssignmentToken(),TmpMemObj,createConstantMemObj(1));
                            instructionstrain += createInstruction({type: "Label"}, IDEnd);
                        } else {
                            gc_jumpTrue=IDCompST;
                            ret=genCode(objTree, true ,false, IDCompSF, IDCompST); //do it again, now with jump defined
                            instructionstrain+=ret.instructionset;
                            TmpMemObj=auxVars.getNewRegister();
                            instructionstrain += createInstruction({type: "Label"},IDCompST);
                            instructionstrain += createInstruction(genAssignmentToken(),TmpMemObj,createConstantMemObj(1));
                            instructionstrain += createInstruction({type: "Jump"}, IDEnd);
                            instructionstrain += createInstruction({type: "Label"},IDCompSF);
                            instructionstrain += createInstruction(genAssignmentToken(),TmpMemObj,createConstantMemObj(0));
                            instructionstrain += createInstruction({type: "Label"}, IDEnd);
                        }

                        auxVars.freeRegister(ret.address);
                        return { MemObj: TmpMemObj, instructionset: instructionstrain };
                    }

                    if (objTree.Operation.value === "||") {

                        let IDNextStmt, rnd;

                        rnd=bc_auxVars.getNewJumpID(objTree.Operation.line);

                        IDNextStmt = "__OR_"+rnd+"_next";

                        LGenObj=genCode(objTree.Left, true, true, IDNextStmt, gc_jumpTrue);
                        instructionstrain+=LGenObj.instructionset;
                        if ( LGenObj.MemObj !== undefined && auxVars.isTemp(LGenObj.MemObj.address)) { //maybe it was an arithmetic operation
                            instructionstrain+=createInstruction(genNotEqualToken() ,LGenObj.MemObj, createConstantMemObj(0), true, gc_jumpFalse, gc_jumpTrue);
                        }

                        instructionstrain+=createInstruction({type: "Label"},IDNextStmt);

                        RGenObj=genCode(objTree.Right, true, true, gc_jumpFalse, gc_jumpTrue);
                        instructionstrain+=RGenObj.instructionset;
                        if (RGenObj.MemObj !== undefined && auxVars.isTemp(RGenObj.MemObj.address)) { //maybe it was an arithmetic operation
                            instructionstrain+=createInstruction(genNotEqualToken() ,RGenObj.MemObj, createConstantMemObj(0), true, gc_jumpFalse, gc_jumpTrue);
                        }

                        instructionstrain+=createInstruction({type: "Jump"}, gc_jumpFalse);

                        return { instructionset: instructionstrain } ;
                    }

                    if (objTree.Operation.value === "&&") {

                        let IDNextStmt, rnd;

                        rnd=bc_auxVars.getNewJumpID(objTree.Operation.line);

                        IDNextStmt = "__AND_"+rnd+"_next";

                        LGenObj=genCode(objTree.Left, true, false, gc_jumpFalse, IDNextStmt);
                        instructionstrain+=LGenObj.instructionset;
                        if (LGenObj.MemObj !== undefined && auxVars.isTemp(LGenObj.MemObj.address)) { //maybe it was an arithmetic operation
                            instructionstrain+=createInstruction(genNotEqualToken() ,LGenObj.MemObj, createConstantMemObj(0), false, gc_jumpFalse, gc_jumpTrue);
                        }

                        instructionstrain+=createInstruction({type: "Label"},IDNextStmt);

                        RGenObj=genCode(objTree.Right, true, false, gc_jumpFalse, gc_jumpTrue);
                        instructionstrain+=RGenObj.instructionset;
                        if (RGenObj.MemObj !== undefined && auxVars.isTemp(RGenObj.MemObj.address)) { //maybe it was an arithmetic operation
                            instructionstrain+=createInstruction(genNotEqualToken() ,RGenObj.MemObj, createConstantMemObj(0), false, gc_jumpFalse, gc_jumpTrue);
                        }

                        instructionstrain+=createInstruction({type: "Jump"}, gc_jumpTrue);

                        return { instructionset: instructionstrain } ;
                    }

                    // other comparisions operators: ==, !=, <, >, <=, >=

                    LGenObj=genCode(objTree.Left, false, gc_revLogic); //, gc_jumpFalse, gc_jumpTrue); must be undefined to evaluate expressions
                    instructionstrain+=LGenObj.instructionset;

                    RGenObj=genCode(objTree.Right, false, gc_revLogic); //, gc_jumpFalse, gc_jumpTrue); must be undefined to evaluate expressions
                    instructionstrain+=RGenObj.instructionset;

                    instructionstrain+=createInstruction(objTree.Operation, LGenObj.MemObj, RGenObj.MemObj, gc_revLogic, gc_jumpFalse, gc_jumpTrue);

                    auxVars.freeRegister(LGenObj.MemObj.address);
                    auxVars.freeRegister(RGenObj.MemObj.address);
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
                    auxVars.freeRegister(RGenObj.MemObj.address);
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
                        if (objTree.Operation.value === "+") {
                            TmpMemObj = createConstantMemObj(addHexContents(LGenObj.MemObj.hexContent, RGenObj.MemObj.hexContent));
                            return { MemObj: TmpMemObj, instructionset: instructionstrain };
                        } else if (objTree.Operation.value === "*") {
                            TmpMemObj = createConstantMemObj(mulHexContents(LGenObj.MemObj.hexContent, RGenObj.MemObj.hexContent));
                            return { MemObj: TmpMemObj, instructionset: instructionstrain };
                        } else if (objTree.Operation.value === "/") {
                            TmpMemObj = createConstantMemObj(divHexContents(LGenObj.MemObj.hexContent, RGenObj.MemObj.hexContent));
                            return { MemObj: TmpMemObj, instructionset: instructionstrain };
                        } else if (objTree.Operation.value === "-") {
                            TmpMemObj = createConstantMemObj(subHexContents(LGenObj.MemObj.hexContent, RGenObj.MemObj.hexContent));
                            return { MemObj: TmpMemObj, instructionset: instructionstrain };
                        }
                    }
                    //Try optimization if left side is constant (only commutativa operations!)
                    if (LGenObj.MemObj.type === "constant"){
                        if (checkOperatorOptimization(objTree.Operation.value, LGenObj.MemObj)) {
                            let temp=RGenObj;
                            RGenObj=LGenObj;
                            LGenObj=temp;
                        }
                    // Try optimization if operation is commutative, right side is register and left side is not
                    } else if (auxVars.isTemp(RGenObj.MemObj.address) && !auxVars.isTemp(LGenObj.MemObj.address)
                                &&  (  objTree.Operation.value == "+" || objTree.Operation.value == "*" || objTree.Operation.value == "&"
                                     ||objTree.Operation.value == "^" || objTree.Operation.value == "|" ) ) {
                        let temp=RGenObj;
                        RGenObj=LGenObj;
                        LGenObj=temp;
                    // Try optimization if operation is commutative, right side is constant ()
                    } else if ( RGenObj.MemObj.type === "constant" ) {
                        if ( !checkOperatorOptimization(objTree.Operation.value, RGenObj.MemObj)) {
                            //if there is a better otimization, dont try this one
                            if (  objTree.Operation.value == "+" || objTree.Operation.value == "*" || objTree.Operation.value == "&"
                                 ||objTree.Operation.value == "^" || objTree.Operation.value == "|" ) {
                                let temp=RGenObj;
                                RGenObj=LGenObj;
                                LGenObj=temp;
                            }
                        }
                    }
                    if (!auxVars.isTemp(LGenObj.MemObj.address)){
                        TmpMemObj=auxVars.getNewRegister();
                        TmpMemObj.declaration=LGenObj.MemObj.declaration;
                        instructionstrain+=createInstruction(genAssignmentToken(), TmpMemObj, LGenObj.MemObj);
                        auxVars.freeRegister(LGenObj.MemObj.address);
                    } else {
                        TmpMemObj=LGenObj.MemObj;
                    }

                    //Pointer verifications
                    if (bc_Big_ast.Config.useVariableDeclaration){
                        if (RGenObj.MemObj.declaration.indexOf("_ptr") != -1 && TmpMemObj.declaration.indexOf("_ptr") == -1) {
                            //Case when adding numbers to pointers
                            TmpMemObj.declaration+="_ptr";
                        }
                        if (TmpMemObj.declaration.indexOf("_ptr") != -1) {
                            if (objTree.Operation.value != "+" && objTree.Operation.value != "-")
                                throw new TypeError("At line: "+objTree.Operation.line+". Operation not allowed on pointers. Only '+', '-', '++' and '--' are.");
                        }
                    }

                    instructionstrain+=createInstruction(objTree.Operation, TmpMemObj, RGenObj.MemObj);

                    if (logicalOp === true) {
                        instructionstrain+=createInstruction(genNotEqualToken() ,TmpMemObj, createConstantMemObj(0), gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        auxVars.freeRegister(RGenObj.MemObj.address);
                        auxVars.freeRegister(TmpMemObj.address);
                        return { instructionset: instructionstrain };
                    }

                    auxVars.freeRegister(RGenObj.MemObj.address);
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
                    if (LGenObj.MemObj.address == -1)
                        throw new TypeError("At line: "+objTree.Operation.line+". Invalid left value for "+objTree.Operation.type);
                    if (auxVars.isTemp(LGenObj.MemObj.address) && LGenObj.MemObj.type.lastIndexOf("_ptr") !== LGenObj.MemObj.type.length-4){
                        throw new TypeError("At line: "+objTree.Operation.line+". Invalid left value for "+objTree.Operation.type);
                    }

                    let temp_declare="";
                    if (auxVars.declaring.length != 0) {
                        temp_declare = auxVars.declaring;
                        auxVars.declaring="";
                    }

                    if (LGenObj.MemObj.type === "array" && LGenObj.MemObj.offset_type === "constant") { //if it is an array item we know, change to the item (and do optimizations)
                        LGenObj.MemObj = getMemoryObjectByLocation(addHexContents(LGenObj.MemObj.hexContent, LGenObj.MemObj.offset_value));
                    }
                    //check if we can reuse variables used on assignment
                    //then add it to auxVars.tmpvars
                    if ( objTree.Operation.type === "Assignment"
                        && bc_Big_ast.Config.reuseAssignedVar === true
                        && LGenObj.MemObj.type === "long"
                        && LGenObj.MemObj.offset_type === undefined
                        && CanReuseAssignedVar(LGenObj.MemObj.address, objTree.Right) ){
                        auxVars.tmpvars.unshift(LGenObj.MemObj.name);
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
                    if (LGenObj.MemObj.type==="array" && LGenObj.MemObj.declaration==="long_ptr" && RGenObj.MemObj.size == 1) {
                        throw new TypeError("At line: "+objTree.Operation.line+". Invalid left value for "+objTree.Operation.type+". Can not reassign an array.");
                    }
                    //Pointer verifications
                    if (bc_Big_ast.Config.useVariableDeclaration){
                        if (    LGenObj.MemObj.declaration.indexOf("_ptr") != -1
                            && objTree.Operation.type === "SetOperator"
                            && RGenObj.MemObj.declaration.indexOf("_ptr") == -1) {
                            //Case when adding numbers to pointers
                            RGenObj.MemObj.declaration+="_ptr";
                            if (objTree.Operation.value != '+=' && objTree.Operation.value != '-='){
                                throw new TypeError("At line: "+objTree.Operation.line+". Operation not allowed on pointers. Only '+', '-', '++' and '--' are.");
                            }
                        }
                    }

                    if (bc_Big_ast.Config.useVariableDeclaration){
                        if ( !auxVars.isTemp(RGenObj.MemObj.address) ){
                            if (LGenObj.MemObj.declaration != RGenObj.MemObj.declaration){
                                if (LGenObj.MemObj.declaration.indexOf("_ptr") == -1 || RGenObj.MemObj.declaration.indexOf("_ptr") == -1 ) {//skipt check if both sides are pointers
                                    if (bc_Big_ast.Config.warningToError) {
                                        throw new TypeError("WARNING: At line: "+objTree.Operation.line+". Left and right values does not match. Values are: '"+LGenObj.MemObj.declaration+"' and '"+RGenObj.MemObj.declaration+"'.");
                    }   }   }   }   }
                    instructionstrain+=createInstruction(objTree.Operation, LGenObj.MemObj, RGenObj.MemObj);

                    if (auxVars.const_sentence===true) {
                        if (RGenObj.MemObj.address != -1 || RGenObj.MemObj.type !== "constant" || RGenObj.MemObj.hexContent === undefined ) {
                            throw new TypeError("At line: "+objTree.Operation.line+". Right side of an assigment with 'const' keyword must be a constant.");
                        }
                        // Inspect ASM code and change accordingly
                        instructionstrain = setConstAsmCode(instructionstrain, objTree.Operation.line);
                        return { MemObj: LGenObj.MemObj, instructionset: instructionstrain } ;
                    }

                    auxVars.freeRegister(RGenObj.MemObj.address);
                    auxVars.freeRegister(RGenObj.MemObj.address);
                    return { MemObj: LGenObj.MemObj, instructionset: instructionstrain } ;
                }

                if (objTree.Operation.type === "Keyword" ) {

                    if (objTree.Left.Token.value === "long" || objTree.Left.Token.value === "void") {
                        auxVars.declaring=objTree.Left.Token.value;
                        let ret = genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        return ret;
                    }

                    if (objTree.Left.Token.value === "const") {
                        auxVars.const_sentence=true;
                        let ret = genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        return ret;
                    }

                    if (objTree.Left.Token.value === "return" ) {
                        if (bc_auxVars.current_function == -1 ) {
                            throw new TypeError("At line: "+objTree.Left.Token.line+". Can not use 'return' in global statements.");
                        }
                        let currentFunction = bc_Big_ast.functions[bc_auxVars.current_function]
                        if (currentFunction.declaration === 'void') {
                            throw new TypeError("At line: "+objTree.Left.Token.line+". Function '"
                                   +currentFunction.name+"' must return a '"
                                   +currentFunction.declaration+"' value.");
                        }
                        if (currentFunction.name === "main") {
                            throw new TypeError("At line: "+objTree.Left.Token.line+". main() Function must return void");
                        }
                        RGenObj=genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        instructionstrain+=RGenObj.instructionset;
                        instructionstrain+=auxVars.getPostOperations();

                        if (RGenObj.MemObj.declaration !== currentFunction.declaration) {
                            throw new TypeError(`At line: ${objTree.Left.Token.line}. Function ${currentFunction.name} must return '` +
                                `${currentFunction.declaration}' value, but it is returning '${RGenObj.MemObj.declaration}'.`)
                        }
                        instructionstrain+=createInstruction(objTree.Left.Token, RGenObj.MemObj);

                        auxVars.freeRegister(RGenObj.MemObj.address);
                        return { instructionset: instructionstrain } ;
                    }

                    if (objTree.Left.Token.value === "goto" || objTree.Left.Token.value === "sleep" ) {
                        RGenObj=genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        instructionstrain+=RGenObj.instructionset;
                        instructionstrain+=auxVars.getPostOperations();

                        instructionstrain+=createInstruction(objTree.Left.Token, RGenObj.MemObj);

                        auxVars.freeRegister(RGenObj.MemObj.address);
                        return { instructionset: instructionstrain } ;
                    }
                    if (objTree.Left.Token.value === "exit" || objTree.Left.Token.value === "halt" ) {
                        throw new TypeError("At line: "+objTree.Left.Token.line+". Keyword '"+objTree.Left.Token.value+"' does not accept arguments.");
                    }
                    if (objTree.Left.Token.value === "struct" ) { //nothing to do here
                        return { instructionset: "" } ;
                    }
                }
                throw new TypeError("At line: "+objTree.Operation.line+". Code generation error: Unknown operation "+objTree.Operation.type);
            }
        }

        function setConstAsmCode(code, line){

            var codelines=code.split("\n");
            var retlines=[];

            codelines.forEach(function (instruction) {
                if (instruction.length == 0) {
                    retlines.push("");
                    return;
                }
                let parts=/^\s*SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/.exec(instruction);
                if ( parts === null) {
                    parts=/^\s*CLR\s+@(\w+)\s*$/.exec(instruction);
                    if ( parts !== null ) {
                        //allow CLR instruction and change to SET zero
                        retlines.push("^const SET @"+parts[1]+" #0000000000000000");
                        return;
                    }
                    throw new TypeError("At line: "+line+". No operations can be done during 'const' assignment.");
                }
                let search = bc_Big_ast.memory.find(obj => obj.asmName ==  parts[1]);
                if (search.hexContent !== undefined) {
                    throw new TypeError("At line: "+line+". Left side of an assigment with 'const' keyword already has been set.");
                }
                search.hexContent=parts[2];
                retlines.push("^const "+instruction);
            });

            return retlines.join("\n")
        }

        //all cases here must be implemented in createInstruction code oKSx4ab
        // place here only commutative operations!!!
        function checkOperatorOptimization(operator, ConstantObj) {
            if (        operator === '+' || operator === '+=') {
                if (   ConstantObj.hexContent === "0000000000000000"
                    || ConstantObj.hexContent === "0000000000000001"
                    || ConstantObj.hexContent === "0000000000000002") {
                    return true;
                }
            } else if ( operator === '*' || operator === '*=') {
                if (   ConstantObj.hexContent === "0000000000000000"
                    || ConstantObj.hexContent === "0000000000000001") {
                    return true;
                }
            }
            return false;
        }

        // Traverse an AST searching a variable name. In this case is the
        //   right side of an assignment. If variable 'name' is found, it
        //   can not be reused as temporary var (register)
        function CanReuseAssignedVar(loc, ast_code) {

            let SeekObj = getMemoryObjectByLocation(loc);
            let vname = SeekObj.name;

            if (ast_code.type === 'endASN' /*ast_code.Operation === undefined*/ ) { //end object
                if (ast_code.Token === undefined){
                    return true;
                }
                if (ast_code.Token.type === 'Variable'){
                    if (ast_code.Token.value == vname) {
                        return false;
                    } else {
                        return true;
                    }
                }
                if (ast_code.Token.type === 'Constant')
                    return true;
                if (ast_code.Token.type === 'Function')
                    return true;
                if (ast_code.content === undefined /* isEmpty(ast_code)*/ )
                    return true;
            } else if (ast_code.type === 'lookupASN' ) {
            
                let canreuse = ast_code.modifiers.find( CurrentModifier => {
                    if (CurrentModifier.type === "Array") {
                        if (CanReuseAssignedVar(loc,  CurrentModifier.Center) === false){
                            return true;
                        }
                    }
                })
                if (canreuse === undefined) return true
                return false
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

            // From Param_Obj create an memory object suitable for assembly operations, except assignment.
            // Returns also instructions maybe needed for conversion and an boolean to indicate if it is
            // a new object (that must be free later on)
            function mold_param(Param_Obj, line) {
                let Ret_Obj;
                let ret_instructions="";
                let ret_is_new = false;

                if (Param_Obj.type === "constant" ) {
                    Ret_Obj=auxVars.getNewRegister();
                    ret_instructions+=createInstruction(genAssignmentToken(), Ret_Obj, Param_Obj);
                    ret_is_new=true;

                } else if (Param_Obj.type === "register" || Param_Obj.type === "long") {
                    Ret_Obj = Param_Obj;

                } else if (Param_Obj.type === "register_ptr" || Param_Obj.type === "long_ptr") {
                    Ret_Obj=auxVars.getNewRegister();
                    ret_instructions+=createInstruction(genAssignmentToken(), Ret_Obj, Param_Obj);
                    ret_is_new=true;

                } else if (Param_Obj.type === "array") {
                    if (Param_Obj.offset_type === undefined) { //Pointer operation
                        Ret_Obj = Param_Obj;
                    } else if (Param_Obj.offset_type === "constant") { //Looks like an array but can be converted to regular variable
                            Ret_Obj = getMemoryObjectByLocation( addHexContents(Param_Obj.hexContent, Param_Obj.offset_value), line);
                    } else {
                        Ret_Obj=auxVars.getNewRegister();
                        ret_instructions+=createInstruction(genAssignmentToken(), Ret_Obj, Param_Obj);
                        ret_is_new=true;
                    }

                } else if (Param_Obj.type === "struct") {
                    if ( bc_Big_ast.Config.useVariableDeclaration === false) {
                        throw new TypeError("At line: "+line+". Can not use struct if 'useVariableDeclaration' is false.");
                    }
                    if (Param_Obj.offset_type === undefined) {
                        Ret_Obj = Param_Obj;
                    } else if (Param_Obj.offset_type === "constant") {
                        Ret_Obj=auxVars.getNewRegister();
                        ret_instructions+=createInstruction(genAssignmentToken(), Ret_Obj, createConstantMemObj(Param_Obj.offset_value));
                        ret_is_new=true;
                    } else {
                        Ret_Obj=auxVars.getNewRegister();
                        ret_instructions+=createInstruction(genAssignmentToken(), Ret_Obj, Param_Obj);
                        ret_is_new=true;
                    }

                } else {
                    throw new TypeError("At line: "+line+". Not implemented type in mold_param(): Param_Obj.type = '"+Param_Obj.type+"'.");
                }

                return { MoldedObj: Ret_Obj, instructionset: ret_instructions, is_new: ret_is_new };
            }

            if (objoperator.type === 'Assignment') {

                if (param1.type === "constant" || param1.type === "constant_ptr") {
                    throw new TypeError("At line: "+objoperator.line+".Invalid left side for assigment.");
                }
                if (param1.type === "register" || param1.type === "long") { //param 1 can be direct assigned

                    if (param2.type === "constant" ) { // Can use SET_VAL or CLR_DAT
                        if (param2.hexContent === "0000000000000000") {
                            return "CLR @"+param1.asmName+"\n";
                        } else {
                            if (param2.hexContent.length > 17) {
                                throw new RangeError("At line: "+objoperator.line+".Overflow on long value assignment (value bigger than 64 bits)");
                            }
                            return "SET @"+param1.asmName+" #"+param2.hexContent+"\n";
                        }

                    } else if (param2.type === "register" || param2.type === "long") { // Can use SET_DAT
                        if (param1.address == param2.address) return "";
                        else return "SET @"+param1.asmName+" $"+param2.asmName+"\n";

                    } else if (param2.type === "register_ptr" || param2.type === "long_ptr") {
                        return "SET @"+param1.asmName+" $($"+param2.asmName+")\n";

                    } else if (param2.type === "constant_ptr") {
                        return "SET @"+param1.asmName+" $($"+getMemoryObjectByLocation(param2.hexContent,objoperator.line).asmName+")\n";

                    } else if (param2.type === "array" || param2.type === "struct") {
                        if (param2.offset_type === undefined) {
                            return "SET @"+param1.asmName+" $"+param2.asmName+"\n";
                        }
                        if (param2.offset_type === "constant" ) {
                            if (param2.type === "array") {
                                return "SET @"+param1.asmName+" $"+getMemoryObjectByLocation(addHexContents(param2.hexContent, param2.offset_value), objoperator.line).asmName+"\n";
                            } else { //param2.type === "struct"
                                let TmpMemObj=auxVars.getNewRegister();
                                retinstr+= createInstruction(genAssignmentToken(), TmpMemObj, createConstantMemObj( param2.offset_value ));
                                retinstr+= "SET @"+param1.asmName+" $($"+param2.asmName+" + $"+TmpMemObj.asmName+")\n";
                                auxVars.freeRegister(TmpMemObj.address);
                                return retinstr;
                            }
                        } else {
                            return "SET @"+param1.asmName+" $($"+param2.asmName+" + $"+getMemoryObjectByLocation(param2.offset_value,objoperator.line).asmName+")\n";
                        }
                    }
                    throw new TypeError("At line: "+objoperator.line+". Unknow combination at createInstruction: param1 type '"+param1.type+"' and param2 type: '"+param2.type+"'.");

                } else if (param1.type === "register_ptr" || param1.type === "long_ptr") {
                    if (param2.type === "constant" ) { // Can use SET_VAL or CLR_DAT
                        if (param2.hexContent.length > 17) {
                            throw new RangeError("At line: "+objoperator.line+".Overflow on long value assignment (value bigger than 64 bits)");
                        }
                        let TmpMemObj=auxVars.getNewRegister();
                        retinstr+=createInstruction(genAssignmentToken(), TmpMemObj, param2);
                        retinstr+="SET @($"+param1.asmName+") $"+TmpMemObj.asmName+"\n";
                        auxVars.freeRegister(TmpMemObj.address);
                        return retinstr;
                    } else if (param2.type === "register" || param2.type === "long") { // Can use SET_DAT
                        return "SET @($"+param1.asmName+") $"+param2.asmName+"\n";
                    } else if (param2.type === "register_ptr" || param2.type === "long_ptr") {
                        let TmpMemObj=auxVars.getNewRegister();
                        retinstr+=createInstruction(genAssignmentToken(), TmpMemObj, param2);
                        retinstr+="SET @($"+param1.asmName+") $"+TmpMemObj.asmName+"\n";
                        auxVars.freeRegister(TmpMemObj.address);
                        return retinstr;
                    } else if (param2.type === "constant_ptr") {
                        return "SET @"+param1.asmName+" #"+param2.hexContent+"\n";

                    } else if (param2.type === "array" || param2.type === "struct") {
                        if (param2.offset_type === "constant") {
                            if (param2.type === "array") {
                                return "SET @($"+param1.asmName+") $"+getMemoryObjectByLocation(addHexContents(param2.hexContent, param2.offset_value), objoperator.line).asmName+"\n";
                            } else { //param2.type === "struct"
                                let TmpMemObj=auxVars.getNewRegister();
                                retinstr+= createInstruction(genAssignmentToken(), TmpMemObj, createConstantMemObj( param2.offset_value ));
                                retinstr+="SET @"+TmpMemObj.asmName+" $($"+param2.asmName+" + $"+TmpMemObj.asmName+")\n";
                                retinstr+="SET @($"+param1.asmName+") $"+TmpMemObj.asmName+"\n";
                                auxVars.freeRegister(TmpMemObj.address);
                                return retinstr;
                            }
                        } else {
                            let TmpMemObj=auxVars.getNewRegister();
                            retinstr+=createInstruction(genAssignmentToken(), TmpMemObj, param2);
                            retinstr+="SET @($"+param1.asmName+") $"+TmpMemObj.asmName+"\n";
                            auxVars.freeRegister(TmpMemObj.address);
                            return retinstr;
                        }
                    }
                    throw new TypeError("At line: "+objoperator.line+". Unknow combination at createInstruction: param1 type '"+param1.type+"' and param2 type: '"+param2.type+"'.");

                } else if (param1.type === "array") {
                    if (param1.offset_type === "constant" ) {
                        return createInstruction(objoperator,getMemoryObjectByLocation(addHexContents(param1.hexContent, param1.offset_value), objoperator.line), param2);
                    }
                    if (param2.type === "constant" ) {
                        if (param1.offset_type === undefined ) { //special case for multi-long text assignment
                            let array_size=param1.arrayTotalSize -1;
                            if (param2.size > array_size) {
                                throw new RangeError("At line: "+objoperator.line+". Overflow on array value assignment (value bigger than array size).");
                            }
                            let padded_long = param2.hexContent.padStart( array_size * 16, "0");
                            for (let i=0; i< array_size; i++) {
                                retinstr += createInstruction(
                                    genAssignmentToken(),
                                    getMemoryObjectByLocation(addHexContents(param1.hexContent, i),objoperator.line),
                                    createConstantMemObj( padded_long.slice(16*(array_size-i-1),16*(array_size-i)) ));
                            }
                            return retinstr;
                        }
                        if (param2.hexContent.length > 16) {
                            throw new RangeError("At line: "+objoperator.line+". Overflow on long value assignment (value bigger than 64 bits)");
                        }
                        let TmpMemObj=auxVars.getNewRegister();
                        retinstr+=createInstruction(genAssignmentToken(), TmpMemObj, param2);
                        retinstr+= "SET @($"+param1.asmName+" + $"+getMemoryObjectByLocation(param1.offset_value,objoperator.line).asmName+") $"+TmpMemObj.asmName+"\n";
                        auxVars.freeRegister(TmpMemObj.address);
                        return retinstr;
                    } else if (param2.type === "register" || param2.type === "long") {
                        return "SET @($"+param1.asmName+" + $"+getMemoryObjectByLocation(param1.offset_value,objoperator.line).asmName+") $"+param2.asmName+"\n";
                    } else if (param2.type === "register_ptr" || param2.type === "long_ptr") {
                        let TmpMemObj=auxVars.getNewRegister();
                        retinstr+=createInstruction(genAssignmentToken(), TmpMemObj, param2);
                        retinstr+= "SET @($"+param1.asmName+" + $"+getMemoryObjectByLocation(param1.offset_value,objoperator.line).asmName+") $"+TmpMemObj.asmName+"\n";
                        auxVars.freeRegister(TmpMemObj.address);
                        return retinstr;
                    } else if (param2.type === "array" || param2.type === "struct") {
                        if (param2.offset_type === "constant") {
                            if (param2.type === "array") {
                                return "SET @($"+param1.asmName+" + $"+getMemoryObjectByLocation(param1.offset_value,objoperator.line).asmName+") $"+getMemoryObjectByLocation(addHexContents(param2.hexContent, param2.offset_value), objoperator.line).asmName+"\n";
                            } else { //param2.type === "struct"
                                let TmpMemObj=auxVars.getNewRegister();
                                retinstr+= createInstruction(genAssignmentToken(), TmpMemObj, createConstantMemObj( param2.offset_value ));
                                retinstr+="SET @"+TmpMemObj.asmName+" $($"+param2.asmName+" + $"+TmpMemObj.asmName+")\n";
                                retinstr+="SET @($"+param1.asmName+" + $"+getMemoryObjectByLocation(param1.offset_value,objoperator.line).asmName+") $"+TmpMemObj.asmName+"\n";
                                auxVars.freeRegister(TmpMemObj.address);
                                return retinstr;
                            }
                        } else {
                            let TmpMemObj=auxVars.getNewRegister();
                            retinstr+=createInstruction(genAssignmentToken(), TmpMemObj, param2);
                            retinstr+="SET @($"+param1.asmName+" + $"+getMemoryObjectByLocation(param1.offset_value,objoperator.line).asmName+") $"+TmpMemObj.asmName+"\n";
                            auxVars.freeRegister(TmpMemObj.address);
                            return retinstr;
                        }
                    }
                    throw new TypeError("At line: "+objoperator.line+". Unknow combination at createInstruction: param1 type '"+param1.type+"' and param2 type: '"+param2.type+"'.");

                } else if (param1.type === "struct") {
                    if (param1.offset_type === undefined && param1.declaration === "struct_ptr") {
                        if (param2.type === "constant" ) {
                            return "SET @"+param1.asmName+" #"+param2.hexContent+"\n";
                        }
                        if (param2.type === "register" ) {
                            return "SET @"+param1.asmName+" $"+param2.asmName+"\n";
                        }
                    } else if (param1.offset_type === "constant" ) {
                        /* Code not allowed by condition Yyx_sSkA */
                    } else /* if (param1.offset_type === "variable" ) */ {
                        if (param2.type === "constant" ) {
                            if (param2.hexContent.length > 17) {
                                throw new RangeError("At line: "+objoperator.line+". Overflow on long value assignment (value bigger than 64 bits)");
                            }
                            let TmpMemObj=auxVars.getNewRegister();
                            retinstr+=createInstruction(genAssignmentToken(), TmpMemObj, param2);
                            retinstr+= "SET @($"+param1.asmName+" + $"+getMemoryObjectByLocation(param1.offset_value,objoperator.line).asmName+") $"+TmpMemObj.asmName+"\n";
                            auxVars.freeRegister(TmpMemObj.address);
                            return retinstr;
                        } else if (param2.type === "register" || param2.type === "long") {
                            return "SET @($"+param1.asmName+" + $"+getMemoryObjectByLocation(param1.offset_value,objoperator.line).asmName+") $"+param2.asmName+"\n";
                        } else if (param2.type === "array" || param2.type === "struct") {
                            if (param2.offset_type === "constant" ) {
                                if (param2.type === "array") {
                                    return "SET @($"+param1.asmName+" + $"+getMemoryObjectByLocation(param1.offset_value,objoperator.line).asmName+") $"+getMemoryObjectByLocation(addHexContents(param2.hexContent, param2.offset_value), objoperator.line).asmName+"\n";
                                } else { //param2.type === "struct"
                                    let TmpMemObj=auxVars.getNewRegister();
                                    retinstr+= createInstruction(genAssignmentToken(), TmpMemObj, createConstantMemObj( param2.offset_value ));
                                    retinstr+= "SET @($"+param1.asmName+" + $"+getMemoryObjectByLocation(param1.offset_value,objoperator.line).asmName+") $"+TmpMemObj.asmName+"\n";
                                    auxVars.freeRegister(TmpMemObj.address);
                                    return retinstr;
                                }
                            } else {
                                let TmpMemObj=auxVars.getNewRegister();
                                retinstr+=createInstruction(genAssignmentToken(), TmpMemObj, param2);
                                retinstr+="SET @($"+param1.asmName+" + $"+getMemoryObjectByLocation(param1.offset_value,objoperator.line).asmName+") $"+TmpMemObj.asmName+"\n";
                                auxVars.freeRegister(TmpMemObj.address);
                                return retinstr;
                            }
                        }
                    }
                }
                throw new TypeError("At line: "+objoperator.line+". Unknow combination at createInstruction: param1 type '"+param1.type+"' and param2 type: '"+param2.type+"'.");
            }

            if (objoperator.type === 'Operator' || objoperator.type === 'SetOperator') {

                let TmpMemObj1, TmpMemObj2 ;
                let allow_optimization = false;
                let optimized = false;


                if (param1.type === "constant" ) {
                    throw new TypeError("At line: "+objoperator.line+". Can not createInstruction with param1 type '"+param1.type+"'.");
                }
                TmpMemObj1 = mold_param(param1, objoperator.line);
                retinstr += TmpMemObj1.instructionset;

                if (param2.type === "constant" ) {
                    allow_optimization=true;
                } 
                TmpMemObj2 = mold_param(param2, objoperator.line);
                retinstr += TmpMemObj2.instructionset;

                if (allow_optimization === true) {
                    function removeLastButOne() {
                        if ( retinstr.length > 0 ){
                            let codes=retinstr.split("\n");
                            codes.pop();
                            codes.pop();
                            retinstr=codes.join("\n");
                        }
                    }
                    //if add new condition here, add also in checkOperatorOptimization code oKSx4ab
                    // here we can have optimizations for all operations.
                    if (       objoperator.value === '+' || objoperator.value === '+=') {
                        if (param2.hexContent === "0000000000000000") {
                            auxVars.freeRegister(TmpMemObj2.MoldedObj.address);
                            return "";
                        }
                        if (param2.hexContent === "0000000000000001") {
                            auxVars.freeRegister(TmpMemObj2.MoldedObj.address);
                            removeLastButOne();
                            retinstr+=createInstruction(genIncToken(objoperator.line), TmpMemObj1.MoldedObj);
                            optimized=true;
                        }
                        if (param2.hexContent === "0000000000000002") {
                            auxVars.freeRegister(TmpMemObj2.MoldedObj.address);
                            removeLastButOne();
                            retinstr += createInstruction(genIncToken(objoperator.line), TmpMemObj1.MoldedObj)
                            retinstr += createInstruction(genIncToken(objoperator.line), TmpMemObj1.MoldedObj)
                            optimized =true;
                        }
                    } else if ( objoperator.value === '-' || objoperator.value === '-=') {
                        if (param2.hexContent === "0000000000000000") {
                            auxVars.freeRegister(TmpMemObj2.MoldedObj.address);
                            return "";
                        }
                        if (param2.hexContent === "0000000000000001") {
                            auxVars.freeRegister(TmpMemObj2.MoldedObj.address);
                            removeLastButOne();
                            retinstr+=createInstruction(genDecToken(objoperator.line), TmpMemObj1.MoldedObj);
                            optimized=true;
                        }
                    } else if ( objoperator.value === '*' || objoperator.value === '*=') {
                        if (param2.hexContent === "0000000000000000") {
                            auxVars.freeRegister(TmpMemObj2.MoldedObj.address);
                            removeLastButOne();
                            retinstr += createInstruction(genAssignmentToken(), TmpMemObj1.MoldedObj, param2);
                            optimized=true;
                        }
                        if (param2.hexContent === "0000000000000001") {
                            auxVars.freeRegister(TmpMemObj2.MoldedObj.address);
                            return "";
                        }
                    } else if ( objoperator.value === '/' || objoperator.value === '/=') {
                        if (param2.hexContent === "0000000000000001") {
                            auxVars.freeRegister(TmpMemObj2.MoldedObj.address);
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
                        throw new TypeError("At line: "+objoperator.line+".Operator not supported "+objoperator.value);

                    retinstr +=" @"+TmpMemObj1.MoldedObj.asmName+" $"+TmpMemObj2.MoldedObj.asmName+"\n";

                    auxVars.freeRegister(TmpMemObj2.MoldedObj.address);
                }

                if (TmpMemObj1.is_new === true) {
                    retinstr+=createInstruction(genAssignmentToken(), param1, TmpMemObj1.MoldedObj);
                    auxVars.freeRegister(TmpMemObj1.MoldedObj.address);
                }

                return retinstr;
            }

            if (objoperator.type === 'UnaryOperator' || objoperator.type === 'SetUnaryOperator') {

                if (objoperator.value === '++') {
                    return "INC @"+param1.asmName+"\n";
                }
                if (objoperator.value === '--') {
                    return "DEC @"+param1.asmName+"\n";
                }
                if (objoperator.value === '~') {
                    return "NOT @"+param1.asmName+"\n";
                }
                if (objoperator.value === '+') {
                    return;
                }
                throw new TypeError("At line: "+objoperator.line+". Unary operator not supported: "+objoperator.value);
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
                    throw new TypeError("At line: "+objoperator.line+". Missing label to ci_jumpFalse / ci_jumpTrue.");

                let TmpMemObj1;
                let TmpMemObj2;
                let useBranchZero=false;
                let jump;


                TmpMemObj1 = mold_param(param1, objoperator.line);
                retinstr += TmpMemObj1.instructionset;

                if (param2.type === "constant" && param2.hexContent==="0000000000000000" && (objoperator.value === '!=' || objoperator.value === '==')) {
                    useBranchZero=true;
                } else {
                    TmpMemObj2 = mold_param(param2, objoperator.line);
                    retinstr += TmpMemObj2.instructionset;
                }

                retinstr += chooseBranch(objoperator.value, useBranchZero, ci_revLogic);

                if (ci_revLogic)
                    jump = ci_jumpTrue;
                else
                    jump = ci_jumpFalse;

                if (useBranchZero)
                    retinstr +=" $"+TmpMemObj1.MoldedObj.asmName+" :"+jump+"\n";
                else
                    retinstr +=" $"+TmpMemObj1.MoldedObj.asmName+" $"+TmpMemObj2.MoldedObj.asmName+" :"+jump+"\n";

                if (TmpMemObj1.is_new===true)
                    auxVars.freeRegister(TmpMemObj1.MoldedObj.address);
                if (TmpMemObj2 !== undefined && TmpMemObj2.is_new===true)
                    auxVars.freeRegister(TmpMemObj2.MoldedObj.address);

                return retinstr;
            }

            if (objoperator.type === 'Function') {
                return "JSR :__fn_"+param1+"\n";
            }

            if (objoperator.type === 'APICall') {
                let retinstr="";
                let tempvar=[];

                param2.forEach(function (varObj) {
                    let Temp = mold_param(varObj, -1);
                    retinstr += Temp.instructionset;
                    tempvar.push(Temp);
                });

                retinstr+= "FUN";
                if (param1 !== undefined) {
                    retinstr+=" @"+param1.asmName;
                }
                retinstr+=" "+objoperator.value;
                tempvar.forEach(arg => retinstr+=" $"+arg.MoldedObj.asmName);
                retinstr+="\n";

                tempvar.forEach(arg => auxVars.freeRegister(arg.MoldedObj.address));
                return retinstr;
            }

            if (objoperator.type === 'Pop') {
                return "POP @"+param1.asmName+"\n";
            }

            if (objoperator.type === 'Push') {

                let retinstr="";
                let TmpMemObj;

                TmpMemObj=mold_param(param1);
                retinstr += TmpMemObj.instructionset;

                retinstr+= "PSH $"+TmpMemObj.MoldedObj.asmName+"\n";

                if (TmpMemObj.is_new===true)
                    auxVars.freeRegister(TmpMemObj.MoldedObj.address);
                return retinstr;
            }

            if (objoperator.type === 'Keyword') {
                if (objoperator.value === 'break' || objoperator.value === 'continue' ){
                    return "JMP :"+bc_auxVars.getLatestLoopId()+"_"+objoperator.value+"\n";
                }
                if (objoperator.value === 'label'){
                    return objoperator.extValue+":\n";
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
                            TmpMemObj1 = getMemoryObjectByLocation( addHexContents(param1.hexContent, param1.offset_value), objoperator.line);
                        } else {
                            TmpMemObj1=auxVars.getNewRegister();
                            retinstr+=createInstruction(genAssignmentToken(), TmpMemObj1, param1);
                        }
                    } else {
                        throw new TypeError("At line: "+objoperator.line+". Not implemented type in createInstruction for keyword: param1 type '"+param1.type+"'.");
                    }

                    if (objoperator.value === 'return') {
                        retinstr+= "PSH $"+TmpMemObj1.asmName+"\n";
                        retinstr+= "RET\n";
                    } else if ( objoperator.value === 'sleep' ){
                        retinstr+= "SLP $"+TmpMemObj1.asmName+"\n";
                    }

                    auxVars.freeRegister(TmpMemObj1.address);
                    auxVars.freeRegister(param1.address);
                    return retinstr;
                }
                if (objoperator.value === 'asm'){
                    let lines=objoperator.extValue.split("\n");
                    lines=lines.map(function (value){ return value.trim()});
                    return lines.join("\n").trim()+"\n";
                }
            }
            throw new TypeError("At line: "+objoperator.line+". "+objoperator.type+" not supported");
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
                if (phrs.type === "endASN" || phrs.type === "lookupASN"/* phrs.Operation === undefined*/) {
                    ret.push(phrs);
                    return;
                }
                if (phrs.type === 'binaryASN' && phrs.Operation.type === "Delimiter") {
                    recursiveSplit(phrs.Left);
                    recursiveSplit(phrs.Right);
                    return;
                } else {
                    ret.push(phrs);
                    return;
                }
            }
            //if (!isEmpty(Phrase)){
                recursiveSplit(Phrase);
            //}
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


    // Add relevant config information to assembly code
    function configDeclarationGenerator() {
        if (bc_Big_ast.Config.PName !== undefined && bc_Big_ast.Config.PName != "") {
            writeAsmLine("^program name "+bc_Big_ast.Config.PName);
        }
        if (bc_Big_ast.Config.PDescription !== undefined && bc_Big_ast.Config.PDescription != "") {
            writeAsmLine("^program description "+bc_Big_ast.Config.PDescription);
        }
        if (bc_Big_ast.Config.PActivationAmount !== undefined && bc_Big_ast.Config.PActivationAmount != "") {
            writeAsmLine("^program activationAmount "+bc_Big_ast.Config.PActivationAmount);
        }
    }


    // handles variables declarations to assembly code.
    function assemblerDeclarationGenerator (MemObj) {
        if (MemObj.address != -1){
            writeAsmLine("^declare "+MemObj.asmName);
            if (MemObj.hexContent !== undefined) {
                writeAsmLine("^const SET @"+MemObj.asmName+" #"+MemObj.hexContent);
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
        if (search === undefined){
            // do a global scope search
            search = bc_Big_ast.memory.find(obj => obj.name == var_name && obj.scope === "" );
        }

        if (bc_Big_ast.Config.useVariableDeclaration === false) {
            if (search === undefined) {
                let fakevar = {
                    "address": bc_Big_ast.memory.length,
                    "name": var_name,
                    "asmName": var_name,
                    "type": "long",
                    "typeDefinition": null,
                    "scope": "",
                    "size": 1,
                    "isDeclared": true };
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
            search.isDeclared=true;
            return JSON.parse(JSON.stringify(search));
        }
        //else, not in declaration:
        if (search === undefined) {
            //maybe this is a label. Check! Labels always global
            search = bc_Big_ast.labels.find(obj => obj == var_name );
            if (search === undefined) {
                throw new SyntaxError("At line: "+line+". Using Variable '"+var_name+"' before declaration.");
            }
            return {
                    type: "label",
                    isDeclared: true,
                    declaration: "void",
                    address: -1,
                    name: var_name,
                    scope: "",
                    size: 0,
            }
        }

        return JSON.parse(JSON.stringify(search));
    }

    function getMemoryObjectByLocation(loc, line) {
        let search, addr;

        if ( typeof(loc) === "number") {
            addr = loc;
        } else if (typeof (loc) === 'string') {
            addr = parseInt(loc, 16);
        } else throw new TypeError("At line: "+line+". Wrong type in getMemoryObjectByLocation.");

        search = bc_Big_ast.memory.find(obj => obj.address == addr );

        if (search === undefined) {
            throw new SyntaxError("At line: "+line+". No variable found at address '0x"+addr+"'.");
        }

        return JSON.parse(JSON.stringify(search));
    }


    //Handle function initialization
    function functionHeaderGenerator () {

        var fname= bc_Big_ast.functions[bc_auxVars.current_function].name;

        if (fname === "main") {
            writeAsmLine("__fn_"+fname+":");
            writeAsmLine("PCS");
            return;
        }

        writeAsmLine("__fn_"+fname+":");
        bc_Big_ast.functions[bc_auxVars.current_function].argsMemObj.forEach(function (MemObj) {
            writeAsmLine("POP @"+MemObj.asmName);
        });
    }

    // Deeper assembly code optimization
    function doGlobalOptimization(){
        var tmplines =  bc_auxVars.assemblyCode.split("\n");

        var jumpToLabels;
        var jmpto, lbl, dest;
        var setdat, opdat, clrdat, popdat;
        var branchdat;
        var psh_slp_dat;
        var notdat, setdat2;
        var optimized_lines;

        do {
            jumpToLabels=[];
            optimized_lines = 0;

            //Collect jumps information
            tmplines.forEach( function (value) {
                    jmpto = /.+\s:(\w+)$/.exec(value); //match JMP JSR ERR and all branches
                    if (jmpto!== null) {
                        jumpToLabels.push(jmpto[1]);
                    }
                });

            //remove labels without reference
            //remove lines marked as DELETE
            tmplines = tmplines.filter( function (value){
                    lbl = /^(\w+):$/.exec(value);
                    if (lbl !== null) {
                        if (jumpToLabels.indexOf(lbl[1]) != -1) {
                            return true;
                        } else {
                            optimized_lines++;
                            return false;
                        }
                    }
                    if (value == "DELETE") {
                        optimized_lines++;
                        return false;
                    }
                    return true;
                });

            tmplines.forEach( function (value, index, array){
                var i;

                //do not analyze these values or compiler directives
                if (value == "DELETE" || value == "" || /^\s*\^\w+(.*)/.exec(array[i]) != null) {
                    return;
                }

                // change SET_VAL to SET_DAT for values defined in ConstVars
                // This also enables more optimizations on pointers and PSH!
                if (bc_Big_ast.Config.maxConstVars > 0) {
                    setdat = /^\s*SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/.exec(value);
                    if (setdat !== null) {
                        let val=parseInt(setdat[2],16);
                        if (val <= bc_Big_ast.Config.maxConstVars && setdat[1] !== "n"+val) {
                            array[index]="SET @"+setdat[1]+" $n"+val;
                            optimized_lines++;
                        }
                    }
                }

                //BNE $r0 $var37 :lab_f75
                //JMP :lab_fa2
                //lab_f75:
                //  turns BEQ $r0 $var37 :lab_fa2
                branchdat = /^\s*(BGT|BLT|BGE|BLE|BEQ|BNE)\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/.exec(value);
                if (branchdat != null) {
                    lbl = /^\s*(\w+):\s*$/.exec(array[index+2]);
                    if (lbl != null && branchdat[4] == lbl[1]) {
                        jmpto = /^\s*JMP\s+:(\w+)\s*$/.exec(array[index+1]);
                        if (jmpto != null) {

                            //if jump location is RET or FIN, optimize to RET or FIN.
                            dest = getLabeldestination(jmpto[1]);
                            if (/^\s*RET\s*$/.exec(dest) !== null ){
                                array[index+1] = "RET"; //if jump to return, just return from here
                                optimized_lines++;
                                return;
                            }
                            if (/^\s*FIN\s*$/.exec(dest) !== null ){
                                array[index+1] = "FIN"; //if jump to exit, just exit from here
                                optimized_lines++;
                                return;
                            }

                            var instr;
                            if      (branchdat[1] == "BGT") instr="BLE";
                            else if (branchdat[1] == "BLT") instr="BGE";
                            else if (branchdat[1] == "BGE") instr="BLT";
                            else if (branchdat[1] == "BLE") instr="BGT";
                            else if (branchdat[1] == "BEQ") instr="BNE";
                            else instr="BEQ";
                            array[index] = instr + " $" + branchdat[2] + " $" + branchdat[3] + " :" + jmpto[1];
                            array[index+1]="DELETE";
                            optimized_lines++;
                            return;
                        }
                    }
                }

                //BNZ $r0 :lab_f75
                //JMP :lab_fa2
                //lab_f75:
                //  turns BZR $r0 :lab_fa2
                branchdat = /^\s*(BZR|BNZ)\s+\$(\w+)\s+:(\w+)\s*$/.exec(value);
                if (branchdat != null) {
                    lbl = /^\s*(\w+):\s*$/.exec(array[index+2]); //matches labels
                    if (lbl != null && branchdat[3] == lbl[1]) {
                        jmpto = /^\s*JMP\s+:(\w+)\s*$/.exec(array[index+1]);
                        if (jmpto != null) {

                            //if jump location is RET or FIN, optimize to RET or FIN.
                            dest = getLabeldestination(jmpto[1]);
                            if (/^\s*RET\s*$/.exec(dest) !== null ){
                                array[index+1] = "RET"; //if jump to return, just return from here
                                optimized_lines++;
                                return;
                            }
                            if (/^\s*FIN\s*$/.exec(dest) !== null ){
                                array[index+1] = "FIN"; //if jump to exit, just exit from here
                                optimized_lines++;
                                return;
                            }

                            var instr;
                            if (branchdat[1] == "BZR") instr="BNZ";
                            else instr="BZR";
                            array[index] = instr + " $" + branchdat[2] + " :" + jmpto[1];
                            array[index+1]="DELETE";
                            optimized_lines++;
                            return;
                        }
                    }
                }

                jmpto = /^\s*JMP\s+:(\w+)\s*$/.exec(value);
                //optimize jumps
                if (jmpto !== null) {
                    //if instruction is jump, unreachable code until a label found
                    i=index;
                    while (++i<array.length-1) {
                        lbl = /^\s*(\w+):\s*$/.exec(array[i]);
                        if ( lbl === null) {
                            if (array[i] === "" || array[i] === "DELETE" || /^\s*\^\w+(.*)/.exec(array[i]) != null) { //matches assembly compiler directives
                                continue;
                            }
                            array[i]="DELETE"
                            optimized_lines++;
                            continue;
                        }
                        break;
                    }
                    //if referenced label is next instruction, meaningless jump
                    i=index;
                    while (++i<array.length-1) {
                        lbl = /^\s*(\w+):\s*$/.exec(array[i]);
                        if ( lbl === null) {
                            if (array[i] === "" || array[i] === "DELETE") {
                                continue;
                            }
                            break;
                        }
                        if (jmpto[1] === lbl[1]) {
                            array[index]="DELETE"
                            optimized_lines++;
                            return;
                        }
                    }
                    //inspect jump location
                    dest = getLabeldestination(jmpto[1]);
                    if (/^\s*RET\s*$/.exec(dest) !== null ){
                        array[index] = "RET"; //if jump to return, just return from here
                        optimized_lines++;
                        return;
                    }
                    if (/^\s*FIN\s*$/.exec(dest) !== null ){
                        array[index] = "FIN"; //if jump to exit, just exit from here
                        optimized_lines++;
                        return;
                    }
                    lbl = /^\s*(\w+):\s*$/.exec(dest);
                    if (lbl !== null) {
                        array[index] = "JMP :"+lbl[1]; //if jump to other jump, just jump over there
                        optimized_lines++;
                        return;
                    }
                }

                jmpto = /^\s*(RET|FIN)\s*$/.exec(value);
                //Inspect RET and FIN
                if (jmpto !== null) {
                    //if instruction RET or FIN, unreachable code until a label found
                    i=index;
                    while (++i<array.length-1) {
                        lbl = /^\s*(\w+):\s*$/.exec(array[i]);
                        if ( lbl === null) {
                            if (array[i] === "" || array[i] === "DELETE" || /^\s*\^\w+(.*)/.exec(array[i]) != null) {
                                continue;
                            }
                            array[i]="DELETE"
                            optimized_lines++;
                            continue;
                        }
                        break;
                    }
                }

                //inspect branches and optimize branch to jumps
                jmpto = /^\s*B.+:(\w+)$/.exec(value); //matches all branches instructions
                if (jmpto !== null) {
                    //if referenced label is next instruction, meaningless jump
                    i=index;
                    while (++i<array.length-1) {
                        lbl = /^\s*(\w+):\s*$/.exec(array[i]);
                        if ( lbl === null) {
                            if (array[i] === "" || array[i] === "DELETE") {
                                continue;
                            }
                            break;
                        }
                        if (jmpto[1] === lbl[1]) {
                            array[index]="DELETE"
                            optimized_lines++;
                            return;
                        }
                    }
                    //inspect jump location
                    dest = getLabeldestination(jmpto[1]);
                    lbl = /^\s*(\w+):\s*$/.exec(dest);
                    if (lbl !== null) {
                        array[index] = jmpto[0].replace(jmpto[1], lbl[1]); //if branch to other jump, just branch over there
                        optimized_lines++;
                        return;
                    }
                }

                //ADD @r0 $b
                //SET @b $r0
                // turns ADD @b $r0
                opdat=/^\s*(\w+)\s+@(\w+)\s+\$(\w+)\s*$/.exec(value);
                if (opdat !== null) {
                    setdat = /^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index+1]);
                    if ( setdat !== null && opdat[2] == setdat[2] && opdat[3] == setdat[1]) {
                        if (opdat[1] === "ADD" || opdat[1] === "MUL" || opdat[1] === "AND" || opdat[1] === "XOR" || opdat[1] === "BOR" ) {
                            array[index]=opdat[1]+" @"+opdat[3]+" $"+opdat[2];
                            array[index+1]="DELETE";
                            optimized_lines++;
                            return;
                        }
                    }
                }

                //SET @r0 $a
                //ADD @b $r0
                // turns ADD @b $a
                setdat=/^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(value);
                if (setdat !== null) {
                    opdat = /^\s*(\w+)\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index+1]);
                    if ( opdat !== null && setdat[1] == opdat[3]) {
                        if (opdat[1] === "ADD" || opdat[1] === "SUB" || opdat[1] === "MUL" || opdat[1] === "DIV" ||
                            opdat[1] === "AND" || opdat[1] === "XOR" || opdat[1] === "BOR" ||
                            opdat[1] === "MOD" || opdat[1] === "SHL" || opdat[1] === "SHR" ) {
                            array[index]=opdat[1]+" @"+opdat[2]+" $"+setdat[2];
                            array[index+1]="DELETE";
                            optimized_lines++;
                            return;
                        }
                    }
                    if (setdat[1] == setdat[2]) { //SET @a_1 $a_1 turns delete
                        array[index]="DELETE";
                        optimized_lines++;
                        return;
                    }

                    //SET @r0 $a
                    //PSH $r0 / SLP $r0
                    // turns PSH $a / SLP $a
                    psh_slp_dat=/^\s*(PSH|SLP)\s+\$(\w+)\s*$/.exec(array[index+1]);
                    if (psh_slp_dat !== null && isRegister(setdat[1])) {
                        if (psh_slp_dat[2] == setdat[1]) {
                            array[index]="DELETE";
                            array[index+1]=psh_slp_dat[1]+" $"+setdat[2];
                            optimized_lines++;
                            return;
                        }
                    }

                    i=index;
                    while (++i<array.length-1) {
                        lbl = /^\s*(\w+):\s*$/.exec(array[i]);
                        if ( lbl !== null) {
                            break;
                        }
                        jmpto = /.+\s:(\w+)$/.exec(array[i]); //match JMP JSR ERR and all branches
                        if (jmpto !== null) {
                            break;
                        }
                        jmpto = /^\s*(RET|FIN)\s*$/.exec(array[i]);
                        if (jmpto !== null) {
                            break;
                        }
                        if (array[i].indexOf(setdat[1]) >= 0) {
                            //SET @r0 $a
                            //SET @z $($val + $r0)
                            // turns SET @z $($val + $a)
                            setdat2 = /^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\s*\+\s*\$(\w+)\)\s*$/.exec(array[i]);
                            if (setdat2 !== null && setdat[1] == setdat2[3]) {
                                array[index]="DELETE";
                                array[i]="SET @"+setdat2[1]+" $($"+setdat2[2]+" + $"+setdat[2]+")";
                                optimized_lines++;
                                continue;
                            }
                            //SET @r0 $a
                            //SET @($val + $r0) $z
                            // turns SET $($val + $a) $z
                            setdat2 = /^\s*SET\s+@\(\$(\w+)\s*\+\s*\$(\w+)\)\s+\$(\w+)\s*$/.exec(array[i]);
                            if (setdat2 !== null && setdat[1] == setdat2[2]) {
                                array[index]="DELETE";
                                array[i]="SET @($"+setdat2[1]+" + $"+setdat[2]+") $"+setdat2[3];
                                optimized_lines++;
                                continue;
                            }
                            //SET @r0 $a
                            //SET @($val + $z) $r0
                            // turns SET $($val + $z) $a
                            if (setdat2 !== null && setdat[1] == setdat2[3]) {
                                array[index]="DELETE";
                                array[i]="SET @($"+setdat2[1]+" + $"+setdat2[2]+") $"+setdat[2];
                                optimized_lines++;
                                continue;
                            }
                            break;
                        }
                    }

                    //SET @r0 $n2
                    //BLT $i $r0 :__if151_c_endif
                    // turns BLT $i $n2 :__if151_c_endif (very specific optimization)
                    branchdat=/^\s*(BGT|BLT|BGE|BLE|BEQ|BNE)\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/.exec(array[index+1]);
                    if (branchdat !== null && branchdat[3] == setdat[1] && isRegister(setdat[1]) && /^n\d$/.exec(setdat[2]) != null) {
                        array[index]=branchdat[1]+" $"+branchdat[2]+" $"+setdat[2]+" :"+branchdat[4];
                        array[index+1]="DELETE";
                        optimized_lines++;
                        return;

                    }

                    //SET @r0 $a
                    //NOT @r0 (only registers)
                    //SET @a $r0
                    // turns NOT @a (safe!)
                    notdat = /^\s*NOT\s+@(r\d+)\s*$/.exec(array[index+1]);
                    if (notdat !== null && notdat[1] == setdat[1]) {
                        setdat2 = /^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index+2]);
                        if (setdat2 !== null && setdat[1] == setdat2[2] && setdat[2] == setdat2[1]) {
                            array[index]="NOT @"+setdat[2];
                            array[index+1]="DELETE";
                            array[index+2]="DELETE";
                            optimized_lines++;
                            return;
                        }
                    }
                }

                //POP @r0
                //SET @z $r0
                // turns POP @z
                popdat=/^\s*POP\s+@(\w+)\s*$/.exec(value);
                if (popdat !== null && isRegister(popdat[1])) {
                    setdat=/^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index+1]);
                    if ( setdat !== null && setdat[2] == popdat[1]) {
                        array[index]="POP @"+setdat[1];
                        array[index+1]="DELETE";
                        optimized_lines++;
                        return;
                    }

                    //POP @r0
                    //PSH $r0
                    // turns nothing (safe for registers)
                    psh_slp_dat=/^\s*(PSH|SLP)\s+\$(r\d+)\s*$/.exec(array[index+1]);
                    if (psh_slp_dat !== null) {
                        if (psh_slp_dat[2] == popdat[1]) {
                            array[index]="DELETE";
                            array[index+1]="DELETE";
                            optimized_lines++;
                            return;
                        }
                    }
                }

                //Optimize pointer operations with zero index
                clrdat=/^\s*CLR\s+@(\w+)\s*$/.exec(value);
                if (clrdat !== null) {
                    i=index;
                    while (++i<array.length-1) {
                        lbl = /^\s*(\w+):\s*$/.exec(array[i]);
                        if ( lbl !== null) {
                            break;
                        }
                        jmpto = /.+\s:(\w+)$/.exec(array[i]); //match JMP JSR ERR and all branches
                        if (jmpto !== null) {
                            break;
                        }
                        jmpto = /^\s*(RET|FIN)\s*$/.exec(array[i]);
                        if (jmpto !== null) {
                            break;
                        }
                        if (array[i].indexOf(clrdat[1]) >= 0) {
                            setdat = /^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\s*\+\s*\$(\w+)\)\s*$/.exec(array[i]);
                            if (setdat !== null && clrdat[1] == setdat[3]) {
                                array[index]="DELETE";
                                array[i]="SET @"+setdat[1]+" $($"+setdat[2]+")";
                                optimized_lines++;
                                continue;
                            }
                            setdat = /^\s*SET\s+@\(\$(\w+)\s*\+\s*\$(\w+)\)\s+\$(\w+)\s*$/.exec(array[i]);
                            if (setdat !== null && clrdat[1] == setdat[2]) {
                                array[index]="DELETE";
                                array[i]="SET @($"+setdat[1]+") $"+setdat[3];
                                optimized_lines++;
                                continue;
                            }
                            break;
                        }
                    }
                }

            });
        } while (optimized_lines != 0);

        bc_auxVars.assemblyCode = tmplines.join("\n");

        function getLabeldestination(label) {
            var lbl, jmpdest;
            var idx = tmplines.findIndex( obj => obj.indexOf(label+":") != -1);
            if (idx == -1 ) {
                throw new TypeError("Could not find label '"+label+"' during optimizations.");
            }
            while (++idx<tmplines.length-1) {
                lbl = /^\s*(\w+):\s*$/.exec(tmplines[idx]);
                if ( lbl !== null) {
                    continue;
                }
                if (tmplines[idx] === "" || tmplines[idx] === "DELETE") {
                    continue;
                }
                jmpdest = /^\s*JMP\s+:(\w+)\s*$/.exec(tmplines[idx]);
                if (jmpdest !== null) {
                    return jmpdest[1]+":";
                }
                return tmplines[idx]
            }
            throw new TypeError("Strange error during optimizations.");
        }

        function isRegister(name) {
            if (/^r\d$/.exec(name) != null) //matches r0 .. r9
                return true;
            return false;
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
            if ( bc_Big_ast.functions[bc_auxVars.current_function].declaration === "void" ) {
                writeAsmLine("RET");
            } else { // return zero to prevent stack overflow
                writeAsmLine("CLR @r0");
                writeAsmLine("PSH $r0");
                writeAsmLine("RET");
            }
        }
    }

    //Hot stuff!!! Assemble sentences!!
    function compileSentence( Sentence ){
        var sent_id;

        if (Sentence.type === "phrase") {
            writeAsmCode( codeGenerator( Sentence.CodeAST ) );

        } else if (Sentence.type === "ifEndif") {
            sent_id = "__if"+bc_auxVars.getNewJumpID(Sentence.line);
            writeAsmCode( codeGenerator(Sentence.ConditionAST, sent_id+"_endif", sent_id+"_start"));
            writeAsmLine( sent_id+"_start:" );
            Sentence.trueBlock.forEach( compileSentence );
            writeAsmLine( sent_id+"_endif:" );

        } else if (Sentence.type === "ifElse") {
            sent_id = "__if"+bc_auxVars.getNewJumpID(Sentence.line);
            writeAsmCode( codeGenerator(Sentence.ConditionAST, sent_id+"_else", sent_id+"_start") );
            writeAsmLine( sent_id+"_start:" );
            Sentence.trueBlock.forEach( compileSentence );
            writeAsmLine( "JMP :" + sent_id + "_endif" );
            writeAsmLine( sent_id+"_else:" );
            Sentence.falseBlock.forEach( compileSentence );
            writeAsmLine( sent_id+"_endif:" );

        } else if (Sentence.type === "while") {
            sent_id = "__loop"+bc_auxVars.getNewJumpID(Sentence.line);
            writeAsmLine( sent_id+"_continue:" );
            writeAsmCode( codeGenerator(Sentence.ConditionAST, sent_id+"_break", sent_id+"_start") );
            writeAsmLine( sent_id+"_start:" );
            bc_auxVars.latest_loop_id.push(sent_id);
            Sentence.trueBlock.forEach( compileSentence );
            bc_auxVars.latest_loop_id.pop();
            writeAsmLine( "JMP :" + sent_id + "_continue" );
            writeAsmLine( sent_id+"_break:" );

        } else if (Sentence.type === "do") {
            sent_id = "__loop"+bc_auxVars.getNewJumpID(Sentence.line);
            writeAsmLine( sent_id+"_continue:" );
            bc_auxVars.latest_loop_id.push(sent_id);
            Sentence.trueBlock.forEach( compileSentence );
            bc_auxVars.latest_loop_id.pop();
            writeAsmCode( codeGenerator(Sentence.ConditionAST, sent_id+"_break", sent_id+"_continue", true) );
            writeAsmLine( sent_id+"_break:" );

        } else if (Sentence.type === "for") {
            sent_id = "__loop"+bc_auxVars.getNewJumpID(Sentence.line);
            writeAsmCode( codeGenerator(Sentence.threeSentences[0].CodeAST) );
            writeAsmLine( sent_id+"_condition:" );
            writeAsmCode( codeGenerator(Sentence.threeSentences[1].CodeAST, sent_id+"_break", sent_id+"_start") );
            writeAsmLine( sent_id + "_start:" );
            bc_auxVars.latest_loop_id.push(sent_id);
            Sentence.trueBlock.forEach( compileSentence );
            bc_auxVars.latest_loop_id.pop();
            writeAsmLine( sent_id+"_continue:" );
            writeAsmCode( codeGenerator(Sentence.threeSentences[2].CodeAST));
            writeAsmLine( "JMP :" + sent_id + "_condition" );
            writeAsmLine( sent_id + "_break:" );

        } else if (Sentence.type === "struct") {
            return;

        } else {
            throw new TypeError("At line: " + Sentence.line + ". Unknow Sentence type: " + Sentence.type);
        }
    }

    return bigastCompile_main();
}
