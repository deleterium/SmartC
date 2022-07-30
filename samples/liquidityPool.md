# Signa-Asset liquidity pool
## Default features
* Implements a liquidity pool (constant product formula).
* Includes measures to protect traders from sandwich attack: bots that monitor transactions to manipulate prices by changing transactions order.
* Liquity providers receive liquitidy tokens (lpToken) to redeem the balance later.
* Holders of lpTokens receive payments from trades fees.

## Configurable features (on deployment)
* Pool fee in parts per thousand.
* lpToken name.
* Fees are collected in Signa and asset. Choose if de distribution to holders of lpTokens are done in signa and asset, or if the asset fee is traded inside pool, so the payment will be only Signa.
* Minimum interval to try distribution (default is 1 day)

## Special features
* Contract owner can collect lost tokens stuck in the contract (but not get the main asset or balance)
* Contract owner can close the pool. All balance will be distributed to holders of lpTokens. The contract will enter a state to refund all transactions.
* Contract owner can select new address to be owner. The new onwer must accept the change.

## Trades protection
### First pass
All transactions that adds liquidity will be processed. Slippage for trades will be reduced.

### Second pass
All trades are enqueued. The sum for each trade type (buy asset / sell asset) is calculated.
* The overall trade is calculated as only two trades.
* First trade will be in the direction of strong movement (buy or sell). Trades moving towards pool stabilty will have a small advantage.
* Enqueued trades are processed, all using the same price.
* The order of transactions in the blockchain does not change the end price.

### Third pass
All liquidity removals. Protects traders from a sudden removal that will make the trade slippage higher.

