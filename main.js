/* let math = "7.56 * 28 / 3 + 6.5 * 56 / 456 - 446 + 654"; */
let math = 
`v(1,1)-v(1,3)*2`;
/* let math = `a=5
a`; */

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

input.onscroll = function(){
    syntax.style.transform = `translate(${-input.scrollLeft}px, ${-input.scrollTop}px)`

}


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

    for (let i=0; i < tokens.length-1; i++){
        let token = tokens[i];
        let next = tokens[i+1];
        if (token.constructor == next.constructor && token.isType(tokensTypes.Identifier)){
            token.string+=next.string;
            tokens.splice(i+1,1);
            i--;
        }
    }
    

    let content = tokens.map((token,index)=>{
        let content = token.string;
        if (content == "\n"){
            content = ";</div><div>";
        } else if (content == " "){
            content = "&nbsp;";
        }
        function isNext(next){
            for (let i=index+1; i < tokens.length; i++){
                let t = tokens[i];
                if (!t.isType(tokensTypes.WhiteSpace)){
                    return t.string == next;
                }
            }
            return false;
        }
        return `<span class="
            ${token.constructor.name}
            ${isBrackets(token) ? ' brackets' : ''}
            ${token.string==' ' ? 'space' : ''}
            ${token.isType(tokensTypes.Identifier) && isNext("(") ? 'function':''}
        ">${content}</span>`
    }).join("");
    return "<div>"+content+"</div>";
}
let lastMath = null;
function onInputChange(){
    let math = input.value;
    if (math == lastMath){
        return;
    } else {
        lastMath = math;
    }
    
    let content;
    try {
        content = highLight(math);
    } catch(err){
        console.error(err);
        content = math;
    }
    syntax.innerHTML = content;

    function noRender(){
        
        setRenderFunction(undefined);
        canvas.classList.remove("visible");
    }

    try {
        let result = evalMath(math,Object.assign({},defaultContext));
        console.log("res",result);
        if (typeof result == "function"){
            canvas.classList.add("visible");
            setRenderFunction(result);
            
            output.innerHTML = `[Function]`;
        } else if (result.constructor == Vector){
            noRender();
            output.innerHTML = `
                <div>&nbsp;Vector&nbsp; = (${result.values.join(", ")})</div>
                <div>|Vector| = ${result.getLength().toFixed(2)}</div>
            `;
        }
        else if (isNaN(result)){
            noRender();
            output.innerHTML = result;
        } else {
            noRender();
            output.innerHTML = result;
        }
        

    } catch(err){
        noRender();
        console.log(err);
        output.innerHTML = `Error: ${err.message}`;
    }

    test(input.value,context);
}
onInputChange();