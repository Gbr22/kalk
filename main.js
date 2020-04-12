/* let math = "7.56 * 28 / 3 + 6.5 * 56 / 456 - 446 + 654"; */
let math = "((5*5) - 20)! * 2";
/* let math = "5 * 10 + 8 / 5 - 16" */
/* let math = "0 + sin(1)" */

let input = document.getElementById("input");
let syntax = document.getElementById("syntax");

input.oninput = function(){
    onInputChange();
}

let output = document.getElementById("output");
input.value = math;

function onInputChange(){
    let math = input.value;

    let tokens = tokenize(math,{},true);
    
    console.log("whitespace",tokens);
    tokens = tokens.map((token)=>{
        return token.string.split("").map((char, index)=>{
            let t = new token.constructor();
            t.string = char;
            return t;
        })
    }).flat();

    let isBrackets = (t)=>t.string == "(" || t.string == ")";

    syntax.innerHTML = tokens.map((token)=>{
        return `<span class="${token.constructor.name} ${isBrackets(token) ? 'brackets' : ''}">${token.string}</span>`
    }).join("");
    console.log("running",math);
    try {
        output.innerHTML = evalMath(math,{});
    } catch(err){
        output.innerHTML = "Error";
    }

    test(input.value,context);
}
onInputChange();