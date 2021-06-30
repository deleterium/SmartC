[Back](./)

## Language rules
Expressions are C-like and evaluated from left to right. Rules are simpler than in C, so complexes expressions may have different evaluations from C, but simple expressions shall have same outcome given special characteristics in Signum assembly language (derived from CIYAM).

### Comments
As C, can be one line `//` or multi-line `/* .... */`;

### Keywords
Some keywords have the same meaning and use in C: `asm`, `break`, `continue`, `do`, `else`, `for`, `goto`, `if`, `long`, `return`, `struct`, `void`, `while`. Note differences for keywords:
* `const`: Actually this will tell compiler to set a value to a variable at the contract creation. No problem setting it a value and then changing it later. It can be used during variable declaration or later, but it can be set only once. Using const can reduce the number of codepages of your program. Examples: `const long i=5;` to seta long; `long a[4]; const a[0]=5;` to set values for array.

There are also additional keywords:
* `sleep N`: Puts the contract in 'sleep' mode during N blocks. Argument N must be specified and can be an expression. `sleep 1;` makes your contract to stop being processed at current block and resumes it at next one.
* `exit`: Puts the contract in 'stop' mode and set program to restart from main function ('finished' mode). It will be inactive until a new transaction is received. Once a tx is received, it will start execution at `void main(void)` function. Takes no argument. If contract activation amount is zero, contract will resume execution on next block.
* `halt`: Puts the contract in 'stop' mode. It will be inactive until a new transaction is received, then resume execution at next instruction. Takes no argument. If contract activation amount is zero, contract will resume execution on next block.
* Side note: There also state 'frozen' when a contract execution is suspended because there is no more balance in contract account (no gas!) and 'dead' when there is an exception like 1) division by zero; 2) trying to read/set a variable outside memory range; 3) stack overflow for user/code stack. When a contract dies, all balance is lost forever.

Others keyword have no assembly support. They are disabled: `auto`, `double`, `float`, `register`, `volatile`.
For future implementation these keywords can be added: `case`, `char`, `default`, `enum`, `extern`, `int`, `short`, `sizeof`, `signed`, `static`, `switch`, `typedef`, `union`, `unsigned`.