## Source code
```c
#program name SignaAssetLiquidityPool
#program description 1) Implements a liquidity pool (constant product formula).\
 2) Includes measures to protect traders from sandwich attack: bots that\
 monitor transactions to manipulate prices by changing transactions order.\
 3) Liquity providers receive liquitidy tokens (lpToken) to redeem the balance\
 later. 4) Holders of lpTokens receive payments from trades fees. 
#define ACTIVATION_AMOUNT 4200_0000
#program activationAmount ACTIVATION_AMOUNT

#include APIFunctions

#pragma maxAuxVars 5
// #pragma verboseAssembly
#pragma optimizationLevel 3

#pragma version 2.0.1

#define SIMULATOR
// Name for liquidity token (max 8, only letters and number)
#define LP_TICKER "lpTMG"
// Pool fee in parts per thousand for each trade
#define POOL_FEE 20
// If true, fees collected in asset will be traded inside the pool before
// distribution, so liquidity providers receive only Signa. If false, the
// distribution will have Signa and assets
#define DISTRIBUTE_ONLY_SIGNA true

#ifdef SIMULATOR
  #define ASSET_ID 222333
  // Try distribution every block
  #define DISTRIBUTION_INTERVAL 1
#else
  #define ASSET_ID 18446744073709551615
  // Try distribution every day
  #define DISTRIBUTION_INTERVAL 360
#endif

/* End of configurations */

#define FIELD_TRADE_AMOUNT 0
#define FIELD_TRADE_SENDER 1
#define FIELD_REMOVE_AMOUNT 2
#define FIELD_REMOVE_SENDER 3

#define sqrt(val) (powf(val,half))

const fixed half = 0.5;
const long assetId = ASSET_ID;
const long distributeOnlySigna = DISTRIBUTE_ONLY_SIGNA;
long liquidityToken;

struct TXINFO {
    long txid;
    long sender;
    long amount;
    long quantity;
    long message[4];
} currentTX;

struct TOTAL {
    long signaTotal;
    long assetTotal;
} pool, block;

long currentLiquidity;
long enqueuedTrades, enqueuedRemovals;
long lastDistribution;
long i;

// Constructor
long owner = getCreator();
long newOwner = 0;
long shutdown = false;
liquidityToken = issueAsset(LP_TICKER, "", 0);
lastDistribution = getCurrentBlockheight();
// end Constructor

void main () {
    enqueuedTrades = 0;
    enqueuedRemovals = 0;
    block.assetTotal = 0;
    block.signaTotal = 0;
    while ((currentTX.txid = getNextTx()) != 0) {
        // get details
        currentTX.sender = getSender(currentTX.txid);
        currentTX.amount = getAmount(currentTX.txid);
        readMessage(currentTX.txid, 0, currentTX.message);
        currentTX.quantity = getQuantity(currentTX.txid, assetId);
        if (shutdown != 0) {
            refundTransaction();
            continue;
        }
        // process command
        switch (currentTX.message[0]) {
        case 'add':
            addLiquidity();
            break;
        case 'remove':
            removeLiquidity();
            break;
        case 'trade':
            processTrade();
            break;
        case "":
            // No message, do not process
            break;
        case 'accept':
            // new owner accepts ownership
            if (currentTX.sender == newOwner) {
                owner = currentTX.sender;
                newOwner = 0;
            }
            break;
        default:
            // unknow command
            if (currentTX.sender == owner) {
                processCreatorCommand();
                break;
            }
            refundTransaction();
        }
    }
    // After all transactions processed
    processEnqueuedTrades();
    processEnqueuedRemovals();
    switch (shutdown) {
    case 0:
        // regular distribution
        distributeDividends();
        break;
    case 1:
        // Return values to liquidity providers
        distributeToHolders(
            0,
            liquidityToken,
            getCurrentBalance() - ACTIVATION_AMOUNT,
            assetId,
            getAssetBalance(assetId)
        );
        pool.signaTotal = 0;
        pool.assetTotal = 0;
        currentLiquidity = 0;
        shutdown = 2;
        break;
    default:
        // burn excess
        sendAmount(getCurrentBalance() - ACTIVATION_AMOUNT, 0);
        shutdown++;
    }
}

void refundTransaction() {
    sendQuantityAndAmount(
        currentTX.quantity,
        assetId,
        currentTX.amount,
        currentTX.sender
    );
}

void addLiquidity() {
    long operationAsset,  operationSigna;
    long operationLiquidity;
    if (currentTX.amount == 0 || currentTX.quantity == 0) {
        refundTransaction();
        return;
    }
    if (currentLiquidity == 0) {
        operationSigna = currentTX.amount;
        operationAsset = currentTX.quantity;
        operationLiquidity = sqrt(operationAsset) * sqrt(operationSigna);
    } else {
        long excessSigna = currentTX.amount - mdv(currentTX.quantity, pool.signaTotal, pool.assetTotal);
        long excessAsset = currentTX.quantity - mdv(currentTX.amount, pool.assetTotal, pool.signaTotal);
        if (excessSigna < 0) {
            // Refund the excess of asset
            sendQuantityAndAmount(excessAsset, assetId, 0, currentTX.sender);
            operationAsset = currentTX.quantity - excessAsset;
            operationSigna = currentTX.amount;
        } else {
            // Refund the excess of signa
            sendAmount(excessSigna, currentTX.sender);
            operationAsset = currentTX.quantity;
            operationSigna = currentTX.amount - excessSigna;
        }
        operationLiquidity = currentLiquidity * operationSigna / pool.signaTotal ;
    }
    // Issue/send liquidity token
    mintAsset(operationLiquidity, liquidityToken);
    sendQuantityAndAmount(operationLiquidity, liquidityToken, 0, currentTX.sender);
    // Update totals
    pool.signaTotal += operationSigna;
    pool.assetTotal += operationAsset;
    currentLiquidity += operationLiquidity;
}

void removeLiquidity() {
    long liquidityWithdraw = getQuantity(currentTX.txid, liquidityToken);
    if (liquidityWithdraw == 0) {
        return;
    }
    setMapValue(FIELD_REMOVE_AMOUNT, enqueuedRemovals, liquidityWithdraw);
    setMapValue(FIELD_REMOVE_SENDER, enqueuedRemovals, currentTX.sender);
    enqueuedRemovals++;
}

void processEnqueuedRemovals() {
    for (i = 0; i < enqueuedRemovals; i++) {
        long qty = getMapValue(FIELD_REMOVE_AMOUNT, i);
        long sender = getMapValue(FIELD_REMOVE_SENDER, i);
        long calculatedSigna = pool.signaTotal * qty / currentLiquidity;
        long calculatedAsset = pool.assetTotal * qty / currentLiquidity;
        // Burn liquidity token
        sendQuantityAndAmount(qty, liquidityToken, 0, 0);
        // Send withdraw
        sendQuantityAndAmount(calculatedAsset, assetId, calculatedSigna, sender);
        // Update totals
        pool.signaTotal -= calculatedSigna;
        pool.assetTotal -= calculatedAsset;
        if (pool.signaTotal <= 0 || pool.assetTotal <= 0) {
            pool.signaTotal = 0;
            pool.assetTotal = 0;
            currentLiquidity = 0;
            return;
        }
        currentLiquidity -= qty;
    }
}

void processTrade() {
    if (currentTX.amount == 0 && currentTX.quantity == 0) {
        return;
    }
    if (currentLiquidity == 0) {
        refundTransaction();
        return;
    }
    if (currentTX.quantity != 0) {
        // User sending asset to get Signa
        sendAmount(currentTX.amount, currentTX.sender);
        setMapValue(FIELD_TRADE_AMOUNT, enqueuedTrades, -currentTX.quantity);
        setMapValue(FIELD_TRADE_SENDER, enqueuedTrades, currentTX.sender);
        block.assetTotal += currentTX.quantity;
        enqueuedTrades++;
        return;
    }
    // User sending Signa to get asset
    setMapValue(FIELD_TRADE_AMOUNT, enqueuedTrades, currentTX.amount);
    setMapValue(FIELD_TRADE_SENDER, enqueuedTrades, currentTX.sender);
    block.signaTotal += currentTX.amount;
    enqueuedTrades++;
}

void processEnqueuedTrades() {
    struct TRADES {
        long signa, quantity, sender;
    } currTrade;
    long opSigna, opAsset, deltaSigna, deltaAsset;
    struct TOTAL newTotal;

    if (enqueuedTrades == 0) {
        return;
    }
    // Process the sum of all trades as only two trades.
    // Avoid manipulation for trades order in blockchain.
    // The order is choosed to reward traders that help pool stability.
    block.signaTotal = mdv(block.signaTotal , 1000 - POOL_FEE, 1000);
    block.assetTotal = mdv(block.assetTotal , 1000 - POOL_FEE, 1000);
    long assetForSigna = pool.assetTotal * block.signaTotal / pool.signaTotal;
    long signaForAsset = pool.signaTotal * block.assetTotal / pool.assetTotal;
    if (assetForSigna > block.assetTotal) {
        // more signa incoming than asset. Process signa trade first
        deltaAsset = mdv(pool.signaTotal, pool.assetTotal, pool.signaTotal + block.signaTotal);
        deltaSigna = pool.signaTotal + block.signaTotal;
        newTotal.signaTotal = mdv(deltaAsset, deltaSigna, deltaAsset + block.assetTotal);
        newTotal.assetTotal = deltaAsset + block.assetTotal;
    } else {
        // Process signa trade second
        deltaSigna = mdv(pool.assetTotal, pool.signaTotal, pool.assetTotal + block.assetTotal);
        deltaAsset = pool.assetTotal + block.assetTotal;
        newTotal.assetTotal = mdv(deltaSigna, deltaAsset, deltaSigna + block.signaTotal);
        newTotal.signaTotal = deltaSigna + block.signaTotal;
    }
    // process all trades with same price ratio
    for (i = 0; i < enqueuedTrades; i++ ) {
        long temp = getMapValue(FIELD_TRADE_AMOUNT, i);
        currTrade.sender = getMapValue(FIELD_TRADE_SENDER, i);
        if (temp < 0) {
            currTrade.signa = 0;
            currTrade.quantity = -temp;
        } else {
            currTrade.signa = temp;
            currTrade.quantity = 0;
        }
        if (currTrade.quantity == 0) {
            // User sending Signa to get asset
            opSigna = mdv(currTrade.signa, 1000 - POOL_FEE, 1000);
            opAsset = mdv(opSigna, pool.assetTotal, newTotal.signaTotal);
            sendQuantityAndAmount(opAsset, assetId, 0, currTrade.sender);
        } else {
            // User sending asset to get Signa
            opAsset = mdv(currTrade.quantity, 1000 - POOL_FEE, 1000);
            opSigna = mdv(opAsset, pool.signaTotal, newTotal.assetTotal);
            sendAmount(opSigna, currTrade.sender);
        }
    }
    pool.signaTotal = newTotal.signaTotal;
    pool.assetTotal = newTotal.assetTotal;
}

void distributeDividends() {
    if (getCurrentBlockheight() - lastDistribution > DISTRIBUTION_INTERVAL) {
        long feesBalance = getCurrentBalance() - pool.signaTotal - ACTIVATION_AMOUNT;
        if (feesBalance < ACTIVATION_AMOUNT) {
            // do not distribute dust
            return;
        }
        long assetFeesBalance = getAssetBalance(assetId) - pool.assetTotal;
        //sendQuantityAndAmount(asssetFeesBalance, assetId, feesBalance, 0);
        if (distributeOnlySigna) {
            // Trade the asset fees to send only signa to liquidity providers
            long tradeAmount = mdv(pool.signaTotal, assetFeesBalance, pool.assetTotal + assetFeesBalance);
            pool.signaTotal -= tradeAmount;
            pool.assetTotal += assetFeesBalance;
            feesBalance += tradeAmount;
            assetFeesBalance = 0;
        }
        distributeToHolders(0, liquidityToken, feesBalance, assetId, assetFeesBalance);
    }
}

void processCreatorCommand() {
    switch (currentTX.message[0]) {
    case 'extract':
        if (currentTX.message[1] == 0 || currentTX.message[1] == assetId) {
            // owner can get stuck tokens in the contract, but not signa or
            // the pool asset.
            // message = { 'extract', stuckAssetId, quantity }
            return;
        }
        sendQuantityAndAmount(currentTX.message[2], currentTX.message[1], 0, owner);
        return;
    case 'shutdown':
        shutdown = 1;
        return;
    case 'newowner':
        // prepare to change ownership.
        newOwner = currentTX.message[1];
        return;
    }
}
```

