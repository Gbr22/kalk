
class TreeObj {
    getValue(){}
    isValue(){return false}
}

class Token extends TreeObj {
    string="";
    isType(type){
        return this.constructor == type;
    }
}
class Value extends TreeObj {
    isValue(){
        return true;
    };
}
class NumberValue extends Value {
    value;
    constructor(value){
        super();
        this.value = value;
    }
    getValue(){
        return this.value;
    }
}
class Brackets extends TreeObj {
    contents;
    getValue(){
        return execute(this.contents);
    }
}
class Operation extends TreeObj {
    left;
    right;
    operation;
    getValue(){
        function valOrEx(side){
            if (!side){
                return;
            } else {
                let valueContainer;
                if (!side.isValue()){
                    valueContainer = execute(side);
                } else {
                    valueContainer = side;
                }
                return valueContainer.getValue();
            }
        }
        let tree = this;
        let left = valOrEx(tree.left);
        let right = valOrEx(tree.right);

        
        let operations = {
            "+":(a,b)=>a+b,
            "/":(a,b)=>a/b,
            "-":(a,b)=>a-b,
            "*":(a,b)=>a*b,
        }
        let ev = operations[tree.operation.string](parseFloat(left),parseFloat(right));
        console.log(left,tree.operation.string,right,"=",ev);
        return new NumberValue(ev);
    }
    constructor(operation,left,right){
        super();
        this.operation = operation;
        this.left = left;
        this.right = right;
    }
}

let tokensTypes = {
    Symbol:class extends Token {
        static is(c){
            return "+-*/()".includes(c);
        }
    },
    Number:class extends Token {
        isValue(){return true};
        static is(c){
            return "0123456789.".includes(c);
        }
        getValue(){
            return parseFloat(this.string);
        }
    },
    End:class extends Token {
        string="End";
        static is(){return false}
    },
    Identifier:class extends Token {
        context;
        string="";
        static is(c){
            let isOtherType = false;
            for (let type of Object.values(tokensTypes)){
                if (type != tokensTypes.Identifier){
                    if (type.is(c)){
                        isOtherType = true;
                    }
                }
            }
            return !isOtherType;
        }
        getValue(){
            return new NumberValue(this.context[this.string]);
        }
    }
}


function tokenize(str, context){
    let tokens = [];
    let currentToken = null;
    for (let i=0; i < str.length; i++){
        let char = str[i];

        let isWhitespace = (c)=>c == " " || c == "\n";

        if (isWhitespace(char)){
            continue;
        }

        let charType = null;
        for (let type of Object.values(tokensTypes)){
            if (type.is(char)){
                charType = type;
            }
        }
        if (charType == null){
            throw new Error(`Unexpected character "${char}" at ${i}`);
        }

        if (currentToken != null && currentToken.constructor != charType){
            tokens.push(currentToken);
            currentToken = null;
        }

        if (currentToken == null){
            currentToken = new charType();
        }
        if (currentToken.constructor == charType){
            currentToken.string+=char;
        }
    }
    tokens.push(currentToken);
    tokens = tokens.map((token)=>{
        if (token.isType(tokensTypes.Symbol)){
            return token.string.split("").map((char)=>{
                let symbol = new tokensTypes.Symbol();
                symbol.string = char;
                return symbol;
            })
        } else {
            return token;
        }
    }).flat();

    for (let token of tokens){
        if (token.isType(tokensTypes.Identifier)){
            token.context = context;
        }
    }

    /* tokens.push(new tokensTypes.End); */
    return tokens;
}

function isType(something, type){
    return something.constructor == type;
}

let assure = (condition,message)=>{if (!condition){throw new Error(message)}}

function genTree(tokens){
    function connect(i){
        tokens[i] = new Operation(tokens[i],tokens[i-1],tokens[i+1]);
        tokens[i-1] = undefined;
        tokens[i+1] = undefined;
        tokens = tokens.filter((e)=>e);
    }
    function notAllConnected(s){
        for (let i=0; i< tokens.length; i++){
            let token = tokens[i];
            if (token.string == s){
                return true;
            }
        }
        return false;
    }
    function bracketsCount(index){
        let count = 0;
        for (let i=0; i < index; i++){
            let token = tokens[i];
            if (token.string == "("){
                count++;
            } else if (token.string == ")"){
                count--;
            }
        }
        return count;
    }
    while(notAllConnected("(")){
        let innerMostIndex = 0;
        for (let i=0; i < tokens.length; i++){
            if (bracketsCount(i) > bracketsCount(innerMostIndex)){
                innerMostIndex = i;
            }
        }
        let start = innerMostIndex - 1;
        let end = start;
        for (let i=start; i < tokens.length+1; i++){
            if (bracketsCount(i) == bracketsCount(innerMostIndex)-1 && tokens[i-1].string == ")"){
                end = i;
                break;
            }
        }

        let obj = new Brackets();
        let area = tokens.splice(start,end-start,obj);
        area.shift();
        area.pop();
        obj.contents = genTree(area);
    }

    while(notAllConnected("/") || notAllConnected("*")){
        for (let i=0; i< tokens.length; i++){
            let token = tokens[i];
        
            if (token.string == "/" || token.string == "*"){
                connect(i);
                break;
            }
        }    
    }
    while(notAllConnected("+") || notAllConnected("-")){
        for (let i=0; i< tokens.length; i++){
            let token = tokens[i];
        
            if (token.string == "+" || token.string == "-"){
                connect(i);
                break;
            }
        }    
    }
    return tokens[0];
}
function execute(tree){
    return tree.getValue();
}

function evalMath(math,context){
    let tokens = tokenize(math,context);
    console.log("tokens",tokens);
    let tree = genTree([...tokens]);
    require("fs").writeFileSync("out.json",JSON.stringify(tree));
    console.log("tree",tree);
    return parseFloat(execute(tree).getValue());
}


let math = "7.56 * 28 / 3 + 6.5 * 56 / 456 - 446 + 654";
/* let math = "π * π"; */
/* let math = "5 * 10 + 8 / 5 - 16" */

function evalInScope(js, contextAsScope) {
    //# Return the results of the in-line anonymous function we .call with the passed context
    return function() { with(this) { return eval(js); }; }.call(contextAsScope);
}

let defaultContext = {
    "PI":Math.PI,
    "π":Math.PI
}

let context = Object.assign(Object.assign({},defaultContext),{
    a:5
});

console.time("evalMath");
let myresult = evalMath(math,context);
console.log("evalMath",myresult);
console.timeEnd("evalMath");
console.time("eval");
let result = evalInScope(math,context);
console.log("eval",result);
console.timeEnd("eval");
console.log("matching",myresult == result);

setInterval(()=>{});