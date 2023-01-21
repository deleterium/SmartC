# Remote control
The contract will dispatch transactions according to instructions from its creator.

## How to use
* Deploy the contract
* Send some balance to it
* Use the included html file to create the transactions offline. The page will present a hex string with the commands
* Send the hex string to your contract as data message (do not send as text!)
* The contract will dispatch the transactions

Note that you are responsible to check if there is enough balance for all transactions and to send at least 0.101 Signa for contract activation.

## Use cases
It makes no sense to use this contract in this way, because it is much simpler and cheaper to send the transactions directly. But this code can be used as a module for other contracts, allowing the creator make any transaction.

## Deployments
* `TS-C8QQ-CKXC-2SW3-52BS6` in Testnet.

## Smart contract source code
```c
#program name RemoteControl
#program description I just do what the boss tells me to.
#define ACTIVATION_AMOUNT 1010_0000
#program activationAmount ACTIVATION_AMOUNT

#pragma verboseAssembly
#pragma optimizationLevel 3

#pragma version 2.1.1
#pragma maxConstVars 4

#program codeHashId 0

/* End of configurations */

struct TXINFO {
    long txid;
    long sender;
    long commands;
    long currentPage;
    long pageContent[4];
} currentTX;

// Constructor
long owner = getCreator();
// end Constructor

void main () {
    while ((currentTX.txid = getNextTx()) != 0) {
        // get details
        currentTX.sender = getSender(currentTX.txid);
        readShortMessage(currentTX.txid, &currentTX.commands, 1);
        if (currentTX.sender != owner) {
            break;
        }
        currentTX.currentPage = 1;
        while ((currentTX.commands & 0x7) != 0) {
            sendCommand();
            currentTX.commands >>= 3;
        }
    }
    // After all transactions processed
}

void sendCommand() {
    // process command
    readMessage(currentTX.txid, currentTX.currentPage, currentTX.pageContent);
    ++currentTX.currentPage;
    switch (currentTX.commands & 0x7) {
        case 1: // Send amount
            sendAmount(currentTX.pageContent[0], currentTX.pageContent[1]);
            break;
        case 2: // Send short message (16 bytes)
            sendShortMessage(currentTX.pageContent + 2, 2, currentTX.pageContent[1]);
            sendAmount(currentTX.pageContent[0], currentTX.pageContent[1]);
            break;
        case 3: // Send long message (up to 900 bytes)
            long noOfPages = currentTX.pageContent[2];
            long recipient = currentTX.pageContent[1];
            sendAmount(currentTX.pageContent[0], recipient);
            while (noOfPages > 0) {
                readMessage(currentTX.txid, currentTX.currentPage, currentTX.pageContent);
                ++currentTX.currentPage;
                --noOfPages;
                sendMessage(currentTX.pageContent, recipient);
            }
            break;
        case 4: // Send quantity
            sendQuantityAndAmount(currentTX.pageContent[2], currentTX.pageContent[3], currentTX.pageContent[0], currentTX.pageContent[1]);
            break;
    }
}
```

## Helping page source code
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h3>Send amount</h3>
    <input type="text" id="send_amount_recipient" placeholder="Recipient address or ID"><br>
    <input type="number" min="0.00000001" id="send_amount_amount"> Signa<br>
    <button id="send_amount_submit" onclick="pushSendAmount()">Push</button>
    <h3>Send message</h3>
    <input type="text" id="send_message_recipient" placeholder="Recipient address or ID"><br>
    <input type="number" min="0" id="send_message_amount"> Signa<br>
    <input type="text" id="send_message_message"><br>
    <label><input type="checkbox" id="send_message_is_text"> Message is plain text (disable to send bytes)</label><br>
    <button id="send_message_submit" onclick="pushSendMessage()">Push</button>
    <h3>Send quantity</h3>
    <input type="text" id="send_quantity_recipient" placeholder="Recipient address or ID"><br>
    <input type="number" min="0.00000001" id="send_quantity_amount"> Signa<br>
    <input type="text" id="send_quantity_asset"> Asset ID<br> 
    <input type="number" min="1" id="send_quantity_quantity"> Quantity in QNT!!!!<br> 
    <button id="send_quantity_submit" onclick="pushSendQuantity()">Push</button>
    <h3>Enqueued transactions</h3>
    <pre id="enqueued_description"></pre><br>
    <button id="clear" onclick="clearAll()">Clear</button>
    <h3>Output hexString</h3>
    <textarea readonly="readonly" id="outputBytes"></textarea>
