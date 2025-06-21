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
