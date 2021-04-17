"use strict";

// Author: Rui Deleterium
// Project: https://github.com/deleterium/BurstAT-Compiler
// License: BSD 3-Clause License

// Traverse the AST created by syntaxer and creates a stream of assembly
//   instructions. Due to caracteristics of Burstcoin's AT language, I
//   decided to make use of auxiliary variables as registers because it
//   is more effective than handle user stack.
// cg_jumpTarget must be set if the evaluation is part of conditionals or
//   loops. It shall be the location where to jump if the evaluated 
//   expression is false.
// cg_disableRandom is usefull for running test cases, so there is a
//   predictable output. Never use to generate code, because it will lead
//   to labels with same name, causing compilation error.


function codeGenerator(cg_ast, cg_jumpTarget, cg_disableRandom) {

    const auxVars = {

        tmpvars: [  'r0',  'r1',  'r2',  'r3',  'r4' ],
        status:  [ false, false, false, false, false ],
        reuseAssignedVar: true, //well tested and working
        postOperations: "",
        orderedRandom:  [ "Z", "Y", "X", "W", "V", "U", "T", "S", "R", "Q", "P", "O", "N", "M", "L", "K", "J", "I", "H", "G", "F", "E", "D", "C", "B", "A" ],

        isTemp: function(name) {
            var idx = this.tmpvars.findIndex(xyz => xyz === name)
            if (idx>=0)
                if (this.status[idx]===true)
                    return true;
            return false
        },

        getNewTemp: function() {
            var id=this.status.indexOf(false);
            if (id==-1)
                throw new RangeError("No more auxVars. Try to reduce nested operations");
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

        getPostOperations: function () {
            var ret = this.postOperations;
            this.postOperations = "";
            return ret;
        }
    };


    function genCode(objTree, logicalOp, gc_revLogic, gc_jumpFalse, gc_jumpTrue) {

        if (objTree.Operation === undefined) { //end object

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
                } else
                    throw new TypeError("No logical operations... Do not know what to do.");
            } else {
                if (objTree.type === 'Variable')
                    return { varname: objTree.value, instructionset: "" } ;
                if (objTree.type === 'Constant') {
                    let val;
                    if (objTree.name === 'NumberDecimalStr')
                        val = parseInt(objTree.value).toString(16).padStart(16,'0');
                    else if (objTree.name === 'NumberHexStr')
                        val = objTree.value.replace("0x","").padStart(16,'0');
                    else if (objTree.name === 'String') {
                        val = str2long(objTree.value);
                    } else
                        throw new RangeError("Values this type not implemented: "+objTree.Name);
                    return { varname: "#"+val, instructionset: "" } ;
                }
                return { instructionset: "" };
            }

        } else { //operation object

            let left, right, center;
            let tempvar, makeJump;
            let instructionstrain="";

            if (objTree.Operation.type === 'Arr') {

                if (objTree.Right.type === 'Constant' && objTree.Right.value == '0') //special case
                    return { varname: objTree.Left.value+"$", instructionset: "" } ;

                right=genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                instructionstrain+=right.instructionset;

                if (right.varname.indexOf("#")>=0 || right.varname.indexOf("$")>=0) {
                    tempvar=auxVars.getNewTemp();
                    instructionstrain+=createInstruction({type: "Assignment"},tempvar,right.varname);
                } else {
                    tempvar=right.varname;
                }

                if (logicalOp === true) { //maybe logical operation was requested
                    makeJump=genCode(truthVerObj(objTree.Left.value+"$"+tempvar), true, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                    instructionstrain+=makeJump.instructionset;
                    auxVars.freeVar(tempvar);
                    return { instructionset: instructionstrain };
                }

                return { varname: objTree.Left.value+"$"+tempvar, instructionset: instructionstrain } ;
            }

            if (objTree.Operation.type === 'UnaryOperator') {

                if (objTree.Operation.value === "!") { //logical NOT

                    if (logicalOp === true) {
                        return genCode(objTree.Center, true, !gc_revLogic, gc_jumpTrue, gc_jumpFalse);

                    } else {

                        let IDNotSF, IDNotST, IDEnd, rnd;

                        if (cg_disableRandom)
                            rnd=auxVars.orderedRandom.pop();
                        else
                            rnd=Math.random().toString(36).substr(2,5);

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
                    //return { varname: center.varname, instructionset: instructionstrain };
                }

                center=genCode(objTree.Center, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                instructionstrain+=center.instructionset;

                if (objTree.Operation.value === "*") { //unary star -> pointer operation

                    if (logicalOp === true) { //maybe logical operation was requested
                        makeJump=genCode(truthVerObj(center.varname+"$"), true, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        instructionstrain+=makeJump.instructionset;
                        auxVars.freeVar(center.varname);
                        return { instructionset: instructionstrain };
                    }

                    return { varname: center.varname+"$", instructionset: instructionstrain };
                }

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
                    throw new TypeError("Unary operator & not implemented. ");
                }

                throw new TypeError("Unknow unary operator: "+objoperator.value);
            }

            if (objTree.Operation.type === 'SetUnaryOperator') {

                if (cg_jumpTarget !== undefined)
                    throw new SyntaxError("Can not use SetUnaryOperator (++ or --) during logical operations with branches");
                if (gc_jumpFalse !== undefined)
                    throw new SyntaxError("Can not use SetUnaryOperator (++ or --) during logical operations with branches");

                if( objTree.Left !== undefined) {
                    instructionstrain+= createInstruction(objTree.Operation, objTree.Left.value);
                    return { varname: objTree.Left.value, instructionset: instructionstrain };
                } else {
                    auxVars.postOperations+=createInstruction(objTree.Operation, objTree.Right.value);
                    return { varname: objTree.Right.value, instructionset: "" };
                }
            }

            if (objTree.Operation.type === "Comparision") {


                if (logicalOp === false && gc_jumpFalse === undefined) {// need to transform arithmetic to logical

                    let IDCompSF, IDCompST, IDEnd, rnd, ret;

                    if (cg_disableRandom)
                        rnd=auxVars.orderedRandom.pop();
                    else
                        rnd=Math.random().toString(36).substr(2,5);

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

                    if (cg_disableRandom)
                        rnd=auxVars.orderedRandom.pop();
                    else
                        rnd=Math.random().toString(36).substr(2,5);

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

                    if (cg_disableRandom)
                        rnd=auxVars.orderedRandom.pop();
                    else
                        rnd=Math.random().toString(36).substr(2,5);

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

            if (objTree.Operation.type === "NewCodeLine" ) {

                if (cg_jumpTarget !== undefined)
                    throw new TypeError("Only one expression at a time if cg_jumpTarget is set.");

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
                    throw new SyntaxError("Can not use assignment during logical operations with branches");

                left=genCode(objTree.Left, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                instructionstrain+=left.instructionset;

                if (left.varname === undefined)
                    throw new SyntaxError("Trying to assign undefined variable");
                if (auxVars.isTemp(left.varname))
                    throw new TypeError("Invalid left value for "+objTree.Operation.type);

                //check if we can reuse variables used on assignment
                //then add it to auxVars.tmpvars
                if ( objTree.Operation.type === "Assignment"
                      && auxVars.reuseAssignedVar === true
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

                instructionstrain+=createInstruction(objTree.Operation, left.varname, right.varname);

                auxVars.freeVar(left.varname);
                auxVars.freeVar(right.varname);
                return { varname: left.varname, instructionset: instructionstrain } ;
            }
            throw new TypeError("Code generation error: Unknown operation "+objTree.Operation.type);
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
    }


    // Traverse an AST searching for assign operations. Returns:
    //   2 if AST is empty (or only NewCodeLine)
    //   1 if AST has assign on every newCodeline
    //   0 if AST has other operations in at least one NewCodeLine
    function InspectAssign(ast_code) {

        if (isEmpty(ast_code))
            return 2;

        if (ast_code.Operation === undefined)
            return 0;

        if (   ast_code.Operation.type === "Assignment"
            || ast_code.Operation.type === "SetOperator"
            || ast_code.Operation.type === "SetUnaryOperator") {
            //end object
            return 1;
        } else {

            if (ast_code.Operation.type === "NewCodeLine") {
                let left, right;

                if (ast_code.Left !== undefined)
                    left = InspectAssign(ast_code.Left);
                else
                    left = 0;

                if (ast_code.Right !== undefined)
                    right = InspectAssign(ast_code.Right);
                else
                    right = 0;

                if (left ==0 || right==0)
                    return 0;

                if (left == 2 && right == 2)
                    return 2;

                return 1;
            }
            else
                return 0;
        }
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
                    else
                        return "SET @"+param1+" "+param2+"\n";
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

        if (objoperator.type === 'NewCodeLine') {
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

    function isEmpty(obj) {
        for(var prop in obj) {
            if(obj.hasOwnProperty(prop))
                return false;
        }
        return true;
    }

    var ast_cat = InspectAssign(cg_ast);
    if (cg_jumpTarget === undefined) { //arithmetics only
        if (ast_cat==2)
            return "";
        if (ast_cat==0)
            throw new TypeError("There is at least one expression without assigment. Can not proceed.")
    } else { //logical operations
        if (ast_cat==2)
            throw new TypeError("Missing expression to evaluate. Can not proceed.")
    }

    if (cg_disableRandom === undefined)
        cg_disableRandom=false;

    var code, jmpTrueTarget;

    if (cg_jumpTarget === undefined)
        code=genCode(cg_ast, false, false, cg_jumpTarget, jmpTrueTarget);
    else {
        jmpTrueTarget= cg_jumpTarget.slice(0,cg_jumpTarget.lastIndexOf("_"))+"_start";
        code=genCode(cg_ast,  true, false, cg_jumpTarget, jmpTrueTarget);
    }

    code.instructionset+=auxVars.postOperations;
    if (cg_jumpTarget !== undefined)
        code.instructionset+=createInstruction({type: "Label"},jmpTrueTarget);

    //optimizations for jumps and labels
    if (code.instructionset.indexOf(":") >=0)
        //code.instructionset+="\n\n"+optimizeJumps(code.instructionset);
        code.instructionset=optimizeJumps(code.instructionset);

    return code.instructionset;
}
