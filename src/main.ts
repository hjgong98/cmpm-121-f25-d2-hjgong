// title
const title = document.createElement("h1");
title.textContent = "Drawing Studio";
title.style.margin = "0";

// declare custom event so typescript will stop complaining
declare global {
  interface HTMLElementEventMap {
    "tool-moved": CustomEvent<{ x: number; y: number }>;
  }
}

// two columns
const mainContainer = document.createElement("div");
mainContainer.style.display = "flex";
mainContainer.style.gap = "32px";
mainContainer.style.justifyContent = "center";
mainContainer.style.alignItems = "flex-start";
mainContainer.style.width = "100%";
mainContainer.style.maxWidth = "620px";
mainContainer.style.margin = "0 auto";
mainContainer.style.padding = "20px 0";
document.body.appendChild(mainContainer);

// main drawing area
const col1 = document.createElement("div");
col1.style.display = "flex";
col1.style.flexDirection = "column";
col1.style.alignItems = "center";
col1.style.gap = "16px";
col1.style.width = "256px";
mainContainer.appendChild(col1);

// sidebar
const col2 = document.createElement("div");
col2.style.display = "flex";
col2.style.flexDirection = "column";
col2.style.gap = "16px";
col2.style.width = "130px";
mainContainer.appendChild(col2);

col1.appendChild(title);
const spacer1 = document.createElement("div");
spacer1.style.height = "24px";
col2.appendChild(spacer1);

// clear button
const clearBtn = document.createElement("button");
clearBtn.textContent = "🗑️ Clear Canvas";
clearBtn.style.padding = "8px 12px";
clearBtn.style.fontSize = "14px";
clearBtn.style.border = "1px solid #ccc";
clearBtn.style.backgroundColor = "#f0f0f0";
clearBtn.style.borderRadius = "6px";
clearBtn.style.cursor = "pointer";
clearBtn.style.fontFamily = "sans-serif";
clearBtn.style.width = "100%";
col1.appendChild(clearBtn);

// export button
const exportBtn = document.createElement("button");
exportBtn.textContent = "📤 Export (4×)";
exportBtn.title = "Export drawing as 1024×1024 PNG";
exportBtn.style.width = "100%";
exportBtn.style.textAlign = "center";
exportBtn.style.padding = "8px 0";
exportBtn.style.fontSize = "14px";
exportBtn.style.fontFamily = "sans-serif";
exportBtn.style.cursor = "pointer";
exportBtn.style.border = "1px solid #0a84ff";
exportBtn.style.color = "#0a84ff";
exportBtn.style.backgroundColor = "#f0f8ff";
exportBtn.style.borderRadius = "6px";
exportBtn.style.fontWeight = "500";
col2.appendChild(exportBtn);

// export logic
exportBtn.addEventListener("click", () => {
  // create temporary canvas
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024; // 4x of 256
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d")!;

  // scale up: 4x zoom
  exportCtx.scale(4, 4);

  // re-run all drawing commands (no previews, no currentStroke/sticker)
  displayList.forEach((cmd) => cmd.display(exportCtx));

  // convert to PNG and trigger download
  exportCanvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = "drawing-studio-export.png";
  link.href = exportCanvas.toDataURL("image/png");
  link.click();
});

const markerDiv = document.createElement("div");
markerDiv.style.display = "flex";
markerDiv.style.gap = "8px";
markerDiv.style.justifyContent = "space-between";

// thin button
const thinBtn = document.createElement("button");
thinBtn.textContent = "Thin";
thinBtn.classList.add("tool-btn", "selectedTool");

// thick button
const thickBtn = document.createElement("button");
thickBtn.textContent = "Thick";
thickBtn.classList.add("tool-btn");

markerDiv.appendChild(thinBtn);
markerDiv.appendChild(thickBtn);
col2.appendChild(markerDiv);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "drawing-canvas";
canvas.style.border = "1px solid black";
canvas.style.borderRadius = "12px";
canvas.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
col1.appendChild(canvas);

