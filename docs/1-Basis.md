[Back](./)

## Language rules
This project aims to be as close to C as possible. But given special characteristics in Signum assembly language (derived from CIYAM) some differences will occur.

### Comments
As C, can be one line `//` or multi-line `/* .... */`;

### Keywords
Some keywords have the same meaning and use in C: `asm`, `break`, `continue`, `default`, `do`, `else`, `for`, `goto`, `if`, `long`, `return`, `struct`, `void`, `while`. Note differences for keywords:
* `const`: Actually this will tell compiler to set a value to a variable at the contract creation. No problem setting it a value and then changing it later. It can be used during variable declaration or later, but it can be set only once. Using const can reduce the number of codepages of your program. Examples: `const long i=5;` to seta long; `long a[4]; const a[0]=5;` to set values for array.
* `sizeof`: Usefull to get structs sizes. Return value will be the number of longs that the variable/type needs. One long is 8 bytes. Arrays sizes are one long greater than the length, because the first index is used to store the array starting location (a pointer). Pointers sizes are always 1.
* `switch`: The standard C is fully supported. One addition is that switch expression can be `true` or `false`, and the cases will be evaluated to match the desired result.
* `case`: The standard C is fully supported, featuring also that expressions can be added using parenthesis. If standard switch is used, an expression can be used: `switch (a) { case (b/2): ... }` and it will be evaluated as `if (a == b/2) ... `. If the logical switch statement is used, then it is possible to add a logical expression in `case` using parenthesis, in the form `switch (true) { case (a>5): ...}` and it will be evaluated as `if (a>5) ...` 

There are also additional keywords:
* `fixed`: Declares a variable that is a fixed point number. All fixed numbers have 8 decimals, so it is handyful to make Signa calculations with it. It supports positives values from 0.00000001 to 92,233,720,368.54775807 and negative from -0.00000001 to -92,233,720,368.54775808. They are internally a signed 64-bit number.
* `sleep`: Puts the contract in 'sleep' mode and resumes contract execution on next block. Alternativelly it can have an argument to indicate the number of blocks to sleep and the argument can be an expression. This tree sentences have the same result `sleep;`, `sleep 0;`, and `sleep 1;`, but it is prefered the first one because the instruction is smaller.
* `exit`: Puts the contract in 'stop' mode and set program to restart from main function ('finished' mode). It will be inactive until a new transaction is received. Once a tx is received, it will start execution at `void main(void)` function. If main function is not defined, it will start again from beginning of code. `exit` takes no argument. If contract activation amount is zero, contract will resume execution on next block.
* `halt`: Puts the contract in 'stop' mode. It will be inactive until a new transaction is received, then it will resume execution at next instruction. It takes no argument. If contract activation amount is zero, contract will resume execution on next block.

Others keyword have no assembly support. They are disabled: `auto`, `double`, `float`, `register`, `volatile`. For future implementation these keywords can be added: `char`, `enum`, `extern`, `int`, `short`, `signed`, `static`, `typedef`, `union`, `unsigned`.

### Preprocessor
Some special features can be enabled/disable via preprocessor directives. Check chapter 1.2.


### Variables
Variables can be `long`, `fixed` or pointers. User can assign them:
* With decimal values: `i=2;` for longs or `i=2.0;` for fixeds,
* Hexadecimal values: `i=0xff;` for longs and not allowed for fixeds
* Strings (up to 8 bytes) `msg="Hello!";` or Signum addresses `addr="S-297Z-EKMN-4AVV-7YWXP";` (also valid starting with BURST or TS).
Variables can be assigned during their declaration.
Arrays can be declared but can be initialized only at a later instruction. Declaration of an array with 5 elements (0 to 4): `long arr[5];`. Use as in C: `arr[1]=4;`. Multi-long values can be set `arr[]='This is a text message';`. To clear the entire array: `arr[]=0;`. It is possible to get an array length a member operation: `size = arr.length;` 
Structs use same notation in C. Structs pointers can also be used. To access a member, use `.` or `->` depending if struct is already allocated in memory  or if it is a pointer to the memory location. Arrays of structs, arrays inside structs and recursive pointer definition are also supported.
All variables are initialized with value `0` at the first time the contract is executed, unless other value is set by `const` statement.
All variables are similar to `static` in C. So every time a function is called or the smart contract receives a transaction, all variables will keep their last value. To avoid this behavior in functions, declare variables setting them a initial value: `long i=0;`.
Global variables are available in all functions. Functions variables can only be used inside the function.
Variables declarations can be inside other sentences, like `for (long i; i<10; i++)` or `if (a){ long i=0; ...}`, but their scope can only be 'global' or 'function', in other words, the result is the same as declaring variables at the program start (if global variables) or at the function start (if function variables).

