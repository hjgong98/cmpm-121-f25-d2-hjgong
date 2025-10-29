// title
const title = document.createElement("h1");
title.textContent = "Drawing Studio";
document.body.appendChild(title);

// declare custom event so typescript will stop complaining
declare global {
  interface HTMLElementEventMap {
    "tool-moved": CustomEvent<{ x: number; y: number }>;
  }
}

// tools
const toolsDiv = document.createElement("div");
toolsDiv.style.display = "flex";
toolsDiv.style.gap = "8px";
toolsDiv.style.justifyContent = "center";
toolsDiv.style.marginBottom = "8px";
document.body.appendChild(toolsDiv);

const thinBtn = document.createElement("button");
thinBtn.textContent = "Thin";
thinBtn.classList.add("tool-btn", "selectedTool");
toolsDiv.appendChild(thinBtn);

const thickBtn = document.createElement("button");
thickBtn.textContent = "Thick";
thickBtn.classList.add("tool-btn");
toolsDiv.appendChild(thickBtn);

// sticker buttons
const stickers = ["🎨", "✨", "🎮"];
const stickerBtns: { emoji: string; button: HTMLButtonElement }[] = [];
let selectedSticker: string | null = null;

stickers.forEach((emoji) => {
  const btn = document.createElement("button");
  btn.textContent = emoji;
  btn.classList.add("tool-btn");
  btn.style.fontSize = "18px";
  btn.title = `Place ${emoji}`;
  toolsDiv.appendChild(btn);

  btn.addEventListener("click", () => {
    // deselect all tools
    [thinBtn, thickBtn].forEach((b) => b.classList.remove("selectedTool"));
    stickerBtns.forEach(({ button }) => button.classList.remove("selectedTool"));
    
    // select this sticker
    btn.classList.add("selectedTool");
    selectedSticker = emoji;
    currentTool = null;
    dispatchToolChange();
  });

  stickerBtns.push({ emoji, button: btn });
});

// track current tool
type Tool = { width: number; color: string };
let currentTool: Tool | null = { width: 4, color: "#5a3e9d" }; // Thin default

// handle marker selection
function selectMarker(tool: Tool, button: HTMLButtonElement) {
  // deselect
  [thinBtn, thickBtn].forEach((b) => b.classList.remove("selectedTool"));
  stickerBtns.forEach(({ button }) => button.classList.remove("selectedTool"));
  
  button.classList.add("selectedTool");
  currentTool = tool;
  selectedSticker = null;
  dispatchToolChange();
}

thinBtn.addEventListener("click", () => selectMarker({ width: 4, color: "#5a3e9d" }, thinBtn));
thickBtn.addEventListener("click", () => selectMarker({ width: 12, color: "#5a3e9d" }, thickBtn));

// clear button (above canvas)
const clearBtn = document.createElement("button");
clearBtn.textContent = "🗑️ Clear Canvas";
clearBtn.style.padding = "8px 16px";
clearBtn.style.fontSize = "14px";
clearBtn.style.border = "1px solid #ccc";
clearBtn.style.backgroundColor = "#f0f0f0";
clearBtn.style.borderRadius = "6px";
clearBtn.style.cursor = "pointer";
clearBtn.style.margin = "0 auto";
clearBtn.style.display = "block";
document.body.appendChild(clearBtn);

// canvas wrapper
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
  drag?(x: number, y: number): void;
}

// markerLine command
class MarkerLine implements DrawCommand {
  private points: { x: number; y: number }[] = [];
  constructor(private width: number, private color: string) {}
  start(x: number, y: number) {
    this.points = [{ x, y }];
  }
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }
  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;
    ctx.save();
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

// toolPreview command
class ToolPreview implements DrawCommand {
  constructor(
    private x: number,
    private y: number,
    private width: number,
    private color: string
  ) { }
  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.fillStyle = this.color + "44";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// stickerPreview command
class StickerPreview implements DrawCommand {
  constructor(
    private x: number,
    private y: number,
    private emoji: string
  ) { }
  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.7;
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

// PlaceSticker command
class PlaceSticker implements DrawCommand {
  constructor(
    private x: number,
    private y: number,
    private emoji: string
  ) { }
  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);
  }
}

