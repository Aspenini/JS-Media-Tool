function openTab(tabId) {
  // Hide all tabs with animation
  document.querySelectorAll('.tabcontent').forEach(tab => {
    if (tab.id !== tabId) {
      tab.style.opacity = '0';
      tab.style.transform = 'translateY(20px)';
      setTimeout(() => {
        tab.style.display = 'none';
      }, 300);
    }
  });

  // Update tab buttons
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[onclick="openTab('${tabId}')"]`).classList.add('active');

  // Show selected tab with animation
  const selectedTab = document.getElementById(tabId);
  selectedTab.style.display = 'block';
  // Force a reflow
  selectedTab.offsetHeight;
  selectedTab.style.opacity = '1';
  selectedTab.style.transform = 'translateY(0)';
}

// Scaler Tool Logic
function scaleImage() {
  const fileInput = document.getElementById("scaleInput").files[0];
  const factor = parseFloat(document.getElementById("scaleFactor").value);
  if (!fileInput || !factor) {
    showNotification("Please select an image and enter a scale factor.", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.getElementById("scaleCanvas");
      const ctx = canvas.getContext("2d");
      
      // Set canvas dimensions
      canvas.width = img.width * factor;
      canvas.height = img.height * factor;
      
      // Disable image smoothing for pixel-perfect scaling
      ctx.imageSmoothingEnabled = false;
      
      // Draw the image at the exact size
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const out = canvas.toDataURL("image/png");
      const link = document.getElementById("scaleDownload");
      link.href = out;
      
      // Get original filename without extension
      const originalName = fileInput.name.replace(/\.[^/.]+$/, "");
      link.download = `${originalName}_upscaled.png`;
      
      link.style.display = "inline-block";
      showNotification("Image scaled successfully!", "success");
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(fileInput);
}

// Slicer Tool Logic
let image1 = null;
let image2 = null;

document.getElementById("img1").onchange = e => loadImage(e.target.files[0], 1);
document.getElementById("img2").onchange = e => loadImage(e.target.files[0], 2);
document.getElementById("allDirections").onchange = e => {
  document.getElementById("direction").disabled = e.target.checked;
};

function loadImage(file, slot) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      if (slot === 1) image1 = img;
      else image2 = img;
      showNotification(`Image ${slot} loaded successfully!`, "success");
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function extractNumber(name) {
  const match = name.match(/\d+/);
  return match ? match[0] : "00";
}

function drawDiagonal(imgA, imgB, width, height, direction) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(imgA, 0, 0);
  ctx.save();
  ctx.beginPath();

  if (direction === "tl2br") {
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
  } else if (direction === "tr2bl") {
    ctx.moveTo(canvas.width, 0);
    ctx.lineTo(0, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);
  }

  ctx.closePath();
  ctx.clip();
  ctx.drawImage(imgB, 0, 0);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

document.getElementById("generate").onclick = () => {
  if (!image1 || !image2) {
    showNotification("Please upload both images first.", "error");
    return;
  }

  const allDirections = document.getElementById("allDirections").checked;
  const dirSelect = document.getElementById("direction");
  const file1 = document.getElementById("img1").files[0];
  const file2 = document.getElementById("img2").files[0];
  const num1 = extractNumber(file1.name);
  const num2 = extractNumber(file2.name);
  const w = image1.width;
  const h = image1.height;
  const outputList = document.getElementById("outputList");
  outputList.innerHTML = "";

  if (allDirections) {
    const variants = [
      { a: image1, b: image2, name: `tl2br_${num1}_${num2}.png`, dir: "tl2br" },
      { a: image2, b: image1, name: `tl2br_${num2}_${num1}.png`, dir: "tl2br" },
      { a: image1, b: image2, name: `tr2bl_${num1}_${num2}.png`, dir: "tr2bl" },
      { a: image2, b: image1, name: `tr2bl_${num2}_${num1}.png`, dir: "tr2bl" },
    ];

    variants.forEach((variant, index) => {
      setTimeout(() => {
        const dataURL = drawDiagonal(variant.a, variant.b, w, h, variant.dir);
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = variant.name;
        link.className = "download-link fade-in";
        link.textContent = `Download ${variant.name}`;
        outputList.appendChild(link);
      }, index * 200); // Stagger the animations
    });
  } else {
    const direction = dirSelect.value === "left" ? "tl2br" : "tr2bl";
    const dataURL = drawDiagonal(image1, image2, w, h, direction);
    const name = `${direction}_${num1}_${num2}.png`;
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = name;
    link.className = "download-link fade-in";
    link.textContent = `Download ${name}`;
    outputList.appendChild(link);
  }

  showNotification("Images generated successfully!", "success");
};

// Notification system
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type} fade-in`;
  notification.textContent = message;
  
  // Add styles for the notification
  notification.style.position = "fixed";
  notification.style.bottom = "20px";
  notification.style.right = "20px";
  notification.style.padding = "1rem 2rem";
  notification.style.borderRadius = "8px";
  notification.style.color = "white";
  notification.style.fontWeight = "500";
  notification.style.zIndex = "1000";
  notification.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
  
  // Set background color based on type
  switch(type) {
    case "success":
      notification.style.backgroundColor = "var(--success)";
      break;
    case "error":
      notification.style.backgroundColor = "#ef4444";
      break;
    default:
      notification.style.backgroundColor = "var(--primary)";
  }
  
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateY(20px)";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Audio Processing Logic
let audioContext = null;
let audioBuffer = null;

async function processAudio() {
  const fileInput = document.getElementById("audioInput").files[0];
  const effect = document.getElementById("audioEffect").value;
  
  if (!fileInput) {
    showNotification("Please select an audio file first.", "error");
    return;
  }

  try {
    // Initialize audio context if not already done
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Read the audio file
    const arrayBuffer = await fileInput.arrayBuffer();
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Process based on selected effect
    let processedBuffer;
    switch(effect) {
      case 'vintageRadio':
        processedBuffer = await applyVintageRadioEffect(audioBuffer);
        break;
      default:
        throw new Error("Unknown effect selected");
    }

    // Create audio element and download link
    const audioElement = document.getElementById("processedAudio");
    const downloadLink = document.getElementById("audioDownload");
    
    // Convert to WAV and create download link
    const wavBlob = audioBufferToWavBlob(processedBuffer);
    const url = URL.createObjectURL(wavBlob);
    
    audioElement.src = url;
    downloadLink.href = url;
    downloadLink.download = `${fileInput.name.replace(/\.[^/.]+$/, "")}_${effect}.wav`;
    
    audioElement.style.display = "block";
    downloadLink.style.display = "inline-block";
    
    showNotification("Audio processed successfully!", "success");
  } catch (error) {
    console.error("Error processing audio:", error);
    showNotification("Error processing audio: " + error.message, "error");
  }
}

function audioBufferToWavBlob(buffer) {
  // Adapted from: https://github.com/Jam3/audiobuffer-to-wav
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const samples = buffer.length;
  const blockAlign = numChannels * bitDepth / 8;
  const byteRate = sampleRate * blockAlign;
  const wavBuffer = new ArrayBuffer(44 + samples * blockAlign);
  const view = new DataView(wavBuffer);

  // Write WAV header
  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples * blockAlign, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples * blockAlign, true);

  // Write interleaved PCM samples
  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = buffer.getChannelData(ch)[i];
      sample = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

async function applyVintageRadioEffect(buffer) {
  // Always create a new OfflineAudioContext for each run
  const offlineContext = new OfflineAudioContext(
    1, // mono output
    buffer.length,
    buffer.sampleRate
  );

  // Create a new mono buffer for each run
  const monoBuffer = offlineContext.createBuffer(1, buffer.length, buffer.sampleRate);
  const inputData = buffer.numberOfChannels > 1
    ? Array.from({length: buffer.numberOfChannels}, (_, ch) => buffer.getChannelData(ch))
    : [buffer.getChannelData(0)];
  const monoData = monoBuffer.getChannelData(0);
  for (let i = 0; i < buffer.length; i++) {
    let sum = 0;
    for (let ch = 0; ch < inputData.length; ch++) sum += inputData[ch][i];
    monoData[i] = sum / inputData.length;
  }

  // Create a new source node for each run
  const source = offlineContext.createBufferSource();
  source.buffer = monoBuffer;

  // Bandpass filter (200Hz - 6000Hz)
  const bandpass = offlineContext.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 3000;
  bandpass.Q.value = 0.7;
  source.connect(bandpass);

  // Compression
  const compressor = offlineContext.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 12;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;
  bandpass.connect(compressor);

  // Harmonic saturation (tube warmth)
  const saturation = offlineContext.createWaveShaper();
  saturation.curve = createSaturationCurve(0.25);
  compressor.connect(saturation);

  // Create static noise buffer (white noise, full duration)
  const noiseBuffer = offlineContext.createBuffer(1, buffer.length, buffer.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < buffer.length; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.008; // Quieter static
  }
  // Create a new noise source node for each run
  const noiseSource = offlineContext.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  // Mix noise and signal
  const mixGain = offlineContext.createGain();
  mixGain.gain.value = 1.0;
  saturation.connect(mixGain);
  noiseSource.connect(mixGain);
  mixGain.connect(offlineContext.destination);

  // Start sources (only once per node)
  source.start(0);
  noiseSource.start(0);

  // Render
  return await offlineContext.startRendering();
}

function createSaturationCurve(amount) {
  const samples = 44100;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
  }
  return curve;
}

