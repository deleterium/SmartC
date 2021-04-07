"use strict";

// Author: Rui Deleterium
// Project:
// License:

function runTestCases() {

    function encodedStr(rawStr) {
        return rawStr.replace(/[\u00A0-\u9999<>\&]/g, function(i) {
            return '&#'+i.charCodeAt(0)+';';
        });
    }

    var tests = [
//   Input,  expectError?,    reuseAssignedVar,    returnTempVar,   expected output  )
// void test
    [ "",  false,  true, false, "" ],

// Assignment
    [ "a=b", false,  true, false, "SET @a $b\n" ],
    [ "a=", true,  true, false, "" ],
    [ "=a", true,  true, false, "" ],

// SetOperator
    [ "a+=b", false,  true, false, "ADD @a $b\n" ],
    [ "+=b", true,  true, false, "" ],
    [ "a+=", true,  true, false, "" ],


// Constant
    [ "a=2", false,  true, false, "SET @a #0000000000000002\n" ],
    [ "a=0xA", false,  true, false, "SET @a #000000000000000a\n" ],
    [ "a=0", false,  true, false, "CLR @a\n" ],
    [ "a+=2", false,  true, false, "SET @r0 #0000000000000002\nADD @a $r0\n" ],
    [ "a+=0xfffffff", false,  true, false, "SET @r0 #000000000fffffff\nADD @a $r0\n" ],
    [ "a=\"Hi there\"", false,  true, false, "SET @a #6572656874206948\n" ],
    [ "a=\"Hi there big\"", true,  true, false, "" ],
    [ "2=a", true,  true, false, "" ],
    
// Operator
    [ "a=b/c",  false,  true, false, "SET @a $b\nDIV @a $c\n" ],
    [ "a=b%c",  false,  true, false, "SET @a $b\nMOD @a $c\n" ],
    [ "a=b<<c", false,  true, false, "SET @a $b\nSHL @a $c\n" ],
    [ "a=b>>c", false,  true, false, "SET @a $b\nSHR @a $c\n" ],
    [ "a=b|c",  false,  true, false, "SET @a $c\nBOR @a $b\n" ],
    [ "a=b^c",  false,  true, false, "SET @a $c\nXOR @a $b\n" ],

// UnaryOperator
    [ "a=!b", true,  true, false, "" ],
    [ "a=~b",     false,  true, false, "SET @a $b\nNOT @a\n" ],
    [ "a^=~b",    false,  true, false, "SET @r0 $b\nNOT @r0\nXOR @a $r0\n" ],
    [ "a=~0xff",  false,  true, false, "SET @a #00000000000000ff\nNOT @a\n" ],
    [ "a>>=b^~c", false,  true, false, "SET @r0 $c\nNOT @r0\nXOR @r0 $b\nSHR @a $r0\n" ],
    [ "a=~~b",    false,  true, false, "SET @a $b\nNOT @a\nNOT @a\n" ],

    [ "a=~b/c",  false,  true, false, "SET @a $b\nNOT @a\nDIV @a $c\n" ],
    [ "a=~b/~c", false,  true, false, "SET @a $b\nNOT @a\nSET @r0 $c\nNOT @r0\nDIV @a $r0\n" ],
    [ "a=b/~c",  false,  true, false, "SET @a $c\nNOT @a\nSET @r0 $b\nDIV @r0 $a\nSET @a $r0\n" ],

    [ "~a=b", true,  true, false, "" ],

// SetUnaryOperator
    [ "a++", false,  true, false, "INC @a\n" ],
    [ "a--", false,  true, false, "DEC @a\n" ],
    [ "++a", false,  true, false, "INC @a\n" ],
    [ "--a", false,  true, false, "DEC @a\n" ],

    [ "a=b++/c",    false,  true, false, "SET @a $b\nDIV @a $c\nINC @b\n" ],
    [ "a=--b/c",    false,  true, false, "DEC @b\nSET @a $b\nDIV @a $c\n" ],
    [ "a=~--b",    false,  true, false, "DEC @b\nSET @a $b\nNOT @a\n" ],
    [ "a+=~b++",    false,  true, false, "SET @r0 $b\nNOT @r0\nADD @a $r0\nINC @b\n" ],
    [ "a=~b++",    false,  true, false, "SET @a $b\nNOT @a\nINC @b\n" ],

    [ "a++=2",true,  true, false, "" ],
    [ "a=2++",true,  true, false, "" ],
    [ "--",   true,  true, false, "" ],
    [ "2++",  true,  true, false, "" ],
    [ "a=b- -c",  true,  true, false, "" ],

// CheckOperator Unary
    [ "a=b", false,  true, false, "SET @a $b\n" ],

    [ "a+=-b",   false,  true, false, "CLR @r0\nSUB @r0 $b\nADD @a $r0\n" ],
    [ "a=-b",    false,  true, false, "CLR @a\nSUB @a $b\n" ],
    [ "a=b/-c",  false,  true, false, "CLR @a\nSUB @a $c\nSET @r0 $b\nDIV @r0 $a\nSET @a $r0\n" ],
    [ "a=-b/c",  false,  true, false, "CLR @a\nSUB @a $b\nDIV @a $c\n" ],
    [ "a=-2",    false,  true, false, "CLR @a\nSET @r0 #0000000000000002\nSUB @a $r0\n" ],
    [ "a=-~b",   false,  true, false, "SET @a $b\nNOT @a\nCLR @r0\nSUB @r0 $a\nSET @a $r0\n" ],
    [ "a=~-b",   false,  true, false, "CLR @a\nSUB @a $b\nNOT @a\n" ],
    [ "a=-b-- ", false,  true, false, "CLR @a\nSUB @a $b\nDEC @b\n" ],
    [ "a=---b",  true,  true, false, "" ],

    [ "a=+b",  false,  true, false, "SET @a $b\n" ],
    [ "a=b/+c",  false,  true, false, "SET @a $b\nDIV @a $c\n" ],
    [ "a=+b/-c",  false,  true, false, "CLR @a\nSUB @a $c\nSET @r0 $b\nDIV @r0 $a\nSET @a $r0\n" ],
    [ "a=+b/+c",  false,  true, false, "SET @a $b\nDIV @a $c\n" ],
    [ "a=+2",  false,  true, false, "SET @a #0000000000000002\n" ],
    [ "a-=+~2",  false,  true, false, "SET @r0 #0000000000000002\nNOT @r0\nSUB @a $r0\n" ],
    [ "a=~+2",  false,  true, false, "SET @a #0000000000000002\nNOT @a\n" ],
    [ "a=+",  true,  true, false, "" ],
    
    [ "a=&b",  true,  true, false, "" ],


    [ "a=*b",  false,  true, false, "SET @a $($b)\n" ],
    [ "*a=b",  false,  true, false, "SET @($a) $b\n" ],
    [ "a=*b/5",  false,  true, false, "SET @a $($b)\nSET @r0 #0000000000000005\nDIV @a $r0\n" ],
    [ "a=5/*b",  false,  true, false, "SET @a #0000000000000005\nSET @r0 $($b)\nDIV @a $r0\n" ],
    [ "a*=*b",  false,  true, false, "SET @r0 $($b)\nMUL @a $r0\n" ],
    [ "a=*b<<*c",  false,  true, false, "SET @a $($b)\nSET @r0 $($c)\nSHL @a $r0\n" ],
    [ "a=~*b",  false,  true, false, "SET @a $($b)\nNOT @a\n" ],
    [ "a=-*b",  false,  true, false, "CLR @a\nSET @r0 $($b)\nSUB @a $r0\n" ],

    [ "a=*~b",  true,  true, false, "" ],
    [ "a=*b--",  true,  true, false, "" ],
    [ "a=++*b",  true,  true, false, "" ],
    [ "a=**b",  true,  true, false, "" ],

// CheckOperator Binary
    [ "a=b+c",    false,  true, false, "SET @a $c\nADD @a $b\n" ],
    [ "a=b-c",    false,  true, false, "SET @a $b\nSUB @a $c\n" ],
    [ "a=b*c",    false,  true, false, "SET @a $c\nMUL @a $b\n" ],
    [ "a=b&c",    false,  true, false, "SET @a $c\nAND @a $b\n" ],
    [ "a-=b+c",    false,  true, false, "SET @r0 $c\nADD @r0 $b\nSUB @a $r0\n" ],
    [ "a=b-2",    false,  true, false, "SET @a $b\nSET @r0 #0000000000000002\nSUB @a $r0\n" ],
    [ "a=\"0\"+b", false,  true, false, "SET @a $b\nSET @r0 #0000000000000030\nADD @a $r0\n" ],
    [ "a=2*b",    false,  true, false, "SET @a $b\nSET @r0 #0000000000000002\nMUL @a $r0\n" ],
    [ "a<<=b*-c",    false,  true, false, "CLR @r0\nSUB @r0 $c\nMUL @r0 $b\nSHL @a $r0\n" ],
    [ "a^=~b&c",    false,  true, false, "SET @r0 $b\nNOT @r0\nSET @r1 $c\nAND @r1 $r0\nXOR @a $r1\n" ],
    [ "a^=b&~c",    false,  true, false, "SET @r0 $c\nNOT @r0\nAND @r0 $b\nXOR @a $r0\n" ],
    [ "a^=-b&-c",    false,  true, false, "CLR @r0\nSUB @r0 $c\nCLR @r1\nSUB @r1 $b\nAND @r0 $r1\nXOR @a $r0\n" ],
    [ "a=b&~0xff",  false,  true, false, "SET @a #00000000000000ff\nNOT @a\nAND @a $b\n" ],
    [ "a=~0x7fb&~0xff",  false,  true, false, "SET @a #00000000000000ff\nNOT @a\nSET @r0 #00000000000007fb\nNOT @r0\nAND @a $r0\n" ],
    [ "a>>=b-~c", false,  true, false, "SET @r0 $c\nNOT @r0\nSET @r1 $b\nSUB @r1 $r0\nSHR @a $r1\n" ],

    [ "a=b++-c",    false,  true, false, "SET @a $b\nSUB @a $c\nINC @b\n" ],
    [ "a=--b&c",    false,  true, false, "DEC @b\nSET @a $c\nAND @a $b\n" ],

    [ "a+=-b+c",   false,  true, false, "CLR @r0\nSUB @r0 $b\nSET @r1 $c\nADD @r1 $r0\nADD @a $r1\n" ],
    [ "a=-b**c",    false,  true, false, "CLR @a\nSUB @a $b\nSET @r0 $($c)\nMUL @r0 $a\nSET @a $r0\n" ],
    [ "a=b*-2",    false,  true, false, "CLR @a\nSET @r0 #0000000000000002\nSUB @a $r0\nMUL @a $b\n" ],
    [ "a=-2&~b",   false,  true, false, "SET @a $b\nNOT @a\nCLR @r0\nSET @r1 #0000000000000002\nSUB @r0 $r1\nAND @a $r0\n" ],
    [ "a=b&~-c",   false,  true, false, "CLR @a\nSUB @a $c\nNOT @a\nAND @a $b\n" ],
    [ "a=~-b&c",   false,  true, false, "CLR @a\nSUB @a $b\nNOT @a\nSET @r0 $c\nAND @r0 $a\nSET @a $r0\n" ],
    [ "a=b*-c--", false,  true, false, "CLR @a\nSUB @a $c\nMUL @a $b\nDEC @c\n" ],
    [ "a=-b--*c", false,  true, false, "CLR @a\nSUB @a $b\nSET @r0 $c\nMUL @r0 $a\nSET @a $r0\nDEC @b\n" ],
    [ "a/=b*-c--", false,  true, false, "CLR @r0\nSUB @r0 $c\nMUL @r0 $b\nDIV @a $r0\nDEC @c\n" ],

    [ "a+b=c",  true,  true, false, "" ],
    [ "a-b=c",  true,  true, false, "" ],
    [ "a*b=c",  true,  true, false, "" ],
    [ "a&b=c",  true,  true, false, "" ],
    [ "a=b*/c",  true,  true, false, "" ],

// NewCodeLine
    [ "a=b,c=d",    false,  true, false, "SET @a $b\nSET @c $d\n" ],
    [ "a=b,c=d,e=f",    false,  true, false, "SET @a $b\nSET @c $d\nSET @e $f\n" ],
    [ "a=b++,c=b",    false,  true, false, "SET @a $b\nINC @b\nSET @c $b\n" ],
    [ "a=b++,c=b++,d=b",    false,  true, false, "SET @a $b\nINC @b\nSET @c $b\nINC @b\nSET @d $b\n" ],
    [ "a=b\nc=d",    false,  true, false, "SET @a $b\nSET @c $d\n" ],
    [ "a+=1/2,a+=1/2,a+=1/2,a+=1/2",    false,  true, false, "SET @r0 #0000000000000001\nSET @r1 #0000000000000002\nDIV @r0 $r1\nADD @a $r0\nSET @r0 #0000000000000001\nSET @r1 #0000000000000002\nDIV @r0 $r1\nADD @a $r0\nSET @r0 #0000000000000001\nSET @r1 #0000000000000002\nDIV @r0 $r1\nADD @a $r0\nSET @r0 #0000000000000001\nSET @r1 #0000000000000002\nDIV @r0 $r1\nADD @a $r0\n" ],
    [ ",",    false,  true, false, "" ],
    [ ",,,,",    false,  true, false, "" ],
    [ "a=b\n\nc=d",    false,  true, false, "SET @a $b\nSET @c $d\n" ],

    [ "a=,b",  true,  true, false, "" ],

// Array
   // Arr+ Assignment, Arr+ SetOperator, 
    [ "a[b]=c",    false,  true, false, "SET @($a + $b) $c\n" ],
    [ "a[0]=b",    false,  true, false, "SET @($a) $b\n" ],
    [ "a[2]=b",    false,  true, false, "SET @r0 #0000000000000002\nSET @($a + $r0) $b\n" ],
    [ "a=b[c]",    false,  true, false, "SET @a $($b + $c)\n" ],
    [ "a=b[0]",    false,  true, false, "SET @a $($b)\n" ],
    [ "a=b[3]",    false,  true, false, "SET @a #0000000000000003\nSET @a $($b + $a)\n" ],
    [ "a[b]=c[d]",  false,  true, false, "SET @r0 $($c + $d)\nSET @($a + $b) $r0\n" ],
    [ "a[b]+=c",    false,  true, false, "SET @r0 $($a + $b)\nADD @r0 $c\nSET @($a + $b) $r0\n" ],
    [ "a[0]-=b",    false,  true, false, "SET @r0 $($a)\nSUB @r0 $b\nSET @($a) $r0\n" ],
    [ "a[2]*=b",    false,  true, false, "SET @r0 #0000000000000002\nSET @r1 $($a + $r0)\nMUL @r1 $b\nSET @($a + $r0) $r1\n" ],
    [ "a/=b[c]",    false,  true, false, "SET @r0 $($b + $c)\nDIV @a $r0\n" ],
    [ "a&=b[0]",    false,  true, false, "SET @r0 $($b)\nAND @a $r0\n" ],
    [ "a^=b[3]",    false,  true, false, "SET @r0 #0000000000000003\nSET @r1 $($b + $r0)\nXOR @a $r1\n" ],
    [ "a[b]+=c[d]", false,  true, false, "SET @r0 $($c + $d)\nSET @r1 $($a + $b)\nADD @r1 $r0\nSET @($a + $b) $r1\n" ],
   // Arr+ Constant, Arr+ Operator
    [ "a[b]=2",     false,  true, false, "SET @r0 #0000000000000002\nSET @($a + $b) $r0\n" ],
    [ "a[0]=0xFF",   false,  true, false, "SET @r0 #00000000000000ff\nSET @($a) $r0\n" ],
    [ "a[2]=\"Ho ho\"", false,  true, false, "SET @r0 #0000000000000002\nSET @r1 #0000006f68206f48\nSET @($a + $r0) $r1\n" ],
    [ "a=b[c]/b[d]", false,  true, false, "SET @a $($b + $c)\nSET @r0 $($b + $d)\nDIV @a $r0\n" ],
    [ "a=b[c]<<b[2]",false,  true, false, "SET @a #0000000000000002\nSET @r0 $($b + $c)\nSET @r1 $($b + $a)\nSHL @r0 $r1\nSET @a $r0\n" ],
   // Arr+ UnaryOperator, Arr+ SetUnaryOperator
    [ "a=b[~c]",    false,  true, false, "SET @a $c\nNOT @a\nSET @a $($b + $a)\n" ],
    [ "a=~b[c]",    false,  true, false, "SET @a $($b + $c)\nNOT @a\n" ],
    [ "a=b[c]++",  true,  true, false, "" ],
    [ "a=b++[c]",  true,  true, false, "" ],
    [ "a=--b[c]",  true,  true, false, "" ],
   // Arr+ CheckOperator(Unary), Arr+ CheckOperator(Binary)
    [ "a=-b[c]",    false,  true, false, "CLR @a\nSET @r0 $($b + $c)\nSUB @a $r0\n" ],
    [ "a=+b[c]",    false,  true, false, "SET @a $($b + $c)\n" ],
    [ "a=b[-c]",    false,  true, false, "CLR @a\nSUB @a $c\nSET @a $($b + $a)\n" ],
    [ "a=b[+c]",    false,  true, false, "SET @a $($b + $c)\n" ],
    [ "a=b[*c]",    false,  true, false, "SET @a $($c)\nSET @a $($b + $a)\n" ],
    [ "a=b[c]-d[e]", false,  true, false, "SET @a $($b + $c)\nSET @r0 $($d + $e)\nSUB @a $r0\n" ],
    [ "a=b[c]+d[e]", false,  true, false, "SET @a $($d + $e)\nSET @r0 $($b + $c)\nADD @a $r0\n" ],
    [ "a=b[c]*d[e]", false,  true, false, "SET @a $($d + $e)\nSET @r0 $($b + $c)\nMUL @a $r0\n" ],
    [ "a=b[c]&d[e]", false,  true, false, "SET @a $($d + $e)\nSET @r0 $($b + $c)\nAND @a $r0\n" ],
    [ "a=b[c-d]",    false,  true, false, "SET @a $c\nSUB @a $d\nSET @a $($b + $a)\n" ],
    [ "a=b[c+d]",    false,  true, false, "SET @a $d\nADD @a $c\nSET @a $($b + $a)\n" ],
    [ "a=b[c*d]",    false,  true, false, "SET @a $d\nMUL @a $c\nSET @a $($b + $a)\n" ],
    [ "a=b[c&d]",    false,  true, false, "SET @a $d\nAND @a $c\nSET @a $($b + $a)\n" ],
    [ "a=*b[c]",  true,  true, false, "" ],
    [ "a=&b[c]",  true,  true, false, "" ],
    [ "a=b[&c]",  true,  true, false, "" ],
   // Arr+ NewCodeLine
    [ "a[2]=b,c[2]*=d,e[2]+=f",    false,  true, false, "SET @r0 #0000000000000002\nSET @($a + $r0) $b\nSET @r0 #0000000000000002\nSET @r1 $($c + $r0)\nMUL @r1 $d\nSET @($c + $r0) $r1\nSET @r0 #0000000000000002\nSET @r1 $($e + $r0)\nADD @r1 $f\nSET @($e + $r0) $r1\n" ],
    [ "a=b[c],d[0]=e",    false,  true, false, "SET @a $($b + $c)\nSET @($d) $e\n" ],

// CodeCave
    [ "a=(b)",     false,  true, false, "SET @a $b\n" ],
    [ "a*=(b)",    false,  true, false, "MUL @a $b\n" ],
    [ "a=(2)",     false,  true, false, "SET @a #0000000000000002\n" ],
    [ "a=*(b)",     false,  true, false, "SET @a $($b)\n" ],
    [ "a=*(b+c)",     false,  true, false, "SET @a $c\nADD @a $b\nSET @a $($a)\n" ],
    [ "*(a+1)=b",   false,  true, false, "SET @r0 #0000000000000001\nADD @r0 $a\nSET @($r0) $b\n" ],
    [ "a=(b*c)*d",  false,  true, false, "SET @a $c\nMUL @a $b\nSET @r0 $d\nMUL @r0 $a\nSET @a $r0\n" ],
    [ "a=(b/c)/d",  false,  true, false, "SET @a $b\nDIV @a $c\nDIV @a $d\n" ],
    [ "a=~(0xFF<<8)",false,  true, false, "SET @a #00000000000000ff\nSET @r0 #0000000000000008\nSHL @a $r0\nNOT @a\n" ],
    [ "a=~(b/c)/d", false,  true, false, "SET @a $b\nDIV @a $c\nNOT @a\nDIV @a $d\n" ],
    [ "a=(b/c)/~d", false,  true, false, "SET @a $b\nDIV @a $c\nSET @r0 $d\nNOT @r0\nDIV @a $r0\n" ],
    [ "a=~(b/c/d)", false,  true, false, "SET @a $c\nDIV @a $d\nSET @r0 $b\nDIV @r0 $a\nNOT @r0\nSET @a $r0\n" ],
    [ "a=(b+c)*(d+e)",    false,  true, false, "SET @a $e\nADD @a $d\nSET @r0 $c\nADD @r0 $b\nMUL @a $r0\n" ],
    [ "a=(b+c)/(d+e)",  false,  true, false, "SET @a $c\nADD @a $b\nSET @r0 $e\nADD @r0 $d\nDIV @a $r0\n" ],
    [ "a%=1-((b+c)*(d+e))",  false,  true, false, "SET @r0 $e\nADD @r0 $d\nSET @r1 $c\nADD @r1 $b\nMUL @r0 $r1\nSET @r1 #0000000000000001\nSUB @r1 $r0\nMOD @a $r1\n" ],

    [ "a=--(b)",  true,  true, false, "" ],
    [ "a=(b+c)++",  true,  true, false, "" ],
    [ "a=(b)[c]",  true,  true, false, "" ],


// Optimizations
    [ "a=a+\"0\"",    false,  true, false, "SET @r0 #0000000000000030\nADD @a $r0\n" ],
    [ "a=\"0\"+a",    false,  true, false, "SET @r0 $a\nSET @r1 #0000000000000030\nADD @r0 $r1\nSET @a $r0\n" ],
    [ "a=b/a",    false,  true, false, "SET @r0 $b\nDIV @r0 $a\nSET @a $r0\n" ],
    [ "a=1+(b/(c/a))",    false,  true, false, "SET @r0 $c\nDIV @r0 $a\nSET @r1 $b\nDIV @r1 $r0\nSET @r0 #0000000000000001\nADD @r1 $r0\nSET @a $r1\n" ],

// MISC 
    [ "a=~-*b",    false,  true, false, "CLR @a\nSET @r0 $($b)\nSUB @a $r0\nNOT @a\n" ],
    [ "a=~-~-*b",    false,  true, false, "CLR @a\nSET @r0 $($b)\nSUB @a $r0\nNOT @a\nCLR @r0\nSUB @r0 $a\nNOT @r0\nSET @a $r0\n" ],
    [ "a=~-~-*b+1",    false,  true, false, "CLR @a\nSET @r0 $($b)\nSUB @a $r0\nNOT @a\nCLR @r0\nSUB @r0 $a\nNOT @r0\nSET @a #0000000000000001\nADD @a $r0\n" ],
    [ "a=b+c/d-e",    false,  true, false, "SET @a $c\nDIV @a $d\nSUB @a $e\nADD @a $b\n" ],
    [ "a=b<<c+d<<e",    false,  true, false, "SET @a $d\nADD @a $c\nSHL @a $e\nSET @r0 $b\nSHL @r0 $a\nSET @a $r0\n" ],
    [ "a=b&c<<d^e",    false,  true, false, "SET @a $c\nSHL @a $d\nSET @r0 $e\nXOR @r0 $a\nAND @r0 $b\nSET @a $r0\n" ],

    [ "a=b%(1+*b[c])",   true,  true, false, "" ],


// Comparision
    [ "a==b",  true,  true, false, "" ],
    [ "a!=b",  true,  true, false, "" ],
    [ "2<=b",  true,  true, false, "" ],
    [ "a<2",   true,  true, false, "" ],
    [ "a>=b",  true,  true, false, "" ],
    [ "a>b",   true,  true, false, "" ],
    [ "a&&b",  true,  true, false, "" ],
    [ "a||b",  true,  true, false, "" ],

//returnvar testcases
// Variable
    [ "a", true,  true, false, "" ],
    [ "2", true,  true, false, "" ],
    [ "a|b", true,  true, false, "" ],
    [ "a|b=c", true,  true, false, "" ],
    [ "a/b",   true,  true, false, "" ],
    [ "-a=b",  true,  true, false, "" ],
    [ "+a=b",  true,  true, false, "" ],
    [ "&a=b",  true,  true, false, "" ],
    [ "a,b",   true,  true, false, "" ],


    ];

    var code;
    var result="";

    for (var i=0; i<tests.length; i++) {
        result+="<br>Test "+i+" ";
        try {
            code = codeGenerator(createSyntacticTree(verify(parser(tokenizer(tests[i][0], tests[i][2], tests[i][3] )))));
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
