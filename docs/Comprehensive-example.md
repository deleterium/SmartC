[Back](./)

```c
/* ****************************************************************** *
 * Program: calculator.c
 * Author: Rui Deleterium
 *
 * This contract is online at S-6CPX-Y8EH-6G3E-FW3R3
 *
 * Contract expects a message with 3 arguments: Number Operator Number.
 * Arguments must have only one space between them.
 * Numbers >= 0, base 10 and < 100.000.000
 * Operator can be: + - * /
 * If no message is given, contract thanks the donation.
 * If message was not undestood, contract sends an explanation
 * If message was undestood, contract sends a message with operation
 *    and the result MOD 100.000.000
 * ****************************************************************** */
#pragma version 0.3

#program name Calculator
#program description Do operations as requested by message.
#program activationAmount 10000000

#include APIFunctions

#pragma maxAuxVars 3

long ONE_SIGNUM = 1_0000_0000;
long n8 = 8, n10 = 10, n255 = 0xff;

void process_TX(void) {

    long values[3], beauty_msg[7], result;

    if (currentTX.message[0] == 0) { //no message
        send_message.recipient = currentTX.sender;
        beauty_msg[0]="Thanks ";
        beauty_msg[1]="for ";
        beauty_msg[2]=ltoa(currentTX.amount / ONE_SIGNUM );
        beauty_msg[3]=" signum ";
        beauty_msg[4]="donation";
        beauty_msg[5]="!";
        concat(beauty_msg, 6, send_message.message, 4);
        Send_Message();
        return;
    }

    if (split(" ", currentTX.message, 4, values, 3) != 3) {
        send_message.recipient = currentTX.sender;
        send_message.message[]="Send: number [+-*/] number.";
        Send_Message();
        return;
    }

    if (values[1] == "+") {
        result = ltoa(atol(values[0]) + atol(values[2]));

    } else if (values[1] == "*") {
        result = ltoa(atol(values[0]) * atol(values[2]));

    } else if (values[1] == "-") {
        result = atol(values[0]) - atol(values[2]);
        if (result < 0){
            beauty_msg[0] = '-';
            beauty_msg[1] = ltoa(-result);
            concat(beauty_msg, 2, &result, 1);
        } else {
            result = ltoa(result);
        }

    } else if (values[1] == "/") {
        result = atol(values[2]);
        if (result == 0) {
            result = "div/0";
        } else {
            result = ltoa(atol(values[0]) / result);
        }

    } else {
        send_message.recipient = currentTX.sender;
        send_message.message[] = "Unknow operator. Use +-*/";
        Send_Message();
        return;
    }

    beauty_msg[0] = values[0];
    beauty_msg[1] = " ";
    beauty_msg[2] = values[1];
    beauty_msg[3] = " ";
    beauty_msg[4] = values[2];
    beauty_msg[5] = " = ";
    beauty_msg[6] = result;

    send_message.recipient = currentTX.sender;
    concat(beauty_msg, 7, send_message.message, 4);
    Send_Message();
}

struct TXINFO {
   long timestamp;
   long sender;
   long amount;
   long message[4];
} currentTX;

// A must have a TX_Timestamp!
void getTxDetails(void) {
    currentTX.amount  = Get_Amount_For_Tx_In_A();
    currentTX.timestamp = Get_Timestamp_For_Tx_In_A();
    Message_From_Tx_In_A_To_B();
    currentTX.message[0]=Get_B1();
    currentTX.message[1]=Get_B2();
    currentTX.message[2]=Get_B3();
    currentTX.message[3]=Get_B4();
    B_To_Address_Of_Tx_In_A();
    currentTX.sender = Get_B1();
}

struct SENDMESSAGE {
   long recipient;
   long message[4];
} send_message;
void Send_Message(void) {
    Set_B1(send_message.recipient);
    Set_A1_A2(send_message.message[0], send_message.message[1]);
    Set_A3_A4(send_message.message[2], send_message.message[3]);
    Send_A_To_Address_In_B();
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
    for (i_ret = 0; i_ret < ret_length; i_ret++) {
        ret[i_ret] = 0;
    }

    i_act_arg = 0; //cycle bytes in actual string beeing processed(param buffer) (0 to 8)
    i_param = 0;   //current element in param buffer (0 to 4)
    field = 0;     //current element in return buffer (ret)(0 to 10 in this example)
    i_ret = 0;     //var to cycle bytes for each return buffer (from 0 to 8 )

    while (i_param < source_length) {
        act_arg = source[i_param];
        chr = act_arg & 0xff;
        while (chr != 0) { 
            if (chr == separator){
                field++;
                i_ret = 0;
            } else {
                if (i_ret == 8) { // ret[i_ret] is full, shift and continue
                    ret[field] >>= 8;
                    i_ret--;
                }
                ret[field] += chr << (8 * i_ret);
                i_ret++;
            }
            i_act_arg++;
            if (field == ret_length) { // End of destination buffer, go to end
                return ++field;
            }
            if (i_act_arg == 8) { //end of actual va_arg, go to next va_arg
                break; //break second while loop
            } else {  // prepare char for next merge
                chr = act_arg & (0xff << (8 * i_act_arg));
                chr >>= 8 * i_act_arg;
            }
        }
        i_param++;
        i_act_arg = 0;
    }

    return ++field;
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
    for (i_buffer = 0; i_buffer < ret_length; i_buffer++) {
        ret[i_buffer] = 0;
    }

    i_ret    = 0; //var to cycle bytes for each return buffer (from 0 to 8 )
    i_buffer = 0; //var to cycle for each buffer available (from 0 to ret_length)
    i_param  = 0; //var to cycle for each source items provided (from 0 to source_length)
    i_act_arg= 0; //var to cycle bytes in actual source(long) beeing processed (0 to 8)

    while (i_param < source_length) { //loop thru source_length
        act_arg = source[i_param]; // access source 
        chr = act_arg & 0xff; //this always first char, no need to shift

        while (chr != 0) { //loop bytes in va_arg beeing processed (act_arg)
            ret[i_buffer] += chr << (8 * i_ret);
            i_act_arg++;
            i_ret++;

            if (i_ret == 8) { // ret[i_buffer] is full, go to next ret value
                i_buffer++;
                i_ret = 0;
                if (i_buffer == ret_length) { // End of destination buffer, go to end
                    goto all_loops_end; //break 2 loops
                }
            }
            if (i_act_arg == 8) { //end of actual va_arg, go to next va_arg
                break; //break second while loop
            } else {  // prepare char for next merge
                chr = act_arg & ( 0xff << (8 * i_act_arg) );
                chr >>= 8 * i_act_arg;
            }
        }
    i_param++;
    i_act_arg = 0;
    }

    all_loops_end:
    return i_ret + (8 * i_buffer);
}

// ASCII to Long (base10 positive and less than 100.000.000)
// Iterative function to implement atoi() clone function in C
// Expects a long containing a string. If any byte is not a char numeric
// representation, then stop and return. Only positive numbers, base10, 
// and integers are converted. Returns zero if no number was processed.
long atol(long val)
{
    long ret = 0, chr;
    do {
        chr = (0xff & val) - '0';
        if (chr < 0 || chr >= 10)
            break;
        ret *= 10;
        ret += chr;
        val >>= 8;
    } while (true);
    return ret;
}
// Integer to ASCII (base10 positive and less than 100.000.000)
// Iterative function to implement itoa() clone function in C
// Expects a long. If number is negative or bigger than MAX_LTOA
// (it will not fit in a long), returns long meaning "#error".
#define MAX_LTOA 99999999
long ltoa(long val)
{
    long ret;
    if (val < 0 || val > MAX_LTOA)
        return "#error";
    ret = 0;
    do {
        ret <<= 8;
        ret += '0' + val % 10;
        val /= 10;
    } while (val != 0);
    return ret;
}

void main(void) {
    for (A_To_Tx_After_Timestamp(currentTX.timestamp); Get_A1() != 0; A_To_Tx_After_Timestamp(currentTX.timestamp)) {
        // Update transaction variables
        getTxDetails();
        process_TX();
    }
    //clean_up();
}
```

[Back](./)
