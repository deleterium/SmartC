# BurstAT-CC
Burstcoin Automated Transactions C Compiler: C-like to BurstAT assembly writen in Javascript. [Run now!](https://deleterium.github.io/BurstAT-Compiler/try.html)

## Objective
To create a high level programming language, similar to C, for Burstcoin Automated Transactions.

## Current Status
- [x] Compile line based arithmetics expressions 
- [x] Support for logical operations
- [X] Support keywords and integration with loops and conditionals (Currently present at SimpleIDE)
- [ ] Add global code optimization: 1) jump to jump -> jump to right location 2) remove unreacheable codes (between JMP's and labels OR FIN and labels)
- [ ] Add syntax highlighting and save projects in brownser LocalStorage.
- [ ] Option to export machine code in hexadecimal stream, enabling import into Burstcoin wallet (BRS)

## Usage
Download project to your computer and open file `try.html` in your browser. Optionally [run it on gitpages!](https://deleterium.github.io/BurstAT-Compiler/try.html). After compiling, a text in assembly will be presented and this code must be transformed in bytecode using [Smart Contractor](https://deleterium.github.io/BurstAT/SmartContractor/) AT Tools. Inspect assembly code to check if it is OK, this compiler still is under ALPHA development.

## Language rules
Expressions are C-like and evaluated from left to right. Rules are simpler than in C, so complexes expressions can have different evaluations from C, but simple expressions shall have same outcome given special caracteristcs in Burstcoin assembly language.

### Comments
As C, can be one line `//` or multi-line `/* .... */`;

### Keywords
Some keywords have the same meaning and use in C: `asm`, `break`, `continue`, `do`, `else`, `for`, `goto`, `if`, `long`, `return`, `void`, `while`.
Additional keywords:
* `sleep N`: Puts the contract in 'sleep' mode during N blocks. Argument N must be specified and can be an expression. `sleep 1;` makes your contract to stop being processed at current block and resumes it at next one.
* `exit`: Puts the contract in 'finished' mode. It will be inactive until a new transaction is received. Once a tx is received, it will start execution at `void main(void)` function. Takes no argument.
* `halt`: Puts the contract in 'frozen' mode. It will be inactive until a new transaction is received, then resume execution at next instruction. Takes no argument.

Others keyword have no meaning in BurstAT or have no assembly support. They are disabled: `auto`, `double`, `float`, `register`, `volatile`.
For future implementation these keywords can be added: `case`, `char`, `const`, `default`, `enum`, `extern`, `int`, `short`, `sizeof`, `signed`, `static`, `struct`, `switch`, `typedef`, `union`, `unsigned`.

### Macros
Some special features can be enabled/disable via preprocessor directives:
* `#include APIFunctions [true/false/1/0/]`: Can make Burstcoin API functions available for use as functions. Default value is `false`. Can be enabled by declaring it with empty argument, `true` or `1`. Function names follow the [ciyam at documentation](https://ciyam.org/at/at_api.html).
* `#pragma enableRandom [true/false/1/0/]`: Makes jumps and conditionals jumps receive a random value. Default value is `false`, so jumps id have an increasing number starting with 1.
* `#pragma max_auxVars N`: Used to tell compiler how many auxiliary variables will be available (they are used as registers). Default value is `5`, min value is `1` and max is `10`. If you are under memory pressure, try to reduce to minimal necessary for compiling. Simple contracts will use around 2 values, but this number depends on nested operations.
* `#pragma reuseAssignedVar [true/false/1/0/]`: When set, compiler will try to use a variable on left sign of and `Assignment` as a register. If variable is also used on right side, the compiler will not reuse it. This can save one assembly instruction for every expression used! Default value is `true` and it is highly recomended to maintain it active.
* `#pragma useVariableDeclaration [true/false/1/0/]`: Makes the compiler to check if all variables are declared before their use. Default value is `true`. When false, default assembler behaviour is create variables as they appears. Good to avoid typing errors. Must be used when using arrays.
* `#pragma version N`: Informs compiler which compiler's version the code was developed. Default value is `0` and there is no plan yet to have a version `1`.
* `#pragma warningToError [true/false/1/0/]`: All warnings to compiler errors. Default value is `true`. Warning messages begin with WARNING, other ones are actualy errors.

### Variables
At the moment, only `long` values are implemented. User can assign them with decimal values (default) `i=2;`, hexadecimal values `i=0xff;`, strings (up to 8 bytes) `msg="Hello!";` or Burst addresses `addr="BURST-297Z-EKMN-4AVV-7YWXP";`.
Arrays can be declared but shall be initialized element by element. They can only be used if `useVariableDeclaration` is true. Declaration of an array with 5 elements (0 to 4): `long arr[5];`. Use as in C: `arr[1]=4;`.
All variables are initialized with value `0` at the first time the contract is executed.
All variables are similar to `static` in C. So every time a function is called or AT receives a transaction, all variables will have their last value. To avoid this behaviour, declare variables setting them a initial value: `long i=0;`.
Global variables are available in all functions. Functions variables can only be used inside the function.
Variables declarations can not be inside other sentences, like `for (long i; i<10; i++)` or `if (a){ long i=0; ...}`.

### Functions
As available in C, the developer can make use of functions to make coding easier or reuse code from other projects. There is no need to put function prototypes at the beginning, the function can be used before it is declared, because theirs definitions are collected a step before the compiling process. Functions arguments and return values are passed using user stack (16 variables if only one page is set during smart contract deployment). Recursive functions are not allowed. There is a special function `void main(void)` that defines the starting point when a new transaction is received, but it is not obligatory. If no function is used (or only main() is used), there is no need for user stack pages.

### Global statements
All global statements are grouped at the begining of assembly code (even if after functions or end of file). When the contracted is executed first time, it does not begin at main function, but will start at the begining of file and run all global statements. If there is a main function, it will be then executed during this first run. If you stop execution in global statements (with `exit`), the main function will not be processed and it will not set starting point for new transactions (asm code `PCS`), leading your contract to finished state forever. So it is a good use for `halt`keyword.

### Designing tips
If you plan to use a number many times, declare it globaly and use in your code. This can save one instruction for each constant used and also make your code smaller. Example: `long n1=1; if (x==n1)...` But if you use it only a few times, or is under memory pressure, you can use constants at your code but making it bigger. The exception is Zero. Setting a variable to zero has an special assembly code. Comparisions against zero are also smaller than comparisions against variables. Comparisions against numbers are big. Try it to see assembly code genereated!

### Operators precedence
When two or more symbols with same precedence are in an expression, the operations will be evaluated from right to left. Example: `a=16/4/4` will be evaluated as `a=(16/(4/4))`

| Order | Symbol | Description |
| --- | --- | --- |
| 1 | `()`   `[]`   `{}` | Scope, array, statements group |
| 2 | `!`   `~`   `-`   `+`   `*`   `&`   `++`   `--` | Unary operators |
| 3 | `*`   `/`   `%` | Multiplication, division, modulo |
| 4 | `+`   `-` | Addition and subtraction |
| 5 | `<<`   `>>` | Bitwise shift left and right  |
| 6 | `<`   `<=`   `>`   `>=`   `==`   `!=` | Comparisons |
| 7 | `&`   `^`   `\|` | Bitwise AND XOR OR |
| 8 | `&&`   `\|\|`   `\|` | Logical AND  OR |
| 9 | `=`   `+=`   `-=`   `*=`   `/=`   `%=`   `&=`   `\|=`   `;=`   `^=`   `<<=`   `>>=` | Assignment operators|
| 10 | `,`  | Delimiter, comma |
| 11 | `;` `keywords`  | Terminator, semi, keywords |

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
| CodeCave | `(expr...)` | Surrounding expressions to indicate that they shall be evaluated before others operations. In special case could be a pointer representation, or part of other keywords as `if`, `for`, ... |
| CodeDomain | `{expr...}` | Surrounding expressions to indicate that it is a group of expressions |
| Delimiter | `,` | Use if you want to write two expressions on same statement |
| Terminator | `;` | Indicating the end of one statement |
| Macro | `#` | Preprocessor statement, ends at a newline `\n` character. |

### Internal object structure
If you plan to learn, inspect or modify the source, read the [Big_AST.md](https://deleterium.github.io/BurstAT-Compiler/try.html) file, where object structure is described.

## Notes
* Arrays representations will only work in Burstcoin client version 3 and above, for contracts created after a fork scheduled for 24/apr/2021. 
* Run testcases to check tested operations, optimizations and 2 failed cases.
* Please report a bug if any strange behaviour is found.
