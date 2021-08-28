// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

/* global TOKEN TOKEN_MODIFIER CONTRACT SENTENCES optimize MEMORY_SLOT DECLARATION_TYPES AST utils ARRAY_TYPE_DEFINITION
STRUCT_TYPE_DEFINITION */

/**
 * Code generator. Translates a Program into assembly source code
 * @param Program object holding information
 * @returns assembly source code
 */
// eslint-disable-next-line no-unused-vars
function generate (Program: CONTRACT) {
    // holds variables needed during compilation
    const generateUtils: {
        /** Stack saving loops IDs */
        latestLoopId: string[]
        /** Auto incrementing index for labels generation */
        jumpId: number
        /** Assembly code being created */
        assemblyCode: string
        /** Current function being processed */
        currFunctionIndex: number
        getNewJumpID(currLine: number): string
        getLatestLoopId(): string
    } = {
        latestLoopId: [],
        jumpId: 0,
        assemblyCode: '',
        currFunctionIndex: -1,
        getNewJumpID: function (line: number) {
            let id = ''
            if (Program.Config.enableLineLabels) {
                id += line + '_'
            }
            if (Program.Config.enableRandom === true) {
                return id + Math.random().toString(36).substr(2, 5)
            }

            this.jumpId++
            return id + this.jumpId.toString(36)
        },
        getLatestLoopId: function () {
            // error check must be in code!
            return this.latestLoopId[this.latestLoopId.length - 1]
        }
    }

    // main function for bigastCompile method, only run once.
    function generateMain () {
        // add Config Info
        configDeclarationGenerator()

        // add variables declaration
        Program.memory.forEach(assemblerDeclarationGenerator)
        writeAsmLine('') // blank line to be nice to debugger!

        // Add code for global sentences
        generateUtils.currFunctionIndex = -1
        Program.Global.sentences.forEach(compileSentence)

        // jump to main function, or program ends.
        if (Program.functions.find(obj => obj.name === 'main') === undefined) {
            writeAsmLine('FIN')
        } else {
            writeAsmLine('JMP :__fn_main')
        }

        // For every function:
        Program.functions.forEach((currentFunction, index) => {
            generateUtils.currFunctionIndex = index
            writeAsmLine('') // blank line to be nice to debugger!
            functionHeaderGenerator()
            // add code for functions sentences.
            if (currentFunction.sentences !== undefined) {
                currentFunction.sentences.forEach(compileSentence)
            }

            functionTailGenerator()
        })

        // Optimize code;
        if (Program.Config.globalOptimization) {
            return optimize(generateUtils.assemblyCode, Program.Config.maxConstVars)
        }

        return generateUtils.assemblyCode
    }

    /**
    * Traverse the AST created by syntaxer and creates assembly source code.
    * @param cgAST AST to be compiled
    * @param jumpTarget must be set if the evaluation is part of conditionals or
    * loops. It shall be the location where to jump if the evaluated
    * expression is false.
    * @param jumpNotTarget It is the jump location for complementary logic.
    * @param isReversedLogic to use reverse logic for expression evaluation.
    * @returns Assembly source code
    */
    function codeGenerator (cgAST?: AST, jumpTarget?: string, jumpNotTarget?:string, isReversedLogic?: boolean) {
        const auxVars: {
            tmpvars: string[]
            status: boolean[]
            postOperations: string
            funcArgs: []
            declaring: DECLARATION_TYPES
            pointerCodecave: boolean
            isLeftSideOfAssignment: boolean
            isConstSentence: boolean
            isTemp(loc: number): boolean
            getNewRegister(): MEMORY_SLOT
            freeRegister(loc: number|undefined): void
            createTmpVarsTable(): void
            getPostOperations(): string
        } = {
            tmpvars: [],
            status: [],
            postOperations: '',
            funcArgs: [],
            declaring: '',
            pointerCodecave: false,
            isLeftSideOfAssignment: false,
            isConstSentence: false,

            isTemp (loc) {
                if (loc === -1) return false
                const MemObj = getMemoryObjectByLocation(loc)
                const id = this.tmpvars.indexOf(MemObj.name)
                if (id >= 0) {
                    if (this.status[id] === true) {
                        return true
                    }
                }
                return false
            },

            getNewRegister () {
                const id = this.status.indexOf(false)
                if (id === -1) {
                    throw new RangeError("No more registers available. Try to reduce nested operations or increase 'max_auxVars'")
                }
                this.status[id] = true
                return getMemoryObjectByName(this.tmpvars[id])
            },

            freeRegister (loc) {
                if (loc === undefined || loc === -1) {
                    return
                }
                const MemObj = getMemoryObjectByLocation(loc)
                const id = this.tmpvars.indexOf(MemObj.name)
                if (id === -1) return
                this.status[id] = false
            },

            createTmpVarsTable () {
                for (let i = 0; i < Program.Config.maxAuxVars; i++) {
                    this.tmpvars.push('r' + i)
                    this.status.push(false)
                }
            },

            getPostOperations () {
                const ret = this.postOperations
                this.postOperations = ''
                return ret
            }
        }

        interface GENCODE_RETURN_OBJECT {
            MemObj: MEMORY_SLOT
            instructionset: string
        }
        interface MOLD_OBJECT {
            MoldedObj: MEMORY_SLOT
            instructionset: string
            isNew: boolean
        }

        if (cgAST === undefined) {
            throw new TypeError('At unknow line. Undefined AST arrived at codeGenerator. BugReport please.')
        }

        auxVars.createTmpVarsTable()

        let code: GENCODE_RETURN_OBJECT

        if (isReversedLogic === undefined) {
            isReversedLogic = false
        }

        if (jumpTarget === undefined) {
            code = genCode(cgAST, false, isReversedLogic, jumpTarget, jumpNotTarget)
            if (code.MemObj.type !== 'void' && auxVars.isTemp(code.MemObj.address) && code.MemObj.type.indexOf('_ptr') === -1) {
                if (Program.Config.warningToError) {
                    if (cgAST.type === 'endASN') {
                        throw new TypeError(`At line: ${cgAST.Token.line}. Warning: Value ${cgAST.Token.value} not being used.`)
                    }
                    if (cgAST.type === 'lookupASN') {
                        throw new TypeError(`At line: ${cgAST.Token.line}. Warning: Value ${cgAST.Token.value} not being used.`)
                    }
                    if (cgAST.type === 'unaryASN' || cgAST.type === 'binaryASN') {
                        if (cgAST.Operation.type !== 'Function') {
                            throw new TypeError(`At line: ${cgAST.Operation.line}. Warning: Operation returning a value that is not being used.`)
                        }
                    }
                }
            }
        } else {
            code = genCode(cgAST, true, isReversedLogic, jumpTarget, jumpNotTarget)
        }

        code.instructionset += auxVars.postOperations

        // optimizations for jumps and labels
        if (code.instructionset.indexOf(':') >= 0) {
            if (cgAST.type === 'endASN') {
                if (cgAST.Token.type === 'Keyword' && cgAST.Token.value === 'label') {
                    return code.instructionset // do not optimize!!!
                }
            }
            code.instructionset = utils.miniOptimizeJumps(code.instructionset)
        }

        return code.instructionset

        /**
         * Hardwork to compile expressions. Function is recursive to traverse all ASN.
         * @param objTree AST to traverse
         * @param logicalOp true if wanted return object to be suitable for logical operations
         * @param revLogic true if wanted to reverse logic for logical operations
         * @param jumpFalse Label to jump if logical operation is false
         * @param jumpTrue Label to jump if logical operatio is true
         * @returns Object with currently variable returned and the string with assembly code for the remaining AST evaluated
         */
        function genCode (objTree: AST, logicalOp: boolean, revLogic: boolean, jumpFalse?: string, jumpTrue?: string): GENCODE_RETURN_OBJECT {
            let retMemObj: MEMORY_SLOT
            let instructionstrain = ''
            let arrayIndex = -1

            switch (objTree.type) {
            case 'nullASN':
                return { MemObj: utils.createVoidMemObj(), instructionset: '' }
            case 'endASN':
                if (logicalOp === true) {
                    if (objTree.Token.type === 'Constant') {
                        if (revLogic === false) {
                            if (objTree.Token.value === '0000000000000000') {
                                return { MemObj: utils.createVoidMemObj(), instructionset: createSimpleInstruction('Jump', jumpFalse) }
                            }
                            return { MemObj: utils.createVoidMemObj(), instructionset: '' }
                        }
                        if (objTree.Token.value !== '0000000000000000') {
                            return { MemObj: utils.createVoidMemObj(), instructionset: createSimpleInstruction('Jump', jumpTrue) }
                        }
                        return { MemObj: utils.createVoidMemObj(), instructionset: '' }
                    }
                    if (objTree.Token.type === 'Variable') {
                        const LGenObj = genCode(objTree, false, revLogic)
                        instructionstrain += LGenObj.instructionset
                        instructionstrain += createInstruction(utils.genNotEqualToken(), LGenObj.MemObj, utils.createConstantMemObj(0), revLogic, jumpFalse, jumpTrue)
                        auxVars.freeRegister(LGenObj.MemObj.address)
                        return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                    }
                    throw new TypeError('At line: ' + objTree.Token.line + ". Object type '" + objTree.Token.type + ' at logical operation... Do not know what to do.')
                } else {
                    if (objTree.Token.type === 'Variable') {
                        retMemObj = getMemoryObjectByName(objTree.Token.value, objTree.Token.line, auxVars.declaring)
                        return { MemObj: retMemObj, instructionset: instructionstrain }
                    }

                    if (objTree.Token.type === 'Keyword') {
                        if (objTree.Token.value === 'break' || objTree.Token.value === 'continue' ||
                            objTree.Token.value === 'label' || objTree.Token.value === 'asm' ||
                            objTree.Token.value === 'exit' || objTree.Token.value === 'halt') {
                            return { MemObj: utils.createVoidMemObj(), instructionset: createInstruction(objTree.Token) }
                        }

                        if (objTree.Token.value === 'return') { // this is 'return;'
                            if (generateUtils.currFunctionIndex === -1) {
                                throw new TypeError('At line: ' + objTree.Token.line + ". Can not use 'return' in global statements.")
                            }
                            if (Program.functions[generateUtils.currFunctionIndex].declaration !== 'void') {
                                throw new TypeError('At line: ' + objTree.Token.line + ". Function '" +
                                       Program.functions[generateUtils.currFunctionIndex].name + "' must return a '" +
                                       Program.functions[generateUtils.currFunctionIndex].declaration + "' value.")
                            }
                            if (Program.functions[generateUtils.currFunctionIndex].name === 'main') {
                                return { MemObj: utils.createVoidMemObj(), instructionset: createSimpleInstruction('exit') }
                            }
                            return { MemObj: utils.createVoidMemObj(), instructionset: createInstruction(objTree.Token) }
                        }

                        throw new TypeError('At line: ' + objTree.Token.line + ". Keywords '" + objTree.Token.value + "' not implemented.")
                    }

                    if (objTree.Token.type === 'Constant') { // ok
                        retMemObj = utils.createConstantMemObj()
                        retMemObj.size = objTree.Token.value.length / 16
                        retMemObj.hexContent = objTree.Token.value
                        if (auxVars.pointerCodecave === true) {
                            retMemObj.type += '_ptr'
                        }
                        return { MemObj: retMemObj, instructionset: '' }
                    }
                    throw new TypeError('At line:' + objTree.Token.line + '. End object not implemented: ' + objTree.Token.type + ' ' + objTree.Token)
                    // return { instructionset: "" };
                }

            case 'lookupASN':
                if (objTree.Token.type !== 'Variable') {
                    throw new TypeError(`At line: ${objTree.Token.line}. Modifiers implemented only for variables.`)
                }
                retMemObj = getMemoryObjectByName(objTree.Token.value, objTree.Token.line, auxVars.declaring)

                objTree.modifiers.forEach(CurrentModifier => {
                    if (CurrentModifier.type === 'MemberByRef') {
                        const TypeD = Program.typesDefinitions.find(obj => obj.type === 'struct' && obj.name === retMemObj.typeDefinition) as STRUCT_TYPE_DEFINITION
                        if (TypeD === undefined) {
                            throw new TypeError(`At line: ${objTree.Token.line}. Array type definition not found...`)
                        }
                        if (CurrentModifier.Center.type !== 'Variable') {
                            throw new TypeError(`At line: ${objTree.Token.line}. Can not use variables as struct members.`)
                        }
                        if (retMemObj.declaration !== 'struct_ptr') {
                            throw new TypeError(`At line: ${objTree.Token.line}. Variable '${retMemObj.name}' not defined as struct pointer.`)
                        }
                        const memberName = CurrentModifier.Center.value
                        let memberIdx = -1
                        for (let i = 0; i < TypeD.structAccumulatedSize.length; i++) {
                            if (TypeD.structAccumulatedSize[i][0] === memberName) {
                                memberIdx = i
                                break
                            }
                        }
                        if (memberIdx === -1) {
                            throw new TypeError(`At line: ${objTree.Token.line}. Member '${memberName}' not found on struct type definition.`)
                        }

                        if (retMemObj.Offset === undefined) {
                            let adder = 0
                            if (TypeD.structMembers[memberIdx].type === 'array') {
                                adder = 1
                            }
                            retMemObj.declaration = TypeD.structMembers[memberIdx].declaration
                            retMemObj.name = TypeD.structMembers[memberIdx].name
                            retMemObj.typeDefinition = TypeD.structMembers[memberIdx].typeDefinition
                            if (TypeD.structMembers[memberIdx].type === 'array') {
                                retMemObj.type = TypeD.structMembers[memberIdx].type
                            }
                            arrayIndex = -1
                            retMemObj.Offset = {
                                type: 'constant',
                                value: adder + TypeD.structAccumulatedSize[memberIdx][1]
                            }
                        } else if (retMemObj.Offset.type === 'constant') {
                            throw new TypeError(`At line: ${objTree.Token.line}. Inspection needed.`)
                        } else /* if (retMemObj.Modifier.type === "variable") */ {
                            throw new TypeError(`At line: ${objTree.Token.line}. Inspection needed.`)
                        }
                    }

                    if (CurrentModifier.type === 'MemberByVal') {
                        let TypeD: STRUCT_TYPE_DEFINITION | undefined
                        if (retMemObj.arrItem?.type === 'struct') { // array of struct
                            const typeName = retMemObj.arrItem.typeDefinition
                            TypeD = Program.typesDefinitions.find(obj => obj.type === 'struct' && obj.name === typeName) as STRUCT_TYPE_DEFINITION
                        } else { // regular case
                            TypeD = Program.typesDefinitions.find(obj => obj.type === 'struct' && obj.name === retMemObj.typeDefinition) as STRUCT_TYPE_DEFINITION
                        }
                        if (TypeD === undefined) {
                            throw new TypeError(`At line: ${objTree.Token.line}. Array type definition not found...`)
                        }
                        if (CurrentModifier.Center.type !== 'Variable') {
                            throw new TypeError(`At line: ${objTree.Token.line}. Can not use variables as struct members.`)
                        }
                        if (retMemObj.declaration === 'struct_ptr') {
                            throw new TypeError(`At line: ${objTree.Token.line}. Using wrong member notation. Try to use '->' instead.`)
                        }
                        const memberName = CurrentModifier.Center.value
                        let memberIdx = -1
                        for (let i = 0; i < TypeD.structAccumulatedSize.length; i++) {
                            if (TypeD.structAccumulatedSize[i][0] === memberName) {
                                memberIdx = i
                                break
                            }
                        }
                        if (memberIdx === -1) {
                            throw new TypeError(`At line: ${objTree.Token.line}. Member '${memberName}' not found on struct type definition.`)
                        }

                        if (retMemObj.Offset === undefined) {
                            retMemObj = getMemoryObjectByLocation(utils.addHexContents(retMemObj.hexContent, TypeD.structAccumulatedSize[memberIdx][1]))
                            arrayIndex = -1
                        } else if (retMemObj.Offset.type === 'constant') {
                            const adder = utils.addHexContents(retMemObj.Offset.value, retMemObj.hexContent)
                            retMemObj = getMemoryObjectByLocation(utils.addHexContents(adder, TypeD.structAccumulatedSize[memberIdx][1]))
                            arrayIndex = -1
                        } else /* if (retMemObj.offset_type === "variable") */ {
                            let adder = 0
                            if (TypeD.structMembers[memberIdx].type === 'array') {
                                adder = 1
                            }
                            instructionstrain += createInstruction(utils.genAddToken(objTree.Token.line),
                                getMemoryObjectByLocation(retMemObj.Offset.addr, objTree.Token.line),
                                utils.createConstantMemObj(utils.addHexContents(adder, TypeD.structAccumulatedSize[memberIdx][1])))
                            retMemObj.declaration = TypeD.structMembers[memberIdx].declaration
                            retMemObj.name = TypeD.structMembers[memberIdx].name
                            retMemObj.typeDefinition = TypeD.structMembers[memberIdx].typeDefinition
                            arrayIndex = -1
                        }
                    }

                    if (CurrentModifier.type === 'Array') {
                        arrayIndex++
                        let TmpMemObj: MEMORY_SLOT
                        let isPointerOp = false
                        let TypeD: ARRAY_TYPE_DEFINITION // = Program.typesDefinitions.find( obj => obj.type==="array" && obj.name===objTree.Token.value );
                        if (retMemObj.typeDefinition === undefined) { // array of structs
                            TypeD = Program.typesDefinitions.find(obj => obj.type === 'array' && obj.name === retMemObj.name) as ARRAY_TYPE_DEFINITION
                        } else if (objTree.Token.value === retMemObj.name) { // array simple
                            TypeD = Program.typesDefinitions.find(obj => obj.type === 'array' && obj.name === retMemObj.typeDefinition) as ARRAY_TYPE_DEFINITION
                        } else { // array inside struct
                            TypeD = Program.typesDefinitions.find(obj => obj.type === 'array' && obj.name.indexOf('_' + retMemObj.typeDefinition) > 0) as ARRAY_TYPE_DEFINITION
                        }
                        if (TypeD === undefined) {
                            if (retMemObj.declaration.indexOf('_ptr') === -1) {
                                throw new TypeError(`At line: ${objTree.Token.line}. Array type definition not found. Is '" + retMemObj.name + "' declared as array or pointer?`)
                            }
                            isPointerOp = true // allow use of array notation on pointer variables.
                        }
                        if (retMemObj.type !== 'array' && retMemObj.type !== 'struct' && retMemObj.Offset !== undefined) {
                            throw new TypeError(`At line: ${objTree.Token.line}. Can not use array notation on regular variables.`)
                        }

                        // allow some paranauê
                        const oldLeftState = auxVars.isLeftSideOfAssignment
                        auxVars.isLeftSideOfAssignment = false

                        const ParamMemObj = genCode(CurrentModifier.Center, false, false)
                        instructionstrain += ParamMemObj.instructionset

                        // undo paranauê
                        auxVars.isLeftSideOfAssignment = oldLeftState

                        if (retMemObj.declaration.indexOf('_ptr') > 0) {
                            retMemObj.declaration = retMemObj.declaration.slice(0, -4) as DECLARATION_TYPES
                        }

                        if (ParamMemObj.MemObj.type === 'void') { // special case for text assignment
                            return { MemObj: retMemObj, instructionset: instructionstrain }
                        }
                        // big decision tree depending on retMemObj.Offset.value and ParamMemObj.address
                        // let mobj_offvalue = retMemObj.Offset.value // undefined if does not exist, "constant", or variable address that can be temp or not (will be checked!)
                        // if (typeof (retMemObj.Offset.value) === 'string') {
                        //    mobj_offvalue = -1 // only if offset_type is constant
                        // }
                        const paramAddress = ParamMemObj.MemObj.address // -1 if it is constant, other value represents a variable that can be temp or not (will be checked!)

                        if (retMemObj.Offset === undefined) {
                            if (paramAddress === -1) {
                                if (isPointerOp) {
                                    TmpMemObj = auxVars.getNewRegister()
                                    instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, ParamMemObj.MemObj)
                                    retMemObj.type = 'array'
                                    retMemObj.Offset = {
                                        type: 'variable',
                                        addr: TmpMemObj.address
                                    }
                                } else {
                                    retMemObj.Offset = {
                                        type: 'constant',
                                        value: Number(`0x${ParamMemObj.MemObj.hexContent}`) * TypeD.arrayMultiplierDim[arrayIndex]
                                    }
                                }
                            } else if (auxVars.isTemp(paramAddress)) {
                                if (isPointerOp) {
                                    retMemObj.type = 'array'
                                } else {
                                    instructionstrain += createInstruction(utils.genMulToken(objTree.Token.line), ParamMemObj.MemObj, utils.createConstantMemObj(TypeD.arrayMultiplierDim[arrayIndex]))
                                }
                                retMemObj.Offset = {
                                    type: 'variable',
                                    addr: ParamMemObj.MemObj.address
                                }
                            } else /* if ( paramAddress is variable ) */ {
                                if (isPointerOp || TypeD.arrayMultiplierDim[arrayIndex] === 1) {
                                    if (isPointerOp) {
                                        retMemObj.type = 'array'
                                    }
                                    retMemObj.Offset = {
                                        type: 'variable',
                                        addr: ParamMemObj.MemObj.address
                                    }
                                } else {
                                    TmpMemObj = auxVars.getNewRegister()
                                    instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, ParamMemObj.MemObj)
                                    retMemObj.Offset = {
                                        type: 'variable',
                                        addr: TmpMemObj.address
                                    }
                                    instructionstrain += createInstruction(utils.genMulToken(objTree.Token.line), TmpMemObj, utils.createConstantMemObj(TypeD.arrayMultiplierDim[arrayIndex]))
                                }
                            }
                        } else if (retMemObj.Offset.type === 'constant') {
                            if (paramAddress === -1) {
                                retMemObj.Offset.value = retMemObj.Offset.value + Number(`0x${ParamMemObj.MemObj.hexContent}`) * TypeD.arrayMultiplierDim[arrayIndex]
                            } else if (auxVars.isTemp(paramAddress)) {
                                instructionstrain += createInstruction(utils.genMulToken(objTree.Token.line), ParamMemObj.MemObj, utils.createConstantMemObj(TypeD.arrayMultiplierDim[arrayIndex]))
                                instructionstrain += createInstruction(utils.genAddToken(objTree.Token.line), ParamMemObj.MemObj, utils.createConstantMemObj(retMemObj.Offset.value))
                                retMemObj.Offset = {
                                    type: 'variable',
                                    addr: ParamMemObj.MemObj.address
                                }
                            } else /* if ( paramAddress is variable  ) */ {
                                if (TypeD.arrayMultiplierDim[arrayIndex] === 1 && retMemObj.Offset.value === 0) {
                                    retMemObj.Offset = {
                                        type: 'variable',
                                        addr: ParamMemObj.MemObj.address
                                    }
                                } else {
                                    TmpMemObj = auxVars.getNewRegister()
                                    instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, ParamMemObj.MemObj)
                                    instructionstrain += createInstruction(utils.genMulToken(objTree.Token.line), TmpMemObj, utils.createConstantMemObj(TypeD.arrayMultiplierDim[arrayIndex]))
                                    instructionstrain += createInstruction(utils.genAddToken(objTree.Token.line), TmpMemObj, utils.createConstantMemObj(retMemObj.Offset.value))
                                    retMemObj.Offset = {
                                        type: 'variable',
                                        addr: TmpMemObj.address
                                    }
                                }
                            }
                        } else if (auxVars.isTemp(retMemObj.Offset.addr)) {
                            if (paramAddress === -1) {
                                const adder = utils.mulHexContents(ParamMemObj.MemObj.hexContent, TypeD.arrayMultiplierDim[arrayIndex])
                                instructionstrain += createInstruction(utils.genAddToken(objTree.Token.line), getMemoryObjectByLocation(retMemObj.Offset.addr, objTree.Token.line), utils.createConstantMemObj(adder))
                            } else if (auxVars.isTemp(paramAddress)) {
                                instructionstrain += createInstruction(utils.genMulToken(objTree.Token.line), ParamMemObj.MemObj, utils.createConstantMemObj(TypeD.arrayMultiplierDim[arrayIndex]))
                                instructionstrain += createInstruction(utils.genAddToken(objTree.Token.line), getMemoryObjectByLocation(retMemObj.Offset.addr, objTree.Token.line), ParamMemObj.MemObj)
                                auxVars.freeRegister(ParamMemObj.MemObj.address)
                            } else /* if (paramAddress is variable ) */ {
                                if (TypeD.arrayMultiplierDim[arrayIndex] === 1) {
                                    instructionstrain += createInstruction(utils.genAddToken(objTree.Token.line), getMemoryObjectByLocation(retMemObj.Offset.addr, objTree.Token.line), ParamMemObj.MemObj)
                                } else {
                                    TmpMemObj = auxVars.getNewRegister()
                                    instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, ParamMemObj.MemObj)
                                    instructionstrain += createInstruction(utils.genMulToken(objTree.Token.line), TmpMemObj, utils.createConstantMemObj(TypeD.arrayMultiplierDim[arrayIndex]))
                                    instructionstrain += createInstruction(utils.genAddToken(objTree.Token.line), getMemoryObjectByLocation(retMemObj.Offset.addr, objTree.Token.line), TmpMemObj)
                                    auxVars.freeRegister(TmpMemObj.address)
                                }
                            }
                        } else /* if ( retMemObj.Offset.addr is variable not temp ) */ {
                            if (paramAddress === -1) {
                                if (ParamMemObj.MemObj.hexContent !== '0000000000000000') {
                                    TmpMemObj = auxVars.getNewRegister()
                                    instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(ParamMemObj.MemObj.hexContent))
                                    if (!isPointerOp) {
                                        instructionstrain += createInstruction(utils.genMulToken(objTree.Token.line), TmpMemObj, utils.createConstantMemObj(TypeD.arrayMultiplierDim[arrayIndex]))
                                    }
                                    instructionstrain += createInstruction(utils.genAddToken(objTree.Token.line), TmpMemObj, getMemoryObjectByLocation(retMemObj.Offset.addr, objTree.Token.line))
                                    retMemObj.Offset.addr = TmpMemObj.address
                                }
                            } else if (auxVars.isTemp(paramAddress)) {
                                if (!isPointerOp) {
                                    instructionstrain += createInstruction(utils.genMulToken(objTree.Token.line), ParamMemObj.MemObj, utils.createConstantMemObj(TypeD.arrayMultiplierDim[arrayIndex]))
                                }
                                instructionstrain += createInstruction(utils.genAddToken(objTree.Token.line), ParamMemObj.MemObj, getMemoryObjectByLocation(retMemObj.Offset.addr, objTree.Token.line))
                                retMemObj.Offset.addr = ParamMemObj.MemObj.address
                            } else /* if (paramAddress is variable )) */ {
                                TmpMemObj = auxVars.getNewRegister()
                                instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, ParamMemObj.MemObj)
                                if (!isPointerOp) {
                                    instructionstrain += createInstruction(utils.genMulToken(objTree.Token.line), TmpMemObj, utils.createConstantMemObj(TypeD.arrayMultiplierDim[arrayIndex]))
                                }
                                instructionstrain += createInstruction(utils.genAddToken(objTree.Token.line), TmpMemObj, getMemoryObjectByLocation(retMemObj.Offset.addr, objTree.Token.line))
                                retMemObj.Offset.addr = TmpMemObj.address
                            }
                        }
                    }
                })

                // Fix special case where struct pointer with array member with constant index has incomplete information.
                // This does not allow constants on struct: code Yyx_sSkA
                if (retMemObj.hexContent === undefined && retMemObj.Offset !== undefined && retMemObj.Offset.type === 'constant') {
                    const TmpMemObj = auxVars.getNewRegister()
                    instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(retMemObj.Offset.value))
                    retMemObj.Offset = {
                        type: 'variable',
                        addr: TmpMemObj.address
                    }
                }

                if (logicalOp === true) {
                    instructionstrain += createInstruction(utils.genNotEqualToken(), retMemObj, utils.createConstantMemObj(0), revLogic, jumpFalse, jumpTrue)
                    if (retMemObj.Offset !== undefined && retMemObj.Offset.type === 'variable') {
                        auxVars.freeRegister(retMemObj.Offset.addr)
                    }
                    auxVars.freeRegister(retMemObj.address)
                    return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                }

                return { MemObj: retMemObj, instructionset: instructionstrain }

            case 'unaryASN':
                if (objTree.Operation.type === 'UnaryOperator') {
                    if (objTree.Operation.value === '!') { // logical NOT
                        if (logicalOp === true) {
                            return genCode(objTree.Center, true, !revLogic, jumpTrue, jumpFalse)
                        } else {
                            const rnd = generateUtils.getNewJumpID(objTree.Operation.line)

                            const IDNotSF = '__NOT_' + rnd + '_sF'// set false
                            const IDNotST = '__NOT_' + rnd + '_sT'// set true
                            const IDEnd = '__NOT_' + rnd + '_end'

                            const CGenObj = genCode(objTree.Center, true, !revLogic, IDNotST, IDNotSF)
                            instructionstrain += CGenObj.instructionset

                            if (auxVars.isTemp(CGenObj.MemObj.address)) { // maybe it was an arithmetic operation
                                instructionstrain += createInstruction(utils.genNotEqualToken(), CGenObj.MemObj, utils.createConstantMemObj(0), !revLogic, jumpFalse, jumpTrue)
                            }

                            const TmpMemObj = auxVars.getNewRegister()
                            instructionstrain += createSimpleInstruction('Label', IDNotST)
                            instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(1))
                            instructionstrain += createSimpleInstruction('Jump', IDEnd)
                            instructionstrain += createSimpleInstruction('Label', IDNotSF)
                            instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(0))
                            instructionstrain += createSimpleInstruction('Label', IDEnd)

                            auxVars.freeRegister(CGenObj.MemObj.address)

                            return { MemObj: TmpMemObj, instructionset: instructionstrain }
                        }
                    }

                    if (objTree.Operation.value === '+') { // unary plus -> do nothing
                        if (auxVars.isLeftSideOfAssignment === true) {
                            throw new TypeError('At line: ' + objTree.Operation.line + ". Can not have unary operator '+' on left side of assignment.")
                        }
                        return genCode(objTree.Center, logicalOp, revLogic, jumpFalse, jumpTrue)
                    }

                    if (objTree.Operation.value === '*') { // unary star -> pointer operation
                        if (auxVars.declaring.length !== 0) {
                            // do not do any other operation when declaring a pointer.
                            return genCode(objTree.Center, false, revLogic, jumpFalse, jumpTrue)
                        }

                        const CGenObj = genCode(objTree.Center, false, revLogic, jumpFalse, jumpTrue)
                        instructionstrain += CGenObj.instructionset

                        if (logicalOp === true) {
                            CGenObj.MemObj.type += '_ptr'
                            instructionstrain += createInstruction(utils.genNotEqualToken(), CGenObj.MemObj, utils.createConstantMemObj(0), revLogic, jumpFalse, jumpTrue)
                            auxVars.freeRegister(CGenObj.MemObj.address)
                            return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                        }

                        if (CGenObj.MemObj.declaration.indexOf('_ptr') === -1) {
                            if (!auxVars.isTemp(CGenObj.MemObj.address)) { // do not care about temp variables
                                if (Program.Config.warningToError) {
                                    if (objTree.Center.type === 'endASN' || objTree.Center.type === 'lookupASN') {
                                        throw new TypeError(`At line: ${objTree.Operation.line}. Trying to read/set content of variable ${objTree.Center.Token.value} that is not declared as pointer.`)
                                    }
                                    throw new TypeError(`At line: ${objTree.Operation.line}. Trying to read/set content of a value that is not declared as pointer.`)
                                }
                            }
                        } else {
                            CGenObj.MemObj.declaration = CGenObj.MemObj.declaration.slice(0, -4) as DECLARATION_TYPES
                        }

                        CGenObj.MemObj.type += '_ptr'

                        if (!auxVars.isLeftSideOfAssignment) {
                            const TmpMemObj = auxVars.getNewRegister()
                            instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, CGenObj.MemObj)
                            auxVars.freeRegister(CGenObj.MemObj.address)
                            return { MemObj: TmpMemObj, instructionset: instructionstrain }
                        } else {
                            return { MemObj: CGenObj.MemObj, instructionset: instructionstrain }
                        }
                    }

                    if (objTree.Operation.value === '-') {
                        const CGenObj = genCode(objTree.Center, false, revLogic, jumpFalse, jumpTrue)
                        instructionstrain += CGenObj.instructionset
                        const TmpMemObj = auxVars.getNewRegister()
                        instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(0))
                        instructionstrain += createInstruction(utils.genSubToken(objTree.Operation.line), TmpMemObj, CGenObj.MemObj)
                        auxVars.freeRegister(CGenObj.MemObj.address)

                        if (logicalOp === true) {
                            instructionstrain += createInstruction(utils.genNotEqualToken(), TmpMemObj, utils.createConstantMemObj(0), revLogic, jumpFalse, jumpTrue)
                            auxVars.freeRegister(TmpMemObj.address)
                            return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                        }

                        return { MemObj: TmpMemObj, instructionset: instructionstrain }
                    }

                    if (objTree.Operation.value === '~') {
                        let clearVar = false

                        const CGenObj = genCode(objTree.Center, false, revLogic, jumpFalse, jumpTrue)
                        instructionstrain += CGenObj.instructionset

                        let TmpMemObj: MEMORY_SLOT
                        if (!auxVars.isTemp(CGenObj.MemObj.address)) {
                            TmpMemObj = auxVars.getNewRegister()
                            instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, CGenObj.MemObj)
                            clearVar = true
                        } else {
                            TmpMemObj = CGenObj.MemObj
                        }
                        instructionstrain += createInstruction(objTree.Operation, TmpMemObj)

                        if (logicalOp === true) {
                            instructionstrain += createInstruction(utils.genNotEqualToken(), TmpMemObj, utils.createConstantMemObj(0), revLogic, jumpFalse, jumpTrue)
                            auxVars.freeRegister(CGenObj.MemObj.address)
                            auxVars.freeRegister(TmpMemObj.address)
                            return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                        }

                        if (clearVar) {
                            auxVars.freeRegister(CGenObj.MemObj.address)
                        }

                        return { MemObj: TmpMemObj, instructionset: instructionstrain }
                    }

                    if (objTree.Operation.value === '&') {
                        if (jumpTarget !== undefined || jumpFalse !== undefined) {
                            throw new SyntaxError(`At line: ${objTree.Operation.line}. Can not use UnaryOperator '&' during logical operations with branches.`)
                        }

                        const CGenObj = genCode(objTree.Center, false, revLogic, jumpFalse, jumpTrue)
                        instructionstrain += CGenObj.instructionset
                        let TmpMemObj: MEMORY_SLOT

                        if (CGenObj.MemObj.type === 'void') {
                            throw new TypeError(`At line: ${objTree.Operation.line}. Trying to get address of void value.`)
                        } else if (CGenObj.MemObj.type === 'register') {
                            if (Program.Config.warningToError) {
                                throw new TypeError(`WARNING: At line: ${objTree.Operation.line}. Returning address of a register.`)
                            }
                            TmpMemObj = utils.createConstantMemObj(CGenObj.MemObj.address)
                        } else if (CGenObj.MemObj.type === 'constant') {
                            throw new TypeError(`At line: ${objTree.Operation.line}. Trying to get address of a constant value.`)
                        } else if (CGenObj.MemObj.type === 'array') {
                            if (CGenObj.MemObj.Offset !== undefined) {
                                if (CGenObj.MemObj.Offset.type === 'constant') {
                                    TmpMemObj = utils.createConstantMemObj(utils.addHexContents(CGenObj.MemObj.hexContent, CGenObj.MemObj.Offset.value))
                                } else {
                                    const Copyvar = JSON.parse(JSON.stringify(CGenObj.MemObj))
                                    delete Copyvar.Offset
                                    TmpMemObj = auxVars.getNewRegister()
                                    instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, Copyvar)
                                    instructionstrain += createInstruction(utils.genAddToken(), TmpMemObj, getMemoryObjectByLocation(CGenObj.MemObj.Offset.addr))
                                }
                            } else {
                                TmpMemObj = utils.createConstantMemObj(CGenObj.MemObj.address)
                            }
                        } else if (CGenObj.MemObj.type === 'struct') {
                            TmpMemObj = utils.createConstantMemObj(CGenObj.MemObj.hexContent)
                        } else if (CGenObj.MemObj.type === 'long' /* || CGenObj.MemObj.type === 'long_ptr' || CGenObj.MemObj.type === 'struct_ptr' */) {
                            TmpMemObj = utils.createConstantMemObj(CGenObj.MemObj.address)
                        } else {
                            throw new TypeError(`At line: ${objTree.Operation.line}. Trying to get address of a Label`)
                        }

                        TmpMemObj.declaration += '_ptr'
                        return { MemObj: TmpMemObj, instructionset: instructionstrain }
                    }

                    throw new TypeError(`At line: ${objTree.Operation.line}. Unknow unary operator: ${objTree.Operation.value}.`)
                }

                if (objTree.Operation.type === 'CodeCave') {
                    return genCode(objTree.Center, logicalOp, revLogic, jumpFalse, jumpTrue)
                }

                if (objTree.Operation.type === 'Keyword') {
                    if (objTree.Operation.value === 'long' || objTree.Operation.value === 'void') {
                        auxVars.declaring = objTree.Operation.value
                        const ret = genCode(objTree.Center, false, revLogic, jumpFalse, jumpTrue)
                        return ret
                    }

                    if (objTree.Operation.value === 'const') {
                        auxVars.isConstSentence = true
                        const ret = genCode(objTree.Center, false, revLogic, jumpFalse, jumpTrue)
                        return ret
                    }

                    if (objTree.Operation.value === 'return') {
                        if (generateUtils.currFunctionIndex === -1) {
                            throw new TypeError('At line: ' + objTree.Operation.line + ". Can not use 'return' in global statements.")
                        }
                        const currentFunction = Program.functions[generateUtils.currFunctionIndex]
                        if (currentFunction.declaration === 'void') {
                            throw new TypeError('At line: ' + objTree.Operation.line + ". Function '" +
                                   currentFunction.name + "' must return a '" +
                                   currentFunction.declaration + "' value.")
                        }
                        if (currentFunction.name === 'main') {
                            throw new TypeError('At line: ' + objTree.Operation.line + '. main() Function must return void')
                        }
                        const RGenObj = genCode(objTree.Center, false, revLogic, jumpFalse, jumpTrue)
                        instructionstrain += RGenObj.instructionset
                        instructionstrain += auxVars.getPostOperations()

                        if (RGenObj.MemObj.declaration !== currentFunction.declaration) {
                            throw new TypeError(`At line: ${objTree.Operation.line}. Function ${currentFunction.name} must return '` +
                                `${currentFunction.declaration}' value, but it is returning '${RGenObj.MemObj.declaration}'.`)
                        }
                        instructionstrain += createInstruction(objTree.Operation, RGenObj.MemObj)

                        auxVars.freeRegister(RGenObj.MemObj.address)
                        return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                    }

                    if (objTree.Operation.value === 'goto' || objTree.Operation.value === 'sleep') {
                        const RGenObj = genCode(objTree.Center, false, revLogic, jumpFalse, jumpTrue)
                        instructionstrain += RGenObj.instructionset
                        instructionstrain += auxVars.getPostOperations()

                        instructionstrain += createInstruction(objTree.Operation, RGenObj.MemObj)

                        auxVars.freeRegister(RGenObj.MemObj.address)
                        return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                    }
                    if (objTree.Operation.value === 'struct') { // nothing to do here
                        return { MemObj: utils.createVoidMemObj(), instructionset: '' }
                    }
                }

                break

            case 'exceptionASN':
                if (objTree.Operation.type === 'SetUnaryOperator') {
                    if (jumpTarget !== undefined) {
                        throw new SyntaxError('At line: ' + objTree.Operation.line + '. Can not use SetUnaryOperator (++ or --) during logical operations with branches')
                    }
                    if (jumpFalse !== undefined) {
                        throw new SyntaxError('At line: ' + objTree.Operation.line + '. Can not use SetUnaryOperator (++ or --) during logical operations with branches')
                    }

                    if (auxVars.isLeftSideOfAssignment) {
                        throw new SyntaxError(`At line: ${objTree.Operation.line}. Can not use SetUnaryOperator '${objTree.Operation.value}' on left side or assignment.`)
                    }

                    if (objTree.Left !== undefined) {
                        const LGenObj = genCode(objTree.Left, false, revLogic, jumpFalse, jumpTrue)
                        instructionstrain += createInstruction(objTree.Operation, LGenObj.MemObj)
                        return { MemObj: LGenObj.MemObj, instructionset: instructionstrain }
                    }
                    if (objTree.Right !== undefined) {
                        const RGenObj = genCode(objTree.Right, false, revLogic, jumpFalse, jumpTrue)
                        auxVars.postOperations += createInstruction(objTree.Operation, RGenObj.MemObj)
                        return { MemObj: RGenObj.MemObj, instructionset: '' }
                    }
                    throw new TypeError(`At line: ${objTree.Operation.line}. Unknow SetUnaryOperator operation requested.`)
                }
                break

            case 'binaryASN':
                if (objTree.Operation.type === 'Function') {
                    let isAPI = false
                    const APIargs: MEMORY_SLOT[] = []
                    let subSentences: AST[]
                    let TmpMemObj: MEMORY_SLOT|undefined

                    let fnName: string
                    if (objTree.Left.type === 'endASN') {
                        fnName = objTree.Left.Token.value
                    } else {
                        throw new TypeError(`At line: ${objTree.Operation.line}. Invalid Function structure.`)
                    }

                    let search = Program.functions.find(val => val.name === fnName)
                    if (search === undefined) {
                        if (Program.Config.APIFunctions) {
                            search = Program.Global.APIFunctions.find(val => val.name === fnName)
                            if (search === undefined) {
                                throw new TypeError('At line: ' + objTree.Operation.line + ". Function '" + fnName + "' not declared.")
                            }
                            isAPI = true
                        } else {
                            throw new TypeError('At line: ' + objTree.Operation.line + ". Function '" + fnName + "' not declared.")
                        }
                    }

                    if (isAPI) {
                        if (search.declaration === 'void') {
                            TmpMemObj = utils.createVoidMemObj()
                        } else {
                            TmpMemObj = auxVars.getNewRegister() // reserve tempvar for return type
                        }

                        subSentences = utils.splitASTOnDelimiters(objTree.Right)
                        if (subSentences[0].type === 'nullASN') {
                            subSentences.pop()
                        }
                        if (subSentences.length !== search.argsMemObj.length) {
                            throw new TypeError('At line: ' + objTree.Operation.line + ". Wrong number of arguments for function '" + search.name + "'. It must have '" + search.argsMemObj.length + "' args.")
                        }

                        subSentences.forEach(stnc => {
                            const RGenObj = genCode(stnc, false, false)
                            instructionstrain += RGenObj.instructionset
                            if (RGenObj.MemObj.declaration.indexOf('_ptr') !== -1) {
                                if (Program.Config.warningToError) {
                                    throw new TypeError('WARNING: At line: ' + objTree.Operation.line + ". API Function parameter type is different from variable: 'long' and '" + RGenObj.MemObj.declaration + "'.")
                                }
                            }
                            APIargs.push(RGenObj.MemObj)
                        })

                        instructionstrain += createAPICallInstruction(utils.genAPICallToken(objTree.Operation.line, search.asmName), TmpMemObj, APIargs)
                        // instructionstrain += createInstruction(utils.genAPICallToken(objTree.Operation.line, search.asmName), TmpMemObj, APIargs)
                        APIargs.forEach(varnm => auxVars.freeRegister(varnm.address))

                        if (search.declaration === 'void') {
                            return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                        }

                        if (TmpMemObj.type !== 'void' && logicalOp === true) { // maybe logical operation was requested
                            instructionstrain += createInstruction(utils.genNotEqualToken(), TmpMemObj, utils.createConstantMemObj(0), revLogic, jumpFalse, jumpTrue)
                            auxVars.freeRegister(TmpMemObj.address)
                            return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                        }

                        return { MemObj: TmpMemObj, instructionset: instructionstrain }
                    } else { // if is regular function call
                        if (generateUtils.currFunctionIndex >= 0 && search.name === Program.functions[generateUtils.currFunctionIndex].name) {
                            throw new TypeError('At line: ' + fnName + '. Recursive functions not allowed.')
                        }

                        // Save registers currently in use in stack. Function execution will overwrite them
                        const registerStack: number[] = []
                        for (let i = auxVars.status.length - 1; i >= 0; i--) {
                            if (auxVars.status[i] === true) {
                                instructionstrain += createSimpleInstruction('Push', auxVars.tmpvars[i])
                                registerStack.push(i)
                            }
                        }

                        subSentences = utils.splitASTOnDelimiters(objTree.Right)
                        if (subSentences[0].type === 'nullASN') {
                            subSentences.pop()
                        }
                        if (subSentences.length !== search.argsMemObj.length) {
                            throw new TypeError('At line: ' + fnName + ". Wrong number of arguments for function '" + search.name + "'. It must have '" + search.argsMemObj.length + "' args.")
                        }
                        for (let i = subSentences.length - 1; i >= 0; i--) {
                            const RGenObj = genCode(subSentences[i], false, false)

                            if (!auxVars.isTemp(RGenObj.MemObj.address)) {
                                const fnArg = search.argsMemObj[i]
                                if (fnArg.declaration !== RGenObj.MemObj.declaration) {
                                    if (fnArg.declaration.indexOf('_ptr') === -1 || RGenObj.MemObj.declaration.indexOf('_ptr') === -1) { // skipt check if both sides are pointers
                                        if (Program.Config.warningToError) {
                                            throw new TypeError('WARNING: At line: ' + objTree.Operation.line + ". Function parameter type is different from variable: '" + fnArg.declaration + "' and '" + RGenObj.MemObj.declaration + "'.")
                                        }
                                    }
                                }
                            }

                            instructionstrain += RGenObj.instructionset
                            instructionstrain += createInstruction(utils.genPushToken(objTree.Operation.line), RGenObj.MemObj)
                            auxVars.freeRegister(RGenObj.MemObj.address)
                        }

                        instructionstrain += createSimpleInstruction('Function', fnName)

                        if (search.declaration !== 'void') {
                            TmpMemObj = auxVars.getNewRegister()
                            TmpMemObj.declaration = search.declaration
                            instructionstrain += createSimpleInstruction('Pop', TmpMemObj.asmName)
                        } else {
                            TmpMemObj = utils.createVoidMemObj()
                        }

                        // Load registers again
                        while (true) {
                            const id = registerStack.pop()
                            if (id === undefined) break
                            instructionstrain += createSimpleInstruction('Pop', auxVars.tmpvars[id])
                        }

                        if (search.declaration === 'void') {
                            return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                        }

                        if (TmpMemObj.type !== 'void' && logicalOp === true) { // maybe logical operation was requested
                            instructionstrain += createInstruction(utils.genNotEqualToken(), TmpMemObj, utils.createConstantMemObj(0), revLogic, jumpFalse, jumpTrue)
                            auxVars.freeRegister(TmpMemObj.address)
                            return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                        }

                        return { MemObj: TmpMemObj, instructionset: instructionstrain }
                    }
                }

                if (objTree.Operation.type === 'Comparision') {
                    if (logicalOp === false && jumpFalse === undefined) { // need to transform arithmetic to logical
                        const rnd = generateUtils.getNewJumpID(objTree.Operation.line)
                        const IDCompSF = '__CMP_' + rnd + '_sF'// set false
                        const IDCompST = '__CMP_' + rnd + '_sT'// set true
                        const IDEnd = '__CMP_' + rnd + '_end'
                        let ret: GENCODE_RETURN_OBJECT
                        let TmpMemObj: MEMORY_SLOT

                        if (objTree.Operation.value === '||') { // Code optimization
                            ret = genCode(objTree, true, true, IDCompSF, IDCompST) // do it again, now with jump defined
                            instructionstrain += ret.instructionset
                            TmpMemObj = auxVars.getNewRegister()
                            instructionstrain += createSimpleInstruction('Label', IDCompSF)
                            instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(0))
                            instructionstrain += createSimpleInstruction('Jump', IDEnd)
                            instructionstrain += createSimpleInstruction('Label', IDCompST)
                            instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(1))
                            instructionstrain += createSimpleInstruction('Label', IDEnd)
                        } else {
                            jumpTrue = IDCompST
                            ret = genCode(objTree, true, false, IDCompSF, IDCompST) // do it again, now with jump defined
                            instructionstrain += ret.instructionset
                            TmpMemObj = auxVars.getNewRegister()
                            instructionstrain += createSimpleInstruction('Label', IDCompST)
                            instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(1))
                            instructionstrain += createSimpleInstruction('Jump', IDEnd)
                            instructionstrain += createSimpleInstruction('Label', IDCompSF)
                            instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(0))
                            instructionstrain += createSimpleInstruction('Label', IDEnd)
                        }

                        auxVars.freeRegister(ret.MemObj.address)
                        return { MemObj: TmpMemObj, instructionset: instructionstrain }
                    }

                    if (objTree.Operation.value === '||') {
                        const rnd = generateUtils.getNewJumpID(objTree.Operation.line)

                        const IDNextStmt = '__OR_' + rnd + '_next'

                        const LGenObj = genCode(objTree.Left, true, true, IDNextStmt, jumpTrue)
                        instructionstrain += LGenObj.instructionset
                        if (auxVars.isTemp(LGenObj.MemObj.address)) { // maybe it was an arithmetic operation
                            instructionstrain += createInstruction(utils.genNotEqualToken(), LGenObj.MemObj, utils.createConstantMemObj(0), true, jumpFalse, jumpTrue)
                        }

                        instructionstrain += createSimpleInstruction('Label', IDNextStmt)

                        const RGenObj = genCode(objTree.Right, true, true, jumpFalse, jumpTrue)
                        instructionstrain += RGenObj.instructionset
                        if (auxVars.isTemp(RGenObj.MemObj.address)) { // maybe it was an arithmetic operation
                            instructionstrain += createInstruction(utils.genNotEqualToken(), RGenObj.MemObj, utils.createConstantMemObj(0), true, jumpFalse, jumpTrue)
                        }

                        instructionstrain += createSimpleInstruction('Jump', jumpFalse)

                        return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                    }

                    if (objTree.Operation.value === '&&') {
                        const rnd = generateUtils.getNewJumpID(objTree.Operation.line)

                        const IDNextStmt = '__AND_' + rnd + '_next'

                        const LGenObj = genCode(objTree.Left, true, false, jumpFalse, IDNextStmt)
                        instructionstrain += LGenObj.instructionset
                        if (auxVars.isTemp(LGenObj.MemObj.address)) { // maybe it was an arithmetic operation
                            instructionstrain += createInstruction(utils.genNotEqualToken(), LGenObj.MemObj, utils.createConstantMemObj(0), false, jumpFalse, jumpTrue)
                        }

                        instructionstrain += createSimpleInstruction('Label', IDNextStmt)

                        const RGenObj = genCode(objTree.Right, true, false, jumpFalse, jumpTrue)
                        instructionstrain += RGenObj.instructionset
                        if (auxVars.isTemp(RGenObj.MemObj.address)) { // maybe it was an arithmetic operation
                            instructionstrain += createInstruction(utils.genNotEqualToken(), RGenObj.MemObj, utils.createConstantMemObj(0), false, jumpFalse, jumpTrue)
                        }

                        instructionstrain += createSimpleInstruction('Jump', jumpTrue)

                        return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                    }

                    // other comparisions operators: ==, !=, <, >, <=, >=

                    const LGenObj = genCode(objTree.Left, false, revLogic) //, jumpFalse, jumpTrue); must be undefined to evaluate expressions
                    instructionstrain += LGenObj.instructionset

                    const RGenObj = genCode(objTree.Right, false, revLogic) //, jumpFalse, jumpTrue); must be undefined to evaluate expressions
                    instructionstrain += RGenObj.instructionset

                    instructionstrain += createInstruction(objTree.Operation, LGenObj.MemObj, RGenObj.MemObj, revLogic, jumpFalse, jumpTrue)

                    auxVars.freeRegister(LGenObj.MemObj.address)
                    auxVars.freeRegister(RGenObj.MemObj.address)
                    return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                }

                if (objTree.Operation.type === 'Delimiter') {
                    if (jumpTarget !== undefined) {
                        throw new TypeError('At line: ' + objTree.Operation.line + '. Only one expression at a time if jumpTarget is set.')
                    }

                    const LGenObj = genCode(objTree.Left, false, revLogic, jumpFalse, jumpTrue)
                    instructionstrain += LGenObj.instructionset
                    instructionstrain += auxVars.getPostOperations()

                    const RGenObj = genCode(objTree.Right, false, revLogic, jumpFalse, jumpTrue)
                    instructionstrain += RGenObj.instructionset
                    // Note: RGenObj always have MemObj, because jumpTarget is undefined.
                    auxVars.freeRegister(RGenObj.MemObj.address)
                    instructionstrain += auxVars.getPostOperations()

                    return { MemObj: LGenObj.MemObj, instructionset: instructionstrain }
                }

                if (objTree.Operation.type === 'Operator') {
                    let LGenObj = genCode(objTree.Left, false, revLogic, jumpFalse, jumpTrue)
                    instructionstrain += LGenObj.instructionset

                    let RGenObj = genCode(objTree.Right, false, revLogic, jumpFalse, jumpTrue)
                    instructionstrain += RGenObj.instructionset

                    // Error handling
                    if (LGenObj.MemObj.type === 'void' || RGenObj.MemObj.type === 'void') {
                        throw new TypeError('At line: ' + objTree.Operation.line + '. Trying to make operations with undefined variables')
                    }
                    // optimization on constant codes:
                    if (LGenObj.MemObj.type === 'constant' && RGenObj.MemObj.type === 'constant') {
                        let TmpMemObj: MEMORY_SLOT
                        if (objTree.Operation.value === '+') {
                            TmpMemObj = utils.createConstantMemObj(utils.addHexContents(LGenObj.MemObj.hexContent, RGenObj.MemObj.hexContent))
                            return { MemObj: TmpMemObj, instructionset: instructionstrain }
                        } else if (objTree.Operation.value === '*') {
                            TmpMemObj = utils.createConstantMemObj(utils.mulHexContents(LGenObj.MemObj.hexContent, RGenObj.MemObj.hexContent))
                            return { MemObj: TmpMemObj, instructionset: instructionstrain }
                        } else if (objTree.Operation.value === '/') {
                            TmpMemObj = utils.createConstantMemObj(utils.divHexContents(LGenObj.MemObj.hexContent, RGenObj.MemObj.hexContent))
                            return { MemObj: TmpMemObj, instructionset: instructionstrain }
                        } else if (objTree.Operation.value === '-') {
                            TmpMemObj = utils.createConstantMemObj(utils.subHexContents(LGenObj.MemObj.hexContent, RGenObj.MemObj.hexContent))
                            return { MemObj: TmpMemObj, instructionset: instructionstrain }
                        }
                    }
                    // Try optimization if left side is constant (only commutativa operations!)
                    if (LGenObj.MemObj.type === 'constant') {
                        if (checkOperatorOptimization(objTree.Operation.value, LGenObj.MemObj)) {
                            const temp = RGenObj
                            RGenObj = LGenObj
                            LGenObj = temp
                        }
                    // Try optimization if operation is commutative, right side is register and left side is not
                    } else if (auxVars.isTemp(RGenObj.MemObj.address) && !auxVars.isTemp(LGenObj.MemObj.address) &&
                                (objTree.Operation.value === '+' || objTree.Operation.value === '*' || objTree.Operation.value === '&' ||
                                     objTree.Operation.value === '^' || objTree.Operation.value === '|')) {
                        const temp = RGenObj
                        RGenObj = LGenObj
                        LGenObj = temp
                    // Try optimization if operation is commutative, right side is constant ()
                    } else if (RGenObj.MemObj.type === 'constant') {
                        if (!checkOperatorOptimization(objTree.Operation.value, RGenObj.MemObj)) {
                            // if there is a better otimization, dont try this one
                            if (objTree.Operation.value === '+' || objTree.Operation.value === '*' || objTree.Operation.value === '&' ||
                                 objTree.Operation.value === '^' || objTree.Operation.value === '|') {
                                const temp = RGenObj
                                RGenObj = LGenObj
                                LGenObj = temp
                            }
                        }
                    }
                    let TmpMemObj: MEMORY_SLOT
                    if (!auxVars.isTemp(LGenObj.MemObj.address)) {
                        TmpMemObj = auxVars.getNewRegister()
                        TmpMemObj.declaration = LGenObj.MemObj.declaration
                        instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, LGenObj.MemObj)
                        auxVars.freeRegister(LGenObj.MemObj.address)
                    } else {
                        TmpMemObj = LGenObj.MemObj
                    }

                    // Pointer verifications
                    if (RGenObj.MemObj.declaration.indexOf('_ptr') !== -1 && TmpMemObj.declaration.indexOf('_ptr') === -1) {
                        // Case when adding numbers to pointers
                        TmpMemObj.declaration += '_ptr'
                    }
                    if (TmpMemObj.declaration.indexOf('_ptr') !== -1) {
                        if (objTree.Operation.value !== '+' && objTree.Operation.value !== '-') {
                            throw new TypeError('At line: ' + objTree.Operation.line + ". Operation not allowed on pointers. Only '+', '-', '++' and '--' are.")
                        }
                    }

                    instructionstrain += createInstruction(objTree.Operation, TmpMemObj, RGenObj.MemObj)

                    if (logicalOp === true) {
                        instructionstrain += createInstruction(utils.genNotEqualToken(), TmpMemObj, utils.createConstantMemObj(0), revLogic, jumpFalse, jumpTrue)
                        auxVars.freeRegister(RGenObj.MemObj.address)
                        auxVars.freeRegister(TmpMemObj.address)
                        return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                    }

                    auxVars.freeRegister(RGenObj.MemObj.address)
                    return { MemObj: TmpMemObj, instructionset: instructionstrain }
                }

                if (objTree.Operation.type === 'Assignment' || objTree.Operation.type === 'SetOperator') {
                    if (jumpFalse !== undefined) {
                        throw new SyntaxError('At line: ' + objTree.Operation.line + '. Can not use assignment during logical operations with branches')
                    }

                    auxVars.isLeftSideOfAssignment = true
                    const LGenObj = genCode(objTree.Left, false, revLogic, jumpFalse, jumpTrue)
                    instructionstrain += LGenObj.instructionset
                    auxVars.isLeftSideOfAssignment = false

                    if (LGenObj.MemObj.type === 'void') {
                        throw new SyntaxError('At line: ' + objTree.Operation.line + '. Trying to assign undefined variable')
                    }
                    if (LGenObj.MemObj.address === -1) {
                        throw new TypeError('At line: ' + objTree.Operation.line + '. Invalid left value for ' + objTree.Operation.type)
                    }
                    if (auxVars.isTemp(LGenObj.MemObj.address) && LGenObj.MemObj.type.lastIndexOf('_ptr') !== LGenObj.MemObj.type.length - 4) {
                        throw new TypeError('At line: ' + objTree.Operation.line + '. Invalid left value for ' + objTree.Operation.type)
                    }

                    let savedDeclaration: DECLARATION_TYPES = ''
                    if (auxVars.declaring.length !== 0) {
                        savedDeclaration = auxVars.declaring
                        auxVars.declaring = ''
                    }

                    if (LGenObj.MemObj.type === 'array' && LGenObj.MemObj.Offset !== undefined && LGenObj.MemObj.Offset.type === 'constant') { // if it is an array item we know, change to the item (and do optimizations)
                        LGenObj.MemObj = getMemoryObjectByLocation(utils.addHexContents(LGenObj.MemObj.hexContent, LGenObj.MemObj.Offset.value))
                    }
                    // check if we can reuse variables used on assignment
                    // then add it to auxVars.tmpvars
                    let RGenObj: GENCODE_RETURN_OBJECT
                    if (objTree.Operation.type === 'Assignment' &&
                        Program.Config.reuseAssignedVar === true &&
                        LGenObj.MemObj.type === 'long' &&
                        LGenObj.MemObj.Offset === undefined &&
                        CanReuseAssignedVar(LGenObj.MemObj.address, objTree.Right)) {
                        auxVars.tmpvars.unshift(LGenObj.MemObj.name)
                        auxVars.status.unshift(false)
                        RGenObj = genCode(objTree.Right, false, revLogic, jumpFalse, jumpTrue)
                        auxVars.tmpvars.shift()
                        auxVars.status.shift()
                    } else {
                        RGenObj = genCode(objTree.Right, false, revLogic, jumpFalse, jumpTrue)
                    }
                    instructionstrain += RGenObj.instructionset
                    if (savedDeclaration.length !== 0) {
                        auxVars.declaring = savedDeclaration
                    }

                    if (RGenObj.MemObj.type === 'void') {
                        throw new TypeError('At line: ' + objTree.Operation.line + '. Invalid right value for ' + objTree.Operation.type + '. Possible void value.')
                    }
                    if (LGenObj.MemObj.type === 'array' && LGenObj.MemObj.declaration === 'long_ptr' && RGenObj.MemObj.size === 1) {
                        throw new TypeError('At line: ' + objTree.Operation.line + '. Invalid left value for ' + objTree.Operation.type + '. Can not reassign an array.')
                    }
                    // Pointer verifications
                    if (LGenObj.MemObj.declaration.indexOf('_ptr') !== -1 &&
                        objTree.Operation.type === 'SetOperator' &&
                        RGenObj.MemObj.declaration.indexOf('_ptr') === -1) {
                        // Case when adding numbers to pointers
                        RGenObj.MemObj.declaration += '_ptr'
                        if (objTree.Operation.value !== '+=' && objTree.Operation.value !== '-=') {
                            throw new TypeError('At line: ' + objTree.Operation.line + ". Operation not allowed on pointers. Only '+', '-', '++' and '--' are.")
                        }
                    }

                    if (!auxVars.isTemp(RGenObj.MemObj.address)) {
                        if (LGenObj.MemObj.declaration !== RGenObj.MemObj.declaration) {
                            if (LGenObj.MemObj.declaration.indexOf('_ptr') === -1 || RGenObj.MemObj.declaration.indexOf('_ptr') === -1) { // skipt check if both sides are pointers
                                if (Program.Config.warningToError) {
                                    throw new TypeError('WARNING: At line: ' + objTree.Operation.line + ". Left and right values does not match. Values are: '" + LGenObj.MemObj.declaration + "' and '" + RGenObj.MemObj.declaration + "'.")
                                }
                            }
                        }
                    }
                    instructionstrain += createInstruction(objTree.Operation, LGenObj.MemObj, RGenObj.MemObj)

                    if (auxVars.isConstSentence === true) {
                        if (RGenObj.MemObj.address !== -1 || RGenObj.MemObj.type !== 'constant' || RGenObj.MemObj.hexContent === undefined) {
                            throw new TypeError('At line: ' + objTree.Operation.line + ". Right side of an assigment with 'const' keyword must be a constant.")
                        }
                        // Inspect ASM code and change accordingly
                        instructionstrain = setConstAsmCode(instructionstrain, objTree.Operation.line)
                        return { MemObj: LGenObj.MemObj, instructionset: instructionstrain }
                    }

                    auxVars.freeRegister(RGenObj.MemObj.address)
                    auxVars.freeRegister(RGenObj.MemObj.address)
                    return { MemObj: LGenObj.MemObj, instructionset: instructionstrain }
                }

                break
            }
            throw new TypeError(`At line: ${objTree.Operation.line}. Code generation error: Unknown operation '${objTree.Operation.type}'.`)
        }

        /** Transforms a instruction into const instruction */
        function setConstAsmCode (code: string, line: number) {
            const codelines = code.split('\n')
            const retlines: string[] = []

            codelines.forEach(instruction => {
                if (instruction.length === 0) {
                    retlines.push('')
                    return
                }
                const parts = /^\s*SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/.exec(instruction)
                if (parts === null) {
                    const clrpart = /^\s*CLR\s+@(\w+)\s*$/.exec(instruction)
                    if (clrpart !== null) {
                        // allow CLR instruction and change to SET zero
                        retlines.push('^const SET @' + clrpart[1] + ' #0000000000000000')
                        return
                    }
                    throw new TypeError(`At line: ${line}. No operations can be done during 'const' assignment.`)
                }
                const search = Program.memory.find(obj => obj.asmName === parts[1])
                if (search === undefined) {
                    throw new TypeError(`At line: ${line}. Variable ${parts[1]} not found in memory.`)
                }
                if (search.hexContent !== undefined) {
                    throw new TypeError(`At line: ${line}. Left side of an assigment with 'const' keyword already has been set.`)
                }
                search.hexContent = parts[2]
                retlines.push('^const ' + instruction)
            })

            return retlines.join('\n')
        }

        // all cases here must be implemented in createInstruction code oKSx4ab
        // place here only commutative operations!!!
        function checkOperatorOptimization (operator: string, ConstantObj: MEMORY_SLOT) {
            if (operator === '+' || operator === '+=') {
                if (ConstantObj.hexContent === '0000000000000000' ||
                    ConstantObj.hexContent === '0000000000000001' ||
                    ConstantObj.hexContent === '0000000000000002') {
                    return true
                }
            } else if (operator === '*' || operator === '*=') {
                if (ConstantObj.hexContent === '0000000000000000' ||
                    ConstantObj.hexContent === '0000000000000001') {
                    return true
                }
            }
            return false
        }

        /** Traverse an AST searching a variable name. In this case is the
         *  right side of an assignment. If variable 'name' is found, it
         *   can not be reused as temporary var (register)
         */
        function CanReuseAssignedVar (loc: number, ObjAST: AST): boolean {
            const SeekObj = getMemoryObjectByLocation(loc)
            const vname = SeekObj.name
            let canreuse: TOKEN_MODIFIER | undefined
            let left: boolean, right: boolean

            switch (ObjAST.type) {
            case 'nullASN':
                return true
            case 'endASN':
                if (ObjAST.Token.type === 'Variable' && ObjAST.Token.value === vname) {
                    return false
                }
                return true
            case 'lookupASN':
                canreuse = ObjAST.modifiers.find(CurrentModifier => {
                    if (CurrentModifier.type === 'Array') {
                        if (CanReuseAssignedVar(loc, CurrentModifier.Center) === false) {
                            return true
                        }
                    }
                    return false
                })
                if (canreuse === undefined) return true
                return false
            case 'unaryASN':
                return CanReuseAssignedVar(loc, ObjAST.Center)
            case 'binaryASN':
                left = CanReuseAssignedVar(loc, ObjAST.Left)
                right = CanReuseAssignedVar(loc, ObjAST.Right)
                if (left && right) return true
                return false
            case 'exceptionASN':
                if (ObjAST.Left !== undefined) {
                    return CanReuseAssignedVar(loc, ObjAST.Left)
                }
                if (ObjAST.Right !== undefined) {
                    return CanReuseAssignedVar(loc, ObjAST.Right)
                }
            }
            throw new TypeError('Unkown object arrived at CanReuseAssignedVar().')
        }

        function chooseBranch (value: string, useBZR: boolean, cbRevLogic: boolean) {
            if (useBZR) {
                if (cbRevLogic) {
                    if (value === '==') return 'BZR'
                    if (value === '!=') return 'BNZ'
                } else {
                    if (value === '==') return 'BNZ'
                    if (value === '!=') return 'BZR'
                }
                throw new TypeError(`Invalid use of Branch Zero: ${value}`)
            } else {
                if (cbRevLogic) {
                    if (value === '>') return 'BGT'
                    if (value === '>=') return 'BGE'
                    if (value === '<') return 'BLT'
                    if (value === '<=') return 'BLE'
                    if (value === '==') return 'BEQ'
                    if (value === '!=') return 'BNE'
                } else {
                    if (value === '>') return 'BLE'
                    if (value === '>=') return 'BLT'
                    if (value === '<') return 'BGE'
                    if (value === '<=') return 'BGT'
                    if (value === '==') return 'BNE'
                    if (value === '!=') return 'BEQ'
                }
            }
            throw new TypeError(`Unknow branch operation: ${value}`)
        }

        // Creates one simple assembly instruction
        function createSimpleInstruction (instruction: string, param1: string = '') {
            switch (instruction) {
            case 'Jump':
                return `JMP :${param1}\n`
            case 'Push':
                return `PSH $${param1}\n`
            case 'Pop':
                return `POP @${param1}\n`
            case 'exit':
                return 'FIN\n'
            case 'Label':
                return `${param1}:\n`
            case 'Function':
                return `JSR :__fn_${param1}\n`
            default:
                throw new TypeError(`Unknow simple instruction: ${instruction}`)
            }
        }

        function createAPICallInstruction (objoperator: TOKEN, param1: MEMORY_SLOT, param2: MEMORY_SLOT[]) {
            let retinstr = ''
            const tempvar: MOLD_OBJECT[] = []

            param2.forEach((varObj) => {
                const Temp = moldMemory(varObj, -1)
                retinstr += Temp.instructionset
                tempvar.push(Temp)
            })

            retinstr += 'FUN'
            if (param1.type !== 'void') {
                retinstr += ' @' + param1.asmName
            }
            retinstr += ' ' + objoperator.value
            tempvar.forEach(arg => {
                retinstr += ' $' + arg.MoldedObj.asmName
            })
            retinstr += '\n'

            tempvar.forEach(arg => auxVars.freeRegister(arg.MoldedObj.address))
            return retinstr
        }

        /**
         * From ParamMemObj create an memory object suitable for assembly operations, except assignment.
         * Returns also instructions maybe needed for conversion and an boolean to indicate if it is
         * a new object (that must be free later on)
        */
        function moldMemory (ParamMemObj: MEMORY_SLOT, line: number): MOLD_OBJECT {
            let RetObj: MEMORY_SLOT
            let retInstructions = ''
            let retIsNew = false

            if (ParamMemObj.type === 'constant') {
                RetObj = auxVars.getNewRegister()
                retInstructions += createInstruction(utils.genAssignmentToken(), RetObj, ParamMemObj)
                retIsNew = true
            } else if (ParamMemObj.type === 'register' || ParamMemObj.type === 'long') {
                RetObj = ParamMemObj
            } else if (ParamMemObj.type === 'register_ptr' || ParamMemObj.type === 'long_ptr') {
                RetObj = auxVars.getNewRegister()
                retInstructions += createInstruction(utils.genAssignmentToken(), RetObj, ParamMemObj)
                retIsNew = true
            } else if (ParamMemObj.type === 'array') {
                if (ParamMemObj.Offset === undefined) { // Pointer operation
                    RetObj = ParamMemObj
                } else if (ParamMemObj.Offset.type === 'constant') { // Looks like an array but can be converted to regular variable
                    RetObj = getMemoryObjectByLocation(utils.addHexContents(ParamMemObj.hexContent, ParamMemObj.Offset.value), line)
                } else {
                    RetObj = auxVars.getNewRegister()
                    retInstructions += createInstruction(utils.genAssignmentToken(), RetObj, ParamMemObj)
                    retIsNew = true
                }
            } else if (ParamMemObj.type === 'struct') {
                if (ParamMemObj.Offset === undefined) {
                    RetObj = ParamMemObj
                } else if (ParamMemObj.Offset.type === 'constant') {
                    RetObj = auxVars.getNewRegister()
                    retInstructions += createInstruction(utils.genAssignmentToken(), RetObj, utils.createConstantMemObj(ParamMemObj.Offset.value))
                    retIsNew = true
                } else {
                    RetObj = auxVars.getNewRegister()
                    retInstructions += createInstruction(utils.genAssignmentToken(), RetObj, ParamMemObj)
                    retIsNew = true
                }
            } else {
                throw new TypeError('At line: ' + line + ". Not implemented type in moldMemory(): ParamMemObj.type = '" + ParamMemObj.type + "'.")
            }

            return { MoldedObj: RetObj, instructionset: retInstructions, isNew: retIsNew }
        }

        // Translate one single instruction from ast to assembly code
        function createInstruction (objoperator: TOKEN, param1?: MEMORY_SLOT, param2?: MEMORY_SLOT, rLogic?:boolean, jpFalse?: string, jpTrue?:string) : string {
            let retinstr = ''

            if (objoperator.type === 'Assignment') {
                if (param1 === undefined || param2 === undefined) {
                    throw new TypeError(`At line: ${objoperator.line}. Missing parameters. BugReport please.`)
                }

                if (param1.type === 'constant' /* || param1.type === 'constant_ptr' */) {
                    throw new TypeError('At line: ' + objoperator.line + '.Invalid left side for assigment.')
                }
                if (param1.type === 'register' || param1.type === 'long') { // param 1 can be direct assigned
                    if (param2.type === 'constant') { // Can use SET_VAL or CLR_DAT
                        if (param2.hexContent === undefined) {
                            throw new TypeError(`At line: ${objoperator.line}. Missing hexContent parameter. BugReport please.`)
                        }
                        if (param2.hexContent === '0000000000000000') {
                            return 'CLR @' + param1.asmName + '\n'
                        }
                        if (param2.hexContent.length > 17) {
                            throw new RangeError('At line: ' + objoperator.line + '.Overflow on long value assignment (value bigger than 64 bits)')
                        }
                        return 'SET @' + param1.asmName + ' #' + param2.hexContent + '\n'
                    } else if (param2.type === 'register' || param2.type === 'long') { // Can use SET_DAT
                        if (param1.address === param2.address) return ''
                        else return 'SET @' + param1.asmName + ' $' + param2.asmName + '\n'
                    } else if (param2.type === 'register_ptr' || param2.type === 'long_ptr') {
                        return 'SET @' + param1.asmName + ' $($' + param2.asmName + ')\n'
                    // } else if (param2.type === 'constant_ptr') {
                    //     return 'SET @' + param1.asmName + ' $($' + getMemoryObjectByLocation(param2.hexContent, objoperator.line).asmName + ')\n'
                    } else if (param2.type === 'array' || param2.type === 'struct') {
                        if (param2.Offset === undefined) {
                            return 'SET @' + param1.asmName + ' $' + param2.asmName + '\n'
                        } else if (param2.Offset.type === 'constant') {
                            if (param2.type === 'array') {
                                return 'SET @' + param1.asmName + ' $' + getMemoryObjectByLocation(utils.addHexContents(param2.hexContent, param2.Offset.value), objoperator.line).asmName + '\n'
                            } else { // param2.type === "struct"
                                const TmpMemObj = auxVars.getNewRegister()
                                retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(param2.Offset.value))
                                retinstr += 'SET @' + param1.asmName + ' $($' + param2.asmName + ' + $' + TmpMemObj.asmName + ')\n'
                                auxVars.freeRegister(TmpMemObj.address)
                                return retinstr
                            }
                        } else {
                            return 'SET @' + param1.asmName + ' $($' + param2.asmName + ' + $' + getMemoryObjectByLocation(param2.Offset.addr, objoperator.line).asmName + ')\n'
                        }
                    }
                    throw new TypeError('At line: ' + objoperator.line + ". Unknow combination at createInstruction: param1 type '" + param1.type + "' and param2 type: '" + param2.type + "'.")
                } else if (param1.type === 'register_ptr' || param1.type === 'long_ptr') {
                    if (param2.type === 'constant') { // Can use SET_VAL or CLR_DAT
                        if (param2.hexContent === undefined) {
                            throw new TypeError(`At line: ${objoperator.line}. Missing hexContent parameter. BugReport please.`)
                        }
                        if (param2.hexContent.length > 17) {
                            throw new RangeError('At line: ' + objoperator.line + '.Overflow on long value assignment (value bigger than 64 bits)')
                        }
                        const TmpMemObj = auxVars.getNewRegister()
                        retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, param2)
                        retinstr += 'SET @($' + param1.asmName + ') $' + TmpMemObj.asmName + '\n'
                        auxVars.freeRegister(TmpMemObj.address)
                        return retinstr
                    } else if (param2.type === 'register' || param2.type === 'long') { // Can use SET_DAT
                        return 'SET @($' + param1.asmName + ') $' + param2.asmName + '\n'
                    } else if (param2.type === 'register_ptr' || param2.type === 'long_ptr') {
                        const TmpMemObj = auxVars.getNewRegister()
                        retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, param2)
                        retinstr += 'SET @($' + param1.asmName + ') $' + TmpMemObj.asmName + '\n'
                        auxVars.freeRegister(TmpMemObj.address)
                        return retinstr
                    // } else if (param2.type === 'constant_ptr') {
                    //     return 'SET @' + param1.asmName + ' #' + param2.hexContent + '\n'
                    } else if (param2.type === 'array' || param2.type === 'struct') {
                        if (param2.Offset === undefined) {
                            throw new TypeError(`At line: ${objoperator.line}. Undefined offset in array/struct! BugReport please.`)
                        } else if (param2.Offset.type === 'constant') {
                            if (param2.type === 'array') {
                                return 'SET @($' + param1.asmName + ') $' + getMemoryObjectByLocation(utils.addHexContents(param2.hexContent, param2.Offset.value), objoperator.line).asmName + '\n'
                            } else { // param2.type === "struct"
                                const TmpMemObj = auxVars.getNewRegister()
                                retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(param2.Offset.value))
                                retinstr += 'SET @' + TmpMemObj.asmName + ' $($' + param2.asmName + ' + $' + TmpMemObj.asmName + ')\n'
                                retinstr += 'SET @($' + param1.asmName + ') $' + TmpMemObj.asmName + '\n'
                                auxVars.freeRegister(TmpMemObj.address)
                                return retinstr
                            }
                        } else {
                            const TmpMemObj = auxVars.getNewRegister()
                            retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, param2)
                            retinstr += 'SET @($' + param1.asmName + ') $' + TmpMemObj.asmName + '\n'
                            auxVars.freeRegister(TmpMemObj.address)
                            return retinstr
                        }
                    }
                    throw new TypeError('At line: ' + objoperator.line + ". Unknow combination at createInstruction: param1 type '" + param1.type + "' and param2 type: '" + param2.type + "'.")
                } else if (param1.type === 'array') {
                    if (param1.Offset === undefined) {
                        if (param2.type === 'constant') {
                            // special case for multi-long text assignment
                            if (param1.arrItem === undefined || param2.hexContent === undefined) {
                                throw new RangeError(`At line: ${objoperator.line}. Anomaly detected. BugReport please.`)
                            }
                            const arraySize = param1.arrItem.totalSize - 1
                            if (param2.size > arraySize) {
                                throw new RangeError('At line: ' + objoperator.line + '. Overflow on array value assignment (value bigger than array size).')
                            }
                            const paddedLong = param2.hexContent.padStart(arraySize * 16, '0')
                            for (let i = 0; i < arraySize; i++) {
                                retinstr += createInstruction(
                                    utils.genAssignmentToken(),
                                    getMemoryObjectByLocation(utils.addHexContents(param1.hexContent, i), objoperator.line),
                                    utils.createConstantMemObj(paddedLong.slice(16 * (arraySize - i - 1), 16 * (arraySize - i))))
                            }
                            return retinstr
                        }
                    } else if (param1.Offset.type === 'constant') {
                        return createInstruction(objoperator, getMemoryObjectByLocation(utils.addHexContents(param1.hexContent, param1.Offset.value), objoperator.line), param2)
                    } else {
                        if (param2.type === 'constant') {
                            if (param2.hexContent === undefined) {
                                throw new TypeError(`At line: ${objoperator.line}. Missing hexContent parameter. BugReport please.`)
                            }
                            if (param2.hexContent.length > 16) {
                                throw new RangeError('At line: ' + objoperator.line + '. Overflow on long value assignment (value bigger than 64 bits)')
                            }
                            const TmpMemObj = auxVars.getNewRegister()
                            retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, param2)
                            retinstr += 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.Offset.addr, objoperator.line).asmName + ') $' + TmpMemObj.asmName + '\n'
                            auxVars.freeRegister(TmpMemObj.address)
                            return retinstr
                        } else if (param2.type === 'register' || param2.type === 'long') {
                            return 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.Offset.addr, objoperator.line).asmName + ') $' + param2.asmName + '\n'
                        } else if (param2.type === 'register_ptr' || param2.type === 'long_ptr') {
                            const TmpMemObj = auxVars.getNewRegister()
                            retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, param2)
                            retinstr += 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.Offset.addr, objoperator.line).asmName + ') $' + TmpMemObj.asmName + '\n'
                            auxVars.freeRegister(TmpMemObj.address)
                            return retinstr
                        } else if (param2.type === 'array' || param2.type === 'struct') {
                            if (param2.Offset === undefined) {
                                throw new TypeError(`At line: ${objoperator.line}. Undefined offset in array/struct! BugReport please.`)
                            } else if (param2.Offset.type === 'constant') {
                                if (param2.type === 'array') {
                                    return 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.Offset.addr, objoperator.line).asmName + ') $' + getMemoryObjectByLocation(utils.addHexContents(param2.hexContent, param2.Offset.value), objoperator.line).asmName + '\n'
                                } else { // param2.type === "struct"
                                    const TmpMemObj = auxVars.getNewRegister()
                                    retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(param2.Offset.value))
                                    retinstr += 'SET @' + TmpMemObj.asmName + ' $($' + param2.asmName + ' + $' + TmpMemObj.asmName + ')\n'
                                    retinstr += 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.Offset.addr, objoperator.line).asmName + ') $' + TmpMemObj.asmName + '\n'
                                    auxVars.freeRegister(TmpMemObj.address)
                                    return retinstr
                                }
                            } else {
                                const TmpMemObj = auxVars.getNewRegister()
                                retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, param2)
                                retinstr += 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.Offset.addr, objoperator.line).asmName + ') $' + TmpMemObj.asmName + '\n'
                                auxVars.freeRegister(TmpMemObj.address)
                                return retinstr
                            }
                        }
                    }
                    throw new TypeError('At line: ' + objoperator.line + ". Unknow combination at createInstruction: param1 type '" + param1.type + "' and param2 type: '" + param2.type + "'.")
                } else if (param1.type === 'struct') {
                    if (param1.Offset === undefined) {
                        if (param1.declaration === 'struct_ptr') {
                            if (param2.type === 'constant') {
                                return 'SET @' + param1.asmName + ' #' + param2.hexContent + '\n'
                            }
                            if (param2.type === 'register') {
                                return 'SET @' + param1.asmName + ' $' + param2.asmName + '\n'
                            }
                        }
                        throw new TypeError(`At line: ${objoperator.line}. Not implemented param1 struct. BugReport Please.`)
                    } else if (param1.Offset.type === 'constant') {
                        /* Code not allowed by condition Yyx_sSkA */
                    } else /* if (param1.Offset.type === "variable" ) */ {
                        if (param2.type === 'constant') {
                            if (param2.hexContent === undefined) {
                                throw new TypeError(`At line: ${objoperator.line}. Missing hexContent parameter. BugReport please.`)
                            }
                            if (param2.hexContent.length > 17) {
                                throw new RangeError('At line: ' + objoperator.line + '. Overflow on long value assignment (value bigger than 64 bits)')
                            }
                            const TmpMemObj = auxVars.getNewRegister()
                            retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, param2)
                            retinstr += 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.Offset.addr, objoperator.line).asmName + ') $' + TmpMemObj.asmName + '\n'
                            auxVars.freeRegister(TmpMemObj.address)
                            return retinstr
                        } else if (param2.type === 'register' || param2.type === 'long') {
                            return 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.Offset.addr, objoperator.line).asmName + ') $' + param2.asmName + '\n'
                        } else if (param2.type === 'array' || param2.type === 'struct') {
                            if (param2.Offset === undefined) {
                                throw new TypeError(`At line: ${objoperator.line}. Undefined offset in array/struct! BugReport please.`)
                            } else if (param2.Offset.type === 'constant') {
                                if (param2.type === 'array') {
                                    return 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.Offset.addr, objoperator.line).asmName + ') $' + getMemoryObjectByLocation(utils.addHexContents(param2.hexContent, param2.Offset.value), objoperator.line).asmName + '\n'
                                } else { // param2.type === "struct"
                                    const TmpMemObj = auxVars.getNewRegister()
                                    retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(param2.Offset.value))
                                    retinstr += 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.Offset.addr, objoperator.line).asmName + ') $' + TmpMemObj.asmName + '\n'
                                    auxVars.freeRegister(TmpMemObj.address)
                                    return retinstr
                                }
                            } else {
                                const TmpMemObj = auxVars.getNewRegister()
                                retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, param2)
                                retinstr += 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.Offset.addr, objoperator.line).asmName + ') $' + TmpMemObj.asmName + '\n'
                                auxVars.freeRegister(TmpMemObj.address)
                                return retinstr
                            }
                        }
                    }
                }
                throw new TypeError('At line: ' + objoperator.line + ". Unknow combination at createInstruction: param1 type '" + param1.type + "' and param2 type: '" + param2.type + "'.")
            }

            if (objoperator.type === 'Operator' || objoperator.type === 'SetOperator') {
                let allowOptimization = false
                let optimized = false

                if (param1 === undefined || param2 === undefined) {
                    throw new TypeError(`At line: ${objoperator.line}. Missing parameters. BugReport please.`)
                }

                if (param1.type === 'constant') {
                    throw new TypeError(`At line: ${objoperator.line}. Can not createInstruction. BugReport please.`)
                }
                const TmpMemObj1 = moldMemory(param1, objoperator.line)
                retinstr += TmpMemObj1.instructionset

                if (param2.type === 'constant') {
                    allowOptimization = true
                }
                const TmpMemObj2 = moldMemory(param2, objoperator.line)
                retinstr += TmpMemObj2.instructionset

                if (allowOptimization === true) {
                    function removeLastButOne () {
                        if (retinstr.length > 0) {
                            const codes = retinstr.split('\n')
                            codes.pop()
                            codes.pop()
                            retinstr = codes.join('\n')
                        }
                    }
                    // if add new condition here, add also in checkOperatorOptimization code oKSx4ab
                    // here we can have optimizations for all operations.
                    if (objoperator.value === '+' || objoperator.value === '+=') {
                        if (param2.hexContent === '0000000000000000') {
                            auxVars.freeRegister(TmpMemObj2.MoldedObj.address)
                            return ''
                        }
                        if (param2.hexContent === '0000000000000001') {
                            auxVars.freeRegister(TmpMemObj2.MoldedObj.address)
                            removeLastButOne()
                            retinstr += createInstruction(utils.genIncToken(), TmpMemObj1.MoldedObj)
                            optimized = true
                        }
                        if (param2.hexContent === '0000000000000002') {
                            auxVars.freeRegister(TmpMemObj2.MoldedObj.address)
                            removeLastButOne()
                            retinstr += createInstruction(utils.genIncToken(), TmpMemObj1.MoldedObj)
                            retinstr += createInstruction(utils.genIncToken(), TmpMemObj1.MoldedObj)
                            optimized = true
                        }
                    } else if (objoperator.value === '-' || objoperator.value === '-=') {
                        if (param2.hexContent === '0000000000000000') {
                            auxVars.freeRegister(TmpMemObj2.MoldedObj.address)
                            return ''
                        }
                        if (param2.hexContent === '0000000000000001') {
                            auxVars.freeRegister(TmpMemObj2.MoldedObj.address)
                            removeLastButOne()
                            retinstr += createInstruction(utils.genDecToken(), TmpMemObj1.MoldedObj)
                            optimized = true
                        }
                    } else if (objoperator.value === '*' || objoperator.value === '*=') {
                        if (param2.hexContent === '0000000000000000') {
                            auxVars.freeRegister(TmpMemObj2.MoldedObj.address)
                            removeLastButOne()
                            retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj1.MoldedObj, param2)
                            optimized = true
                        }
                        if (param2.hexContent === '0000000000000001') {
                            auxVars.freeRegister(TmpMemObj2.MoldedObj.address)
                            return ''
                        }
                    } else if (objoperator.value === '/' || objoperator.value === '/=') {
                        if (param2.hexContent === '0000000000000001') {
                            auxVars.freeRegister(TmpMemObj2.MoldedObj.address)
                            return ''
                        }
                    }
                }

                if (optimized === false) {
                    if (objoperator.value === '+' || objoperator.value === '+=') {
                        retinstr += 'ADD'
                    } else if (objoperator.value === '-' || objoperator.value === '-=') {
                        retinstr += 'SUB'
                    } else if (objoperator.value === '*' || objoperator.value === '*=') {
                        retinstr += 'MUL'
                    } else if (objoperator.value === '/' || objoperator.value === '/=') {
                        retinstr += 'DIV'
                    } else if (objoperator.value === '|' || objoperator.value === '|=') {
                        retinstr += 'BOR'
                    } else if (objoperator.value === '&' || objoperator.value === '&=') {
                        retinstr += 'AND'
                    } else if (objoperator.value === '^' || objoperator.value === '^=') {
                        retinstr += 'XOR'
                    } else if (objoperator.value === '%' || objoperator.value === '%=') {
                        retinstr += 'MOD'
                    } else if (objoperator.value === '<<' || objoperator.value === '<<=') {
                        retinstr += 'SHL'
                    } else if (objoperator.value === '>>' || objoperator.value === '>>=') {
                        retinstr += 'SHR'
                    } else {
                        throw new TypeError('At line: ' + objoperator.line + '.Operator not supported ' + objoperator.value)
                    }

                    retinstr += ' @' + TmpMemObj1.MoldedObj.asmName + ' $' + TmpMemObj2.MoldedObj.asmName + '\n'

                    auxVars.freeRegister(TmpMemObj2.MoldedObj.address)
                }

                if (TmpMemObj1.isNew === true) {
                    retinstr += createInstruction(utils.genAssignmentToken(), param1, TmpMemObj1.MoldedObj)
                    auxVars.freeRegister(TmpMemObj1.MoldedObj.address)
                }

                return retinstr
            }

            if (objoperator.type === 'UnaryOperator' || objoperator.type === 'SetUnaryOperator') {
                if (param1 === undefined) {
                    throw new TypeError(`At line: ${objoperator.line}. Missing parameters. BugReport please.`)
                }

                if (objoperator.value === '++') {
                    return 'INC @' + param1.asmName + '\n'
                }
                if (objoperator.value === '--') {
                    return 'DEC @' + param1.asmName + '\n'
                }
                if (objoperator.value === '~') {
                    return 'NOT @' + param1.asmName + '\n'
                }
                if (objoperator.value === '+') {
                    return ''
                }
                throw new TypeError('At line: ' + objoperator.line + '. Unary operator not supported: ' + objoperator.value)
            }

            if (objoperator.type === 'Comparision') {
                if (param1 === undefined || param2 === undefined || rLogic === undefined || jpFalse === undefined || jpTrue === undefined) {
                    throw new TypeError(`At line: ${objoperator.line}. Missing parameters. BugReport please.`)
                }

                let jump = jpFalse
                if (rLogic) {
                    jump = jpTrue
                }

                const TmpMemObj1 = moldMemory(param1, objoperator.line)
                retinstr += TmpMemObj1.instructionset

                if (param2.type === 'constant' && param2.hexContent === '0000000000000000' && (objoperator.value === '!=' || objoperator.value === '==')) {
                    retinstr += chooseBranch(objoperator.value, true, rLogic)
                    retinstr += ' $' + TmpMemObj1.MoldedObj.asmName + ' :' + jump + '\n'
                    if (TmpMemObj1.isNew === true) {
                        auxVars.freeRegister(TmpMemObj1.MoldedObj.address)
                    }
                    return retinstr
                }

                const TmpMemObj2 = moldMemory(param2, objoperator.line)
                retinstr += TmpMemObj2.instructionset
                retinstr += chooseBranch(objoperator.value, false, rLogic)
                retinstr += ' $' + TmpMemObj1.MoldedObj.asmName + ' $' + TmpMemObj2.MoldedObj.asmName + ' :' + jump + '\n'

                if (TmpMemObj1.isNew === true) {
                    auxVars.freeRegister(TmpMemObj1.MoldedObj.address)
                }
                if (TmpMemObj2 !== undefined && TmpMemObj2.isNew === true) {
                    auxVars.freeRegister(TmpMemObj2.MoldedObj.address)
                }

                return retinstr
            }

            if (objoperator.type === 'Push') {
                if (param1 === undefined) {
                    throw new TypeError(`At line: ${objoperator.line}. Missing parameter for PSH. BugReport please.`)
                }

                const TmpMemObj = moldMemory(param1, objoperator.line)
                retinstr += TmpMemObj.instructionset
                retinstr += 'PSH $' + TmpMemObj.MoldedObj.asmName + '\n'

                if (TmpMemObj.isNew === true) {
                    auxVars.freeRegister(TmpMemObj.MoldedObj.address)
                }
                return retinstr
            }

            if (objoperator.type === 'Keyword') {
                if (objoperator.value === 'break' || objoperator.value === 'continue') {
                    return 'JMP :' + generateUtils.getLatestLoopId() + '_' + objoperator.value + '\n'
                }
                if (objoperator.value === 'label') {
                    return objoperator.extValue + ':\n'
                }
                if (objoperator.value === 'goto') {
                    if (param1 === undefined) {
                        throw new TypeError(`At line: ${objoperator.line}. Missing parameter for goto. BugReport please.`)
                    }
                    return 'JMP :' + param1.name + '\n'
                }
                if (objoperator.value === 'halt') {
                    return 'STP\n'
                }
                if (objoperator.value === 'exit') {
                    return 'FIN\n'
                }
                if (objoperator.value === 'return' || objoperator.value === 'sleep') {
                    if (param1 === undefined) {
                        if (objoperator.value === 'return') {
                            return 'RET\n'
                        }
                        throw new TypeError(`At line: ${objoperator.line}. Missing parameter for sleep. BugReport please.`)
                    }

                    let retinstr = ''
                    const TmpMemObj = moldMemory(param1, objoperator.line)
                    retinstr += TmpMemObj.instructionset

                    if (objoperator.value === 'return') {
                        retinstr += 'PSH $' + TmpMemObj.MoldedObj.asmName + '\n'
                        retinstr += 'RET\n'
                    } else if (objoperator.value === 'sleep') {
                        retinstr += 'SLP $' + TmpMemObj.MoldedObj.asmName + '\n'
                    }

                    auxVars.freeRegister(param1.address)
                    if (TmpMemObj.isNew === true) {
                        auxVars.freeRegister(TmpMemObj.MoldedObj.address)
                    }
                    return retinstr
                }
                if (objoperator.value === 'asm') {
                    if (objoperator.extValue === undefined) {
                        throw new TypeError(`At line: ${objoperator.line}. Missing extValue for asm. BugReport please.`)
                    }

                    let lines = objoperator.extValue.split('\n')
                    lines = lines.map(value => value.trim())
                    return lines.join('\n').trim() + '\n'
                }
            }
            throw new TypeError('At line: ' + objoperator.line + '. ' + objoperator.type + ' not supported')
        }
    }

    function writeAsmLine (lineContent: string) {
        generateUtils.assemblyCode += lineContent + '\n'
    }
    function writeAsmCode (lines: string) {
        generateUtils.assemblyCode += lines
    }

    /** Add content of macro 'program' information to assembly code */
    function configDeclarationGenerator () {
        if (Program.Config.PName !== '') {
            writeAsmLine(`^program name ${Program.Config.PName}`)
        }
        if (Program.Config.PDescription !== '') {
            writeAsmLine(`^program description ${Program.Config.PDescription}`)
        }
        if (Program.Config.PActivationAmount !== '') {
            writeAsmLine('^program activationAmount ' + Program.Config.PActivationAmount)
        }
    }

    /** Handles variables declarations to assembly code. */
    function assemblerDeclarationGenerator (MemObj: MEMORY_SLOT) {
        if (MemObj.address !== -1) {
            writeAsmLine(`^declare ${MemObj.asmName}`)
            if (MemObj.hexContent !== undefined) {
                writeAsmLine(`^const SET @${MemObj.asmName} #${MemObj.hexContent}`)
            }
        }
    }

    /**
     * Search and return a copy of memory object with name varname.
     * Object can be global or local function scope.
     * if not found, throws exception with line number.
     */
    function getMemoryObjectByName (varName: string, line: number = -1, varDeclaration: DECLARATION_TYPES = ''): MEMORY_SLOT {
        let search: MEMORY_SLOT | undefined
        if (generateUtils.currFunctionIndex !== -1) { // find function scope variable
            search = Program.memory.find(obj => obj.name === varName && obj.scope === Program.functions[generateUtils.currFunctionIndex].name)
        }
        if (search === undefined) {
            // do a global scope search
            search = Program.memory.find(obj => obj.name === varName && obj.scope === '')
        }

        // Checks to allow use:
        if (varDeclaration !== '') { // we are in declarations sentence
            if (search === undefined) {
                throw new SyntaxError(`At line: ${line}. Variable '${varName}' not declared. BugReport Please.`)
            }
            search.isDeclared = true
            return JSON.parse(JSON.stringify(search))
        }
        // else, not in declaration:
        if (search === undefined) {
            // maybe this is a label. Check! Labels always global
            const labelSearch = Program.labels.find(obj => obj === varName)
            if (labelSearch === undefined) {
                throw new SyntaxError(`At line: ${line}. Using variable '${varName}' before declaration.`)
            }
            // return label fakevar
            return {
                type: 'label',
                isDeclared: true,
                declaration: '',
                address: -1,
                name: varName,
                scope: '',
                size: 0
            }
        }

        return JSON.parse(JSON.stringify(search))
    }

    /**
     * Search and return a copy of memory object in addres 'loc'.
     * Object can be global or local function scope.
     * if not found, throws exception with line number.
     */
    function getMemoryObjectByLocation (loc: number|string, line: number = -1): MEMORY_SLOT {
        let addr:number

        if (typeof (loc) === 'number') {
            addr = loc
        } else if (typeof (loc) === 'string') {
            addr = parseInt(loc, 16)
        } else throw new TypeError(`At line: ${line}. Wrong type in getMemoryObjectByLocation.`)

        const search = Program.memory.find(obj => obj.address === addr)
        if (search === undefined) {
            throw new SyntaxError(`At line: ${line}. No variable found at address '0x${addr}'.`)
        }
        return JSON.parse(JSON.stringify(search))
    }

    /**
     *  Handle function initialization
    */
    function functionHeaderGenerator () {
        const fname = Program.functions[generateUtils.currFunctionIndex].name
        if (fname === 'main') {
            writeAsmLine(`__fn_${fname}:`)
            writeAsmLine('PCS')
            return
        }
        writeAsmLine(`__fn_${fname}:`)
        Program.functions[generateUtils.currFunctionIndex].argsMemObj.forEach(Obj => {
            writeAsmLine(`POP @${Obj.asmName}`)
        })
    }

    /**
     * Handle function end
     */
    function functionTailGenerator () {
        const fname = Program.functions[generateUtils.currFunctionIndex].name
        if (fname === 'main') {
            if (generateUtils.assemblyCode.lastIndexOf('FIN') + 4 !== generateUtils.assemblyCode.length) {
                writeAsmLine('FIN')
            }
            return
        }
        if (generateUtils.assemblyCode.lastIndexOf('RET') + 4 !== generateUtils.assemblyCode.length) {
            if (Program.functions[generateUtils.currFunctionIndex].declaration === 'void') {
                writeAsmLine('RET')
            } else { // return zero to prevent stack overflow
                writeAsmLine('CLR @r0')
                writeAsmLine('PSH $r0')
                writeAsmLine('RET')
            }
        }
    }

    /** Hot stuff!!! Assemble sentences!! */
    function compileSentence (Sentence: SENTENCES) {
        let sentenceID:string

        switch (Sentence.type) {
        case 'phrase':
            writeAsmCode(codeGenerator(Sentence.CodeAST))
            break
        case 'ifEndif':
            sentenceID = '__if' + generateUtils.getNewJumpID(Sentence.line)
            writeAsmCode(codeGenerator(Sentence.ConditionAST, sentenceID + '_endif', sentenceID + '_start'))
            writeAsmLine(sentenceID + '_start:')
            Sentence.trueBlock.forEach(compileSentence)
            writeAsmLine(sentenceID + '_endif:')
            break
        case 'ifElse':
            sentenceID = '__if' + generateUtils.getNewJumpID(Sentence.line)
            writeAsmCode(codeGenerator(Sentence.ConditionAST, sentenceID + '_else', sentenceID + '_start'))
            writeAsmLine(sentenceID + '_start:')
            Sentence.trueBlock.forEach(compileSentence)
            writeAsmLine('JMP :' + sentenceID + '_endif')
            writeAsmLine(sentenceID + '_else:')
            Sentence.falseBlock.forEach(compileSentence)
            writeAsmLine(sentenceID + '_endif:')
            break
        case 'while':
            sentenceID = '__loop' + generateUtils.getNewJumpID(Sentence.line)
            writeAsmLine(sentenceID + '_continue:')
            writeAsmCode(codeGenerator(Sentence.ConditionAST, sentenceID + '_break', sentenceID + '_start'))
            writeAsmLine(sentenceID + '_start:')
            generateUtils.latestLoopId.push(sentenceID)
            Sentence.trueBlock.forEach(compileSentence)
            generateUtils.latestLoopId.pop()
            writeAsmLine('JMP :' + sentenceID + '_continue')
            writeAsmLine(sentenceID + '_break:')
            break
        case 'do':
            sentenceID = '__loop' + generateUtils.getNewJumpID(Sentence.line)
            writeAsmLine(sentenceID + '_continue:')
            generateUtils.latestLoopId.push(sentenceID)
            Sentence.trueBlock.forEach(compileSentence)
            generateUtils.latestLoopId.pop()
            writeAsmCode(codeGenerator(Sentence.ConditionAST, sentenceID + '_break', sentenceID + '_continue', true))
            writeAsmLine(sentenceID + '_break:')
            break
        case 'for':
            sentenceID = '__loop' + generateUtils.getNewJumpID(Sentence.line)
            writeAsmCode(codeGenerator(Sentence.threeSentences[0].CodeAST))
            writeAsmLine(sentenceID + '_condition:')
            writeAsmCode(codeGenerator(Sentence.threeSentences[1].CodeAST, sentenceID + '_break', sentenceID + '_start'))
            writeAsmLine(sentenceID + '_start:')
            generateUtils.latestLoopId.push(sentenceID)
            Sentence.trueBlock.forEach(compileSentence)
            generateUtils.latestLoopId.pop()
            writeAsmLine(sentenceID + '_continue:')
            writeAsmCode(codeGenerator(Sentence.threeSentences[2].CodeAST))
            writeAsmLine('JMP :' + sentenceID + '_condition')
            writeAsmLine(sentenceID + '_break:')
            break
        case 'struct':
            // Nothing to do here
        }
    }

    return generateMain()
}
