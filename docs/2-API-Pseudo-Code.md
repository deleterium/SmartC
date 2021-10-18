[Back](./)

# API Functions pseudo code operations

# Keep in mind!
### A and B registers
They are 256-bit registers and can be used as one big number (called A or B) or in 64-bit pieces (called A1..A4 or B1..B4). A1 is the least significative long. They have the same "mixed" mode as long vars: unsigned for bit operations and signed for aritmetics.

### Timestamps
They are actually two integer 32-bit values joined in a 64-bit value. The most significant part (MSP) is the blockheight and the LSP is the transaction order when the block was forged.

### Messages
An encrypted message to contract is the same as not sending a message.

# Pseudo code
The code below is not valid for SmartC, but can give an idea what is happening when an API function is called.

## Get/Set functions for "pseudo registers"

``` c
long Get_A1(void){
    // Assembly name: get_A1
    return A1;
}

long Get_A2(void) {
    // Assembly name: get_A2
    return A2;
}

long Get_A3(void) {
    // Assembly name: get_A3
    return A3;
}

long Get_A4(void) {
    // Assembly name: get_A4
    return A4;
}

long Get_B1(void) {
    // Assembly name: get_B1
    return B1;
}

long Get_B2(void) {
    // Assembly name: get_B2
    return B2;
}

long Get_B3(void) {
    // Assembly name: get_B3
    return B3;
}

long Get_B4(void) {
    // Assembly name: get_B4
    return B4;
}

void Set_A1(long value) {
    // Assembly name: set_A1
    A1 = value;
}

void Set_A2(long value) {
    // Assembly name: set_A2
    A2 = value;
}

void Set_A3(long value) {
    // Assembly name: set_A3
    A3 = value;
}

void Set_A4(long value) {
    // Assembly name: set_A4
    A4 = value;
}

void Set_A1_A2(long value1, long value2) {
    // Assembly name: set_A1_A2
    A1 = value1;
    A2 = value2;
}

void Set_A3_A4(long value1, long value2) {
    // Assembly name: set_A3_A4
    A3 = value1;
    A4 = value2;
}

void Set_B1(long value) {
    // Assembly name: set_B1
    B1 = value;
}

void Set_B2(long value) {
    // Assembly name: set_B2
    B2 = value;
}

void Set_B3(long value) {
    // Assembly name: set_B3
    B3 = value;
}

void Set_B4(long value) {
    // Assembly name: set_B4
    B4 = value;
}

void Set_B1_B2(long value1,long value2) {
    // Assembly name: set_B1_B2
    B1 = value1;
    B2 = value2;
}

void Set_B3_B4(long value1,long value2) {
    // Assembly name: set_B3_B4
    B3 = value1;
    B4 = value2;
}

void Clear_A(void) {
    // Assembly name: clear_A
    A1 = A2 = A3 = A4 = 0;
}


void Clear_B(void) {
    // Assembly name: clear_B
    B1 = B2 = B3 = B4 = 0;
}

void Clear_A_And_B(void) {
    // Assembly name: clear_A_B
    A1 = A2 = A3 = A4 = 0;
    B1 = B2 = B3 = B4 = 0;
}

void Copy_A_From_B(void) {
    // Assembly name: copy_A_From_B
    A1 = B1;
    A2 = B2;
    A3 = B3;
    A4 = B4;
}

void Copy_B_From_A(void) {
    // Assembly name: copy_B_From_A
    B1 = A1;
    B2 = A2;
    B3 = A3;
    B4 = A4;
}

long Check_A_Is_Zero(void) {
    // Assembly name: check_A_Is_Zero
    /* Note that boolean logic is inverted.
     * Try not use this function */
    if (A1 == 0 && A2 == 0 && A3 == 0 && A4 == 0)
        return 0;
    return 1;
}

long Check_B_Is_Zero(void) {
    // Assembly name: check_B_Is_Zero
    /* Note that boolean logic is inverted.
     * Try not use this function */
    if (B1 == 0 && B2 == 0 && B3 == 0 && B4 == 0)
        return 0;
    return 1;
}

long Check_A_Equals_B(void) {
    // Assembly name: check_A_equals_B
    if (A1 == B1 && A2 == B2 && A3 == B3 && A4 == B4)
        return 1;
    return 0;
}

void Swap_A_and_B(void) {
    // Assembly name: swap_A_and_B
    long t1 = A1, t2 = B2, t3 = B3, t4 = B4;
    A1 = B1, A2 = B2, A3 = B4, A4 = B4;
    B1 = t1, B2 = t2, B3 = t3, B4 = t4;
}

void OR_A_with_B(void) {
    // Assembly name: OR_A_with_B
    A1 |= B1;
    A2 |= B2;
    A3 |= B3;
    A4 |= B4;
}

void OR_B_with_A(void) {
    // Assembly name: OR_B_with_A
    B1 |= A1;
    B2 |= A2;
    B3 |= A3;
    B4 |= A4;
}

void AND_A_with_B(void) {
    // Assembly name: AND_A_with_B
    A1 &= B1;
    A2 &= B2;
    A3 &= B3;
    A4 &= B4;
}

void AND_B_with_A(void) {
    // Assembly name: AND_B_with_A
    B1 &= A1;
    B2 &= A2;
    B3 &= A3;
    B4 &= A4;
}

void XOR_A_with_B(void) {
    // Assembly name: XOR_A_with_B
    A1 ^= B1;
    A2 ^= B2;
    A3 ^= B3;
    A4 ^= B4;
}

void XOR_B_with_A(void) {
    // Assembly name: XOR_B_with_A
    B1 ^= A1;
    B2 ^= A2;
    B3 ^= A3;
    B4 ^= A4;
}

void Add_A_To_B(void) {
    // Assembly name: add_A_to_B
    // Using full 256-bit register
    B = A + B;
}

void Add_B_To_A(void) {
    // Assembly name: add_B_to_A
    // Using full 256-bit register
    A = A + B;
}

void Sub_A_From_B(void) {
    // Assembly name: sub_A_from_B
    // Using full 256-bit register
    B = B - A;
}

void Sub_B_From_A(void) {
    // Assembly name: sub_B_from_A
    // Using full 256-bit register
    A = A - B;
}

void Mul_A_By_B(void) {
    // Assembly name: mul_A_by_B
    // Using full 256-bit register
    B = A * B;
}

void Mul_B_By_A(void) {
    // Assembly name: mul_B_by_A
    // Using full 256-bit register
    A = A * B;
}

void Div_A_By_B(void) {
    // Assembly name: div_A_by_B
    // Using full 256-bit register
    if (B == 0)
        return;
    B = A / B;
}

void Div_B_By_A(void) {
    // Assembly name: div_B_by_A
    if (A == 0)
        return;
    A = B / A;
}
```