function createNoiseBuffer(context) {
  const bufferSize = context.sampleRate * 0.1; // 100ms of noise
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  return buffer;
}

// Video Creator Logic
let videoImages = [];
let mediaRecorder = null;
let recordedChunks = [];

function loadVideoImages() {
  const fileInput = document.getElementById('videoImages');
  const files = Array.from(fileInput.files);
  
  if (files.length === 0) {
    showNotification("Please select at least one image.", "error");
    return;
  }
  
  if (files.length > 50) {
    showNotification("Please select 50 or fewer images for better performance.", "error");
    return;
  }
  
  videoImages = [];
  const imageItemsContainer = document.getElementById('imageItems');
  imageItemsContainer.innerHTML = '';
  
  files.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const imageData = {
          file: file,
          image: img,
          index: index,
          name: file.name,
          size: formatFileSize(file.size)
        };
        videoImages.push(imageData);
        
        // Create image item element
        const imageItem = createImageItem(imageData);
        imageItemsContainer.appendChild(imageItem);
        
        // If this is the last image, show the image list
        if (videoImages.length === files.length) {
          document.getElementById('imageList').style.display = 'block';
          setupDragAndDrop();
          showNotification(`${files.length} images loaded successfully!`, "success");
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function createImageItem(imageData) {
  const item = document.createElement('div');
  item.className = 'image-item fade-in';
  item.draggable = true;
  item.dataset.index = imageData.index;
  
  item.innerHTML = `
    <div class="image-item-index">${imageData.index + 1}</div>
    <img src="${imageData.image.src}" alt="${imageData.name}">
    <div class="image-item-info">
      <div class="image-item-name">${imageData.name}</div>
      <div class="image-item-size">${imageData.size}</div>
    </div>
  `;
  
  return item;
}

function setupDragAndDrop() {
  const imageItems = document.querySelectorAll('.image-item');
  
  imageItems.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
  });
}

