# Echo Any Size
Simple contract that reads the incoming text message until a zero byte is found on last byte of last page read. Clears the rest of message buffer and then send the "same message" to sender. Smart contracts only can send 32 bytes each time, so expect the received message to be multiple of 32, padded with zero bytes. Online at tesnet `TS-LZYH-PE75-JZTB-FJ88Y`. Note that there is no API to get the message size, so the program must handle the input end in some way. Activation amount is huge because the fees to read/send info for a smart contract are much higher than sending manually and the contract must handle input text up the 1000 bytes, the current blockchain limit.

## Source code

```c
#program name EchoAnySize
#program description Reads the incoming message until a zero byte\
 is found on last byte of last page read. Clears the rest of buffer\
 and then send the same message to sender. Expect text messages.
#program activationAmount 5_0000_0000

struct TXINFO {
   long txId;
   long sender;
   long amount;
   long message[132];
} currentTX;

long zero;

while (true)
{
    while ((currentTX.txId = getNextTx()) != 0) {
        currentTX.sender = getSender(currentTX.txId);
        currentTX.amount = getAmount(currentTX.txId);
        readMessage(currentTX.txId, 0, currentTX.message);

        processTX();
    }
    sendBalance(getCreator());
}

// just echoes a received message back to sender.
void processTX(void) {

    long messagePage, currentLong;

    // Last read on getNextTxDetails
    currentLong = 4;
    while (currentLong < currentTX.message.length) {
        if (((currentTX.message[currentLong - 1]) >>  56) == 0) {
           // Found a null byte at last byte of last page that was read.
           break;
        }
        messagePage = currentLong / 4;
        readMessage(currentTX.txId, messagePage,  currentTX.message + currentLong);
        currentLong += 4;
    }
    while (currentLong < currentTX.message.length) {
        // clear the rest of buffer.
        currentTX.message[currentLong++] = zero;
        currentTX.message[currentLong++] = zero;
        currentTX.message[currentLong++] = zero;
        currentTX.message[currentLong++] = zero;
    }
    currentLong = 0;
    do {
        // send message loop
        sendMessage(currentTX.message + currentLong, currentTX.sender);
    } while (((currentTX.message[currentLong - 1]) >>  56) != 0 && currentLong < currentTX.message.length);
}
```