// base stickers
const baseStickers = ["🎨", "✨", "🎮"];

// user added sticers
const customStickers: string[] = [];

// combine all stickers
const stickerButtons = new Map<string, HTMLButtonElement>();
let selectedSticker: string | null = null;

function createStickerButton(emoji: string, container: HTMLElement) {
  const btn = document.createElement("button");
  btn.textContent = emoji;
  btn.classList.add("tool-btn");
  btn.style.fontSize = "18px";
  btn.style.height = "30px";
  btn.style.padding = "0 8px";
  btn.style.flex = "none";
  btn.title = `Place ${emoji}`;

  btn.addEventListener("click", () => {
    // deselect all tools
    [thinBtn, thickBtn].forEach((b) => b.classList.remove("selectedTool"));
    stickerButtons.forEach((b) => b.classList.remove("selectedTool"));
    btn.classList.add("selectedTool");
    selectedSticker = emoji;
    currentTool = null;
    dispatchToolChange();
  });

  stickerButtons.set(emoji, btn);
  container.appendChild(btn);
}

// base sticker buttons
const stickerDiv = document.createElement("div");
stickerDiv.style.display = "flex";
stickerDiv.style.justifyContent = "space-between";
stickerDiv.style.width = "100%";
stickerDiv.style.gap = "6px";
stickerDiv.style.marginBottom = "8px";

baseStickers.forEach((emoji) => {
  createStickerButton(emoji, stickerDiv);
});

col2.appendChild(stickerDiv);

// custom stickers ui
const customSection = document.createElement("div");
customSection.style.display = "flex";
customSection.style.flexDirection = "column";
customSection.style.gap = "8px";
customSection.style.width = "100%";

const customHeader = document.createElement("div");
customHeader.textContent = "Custom stickers:";
customHeader.style.fontSize = "12px";
customHeader.style.color = "#555";
customHeader.style.fontWeight = "bold";

const customContainer = document.createElement("div");
customContainer.style.display = "flex";
customContainer.style.flexWrap = "wrap";
customContainer.style.gap = "6px";
customContainer.style.width = "100%";

customSection.appendChild(customHeader);
customSection.appendChild(customContainer);

col2.appendChild(customSection);

const addButton = document.createElement("button");
addButton.textContent = "+";
addButton.style.fontSize = "14px";
addButton.style.height = "30px";
addButton.style.padding = "4px 8px";
addButton.style.width = "fit-content";
addButton.title = "Add custom emoji sticker";

addButton.addEventListener("click", () => {
  const input = prompt("Enter an emoji to use as a sticker:", "🔥");
  if (input === null) return;
  const emoji = input.trim();
  if (!emoji) return;

  if (customStickers.length >= 3) {
    const confirm = globalThis.confirm(
      `You already have 3 custom stickers. Remove the oldest one to make room for '${emoji}'?`,
    );
    if (!confirm) return;

    const removed = customStickers.shift();
    const btn = stickerButtons.get(removed!);
    if (btn && btn.parentNode) {
      btn.remove();
      stickerButtons.delete(removed!);
    }
  }

  customStickers.push(emoji);
  createStickerButton(emoji, customContainer);
});

customSection.appendChild(addButton);

const undoBtn = document.createElement("button");
undoBtn.textContent = "↩️ Undo";
undoBtn.style.width = "calc(50% - 4px)";
undoBtn.style.padding = "6px 0";
undoBtn.style.fontSize = "13px";
undoBtn.style.border = "1px solid #aaa";
undoBtn.style.backgroundColor = "#f8f8f8";
undoBtn.style.borderRadius = "6px";
undoBtn.style.cursor = "pointer";
undoBtn.style.fontFamily = "sans-serif";
undoBtn.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";