function handleDragStart(e) {
  e.target.classList.add('dragging');
  e.dataTransfer.setData('text/plain', e.target.dataset.index);
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
}

function handleDragOver(e) {
  e.preventDefault();
}

function handleDrop(e) {
  e.preventDefault();
  const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
  const dropIndex = parseInt(e.target.closest('.image-item').dataset.index);
  
  if (draggedIndex !== dropIndex) {
    // Reorder the videoImages array
    const draggedItem = videoImages[draggedIndex];
    videoImages.splice(draggedIndex, 1);
    videoImages.splice(dropIndex, 0, draggedItem);
    
    // Update the display
    updateImageList();
  }
}

function updateImageList() {
  const imageItemsContainer = document.getElementById('imageItems');
  imageItemsContainer.innerHTML = '';
  
  videoImages.forEach((imageData, index) => {
    imageData.index = index;
    const imageItem = createImageItem(imageData);
    imageItemsContainer.appendChild(imageItem);
  });
  
  setupDragAndDrop();
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function createVideo() {
  if (videoImages.length === 0) {
    showNotification("Please load images first.", "error");
    return;
  }
  
  const format = document.getElementById('videoFormat').value;
  const numImages = videoImages.length;
  
  // Calculate duration and frame rate based on number of images
  let duration, fps;
  if (numImages <= 30) {
    duration = 1; // 1 second
    fps = numImages; // FPS equals number of images
  } else {
    duration = 2; // 2 seconds
    fps = Math.ceil(numImages / 2); // FPS is half the number of images, rounded up
  }
  
  const frameDuration = duration * 1000 / numImages; // Duration per frame in milliseconds
  
  showNotification(`Creating ${duration}s video at ${fps} FPS... This may take a moment.`, "info");
  
  try {
    // Create canvas for video frames
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match the first image
    const firstImage = videoImages[0].image;
    canvas.width = firstImage.width;
    canvas.height = firstImage.height;
    
    // Create MediaRecorder
    const stream = canvas.captureStream(fps);
    const mimeType = format === 'mp4' ? 'video/mp4' : 'video/webm';
    
    // Check if the format is supported
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      const fallbackMimeType = 'video/webm';
      showNotification(`MP4 not supported, using WebM instead.`, "info");
      mediaRecorder = new MediaRecorder(stream, { mimeType: fallbackMimeType });
    } else {
      mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });
    }
    
    recordedChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      // Show video preview
      const videoElement = document.getElementById('generatedVideo');
      videoElement.src = url;
      videoElement.style.display = 'block';
      
      // Create download link
      const downloadLink = document.getElementById('videoDownload');
      downloadLink.href = url;
      downloadLink.download = `video_${numImages}images_${fps}fps_${duration}s.${format}`;
      downloadLink.style.display = 'inline-block';
      
      document.getElementById('videoPreview').style.display = 'block';
      showNotification(`Video created successfully! ${duration}s at ${fps} FPS`, "success");
    };
    
    // Start recording
    mediaRecorder.start();
    
    // Draw each image frame
    for (let i = 0; i < videoImages.length; i++) {
      const imageData = videoImages[i];
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw image centered on canvas
      const img = imageData.image;
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;
      
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      
      // Wait for the frame duration
      await new Promise(resolve => setTimeout(resolve, frameDuration));
    }
    
    // Stop recording
    mediaRecorder.stop();
    
  } catch (error) {
    console.error("Error creating video:", error);
    showNotification("Error creating video: " + error.message, "error");
  }
}

// CSV to Image Logic
let csvData = null;
let csvHeaders = [];

window.addEventListener('DOMContentLoaded', () => {
  const csvInput = document.getElementById('csvInput');
  const generateBtn = document.getElementById('generateBtn');
  if (csvInput && generateBtn) {
    csvInput.addEventListener('change', () => {
      if (csvInput.files && csvInput.files[0]) {
        loadCSV();
        generateBtn.disabled = false;
      } else {
        generateBtn.disabled = true;
      }
    });
  }
});

function loadCSV() {
  const fileInput = document.getElementById("csvInput").files[0];
  if (!fileInput) {
    showNotification("Please select a CSV file first.", "error");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const csvText = e.target.result;
      const lines = csvText.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        showNotification("CSV file must have at least a header row and one data row.", "error");
        return;
      }
      csvHeaders = parseCSVLine(lines[0]);
      csvData = [];
      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length === csvHeaders.length) {
          csvData.push(row);
        }
      }
      if (csvData.length === 0) {
        showNotification("No valid data rows found in CSV.", "error");
        return;
      }
      showNotification(`CSV loaded successfully! ${csvData.length} rows, ${csvHeaders.length} columns.`, "success");
    } catch (error) {
      console.error("Error parsing CSV:", error);
      showNotification("Error parsing CSV file: " + error.message, "error");
    }
  };
  reader.readAsText(fileInput);
}

