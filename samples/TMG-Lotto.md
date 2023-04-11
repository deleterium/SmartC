# TMG Weekly Lotto
 * Weekly draw (2560 blocks).
 * At least one and only one winner.
 * Prize is 90% of contract balance. The remaining is kept to incentive next contest.

## Buying a ticket
 * Player sends a transaction with some amount of Signa and TMG, multiple of minimum ticket price.
 * Starting ticket price is 100 Signa and 0.05 TMG.
 * If sent the values are wrong, they will be refunded. Values must be precise!
 * If user sends no TMG, the Signa value will be added to the prize. Sending another tokens to the contract is considered donation to contract creator.
 * Player can buy many tickets at once, sending a multiple of ticket price in Signa and TMG (Example: sending 500 Signa and 0.25 TMG is same as buying 10 tickets)
 * It is recomended to use a helping the web page, where the transaction values will be calculated 

## Fees
 * A fee for contract activation will be charge for every transaction. It costs 0.5 Signa.
 * The contract activation fee will charged one per transaction. It doesn't matter if the transaction is buying 1 or 20 tickets.
 * All Signa collected will be distributed as prize.
 * The lottery fee is charged in TMG. On every draw, all TMG in contract will be burnt.
 * No fees for contract owner.
 * The burnt TMG is to promote The Mining Game and for the benefit of TMG holders.

 ## Draw process
 * Process similar to The Mining Game deadlines.
 * On draw, a random number from the last block signature will be picked.
 * The lucky number for each ticket sale will be calculated:
   * Get the transaction ID from a ticked sale
   * Mix it with the random number (XOR operation)
   * Divide by two to avoid negative numbers in calculations (shift to right 1 bit)
   * Divide by the number of tickets bought.
 * The transaction that has the lowest lucky number will be winner
 * If there is no players, the draw will be extended at least for one week after first ticket sale.
 * If there is only one player, the player will have 100% of winning the prize.

## Management
 * Onwer can change the ticket price (Signa and/or TMG). It will be effective only for the next contest. This means, every contest will have a fixed ticket price.
 * Ticket price in TMG will be ajusted so the TMG value will be within 10% to 20% of Signa price.
 * Onwer can claim other tokens sent to the contract.
 * Onwer can not remove Signa or TMG from contract.
 * Onwer will add 3000 Signa as first prize and will not buy tickets in the first two contests.

## Interface
 * A web page will present the contract details, including but not restricted to: Current prize, Number of tickets, Ticket price, Last winner and Details for last draw (the ticket number for each transaction that bought tickets).
 * Option to buy tickets easily using Signum XT Wallet browser extension and other methods.
 * Open source page, allowing other hosts to deploy their version or be an alternative.

## Security analisys
 * It is known that a player can manipulate the transaction ID of his transaction, but this is irrelevant because mixing it with the random number will lead to another random number.
 * Manipulate the block generation signature is very dificult because it must be done by the block forger and within 4 minutes.
 * There's a very small risk that the block signature can be tampered. This is an inherent problem of generating random numbers in consensus blockchain's.
 * Web page can be cloned by a bad actor and victims can send Signa to other addresses.

## Deployments
* `TS-DTGV-AH8S-RYU2-7LY88` in Testnet. Page available at https://deleterium.info/tmg-lotto-testnet/

## Source code

