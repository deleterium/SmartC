/* Following global functions are define on the files:
preprocess      -> out/preprocessor.js
tokenize        -> out/tokenizer.js
parse           -> out/parser.js
shape           -> out/shaper.js
syntaxProcess   -> out/syntaxProcessor.js
generate        -> out/generator.js
bytecode        -> out/bytecoder.js
runTestCases    -> out/testcases.js
asmHighlight    -> out/asmHighlight.js
WinBox          -> 3rd-party/winbox.bundle.js
hljs            -> 3rd-party/highlight.min.js
*/

/* global preprocess tokenize parse shape syntaxProcess generate asmHighlight bytecode runTestCases hljs WinBox */

window.onload = () => {
    const scode = document.getElementById('source-code')
    scode.addEventListener('keyup', textKeyUp)
    scode.addEventListener('keydown', textKeyUp)
    scode.addEventListener('click', textKeyUp)
    scode.addEventListener('mousedown', SetSourceCode)
    scode.addEventListener('mouseup', textKeyUp)
    scode.addEventListener('paste', textKeyUp)

    document.getElementById('compile').addEventListener('click', compileCode)
    document.getElementById('test').addEventListener('click', testCode)
    document.getElementById('btn_help').addEventListener('click', detachHelp)
    document.getElementById('source_is_c').addEventListener('click', toggleLang)
    document.getElementById('save').addEventListener('click', SaveSource)
    document.getElementById('load').addEventListener('click', LoadSource)

    document.getElementById('copy_assembly').addEventListener('click', () => navigator.clipboard.writeText(document.getElementById('assembly_output').innerText))

    document.getElementById('source_legend').addEventListener('click', detachSource)
    document.getElementById('actions_legend').addEventListener('click', detachActions)
    document.getElementById('status_legend').addEventListener('click', detachStatus)
    document.getElementById('assembly_legend').addEventListener('click', detachAssembly)
    document.getElementById('deployment_legend').addEventListener('click', detachDeployment)

    const radios = document.querySelectorAll('input[name="deploy"]')
    radios.forEach(Dom => {
        Dom.addEventListener('click', deployClick)
    })

    textKeyUp()
    toggleLang(document.getElementById('source_is_c'))

    detachDeployment().minimize(true)
}

const PageGlobal = {
    colorMode: 'source',
    colorToggleTimeout: 0
}

function compileCode () {
    const codeString = document.getElementById('source-code').value
    const t0 = new Date()

    try {
        let asmCode
        if (document.getElementById('source_is_c').checked) {
            const preprocessOut = preprocess(codeString)
            const tokenizeOut = tokenize(preprocessOut)
            const parseOut = parse(tokenizeOut)
            const shapeOut = shape(parseOut)
            const syntaxOut = syntaxProcess(shapeOut)
            asmCode = generate(syntaxOut)
        } else {
            asmCode = codeString
        }

        document.getElementById('assembly_output').innerHTML = asmHighlight(asmCode)
        const bcode = bytecode(asmCode)

        const t1 = new Date()
        let compileMessage = `<span class='msg_success'>Compile sucessfull!!!</span> <small>Done at ${t1.getHours()}:${t1.getMinutes()}:${t1.getSeconds()} in ${t1 - t0} ms.`
        compileMessage += `<br>Machine code hash ID: ${bcode.MachineCodeHashId}`
        if (document.getElementById('debug').checked) {
            compileMessage += '\n\n' + JSON.stringify(bcode, null, '    ')
        }
        document.getElementById('status_output').innerHTML = compileMessage + '</small>'

        fillForm(bcode)
    } catch (e) {
        document.getElementById('assembly_output').innerHTML = ''
        clearForm()
        let compileMessage = `<span class='msg_failure'>Compile failed</span>\n\n${e.message}`
        if (document.getElementById('debug').checked) {
            compileMessage += '\n\n' + e.stack
        }
        document.getElementById('status_output').innerHTML = compileMessage
    }
}

function textKeyUp (force) {
    const elem = document.getElementById('source-code')
    const text = elem.value
    let i

    SetSourceCode(force)

    // grows text area
    const oldrow = elem.rows
    const newrow = (text.match(/\n/g) || '').length + 5

    // eye-candy (resize in 8 steps using polinomial interpolation)
    i = 1
    const end = 9
    let id
    function frame () {
        if (i > 9) {
            clearInterval(id)
        } else {
            i++
            elem.rows = Math.round(i * i * (oldrow - newrow) / (end * end) + i * (newrow - oldrow) * (2 / end) + oldrow)
            document.getElementById('color_code').style.height = elem.offsetHeight + 'px'
        }
    }
    if (newrow - oldrow > 3 || newrow - oldrow < -3) id = setInterval(frame, 100)
    else elem.rows = newrow
    // eye-candy end

    document.getElementById('color_code').style.height = elem.offsetHeight + 'px'

    // update tooltip info (line:column)
    const cpos = elem.value.substr(0, elem.selectionStart).split('\n')
    document.getElementById('tooltip_span').innerHTML = 'Cursor: ' + cpos.length + ':' + cpos[cpos.length - 1].length
}

function SetColorCode () {
    const source = document.getElementById('source-code')

    if (source.selectionStart !== source.selectionEnd) {
        // Do not highlight if some text is selected. This prevents
        //  text selection to fade away.
        return
    }

    if (PageGlobal.colorMode !== 'color') {
        PageGlobal.colorMode = 'color'
        clearTimeout(PageGlobal.colorToggleTimeout)
        const dest = document.getElementById('color_code')

        if (document.getElementById('source_is_c').checked) {
            dest.innerHTML = hljs.highlight(source.value, { language: 'c' }).value + '\n\n\n\n\n'
        } else {
            dest.innerHTML = asmHighlight(source.value) + '\n\n\n\n\n'
        }
        source.className = 'transp'
    }
}

