


class Token {
    string="";
    isType(type){
        return this.constructor == type;
    }
}


let tokensTypes = {
    Symbol:class extends Token {
        static is(c){
            return "+-*/()".includes(c);
        }
    },
    Number:class extends Token {
        static is(c){
            return "0123456789.".includes(c);
        }   
    },
    End:class extends Token {
        string="End";
        static is(){return false}
    },
    Identifier:class extends Token {
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
    }
}


function tokenize(str){
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
    /* tokens.push(new tokensTypes.End); */
    return tokens;
}

function isType(something, type){
    return something.constructor == type;
}

let assure = (condition,message)=>{if (!condition){throw new Error(message)}}

function genTree(tokens){
    function connect(i){
        tokens[i] = {
            operation:tokens[i],
            left:tokens[i-1],
            right:tokens[i+1]
        }
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
            }
        }    
    }
    return tokens[0];
}



function execute(tree){
    function valOrEx(side){
        if (!side){
            return;
        }
        else if (side.operation){
            return execute(side).string;
        } else {
            return side.string;
        }
    }


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
    return {string:ev.toString()};
}

function evalMath(){
    let tokens = tokenize(math);
    console.log(tokens);
    let tree = genTree([...tokens]);
    console.log(tree);
    return parseFloat(execute(tree).string);
}


/* let math = "7.56 * 28 / 3 + 6.5 * 56 / 456 - 446 + 654"; */
let math = "7.56 * 28 / 3 * 6.5 * 56 / ((456 - 446) + 654)";
/* let math = "5 * 10 + 8 / 5 - 16" */

console.time("evalMath");
let myresult = evalMath(math)
console.log("evalMath",myresult);
console.timeEnd("evalMath");
console.time("eval");
let result = eval(math);
console.log("eval",result);
console.timeEnd("eval");
console.log("matching",myresult == result);

setInterval(()=>{});