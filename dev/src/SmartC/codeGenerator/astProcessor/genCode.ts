// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

import { CONTRACT } from '../../typings/contractTypes'
import { GENCODE_AUXVARS, GENCODE_ARGS, GENCODE_SOLVED_OBJECT } from '../codeGeneratorTypes'

import utils from '../utils'
import binaryAsnProcessor from './binaryAsnProcessor'
import endAsnProcessor from './endAsnProcessor'
import exceptionAsnProcessor from './exceptionAsnProcessor'
import lookupAsnProcessor from './lookupAsnProcessor'
import unaryAsnProcessor from './unaryAsnProcessor'

/** Manages the functions to process Abstract Syntax Nodes */
export default function genCode (
    Program: CONTRACT, AuxVars: GENCODE_AUXVARS, ScopeInfo: GENCODE_ARGS
) : GENCODE_SOLVED_OBJECT {
    switch (ScopeInfo.RemAST.type) {
    case 'nullASN':
        return { SolvedMem: utils.createVoidMemObj(), asmCode: '' }
    case 'endASN':
        return endAsnProcessor(Program, AuxVars, ScopeInfo)
    case 'lookupASN':
        return lookupAsnProcessor(Program, AuxVars, ScopeInfo)
    case 'unaryASN':
        return unaryAsnProcessor(Program, AuxVars, ScopeInfo)
    case 'exceptionASN':
        return exceptionAsnProcessor(Program, AuxVars, ScopeInfo)
    case 'binaryASN':
        return binaryAsnProcessor(Program, AuxVars, ScopeInfo)
    }
}
