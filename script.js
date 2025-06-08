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
