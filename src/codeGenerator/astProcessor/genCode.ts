import { CONTRACT } from '../../typings/contractTypes'
import { GENCODE_ARGS, GENCODE_SOLVED_OBJECT } from '../codeGeneratorTypes'

import utils from '../utils'
import binaryAsnProcessor from './binaryAsnProcessor'
import endAsnProcessor from './endAsnProcessor'
import exceptionAsnProcessor from './exceptionAsnProcessor'
import lookupAsnProcessor from './lookupAsnProcessor'
import switchAsnProcessor from './switchAsnProcessor'
import unaryAsnProcessor from './unaryAsnProcessor'

/** Manages the functions to process Abstract Syntax Nodes */
export default function genCode (
    Program: CONTRACT, ScopeInfo: GENCODE_ARGS
) : GENCODE_SOLVED_OBJECT {
    switch (ScopeInfo.RemAST.type) {
    case 'nullASN':
        return { SolvedMem: utils.createVoidMemObj(), asmCode: '' }
    case 'endASN':
        return endAsnProcessor(Program, ScopeInfo)
    case 'lookupASN':
        return lookupAsnProcessor(Program, ScopeInfo)
    case 'unaryASN':
        return unaryAsnProcessor(Program, ScopeInfo)
    case 'exceptionASN':
        return exceptionAsnProcessor(Program, ScopeInfo)
    case 'binaryASN':
        return binaryAsnProcessor(Program, ScopeInfo)
    case 'switchASN':
        return switchAsnProcessor(Program, ScopeInfo)
    }
}