## Functions that perform hash operations

``` c
void MD5_A_To_B(void) {
    // Assembly name: MD5_A_to_B
    long md5hash[2] = MD5.hash(A1, A2);
    B1 = md5hash[0];
    B2 = md5hash[1];
}

long Check_MD5_A_With_B(void) {
    // Assembly name: check_MD5_A_with_B
    long md5hash[2] = MD5.hash(A1, A2);
    if (md5hash[0] == B1 && md5hash[1] == B2)
        return 1;
    return 0;
}

void HASH160_A_To_B(void) {
    // Assembly name: HASH160_A_to_B
    long RIPEhash[3] = RIPE.hash(A1, A2, A3, A4);
    B1=RIPEhash[0];
    B2=RIPEhash[1];
    B3=RIPEhash[2];
}

long Check_HASH160_A_With_B(void) {
    // Assembly name: check_HASH160_A_with_B
    long RIPEhash[3] = RIPE.hash(A1, A2, A3, A4);
    if (RIPEhash[0] == B1 && RIPEhash[1] == B2 && RIPEhash[2] == (B[2] & 0x00000000FFFFFFFF))
        return 1;
    return 0;
}

void SHA256_A_To_B(void) {
    // Assembly name: SHA256_A_to_B
    long SHA256hash[4] = SHA256.hash(A1, A2, A3, A4);
    B1 = SHA256hash[0];
    B2 = SHA256hash[1];
    B3 = SHA256hash[2];
    B4 = SHA256hash[3];
}

long Check_SHA256_A_With_B(void) {
    // Assembly name: check_SHA256_A_with_B
    long SHA256hash[4] = SHA256.hash(A1, A2, A3, A4);
    if (SHA256hash[0] == B1 && SHA256hash[1] == B2 && SHA256hash[2] == B3 && SHA256hash[3] == B4 )
        return 1;
    return 0;
}
```

## Generic functions that get block and tx info

