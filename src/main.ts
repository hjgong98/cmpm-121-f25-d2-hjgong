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
col2.style.gap = "4px";
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

// marker size slider
const markerLabel = document.createElement("div");
markerLabel.textContent = "🖌️ Marker Size";
markerLabel.style.fontWeight = "bold";
markerLabel.style.fontSize = "13px";
markerLabel.style.color = "#333";
markerLabel.style.margin = "16px 0 4px 0";

const widthSlider = document.createElement("input");
widthSlider.type = "range";
widthSlider.min = "1";
widthSlider.max = "10";
widthSlider.value = "4";
widthSlider.style.width = "100%";

const widthValue = document.createElement("div");
widthValue.textContent = `Width: ${widthSlider.value}px`;
widthValue.style.fontSize = "12px";
widthValue.style.color = "#555";
widthValue.style.textAlign = "center";
widthValue.style.marginTop = "4px";

widthSlider.addEventListener("input", () => {
  widthValue.textContent = `Width: ${widthSlider.value}px`;
  if (currentTool) {
    currentTool.width = parseInt(widthSlider.value, 10);
    dispatchToolChange();
  }
});

col2.appendChild(markerLabel);
col2.appendChild(widthSlider);
col2.appendChild(widthValue);

// marker color input
const colorLabel = document.createElement("div");
colorLabel.textContent = "Marker Color";
colorLabel.style.fontWeight = "bold";
colorLabel.style.fontSize = "13px";
colorLabel.style.color = "#333";
colorLabel.style.margin = "16px 0 4px 0";
col2.appendChild(colorLabel);

const colorRow = document.createElement("div");
colorRow.style.display = "flex";
colorRow.style.gap = "4px";
colorRow.style.width = "100%";

const colorInput = document.createElement("input");
colorInput.type = "text";
colorInput.value = "#5a3e9d";
colorInput.style.flex = "1";
colorInput.style.fontSize = "12px";
colorInput.style.padding = "4px";
colorInput.style.border = "1px solid #ccc";
colorInput.style.borderRadius = "4px";

const formatBtn = document.createElement("button");
formatBtn.textContent = "RGBO";
formatBtn.style.fontSize = "11px";
formatBtn.style.width = "42px";
formatBtn.style.padding = "0";
formatBtn.style.border = "1px solid #ccc";
formatBtn.style.borderRadius = "4px";
formatBtn.style.backgroundColor = "#f9f9f9";
formatBtn.style.cursor = "pointer";
formatBtn.title = "Toggle HEX ↔ RGB";
colorRow.appendChild(colorInput);
colorRow.appendChild(formatBtn);
col2.appendChild(colorRow);

// internal state: always store as { r, g, b }
let colorRGB = { r: 90, g: 62, b: 157 };

// sync input to current format
function syncColorInput() {
  if (formatBtn.textContent === "RGBO") {
    colorInput.value = `#${
      [colorRGB.r, colorRGB.g, colorRGB.b]
        .map((n) => n.toString(16).padStart(2, "0"))
        .join("")
    }`;
  } else {
    colorInput.value = `rgb(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b})`;
  }
}

// parse input and update internal color
function parseColorInput() {
  const val = colorInput.value.trim();

  if (val.startsWith("#")) {
    const hex = val.slice(1);
    if (hex.length === 3) {
      const [r, g, b] = hex.split("").map((c) => parseInt(c + c, 16));
      colorRGB = { r, g, b };
    } else if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      colorRGB = { r, g, b };
    }
  } else if (val.startsWith("rgb")) {
    const match = val.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      if ([r, g, b].every((n) => n >= 0 && n <= 255)) {
        colorRGB = { r, g, b };
      }
    }
  }

  // update current tool if active
  if (currentTool) {
    currentTool.color = `rgb(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b})`;
    dispatchToolChange();
  }
}

// toggle format
formatBtn.addEventListener("click", () => {
  formatBtn.textContent = formatBtn.textContent === "RGBO" ? "HEX" : "RGBO";
  syncColorInput();
});

exportBtn.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  const exportCtx = exportCanvas.getContext("2d")!;
  const scale = 4;
  exportCanvas.width = 256 * scale;
  exportCanvas.height = 256 * scale;
  exportCtx.scale(scale, scale);
  exportCtx.imageSmoothingEnabled = false;

  // Redraw all commands on the larger canvas
  displayList.forEach((cmd) => cmd.display(exportCtx));
  currentStroke?.display(exportCtx);
  currentSticker?.display(exportCtx);

  // Convert to PNG and trigger download
  exportCanvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "drawing-studio-export.png";
    a.click();
    URL.revokeObjectURL(url); // Clean up
  }, "image/png");
});

