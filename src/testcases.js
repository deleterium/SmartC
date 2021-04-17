"use strict";

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
    [ "Void test", "div" ],
    [ "",  false,  undefined, true, "" ],

// Assignment
    [ "Assignment", "div" ],
    [ "a=b", false,  undefined, true, "SET @a $b\n" ],
    [ "a=", true,  undefined, true, "" ],
    [ "=a", true,  undefined, true, "" ],

// SetOperator
    [ "SetOperator", "div" ],
    [ "a+=b", false,  undefined, true, "ADD @a $b\n" ],
    [ "+=b", true,  undefined, true, "" ],
    [ "a+=", true,  undefined, true, "" ],


// Constant
    [ "Constant", "div" ],
    [ "a=2", false,  undefined, true, "SET @a #0000000000000002\n" ],
    [ "a=0xA", false,  undefined, true, "SET @a #000000000000000a\n" ],
    [ "a=0", false,  undefined, true, "CLR @a\n" ],
    [ "a+=2", false,  undefined, true, "SET @r0 #0000000000000002\nADD @a $r0\n" ],
    [ "a+=0xfffffff", false,  undefined, true, "SET @r0 #000000000fffffff\nADD @a $r0\n" ],
    [ "a=\"Hi there\"", false,  undefined, true, "SET @a #6572656874206948\n" ],
    [ "a=\"Hi there big\"", true,  undefined, true, "" ],
    [ "2=a", true,  undefined, true, "" ],
    
// Operator
    [ "Operator", "div" ],
    [ "a=b/c",  false,  undefined, true, "SET @a $b\nDIV @a $c\n" ],
    [ "a=b%c",  false,  undefined, true, "SET @a $b\nMOD @a $c\n" ],
    [ "a=b<<c", false,  undefined, true, "SET @a $b\nSHL @a $c\n" ],
    [ "a=b>>c", false,  undefined, true, "SET @a $b\nSHR @a $c\n" ],
    [ "a=b|c",  false,  undefined, true, "SET @a $c\nBOR @a $b\n" ],
    [ "a=b^c",  false,  undefined, true, "SET @a $c\nXOR @a $b\n" ],

// UnaryOperator
    [ "UnaryOperator", "div" ],
    [ "a=!b",     false,  undefined, true, "BNZ $b :__NOT_A_sF\nSET @a #0000000000000001\nJMP :__NOT_A_end\n__NOT_A_sF:\nCLR @a\n__NOT_A_end:\n" ],
    [ "a=~b",     false,  undefined, true, "SET @a $b\nNOT @a\n" ],
    [ "a^=~b",    false,  undefined, true, "SET @r0 $b\nNOT @r0\nXOR @a $r0\n" ],
    [ "a=~0xff",  false,  undefined, true, "SET @a #00000000000000ff\nNOT @a\n" ],
    [ "a>>=b^~c", false,  undefined, true, "SET @r0 $c\nNOT @r0\nXOR @r0 $b\nSHR @a $r0\n" ],
    [ "a=~~b",    false,  undefined, true, "SET @a $b\nNOT @a\nNOT @a\n" ],

    [ "a=~b/c",  false,  undefined, true, "SET @a $b\nNOT @a\nDIV @a $c\n" ],
    [ "a=~b/~c", false,  undefined, true, "SET @a $b\nNOT @a\nSET @r0 $c\nNOT @r0\nDIV @a $r0\n" ],
    [ "a=b/~c",  false,  undefined, true, "SET @a $c\nNOT @a\nSET @r0 $b\nDIV @r0 $a\nSET @a $r0\n" ],

    [ "~a=b", true,  undefined, true, "" ],

// SetUnaryOperator
    [ "SetUnaryOperator", "div" ],
    [ "a++", false,  undefined, true, "INC @a\n" ],
    [ "a--", false,  undefined, true, "DEC @a\n" ],
    [ "++a", false,  undefined, true, "INC @a\n" ],
    [ "--a", false,  undefined, true, "DEC @a\n" ],

    [ "a=b++/c",    false,  undefined, true, "SET @a $b\nDIV @a $c\nINC @b\n" ],
    [ "a=--b/c",    false,  undefined, true, "DEC @b\nSET @a $b\nDIV @a $c\n" ],
    [ "a=~--b",    false,  undefined, true, "DEC @b\nSET @a $b\nNOT @a\n" ],
    [ "a+=~b++",    false,  undefined, true, "SET @r0 $b\nNOT @r0\nADD @a $r0\nINC @b\n" ],
    [ "a=~b++",    false,  undefined, true, "SET @a $b\nNOT @a\nINC @b\n" ],

    [ "a++=2",true,  undefined, true, "" ],
    [ "a=2++",true,  undefined, true, "" ],
    [ "--",   true,  undefined, true, "" ],
    [ "2++",  true,  undefined, true, "" ],
    [ "a=b- -c",  true,  undefined, true, "" ],

// CheckOperator Unary
    [ "CheckOperator Unary", "div" ],
    [ "a=b", false,  undefined, true, "SET @a $b\n" ],

    [ "a+=-b",   false,  undefined, true, "CLR @r0\nSUB @r0 $b\nADD @a $r0\n" ],
    [ "a=-b",    false,  undefined, true, "CLR @a\nSUB @a $b\n" ],
    [ "a=b/-c",  false,  undefined, true, "CLR @a\nSUB @a $c\nSET @r0 $b\nDIV @r0 $a\nSET @a $r0\n" ],
    [ "a=-b/c",  false,  undefined, true, "CLR @a\nSUB @a $b\nDIV @a $c\n" ],
    [ "a=-2",    false,  undefined, true, "CLR @a\nSET @r0 #0000000000000002\nSUB @a $r0\n" ],
    [ "a=-~b",   false,  undefined, true, "SET @a $b\nNOT @a\nCLR @r0\nSUB @r0 $a\nSET @a $r0\n" ],
    [ "a=~-b",   false,  undefined, true, "CLR @a\nSUB @a $b\nNOT @a\n" ],
    [ "a=-b-- ", false,  undefined, true, "CLR @a\nSUB @a $b\nDEC @b\n" ],
    [ "a=---b",  true,  undefined, true, "" ],

    [ "a=+b",  false,  undefined, true, "SET @a $b\n" ],
    [ "a=b/+c",  false,  undefined, true, "SET @a $b\nDIV @a $c\n" ],
    [ "a=+b/-c",  false,  undefined, true, "CLR @a\nSUB @a $c\nSET @r0 $b\nDIV @r0 $a\nSET @a $r0\n" ],
    [ "a=+b/+c",  false,  undefined, true, "SET @a $b\nDIV @a $c\n" ],
    [ "a=+2",  false,  undefined, true, "SET @a #0000000000000002\n" ],
    [ "a-=+~2",  false,  undefined, true, "SET @r0 #0000000000000002\nNOT @r0\nSUB @a $r0\n" ],
    [ "a=~+2",  false,  undefined, true, "SET @a #0000000000000002\nNOT @a\n" ],
    [ "a=+",  true,  undefined, true, "" ],
    
    [ "a=&b",  true,  undefined, true, "" ],


    [ "a=*b",  false,  undefined, true, "SET @a $($b)\n" ],
    [ "*a=b",  false,  undefined, true, "SET @($a) $b\n" ],
    [ "a=*b/5",  false,  undefined, true, "SET @a $($b)\nSET @r0 #0000000000000005\nDIV @a $r0\n" ],
    [ "a=5/*b",  false,  undefined, true, "SET @a #0000000000000005\nSET @r0 $($b)\nDIV @a $r0\n" ],
    [ "a*=*b",  false,  undefined, true, "SET @r0 $($b)\nMUL @a $r0\n" ],
    [ "a=*b<<*c",  false,  undefined, true, "SET @a $($b)\nSET @r0 $($c)\nSHL @a $r0\n" ],
    [ "a=~*b",  false,  undefined, true, "SET @a $($b)\nNOT @a\n" ],
    [ "a=-*b",  false,  undefined, true, "CLR @a\nSET @r0 $($b)\nSUB @a $r0\n" ],

    [ "a=*~b",  true,  undefined, true, "" ],
    [ "a=*b--",  true,  undefined, true, "" ],
    [ "a=++*b",  true,  undefined, true, "" ],
    [ "a=**b",  true,  undefined, true, "" ],

