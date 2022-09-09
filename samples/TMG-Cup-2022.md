# TMG Cup 2022
Collect flag tokens. Win a prize if you hold the champion!


## What is the TMG Cup?

TMG Cup 2022 is a limited edition smart contract that sells flag tokens. These tokens can be collected and are shown in this page when linked to an account. Tokens only can be minted by the smart contract <a href="https://chain.signum.network/address/706103503777213269">706103503777213269</a> and bought with TMG tokens and some Signa.


<details>
    <summary>What is sell phase?</summary>
    This means the contract will only sell tokens. No other option is possible.
</details>
<details>
    <summary>What is distribution phase?</summary>
This means the contract will not sell tokens and it will be waiting for 2 of 3 trusted accounts send messages with the champion of soccer cup this year. Once this condition is reached, all Signa balance will be distribute to the holders of champion's flag token and TMG balance will be burnt. If you try to buy tokens, the amount will be refunded.
</details>
<details>
    <summary>What happens when I complete the album?</summary>
Congratulations! Share with your your friends! Now you have 100% chance to receive a the prize at the distribution phase!
</details>
<details>
    <summary>What if I have more tokens from the winner?</summary>
The prize distribution will be proportional to the quantity of tokens you have. So if you have 4 tokens, the prize you will receive will be 4 times bigger than the amount of someone that has only 1 token.
</details>
<details>
    <summary>Is there a token that it is more difficult to get?</summary>
No, difficult are programmed to be the same for all tokens: 1/32 or 3.125%.
</details>
<details>
    <summary>Where I can get TMG?</summary>
First option is to buy at <a href="https://deleterium.info/tmg-pool/">TMG pool</a>. Another option is to play <a href="https://tmg.notallmine.net/">The Mining Game</a>. Maybe you can get some with your friends!
</details>
<details>
    <summary>What happens to TMG in the contract?</summary>
It will stay in the contract to receive distributions from The Mining Game, but they will be burnt after the prize distribution.
</details>
<details>
    <summary>What if the champion flag was not minted?</summary>
It is very unlikely, but if there is no holder, the amount will be donated to SNA.
</details>
<details>
    <summary>Who are the trusted accounts?</summary>
    "S-5MS6-5FBY-74H4-9N4HS" SNA; "S-9K9L-4CB5-88Y5-F5G4Z" - Ohager; "S-DKVF-VE8K-KUXB-DELET" - Deleterium
</details>
<details>
    <summary>When cup is over do I get paid for flags I have?</summary>
Only if you have the token flag of the champion at the time the distribution is done. Other tokens will not receive anything from the contract, but they can still be traded/exchanged to other user that may want to complete the collection.
</details>
<details>
    <summary>What do with the flag tokens I have after the prize distribution?</summary>
You can keep in your account, check and share this website. It will stay on for long. Other options are trade, give away for friends or just burn it.
</details>