function generateTableImage() {
  if (!csvHeaders.length || !csvData.length) {
    showNotification("No CSV loaded.", "error");
    return;
  }
  // Canvas settings
  const cellPadding = 16;
  const font = '16px Inter, Arial, sans-serif';
  const headerFont = 'bold 18px Inter, Arial, sans-serif';
  const rowHeight = 36;
  const headerHeight = 44;
  const borderColor = '#334155';
  const headerBg = '#6366f1';
  const headerColor = '#fff';
  const cellBg = '#1e293b';
  const cellColor = '#f8fafc';

  // Calculate column widths
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = font;
  const colWidths = csvHeaders.map((header, colIdx) => {
    let max = ctx.measureText(header).width;
    for (let row of csvData) {
      max = Math.max(max, ctx.measureText(row[colIdx] || '').width);
    }
    return Math.ceil(max + cellPadding * 2);
  });
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const tableHeight = headerHeight + rowHeight * csvData.length;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = tableWidth;
  canvas.height = tableHeight;
  const c = canvas.getContext('2d');

  // Draw header
  let x = 0;
  c.font = headerFont;
  c.textBaseline = 'middle';
  for (let i = 0; i < csvHeaders.length; i++) {
    c.fillStyle = headerBg;
    c.fillRect(x, 0, colWidths[i], headerHeight);
    c.strokeStyle = borderColor;
    c.strokeRect(x, 0, colWidths[i], headerHeight);
    c.fillStyle = headerColor;
    c.fillText(csvHeaders[i], x + cellPadding, headerHeight / 2);
    x += colWidths[i];
  }

  // Draw rows
  c.font = font;
  for (let r = 0; r < csvData.length; r++) {
    x = 0;
    for (let i = 0; i < csvHeaders.length; i++) {
      c.fillStyle = cellBg;
      c.fillRect(x, headerHeight + r * rowHeight, colWidths[i], rowHeight);
      c.strokeStyle = borderColor;
      c.strokeRect(x, headerHeight + r * rowHeight, colWidths[i], rowHeight);
      c.fillStyle = cellColor;
      c.fillText(csvData[r][i], x + cellPadding, headerHeight + r * rowHeight + rowHeight / 2);
      x += colWidths[i];
    }
  }

  // Show image and download link
  const img = document.getElementById('tableImage');
  const link = document.getElementById('downloadTableImage');
  if (img && link) {
    img.src = canvas.toDataURL('image/png');
    link.href = img.src;
    document.getElementById('imageResult').style.display = 'block';
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Resize Tab Logic
let resizeImages = [];
let currentAspectRatio = null;

// Event listeners for resize functionality
document.addEventListener('DOMContentLoaded', function() {
  // Background fill checkbox handler
  const backgroundFillCheckbox = document.getElementById('backgroundFill');
  if (backgroundFillCheckbox) {
    backgroundFillCheckbox.addEventListener('change', function() {
      updateBackgroundOptionsVisibility();
    });
  }

  // Background fill radio button handlers
  const pickColorRadio = document.getElementById('pickColor');
  const transparentRadio = document.getElementById('transparent');
  const colorPickerContainer = document.querySelector('.color-picker-container');
  
  if (pickColorRadio && transparentRadio && colorPickerContainer) {
    pickColorRadio.addEventListener('change', function() {
      if (this.checked && backgroundFillCheckbox && backgroundFillCheckbox.checked) {
        colorPickerContainer.style.display = 'flex';
      }
    });
    
    transparentRadio.addEventListener('change', function() {
      if (this.checked) {
        colorPickerContainer.style.display = 'none';
      }
    });
  }

  // Lock aspect ratio handler
  const lockAspectRatio = document.getElementById('lockAspectRatio');
  const resizeWidth = document.getElementById('resizeWidth');
  const resizeHeight = document.getElementById('resizeHeight');
  
  if (lockAspectRatio && resizeWidth && resizeHeight) {
    // Set lock aspect ratio to checked by default
    lockAspectRatio.checked = true;
    updateBackgroundFillVisibility();
    
    lockAspectRatio.addEventListener('change', function() {
      updateBackgroundFillVisibility();
      if (this.checked && currentAspectRatio) {
        // When locking, recalculate height based on current width
        const currentWidth = parseInt(resizeWidth.value) || 256;
        const newHeight = Math.round(currentWidth / currentAspectRatio);
        resizeHeight.value = newHeight;
      }
    });
    
    resizeWidth.addEventListener('input', function() {
      if (lockAspectRatio.checked && currentAspectRatio) {
        const newWidth = parseInt(this.value) || 0;
        const newHeight = Math.round(newWidth / currentAspectRatio);
        resizeHeight.value = newHeight;
        updateResizeImageGrid();
      }
    });
    
    resizeHeight.addEventListener('input', function() {
      if (lockAspectRatio.checked && currentAspectRatio) {
        const newHeight = parseInt(this.value) || 0;
        const newWidth = Math.round(newHeight * currentAspectRatio);
        resizeWidth.value = newWidth;
        updateResizeImageGrid();
      }
    });
  }
});

function updateBackgroundFillVisibility() {
  const lockAspectRatio = document.getElementById('lockAspectRatio');
  const backgroundFillCheckbox = document.getElementById('backgroundFill');
  const backgroundOptions = document.querySelector('.background-options');
  const colorPickerContainer = document.querySelector('.color-picker-container');
  const pickColorRadio = document.getElementById('pickColor');
  const transparentRadio = document.getElementById('transparent');
  
  if (lockAspectRatio && backgroundFillCheckbox && backgroundOptions) {
    if (lockAspectRatio.checked) {
      // Lock aspect ratio is ON - disable background fill options
      backgroundFillCheckbox.disabled = true;
      backgroundFillCheckbox.checked = false;
      backgroundOptions.style.opacity = '0.5';
      backgroundOptions.style.pointerEvents = 'none';
      if (colorPickerContainer) {
        colorPickerContainer.style.display = 'none';
      }
      // Disable radio buttons
      if (pickColorRadio) pickColorRadio.disabled = true;
      if (transparentRadio) transparentRadio.disabled = true;
    } else {
      // Lock aspect ratio is OFF - enable background fill options
      backgroundFillCheckbox.disabled = false;
      backgroundFillCheckbox.checked = true; // Enable by default when unlocked
      updateBackgroundOptionsVisibility();
    }
  }
}

function updateBackgroundOptionsVisibility() {
  const backgroundFillCheckbox = document.getElementById('backgroundFill');
  const backgroundOptions = document.querySelector('.background-options');
  const colorPickerContainer = document.querySelector('.color-picker-container');
  const pickColorRadio = document.getElementById('pickColor');
  const transparentRadio = document.getElementById('transparent');
  
  if (backgroundFillCheckbox && backgroundOptions) {
    if (backgroundFillCheckbox.checked) {
      // Background fill is ON - enable radio buttons
      backgroundOptions.style.opacity = '1';
      backgroundOptions.style.pointerEvents = 'auto';
      if (pickColorRadio) pickColorRadio.disabled = false;
      if (transparentRadio) transparentRadio.disabled = false;
      
      // Show/hide color picker based on selection
      if (pickColorRadio && pickColorRadio.checked && colorPickerContainer) {
        colorPickerContainer.style.display = 'flex';
      } else if (colorPickerContainer) {
        colorPickerContainer.style.display = 'none';
      }
    } else {
      // Background fill is OFF - disable radio buttons
      backgroundOptions.style.opacity = '0.5';
      backgroundOptions.style.pointerEvents = 'none';
      if (pickColorRadio) pickColorRadio.disabled = true;
      if (transparentRadio) transparentRadio.disabled = true;
      if (colorPickerContainer) {
        colorPickerContainer.style.display = 'none';
      }
    }
  }
}

function loadResizeImages(files) {
  if (!files || files.length === 0) return;
  
  // Check file size limit (10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  const validFiles = Array.from(files).filter(file => {
    if (file.size > maxSize) {
      showNotification(`File ${file.name} is too large. Max size is 10MB.`, "error");
      return false;
    }
    return true;
  });
  
  if (validFiles.length === 0) return;
  
  validFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const imageData = {
          id: Date.now() + Math.random(),
          file: file,
          image: img,
          name: file.name,
          originalWidth: img.width,
          originalHeight: img.height,
          aspectRatio: img.width / img.height,
          status: 'ready'
        };
        
        resizeImages.push(imageData);
        
        // Set current aspect ratio to the first image's aspect ratio
        if (resizeImages.length === 1) {
          currentAspectRatio = imageData.aspectRatio;
          
          // If lock aspect ratio is enabled, set initial dimensions based on first image
          const lockAspectRatio = document.getElementById('lockAspectRatio');
          if (lockAspectRatio && lockAspectRatio.checked) {
            const resizeWidth = document.getElementById('resizeWidth');
            const resizeHeight = document.getElementById('resizeHeight');
            if (resizeWidth && resizeHeight) {
              // Set width to 256 and calculate height
              resizeWidth.value = 256;
              resizeHeight.value = Math.round(256 / currentAspectRatio);
            }
          }
        }
        
        updateResizeImageGrid();
        showNotification(`${file.name} loaded successfully!`, "success");
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function updateResizeImageGrid() {
  const grid = document.getElementById('resizeImageGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  resizeImages.forEach(imageData => {
    const card = createImagePreviewCard(imageData);
    grid.appendChild(card);
  });
}

