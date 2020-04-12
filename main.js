/* let math = "7.56 * 28 / 3 + 6.5 * 56 / 456 - 446 + 654"; */
let math = "5+5\n5*5";

let input = document.getElementById("input");
let syntax = document.getElementById("syntax");

input.oninput = function(){
    onInputChange();
}
input.onkeydown = function(){
    onInputChange();
}

let output = document.getElementById("output");
input.value = math;

function highLight(math){
    let tokens = tokenize(math,{},true);
    tokens = tokens.map((token)=>{
        return token.string.split("").map((char, index)=>{
            let t = new token.constructor();
            t.string = char;
            return t;
        })
    }).flat();

    let isBrackets = (t)=>t.string == "(" || t.string == ")";

    let content = tokens.map((token)=>{
        let content = token.string;
        if (content == "\n"){
            content = ";<br>";
        } else if (content == " "){
            content = "&nbsp;";
        }
        return `<span class="${token.constructor.name}${isBrackets(token) ? ' brackets' : ''}${token.string==' ' ? 'space' : ''}">${content}</span>`
    }).join("");
    return content;
}

function onInputChange(){
    let math = input.value;
    
    let content;
    try {
        content = highLight(math);
    } catch(err){
        content = math;
    }
    syntax.innerHTML = content;

    try {
        let result = evalMath(math,Object.assign({},defaultContext));
        console.log("res",result);
        output.innerHTML = result;

    } catch(err){
        console.log(err);
        output.innerHTML = "Error";
    }

    test(input.value,context);
}
onInputChange();