### Lottery contract
```c
#program name TMGWeeklyLotto
#program description Lottery that pays 90% of contract balance for only\
 one lucky ticket. 10% is left as incentive for next contest. Fee is\
 charged in TMG, that are burnt weekly. More info at the website that\
 is sent in the transaction with the prize.
#define ACTIVATION_AMOUNT 5000_0000
#program activationAmount ACTIVATION_AMOUNT

#pragma verboseAssembly
#pragma optimizationLevel 3
#pragma version 2.1.1
#pragma maxConstVars 3

#define MAX_POSITIVE 0x7fffffffffffffff

/* Start of configurations */

#define TICKET_PRICE_SIGNA 100_0000_0000
#define TICKET_PRICE_TMG 5

// SIMULATOR | TESTNET | MAINNET
#define TESTNET

#ifdef SIMULATOR
  #define TMG_ID 222333
  #define TIMER_CONTRACT 1000
  #define CONTEST_FREQUENCY 10
  #define PRIZE_PERCENT 100
#else
  #ifdef TESTNET
    #define TMG_ID 15297368334901195317
    #define TIMER_CONTRACT 15300617597939684559
    #define CONTEST_FREQUENCY 360
    #define PRIZE_PERCENT 90
  #else
    // MAINNET
    #define TMG_ID 11955007191311588286
    #define TIMER_CONTRACT ?
    #define CONTEST_FREQUENCY 2520
    #define PRIZE_PERCENT 90
    #program codeHashId 0
  #endif
#endif

/* End of configurations */

/* start of global variables */
struct TXINFO {
    long txid;
    long sender;
    long amount;
    long quantity;
} currentTX;

struct STATS {
    long totalPrizesPaid;
    long totalTmgBurnt;
    long totalTicketsSold;
} stats;

struct CURRENT_DRAW {
    long contest;
    long noOfTickets;
    long tmgByTicked;
    long ticketPrice;
    long drawHeight;
} currDraw;

struct LAST_DRAW {
    long randomNumber; // last draw magic number
    long bestTicket;
    long bestSender;
    long bestTxId;
    long atHeight; // last draw starting height (the last height that tickets are included in draw)
    long prize; // last prize paid
    long drawFunctionEnded; // if true, values are valid. If false, draw still processing message
} lastDraw;

struct NEXT_DRAW {
    long tmgByTicked;
    long ticketPrice;
} nextDraw;

long owner;
long winnerMessage[4];
long boughtMessage[4];
long n10, n32;
long timerOn ;
long previousRewindPoint;
long newRewindPoint;
long ticketsQty;
long tmgId;

/* End of global variables */

// Initial setup
owner = getCreator();
const n10 = 10, n32 = 32;
const timerOn = false;
const previousRewindPoint = 0;
const newRewindPoint = 0;
const ticketsQty = 0;
const tmgId = TMG_ID;
const currDraw.tmgByTicked = TICKET_PRICE_TMG;
const nextDraw.tmgByTicked = TICKET_PRICE_TMG;
const currDraw.ticketPrice = TICKET_PRICE_SIGNA;
const nextDraw.ticketPrice = TICKET_PRICE_SIGNA;
const currDraw.contest = 1;
const winnerMessage[] = "You are lucky!                  ";
const boughtMessage[] = "You bought              tickets.";
// end of initial setup

void main () {
    long triggerDraw;
    do {
        triggerDraw = false;
        while ((currentTX.txid = getNextTx()) != 0) {
            // get details
            currentTX.sender = getSender(currentTX.txid);
            currentTX.amount = getAmount(currentTX.txid);
            currentTX.quantity = getQuantity(currentTX.txid, tmgId);
            if (currentTX.quantity == 0) {
                // adding balance OR timer
                if (currentTX.sender == TIMER_CONTRACT) {
                    triggerDraw = true;
                    timerOn = false;
                }
                if (currentTX.sender == owner) {
                    processOnwerCommand();
                }
                continue;
            }
            if (!isValidTx()) {
                // TMG sent, but wrong values. Refund transaction
                sendQuantityAndAmount(currentTX.quantity, TMG_ID, currentTX.amount, currentTX.sender);
                continue;
            }
            // From now on only valid transactions
            if (timerOn == false) {
                dispatchTimer();
            }
            // "You bought X tickets"
            ticketsQty = currentTX.quantity / currDraw.tmgByTicked;
            currDraw.noOfTickets += ticketsQty;
            stats.totalTicketsSold += ticketsQty;
            boughtMessage[2] = ltoa(ticketsQty);
            boughtMessage[3] = "ticket. ";
            if (ticketsQty > 1) {
                boughtMessage[3] = "tickets.";
            }
            sendMessage(boughtMessage, currentTX.sender);
        }
        // After all transactions processed
        if (triggerDraw) {
            // Adjusting the _counterTimestamp preparing for draw() to loop again over
            // all incoming transactions for current contest.
            lastDraw.drawFunctionEnded = false;
            newRewindPoint = _counterTimestamp;
            _counterTimestamp = previousRewindPoint;
            draw();
            previousRewindPoint = newRewindPoint;
            _counterTimestamp = newRewindPoint;
            lastDraw.drawFunctionEnded = true;
        }
        // Theoretically possible, the draw process can go into next block and
        // process more transactions.
        // Simulating a new activation if there was a draw.
    } while (triggerDraw);
}

// Process all transaction for a given contest between _currentTimestamp
// and newRewindPoint, selects the best ticket and pay the prize. Also
// refunds wrong transactions with TMG attached.
void draw(void) {
    lastDraw.prize = 0;
    lastDraw.atHeight = getCurrentBlockheight();
    lastDraw.randomNumber = getWeakRandomNumber();
    lastDraw.bestTicket = MAX_POSITIVE;
    lastDraw.bestSender = 0;
    while ((currentTX.txid = getNextTx()) != 0) {
        currentTX.sender = getSender(currentTX.txid);
        currentTX.amount = getAmount(currentTX.txid);
        currentTX.quantity = getQuantity(currentTX.txid, tmgId);
        if (currentTX.quantity == 0) {
            // Do not process transactions without TMG and
            continue;
        }
        if (_counterTimestamp > newRewindPoint) {
            // this transaction to be processed in the next draw!!!
            lastDraw.prize -= currentTX.amount;
            continue;
        }
        if (!isValidTx()) {
            // TMG sent, but wrong values. Already refunded.
            continue;
        }
        // Get ticket for valid transactions
        ticketsQty = currentTX.quantity / currDraw.tmgByTicked;
        long ticket = ((currentTX.txid ^ lastDraw.randomNumber) >> 1) / ticketsQty;
        if (ticket < lastDraw.bestTicket) {
            lastDraw.bestTicket = ticket;
            lastDraw.bestSender = currentTX.sender;
            lastDraw.bestTxId = currentTX.txid;
        }
    }
    // After all transactions processed
    if (lastDraw.bestSender == 0) {
        // There was no players. Delay draw until a ticket is sold.
        return;
    }
    if (timerOn == false) {
        dispatchTimer();
    }
    lastDraw.prize += ((getCurrentBalance() - 2_0000_0000) * PRIZE_PERCENT) / 100;
    stats.totalPrizesPaid += lastDraw.prize;
    // You are the winner!!!
    sendAmountAndMessage(lastDraw.prize, winnerMessage, lastDraw.bestSender);
    // Burn TMG
    long tmgToBurn = getAssetBalance(tmgId);
    stats.totalTmgBurnt += tmgToBurn;
    sendQuantity(tmgToBurn, tmgId, 0);
    // Update new details for the upcoming contest
    currDraw.tmgByTicked = nextDraw.tmgByTicked;
    currDraw.ticketPrice = nextDraw.ticketPrice;
    // reset counters
    currDraw.noOfTickets = 0;
    currDraw.contest++;
}

void processOnwerCommand() {
    long ownerMessage[4];
    readMessage(currentTX.txid, 0, ownerMessage);
    switch (ownerMessage[0]) {
        case 1:
            winnerMessage[2] = ownerMessage[1];
            winnerMessage[3] = ownerMessage[2];
            break;
        case 2:
            // Used to change ticket options for the next contest
            nextDraw.ticketPrice = ownerMessage[1];
            nextDraw.tmgByTicked = ownerMessage[2];
            break;
        case 3:
            // Used to withdraw zombie tokens received
            if (ownerMessage[1] == 0 || ownerMessage[1] == tmgId) {
                // Owner cannot withdraw signa neither TMG
                break;
            }
            sendQuantity(MAX_POSITIVE, ownerMessage[1], owner);
            break;
    }
}

// Checks if amount and quantity are right
long isValidTx() {
    switch (true) {
        case (currentTX.quantity < currDraw.tmgByTicked):
        case (currentTX.quantity % currDraw.tmgByTicked):
        case (currentTX.amount != currDraw.ticketPrice * currentTX.quantity / currDraw.tmgByTicked):
            return false;
            break;
        default:
            return true;
    }
}

void dispatchTimer() {
    // dispatchTimer;
    sendAmount(1_2000_0000, TIMER_CONTRACT);
    timerOn = true;
    currDraw.drawHeight = getCurrentBlockheight() + CONTEST_FREQUENCY;
}

// Converts long val to string: val==23 => return = "23      "
long ltoa(long val) {
    long ret = "        ";
    if (val < 0 || val > 99999999)
        return ret;
    do {
        ret <<= 8;
        ret += '0' + val % 10;
        val /= 10;
    } while (val != 0);
    return ret;
}


/* testcase 1: simple draw
[
  {
    // starting program.
    "blockheight": 2,    "sender": "10000n",    "recipient": "999n",    "amount": "2_0830_0000n"
  },
  {
    // Buying one ticket. (also dispatch timer)
    "blockheight": 4,    "sender": "0xaaBBn",    "recipient": "999",    "amount": "100_5000_0000",    "tokens": [       {"asset": 222333, "quantity": 5}    ]
  },
  {
    // Buying 10 tickets.
    "blockheight": 6,    "sender": "0xaaCCn",    "recipient": "999",    "amount": "1000_5000_0000",    "tokens": [       {"asset": 222333, "quantity": 50}    ]
  },
  {
    // Buying 15 tickets.
    "blockheight": 8,    "sender": "0xaaDDn",    "recipient": "999",    "amount": "1500_5000_0000",    "tokens": [       {"asset": 222333, "quantity": 75}    ]
  },
  {
    // DRAW
    "blockheight": 10,    "sender": "1000",    "recipient": "999",    "amount": "1_1600_0000"
  }
]

*/

/* Testcase 2: many incoming tx during draw (add a sleep inside draw() to test for missing transactions)
[
  {
    // starting program.
    "blockheight": 2,    "sender": "10000n",    "recipient": "999n",    "amount": "2_0830_0000n"
  },
  {
    // Buying one ticket. (also dispatch timer)
    "blockheight": 4,    "sender": "0xaaBBn",    "recipient": "999",    "amount": "100_5000_0000",    "tokens": [       {"asset": 222333, "quantity": 5}    ]
  },
  {
    // Buying 10 tickets.
    "blockheight": 6,    "sender": "210",    "recipient": "999",    "amount": "1000_5000_0000",    "tokens": [       {"asset": 222333, "quantity": 50}    ]
  },
  {
    // Buying 10 tickets.
    "blockheight": 8,    "sender": "310",    "recipient": "999",    "amount": "1000_5000_0000",    "tokens": [       {"asset": 222333, "quantity": 50}    ]
  },
  {
    // DRAW
    "blockheight": 10,    "sender": "1000",    "recipient": "999",    "amount": "1_1600_0000"
  },
  {
    // Buying 10 tickets same block from receiving draw message.
    "blockheight": 10,    "sender": "410",    "recipient": "999",    "amount": "1000_5000_0000",    "tokens": [       {"asset": 222333, "quantity": 50}    ]
  },
  {
    // Buying 10 tickets one block after.
    "blockheight": 11,    "sender": "510",    "recipient": "999",    "amount": "1000_5000_0000",    "tokens": [       {"asset": 222333, "quantity": 50}    ]
  },
  {
    // Buying 10 tickets one block after.
    "blockheight": 12,    "sender": "610",    "recipient": "999",    "amount": "1000_5000_0000",    "tokens": [       {"asset": 222333, "quantity": 50}    ]
  },
  {
    // DRAW
    "blockheight": 14,    "sender": "1000",    "recipient": "999",    "amount": "1_1600_0000"
  }
  // expect 20 tickets for contest 2
]
*/

/* Testcase 3: many incoming tx during draw (add a sleep inside draw() to test for missing transactions)
               Owner changes the price for next contest
               Onwer updates the website info
[
  {
    // starting program.
    "blockheight": 2,    "sender": "10000n",    "recipient": "999n",    "amount": "2_0830_0000n"
  },
  {
    // Buying one ticket. (also dispatch timer)
    "blockheight": 4,    "sender": "110",    "recipient": "999",    "amount": "100_5000_0000",    "tokens": [       {"asset": 222333, "quantity": 5}    ]
  },
  {
    // Buying 10 tickets.
    "blockheight": 6,    "sender": "210",    "recipient": "999",    "amount": "1000_5000_0000",    "tokens": [       {"asset": 222333, "quantity": 50}    ]
  },
  {
    // Onwer divides the ticket price / tmgByTicket by 5.
    "blockheight": 8,    "sender": "555",    "recipient": "999",    "amount": "5000_0000",  "messageHex": "020000000000000000943577000000000100000000000000"
  },
  {
    // Onwer sets website.
    "blockheight": 8,    "sender": "555",    "recipient": "999",    "amount": "5000_0000",  "messageHex": "010000000000000061616262636364646565666667676868"
  },
  {
    // DRAW
    "blockheight": 10,    "sender": "1000",    "recipient": "999",    "amount": "1_1600_0000"
  },
  {
    // Buying 10 tickets same block from receiving draw message.
    "blockheight": 10,    "sender": "410",    "recipient": "999",    "amount": "1000_5000_0000",    "tokens": [       {"asset": 222333, "quantity": 50}    ]
  },
  {
    // Buying 50 tickets one block after (new contest prices).
    "blockheight": 11,    "sender": "510",    "recipient": "999",    "amount": "1000_5000_0000",    "tokens": [       {"asset": 222333, "quantity": 50}    ]
  },
  {
    // Buying 50 tickets one block after (new contest prices).
    "blockheight": 12,    "sender": "610",    "recipient": "999",    "amount": "1000_5000_0000",    "tokens": [       {"asset": 222333, "quantity": 50}    ]
  },
  {
    // DRAW
    "blockheight": 14,    "sender": "1000",    "recipient": "999",    "amount": "1_1600_0000"
  }
  // expect 100 tickets for contest 2
]
*/

/* Testcase 4: Owner removing zombie tokens / trying to get signa or TMG
[
  {
    // starting program.
    "blockheight": 2,    "sender": "10000n",    "recipient": "999n",    "amount": "2_0830_0000n"
  },
  {
    // Buying one ticket. (also dispatch timer)
    "blockheight": 4,    "sender": "110",    "recipient": "999",    "amount": "100_5000_0000",    "tokens": [       {"asset": 222333, "quantity": 5}    ]
  },
  {
    // Sending zombie token
    "blockheight": 6,    "sender": "210",    "recipient": "999",    "amount": "100_5000_0000",    "tokens": [       {"asset": 222333444, "quantity": 50}    ]
  },
  {
    // Onwer tries to get signa.
    "blockheight": 8,    "sender": "555",    "recipient": "999",    "amount": "5000_0000",  "messageHex": "03000000000000000000000000000000"
  },
  {
    // Onwer tries to get TMG.
    "blockheight": 8,    "sender": "555",    "recipient": "999",    "amount": "5000_0000",  "messageHex": "03000000000000007d64030000000000"
  },
  {
    // Onwer gets zombie token.
    "blockheight": 10,    "sender": "555",    "recipient": "999",    "amount": "5000_0000",  "messageHex": "0300000000000000048a400d00000000"
  }
  // expect getting zombie token but not signa neither tmg.
]
*/

/* testcase 5: One wrong tx to be refunded
[
  {
    // starting program.
    "blockheight": 2,    "sender": "10000n",    "recipient": "999n",    "amount": "2_0830_0000n"
  },
  {
    // Buying one ticket. (also dispatch timer)
    "blockheight": 4,    "sender": "101",    "recipient": "999",    "amount": "100_5000_0000",    "tokens": [       {"asset": 222333, "quantity": 5}    ]
  },
  {
    // Buying 10 tickets.
    "blockheight": 6,    "sender": "102",    "recipient": "999",    "amount": "1000_5000_0000",    "tokens": [       {"asset": 222333, "quantity": 50}    ]
  },
  {
    // WRONG TRANSACTION.
    "blockheight": 8,    "sender": "103",    "recipient": "999",    "amount": "1500_5000_0001",    "tokens": [       {"asset": 222333, "quantity": 75}    ]
  },
  {
    // DRAW
    "blockheight": 10,    "sender": "1000",    "recipient": "999",    "amount": "1_1600_0000"
  }
]
*/
```

