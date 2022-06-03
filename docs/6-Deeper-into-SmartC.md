[Back](./)

### Operators precedence
Following table presents operators precedence order that are [based on C](https://en.wikipedia.org/wiki/Operators_in_C_and_C%2B%2B#Operator_precedence) but with some simplifications.  When two or more symbols with same precedence are in an expression, the operations will be evaluated from left to right, with exception for unary operators, assignment and keyword. Example: `a=16/4/4` will be evaluated as `a=(16/4)/4`, just like in C. If in doubt, use parenthesis!

| Order | Symbol | Description | Associativity |
| --- | --- | --- | --- |
| 0 | Variable, Constant, Functions, `[]` `()` `{}` `.` `->` | Variables, constants, functions, arrays, scope, statements group,  members | Left-to-right |
| 1 | `++`   `--` | Set unary operators | Depends* |
| 2 | `!`   `~`   `-`   `+`   `*`   `&`   `sizeof` | Unary operators and sizeof keyword | Right-to-left |
| 3 | `*`   `/`   `%` | Multiplication, division, modulo | Left-to-right |
| 4 | `+`   `-` | Addition and subtraction | Left-to-right |
| 5 | `<<`   `>>` | Bitwise shift left and right  | Left-to-right |
| 6 | `<`   `<=`   `>`   `>=`   `==`   `!=` | Comparisons |Left-to-right |
| 7 | `&`   `^`   `|` | Bitwise AND XOR OR | Left-to-right |
| 8 | `&&`   | Logical AND | Left-to-right |
| 9 | `||`   | Logical OR | Left-to-right |
| 10 | `=`   `+=`   `-=`   `/=`   `*=`   `%=`   `&=`   `^=`   `|=`   `<<=`   `>>=` | Assignment operators| Right-to-left |
| 11 | `,`  | Delimiter, comma | Left-to-right |
| 12 | `;` `keywords`  | Terminator, semi, keywords other than sizeof | Right-to-left |

* Post increment and post decrement operators are exceptions, being applied on the neighbour variable.


### Internal names

Tokens are divided in groups and later on checked if their combinations are syntactic valid. Compiler can show these names during errors.
|Token type | Example/Operators | Description|
| --- | --- | --- |
| Variable | `var1` | Variables names. In special cases could be a pointer representation. |
| Function | `func1(args)` | Function names. Represents a value returned by functions execution. |
| Constant | `23`   `0xffa`   `'Hi!'` | Number to be stored inside a long value (64 bit). Strings are converted to number. |
| Operator | `/`   `%`   `<<`   `>>`   `|`   `^` | Tokens that are undoubtly binary operators and have no other interpretation. |
| UnaryOperator | `!`   `~` | Tokens that are undoubtly unary operators and have no other interpretation. |
| SetUnaryOperator | `++`   `--` | Special unary operations with same meaning in C - pre/post increment/decrement |
| Assignment | `=` | Common assignment operation |
| SetOperator | `+=`   `-=`   `/=`   `*=`   `%=`   `&=`   `^=`   `|=`   `<<=`   `>>=` | Special assignment operations |
| Comparision | `==`   `<=`   `<`   `>`   `>=`   `!=`   `&&`   `||` | Logical comparisions operations |
| CheckOperator | `+`   `-`   `*`   `&` | Tokens that have two meanings and need to be checked agains previous tokens to know their behaviour. After parsed they are treated as UnaryOperator or Operator |
| Arr | `[expr]` | Representation of an array index. Must have a variable before it. |
| CodeCave | `(expr...)` | Surrounding expressions to indicate that they shall be evaluated before others operations. In special case could be a pointer representation, or part of other keywords as `if`, `for`, ... |
| CodeDomain | `{expr...}` | Surrounding expressions to indicate that it is a group of expressions |
| Delimiter | `,` | Use if you want to write two expressions on same statement |
| Terminator | `;` | Indicating the end of one statement |
| Macro | `#` | Preprocessor statement, ends at a newline character. |
| Member | `.`    `->` | Used to select a struct member. |

### Internal object structure
Please refer to typescript source code for details.

[Back](./)