// CheckOperator Binary
    [ "CheckOperator Binary", "div" ],
    [ "a=b+c",    false,  undefined, true, "SET @a $c\nADD @a $b\n" ],
    [ "a=b-c",    false,  undefined, true, "SET @a $b\nSUB @a $c\n" ],
    [ "a=b*c",    false,  undefined, true, "SET @a $c\nMUL @a $b\n" ],
    [ "a=b&c",    false,  undefined, true, "SET @a $c\nAND @a $b\n" ],
    [ "a-=b+c",    false,  undefined, true, "SET @r0 $c\nADD @r0 $b\nSUB @a $r0\n" ],
    [ "a=b-2",    false,  undefined, true, "SET @a $b\nSET @r0 #0000000000000002\nSUB @a $r0\n" ],
    [ "a=\"0\"+b", false,  undefined, true, "SET @a $b\nSET @r0 #0000000000000030\nADD @a $r0\n" ],
    [ "a=2*b",    false,  undefined, true, "SET @a $b\nSET @r0 #0000000000000002\nMUL @a $r0\n" ],
    [ "a<<=b*-c",    false,  undefined, true, "CLR @r0\nSUB @r0 $c\nMUL @r0 $b\nSHL @a $r0\n" ],
    [ "a^=~b&c",    false,  undefined, true, "SET @r0 $b\nNOT @r0\nSET @r1 $c\nAND @r1 $r0\nXOR @a $r1\n" ],
    [ "a^=b&~c",    false,  undefined, true, "SET @r0 $c\nNOT @r0\nAND @r0 $b\nXOR @a $r0\n" ],
    [ "a^=-b&-c",    false,  undefined, true, "CLR @r0\nSUB @r0 $c\nCLR @r1\nSUB @r1 $b\nAND @r0 $r1\nXOR @a $r0\n" ],
    [ "a=b&~0xff",  false,  undefined, true, "SET @a #00000000000000ff\nNOT @a\nAND @a $b\n" ],
    [ "a=~0x7fb&~0xff",  false,  undefined, true, "SET @a #00000000000000ff\nNOT @a\nSET @r0 #00000000000007fb\nNOT @r0\nAND @a $r0\n" ],
    [ "a>>=b-~c", false,  undefined, true, "SET @r0 $c\nNOT @r0\nSET @r1 $b\nSUB @r1 $r0\nSHR @a $r1\n" ],

    [ "a=b++-c",    false,  undefined, true, "SET @a $b\nSUB @a $c\nINC @b\n" ],
    [ "a=--b&c",    false,  undefined, true, "DEC @b\nSET @a $c\nAND @a $b\n" ],

    [ "a+=-b+c",   false,  undefined, true, "CLR @r0\nSUB @r0 $b\nSET @r1 $c\nADD @r1 $r0\nADD @a $r1\n" ],
    [ "a=-b**c",    false,  undefined, true, "CLR @a\nSUB @a $b\nSET @r0 $($c)\nMUL @r0 $a\nSET @a $r0\n" ],
    [ "a=b*-2",    false,  undefined, true, "CLR @a\nSET @r0 #0000000000000002\nSUB @a $r0\nMUL @a $b\n" ],
    [ "a=-2&~b",   false,  undefined, true, "SET @a $b\nNOT @a\nCLR @r0\nSET @r1 #0000000000000002\nSUB @r0 $r1\nAND @a $r0\n" ],
    [ "a=b&~-c",   false,  undefined, true, "CLR @a\nSUB @a $c\nNOT @a\nAND @a $b\n" ],
    [ "a=~-b&c",   false,  undefined, true, "CLR @a\nSUB @a $b\nNOT @a\nSET @r0 $c\nAND @r0 $a\nSET @a $r0\n" ],
    [ "a=b*-c--", false,  undefined, true, "CLR @a\nSUB @a $c\nMUL @a $b\nDEC @c\n" ],
    [ "a=-b--*c", false,  undefined, true, "CLR @a\nSUB @a $b\nSET @r0 $c\nMUL @r0 $a\nSET @a $r0\nDEC @b\n" ],
    [ "a/=b*-c--", false,  undefined, true, "CLR @r0\nSUB @r0 $c\nMUL @r0 $b\nDIV @a $r0\nDEC @c\n" ],

    [ "a+b=c",  true,  undefined, true, "" ],
    [ "a-b=c",  true,  undefined, true, "" ],
    [ "a*b=c",  true,  undefined, true, "" ],
    [ "a&b=c",  true,  undefined, true, "" ],
    [ "a=b*/c",  true,  undefined, true, "" ],

// NewCodeLine
    [ "NewCodeLine", "div" ],
    [ "a=b,c=d",    false,  undefined, true, "SET @a $b\nSET @c $d\n" ],
    [ "a=b,c=d,e=f",    false,  undefined, true, "SET @a $b\nSET @c $d\nSET @e $f\n" ],
    [ "a=b++,c=b",    false,  undefined, true, "SET @a $b\nINC @b\nSET @c $b\n" ],
    [ "a=b++,c=b++,d=b",    false,  undefined, true, "SET @a $b\nINC @b\nSET @c $b\nINC @b\nSET @d $b\n" ],
    [ "a=b\nc=d",    false,  undefined, true, "SET @a $b\nSET @c $d\n" ],
    [ "a+=1/2,a+=1/2,a+=1/2,a+=1/2",    false,  undefined, true, "SET @r0 #0000000000000001\nSET @r1 #0000000000000002\nDIV @r0 $r1\nADD @a $r0\nSET @r0 #0000000000000001\nSET @r1 #0000000000000002\nDIV @r0 $r1\nADD @a $r0\nSET @r0 #0000000000000001\nSET @r1 #0000000000000002\nDIV @r0 $r1\nADD @a $r0\nSET @r0 #0000000000000001\nSET @r1 #0000000000000002\nDIV @r0 $r1\nADD @a $r0\n" ],
    [ ",",    false,  undefined, true, "" ],
    [ ",,,,",    false,  undefined, true, "" ],
    [ "a=b\n\nc=d",    false,  undefined, true, "SET @a $b\nSET @c $d\n" ],

    [ "a=,b",  true,  undefined, true, "" ],