## Testcases
All lines and branches are covered with tests in SC-Simulator.

Testcase 1: Add liquidity (distribute only signa = false)
```js
[
    // issue token
  { "blockheight": 2, "sender": "10000n", "recipient": "999n", "amount": "151_0000_0000n" },
    // add Liquidity 1 (note: distribution done)
  { "blockheight": 4, "sender": "10000n", "recipient": "999n", "amount": "100_4200_0000n", "messageText": "add", "tokens": [{ "asset": 222333, "quantity": 1000000 }] },
    // add Liquidity 2 (excess of 1 token)
  { "blockheight": 6, "sender": "10001n", "recipient": "999", "amount": "10_4200_0000", "messageText": "add", "tokens": [{ "asset": 222333, "quantity": 100001 }] },
    // add Liquidity 3 (excess of .1 signa)
  { "blockheight": 8, "sender": "10002n", "recipient": "999", "amount": "10_5200_0000", "messageText": "add", "tokens": [{ "asset": 222333, "quantity": 100000 }] },
    // add Liquidity 4 (wrong, no assets)
  { "blockheight": 10, "sender": "10003n", "recipient": "999", "amount": "10_4200_0000", "messageText": "add" }
]
```

Testcase 2: Remove liquidity (distribute only signa = false)
```js
[
    // issue token
  { "blockheight": 2, "sender": "10000n", "recipient": "999n", "amount": "151_0000_0000n" },
    // add Liquidity 1
  { "blockheight": 4, "sender": "10000n", "recipient": "999n", "amount": "100_4199_0000n", "messageText": "add", "tokens": [{ "asset": 222333, "quantity": 999999 }] },
    // move LPtokens
  { "blockheight": 6, "sender": "10000n", "recipient": "100n", "amount": "4200_000", "tokens": [{ "asset": 101010, "quantity": 1997979 }] },
  { "blockheight": 6, "sender": "10000n", "recipient": "101n", "amount": "4200_000", "tokens": [{ "asset": 101010, "quantity": 47951522 }] },
  { "blockheight": 6, "sender": "10000n", "recipient": "102n", "amount": "4200_000", "tokens": [{ "asset": 101010, "quantity": 49949500 }] },
    // Remove 1 (old LPTotal*2% - 1)
  { "blockheight": 8, "sender": "100n", "recipient": "999", "amount": "4200_0000", "messageText": "remove", "tokens": [{ "asset": 101010, "quantity": 1997979 }] },
    // Remove 2 (old LPTotal*48% + 1)
  { "blockheight": 10, "sender": "101n", "recipient": "999", "amount": "4200_0000", "messageText": "remove", "tokens": [{ "asset": 101010, "quantity": 47951522 }] },
    // Remove 3 (old LPTotal / 2 (exact))
  { "blockheight": 12, "sender": "102n", "recipient": "999", "amount": "4200_0000", "messageText": "remove", "tokens": [{ "asset": 101010, "quantity": 49949500 }] },
    // Remove wrong
  { "blockheight": 14, "sender": "10000n", "recipient": "999n", "amount": "4200_0000n", "messageText": "remove", "tokens": [{ "asset": 222333, "quantity": 9999 }] }
]
```

