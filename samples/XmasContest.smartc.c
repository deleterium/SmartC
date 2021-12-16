#program name XmasContest
#program description Creator adds up balance to the contest, by sending transactions\
 without message. Participants send theirs messages, suposed to be right answer.\
 Creator sends a transaction with a message, that is the right answer. The contract\
 loops thru all messages again comparing the participants messages with the right\
 answer. 10 different participants with the right aswer will receive a prize: 1st\
 40%, 2nd 25%, 3rd 14%, 4th to 10th 3%. The remaing balance will be donated to SNA,\
 and the contract will finish by sending any upcoming balance to SNA.
#program activationAmount 5_0000_0000
 
#pragma globalOptimization
#pragma version 0.3
 
#include APIFunctions
 
#define FIRST_PRIZE_PC 40
#define SECOND_PRIZE_PC 25
#define THIRD_PRIZE_PC 14
#define FOURTH_TO_TENTH_PRIZE_PC 3
#define SNA_ADDRESS "S-5MS6-5FBY-74H4-9N4HS"

// Deployed first time with address: S-T7HA-5E8C-PFYL-9E4UE
 
struct TXINFO
{
   long timestamp;
   long sender;
   long amount;
   long message[4];
} currentTX;
 
struct CHALLENGE {
   long rightAnswer[4],
        endTimestamp,
        winners[10],
        prize;
} challenge;
 
long winnerCount;
long currentWinnerPrize;
long creator;
 
B_To_Address_Of_Creator();
creator = Get_B1();
 
// Phase 1
// Wait to know challenge aswer. Collect transactions from participants.
do
{
    A_To_Tx_After_Timestamp(currentTX.timestamp);
    if (Get_A1() == 0)
    {
        halt;
        continue;
    }
    currentTX.timestamp = Get_Timestamp_For_Tx_In_A();
    B_To_Address_Of_Tx_In_A();
    currentTX.sender = Get_B1();
    if (currentTX.sender == creator)
    {
        challenge.prize += Get_Amount_For_Tx_In_A();
        Message_From_Tx_In_A_To_B();
        challenge.rightAnswer[0] = Get_B1();
        challenge.rightAnswer[1] = Get_B2();
        challenge.rightAnswer[2] = Get_B3();
        challenge.rightAnswer[3] = Get_B4();
        if (challenge.rightAnswer[0] != 0)
        {
            // This is not empty message. Consider end of contest!
            challenge.endTimestamp = currentTX.timestamp;
        }
 
    }
} while (challenge.endTimestamp == 0);
 
// Phase 2
// Cycle thru all messages again
currentTX.timestamp = 0;
while (currentTX.timestamp != challenge.endTimestamp)
{
    A_To_Tx_After_Timestamp(currentTX.timestamp);
    getTxDetails();
    if (currentTX.sender == creator || isWinner(currentTX.sender) )
    {
        continue;
    }
    if (currentTX.message[0] == challenge.rightAnswer[0] &&
        currentTX.message[1] == challenge.rightAnswer[1] &&
        currentTX.message[2] == challenge.rightAnswer[2] &&
        currentTX.message[3] == challenge.rightAnswer[3] &&
        winnerCount < 10)
    {
        // We have a winner!
        if (winnerCount == 0) {
            currentWinnerPrize = challenge.prize * FIRST_PRIZE_PC / 100;
        } else if (winnerCount == 1) {
            currentWinnerPrize = challenge.prize * SECOND_PRIZE_PC / 100;
        } else if (winnerCount == 2) {
            currentWinnerPrize = challenge.prize * THIRD_PRIZE_PC / 100;
        } else {
            currentWinnerPrize = challenge.prize * FOURTH_TO_TENTH_PRIZE_PC / 100;
        }
        Set_B1(currentTX.sender);
        Send_To_Address_In_B(currentWinnerPrize);
        challenge.winners[winnerCount] = currentTX.sender;
        winnerCount++;
    }
}
 
// Phase 3
// Contest end. Any remaining/incoming value to SNA
Clear_B();
Set_B1(SNA_ADDRESS);
while (true)
{
    Send_All_To_Address_In_B();
}
 
long isWinner(long address)
{
    long i;
    for (i = 0; i < winnerCount; i++) {
        if (challenge.winners[i] == address)
        {
            return true;
        }
    }
    return false;
}
 
void getTxDetails(void)
{
    currentTX.amount = Get_Amount_For_Tx_In_A();
    currentTX.timestamp = Get_Timestamp_For_Tx_In_A();
    Message_From_Tx_In_A_To_B();
    currentTX.message[0] = Get_B1();
    currentTX.message[1] = Get_B2();
    currentTX.message[2] = Get_B3();
    currentTX.message[3] = Get_B4();
    B_To_Address_Of_Tx_In_A();
    currentTX.sender = Get_B1();
} 