function createImagePreviewCard(imageData) {
  const card = document.createElement('div');
  card.className = 'image-preview-card fade-in';
  
  const targetWidth = parseInt(document.getElementById('resizeWidth').value) || 256;
  const targetHeight = parseInt(document.getElementById('resizeHeight').value) || 256;
  const lockAspectRatio = document.getElementById('lockAspectRatio').checked;
  
  // Calculate final dimensions based on lock aspect ratio setting
  let finalWidth = targetWidth;
  let finalHeight = targetHeight;
  
  if (lockAspectRatio) {
    // Use the image's own aspect ratio to calculate dimensions
    const imageAspectRatio = imageData.aspectRatio;
    const targetAspectRatio = targetWidth / targetHeight;
    
    if (imageAspectRatio > targetAspectRatio) {
      // Image is wider than target - fit to width
      finalWidth = targetWidth;
      finalHeight = Math.round(targetWidth / imageAspectRatio);
    } else {
      // Image is taller than target - fit to height
      finalHeight = targetHeight;
      finalWidth = Math.round(targetHeight * imageAspectRatio);
    }
  }
  // If lock aspect ratio is OFF, use exact target dimensions (stretching)
  
  card.innerHTML = `
    <div class="image-preview-header">
      <img src="${imageData.image.src}" alt="${imageData.name}" class="image-preview-thumbnail">
      <div class="image-preview-controls">
        <button class="control-btn" onclick="cropImage(${imageData.id})" title="Crop">✂️</button>
        <button class="control-btn" onclick="resetImage(${imageData.id})" title="Reset">🔄</button>
        <button class="control-btn" onclick="showImageInfo(${imageData.id})" title="Info">ℹ️</button>
        <button class="control-btn" onclick="removeImage(${imageData.id})" title="Remove">✕</button>
      </div>
    </div>
    <div class="image-preview-info">
      <div class="image-preview-name">${imageData.name}</div>
      <div class="image-preview-dimensions">
        <span>${imageData.originalWidth} × ${imageData.originalHeight}</span>
        <span class="dimension-arrow">→</span>
        <span>${finalWidth} × ${finalHeight}</span>
      </div>
      <div class="image-preview-status status-${imageData.status}">
        ${getStatusText(imageData.status)}
      </div>
    </div>
  `;
  
  return card;
}

function getStatusText(status) {
  switch (status) {
    case 'ready': return 'Ready to resize';
    case 'processing': return 'Processing...';
    case 'error': return 'Error occurred';
    default: return 'Unknown status';
  }
}

function cropImage(imageId) {
  showNotification('Crop functionality coming soon!', "info");
}

