function openTab(tabId) {
  // Hide all tabs with animation
  document.querySelectorAll('.tabcontent').forEach(tab => {
    if (tab.id !== tabId) {
      tab.style.display = 'none';
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
}

// Mobile menu
document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function() {
      mobileMenu.style.display = mobileMenu.style.display === 'none' || mobileMenu.style.display === '' ? 'block' : 'none';
    });
  }
});

function selectMobileTab(tabId) {
  openTab(tabId);
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenu) mobileMenu.style.display = 'none';
  // update active state on desktop buttons to mirror selection
  const button = document.querySelector(`[onclick="openTab('${tabId}')"]`);
  if (button) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
  }
}

// Scaler Tool Logic
function scaleImage() {
  const fileInput = document.getElementById("scaleInput").files[0];
  const factor = parseFloat(document.getElementById("scaleFactor").value);
  if (!fileInput || !Number.isFinite(factor) || factor <= 0) {
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
      case 'bitcrusher8':
        processedBuffer = await applyBitcrusherEffect(audioBuffer, 8);
        break;
      case 'bitcrusher16':
        processedBuffer = await applyBitcrusherEffect(audioBuffer, 16);
        break;
      default:
        throw new Error("Unknown effect selected");
    }

    // Create audio element and download link
    const audioElement = document.getElementById("processedAudio");
    const downloadLink = document.getElementById("audioDownload");
    
    // Convert to WAV and create download link
    const exportBitDepth = effect === 'bitcrusher8' ? 8 : 16;
    const wavBlob = audioBufferToWavBlob(processedBuffer, exportBitDepth);
    const url = URL.createObjectURL(wavBlob);
    // Revoke previous object URLs if any
    if (audioElement.dataset.previousUrl) {
      try { URL.revokeObjectURL(audioElement.dataset.previousUrl); } catch (e) {}
    }
    if (downloadLink.dataset.previousUrl) {
      try { URL.revokeObjectURL(downloadLink.dataset.previousUrl); } catch (e) {}
    }
    
    audioElement.src = url;
    downloadLink.href = url;
    audioElement.dataset.previousUrl = url;
    downloadLink.dataset.previousUrl = url;
    downloadLink.download = `${fileInput.name.replace(/\.[^/.]+$/, "")}_${effect}.wav`;
    
    audioElement.style.display = "block";
    downloadLink.style.display = "inline-block";
    
    showNotification("Audio processed successfully!", "success");
  } catch (error) {
    console.error("Error processing audio:", error);
    showNotification("Error processing audio: " + error.message, "error");
  }
}

// Bulk audio processing (packages results as .tar to avoid ZIP issues)
async function processAudioBulk() {
  const files = Array.from(document.getElementById("audioInput").files || []);
  const effect = document.getElementById("audioEffect").value;
  if (!files.length) {
    showNotification("Please select one or more audio files.", "error");
    return;
  }
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const progressWrap = document.getElementById('audioProgress');
    const progressBar = document.getElementById('audioProgressBar');
    const progressPct = document.getElementById('audioProgressPct');
    const progressLabel = document.getElementById('audioProgressLabel');
    const zipDownload = document.getElementById('audioZipDownload');
    if (zipDownload) {
      if (zipDownload.dataset.previousUrl) {
        try { URL.revokeObjectURL(zipDownload.dataset.previousUrl); } catch (e) {}
      }
      zipDownload.style.display = 'none';
    }
    if (progressWrap) progressWrap.style.display = 'block';
    if (progressBar) progressBar.style.width = '0%';
    if (progressPct) progressPct.textContent = '0%';
    if (progressLabel) progressLabel.textContent = 'Processing...';
    const tarEntries = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const arrayBuffer = await file.arrayBuffer();
      const inputBuffer = await audioContext.decodeAudioData(arrayBuffer);
      let processedBuffer;
      switch (effect) {
        case 'vintageRadio':
          processedBuffer = await applyVintageRadioEffect(inputBuffer);
          break;
        case 'bitcrusher8':
          processedBuffer = await applyBitcrusherEffect(inputBuffer, 8);
          break;
        case 'bitcrusher16':
          processedBuffer = await applyBitcrusherEffect(inputBuffer, 16);
          break;
        default:
          throw new Error("Unknown effect selected");
      }
      const exportBitDepth = effect === 'bitcrusher8' ? 8 : 16;
      const wavBlob = audioBufferToWavBlob(processedBuffer, exportBitDepth);
      const arrayBuf = await wavBlob.arrayBuffer();
      const outName = `${file.name.replace(/\.[^/.]+$/, "")}_${effect}.wav`;
      tarEntries.push({ name: outName, data: new Uint8Array(arrayBuf) });
      const pct = Math.round(((i + 1) / files.length) * 100);
      if (progressBar) progressBar.style.width = pct + '%';
      if (progressPct) progressPct.textContent = pct + '%';
      await new Promise(r => setTimeout(r, 10));
    }
    if (progressLabel) progressLabel.textContent = 'Packaging...';
    const tarBlob = createTarBlob(tarEntries);
    const tarUrl = URL.createObjectURL(tarBlob);
    if (progressWrap) progressWrap.style.display = 'none';
    if (zipDownload) {
      zipDownload.href = tarUrl;
      zipDownload.download = `audio_${effect}_${files.length}files.tar`;
      zipDownload.textContent = 'Download All (TAR)';
      zipDownload.dataset.previousUrl = tarUrl;
      zipDownload.style.display = 'inline-block';
    }
    showNotification(`${files.length} file(s) processed. TAR ready to download.`, "success");
  } catch (error) {
    console.error('Bulk audio error:', error);
    showNotification('Error processing files: ' + error.message, 'error');
  }
}

// Minimal USTAR tar creator for packaging files without compression
function createTarBlob(entries) {
  const blocks = [];
  const encoder = new TextEncoder();
  function writeString(buf, offset, str, length) {
    const bytes = encoder.encode(str);
    const size = Math.min(bytes.length, length);
    for (let i = 0; i < size; i++) buf[offset + i] = bytes[i];
    for (let i = size; i < length; i++) buf[offset + i] = 0;
  }
  function writeOctal(buf, offset, value, length) {
    const str = value.toString(8).padStart(length - 1, '0');
    writeString(buf, offset, str, length - 1);
    buf[offset + length - 1] = 0; // null terminator
  }
  function computeChecksum(header) {
    let sum = 0;
    for (let i = 0; i < 512; i++) sum += header[i];
    return sum;
  }
  function splitName(name) {
    // Attempt to split into prefix/name for long paths
    if (name.length <= 100) return { name, prefix: '' };
    const idx = name.lastIndexOf('/');
    if (idx > 0 && idx < 156 && (name.length - idx - 1) <= 100) {
      return { name: name.slice(idx + 1), prefix: name.slice(0, idx) };
    }
    // Fallback: truncate basename to 100 bytes
    return { name: name.slice(-100), prefix: '' };
  }
  const mtime = Math.floor(Date.now() / 1000);
  for (const entry of entries) {
    const { name, data } = entry;
    const header = new Uint8Array(512);
    for (let i = 0; i < 512; i++) header[i] = 0;
    const parts = splitName(name);
    writeString(header, 0, parts.name, 100);               // name
    writeString(header, 100, '0000777', 8);                // mode
    writeString(header, 108, '0000000', 8);                // uid
    writeString(header, 116, '0000000', 8);                // gid
    writeOctal(header, 124, data.length, 12);              // size
    writeOctal(header, 136, mtime, 12);                    // mtime
    for (let i = 148; i < 156; i++) header[i] = 0x20;      // chksum as spaces
    header[156] = '0'.charCodeAt(0);                       // typeflag '0'
    writeString(header, 157, '', 100);                     // linkname
    writeString(header, 257, 'ustar', 6);                  // magic 'ustar\0'
    header[262] = '0'.charCodeAt(0); header[263] = '0'.charCodeAt(0); // version '00'
    writeString(header, 265, 'user', 32);                  // uname
    writeString(header, 297, 'group', 32);                 // gname
    writeString(header, 329, '', 8);                       // devmajor
    writeString(header, 337, '', 8);                       // devminor
    writeString(header, 345, parts.prefix, 155);           // prefix
    const checksum = computeChecksum(header);
    // Write checksum: 6-digit octal, null, space
    const chkStr = checksum.toString(8).padStart(6, '0');
    writeString(header, 148, chkStr, 6);
    header[154] = 0; // null
    header[155] = 0x20; // space
    blocks.push(header);
    blocks.push(data);
    const pad = (512 - (data.length % 512)) % 512;
    if (pad) blocks.push(new Uint8Array(pad));
  }
  // Two empty blocks indicate EOF
  blocks.push(new Uint8Array(512));
  blocks.push(new Uint8Array(512));
  return new Blob(blocks, { type: 'application/x-tar' });
}

