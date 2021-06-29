TO BE UPDATED!!!
[Back](./)

# Javascript Object Structure in BurstAT-CC
Compiling process consists in organize the code into an AST (Abstract Syntax Tree). The objects and properties are explained bellow. A convention is that variables that are objects starts with a capital letter. The object types can be recursive to describe entire program. Array of objects are also used. To understand this text, keep in mind
* Objects will be named `Object {}`
* Array of objects will have indication of object type `array []: Object {}`
* Strings are surrounded `“string”`
* Numbers are surrounded `‘number’`
* Strings used as boolean `“true” / “false”`

##  Big_AST
This is the target object that is need by code generator.

![image](https://user-images.githubusercontent.com/54009773/116814018-0757ba80-ab2d-11eb-97f5-a65a9b76a326.png)

Properties:
* `Global{}`: All global statements and declarations.
* `functions[]: Function{}`: This array will have all functions declared in the program.

## Global
All global statements and declarations. Properties:
* `code[]: Token{}`: Temporary property containing tokens. It is deleted when translated to Sentence objects.
* `sentences[]: Sentence{}`: All global statements organized in Sentence objects.
* `declared_vars[]: Args{}`: Global variables.
* `macros[]: Token{}`: Grouped tokens typed "Macro".
* `APIFunctions[]: Function{}`: Prototypes for API functions. Exception to the rule, array of objects starting with capital letter.

## Function
Holds all information about one function.

![image](https://user-images.githubusercontent.com/54009773/116815050-2573e980-ab32-11eb-9c06-81bacdcfb525.png)

Properties:
* `name: “ ”`: Function name.
* `return_type: keyword`: Keyword for returning type (at moment `long` or `void`).
* `return_pointer: “yes”/”no”`: Indication if it is returning a pointer (at moment not used for checks).
* `arguments[]: Args{}`: Function arguments, variables declared during function declaration. If `void`, will have an empty array.
* `sentences[]: Sentence{}`: All function statements organized in Sentence objects.
* `declared_vars[]: Args{}`: Variables declared inside a function. Filled during shapeProgram() and addArgsToDeclaredVars() functions
* `code[]: Token{}`: Temporary property containing Tokens. It is deleted when translated to Sentence objects.

## Args
It is actually a Token typed "Varible" with some extra properties.

![image](https://user-images.githubusercontent.com/54009773/116814858-29533c00-ab31-11eb-9cb2-f2cd4ebd150f.png)

Properties specifc to Args object:
*	`declaration: keyword`: Keyword with type declaration (at moment only `long`).
*	`size: ‘ ’`: If variable is an array, size will be size declaration plus one! First assembly var is a pointer to array memory location.
* `dec_in_generator: “yes”/”no”`: Used during code generation to know if declaration is before first use.
* `dec_as_array: “yes”/”no”`: Indicate that variable is an array. This is used to avoid array pointer being override.
* `asmName: “ ”`: Variable name used in assembly code. If it is global, same name. But if function, will have function name as prefix. Ex: in function *test*, variable *counter* will be name *test_counter*.

## Sentence
Holds information about the least possible statement. Can be different types according the keyword used.

![image](https://user-images.githubusercontent.com/54009773/116815334-66b8c900-ab33-11eb-9338-36c87864f96e.png)

### Sentence.type: “phrase”
* `code[]: Token{}`: Temporary property. Deleted once translate to OpTree.
* `OpTree{}`: An entire AST with only unary/binary operations created by createSyntacticTree() function. Organized operations as will be in assembly code. Takes precedence of operators on account during the process. Will create an arithmetic result.

### Sentence.type: “if_endif”
* `id: “ ”`: Debug purposes only, not used.
* `line: ‘ ’`: Line the sentence starts.
* `condition[]: Tokens{}`: Temporary property. Deleted once translate to ConditionOpTree.
* `ConditionOpTree{}`: An entire AST with only unary/binary operations created by createSyntacticTree() function. Organized operations as will be in assembly code. Takes precedence of operators on account during the process. Will create a logical result (with a jump location).
* `if_true[]: Sentence{}`: Array with all statements that will be executed if the ConditionOpTree is evaluated to `true`.

### Sentence.type: “if_else”
All other properties already explained plus:
* `if_false[]: Sentence{}`: Array with all statements that will be executed if the ConditionOpTree is evaluated to `false`.

### Sentence.type: “while”
All other properties already explained plus:
* `while_true[]: Sentence{}`: Array with all statements that will be executed in loop while the ConditionOpTree is evaluated to `true`.

### Sentence.type: “do”
Very similar to `while` loop, but ConditionOpTree is evaluated at the end of loop.

### Sentence.type: “for”
All other properties already explained plus:
* `three_sentences[]: Sentence{}`: Array containing three sentences as expected in a for loop. First sentence is executed once at the start of loop (arithmetic evaluation), Second is a condition statement (logical evaluation), and Third is executed after `while_true` sentences and before a new evaluation of conditional.

# Program flow
## token_output = tokenizer(codeString);
Source code is splitted into simple tokens.
## parser_output = parser(token_output);
Simple tokens are translated into actually `Token {}` objects.
## ver_output = verify(parser_output);
Simple rules verification avoiding non-sense tokens combinations. Some tokens are also modified, so this step can not be skipped.
## Big_ast = shapeProgram(ver_output);
Statements are processed and Big_AST object is created with some temporary properties.
## Big_ast_opTree = bigastProcessSyntax(Big_ast);
Traverse the Big_ast received translating `Tokens {}` to `OpTree {}`. Big_ast_OpTree is almost ready.
## asmCode = bigastCompile(big_ast_opTree);
Some small modifications done and all sentences, functions and declarations translated into assembly code.

[Back](./)
