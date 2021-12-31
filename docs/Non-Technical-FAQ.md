[Back](./)

# Non-Technical frequently asked questions

### SmartC is written in what programming language?
It is written in Typescript to take advantage of strong typing for objects, then it is transpiled to Javascript to run entirely on browser.

### Why did you write the compiler in Typescript?
It is very convenient for users, so compilation process can be done on a regular web page, no need to install the software. Also Typescript has many features to work with objects, the basis for compilation process.

### Why to create a new compiler for signum if there is already one?
I would like to know more about compilers and compilation process. I started slowly with one simple Assembly project (BurstAT/SimpleIDE). Then, more I learned, easier was to make a better compiler. The project is my hobby, so I can work on it without pressure, doing the best I can.

### What is the language for smart contracts source code?
The language is similar to C but there are diferences. Actually a program for SmartC will only compile in SmartC, so it is possible to call this language as SmartC. When saving my programs, I use to save as **name.smartc.c** so I can get C syntax highlight in others editors or IDE's.

### Why did you choose C language to smart contracts?
It is simple and not so hard to create a compiler. Also it was my first programming language and I like it! The language is also powerfull and close to assembly language, so the compiled smart contract is very optimized and this feature is indispensable for complex smart contracts.

### Can SmartC compile code from SmartJ?
No, they are different compilers for contracts source code in different programming languages.

### How much cost to deploy a contract?
It depends on contract size. When you compile code smartC will show the and set deploy fee to the minimun necessary. The biggest contract possible is around 2.5 signa. Most of them are less than 1 signa and small ones are around .5 signa. This fee is charged only one time at deployment.

### How much cost to run a contract?
It is necessary to pay a little fee for every instruction processed. The value is low but big contracts will build up this charge. So it can vary from 0.000735 to more than one hundred signa in one block!

### How to avoid the contract to run out of balance during one run?
Just set a higher minimum activation amount, to ensure the contract will have balance (or gas) to run until the end. If a transaction arrives with some amount below this minimum amount, it will not be processed by the contract, but the balance sent will increase contract balance.

### What happens if I send a value higher than activation amount to the contract?
The contract will be activated in next block and do what it is programed to do. The value above the activation amount will be the value that the contract reads as transaction amount received.

[Back](./)
