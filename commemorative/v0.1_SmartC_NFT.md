# SmartC NFT
Be owner of SmartC keywords, support the project and also make an investment! The first multi function and multi items smart contract on Signum blockchain

## Starting help
This is a smart contract that allows interaction between accounts to buy, sell, hold or auction items. Commands are sent as unencrypted text messages to the contract. The owners have control over their items. A minimum value of 2 signa is necessary for the contract to be activated, but for simple operations some unspent amount will be refunded.

## Owner commands
All messages must be unencrypted!!!

* hold: Send a message `hold asm` and item will be safe. Ownership is protected until owner send another command.
* sell: Send a message `sell asm 500` and item asm will be on sale for 500 signa. Anyone who sends this amount (plus 2 signa for contract activation) will be the new owner. Previous onwer will receive that amount minus a support fee of 3% for Sigcc project.
* auction: Send a message `auction while 50` and item while will be on auction with starting bid of 50 signa. Once it receives the first BID, no further command will be possible by owner until auction ends.

## General commands
All messages must be unencrypted!!!
* status: Send a message `status do` and contract will send back a message to inform if item do is 1) locked; 2) on sale and its price; or 3) on auction with next bid amount and the numbers of blocks until auction's end. This features make sure the contract is blockchain complete and don't is dependent of this webpage.
* buy: Send a message `buy continue` with an amount bigger or equal current item price (plus 2 signa for contract activation) to become its new owner. If the amout is bigger, contract will refund the excess paid. Contract will set a new price 10% bigger than last one and item will stay on sale.
* bid: Send a message `bid const` with an amount bigger or equal item minimal bid (plus 2 signa for contract activation) to have your bid accepted. Any bigger amount will be understood as a bid, so no refund will happen. The balance will be secured in contract account. On auction end the balance will be sent to last owner and the highest bid sender will be new owner. If a new bigger bid is received, last bid will be refund to last sender.

## Auction details
* first_stage: Owner sends a message to start an auction. While there is no bids, owner can still change starting price, change to sale, or even lock again the item.
* second_stage: After first bid is accepted, the auction is unstoppable by owner. When a new bid is accepted, a new minimal bid is set 10% higher than the current bid and a new end date is set after 1440 blocks (4 days). The highest bid amount will stay on contract balance and previous bid is refunded.
* third_stage: It is auction end. From the highest bid amount is deducted an extra contract fee of 1 Signa (auction demands extra computations). Then it is deducted a support fee of 3% for Sigcc project. The previous owner receives the remaining signa and the new owner receives a message to inform ownership. Two hours before an auction end, if a message is received, the contract stays awake to avoid delays on payment. If there is no message within this time, then the auction will be ended on next transaction, before processing it. Auctioned item status will be changed to 'hold'.

## Smart contract source code

