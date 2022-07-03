**DEPRECATION NOTICE:**

This contract may be or not be compatible with SmartC version greater or equal 2 because Signum Rainbow Hard Fork broke some compatibilities. Test before use or convert the API calls to new built-in functions.

# Configurable timer
The contract will act as a timer for any incoming transactions, dispatching all balance to target address on next block that is multiple of a configurable number. Creator must configure target address with a message.

## How to use
* Deploy the contract
* Creator must send a binary message with the address of target (swap endianess 8-bytes for text message)
* At any incoming transaction the balance will be forwarded to target address on next block that is multiple of the chosen number.

## Configure target on deployment
This would make the contract much simpler. The problem is that when I'm deploying a contract that depends of other to be its timer, it is not possible to know the target address before creating the contract. So I can:
* deploy timer contract
* get timer contract address
* add timer address into the main contract and deploy the main contract
* get main contract address
* set up the target of timer contract to be the main contract

## Deployments
* `TS-ETGR-9HEF-KZG2-BQ6Y6` in Testnet.

## Source code
```c
#define MULTIPLE 5

#program name MultipleOf
#program description Creator deploys the contract and send a binary\
 message with target address. The contract will act as a timer for\
 any incoming transactions, dispatching all balance to target address on\
 next block that is multiple of MULTIPLE.
#program activationAmount 1_1000_0000

/* Do not change below here */

#include APIFunctions
#pragma version 1.0

const long multiple = MULTIPLE, n32 = 32;
long lastTimestamp, sleepBlocks, creator;

B_To_Address_Of_Creator();
creator = Get_B1();

// phase 1: wait to receive target address from creator
do {
    A_To_Tx_After_Timestamp(lastTimestamp);
    if (Get_A1() == 0) {
        halt;
        continue;
    }
    lastTimestamp = Get_Timestamp_For_Tx_In_A();
    B_To_Address_Of_Tx_In_A();
    if (Get_B1() == creator) {
        Message_From_Tx_In_A_To_B();
        break;
    }
} while (true);

// phase 2: Endless timer transaction
do {
    sleepBlocks = multiple - ((Get_Block_Timestamp() >> 32) % multiple);
    if (sleepBlocks != multiple) {
        sleep sleepBlocks;
    }
    Send_All_To_Address_In_B();
} while (true);
```

## Tests for simulator

* Block 3 -> Activation setting target address to TS-XL84-VQCD-BGFR-EUHW8  (id 14083313339354499266 = 0xC371FADD94BEC8C2 = "messageHex": "c2c8be94ddfa71c3"). Verify message sent to target on block 5.
* Block 11 -> Sending transaction to activate contract. Verify message sent to target on block 15.
* Block 17 -> Sending transaction to activate contract. Verify message sent to target on block 20.
* Block 23 -> Sending transaction to activate contract. Verify message sent to target on block 25.
* Block 29 -> Sending transaction to activate contract. Verify message sent to target on block 30.
* Block 35 -> Sending transaction to activate contract. Verify message sent to target on block 40.

```json
[
  {"sender": "555n","recipient": "999n","amount": "2_0000_0000n","blockheight": 3, "messageHex": "c2c8be94ddfa71c3"},

  {"sender": "0xAABBn","recipient": "999n","amount": "2_0000_0000n","blockheight": 11},
  {"sender": "0xAABBn","recipient": "999n","amount": "2_0000_0000n","blockheight": 17},
  {"sender": "0xAABBn","recipient": "999n","amount": "2_0000_0000n","blockheight": 23},
  {"sender": "0xAABBn","recipient": "999n","amount": "2_0000_0000n","blockheight": 29},
  {"sender": "0xAABBn","recipient": "999n","amount": "2_0000_0000n","blockheight": 35}
]
```