## Source code
```c
#program name TMGCup2022
#program description Use your TMG to buy flag tokens and maybe win a prize!\
 Sales limited until blockheight 1090100 (2022-12-11). More info at https://deleterium.info/tmg-cup/
#define ACTIVATION_AMOUNT 3000_0000
#program activationAmount ACTIVATION_AMOUNT

#pragma verboseAssembly
#pragma optimizationLevel 3
#pragma maxAuxVars 4
#pragma maxConstVars 2
#pragma version 2.1.1

// #define SIMULATOR

#ifdef SIMULATOR
  #define TMG_ID 222333
  #define END_PHASE_1 20
  #define DONATION_ADDRESS 23123
  #define TRUSTED_ADDRESS_1 505
  #define TRUSTED_ADDRESS_2 506
  #define TRUSTED_ADDRESS_3 507
#else
  #define TMG_ID 11955007191311588286
  #define END_PHASE_1 1090100
  #define DONATION_ADDRESS "S-5MS6-5FBY-74H4-9N4HS"
  #define TRUSTED_ADDRESS_1 "S-5MS6-5FBY-74H4-9N4HS"
  #define TRUSTED_ADDRESS_2 "S-9K9L-4CB5-88Y5-F5G4Z"
  #define TRUSTED_ADDRESS_3 "S-DKVF-VE8K-KUXB-DELET"
#endif

const long tokenCost = 15;
const long activationAmount = ACTIVATION_AMOUNT;

/* End of configurations */

long i;
long nZero;
const long n6 = 6, n32 = 32;

struct TXINFO {
    long txid;
    long sender;
    long amount;
    long quantity;
    long message;
} currentTX;

struct TRUSTED_VOTES {
   long account, vote;
} trustedVotes[3];

const trustedVotes[0].account = TRUSTED_ADDRESS_1;
const trustedVotes[1].account = TRUSTED_ADDRESS_2;
const trustedVotes[2].account = TRUSTED_ADDRESS_3;

struct COUNTRIES {
    long tokenId, tokenName, letters, name[2];
} country[32];

const country[0].tokenName = "CUP22ARG"; const country[0].letters = "ARG"; const country[0].name[] = "Argentina";
const country[1].tokenName = "CUP22AUS"; const country[1].letters = "AUS"; const country[1].name[] = "Australia";
const country[2].tokenName = "CUP22BEL"; const country[2].letters = "BEL"; const country[2].name[] = "Belgium";
const country[3].tokenName = "CUP22BRA"; const country[3].letters = "BRA"; const country[3].name[] = "Brazil";
const country[4].tokenName = "CUP22CMR"; const country[4].letters = "CMR"; const country[4].name[] = "Cameroon";
const country[5].tokenName = "CUP22CAN"; const country[5].letters = "CAN"; const country[5].name[] = "Canada";
const country[6].tokenName = "CUP22CRC"; const country[6].letters = "CRC"; const country[6].name[] = "Costa Rica";
const country[7].tokenName = "CUP22CRO"; const country[7].letters = "CRO"; const country[7].name[] = "Croatia";
const country[8].tokenName = "CUP22DEN"; const country[8].letters = "DEN"; const country[8].name[] = "Denmark";
const country[9].tokenName = "CUP22ECU"; const country[9].letters = "ECU"; const country[9].name[] = "Ecuador";
const country[10].tokenName = "CUP22ENG"; const country[10].letters = "ENG"; const country[10].name[] = "England";
const country[11].tokenName = "CUP22FRA"; const country[11].letters = "FRA"; const country[11].name[] = "France";
const country[12].tokenName = "CUP22GER"; const country[12].letters = "GER"; const country[12].name[] = "Germany";
const country[13].tokenName = "CUP22GHA"; const country[13].letters = "GHA"; const country[13].name[] = "Ghana";
const country[14].tokenName = "CUP22IRN"; const country[14].letters = "IRN"; const country[14].name[] = "Iran";
const country[15].tokenName = "CUP22JPN"; const country[15].letters = "JPN"; const country[15].name[] = "Japan";
const country[16].tokenName = "CUP22MEX"; const country[16].letters = "MEX"; const country[16].name[] = "Mexico";
const country[17].tokenName = "CUP22MAR"; const country[17].letters = "MAR"; const country[17].name[] = "Morocco";
const country[18].tokenName = "CUP22NED"; const country[18].letters = "NED"; const country[18].name[] = "Netherlands";
const country[19].tokenName = "CUP22POL"; const country[19].letters = "POL"; const country[19].name[] = "Poland";
const country[20].tokenName = "CUP22POR"; const country[20].letters = "POR"; const country[20].name[] = "Portugal";
const country[21].tokenName = "CUP22QAT"; const country[21].letters = "QAT"; const country[21].name[] = "Qatar";
const country[22].tokenName = "CUP22KSA"; const country[22].letters = "KSA"; const country[22].name[] = "Saudi Arabia";
const country[23].tokenName = "CUP22SEN"; const country[23].letters = "SEN"; const country[23].name[] = "Senegal";
const country[24].tokenName = "CUP22SRB"; const country[24].letters = "SRB"; const country[24].name[] = "Serbia";
const country[25].tokenName = "CUP22KOR"; const country[25].letters = "KOR"; const country[25].name[] = "South Korea";
const country[26].tokenName = "CUP22ESP"; const country[26].letters = "ESP"; const country[26].name[] = "Spain";
const country[27].tokenName = "CUP22SUI"; const country[27].letters = "SUI"; const country[27].name[] = "Switzerland";
const country[28].tokenName = "CUP22TUN"; const country[28].letters = "TUN"; const country[28].name[] = "Tunisia";
const country[29].tokenName = "CUP22USA"; const country[29].letters = "USA"; const country[29].name[] = "United States";
const country[30].tokenName = "CUP22URU"; const country[30].letters = "URU"; const country[30].name[] = "Uruguay";
const country[31].tokenName = "CUP22WAL"; const country[31].letters = "WAL"; const country[31].name[] = "Wales";

struct LSFR {
    long seed;
    long magic;
} lsfr;

// Constructor
lsfr.magic = 0x4000000000000895;
long TMGid = TMG_ID;
long phase = 1;
long owner = getCreator();
for (i = 0; i < country.length; i++) {
    country[i].tokenId = issueAsset(country[i].tokenName, nZero, nZero);
}
// end Constructor

void main () {
    long currentBlock = getCurrentBlockheight();
    lsfr.seed = getWeakRandomNumber() >> 1;
    if (currentBlock >= END_PHASE_1) {
        phase = 2;
    }
    while ((currentTX.txid = getNextTx()) != 0) {
        // get details
        currentTX.sender = getSender(currentTX.txid);
        currentTX.amount = getAmount(currentTX.txid);
        readShortMessage(currentTX.txid, &currentTX.message, 1);
        currentTX.quantity = getQuantity(currentTX.txid, TMGid);
        // process command
        if (phase == 1) {
            if (currentTX.message == 'buy') {
                buyTokens();
            }
            continue;
        }
        // else phase is 2
        if (currentTX.sender == trustedVotes[0].account ||
            currentTX.sender == trustedVotes[1].account ||
            currentTX.sender == trustedVotes[2].account) {
            processVote();
            continue;
        }
        refundTransaction();
    }
}

void refundTransaction() {
    if (currentTX.quantity > 0) {
        sendQuantityAndAmount(
            currentTX.quantity,
            TMGid,
            currentTX.amount,
            currentTX.sender
        );
    } else if (currentTX.amount > 0) {
        sendAmount(currentTX.amount, currentTX.sender);
    }
}

void buyTokens() {
    if (currentTX.quantity >= tokenCost) {
        currentTX.amount += activationAmount;
    }
    while (currentTX.amount >= activationAmount && currentTX.quantity >= tokenCost) {
        updateRandom();
        long rnd = lsfr.seed % country.length;
        mintAsset(1, country[rnd].tokenId);
        sendQuantity(1, country[rnd].tokenId, currentTX.sender);
        currentTX.amount -= activationAmount;
        currentTX.quantity -= tokenCost;
    }
    // Refund any excess
    refundTransaction();
}

void updateRandom() {
    if (!(lsfr.seed & 1)){
        lsfr.seed >>= 1;
    } else {
        lsfr.seed >>= 1;
        lsfr.seed ^= lsfr.magic;
    }
}

void processVote() {
    long numberOfVotes = 0;

    switch (currentTX.sender) {
        case (trustedVotes[0].account):
            trustedVotes[0].vote = currentTX.message;
            break;
        case (trustedVotes[1].account):
            trustedVotes[1].vote = currentTX.message;
            break;
        case (trustedVotes[2].account):
            trustedVotes[2].vote = currentTX.message;
            break;
        default:
            return;
    }

    if (trustedVotes[0].vote != "") numberOfVotes++;
    if (trustedVotes[1].vote != "") numberOfVotes++;
    if (trustedVotes[2].vote != "") numberOfVotes++;

    if (numberOfVotes >= 2) {
        tryDistribution();
    }
}

void tryDistribution() {
    long winner = "";
    switch (true) {
        case (trustedVotes[0].vote == trustedVotes[1].vote):
        case (trustedVotes[0].vote == trustedVotes[2].vote):
            winner = trustedVotes[0].vote;
            break;
        case (trustedVotes[1].vote == trustedVotes[2].vote):
            winner = trustedVotes[1].vote;
            break;
        default:
            // no consensus
            return;
    }
    for (i = 0; i < country.length; i++) {
        if (country[i].letters == winner) {
            // found a match!
            long winId = country[i].tokenId;
            // Burn all TMG.
            sendQuantity(0x7fffffffffffffff, TMGid, 0);
            // Check winners
            if (getAssetHoldersCount(1, winId) == 0) {
                // No one has the token of the winner
                // Donate to SNA
                sendAmount(getCurrentBalance() - activationAmount, DONATION_ADDRESS);
            } else {
                do {
                    distributeToHolders(1, winId, getCurrentBalance() - activationAmount, nZero, nZero);
                    if (getCurrentBalance() > activationAmount) {
                        sleep;
                        continue;
                    }
                } while (false);
            }
            return;
        }
    }
}
```

