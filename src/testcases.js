"use strict";

/*

teste de função com parametros struct e ponteiro.

struct Zombi {
 long ab;
 long bc;
};

struct Zombi *ptr;

long teste(long b, struct Zombi * ppt, long * c) { long a=4; return a; }

*/




// Author: Rui Deleterium
// Project: https://github.com/deleterium/BurstAT-Compiler
// License: BSD 3-Clause License

function runTestCases() {

    function encodedStr(rawStr) {
        return rawStr.replace(/[\u00A0-\u9999<>\&]/g, function(i) {
            return '&#'+i.charCodeAt(0)+';';
        });
    }

    var tests = [
//   Input,  expectError?,    reuseAssignedVar,    returnTempVar,   expected output  )

// void test
    [ "Void test;", "div" ],
    [ "",  false,  undefined, true, "FIN\n" ],
    [ ";",  false,  undefined, true, "FIN\n" ],
    [ ";;;",  false,  undefined, true, "FIN\n" ],

// Assignment
    [ "Assignment;", "div" ],
    [ "a=b;", false,  undefined, true, "SET @a $b\nFIN\n" ],
    [ "a;",   false,  undefined, true, "FIN\n" ],
    [ "a=;", true,  undefined, true, "" ],
    [ "=a;", true,  undefined, true, "" ],

// SetOperator
    [ "SetOperator;", "div" ],
    [ "a+=b;", false,  undefined, true, "ADD @a $b\nFIN\n" ],
    [ "+=b;", true,  undefined, true, "" ],
    [ "a+=;", true,  undefined, true, "" ],


// Constant
    [ "Constant;", "div" ],
    [ "a=2;", false,  undefined, true, "SET @a #0000000000000002\nFIN\n" ],
    [ "2;",   false,  undefined, true, "FIN\n" ],
    [ "a=0xA;", false,  undefined, true, "SET @a #000000000000000a\nFIN\n" ],
    [ "a=0;", false,  undefined, true, "CLR @a\nFIN\n" ],
    [ "a+=2;", false,  undefined, true, "SET @r0 #0000000000000002\nADD @a $r0\nFIN\n" ],
    [ "a+=0xfffffff;", false,  undefined, true, "SET @r0 #000000000fffffff\nADD @a $r0\nFIN\n" ],
    [ "a='BURST-MKCL-2226-W6AH-7ARVS';", false,  undefined, true, "SET @a #5c6ee8000049c552\nFIN\n" ],
    [ "a=6660515985630020946;", false,  undefined, true, "SET @a #5c6ee8000049c552\nFIN\n" ],
    [ "a=18446744073709551615;", false,  undefined, true, "SET @a #ffffffffffffffff\nFIN\n" ],
    [ "a=18446744073709551616;", true,  undefined, true, "SET @a #0000000000000000\nFIN\n" ],
    [ "a=18446744073709551617;", true,  undefined, true, "SET @a #0000000000000001\nFIN\n" ],



    [ "a=\"Hi there\";", false,  undefined, true, "SET @a #6572656874206948\nFIN\n" ],
    [ "a=\"Hi there big\";", true,  undefined, true, "" ],
    [ "2=a;", true,  undefined, true, "" ],
    
// Operator
    [ "Operator;", "div" ],
    [ "a=b/c;",  false,  undefined, true, "SET @a $b\nDIV @a $c\nFIN\n" ],
    [ "a=b%c;",  false,  undefined, true, "SET @a $b\nMOD @a $c\nFIN\n" ],
    [ "a=b<<c;", false,  undefined, true, "SET @a $b\nSHL @a $c\nFIN\n" ],
    [ "a=b>>c;", false,  undefined, true, "SET @a $b\nSHR @a $c\nFIN\n" ],
    [ "a=b|c;",  false,  undefined, true, "SET @a $c\nBOR @a $b\nFIN\n" ],
    [ "a=b^c;",  false,  undefined, true, "SET @a $c\nXOR @a $b\nFIN\n" ],

// UnaryOperator
    [ "UnaryOperator;", "div" ],
    [ "a=!b;",     false,  undefined, true, "BNZ $b :__NOT_1_sF\nSET @a #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @a\n__NOT_1_end:\nFIN\n" ],
    [ "a=~b;",     false,  undefined, true, "SET @a $b\nNOT @a\nFIN\n" ],
    [ "a^=~b;",    false,  undefined, true, "SET @r0 $b\nNOT @r0\nXOR @a $r0\nFIN\n" ],
    [ "a=~0xff;",  false,  undefined, true, "SET @a #00000000000000ff\nNOT @a\nFIN\n" ],
    [ "a>>=b^~c;", false,  undefined, true, "SET @r0 $c\nNOT @r0\nXOR @r0 $b\nSHR @a $r0\nFIN\n" ],
    [ "a=~~b;",    false,  undefined, true, "SET @a $b\nNOT @a\nNOT @a\nFIN\n" ],

    [ "a=~b/c;",  false,  undefined, true, "SET @a $b\nNOT @a\nDIV @a $c\nFIN\n" ],
    [ "a=~b/~c;", false,  undefined, true, "SET @a $b\nNOT @a\nSET @r0 $c\nNOT @r0\nDIV @a $r0\nFIN\n" ],
    [ "a=b/~c;",  false,  undefined, true, "SET @a $c\nNOT @a\nSET @r0 $b\nDIV @r0 $a\nSET @a $r0\nFIN\n" ],

    [ "~a=b;", true,  undefined, true, "" ],

// SetUnaryOperator
    [ "SetUnaryOperator;", "div" ],
    [ "a++;", false,  undefined, true, "INC @a\nFIN\n" ],
    [ "a--;", false,  undefined, true, "DEC @a\nFIN\n" ],
    [ "++a;", false,  undefined, true, "INC @a\nFIN\n" ],
    [ "--a;", false,  undefined, true, "DEC @a\nFIN\n" ],

    [ "a=b++/c;",    false,  undefined, true, "SET @a $b\nDIV @a $c\nINC @b\nFIN\n" ],
    [ "a=--b/c;",    false,  undefined, true, "DEC @b\nSET @a $b\nDIV @a $c\nFIN\n" ],
    [ "a=~--b;",    false,  undefined, true, "DEC @b\nSET @a $b\nNOT @a\nFIN\n" ],
    [ "a+=~b++;",    false,  undefined, true, "SET @r0 $b\nNOT @r0\nADD @a $r0\nINC @b\nFIN\n" ],
    [ "a=~b++;",    false,  undefined, true, "SET @a $b\nNOT @a\nINC @b\nFIN\n" ],

    [ "a++=2;",true,  undefined, true, "" ],
    [ "a=2++;",true,  undefined, true, "" ],
    [ "--;",   true,  undefined, true, "" ],
    [ "2++;",  true,  undefined, true, "" ],
    [ "a=b- -c;",  true,  undefined, true, "" ],

// CheckOperator Unary
    [ "CheckOperator Unary;", "div" ],
    [ "a=b;", false,  undefined, true, "SET @a $b\nFIN\n" ],

    [ "a+=-b;",   false,  undefined, true, "CLR @r0\nSUB @r0 $b\nADD @a $r0\nFIN\n" ],
    [ "a=-b;",    false,  undefined, true, "CLR @a\nSUB @a $b\nFIN\n" ],
    [ "a=b/-c;",  false,  undefined, true, "CLR @a\nSUB @a $c\nSET @r0 $b\nDIV @r0 $a\nSET @a $r0\nFIN\n" ],
    [ "a=-b/c;",  false,  undefined, true, "CLR @a\nSUB @a $b\nDIV @a $c\nFIN\n" ],
    [ "a=-2;",    false,  undefined, true, "CLR @a\nSET @r0 #0000000000000002\nSUB @a $r0\nFIN\n" ],
    [ "a=-~b;",   false,  undefined, true, "SET @a $b\nNOT @a\nCLR @r0\nSUB @r0 $a\nSET @a $r0\nFIN\n" ],
    [ "a=~-b;",   false,  undefined, true, "CLR @a\nSUB @a $b\nNOT @a\nFIN\n" ],
    [ "a=-b-- ;", false,  undefined, true, "CLR @a\nSUB @a $b\nDEC @b\nFIN\n" ],
    [ "a=---b;",  true,  undefined, true, "" ],

    [ "a=+b;",  false,  undefined, true, "SET @a $b\nFIN\n" ],
    [ "a=b/+c;",  false,  undefined, true, "SET @a $b\nDIV @a $c\nFIN\n" ],
    [ "a=+b/-c;",  false,  undefined, true, "CLR @a\nSUB @a $c\nSET @r0 $b\nDIV @r0 $a\nSET @a $r0\nFIN\n" ],
    [ "a=+b/+c;",  false,  undefined, true, "SET @a $b\nDIV @a $c\nFIN\n" ],
    [ "a=+2;",  false,  undefined, true, "SET @a #0000000000000002\nFIN\n" ],
    [ "a-=+~2;",  false,  undefined, true, "SET @r0 #0000000000000002\nNOT @r0\nSUB @a $r0\nFIN\n" ],
    [ "a=~+2;",  false,  undefined, true, "SET @a #0000000000000002\nNOT @a\nFIN\n" ],
    [ "a=+;",  true,  undefined, true, "" ],
    
    [ "a=&b;",  true,  undefined, true, "" ],


    [ "a=*b;",  false,  undefined, true, "SET @a $($b)\nFIN\n" ],
    [ "*a=b;",  false,  undefined, true, "SET @($a) $b\nFIN\n" ],
    [ "a=*b/5;",  false,  undefined, true, "SET @a $($b)\nSET @r0 #0000000000000005\nDIV @a $r0\nFIN\n" ],
    [ "a=5/ *b;",  false,  undefined, true, "SET @a #0000000000000005\nSET @r0 $($b)\nDIV @a $r0\nFIN\n" ],
    [ "a*=*b;",  false,  undefined, true, "SET @r0 $($b)\nMUL @a $r0\nFIN\n" ],
    [ "a=*b<<*c;",  false,  undefined, true, "SET @a $($b)\nSET @r0 $($c)\nSHL @a $r0\nFIN\n" ],
    [ "a=~*b;",  false,  undefined, true, "SET @a $($b)\nNOT @a\nFIN\n" ],
    [ "a=-*b;",  false,  undefined, true, "CLR @a\nSET @r0 $($b)\nSUB @a $r0\nFIN\n" ],

    [ "a=*~b;",  true,  undefined, true, "" ],
    [ "a=*b--;",  true,  undefined, true, "" ],
    [ "a=++*b;",  true,  undefined, true, "" ],
    [ "a=**b;",  true,  undefined, true, "" ],

// CheckOperator Binary
    [ "CheckOperator Binary;", "div" ],
    [ "a=b+c;",    false,  undefined, true, "SET @a $c\nADD @a $b\nFIN\n" ],
    [ "a=b-c;",    false,  undefined, true, "SET @a $b\nSUB @a $c\nFIN\n" ],
    [ "a=b*c;",    false,  undefined, true, "SET @a $c\nMUL @a $b\nFIN\n" ],
    [ "a=b&c;",    false,  undefined, true, "SET @a $c\nAND @a $b\nFIN\n" ],
    [ "a-=b+c;",    false,  undefined, true, "SET @r0 $c\nADD @r0 $b\nSUB @a $r0\nFIN\n" ],
    [ "a=b-2;",    false,  undefined, true, "SET @a $b\nSET @r0 #0000000000000002\nSUB @a $r0\nFIN\n" ],
    [ "a=\"0\"+b;", false,  undefined, true, "SET @a $b\nSET @r0 #0000000000000030\nADD @a $r0\nFIN\n" ],
    [ "a=2*b;",    false,  undefined, true, "SET @a $b\nSET @r0 #0000000000000002\nMUL @a $r0\nFIN\n" ],
    [ "a<<=b*-c;",    false,  undefined, true, "CLR @r0\nSUB @r0 $c\nMUL @r0 $b\nSHL @a $r0\nFIN\n" ],
    [ "a^=~b&c;",    false,  undefined, true, "SET @r0 $b\nNOT @r0\nSET @r1 $c\nAND @r1 $r0\nXOR @a $r1\nFIN\n" ],
    [ "a^=b&~c;",    false,  undefined, true, "SET @r0 $c\nNOT @r0\nAND @r0 $b\nXOR @a $r0\nFIN\n" ],
    [ "a^=-b&-c;",    false,  undefined, true, "CLR @r0\nSUB @r0 $c\nCLR @r1\nSUB @r1 $b\nAND @r0 $r1\nXOR @a $r0\nFIN\n" ],
    [ "a=b&~0xff;",  false,  undefined, true, "SET @a #00000000000000ff\nNOT @a\nAND @a $b\nFIN\n" ],
    [ "a=~0x7fb&~0xff;",  false,  undefined, true, "SET @a #00000000000000ff\nNOT @a\nSET @r0 #00000000000007fb\nNOT @r0\nAND @a $r0\nFIN\n" ],
    [ "a>>=b-~c;", false,  undefined, true, "SET @r0 $c\nNOT @r0\nSET @r1 $b\nSUB @r1 $r0\nSHR @a $r1\nFIN\n" ],

    [ "a=b++-c;",    false,  undefined, true, "SET @a $b\nSUB @a $c\nINC @b\nFIN\n" ],
    [ "a=--b&c;",    false,  undefined, true, "DEC @b\nSET @a $c\nAND @a $b\nFIN\n" ],

    [ "a+=-b+c;",   false,  undefined, true, "CLR @r0\nSUB @r0 $b\nSET @r1 $c\nADD @r1 $r0\nADD @a $r1\nFIN\n" ],
    [ "a=-b**c;",    false,  undefined, true, "CLR @a\nSUB @a $b\nSET @r0 $($c)\nMUL @r0 $a\nSET @a $r0\nFIN\n" ],
    [ "a=b*-2;",    false,  undefined, true, "CLR @a\nSET @r0 #0000000000000002\nSUB @a $r0\nMUL @a $b\nFIN\n" ],
    [ "a=-2&~b;",   false,  undefined, true, "SET @a $b\nNOT @a\nCLR @r0\nSET @r1 #0000000000000002\nSUB @r0 $r1\nAND @a $r0\nFIN\n" ],
    [ "a=b&~-c;",   false,  undefined, true, "CLR @a\nSUB @a $c\nNOT @a\nAND @a $b\nFIN\n" ],
    [ "a=~-b&c;",   false,  undefined, true, "CLR @a\nSUB @a $b\nNOT @a\nSET @r0 $c\nAND @r0 $a\nSET @a $r0\nFIN\n" ],
    [ "a=b*-c--;", false,  undefined, true, "CLR @a\nSUB @a $c\nMUL @a $b\nDEC @c\nFIN\n" ],
    [ "a=-b--*c;", false,  undefined, true, "CLR @a\nSUB @a $b\nSET @r0 $c\nMUL @r0 $a\nSET @a $r0\nDEC @b\nFIN\n" ],
    [ "a/=b*-c--;", false,  undefined, true, "CLR @r0\nSUB @r0 $c\nMUL @r0 $b\nDIV @a $r0\nDEC @c\nFIN\n" ],

    [ "a+b=c;",  true,  undefined, true, "" ],
    [ "a-b=c;",  true,  undefined, true, "" ],
    [ "a*b=c;",  true,  undefined, true, "" ],
    [ "a&b=c;",  true,  undefined, true, "" ],
    [ "a=b*/c;",  true,  undefined, true, "" ],

// Delimiter
    [ "Delimiter;", "div" ],
    [ "a=b,c=d;",    false,  undefined, true, "SET @a $b\nSET @c $d\nFIN\n" ],
    [ "a,b;",        false,  undefined, true, "FIN\n" ],
    [ "a=b,c=d,e=f;",    false,  undefined, true, "SET @a $b\nSET @c $d\nSET @e $f\nFIN\n" ],
    [ "a=b++,c=b;",    false,  undefined, true, "SET @a $b\nINC @b\nSET @c $b\nFIN\n" ],
    [ "a=b++,c=b++,d=b;",    false,  undefined, true, "SET @a $b\nINC @b\nSET @c $b\nINC @b\nSET @d $b\nFIN\n" ],
    [ "a+=1/2,a+=1/2,a+=1/2,a+=1/2;",    false,  undefined, true, "SET @r0 #0000000000000001\nSET @r1 #0000000000000002\nDIV @r0 $r1\nADD @a $r0\nSET @r0 #0000000000000001\nSET @r1 #0000000000000002\nDIV @r0 $r1\nADD @a $r0\nSET @r0 #0000000000000001\nSET @r1 #0000000000000002\nDIV @r0 $r1\nADD @a $r0\nSET @r0 #0000000000000001\nSET @r1 #0000000000000002\nDIV @r0 $r1\nADD @a $r0\nFIN\n" ],
    [ ",;",    true,  undefined, true, "" ],
    [ ",,,,;",    true,  undefined, true, "" ],
    [ "a=b,,c=d;",    true,  undefined, true, "" ],

    [ "a=,b;",  true,  undefined, true, "" ],

// CodeCave
    [ "CodeCave;", "div" ],
    [ "a=(b);",     false,  undefined, true, "SET @a $b\nFIN\n" ],
    [ "a*=(b);",    false,  undefined, true, "MUL @a $b\nFIN\n" ],
    [ "a=(2);",     false,  undefined, true, "SET @a #0000000000000002\nFIN\n" ],
    [ "a=*(b);",     false,  undefined, true, "SET @a $($b)\nFIN\n" ],
    [ "a=*(b+c);",     false,  undefined, true, "SET @a $c\nADD @a $b\nSET @a $($a)\nFIN\n" ],
    [ "*(a+1)=b;",   false,  undefined, true, "SET @r0 #0000000000000001\nADD @r0 $a\nSET @($r0) $b\nFIN\n" ],
    [ "a=(b*c)*d;",  false,  undefined, true, "SET @a $c\nMUL @a $b\nSET @r0 $d\nMUL @r0 $a\nSET @a $r0\nFIN\n" ],
    [ "a=(b/c)/d;",  false,  undefined, true, "SET @a $b\nDIV @a $c\nDIV @a $d\nFIN\n" ],
    [ "a=~(0xFF<<8);",false,  undefined, true, "SET @a #00000000000000ff\nSET @r0 #0000000000000008\nSHL @a $r0\nNOT @a\nFIN\n" ],
    [ "a=~(b/c)/d;", false,  undefined, true, "SET @a $b\nDIV @a $c\nNOT @a\nDIV @a $d\nFIN\n" ],
    [ "a=(b/c)/~d;", false,  undefined, true, "SET @a $b\nDIV @a $c\nSET @r0 $d\nNOT @r0\nDIV @a $r0\nFIN\n" ],
    [ "a=~(b/c/d);", false,  undefined, true, "SET @a $c\nDIV @a $d\nSET @r0 $b\nDIV @r0 $a\nNOT @r0\nSET @a $r0\nFIN\n" ],
    [ "a=(b+c)*(d+e);",    false,  undefined, true, "SET @a $e\nADD @a $d\nSET @r0 $c\nADD @r0 $b\nMUL @a $r0\nFIN\n" ],
    [ "a=(b+c)/(d+e);",  false,  undefined, true, "SET @a $c\nADD @a $b\nSET @r0 $e\nADD @r0 $d\nDIV @a $r0\nFIN\n" ],
    [ "a%=1-((b+c)*(d+e));",  false,  undefined, true, "SET @r0 $e\nADD @r0 $d\nSET @r1 $c\nADD @r1 $b\nMUL @r0 $r1\nSET @r1 #0000000000000001\nSUB @r1 $r0\nMOD @a $r1\nFIN\n" ],

    [ "a=--(b);",  true,  undefined, true, "" ],
    [ "a=(b+c)++;",  true,  undefined, true, "" ],
    [ "a=(b)[c];",  true,  undefined, true, "" ],

//Arithmetic + comparisions
    [ "Arithmetic + comparisions;", "div" ],
    [ "z=a==b;",  false,  undefined, true, "BNE $a $b :__CMP_1_sF\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n" ],
    [ "z=a!=b;",  false,  undefined, true, "BEQ $a $b :__CMP_1_sF\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n" ],
    [ "z=2<=b;",  false,  undefined, true, "SET @z #0000000000000002\nBGT $z $b :__CMP_1_sF\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n" ],
    [ "z=a<2;",   false,  undefined, true, "SET @z #0000000000000002\nBGE $a $z :__CMP_1_sF\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n" ],
    [ "z=a>=b;",  false,  undefined, true, "BLT $a $b :__CMP_1_sF\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n" ],
    [ "z=a>b;",   false,  undefined, true, "BLE $a $b :__CMP_1_sF\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n" ],
    [ "z=!a;",    false,  undefined, true, "BNZ $a :__NOT_1_sF\nSET @z #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @z\n__NOT_1_end:\nFIN\n" ],
    [ "z=!!a;",    false,  undefined, true, "BZR $a :__NOT_1_sF\nSET @z #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @z\n__NOT_1_end:\nFIN\n" ],
    [ "z=a&&b;",  false,  undefined, true, "BZR $a :__CMP_1_sF\nBZR $b :__CMP_1_sF\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n" ],
    [ "z=a||b;",  false,  undefined, true, "BNZ $a :__CMP_1_sT\nBNZ $b :__CMP_1_sT\nCLR @z\nJMP :__CMP_1_end\n__CMP_1_sT:\nSET @z #0000000000000001\n__CMP_1_end:\nFIN\n" ],
    [ "a=2+b==c;",  false,  undefined, true, "SET @a $b\nSET @r0 #0000000000000002\nADD @a $r0\nBNE $a $c :__CMP_1_sF\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nFIN\n" ],
    [ "a=2+(b==c);",  false,  undefined, true, "BNE $b $c :__CMP_1_sF\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nSET @r0 #0000000000000002\nADD @a $r0\nFIN\n" ],
    [ "a=b==~c;",  false,  undefined, true, "SET @a $c\nNOT @a\nBNE $b $a :__CMP_1_sF\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nFIN\n" ],
    [ "a=b==!c;",  false,  undefined, true, "BNZ $c :__NOT_2_sF\nSET @a #0000000000000001\nJMP :__NOT_2_end\n__NOT_2_sF:\nCLR @a\n__NOT_2_end:\nBNE $b $a :__CMP_1_sF\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nFIN\n" ],
    [ "a=!b==c;",  false,  undefined, true, "BNZ $b :__NOT_2_sF\nSET @a #0000000000000001\nJMP :__NOT_2_end\n__NOT_2_sF:\nCLR @a\n__NOT_2_end:\nBNE $a $c :__CMP_1_sF\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nFIN\n" ],
    [ "a=!b==!c;",  false,  undefined, true, "BNZ $b :__NOT_2_sF\nSET @a #0000000000000001\nJMP :__NOT_2_end\n__NOT_2_sF:\nCLR @a\n__NOT_2_end:\nBNZ $c :__NOT_3_sF\nSET @r0 #0000000000000001\nJMP :__NOT_3_end\n__NOT_3_sF:\nCLR @r0\n__NOT_3_end:\nBNE $a $r0 :__CMP_1_sF\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nFIN\n" ],
    [ "a=!(b+c);",  false,  undefined, true, "SET @a $c\nADD @a $b\nBNZ $a :__NOT_1_sF\nSET @a #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @a\n__NOT_1_end:\nFIN\n" ],
    [ "a=!(b==c);",  false,  undefined, true, "BEQ $b $c :__NOT_1_sF\nSET @a #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @a\n__NOT_1_end:\nFIN\n" ],
    [ "a=!(b==c)==d;",  false,  undefined, true, "BEQ $b $c :__NOT_2_sF\nSET @a #0000000000000001\nJMP :__NOT_2_end\n__NOT_2_sF:\nCLR @a\n__NOT_2_end:\nBNE $a $d :__CMP_1_sF\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nFIN\n" ],
    [ "z=1+((a&&b)||(c&&d));",  false,  undefined, true, "BZR $a :__OR_2_next\nBZR $b :__OR_2_next\nJMP :__CMP_1_sT\n__OR_2_next:\nBZR $c :__CMP_1_sF\nBZR $d :__CMP_1_sF\nJMP :__CMP_1_sT\n__CMP_1_sF:\nCLR @z\nJMP :__CMP_1_end\n__CMP_1_sT:\nSET @z #0000000000000001\n__CMP_1_end:\nSET @r0 #0000000000000001\nADD @z $r0\nFIN\n" ],
    [ "z=1+!((a&&b)||(c&&d));",  false,  undefined, true, "BZR $a :__OR_2_next\nBZR $b :__OR_2_next\nJMP :__NOT_1_sF\n__OR_2_next:\nBZR $c :__NOT_1_sT\nBZR $d :__NOT_1_sT\nJMP :__NOT_1_sF\n__NOT_1_sT:\nSET @z #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @z\n__NOT_1_end:\nSET @r0 #0000000000000001\nADD @z $r0\nFIN\n" ],
    [ "a=b+(++c==d++);",  false,  undefined, true, "INC @c\nBNE $c $d :__CMP_1_sF\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nADD @a $b\nINC @d\nFIN\n" ],
    [ "a=b+(++c&&d++);",  true,  undefined, true, "" ],
    [ "z=1+((a||b)&&(c||d));",  false,  undefined, true, "BNZ $a :__AND_2_next\nBNZ $b :__AND_2_next\nJMP :__CMP_1_sF\n__AND_2_next:\nBNZ $c :__CMP_1_sT\nBNZ $d :__CMP_1_sT\nJMP :__CMP_1_sF\n__CMP_1_sT:\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nSET @r0 #0000000000000001\nADD @z $r0\nFIN\n" ],
    [ "z=1+!((a||b)&&(c||d));",  false,  undefined, true, "BNZ $a :__AND_2_next\nBNZ $b :__AND_2_next\nJMP :__NOT_1_sT\n__AND_2_next:\nBNZ $c :__NOT_1_sF\nBNZ $d :__NOT_1_sF\n__NOT_1_sT:\nSET @z #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @z\n__NOT_1_end:\nSET @r0 #0000000000000001\nADD @z $r0\nFIN\n" ],

    [ "a==b;",  true,  undefined, true, "" ],
    [ "a!=b;",  true,  undefined, true, "" ],
    [ "2<=b;",  true,  undefined, true, "" ],
    [ "a<2;",   true,  undefined, true, "" ],
    [ "a>=b;",  true,  undefined, true, "" ],
    [ "a>b;",   true,  undefined, true, "" ],
    [ "!a;",  true,  undefined, true, "" ],
    [ "a&&b;",  true,  undefined, true, "" ],
    [ "a||b;",  true,  undefined, true, "" ],


// Optimizations
    [ "Optimizations;", "div" ],
    [ "a=a+\"0\";",    false,  undefined, true, "SET @r0 #0000000000000030\nADD @a $r0\nFIN\n" ],
    [ "a=\"0\"+a;",    false,  undefined, true, "SET @r0 $a\nSET @r1 #0000000000000030\nADD @r0 $r1\nSET @a $r0\nFIN\n" ],
    [ "a=b/a;",    false,  undefined, true, "SET @r0 $b\nDIV @r0 $a\nSET @a $r0\nFIN\n" ],
    [ "a=1+(b/(c/a));",    false,  undefined, true, "SET @r0 $c\nDIV @r0 $a\nSET @r1 $b\nDIV @r1 $r0\nSET @r0 #0000000000000001\nADD @r1 $r0\nSET @a $r1\nFIN\n" ],

// MISC 
    [ "MISC;", "div" ],
    [ "a=~-*b;",    false,  undefined, true, "CLR @a\nSET @r0 $($b)\nSUB @a $r0\nNOT @a\nFIN\n" ],
    [ "a=~-~-*b;",    false,  undefined, true, "CLR @a\nSET @r0 $($b)\nSUB @a $r0\nNOT @a\nCLR @r0\nSUB @r0 $a\nNOT @r0\nSET @a $r0\nFIN\n" ],
    [ "a=~-~-*b+1;",    false,  undefined, true, "CLR @a\nSET @r0 $($b)\nSUB @a $r0\nNOT @a\nCLR @r0\nSUB @r0 $a\nNOT @r0\nSET @a #0000000000000001\nADD @a $r0\nFIN\n" ],
    [ "a=b+c/d-e;",    false,  undefined, true, "SET @a $c\nDIV @a $d\nSUB @a $e\nADD @a $b\nFIN\n" ],
    [ "a=b<<c+d<<e;",    false,  undefined, true, "SET @a $d\nADD @a $c\nSHL @a $e\nSET @r0 $b\nSHL @r0 $a\nSET @a $r0\nFIN\n" ],
    [ "a=b&c<<d^e;",    false,  undefined, true, "SET @a $c\nSHL @a $d\nSET @r0 $e\nXOR @r0 $a\nAND @r0 $b\nSET @a $r0\nFIN\n" ],

    [ "a=b%(1+*b[c]);",   true,  undefined, true, "" ],


//Error Tests
// Variable
    [ "Error tests;", "div" ],
    [ "a|b;",   true,  undefined, true, "" ],
    [ "a|b=c;", true,  undefined, true, "" ],
    [ "a/b;",   true,  undefined, true, "" ],
    [ "-a=b;",  true,  undefined, true, "" ],
    [ "+a=b;",  true,  undefined, true, "" ],
    [ "&a=b;",  true,  undefined, true, "" ],
    [ "&;",  true,  undefined, true, "" ],
    [ "+;",  true,  undefined, true, "" ],
    [ "=;",  true,  undefined, true, "" ],
    [ "<=b;",  true,  undefined, true, "" ],
    [ "/;",  true,  undefined, true, "" ],
    [ "/a;",  true,  undefined, true, "" ],

    ];



var logical_tests = [

//    stmt,   expError?, jumpTarget, disableRandom, Expected Output

    [ "Void test", "div" ],

    [ "if () { a++; }",    true,   "__if1_endif) { a++; }", true,  "" ],

    [ "One Operation) { a++; }", "div" ],

// Variable
    [ "if (a) { a++; }",    false,   "__if1_endif) { a++; }", true,  "BZR $a :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],

// Constant
    [ "if (0) { a++; }",    false,   "__if1_endif) { a++; }", true,  "JMP :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (1) { a++; }",    false,   "__if1_endif) { a++; }", true,  "INC @a\n__if1_endif:\nFIN\n" ],
    [ "if (10) { a++; }",    false,   "__if1_endif) { a++; }", true,  "INC @a\n__if1_endif:\nFIN\n" ],

// Operator
    [ "if (a/2) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $a\nSET @r1 #0000000000000002\nDIV @r0 $r1\nBZR $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a%2) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $a\nSET @r1 #0000000000000002\nMOD @r0 $r1\nBZR $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a<<2) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $a\nSET @r1 #0000000000000002\nSHL @r0 $r1\nBZR $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a>>2) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $a\nSET @r1 #0000000000000002\nSHR @r0 $r1\nBZR $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a|2) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 #0000000000000002\nBOR @r0 $a\nBZR $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a^2) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 #0000000000000002\nXOR @r0 $a\nBZR $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],

//UnaryOperator
    [ "if (!a) { a++; }",    false,   "__if1_endif) { a++; }", true,  "BNZ $a :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (~a) { a++; }",    false,   "__if1_endif) { a++; }", true,  "SET @r0 $a\nNOT @r0\nBZR $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],

//SetUnaryOperators
    [ "if (++a) { a++; }", true,   "__if1_endif) { a++; }", true,  "" ],
    [ "if (a++) { a++; }", true,   "__if1_endif) { a++; }", true,  "" ],

//Assignment SetOperator
    [ "if (a=b) { a++; }", true,   "__if1_endif) { a++; }", true,  "" ],
    [ "if (a+=b) { a++; }", true,   "__if1_endif) { a++; }", true,  "" ],

// Comparision
    [ "if (a==b) { a++; }",  false,   "__if1_endif) { a++; }", true,  "BNE $a $b :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a!=b) { a++; }",  false,   "__if1_endif) { a++; }", true,  "BEQ $a $b :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a>=b) { a++; }",  false,   "__if1_endif) { a++; }", true,  "BLT $a $b :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a>b) { a++; }",   false,   "__if1_endif) { a++; }", true,  "BLE $a $b :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a<=b) { a++; }",  false,   "__if1_endif) { a++; }", true,  "BGT $a $b :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a<b) { a++; }",   false,   "__if1_endif) { a++; }", true,  "BGE $a $b :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a==0) { a++; }",  false,   "__if1_endif) { a++; }", true,  "BNZ $a :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a!=0) { a++; }",  false,   "__if1_endif) { a++; }", true,  "BZR $a :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a&&b) { a++; }",  false,   "__if1_endif) { a++; }", true,  "BZR $a :__if1_endif\nBZR $b :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a||b) { a++; }",  false,   "__if1_endif) { a++; }", true,  "BNZ $a :__if1_start\nBNZ $b :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a==b&&c==d) { a++; }",false,   "__if1_endif) { a++; }", true,  "BNE $a $b :__if1_endif\nBNE $c $d :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a==b||c==d) { a++; }", false,   "__if1_endif) { a++; }", true,  "BEQ $a $b :__if1_start\nBEQ $c $d :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n" ],

//Arr
    [ "if (a[b]) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $($a + $b)\nBZR $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],

//CheckOperator Unary
    [ "if (+a) { a++; }", false,   "__if1_endif) { a++; }", true,  "BZR $a :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (*a) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $($a)\nBZR $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (-a) { a++; }", false,   "__if1_endif) { a++; }", true,  "CLR @r0\nSUB @r0 $a\nBZR $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (~a) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $a\nNOT @r0\nBZR $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (&a) { a++; }", true,   "__if1_endif) { a++; }", true,  "" ],

//CheckOperator Binary
    [ "if (b+a) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $a\nADD @r0 $b\nBZR $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (b*a) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $a\nMUL @r0 $b\nBZR $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (b-a) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $b\nSUB @r0 $a\nBZR $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (b&a) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $a\nAND @r0 $b\nBZR $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],

//NewCodeLine
    [ "if (,) { a++; }", true,   "__if1_endif) { a++; }", true,  "" ],
    [ "if (a,) { a++; }", true,   "__if1_endif) { a++; }", true,  "" ],




//Combinations Logical NOT

    [ "Combinations with NOT) { a++; }", "div" ],

// Variable
    [ "if (!a) { a++; }",    false,   "__if1_endif) { a++; }", true,  "BNZ $a :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],

// Constant
    [ "if (!0) { a++; }",    false,   "__if1_endif) { a++; }", true,  "INC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!1) { a++; }",    false,   "__if1_endif) { a++; }", true,  "JMP :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!10) { a++; }",    false,   "__if1_endif) { a++; }", true,  "JMP :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],

// Operator
    [ "if (!(a/2)) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $a\nSET @r1 #0000000000000002\nDIV @r0 $r1\nBNZ $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(a%2)) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $a\nSET @r1 #0000000000000002\nMOD @r0 $r1\nBNZ $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(a<<2)) { a++; }", false,   "__if1_endif) { a++; }", true,   "SET @r0 $a\nSET @r1 #0000000000000002\nSHL @r0 $r1\nBNZ $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(a>>2)) { a++; }", false,   "__if1_endif) { a++; }", true,   "SET @r0 $a\nSET @r1 #0000000000000002\nSHR @r0 $r1\nBNZ $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(a|2)) { a++; }", false,   "__if1_endif) { a++; }", true,   "SET @r0 #0000000000000002\nBOR @r0 $a\nBNZ $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(a^2)) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 #0000000000000002\nXOR @r0 $a\nBNZ $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],

//UnaryOperator
    [ "if (!!a) { a++; }",    false,   "__if1_endif) { a++; }", true,  "BZR $a :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!~a) { a++; }",    false,   "__if1_endif) { a++; }", true,  "SET @r0 $a\nNOT @r0\nBNZ $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],

// Comparision
    [ "if (!(a==b)) { a++; }",  false,   "__if1_endif) { a++; }", true,  "BEQ $a $b :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(a!=b)) { a++; }",  false,   "__if1_endif) { a++; }", true,  "BNE $a $b :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(a>=b)) { a++; }",  false,   "__if1_endif) { a++; }", true,  "BGE $a $b :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(a>b)) { a++; }",   false,   "__if1_endif) { a++; }", true,  "BGT $a $b :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(a<=b)) { a++; }",  false,   "__if1_endif) { a++; }", true,  "BLE $a $b :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(a<b)) { a++; }",   false,   "__if1_endif) { a++; }", true,  "BLT $a $b :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(a==0)) { a++; }",  false,   "__if1_endif) { a++; }", true,  "BZR $a :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(a!=0)) { a++; }",  false,   "__if1_endif) { a++; }", true,  "BNZ $a :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(a&&b)) { a++; }",  false,   "__if1_endif) { a++; }", true,  "BZR $a :__if1_start\nBZR $b :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(a||b)) { a++; }",  false,   "__if1_endif) { a++; }", true,  "BNZ $a :__if1_endif\nBNZ $b :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(a==b&&c==d)) { a++; }",false,   "__if1_endif) { a++; }", true,  "BNE $a $b :__if1_start\nBNE $c $d :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(a==b||c==d)) { a++; }", false,   "__if1_endif) { a++; }", true,  "BEQ $a $b :__if1_endif\nBEQ $c $d :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],

//Arr
    [ "if (!(a[b])) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $($a + $b)\nBNZ $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!a[b]) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $($a + $b)\nBNZ $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],

//CheckOperator Unary
    [ "if (!(+a)) { a++; }", false,   "__if1_endif) { a++; }", true,  "BNZ $a :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(*a)) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $($a)\nBNZ $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(-a)) { a++; }", false,   "__if1_endif) { a++; }", true,  "CLR @r0\nSUB @r0 $a\nBNZ $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(~a)) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $a\nNOT @r0\nBNZ $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(&a)) { a++; }", true,   "__if1_endif) { a++; }", true,  "" ],

//CheckOperator Binary
    [ "if (!(b+a)) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $a\nADD @r0 $b\nBNZ $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(b*a)) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $a\nMUL @r0 $b\nBNZ $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(b-a)) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $b\nSUB @r0 $a\nBNZ $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(b&a)) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 $a\nAND @r0 $b\nBNZ $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],

//Combinations trying to break algorithm
    [ "Misc combinations) { a++; }", "div" ],
    [ "if (a==b&&!(c==d)) { a++; }", false,   "__if1_endif) { a++; }", true,  "BNE $a $b :__if1_endif\nBEQ $c $d :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(a==b)&&c==d) { a++; }", false,   "__if1_endif) { a++; }", true,  "BEQ $a $b :__if1_endif\nBNE $c $d :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a==b==c) { a++; }", false,   "__if1_endif) { a++; }", true,  "BNE $b $c :__CMP_2_sF\nSET @r0 #0000000000000001\nJMP :__CMP_2_end\n__CMP_2_sF:\nCLR @r0\n__CMP_2_end:\nBNE $a $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if ((a==b)==c) { a++; }", false,   "__if1_endif) { a++; }", true,  "BNE $a $b :__CMP_2_sF\nSET @r0 #0000000000000001\nJMP :__CMP_2_end\n__CMP_2_sF:\nCLR @r0\n__CMP_2_end:\nBNE $r0 $c :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a==b&&c==d&&e==f&&g==h) { a++; }", false,   "__if1_endif) { a++; }", true,  "BNE $a $b :__if1_endif\nBNE $c $d :__if1_endif\nBNE $e $f :__if1_endif\nBNE $g $h :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a==b||c==d||e==f||g==h) { a++; }", false,   "__if1_endif) { a++; }", true,  "BEQ $a $b :__if1_start\nBEQ $c $d :__if1_start\nBEQ $e $f :__if1_start\nBEQ $g $h :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if ((a==b||c==d)&&(e==f||g==h)) { a++; }", false,   "__if1_endif) { a++; }", true,  "BEQ $a $b :__AND_2_next\nBEQ $c $d :__AND_2_next\nJMP :__if1_endif\n__AND_2_next:\nBEQ $e $f :__if1_start\nBEQ $g $h :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if ((a==b && c==d) || (e==f && g==h)) { a++; }", false,   "__if1_endif) { a++; }", true,  "BNE $a $b :__OR_2_next\nBNE $c $d :__OR_2_next\nJMP :__if1_start\n__OR_2_next:\nBNE $e $f :__if1_endif\nBNE $g $h :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if ((a>=b && c>=d) || (e!=f && g!=h)) { a++; }", false,   "__if1_endif) { a++; }", true,  "BLT $a $b :__OR_2_next\nBLT $c $d :__OR_2_next\nJMP :__if1_start\n__OR_2_next:\nBEQ $e $f :__if1_endif\nBEQ $g $h :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if ((a>=b&&c>=d)||!(e==f&&g==h)) { a++; }", false,   "__if1_endif) { a++; }", true,  "BLT $a $b :__OR_2_next\nBLT $c $d :__OR_2_next\nJMP :__if1_start\n__OR_2_next:\nBNE $e $f :__if1_start\nBNE $g $h :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if ((a<=b||c<d)&&!(e==f||g==h)) { a++; }", false,   "__if1_endif) { a++; }", true,  "BLE $a $b :__AND_2_next\nBLT $c $d :__AND_2_next\nJMP :__if1_endif\n__AND_2_next:\nBEQ $e $f :__if1_endif\nBEQ $g $h :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(a<=b||c<d)&&(e==f||g==h)) { a++; }", false,   "__if1_endif) { a++; }", true,  "BLE $a $b :__if1_endif\nBLT $c $d :__if1_endif\nBEQ $e $f :__if1_start\nBEQ $g $h :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a==~-b) { a++; }", false,   "__if1_endif) { a++; }", true,  "CLR @r0\nSUB @r0 $b\nNOT @r0\nBNE $a $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a==!~-b) { a++; }", false,   "__if1_endif) { a++; }", true,  "CLR @r0\nSUB @r0 $b\nNOT @r0\nBNZ $r0 :__NOT_2_sF\nSET @r0 #0000000000000001\nJMP :__NOT_2_end\n__NOT_2_sF:\nCLR @r0\n__NOT_2_end:\nBNE $a $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a||(b&&c&&d)||e) { a++; }", false,   "__if1_endif) { a++; }", true,  "BNZ $a :__if1_start\nBZR $b :__OR_3_next\nBZR $c :__OR_3_next\nBZR $d :__OR_3_next\nJMP :__if1_start\n__OR_3_next:\nBNZ $e :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a&&(b||c||d)&&e) { a++; }", false,   "__if1_endif) { a++; }", true,  "BZR $a :__if1_endif\nBNZ $b :__AND_3_next\nBNZ $c :__AND_3_next\nBNZ $d :__AND_3_next\nJMP :__if1_endif\n__AND_3_next:\nBZR $e :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a||(b&&!c&&d)||e) { a++; }", false,   "__if1_endif) { a++; }", true,  "BNZ $a :__if1_start\nBZR $b :__OR_3_next\nBNZ $c :__OR_3_next\nBZR $d :__OR_3_next\nJMP :__if1_start\n__OR_3_next:\nBNZ $e :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a&&(b||!c||d)&&e) { a++; }", false,   "__if1_endif) { a++; }", true,  "BZR $a :__if1_endif\nBNZ $b :__AND_3_next\nBZR $c :__AND_3_next\nBNZ $d :__AND_3_next\nJMP :__if1_endif\n__AND_3_next:\nBZR $e :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a==0&&(b==0||c==0&&d==0)&&e==0) { a++; }", false,   "__if1_endif) { a++; }", true,  "BNZ $a :__if1_endif\nBZR $b :__AND_3_next\nBNZ $c :__if1_endif\nBNZ $d :__if1_endif\n__AND_3_next:\nBNZ $e :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(!(!(a==b)))) { a++; }", false,   "__if1_endif) { a++; }", true,  "BEQ $a $b :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!(!(!(!(a==b))))) { a++; }", false,   "__if1_endif) { a++; }", true,  "BNE $a $b :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (( ( (a==5 || b==z) && c==z) || d==z ) && a==25+b) { a++; }", false,   "__if1_endif) { a++; }", true,  "SET @r0 #0000000000000005\nBEQ $a $r0 :__AND_4_next\nBEQ $b $z :__AND_4_next\nJMP :__OR_3_next\n__AND_4_next:\nBNE $c $z :__OR_3_next\nJMP :__AND_2_next\n__OR_3_next:\nBEQ $d $z :__AND_2_next\nJMP :__if1_endif\n__AND_2_next:\nSET @r0 $b\nSET @r1 #0000000000000019\nADD @r0 $r1\nBNE $a $r0 :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if ((a||b)&&(c||d) && (e||f)&&(g||h) ) { a++; }", false,   "__if1_endif) { a++; }", true,  "BNZ $a :__AND_2_next\nBNZ $b :__AND_2_next\nJMP :__if1_endif\n__AND_2_next:\nBNZ $c :__AND_4_next\nBNZ $d :__AND_4_next\nJMP :__if1_endif\n__AND_4_next:\nBNZ $e :__AND_6_next\nBNZ $f :__AND_6_next\nJMP :__if1_endif\n__AND_6_next:\nBNZ $g :__if1_start\nBNZ $h :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if ((a&&b)||(c&&d) || (e&&f)||(g&&h)) { a++; }", false,   "__if1_endif) { a++; }", true,  "BZR $a :__OR_2_next\nBZR $b :__OR_2_next\nJMP :__if1_start\n__OR_2_next:\nBZR $c :__OR_4_next\nBZR $d :__OR_4_next\nJMP :__if1_start\n__OR_4_next:\nBZR $e :__OR_6_next\nBZR $f :__OR_6_next\nJMP :__if1_start\n__OR_6_next:\nBZR $g :__if1_endif\nBZR $h :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (((a&&b)||(c&&d)) && ((e&&f)||(g&&h))) { a++; }", false,   "__if1_endif) { a++; }", true,  "BZR $a :__OR_3_next\nBZR $b :__OR_3_next\nJMP :__AND_2_next\n__OR_3_next:\nBZR $c :__if1_endif\nBZR $d :__if1_endif\n__AND_2_next:\nBZR $e :__OR_6_next\nBZR $f :__OR_6_next\nJMP :__if1_start\n__OR_6_next:\nBZR $g :__if1_endif\nBZR $h :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!((a&&b)||(c&&d))) { a++; }", false,   "__if1_endif) { a++; }", true,  "BZR $a :__OR_2_next\nBZR $b :__OR_2_next\nJMP :__if1_endif\n__OR_2_next:\nBZR $c :__if1_start\nBZR $d :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (!((a||b)&&(c||d))) { a++; }", false,   "__if1_endif) { a++; }", true,  "BNZ $a :__AND_2_next\nBNZ $b :__AND_2_next\nJMP :__if1_start\n__AND_2_next:\nBNZ $c :__if1_endif\nBNZ $d :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n" ],

    ];

var keywords_tests = [
    [ "if (a) { a++; }", false, "BZR $a :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a) { a++; } else { b--; }", false, "BZR $a :__if1_else\nINC @a\nJMP :__if1_endif\n__if1_else:\nDEC @b\n__if1_endif:\nFIN\n" ],
    [ "while (a) { a++; }", false, "__loop1_continue:\nBZR $a :__loop1_break\nINC @a\nJMP :__loop1_continue\n__loop1_break:\nFIN\n" ],
    [ "for (a=0;a<10;a++) { b++; }", false, "CLR @a\n__loop1_condition:\nSET @r0 #000000000000000a\nBGE $a $r0 :__loop1_break\nINC @b\n__loop1_continue:\nINC @a\nJMP :__loop1_condition\n__loop1_break:\nFIN\n" ],
    [ "do { a++; } while (a<b);", false, "__loop1_continue:\nINC @a\nBGE $a $b :__loop1_break\nJMP :__loop1_continue\n__loop1_break:\nFIN\n" ],
    [ "if (a) a++;", false, "BZR $a :__if1_endif\nINC @a\n__if1_endif:\nFIN\n" ],
    [ "if (a) a++; else b--;", false, "BZR $a :__if1_else\nINC @a\nJMP :__if1_endif\n__if1_else:\nDEC @b\n__if1_endif:\nFIN\n" ],
    [ "while (a) a++;", false, "__loop1_continue:\nBZR $a :__loop1_break\nINC @a\nJMP :__loop1_continue\n__loop1_break:\nFIN\n" ],
    [ "for (a=0;a<10;a++) b++;", false, "CLR @a\n__loop1_condition:\nSET @r0 #000000000000000a\nBGE $a $r0 :__loop1_break\nINC @b\n__loop1_continue:\nINC @a\nJMP :__loop1_condition\n__loop1_break:\nFIN\n" ],
    [ "do a++; while (a<b);", false, "__loop1_continue:\nINC @a\nBGE $a $b :__loop1_break\nJMP :__loop1_continue\n__loop1_break:\nFIN\n" ],
    [ "while (a) { a++; if (a==5) break; b++; }", false, "__loop1_continue:\nBZR $a :__loop1_break\nINC @a\nSET @r0 #0000000000000005\nBNE $a $r0 :__if2_endif\nJMP :__loop1_break\n__if2_endif:\nINC @b\nJMP :__loop1_continue\n__loop1_break:\nFIN\n" ],
    [ "while (a) { a++; if (a==5) continue; b++; }", false, "__loop1_continue:\nBZR $a :__loop1_break\nINC @a\nSET @r0 #0000000000000005\nBNE $a $r0 :__if2_endif\nJMP :__loop1_continue\n__if2_endif:\nINC @b\nJMP :__loop1_continue\n__loop1_break:\nFIN\n" ],
    [ "a++; goto alabel; b++; alabel: c++;", false, "INC @a\nJMP :alabel\nINC @b\nalabel:\nINC @c\nFIN\n" ],
    [ "a++; asm { PSH @a\nPOP @b } b++;", false, "INC @a\nPSH @a\nPOP @b\nINC @b\nFIN\n" ],
    [ "a++; sleep 1;", false, "INC @a\nSET @r0 #0000000000000001\nSLP $r0\nFIN\n" ],
    [ "exit; a++; ", false, "FIN\nINC @a\nFIN\n" ],
    [ "halt;", false, "STP\nFIN\n" ],
    [ "if (a) { a++; if (b) { b++; if (c) { c++; } } }", false, "BZR $a :__if1_endif\nINC @a\nBZR $b :__if2_endif\nINC @b\nBZR $c :__if3_endif\nINC @c\n__if3_endif:\n__if2_endif:\n__if1_endif:\nFIN\n" ],
    [ "if (a) {\n a++;\n} else if (b) {\n b++;\n} else if (c) {\n c++;\n}", false, "BZR $a :__if1_else\nINC @a\nJMP :__if1_endif\n__if1_else:\nBZR $b :__if2_else\nINC @b\nJMP :__if2_endif\n__if2_else:\nBZR $c :__if3_endif\nINC @c\n__if3_endif:\n__if2_endif:\n__if1_endif:\nFIN\n" ],

];

var full_tests = [

// Array
   // Memtable: Arr+ Assignment, Arr+ SetOperator, 
    [ "Array;", "div" ],
    [ "long a[4]; long b; long c; a[b]=c;",    false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\nSET @($a + $b) $c\nFIN\n" ],
    [ "long a[4]; long b; long c; a[0]=b;",    false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\nSET @a_0 $b\nFIN\n" ],
    [ "long a[4]; long b; long c; a[2]=b;",    false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\nSET @a_2 $b\nFIN\n" ],
    [ "long a[4]; long b; long c; c=a[b];",    false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\nSET @c $($a + $b)\nFIN\n" ],
    [ "long a[4]; long b; long c; c=a[0];",    false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\nSET @c $a_0\nFIN\n" ],
    [ "long a[4]; long b; long c; c=a[3];",    false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\nSET @c $a_3\nFIN\n" ],
    [ "long a[4]; long b; long c; a[b]+=c;",    false,"" ],
    [ "long a[4]; long b; long c; a[0]-=b;",    false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\nSUB @a_0 $b\nFIN\n" ],
    [ "long a[4]; long b; long c; a[2]*=b;",    false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\nMUL @a_2 $b\nFIN\n" ],
    [ "long a[4]; long b; long c; c/=a[b];",    false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\nSET @r0 $($a + $b)\nDIV @c $r0\nFIN\n" ],
    [ "long a[4]; long b; long c; c&=a[0];",    false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\nAND @c $a_0\nFIN\n" ],
    [ "long a[4]; long b; long c; c^=a[3];",    false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\nXOR @c $a_3\nFIN\n" ],
    [ "long a[4]; long b; long c[4]; long d; a[b]=c[d];",  false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n^declare c_0\n^declare c_1\n^declare c_2\n^declare c_3\n^declare d\nSET @r0 $($c + $d)\nSET @($a + $b) $r0\nFIN\n" ],
    [ "long a[4]; long b; long c[4]; long d; a[b]+=c[d];", false,"" ],
   // Arr+ Constant, Arr+ Operator
    [ "long a[4]; long b; a[b]=2;",     false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\nSET @r0 #0000000000000002\nSET @($a + $b) $r0\nFIN\n" ],
    [ "long a[4]; a[0]=0xFF;",   false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\nSET @a_0 #00000000000000ff\nFIN\n" ],
    [ "long a[4]; a[2]=\"Ho ho\";", false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\nSET @a_2 #0000006f68206f48\nFIN\n" ],
    [ "a=b[c]/b[d];", false,"SET @a $($b + $c)\nSET @r0 $($b + $d)\nDIV @a $r0\nFIN\n" ],
    [ "a=b[c]<<b[2];",false,"SET @a #0000000000000002\nSET @r0 $($b + $c)\nSET @r1 $($b + $a)\nSHL @r0 $r1\nSET @a $r0\nFIN\n" ],
   // Arr+ UnaryOperator, Arr+ SetUnaryOperator
    [ "a=b[~c];",    false,"SET @a $c\nNOT @a\nSET @a $($b + $a)\nFIN\n" ],
    [ "a=~b[c];",    false,"SET @a $($b + $c)\nNOT @a\nFIN\n" ],
    [ "a=b[c]++;",  true,"" ],
    [ "a=b++[c];",  true,"" ],
    [ "a=--b[c];",  true,"" ],
   // Arr+ CheckOperator(Unary), Arr+ CheckOperator(Binary)
    [ "a=-b[c];",    false,"CLR @a\nSET @r0 $($b + $c)\nSUB @a $r0\nFIN\n" ],
    [ "a=+b[c];",    false,"SET @a $($b + $c)\nFIN\n" ],
    [ "a=b[-c];",    false,"CLR @a\nSUB @a $c\nSET @a $($b + $a)\nFIN\n" ],
    [ "a=b[+c];",    false,"SET @a $($b + $c)\nFIN\n" ],
    [ "a=b[*c];",    false,"SET @a $($c)\nSET @a $($b + $a)\nFIN\n" ],
    [ "a=b[c]-d[e];", false,"SET @a $($b + $c)\nSET @r0 $($d + $e)\nSUB @a $r0\nFIN\n" ],
    [ "a=b[c]+d[e];", false,"SET @a $($d + $e)\nSET @r0 $($b + $c)\nADD @a $r0\nFIN\n" ],
    [ "a=b[c]*d[e];", false,"SET @a $($d + $e)\nSET @r0 $($b + $c)\nMUL @a $r0\nFIN\n" ],
    [ "a=b[c]&d[e];", false,"SET @a $($d + $e)\nSET @r0 $($b + $c)\nAND @a $r0\nFIN\n" ],
    [ "a=b[c-d];",    false,"SET @a $c\nSUB @a $d\nSET @a $($b + $a)\nFIN\n" ],
    [ "a=b[c+d];",    false,"SET @a $d\nADD @a $c\nSET @a $($b + $a)\nFIN\n" ],
    [ "a=b[c*d];",    false,"SET @a $d\nMUL @a $c\nSET @a $($b + $a)\nFIN\n" ],
    [ "a=b[c&d];",    false,"SET @a $d\nAND @a $c\nSET @a $($b + $a)\nFIN\n" ],
    [ "a=*b[c];",  true,"" ],
    [ "a=&b[c];",  true,"" ],
    [ "a=b[&c];",  true,"" ],
   // Arr+ NewCodeLine
    [ "a[2]=b,c[2]*=d,e[2]+=f;",    false,"SET @r0 #0000000000000002\nSET @($a + $r0) $b\nSET @r0 #0000000000000002\nSET @r1 $($c + $r0)\nMUL @r1 $d\nSET @($c + $r0) $r1\nSET @r0 #0000000000000002\nSET @r1 $($e + $r0)\nADD @r1 $f\nSET @($e + $r0) $r1\nFIN\n" ],
    [ "a=b[c],d[0]=e;",    false,"SET @a $($b + $c)\nSET @($d) $e\nFIN\n" ],

 // Memtable: multi Arr, 
    [ "Multidimennsional Array;", "div" ],
    [ "long a[4][2]; a[2][1]=0;",  false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\nCLR @a_5\nFIN\n" ],
    [ "long a[4][2]; long b; a[b][1]=0;",  false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\nSET @r0 $b\nSET @r1 #0000000000000002\nMUL @r0 $r1\nINC @r0\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n" ],
    [ "long a[4][2]; long b; a[b][0]=0;",  false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\nSET @r0 $b\nSET @r1 #0000000000000002\nMUL @r0 $r1\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n" ],
    [ "long a[4][2]; long b; a[0][b]=0;",  false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\nCLR @r0\nSET @($a + $b) $r0\nFIN\n" ],
    [ "long a[4][2]; long b; a[1][b]=0;",  false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\nSET @r0 $b\nINC @r0\nINC @r0\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n" ],
    [ "long a[4][2]; long b; a[1][b]=a[b][1];",  false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\nSET @r0 $b\nINC @r0\nINC @r0\nSET @r1 $b\nSET @r2 #0000000000000002\nMUL @r1 $r2\nINC @r1\nSET @r2 $($a + $r1)\nSET @($a + $r0) $r2\nFIN\n" ],
    [ "long a[3][3][3]; long b; long c; a[1][2][2]=0;",  false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare a_8\n^declare a_9\n^declare a_10\n^declare a_11\n^declare a_12\n^declare a_13\n^declare a_14\n^declare a_15\n^declare a_16\n^declare a_17\n^declare a_18\n^declare a_19\n^declare a_20\n^declare a_21\n^declare a_22\n^declare a_23\n^declare a_24\n^declare a_25\n^declare a_26\n^declare b\n^declare c\nCLR @a_17\nFIN\n" ],
    [ "long a[3][3][3]; long b; long c; a[1][2][b]=0;",  false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare a_8\n^declare a_9\n^declare a_10\n^declare a_11\n^declare a_12\n^declare a_13\n^declare a_14\n^declare a_15\n^declare a_16\n^declare a_17\n^declare a_18\n^declare a_19\n^declare a_20\n^declare a_21\n^declare a_22\n^declare a_23\n^declare a_24\n^declare a_25\n^declare a_26\n^declare b\n^declare c\nSET @r0 $b\nSET @r1 #000000000000000f\nADD @r0 $r1\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n" ],
    [ "long a[3][3][3]; long b; long c; a[1][b][2]=0;",  false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare a_8\n^declare a_9\n^declare a_10\n^declare a_11\n^declare a_12\n^declare a_13\n^declare a_14\n^declare a_15\n^declare a_16\n^declare a_17\n^declare a_18\n^declare a_19\n^declare a_20\n^declare a_21\n^declare a_22\n^declare a_23\n^declare a_24\n^declare a_25\n^declare a_26\n^declare b\n^declare c\nSET @r0 $b\nSET @r1 #0000000000000003\nMUL @r0 $r1\nSET @r1 #0000000000000009\nADD @r0 $r1\nINC @r0\nINC @r0\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n" ],
    [ "long a[3][3][3]; long b; long c; a[b][2][2]=0;",  false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare a_8\n^declare a_9\n^declare a_10\n^declare a_11\n^declare a_12\n^declare a_13\n^declare a_14\n^declare a_15\n^declare a_16\n^declare a_17\n^declare a_18\n^declare a_19\n^declare a_20\n^declare a_21\n^declare a_22\n^declare a_23\n^declare a_24\n^declare a_25\n^declare a_26\n^declare b\n^declare c\nSET @r0 $b\nSET @r1 #0000000000000009\nMUL @r0 $r1\nSET @r1 #0000000000000006\nADD @r0 $r1\nINC @r0\nINC @r0\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n" ],
    [ "long a[3][3][3]; long b; long c; a[b][b][b]=0;",  false,"^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare a_8\n^declare a_9\n^declare a_10\n^declare a_11\n^declare a_12\n^declare a_13\n^declare a_14\n^declare a_15\n^declare a_16\n^declare a_17\n^declare a_18\n^declare a_19\n^declare a_20\n^declare a_21\n^declare a_22\n^declare a_23\n^declare a_24\n^declare a_25\n^declare a_26\n^declare b\n^declare c\nSET @r0 $b\nSET @r1 #0000000000000009\nMUL @r0 $r1\nSET @r1 $b\nSET @r2 #0000000000000003\nMUL @r1 $r2\nADD @r0 $r1\nADD @r0 $b\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n" ],
    [ "",  false,"" ],
    [ "",  false,"" ],
    [ "",  false,"" ],
    [ "",  false,"" ],
    [ "",  false,"" ],
    [ "",  false,"" ],
    [ "",  false,"" ],
    [ "",  false,"" ],

    // MemTable: general
    [ "General;", "div" ],
    [ "long a;",   false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\nFIN\n" ],
    [ "long a=3;", false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\nSET @a #0000000000000003\nFIN\n" ],
    [ "long a,b;", false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare b\nFIN\n" ],
    [ "long a,b=3;", false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare b\nSET @b #0000000000000003\nFIN\n" ],
    [ "long * a;",  false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\nFIN\n" ],
    [ "long a[3];", false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\nFIN\n" ],
    [ "long a[3]; a[0]=9;", false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n^declare a_0\n^declare a_1\n^declare a_2\nSET @a_0 #0000000000000009\nFIN\n" ],
    [ "long a[3]; a=9;", true, "" ],
    [ "long a; void main(void) { a++; }", false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n\n__fn_main:\nPCS\nINC @a\nFIN\n" ],
    [ "long a; void main(void) { a++; return; }", false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n\n__fn_main:\nPCS\nINC @a\nFIN\n" ],
    [ "long a; void main(void) { a++; return; a++; }", false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n\n__fn_main:\nPCS\nINC @a\nFIN\nINC @a\nFIN\n" ],
    [ "long a; void test(void) { a++; return; }", false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n\nJMP :__fn_test_end\n__fn_test:\nINC @a\nRET\n__fn_test_end:\nFIN\n" ],
    [ "long a; void test(void) { a++; return; a++; }", false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n\nJMP :__fn_test_end\n__fn_test:\nINC @a\nRET\nINC @a\nRET\n__fn_test_end:\nFIN\n" ],
    [ "long a; test(); void test(void) { a++; return; }", false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\nJSR :__fn_test\n\nJMP :__fn_test_end\n__fn_test:\nINC @a\nRET\n__fn_test_end:\nFIN\n" ],
    [ "long a; a=test(); void test(void) { a++; return; }", true, "" ],
    [ "long a; void test2(long b) { b++; return; }", false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n\n^declare test2_b\nJMP :__fn_test2_end\n__fn_test2:\nPOP @test2_b\nINC @test2_b\nRET\n__fn_test2_end:\nFIN\n" ],
    [ "long a; long test2(long b) { b++; return b; }", false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\n\n^declare test2_b\nJMP :__fn_test2_end\n__fn_test2:\nPOP @test2_b\nINC @test2_b\nPSH $test2_b\nRET\n__fn_test2_end:\nFIN\n" ],
    [ "long a=0; a=test2(a); long test2(long b) { b++; return b; }", false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\nCLR @a\nPSH $a\nJSR :__fn_test2\nPOP @r0\nSET @a $r0\n\n^declare test2_b\nJMP :__fn_test2_end\n__fn_test2:\nPOP @test2_b\nINC @test2_b\nPSH $test2_b\nRET\n__fn_test2_end:\nFIN\n" ],
    [ "long a=0; test2(a); long test2(long b) { b++; return b; }", true, "" ],
    [ "#pragma warningToError false\nlong a=0; test2(a); long test2(long b) { b++; return b; }", false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\nCLR @a\nPSH $a\nJSR :__fn_test2\nPOP @r0\n\n^declare test2_b\nJMP :__fn_test2_end\n__fn_test2:\nPOP @test2_b\nINC @test2_b\nPSH $test2_b\nRET\n__fn_test2_end:\nFIN\n" ],
    [ "long a=0; void main(void){ a++; test2(a); exit; } void test2(long b) { b++; return; }", false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\nCLR @a\n\n__fn_main:\nPCS\nINC @a\nPSH $a\nJSR :__fn_test2\nFIN\n\n^declare test2_b\nJMP :__fn_test2_end\n__fn_test2:\nPOP @test2_b\nINC @test2_b\nRET\n__fn_test2_end:\nFIN\n" ],
    [ "#include APIFunctions\nlong a;Set_A1(a);", false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n^declare a\nFUN set_A1 $a\nFIN\n" ],
    [ "#include APIFunctions\nSet_A1();", true, "" ],
    //bug 1, goto failed with undeclared variable
    [ "void  teste(long ret) { long temp = 2; goto newlabel; ret[temp] = temp; newlabel: temp++; }", false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n\n^declare teste_temp\n^declare teste_ret\nJMP :__fn_teste_end\n__fn_teste:\nPOP @teste_ret\nSET @teste_temp #0000000000000002\nJMP :newlabel\nSET @($teste_ret + $teste_temp) $teste_temp\nnewlabel:\nINC @teste_temp\nRET\n__fn_teste_end:\nFIN\n" ],
    //bug 2, failed when declaring pointer on function declaration
    [ "void  teste(long * ret) { long temp = 2; goto newlabel; ret[temp] = temp; newlabel: temp++; }", false, "^declare r0\n^declare r1\n^declare r2\n^declare r3\n^declare r4\n\n^declare teste_temp\n^declare teste_ret\nJMP :__fn_teste_end\n__fn_teste:\nPOP @teste_ret\nSET @teste_temp #0000000000000002\nJMP :newlabel\nSET @($teste_ret + $teste_temp) $teste_temp\nnewlabel:\nINC @teste_temp\nRET\n__fn_teste_end:\nFIN\n" ],
    //bug 3, ReuseAssignedVar not working inside a function.
    [ "#pragma maxAuxVars 2\nlong itoa(long val) {\n    long ret, temp;\n    if (val >= 0 && val <= 99999999) { ret = (ret << 8) + temp; return ret; }\n    return '#error';\n}", false, "^declare r0\n^declare r1\n\n^declare itoa_ret\n^declare itoa_temp\n^declare itoa_val\nJMP :__fn_itoa_end\n__fn_itoa:\nPOP @itoa_val\nCLR @r0\nBLT $itoa_val $r0 :__if1_endif\nSET @r0 #0000000005f5e0ff\nBGT $itoa_val $r0 :__if1_endif\nSET @r0 $itoa_ret\nSET @r1 #0000000000000008\nSHL @r0 $r1\nSET @r1 $itoa_temp\nADD @r1 $r0\nSET @itoa_ret $r1\nPSH $itoa_ret\nRET\n__if1_endif:\nSET @r0 #0000726f72726523\nPSH $r0\nRET\n__fn_itoa_end:\nFIN\n" ],


];

    var code;
    var result="";

    result+="<h3>Full tests</h3>";
    for (var i=0; i<full_tests.length; i++) {
        try {
            if (full_tests[i][1] === "div") {
                result+="\n<h4>"+full_tests[i][0]+"</h4>";
                continue;
            }
            result+="<br>Test "+i+" ";
            code = bigastCompile(bigastProcessSyntax(shapeProgram(verify(parser(tokenizer(full_tests[i][0]))))));
            if (full_tests[i][1] === false) {
                if (code === full_tests[i][2])
                    result+="Pass! (run OK) Code: <span style='color:blue'>"+encodedStr(full_tests[i][0])+"</span>";
                else
                    result+="<span style='color:red'>Fail...</span> (run OK) Code: <span style='color:blue'>"+encodedStr(full_tests[i][0])+"</span> Expected \n"+full_tests[i][2]+"   GOT\n"+code;
            } else
                result+="<span style='color:red'>Fail...</span> (run OK) Code: <span style='color:purple'>"+encodedStr(full_tests[i][0])+"</span> Expected to throw exception but GOT\n"+code;
        } catch (e) {
            if (full_tests[i][1] === true)
                result+="Pass! (failed) Code: <span style='color:purple'>"+encodedStr(full_tests[i][0])+"</span>";
            else
                result+="<span style='color:red'>Fail...</span> (failed) Code: <span style='color:purple'>"+encodedStr(full_tests[i][0])+"</span>   GOT\n"+e;
        }
    }

    result+="<h3>Keywords tests</h3>";
    for (var i=0; i<keywords_tests.length; i++) {
        try {
            if (keywords_tests[i][1] === "div") {
                result+="\n<h4>"+keywords_tests[i][0]+"</h4>";
                continue;
            }
            result+="<br>Test "+i+" ";
            code = bigastCompile(bigastProcessSyntax(shapeProgram(verify(parser(tokenizer("#pragma useVariableDeclaration false\n"+keywords_tests[i][0]))))));
            if (keywords_tests[i][1] === false) {
                if (code === keywords_tests[i][2])
                    result+="Pass! (run OK) Code: <span style='color:blue'>"+encodedStr(keywords_tests[i][0])+"</span>";
                else
                    result+="<span style='color:red'>Fail...</span> (run OK) Code: <span style='color:blue'>"+encodedStr(keywords_tests[i][0])+"</span> Expected \n"+keywords_tests[i][2]+"   GOT\n"+code;
            } else
                result+="<span style='color:red'>Fail...</span> (run OK) Code: <span style='color:purple'>"+encodedStr(keywords_tests[i][0])+"</span> Expected to throw exception but GOT\n"+code;
        } catch (e) {
            if (keywords_tests[i][1] === true)
                result+="Pass! (failed) Code: <span style='color:purple'>"+encodedStr(keywords_tests[i][0])+"</span>";
            else
                result+="<span style='color:red'>Fail...</span> (failed) Code: <span style='color:purple'>"+encodedStr(keywords_tests[i][0])+"</span>   GOT\n"+e;
        }
    }

    result+="<h3>Logical tests</h3>";
    for (var i=0; i<logical_tests.length; i++) {
        try {
            if (logical_tests[i][1] === "div") {
                result+="\n<h4>"+logical_tests[i][0]+"</h4>";
                continue;
            }
            result+="<br>Test "+i+" ";
            code = bigastCompile(bigastProcessSyntax(shapeProgram(verify(parser(tokenizer("#pragma useVariableDeclaration false\n"+logical_tests[i][0]))))));
            if (logical_tests[i][1] === false) {
                if (code === logical_tests[i][4])
                    result+="Pass! (run OK) Code: <span style='color:blue'>"+encodedStr(logical_tests[i][0])+"</span>";
                else
                    result+="<span style='color:red'>Fail...</span> (run OK) Code: <span style='color:blue'>"+encodedStr(logical_tests[i][0])+"</span> Expected \n"+logical_tests[i][4]+"   GOT\n"+code;
            } else
                result+="<span style='color:red'>Fail...</span> (run OK) Code: <span style='color:purple'>"+encodedStr(logical_tests[i][0])+"</span> Expected to throw exception but GOT\n"+code;
        } catch (e) {
            if (logical_tests[i][1] === true)
                result+="Pass! (failed) Code: <span style='color:purple'>"+encodedStr(logical_tests[i][0])+"</span>";
            else
                result+="<span style='color:red'>Fail...</span> (failed) Code: <span style='color:purple'>"+encodedStr(logical_tests[i][0])+"</span>   GOT\n"+e;
        }
    }

    result+="<h3>Arithmetic tests</h3>";
    for (var i=0; i<tests.length; i++) {
        try {
            if (tests[i][1] === "div") {
                result+="\n<h4>"+tests[i][0]+"</h4>";
                continue;
            }
            result+="<br>Test "+i+" ";
            code = bigastCompile(bigastProcessSyntax(shapeProgram(verify(parser(tokenizer("#pragma useVariableDeclaration false\n"+tests[i][0]))))));
            if (tests[i][1] === false) {
                if (code === tests[i][4])
                    result+="Pass! (run OK) Code: <span style='color:blue'>"+encodedStr(tests[i][0])+"</span>";
                else
                    result+="<span style='color:red'>Fail...</span> (run OK) Code: <span style='color:blue'>"+encodedStr(tests[i][0])+"</span> Expected \n"+tests[i][4]+"   GOT\n"+code;
            } else
                result+="<span style='color:red'>Fail...</span> (run OK) Code: <span style='color:purple'>"+encodedStr(tests[i][0])+"</span> Expected to throw exception but GOT\n"+code;
        } catch (e) {
            if (tests[i][1] === true)
                result+="Pass! (failed) Code: <span style='color:purple'>"+encodedStr(tests[i][0])+"</span>";
            else
                result+="<span style='color:red'>Fail...</span> (failed) Code: <span style='color:purple'>"+encodedStr(tests[i][0])+"</span>   GOT\n"+e;
        }
    }

    return result;
}
