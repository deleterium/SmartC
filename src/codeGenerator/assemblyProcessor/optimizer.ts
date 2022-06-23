import { CONTRACT } from './optimizerVM/index'

/**
 * Optimize assembly code with peephole strategy.
 * @param O Optimization level:
 * - 0: No optimization
 * - 1: Very basic optimization, just remove silly/unused code
 * - 2: Safely changes and delete code for smarter outcome
 * - 3: Use final optimizations tracing variable contents (beta)
 * - 4: Dangerous deep optimizations. Must be checked by developer
 * @param assemblyCode Input assembly
 * @param labels Array with labels (they will not be removed)
 * @returns Assembly code processed
 */
export default function optimizer (O: number, assemblyCode: string, labels: string[]) : string {
    let jumpLabels: string []
    let labelID = 1
    let optimizedLines: number
    let codeLines = assemblyCode.split('\n')

    function optimizerMain () : string {
        do {
            optimizedLines = 0
            jumpLabels = getJumpLabels().concat(labels)
            if (O >= 1) {
                codeLines = codeLines.filter(filterNotUsedLabelsAndDelete)
                codeLines.forEach(deleteUnreachableCode)
                codeLines.forEach(setSame)
                codeLines.forEach(jumpToNext)
            }
            if (O >= 2) {
                codeLines.forEach(jumpJumpOpt)
                codeLines.forEach(swapBranches)
                codeLines.forEach(notOpt)
                codeLines.forEach(popPushRegister)
                codeLines.forEach(mdvOpt)
                codeLines = codeLines.flatMap(branchOpt)
            }
            if (O >= 4) {
                codeLines.forEach(operatorSetSwap)
                codeLines.forEach(pushOpt)
                codeLines.forEach(setOperatorSwap)
                codeLines.forEach(setidxOpt)
                codeLines.forEach(popOpt)
                codeLines.forEach(pointerZeroOpt)
            }
        } while (optimizedLines !== 0)
        const partialOptimized = codeLines.join('\n')
        if (O >= 3) {
            const OptVM = new CONTRACT(codeLines)
            try {
                return OptVM.optimize().join('\n')
            } catch (error) {
                return partialOptimized
            }
        }
        return partialOptimized
    }

    // Collect jumps information
    function getJumpLabels () : string [] {
        const retLabels: string[] = []
        codeLines.forEach(line => {
            const jmpto = /^.+\s:(\w+)$/.exec(line) // match JMP JSR ERR and all branches
            if (jmpto !== null) {
                retLabels.push(jmpto[1])
            }
        })
        return retLabels
    }

    /** Filter out labels without reference and lines marked as DELETE
     * ```
     * neverused: -> DELETE
     * DELETE     -> DELETE
     * ``` */
    function filterNotUsedLabelsAndDelete (line: string) : boolean {
        const lbl = /^(\w+):$/.exec(line)
        if (lbl !== null) {
            if (jumpLabels.indexOf(lbl[1]) !== -1) {
                return true
            }
            optimizedLines++
            return false
        }
        if (line === 'DELETE') {
            optimizedLines++
            return false
        }
        return true
    }

    /** Remove jumping to next instruction (also matches branches)
     * ```
     * JMP :nextInstruction -> DELETE
     * nextInstruction:     -> unchanged
     * ``` */
    function jumpToNext (line: string, index: number, array: string[]) : void {
        const jmpto = /^.+\s:(\w+)$/.exec(line)
        if (jmpto === null) {
            return
        }
        let i = index
        while (++i < array.length - 1) {
            const nextLabel = /^\s*(\w+):\s*$/.exec(array[i])
            if (nextLabel === null) {
                if (isUntouchable(array[i])) {
                    continue
                }
                break
            }
            if (jmpto[1] === nextLabel[1]) {
                array[index] = 'DELETE'
                optimizedLines++
                return
            }
        }
    }

    /** Inspect jump location and optimize with a direct jump to final location,
     * returning or exiting program.
     */
    function jumpJumpOpt (value: string, index: number, array: string[]) : void {
        const jmpto = /^\s*JMP\s+:(\w+)\s*$/.exec(value)
        if (jmpto === null) {
            return
        }
        const labelDest = getLabeldestination(jmpto[1])
        if (/^\s*(RET|FIN)\s*$/.exec(labelDest) !== null) {
            array[index] = labelDest
            optimizedLines++
            return
        }
        const lbl = /^\s*(\w+):\s*$/.exec(labelDest)
        if (lbl !== null) {
            array[index] = 'JMP :' + lbl[1]
            optimizedLines++
        }
    }

    /** If instruction is jump, return or exit, then remove unreachable code until
     * a label is found. Disregard directives instructions.
     */
    function deleteUnreachableCode (value: string, index: number, array: string[]) : void {
        const jmpto = /^\s*(RET|FIN|JMP)\b.*$/.exec(value)
        if (jmpto === null) {
            return
        }
        let i = index
        while (++i < array.length - 1) {
            const lbl = /^\s*(\w+):\s*$/.exec(array[i])
            if (lbl !== null) {
                break
            }
            if (isUntouchable(array[i])) {
                continue
            }
            array[i] = 'DELETE'
            optimizedLines++
        }
    }

    /** Swap branches to spare one jump instruction
     * ```
     * BNE $r0 $var37 :lab_f75 -> BEQ $r0 $var37 :lab_fa2
     * JMP :lab_fa2            -> DELETE
     * lab_f75:                -> unchanged
     * ``` */
    function swapBranches (value: string, index: number, array: string[]) : void {
        const branchdat = /^\s*(BGT|BLT|BGE|BLE|BEQ|BNE|BZR|BNZ)\s+\$(\w+)\s+(\$\w+\s+)?:(\w+)\s*$/.exec(value)
        if (branchdat === null) {
            return
        }
        const label = /^\s*(\w+):\s*$/.exec(array[index + 2])
        if (label === null || branchdat[4] !== label[1]) {
            return
        }
        const jmpto = /^\s*JMP\s+:(\w+)\s*$/.exec(array[index + 1])
        if (jmpto === null) {
            return
        }
        array[index] = value
            .replace(branchdat[1], inverseBranch(branchdat[1]))
            .replace(branchdat[4], jmpto[1])
        array[index + 1] = 'DELETE'
        optimizedLines++
    }

    /** Inspect branch location and update instruction to branch final destination (if it is branch
     * to jump).
     * If final destination is return or exit, then swap branch instruction and bring return/exit
     * up.
     */
    function branchOpt (value: string, index: number, array: string[]) : string [] {
        const branchTo = /^\s*(BGT|BLT|BGE|BLE|BEQ|BNE|BZR|BNZ)\s+\$(\w+)\s+(\$\w+\s+)?:(\w+)\s*$/.exec(value)
        if (branchTo === null) {
            return [value]
        }
        const labelDest = getLabeldestination(branchTo[4])
        if (/^\s*(RET|FIN)\s*$/.exec(labelDest) !== null) {
            if (/^\s*(RET|FIN)\s*$/.test(array[index + 1])) {
                // It was already optimized!
                return [value]
            }
            // if jump to return, swap branch and return from here
            const newLabel = `__opt_${labelID}`
            labelID++
            const newInstr = value
                .replace(branchTo[1], inverseBranch(branchTo[1]))
                .replace(branchTo[4], newLabel)
            optimizedLines++
            return [
                newInstr,
                labelDest,
                `${newLabel}:`
            ]
        }
        const lbl = /^\s*(\w+):\s*$/.exec(labelDest)
        if (lbl !== null) {
            optimizedLines++
            return [value.replace(branchTo[4], lbl[1])]
        }
        return [value]
    }

    /** Optimizes the bitwise NOT operator
     * ```
     * SET @r0 $a -> DELETE
     * NOT @r0    -> NOT @a
     * SET @a $r0 -> DELETE
     * ``` */
    function notOpt (value: string, index: number, array: string[]) : void {
        const notdat = /^\s*NOT\s+@(r\d)\s*$/.exec(value)
        if (notdat === null) {
            return
        }
        const befSet = /^\s*SET\s+@(r\d)\s+\$(\w+)\s*$/.exec(array[index - 1])
        const aftSet = /^\s*SET\s+@(\w+)\s+\$(r\d)\s*$/.exec(array[index + 1])
        if (befSet === null || aftSet === null) {
            return
        }
        if (befSet[1] === aftSet[2] && befSet[2] === aftSet[1] && notdat[1] === befSet[1]) {
            array[index - 1] = 'DELETE'
            array[index] = 'NOT @' + befSet[2]
            array[index + 1] = 'DELETE'
            optimizedLines++
        }
    }

    /** Optimizes MUL + DIV to MDV
     * ```
     * MUL @a $c -> DELETE
     * DIV @a $d -> MDV @a $c $d
     * ``` */
    function mdvOpt (value: string, index: number, array: string[]) : void {
        const muldat = /^\s*MUL\s+@(\w+)\s+\$(\w+)\s*$/.exec(value)
        if (muldat === null) {
            return
        }
        const divdat = /^\s*DIV\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index + 1])
        if (divdat === null) {
            return
        }
        if (muldat[1] === divdat[1]) {
            array[index] = `MDV @${muldat[1]} $${muldat[2]} $${divdat[2]}`
            array[index + 1] = 'DELETE'
            optimizedLines++
        }
    }

    /** Optimizes the meaningless SET
     * ```
     * SET @var $var -> DELETE
     * ``` */
    function setSame (value: string, index: number, array: string[]) : void {
        const setdat = /^\s*SET\s+@(\w+)\s+\$\1\s*$/.exec(value)
        if (setdat === null) {
            return
        }
        array[index] = 'DELETE'
        optimizedLines++
    }

    /** Optimizes register poping and pushing in sequence
     * ```
     * POP @r0 -> DELETE
     * PSH $r0 -> DELETE
     * ``` */
    function popPushRegister (value: string, index: number, array: string[]) : void {
        const popdat = /^\s*POP\s+@(r\d)\s*$/.exec(value)
        if (popdat === null) {
            return
        }
        const pshslpdat = /^\s*PSH\s+\$(r\d+)\s*$/.exec(array[index + 1])
        if (pshslpdat === null) {
            return
        }
        if (pshslpdat[1] === popdat[1]) {
            array[index] = 'DELETE'
            array[index + 1] = 'DELETE'
            optimizedLines++
        }
    }

    /** Inspect label location and return next instruction. If next instruction is a
     * jump, then return that jump label.
     */
    function getLabeldestination (label: string) : string {
        let lbl, jmpdest
        let idx = codeLines.findIndex(line => line.indexOf(label + ':') !== -1)
        if (idx === -1) {
            return ''
        }
        while (++idx < codeLines.length - 1) {
            lbl = /^\s*(\w+):\s*$/.exec(codeLines[idx])
            if (lbl !== null) {
                continue
            }
            if (isUntouchable(codeLines[idx])) {
                continue
            }
            jmpdest = /^\s*JMP\s+:(\w+)\s*$/.exec(codeLines[idx])
            if (jmpdest !== null) {
                // If it is jump to jump, inspect new jump location
                return jmpdest[1] + ':'
            }
            return codeLines[idx]
        }
        return ''
    }

    /** Untouchable lines are the ones with these contents:
     * - empty line
     * - DELETE
     * - ^directives
     * */
    function isUntouchable (line: string) : boolean {
        if (line === '' || line === 'DELETE' || /^\s*\^\w+(.*)/.exec(line) !== null) {
            return true
        }
        return false
    }

    function inverseBranch (branchOperator: string) : string {
        switch (branchOperator) {
        case 'BGT': return 'BLE'
        case 'BLT': return 'BGE'
        case 'BGE': return 'BLT'
        case 'BLE': return 'BGT'
        case 'BEQ': return 'BNE'
        case 'BNE': return 'BEQ'
        case 'BZR': return 'BNZ'
        case 'BNZ': return 'BZR'
        default: throw new Error('Internal error.')
        }
    }

    /* Start of dangerous optimizations. They are already coded in codeGenerator and mostly will
    * lead to no optimization, but can mess with code. */

    function operatorSetSwap (value: string, index: number, array: string[]) : void {
        // ADD @r0 $b
        // SET @b $r0
        // turns ADD @b $r0
        const opdat = /^\s*(\w+)\s+@(\w+)\s+\$(\w+)\s*$/.exec(value)
        if (opdat === null) {
            return
        }
        const setdat = /^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index + 1])
        if (!(setdat !== null && opdat[2] === setdat[2] && opdat[3] === setdat[1])) {
            return
        }
        switch (opdat[1]) {
        case 'ADD': case 'MUL': case 'AND': case 'XOR': case 'BOR':
            array[index] = opdat[1] + ' @' + opdat[3] + ' $' + opdat[2]
            array[index + 1] = 'DELETE'
            optimizedLines++
        }
    }

    function setOperatorSwap (value: string, index: number, array: string[]) : void {
        // SET @r0 $a
        // ADD @b $r0
        // turns ADD @b $a
        const setdat = /^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(value)
        if (setdat === null) {
            return
        }
        const opdat = /^\s*(\w+)\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index + 1])
        if (!(opdat !== null && setdat[1] === opdat[3])) {
            return
        }
        switch (opdat[1]) {
        case 'ADD': case 'SUB': case 'MUL': case 'DIV':
        case 'AND': case 'XOR': case 'BOR':
        case 'MOD': case 'SHL': case 'SHR':
            array[index] = opdat[1] + ' @' + opdat[2] + ' $' + setdat[2]
            array[index + 1] = 'DELETE'
            optimizedLines++
        }
    }

    function pushOpt (value: string, index: number, array: string[]) : void {
        // SET @r0 $a
        // PSH $r0 / SLP $r0
        // turns PSH $a / SLP $a
        const setdat = /^\s*SET\s+@(r\d)\s+\$(\w+)\s*$/.exec(value)
        if (setdat === null) {
            return
        }
        const pshslpdat = /^\s*(PSH|SLP)\s+\$(\w+)\s*$/.exec(array[index + 1])
        if (pshslpdat === null) {
            return
        }
        if (pshslpdat[2] === setdat[1]) {
            array[index] = 'DELETE'
            array[index + 1] = pshslpdat[1] + ' $' + setdat[2]
            optimizedLines++
        }
    }

    function setidxOpt (value: string, index: number, array: string[]) : void {
        const setdat = /^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(value)
        if (setdat === null) {
            return
        }
        let i = index
        while (++i < array.length - 1) {
            const lbl = /^\s*(\w+):\s*$/.exec(array[i])
            if (lbl !== null) {
                break
            }
            const jmpto = /^.+\s:(\w+)$/.exec(array[i]) // match JMP JSR ERR and all branches
            if (jmpto !== null) {
                break
            }
            const retto = /^\s*(RET|FIN)\s*$/.exec(array[i])
            if (retto !== null) {
                break
            }
            if (array[i].indexOf(setdat[1]) >= 0) {
                // SET @r0 $a
                // SET @z $($val + $r0)
                // turns SET @z $($val + $a)
                let setdat2 = /^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\s*\+\s*\$(\w+)\)\s*$/.exec(array[i])
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
    }

    function popOpt (value: string, index: number, array: string[]) : void {
        // POP @r0
        // SET @z $r0
        // turns POP @z
        const popdat = /^\s*POP\s+@(r\d)\s*$/.exec(value)
        if (popdat !== null) {
            const setdat = /^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index + 1])
            if (setdat !== null && setdat[2] === popdat[1]) {
                array[index] = 'POP @' + setdat[1]
                array[index + 1] = 'DELETE'
                optimizedLines++
            }
        }
    }

    function pointerZeroOpt (value: string, index: number, array: string[]) : void {
        // Optimize pointer operations with zero index
        const clrdat = /^\s*CLR\s+@(\w+)\s*$/.exec(value)
        if (clrdat === null) {
            return
        }
        let i = index
        while (++i < array.length - 1) {
            const lbl = /^\s*(\w+):\s*$/.exec(array[i])
            if (lbl !== null) {
                break
            }
            const jmpto = /^.+\s:(\w+)$/.exec(array[i]) // match JMP JSR ERR and all branches
            if (jmpto !== null) {
                break
            }
            const retto = /^\s*(RET|FIN)\s*$/.exec(array[i])
            if (retto !== null) {
                break
            }
            if (array[i].indexOf(clrdat[1]) === -1) {
                continue
            }
            let setdat = /^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\s*\+\s*\$(\w+)\)\s*$/.exec(array[i])
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

    return optimizerMain()
}