function audioBufferToWavBlob(buffer, bitDepth = 16) {
  // Adapted from: https://github.com/Jam3/audiobuffer-to-wav
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
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
  const maxValue = Math.pow(2, bitDepth - 1) - 1;
  
  for (let i = 0; i < samples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = buffer.getChannelData(ch)[i];
      sample = Math.max(-1, Math.min(1, sample));
      
      if (bitDepth === 8) {
        // 8-bit unsigned
        const unsignedSample = Math.round((sample + 1) * 127.5);
        view.setUint8(offset, unsignedSample);
        offset += 1;
      } else {
        // 16-bit signed
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

// Function to resample audio for compression
async function resampleAudio(audioBuffer, newSampleRate) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const numChannels = audioBuffer.numberOfChannels;
  const originalSampleRate = audioBuffer.sampleRate;
  
  // Calculate new length
  const newLength = Math.floor(audioBuffer.length * (newSampleRate / originalSampleRate));
  
  // Create offline context for resampling
  const offlineContext = new OfflineAudioContext(
    numChannels,
    newLength,
    newSampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start(0);
  
  return await offlineContext.startRendering();
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

async function applyBitcrusherEffect(buffer, targetBitDepth) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const targetRate = targetBitDepth === 8 ? 11025 : 22050;
  const holdInterval = Math.max(1, Math.round(sampleRate / targetRate));

  const ctx = audioContext || new (window.AudioContext || window.webkitAudioContext)();
  const output = ctx.createBuffer(numChannels, buffer.length, sampleRate);

  for (let ch = 0; ch < numChannels; ch++) {
    const inData = buffer.getChannelData(ch);
    const outData = output.getChannelData(ch);

    let held = 0;
    for (let i = 0; i < inData.length; i++) {
      if (i % holdInterval === 0) {
        let s = inData[i];
        s = Math.max(-1, Math.min(1, s));
        const levels = Math.pow(2, targetBitDepth);
        const normalized = (s + 1) / 2;
        const quantized = Math.round(normalized * (levels - 1)) / (levels - 1);
        held = quantized * 2 - 1;
      }
      outData[i] = held;
    }
  }

  return output;
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
    const requestedMimeType = format === 'mp4' ? 'video/mp4' : 'video/webm';
    let effectiveMimeType = requestedMimeType;
    let effectiveFormat = format;
    
    // Check if the format is supported
    if (!MediaRecorder.isTypeSupported(requestedMimeType)) {
      effectiveMimeType = 'video/webm';
      effectiveFormat = 'webm';
      showNotification(`MP4 not supported, using WebM instead.`, "info");
      mediaRecorder = new MediaRecorder(stream, { mimeType: effectiveMimeType });
    } else {
      mediaRecorder = new MediaRecorder(stream, { mimeType: effectiveMimeType });
    }
    
    recordedChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: effectiveMimeType });
      const url = URL.createObjectURL(blob);
      
      // Show video preview
      const videoElement = document.getElementById('generatedVideo');
      if (videoElement.dataset.previousUrl) {
        try { URL.revokeObjectURL(videoElement.dataset.previousUrl); } catch (e) {}
      }
      videoElement.src = url;
      videoElement.dataset.previousUrl = url;
      videoElement.style.display = 'block';
      
      // Create download link
      const downloadLink = document.getElementById('videoDownload');
      if (downloadLink.dataset.previousUrl) {
        try { URL.revokeObjectURL(downloadLink.dataset.previousUrl); } catch (e) {}
      }
      downloadLink.href = url;
      downloadLink.download = `video_${numImages}images_${fps}fps_${duration}s.${effectiveFormat}`;
      downloadLink.dataset.previousUrl = url;
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
      generateBtn.disabled = !(csvInput.files && csvInput.files.length > 0);
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

async function generateTableImageBulk() {
  const files = Array.from((document.getElementById('csvInput').files) || []);
  if (!files.length) {
    showNotification('Please select one or more CSV files.', 'error');
    return;
  }
  const progressWrap = document.getElementById('csvProgress');
  const progressBar = document.getElementById('csvProgressBar');
  const progressPct = document.getElementById('csvProgressPct');
  const progressLabel = document.getElementById('csvProgressLabel');
  const zipDownload = document.getElementById('csvZipDownload');
  if (zipDownload) {
    if (zipDownload.dataset.previousUrl) {
      try { URL.revokeObjectURL(zipDownload.dataset.previousUrl); } catch (e) {}
    }
    zipDownload.style.display = 'none';
  }
  if (progressWrap) progressWrap.style.display = 'block';
  if (progressBar) progressBar.style.width = '0%';
  if (progressPct) progressPct.textContent = '0%';
  if (progressLabel) progressLabel.textContent = 'Processing...';
  const zip = new JSZip();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) throw new Error('No data rows');
      const headers = parseCSVLine(lines[0]);
      const rows = [];
      for (let r = 1; r < lines.length; r++) {
        const row = parseCSVLine(lines[r]);
        if (row.length === headers.length) rows.push(row);
      }
      if (!rows.length) throw new Error('No valid rows');
      // Render to canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
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
      // widths
      const measure = document.createElement('canvas').getContext('2d');
      measure.font = font;
      const colWidths = headers.map((h, colIdx) => {
        let max = measure.measureText(h).width;
        for (let row of rows) {
          max = Math.max(max, measure.measureText(row[colIdx] || '').width);
        }
        return Math.ceil(max + cellPadding * 2);
      });
      const tableWidth = colWidths.reduce((a, b) => a + b, 0);
      const tableHeight = headerHeight + rowHeight * rows.length;
      canvas.width = tableWidth;
      canvas.height = tableHeight;
      const c = ctx;
      // header
      let x = 0;
      c.font = headerFont;
      c.textBaseline = 'middle';
      for (let ci = 0; ci < headers.length; ci++) {
        c.fillStyle = headerBg;
        c.fillRect(x, 0, colWidths[ci], headerHeight);
        c.strokeStyle = borderColor;
        c.strokeRect(x, 0, colWidths[ci], headerHeight);
        c.fillStyle = headerColor;
        c.fillText(headers[ci], x + cellPadding, headerHeight / 2);
        x += colWidths[ci];
      }
      // rows
      c.font = font;
      for (let r = 0; r < rows.length; r++) {
        x = 0;
        for (let ci = 0; ci < headers.length; ci++) {
          c.fillStyle = cellBg;
          c.fillRect(x, headerHeight + r * rowHeight, colWidths[ci], rowHeight);
          c.strokeStyle = borderColor;
          c.strokeRect(x, headerHeight + r * rowHeight, colWidths[ci], rowHeight);
          c.fillStyle = cellColor;
          c.fillText(rows[r][ci], x + cellPadding, headerHeight + r * rowHeight + rowHeight / 2);
          x += colWidths[ci];
        }
      }
      // export blob
      const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const buf = await pngBlob.arrayBuffer();
      const base = file.name.replace(/\.[^/.]+$/, '');
      zip.file(`${base}_table.png`, buf);
    } catch (e) {
      console.warn('Skipping CSV file due to error:', file.name, e);
    }
    const pct = Math.round(((i + 1) / files.length) * 100);
    if (progressBar) progressBar.style.width = pct + '%';
    if (progressPct) progressPct.textContent = pct + '%';
    await new Promise(r => setTimeout(r, 10));
  }
  if (progressLabel) progressLabel.textContent = 'Zipping...';
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipUrl = URL.createObjectURL(zipBlob);
  if (progressWrap) progressWrap.style.display = 'none';
  if (zipDownload) {
    zipDownload.href = zipUrl;
    zipDownload.download = `csv_tables_${files.length}files.zip`;
    zipDownload.dataset.previousUrl = zipUrl;
    zipDownload.style.display = 'inline-block';
  }
  showNotification('CSV images ready. ZIP prepared.', 'success');
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

