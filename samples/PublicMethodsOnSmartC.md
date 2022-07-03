# Public methods
SmartJ uses a simple concept to integrate Smart Contracts. It works by defining a public method that can be called by other classes and also imported in other projects. SmartC does not have this kind of java integration, but the same result can be achieved.

To be clear, skeleton codes for SmartC and SmartJ are shown. The main loop for processing messages is hidden in SmartJ, and this part calls the protected methods. Also the switch statement for routing transactions to the public methods is prepared. This is reached using magic numbers to make relationship between the message and the method.

## Discovering magic numbers
Every public method will have a magic number associated. This value calculated internally in SmartJ and it is a hash of function name and arguments. To use in SmartC, we need to calculate this number using the following recipe:

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
// global variables, will be available in all functions
long myVar;

// ****** This part of processing is hidden in SmartJ ******

// Set public functions magic numbers
#define GET_SNACKS 0xfc73947c1b89e15e
#define GET_DRINKS 0x2ad652b169fff962

struct TXINFO {
    long txId,
        timestamp,
        sender,
        amount,
        message[4];
} currentTX;

constructor();

void main(void) {
    blockStarted();
    while ((currentTX.txId = getNextTx()) != 0) {
        currentTX.sender = getSender(currentTX.txId);
        currentTX.amount = getAmount(currentTX.txId);
        readMessage(currentTX.txId, 0, currentTX.message);

        switch (currentTX.message[0]) {
        case GET_SNACKS:
            GetSnacks(currentTX.message[1]);
            break;
        case GET_DRINKS:
            GetDrinks(currentTX.message[1], currentTX.message[2]);
            break;
        default:
            txReceived();
        }
    }
    blockFinished();
}
// ****** end of hidden part ****** 

// ****** These are public methods in SmartJ ****** 
void GetSnacks(long bites) {
    // Do your stuff
    myPrivateMethod();
}

void GetDrinks(long type, long quantity) {
    // Do your stuff
}

// ****** These are private methods in SmartJ ****** 
void myPrivateMethod() {
    // Do your stuff
}

// ****** These are protected methods in SmartJ ****** 
void constructor(void) {
    // this function will be called only once on first activation.
}

void txReceived(void) {
    // Will handle any incoming message that is not direct to public methods
}

void blockStarted(void) {
    // Run when contract is activated by a transaction, but before
    // to get the currentTX details. currentTX will have details from last
    // transaction received in a a previous block.
}

void blockFinished(void) {
    // Run when all transactions were already processed. currentTX will
    // keep the values of last transaction processed.
}
```

## Skeleton on SmartJ

```java
package bt.sample;

import bt.*;
import bt.compiler.CompilerVersion;
import bt.compiler.TargetCompilerVersion;
import bt.ui.EmulatorWindow;

/**
 * Skeleton class
 */
@TargetCompilerVersion(CompilerVersion.v0_0_0)
public class Skeleton extends Contract {

    /**
     * Variables on class scope (available in all methods)
     */
    long myVar;
	
	/**
	 * Constructor, when in blockchain the constructor is called when the first TX
	 * reaches the contract.
	 */
	public Skeleton(){

	}
    
	/**
	 * Get the snacks
	 * 
	 * @param bites
	 */
	public void GetSnacks(long bites) {
		// Do your stuff
	}

	/**
	 * Get the drinks
	 * 
	 * @param type
	 * @param quantity
	 */
	public void GetDrinks(long type, long quantity) {
		// Do your stuff
        myPrivateMethod();
	}

    private void myPrivateMethod() {
        // Do your stuff
    }

	/**
	 * Iterates over every transaction received
	 */
	@Override
	public void txReceived(){

	}
	
	@Override
	protected void blockStarted() {
		
	}

    @Override
	protected void blockFinished() {
		
	}

	public static void main(String[] args) {
		new EmulatorWindow(Skeleton.class);
	}
}
```
