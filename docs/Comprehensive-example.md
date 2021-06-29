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
#program name Calculator
#program description Do operations as requested by message.
#program activationAmount 10000000
#include APIFunctions
#pragma maxAuxVars 3

long ONE_BURST=100000000;
long n8=8, n10=10;
long n0xff=0xff;

void process_TX() {

    long values[3], beauty_msg[7], result;

    if (tx_details.message[0] == 0) { //no message
        send_message.recipient = tx_details.sender;
        beauty_msg[0]="Thanks ";
        beauty_msg[1]="for ";
        beauty_msg[2]=itoa(tx_details.amount / ONE_BURST );
        beauty_msg[3]=" burst ";
        beauty_msg[4]="donation";
        beauty_msg[5]="!";
        concat(beauty_msg, 6, send_message.message, 4);
        Send_Message();
        return;
    }

    if (split(" ", tx_details.message, 4, values, 3) != 3) {
        send_message.recipient = tx_details.sender;
        send_message.message[]="Send: number [+-*/] number.";
        Send_Message();
        return;
    }

    if (values[1] == "+") {
        result = itoa(atoi(values[0]) + atoi(values[2]));

    } else if (values[1] == "*") {
        result = itoa(atoi(values[0]) * atoi(values[2]));

    } else if (values[1] == "-") {
        result = atoi(values[0]) - atoi(values[2]);
        if (result < 0){
            beauty_msg[0] = '-';
            beauty_msg[1] = itoa(-result);
            concat(beauty_msg, 2, &result, 1);
        } else {
            result = itoa(result);
        }

    } else if (values[1] == "/") {
        result = atoi(values[2]);
        if (result == 0) {
            result = "div/0";
        } else {
            result = itoa(atoi(values[0]) / result);
        }

    } else {
        send_message.recipient = tx_details.sender;
        send_message.message[]="Unknow operator. Use +-*/";
        Send_Message();
        return;
    }

    beauty_msg[0]=values[0];
    beauty_msg[1]=" ";
    beauty_msg[2]=values[1];
    beauty_msg[3]=" ";
    beauty_msg[4]=values[2];
    beauty_msg[5]=" = ";
    beauty_msg[6]=result;

    send_message.recipient = tx_details.sender;
    concat(beauty_msg, 7, send_message.message, 4);
    Send_Message();
}


struct TXINFO {
   long timestamp;
   long sender;
   long amount;
   long message[4];
} tx_details;
void get_next_tx_details(long last_timestamp) {
   
    A_To_Tx_After_Timestamp(last_timestamp);

    if (Get_A1() == 0) { //no more transactions
        tx_details.timestamp=0;
        return;
    }
    tx_details.amount  = Get_Amount_For_Tx_In_A();
    tx_details.timestamp = Get_Timestamp_For_Tx_In_A();
    B_To_Address_Of_Tx_In_A();
    tx_details.sender = Get_B1();
    Message_From_Tx_In_A_To_B();
    tx_details.message[0]=Get_B1();
    tx_details.message[1]=Get_B2();
    tx_details.message[2]=Get_B3();
    tx_details.message[3]=Get_B4();
    return;
}


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
        chr = act_arg & n0xff; //this always first char, no need to shift

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
                chr = act_arg & ( n0xff << (n8 * i_act_arg) );
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
        chr = act_arg & n0xff;
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
                chr = act_arg & (n0xff << (n8 * i_act_arg));
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
        chr = (n0xff & val) - '0';
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

void main(void) {
    long lastTX;

    do {
        get_next_tx_details(lastTX);
        if (tx_details.timestamp == 0) //no more transactions
            break;
        lastTX = tx_details.timestamp;
        process_TX(); //
    } while (1);

    //clean_up();
}
```

[Back](./)
