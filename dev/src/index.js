import { SmartC } from './SmartC/smartc.js'
import { asmHighlight } from './asmHighlight.js'
import { runTestCases } from './testcases.js'

/* Following global functions are define on the files:
WinBox          -> 3rd-party/winbox.bundle.js
hljs            -> 3rd-party/highlight.min.js
*/

/* global hljs WinBox */

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

    const startUpTest = new SmartC({
        language: 'C',
        sourceCode: '#pragma version dev\n#pragma maxAuxVars 1\nlong a, b, c; a=b/~c;'
    })

    try {
        startUpTest.compile()
        if (startUpTest.getMachineCode().MachineCodeHashId === '7488355358104845254') {
            document.getElementById('status_output').innerHTML = '<span class="msg_success">Start up test done!</span>'
        } else {
            document.getElementById('status_output').innerHTML = '<span class="msg_failure">Start up test failed...</span>'
        }
    } catch (e) {
        document.getElementById('status_output').innerHTML = '<span class="msg_failure">Start up test crashed...</span>'
    }

    document.title = document.title.replace('%version%', startUpTest.getCompilerVersion())
    const h1TitleDom = document.getElementById('h1_title')
    h1TitleDom.innerHTML = h1TitleDom.innerHTML.replace('%version%', startUpTest.getCompilerVersion())

    hljs.addPlugin({
        'after:highlight': (result) => {
            let retString = '<div class="table">'
            const htmlLines = result.value.split('\n')
            let spanStack = []
            retString += htmlLines.map((content, index) => {
                let startSpanIndex, endSpanIndex
                let needle = 0
                content = spanStack.join('') + content
                spanStack = []
                do {
                    const remainingContent = content.slice(needle)
                    startSpanIndex = remainingContent.indexOf('<span')
                    endSpanIndex = remainingContent.indexOf('</span')
                    if (startSpanIndex === -1 && endSpanIndex === -1) {
                        break
                    }
                    if (endSpanIndex === -1 || (startSpanIndex !== -1 && startSpanIndex < endSpanIndex)) {
                        const nextSpan = /<span .+?>/.exec(remainingContent)
                        if (nextSpan === null) {
                            // never: but ensure no exception is raised if it happens.
                            break
                        }
                        spanStack.push(nextSpan[0])
                        needle += startSpanIndex + nextSpan[0].length
                    } else {
                        spanStack.pop()
                        needle += endSpanIndex + 1
                    }
                } while (true)
                if (spanStack.length > 0) {
                    content += Array(spanStack.length).fill('</span>').join('')
                }
                return `<div id="source_line${index + 1}" class="div_row"><div class="div_cell_a">${index + 1}</div><div class="div_cell_b">${content}</div></div>`
            }).join('')
            retString += '</div>'
            result.value = retString
        }
    })
}

const PageGlobal = {
    resizerInterval: undefined,
    colorMode: 'source',
    colorToggleTimeout: 0
}

function compileCode () {
    const codeString = document.getElementById('source-code').value
    const t0 = new Date()

    try {
        let compiler
        if (document.getElementById('source_is_c').checked) {
            compiler = new SmartC({ language: 'C', sourceCode: codeString })
        } else {
            compiler = new SmartC({ language: 'Assembly', sourceCode: codeString })
        }
        compiler.compile()
        const asmCode = compiler.getAssemblyCode()
        const bcode = compiler.getMachineCode()

        document.getElementById('assembly_output').innerHTML = asmHighlight(asmCode)

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
        const lineError = /^At line: (\d+)/.exec(e.message)
        if (lineError !== null) {
            document.getElementById('source_line' + lineError[1]).className += ' asmError'
        }
    }
}

function textKeyUp (force) {
    const elem = document.getElementById('source-code')

    SetSourceCode(force)

    // grows text area
    let gole = 1
    clearInterval(PageGlobal.resizerInterval)
    PageGlobal.resizerInterval = setInterval(() => {
        const targetHeight = elem.scrollHeight
        if (targetHeight < Number(elem.style.height.replace('px', ''))) {
            if (gole >= 128) {
                let val = gole >> 7
                if (val > targetHeight) val = targetHeight
                elem.style.height = (targetHeight - val) + 'px'
            }
            gole <<= 1
        } else {
            elem.style.height = (targetHeight + 2) + 'px'
            document.getElementById('color_code').style.height = targetHeight + 'px'
            clearInterval(PageGlobal.resizerInterval)
        }
    }, 100)

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
            dest.innerHTML = hljs.highlight(source.value, { language: 'c' }).value
        } else {
            dest.innerHTML = asmHighlight(source.value)
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
    let testTestcases = false
    if (document.getElementById('debug').checked) {
        testTestcases = true
    }
    document.getElementById('status_output').innerHTML = runTestCases(testTestcases)
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
