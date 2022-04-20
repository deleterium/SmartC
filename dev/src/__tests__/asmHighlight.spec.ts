import { asmHighlight } from '../asmHighlight'

describe('Assembly compilation:', () => {
    it('should highlight: regular opCodes', () => {
        const code = 'SET @a #0000000000000100\nSET @b $a\nCLR @b\nINC @b\nDEC @a\nADD @a $b\nSUB @a $b\nMUL @a $b\nDIV @a $b\nBOR @a $b\nAND @a $b\nXOR @a $b\nSET @a $b\nNOT @a\nSET @a $($b)\nSET @a $c\nADD @a $b\nSET @a $($b + $c)\nPSH $b\nJSR :__fn_teste\nPOP @a\nSET @($a) $b\nSET @($a + $b) $c\nMOD @a $b\nSHL @a $b\nSHR @a $b\nSLP $a\nJMP :__fn_main\n\n__fn_teste:\nPOP @teste_d\nSET @r0 $teste_d\nINC @r0\nPSH $r0\nRET\n\n__fn_main:\nPCS\nINC @a\nFIN'
        const highlighted = "<div class='table'><div class='div_row'><div class='div_cell_a'>1</div><div class='div_cell_b'><span class='asmInstruction'>SET </span><span class='asmVariable'>@a </span><span class='asmNumber'>#0000000000000100</span></div></div><div class='div_row'><div class='div_cell_a'>2</div><div class='div_cell_b'><span class='asmInstruction'>SET </span><span class='asmVariable'>@b </span><span class='asmVariable'>$a</span></div></div><div class='div_row'><div class='div_cell_a'>3</div><div class='div_cell_b'><span class='asmInstruction'>CLR </span><span class='asmVariable'>@b</span></div></div><div class='div_row'><div class='div_cell_a'>4</div><div class='div_cell_b'><span class='asmInstruction'>INC </span><span class='asmVariable'>@b</span></div></div><div class='div_row'><div class='div_cell_a'>5</div><div class='div_cell_b'><span class='asmInstruction'>DEC </span><span class='asmVariable'>@a</span></div></div><div class='div_row'><div class='div_cell_a'>6</div><div class='div_cell_b'><span class='asmInstruction'>ADD </span><span class='asmVariable'>@a </span><span class='asmVariable'>$b</span></div></div><div class='div_row'><div class='div_cell_a'>7</div><div class='div_cell_b'><span class='asmInstruction'>SUB </span><span class='asmVariable'>@a </span><span class='asmVariable'>$b</span></div></div><div class='div_row'><div class='div_cell_a'>8</div><div class='div_cell_b'><span class='asmInstruction'>MUL </span><span class='asmVariable'>@a </span><span class='asmVariable'>$b</span></div></div><div class='div_row'><div class='div_cell_a'>9</div><div class='div_cell_b'><span class='asmInstruction'>DIV </span><span class='asmVariable'>@a </span><span class='asmVariable'>$b</span></div></div><div class='div_row'><div class='div_cell_a'>10</div><div class='div_cell_b'><span class='asmInstruction'>BOR </span><span class='asmVariable'>@a </span><span class='asmVariable'>$b</span></div></div><div class='div_row'><div class='div_cell_a'>11</div><div class='div_cell_b'><span class='asmInstruction'>AND </span><span class='asmVariable'>@a </span><span class='asmVariable'>$b</span></div></div><div class='div_row'><div class='div_cell_a'>12</div><div class='div_cell_b'><span class='asmInstruction'>XOR </span><span class='asmVariable'>@a </span><span class='asmVariable'>$b</span></div></div><div class='div_row'><div class='div_cell_a'>13</div><div class='div_cell_b'><span class='asmInstruction'>SET </span><span class='asmVariable'>@a </span><span class='asmVariable'>$b</span></div></div><div class='div_row'><div class='div_cell_a'>14</div><div class='div_cell_b'><span class='asmInstruction'>NOT </span><span class='asmVariable'>@a</span></div></div><div class='div_row'><div class='div_cell_a'>15</div><div class='div_cell_b'><span class='asmInstruction'>SET </span><span class='asmVariable'>@a</span> $(<span class='asmVariable'>$b</span>)</div></div><div class='div_row'><div class='div_cell_a'>16</div><div class='div_cell_b'><span class='asmInstruction'>SET </span><span class='asmVariable'>@a </span><span class='asmVariable'>$c</span></div></div><div class='div_row'><div class='div_cell_a'>17</div><div class='div_cell_b'><span class='asmInstruction'>ADD </span><span class='asmVariable'>@a </span><span class='asmVariable'>$b</span></div></div><div class='div_row'><div class='div_cell_a'>18</div><div class='div_cell_b'><span class='asmInstruction'>SET </span><span class='asmVariable'>@a </span>$(<span class='asmVariable'>$b</span> + <span class='asmVariable'>$c</span>)</div></div><div class='div_row'><div class='div_cell_a'>19</div><div class='div_cell_b'><span class='asmInstruction'>PSH </span><span class='asmVariable'>$b</span></div></div><div class='div_row'><div class='div_cell_a'>20</div><div class='div_cell_b'><span class='asmInstruction'>JSR </span><span class='asmLabel'>:__fn_teste</span></div></div><div class='div_row'><div class='div_cell_a'>21</div><div class='div_cell_b'><span class='asmInstruction'>POP </span><span class='asmVariable'>@a</span></div></div><div class='div_row'><div class='div_cell_a'>22</div><div class='div_cell_b'><span class='asmInstruction'>SET </span>@(<span class='asmVariable'>$a</span>) <span class='asmVariable'>$b</span></div></div><div class='div_row'><div class='div_cell_a'>23</div><div class='div_cell_b'><span class='asmInstruction'>SET </span>@(<span class='asmVariable'>$a</span> + <span class='asmVariable'>$b</span>) <span class='asmVariable'>$c</span></div></div><div class='div_row'><div class='div_cell_a'>24</div><div class='div_cell_b'><span class='asmInstruction'>MOD </span><span class='asmVariable'>@a </span><span class='asmVariable'>$b</span></div></div><div class='div_row'><div class='div_cell_a'>25</div><div class='div_cell_b'><span class='asmInstruction'>SHL </span><span class='asmVariable'>@a </span><span class='asmVariable'>$b</span></div></div><div class='div_row'><div class='div_cell_a'>26</div><div class='div_cell_b'><span class='asmInstruction'>SHR </span><span class='asmVariable'>@a </span><span class='asmVariable'>$b</span></div></div><div class='div_row'><div class='div_cell_a'>27</div><div class='div_cell_b'><span class='asmInstruction'>SLP </span><span class='asmVariable'>$a</span></div></div><div class='div_row'><div class='div_cell_a'>28</div><div class='div_cell_b'><span class='asmInstruction'>JMP </span><span class='asmLabel'>:__fn_main</span></div></div><div class='div_row'><div class='div_cell_a'>29</div><div class='div_cell_b'></div></div><div class='div_row'><div class='div_cell_a'>30</div><div class='div_cell_b'><span class='asmLabel'>__fn_teste:</span></div></div><div class='div_row'><div class='div_cell_a'>31</div><div class='div_cell_b'><span class='asmInstruction'>POP </span><span class='asmVariable'>@teste_d</span></div></div><div class='div_row'><div class='div_cell_a'>32</div><div class='div_cell_b'><span class='asmInstruction'>SET </span><span class='asmVariable'>@r0 </span><span class='asmVariable'>$teste_d</span></div></div><div class='div_row'><div class='div_cell_a'>33</div><div class='div_cell_b'><span class='asmInstruction'>INC </span><span class='asmVariable'>@r0</span></div></div><div class='div_row'><div class='div_cell_a'>34</div><div class='div_cell_b'><span class='asmInstruction'>PSH </span><span class='asmVariable'>$r0</span></div></div><div class='div_row'><div class='div_cell_a'>35</div><div class='div_cell_b'><span class='asmInstruction'>RET</span></div></div><div class='div_row'><div class='div_cell_a'>36</div><div class='div_cell_b'></div></div><div class='div_row'><div class='div_cell_a'>37</div><div class='div_cell_b'><span class='asmLabel'>__fn_main:</span></div></div><div class='div_row'><div class='div_cell_a'>38</div><div class='div_cell_b'><span class='asmInstruction'>PCS</span></div></div><div class='div_row'><div class='div_cell_a'>39</div><div class='div_cell_b'><span class='asmInstruction'>INC </span><span class='asmVariable'>@a</span></div></div><div class='div_row'><div class='div_cell_a'>40</div><div class='div_cell_b'><span class='asmInstruction'>FIN</span></div></div></div>"
        const result = asmHighlight(code)
        expect(result).toBe(highlighted)
    })
    it('should highlight: opCodes for api functions', () => {
        const code = 'FUN clear_A_B\nFUN set_A1 $a\nFUN set_A1_A2 $a $b\nFUN @a check_A_equals_B\nFUN @a add_Minutes_to_Timestamp $b $c\n'
        const highlighted = "<div class='table'><div class='div_row'><div class='div_cell_a'>1</div><div class='div_cell_b'><span class='asmInstruction'>FUN clear_A_B</span></div></div><div class='div_row'><div class='div_cell_a'>2</div><div class='div_cell_b'><span class='asmInstruction'>FUN set_A1 </span><span class='asmVariable'>$a</span></div></div><div class='div_row'><div class='div_cell_a'>3</div><div class='div_cell_b'><span class='asmInstruction'>FUN set_A1_A2 </span><span class='asmVariable'>$a </span><span class='asmVariable'>$b</span></div></div><div class='div_row'><div class='div_cell_a'>4</div><div class='div_cell_b'><span class='asmInstruction'>FUN </span><span class='asmVariable'>@a </span><span class='asmInstruction'>check_A_equals_B</span></div></div><div class='div_row'><div class='div_cell_a'>5</div><div class='div_cell_b'><span class='asmInstruction'>FUN </span><span class='asmVariable'>@a </span><span class='asmInstruction'>add_Minutes_to_Timestamp </span><span class='asmVariable'>$b </span><span class='asmVariable'>$c</span></div></div><div class='div_row'><div class='div_cell_a'>6</div><div class='div_cell_b'></div></div></div>"
        const result = asmHighlight(code)
        expect(result).toBe(highlighted)
    })
    it('should highlight: rare opCodes ', () => {
        const code = 'FIZ $a\nSTZ $a\nERR :__error\nINC @a\nNOP\nNOP\n__error:\nDEC @a'
        const highlighted = "<div class='table'><div class='div_row'><div class='div_cell_a'>1</div><div class='div_cell_b'><span class='asmInstruction'>FIZ </span><span class='asmVariable'>$a</span></div></div><div class='div_row'><div class='div_cell_a'>2</div><div class='div_cell_b'><span class='asmInstruction'>STZ </span><span class='asmVariable'>$a</span></div></div><div class='div_row'><div class='div_cell_a'>3</div><div class='div_cell_b'><span class='asmInstruction'>ERR </span><span class='asmLabel'>:__error</span></div></div><div class='div_row'><div class='div_cell_a'>4</div><div class='div_cell_b'><span class='asmInstruction'>INC </span><span class='asmVariable'>@a</span></div></div><div class='div_row'><div class='div_cell_a'>5</div><div class='div_cell_b'><span class='asmInstruction'>NOP</span></div></div><div class='div_row'><div class='div_cell_a'>6</div><div class='div_cell_b'><span class='asmInstruction'>NOP</span></div></div><div class='div_row'><div class='div_cell_a'>7</div><div class='div_cell_b'><span class='asmLabel'>__error:</span></div></div><div class='div_row'><div class='div_cell_a'>8</div><div class='div_cell_b'><span class='asmInstruction'>DEC </span><span class='asmVariable'>@a</span></div></div></div>"
        const result = asmHighlight(code)
        expect(result).toBe(highlighted)
    })
    it('should highlight: all branches opCodes with positive offset (no overflow)', () => {
        const code = 'BZR $a :__if1_endif\nINC @b\n__if1_endif:\nBNZ $a :__if2_endif\nINC @b\n__if2_endif:\nBLE $a $b :__if3_endif\nINC @b\n__if3_endif:\nBGE $a $b :__if4_endif\nINC @b\n__if4_endif:\nBLT $a $b :__if5_endif\nINC @b\n__if5_endif:\nBGT $a $b :__if6_endif\nINC @b\n__if6_endif:\nBNE $a $b :__if7_endif\nINC @b\n__if7_endif:\nBEQ $a $b :__if8_endif\nINC @b\n__if8_endif:\nFIN\n'
        const highlighted = "<div class='table'><div class='div_row'><div class='div_cell_a'>1</div><div class='div_cell_b'><span class='asmInstruction'>BZR </span><span class='asmVariable'>$a </span><span class='asmLabel'>:__if1_endif</span></div></div><div class='div_row'><div class='div_cell_a'>2</div><div class='div_cell_b'><span class='asmInstruction'>INC </span><span class='asmVariable'>@b</span></div></div><div class='div_row'><div class='div_cell_a'>3</div><div class='div_cell_b'><span class='asmLabel'>__if1_endif:</span></div></div><div class='div_row'><div class='div_cell_a'>4</div><div class='div_cell_b'><span class='asmInstruction'>BNZ </span><span class='asmVariable'>$a </span><span class='asmLabel'>:__if2_endif</span></div></div><div class='div_row'><div class='div_cell_a'>5</div><div class='div_cell_b'><span class='asmInstruction'>INC </span><span class='asmVariable'>@b</span></div></div><div class='div_row'><div class='div_cell_a'>6</div><div class='div_cell_b'><span class='asmLabel'>__if2_endif:</span></div></div><div class='div_row'><div class='div_cell_a'>7</div><div class='div_cell_b'><span class='asmInstruction'>BLE </span><span class='asmVariable'>$a </span><span class='asmVariable'>$b </span><span class='asmLabel'>:__if3_endif</span></div></div><div class='div_row'><div class='div_cell_a'>8</div><div class='div_cell_b'><span class='asmInstruction'>INC </span><span class='asmVariable'>@b</span></div></div><div class='div_row'><div class='div_cell_a'>9</div><div class='div_cell_b'><span class='asmLabel'>__if3_endif:</span></div></div><div class='div_row'><div class='div_cell_a'>10</div><div class='div_cell_b'><span class='asmInstruction'>BGE </span><span class='asmVariable'>$a </span><span class='asmVariable'>$b </span><span class='asmLabel'>:__if4_endif</span></div></div><div class='div_row'><div class='div_cell_a'>11</div><div class='div_cell_b'><span class='asmInstruction'>INC </span><span class='asmVariable'>@b</span></div></div><div class='div_row'><div class='div_cell_a'>12</div><div class='div_cell_b'><span class='asmLabel'>__if4_endif:</span></div></div><div class='div_row'><div class='div_cell_a'>13</div><div class='div_cell_b'><span class='asmInstruction'>BLT </span><span class='asmVariable'>$a </span><span class='asmVariable'>$b </span><span class='asmLabel'>:__if5_endif</span></div></div><div class='div_row'><div class='div_cell_a'>14</div><div class='div_cell_b'><span class='asmInstruction'>INC </span><span class='asmVariable'>@b</span></div></div><div class='div_row'><div class='div_cell_a'>15</div><div class='div_cell_b'><span class='asmLabel'>__if5_endif:</span></div></div><div class='div_row'><div class='div_cell_a'>16</div><div class='div_cell_b'><span class='asmInstruction'>BGT </span><span class='asmVariable'>$a </span><span class='asmVariable'>$b </span><span class='asmLabel'>:__if6_endif</span></div></div><div class='div_row'><div class='div_cell_a'>17</div><div class='div_cell_b'><span class='asmInstruction'>INC </span><span class='asmVariable'>@b</span></div></div><div class='div_row'><div class='div_cell_a'>18</div><div class='div_cell_b'><span class='asmLabel'>__if6_endif:</span></div></div><div class='div_row'><div class='div_cell_a'>19</div><div class='div_cell_b'><span class='asmInstruction'>BNE </span><span class='asmVariable'>$a </span><span class='asmVariable'>$b </span><span class='asmLabel'>:__if7_endif</span></div></div><div class='div_row'><div class='div_cell_a'>20</div><div class='div_cell_b'><span class='asmInstruction'>INC </span><span class='asmVariable'>@b</span></div></div><div class='div_row'><div class='div_cell_a'>21</div><div class='div_cell_b'><span class='asmLabel'>__if7_endif:</span></div></div><div class='div_row'><div class='div_cell_a'>22</div><div class='div_cell_b'><span class='asmInstruction'>BEQ </span><span class='asmVariable'>$a </span><span class='asmVariable'>$b </span><span class='asmLabel'>:__if8_endif</span></div></div><div class='div_row'><div class='div_cell_a'>23</div><div class='div_cell_b'><span class='asmInstruction'>INC </span><span class='asmVariable'>@b</span></div></div><div class='div_row'><div class='div_cell_a'>24</div><div class='div_cell_b'><span class='asmLabel'>__if8_endif:</span></div></div><div class='div_row'><div class='div_cell_a'>25</div><div class='div_cell_b'><span class='asmInstruction'>FIN</span></div></div><div class='div_row'><div class='div_cell_a'>26</div><div class='div_cell_b'></div></div></div>"
        const result = asmHighlight(code)
        expect(result).toBe(highlighted)
    })
    it('should highlight: all branches opCodes with positive offset (no overflow)', () => {
        const code = 'BZR $a :__if1_endif\nINC @b\n__if1_endif:\nBNZ $a :__if2_endif\nINC @b\n__if2_endif:\nBLE $a $b :__if3_endif\nINC @b\n__if3_endif:\nBGE $a $b :__if4_endif\nINC @b\n__if4_endif:\nBLT $a $b :__if5_endif\nINC @b\n__if5_endif:\nBGT $a $b :__if6_endif\nINC @b\n__if6_endif:\nBNE $a $b :__if7_endif\nINC @b\n__if7_endif:\nBEQ $a $b :__if8_endif\nINC @b\n__if8_endif:\nFIN\n'
        const highlighted = "<div class='table'><div class='div_row'><div class='div_cell_a'>1</div><div class='div_cell_b'><span class='asmInstruction'>BZR </span><span class='asmVariable'>$a </span><span class='asmLabel'>:__if1_endif</span></div></div><div class='div_row'><div class='div_cell_a'>2</div><div class='div_cell_b'><span class='asmInstruction'>INC </span><span class='asmVariable'>@b</span></div></div><div class='div_row'><div class='div_cell_a'>3</div><div class='div_cell_b'><span class='asmLabel'>__if1_endif:</span></div></div><div class='div_row'><div class='div_cell_a'>4</div><div class='div_cell_b'><span class='asmInstruction'>BNZ </span><span class='asmVariable'>$a </span><span class='asmLabel'>:__if2_endif</span></div></div><div class='div_row'><div class='div_cell_a'>5</div><div class='div_cell_b'><span class='asmInstruction'>INC </span><span class='asmVariable'>@b</span></div></div><div class='div_row'><div class='div_cell_a'>6</div><div class='div_cell_b'><span class='asmLabel'>__if2_endif:</span></div></div><div class='div_row'><div class='div_cell_a'>7</div><div class='div_cell_b'><span class='asmInstruction'>BLE </span><span class='asmVariable'>$a </span><span class='asmVariable'>$b </span><span class='asmLabel'>:__if3_endif</span></div></div><div class='div_row'><div class='div_cell_a'>8</div><div class='div_cell_b'><span class='asmInstruction'>INC </span><span class='asmVariable'>@b</span></div></div><div class='div_row'><div class='div_cell_a'>9</div><div class='div_cell_b'><span class='asmLabel'>__if3_endif:</span></div></div><div class='div_row'><div class='div_cell_a'>10</div><div class='div_cell_b'><span class='asmInstruction'>BGE </span><span class='asmVariable'>$a </span><span class='asmVariable'>$b </span><span class='asmLabel'>:__if4_endif</span></div></div><div class='div_row'><div class='div_cell_a'>11</div><div class='div_cell_b'><span class='asmInstruction'>INC </span><span class='asmVariable'>@b</span></div></div><div class='div_row'><div class='div_cell_a'>12</div><div class='div_cell_b'><span class='asmLabel'>__if4_endif:</span></div></div><div class='div_row'><div class='div_cell_a'>13</div><div class='div_cell_b'><span class='asmInstruction'>BLT </span><span class='asmVariable'>$a </span><span class='asmVariable'>$b </span><span class='asmLabel'>:__if5_endif</span></div></div><div class='div_row'><div class='div_cell_a'>14</div><div class='div_cell_b'><span class='asmInstruction'>INC </span><span class='asmVariable'>@b</span></div></div><div class='div_row'><div class='div_cell_a'>15</div><div class='div_cell_b'><span class='asmLabel'>__if5_endif:</span></div></div><div class='div_row'><div class='div_cell_a'>16</div><div class='div_cell_b'><span class='asmInstruction'>BGT </span><span class='asmVariable'>$a </span><span class='asmVariable'>$b </span><span class='asmLabel'>:__if6_endif</span></div></div><div class='div_row'><div class='div_cell_a'>17</div><div class='div_cell_b'><span class='asmInstruction'>INC </span><span class='asmVariable'>@b</span></div></div><div class='div_row'><div class='div_cell_a'>18</div><div class='div_cell_b'><span class='asmLabel'>__if6_endif:</span></div></div><div class='div_row'><div class='div_cell_a'>19</div><div class='div_cell_b'><span class='asmInstruction'>BNE </span><span class='asmVariable'>$a </span><span class='asmVariable'>$b </span><span class='asmLabel'>:__if7_endif</span></div></div><div class='div_row'><div class='div_cell_a'>20</div><div class='div_cell_b'><span class='asmInstruction'>INC </span><span class='asmVariable'>@b</span></div></div><div class='div_row'><div class='div_cell_a'>21</div><div class='div_cell_b'><span class='asmLabel'>__if7_endif:</span></div></div><div class='div_row'><div class='div_cell_a'>22</div><div class='div_cell_b'><span class='asmInstruction'>BEQ </span><span class='asmVariable'>$a </span><span class='asmVariable'>$b </span><span class='asmLabel'>:__if8_endif</span></div></div><div class='div_row'><div class='div_cell_a'>23</div><div class='div_cell_b'><span class='asmInstruction'>INC </span><span class='asmVariable'>@b</span></div></div><div class='div_row'><div class='div_cell_a'>24</div><div class='div_cell_b'><span class='asmLabel'>__if8_endif:</span></div></div><div class='div_row'><div class='div_cell_a'>25</div><div class='div_cell_b'><span class='asmInstruction'>FIN</span></div></div><div class='div_row'><div class='div_cell_a'>26</div><div class='div_cell_b'></div></div></div>"
        const result = asmHighlight(code)
        expect(result).toBe(highlighted)
    })
    it('should highlight: ^declare, ^const, ^comment, ^program and multi spaces', () => {
        const code = '^declare r0\n^const SET @c #9887766554433221\n^comment This is a comment\n   SET     @a     #0000000000000005\n   ^program something something something\n'
        const highlighted = "<div class='table'><div class='div_row'><div class='div_cell_a'>1</div><div class='div_cell_b'><span class='asmDirective'>^declare</span><span class='asmVariable'> r0</span></div></div><div class='div_row'><div class='div_cell_a'>2</div><div class='div_cell_b'><span class='asmDirective'>^const</span><span class='asmInstruction'> SET </span><span class='asmVariable'>@c </span><span class='asmNumber'>#9887766554433221</span></div></div><div class='div_row'><div class='div_cell_a'>3</div><div class='div_cell_b'><span class='asmDirective'>^comment</span><span class='asmComment'> This is a comment</span></div></div><div class='div_row'><div class='div_cell_a'>4</div><div class='div_cell_b'><span class='asmInstruction'>   SET     </span><span class='asmVariable'>@a     </span><span class='asmNumber'>#0000000000000005</span></div></div><div class='div_row'><div class='div_cell_a'>5</div><div class='div_cell_b'><span class='asmDirective'>   ^program something</span> something something</div></div><div class='div_row'><div class='div_cell_a'>6</div><div class='div_cell_b'></div></div></div>"
        const result = asmHighlight(code)
        expect(result).toBe(highlighted)
    })
    it('should highlight error: ^comment and multi spaces', () => {
        const code = 'SET @a #0000000000000100\nC @a\n\nFUN Xclear_A_B\nFUN Xset_A1 $a\nFUN Xset_A1_A2 $a $b\nFUN @a Xcheck_A_equals_B\nFUN @a Xadd_Minutes_to_Timestamp $b $c'
        const highlighted = "<div class='table'><div class='div_row'><div class='div_cell_a'>1</div><div class='div_cell_b'><span class='asmInstruction'>SET </span><span class='asmVariable'>@a </span><span class='asmNumber'>#0000000000000100</span></div></div><div class='div_row'><div class='div_cell_a'>2</div><div class='div_cell_b'><span class='asmError'>C @a</span></div></div><div class='div_row'><div class='div_cell_a'>3</div><div class='div_cell_b'></div></div><div class='div_row'><div class='div_cell_a'>4</div><div class='div_cell_b'><span class='asmInstruction'>FUN </span><span class='asmError'>Xclear_A_B</span></div></div><div class='div_row'><div class='div_cell_a'>5</div><div class='div_cell_b'><span class='asmInstruction'>FUN </span><span class='asmError'>Xset_A1 </span><span class='asmVariable'>$a</span></div></div><div class='div_row'><div class='div_cell_a'>6</div><div class='div_cell_b'><span class='asmInstruction'>FUN </span><span class='asmError'>Xset_A1_A2 </span><span class='asmVariable'>$a </span><span class='asmVariable'>$b</span></div></div><div class='div_row'><div class='div_cell_a'>7</div><div class='div_cell_b'><span class='asmInstruction'>FUN </span><span class='asmVariable'>@a </span><span class='asmError'>Xcheck_A_equals_B</span></div></div><div class='div_row'><div class='div_cell_a'>8</div><div class='div_cell_b'><span class='asmInstruction'>FUN </span><span class='asmVariable'>@a </span><span class='asmError'>Xadd_Minutes_to_Timestamp </span><span class='asmVariable'>$b </span><span class='asmVariable'>$c</span></div></div></div>"
        const result = asmHighlight(code)
        expect(result).toBe(highlighted)
    })
    it('should highlight error: Rule not found and Non existent 0x36 api function', () => {
        const code = 'long day here\nFUN @A 0x36APIFunction $B'
        const highlighted = "<div class='table'><div class='div_row'><div class='div_cell_a'>1</div><div class='div_cell_b'><span class='asmError'>long day here</span></div></div><div class='div_row'><div class='div_cell_a'>2</div><div class='div_cell_b'><span class='asmError'>FUN @A 0x36APIFunction $B</span></div></div></div>"
        const result = asmHighlight(code)
        expect(result).toBe(highlighted)
    })
})