// commands
let displayList: DrawCommand[] = [];
let currentStroke: MarkerLine | null = null;
let currentSticker: PlaceSticker | null = null;
let currentPreview: DrawCommand | null = null;
let isDrawing = false;
let redoStack: DrawCommand[] = [];
let lastMouseX = 128;
let lastMouseY = 128;

// mouse tracking
canvas.addEventListener("mousemove", (e) => {
  lastMouseX = e.offsetX;
  lastMouseY = e.offsetY;
  if (!isDrawing && !currentSticker) {
    dispatchToolMove();
  }
});

// tool move event
function dispatchToolMove() {
  const event = new CustomEvent("tool-moved", { detail: { x: lastMouseX, y: lastMouseY } });
  canvas.dispatchEvent(event);
}

// tool change
function dispatchToolChange() {
  dispatchToolMove(); // update preview
}

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
  currentSticker = null;
  currentPreview = null;
  redoStack = [];
  isDrawing = false;
  redraw();
});

// undo button event
undoBtn.addEventListener("click", () => {
  if (displayList.length === 0) return;
  const last = displayList.pop()!;
  redoStack.push(last);
  redraw();
});

// redo button event
redoBtn.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  const action = redoStack.pop()!;
  displayList.push(action);
  redraw();
});

// mouse events
canvas.addEventListener("mousedown", (e) => {
  if (selectedSticker) return; // stickers are placed on click, not drag
  if (!currentTool) return;

  isDrawing = true;
  currentStroke = new MarkerLine(currentTool.width, currentTool.color);
  currentStroke.start(e.offsetX, e.offsetY);
  redraw();
});

// 🖱️ Mouse Move
canvas.addEventListener("mousemove", (e) => {
  if (isDrawing && currentStroke) {
    currentStroke.drag(e.offsetX, e.offsetY);
    redraw();
  }
});

// mouse events
canvas.addEventListener("mouseup", () => {
  if (isDrawing && currentStroke) {
    displayList.push(currentStroke);
    redoStack = [];
    currentStroke = null;
    isDrawing = false;
    redraw();
  }
});

canvas.addEventListener("mouseout", () => {
  if (isDrawing) {
    isDrawing = false;
    currentStroke = null;
  }
});

// sticker placement
canvas.addEventListener("click", (e) => {
  if (!selectedSticker) return;
  currentSticker = new PlaceSticker(e.offsetX, e.offsetY, selectedSticker);
  let placed = false;

  const finish = () => {
    if (placed) return;
    displayList.push(currentSticker!);
    redoStack = [];
    currentSticker = null;
    placed = true;
    canvas.removeEventListener("mousemove", move);
    canvas.removeEventListener("mouseup", finish);
    canvas.removeEventListener("mouseout", finish);
    redraw();
  };

  const move = (ev: MouseEvent) => {
    if (placed) return;
    currentSticker!.drag(ev.offsetX, ev.offsetY);
    redraw();
  };

  canvas.addEventListener("mousemove", move);
  canvas.addEventListener("mouseup", finish);
  canvas.addEventListener("mouseout", finish);
  redraw();
});

// preview on tool move
canvas.addEventListener("tool-moved", (e: CustomEvent<{ x: number; y: number }>) => {
  const { x, y } = e.detail;
  if (selectedSticker) {
    currentPreview = new StickerPreview(x, y, selectedSticker);
  } else if (currentTool) {
    currentPreview = new ToolPreview(x, y, currentTool.width, currentTool.color);
  } else {
    currentPreview = null;
  }
  redraw();
});

// redraw canvas
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw all saved commands
  displayList.forEach(cmd => cmd.display(ctx));

  // draw current stroke
  currentStroke?.display(ctx);

  // draw sticker being placed
  currentSticker?.display(ctx);

  // draw preview (if not drawing or placing)
  if (!isDrawing && !currentSticker && currentPreview) {
    currentPreview.display(ctx);
  }
}
