# Wheel of Signa
## Default features
* A game to exchange TMG tokens for Signa.
* Price paid is a random amount between 1% and 10% of contract balance, in steps of 1%. So minimum payout is 1% and maximum is 10%.
* Only one TMG traded at a time. If sending more, excess will be refunded.
* Contract activation amount is 0.5 Signa.
* No trading fees
* Configurable amount of TMG to be hold on contract. This ensure contract will be funded byt TMG distributions.
* Excess TMG's are burned, to reduce circulating supply. It is an incentive for TMG mining.

## Owner powers
* Set different limits for TMG holding, from 0.01 to 99999.99. Send 0.5 Signa and a message `limit is XXXX` where XXX is the new limit in QNT (1 TMG is 100 NQT).
* Not allowed to withdraw Signa or TMG.
* Can play just like anyone.

## Limitations
* If same user play two or more times in same block, the payment will be joined in just one transaction.
* If more than 18 draws is requested in same block, the contract will sleep one block to collect more entropy.
* If contract balance is lower than 5 Signa, no draw is made and TMG is refunded.

## Funding the contract
* Any account can add Signa. Send the desired amount without any TMG and the balance will be kept.
* Any account can add TMG. Send the TMG amount without any Signa and the TMG will be kept.

## Source code
```c

#program name WheelOfSigna
#program description Send 1 TMG and the contract will pay a random amount between\
 1% and 10% of current contract balance.
#define ACTIVATION_AMOUNT 5000_0000
#program activationAmount ACTIVATION_AMOUNT
#program codeHashId 14294755573406174475

#pragma maxConstVars 1
#pragma maxAuxVars 2
#pragma verboseAssembly
#pragma optimizationLevel 3
#pragma version 2.0.1

// #define SIMULATOR

#ifdef SIMULATOR
  #define OWNER 555
  #define ASSET_ID 222333
#else
  #define OWNER "S-GJ9C-T2EF-C82A-8EZPD"
  #define ASSET_ID 11955007191311588286
#endif

/* Instructions:

1) How to add TMG to the contract?
Send a transaction with TMG and no Signa.

2) How to add Signa to the contract?
Send a transaction with Signa and no TMG.

3) How to play?
Send a transaction with at least 0.5 Signa and 1.00 TMG.

4) How to set a new TMG limit?
Owner must send a transaction with at least 0.5 Signa and
the message "limit is 100" to set new limit to 1.00 TMG.
"limit is 550" will set limit to 5.5 TMG. "limit is 0" has
no effect. Lowest value possible is 1 (0.01 TMG). Max value
is 9999999 (99999.99 TMG).

*/

struct TXINFO {
    long txid;
    long sender;
    long quantity;
} currentTX;

struct STATS {
    long runs,
        burnedTMG,
        payouts[5];
} stats;

long rand;
long atolRetVal, atolArgVal;
const long limitTMG = 300;
const long owner = OWNER;
const long assetId = ASSET_ID;

const long n100 = 100;

void main () {
    rand = getWeakRandomNumber() >> 1;
    while ((currentTX.txid = getNextTx()) != 0) {
        currentTX.sender = getSender(currentTX.txid);
        currentTX.quantity = getQuantity(currentTX.txid, assetId);
        processTX();
    }
    // After all transactions processed
    long quantityTMG = getAssetBalance(assetId);
    if (quantityTMG > limitTMG) {
        // Burn the excess of TMG
        stats.burnedTMG += quantityTMG - limitTMG;
        sendQuantityAndAmount(quantityTMG - limitTMG, assetId, 0, 0);
    }
}

void processTX() {
    if (currentTX.sender == owner) {
        processOwnerCommand();
    }
    if (currentTX.quantity < 100) {
        // No TMG, no fun.
        // Also fund the contract thru distributions.
        return;
    }
    long currentBalance = getCurrentBalance();
    if (currentBalance < 10 * ACTIVATION_AMOUNT) {
        // Very low balance, refund the token
        sendQuantityAndAmount(
            currentTX.quantity,
            assetId,
            0,
            currentTX.sender
        );
        return;
    }
    if (rand < 10) {
        // More than 18 draws in this block. End of entropy.
        // Sleep and refresh random number.
        sleep;
        rand = getWeakRandomNumber() >> 1;
    }
    long minPrize = currentBalance / 100;
    long playerPrize = minPrize * ((rand % 10) + 1);
    rand /= 10;
    if (currentTX.quantity == 100) {
        sendAmount(playerPrize, currentTX.sender);
    } else {
        sendQuantityAndAmount(
            currentTX.quantity - 100,
            assetId,
            playerPrize,
            currentTX.sender
        );
    }
    stats.payouts[stats.runs % stats.payouts.length] = playerPrize;
    stats.runs++;
}

void processOwnerCommand() {
    long message[4];
    readMessage(currentTX.txid, 0, message);
    if (message[0] == "limit is") {
        atolArgVal = message[1];
        atol();
        if (atolRetVal != 0) {
            limitTMG = atolRetVal;
        }
    }
}

void atol() {
    long chr;
    atolRetVal = 0;
    do {
        chr = 0xff & atolArgVal;
        if (chr == ' ') {
            atolArgVal >>= 8;
            continue;
        }
        chr -= '0';
        if (chr < 0 || chr >= 10)
            break;
        atolRetVal *= 10;
        atolRetVal += chr;
        atolArgVal >>= 8;
    } while (true);
}
```