// Array
   // Arr+ Assignment, Arr+ SetOperator, 
    [ "Array", "div" ],
    [ "a[b]=c",    false,  undefined, true, "SET @($a + $b) $c\n" ],
    [ "a[0]=b",    false,  undefined, true, "SET @($a) $b\n" ],
    [ "a[2]=b",    false,  undefined, true, "SET @r0 #0000000000000002\nSET @($a + $r0) $b\n" ],
    [ "a=b[c]",    false,  undefined, true, "SET @a $($b + $c)\n" ],
    [ "a=b[0]",    false,  undefined, true, "SET @a $($b)\n" ],
    [ "a=b[3]",    false,  undefined, true, "SET @a #0000000000000003\nSET @a $($b + $a)\n" ],
    [ "a[b]=c[d]",  false,  undefined, true, "SET @r0 $($c + $d)\nSET @($a + $b) $r0\n" ],
    [ "a[b]+=c",    false,  undefined, true, "SET @r0 $($a + $b)\nADD @r0 $c\nSET @($a + $b) $r0\n" ],
    [ "a[0]-=b",    false,  undefined, true, "SET @r0 $($a)\nSUB @r0 $b\nSET @($a) $r0\n" ],
    [ "a[2]*=b",    false,  undefined, true, "SET @r0 #0000000000000002\nSET @r1 $($a + $r0)\nMUL @r1 $b\nSET @($a + $r0) $r1\n" ],
    [ "a/=b[c]",    false,  undefined, true, "SET @r0 $($b + $c)\nDIV @a $r0\n" ],
    [ "a&=b[0]",    false,  undefined, true, "SET @r0 $($b)\nAND @a $r0\n" ],
    [ "a^=b[3]",    false,  undefined, true, "SET @r0 #0000000000000003\nSET @r1 $($b + $r0)\nXOR @a $r1\n" ],
    [ "a[b]+=c[d]", false,  undefined, true, "SET @r0 $($c + $d)\nSET @r1 $($a + $b)\nADD @r1 $r0\nSET @($a + $b) $r1\n" ],
   // Arr+ Constant, Arr+ Operator
    [ "a[b]=2",     false,  undefined, true, "SET @r0 #0000000000000002\nSET @($a + $b) $r0\n" ],
    [ "a[0]=0xFF",   false,  undefined, true, "SET @r0 #00000000000000ff\nSET @($a) $r0\n" ],
    [ "a[2]=\"Ho ho\"", false,  undefined, true, "SET @r0 #0000000000000002\nSET @r1 #0000006f68206f48\nSET @($a + $r0) $r1\n" ],
    [ "a=b[c]/b[d]", false,  undefined, true, "SET @a $($b + $c)\nSET @r0 $($b + $d)\nDIV @a $r0\n" ],
    [ "a=b[c]<<b[2]",false,  undefined, true, "SET @a #0000000000000002\nSET @r0 $($b + $c)\nSET @r1 $($b + $a)\nSHL @r0 $r1\nSET @a $r0\n" ],
   // Arr+ UnaryOperator, Arr+ SetUnaryOperator
    [ "a=b[~c]",    false,  undefined, true, "SET @a $c\nNOT @a\nSET @a $($b + $a)\n" ],
    [ "a=~b[c]",    false,  undefined, true, "SET @a $($b + $c)\nNOT @a\n" ],
    [ "a=b[c]++",  true,  undefined, true, "" ],
    [ "a=b++[c]",  true,  undefined, true, "" ],
    [ "a=--b[c]",  true,  undefined, true, "" ],
   // Arr+ CheckOperator(Unary), Arr+ CheckOperator(Binary)
    [ "a=-b[c]",    false,  undefined, true, "CLR @a\nSET @r0 $($b + $c)\nSUB @a $r0\n" ],
    [ "a=+b[c]",    false,  undefined, true, "SET @a $($b + $c)\n" ],
    [ "a=b[-c]",    false,  undefined, true, "CLR @a\nSUB @a $c\nSET @a $($b + $a)\n" ],
    [ "a=b[+c]",    false,  undefined, true, "SET @a $($b + $c)\n" ],
    [ "a=b[*c]",    false,  undefined, true, "SET @a $($c)\nSET @a $($b + $a)\n" ],
    [ "a=b[c]-d[e]", false,  undefined, true, "SET @a $($b + $c)\nSET @r0 $($d + $e)\nSUB @a $r0\n" ],
    [ "a=b[c]+d[e]", false,  undefined, true, "SET @a $($d + $e)\nSET @r0 $($b + $c)\nADD @a $r0\n" ],
    [ "a=b[c]*d[e]", false,  undefined, true, "SET @a $($d + $e)\nSET @r0 $($b + $c)\nMUL @a $r0\n" ],
    [ "a=b[c]&d[e]", false,  undefined, true, "SET @a $($d + $e)\nSET @r0 $($b + $c)\nAND @a $r0\n" ],
    [ "a=b[c-d]",    false,  undefined, true, "SET @a $c\nSUB @a $d\nSET @a $($b + $a)\n" ],
    [ "a=b[c+d]",    false,  undefined, true, "SET @a $d\nADD @a $c\nSET @a $($b + $a)\n" ],
    [ "a=b[c*d]",    false,  undefined, true, "SET @a $d\nMUL @a $c\nSET @a $($b + $a)\n" ],
    [ "a=b[c&d]",    false,  undefined, true, "SET @a $d\nAND @a $c\nSET @a $($b + $a)\n" ],
    [ "a=*b[c]",  true,  undefined, true, "" ],
    [ "a=&b[c]",  true,  undefined, true, "" ],
    [ "a=b[&c]",  true,  undefined, true, "" ],
   // Arr+ NewCodeLine
    [ "a[2]=b,c[2]*=d,e[2]+=f",    false,  undefined, true, "SET @r0 #0000000000000002\nSET @($a + $r0) $b\nSET @r0 #0000000000000002\nSET @r1 $($c + $r0)\nMUL @r1 $d\nSET @($c + $r0) $r1\nSET @r0 #0000000000000002\nSET @r1 $($e + $r0)\nADD @r1 $f\nSET @($e + $r0) $r1\n" ],
    [ "a=b[c],d[0]=e",    false,  undefined, true, "SET @a $($b + $c)\nSET @($d) $e\n" ],