<script>

const dataStructure = {
    header: 0n,
    items: [],
    hexMessage: ''
}
const Global = {
    server: "https://europe3.testnet.signum.network"
}

function pushSendAmount() {
    let recipient = document.getElementById('send_amount_recipient').value.trim();
    let amountNumber = document.getElementById('send_amount_amount').valueAsNumber;
    let fract = ((amountNumber % 1) * 1E8).toFixed(0);
    let integ = parseInt(amountNumber)
    let amountNQT = BigInt(integ) * 100000000n + BigInt(fract);

    if (/^\d+$/.test(recipient)) {
        recipientId = BigInt(recipient);
    } else {
        recipientId = rsDecode(recipient.slice(2));
    }
    if (recipientId === '' || recipientId < 0n || recipientId >= (1n<<64n)) {
        alert('Malformed recipient');
        return;
    }
    const item = BigIntToHexBigEndian(amountNQT) + BigIntToHexBigEndian(recipientId) + BigIntToHexBigEndian(0n) + BigIntToHexBigEndian(0n)
    pushData(1n, item);

    updateSummary();
}

function pushSendMessage() {
    let recipient = document.getElementById('send_message_recipient').value.trim();
    let amountNumber = document.getElementById('send_message_amount').valueAsNumber;
    let fract = ((amountNumber % 1) * 1E8).toFixed(0);
    let integ = parseInt(amountNumber)
    let amountNQT = BigInt(integ) * 100000000n + BigInt(fract);
    let message=document.getElementById('send_message_message').value
    if (document.getElementById('send_message_is_text').checked) {
        const encoder = new TextEncoder();
        message = encoder.encode(message).reduce((prev, curr) => {
            return prev + curr.toString(16)
        },'');
    }
    if (/^\d+$/.test(recipient)) {
        recipientId = BigInt(recipient);
    } else {
        recipientId = rsDecode(recipient.slice(2));
    }
    if (recipientId === '' || recipientId < 0n || recipientId >= (1n<<64n)) {
        alert('Malformed recipient');
        return;
    }
    if (message.length < 32) {
        const item = BigIntToHexBigEndian(amountNQT) + BigIntToHexBigEndian(recipientId) + message.padEnd(32, '0');
        pushData(2n, item);
    } else {
        let item = BigIntToHexBigEndian(amountNQT) + BigIntToHexBigEndian(recipientId) + BigIntToHexBigEndian(parseInt((message.length - 1)/ 64) + 1) + BigIntToHexBigEndian(0n)
        let i = 0;
        do {
            item += message.slice(64*i, 64*(i+1)).padEnd(64, '0');
            i++;
        } while (64 * i < message.length)
        pushData(3n, item);
    }
    updateSummary();
}

function pushSendQuantity() {
    let recipient = document.getElementById('send_quantity_recipient').value.trim();
    let amountNumber = document.getElementById('send_quantity_amount').valueAsNumber;
    let fract = ((amountNumber % 1) * 1E8).toFixed(0);
    let integ = parseInt(amountNumber)
    let amountNQT = BigInt(integ) * 100000000n + BigInt(fract);

    let assetId = BigInt(document.getElementById('send_quantity_asset').value);
    let quantityQNT = BigInt(document.getElementById('send_quantity_quantity').value);

    if (/^\d+$/.test(recipient)) {
        recipientId = BigInt(recipient);
    } else {
        recipientId = rsDecode(recipient.slice(2));
    }
    if (recipientId === '' || recipientId < 0n || recipientId >= (1n<<64n)) {
        alert('Malformed recipient');
        return;
    }
    const item = BigIntToHexBigEndian(amountNQT) + BigIntToHexBigEndian(recipientId) + BigIntToHexBigEndian(quantityQNT) + BigIntToHexBigEndian(assetId)
    pushData(4n, item);

    updateSummary();
}