## Testcases for SC-Simulator

### Player transactions
```js
[
    // low contract balance, expect refund
  { "blockheight": 2, "sender": "10000n", "recipient": "999", "amount": "5000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
    // Add initial balance, expecting nothing
  { "blockheight": 4, "sender": "10000n", "recipient": "999", "amount": "500_0000_0000n" },
    // Player sending less than 1 tmg. expect nothing
  { "blockheight": 6, "sender": "10000n", "recipient": "999", "amount": "5000_0000n", "tokens": [{ "asset": 222333, "quantity": 50 }] },
    // Player sending more than 1 tmg. expect draw and refund excess
  { "blockheight": 8, "sender": "10000n", "recipient": "999", "amount": "5000_0000n", "tokens": [{ "asset": 222333, "quantity": 101 }] },
    // More plays. Expect draws and burn 50 TMG
  { "blockheight": 10, "sender": "10000n", "recipient": "999", "amount": "5000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 10, "sender": "10000n", "recipient": "999", "amount": "5000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
    // More plays. Expect draws and burn 300 TMG and wrap stats.payouts
  { "blockheight": 12, "sender": "10000n", "recipient": "999", "amount": "5000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 12, "sender": "10000n", "recipient": "999", "amount": "5000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 12, "sender": "10000n", "recipient": "999", "amount": "5000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
    // More plays. Expect end of entropy and sleep, then more draws and burn token.
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
  { "blockheight": 14, "sender": "10000n", "recipient": "999", "amount": "25000_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] }
]
```

### Owner transactions
```js
[
    // owner sending tmgs
  { "blockheight": 2, "sender": "555n", "amount": 0,  "recipient": "999", "tokens": [{ "asset": 222333, "quantity": 200 }] },
    // owner setting new limit (wrong)
  { "blockheight": 4, "sender": "555n", "amount": "5000_0000",  "recipient": "999", "messageText": "limit is AAAA" },
    // owner setting new limit (and burn)
  { "blockheight": 6, "sender": "555n", "amount": "5000_0000", "recipient": "999", "messageText": "limit is 33" },
    // owner setting new limit (high)
  { "blockheight": 8, "sender": "555n", "amount": "5000_0000",  "recipient": "999", "messageText": "limit is 10000" },
    // playing
  { "blockheight": 10, "sender": "555n", "amount": "500_0000_0000",  "recipient": "999", "tokens": [{ "asset": 222333, "quantity": 100 }] }
]
```