// CodeCave
    [ "CodeCave", "div" ],
    [ "a=(b)",     false,  undefined, true, "SET @a $b\n" ],
    [ "a*=(b)",    false,  undefined, true, "MUL @a $b\n" ],
    [ "a=(2)",     false,  undefined, true, "SET @a #0000000000000002\n" ],
    [ "a=*(b)",     false,  undefined, true, "SET @a $($b)\n" ],
    [ "a=*(b+c)",     false,  undefined, true, "SET @a $c\nADD @a $b\nSET @a $($a)\n" ],
    [ "*(a+1)=b",   false,  undefined, true, "SET @r0 #0000000000000001\nADD @r0 $a\nSET @($r0) $b\n" ],
    [ "a=(b*c)*d",  false,  undefined, true, "SET @a $c\nMUL @a $b\nSET @r0 $d\nMUL @r0 $a\nSET @a $r0\n" ],
    [ "a=(b/c)/d",  false,  undefined, true, "SET @a $b\nDIV @a $c\nDIV @a $d\n" ],
    [ "a=~(0xFF<<8)",false,  undefined, true, "SET @a #00000000000000ff\nSET @r0 #0000000000000008\nSHL @a $r0\nNOT @a\n" ],
    [ "a=~(b/c)/d", false,  undefined, true, "SET @a $b\nDIV @a $c\nNOT @a\nDIV @a $d\n" ],
    [ "a=(b/c)/~d", false,  undefined, true, "SET @a $b\nDIV @a $c\nSET @r0 $d\nNOT @r0\nDIV @a $r0\n" ],
    [ "a=~(b/c/d)", false,  undefined, true, "SET @a $c\nDIV @a $d\nSET @r0 $b\nDIV @r0 $a\nNOT @r0\nSET @a $r0\n" ],
    [ "a=(b+c)*(d+e)",    false,  undefined, true, "SET @a $e\nADD @a $d\nSET @r0 $c\nADD @r0 $b\nMUL @a $r0\n" ],
    [ "a=(b+c)/(d+e)",  false,  undefined, true, "SET @a $c\nADD @a $b\nSET @r0 $e\nADD @r0 $d\nDIV @a $r0\n" ],
    [ "a%=1-((b+c)*(d+e))",  false,  undefined, true, "SET @r0 $e\nADD @r0 $d\nSET @r1 $c\nADD @r1 $b\nMUL @r0 $r1\nSET @r1 #0000000000000001\nSUB @r1 $r0\nMOD @a $r1\n" ],

    [ "a=--(b)",  true,  undefined, true, "" ],
    [ "a=(b+c)++",  true,  undefined, true, "" ],
    [ "a=(b)[c]",  true,  undefined, true, "" ],

//Arithmetic + comparisions
    [ "Arithmetic + comparisions", "div" ],
    [ "z=a==b",  false,  undefined, true, "BNE $a $b :__CMP_A_sF\nSET @z #0000000000000001\nJMP :__CMP_A_end\n__CMP_A_sF:\nCLR @z\n__CMP_A_end:\n" ],
    [ "z=a!=b",  false,  undefined, true, "BEQ $a $b :__CMP_A_sF\nSET @z #0000000000000001\nJMP :__CMP_A_end\n__CMP_A_sF:\nCLR @z\n__CMP_A_end:\n" ],
    [ "z=2<=b",  false,  undefined, true, "SET @z #0000000000000002\nBGT $z $b :__CMP_A_sF\nSET @z #0000000000000001\nJMP :__CMP_A_end\n__CMP_A_sF:\nCLR @z\n__CMP_A_end:\n" ],
    [ "z=a<2",   false,  undefined, true, "SET @z #0000000000000002\nBGE $a $z :__CMP_A_sF\nSET @z #0000000000000001\nJMP :__CMP_A_end\n__CMP_A_sF:\nCLR @z\n__CMP_A_end:\n" ],
    [ "z=a>=b",  false,  undefined, true, "BLT $a $b :__CMP_A_sF\nSET @z #0000000000000001\nJMP :__CMP_A_end\n__CMP_A_sF:\nCLR @z\n__CMP_A_end:\n" ],
    [ "z=a>b",   false,  undefined, true, "BLE $a $b :__CMP_A_sF\nSET @z #0000000000000001\nJMP :__CMP_A_end\n__CMP_A_sF:\nCLR @z\n__CMP_A_end:\n" ],
    [ "z=!a",    false,  undefined, true, "BNZ $a :__NOT_A_sF\nSET @z #0000000000000001\nJMP :__NOT_A_end\n__NOT_A_sF:\nCLR @z\n__NOT_A_end:\n" ],
    [ "z=!!a",    false,  undefined, true, "BZR $a :__NOT_A_sF\nSET @z #0000000000000001\nJMP :__NOT_A_end\n__NOT_A_sF:\nCLR @z\n__NOT_A_end:\n" ],
    [ "z=a&&b",  false,  undefined, true, "BZR $a :__CMP_A_sF\nBZR $b :__CMP_A_sF\nSET @z #0000000000000001\nJMP :__CMP_A_end\n__CMP_A_sF:\nCLR @z\n__CMP_A_end:\n" ],
    [ "z=a||b",  false,  undefined, true, "BNZ $a :__CMP_A_sT\nBNZ $b :__CMP_A_sT\nCLR @z\nJMP :__CMP_A_end\n__CMP_A_sT:\nSET @z #0000000000000001\n__CMP_A_end:\n" ],
    [ "a=2+b==c",  false,  undefined, true, "SET @a $b\nSET @r0 #0000000000000002\nADD @a $r0\nBNE $a $c :__CMP_A_sF\nSET @a #0000000000000001\nJMP :__CMP_A_end\n__CMP_A_sF:\nCLR @a\n__CMP_A_end:\n" ],
    [ "a=2+(b==c)",  false,  undefined, true, "BNE $b $c :__CMP_A_sF\nSET @a #0000000000000001\nJMP :__CMP_A_end\n__CMP_A_sF:\nCLR @a\n__CMP_A_end:\nSET @r0 #0000000000000002\nADD @a $r0\n" ],
    [ "a=b==~c",  false,  undefined, true, "SET @a $c\nNOT @a\nBNE $b $a :__CMP_A_sF\nSET @a #0000000000000001\nJMP :__CMP_A_end\n__CMP_A_sF:\nCLR @a\n__CMP_A_end:\n" ],
    [ "a=b==!c",  false,  undefined, true, "BNZ $c :__NOT_B_sF\nSET @a #0000000000000001\nJMP :__NOT_B_end\n__NOT_B_sF:\nCLR @a\n__NOT_B_end:\nBNE $b $a :__CMP_A_sF\nSET @a #0000000000000001\nJMP :__CMP_A_end\n__CMP_A_sF:\nCLR @a\n__CMP_A_end:\n" ],
    [ "a=!b==c",  false,  undefined, true, "BNZ $b :__NOT_B_sF\nSET @a #0000000000000001\nJMP :__NOT_B_end\n__NOT_B_sF:\nCLR @a\n__NOT_B_end:\nBNE $a $c :__CMP_A_sF\nSET @a #0000000000000001\nJMP :__CMP_A_end\n__CMP_A_sF:\nCLR @a\n__CMP_A_end:\n" ],
    [ "a=!b==!c",  false,  undefined, true, "BNZ $b :__NOT_B_sF\nSET @a #0000000000000001\nJMP :__NOT_B_end\n__NOT_B_sF:\nCLR @a\n__NOT_B_end:\nBNZ $c :__NOT_C_sF\nSET @r0 #0000000000000001\nJMP :__NOT_C_end\n__NOT_C_sF:\nCLR @r0\n__NOT_C_end:\nBNE $a $r0 :__CMP_A_sF\nSET @a #0000000000000001\nJMP :__CMP_A_end\n__CMP_A_sF:\nCLR @a\n__CMP_A_end:\n" ],
    [ "a=!(b+c)",  false,  undefined, true, "SET @a $c\nADD @a $b\nBNZ $a :__NOT_A_sF\nSET @a #0000000000000001\nJMP :__NOT_A_end\n__NOT_A_sF:\nCLR @a\n__NOT_A_end:\n" ],
    [ "a=!(b==c)",  false,  undefined, true, "BEQ $b $c :__NOT_A_sF\nSET @a #0000000000000001\nJMP :__NOT_A_end\n__NOT_A_sF:\nCLR @a\n__NOT_A_end:\n" ],
    [ "a=!(b==c)==d",  false,  undefined, true, "BEQ $b $c :__NOT_B_sF\nSET @a #0000000000000001\nJMP :__NOT_B_end\n__NOT_B_sF:\nCLR @a\n__NOT_B_end:\nBNE $a $d :__CMP_A_sF\nSET @a #0000000000000001\nJMP :__CMP_A_end\n__CMP_A_sF:\nCLR @a\n__CMP_A_end:\n" ],
    [ "z=1+((a&&b)||(c&&d))",  false,  undefined, true, "BZR $a :__OR_B_next\nBZR $b :__OR_B_next\nJMP :__CMP_A_sT\n__OR_B_next:\nBZR $c :__CMP_A_sF\nBZR $d :__CMP_A_sF\nJMP :__CMP_A_sT\n__CMP_A_sF:\nCLR @z\nJMP :__CMP_A_end\n__CMP_A_sT:\nSET @z #0000000000000001\n__CMP_A_end:\nSET @r0 #0000000000000001\nADD @z $r0\n" ],
    [ "z=1+!((a&&b)||(c&&d))",  false,  undefined, true, "BZR $a :__OR_B_next\nBZR $b :__OR_B_next\nJMP :__NOT_A_sF\n__OR_B_next:\nBZR $c :__NOT_A_sT\nBZR $d :__NOT_A_sT\nJMP :__NOT_A_sF\n__NOT_A_sT:\nSET @z #0000000000000001\nJMP :__NOT_A_end\n__NOT_A_sF:\nCLR @z\n__NOT_A_end:\nSET @r0 #0000000000000001\nADD @z $r0\n" ],
    [ "a=b+(++c==d++)",  false,  undefined, true, "INC @c\nBNE $c $d :__CMP_A_sF\nSET @a #0000000000000001\nJMP :__CMP_A_end\n__CMP_A_sF:\nCLR @a\n__CMP_A_end:\nADD @a $b\nINC @d\n" ],
    [ "a=b+(++c&&d++)",  true,  undefined, true, "" ],
    [ "z=1+((a||b)&&(c||d))",  false,  undefined, true, "BNZ $a :__AND_B_next\nBNZ $b :__AND_B_next\nJMP :__CMP_A_sF\n__AND_B_next:\nBNZ $c :__CMP_A_sT\nBNZ $d :__CMP_A_sT\nJMP :__CMP_A_sF\n__CMP_A_sT:\nSET @z #0000000000000001\nJMP :__CMP_A_end\n__CMP_A_sF:\nCLR @z\n__CMP_A_end:\nSET @r0 #0000000000000001\nADD @z $r0\n" ],
    [ "z=1+!((a||b)&&(c||d))",  false,  undefined, true, "BNZ $a :__AND_B_next\nBNZ $b :__AND_B_next\nJMP :__NOT_A_sT\n__AND_B_next:\nBNZ $c :__NOT_A_sF\nBNZ $d :__NOT_A_sF\n__NOT_A_sT:\nSET @z #0000000000000001\nJMP :__NOT_A_end\n__NOT_A_sF:\nCLR @z\n__NOT_A_end:\nSET @r0 #0000000000000001\nADD @z $r0\n" ],

    [ "a==b",  true,  undefined, true, "" ],
    [ "a!=b",  true,  undefined, true, "" ],
    [ "2<=b",  true,  undefined, true, "" ],
    [ "a<2",   true,  undefined, true, "" ],
    [ "a>=b",  true,  undefined, true, "" ],
    [ "a>b",   true,  undefined, true, "" ],
    [ "!a",  true,  undefined, true, "" ],
    [ "a&&b",  true,  undefined, true, "" ],
    [ "a||b",  true,  undefined, true, "" ],