function clearAll() {
    dataStructure.header = 0n;
    dataStructure.items = [];
    dataStructure.hexMessage = '';
    updateSummary();
}

async function updateSummary() {
    buildMessage();
    if (dataStructure.hexMessage.length <= 64) {
        document.getElementById('enqueued_description').innerHTML = 'No transaction yet.'
        return;
    }

    const costs = {
        signa: 10100000n, //activation amount
        asset: []
    }

    let text = '';
    let commands = HexBigEndianToBigInt(dataStructure.hexMessage.slice(0, 16));
    text += 'Following transactions will be made:\n';
    let page = 1;
    let opCost;
    let opRecipient;
    let opMessageHex, opMessageText;
    let utf8decoder = new TextDecoder('utf-8', { fatal: true }); // default 'utf-8' or 'utf8'
    let opNoOfPages;
    let opQuantity, opAssetId;
    let assetQuantityNumber, assetName;

    for (;(commands & 0x7n) != 0n; commands >>= 3n) {
        switch (commands & 0x7n) {
        case 1n:
            opCost = HexBigEndianToBigInt(dataStructure.hexMessage.slice(64*page, 64*page + 16));
            opRecipient = HexBigEndianToBigInt(dataStructure.hexMessage.slice(64*page + 16, 64*page + 32));
            page++;
            costs.signa += opCost + 9200000n; // adjust specific value
            text += `To ${idTOaccount(opRecipient)}: ${Number(opCost) / 1E8} Signa\n`
            break;
        case 2n:
            opCost = HexBigEndianToBigInt(dataStructure.hexMessage.slice(64*page, 64*page + 16));
            opRecipient = HexBigEndianToBigInt(dataStructure.hexMessage.slice(64*page + 16, 64*page + 32));
            opMessageHex = dataStructure.hexMessage.slice(64*page + 32, 64*page + 64);
            page++;
            costs.signa += opCost + 13800000n; // adjust specific value
            try {
                const messageBytes = hexStringToUIntArray(opMessageHex.replace(/(00)+$/,''))
                opMessageText = utf8decoder.decode(messageBytes);
            } catch (_e) {
                opMessageText = '<i>utf-8 decoding error</i>'
            }
            text += `To ${idTOaccount(opRecipient)}: ${Number(opCost) / 1E8} Signa and message '${opMessageText}' (${opMessageHex})\n`
            break;
        case 3n:
            opCost = HexBigEndianToBigInt(dataStructure.hexMessage.slice(64*page, 64*page + 16));
            opRecipient = HexBigEndianToBigInt(dataStructure.hexMessage.slice(64*page + 16, 64*page + 32));
            opNoOfPages = Number(HexBigEndianToBigInt(dataStructure.hexMessage.slice(64*page + 32, 64*page + 48)));
            page++;
            opMessageHex = dataStructure.hexMessage.slice(64*page, 64*(page + opNoOfPages));
            page += opNoOfPages;
            costs.signa += opCost + 9900000n + BigInt(opNoOfPages) * 10500000n;
            
            try {
                const messageBytes = hexStringToUIntArray(opMessageHex.replace(/(00)+$/,''))
                opMessageText = utf8decoder.decode(messageBytes);
            } catch (_e) {
                opMessageText = '<i>utf-8 decoding error</i>'
            }
            text += `To ${idTOaccount(opRecipient)}: ${Number(opCost) / 1E8} Signa and message '${opMessageText}' (${opMessageHex})\n`
            break;
        case 4n:
            opCost = HexBigEndianToBigInt(dataStructure.hexMessage.slice(64*page, 64*page + 16));
            opRecipient = HexBigEndianToBigInt(dataStructure.hexMessage.slice(64*page + 16, 64*page + 32));
            opQuantity = HexBigEndianToBigInt(dataStructure.hexMessage.slice(64*page + 32, 64*page + 48));
            opAssetId = HexBigEndianToBigInt(dataStructure.hexMessage.slice(64*page + 48, 64*page + 64));
            page++;
            costs.signa += opCost + 10500000n;
            {
                const assetItem = costs.asset.find(obj => obj.id === opAssetId)
                if (assetItem) {
                    const thisAssetNumber = Number(opQuantity)/Math.pow(10, assetItem.decimals)
                    assetItem.quantityNumber += thisAssetNumber
                    text += `To ${idTOaccount(opRecipient)}: ${Number(opCost) / 1E8} Signa and ${thisAssetNumber} ${assetItem.name}\n`
                } else {
                    let assetDecimals = 0;
                    try {
                        const response = await fetch(`${Global.server}/api?requestType=getAsset&asset=${opAssetId}`)
                        let asset = await response.json();
                        if (asset.errorCode) {
                            console.log("Unknown asset")
                            throw new Error("Unknown asset");
                        }
                        assetName = `${asset.name} (${opAssetId})`
                        assetQuantityNumber= Number(opQuantity)/Math.pow(10, asset.decimals);
                        assetDecimals = asset.decimals
                    } catch (_e) {
                        assetName = `<i>${opAssetId}</i>`
                        assetQuantityNumber= Number(opQuantity);
                    }
                    costs.asset.push({id: opAssetId, name: assetName, quantityNumber: assetQuantityNumber, decimals: assetDecimals})
                    text += `To ${idTOaccount(opRecipient)}: ${Number(opCost) / 1E8} Signa and ${assetQuantityNumber} ${assetName}\n`
                }
            }
            break;
        }
    }
    const assetsCosts = costs.asset.reduce((prev, curr) => `${prev}, ${curr.quantityNumber} ${curr.name}`, '')
    text += `\nMinimum balance needed is ${Number(costs.signa) / 1E8} Signa${assetsCosts}\n`
    document.getElementById('enqueued_description').innerHTML = text;
}

