// title
const title = document.createElement("h1");
title.textContent = "Drawing Studio";
document.body.appendChild(title);

// clear button (above canvas)
const clearBtn = document.createElement("button");
clearBtn.textContent = "🗑️ Clear Canvas";
document.body.appendChild(clearBtn);

// canvas wrapper (to keep everything together)
const canvasContainer = document.createElement("div");
canvasContainer.id = "canvas-container";
document.body.appendChild(canvasContainer);

// canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "drawing-canvas";
canvasContainer.appendChild(canvas);

// drawing context
const ctx = canvas.getContext("2d")!;
ctx.lineCap = "round";
ctx.lineWidth = 4;
ctx.strokeStyle = "#5a3e9d";

// interface
interface DrawCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

// markerline command
class MarkerLine implements DrawCommand {
  private points: Point[];

  constructor(initialX: number, initialY: number) {
    this.points = [{ x: initialX, y: initialY }];
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
  }
}

// types
type Point = { x: number; y: number };

// hold commands instead of points
let displayList: MarkerLine[] = [];
let currentStroke: MarkerLine | null = null;
let isDrawing = false;
let redoStack: MarkerLine[] = [];

// undo button
const undoBtn = document.createElement("button");
undoBtn.textContent = "↩️ Undo";
undoBtn.id = "btn-undo";
canvasContainer.appendChild(undoBtn);

// redo button
const redoBtn = document.createElement("button");
redoBtn.textContent = "↪️ Redo";
redoBtn.id = "btn-redo";
canvasContainer.appendChild(redoBtn);

// clear button event
clearBtn.addEventListener("click", () => {
  displayList = [];
  currentStroke = null;
  redoStack = [];
  dispatchDrawingChanged();
});

// undo button event
undoBtn.addEventListener("click", () => {
  if (displayList.length > 0) {
    const lastStroke = displayList.pop()!;
    redoStack.push(lastStroke);
    dispatchDrawingChanged();
  }
});

// redo button event
redoBtn.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const stroke = redoStack.pop()!;
    displayList.push(stroke);
    dispatchDrawingChanged();
  }
});

// mouse event handlers
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  currentStroke = new MarkerLine(e.offsetX, e.offsetY);
  dispatchDrawingChanged();
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing && currentStroke) {
    currentStroke.drag(e.offsetX, e.offsetY);
    dispatchDrawingChanged();
  }
});

canvas.addEventListener("mouseup", () => {
  if (isDrawing && currentStroke) {
    displayList.push(currentStroke);
    redoStack = []; // Clear redo stack on new action
  }
  currentStroke = null;
  isDrawing = false;
  dispatchDrawingChanged();
});

canvas.addEventListener("mouseout", () => {
  if (isDrawing) {
    isDrawing = false;
    currentStroke = null;
  }
});

// observer pattern: redraw when drawing changes
function dispatchDrawingChanged() {
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
}

// listen for changes and redraw
canvas.addEventListener("drawing-changed", redraw);

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw all strokes
  displayList.forEach((stroke) => stroke.display(ctx));

  // draw current stroke
  currentStroke?.display(ctx);
}