// Compression Tab Logic
// Compression feature removed

// Event listeners for compression functionality
// Compression feature removed

// Compression feature removed

// Compression feature removed

// Compression feature removed

// Compression feature removed

// Compression feature removed

// Compression feature removed

// Compression feature removed

// Compression feature removed

// Compression feature removed

// Compression feature removed

// Compression feature removed

// Compression feature removed

// Compression feature removed

// Helper function to quantize image colors for better PNG compression
// Compression feature removed

// Helper function to reduce audio bit depth for compression
// Compression feature removed

// Compression feature removed

// Compression feature removed

// Helper function to process Pizzicato sound offline
// Compression feature removed

// Simple audio compression fallback
// Compression feature removed

// Compression feature removed

// Compression feature removed

// Spritesheet Tool Logic
let spritesheetImages = [];
let spritesheetBatches = [];
let currentBatchIndex = 0;

function loadSpritesheetImages(files) {
  if (!files || files.length === 0) {
    showNotification("Please select at least one image.", "error");
    return;
  }

  // Don't clear existing images, just add to them
  const promises = [];
  const batchStartIndex = spritesheetImages.length;
  currentBatchIndex = spritesheetBatches.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (!file.type.startsWith('image/')) {
      showNotification(`File ${file.name} is not an image.`, "error");
      continue;
    }

    const promise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          spritesheetImages.push({
            name: file.name,
            image: img,
            width: img.width,
            height: img.height,
            index: spritesheetImages.length,
            batchIndex: currentBatchIndex,
            batchPosition: spritesheetImages.length - batchStartIndex
          });
          resolve();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });

    promises.push(promise);
  }

  Promise.all(promises).then(() => {
    // Add this batch to the batches array
    const batchImages = spritesheetImages.slice(batchStartIndex);
    spritesheetBatches.push({
      index: currentBatchIndex,
      startIndex: batchStartIndex,
      count: batchImages.length,
      name: `Batch ${currentBatchIndex + 1}`,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // Clear the file input for next batch
    document.getElementById('spritesheetInput').value = '';
    
    showSpritesheetSettings();
    updateSpritesheetPreview(); // This will call updateSpritesheetGrid() internally
    showNotification(`Loaded ${batchImages.length} images in Batch ${currentBatchIndex + 1}. Total: ${spritesheetImages.length} images.`, "success");
  });
}

function showSpritesheetSettings() {
  document.getElementById('spritesheetSettings').style.display = 'block';
  document.getElementById('spritesheetGrid').style.display = 'block';
  document.getElementById('generateSpritesheetBtn').style.display = 'block';
}

function updateSpritesheetGrid() {
  const container = document.getElementById('spritesheetItems');
  const columns = parseInt(document.getElementById('gridColumns').value);
  const cellSize = parseInt(document.getElementById('cellSize').value);
  const padding = parseInt(document.getElementById('spritePadding').value);

  container.innerHTML = '';
  container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  container.style.gap = `${Math.max(padding / 4, 4)}px`; // Scale down padding for preview

  // Scale down the preview cell size for better fit in the interface
  const previewCellSize = Math.min(Math.max(cellSize / 2, 60), 120);

  // Calculate total rows needed based on batches
  let totalRows = 0;
  spritesheetBatches.forEach(batch => {
    totalRows += Math.ceil(batch.count / columns);
  });

  // If no batches yet but images exist, calculate rows for current images
  if (spritesheetBatches.length === 0 && spritesheetImages.length > 0) {
    totalRows = Math.ceil(spritesheetImages.length / columns);
  }

  // Ensure we have at least the minimum rows from settings
  const minRows = parseInt(document.getElementById('gridRows').value);
  totalRows = Math.max(totalRows, minRows);

  let cellIndex = 0;
  
  // Create grid organized by batches
  spritesheetBatches.forEach((batch, batchIdx) => {
    // Add batch header
    const batchHeader = document.createElement('div');
    batchHeader.className = 'batch-header';
    batchHeader.style.gridColumn = `1 / ${columns + 1}`;
    batchHeader.innerHTML = `
      <span class="batch-title">${batch.name} (${batch.count} images)</span>
      <span class="batch-time">${batch.timestamp}</span>
      <button class="batch-remove-btn" onclick="removeBatch(${batchIdx})" title="Remove batch">🗑️</button>
    `;
    container.appendChild(batchHeader);

    // Add images from this batch
    const batchImages = spritesheetImages.filter(img => img.batchIndex === batch.index);
    batchImages.forEach((imageData, imgIdx) => {
      const cell = document.createElement('div');
      cell.className = 'sprite-item';
      cell.draggable = true;
      cell.dataset.index = imageData.index;
      cell.dataset.batchIndex = batch.index;
      cell.style.minHeight = `${previewCellSize}px`;
      cell.style.height = `${previewCellSize}px`;
      
      cell.innerHTML = `
        <div class="sprite-item-index">${cellIndex + 1}</div>
        <img src="${imageData.image.src}" alt="${imageData.name}" style="max-height: ${previewCellSize * 0.6}px;">
        <div class="sprite-item-name">${imageData.name}</div>
        <div class="sprite-batch-indicator">B${batch.index + 1}</div>
      `;
      
      container.appendChild(cell);
      cellIndex++;
    });

    // Fill remaining columns in the last row of this batch
    const imagesInBatch = batchImages.length;
    const remainingInRow = columns - (imagesInBatch % columns);
    if (remainingInRow < columns && remainingInRow > 0) {
      for (let i = 0; i < remainingInRow; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'sprite-placeholder batch-placeholder';
        placeholder.style.minHeight = `${previewCellSize}px`;
        placeholder.style.height = `${previewCellSize}px`;
        placeholder.innerHTML = `<span>Empty</span>`;
        container.appendChild(placeholder);
      }
    }
  });

  // If no images yet, show basic grid
  if (spritesheetImages.length === 0) {
    const totalCells = columns * minRows;
    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'sprite-placeholder';
      cell.style.minHeight = `${previewCellSize}px`;
      cell.style.height = `${previewCellSize}px`;
      cell.innerHTML = `<span>Empty</span>`;
      container.appendChild(cell);
    }
  }

  setupSpriteDragAndDrop();
}

function setupSpriteDragAndDrop() {
  const spriteItems = document.querySelectorAll('.sprite-item');
  
  spriteItems.forEach(item => {
    item.addEventListener('dragstart', handleSpriteDragStart);
    item.addEventListener('dragend', handleSpriteDragEnd);
    item.addEventListener('dragover', handleSpriteDragOver);
    item.addEventListener('drop', handleSpriteDrop);
    item.addEventListener('dragenter', handleSpriteDragEnter);
    item.addEventListener('dragleave', handleSpriteDragLeave);
  });
}

function handleSpriteDragStart(e) {
  e.target.classList.add('dragging');
  e.dataTransfer.setData('text/plain', e.target.dataset.index);
}

function handleSpriteDragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.sprite-item').forEach(item => {
    item.classList.remove('drag-over');
  });
}

function handleSpriteDragOver(e) {
  e.preventDefault();
}

function handleSpriteDragEnter(e) {
  e.preventDefault();
  if (e.target.classList.contains('sprite-item') && !e.target.classList.contains('dragging')) {
    e.target.classList.add('drag-over');
  }
}

function handleSpriteDragLeave(e) {
  if (!e.target.contains(e.relatedTarget)) {
    e.target.classList.remove('drag-over');
  }
}