function buildMessage() {
    if (dataStructure.header === 0n) {
        dataStructure.hexMessage = ''
    } else {
        dataStructure.hexMessage = BigIntToHexBigEndian(dataStructure.header) +
            BigIntToHexBigEndian(0n) +
            BigIntToHexBigEndian(0n) +
            BigIntToHexBigEndian(0n) +
            dataStructure.items.reverse().join('')
    }
    document.getElementById('outputBytes').value = dataStructure.hexMessage;
    dataStructure.items.reverse()
}

function HexBigEndianToBigInt(text) {
    let out = 0n;
    for (let i=0; i<8; i++) {
        out <<= 8n;
        out |= BigInt("0x" + text.slice(14-2*i,16-2*i))
    }
    return out;
}

function BigIntToHexBigEndian(value) {
    const hex = value.toString(16).padStart(16, '0')
    let ret='';
    for (let i=0; i< 8; i++) {
        ret += hex.slice(14-2*i, 16-2*i);
    }
    return ret;
}

function pushData(itemType, item) {
    dataStructure.items.push(item);
    dataStructure.header = dataStructure.header << 3n | itemType;
}

// Convert a hex string to a byte array
function hexStringToUIntArray(hex) {
    const bytes = new Uint8Array(hex.length / 2)
    for (let c = 0; c < hex.length; c += 2) {
        bytes[c/2] = (parseInt(hex.substr(c, 2), 16));
    }
    return bytes;
}