const redoBtn = document.createElement("button");
redoBtn.textContent = "↪️ Redo";
redoBtn.style.width = "calc(50% - 4px)";
redoBtn.style.padding = "6px 0";
redoBtn.style.fontSize = "13px";
redoBtn.style.border = "1px solid #aaa";
redoBtn.style.backgroundColor = "#f8f8f8";
redoBtn.style.borderRadius = "6px";
redoBtn.style.cursor = "pointer";
redoBtn.style.fontFamily = "sans-serif";
redoBtn.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";

const undoRedoDiv = document.createElement("div");
undoRedoDiv.style.display = "flex";
undoRedoDiv.style.justifyContent = "space-between";
undoRedoDiv.style.width = "100%";
undoRedoDiv.appendChild(undoBtn);
undoRedoDiv.appendChild(redoBtn);
col1.appendChild(undoRedoDiv);

// ✏️ Current tool state
type Tool = { width: number; color: string };
let currentTool: Tool | null = { width: 4, color: "#5a3e9d" };

function selectMarker(tool: Tool, button: HTMLButtonElement) {
  [thinBtn, thickBtn].forEach((b) => b.classList.remove("selectedTool"));

  stickerButtons.forEach((button) => button.classList.remove("selectedTool"));

  button.classList.add("selectedTool");
  currentTool = tool;
  selectedSticker = null;
  dispatchToolChange();
}

thinBtn.addEventListener(
  "click",
  () => selectMarker({ width: 4, color: "#5a3e9d" }, thinBtn),
);
thickBtn.addEventListener(
  "click",
  () => selectMarker({ width: 12, color: "#5a3e9d" }, thickBtn),
);

// canvas context
const ctx = canvas.getContext("2d")!;
ctx.lineCap = "round";
ctx.strokeStyle = "#5a3e9d";

// commands
interface DrawCommand {
  display(ctx: CanvasRenderingContext2D): void;
  drag?(x: number, y: number): void;
}

// markerline class
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

// toolpreview class
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
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.fillStyle = this.color + "44";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// stickerpreview class
class StickerPreview implements DrawCommand {
  constructor(private x: number, private y: number, private emoji: string) {}

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

// placesticker command
class PlaceSticker implements DrawCommand {
  constructor(private x: number, private y: number, private emoji: string) {}

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

// mouse move tracking
canvas.addEventListener("mousemove", (e) => {
  lastMouseX = e.offsetX;
  lastMouseY = e.offsetY;
  if (!isDrawing && !currentSticker) {
    dispatchToolMove();
  }
});

// tool move event
function dispatchToolMove() {
  const event = new CustomEvent("tool-moved", {
    detail: { x: lastMouseX, y: lastMouseY },
  });
  canvas.dispatchEvent(event);
}

// tool change
function dispatchToolChange() {
  dispatchToolMove();
}

// clear canvas
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

// drawing events
canvas.addEventListener("mousedown", (e) => {
  if (selectedSticker) return;

  if (!currentTool) return;

  isDrawing = true;
  currentStroke = new MarkerLine(currentTool.width, currentTool.color);
  currentStroke.start(e.offsetX, e.offsetY);
  redraw();
});

// mouse
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

// sticker button
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

// tool preview
canvas.addEventListener(
  "tool-moved",
  (e: CustomEvent<{ x: number; y: number }>) => {
    const { x, y } = e.detail;
    if (selectedSticker) {
      currentPreview = new StickerPreview(x, y, selectedSticker);
    } else if (currentTool) {
      currentPreview = new ToolPreview(
        x,
        y,
        currentTool.width,
        currentTool.color,
      );
    } else {
      currentPreview = null;
    }

    redraw();
  },
);

// redraw canvas
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw all saved commands
  displayList.forEach((cmd) => cmd.display(ctx));

  // draw current stroke
  currentStroke?.display(ctx);

  // draw sticker being placed
  currentSticker?.display(ctx);

  // draw preview (if not drawing or placing)
  if (!isDrawing && !currentSticker && currentPreview) {
    currentPreview.display(ctx);
  }
}