Testcase 3: Trade (distribute only signa = false)
```js
[
    // issue token
  { "blockheight": 2, "sender": "10000n", "recipient": "999n", "amount": "151_0000_0000n" },
    // add Liquidity 1 (note: distribution done)
  { "blockheight": 4, "sender": "10000n", "recipient": "999n", "amount": "100_4200_0000n", "messageText": "add", "tokens": [{ "asset": 222333, "quantity": 1000000 }] },
    // double trade 1, send 10000 tokens
  { "blockheight": 6, "sender": "101", "recipient": "999", "amount": "4200_0000", "messageText": "trade", "tokens": [{ "asset": 222333, "quantity": 10000 }] },
    // double trade 1, send 1000 tokens
  { "blockheight": 6, "sender": "102", "recipient": "999", "amount": "4200_0000", "messageText": "trade", "tokens": [{ "asset": 222333, "quantity": 1000 }] },
    // double trade 2, send 10 signa
  { "blockheight": 10, "sender": "201", "recipient": "999", "amount": "10_4200_0000", "messageText": "trade" },
    // double trade 2, send 20 signa
  { "blockheight": 10, "sender": "201", "recipient": "999", "amount": "20_4200_0000", "messageText": "trade" },
    // double trade 3, asymmetric more asset
  { "blockheight": 14, "sender": "101", "recipient": "999", "amount": "4200_0000", "messageText": "trade", "tokens": [{ "asset": 222333, "quantity": 8000 }] },
    // double trade 3, asymmetric more asset
  { "blockheight": 14, "sender": "201", "recipient": "999", "amount": "1_6200_0000n", "messageText": "trade" },
    // double trade 4, asymmetric more signa
  { "blockheight": 16, "sender": "101", "recipient": "999", "amount": "4200_0000", "messageText": "trade", "tokens": [{ "asset": 222333, "quantity": 8000 }] },
    // double trade 4, asymmetric more signa
  { "blockheight": 16, "sender": "201", "recipient": "999", "amount": "4_4200_0000n", "messageText": "trade" }
]
```