### Macros
Some special features can be enabled/disable via preprocessor directives:
* `#program name YourProgramName`: Set program's name. Only regular letters and numbers allowed, max 30 chars in length.
* `#program description Your program description`: Set program's description. No new lines and max length is 1000 chars.
* `#program activationAmount 100000000`: Set program's activation amount in NQT (1 Burst = 100000000 NQT). If an incoming transaction has an amount is less than this value, it will not be processed by program (but the amount will be received!). Set a low value but bigger than worst case amount needed to run in your program. If set too low, your program will be frozen during execution (out of gas). If set too high, program balance will be high after execution (unburned balance). Remember to handle this case if creating serious program!
* `#include APIFunctions [true/false/1/0/]`: Can make Burstcoin API functions available for use as functions. Default value is `false`. Can be enabled by declaring it with empty argument, `true` or `1`. Function names follow the [ciyam at documentation](https://ciyam.org/at/at_api.html).
* `#pragma enableRandom [true/false/1/0/]`: Makes labels for jumps and conditionals receive a random value. Default value is `false`. Default behaviour is labels having an increasing number starting with 1 (number is base 36).
* `#pragma enableLineLabels [true/false/1/0/]`: Adds line number to labels in assembly. Only usefull for debug purposes. Default value is `false`.
* `#pragma globalOptimization [true/false/1/0/]`: Adds a final step to the compiler where generated code will be optimized. Default value is `false` until more test are done. Makes generated assembly code even less readable, removing labels not referenced by jumps.
* `#pragma maxAuxVars N`: Used to tell compiler how many auxiliary variables will be available (they are used as registers). Default value is `5`, min value is `1` and max is `10`. If you are under memory pressure, try to reduce to minimal necessary for compiling. Simple contracts will use around 2 values, but this number depends on nested operations.
* `#pragma maxConstVars N`: Compiler will create variable from 1 to maxConstVars. Variables will be named 'n1', 'n2', ... 'n10'. It is very usefull to use togheter to 'globalOptimization', because global optimization will change all numbers references to these variables and optimize code, making code much much smaller! Default min value is `0` (deactivated) and max is `10`.
* `#pragma reuseAssignedVar [true/false/1/0/]`: When set, compiler will try to use a variable on left sign of and `Assignment` as a register. If variable is also used on right side, the compiler will not reuse it. This can save one assembly instruction for every expression used! Default value is `true` and it is highly recomended to maintain it active.
* `#pragma useVariableDeclaration [true/false/1/0/]`: Makes the compiler to check if all variables are declared before their use. Default value is `true`. When false, default assembler behaviour is create variables as they appears. Good to avoid typing errors. Must be on when using arrays and structs.
* `#pragma version N`: Informs which compiler's version the code was developed. Must be set if not using development version.
* `#pragma warningToError [true/false/1/0/]`: All warnings to compiler errors. Default value is `true`. Warning messages begin with WARNING, other ones are actualy errors.

### Variables
At the moment, only `long` values are implemented. User can assign them with decimal values (default) `i=2;`, hexadecimal values `i=0xff;`, strings (up to 8 bytes) `msg="Hello!";` or Signum addresses `addr="S-297Z-EKMN-4AVV-7YWXP";` (or starting with BURST or TS). Long values can be assigned during their declaration.
Arrays can be declared but shall be initialized element by element. They can only be used if `useVariableDeclaration` is true. Declaration of an array with 5 elements (0 to 4): `long arr[5];`. Use as in C: `arr[1]=4;`. Multi-long values can be set `arr[]='This is a text message';` but not during declaration.
Structs use same notation in C. Structs pointers can also be used. To access a member, use `.` or `->` depending if struct is already allocated in memory  or if it is a pointer to the memory location. Arrays of structs and arrays inside structs are also supported, but not nested structs.
All variables are initialized with value `0` at the first time the contract is executed, unless value was set by `const` statement.
All variables are similar to `static` in C. So every time a function is called or the smart contract receives a transaction, all variables will have their last value. To avoid this behavior, declare variables setting them a initial value: `long i=0;`.
Global variables are available in all functions. Functions variables can only be used inside the function.
Variables declarations can not be inside other sentences, like `for (long i; i<10; i++)` or `if (a){ long i=0; ...}`.

### Functions
As available in C, the developer can make use of functions to make coding easier or reuse code from other projects. There is no need to put function prototypes at the beginning, the function can be used before it is declared, because theirs definitions are collected a step before the compiling process. Functions arguments and return values are passed using user stack (16 variables if only one page is set during smart contract deployment). Recursive functions are not allowed. There is a special function `void main(void)` that defines the starting point when a new transaction is received, but it is not obligatory. If no function is used (or only main() is used), there is no need for user stack pages.

### Global statements
All global statements are grouped at the beginning of assembly code (even if after functions or end of file). When the contracted is executed first time, it does not begin at main function, but will start at the beginning of file and run all global statements. If there is a main function, it will be then executed during this first run. If you stop execution in global statements (with `exit`), the main function will not be processed and it will not set starting point for new transactions (asm code `PCS`), leading your contract to finished state forever. In this case (not using main function) use `halt`keyword to wait next transaction.

### Designing tips
If you plan to use a number many times, declare it globally and use in your code. This can save one instruction for each constant used and also make your code smaller. Example: `long n0xff=0xff; if (x==n0xff)...` But if you use it only a few times, or is under memory pressure, you can use constants at your code but making it bigger. For big programs it is more common be under codesize pressure, so this is a great exchange. The exception is Zero. Setting a variable to zero has an special assembly code. Comparisons against zero are also smaller than comparisons against variables. Comparisons against numbers are long assembly instrunctions. Try it to see assembly code genereated! If you are under memory pressure (or want to code smallest code possible) use global variables, because exchanging variables thru functions will cause they to be declared twice, pushed onto stack and popped at function.

## Notes
* Run testcases to check tested operations. It shall be no failed cases in red.
* Please report a bug if any strange behavior is found.

[Back](./)