// Optimizations
    [ "Optimizations", "div" ],
    [ "a=a+\"0\"",    false,  undefined, true, "SET @r0 #0000000000000030\nADD @a $r0\n" ],
    [ "a=\"0\"+a",    false,  undefined, true, "SET @r0 $a\nSET @r1 #0000000000000030\nADD @r0 $r1\nSET @a $r0\n" ],
    [ "a=b/a",    false,  undefined, true, "SET @r0 $b\nDIV @r0 $a\nSET @a $r0\n" ],
    [ "a=1+(b/(c/a))",    false,  undefined, true, "SET @r0 $c\nDIV @r0 $a\nSET @r1 $b\nDIV @r1 $r0\nSET @r0 #0000000000000001\nADD @r1 $r0\nSET @a $r1\n" ],

// MISC 
    [ "MISC", "div" ],
    [ "a=~-*b",    false,  undefined, true, "CLR @a\nSET @r0 $($b)\nSUB @a $r0\nNOT @a\n" ],
    [ "a=~-~-*b",    false,  undefined, true, "CLR @a\nSET @r0 $($b)\nSUB @a $r0\nNOT @a\nCLR @r0\nSUB @r0 $a\nNOT @r0\nSET @a $r0\n" ],
    [ "a=~-~-*b+1",    false,  undefined, true, "CLR @a\nSET @r0 $($b)\nSUB @a $r0\nNOT @a\nCLR @r0\nSUB @r0 $a\nNOT @r0\nSET @a #0000000000000001\nADD @a $r0\n" ],
    [ "a=b+c/d-e",    false,  undefined, true, "SET @a $c\nDIV @a $d\nSUB @a $e\nADD @a $b\n" ],
    [ "a=b<<c+d<<e",    false,  undefined, true, "SET @a $d\nADD @a $c\nSHL @a $e\nSET @r0 $b\nSHL @r0 $a\nSET @a $r0\n" ],
    [ "a=b&c<<d^e",    false,  undefined, true, "SET @a $c\nSHL @a $d\nSET @r0 $e\nXOR @r0 $a\nAND @r0 $b\nSET @a $r0\n" ],

    [ "a=b%(1+*b[c])",   true,  undefined, true, "" ],


//Error Tests
// Variable
    [ "Error tests", "div" ],
    [ "a", true,  undefined, true, "" ],
    [ "2", true,  undefined, true, "" ],
    [ "a|b", true,  undefined, true, "" ],
    [ "a|b=c", true,  undefined, true, "" ],
    [ "a/b",   true,  undefined, true, "" ],
    [ "-a=b",  true,  undefined, true, "" ],
    [ "+a=b",  true,  undefined, true, "" ],
    [ "&a=b",  true,  undefined, true, "" ],
    [ "a,b",   true,  undefined, true, "" ],

    ];



