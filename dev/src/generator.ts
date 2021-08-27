// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

/* global TOKEN_MODIFIER CONTRACT SENTENCES optimize MEMORY_SLOT DECLARATION_TYPES AST utils ARRAY_TYPE_DEFINITION
STRUCT_TYPE_DEFINITION */
/* eslint-disable camelcase */

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
        latest_loop_id: string[]
        /** Auto incrementing index for labels generation */
        jump_id: number
        /** Assembly code being created */
        assemblyCode: string
        /** Current function being processed */
        current_function: number
        getNewJumpID(currLine: number): string
        getLatestLoopId(): string
    } = {
        latest_loop_id: [],
        jump_id: 0,
        assemblyCode: '',
        current_function: -1,
        getNewJumpID: function (line: number) {
            let id = ''
            if (Program.Config.enableLineLabels) {
                id += line + '_'
            }
            if (Program.Config.enableRandom === true) {
                return id + Math.random().toString(36).substr(2, 5)
            }

            this.jump_id++
            return id + this.jump_id.toString(36)
        },
        getLatestLoopId: function () {
            // error check must be in code!
            return this.latest_loop_id[this.latest_loop_id.length - 1]
        }
    }

    // main function for bigastCompile method, only run once.
    function generateMain () {
        // add Config Info
        configDeclarationGenerator()

        // add variables declaration
        if (Program.Config.useVariableDeclaration) {
            Program.memory.forEach(assemblerDeclarationGenerator)
            writeAsmLine('') // blank line to be nice to debugger!
        }

        // Add code for global sentences
        generateUtils.current_function = -1
        Program.Global.sentences.forEach(compileSentence)

        // jump to main function, or program ends.
        if (Program.functions.find(obj => obj.name === 'main') === undefined) {
            writeAsmLine('FIN')
        } else {
            writeAsmLine('JMP :__fn_main')
        }

        // For every function:
        Program.functions.forEach((currentFunction, index) => {
            generateUtils.current_function = index
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
    * @param cg_ast AST to be compiled
    * @param cg_jumpTarget must be set if the evaluation is part of conditionals or
    * loops. It shall be the location where to jump if the evaluated
    * expression is false.
    * @param cg_jumpNotTarget It is the jump location for complementary logic.
    * @param cg_revLogic to use reverse logic for expression evaluation.
    * @returns Assembly source code
    */
    function codeGenerator (cg_ast: AST, cg_jumpTarget?: string, cg_jumpNotTarget?:string, cg_revLogic?: boolean) {
        const auxVars: {
            tmpvars: string[]
            status: boolean[]
            postOperations: string
            funcArgs: []
            declaring: DECLARATION_TYPES
            pointer_codecave: boolean
            left_side_of_assignment: boolean
            const_sentence: boolean
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
            pointer_codecave: false,
            left_side_of_assignment: false,
            const_sentence: false,

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

        interface GENCODE_RETURN_MEMORY extends MEMORY_SLOT {
            offset_type?: 'constant' | 'variable'
            offset_value?: string
        }
        interface GENCODE_RETURN_OBJECT {
            MemObj: GENCODE_RETURN_MEMORY
            instructionset: string
        }

        auxVars.createTmpVarsTable()

        let code: GENCODE_RETURN_OBJECT

        if (cg_revLogic === undefined) {
            cg_revLogic = false
        }

        if (cg_jumpTarget === undefined) {
            code = genCode(cg_ast, false, cg_revLogic, cg_jumpTarget, cg_jumpNotTarget)
            if (code.MemObj.type !== 'void' && auxVars.isTemp(code.MemObj.address) && code.MemObj.type.indexOf('_ptr') === -1) {
                if (cg_ast.Operation === undefined || cg_ast.Operation.type !== 'Function') {
                    let line
                    if (cg_ast.line !== undefined) {
                        line = cg_ast.line
                    } else if (cg_ast.Operation.line !== undefined) {
                        line = cg_ast.Operation.line
                    }
                    if (Program.Config.warningToError) {
                        throw new TypeError('At line: ' + line + '. Warning: sentence returned a value that is not being used.')
                    }
                }
            }
        } else {
            code = genCode(cg_ast, true, cg_revLogic, cg_jumpTarget, cg_jumpNotTarget)
        }

        code.instructionset += auxVars.postOperations

        // optimizations for jumps and labels
        if (code.instructionset.indexOf(':') >= 0) {
            if (cg_ast.type === 'endASN') {
                if (cg_ast.Token.type === 'Keyword' && cg_ast.Token.value === 'label') {
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
         * @param gc_revLogic true if wanted to reverse logic for logical operations
         * @param gc_jumpFalse Label to jump if logical operation is false
         * @param gc_jumpTrue Label to jump if logical operatio is true
         * @returns Object with currently variable returned and the string with assembly code for the remaining AST evaluated
         */
        function genCode (objTree: AST, logicalOp: boolean, gc_revLogic: boolean, gc_jumpFalse?: string, gc_jumpTrue?: string): GENCODE_RETURN_OBJECT {
            let M_Obj: GENCODE_RETURN_MEMORY
            let instructionstrain = ''
            let array_idx = -1

            switch (objTree.type) {
            case 'endASN':
                if (objTree.Token === undefined) {
                    return { MemObj: utils.createVoidMemObj(), instructionset: '' }
                }

                if (logicalOp === true) {
                    if (objTree.Token.type === 'Constant') {
                        if (gc_revLogic === false) {
                            if (objTree.Token.value === '0000000000000000') {
                                return { MemObj: utils.createVoidMemObj(), instructionset: createInstruction({ type: 'Jump' }, gc_jumpFalse) }
                            }
                            return { MemObj: utils.createVoidMemObj(), instructionset: '' }
                        }
                        if (objTree.Token.value !== '0000000000000000') {
                            return { MemObj: utils.createVoidMemObj(), instructionset: createInstruction({ type: 'Jump' }, gc_jumpTrue) }
                        }
                        return { MemObj: utils.createVoidMemObj(), instructionset: '' }
                    }
                    if (objTree.Token.type === 'Variable') {
                        const LGenObj = genCode(objTree, false, gc_revLogic)
                        instructionstrain += LGenObj.instructionset
                        instructionstrain += createInstruction(utils.genNotEqualToken(), LGenObj.MemObj, utils.createConstantMemObj(0), gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                        auxVars.freeRegister(LGenObj.MemObj.address)
                        return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                    }
                    throw new TypeError('At line: ' + objTree.Token.line + ". Object type '" + objTree.Token.type + ' at logical operation... Do not know what to do.')
                } else {
                    if (objTree.Token.type === 'Variable') {
                        M_Obj = getMemoryObjectByName(objTree.Token.value, objTree.Token.line, auxVars.declaring)
                        if (Program.Config.useVariableDeclaration === false) {
                            if (auxVars.pointer_codecave) {
                                M_Obj.type += '_ptr'
                            }
                        }
                        return { MemObj: M_Obj, instructionset: instructionstrain }
                    }

                    if (objTree.Token.type === 'Keyword') {
                        if (objTree.Token.value === 'break' || objTree.Token.value === 'continue' ||
                            objTree.Token.value === 'label' || objTree.Token.value === 'asm' ||
                            objTree.Token.value === 'exit' || objTree.Token.value === 'halt') {
                            return { MemObj: utils.createVoidMemObj(), instructionset: createInstruction(objTree.Token) }
                        }

                        if (objTree.Token.value === 'return') { // this is 'return;'
                            if (generateUtils.current_function === -1) {
                                throw new TypeError('At line: ' + objTree.Token.line + ". Can not use 'return' in global statements.")
                            }
                            if (Program.functions[generateUtils.current_function].declaration !== 'void') {
                                throw new TypeError('At line: ' + objTree.Token.line + ". Function '" +
                                       Program.functions[generateUtils.current_function].name + "' must return a '" +
                                       Program.functions[generateUtils.current_function].declaration + "' value.")
                            }
                            if (Program.functions[generateUtils.current_function].name === 'main') {
                                return { MemObj: utils.createVoidMemObj(), instructionset: createInstruction({ type: 'Keyword', value: 'exit' }) }
                            }
                            return { MemObj: utils.createVoidMemObj(), instructionset: createInstruction(objTree.Token) }
                        }

                        throw new TypeError('At line: ' + objTree.Token.line + ". Keywords '" + objTree.Token.value + "' not implemented.")
                    }

                    if (objTree.Token.type === 'Constant') { // ok
                        M_Obj = utils.createConstantMemObj()
                        M_Obj.size = objTree.Token.value.length / 16
                        M_Obj.hexContent = objTree.Token.value
                        if (auxVars.pointer_codecave === true) {
                            M_Obj.type += '_ptr'
                        }
                        return { MemObj: M_Obj, instructionset: '' }
                    }
                    throw new TypeError('At line:' + objTree.Token.line + '. End object not implemented: ' + objTree.Token.type + ' ' + objTree.Token)
                    // return { instructionset: "" };
                }

            case 'lookupASN':
                if (objTree.Token.type !== 'Variable') {
                    throw new TypeError(`At line: ${objTree.Token.line}. Modifiers implemented only for variables`)
                }
                M_Obj = getMemoryObjectByName(objTree.Token.value, objTree.Token.line, auxVars.declaring)

                objTree.modifiers.forEach(CurrentModifier => {
                    if (CurrentModifier.type === 'MemberByRef') {
                        const TypeD = Program.typesDefinitions.find(obj => obj.type === 'struct' && obj.name === M_Obj.typeDefinition) as STRUCT_TYPE_DEFINITION
                        if (TypeD === undefined) {
                            throw new TypeError(`At line: ${objTree.Token.line}. Array type definition not found...`)
                        }
                        if (CurrentModifier.Center.type !== 'Variable') {
                            throw new TypeError(`At line: ${objTree.Token.line}. Can not use variables as struct members.`)
                        }
                        if (M_Obj.declaration !== 'struct_ptr') {
                            throw new TypeError(`At line: ${objTree.Token.line}. Variable '${M_Obj.name}' not defined as struct pointer.`)
                        }
                        const member_name = CurrentModifier.Center.value
                        let member_id = -1
                        for (let i = 0; i < TypeD.structAccumulatedSize.length; i++) {
                            if (TypeD.structAccumulatedSize[i][0] === member_name) {
                                member_id = i
                                break
                            }
                        }
                        if (member_id === -1) {
                            throw new TypeError(`At line: ${objTree.Token.line}. Member '${member_name}' not found on struct type definition.`)
                        }

                        if (M_Obj.offset_type === undefined) {
                            let adder = 0
                            if (TypeD.structMembers[member_id].type === 'array') {
                                adder = 1
                            }
                            M_Obj.declaration = TypeD.structMembers[member_id].declaration
                            M_Obj.name = TypeD.structMembers[member_id].name
                            M_Obj.typeDefinition = TypeD.structMembers[member_id].typeDefinition
                            if (TypeD.structMembers[member_id].type === 'array') {
                                M_Obj.type = TypeD.structMembers[member_id].type
                            }
                            array_idx = -1
                            M_Obj.offset_type = 'constant'
                            M_Obj.offset_value = utils.addHexContents(adder, TypeD.structAccumulatedSize[member_id][1])
                        } else if (M_Obj.offset_type === 'constant') {
                            throw new TypeError(`At line: ${objTree.Token.line}. Inspection needed.`)
                        } else /* if (M_Obj.offset_type === "variable") */ {
                            throw new TypeError(`At line: ${objTree.Token.line}. Inspection needed.`)
                        }
                    }

                    if (CurrentModifier.type === 'MemberByVal') {
                        let TypeD: STRUCT_TYPE_DEFINITION | undefined
                        if (M_Obj.arrayItemType === 'struct') { // array of struct
                            TypeD = Program.typesDefinitions.find(obj => obj.type === 'struct' && obj.name === M_Obj.arrayItemTypeDefinition) as STRUCT_TYPE_DEFINITION
                        } else { // regular case
                            TypeD = Program.typesDefinitions.find(obj => obj.type === 'struct' && obj.name === M_Obj.typeDefinition) as STRUCT_TYPE_DEFINITION
                        }
                        if (TypeD === undefined) {
                            throw new TypeError(`At line: ${objTree.Token.line}. Array type definition not found...`)
                        }
                        if (CurrentModifier.Center.type !== 'Variable') {
                            throw new TypeError(`At line: ${objTree.Token.line}. Can not use variables as struct members.`)
                        }
                        if (M_Obj.declaration === 'struct_ptr') {
                            throw new TypeError(`At line: ${objTree.Token.line}. Using wrong member notation. Try to use '->' instead.`)
                        }
                        const member_name = CurrentModifier.Center.value
                        let member_id = -1
                        for (let i = 0; i < TypeD.structAccumulatedSize.length; i++) {
                            if (TypeD.structAccumulatedSize[i][0] === member_name) {
                                member_id = i
                                break
                            }
                        }
                        if (member_id === -1) {
                            throw new TypeError(`At line: ${objTree.Token.line}. Member '${member_name}' not found on struct type definition.`)
                        }

                        if (M_Obj.offset_type === undefined) {
                            M_Obj = getMemoryObjectByLocation(utils.addHexContents(M_Obj.hexContent, TypeD.structAccumulatedSize[member_id][1]))
                            array_idx = -1
                        } else if (M_Obj.offset_type === 'constant') {
                            const adder = utils.addHexContents(M_Obj.offset_value, M_Obj.hexContent)
                            M_Obj = getMemoryObjectByLocation(utils.addHexContents(adder, TypeD.structAccumulatedSize[member_id][1]))
                            array_idx = -1
                        } else /* if (M_Obj.offset_type === "variable") */ {
                            let adder = 0
                            if (TypeD.structMembers[member_id].type === 'array') {
                                adder = 1
                            }
                            instructionstrain += createInstruction(utils.genAddToken(objTree.Token.line),
                                getMemoryObjectByLocation(M_Obj.offset_value, objTree.Token.line),
                                utils.createConstantMemObj(utils.addHexContents(adder, TypeD.structAccumulatedSize[member_id][1])))
                            M_Obj.declaration = TypeD.structMembers[member_id].declaration
                            M_Obj.name = TypeD.structMembers[member_id].name
                            M_Obj.typeDefinition = TypeD.structMembers[member_id].typeDefinition
                            array_idx = -1
                        }
                    }

                    if (CurrentModifier.type === 'Array') {
                        if (Program.Config.useVariableDeclaration === false) {
                            throw new TypeError(`At line: ${objTree.Token.line}. Can not use arrays if 'useVariableDefinition' is 'false'.`)
                        }
                        array_idx++
                        let TmpMemObj: MEMORY_SLOT
                        let pointer_operation = false
                        let TypeD: ARRAY_TYPE_DEFINITION // = Program.typesDefinitions.find( obj => obj.type==="array" && obj.name===objTree.Token.value );
                        if (M_Obj.typeDefinition === undefined) { // array of structs
                            TypeD = Program.typesDefinitions.find(obj => obj.type === 'array' && obj.name === M_Obj.name) as ARRAY_TYPE_DEFINITION
                        } else if (objTree.Token.value === M_Obj.name) { // array simple
                            TypeD = Program.typesDefinitions.find(obj => obj.type === 'array' && obj.name === M_Obj.typeDefinition) as ARRAY_TYPE_DEFINITION
                        } else { // array inside struct
                            TypeD = Program.typesDefinitions.find(obj => obj.type === 'array' && obj.name.indexOf('_' + M_Obj.typeDefinition) > 0) as ARRAY_TYPE_DEFINITION
                        }
                        if (TypeD === undefined) {
                            if (M_Obj.declaration.indexOf('_ptr') === -1) {
                                throw new TypeError(`At line: ${objTree.Token.line}. Array type definition not found. Is '" + M_Obj.name + "' declared as array or pointer?`)
                            }
                            pointer_operation = true // allow use of array notation on pointer variables.
                        }
                        if (M_Obj.type !== 'array' && M_Obj.type !== 'struct' && M_Obj.offset_type !== undefined) {
                            throw new TypeError(`At line: ${objTree.Token.line}. Can not use array notation on regular variables.`)
                        }

                        // allow some paranauê
                        const oldLeftState = auxVars.left_side_of_assignment
                        auxVars.left_side_of_assignment = false

                        const Param_Obj = genCode(CurrentModifier.Center, false, false) // gc_revLogic, gc_jumpFalse, gc_jumpTrue);
                        instructionstrain += Param_Obj.instructionset

                        // undo paranauê
                        auxVars.left_side_of_assignment = oldLeftState

                        if (M_Obj.declaration.indexOf('_ptr') > 0) {
                            M_Obj.declaration = M_Obj.declaration.slice(0, -4) as DECLARATION_TYPES
                        }

                        if (Param_Obj.MemObj.type === 'void') { // special case for text assignment
                            return { MemObj: M_Obj, instructionset: instructionstrain }
                        }
                        // big decision tree depending on M_Obj.offset_value and Param_Obj.address
                        let mobj_offvalue = M_Obj.offset_value // undefined if does not exist, "constant", or variable address that can be temp or not (will be checked!)
                        if (typeof (M_Obj.offset_value) === 'string') {
                            mobj_offvalue = -1 // only if offset_type is constant
                        }
                        const param_loc = Param_Obj.MemObj.address // -1 if it is constant, other value represents a variable that can be temp or not (will be checked!)

                        if (mobj_offvalue === undefined) {
                            if (param_loc === -1) {
                                if (pointer_operation) {
                                    TmpMemObj = auxVars.getNewRegister()
                                    instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, Param_Obj.MemObj)
                                    M_Obj.type = 'array'
                                    M_Obj.offset_type = 'variable'
                                    M_Obj.offset_value = TmpMemObj.address
                                } else {
                                    M_Obj.offset_type = 'constant'
                                    M_Obj.offset_value = utils.mulHexContents(Param_Obj.MemObj.hexContent, TypeD.arrayMultiplierDim[array_idx])
                                }
                            } else if (auxVars.isTemp(param_loc)) {
                                if (pointer_operation) {
                                    M_Obj.type = 'array'
                                } else {
                                    instructionstrain += createInstruction(utils.genMulToken(objTree.Token.line), Param_Obj.MemObj, utils.createConstantMemObj(TypeD.arrayMultiplierDim[array_idx]))
                                }
                                M_Obj.offset_type = 'variable'
                                M_Obj.offset_value = Param_Obj.MemObj.address
                            } else /* if ( param_loc is variable ) */ {
                                M_Obj.offset_type = 'variable'
                                if (pointer_operation || TypeD.arrayMultiplierDim[array_idx] === 1) {
                                    if (pointer_operation) {
                                        M_Obj.type = 'array'
                                    }
                                    M_Obj.offset_value = Param_Obj.MemObj.address
                                } else {
                                    TmpMemObj = auxVars.getNewRegister()
                                    instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, Param_Obj.MemObj)
                                    M_Obj.offset_value = TmpMemObj.address
                                    instructionstrain += createInstruction(utils.genMulToken(objTree.Token.line), TmpMemObj, utils.createConstantMemObj(TypeD.arrayMultiplierDim[array_idx]))
                                }
                            }
                        } else if (mobj_offvalue === -1) {
                            if (param_loc === -1) {
                                M_Obj.offset_value = utils.addHexContents(M_Obj.offset_value, utils.mulHexContents(Param_Obj.MemObj.hexContent, TypeD.arrayMultiplierDim[array_idx]))
                            } else if (auxVars.isTemp(param_loc)) {
                                instructionstrain += createInstruction(utils.genMulToken(objTree.Token.line), Param_Obj.MemObj, utils.createConstantMemObj(TypeD.arrayMultiplierDim[array_idx]))
                                instructionstrain += createInstruction(utils.genAddToken(objTree.Token.line), Param_Obj.MemObj, utils.createConstantMemObj(M_Obj.offset_value))
                                M_Obj.offset_type = 'variable'
                                M_Obj.offset_value = Param_Obj.MemObj.address
                            } else /* if ( param_loc is variable  ) */ {
                                if (TypeD.arrayMultiplierDim[array_idx] === 1 && M_Obj.offset_value === '0000000000000000') {
                                    M_Obj.offset_type = 'variable'
                                    M_Obj.offset_value = Param_Obj.MemObj.address
                                } else {
                                    TmpMemObj = auxVars.getNewRegister()
                                    instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, Param_Obj.MemObj)
                                    instructionstrain += createInstruction(utils.genMulToken(objTree.Token.line), TmpMemObj, utils.createConstantMemObj(TypeD.arrayMultiplierDim[array_idx]))
                                    instructionstrain += createInstruction(utils.genAddToken(objTree.Token.line), TmpMemObj, utils.createConstantMemObj(M_Obj.offset_value))
                                    M_Obj.offset_type = 'variable'
                                    M_Obj.offset_value = TmpMemObj.address
                                }
                            }
                        } else if (auxVars.isTemp(mobj_offvalue)) {
                            if (param_loc === -1) {
                                const adder = utils.mulHexContents(Param_Obj.MemObj.hexContent, TypeD.arrayMultiplierDim[array_idx])
                                instructionstrain += createInstruction(utils.genAddToken(objTree.Token.line), getMemoryObjectByLocation(M_Obj.offset_value, objTree.Token.line), utils.createConstantMemObj(adder))
                            } else if (auxVars.isTemp(param_loc)) {
                                instructionstrain += createInstruction(utils.genMulToken(objTree.Token.line), Param_Obj.MemObj, utils.createConstantMemObj(TypeD.arrayMultiplierDim[array_idx]))
                                instructionstrain += createInstruction(utils.genAddToken(objTree.Token.line), getMemoryObjectByLocation(M_Obj.offset_value, objTree.Token.line), Param_Obj.MemObj)
                                auxVars.freeRegister(Param_Obj.MemObj.address)
                            } else /* if (param_loc is variable ) */ {
                                if (TypeD.arrayMultiplierDim[array_idx] === 1) {
                                    instructionstrain += createInstruction(utils.genAddToken(objTree.Token.line), getMemoryObjectByLocation(M_Obj.offset_value, objTree.Token.line), Param_Obj.MemObj)
                                } else {
                                    TmpMemObj = auxVars.getNewRegister()
                                    instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, Param_Obj.MemObj)
                                    instructionstrain += createInstruction(utils.genMulToken(objTree.Token.line), TmpMemObj, utils.createConstantMemObj(TypeD.arrayMultiplierDim[array_idx]))
                                    instructionstrain += createInstruction(utils.genAddToken(objTree.Token.line), getMemoryObjectByLocation(M_Obj.offset_value, objTree.Token.line), TmpMemObj)
                                    auxVars.freeRegister(TmpMemObj.address)
                                }
                            }
                        } else /* if ( mobj_offvalue is variable ) */ {
                            if (param_loc === -1) {
                                if (Param_Obj.MemObj.hexContent !== '0000000000000000') {
                                    TmpMemObj = auxVars.getNewRegister()
                                    instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(Param_Obj.MemObj.hexContent))
                                    if (!pointer_operation) {
                                        instructionstrain += createInstruction(utils.genMulToken(objTree.Token.line), TmpMemObj, utils.createConstantMemObj(TypeD.arrayMultiplierDim[array_idx]))
                                    }
                                    instructionstrain += createInstruction(utils.genAddToken(objTree.Token.line), TmpMemObj, getMemoryObjectByLocation(M_Obj.offset_value, objTree.Token.line))
                                    M_Obj.offset_value = TmpMemObj.address
                                }
                            } else if (auxVars.isTemp(param_loc)) {
                                if (!pointer_operation) {
                                    instructionstrain += createInstruction(utils.genMulToken(objTree.Token.line), Param_Obj.MemObj, utils.createConstantMemObj(TypeD.arrayMultiplierDim[array_idx]))
                                }
                                instructionstrain += createInstruction(utils.genAddToken(objTree.Token.line), Param_Obj.MemObj, getMemoryObjectByLocation(M_Obj.offset_value, objTree.Token.line))
                                M_Obj.offset_value = Param_Obj.MemObj.address
                            } else /* if (param_loc is variable )) */ {
                                TmpMemObj = auxVars.getNewRegister()
                                instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, Param_Obj.MemObj)
                                if (!pointer_operation) {
                                    instructionstrain += createInstruction(utils.genMulToken(objTree.Token.line), TmpMemObj, utils.createConstantMemObj(TypeD.arrayMultiplierDim[array_idx]))
                                }
                                instructionstrain += createInstruction(utils.genAddToken(objTree.Token.line), TmpMemObj, getMemoryObjectByLocation(M_Obj.offset_value, objTree.Token.line))
                                M_Obj.offset_value = TmpMemObj.address
                            }
                        }
                    }
                })

                // Fix special case where struct pointer with array member with constant index has incomplete information.
                // This does not allow constants on struct: code Yyx_sSkA
                if (M_Obj.hexContent === undefined && M_Obj.offset_type === 'constant') {
                    const TmpMemObj = auxVars.getNewRegister()
                    instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(M_Obj.offset_value))
                    M_Obj.offset_type = 'variable'
                    M_Obj.offset_value = TmpMemObj.address
                }

                if (logicalOp === true) {
                    instructionstrain += createInstruction(utils.genNotEqualToken(), M_Obj, utils.createConstantMemObj(0), gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                    auxVars.freeRegister(M_Obj.offset_value)
                    auxVars.freeRegister(M_Obj.address)
                    return { instructionset: instructionstrain }
                }

                return { MemObj: M_Obj, instructionset: instructionstrain }

            case 'unaryASN':
                if (objTree.Operation.type === 'UnaryOperator') {
                    if (objTree.Operation.value === '!') { // logical NOT
                        if (logicalOp === true) {
                            return genCode(objTree.Center, true, !gc_revLogic, gc_jumpTrue, gc_jumpFalse)
                        } else {
                            const rnd = generateUtils.getNewJumpID(objTree.Operation.line)

                            const IDNotSF = '__NOT_' + rnd + '_sF'// set false
                            const IDNotST = '__NOT_' + rnd + '_sT'// set true
                            const IDEnd = '__NOT_' + rnd + '_end'

                            const CGenObj = genCode(objTree.Center, true, !gc_revLogic, IDNotST, IDNotSF)
                            instructionstrain += CGenObj.instructionset

                            if (auxVars.isTemp(CGenObj.MemObj.address)) { // maybe it was an arithmetic operation
                                instructionstrain += createInstruction(utils.genNotEqualToken(), CGenObj.MemObj, utils.createConstantMemObj(0), !gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                            }

                            const TmpMemObj = auxVars.getNewRegister()
                            instructionstrain += createInstruction({ type: 'Label' }, IDNotST)
                            instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(1))
                            instructionstrain += createInstruction({ type: 'Jump' }, IDEnd)
                            instructionstrain += createInstruction({ type: 'Label' }, IDNotSF)
                            instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(0))
                            instructionstrain += createInstruction({ type: 'Label' }, IDEnd)

                            auxVars.freeRegister(CGenObj.MemObj.address)
                            
                            return { MemObj: TmpMemObj, instructionset: instructionstrain }
                        }
                    }

                    if (objTree.Operation.value === '+') { // unary plus -> do nothing
                        if (auxVars.left_side_of_assignment === true) {
                            throw new TypeError('At line: ' + objTree.Operation.line + ". Can not have unary operator '+' on left side of assignment.")
                        }
                        return genCode(objTree.Center, logicalOp, gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                    }

                    if (objTree.Operation.value === '*') { // unary star -> pointer operation
                        if (auxVars.declaring.length !== 0) {
                            // do not do any other operation when declaring a pointer.
                            return genCode(objTree.Center, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                        }

                        const CGenObj = genCode(objTree.Center, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                        instructionstrain += CGenObj.instructionset

                        if (logicalOp === true) {
                            CGenObj.MemObj.type += '_ptr'
                            instructionstrain += createInstruction(utils.genNotEqualToken(), CGenObj.MemObj, utils.createConstantMemObj(0), gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                            auxVars.freeRegister(CGenObj.MemObj.address)
                            return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                        }

                        if (Program.Config.useVariableDeclaration) {
                            if (CGenObj.MemObj.declaration.lastIndexOf('_ptr') !== CGenObj.MemObj.declaration.length - 4) {
                                if (!auxVars.isTemp(CGenObj.MemObj.address)) { // do not care about temp variables
                                    if (Program.Config.warningToError) {
                                        throw new TypeError('At line: ' + objTree.Operation.line + ". Trying to read content of Variable '" + objTree.Center.Token.value + "' that is not declared as pointer.")
                                    }
                                }
                            } else {
                                CGenObj.MemObj.declaration = CGenObj.MemObj.declaration.slice(0, -4)
                            }
                        }
                        CGenObj.MemObj.type += '_ptr'

                        if (!auxVars.left_side_of_assignment) {
                            const TmpMemObj = auxVars.getNewRegister()
                            instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, CGenObj.MemObj)
                            auxVars.freeRegister(CGenObj.MemObj.address)
                            return { MemObj: TmpMemObj, instructionset: instructionstrain }
                        } else {
                            return { MemObj: CGenObj.MemObj, instructionset: instructionstrain }
                        }
                    }

                    if (objTree.Operation.value === '-') {
                        const CGenObj = genCode(objTree.Center, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                        instructionstrain += CGenObj.instructionset
                        const TmpMemObj = auxVars.getNewRegister()
                        instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(0))
                        instructionstrain += createInstruction(utils.genSubToken(objTree.line), TmpMemObj, CGenObj.MemObj)
                        auxVars.freeRegister(CGenObj.MemObj.address)

                        if (logicalOp === true) {
                            instructionstrain += createInstruction(utils.genNotEqualToken(), TmpMemObj, utils.createConstantMemObj(0), gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                            auxVars.freeRegister(TmpMemObj.address)
                            return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                        }

                        return { MemObj: TmpMemObj, instructionset: instructionstrain }
                    }

                    if (objTree.Operation.value === '~') {
                        let clear_var = false

                        const CGenObj = genCode(objTree.Center, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                        instructionstrain += CGenObj.instructionset

                        let TmpMemObj: MEMORY_SLOT
                        if (!auxVars.isTemp(CGenObj.MemObj.address)) {
                            TmpMemObj = auxVars.getNewRegister()
                            instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, CGenObj.MemObj)
                            clear_var = true
                        } else {
                            TmpMemObj = CGenObj.MemObj
                        }
                        instructionstrain += createInstruction(objTree.Operation, TmpMemObj)

                        if (logicalOp === true) {
                            instructionstrain += createInstruction(utils.genNotEqualToken(), TmpMemObj, utils.createConstantMemObj(0), gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                            auxVars.freeRegister(CGenObj.MemObj.address)
                            auxVars.freeRegister(TmpMemObj.address)
                            return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                        }

                        if (clear_var) {
                            auxVars.freeRegister(CGenObj.MemObj.address)
                        }

                        return { MemObj: TmpMemObj, instructionset: instructionstrain }
                    }

                    if (objTree.Operation.value === '&') {
                        if (cg_jumpTarget !== undefined) {
                            throw new SyntaxError('At line: ' + objTree.Operation.line + ". Can not use UnaryOperator '&' during logical operations with branches")
                        }
                        if (gc_jumpFalse !== undefined) {
                            throw new SyntaxError('At line: ' + objTree.Operation.line + ". Can not use UnaryOperator '&' during logical operations with branches")
                        }

                        const CGenObj = genCode(objTree.Center, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                        instructionstrain += CGenObj.instructionset

                        if (CGenObj.MemObj.type === 'void') {
                            throw new TypeError('At line: ' + objTree.Operation.line + '. Trying to get address of void value')
                        }
                        if (CGenObj.MemObj.type === 'register' || CGenObj.MemObj.type === 'register_ptr') {
                            if (Program.Config.warningToError) {
                                throw new TypeError('WARNING: At line: ' + objTree.Operation.line + '. Returning address of a register')
                            }
                        }
                        if (CGenObj.MemObj.type === 'constant') {
                            throw new TypeError('At line: ' + objTree.Operation.line + '. Trying to get address of a constant value')
                        }

                        let TmpMemObj
                        if (CGenObj.MemObj.type === 'array') {
                            if (CGenObj.MemObj.offset_type !== undefined) {
                                if (CGenObj.MemObj.offset_type === 'constant') {
                                    TmpMemObj = utils.createConstantMemObj(utils.addHexContents(CGenObj.MemObj.hexContent, CGenObj.MemObj.offset_value))
                                } else {
                                    const Copyvar = JSON.parse(JSON.stringify(CGenObj.MemObj))
                                    delete Copyvar.offset_type
                                    delete Copyvar.offset_value
                                    TmpMemObj = auxVars.getNewRegister()
                                    instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, Copyvar)
                                    instructionstrain += createInstruction(utils.genAddToken(), TmpMemObj, getMemoryObjectByLocation(CGenObj.MemObj.offset_value))
                                }
                            } else {
                                TmpMemObj = utils.createConstantMemObj(CGenObj.MemObj.address)
                            }
                        } else if (CGenObj.MemObj.type === 'struct') {
                            TmpMemObj = utils.createConstantMemObj(CGenObj.MemObj.hexContent)
                        } else if (CGenObj.MemObj.type === 'long' || CGenObj.MemObj.type === 'long_ptr' || CGenObj.MemObj.type === 'struct_ptr') {
                            TmpMemObj = utils.createConstantMemObj(CGenObj.MemObj.address)
                        }
                        if (Program.Config.useVariableDeclaration) {
                            TmpMemObj.declaration += '_ptr'
                        }
                        return { MemObj: TmpMemObj, instructionset: instructionstrain }
                    }

                    throw new TypeError('At line: ' + objTree.Operation.line + '. Unknow unary operator: ' + objTree.Operation.value)
                }

                if (objTree.Operation.type === 'CodeCave') {
                    return genCode(objTree.Center, logicalOp, gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                }

                if (objTree.Operation.type === 'Keyword') {
                    if (objTree.Operation.value === 'long' || objTree.Operation.value === 'void') {
                        auxVars.declaring = objTree.Operation.value
                        const ret = genCode(objTree.Center, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                        return ret
                    }

                    if (objTree.Operation.value === 'const') {
                        auxVars.const_sentence = true
                        const ret = genCode(objTree.Center, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                        return ret
                    }

                    if (objTree.Operation.value === 'return') {
                        if (generateUtils.current_function === -1) {
                            throw new TypeError('At line: ' + objTree.Operation.line + ". Can not use 'return' in global statements.")
                        }
                        const currentFunction = Program.functions[generateUtils.current_function]
                        if (currentFunction.declaration === 'void') {
                            throw new TypeError('At line: ' + objTree.Operation.line + ". Function '" +
                                   currentFunction.name + "' must return a '" +
                                   currentFunction.declaration + "' value.")
                        }
                        if (currentFunction.name === 'main') {
                            throw new TypeError('At line: ' + objTree.Operation.line + '. main() Function must return void')
                        }
                        const RGenObj = genCode(objTree.Center, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue)
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
                        const RGenObj = genCode(objTree.Center, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue)
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
                    if (cg_jumpTarget !== undefined) {
                        throw new SyntaxError('At line: ' + objTree.Operation.line + '. Can not use SetUnaryOperator (++ or --) during logical operations with branches')
                    }
                    if (gc_jumpFalse !== undefined) {
                        throw new SyntaxError('At line: ' + objTree.Operation.line + '. Can not use SetUnaryOperator (++ or --) during logical operations with branches')
                    }

                    if (auxVars.left_side_of_assignment) {
                        throw new SyntaxError(`At line: ${objTree.Operation.line}. Can not use SetUnaryOperator '${objTree.Operation.value}' on left side or assignment.`)
                    }

                    if (objTree.Left !== undefined) {
                        const LGenObj = genCode(objTree.Left, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                        instructionstrain += createInstruction(objTree.Operation, LGenObj.MemObj)
                        return { MemObj: LGenObj.MemObj, instructionset: instructionstrain }
                    } else {
                        const RGenObj = genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                        auxVars.postOperations += createInstruction(objTree.Operation, RGenObj.MemObj)
                        return { MemObj: RGenObj.MemObj, instructionset: '' }
                    }
                }
                break

            case 'binaryASN':
                if (objTree.Operation.type === 'Function') {
                    let isAPI = false
                    const APIargs: MEMORY_SLOT[] = []
                    let sub_sentences
                    let TmpMemObj: MEMORY_SLOT|undefined

                    let search = Program.functions.find(val => val.name === objTree.Left.Token.value)
                    if (search === undefined) {
                        if (Program.Config.APIFunctions) {
                            search = Program.Global.APIFunctions.find(val => val.name === objTree.Left.Token.value)
                            if (search === undefined) {
                                throw new TypeError('At line: ' + objTree.Left.Token.line + ". Function '" + objTree.Left.Token.value + "' not declared.")
                            }
                            isAPI = true
                        } else {
                            throw new TypeError('At line: ' + objTree.Left.Token.line + ". Function '" + objTree.Left.Token.value + "' not declared.")
                        }
                    }

                    if (isAPI) {
                        if (search.declaration === 'void') {
                            TmpMemObj = utils.createVoidMemObj()
                        } else {
                            TmpMemObj = auxVars.getNewRegister() // reserve tempvar for return type
                        }

                        sub_sentences = utils.splitASTOnDelimiters(objTree.Right)
                        if (sub_sentences[0].type === 'endASN' && sub_sentences[0].Token === undefined) {
                            sub_sentences.pop()
                        }
                        if (sub_sentences.length !== search.argsMemObj.length) {
                            throw new TypeError('At line: ' + objTree.Left.Token.line + ". Wrong number of arguments for function '" + search.name + "'. It must have '" + search.argsMemObj.length + "' args.")
                        }

                        sub_sentences.forEach(stnc => {
                            const RGenObj = genCode(stnc, false, false)
                            instructionstrain += RGenObj.instructionset
                            if (Program.Config.useVariableDeclaration) {
                                if (RGenObj.MemObj.declaration.indexOf('_ptr') !== -1) {
                                    if (Program.Config.warningToError) {
                                        throw new TypeError('WARNING: At line: ' + objTree.Operation.line + ". API Function parameter type is different from variable: 'long' and '" + RGenObj.MemObj.declaration + "'.")
                                    }
                                }
                            }
                            APIargs.push(RGenObj.MemObj)
                        })

                        instructionstrain += createInstruction({ type: 'APICall', value: search.asmName }, TmpMemObj, APIargs)
                        APIargs.forEach(varnm => auxVars.freeRegister(varnm.address))

                        if (search.declaration === 'void') {
                            return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                        }

                        if (TmpMemObj.type !== 'void' && logicalOp === true) { // maybe logical operation was requested
                            instructionstrain += createInstruction(utils.genNotEqualToken(), TmpMemObj, utils.createConstantMemObj(0), gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                            auxVars.freeRegister(TmpMemObj.address)
                            return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                        }

                        return { MemObj: TmpMemObj, instructionset: instructionstrain }
                    } else { // if is regular function call
                        if (generateUtils.current_function >= 0 && search.name === Program.functions[generateUtils.current_function].name) {
                            throw new TypeError('At line: ' + objTree.Left.Token.line + '. Recursive functions not allowed.')
                        }

                        // Save registers currently in use in stack. Function execution will overwrite them
                        const stack_registers = []
                        for (let i = auxVars.status.length - 1; i >= 0; i--) {
                            if (auxVars.status[i] === true) {
                                instructionstrain += createInstruction({ type: 'Push' }, getMemoryObjectByName(auxVars.tmpvars[i], objTree.Operation.line))
                                stack_registers.push(i)
                            }
                        }

                        sub_sentences = utils.splitASTOnDelimiters(objTree.Right)
                        if (sub_sentences[0].type === 'endASN' && sub_sentences[0].Token === undefined) {
                            sub_sentences.pop()
                        }
                        if (sub_sentences.length !== search.argsMemObj.length) {
                            throw new TypeError('At line: ' + objTree.Left.Token.line + ". Wrong number of arguments for function '" + search.name + "'. It must have '" + search.argsMemObj.length + "' args.")
                        }
                        for (let i = sub_sentences.length - 1; i >= 0; i--) {
                            const RGenObj = genCode(sub_sentences[i], false, false)

                            if (Program.Config.useVariableDeclaration) {
                                if (!auxVars.isTemp(RGenObj.MemObj.address)) {
                                    const fn_arg = search.argsMemObj[i]
                                    if (fn_arg.declaration !== RGenObj.MemObj.declaration) {
                                        if (fn_arg.declaration.indexOf('_ptr') === -1 || RGenObj.MemObj.declaration.indexOf('_ptr') === -1) { // skipt check if both sides are pointers
                                            if (Program.Config.warningToError) {
                                                throw new TypeError('WARNING: At line: ' + objTree.Operation.line + ". Function parameter type is different from variable: '" + fn_arg.declaration + "' and '" + RGenObj.MemObj.declaration + "'.")
                                            }
                                        }
                                    }
                                }
                            }

                            instructionstrain += RGenObj.instructionset
                            instructionstrain += createInstruction({ type: 'Push' }, RGenObj.MemObj)
                            auxVars.freeRegister(RGenObj.MemObj.address)
                        }

                        instructionstrain += createInstruction(objTree.Operation, objTree.Left.Token.value)

                        if (search.declaration !== 'void') {
                            TmpMemObj = auxVars.getNewRegister()
                            TmpMemObj.declaration = search.declaration
                            instructionstrain += createInstruction({ type: 'Pop' }, TmpMemObj)
                        } else {
                            TmpMemObj = utils.createVoidMemObj()
                        }

                        // Load registers again
                        while (stack_registers.length > 0) {
                            instructionstrain += createInstruction({ type: 'Pop' }, getMemoryObjectByName(auxVars.tmpvars[stack_registers.pop()], objTree.Operation.line))
                        }

                        if (search.declaration === 'void') {
                            return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                        }

                        if (TmpMemObj.type !== 'void' && logicalOp === true) { // maybe logical operation was requested
                            instructionstrain += createInstruction(utils.genNotEqualToken(), TmpMemObj, utils.createConstantMemObj(0), gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                            auxVars.freeRegister(TmpMemObj.address)
                            return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                        }

                        return { MemObj: TmpMemObj, instructionset: instructionstrain }
                    }
                }

                if (objTree.Operation.type === 'Comparision') {
                    if (logicalOp === false && gc_jumpFalse === undefined) { // need to transform arithmetic to logical
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
                            instructionstrain += createInstruction({ type: 'Label' }, IDCompSF)
                            instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(0))
                            instructionstrain += createInstruction({ type: 'Jump' }, IDEnd)
                            instructionstrain += createInstruction({ type: 'Label' }, IDCompST)
                            instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(1))
                            instructionstrain += createInstruction({ type: 'Label' }, IDEnd)
                        } else {
                            gc_jumpTrue = IDCompST
                            ret = genCode(objTree, true, false, IDCompSF, IDCompST) // do it again, now with jump defined
                            instructionstrain += ret.instructionset
                            TmpMemObj = auxVars.getNewRegister()
                            instructionstrain += createInstruction({ type: 'Label' }, IDCompST)
                            instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(1))
                            instructionstrain += createInstruction({ type: 'Jump' }, IDEnd)
                            instructionstrain += createInstruction({ type: 'Label' }, IDCompSF)
                            instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(0))
                            instructionstrain += createInstruction({ type: 'Label' }, IDEnd)
                        }

                        auxVars.freeRegister(ret.address)
                        return { MemObj: TmpMemObj, instructionset: instructionstrain }
                    }

                    if (objTree.Operation.value === '||') {
                        const rnd = generateUtils.getNewJumpID(objTree.Operation.line)

                        const IDNextStmt = '__OR_' + rnd + '_next'

                        const LGenObj = genCode(objTree.Left, true, true, IDNextStmt, gc_jumpTrue)
                        instructionstrain += LGenObj.instructionset
                        if (auxVars.isTemp(LGenObj.MemObj.address)) { // maybe it was an arithmetic operation
                            instructionstrain += createInstruction(utils.genNotEqualToken(), LGenObj.MemObj, utils.createConstantMemObj(0), true, gc_jumpFalse, gc_jumpTrue)
                        }

                        instructionstrain += createInstruction({ type: 'Label' }, IDNextStmt)

                        const RGenObj = genCode(objTree.Right, true, true, gc_jumpFalse, gc_jumpTrue)
                        instructionstrain += RGenObj.instructionset
                        if (auxVars.isTemp(RGenObj.MemObj.address)) { // maybe it was an arithmetic operation
                            instructionstrain += createInstruction(utils.genNotEqualToken(), RGenObj.MemObj, utils.createConstantMemObj(0), true, gc_jumpFalse, gc_jumpTrue)
                        }

                        instructionstrain += createInstruction({ type: 'Jump' }, gc_jumpFalse)

                        return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                    }

                    if (objTree.Operation.value === '&&') {
                        const rnd = generateUtils.getNewJumpID(objTree.Operation.line)

                        const IDNextStmt = '__AND_' + rnd + '_next'

                        const LGenObj = genCode(objTree.Left, true, false, gc_jumpFalse, IDNextStmt)
                        instructionstrain += LGenObj.instructionset
                        if (auxVars.isTemp(LGenObj.MemObj.address)) { // maybe it was an arithmetic operation
                            instructionstrain += createInstruction(utils.genNotEqualToken(), LGenObj.MemObj, utils.createConstantMemObj(0), false, gc_jumpFalse, gc_jumpTrue)
                        }

                        instructionstrain += createInstruction({ type: 'Label' }, IDNextStmt)

                        const RGenObj = genCode(objTree.Right, true, false, gc_jumpFalse, gc_jumpTrue)
                        instructionstrain += RGenObj.instructionset
                        if (auxVars.isTemp(RGenObj.MemObj.address)) { // maybe it was an arithmetic operation
                            instructionstrain += createInstruction(utils.genNotEqualToken(), RGenObj.MemObj, utils.createConstantMemObj(0), false, gc_jumpFalse, gc_jumpTrue)
                        }

                        instructionstrain += createInstruction({ type: 'Jump' }, gc_jumpTrue)

                        return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                    }

                    // other comparisions operators: ==, !=, <, >, <=, >=

                    const LGenObj = genCode(objTree.Left, false, gc_revLogic) //, gc_jumpFalse, gc_jumpTrue); must be undefined to evaluate expressions
                    instructionstrain += LGenObj.instructionset

                    const RGenObj = genCode(objTree.Right, false, gc_revLogic) //, gc_jumpFalse, gc_jumpTrue); must be undefined to evaluate expressions
                    instructionstrain += RGenObj.instructionset

                    instructionstrain += createInstruction(objTree.Operation, LGenObj.MemObj, RGenObj.MemObj, gc_revLogic, gc_jumpFalse, gc_jumpTrue)

                    auxVars.freeRegister(LGenObj.MemObj.address)
                    auxVars.freeRegister(RGenObj.MemObj.address)
                    return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                }

                if (objTree.Operation.type === 'Delimiter') {
                    if (cg_jumpTarget !== undefined) {
                        throw new TypeError('At line: ' + objTree.Operation.line + '. Only one expression at a time if cg_jumpTarget is set.')
                    }

                    const LGenObj = genCode(objTree.Left, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                    instructionstrain += LGenObj.instructionset
                    instructionstrain += auxVars.getPostOperations()

                    const RGenObj = genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                    instructionstrain += RGenObj.instructionset
                    // Note: RGenObj always have MemObj, because cg_jumpTarget is undefined.
                    auxVars.freeRegister(RGenObj.MemObj.address)
                    instructionstrain += auxVars.getPostOperations()

                    return { MemObj: LGenObj.MemObj, instructionset: instructionstrain }
                }

                if (objTree.Operation.type === 'Operator') {
                    let LGenObj = genCode(objTree.Left, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                    instructionstrain += LGenObj.instructionset

                    let RGenObj = genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue)
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
                    let TmpMemObj: GENCODE_RETURN_MEMORY
                    if (!auxVars.isTemp(LGenObj.MemObj.address)) {
                        TmpMemObj = auxVars.getNewRegister()
                        TmpMemObj.declaration = LGenObj.MemObj.declaration
                        instructionstrain += createInstruction(utils.genAssignmentToken(), TmpMemObj, LGenObj.MemObj)
                        auxVars.freeRegister(LGenObj.MemObj.address)
                    } else {
                        TmpMemObj = LGenObj.MemObj
                    }

                    // Pointer verifications
                    if (Program.Config.useVariableDeclaration) {
                        if (RGenObj.MemObj.declaration.indexOf('_ptr') !== -1 && TmpMemObj.declaration.indexOf('_ptr') === -1) {
                            // Case when adding numbers to pointers
                            TmpMemObj.declaration += '_ptr'
                        }
                        if (TmpMemObj.declaration.indexOf('_ptr') !== -1) {
                            if (objTree.Operation.value !== '+' && objTree.Operation.value !== '-') {
                                throw new TypeError('At line: ' + objTree.Operation.line + ". Operation not allowed on pointers. Only '+', '-', '++' and '--' are.")
                            }
                        }
                    }

                    instructionstrain += createInstruction(objTree.Operation, TmpMemObj, RGenObj.MemObj)

                    if (logicalOp === true) {
                        instructionstrain += createInstruction(utils.genNotEqualToken(), TmpMemObj, utils.createConstantMemObj(0), gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                        auxVars.freeRegister(RGenObj.MemObj.address)
                        auxVars.freeRegister(TmpMemObj.address)
                        return { MemObj: utils.createVoidMemObj(), instructionset: instructionstrain }
                    }

                    auxVars.freeRegister(RGenObj.MemObj.address)
                    return { MemObj: TmpMemObj, instructionset: instructionstrain }
                }

                if (objTree.Operation.type === 'Assignment' || objTree.Operation.type === 'SetOperator') {
                    if (gc_jumpFalse !== undefined) {
                        throw new SyntaxError('At line: ' + objTree.Operation.line + '. Can not use assignment during logical operations with branches')
                    }

                    auxVars.left_side_of_assignment = true
                    const LGenObj = genCode(objTree.Left, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                    instructionstrain += LGenObj.instructionset
                    auxVars.left_side_of_assignment = false

                    if (LGenObj.MemObj.type === 'void') {
                        throw new SyntaxError('At line: ' + objTree.Operation.line + '. Trying to assign undefined variable')
                    }
                    if (LGenObj.MemObj.address === -1) {
                        throw new TypeError('At line: ' + objTree.Operation.line + '. Invalid left value for ' + objTree.Operation.type)
                    }
                    if (auxVars.isTemp(LGenObj.MemObj.address) && LGenObj.MemObj.type.lastIndexOf('_ptr') !== LGenObj.MemObj.type.length - 4) {
                        throw new TypeError('At line: ' + objTree.Operation.line + '. Invalid left value for ' + objTree.Operation.type)
                    }

                    let temp_declare = ''
                    if (auxVars.declaring.length !== 0) {
                        temp_declare = auxVars.declaring
                        auxVars.declaring = ''
                    }

                    if (LGenObj.MemObj.type === 'array' && LGenObj.MemObj.offset_type === 'constant') { // if it is an array item we know, change to the item (and do optimizations)
                        LGenObj.MemObj = getMemoryObjectByLocation(utils.addHexContents(LGenObj.MemObj.hexContent, LGenObj.MemObj.offset_value))
                    }
                    // check if we can reuse variables used on assignment
                    // then add it to auxVars.tmpvars
                    let RGenObj: GENCODE_RETURN_OBJECT
                    if (objTree.Operation.type === 'Assignment' &&
                        Program.Config.reuseAssignedVar === true &&
                        LGenObj.MemObj.type === 'long' &&
                        LGenObj.MemObj.offset_type === undefined &&
                        CanReuseAssignedVar(LGenObj.MemObj.address, objTree.Right)) {
                        auxVars.tmpvars.unshift(LGenObj.MemObj.name)
                        auxVars.status.unshift(false)
                        RGenObj = genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                        auxVars.tmpvars.shift()
                        auxVars.status.shift()
                    } else {
                        RGenObj = genCode(objTree.Right, false, gc_revLogic, gc_jumpFalse, gc_jumpTrue)
                    }
                    instructionstrain += RGenObj.instructionset
                    if (temp_declare.length !== 0) {
                        auxVars.declaring = temp_declare
                    }

                    if (RGenObj.MemObj.type === 'void') {
                        throw new TypeError('At line: ' + objTree.Operation.line + '. Invalid right value for ' + objTree.Operation.type + '. Possible void value.')
                    }
                    if (LGenObj.MemObj.type === 'array' && LGenObj.MemObj.declaration === 'long_ptr' && RGenObj.MemObj.size === 1) {
                        throw new TypeError('At line: ' + objTree.Operation.line + '. Invalid left value for ' + objTree.Operation.type + '. Can not reassign an array.')
                    }
                    // Pointer verifications
                    if (Program.Config.useVariableDeclaration) {
                        if (LGenObj.MemObj.declaration.indexOf('_ptr') !== -1 &&
                            objTree.Operation.type === 'SetOperator' &&
                            RGenObj.MemObj.declaration.indexOf('_ptr') === -1) {
                            // Case when adding numbers to pointers
                            RGenObj.MemObj.declaration += '_ptr'
                            if (objTree.Operation.value !== '+=' && objTree.Operation.value !== '-=') {
                                throw new TypeError('At line: ' + objTree.Operation.line + ". Operation not allowed on pointers. Only '+', '-', '++' and '--' are.")
                            }
                        }
                    }

                    if (Program.Config.useVariableDeclaration) {
                        if (!auxVars.isTemp(RGenObj.MemObj.address)) {
                            if (LGenObj.MemObj.declaration !== RGenObj.MemObj.declaration) {
                                if (LGenObj.MemObj.declaration.indexOf('_ptr') === -1 || RGenObj.MemObj.declaration.indexOf('_ptr') === -1) { // skipt check if both sides are pointers
                                    if (Program.Config.warningToError) {
                                        throw new TypeError('WARNING: At line: ' + objTree.Operation.line + ". Left and right values does not match. Values are: '" + LGenObj.MemObj.declaration + "' and '" + RGenObj.MemObj.declaration + "'.")
                                    }
                                }
                            }
                        }
                    }
                    instructionstrain += createInstruction(objTree.Operation, LGenObj.MemObj, RGenObj.MemObj)

                    if (auxVars.const_sentence === true) {
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
            case 'endASN':
                if (ObjAST.Token === undefined) {
                    return true
                }
                if (ObjAST.Token.type === 'Variable') {
                    if (ObjAST.Token.value === vname) {
                        return false
                    }
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

        function chooseBranch (value: string, useBZR: boolean, cb_logic: boolean) {
            if (useBZR) {
                if (cb_logic) {
                    if (value === '==') return 'BZR'
                    if (value === '!=') return 'BNZ'
                } else {
                    if (value === '==') return 'BNZ'
                    if (value === '!=') return 'BZR'
                }
                throw new TypeError(`Invalid use of Branch Zero: ${value}`)
            } else {
                if (cb_logic) {
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

        // Translate one single instruction from ast to assembly code
        function createInstruction (objoperator, param1, param2, ci_revLogic, ci_jumpFalse, ci_jumpTrue) {
            let retinstr = ''

            // From Param_Obj create an memory object suitable for assembly operations, except assignment.
            // Returns also instructions maybe needed for conversion and an boolean to indicate if it is
            // a new object (that must be free later on)
            function mold_param (Param_Obj, line) {
                let Ret_Obj
                let ret_instructions = ''
                let ret_is_new = false

                if (Param_Obj.type === 'constant') {
                    Ret_Obj = auxVars.getNewRegister()
                    ret_instructions += createInstruction(utils.genAssignmentToken(), Ret_Obj, Param_Obj)
                    ret_is_new = true
                } else if (Param_Obj.type === 'register' || Param_Obj.type === 'long') {
                    Ret_Obj = Param_Obj
                } else if (Param_Obj.type === 'register_ptr' || Param_Obj.type === 'long_ptr') {
                    Ret_Obj = auxVars.getNewRegister()
                    ret_instructions += createInstruction(utils.genAssignmentToken(), Ret_Obj, Param_Obj)
                    ret_is_new = true
                } else if (Param_Obj.type === 'array') {
                    if (Param_Obj.offset_type === undefined) { // Pointer operation
                        Ret_Obj = Param_Obj
                    } else if (Param_Obj.offset_type === 'constant') { // Looks like an array but can be converted to regular variable
                        Ret_Obj = getMemoryObjectByLocation(utils.addHexContents(Param_Obj.hexContent, Param_Obj.offset_value), line)
                    } else {
                        Ret_Obj = auxVars.getNewRegister()
                        ret_instructions += createInstruction(utils.genAssignmentToken(), Ret_Obj, Param_Obj)
                        ret_is_new = true
                    }
                } else if (Param_Obj.type === 'struct') {
                    if (Program.Config.useVariableDeclaration === false) {
                        throw new TypeError('At line: ' + line + ". Can not use struct if 'useVariableDeclaration' is false.")
                    }
                    if (Param_Obj.offset_type === undefined) {
                        Ret_Obj = Param_Obj
                    } else if (Param_Obj.offset_type === 'constant') {
                        Ret_Obj = auxVars.getNewRegister()
                        ret_instructions += createInstruction(utils.genAssignmentToken(), Ret_Obj, utils.createConstantMemObj(Param_Obj.offset_value))
                        ret_is_new = true
                    } else {
                        Ret_Obj = auxVars.getNewRegister()
                        ret_instructions += createInstruction(utils.genAssignmentToken(), Ret_Obj, Param_Obj)
                        ret_is_new = true
                    }
                } else {
                    throw new TypeError('At line: ' + line + ". Not implemented type in mold_param(): Param_Obj.type = '" + Param_Obj.type + "'.")
                }

                return { MoldedObj: Ret_Obj, instructionset: ret_instructions, is_new: ret_is_new }
            }

            if (objoperator.type === 'Assignment') {
                if (param1.type === 'constant' || param1.type === 'constant_ptr') {
                    throw new TypeError('At line: ' + objoperator.line + '.Invalid left side for assigment.')
                }
                if (param1.type === 'register' || param1.type === 'long') { // param 1 can be direct assigned
                    if (param2.type === 'constant') { // Can use SET_VAL or CLR_DAT
                        if (param2.hexContent === '0000000000000000') {
                            return 'CLR @' + param1.asmName + '\n'
                        } else {
                            if (param2.hexContent.length > 17) {
                                throw new RangeError('At line: ' + objoperator.line + '.Overflow on long value assignment (value bigger than 64 bits)')
                            }
                            return 'SET @' + param1.asmName + ' #' + param2.hexContent + '\n'
                        }
                    } else if (param2.type === 'register' || param2.type === 'long') { // Can use SET_DAT
                        if (param1.address === param2.address) return ''
                        else return 'SET @' + param1.asmName + ' $' + param2.asmName + '\n'
                    } else if (param2.type === 'register_ptr' || param2.type === 'long_ptr') {
                        return 'SET @' + param1.asmName + ' $($' + param2.asmName + ')\n'
                    } else if (param2.type === 'constant_ptr') {
                        return 'SET @' + param1.asmName + ' $($' + getMemoryObjectByLocation(param2.hexContent, objoperator.line).asmName + ')\n'
                    } else if (param2.type === 'array' || param2.type === 'struct') {
                        if (param2.offset_type === undefined) {
                            return 'SET @' + param1.asmName + ' $' + param2.asmName + '\n'
                        }
                        if (param2.offset_type === 'constant') {
                            if (param2.type === 'array') {
                                return 'SET @' + param1.asmName + ' $' + getMemoryObjectByLocation(utils.addHexContents(param2.hexContent, param2.offset_value), objoperator.line).asmName + '\n'
                            } else { // param2.type === "struct"
                                const TmpMemObj = auxVars.getNewRegister()
                                retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(param2.offset_value))
                                retinstr += 'SET @' + param1.asmName + ' $($' + param2.asmName + ' + $' + TmpMemObj.asmName + ')\n'
                                auxVars.freeRegister(TmpMemObj.address)
                                return retinstr
                            }
                        } else {
                            return 'SET @' + param1.asmName + ' $($' + param2.asmName + ' + $' + getMemoryObjectByLocation(param2.offset_value, objoperator.line).asmName + ')\n'
                        }
                    }
                    throw new TypeError('At line: ' + objoperator.line + ". Unknow combination at createInstruction: param1 type '" + param1.type + "' and param2 type: '" + param2.type + "'.")
                } else if (param1.type === 'register_ptr' || param1.type === 'long_ptr') {
                    if (param2.type === 'constant') { // Can use SET_VAL or CLR_DAT
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
                    } else if (param2.type === 'constant_ptr') {
                        return 'SET @' + param1.asmName + ' #' + param2.hexContent + '\n'
                    } else if (param2.type === 'array' || param2.type === 'struct') {
                        if (param2.offset_type === 'constant') {
                            if (param2.type === 'array') {
                                return 'SET @($' + param1.asmName + ') $' + getMemoryObjectByLocation(utils.addHexContents(param2.hexContent, param2.offset_value), objoperator.line).asmName + '\n'
                            } else { // param2.type === "struct"
                                const TmpMemObj = auxVars.getNewRegister()
                                retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(param2.offset_value))
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
                    if (param1.offset_type === 'constant') {
                        return createInstruction(objoperator, getMemoryObjectByLocation(utils.addHexContents(param1.hexContent, param1.offset_value), objoperator.line), param2)
                    }
                    if (param2.type === 'constant') {
                        if (param1.offset_type === undefined) { // special case for multi-long text assignment
                            const array_size = param1.arrayTotalSize - 1
                            if (param2.size > array_size) {
                                throw new RangeError('At line: ' + objoperator.line + '. Overflow on array value assignment (value bigger than array size).')
                            }
                            const padded_long = param2.hexContent.padStart(array_size * 16, '0')
                            for (let i = 0; i < array_size; i++) {
                                retinstr += createInstruction(
                                    utils.genAssignmentToken(),
                                    getMemoryObjectByLocation(utils.addHexContents(param1.hexContent, i), objoperator.line),
                                    utils.createConstantMemObj(padded_long.slice(16 * (array_size - i - 1), 16 * (array_size - i))))
                            }
                            return retinstr
                        }
                        if (param2.hexContent.length > 16) {
                            throw new RangeError('At line: ' + objoperator.line + '. Overflow on long value assignment (value bigger than 64 bits)')
                        }
                        const TmpMemObj = auxVars.getNewRegister()
                        retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, param2)
                        retinstr += 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.offset_value, objoperator.line).asmName + ') $' + TmpMemObj.asmName + '\n'
                        auxVars.freeRegister(TmpMemObj.address)
                        return retinstr
                    } else if (param2.type === 'register' || param2.type === 'long') {
                        return 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.offset_value, objoperator.line).asmName + ') $' + param2.asmName + '\n'
                    } else if (param2.type === 'register_ptr' || param2.type === 'long_ptr') {
                        const TmpMemObj = auxVars.getNewRegister()
                        retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, param2)
                        retinstr += 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.offset_value, objoperator.line).asmName + ') $' + TmpMemObj.asmName + '\n'
                        auxVars.freeRegister(TmpMemObj.address)
                        return retinstr
                    } else if (param2.type === 'array' || param2.type === 'struct') {
                        if (param2.offset_type === 'constant') {
                            if (param2.type === 'array') {
                                return 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.offset_value, objoperator.line).asmName + ') $' + getMemoryObjectByLocation(utils.addHexContents(param2.hexContent, param2.offset_value), objoperator.line).asmName + '\n'
                            } else { // param2.type === "struct"
                                const TmpMemObj = auxVars.getNewRegister()
                                retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(param2.offset_value))
                                retinstr += 'SET @' + TmpMemObj.asmName + ' $($' + param2.asmName + ' + $' + TmpMemObj.asmName + ')\n'
                                retinstr += 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.offset_value, objoperator.line).asmName + ') $' + TmpMemObj.asmName + '\n'
                                auxVars.freeRegister(TmpMemObj.address)
                                return retinstr
                            }
                        } else {
                            const TmpMemObj = auxVars.getNewRegister()
                            retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, param2)
                            retinstr += 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.offset_value, objoperator.line).asmName + ') $' + TmpMemObj.asmName + '\n'
                            auxVars.freeRegister(TmpMemObj.address)
                            return retinstr
                        }
                    }
                    throw new TypeError('At line: ' + objoperator.line + ". Unknow combination at createInstruction: param1 type '" + param1.type + "' and param2 type: '" + param2.type + "'.")
                } else if (param1.type === 'struct') {
                    if (param1.offset_type === undefined && param1.declaration === 'struct_ptr') {
                        if (param2.type === 'constant') {
                            return 'SET @' + param1.asmName + ' #' + param2.hexContent + '\n'
                        }
                        if (param2.type === 'register') {
                            return 'SET @' + param1.asmName + ' $' + param2.asmName + '\n'
                        }
                    } else if (param1.offset_type === 'constant') {
                        /* Code not allowed by condition Yyx_sSkA */
                    } else /* if (param1.offset_type === "variable" ) */ {
                        if (param2.type === 'constant') {
                            if (param2.hexContent.length > 17) {
                                throw new RangeError('At line: ' + objoperator.line + '. Overflow on long value assignment (value bigger than 64 bits)')
                            }
                            const TmpMemObj = auxVars.getNewRegister()
                            retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, param2)
                            retinstr += 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.offset_value, objoperator.line).asmName + ') $' + TmpMemObj.asmName + '\n'
                            auxVars.freeRegister(TmpMemObj.address)
                            return retinstr
                        } else if (param2.type === 'register' || param2.type === 'long') {
                            return 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.offset_value, objoperator.line).asmName + ') $' + param2.asmName + '\n'
                        } else if (param2.type === 'array' || param2.type === 'struct') {
                            if (param2.offset_type === 'constant') {
                                if (param2.type === 'array') {
                                    return 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.offset_value, objoperator.line).asmName + ') $' + getMemoryObjectByLocation(utils.addHexContents(param2.hexContent, param2.offset_value), objoperator.line).asmName + '\n'
                                } else { // param2.type === "struct"
                                    const TmpMemObj = auxVars.getNewRegister()
                                    retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, utils.createConstantMemObj(param2.offset_value))
                                    retinstr += 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.offset_value, objoperator.line).asmName + ') $' + TmpMemObj.asmName + '\n'
                                    auxVars.freeRegister(TmpMemObj.address)
                                    return retinstr
                                }
                            } else {
                                const TmpMemObj = auxVars.getNewRegister()
                                retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj, param2)
                                retinstr += 'SET @($' + param1.asmName + ' + $' + getMemoryObjectByLocation(param1.offset_value, objoperator.line).asmName + ') $' + TmpMemObj.asmName + '\n'
                                auxVars.freeRegister(TmpMemObj.address)
                                return retinstr
                            }
                        }
                    }
                }
                throw new TypeError('At line: ' + objoperator.line + ". Unknow combination at createInstruction: param1 type '" + param1.type + "' and param2 type: '" + param2.type + "'.")
            }

            if (objoperator.type === 'Operator' || objoperator.type === 'SetOperator') {
                let TmpMemObj1, TmpMemObj2
                let allow_optimization = false
                let optimized = false

                if (param1.type === 'constant') {
                    throw new TypeError('At line: ' + objoperator.line + ". Can not createInstruction with param1 type '" + param1.type + "'.")
                }
                TmpMemObj1 = mold_param(param1, objoperator.line)
                retinstr += TmpMemObj1.instructionset

                if (param2.type === 'constant') {
                    allow_optimization = true
                }
                TmpMemObj2 = mold_param(param2, objoperator.line)
                retinstr += TmpMemObj2.instructionset

                if (allow_optimization === true) {
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
                            retinstr += createInstruction(utils.genIncToken(objoperator.line), TmpMemObj1.MoldedObj)
                            optimized = true
                        }
                        if (param2.hexContent === '0000000000000002') {
                            auxVars.freeRegister(TmpMemObj2.MoldedObj.address)
                            removeLastButOne()
                            retinstr += createInstruction(utils.genIncToken(objoperator.line), TmpMemObj1.MoldedObj)
                            retinstr += createInstruction(utils.genIncToken(objoperator.line), TmpMemObj1.MoldedObj)
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
                            retinstr += createInstruction(utils.genDecToken(objoperator.line), TmpMemObj1.MoldedObj)
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

                if (TmpMemObj1.is_new === true) {
                    retinstr += createInstruction(utils.genAssignmentToken(), param1, TmpMemObj1.MoldedObj)
                    auxVars.freeRegister(TmpMemObj1.MoldedObj.address)
                }

                return retinstr
            }

            if (objoperator.type === 'UnaryOperator' || objoperator.type === 'SetUnaryOperator') {
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
                    return
                }
                throw new TypeError('At line: ' + objoperator.line + '. Unary operator not supported: ' + objoperator.value)
            }

            if (objoperator.type === 'Delimiter') {
                return param1 + '\n' + param2
            }

            if (objoperator.type === 'Jump') {
                return 'JMP :' + param1 + '\n'
            }

            if (objoperator.type === 'Label') {
                return param1 + ':\n'
            }

            if (objoperator.type === 'Comparision') {
                if (ci_jumpFalse === undefined || ci_jumpTrue === undefined) {
                    throw new TypeError('At line: ' + objoperator.line + '. Missing label to ci_jumpFalse / ci_jumpTrue.')
                }

                let TmpMemObj1
                let TmpMemObj2
                let useBranchZero = false
                let jump

                TmpMemObj1 = mold_param(param1, objoperator.line)
                retinstr += TmpMemObj1.instructionset

                if (param2.type === 'constant' && param2.hexContent === '0000000000000000' && (objoperator.value === '!=' || objoperator.value === '==')) {
                    useBranchZero = true
                } else {
                    TmpMemObj2 = mold_param(param2, objoperator.line)
                    retinstr += TmpMemObj2.instructionset
                }

                retinstr += chooseBranch(objoperator.value, useBranchZero, ci_revLogic)

                if (ci_revLogic) {
                    jump = ci_jumpTrue
                } else {
                    jump = ci_jumpFalse
                }

                if (useBranchZero) {
                    retinstr += ' $' + TmpMemObj1.MoldedObj.asmName + ' :' + jump + '\n'
                } else {
                    retinstr += ' $' + TmpMemObj1.MoldedObj.asmName + ' $' + TmpMemObj2.MoldedObj.asmName + ' :' + jump + '\n'
                }

                if (TmpMemObj1.is_new === true) {
                    auxVars.freeRegister(TmpMemObj1.MoldedObj.address)
                }
                if (TmpMemObj2 !== undefined && TmpMemObj2.is_new === true) {
                    auxVars.freeRegister(TmpMemObj2.MoldedObj.address)
                }

                return retinstr
            }

            if (objoperator.type === 'Function') {
                return 'JSR :__fn_' + param1 + '\n'
            }

            if (objoperator.type === 'APICall') {
                let retinstr = ''
                const tempvar = []

                param2.forEach(function (varObj) {
                    const Temp = mold_param(varObj, -1)
                    retinstr += Temp.instructionset
                    tempvar.push(Temp)
                })

                retinstr += 'FUN'
                if (param1.type !== "void") {
                    retinstr += ' @' + param1.asmName
                }
                retinstr += ' ' + objoperator.value
                tempvar.forEach(arg => retinstr += ' $' + arg.MoldedObj.asmName)
                retinstr += '\n'

                tempvar.forEach(arg => auxVars.freeRegister(arg.MoldedObj.address))
                return retinstr
            }

            if (objoperator.type === 'Pop') {
                return 'POP @' + param1.asmName + '\n'
            }

            if (objoperator.type === 'Push') {
                let retinstr = ''
                let TmpMemObj

                TmpMemObj = mold_param(param1)
                retinstr += TmpMemObj.instructionset

                retinstr += 'PSH $' + TmpMemObj.MoldedObj.asmName + '\n'

                if (TmpMemObj.is_new === true) {
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
                    return 'JMP :' + param1.name + '\n'
                }
                if (objoperator.value === 'halt') {
                    return 'STP\n'
                }
                if (objoperator.value === 'exit') {
                    return 'FIN\n'
                }
                if (objoperator.value === 'return' || objoperator.value === 'sleep') {
                    if (param1 === undefined && objoperator.value === 'return') {
                        return 'RET\n'
                    }

                    let retinstr = ''
                    let TmpMemObj1

                    if (param1.type === 'constant') {
                        TmpMemObj1 = auxVars.getNewRegister()
                        retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj1, param1)
                    } else if (param1.type === 'register' || param1.type === 'long') {
                        TmpMemObj1 = param1
                    } else if (param1.type === 'register_ptr' || param1.type === 'long_ptr') {
                        TmpMemObj1 = auxVars.getNewRegister()
                        retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj1, param1)
                    } else if (param1.type === 'array') {
                        if (param1.offset_type === 'constant') { // Looks like an array but can be converted to regular variable
                            TmpMemObj1 = getMemoryObjectByLocation(utils.addHexContents(param1.hexContent, param1.offset_value), objoperator.line)
                        } else {
                            TmpMemObj1 = auxVars.getNewRegister()
                            retinstr += createInstruction(utils.genAssignmentToken(), TmpMemObj1, param1)
                        }
                    } else {
                        throw new TypeError('At line: ' + objoperator.line + ". Not implemented type in createInstruction for keyword: param1 type '" + param1.type + "'.")
                    }

                    if (objoperator.value === 'return') {
                        retinstr += 'PSH $' + TmpMemObj1.asmName + '\n'
                        retinstr += 'RET\n'
                    } else if (objoperator.value === 'sleep') {
                        retinstr += 'SLP $' + TmpMemObj1.asmName + '\n'
                    }

                    auxVars.freeRegister(TmpMemObj1.address)
                    auxVars.freeRegister(param1.address)
                    return retinstr
                }
                if (objoperator.value === 'asm') {
                    let lines = objoperator.extValue.split('\n')
                    lines = lines.map(function (value) {
                        return value.trim()
                    })
                    return lines.join('\n').trim() + '\n'
                }
            }
            throw new TypeError('At line: ' + objoperator.line + '. ' + objoperator.type + ' not supported')
        }

        // return codeGenerator_main()
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
        if (generateUtils.current_function !== -1) { // find function scope variable
            search = Program.memory.find(obj => obj.name === varName && obj.scope === Program.functions[generateUtils.current_function].name)
        }
        if (search === undefined) {
            // do a global scope search
            search = Program.memory.find(obj => obj.name === varName && obj.scope === '')
        }

        if (Program.Config.useVariableDeclaration === false) {
            if (search === undefined) {
                const fakevar: MEMORY_SLOT = {
                    address: Program.memory.length,
                    name: varName,
                    asmName: varName,
                    type: 'long',
                    declaration: varDeclaration,
                    scope: '',
                    size: 1,
                    isDeclared: true
                }
                Program.memory.push(fakevar)
                return JSON.parse(JSON.stringify(fakevar))
            }
            return JSON.parse(JSON.stringify(search))
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
        const fname = Program.functions[generateUtils.current_function].name
        if (fname === 'main') {
            writeAsmLine(`__fn_${fname}:`)
            writeAsmLine('PCS')
            return
        }
        writeAsmLine(`__fn_${fname}:`)
        Program.functions[generateUtils.current_function].argsMemObj.forEach(Obj => {
            writeAsmLine(`POP @${Obj.asmName}`)
        })
    }

    /**
     * Handle function end
     */
    function functionTailGenerator () {
        const fname = Program.functions[generateUtils.current_function].name
        if (fname === 'main') {
            if (generateUtils.assemblyCode.lastIndexOf('FIN') + 4 !== generateUtils.assemblyCode.length) {
                writeAsmLine('FIN')
            }
            return
        }
        if (generateUtils.assemblyCode.lastIndexOf('RET') + 4 !== generateUtils.assemblyCode.length) {
            if (Program.functions[generateUtils.current_function].declaration === 'void') {
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
            generateUtils.latest_loop_id.push(sentenceID)
            Sentence.trueBlock.forEach(compileSentence)
            generateUtils.latest_loop_id.pop()
            writeAsmLine('JMP :' + sentenceID + '_continue')
            writeAsmLine(sentenceID + '_break:')
            break
        case 'do':
            sentenceID = '__loop' + generateUtils.getNewJumpID(Sentence.line)
            writeAsmLine(sentenceID + '_continue:')
            generateUtils.latest_loop_id.push(sentenceID)
            Sentence.trueBlock.forEach(compileSentence)
            generateUtils.latest_loop_id.pop()
            writeAsmCode(codeGenerator(Sentence.ConditionAST, sentenceID + '_break', sentenceID + '_continue', true))
            writeAsmLine(sentenceID + '_break:')
            break
        case 'for':
            sentenceID = '__loop' + generateUtils.getNewJumpID(Sentence.line)
            writeAsmCode(codeGenerator(Sentence.threeSentences[0].CodeAST))
            writeAsmLine(sentenceID + '_condition:')
            writeAsmCode(codeGenerator(Sentence.threeSentences[1].CodeAST, sentenceID + '_break', sentenceID + '_start'))
            writeAsmLine(sentenceID + '_start:')
            generateUtils.latest_loop_id.push(sentenceID)
            Sentence.trueBlock.forEach(compileSentence)
            generateUtils.latest_loop_id.pop()
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