// handle manual input
colorInput.addEventListener("input", () => {
  parseColorInput();
  syncColorInput();
});

// handle input blur (in case user didn't trigger final update)
colorInput.addEventListener("change", parseColorInput);

// initialize display
syncColorInput();

col2.appendChild(colorLabel);
col2.appendChild(colorInput);

// draw tool button (to re-enable marker after using sticker)
const drawBtn = document.createElement("button");
drawBtn.textContent = "✏️ Draw";
drawBtn.style.padding = "6px 0";
drawBtn.style.fontSize = "13px";
drawBtn.style.width = "100%";
drawBtn.style.border = "1px solid #5a3e9d";
drawBtn.style.color = "#5a3e9d";
drawBtn.style.backgroundColor = "#f9f3ff";
drawBtn.style.borderRadius = "6px";
drawBtn.style.cursor = "pointer";
drawBtn.style.fontFamily = "sans-serif";
drawBtn.style.fontWeight = "500";

drawBtn.addEventListener("click", () => {
  selectedSticker = null;
  stickerButtons.forEach((btn) => btn.classList.remove("selectedTool"));
  drawBtn.classList.add("selectedTool");
  currentTool = {
    width: parseInt(widthSlider.value, 10),
    color: colorInput.value || "#5a3e9d",
  };
  dispatchToolChange();
});

col2.appendChild(drawBtn);

// emoji Stickers Section
const emojiHeader = document.createElement("div");
emojiHeader.textContent = "Emoji Stickers:";
emojiHeader.style.fontSize = "13px";
emojiHeader.style.color = "#333";
emojiHeader.style.fontWeight = "bold";
emojiHeader.style.marginTop = "16px";

col2.appendChild(emojiHeader);

const baseStickers = ["🎨", "✨", "🎮"];
const customStickers: string[] = [];
const stickerButtons = new Map<string, HTMLButtonElement>();
let selectedSticker: string | null = null;

function createStickerButton(emoji: string, container: HTMLElement) {
  const btn = document.createElement("button");
  btn.textContent = emoji;
  btn.style.fontSize = "18px";
  btn.style.height = "30px";
  btn.style.padding = "0 8px";
  btn.style.flex = "none";
  btn.title = `Place ${emoji}`;
  btn.style.border = "1px solid #ddd";
  btn.style.backgroundColor = "#fff";
  btn.style.borderRadius = "6px";
  btn.style.cursor = "pointer";

  btn.addEventListener("click", () => {
    // deselect draw button and others
    drawBtn.classList.remove("selectedTool");
    stickerButtons.forEach((b) => b.classList.remove("selectedTool"));
    btn.classList.add("selectedTool");
    selectedSticker = emoji;
    currentTool = null;
    dispatchToolChange();
  });

  stickerButtons.set(emoji, btn);
  container.appendChild(btn);
}

const stickerDiv = document.createElement("div");
stickerDiv.style.display = "flex";
stickerDiv.style.justifyContent = "space-between";
stickerDiv.style.width = "100%";
stickerDiv.style.gap = "4px";
stickerDiv.style.marginBottom = "8px";

baseStickers.forEach((emoji) => {
  createStickerButton(emoji, stickerDiv);
});

col2.appendChild(stickerDiv);

// custom stickers UI
const customSection = document.createElement("div");
customSection.style.display = "flex";
customSection.style.flexDirection = "column";
customSection.style.gap = "4px";
customSection.style.width = "100%";

const customHeader = document.createElement("div");
customHeader.textContent = "Custom stickers:";
customHeader.style.fontSize = "12px";
customHeader.style.color = "#555";
customHeader.style.fontWeight = "bold";

const customContainer = document.createElement("div");
customContainer.style.display = "flex";
customContainer.style.flexWrap = "wrap";
customContainer.style.gap = "4px";
customContainer.style.width = "100%";

customSection.appendChild(customHeader);
customSection.appendChild(customContainer);

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
col2.appendChild(customSection);

// PNG stickers section
const pngHeader = document.createElement("div");
pngHeader.textContent = "PNG Stickers:";
pngHeader.style.fontSize = "13px";
pngHeader.style.color = "#333";
pngHeader.style.fontWeight = "bold";
pngHeader.style.marginTop = "16px";
col2.appendChild(pngHeader);

const pngContainer = document.createElement("div");
pngContainer.style.display = "flex";
pngContainer.style.flexWrap = "wrap";
pngContainer.style.gap = "4px";
pngContainer.style.width = "100%";
pngContainer.style.minHeight = "60px";
pngContainer.style.border = "1px dashed #ccc";
pngContainer.style.borderRadius = "6px";
pngContainer.style.padding = "4px";
col2.appendChild(pngContainer);