## Testcases
All lines and branches are covered with tests in SC-Simulator.

Testcase 1: Phase 1
```js
[
  {
    "blockheight": 2,
    "sender": "10000n",
    "recipient": "999n",
    "amount": "4802_0000_0000n"
  },
  {
    // Buy with excess signa. Expect getting one token and some signa refund
    "blockheight": 4,
    "sender": "10001",
    "recipient": "999",
    "amount": "4200_0000",
    "messageText": "buy",
    "tokens": [
       {"asset": 222333, "quantity": 10}
    ]
  },
  {
    // Buy with excess signa and tmg. Expect getting one token and refund signa and tmg.
    "blockheight": 6,
    "sender": "10001",
    "recipient": "999",
    "amount": "4200_0000",
    "messageText": "buy",
    "tokens": [
       {"asset": 222333, "quantity": 11}
    ]
  },
  {
    // Buy 10 tokens. Expect receiving 10 tokens and no refund.
    "blockheight": 8,
    "sender": "10001",
    "recipient": "999",
    "amount": "3_2000_0000",
    "messageText": "buy",
    "tokens": [
       {"asset": 222333, "quantity": 100}
    ]
  },
  {
    // Add balance (increase prize). Expect no refund.
    "blockheight": 10,
    "sender": "10001",
    "recipient": "999",
    "amount": "3_2000_0000"
  },
  {
    // Add tmg and signa to accumulate prize. Expect no refund.
    "blockheight": 12,
    "sender": "10001",
    "recipient": "999",
    "amount": "3_2000_0000",
    "tokens": [
       {"asset": 222333, "quantity": 100}
    ]
  }
]
```

