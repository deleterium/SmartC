# Get AT Creator ID
Simple contract that receives a message with some AT ID (text message in decimal representation) and return to sender a message with the creator's ID of that AT (also in text unsigned decimal representation). Online at tesnet `TS-7MUA-SSZ8-W6QR-6M892`

## Source code
Note that this contract is currently not working on stable. It is for reference only and to be updated when the hard fork is online.
```c
#include APIFunctions

#program name GetATCreator
#program description Receives a message with some AT ID and return to sender a\
 message with the creator`s ID of that AT.
#program activationAmount 1_5000_0000

#pragma maxConstVars 1

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

// Return to sender the creator of a given AT.
void processTX(void) {
    long atId = messageToId();
    Set_B2(atId);
    B_To_Address_Of_Creator();
    long creatorID = Get_B1();
    IdToMessage(creatorID);
    Set_B1_B2(currentTX.sender, 0);
    Set_A1_A2(currentTX.message[0], currentTX.message[1]);
    Set_A3_A4(currentTX.message[2], currentTX.message[3]);
    Send_A_To_Address_In_B();
}

struct TXINFO {
   long txId;
   long timestamp;
   long sender;
   long amount;
   long message[4];
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

long i, auxDiv, auxShift, auxMask, auxNum;
const long n8 = 8, n10 = 10, n15 = 15, n48 = 48, n57 = 57, n255 = 255;
void IdToMessage(long id){
    long currDiv = 10;
    currentTX.message[] = "00000000000000000000            ";
    // using i as temp var;
    i = (id >> 1) / 5;
    currentTX.message[2] |= (id - (i * 10)) << 24;
    id = i;

    for (i = 18; id != 0; i--) {
        auxNum = id % currDiv;
        id /= 10;
        auxDiv = i/8;
        auxShift = (i % 8) * 8;
        auxMask = 0xff << auxShift;
        currentTX.message[i/8] |= auxNum << auxShift;
    }
}

// Expects a numeric ID in currentTX.message[0] to [3]
// return its long representation
long messageToId(void) {
    long currMul = 1;
    long ret=0;
    
    for (i = 19; i>=0; i--) {
        auxDiv = i/8;
        auxShift = (i % 8) * 8;
        auxMask = 0xff << auxShift;
        auxNum = (currentTX.message[i/8] & auxMask) >> auxShift;
        if (auxNum == 0) {
            continue;
        }
        if (auxNum < '0' || auxNum > '9' ) {
            // invalid char
            return 0;
        }
        auxNum &= 0xF;
        auxNum *= currMul;
        ret += auxNum;
        currMul *= 10;
    }
    return ret;
}
```
