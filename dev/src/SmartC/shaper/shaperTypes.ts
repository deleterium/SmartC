export type SHAPER_AUXVARS = {
    currentToken: number
    /** current loop name to be used if break or continue keywords are found. */
    latestLoopId: string[]
    /** If true, compilation loop on generator() will not expect the variable
     * to be declared. Used in function arguments. */
    isFunctionArgument: boolean
    /** Variables scope (function name) */
    currentScopeName:string
    /** Prefix to be used in variables names (function name + '_') */
    currentPrefix: string
}