function resetImage(imageId) {
  const imageIndex = resizeImages.findIndex(img => img.id === imageId);
  if (imageIndex !== -1) {
    resizeImages[imageIndex].status = 'ready';
    updateResizeImageGrid();
    showNotification('Image reset successfully!', "success");
  }
}

function showImageInfo(imageId) {
  const imageData = resizeImages.find(img => img.id === imageId);
  if (imageData) {
    const info = `Name: ${imageData.name}\nOriginal Size: ${imageData.originalWidth}×${imageData.originalHeight}\nFile Size: ${formatFileSize(imageData.file.size)}`;
    alert(info);
  }
}

function removeImage(imageId) {
  const imageIndex = resizeImages.findIndex(img => img.id === imageId);
  if (imageIndex !== -1) {
    resizeImages.splice(imageIndex, 1);
    updateResizeImageGrid();
    showNotification('Image removed successfully!', "success");
  }
}

function toggleImageFilter() {
  showNotification('Filter functionality coming soon!', "info");
}

function clearAllImages() {
  if (resizeImages.length === 0) {
    showNotification('No images to clear.', "info");
    return;
  }
  
  if (confirm('Are you sure you want to clear all images?')) {
    resizeImages = [];
    updateResizeImageGrid();
    showNotification('All images cleared!', "success");
  }
}

async function exportResizedImages() {
  if (resizeImages.length === 0) {
    showNotification('Please add some images first.', "error");
    return;
  }
  
  const targetWidth = parseInt(document.getElementById('resizeWidth').value) || 256;
  const targetHeight = parseInt(document.getElementById('resizeHeight').value) || 256;
  const exportFormat = document.getElementById('exportFormat').value;
  const lockAspectRatio = document.getElementById('lockAspectRatio').checked;
  const backgroundFill = lockAspectRatio ? false : document.getElementById('backgroundFill').checked;
  const backgroundType = lockAspectRatio ? 'transparent' : document.querySelector('input[name="backgroundType"]:checked').value;
  const backgroundColor = document.getElementById('backgroundColor').value;
  
  showNotification(`Processing ${resizeImages.length} images...`, "info");
  
  for (let i = 0; i < resizeImages.length; i++) {
    const imageData = resizeImages[i];
    imageData.status = 'processing';
    updateResizeImageGrid();
    
    try {
      // If lock aspect ratio is enabled, calculate dimensions for each image individually
      let finalWidth = targetWidth;
      let finalHeight = targetHeight;
      
      if (lockAspectRatio) {
        // Use the image's own aspect ratio to calculate dimensions
        const imageAspectRatio = imageData.aspectRatio;
        const targetAspectRatio = targetWidth / targetHeight;
        
        if (imageAspectRatio > targetAspectRatio) {
          // Image is wider than target - fit to width
          finalWidth = targetWidth;
          finalHeight = Math.round(targetWidth / imageAspectRatio);
        } else {
          // Image is taller than target - fit to height
          finalHeight = targetHeight;
          finalWidth = Math.round(targetHeight * imageAspectRatio);
        }
      }
      // If lock aspect ratio is OFF, use exact target dimensions (stretching)
      
      const resizedImage = await resizeImage(imageData, finalWidth, finalHeight, backgroundFill, backgroundType, backgroundColor, exportFormat, lockAspectRatio);
      
      // Create download link
      const link = document.createElement('a');
      link.href = resizedImage;
      link.download = `${imageData.name.replace(/\.[^/.]+$/, "")}_${finalWidth}x${finalHeight}.${exportFormat}`;
      link.click();
      
      imageData.status = 'ready';
      updateResizeImageGrid();
      
      // Small delay to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('Error resizing image:', error);
      imageData.status = 'error';
      updateResizeImageGrid();
      showNotification(`Error processing ${imageData.name}: ${error.message}`, "error");
    }
  }
  
  showNotification('All images processed and downloaded!', "success");
}

async function resizeImage(imageData, targetWidth, targetHeight, backgroundFill, backgroundType, backgroundColor, exportFormat, lockAspectRatio) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    // Fill background if enabled
    if (backgroundFill) {
      if (backgroundType === 'transparent') {
        // Clear canvas for transparency
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        // Fill with color
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      // No background fill, clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    if (lockAspectRatio) {
      // Lock aspect ratio ON - maintain aspect ratio and fit within target dimensions
      const scaleX = targetWidth / imageData.originalWidth;
      const scaleY = targetHeight / imageData.originalHeight;
      const scale = Math.min(scaleX, scaleY);
      
      const scaledWidth = imageData.originalWidth * scale;
      const scaledHeight = imageData.originalHeight * scale;
      
      // Center the image
      const x = (targetWidth - scaledWidth) / 2;
      const y = (targetHeight - scaledHeight) / 2;
      
      // Draw the image
      ctx.drawImage(imageData.image, x, y, scaledWidth, scaledHeight);
    } else {
      // Lock aspect ratio OFF - stretch image to exact target dimensions
      ctx.drawImage(imageData.image, 0, 0, targetWidth, targetHeight);
    }
    
    // Convert to desired format
    let mimeType;
    switch (exportFormat) {
      case 'png':
        mimeType = 'image/png';
        break;
      case 'jpg':
        mimeType = 'image/jpeg';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      default:
        mimeType = 'image/png';
    }
    
    try {
      const dataURL = canvas.toDataURL(mimeType, exportFormat === 'jpg' ? 0.9 : undefined);
      resolve(dataURL);
    } catch (error) {
      reject(error);
    }
  });
}

