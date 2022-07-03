[Back](./README.md)

# Functions repository
These functions and macros can be added to projects and speed up development time!
<details>
<summary>

## Macros
</summary>

Macro functions are elaborated substitutions done during compilation. Use for very simple functions:

```c

#define add2(val) (val + 2)

#define sendSigna(recipient, amount) (\
    Set_B1_B2(recipient, 0), \
    F_Send_To_Address_In_B(amount))

#define sendMessage1(recipient, m1) (\
    Clear_A_And_B(), \
    Set_B1(recipient), \
    Set_A1(m1), \
    Send_A_To_Address_In_B())

// You got it!
```
</details>
<details>
<summary>

## Text to long: atol()
</summary>

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
</details>
<details>
<summary>

## Long to text: ltoa()
</summary>

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
</details>
<details>
<summary>

## Text to fixed: decodeAmount()
</summary>

```c
// ASCII to fixed (base10 positive)
// Expects a string in currentTX.message. If any byte is not a char numeric
// representation or decimal point, then stop and return. Only positive
// numbers, base10 are converted. Returns zero if no number was processed.
fixed decodeAmountInMessage(long startingAt) {
    long multiplier = 1_0000_0000;
    long retVal = 0;
    long ch;
    long decimals = false;
    for (long i = long startingAt; i < 32; i++) {
        ch = currentTX.message[i / 8] >> ((i % 8) * 8);
        ch &= 0xff;
        if (ch == 0 || ch == ' ') break;
        if (ch == '.') {
            decimals = true;
            continue;
        }
        if (ch < '0' || ch > '9' ) {
            // invalid char
            retVal = 0;
            break;
        }
        if (decimals) {
            multiplier /= 10;
        } else {
            retVal *= 10;
        }
        ch &= 0xF;
        ch *= multiplier;
        retVal += ch;
    }
    return bcltof(retVal);
}
```
</details>
<details>
<summary>

## RS-Address to accounId: decodeRS()
</summary>

```c
// RS-Address to accountId
// Expects a string containing an address in currentTX.message
// starting at index zero.
// Ex: S-AAAA-BBBB-CCCC-DDDDD.
// On error returns -1.
// Actually the first group can be any text, so matches 'S', 'TS'
// or 'BURST'.
// No error checks!!

/** Decode an RS address at currentTX.message
 * returns -1 if there is an error on decoding.
 * This function does not verify error correction bytes
 * */
long decodeRS(void) {
    long position = 0, ch, group = 0;
    long idPosition, value, result = 0;
    for (i = 0; i < 32; i++) {
        ch = currentTX.message[i / 8] >> ((i % 8) * 8);
        ch &= 0xff;
        if (ch == '-') {
            group++;
            continue;
        }
        if (group == 0 || group == 3) {
            continue;
        }
        value = rscharToIndex(ch);
        if (value == minus1) {
            // ERROR
            return minus1;
        }
        idPosition = (codeword_map >> (position * 4)) & 15;
        result |= value << (idPosition * 5);
        position++;
        if (position == 13) {
            return result;
        }
    }
    return minus1;
}

const long codeword_map =
     3 + 
     2 *16 +
     1 *16*16 +
     0 *16*16*16 +
     7 *16*16*16*16 +
     6 *16*16*16*16*16 +
     5 *16*16*16*16*16*16 +
     4 *16*16*16*16*16*16*16 +
    12 *16*16*16*16*16*16*16*16 +
     8 *16*16*16*16*16*16*16*16*16 +
     9 *16*16*16*16*16*16*16*16*16*16 +
    10 *16*16*16*16*16*16*16*16*16*16*16 +
    11 *16*16*16*16*16*16*16*16*16*16*16*16;

long rscharToIndex(long in) {
    switch (true) {
    case (in < '2'):
    case (in == 'O'):
    case (in == 'I'):
        return minus1;
    case (in <= '9'):
        return in - '2';
    case (in < 'A'):
        return minus1;
    case (in < 'I'):
        return in - '9';
    case (in < 'O'):
        return in - ':';
    case (in <= 'Z'):
        return in - ';';
    default:
        return minus1;
    }
}
```
</details>

[Back](./README.md)