``` c
long Get_Block_Timestamp(void) {
    // Assembly name: get_Block_Timestamp
    return Blockchain.CurrentBlock << 32;
}

long Get_Creation_Timestamp(void) {
    // Assembly name: get_Creation_Timestamp
    return Contract.DeployBlock << 32;
}

long Get_Last_Block_Timestamp(void) {
    // Assembly name: get_Last_Block_Timestamp
    return (Blockchain.CurrentBlock - 1) << 32;
}

void Put_Last_Block_Hash_In_A(void) {
    // Assembly name: put_Last_Block_Hash_In_A
    A = Blockchain.LastBlock.Hash;
}

void A_To_Tx_After_Timestamp(long value) {
    // Assembly name: A_to_Tx_after_Timestamp
    long TXid = Blockchain.SearchNextTxToThisContractStartingAt(value);
    A1 = A2 = A3 = A4 = 0;
    if (TXid !== NULL)
        A1 = TXid;
}

long Get_Type_For_Tx_In_A(void) {
    // Assembly name: get_Type_for_Tx_in_A
    if (Blockchain.IsThisTxValid(A1) == false)
        return -1;
    if (Blockchain.IsThereMessageinTx(A1) == false)
        return 0;
    return 1;
}

long Get_Amount_For_Tx_In_A(void) {
    // Assembly name: get_Amount_for_Tx_in_A
    if (Blockchain.IsThisTxValid(A1) == false)
        return -1;
    return Blockchain.GetAmountFromTx(A1) - ContractActivationAmount;
}

long Get_Timestamp_For_Tx_In_A(void) {
    // Assembly name: get_Timestamp_for_Tx_in_A
    if (Blockchain.IsThisTxValid(A1) == false)
        return -1;
    return Blockchain.GetTimestampFromTx(A1) - ContractActivationAmount;}

long Get_Random_Id_For_Tx_In_A(void) {
    // Assembly name: get_Ticket_Id_for_Tx_in_A
    /* This function will wait 15 blocks than return a random number */
    if (Blockchain.IsThisTxValid(A1) == false)
        return -1;
    sleep 15;
    return random;
}

void Message_From_Tx_In_A_To_B(void) {
    // Assembly name: message_from_Tx_in_A_to_B
    if (Blockchain.IsThisTxValid(A1) == false)
        return -1;
    B = 0;
 
    if (Blockchain.IsThereMessageinTx(A1))
        B = Blockchain.GetMessageFromTx(A1)
}

void B_To_Address_Of_Tx_In_A(void) {
    // Assembly name: B_to_Address_of_Tx_in_A
    B = 0;
    if (Blockchain.IsThisTxValid(A1))
       B1 = Blockchain.GetSenderFromTx(A1)
}

void B_To_Address_Of_Creator(void) {
    // Assembly name: B_to_Address_of_Creator
    B = 0;
    B1 = ContractCreator;
}
```

## Generic functions that check balances and perform ops

``` c
long Get_Current_Balance(void) {
    // Assembly name: get_Current_Balance
    return Blockchain.GetMyBalanceNow();
}

long Get_Previous_Balance(void) {
    // Assembly name: get_Previous_Balance
    return Blockchain.GetMyBalanceLastTimeIWasFrozen();
}

void Send_To_Address_In_B(long value) {
    // Assembly name: send_to_Address_in_B
    long ContractBalance = Blockchain.GetMyBalanceNow();
    if (value > ContractBalance)
        Blockchain.SendAllMyBalanceTo(B1);
    else
        Blockchain.SendBalanceTo(value, B1);
}

void Send_All_To_Address_In_B(void) {
    // Assembly name: send_All_to_Address_in_B
    Blockchain.SendAllMyBalanceTo(B1);
}

void Send_Old_To_Address_In_B(void) {
    // Assembly name: send_Old_to_Address_in_B
    long PreviouContractBalance = Blockchain.GetMyBalanceLastTimeIWasFrozen();
    long ContractBalance = Blockchain.GetMyBalanceNow();
    if (PreviouContractBalance > ContractBalance)
        Blockchain.SendAllMyBalanceTo(B1);
    else
        Blockchain.SendBalanceTo(PreviouContractBalance, B1);
}

void Send_A_To_Address_In_B(void) {
    // Assembly name: send_A_to_Address_in_B
     Blockchain.SendMessageInATo(B1);
}

long Add_Minutes_To_Timestamp(long timestamp,long minutes) {
    // Assembly name: add_Minutes_to_Timestamp
    return ((minutes/4) << 32) + timestamp
}
```

[Back](./)