// my stickers from discord :)
const pngStickers = [
  {
    url: "https://cdn.discordapp.com/emojis/1433646344089763931.webp?size=240",
    name: "pandasleep",
  },
  {
    url: "https://cdn.discordapp.com/emojis/829062430205804624.webp?size=240",
    name: "pandacheese",
  },
  {
    url: "https://cdn.discordapp.com/emojis/828963398594461726.webp?size=240",
    name: "pandacall",
  },
];

// map to store preloaded images
const stickerImages = new Map<string, HTMLImageElement>();

// function to create a sticker button with thumbnail
function createPngStickerButton(url: string, name: string) {
  const btn = document.createElement("button");
  btn.title = `Place ${name}`;
  btn.dataset.name = name;
  btn.style.width = "24px";
  btn.style.height = "24px";
  btn.style.padding = "0";
  btn.style.border = "1px solid #aaa";
  btn.style.borderRadius = "4px";
  btn.style.backgroundColor = "#fff";
  btn.style.cursor = "pointer";
  btn.style.overflow = "hidden";

  const img = new Image();
  img.src = url;
  img.crossOrigin = "anonymous";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "contain";

  btn.appendChild(img);

  // preload and cache the image
  img.onload = () => {
    stickerImages.set(name, img);
  };
  img.onerror = () => {
    console.warn(`Failed to load sticker: ${name}`);
    btn.textContent = "⚠️";
  };

  btn.addEventListener("click", () => {
    // deselect draw tool and emoji stickers
    drawBtn.classList.remove("selectedTool");
    stickerButtons.forEach((b) => b.classList.remove("selectedTool"));
    pngContainer.querySelectorAll("button").forEach((b) =>
      b.classList.remove("selectedTool")
    );
    btn.classList.add("selectedTool");

    selectedSticker = name;
    currentTool = null;
    dispatchToolChange();
  });

  pngContainer.appendChild(btn);
}

// built in png sticker buttons
pngStickers.forEach((sticker) =>
  createPngStickerButton(sticker.url, sticker.name)
);

// custom png input
const customPngSection = document.createElement("div");
customPngSection.style.marginTop = "8px";
customPngSection.style.display = "flex";
customPngSection.style.flexDirection = "column";
customPngSection.style.gap = "4px";
customPngSection.style.width = "100%";

const customPngInput = document.createElement("input");
customPngInput.type = "text";
customPngInput.placeholder = "Sticker URL";
customPngInput.style.fontSize = "12px";
customPngInput.style.padding = "4px";
customPngInput.style.border = "1px solid #ccc";
customPngInput.style.borderRadius = "4px";
customPngInput.style.width = "100%";

const addPngBtn = document.createElement("button");
addPngBtn.textContent = "+";
addPngBtn.style.width = "100%";
addPngBtn.style.padding = "2px 0";
addPngBtn.style.fontSize = "12px";
addPngBtn.style.border = "1px solid #0a84ff";
addPngBtn.style.color = "#0a84ff";
addPngBtn.style.backgroundColor = "#f0f8ff";
addPngBtn.style.borderRadius = "4px";
addPngBtn.style.cursor = "pointer";

customPngSection.appendChild(customPngInput);
customPngSection.appendChild(addPngBtn);
col2.appendChild(customPngSection);

// track custom user-added stickers
type CustomPngSticker = { url: string; name: string; img: HTMLImageElement };
const customPngStickers: CustomPngSticker[] = [];

// helper: find image by name in built-in OR custom stickers
function getStickerImage(name: string): HTMLImageElement | null {
  if (stickerImages.has(name)) return stickerImages.get(name)!;
  const found = customPngStickers.find((s) => s.name === name);
  return found ? found.img : null;
}

addPngBtn.addEventListener("click", () => {
  const url = customPngInput.value.trim();
  if (!url) {
    globalThis.alert("Please enter a URL");
    return;
  }
  if (!/\.(png|webp|jpe?g|gif)$/i.test(url)) {
    globalThis.alert("URL must end with .png, .webp, .jpg, .jpeg, or .gif");
    return;
  }

  const img = new Image();
  img.crossOrigin = "anonymous";
  const name = url.split("/").pop()?.split("?")[0]?.substring(0, 10) ||
    "custom";

  img.onload = () => {
    if (customPngStickers.length >= 3) {
      const confirm = globalThis.confirm(
        "3 custom stickers max. Replace oldest?",
      );
      if (!confirm) return;
      const removed = customPngStickers.shift();
      const btn = pngContainer.querySelector(`[data-name="${removed?.name}"]`);
      if (btn) btn.remove();
    }

    const sticker: CustomPngSticker = { url, name, img };
    customPngStickers.push(sticker);
    createCustomPngButton(sticker);
    customPngInput.value = "";
  };

  img.onerror = () =>
    globalThis.alert("Failed to load image (CORS or broken link).");
  img.src = url;
});

