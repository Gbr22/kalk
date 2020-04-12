/* let math = "7.56 * 28 / 3 + 6.5 * 56 / 456 - 446 + 654"; */
let math = "((5*5) - 20)! * 2";
/* let math = "5 * 10 + 8 / 5 - 16" */
/* let math = "0 + sin(1)" */

let input = document.getElementById("input");

input.oninput = function(){
    onInputChange();
}

let output = document.getElementById("output");
input.value = math;

function onInputChange(){

    console.log("running",input.value);
    try {
        output.innerHTML = evalMath(input.value);
    } catch(err){
        output.innerHTML = "Error";
    }

    test(input.value,context);
}
onInputChange();