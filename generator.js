"use strict";

// Author: Rui Deleterium
// Project:
// License:

// Traverse the AST created by syntaxer and creates a stream of assembly
//   instructions. Due to caracteristics of Burstcoin's AT language, I
//   decided to make use of auxiliary variables as registers because it
//   is more effective than handle user stack.
// If reuseAssignedVar is true (or undefined) the function will use 
//   variables from the left side of an Assignment a register. This can
//   save one last operation and will increase the number of auxVars
//   available.
// If returnVar is true, this function returns an object with varname
//    and instructionset. If not defined or false, this functions returns
//    only assembly text. Another call to this function will not remember
//    this settings and can overwrite tempvar contents. Intended for
//    future use in loops and conditionals

function codeGenerator(ast, reuseAssignedVar, returnVar) {

    const auxVars = {
        tmpvars: [  'r0',  'r1',  'r2',  'r3',  'r4' ],
        status:  [ false, false, false, false, false ],
        assignFound: false,
        postOperations: "",
        isTemp: function(name) {
            if (this.tmpvars.indexOf(name)>=0)
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
            if (name.indexOf("$")>=0) {
                let vars=name.split("$");
                this.freeVar(vars[1]);
            } else {
                var id=this.tmpvars.indexOf(name);
                if (id==-1)
                    return;
                this.status[id]=false;
            }
        },
        setAssignFound: function(name) {
            if (name === "Assignment" || name === "SetOperator" || name === "SetUnaryOperator" || returnVar===true) {
                this.assignFound=true;
            } else if (name === "NewCodeLine")
                this.assignFound=false;
        },
        getPostOperations: function () {
            var ret = this.postOperations;
            this.postOperations = "";
            return ret;
        }
    };

    function genCode(objTree) {

        if (objTree.Operation === undefined) { //end object
            if (objTree.type === 'Variable')
                return { varname: objTree.value } ;
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
                return { varname: "#"+val} ;
            }
            return {};
        } else { //operation object
            if (objTree.Operation.type === 'Arr') {
                if (objTree.Right.type === 'Constant' && objTree.Right.value == '0') //special case
                    return { varname: objTree.Left.value+"$"} ;
                let tempvar;
                let instructionstrain="";
                let right=genCode(objTree.Right);
                if (right.instructionset !== undefined)
                    instructionstrain+=right.instructionset;
                if (right.varname.indexOf("#")>=0 || right.varname.indexOf("$")>=0) {
                    tempvar=auxVars.getNewTemp();
                    instructionstrain+=createInstruction({type: "Assignment"},tempvar,right.varname);
                } else {
                    tempvar=right.varname;
                }
                return { varname: objTree.Left.value+"$"+tempvar, instructionset: instructionstrain } ;
            }
            if (objTree.Operation.type === 'UnaryOperator') {
                let center=genCode(objTree.Center);
                let instructionstrain="";
                let tempvar;
                if (center.instructionset !== undefined)
                    instructionstrain+=center.instructionset;
                if (objTree.Operation.value === "+") //unary + -> do nothing
                    return { varname: center.varname, instructionset: instructionstrain };
                if (objTree.Operation.value === "*") //unary ( -> pointer operation
                    return { varname: center.varname+"$", instructionset: instructionstrain };
                if (objTree.Operation.value === "-") {
                    tempvar=auxVars.getNewTemp();
                    instructionstrain+=createInstruction({type: "Assignment"},tempvar,"#0000000000000000");
                    instructionstrain+= createInstruction({type: "Operator", value: "-"}, tempvar, center.varname);
                    auxVars.freeVar(center.varname);
                    return { varname: tempvar, instructionset: instructionstrain } ;
                }
                if (!auxVars.isTemp(center.varname)){
                    if (auxVars.assignFound===false) {
                        throw new SyntaxError("Can not use operations without assignment if function is set to not return temporary variables");
                    }
                    tempvar=auxVars.getNewTemp();
                    instructionstrain+=createInstruction({type: "Assignment"},tempvar,center.varname);
                } else {
                    tempvar=center.varname;
                }
                instructionstrain+= createInstruction(objTree.Operation, tempvar);
                return { varname: tempvar, instructionset: instructionstrain } ;
            }
            if (objTree.Operation.type === 'SetUnaryOperator') {
                auxVars.setAssignFound(objTree.Operation.type);
                let instructionstrain="";
                if( objTree.Left !== undefined) {
                    instructionstrain+= createInstruction(objTree.Operation, objTree.Left.value);
                    return { varname: objTree.Left.value, instructionset: instructionstrain };
                } else {
                    auxVars.postOperations+=createInstruction(objTree.Operation, objTree.Right.value);
                    return { varname: objTree.Right.value };
                }
            }

            //he have binary operator
            let left, right;
            let instructionstrain="";

            auxVars.setAssignFound(objTree.Operation.type);
            left=genCode(objTree.Left);
            if (left.instructionset !== undefined)
                instructionstrain+=left.instructionset;
            auxVars.setAssignFound(objTree.Operation.type);
            if (objTree.Operation.type === "NewCodeLine" )
                instructionstrain+=auxVars.getPostOperations();
            if (     objTree.Operation.type === "Assignment"
                  && reuseAssignedVar === true
                  && left.varname.indexOf("$") == -1
                  && CanReuseAssignedVar(left.varname, objTree.Right) ){
                auxVars.tmpvars.unshift(left.varname);
                auxVars.status.unshift(false);
                right=genCode(objTree.Right);
                auxVars.tmpvars.shift();
                auxVars.status.shift();
            } else
                right=genCode(objTree.Right);

            if (right.instructionset !== undefined)
                instructionstrain+=right.instructionset;
            if (objTree.Operation.type === "NewCodeLine" )
                instructionstrain+=auxVars.getPostOperations();

            if (objTree.Operation.type === "Assignment" || objTree.Operation.type === "SetOperator") {
                auxVars.assignFound=true;
                if (left.varname === undefined)
                    throw new SyntaxError("Trying to assign undefined variable");
                if (auxVars.isTemp(left.varname))
                    throw new TypeError("Invalid left value for "+objTree.Operation.type);
                instructionstrain+=createInstruction(objTree.Operation, left.varname, right.varname);
                auxVars.freeVar(left.varname);
                auxVars.freeVar(right.varname);
                return { varname: left.varname, instructionset: instructionstrain } ;
            }
            if (objTree.Operation.type === "Operator" ) {
                let tempvar;
                if (!auxVars.isTemp(left.varname)){
                    tempvar=auxVars.getNewTemp();
                    instructionstrain+=createInstruction({type: "Assignment"}, tempvar, left.varname);
                    auxVars.freeVar(left.varname);
                } else {
                    tempvar=left.varname;
                }
                instructionstrain+=createInstruction(objTree.Operation, tempvar, right.varname);
                auxVars.freeVar(right.varname);
                return { varname: tempvar, instructionset: instructionstrain } ;
            }
            if (objTree.Operation.type === "NewCodeLine") {
                if (returnVar === 'true')
                    throw new TypeError("returnVar is active, can not make more than one statement.");
                if (right.varname !== undefined)
                    auxVars.freeVar(right.varname);
                return { varname: left.varname, instructionset: instructionstrain } ;
            }
            throw new TypeError("Code generation error: Unknown operation "+objTree.Operation.type);
        }
    }

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

    function createInstruction(objoperator, param1, param2 ) {

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
            if (objoperator.value === '+' || objoperator.value === '+=') {
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

    if (returnVar === undefined)
        returnVar=false;
    if (reuseAssignedVar === undefined)
        reuseAssignedVar=true;

    var code=genCode(ast);
    if (code.instructionset === undefined)
        code.instructionset="";
    code.instructionset+=auxVars.postOperations;
    if (returnVar)
        return code;
    else {
        if (auxVars.isTemp(code.varname) )
            throw new TypeError("Trying to returna temporary variable. If you want to do that, active returnVar.")
        return code.instructionset;
    }
}
