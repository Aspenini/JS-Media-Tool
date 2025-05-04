const imageInput = document.getElementById("imageInput");
const multiplierInput = document.getElementById("multiplier");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const outputInfo = document.getElementById("outputInfo");
const downloadBtn = document.getElementById("downloadBtn");
const modeButtons = document.querySelectorAll('.mode-selector button');

let originalImage = new Image();
let currentMode = 'upscale';

function setMode(mode) {
    currentMode = mode;
    modeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    if (originalImage.src) {
        updateCanvas();
    }
}

function getAverageColor(pixels, startX, startY, blockSize) {
    let r = 0, g = 0, b = 0, a = 0;
    let count = 0;
    
    for (let y = startY; y < startY + blockSize; y++) {
        for (let x = startX; x < startX + blockSize; x++) {
            const idx = (y * originalImage.width + x) * 4;
            r += pixels[idx];
            g += pixels[idx + 1];
            b += pixels[idx + 2];
            a += pixels[idx + 3];
            count++;
        }
    }
    
    return {
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count),
        a: Math.round(a / count)
    };
}

function downscaleImage() {
    const scale = parseFloat(multiplierInput.value);
    if (isNaN(scale) || scale <= 0 || scale >= 1) return;

    const w = originalImage.width;
    const h = originalImage.height;
    const blockSize = Math.round(1 / scale);
    const newW = Math.round(w / blockSize);
    const newH = Math.round(h / blockSize);

    canvas.width = newW;
    canvas.height = newH;

    // Get image data
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(originalImage, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, w, h);
    const pixels = imageData.data;

    // Create new image data for downscaled image
    const newImageData = ctx.createImageData(newW, newH);
    const newPixels = newImageData.data;

    // Process each block
    for (let y = 0; y < newH; y++) {
        for (let x = 0; x < newW; x++) {
            const blockX = x * blockSize;
            const blockY = y * blockSize;
            const color = getAverageColor(pixels, blockX, blockY, blockSize);
            
            const idx = (y * newW + x) * 4;
            newPixels[idx] = color.r;
            newPixels[idx + 1] = color.g;
            newPixels[idx + 2] = color.b;
            newPixels[idx + 3] = color.a;
        }
    }

    ctx.putImageData(newImageData, 0, 0);
    outputInfo.innerText = `Original: ${w}x${h} → Downscaled: ${newW}x${newH}`;
    downloadBtn.style.display = "inline-block";
}

function upscaleImage() {
    const scale = parseFloat(multiplierInput.value);
    if (isNaN(scale) || scale <= 0 || !originalImage.src) return;

    const w = originalImage.width;
    const h = originalImage.height;
    const newW = Math.round(w * scale);
    const newH = Math.round(h * scale);

    canvas.width = newW;
    canvas.height = newH;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, newW, newH);
    ctx.drawImage(originalImage, 0, 0, w, h, 0, 0, newW, newH);

    outputInfo.innerText = `Original: ${w}x${h} → Upscaled: ${newW}x${newH}`;
    downloadBtn.style.display = "inline-block";
}

function updateCanvas() {
    if (currentMode === 'upscale') {
        upscaleImage();
    } else {
        downscaleImage();
    }
}

imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        originalImage.onload = updateCanvas;
        originalImage.src = reader.result;
    };
    reader.readAsDataURL(file);
});

multiplierInput.addEventListener("input", updateCanvas);

downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `pixel-perfect-${currentMode}d.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
});

// Initialize mode selector
modeButtons.forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
});
setMode('upscale'); 