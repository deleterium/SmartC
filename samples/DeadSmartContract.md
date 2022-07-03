# Dead Smart Contract
Just a dead smart contract. ~~Any balance sent to this address will be included as fee on the next block. Useful to tip a random miner.~~ Signum Rainbow Hard Fork (june 2022) introduced a change where the contract fees are burned, so this contract now only can be used for burning Signa. Online at `S-DEAD-DTMA-RY8B-FWL3D`

## Source code
Very simple source, can be compiled and deployed by SmartC if changed C to Assembly source code.

```asm
^program name DeadSmartContract
^program description This is a dead smart contract. Any balance sent to this address will be included as fee on the next block.
^program activationAmount 0

^comment This instruction causes code stack underflow on first execution
RET
```