function handleSpriteDrop(e) {
  e.preventDefault();
  const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
  const dropTarget = e.target.closest('.sprite-item');
  
  if (!dropTarget) return;
  
  const dropIndex = parseInt(dropTarget.dataset.index);
  
  if (draggedIndex !== dropIndex && !isNaN(draggedIndex) && !isNaN(dropIndex)) {
    // Swap the images in the array
    const temp = spritesheetImages[draggedIndex];
    spritesheetImages[draggedIndex] = spritesheetImages[dropIndex];
    spritesheetImages[dropIndex] = temp;
    
    // Update the grid and preview
    updateSpritesheetPreview();
  }
  
  dropTarget.classList.remove('drag-over');
}

function updateSpritesheetPreview() {
  // Update the grid layout when settings change
  updateSpritesheetGrid();
  
  // Show preview dimensions
  const columns = parseInt(document.getElementById('gridColumns').value);
  const rows = parseInt(document.getElementById('gridRows').value);
  const cellSize = parseInt(document.getElementById('cellSize').value);
  const padding = parseInt(document.getElementById('spritePadding').value);
  
  const canvasWidth = (cellSize * columns) + (padding * (columns - 1));
  const canvasHeight = (cellSize * rows) + (padding * (rows - 1));
  
  // Update grid info if there's a container for it
  let infoElement = document.getElementById('spritesheetInfo');
  if (!infoElement) {
    infoElement = document.createElement('div');
    infoElement.id = 'spritesheetInfo';
    infoElement.className = 'spritesheet-info';
    const settingsElement = document.getElementById('spritesheetSettings');
    settingsElement.appendChild(infoElement);
  }
  
  // Calculate actual rows needed based on batches
  let actualRows = 0;
  spritesheetBatches.forEach(batch => {
    actualRows += Math.ceil(batch.count / columns);
  });
  actualRows = Math.max(actualRows, rows);
  
  const actualCanvasHeight = (cellSize * actualRows) + (padding * (actualRows - 1));
  
  infoElement.innerHTML = `
    <div class="info-item">
      <span class="info-label">Grid:</span>
      <span class="info-value">${columns} × ${actualRows} (${columns * actualRows} cells)</span>
    </div>
    <div class="info-item">
      <span class="info-label">Final Size:</span>
      <span class="info-value">${canvasWidth} × ${actualCanvasHeight}px</span>
    </div>
    <div class="info-item">
      <span class="info-label">Images:</span>
      <span class="info-value">${spritesheetImages.length} (${spritesheetBatches.length} batches)</span>
    </div>
    <div class="info-item">
      <span class="info-label">Status:</span>
      <span class="info-value">Ready to generate</span>
    </div>
  `;
}

function removeBatch(batchIndex) {
  const batch = spritesheetBatches[batchIndex];
  if (!batch) return;
  
  // Remove images from this batch
  spritesheetImages = spritesheetImages.filter(img => img.batchIndex !== batch.index);
  
  // Remove the batch
  spritesheetBatches.splice(batchIndex, 1);
  
  // Reindex remaining images
  spritesheetImages.forEach((img, index) => {
    img.index = index;
  });
  
  // Update the display
  updateSpritesheetPreview();
  showNotification(`Batch ${batch.name} removed.`, "success");
  
  // If no images left, hide sections
  if (spritesheetImages.length === 0) {
    clearSpritesheetImages();
  }
}

function clearSpritesheetImages() {
  spritesheetImages = [];
  spritesheetBatches = [];
  currentBatchIndex = 0;
  document.getElementById('spritesheetInput').value = '';
  document.getElementById('spritesheetSettings').style.display = 'none';
  document.getElementById('spritesheetGrid').style.display = 'none';
  document.getElementById('generateSpritesheetBtn').style.display = 'none';
  document.getElementById('spritesheetResult').style.display = 'none';
  showNotification("All images and batches cleared.", "success");
}

function generateSpritesheet() {
  if (spritesheetImages.length === 0) {
    showNotification("Please load images first.", "error");
    return;
  }

  const columns = parseInt(document.getElementById('gridColumns').value);
  const cellSize = parseInt(document.getElementById('cellSize').value);
  const padding = parseInt(document.getElementById('spritePadding').value);
  const useBackground = document.getElementById('spritesheetBackground').checked;
  const backgroundColor = document.getElementById('spritesheetBgColor').value;

  const canvas = document.getElementById('spritesheetCanvas');
  const ctx = canvas.getContext('2d');

  // Calculate actual rows needed based on batches
  let totalRows = 0;
  spritesheetBatches.forEach(batch => {
    totalRows += Math.ceil(batch.count / columns);
  });

  // Calculate canvas dimensions
  const canvasWidth = (cellSize * columns) + (padding * (columns - 1));
  const canvasHeight = (cellSize * totalRows) + (padding * (totalRows - 1));
  
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Fill background if enabled
  if (useBackground) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // Disable image smoothing for pixel-perfect rendering
  ctx.imageSmoothingEnabled = false;

  // Draw sprites organized by batches
  let globalRow = 0;
  
  spritesheetBatches.forEach(batch => {
    const batchImages = spritesheetImages.filter(img => img.batchIndex === batch.index);
    
    batchImages.forEach((imageData, imgIndex) => {
      const col = imgIndex % columns;
      const localRow = Math.floor(imgIndex / columns);
      const row = globalRow + localRow;
      
      const x = col * (cellSize + padding);
      const y = row * (cellSize + padding);
      
      if (imageData && imageData.image) {
        // Calculate scale to fit image in cell while maintaining aspect ratio
        const scale = Math.min(cellSize / imageData.width, cellSize / imageData.height);
        const scaledWidth = imageData.width * scale;
        const scaledHeight = imageData.height * scale;
        
        // Center the image in the cell
        const offsetX = (cellSize - scaledWidth) / 2;
        const offsetY = (cellSize - scaledHeight) / 2;
        
        ctx.drawImage(
          imageData.image,
          x + offsetX,
          y + offsetY,
          scaledWidth,
          scaledHeight
        );
      }
    });
    
    // Move to next batch's starting row
    globalRow += Math.ceil(batch.count / columns);
  });

  // Set up download
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const download = document.getElementById('spritesheetDownload');
    download.href = url;
    download.style.display = 'inline-block';
    
    // Clean up previous URL
    if (download.dataset.previousUrl) {
      URL.revokeObjectURL(download.dataset.previousUrl);
    }
    download.dataset.previousUrl = url;
  });

  // Show result
  document.getElementById('spritesheetResult').style.display = 'block';
  
  showNotification(`Spritesheet generated! ${spritesheetBatches.length} batches, ${spritesheetImages.length} total sprites.`, "success");
}

// Color Palette Tool Logic
let paletteImage = null;
let originalImageData = null;

