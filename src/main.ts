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
thinBtn.classList.add("tool-btn");
thinBtn.classList.add("selectedTool"); // thin is default
toolsDiv.appendChild(thinBtn);

const thickBtn = document.createElement("button");
thickBtn.textContent = "Thick";
thickBtn.classList.add("tool-btn");
toolsDiv.appendChild(thickBtn);

// --- Sticker Buttons ---
const stickerBtns: { emoji: string; button: HTMLButtonElement }[] = [];
const stickers: string[] = ["🎨", "✨", "🎮"];
let selectedSticker: string = stickers[0];

stickers.forEach((emoji) => {
  const btn = document.createElement("button");
  btn.textContent = emoji;
  btn.classList.add("tool-btn");
  btn.style.fontSize = "18px";
  btn.title = `Use ${emoji} sticker`;
  toolsDiv.appendChild(btn);

  btn.addEventListener("click", () => {
    selectedSticker = emoji;
    // trigger preview update at last known mouse position
    const event = new CustomEvent("tool-moved", {
      detail: { x: lastMouseX, y: lastMouseY },
    });
    canvas.dispatchEvent(event);
  });

  stickerBtns.push({ emoji, button: btn });
});

// track current tool
type Tool = { width: number; color: string };
let currentTool: Tool = { width: 4, color: "#5a3e9d" };

// update tool on click
function selectTool(tool: Tool, button: HTMLButtonElement) {
  currentTool = tool;
  // visual feedback
  [thinBtn, thickBtn].forEach((btn) => btn.classList.remove("selectedTool"));
  button.classList.add("selectedTool");
  // deselect sticker (optional future mode toggle)
  currentPreview = new ToolPreview(
    lastMouseX,
    lastMouseY,
    tool.width,
    tool.color,
  );
  dispatchDrawingChanged();
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
  drag?(x: number, y: number): void; // optional for stickers
}

// markerLine command
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
    private color: string,
  ) {}
  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
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
    private emoji: string,
  ) {}
  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.7;
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}

// PlaceSticker command
class PlaceSticker implements DrawCommand {
  constructor(
    private x: number,
    private y: number,
    private emoji: string,
  ) {}
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

// types
type Point = { x: number; y: number };

// state
let displayList: DrawCommand[] = [];
let currentStroke: MarkerLine | null = null;
let currentSticker: PlaceSticker | null = null;
let currentPreview: DrawCommand | null = null;
let isDrawing = false;
let isPlacingSticker = false;
let redoStack: DrawCommand[] = [];

// mouse tracking
let lastMouseX = 128;
let lastMouseY = 128;

canvas.addEventListener("mousemove", (e) => {
  lastMouseX = e.offsetX;
  lastMouseY = e.offsetY;
});

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
  isPlacingSticker = false;
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

// mouse events
canvas.addEventListener("mousedown", (e) => {
  if (isPlacingSticker) return; // block drawing if placing sticker

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
    redoStack = [];
    currentStroke = null;
    isDrawing = false;
    dispatchDrawingChanged();
  }
});

canvas.addEventListener("mouseout", () => {
  if (isDrawing) {
    isDrawing = false;
    currentStroke = null;
  }
});

// tool preview on movement
canvas.addEventListener(
  "tool-moved",
  (e: CustomEvent<{ x: number; y: number }>) => {
    const { x, y } = e.detail;
    if (selectedSticker) {
      currentPreview = new StickerPreview(x, y, selectedSticker);
    } else {
      currentPreview = new ToolPreview(
        x,
        y,
        currentTool.width,
        currentTool.color,
      );
    }
    dispatchDrawingChanged();
  },
);

// click to place sticker
canvas.addEventListener("click", (e) => {
  if (!selectedSticker) return;

  // Start placing the sticker
  currentSticker = new PlaceSticker(e.offsetX, e.offsetY, selectedSticker);
  isPlacingSticker = true;
  currentPreview = null; // hide preview
  dispatchDrawingChanged();

  const finishPlacement = () => {
    if (currentSticker) {
      displayList.push(currentSticker);
      redoStack = [];
      currentSticker = null;
      isPlacingSticker = false;
      dispatchDrawingChanged();
    }
    canvas.removeEventListener("mousemove", moveSticker);
    canvas.removeEventListener("mouseup", finishPlacement);
    canvas.removeEventListener("mouseout", finishPlacement);
  };

  const moveSticker = (e: MouseEvent) => {
    currentSticker!.drag(e.offsetX, e.offsetY);
    dispatchDrawingChanged();
  };

  canvas.addEventListener("mousemove", moveSticker);
  canvas.addEventListener("mouseup", finishPlacement);
  canvas.addEventListener("mouseout", finishPlacement);
});

// observer pattern: redraw when drawing changes
function dispatchDrawingChanged() {
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
}

// listen for changes and redraw
canvas.addEventListener("drawing-changed", redraw);
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // draw all past commands
  displayList.forEach((cmd) => cmd.display(ctx));
  // draw current stroke
  currentStroke?.display(ctx);
  // draw current sticker being placed
  currentSticker?.display(ctx);
  // draw tool/sticker preview (only if not drawing or placing)
  if (!isDrawing && !isPlacingSticker && currentPreview) {
    currentPreview.display(ctx);
  }
}
