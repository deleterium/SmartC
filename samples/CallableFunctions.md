# Callable functions
SmartJ created a simple concept to integrate Smart Contracts. It works by defining a public function that can be called by other classes. SmartC does not have this kind of java integration, but the same result can be achieved.

## Discovering magic numbers
Every public function will have a magic number associated, so it is possible to link the function to the contract. This value is a hash of function name and arguments. To discover, use the following recipe:

* Create a string with the function name then add a 'V'
* Change the arguments to 'J'
* Calculate the sha256 hash of this string
* Take the first 8 bytes
* Swap endianess

Example 1: GetSnacks(long bites)
* GetSnacks(long bites)V
* GetSnacks(J)V
* 5ee1891b7c9473fc1dc725c77f409fb9732b3778fd5ae93aba5ec82ff57be1f9
* 5ee1891b7c9473fc
* fc73947c1b89e15e
* Magic number for GetSnacks(long bites) is 0xfc73947c1b89e15e

Example 2: GetDrinks(long type, long quantity)
* GetDrinks(long type, long quantity)V
* GetDrinks(JJ)V
* 62f9ff69b152d62a172b7bf47c437891357163ac3de8c1c0314dde45765921d5
* 62f9ff69b152d62a
* 2ad652b169fff962
* Magic number for GetDrinks(long type, long quantity) is 0x2ad652b169fff962

To automate the process you can use CyberChef with the recipe https://gchq.github.io/CyberChef/#recipe=SHA2('256',64,160)Take_bytes(0,16,false)Swap_endianness('Hex',8,true)&input=R2V0RHJpbmtzKEpKKVY

## SmartC program skeleton

```c
#include APIFunctions
#pragma version 1.0

// Set public functions magic numbers
#define GET_SNACKS 0xfc73947c1b89e15e
#define GET_DRINKS 0x2ad652b169fff962
#define PUBLIC_FUNCTION_C 0x1012
#define PUBLIC_FUNCTION_D 0x1013

struct TXINFO {
    long txId,
        timestamp,
        sender,
        amount,
        message[4];
} currentTX;

B_To_Address_Of_Creator();
long CREATOR = Get_B1();

void main(void) {
    while (getNewTxDetails()) {
        switch (currentTX.message[0]) {
        case GET_SNACKS:
            GetSnacks(currentTX.message[1]);
            break;
        case GET_DRINKS:
            GetDrinks(currentTX.message[1], currentTX.message[2]);
            break;
        case PUBLIC_FUNCTION_C:
            PublicFunctionC();
            break;
        case PUBLIC_FUNCTION_D:
            PublicFunctionD();
            break;
        default:
            // Maybe add an error message?
        }
    }
    // No more TX to process;
    cleanUp();
}

// These are public functions. Starting with Capital Letter
void GetSnacks(long bites) {
}

void GetDrinks(long type, long quantity) {
}

void PublicFunctionC(void) {
}

void PublicFunctionD(void) {
}

// These are private functions
void cleanUp(void) {
}

long getNewTxDetails(void) {
    A_To_Tx_After_Timestamp(currentTX.timestamp);
    currentTX.txId = Get_A1();
    if (currentTX.txId == 0) {
        return false;
    }
    currentTX.amount = Get_Amount_For_Tx_In_A();
    currentTX.timestamp = Get_Timestamp_For_Tx_In_A();
    Message_From_Tx_In_A_To_B();
    currentTX.message[0] = Get_B1();
    currentTX.message[1] = Get_B2();
    currentTX.message[2] = Get_B3();
    currentTX.message[3] = Get_B4();
    B_To_Address_Of_Tx_In_A();
    currentTX.sender = Get_B1();
    return true;
}
```
