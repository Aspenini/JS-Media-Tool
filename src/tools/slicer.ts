import { showNotification } from '../ui/notification.js';

let image1: HTMLImageElement | null = null;
let image2: HTMLImageElement | null = null;

function loadImage(file: File | undefined, slot: 1 | 2): void {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      if (slot === 1) image1 = img;
      else image2 = img;
      showNotification(`Image ${slot} loaded successfully!`, 'success');
    };
    img.src = reader.result as string;
  };
  reader.readAsDataURL(file);
}

function extractNumber(name: string): string {
  const match = name.match(/\d+/);
  return match ? match[0] : '00';
}

function drawDiagonal(
  imgA: HTMLImageElement,
  imgB: HTMLImageElement,
  width: number,
  height: number,
  direction: 'tl2br' | 'tr2bl'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(imgA, 0, 0);
  ctx.save();
  ctx.beginPath();

  if (direction === 'tl2br') {
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
  } else {
    ctx.moveTo(canvas.width, 0);
    ctx.lineTo(0, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);
  }

  ctx.closePath();
  ctx.clip();
  ctx.drawImage(imgB, 0, 0);
  ctx.restore();

  return canvas.toDataURL('image/png');
}

export function initSlicer(): void {
  const img1Input = document.getElementById('img1') as HTMLInputElement;
  const img2Input = document.getElementById('img2') as HTMLInputElement;
  const allDirectionsCheck = document.getElementById('allDirections') as HTMLInputElement;
  const directionSelect = document.getElementById('direction') as HTMLSelectElement;
  const generateBtn = document.getElementById('generate');
  const outputList = document.getElementById('outputList');

  if (img1Input) img1Input.addEventListener('change', (e) => loadImage((e.target as HTMLInputElement).files?.[0], 1));
  if (img2Input) img2Input.addEventListener('change', (e) => loadImage((e.target as HTMLInputElement).files?.[0], 2));
  if (allDirectionsCheck && directionSelect) {
    allDirectionsCheck.addEventListener('change', (e) => {
      directionSelect.disabled = (e.target as HTMLInputElement).checked;
    });
  }

  if (generateBtn && outputList) {
    generateBtn.addEventListener('click', () => {
      if (!image1 || !image2) {
        showNotification('Please upload both images first.', 'error');
        return;
      }

      const allDirections = allDirectionsCheck?.checked ?? false;
      const file1 = img1Input?.files?.[0];
      const file2 = img2Input?.files?.[0];
      const num1 = file1 ? extractNumber(file1.name) : '00';
      const num2 = file2 ? extractNumber(file2.name) : '00';
      const w = image1.width;
      const h = image1.height;
      outputList.innerHTML = '';

      if (allDirections) {
        const variants = [
          { a: image1, b: image2, name: `tl2br_${num1}_${num2}.png`, dir: 'tl2br' as const },
          { a: image2, b: image1, name: `tl2br_${num2}_${num1}.png`, dir: 'tl2br' as const },
          { a: image1, b: image2, name: `tr2bl_${num1}_${num2}.png`, dir: 'tr2bl' as const },
          { a: image2, b: image1, name: `tr2bl_${num2}_${num1}.png`, dir: 'tr2bl' as const },
        ];

        variants.forEach((variant, index) => {
          setTimeout(() => {
            const dataURL = drawDiagonal(variant.a, variant.b, w, h, variant.dir);
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = variant.name;
            link.className = 'download-link fade-in';
            link.textContent = `Download ${variant.name}`;
            outputList.appendChild(link);
          }, index * 200);
        });
      } else {
        const dirVal = directionSelect?.value === 'left' ? 'tl2br' : 'tr2bl';
        const dataURL = drawDiagonal(image1, image2, w, h, dirVal);
        const name = `${dirVal}_${num1}_${num2}.png`;
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = name;
        link.className = 'download-link fade-in';
        link.textContent = `Download ${name}`;
        outputList.appendChild(link);
      }

      showNotification('Images generated successfully!', 'success');
    });
  }
}