Testcase 4: Owner commands (distribute only signa = false)
```js
[
    // issue token
  { "blockheight": 2, "sender": "10000n", "recipient": "999n", "amount": "151_0000_0000n" },
    // add Liquidity 1 (note: distribution done)
  { "blockheight": 4, "sender": "10000n", "recipient": "999n", "amount": "100_4200_0000n", "messageText": "add", "tokens": [{ "asset": 222333, "quantity": 1000000 }] },
    // add some token
  { "blockheight": 6, "sender": "10000n", "recipient": "999n", "amount": "0n", "tokens": [{ "asset": "0xaabbccdd", "quantity": "0x11aa22bb33" }] },
    // extract token 0 (signa). Expect deny
  { "blockheight": 8, "sender": "555n", "recipient": "999n", "amount": "4200_0000n",  "messageHex": "65787472616374000000000000000000ffffffffffffff7f"},
    // extract token 222333 (assetId). Expect deny
  { "blockheight": 10, "sender": "555n", "recipient": "999n", "amount": "4200_0000n",  "messageHex": "65787472616374007d64030000000000ffffffffffffff7f"},
    // extract token 0xaabbccdd (another asset). Expect remove all
  { "blockheight": 12, "sender": "555n", "recipient": "999n", "amount": "4200_0000n",  "messageHex": "6578747261637400ddccbbaa00000000ffffffffffffff7f"},
    // change owner to 0xfffff3
  { "blockheight": 14, "sender": "555n", "recipient": "999n", "amount": "4200_0000n",  "messageHex": "6e65776f776e6572f3ffff0000000000"},
    // new owner accepts. Expect change of ownership
  { "blockheight": 16, "sender": "0xfffff3n", "recipient": "999n", "amount": "4200_0000n",  "messageText": "accept"},
    // new owner shutdown pool. Expect return of all assets and signa to liquidity provider
  { "blockheight": 18, "sender": "0xfffff3n", "recipient": "999n", "amount": "4200_0000n",  "messageText": "shutdown"},
    // trying to trade. Expect refund.
  { "blockheight": 20, "sender": "100n", "recipient": "999n", "amount": "1_4200_0000n",  "messageText": "trade"}
]
```

