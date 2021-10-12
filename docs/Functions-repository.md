[Back](./)

# Functions repository
These functions can be added to projects and speed up development time!

## Text to number: atol()

```c
// ASCII to Long (base10 positive and less than 100.000.000)
// Iterative function to implement atoi() clone function in C
// Expects a long containing a string. If any byte is not a char numeric
// representation, then stop and return. Only positive numbers, base10, 
// and integers are converted. Returns zero if no number was processed.
const long n8 = 8, n10 = 10, n255 = 0xff;
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
```
## Number to text: ltoa()
```c
// Integer to ASCII (base10 positive and less than 100.000.000)
// Iterative function to implement itoa() clone function in C
// Expects a long. If number is negative or bigger than MAX_LTOA
// (it will not fit in a long), returns long meaning "#error".
const long n8 = 8, n10 = 10;
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
```

## Splitting a text array into fields: split()
```c
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
const long n8 = 8, n255 = 0xff;
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
```

## Concatenate text into a text array: concat()
```c
// String concatenation function in C
// Expects:
// 'source' is an array with content
// 'source_length' is size of source (in longs) or the numbers of longs to be processed
// 'ret' is return buffer array.
// 'ret_length' is the size of ret (in longs) to avoid buffer overflow.
// Function returns the number of bytes processed. A number equal ret_length*8
// can denote that buffer was too short for the content in 'source'.
const long n8 = 8, n255 = 0xff;
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
```

[Back](./)