function createCustomPngButton(sticker: CustomPngSticker) {
  const btn = document.createElement("button");
  btn.title = `Place ${sticker.name}`;
  btn.dataset.name = sticker.name;
  btn.style.width = "24px";
  btn.style.height = "24px";
  btn.style.padding = "0";
  btn.style.border = "1px solid #0a84ff";
  btn.style.borderRadius = "4px";
  btn.style.backgroundColor = "#fff";
  btn.style.cursor = "pointer";
  btn.style.overflow = "hidden";

  const img = sticker.img;
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "contain";
  btn.appendChild(img);

  btn.addEventListener("click", () => {
    drawBtn.classList.remove("selectedTool");
    stickerButtons.forEach((b) => b.classList.remove("selectedTool"));
    pngContainer.querySelectorAll("button").forEach((b) =>
      b.classList.remove("selectedTool")
    );
    btn.classList.add("selectedTool");
    selectedSticker = sticker.name;
    currentTool = null;
    dispatchToolChange();
  });

  pngContainer.appendChild(btn);
}

// canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "drawing-canvas";
canvas.style.border = "1px solid black";
canvas.style.borderRadius = "12px";
canvas.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
col1.appendChild(canvas);

// undo/redo
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
undoRedoDiv.appendChild(redoBtn);
undoRedoDiv.appendChild(undoBtn);

col1.appendChild(undoRedoDiv);

// current tool state
type Tool = { width: number; color: string };
let currentTool: Tool | null = { width: 4, color: "#5a3e9d" };

// canvas context
const ctx = canvas.getContext("2d")!;
ctx.lineCap = "round";
ctx.strokeStyle = "#5a3e9d";

// commands
interface DrawCommand {
  display(ctx: CanvasRenderingContext2D): void;
  drag?(x: number, y: number): void;
}

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

class StickerPreview implements DrawCommand {
  constructor(private x: number, private y: number, private sticker: string) {}
  display(ctx: CanvasRenderingContext2D) {
    const img = getStickerImage(this.sticker);
    if (img) {
      const size = 32;
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.drawImage(img, this.x - size / 2, this.y - size / 2, size, size);
      ctx.restore();
    }
  }
}

class PlaceSticker implements DrawCommand {
  constructor(private x: number, private y: number, private sticker: string) {}

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    const isImageUrl = /\.(png|webp|jpe?g|gif)/i.test(this.sticker);
    const isCustomPng = customPngStickers.some((s) => s.name === this.sticker);
    const isBuiltInPng = pngStickers.some((s) => s.name === this.sticker);

    // If it's a PNG sticker (built-in or custom), use image
    if (isImageUrl || isBuiltInPng || isCustomPng) {
      const img = getStickerImage(this.sticker);
      if (img) {
        const size = 32;
        ctx.drawImage(img, this.x - size / 2, this.y - size / 2, size, size);
      }
    } else {
      // It's an emoji — just draw the text
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.sticker, this.x, this.y);
    }
  }
}

// runtime state
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

function dispatchToolMove() {
  const event = new CustomEvent("tool-moved", {
    detail: { x: lastMouseX, y: lastMouseY },
  });
  canvas.dispatchEvent(event);
}

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

// undo
undoBtn.addEventListener("click", () => {
  if (displayList.length === 0) return;
  const last = displayList.pop()!;
  redoStack.push(last);
  redraw();
});

// redo
redoBtn.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  const action = redoStack.pop()!;
  displayList.push(action);
  redraw();
});

// drawing events
canvas.addEventListener("mousedown", (e) => {
  if (selectedSticker || !currentTool) return;
  isDrawing = true;
  currentStroke = new MarkerLine(currentTool.width, currentTool.color);
  currentStroke.start(e.offsetX, e.offsetY);
  redraw();
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing && currentStroke) {
    currentStroke.drag(e.offsetX, e.offsetY);
    redraw();
  }
});

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

// redraw
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  displayList.forEach((cmd) => cmd.display(ctx));
  currentStroke?.display(ctx);
  currentSticker?.display(ctx);
  if (!isDrawing && !currentSticker && currentPreview) {
    currentPreview.display(ctx);
  }
}

// initialize draw button
drawBtn.classList.add("selectedTool");
