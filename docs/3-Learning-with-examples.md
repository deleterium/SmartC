[Back](./README.md)

# Lessons and examples to create smart contracts in Signum network
Following guide will show examples with progressive complexity and comments how they works. It is expected that you know C language. It is a good idea to read all docs from SmartC. If you plan to be expert, read ciyam official documentation available [here](https://ciyam.org/at/) and Signum [SIP-37](https://github.com/signum-network/SIPs/blob/master/SIP/sip-37.md), [SIP-38](https://github.com/signum-network/SIPs/blob/master/SIP/sip-38.md), [SIP-39](https://github.com/signum-network/SIPs/blob/master/SIP/sip-39.md) for major changes introduced in JUN/2022. There is also some videos compiling these examples at my [personal Youtube channel](https://www.youtube.com/playlist?list=PLyu0NNtb1eg3Gcg2JCrOle8MjtuFPb-Gi).

## Basic contracts

### Always Running, doing nothing
```c
#pragma version dev

#program name alwaysRuning
#program description Always Running, doing nothing
#pragma maxAuxVars 1

while (true) {
    sleep 1;
}
```
* This contract has no functions, API, nor variable declared.
* Macro `#pragma version` is very important to pin source code with a compiler version. It is to ensure the compiled code will result in the same machine code. Not needed if working in 'dev' branch.
* Macro `#pragma` can set some specific behaviour of compiler, in this case it will set compiler to use only one auxiliary variable (they act as registers for operations). Default value is 3, but here we will use the minimum allowed.
* Only one global statement, `while (true)` is used to make an infinite loop.
* Keyword `sleep 1` will stop the contract process at current block and resumes execution at the next block.
* It will keep in this loop until there is no more balance at the contract, then it will be frozen until it receives a new activation.

### Counting transactions, easy way
```c
#pragma version dev

#program name CountingTxDelayed
#program description Counting transactions, easy way

void main(void) {
    long counter;
    counter++;
}
```
* The `main` function is the entry point when contract gets an activation. Contract can be finished via `return`, `exit` or closing main function.
* If two transactions are received by this contract, the first one will be processed and the contract will enter finished state. In the next block it will be activated again with the second transaction that was not processed in previous block height. This means, if this contract receives 10 messages at some block, it will take 10 blocks to finish counting them.
* When the contract is created, all memory is set to zero. So variable counter will start from zero and keep increasing every block it has received TXs.

### Counting transactions without delay.
```c
#pragma version dev

#program name CountingTx
#program description Counting transactions without delay
#include APIFunctions

void main(void) {
    while (getNextTxDetails()) {
        // Process transaction in a specific function
        processTX();
    }
    // Optional function to make something after all transactions processed
    // clean_up();
}

void processTX(void){
    const long counter = 10;
    counter++;
}

struct TXINFO {
   long timestamp,
        sender,
        amount,
        message[4];
} currentTX;

/* Checks if there is a new transaction. If there is, fill currentTX struct
   and returns true. Returns false otherwise. */
long getNextTxDetails(void) {
    // Do not change the value of currentTX.timestamp on your code!!!
    A_To_Tx_After_Timestamp(currentTX.timestamp);
    if (Get_A1() == 0) {
        return false;
    }
    currentTX.timestamp = Get_Timestamp_For_Tx_In_A();
    currentTX.amount = Get_Amount_For_Tx_In_A();
    Message_From_Tx_In_A_To_B();
    currentTX.message[0]=Get_B1();
    currentTX.message[1]=Get_B2();
    currentTX.message[2]=Get_B3();
    currentTX.message[3]=Get_B4();
    B_To_Address_Of_Tx_In_A();
    currentTX.sender = Get_B1();
    return true;
}
```
* To get details from incoming transaction, we will use the API functions. Tell the compiler you will need them with macro `#include APIFunctions`.
* It is presented the function `getTxDetails()` that will get all details from incoming message to a global variable `currentTX`. This struct has members to store information that can be retrieved from a TX. Remember to comment values not needed you your code, because every API call costs 0.01 signa to be executed.
* The `main` function will loop thru all TX received in same block. When the API `A_To_Tx_After_Timestamp` returns timestamp zero or -1, it means there is no more pending transactions, so the contract can be finished.
* Counter value will be set to 10 during contract deployment (keyword const!). Then it will be increased for each new valid tx received.
* Global variable is used because it needs less instructions to make same thing. It is important to note, because every assembly instructions will be charged a fee of 0.001 signa for execution and there are limitations for code and memory sizes when deploying an smart contract in the blockchain.

### Sending signa
```c
#pragma version dev

#program name SendSigna
#program description Using a function to send signa.
#program activationAmount 0.3

#include APIFunctions
#include fixedAPIFunctions

B_To_Address_Of_Creator();
long creatorId = Get_B1();

void main(void) {
    const fixed cashBackPercent = 0.05;
    while (getNextTxDetails()) {
        if (currentTX.amount > 5.2) {
            // If TX is bigger than 5.2 signa, refund 5% to sender
            // CashBack to sender.
            Set_B1_B2(currentTX.sender, 0);
            F_Send_To_Address_In_B(currentTX.amount * cashBackPercent);
            // Remaining to creator
            Set_B1_B2(creatorId, 0);
            F_Send_To_Address_In_B(currentTX.amount * (1.0 - cashBackPercent));
        } else {
            // Low amount, no cashBack.
            Set_B1_B2(creatorId, 0);
            F_Send_To_Address_In_B(currentTX.amount);
        }
    }
    // After all transactions processed
    if (F_Get_Current_Balance() > 1.0) {
        Set_B1_B2(creatorId, 0);
        F_Send_To_Address_In_B(.7);
    }
}

struct TXINFO {
   long timestamp;
   long sender;
   fixed amount;
} currentTX;

/* Checks if there is a new transaction. If there is, fill currentTX struct
   and returns true. Returns false otherwise. */
long getNextTxDetails(void) {
    // Do not change the value of currentTX.timestamp on your code!!!
    A_To_Tx_After_Timestamp(currentTX.timestamp);
    if (Get_A1() == 0) {
        return false;
    }
    currentTX.timestamp = Get_Timestamp_For_Tx_In_A();
    currentTX.amount = F_Get_Amount_For_Tx_In_A();
    B_To_Address_Of_Tx_In_A();
    currentTX.sender = Get_B1();
    return true;
}

```
* In this contract the Signa amount is handled with fixed point variables. They have the same 8 decimal numbers the people is used to and can be calculated with operators + - * / >> and <<.
* Compiler will throw error when trying to use fixed values in the original API functions. So there is a new fixedAPIFunctions that will handle fixed numbers.
* `#program activationAmount 0.3` ensures that only transactions with an amount greater or equal 0.3 signa will be processed.
* For every transaction, if value is greater than 5.2 signa, contract sends 5 percent back to sender and the remaining 95% is sent to the creator. If the value is lower or equal to 5.2 sends all incoming amount to creator. This amount has discounted the activationAmount, so user will need to send 5.5 signa to get the cashback.
* Every transaction processed, some unspent balance will build up in the contract. To avoid this situation, when all transactions were processed, contract checks if current balance is greater than 1 signum and then sends 0.7 signa to creator.
* If not using fixed numbers, signum quantity is always specified in NQT. 1 signum is 100000000 NQT. I prefer to group the 'decimal amount' in in two parts with 4 zeros for easier counting. Signa is plural of signum.

### Sending a message
```c
#pragma version dev

#program name SendMessage
#program description Easy way to send messages
#program activationAmount 2000_0000

#include APIFunctions

// main loop
while (true) {
    while (getNextTxDetails()) {

        // Process TX
        send_message.recipient = currentTX.sender;
        send_message.message[]="Thanks for donation!";
        Send_Message();
    }
    // After all processed, send all balance to creator.
    Clear_B();
    B_To_Address_Of_Creator();
    Send_All_To_Address_In_B();
}

struct SENDMESSAGE {
   long recipient;
   long message[4];
} send_message;

void Send_Message(void) {
    Set_B1(send_message.recipient);
    Set_A1_A2(send_message.message[0], send_message.message[1]);
    Set_A3_A4(send_message.message[2], send_message.message[3]);
    Send_A_To_Address_In_B();
}

struct TXINFO {
   long timestamp;
   long sender;
   long amount;
} currentTX;

/* Checks if there is a new transaction. If there is, fill currentTX struct
   and returns true. Returns false otherwise. */
long getNextTxDetails(void) {
    // Do not change the value of currentTX.timestamp on your code!!!
    A_To_Tx_After_Timestamp(currentTX.timestamp);
    if (Get_A1() == 0) {
        return false;
    }
    currentTX.timestamp = Get_Timestamp_For_Tx_In_A();
    currentTX.amount = Get_Amount_For_Tx_In_A();
    B_To_Address_Of_Tx_In_A();
    currentTX.sender = Get_B1();
    return true;
}
```
* Presenting function `Send_Message()` thats sends a message with content in global variable `send_message`.
* If the contract sends two messages to same recipient in same block, recipient will receive the concatenation of messages.
* Messages are added in pages, each page has 32 bytes, the size of superregister A. Text is encoded with UTF-8, so some characters need more than one byte.
* There is no main function. The main loop will process transactions and then send all contract balance to creator. When the API `Send_All_To_Address_In_B` sends all balance, then the contract execution will stop because there is no more balance to run it (it will be frozen). When a new transaction above activation amoun is received, contract resumes execution and process all incoming transactions again.

### Sending a message and signa
```c
//function and global variable shown
struct SENDMESSAGESIGNA {
   long recipient;
   long message[4];
} send_message;

void Send_Message_And_Signa(long amount) {
    Set_B1(send_message.recipient);
    Set_A1_A2(send_message.message[0], send_message.message[1]);
    Set_A3_A4(send_message.message[2], send_message.message[3]);
    Send_A_To_Address_In_B();
    Send_To_Address_In_B(amount);
}
```
* Easy, just join the API call to send message and send signa. Function and global variable is show in example.
* Signum node will join message and signa instructions and recipient will receive only one transaction.

[Back](./README.md)
