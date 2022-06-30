[Back](./README.md)

# Lessons and examples to create smart contracts in Signum network
Following guide will show examples with progressive complexity and comments how they works. It is expected that you know C language. It is a good idea to read all docs from SmartC. If you plan to be expert, read ciyam official documentation available [here](https://ciyam.org/at/) and Signum [SIP-37](https://github.com/signum-network/SIPs/blob/master/SIP/sip-37.md), [SIP-38](https://github.com/signum-network/SIPs/blob/master/SIP/sip-38.md), [SIP-39](https://github.com/signum-network/SIPs/blob/master/SIP/sip-39.md) for major changes introduced in JUN/2022. There is also some videos compiling these examples at my [personal Youtube channel](https://www.youtube.com/playlist?list=PLyu0NNtb1eg3Gcg2JCrOle8MjtuFPb-Gi).

<details>
<summary>

## Always Running, doing nothing
</summary>

```c
#program name alwaysRuning
#program description Always Running, doing nothing
#program activationAmount 0
#pragma maxAuxVars 0

while (true) {
    sleep;
}
```
* This contract has no functions, API, nor variable declared.
* Macro `#pragma` can set some specific behaviour of compiler, in this case it will set compiler to use no auxiliary variable (they act as registers for operations). Default value is 3, but here we do not need any.
* Only one global statement, `while (true)` is used to make an infinite loop.
* Keyword `sleep 1` will stop the contract process at current block and resumes execution at the next block.
* It will keep in this loop until there is no more balance at the contract, then it will be frozen until it receives more balance.
* Activation amount zero means that the contract will be always active, even if there was a `exit` statement.
</details>
<details>
<summary>

## Counting transactions, easy way
</summary>

```c
#program name CountingTxDelayed
#program description Counting transactions, easy way
#program activationAmount 0.1

void main(void) {
    long counter, txid;
    getNextTx();
    counter++;
}
```
* The `main` function is the entry point when contract gets an activation. Contract can be finished in this function via `return`, `exit` or at the end of function.
* If two transactions are received by this contract, the first one will be processed and the contract will enter finished state. In the next block it will be activated again with the second transaction that was not processed in previous block height. This means, if this contract receives 10 messages at some block, it will take 10 blocks to finish counting them.
* When the contract is created, all memory is set to zero. So variable counter will start from zero and keep increasing every block it has received TXs.
* Activation amount 0.1 means that the contract will only count the transactions that send at least this amount. If a transaction with .99999999 is received, the balance will the added to the contract but it will not be counted.
</details>
<details>
<summary>

## Counting transactions without delay.
</summary>

```c
#program name CountingTx
#program description Counting transactions without delay
#program activationAmount 0.1

long counter;

void main(void) {
    long txid;
    while ((txid = getNextTx() != 0) {
        // Process transaction in a specific function
        processTX();
    }
    // Optional function to make something after all transactions processed
    // clean_up();
}

void processTX(void){
    const counter = 10;
    counter++;
}
```
* It is presented the built-in function `getNextTx()` that will return the transaction Id of the next transaction. It stores internally the timestamp of last received transaction and returns zero if there is no more pending transactions.
* The while loop will be executed for all pending messages. When txid is zero, the contract can be finished.
* Counter value will be set to 10 during contract deployment (keyword const!). Then it will be increased for each new valid tx received. Const expressions are 'executed' only at the deployment.
* counter is global variable just to show how to declare it. It is more effective to have a global variable than sending it to functions. If a variable is used only in one function, use the local scope.
</details>
<details>
<summary>

## Echo signa
</summary>

```c
#program name EchoSigna
#program description Returns the received amount to the sender.
#program activationAmount 0.5

while (true) {
    long txid;
    while ((txid = getNextTx() != 0) {
        sendAmount(getAmount(txid), getSender(txid))
    }
    // After all transactions processed
    sendBalance(getCreator());
}
```
* `#program activationAmount 0.5` ensures that only transactions with an amount greater or equal 0.5 signa will be processed. The returned amount will be only the value above activation amount.
* For every transaction processed, some unspent balance will build up in the contract. To avoid this situation, after all transactions were processed in current block, the contract sends all remaining balance to the creator.
* `getAmount`: returns the amount in NQT of a given transaction id.
* `getSender`: returns the account id of sender of a given transaction id.
* `sendAmount`: sends a given amount of Signa to a recipient.
* `sendBalance`: sends all contract balance to a recipient. The execution is halted after the transaction is sent.
</details>
<details>
<summary>

## Echo message
</summary>

```c
#program name EchoMessage
#program description Reads first page of message (32 bytes) and sends back to sender. \
 Also sends back 95% of the amount sent.
#program activationAmount 0.5

struct TXINFO {
   long txid;
   long sender;
   fixed amount;
   long message[4];
} currentTX;

void main () {
    while ((currentTX.txid = getNextTx()) != 0) {
        getDetails();
        processTX();
    }
    // After all transactions processed
    // cleanUp();
}

void getDetails() {
    currentTX.sender = getSender(currentTX.txid);
    currentTX.amount = getAmountFx(currentTX.txid);
    readMessage(currentTX.txid, 0, currentTX.message);
}

void processTX() {
    sendAmountAndMessageFx(
        currentTX.amount * 0.95,
        currentTX.message,
        currentTX.sender
    );
}
```
* In this contract the Signa amount is handled with fixed point variables. They have the same 8 decimal numbers the people is used to and can be calculated with operators + - * / >> and <<. Useful to make calculations. All built-in functions that handle Signa balance have a fixed point version that ends with Fx.
* Balance will build up in the contract because there is no cleanUp function defined.
</details>
<details>
<summary>

## Echo token
</summary>

```c
#program name EchoToken
#program description Returns the assets received.
#program activationAmount 0.5

struct TXINFO {
   long txid;
   long sender;
   long assets[4];
} currentTX;

void main () {
    while ((currentTX.txid = getNextTx()) != 0) {
        getDetails();
        processTX();
    }
    // After all transactions processed
    cleanUp();
}

void getDetails() {
    currentTX.sender = getSender(currentTX.txid);
    readAssets(currentTX.txid, currentTX.assets);
}

void processTX() {
    for (long i = 0; i < 4; i++) {
        if (currentTX.assets[i] == 0) {
            // Zero means no more assets in incoming transaction
            return;
        }
        sendQuantity(
            getQuantity(currentTX.txid, currentTX.assets[i]),
            currentTX.assets[i],
            currentTX.sender
        );
    }
}

void cleanUp() {
    fixed excessBalance;
    excessBalance = getCurrentBalanceFx() - 0.5;
    if (excessBalance > 0) {
        sendAmountFx(excessBalance, getCreator());
    }
}
```
* Assets amount is called "quantity" and always returned as long (QNT), because it is not possible to know how many decimals they have.
* To avoid balance build up in the contract, any Signa amount and unspent activation amount is sent to creator if more than 0.5 Signa.
* If `sendBalance` is used in cleanUp, the contract would also stop execution. But the next transaction will reactivate the contract and it will reach the end of void function, so halting again. Only when another transaction is received, the contract will start again at the main function and process the two enqueued transactions.
</details>

[Back](./README.md)