function SetSourceCode (force) {
    clearTimeout(PageGlobal.colorToggleTimeout)
    PageGlobal.colorToggleTimeout = setTimeout(SetColorCode, 500)
    if (PageGlobal.colorMode !== 'source' || force === true) {
        PageGlobal.colorMode = 'source'
        document.getElementById('source-code').className = 'opaque'
    }
}

function SaveSource () {
    const text = document.getElementById('save').innerHTML
    localStorage.setItem('program', document.getElementById('source-code').value)
    setTimeout(() => {
        document.getElementById('save').innerHTML = text
    }, 5000)
    document.getElementById('save').innerHTML = '&#9745;'
}

function LoadSource () {
    let temp = document.getElementById('source-code').value
    if (temp === '' || confirm('Sure over-write current program?') === true) {
        document.getElementById('source-code').value = localStorage.getItem('program')
        textKeyUp(true)
        temp = document.getElementById('load').innerHTML
        setTimeout(() => {
            document.getElementById('load').innerHTML = temp
        }, 5000)
        document.getElementById('load').innerHTML = '&#9745;'
    }
    document.getElementById('source-code').focus()
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

function detachSource () {
    const ret = WinBox.new({
        title: 'Source code',
        height: '100%',
        top: 50,
        mount: document.getElementById('source_window'),
        onclose: function () {
            document.getElementById('source_fieldset').style.display = 'block'
        }
    })
    document.getElementById('source_fieldset').style.display = 'none'
    return ret
}

function detachStatus () {
    WinBox.new({
        title: 'Status',
        mount: document.getElementById('status_window'),
        height: '25%',
        width: '50%',
        x: '50%',
        y: '75%',
        top: 50,
        onclose: function () {
            document.getElementById('status_fieldset').style.display = 'block'
        }
    })
    document.getElementById('status_fieldset').style.display = 'none'
}

function detachActions () {
    WinBox.new({
        title: 'Actions',
        mount: document.getElementById('actions_window'),
        height: '20%',
        width: '50%',
        x: '50%',
        y: '55%',
        top: 50,
        onclose: function () {
            document.getElementById('actions_fieldset').style.display = 'block'
        }
    })
    document.getElementById('actions_fieldset').style.display = 'none'
}

function detachDeployment () {
    const ret = WinBox.new({
        title: 'Smart Contract Deployment',
        mount: document.getElementById('deployment_window'),
        top: 50,
        height: '95%',
        onclose: function () {
            document.getElementById('deployment_fieldset').style.display = 'block'
        }
    })
    document.getElementById('deployment_fieldset').style.display = 'none'
    return ret
}

function detachAssembly () {
    WinBox.new({
        title: 'Assembly output',
        mount: document.getElementById('assembly_window'),
        height: '50%',
        width: '50%',
        x: '50%',
        y: '50',
        top: 50,
        onclose: function () {
            document.getElementById('assembly_fieldset').style.display = 'block'
        }
    })
    document.getElementById('assembly_fieldset').style.display = 'none'
}

function detachHelp () {
    const helpage = WinBox.new({
        title: 'Help page',
        url: './htmlDocs/index.html',
        height: '70%',
        width: '70%',
        x: 'center',
        y: 'center',
        top: 50
    })
    helpage.focus()
}

function fillForm (AtInfo) {
    let myDom
    myDom = document.getElementsByName('name')
    myDom[0].value = AtInfo.PName
    myDom = document.getElementsByName('description')
    myDom[0].value = AtInfo.PDescription
    myDom = document.getElementsByName('code')
    myDom[0].value = AtInfo.ByteCode
    myDom = document.getElementsByName('data')
    myDom[0].value = AtInfo.ByteData
    myDom = document.getElementsByName('dpages')
    myDom[0].value = AtInfo.DataPages
    myDom = document.getElementsByName('cspages')
    myDom[0].value = AtInfo.CodeStackPages
    myDom = document.getElementsByName('uspages')
    myDom[0].value = AtInfo.UserStackPages
    myDom = document.getElementsByName('minActivationAmountNQT')
    myDom[0].value = AtInfo.PActivationAmount
    myDom = document.getElementsByName('feeNQT')
    myDom[0].value = AtInfo.MinimumFeeNQT
}

function clearForm () {
    let myDom
    myDom = document.getElementsByName('name')
    myDom[0].value = ''
    myDom = document.getElementsByName('description')
    myDom[0].value = ''
    myDom = document.getElementsByName('code')
    myDom[0].value = ''
    myDom = document.getElementsByName('data')
    myDom[0].value = ''
    myDom = document.getElementsByName('dpages')
    myDom[0].value = '0'
    myDom = document.getElementsByName('cspages')
    myDom[0].value = '0'
    myDom = document.getElementsByName('uspages')
    myDom[0].value = '0'
    myDom = document.getElementsByName('minActivationAmountNQT')
    myDom[0].value = ''
    myDom = document.getElementsByName('feeNQT')
    myDom[0].value = ''
}

function testCode () {
    document.getElementById('assembly_output').innerHTML = ''
    clearForm()
    document.getElementById('status_output').innerHTML = runTestCases()
}

function toggleLang (ev) {
    if ((ev.checked !== undefined && ev.checked) || (ev.target !== undefined && ev.target.checked)) {
        document.getElementById('bt1').innerText = 'C'
    } else {
        document.getElementById('bt1').innerText = 'Assembly'
    }
    document.getElementById('assembly_output').innerHTML = ''
    textKeyUp(true)
}

function deployClick (evt) {
    const formDom = document.getElementById('deploy_form')
    formDom.action = `http://localhost:${evt.currentTarget.value}/burst`
}
