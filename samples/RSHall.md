**DEPRECATION NOTICE:**

This contract may be not compatible with SmartC version greater or equal 2 because Signum Rainbow Hard Fork broke some compatibilities.  Test before use or convert the API calls to new built-in functions.

# Hall of RS-Addresses
Check neat addresses generated by other people. Latest 180 registered addresses and the top 10 most voted will be listed on site.

## How to use
* Send 50 Signa to register your generated address.
* Send 10 Signa to vote in an address.
* Send 1 Signa to receive current website.

## Deployments
* `S-HALL-3MPC-VXNY-BH6W7` in Mainnet. Website https://deleterium.info/RSHall/
* `TS-C3T7-FFSB-4R3L-DTF8Z` in Testnet. Website https://deleterium.info/RSHallTestnet/

## Source code
```c
#define REGISTRATION_COST 50_0000_0000
#define VOTE_COST 10_0000_0000
#define INFO_COST 1_0000_0000

#program name RSHall
#program description Check neat addresses generated by other people.\
 Send 50 Signa to register your generated address.\
 Send 10 Signa to vote in an address.\
 Send 1 Signa to receive current website.\
 Lastest 180 addresses registered and the top 10 most voted will be listed on site.\
 Created with SmartC.
#program activationAmount INFO_COST

#pragma version 1.0

#include APIFunctions

#define DIVIDENDS 0x83CDA47900000000
#define VOTE_STR "choose: "
#define SMARTCNFT "S-NFT2-6MA4-KLA2-DNM8T"
// #define SMARTCNFT "TS-J8X4-6WB2-62W5-6ZTGZ"
#define MAX_RECORDS 180

struct TXINFO {
   long timestamp,
       amount,
       sender,
       voteTo;
} currentTX;

long maxRecords, needle;
long registered[MAX_RECORDS];
long regBlockHeight[90]; // MAX_RECORDS / 2
long votes[23]; // roundUp(MAX_RECORDS / 8)
long helpSite0, helpSite1;

B_To_Address_Of_Creator();
long CREATOR = Get_B1();

const long n2 = 2, n8 = 8, n10 = 10, byteMask = 0xff;
const maxRecords = MAX_RECORDS;

// main loop
for (;;) {
    for (;;) {
        A_To_Tx_After_Timestamp(currentTX.timestamp);
        if (Get_A1() == 0) {
            break;
        }
        getTxDetails();
        processTX();
    }
    distributeDividends();
}

void getTxDetails(void) {
    currentTX.timestamp = Get_Timestamp_For_Tx_In_A();
    currentTX.amount = Get_Amount_For_Tx_In_A();
    Message_From_Tx_In_A_To_B();
    if (Get_B1() == VOTE_STR) {
        currentTX.voteTo = atol(Get_B2()) - 1;
    } else {
        currentTX.voteTo = -1;
    }
    B_To_Address_Of_Tx_In_A();
    currentTX.sender = Get_B1();
}

void processTX(void) {
    long secondaryDiv, secondaryShift;

    if (currentTX.amount < VOTE_COST - INFO_COST) {
        // this is info request
        if (currentTX.sender == CREATOR) {
            // creator sent a message to set website
            Message_From_Tx_In_A_To_B();
            helpSite0 = Get_B1();
            helpSite1 = Get_B2();
            return;
        }
        Set_A1_A2("Check we", "bsite:  ");
        Set_A3_A4(helpSite0, helpSite1);
        Set_B1(currentTX.sender);
        Send_A_To_Address_In_B();
        if (currentTX.amount > 0) {
            // Refund excess
            Send_To_Address_In_B(currentTX.amount);
        }
        return;
    }

    if (currentTX.amount < REGISTRATION_COST - INFO_COST) {
        // this is vote
        if (currentTX.voteTo < 0 || currentTX.voteTo >= maxRecords) {
            // Error parsing vote string
            refund();
            return;
        }
        secondaryDiv = currentTX.voteTo / 8;
        secondaryShift = (currentTX.voteTo % 8) * 8;

        long currVotes = votes[secondaryDiv] & (byteMask << (secondaryShift));
        currVotes >>= (secondaryShift);
        if (currVotes != byteMask) {
            // Avoid byte overflow on increment.
            currVotes++;
        }
        votes[secondaryDiv] = (votes[secondaryDiv] & ~(byteMask << secondaryShift)) | (currVotes << (secondaryShift));
        Set_A1_A2("Thanks f", "or votin");
        Set_A3_A4("g!      ", "        ");
        Set_B1(currentTX.sender);
        Send_A_To_Address_In_B();
        currentTX.amount -= VOTE_COST - INFO_COST;
        if (currentTX.amount > 0) {
            // Refund excess
            Send_To_Address_In_B(currentTX.amount);
        }
        return;
    }

    // this is registration
    registered[needle] = currentTX.sender;
    secondaryDiv = needle / 2;
    secondaryShift = needle % 2;
    if (secondaryShift) {
        regBlockHeight[secondaryDiv] = (regBlockHeight[secondaryDiv] & 0x00000000ffffffff) | Get_Block_Timestamp();
    } else {
        regBlockHeight[secondaryDiv] = (regBlockHeight[secondaryDiv] & 0xffffffff00000000) | (Get_Block_Timestamp() >> 32);
    }
    secondaryDiv = needle / 8;
    secondaryShift = (needle % 8) * 8;
    votes[secondaryDiv] = votes[secondaryDiv] & ~(byteMask << secondaryShift);
    Set_A1_A2("Thanks f", "or your ");
    Set_A3_A4("registra", "tion!   ");
    Set_B1(currentTX.sender);
    Send_A_To_Address_In_B();
    currentTX.amount -= REGISTRATION_COST - INFO_COST;
    if (currentTX.amount > 0) {
        // Refund excess
        Send_To_Address_In_B(currentTX.amount);
    }
    ++needle;
    needle %= maxRecords;
}

void refund(void) {
    Set_A1_A2("Error. I", "nfo at: ");
    Set_A3_A4(helpSite0, helpSite1);
    Set_B1(currentTX.sender);
    Send_A_To_Address_In_B();
    Send_To_Address_In_B(currentTX.amount);
}

void distributeDividends(void) {
    Clear_A();
    Set_A1(DIVIDENDS);
    Set_B1(SMARTCNFT);
    Send_A_To_Address_In_B();
    Send_All_To_Address_In_B();
}

long atol(long val) {
    long ret = 0, chr;
    do {
        chr = (byteMask & val) - '0';
        if (chr < 0 || chr >= 10)
            break;
        ret *= 10;
        ret += chr;
        val >>= 8;
    } while (true);
    return ret;
}
```

