// DOM Elements
const elements = {
    imageInput: document.getElementById("imageInput"),
    multiplierInput: document.getElementById("multiplier"),
    canvas: document.getElementById("canvas"),
    outputInfo: document.getElementById("outputInfo"),
    downloadBtn: document.getElementById("downloadBtn"),
    modeButtons: document.querySelectorAll('.mode-selector button'),
    fileInputLabel: document.querySelector('.file-input-label')
};

/**
 * Parses a GIF file and returns its frames and delays
 * @param {ArrayBuffer} arrayBuffer - The GIF file as an ArrayBuffer
 * @returns {Promise<Object>} Object containing frames and delays
 */
async function parseGIF(arrayBuffer) {
    return new Promise((resolve, reject) => {
        const gif = new GifReader(new Uint8Array(arrayBuffer));
        const frames = [];
        const delays = [];
        
        for (let i = 0; i < gif.numFrames(); i++) {
            const frameInfo = gif.frameInfo(i);
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = frameInfo.width;
            frameCanvas.height = frameInfo.height;
            const frameCtx = frameCanvas.getContext('2d');
            
            const imageData = frameCtx.createImageData(frameInfo.width, frameInfo.height);
            gif.decodeAndBlitFrameRGBA(i, imageData.data);
            frameCtx.putImageData(imageData, 0, 0);
            
            frames.push(frameCanvas);
            delays.push(frameInfo.delay * 10); // Convert to milliseconds
        }
        
        resolve({ frames, delays });
    });
}

// Canvas context
const ctx = elements.canvas.getContext("2d");

// State
const state = {
    originalImage: new Image(),
    currentMode: 'upscale',
    isGif: false,
    gifFrames: [],
    gifDelays: [],
    currentFrame: 0,
    animationId: null
};

// Constants
const CONSTANTS = {
    MAX_SCALE: 10,
    MIN_SCALE: 0.1,
    DEFAULT_UPSCALE: 2,
    DEFAULT_DOWNSCALE: 0.5
};

/**
 * Sets the current processing mode and updates UI accordingly
 * @param {string} mode - The mode to set ('upscale' or 'downscale')
 */
function setMode(mode) {
    state.currentMode = mode;
    
    // Update button states
    elements.modeButtons.forEach(btn => {
        const isActive = btn.dataset.mode === mode;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive);
    });
    
    // Update multiplier constraints
    if (mode === 'upscale') {
        elements.multiplierInput.min = '1';
        elements.multiplierInput.max = CONSTANTS.MAX_SCALE.toString();
        if (parseFloat(elements.multiplierInput.value) < 1) {
            elements.multiplierInput.value = CONSTANTS.DEFAULT_UPSCALE.toString();
        }
    } else {
        elements.multiplierInput.min = CONSTANTS.MIN_SCALE.toString();
        elements.multiplierInput.max = '1';
        if (parseFloat(elements.multiplierInput.value) > 1) {
            elements.multiplierInput.value = CONSTANTS.DEFAULT_DOWNSCALE.toString();
        }
    }
    
    if (state.originalImage.src) {
        updateCanvas();
    }
}

/**
 * Calculates the average color of a block of pixels
 * @param {Uint8ClampedArray} pixels - The image pixel data
 * @param {number} startX - Starting X coordinate
 * @param {number} startY - Starting Y coordinate
 * @param {number} blockSize - Size of the block to average
 * @returns {Object} The average color values
 */
