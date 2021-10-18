function onLoad() {
    var scode = document.getElementById("source-code");
    scode.addEventListener('keyup',textKeyUp);
    scode.addEventListener('keydown',textKeyUp);
    scode.addEventListener('click',textKeyUp);
    scode.addEventListener('mousedown',SetSourceCode);
    scode.addEventListener('mouseup',textKeyUp);
    scode.addEventListener('paste',textKeyUp);

    document.getElementById("compile").addEventListener('click', compileCode);
    document.getElementById("test").addEventListener('click', testCode);
    document.getElementById("btn_help").addEventListener('click', detachHelp);
    document.getElementById("source_is_c").addEventListener('click', toggleLang);
    document.getElementById("save").addEventListener('click', SaveSource);
    document.getElementById("load").addEventListener('click', LoadSource);


    document.getElementById("source_legend").addEventListener('click',detachSource);
    document.getElementById("actions_legend").addEventListener('click',detachActions);
    document.getElementById("status_legend").addEventListener('click',detachStatus);
    document.getElementById("assembly_legend").addEventListener('click',detachAssembly);
    document.getElementById("deployment_legend").addEventListener('click',detachDeployment);

    textKeyUp();
    toggleLang(document.getElementById("source_is_c"));

    detachDeployment().minimize(true);
}

var colorToggle;
var colorMode;

function compileCode(){

    var codeString = document.getElementById("source-code").value;
    var preprocessor_output, token_output, parser_output, ver_output, big_ast, big_ast_opTree;
    var msg;

    const t0 = new Date();

    try{
        if (document.getElementById("source_is_c").checked) {
            preprocessor_output = preprocessor(codeString);
            token_output = tokenizer(preprocessor_output);
            parser_output = parser(token_output);
            ver_output = verify(parser_output);
            big_ast = shapeProgram(ver_output);
            big_ast_opTree = bigastProcessSyntax(big_ast);
            asmCode = bigastCompile(big_ast_opTree);
        } else {
            asmCode = codeString;
        }

        document.getElementById("assembly_output").innerHTML = asm_highlight(asmCode);
        var bcode = bytecode(asmCode);

        //document.getElementById("status_output").innerHTML = asmCode+"\n\n"+asmCode.replace(/\n/g,"\\n")+"\n\n"+JSON.stringify(bcode, null , '    ');//+JSON.stringify(big_ast_opTree, null, '    ');
        //document.getElementById("status_output").innerHTML = asmCode+"\n\n"+JSON.stringify(big_ast_opTree, null, '    ');
        //document.getElementById("status_output").innerHTML = JSON.stringify(bcode, stringifyReplacer , '    ');
        //document.getElementById("status_output").innerHTML = JSON.stringify(bcode, null , '    ');
        const t1 = new Date();
        msg="<span class='msg_success'>Compile sucessfull!!!</span> <small>Compiled at " + t1.getHours() +":"+t1.getMinutes()+":"+t1.getSeconds();
        if (document.getElementById("debug").checked) {
            msg+=" in "+(t1-t0)+" ms.\n\n"+JSON.stringify(bcode, null , '    ')
        }
        document.getElementById("status_output").innerHTML = msg+"</small>";

        fill_form(bcode);

    }catch (e) {
        document.getElementById("assembly_output").innerHTML = "";
        clear_form();
        var msg = "<span class='msg_failure'>Compile failed</span>\n\n"+e.message;
        if (document.getElementById("debug").checked) {
            msg+="\n\n"+e.stack;
        }
        document.getElementById("status_output").innerHTML = msg;
    }
}

function textKeyUp (force) {
    var elem = document.getElementById("source-code");
    var text = elem.value;
    var i;

    SetSourceCode(force);

    // grows text area
    var oldrow = elem.rows;
    var newrow = (text.match(/\n/g) || '').length + 5;

    //eye-candy (resize in 8 steps using polinomial interpolation)
    i=1;
    var end=9;
    var id;
    function frame() {
        if (i>9) {
            clearInterval(id);
        } else {
            i++;
            elem.rows = Math.round( i*i*(oldrow -newrow)/(end*end) + i*(newrow - oldrow)*(2/end) + oldrow);
            document.getElementById('color_code').style.height=elem.offsetHeight+"px";
        }
    }
    if (newrow-oldrow > 3 || newrow-oldrow < -3) id=setInterval(frame, 100);
    else elem.rows = newrow;
    //eye-candy end

    document.getElementById('color_code').style.height=elem.offsetHeight+"px";

    //update tooltip info (line:column)
    var cpos = elem.value.substr(0, elem.selectionStart).split("\n");
    document.getElementById("tooltip_span").innerHTML="Cursor: "+ cpos.length + ":"+cpos[cpos.length-1].length;
}

function SetColorCode () {
    var source=document.getElementById('source-code');

    if (source.selectionStart != source.selectionEnd) {
        //Do not highlight if some text is selected. This prevents
        //  text selection to fade away.
        return;
    }

    if (colorMode!="color") {
        colorMode="color"
        clearTimeout(colorToggle);
        var dest=document.getElementById('color_code');

        if(document.getElementById("source_is_c").checked) {
            dest.innerHTML=hljs.highlight(source.value, {language: 'c'}).value+"\n\n\n\n\n";
        } else {
            dest.innerHTML=asm_highlight(source.value)+"\n\n\n\n\n";
        }
        source.className ="transp";
    }
}
function SetSourceCode (force) {
    clearTimeout(colorToggle);
    colorToggle=setTimeout(SetColorCode, 500);
    if (colorMode!="source" || force === true) {
        colorMode="source";
        document.getElementById('source-code').className="opaque";
    }
}

