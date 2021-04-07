# BurstAT-Compiler
Parser and compiler for arithmetic operations: C-like to BurstAT assembly. [Run now!](https://deleterium.github.io/BurstAT-Compiler/test.html)

## Objective
To create a high level programming language for Burstcoin Automated Transactions.

## Current Status
- [x] Compile line based arithmetics expressions 
- [ ] Support for logical operations
- [ ] Support keywords and integration with loops and conditionals (Currently present at SimpleIDE)
- [ ] Option to export machine code in hexadecimal stream, enabling import into Burstcoin wallet (BRS)

## Language rules
Expressions are C-like and evaluated from left to right. Rules are simpler than in C, so complexes expressions can have different evaluations from C, but simple expressions shall have same outcome given special caracteristcs in Burstcoin assembly language. Spaces are disregarded. Every line is processed as an expression. Optionally a comma `,` can be used to write more than one expression at same line. Line breaks are also parsed same way.

### Operators precedence
When two or more symbols with same precedence are in an expression, the operations will be evaluated from right to left. Example: `a=16/4/4` will be evaluated as `a=(16/(4/4))`
| Order | Symbol | Description |
| --- | --- | --- |
| 1 | `()`   `[]` | Scope, array |
| 2 | `!`   `~`   `-`   `+`   `*`   `&`   `++`   `--` | Unary operators |
| 3 | `*`   `/`   `%` | Multiplication, division, modulo |
| 4 | `+`   `-` | Addition and subtraction |
| 5 | `<<`   `>>` | Bitwise shift left and right  |
| 6 | `<`   `<=`   `>`   `>=`   `==`   `!=` | Comparisons |
| 7 | `&`   `^`   `\|` | Bitwise AND XOR OR |
| 8 | `&&`   `\|\|`   `\|` | Logical AND  OR |
| 9 | `=`   `+=`   `-=`   `*=`   `/=`   `%=`   `&=`   `\|=`   `;=`   `^=`   `<<=`   `>>=` | Assignment operators|
| 10 | `,`   `\n` | New line of code, comma |

### Internal names
Tokens are divided in groups and later on checked if their combinations are synctactic valid.
|Token type | Example/Operators | Description|
| --- | --- | --- |
| Variable | `var1` | Variables names. In special cases could be a pointer representation. |
| Constant | `23`   `0xffa`   `"Hi!"` | Number to be stored inside a long value (64 bit). Strings are converted to number. |
| Operator | `/`   `%`   `<<`   `>>`   `\|`   `^` | Tokens that are undoubtly binary operators and have no other interpretation. |
| UnaryOperator | `!`   `~` | Tokens that are undoubtly unary operators and have no other interpretation. |
| SetUnaryOperator | `++`   `--` | Special unary operations with same meaning in C - pre/post increment/decrement |
| Assignment | `=` | Common assignment operation |
| SetOperator | `+=`   `-=`   `/=`   `*=`   `%=`   `<<=`   `>>=`   `&=`   `\|=` | Special assignment operations |
| Comparision | `==`   `<=`   `<`   `>`   `>=`   `!=`   `&&`   `\|\|` | Logical comparisions operations |
| CheckOperator | `+`   `-`   `*`   `&` | Tokens that have two meanings and need to be checked agains previous tokens to know their behaviour. After parsed they are treated as UnaryOperator or Operator |
| Arr | `[expr]` | Representation of an array index. Must have a variable before it. |
| CodeCave | `(expr)` | Surrounding an expression to indicate that it shall be evaluated before others operations. In special case could be a pointer representation. |
| NewCodeLine	| `,` | Same as a line break. Use if you want to write two expressions on same line |

### Temporary variables
Long statements need temporary variables to store intermediate results. Computers have registers and program stack that can be used for this purpose. For this project I decided to use five variables as registers `r0` to `r4`. If it is possible, a variable in left side of assignment will also be used as temporary variable. This is a small optimization but can save one instruction for every statement!

## Usage
Download project to your computer and open file `test.html` in your browser. Optionally [run it on gitpages!](https://github.com/deleterium/BurstAT-Compiler/test.html)

## Notes
* Arrays representations will only work in Burstcoin client version 3 and above, for contracts created after a fork scheduled for 24/apr/2021. 
* Some small bugs in code. Run testcases to know them.
