

# Lessons and examples to create smart contracts in Burstcoin's network
Following guide, focused on BurstAT-CC compiler, will show examples with progressive complexity and comments how they works. It is expected that you know C language. It is a good idea to read all docs from BurstAT-CC site, and also ciyam official documentation available [here](https://ciyam.org/at/).

## Basic contracts

### Always Running, doing nothing
```c
#program name alwaysRuning
#program description Always Running, doing nothing
#pragma maxAuxVars 1

while (1) {
    sleep 1;
}
```
* This contract has no functions, API and no variable declared.
* Macro `#pragma` can set some specific behaviour of compiler, in this case it will set compiler to use only one auxiliary variable (they act as registers for operations). Default value is 5, but here we will use the minimum allowed.
* Only one global statement, `while (1)` is used to make an infinite loop.
* Keyword `sleep 1` will stop the contract process at current block and resumes execution at the next block.
* It will keep in this loop until there is no more balance at the contract, then it will be freezed until it receives more balance.

### Counting transactions, easy way
```c
#program name CountingTxDelayed
#program description Counting transactions, easy way

void main(void) {
    long counter;
    counter++;
}
```
* The `main` function is the entry point when a block is forged and contract has pending TX to be processed. When finished via `return` or `exit` the execution will stop.
* If two transactions are received by this contract, the first one will be processed and the contract will enter finished state. In the next block it will be activated again with the second message that was not processed in same block height. This means, if this contract receives 10 messages at some block, it will take 10 blocks to finish counting them.
* When the contract is created, all memory is zeroed. So variable counter will start from zero and keep increasing every block it has received TXs.

### Counting transactions without delay.
```c
#program name CountingTx
#program description Counting transactions without delay
#include APIFunctions

void processTX(void){
    const long counter=10;
    counter++;
}

void main(void) {
    long lastTX;

    do {
        get_next_tx_details(lastTX);
        if (tx_details.timestamp == 0) //no more transactions
            break;
        lastTX = tx_details.timestamp;
        processTX();
    } while (1);

    //clean_up();
}

struct TXINFO {
   long timestamp;
   long sender;
   long amount;
   long message[4];
} tx_details;

void get_next_tx_details(long last_timestamp) {

    //put the next tx in superregister A  
    A_To_Tx_After_Timestamp(last_timestamp);

    //gets A1, (less significative long of superregister A)
    if (Get_A1() == 0) { //no more transactions
        tx_details.timestamp=0;
        return;
    }
    tx_details.amount  = Get_Amount_For_Tx_In_A();
    tx_details.timestamp = Get_Timestamp_For_Tx_In_A();
    B_To_Address_Of_Tx_In_A();
    tx_details.sender = Get_B1();
    Message_From_Tx_In_A_To_B();
    tx_details.message[0]=Get_B1();
    tx_details.message[1]=Get_B2();
    tx_details.message[2]=Get_B3();
    tx_details.message[3]=Get_B4();
    return;
}
```
* To get details from incoming transaction, we will use the API functions. Tell the compiler you will need them with macro `#include APIFunctions`.
* It is presented the function `get_next_tx_details()` that will get all details from incoming message to a global variable `tx_details`. This stuct has members to store all information that can be retrieved from a TX.
* The `main` function will loop thru all TX received in same block. When the API `A_To_Tx_After_Timestamp` returns timestamp zero, it means there is no more pending transactions, so the contract can be finished.
* Counter value will be set to 10 during contract deployment (keyword const!). Then it will be increased for each new valid tx received.
* Of course you can implement a new way.
* Global variable is used because it needs less instructions to make same thing. It is important to note, because every assembly instructions will be charged a fee for execution and there is limitations for code and memory sizes when deploying an smart contract in the blockchain.

### Sending burst
```c
#program name SendBurst
#program description Using a function to send burst.
#include APIFunctions

const long send_to="BURST-2LER-KMQ8-88WQ-EPKST";
//long ONE_BURST=100000000;

void main(void) {
    long lastTX, curr_balance;

    do {
        get_next_tx_details(lastTX);
        if (tx_details.timestamp == 0) //no more transactions
            break;
        lastTX = tx_details.timestamp;
    } while (1);

    curr_balance = Get_Current_Balance();

    if (curr_balance > 30*100000000) {
        send_burst.recipient = send_to;
        send_burst.amount = curr_balance - 5*100000000;
        Send_Burst();
    }
}

struct SENDBURST {
   long recipient;
   long amount;
} send_burst;

void Send_Burst() {
    Set_B1(send_burst.recipient);
    Send_To_Address_In_B(send_burst.amount);
}

struct TXINFO {
   long timestamp;
   long sender;
   long amount;
   long message[4];
} tx_details;

void get_next_tx_details(long last_timestamp) {
   
    A_To_Tx_After_Timestamp(last_timestamp);

    if (Get_A1() == 0) { //no more transactions
        tx_details.timestamp=0;
        return;
    }
    tx_details.amount  = Get_Amount_For_Tx_In_A();
    tx_details.timestamp = Get_Timestamp_For_Tx_In_A();
    B_To_Address_Of_Tx_In_A();
    tx_details.sender = Get_B1();
    Message_From_Tx_In_A_To_B();
    tx_details.message[0]=Get_B1();
    tx_details.message[1]=Get_B2();
    tx_details.message[2]=Get_B3();
    tx_details.message[3]=Get_B4();
    return;
}
```
* Loop thru all incoming messages doing nothing. When there is no more tx, then check if account balance is greater than 30 burst. If it is, send funds to address defined and keep 5 burst in contract account.
* Function `Send_Burst()` is very simple and can be implemented passing arguments, or even embeed in code.
* Burst quantity is always specified in NQT. 1 Burst is 100.000.000 NQT. 

### Sending a message
```c
#program name SendMessage
#program description Easy way to send messages
#include APIFunctions

void main(void) {
    long lastTX;

    do {
        get_next_tx_details(lastTX);
        if (tx_details.timestamp == 0) //no more transactions
            break;
        lastTX = tx_details.timestamp;

        send_message.recipient = tx_details.sender;
        send_message.message[]="Thanks for donation!";
        Send_Message();

    } while (1);
}


struct SENDMESSAGE {
   long recipient;
   long message[4];
} send_message;

void Send_Message() {
    Set_B1(send_message.recipient);
    Set_A1_A2(send_message.message[0], send_message.message[1]);
    Set_A3_A4(send_message.message[2], send_message.message[3]);
    Send_A_To_Address_In_B();
}


struct TXINFO {
   long timestamp;
   long sender;
   long amount;
   long message[4];
} tx_details;

void get_next_tx_details(long last_timestamp) {
   
    A_To_Tx_After_Timestamp(last_timestamp);

    if (Get_A1() == 0) { //no more transactions
        tx_details.timestamp=0;
        return;
    }
    tx_details.amount  = Get_Amount_For_Tx_In_A();
    tx_details.timestamp = Get_Timestamp_For_Tx_In_A();
    B_To_Address_Of_Tx_In_A();
    tx_details.sender = Get_B1();
    Message_From_Tx_In_A_To_B();
    tx_details.message[0]=Get_B1();
    tx_details.message[1]=Get_B2();
    tx_details.message[2]=Get_B3();
    tx_details.message[3]=Get_B4();
    return;
}

```
* Presenting function `Send_Message()` thats sends a message with content in global variable `send_message`.
* If the contract sends two messages to same recipient in same block, recipient will receive only the last one.
* Messages are limited to 32 bytes, the size of superregister A. Text is encoded with UTF-8, so some characters need more than one byte.

### Sending a message and burst
```c
//function and global variable shown
struct SENDMESSAGEBURST {
   long recipient;
   long amount;
   long message[4];
} send_message_burst;

void Send_Message_Burst() {
    Set_B1(send_message_burst.recipient);
    Set_A1_A2(send_message_burst.message[0], send_message_burst.message[1]);
    Set_A3_A4(send_message_burst.message[2], send_message_burst.message[3]);
    Send_A_To_Address_In_B();
    Send_To_Address_In_B(send_message_burst.amount);
}
```
* Easy, just join the API call to send message and send burst. Function and global variable is show in example.
* Set values then call the function.
