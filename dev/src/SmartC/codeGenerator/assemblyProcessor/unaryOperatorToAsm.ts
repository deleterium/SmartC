
import { TOKEN, MEMORY_SLOT } from '../../typings/syntaxTypes'

/** Create instruction for SetUnaryOperator `++`, `--`. Create instruction for Unary operator `~` and `+`. */
export function unaryOperatorToAsm (OperatorToken: TOKEN, Variable: MEMORY_SLOT): string {
    switch (OperatorToken.value) {
    case '++':
        return `INC @${Variable.asmName}\n`
    case '--':
        return `DEC @${Variable.asmName}\n`
    case '~':
        return `NOT @${Variable.asmName}\n`
    case '+':
        return ''
    default:
        throw new TypeError(`Internal error at line: ${OperatorToken.line}.`)
    }
}
