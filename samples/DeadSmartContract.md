# Dead Smart Contract
Just a dead smart contract. Any balance sent to this address will be included as fee on the next block. Useful to tip a random miner. Online at `S-DEAD-DTMA-RY8B-FWL3D`

## Source code
Very simple source, can be compiled and deployed by SmartC if changed C to Assembly source code.

```asm
^program name DeadSmartContract
^program description This is a dead smart contract. Any balance sent to this address will be included as fee on the next block.
^program activationAmount 0

^comment This instruction causes code stack underflow on first execution
RET
```
