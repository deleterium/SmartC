# Echo Any Size
Simple contract that reads the incoming text message until a zero byte is found on last byte of last page read. Clears the rest of message buffer and then send the "same message" to sender. Smart contracts only can send 32 bytes each time, so expect the received message to be multiple of 32, padded with zero bytes. Online at tesnet `TS-LZYH-PE75-JZTB-FJ88Y`. Note that there is no API to get the message size, so the program must handle the input end in some way. Activation amount is huge because the fees to read/send info for a smart contract are much higher than sending manually and the contract must handle input text up the 1000 bytes, the current blockchain limit.

## Source code
Note that this contract is currently not working on stable. It is for reference only and to be updated when the hard fork is online.
```c
#include APIFunctions

#program name EchoAnySize
#program description Reads the incoming message until a zero byte\
 is found on last byte of last page read. Clears the rest of buffer\
 and then send the same message to sender. Expect text messages.
#program activationAmount 5_0000_0000

#pragma maxConstVars 1

long zero;
B_To_Address_Of_Creator();
long CREATOR = Get_B1();

while (true)
{
    while (getNextTxDetails()) {
        processTX();
    }
    Set_B1(CREATOR);
    Send_All_To_Address_In_B();
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
        Set_A1_A2(currentTX.txId, messagePage);
        Message_From_Tx_In_A_To_B();
        currentTX.message[currentLong++] = Get_B1();
        currentTX.message[currentLong++] = Get_B2();
        currentTX.message[currentLong++] = Get_B3();
        currentTX.message[currentLong++] = Get_B4();
    }
    while (currentLong < currentTX.message.length) {
        // clear the rest of buffer.
        currentTX.message[currentLong++] = zero;
        currentTX.message[currentLong++] = zero;
        currentTX.message[currentLong++] = zero;
        currentTX.message[currentLong++] = zero;
    }
    Set_B1(currentTX.sender);
    currentLong = 0;
    do {
        Set_A1_A2(currentTX.message[currentLong], currentTX.message[currentLong + 1]);
        currentLong += 2;
        Set_A3_A4(currentTX.message[currentLong], currentTX.message[currentLong + 1]);
        currentLong += 2;
        Send_A_To_Address_In_B();
    } while (((currentTX.message[currentLong - 1]) >>  56) != 0 && currentLong < currentTX.message.length);
}

struct TXINFO {
   long txId;
   long timestamp;
   long sender;
   long amount;
   long message[132];
} currentTX;

long getNextTxDetails(void)
{
    A_To_Tx_After_Timestamp(currentTX.timestamp);
    currentTX.txId = Get_A1();
    if (currentTX.txId == 0) {
        return false;
    }
    currentTX.amount = Get_Amount_For_Tx_In_A();
    currentTX.timestamp = Get_Timestamp_For_Tx_In_A();
    Message_From_Tx_In_A_To_B();
    currentTX.message[0] = Get_B1();
    currentTX.message[1] = Get_B2();
    currentTX.message[2] = Get_B3();
    currentTX.message[3] = Get_B4();
    B_To_Address_Of_Tx_In_A();
    currentTX.sender = Get_B1();
    return true;
}
```