function getAverageColor(pixels, startX, startY, blockSize) {
    let r = 0, g = 0, b = 0, a = 0;
    let count = 0;
    
    for (let y = startY; y < startY + blockSize; y++) {
        for (let x = startX; x < startX + blockSize; x++) {
            const idx = (y * state.originalImage.width + x) * 4;
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

/**
 * Downscales the image by averaging pixel blocks
 */
function downscaleImage() {
    const scale = parseFloat(elements.multiplierInput.value);
    if (isNaN(scale) || scale <= 0 || scale >= 1) return;

    const w = state.originalImage.width;
    const h = state.originalImage.height;
    const blockSize = Math.round(1 / scale);
    const newW = Math.round(w / blockSize);
    const newH = Math.round(h / blockSize);

    elements.canvas.width = newW;
    elements.canvas.height = newH;

    // Get image data
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(state.originalImage, 0, 0);
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
    updateOutputInfo(w, h, newW, newH, 'Downscaled');
}

/**
 * Upscales the image using nearest-neighbor interpolation
 */
function upscaleImage() {
    const scale = parseFloat(elements.multiplierInput.value);
    if (isNaN(scale) || scale <= 0 || !state.originalImage.src) return;

    const w = state.originalImage.width;
    const h = state.originalImage.height;
    const newW = Math.round(w * scale);
    const newH = Math.round(h * scale);

    elements.canvas.width = newW;
    elements.canvas.height = newH;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, newW, newH);
    ctx.drawImage(state.originalImage, 0, 0, w, h, 0, 0, newW, newH);

    updateOutputInfo(w, h, newW, newH, 'Upscaled');
}

/**
 * Updates the output information display
 */
function updateOutputInfo(originalW, originalH, newW, newH, mode) {
    elements.outputInfo.innerText = `Original: ${originalW}x${originalH} → ${mode}: ${newW}x${newH}`;
    elements.downloadBtn.style.display = "inline-block";
}

/**
 * Handles the image file processing
 * @param {File} file - The image file to process
 */
async function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    // Reset state
    state.isGif = false;
    state.gifFrames = [];
    state.gifDelays = [];
    state.currentFrame = 0;
    if (state.animationId) {
        cancelAnimationFrame(state.animationId);
        state.animationId = null;
    }

    if (file.type === 'image/gif') {
        state.isGif = true;
        const arrayBuffer = await file.arrayBuffer();
        const gif = await parseGIF(arrayBuffer);
        state.gifFrames = gif.frames;
        state.gifDelays = gif.delays;
        
        // Set canvas size based on first frame
        const firstFrame = state.gifFrames[0];
        elements.canvas.width = firstFrame.width;
        elements.canvas.height = firstFrame.height;
        
        // Start animation
        animateGif();
    } else {
        const reader = new FileReader();
        reader.onload = () => {
            state.originalImage.onload = updateCanvas;
            state.originalImage.src = reader.result;
        };
        reader.onerror = () => {
            alert('Error reading file');
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Animates the GIF frames
 */
function animateGif() {
    if (!state.isGif || state.gifFrames.length === 0) return;

    const frame = state.gifFrames[state.currentFrame];
    const scale = parseFloat(elements.multiplierInput.value);
    
    // Upscale the frame
    const newW = Math.round(frame.width * scale);
    const newH = Math.round(frame.height * scale);
    
    elements.canvas.width = newW;
    elements.canvas.height = newH;
    
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, newW, newH);
    ctx.drawImage(frame, 0, 0, frame.width, frame.height, 0, 0, newW, newH);
    
    updateOutputInfo(frame.width, frame.height, newW, newH, 'Upscaled GIF');
    
    // Schedule next frame
    state.currentFrame = (state.currentFrame + 1) % state.gifFrames.length;
    state.animationId = setTimeout(animateGif, state.gifDelays[state.currentFrame]);
}

/**
 * Updates the canvas based on current mode and settings
 */
function updateCanvas() {
    if (state.isGif) {
        // For GIFs, we handle animation in animateGif()
        return;
    }
    
    if (state.currentMode === 'upscale') {
        upscaleImage();
    } else {
        downscaleImage();
    }
}

// Event Listeners
elements.imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        handleImageFile(file);
    }
});

elements.multiplierInput.addEventListener("input", updateCanvas);

elements.downloadBtn.addEventListener("click", async () => {
    if (state.isGif) {
        // For GIFs, we need to create a new GIF with upscaled frames
        const scale = parseFloat(elements.multiplierInput.value);
        const upscaledFrames = state.gifFrames.map(frame => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const newW = Math.round(frame.width * scale);
            const newH = Math.round(frame.height * scale);
            canvas.width = newW;
            canvas.height = newH;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(frame, 0, 0, frame.width, frame.height, 0, 0, newW, newH);
            return canvas;
        });
        
        // Use gif.js to create the new GIF
        const gif = new GIF({
            workers: 2,
            quality: 10,
            width: upscaledFrames[0].width,
            height: upscaledFrames[0].height
        });
        
        upscaledFrames.forEach((frame, i) => {
            gif.addFrame(frame, {delay: state.gifDelays[i]});
        });
        
        gif.on('finished', function(blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = "pixel-perfect-upscaled.gif";
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        });
        
        gif.render();
    } else {
        const link = document.createElement("a");
        link.download = `pixel-perfect-${state.currentMode}d.png`;
        link.href = elements.canvas.toDataURL("image/png");
        link.click();
    }
});

// Drag and drop support
document.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.fileInputLabel.style.background = 'var(--primary)';
    elements.fileInputLabel.style.borderColor = 'var(--primary)';
});

document.addEventListener('dragleave', () => {
    elements.fileInputLabel.style.background = 'var(--bg-light)';
    elements.fileInputLabel.style.borderColor = 'var(--border)';
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.fileInputLabel.style.background = 'var(--bg-light)';
    elements.fileInputLabel.style.borderColor = 'var(--border)';
    
    const file = e.dataTransfer.files[0];
    if (file) {
        handleImageFile(file);
    }
});

// Initialize mode selector
elements.modeButtons.forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

// Set initial mode
setMode('upscale'); 