//Input id in unsigned long (BigInt)
//Output string with account address (Reed-Salomon encoded)
function idTOaccount(id) {

    if (typeof(id) !== 'bigint') {
        return "#errror"
    }
    if (id < 0n || id > 18446744073709551615n) {
        return "#errror"
    }
    let gexp = [1, 2, 4, 8, 16, 5, 10, 20, 13, 26, 17, 7, 14, 28, 29, 31, 27, 19, 3, 6, 12, 24, 21, 15, 30, 25, 23, 11, 22, 9, 18, 1]
    let glog = [0, 0, 1, 18, 2, 5, 19, 11, 3, 29, 6, 27, 20, 8, 12, 23, 4, 10, 30, 17, 7, 22, 28, 26, 21, 25, 9, 16, 13, 14, 24, 15]
    let cwmap = [3, 2, 1, 0, 7, 6, 5, 4, 13, 14, 15, 16, 12, 8, 9, 10, 11]
    let alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ".split("")
    let base32alpha="0123456789abcdefghijklmnopqrstuv"
    let base32Length = 13
    let account = "S-"
    let i;
    
    function ginv(a) {
        return gexp[31 - glog[a]];
    }
    
    function gmult(a, b) {
        if (a == 0 || b == 0) {
            return 0;
        }
        return gexp[ (glog[a] + glog[b]) % 31 ]
    }
    
    if (id == 0){
        return ""
    }
    
    let base32=id.toString(32).padStart(13,"0").split("")
    var codeword=[]
    for (i=0; i<base32Length; i++){
        codeword.push( base32alpha.indexOf(base32[12-i]) );
    }
    
    var p = [0, 0, 0, 0]
    for (let i=base32Length-1; i>=0; i--) {
        let fb = codeword[i] ^ p[3]
        
        p[3] = p[2] ^ gmult(30, fb)
        p[2] = p[1] ^ gmult(6, fb)
        p[1] = p[0] ^ gmult(9, fb)
        p[0] = gmult(17, fb)
    }
    codeword.push(p[0], p[1], p[2], p[3])
    
    for (let i=0; i<17; i++) {
        account+=alphabet[codeword[cwmap[i]]]
            if ((i & 3) == 3 && i < 13) {
                account+="-"
            }
    }
    
    return account
}

/* eslint-disable camelcase */
// Decode REED-SALOMON burst address from string to long value
// Adapted from https://github.com/burst-apps-team/burstkit4j
function rsDecode(cypher_string) {
    const gexp = [1, 2, 4, 8, 16, 5, 10, 20, 13, 26, 17, 7, 14, 28, 29, 31, 27, 19, 3, 6, 12, 24, 21, 15, 30, 25, 23, 11, 22, 9, 18, 1];
    const glog = [0, 0, 1, 18, 2, 5, 19, 11, 3, 29, 6, 27, 20, 8, 12, 23, 4, 10, 30, 17, 7, 22, 28, 26, 21, 25, 9, 16, 13, 14, 24, 15];
    const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const codeword_map = [3, 2, 1, 0, 7, 6, 5, 4, 13, 14, 15, 16, 12, 8, 9, 10, 11];
    function gmult(a, b) {
        if (a === 0 || b === 0) {
            return 0;
        }
        const idx = (glog[a] + glog[b]) % 31;
        return gexp[idx];
    }
    function is_codeword_valid(codeword) {
        let sum = 0;
        let i, j, t, pos;
        for (i = 1; i < 5; i++) {
            t = 0;
            for (j = 0; j < 31; j++) {
                if (j > 12 && j < 27) {
                    continue;
                }
                pos = j;
                if (j > 26) {
                    pos -= 14;
                }
                t ^= gmult(codeword[pos], gexp[(i * j) % 31]);
            }
            sum |= t;
        }
        return sum === 0;
    }
    let codeword_length = 0;
    const codeword = [];
    let codework_index;
    for (let i = 0; i < cypher_string.length; i++) {
        const position_in_alphabet = alphabet.indexOf(cypher_string.charAt(i));
        if (position_in_alphabet <= -1) {
            continue;
        }
        codework_index = codeword_map[codeword_length];
        codeword[codework_index] = position_in_alphabet;
        codeword_length++;
    }
    if (codeword_length !== 17 || !is_codeword_valid(codeword)) {
        return '';
    }
    // base32 to base10 conversion
    const length = 13;
    let val = 0n;
    let mul = 1n;
    for (let i = 0; i < length; i++) {
        val += mul * BigInt(codeword[i]);
        mul *= 32n;
    }
    return val;
}
</script>
</body>
</html>
```