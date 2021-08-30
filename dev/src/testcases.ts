// Author: Rui Deleterium
// Project: https://github.com/deleterium/SmartC
// License: BSD 3-Clause License

/* global generate syntaxProcess shape parse tokenize preprocess bytecode */

// eslint-disable-next-line no-unused-vars
function runTestCases () {
    function encodedStr (rawStr: string) {
        return rawStr.replace(/[\u00A0-\u9999<>&]/g, function (i) {
            return '&#' + i.charCodeAt(0) + ';'
        })
    }

    const tests: [string, boolean|null, string][] = [

        // void test
        ['Arithmetic tests', null, 'div'],
        ['Void test;', null, 'div'],
        ['', false, '^declare r0\n^declare r1\n^declare r2\n\nFIN\n'],
        [';', false, '^declare r0\n^declare r1\n^declare r2\n\nFIN\n'],
        [';;;', false, '^declare r0\n^declare r1\n^declare r2\n\nFIN\n'],

        // Assignment
        ['Assignment;', null, 'div'],
        ['long a, b; a=b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $b\nFIN\n'],
        ['long a; a;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nFIN\n'],
        ['long a; a=;', true, ''],
        ['long a; =a;', true, ''],

        // SetOperator
        ['SetOperator;', null, 'div'],
        ['long a, b; a+=b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nADD @a $b\nFIN\n'],
        ['long b; +=b;', true, ''],
        ['long a; a+=;', true, ''],

        // Constant
        ['Constant;', null, 'div'],
        ['long a; a=2;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #0000000000000002\nFIN\n'],
        ['2;', false, '^declare r0\n^declare r1\n^declare r2\n\nFIN\n'],
        ['long a; a=0xA;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #000000000000000a\nFIN\n'],
        ['long a; a=0;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nCLR @a\nFIN\n'],
        ['long a; a+=2;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nINC @a\nINC @a\nFIN\n'],
        ['long a; a+=0xfffffff;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 #000000000fffffff\nADD @a $r0\nFIN\n'],
        ["long a; a='BURST-MKCL-2226-W6AH-7ARVS';", false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #5c6ee8000049c552\nFIN\n'],
        ["long a; a='TS-MKCL-2226-W6AH-7ARVS';", false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #5c6ee8000049c552\nFIN\n'],
        ["long a; a='S-MKCL-2226-W6AH-7ARVS';", false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #5c6ee8000049c552\nFIN\n'],
        ['long a; a=6660515985630020946;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #5c6ee8000049c552\nFIN\n'],
        ['long a; a=18446744073709551615;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #ffffffffffffffff\nFIN\n'],
        ['long a; a=18446744073709551616;', true, ''],
        ['long a; a=18446744073709551617;', true, ''],
        // allow '_' in decimal and hexadecimal numbers
        ['long a, b, c, d; a=5_0000_0000; b=5_0000_0000; c=0x00ff_00fe_7fff; d=0x00ff00fe7fff;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a #000000001dcd6500\nSET @b #000000001dcd6500\nSET @c #000000ff00fe7fff\nSET @d #000000ff00fe7fff\nFIN\n'],

        ['long a; a="Hi there";', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #6572656874206948\nFIN\n'],
        ['long a; a="Hi there big";', true, ''],
        ['long a; 2=a;', true, ''],

        // Operator
        ['Operator;', null, 'div'],
        ['long a, b, c; a=b/c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nDIV @a $c\nFIN\n'],
        ['long a, b, c; a=b%c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nMOD @a $c\nFIN\n'],
        ['long a, b, c; a=b<<c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nSHL @a $c\nFIN\n'],
        ['long a, b, c; a=b>>c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nSHR @a $c\nFIN\n'],
        ['long a, b, c; a=b|c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nBOR @a $c\nFIN\n'],
        ['long a, b, c; a=b^c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nXOR @a $c\nFIN\n'],

        // UnaryOperator
        ['UnaryOperator;', null, 'div'],
        ['long a, b; a=!b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBNZ $b :__NOT_1_sF\nSET @a #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @a\n__NOT_1_end:\nFIN\n'],
        ['long a, b; a=~b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $b\nNOT @a\nFIN\n'],
        ['long a, b; a^=~b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $b\nNOT @r0\nXOR @a $r0\nFIN\n'],
        ['long a, b; a=~0xff;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a #00000000000000ff\nNOT @a\nFIN\n'],
        ['long a, b, c; a>>=b^~c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @r0 $c\nNOT @r0\nXOR @r0 $b\nSHR @a $r0\nFIN\n'],
        ['long a, b; a=~~b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $b\nNOT @a\nNOT @a\nFIN\n'],

        ['long a, b, c; a=~b/c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nNOT @a\nDIV @a $c\nFIN\n'],
        ['long a, b, c; a=~b/~c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nNOT @a\nSET @r0 $c\nNOT @r0\nDIV @a $r0\nFIN\n'],
        ['long a, b, c; a=b/~c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $c\nNOT @a\nSET @r0 $b\nDIV @r0 $a\nSET @a $r0\nFIN\n'],

        ['long a, b; ~a=b;', true, ''],

        // SetUnaryOperator
        ['SetUnaryOperator;', null, 'div'],
        ['long a; a++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nINC @a\nFIN\n'],
        ['long a; a--;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nDEC @a\nFIN\n'],
        ['long a; ++a;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nINC @a\nFIN\n'],
        ['long a; --a;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nDEC @a\nFIN\n'],

        ['long a, b, c; a=b++/c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nDIV @a $c\nINC @b\nFIN\n'],
        ['long a, b, c; a=--b/c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nDEC @b\nSET @a $b\nDIV @a $c\nFIN\n'],
        ['long a, b, c; a=~--b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nDEC @b\nSET @a $b\nNOT @a\nFIN\n'],
        ['long a, b, c; a+=~b++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @r0 $b\nNOT @r0\nADD @a $r0\nINC @b\nFIN\n'],
        ['long a, b, c; a=~b++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nNOT @a\nINC @b\nFIN\n'],
        ['long a; a++=2;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #0000000000000002\nINC @a\nFIN\n'],

        ['long a; a=2++;', true, ''],
        ['--;', true, ''],
        ['2++;', true, ''],
        ['long a, b, c; a=b- -c;', true, ''],

        // CheckOperator Unary
        ['CheckOperator Unary;', null, 'div'],
        ['long a, b; a=b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $b\nFIN\n'],

        ['long a, b; a+=-b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @r0\nSUB @r0 $b\nADD @a $r0\nFIN\n'],
        ['long a, b; a=-b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @a\nSUB @a $b\nFIN\n'],
        ['long a, b, c; a=b/-c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nCLR @a\nSUB @a $c\nSET @r0 $b\nDIV @r0 $a\nSET @a $r0\nFIN\n'],
        ['long a, b, c; a=-b/c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nCLR @a\nSUB @a $b\nDIV @a $c\nFIN\n'],
        ['long a, b; a=-2;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @a\nSET @r0 #0000000000000002\nSUB @a $r0\nFIN\n'],
        ['long a, b; a=-~b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $b\nNOT @a\nCLR @r0\nSUB @r0 $a\nSET @a $r0\nFIN\n'],
        ['long a, b; a=~-b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @a\nSUB @a $b\nNOT @a\nFIN\n'],
        ['long a, b; a=-b-- ;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @a\nSUB @a $b\nDEC @b\nFIN\n'],
        ['long a, b; a=---b;', true, ''],

        ['long a, b; a=+b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $b\nFIN\n'],
        ['long a, b, c; a=b/+c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nDIV @a $c\nFIN\n'],
        ['long a, b, c; a=+b/-c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nCLR @a\nSUB @a $c\nSET @r0 $b\nDIV @r0 $a\nSET @a $r0\nFIN\n'],
        ['long a, b, c; a=+b/+c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nDIV @a $c\nFIN\n'],
        ['long a; a=+2;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #0000000000000002\nFIN\n'],
        ['long a; a-=+~2;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 #0000000000000002\nNOT @r0\nSUB @a $r0\nFIN\n'],
        ['long a; a=~+2;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #0000000000000002\nNOT @a\nFIN\n'],
        ['long a; a=+;', true, ''],

        ['long *a, b; a=&b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a #0000000000000004\nFIN\n'],

        ['long a, *b; a=*b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $($b)\nFIN\n'],
        ['long *a, b; *a=b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @($a) $b\nFIN\n'],
        ['long a, *b; a=*b/5;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $($b)\nSET @r0 #0000000000000005\nDIV @a $r0\nFIN\n'],
        ['long a, *b; a=5/ *b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $($b)\nSET @r0 #0000000000000005\nDIV @r0 $a\nSET @a $r0\nFIN\n'],
        ['long a, *b; a*=*b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $($b)\nMUL @a $r0\nFIN\n'],
        ['long a, *b, *c; a=*b<<*c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $($b)\nSET @r0 $($c)\nSHL @a $r0\nFIN\n'],
        ['long a, *b; a=~*b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $($b)\nNOT @a\nFIN\n'],
        ['long a, *b; a=-*b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $($b)\nCLR @r0\nSUB @r0 $a\nSET @a $r0\nFIN\n'],
        ['long a, *b; a=*--b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nDEC @b\nSET @a $($b)\nFIN\n'],
        ['long a, *b; a=*b--;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $($b)\nDEC @b\nFIN\n'],

        ['long a, b; a=*~b;', true, ''],
        ['long a, b; a=++*b;', true, ''],
        ['long a, b; a=**b;', true, ''],

        // CheckOperator Binary
        ['CheckOperator Binary;', null, 'div'],
        ['long a, b, c; a=b+c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nADD @a $c\nFIN\n'],
        ['long a, b, c; a=b-c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nSUB @a $c\nFIN\n'],
        ['long a, b, c; a=b*c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nMUL @a $c\nFIN\n'],
        ['long a, b, c; a=b&c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nAND @a $c\nFIN\n'],
        ['long a, b, c; a-=b+c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @r0 $b\nADD @r0 $c\nSUB @a $r0\nFIN\n'],
        ['long a, b, c; a=b-2;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nSET @r0 #0000000000000002\nSUB @a $r0\nFIN\n'],
        ['long a, b; a="0"+b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a #0000000000000030\nADD @a $b\nFIN\n'],
        ['long a, b; a=2*b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a #0000000000000002\nMUL @a $b\nFIN\n'],
        ['long a, b, c; a<<=b*-c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nCLR @r0\nSUB @r0 $c\nMUL @r0 $b\nSHL @a $r0\nFIN\n'],
        ['long a, b, c; a^=~b&c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @r0 $b\nNOT @r0\nAND @r0 $c\nXOR @a $r0\nFIN\n'],
        ['long a, b, c; a^=b&~c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @r0 $c\nNOT @r0\nAND @r0 $b\nXOR @a $r0\nFIN\n'],
        ['long a, b, c; a^=-b&-c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nCLR @r0\nSUB @r0 $b\nCLR @r1\nSUB @r1 $c\nAND @r0 $r1\nXOR @a $r0\nFIN\n'],
        ['long a, b, c; a=b&~0xff;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a #00000000000000ff\nNOT @a\nAND @a $b\nFIN\n'],
        ['long a, b, c; a=~0x7fb&~0xff;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a #00000000000007fb\nNOT @a\nSET @r0 #00000000000000ff\nNOT @r0\nAND @a $r0\nFIN\n'],
        ['long a, b, c; a>>=b-~c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @r0 $c\nNOT @r0\nSET @r1 $b\nSUB @r1 $r0\nSHR @a $r1\nFIN\n'],

        ['long a, b, c; a=b++-c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nSUB @a $c\nINC @b\nFIN\n'],
        ['long a, b, c; a=--b&c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nDEC @b\nSET @a $b\nAND @a $c\nFIN\n'],

        ['long a, b, c; a+=-b+c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nCLR @r0\nSUB @r0 $b\nADD @r0 $c\nADD @a $r0\nFIN\n'],
        ['long a, b, *c; a=-b**c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nCLR @a\nSUB @a $b\nSET @r0 $($c)\nMUL @a $r0\nFIN\n'],
        ['long a, b, c; a=b*-2;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nCLR @a\nSET @r0 #0000000000000002\nSUB @a $r0\nMUL @a $b\nFIN\n'],
        ['long a, b, c; a=-2&~b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nCLR @a\nSET @r0 #0000000000000002\nSUB @a $r0\nSET @r0 $b\nNOT @r0\nAND @a $r0\nFIN\n'],
        ['long a, b, c; a=b&~-c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nCLR @a\nSUB @a $c\nNOT @a\nAND @a $b\nFIN\n'],
        ['long a, b, c; a=~-b&c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nCLR @a\nSUB @a $b\nNOT @a\nAND @a $c\nFIN\n'],
        ['long a, b, c; a=b*-c--;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nCLR @a\nSUB @a $c\nMUL @a $b\nDEC @c\nFIN\n'],
        ['long a, b, c; a=-b--*c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nCLR @a\nSUB @a $b\nMUL @a $c\nDEC @b\nFIN\n'],
        ['long a, b, c; a/=b*-c--;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nCLR @r0\nSUB @r0 $c\nMUL @r0 $b\nDIV @a $r0\nDEC @c\nFIN\n'],

        ['long a, b, c; a+b=c;', true, ''],
        ['long a, b, c; a-b=c;', true, ''],
        ['long a, b, c; a*b=c;', true, ''],
        ['long a, b, c; a&b=c;', true, ''],
        ['long a, b, c; a=b*/c;', true, ''],

        // Delimiter
        ['Delimiter;', null, 'div'],
        ['long a, b, c, d; a=b,c=d;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $b\nSET @c $d\nFIN\n'],
        ['long a, b; a,b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nFIN\n'],
        ['long a, b, c, d, e, f; a=b,c=d,e=f;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n\nSET @a $b\nSET @c $d\nSET @e $f\nFIN\n'],
        ['long a, b, c, d, e, f; a=b++,c=b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n\nSET @a $b\nINC @b\nSET @c $b\nFIN\n'],
        ['long a, b, c, d, e, f; a=b++,c=b++,d=b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n\nSET @a $b\nINC @b\nSET @c $b\nINC @b\nSET @d $b\nFIN\n'],
        ['long a; a+=1/2,a=2/2,a+=3/2,a=4/2;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #0000000000000001\nINC @a\nSET @a #0000000000000002\nFIN\n'],
        [',;', true, ''],
        [',,,,;', true, ''],
        ['long a, b, c, d; a=b,,c=d;', true, ''],

        ['long a, b; a=,b;', true, ''],

        // CodeCave
        ['CodeCave;', null, 'div'],
        ['long a, b; a=(b);', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $b\nFIN\n'],
        ['long a, b; a*=(b);', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nMUL @a $b\nFIN\n'],
        ['long a; a=(2);', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #0000000000000002\nFIN\n'],
        ['long a, *b, c, d; a=*(b);', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $($b)\nFIN\n'],
        ['long a, *b, c, d; a=*(b+c);', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $b\nADD @a $c\nSET @r0 $($a)\nSET @a $r0\nFIN\n'],
        ['long a, b, *c, d; a=*(b+c);', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $b\nADD @a $c\nSET @r0 $($a)\nSET @a $r0\nFIN\n'],
        ['long a, b, *c, d; a=*(5+c);', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a #0000000000000005\nADD @a $c\nSET @r0 $($a)\nSET @a $r0\nFIN\n'],
        ['long *a, b, c, d; *(a+1)=b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @r0 $a\nINC @r0\nSET @($r0) $b\nFIN\n'],
        ['long a, b, c, d; a=(b*c)*d;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $b\nMUL @a $c\nMUL @a $d\nFIN\n'],
        ['long a, b, c, d; a=(b/c)/d;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $b\nDIV @a $c\nDIV @a $d\nFIN\n'],
        ['long a, b, c, d; a=~(0xFF<<8);', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a #00000000000000ff\nSET @r0 #0000000000000008\nSHL @a $r0\nNOT @a\nFIN\n'],
        ['long a, b, c, d; a=~(b/c)/d;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $b\nDIV @a $c\nNOT @a\nDIV @a $d\nFIN\n'],
        ['long a, b, c, d; a=(b/c)/~d;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $b\nDIV @a $c\nSET @r0 $d\nNOT @r0\nDIV @a $r0\nFIN\n'],
        ['long a, b, c, d; a=~(b/c/d);', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $b\nDIV @a $c\nDIV @a $d\nNOT @a\nFIN\n'],
        ['long a, b, c, d, e; a=(b+c)*(d+e);', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nSET @a $b\nADD @a $c\nSET @r0 $d\nADD @r0 $e\nMUL @a $r0\nFIN\n'],
        ['long a, b, c, d, e; a=(b+c)/(d+e);', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nSET @a $b\nADD @a $c\nSET @r0 $d\nADD @r0 $e\nDIV @a $r0\nFIN\n'],
        ['long a, b, c, d, e; a%=1-((b+c)*(d+e));', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nSET @r0 $b\nADD @r0 $c\nSET @r1 $d\nADD @r1 $e\nMUL @r0 $r1\nSET @r1 #0000000000000001\nSUB @r1 $r0\nMOD @a $r1\nFIN\n'],

        ['long a, b, c, d; a=--(b);', true, ''],
        ['long a, b, c, d; a=(b+c)++;', true, ''],
        ['long a, b, c, d; a=(b)[c];', true, ''],
        ['long a, b, c, d; *(a+1)=b;', true, ''],
        ['long a, b, c, d; *(a+c)=b;', true, ''],
        ['long a, b, c, d; a=*(b+1);', true, ''],
        ['long a, b, c, d; a=*(b+c);', true, ''],

        // Arithmetic + comparisions
        ['Arithmetic + comparisions;', null, 'div'],
        ['long a, b, z; z=a==b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare z\n\nBNE $a $b :__CMP_1_sF\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n'],
        ['long a, b, z; z=a!=b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare z\n\nBEQ $a $b :__CMP_1_sF\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n'],
        ['long a, b, z; z=2<=b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare z\n\nSET @z #0000000000000002\nBGT $z $b :__CMP_1_sF\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n'],
        ['long a, b, z; z=a<2;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare z\n\nSET @z #0000000000000002\nBGE $a $z :__CMP_1_sF\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n'],
        ['long a, b, z; z=a>=b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare z\n\nBLT $a $b :__CMP_1_sF\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n'],
        ['long a, b, z; z=a>b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare z\n\nBLE $a $b :__CMP_1_sF\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n'],
        ['long a, b, z; z=!a;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare z\n\nBNZ $a :__NOT_1_sF\nSET @z #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @z\n__NOT_1_end:\nFIN\n'],
        ['long a, b, z; z=!!a;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare z\n\nBZR $a :__NOT_1_sF\nSET @z #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @z\n__NOT_1_end:\nFIN\n'],
        ['long a, b, z; z=a&&b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare z\n\nBZR $a :__CMP_1_sF\nBZR $b :__CMP_1_sF\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nFIN\n'],
        ['long a, b, z; z=a||b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare z\n\nBNZ $a :__CMP_1_sT\nBNZ $b :__CMP_1_sT\nCLR @z\nJMP :__CMP_1_end\n__CMP_1_sT:\nSET @z #0000000000000001\n__CMP_1_end:\nFIN\n'],
        ['long a, b, c; a=2+b==c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nINC @a\nINC @a\nBNE $a $c :__CMP_1_sF\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nFIN\n'],
        ['long a, b, c; a=2+(b==c);', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nBNE $b $c :__CMP_1_sF\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nINC @a\nINC @a\nFIN\n'],
        ['long a, b, c; a=b==~c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $c\nNOT @a\nBNE $b $a :__CMP_1_sF\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nFIN\n'],
        ['long a, b, c; a=b==!c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nBNZ $c :__NOT_2_sF\nSET @a #0000000000000001\nJMP :__NOT_2_end\n__NOT_2_sF:\nCLR @a\n__NOT_2_end:\nBNE $b $a :__CMP_1_sF\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nFIN\n'],
        ['long a, b, c; a=!b==c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nBNZ $b :__NOT_2_sF\nSET @a #0000000000000001\nJMP :__NOT_2_end\n__NOT_2_sF:\nCLR @a\n__NOT_2_end:\nBNE $a $c :__CMP_1_sF\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nFIN\n'],
        ['long a, b, c; a=!b==!c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nBNZ $b :__NOT_2_sF\nSET @a #0000000000000001\nJMP :__NOT_2_end\n__NOT_2_sF:\nCLR @a\n__NOT_2_end:\nBNZ $c :__NOT_3_sF\nSET @r0 #0000000000000001\nJMP :__NOT_3_end\n__NOT_3_sF:\nCLR @r0\n__NOT_3_end:\nBNE $a $r0 :__CMP_1_sF\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nFIN\n'],
        ['long a, b, c; a=!(b+c);', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @a $b\nADD @a $c\nBNZ $a :__NOT_1_sF\nSET @a #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @a\n__NOT_1_end:\nFIN\n'],
        ['long a, b, c; a=!(b==c);', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nBEQ $b $c :__NOT_1_sF\nSET @a #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @a\n__NOT_1_end:\nFIN\n'],
        ['long a, b, c, d; a=!(b==c)==d;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nBEQ $b $c :__NOT_2_sF\nSET @a #0000000000000001\nJMP :__NOT_2_end\n__NOT_2_sF:\nCLR @a\n__NOT_2_end:\nBNE $a $d :__CMP_1_sF\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nFIN\n'],
        ['long a, b, c, d, z; z=1+((a&&b)||(c&&d));', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare z\n\nBZR $a :__OR_2_next\nBZR $b :__OR_2_next\nJMP :__CMP_1_sT\n__OR_2_next:\nBZR $c :__CMP_1_sF\nBZR $d :__CMP_1_sF\nJMP :__CMP_1_sT\n__CMP_1_sF:\nCLR @z\nJMP :__CMP_1_end\n__CMP_1_sT:\nSET @z #0000000000000001\n__CMP_1_end:\nINC @z\nFIN\n'],
        ['long a, b, c, d, z; z=1+!((a&&b)||(c&&d));', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare z\n\nBZR $a :__OR_2_next\nBZR $b :__OR_2_next\nJMP :__NOT_1_sF\n__OR_2_next:\nBZR $c :__NOT_1_sT\nBZR $d :__NOT_1_sT\nJMP :__NOT_1_sF\n__NOT_1_sT:\nSET @z #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @z\n__NOT_1_end:\nINC @z\nFIN\n'],
        ['long a, b, c, d; a=b+(++c==d++);', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nINC @c\nBNE $c $d :__CMP_1_sF\nSET @a #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @a\n__CMP_1_end:\nADD @a $b\nINC @d\nFIN\n'],
        ['long a, b, c, d; a=b+(++c&&d++);', true, ''],
        ['long a, b, c, d, z; z=1+((a||b)&&(c||d));', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare z\n\nBNZ $a :__AND_2_next\nBNZ $b :__AND_2_next\nJMP :__CMP_1_sF\n__AND_2_next:\nBNZ $c :__CMP_1_sT\nBNZ $d :__CMP_1_sT\nJMP :__CMP_1_sF\n__CMP_1_sT:\nSET @z #0000000000000001\nJMP :__CMP_1_end\n__CMP_1_sF:\nCLR @z\n__CMP_1_end:\nINC @z\nFIN\n'],
        ['long a, b, c, d, z; z=1+!((a||b)&&(c||d));', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare z\n\nBNZ $a :__AND_2_next\nBNZ $b :__AND_2_next\nJMP :__NOT_1_sT\n__AND_2_next:\nBNZ $c :__NOT_1_sF\nBNZ $d :__NOT_1_sF\n__NOT_1_sT:\nSET @z #0000000000000001\nJMP :__NOT_1_end\n__NOT_1_sF:\nCLR @z\n__NOT_1_end:\nINC @z\nFIN\n'],

        ['long a, b; a==b;', true, ''],
        ['long a, b; a!=b;', true, ''],
        ['long b; 2<=b;', true, ''],
        ['long a; a<2;', true, ''],
        ['long a, b; a>=b;', true, ''],
        ['long a, b; a>b;', true, ''],
        ['long a; !a;', true, ''],
        ['long a, b; a&&b;', true, ''],
        ['long a, b; a||b;', true, ''],

        // Optimizations
        ['Optimizations;', null, 'div'],
        ['long a, b; a=b/a;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $b\nDIV @r0 $a\nSET @a $r0\nFIN\n'],
        ['long a, b, c; a=1+(b/(c/a));', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @r0 $c\nDIV @r0 $a\nSET @r1 $b\nDIV @r1 $r0\nINC @r1\nSET @a $r1\nFIN\n'],

        // MISC
        ['MISC;', null, 'div'],
        ['long a, *b; a=~-*b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $($b)\nCLR @r0\nSUB @r0 $a\nNOT @r0\nSET @a $r0\nFIN\n'],
        ['long a, *b; a=~-~-*b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $($b)\nCLR @r0\nSUB @r0 $a\nNOT @r0\nCLR @a\nSUB @a $r0\nNOT @a\nFIN\n'],
        ['long a, *b; a=~-~-*b+1;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a $($b)\nCLR @r0\nSUB @r0 $a\nNOT @r0\nCLR @a\nSUB @a $r0\nNOT @a\nINC @a\nFIN\n'],
        ['long a, b, c, d, e; a=b+c/d-e;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nSET @a $c\nDIV @a $d\nADD @a $b\nSUB @a $e\nFIN\n'],
        ['long a, b, c, d, e; a=b<<c+d<<e;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nSET @a $c\nADD @a $d\nSET @r0 $b\nSHL @r0 $a\nSHL @r0 $e\nSET @a $r0\nFIN\n'],
        ['long a, b, c, d, e; a=b&c<<d^e;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nSET @a $c\nSHL @a $d\nAND @a $b\nXOR @a $e\nFIN\n'],
        ['long *a, b, c; *(a+1)=b; *(a+30)=b; *(a+c)=b; b=*(a+1); b=*(a+30); b=*(a+c);', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @r0 $a\nINC @r0\nSET @($r0) $b\nSET @r0 #000000000000001e\nADD @r0 $a\nSET @($r0) $b\nSET @r0 $a\nADD @r0 $c\nSET @($r0) $b\nSET @b $a\nINC @b\nSET @r0 $($b)\nSET @b $r0\nSET @b #000000000000001e\nADD @b $a\nSET @r0 $($b)\nSET @b $r0\nSET @b $a\nADD @b $c\nSET @r0 $($b)\nSET @b $r0\nFIN\n'],

        ['long a, b, c; a=b%(1+*b[c]);', true, ''],

        // Error Tests
        // Variable
        ['Error tests;', null, 'div'],
        ['long a, b; a|b;', true, ''],
        ['long a, b; a|b=c;', true, ''],
        ['long a, b; a/b;', true, ''],
        ['long a, b; -a=b;', true, ''],
        ['long a, b; +a=b;', true, ''],
        ['long a, b; &a=b;', true, ''],
        ['&;', true, ''],
        ['+;', true, ''],
        ['=;', true, ''],
        ['<=b;', true, ''],
        ['/;', true, ''],
        ['long a, b; /a;', true, ''],

        ['Logical tests', null, 'div'],

        ['Void test', null, 'div'],

        ['if () { a++; }', true, ''],

        ['One Operation) { a++; }', null, 'div'],

        // Variable
        ['long a; if (a) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nBZR $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],

        // Constant
        ['long a; if (0) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (1) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (10) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],

        // Operator
        ['long a; if (a/2) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $a\nSET @r1 #0000000000000002\nDIV @r0 $r1\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (a%2) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $a\nSET @r1 #0000000000000002\nMOD @r0 $r1\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (a<<2) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $a\nSET @r1 #0000000000000002\nSHL @r0 $r1\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (a>>2) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $a\nSET @r1 #0000000000000002\nSHR @r0 $r1\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (a|2) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 #0000000000000002\nBOR @r0 $a\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (a^2) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 #0000000000000002\nXOR @r0 $a\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],

        // UnaryOperator
        ['long a; if (!a) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nBNZ $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (~a) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $a\nNOT @r0\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],

        // SetUnaryOperators
        ['long a; if (++a) { a++; }', true, ''],
        ['long a; if (a++) { a++; }', true, ''],

        // Assignment SetOperator
        ['long a; if (a=b) { a++; }', true, ''],
        ['long a; if (a+=b) { a++; }', true, ''],

        // Comparision
        ['long a, b; if (a==b) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBNE $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (a!=b) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBEQ $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (a>=b) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBLT $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (a>b) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBLE $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (a<=b) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBGT $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (a<b) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBGE $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (a==0) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBNZ $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (a!=0) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBZR $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (a&&b) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBZR $a :__if1_endif\nBZR $b :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (a||b) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBNZ $a :__if1_start\nBNZ $b :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d; if (a==b&&c==d) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nBNE $a $b :__if1_endif\nBNE $c $d :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d; if (a==b||c==d) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nBEQ $a $b :__if1_start\nBEQ $c $d :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],

        // Arr
        ['long *a, b; if (a[b]) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $($a + $b)\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a[2], b; if (a[b]) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare b\n\nSET @r0 $($a + $b)\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],

        // CheckOperator Unary
        ['long a; if (+a) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nBZR $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long *a; if (*a) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $($a)\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (-a) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nCLR @r0\nSUB @r0 $a\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (~a) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $a\nNOT @r0\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (&a) { a++; }', true, ''],

        // CheckOperator Binary
        ['long a, b; if (b+a) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $b\nADD @r0 $a\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (b*a) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $b\nMUL @r0 $a\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (b-a) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $b\nSUB @r0 $a\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (b&a) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $b\nAND @r0 $a\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],

        // NewCodeLine
        ['long a; if (,) { a++; }', true, ''],
        ['long a; if (a,) { a++; }', true, ''],

        // Combinations Logical NOT

        ['Combinations with NOT) { a++; }', null, 'div'],

        // Variable
        ['long a; if (!a) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nBNZ $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],

        // Constant
        ['long a; if (!0) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (!1) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (!10) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],

        // Operator
        ['long a; if (!(a/2)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $a\nSET @r1 #0000000000000002\nDIV @r0 $r1\nBNZ $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (!(a%2)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $a\nSET @r1 #0000000000000002\nMOD @r0 $r1\nBNZ $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (!(a<<2)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $a\nSET @r1 #0000000000000002\nSHL @r0 $r1\nBNZ $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (!(a>>2)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $a\nSET @r1 #0000000000000002\nSHR @r0 $r1\nBNZ $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (!(a|2)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 #0000000000000002\nBOR @r0 $a\nBNZ $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (!(a^2)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 #0000000000000002\nXOR @r0 $a\nBNZ $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],

        // UnaryOperator
        ['long a; if (!!a) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nBZR $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (!~a) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $a\nNOT @r0\nBNZ $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],

        // Comparision
        ['long a, b; if (!(a==b)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBEQ $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (!(a!=b)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBNE $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (!(a>=b)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBGE $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (!(a>b)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBGT $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (!(a<=b)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBLE $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (!(a<b)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBLT $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (!(a==0)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBZR $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (!(a!=0)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBNZ $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (!(a&&b)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBZR $a :__if1_start\nBZR $b :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (!(a||b)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBNZ $a :__if1_endif\nBNZ $b :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d; if (!(a==b&&c==d)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nBNE $a $b :__if1_start\nBNE $c $d :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d; if (!(a==b||c==d)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nBEQ $a $b :__if1_endif\nBEQ $c $d :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],

        // Arr
        ['long *a, b; if (!a[b]) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $($a + $b)\nBNZ $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a[2], b; if (!a[b]) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare b\n\nSET @r0 $($a + $b)\nBNZ $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],

        // CheckOperator Unary
        ['long a; if (!(+a)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nBNZ $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long *a; if (!(*a)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $($a)\nBNZ $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (!(-a)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nCLR @r0\nSUB @r0 $a\nBNZ $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (!(~a)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $a\nNOT @r0\nBNZ $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a; if (!(&a)) { a++; }', true, ''],

        // CheckOperator Binary
        ['long a, b; if (!(b+a)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $b\nADD @r0 $a\nBNZ $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (!(b*a)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $b\nMUL @r0 $a\nBNZ $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (!(b-a)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $b\nSUB @r0 $a\nBNZ $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (!(b&a)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $b\nAND @r0 $a\nBNZ $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],

        // Combinations trying to break algorithm
        ['Misc combinations) { a++; }', null, 'div'],
        ['long a, b, c, d; if (a==b&&!(c==d)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nBNE $a $b :__if1_endif\nBEQ $c $d :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d; if (!(a==b)&&c==d) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nBEQ $a $b :__if1_endif\nBNE $c $d :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d; if (a==b==c) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nBNE $a $b :__CMP_2_sF\nSET @r0 #0000000000000001\nJMP :__CMP_2_end\n__CMP_2_sF:\nCLR @r0\n__CMP_2_end:\nBNE $r0 $c :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d; if ((a==b)==c) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nBNE $a $b :__CMP_2_sF\nSET @r0 #0000000000000001\nJMP :__CMP_2_end\n__CMP_2_sF:\nCLR @r0\n__CMP_2_end:\nBNE $r0 $c :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d, e, f, g, h; if (a==b&&c==d&&e==f&&g==h) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBNE $a $b :__if1_endif\nBNE $c $d :__if1_endif\nBNE $e $f :__if1_endif\nBNE $g $h :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d, e, f, g, h; if (a==b||c==d||e==f||g==h) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBEQ $a $b :__if1_start\nBEQ $c $d :__if1_start\nBEQ $e $f :__if1_start\nBEQ $g $h :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d, e, f, g, h; if ((a==b||c==d)&&(e==f||g==h)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBEQ $a $b :__AND_2_next\nBEQ $c $d :__AND_2_next\nJMP :__if1_endif\n__AND_2_next:\nBEQ $e $f :__if1_start\nBEQ $g $h :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d, e, f, g, h; if ((a==b && c==d) || (e==f && g==h)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBNE $a $b :__OR_2_next\nBNE $c $d :__OR_2_next\nJMP :__if1_start\n__OR_2_next:\nBNE $e $f :__if1_endif\nBNE $g $h :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d, e, f, g, h; if ((a>=b && c>=d) || (e!=f && g!=h)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBLT $a $b :__OR_2_next\nBLT $c $d :__OR_2_next\nJMP :__if1_start\n__OR_2_next:\nBEQ $e $f :__if1_endif\nBEQ $g $h :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d, e, f, g, h; if ((a>=b&&c>=d)||!(e==f&&g==h)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBLT $a $b :__OR_2_next\nBLT $c $d :__OR_2_next\nJMP :__if1_start\n__OR_2_next:\nBNE $e $f :__if1_start\nBNE $g $h :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d, e, f, g, h; if ((a<=b||c<d)&&!(e==f||g==h)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBLE $a $b :__AND_2_next\nBLT $c $d :__AND_2_next\nJMP :__if1_endif\n__AND_2_next:\nBEQ $e $f :__if1_endif\nBEQ $g $h :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d, e, f, g, h; if (!(a<=b||c<d)&&(e==f||g==h)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBLE $a $b :__if1_endif\nBLT $c $d :__if1_endif\nBEQ $e $f :__if1_start\nBEQ $g $h :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (a==~-b) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @r0\nSUB @r0 $b\nNOT @r0\nBNE $a $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (a==!~-b) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @r0\nSUB @r0 $b\nNOT @r0\nBNZ $r0 :__NOT_2_sF\nSET @r0 #0000000000000001\nJMP :__NOT_2_end\n__NOT_2_sF:\nCLR @r0\n__NOT_2_end:\nBNE $a $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d, e; if (a||(b&&c&&d)||e) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nBNZ $a :__if1_start\nBZR $b :__OR_2_next\nBZR $c :__OR_2_next\nBZR $d :__OR_2_next\nJMP :__if1_start\n__OR_2_next:\nBNZ $e :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d, e; if (a&&(b||c||d)&&e) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nBZR $a :__if1_endif\nBNZ $b :__AND_2_next\nBNZ $c :__AND_2_next\nBNZ $d :__AND_2_next\nJMP :__if1_endif\n__AND_2_next:\nBZR $e :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d, e; if (a||(b&&!c&&d)||e) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nBNZ $a :__if1_start\nBZR $b :__OR_2_next\nBNZ $c :__OR_2_next\nBZR $d :__OR_2_next\nJMP :__if1_start\n__OR_2_next:\nBNZ $e :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d, e; if (a&&(b||!c||d)&&e) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nBZR $a :__if1_endif\nBNZ $b :__AND_2_next\nBZR $c :__AND_2_next\nBNZ $d :__AND_2_next\nJMP :__if1_endif\n__AND_2_next:\nBZR $e :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d, e; if (a==0&&(b==0||c==0&&d==0)&&e==0) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n\nBNZ $a :__if1_endif\nBZR $b :__AND_2_next\nBNZ $c :__if1_endif\nBNZ $d :__if1_endif\n__AND_2_next:\nBNZ $e :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (!(!(!(a==b)))) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBEQ $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (!(!(!(!(a==b))))) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBNE $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d, z; if (( ( (a==5 || b==z) && c==z) || d==z ) && a==25+b) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare z\n\nSET @r0 #0000000000000005\nBEQ $a $r0 :__AND_4_next\nBEQ $b $z :__AND_4_next\nJMP :__OR_3_next\n__AND_4_next:\nBNE $c $z :__OR_3_next\nJMP :__AND_2_next\n__OR_3_next:\nBEQ $d $z :__AND_2_next\nJMP :__if1_endif\n__AND_2_next:\nSET @r0 #0000000000000019\nADD @r0 $b\nBNE $a $r0 :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d, e, f, g, h; if (a||b&&c||d && e||f&&g||h) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBNZ $a :__if1_start\nBZR $b :__OR_4_next\nBZR $c :__OR_4_next\nJMP :__if1_start\n__OR_4_next:\nBZR $d :__OR_3_next\nBZR $e :__OR_3_next\nJMP :__if1_start\n__OR_3_next:\nBZR $f :__OR_2_next\nBZR $g :__OR_2_next\nJMP :__if1_start\n__OR_2_next:\nBNZ $h :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d, e, f, g, h; if ((a||b)&&(c||d)&&(e||f)&&(g||h)) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBNZ $a :__AND_4_next\nBNZ $b :__AND_4_next\nJMP :__if1_endif\n__AND_4_next:\nBNZ $c :__AND_3_next\nBNZ $d :__AND_3_next\nJMP :__if1_endif\n__AND_3_next:\nBNZ $e :__AND_2_next\nBNZ $f :__AND_2_next\nJMP :__if1_endif\n__AND_2_next:\nBNZ $g :__if1_start\nBNZ $h :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d, e, f, g, h; if (((a&&b)||(c&&d)) && ((e&&f)||(g&&h))) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^declare e\n^declare f\n^declare g\n^declare h\n\nBZR $a :__OR_3_next\nBZR $b :__OR_3_next\nJMP :__AND_2_next\n__OR_3_next:\nBZR $c :__if1_endif\nBZR $d :__if1_endif\n__AND_2_next:\nBZR $e :__OR_6_next\nBZR $f :__OR_6_next\nJMP :__if1_start\n__OR_6_next:\nBZR $g :__if1_endif\nBZR $h :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d; if (!((a&&b)||(c&&d))) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nBZR $a :__OR_2_next\nBZR $b :__OR_2_next\nJMP :__if1_endif\n__OR_2_next:\nBZR $c :__if1_start\nBZR $d :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b, c, d; if (!((a||b)&&(c||d))) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nBNZ $a :__AND_2_next\nBNZ $b :__AND_2_next\nJMP :__if1_start\n__AND_2_next:\nBNZ $c :__if1_endif\nBNZ $d :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],

        ['Keywords tests', null, 'div'],
        ['long a, b; if (a) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBZR $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (a) { a++; } else { b--; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBZR $a :__if1_else\n__if1_start:\nINC @a\nJMP :__if1_endif\n__if1_else:\nDEC @b\n__if1_endif:\nFIN\n'],
        ['long a, b; while (a) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n__loop1_continue:\nBZR $a :__loop1_break\n__loop1_start:\nINC @a\nJMP :__loop1_continue\n__loop1_break:\nFIN\n'],
        ['long a, b; for (a=0;a<10;a++) { b++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @a\n__loop1_condition:\nSET @r0 #000000000000000a\nBGE $a $r0 :__loop1_break\n__loop1_start:\nINC @b\n__loop1_continue:\nINC @a\nJMP :__loop1_condition\n__loop1_break:\nFIN\n'],
        ['long a, b; do { a++; } while (a<b);', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n__loop1_continue:\nINC @a\nBLT $a $b :__loop1_continue\n__loop1_break:\nFIN\n'],
        ['long a, b; if (a) a++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBZR $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['long a, b; if (a) a++; else b--;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBZR $a :__if1_else\n__if1_start:\nINC @a\nJMP :__if1_endif\n__if1_else:\nDEC @b\n__if1_endif:\nFIN\n'],
        ['long a, b; while (a) a++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n__loop1_continue:\nBZR $a :__loop1_break\n__loop1_start:\nINC @a\nJMP :__loop1_continue\n__loop1_break:\nFIN\n'],
        ['long a, b; for (a=0;a<10;a++) b++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @a\n__loop1_condition:\nSET @r0 #000000000000000a\nBGE $a $r0 :__loop1_break\n__loop1_start:\nINC @b\n__loop1_continue:\nINC @a\nJMP :__loop1_condition\n__loop1_break:\nFIN\n'],
        ['long a, b; do a++; while (a<b);', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n__loop1_continue:\nINC @a\nBLT $a $b :__loop1_continue\n__loop1_break:\nFIN\n'],
        ['long a, b; while (a) { a++; if (a==5) break; b++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n__loop1_continue:\nBZR $a :__loop1_break\n__loop1_start:\nINC @a\nSET @r0 #0000000000000005\nBNE $a $r0 :__if2_endif\n__if2_start:\nJMP :__loop1_break\n__if2_endif:\nINC @b\nJMP :__loop1_continue\n__loop1_break:\nFIN\n'],
        ['long a, b; while (a) { a++; if (a==5) continue; b++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n__loop1_continue:\nBZR $a :__loop1_break\n__loop1_start:\nINC @a\nSET @r0 #0000000000000005\nBNE $a $r0 :__if2_endif\n__if2_start:\nJMP :__loop1_continue\n__if2_endif:\nINC @b\nJMP :__loop1_continue\n__loop1_break:\nFIN\n'],
        ['long a, b, c; a++; goto alabel; b++; alabel: c++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nINC @a\nJMP :alabel\nINC @b\nalabel:\nINC @c\nFIN\n'],
        ['long temp; temp = 2; if (temp>0) goto label1; if (temp==0) goto label2; goto label3; label1: temp++; label2: temp++; label3: temp++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare temp\n\nSET @temp #0000000000000002\nCLR @r0\nBLE $temp $r0 :__if1_endif\n__if1_start:\nJMP :label1\n__if1_endif:\nBNZ $temp :__if2_endif\n__if2_start:\nJMP :label2\n__if2_endif:\nJMP :label3\nlabel1:\nINC @temp\nlabel2:\nINC @temp\nlabel3:\nINC @temp\nFIN\n'],
        ['long a, b; a++; asm { PSH @a\nPOP @b } b++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nINC @a\nPSH @a\nPOP @b\nINC @b\nFIN\n'],
        ['long a, b; a++; sleep 1;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nINC @a\nSET @r0 #0000000000000001\nSLP $r0\nFIN\n'],
        ['long a, b; exit; a++; ', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nFIN\nINC @a\nFIN\n'],
        ['halt;', false, '^declare r0\n^declare r1\n^declare r2\n\nSTP\nFIN\n'],
        ['long a, b, c; if (a) { a++; if (b) { b++; if (c) { c++; } } }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nBZR $a :__if1_endif\n__if1_start:\nINC @a\nBZR $b :__if2_endif\n__if2_start:\nINC @b\nBZR $c :__if3_endif\n__if3_start:\nINC @c\n__if3_endif:\n__if2_endif:\n__if1_endif:\nFIN\n'],
        ['long a, b, c; if (a) {\n a++;\n} else if (b) {\n b++;\n} else if (c) {\n c++;\n}', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nBZR $a :__if1_else\n__if1_start:\nINC @a\nJMP :__if1_endif\n__if1_else:\nBZR $b :__if2_else\n__if2_start:\nINC @b\nJMP :__if2_endif\n__if2_else:\nBZR $c :__if3_endif\n__if3_start:\nINC @c\n__if3_endif:\n__if2_endif:\n__if1_endif:\nFIN\n'],
        ['long a, b; a=2; const b=5; a++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @a #0000000000000002\n^const SET @b #0000000000000005\nINC @a\nFIN\n'],
        ['Empty conditions', null, 'div'],
        ['long a; if () { a++; }', true, ''],
        ['long a; if () { a++; } else { b--; }', true, ''],
        ['long a; while () { a++; }', true, ''],
        ['long a; for (;;) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\n__loop1_condition:\n__loop1_start:\nINC @a\n__loop1_continue:\nJMP :__loop1_condition\n__loop1_break:\nFIN\n'],
        ['long a; do { a++; } while ();', true, ''],

        // pointer Operation
        ['Full tests;', null, 'div'],
        ['Pointer Assignment;', null, 'div'],
        [`long *pa, *pb, va, vb;
pa = pb; pa = &pb; pa = &vb; *pa= vb;
*pa= *pb; va = vb; va = *pb;`, false, '^declare r0\n^declare r1\n^declare r2\n^declare pa\n^declare pb\n^declare va\n^declare vb\n\nSET @pa $pb\nSET @pa #0000000000000004\nSET @pa #0000000000000006\nSET @($pa) $vb\nSET @r0 $($pb)\nSET @($pa) $r0\nSET @va $vb\nSET @va $($pb)\nFIN\n'],
        ['long *pa, *pb, va, vb; pa=vb; pa=*pb; *pa=pb; *pa=&pb; *pa=&vb; va=pb; va=&pb; va=&vb;', true, ''],
        [`#pragma warningToError false\nlong *pa, *pb, va, vb;
 pa=vb; pa=*pb; *pa=pb; *pa=&pb; *pa=&vb; va=pb; va=&pb; va=&vb;`, false, '^declare r0\n^declare r1\n^declare r2\n^declare pa\n^declare pb\n^declare va\n^declare vb\n\nSET @pa $vb\nSET @pa $($pb)\nSET @($pa) $pb\nSET @r0 #0000000000000004\nSET @($pa) $r0\nSET @r0 #0000000000000006\nSET @($pa) $r0\nSET @va $pb\nSET @va #0000000000000004\nSET @va #0000000000000006\nFIN\n'],
        ['long *pa, *pb, va, vb; va=*vb;', true, ''],
        ['long *pa, *pb, va, vb; *va=vb;', true, ''],
        ['long *a, *a+1=0;', true, ''],
        ['long *a, *(a*3)=0;', true, ''],

        ['Pointer/Array Assignment;', null, 'div'],
        ['long a[4], *b, c; *b=a[0]; a[0]=*b; b=a; *b=a[c]; a[c]=*b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @($b) $a_0\nSET @a_0 $($b)\nSET @b $a\nSET @r0 $($a + $c)\nSET @($b) $r0\nSET @r0 $($b)\nSET @($a + $c) $r0\nFIN\n'],
        ['long a[4], *b, c; a=b;', true, ''],
        ['long a[4], *b, c; b=&a; b=&a[0]; b=&c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @b #0000000000000003\nSET @b #0000000000000004\nSET @b #0000000000000009\nFIN\n'],
        ['long a[4], *b, c; c=&a; c=&a[0]; c=&c;', true, ''],
        ['#pragma warningToError false\nlong a[4], *b, c; c=&a; c=&a[0]; c=&c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @c #0000000000000003\nSET @c #0000000000000004\nSET @c #0000000000000009\nFIN\n'],

        ['long *a, b, c;\n*(a+1)=b; *(a+30)=b; *(a+c)=b;\nb=*(a+1); b=*(a+30); b=*(a+c);', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @r0 $a\nINC @r0\nSET @($r0) $b\nSET @r0 #000000000000001e\nADD @r0 $a\nSET @($r0) $b\nSET @r0 $a\nADD @r0 $c\nSET @($r0) $b\nSET @b $a\nINC @b\nSET @r0 $($b)\nSET @b $r0\nSET @b #000000000000001e\nADD @b $a\nSET @r0 $($b)\nSET @b $r0\nSET @b $a\nADD @b $c\nSET @r0 $($b)\nSET @b $r0\nFIN\n'],
        ['long *a, b, Array[4]; a=Array+2; a=Array-b; a+=7; a++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare Array\n^const SET @Array #0000000000000006\n^declare Array_0\n^declare Array_1\n^declare Array_2\n^declare Array_3\n\nSET @a $Array\nINC @a\nINC @a\nSET @a $Array\nSUB @a $b\nSET @r0 #0000000000000007\nADD @a $r0\nINC @a\nFIN\n'],
        ['long *a, b, Array[4]; a=Array*2;', true, ''],
        //    [ "",    false,"" ],

        // Array
        // Memtable: Arr+ Assignment, Arr+ SetOperator,
        ['Array', null, 'div'],
        ['long a[4]; long b; long c; a[b]=c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @($a + $b) $c\nFIN\n'],
        ['long a[4]; long b; long c; a[0]=b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @a_0 $b\nFIN\n'],
        ['long a[4]; long b; long c; a[2]=b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @a_2 $b\nFIN\n'],
        ["long a[4]; a[]='aaaaaaaazzzzzzz';", false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n\nSET @a_0 #6161616161616161\nSET @a_1 #007a7a7a7a7a7a7a\nCLR @a_2\nCLR @a_3\nFIN\n'],
        ['long a[4]; a[]=0x3333333333333333222222222222222211111111111111110000000000000000;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n\nCLR @a_0\nSET @a_1 #1111111111111111\nSET @a_2 #2222222222222222\nSET @a_3 #3333333333333333\nFIN\n'],
        ['long a[4]; long b; long c; c=a[b];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @c $($a + $b)\nFIN\n'],
        ['long a[4]; long b; long c; c=a[0];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @c $a_0\nFIN\n'],
        ['long a[4]; long b; long c; c=a[3];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @c $a_3\nFIN\n'],
        ['long a[4]; long b; long c; a[b]+=c;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @r0 $($a + $b)\nADD @r0 $c\nSET @($a + $b) $r0\nFIN\n'],
        ['long a[4]; long b; long c; a[0]-=b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSUB @a_0 $b\nFIN\n'],
        ['long a[4]; long b; long c; a[2]*=b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nMUL @a_2 $b\nFIN\n'],
        ['long a[4]; long b; long c; c/=a[b];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nSET @r0 $($a + $b)\nDIV @c $r0\nFIN\n'],
        ['long a[4]; long b; long c; c&=a[0];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nAND @c $a_0\nFIN\n'],
        ['long a[4]; long b; long c; c^=a[3];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n\nXOR @c $a_3\nFIN\n'],
        ['long a[4]; long b; long c[4]; long d; a[b]=c[d];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n^const SET @c #000000000000000a\n^declare c_0\n^declare c_1\n^declare c_2\n^declare c_3\n^declare d\n\nSET @r0 $($c + $d)\nSET @($a + $b) $r0\nFIN\n'],
        ['long a[4]; long b; long c[4]; long d; a[b]+=c[d];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n^const SET @c #000000000000000a\n^declare c_0\n^declare c_1\n^declare c_2\n^declare c_3\n^declare d\n\nSET @r0 $($a + $b)\nSET @r1 $($c + $d)\nADD @r0 $r1\nSET @($a + $b) $r0\nFIN\n'],
        // Arr+ Constant, Arr+ Operator
        ['long a[4]; long b; a[b]=2;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n\nSET @r0 #0000000000000002\nSET @($a + $b) $r0\nFIN\n'],
        ['long a[4]; a[0]=0xFF;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n\nSET @a_0 #00000000000000ff\nFIN\n'],
        ['long a[4]; a[2]="Ho ho";', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n\nSET @a_2 #0000006f68206f48\nFIN\n'],
        ['long a, b[4], c, d; a=b[c]/b[d];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a $($b + $c)\nSET @r0 $($b + $d)\nDIV @a $r0\nFIN\n'],
        ['long a, b[4], c, d; a=b[c]<<b[2];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a $($b + $c)\nSHL @a $b_2\nFIN\n'],
        // Arr+ UnaryOperator, Arr+ SetUnaryOperator
        ['long a, b[4], c, d; a=b[~c];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a $c\nNOT @a\nSET @a $($b + $a)\nFIN\n'],
        ['long a, b[4], c, d; a=~b[c];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a $($b + $c)\nNOT @a\nFIN\n'],
        ['long a, b[4], c, d; a=b[c]++;', true, ''],
        ['long a, b[4], c, d; a=b++[c];', true, ''],
        ['long a, b[4], c, d; a=--b[c];', true, ''],
        // Arr+ CheckOperator(Unary), Arr+ CheckOperator(Binary)
        ['long a, b[4], c, d; a=-b[c];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nCLR @a\nSET @r0 $($b + $c)\nSUB @a $r0\nFIN\n'],
        ['long a, b[4], c, d; a=+b[c];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a $($b + $c)\nFIN\n'],
        ['long a, b[4], c, d; a=b[-c];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nCLR @a\nSUB @a $c\nSET @a $($b + $a)\nFIN\n'],
        ['long a, b[4], c, d; a=b[+c];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a $($b + $c)\nFIN\n'],
        ['long a, b[4], c, d; a=b[*c];', true, ''],
        ['long a, b[4], c, d[2], e; a=b[c]-d[e];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n^const SET @d #000000000000000b\n^declare d_0\n^declare d_1\n^declare e\n\nSET @a $($b + $c)\nSET @r0 $($d + $e)\nSUB @a $r0\nFIN\n'],
        ['long a, b[4], c, d[2], e; a=b[c]+d[e];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n^const SET @d #000000000000000b\n^declare d_0\n^declare d_1\n^declare e\n\nSET @a $($b + $c)\nSET @r0 $($d + $e)\nADD @a $r0\nFIN\n'],
        ['long a, b[4], c, d[2], e; a=b[c]*d[e];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n^const SET @d #000000000000000b\n^declare d_0\n^declare d_1\n^declare e\n\nSET @a $($b + $c)\nSET @r0 $($d + $e)\nMUL @a $r0\nFIN\n'],
        ['long a, b[4], c, d[2], e; a=b[c]&d[e];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n^const SET @d #000000000000000b\n^declare d_0\n^declare d_1\n^declare e\n\nSET @a $($b + $c)\nSET @r0 $($d + $e)\nAND @a $r0\nFIN\n'],
        ['long a, b[4], c, d; a=b[c-d];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a $c\nSUB @a $d\nSET @a $($b + $a)\nFIN\n'],
        ['long a, b[4], c, d; a=b[c+d];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a $c\nADD @a $d\nSET @a $($b + $a)\nFIN\n'],
        ['long a, b[4], c, d; a=b[c*d];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a $c\nMUL @a $d\nSET @a $($b + $a)\nFIN\n'],
        ['long a, b[4], c, d; a=b[c&d];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare b_3\n^declare c\n^declare d\n\nSET @a $c\nAND @a $d\nSET @a $($b + $a)\nFIN\n'],
        ['long a, b[4], c, d; a=*b[c];', true, ''],
        ['long a[4], *b, c,d; b=&a[c];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare b\n^declare c\n^declare d\n\nSET @b $a\nADD @b $c\nFIN\n'],
        ['long a[4][2], *b, c,d; b=&a[c][d];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n^declare c\n^declare d\n\nSET @b $c\nSET @r0 #0000000000000002\nMUL @b $r0\nADD @b $d\nSET @r0 $a\nADD @r0 $b\nSET @b $r0\nFIN\n'],

        ['long a, b[4], c, d; a=b[&c];', true, ''],
        // Arr+ NewCodeLine
        ['long a[3],b,c[3],d,e[3],f; a[2]=b,c[2]*=d,e[2]+=f;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare b\n^declare c\n^const SET @c #0000000000000009\n^declare c_0\n^declare c_1\n^declare c_2\n^declare d\n^declare e\n^const SET @e #000000000000000e\n^declare e_0\n^declare e_1\n^declare e_2\n^declare f\n\nSET @a_2 $b\nMUL @c_2 $d\nADD @e_2 $f\nFIN\n'],
        ['long a,b[3],c,d[3],e; a=b[c],d[0]=e;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^const SET @b #0000000000000005\n^declare b_0\n^declare b_1\n^declare b_2\n^declare c\n^declare d\n^const SET @d #000000000000000a\n^declare d_0\n^declare d_1\n^declare d_2\n^declare e\n\nSET @a $($b + $c)\nSET @d_0 $e\nFIN\n'],

        // Memtable: multi Arr,
        ['Multidimennsional Array', null, 'div'],
        ['long a[4][2]; a[2][1]=0;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n\nCLR @a_5\nFIN\n'],
        ['long a[4][2]; long b; a[b][1]=0;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n\nSET @r0 $b\nSET @r1 #0000000000000002\nMUL @r0 $r1\nINC @r0\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n'],
        ['long a[4][2]; long b; a[b][0]=0;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n\nSET @r0 $b\nSET @r1 #0000000000000002\nMUL @r0 $r1\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n'],
        ['long a[4][2]; long b; a[0][b]=0;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n\nCLR @r0\nSET @($a + $b) $r0\nFIN\n'],
        ['long a[4][2]; long b; a[1][b]=0;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n\nSET @r0 $b\nINC @r0\nINC @r0\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n'],
        ['long a[4][2]; long b; a[1][b]=a[b][1];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n\nSET @r0 $b\nINC @r0\nINC @r0\nSET @r1 $b\nSET @r2 #0000000000000002\nMUL @r1 $r2\nINC @r1\nSET @r2 $($a + $r1)\nSET @($a + $r0) $r2\nFIN\n'],
        ['long a[3][3][3]; long b; long c; a[1][2][2]=0;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare a_8\n^declare a_9\n^declare a_10\n^declare a_11\n^declare a_12\n^declare a_13\n^declare a_14\n^declare a_15\n^declare a_16\n^declare a_17\n^declare a_18\n^declare a_19\n^declare a_20\n^declare a_21\n^declare a_22\n^declare a_23\n^declare a_24\n^declare a_25\n^declare a_26\n^declare b\n^declare c\n\nCLR @a_17\nFIN\n'],
        ['long a[3][3][3]; long b; long c; a[1][2][b]=0;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare a_8\n^declare a_9\n^declare a_10\n^declare a_11\n^declare a_12\n^declare a_13\n^declare a_14\n^declare a_15\n^declare a_16\n^declare a_17\n^declare a_18\n^declare a_19\n^declare a_20\n^declare a_21\n^declare a_22\n^declare a_23\n^declare a_24\n^declare a_25\n^declare a_26\n^declare b\n^declare c\n\nSET @r0 $b\nSET @r1 #000000000000000f\nADD @r0 $r1\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n'],
        ['long a[3][3][3]; long b; long c; a[1][b][2]=0;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare a_8\n^declare a_9\n^declare a_10\n^declare a_11\n^declare a_12\n^declare a_13\n^declare a_14\n^declare a_15\n^declare a_16\n^declare a_17\n^declare a_18\n^declare a_19\n^declare a_20\n^declare a_21\n^declare a_22\n^declare a_23\n^declare a_24\n^declare a_25\n^declare a_26\n^declare b\n^declare c\n\nSET @r0 $b\nSET @r1 #0000000000000003\nMUL @r0 $r1\nSET @r1 #0000000000000009\nADD @r0 $r1\nINC @r0\nINC @r0\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n'],
        ['long a[3][3][3]; long b; long c; a[b][2][2]=0;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare a_8\n^declare a_9\n^declare a_10\n^declare a_11\n^declare a_12\n^declare a_13\n^declare a_14\n^declare a_15\n^declare a_16\n^declare a_17\n^declare a_18\n^declare a_19\n^declare a_20\n^declare a_21\n^declare a_22\n^declare a_23\n^declare a_24\n^declare a_25\n^declare a_26\n^declare b\n^declare c\n\nSET @r0 $b\nSET @r1 #0000000000000009\nMUL @r0 $r1\nSET @r1 #0000000000000006\nADD @r0 $r1\nINC @r0\nINC @r0\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n'],
        ['long a[3][3][3]; long b; long c; a[b][b][b]=0;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare a_8\n^declare a_9\n^declare a_10\n^declare a_11\n^declare a_12\n^declare a_13\n^declare a_14\n^declare a_15\n^declare a_16\n^declare a_17\n^declare a_18\n^declare a_19\n^declare a_20\n^declare a_21\n^declare a_22\n^declare a_23\n^declare a_24\n^declare a_25\n^declare a_26\n^declare b\n^declare c\n\nSET @r0 $b\nSET @r1 #0000000000000009\nMUL @r0 $r1\nSET @r1 $b\nSET @r2 #0000000000000003\nMUL @r1 $r2\nADD @r0 $r1\nADD @r0 $b\nCLR @r1\nSET @($a + $r0) $r1\nFIN\n'],
        //    [ "",  false,"" ],

        // Memtable: struct,
        ['Struct', null, 'div'],

        [`struct KOMBI { long driver; long collector; long passenger; } car;
long a, b, *c, d[2];\n
car.passenger="Ze";
car.passenger=a;
car.passenger=*c;
car.passenger=d[1];
car.passenger=d[a];
car.passenger=car.collector;\n
a=car.driver;
*c=car.driver;
d[1]=car.driver;
d[a]=car.driver;`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #000000000000000a\n^declare d_0\n^declare d_1\n\nSET @car_passenger #000000000000655a\nSET @car_passenger $a\nSET @car_passenger $($c)\nSET @car_passenger $d_1\nSET @car_passenger $($d + $a)\nSET @car_passenger $car_collector\nSET @a $car_driver\nSET @($c) $car_driver\nSET @d_1 $car_driver\nSET @($d + $a) $car_driver\nFIN\n'],

        [`struct KOMBI { long driver; long collector; long passenger; } car[3];
long a, b, *c, d[2];\n
car[1].passenger='Ze';
car[1].passenger=a;
car[1].passenger=*c;
car[1].passenger=d[1];
car[1].passenger=d[a];
car[1].passenger=car[2].collector;\n
a=car[1].driver;
*c=car[1].driver;
d[1]=car[1].driver;
d[a]=car[1].driver;`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^declare car_2_driver\n^declare car_2_collector\n^declare car_2_passenger\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000011\n^declare d_0\n^declare d_1\n\nSET @car_1_passenger #000000000000655a\nSET @car_1_passenger $a\nSET @car_1_passenger $($c)\nSET @car_1_passenger $d_1\nSET @car_1_passenger $($d + $a)\nSET @car_1_passenger $car_2_collector\nSET @a $car_1_driver\nSET @($c) $car_1_driver\nSET @d_1 $car_1_driver\nSET @($d + $a) $car_1_driver\nFIN\n'],

        [`struct KOMBI { long driver; long collector; long passenger; } car[3];
long a, b, *c, d[2];\n
car[a].passenger='Ze';
car[a].passenger=a;
car[a].passenger=*c;
car[a].passenger=d[1];
car[a].passenger=d[a];
car[a].passenger=car[2].collector;
car[a].passenger=car[b].collector;
`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^declare car_2_driver\n^declare car_2_collector\n^declare car_2_passenger\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000011\n^declare d_0\n^declare d_1\n\nSET @r0 $a\nSET @r1 #0000000000000003\nMUL @r0 $r1\nINC @r0\nINC @r0\nSET @r1 #000000000000655a\nSET @($car + $r0) $r1\nSET @r0 $a\nSET @r1 #0000000000000003\nMUL @r0 $r1\nINC @r0\nINC @r0\nSET @($car + $r0) $a\nSET @r0 $a\nSET @r1 #0000000000000003\nMUL @r0 $r1\nINC @r0\nINC @r0\nSET @r1 $($c)\nSET @($car + $r0) $r1\nSET @r0 $a\nSET @r1 #0000000000000003\nMUL @r0 $r1\nINC @r0\nINC @r0\nSET @($car + $r0) $d_1\nSET @r0 $a\nSET @r1 #0000000000000003\nMUL @r0 $r1\nINC @r0\nINC @r0\nSET @r1 $($d + $a)\nSET @($car + $r0) $r1\nSET @r0 $a\nSET @r1 #0000000000000003\nMUL @r0 $r1\nINC @r0\nINC @r0\nSET @($car + $r0) $car_2_collector\nSET @r0 $a\nSET @r1 #0000000000000003\nMUL @r0 $r1\nINC @r0\nINC @r0\nSET @r1 $b\nSET @r2 #0000000000000003\nMUL @r1 $r2\nINC @r1\nSET @r2 $($car + $r1)\nSET @($car + $r0) $r2\nFIN\n'],

        [`struct KOMBI { long driver; long collector; long passenger; } car[3];
long a, b, *c, d[2];\n
a=car[b].driver;
*c=car[b].driver;
d[1]=car[b].driver;
d[a]=car[b].driver;`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^declare car_2_driver\n^declare car_2_collector\n^declare car_2_passenger\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000011\n^declare d_0\n^declare d_1\n\nSET @a $b\nSET @r0 #0000000000000003\nMUL @a $r0\nSET @a $($car + $a)\nSET @r0 $b\nSET @r1 #0000000000000003\nMUL @r0 $r1\nSET @r1 $($car + $r0)\nSET @($c) $r1\nSET @d_1 $b\nSET @r0 #0000000000000003\nMUL @d_1 $r0\nSET @d_1 $($car + $d_1)\nSET @r0 $b\nSET @r1 #0000000000000003\nMUL @r0 $r1\nSET @r1 $($car + $r0)\nSET @($d + $a) $r1\nFIN\n'],

        [`struct KOMBI { long driver; long collector; long passenger[4]; } car;
long a, b, *c, d[2];\n
car.passenger[1]='Ze';
car.passenger[1]=a;
car.passenger[1]=*c;
car.passenger[1]=d[1];
car.passenger[1]=d[a];
car.passenger[1]=car.driver;
car.passenger[1]=car.passenger[2];\n
a=car.passenger[3];
*c=car.passenger[3];
d[1]=car.passenger[3];
d[a]=car.passenger[3];`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^const SET @car_passenger #0000000000000006\n^declare car_passenger_0\n^declare car_passenger_1\n^declare car_passenger_2\n^declare car_passenger_3\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #000000000000000e\n^declare d_0\n^declare d_1\n\nSET @car_passenger_1 #000000000000655a\nSET @car_passenger_1 $a\nSET @car_passenger_1 $($c)\nSET @car_passenger_1 $d_1\nSET @car_passenger_1 $($d + $a)\nSET @car_passenger_1 $car_driver\nSET @car_passenger_1 $car_passenger_2\nSET @a $car_passenger_3\nSET @($c) $car_passenger_3\nSET @d_1 $car_passenger_3\nSET @($d + $a) $car_passenger_3\nFIN\n'],

        [`struct KOMBI { long driver; long collector; long passenger[4]; } car;
long a, b, *c, d[2];\n
car.passenger[a]='Ze';
car.passenger[a]=a;
car.passenger[a]=*c;
car.passenger[a]=d[1];
car.passenger[a]=d[a];
car.passenger[a]=car.driver;
car.passenger[a]=car.passenger[b];\n
a=car.passenger[b];
*c=car.passenger[b];
d[1]=car.passenger[b];
d[a]=car.passenger[b];`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^const SET @car_passenger #0000000000000006\n^declare car_passenger_0\n^declare car_passenger_1\n^declare car_passenger_2\n^declare car_passenger_3\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #000000000000000e\n^declare d_0\n^declare d_1\n\nSET @r0 #000000000000655a\nSET @($car_passenger + $a) $r0\nSET @($car_passenger + $a) $a\nSET @r0 $($c)\nSET @($car_passenger + $a) $r0\nSET @($car_passenger + $a) $d_1\nSET @r0 $($d + $a)\nSET @($car_passenger + $a) $r0\nSET @($car_passenger + $a) $car_driver\nSET @r0 $($car_passenger + $b)\nSET @($car_passenger + $a) $r0\nSET @a $($car_passenger + $b)\nSET @r0 $($car_passenger + $b)\nSET @($c) $r0\nSET @d_1 $($car_passenger + $b)\nSET @r0 $($car_passenger + $b)\nSET @($d + $a) $r0\nFIN\n'],

        [`struct KOMBI { long driver; long collector; long passenger[4]; } car[2];
long a, b, *c, d[2];\n
car[1].passenger[2]='Ze';
car[1].passenger[2]=a;
car[1].passenger[2]=*c;
car[1].passenger[2]=d[1];
car[1].passenger[2]=d[a];
car[1].passenger[2]=car[0].driver;
car[1].passenger[2]=car[0].passenger[3];\n
a=car[1].passenger[3];
*c=car[1].passenger[3];
d[1]=car[1].passenger[3];
d[a]=car[1].passenger[3];`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^const SET @car_0_passenger #0000000000000007\n^declare car_0_passenger_0\n^declare car_0_passenger_1\n^declare car_0_passenger_2\n^declare car_0_passenger_3\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^const SET @car_1_passenger #000000000000000e\n^declare car_1_passenger_0\n^declare car_1_passenger_1\n^declare car_1_passenger_2\n^declare car_1_passenger_3\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000016\n^declare d_0\n^declare d_1\n\nSET @car_1_passenger_2 #000000000000655a\nSET @car_1_passenger_2 $a\nSET @car_1_passenger_2 $($c)\nSET @car_1_passenger_2 $d_1\nSET @car_1_passenger_2 $($d + $a)\nSET @car_1_passenger_2 $car_0_driver\nSET @car_1_passenger_2 $car_0_passenger_3\nSET @a $car_1_passenger_3\nSET @($c) $car_1_passenger_3\nSET @d_1 $car_1_passenger_3\nSET @($d + $a) $car_1_passenger_3\nFIN\n'],

        [`struct KOMBI { long driver; long collector; long passenger[4]; } car[2];
long a, b, *c, d[2];\n
car[1].passenger[a]='Ze';
car[1].passenger[a]=a;
car[1].passenger[a]=*c;
car[1].passenger[a]=d[1];
car[1].passenger[a]=d[a];
car[1].passenger[a]=car[0].driver;
car[1].passenger[a]=car[0].passenger[b];\n
a=car[1].passenger[b];
*c=car[1].passenger[b];
d[1]=car[1].passenger[b];
d[a]=car[1].passenger[b];`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^const SET @car_0_passenger #0000000000000007\n^declare car_0_passenger_0\n^declare car_0_passenger_1\n^declare car_0_passenger_2\n^declare car_0_passenger_3\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^const SET @car_1_passenger #000000000000000e\n^declare car_1_passenger_0\n^declare car_1_passenger_1\n^declare car_1_passenger_2\n^declare car_1_passenger_3\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000016\n^declare d_0\n^declare d_1\n\nSET @r0 #000000000000655a\nSET @($car_1_passenger + $a) $r0\nSET @($car_1_passenger + $a) $a\nSET @r0 $($c)\nSET @($car_1_passenger + $a) $r0\nSET @($car_1_passenger + $a) $d_1\nSET @r0 $($d + $a)\nSET @($car_1_passenger + $a) $r0\nSET @($car_1_passenger + $a) $car_0_driver\nSET @r0 $($car_0_passenger + $b)\nSET @($car_1_passenger + $a) $r0\nSET @a $($car_1_passenger + $b)\nSET @r0 $($car_1_passenger + $b)\nSET @($c) $r0\nSET @d_1 $($car_1_passenger + $b)\nSET @r0 $($car_1_passenger + $b)\nSET @($d + $a) $r0\nFIN\n'],

        [`struct KOMBI { long driver; long collector; long passenger[4]; } car[2];
long a, b, *c, d[2];\n
car[b].passenger[a]='Ze';
car[b].passenger[a]=a;
car[b].passenger[a]=*c;
car[b].passenger[a]=d[1];
car[b].passenger[a]=d[a];
car[b].passenger[a]=car[b].driver;
car[b].passenger[a]=car[b].passenger[b];\n
a=car[a].passenger[b];
*c=car[a].passenger[b];
d[1]=car[a].passenger[b];
d[a]=car[a].passenger[b];`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^const SET @car_0_passenger #0000000000000007\n^declare car_0_passenger_0\n^declare car_0_passenger_1\n^declare car_0_passenger_2\n^declare car_0_passenger_3\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^const SET @car_1_passenger #000000000000000e\n^declare car_1_passenger_0\n^declare car_1_passenger_1\n^declare car_1_passenger_2\n^declare car_1_passenger_3\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000016\n^declare d_0\n^declare d_1\n\nSET @r0 $b\nSET @r1 #0000000000000007\nMUL @r0 $r1\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $a\nSET @r1 #000000000000655a\nSET @($car + $r0) $r1\nSET @r0 $b\nSET @r1 #0000000000000007\nMUL @r0 $r1\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $a\nSET @($car + $r0) $a\nSET @r0 $b\nSET @r1 #0000000000000007\nMUL @r0 $r1\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $a\nSET @r1 $($c)\nSET @($car + $r0) $r1\nSET @r0 $b\nSET @r1 #0000000000000007\nMUL @r0 $r1\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $a\nSET @($car + $r0) $d_1\nSET @r0 $b\nSET @r1 #0000000000000007\nMUL @r0 $r1\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $a\nSET @r1 $($d + $a)\nSET @($car + $r0) $r1\nSET @r0 $b\nSET @r1 #0000000000000007\nMUL @r0 $r1\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $a\nSET @r1 $b\nSET @r2 #0000000000000007\nMUL @r1 $r2\nSET @r2 $($car + $r1)\nSET @($car + $r0) $r2\nSET @r0 $b\nSET @r1 #0000000000000007\nMUL @r0 $r1\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $a\nSET @r1 $b\nSET @r2 #0000000000000007\nMUL @r1 $r2\nSET @r2 #0000000000000003\nADD @r1 $r2\nADD @r1 $b\nSET @r2 $($car + $r1)\nSET @($car + $r0) $r2\nSET @r0 $a\nSET @r1 #0000000000000007\nMUL @r0 $r1\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $b\nSET @a $($car + $r0)\nSET @r0 $a\nSET @r1 #0000000000000007\nMUL @r0 $r1\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $b\nSET @r1 $($car + $r0)\nSET @($c) $r1\nSET @d_1 $a\nSET @r0 #0000000000000007\nMUL @d_1 $r0\nSET @r0 #0000000000000003\nADD @d_1 $r0\nADD @d_1 $b\nSET @d_1 $($car + $d_1)\nSET @r0 $a\nSET @r1 #0000000000000007\nMUL @r0 $r1\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $b\nSET @r1 $($car + $r0)\nSET @($d + $a) $r1\nFIN\n'],

        // STRUCT POINTER
        ['Struct (pointer)', null, 'div'],
        [`struct KOMBI { long driver; long collector; long passenger; } ;
struct KOMBI car, *pcar;
long a, b, *c, d[2];
pcar=&car;\n
pcar->passenger='Ze';
pcar->driver=a;
pcar->driver=*c;
pcar->driver=d[1];
pcar->driver=d[a];
pcar->driver=pcar->collector;\n
a=pcar->collector;
*c=pcar->collector;
d[1]=pcar->collector;
d[a]=pcar->collector;`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^declare pcar\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #000000000000000b\n^declare d_0\n^declare d_1\n\nSET @pcar #0000000000000003\nSET @r0 #0000000000000002\nSET @r1 #000000000000655a\nSET @($pcar + $r0) $r1\nCLR @r0\nSET @($pcar + $r0) $a\nCLR @r0\nSET @r1 $($c)\nSET @($pcar + $r0) $r1\nCLR @r0\nSET @($pcar + $r0) $d_1\nCLR @r0\nSET @r1 $($d + $a)\nSET @($pcar + $r0) $r1\nCLR @r0\nSET @r1 #0000000000000001\nSET @r2 $($pcar + $r1)\nSET @($pcar + $r0) $r2\nSET @a #0000000000000001\nSET @a $($pcar + $a)\nSET @r0 #0000000000000001\nSET @r1 $($pcar + $r0)\nSET @($c) $r1\nSET @d_1 #0000000000000001\nSET @d_1 $($pcar + $d_1)\nSET @r0 #0000000000000001\nSET @r1 $($pcar + $r0)\nSET @($d + $a) $r1\nFIN\n'],

        [`struct KOMBI { long driver; long collector; long passenger[4]; } ;
struct KOMBI car, *pcar;
long a, b, *c, d[2];
pcar=&car;\n
pcar->passenger[2]='Ze';
pcar->passenger[2]=a;
pcar->passenger[2]=*c;
pcar->passenger[2]=d[1];
pcar->passenger[2]=d[a];
pcar->passenger[2]=pcar->collector;
pcar->passenger[2]=pcar->passenger[1];\n
a=pcar->passenger[2];
*c=pcar->passenger[2];
d[1]=pcar->passenger[2];
d[a]=pcar->passenger[2];`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^const SET @car_passenger #0000000000000006\n^declare car_passenger_0\n^declare car_passenger_1\n^declare car_passenger_2\n^declare car_passenger_3\n^declare pcar\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #000000000000000f\n^declare d_0\n^declare d_1\n\nSET @pcar #0000000000000003\nSET @r0 #0000000000000005\nSET @r1 #000000000000655a\nSET @($pcar + $r0) $r1\nSET @r0 #0000000000000005\nSET @($pcar + $r0) $a\nSET @r0 #0000000000000005\nSET @r1 $($c)\nSET @($pcar + $r0) $r1\nSET @r0 #0000000000000005\nSET @($pcar + $r0) $d_1\nSET @r0 #0000000000000005\nSET @r1 $($d + $a)\nSET @($pcar + $r0) $r1\nSET @r0 #0000000000000005\nSET @r1 #0000000000000001\nSET @r2 $($pcar + $r1)\nSET @($pcar + $r0) $r2\nSET @r0 #0000000000000005\nSET @r1 #0000000000000004\nSET @r2 $($pcar + $r1)\nSET @($pcar + $r0) $r2\nSET @a #0000000000000005\nSET @a $($pcar + $a)\nSET @r0 #0000000000000005\nSET @r1 $($pcar + $r0)\nSET @($c) $r1\nSET @d_1 #0000000000000005\nSET @d_1 $($pcar + $d_1)\nSET @r0 #0000000000000005\nSET @r1 $($pcar + $r0)\nSET @($d + $a) $r1\nFIN\n'],

        [`struct KOMBI { long driver; long collector; long passenger[4]; } ;
struct KOMBI car[2], *pcar;
long a, b, *c, d[2];
pcar=&car[a];`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^const SET @car_0_passenger #0000000000000007\n^declare car_0_passenger_0\n^declare car_0_passenger_1\n^declare car_0_passenger_2\n^declare car_0_passenger_3\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^const SET @car_1_passenger #000000000000000e\n^declare car_1_passenger_0\n^declare car_1_passenger_1\n^declare car_1_passenger_2\n^declare car_1_passenger_3\n^declare pcar\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000017\n^declare d_0\n^declare d_1\n\nSET @r0 $a\nSET @r1 #0000000000000007\nMUL @r0 $r1\nSET @r1 $car\nADD @r1 $r0\nSET @pcar $r1\nFIN\n'],

        [`struct KOMBI { long driver; long collector; long passenger[4]; } ;
struct KOMBI car, *pcar;
long a, b, *c, d[2];
pcar=&car;\n
pcar->passenger[a]='Ze';
pcar->passenger[a]=a;
pcar->passenger[a]=*c;
pcar->passenger[a]=d[1];
pcar->passenger[a]=d[a];
pcar->passenger[a]=pcar->collector;
pcar->passenger[a]=pcar->passenger[b];\n
a=pcar->passenger[b];
*c=pcar->passenger[b];
d[1]=pcar->passenger[b];
d[a]=pcar->passenger[b];`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^const SET @car_passenger #0000000000000006\n^declare car_passenger_0\n^declare car_passenger_1\n^declare car_passenger_2\n^declare car_passenger_3\n^declare pcar\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #000000000000000f\n^declare d_0\n^declare d_1\n\nSET @pcar #0000000000000003\nSET @r0 $a\nSET @r1 #0000000000000003\nADD @r0 $r1\nSET @r1 #000000000000655a\nSET @($pcar + $r0) $r1\nSET @r0 $a\nSET @r1 #0000000000000003\nADD @r0 $r1\nSET @($pcar + $r0) $a\nSET @r0 $a\nSET @r1 #0000000000000003\nADD @r0 $r1\nSET @r1 $($c)\nSET @($pcar + $r0) $r1\nSET @r0 $a\nSET @r1 #0000000000000003\nADD @r0 $r1\nSET @($pcar + $r0) $d_1\nSET @r0 $a\nSET @r1 #0000000000000003\nADD @r0 $r1\nSET @r1 $($d + $a)\nSET @($pcar + $r0) $r1\nSET @r0 $a\nSET @r1 #0000000000000003\nADD @r0 $r1\nSET @r1 #0000000000000001\nSET @r2 $($pcar + $r1)\nSET @($pcar + $r0) $r2\nSET @r0 $a\nSET @r1 #0000000000000003\nADD @r0 $r1\nSET @r1 $b\nSET @r2 #0000000000000003\nADD @r1 $r2\nSET @r2 $($pcar + $r1)\nSET @($pcar + $r0) $r2\nSET @a $b\nSET @r0 #0000000000000003\nADD @a $r0\nSET @a $($pcar + $a)\nSET @r0 $b\nSET @r1 #0000000000000003\nADD @r0 $r1\nSET @r1 $($pcar + $r0)\nSET @($c) $r1\nSET @d_1 $b\nSET @r0 #0000000000000003\nADD @d_1 $r0\nSET @d_1 $($pcar + $d_1)\nSET @r0 $b\nSET @r1 #0000000000000003\nADD @r0 $r1\nSET @r1 $($pcar + $r0)\nSET @($d + $a) $r1\nFIN\n'],

        ['Logical operations with arrays and structs', null, 'div'],
        ['long a[2], b; if (a[b]) { b++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare b\n\nSET @r0 $($a + $b)\nBZR $r0 :__if1_endif\n__if1_start:\nINC @b\n__if1_endif:\nFIN\n'],
        ['long a[2], b; if (!(a[b])) { b++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare b\n\nSET @r0 $($a + $b)\nBNZ $r0 :__if1_endif\n__if1_start:\nINC @b\n__if1_endif:\nFIN\n'],
        ['long a[2], b; if (!a[b]) { b++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare b\n\nSET @r0 $($a + $b)\nBNZ $r0 :__if1_endif\n__if1_start:\nINC @b\n__if1_endif:\nFIN\n'],
        [`struct KOMBI { long driver; long collector; long passenger; } car;
long a, b;
if (car.driver=='Ze') { b++; }
if (a<=car.collector) { b--; }`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^declare a\n^declare b\n\nSET @r0 #000000000000655a\nBNE $car_driver $r0 :__if1_endif\n__if1_start:\nINC @b\n__if1_endif:\nBGT $a $car_collector :__if2_endif\n__if2_start:\nDEC @b\n__if2_endif:\nFIN\n'],
        [`struct KOMBI { long driver; long collector; long passenger; } car[2];
long a, b;
if (car[1].driver=='Ze') { b++; }
if (a<=car[0].collector) { b--; }`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^declare a\n^declare b\n\nSET @r0 #000000000000655a\nBNE $car_1_driver $r0 :__if1_endif\n__if1_start:\nINC @b\n__if1_endif:\nBGT $a $car_0_collector :__if2_endif\n__if2_start:\nDEC @b\n__if2_endif:\nFIN\n'],
        [`struct KOMBI { long driver; long collector; long passenger; } car[2];
long a, b;
if (car[b].driver=='Ze') { b++; }
if (a<=car[b].collector) { b--; }`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^declare a\n^declare b\n\nSET @r0 $b\nSET @r1 #0000000000000003\nMUL @r0 $r1\nSET @r1 $($car + $r0)\nSET @r2 #000000000000655a\nBNE $r1 $r2 :__if1_endif\n__if1_start:\nINC @b\n__if1_endif:\nSET @r0 $b\nSET @r1 #0000000000000003\nMUL @r0 $r1\nINC @r0\nSET @r1 $($car + $r0)\nBGT $a $r1 :__if2_endif\n__if2_start:\nDEC @b\n__if2_endif:\nFIN\n'],
        [`struct KOMBI { long driver; long collector; long passenger[3]; } car;
long a, b;
if (car.passenger[0]=='Ze') { b++; }
if (a<=car.passenger[2]) { b--; }`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^const SET @car_passenger #0000000000000006\n^declare car_passenger_0\n^declare car_passenger_1\n^declare car_passenger_2\n^declare a\n^declare b\n\nSET @r0 #000000000000655a\nBNE $car_passenger_0 $r0 :__if1_endif\n__if1_start:\nINC @b\n__if1_endif:\nBGT $a $car_passenger_2 :__if2_endif\n__if2_start:\nDEC @b\n__if2_endif:\nFIN\n'],
        [`struct KOMBI { long driver; long collector; long passenger[3]; } car[2];
long a, b;
if (car[0].passenger[0]=='Ze') { b++; }
if (a<=car[b].passenger[2]) { b--; }`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^const SET @car_0_passenger #0000000000000007\n^declare car_0_passenger_0\n^declare car_0_passenger_1\n^declare car_0_passenger_2\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^const SET @car_1_passenger #000000000000000d\n^declare car_1_passenger_0\n^declare car_1_passenger_1\n^declare car_1_passenger_2\n^declare a\n^declare b\n\nSET @r0 #000000000000655a\nBNE $car_0_passenger_0 $r0 :__if1_endif\n__if1_start:\nINC @b\n__if1_endif:\nSET @r0 $b\nSET @r1 #0000000000000006\nMUL @r0 $r1\nSET @r1 #0000000000000003\nADD @r0 $r1\nINC @r0\nINC @r0\nSET @r1 $($car + $r0)\nBGT $a $r1 :__if2_endif\n__if2_start:\nDEC @b\n__if2_endif:\nFIN\n'],
        [`struct KOMBI { long driver; long collector; long passenger[3]; } car[2];
long a, b;
if (car[0].passenger[b]=='Ze') { b++; }
if (a<=car[b].passenger[a]) { b--; }`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^const SET @car_0_passenger #0000000000000007\n^declare car_0_passenger_0\n^declare car_0_passenger_1\n^declare car_0_passenger_2\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^const SET @car_1_passenger #000000000000000d\n^declare car_1_passenger_0\n^declare car_1_passenger_1\n^declare car_1_passenger_2\n^declare a\n^declare b\n\nSET @r0 $($car_0_passenger + $b)\nSET @r1 #000000000000655a\nBNE $r0 $r1 :__if1_endif\n__if1_start:\nINC @b\n__if1_endif:\nSET @r0 $b\nSET @r1 #0000000000000006\nMUL @r0 $r1\nSET @r1 #0000000000000003\nADD @r0 $r1\nADD @r0 $a\nSET @r1 $($car + $r0)\nBGT $a $r1 :__if2_endif\n__if2_start:\nDEC @b\n__if2_endif:\nFIN\n'],
        [`struct KOMBI { long driver; long collector; long passenger; } ;
struct KOMBI car[2], *pcar;
long a, b;
pcar=&car[1];
if (pcar->driver=='Ze') { b++; }
if (a<=pcar->collector) { b--; }`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^declare pcar\n^declare a\n^declare b\n\nSET @pcar #0000000000000007\nCLR @r0\nSET @r1 $($pcar + $r0)\nSET @r2 #000000000000655a\nBNE $r1 $r2 :__if1_endif\n__if1_start:\nINC @b\n__if1_endif:\nSET @r0 #0000000000000001\nSET @r1 $($pcar + $r0)\nBGT $a $r1 :__if2_endif\n__if2_start:\nDEC @b\n__if2_endif:\nFIN\n'],

        //    [ "",  false,"" ],

        // MemTable: general
        ['General', null, 'div'],
        ['long a;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nFIN\n'],
        ['long a=3;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #0000000000000003\nFIN\n'],
        ['long a,b;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nFIN\n'],
        ['long a,b=3;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @b #0000000000000003\nFIN\n'],
        ['long * a;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nFIN\n'],
        ['long a[3];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n\nFIN\n'],
        ['long a[3]; a[0]=9;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n\nSET @a_0 #0000000000000009\nFIN\n'],
        ['long a[3]; a=9;', true, ''],
        ['Functions', null, 'div'],
        ['long a; void main(void) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nJMP :__fn_main\n\n__fn_main:\nPCS\nINC @a\nFIN\n'],
        ['long a; void main(void) { a++; return; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nJMP :__fn_main\n\n__fn_main:\nPCS\nINC @a\nFIN\n'],
        ['long a; void main(void) { a++; return; a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nJMP :__fn_main\n\n__fn_main:\nPCS\nINC @a\nFIN\nINC @a\nFIN\n'],
        ['long a; void test(void) { a++; return; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nFIN\n\n__fn_test:\nINC @a\nRET\n'],
        ['long a; void test(void) { a++; return; a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nFIN\n\n__fn_test:\nINC @a\nRET\nINC @a\nRET\n'],
        ['long a; test(); void test(void) { a++; return; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nJSR :__fn_test\nFIN\n\n__fn_test:\nINC @a\nRET\n'],
        ['long a; a=test(); void test(void) { a++; return; }', true, ''],
        ['long a; void test2(long b) { b++; return; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare test2_b\n\nFIN\n\n__fn_test2:\nPOP @test2_b\nINC @test2_b\nRET\n'],
        ['long a; long test2(long b) { b++; return b; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare test2_b\n\nFIN\n\n__fn_test2:\nPOP @test2_b\nINC @test2_b\nPSH $test2_b\nRET\n'],
        ['long a=0; a=test2(a); long test2(long b) { b++; return b; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare test2_b\n\nCLR @a\nPSH $a\nJSR :__fn_test2\nPOP @r0\nSET @a $r0\nFIN\n\n__fn_test2:\nPOP @test2_b\nINC @test2_b\nPSH $test2_b\nRET\n'],
        ['#pragma warningToError false\nlong a=0; test2(a); long test2(long b) { b++; return b; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare test2_b\n\nCLR @a\nPSH $a\nJSR :__fn_test2\nPOP @r0\nFIN\n\n__fn_test2:\nPOP @test2_b\nINC @test2_b\nPSH $test2_b\nRET\n'],
        ['long a=0; void main(void){ a++; test2(a); exit; } void test2(long b) { b++; return; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare test2_b\n\nCLR @a\nJMP :__fn_main\n\n__fn_main:\nPCS\nINC @a\nPSH $a\nJSR :__fn_test2\nFIN\n\n__fn_test2:\nPOP @test2_b\nINC @test2_b\nRET\n'],
        ['#include APIFunctions\nlong a;Set_A1(a);', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nFUN set_A1 $a\nFIN\n'],
        ['#include APIFunctions\nSet_A1();', true, ''],
        ['long *a; a=test(); long *test(void) { long b; return &b; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare test_b\n\nJSR :__fn_test\nPOP @a\nFIN\n\n__fn_test:\nSET @r0 #0000000000000004\nPSH $r0\nRET\n'],
        ['long a; a=test(); long *test(void) { long b; return &b; }', true, ''],
        ['long *a; a=test(); long *test(void) { long b; return b; }', true, ''],
        ['struct KOMBI { long driver; long collector; long passenger; } car, car2; car = teste(); struct KOMBI teste(void){ return car; }', true, ''],
        ['Declarations', null, 'div'],
        ['long ,b;', true, ''],

        ['Improvements v0.3', null, ''],
        [
            // Function returning struct pointer
            'struct KOMBI { long driver, collector, passenger; } *val; val = teste(); val = test2(); struct KOMBI *teste(void) { struct KOMBI tt2; return &tt2; } struct KOMBI *test2(void) { struct KOMBI *stt2; return stt2; }',
            false,
            '^declare r0\n^declare r1\n^declare r2\n^declare val\n^declare teste_tt2_driver\n^declare teste_tt2_collector\n^declare teste_tt2_passenger\n^declare test2_stt2\n\nJSR :__fn_teste\nPOP @r0\nSET @val $r0\nJSR :__fn_test2\nPOP @r0\nSET @val $r0\nFIN\n\n__fn_teste:\nSET @r0 #0000000000000004\nPSH $r0\nRET\n\n__fn_test2:\nPSH $test2_stt2\nRET\n'
        ],
        [
            // Error check Function return pointer
            'struct KOMBI { long driver, collector, passenger; } *val; val = teste(); struct KOMBI *teste(void) { struct KOMBI tt2; return tt2; }',
            true,
            ''
        ],

        // globalOptimization
        ['globalOptimization', null, 'div'],
        ['#pragma globalOptimization\nlong a,b; for (a=0;a<10;a++) { b++; } b--;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nCLR @a\n__loop1_condition:\nSET @r0 #000000000000000a\nBGE $a $r0 :__loop1_break\nINC @b\nINC @a\nJMP :__loop1_condition\n__loop1_break:\nDEC @b\nFIN\n'],
        ['#pragma globalOptimization\nlong a,b; while (b) {a++; while (1) { if (a) break;  } } a++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n__loop1_continue:\nBZR $b :__loop1_break\nINC @a\n__loop2_continue:\nBZR $a :__loop2_continue\nJMP :__loop1_continue\n__loop1_break:\nINC @a\nFIN\n'],
        ['#pragma globalOptimization\nlong a,b; if (!b) {a++; } b++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBNZ $b :__if1_endif\nINC @a\n__if1_endif:\nINC @b\nFIN\n'],
        ['#pragma globalOptimization\nlong a,b; void main (void) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\n\nPCS\nINC @a\nFIN\n'],
        ['#pragma globalOptimization\nlong a,b; if (!b) {a++; } else { b++;} ', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBNZ $b :__if1_else\nINC @a\nFIN\n__if1_else:\nINC @b\nFIN\n'],
        ['#pragma globalOptimization\nlong a,b; test(); void test (void) { if (a) a++; else b++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nJSR :__fn_test\nFIN\n\n__fn_test:\nBZR $a :__if1_else\nINC @a\nRET\n__if1_else:\nINC @b\nRET\n'],
        ['#pragma globalOptimization\nlong a,b; test(); exit; a++; void test (void) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nJSR :__fn_test\nFIN\n\n__fn_test:\nINC @a\nRET\n'],
        ['#pragma globalOptimization\nlong a,b; test(); void test (void) { return; a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nJSR :__fn_test\nFIN\n\n__fn_test:\nRET\n'],
        ['#pragma globalOptimization\nlong a,b; test(); void test (void) { if (a) a++; else b++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nJSR :__fn_test\nFIN\n\n__fn_test:\nBZR $a :__if1_else\nINC @a\nRET\n__if1_else:\nINC @b\nRET\n'],
        ['#pragma globalOptimization\nlong a, b, c, d; a=(b*c)*d;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nSET @a $b\nMUL @a $c\nMUL @a $d\nFIN\n'],
        ['#pragma globalOptimization\nlong a[4][2], *b, c,d; b=&a[c][d];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n^declare c\n^declare d\n\nSET @b $c\nSET @r0 #0000000000000002\nMUL @b $r0\nADD @b $d\nADD @b $a\nFIN\n'],
        ['#pragma globalOptimization\nlong a[4][2], *b, c,d; b=&a[c][d];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare a_5\n^declare a_6\n^declare a_7\n^declare b\n^declare c\n^declare d\n\nSET @b $c\nSET @r0 #0000000000000002\nMUL @b $r0\nADD @b $d\nADD @b $a\nFIN\n'],

        ['#pragma globalOptimization\n long a; a=0; void test(void){ a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nCLR @a\nFIN\n\n'],
        [`#pragma globalOptimization\nstruct KOMBI { long driver; long collector; long passenger; } ;struct KOMBI car, *pcar;long a, b, *c, d[2],z;pcar=&car;
pcar->passenger='Ze';
pcar->driver=a;
b+=-a;
a=0;
d[a]=5;
for (a=0;a<10;a++) d[a]=1;\n
pcar->driver=*c;pcar->driver=d[1];pcar->driver=d[a];pcar->driver=pcar->collector;
a=pcar->collector;z++;*c=pcar->driver;d[1]=pcar->collector;d[a]=pcar->collector;`, false, '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^declare pcar\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #000000000000000b\n^declare d_0\n^declare d_1\n^declare z\n\nSET @pcar #0000000000000003\nSET @r0 #0000000000000002\nSET @r1 #000000000000655a\nSET @($pcar + $r0) $r1\nSET @($pcar) $a\nCLR @r0\nSUB @r0 $a\nADD @b $r0\nSET @r0 #0000000000000005\nSET @($d) $r0\nCLR @a\n__loop1_condition:\nSET @r0 #000000000000000a\nBGE $a $r0 :__loop1_break\nSET @r0 #0000000000000001\nSET @($d + $a) $r0\nINC @a\nJMP :__loop1_condition\n__loop1_break:\nSET @r1 $($c)\nSET @($pcar) $r1\nSET @($pcar) $d_1\nSET @r1 $($d + $a)\nSET @($pcar) $r1\nSET @r1 #0000000000000001\nSET @r2 $($pcar + $r1)\nSET @($pcar) $r2\nSET @a #0000000000000001\nSET @a $($pcar + $a)\nINC @z\nSET @r1 $($pcar)\nSET @($c) $r1\nSET @d_1 #0000000000000001\nSET @d_1 $($pcar + $d_1)\nSET @r0 #0000000000000001\nSET @r1 $($pcar + $r0)\nSET @($d + $a) $r1\nFIN\n'],
        ['#pragma globalOptimization\n long d[2]; d[1]=d[1]+1;', false, '^declare r0\n^declare r1\n^declare r2\n^declare d\n^const SET @d #0000000000000004\n^declare d_0\n^declare d_1\n\nINC @d_1\nFIN\n'],
        [`#pragma globalOptimization\n#pragma maxConstVars 3\nstruct KOMBI { long driver; long collector; long passenger; } ;struct KOMBI car, *pcar;long a, b, *c, d[2],z;pcar=&car;
pcar->passenger='Ze';
pcar->driver=a;
b+=-a;
a=0;
d[a]=5;
for (a=0;a<10;a++) d[a]=1;\n
pcar->driver=*c;pcar->driver=d[1];pcar->driver=d[a];pcar->driver=pcar->collector;
a=pcar->collector;z++;*c=pcar->driver;d[1]=pcar->collector;d[a]=pcar->collector;`, false, '^declare r0\n^declare r1\n^declare r2\n^declare n1\n^const SET @n1 #0000000000000001\n^declare n2\n^const SET @n2 #0000000000000002\n^declare n3\n^const SET @n3 #0000000000000003\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^declare pcar\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #000000000000000e\n^declare d_0\n^declare d_1\n^declare z\n\nSET @pcar #0000000000000006\nSET @r1 #000000000000655a\nSET @($pcar + $n2) $r1\nSET @($pcar) $a\nCLR @r0\nSUB @r0 $a\nADD @b $r0\nSET @r0 #0000000000000005\nSET @($d) $r0\nCLR @a\n__loop1_condition:\nSET @r0 #000000000000000a\nBGE $a $r0 :__loop1_break\nSET @($d + $a) $n1\nINC @a\nJMP :__loop1_condition\n__loop1_break:\nSET @r1 $($c)\nSET @($pcar) $r1\nSET @($pcar) $d_1\nSET @r1 $($d + $a)\nSET @($pcar) $r1\nSET @r2 $($pcar + $n1)\nSET @($pcar) $r2\nSET @a $($pcar + $n1)\nINC @z\nSET @r1 $($pcar)\nSET @($c) $r1\nSET @d_1 $($pcar + $n1)\nSET @r1 $($pcar + $n1)\nSET @($d + $a) $r1\nFIN\n'],
        ['#pragma globalOptimization\n#pragma maxConstVars 3\nlong a, b, c; teste(a, 2); void teste(long aa, long bb) { aa=bb;} ', false, '^declare r0\n^declare r1\n^declare r2\n^declare n1\n^const SET @n1 #0000000000000001\n^declare n2\n^const SET @n2 #0000000000000002\n^declare n3\n^const SET @n3 #0000000000000003\n^declare a\n^declare b\n^declare c\n^declare teste_aa\n^declare teste_bb\n\nPSH $n2\nPSH $a\nJSR :__fn_teste\nFIN\n\n__fn_teste:\nPOP @teste_aa\nPOP @teste_bb\nSET @teste_aa $teste_bb\nRET\n'],
        ['#pragma globalOptimization\n#pragma maxConstVars 3\nsleep 1;', false, '^declare r0\n^declare r1\n^declare r2\n^declare n1\n^const SET @n1 #0000000000000001\n^declare n2\n^const SET @n2 #0000000000000002\n^declare n3\n^const SET @n3 #0000000000000003\n\nSLP $n1\nFIN\n'],
        ['#pragma globalOptimization\n long a,b; if ( a==4 && (b || a )) { a++; a=4;} b++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 #0000000000000004\nBNE $a $r0 :__if1_endif\nBNZ $b :__if1_start\nBZR $a :__if1_endif\n__if1_start:\nINC @a\nSET @a #0000000000000004\n__if1_endif:\nINC @b\nFIN\n'],
        ['#pragma globalOptimization\n long a,b, c; if ( a==4 && (b || a>c )) { a++; a=4; } b++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n\nSET @r0 #0000000000000004\nBNE $a $r0 :__if1_endif\nBNZ $b :__if1_start\nBLE $a $c :__if1_endif\n__if1_start:\nINC @a\nSET @a #0000000000000004\n__if1_endif:\nINC @b\nFIN\n'],
        ['#pragma globalOptimization\n long a; a=~a;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nNOT @a\nFIN\n'],
        ['#pragma globalOptimization\n long a, b; tt(teste(b)); long teste(long c){ return ++c; } void tt(long d){ d++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare teste_c\n^declare tt_d\n\nPSH $b\nJSR :__fn_teste\nJSR :__fn_tt\nFIN\n\n__fn_teste:\nPOP @teste_c\nINC @teste_c\nPSH $teste_c\nRET\n\n__fn_tt:\nPOP @tt_d\nINC @tt_d\nRET\n'],
        ['#pragma globalOptimization\n long a, b; /* No opt: interference with reuseVariable */ a=teste(teste(b)); tt(a); long teste(long c){ return ++c; } void tt(long d){ d++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare teste_c\n^declare tt_d\n\nPSH $b\nJSR :__fn_teste\nPOP @a\nPSH $a\nJSR :__fn_teste\nPOP @a\nPSH $a\nJSR :__fn_tt\nFIN\n\n__fn_teste:\nPOP @teste_c\nINC @teste_c\nPSH $teste_c\nRET\n\n__fn_tt:\nPOP @tt_d\nINC @tt_d\nRET\n'],
        //    [ "", false, "" ],

        // const keyword
        ['const keyword', null, 'div'],
        ['struct KOMBI { long driver; long collector; long passenger[4]; } car[2]; long a, b, *c, d[2];\nconst a=353; const d[1]=354; const car[1].driver=355; const car[0].passenger[1]=356;', false, '^declare r0\n^declare r1\n^declare r2\n^declare car\n^const SET @car #0000000000000004\n^declare car_0_driver\n^declare car_0_collector\n^declare car_0_passenger\n^const SET @car_0_passenger #0000000000000007\n^declare car_0_passenger_0\n^declare car_0_passenger_1\n^declare car_0_passenger_2\n^declare car_0_passenger_3\n^declare car_1_driver\n^declare car_1_collector\n^declare car_1_passenger\n^const SET @car_1_passenger #000000000000000e\n^declare car_1_passenger_0\n^declare car_1_passenger_1\n^declare car_1_passenger_2\n^declare car_1_passenger_3\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000016\n^declare d_0\n^declare d_1\n\n^const SET @a #0000000000000161\n^const SET @d_1 #0000000000000162\n^const SET @car_1_driver #0000000000000163\n^const SET @car_0_passenger_1 #0000000000000164\nFIN\n'],
        ['long a, b, *c, d[2]; a++; const long e=5; a++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000007\n^declare d_0\n^declare d_1\n^declare e\n\nINC @a\n^const SET @e #0000000000000005\nINC @a\nFIN\n'],
        ['long a, b, *c, d[2]; a++; const long e=5; a++; e++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000007\n^declare d_0\n^declare d_1\n^declare e\n\nINC @a\n^const SET @e #0000000000000005\nINC @a\nINC @e\nFIN\n'],
        ['long a, b, *c, d[2]; a++; const long e=5; const a=2;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000007\n^declare d_0\n^declare d_1\n^declare e\n\nINC @a\n^const SET @e #0000000000000005\n^const SET @a #0000000000000002\nFIN\n'],
        ['long a, b, *c, d[2]; a++; const b=3+3+4;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000007\n^declare d_0\n^declare d_1\n\nINC @a\n^const SET @b #000000000000000a\nFIN\n'],
        ['long a, b, *c, d[2]; const d=&a;', true, ''],
        ['long a, b, *c, d[2]; const long e=3; a++; const e=4;', true, ''],
        ['long a, b, *c, d[2]; a++; const b=3+3+4;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n^const SET @d #0000000000000007\n^declare d_0\n^declare d_1\n\nINC @a\n^const SET @b #000000000000000a\nFIN\n'],
        // when const declaration in multilong assigment, change CLR to SET #0
        ["long a[3]; const a[]='alow'; a[]='tchau';", false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n\n^const SET @a_0 #00000000776f6c61\n^const SET @a_1 #0000000000000000\n^const SET @a_2 #0000000000000000\nSET @a_0 #0000007561686374\nCLR @a_1\nCLR @a_2\nFIN\n'],
        // After above optimizations, this code was being executed wrong
        ['long a, b[5]; b[]=&a;', true, ''],
        //    [ "", false, "" ],

        // program macro
        ['macro program', null, 'div'],
        ['#program name tEst2\n long a;  a++;', false, '^program name tEst2\n^declare r0\n^declare r1\n^declare r2\n^declare a\n\nINC @a\nFIN\n'],
        ['#program description test teste tesssttt\n long a;  a++;', false, '^program description test teste tesssttt\n^declare r0\n^declare r1\n^declare r2\n^declare a\n\nINC @a\nFIN\n'],
        ['#program activationAmount 100000\n long a;  a++;', false, '^program activationAmount 100000\n^declare r0\n^declare r1\n^declare r2\n^declare a\n\nINC @a\nFIN\n'],
        ['#program name test-2\n long a;  a++;', true, ''],
        ['#program name test2 d\n long a;  a++;', true, ''],
        ['#program activationAmount 0xff\n long a;  a++;', true, ''],
        // allow _ in activationAmount
        ['#program activationAmount 5_0000_0000', false, '^program activationAmount 500000000\n^declare r0\n^declare r1\n^declare r2\n\nFIN\n'],
        //    [ "", false, "" ],

        // define macro
        ['macro define', null, 'div'],
        ['#define MAX 4\nlong a; a=MAX; long MAXimus=2;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare MAXimus\n\nSET @a #0000000000000004\nSET @MAXimus #0000000000000002\nFIN\n'],
        ['#define MAX 4\n long a; a=MAX;\n #define MAX 2\n long MAXimus=MAX;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare MAXimus\n\nSET @a #0000000000000004\nSET @MAXimus #0000000000000002\nFIN\n'],
        ['#define MAX 4\n long a; a=MAX;\n #define MAX \n long MAXimus=MAX;', true, ''],
        ['#define 444 4\nlong a; a=444;\n #undef 444\nlong MAXimus=444;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare MAXimus\n\nSET @a #0000000000000004\nSET @MAXimus #00000000000001bc\nFIN\n'],
        ['#define MAX 4\n#define MAX1 (MAX + 1)\n long a; if (a > MAX1) a++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 #0000000000000005\nBLE $a $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        ['#define MAX 4\n#define MAX1 (MAX + 1)\n#undef MAX\n long a; if (a > MAX1) a++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 #0000000000000005\nBLE $a $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        //    [ "", false, "" ],

        // bugfixes
        ['Bug fixes', null, 'div'],
        // bug 1, goto failed with undeclared variable
        ['void  teste(long ret) { long temp = 2; goto newlabel; ret = temp; newlabel: temp++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare teste_ret\n^declare teste_temp\n\nFIN\n\n__fn_teste:\nPOP @teste_ret\nSET @teste_temp #0000000000000002\nJMP :newlabel\nSET @teste_ret $teste_temp\nnewlabel:\nINC @teste_temp\nRET\n'],
        // bug 2, failed when declaring pointer on function declaration
        ['void  teste(long * ret) { long temp = 2; goto newlabel; ret[temp] = temp; newlabel: temp++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare teste_ret\n^declare teste_temp\n\nFIN\n\n__fn_teste:\nPOP @teste_ret\nSET @teste_temp #0000000000000002\nJMP :newlabel\nSET @($teste_ret + $teste_temp) $teste_temp\nnewlabel:\nINC @teste_temp\nRET\n'],
        ['void  teste(long * ret) { long temp = 2; goto newlabel; *(ret+temp) = temp; newlabel: temp++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare teste_ret\n^declare teste_temp\n\nFIN\n\n__fn_teste:\nPOP @teste_ret\nSET @teste_temp #0000000000000002\nJMP :newlabel\nSET @r0 $teste_ret\nADD @r0 $teste_temp\nSET @($r0) $teste_temp\nnewlabel:\nINC @teste_temp\nRET\n'],
        // bug 3, ReuseAssignedVar not working inside a function.
        ["#pragma maxAuxVars 2\nlong itoa(long val) {\n    long ret, temp;\n    if (val >= 0 && val <= 99999999) { ret = (ret << 8) + temp; return ret; }\n    return '#error';\n}", false, '^declare r0\n^declare r1\n^declare itoa_val\n^declare itoa_ret\n^declare itoa_temp\n\nFIN\n\n__fn_itoa:\nPOP @itoa_val\nCLR @r0\nBLT $itoa_val $r0 :__if1_endif\nSET @r0 #0000000005f5e0ff\nBGT $itoa_val $r0 :__if1_endif\nJMP :__if1_start\n__if1_start:\nSET @r0 $itoa_ret\nSET @r1 #0000000000000008\nSHL @r0 $r1\nADD @r0 $itoa_temp\nSET @itoa_ret $r0\nPSH $itoa_ret\nRET\n__if1_endif:\nSET @r0 #0000726f72726523\nPSH $r0\nRET\n'],
        // bug 4, Double declaration causing array pointer to point wrong location.
        ['long a=0; long b; a++; long a=3;', true, ''],
        ['long a=0; long b; a++; void test(void) { a++; } long tt(void) { a++;} long test(void) {a++; return a; }', true, ''],
        ['long a=0; long b; a++; void test(void) { a++; } long tt(void) { a++;} long test(void) {a++; return a; }', true, ''],
        ['long a=0; void Get_B1(void) { a++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nCLR @a\nFIN\n\n__fn_Get_B1:\nINC @a\nRET\n'],
        ['#include APIFunctions\nlong a=0; void Get_B1(void) { a++; }', true, ''],
        ['long a=0; mylabel: a++; void temp(void) { a++; mylabel: a++; }', true, ''],
        // bug 5, reuseAssignedVar not working inside functions.
        ['void test(void) { long t, a; t = a+1; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare test_t\n^declare test_a\n\nFIN\n\n__fn_test:\nSET @test_t $test_a\nINC @test_t\nRET\n'],
        // bug 6, removed warning when function returning long had no assignment. (removed failed case from other testcase
        // bug 7, array type definition not found when declaring array inside functions.
        ['void test(void) { long t[2], a; t[a] = 1; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare test_t\n^const SET @test_t #0000000000000004\n^declare test_t_0\n^declare test_t_1\n^declare test_a\n\nFIN\n\n__fn_test:\nSET @r0 #0000000000000001\nSET @($test_t + $test_a) $r0\nRET\n'],
        // bug 8, wrong order of stack for function call
        ['long ga, gb, gc; test(ga, gb, gc); void test(long a, long b, long c) { a+=b+c; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare ga\n^declare gb\n^declare gc\n^declare test_a\n^declare test_b\n^declare test_c\n\nPSH $gc\nPSH $gb\nPSH $ga\nJSR :__fn_test\nFIN\n\n__fn_test:\nPOP @test_a\nPOP @test_b\nPOP @test_c\nSET @r0 $test_b\nADD @r0 $test_c\nADD @test_a $r0\nRET\n'],
        // optimization: array with constant index now used for reuseAssignedVar
        ['long a[2], b; a[1]=b+1;', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare b\n\nSET @a_1 $b\nINC @a_1\nFIN\n'],
        // Support for array notation on pointer variable.
        ['long b; void teste(long * poper) { poper[3]=0; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare b\n^declare teste_poper\n\nFIN\n\n__fn_teste:\nPOP @teste_poper\nSET @r0 #0000000000000003\nCLR @r1\nSET @($teste_poper + $r0) $r1\nRET\n'],
        // Support for check variable types on function calls
        ['long a, b; teste(a, b); void teste(long *fa, long fb) { fb++; }', true, ''],
        ['long * a, b; teste(a, b); void teste(long *fa, long fb) { fb++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare teste_fa\n^declare teste_fb\n\nPSH $b\nPSH $a\nJSR :__fn_teste\nFIN\n\n__fn_teste:\nPOP @teste_fa\nPOP @teste_fb\nINC @teste_fb\nRET\n'],
        ['long * a, b; teste(a, *a); void teste(long *fa, long fb) { fb++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare teste_fa\n^declare teste_fb\n\nSET @r0 $($a)\nPSH $r0\nPSH $a\nJSR :__fn_teste\nFIN\n\n__fn_teste:\nPOP @teste_fa\nPOP @teste_fb\nINC @teste_fb\nRET\n'],
        ['long * a, b; teste(&b, b); void teste(long *fa, long fb) { fb++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare teste_fa\n^declare teste_fb\n\nPSH $b\nSET @r0 #0000000000000004\nPSH $r0\nJSR :__fn_teste\nFIN\n\n__fn_teste:\nPOP @teste_fa\nPOP @teste_fb\nINC @teste_fb\nRET\n'],
        ["struct KOMBI { long driver; long collector; long passenger; } ;struct KOMBI car, *pcar;long a, b;pcar=&car;\n teste(car);\n void teste(struct KOMBI * value) { value->driver = 'Zé'; }", true, ''],
        ["struct KOMBI { long driver; long collector; long passenger; } ;struct KOMBI car, *pcar;long a, b;pcar=&car;\n teste(pcar);\n void teste(struct KOMBI * value) { value->driver = 'Zé'; }", false, '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^declare pcar\n^declare a\n^declare b\n^declare teste_value\n\nSET @pcar #0000000000000003\nPSH $pcar\nJSR :__fn_teste\nFIN\n\n__fn_teste:\nPOP @teste_value\nCLR @r0\nSET @r1 #0000000000a9c35a\nSET @($teste_value + $r0) $r1\nRET\n'],
        ["struct KOMBI { long driver; long collector; long passenger; } ;struct KOMBI car, *pcar;long a, b;pcar=&car;\n teste(pcar);\n void teste(struct KOMBI * value) { value->driver = 'Zé'; }", false, '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^declare pcar\n^declare a\n^declare b\n^declare teste_value\n\nSET @pcar #0000000000000003\nPSH $pcar\nJSR :__fn_teste\nFIN\n\n__fn_teste:\nPOP @teste_value\nCLR @r0\nSET @r1 #0000000000a9c35a\nSET @($teste_value + $r0) $r1\nRET\n'],
        // Support for check variable types on API Function calls
        ['#include APIFunctions\nlong * a;Set_A1(a);', true, ''],
        // Support SetUnaryOperator in struct members, but not if it is an array
        ['struct KOMBI { long driver; long collector; long passenger[4]; } car; long a, b; ++car.driver; a=car.collector++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare car_driver\n^declare car_collector\n^declare car_passenger\n^const SET @car_passenger #0000000000000006\n^declare car_passenger_0\n^declare car_passenger_1\n^declare car_passenger_2\n^declare car_passenger_3\n^declare a\n^declare b\n\nINC @car_driver\nSET @a $car_collector\nINC @car_collector\nFIN\n'],
        ['struct KOMBI { long driver; long collector; long passenger[4]; } car; long a, b; ++car.passenger[a]; ', true, ''],
        // bug 9, missing comma before if, while and for keywords lead to no error and statement being ignored.
        ['long a, b; test2() if (a) a++; long test2(void) { b++; return b; }', true, ''],
        ['long a, b; test2(); if (a) a++; long test2(void) { b++; return b; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nJSR :__fn_test2\nPOP @r0\nBZR $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n\n__fn_test2:\nINC @b\nPSH $b\nRET\n'],
        // bug 10, functions calls destroying content of registers. Implemented saving them in user stack
        ["long a[5], b, c; b=atoi(c); a[b+1]=atoi('2'); a[b+1]=(b*2)/atoi('2'); long atoi(long val){return val+1;}", false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare b\n^declare c\n^declare atoi_val\n\nPSH $c\nJSR :__fn_atoi\nPOP @b\nSET @r0 $b\nINC @r0\nPSH $r0\nSET @r1 #0000000000000032\nPSH $r1\nJSR :__fn_atoi\nPOP @r1\nPOP @r0\nSET @($a + $r0) $r1\nSET @r0 $b\nINC @r0\nSET @r1 #0000000000000002\nMUL @r1 $b\nPSH $r1\nPSH $r0\nSET @r2 #0000000000000032\nPSH $r2\nJSR :__fn_atoi\nPOP @r2\nPOP @r0\nPOP @r1\nDIV @r1 $r2\nSET @($a + $r0) $r1\nFIN\n\n__fn_atoi:\nPOP @atoi_val\nSET @r0 $atoi_val\nINC @r0\nPSH $r0\nRET\n'],
        // bug 11, function calls inside array brackets lead to error.
        ['long a[5], b, c; b=a[atoi("2")+1]; long atoi(long val){ return val+1;}', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare a_2\n^declare a_3\n^declare a_4\n^declare b\n^declare c\n^declare atoi_val\n\nSET @b #0000000000000032\nPSH $b\nJSR :__fn_atoi\nPOP @b\nINC @b\nSET @b $($a + $b)\nFIN\n\n__fn_atoi:\nPOP @atoi_val\nSET @r0 $atoi_val\nINC @r0\nPSH $r0\nRET\n'],
        // bug 13, optimization deleting assembly compiler directives
        ['#pragma globalOptimization\nwhile (1) halt; const long n8=8, n10=10, n0xff=0xff; long atoi(long val) { return 3; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare n8\n^declare n10\n^declare n0xff\n^declare atoi_val\n\n__loop1_continue:\nSTP\nJMP :__loop1_continue\n^const SET @n8 #0000000000000008\n^const SET @n10 #000000000000000a\n^const SET @n0xff #00000000000000ff\n\n'],
        // bug 14, (more) optimization deleting assembly compiler directives
        ['#pragma globalOptimization\n teste(); exit; const long n0xff=0xff; void teste(void) { const long b=5; b++; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare n0xff\n^declare teste_b\n\nJSR :__fn_teste\nFIN\n^const SET @n0xff #00000000000000ff\n\n__fn_teste:\n^const SET @teste_b #0000000000000005\nINC @teste_b\nRET\n'],
        // bug 15, Need to be more restrictive on globalOptimization for PSH and POP
        ['#pragma globalOptimization\n long a, b; a=b;insertPlayer(a); void insertPlayer(long address) { long id; id=(address >> 27); }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare insertPlayer_address\n^declare insertPlayer_id\n\nSET @a $b\nPSH $a\nJSR :__fn_insertPlayer\nFIN\n\n__fn_insertPlayer:\nPOP @insertPlayer_address\nSET @insertPlayer_id $insertPlayer_address\nSET @r0 #000000000000001b\nSHR @insertPlayer_id $r0\nRET\n'],
        // bug 16, Could not return or sleep with array and variable index
        ['long a, slot[4]; sleep slot[a];', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare slot\n^const SET @slot #0000000000000005\n^declare slot_0\n^declare slot_1\n^declare slot_2\n^declare slot_3\n\nSET @r0 $($slot + $a)\nSLP $r0\nFIN\n'],
        // bug 17 Could not start program with function
        ['XOR_A_with_B();\n#include APIFunctions', false, '^declare r0\n^declare r1\n^declare r2\n\nFUN XOR_A_with_B\nFIN\n'],
        // bug 18 Fix infinite recursion loop with wrong code
        ['Send_To_Address_In_B(sendEachBlockNQT) sleep SLP_BLOCKS;', true, ''],
        // bug19 Optimization creating wrong code. Removed optimization on double SET instruction
        ['#pragma globalOptimization\nlong _idx, uCount; _idx = ~(_idx+uCount); uCount = _idx; _idx++;', false, '^declare r0\n^declare r1\n^declare r2\n^declare _idx\n^declare uCount\n\nSET @r0 $_idx\nADD @r0 $uCount\nNOT @r0\nSET @_idx $r0\nSET @uCount $_idx\nINC @_idx\nFIN\n'],
        // bug 20 Fixes some wrong translation of RS-accounts
        ["long a='S-D3HS-T6ML-SJHU-2R5R2';", false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @a #005c77c9272585f8\nFIN\n'],
        // bug 21 Memory was not assigned when declaring struct after a struct pointer
        ['struct KOMBI { long driver; long collector; long passenger; }; void teste(void) { struct KOMBI tt2, *stru, tt, *stru2; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare teste_tt2_driver\n^declare teste_tt2_collector\n^declare teste_tt2_passenger\n^declare teste_stru\n^declare teste_tt_driver\n^declare teste_tt_collector\n^declare teste_tt_passenger\n^declare teste_stru2\n\nFIN\n\n__fn_teste:\nRET\n'],
        // bug 22 Function/API Functions on conditional not being evaluated
        ['long a=0; if (test2(a)){ a++; } long test2(long b) { b++; return b; }', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare test2_b\n\nCLR @a\nPSH $a\nJSR :__fn_test2\nPOP @r0\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n\n__fn_test2:\nPOP @test2_b\nINC @test2_b\nPSH $test2_b\nRET\n'],
        ['#include APIFunctions\n long a=0; if (Get_A1()){ a++;} ', false, '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nCLR @a\nFUN @r0 get_A1\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'],
        // bug 23 Parser trying to get property of undefined variable
        ['long a, b; *a + 1 = b', true, ''],
        //    [ "", false, "" ],
        ['End of tests!', null, '']
    ]

    // params:  asmcode, expect error?, bytecode, bytedata
    const bytecodeTests: [ string, boolean, string, string][] = [
        ['FIN\n', false, '28', ''],
        ['SET @a #0000000000000100\nSET @b $a\nCLR @b\nINC @b\nDEC @a\nADD @a $b\nSUB @a $b\nMUL @a $b\nDIV @a $b\nBOR @a $b\nAND @a $b\nXOR @a $b\nSET @a $b\nNOT @a\nSET @a $($b)\nSET @a $c\nADD @a $b\nSET @a $($b + $c)\nPSH $b\nJSR :__fn_teste\nPOP @a\nSET @($a) $b\nSET @($a + $b) $c\nMOD @a $b\nSHL @a $b\nSHR @a $b\nSLP $a\nJMP :__fn_main\n\n__fn_teste:\nPOP @teste_d\nSET @r0 $teste_d\nINC @r0\nPSH $r0\nRET\n\n__fn_main:\nPCS\nINC @a\nFIN',
            false,
            '010000000000010000000000000201000000000000000301000000040100000005000000000600000000010000000700000000010000000800000000010000000900000000010000000a00000000010000000b00000000010000000c00000000010000000200000000010000000d000000000e00000000010000000200000000020000000600000000010000000f000000000100000002000000100100000012e400000011000000001400000000010000001500000000010000000200000016000000000100000017000000000100000018000000000100000025000000001afd0000001103000000020400000003000000040400000010040000001330040000000028',
            ''],
        ['BZR $a :__if1_endif\nINC @b\n__if1_endif:\nBNZ $a :__if2_endif\nINC @b\n__if2_endif:\nBLE $a $b :__if3_endif\nINC @b\n__if3_endif:\nBGE $a $b :__if4_endif\nINC @b\n__if4_endif:\nBLT $a $b :__if5_endif\nINC @b\n__if5_endif:\nBGT $a $b :__if6_endif\nINC @b\n__if6_endif:\nBNE $a $b :__if7_endif\nINC @b\n__if7_endif:\nBEQ $a $b :__if8_endif\nINC @b\n__if8_endif:\nFIN\n',
            false,
            '1b000000000b04010000001e000000000b04010000002200000000010000000f04010000002100000000010000000f04010000002000000000010000000f04010000001f00000000010000000f04010000002400000000010000000f04010000002300000000010000000f040100000028',
            ''],
        ['BZR $a :__if1_endif\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\n__if1_endif:\nINC @b\nFIN\n',
            false,
            '1e000000000b1a8d00000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000040100000028',
            ''],
        ['__loop1_continue:\nBZR $a :__loop1_break\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nJMP :__loop1_continue\n__loop1_break:\nINC @b\nFIN\n',
            false,
            '1e000000000b1a850000000100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000001a00000000040100000028',
            ''],
        ['__loop1_continue:\nSET @a #0000000000000001\nBNZ $a :__loop1_continue\n__loop1_break:\nINC @b\nFIN',
            false,
            '010000000001000000000000001e00000000f3040100000028',
            ''],
        ['__loop1_continue:\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nSET @a #0000000000000001\nBNZ $a :__loop1_continue\n__loop1_break:\nINC @b\nFIN',
            false,
            '010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000001b000000000b1a00000000040100000028',
            ''],
        ['FUN clear_A_B\nFUN set_A1 $a\nFUN set_A1_A2 $a $b\nFUN @a check_A_equals_B\nFUN @a add_Minutes_to_Timestamp $b $c\nFIN\n',
            false,
            '3222013310010000000034140100000000010000003527010000000037060400000000010000000200000028',
            ''],
        ['SET @a #0000000000000005\nSET @b #0000000000000004\n^const SET @c #9887766554433221\nINC @a\nFIN\n',
            false,
            '0100000000050000000000000001010000000400000000000000040000000028',
            '000000000000000000000000000000002132435465768798'],
        ['^declare r0\n^declare a\n^declare b\n^declare c\n\n^const SET @c #9887766554433221\nSET @a #0000000000000005\nSET @b #0000000000000004\nINC @a\nFIN\n',
            false,
            '0101000000050000000000000001020000000400000000000000040100000028',
            '0000000000000000000000000000000000000000000000002132435465768798'],
        ['^declare r0\n^declare a\n^declare b\n^declare c\n\n^const SET @c #9887766554433221\n^const SET @a #000000000000fafe\nSET @b #0000000000000004\nINC @a\nFIN\n',
            false,
            '01020000000400000000000000040100000028',
            '0000000000000000fefa00000000000000000000000000002132435465768798'],
        ['FIZ $a\nSTZ $a\nERR :__error\nINC @a\nNOP\nNOP\n__error:\nDEC @a',
            false,
            '260000000027000000002b1600000004000000007f7f0500000000',
            ''],
        // BUG 12: bug when changing branch with offset overflow (this code causes error on v0.1)
        ['BNE $var1 $var15 :lab_aa6\nBNE $var1 $var15 :lab_de2\nlab_aa6:\nSET @var02 #2065726120756f59\nSET @var02 #2065726120756f59\nSET @var02 #2065726120756f59\nSET @var02 #656e776f20746f6e\nSET @var02 #65746920666f2072\nSET @var02 #0000000000002e6d\nFIN\nlab_af3:\nSET @var02 #65746920666f2072\nSET @var02 #65746920666f2072\nSET @var02 #65746920666f2072\nlab_de2:\nFIN\n',
            false,
            '240000000001000000192300000000010000000f1a8f0000000102000000596f7520617265200102000000596f7520617265200102000000596f75206172652001020000006e6f74206f776e65010200000072206f662069746501020000006d2e00000000000028010200000072206f6620697465010200000072206f6620697465010200000072206f662069746528',
            '']
        /*    [ "",
      false,
      "",
      "" ],
*/

    ]

    let code
    let result = ''
    let itemPass = 0
    let itemFail = 0

    result += '<h3>Assembly tests</h3>'
    for (let i = 0; i < bytecodeTests.length; i++) {
        try {
            result += '<br>Test ' + i + ' '
            code = bytecode(bytecodeTests[i][0])
            if (bytecodeTests[i][1] === false) {
                if (code.ByteCode === bytecodeTests[i][2] && code.ByteData === bytecodeTests[i][3]) {
                    result += 'Pass! (run OK)'
                    itemPass++
                } else {
                    result += `<span style='color:red'>Fail...</span> (run OK) Code: <span style='color:blue'>${encodedStr(bytecodeTests[i][0])}</span>
Exp ByteCode: ${bytecodeTests[i][2]}
Exp ByteData: ${bytecodeTests[i][3]} 
GOT Bytecode: ${code.ByteCode}
GOT ByteData: ${code.ByteData}`
                    itemFail++
                }
            } else {
                result += `<span style='color:red'>Fail...</span> (run OK) Code: <span style='color:purple'>${encodedStr(bytecodeTests[i][0])}</span>
Expected to throw exception but
GOT Bytecode: ${code.ByteCode}
GOT ByteData: ${code.ByteData}`
                itemFail++
            }
        } catch (e) {
            if (bytecodeTests[i][1] === true) {
                result += 'Pass! (failed)'
                itemPass++
            } else {
                result += `<span style='color:red'>Fail...</span> (failed) Code: <span style='color:purple'>${encodedStr(bytecodeTests[i][0])}</span>
GOT: ${e}`
                itemFail++
            }
        }
    }

    result += '<h3>Full tests</h3>'
    tests.forEach((currentTest, index) => {
        try {
            if (currentTest[1] === null) {
                result += '\n<h4>' + currentTest[0] + '</h4>'
                return
            }
            result += `<br>Test ${index} `
            code = generate(syntaxProcess(shape(parse(tokenize(preprocess(currentTest[0]))))))
            if (currentTest[1] === false) {
                if (code === currentTest[2]) {
                    result += `Pass! (run OK) Code: <span style='color:blue'>${encodedStr(currentTest[0])}</span>`
                    itemPass++
                } else {
                    result += `<span style='color:red'>Fail...</span> (run OK) Code: <span style='color:blue'>${encodedStr(currentTest[0])}</span> Expected:
${currentTest[2]}
GOT
${code}`
                    itemFail++
                }
            } else {
                result += `<span style='color:red'>Fail...</span> (run OK) Code: <span style='color:purple'>${encodedStr(currentTest[0])}</span>
Expected to throw exception
GOT
${code}`
                itemFail++
            }
        } catch (e) {
            if (currentTest[1] === true) {
                result += `Pass! (failed) Code: <span style='color:purple'>${encodedStr(currentTest[0])}</span><br><span style='color:green'>${e}</span>`
                itemPass++
            } else {
                result += `<span style='color:red'>Fail...</span> (failed) Code: <span style='color:purple'>${encodedStr(currentTest[0])}</span><br>GOT<br>${e}`
                itemFail++
            }
        }
    })

    return `Tests completed: ${itemPass} Passed; ${itemFail} Failed.<br><br>${result}`
}
