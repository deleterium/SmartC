# SmartC
> Write C smart contracts for signum network. Compile in your browser. Written in Typescript/Javascript.

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=deleterium_SmartC&metric=alert_status)](https://sonarcloud.io/dashboard?id=deleterium_SmartC)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=deleterium_SmartC&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=deleterium_SmartC)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=deleterium_SmartC&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=deleterium_SmartC)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=deleterium_SmartC&metric=coverage)](https://sonarcloud.io/dashboard?id=deleterium_SmartC)

## Objective
To empower developers, allowing them to create complex and highly optimized smart contracts.

# Setup
This library can be obtained through npm:
```
npm install smartc-signum-compiler
```

The stable version is released under tag `@latest` and the development under `@next`.

# Usage

## Web User Interface
A web user interface project is available at https://github.com/deleterium/smartc-web-ui If you want just to code with SmartC use https://deleterium.info/SmartC/

## Documentation / FAQ / Lessons
Docs files can be found in this repo, at `doc` folder.

## Node
```ts
import { SmartC } from 'smartc-signum-compiler';

//  Example: Simple compilation test
try {
    const startUpTest = new SmartC({
        language: 'C',
        sourceCode: '#pragma maxAuxVars 1\nlong a, b, c; a=b/~c;'
    })
    startUpTest.compile()
    const assemblyText = startUpTest.getAssemblyCode()
    const machineObject = startUpTest.getMachineCode()
    // Do something
} catch (e) {
    return "Compilation error: " + e.message
}
```

## Browser
Import the minified javascript file. SmartC will be imported as global.
```html
<script src="https://cdn.jsdelivr.net/npm/smartc-signum-compiler@latest/dist/smartc.min.js"></script>
```

Then in your javascript file, just use it:
```js
//  Example: Simple compilation test
try {
    const startUpTest = new SmartC({
        language: 'C',
        sourceCode: '#pragma maxAuxVars 1\nlong a, b, c; a=b/~c;'
    })
    startUpTest.compile()
    const assemblyText = startUpTest.getAssemblyCode()
    const machineObject = startUpTest.getMachineCode()
    // Do something
} catch (e) {
    return "Compilation error: " + e.message
}
```

## Changelog
Find [here](https://deleterium.github.io/SmartC/CHANGELOG) major upgrades between releases.

## Support
Did you like the project? Consider be owner of one SmartC NFT keyword. The smart contract is online at S-NFT2-6MA4-KLA2-DNM8T. More information on  [NFTv2 website](https://deleterium.info/NFTv2/). My address: S-DKVF-VE8K-KUXB-DELET.

## Social media
Join [SmartC Compiler](https://discord.gg/pQHnBRYE5c) server in Discord to stay tuned for news or ask questions.