// Predefined color palettes
const colorPalettes = {
  '8bit': [
    // 8-bit VGA palette (256 colors)
    '#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
    '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF',
    // Add more 8-bit colors (simplified for demo)
    ...Array.from({length: 240}, (_, i) => {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    })
  ],
  '16bit': [
    '#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
    '#FF004D', '#FFA300', '#FFEC27', '#00E756', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'
  ],
  'nes': [
    '#000000', '#FFFFFF', '#7C7C7C', '#BCBCBC', '#880000', '#A80000', '#F83800', '#F83800',
    '#F83800', '#F83800', '#F83800', '#F83800', '#F83800', '#F83800', '#F83800', '#F83800',
    '#F83800', '#F83800', '#F83800', '#F83800', '#F83800', '#F83800', '#F83800', '#F83800',
    '#F83800', '#F83800', '#F83800', '#F83800', '#F83800', '#F83800', '#F83800', '#F83800',
    '#F83800', '#F83800', '#F83800', '#F83800', '#F83800', '#F83800', '#F83800', '#F83800',
    '#F83800', '#F83800', '#F83800', '#F83800', '#F83800', '#F83800', '#F83800', '#F83800',
    '#F83800', '#F83800', '#F83800', '#F83800', '#F83800', '#F83800', '#F83800', '#F83800'
  ],
  'gameboy': [
    '#0F380F', '#306230', '#8BAC0F', '#9BBC0F'
  ],
  'cga': [
    '#000000', '#00AA00', '#AA0000', '#AAAA00'
  ],
  'ega': [
    '#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
    '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF'
  ],
  'vga': [
    // VGA 256-color palette (simplified)
    '#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
    '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF',
    // Add more VGA colors
    ...Array.from({length: 240}, (_, i) => {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    })
  ],
  'dawnbringer16': [
    '#140c1c', '#442434', '#30346d', '#4e4a4e', '#854c30', '#346856', '#d04648', '#757161',
    '#597dce', '#d27d2c', '#8595a1', '#6daa2c', '#d2aa99', '#6dc2ca', '#dad45e', '#deeed6'
  ],
  'pico8': [
    '#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
    '#FF004D', '#FFA300', '#FFEC27', '#00E756', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'
  ],
  'aap64': [
    // AAP-64 palette (64 colors)
    '#000000', '#1A1A1A', '#2A2A2A', '#3A3A3A', '#4A4A4A', '#5A5A5A', '#6A6A6A', '#7A7A7A',
    '#8A8A8A', '#9A9A9A', '#AAAAAA', '#BABABA', '#CACACA', '#DADADA', '#EAEAEA', '#FFFFFF',
    '#000055', '#0000AA', '#0000FF', '#005500', '#005555', '#0055AA', '#0055FF', '#00AA00',
    '#00AA55', '#00AAAA', '#00AAFF', '#00FF00', '#00FF55', '#00FFAA', '#00FFFF', '#550000',
    '#550055', '#5500AA', '#5500FF', '#555500', '#555555', '#5555AA', '#5555FF', '#55AA00',
    '#55AA55', '#55AAAA', '#55AAFF', '#55FF00', '#55FF55', '#55FFAA', '#55FFFF', '#AA0000',
    '#AA0055', '#AA00AA', '#AA00FF', '#AA5500', '#AA5555', '#AA55AA', '#AA55FF', '#AAAA00',
    '#AAAA55', '#AAAAAA', '#AAAAFF', '#AAFF00', '#AAFF55', '#AAFFAA', '#AAFFFF', '#FF0000',
    '#FF0055', '#FF00AA', '#FF00FF', '#FF5500', '#FF5555', '#FF55AA', '#FF55FF', '#FFAA00'
  ],
  'arnes16': [
    '#000000', '#9D9D9D', '#FFFFFF', '#BE2633', '#E06F8B', '#493C2B', '#A46422', '#EB8931',
    '#F7E26B', '#A3E04D', '#2B3F4F', '#44891A', '#A3AAAE', '#C3D64D', '#FF9D3C', '#D4CC9E'
  ]
};

function loadPaletteImage(files) {
  if (!files || files.length === 0) {
    showNotification("Please select an image.", "error");
    return;
  }

  const file = files[0];
  if (!file.type.startsWith('image/')) {
    showNotification("Please select a valid image file.", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      paletteImage = img;
      originalImageData = null; // Will be set when processing
      
      showPaletteSettings();
      updatePalettePreview();
      showNotification("Image loaded successfully.", "success");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function showPaletteSettings() {
  document.getElementById('paletteSettings').style.display = 'block';
  document.getElementById('paletteComparison').style.display = 'block';
}

function updatePalettePreview() {
  if (!paletteImage) return;

  const paletteType = document.getElementById('paletteType').value;
  const palette = colorPalettes[paletteType];
  
  // Update palette colors display
  const paletteColors = document.getElementById('paletteColors');
  paletteColors.innerHTML = '';
  
  palette.forEach(color => {
    const colorDiv = document.createElement('div');
    colorDiv.className = 'palette-color';
    colorDiv.style.backgroundColor = color;
    colorDiv.title = color;
    paletteColors.appendChild(colorDiv);
  });

  // Process the image
  processImageWithPalette();
}

function processImageWithPalette() {
  if (!paletteImage) return;

  const paletteType = document.getElementById('paletteType').value;
  const dithering = document.getElementById('dithering').value;
  const colorMatching = document.getElementById('colorMatching').value;
  
  const palette = colorPalettes[paletteType];
  
  // Create canvases
  const originalCanvas = document.getElementById('originalCanvas');
  const paletteCanvas = document.getElementById('paletteCanvas');
  
  // Set canvas sizes
  const maxSize = 400;
  const scale = Math.min(maxSize / paletteImage.width, maxSize / paletteImage.height);
  const width = Math.floor(paletteImage.width * scale);
  const height = Math.floor(paletteImage.height * scale);
  
  originalCanvas.width = width;
  originalCanvas.height = height;
  paletteCanvas.width = width;
  paletteCanvas.height = height;
  
  const originalCtx = originalCanvas.getContext('2d');
  const paletteCtx = paletteCanvas.getContext('2d');
  
  // Draw original image
  originalCtx.drawImage(paletteImage, 0, 0, width, height);
  
  // Get image data
  const imageData = originalCtx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Convert to palette
  const convertedData = new Uint8ClampedArray(data.length);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Find closest color in palette
    const closestColor = findClosestColor(r, g, b, palette, colorMatching);
    
    // Convert hex to RGB
    const hexColor = closestColor.replace('#', '');
    const paletteR = parseInt(hexColor.substr(0, 2), 16);
    const paletteG = parseInt(hexColor.substr(2, 2), 16);
    const paletteB = parseInt(hexColor.substr(4, 2), 16);
    
    convertedData[i] = paletteR;
    convertedData[i + 1] = paletteG;
    convertedData[i + 2] = paletteB;
    convertedData[i + 3] = a;
  }
  
  // Apply dithering if selected
  if (dithering !== 'none') {
    applyDithering(convertedData, width, height, palette, dithering);
  }
  
  // Create new image data and draw
  const newImageData = new ImageData(convertedData, width, height);
  paletteCtx.putImageData(newImageData, 0, 0);
  
  // Set up download
  paletteCanvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const download = document.getElementById('paletteDownload');
    download.href = url;
    download.style.display = 'inline-block';
    
    // Clean up previous URL
    if (download.dataset.previousUrl) {
      URL.revokeObjectURL(download.dataset.previousUrl);
    }
    download.dataset.previousUrl = url;
  });
}

function findClosestColor(r, g, b, palette, method) {
  let closestColor = palette[0];
  let minDistance = Infinity;
  
  palette.forEach(color => {
    const hexColor = color.replace('#', '');
    const paletteR = parseInt(hexColor.substr(0, 2), 16);
    const paletteG = parseInt(hexColor.substr(2, 2), 16);
    const paletteB = parseInt(hexColor.substr(4, 2), 16);
    
    let distance;
    
    switch (method) {
      case 'euclidean':
        distance = Math.sqrt(
          Math.pow(r - paletteR, 2) + 
          Math.pow(g - paletteG, 2) + 
          Math.pow(b - paletteB, 2)
        );
        break;
      case 'manhattan':
        distance = Math.abs(r - paletteR) + Math.abs(g - paletteG) + Math.abs(b - paletteB);
        break;
      case 'perceptual':
        // Simplified perceptual distance (CIE2000 would be more complex)
        const deltaR = r - paletteR;
        const deltaG = g - paletteG;
        const deltaB = b - paletteB;
        distance = Math.sqrt(deltaR * deltaR * 0.299 + deltaG * deltaG * 0.587 + deltaB * deltaB * 0.114);
        break;
      default:
        distance = Math.sqrt(
          Math.pow(r - paletteR, 2) + 
          Math.pow(g - paletteG, 2) + 
          Math.pow(b - paletteB, 2)
        );
    }
    
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  });
  
  return closestColor;
}