function SaveSource() {
    var text = document.getElementById('save').innerHTML;
    localStorage.setItem('program', document.getElementById('source-code').value);
    setTimeout(function () {
        document.getElementById('save').innerHTML=text;
    }, 5000);
    document.getElementById('save').innerHTML="&#9745;"
}
function LoadSource() {
    var temp = document.getElementById('source-code').value;
    if (temp === "" || confirm("Sure over-write current program?") == true) {
        document.getElementById('source-code').value=localStorage.getItem("program");
        textKeyUp(true);
        temp = document.getElementById('load').innerHTML;
        setTimeout(function () {
            document.getElementById('load').innerHTML=temp;
        }, 5000);
        document.getElementById('load').innerHTML="&#9745;"
    }
    document.getElementById("source-code").focus();
}

/* debug use only
function stringifyReplacer(key, value) {
    if (typeof value === 'bigint') {
        return value.toString(16) + 'n';
    } else if (typeof value === 'number'){
        return value.toString(16);
    } else {
        return value;
    }
}
*/

function detachSource(){
    new WinBox("Source code", {
        height: "100%",
        top: 50,
        mount: document.getElementById("source_window"),
        onclose: function () {
            document.getElementById("source_fieldset").style.display="block";
        }
    });
    document.getElementById("source_fieldset").style.display="none";
}

function detachStatus(){
    new WinBox("Status", {
        mount: document.getElementById("status_window"),
        height: "25%",
        width: "50%",
        x: "50%",
        y: "75%",
        top: 50,
        onclose: function () {
            document.getElementById("status_fieldset").style.display="block";
        }
    });
    document.getElementById("status_fieldset").style.display="none";
}

function detachActions(){
    new WinBox("Actions", {
        mount: document.getElementById("actions_window"),
        height: "20%",
        width: "50%",
        x: "50%",
        y: "55%",
        top: 50,
        onclose: function () {
            document.getElementById("actions_fieldset").style.display="block";
        }
    });
    document.getElementById("actions_fieldset").style.display="none";
}

function detachDeployment(){
    var ret = new WinBox("Smart Contract Deployment", {
        mount: document.getElementById("deployment_window"),
        top: 50,
        height: "95%",
        onclose: function () {
            document.getElementById("deployment_fieldset").style.display="block";
        }
    });
    document.getElementById("deployment_fieldset").style.display="none";
    return ret;
}

function detachAssembly(){
    new WinBox("Assembly output", {
        mount: document.getElementById("assembly_window"),
        height: "50%",
        width: "50%",
        x: "50%",
        y: "50",
        top: 50,
        onclose: function () {
            document.getElementById("assembly_fieldset").style.display="block";
        }
    });
    document.getElementById("assembly_fieldset").style.display="none";
}

function detachHelp(){
    var helpage = new WinBox("Help page", {
        url: "./htmlDocs/index.html",
        height: "70%",
        width: "70%",
        x: "center",
        y: "center",
        top: 50,
   });
   helpage.focus();
}


function fill_form(AT_Info) {

    var my_dom;
    my_dom = document.getElementsByName("name");
    my_dom[0].value=AT_Info.PName;
    my_dom = document.getElementsByName("description");
    my_dom[0].value=AT_Info.PDescription;
    my_dom = document.getElementsByName("code");
    my_dom[0].value=AT_Info.ByteCode;
    my_dom = document.getElementsByName("data");
    my_dom[0].value=AT_Info.ByteData;
    my_dom = document.getElementsByName("dpages");
    my_dom[0].value=AT_Info.DataPages;
    my_dom = document.getElementsByName("cspages");
    my_dom[0].value=AT_Info.CodeStackPages;
    my_dom = document.getElementsByName("uspages");
    my_dom[0].value=AT_Info.UserStackPages;
    my_dom = document.getElementsByName("minActivationAmountNQT");
    my_dom[0].value=AT_Info.PActivationAmount;
    my_dom = document.getElementsByName("feeNQT");
    my_dom[0].value=AT_Info.MinimumFeeNQT;
}

function clear_form(){
    var my_dom;
    my_dom = document.getElementsByName("name");
    my_dom[0].value="";
    my_dom = document.getElementsByName("description");
    my_dom[0].value="";
    my_dom = document.getElementsByName("code");
    my_dom[0].value="";
    my_dom = document.getElementsByName("data");
    my_dom[0].value="";
    my_dom = document.getElementsByName("dpages");
    my_dom[0].value="0";
    my_dom = document.getElementsByName("cspages");
    my_dom[0].value="0";
    my_dom = document.getElementsByName("uspages");
    my_dom[0].value="0";
    my_dom = document.getElementsByName("minActivationAmountNQT");
    my_dom[0].value="";
    my_dom = document.getElementsByName("feeNQT");
    my_dom[0].value="";
}

function testCode() {
    document.getElementById("assembly_output").innerHTML = "";
    clear_form();
    document.getElementById("status_output").innerHTML = runTestCases();
}

function toggleLang(ev) {
    if ((ev.checked !== undefined && ev.checked) || (ev.target !== undefined && ev.target.checked)) {
        document.getElementById("bt1").innerText = "C";
    } else {
        document.getElementById("bt1").innerText = "Assembly";
    }
    document.getElementById("assembly_output").innerHTML = "";
    textKeyUp(true);
}

function deployClick(deploy_port) {
    var form_dom = document.getElementById("deploy_form");
    form_dom.action = "http://localhost:"+deploy_port.value+"/burst";
}
