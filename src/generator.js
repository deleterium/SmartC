"use strict";

// Author: Rui Deleterium
// Project: https://github.com/deleterium/BurstAT-Compiler
// License: BSD 3-Clause License


function bigastCompile(bc_Big_ast){

    // configurations for compiler
    const bc_config = {
        compiler_version: "0",   //sets this compiler version!!!
        enableRandom:     false, //enable with #pragma enableRandom true
        maxAuxVars:       5,     //change with #pragma max_auxVars N
        reuseAssignedVar: true,  //disable with #pragma reuseAssignedVar false
        useVariableDeclaration: true, //change with #pragma useVariableDeclaration false
        version: "0",            //change with #pragma version 0
        warningToError:   true,  //change with #pragma warningToError false
        APIFunctions:     false, //enable with #include APIFunctions
    };

    // holds variables needed during compilation
    const bc_auxVars = {
        latest_loop_id: [],
        jump_id: 0,
        assemblyCode: "",
        current_function: -1,

        getNewJumpID: function () {
            if (bc_config.enableRandom === true)
                return Math.random().toString(36).substr(2,5);

            this.jump_id++;
            return this.jump_id.toString(36);
        },

        getLatestLoopId: function () {
            //error check must be in code!
            return this.latest_loop_id[this.latest_loop_id.length-1];
        }
    };



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
            pointer_operatrion: false,

            isTemp: function(name) {
                var idx = this.tmpvars.findIndex(xyz => xyz === name)
                if (idx>=0)
                    if (this.status[idx]===true)
                        return true;
                return false;
            },

            getNewTemp: function() {
                var id=this.status.indexOf(false);
                if (id==-1)
                    throw new RangeError("No more auxVars. Try to reduce nested operations or increase 'max_auxVars'");
                this.status[id]=true;
                return this.tmpvars[id];
            },

            freeVar: function(name) {
                if (name !== undefined) {
                    if (name.indexOf("$")>=0) {
                        let vars=name.split("$");
                        this.freeVar(vars[1]);
                    } else {
                        var id=this.tmpvars.indexOf(name);
                        if (id==-1)
                            return;
                        this.status[id]=false;
                    }
                }
            },

            createTmpVarsTable: function () {
                for (let i=0; i<bc_config.maxAuxVars; i++){
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


        function genCode(objTree, logicalOp, gc_revLogic, gc_jumpFalse, gc_jumpTrue) {

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
                        let asmVarName = getVarAsmName(objTree);
                        return { varname: asmVarName, instructionset: "" } ;
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

                    if (objTree.type === 'Constant') {
                        let val;
                        if (objTree.name === 'NumberDecimalStr')
                            val = BigInt(objTree.value).toString(16).padStart(16,'0');
                        else if (objTree.name === 'NumberHexStr')
                            val = objTree.value.replace("0x","").padStart(16,'0');
                        else if (objTree.name === 'String') {
                            if ( objTree.value.startsWith("BURST-") ) {
                                val = rsDecode(objTree.value.slice(6)).padStart(16,'0');
                            } else {
                                val = str2long(objTree.value);
                            }

                        } else
                            throw new RangeError("At line:"+objTree.line+". Values this type not implemented: "+objTree.Name);

                        return { varname: "#"+val, instructionset: "" } ;
                    }
                    return { instructionset: "" };
                }

            } else { //operation object

                let left, right, center;
                let tempvar, makeJump;
                let isAPI=false;
                let instructionstrain="";

                if (objTree.Operation.type === 'Arr') {
                    let asmVarName = getVarAsmName(objTree.Left);

                    if (auxVars.declaring.length != 0) {
                        // do not do any other operation when declaring an array.
                        return { instructionset: "" };
                    }

                    if (objTree.Right.type === 'Constant' && objTree.Right.value == '0') {//special case
                        return { varname: asmVarName+"$", instructionset: "" } ;
                    }

                    right=genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                    instructionstrain+=right.instructionset;

                    if (right.varname.indexOf("#")>=0 || right.varname.indexOf("$")>=0) {
                        tempvar=auxVars.getNewTemp();
                        instructionstrain+=createInstruction({type: "Assignment"},tempvar,right.varname);
                    } else {
                        tempvar=right.varname;
                    }

                    if (logicalOp === true) { //maybe logical operation was requested
                        makeJump=genCode(truthVerObj(asmVarName+"$"+tempvar), true, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        instructionstrain+=makeJump.instructionset;
                        auxVars.freeVar(tempvar);
                        return { instructionset: instructionstrain };
                    }

                    return { varname: asmVarName+"$"+tempvar, instructionset: instructionstrain } ;
                }

                if (objTree.Operation.type === 'FunctionCall') {

                    let APIargs=[];

                    let search = bc_Big_ast.functions.find(val => val.name === objTree.Left.value );
                    if (search === undefined) {
                        if (bc_config.APIFunctions){
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

                        center=genCode(objTree.Center, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        instructionstrain+=center.instructionset;
        
                        if (logicalOp === true) { //maybe logical operation was requested
                            makeJump=genCode(truthVerObj(center.varname+"$"), true, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                            instructionstrain+=makeJump.instructionset;
                            auxVars.freeVar(center.varname);
                            return { instructionset: instructionstrain };
                        }

                        return { varname: center.varname+"$", instructionset: instructionstrain };
                    }

                    center=genCode(objTree.Center, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                    instructionstrain+=center.instructionset;

                    if (objTree.Operation.value === "-") {
                        tempvar=auxVars.getNewTemp();
                        instructionstrain+=createInstruction({type: "Assignment"},tempvar,"#0000000000000000");
                        instructionstrain+= createInstruction({type: "Operator", value: "-"}, tempvar, center.varname);
                        auxVars.freeVar(center.varname);

                        if (logicalOp === true) {
                            makeJump=genCode(truthVerObj(tempvar), true, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                            instructionstrain+=makeJump.instructionset;
                            auxVars.freeVar(tempvar);
                            return { instructionset: instructionstrain };
                        }

                        return { varname: tempvar, instructionset: instructionstrain } ;
                    }

                    if (objTree.Operation.value === "~") {
                        let clear_var=false;

                        if (!auxVars.isTemp(center.varname)){
                            tempvar=auxVars.getNewTemp();
                            instructionstrain+=createInstruction({type: "Assignment"},tempvar,center.varname);
                            clear_var = true;
                        } else {
                            tempvar=center.varname;
                        }
                        instructionstrain+= createInstruction(objTree.Operation, tempvar);

                        if (logicalOp === true) {
                            makeJump=genCode(truthVerObj(tempvar), true, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                            instructionstrain+=makeJump.instructionset;
                            auxVars.freeVar(center.varname);
                            auxVars.freeVar(tempvar);
                            return { instructionset: instructionstrain };
                        }

                        if (clear_var)
                            auxVars.freeVar(center.varname);

                        return { varname: tempvar, instructionset: instructionstrain } ;
                    }

                    if (objTree.Operation.value === "&") { //unary ampersand -> not implemented
                        throw new TypeError("At line: "+objTree.Operation.line+". Unary operator '&' not implemented.");
                    }

                    throw new TypeError("At line: "+objTree.Operation.line+". Unknow unary operator: "+objTree.Operation.value);
                }

                if (objTree.Operation.type === 'SetUnaryOperator') {

                    if (cg_jumpTarget !== undefined)
                        throw new SyntaxError("At line: "+objTree.Operation.line+". Can not use SetUnaryOperator (++ or --) during logical operations with branches");
                    if (gc_jumpFalse !== undefined)
                        throw new SyntaxError("At line: "+objTree.Operation.line+". Can not use SetUnaryOperator (++ or --) during logical operations with branches");

                    if( objTree.Left !== undefined) {
                        let asmVarName = getVarAsmName(objTree.Left);
                        instructionstrain+= createInstruction(objTree.Operation,asmVarName);
                        return { varname: asmVarName, instructionset: instructionstrain };
                    } else {
                        let asmVarName = getVarAsmName(objTree.Right);
                        auxVars.postOperations+=createInstruction(objTree.Operation, asmVarName);
                        return { varname: asmVarName, instructionset: "" };
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

                    left=genCode(objTree.Left, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                    instructionstrain+=left.instructionset;
                    instructionstrain+=auxVars.getPostOperations();

                    right=genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                    instructionstrain+=right.instructionset;
                    auxVars.freeVar(right.varname);
                    instructionstrain+=auxVars.getPostOperations();

                    return { varname: left.varname, instructionset: instructionstrain } ;
                }

                if (objTree.Operation.type === "Operator" ) {

                    left=genCode(objTree.Left, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                    instructionstrain+=left.instructionset;

                    right=genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                    instructionstrain+=right.instructionset;

                    if (!auxVars.isTemp(left.varname)){
                        tempvar=auxVars.getNewTemp();
                        instructionstrain+=createInstruction({type: "Assignment"}, tempvar, left.varname);
                        auxVars.freeVar(left.varname);
                    } else {
                        tempvar=left.varname;
                    }

                    instructionstrain+=createInstruction(objTree.Operation, tempvar, right.varname);

                    if (logicalOp === true) {
                        makeJump=genCode(truthVerObj(tempvar), true, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        instructionstrain+=makeJump.instructionset;
                        auxVars.freeVar(right.varname);
                        auxVars.freeVar(tempvar);
                        return { instructionset: instructionstrain };
                    }

                    auxVars.freeVar(right.varname);
                    return { varname: tempvar, instructionset: instructionstrain } ;
                }

                if (objTree.Operation.type === "Assignment" || objTree.Operation.type === "SetOperator") {

                    if (gc_jumpFalse !== undefined)
                        throw new SyntaxError("At line: "+objTree.Operation.line+". Can not use assignment during logical operations with branches");
                    if (objTree.Left.type === "Variable"){
                        let search = bc_Big_ast.Global.declared_vars.find(val => val.value === objTree.Left.value );
                        if (search === undefined && bc_auxVars.current_function != -1) {
                            search = bc_Big_ast.functions[bc_auxVars.current_function].declared_vars.find(val => val.value === objTree.Left.value );
                        }
                        if (search !== undefined && search.mod_array === "yes"){
                            throw new SyntaxError("At line: "+objTree.Operation.line+". Trying to assign an array type variable");
                        }
                    }

                    left=genCode(objTree.Left, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                    instructionstrain+=left.instructionset;

                    if (left.varname === undefined)
                        throw new SyntaxError("At line: "+objTree.Operation.line+". Trying to assign undefined variable");
                    if (auxVars.isTemp(left.varname))
                        throw new TypeError("At line: "+objTree.Operation.line+". Invalid left value for "+objTree.Operation.type);

                    let temp_declare="";
                    if (auxVars.declaring.length != 0) {
                        temp_declare = auxVars.declaring;
                        auxVars.declaring="";
                    }
                    //check if we can reuse variables used on assignment
                    //then add it to auxVars.tmpvars
                    if ( objTree.Operation.type === "Assignment"
                        && bc_config.reuseAssignedVar === true
                        && left.varname.indexOf("$") == -1
                        && CanReuseAssignedVar(left.varname, objTree.Right) ){
                        auxVars.tmpvars.unshift(left.varname);
                        auxVars.status.unshift(false);
                        right=genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        auxVars.tmpvars.shift();
                        auxVars.status.shift();
                    } else
                        right=genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                    instructionstrain+=right.instructionset;
                    if ( temp_declare.length != 0 ){
                        auxVars.declaring=temp_declare;
                    }

                    if (right.varname === undefined) {
                        throw new TypeError("At line: "+objTree.Operation.line+". Invalid right value for "+objTree.Operation.type+". Possible void value.");
                    }
                    instructionstrain+=createInstruction(objTree.Operation, left.varname, right.varname);

                    auxVars.freeVar(left.varname);
                    auxVars.freeVar(right.varname);
                    return { varname: left.varname, instructionset: instructionstrain } ;
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
                        right=genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        instructionstrain+=right.instructionset;
                        instructionstrain+=auxVars.getPostOperations();

                        instructionstrain+=createInstruction(objTree.Left, right.varname);

                        auxVars.freeVar(right.varname);
                        return { instructionset: instructionstrain } ;
                    }

                    if (objTree.Left.value === "goto" || objTree.Left.value === "sleep" ) {
                        right=genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        instructionstrain+=right.instructionset;
                        instructionstrain+=auxVars.getPostOperations();

                        //TODO: goto: check if label exists
                        instructionstrain+=createInstruction(objTree.Left, right.varname);

                        auxVars.freeVar(right.varname);
                        return { instructionset: instructionstrain } ;
                    }
                    if (objTree.Left.value === "exit" || objTree.Left.value === "halt" ) {
                        throw new TypeError("At line: "+objTree.Left.line+". Keyword '"+objTree.Left.value+"' does not accept arguments.");
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
        function CanReuseAssignedVar(name, ast_code) {

            if (ast_code.Operation === undefined) { //end object
                if (ast_code.type === 'Variable')
                    if (ast_code.value === name)
                        return false;
                    else
                        return true;
                if (ast_code.type === 'Constant')
                    return true;
                if (ast_code.type === 'Function')
                    return true;
                if (isEmpty(ast_code))
                    return true;
            } else {
                if (ast_code.Center !== undefined)
                    if (CanReuseAssignedVar(name, ast_code.Center))
                        return true;
                    else
                        return false;
                let left, right;

                if (ast_code.Left  !== undefined)
                    left = CanReuseAssignedVar(name, ast_code.Left);
                else
                    left = true;

                if (ast_code.Right !== undefined)
                    right = CanReuseAssignedVar(name, ast_code.Right);
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

            if (objoperator.type === 'Assignment') {

                if (param1.indexOf("#") >= 0)
                    throw new SyntaxError("Can not assign a value to a constant");

                else if (param1.indexOf("$") == -1) { //param 1 is NOT an Array!

                    if (param2.indexOf("#") >= 0 ) {
                        if (param2 === "#0000000000000000")
                            return "CLR @"+param1+"\n";
                        else {
                            if (param2.length > 17) {
                                throw new RangeError("Overflow on long value assignment (value bigger than 64 bits)");
                            }
                            return "SET @"+param1+" "+param2.toLowerCase()+"\n";
                        }
                    }

                    if (param2.indexOf("$") >= 0 ) {
                        let idx= param2.split("$");
                        if (idx[1].length==0)
                            return "SET @"+param1+" $($"+idx[0]+")\n";
                        else
                            return "SET @"+param1+" $($"+idx[0]+" + $"+idx[1]+")\n";
                    }

                    if (param1 === param2)
                        return "";

                    return "SET @"+param1+" $"+param2+"\n";

                } else {  //param 1 is an Array!
                    let tempvar;
                    let retinstr="";

                    if (param2.indexOf("#") >= 0 || param2.indexOf("$") >= 0) {
                        tempvar=auxVars.getNewTemp();
                        retinstr+=createInstruction({type: "Assignment"}, tempvar, param2);
                    } else {
                        tempvar=param2;
                    }

                    let idx= param1.split("$");
                    if (idx[1].length==0)
                        retinstr+= "SET @($"+idx[0]+") $"+tempvar+"\n";
                    else
                        retinstr+= "SET @($"+idx[0]+" + $"+idx[1]+") $"+tempvar+"\n";

                    auxVars.freeVar(tempvar);
                    return retinstr;
                }
            }

            if (objoperator.type === 'Operator' || objoperator.type === 'SetOperator') {

                let tempparam1="";
                let tempparam2="";
                let freeParam1=false;
                let retinstr="";

                if  (param2.indexOf("#") >= 0 || param2.indexOf("$") >= 0) {
                        tempparam2=auxVars.getNewTemp();
                        retinstr+=createInstruction({type: "Assignment"}, tempparam2, param2);
                } else {
                    tempparam2 = param2;
                }

                if  (param1.indexOf("$") >= 0) {
                        tempparam1=auxVars.getNewTemp();
                        freeParam1=true;
                        retinstr+=createInstruction({type: "Assignment"}, tempparam1, param1);
                } else {
                    tempparam1 = param1;
                }

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

                retinstr +=" @"+tempparam1+" $"+tempparam2+"\n";

                auxVars.freeVar(tempparam2);
                if (freeParam1 === true) {
                    retinstr+=createInstruction({type: "Assignment"}, param1, tempparam1);
                    auxVars.freeVar(tempparam1);
                }

                return retinstr;
            }

            if (objoperator.type === 'UnaryOperator' || objoperator.type === 'SetUnaryOperator') {

                if (objoperator.value === '++') {
                    return "INC @"+param1+"\n";
                }
                if (objoperator.value === '--') {
                    return "DEC @"+param1+"\n";
                }
                if (objoperator.value === '~') {
                    return "NOT @"+param1+"\n";
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
                    return "JMP :"+param1+"\n";
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
                    let tempvar;

                    if (param1.indexOf("#") >= 0 || param1.indexOf("$") >= 0) {
                        tempvar=auxVars.getNewTemp();
                        retinstr+=createInstruction({type: "Assignment"}, tempvar, param1);
                    } else {
                        tempvar=param1;
                    }
                    
                    if (objoperator.value === 'return') {
                        retinstr+= "PSH $"+tempvar+"\n";
                        retinstr+= "RET\n";
                    } else if ( objoperator.value === 'sleep' ){
                        retinstr+= "SLP $"+tempvar+"\n";
                    }

                    auxVars.freeVar(tempvar);

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


        // Input: javascript string (utf-16)
        // Output: string representing same string in hexadecimal utf-8
        function str2long(in_str)
        {
            if ( !(typeof in_str === 'string' || in_str instanceof String) )
                return undefined;

            var byarr = [];
            var ret = "";
            var c,c1, i, j;

            for (i=0; i<in_str.length; i++) {
                c = in_str.charCodeAt(i);

                if (c < 128)
                    byarr.push(c);
                else {
                    if (c < 2048) {
                        byarr.push(c>>6 | 0xc0);    //ok
                        byarr.push((c & 63) | 128); //ok
                    } else {
                        if (c < 55296 || c > 57343) {
                            byarr.push(((c >> 12 ) & 63) | 0xe0); //ok
                            byarr.push(((c >> 6 ) & 63) | 128); //ok
                            byarr.push((c & 63) | 128); //ok
                        } else {
                            i++;
                            c1 = in_str.charCodeAt(i);
                            if ((c & 0xFC00) == 0xd800 && (c1 & 0xFC00) == 0xDC00) {
                                c = ((c & 0x3FF) << 10) + (c1 & 0x3FF) + 0x10000;
                                byarr.push(((c >> 18 ) & 63) | 0xf0); //ok
                                byarr.push(((c >> 12 ) & 63) | 128); //ok
                                byarr.push(((c >> 6 ) & 63) | 128); //ok
                                byarr.push((c & 63) | 128); //ok
                            }
                        }
                    }
                }
            }
            if (byarr.length > 8)
                throw new RangeError("String bigger than 8 bytes: "+in_str);
            for (j=0; j<8; j++){
                if (j >= byarr.length)
                    ret="00"+ret;
                else
                    ret=byarr[j].toString(16).padStart(2, '0')+ret;
            }
            return(ret);
        }

        function rsDecode(cypher_string) {

            var gexp = [ 1, 2, 4, 8, 16, 5, 10, 20, 13, 26, 17, 7, 14, 28, 29, 31, 27, 19, 3, 6, 12, 24, 21, 15, 30, 25, 23, 11, 22, 9, 18, 1 ];
            var glog = [ 0, 0, 1, 18, 2, 5, 19, 11, 3, 29, 6, 27, 20, 8, 12, 23, 4, 10, 30, 17, 7, 22, 28, 26, 21, 25, 9, 16, 13, 14, 24, 15 ];
            var alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
            var codeword_map = [ 3, 2, 1, 0, 7, 6, 5, 4, 13, 14, 15, 16, 12, 8, 9, 10, 11 ];

            function gmult(a, b) {
                if (a == 0 || b == 0) {
                  return 0;
                }
                var idx = (glog[a] + glog[b]) % 31;
                return gexp[idx];
            }

            function is_codeword_valid(codeword) {
                var sum = 0;
                var i, j, t, pos;

                for ( i = 1; i < 5; i++) {
                    t = 0;
                    for ( j = 0; j < 31; j++) {
                        if (j > 12 && j < 27) {
                            continue;
                        }
                        pos = j;
                        if (j > 26) {
                            pos -= 14;
                        }
                        t ^= gmult(codeword[pos], gexp[(i * j) % 31]);
                    }
                  sum |= t;
                }

                return sum == 0;
            }

            var codeword_length = 0;
            var codeword = [];
            var i;
            var codework_index;

            for (i=0; i < cypher_string.length; i++ ) {
                var position_in_alphabet = alphabet.indexOf(cypher_string.charAt(i));
                if (position_in_alphabet <= -1) {
                    continue;
                }
                codework_index = codeword_map[codeword_length];
                codeword[codework_index] = position_in_alphabet;
                codeword_length++;
            }
            if (codeword_length != 17 || !is_codeword_valid(codeword)) {
                throw new TypeError("Error decoding BURST address: BURST-"+cypher_string);
            }

            //base32 to base10 conversion
            var length = 13;
            var big_val=0n;
            var big_mul=1n;
            for (i = 0; i < length; i++) {
                big_val += big_mul * BigInt(codeword[i]);
                big_mul *= 32n;
            }

            return big_val.toString(16);
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


        //get variable name and checks its declaration
        function getVarAsmName(obj_variable) {
            let search;

            if (bc_config.useVariableDeclaration === false) {
                return obj_variable.value;
            }

            search = bc_Big_ast.Global.declared_vars.find(val => val.value === obj_variable.value );

            //variable declaration in global section
            if (bc_auxVars.current_function == -1 && auxVars.declaring.length != 0 ) {
                if (search === undefined) {
                    throw new SyntaxError("At line: "+line+". Variable '"+obj_variable.value+"' not declared. BUGREPORT PLEASE");
                }
                if (search.dec_in_generator === "yes" ) {
                    throw new SyntaxError("At line: "+obj_variable.line+". Variable '"+obj_variable.value+"' already declared at line: "+search.line);
                }
                search.dec_in_generator = "yes";
                search.asmName = obj_variable.value;
                return search.asmName;
            }

            // we are in declaration sentence inside a function
            if (bc_auxVars.current_function != -1 && auxVars.declaring.length != 0 ) { 
                if (search !== undefined) {
                    throw new SyntaxError("At line: "+obj_variable.line+". Variable '"+obj_variable.value+"' declared but there is a global variable with same name.");
                }
                search = bc_Big_ast.functions[bc_auxVars.current_function].declared_vars.find(val => val.value === obj_variable.value );
                if (search === undefined) {
                    throw new SyntaxError("At line: "+obj_variable.line+". Variable '"+obj_variable.value+"' not declared. BugReport Please");
                }
                if (search.dec_in_generator === "yes") {
                    throw new SyntaxError("At line: "+obj_variable.line+". Variable '"+obj_variable.value+"' already declared at line: "+search.line);
                }
                search.dec_in_generator = "yes";
                search.asmName = bc_Big_ast.functions[bc_auxVars.current_function].name+"_"+obj_variable.value;
                return search.asmName;
            }

            // function section
            if (bc_auxVars.current_function != -1) {
                if (search !== undefined) { //global variable found
                    if (search.dec_in_generator === "no") {
                        throw new SyntaxError("At line: "+obj_variable.line+". Using Variable '"+obj_variable.value+"' before declaration. It is declared at line: "+search.line+".");
                    }
                    return search.asmName; //found global variable
                }
                search = bc_Big_ast.functions[bc_auxVars.current_function].declared_vars.find(val => val.value === obj_variable.value );
            }

            // search variable is ok to be returned, do checks!
            if (search === undefined) {
                throw new SyntaxError("At line: "+obj_variable.line+". Variable '"+obj_variable.value+"' not declared.");
            }
            if (search.dec_in_generator === "no") {
                throw new SyntaxError("At line: "+obj_variable.line+". Using Variable '"+obj_variable.value+"' before declaration.");
            }

            return search.asmName;
        }

        auxVars.createTmpVarsTable();

        var code, jmpTrueTarget;

        if (cg_jumpTarget === undefined) {
            code=genCode(cg_ast, false, false, cg_jumpTarget, jmpTrueTarget);
            if (auxVars.isTemp(code.varname)) {
                var line;
                if (cg_ast.line !== undefined) {
                    line = cg_ast.line;
                } else if (cg_ast.Operation.line !== undefined) {
                    line = cg_ast.Operation.line;
                }
                if (bc_config.warningToError) {
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

    function isEmpty(obj) {
        for(var prop in obj) {
            if(obj.hasOwnProperty(prop))
                return false;
        }
        return true;
    }

    function writeAsmLine(line){
        bc_auxVars.assemblyCode+=line+"\n";
    }
    function writeAsmCode(lines){
        bc_auxVars.assemblyCode+=lines;
    }

    // handles variables declarations to assembly code.
    function declarationGenerator (Args) {

        var prefix="";
        if (bc_auxVars.current_function >= 0){
            prefix = bc_Big_ast.functions[bc_auxVars.current_function].name+"_";
        }
        if (bc_auxVars.current_function == -1){
            for (var i=0; i< bc_config.maxAuxVars; i++){
                writeAsmLine("^declare r"+i);
            }
        }

        if (Args.type !== "Variable") {
            throw new TypeError("At line: "+ Args.line + ". Wrong token type for declaration. Expected 'Variable', got: " + Args.type);
        }
        if (Args.mod_array === "no") {
            if (Args.size != 1) {
                throw new TypeError("At line: "+ Args.line + ". Wrong size for variable declaration. Expected '1', got: " + Args.size);
            }
            if (Args.declaration === "long") {
                if (bc_auxVars.current_function == -1){
                    writeAsmLine("^declare "+Args.value);
                } else {
                    writeAsmLine("^declare "+prefix+Args.value);
                }
            }
        } else { //mod_array === yes
            if (Args.declaration === "long") {
                if (Args.size == 1) {
                    writeAsmLine("^declare "+prefix+Args.value);
                } else {
                    writeAsmLine("^allocate "+prefix+Args.value+" "+(Args.size-1));
                }
            }
        }
    }

    //function to add variables that were declared inside function declaration.
    //   This case was not handled in createVariablesTable() at shape.js
    function addArgsToDeclaredVars (){
        var Node;
        for (var i=bc_Big_ast.functions[bc_auxVars.current_function].arguments.length-1; i>=0; i--) {
            Node = bc_Big_ast.functions[bc_auxVars.current_function].arguments[i];
            Node.dec_in_generator = "yes";
            Node.size = 1;
            Node.asmName = bc_Big_ast.functions[bc_auxVars.current_function].name+"_"+Node.value;
            bc_Big_ast.functions[bc_auxVars.current_function].declared_vars.push(Node);
        }

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

        } else {
            throw new TypeError("At line: " + Sentence.line + ". Unknow Sentence type: " + Sentence.type);
        }
    }


    // read macros values and put them into bc_config variable
    function processMacro( Token ) {

        function get_val(val){
            if (val === undefined) {
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
                    bc_config.maxAuxVars = num;
                    return;
                }
            }
            if (Token.property === "reuseAssignedVar") {
                bc_config.reuseAssignedVar = get_val(Token.value);
                if (bc_config.reuseAssignedVar !== undefined)
                    return;
            }
            if (Token.property === "enableRandom") {
                bc_config.enableRandom = get_val(Token.value);
                if (bc_config.enableRandom !== undefined)
                    return;
            }
            if (Token.property === "useVariableDeclaration") {
                bc_config.useVariableDeclaration = get_val(Token.value);
                if (bc_config.useVariableDeclaration !== undefined)
                    return;
            }
            if (Token.property === "version") {
                bc_config.version = Token.value;
                if (bc_config.version !== undefined)
                    return;
            }
            if (Token.property === "warningToError") {
                bc_config.warningToError = get_val(Token.value);
                if (bc_config.warningToError !== undefined)
                    return;
            }
        }

        if (Token.type === "include") {
            if (Token.property === "APIFunctions") {
                bc_config.APIFunctions = get_val(Token.value);
                if (bc_config.APIFunctions !== undefined)
                    return;
            }
        }

        throw new TypeError("At line: "+Token.line+". Unknow macro property and/or value: #"+Token.type+" "+Token.property+" "+Token.value);
    }

    // last, but not least: bigastCompile core lines!

    // Macro handler
    bc_Big_ast.Global.macros.forEach( processMacro );
    if (bc_config.version !== bc_config.compiler_version) {
        new TypeError("This compiler is version '"+bc_config.compiler_version+"'. File needs version '"+bc_config.version+"'.");
    }

    // add variables declaration
    if ( bc_config.useVariableDeclaration) {
        bc_Big_ast.Global.declared_vars.forEach( declarationGenerator );
    }

    // Add code for global sentences
    bc_auxVars.current_function = -1;
    bc_Big_ast.Global.sentences.forEach( compileSentence );

    // For every function:
    bc_auxVars.current_function = 0;
    while (bc_auxVars.current_function < bc_Big_ast.functions.length) {

        writeAsmLine(""); //blank line to be nice to debugger!
        // add variables declararion
        if ( bc_config.useVariableDeclaration) {
            bc_Big_ast.functions[bc_auxVars.current_function].arguments.forEach( addArgsToDeclaredVars );
            bc_Big_ast.functions[bc_auxVars.current_function].declared_vars.forEach( declarationGenerator );
        }

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

    return bc_auxVars.assemblyCode;
}