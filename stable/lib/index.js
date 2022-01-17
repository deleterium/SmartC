(()=>{function B(n,e="Internal error."){if(n===void 0)throw new Error(e);return n}function ne(n,e,r){if(n!==void 0&&n!==e)return n;throw new Error(r)}function G(n,e="Internal error."){if(!n)throw new Error(e);return!0}function P(n){return Array.isArray(n)?n.map(e=>P(e)):n instanceof Date?new Date(n.getTime()):n&&typeof n=="object"?Object.getOwnPropertyNames(n).reduce((e,r)=>(Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(n,r)),e[r]=P(n[r]),e),Object.create(Object.getPrototypeOf(n))):n}function Ie(n){let e=[];n.length===0&&e.push(0);let r=0;for(;r<n.length;){let i=n.charCodeAt(r);switch(!0){case i<128:e.push(i);break;case i<2048:e.push(192|i>>6),e.push(128|i&63);break;case i<55296:case i>57343:e.push(224|63&i>>12),e.push(128|63&i>>6),e.push(128|63&i);break;default:{let T=n.charCodeAt(r+1);if(isNaN(T))break;if((i&64512)==55296&&(T&64512)==56320){r++;let u=((i&1023)<<10)+(T&1023)+65536;e.push(240|63&u>>18),e.push(128|63&u>>12),e.push(128|63&u>>6),e.push(128|63&u)}}}r++}let a=(Math.floor((e.length-1)/8)+1)*8;return e.reverse(),e.map(i=>i.toString(16).padStart(2,"0")).join("").padStart(a*2,"0")}function ve(n,e){let r=[1,2,4,8,16,5,10,20,13,26,17,7,14,28,29,31,27,19,3,6,12,24,21,15,30,25,23,11,22,9,18,1],a=[0,0,1,18,2,5,19,11,3,29,6,27,20,8,12,23,4,10,30,17,7,22,28,26,21,25,9,16,13,14,24,15];function l(u,d){if(u===0||d===0)return 0;let f=(a[u]+a[d])%31;return r[f]}function i(u){let d=0;for(let f=1;f<5;f++){let s=0;for(let _=0;_<31;_++){if(_>12&&_<27)continue;let C=_;_>26&&(C-=14),s^=l(u[C],r[f*_%31])}d|=s}return d===0}function T(){let u=[],d="23456789ABCDEFGHJKLMNPQRSTUVWXYZ",f=[3,2,1,0,7,6,5,4,13,14,15,16,12,8,9,10,11],s=n.replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ]/g,"");if(s.split("").forEach((C,b)=>{let O=d.indexOf(C);u[f[b]]=O}),s.length!==17||!i(u))throw new Error(`At line: ${e}. Error decoding address: S-${n}`);let _=u.slice(0,13).reduce((C,b,O)=>C+BigInt(b)*(1n<<5n*BigInt(O)),0n);if(_>=18446744073709551616n)throw new Error(`At line: ${e}. Error decoding address: S-${n}`);return _.toString(16).padStart(16,"0")}return T()}function te(n){let e=[{regex:/^\s*#\s*define\s+(\w+)\s*$/,type:"DEFINE_NULL"},{regex:/^\s*#\s*define\s+(\w+\b)(.+)$/,type:"DEFINE_VAL"},{regex:/^\s*#\s*undef\s+(\w+)\s*$/,type:"UNDEF"},{regex:/^\s*#\s*ifdef\s+(\w+)\s*$/,type:"IFDEF"},{regex:/^\s*#\s*ifndef\s+(\w+)\s*$/,type:"IFNDEF"},{regex:/^\s*#\s*else\s*$/,type:"ELSE"},{regex:/^\s*#\s*endif\s*$/,type:"ENDIF"},{regex:/^[\s\S]*$/,type:"MATCHES_ALL"}],r=[{cname:"true",value:"1"},{cname:"false",value:"0"},{cname:"NULL",value:"0"},{cname:"SMARTC",value:""}],a=[{active:!0,flipped:!1}],l=0;function i(){let s=n.split(`
`),C=T(s).map(f);if(a.length!==1)throw new Error("At line: EOF. Unmatched directive '#ifdef' or '#ifndef'.");if(a[0].flipped===!0)throw new Error("At line: EOF. Unmatched directives '#else'.");if(s.length!==C.length)throw new Error("Internal error at preprocessor");return C.join(`
`)}function T(s){let _=[],C=0;return s.forEach((b,O)=>{b.endsWith("\\")?C===0?(C=1,_.push(b.slice(0,-1))):(_[_.length-1]+=b.slice(0,-1),C++):C!==0?(_[_.length-1]+=b,_.push(...Array(C).fill("")),C=0):_.push(b)}),C>1&&_.push(...Array(C-1).fill("")),_}function u(s){for(let _ of e){let C=_.regex.exec(s);if(C!==null)return{Code:_,parts:C}}throw new Error("Internal error.")}function d(s){return r.forEach(_=>{let C=new RegExp("\\b"+_.cname+"\\b","g");s=s.replace(C,_.value)}),s}function f(s,_){let C=u(s),b={active:!0,flipped:!1},O;if(l<0)throw new Error(`At line: ${_}. Unmatched '#endif' directive.`);ne(a.length,0,"Internal error");let p=a[a.length-1],E=a[l].active;switch(C.Code.type){case"IFDEF":return l+=E?1:0,O=r.findIndex(S=>S.cname===C.parts[1]),O===-1&&(b.active=!1),a.push(b),"";case"IFNDEF":return l+=E?1:0,O=r.findIndex(S=>S.cname===C.parts[1]),O!==-1&&(b.active=!1),a.push(b),"";case"ELSE":if(p.flipped===!0)throw new Error(`At line: ${_+1}. Unmatched '#else' directive.`);return p.flipped=!0,p.active=!p.active,"";case"ENDIF":return a.length-1===l&&l--,a.pop(),""}if(E===!1)return"";switch(C.Code.type){case"DEFINE_NULL":return O=r.findIndex(S=>S.cname===C.parts[1]),O===-1?(r.push({cname:C.parts[1],value:""}),""):(r[O].value="","");case"DEFINE_VAL":return O=r.findIndex(S=>S.cname===C.parts[1]),O===-1?(r.push({cname:C.parts[1],value:d(C.parts[2]).trim()}),""):(r[O].value=C.parts[2].trim(),"");case"UNDEF":return r=r.filter(S=>S.cname!==C.parts[1]),"";case"MATCHES_ALL":return d(s);default:throw new Error("Internal error.")}}return i()}function le(n){let e=[{char:"=",pretokenType:"equal"},{char:"*",pretokenType:"star"},{char:"!",pretokenType:"not"},{char:"[",pretokenType:"bracket"},{char:"]",pretokenType:"bracket"},{char:"-",pretokenType:"minus"},{char:"+",pretokenType:"plus"},{char:"\\",pretokenType:"backslash"},{char:"/",pretokenType:"forwardslash"},{char:".",pretokenType:"dot"},{char:"<",pretokenType:"less"},{char:">",pretokenType:"greater"},{char:"|",pretokenType:"pipe"},{char:"&",pretokenType:"and"},{char:"%",pretokenType:"percent"},{char:"^",pretokenType:"caret"},{char:",",pretokenType:"comma"},{char:";",pretokenType:"semi"},{char:"~",pretokenType:"tilde"},{char:"`",pretokenType:"grave"},{char:"(",pretokenType:"paren"},{char:")",pretokenType:"paren"},{char:":",pretokenType:"colon"},{char:"{",pretokenType:"curly"},{char:"}",pretokenType:"curly"},{char:"#",pretokenType:"SPECIAL"}],r=[{start:/^(\/\/.*)/,pretokenType:"NONE",addLength:0},{start:/^(\s+)/,pretokenType:"NONE",addLength:0},{start:/^(\d[\d_]*\b)/,pretokenType:"numberDec",addLength:0},{start:/^0[xX]([\da-fA-F][\da-fA-F_]*\b)/,pretokenType:"numberHex",addLength:2},{start:/^(break|case|const|continue|default|do|else|exit|for|goto|halt|if|long|return|sleep|sizeof|switch|void|while)\b/,pretokenType:"keyword",addLength:0},{start:/^(asm)/,pretokenType:"ASM",addLength:0},{start:/^(struct)/,pretokenType:"STRUCT",addLength:0},{start:/^(\w+)/,pretokenType:"variable",addLength:0}],a=[{start:/^\/\*/,end:/^([\s\S]*?\*\/)/,pretokenType:"NONE",startLength:2,removeTrailing:0,errorMsg:"Missing '*/' to end comment section."},{start:/^"/,end:/^([\s\S]*?")/,pretokenType:"string",startLength:1,removeTrailing:1,errorMsg:`Missing '"' to end string.`},{start:/^'/,end:/^([\s\S]*?')/,pretokenType:"string",startLength:1,removeTrailing:1,errorMsg:`Missing "'" to end string.`}],l={currentChar:"",remainingText:"",current:0,preTokens:[],currentLine:1};function i(){for(;l.current<n.length;)if(l.currentChar=n.charAt(l.current),l.remainingText=n.slice(l.current),!a.find(T)&&!r.find(u)&&!e.find(d))throw new Error(`At line: ${l.currentLine}. Forbidden character found: '${l.currentChar}'.`);return l.preTokens}function T(f){if(f.start.exec(l.remainingText)===null)return!1;let _=f.end.exec(l.remainingText.slice(f.startLength));if(l.current+=f.startLength,_===null)throw new Error(`At line: ${l.currentLine}. ${f.errorMsg}`);return f.pretokenType==="NONE"?(l.currentLine+=(_[1].match(/\n/g)||"").length,l.current+=_[1].length,!0):(l.preTokens.push({type:f.pretokenType,value:_[1].slice(0,-f.removeTrailing),line:l.currentLine}),l.currentLine+=(_[1].match(/\n/g)||"").length,l.current+=_[1].length,!0)}function u(f){let s=f.start.exec(l.remainingText);if(s===null)return!1;switch(f.pretokenType){case"NONE":return l.currentLine+=(s[1].match(/\n/g)||"").length,l.current+=s[1].length+f.addLength,!0;case"ASM":{let _=/^(asm[^\w]*\{)([\s\S]*)/.exec(l.remainingText);if(_===null)throw new Error(`At line: ${l.currentLine}. Error parsing 'asm { ... }' keyword`);let C=_[2].indexOf("}");if(C===-1)throw new Error(`At line: ${l.currentLine}. Ending '}' not found for 'asm { ... }' keyword.`);let b=_[2].slice(0,C),O=_[1]+b+"}";return l.preTokens.push({type:"keyword",value:"asm",line:l.currentLine,extValue:b}),l.currentLine+=(O.match(/\n/g)||"").length,l.current+=O.length,!0}case"STRUCT":{let _=/^(struct\s+(\w+))/.exec(l.remainingText);if(_===null)throw new Error(`At line: ${l.currentLine}. 'struct' keyword must be followed by a type name`);return l.preTokens.push({type:"keyword",value:"struct",line:l.currentLine,extValue:_[2]}),l.currentLine+=(_[1].match(/\n/g)||"").length,l.current+=_[1].length,!0}default:return l.preTokens.push({type:f.pretokenType,value:s[1],line:l.currentLine}),l.currentLine+=(s[1].match(/\n/g)||"").length,l.current+=s[1].length+f.addLength,!0}}function d(f){if(f.char!==l.currentChar)return!1;if(f.pretokenType==="SPECIAL"){G(f.char==="#","Internal error at tokenizer."),l.current++;let s=n.slice(l.current).split(`
`)[0];return l.current+=s.length+1,l.currentLine++,l.preTokens.push({type:"macro",value:s,line:l.currentLine-1}),!0}return l.preTokens.push({type:f.pretokenType,value:l.currentChar,line:l.currentLine}),l.current++,!0}return i()}function ce(n){let e=[{sequence:["tilde"],action(d){return{type:"UnaryOperator",precedence:2,value:"~",line:n[d].line}}},{sequence:["semi"],action(d){return{type:"Terminator",precedence:12,value:";",line:n[d].line}}},{sequence:["comma"],action(d){return{type:"Delimiter",precedence:11,value:",",line:n[d].line}}},{sequence:["colon"],action(d){return{type:"Colon",precedence:0,value:":",line:n[d].line}}},{sequence:["dot"],action(d){return{type:"Member",precedence:0,value:".",line:n[d].line}}},{sequence:["macro"],action(d){return{type:"Macro",precedence:0,value:n[d].value,line:n[d].line}}},{sequence:["keyword"],action(d){let f={type:"Keyword",precedence:12,value:n[d].value,line:n[d].line};return(n[d].value==="asm"||n[d].value==="struct")&&(f.extValue=n[d].extValue),n[d].value==="sizeof"&&(f.precedence=2),f}},{sequence:["numberDec"],action(d){let f=n[d],s=BigInt(f.value.replace(/_/g,"")).toString(16);return s=s.padStart((Math.floor((s.length-1)/16)+1)*16,"0"),{type:"Constant",precedence:0,value:s,line:f.line}}},{sequence:["numberHex"],action(d){let f=n[d],s=f.value.replace(/_/g,"").toLowerCase();return s=s.padStart((Math.floor((s.length-1)/16)+1)*16,"0"),{type:"Constant",precedence:0,value:s,line:f.line}}},{sequence:["string"],action(d){let f=n[d],s=Ie(f.value),_=/^(BURST-|S-|TS-)([0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{5})/.exec(f.value);return _!==null&&(s=ve(_[2],f.line)),{type:"Constant",precedence:0,value:s,line:f.line}}},{sequence:["equal","equal"],action(d){return{type:"Comparision",precedence:6,value:"==",line:n[d].line}}},{sequence:["equal"],action(d){return{type:"Assignment",precedence:10,value:"=",line:n[d].line}}},{sequence:["not","equal"],action(d){return{type:"Comparision",precedence:6,value:"!=",line:n[d].line}}},{sequence:["not"],action(d){return{type:"UnaryOperator",precedence:2,value:"!",line:n[d].line}}},{sequence:["forwardslash","equal"],action(d){return{type:"SetOperator",precedence:10,value:"/=",line:n[d].line}}},{sequence:["forwardslash"],action(d){return{type:"Operator",precedence:3,value:"/",line:n[d].line}}},{sequence:["percent","equal"],action(d){return{type:"SetOperator",precedence:10,value:"%=",line:n[d].line}}},{sequence:["percent"],action(d){return{type:"Operator",precedence:3,value:"%",line:n[d].line}}},{sequence:["less","less","equal"],action(d){return{type:"SetOperator",precedence:10,value:"<<=",line:n[d].line}}},{sequence:["less","less"],action(d){return{type:"Operator",precedence:5,value:"<<",line:n[d].line}}},{sequence:["less","equal"],action(d){return{type:"Comparision",precedence:6,value:"<=",line:n[d].line}}},{sequence:["less"],action(d){return{type:"Comparision",precedence:6,value:"<",line:n[d].line}}},{sequence:["pipe","pipe"],action(d){return{type:"Comparision",precedence:9,value:"||",line:n[d].line}}},{sequence:["pipe","equal"],action(d){return{type:"SetOperator",precedence:10,value:"|=",line:n[d].line}}},{sequence:["pipe"],action(d){return{type:"Operator",precedence:7,value:"|",line:n[d].line}}},{sequence:["greater","equal"],action(d){return{type:"Comparision",precedence:6,value:">=",line:n[d].line}}},{sequence:["greater","greater","equal"],action(d){return{type:"SetOperator",precedence:10,value:">>=",line:n[d].line}}},{sequence:["greater","greater"],action(d){return{type:"Operator",precedence:5,value:">>",line:n[d].line}}},{sequence:["greater"],action(d){return{type:"Comparision",precedence:6,value:">",line:n[d].line}}},{sequence:["caret","equal"],action(d){return{type:"SetOperator",precedence:10,value:"^=",line:n[d].line}}},{sequence:["caret"],action(d){return{type:"Operator",precedence:7,value:"^",line:n[d].line}}},{sequence:["variable"],action(d){return{type:"Variable",precedence:0,value:n[d].value,line:n[d].line}}},{sequence:["star","equal"],action(d){return{type:"SetOperator",precedence:10,value:"*=",line:n[d].line}}},{sequence:["star"],action(d){return u(d)?{type:"Operator",precedence:3,value:"*",line:n[d].line}:{type:"UnaryOperator",precedence:2,value:"*",line:n[d].line}}},{sequence:["plus","equal"],action(d){return{type:"SetOperator",precedence:10,value:"+=",line:n[d].line}}},{sequence:["plus","plus"],action(d){return{type:"SetUnaryOperator",precedence:1,value:"++",line:n[d].line}}},{sequence:["plus"],action(d){return u(d)?{type:"Operator",precedence:4,value:"+",line:n[d].line}:{type:"UnaryOperator",precedence:2,value:"+",line:n[d].line}}},{sequence:["minus","minus"],action(d){return{type:"SetUnaryOperator",precedence:1,value:"--",line:n[d].line}}},{sequence:["minus","equal"],action(d){return{type:"SetOperator",precedence:10,value:"-=",line:n[d].line}}},{sequence:["minus","greater"],action(d){return{type:"Member",precedence:0,value:"->",line:n[d].line}}},{sequence:["minus"],action(d){return u(d)?{type:"Operator",precedence:4,value:"-",line:n[d].line}:{type:"UnaryOperator",precedence:2,value:"-",line:n[d].line}}},{sequence:["and","and"],action(d){return{type:"Comparision",precedence:8,value:"&&",line:n[d].line}}},{sequence:["and","equal"],action(d){return{type:"SetOperator",precedence:10,value:"&=",line:n[d].line}}},{sequence:["and"],action(d){return u(d)?{type:"Operator",precedence:7,value:"&",line:n[d].line}:{type:"UnaryOperator",precedence:2,value:"&",line:n[d].line}}}],r={mainLoopIndex:0};function a(){let d=[];for(;r.mainLoopIndex<n.length;)d.push(l());return d}function l(){let d=n[r.mainLoopIndex],f,s=e.find(T);if(s!==void 0)return f=s.action(r.mainLoopIndex),r.mainLoopIndex+=s.sequence.length,f;switch(d.value){case"]":case")":case"}":throw new Error(`At line: ${d.line}. Unexpected closing '${d.value}'.`);case"[":return f={type:"Arr",value:"",precedence:0,line:d.line},r.mainLoopIndex++,f.params=i("]",f.type,f.line),f;case"(":return r.mainLoopIndex>0&&n[r.mainLoopIndex-1].type==="variable"?f={type:"Function",value:"",precedence:0,line:d.line}:f={type:"CodeCave",value:"",precedence:0,line:d.line},r.mainLoopIndex++,f.params=i(")",f.type,f.line),f;case"{":return f={type:"CodeDomain",value:"",precedence:0,line:d.line},r.mainLoopIndex++,f.params=i("}",f.type,f.line),f;default:throw new Error(`At line: ${d.line}. Unexpected token '${d.value}' - type: '${d.type}'.`)}}function i(d,f,s){let _=[];if(r.mainLoopIndex>=n.length)throw new Error(`At line: end of file. Missing closing '${d}' for for '${f}' started at line: ${s}.`);for(;n[r.mainLoopIndex].value!==d;)if(_.push(l()),r.mainLoopIndex>=n.length)throw new Error(`At line: end of file. Missing closing '${d}' for for '${f}' started at line: ${s}.`);return r.mainLoopIndex++,_}function T(d){for(let f=0;f<d.sequence.length;f++)if(n[r.mainLoopIndex+f]?.type!==d.sequence[f])return!1;return!0}function u(d){return d>=2&&(n[d-1].type==="plus"&&n[d-2].type==="plus"||n[d-1].type==="minus"&&n[d-2].type==="minus")||d>=1&&(n[d-1].type==="variable"||n[d-1].type==="numberDec"||n[d-1].type==="numberHex"||n[d-1].type==="string"||n[d-1].value==="]"||n[d-1].value===")")}return a()}function ae(n){let e;switch(n){case"register":e={type:"register",name:"",MemoryTemplate:Q("register")},e.MemoryTemplate.declaration="long",e.MemoryTemplate.size=1,e.MemoryTemplate.isDeclared=!0;break;case"long":e={type:"long",name:"",MemoryTemplate:Q("long")},e.MemoryTemplate.declaration="long",e.MemoryTemplate.size=1;break;case"struct":e={name:"",type:"struct",structMembers:[],structAccumulatedSize:[],MemoryTemplate:Q("struct")},e.MemoryTemplate.typeDefinition="",e.MemoryTemplate.declaration="struct";break;default:throw new Error("Internal error")}return e}function Q(n){return{type:n,asmName:"",isDeclared:!1,declaration:"",address:-1,name:"",scope:"",size:-1}}var ye=[{argsMemObj:[],asmName:"get_A1",declaration:"long",sentences:[],name:"Get_A1"},{argsMemObj:[],asmName:"get_A2",declaration:"long",sentences:[],name:"Get_A2"},{argsMemObj:[],asmName:"get_A3",declaration:"long",sentences:[],name:"Get_A3"},{argsMemObj:[],asmName:"get_A4",declaration:"long",sentences:[],name:"Get_A4"},{argsMemObj:[],asmName:"get_B1",declaration:"long",sentences:[],name:"Get_B1"},{argsMemObj:[],asmName:"get_B2",declaration:"long",sentences:[],name:"Get_B2"},{argsMemObj:[],asmName:"get_B3",declaration:"long",sentences:[],name:"Get_B3"},{argsMemObj:[],asmName:"get_B4",declaration:"long",sentences:[],name:"Get_B4"},{argsMemObj:[{address:-1,name:"addr",asmName:"Set_A1_addr",type:"long",scope:"Set_A1",declaration:"long",size:1,isDeclared:!0}],asmName:"set_A1",declaration:"void",sentences:[],name:"Set_A1"},{argsMemObj:[{address:-1,name:"addr",asmName:"Set_A2_addr",type:"long",scope:"Set_A2",declaration:"long",size:1,isDeclared:!0}],asmName:"set_A2",declaration:"void",sentences:[],name:"Set_A2"},{argsMemObj:[{address:-1,name:"addr",asmName:"Set_A3_addr",type:"long",scope:"Set_A3",declaration:"long",size:1,isDeclared:!0}],asmName:"set_A3",declaration:"void",sentences:[],name:"Set_A3"},{argsMemObj:[{address:-1,name:"addr",asmName:"Set_A4_addr",type:"long",scope:"Set_A4",declaration:"long",size:1,isDeclared:!0}],asmName:"set_A4",declaration:"void",sentences:[],name:"Set_A4"},{argsMemObj:[{address:-1,name:"addr1",asmName:"Set_A1_A2_addr1",type:"long",scope:"Set_A1_A2",declaration:"long",size:1,isDeclared:!0},{address:-1,name:"addr2",asmName:"Set_A1_A2_addr2",type:"long",scope:"Set_A1_A2",declaration:"long",size:1,isDeclared:!0}],asmName:"set_A1_A2",declaration:"void",sentences:[],name:"Set_A1_A2"},{argsMemObj:[{address:-1,name:"addr1",asmName:"Set_A3_A4_addr1",type:"long",scope:"Set_A3_A4",declaration:"long",size:1,isDeclared:!0},{address:-1,name:"addr2",asmName:"Set_A3_A4_addr2",type:"long",scope:"Set_A3_A4",declaration:"long",size:1,isDeclared:!0}],asmName:"set_A3_A4",declaration:"void",sentences:[],name:"Set_A3_A4"},{argsMemObj:[{address:-1,name:"addr",asmName:"Set_B1_addr",type:"long",scope:"Set_B1",declaration:"long",size:1,isDeclared:!0}],asmName:"set_B1",declaration:"void",sentences:[],name:"Set_B1"},{argsMemObj:[{address:-1,name:"addr",asmName:"Set_B2_addr",type:"long",scope:"Set_B2",declaration:"long",size:1,isDeclared:!0}],asmName:"set_B2",declaration:"void",sentences:[],name:"Set_B2"},{argsMemObj:[{address:-1,name:"addr",asmName:"Set_B3_addr",type:"long",scope:"Set_B3",declaration:"long",size:1,isDeclared:!0}],asmName:"set_B3",declaration:"void",sentences:[],name:"Set_B3"},{argsMemObj:[{address:-1,name:"addr",asmName:"Set_B4_addr",type:"long",scope:"Set_B4",declaration:"long",size:1,isDeclared:!0}],asmName:"set_B4",declaration:"void",sentences:[],name:"Set_B4"},{argsMemObj:[{address:-1,name:"addr1",asmName:"Set_B1_B2_addr1",type:"long",scope:"Set_B1_B2",declaration:"long",size:1,isDeclared:!0},{address:-1,name:"addr2",asmName:"Set_B1_B2_addr2",type:"long",scope:"Set_B1_B2",declaration:"long",size:1,isDeclared:!0}],asmName:"set_B1_B2",declaration:"void",sentences:[],name:"Set_B1_B2"},{argsMemObj:[{address:-1,name:"addr1",asmName:"Set_B3_B4_addr1",type:"long",scope:"Set_B3_B4",declaration:"long",size:1,isDeclared:!0},{address:-1,name:"addr2",asmName:"Set_B3_B4_addr2",type:"long",scope:"Set_B3_B4",declaration:"long",size:1,isDeclared:!0}],asmName:"set_B3_B4",declaration:"void",sentences:[],name:"Set_B3_B4"},{argsMemObj:[],asmName:"clear_A",declaration:"void",sentences:[],name:"Clear_A"},{argsMemObj:[],asmName:"clear_B",declaration:"void",sentences:[],name:"Clear_B"},{argsMemObj:[],asmName:"clear_A_B",declaration:"void",sentences:[],name:"Clear_A_And_B"},{argsMemObj:[],asmName:"copy_A_From_B",declaration:"void",sentences:[],name:"Copy_A_From_B"},{argsMemObj:[],asmName:"copy_B_From_A",declaration:"void",sentences:[],name:"Copy_B_From_A"},{argsMemObj:[],asmName:"check_A_Is_Zero",declaration:"long",sentences:[],name:"Check_A_Is_Zero"},{argsMemObj:[],asmName:"check_B_Is_Zero",declaration:"long",sentences:[],name:"Check_B_Is_Zero"},{argsMemObj:[],asmName:"check_A_equals_B",declaration:"long",sentences:[],name:"Check_A_Equals_B"},{argsMemObj:[],asmName:"swap_A_and_B",declaration:"void",sentences:[],name:"Swap_A_and_B"},{argsMemObj:[],asmName:"OR_A_with_B",declaration:"void",sentences:[],name:"OR_A_with_B"},{argsMemObj:[],asmName:"OR_B_with_A",declaration:"void",sentences:[],name:"OR_B_with_A"},{argsMemObj:[],asmName:"AND_A_with_B",declaration:"void",sentences:[],name:"AND_A_with_B"},{argsMemObj:[],asmName:"AND_B_with_A",declaration:"void",sentences:[],name:"AND_B_with_A"},{argsMemObj:[],asmName:"XOR_A_with_B",declaration:"void",sentences:[],name:"XOR_A_with_B"},{argsMemObj:[],asmName:"XOR_B_with_A",declaration:"void",sentences:[],name:"XOR_B_with_A"},{argsMemObj:[],asmName:"add_A_to_B",declaration:"void",sentences:[],name:"Add_A_To_B"},{argsMemObj:[],asmName:"add_B_to_A",declaration:"void",sentences:[],name:"Add_B_To_A"},{argsMemObj:[],asmName:"sub_A_from_B",declaration:"void",sentences:[],name:"Sub_A_From_B"},{argsMemObj:[],asmName:"sub_B_from_A",declaration:"void",sentences:[],name:"Sub_B_From_A"},{argsMemObj:[],asmName:"mul_A_by_B",declaration:"void",sentences:[],name:"Mul_A_By_B"},{argsMemObj:[],asmName:"mul_B_by_A",declaration:"void",sentences:[],name:"Mul_B_By_A"},{argsMemObj:[],asmName:"div_A_by_B",declaration:"void",sentences:[],name:"Div_A_By_B"},{argsMemObj:[],asmName:"div_B_by_A",declaration:"void",sentences:[],name:"Div_B_By_A"},{argsMemObj:[],asmName:"MD5_A_to_B",declaration:"void",sentences:[],name:"MD5_A_To_B"},{argsMemObj:[],asmName:"check_MD5_A_with_B",declaration:"long",sentences:[],name:"Check_MD5_A_With_B"},{argsMemObj:[],asmName:"HASH160_A_to_B",declaration:"void",sentences:[],name:"HASH160_A_To_B"},{argsMemObj:[],asmName:"check_HASH160_A_with_B",declaration:"long",sentences:[],name:"Check_HASH160_A_With_B"},{argsMemObj:[],asmName:"SHA256_A_to_B",declaration:"void",sentences:[],name:"SHA256_A_To_B"},{argsMemObj:[],asmName:"check_SHA256_A_with_B",declaration:"long",sentences:[],name:"Check_SHA256_A_With_B"},{argsMemObj:[],asmName:"get_Block_Timestamp",declaration:"long",sentences:[],name:"Get_Block_Timestamp"},{argsMemObj:[],asmName:"get_Creation_Timestamp",declaration:"long",sentences:[],name:"Get_Creation_Timestamp"},{argsMemObj:[],asmName:"get_Last_Block_Timestamp",declaration:"long",sentences:[],name:"Get_Last_Block_Timestamp"},{argsMemObj:[],asmName:"put_Last_Block_Hash_In_A",declaration:"void",sentences:[],name:"Put_Last_Block_Hash_In_A"},{argsMemObj:[{address:-1,name:"addr",asmName:"A_To_Tx_After_Timestamp_addr",type:"long",scope:"A_To_Tx_After_Timestamp",declaration:"long",size:1,isDeclared:!0}],asmName:"A_to_Tx_after_Timestamp",declaration:"void",sentences:[],name:"A_To_Tx_After_Timestamp"},{argsMemObj:[],asmName:"get_Type_for_Tx_in_A",declaration:"long",sentences:[],name:"Get_Type_For_Tx_In_A"},{argsMemObj:[],asmName:"get_Amount_for_Tx_in_A",declaration:"long",sentences:[],name:"Get_Amount_For_Tx_In_A"},{argsMemObj:[],asmName:"get_Timestamp_for_Tx_in_A",declaration:"long",sentences:[],name:"Get_Timestamp_For_Tx_In_A"},{argsMemObj:[],asmName:"get_Ticket_Id_for_Tx_in_A",declaration:"long",sentences:[],name:"Get_Random_Id_For_Tx_In_A"},{argsMemObj:[],asmName:"message_from_Tx_in_A_to_B",declaration:"void",sentences:[],name:"Message_From_Tx_In_A_To_B"},{argsMemObj:[],asmName:"B_to_Address_of_Tx_in_A",declaration:"void",sentences:[],name:"B_To_Address_Of_Tx_In_A"},{argsMemObj:[],asmName:"B_to_Address_of_Creator",declaration:"void",sentences:[],name:"B_To_Address_Of_Creator"},{argsMemObj:[],asmName:"get_Current_Balance",declaration:"long",sentences:[],name:"Get_Current_Balance"},{argsMemObj:[],asmName:"get_Previous_Balance",declaration:"long",sentences:[],name:"Get_Previous_Balance"},{argsMemObj:[{address:-1,name:"addr",asmName:"Send_To_Address_In_B_addr",type:"long",scope:"Send_To_Address_In_B",declaration:"long",size:1,isDeclared:!0}],asmName:"send_to_Address_in_B",declaration:"void",sentences:[],name:"Send_To_Address_In_B"},{argsMemObj:[],asmName:"send_All_to_Address_in_B",declaration:"void",sentences:[],name:"Send_All_To_Address_In_B"},{argsMemObj:[],asmName:"send_Old_to_Address_in_B",declaration:"void",sentences:[],name:"Send_Old_To_Address_In_B"},{argsMemObj:[],asmName:"send_A_to_Address_in_B",declaration:"void",sentences:[],name:"Send_A_To_Address_In_B"},{argsMemObj:[{address:-1,name:"addr2",asmName:"Add_Minutes_To_Timestamp_addr2",type:"long",scope:"Add_Minutes_To_Timestamp",declaration:"long",size:1,isDeclared:!0},{address:-1,name:"addr3",asmName:"Add_Minutes_To_Timestamp_addr3",type:"long",scope:"Add_Minutes_To_Timestamp",declaration:"long",size:1,isDeclared:!0}],asmName:"add_Minutes_to_Timestamp",declaration:"long",sentences:[],name:"Add_Minutes_To_Timestamp"}];function W(n,e=[],r=!1){let a=0,l=0;function i(){r&&e.push({type:"Terminator",value:";",precedence:11,line:-1});let t=[];for(;a<e.length;a++)t=t.concat(T());return t}function T(){let t=[],c=e[a]?.line??-1;if(e[a].type==="CodeDomain")return W(n,e[a].params);switch(e[a].value){case"if":return u();case"while":return d();case"for":return f();case"else":throw new Error(`At line: ${c}. 'else' not associated with an 'if(){}else{}' sentence`);case"asm":return[{type:"phrase",code:[e[a]],line:c}];case"do":return s();case"switch":return C();case"case":return b();case"default":return O();case"break":return E();case"continue":return S();case"struct":if(e[a+1]?.type==="CodeDomain")return _()}for(;a<e.length;){if(e[a].type==="Terminator")return[{type:"phrase",code:t,line:c}];if(e[a].type==="Colon")return p(t,c);switch(e[a].value){case"if":case"while":case"for":case"else":case"asm":case"label":case"do":case"break":case"continue":case"switch":case"case":case"default":throw new Error(`At line: ${e[a].line}. Statement including '${e[a].value}' in wrong way. Possible missing ';' before it.`)}t.push(e[a]),a++}throw new Error(`At line: ${e[a-1].line}. Missing ';'. `)}function u(){let t=e[a].line,c=`__if${t}`;if(a++,e[a]===void 0||e[a].type!=="CodeCave")throw new Error(`At line: ${e[a-1].line}. Expecting condition for 'if' statement.`);let o=e[a].params;a++;let $=T();return e[a+1]?.type==="Keyword"&&e[a+1]?.value==="else"?(a+=2,[{type:"ifElse",id:c,line:t,condition:o,trueBlock:$,falseBlock:T()}]):[{type:"ifEndif",id:c,line:t,condition:o,trueBlock:$}]}function d(){let t=e[a].line,c=`__loop${t}`;if(a++,e[a]===void 0||e[a].type!=="CodeCave")throw new Error(`At line: ${e[a-1].line}. Expecting condition for 'while' statement.`);let o=e[a].params;a++,n.latestLoopId.push(c);let $=T();return n.latestLoopId.pop(),[{type:"while",id:c,line:t,condition:o,trueBlock:$}]}function f(){let t=e[a].line,c=`__loop${t}`;if(a++,e[a]===void 0||e[a]?.type!=="CodeCave")throw new Error(`At line: ${e[a-1].line}. Expecting condition for 'for' statement.`);let o=W(n,e[a].params,!0);if(o.length!==3)throw new Error(`At line: ${t}. Expected 3 sentences for 'for(;;){}' loop. Got ${o.length}`);if(!o.every(g=>g.type==="phrase"))throw new Error(`At line: ${t}. Sentences inside 'for(;;)' can not be other loops or conditionals`);a++,n.latestLoopId.push(c);let $=T();return n.latestLoopId.pop(),[{type:"for",id:c,line:t,threeSentences:o,trueBlock:$}]}function s(){let t=e[a].line,c=`__loop${t}`;a++,n.latestLoopId.push(c);let o=T();if(n.latestLoopId.pop(),a++,e[a]?.value==="while"&&e[a+1]?.type==="CodeCave"&&e[a+2]?.type==="Terminator")return a+=2,[{type:"do",id:c,line:t,trueBlock:o,condition:e[a-1].params}];throw new Error(`At line: ${e[a].line}. Wrong do{}while(); sentence.`)}function _(){let t=e[a].line,c=ne(e[a].extValue,"","Internal error. Missing struct type name.");a++;let o={type:"struct",line:t,name:c,members:T(),Phrase:{type:"phrase",line:e[a-1].line}};for(o.Phrase.code=[e[a-1]],a++;a<e.length;){if(e[a].type==="Terminator")return[o];o.Phrase.code.push(e[a]),a++}throw new Error(`At line: end of file. Missing ';' to end 'struct' statement started at line ${t}.`)}function C(){let t=e[a].line,c=`__switch${t}`;if(a++,e[a]===void 0||e[a].type!=="CodeCave")throw new Error(`At line: ${t}. Expecting (expression) for 'switch (expr) {block}' statement.`);if(e[a+1]===void 0||e[a+1].type!=="CodeDomain")throw new Error(`At line: ${t}. Expecting a {block} for 'switch (expression) {block}' statement.`);let o=B(e[a].params);if(o.length===0)throw new Error(`At line: ${t}. Expression cannot be empty in 'switch (expression) {block}' statement.`);a++,n.latestLoopId.push(c);let $=T();n.latestLoopId.pop();let g=$.reduce((M,w)=>w.type==="case"?M.concat([B(w.condition)]):M,[]),N=$.filter(M=>M.type==="default");if(g.length===0)throw new Error(`At line: ${t}. 'switch' statement must include at least one 'case' label.`);if(N.length>1)throw new Error(`At line: ${t}. 'switch' statement cannot have two or more 'default' labels.`);return[{type:"switch",line:t,expression:o,cases:g,hasDefault:Boolean(N.length),block:$}]}function b(){let t=e[a].line;if(a++,e[a]===void 0)throw new Error(`At line: ${e[a-1].line}. Expecting variable for 'case var:' statement.`);if(n.latestLoopId.length===0||!n.latestLoopId[n.latestLoopId.length-1].includes("switch"))throw new Error(`At line: ${t}. 'case' outside a switch statement.`);let c=[e[a]];if(e[a].type==="CodeCave"&&(c=B(e[a].params)),a++,e[a]===void 0||e[a].type!=="Colon")throw new Error(`At line: ${e[a-1].line}. Missing ':' in 'case var :' statement.`);let o="_"+l;return l++,[{type:"case",caseId:o,line:t,condition:c}]}function O(){let t=e[a].line;if(a++,e[a]===void 0||e[a].type!=="Colon")throw new Error(`At line: ${e[a-1].line}. Missing ':' in 'default :' statement.`);if(n.latestLoopId.length===0||!n.latestLoopId[n.latestLoopId.length-1].includes("switch"))throw new Error(`At line: ${t}. 'default' outside a switch statement.`);return[{type:"default",line:t}]}function p(t,c){if(t.length===0)throw new Error(`At line: ${c}. Unexpected ':'.`);if(t.length>1)throw new Error(`At line: ${c}.  Labels cannot have more than one word. Maybe missing ';'?`);if(t[0].type!=="Variable")throw new Error(`At line: ${c}.  Labels must be a name.`);return[{type:"label",line:c,id:t[0].value}]}function E(){let t=e[a].line;if(n.latestLoopId.length===0)throw new Error(`At line: ${t}. 'break' outside a loop or switch.`);if(e[a+1]?.type==="Terminator")return a++,e[a-1].extValue=n.latestLoopId[n.latestLoopId.length-1],[{type:"phrase",code:[e[a-1]],line:t}];throw new Error(`At line: ${t}. Missing ';' after 'break' keyword.`)}function S(){let t=e[a].line,c=n.latestLoopId.reduce((o,$)=>$.includes("loop")?$:o,"");if(c==="")throw new Error(`At line: ${t}. 'continue' outside a loop.`);if(e[a+1]?.type==="Terminator")return a++,e[a-1].extValue=c,[{type:"phrase",code:[e[a-1]],line:t}];throw new Error(`At line: ${t}. Missing ';' after 'continue' keyword.`)}return i()}function ee(n,e,r,a=""){let l=0;function i(){let E=[];if(r.length===0)return E;for(l=0;r[l]?.type==="Keyword";)switch(r[l].value){case"long":case"void":E.push(...T(r[l].value));break;case"struct":E.push(...C());break;default:l++}return E}function T(E){let S=[],t=l,c=!0;for(l++;l<r.length;)switch(r[l].type){case"Delimiter":if(t+1===l)throw new Error(`At line: ${r[l].line}. Delimiter ',' not expected.`);l++,c=!0;break;case"Keyword":return S;case"Variable":{if(c===!1){l++;break}S.push(...u(E)),c=!1,l++;break}default:l++}return S}function u(E){let S=ae("long"),t=s(),c=l,o=d(),$=P(S.MemoryTemplate);if($.name=r[c].value,$.asmName=e.currentPrefix+r[c].value,$.scope=e.currentScopeName,E==="void"){if(t===!1)throw new Error(`At line: ${r[c].line}. Can not declare variables as void.`);$.declaration="void_ptr"}else t&&($.declaration+="_ptr");if($.isDeclared=e.isFunctionArgument,o.length===0)return[$];$.type="array",$.typeDefinition=a+$.asmName,$.ArrayItem={type:"long",declaration:$.declaration,typeDefinition:a+$.asmName,totalSize:0},t===!1&&($.declaration+="_ptr"),$.ArrayItem.totalSize=1+o.reduce(function(N,M){return N*M},1);let g=[$];for(let N=1;N<$.ArrayItem.totalSize;N++){let M=P(S.MemoryTemplate);M.name=`${$.name}_${N-1}`,M.asmName=`${$.asmName}_${N-1}`,M.scope=e.currentScopeName,M.declaration=$.ArrayItem.declaration,g.push(M)}return n.push(_($,o)),g}function d(){let E=[];for(;l+1<r.length&&r[l+1].type==="Arr";)l++,E.push(f(r[l].params,r[l].line));return E}function f(E=[],S=-1){if(E.length!==1||E[0].type!=="Constant")throw new Error(`At line: ${S}. Wrong array declaration. Only constant size declarations allowed.`);return parseInt(E[0].value,16)}function s(){return r[l-1].value==="*"}function _(E,S){let t={name:B(E.typeDefinition,"Internal error. Missing type definion."),type:"array",arrayDimensions:P(S),arrayMultiplierDim:[],MemoryTemplate:E},c=S.length-1,o=E.size;do t.arrayMultiplierDim.unshift(o),o*=S[c],c--;while(c>=0);return t}function C(){let E=[],S=!1,t=l;G(r[l].value==="struct","Internal error.");let c=ne(r[t].extValue,"","Internal error. Unknow type definition");for(l++;l<r.length;){let o=r[l].line;switch(r[l].type){case"Delimiter":if(t+1===l)throw new Error(`At line: ${o}. Delimiter ',' not expected.`);l++,S=!1;break;case"Keyword":return E;case"UnaryOperator":case"Operator":if(r[l].value==="*"){S=!0,l++;break}throw new Error(`At line: ${o}. Invalid element (value: '${r[l].value}') found in struct definition.`);case"Variable":if(e.isFunctionArgument&&!S)throw new Error(`At line: ${o}. Passing struct by value as argument is not supported. Pass by reference.`);E.push(...b(c,r[t].line)),l++;break;default:throw new Error(`At line: ${o}. Invalid element (type: '${r[l].type}'  value: '${r[l].value}') found in struct definition!`)}}return E}function b(E,S){let t=[],c=O(E),o,$=s(),g=l,N=d();if(N.length===0){if($===!1){if(c===void 0)throw new Error(`At line: ${S}. Could not find type definition for 'struct' '${E}'.`);return p(E,r[l].value,$)}return c===void 0?(o=Q("structRef"),o.typeDefinition=E,o.size=1,o.declaration="struct_ptr"):(o=P(c.MemoryTemplate),o.declaration="struct_ptr",o.type="structRef",o.size=1),o.name=r[g].value,o.asmName=e.currentPrefix+r[g].value,o.scope=e.currentScopeName,o.isDeclared=e.isFunctionArgument,[o]}if(c===void 0)throw new Error(`At line: ${S}. Could not find type definition for 'struct' '${E}'.`);if(o=P(c.MemoryTemplate),$)throw new Error(`At line: ${S}. Arrays of struct pointers are not currently supported.`);o.name=r[g].value,o.asmName=e.currentPrefix+r[g].value,o.scope=e.currentScopeName,o.isDeclared=e.isFunctionArgument,o.type="array",o.typeDefinition=o.asmName,o.ArrayItem={type:o.type,declaration:o.declaration,typeDefinition:e.currentPrefix+E,totalSize:0},o.ArrayItem.totalSize=1+N.reduce(function(M,w){return M*w},o.size),t.push(o);for(let M=1;M<o.ArrayItem.totalSize;M+=o.size)t.push(...p(E,r[l-N.length].value+"_"+((M-1)/o.size).toString(),$));return n.push(_(o,N)),t}function O(E=""){let S=n.find(t=>t.type==="struct"&&t.name===E);return S===void 0&&e.currentPrefix.length>0&&(S=n.find(t=>t.type==="struct"&&t.name===e.currentPrefix+E)),S}function p(E,S,t){let c=B(O(E),"Internal error."),o=[P(c.MemoryTemplate)];return t||o.push(...P(c.structMembers)),o.forEach($=>{$.name===""?$.name=S:$.name=S+"_"+$.name,$.asmName=e.currentPrefix+$.name}),o}return i()}function se(n,e){let r={latestLoopId:[],isFunctionArgument:!1,currentScopeName:"",currentPrefix:""};function a(){l(),n.Global.macros.forEach(i),d(),n.typesDefinitions=[ae("register"),ae("long")],n.memory.push(...f(n.Config.maxAuxVars)),n.memory.push(..._(n.Config.maxConstVars)),C(),n.functions.forEach(p),n.Config.APIFunctions&&(n.Global.APIFunctions=ye.slice()),S(),E(),t()}function l(){n.Global.code=[];let c=0;for(;c<e.length;){if(e[c].type==="Keyword"&&e[c+1]?.type==="Variable"&&e[c+2]?.type==="Function"&&e[c+3]?.type==="CodeDomain"){if(e[c].value==="struct")throw new Error(`At line: ${e[c].line}. Function returning a struct currently not implemented.`);n.functions.push({argsMemObj:[],sentences:[],declaration:e[c].value,line:e[c+1].line,name:e[c+1].value,arguments:e[c+2].params,code:e[c+3].params}),c+=4;continue}if(e[c].type==="Keyword"&&e[c+1]?.type==="UnaryOperator"&&e[c+1]?.value==="*"&&e[c+2]?.type==="Variable"&&e[c+3]?.type==="Function"&&e[c+4]?.type==="CodeDomain"){n.functions.push({argsMemObj:[],sentences:[],declaration:e[c].value+"_ptr",typeDefinition:e[c].extValue,line:e[c+2].line,name:e[c+2].value,arguments:e[c+3].params,code:e[c+4].params}),c+=5;continue}if(e[c].type==="Macro"){let o=e[c].value.replace(/\s\s+/g," ").split(" ");n.Global.macros.push({type:o[0],property:o[1],value:o.slice(2).join(" "),line:e[c].line}),c++;continue}n.Global.code.push(e[c]),c++}}function i(c){let o,$=!1,g=!1;switch(c.value){case void 0:case"":case"true":case"1":o=!0;break;case"false":case"0":o=!1;break;default:o=!0,$=!0}switch(c.type){case"pragma":g=T(c,o);break;case"include":if(c.property==="APIFunctions"){n.Config.APIFunctions=o,g=!0;break}throw new Error(`At line: ${c.line}. Unknow macro property '#${c.type} ${c.property}'. Do you mean 'APIFunctions'? Check valid values on Help page`);case"program":u(c);break;default:throw new Error(`At line: ${c.line}. Unknow macro: '#${c.type}'. Please check valid values on Help page`)}if($&&g)throw new Error(`At line: ${c.line}. Macro: '#${c.type} ${c.property}' with wrong value. Please check valid values on Help page.`)}function T(c,o){let $=parseInt(c.value);switch(c.property){case"maxAuxVars":if($>=1&&$<=10)return n.Config.maxAuxVars=$,!1;throw new Error(`At line: ${c.line}. Value out of permitted range 1..10.`);case"maxConstVars":if($>=0&&$<=10)return n.Config.maxConstVars=$,!1;throw new Error(`At line: ${c.line}. Value out of permitted range 0..10.`);case"reuseAssignedVar":return n.Config.reuseAssignedVar=o,!0;case"enableRandom":return n.Config.enableRandom=o,!0;case"enableLineLabels":return n.Config.enableLineLabels=o,!0;case"optimizationLevel":if($>=0&&$<=3)return n.Config.optimizationLevel=$,!1;throw new Error(`At line: ${c.line}. Value out of permitted range 0..3.`);case"version":return n.Config.sourcecodeVersion=c.value,!1;case"warningToError":return n.Config.warningToError=o,!0;case"outputSourceLineNumber":return n.Config.outputSourceLineNumber=o,!0;default:throw new Error(`At line: ${c.line}. Unknow macro property: '#${c.type} ${c.property}'. Please check valid values on Help page`)}}function u(c){switch(c.property){case"name":if(/^[0-9a-zA-Z]{1,30}$/.test(c.value)){n.Config.PName=c.value;return}throw new Error(`At line: ${c.line}. Program name must contains only letters [a-z][A-Z][0-9], from 1 to 30 chars.`);case"description":if(c.value.length>=1e3)throw new Error(`At line: ${c.line}. Program description max lenght is 1000 chars. It is ${c.value.length} chars.`);n.Config.PDescription=c.value;return;case"activationAmount":if(/^[0-9_]{1,20}$/.test(c.value)){n.Config.PActivationAmount=c.value.replace(/_/g,"");return}throw new Error(`At line: ${c.line}. Program activation must be only numbers or '_'.`);case"userStackPages":if(/^\d\s*$|^10\s*$/.test(c.value)){n.Config.PUserStackPages=Number(c.value);return}throw new Error(`At line: ${c.line}. Program user stack pages must be a number between 0 and 10, included.`);case"codeStackPages":if(/^\d\s*$|^10\s*$/.test(c.value)){n.Config.PCodeStackPages=Number(c.value);return}throw new Error(`At line: ${c.line}. Program code stack pages must be a number between 0 and 10, included.`);default:throw new Error(`At line: ${c.line}. Unknow macro property: '#${c.type} ${c.property}'. Please check valid values on Help page`)}}function d(){if(n.Config.sourcecodeVersion===""){if(!n.Config.compilerVersion.includes("dev"))throw new Error(`Compiler version not set. Pin current compiler version in your program adding '#pragma version ${n.Config.compilerVersion}' to code.`);n.Config.sourcecodeVersion=n.Config.compilerVersion}if(n.Config.sourcecodeVersion!==n.Config.compilerVersion){if(n.Config.sourcecodeVersion!=="dev")throw new Error(`This compiler is version '${n.Config.compilerVersion}'. File needs a compiler version '${n.Config.sourcecodeVersion}'. Update '#pragma version' macro or run another SmartC version.`);n.Config.sourcecodeVersion=n.Config.compilerVersion}}function f(c){let o=s(),$=[];for(let g=0;g<c;g++){let N=P(o.MemoryTemplate);N.name=`r${g}`,N.asmName=`r${g}`,$.push(N)}return $}function s(){let c=n.typesDefinitions.find(o=>o.type==="register");return B(c,"Internal error.")}function _(c){let o=s(),$=[];for(let g=1;g<=c;g++){let N=P(o.MemoryTemplate);N.name=`n${g}`,N.asmName=`n${g}`,N.hexContent=g.toString(16).padStart(16,"0"),$.push(N)}return $}function C(){r.currentScopeName="",r.currentPrefix="",n.Global.sentences=W(r,n.Global.code),n.Global.sentences.forEach(b),delete n.Global.code}function b(c){switch(c.type){case"phrase":n.memory.push(...ee(n.typesDefinitions,r,B(c.code)));return;case"ifElse":c.falseBlock.forEach(b);case"ifEndif":case"while":case"do":c.trueBlock.forEach(b);return;case"for":n.memory.push(...ee(n.typesDefinitions,r,B(c.threeSentences[0].code))),c.trueBlock.forEach(b);return;case"struct":O(c),n.memory.push(...ee(n.typesDefinitions,r,B(c.Phrase.code)));return;case"switch":c.block.forEach(b);return;case"label":{let o=Q("label");o.asmName=c.id,o.name=c.id,o.isDeclared=!0,n.memory.push(o)}}}function O(c){let o=ae("struct");o.name=r.currentPrefix+c.name,o.MemoryTemplate.typeDefinition=r.currentPrefix+c.name,o.MemoryTemplate.isDeclared=r.isFunctionArgument;let $=r.currentPrefix;r.currentPrefix="",c.members.forEach(N=>{if(N.type!=="phrase")throw new Error(`At line: ${N.line}. Invalid sentence in struct members.`);N.code!==void 0&&o.structMembers.push(...ee(n.typesDefinitions,r,N.code,c.name+"_"))}),o.MemoryTemplate.size=o.structMembers.length;let g=0;o.structMembers.forEach(N=>{o.structAccumulatedSize.push([N.name,g]),N.type!=="struct"&&g++}),r.currentPrefix=$,n.typesDefinitions.push(o)}function p(c,o){c.sentences=W(r,c.code);let $=!1;c.arguments?.length===1&&c.arguments[0].type==="Keyword"&&c.arguments[0].value==="void"&&($=!0),r.currentScopeName=c.name,r.currentPrefix=r.currentScopeName+"_",r.isFunctionArgument=!0;let g=W(r,c.arguments,!0);if(g.length!==1||g[0].type!=="phrase"||g[0].code===void 0)throw new Error(`At line: ${c.line}.Wrong arguments for function '${c.name}'.`);if(c.argsMemObj=ee(n.typesDefinitions,r,g[0].code),c.argsMemObj.length===0&&$===!1)throw new Error(`At line: ${c.line}. No variables in arguments for function '${c.name}'. Do you mean 'void'?`);n.memory=n.memory.concat(c.argsMemObj),r.isFunctionArgument=!1,delete n.functions[o].arguments,delete n.functions[o].code,c.sentences.forEach(b)}function E(){let c,o;for(c=0;c<n.memory.length-1;c++)for(o=c+1;o<n.memory.length;o++)if(n.memory[c].asmName===n.memory[o].asmName)throw n.memory[c].type!==n.memory[o].type?new Error(`At line: unknown. Global check: it was found that variable '${n.memory[c].name}' was declared more one time with types '${n.memory[c].type}' and '${n.memory[o].type}'.`):n.memory[c].type==="label"?new Error(`At line: unknow. Global check: it was found that label '${n.memory[c].name}' was declared more than one time.`):new Error(`At line: unknow. Global check: it was found that variable '${n.memory[c].name}' was declared more than one time.`)}function S(){let c,o;for(c=0;c<n.functions.length;c++){for(o=c+1;o<n.functions.length;o++)if(n.functions[c].name===n.functions[o].name)throw new Error(`At line: ${n.functions[o].line}. Found second definition for function '${n.functions[o].name}'.`);if(n.Config.APIFunctions===!0){for(o=0;o<n.Global.APIFunctions.length;o++)if(n.functions[c].name===n.Global.APIFunctions[o].name||n.functions[c].name===n.Global.APIFunctions[o].asmName)throw new Error(`At line: ${n.functions[c].line}. Function '${n.functions[c].name}' has same name of one API Functions.`)}}}function t(){let c=0;n.memory.forEach(o=>{switch(o.type){case"struct":o.hexContent=c.toString(16).padStart(16,"0");return;case"array":o.address=c,c++,o.hexContent=c.toString(16).padStart(16,"0");return;case"label":return;default:o.address=c,c++}})}return a()}function j(n){let e=B(n,"Internal error. Undefined AST to create syntactic tree");if(e.length===0)return{type:"nullASN"};let r=ze(e);switch(e[r].type){case"Constant":return Ue(e);case"Variable":return Je(e);case"CodeCave":return je(e);case"Operator":case"Assignment":case"SetOperator":case"Comparision":case"Delimiter":return ke(e,r);case"Keyword":return Ge(e,r);case"UnaryOperator":return He(e,r);case"SetUnaryOperator":if(r===0)return Ze(e);if(r===e.length-1)return Ke(e);throw new Error(`At line: ${e[r].line}. Invalid use of 'SetUnaryOperator' '${e[r].value}'.`);default:throw new Error(`Internal error at line: ${e[0].line}. Token '${e[0].type}' with value '${e[0].value}' does not match any syntax rules.`)}}function ze(n){let e=n.map(a=>a.precedence),r=Math.max(...e);switch(r){case 0:return 0;case 12:case 10:case 2:return e.indexOf(r);default:return e.lastIndexOf(r)}}function Ue(n){if(n.length!==1)throw new Error(`At line: ${n[0].line}. Constants cannot have modifiers.`);return{type:"endASN",Token:n[0]}}function Je(n){if(n.length===1)return{type:"endASN",Token:n[0]};let e=1;n[1].type==="Function"&&(n[1].extValue=n[0].value,e++);let r={type:"lookupASN",Token:n[e-1],modifiers:[]};for(r.Token.type==="Function"&&(r.FunctionArgs=j(r.Token.params),delete r.Token.params);e<n.length;e++)switch(n[e].type){case"Arr":r.modifiers.push({type:"Array",Center:j(n[e].params)});break;case"Member":if(n[e+1]?.type==="Variable")break;throw new Error(`At line: ${n[e].line}. Expecting a variable for '${n[e].value}' modifier.`);case"Variable":if(n[e-1].type!=="Member")throw new Error(`At line: ${n[e].line}. Probable missing ';'. Expecting a member modifier before '${n[e].value}'.`);if(n[e-1].value==="."){r.modifiers.push({type:"MemberByVal",Center:n[e]});break}r.modifiers.push({type:"MemberByRef",Center:n[e]});break;default:throw new Error(`At line: ${n[e].line}. Probable missing ';'. Invalid type of variable modifier: '${n[e].type}'.`)}return r}function je(n){if(n.length!==1)throw new Error(`At line: ${n[0].line}. Modifiers not implemented on '${n[0].type}'.`);let e=j(n[0].params);return delete n[0].params,e}function ke(n,e){if(e===0)throw new Error(`At line: ${n[0].line}. Missing left value for binary operator '${n[e].value}'.`);if(e===n.length-1)throw new Error(`At line: ${n[0].line}. Missing right value for binary operator '${n[e].value}'.`);return{type:"binaryASN",Left:j(n.slice(0,e)),Operation:n[e],Right:j(n.slice(e+1))}}function Ge(n,e){if(e!==0)throw new Error(`At line: ${n[e].line}. Probable missing ';' before keyword ${n[e].value}.`);switch(n[0].value){case"sleep":case"goto":case"const":case"sizeof":if(n.length===1)throw new Error(`At line: ${n[0].line}. Missing arguments for keyword '${n[0].value}'.`);return{type:"unaryASN",Operation:n[0],Center:j(n.slice(1))};case"exit":case"halt":case"break":case"continue":case"label":case"asm":if(n.length!==1)throw new Error(`At line: ${n[0].line}. Keyword '${n[0].value}' does not accept arguments.`);return{type:"endASN",Token:n[0]};case"long":case"void":case"struct":return n.length===1?{type:"endASN",Token:n[0]}:n.length===2&&n[1].value==="*"?(n[0].value="long",{type:"endASN",Token:n[0]}):{type:"unaryASN",Operation:n[0],Center:j(n.slice(1))};case"return":return n.length===1?{type:"endASN",Token:n[0]}:{type:"unaryASN",Operation:n[0],Center:j(n.slice(1))};default:throw new Error(`Internal error at line: ${n[0].line}. Keyword '${n[0].value}' shown up.`)}}function He(n,e){if(e!==0)throw new Error(`At line: ${n[e].line}. Invalid use of 'UnaryOperator' '${n[e].value}'.`);if(n.length===1)throw new Error(`At line: ${n[0].line}. Missing value to apply unary operator '${n[0].value}'.`);if(n[0].value==="*"&&n.length>0&&n[1].type!=="Variable"&&n[1].type!=="CodeCave"&&n[1].type!=="SetUnaryOperator")throw new Error(`At line: ${n[1].line}. Invalid lvalue for pointer operation. Can not have type '${n[1].type}'.`);return{type:"unaryASN",Center:j(n.slice(1)),Operation:n[0]}}function Ze(n){if(n.length===1)throw new Error(`At line: ${n[0].line}. Missing value to apply 'SetUnaryOperator' '${n[0].value}'.`);if(n[1].type!=="Variable")throw new Error(`At line: ${n[0].line}. 'SetUnaryOperator' '${n[0].value}' expecting a variable, got a '${n[1].type}'.`);for(let e=1;e<n.length;e++)if(!(n[e].type==="Variable"||n[e].type==="Member"))throw new Error(`At line: ${n[0].line}. Can not use 'SetUnaryOperator' with types '${n[e].type}'.`);return{type:"exceptionASN",Left:j(n.slice(1)),Operation:n[0]}}function Ke(n){let e=n.length-1;if(n[0].type!=="Variable")throw new Error(`At line: ${n[0].line}. 'SetUnaryOperator' '${n[e].value}' expecting a variable, got a '${n[0].type}'.`);for(let r=1;r<n.length-1;r++)if(!(n[r].type==="Variable"||n[r].type==="Member"))throw new Error(`At line: ${n[0].line}. Can not use 'SetUnaryOperator' with types  '${n[r].type}'.`);return{type:"exceptionASN",Right:j(n.slice(0,e)),Operation:n[e]}}function de(n){function e(){n.Global.sentences.forEach(r),n.functions.forEach(a=>{a.sentences.forEach(r)})}function r(a){switch(a.type){case"phrase":a.CodeAST=j(B(a.code,"Internal error. Unknow object arrived at processSentence")),delete a.code;break;case"ifElse":a.falseBlock.forEach(r);case"ifEndif":case"while":case"do":if(B(a.condition).length===0)throw new Error(`At line ${a.line}. Sentence condition can not be empty`);a.ConditionAST=j(a.condition),delete a.condition,a.trueBlock.forEach(r);break;case"for":a.threeSentences.forEach(r),a.trueBlock.forEach(r);break;case"struct":r(a.Phrase);break;case"switch":a.JumpTable={type:"switchASN",Expression:j(a.expression),caseConditions:B(a.cases).map(l=>j(l))},delete a.expression,delete a.cases,a.block.forEach(r);break;case"case":delete a.condition;break}}return e()}function oe(n,e,r){let a,l=1,i,T=e.split(`
`);function u(){do i=0,a=d().concat(r),n>=1&&(T=T.filter(f),T.forEach(C),T.forEach(E),T.forEach(s)),n>=2&&(T.forEach(_),T.forEach(b),T.forEach(p),T.forEach(S),T=T.flatMap(O)),n>=3&&(T.forEach($),T.forEach(N),T.forEach(g),T.forEach(M),T.forEach(w),T.forEach(U));while(i!==0);return T.join(`
`)}function d(){let L=[];return T.forEach(v=>{let I=/^.+\s:(\w+)$/.exec(v);I!==null&&L.push(I[1])}),L}function f(L){let v=/^(\w+):$/.exec(L);return v!==null?a.indexOf(v[1])!==-1?!0:(i++,!1):L==="DELETE"?(i++,!1):!0}function s(L,v,I){let A=/^.+\s:(\w+)$/.exec(L);if(A===null)return;let y=v;for(;++y<I.length-1;){let z=/^\s*(\w+):\s*$/.exec(I[y]);if(z===null){if(c(I[y]))continue;break}if(A[1]===z[1]){I[v]="DELETE",i++;return}}}function _(L,v,I){let A=/^\s*JMP\s+:(\w+)\s*$/.exec(L);if(A===null)return;let y=t(A[1]);if(/^\s*(RET|FIN)\s*$/.exec(y)!==null){I[v]=y,i++;return}let z=/^\s*(\w+):\s*$/.exec(y);z!==null&&(I[v]="JMP :"+z[1],i++)}function C(L,v,I){if(/^\s*(RET|FIN|JMP)\b.*$/.exec(L)===null)return;let y=v;for(;++y<I.length-1&&/^\s*(\w+):\s*$/.exec(I[y])===null;)c(I[y])||(I[y]="DELETE",i++)}function b(L,v,I){let A=/^\s*(BGT|BLT|BGE|BLE|BEQ|BNE|BZR|BNZ)\s+\$(\w+)\s+(\$\w+\s+)?:(\w+)\s*$/.exec(L);if(A===null)return;let y=/^\s*(\w+):\s*$/.exec(I[v+2]);if(y===null||A[4]!==y[1])return;let z=/^\s*JMP\s+:(\w+)\s*$/.exec(I[v+1]);z!==null&&(I[v]=L.replace(A[1],o(A[1])).replace(A[4],z[1]),I[v+1]="DELETE",i++)}function O(L,v,I){let A=/^\s*(BGT|BLT|BGE|BLE|BEQ|BNE|BZR|BNZ)\s+\$(\w+)\s+(\$\w+\s+)?:(\w+)\s*$/.exec(L);if(A===null)return[L];let y=t(A[4]);if(/^\s*(RET|FIN)\s*$/.exec(y)!==null){if(/^\s*(RET|FIN)\s*$/.test(I[v+1]))return[L];let Y=`__opt_${l}`;l++;let J=L.replace(A[1],o(A[1])).replace(A[4],Y);return i++,[J,y,`${Y}:`]}let z=/^\s*(\w+):\s*$/.exec(y);return z!==null?(i++,[L.replace(A[4],z[1])]):[L]}function p(L,v,I){let A=/^\s*NOT\s+@(r\d)\s*$/.exec(L);if(A===null)return;let y=/^\s*SET\s+@(r\d)\s+\$(\w+)\s*$/.exec(I[v-1]),z=/^\s*SET\s+@(\w+)\s+\$(r\d)\s*$/.exec(I[v+1]);y===null||z===null||y[1]===z[2]&&y[2]===z[1]&&A[1]===y[1]&&(I[v-1]="DELETE",I[v]="NOT @"+y[2],I[v+1]="DELETE",i++)}function E(L,v,I){/^\s*SET\s+@(\w+)\s+\$\1\s*$/.exec(L)!==null&&(I[v]="DELETE",i++)}function S(L,v,I){let A=/^\s*POP\s+@(r\d)\s*$/.exec(L);if(A===null)return;let y=/^\s*PSH\s+\$(r\d+)\s*$/.exec(I[v+1]);y!==null&&y[1]===A[1]&&(I[v]="DELETE",I[v+1]="DELETE",i++)}function t(L){let v,I,A=T.findIndex(y=>y.indexOf(L+":")!==-1);if(A===-1)return"";for(;++A<T.length-1;)if(v=/^\s*(\w+):\s*$/.exec(T[A]),v===null&&!c(T[A]))return I=/^\s*JMP\s+:(\w+)\s*$/.exec(T[A]),I!==null?I[1]+":":T[A];return""}function c(L){return L===""||L==="DELETE"||/^\s*\^\w+(.*)/.exec(L)!==null}function o(L){switch(L){case"BGT":return"BLE";case"BLT":return"BGE";case"BGE":return"BLT";case"BLE":return"BGT";case"BEQ":return"BNE";case"BNE":return"BEQ";case"BZR":return"BNZ";case"BNZ":return"BZR";default:throw new Error("Internal error.")}}function $(L,v,I){let A=/^\s*(\w+)\s+@(\w+)\s+\$(\w+)\s*$/.exec(L);if(A===null)return;let y=/^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(I[v+1]);if(y!==null&&A[2]===y[2]&&A[3]===y[1])switch(A[1]){case"ADD":case"MUL":case"AND":case"XOR":case"BOR":I[v]=A[1]+" @"+A[3]+" $"+A[2],I[v+1]="DELETE",i++}}function g(L,v,I){let A=/^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(L);if(A===null)return;let y=/^\s*(\w+)\s+@(\w+)\s+\$(\w+)\s*$/.exec(I[v+1]);if(y!==null&&A[1]===y[3])switch(y[1]){case"ADD":case"SUB":case"MUL":case"DIV":case"AND":case"XOR":case"BOR":case"MOD":case"SHL":case"SHR":I[v]=y[1]+" @"+y[2]+" $"+A[2],I[v+1]="DELETE",i++}}function N(L,v,I){let A=/^\s*SET\s+@(r\d)\s+\$(\w+)\s*$/.exec(L);if(A===null)return;let y=/^\s*(PSH|SLP)\s+\$(\w+)\s*$/.exec(I[v+1]);y!==null&&y[2]===A[1]&&(I[v]="DELETE",I[v+1]=y[1]+" $"+A[2],i++)}function M(L,v,I){let A=/^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(L);if(A===null)return;let y=v;for(;++y<I.length-1&&!(/^\s*(\w+):\s*$/.exec(I[y])!==null||/^.+\s:(\w+)$/.exec(I[y])!==null||/^\s*(RET|FIN)\s*$/.exec(I[y])!==null);)if(I[y].indexOf(A[1])>=0){let F=/^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\s*\+\s*\$(\w+)\)\s*$/.exec(I[y]);if(F!==null&&A[1]===F[3]){I[v]="DELETE",I[y]="SET @"+F[1]+" $($"+F[2]+" + $"+A[2]+")",i++;continue}if(F=/^\s*SET\s+@\(\$(\w+)\s*\+\s*\$(\w+)\)\s+\$(\w+)\s*$/.exec(I[y]),F!==null&&A[1]===F[2]){I[v]="DELETE",I[y]="SET @($"+F[1]+" + $"+A[2]+") $"+F[3],i++;continue}if(F!==null&&A[1]===F[3]){I[v]="DELETE",I[y]="SET @($"+F[1]+" + $"+F[2]+") $"+A[2],i++;continue}break}}function w(L,v,I){let A=/^\s*POP\s+@(r\d)\s*$/.exec(L);if(A!==null){let y=/^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(I[v+1]);y!==null&&y[2]===A[1]&&(I[v]="POP @"+y[1],I[v+1]="DELETE",i++)}}function U(L,v,I){let A=/^\s*CLR\s+@(\w+)\s*$/.exec(L);if(A===null)return;let y=v;for(;++y<I.length-1&&!(/^\s*(\w+):\s*$/.exec(I[y])!==null||/^.+\s:(\w+)$/.exec(I[y])!==null||/^\s*(RET|FIN)\s*$/.exec(I[y])!==null);){if(I[y].indexOf(A[1])===-1)continue;let F=/^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\s*\+\s*\$(\w+)\)\s*$/.exec(I[y]);if(F!==null&&A[1]===F[3]){I[v]="DELETE",I[y]="SET @"+F[1]+" $($"+F[2]+")",i++;continue}if(F=/^\s*SET\s+@\(\$(\w+)\s*\+\s*\$(\w+)\)\s+\$(\w+)\s*$/.exec(I[y]),F!==null&&A[1]===F[2]){I[v]="DELETE",I[y]="SET @($"+F[1]+") $"+F[3],i++;continue}break}}return u()}var m={createConstantMemObj(n=""){let e;if(typeof n=="number"){if(n%1!=0)throw new Error("Only integer numbers in createConstantMemObj().");e=n.toString(16).padStart(16,"0").slice(-16)}else e=n.padStart(16,"0").slice(-16);return{address:-1,name:"",asmName:"",type:"constant",scope:"",size:1,declaration:"long",isDeclared:!0,hexContent:e}},createVoidMemObj(){return{address:-1,name:"",asmName:"",type:"void",scope:"",size:0,declaration:"void",isDeclared:!0}},genMulToken(n=-1){return{type:"Operator",precedence:3,value:"*",line:n}},genAddToken(n=-1){return{type:"Operator",precedence:4,value:"+",line:n}},genSubToken(n=-1){return{type:"Operator",precedence:4,value:"-",line:n}},genAssignmentToken(n){return{type:"Assignment",precedence:9,value:"=",line:n}},genIncToken(){return{type:"SetUnaryOperator",precedence:2,value:"++",line:-1}},genDecToken(){return{type:"SetUnaryOperator",precedence:2,value:"--",line:-1}},genNotEqualToken(){return{type:"Comparision",precedence:6,value:"!=",line:-1}},genAPICallToken(n,e){return{type:"APICall",precedence:0,value:B(e),line:n}},genPushToken(n){return{type:"Push",precedence:12,value:"",line:n}},mulHexContents(n,e){let r=this.HexContentsToBigint(n),a=this.HexContentsToBigint(e);return(r*a).toString(16).padStart(16,"0").slice(-16)},divHexContents(n,e){let r=this.HexContentsToBigint(n),a=this.HexContentsToBigint(e);if(a===0n)throw new Error("Division by zero");return(r/a).toString(16).padStart(16,"0").slice(-16)},addHexContents(n,e){let r=this.HexContentsToBigint(n),a=this.HexContentsToBigint(e);return(r+a).toString(16).padStart(16,"0").slice(-16)},subHexContents(n,e){let r=this.HexContentsToBigint(n),a=this.HexContentsToBigint(e),l=r-a;return l<0&&(l+=18446744073709551616n),l.toString(16).padStart(16,"0").slice(-16)},HexContentsToBigint(n){return typeof n=="undefined"?0n:BigInt(typeof n=="number"?n:"0x"+n)},splitASTOnDelimiters(n){let e=[];function r(a){if(a.type==="endASN"||a.type==="lookupASN"){e.push(a);return}a.type==="binaryASN"&&a.Operation.type==="Delimiter"?(r(a.Left),r(a.Right)):e.push(a)}return r(n),e},isNotValidDeclarationOp(n,e){let r=this.getDeclarationFromMemory(e);return n==="void"||r==="void"?!0:!(n===r||n==="void_ptr"&&(r==="long_ptr"||r==="struct_ptr")||r==="void_ptr"&&(n==="long_ptr"||n==="struct_ptr")||n.includes("_ptr")&&e.type==="constant")},getDeclarationFromMemory(n){return n.Offset===void 0?n.declaration:n.Offset.declaration},setMemoryDeclaration(n,e){n.Offset===void 0?n.declaration=e:n.Offset.declaration=e},findVarNameInAst(n,e){function r(l){let i,T;switch(l.type){case"nullASN":return!0;case"endASN":return!(l.Token.type==="Variable"&&l.Token.value===n);case"lookupASN":return a(l);case"unaryASN":return r(l.Center);case"binaryASN":return i=r(l.Left),T=r(l.Right),!!(i&&T);case"exceptionASN":return l.Left!==void 0?r(l.Left):r(B(l.Right));case"switchASN":return!1}}function a(l){return l.modifiers.find(T=>T.type==="Array"&&r(T.Center)===!1)===void 0?l.Token.type==="Function"&&l.FunctionArgs!==void 0?r(l.FunctionArgs):!0:!1}return r(e)},assertAsnType(n,e){if(e.type!==void 0&&e.type===n)return e;throw new Error("Internal error")}};function re(n,e,r,a){function l(){switch(e.type){case"register":case"long":case"structRef":return i();case"array":return C();default:throw new Error(`Internal error at line: ${a}.`)}}function i(){let p,E,S;switch(e.Offset?.type){case void 0:switch(r.type){case"constant":return T();case"register":case"long":case"structRef":return u();case"array":return s();default:throw new Error(`Internal error at line: ${a}.`)}case"constant":return _(e.Offset);case"variable":return p=k(n,r,a),E=n.getMemoryObjectByLocation(e.Offset.addr).asmName,S=`SET @($${e.asmName} + $${E}) $${p.FlatMem.asmName}
`,O(p),p.asmCode+S}}function T(){if(r.hexContent=B(r.hexContent),r.hexContent.length>17)throw new Error(`At line: ${a}. Overflow on long value assignment (value bigger than 64 bits)`);if(r.hexContent==="0000000000000000")return`CLR @${e.asmName}
`;let p=n.memory.find(E=>E.asmName===`n${Number("0x"+r.hexContent)}`&&E.hexContent===r.hexContent);return p?`SET @${e.asmName} $${p.asmName}
`:`SET @${e.asmName} #${r.hexContent}
`}function u(){let p;switch(r.Offset?.type){case void 0:return d();case"constant":return f(r.Offset);case"variable":return p=n.getMemoryObjectByLocation(r.Offset.addr,a).asmName,`SET @${e.asmName} $($${r.asmName} + $${p})
`}}function d(){if(e.declaration===r.declaration||e.declaration==="void_ptr"&&r.declaration.includes("ptr")||e.declaration.includes("ptr")&&r.declaration==="void_ptr")return e.address===r.address?"":`SET @${e.asmName} $${r.asmName}
`;throw new Error(`Internal error at line: ${a}.`)}function f(p){if(p.value===0)return`SET @${e.asmName} $($${r.asmName})
`;let E=k(n,m.createConstantMemObj(p.value),a),S=`SET @${e.asmName} $($${r.asmName} + $${E.FlatMem.asmName})
`;return O(E),E.asmCode+S}function s(){if(r.Offset===void 0)return`SET @${e.asmName} $${r.asmName}
`;if(r.Offset.type==="constant"){let E=m.addHexContents(r.hexContent,r.Offset.value),S=n.getMemoryObjectByLocation(E,a);return`SET @${e.asmName} $${S.asmName}
`}let p=n.getMemoryObjectByLocation(r.Offset.addr,a).asmName;return`SET @${e.asmName} $($${r.asmName} + $${p})
`}function _(p){let E=k(n,r,a),S;if(p.value===0)return S=`SET @($${e.asmName}) $${E.FlatMem.asmName}
`,E.isNew&&n.freeRegister(E.FlatMem.address),E.asmCode+S;let t=k(n,m.createConstantMemObj(p.value),a);return S=`SET @($${e.asmName} + $${t.FlatMem.asmName}) $${E.FlatMem.asmName}
`,O(t),O(E),E.asmCode+t.asmCode+S}function C(){let p,E,S;switch(e.Offset?.type){case void 0:return b();case"constant":throw new Error(`Internal error at line: ${a}.`);case"variable":return p=k(n,r,a),S=n.getMemoryObjectByLocation(e.Offset.addr,a).asmName,E=`SET @($${e.asmName} + $${S}) $${p.FlatMem.asmName}
`,O(p),p.asmCode+E}}function b(){G(r.type==="constant",`Internal error at line: ${a}.`);let p=B(e.ArrayItem).totalSize-1;if(r.size>p)throw new Error(`At line: ${a}. Overflow on array value assignment (value bigger than array size).`);let E=B(r.hexContent).padStart(p*16,"0"),S="";for(let t=0;t<p;t++){let c=n.getMemoryObjectByLocation(m.addHexContents(e.hexContent,t),a),o=m.createConstantMemObj(E.slice(16*(p-t-1),16*(p-t)));S+=re(n,c,o,a)}return S}function O(p){p.isNew&&n.freeRegister(p.FlatMem.address)}return l()}function ie(n,e,r,a,l,i,T){let u="",d=i;l&&(d=T);let f=k(n,r,e.line);if(f.isNew&&(r.Offset?.type==="variable"&&n.freeRegister(r.Offset.addr),n.freeRegister(r.address)),a.type==="constant"&&a.hexContent==="0000000000000000"&&(e.value==="=="||e.value==="!="))return u+=Xe(e.value,l),u+=` $${f.FlatMem.asmName} :${d}
`,f.isNew===!0&&n.freeRegister(f.FlatMem.address),f.asmCode+u;let s=k(n,a,e.line);return u+=Ye(e.value,l),u+=` $${f.FlatMem.asmName} $${s.FlatMem.asmName} :${d}
`,f.isNew===!0&&n.freeRegister(f.FlatMem.address),s.isNew===!0&&n.freeRegister(s.FlatMem.address),f.asmCode+s.asmCode+u}function Ye(n,e){let r="";switch(n){case">":r="BLE";break;case"<":r="BGE";break;case">=":r="BLT";break;case"<=":r="BGT";break;case"==":r="BNE";break;case"!=":r="BEQ";break}if(e===!1)return r;switch(n){case">":return"BGT";case"<":return"BLT";case">=":return"BGE";case"<=":return"BLE";case"==":return"BEQ";case"!=":return"BNE"}return"Internal error."}function Xe(n,e){return e?n==="=="?"BZR":"BNZ":n==="=="?"BNZ":"BZR"}function _e(n,e,r){let a;switch(e.value){case"break":return`JMP :%generateUtils.getLatestLoopId()%_${e.value}
`;case"continue":return`JMP :%generateUtils.getLatestPureLoopId()%_${e.value}
`;case"goto":return`JMP :${B(r).name}
`;case"halt":return`STP
`;case"exit":return`FIN
`;case"return":return r===void 0?`RET
`:(a=k(n,r,e.line),a.asmCode+=`PSH $${a.FlatMem.asmName}
`,a.asmCode+=`RET
`,n.freeRegister(r.address),a.isNew===!0&&n.freeRegister(a.FlatMem.address),a.asmCode);case"sleep":return r=B(r),a=k(n,B(r),e.line),a.asmCode+=`SLP $${a.FlatMem.asmName}
`,n.freeRegister(r.address),a.isNew===!0&&n.freeRegister(a.FlatMem.address),a.asmCode;case"asm":{let l=B(e.extValue).split(`
`);return l=l.map(i=>i.trim()),l.join(`
`).trim()+`
`}default:throw new Error("Internal error.")}}function fe(n,e,r,a){let l=k(n,r,e.line),i=k(n,a,e.line);function T(){G(r.type!=="constant");let C="";if(a.type==="constant"){let b=u();if(b===void 0)return n.freeRegister(i.FlatMem.address),"";if(b.length>0)return G(l.isNew===!1,"Internal error. Expecting not new item."),l.asmCode+b}return C=qe(e.value)+` @${l.FlatMem.asmName} $${i.FlatMem.asmName}
`,n.freeRegister(i.FlatMem.address),l.isNew===!0&&(C+=h(n,m.genAssignmentToken(e.line),r,l.FlatMem),n.freeRegister(l.FlatMem.address)),l.asmCode+i.asmCode+C}function u(){switch(e.value){case"+":case"+=":return d();case"-":case"-=":return f();case"*":case"*=":return s();case"/":case"/=":return _();default:return""}}function d(){switch(a.hexContent){case"0000000000000000":return;case"0000000000000001":return n.freeRegister(i.FlatMem.address),h(n,m.genIncToken(),l.FlatMem);case"0000000000000002":if(n.freeRegister(i.FlatMem.address),!n.memory.find(C=>C.asmName==="n2"&&C.hexContent==="0000000000000002"))return h(n,m.genIncToken(),l.FlatMem)+h(n,m.genIncToken(),l.FlatMem)}return""}function f(){if(a.hexContent!=="0000000000000000")return a.hexContent==="0000000000000001"?(n.freeRegister(i.FlatMem.address),h(n,m.genDecToken(),l.FlatMem)):""}function s(){if(a.hexContent==="0000000000000001"){n.freeRegister(i.FlatMem.address);return}return a.hexContent==="0000000000000000"?(n.freeRegister(i.FlatMem.address),h(n,m.genAssignmentToken(e.line),l.FlatMem,a)):""}function _(){if(a.hexContent==="0000000000000001"){n.freeRegister(i.FlatMem.address);return}return""}return T()}function qe(n){switch(n){case"+":case"+=":return"ADD";case"-":case"-=":return"SUB";case"*":case"*=":return"MUL";case"/":case"/=":return"DIV";case"|":case"|=":return"BOR";case"&":case"&=":return"AND";case"^":case"^=":return"XOR";case"%":case"%=":return"MOD";case"<<":case"<<=":return"SHL";case">>":case">>=":return"SHR";default:throw new Error("Internal error.")}}function Me(n,e,r){let a=e.split(`
`),l=[];return a.forEach(i=>{if(i.length===0){l.push("");return}let T=/^\s*SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/.exec(i);if(T===null){let d=/^\s*CLR\s+@(\w+)\s*$/.exec(i);if(d!==null){l.push("^const SET @"+d[1]+" #0000000000000000");return}let f=/^\s*SET\s+@(\w+)\s+\$n(\d+)\s*$/.exec(i);if(f!==null){l.push(`^const SET @${f[1]} #${BigInt(f[2]).toString(16).padStart(16,"0")}`);return}throw new Error(`Internal error at line ${r}`)}let u=B(n.find(d=>d.asmName===T[1]));if(u.hexContent!==void 0)throw new Error(`At line: ${r}. Left side of an assigment with 'const' keyword already has been set.`);u.hexContent=T[2],l.push("^const "+i)}),l.join(`
`)}function x(n,e=""){switch(n){case"Jump":return`JMP :${e}
`;case"Push":return`PSH $${e}
`;case"Pop":return`POP @${e}
`;case"exit":return`FIN
`;case"Label":return`${e}:
`;case"Function":return`JSR :__fn_${e}
`;default:throw new Error(`Unknow simple instruction: ${n}`)}}function Ae(n,e,r,a){let l="",i=[];return a.forEach(T=>{let u=k(n,T,-1);l+=u.asmCode,i.push(u.FlatMem)}),l+="FUN",r.type!=="void"&&(l+=` @${r.asmName}`),l+=` ${e.value}`,i.forEach(T=>{l+=` $${T.asmName}`}),i.forEach(T=>n.freeRegister(T.address)),l+`
`}function k(n,e,r){let a=m.getDeclarationFromMemory(e);function l(){let T="";if(e.type==="constant")return i(e.hexContent);if(e.Offset===void 0)return{FlatMem:e,asmCode:"",isNew:!1};let u;if(e.Offset.type==="variable"){u=n.getNewRegister(),u.declaration=a;let f=n.getMemoryObjectByLocation(e.Offset.addr,r).asmName;return T+=`SET @${u.asmName} $($${e.asmName} + $${f})
`,{FlatMem:u,asmCode:T,isNew:!0}}let d;switch(e.type){case"register":case"long":case"structRef":return u=n.getNewRegister(),u.declaration=a,e.Offset.value===0?(T+=`SET @${u.asmName} $($${e.asmName})
`,{FlatMem:u,asmCode:T,isNew:!0}):(d=i(e.Offset.value),T+=d.asmCode,T+=`SET @${u.asmName} $($${e.asmName} + $${d.FlatMem.asmName})
`,d.isNew&&n.freeRegister(d.FlatMem.address),{FlatMem:u,asmCode:T,isNew:!0});case"array":return u=n.getMemoryObjectByLocation(m.addHexContents(e.hexContent,e.Offset.value),r),n.freeRegister(e.address),{FlatMem:u,asmCode:T,isNew:!0};default:throw new Error(`Internal error at line: ${r}. Not implemented type in flattenMemory()`)}}function i(T){T=B(T);let u;typeof T=="number"?u=T.toString(16):u=T,u=u.padStart(16,"0"),G(u.length<=16);let d=n.memory.find(_=>_.asmName==="n"+Number("0x"+u)&&_.hexContent===u);if(d)return{FlatMem:d,asmCode:"",isNew:!1};let f=n.getNewRegister();f.declaration=a;let s="";return u==="0000000000000000"?s+=`CLR @${f.asmName}
`:s+=`SET @${f.asmName} #${u}
`,{FlatMem:f,asmCode:s,isNew:!0}}return l()}function h(n,e,r,a,l,i,T){switch(e.type){case"Assignment":return re(n,B(r),B(a),e.line);case"Operator":case"SetOperator":return fe(n,e,B(r),B(a));case"UnaryOperator":case"SetUnaryOperator":return Ve(e,B(r));case"Comparision":return ie(n,e,B(r),B(a),B(l),B(i),B(T));case"Push":{let u=k(n,B(r),e.line);return u.asmCode+=`PSH $${u.FlatMem.asmName}
`,u.isNew===!0&&n.freeRegister(u.FlatMem.address),u.asmCode}case"Keyword":return _e(n,e,r);default:throw new Error(`Internal error at line: ${e.line}.`)}}function Ve(n,e){switch(n.value){case"++":return`INC @${e.asmName}
`;case"--":return`DEC @${e.asmName}
`;case"~":return`NOT @${e.asmName}
`;default:throw new Error(`Internal error at line: ${n.line}.`)}}function pe(n,e,r){let a="",l;function i(){switch(l=m.assertAsnType("binaryASN",r.RemAST),l.Operation.type){case"Delimiter":return T();case"Operator":return u();case"Assignment":case"SetOperator":return d();case"Comparision":return O();default:throw new Error("Internal error.")}}function T(){if(r.jumpFalse!==void 0)throw new Error(`At line: ${l.Operation.line}. It is not possible to evaluate multiple sentences in logical operations.`);let g=R(n,e,{RemAST:l.Left,logicalOp:!1,revLogic:r.revLogic,jumpFalse:r.jumpFalse,jumpTrue:r.jumpTrue});g.asmCode+=e.getPostOperations();let N=R(n,e,{RemAST:l.Right,logicalOp:!1,revLogic:r.revLogic,jumpFalse:r.jumpFalse,jumpTrue:r.jumpTrue});return g.asmCode+=N.asmCode,g.asmCode+=e.getPostOperations(),e.freeRegister(N.SolvedMem.address),g}function u(){let g=R(n,e,{RemAST:l.Left,logicalOp:!1,revLogic:r.revLogic,jumpFalse:r.jumpFalse,jumpTrue:r.jumpTrue});a+=g.asmCode;let N=R(n,e,{RemAST:l.Right,logicalOp:!1,revLogic:r.revLogic,jumpFalse:r.jumpFalse,jumpTrue:r.jumpTrue});if(a+=N.asmCode,g.SolvedMem.type==="void"||N.SolvedMem.type==="void")throw new Error(`At line: ${l.Operation.line}. Can not make operations with void values.`);let M=c(g.SolvedMem,N.SolvedMem,l.Operation.value);if(M)return{SolvedMem:M,asmCode:a};if(o(g.SolvedMem,N.SolvedMem,l.Operation.value)){let U=N;N=g,g=U}let w;if(g.SolvedMem.type!=="register"?(w=e.getNewRegister(),w.declaration=m.getDeclarationFromMemory(g.SolvedMem),a+=h(e,m.genAssignmentToken(l.Operation.line),w,g.SolvedMem),e.freeRegister(g.SolvedMem.address)):w=g.SolvedMem,m.getDeclarationFromMemory(N.SolvedMem).includes("_ptr")&&!w.declaration.includes("_ptr")&&(w.declaration+="_ptr"),w.declaration.includes("_ptr")&&l.Operation.value!=="+"&&l.Operation.value!=="-")throw new Error(`At line: ${l.Operation.line}. Operation not allowed on pointers. Only '+', '-', '++' and '--' are.`);return a+=h(e,l.Operation,w,N.SolvedMem),r.logicalOp===!0?(a+=h(e,m.genNotEqualToken(),w,m.createConstantMemObj(0),r.revLogic,r.jumpFalse,r.jumpTrue),e.freeRegister(N.SolvedMem.address),e.freeRegister(w.address),{SolvedMem:m.createVoidMemObj(),asmCode:a}):(e.freeRegister(N.SolvedMem.address),{SolvedMem:w,asmCode:a})}function d(){f(),e.isLeftSideOfAssignment=!0,e.hasVoidArray=!1;let g=R(n,e,{RemAST:l.Left,logicalOp:!1,revLogic:r.revLogic,jumpFalse:r.jumpFalse,jumpTrue:r.jumpTrue});a+=g.asmCode,e.isLeftSideOfAssignment=!1,s(g.SolvedMem);let N="";e.isDeclaration.length!==0&&(N=e.isDeclaration,e.isDeclaration=""),g.SolvedMem.type==="array"&&g.SolvedMem.Offset?.type==="constant"&&(g.SolvedMem=e.getMemoryObjectByLocation(m.addHexContents(g.SolvedMem.hexContent,g.SolvedMem.Offset.value)));let M=_(g.SolvedMem);if(a+=M.asmCode,e.isDeclaration=N,M.SolvedMem.type==="void")throw new Error(`At line: ${l.Operation.line}. Invalid right value for '${l.Operation.type}'. Possible void value.`);return C(g.SolvedMem,M.SolvedMem,l.Operation.value,l.Operation.line),a+=h(e,l.Operation,g.SolvedMem,M.SolvedMem),e.isConstSentence===!0?b(g.SolvedMem,M.SolvedMem,a,l.Operation.line):(e.freeRegister(M.SolvedMem.address),{SolvedMem:g.SolvedMem,asmCode:a})}function f(){if(r.jumpFalse!==void 0)throw new Error(`At line: ${l.Operation.line}. Can not use assignment during logical operations with branches`);if(l.Left.type==="binaryASN"||l.Left.type==="unaryASN"&&l.Left.Operation.value!=="*")throw new Error(`At line: ${l.Operation.line}. Invalid left value for assignment.`)}function s(g){if(g.address===-1)throw new Error(`At line: ${l.Operation.line}. Invalid left value for ${l.Operation.type}.`);if(g.type==="array"&&e.hasVoidArray===!1&&(g.Offset===void 0||g.Offset.type==="variable"&&g.Offset.addr===0&&g.Offset.declaration.includes("_ptr")))throw new Error(`At line: ${l.Operation.line}. Invalid left value for '${l.Operation.type}'. Can not reassign an array.`);if(e.hasVoidArray&&(l.Right.type!=="endASN"||l.Right.type==="endASN"&&l.Right.Token.type!=="Constant"))throw new Error(`At line: ${l.Operation.line}. Invalid right value for multi-array assignment. It must be a constant.`)}function _(g){if(l.Operation.type!=="Assignment"||n.Config.reuseAssignedVar===!1||g.type!=="long"||g.Offset!==void 0||!m.findVarNameInAst(g.name,l.Right))return R(n,e,{RemAST:l.Right,logicalOp:!1,revLogic:r.revLogic,jumpFalse:r.jumpFalse,jumpTrue:r.jumpTrue});let N=P(e.registerInfo),M=P(g);M.type="register",M.declaration="long",e.registerInfo.unshift({inUse:!1,Template:M});let w=R(n,e,{RemAST:l.Right,logicalOp:!1,revLogic:r.revLogic,jumpFalse:r.jumpFalse,jumpTrue:r.jumpTrue});e.registerInfo.shift();let U=P(e.registerInfo);if(w.SolvedMem.address!==g.address&&e.isTemp(w.SolvedMem.address)){let L=w.SolvedMem.address+1;e.registerInfo=N,e.registerInfo.splice(L,0,{inUse:!1,Template:M});let v=R(n,e,{RemAST:l.Right,logicalOp:!1,revLogic:r.revLogic,jumpFalse:r.jumpFalse,jumpTrue:r.jumpTrue});if(v.SolvedMem.address===g.address)return e.registerInfo.splice(L,1),v;e.registerInfo=U}return w}function C(g,N,M,w){if(m.isNotValidDeclarationOp(m.getDeclarationFromMemory(g),N)){let U=m.getDeclarationFromMemory(g),L=m.getDeclarationFromMemory(N);if(!(U===L+"_ptr"&&(M==="+="||M==="-="))){if(n.Config.warningToError)throw new Error(`At line: ${w}. Warning: Left and right values does not match. Values are: '${g.declaration}' and '${N.declaration}'.`);g.declaration=N.declaration}}}function b(g,N,M,w){if(N.address!==-1||N.type!=="constant"||N.hexContent===void 0)throw new Error(`At line: ${w}. Right side of an assigment with 'const' keyword must be a constant.`);return M=Me(e.memory,M,w),{SolvedMem:g,asmCode:M}}function O(){if(r.logicalOp===!1&&r.jumpFalse===void 0)return p();switch(l.Operation.value){case"||":return E();case"&&":return S();case"==":case"!=":case"<=":case">=":case"<":case">":return t();default:throw new Error("Internal error")}}function p(){let g=e.getNewJumpID(l.Operation.line),N="__CMP_"+g+"_sF",M="__CMP_"+g+"_sT",w="__CMP_"+g+"_end",U=!1;l.Operation.value==="||"&&(U=!0);let{SolvedMem:L,asmCode:v}=R(n,e,{RemAST:l,logicalOp:!0,revLogic:U,jumpFalse:N,jumpTrue:M}),I=e.getNewRegister();return v+=x("Label",U?N:M),v+=h(e,m.genAssignmentToken(l.Operation.line),I,m.createConstantMemObj(U?0:1)),v+=x("Jump",w),v+=x("Label",U?M:N),v+=h(e,m.genAssignmentToken(l.Operation.line),I,m.createConstantMemObj(U?1:0)),v+=x("Label",w),e.freeRegister(L.address),{SolvedMem:I,asmCode:v}}function E(){let g=e.getNewJumpID(l.Operation.line),N="__OR_"+g+"_next";return a+=R(n,e,{RemAST:l.Left,logicalOp:!0,revLogic:!0,jumpFalse:N,jumpTrue:r.jumpTrue}).asmCode,a+=x("Label",N),a+=R(n,e,{RemAST:l.Right,logicalOp:!0,revLogic:!0,jumpFalse:r.jumpFalse,jumpTrue:r.jumpTrue}).asmCode,a+=x("Jump",r.jumpFalse),{SolvedMem:m.createVoidMemObj(),asmCode:a}}function S(){let g=e.getNewJumpID(l.Operation.line),N="__AND_"+g+"_next";return a+=R(n,e,{RemAST:l.Left,logicalOp:!0,revLogic:!1,jumpFalse:r.jumpFalse,jumpTrue:N}).asmCode,a+=x("Label",N),a+=R(n,e,{RemAST:l.Right,logicalOp:!0,revLogic:!1,jumpFalse:r.jumpFalse,jumpTrue:r.jumpTrue}).asmCode,a+=x("Jump",r.jumpTrue),{SolvedMem:m.createVoidMemObj(),asmCode:a}}function t(){let g=R(n,e,{RemAST:l.Left,logicalOp:!1,revLogic:r.revLogic});a+=g.asmCode;let N=R(n,e,{RemAST:l.Right,logicalOp:!1,revLogic:r.revLogic});return a+=N.asmCode,a+=h(e,l.Operation,g.SolvedMem,N.SolvedMem,r.revLogic,r.jumpFalse,r.jumpTrue),e.freeRegister(g.SolvedMem.address),e.freeRegister(N.SolvedMem.address),{SolvedMem:m.createVoidMemObj(),asmCode:a}}function c(g,N,M){if(g.type==="constant"&&N.type==="constant")switch(M){case"+":return m.createConstantMemObj(m.addHexContents(g.hexContent,N.hexContent));case"*":return m.createConstantMemObj(m.mulHexContents(g.hexContent,N.hexContent));case"/":return m.createConstantMemObj(m.divHexContents(g.hexContent,N.hexContent));case"-":return m.createConstantMemObj(m.subHexContents(g.hexContent,N.hexContent))}}function o(g,N,M){switch(M){case"+":case"*":case"&":case"^":case"|":break;default:return!1}return!!($(M,g)||e.isTemp(N.address)&&!e.isTemp(g.address)||N.type==="constant"&&!$(M,N))}function $(g,N){if(g==="+"||g==="+="){if(N.hexContent==="0000000000000000"||N.hexContent==="0000000000000001"||N.hexContent==="0000000000000002")return!0}else if((g==="*"||g==="*=")&&(N.hexContent==="0000000000000000"||N.hexContent==="0000000000000001"))return!0;return!1}return i()}function me(n,e,r){let a;function l(){switch(a=m.assertAsnType("endASN",r.RemAST),a.Token.type){case"Constant":return i();case"Variable":return T();case"Keyword":return u();default:throw new Error(`Internal error at line: ${a.Token.line}.`)}}function i(){if(r.logicalOp)return r.revLogic===!1?a.Token.value==="0000000000000000"?{SolvedMem:m.createVoidMemObj(),asmCode:x("Jump",r.jumpFalse)}:{SolvedMem:m.createVoidMemObj(),asmCode:""}:a.Token.value!=="0000000000000000"?{SolvedMem:m.createVoidMemObj(),asmCode:x("Jump",r.jumpTrue)}:{SolvedMem:m.createVoidMemObj(),asmCode:""};let d=m.createConstantMemObj();return d.size=a.Token.value.length/16,d.hexContent=a.Token.value,{SolvedMem:d,asmCode:""}}function T(){if(r.logicalOp){let{SolvedMem:f,asmCode:s}=R(n,e,{RemAST:a,logicalOp:!1,revLogic:r.revLogic});return s+=h(e,m.genNotEqualToken(),f,m.createConstantMemObj(0),r.revLogic,r.jumpFalse,r.jumpTrue),e.freeRegister(f.address),{SolvedMem:m.createVoidMemObj(),asmCode:s}}return{SolvedMem:e.getMemoryObjectByName(a.Token.value,a.Token.line,e.isDeclaration),asmCode:""}}function u(){if(r.logicalOp)throw new Error(`At line: ${a.Token.line}. Cannot use of keyword '${a.Token.value}' in logical statements.`);switch(a.Token.value){case"break":case"continue":case"asm":case"exit":case"halt":return{SolvedMem:m.createVoidMemObj(),asmCode:h(e,a.Token)};case"void":throw new Error(`At line: ${a.Token.line}. Invalid use of keyword 'void'.`);case"long":{let d=n.typesDefinitions.find(f=>f.type==="long");return{SolvedMem:B(d).MemoryTemplate,asmCode:""}}case"struct":{let d=n.typesDefinitions.find(f=>f.type==="struct"&&f.name===a.Token.extValue);return{SolvedMem:B(d).MemoryTemplate,asmCode:""}}case"return":if(e.CurrentFunction===void 0)throw new Error(`At line: ${a.Token.line}. Can not use 'return' in global statements.`);if(e.CurrentFunction.declaration!=="void")throw new Error(`At line: ${a.Token.line}. Function '${e.CurrentFunction.name}' must return a '${e.CurrentFunction.declaration}' value.`);return e.CurrentFunction.name==="main"||e.CurrentFunction.name==="catch"?{SolvedMem:m.createVoidMemObj(),asmCode:x("exit")}:{SolvedMem:m.createVoidMemObj(),asmCode:h(e,a.Token)};default:throw new Error(`Internal error at line: ${a.Token.line}.`)}}return l()}function ge(n,e,r){let a=m.assertAsnType("exceptionASN",r.RemAST);if(r.jumpFalse!==void 0)throw new Error(`At line: ${a.Operation.line}. Can not use SetUnaryOperator (++ or --) during logical operations with branches`);if(a.Left!==void 0){let i=R(n,e,{RemAST:a.Left,logicalOp:!1,revLogic:r.revLogic,jumpFalse:r.jumpFalse,jumpTrue:r.jumpTrue});return i.asmCode+=h(e,a.Operation,i.SolvedMem),i}let l=R(n,e,{RemAST:B(a.Right),logicalOp:!1,revLogic:r.revLogic,jumpFalse:r.jumpFalse,jumpTrue:r.jumpTrue});return e.postOperations+=h(e,a.Operation,l.SolvedMem),l}function ue(n,e,r){let a;function l(){a=m.assertAsnType("lookupASN",r.RemAST),G(a.Token.type==="Function");let u=B(a.Token.extValue),d=n.functions.find(_=>_.name===u),f=n.Global.APIFunctions.find(_=>_.name===u),s=m.splitASTOnDelimiters(B(a.FunctionArgs));if(d)return i(d,s);if(f)return T(f,s);throw new Error(`At line: ${a.Token.line}. Function '${u}' not declared.`)}function i(u,d){let f,s="",_=!1;u.name===e.CurrentFunction?.name&&(_=!0,e.memory.filter(b=>b.scope===u.name&&b.address>0).reverse().forEach(b=>{s+=x("Push",b.asmName)}));let C=e.registerInfo.filter(b=>b.inUse===!0).reverse();if(C.forEach(b=>{s+=x("Push",b.Template.asmName)}),d[0].type==="nullASN"&&d.pop(),d.length!==u.argsMemObj.length)throw new Error(`At line: ${a.Token.line}. Wrong number of arguments for function '${u.name}'. It must have '${u.argsMemObj.length}' args.`);for(let b=d.length-1;b>=0;b--){let O=R(n,e,{RemAST:d[b],logicalOp:!1,revLogic:!1}),p=u.argsMemObj[b];if(m.isNotValidDeclarationOp(p.declaration,O.SolvedMem)){if(n.Config.warningToError)throw new Error(`At line: ${a.Token.line}. Warning: Function parameter type is different from variable: '${p.declaration}' and '${O.SolvedMem.declaration}'.`);m.setMemoryDeclaration(O.SolvedMem,p.declaration)}if(O.SolvedMem.size!==1&&O.SolvedMem.Offset===void 0)throw new Error(`At line: ${a.Token.line}. Overflow in argument size.`);s+=O.asmCode,s+=h(e,m.genPushToken(a.Token.line),O.SolvedMem),e.freeRegister(O.SolvedMem.address)}return s+=x("Function",u.name),u.declaration==="void"?f=m.createVoidMemObj():(f=e.getNewRegister(),f.declaration=u.declaration,f.typeDefinition=u.typeDefinition,s+=x("Pop",f.asmName)),C.reverse(),C.forEach(b=>{s+=x("Pop",b.Template.asmName)}),_&&e.memory.filter(b=>b.scope===u.name&&b.address>0).forEach(b=>{s+=x("Pop",b.asmName)}),{SolvedMem:f,asmCode:s}}function T(u,d){let f,s=[],_="";if(u.declaration==="void"?f=m.createVoidMemObj():f=e.getNewRegister(),d[0].type==="nullASN"&&d.pop(),d.length!==u.argsMemObj.length)throw new Error(`At line: ${a.Token.line}. Wrong number of arguments for function '${u.name}'. It must have '${u.argsMemObj.length}' args.`);return d.forEach(C=>{let b=R(n,e,{RemAST:C,logicalOp:!1,revLogic:!1});if(_+=b.asmCode,m.getDeclarationFromMemory(b.SolvedMem)!=="long"){if(n.Config.warningToError)throw new Error(`At line: ${a.Token.line}. Warning: API Function parameter type is different from variable:  'long' and '${b.SolvedMem.declaration}'.`);m.setMemoryDeclaration(b.SolvedMem,"long")}if(b.SolvedMem.size!==1&&b.SolvedMem.Offset===void 0)throw new Error(`At line: ${a.Token.line}. Overflow in argument size.`);s.push(b.SolvedMem)}),_+=Ae(e,m.genAPICallToken(a.Token.line,u.asmName),f,s),s.forEach(C=>e.freeRegister(C.address)),{SolvedMem:f,asmCode:_}}return l()}function be(n,e,r){let a=-1,l;function i(){l=m.assertAsnType("lookupASN",r.RemAST);let t;switch(l.Token.type){case"Variable":t={SolvedMem:e.getMemoryObjectByName(l.Token.value,l.Token.line,e.isDeclaration),asmCode:""};break;case"Function":t=ue(n,e,r);break;default:throw new Error(`Internal error at line: ${l.Token.line}.`)}if(l.modifiers.length!==0&&t.SolvedMem.type==="void")throw new Error(`At line: ${l.Token.line}. Function returning void value can not have modifiers.`);let c=l.modifiers.reduce(T,t);if(r.logicalOp===!0){if(c.SolvedMem.type==="void")throw new Error(`At line: ${l.Token.line}. Function returning void value can not be used in conditionals decision.`);return c.asmCode+=h(e,m.genNotEqualToken(),c.SolvedMem,m.createConstantMemObj(0),r.revLogic,r.jumpFalse,r.jumpTrue),e.freeRegister(c.SolvedMem.address),{SolvedMem:m.createVoidMemObj(),asmCode:c.asmCode}}return c}function T(t,c){switch(c.type){case"MemberByVal":case"MemberByRef":return u(t,c);case"Array":return _(t,c)}}function u(t,c){let o=c.Center.value;if(o==="length"&&c.type==="MemberByVal")return d(t.SolvedMem);let $=f(t.SolvedMem),g=s($,o),N=0,M=$.structMembers[g];if(M.ArrayItem&&(t.SolvedMem.ArrayItem={declaration:M.ArrayItem.declaration,totalSize:M.ArrayItem.totalSize,type:M.ArrayItem.type,typeDefinition:M.ArrayItem.typeDefinition},N=1),a=-1,c.type==="MemberByRef"){if(m.getDeclarationFromMemory(t.SolvedMem)!=="struct_ptr")throw new Error(`At line: ${l.Token.line}.  Variable '${t.SolvedMem.name}' not defined as struct pointer. Try to use '.' instead.`);if(t.SolvedMem.Offset===void 0)return t.SolvedMem.Offset={type:"constant",value:N+$.structAccumulatedSize[g][1],declaration:M.declaration,typeDefinition:M.typeDefinition},t;if(t.SolvedMem.Offset.type==="constant"){let w=e.getNewRegister();return w.declaration=t.SolvedMem.Offset.declaration,w.typeDefinition=t.SolvedMem.Offset.typeDefinition,t.asmCode+=h(e,m.genAssignmentToken(l.Token.line),w,t.SolvedMem),w.Offset={type:"constant",value:$.structAccumulatedSize[g][1],declaration:M.declaration,typeDefinition:M.typeDefinition},{SolvedMem:w,asmCode:t.asmCode}}throw new Error(`Internal error at line: ${l.Token.line}. Inspection needed.`)}if(m.getDeclarationFromMemory(t.SolvedMem)==="struct_ptr")throw new Error(`At line: ${l.Token.line}. Using wrong member notation. Try to use '->' instead.`);if(t.SolvedMem.Offset===void 0)return t.SolvedMem=e.getMemoryObjectByLocation(Number("0x"+t.SolvedMem.hexContent)+$.structAccumulatedSize[g][1]),t;if(t.SolvedMem.Offset.type==="constant"){let w=t.SolvedMem.Offset.value+Number("0x"+t.SolvedMem.hexContent);return t.SolvedMem=e.getMemoryObjectByLocation(w+$.structAccumulatedSize[g][1]),t}return t.asmCode+=h(e,m.genAddToken(l.Token.line),e.getMemoryObjectByLocation(t.SolvedMem.Offset.addr,l.Token.line),m.createConstantMemObj(N+$.structAccumulatedSize[g][1])),t.SolvedMem.Offset.declaration=M.declaration,t.SolvedMem.Offset.typeDefinition=M.typeDefinition,t}function d(t){let c=b(t);if(c===void 0)throw new Error(`At line: ${l.Token.line}. Array type definition not found for variable '${t.name}'.`);let o=B(c.MemoryTemplate.ArrayItem?.totalSize);return t.Offset?.type==="variable"&&e.freeRegister(t.Offset.addr),e.freeRegister(t.address),{SolvedMem:m.createConstantMemObj((o-1)/c.MemoryTemplate.size),asmCode:""}}function f(t){let c=t.typeDefinition;if(t.Offset?.declaration==="struct"&&(c=t.Offset.typeDefinition),c===void 0)throw new Error(`At line: ${l.Token.line}. Variable '${t.name}' has no struct type definition`);let o=n.typesDefinitions.find($=>$.type==="struct"&&$.name===c);return B(o)}function s(t,c){let o=-1;if(o=t.structAccumulatedSize.findIndex($=>$[0]===c),o===-1)throw new Error(`At line: ${l.Token.line}. Member '${c}' not found on struct type definition.`);return o}function _(t,c){a++;let o=C(t.SolvedMem,a);if(t.SolvedMem.ArrayItem===void 0){if(t.SolvedMem.Offset!==void 0)throw new Error("Internal error.");t.SolvedMem.ArrayItem={type:t.SolvedMem.type,declaration:t.SolvedMem.declaration==="void_ptr"?"long":t.SolvedMem.declaration.slice(0,-4),typeDefinition:"",totalSize:0}}let $=R(n,e,{RemAST:c.Center,logicalOp:!1,revLogic:!1});if($.SolvedMem.Offset){let g=e.getNewRegister();g.declaration=m.getDeclarationFromMemory($.SolvedMem),$.asmCode+=h(e,m.genAssignmentToken(l.Token.line),g,$.SolvedMem),$.SolvedMem.Offset.type==="variable"&&e.freeRegister($.SolvedMem.Offset.addr),e.freeRegister($.SolvedMem.address),$.SolvedMem=g}if(t.asmCode+=$.asmCode,$.SolvedMem.type==="void")return e.hasVoidArray=!0,t;if(t.SolvedMem.Offset===void 0)return O(t,$.SolvedMem,o);if(t.SolvedMem.Offset.type==="constant")return p(t,$.SolvedMem,o);if(t.SolvedMem.Offset.declaration=t.SolvedMem.ArrayItem.declaration,t.SolvedMem.Offset.typeDefinition=t.SolvedMem.ArrayItem.typeDefinition,e.isTemp(t.SolvedMem.Offset.addr))return E(t,$.SolvedMem,o);throw new Error("Internal error.")}function C(t,c){let o=b(t);if(o!==void 0)return o.arrayMultiplierDim[c];if(m.getDeclarationFromMemory(t).includes("_ptr")===!1)throw new Error(`At line: ${l.Token.line}. Array type definition not found. Is '${t}' declared as array or pointer?`);return 1}function b(t){let c=t.typeDefinition;return t.Offset&&t.Offset.declaration!=="struct"&&(c=t.Offset?.typeDefinition),n.typesDefinitions.find(o=>o.type==="array"&&o.name===c)}function O(t,c,o){let $=S(c.address),g;if(t.SolvedMem.ArrayItem===void 0)throw new Error("Internal error.");switch($){case"constant":return t.SolvedMem.Offset={type:"constant",value:Number(`0x${c.hexContent}`)*o,declaration:t.SolvedMem.ArrayItem.declaration,typeDefinition:t.SolvedMem.ArrayItem.typeDefinition},t;case"register":return t.SolvedMem.Offset={type:"variable",addr:c.address,declaration:t.SolvedMem.ArrayItem.declaration,typeDefinition:t.SolvedMem.ArrayItem.typeDefinition},t.asmCode+=h(e,m.genMulToken(l.Token.line),c,m.createConstantMemObj(o)),t;case"regularVariable":return o===1?(t.SolvedMem.Offset={type:"variable",addr:c.address,declaration:t.SolvedMem.ArrayItem.declaration,typeDefinition:t.SolvedMem.ArrayItem.typeDefinition},t):(g=e.getNewRegister(),t.asmCode+=h(e,m.genAssignmentToken(l.Token.line),g,m.createConstantMemObj(o)),t.asmCode+=h(e,m.genMulToken(l.Token.line),g,c),t.SolvedMem.Offset={type:"variable",addr:g.address,declaration:t.SolvedMem.ArrayItem.declaration,typeDefinition:t.SolvedMem.ArrayItem.typeDefinition},t)}}function p(t,c,o){let $=S(c.address),g;if(t.SolvedMem.ArrayItem===void 0||t.SolvedMem.Offset?.type!=="constant")throw new Error("Internal error.");switch($){case"constant":return t.SolvedMem.Offset.value+=Number(`0x${c.hexContent}`)*o,t.SolvedMem.Offset.declaration=t.SolvedMem.ArrayItem.declaration,t.SolvedMem.Offset.typeDefinition=t.SolvedMem.ArrayItem.typeDefinition,t;case"register":return t.asmCode+=h(e,m.genMulToken(l.Token.line),c,m.createConstantMemObj(o)),t.asmCode+=h(e,m.genAddToken(l.Token.line),c,m.createConstantMemObj(t.SolvedMem.Offset.value)),t.SolvedMem.Offset={type:"variable",addr:c.address,declaration:t.SolvedMem.ArrayItem.declaration,typeDefinition:t.SolvedMem.ArrayItem.typeDefinition},t;case"regularVariable":return o===1&&t.SolvedMem.Offset.value===0?(t.SolvedMem.Offset={type:"variable",addr:c.address,declaration:t.SolvedMem.ArrayItem.declaration,typeDefinition:t.SolvedMem.ArrayItem.typeDefinition},t):(g=e.getNewRegister(),t.asmCode+=h(e,m.genAssignmentToken(l.Token.line),g,c),t.asmCode+=h(e,m.genMulToken(l.Token.line),g,m.createConstantMemObj(o)),t.asmCode+=h(e,m.genAddToken(l.Token.line),g,m.createConstantMemObj(t.SolvedMem.Offset.value)),t.SolvedMem.Offset={type:"variable",addr:g.address,declaration:t.SolvedMem.ArrayItem.declaration,typeDefinition:t.SolvedMem.ArrayItem.typeDefinition},t)}}function E(t,c,o){let $=S(c.address),g;if(t.SolvedMem.Offset===void 0||t.SolvedMem.Offset.type!=="variable")throw new Error("Internal error.");switch($){case"constant":return o*=Number("0x"+c.hexContent),t.asmCode+=h(e,m.genAddToken(l.Token.line),e.getMemoryObjectByLocation(t.SolvedMem.Offset.addr,l.Token.line),m.createConstantMemObj(o)),t;case"register":return t.asmCode+=h(e,m.genMulToken(l.Token.line),c,m.createConstantMemObj(o)),t.asmCode+=h(e,m.genAddToken(l.Token.line),e.getMemoryObjectByLocation(t.SolvedMem.Offset.addr,l.Token.line),c),e.freeRegister(c.address),t;case"regularVariable":return o===1?(t.asmCode+=h(e,m.genAddToken(l.Token.line),e.getMemoryObjectByLocation(t.SolvedMem.Offset.addr,l.Token.line),c),t):(g=e.getNewRegister(),t.asmCode+=h(e,m.genAssignmentToken(l.Token.line),g,c),t.asmCode+=h(e,m.genMulToken(l.Token.line),g,m.createConstantMemObj(o)),t.asmCode+=h(e,m.genAddToken(l.Token.line),e.getMemoryObjectByLocation(t.SolvedMem.Offset.addr,l.Token.line),g),e.freeRegister(g.address),t)}}function S(t){return t===-1?"constant":e.isTemp(t)?"register":"regularVariable"}return i()}function Ee(n,e,r){let a;function l(){a=m.assertAsnType("switchASN",r.RemAST);let T="",u=R(n,e,{RemAST:a.Expression,logicalOp:!1,revLogic:r.revLogic});return T+=u.asmCode,u.SolvedMem.type==="constant"?u.SolvedMem.hexContent==="0000000000000000"?i(!1):i(!0):(a.caseConditions.forEach((d,f)=>{let s=R(n,e,{RemAST:d,logicalOp:!1,revLogic:r.revLogic});T+=s.asmCode,T+=h(e,m.genNotEqualToken(),u.SolvedMem,s.SolvedMem,r.revLogic,r.jumpFalse+"_"+f,r.jumpTrue)}),T+=x("Jump",r.jumpTrue),{SolvedMem:m.createVoidMemObj(),asmCode:T})}function i(T){let u="";return a.caseConditions.forEach((d,f)=>{let s={RemAST:d,logicalOp:!0,revLogic:!0,jumpFalse:r.jumpFalse+"_"+f+"_next",jumpTrue:r.jumpFalse+"_"+f};T||(s.revLogic=!1,s.jumpFalse=r.jumpFalse+"_"+f,s.jumpTrue=r.jumpFalse+"_"+f+"_next"),u+=R(n,e,s).asmCode,u+=x("Label",r.jumpFalse+"_"+f+"_next")}),u+=x("Jump",r.jumpTrue),{SolvedMem:m.createVoidMemObj(),asmCode:u}}return l()}function Te(n,e,r){let a;function l(){switch(a=m.assertAsnType("unaryASN",r.RemAST),a.Operation.type){case"UnaryOperator":return i();case"Keyword":return b();default:throw new Error(`Internal error at line: ${a.Operation.line}.`)}}function i(){switch(a.Operation.value){case"!":return T();case"+":return u();case"*":return f();case"-":return s();case"~":return _();case"&":return C();default:throw new Error(`Internal error at line: ${a.Operation.line}.`)}}function T(){if(r.logicalOp===!0)return R(n,e,{RemAST:a.Center,logicalOp:!0,revLogic:!r.revLogic,jumpFalse:r.jumpTrue,jumpTrue:r.jumpFalse});let t=e.getNewJumpID(a.Operation.line),c="__NOT_"+t+"_sF",o="__NOT_"+t+"_sT",$="__NOT_"+t+"_end",g=R(n,e,{RemAST:a.Center,logicalOp:!0,revLogic:!r.revLogic,jumpFalse:o,jumpTrue:c}),N=e.getNewRegister();return g.asmCode+=x("Label",o),g.asmCode+=h(e,m.genAssignmentToken(a.Operation.line),N,m.createConstantMemObj(1)),g.asmCode+=x("Jump",$),g.asmCode+=x("Label",c),g.asmCode+=h(e,m.genAssignmentToken(a.Operation.line),N,m.createConstantMemObj(0)),g.asmCode+=x("Label",$),e.freeRegister(g.SolvedMem.address),{SolvedMem:N,asmCode:g.asmCode}}function u(){return R(n,e,{RemAST:a.Center,logicalOp:r.logicalOp,revLogic:r.revLogic,jumpFalse:r.jumpFalse,jumpTrue:r.jumpTrue})}function d(){return R(n,e,{RemAST:a.Center,logicalOp:!1,revLogic:r.revLogic,jumpFalse:r.jumpFalse,jumpTrue:r.jumpTrue})}function f(){let t=d();if(e.isDeclaration.length!==0)return t;let c=m.getDeclarationFromMemory(t.SolvedMem);if(c.includes("_ptr")===!1){if(n.Config.warningToError)throw a.Center.type==="endASN"||a.Center.type==="lookupASN"?new Error(`At line: ${a.Operation.line}. Warning: Trying to read/set content of variable ${a.Center.Token.value} that is not declared as pointer.`):new Error(`At line: ${a.Operation.line}. Warning: Trying to read/set content of a value that is not declared as pointer.`);m.setMemoryDeclaration(t.SolvedMem,c+"_ptr")}if(t.SolvedMem.Offset){let o=e.getNewRegister();o.declaration=m.getDeclarationFromMemory(t.SolvedMem),t.asmCode+=h(e,m.genAssignmentToken(a.Operation.line),o,t.SolvedMem),t.SolvedMem.Offset.type==="variable"&&e.freeRegister(t.SolvedMem.Offset.addr),e.freeRegister(t.SolvedMem.address),t.SolvedMem=o}return t.SolvedMem.Offset={type:"constant",value:0,declaration:"long"},r.logicalOp===!0?(t.asmCode+=h(e,m.genNotEqualToken(),t.SolvedMem,m.createConstantMemObj(0),r.revLogic,r.jumpFalse,r.jumpTrue),e.freeRegister(t.SolvedMem.address),{SolvedMem:m.createVoidMemObj(),asmCode:t.asmCode}):t}function s(){let{SolvedMem:t,asmCode:c}=d();if(t.type==="constant")return{SolvedMem:m.createConstantMemObj(m.subHexContents(0,t.hexContent)),asmCode:c};let o=e.getNewRegister();return o.declaration=m.getDeclarationFromMemory(t),c+=h(e,m.genAssignmentToken(a.Operation.line),o,m.createConstantMemObj(0)),c+=h(e,m.genSubToken(a.Operation.line),o,t),e.freeRegister(t.address),r.logicalOp===!0?(c+=h(e,m.genNotEqualToken(),o,m.createConstantMemObj(0),r.revLogic,r.jumpFalse,r.jumpTrue),e.freeRegister(o.address),{SolvedMem:m.createVoidMemObj(),asmCode:c}):{SolvedMem:o,asmCode:c}}function _(){let t=!1,{SolvedMem:c,asmCode:o}=d(),$;return e.isTemp(c.address)?$=c:($=e.getNewRegister(),$.declaration=m.getDeclarationFromMemory(c),o+=h(e,m.genAssignmentToken(a.Operation.line),$,c),t=!0),o+=h(e,a.Operation,$),r.logicalOp===!0?(o+=h(e,m.genNotEqualToken(),$,m.createConstantMemObj(0),r.revLogic,r.jumpFalse,r.jumpTrue),e.freeRegister(c.address),e.freeRegister($.address),{SolvedMem:m.createVoidMemObj(),asmCode:o}):(t&&e.freeRegister(c.address),{SolvedMem:$,asmCode:o})}function C(){if(r.jumpFalse!==void 0)throw new Error(`At line: ${a.Operation.line}. Can not use UnaryOperator '&' during logical operations with branches.`);let{SolvedMem:t,asmCode:c}=d(),o;switch(t.type){case"void":throw new Error(`At line: ${a.Operation.line}. Trying to get address of void value.`);case"register":if(n.Config.warningToError)throw new Error(`At line: ${a.Operation.line}. Warning: Returning address of a register.`);o=m.createConstantMemObj(t.address);break;case"constant":throw new Error(`At line: ${a.Operation.line}. Trying to get address of a constant value.`);case"array":if(t.Offset!==void 0){if(t.Offset.type==="constant"){o=m.createConstantMemObj(m.addHexContents(t.hexContent,t.Offset.value)),o.declaration=t.declaration;break}let $=P(t);delete $.Offset,o=e.getNewRegister(),o.declaration=t.declaration,c+=h(e,m.genAssignmentToken(a.Operation.line),o,$),c+=h(e,m.genAddToken(),o,e.getMemoryObjectByLocation(t.Offset.addr));break}o=m.createConstantMemObj(t.address);break;case"struct":o=m.createConstantMemObj(t.hexContent),o.declaration="struct_ptr";break;case"structRef":if(t.Offset!==void 0)throw new Error(`Internal error at line: ${a.Operation.line}. Get address of 'structRef' with offset not implemented. `);o=m.createConstantMemObj(t.address),o.declaration="struct_ptr";break;case"long":o=m.createConstantMemObj(t.address),o.declaration="long";break;default:throw new Error(`Internal error at line ${a.Operation.line}.`)}return o.declaration.includes("_ptr")||(o.declaration+="_ptr"),{SolvedMem:o,asmCode:c}}function b(){switch(a.Operation.value){case"long":case"void":return e.isDeclaration=a.Operation.value,d();case"const":return e.isConstSentence=!0,d();case"return":return O();case"goto":return p();case"sleep":return E();case"sizeof":return S();case"struct":return{SolvedMem:m.createVoidMemObj(),asmCode:""};default:throw new Error(`Internal error: At line: ${a.Operation.line}. Invalid use of keyword '${a.Operation.value}'`)}}function O(){if(e.CurrentFunction===void 0)throw new Error(`At line: ${a.Operation.line}. Can not use 'return' in global statements.`);if(e.CurrentFunction.declaration==="void")throw new Error(`At line: ${a.Operation.line}. Function '${e.CurrentFunction.name}' must return a ${e.CurrentFunction.declaration}' value.`);if(e.CurrentFunction.name==="main"||e.CurrentFunction.name==="catch")throw new Error(`At line: ${a.Operation.line}.  Special function ${e.CurrentFunction.name} must return void value.`);let t=d();if(t.asmCode+=e.getPostOperations(),m.isNotValidDeclarationOp(e.CurrentFunction.declaration,t.SolvedMem)){if(n.Config.warningToError)throw new Error(`At line: ${a.Operation.line}. Warning: Function ${e.CurrentFunction.name} must return '${e.CurrentFunction.declaration}' value, but it is returning '${t.SolvedMem.declaration}'.`);m.setMemoryDeclaration(t.SolvedMem,e.CurrentFunction.declaration)}return t.asmCode+=h(e,a.Operation,t.SolvedMem),e.freeRegister(t.SolvedMem.address),{SolvedMem:m.createVoidMemObj(),asmCode:t.asmCode}}function p(){let t=d();if(t.asmCode+=e.getPostOperations(),t.SolvedMem.type!=="label")throw new Error(`At line: ${a.Operation.line}. Argument for keyword 'goto' is not a label.`);return t.asmCode+=h(e,a.Operation,t.SolvedMem),e.freeRegister(t.SolvedMem.address),{SolvedMem:m.createVoidMemObj(),asmCode:t.asmCode}}function E(){let t=d();return t.asmCode+=e.getPostOperations(),t.asmCode+=h(e,a.Operation,t.SolvedMem),e.freeRegister(t.SolvedMem.address),{SolvedMem:m.createVoidMemObj(),asmCode:t.asmCode}}function S(){let t=d();if(t.SolvedMem.type==="structRef"&&t.SolvedMem.Offset!==void 0)throw new Error(`At line: ${a.Operation.line}. Struct pointer members not supported by 'sizeof'.`);let c=t.SolvedMem.size;return t.SolvedMem.Offset===void 0&&t.SolvedMem.ArrayItem!==void 0&&(c=t.SolvedMem.ArrayItem.totalSize),{SolvedMem:m.createConstantMemObj(c),asmCode:t.asmCode}}return l()}function R(n,e,r){switch(r.RemAST.type){case"nullASN":return{SolvedMem:m.createVoidMemObj(),asmCode:""};case"endASN":return me(n,e,r);case"lookupASN":return be(n,e,r);case"unaryASN":return Te(n,e,r);case"exceptionASN":return ge(n,e,r);case"binaryASN":return pe(n,e,r);case"switchASN":return Ee(n,e,r)}}function Z(n,e,r){let a={CurrentFunction:n.Program.functions[n.currFunctionIndex],memory:n.Program.memory,jumpId:n.jumpId,registerInfo:[],postOperations:"",isDeclaration:"",isLeftSideOfAssignment:!1,isConstSentence:!1,hasVoidArray:!1,isTemp:T,getNewRegister:u,freeRegister:d,getPostOperations:f,getMemoryObjectByName:s,getMemoryObjectByLocation:_,getNewJumpID:C};function l(){e.InitialAST=B(e.InitialAST),e.initialIsReversedLogic=e.initialIsReversedLogic??!1,a.memory.filter(p=>/^r\d$/.test(p.asmName)).forEach(p=>{a.registerInfo.push({inUse:!1,Template:p})});let b=R(n.Program,a,{RemAST:e.InitialAST,logicalOp:e.initialJumpTarget!==void 0,revLogic:e.initialIsReversedLogic,jumpFalse:e.initialJumpTarget,jumpTrue:e.initialJumpNotTarget});i(e.InitialAST,b.SolvedMem),b.asmCode+=a.postOperations,n.jumpId=a.jumpId;let O=b.asmCode.split(`
`);return b.asmCode=O.map(p=>p.includes("%generateUtils.getLatestLoopId()%")?p.replace("%generateUtils.getLatestLoopId()%",n.getLatestLoopID()):p.includes("%generateUtils.getLatestPureLoopId()%")?p.replace("%generateUtils.getLatestPureLoopId()%",n.getLatestPureLoopID()):p).join(`
`),b.asmCode}function i(b,O){if(n.Program.Config.warningToError&&e.initialJumpTarget===void 0&&O.type==="register"&&(b.type==="unaryASN"&&b.Operation.value!=="*"||b.type==="binaryASN"&&(b.Operation.type==="Comparision"||b.Operation.type==="Operator")))throw new Error(`At line: ${b.Operation.line}. Warning: Operation returning a value that is not being used.`)}function T(b){return b===-1?!1:a.registerInfo.find(p=>p.Template.address===b)?.inUse===!0}function u(b=r){let O=a.registerInfo.find(p=>p.inUse===!1);if(O===void 0)throw new Error(`At line: ${b}. No more registers available. Try to reduce nested operations or increase 'maxAuxVars'.`);return O.inUse=!0,P(O.Template)}function d(b){if(b===void 0||b===-1)return;let O=a.registerInfo.find(p=>p.Template.address===b);O!==void 0&&(O.inUse=!1)}function f(){let b=a.postOperations;return a.postOperations="",b}function s(b,O=r,p=""){let E;if(a.CurrentFunction!==void 0&&(E=a.memory.find(S=>S.name===b&&S.scope===a.CurrentFunction?.name)),E===void 0&&(E=a.memory.find(S=>S.name===b&&S.scope==="")),E===void 0)throw new Error(`At line: ${O}. Using variable '${b}' before declaration.`);return p!==""?(E.isDeclared=!0,P(E)):P(E)}function _(b,O=r){let p;typeof b=="number"?p=b:p=parseInt(b,16);let E=a.memory.find(S=>S.address===p);if(E===void 0)throw new Error(`At line: ${O}. No variable found at address '${p}'.`);return P(E)}function C(b){let O="";return n.Program.Config.enableLineLabels&&(O+=b+"_"),n.Program.Config.enableRandom===!0?O+Math.random().toString(36).substr(2,5):(a.jumpId++,O+a.jumpId.toString(36))}return l()}function $e(n){let e={Program:n,latestLoopId:[],jumpId:0,assemblyCode:"",currFunctionIndex:-1,currSourceLine:0,getNewJumpID:function(s){let _="";return this.Program.Config.enableLineLabels&&(_+=s+"_"),this.Program.Config.enableRandom===!0?_+Math.random().toString(36).substr(2,5):(this.jumpId++,_+this.jumpId.toString(36))},getLatestLoopID:function(){return this.latestLoopId[this.latestLoopId.length-1]},getLatestPureLoopID:function(){return this.latestLoopId.reduce((s,_)=>_.includes("loop")?_:s,"")}};function r(){return i(),n.memory.forEach(T),a(""),n.functions.findIndex(s=>s.name==="catch")!==-1&&a("ERR :__fn_catch"),e.currFunctionIndex=-1,n.Global.sentences.forEach(f),n.functions.find(s=>s.name==="main")===void 0?a("FIN"):a("JMP :__fn_main"),n.functions.forEach((s,_)=>{e.currFunctionIndex=_,a(""),u(),s.sentences!==void 0&&s.sentences.forEach(f),d()}),oe(n.Config.optimizationLevel,e.assemblyCode,n.memory.filter(s=>s.type==="label").map(s=>s.asmName))}function a(s,_=0){n.Config.outputSourceLineNumber===!0&&_!==0&&_!==e.currSourceLine&&(e.assemblyCode+=`^comment line ${_}
`,e.currSourceLine=_),e.assemblyCode+=s+`
`}function l(s,_=0){s.length!==0&&(n.Config.outputSourceLineNumber===!0&&_!==0&&_!==e.currSourceLine&&(e.assemblyCode+=`^comment line ${_}
`,e.currSourceLine=_),e.assemblyCode+=s)}function i(){n.Config.PName!==""&&a(`^program name ${n.Config.PName}`),n.Config.PDescription!==""&&a(`^program description ${n.Config.PDescription}`),n.Config.PActivationAmount!==""&&a("^program activationAmount "+n.Config.PActivationAmount),n.Config.PUserStackPages!==0&&a(`^program userStackPages ${n.Config.PUserStackPages}`),n.Config.PCodeStackPages!==0&&a(`^program codeStackPages ${n.Config.PCodeStackPages}`)}function T(s){s.address!==-1&&(a(`^declare ${s.asmName}`),s.hexContent!==void 0&&a(`^const SET @${s.asmName} #${s.hexContent}`))}function u(){let s=n.functions[e.currFunctionIndex].name;if(s==="main"||s==="catch"){a(`__fn_${s}:`,n.functions[e.currFunctionIndex].line),a("PCS");return}a(`__fn_${s}:`,n.functions[e.currFunctionIndex].line),n.functions[e.currFunctionIndex].argsMemObj.forEach(_=>{a(`POP @${_.asmName}`)})}function d(){let s=n.functions[e.currFunctionIndex].name;if(s==="main"||s==="catch"){e.assemblyCode.lastIndexOf("FIN")+4!==e.assemblyCode.length&&a("FIN");return}if(e.assemblyCode.lastIndexOf("RET")+4!==e.assemblyCode.length){if(n.functions[e.currFunctionIndex].declaration==="void"){a("RET");return}a("CLR @r0"),a("PSH $r0"),a("RET")}}function f(s){let _,C;switch(s.type){case"phrase":l(Z(e,{InitialAST:s.CodeAST},s.line),s.line);break;case"ifEndif":_="__if"+e.getNewJumpID(s.line),C=Z(e,{InitialAST:s.ConditionAST,initialJumpTarget:_+"_endif",initialJumpNotTarget:_+"_start"},s.line),l(C,s.line),a(_+"_start:"),s.trueBlock.forEach(f),a(_+"_endif:");break;case"ifElse":_="__if"+e.getNewJumpID(s.line),C=Z(e,{InitialAST:s.ConditionAST,initialJumpTarget:_+"_else",initialJumpNotTarget:_+"_start"},s.line),l(C,s.line),a(_+"_start:"),s.trueBlock.forEach(f),a("JMP :"+_+"_endif"),a(_+"_else:"),s.falseBlock.forEach(f),a(_+"_endif:");break;case"while":_="__loop"+e.getNewJumpID(s.line),a(_+"_continue:",s.line),C=Z(e,{InitialAST:s.ConditionAST,initialJumpTarget:_+"_break",initialJumpNotTarget:_+"_start"},s.line),l(C),a(_+"_start:"),e.latestLoopId.push(_),s.trueBlock.forEach(f),e.latestLoopId.pop(),a("JMP :"+_+"_continue"),a(_+"_break:");break;case"do":_="__loop"+e.getNewJumpID(s.line),a(_+"_continue:",s.line),e.latestLoopId.push(_),s.trueBlock.forEach(f),e.latestLoopId.pop(),C=Z(e,{InitialAST:s.ConditionAST,initialJumpTarget:_+"_break",initialJumpNotTarget:_+"_continue",initialIsReversedLogic:!0},s.line),l(C),a(_+"_break:");break;case"for":_="__loop"+e.getNewJumpID(s.line),C=Z(e,{InitialAST:s.threeSentences[0].CodeAST},s.line),l(C,s.line),a(_+"_condition:"),C=Z(e,{InitialAST:s.threeSentences[1].CodeAST,initialJumpTarget:_+"_break",initialJumpNotTarget:_+"_start"},s.line),l(C,s.line),a(_+"_start:"),e.latestLoopId.push(_),s.trueBlock.forEach(f),e.latestLoopId.pop(),a(_+"_continue:"),C=Z(e,{InitialAST:s.threeSentences[2].CodeAST},s.line),l(C,s.line),a("JMP :"+_+"_condition"),a(_+"_break:");break;case"switch":{_="__switch"+e.getNewJumpID(s.line);let b=_;b+=s.hasDefault?"_default":"_break",C=Z(e,{InitialAST:s.JumpTable,initialJumpTarget:_,initialJumpNotTarget:b,initialIsReversedLogic:!1},s.line),l(C,s.line),e.latestLoopId.push(_),s.block.forEach(f),e.latestLoopId.pop(),a(_+"_break:");break}case"case":a(e.getLatestLoopID()+s.caseId+":",s.line);break;case"default":a(e.getLatestLoopID()+"_default:",s.line);break;case"label":a(s.id+":",s.line);break;case"struct":}}return r()}function Ne(n){let e=Number((BigInt(n.length)/512n+1n)*512n);n=n.padEnd(e,"0");let a=n.match(/[\s\S]{8}/g).map(_=>d(Number("0x"+_))),l=u(s(a,4*8*a.length)),i=BigInt(f(l[0]));return((BigInt(f(l[1]))<<32n)+i).toString(10);function u(_){let C=_.map(p=>f(p)),b=[],O;for(let p of C)O=p>>24&255,O|=(p>>16&255)<<8,O|=(p>>8&255)<<16,O|=(p&255)<<24,b.push(d(O));return b}function d(_){return _>=2147483648?_-4294967296:_}function f(_){return _<0?_+4294967296:_}function s(_,C){function b(D,H){let V=(D&65535)+(H&65535);return(D>>16)+(H>>16)+(V>>16)<<16|V&65535}function O(D,H){return D>>>H|D<<32-H}function p(D,H){return D>>>H}function E(D,H,V){return D&H^~D&V}function S(D,H,V){return D&H^D&V^H&V}function t(D){return O(D,2)^O(D,13)^O(D,22)}function c(D){return O(D,6)^O(D,11)^O(D,25)}function o(D){return O(D,7)^O(D,18)^p(D,3)}function $(D){return O(D,17)^O(D,19)^p(D,10)}let g=[1116352408,1899447441,-1245643825,-373957723,961987163,1508970993,-1841331548,-1424204075,-670586216,310598401,607225278,1426881987,1925078388,-2132889090,-1680079193,-1046744716,-459576895,-272742522,264347078,604807628,770255983,1249150122,1555081692,1996064986,-1740746414,-1473132947,-1341970488,-1084653625,-958395405,-710438585,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,-2117940946,-1838011259,-1564481375,-1474664885,-1035236496,-949202525,-778901479,-694614492,-200395387,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,-2067236844,-1933114872,-1866530822,-1538233109,-1090935817,-965641998],N=[1779033703,-1150833019,1013904242,-1521486534,1359893119,-1694144372,528734635,1541459225],M=new Array(64),w,U,L,v,I,A,y,z,Y,J,F,Oe;for(_[C>>5]|=128<<24-C%32,_[(C+64>>9<<4)+15]=C,Y=0;Y<_.length;Y+=16){for(w=N[0],U=N[1],L=N[2],v=N[3],I=N[4],A=N[5],y=N[6],z=N[7],J=0;J<64;J++)J<16?M[J]=_[J+Y]:M[J]=b(b(b($(M[J-2]),M[J-7]),o(M[J-15])),M[J-16]),F=b(b(b(b(z,c(I)),E(I,A,y)),g[J]),M[J]),Oe=b(t(w),S(w,U,L)),z=y,y=A,A=I,I=b(v,F),v=L,L=U,U=w,w=b(F,Oe);N[0]=b(w,N[0]),N[1]=b(U,N[1]),N[2]=b(L,N[2]),N[3]=b(v,N[3]),N[4]=b(I,N[4]),N[5]=b(A,N[5]),N[6]=b(y,N[6]),N[7]=b(z,N[7])}return N}}function Se(n){let e=[{opCode:240,name:"blank",size:0,argsType:[],regex:/^\s*$/},{opCode:241,name:"label",size:0,argsType:[],regex:/^\s*(\w+):\s*$/},{opCode:242,name:"comment",size:0,argsType:[],regex:/^\s*\^comment\s+(.*)/},{opCode:243,name:"declare",size:0,argsType:[],regex:/^\s*\^declare\s+(\w+)\s*$/},{opCode:244,name:"const",size:0,argsType:[],regex:/^\s*\^const\s+SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/},{opCode:245,name:"program",size:0,argsType:[],regex:/^\s*\^program\s+(\w+\b)(.*)$/},{opCode:1,name:"SET_VAL",size:13,argsType:["I","L"],regex:/^\s*SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/},{opCode:2,name:"SET_DAT",size:9,argsType:["I","I"],regex:/^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/},{opCode:3,name:"CLR_DAT",size:5,argsType:["I"],regex:/^\s*CLR\s+@(\w+)\s*$/},{opCode:4,name:"INC_DAT",size:5,argsType:["I"],regex:/^\s*INC\s+@(\w+)\s*$/},{opCode:5,name:"DEC_DAT",size:5,argsType:["I"],regex:/^\s*DEC\s+@(\w+)\s*$/},{opCode:6,name:"ADD_DAT",size:9,argsType:["I","I"],regex:/^\s*ADD\s+@(\w+)\s+\$(\w+)\s*$/},{opCode:7,name:"SUB_DAT",size:9,argsType:["I","I"],regex:/^\s*SUB\s+@(\w+)\s+\$(\w+)\s*$/},{opCode:8,name:"MUL_DAT",size:9,argsType:["I","I"],regex:/^\s*MUL\s+@(\w+)\s+\$(\w+)\s*$/},{opCode:9,name:"DIV_DAT",size:9,argsType:["I","I"],regex:/^\s*DIV\s+@(\w+)\s+\$(\w+)\s*$/},{opCode:10,name:"BOR_DAT",size:9,argsType:["I","I"],regex:/^\s*BOR\s+@(\w+)\s+\$(\w+)\s*$/},{opCode:11,name:"AND_DAT",size:9,argsType:["I","I"],regex:/^\s*AND\s+@(\w+)\s+\$(\w+)\s*$/},{opCode:12,name:"XOR_DAT",size:9,argsType:["I","I"],regex:/^\s*XOR\s+@(\w+)\s+\$(\w+)\s*$/},{opCode:13,name:"NOT_DAT",size:5,argsType:["I"],regex:/^\s*NOT\s+@(\w+)\s*$/},{opCode:14,name:"SET_IND",size:9,argsType:["I","I"],regex:/^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\)\s*$/},{opCode:15,name:"SET_IDX",size:13,argsType:["I","I","I"],regex:/^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\s*\+\s*\$(\w+)\)\s*$/},{opCode:16,name:"PSH_DAT",size:5,argsType:["I"],regex:/^\s*PSH\s+\$(\w+)\s*$/},{opCode:17,name:"POP_DAT",size:5,argsType:["I"],regex:/^\s*POP\s+@(\w+)\s*$/},{opCode:18,name:"JMP_SUB",size:5,argsType:["J"],regex:/^\s*JSR\s+:(\w+)\s*$/},{opCode:19,name:"RET_SUB",size:1,argsType:[],regex:/^\s*RET\s*$/},{opCode:20,name:"IND_DAT",size:9,argsType:["I","I"],regex:/^\s*SET\s+@\(\$(\w+)\)\s+\$(\w+)\s*$/},{opCode:21,name:"IDX_DAT",size:13,argsType:["I","I","I"],regex:/^\s*SET\s+@\(\$(\w+)\s*\+\s*\$(\w+)\)\s+\$(\w+)\s*$/},{opCode:22,name:"MOD_DAT",size:9,argsType:["I","I"],regex:/^\s*MOD\s+@(\w+)\s+\$(\w+)\s*$/},{opCode:23,name:"SHL_DAT",size:9,argsType:["I","I"],regex:/^\s*SHL\s+@(\w+)\s+\$(\w+)\s*$/},{opCode:24,name:"SHR_DAT",size:9,argsType:["I","I"],regex:/^\s*SHR\s+@(\w+)\s+\$(\w+)\s*$/},{opCode:26,name:"JMP_ADR",size:5,argsType:["J"],regex:/^\s*JMP\s+:(\w+)\s*$/},{opCode:27,name:"BZR_DAT",size:6,argsType:["I","B"],regex:/^\s*BZR\s+\$(\w+)\s+:(\w+)\s*$/},{opCode:30,name:"BNZ_DAT",size:6,argsType:["I","B"],regex:/^\s*BNZ\s+\$(\w+)\s+:(\w+)\s*$/},{opCode:31,name:"BGT_DAT",size:10,argsType:["I","I","B"],regex:/^\s*BGT\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/},{opCode:32,name:"BLT_DAT",size:10,argsType:["I","I","B"],regex:/^\s*BLT\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/},{opCode:33,name:"BGE_DAT",size:10,argsType:["I","I","B"],regex:/^\s*BGE\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/},{opCode:34,name:"BLE_DAT",size:10,argsType:["I","I","B"],regex:/^\s*BLE\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/},{opCode:35,name:"BEQ_DAT",size:10,argsType:["I","I","B"],regex:/^\s*BEQ\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/},{opCode:36,name:"BNE_DAT",size:10,argsType:["I","I","B"],regex:/^\s*BNE\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/},{opCode:37,name:"SLP_DAT",size:5,argsType:["I"],regex:/^\s*SLP\s+\$(\w+)\s*$/},{opCode:38,name:"FIZ_DAT",size:5,argsType:["I"],regex:/^\s*FIZ\s+\$(\w+)\s*$/},{opCode:39,name:"STZ_DAT",size:5,argsType:["I"],regex:/^\s*STZ\s+\$(\w+)\s*$/},{opCode:40,name:"FIN_IMD",size:1,argsType:[],regex:/^\s*FIN\s*$/},{opCode:41,name:"STP_IMD",size:1,argsType:[],regex:/^\s*STP\s*$/},{opCode:43,name:"ERR_ADR",size:5,argsType:["J"],regex:/^\s*ERR\s+:(\w+)\s*$/},{opCode:48,name:"SET_PCS",size:1,argsType:[],regex:/^\s*PCS\s*$/},{opCode:50,name:"EXT_FUN",size:3,argsType:["F"],regex:/^\s*FUN\s+(\w+)\s*$/},{opCode:51,name:"EXT_FUN_DAT",size:7,argsType:["F","I"],regex:/^\s*FUN\s+(\w+)\s+\$(\w+)\s*$/},{opCode:52,name:"EXT_FUN_DAT_2",size:11,argsType:["F","I","I"],regex:/^\s*FUN\s+(\w+)\s+\$(\w+)\s+\$(\w+)\s*$/},{opCode:53,name:"EXT_FUN_RET",size:7,argsType:["F","I"],regex:/^\s*FUN\s+@(\w+)\s+(\w+)\s*$/},{opCode:54,name:"EXT_FUN_RET_DAT",size:11,argsType:["F","I","I"],regex:/^\s*FUN\s+@(\w+)\s+(\w+)\s+\$(\w+)\s*$/},{opCode:55,name:"EXT_FUN_RET_DAT_2",size:15,argsType:["F","I","I","I"],regex:/^\s*FUN\s+@(\w+)\s+(\w+)\s+\$(\w+)\s+\$(\w+)\s*$/},{opCode:127,name:"NOP",size:1,argsType:[],regex:/^\s*NOP\s*$/}],r=[{name:"get_A1",apiCode:256,opCode:53},{name:"get_A2",apiCode:257,opCode:53},{name:"get_A3",apiCode:258,opCode:53},{name:"get_A4",apiCode:259,opCode:53},{name:"get_B1",apiCode:260,opCode:53},{name:"get_B2",apiCode:261,opCode:53},{name:"get_B3",apiCode:262,opCode:53},{name:"get_B4",apiCode:263,opCode:53},{name:"set_A1",apiCode:272,opCode:51},{name:"set_A2",apiCode:273,opCode:51},{name:"set_A3",apiCode:274,opCode:51},{name:"set_A4",apiCode:275,opCode:51},{name:"set_A1_A2",apiCode:276,opCode:52},{name:"set_A3_A4",apiCode:277,opCode:52},{name:"set_B1",apiCode:278,opCode:51},{name:"set_B2",apiCode:279,opCode:51},{name:"set_B3",apiCode:280,opCode:51},{name:"set_B4",apiCode:281,opCode:51},{name:"set_B1_B2",apiCode:282,opCode:52},{name:"set_B3_B4",apiCode:283,opCode:52},{name:"clear_A",apiCode:288,opCode:50},{name:"clear_B",apiCode:289,opCode:50},{name:"clear_A_B",apiCode:290,opCode:50},{name:"copy_A_From_B",apiCode:291,opCode:50},{name:"copy_B_From_A",apiCode:292,opCode:50},{name:"check_A_Is_Zero",apiCode:293,opCode:53},{name:"check_B_Is_Zero",apiCode:294,opCode:53},{name:"check_A_equals_B",apiCode:295,opCode:53},{name:"swap_A_and_B",apiCode:296,opCode:50},{name:"OR_A_with_B",apiCode:297,opCode:50},{name:"OR_B_with_A",apiCode:298,opCode:50},{name:"AND_A_with_B",apiCode:299,opCode:50},{name:"AND_B_with_A",apiCode:300,opCode:50},{name:"XOR_A_with_B",apiCode:301,opCode:50},{name:"XOR_B_with_A",apiCode:302,opCode:50},{name:"add_A_to_B",apiCode:320,opCode:50},{name:"add_B_to_A",apiCode:321,opCode:50},{name:"sub_A_from_B",apiCode:322,opCode:50},{name:"sub_B_from_A",apiCode:323,opCode:50},{name:"mul_A_by_B",apiCode:324,opCode:50},{name:"mul_B_by_A",apiCode:325,opCode:50},{name:"div_A_by_B",apiCode:326,opCode:50},{name:"div_B_by_A",apiCode:327,opCode:50},{name:"MD5_A_to_B",apiCode:512,opCode:50},{name:"check_MD5_A_with_B",apiCode:513,opCode:53},{name:"HASH160_A_to_B",apiCode:514,opCode:50},{name:"check_HASH160_A_with_B",apiCode:515,opCode:53},{name:"SHA256_A_to_B",apiCode:516,opCode:50},{name:"check_SHA256_A_with_B",apiCode:517,opCode:53},{name:"get_Block_Timestamp",apiCode:768,opCode:53},{name:"get_Creation_Timestamp",apiCode:769,opCode:53},{name:"get_Last_Block_Timestamp",apiCode:770,opCode:53},{name:"put_Last_Block_Hash_In_A",apiCode:771,opCode:50},{name:"A_to_Tx_after_Timestamp",apiCode:772,opCode:51},{name:"get_Type_for_Tx_in_A",apiCode:773,opCode:53},{name:"get_Amount_for_Tx_in_A",apiCode:774,opCode:53},{name:"get_Timestamp_for_Tx_in_A",apiCode:775,opCode:53},{name:"get_Ticket_Id_for_Tx_in_A",apiCode:776,opCode:53},{name:"message_from_Tx_in_A_to_B",apiCode:777,opCode:50},{name:"B_to_Address_of_Tx_in_A",apiCode:778,opCode:50},{name:"B_to_Address_of_Creator",apiCode:779,opCode:50},{name:"get_Current_Balance",apiCode:1024,opCode:53},{name:"get_Previous_Balance",apiCode:1025,opCode:53},{name:"send_to_Address_in_B",apiCode:1026,opCode:51},{name:"send_All_to_Address_in_B",apiCode:1027,opCode:50},{name:"send_Old_to_Address_in_B",apiCode:1028,opCode:50},{name:"send_A_to_Address_in_B",apiCode:1029,opCode:50},{name:"add_Minutes_to_Timestamp",apiCode:1030,opCode:55}],a={memory:[],code:[],labels:[],PName:"",PDescription:"",PActivationAmount:"",PUserStackPages:0,PCodeStackPages:0,bytecode:"",bytedata:""};function l(){n.split(`
`).forEach((E,S)=>{for(let t of e){let c=t.regex.exec(E);if(c!==null){T(c,t);return}}throw new Error(`assembler() error #1. No rule found to process line ${S}: "${E}".`)});do{a.labels=[];let E=0;a.code.forEach(S=>{S.address=E,S.station.length!==0&&a.labels.push({label:S.station,address:E}),E+=S.size})}while(!a.code.every(f));return a.code.forEach(s),a.code.forEach(C),a.bytedata=b(a.memory),_()}function i(p){let E=a.memory.findIndex(S=>S.name===p);return E===-1?a.memory.push({name:p,value:0n})-1:E}function T(p,E){let S=u();switch(S.source=p[0],E.opCode){case 240:return;case 241:S.station=p[1],a.code.push(S);return;case 242:return;case 243:i(p[1]);return;case 244:a.memory[i(p[1])].value=BigInt("0x"+p[2]);return;case 245:switch(p[1]){case"name":a.PName=p[2].trim();break;case"description":a.PDescription=p[2].trim();break;case"activationAmount":a.PActivationAmount=p[2].trim();break;case"userStackPages":a.PUserStackPages=Number(p[2].trim());break;case"codeStackPages":a.PCodeStackPages=Number(p[2].trim());break;default:throw new Error(`assembler() error #7. Unknow '^program' directive: '${p[1]}'`)}return}S.size=E.size,S.instructionValues.push({type:"O",value:BigInt(E.opCode)});let t=0;for(E.opCode>=53&&E.opCode<=55&&(S.instructionValues.push({type:"F",value:BigInt(d(p[2],E.opCode,S.source))}),S.instructionValues.push({type:"I",value:BigInt(i(p[1]))}),t=2);t<E.argsType.length;t++)switch(E.argsType[t]){case"I":S.instructionValues.push({type:"I",value:BigInt(i(p[t+1]))});break;case"L":S.instructionValues.push({type:"L",value:BigInt("0x"+p[t+1])});break;case"B":S.branchLabel=p[t+1];break;case"J":S.jumpLabel=p[t+1];break;case"F":{S.instructionValues.push({type:"F",value:BigInt(d(p[1],E.opCode,S.source))});break}default:throw new Error("Internal error.")}a.code.push(S)}function u(){return{source:"",address:-1,station:"",size:0,instructionValues:[],compiledInstruction:""}}function d(p,E,S){let t=r.find(c=>c.name===p&&c.opCode===E);if(t)return t.apiCode;throw new Error(`assembler() error #2. API function not found. Instruction: '${S}'`)}function f(p,E){if(p.branchLabel!==void 0){let S=a.labels.find(c=>c.label===p.branchLabel);if(S===void 0)throw new Error(`assembler() error #4. Unknow label ${p.branchLabel}. Instruction: '${p.source}'`);let t=S.address-p.address;if(t<-128||t>127){let c=u();switch(c.source=`JUMP: ${p.source}`,c.size=5,c.jumpLabel=p.branchLabel,c.instructionValues.push({type:"O",value:0x1an}),p.instructionValues[0].value){case 0x1bn:p.instructionValues[0].value=0x1en;break;case 0x1en:p.instructionValues[0].value=0x1bn;break;case 0x1fn:p.instructionValues[0].value=0x22n;break;case 0x22n:p.instructionValues[0].value=0x1fn;break;case 0x21n:p.instructionValues[0].value=0x20n;break;case 0x20n:p.instructionValues[0].value=0x21n;break;case 0x23n:p.instructionValues[0].value=0x24n;break;case 0x24n:p.instructionValues[0].value=0x23n;break}if(p.branchLabel=`__${p.address}`,a.code[E+1].station.length!==0){let o=u();o.source=`JUMP: ${p.source}`,o.size=0,o.station=`__${p.address}`,a.code.splice(E+1,0,c,o)}else a.code[E+1].station=`__${p.address}`,a.code.splice(E+1,0,c);return!1}}return!0}function s(p){if(p.branchLabel!==void 0){let S=B(a.labels.find(t=>t.label===p.branchLabel)).address-p.address;p.instructionValues.push({type:"B",value:BigInt(S)}),delete p.branchLabel}else if(p.jumpLabel!==void 0){let E=a.labels.find(S=>S.label===p.jumpLabel);if(E===void 0)throw new Error(`assembler() error #5: Unknow jump label ${p.jumpLabel}. Source: "${p.source}"`);p.instructionValues.push({type:"J",value:BigInt(E.address)}),delete p.jumpLabel}}function _(){let p=0,E=0;a.PCodeStackPages>0?p=a.PCodeStackPages:(n.indexOf("JSR ")!==-1||n.indexOf("RET")!==-1)&&(p=1),a.PUserStackPages>0?E=a.PUserStackPages:(n.indexOf("POP ")!==-1||n.indexOf("PSH ")!==-1)&&(E=1);let S=Math.ceil(a.memory.length/32),t=Math.ceil(a.bytecode.length/(32*16)),c=(p+E+S+t)*735e4;return{DataPages:S,CodeStackPages:p,UserStackPages:E,CodePages:t,MinimumFeeNQT:c.toString(10),ByteCode:a.bytecode,MachineCodeHashId:Ne(a.bytecode),ByteData:a.bytedata,Memory:a.memory.map(o=>o.name),Labels:a.labels,PName:a.PName,PDescription:a.PDescription,PActivationAmount:a.PActivationAmount}}function C(p){p.instructionValues.forEach(E=>{p.compiledInstruction+=O(E.value,E.type)}),a.bytecode+=p.compiledInstruction}function b(p){let E=-1,S="";for(let t=p.length-1;t>=0;t--)if(p[t].value!==0n){E=t;break}for(let t=0;t<=E;t++)S+=O(p[t].value,"L");return S}function O(p,E){let S=0,t="";switch(E){case"O":return p.toString(16).padStart(2,"0");case"B":return((256n+p)%256n).toString(16).padStart(2,"0");case"F":S=2;break;case"J":case"I":S=4;break;case"L":S=8}for(let c=0,o=256n;c<S;c++)t+=(p%o).toString(16).padStart(2,"0"),p=p/o;return t}return l()}var X=class{constructor(e){this.Program={Global:{APIFunctions:[],macros:[],sentences:[]},functions:[],memory:[],typesDefinitions:[],Config:{compilerVersion:"1.0",enableRandom:!1,enableLineLabels:!1,maxAuxVars:3,maxConstVars:0,optimizationLevel:2,reuseAssignedVar:!0,sourcecodeVersion:"",warningToError:!0,APIFunctions:!1,PName:"",PDescription:"",PActivationAmount:"",PUserStackPages:0,PCodeStackPages:0,outputSourceLineNumber:!1}};this.language=e.language,this.sourceCode=e.sourceCode}compile(){let e,r,a;if(this.MachineCode)return this;switch(this.language){case"C":e=te(this.sourceCode),r=le(e),a=ce(r),se(this.Program,a),de(this.Program),this.assemblyCode=$e(this.Program);break;case"Assembly":this.assemblyCode=this.sourceCode;break;default:throw new Error('Invalid usage. Language must be "C" or "Assembly".')}return this.MachineCode=Se(this.assemblyCode),this}getAssemblyCode(){if(!this.MachineCode)throw new Error("Source code was not compiled.");return this.assemblyCode??""}getMachineCode(){if(!this.MachineCode)throw new Error("Source code was not compiled.");return this.MachineCode}getCompilerVersion(){return this.Program.Config.compilerVersion}};function Ce(n){let e={divId:"asmCodeline",divClass:"asmLine",spanErrorClass:"asmError",spanLabelClass:"asmLabel",spanNumberClass:"asmNumber",spanCommentClass:"asmComment",spanVariableClass:"asmVariable",spanDirectiveClass:"asmDirective",spanInstructionClass:"asmInstruction"},r=[{opCode:240,size:0,regex:/^\s*$/},{opCode:241,size:0,regex:/^\s*(\w+):\s*$/},{opCode:242,size:0,regex:/^(\s*\^comment)(\s+.*)/},{opCode:243,size:0,regex:/^(\s*\^declare)(\s+\w+\s*)$/},{opCode:244,size:0,regex:/^(\s*\^const)(\s+.*)/},{opCode:245,size:0,regex:/^(\s*\^program\s+\w+\b)(.*)$/},{opCode:1,size:13,regex:/^(\s*SET\s+)(@\w+\s+)(#[\da-f]{16}\b\s*)$/},{opCode:2,size:9,regex:/^(\s*SET\s+)(@\w+\s+)(\$\w+\s*)$/},{opCode:3,size:5,regex:/^(\s*CLR\s+)(@\w+\s*)$/},{opCode:4,size:5,regex:/^(\s*INC\s+)(@\w+\s*)$/},{opCode:5,size:5,regex:/^(\s*DEC\s+)(@\w+\s*)$/},{opCode:6,size:9,regex:/^(\s*ADD\s+)(@\w+\s+)(\$\w+\s*)$/},{opCode:7,size:9,regex:/^(\s*SUB\s+)(@\w+\s+)(\$\w+\s*)$/},{opCode:8,size:9,regex:/^(\s*MUL\s+)(@\w+\s+)(\$\w+\s*)$/},{opCode:9,size:9,regex:/^(\s*DIV\s+)(@\w+\s+)(\$\w+\s*)$/},{opCode:10,size:9,regex:/^(\s*BOR\s+)(@\w+\s+)(\$\w+\s*)$/},{opCode:11,size:9,regex:/^(\s*AND\s+)(@\w+\s+)(\$\w+\s*)$/},{opCode:12,size:9,regex:/^(\s*XOR\s+)(@\w+\s+)(\$\w+\s*)$/},{opCode:13,size:5,regex:/^(\s*NOT\s+)(@\w+\s*)$/},{opCode:14,size:9,regex:/^(\s*SET\s+)(@\w+)(\s+\$\()(\$\w+)(\)\s*)$/},{opCode:15,size:13,regex:/^(\s*SET\s+)(@\w+\s+)(\$\()(\$\w+)(\s*\+\s*)(\$\w+)(\)\s*)$/},{opCode:16,size:5,regex:/^(\s*PSH\s+)(\$\w+\s*)$/},{opCode:17,size:5,regex:/^(\s*POP\s+)(@\w+\s*)$/},{opCode:18,size:5,regex:/^(\s*JSR\s+)(:\w+\s*)$/},{opCode:19,size:1,regex:/^\s*RET\s*$/},{opCode:20,size:9,regex:/^(\s*SET\s+)(@\()(\$\w+)(\)\s+)(\$\w+\s*)$/},{opCode:21,size:13,regex:/^(\s*SET\s+)(@\()(\$\w+)(\s*\+\s*)(\$\w+)(\)\s+)(\$\w+\s*)$/},{opCode:22,size:9,regex:/^(\s*MOD\s+)(@\w+\s+)(\$\w+\s*)$/},{opCode:23,size:9,regex:/^(\s*SHL\s+)(@\w+\s+)(\$\w+\s*)$/},{opCode:24,size:9,regex:/^(\s*SHR\s+)(@\w+\s+)(\$\w+\s*)$/},{opCode:26,size:5,regex:/^(\s*JMP\s+)(:\w+\s*)$/},{opCode:27,size:6,regex:/^(\s*BZR\s+)(\$\w+\s+)(:\w+\s*)$/},{opCode:30,size:6,regex:/^(\s*BNZ\s+)(\$\w+\s+)(:\w+\s*)$/},{opCode:31,size:10,regex:/^(\s*BGT\s+)(\$\w+\s+)(\$\w+\s+)(:\w+\s*)$/},{opCode:32,size:10,regex:/^(\s*BLT\s+)(\$\w+\s+)(\$\w+\s+)(:\w+\s*)$/},{opCode:33,size:10,regex:/^(\s*BGE\s+)(\$\w+\s+)(\$\w+\s+)(:\w+\s*)$/},{opCode:34,size:10,regex:/^(\s*BLE\s+)(\$\w+\s+)(\$\w+\s+)(:\w+\s*)$/},{opCode:35,size:10,regex:/^(\s*BEQ\s+)(\$\w+\s+)(\$\w+\s+)(:\w+\s*)$/},{opCode:36,size:10,regex:/^(\s*BNE\s+)(\$\w+\s+)(\$\w+\s+)(:\w+\s*)$/},{opCode:37,size:5,regex:/^(\s*SLP\s+)(\$\w+\s*)$/},{opCode:38,size:5,regex:/^(\s*FIZ\s+)(\$\w+\s*)$/},{opCode:39,size:5,regex:/^(\s*STZ\s+)(\$\w+\s*)$/},{opCode:40,size:1,regex:/^\s*FIN\s*$/},{opCode:41,size:1,regex:/^\s*STP\s*$/},{opCode:43,size:5,regex:/^(\s*ERR\s+)(:\w+\s*)$/},{opCode:48,size:1,regex:/^\s*PCS\s*$/},{opCode:50,size:3,regex:/^(\s*FUN\s+)(\w+\s*)$/},{opCode:51,size:7,regex:/^(\s*FUN\s+)(\w+\s+)(\$\w+\s*)$/},{opCode:52,size:11,regex:/^(\s*FUN\s+)(\w+\s+)(\$\w+\s+)(\$(\w+)\s*)$/},{opCode:53,size:7,regex:/^(\s*FUN\s+)(@\w+\s+)(\w+\s*)$/},{opCode:54,size:11,regex:/^\s*(FUN)\s+@(\w+)\s+(\w+)\s+\$(\w+)\s*$/},{opCode:55,size:15,regex:/^(\s*FUN\s+)(@\w+\s+)(\w+\s+)(\$\w+\s+)(\$\w+\s*)$/},{opCode:127,size:1,regex:/^\s*NOP\s*$/}],a=[{fnCode:256,fnName:"get_A1"},{fnCode:257,fnName:"get_A2"},{fnCode:258,fnName:"get_A3"},{fnCode:259,fnName:"get_A4"},{fnCode:260,fnName:"get_B1"},{fnCode:261,fnName:"get_B2"},{fnCode:262,fnName:"get_B3"},{fnCode:263,fnName:"get_B4"},{fnCode:272,fnName:"set_A1"},{fnCode:273,fnName:"set_A2"},{fnCode:274,fnName:"set_A3"},{fnCode:275,fnName:"set_A4"},{fnCode:276,fnName:"set_A1_A2"},{fnCode:277,fnName:"set_A3_A4"},{fnCode:278,fnName:"set_B1"},{fnCode:279,fnName:"set_B2"},{fnCode:280,fnName:"set_B3"},{fnCode:281,fnName:"set_B4"},{fnCode:282,fnName:"set_B1_B2"},{fnCode:283,fnName:"set_B3_B4"},{fnCode:288,fnName:"clear_A"},{fnCode:289,fnName:"clear_B"},{fnCode:290,fnName:"clear_A_B"},{fnCode:291,fnName:"copy_A_From_B"},{fnCode:292,fnName:"copy_B_From_A"},{fnCode:293,fnName:"check_A_Is_Zero"},{fnCode:294,fnName:"check_B_Is_Zero"},{fnCode:295,fnName:"check_A_equals_B"},{fnCode:296,fnName:"swap_A_and_B"},{fnCode:297,fnName:"OR_A_with_B"},{fnCode:298,fnName:"OR_B_with_A"},{fnCode:299,fnName:"AND_A_with_B"},{fnCode:300,fnName:"AND_B_with_A"},{fnCode:301,fnName:"XOR_A_with_B"},{fnCode:302,fnName:"XOR_B_with_A"},{fnCode:320,fnName:"add_A_to_B"},{fnCode:321,fnName:"add_B_to_A"},{fnCode:322,fnName:"sub_A_from_B"},{fnCode:323,fnName:"sub_B_from_A"},{fnCode:324,fnName:"mul_A_by_B"},{fnCode:325,fnName:"mul_B_by_A"},{fnCode:326,fnName:"div_A_by_B"},{fnCode:327,fnName:"div_B_by_A"},{fnCode:512,fnName:"MD5_A_to_B"},{fnCode:513,fnName:"check_MD5_A_with_B"},{fnCode:514,fnName:"HASH160_A_to_B"},{fnCode:515,fnName:"check_HASH160_A_with_B"},{fnCode:516,fnName:"SHA256_A_to_B"},{fnCode:517,fnName:"check_SHA256_A_with_B"},{fnCode:768,fnName:"get_Block_Timestamp"},{fnCode:769,fnName:"get_Creation_Timestamp"},{fnCode:770,fnName:"get_Last_Block_Timestamp"},{fnCode:771,fnName:"put_Last_Block_Hash_In_A"},{fnCode:772,fnName:"A_to_Tx_after_Timestamp"},{fnCode:773,fnName:"get_Type_for_Tx_in_A"},{fnCode:774,fnName:"get_Amount_for_Tx_in_A"},{fnCode:775,fnName:"get_Timestamp_for_Tx_in_A"},{fnCode:776,fnName:"get_Ticket_Id_for_Tx_in_A"},{fnCode:777,fnName:"message_from_Tx_in_A_to_B"},{fnCode:778,fnName:"B_to_Address_of_Tx_in_A"},{fnCode:779,fnName:"B_to_Address_of_Creator"},{fnCode:1024,fnName:"get_Current_Balance"},{fnCode:1025,fnName:"get_Previous_Balance"},{fnCode:1026,fnName:"send_to_Address_in_B"},{fnCode:1027,fnName:"send_All_to_Address_in_B"},{fnCode:1028,fnName:"send_Old_to_Address_in_B"},{fnCode:1029,fnName:"send_A_to_Address_in_B"},{fnCode:1030,fnName:"add_Minutes_to_Timestamp"}];function l(u,d=!0){let f=u.split(`
`),s="";return f.forEach((_,C)=>{d===!0&&(s+=`<div id='${e.divId}${C}' class='${e.divClass}'>`);let b=r.find(O=>O.regex.exec(_)!==null);s+=T(_,b),d===!0?s+="</div>":s+="<br>"}),s}function i(u,d){return`<span class='${d}'>${u}</span>`}function T(u,d){let f,s=null;if(d!==void 0&&(s=d.regex.exec(u)),s===null||d===void 0)return i(u,e.spanErrorClass);switch(d.opCode){case 240:return u;case 241:return i(s[0],e.spanLabelClass);case 242:return i(s[1],e.spanDirectiveClass)+i(s[2],e.spanCommentClass);case 243:return i(s[1],e.spanDirectiveClass)+i(s[2],e.spanVariableClass);case 244:{let _=r.find(C=>C.opCode===1);return i(s[1],e.spanDirectiveClass)+T(s[2],_)}case 245:return i(s[1],e.spanDirectiveClass)+s[2];case 1:return i(s[1],e.spanInstructionClass)+i(s[2],e.spanVariableClass)+i(s[3],e.spanNumberClass);case 2:case 6:case 7:case 8:case 9:case 10:case 11:case 12:case 22:case 23:case 24:return i(s[1],e.spanInstructionClass)+i(s[2],e.spanVariableClass)+i(s[3],e.spanVariableClass);case 3:case 4:case 5:case 13:case 16:case 17:case 37:case 38:case 39:return i(s[1],e.spanInstructionClass)+i(s[2],e.spanVariableClass);case 19:case 40:case 41:case 48:case 127:return i(s[0],e.spanInstructionClass);case 14:return i(s[1],e.spanInstructionClass)+i(s[2],e.spanVariableClass)+s[3]+i(s[4],e.spanVariableClass)+s[5];case 15:return i(s[1],e.spanInstructionClass)+i(s[2],e.spanVariableClass)+s[3]+i(s[4],e.spanVariableClass)+s[5]+i(s[6],e.spanVariableClass)+s[7];case 20:return i(s[1],e.spanInstructionClass)+s[2]+i(s[3],e.spanVariableClass)+s[4]+i(s[5],e.spanVariableClass);case 21:return i(s[1],e.spanInstructionClass)+s[2]+i(s[3],e.spanVariableClass)+s[4]+i(s[5],e.spanVariableClass)+s[6]+i(s[7],e.spanVariableClass);case 18:case 26:case 43:return i(s[1],e.spanInstructionClass)+i(s[2],e.spanLabelClass);case 27:case 30:return i(s[1],e.spanInstructionClass)+i(s[2],e.spanVariableClass)+i(s[3],e.spanLabelClass);case 31:case 32:case 33:case 34:case 35:case 36:return i(s[1],e.spanInstructionClass)+i(s[2],e.spanVariableClass)+i(s[3],e.spanVariableClass)+i(s[4],e.spanLabelClass);case 50:return f=s[2].trim(),a.findIndex(_=>_.fnName===f)===-1?i(s[1],e.spanInstructionClass)+i(s[2],e.spanErrorClass):i(s[0],e.spanInstructionClass);case 51:return f=s[2].trim(),a.findIndex(_=>_.fnName===f)===-1?i(s[1],e.spanInstructionClass)+i(s[2],e.spanErrorClass)+i(s[3],e.spanVariableClass):i(s[1]+s[2],e.spanInstructionClass)+i(s[3],e.spanVariableClass);case 52:return f=s[2].trim(),a.findIndex(_=>_.fnName===f)===-1?i(s[1],e.spanInstructionClass)+i(s[2],e.spanErrorClass)+i(s[3],e.spanVariableClass)+i(s[4],e.spanVariableClass):i(s[1]+s[2],e.spanInstructionClass)+i(s[3],e.spanVariableClass)+i(s[4],e.spanVariableClass);case 53:return f=s[3].trim(),a.findIndex(_=>_.fnName===f)===-1?i(s[1],e.spanInstructionClass)+i(s[2],e.spanVariableClass)+i(s[3],e.spanErrorClass):i(s[1],e.spanInstructionClass)+i(s[2],e.spanVariableClass)+i(s[3],e.spanInstructionClass);case 55:return f=s[3].trim(),a.findIndex(_=>_.fnName===f)===-1?i(s[1],e.spanInstructionClass)+i(s[2],e.spanVariableClass)+i(s[3],e.spanErrorClass)+i(s[4],e.spanVariableClass)+i(s[5],e.spanVariableClass):i(s[1],e.spanInstructionClass)+i(s[2],e.spanVariableClass)+i(s[3],e.spanInstructionClass)+i(s[4],e.spanVariableClass)+i(s[5],e.spanVariableClass);case 54:default:return i(u,e.spanErrorClass)}}return l(n,!1)}var he=[["Preprocessor error tests",null,"div"],[`#ifdef debug
long a; a++;`,!0,""],[`#else
long a; a++;`,!0,""],[`#endif
long a; a++;`,!0,""],[`#ifdef debug
#pragma maxAuxVars 1
#else
#pragma maxAuxVars 5
#else
#pragma maxAuxVars 7
#endif
long a; a++;`,!0,""],["Tokenizer error tests",null,"div"],["long a;/*asdf",!0,""],['long a="asdf;',!0,""],["long a='asdf;",!0,""],["long a; asm PSH $A;",!0,""],["long a; asm { PSH $A;",!0,""],["long a; struct { long b; }",!0,""],["long a; \xB2;",!0,""],["Something very wrong",!0,""],["Parser error tests",null,"div"],["long a; };",!0,""],["long a[ ;",!0,""],["void main ((void) { long a++; }",!0,""],["void main (void) { long a++;",!0,""],['long a = "TS-MPMZ-8CD9-HZMD-A7R1X";',!0,""],['long a = "TS-MPMZ-8CD9-HZMD-A9R2X";',!0,""],["Shaper error tests",null,"div"],["long a, b; test2() while (a) a++; long test2(void) { b++; return b; }",!0,""],["long a, b; test2() for (;;) a++; long test2(void) { b++; return b; }",!0,""],["long a, b; goto a; a++; a: b++;",!0,""],["long a, b; else a++; a: b++;",!0,""],["long a, b; do { a++; };",!0,""],["long a, b; do { a++; } long long;",!0,""],["long a, b; do { a++; } long (a);",!0,""],["long a, b; do { a++; } while (a) b++;",!0,""],["long a, b; break; b++;",!0,""],["long a, b; continue; b++;",!0,""],["long a, b; test(); void test() { c++; }",!0,""],["long a, b; test(b, a); void test(d++) { long c; c++; }",!0,""],["long a, b; test(b, a); void test(d) { long c; c++; }",!0,""],["long a, test_b; test(a); void test(long b) { long c; c++; }",!0,""],["syntaxProcessor error tests",null,"div"],["long a; sleep; a++;",!0,""],["long a; const ;",!0,""],["long a; goto; a++;",!0,""],["long a, b; halt 1; a++;",!0,""],["long a, b; break 1; a++;",!0,""],["long a, b; continue a; a++;",!0,""],["long a, b; 4++; a++;",!0,""],["long a, b; ++4; a++;",!0,""],["long a, b; test()++; a++;",!0,""],["Generator error tests",null,"div"],["long a, b; for a++;",!0,""],["long a; goto a; a++;",!0,""],["long a; return;",!0,""],["long b, a = 0; test();",!0,""],[`#include APIFunctions
long b, a = 0; test();`,!0,""],["long a = test()[4]; void test(void) {}",!0,""],["struct KOMBI { long driver, collector, passenger; } car; long carro; carro.driver=0;",!0,""],["struct KOMBI { long driver, collector, passenger; } car; car.nobody=0;",!0,""],["struct KOMBI { long driver, collector, passenger; } car; car->driver=0;",!0,""],["struct KOMBI { long driver, collector, passenger; } *car; car.driver=0;",!0,""],["long a, b; if (a, b) { a++;}",!0,""],["long a, b; a = b + test(); void test(void) { a++; }",!0,""],["struct KOMBI { long driver, collector[4]; } car; long *b; car.collector=b;",!0,""],["Arithmetic tests",null,"div"],["Void test;",null,"div"],["",!1,`^declare r0
^declare r1
^declare r2

FIN
`],[";",!1,`^declare r0
^declare r1
^declare r2

FIN
`],[";;;",!1,`^declare r0
^declare r1
^declare r2

FIN
`],["Assignment;",null,"div"],["long a, b; a=b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @a $b
FIN
`],["long a; a;",!1,`^declare r0
^declare r1
^declare r2
^declare a

FIN
`],["long a; a=;",!0,""],["long a; =a;",!0,""],["SetOperator;",null,"div"],["long a, b; a+=b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

ADD @a $b
FIN
`],["long b; +=b;",!0,""],["long a; a+=;",!0,""],["Constant;",null,"div"],["long a; a=2;",!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @a #0000000000000002
FIN
`],["2;",!1,`^declare r0
^declare r1
^declare r2

FIN
`],["long a; a=0xA;",!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @a #000000000000000a
FIN
`],["long a; a=0;",!1,`^declare r0
^declare r1
^declare r2
^declare a

CLR @a
FIN
`],["long a; a+=2;",!1,`^declare r0
^declare r1
^declare r2
^declare a

INC @a
INC @a
FIN
`],["long a; a+=0xfffffff;",!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 #000000000fffffff
ADD @a $r0
FIN
`],["long a; a='BURST-MKCL-2226-W6AH-7ARVS';",!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @a #5c6ee8000049c552
FIN
`],["long a; a='TS-MKCL-2226-W6AH-7ARVS';",!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @a #5c6ee8000049c552
FIN
`],["long a; a='S-MKCL-2226-W6AH-7ARVS';",!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @a #5c6ee8000049c552
FIN
`],["long a; a='';",!1,`^declare r0
^declare r1
^declare r2
^declare a

CLR @a
FIN
`],["long a; a=6660515985630020946;",!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @a #5c6ee8000049c552
FIN
`],["long a; a=18446744073709551615;",!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @a #ffffffffffffffff
FIN
`],["long a; a=18446744073709551616;",!0,""],["long a; a=18446744073709551617;",!0,""],["long a, b, c, d; a=5_0000_0000; b=5_0000_0000; c=0x00ff_00fe_7fff; d=0x00ff00fe7fff;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

SET @a #000000001dcd6500
SET @b #000000001dcd6500
SET @c #000000ff00fe7fff
SET @d #000000ff00fe7fff
FIN
`],['long a; a="Hi there";',!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @a #6572656874206948
FIN
`],['long a; a="Hi there big";',!0,""],["long a; 2=a;",!0,""],["Operator;",null,"div"],["long a, b, c; a=b/c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
DIV @a $c
FIN
`],["long a, b, c; a=b%c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
MOD @a $c
FIN
`],["long a, b, c; a=b<<c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
SHL @a $c
FIN
`],["long a, b, c; a=b>>c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
SHR @a $c
FIN
`],["long a, b, c; a=b|c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
BOR @a $c
FIN
`],["long a, b, c; a=b^c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
XOR @a $c
FIN
`],["UnaryOperator;",null,"div"],[`#pragma optimizationLevel 0
long a, b; a=!b;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BNZ $b :__NOT_1_sF
__NOT_1_sT:
SET @a #0000000000000001
JMP :__NOT_1_end
__NOT_1_sF:
CLR @a
__NOT_1_end:
FIN
`],["long a, b; a=~b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @a $b
NOT @a
FIN
`],["long a, b; a^=~b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @r0 $b
NOT @r0
XOR @a $r0
FIN
`],["long a, b; a=~0xff;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @a #00000000000000ff
NOT @a
FIN
`],["long a, b, c; a>>=b^~c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @r0 $c
NOT @r0
XOR @r0 $b
SHR @a $r0
FIN
`],["long a, b; a=~~b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @a $b
NOT @a
NOT @a
FIN
`],["long a, b, c; a=~b/c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
NOT @a
DIV @a $c
FIN
`],["long a, b, c; a=~b/~c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
NOT @a
SET @r0 $c
NOT @r0
DIV @a $r0
FIN
`],["long a, b, c; a=b/~c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @r0 $c
NOT @r0
SET @a $b
DIV @a $r0
FIN
`],["long a, b; ~a=b;",!0,""],["SetUnaryOperator;",null,"div"],["long a; a++;",!1,`^declare r0
^declare r1
^declare r2
^declare a

INC @a
FIN
`],["long a; a--;",!1,`^declare r0
^declare r1
^declare r2
^declare a

DEC @a
FIN
`],["long a; ++a;",!1,`^declare r0
^declare r1
^declare r2
^declare a

INC @a
FIN
`],["long a; --a;",!1,`^declare r0
^declare r1
^declare r2
^declare a

DEC @a
FIN
`],["long a, b, c; a=b++/c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
DIV @a $c
INC @b
FIN
`],["long a, b, c; a=--b/c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

DEC @b
SET @a $b
DIV @a $c
FIN
`],["long a, b, c; a=~--b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

DEC @b
SET @a $b
NOT @a
FIN
`],["long a, b, c; a+=~b++;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @r0 $b
NOT @r0
ADD @a $r0
INC @b
FIN
`],["long a, b, c; a=~b++;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
NOT @a
INC @b
FIN
`],["long a; a++=2;",!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @a #0000000000000002
INC @a
FIN
`],["long a; a=2++;",!0,""],["--;",!0,""],["2++;",!0,""],["long a, b, c; a=b- -c;",!0,""],["CheckOperator Unary;",null,"div"],["long a, b; a=b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @a $b
FIN
`],["long a, b; a+=-b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

CLR @r0
SUB @r0 $b
ADD @a $r0
FIN
`],["long a, b; a=-b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

CLR @a
SUB @a $b
FIN
`],["long a, b, c; a=b/-c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

CLR @r0
SUB @r0 $c
SET @a $b
DIV @a $r0
FIN
`],["long a, b, c; a=-b/c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

CLR @a
SUB @a $b
DIV @a $c
FIN
`],["long a, b; a=-2;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @a #fffffffffffffffe
FIN
`],["long a, b; a=-~b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @r0 $b
NOT @r0
CLR @a
SUB @a $r0
FIN
`],["long a, b; a=~-b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

CLR @a
SUB @a $b
NOT @a
FIN
`],["long a, b; a=-b-- ;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

CLR @a
SUB @a $b
DEC @b
FIN
`],["long a, b; a=---b;",!0,""],["long a, b; a=+b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @a $b
FIN
`],["long a, b, c; a=b/+c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
DIV @a $c
FIN
`],["long a, b, c; a=+b/-c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

CLR @r0
SUB @r0 $c
SET @a $b
DIV @a $r0
FIN
`],["long a, b, c; a=+b/+c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
DIV @a $c
FIN
`],["long a; a=+2;",!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @a #0000000000000002
FIN
`],["long a; a-=+~2;",!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 #0000000000000002
NOT @r0
SUB @a $r0
FIN
`],["long a; a=~+2;",!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @a #0000000000000002
NOT @a
FIN
`],["long a; a=+;",!0,""],["long *a, b; a=&b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @a #0000000000000004
FIN
`],["long a, *b; a=*b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @a $($b)
FIN
`],["long *a, b; *a=b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @($a) $b
FIN
`],["long a, *b; a=*b/5;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @a $($b)
SET @r0 #0000000000000005
DIV @a $r0
FIN
`],["long a, *b; a=5/ *b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @a #0000000000000005
SET @r0 $($b)
DIV @a $r0
FIN
`],["long a, *b; a*=*b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @r0 $($b)
MUL @a $r0
FIN
`],["long a, *b, *c; a=*b<<*c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $($b)
SET @r0 $($c)
SHL @a $r0
FIN
`],["long a, *b; a=~*b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @a $($b)
NOT @a
FIN
`],["long a, *b; a=-*b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

CLR @a
SET @r0 $($b)
SUB @a $r0
FIN
`],["long a, *b; a=*--b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

DEC @b
SET @a $($b)
FIN
`],["long a, *b; a=*b--;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @a $($b)
DEC @b
FIN
`],["long a, b; a=*~b;",!0,""],["long a, b; a=++*b;",!0,""],["long a, b; a=**b;",!0,""],["CheckOperator Binary;",null,"div"],["long a, b, c; a=b+c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
ADD @a $c
FIN
`],["long a, b, c; a=b-c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
SUB @a $c
FIN
`],["long a, b, c; a=b*c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
MUL @a $c
FIN
`],["long a, b, c; a=b&c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
AND @a $c
FIN
`],["long a, b, c; a-=b+c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @r0 $b
ADD @r0 $c
SUB @a $r0
FIN
`],["long a, b, c; a=b-2;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
SET @r0 #0000000000000002
SUB @a $r0
FIN
`],['long a, b; a="0"+b;',!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @a #0000000000000030
ADD @a $b
FIN
`],["long a, b; a=2*b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @a #0000000000000002
MUL @a $b
FIN
`],["long a, b, c; a<<=b*-c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

CLR @r0
SUB @r0 $c
MUL @r0 $b
SHL @a $r0
FIN
`],["long a, b, c; a^=~b&c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @r0 $b
NOT @r0
AND @r0 $c
XOR @a $r0
FIN
`],["long a, b, c; a^=b&~c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @r0 $c
NOT @r0
AND @r0 $b
XOR @a $r0
FIN
`],["long a, b, c; a^=-b&-c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

CLR @r0
SUB @r0 $b
CLR @r1
SUB @r1 $c
AND @r0 $r1
XOR @a $r0
FIN
`],["long a, b, c; a=b&~0xff;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a #00000000000000ff
NOT @a
AND @a $b
FIN
`],["long a, b, c; a=~0x7fb&~0xff;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a #00000000000007fb
NOT @a
SET @r0 #00000000000000ff
NOT @r0
AND @a $r0
FIN
`],["long a, b, c; a>>=b-~c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @r0 $c
NOT @r0
SET @r1 $b
SUB @r1 $r0
SHR @a $r1
FIN
`],["long a, b, c; a=b++-c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
SUB @a $c
INC @b
FIN
`],["long a, b, c; a=--b&c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

DEC @b
SET @a $b
AND @a $c
FIN
`],["long a, b, c; a+=-b+c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

CLR @r0
SUB @r0 $b
ADD @r0 $c
ADD @a $r0
FIN
`],["long a, b, *c; a=-b**c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

CLR @a
SUB @a $b
SET @r0 $($c)
MUL @a $r0
FIN
`],["long a, b, c; a=b*-2;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a #fffffffffffffffe
MUL @a $b
FIN
`],["long a, b, c; a=-2&~b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
NOT @a
SET @r0 #fffffffffffffffe
AND @a $r0
FIN
`],["long a, b, c; a=b&~-c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

CLR @a
SUB @a $c
NOT @a
AND @a $b
FIN
`],["long a, b, c; a=~-b&c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

CLR @a
SUB @a $b
NOT @a
AND @a $c
FIN
`],["long a, b, c; a=b*-c--;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

CLR @a
SUB @a $c
MUL @a $b
DEC @c
FIN
`],["long a, b, c; a=-b--*c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

CLR @a
SUB @a $b
MUL @a $c
DEC @b
FIN
`],["long a, b, c; a/=b*-c--;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

CLR @r0
SUB @r0 $c
MUL @r0 $b
DIV @a $r0
DEC @c
FIN
`],["long a, b, c; a+b=c;",!0,""],["long a, b, c; a-b=c;",!0,""],["long a, b, c; a*b=c;",!0,""],["long a, b, c; a&b=c;",!0,""],["long a, b, c; a=b*/c;",!0,""],["Delimiter;",null,"div"],["long a, b, c, d; a=b,c=d;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

SET @a $b
SET @c $d
FIN
`],["long a, b; a,b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

FIN
`],["long a, b, c, d, e, f; a=b,c=d,e=f;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e
^declare f

SET @a $b
SET @c $d
SET @e $f
FIN
`],["long a, b, c, d, e, f; a=b++,c=b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e
^declare f

SET @a $b
INC @b
SET @c $b
FIN
`],["long a, b, c, d, e, f; a=b++,c=b++,d=b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e
^declare f

SET @a $b
INC @b
SET @c $b
INC @b
SET @d $b
FIN
`],["long a; a+=1/2,a=2/2,a+=3/2,a=4/2;",!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @a #0000000000000001
INC @a
SET @a #0000000000000002
FIN
`],[",;",!0,""],[",,,,;",!0,""],["long a, b, c, d; a=b,,c=d;",!0,""],["long a, b; a=,b;",!0,""],["CodeCave;",null,"div"],["long a, b; a=(b);",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @a $b
FIN
`],["long a, b; a*=(b);",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

MUL @a $b
FIN
`],["long a; a=(2);",!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @a #0000000000000002
FIN
`],["long a, *b, c, d; a=*(b);",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

SET @a $($b)
FIN
`],["long a, *b, c, d; a=*(b+c);",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

SET @a $b
ADD @a $c
SET @a $($a)
FIN
`],["long a, b, *c, d; a=*(b+c);",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

SET @a $b
ADD @a $c
SET @a $($a)
FIN
`],["long a, b, *c, d; a=*(5+c);",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

SET @a #0000000000000005
ADD @a $c
SET @a $($a)
FIN
`],["long *a, b, c, d; *(a+1)=b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

SET @r0 $a
INC @r0
SET @($r0) $b
FIN
`],["long a, b, c, d; a=(b*c)*d;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

SET @a $b
MUL @a $c
MUL @a $d
FIN
`],["long a, b, c, d; a=(b/c)/d;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

SET @a $b
DIV @a $c
DIV @a $d
FIN
`],["long a, b, c, d; a=~(0xFF<<8);",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

SET @a #00000000000000ff
SET @r0 #0000000000000008
SHL @a $r0
NOT @a
FIN
`],["long a, b, c, d; a=~(b/c)/d;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

SET @a $b
DIV @a $c
NOT @a
DIV @a $d
FIN
`],["long a, b, c, d; a=(b/c)/~d;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

SET @a $b
DIV @a $c
SET @r0 $d
NOT @r0
DIV @a $r0
FIN
`],["long a, b, c, d; a=~(b/c/d);",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

SET @a $b
DIV @a $c
DIV @a $d
NOT @a
FIN
`],["long a, b, c, d, e; a=(b+c)*(d+e);",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e

SET @a $b
ADD @a $c
SET @r0 $d
ADD @r0 $e
MUL @a $r0
FIN
`],["long a, b, c, d, e; a=(b+c)/(d+e);",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e

SET @a $b
ADD @a $c
SET @r0 $d
ADD @r0 $e
DIV @a $r0
FIN
`],["long a, b, c, d, e; a%=1-((b+c)*(d+e));",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e

SET @r0 $b
ADD @r0 $c
SET @r1 $d
ADD @r1 $e
MUL @r0 $r1
SET @r1 #0000000000000001
SUB @r1 $r0
MOD @a $r1
FIN
`],["long a, b, c, d; a=--(b);",!0,""],["long a, b, c, d; a=(b+c)++;",!0,""],["long a, b, c, d; a=(b)[c];",!0,""],["long a, b, c, d; *(a+1)=b;",!0,""],["long a, b, c, d; *(a+c)=b;",!0,""],["long a, b, c, d; a=*(b+1);",!0,""],["long a, b, c, d; a=*(b+c);",!0,""],["Arithmetic + comparisions;",null,"div"],[`#pragma optimizationLevel 0
long a, b, z; z=a==b;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare z

BNE $a $b :__CMP_1_sF
__CMP_1_sT:
SET @z #0000000000000001
JMP :__CMP_1_end
__CMP_1_sF:
CLR @z
__CMP_1_end:
FIN
`],[`#pragma optimizationLevel 0
long a, b, z; z=a!=b;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare z

BEQ $a $b :__CMP_1_sF
__CMP_1_sT:
SET @z #0000000000000001
JMP :__CMP_1_end
__CMP_1_sF:
CLR @z
__CMP_1_end:
FIN
`],[`#pragma optimizationLevel 0
long a, b, z; z=2<=b;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare z

SET @z #0000000000000002
BGT $z $b :__CMP_1_sF
__CMP_1_sT:
SET @z #0000000000000001
JMP :__CMP_1_end
__CMP_1_sF:
CLR @z
__CMP_1_end:
FIN
`],[`#pragma optimizationLevel 0
long a, b, z; z=a<2;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare z

SET @z #0000000000000002
BGE $a $z :__CMP_1_sF
__CMP_1_sT:
SET @z #0000000000000001
JMP :__CMP_1_end
__CMP_1_sF:
CLR @z
__CMP_1_end:
FIN
`],[`#pragma optimizationLevel 0
long a, b, z; z=a>=b;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare z

BLT $a $b :__CMP_1_sF
__CMP_1_sT:
SET @z #0000000000000001
JMP :__CMP_1_end
__CMP_1_sF:
CLR @z
__CMP_1_end:
FIN
`],[`#pragma optimizationLevel 0
long a, b, z; z=a>b;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare z

BLE $a $b :__CMP_1_sF
__CMP_1_sT:
SET @z #0000000000000001
JMP :__CMP_1_end
__CMP_1_sF:
CLR @z
__CMP_1_end:
FIN
`],[`#pragma optimizationLevel 0
long a, b, z; z=!a;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare z

BNZ $a :__NOT_1_sF
__NOT_1_sT:
SET @z #0000000000000001
JMP :__NOT_1_end
__NOT_1_sF:
CLR @z
__NOT_1_end:
FIN
`],[`#pragma optimizationLevel 0
long a, b, z; z=!!a;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare z

BZR $a :__NOT_1_sF
__NOT_1_sT:
SET @z #0000000000000001
JMP :__NOT_1_end
__NOT_1_sF:
CLR @z
__NOT_1_end:
FIN
`],[`#pragma optimizationLevel 0
long a, b, z; z=a&&b;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare z

BZR $a :__CMP_1_sF
__AND_2_next:
BZR $b :__CMP_1_sF
JMP :__CMP_1_sT
__CMP_1_sT:
SET @z #0000000000000001
JMP :__CMP_1_end
__CMP_1_sF:
CLR @z
__CMP_1_end:
FIN
`],[`#pragma optimizationLevel 0
long a, b, z; z=a||b;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare z

BNZ $a :__CMP_1_sT
__OR_2_next:
BNZ $b :__CMP_1_sT
JMP :__CMP_1_sF
__CMP_1_sF:
CLR @z
JMP :__CMP_1_end
__CMP_1_sT:
SET @z #0000000000000001
__CMP_1_end:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c; a=2+b==c;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
INC @a
INC @a
BNE $a $c :__CMP_1_sF
__CMP_1_sT:
SET @a #0000000000000001
JMP :__CMP_1_end
__CMP_1_sF:
CLR @a
__CMP_1_end:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c; a=2+(b==c);`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

BNE $b $c :__CMP_1_sF
__CMP_1_sT:
SET @a #0000000000000001
JMP :__CMP_1_end
__CMP_1_sF:
CLR @a
__CMP_1_end:
INC @a
INC @a
FIN
`],[`#pragma optimizationLevel 0
long a, b, c; a=b==~c;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $c
NOT @a
BNE $b $a :__CMP_1_sF
__CMP_1_sT:
SET @a #0000000000000001
JMP :__CMP_1_end
__CMP_1_sF:
CLR @a
__CMP_1_end:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c; a=b==!c;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

BNZ $c :__NOT_2_sF
__NOT_2_sT:
SET @a #0000000000000001
JMP :__NOT_2_end
__NOT_2_sF:
CLR @a
__NOT_2_end:
BNE $b $a :__CMP_1_sF
__CMP_1_sT:
SET @a #0000000000000001
JMP :__CMP_1_end
__CMP_1_sF:
CLR @a
__CMP_1_end:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c; a=!b==c;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

BNZ $b :__NOT_2_sF
__NOT_2_sT:
SET @a #0000000000000001
JMP :__NOT_2_end
__NOT_2_sF:
CLR @a
__NOT_2_end:
BNE $a $c :__CMP_1_sF
__CMP_1_sT:
SET @a #0000000000000001
JMP :__CMP_1_end
__CMP_1_sF:
CLR @a
__CMP_1_end:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c; a=!b==!c;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

BNZ $b :__NOT_2_sF
__NOT_2_sT:
SET @a #0000000000000001
JMP :__NOT_2_end
__NOT_2_sF:
CLR @a
__NOT_2_end:
BNZ $c :__NOT_3_sF
__NOT_3_sT:
SET @r0 #0000000000000001
JMP :__NOT_3_end
__NOT_3_sF:
CLR @r0
__NOT_3_end:
BNE $a $r0 :__CMP_1_sF
__CMP_1_sT:
SET @a #0000000000000001
JMP :__CMP_1_end
__CMP_1_sF:
CLR @a
__CMP_1_end:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c; a=!(b+c);`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @a $b
ADD @a $c
BNZ $a :__NOT_1_sF
__NOT_1_sT:
SET @a #0000000000000001
JMP :__NOT_1_end
__NOT_1_sF:
CLR @a
__NOT_1_end:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c; a=!(b==c);`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

BEQ $b $c :__NOT_1_sF
__NOT_1_sT:
SET @a #0000000000000001
JMP :__NOT_1_end
__NOT_1_sF:
CLR @a
__NOT_1_end:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d; a=!(b==c)==d;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

BEQ $b $c :__NOT_2_sF
__NOT_2_sT:
SET @a #0000000000000001
JMP :__NOT_2_end
__NOT_2_sF:
CLR @a
__NOT_2_end:
BNE $a $d :__CMP_1_sF
__CMP_1_sT:
SET @a #0000000000000001
JMP :__CMP_1_end
__CMP_1_sF:
CLR @a
__CMP_1_end:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d, z; z=1+((a&&b)||(c&&d));`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare z

BZR $a :__OR_2_next
__AND_3_next:
BZR $b :__OR_2_next
JMP :__CMP_1_sT
__OR_2_next:
BZR $c :__CMP_1_sF
__AND_4_next:
BZR $d :__CMP_1_sF
JMP :__CMP_1_sT
JMP :__CMP_1_sF
__CMP_1_sF:
CLR @z
JMP :__CMP_1_end
__CMP_1_sT:
SET @z #0000000000000001
__CMP_1_end:
INC @z
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d, z; z=1+!((a&&b)||(c&&d));`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare z

BZR $a :__OR_2_next
__AND_3_next:
BZR $b :__OR_2_next
JMP :__NOT_1_sF
__OR_2_next:
BZR $c :__NOT_1_sT
__AND_4_next:
BZR $d :__NOT_1_sT
JMP :__NOT_1_sF
JMP :__NOT_1_sT
__NOT_1_sT:
SET @z #0000000000000001
JMP :__NOT_1_end
__NOT_1_sF:
CLR @z
__NOT_1_end:
INC @z
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d; a=b+(++c==d++);`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

INC @c
BNE $c $d :__CMP_1_sF
__CMP_1_sT:
SET @a #0000000000000001
JMP :__CMP_1_end
__CMP_1_sF:
CLR @a
__CMP_1_end:
ADD @a $b
INC @d
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d; a=b+(++c&&d++);`,!0,""],[`#pragma optimizationLevel 0
long a, b, c, d, z; z=1+((a||b)&&(c||d));`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare z

BNZ $a :__AND_2_next
__OR_3_next:
BNZ $b :__AND_2_next
JMP :__CMP_1_sF
__AND_2_next:
BNZ $c :__CMP_1_sT
__OR_4_next:
BNZ $d :__CMP_1_sT
JMP :__CMP_1_sF
JMP :__CMP_1_sT
__CMP_1_sT:
SET @z #0000000000000001
JMP :__CMP_1_end
__CMP_1_sF:
CLR @z
__CMP_1_end:
INC @z
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d, z; z=1+!((a||b)&&(c||d));`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare z

BNZ $a :__AND_2_next
__OR_3_next:
BNZ $b :__AND_2_next
JMP :__NOT_1_sT
__AND_2_next:
BNZ $c :__NOT_1_sF
__OR_4_next:
BNZ $d :__NOT_1_sF
JMP :__NOT_1_sT
JMP :__NOT_1_sF
__NOT_1_sT:
SET @z #0000000000000001
JMP :__NOT_1_end
__NOT_1_sF:
CLR @z
__NOT_1_end:
INC @z
FIN
`],["long a, b; a==b;",!0,""],["long a, b; a!=b;",!0,""],["long b; 2<=b;",!0,""],["long a; a<2;",!0,""],["long a, b; a>=b;",!0,""],["long a, b; a>b;",!0,""],["long a; !a;",!0,""],["long a, b; a&&b;",!0,""],["long a, b; a||b;",!0,""],["Optimizations;",null,"div"],["long a, b; a=b/a;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @r0 $b
DIV @r0 $a
SET @a $r0
FIN
`],["long a, b, c; a=1+(b/(c/a));",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @r0 $c
DIV @r0 $a
SET @r1 $b
DIV @r1 $r0
INC @r1
SET @a $r1
FIN
`],["MISC;",null,"div"],["long a, *b; a=~-*b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

CLR @a
SET @r0 $($b)
SUB @a $r0
NOT @a
FIN
`],["long a, *b; a=~-~-*b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

CLR @r0
SET @a $($b)
SUB @r0 $a
NOT @r0
CLR @a
SUB @a $r0
NOT @a
FIN
`],["long a, *b; a=~-~-*b+1;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

CLR @r0
SET @a $($b)
SUB @r0 $a
NOT @r0
CLR @a
SUB @a $r0
NOT @a
INC @a
FIN
`],["long a, b, c, d, e; a=b+c/d-e;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e

SET @a $c
DIV @a $d
ADD @a $b
SUB @a $e
FIN
`],["long a, b, c, d, e; a=b<<c+d<<e;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e

SET @r0 $c
ADD @r0 $d
SET @a $b
SHL @a $r0
SHL @a $e
FIN
`],["long a, b, c, d, e; a=b&c<<d^e;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e

SET @a $c
SHL @a $d
AND @a $b
XOR @a $e
FIN
`],["long *a, b, c; *(a+1)=b; *(a+30)=b; *(a+c)=b; b=*(a+1); b=*(a+30); b=*(a+c);",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @r0 $a
INC @r0
SET @($r0) $b
SET @r0 #000000000000001e
ADD @r0 $a
SET @($r0) $b
SET @r0 $a
ADD @r0 $c
SET @($r0) $b
SET @b $a
INC @b
SET @b $($b)
SET @b #000000000000001e
ADD @b $a
SET @b $($b)
SET @b $a
ADD @b $c
SET @b $($b)
FIN
`],["long a, b, c; a=b%(1+*b[c]);",!0,""],["Error tests;",null,"div"],["long a, b; a|b;",!0,""],["long a, b; a|b=c;",!0,""],["long a, b; a/b;",!0,""],["long a, b; -a=b;",!0,""],["long a, b; +a=b;",!0,""],["long a, b; &a=b;",!0,""],["&;",!0,""],["+;",!0,""],["=;",!0,""],["<=b;",!0,""],["/;",!0,""],["long a, b; /a;",!0,""],["Logical tests",null,"div"],["Void test",null,"div"],["if () { a++; }",!0,""],["One Operation) { a++; }",null,"div"],[`#pragma optimizationLevel 0
long a; if (a) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

BZR $a :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (0) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

JMP :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (1) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (10) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (a/2) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 $a
SET @r1 #0000000000000002
DIV @r0 $r1
BZR $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (a%2) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 $a
SET @r1 #0000000000000002
MOD @r0 $r1
BZR $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (a<<2) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 $a
SET @r1 #0000000000000002
SHL @r0 $r1
BZR $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (a>>2) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 $a
SET @r1 #0000000000000002
SHR @r0 $r1
BZR $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (a|2) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 #0000000000000002
BOR @r0 $a
BZR $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (a^2) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 #0000000000000002
XOR @r0 $a
BZR $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (!a) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

BNZ $a :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (~a) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 $a
NOT @r0
BZR $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (++a) { a++; }`,!0,""],[`#pragma optimizationLevel 0
long a; if (a++) { a++; }`,!0,""],[`#pragma optimizationLevel 0
long a; if (a=b) { a++; }`,!0,""],[`#pragma optimizationLevel 0
long a; if (a+=b) { a++; }`,!0,""],[`#pragma optimizationLevel 0
long a, b; if (a==b) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BNE $a $b :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (a!=b) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BEQ $a $b :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (a>=b) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BLT $a $b :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (a>b) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BLE $a $b :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (a<=b) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BGT $a $b :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (a<b) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BGE $a $b :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (a==0) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BNZ $a :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (a!=0) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BZR $a :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (a&&b) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BZR $a :__if1_endif
__AND_2_next:
BZR $b :__if1_endif
JMP :__if1_start
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (a||b) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BNZ $a :__if1_start
__OR_2_next:
BNZ $b :__if1_start
JMP :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d; if (a==b&&c==d) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

BNE $a $b :__if1_endif
__AND_2_next:
BNE $c $d :__if1_endif
JMP :__if1_start
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d; if (a==b||c==d) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

BEQ $a $b :__if1_start
__OR_2_next:
BEQ $c $d :__if1_start
JMP :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long *a, b; if (a[b]) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @r0 $($a + $b)
BZR $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a[2], b; if (a[b]) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare b

SET @r0 $($a + $b)
BZR $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (+a) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

BZR $a :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long *a; if (*a) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 $($a)
BZR $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (-a) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

CLR @r0
SUB @r0 $a
BZR $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (~a) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 $a
NOT @r0
BZR $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (&a) { a++; }`,!0,""],[`#pragma optimizationLevel 0
long a, b; if (b+a) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @r0 $b
ADD @r0 $a
BZR $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (b*a) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @r0 $b
MUL @r0 $a
BZR $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (b-a) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @r0 $b
SUB @r0 $a
BZR $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (b&a) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @r0 $b
AND @r0 $a
BZR $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],["long a; if (,) { a++; }",!0,""],["long a; if (a,) { a++; }",!0,""],["Combinations with NOT) { a++; }",null,"div"],[`#pragma optimizationLevel 0
long a; if (!a) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

BNZ $a :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (!0) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (!1) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

JMP :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (!10) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

JMP :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (!(a/2)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 $a
SET @r1 #0000000000000002
DIV @r0 $r1
BNZ $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (!(a%2)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 $a
SET @r1 #0000000000000002
MOD @r0 $r1
BNZ $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (!(a<<2)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 $a
SET @r1 #0000000000000002
SHL @r0 $r1
BNZ $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (!(a>>2)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 $a
SET @r1 #0000000000000002
SHR @r0 $r1
BNZ $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (!(a|2)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 #0000000000000002
BOR @r0 $a
BNZ $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (!(a^2)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 #0000000000000002
XOR @r0 $a
BNZ $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (!!a) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

BZR $a :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (!~a) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 $a
NOT @r0
BNZ $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (!(a==b)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BEQ $a $b :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (!(a!=b)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BNE $a $b :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (!(a>=b)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BGE $a $b :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (!(a>b)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BGT $a $b :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (!(a<=b)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BLE $a $b :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (!(a<b)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BLT $a $b :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (!(a==0)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BZR $a :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (!(a!=0)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BNZ $a :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (!(a&&b)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BZR $a :__if1_start
__AND_2_next:
BZR $b :__if1_start
JMP :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (!(a||b)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BNZ $a :__if1_endif
__OR_2_next:
BNZ $b :__if1_endif
JMP :__if1_start
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d; if (!(a==b&&c==d)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

BNE $a $b :__if1_start
__AND_2_next:
BNE $c $d :__if1_start
JMP :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d; if (!(a==b||c==d)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

BEQ $a $b :__if1_endif
__OR_2_next:
BEQ $c $d :__if1_endif
JMP :__if1_start
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long *a, b; if (!a[b]) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @r0 $($a + $b)
BNZ $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a[2], b; if (!a[b]) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare b

SET @r0 $($a + $b)
BNZ $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (!(+a)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

BNZ $a :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long *a; if (!(*a)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 $($a)
BNZ $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (!(-a)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

CLR @r0
SUB @r0 $a
BNZ $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (!(~a)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 $a
NOT @r0
BNZ $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a; if (!(&a)) { a++; }`,!0,""],[`#pragma optimizationLevel 0
long a, b; if (!(b+a)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @r0 $b
ADD @r0 $a
BNZ $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (!(b*a)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @r0 $b
MUL @r0 $a
BNZ $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (!(b-a)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @r0 $b
SUB @r0 $a
BNZ $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (!(b&a)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @r0 $b
AND @r0 $a
BNZ $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
Misc combinations) { a++; }`,null,"div"],[`#pragma optimizationLevel 0
long a, b, c, d; if (a==b&&!(c==d)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

BNE $a $b :__if1_endif
__AND_2_next:
BEQ $c $d :__if1_endif
JMP :__if1_start
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d; if (!(a==b)&&c==d) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

BEQ $a $b :__if1_endif
__AND_2_next:
BNE $c $d :__if1_endif
JMP :__if1_start
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d; if (a==b==c) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

BNE $a $b :__CMP_2_sF
__CMP_2_sT:
SET @r0 #0000000000000001
JMP :__CMP_2_end
__CMP_2_sF:
CLR @r0
__CMP_2_end:
BNE $r0 $c :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d; if ((a==b)==c) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

BNE $a $b :__CMP_2_sF
__CMP_2_sT:
SET @r0 #0000000000000001
JMP :__CMP_2_end
__CMP_2_sF:
CLR @r0
__CMP_2_end:
BNE $r0 $c :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d, e, f, g, h; if (a==b&&c==d&&e==f&&g==h) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e
^declare f
^declare g
^declare h

BNE $a $b :__if1_endif
__AND_4_next:
BNE $c $d :__if1_endif
JMP :__AND_3_next
__AND_3_next:
BNE $e $f :__if1_endif
JMP :__AND_2_next
__AND_2_next:
BNE $g $h :__if1_endif
JMP :__if1_start
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d, e, f, g, h; if (a==b||c==d||e==f||g==h) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e
^declare f
^declare g
^declare h

BEQ $a $b :__if1_start
__OR_4_next:
BEQ $c $d :__if1_start
JMP :__OR_3_next
__OR_3_next:
BEQ $e $f :__if1_start
JMP :__OR_2_next
__OR_2_next:
BEQ $g $h :__if1_start
JMP :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d, e, f, g, h; if ((a==b||c==d)&&(e==f||g==h)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e
^declare f
^declare g
^declare h

BEQ $a $b :__AND_2_next
__OR_3_next:
BEQ $c $d :__AND_2_next
JMP :__if1_endif
__AND_2_next:
BEQ $e $f :__if1_start
__OR_4_next:
BEQ $g $h :__if1_start
JMP :__if1_endif
JMP :__if1_start
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d, e, f, g, h; if ((a==b && c==d) || (e==f && g==h)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e
^declare f
^declare g
^declare h

BNE $a $b :__OR_2_next
__AND_3_next:
BNE $c $d :__OR_2_next
JMP :__if1_start
__OR_2_next:
BNE $e $f :__if1_endif
__AND_4_next:
BNE $g $h :__if1_endif
JMP :__if1_start
JMP :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d, e, f, g, h; if ((a>=b && c>=d) || (e!=f && g!=h)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e
^declare f
^declare g
^declare h

BLT $a $b :__OR_2_next
__AND_3_next:
BLT $c $d :__OR_2_next
JMP :__if1_start
__OR_2_next:
BEQ $e $f :__if1_endif
__AND_4_next:
BEQ $g $h :__if1_endif
JMP :__if1_start
JMP :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d, e, f, g, h; if ((a>=b&&c>=d)||!(e==f&&g==h)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e
^declare f
^declare g
^declare h

BLT $a $b :__OR_2_next
__AND_3_next:
BLT $c $d :__OR_2_next
JMP :__if1_start
__OR_2_next:
BNE $e $f :__if1_start
__AND_4_next:
BNE $g $h :__if1_start
JMP :__if1_endif
JMP :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d, e, f, g, h; if ((a<=b||c<d)&&!(e==f||g==h)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e
^declare f
^declare g
^declare h

BLE $a $b :__AND_2_next
__OR_3_next:
BLT $c $d :__AND_2_next
JMP :__if1_endif
__AND_2_next:
BEQ $e $f :__if1_endif
__OR_4_next:
BEQ $g $h :__if1_endif
JMP :__if1_start
JMP :__if1_start
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d, e, f, g, h; if (!(a<=b||c<d)&&(e==f||g==h)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e
^declare f
^declare g
^declare h

BLE $a $b :__if1_endif
__OR_3_next:
BLT $c $d :__if1_endif
JMP :__AND_2_next
__AND_2_next:
BEQ $e $f :__if1_start
__OR_4_next:
BEQ $g $h :__if1_start
JMP :__if1_endif
JMP :__if1_start
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (a==~-b) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

CLR @r0
SUB @r0 $b
NOT @r0
BNE $a $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (a==!~-b) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

CLR @r0
SUB @r0 $b
NOT @r0
BNZ $r0 :__NOT_2_sF
__NOT_2_sT:
SET @r0 #0000000000000001
JMP :__NOT_2_end
__NOT_2_sF:
CLR @r0
__NOT_2_end:
BNE $a $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d, e; if (a||(b&&c&&d)||e) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e

BNZ $a :__if1_start
__OR_3_next:
BZR $b :__OR_2_next
__AND_5_next:
BZR $c :__OR_2_next
JMP :__AND_4_next
__AND_4_next:
BZR $d :__OR_2_next
JMP :__if1_start
JMP :__OR_2_next
__OR_2_next:
BNZ $e :__if1_start
JMP :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d, e; if (a&&(b||c||d)&&e) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e

BZR $a :__if1_endif
__AND_3_next:
BNZ $b :__AND_2_next
__OR_5_next:
BNZ $c :__AND_2_next
JMP :__OR_4_next
__OR_4_next:
BNZ $d :__AND_2_next
JMP :__if1_endif
JMP :__AND_2_next
__AND_2_next:
BZR $e :__if1_endif
JMP :__if1_start
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d, e; if (a||(b&&!c&&d)||e) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e

BNZ $a :__if1_start
__OR_3_next:
BZR $b :__OR_2_next
__AND_5_next:
BNZ $c :__OR_2_next
JMP :__AND_4_next
__AND_4_next:
BZR $d :__OR_2_next
JMP :__if1_start
JMP :__OR_2_next
__OR_2_next:
BNZ $e :__if1_start
JMP :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d, e; if (a&&(b||!c||d)&&e) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e

BZR $a :__if1_endif
__AND_3_next:
BNZ $b :__AND_2_next
__OR_5_next:
BZR $c :__AND_2_next
JMP :__OR_4_next
__OR_4_next:
BNZ $d :__AND_2_next
JMP :__if1_endif
JMP :__AND_2_next
__AND_2_next:
BZR $e :__if1_endif
JMP :__if1_start
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d, e; if (a==0&&(b==0||c==0&&d==0)&&e==0) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e

BNZ $a :__if1_endif
__AND_3_next:
BZR $b :__AND_2_next
__OR_4_next:
BNZ $c :__if1_endif
__AND_5_next:
BNZ $d :__if1_endif
JMP :__AND_2_next
JMP :__if1_endif
JMP :__AND_2_next
__AND_2_next:
BNZ $e :__if1_endif
JMP :__if1_start
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (!(!(!(a==b)))) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BEQ $a $b :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (!(!(!(!(a==b))))) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BNE $a $b :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d, z; if (( ( (a==5 || b==z) && c==z) || d==z ) && a==25+b) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare z

SET @r0 #0000000000000005
BEQ $a $r0 :__AND_4_next
__OR_5_next:
BEQ $b $z :__AND_4_next
JMP :__OR_3_next
__AND_4_next:
BNE $c $z :__OR_3_next
JMP :__AND_2_next
__OR_3_next:
BEQ $d $z :__AND_2_next
JMP :__if1_endif
__AND_2_next:
SET @r0 #0000000000000019
ADD @r0 $b
BNE $a $r0 :__if1_endif
JMP :__if1_start
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d, e, f, g, h; if (a||b&&c||d && e||f&&g||h) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e
^declare f
^declare g
^declare h

BNZ $a :__if1_start
__OR_5_next:
BZR $b :__OR_4_next
__AND_6_next:
BZR $c :__OR_4_next
JMP :__if1_start
JMP :__OR_4_next
__OR_4_next:
BZR $d :__OR_3_next
__AND_7_next:
BZR $e :__OR_3_next
JMP :__if1_start
JMP :__OR_3_next
__OR_3_next:
BZR $f :__OR_2_next
__AND_8_next:
BZR $g :__OR_2_next
JMP :__if1_start
JMP :__OR_2_next
__OR_2_next:
BNZ $h :__if1_start
JMP :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d, e, f, g, h; if ((a||b)&&(c||d)&&(e||f)&&(g||h)) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e
^declare f
^declare g
^declare h

BNZ $a :__AND_4_next
__OR_5_next:
BNZ $b :__AND_4_next
JMP :__if1_endif
__AND_4_next:
BNZ $c :__AND_3_next
__OR_6_next:
BNZ $d :__AND_3_next
JMP :__if1_endif
JMP :__AND_3_next
__AND_3_next:
BNZ $e :__AND_2_next
__OR_7_next:
BNZ $f :__AND_2_next
JMP :__if1_endif
JMP :__AND_2_next
__AND_2_next:
BNZ $g :__if1_start
__OR_8_next:
BNZ $h :__if1_start
JMP :__if1_endif
JMP :__if1_start
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d, e, f, g, h; if (((a&&b)||(c&&d)) && ((e&&f)||(g&&h))) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^declare e
^declare f
^declare g
^declare h

BZR $a :__OR_3_next
__AND_4_next:
BZR $b :__OR_3_next
JMP :__AND_2_next
__OR_3_next:
BZR $c :__if1_endif
__AND_5_next:
BZR $d :__if1_endif
JMP :__AND_2_next
JMP :__if1_endif
__AND_2_next:
BZR $e :__OR_6_next
__AND_7_next:
BZR $f :__OR_6_next
JMP :__if1_start
__OR_6_next:
BZR $g :__if1_endif
__AND_8_next:
BZR $h :__if1_endif
JMP :__if1_start
JMP :__if1_endif
JMP :__if1_start
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d; if (!((a&&b)||(c&&d))) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

BZR $a :__OR_2_next
__AND_3_next:
BZR $b :__OR_2_next
JMP :__if1_endif
__OR_2_next:
BZR $c :__if1_start
__AND_4_next:
BZR $d :__if1_start
JMP :__if1_endif
JMP :__if1_start
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c, d; if (!((a||b)&&(c||d))) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

BNZ $a :__AND_2_next
__OR_3_next:
BNZ $b :__AND_2_next
JMP :__if1_start
__AND_2_next:
BNZ $c :__if1_endif
__OR_4_next:
BNZ $d :__if1_endif
JMP :__if1_start
JMP :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],["Keywords tests",null,"div"],[`#pragma optimizationLevel 0
long a, b; if (a) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BZR $a :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (a) { a++; } else { b--; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BZR $a :__if1_else
__if1_start:
INC @a
JMP :__if1_endif
__if1_else:
DEC @b
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; while (a) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

__loop1_continue:
BZR $a :__loop1_break
__loop1_start:
INC @a
JMP :__loop1_continue
__loop1_break:
FIN
`],[`#pragma optimizationLevel 0
long a, b; for (a=0;a<10;a++) { b++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

CLR @a
__loop1_condition:
SET @r0 #000000000000000a
BGE $a $r0 :__loop1_break
__loop1_start:
INC @b
__loop1_continue:
INC @a
JMP :__loop1_condition
__loop1_break:
FIN
`],[`#pragma optimizationLevel 0
long a, b; do { a++; } while (a<b);`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

__loop1_continue:
INC @a
BLT $a $b :__loop1_continue
__loop1_break:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (a) a++;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BZR $a :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; if (a) a++; else b--;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BZR $a :__if1_else
__if1_start:
INC @a
JMP :__if1_endif
__if1_else:
DEC @b
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; while (a) a++;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

__loop1_continue:
BZR $a :__loop1_break
__loop1_start:
INC @a
JMP :__loop1_continue
__loop1_break:
FIN
`],[`#pragma optimizationLevel 0
long a, b; for (a=0;a<10;a++) b++;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

CLR @a
__loop1_condition:
SET @r0 #000000000000000a
BGE $a $r0 :__loop1_break
__loop1_start:
INC @b
__loop1_continue:
INC @a
JMP :__loop1_condition
__loop1_break:
FIN
`],[`#pragma optimizationLevel 0
long a, b; do a++; while (a<b);`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

__loop1_continue:
INC @a
BLT $a $b :__loop1_continue
__loop1_break:
FIN
`],[`#pragma optimizationLevel 0
long a, b; while (a) { a++; if (a==5) break; b++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

__loop1_continue:
BZR $a :__loop1_break
__loop1_start:
INC @a
SET @r0 #0000000000000005
BNE $a $r0 :__if2_endif
__if2_start:
JMP :__loop1_break
__if2_endif:
INC @b
JMP :__loop1_continue
__loop1_break:
FIN
`],[`#pragma optimizationLevel 0
long a, b; while (a) { a++; if (a==5) continue; b++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

__loop1_continue:
BZR $a :__loop1_break
__loop1_start:
INC @a
SET @r0 #0000000000000005
BNE $a $r0 :__if2_endif
__if2_start:
JMP :__loop1_continue
__if2_endif:
INC @b
JMP :__loop1_continue
__loop1_break:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c; a++; goto alabel; b++; alabel: c++;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

INC @a
JMP :alabel
INC @b
alabel:
INC @c
FIN
`],[`#pragma optimizationLevel 0
long temp; temp = 2; if (temp>0) goto label1; if (temp==0) goto label2; goto label3; label1: temp++; label2: temp++; label3: temp++;`,!1,`^declare r0
^declare r1
^declare r2
^declare temp

SET @temp #0000000000000002
CLR @r0
BLE $temp $r0 :__if1_endif
__if1_start:
JMP :label1
__if1_endif:
BNZ $temp :__if2_endif
__if2_start:
JMP :label2
__if2_endif:
JMP :label3
label1:
INC @temp
label2:
INC @temp
label3:
INC @temp
FIN
`],[`#pragma optimizationLevel 0
long a, b; a++; asm { PSH $a
POP @b } b++;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

INC @a
PSH $a
POP @b
INC @b
FIN
`],[`#pragma optimizationLevel 0
long a, b; a++; sleep 1;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

INC @a
SET @r0 #0000000000000001
SLP $r0
FIN
`],[`#pragma optimizationLevel 0
long a, b; exit; a++; `,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

FIN
INC @a
FIN
`],[`#pragma optimizationLevel 0
halt;`,!1,`^declare r0
^declare r1
^declare r2

STP
FIN
`],[`#pragma optimizationLevel 0
long a, b, c; if (a) { a++; if (b) { b++; if (c) { c++; } } }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

BZR $a :__if1_endif
__if1_start:
INC @a
BZR $b :__if2_endif
__if2_start:
INC @b
BZR $c :__if3_endif
__if3_start:
INC @c
__if3_endif:
__if2_endif:
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b, c; if (a) {
 a++;
} else if (b) {
 b++;
} else if (c) {
 c++;
}`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

BZR $a :__if1_else
__if1_start:
INC @a
JMP :__if1_endif
__if1_else:
BZR $b :__if2_else
__if2_start:
INC @b
JMP :__if2_endif
__if2_else:
BZR $c :__if3_endif
__if3_start:
INC @c
__if3_endif:
__if2_endif:
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a, b; a=2; const b=5; a++;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @a #0000000000000002
^const SET @b #0000000000000005
INC @a
FIN
`],[`#pragma optimizationLevel 0
Empty conditions`,null,"div"],[`#pragma optimizationLevel 0
long a; if () { a++; }`,!0,""],[`#pragma optimizationLevel 0
long a; if () { a++; } else { b--; }`,!0,""],[`#pragma optimizationLevel 0
long a; while () { a++; }`,!0,""],[`#pragma optimizationLevel 0
long a; for (;;) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

__loop1_condition:
__loop1_start:
INC @a
__loop1_continue:
JMP :__loop1_condition
__loop1_break:
FIN
`],[`#pragma optimizationLevel 0
long a; do { a++; } while ();`,!0,""],["Full tests;",null,"div"],["Pointer Assignment;",null,"div"],[`long *pa, *pb, va, vb;
pa = pb; pa = &pb; pa = &vb; *pa= vb;
*pa= *pb; va = vb; va = *pb;`,!1,`^declare r0
^declare r1
^declare r2
^declare pa
^declare pb
^declare va
^declare vb

SET @pa $pb
SET @pa #0000000000000004
SET @pa #0000000000000006
SET @($pa) $vb
SET @r0 $($pb)
SET @($pa) $r0
SET @va $vb
SET @va $($pb)
FIN
`],["long *pa, *pb, va, vb; pa=vb; pa=*pb; *pa=pb; *pa=&pb; *pa=&vb; va=pb; va=&pb; va=&vb;",!0,""],[`#pragma warningToError false
long *pa, *pb, va, vb;
pa=vb; pa=*pb; *pa=pb; *pa=&pb; *pa=&vb; va=pb; va=&pb; va=&vb;`,!1,`^declare r0
^declare r1
^declare r2
^declare pa
^declare pb
^declare va
^declare vb

SET @pa $vb
SET @pa $($pb)
SET @($pa) $pb
SET @r0 #0000000000000004
SET @($pa) $r0
SET @r0 #0000000000000006
SET @($pa) $r0
SET @va $pb
SET @va #0000000000000004
SET @va #0000000000000006
FIN
`],["long *pa, *pb, va, vb; pa+=vb;",!1,`^declare r0
^declare r1
^declare r2
^declare pa
^declare pb
^declare va
^declare vb

ADD @pa $vb
FIN
`],["long *pa, *pb, va, vb; pa+=vb+1;",!1,`^declare r0
^declare r1
^declare r2
^declare pa
^declare pb
^declare va
^declare vb

SET @r0 $vb
INC @r0
ADD @pa $r0
FIN
`],["long *pa, *pb, va, vb; pa-=vb;",!1,`^declare r0
^declare r1
^declare r2
^declare pa
^declare pb
^declare va
^declare vb

SUB @pa $vb
FIN
`],["long *pa, *pb, va, vb; pa=pa-vb;",!1,`^declare r0
^declare r1
^declare r2
^declare pa
^declare pb
^declare va
^declare vb

SET @r0 $pa
SUB @r0 $vb
SET @pa $r0
FIN
`],["long *pa, *pb, va, vb; va=*vb;",!0,""],["long *pa, *pb, va, vb; *va=vb;",!0,""],["long *a, *a+1=0;",!0,""],["long *a, *(a*3)=0;",!0,""],["Pointer/Array Assignment;",null,"div"],["long a[4], *b, c; *b=a[0]; a[0]=*b; b=a; *b=a[c]; a[c]=*b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare b
^declare c

SET @($b) $a_0
SET @a_0 $($b)
SET @b $a
SET @r0 $($a + $c)
SET @($b) $r0
SET @r0 $($b)
SET @($a + $c) $r0
FIN
`],["long a[4], *b, c; a=b;",!0,""],["long a[4], *b, c; b=&a; b=&a[0]; b=&c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare b
^declare c

SET @b #0000000000000003
SET @b #0000000000000004
SET @b #0000000000000009
FIN
`],["long a[4], *b, c; c=&a; c=&a[0]; c=&c;",!0,""],[`#pragma warningToError false
long a[4], *b, c; c=&a; c=&a[0]; c=&c;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare b
^declare c

SET @c #0000000000000003
SET @c #0000000000000004
SET @c #0000000000000009
FIN
`],[`long *a, b, c;
*(a+1)=b; *(a+30)=b; *(a+c)=b;
b=*(a+1); b=*(a+30); b=*(a+c);`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @r0 $a
INC @r0
SET @($r0) $b
SET @r0 #000000000000001e
ADD @r0 $a
SET @($r0) $b
SET @r0 $a
ADD @r0 $c
SET @($r0) $b
SET @b $a
INC @b
SET @b $($b)
SET @b #000000000000001e
ADD @b $a
SET @b $($b)
SET @b $a
ADD @b $c
SET @b $($b)
FIN
`],["long *a, b, Array[4]; a=Array+2; a=Array-b; a+=7; a++;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare Array
^const SET @Array #0000000000000006
^declare Array_0
^declare Array_1
^declare Array_2
^declare Array_3

SET @a $Array
INC @a
INC @a
SET @a $Array
SUB @a $b
SET @r0 #0000000000000007
ADD @a $r0
INC @a
FIN
`],["long *a, b, Array[4]; a=Array*2;",!0,""],["Array",null,"div"],["long a[4]; long b; long c; a[b]=c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare b
^declare c

SET @($a + $b) $c
FIN
`],["long a[4]; long b; long c; a[0]=b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare b
^declare c

SET @a_0 $b
FIN
`],["long a[4]; long b; long c; a[2]=b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare b
^declare c

SET @a_2 $b
FIN
`],["long a[4]; a[]='aaaaaaaazzzzzzz';",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3

SET @a_0 #6161616161616161
SET @a_1 #007a7a7a7a7a7a7a
CLR @a_2
CLR @a_3
FIN
`],["long a[4]; a[]=0x3333333333333333222222222222222211111111111111110000000000000000;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3

CLR @a_0
SET @a_1 #1111111111111111
SET @a_2 #2222222222222222
SET @a_3 #3333333333333333
FIN
`],["long a[4]; long b; long c; c=a[b];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare b
^declare c

SET @c $($a + $b)
FIN
`],["long a[4]; long b; long c; c=a[0];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare b
^declare c

SET @c $a_0
FIN
`],["long a[4]; long b; long c; c=a[3];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare b
^declare c

SET @c $a_3
FIN
`],["long a[4]; long b; long c; a[b]+=c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare b
^declare c

SET @r0 $($a + $b)
ADD @r0 $c
SET @($a + $b) $r0
FIN
`],["long a[4]; long b; long c; a[0]-=b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare b
^declare c

SUB @a_0 $b
FIN
`],["long a[4]; long b; long c; a[2]*=b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare b
^declare c

MUL @a_2 $b
FIN
`],["long a[4]; long b; long c; c/=a[b];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare b
^declare c

SET @r0 $($a + $b)
DIV @c $r0
FIN
`],["long a[4]; long b; long c; c&=a[0];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare b
^declare c

AND @c $a_0
FIN
`],["long a[4]; long b; long c; c^=a[3];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare b
^declare c

XOR @c $a_3
FIN
`],["long a[4]; long b; long c[4]; long d; a[b]=c[d];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare b
^declare c
^const SET @c #000000000000000a
^declare c_0
^declare c_1
^declare c_2
^declare c_3
^declare d

SET @r0 $($c + $d)
SET @($a + $b) $r0
FIN
`],["long a[4]; long b; long c[4]; long d; a[b]+=c[d];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare b
^declare c
^const SET @c #000000000000000a
^declare c_0
^declare c_1
^declare c_2
^declare c_3
^declare d

SET @r0 $($a + $b)
SET @r1 $($c + $d)
ADD @r0 $r1
SET @($a + $b) $r0
FIN
`],["long a[4]; long b; a[b]=2;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare b

SET @r0 #0000000000000002
SET @($a + $b) $r0
FIN
`],["long a[4]; a[0]=0xFF;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3

SET @a_0 #00000000000000ff
FIN
`],['long a[4]; a[2]="Ho ho";',!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3

SET @a_2 #0000006f68206f48
FIN
`],["long a, b[4], c, d; a=b[c]/b[d];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^const SET @b #0000000000000005
^declare b_0
^declare b_1
^declare b_2
^declare b_3
^declare c
^declare d

SET @a $($b + $c)
SET @r0 $($b + $d)
DIV @a $r0
FIN
`],["long a, b[4], c, d; a=b[c]<<b[2];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^const SET @b #0000000000000005
^declare b_0
^declare b_1
^declare b_2
^declare b_3
^declare c
^declare d

SET @a $($b + $c)
SHL @a $b_2
FIN
`],["long a, b[4], c, d; a=b[~c];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^const SET @b #0000000000000005
^declare b_0
^declare b_1
^declare b_2
^declare b_3
^declare c
^declare d

SET @a $c
NOT @a
SET @a $($b + $a)
FIN
`],["long a, b[4], c, d; a=~b[c];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^const SET @b #0000000000000005
^declare b_0
^declare b_1
^declare b_2
^declare b_3
^declare c
^declare d

SET @a $($b + $c)
NOT @a
FIN
`],["long a, b[4], c, d; a=b[c]++;",!0,""],["long a, b[4], c, d; a=b++[c];",!0,""],["long a, b[4], c, d; a=--b[c];",!0,""],["long a, b[4], c, d; a=-b[c];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^const SET @b #0000000000000005
^declare b_0
^declare b_1
^declare b_2
^declare b_3
^declare c
^declare d

CLR @a
SET @r0 $($b + $c)
SUB @a $r0
FIN
`],["long a, b[4], c, d; a=+b[c];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^const SET @b #0000000000000005
^declare b_0
^declare b_1
^declare b_2
^declare b_3
^declare c
^declare d

SET @a $($b + $c)
FIN
`],["long a, b[4], c, d; a=b[-c];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^const SET @b #0000000000000005
^declare b_0
^declare b_1
^declare b_2
^declare b_3
^declare c
^declare d

CLR @a
SUB @a $c
SET @a $($b + $a)
FIN
`],["long a, b[4], c, d; a=b[+c];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^const SET @b #0000000000000005
^declare b_0
^declare b_1
^declare b_2
^declare b_3
^declare c
^declare d

SET @a $($b + $c)
FIN
`],["long a, b[4], c, d; a=b[*c];",!0,""],["long a, b[4], c, d[2], e; a=b[c]-d[e];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^const SET @b #0000000000000005
^declare b_0
^declare b_1
^declare b_2
^declare b_3
^declare c
^declare d
^const SET @d #000000000000000b
^declare d_0
^declare d_1
^declare e

SET @a $($b + $c)
SET @r0 $($d + $e)
SUB @a $r0
FIN
`],["long a, b[4], c, d[2], e; a=b[c]+d[e];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^const SET @b #0000000000000005
^declare b_0
^declare b_1
^declare b_2
^declare b_3
^declare c
^declare d
^const SET @d #000000000000000b
^declare d_0
^declare d_1
^declare e

SET @a $($b + $c)
SET @r0 $($d + $e)
ADD @a $r0
FIN
`],["long a, b[4], c, d[2], e; a=b[c]*d[e];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^const SET @b #0000000000000005
^declare b_0
^declare b_1
^declare b_2
^declare b_3
^declare c
^declare d
^const SET @d #000000000000000b
^declare d_0
^declare d_1
^declare e

SET @a $($b + $c)
SET @r0 $($d + $e)
MUL @a $r0
FIN
`],["long a, b[4], c, d[2], e; a=b[c]&d[e];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^const SET @b #0000000000000005
^declare b_0
^declare b_1
^declare b_2
^declare b_3
^declare c
^declare d
^const SET @d #000000000000000b
^declare d_0
^declare d_1
^declare e

SET @a $($b + $c)
SET @r0 $($d + $e)
AND @a $r0
FIN
`],["long a, b[4], c, d; a=b[c-d];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^const SET @b #0000000000000005
^declare b_0
^declare b_1
^declare b_2
^declare b_3
^declare c
^declare d

SET @a $c
SUB @a $d
SET @a $($b + $a)
FIN
`],["long a, b[4], c, d; a=b[c+d];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^const SET @b #0000000000000005
^declare b_0
^declare b_1
^declare b_2
^declare b_3
^declare c
^declare d

SET @a $c
ADD @a $d
SET @a $($b + $a)
FIN
`],["long a, b[4], c, d; a=b[c*d];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^const SET @b #0000000000000005
^declare b_0
^declare b_1
^declare b_2
^declare b_3
^declare c
^declare d

SET @a $c
MUL @a $d
SET @a $($b + $a)
FIN
`],["long a, b[4], c, d; a=b[c&d];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^const SET @b #0000000000000005
^declare b_0
^declare b_1
^declare b_2
^declare b_3
^declare c
^declare d

SET @a $c
AND @a $d
SET @a $($b + $a)
FIN
`],["long a, b[4], c, d; a=*b[c];",!0,""],["long a[4], *b, c,d; b=&a[c];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare b
^declare c
^declare d

SET @b $a
ADD @b $c
FIN
`],["long a[4][2], *b, c,d; b=&a[c][d];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare a_4
^declare a_5
^declare a_6
^declare a_7
^declare b
^declare c
^declare d

SET @r0 #0000000000000002
MUL @r0 $c
ADD @r0 $d
SET @b $a
ADD @b $r0
FIN
`],["long a, b[4], c, d; a=b[&c];",!0,""],["long a[3],b,c[3],d,e[3],f; a[2]=b,c[2]*=d,e[2]+=f;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare b
^declare c
^const SET @c #0000000000000009
^declare c_0
^declare c_1
^declare c_2
^declare d
^declare e
^const SET @e #000000000000000e
^declare e_0
^declare e_1
^declare e_2
^declare f

SET @a_2 $b
MUL @c_2 $d
ADD @e_2 $f
FIN
`],["long a,b[3],c,d[3],e; a=b[c],d[0]=e;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^const SET @b #0000000000000005
^declare b_0
^declare b_1
^declare b_2
^declare c
^declare d
^const SET @d #000000000000000a
^declare d_0
^declare d_1
^declare d_2
^declare e

SET @a $($b + $c)
SET @d_0 $e
FIN
`],["Multidimennsional Array",null,"div"],["long a[4][2]; a[2][1]=0;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare a_4
^declare a_5
^declare a_6
^declare a_7

CLR @a_5
FIN
`],["long a[4][2]; long b; a[b][1]=0;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare a_4
^declare a_5
^declare a_6
^declare a_7
^declare b

SET @r0 #0000000000000002
MUL @r0 $b
INC @r0
CLR @r1
SET @($a + $r0) $r1
FIN
`],["long a[4][2]; long b; a[b][0]=0;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare a_4
^declare a_5
^declare a_6
^declare a_7
^declare b

SET @r0 #0000000000000002
MUL @r0 $b
CLR @r1
SET @($a + $r0) $r1
FIN
`],["long a[4][2]; long b; a[0][b]=0;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare a_4
^declare a_5
^declare a_6
^declare a_7
^declare b

CLR @r0
SET @($a + $b) $r0
FIN
`],["long a[4][2]; long b; a[1][b]=0;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare a_4
^declare a_5
^declare a_6
^declare a_7
^declare b

SET @r0 $b
INC @r0
INC @r0
CLR @r1
SET @($a + $r0) $r1
FIN
`],["long a[4][2]; long b; a[1][b]=a[b][1];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare a_4
^declare a_5
^declare a_6
^declare a_7
^declare b

SET @r0 $b
INC @r0
INC @r0
SET @r1 #0000000000000002
MUL @r1 $b
INC @r1
SET @r2 $($a + $r1)
SET @($a + $r0) $r2
FIN
`],["long a[3][3][3]; long b; long c; a[1][2][2]=0;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare a_4
^declare a_5
^declare a_6
^declare a_7
^declare a_8
^declare a_9
^declare a_10
^declare a_11
^declare a_12
^declare a_13
^declare a_14
^declare a_15
^declare a_16
^declare a_17
^declare a_18
^declare a_19
^declare a_20
^declare a_21
^declare a_22
^declare a_23
^declare a_24
^declare a_25
^declare a_26
^declare b
^declare c

CLR @a_17
FIN
`],["long a[3][3][3]; long b; long c; a[1][2][b]=0;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare a_4
^declare a_5
^declare a_6
^declare a_7
^declare a_8
^declare a_9
^declare a_10
^declare a_11
^declare a_12
^declare a_13
^declare a_14
^declare a_15
^declare a_16
^declare a_17
^declare a_18
^declare a_19
^declare a_20
^declare a_21
^declare a_22
^declare a_23
^declare a_24
^declare a_25
^declare a_26
^declare b
^declare c

SET @r0 $b
SET @r1 #000000000000000f
ADD @r0 $r1
CLR @r1
SET @($a + $r0) $r1
FIN
`],["long a[3][3][3]; long b; long c; a[1][b][2]=0;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare a_4
^declare a_5
^declare a_6
^declare a_7
^declare a_8
^declare a_9
^declare a_10
^declare a_11
^declare a_12
^declare a_13
^declare a_14
^declare a_15
^declare a_16
^declare a_17
^declare a_18
^declare a_19
^declare a_20
^declare a_21
^declare a_22
^declare a_23
^declare a_24
^declare a_25
^declare a_26
^declare b
^declare c

SET @r0 $b
SET @r1 #0000000000000003
MUL @r0 $r1
SET @r1 #0000000000000009
ADD @r0 $r1
INC @r0
INC @r0
CLR @r1
SET @($a + $r0) $r1
FIN
`],["long a[3][3][3]; long b; long c; a[b][2][2]=0;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare a_4
^declare a_5
^declare a_6
^declare a_7
^declare a_8
^declare a_9
^declare a_10
^declare a_11
^declare a_12
^declare a_13
^declare a_14
^declare a_15
^declare a_16
^declare a_17
^declare a_18
^declare a_19
^declare a_20
^declare a_21
^declare a_22
^declare a_23
^declare a_24
^declare a_25
^declare a_26
^declare b
^declare c

SET @r0 #0000000000000009
MUL @r0 $b
SET @r1 #0000000000000006
ADD @r0 $r1
INC @r0
INC @r0
CLR @r1
SET @($a + $r0) $r1
FIN
`],["long a[3][3][3]; long b; long c; a[b][b][b]=0;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare a_4
^declare a_5
^declare a_6
^declare a_7
^declare a_8
^declare a_9
^declare a_10
^declare a_11
^declare a_12
^declare a_13
^declare a_14
^declare a_15
^declare a_16
^declare a_17
^declare a_18
^declare a_19
^declare a_20
^declare a_21
^declare a_22
^declare a_23
^declare a_24
^declare a_25
^declare a_26
^declare b
^declare c

SET @r0 #0000000000000009
MUL @r0 $b
SET @r1 $b
SET @r2 #0000000000000003
MUL @r1 $r2
ADD @r0 $r1
ADD @r0 $b
CLR @r1
SET @($a + $r0) $r1
FIN
`],["Struct",null,"div"],[`struct KOMBI { long driver; long collector; long passenger; } car;
long a, b, *c, d[2];

car.passenger="Ze";
car.passenger=a;
car.passenger=*c;
car.passenger=d[1];
car.passenger=d[a];
car.passenger=car.collector;

a=car.driver;
*c=car.driver;
d[1]=car.driver;
d[a]=car.driver;`,!1,`^declare r0
^declare r1
^declare r2
^declare car_driver
^declare car_collector
^declare car_passenger
^declare a
^declare b
^declare c
^declare d
^const SET @d #000000000000000a
^declare d_0
^declare d_1

SET @car_passenger #000000000000655a
SET @car_passenger $a
SET @car_passenger $($c)
SET @car_passenger $d_1
SET @car_passenger $($d + $a)
SET @car_passenger $car_collector
SET @a $car_driver
SET @($c) $car_driver
SET @d_1 $car_driver
SET @($d + $a) $car_driver
FIN
`],[`struct KOMBI { long driver; long collector; long passenger; } car[3];
long a, b, *c, d[2];

car[1].passenger='Ze';
car[1].passenger=a;
car[1].passenger=*c;
car[1].passenger=d[1];
car[1].passenger=d[a];
car[1].passenger=car[2].collector;

a=car[1].driver;
*c=car[1].driver;
d[1]=car[1].driver;
d[a]=car[1].driver;`,!1,`^declare r0
^declare r1
^declare r2
^declare car
^const SET @car #0000000000000004
^declare car_0_driver
^declare car_0_collector
^declare car_0_passenger
^declare car_1_driver
^declare car_1_collector
^declare car_1_passenger
^declare car_2_driver
^declare car_2_collector
^declare car_2_passenger
^declare a
^declare b
^declare c
^declare d
^const SET @d #0000000000000011
^declare d_0
^declare d_1

SET @car_1_passenger #000000000000655a
SET @car_1_passenger $a
SET @car_1_passenger $($c)
SET @car_1_passenger $d_1
SET @car_1_passenger $($d + $a)
SET @car_1_passenger $car_2_collector
SET @a $car_1_driver
SET @($c) $car_1_driver
SET @d_1 $car_1_driver
SET @($d + $a) $car_1_driver
FIN
`],[`struct KOMBI { long driver; long collector; long passenger; } car[3];
long a, b, *c, d[2];

car[a].passenger='Ze';
car[a].passenger=a;
car[a].passenger=*c;
car[a].passenger=d[1];
car[a].passenger=d[a];
car[a].passenger=car[2].collector;
car[a].passenger=car[b].collector;
`,!1,`^declare r0
^declare r1
^declare r2
^declare car
^const SET @car #0000000000000004
^declare car_0_driver
^declare car_0_collector
^declare car_0_passenger
^declare car_1_driver
^declare car_1_collector
^declare car_1_passenger
^declare car_2_driver
^declare car_2_collector
^declare car_2_passenger
^declare a
^declare b
^declare c
^declare d
^const SET @d #0000000000000011
^declare d_0
^declare d_1

SET @r0 #0000000000000003
MUL @r0 $a
INC @r0
INC @r0
SET @r1 #000000000000655a
SET @($car + $r0) $r1
SET @r0 #0000000000000003
MUL @r0 $a
INC @r0
INC @r0
SET @($car + $r0) $a
SET @r0 #0000000000000003
MUL @r0 $a
INC @r0
INC @r0
SET @r1 $($c)
SET @($car + $r0) $r1
SET @r0 #0000000000000003
MUL @r0 $a
INC @r0
INC @r0
SET @($car + $r0) $d_1
SET @r0 #0000000000000003
MUL @r0 $a
INC @r0
INC @r0
SET @r1 $($d + $a)
SET @($car + $r0) $r1
SET @r0 #0000000000000003
MUL @r0 $a
INC @r0
INC @r0
SET @($car + $r0) $car_2_collector
SET @r0 #0000000000000003
MUL @r0 $a
INC @r0
INC @r0
SET @r1 #0000000000000003
MUL @r1 $b
INC @r1
SET @r2 $($car + $r1)
SET @($car + $r0) $r2
FIN
`],[`struct KOMBI { long driver; long collector; long passenger; } car[3];
long a, b, *c, d[2];

a=car[b].driver;
*c=car[b].driver;
d[1]=car[b].driver;
d[a]=car[b].driver;`,!1,`^declare r0
^declare r1
^declare r2
^declare car
^const SET @car #0000000000000004
^declare car_0_driver
^declare car_0_collector
^declare car_0_passenger
^declare car_1_driver
^declare car_1_collector
^declare car_1_passenger
^declare car_2_driver
^declare car_2_collector
^declare car_2_passenger
^declare a
^declare b
^declare c
^declare d
^const SET @d #0000000000000011
^declare d_0
^declare d_1

SET @a #0000000000000003
MUL @a $b
SET @a $($car + $a)
SET @r0 #0000000000000003
MUL @r0 $b
SET @r1 $($car + $r0)
SET @($c) $r1
SET @d_1 #0000000000000003
MUL @d_1 $b
SET @d_1 $($car + $d_1)
SET @r0 #0000000000000003
MUL @r0 $b
SET @r1 $($car + $r0)
SET @($d + $a) $r1
FIN
`],[`struct KOMBI { long driver; long collector; long passenger[4]; } car;
long a, b, *c, d[2];

car.passenger[1]='Ze';
car.passenger[1]=a;
car.passenger[1]=*c;
car.passenger[1]=d[1];
car.passenger[1]=d[a];
car.passenger[1]=car.driver;
car.passenger[1]=car.passenger[2];

a=car.passenger[3];
*c=car.passenger[3];
d[1]=car.passenger[3];
d[a]=car.passenger[3];`,!1,`^declare r0
^declare r1
^declare r2
^declare car_driver
^declare car_collector
^declare car_passenger
^const SET @car_passenger #0000000000000006
^declare car_passenger_0
^declare car_passenger_1
^declare car_passenger_2
^declare car_passenger_3
^declare a
^declare b
^declare c
^declare d
^const SET @d #000000000000000e
^declare d_0
^declare d_1

SET @car_passenger_1 #000000000000655a
SET @car_passenger_1 $a
SET @car_passenger_1 $($c)
SET @car_passenger_1 $d_1
SET @car_passenger_1 $($d + $a)
SET @car_passenger_1 $car_driver
SET @car_passenger_1 $car_passenger_2
SET @a $car_passenger_3
SET @($c) $car_passenger_3
SET @d_1 $car_passenger_3
SET @($d + $a) $car_passenger_3
FIN
`],[`struct KOMBI { long driver; long collector; long passenger[4]; } car;
long a, b, *c, d[2];

car.passenger[a]='Ze';
car.passenger[a]=a;
car.passenger[a]=*c;
car.passenger[a]=d[1];
car.passenger[a]=d[a];
car.passenger[a]=car.driver;
car.passenger[a]=car.passenger[b];

a=car.passenger[b];
*c=car.passenger[b];
d[1]=car.passenger[b];
d[a]=car.passenger[b];`,!1,`^declare r0
^declare r1
^declare r2
^declare car_driver
^declare car_collector
^declare car_passenger
^const SET @car_passenger #0000000000000006
^declare car_passenger_0
^declare car_passenger_1
^declare car_passenger_2
^declare car_passenger_3
^declare a
^declare b
^declare c
^declare d
^const SET @d #000000000000000e
^declare d_0
^declare d_1

SET @r0 #000000000000655a
SET @($car_passenger + $a) $r0
SET @($car_passenger + $a) $a
SET @r0 $($c)
SET @($car_passenger + $a) $r0
SET @($car_passenger + $a) $d_1
SET @r0 $($d + $a)
SET @($car_passenger + $a) $r0
SET @($car_passenger + $a) $car_driver
SET @r0 $($car_passenger + $b)
SET @($car_passenger + $a) $r0
SET @a $($car_passenger + $b)
SET @r0 $($car_passenger + $b)
SET @($c) $r0
SET @d_1 $($car_passenger + $b)
SET @r0 $($car_passenger + $b)
SET @($d + $a) $r0
FIN
`],[`struct KOMBI { long driver; long collector; long passenger[4]; } car[2];
long a, b, *c, d[2];

car[1].passenger[2]='Ze';
car[1].passenger[2]=a;
car[1].passenger[2]=*c;
car[1].passenger[2]=d[1];
car[1].passenger[2]=d[a];
car[1].passenger[2]=car[0].driver;
car[1].passenger[2]=car[0].passenger[3];

a=car[1].passenger[3];
*c=car[1].passenger[3];
d[1]=car[1].passenger[3];
d[a]=car[1].passenger[3];`,!1,`^declare r0
^declare r1
^declare r2
^declare car
^const SET @car #0000000000000004
^declare car_0_driver
^declare car_0_collector
^declare car_0_passenger
^const SET @car_0_passenger #0000000000000007
^declare car_0_passenger_0
^declare car_0_passenger_1
^declare car_0_passenger_2
^declare car_0_passenger_3
^declare car_1_driver
^declare car_1_collector
^declare car_1_passenger
^const SET @car_1_passenger #000000000000000e
^declare car_1_passenger_0
^declare car_1_passenger_1
^declare car_1_passenger_2
^declare car_1_passenger_3
^declare a
^declare b
^declare c
^declare d
^const SET @d #0000000000000016
^declare d_0
^declare d_1

SET @car_1_passenger_2 #000000000000655a
SET @car_1_passenger_2 $a
SET @car_1_passenger_2 $($c)
SET @car_1_passenger_2 $d_1
SET @car_1_passenger_2 $($d + $a)
SET @car_1_passenger_2 $car_0_driver
SET @car_1_passenger_2 $car_0_passenger_3
SET @a $car_1_passenger_3
SET @($c) $car_1_passenger_3
SET @d_1 $car_1_passenger_3
SET @($d + $a) $car_1_passenger_3
FIN
`],[`struct KOMBI { long driver; long collector; long passenger[4]; } car[2];
long a, b, *c, d[2];

car[1].passenger[a]='Ze';
car[1].passenger[a]=a;
car[1].passenger[a]=*c;
car[1].passenger[a]=d[1];
car[1].passenger[a]=d[a];
car[1].passenger[a]=car[0].driver;
car[1].passenger[a]=car[0].passenger[b];

a=car[1].passenger[b];
*c=car[1].passenger[b];
d[1]=car[1].passenger[b];
d[a]=car[1].passenger[b];`,!1,`^declare r0
^declare r1
^declare r2
^declare car
^const SET @car #0000000000000004
^declare car_0_driver
^declare car_0_collector
^declare car_0_passenger
^const SET @car_0_passenger #0000000000000007
^declare car_0_passenger_0
^declare car_0_passenger_1
^declare car_0_passenger_2
^declare car_0_passenger_3
^declare car_1_driver
^declare car_1_collector
^declare car_1_passenger
^const SET @car_1_passenger #000000000000000e
^declare car_1_passenger_0
^declare car_1_passenger_1
^declare car_1_passenger_2
^declare car_1_passenger_3
^declare a
^declare b
^declare c
^declare d
^const SET @d #0000000000000016
^declare d_0
^declare d_1

SET @r0 #000000000000655a
SET @($car_1_passenger + $a) $r0
SET @($car_1_passenger + $a) $a
SET @r0 $($c)
SET @($car_1_passenger + $a) $r0
SET @($car_1_passenger + $a) $d_1
SET @r0 $($d + $a)
SET @($car_1_passenger + $a) $r0
SET @($car_1_passenger + $a) $car_0_driver
SET @r0 $($car_0_passenger + $b)
SET @($car_1_passenger + $a) $r0
SET @a $($car_1_passenger + $b)
SET @r0 $($car_1_passenger + $b)
SET @($c) $r0
SET @d_1 $($car_1_passenger + $b)
SET @r0 $($car_1_passenger + $b)
SET @($d + $a) $r0
FIN
`],[`struct KOMBI { long driver; long collector; long passenger[4]; } car[2];
long a, b, *c, d[2];

car[b].passenger[a]='Ze';
car[b].passenger[a]=a;
car[b].passenger[a]=*c;
car[b].passenger[a]=d[1];
car[b].passenger[a]=d[a];
car[b].passenger[a]=car[b].driver;
car[b].passenger[a]=car[b].passenger[b];

a=car[a].passenger[b];
*c=car[a].passenger[b];
d[1]=car[a].passenger[b];
d[a]=car[a].passenger[b];`,!1,`^declare r0
^declare r1
^declare r2
^declare car
^const SET @car #0000000000000004
^declare car_0_driver
^declare car_0_collector
^declare car_0_passenger
^const SET @car_0_passenger #0000000000000007
^declare car_0_passenger_0
^declare car_0_passenger_1
^declare car_0_passenger_2
^declare car_0_passenger_3
^declare car_1_driver
^declare car_1_collector
^declare car_1_passenger
^const SET @car_1_passenger #000000000000000e
^declare car_1_passenger_0
^declare car_1_passenger_1
^declare car_1_passenger_2
^declare car_1_passenger_3
^declare a
^declare b
^declare c
^declare d
^const SET @d #0000000000000016
^declare d_0
^declare d_1

SET @r0 #0000000000000007
MUL @r0 $b
SET @r1 #0000000000000003
ADD @r0 $r1
ADD @r0 $a
SET @r1 #000000000000655a
SET @($car + $r0) $r1
SET @r0 #0000000000000007
MUL @r0 $b
SET @r1 #0000000000000003
ADD @r0 $r1
ADD @r0 $a
SET @($car + $r0) $a
SET @r0 #0000000000000007
MUL @r0 $b
SET @r1 #0000000000000003
ADD @r0 $r1
ADD @r0 $a
SET @r1 $($c)
SET @($car + $r0) $r1
SET @r0 #0000000000000007
MUL @r0 $b
SET @r1 #0000000000000003
ADD @r0 $r1
ADD @r0 $a
SET @($car + $r0) $d_1
SET @r0 #0000000000000007
MUL @r0 $b
SET @r1 #0000000000000003
ADD @r0 $r1
ADD @r0 $a
SET @r1 $($d + $a)
SET @($car + $r0) $r1
SET @r0 #0000000000000007
MUL @r0 $b
SET @r1 #0000000000000003
ADD @r0 $r1
ADD @r0 $a
SET @r1 #0000000000000007
MUL @r1 $b
SET @r2 $($car + $r1)
SET @($car + $r0) $r2
SET @r0 #0000000000000007
MUL @r0 $b
SET @r1 #0000000000000003
ADD @r0 $r1
ADD @r0 $a
SET @r1 #0000000000000007
MUL @r1 $b
SET @r2 #0000000000000003
ADD @r1 $r2
ADD @r1 $b
SET @r2 $($car + $r1)
SET @($car + $r0) $r2
SET @r0 #0000000000000007
MUL @r0 $a
SET @r1 #0000000000000003
ADD @r0 $r1
ADD @r0 $b
SET @a $($car + $r0)
SET @r0 #0000000000000007
MUL @r0 $a
SET @r1 #0000000000000003
ADD @r0 $r1
ADD @r0 $b
SET @r1 $($car + $r0)
SET @($c) $r1
SET @d_1 #0000000000000007
MUL @d_1 $a
SET @r0 #0000000000000003
ADD @d_1 $r0
ADD @d_1 $b
SET @d_1 $($car + $d_1)
SET @r0 #0000000000000007
MUL @r0 $a
SET @r1 #0000000000000003
ADD @r0 $r1
ADD @r0 $b
SET @r1 $($car + $r0)
SET @($d + $a) $r1
FIN
`],["Struct (pointer)",null,"div"],[`struct KOMBI { long driver; long collector; long passenger; } ;
struct KOMBI car, *pcar;
long a, b, *c, d[2];
pcar=&car;

pcar->passenger='Ze';
pcar->driver=a;
pcar->driver=*c;
pcar->driver=d[1];
pcar->driver=d[a];
pcar->driver=pcar->collector;

a=pcar->collector;
*c=pcar->collector;
d[1]=pcar->collector;
d[a]=pcar->collector;`,!1,`^declare r0
^declare r1
^declare r2
^declare car_driver
^declare car_collector
^declare car_passenger
^declare pcar
^declare a
^declare b
^declare c
^declare d
^const SET @d #000000000000000b
^declare d_0
^declare d_1

SET @pcar #0000000000000003
SET @r0 #000000000000655a
SET @r1 #0000000000000002
SET @($pcar + $r1) $r0
SET @($pcar) $a
SET @r0 $($c)
SET @($pcar) $r0
SET @($pcar) $d_1
SET @r0 $($d + $a)
SET @($pcar) $r0
SET @r1 #0000000000000001
SET @r0 $($pcar + $r1)
SET @($pcar) $r0
SET @r0 #0000000000000001
SET @a $($pcar + $r0)
SET @r1 #0000000000000001
SET @r0 $($pcar + $r1)
SET @($c) $r0
SET @r0 #0000000000000001
SET @d_1 $($pcar + $r0)
SET @r1 #0000000000000001
SET @r0 $($pcar + $r1)
SET @($d + $a) $r0
FIN
`],[`struct KOMBI { long driver; long collector; long passenger[4]; } ;
struct KOMBI car, *pcar;
long a, b, *c, d[2];
pcar=&car;

pcar->passenger[2]='Ze';
pcar->passenger[2]=a;
pcar->passenger[2]=*c;
pcar->passenger[2]=d[1];
pcar->passenger[2]=d[a];
pcar->passenger[2]=pcar->collector;
pcar->passenger[2]=pcar->passenger[1];

a=pcar->passenger[2];
*c=pcar->passenger[2];
d[1]=pcar->passenger[2];
d[a]=pcar->passenger[2];`,!1,`^declare r0
^declare r1
^declare r2
^declare car_driver
^declare car_collector
^declare car_passenger
^const SET @car_passenger #0000000000000006
^declare car_passenger_0
^declare car_passenger_1
^declare car_passenger_2
^declare car_passenger_3
^declare pcar
^declare a
^declare b
^declare c
^declare d
^const SET @d #000000000000000f
^declare d_0
^declare d_1

SET @pcar #0000000000000003
SET @r0 #000000000000655a
SET @r1 #0000000000000005
SET @($pcar + $r1) $r0
SET @r0 #0000000000000005
SET @($pcar + $r0) $a
SET @r0 $($c)
SET @r1 #0000000000000005
SET @($pcar + $r1) $r0
SET @r0 #0000000000000005
SET @($pcar + $r0) $d_1
SET @r0 $($d + $a)
SET @r1 #0000000000000005
SET @($pcar + $r1) $r0
SET @r1 #0000000000000001
SET @r0 $($pcar + $r1)
SET @r1 #0000000000000005
SET @($pcar + $r1) $r0
SET @r1 #0000000000000004
SET @r0 $($pcar + $r1)
SET @r1 #0000000000000005
SET @($pcar + $r1) $r0
SET @r0 #0000000000000005
SET @a $($pcar + $r0)
SET @r1 #0000000000000005
SET @r0 $($pcar + $r1)
SET @($c) $r0
SET @r0 #0000000000000005
SET @d_1 $($pcar + $r0)
SET @r1 #0000000000000005
SET @r0 $($pcar + $r1)
SET @($d + $a) $r0
FIN
`],[`struct KOMBI { long driver; long collector; long passenger[4]; } ;
struct KOMBI car[2], *pcar;
long a, b, *c, d[2];
pcar=&car[a];`,!1,`^declare r0
^declare r1
^declare r2
^declare car
^const SET @car #0000000000000004
^declare car_0_driver
^declare car_0_collector
^declare car_0_passenger
^const SET @car_0_passenger #0000000000000007
^declare car_0_passenger_0
^declare car_0_passenger_1
^declare car_0_passenger_2
^declare car_0_passenger_3
^declare car_1_driver
^declare car_1_collector
^declare car_1_passenger
^const SET @car_1_passenger #000000000000000e
^declare car_1_passenger_0
^declare car_1_passenger_1
^declare car_1_passenger_2
^declare car_1_passenger_3
^declare pcar
^declare a
^declare b
^declare c
^declare d
^const SET @d #0000000000000017
^declare d_0
^declare d_1

SET @r0 #0000000000000007
MUL @r0 $a
SET @r1 $car
ADD @r1 $r0
SET @pcar $r1
FIN
`],[`struct KOMBI { long driver; long collector; long passenger[4]; } ;
struct KOMBI car, *pcar;
long a, b, *c, d[2];
pcar=&car;

pcar->passenger[a]='Ze';
pcar->passenger[a]=a;
pcar->passenger[a]=*c;
pcar->passenger[a]=d[1];
pcar->passenger[a]=d[a];
pcar->passenger[a]=pcar->collector;
pcar->passenger[a]=pcar->passenger[b];

a=pcar->passenger[b];
*c=pcar->passenger[b];
d[1]=pcar->passenger[b];
d[a]=pcar->passenger[b];`,!1,`^declare r0
^declare r1
^declare r2
^declare car_driver
^declare car_collector
^declare car_passenger
^const SET @car_passenger #0000000000000006
^declare car_passenger_0
^declare car_passenger_1
^declare car_passenger_2
^declare car_passenger_3
^declare pcar
^declare a
^declare b
^declare c
^declare d
^const SET @d #000000000000000f
^declare d_0
^declare d_1

SET @pcar #0000000000000003
SET @r0 $a
SET @r1 #0000000000000003
ADD @r0 $r1
SET @r1 #000000000000655a
SET @($pcar + $r0) $r1
SET @r0 $a
SET @r1 #0000000000000003
ADD @r0 $r1
SET @($pcar + $r0) $a
SET @r0 $a
SET @r1 #0000000000000003
ADD @r0 $r1
SET @r1 $($c)
SET @($pcar + $r0) $r1
SET @r0 $a
SET @r1 #0000000000000003
ADD @r0 $r1
SET @($pcar + $r0) $d_1
SET @r0 $a
SET @r1 #0000000000000003
ADD @r0 $r1
SET @r1 $($d + $a)
SET @($pcar + $r0) $r1
SET @r0 $a
SET @r1 #0000000000000003
ADD @r0 $r1
SET @r2 #0000000000000001
SET @r1 $($pcar + $r2)
SET @($pcar + $r0) $r1
SET @r0 $a
SET @r1 #0000000000000003
ADD @r0 $r1
SET @r1 $b
SET @r2 #0000000000000003
ADD @r1 $r2
SET @r2 $($pcar + $r1)
SET @($pcar + $r0) $r2
SET @a $b
SET @r0 #0000000000000003
ADD @a $r0
SET @a $($pcar + $a)
SET @r0 $b
SET @r1 #0000000000000003
ADD @r0 $r1
SET @r1 $($pcar + $r0)
SET @($c) $r1
SET @d_1 $b
SET @r0 #0000000000000003
ADD @d_1 $r0
SET @d_1 $($pcar + $d_1)
SET @r0 $b
SET @r1 #0000000000000003
ADD @r0 $r1
SET @r1 $($pcar + $r0)
SET @($d + $a) $r1
FIN
`],["struct KOMBI { long driver, collector, passenger; } *car; void * ptr; ptr = &car;",!1,`^declare r0
^declare r1
^declare r2
^declare car
^declare ptr

SET @ptr #0000000000000003
FIN
`],["Logical operations with arrays and structs",null,"div"],[`#pragma optimizationLevel 0
long a[2], b; if (a[b]) { b++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare b

SET @r0 $($a + $b)
BZR $r0 :__if1_endif
__if1_start:
INC @b
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a[2], b; if (!(a[b])) { b++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare b

SET @r0 $($a + $b)
BNZ $r0 :__if1_endif
__if1_start:
INC @b
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
long a[2], b; if (!a[b]) { b++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare b

SET @r0 $($a + $b)
BNZ $r0 :__if1_endif
__if1_start:
INC @b
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
struct KOMBI { long driver; long collector; long passenger; } car;
long a, b;
if (car.driver=='Ze') { b++; }
if (a<=car.collector) { b--; }`,!1,`^declare r0
^declare r1
^declare r2
^declare car_driver
^declare car_collector
^declare car_passenger
^declare a
^declare b

SET @r0 #000000000000655a
BNE $car_driver $r0 :__if1_endif
__if1_start:
INC @b
__if1_endif:
BGT $a $car_collector :__if2_endif
__if2_start:
DEC @b
__if2_endif:
FIN
`],[`#pragma optimizationLevel 0
struct KOMBI { long driver; long collector; long passenger; } car[2];
long a, b;
if (car[1].driver=='Ze') { b++; }
if (a<=car[0].collector) { b--; }`,!1,`^declare r0
^declare r1
^declare r2
^declare car
^const SET @car #0000000000000004
^declare car_0_driver
^declare car_0_collector
^declare car_0_passenger
^declare car_1_driver
^declare car_1_collector
^declare car_1_passenger
^declare a
^declare b

SET @r0 #000000000000655a
BNE $car_1_driver $r0 :__if1_endif
__if1_start:
INC @b
__if1_endif:
BGT $a $car_0_collector :__if2_endif
__if2_start:
DEC @b
__if2_endif:
FIN
`],[`#pragma optimizationLevel 0
struct KOMBI { long driver; long collector; long passenger; } car[2];
long a, b;
if (car[b].driver=='Ze') { b++; }
if (a<=car[b].collector) { b--; }`,!1,`^declare r0
^declare r1
^declare r2
^declare car
^const SET @car #0000000000000004
^declare car_0_driver
^declare car_0_collector
^declare car_0_passenger
^declare car_1_driver
^declare car_1_collector
^declare car_1_passenger
^declare a
^declare b

SET @r0 #0000000000000003
MUL @r0 $b
SET @r1 $($car + $r0)
SET @r0 #000000000000655a
BNE $r1 $r0 :__if1_endif
__if1_start:
INC @b
__if1_endif:
SET @r0 #0000000000000003
MUL @r0 $b
INC @r0
SET @r1 $($car + $r0)
BGT $a $r1 :__if2_endif
__if2_start:
DEC @b
__if2_endif:
FIN
`],[`#pragma optimizationLevel 0
struct KOMBI { long driver; long collector; long passenger[3]; } car;
long a, b;
if (car.passenger[0]=='Ze') { b++; }
if (a<=car.passenger[2]) { b--; }`,!1,`^declare r0
^declare r1
^declare r2
^declare car_driver
^declare car_collector
^declare car_passenger
^const SET @car_passenger #0000000000000006
^declare car_passenger_0
^declare car_passenger_1
^declare car_passenger_2
^declare a
^declare b

SET @r0 #000000000000655a
BNE $car_passenger_0 $r0 :__if1_endif
__if1_start:
INC @b
__if1_endif:
BGT $a $car_passenger_2 :__if2_endif
__if2_start:
DEC @b
__if2_endif:
FIN
`],[`#pragma optimizationLevel 0
struct KOMBI { long driver; long collector; long passenger[3]; } car[2];
long a, b;
if (car[0].passenger[0]=='Ze') { b++; }
if (a<=car[b].passenger[2]) { b--; }`,!1,`^declare r0
^declare r1
^declare r2
^declare car
^const SET @car #0000000000000004
^declare car_0_driver
^declare car_0_collector
^declare car_0_passenger
^const SET @car_0_passenger #0000000000000007
^declare car_0_passenger_0
^declare car_0_passenger_1
^declare car_0_passenger_2
^declare car_1_driver
^declare car_1_collector
^declare car_1_passenger
^const SET @car_1_passenger #000000000000000d
^declare car_1_passenger_0
^declare car_1_passenger_1
^declare car_1_passenger_2
^declare a
^declare b

SET @r0 #000000000000655a
BNE $car_0_passenger_0 $r0 :__if1_endif
__if1_start:
INC @b
__if1_endif:
SET @r0 #0000000000000006
MUL @r0 $b
SET @r1 #0000000000000003
ADD @r0 $r1
INC @r0
INC @r0
SET @r1 $($car + $r0)
BGT $a $r1 :__if2_endif
__if2_start:
DEC @b
__if2_endif:
FIN
`],[`#pragma optimizationLevel 0
struct KOMBI { long driver; long collector; long passenger[3]; } car[2];
long a, b;
if (car[0].passenger[b]=='Ze') { b++; }
if (a<=car[b].passenger[a]) { b--; }`,!1,`^declare r0
^declare r1
^declare r2
^declare car
^const SET @car #0000000000000004
^declare car_0_driver
^declare car_0_collector
^declare car_0_passenger
^const SET @car_0_passenger #0000000000000007
^declare car_0_passenger_0
^declare car_0_passenger_1
^declare car_0_passenger_2
^declare car_1_driver
^declare car_1_collector
^declare car_1_passenger
^const SET @car_1_passenger #000000000000000d
^declare car_1_passenger_0
^declare car_1_passenger_1
^declare car_1_passenger_2
^declare a
^declare b

SET @r0 $($car_0_passenger + $b)
SET @r1 #000000000000655a
BNE $r0 $r1 :__if1_endif
__if1_start:
INC @b
__if1_endif:
SET @r0 #0000000000000006
MUL @r0 $b
SET @r1 #0000000000000003
ADD @r0 $r1
ADD @r0 $a
SET @r1 $($car + $r0)
BGT $a $r1 :__if2_endif
__if2_start:
DEC @b
__if2_endif:
FIN
`],[`#pragma optimizationLevel 0
struct KOMBI { long driver; long collector; long passenger; } ;
struct KOMBI car[2], *pcar;
long a, b;
pcar=&car[1];
if (pcar->driver=='Ze') { b++; }
if (a<=pcar->collector) { b--; }`,!1,`^declare r0
^declare r1
^declare r2
^declare car
^const SET @car #0000000000000004
^declare car_0_driver
^declare car_0_collector
^declare car_0_passenger
^declare car_1_driver
^declare car_1_collector
^declare car_1_passenger
^declare pcar
^declare a
^declare b

SET @pcar #0000000000000007
SET @r0 $($pcar)
SET @r1 #000000000000655a
BNE $r0 $r1 :__if1_endif
__if1_start:
INC @b
__if1_endif:
SET @r1 #0000000000000001
SET @r0 $($pcar + $r1)
BGT $a $r0 :__if2_endif
__if2_start:
DEC @b
__if2_endif:
FIN
`],["General",null,"div"],["long a;",!1,`^declare r0
^declare r1
^declare r2
^declare a

FIN
`],["long a=3;",!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @a #0000000000000003
FIN
`],["long a,b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

FIN
`],["long a,b=3;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @b #0000000000000003
FIN
`],["long * a;",!1,`^declare r0
^declare r1
^declare r2
^declare a

FIN
`],["long a[3];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2

FIN
`],["long a[3]; a[0]=9;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2

SET @a_0 #0000000000000009
FIN
`],["long a[3]; a=9;",!0,""],["Functions",null,"div"],[`#pragma optimizationLevel 0
long a; void main(void) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

JMP :__fn_main

__fn_main:
PCS
INC @a
FIN
`],[`#pragma optimizationLevel 0
long a; void main(void) { a++; return; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

JMP :__fn_main

__fn_main:
PCS
INC @a
FIN
`],[`#pragma optimizationLevel 0
long a; void main(void) { a++; return; a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

JMP :__fn_main

__fn_main:
PCS
INC @a
FIN
INC @a
FIN
`],[`#pragma optimizationLevel 0
long a; void test(void) { a++; return; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

FIN

__fn_test:
INC @a
RET
`],[`#pragma optimizationLevel 0
long a; void test(void) { a++; return; a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

FIN

__fn_test:
INC @a
RET
INC @a
RET
`],[`#pragma optimizationLevel 0
long a; test(); void test(void) { a++; return; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

JSR :__fn_test
FIN

__fn_test:
INC @a
RET
`],[`#pragma optimizationLevel 0
long a; a=test(); void test(void) { a++; return; }`,!0,""],[`#pragma optimizationLevel 0
long a; void test2(long b) { b++; return; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare test2_b

FIN

__fn_test2:
POP @test2_b
INC @test2_b
RET
`],[`#pragma optimizationLevel 0
long a; long test2(long b) { b++; return b; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare test2_b

FIN

__fn_test2:
POP @test2_b
INC @test2_b
PSH $test2_b
RET
`],[`#pragma optimizationLevel 0
long a=0; a=test2(a); long test2(long b) { b++; return b; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare test2_b

CLR @a
PSH $a
JSR :__fn_test2
POP @r0
SET @a $r0
FIN

__fn_test2:
POP @test2_b
INC @test2_b
PSH $test2_b
RET
`],[`#pragma optimizationLevel 0
#pragma warningToError false
long a=0; test2(a); long test2(long b) { b++; return b; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare test2_b

CLR @a
PSH $a
JSR :__fn_test2
POP @r0
FIN

__fn_test2:
POP @test2_b
INC @test2_b
PSH $test2_b
RET
`],[`#pragma optimizationLevel 0
long a=0; void main(void){ a++; test2(a); exit; } void test2(long b) { b++; return; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare test2_b

CLR @a
JMP :__fn_main

__fn_main:
PCS
INC @a
PSH $a
JSR :__fn_test2
FIN

__fn_test2:
POP @test2_b
INC @test2_b
RET
`],[`#pragma optimizationLevel 0
#include APIFunctions
long a;Set_A1(a);`,!1,`^declare r0
^declare r1
^declare r2
^declare a

FUN set_A1 $a
FIN
`],[`#pragma optimizationLevel 0
#include APIFunctions
Set_A1();`,!0,""],[`#pragma optimizationLevel 0
long *a; a=test(); long *test(void) { long b; return &b; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare test_b

JSR :__fn_test
POP @a
FIN

__fn_test:
SET @r0 #0000000000000004
PSH $r0
RET
`],["long a; a=test(); long *test(void) { long b; return &b; }",!0,""],["long *a; a=test(); long *test(void) { long b; return b; }",!0,""],["struct KOMBI { long driver; long collector; long passenger; } car, car2; car = teste(); struct KOMBI teste(void){ return car; }",!0,""],["Declarations",null,"div"],["long ,b;",!0,""],["Improvements v0.3",null,""],["struct KOMBI { long driver, collector, passenger; } *val; val = teste(); val = test2(); struct KOMBI *teste(void) { struct KOMBI tt2; return &tt2; } struct KOMBI *test2(void) { struct KOMBI *stt2; return stt2; }",!1,`^declare r0
^declare r1
^declare r2
^declare val
^declare teste_tt2_driver
^declare teste_tt2_collector
^declare teste_tt2_passenger
^declare test2_stt2

JSR :__fn_teste
POP @r0
SET @val $r0
JSR :__fn_test2
POP @r0
SET @val $r0
FIN

__fn_teste:
SET @r0 #0000000000000004
PSH $r0
RET

__fn_test2:
PSH $test2_stt2
RET
`],["struct KOMBI { long driver, collector, passenger; } *val; val = teste(); struct KOMBI *teste(void) { struct KOMBI tt2; return tt2; }",!0,""],["long valLong = teste()[1]; long *teste(void) { long message[4]; return message; }",!1,`^declare r0
^declare r1
^declare r2
^declare valLong
^declare teste_message
^const SET @teste_message #0000000000000005
^declare teste_message_0
^declare teste_message_1
^declare teste_message_2
^declare teste_message_3

JSR :__fn_teste
POP @valLong
SET @r0 #0000000000000001
SET @valLong $($valLong + $r0)
FIN

__fn_teste:
PSH $teste_message
RET
`],[`#pragma optimizationLevel 0
long a; long counter = 0; a = fibbonacci(12); 
long fibbonacci(long n) {if(n == 0){ return 0; } else if(n == 1) { return 1; } else { return (fibbonacci(n-1) + fibbonacci(n-2)); } }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare counter
^declare fibbonacci_n

CLR @counter
SET @a #000000000000000c
PSH $a
JSR :__fn_fibbonacci
POP @a
FIN

__fn_fibbonacci:
POP @fibbonacci_n
BNZ $fibbonacci_n :__if1_else
__if1_start:
CLR @r0
PSH $r0
RET
JMP :__if1_endif
__if1_else:
SET @r0 #0000000000000001
BNE $fibbonacci_n $r0 :__if2_else
__if2_start:
SET @r0 #0000000000000001
PSH $r0
RET
JMP :__if2_endif
__if2_else:
PSH $fibbonacci_n
SET @r0 $fibbonacci_n
DEC @r0
PSH $r0
JSR :__fn_fibbonacci
POP @r0
POP @fibbonacci_n
PSH $fibbonacci_n
PSH $r0
SET @r1 $fibbonacci_n
SET @r2 #0000000000000002
SUB @r1 $r2
PSH $r1
JSR :__fn_fibbonacci
POP @r1
POP @r0
POP @fibbonacci_n
ADD @r0 $r1
PSH $r0
RET
__if2_endif:
__if1_endif:
CLR @r0
PSH $r0
RET
`],["struct KOMBI { long driver; long collector; long passenger; } *pstruct; long *plong; void * pvoid; pvoid = plong; plong = pvoid; pvoid = pstruct; pstruct = pvoid;",!1,`^declare r0
^declare r1
^declare r2
^declare pstruct
^declare plong
^declare pvoid

SET @pvoid $plong
SET @plong $pvoid
SET @pvoid $pstruct
SET @pstruct $pvoid
FIN
`],[`struct KOMBI { long driver; long collector; long passenger; } *pstruct; long *plong; void * pvoid;
teste(pvoid, pvoid); teste(pvoid, pstruct); plong = ret(pvoid, plong); pstruct = ret(pvoid, plong);
void teste( long *aa, void *bb) { aa++, bb++; }
void *ret(long *aa, void *bb) { aa++; return aa; }`,!1,`^declare r0
^declare r1
^declare r2
^declare pstruct
^declare plong
^declare pvoid
^declare teste_aa
^declare teste_bb
^declare ret_aa
^declare ret_bb

PSH $pvoid
PSH $pvoid
JSR :__fn_teste
PSH $pstruct
PSH $pvoid
JSR :__fn_teste
PSH $plong
PSH $pvoid
JSR :__fn_ret
POP @r0
SET @plong $r0
PSH $plong
PSH $pvoid
JSR :__fn_ret
POP @r0
SET @pstruct $r0
FIN

__fn_teste:
POP @teste_aa
POP @teste_bb
INC @teste_aa
INC @teste_bb
RET

__fn_ret:
POP @ret_aa
POP @ret_bb
INC @ret_aa
PSH $ret_aa
RET
`],[`#pragma optimizationLevel 0
long *plong; plong = malloc(); void *malloc(void) { if (current >=20) { return NULL; } long current++; long mem[20]; return (&mem[current]); }`,!1,`^declare r0
^declare r1
^declare r2
^declare plong
^declare malloc_current
^declare malloc_mem
^const SET @malloc_mem #0000000000000006
^declare malloc_mem_0
^declare malloc_mem_1
^declare malloc_mem_2
^declare malloc_mem_3
^declare malloc_mem_4
^declare malloc_mem_5
^declare malloc_mem_6
^declare malloc_mem_7
^declare malloc_mem_8
^declare malloc_mem_9
^declare malloc_mem_10
^declare malloc_mem_11
^declare malloc_mem_12
^declare malloc_mem_13
^declare malloc_mem_14
^declare malloc_mem_15
^declare malloc_mem_16
^declare malloc_mem_17
^declare malloc_mem_18
^declare malloc_mem_19

JSR :__fn_malloc
POP @plong
FIN

__fn_malloc:
SET @r0 #0000000000000014
BLT $malloc_current $r0 :__if1_endif
__if1_start:
CLR @r0
PSH $r0
RET
__if1_endif:
INC @malloc_current
SET @r0 $malloc_mem
ADD @r0 $malloc_current
PSH $r0
RET
`],["long a, b, *c, *d[2]; c = d[1]; a = *d[1]; a++; c = d[b]; a = *d[b]; a++; d[0]=c; *d[1]=a; a++; d[b]=c; *d[b]=a;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^const SET @d #0000000000000007
^declare d_0
^declare d_1

SET @c $d_1
SET @a $d_1
SET @a $($a)
INC @a
SET @c $($d + $b)
SET @a $($d + $b)
SET @a $($a)
INC @a
SET @d_0 $c
SET @r0 $d_1
SET @($r0) $a
INC @a
SET @($d + $b) $c
SET @r0 $($d + $b)
SET @($r0) $a
FIN
`],["struct KOMBI { long driver, collector, passenger[3][3]; } car; long a, b, c; car.passenger[2][2]=c; car.passenger[a][2]=c; car.passenger[2][b]=c; car.passenger[a][b]=c; c=car.passenger[2][2]; c=car.passenger[a][2]; c=car.passenger[2][b]; c=car.passenger[a][b];",!1,`^declare r0
^declare r1
^declare r2
^declare car_driver
^declare car_collector
^declare car_passenger
^const SET @car_passenger #0000000000000006
^declare car_passenger_0
^declare car_passenger_1
^declare car_passenger_2
^declare car_passenger_3
^declare car_passenger_4
^declare car_passenger_5
^declare car_passenger_6
^declare car_passenger_7
^declare car_passenger_8
^declare a
^declare b
^declare c

SET @car_passenger_8 $c
SET @r0 #0000000000000003
MUL @r0 $a
INC @r0
INC @r0
SET @($car_passenger + $r0) $c
SET @r0 $b
SET @r1 #0000000000000006
ADD @r0 $r1
SET @($car_passenger + $r0) $c
SET @r0 #0000000000000003
MUL @r0 $a
ADD @r0 $b
SET @($car_passenger + $r0) $c
SET @c $car_passenger_8
SET @c #0000000000000003
MUL @c $a
INC @c
INC @c
SET @c $($car_passenger + $c)
SET @c $b
SET @r0 #0000000000000006
ADD @c $r0
SET @c $($car_passenger + $c)
SET @c #0000000000000003
MUL @c $a
ADD @c $b
SET @c $($car_passenger + $c)
FIN
`],["long a, b[4], c[3][3]; struct KOMBI { long driver; long passenger[6]; } car[2]; a=b.length; a=c.length; a=car.length; a=car[1].passenger.length; a=car[a].passenger.length;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^const SET @b #0000000000000005
^declare b_0
^declare b_1
^declare b_2
^declare b_3
^declare c
^const SET @c #000000000000000a
^declare c_0
^declare c_1
^declare c_2
^declare c_3
^declare c_4
^declare c_5
^declare c_6
^declare c_7
^declare c_8
^declare car
^const SET @car #0000000000000014
^declare car_0_driver
^declare car_0_passenger
^const SET @car_0_passenger #0000000000000016
^declare car_0_passenger_0
^declare car_0_passenger_1
^declare car_0_passenger_2
^declare car_0_passenger_3
^declare car_0_passenger_4
^declare car_0_passenger_5
^declare car_1_driver
^declare car_1_passenger
^const SET @car_1_passenger #000000000000001e
^declare car_1_passenger_0
^declare car_1_passenger_1
^declare car_1_passenger_2
^declare car_1_passenger_3
^declare car_1_passenger_4
^declare car_1_passenger_5

SET @a #0000000000000004
SET @a #0000000000000009
SET @a #0000000000000002
SET @a #0000000000000006
SET @a #0000000000000006
FIN
`],["long a; struct KOMBI { long driver; long passenger[6]; } *pcar; a=pcar->passenger.length;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare pcar

SET @a #0000000000000006
FIN
`],["struct KOMBI { long driver; long collector; struct KOMBI *next; } ; struct KOMBI car, *pcar, *pnext; pcar=&car; pnext=pcar->next->next;",!1,`^declare r0
^declare r1
^declare r2
^declare car_driver
^declare car_collector
^declare car_next
^declare pcar
^declare pnext

SET @pcar #0000000000000003
SET @r1 #0000000000000002
SET @r0 $($pcar + $r1)
SET @r1 #0000000000000002
SET @pnext $($r0 + $r1)
FIN
`],[`#pragma optimizationLevel 0
#program activationAmount 0
long table[20];
void main (void) { const long a = 0; while (true) { table[a] = fibbonacci(a); halt; a++; } }
long fibbonacci(long n) { if(n == 0){ return 0; } else if(n == 1) { return 1; } else { return (fibbonacci(n-1) + fibbonacci(n-2)); } }
void catch(void) { long a++; }`,!1,`^program activationAmount 0
^declare r0
^declare r1
^declare r2
^declare table
^const SET @table #0000000000000004
^declare table_0
^declare table_1
^declare table_2
^declare table_3
^declare table_4
^declare table_5
^declare table_6
^declare table_7
^declare table_8
^declare table_9
^declare table_10
^declare table_11
^declare table_12
^declare table_13
^declare table_14
^declare table_15
^declare table_16
^declare table_17
^declare table_18
^declare table_19
^declare main_a
^declare fibbonacci_n
^declare catch_a

ERR :__fn_catch
JMP :__fn_main

__fn_main:
PCS
^const SET @main_a #0000000000000000
__loop1_continue:
__loop1_start:
PSH $main_a
JSR :__fn_fibbonacci
POP @r0
SET @($table + $main_a) $r0
STP
INC @main_a
JMP :__loop1_continue
__loop1_break:
FIN

__fn_fibbonacci:
POP @fibbonacci_n
BNZ $fibbonacci_n :__if2_else
__if2_start:
CLR @r0
PSH $r0
RET
JMP :__if2_endif
__if2_else:
SET @r0 #0000000000000001
BNE $fibbonacci_n $r0 :__if3_else
__if3_start:
SET @r0 #0000000000000001
PSH $r0
RET
JMP :__if3_endif
__if3_else:
PSH $fibbonacci_n
SET @r0 $fibbonacci_n
DEC @r0
PSH $r0
JSR :__fn_fibbonacci
POP @r0
POP @fibbonacci_n
PSH $fibbonacci_n
PSH $r0
SET @r1 $fibbonacci_n
SET @r2 #0000000000000002
SUB @r1 $r2
PSH $r1
JSR :__fn_fibbonacci
POP @r1
POP @r0
POP @fibbonacci_n
ADD @r0 $r1
PSH $r0
RET
__if3_endif:
__if2_endif:
CLR @r0
PSH $r0
RET

__fn_catch:
PCS
INC @catch_a
FIN
`],[`#pragma optimizationLevel 0
long b, a = 0; while (true) { a++; } void catch(void) { long a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare b
^declare a
^declare catch_a

ERR :__fn_catch
CLR @a
__loop1_continue:
__loop1_start:
INC @a
JMP :__loop1_continue
__loop1_break:
FIN

__fn_catch:
PCS
INC @catch_a
FIN
`],[`#pragma optimizationLevel 0
long b, a = 0; void catch(void) { if (a) return; a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare b
^declare a

ERR :__fn_catch
CLR @a
FIN

__fn_catch:
PCS
BZR $a :__if1_endif
__if1_start:
FIN
__if1_endif:
INC @a
FIN
`],[`#pragma optimizationLevel 0
const long n233 = 233; long a, b[2]; b[a]=233; b[0]=233; while (a<233) { a++; };`,!1,`^declare r0
^declare r1
^declare r2
^declare n233
^declare a
^declare b
^const SET @b #0000000000000006
^declare b_0
^declare b_1

^const SET @n233 #00000000000000e9
SET @($b + $a) $n233
SET @b_0 $n233
__loop1_continue:
BGE $a $n233 :__loop1_break
__loop1_start:
INC @a
JMP :__loop1_continue
__loop1_break:
FIN
`],['const long n2 = 2; struct KOMBI { long driver; long collector; long passenger; } *pcar; pcar->passenger="Ze";',!1,`^declare r0
^declare r1
^declare r2
^declare n2
^declare pcar

^const SET @n2 #0000000000000002
SET @r0 #000000000000655a
SET @($pcar + $n2) $r0
FIN
`],[`#pragma optimizationLevel 0
#program codeStackPages    10   
long a; void test(void) { a++; return; a++; }`,!1,`^program codeStackPages 10
^declare r0
^declare r1
^declare r2
^declare a

FIN

__fn_test:
INC @a
RET
INC @a
RET
`],[`#pragma optimizationLevel 0
#program codeStackPages    0   
#program userStackPages 5
 long a; void test(long aa) { a++; return; a++; }`,!1,`^program userStackPages 5
^declare r0
^declare r1
^declare r2
^declare a
^declare test_aa

FIN

__fn_test:
POP @test_aa
INC @a
RET
INC @a
RET
`],[`#program codeStackPages a
#program userStackPages  0
long a; void test(void) { a++; return; a++; }`,!0,""],[`#pragma outputSourceLineNumber
long a=5;
if (a==6){
a--;
}
#pragma optimizationLevel 0
`,!1,`^declare r0
^declare r1
^declare r2
^declare a

^comment line 3
SET @a #0000000000000005
^comment line 4
SET @r0 #0000000000000006
BNE $a $r0 :__if1_endif
__if1_start:
^comment line 5
DEC @a
__if1_endif:
FIN
`],["optimizationLevel 3",null,"div"],[`#pragma optimizationLevel 3
long a,b; for (a=0;a<10;a++) { b++; } b--;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

CLR @a
__loop1_condition:
SET @r0 #000000000000000a
BGE $a $r0 :__loop1_break
INC @b
INC @a
JMP :__loop1_condition
__loop1_break:
DEC @b
FIN
`],[`#pragma optimizationLevel 3
long a,b; while (b) {a++; while (1) { if (a) break;  } } a++;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

__loop1_continue:
BZR $b :__loop1_break
INC @a
__loop2_continue:
BNZ $a :__loop1_continue
JMP :__loop2_continue
__loop1_break:
INC @a
FIN
`],[`#pragma optimizationLevel 3
long a,b; if (!b) {a++; } b++;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BNZ $b :__if1_endif
INC @a
__if1_endif:
INC @b
FIN
`],[`#pragma optimizationLevel 3
long a,b; void main (void) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b


PCS
INC @a
FIN
`],[`#pragma optimizationLevel 3
long a,b; if (!b) {a++; } else { b++;} `,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

BNZ $b :__if1_else
INC @a
FIN
__if1_else:
INC @b
FIN
`],[`#pragma optimizationLevel 3
long a,b; test(); void test (void) { if (a) a++; else b++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

JSR :__fn_test
FIN

__fn_test:
BZR $a :__if1_else
INC @a
RET
__if1_else:
INC @b
RET
`],[`#pragma optimizationLevel 3
long a,b; test(); exit; a++; void test (void) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

JSR :__fn_test
FIN

__fn_test:
INC @a
RET
`],[`#pragma optimizationLevel 3
long a,b; test(); void test (void) { return; a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

JSR :__fn_test
FIN

__fn_test:
RET
`],[`#pragma optimizationLevel 3
long a,b; test(); void test (void) { if (a) a++; else b++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

JSR :__fn_test
FIN

__fn_test:
BZR $a :__if1_else
INC @a
RET
__if1_else:
INC @b
RET
`],[`#pragma optimizationLevel 3
long a, b, c, d; a=(b*c)*d;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d

SET @a $b
MUL @a $c
MUL @a $d
FIN
`],[`#pragma optimizationLevel 3
long a[4][2], *b, c,d; b=&a[c][d];`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare a_4
^declare a_5
^declare a_6
^declare a_7
^declare b
^declare c
^declare d

SET @r0 #0000000000000002
MUL @r0 $c
ADD @r0 $d
SET @b $a
ADD @b $r0
FIN
`],[`#pragma optimizationLevel 3
 long a; a=0; void test(void){ a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

CLR @a
FIN

`],[`#pragma optimizationLevel 3
struct KOMBI { long driver; long collector; long passenger; } ;struct KOMBI car, *pcar;long a, b, *c, d[2],z;pcar=&car;
pcar->passenger='Ze';
pcar->driver=a;
b+=-a;
a=0;
d[a]=5;
for (a=0;a<10;a++) d[a]=1;

pcar->driver=*c;pcar->driver=d[1];pcar->driver=d[a];pcar->driver=pcar->collector;
a=pcar->collector;z++;*c=pcar->driver;d[1]=pcar->collector;d[a]=pcar->collector;`,!1,`^declare r0
^declare r1
^declare r2
^declare car_driver
^declare car_collector
^declare car_passenger
^declare pcar
^declare a
^declare b
^declare c
^declare d
^const SET @d #000000000000000b
^declare d_0
^declare d_1
^declare z

SET @pcar #0000000000000003
SET @r0 #000000000000655a
SET @r1 #0000000000000002
SET @($pcar + $r1) $r0
SET @($pcar) $a
CLR @r0
SUB @r0 $a
ADD @b $r0
SET @r0 #0000000000000005
SET @($d) $r0
CLR @a
__loop1_condition:
SET @r0 #000000000000000a
BGE $a $r0 :__loop1_break
SET @r0 #0000000000000001
SET @($d + $a) $r0
INC @a
JMP :__loop1_condition
__loop1_break:
SET @r0 $($c)
SET @($pcar) $r0
SET @($pcar) $d_1
SET @r0 $($d + $a)
SET @($pcar) $r0
SET @r1 #0000000000000001
SET @r0 $($pcar + $r1)
SET @($pcar) $r0
SET @r0 #0000000000000001
SET @a $($pcar + $r0)
INC @z
SET @r0 $($pcar)
SET @($c) $r0
SET @r0 #0000000000000001
SET @d_1 $($pcar + $r0)
SET @r1 #0000000000000001
SET @r0 $($pcar + $r1)
SET @($d + $a) $r0
FIN
`],[`#pragma optimizationLevel 3
 long d[2]; d[1]=d[1]+1;`,!1,`^declare r0
^declare r1
^declare r2
^declare d
^const SET @d #0000000000000004
^declare d_0
^declare d_1

INC @d_1
FIN
`],[`#pragma optimizationLevel 3
#pragma maxConstVars 3
struct KOMBI { long driver; long collector; long passenger; } ;struct KOMBI car, *pcar;long a, b, *c, d[2],z;pcar=&car;
pcar->passenger='Ze';
pcar->driver=a;
b+=-a;
a=0;
d[a]=5;
for (a=0;a<10;a++) d[a]=1;

pcar->driver=*c;pcar->driver=d[1];pcar->driver=d[a];pcar->driver=pcar->collector;
a=pcar->collector;z++;*c=pcar->driver;d[1]=pcar->collector;d[a]=pcar->collector;`,!1,`^declare r0
^declare r1
^declare r2
^declare n1
^const SET @n1 #0000000000000001
^declare n2
^const SET @n2 #0000000000000002
^declare n3
^const SET @n3 #0000000000000003
^declare car_driver
^declare car_collector
^declare car_passenger
^declare pcar
^declare a
^declare b
^declare c
^declare d
^const SET @d #000000000000000e
^declare d_0
^declare d_1
^declare z

SET @pcar #0000000000000006
SET @r0 #000000000000655a
SET @($pcar + $n2) $r0
SET @($pcar) $a
CLR @r0
SUB @r0 $a
ADD @b $r0
SET @r0 #0000000000000005
SET @($d) $r0
CLR @a
__loop1_condition:
SET @r0 #000000000000000a
BGE $a $r0 :__loop1_break
SET @($d + $a) $n1
INC @a
JMP :__loop1_condition
__loop1_break:
SET @r0 $($c)
SET @($pcar) $r0
SET @($pcar) $d_1
SET @r0 $($d + $a)
SET @($pcar) $r0
SET @r0 $($pcar + $n1)
SET @($pcar) $r0
SET @a $($pcar + $n1)
INC @z
SET @r0 $($pcar)
SET @($c) $r0
SET @d_1 $($pcar + $n1)
SET @r0 $($pcar + $n1)
SET @($d + $a) $r0
FIN
`],[`#pragma optimizationLevel 3
#pragma maxConstVars 3
long a, b, c; teste(a, 2); void teste(long aa, long bb) { aa=bb;} `,!1,`^declare r0
^declare r1
^declare r2
^declare n1
^const SET @n1 #0000000000000001
^declare n2
^const SET @n2 #0000000000000002
^declare n3
^const SET @n3 #0000000000000003
^declare a
^declare b
^declare c
^declare teste_aa
^declare teste_bb

PSH $n2
PSH $a
JSR :__fn_teste
FIN

__fn_teste:
POP @teste_aa
POP @teste_bb
SET @teste_aa $teste_bb
RET
`],[`#pragma optimizationLevel 3
#pragma maxConstVars 3
sleep 1;`,!1,`^declare r0
^declare r1
^declare r2
^declare n1
^const SET @n1 #0000000000000001
^declare n2
^const SET @n2 #0000000000000002
^declare n3
^const SET @n3 #0000000000000003

SLP $n1
FIN
`],[`#pragma optimizationLevel 3
 long a,b; if ( a==4 && (b || a )) { a++; a=4;} b++;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @r0 #0000000000000004
BNE $a $r0 :__if1_endif
BNZ $b :__if1_start
BZR $a :__if1_endif
__if1_start:
INC @a
SET @a #0000000000000004
__if1_endif:
INC @b
FIN
`],[`#pragma optimizationLevel 3
 long a,b, c; if ( a==4 && (b || a>c )) { a++; a=4; } b++;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c

SET @r0 #0000000000000004
BNE $a $r0 :__if1_endif
BNZ $b :__if1_start
BLE $a $c :__if1_endif
__if1_start:
INC @a
SET @a #0000000000000004
__if1_endif:
INC @b
FIN
`],[`#pragma optimizationLevel 3
 long a; a=~a;`,!1,`^declare r0
^declare r1
^declare r2
^declare a

NOT @a
FIN
`],[`#pragma optimizationLevel 3
 long a, b; tt(teste(b)); long teste(long c){ return ++c; } void tt(long d){ d++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare teste_c
^declare tt_d

PSH $b
JSR :__fn_teste
JSR :__fn_tt
FIN

__fn_teste:
POP @teste_c
INC @teste_c
PSH $teste_c
RET

__fn_tt:
POP @tt_d
INC @tt_d
RET
`],[`#pragma optimizationLevel 3
 long a, b; /* No opt: interference with reuseVariable */ a=teste(teste(b)); tt(a); long teste(long c){ return ++c; } void tt(long d){ d++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare teste_c
^declare tt_d

PSH $b
JSR :__fn_teste
POP @a
PSH $a
JSR :__fn_teste
POP @a
PSH $a
JSR :__fn_tt
FIN

__fn_teste:
POP @teste_c
INC @teste_c
PSH $teste_c
RET

__fn_tt:
POP @tt_d
INC @tt_d
RET
`],["const keyword",null,"div"],[`struct KOMBI { long driver; long collector; long passenger[4]; } car[2]; long a, b, *c, d[2];
const a=353; const d[1]=354; const car[1].driver=355; const car[0].passenger[1]=356;`,!1,`^declare r0
^declare r1
^declare r2
^declare car
^const SET @car #0000000000000004
^declare car_0_driver
^declare car_0_collector
^declare car_0_passenger
^const SET @car_0_passenger #0000000000000007
^declare car_0_passenger_0
^declare car_0_passenger_1
^declare car_0_passenger_2
^declare car_0_passenger_3
^declare car_1_driver
^declare car_1_collector
^declare car_1_passenger
^const SET @car_1_passenger #000000000000000e
^declare car_1_passenger_0
^declare car_1_passenger_1
^declare car_1_passenger_2
^declare car_1_passenger_3
^declare a
^declare b
^declare c
^declare d
^const SET @d #0000000000000016
^declare d_0
^declare d_1

^const SET @a #0000000000000161
^const SET @d_1 #0000000000000162
^const SET @car_1_driver #0000000000000163
^const SET @car_0_passenger_1 #0000000000000164
FIN
`],["long a, b, *c, d[2]; a++; const long e=5; a++;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^const SET @d #0000000000000007
^declare d_0
^declare d_1
^declare e

INC @a
^const SET @e #0000000000000005
INC @a
FIN
`],["long a, b, *c, d[2]; a++; const long e=5; a++; e++;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^const SET @d #0000000000000007
^declare d_0
^declare d_1
^declare e

INC @a
^const SET @e #0000000000000005
INC @a
INC @e
FIN
`],["long a, b, *c, d[2]; a++; const long e=5; const a=2;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^const SET @d #0000000000000007
^declare d_0
^declare d_1
^declare e

INC @a
^const SET @e #0000000000000005
^const SET @a #0000000000000002
FIN
`],["long a, b, *c, d[2]; a++; const b=3+3+4;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^const SET @d #0000000000000007
^declare d_0
^declare d_1

INC @a
^const SET @b #000000000000000a
FIN
`],["long a, b, *c, d[2]; const d=&a;",!0,""],["long a, b, *c, d[2]; const long e=3; a++; const e=4;",!0,""],["long a, b, *c, d[2]; a++; const b=3+3+4;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare c
^declare d
^const SET @d #0000000000000007
^declare d_0
^declare d_1

INC @a
^const SET @b #000000000000000a
FIN
`],["long a[3]; const a[]='alow'; a[]='tchau';",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2

^const SET @a_0 #00000000776f6c61
^const SET @a_1 #0000000000000000
^const SET @a_2 #0000000000000000
SET @a_0 #0000007561686374
CLR @a_1
CLR @a_2
FIN
`],["long a, b[5]; b[]=&a;",!0,""],["macro program",null,"div"],[`#program name tEst2
 long a;  a++;`,!1,`^program name tEst2
^declare r0
^declare r1
^declare r2
^declare a

INC @a
FIN
`],[`#program description test teste tesssttt
 long a;  a++;`,!1,`^program description test teste tesssttt
^declare r0
^declare r1
^declare r2
^declare a

INC @a
FIN
`],[`#program activationAmount 100000
 long a;  a++;`,!1,`^program activationAmount 100000
^declare r0
^declare r1
^declare r2
^declare a

INC @a
FIN
`],[`#program name test-2
 long a;  a++;`,!0,""],[`#program name test2 d
 long a;  a++;`,!0,""],[`#program activationAmount 0xff
 long a;  a++;`,!0,""],["#program activationAmount 5_0000_0000",!1,`^program activationAmount 500000000
^declare r0
^declare r1
^declare r2

FIN
`],["macro define",null,"div"],[`#define MAX 4
long a; a=MAX; long MAXimus=2;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare MAXimus

SET @a #0000000000000004
SET @MAXimus #0000000000000002
FIN
`],[`#define MAX 4
 long a; a=MAX;
 #define MAX 2
 long MAXimus=MAX;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare MAXimus

SET @a #0000000000000004
SET @MAXimus #0000000000000002
FIN
`],[`#define MAX 4
 long a; a=MAX;
 #define MAX 
 long MAXimus=MAX;`,!0,""],[`#define 444 4
long a; a=444;
 #undef 444
long MAXimus=444;`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare MAXimus

SET @a #0000000000000004
SET @MAXimus #00000000000001bc
FIN
`],[`#pragma optimizationLevel 0
#define MAX 4
#define MAX1 (MAX + 1)
 long a; if (a > MAX1) a++;`,!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 #0000000000000005
BLE $a $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],[`#pragma optimizationLevel 0
#define MAX 4
#define MAX1 (MAX + 1)
#undef MAX
 long a; if (a > MAX1) a++;`,!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @r0 #0000000000000005
BLE $a $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],["macro ifdef",null,"div"],[`#define debug
#ifdef debug
#pragma maxAuxVars 1
#endif
long a; a++;`,!1,`^declare r0
^declare a

INC @a
FIN
`],[`#ifdef debug
#pragma maxAuxVars 1
#endif
long a; a++;`,!1,`^declare r0
^declare r1
^declare r2
^declare a

INC @a
FIN
`],[`#ifdef debug
#pragma maxAuxVars 1
#else
#pragma maxAuxVars 5
#endif
long a; a++;`,!1,`^declare r0
^declare r1
^declare r2
^declare r3
^declare r4
^declare a

INC @a
FIN
`],[`#define A1
#define A2

#ifdef A1
long a1;
# ifdef A2
long a2;
# endif
#endif

#ifdef A1
a1++;
#endif

#ifdef A2
a2++;
#endif`,!1,`^declare r0
^declare r1
^declare r2
^declare a1
^declare a2

INC @a1
INC @a2
FIN
`],[`#define A1

#ifdef A1
long a1;
# ifdef A2
long a2;
# endif
#endif

#ifdef A1
a1++;
#endif

#ifdef A2
a2++;
#endif`,!1,`^declare r0
^declare r1
^declare r2
^declare a1

INC @a1
FIN
`],[`#ifdef A1
long a1;
# ifdef A2
long a2;
# endif
#endif

#ifdef A1
a1++;
#endif

#ifdef A2
a2++;
#endif`,!1,`^declare r0
^declare r1
^declare r2

FIN
`],[`#define A2

#ifdef A1
long a1;
# ifdef A2
long a2;
# endif
#endif

#ifdef A1
a1++;
#endif

#ifdef A2
a2++;
#endif`,!0,""],["Bug fixes",null,"div"],[`#pragma optimizationLevel 0
void  teste(long ret) { long temp = 2; goto newlabel; ret = temp; newlabel: temp++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare teste_ret
^declare teste_temp

FIN

__fn_teste:
POP @teste_ret
SET @teste_temp #0000000000000002
JMP :newlabel
SET @teste_ret $teste_temp
newlabel:
INC @teste_temp
RET
`],[`#pragma optimizationLevel 0
void  teste(long * ret) { long temp = 2; goto newlabel; ret[temp] = temp; newlabel: temp++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare teste_ret
^declare teste_temp

FIN

__fn_teste:
POP @teste_ret
SET @teste_temp #0000000000000002
JMP :newlabel
SET @($teste_ret + $teste_temp) $teste_temp
newlabel:
INC @teste_temp
RET
`],[`#pragma optimizationLevel 0
void  teste(long * ret) { long temp = 2; goto newlabel; *(ret+temp) = temp; newlabel: temp++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare teste_ret
^declare teste_temp

FIN

__fn_teste:
POP @teste_ret
SET @teste_temp #0000000000000002
JMP :newlabel
SET @r0 $teste_ret
ADD @r0 $teste_temp
SET @($r0) $teste_temp
newlabel:
INC @teste_temp
RET
`],[`#pragma optimizationLevel 0
#pragma maxAuxVars 2
long itoa(long val) {
    long ret, temp;
    if (val >= 0 && val <= 99999999) { ret = (ret << 8) + temp; return ret; }
    return '#error';
}`,!1,`^declare r0
^declare r1
^declare itoa_val
^declare itoa_ret
^declare itoa_temp

FIN

__fn_itoa:
POP @itoa_val
CLR @r0
BLT $itoa_val $r0 :__if1_endif
__AND_2_next:
SET @r0 #0000000005f5e0ff
BGT $itoa_val $r0 :__if1_endif
JMP :__if1_start
__if1_start:
SET @r0 $itoa_ret
SET @r1 #0000000000000008
SHL @r0 $r1
ADD @r0 $itoa_temp
SET @itoa_ret $r0
PSH $itoa_ret
RET
__if1_endif:
SET @r0 #0000726f72726523
PSH $r0
RET
`],["long a=0; long b; a++; long a=3;",!0,""],["long a=0; long b; a++; void test(void) { a++; } long tt(void) { a++;} long test(void) {a++; return a; }",!0,""],["long a=0; long b; a++; void test(void) { a++; } long tt(void) { a++;} long test(void) {a++; return a; }",!0,""],[`#pragma optimizationLevel 0
long a=0; void Get_B1(void) { a++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a

CLR @a
FIN

__fn_Get_B1:
INC @a
RET
`],[`#include APIFunctions
long a=0; void Get_B1(void) { a++; }`,!0,""],["long a=0; mylabel: a++; void temp(void) { a++; mylabel: a++; }",!0,""],[`#pragma optimizationLevel 0
void test(void) { long t, a; t = a+1; }`,!1,`^declare r0
^declare r1
^declare r2
^declare test_t
^declare test_a

FIN

__fn_test:
SET @test_t $test_a
INC @test_t
RET
`],[`#pragma optimizationLevel 0
void test(void) { long t[2], a; t[a] = 1; }`,!1,`^declare r0
^declare r1
^declare r2
^declare test_t
^const SET @test_t #0000000000000004
^declare test_t_0
^declare test_t_1
^declare test_a

FIN

__fn_test:
SET @r0 #0000000000000001
SET @($test_t + $test_a) $r0
RET
`],["long ga, gb, gc; test(ga, gb, gc); void test(long a, long b, long c) { a+=b+c; }",!1,`^declare r0
^declare r1
^declare r2
^declare ga
^declare gb
^declare gc
^declare test_a
^declare test_b
^declare test_c

PSH $gc
PSH $gb
PSH $ga
JSR :__fn_test
FIN

__fn_test:
POP @test_a
POP @test_b
POP @test_c
SET @r0 $test_b
ADD @r0 $test_c
ADD @test_a $r0
RET
`],["long a[2], b; a[1]=b+1;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare b

SET @a_1 $b
INC @a_1
FIN
`],[`#pragma optimizationLevel 0
long b; void teste(long * poper) { poper[3]=0; }`,!1,`^declare r0
^declare r1
^declare r2
^declare b
^declare teste_poper

FIN

__fn_teste:
POP @teste_poper
CLR @r0
SET @r1 #0000000000000003
SET @($teste_poper + $r1) $r0
RET
`],["long a, b; teste(a, b); void teste(long *fa, long fb) { fb++; }",!0,""],["long * a, b; teste(a, b); void teste(long *fa, long fb) { fb++; }",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare teste_fa
^declare teste_fb

PSH $b
PSH $a
JSR :__fn_teste
FIN

__fn_teste:
POP @teste_fa
POP @teste_fb
INC @teste_fb
RET
`],["long * a, b; teste(a, *a); void teste(long *fa, long fb) { fb++; }",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare teste_fa
^declare teste_fb

SET @r0 $($a)
PSH $r0
PSH $a
JSR :__fn_teste
FIN

__fn_teste:
POP @teste_fa
POP @teste_fb
INC @teste_fb
RET
`],["long * a, b; teste(&b, b); void teste(long *fa, long fb) { fb++; }",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare teste_fa
^declare teste_fb

PSH $b
SET @r0 #0000000000000004
PSH $r0
JSR :__fn_teste
FIN

__fn_teste:
POP @teste_fa
POP @teste_fb
INC @teste_fb
RET
`],[`struct KOMBI { long driver; long collector; long passenger; } ;struct KOMBI car, *pcar;long a, b;pcar=&car;
 teste(car);
 void teste(struct KOMBI * value) { value->driver = 'Z\xE9'; }`,!0,""],[`struct KOMBI { long driver; long collector; long passenger; } ;struct KOMBI car, *pcar;long a, b;pcar=&car;
 teste(pcar);
 void teste(struct KOMBI * value) { value->driver = 'Z\xE9'; }`,!1,`^declare r0
^declare r1
^declare r2
^declare car_driver
^declare car_collector
^declare car_passenger
^declare pcar
^declare a
^declare b
^declare teste_value

SET @pcar #0000000000000003
PSH $pcar
JSR :__fn_teste
FIN

__fn_teste:
POP @teste_value
SET @r0 #0000000000a9c35a
SET @($teste_value) $r0
RET
`],[`#include APIFunctions
long * a;Set_A1(a);`,!0,""],["struct KOMBI { long driver; long collector; long passenger[4]; } car; long a, b; ++car.driver; a=car.collector++;",!1,`^declare r0
^declare r1
^declare r2
^declare car_driver
^declare car_collector
^declare car_passenger
^const SET @car_passenger #0000000000000006
^declare car_passenger_0
^declare car_passenger_1
^declare car_passenger_2
^declare car_passenger_3
^declare a
^declare b

INC @car_driver
SET @a $car_collector
INC @car_collector
FIN
`],["struct KOMBI { long driver; long collector; long passenger[4]; } car; long a, b; ++car.passenger[a]; ",!0,""],[`#pragma optimizationLevel 0
long a, b; test2() if (a) a++; long test2(void) { b++; return b; }`,!0,""],[`#pragma optimizationLevel 0
long a, b; test2(); if (a) a++; long test2(void) { b++; return b; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

JSR :__fn_test2
POP @r0
BZR $a :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN

__fn_test2:
INC @b
PSH $b
RET
`],["long a[5], b, c; b=atoi(c); a[b+1]=atoi('2'); a[b+1]=(b*2)/atoi('2'); long atoi(long val){return val+1;}",!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare a_4
^declare b
^declare c
^declare atoi_val

PSH $c
JSR :__fn_atoi
POP @b
SET @r0 $b
INC @r0
PSH $r0
SET @r1 #0000000000000032
PSH $r1
JSR :__fn_atoi
POP @r1
POP @r0
SET @($a + $r0) $r1
SET @r0 $b
INC @r0
SET @r1 #0000000000000002
MUL @r1 $b
PSH $r1
PSH $r0
SET @r2 #0000000000000032
PSH $r2
JSR :__fn_atoi
POP @r2
POP @r0
POP @r1
DIV @r1 $r2
SET @($a + $r0) $r1
FIN

__fn_atoi:
POP @atoi_val
SET @r0 $atoi_val
INC @r0
PSH $r0
RET
`],['long a[5], b, c; b=a[atoi("2")+1]; long atoi(long val){ return val+1;}',!1,`^declare r0
^declare r1
^declare r2
^declare a
^const SET @a #0000000000000004
^declare a_0
^declare a_1
^declare a_2
^declare a_3
^declare a_4
^declare b
^declare c
^declare atoi_val

SET @b #0000000000000032
PSH $b
JSR :__fn_atoi
POP @b
INC @b
SET @b $($a + $b)
FIN

__fn_atoi:
POP @atoi_val
SET @r0 $atoi_val
INC @r0
PSH $r0
RET
`],[`#pragma optimizationLevel 3
while (1) halt; const long n8=8, n10=10, n0xff=0xff; long atoi(long val) { return 3; }`,!1,`^declare r0
^declare r1
^declare r2
^declare n8
^declare n10
^declare n0xff
^declare atoi_val

__loop1_continue:
STP
JMP :__loop1_continue
^const SET @n8 #0000000000000008
^const SET @n10 #000000000000000a
^const SET @n0xff #00000000000000ff

`],[`#pragma optimizationLevel 3
 teste(); exit; const long n0xff=0xff; void teste(void) { const long b=5; b++; }`,!1,`^declare r0
^declare r1
^declare r2
^declare n0xff
^declare teste_b

JSR :__fn_teste
FIN
^const SET @n0xff #00000000000000ff

__fn_teste:
^const SET @teste_b #0000000000000005
INC @teste_b
RET
`],[`#pragma optimizationLevel 3
 long a, b; a=b;insertPlayer(a); void insertPlayer(long address) { long id; id=(address >> 27); }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b
^declare insertPlayer_address
^declare insertPlayer_id

SET @a $b
PSH $a
JSR :__fn_insertPlayer
FIN

__fn_insertPlayer:
POP @insertPlayer_address
SET @insertPlayer_id $insertPlayer_address
SET @r0 #000000000000001b
SHR @insertPlayer_id $r0
RET
`],["long a, slot[4]; sleep slot[a];",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare slot
^const SET @slot #0000000000000005
^declare slot_0
^declare slot_1
^declare slot_2
^declare slot_3

SET @r0 $($slot + $a)
SLP $r0
FIN
`],[`XOR_A_with_B();
#include APIFunctions`,!1,`^declare r0
^declare r1
^declare r2

FUN XOR_A_with_B
FIN
`],["Send_To_Address_In_B(sendEachBlockNQT) sleep SLP_BLOCKS;",!0,""],[`#pragma optimizationLevel 3
long _idx, uCount; _idx = ~(_idx+uCount); uCount = _idx; _idx++;`,!1,`^declare r0
^declare r1
^declare r2
^declare _idx
^declare uCount

SET @r0 $_idx
ADD @r0 $uCount
NOT @r0
SET @_idx $r0
SET @uCount $_idx
INC @_idx
FIN
`],["long a='S-D3HS-T6ML-SJHU-2R5R2';",!1,`^declare r0
^declare r1
^declare r2
^declare a

SET @a #005c77c9272585f8
FIN
`],[`#pragma optimizationLevel 0
struct KOMBI { long driver; long collector; long passenger; }; void teste(void) { struct KOMBI tt2, *stru, tt, *stru2; }`,!1,`^declare r0
^declare r1
^declare r2
^declare teste_tt2_driver
^declare teste_tt2_collector
^declare teste_tt2_passenger
^declare teste_stru
^declare teste_tt_driver
^declare teste_tt_collector
^declare teste_tt_passenger
^declare teste_stru2

FIN

__fn_teste:
RET
`],[`#pragma optimizationLevel 0
long a=0; if (test2(a)){ a++; } long test2(long b) { b++; return b; }`,!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare test2_b

CLR @a
PSH $a
JSR :__fn_test2
POP @r0
BZR $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN

__fn_test2:
POP @test2_b
INC @test2_b
PSH $test2_b
RET
`],[`#pragma optimizationLevel 0
#include APIFunctions
 long a=0; if (Get_A1()){ a++;} `,!1,`^declare r0
^declare r1
^declare r2
^declare a

CLR @a
FUN @r0 get_A1
BZR $r0 :__if1_endif
__if1_start:
INC @a
__if1_endif:
FIN
`],["long a, b; *a + 1 = b",!0,""],["void  teste(long ret) { long temp = 2; if (temp==2){ goto div_end: } ret = temp; div_end: temp++; }",!0,""],[`long a, b; a++; long c, asm { PSH $a
POP @b } b++;`,!0,""],[`#pragma maxConstVars 3
const long a = 1;const long n256 = 256;const long ac = 256;long ad = 256, ae = ac;`,!1,`^declare r0
^declare r1
^declare r2
^declare n1
^const SET @n1 #0000000000000001
^declare n2
^const SET @n2 #0000000000000002
^declare n3
^const SET @n3 #0000000000000003
^declare a
^declare n256
^declare ac
^declare ad
^declare ae

^const SET @a #0000000000000001
^const SET @n256 #0000000000000100
^const SET @ac #0000000000000100
SET @ad $n256
SET @ae $ac
FIN
`],["long doing; doing++;",!1,`^declare r0
^declare r1
^declare r2
^declare doing

INC @doing
FIN
`],["End of tests!",null,""]],Le=[[`FIN
`,!1,"28",""],[`SET @a #0000000000000100
SET @b $a
CLR @b
INC @b
DEC @a
ADD @a $b
SUB @a $b
MUL @a $b
DIV @a $b
BOR @a $b
AND @a $b
XOR @a $b
SET @a $b
NOT @a
SET @a $($b)
SET @a $c
ADD @a $b
SET @a $($b + $c)
PSH $b
JSR :__fn_teste
POP @a
SET @($a) $b
SET @($a + $b) $c
MOD @a $b
SHL @a $b
SHR @a $b
SLP $a
JMP :__fn_main

__fn_teste:
POP @teste_d
SET @r0 $teste_d
INC @r0
PSH $r0
RET

__fn_main:
PCS
INC @a
FIN`,!1,"010000000000010000000000000201000000000000000301000000040100000005000000000600000000010000000700000000010000000800000000010000000900000000010000000a00000000010000000b00000000010000000c00000000010000000200000000010000000d000000000e00000000010000000200000000020000000600000000010000000f000000000100000002000000100100000012e400000011000000001400000000010000001500000000010000000200000016000000000100000017000000000100000018000000000100000025000000001afd0000001103000000020400000003000000040400000010040000001330040000000028",""],[`BZR $a :__if1_endif
INC @b
__if1_endif:
BNZ $a :__if2_endif
INC @b
__if2_endif:
BLE $a $b :__if3_endif
INC @b
__if3_endif:
BGE $a $b :__if4_endif
INC @b
__if4_endif:
BLT $a $b :__if5_endif
INC @b
__if5_endif:
BGT $a $b :__if6_endif
INC @b
__if6_endif:
BNE $a $b :__if7_endif
INC @b
__if7_endif:
BEQ $a $b :__if8_endif
INC @b
__if8_endif:
FIN
`,!1,"1b000000000b04010000001e000000000b04010000002200000000010000000f04010000002100000000010000000f04010000002000000000010000000f04010000001f00000000010000000f04010000002400000000010000000f04010000002300000000010000000f040100000028",""],[`BZR $a :__if1_endif
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
__if1_endif:
INC @b
FIN
`,!1,"1e000000000b1a8d00000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000040100000028",""],[`__loop1_continue:
BZR $a :__loop1_break
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
JMP :__loop1_continue
__loop1_break:
INC @b
FIN
`,!1,"1e000000000b1a850000000100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000001a00000000040100000028",""],[`__loop1_continue:
SET @a #0000000000000001
BNZ $a :__loop1_continue
__loop1_break:
INC @b
FIN`,!1,"010000000001000000000000001e00000000f3040100000028",""],[`__loop1_continue:
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
SET @a #0000000000000001
BNZ $a :__loop1_continue
__loop1_break:
INC @b
FIN`,!1,"010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000000100000000010000000000000001000000000100000000000000010000000001000000000000001b000000000b1a00000000040100000028",""],[`FUN clear_A_B
FUN set_A1 $a
FUN set_A1_A2 $a $b
FUN @a check_A_equals_B
FUN @a add_Minutes_to_Timestamp $b $c
FIN
`,!1,"3222013310010000000034140100000000010000003527010000000037060400000000010000000200000028",""],[`SET @a #0000000000000005
SET @b #0000000000000004
^const SET @c #9887766554433221
INC @a
FIN
`,!1,"0100000000050000000000000001010000000400000000000000040000000028","000000000000000000000000000000002132435465768798"],[`^declare r0
^declare a
^declare b
^declare c

^const SET @c #9887766554433221
SET @a #0000000000000005
SET @b #0000000000000004
INC @a
FIN
`,!1,"0101000000050000000000000001020000000400000000000000040100000028","0000000000000000000000000000000000000000000000002132435465768798"],[`^declare r0
^declare a
^declare b
^declare c

^const SET @c #9887766554433221
^const SET @a #000000000000fafe
SET @b #0000000000000004
INC @a
FIN
`,!1,"01020000000400000000000000040100000028","0000000000000000fefa00000000000000000000000000002132435465768798"],[`FIZ $a
STZ $a
ERR :__error
INC @a
NOP
NOP
__error:
DEC @a`,!1,"260000000027000000002b1600000004000000007f7f0500000000",""],[`BNE $var1 $var15 :lab_aa6
BNE $var1 $var15 :lab_de2
lab_aa6:
SET @var02 #2065726120756f59
SET @var02 #2065726120756f59
SET @var02 #2065726120756f59
SET @var02 #656e776f20746f6e
SET @var02 #65746920666f2072
SET @var02 #0000000000002e6d
FIN
lab_af3:
SET @var02 #65746920666f2072
SET @var02 #65746920666f2072
SET @var02 #65746920666f2072
lab_de2:
FIN
`,!1,"240000000001000000192300000000010000000f1a8f0000000102000000596f7520617265200102000000596f7520617265200102000000596f75206172652001020000006e6f74206f776e65010200000072206f662069746501020000006d2e00000000000028010200000072206f6620697465010200000072206f6620697465010200000072206f662069746528",""]],Be=[[`FIN
`,!1,"28",""],[`FINest
`,!0,"",""],[`FIN
`,!0,"",""],[`FINest
`,!1,"28",""]],we=[["long a, b; a=b;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @a $b
FIN
`],["long a, b; a=c;",!0,""],["long a, b; a=b;",!0,""],["long a, b; a=c;",!1,`^declare r0
^declare r1
^declare r2
^declare a
^declare b

SET @a $b
FIN
`]];function Re(n=!1){let e=0,r=0,a=0;function l(){if(n)return we.forEach(T),Be.forEach(i),e!==4?"Browser test testcases failed.":"Test tescases ok!";let d=Le.map(i),f=he.map(T);return`Tests completed: ${e} Passed; ${r} Failed.

<h3>Assembly tests</h3>`+d.join(`
`)+"<h3>Full tests</h3>"+f.join(`
`)}function i(d,f){let s=!0,_="",C="",b="";try{let O=new X({language:"Assembly",sourceCode:d[0]});O.compile(),_=O.getMachineCode().ByteCode,C=O.getMachineCode().ByteData,s=!1}catch(O){b=O}return d[1]===s&&_===d[2]&&C===d[3]?(e++,`Pass! (${f})`):(r++,`<span style='color:red'>Fail...</span>Code: <span style='color:purple'>${u(d[0])}</span>
GOT: ${_}
Error: ${b}`)}function T(d){if(d[1]===null)return a=0,`<h4>${d[0]}</h4>`;let f=!0,s="",_="";a++;try{let C=new X({language:"C",sourceCode:`#pragma version dev
${d[0]}`});C.compile(),s=C.getAssemblyCode(),f=!1}catch(C){_=C.message}if(d[1]===f&&s===d[2]){e++;let C=`Pass! (${a})Code: <span style='color:blue'>${u(d[0])}</span>`;return _.length>0&&(C+=`
<span style='color:darkgreen'>${_}</span>`),C}return r++,`<span style='color:red'>Fail...</span> (${a})Code: <span style='color:blue'>${u(d[0])}</span> Expected:
${d[2]}
GOT output: ${s}
GOT error:  ${_}`}function u(d){return d.replace(/[\u00A0-\u9999<>&]/g,function(f){return"&#"+f.charCodeAt(0)+";"})}return l()}window.onload=()=>{let n=document.getElementById("source-code");n.addEventListener("keyup",q),n.addEventListener("keydown",q),n.addEventListener("click",q),n.addEventListener("mousedown",De),n.addEventListener("mouseup",q),n.addEventListener("paste",q),document.getElementById("compile").addEventListener("click",Qe),document.getElementById("test").addEventListener("click",dn),document.getElementById("btn_help").addEventListener("click",cn),document.getElementById("source_is_c").addEventListener("click",Pe),document.getElementById("save").addEventListener("click",en),document.getElementById("load").addEventListener("click",nn),document.getElementById("copy_assembly").addEventListener("click",()=>navigator.clipboard.writeText(document.getElementById("assembly_output").innerText)),document.getElementById("source_legend").addEventListener("click",an),document.getElementById("actions_legend").addEventListener("click",tn),document.getElementById("status_legend").addEventListener("click",rn),document.getElementById("assembly_legend").addEventListener("click",ln),document.getElementById("deployment_legend").addEventListener("click",xe),document.querySelectorAll('input[name="deploy"]').forEach(l=>{l.addEventListener("click",on)}),q(),Pe(document.getElementById("source_is_c")),xe().minimize(!0);let r=new X({language:"C",sourceCode:`#pragma version dev
#pragma maxAuxVars 1
long a, b, c; a=b/~c;`});try{r.compile(),r.getMachineCode().MachineCodeHashId==="7488355358104845254"?document.getElementById("status_output").innerHTML='<span class="msg_success">Start up test done!</span>':document.getElementById("status_output").innerHTML='<span class="msg_failure">Start up test failed...</span>'}catch{document.getElementById("status_output").innerHTML='<span class="msg_failure">Start up test crashed...</span>'}document.title=document.title.replace("%version%",r.getCompilerVersion());let a=document.getElementById("h1_title");a.innerHTML=a.innerHTML.replace("%version%",r.getCompilerVersion()),hljs.addPlugin({"after:highlight":l=>{let i='<div class="table">',T=l.value.split(`
`),u=[];i+=T.map((d,f)=>{let s,_,C=0;d=u.join("")+d,u=[];do{let b=d.slice(C);if(s=b.indexOf("<span"),_=b.indexOf("</span"),s===-1&&_===-1)break;if(_===-1||s!==-1&&s<_){let O=/<span .+?>/.exec(b);if(O===null)break;u.push(O[0]),C+=s+O[0].length}else u.pop(),C+=_+1}while(!0);return u.length>0&&(d+=Array(u.length).fill("</span>").join("")),`<div id="source_line${f+1}" class="div_row"><div class="div_cell_a">${f+1}</div><div class="div_cell_b">${d}</div></div>`}).join(""),i+="</div>",l.value=i}})};var K={resizerInterval:void 0,colorMode:"source",colorToggleTimeout:0};function Qe(){let n=document.getElementById("source-code").value,e=new Date;try{let r;document.getElementById("source_is_c").checked?r=new X({language:"C",sourceCode:n}):r=new X({language:"Assembly",sourceCode:n}),r.compile();let a=r.getAssemblyCode(),l=r.getMachineCode();document.getElementById("assembly_output").innerHTML=Ce(a);let i=new Date,T=`<span class='msg_success'>Compile sucessfull!!!</span> <small>Done at ${i.getHours()}:${i.getMinutes()}:${i.getSeconds()} in ${i-e} ms.`;T+=`<br>Machine code hash ID: ${l.MachineCodeHashId}`,document.getElementById("debug").checked&&(T+=`

`+JSON.stringify(l,null,"    ")),document.getElementById("status_output").innerHTML=T+"</small>",sn(l)}catch(r){document.getElementById("assembly_output").innerHTML="",Fe();let a=`<span class='msg_failure'>Compile failed</span>

${r.message}`;document.getElementById("debug").checked&&(a+=`

`+r.stack),document.getElementById("status_output").innerHTML=a;let l=/^At line: (\d+)/.exec(r.message);l!==null&&(document.getElementById("source_line"+l[1]).className+=" asmError")}}function q(n){let e=document.getElementById("source-code"),r=document.getElementById("color_code");De(n);let a=1;clearInterval(K.resizerInterval),K.resizerInterval=setInterval(()=>{let i=e.scrollHeight;if(i<Number(e.style.height.replace("px",""))){if(a>=128){let T=a>>7;T>i&&(T=i),e.style.height=i-T+"px",r.style.height=i+"px"}a<<=1}else e.style.height=i+"px",e.scrollTop=0,r.style.height=i+"px",clearInterval(K.resizerInterval)},100);let l=e.value.substr(0,e.selectionStart).split(`
`);document.getElementById("tooltip_span").innerHTML="Cursor: "+l.length+":"+l[l.length-1].length}function We(){let n=document.getElementById("source-code");if(n.selectionStart===n.selectionEnd&&K.colorMode!=="color"){K.colorMode="color",clearTimeout(K.colorToggleTimeout);let e=document.getElementById("color_code");document.getElementById("source_is_c").checked?e.innerHTML=hljs.highlight(n.value,{language:"c"}).value:e.innerHTML=Ce(n.value),n.className="transp"}}function De(n){clearTimeout(K.colorToggleTimeout),K.colorToggleTimeout=setTimeout(We,500),(K.colorMode!=="source"||n===!0)&&(K.colorMode="source",document.getElementById("source-code").className="opaque")}function en(){let n=document.getElementById("save").innerHTML;localStorage.setItem("program",document.getElementById("source-code").value),setTimeout(()=>{document.getElementById("save").innerHTML=n},5e3),document.getElementById("save").innerHTML="&#9745;"}function nn(){let n=document.getElementById("source-code").value;(n===""||confirm("Sure over-write current program?")===!0)&&(document.getElementById("source-code").value=localStorage.getItem("program"),q(!0),n=document.getElementById("load").innerHTML,setTimeout(()=>{document.getElementById("load").innerHTML=n},5e3),document.getElementById("load").innerHTML="&#9745;"),document.getElementById("source-code").focus()}function an(){let n=WinBox.new({title:"Source code",height:"100%",top:50,mount:document.getElementById("source_window"),onclose:function(){document.getElementById("source_fieldset").style.display="block"}});return document.getElementById("source_fieldset").style.display="none",n}function rn(){WinBox.new({title:"Status",mount:document.getElementById("status_window"),height:"25%",width:"50%",x:"50%",y:"75%",top:50,onclose:function(){document.getElementById("status_fieldset").style.display="block"}}),document.getElementById("status_fieldset").style.display="none"}function tn(){WinBox.new({title:"Actions",mount:document.getElementById("actions_window"),height:"20%",width:"50%",x:"50%",y:"55%",top:50,onclose:function(){document.getElementById("actions_fieldset").style.display="block"}}),document.getElementById("actions_fieldset").style.display="none"}function xe(){let n=WinBox.new({title:"Smart Contract Deployment",mount:document.getElementById("deployment_window"),top:50,height:"95%",onclose:function(){document.getElementById("deployment_fieldset").style.display="block"}});return document.getElementById("deployment_fieldset").style.display="none",n}function ln(){WinBox.new({title:"Assembly output",mount:document.getElementById("assembly_window"),height:"50%",width:"50%",x:"50%",y:"50",top:50,onclose:function(){document.getElementById("assembly_fieldset").style.display="block"}}),document.getElementById("assembly_fieldset").style.display="none"}function cn(){WinBox.new({title:"Help page",url:"./htmlDocs/index.html",height:"70%",width:"70%",x:"center",y:"center",top:50}).focus()}function sn(n){let e;e=document.getElementsByName("name"),e[0].value=n.PName,e=document.getElementsByName("description"),e[0].value=n.PDescription,e=document.getElementsByName("code"),e[0].value=n.ByteCode,e=document.getElementsByName("data"),e[0].value=n.ByteData,e=document.getElementsByName("dpages"),e[0].value=n.DataPages,e=document.getElementsByName("cspages"),e[0].value=n.CodeStackPages,e=document.getElementsByName("uspages"),e[0].value=n.UserStackPages,e=document.getElementsByName("minActivationAmountNQT"),e[0].value=n.PActivationAmount,e=document.getElementsByName("feeNQT"),e[0].value=n.MinimumFeeNQT}function Fe(){let n;n=document.getElementsByName("name"),n[0].value="",n=document.getElementsByName("description"),n[0].value="",n=document.getElementsByName("code"),n[0].value="",n=document.getElementsByName("data"),n[0].value="",n=document.getElementsByName("dpages"),n[0].value="0",n=document.getElementsByName("cspages"),n[0].value="0",n=document.getElementsByName("uspages"),n[0].value="0",n=document.getElementsByName("minActivationAmountNQT"),n[0].value="",n=document.getElementsByName("feeNQT"),n[0].value=""}function dn(){document.getElementById("assembly_output").innerHTML="",Fe();let n=!1;document.getElementById("debug").checked&&(n=!0),document.getElementById("status_output").innerHTML=Re(n)}function Pe(n){n.checked!==void 0&&n.checked||n.target!==void 0&&n.target.checked?document.getElementById("bt1").innerText="C":document.getElementById("bt1").innerText="Assembly",document.getElementById("assembly_output").innerHTML="",q(!0)}function on(n){let e=document.getElementById("deploy_form");e.action=`http://localhost:${n.currentTarget.value}/burst`}})();