var logical_tests = [

//    stmt,   expError?, jumpTarget, disableRandom, Expected Output

    [ "Void test", "div" ],

    [ "",    true,   "__if25_endif", true,  "" ],

    [ "One Operation", "div" ],

// Variable
    [ "a",    false,   "__if25_endif", true,  "BZR $a :__if25_endif\n" ],

// Constant
    [ "0",    false,   "__if25_endif", true,  "JMP :__if25_endif\n" ],
    [ "1",    false,   "__if25_endif", true,  "" ],
    [ "10",    false,   "__if25_endif", true,  "" ],

// Operator
    [ "a/2", false,   "__if25_endif", true,  "SET @r0 $a\nSET @r1 #0000000000000002\nDIV @r0 $r1\nBZR $r0 :__if25_endif\n" ],
    [ "a%2", false,   "__if25_endif", true,  "SET @r0 $a\nSET @r1 #0000000000000002\nMOD @r0 $r1\nBZR $r0 :__if25_endif\n" ],
    [ "a<<2", false,   "__if25_endif", true,  "SET @r0 $a\nSET @r1 #0000000000000002\nSHL @r0 $r1\nBZR $r0 :__if25_endif\n" ],
    [ "a>>2", false,   "__if25_endif", true,  "SET @r0 $a\nSET @r1 #0000000000000002\nSHR @r0 $r1\nBZR $r0 :__if25_endif\n" ],
    [ "a|2", false,   "__if25_endif", true,  "SET @r0 #0000000000000002\nBOR @r0 $a\nBZR $r0 :__if25_endif\n" ],
    [ "a^2", false,   "__if25_endif", true,  "SET @r0 #0000000000000002\nXOR @r0 $a\nBZR $r0 :__if25_endif\n" ],

//UnaryOperator
    [ "!a",    false,   "__if25_endif", true,  "BNZ $a :__if25_endif\n" ],
    [ "~a",    false,   "__if25_endif", true,  "SET @r0 $a\nNOT @r0\nBZR $r0 :__if25_endif\n" ],

//SetUnaryOperators
    [ "++a", true,   "__if25_endif", true,  "" ],
    [ "a++", true,   "__if25_endif", true,  "" ],

//Assignment SetOperator
    [ "a=b", true,   "__if25_endif", true,  "" ],
    [ "a+=b", true,   "__if25_endif", true,  "" ],

// Comparision
    [ "a==b",  false,   "__if25_endif", true,  "BNE $a $b :__if25_endif\n" ],
    [ "a!=b",  false,   "__if25_endif", true,  "BEQ $a $b :__if25_endif\n" ],
    [ "a>=b",  false,   "__if25_endif", true,  "BLT $a $b :__if25_endif\n" ],
    [ "a>b",   false,   "__if25_endif", true,  "BLE $a $b :__if25_endif\n" ],
    [ "a<=b",  false,   "__if25_endif", true,  "BGT $a $b :__if25_endif\n" ],
    [ "a<b",   false,   "__if25_endif", true,  "BGE $a $b :__if25_endif\n" ],
    [ "a==0",  false,   "__if25_endif", true,  "BNZ $a :__if25_endif\n" ],
    [ "a!=0",  false,   "__if25_endif", true,  "BZR $a :__if25_endif\n" ],
    [ "a&&b",  false,   "__if25_endif", true,  "BZR $a :__if25_endif\nBZR $b :__if25_endif\n" ],
    [ "a||b",  false,   "__if25_endif", true,  "BNZ $a :__if25_start\nBNZ $b :__if25_start\nJMP :__if25_endif\n__if25_start:\n" ],
    [ "a==b&&c==d",false,   "__if25_endif", true,  "BNE $a $b :__if25_endif\nBNE $c $d :__if25_endif\n" ],
    [ "a==b||c==d", false,   "__if25_endif", true,  "BEQ $a $b :__if25_start\nBEQ $c $d :__if25_start\nJMP :__if25_endif\n__if25_start:\n" ],

//Arr
    [ "a[b]", false,   "__if25_endif", true,  "SET @r0 $($a + $b)\nBZR $r0 :__if25_endif\n" ],

//CheckOperator Unary
    [ "+a", false,   "__if25_endif", true,  "BZR $a :__if25_endif\n" ],
    [ "*a", false,   "__if25_endif", true,  "SET @r0 $($a)\nBZR $r0 :__if25_endif\n" ],
    [ "-a", false,   "__if25_endif", true,  "CLR @r0\nSUB @r0 $a\nBZR $r0 :__if25_endif\n" ],
    [ "~a", false,   "__if25_endif", true,  "SET @r0 $a\nNOT @r0\nBZR $r0 :__if25_endif\n" ],
    [ "&a", true,   "__if25_endif", true,  "" ],

//CheckOperator Binary
    [ "b+a", false,   "__if25_endif", true,  "SET @r0 $a\nADD @r0 $b\nBZR $r0 :__if25_endif\n" ],
    [ "b*a", false,   "__if25_endif", true,  "SET @r0 $a\nMUL @r0 $b\nBZR $r0 :__if25_endif\n" ],
    [ "b-a", false,   "__if25_endif", true,  "SET @r0 $b\nSUB @r0 $a\nBZR $r0 :__if25_endif\n" ],
    [ "b&a", false,   "__if25_endif", true,  "SET @r0 $a\nAND @r0 $b\nBZR $r0 :__if25_endif\n" ],

//NewCodeLine
    [ ",", true,   "__if25_endif", true,  "" ],
    [ "a,", true,   "__if25_endif", true,  "" ],




//Combinations Logical NOT

    [ "Combinations with NOT", "div" ],

// Variable
    [ "!a",    false,   "__if25_endif", true,  "BNZ $a :__if25_endif\n" ],

// Constant
    [ "!0",    false,   "__if25_endif", true,  "" ],
    [ "!1",    false,   "__if25_endif", true,  "JMP :__if25_endif\n" ],
    [ "!10",    false,   "__if25_endif", true,  "JMP :__if25_endif\n" ],

// Operator
    [ "!(a/2)", false,   "__if25_endif", true,  "SET @r0 $a\nSET @r1 #0000000000000002\nDIV @r0 $r1\nBNZ $r0 :__if25_endif\n" ],
    [ "!(a%2)", false,   "__if25_endif", true,  "SET @r0 $a\nSET @r1 #0000000000000002\nMOD @r0 $r1\nBNZ $r0 :__if25_endif\n" ],
    [ "!(a<<2)", false,   "__if25_endif", true,   "SET @r0 $a\nSET @r1 #0000000000000002\nSHL @r0 $r1\nBNZ $r0 :__if25_endif\n" ],
    [ "!(a>>2)", false,   "__if25_endif", true,   "SET @r0 $a\nSET @r1 #0000000000000002\nSHR @r0 $r1\nBNZ $r0 :__if25_endif\n" ],
    [ "!(a|2)", false,   "__if25_endif", true,   "SET @r0 #0000000000000002\nBOR @r0 $a\nBNZ $r0 :__if25_endif\n" ],
    [ "!(a^2)", false,   "__if25_endif", true,  "SET @r0 #0000000000000002\nXOR @r0 $a\nBNZ $r0 :__if25_endif\n" ],

//UnaryOperator
    [ "!!a",    false,   "__if25_endif", true,  "BZR $a :__if25_endif\n" ],
    [ "!~a",    false,   "__if25_endif", true,  "SET @r0 $a\nNOT @r0\nBNZ $r0 :__if25_endif\n" ],

// Comparision
    [ "!(a==b)",  false,   "__if25_endif", true,  "BEQ $a $b :__if25_endif\n" ],
    [ "!(a!=b)",  false,   "__if25_endif", true,  "BNE $a $b :__if25_endif\n" ],
    [ "!(a>=b)",  false,   "__if25_endif", true,  "BGE $a $b :__if25_endif\n" ],
    [ "!(a>b)",   false,   "__if25_endif", true,  "BGT $a $b :__if25_endif\n" ],
    [ "!(a<=b)",  false,   "__if25_endif", true,  "BLE $a $b :__if25_endif\n" ],
    [ "!(a<b)",   false,   "__if25_endif", true,  "BLT $a $b :__if25_endif\n" ],
    [ "!(a==0)",  false,   "__if25_endif", true,  "BZR $a :__if25_endif\n" ],
    [ "!(a!=0)",  false,   "__if25_endif", true,  "BNZ $a :__if25_endif\n" ],
    [ "!(a&&b)",  false,   "__if25_endif", true,  "BZR $a :__if25_start\nBZR $b :__if25_start\nJMP :__if25_endif\n__if25_start:\n" ],
    [ "!(a||b)",  false,   "__if25_endif", true,  "BNZ $a :__if25_endif\nBNZ $b :__if25_endif\n" ],
    [ "!(a==b&&c==d)",false,   "__if25_endif", true,  "BNE $a $b :__if25_start\nBNE $c $d :__if25_start\nJMP :__if25_endif\n__if25_start:\n" ],
    [ "!(a==b||c==d)", false,   "__if25_endif", true,  "BEQ $a $b :__if25_endif\nBEQ $c $d :__if25_endif\n" ],

//Arr
    [ "!(a[b])", false,   "__if25_endif", true,  "SET @r0 $($a + $b)\nBNZ $r0 :__if25_endif\n" ],
    [ "!a[b]", false,   "__if25_endif", true,  "SET @r0 $($a + $b)\nBNZ $r0 :__if25_endif\n" ],

//CheckOperator Unary
    [ "!(+a)", false,   "__if25_endif", true,  "BNZ $a :__if25_endif\n" ],
    [ "!(*a)", false,   "__if25_endif", true,  "SET @r0 $($a)\nBNZ $r0 :__if25_endif\n" ],
    [ "!(-a)", false,   "__if25_endif", true,  "CLR @r0\nSUB @r0 $a\nBNZ $r0 :__if25_endif\n" ],
    [ "!(~a)", false,   "__if25_endif", true,  "SET @r0 $a\nNOT @r0\nBNZ $r0 :__if25_endif\n" ],
    [ "!(&a)", true,   "__if25_endif", true,  "" ],

//CheckOperator Binary
    [ "!(b+a)", false,   "__if25_endif", true,  "SET @r0 $a\nADD @r0 $b\nBNZ $r0 :__if25_endif\n" ],
    [ "!(b*a)", false,   "__if25_endif", true,  "SET @r0 $a\nMUL @r0 $b\nBNZ $r0 :__if25_endif\n" ],
    [ "!(b-a)", false,   "__if25_endif", true,  "SET @r0 $b\nSUB @r0 $a\nBNZ $r0 :__if25_endif\n" ],
    [ "!(b&a)", false,   "__if25_endif", true,  "SET @r0 $a\nAND @r0 $b\nBNZ $r0 :__if25_endif\n" ],

//Combinations trying to break algorithm
    [ "Misc combinations", "div" ],
    [ "a==b&&!(c==d)", false,   "__if25_endif", true,  "BNE $a $b :__if25_endif\nBEQ $c $d :__if25_endif\n" ],
    [ "!(a==b)&&c==d", false,   "__if25_endif", true,  "BEQ $a $b :__if25_endif\nBNE $c $d :__if25_endif\n" ],
    [ "a==b==c", false,   "__if25_endif", true,  "BNE $b $c :__CMP_A_sF\nSET @r0 #0000000000000001\nJMP :__CMP_A_end\n__CMP_A_sF:\nCLR @r0\n__CMP_A_end:\nBNE $a $r0 :__if25_endif\n" ],
    [ "(a==b)==c", false,   "__if25_endif", true,  "BNE $a $b :__CMP_A_sF\nSET @r0 #0000000000000001\nJMP :__CMP_A_end\n__CMP_A_sF:\nCLR @r0\n__CMP_A_end:\nBNE $r0 $c :__if25_endif\n" ],
    [ "a==b&&c==d&&e==f&&g==h", false,   "__if25_endif", true,  "BNE $a $b :__if25_endif\nBNE $c $d :__if25_endif\nBNE $e $f :__if25_endif\nBNE $g $h :__if25_endif\n" ],
    [ "a==b||c==d||e==f||g==h", false,   "__if25_endif", true,  "BEQ $a $b :__if25_start\nBEQ $c $d :__if25_start\nBEQ $e $f :__if25_start\nBEQ $g $h :__if25_start\nJMP :__if25_endif\n__if25_start:\n" ],
    [ "(a==b||c==d)&&(e==f||g==h)", false,   "__if25_endif", true,  "BEQ $a $b :__AND_A_next\nBEQ $c $d :__AND_A_next\nJMP :__if25_endif\n__AND_A_next:\nBEQ $e $f :__if25_start\nBEQ $g $h :__if25_start\nJMP :__if25_endif\n__if25_start:\n" ],
    [ "(a==b && c==d) || (e==f && g==h)", false,   "__if25_endif", true,  "BNE $a $b :__OR_A_next\nBNE $c $d :__OR_A_next\nJMP :__if25_start\n__OR_A_next:\nBNE $e $f :__if25_endif\nBNE $g $h :__if25_endif\n__if25_start:\n" ],
    [ "(a>=b && c>=d) || (e!=f && g!=h)", false,   "__if25_endif", true,  "BLT $a $b :__OR_A_next\nBLT $c $d :__OR_A_next\nJMP :__if25_start\n__OR_A_next:\nBEQ $e $f :__if25_endif\nBEQ $g $h :__if25_endif\n__if25_start:\n" ],
    [ "(a>=b&&c>=d)||!(e==f&&g==h)", false,   "__if25_endif", true,  "BLT $a $b :__OR_A_next\nBLT $c $d :__OR_A_next\nJMP :__if25_start\n__OR_A_next:\nBNE $e $f :__if25_start\nBNE $g $h :__if25_start\nJMP :__if25_endif\n__if25_start:\n" ],
    [ "(a<=b||c<d)&&!(e==f||g==h)", false,   "__if25_endif", true,  "BLE $a $b :__AND_A_next\nBLT $c $d :__AND_A_next\nJMP :__if25_endif\n__AND_A_next:\nBEQ $e $f :__if25_endif\nBEQ $g $h :__if25_endif\n" ],
    [ "!(a<=b||c<d)&&(e==f||g==h)", false,   "__if25_endif", true,  "BLE $a $b :__if25_endif\nBLT $c $d :__if25_endif\nBEQ $e $f :__if25_start\nBEQ $g $h :__if25_start\nJMP :__if25_endif\n__if25_start:\n" ],
    [ "a==~-b", false,   "__if25_endif", true,  "CLR @r0\nSUB @r0 $b\nNOT @r0\nBNE $a $r0 :__if25_endif\n" ],
    [ "a==!~-b", false,   "__if25_endif", true,  "CLR @r0\nSUB @r0 $b\nNOT @r0\nBNZ $r0 :__NOT_A_sF\nSET @r0 #0000000000000001\nJMP :__NOT_A_end\n__NOT_A_sF:\nCLR @r0\n__NOT_A_end:\nBNE $a $r0 :__if25_endif\n" ],
    [ "a||(b&&c&&d)||e", false,   "__if25_endif", true,  "BNZ $a :__if25_start\nBZR $b :__OR_B_next\nBZR $c :__OR_B_next\nBZR $d :__OR_B_next\nJMP :__if25_start\n__OR_B_next:\nBNZ $e :__if25_start\nJMP :__if25_endif\n__if25_start:\n" ],
    [ "a&&(b||c||d)&&e", false,   "__if25_endif", true,  "BZR $a :__if25_endif\nBNZ $b :__AND_B_next\nBNZ $c :__AND_B_next\nBNZ $d :__AND_B_next\nJMP :__if25_endif\n__AND_B_next:\nBZR $e :__if25_endif\n" ],
    [ "a||(b&&!c&&d)||e", false,   "__if25_endif", true,  "BNZ $a :__if25_start\nBZR $b :__OR_B_next\nBNZ $c :__OR_B_next\nBZR $d :__OR_B_next\nJMP :__if25_start\n__OR_B_next:\nBNZ $e :__if25_start\nJMP :__if25_endif\n__if25_start:\n" ],
    [ "a&&(b||!c||d)&&e", false,   "__if25_endif", true,  "BZR $a :__if25_endif\nBNZ $b :__AND_B_next\nBZR $c :__AND_B_next\nBNZ $d :__AND_B_next\nJMP :__if25_endif\n__AND_B_next:\nBZR $e :__if25_endif\n" ],
    [ "a==0&&(b==0||c==0&&d==0)&&e==0", false,   "__if25_endif", true,  "BNZ $a :__if25_endif\nBZR $b :__AND_B_next\nBNZ $c :__if25_endif\nBNZ $d :__if25_endif\n__AND_B_next:\nBNZ $e :__if25_endif\n" ],
    [ "!(!(!(a==b)))", false,   "__if25_endif", true,  "BEQ $a $b :__if25_endif\n" ],
    [ "!(!(!(!(a==b))))", false,   "__if25_endif", true,  "BNE $a $b :__if25_endif\n" ],
    [ "( ( (a==5 || b==z) && c==z) || d==z ) && a==25+b", false,   "__if25_endif", true,  "SET @r0 #0000000000000005\nBEQ $a $r0 :__AND_C_next\nBEQ $b $z :__AND_C_next\nJMP :__OR_B_next\n__AND_C_next:\nBNE $c $z :__OR_B_next\nJMP :__AND_A_next\n__OR_B_next:\nBEQ $d $z :__AND_A_next\nJMP :__if25_endif\n__AND_A_next:\nSET @r0 $b\nSET @r1 #0000000000000019\nADD @r0 $r1\nBNE $a $r0 :__if25_endif\n" ],
    [ "(a||b)&&(c||d) && (e||f)&&(g||h) ", false,   "__if25_endif", true,  "BNZ $a :__AND_A_next\nBNZ $b :__AND_A_next\nJMP :__if25_endif\n__AND_A_next:\nBNZ $c :__AND_C_next\nBNZ $d :__AND_C_next\nJMP :__if25_endif\n__AND_C_next:\nBNZ $e :__AND_E_next\nBNZ $f :__AND_E_next\nJMP :__if25_endif\n__AND_E_next:\nBNZ $g :__if25_start\nBNZ $h :__if25_start\nJMP :__if25_endif\n__if25_start:\n" ],
    [ "(a&&b)||(c&&d) || (e&&f)||(g&&h)", false,   "__if25_endif", true,  "BZR $a :__OR_A_next\nBZR $b :__OR_A_next\nJMP :__if25_start\n__OR_A_next:\nBZR $c :__OR_C_next\nBZR $d :__OR_C_next\nJMP :__if25_start\n__OR_C_next:\nBZR $e :__OR_E_next\nBZR $f :__OR_E_next\nJMP :__if25_start\n__OR_E_next:\nBZR $g :__if25_endif\nBZR $h :__if25_endif\n__if25_start:\n" ],
    [ "((a&&b)||(c&&d)) && ((e&&f)||(g&&h))", false,   "__if25_endif", true,  "BZR $a :__OR_B_next\nBZR $b :__OR_B_next\nJMP :__AND_A_next\n__OR_B_next:\nBZR $c :__if25_endif\nBZR $d :__if25_endif\n__AND_A_next:\nBZR $e :__OR_E_next\nBZR $f :__OR_E_next\nJMP :__if25_start\n__OR_E_next:\nBZR $g :__if25_endif\nBZR $h :__if25_endif\n__if25_start:\n" ],
    [ "!((a&&b)||(c&&d))", false,   "__if25_endif", true,  "BZR $a :__OR_A_next\nBZR $b :__OR_A_next\nJMP :__if25_endif\n__OR_A_next:\nBZR $c :__if25_start\nBZR $d :__if25_start\nJMP :__if25_endif\n__if25_start:\n" ],
    [ "!((a||b)&&(c||d))", false,   "__if25_endif", true,  "BNZ $a :__AND_A_next\nBNZ $b :__AND_A_next\nJMP :__if25_start\n__AND_A_next:\nBNZ $c :__if25_endif\nBNZ $d :__if25_endif\n__if25_start:\n" ],

    ];

    var code;
    var result="";

    result+="<h3>Arithmetic tests</h3>";
    for (var i=0; i<tests.length; i++) {
        try {
            if (tests[i][1] === "div") {
                result+="\n<h4>"+tests[i][0]+"</h4>";
                continue;
            }
            result+="<br>Test "+i+" ";
            code = codeGenerator(createSyntacticTree(verify(parser(tokenizer(tests[i][0])))), tests[i][2], tests[i][3] );
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

    result+="<h3>Logical tests</h3>";
    for (var i=0; i<logical_tests.length; i++) {
        try {
            if (logical_tests[i][1] === "div") {
                result+="\n<h4>"+logical_tests[i][0]+"</h4>";
                continue;
            }
            result+="<br>Test "+i+" ";
            code = codeGenerator(createSyntacticTree(verify(parser(tokenizer(logical_tests[i][0])))), logical_tests[i][2], logical_tests[i][3] );
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

    return result;
}
