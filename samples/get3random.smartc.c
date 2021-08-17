#program name Get3Random
#program description When a message arrives, the program tries to parse a number\
 from message. Number must be bigger or equal 5 and lower or equal 9999999. If\
 found, then program mixes random hash for 3 blocks and send back a message\
 to the sender with the random numbers without repetition. When there is no  more\
 pending messages, all balance remaining is sent to program creator.
#program activationAmount 1_0000_0000

#pragma version 0.2
#pragma maxAuxVars 2
#pragma maxConstVars 2
#pragma globalOptimization

#include APIFunctions

struct TXINFO
{
   long timestamp;
   long sender;
   long amount;
} currentTX;

long i, userNumber, result_1, result_2, result_3, result_4;
const long n8=8, n10=10, n0xff=0xff;

B_To_Address_Of_Creator();
long CREATOR = Get_B1();

while (true) {

    // Loop all incoming TX
    for (A_To_Tx_After_Timestamp(currentTX.timestamp); Get_A1() != 0; A_To_Tx_After_Timestamp(currentTX.timestamp) ) {

        // Get TX details
        currentTX.amount = Get_Amount_For_Tx_In_A();
        currentTX.timestamp = Get_Timestamp_For_Tx_In_A();
        Message_From_Tx_In_A_To_B();
        userNumber = atoi(Get_B1());
        B_To_Address_Of_Tx_In_A();
        currentTX.sender = Get_B1();

        if (userNumber < 5) {
            // Send an error message
            Set_A1_A2("Please s","end a va");
            Set_A3_A4("lue >= 5", 0);
            Send_A_To_Address_In_B();
            // Return any excess balance given
            if (currentTX.amount > 0)
                Send_To_Address_In_B(currentTX.amount);
            // Proceed to next message.
            continue;
        }

        // Draw mixing randomness of 3 blocks
        Clear_A_And_B();
        i = 0;
        do {
            do {
                if (i != 0)
                    sleep 1;
                Put_Last_Block_Hash_In_A();
                XOR_B_with_A();
                i++;
            } while (i <= 2);

            // Get 4 random numbers between 1 and userNumber
            result_1 = ((Get_B1() >> 2 ) % userNumber) + 1;
            result_2 = ((Get_B2() >> 2 ) % userNumber) + 1;
            result_3 = ((Get_B3() >> 2 ) % userNumber) + 1;
            result_4 = ((Get_B4() >> 2 ) % userNumber) + 1;
            // Try to avoid a new round using 4th number
            if (result_1 == result_2)
                result_1 = result_4;
            else if (result_1 ==  result_3)
                result_1 = result_4;
            else if (result_2 ==  result_3)
                result_2 =  result_4;
        // Repeat process next block if still there are repeated numbers.
        } while (result_1 == result_2 || result_1 == result_3 || result_2 == result_3);

        // Send message with draw numbers
        Set_B1(currentTX.sender);
        Set_A1_A2("Draw:   ", itoa_plus(result_1));
        Set_A3_A4(itoa_plus(result_2), itoa_plus(result_3));
        Send_A_To_Address_In_B();
        Send_To_Address_In_B(currentTX.amount);

    }

    // Send all remaining balance to creator and freeze contract until next message
    Set_B1(CREATOR);
    Send_All_To_Address_In_B();
}


/* **************   Library functions    **************************** */

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
// Pad beginning with spaces to allow easy concatenation
long itoa_plus(long val)
{
    long ret = "        ";
    if (val == 0) {
        return (ret << n8) + '0';
    }

    if (val > 0 && val <= 9999999) {
        do {
            if (val == 0) {
                return ret;
            }
            ret <<= n8;
            ret += '0' + val % n10;
            val /= n10;
        } while (1);
    }
    return "  #error";
}
