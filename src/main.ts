// title
const title = document.createElement("h1");
title.textContent = "Drawing Studio";
document.body.appendChild(title);

// tools
const toolsDiv = document.createElement("div");
toolsDiv.style.display = "flex";
toolsDiv.style.gap = "8px";
toolsDiv.style.justifyContent = "center";
toolsDiv.style.marginBottom = "8px";
document.body.appendChild(toolsDiv);

const thinBtn = document.createElement("button");
thinBtn.textContent = "Thin";
thinBtn.classList.add("tool-btn");
thinBtn.classList.add("selectedTool"); // thin is default
toolsDiv.appendChild(thinBtn);

const thickBtn = document.createElement("button");
thickBtn.textContent = "Thick";
thickBtn.classList.add("tool-btn");
toolsDiv.appendChild(thickBtn);

// track current tool
type Tool = { width: number; color: string };
let currentTool: Tool = { width: 4, color: "#5a3e9d" };

// update tool on click
function selectTool(tool: Tool, button: HTMLButtonElement) {
  currentTool = tool;
  // visual feedback
  [thinBtn, thickBtn].forEach((btn) => btn.classList.remove("selectedTool"));
  button.classList.add("selectedTool");
}

thinBtn.addEventListener("click", () => {
  selectTool({ width: 4, color: "#5a3e9d" }, thinBtn);
});

thickBtn.addEventListener("click", () => {
  selectTool({ width: 12, color: "#5a3e9d" }, thickBtn);
});

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
ctx.strokeStyle = "#5a3e9d";

// interface
interface DrawCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

// markerline command
class MarkerLine implements DrawCommand {
  private points: Point[];
  private width: number;
  private color: string;

  constructor(
    initialX: number,
    initialY: number,
    width: number,
    color: string,
  ) {
    this.points = [{ x: initialX, y: initialY }];
    this.width = width;
    this.color = color;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;

    ctx.save(); // 🔐 Isolate style changes
    ctx.lineWidth = this.width;
    ctx.strokeStyle = this.color;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
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
  currentStroke = new MarkerLine(
    e.offsetX,
    e.offsetY,
    currentTool.width,
    currentTool.color,
  );
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
