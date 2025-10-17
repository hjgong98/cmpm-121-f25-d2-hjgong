// title
const title = document.createElement("h1");
title.textContent = "Drawing Studio";
document.body.appendChild(title);

// create canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "drawing-canvas";
document.body.appendChild(canvas);

// get 2d context for drawing
const ctx = canvas.getContext("2d")!;
ctx.lineCap = "round";
ctx.lineWidth = 4;
ctx.strokeStyle = "#5a3e9d"; // Match the title color? Aesthetic! 💜

// track if mouse is down
let isDrawing = false;

// start drawing
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

// draw line to current mouse position
canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  }
});

// stop drawing
canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

// stop if mouse leaves canvas
canvas.addEventListener("mouseout", () => {
  isDrawing = false;
});