function populateColumnSelectors() {
  const xColumn = document.getElementById("xColumn");
  const yColumn = document.getElementById("yColumn");
  
  xColumn.innerHTML = '';
  yColumn.innerHTML = '';
  
  csvHeaders.forEach((header, index) => {
    const xOption = document.createElement("option");
    xOption.value = index;
    xOption.textContent = header;
    xColumn.appendChild(xOption);
    
    const yOption = document.createElement("option");
    yOption.value = index;
    yOption.textContent = header;
    yColumn.appendChild(yOption);
  });
  
  // Set default selections
  if (csvHeaders.length >= 2) {
    xColumn.value = 0;
    yColumn.value = 1;
  }
}

function generateChart() {
  if (!csvData || csvData.length === 0) {
    showNotification("Please load CSV data first.", "error");
    return;
  }

  const chartType = document.getElementById("chartType").value;
  const xColumnIndex = parseInt(document.getElementById("xColumn").value);
  const yColumnIndex = parseInt(document.getElementById("yColumn").value);
  
  if (xColumnIndex === yColumnIndex) {
    showNotification("X and Y columns must be different.", "error");
    return;
  }

  const canvas = document.getElementById("chartCanvas");
  const ctx = canvas.getContext("2d");
  
  // Set canvas size
  canvas.width = 800;
  canvas.height = 600;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Prepare data
  const data = csvData.map(row => ({
    x: row[xColumnIndex],
    y: parseFloat(row[yColumnIndex]) || 0
  })).filter(item => !isNaN(item.y));
  
  if (data.length === 0) {
    showNotification("No valid numeric data found in Y column.", "error");
    return;
  }

  // Generate chart based on type
  switch (chartType) {
    case 'bar':
      drawBarChart(ctx, data, csvHeaders[xColumnIndex], csvHeaders[yColumnIndex]);
      break;
    case 'line':
      drawLineChart(ctx, data, csvHeaders[xColumnIndex], csvHeaders[yColumnIndex]);
      break;
    case 'pie':
      drawPieChart(ctx, data, csvHeaders[xColumnIndex], csvHeaders[yColumnIndex]);
      break;
    case 'scatter':
      drawScatterChart(ctx, data, csvHeaders[xColumnIndex], csvHeaders[yColumnIndex]);
      break;
  }
  
  document.getElementById("chartContainer").style.display = "block";
  
  // Create download link
  const downloadLink = document.getElementById("chartDownload");
  downloadLink.href = canvas.toDataURL("image/png");
  downloadLink.download = `chart_${chartType}_${csvHeaders[xColumnIndex]}_${csvHeaders[yColumnIndex]}.png`;
  downloadLink.style.display = "inline-block";
  
  showNotification("Chart generated successfully!", "success");
}

