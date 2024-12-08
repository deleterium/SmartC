## [v2.3](https://github.com/deleterium/SmartC/tree/v2.3) (2024-12-08)

[Commits](https://github.com/deleterium/SmartC/commits/v2.3)
* Feat: More detailed warnings and errors.
* New keyword 'register' as modifier for variables. They are scoped and use a free register as variable.
* Refactored preprocessor and code generation.

## [v2.2](https://github.com/deleterium/SmartC/tree/v2.2) (2024-02-12)

[Commits](https://github.com/deleterium/SmartC/commits/v2.2)
- Added getAccountBalance() support by @Wekuz/@deleterium
- Compiler now warns when using not initialized variables
- Changed strategy for functions passing and returning values (saving use of user stack)
- New keyword `inline` for functions declaration (saving use of code stack)

## New Contributors
* @Wekuz made their first contribution in https://github.com/deleterium/SmartC/pull/31

## [v2.1](https://github.com/deleterium/SmartC/tree/v2.1) (2022-08-06)

[Commits](https://github.com/deleterium/SmartC/commits/v2.1)
- Fix on **severe issue in sendQuantity** built-in function (issue #24)
- Fix implementation for optimization level 3 (should be stable now)
- New contract **samples LiquidityPool** and **WheelOfSigna**
- New built-in functions `readShortMessage` and `sendShortMessage` to optimize code for short messages
- Other minor bug fixes and code de-smelling

## [v2.0](https://github.com/deleterium/SmartC/tree/v2.0) (2022-07-03)

[Commits](https://github.com/deleterium/SmartC/commits/v2.0)

- **Support all new features from Signum Rainbow Hard Fork**
- New 42 built-in functions: **easy use of Signum API**
- Documentation updated with refactored examples, devs must read it again
- **Fixed point numbers** to handle balance, much easier in calculations
- Checks for **type castings** are stronger and issuing warnings for implicit conversions
- Optimization level 3 uses VM to trace variables values (beta version, not default)
- Showing many errors after failed compilations (if possible)
- Many changes in `#pragma` and `#program` to allow **integration with SC-Simulator**

## [v1.0](https://github.com/deleterium/SmartC/tree/v1.0) (2022-01-16)

[Commits](https://github.com/deleterium/SmartC/commits/v1.0)

- Massive code refactoring, decreasing code cognitive complexity. More than 80 commits
- Changed strategy for code optimization. Better and safer
- Added **switch :: case :: default** statement
- Added **sizeof** keyword
- Allow use of array of structs

## [v0.3](https://github.com/deleterium/SmartC/tree/v0.3) (2021-10-16)

[Commits](https://github.com/deleterium/SmartC/commits/v0.3)

- Source code refactored from Javascript to Typescript
- Included inline comments on interfaces and types
- Massive improvement on compiler error messages
- Functions can return struct pointer
- Recursive functions
- Support for using functions with modifiers `Array` or `Member` Ex: *a = test()->next;*
- Improved rules for pointer variables verification
- Added void pointer variables
- Added property **.length** to get array size
- Special function **void catch(void)** to handle execution exceptions
- Macro 'userStackPages' and 'codeStackPages' for fine tuning memory parameters
- Struct can have recursive definition of its pointer
- More optimizations on constant variables (thru variables named nNUMBER)
- Added Machine Code Hash Information 
- Improved preprocessor with **#ifdef**, **#ifndef**, **#else**, **#endif** directives
- Copy to clipboard button for easy use with SC-Simulator
- Added macro 'outputSourceLineNumber' to add verbosity in assembly generated code
- Project integration with SonarCloud and fix security vulnerabilities in regex expressions
- Increased test coverage for wrong source code


## [v0.2](https://github.com/deleterium/SmartC/tree/v0.2) (2021/07/23)

[Commits](https://github.com/deleterium/SmartC/commits/v0.2)

- Syntax highlight for source code textarea
- Fine tuning globalOptimization
- Added **#define** and **#undef** preprocessor directives.

## [v0.1](https://github.com/deleterium/SmartC/tree/v0.1) (2021/06/30)

[Commits](https://github.com/deleterium/SmartC/commits/v0.1)

- Initial working release

## v0 (2021/04/06)


- [Initial release](https://github.com/deleterium/SmartC/tree/bb3edafcf0d3db0153201b594157555d686a9962) in Github