Testcase 5: Missing cases (distribute only signa = false)
```js
[
    // issue token
  { "blockheight": 2, "sender": "10000n", "recipient": "999n", "amount": "151_0000_0000n" },
    // add Liquidity 1 (note: distribution done)
  { "blockheight": 4, "sender": "10000n", "recipient": "999n", "amount": "100_4200_0000n", "messageText": "add", "tokens": [{ "asset": 222333, "quantity": 1000000 }] },
    // Wrong add Liquidity (expect refund)
  { "blockheight": 6, "sender": "10001n", "recipient": "999n", "amount": "100_4200_0000n", "messageText": "ADD", "tokens": [{ "asset": 222333, "quantity": 1000000 }] },
    // No command (values distributed to liquidity providers)
  { "blockheight": 8, "sender": "10001n", "recipient": "999n", "amount": "1_4200_0000n", "tokens": [{ "asset": 222333, "quantity": 10000 }] },
    // Wrong add (missing signa) (expect refund)
  { "blockheight": 10, "sender": "10001n", "recipient": "999n", "amount": "4200_0000n", "tokens": [{ "asset": 222333, "quantity": 10000 }] },
    // Wrong add (missing asset) (expect refund)
  { "blockheight": 10, "sender": "10001n", "recipient": "999n", "amount": "1_4200_0000n"},
    // Verify refund Signa (expect add and refund)
  { "blockheight": 12, "sender": "10002n", "recipient": "999n", "amount": "100000_4200_0000n", "tokens": [{ "asset": 222333, "quantity": 100 }] },
    // Verify refund Signa (expect add and refund)
  { "blockheight": 14, "sender": "10002n", "recipient": "999n", "amount": "1_4200_0000n", "tokens": [{ "asset": 222333, "quantity": 10000000000 }] },
    // Wrong remove (keep signa)
  { "blockheight": 16, "sender": "100n", "recipient": "999", "amount": "1_4200_0000", "messageText": "remove" },
    // Wrong trade (zero signa and tokens)
  { "blockheight": 18, "sender": "100n", "recipient": "999", "amount": "4200_0000", "messageText": "trade" }
]
```

Testcase 6: Trade at empty pool and distribute only signa = true
```js
[
    // issue token
  { "blockheight": 2, "sender": "10000n", "recipient": "999n", "amount": "150_5000_0000n" },
    // Trade at empty pool (expect refund)
  { "blockheight": 4, "sender": "100n", "recipient": "999n", "amount": "10_4200_0000n", "messageText": "trade"},
    // Add liquidity
  { "blockheight": 6, "sender": "10000n", "recipient": "999n", "amount": "100_4200_0000n", "messageText": "add", "tokens": [{ "asset": 222333, "quantity": 1000000 }] },
    // inject asset and signa for distribution. Expect trade and distribute only signa
  { "blockheight": 8, "sender": "10001n", "recipient": "999n", "amount": "1_4200_0000n", "tokens": [{ "asset": 222333, "quantity": 3333 }] }
]
```