function applyDithering(imageData, width, height, palette, method) {
  // Simplified dithering implementation
  // In a full implementation, this would apply Floyd-Steinberg, Bayer, etc.
  
  if (method === 'floyd-steinberg') {
    // Basic Floyd-Steinberg dithering
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const oldR = imageData[idx];
        const oldG = imageData[idx + 1];
        const oldB = imageData[idx + 2];
        
        // Find closest color
        const closestColor = findClosestColor(oldR, oldG, oldB, palette, 'euclidean');
        const hexColor = closestColor.replace('#', '');
        const newR = parseInt(hexColor.substr(0, 2), 16);
        const newG = parseInt(hexColor.substr(2, 2), 16);
        const newB = parseInt(hexColor.substr(4, 2), 16);
        
        // Set new color
        imageData[idx] = newR;
        imageData[idx + 1] = newG;
        imageData[idx + 2] = newB;
        
        // Calculate error
        const errR = oldR - newR;
        const errG = oldG - newG;
        const errB = oldB - newB;
        
        // Distribute error to neighboring pixels
        if (x + 1 < width) {
          imageData[idx + 4] = Math.max(0, Math.min(255, imageData[idx + 4] + errR * 7 / 16));
          imageData[idx + 5] = Math.max(0, Math.min(255, imageData[idx + 5] + errG * 7 / 16));
          imageData[idx + 6] = Math.max(0, Math.min(255, imageData[idx + 6] + errB * 7 / 16));
        }
        if (x - 1 >= 0 && y + 1 < height) {
          const idx2 = ((y + 1) * width + (x - 1)) * 4;
          imageData[idx2] = Math.max(0, Math.min(255, imageData[idx2] + errR * 3 / 16));
          imageData[idx2 + 1] = Math.max(0, Math.min(255, imageData[idx2 + 1] + errG * 3 / 16));
          imageData[idx2 + 2] = Math.max(0, Math.min(255, imageData[idx2 + 2] + errB * 3 / 16));
        }
        if (y + 1 < height) {
          const idx2 = ((y + 1) * width + x) * 4;
          imageData[idx2] = Math.max(0, Math.min(255, imageData[idx2] + errR * 5 / 16));
          imageData[idx2 + 1] = Math.max(0, Math.min(255, imageData[idx2 + 1] + errG * 5 / 16));
          imageData[idx2 + 2] = Math.max(0, Math.min(255, imageData[idx2 + 2] + errB * 5 / 16));
        }
        if (x + 1 < width && y + 1 < height) {
          const idx2 = ((y + 1) * width + (x + 1)) * 4;
          imageData[idx2] = Math.max(0, Math.min(255, imageData[idx2] + errR * 1 / 16));
          imageData[idx2 + 1] = Math.max(0, Math.min(255, imageData[idx2 + 1] + errG * 1 / 16));
          imageData[idx2 + 2] = Math.max(0, Math.min(255, imageData[idx2 + 2] + errB * 1 / 16));
        }
      }
    }
  }
  // Other dithering methods would be implemented here
}

function clearPaletteImage() {
  paletteImage = null;
  originalImageData = null;
  document.getElementById('paletteInput').value = '';
  document.getElementById('paletteSettings').style.display = 'none';
  document.getElementById('paletteComparison').style.display = 'none';
  showNotification("Image cleared.", "success");
}

// File Converter Logic
let converterFile = null;
let converterImage = null;
let selectedFormat = null;

// Event listeners for converter functionality
document.addEventListener('DOMContentLoaded', function() {
  // Quality slider handler
  const qualitySlider = document.getElementById('conversionQuality');
  const qualityValue = document.getElementById('qualityValue');
  if (qualitySlider && qualityValue) {
    qualitySlider.addEventListener('input', function() {
      qualityValue.textContent = this.value + '%';
    });
  }

  // Maintain aspect ratio handler
  const maintainAspectRatio = document.getElementById('maintainAspectRatio');
  const conversionWidth = document.getElementById('conversionWidth');
  const conversionHeight = document.getElementById('conversionHeight');
  
  if (maintainAspectRatio && conversionWidth && conversionHeight) {
    conversionWidth.addEventListener('input', function() {
      if (maintainAspectRatio.checked && converterImage) {
        const aspectRatio = converterImage.width / converterImage.height;
        const newWidth = parseInt(this.value) || 0;
        const newHeight = Math.round(newWidth / aspectRatio);
        conversionHeight.value = newHeight;
      }
    });
    
    conversionHeight.addEventListener('input', function() {
      if (maintainAspectRatio.checked && converterImage) {
        const aspectRatio = converterImage.width / converterImage.height;
        const newHeight = parseInt(this.value) || 0;
        const newWidth = Math.round(newHeight * aspectRatio);
        conversionWidth.value = newWidth;
      }
    });
  }
});

