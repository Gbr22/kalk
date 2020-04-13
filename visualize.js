let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let func = undefined;
/* func = Math.sin */


function inputFunc(event){
    
    if (event.keyCode == 13){
        func = eval(`(x) => {return ${event.target.value}}`);
    }
}

function resiz(){
    if (!canvas.classList.contains("loaded")){
        canvas.classList.add("loaded");
    }
    canvas.width = window.innerWidth;
    canvas.height = canvas.computedStyleMap().get("height").value;
}
onload = function(){
    resiz();
}
onresize = resiz;

let view = {
    scale:8,
    x:0,
    y:0
}
function updateInfoBox(){
    document.getElementById("infoBox").innerHTML = `
        <p>Scale: ${view.scale.toFixed(2)}</p>
    `;
}
updateInfoBox();
function draw(){
    if (!func){
        return requestAnimationFrame(draw);
    }
    ctx.fillStyle = "#1E2223";
    let width = canvas.width;
    let height = canvas.height;
    ctx.fillRect(0,0,width,height);

    

    let centerX = width/2-view.x;
    let centerY = height/2-view.y;

    function drawLine(x1,y1,x2,y2){
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    ctx.strokeStyle = "#43A3EF";
    
    drawLine(0,centerY,width,centerY);
    drawLine(centerX,0,centerX,height);

    ctx.fillStyle = ctx.strokeStyle = "#ABB2BF";

    let size = 1;
    if (size < 1){
        size = 1;
    }

    

    function calcPos(x,y){
        let drawX = (x*view.scale)+centerX;
        let drawY = centerY-(y*view.scale);
        return [drawX, drawY];
    }
    function drawDot(x,y){
        let [drawX, drawY] = calcPos(x,y);
        ctx.fillRect(drawX,  drawY, size,size);
        return {x:drawX,y:drawY}
    }

    let start = -centerX/view.scale;
    let end = (centerX+2*view.x)/view.scale;

    let density = 1;

    let connect = true;
    let prevDot = null;

    function next(x){
        let _new = x+(1/view.scale)/density
        if (_new > 0 && x < 0){
            return 0;
        }
        return _new;
    }

    for (let x=start; x < end; x=next(x)){


        let y;
        try {
            y = func(x);
        } catch(err){
            prevDot = null;
        }
        
        let current = drawDot(x,y);
        
        if (prevDot && connect){
            drawLine(prevDot.x, prevDot.y, current.x, current.y)
        }

        prevDot = current;
    }

    requestAnimationFrame(draw);
}
draw();

canvas.addEventListener('wheel', function(e) {
    let speed = 0.1;
    let d = -e.deltaY;
    
    if (d > 0){
        view.scale *= 1+speed;
        view.x *= 1+speed;
    } else {
        view.scale *= 1-speed;
        view.x *= 1-speed;
    }
    
    
    updateInfoBox();
});
let drag = {
    dragging:false,
    startX:0,
    startY:0,
    vStartX:0,
    vStartY:0
}
canvas.onmousedown = (event)=>{
    drag.dragging = true;
    drag.startX = event.clientX;
    drag.startY = event.clientY;
    drag.vStartX = view.x;
    drag.vStartY = view.y;
    
};
onmousemove = (event)=>{
    if (drag.dragging){
        view.x = drag.vStartX + drag.startX-event.clientX;
        view.y = drag.vStartY + drag.startY-event.clientY;
        
    }
}
onmouseup = (event)=>{
    drag.dragging = false;
}
