# Get AT Creator ID
Simple contract that receives a message with some AT ID (text message in decimal representation) and return to sender a message with the creator's ID of that AT (also in text unsigned decimal representation). Online at tesnet `TS-7MUA-SSZ8-W6QR-6M892`

## Source code
Note that this contract is currently not working on stable. It is for reference only and to be updated when the hard fork is online.
```c
#program name GetATCreator
#program description Receives a message with some AT ID and return to sender a\
 message with the creator`s ID of that AT.
#program activationAmount 1_5000_0000

struct TXINFO {
   long txId;
   long sender;
   long amount;
   long message[4];
} currentTX;

long messageToSend[4];

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

// Return to sender the creator of a given AT.
void processTX(void) {
    long atId = messageToId();
    long creatorID = getCreatorOf(atId);
    IdToMessage(creatorID);
    sendMessage(messageToSend, currentTX.sender);
}


long i, auxDiv, auxShift, auxMask, auxNum;
const long n8 = 8, n10 = 10, n15 = 15, n48 = 48, n57 = 57, n255 = 255;
void IdToMessage(long id){
    long currDiv = 10;
    messageToSend[] = "00000000000000000000            ";
    // using i as temp var;
    i = (id >> 1) / 5;
    messageToSend[2] |= (id - (i * 10)) << 24;
    id = i;

    for (i = 18; id != 0; i--) {
        auxNum = id % currDiv;
        id /= 10;
        auxDiv = i/8;
        auxShift = (i % 8) * 8;
        auxMask = 0xff << auxShift;
        messageToSend[i/8] |= auxNum << auxShift;
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
