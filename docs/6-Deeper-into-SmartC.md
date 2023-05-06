[Back](./README.md)

### Deploying Green Contracts
Green contracts are a feature on Signum cryptocurrency where it is possible to save some deployment fee by using the same machine code already deployed. In this case, the fee is reduced because the green contract will use the transaction to store only new machine data (byteData or the initial memory state) and set up the new contract. It is important that the machine code shall be the same, which means that the machine code hash ID from both the green copy and original contract must match.

Some contracts do not need a new initial state, so no modifications are needed in the source code. For others, it is possible to adjust some variables and still use a green copy. All variables that are initially set using the const keyword can be changed, and the machine code hash ID will still be the same, allowing a green copy deployment.

#### What is needed?
* The source code of the original contract.
* From a full deployment transaction, keep the fullHash info.
* Run the SmartC version indicated by the source code. It's possible to try the latest version, but in some cases, the newer version can add some optimizations and change the machine code hash ID. All version available [here](https://deleterium.info/SmartC/).

#### What is optional?
* Adjust the values of some variables, keeping the same machine code hash ID.

#### How to deploy?
1) In the "Smart Contract Deployment" window, delete the field 'Bytecode'.
2) In the "Smart Contract Deployment" window, fill the field 'ReferencedTransactionFullHash' with the fullHash from original deployment.
3) Change the field "Fee (NQT)" to the minimum needed for a contract deployment. Currently it is 10000000 NQT.
4) Try to deploy. If the fee is too low, the node will tell you the correct fee to use.
5) Use the correct fee and the green contract will be deployed.

Check a video showing the process at https://www.youtube.com/watch?v=CLlsUpswyYI , but note it is used an older version of SmartC and also Signum-node.


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

[Back](./README.md)
