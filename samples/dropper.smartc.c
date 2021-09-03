#program name Dropper
#program description Sends a fixed amount of signa to a defined account every N blocks. 
#program activationAmount 0_2000_0000

#pragma maxAuxVars 1
#pragma globalOptimization

#include APIFunctions

// Configure how many blocks to sleep until next send. 
const long SLP_BLOCKS = 2;
// Configure balance to stay on contract
const long CONTRACT_MIN_BALANCE = 1_0000_0000;
// Configure the amount to send every time
const long sendEachBlockNQT = 2000_0000;
// Set the desired account
Set_B1 ("S-3A2N-ZD7P-KZKU-FPWKQ");

// Endless loop
while (true) {
   if (Get_Current_Balance() < CONTRACT_MIN_BALANCE) {
       // Stops contracts before it hits end of balance
       halt;
   } else {
       Send_To_Address_In_B(sendEachBlockNQT);
       sleep SLP_BLOCKS;
   }
}
