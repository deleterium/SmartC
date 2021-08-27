// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

/**
 * Optimize assembly code globally with peephole strategy.
 * @param assemblySourceCode
 * @returns Optimized source code
 */
// eslint-disable-next-line no-unused-vars
function optimize (assemblySourceCode: string, maxConstVars: number) {
    let codeLines = assemblySourceCode.split('\n')

    let jumpToLabels: string[]
    let dest: string
    let jmpto: RegExpExecArray|null, lbl: RegExpExecArray|null
    let setdat: RegExpExecArray|null, opdat: RegExpExecArray|null, clrdat: RegExpExecArray|null, popdat: RegExpExecArray|null
    let branchdat: RegExpExecArray|null
    let pshslpdat: RegExpExecArray|null
    let notdat: RegExpExecArray|null, setdat2: RegExpExecArray|null
    let optimizedLines: number

    do {
        jumpToLabels = []
        optimizedLines = 0

        // Collect jumps information
        codeLines.forEach(function (value) {
            jmpto = /.+\s:(\w+)$/.exec(value) // match JMP JSR ERR and all branches
            if (jmpto !== null) {
                jumpToLabels.push(jmpto[1])
            }
        })

        // remove labels without reference
        // remove lines marked as DELETE
        codeLines = codeLines.filter(function (value) {
            lbl = /^(\w+):$/.exec(value)
            if (lbl !== null) {
                if (jumpToLabels.indexOf(lbl[1]) !== -1) {
                    return true
                } else {
                    optimizedLines++
                    return false
                }
            }
            if (value === 'DELETE') {
                optimizedLines++
                return false
            }
            return true
        })

        // Optimization rules here!
        codeLines.forEach((value, index, array) => {
            let i

            // do not analyze these values or compiler directives
            if (value === 'DELETE' || value === '' || /^\s*\^\w+(.*)/.exec(array[index]) !== null) {
                return
            }

            // change SET_VAL to SET_DAT for values defined in ConstVars
            // This also enables more optimizations on pointers and PSH!
            if (maxConstVars > 0) {
                setdat = /^\s*SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/.exec(value)
                if (setdat !== null) {
                    const val = parseInt(setdat[2], 16)
                    if (val <= maxConstVars && setdat[1] !== 'n' + val) {
                        array[index] = 'SET @' + setdat[1] + ' $n' + val
                        optimizedLines++
                    }
                }
            }

            // BNE $r0 $var37 :lab_f75
            // JMP :lab_fa2
            // lab_f75:
            //  turns BEQ $r0 $var37 :lab_fa2
            branchdat = /^\s*(BGT|BLT|BGE|BLE|BEQ|BNE)\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/.exec(value)
            if (branchdat !== null) {
                lbl = /^\s*(\w+):\s*$/.exec(array[index + 2])
                if (lbl !== null && branchdat[4] === lbl[1]) {
                    jmpto = /^\s*JMP\s+:(\w+)\s*$/.exec(array[index + 1])
                    if (jmpto !== null) {
                        // if jump location is RET or FIN, optimize to RET or FIN.
                        dest = getLabeldestination(jmpto[1])
                        if (/^\s*RET\s*$/.exec(dest) !== null) {
                            array[index + 1] = 'RET' // if jump to return, just return from here
                            optimizedLines++
                            return
                        }
                        if (/^\s*FIN\s*$/.exec(dest) !== null) {
                            array[index + 1] = 'FIN' // if jump to exit, just exit from here
                            optimizedLines++
                            return
                        }

                        let instr = ''
                        if (branchdat[1] === 'BGT') instr = 'BLE'
                        else if (branchdat[1] === 'BLT') instr = 'BGE'
                        else if (branchdat[1] === 'BGE') instr = 'BLT'
                        else if (branchdat[1] === 'BLE') instr = 'BGT'
                        else if (branchdat[1] === 'BEQ') instr = 'BNE'
                        else instr = 'BEQ'
                        array[index] = instr + ' $' + branchdat[2] + ' $' + branchdat[3] + ' :' + jmpto[1]
                        array[index + 1] = 'DELETE'
                        optimizedLines++
                        return
                    }
                }
            }

            // BNZ $r0 :lab_f75
            // JMP :lab_fa2
            // lab_f75:
            //  turns BZR $r0 :lab_fa2
            branchdat = /^\s*(BZR|BNZ)\s+\$(\w+)\s+:(\w+)\s*$/.exec(value)
            if (branchdat !== null) {
                lbl = /^\s*(\w+):\s*$/.exec(array[index + 2]) // matches labels
                if (lbl !== null && branchdat[3] === lbl[1]) {
                    jmpto = /^\s*JMP\s+:(\w+)\s*$/.exec(array[index + 1])
                    if (jmpto !== null) {
                        // if jump location is RET or FIN, optimize to RET or FIN.
                        dest = getLabeldestination(jmpto[1])
                        if (/^\s*RET\s*$/.exec(dest) !== null) {
                            array[index + 1] = 'RET' // if jump to return, just return from here
                            optimizedLines++
                            return
                        }
                        if (/^\s*FIN\s*$/.exec(dest) !== null) {
                            array[index + 1] = 'FIN' // if jump to exit, just exit from here
                            optimizedLines++
                            return
                        }

                        let instr = ''
                        if (branchdat[1] === 'BZR') instr = 'BNZ'
                        else instr = 'BZR'
                        array[index] = instr + ' $' + branchdat[2] + ' :' + jmpto[1]
                        array[index + 1] = 'DELETE'
                        optimizedLines++
                        return
                    }
                }
            }

            jmpto = /^\s*JMP\s+:(\w+)\s*$/.exec(value)
            // optimize jumps
            if (jmpto !== null) {
                // if instruction is jump, unreachable code until a label found
                i = index
                while (++i < array.length - 1) {
                    lbl = /^\s*(\w+):\s*$/.exec(array[i])
                    if (lbl === null) {
                        if (array[i] === '' || array[i] === 'DELETE' || /^\s*\^\w+(.*)/.exec(array[i]) !== null) { // matches assembly compiler directives
                            continue
                        }
                        array[i] = 'DELETE'
                        optimizedLines++
                        continue
                    }
                    break
                }
                // if referenced label is next instruction, meaningless jump
                i = index
                while (++i < array.length - 1) {
                    lbl = /^\s*(\w+):\s*$/.exec(array[i])
                    if (lbl === null) {
                        if (array[i] === '' || array[i] === 'DELETE') {
                            continue
                        }
                        break
                    }
                    if (jmpto[1] === lbl[1]) {
                        array[index] = 'DELETE'
                        optimizedLines++
                        return
                    }
                }
                // inspect jump location
                dest = getLabeldestination(jmpto[1])
                if (/^\s*RET\s*$/.exec(dest) !== null) {
                    array[index] = 'RET' // if jump to return, just return from here
                    optimizedLines++
                    return
                }
                if (/^\s*FIN\s*$/.exec(dest) !== null) {
                    array[index] = 'FIN' // if jump to exit, just exit from here
                    optimizedLines++
                    return
                }
                lbl = /^\s*(\w+):\s*$/.exec(dest)
                if (lbl !== null) {
                    array[index] = 'JMP :' + lbl[1] // if jump to other jump, just jump over there
                    optimizedLines++
                    return
                }
            }

            jmpto = /^\s*(RET|FIN)\s*$/.exec(value)
            // Inspect RET and FIN
            if (jmpto !== null) {
                // if instruction RET or FIN, unreachable code until a label found
                i = index
                while (++i < array.length - 1) {
                    lbl = /^\s*(\w+):\s*$/.exec(array[i])
                    if (lbl === null) {
                        if (array[i] === '' || array[i] === 'DELETE' || /^\s*\^\w+(.*)/.exec(array[i]) !== null) {
                            continue
                        }
                        array[i] = 'DELETE'
                        optimizedLines++
                        continue
                    }
                    break
                }
            }

            // inspect branches and optimize branch to jumps
            jmpto = /^\s*B.+:(\w+)$/.exec(value) // matches all branches instructions
            if (jmpto !== null) {
                // if referenced label is next instruction, meaningless jump
                i = index
                while (++i < array.length - 1) {
                    lbl = /^\s*(\w+):\s*$/.exec(array[i])
                    if (lbl === null) {
                        if (array[i] === '' || array[i] === 'DELETE') {
                            continue
                        }
                        break
                    }
                    if (jmpto[1] === lbl[1]) {
                        array[index] = 'DELETE'
                        optimizedLines++
                        return
                    }
                }
                // inspect jump location
                dest = getLabeldestination(jmpto[1])
                lbl = /^\s*(\w+):\s*$/.exec(dest)
                if (lbl !== null) {
                    array[index] = jmpto[0].replace(jmpto[1], lbl[1]) // if branch to other jump, just branch over there
                    optimizedLines++
                    return
                }
            }

            // ADD @r0 $b
            // SET @b $r0
            // turns ADD @b $r0
            opdat = /^\s*(\w+)\s+@(\w+)\s+\$(\w+)\s*$/.exec(value)
            if (opdat !== null) {
                setdat = /^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index + 1])
                if (setdat !== null && opdat[2] === setdat[2] && opdat[3] === setdat[1]) {
                    if (opdat[1] === 'ADD' || opdat[1] === 'MUL' || opdat[1] === 'AND' || opdat[1] === 'XOR' || opdat[1] === 'BOR') {
                        array[index] = opdat[1] + ' @' + opdat[3] + ' $' + opdat[2]
                        array[index + 1] = 'DELETE'
                        optimizedLines++
                        return
                    }
                }
            }

            // SET @r0 $a
            // ADD @b $r0
            // turns ADD @b $a
            setdat = /^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(value)
            if (setdat !== null) {
                opdat = /^\s*(\w+)\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index + 1])
                if (opdat !== null && setdat[1] === opdat[3]) {
                    if (opdat[1] === 'ADD' || opdat[1] === 'SUB' || opdat[1] === 'MUL' || opdat[1] === 'DIV' ||
                        opdat[1] === 'AND' || opdat[1] === 'XOR' || opdat[1] === 'BOR' ||
                        opdat[1] === 'MOD' || opdat[1] === 'SHL' || opdat[1] === 'SHR') {
                        array[index] = opdat[1] + ' @' + opdat[2] + ' $' + setdat[2]
                        array[index + 1] = 'DELETE'
                        optimizedLines++
                        return
                    }
                }
                if (setdat[1] === setdat[2]) { // SET @a_1 $a_1 turns delete
                    array[index] = 'DELETE'
                    optimizedLines++
                    return
                }

                // SET @r0 $a
                // PSH $r0 / SLP $r0
                // turns PSH $a / SLP $a
                pshslpdat = /^\s*(PSH|SLP)\s+\$(\w+)\s*$/.exec(array[index + 1])
                if (pshslpdat !== null && isRegister(setdat[1])) {
                    if (pshslpdat[2] === setdat[1]) {
                        array[index] = 'DELETE'
                        array[index + 1] = pshslpdat[1] + ' $' + setdat[2]
                        optimizedLines++
                        return
                    }
                }

                i = index
                while (++i < array.length - 1) {
                    lbl = /^\s*(\w+):\s*$/.exec(array[i])
                    if (lbl !== null) {
                        break
                    }
                    jmpto = /.+\s:(\w+)$/.exec(array[i]) // match JMP JSR ERR and all branches
                    if (jmpto !== null) {
                        break
                    }
                    jmpto = /^\s*(RET|FIN)\s*$/.exec(array[i])
                    if (jmpto !== null) {
                        break
                    }
                    if (array[i].indexOf(setdat[1]) >= 0) {
                        // SET @r0 $a
                        // SET @z $($val + $r0)
                        // turns SET @z $($val + $a)
                        setdat2 = /^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\s*\+\s*\$(\w+)\)\s*$/.exec(array[i])
                        if (setdat2 !== null && setdat[1] === setdat2[3]) {
                            array[index] = 'DELETE'
                            array[i] = 'SET @' + setdat2[1] + ' $($' + setdat2[2] + ' + $' + setdat[2] + ')'
                            optimizedLines++
                            continue
                        }
                        // SET @r0 $a
                        // SET @($val + $r0) $z
                        // turns SET $($val + $a) $z
                        setdat2 = /^\s*SET\s+@\(\$(\w+)\s*\+\s*\$(\w+)\)\s+\$(\w+)\s*$/.exec(array[i])
                        if (setdat2 !== null && setdat[1] === setdat2[2]) {
                            array[index] = 'DELETE'
                            array[i] = 'SET @($' + setdat2[1] + ' + $' + setdat[2] + ') $' + setdat2[3]
                            optimizedLines++
                            continue
                        }
                        // SET @r0 $a
                        // SET @($val + $z) $r0
                        // turns SET $($val + $z) $a
                        if (setdat2 !== null && setdat[1] === setdat2[3]) {
                            array[index] = 'DELETE'
                            array[i] = 'SET @($' + setdat2[1] + ' + $' + setdat2[2] + ') $' + setdat[2]
                            optimizedLines++
                            continue
                        }
                        break
                    }
                }

                // SET @r0 $n2
                // BLT $i $r0 :__if151_c_endif
                // turns BLT $i $n2 :__if151_c_endif (very specific optimization)
                branchdat = /^\s*(BGT|BLT|BGE|BLE|BEQ|BNE)\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/.exec(array[index + 1])
                if (branchdat !== null && branchdat[3] === setdat[1] && isRegister(setdat[1]) && /^n\d$/.exec(setdat[2]) !== null) {
                    array[index] = branchdat[1] + ' $' + branchdat[2] + ' $' + setdat[2] + ' :' + branchdat[4]
                    array[index + 1] = 'DELETE'
                    optimizedLines++
                    return
                }

                // SET @r0 $a
                // NOT @r0 (only registers)
                // SET @a $r0
                // turns NOT @a (safe!)
                notdat = /^\s*NOT\s+@(r\d+)\s*$/.exec(array[index + 1])
                if (notdat !== null && notdat[1] === setdat[1]) {
                    setdat2 = /^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index + 2])
                    if (setdat2 !== null && setdat[1] === setdat2[2] && setdat[2] === setdat2[1]) {
                        array[index] = 'NOT @' + setdat[2]
                        array[index + 1] = 'DELETE'
                        array[index + 2] = 'DELETE'
                        optimizedLines++
                        return
                    }
                }
            }

            // POP @r0
            // SET @z $r0
            // turns POP @z
            popdat = /^\s*POP\s+@(\w+)\s*$/.exec(value)
            if (popdat !== null && isRegister(popdat[1])) {
                setdat = /^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index + 1])
                if (setdat !== null && setdat[2] === popdat[1]) {
                    array[index] = 'POP @' + setdat[1]
                    array[index + 1] = 'DELETE'
                    optimizedLines++
                    return
                }

                // POP @r0
                // PSH $r0
                // turns nothing (safe for registers)
                pshslpdat = /^\s*(PSH|SLP)\s+\$(r\d+)\s*$/.exec(array[index + 1])
                if (pshslpdat !== null) {
                    if (pshslpdat[2] === popdat[1]) {
                        array[index] = 'DELETE'
                        array[index + 1] = 'DELETE'
                        optimizedLines++
                        return
                    }
                }
            }

            // Optimize pointer operations with zero index
            clrdat = /^\s*CLR\s+@(\w+)\s*$/.exec(value)
            if (clrdat !== null) {
                i = index
                while (++i < array.length - 1) {
                    lbl = /^\s*(\w+):\s*$/.exec(array[i])
                    if (lbl !== null) {
                        break
                    }
                    jmpto = /.+\s:(\w+)$/.exec(array[i]) // match JMP JSR ERR and all branches
                    if (jmpto !== null) {
                        break
                    }
                    jmpto = /^\s*(RET|FIN)\s*$/.exec(array[i])
                    if (jmpto !== null) {
                        break
                    }
                    if (array[i].indexOf(clrdat[1]) >= 0) {
                        setdat = /^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\s*\+\s*\$(\w+)\)\s*$/.exec(array[i])
                        if (setdat !== null && clrdat[1] === setdat[3]) {
                            array[index] = 'DELETE'
                            array[i] = 'SET @' + setdat[1] + ' $($' + setdat[2] + ')'
                            optimizedLines++
                            continue
                        }
                        setdat = /^\s*SET\s+@\(\$(\w+)\s*\+\s*\$(\w+)\)\s+\$(\w+)\s*$/.exec(array[i])
                        if (setdat !== null && clrdat[1] === setdat[2]) {
                            array[index] = 'DELETE'
                            array[i] = 'SET @($' + setdat[1] + ') $' + setdat[3]
                            optimizedLines++
                            continue
                        }
                        break
                    }
                }
            }
        })
    } while (optimizedLines !== 0)

    function getLabeldestination (label: string) {
        let lbl, jmpdest
        let idx = codeLines.findIndex(obj => obj.indexOf(label + ':') !== -1)
        if (idx === -1) {
            return ''
        }
        while (++idx < codeLines.length - 1) {
            lbl = /^\s*(\w+):\s*$/.exec(codeLines[idx])
            if (lbl !== null) {
                continue
            }
            if (codeLines[idx] === '' || codeLines[idx] === 'DELETE') {
                continue
            }
            jmpdest = /^\s*JMP\s+:(\w+)\s*$/.exec(codeLines[idx])
            if (jmpdest !== null) {
                return jmpdest[1] + ':'
            }
            return codeLines[idx]
        }
        return ''
    }

    function isRegister (name: string) {
        if (/^r\d$/.exec(name) !== null) {
            // matches r0 .. r9 Note that some regex in code have this hardcoded.
            return true
        }
        return false
    }

    return codeLines.join('\n')
}
