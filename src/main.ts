// title
const title = document.createElement("h1");
title.textContent = "Drawing Studio";
document.body.appendChild(title);

// canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "drawing-canvas";
document.body.appendChild(canvas);

// drawing context
const ctx = canvas.getContext("2d")!;
ctx.lineCap = "round";
ctx.lineWidth = 4;
ctx.strokeStyle = "#5a3e9d";

// display list and state
type Point = { x: number; y: number };
let displayList: Point[][] = [];
let currentStroke: Point[] = [];
let isDrawing = false;

// clear button
const clearBtn = document.createElement("button");
clearBtn.textContent = "🗑️ Clear Canvas";
document.body.appendChild(clearBtn);

clearBtn.addEventListener("click", () => {
  displayList = [];
  currentStroke = [];
  dispatchDrawingChanged();
});

// mouse event handlers

// start a new stroke
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  // new stroke with current point
  currentStroke = [{ x: e.offsetX, y: e.offsetY }];
  dispatchDrawingChanged();
});

// extend current stroke
canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    // add point
    currentStroke.push({ x: e.offsetX, y: e.offsetY });
    dispatchDrawingChanged();
  }
});

// end current stroke
canvas.addEventListener("mouseup", () => {
  if (isDrawing && currentStroke.length > 0) {
    // save finished stroke
    displayList.push([...currentStroke]);
  }
  currentStroke = [];
  isDrawing = false;
  dispatchDrawingChanged();
});

// mouse leaves canvas
canvas.addEventListener("mouseout", () => {
  if (isDrawing && currentStroke.length > 0) {
    currentStroke = [];
    isDrawing = false;
  }
});

// observer pattern

// drawing changed
function dispatchDrawingChanged() {
  const event = new CustomEvent("drawing-changed");
  canvas.dispatchEvent(event);
}

// listen for changes and redraw
canvas.addEventListener("drawing-changed", redraw);

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw all strokes
  displayList.forEach((stroke) => {
    if (stroke.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x, stroke[i].y);
    }
    ctx.stroke();
  });

  // draw in progress stroke
  if (currentStroke.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
    for (let i = 1; i < currentStroke.length; i++) {
      ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
    }
    ctx.stroke();
  }
}
