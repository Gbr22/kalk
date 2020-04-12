
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

class FactorialOperation extends TreeObj {
    val;
    getValue(){
        let value = valOrEx(this.val);
        let fact = factorial(value);
        return new NumberValue(fact);
    }
    constructor(val){
        super();
        this.val = val;
    }
}
class Func extends TreeObj {
    arguments;
    context;
    name;
    getValue(){ //execute
        let args = this.arguments.map(
            (arg)=>{
                if (arg == undefined){
                    return undefined;
                } else {
                    return execute(arg);
                }
            }
        );
        let out=this.context[this.name.string](...args);
        return new NumberValue(out);
    }
}
class Operation extends TreeObj {
    left;
    right;
    operation;
    getValue(){
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
            return "+-*/()!".includes(c);
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

function genTree(tokens,context){
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
            if (bracketsCount(i) == bracketsCount(innerMostIndex)-1){
                if (tokens[i-1] && tokens[i-1].string == ")"){
                    end = i;
                    break;
                }
            }
        }
        if (tokens[start-1] && tokens[start-1].isType(tokensTypes.Identifier)){
            let obj = new Func();
            let area = tokens.splice(start,end-start,obj);
            area.shift();
            area.pop();
            obj.arguments = [genTree(area)];
            obj.name = tokens[start-1];
            obj.context = context;
            tokens.splice(start-1,1);
        } else {
            let obj = new Brackets();
            let area = tokens.splice(start,end-start,obj);
            area.shift();
            area.pop();
            obj.contents = genTree(area);
        }
        
    }
    while(notAllConnected("!")){
        for (let i=0; i< tokens.length; i++){
            let token = tokens[i];
        
            if (token.string == "!"){
                let obj = new FactorialOperation(tokens[i-1]);
                tokens.splice(i-1,2,obj);


                break;
            }
        }
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
    let tree = genTree([...tokens],context);
    console.log("tree",tree);
    return parseFloat(execute(tree).getValue());
}




function evalInScope(js, contextAsScope) {
    //# Return the results of the in-line anonymous function we .call with the passed context
    return function() { with(this) { return eval(js); }; }.call(contextAsScope);
}

function factorial(n){
    let result = n;
    for (let i=1; i < n; i++){
        result*=i;
    }
    return result;
}


let defaultContext = {
    "PI":Math.PI,
    "π":Math.PI,
    "Tau":Math.PI/2,
    "τ":Math.PI/2,
    factorial,
}
for (let p of Object.getOwnPropertyNames(Math)){
    if (!defaultContext[p]){
        defaultContext[p] = Math[p];
    }
}

let context = Object.assign(Object.assign({},defaultContext),{
    a:5
});

function test(math,context){
    function benchmark(func){
        console.time();
        let result;
        try {
            result = func();
        } catch(err){
            result = err;
        }
        console.timeEnd();
        return result;
    }
    
    let myresult = benchmark(()=>evalMath(math,context));
    let result = benchmark(()=>evalInScope(math,context));

    
    
    if (typeof result == "string"){
        result = NaN;
    }
    
    console.log("evalMath",myresult);
    console.log("eval",result);

    function isEqual(a,b){
        if (isNaN(a) && isNaN(b)){
            return true;
        } else {
            return myresult == result;
        }
    }

    console.log("matching",isEqual(myresult,result));
}