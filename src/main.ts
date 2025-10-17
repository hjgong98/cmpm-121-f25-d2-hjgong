// title
const title = document.createElement('h1');
title.textContent = 'Drawing Studio';
document.body.appendChild(title);

// create canvas
const canvas = document.createElement('canvas');
canvas.width = 256;
canvas.height = 256;
canvas.id = 'drawing-canvas';
document.body.appendChild(canvas);