### Implicit types casting
The compiler will convert numbers and variables between fixed and long if used in binary operators. Most of times long will be converted to fixed, unless there is an assigment and the left side is long. In this case (=, +=, -=, ...) fixed values will be transformed into long. Data can be lost in this transformation, so keep an eye on it!

### Functions
As avaliable in C, the developer can make use of functions to make coding easier or reuse code from other projects. There is no need to put function prototypes at the beginning, the function can be used before it is declared, because their definitions are collected a step before the compiling process. Functions arguments and return values are passed using user stack. Recursive functions are allowed but developer must set manually and carefully a new size for "user stack pages" thru preprocessor directives. There are two special functions: `void main(void)` explained before and `void catch(void)` explained at **Contract states** topic. It is not obligatory to use them.
Functions can return also arrays and structs; the returning values can be used directly: example `if ( arrFn(a)[2] == 25 )` or `b = structFn(a)->value;`

### Built-in functions
In 2022 it was introduced two new specific instructions. They are coded in SmartC from version 2.0 as built-in functions, so no declaration is needed to use them. Check chapter 1.5.

### Global statements
All global statements are grouped at the beginning of assembly code (even if after functions or end of file). When the contract is executed first time, it does not begin at main function, but will start at the beginning of file and run all global statements. If there is a main function, it will be then executed during this first run. If you stop execution in global statements (with `exit`), the main function will not be processed and the starting point for next transactions will be the start of code. In this case (not using main function) use `halt` keyword to wait next transaction.

### Contract states
* Finished: Contract execution ended at a `exit` instruction or at the end of 'main' function. On next activation it will start at 'main'.
* Stopped: Contract execution ended at a `halt` of `sleep` instruction. On next resume it will start just after current point.
* Frozen: Execution was suspended because there was no more balance in contract account (no gas!). To resume execution, contract must receive a new transaction with an amount greater or equal its minimum activation. If transaction is below this amount, it will stay frozen even with some balance.
* Dead: Execution raised one of these exceptions: 1) division by zero; 2) trying to read/set a variable outside memory range; or 3) stack overflow/underflow for user/code stack. The default behaviour is all contract balance to be distributed as fee for current block forger. Also any next transaction to that dead contract will be transformed in fee. To avoid this situation, it is possible to define a special function `void catch(void)`. When the exception is found, the execution will jump to 'catch' function and a new entry point for next incoming transactions will be set. A use case for 'catch' function is to send all balance to creator to avoid losing contract balance. When using 'catch' function the contract will never reach dead state.

### Designing tips
If you plan to use a number many times, declare it globally with `const` keyword and name it with `nVALUE`: example `const long n65535=65535`. This can save one instruction for each use and also make your code smaller. But if you use it only a few times, or is under memory pressure, you can use constants at your code but making machine code bigger. For big programs it is more common be under codesize pressure, so this is a great exchange. The exception is Zero. Setting a variable to zero has an special assembly code. Comparisons against zero are also smaller than comparisons against variables. Comparisons against numbers are long assembly instrunctions. Try it to see assembly code genereated! If you are under memory pressure (or want to code smallest code possible) use global variables, because exchanging variables thru functions will cause they to be declared twice, pushed onto stack and popped at function.

### Main differences from C
* signed or unsigned: There is no difference between signed and unsigned longs. The rule is that all values behave as signed when comparing values or during arithmetic operations, but treated as unsigned during bit operations. Keep this in mind if developing with gcc.
* Precedence of operators: Rules are simpler in SmartC. Note differences in special for bitwise OR. Check assembly code or use parenthesis if in doubt.
* static: Variables by default are static in SmartC. Set values at the start of function if needed. Their values will not be changed in other functions unless variable is global.
* Initial value: By default all values are set to zero ar contract creation, so it is not need to initialize them with zero when needed.
* Variable scope: Although variables can be declared inside scopes, after compilation there will be only two types: Global variables and Function scope variables.
* Global statements: In C it is fobidden to make assigments and other sentences as loops and conditionals globally. SmartC allows this behaviour.
* register: By default there are 3, from r0..r2. They can be used without declaration, but inspect assembly code to ensure they are not changed during other instructions. Different from registers in modern CPUs, these registers in SmartC are just regular variables created and used by compiler.

## Notes
* Run testcases to check tested operations. It shall be no failed cases.
* Please report a bug if any strange behavior is found.

[Back](./)
