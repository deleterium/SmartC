#program name Dropper
#program description Sends a fixed amount of signa to a defined account every N blocks. 
#program activationAmount 0.2

// Configure how many blocks to sleep until next send. 
#define SLP_BLOCKS 2
// Configure balance to stay on contract
#define CONTRACT_MIN_BALANCE 1.0
// Configure the amount to send every time
#define EACH_BLOCK .2
// Set the desired account
#define RECIPIENT "S-3A2N-ZD7P-KZKU-FPWKQ"

// Endless loop
while (true) {
   if (getCurrentBalanceFx() < CONTRACT_MIN_BALANCE) {
       // Stops contracts before it hits end of balance
       halt;
   } else {
       sendAmountFx(EACH_BLOCK, RECIPIENT);
       sleep SLP_BLOCKS;
   }
}