Testcase 2: Phase 2 right transactions
```js
[
  {
    "blockheight": 2,
    "sender": "10000n",
    "recipient": "999n",
    "amount": "4802_0000_0000n"
  },
  {
    // Buy 10 tokens. Expect receiving 10 tokens and no refund.
    "blockheight": 4,
    "sender": "10001",
    "recipient": "999",
    "amount": "3_2000_0000",
    "messageText": "buy",
    "tokens": [
       {"asset": 222333, "quantity": 100}
    ]
  },
  {
    // vote. Expect memory update accordingly.
    "blockheight": 21,
    "sender": "505",
    "recipient": "999",
    "amount": "3200_0000",
    "messageText": "BRA"
  },
  {
    // vote. Expect memory update and distribution or donation.
    "blockheight": 23,
    "sender": "506",
    "recipient": "999",
    "amount": "3200_0000",
    "messageText": "BRA"
  }
]
```

Testcase 3: Phase 2 wrong transactions
```js
[
  {
    "blockheight": 2,
    "sender": "10000n",
    "recipient": "999n",
    "amount": "4802_0000_0000n"
  },
  {
    // Buy 10 tokens. Expect receiving 10 tokens and no refund.
    "blockheight": 4,
    "sender": "10001",
    "recipient": "999",
    "amount": "3_2000_0000",
    "messageText": "buy",
    "tokens": [
       {"asset": 222333, "quantity": 100}
    ]
  },
    // 3 diff votes, do nothing
  { "blockheight": 21, "sender": "505", "recipient": "999", "amount": "3200_0000", "messageText": "BRA" },
  { "blockheight": 21, "sender": "506", "recipient": "999", "amount": "3200_0000", "messageText": "CAN" },
  { "blockheight": 21, "sender": "507", "recipient": "999", "amount": "3200_0000", "messageText": "MOR" },
    // vote 2 and 3 same, but invalid. Do nothing
  { "blockheight": 23, "sender": "506", "recipient": "999", "amount": "3200_0000", "messageText": "NOT" },
  { "blockheight": 23, "sender": "507", "recipient": "999", "amount": "3200_0000", "messageText": "NOT" },
    // vote 1 and 3 same, but invalid. Do nothing
  { "blockheight": 25, "sender": "505", "recipient": "999", "amount": "3200_0000", "messageText": "MYK" },
  { "blockheight": 25, "sender": "507", "recipient": "999", "amount": "3200_0000", "messageText": "MYK" },
    // buying tokens after end
  {
    // Buy 10 tokens. Expect receiving 10 tokens and no refund.
    "blockheight": 27,
    "sender": "10001",
    "recipient": "999",
    "amount": "3_2000_0000",
    "messageText": "buy",
    "tokens": [
       {"asset": 222333, "quantity": 100}
    ]
  }
]
```
