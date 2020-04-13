//an execute function should always return with a value container object
//and a value container object should always return with itself


class TreeObj {
    execute(){}
    isValue(){return false}
}

class Token extends TreeObj {
    string="";
    isType(type){
        return this.constructor == type;
    }
}
class Value extends TreeObj {
    value;
    isValue(){
        return true;
    };
    isValueList(){
        return false;
    }
    getValue(){
        return this.value;
    }
    execute(){
        return this;
    }
    constructor(value){
        super();
        this.value = value;
    }
}
class ValueList extends Value {
    isValueList(){
        return true;
    }
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
    execute(c){
        return execute(this.contents,c);
    }
}

class FactorialOperation extends TreeObj {
    val;
    execute(c){
        let value = this.val.execute(c).getValue(c);
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
    name;
    isValue(){return false}
    getArguments(context){
        if (!this.arguments){
            return [];
        }
        let argObj = this.arguments.execute(context);

        

        if (argObj.isValue()){
            if (argObj.isValueList && argObj.isValueList()){
                return argObj.getValue();
            }

            return [argObj];
        } else {
            throw Error("Only values allowed as arguments");
        }


        
        
    }
    execute(c){ //execute
        let args = this.getArguments(c);
        
        args = args.map(
            (arg)=>{
                if (arg == undefined){
                    return undefined;
                } else {
                    
                    let exec = arg.execute(c);
                    return exec.getValue(c);
                }
            }
        );
        let out=c[this.name.string](...args);
        return new NumberValue(out);
    }
}
function flattenObjList(obj,list=[]){
    
    if (obj.constructor == Operation){
        list.push(obj.left);
        return flattenObjList(obj.right,list);
    } else {
        list.push(obj);
        return list;
    }
}
class Operation extends TreeObj {
    left;
    right;
    operation;
    execute(c){
        let tree = this;
        

        function nthRoot(x, n) {
            if(x < 0 && n%2 != 1) return NaN;
            return (x < 0 ? -1 : 1) * Math.pow(Math.abs(x), 1/n);
        }
        let operations = {
            "+":(a,b)=>a+b,
            "/":(a,b)=>a/b,
            "-":(a,b)=>a-b,
            "*":(a,b)=>a*b,
            "^":(a,b)=>Math.pow(a,b),
            "ˇ":(a,b)=>nthRoot(a,b),
            "\n":(a,b)=>b,
        }
        let op = tree.operation.string;

        if (op == ","){
            return new ValueList(flattenObjList(tree));
        }
        else if (op == "="){
            
            if (tree.left.isValue()){
                let val = tree.right.execute(c).getValue(c);
                tree.left.execute(c).setValue(c,val);
                return new NumberValue(val);
            } else if(tree.left.constructor == Func){
                
                let nameToIndex = {};

                let args = tree.left.getArguments(c);
                
                for (let i=0; i < args.length; i++){
                    let arg = args[i];
                    if (arg.constructor != tokensTypes.Identifier){
                        throw new Error("Only identifiers are allowed in the arguments list");
                    }
                    nameToIndex[arg.string]=i;
                }

                
                c[tree.left.name.string] = function(){
                    let context = {}
                    for (let p in nameToIndex){
                        context[p] = arguments[nameToIndex[p]];
                    }
                    /* console.log("context",context); */
                    let scoped = new Proxy(context,{
                        get(_,prop){
                            return context[prop] || c[prop];
                        },
                        set(_,prop,value){
                            if (context[prop]){
                                return context[prop] = value;
                            } else {
                                return c[prop] = value;
                            }
                        }
                    })
                    


                    return tree.right.execute(scoped).getValue(c);
                };
                return new Value(c[tree.left.name.string]);
            } else {
                throw Error("Cannot set value: Left is not a value container or a function head");
            }
        } else {
            let left = tree.left.execute(c).getValue(c);
            let right = tree.right.execute(c).getValue(c);
            let ev = operations[tree.operation.string](left,right);
            return new NumberValue(ev);
        }

        
    }
    constructor(operation,left,right){
        super();
        this.operation = operation;
        this.left = left;
        this.right = right;
    }
}

let tokensTypes = {
    WhiteSpace:class extends Token {
        static is(c){
            return c == " " || c == "\t";
        }
    },
    Symbol:class extends Token {
        static is(c){
            return "+-*/()!^ˇ\n=,".includes(c);
        }
    },
    Number:class extends Token {
        isValue(){return true};
        static is(c){
            return "0123456789.".includes(c);
        }
        execute(){
            return this;
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
        string="";
        isValue(){return true};
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
        execute(){return this};
        setValue(context,value){
            context[this.string] = value;
        }
        getValue(context){
            return context[this.string];
        }
    }
}


function tokenize(str, context = undefined, keepWhitespace = false){
    let tokens = [];
    let currentToken = null;
    for (let i=0; i < str.length; i++){
        let char = str[i];

        let isWhitespace = tokensTypes.WhiteSpace.is;

        if (isWhitespace(char) && !keepWhitespace){
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

    /* for (let token of tokens){
        if (token.isType(tokensTypes.Identifier)){
            token.context = context;
        }
    } */

    /* tokens.push(new tokensTypes.End); */
    return tokens;
}

function isType(something, type){
    return something.constructor == type;
}

let assure = (condition,message)=>{if (!condition){throw new Error(message)}}

function genTree(tokens){
    {
        let count = 0;
        for (let t of tokens){
            if (t.string == "("){
                count++;
            } else if(t.string == ")"){
                count--;
            }
        }
        if (count != 0){
            throw new Error("Unpaired brackets");
        }
    }

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
        let end = null;
        for (let i=start; i < tokens.length+1; i++){
            if (bracketsCount(i) == bracketsCount(innerMostIndex)-1){
                if (tokens[i-1] && tokens[i-1].string == ")"){
                    end = i;
                    break;
                }
            }
        }
        if (end == null){
            throw new Error("( does not have a pair");
        }
        if (tokens[start-1] && tokens[start-1].isType(tokensTypes.Identifier)){
            let obj = new Func();
            let area = tokens.splice(start,end-start,obj);
            area.shift();
            area.pop();
            let args = genTree(area);
            obj.arguments = args;
            obj.name = tokens[start-1];
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
    function connectTwoSidedOperation(a,b, start="left"){
        while(notAllConnected(a) || notAllConnected(b)){
            function stuff(i){
                let token = tokens[i];
            
                if (token.string == a || token.string == b){
                    connect(i);
                    return true;
                }
                return false;
            }
            if (start == "left"){
                for (let i=0; i< tokens.length; i++){
                    if (stuff(i)){
                        break;
                    }
                }    
            } else {
                for (let i=tokens.length-1; i>=0; i--){
                    if (stuff(i)){
                        break;
                    }
                }
            }
            
        }
    }
    

    connectTwoSidedOperation("/","*");
    connectTwoSidedOperation("+","-");
    connectTwoSidedOperation("^","ˇ", "right");

    connectTwoSidedOperation("=","=","right");
    connectTwoSidedOperation("\n","\n");
    connectTwoSidedOperation(",",",","right");
    return tokens[0];
}
function execute(tree,c){
    return tree.execute(c);
}

function evalMath(math,context){
    let tokens = tokenize(math);
    /* console.log("tokens",tokens); */
    let tree = genTree([...tokens]);
    console.log("tree",tree);
    return (execute(tree,context).getValue());
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