function detectConversionOptions() {
  const fileInput = document.getElementById('converterInput');
  const file = fileInput.files[0];
  
  if (!file) {
    showNotification('Please select a file first.', 'error');
    return;
  }
  
  // Check if it's an ICO file
  if (file.name.toLowerCase().endsWith('.ico') || file.type === 'image/x-icon') {
    handleICOFile(file);
    return;
  }
  
  if (!file.type.startsWith('image/')) {
    showNotification('Please select an image file.', 'error');
    return;
  }
  
  converterFile = file;
  
  // Load image for analysis
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      converterImage = img;
      displayConverterFileInfo(file, img);
      showConversionOptions();
      showNotification(`${file.name} loaded successfully!`, 'success');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function handleICOFile(file) {
  converterFile = file;
  
  parseICOFile(file).then(images => {
    if (images.length === 0) {
      showNotification('No valid images found in ICO file.', 'error');
      return;
    }
    
    // Use the largest image for preview and conversion
    const largestImage = images.reduce((largest, current) => {
      return (current.width * current.height) > (largest.width * largest.height) ? current : largest;
    });
    
    // Load the largest image
    const img = new Image();
    img.onload = () => {
      converterImage = img;
      displayICOFileInfo(file, images, img);
      showConversionOptions();
      showNotification(`ICO file loaded with ${images.length} icon sizes!`, 'success');
    };
    img.src = largestImage.dataURL;
  }).catch(error => {
    showNotification(`Error reading ICO file: ${error.message}`, 'error');
  });
}

function displayConverterFileInfo(file, img) {
  const fileInfo = document.getElementById('converterFileInfo');
  const fileDetails = document.getElementById('converterFileDetails');
  
  const fileSize = formatFileSize(file.size);
  const fileType = file.type;
  const fileName = file.name;
  const dimensions = `${img.width} × ${img.height}`;
  const aspectRatio = (img.width / img.height).toFixed(2);
  
  fileDetails.innerHTML = `
    <div class="file-detail-item">
      <span class="file-detail-label">Name</span>
      <span class="file-detail-value">${fileName}</span>
    </div>
    <div class="file-detail-item">
      <span class="file-detail-label">Size</span>
      <span class="file-detail-value">${fileSize}</span>
    </div>
    <div class="file-detail-item">
      <span class="file-detail-label">Type</span>
      <span class="file-detail-value">${fileType}</span>
    </div>
    <div class="file-detail-item">
      <span class="file-detail-label">Dimensions</span>
      <span class="file-detail-value">${dimensions}</span>
    </div>
    <div class="file-detail-item">
      <span class="file-detail-label">Aspect Ratio</span>
      <span class="file-detail-value">${aspectRatio}</span>
    </div>
  `;
  
  fileInfo.style.display = 'block';
  
  // Set initial dimensions in settings
  document.getElementById('conversionWidth').value = img.width;
  document.getElementById('conversionHeight').value = img.height;
}

function displayICOFileInfo(file, images, img) {
  const fileInfo = document.getElementById('converterFileInfo');
  const fileDetails = document.getElementById('converterFileDetails');
  
  const fileSize = formatFileSize(file.size);
  const fileName = file.name;
  const dimensions = `${img.width} × ${img.height}`;
  const aspectRatio = (img.width / img.height).toFixed(2);
  
  // Create list of icon sizes
  const iconSizes = images.map(img => `${img.width}×${img.height}`).join(', ');
  
  fileDetails.innerHTML = `
    <div class="file-detail-item">
      <span class="file-detail-label">Name</span>
      <span class="file-detail-value">${fileName}</span>
    </div>
    <div class="file-detail-item">
      <span class="file-detail-label">Size</span>
      <span class="file-detail-value">${fileSize}</span>
    </div>
    <div class="file-detail-item">
      <span class="file-detail-label">Type</span>
      <span class="file-detail-value">ICO (Windows Icon)</span>
    </div>
    <div class="file-detail-item">
      <span class="file-detail-label">Icon Sizes</span>
      <span class="file-detail-value">${iconSizes}</span>
    </div>
    <div class="file-detail-item">
      <span class="file-detail-label">Largest Icon</span>
      <span class="file-detail-value">${dimensions}</span>
    </div>
    <div class="file-detail-item">
      <span class="file-detail-label">Aspect Ratio</span>
      <span class="file-detail-value">${aspectRatio}</span>
    </div>
  `;
  
  fileInfo.style.display = 'block';
  
  // Set initial dimensions in settings
  document.getElementById('conversionWidth').value = img.width;
  document.getElementById('conversionHeight').value = img.height;
}

function showConversionOptions() {
  document.getElementById('conversionOptions').style.display = 'block';
  document.getElementById('conversionResult').style.display = 'none';
}

function selectConversionFormat(format) {
  selectedFormat = format;
  
  // Update button states
  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  document.querySelector(`[data-format="${format}"]`).classList.add('selected');
  
  // Show settings
  document.getElementById('formatSettings').style.display = 'block';
  document.getElementById('convertButton').style.display = 'block';
  
  // Update settings based on format
  updateFormatSettings(format);
}

function updateFormatSettings(format) {
  const qualitySlider = document.getElementById('conversionQuality');
  const qualityValue = document.getElementById('qualityValue');
  const formatSettings = document.getElementById('formatSettings');
  
  // Hide all format-specific settings first
  const icoSizeSettings = document.getElementById('icoSizeSettings');
  if (icoSizeSettings) icoSizeSettings.style.display = 'none';
  
  switch(format) {
    case 'png':
      qualitySlider.style.display = 'none';
      qualityValue.style.display = 'none';
      formatSettings.style.display = 'block';
      break;
    case 'jpg':
    case 'webp':
      qualitySlider.style.display = 'block';
      qualityValue.style.display = 'inline';
      qualitySlider.value = 90;
      qualityValue.textContent = '90%';
      formatSettings.style.display = 'block';
      break;
    case 'ico':
      qualitySlider.style.display = 'none';
      qualityValue.style.display = 'none';
      formatSettings.style.display = 'none';
      if (icoSizeSettings) {
        icoSizeSettings.style.display = 'block';
        // Set default selections
        document.querySelectorAll('input[name="icoSize"][value="16"]').forEach(cb => cb.checked = true);
        document.querySelectorAll('input[name="icoSize"][value="32"]').forEach(cb => cb.checked = true);
      }
      break;
    default:
      qualitySlider.style.display = 'block';
      qualityValue.style.display = 'inline';
      formatSettings.style.display = 'block';
  }
}

function clearConverterFile() {
  converterFile = null;
  converterImage = null;
  selectedFormat = null;
  
  document.getElementById('converterInput').value = '';
  document.getElementById('converterFileInfo').style.display = 'none';
  document.getElementById('conversionOptions').style.display = 'none';
  document.getElementById('conversionResult').style.display = 'none';
  
  // Reset button states
  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  
  showNotification('File cleared!', 'success');
}

async function performConversion() {
  if (!converterFile || !converterImage || !selectedFormat) {
    showNotification('Please select a file and format first.', 'error');
    return;
  }
  
  const convertButton = document.getElementById('convertButton');
  convertButton.disabled = true;
  convertButton.textContent = 'Converting...';
  
  try {
    const quality = parseInt(document.getElementById('conversionQuality').value) / 100;
    const width = parseInt(document.getElementById('conversionWidth').value) || converterImage.width;
    const height = parseInt(document.getElementById('conversionHeight').value) || converterImage.height;
    
    let convertedData;
    let convertedSize;
    let originalSize = converterFile.size;
    
    switch(selectedFormat) {
      case 'png':
        convertedData = await convertToPNG(converterImage, width, height);
        break;
      case 'jpg':
        convertedData = await convertToJPG(converterImage, width, height, quality);
        break;
      case 'webp':
        convertedData = await convertToWebP(converterImage, width, height, quality);
        break;
      case 'ico':
        convertedData = await convertToICO(converterImage, width, height);
        break;
      case 'svg':
        convertedData = await convertToSVG(converterImage, width, height);
        break;
      case 'bmp':
        convertedData = await convertToBMP(converterImage, width, height);
        break;
      default:
        throw new Error(`Unsupported format: ${selectedFormat}`);
    }
    
    // Calculate converted size
    if (convertedData.startsWith('data:')) {
      const base64 = convertedData.split(',')[1];
      convertedSize = Math.ceil((base64.length * 3) / 4);
    } else if (convertedData instanceof Blob) {
      convertedSize = convertedData.size;
    } else {
      convertedSize = originalSize; // Fallback
    }
    
    // Display results
    displayConversionResults(originalSize, convertedSize, convertedData);
    
    showNotification(`File converted to ${selectedFormat.toUpperCase()} successfully!`, 'success');
  } catch (error) {
    console.error('Error converting file:', error);
    showNotification('Error converting file: ' + error.message, 'error');
  } finally {
    convertButton.disabled = false;
    convertButton.textContent = 'Convert File';
  }
}

// Conversion functions
async function convertToPNG(image, width, height) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;
    
    // Disable smoothing for pixel-perfect scaling
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0, width, height);
    
    try {
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    } catch (error) {
      reject(error);
    }
  });
}

async function convertToJPG(image, width, height, quality) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;
    
    // Fill with white background for JPG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    ctx.drawImage(image, 0, 0, width, height);
    
    try {
      const dataURL = canvas.toDataURL('image/jpeg', quality);
      resolve(dataURL);
    } catch (error) {
      reject(error);
    }
  });
}

async function convertToWebP(image, width, height, quality) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(image, 0, 0, width, height);
    
    try {
      const dataURL = canvas.toDataURL('image/webp', quality);
      resolve(dataURL);
    } catch (error) {
      reject(error);
    }
  });
}

async function convertToGIF(image, width, height) {
  throw new Error("GIF conversion is not supported in this browser. Please use PNG or WebP format instead.");
}

async function convertToICO(image, width, height) {
  // Enhanced ICO converter with support for multiple sizes and proper format
  return new Promise((resolve, reject) => {
    try {
      // Get the selected ICO sizes from the UI
      const selectedSizes = getSelectedICOSizes();
      
      if (selectedSizes.length === 0) {
        reject(new Error('Please select at least one icon size'));
        return;
      }
      
      // Create ICO with multiple sizes
      const icoData = createMultiSizeICO(image, selectedSizes);
      resolve(icoData);
    } catch (error) {
      reject(error);
    }
  });
}

function getSelectedICOSizes() {
  const sizes = [];
  const checkboxes = document.querySelectorAll('input[name="icoSize"]:checked');
  
  checkboxes.forEach(checkbox => {
    const size = parseInt(checkbox.value);
    if (size > 0) {
      sizes.push(size);
    }
  });
  
  return sizes.sort((a, b) => a - b); // Sort ascending
}