function drawBarChart(ctx, data, xLabel, yLabel) {
  const margin = 80;
  const chartWidth = ctx.canvas.width - 2 * margin;
  const chartHeight = ctx.canvas.height - 2 * margin;
  
  // Find min/max values
  const yValues = data.map(d => d.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const yRange = maxY - minY;
  
  // Draw title
  ctx.fillStyle = "#333";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${yLabel} by ${xLabel}`, ctx.canvas.width / 2, 30);
  
  // Draw axes
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, margin);
  ctx.lineTo(margin, ctx.canvas.height - margin);
  ctx.lineTo(ctx.canvas.width - margin, ctx.canvas.height - margin);
  ctx.stroke();
  
  // Draw Y-axis labels
  ctx.fillStyle = "#666";
  ctx.font = "12px Arial";
  ctx.textAlign = "right";
  for (let i = 0; i <= 5; i++) {
    const y = margin + (chartHeight * i / 5);
    const value = maxY - (yRange * i / 5);
    ctx.fillText(value.toFixed(1), margin - 10, y + 4);
  }
  
  // Draw bars
  const barWidth = chartWidth / data.length * 0.8;
  const barSpacing = chartWidth / data.length * 0.2;
  
  data.forEach((item, index) => {
    const x = margin + barSpacing / 2 + index * (barWidth + barSpacing);
    const barHeight = ((item.y - minY) / yRange) * chartHeight;
    const y = ctx.canvas.height - margin - barHeight;
    
    // Draw bar
    ctx.fillStyle = `hsl(${(index * 360 / data.length)}, 70%, 60%)`;
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Draw value on bar
    ctx.fillStyle = "#333";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(item.y.toFixed(1), x + barWidth / 2, y - 5);
    
    // Draw X-axis label
    ctx.fillStyle = "#666";
    ctx.save();
    ctx.translate(x + barWidth / 2, ctx.canvas.height - margin + 20);
    ctx.rotate(-Math.PI / 4);
    ctx.fillText(item.x.toString().substring(0, 10), 0, 0);
    ctx.restore();
  });
  
  // Draw axis labels
  ctx.fillStyle = "#333";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.fillText(xLabel, ctx.canvas.width / 2, ctx.canvas.height - 20);
  ctx.save();
  ctx.translate(20, ctx.canvas.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
}

function drawLineChart(ctx, data, xLabel, yLabel) {
  const margin = 80;
  const chartWidth = ctx.canvas.width - 2 * margin;
  const chartHeight = ctx.canvas.height - 2 * margin;
  
  // Find min/max values
  const yValues = data.map(d => d.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const yRange = maxY - minY;
  
  // Draw title
  ctx.fillStyle = "#333";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${yLabel} over ${xLabel}`, ctx.canvas.width / 2, 30);
  
  // Draw axes
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, margin);
  ctx.lineTo(margin, ctx.canvas.height - margin);
  ctx.lineTo(ctx.canvas.width - margin, ctx.canvas.height - margin);
  ctx.stroke();
  
  // Draw Y-axis labels
  ctx.fillStyle = "#666";
  ctx.font = "12px Arial";
  ctx.textAlign = "right";
  for (let i = 0; i <= 5; i++) {
    const y = margin + (chartHeight * i / 5);
    const value = maxY - (yRange * i / 5);
    ctx.fillText(value.toFixed(1), margin - 10, y + 4);
  }
  
  // Draw line
  ctx.strokeStyle = "#6366f1";
  ctx.lineWidth = 3;
  ctx.beginPath();
  
  data.forEach((item, index) => {
    const x = margin + (index / (data.length - 1)) * chartWidth;
    const y = margin + chartHeight - ((item.y - minY) / yRange) * chartHeight;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
  
  // Draw points
  ctx.fillStyle = "#6366f1";
  data.forEach((item, index) => {
    const x = margin + (index / (data.length - 1)) * chartWidth;
    const y = margin + chartHeight - ((item.y - minY) / yRange) * chartHeight;
    
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
  });
  
  // Draw X-axis labels
  ctx.fillStyle = "#666";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  for (let i = 0; i < data.length; i += Math.max(1, Math.floor(data.length / 10))) {
    const x = margin + (i / (data.length - 1)) * chartWidth;
    ctx.save();
    ctx.translate(x, ctx.canvas.height - margin + 20);
    ctx.rotate(-Math.PI / 4);
    ctx.fillText(data[i].x.toString().substring(0, 10), 0, 0);
    ctx.restore();
  }
  
  // Draw axis labels
  ctx.fillStyle = "#333";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.fillText(xLabel, ctx.canvas.width / 2, ctx.canvas.height - 20);
  ctx.save();
  ctx.translate(20, ctx.canvas.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
}

function drawPieChart(ctx, data, xLabel, yLabel) {
  const centerX = ctx.canvas.width / 2;
  const centerY = ctx.canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 100;
  
  // Calculate total
  const total = data.reduce((sum, item) => sum + item.y, 0);
  
  // Draw title
  ctx.fillStyle = "#333";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${yLabel} Distribution`, centerX, 50);
  
  // Draw pie slices
  let currentAngle = -Math.PI / 2;
  
  data.forEach((item, index) => {
    const sliceAngle = (item.y / total) * 2 * Math.PI;
    const endAngle = currentAngle + sliceAngle;
    
    // Draw slice
    ctx.fillStyle = `hsl(${(index * 360 / data.length)}, 70%, 60%)`;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, endAngle);
    ctx.closePath();
    ctx.fill();
    
    // Draw label
    const labelAngle = currentAngle + sliceAngle / 2;
    const labelRadius = radius * 0.7;
    const labelX = centerX + Math.cos(labelAngle) * labelRadius;
    const labelY = centerY + Math.sin(labelAngle) * labelRadius;
    
    ctx.fillStyle = "#333";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(item.x.toString().substring(0, 15), labelX, labelY);
    
    // Draw percentage
    const percentRadius = radius * 0.5;
    const percentX = centerX + Math.cos(labelAngle) * percentRadius;
    const percentY = centerY + Math.sin(labelAngle) * percentRadius;
    
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px Arial";
    ctx.fillText(`${((item.y / total) * 100).toFixed(1)}%`, percentX, percentY);
    
    currentAngle = endAngle;
  });
  
  // Draw legend
  const legendX = 50;
  const legendY = ctx.canvas.height - 50 - data.length * 25;
  
  data.forEach((item, index) => {
    const y = legendY + index * 25;
    
    // Draw color box
    ctx.fillStyle = `hsl(${(index * 360 / data.length)}, 70%, 60%)`;
    ctx.fillRect(legendX, y - 8, 16, 16);
    
    // Draw label
    ctx.fillStyle = "#333";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`${item.x}: ${item.y}`, legendX + 25, y + 4);
  });
}

function drawScatterChart(ctx, data, xLabel, yLabel) {
  const margin = 80;
  const chartWidth = ctx.canvas.width - 2 * margin;
  const chartHeight = ctx.canvas.height - 2 * margin;
  
  // Find min/max values
  const xValues = data.map(d => parseFloat(d.x) || 0);
  const yValues = data.map(d => d.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const xRange = maxX - minX;
  const yRange = maxY - minY;
  
  // Draw title
  ctx.fillStyle = "#333";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${yLabel} vs ${xLabel}`, ctx.canvas.width / 2, 30);
  
  // Draw axes
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, margin);
  ctx.lineTo(margin, ctx.canvas.height - margin);
  ctx.lineTo(ctx.canvas.width - margin, ctx.canvas.height - margin);
  ctx.stroke();
  
  // Draw Y-axis labels
  ctx.fillStyle = "#666";
  ctx.font = "12px Arial";
  ctx.textAlign = "right";
  for (let i = 0; i <= 5; i++) {
    const y = margin + (chartHeight * i / 5);
    const value = maxY - (yRange * i / 5);
    ctx.fillText(value.toFixed(1), margin - 10, y + 4);
  }
  
  // Draw X-axis labels
  ctx.textAlign = "center";
  for (let i = 0; i <= 5; i++) {
    const x = margin + (chartWidth * i / 5);
    const value = minX + (xRange * i / 5);
    ctx.fillText(value.toFixed(1), x, ctx.canvas.height - margin + 20);
  }
  
  // Draw scatter points
  ctx.fillStyle = "#6366f1";
  data.forEach(item => {
    const x = margin + ((parseFloat(item.x) - minX) / xRange) * chartWidth;
    const y = margin + chartHeight - ((item.y - minY) / yRange) * chartHeight;
    
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();
  });
  
  // Draw axis labels
  ctx.fillStyle = "#333";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.fillText(xLabel, ctx.canvas.width / 2, ctx.canvas.height - 20);
  ctx.save();
  ctx.translate(20, ctx.canvas.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
}