### Timer contract
```c
#program name TMGLottoTimer
#program description 1) Receive a transaction from the Lotto contract;\
 2) Sleeps one week; 3) Send all balance to Lotto contract to trigger\
 a new draw.
#program activationAmount 5000_0000

#pragma verboseAssembly
#pragma optimizationLevel 3
#pragma version 2.1.1
#pragma maxConstVars 1

// SIMULATOR | TESTNET | MAINNET
#define MAINNET

#ifdef SIMULATOR
  #define TIME_INTERVAL 8
#else
  #ifdef TESTNET
    #define TIME_INTERVAL 358
  #else
    // MAINNET
    #define TIME_INTERVAL 2518
    #program codeHashId 3960370383754817351
  #endif
#endif

/* End of configurations */

/* start of global variables */
struct TXINFO {
    long txid;
    long sender;
} currentTX;

long owner;
long lottoContractId;
long sleepBlocks;
long phase;

/* End of global variables */

// Initial setup
owner = getCreator();
const sleepBlocks = TIME_INTERVAL;
// end of initial setup

void main () {
    long ownerMessage;
    long goingToSleep;
    do {
        goingToSleep = false;
        while ((currentTX.txid = getNextTx()) != 0) {
            // get details
            currentTX.sender = getSender(currentTX.txid);
            if (phase == 0) {
                if (currentTX.sender != owner) {
                    continue;
                }
                readShortMessage(currentTX.txid, &lottoContractId, 1);
                if (lottoContractId == 0) {
                    continue;
                }
                phase = 1;
                continue;
            }
            if (currentTX.sender != lottoContractId) {
                continue;
            }
            goingToSleep = true;
        }
        if (goingToSleep) {
            sleep sleepBlocks;
            sendBalance(lottoContractId);
        }
    } while (goingToSleep);
}

/* testcase 1: wrong messsages, no sleep
[
  {
    // not owner
    "blockheight": 2,    "sender": "10000n",    "recipient": "1000n",    "amount": "5000_0000n", "messageHex": "0100000000000000"
  },
  {
    // owner wrong message
    "blockheight": 4,    "sender": "555",    "recipient": "1000n",    "amount": "5000_0000n"
  },
  {
    // owner right message
    "blockheight": 6,    "sender": "555",    "recipient": "1000n",    "amount": "5000_0000n", "messageHex": "e703000000000000"
  },
  {
    // not owner (phase 1)
    "blockheight": 8,    "sender": "10000n",    "recipient": "1000n",    "amount": "5000_0000n", "messageHex": "0100000000000000"
  },
  {
    // owner wrong message  (phase 1)
    "blockheight": 10,    "sender": "555",    "recipient": "1000n",    "amount": "5000_0000n"
  },
  {
    // owner right message  (phase 1)
    "blockheight": 12,    "sender": "555",    "recipient": "1000n",    "amount": "5000_0000n", "messageHex": "0100000000000000"
  }
  // Expecting to set lotto contract id to 999 and no sleep/draw activation.
]

*/

/* Testcase 2: regular use
[
  {
    // owner right message
    "blockheight": 2,    "sender": "555",    "recipient": "1000n",    "amount": "5000_0000n", "messageHex": "e703000000000000"
  },
  {
    // Simulated incoming message from lotto contract
    "blockheight": 4,    "sender": "999",    "recipient": "1000n",    "amount": "1_2000_0000n"
  },
  // Expecting to sleep and send draw activation on round 13.
  {
    // Simulated incoming message from lotto contract
    "blockheight": 14,    "sender": "999",    "recipient": "1000n",    "amount": "1_2000_0000n"
  }
  // Expecting to sleep and send draw activation on round 23.
]
*/
```