## Tests for simulator

### Registration
* Block 2 -> Registration
* Block 4 -> Registration (verify regHeight)
* Block 6 -> Registration (verify regHeight / refund excess)
* Block 8 -> Registration error, parsed as voting but no message.

```json
[
  {
    "sender": "0xAABB",
    "recipient": "999n",
    "amount": "50_0000_0000n",
    "blockheight": 2
  },
  {
    "sender": "0xCCDDn",
    "recipient": "999n",
    "amount": "50_0000_0000",
    "blockheight": 4
  },
  {
    "sender": "0xEEFFn",
    "recipient": "999n",
    "amount": "51_0000_0000",
    "blockheight": 6
  },
  {
    "sender": "0xEEFFn",
    "recipient": "999n",
    "amount": "49_9999_9999",
    "blockheight": 8
  }
]
```

### Voting
* Block 2 -> Voting on zero
* Block 4 -> Voting on 2 (refund excess)
* Block 6 -> Voting on 8 (new long)
* Block 8 -> Voting on 2 again (increase counter)
* Block 10 -> Voting on non existent index

```json
[
  {
    "sender": "0xAAEEFFn",
    "recipient": "999n",
    "amount": "10_0000_0000",
    "blockheight": 2,
    "messageText": "choose: 1"
  },
  {
    "sender": "0xAAEEFFn",
    "recipient": "999n",
    "amount": "11_0000_0000",
    "blockheight": 4,
    "messageText": "choose: 3"
  },
  {
    "sender": "0xAAEEFFn",
    "recipient": "999n",
    "amount": "10_0000_0000",
    "blockheight": 6,
    "messageText": "choose: 9"
  },
  {
    "sender": "0xAAEEFFn",
    "recipient": "999n",
    "amount": "10_0000_0000",
    "blockheight": 8,
    "messageText": "choose: 3"
  },
  {
    "sender": "0xAAEEFFn",
    "recipient": "999n",
    "amount": "10_0000_0000",
    "blockheight": 10,
    "messageText": "choose: 181"
  }
]
```