// Create preview of ICO with all selected sizes
function createICOPreview(image, sizes) {
  const previewContainer = document.createElement('div');
  previewContainer.className = 'ico-preview';
  previewContainer.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 1rem;
    padding: 1rem;
    background: var(--surface);
    border-radius: 8px;
    border: 1px solid var(--border);
  `;
  
  sizes.forEach(size => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = size;
    canvas.height = size;
    canvas.style.cssText = `
      border: 1px solid var(--border);
      border-radius: 4px;
      background: repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 50% / 20% 20%;
    `;
    
    // Disable image smoothing for crisp icons
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0, size, size);
    
    const sizeLabel = document.createElement('div');
    sizeLabel.textContent = `${size}×${size}`;
    sizeLabel.style.cssText = `
      text-align: center;
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-top: 0.5rem;
    `;
    
    const iconContainer = document.createElement('div');
    iconContainer.appendChild(canvas);
    iconContainer.appendChild(sizeLabel);
    
    previewContainer.appendChild(iconContainer);
  });
  
  return previewContainer;
}

function createMultiSizeICO(image, sizes) {
  const pngImages = [];
  let totalOffset = 6 + (sizes.length * 16); // Header + directory entries
  
  // Get ICO options
  const includeTransparency = document.getElementById('icoTransparent')?.checked ?? true;
  const optimizeSize = document.getElementById('icoOptimize')?.checked ?? true;
  
  // Create PNG data for each size
  sizes.forEach(size => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = size;
    canvas.height = size;
    
    // Disable image smoothing for crisp icons
    ctx.imageSmoothingEnabled = false;
    
    // Clear canvas with transparent background
    if (includeTransparency) {
      ctx.clearRect(0, 0, size, size);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
    }
    
    ctx.drawImage(image, 0, 0, size, size);
    
    // Use different quality settings based on optimization
    const quality = optimizeSize ? 0.9 : 1.0;
    const pngDataURL = canvas.toDataURL('image/png', quality);
    const base64 = pngDataURL.split(',')[1];
    const pngData = atob(base64);
    
    pngImages.push({
      size: size,
      data: pngData,
      offset: totalOffset
    });
    
    totalOffset += pngData.length;
  });
  
  // Create ICO header
  const headerSize = 6 + (sizes.length * 16);
  const icoData = new Uint8Array(headerSize + totalOffset - (6 + (sizes.length * 16)));
  const headerView = new DataView(icoData.buffer);
  
  // ICO file header
  headerView.setUint16(0, 0, true); // Reserved
  headerView.setUint16(2, 1, true); // Type (1 = ICO)
  headerView.setUint16(4, sizes.length, true); // Number of images
  
  // Create directory entries
  let currentOffset = 6 + (sizes.length * 16);
  
  pngImages.forEach((pngImage, index) => {
    const entryOffset = 6 + (index * 16);
    
    // Directory entry
    headerView.setUint8(entryOffset, pngImage.size === 256 ? 0 : pngImage.size); // Width
    headerView.setUint8(entryOffset + 1, pngImage.size === 256 ? 0 : pngImage.size); // Height
    headerView.setUint8(entryOffset + 2, 0); // Color count (0 = no color table)
    headerView.setUint8(entryOffset + 3, 0); // Reserved
    headerView.setUint16(entryOffset + 4, 1, true); // Color planes
    headerView.setUint16(entryOffset + 6, 32, true); // Bits per pixel
    headerView.setUint32(entryOffset + 8, pngImage.data.length, true); // Size of image data
    headerView.setUint32(entryOffset + 12, currentOffset, true); // Offset to image data
    
    // Copy PNG data
    const pngArray = new Uint8Array(pngImage.data.length);
    for (let i = 0; i < pngImage.data.length; i++) {
      pngArray[i] = pngImage.data.charCodeAt(i);
    }
    icoData.set(pngArray, currentOffset);
    
    currentOffset += pngImage.data.length;
  });
  
  return URL.createObjectURL(new Blob([icoData], { type: 'image/x-icon' }));
}

// Function to read and parse existing ICO files
function parseICOFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target.result;
        const view = new DataView(buffer);
        
        // Validate ICO file
        if (!isValidICOFile(view)) {
          reject(new Error('Invalid ICO file format'));
          return;
        }
        
        const numImages = view.getUint16(4, true);
        if (numImages === 0 || numImages > 255) {
          reject(new Error('Invalid number of images in ICO file'));
          return;
        }
        
        const images = [];
        
        // Parse directory entries
        for (let i = 0; i < numImages; i++) {
          const entryOffset = 6 + (i * 16);
          const width = view.getUint8(entryOffset) || 256;
          const height = view.getUint8(entryOffset + 1) || 256;
          const colorCount = view.getUint8(entryOffset + 2);
          const reserved = view.getUint8(entryOffset + 3);
          const colorPlanes = view.getUint16(entryOffset + 4, true);
          const bitsPerPixel = view.getUint16(entryOffset + 6, true);
          const size = view.getUint32(entryOffset + 8, true);
          const offset = view.getUint32(entryOffset + 12, true);
          
          // Validate entry
          if (offset + size > buffer.byteLength) {
            console.warn(`Skipping invalid image entry ${i + 1}: offset out of bounds`);
            continue;
          }
          
          // Extract PNG data
          const pngData = new Uint8Array(buffer, offset, size);
          
          // Validate PNG header
          if (pngData.length < 8 || !isValidPNG(pngData)) {
            console.warn(`Skipping invalid PNG data in image entry ${i + 1}`);
            continue;
          }
          
          const pngBlob = new Blob([pngData], { type: 'image/png' });
          const pngURL = URL.createObjectURL(pngBlob);
          
          images.push({
            width,
            height,
            colorCount,
            colorPlanes,
            bitsPerPixel,
            size,
            dataURL: pngURL,
            index: i
          });
        }
        
        if (images.length === 0) {
          reject(new Error('No valid images found in ICO file'));
          return;
        }
        
        resolve(images);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read ICO file'));
    reader.readAsArrayBuffer(file);
  });
}

// Validate ICO file header
function isValidICOFile(view) {
  if (view.byteLength < 6) return false;
  
  const reserved = view.getUint16(0, true);
  const type = view.getUint16(2, true);
  const numImages = view.getUint16(4, true);
  
  return reserved === 0 && type === 1 && numImages > 0 && numImages <= 255;
}

// Validate PNG data
function isValidPNG(data) {
  if (data.length < 8) return false;
  
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  
  for (let i = 0; i < 8; i++) {
    if (data[i] !== pngSignature[i]) return false;
  }
  
  return true;
}

// Extract individual icon from ICO file
function extractIconFromICO(file, iconIndex = 0) {
  return new Promise((resolve, reject) => {
    parseICOFile(file).then(images => {
      if (iconIndex >= images.length) {
        reject(new Error(`Icon index ${iconIndex} out of range. File contains ${images.length} icons.`));
        return;
      }
      
      const icon = images[iconIndex];
      resolve(icon);
    }).catch(reject);
  });
}

async function convertToICNS(image, width, height) {
  throw new Error("ICNS conversion is not supported in this browser. Please use PNG or ICO format instead.");
}

async function convertToSVG(image, width, height) {
  // Convert image to SVG by embedding as base64
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(image, 0, 0, width, height);
    
    try {
      const dataURL = canvas.toDataURL('image/png');
      const base64 = dataURL.split(',')[1];
      
      const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <image width="${width}" height="${height}" href="data:image/png;base64,${base64}"/>
        </svg>
      `;
      
      const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
      resolve(URL.createObjectURL(svgBlob));
    } catch (error) {
      reject(error);
    }
  });
}

async function convertToTIFF(image, width, height) {
  throw new Error("TIFF conversion is not supported in this browser. Please use PNG or WebP format instead.");
}

async function convertToBMP(image, width, height) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(image, 0, 0, width, height);
    
    try {
      const dataURL = canvas.toDataURL('image/bmp');
      resolve(dataURL);
    } catch (error) {
      reject(error);
    }
  });
}

async function convertToAVIF(image, width, height, quality) {
  throw new Error("AVIF conversion is not supported in this browser. Please use WebP or PNG format instead.");
}

function displayConversionResults(originalSize, convertedSize, convertedData) {
  const result = document.getElementById('conversionResult');
  const preview = document.getElementById('convertedPreview');
  const originalInfo = document.getElementById('originalInfo');
  const convertedInfo = document.getElementById('convertedInfo');
  const sizeReduction = document.getElementById('sizeReduction');
  const download = document.getElementById('conversionDownload');
  
  // Calculate size reduction
  const reduction = ((originalSize - convertedSize) / originalSize * 100).toFixed(1);
  const reductionText = reduction > 0 ? `-${reduction}% (${formatFileSize(originalSize - convertedSize)} saved)` : `+${Math.abs(reduction)}% (${formatFileSize(convertedSize - originalSize)} larger)`;
  
  // Update info
  originalInfo.textContent = `${formatFileSize(originalSize)}`;
  convertedInfo.textContent = `${formatFileSize(convertedSize)}`;
  sizeReduction.textContent = reductionText;
  
  // Update preview
  preview.src = convertedData;
  
  // Update download link
  const fileName = converterFile.name.replace(/\.[^/.]+$/, "");
  download.href = convertedData;
  download.download = `${fileName}.${selectedFormat}`;
  download.style.display = 'inline-block';
  
  result.style.display = 'block';
}