```c
#program name NFTSmartC
#program description Be owner of SmartC keywords, support the project and also make an investment! The first multi function and multi items smart contract on Signum blockchain, created with SmartC. Available items: asm, break, const, continue, do, else, exit, for, goto, halt, if, long, return, sleep, struct, void, while. Send a message to get an updated website with instructions and NFT status! General commands: `status item`, `buy item`, `bid item`. Owner only commands: `hold item`, `sell item price`, `auction item startingbid`. Only unencrypted messages are processed. Contract activation amount is 2 signa. Partial activation is refunded for simple commands. Support fee for SmartC is 3% deducted from seller during ownership transfer. Auction ends in 4 day after last accepted bid and has an additional gas fee of 1 signa. If a transaction arrives two hours before an auction end, contract stays awake to avoid delays on payments, if not, it will be ended at next incoming message.
#program activationAmount 2_0000_0000
// https://bit.ly/3x1ivbx
#pragma maxAuxVars 3
#pragma maxConstVars 7
#pragma globalOptimization
#pragma enableLineLabels
#pragma version 0.1

#include APIFunctions

//contract constants
const long ONE_SIGMA      =  1_0000_0000; //NQT
const long GAS_TARGET     = 10_0150_0000; //NQT
const long MAX_GAS_REFUND =  1_6100_0000; //NQT
const long ENDAUCTION_FEE =  1_0000_0000; //NQT
const long HOLD="hold", AUCTION="auction", SELL='sell';
const long STATUS="status";
const long BID="bid", BUY='buy';
const long n8=8, n10=10, n32=32, n100=100, n110=110, n0xFF=0xff;

//Payment/Auction options
const long CREATOR = 'S-DKVF-VE8K-KUXB-DELET';
const long CREATOR_FEE=3; //in percent
const long AUCTIODURATION = 1440; //blocks

//global variables
long nextAuction;
long currBlock;
long msgBuilder[5];
long creator_balance;
long helpSite0, helpSite1;
long processTxStartBalance;
long i;

struct TXINFO {
   long timestamp;
   long sender;
   long amount;
   long message[4];
} currentTX;

struct NICESTATS {
    long messagesProcessed;
    long sales;
    long auctions;
    long bids;
    long smoke;
    long gasRefund;
} lifetimeStats;


struct NFT {
    long owner;
    long name;
    long status;
    long price;
    long auctionEnd;
    long highestBid;
    long highestBidSender;
} collection[17], *pcol;
const long collection_length=17;

//Setting up NFT
const collection[ 0].name="asm";
const collection[ 1].name="break";
const collection[ 2].name="const";
const collection[ 3].name="continue";
const collection[ 4].name="do";
const collection[ 5].name="else";
const collection[ 6].name="exit";
const collection[ 7].name="for";
const collection[ 8].name="goto";
const collection[ 9].name="halt";
const collection[10].name="if";
const collection[11].name="long";
const collection[12].name="return";
const collection[13].name="sleep";
const collection[14].name="struct";
const collection[15].name="void";
const collection[16].name="while";
const collection[ 0].owner='S-DKVF-VE8K-KUXB-DELET';
const collection[ 1].owner='S-DKVF-VE8K-KUXB-DELET';
const collection[ 2].owner='S-DKVF-VE8K-KUXB-DELET';
const collection[ 3].owner='S-DKVF-VE8K-KUXB-DELET';
const collection[ 4].owner='S-DKVF-VE8K-KUXB-DELET';
const collection[ 5].owner='S-DKVF-VE8K-KUXB-DELET';
const collection[ 6].owner='S-DKVF-VE8K-KUXB-DELET';
const collection[ 7].owner='S-DKVF-VE8K-KUXB-DELET';
const collection[ 8].owner='S-DKVF-VE8K-KUXB-DELET';
const collection[ 9].owner='S-DKVF-VE8K-KUXB-DELET';
const collection[10].owner='S-DKVF-VE8K-KUXB-DELET';
const collection[11].owner='S-DKVF-VE8K-KUXB-DELET';
const collection[12].owner='S-DKVF-VE8K-KUXB-DELET';
const collection[13].owner='S-DKVF-VE8K-KUXB-DELET';
const collection[14].owner='S-DKVF-VE8K-KUXB-DELET';
const collection[15].owner='S-DKVF-VE8K-KUXB-DELET';
const collection[16].owner='S-DKVF-VE8K-KUXB-DELET';
const collection[ 0].status='auction';
const collection[ 1].status='auction';
const collection[ 2].status='auction';
const collection[ 3].status='auction';
const collection[ 4].status='auction';
const collection[ 5].status='auction';
const collection[ 6].status='auction';
const collection[ 7].status='auction';
const collection[ 8].status='auction';
const collection[ 9].status='auction';
const collection[10].status='auction';
const collection[11].status='auction';
const collection[12].status='auction';
const collection[13].status='auction';
const collection[14].status='auction';
const collection[15].status='auction';
const collection[16].status='auction';
const collection[ 0].price=50;
const collection[ 1].price=50;
const collection[ 2].price=50;
const collection[ 3].price=50;
const collection[ 4].price=50;
const collection[ 5].price=50;
const collection[ 6].price=50;
const collection[ 7].price=50;
const collection[ 8].price=50;
const collection[ 9].price=50;
const collection[10].price=50;
const collection[11].price=50;
const collection[12].price=50;
const collection[13].price=50;
const collection[14].price=50;
const collection[15].price=50;
const collection[16].price=50;


//all set, starting program
void main(void) {

    do {
        currBlock = Get_Block_Timestamp() >> n32;

        // check for auctions end before any message
        if ( nextAuction != 0 && nextAuction <= currBlock) {
            checkAuction();
        }

        //loop all incoming TX
        for (A_To_Tx_After_Timestamp(currentTX.timestamp); Get_A1() != 0; A_To_Tx_After_Timestamp(currentTX.timestamp) ) {

            //fill transaction information
            currentTX.amount  = Get_Amount_For_Tx_In_A();
            currentTX.timestamp = Get_Timestamp_For_Tx_In_A();
            B_To_Address_Of_Tx_In_A();
            currentTX.sender = Get_B1();
            Message_From_Tx_In_A_To_B();
            currentTX.message[0]=Get_B1();
            currentTX.message[1]=Get_B2();
            currentTX.message[2]=Get_B3();
            currentTX.message[3]=Get_B4();
            //end
            
            // all set, process every new TX
            processTX();
        }

        // pay creator
        if (creator_balance != 0) {
            Set_B1(CREATOR);
            Send_To_Address_In_B(creator_balance);
            creator_balance=0;
        }
        
        if (nextAuction != 0 && nextAuction - n32 < currBlock) {
            //Less than 2 hours to auction end. Stay on!
            sleep 1;
            continue;
        } else 
            break;

    } while (1);

    burnOut();
}

void endAuction(struct NFT *nftItem) {
    
    long value, deductedAmount;

    // inform previous owner
    send_message.recipient=nftItem->owner;
    msgBuilder[0]=nftItem->name;
    msgBuilder[1]=" auction";
    msgBuilder[2]=" end. ";
    msgBuilder[3]="It was";
    msgBuilder[4]=" sold!";
    concat(msgBuilder, 5, send_message.message, 4);
    Send_Message();

    //subtract adicional gas needed to end an auction
    deductedAmount = nftItem->highestBid - ENDAUCTION_FEE;
    // send signa to previous owner
    value=(n100-CREATOR_FEE)*deductedAmount/n100;
    Set_B1(nftItem->owner);
    Send_To_Address_In_B(value);
    //save creator balance
    creator_balance += deductedAmount - value;
    //process ownership change
    nftItem->owner = nftItem->highestBidSender;
    nftItem->status = HOLD;
    nftItem->auctionEnd=0;
    nftItem->highestBid=0;
    nftItem->highestBidSender=0;
    lifetimeStats.auctions++;
    //inform new owner
    send_message.recipient=nftItem->owner;
    msgBuilder[3]="It is ";
    msgBuilder[4]="yours!";
    concat(msgBuilder, 5, send_message.message, 4);
    Send_Message();    
}

//Checks if there is a running auction and set nextAuction accordingly
void checkAuction(void) {

    long pcolEnd;

    nextAuction=0;
    for (i=0; i<collection_length; i++) {
        pcol=&collection[i];
        pcolEnd=pcol->auctionEnd;
        if (pcol->status == AUCTION && pcolEnd != 0) {
            if (pcolEnd <= currBlock) {
                endAuction(pcol);
            } else {
                if (nextAuction == 0 || pcolEnd < nextAuction ) {
                    nextAuction = pcolEnd;
                }
            }
        }
    }
}

void processTX(void) {
    
    long parsedMsg[3], priceNQT;
    struct NFT *nftSelected;

    processTxStartBalance = Get_Current_Balance();
    
    if (currentTX.message[0] == 0) {
        send_message.message[0]="No messa";
        send_message.message[1]="ge? See ";
        send_message.message[2]=helpSite0;
        send_message.message[3]=helpSite1;
        Send_Message_ReturnSIG();
        return;
    }

    lifetimeStats.messagesProcessed++;

    split(" ", currentTX.message, 4, parsedMsg, 3);

    //loop thru item if matching nft for parsedMsg[1]
    for (i=0; i < collection_length ;i++) {
        nftSelected=&collection[i];
        if (nftSelected->name == parsedMsg[1]) {
            break;
        }
    }

    if (i == collection_length) {
        // No NFT item found on parsedMsg[1].
        if (currentTX.sender == CREATOR) {
            //creator sent a message to set website
            //no return sigma (can be used to add gas to contract)
            helpSite0= parsedMsg[0];
            helpSite1= parsedMsg[1];
            return;
        }
        //jump to parser error

    } else {//item found, parse actions
        if ( parsedMsg[0] == BUY ) {
            if (nftSelected->status != SELL) {
                send_message.message[]="Item not on sale.";
                Send_Message_ReturnSIG();
                return;
            }
            priceNQT = nftSelected->price * ONE_SIGMA;
            if (priceNQT > currentTX.amount) {
                send_message.message[]="Price is bigger than your offer.";
                Send_Message_ReturnSIG();
                return;
            }
            //inform current owner and send balance
            send_message.recipient=nftSelected->owner;
            msgBuilder[0]="Item ";
            msgBuilder[1]=nftSelected->name;
            msgBuilder[2]=" has be";
            msgBuilder[3]="en sold.";
            concat(msgBuilder, 4, send_message.message, 4);
            Send_Message();
            Set_B1(send_message.recipient);
            Send_To_Address_In_B((n100-CREATOR_FEE)*priceNQT/n100);
            //reserve creator balance
            creator_balance += CREATOR_FEE*priceNQT/n100;
            //process ownership change
            nftSelected->owner = currentTX.sender;
            nftSelected->price = priceNQT*n110/n100/ONE_SIGMA;
            lifetimeStats.sales++;
            //inform new owner
            send_message.recipient=currentTX.sender;
            //msgBuilder[0]="Item ";
            //msgBuilder[1]=nftSelected->name;
            msgBuilder[2]=" is ";
            msgBuilder[3]="yours!";
            concat(msgBuilder, 4, send_message.message, 4);
            Send_Message();
            // if new owner paid in excess, return the amount.
            if (currentTX.amount > priceNQT) {
                Set_B1(currentTX.sender);
                Send_To_Address_In_B(currentTX.amount - priceNQT);
            }
            return;

        } else if ( parsedMsg[0] == STATUS ) {
            if (nftSelected->status == AUCTION) {
                msgBuilder[0]="NextBID ";
                msgBuilder[1]=itoa(nftSelected->price);
                if (nftSelected->auctionEnd == 0) {
                    concat(msgBuilder, 2, send_message.message, 4);
                } else {
                    msgBuilder[2]=" EndsIn ";
                    msgBuilder[3]=itoa(nftSelected->auctionEnd - currBlock - 1);
                    msgBuilder[4]=" blocks.";
                    concat(msgBuilder, 5, send_message.message, 4);
                }
                Send_Message_ReturnSIG();
            }  else if ( nftSelected->status == SELL ) {
                msgBuilder[0]=nftSelected->name;
                msgBuilder[1]=" on sale";
                msgBuilder[2]=": ";
                msgBuilder[3]=itoa(nftSelected->price);
                msgBuilder[4]=" SIG.";
                concat(msgBuilder, 5, send_message.message, 4);
                Send_Message_ReturnSIG();
            } else { //status == HOLD
                send_message.message[]="Owner holding this item.";
                Send_Message_ReturnSIG();
            }

            return;

        } else if ( parsedMsg[0] == BID ) {
            if (nftSelected->status != AUCTION) {
                msgBuilder[0]=nftSelected->name;
                msgBuilder[1]=" not on ";
                msgBuilder[2]="auction.";
                concat(msgBuilder, 3, send_message.message, 4);
                Send_Message_ReturnSIG();
                return;
            }
            priceNQT = nftSelected->price * ONE_SIGMA;
            if (priceNQT > currentTX.amount) {
                send_message.message[]="Price is bigger than your offer.";
                Send_Message_ReturnSIG();
                return;
            }
            //Error handling done, accept bid
            
            if ( nftSelected->highestBidSender != 0) {
                //there i an anterior bid, send message
                send_message.recipient=nftSelected->highestBidSender;
                msgBuilder[0]="Item ";
                msgBuilder[1]=nftSelected->name;
                msgBuilder[2]=" got an";
                msgBuilder[3]=" higher";
                msgBuilder[4]=" bid.";
                concat(msgBuilder, 5, send_message.message, 4);
                Send_Message();
                // and reimburse
                Set_B1(nftSelected->highestBidSender);
                Send_To_Address_In_B(nftSelected->highestBid);
            } else {
                // inform owner item got first bid
                send_message.recipient=nftSelected->owner;
                msgBuilder[0]=nftSelected->name;
                msgBuilder[1]=" auction";
                msgBuilder[2]=" got 1st";
                msgBuilder[3]=" bid!";
                concat(msgBuilder, 4, send_message.message, 4);
                Send_Message();
            }
            //process auction start
            nftSelected->highestBid=currentTX.amount;
            nftSelected->price=currentTX.amount*n110/n100/ONE_SIGMA;
            nftSelected->auctionEnd=AUCTIODURATION + (currentTX.timestamp >> n32);
            nftSelected->highestBidSender=currentTX.sender;
            lifetimeStats.bids++;
            //triggers checkAuction() next block to refresh nextAuction;
            nextAuction=currBlock; 
            //Inform sender
            send_message.recipient=currentTX.sender;
            send_message.message[]="Your bid was accepted!";
            Send_Message();
            return;

        } else if (parsedMsg[0] == HOLD || parsedMsg[0] == SELL || parsedMsg[0] == AUCTION ) {

            //from now on, sender must be NFT owner!
            if (currentTX.sender != nftSelected->owner) {
                send_message.message[]="You are not owner of item.";
                Send_Message_ReturnSIG();
                return;
            }
            //Avoid locking or selling an item on auction
            if (nftSelected->status==AUCTION && nftSelected->highestBidSender!=0) {
                send_message.message[]="Running auction. No changes.";
                Send_Message_ReturnSIG();
                return;
            }

            if ( parsedMsg[0] == HOLD ) {
                //process status change
                nftSelected->status=HOLD;
                //inform sender
                msgBuilder[0]=nftSelected->name;
                msgBuilder[1]=" was ";
                msgBuilder[2]="locked!";
                concat(msgBuilder, 3, send_message.message, 4);
                Send_Message_ReturnSIG();
                return;

            } else if ( parsedMsg[0] == SELL ) {
                priceNQT = atoi(parsedMsg[2]);//this price is not NQT
                if (priceNQT != 0) {
                    //execute transaction
                    nftSelected->price=priceNQT;
                    nftSelected->status=SELL;
                    //inform sender
                    msgBuilder[0]=nftSelected->name;
                    msgBuilder[1]=" price";
                    msgBuilder[2]=" is ";
                    msgBuilder[3]=itoa(nftSelected->price);
                    msgBuilder[4]=" SIG.";
                    concat(msgBuilder, 5, send_message.message, 4);
                    Send_Message_ReturnSIG();
                    return;
                }

            } else if ( parsedMsg[0] == AUCTION ) {
                priceNQT = atoi(parsedMsg[2]);//this price is not NQT
                if (priceNQT != 0) {
                    //Error handling done, set auction
                    nftSelected->price=priceNQT;
                    nftSelected->status=AUCTION;
                    nftSelected->auctionEnd=0;
                    nftSelected->highestBid=0;
                    nftSelected->highestBidSender=0;
                    send_message.message[]="Item is on auction!";
                    Send_Message_ReturnSIG();
                    return;
                }
            }
        }
    }

    send_message.message[0]="Parser e";
    send_message.message[1]="rr. See ";
    send_message.message[2]=helpSite0;
    send_message.message[3]=helpSite1;
    Send_Message_ReturnSIG();
}

//Last operation:
//Burn balance to keep gas balance stable at GAS_TARGET
//  110 loops burn max 1.3 sigma.
void burnOut() {

    long bidValues;
    long smoke=0;

    for (i=0, bidValues=0; i<collection_length; i++) {
        bidValues+=collection[i].highestBid;
    }

    do {
        smoke++;
    } while(Get_Current_Balance()-bidValues-creator_balance > GAS_TARGET
            && smoke < n110);

    lifetimeStats.smoke+=smoke;
}

// Sends a message to tx.sender and return amount sent plus unburned gas
void Send_Message_ReturnSIG() {
    long RemainingGas;
    Set_B1(currentTX.sender);
    Set_A1_A2(send_message.message[0], send_message.message[1]);
    Set_A3_A4(send_message.message[2], send_message.message[3]);
    Send_A_To_Address_In_B();
    RemainingGas = MAX_GAS_REFUND - (processTxStartBalance - Get_Current_Balance());
    // return unspent gas to sender if processTX need low gas.
    if ( RemainingGas < MAX_GAS_REFUND && RemainingGas > 0) {
        Send_To_Address_In_B(currentTX.amount + RemainingGas );
        lifetimeStats.gasRefund+=RemainingGas;
    } else {
        Send_To_Address_In_B(currentTX.amount);
    }
}



/* **************   Library functions    **************************** */

struct SENDMESSAGE {
   long recipient;
   long message[4];
} send_message;
void Send_Message() {
    Set_B1(send_message.recipient);
    Set_A1_A2(send_message.message[0], send_message.message[1]);
    Set_A3_A4(send_message.message[2], send_message.message[3]);
    Send_A_To_Address_In_B();
}

// String concatenation function in C
// Expects:
// 'source' is an array with content
// 'source_length' is size of source (in longs) or the numbers of longs to be processed
// 'ret' is return buffer array.
// 'ret_length' is the size of ret (in longs) to avoid buffer overflow.
// Function returns the number of bytes processed. A number equal ret_length*8
// can denote that buffer was too short for the content in 'source'.
long concat(long * source, long source_length, long * ret, long ret_length)
{
    long i_param, act_arg, chr, i_ret, i_buffer, i_act_arg;

    //clear destination buffer
    for (i_buffer=0; i_buffer< ret_length; i_buffer++) {
        ret[i_buffer]=0;
    }

    i_ret    =0; //var to cycle bytes for each return buffer (from 0 to 8 )
    i_buffer =0; //var to cycle for each buffer available (from 0 to ret_length)
    i_param  =0; //var to cycle for each source items provided (from 0 to source_length)
    i_act_arg=0; //var to cycle bytes in actual source(long) beeing processed (0 to 8)

    while (i_param < source_length) { //loop thru source_length
        act_arg = source[i_param]; // access source 
        chr = act_arg & n0xFF; //this always first char, no need to shift

        while (chr != 0) { //loop bytes in va_arg beeing processed (act_arg)
            //debug line
            //printf(" %s : %ld %ld\n",(char*) &chr, i_param, i_ret);
            ret[i_buffer] += chr << n8*i_ret;
            i_act_arg++;
            i_ret++;

            if (i_ret==n8) { // ret[i_buffer] is full, go to next ret value
                i_buffer++;
                i_ret=0;
                if (i_buffer == ret_length) { // End of destination buffer, go to end
                    goto all_loops_end; //Ugly but handyfull!
                }
            }
            if (i_act_arg==n8) { //end of actual va_arg, go to next va_arg
                break; //break second while loop
            } else {  // prepare char for next merge
                chr = act_arg & ( n0xFF << (n8 * i_act_arg) );
                chr >>= n8 * i_act_arg;
            }
        }
    i_param++;
    i_act_arg=0;
    }

    all_loops_end:

    return i_ret + n8 * i_buffer;
}

// Split string function in C
// Expects:
//  'separator' to be used (only LSB will be used).
//  'source' is the array with text to be splitted.
//  'source_length' is the size of source (or the numbers of longs that
//     will be processed
//  'ret' is return buffer array.
//  'ret_length' is the size of return buffer, to avoid buffer overflow
//  Returns: number of fields filled
//  The function will keep adding chars until fill return buffer. If a
//    string is bigger than 8 chars, only 8 last chars will be returned
//    at that field.
long split(long separator, long * source, long source_length, long * ret, long ret_length)
{
    long field, i_act_arg, i_ret, i_param, act_arg, chr ;

    //clear destination buffer
    for (i_ret=0; i_ret < ret_length; i_ret++) {
        ret[i_ret]=0;
    }

    i_act_arg=0; //cycle bytes in actual string beeing processed(param buffer) (0 to 8)
    i_param =0;  //current element in param buffer (0 to 4)
    field=0;     //current element in return buffer (ret)(0 to 10 in this example)
    i_ret=0;     //var to cycle bytes for each return buffer (from 0 to 8 )

    while (i_param < source_length) {
        act_arg = source[i_param];
        chr = act_arg & n0xFF;
        while (chr != 0) { 
            //debug line
            //printf(" %s : %ld %ld\n",(char*) &chr, i_param, i_ret);
            if (chr == separator){
                field++;
                i_ret=0;
            } else {
                if (i_ret==n8) { // ret[i_ret] is full, shift and continue
                    ret[field] >>= n8;
                    i_ret--;
                }
                ret[field] += chr << n8*i_ret;
                i_ret++;
            }
            i_act_arg++;
            if (field == ret_length) { // End of destination buffer, go to end
                return ++field;
            }
            if (i_act_arg==n8) { //end of actual va_arg, go to next va_arg
                break; //break second while loop
            } else {  // prepare char for next merge
                chr = act_arg & (n0xFF << (n8 * i_act_arg));
                chr >>= n8 * i_act_arg;
            }
        }
        i_param++;
        i_act_arg=0;
    }

    return ++field;
}

// Iterative function to implement atoi() function in C
// Expects a long containing a string. If any byte is not a char numeric
// representation, then stop and return. Only positive numbers, decimal, 
// and integers are converted. Returns zero if no number was processed.
long atoi(long val)
{
    long ret = 0, chr;
    do {
        chr = (0xff & val) - '0';
        if (chr < 0 || chr >= n10)
            break;
        ret *= n10;
        ret += chr;
        val >>= n8;
    } while (1);
    return ret;
}

// Iterative function to implement itoa() function in C
// Expects a long. If number is negative or bigger than MAX_STRING
// (it will not fit in a long), returns long meaning "#error".
long itoa(long val)
{
    long ret;
    if (val >= 0 && val <= 99999999) {
        if (val == 0) {
            return '0';
        }
        ret = 0;
        do {
            if (val == 0) {
                return ret;
            }
            ret <<= n8;
            ret += '0' + val % n10;
            val /= n10;
        } while (1);
    }
    return "#error";
}
```