### Registration clearing previous votes
* Block 2 -> Voting on zero and 1
* Block 4 -> Registration on zero and 1

```json
[
  {
    "sender": "0xAAEEFFn",
    "recipient": "999n",
    "amount": "10_0000_0000",
    "blockheight": 2,
    "messageText": "choose: 1"
  },
  {
    "sender": "0xAAFn",
    "recipient": "999n",
    "amount": "10_0000_0000",
    "blockheight": 2,
    "messageText": "choose: 2"
  },
  {
    "sender": "0xEEFFn",
    "recipient": "999n",
    "amount": "50_0000_0000",
    "blockheight": 4
  },
  {
    "sender": "0x2222n",
    "recipient": "999n",
    "amount": "50_0000_0000",
    "blockheight": 4
  }
]
```

### Request info
* Block 2 -> Request info
* Block 4 -> Set info (owner)
* Block 6 -> Request info (excess)

```json
[
  {
    "sender": "0xAFn",
    "recipient": "999n",
    "amount": "1_0000_0000",
    "blockheight": 2
  },
  {
    "sender": "555",
    "recipient": "999n",
    "amount": "2_0000_0000",
    "blockheight": 4,
    "messageText": "asdfasdfqwerqwe"
  },
  {
    "sender": "0xAen",
    "recipient": "999n",
    "amount": "9_9999_9999",
    "blockheight": 6,
    "messageText": "BUH!"
  }
]
```

### Tweaked tests
For these tests add following codes just before main loop:

```c
needle = MAX_RECORDS - 2;
votes[0] = 0xfe000000000000fe;
```

* Block 2 -> voting zero inc to 0xFF
* Block 4 -> voting zero still 0xFF
* Block 6 -> voting zero still 0xFF
* Block 8 -> voting 7 inc to 0xFF
* Block 10 -> voting 7 still 0xFF
* Block 12 -> voting 7 still 0xFF
* Block 14 -> registration going to before last position
* Block 16 -> registration going to last position (wrap needle)
* Block 18 -> registration going to first position

```json
[
  {
    "sender": "0xAAEEFFn",
    "recipient": "999n",
    "amount": "10_0000_0000",
    "blockheight": 2,
    "messageText": "choose: 1"
  },
  {
    "sender": "0xAAEEFFn",
    "recipient": "999n",
    "amount": "10_0000_0000",
    "blockheight": 4,
    "messageText": "choose: 1"
  },
  {
    "sender": "0xAAEEFFn",
    "recipient": "999n",
    "amount": "10_0000_0000",
    "blockheight": 6,
    "messageText": "choose: 1"
  },
  {
    "sender": "0xAAEEFFn",
    "recipient": "999n",
    "amount": "10_0000_0000",
    "blockheight": 8,
    "messageText": "choose: 8"
  },
  {
    "sender": "0xAAEEFFn",
    "recipient": "999n",
    "amount": "10_0000_0000",
    "blockheight": 10,
    "messageText": "choose: 8"
  },
  {
    "sender": "0xAAEEFFn",
    "recipient": "999n",
    "amount": "10_0000_0000",
    "blockheight": 12,
    "messageText": "choose: 8"
  },
  {
    "sender": "0xFE22n",
    "recipient": "999n",
    "amount": "50_0000_0000",
    "blockheight": 14
  },
  {
    "sender": "0xFF22n",
    "recipient": "999n",
    "amount": "50_0000_0000",
    "blockheight": 16
  },
  {
    "sender": "0x0022n",
    "recipient": "999n",
    "amount": "50_0000_0000",
    "blockheight": 18
  }
]
```
