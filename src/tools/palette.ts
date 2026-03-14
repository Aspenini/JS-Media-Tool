import { showNotification } from '../ui/notification.js';

const colorPalettes: Record<string, string[]> = {
  '8bit': [
    '#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
    '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF',
    ...Array.from({ length: 240 }, () => {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }),
  ],
  '16bit': [
    '#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
    '#FF004D', '#FFA300', '#FFEC27', '#00E756', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA',
  ],
  'nes': [
    '#000000', '#FFFFFF', '#7C7C7C', '#BCBCBC', '#880000', '#A80000', '#F83800', '#F83800',
    ...Array(46).fill('#F83800'),
  ],
  'gameboy': ['#0F380F', '#306230', '#8BAC0F', '#9BBC0F'],
  'cga': ['#000000', '#00AA00', '#AA0000', '#AAAA00'],
  'ega': [
    '#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
    '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF',
  ],
  'vga': [
    '#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
    '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF',
    ...Array.from({ length: 240 }, () => {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }),
  ],
  'dawnbringer16': [
    '#140c1c', '#442434', '#30346d', '#4e4a4e', '#854c30', '#346856', '#d04648', '#757161',
    '#597dce', '#d27d2c', '#8595a1', '#6daa2c', '#d2aa99', '#6dc2ca', '#dad45e', '#deeed6',
  ],
  'pico8': [
    '#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
    '#FF004D', '#FFA300', '#FFEC27', '#00E756', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA',
  ],
  'aap64': [
    '#000000', '#1A1A1A', '#2A2A2A', '#3A3A3A', '#4A4A4A', '#5A5A5A', '#6A6A6A', '#7A7A7A',
    '#8A8A8A', '#9A9A9A', '#AAAAAA', '#BABABA', '#CACACA', '#DADADA', '#EAEAEA', '#FFFFFF',
    '#000055', '#0000AA', '#0000FF', '#005500', '#005555', '#0055AA', '#0055FF', '#00AA00',
    '#00AA55', '#00AAAA', '#00AAFF', '#00FF00', '#00FF55', '#00FFAA', '#00FFFF', '#550000',
    '#550055', '#5500AA', '#5500FF', '#555500', '#555555', '#5555AA', '#5555FF', '#55AA00',
    '#55AA55', '#55AAAA', '#55AAFF', '#55FF00', '#55FF55', '#55FFAA', '#55FFFF', '#AA0000',
    '#AA0055', '#AA00AA', '#AA00FF', '#AA5500', '#AA5555', '#AA55AA', '#AA55FF', '#AAAA00',
    '#AAAA55', '#AAAAAA', '#AAAAFF', '#AAFF00', '#AAFF55', '#AAFFAA', '#AAFFFF', '#FF0000',
    '#FF0055', '#FF00AA', '#FF00FF', '#FF5500', '#FF5555', '#FF55AA', '#FF55FF', '#FFAA00',
  ],
  'arnes16': [
    '#000000', '#9D9D9D', '#FFFFFF', '#BE2633', '#E06F8B', '#493C2B', '#A46422', '#EB8931',
    '#F7E26B', '#A3E04D', '#2B3F4F', '#44891A', '#A3AAAE', '#C3D64D', '#FF9D3C', '#D4CC9E',
  ],
};

let paletteImage: HTMLImageElement | null = null;

function findClosestColor(r: number, g: number, b: number, palette: string[], method: string): string {
  let closestColor = palette[0];
  let minDistance = Infinity;

  palette.forEach((color) => {
    const hexColor = color.replace('#', '');
    const paletteR = parseInt(hexColor.substring(0, 2), 16);
    const paletteG = parseInt(hexColor.substring(2, 4), 16);
    const paletteB = parseInt(hexColor.substring(4, 6), 16);

    let distance: number;
    switch (method) {
      case 'manhattan':
        distance = Math.abs(r - paletteR) + Math.abs(g - paletteG) + Math.abs(b - paletteB);
        break;
      case 'perceptual':
        const deltaR = r - paletteR;
        const deltaG = g - paletteG;
        const deltaB = b - paletteB;
        distance = Math.sqrt(deltaR * deltaR * 0.299 + deltaG * deltaG * 0.587 + deltaB * deltaB * 0.114);
        break;
      default:
        distance = Math.sqrt(
          Math.pow(r - paletteR, 2) + Math.pow(g - paletteG, 2) + Math.pow(b - paletteB, 2)
        );
    }

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  });
  return closestColor;
}

function applyDithering(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  palette: string[],
  method: string
): void {
  if (method === 'floyd-steinberg') {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const oldR = imageData[idx];
        const oldG = imageData[idx + 1];
        const oldB = imageData[idx + 2];

        const closestColor = findClosestColor(oldR, oldG, oldB, palette, 'euclidean');
        const hexColor = closestColor.replace('#', '');
        const newR = parseInt(hexColor.substring(0, 2), 16);
        const newG = parseInt(hexColor.substring(2, 4), 16);
        const newB = parseInt(hexColor.substring(4, 6), 16);

        imageData[idx] = newR;
        imageData[idx + 1] = newG;
        imageData[idx + 2] = newB;

        const errR = oldR - newR;
        const errG = oldG - newG;
        const errB = oldB - newB;

        if (x + 1 < width) {
          imageData[idx + 4] = Math.max(0, Math.min(255, imageData[idx + 4] + (errR * 7) / 16));
          imageData[idx + 5] = Math.max(0, Math.min(255, imageData[idx + 5] + (errG * 7) / 16));
          imageData[idx + 6] = Math.max(0, Math.min(255, imageData[idx + 6] + (errB * 7) / 16));
        }
        if (x - 1 >= 0 && y + 1 < height) {
          const idx2 = ((y + 1) * width + (x - 1)) * 4;
          imageData[idx2] = Math.max(0, Math.min(255, imageData[idx2] + (errR * 3) / 16));
          imageData[idx2 + 1] = Math.max(0, Math.min(255, imageData[idx2 + 1] + (errG * 3) / 16));
          imageData[idx2 + 2] = Math.max(0, Math.min(255, imageData[idx2 + 2] + (errB * 3) / 16));
        }
        if (y + 1 < height) {
          const idx2 = ((y + 1) * width + x) * 4;
          imageData[idx2] = Math.max(0, Math.min(255, imageData[idx2] + (errR * 5) / 16));
          imageData[idx2 + 1] = Math.max(0, Math.min(255, imageData[idx2 + 1] + (errG * 5) / 16));
          imageData[idx2 + 2] = Math.max(0, Math.min(255, imageData[idx2 + 2] + (errB * 5) / 16));
        }
        if (x + 1 < width && y + 1 < height) {
          const idx2 = ((y + 1) * width + (x + 1)) * 4;
          imageData[idx2] = Math.max(0, Math.min(255, imageData[idx2] + (errR * 1) / 16));
          imageData[idx2 + 1] = Math.max(0, Math.min(255, imageData[idx2 + 1] + (errG * 1) / 16));
          imageData[idx2 + 2] = Math.max(0, Math.min(255, imageData[idx2 + 2] + (errB * 1) / 16));
        }
      }
    }
  }
}

function processImageWithPalette(): void {
  if (!paletteImage) return;

  const paletteType = (document.getElementById('paletteType') as HTMLSelectElement)?.value || '8bit';
  const dithering = (document.getElementById('dithering') as HTMLSelectElement)?.value || 'none';
  const colorMatching = (document.getElementById('colorMatching') as HTMLSelectElement)?.value || 'euclidean';
  const palette = colorPalettes[paletteType] || colorPalettes['8bit'];

  const originalCanvas = document.getElementById('originalCanvas') as HTMLCanvasElement;
  const paletteCanvas = document.getElementById('paletteCanvas') as HTMLCanvasElement;
  if (!originalCanvas || !paletteCanvas) return;

  const maxSize = 400;
  const scale = Math.min(maxSize / paletteImage.width, maxSize / paletteImage.height);
  const width = Math.floor(paletteImage.width * scale);
  const height = Math.floor(paletteImage.height * scale);

  originalCanvas.width = width;
  originalCanvas.height = height;
  paletteCanvas.width = width;
  paletteCanvas.height = height;

  const originalCtx = originalCanvas.getContext('2d')!;
  const paletteCtx = paletteCanvas.getContext('2d')!;

  originalCtx.drawImage(paletteImage, 0, 0, width, height);
  const imageData = originalCtx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const convertedData = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const closestColor = findClosestColor(r, g, b, palette, colorMatching);
    const hexColor = closestColor.replace('#', '');
    convertedData[i] = parseInt(hexColor.substring(0, 2), 16);
    convertedData[i + 1] = parseInt(hexColor.substring(2, 4), 16);
    convertedData[i + 2] = parseInt(hexColor.substring(4, 6), 16);
    convertedData[i + 3] = a;
  }

  if (dithering !== 'none') {
    applyDithering(convertedData, width, height, palette, dithering);
  }

  const newImageData = new ImageData(convertedData, width, height);
  paletteCtx.putImageData(newImageData, 0, 0);

  paletteCanvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const download = document.getElementById('paletteDownload') as HTMLAnchorElement;
    if (download) {
      if (download.dataset.previousUrl) URL.revokeObjectURL(download.dataset.previousUrl);
      download.href = url;
      download.dataset.previousUrl = url;
      download.style.display = 'inline-block';
    }
  });
}

function updatePalettePreview(): void {
  if (!paletteImage) return;

  const paletteType = (document.getElementById('paletteType') as HTMLSelectElement)?.value || '8bit';
  const palette = colorPalettes[paletteType] || colorPalettes['8bit'];

  const paletteColors = document.getElementById('paletteColors');
  if (paletteColors) {
    paletteColors.innerHTML = '';
    palette.forEach((color) => {
      const colorDiv = document.createElement('div');
      colorDiv.className = 'palette-color';
      colorDiv.style.backgroundColor = color;
      colorDiv.title = color;
      paletteColors.appendChild(colorDiv);
    });
  }
  processImageWithPalette();
}

export function initPalette(): void {
  const paletteInput = document.getElementById('paletteInput') as HTMLInputElement;
  const paletteType = document.getElementById('paletteType');
  const dithering = document.getElementById('dithering');
  const colorMatching = document.getElementById('colorMatching');
  const clearBtn = document.querySelector<HTMLButtonElement>('[data-palette-clear]');

  if (paletteInput) {
    paletteInput.addEventListener('change', (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files?.length) {
        showNotification('Please select an image.', 'error');
        return;
      }
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          paletteImage = img;
          const settings = document.getElementById('paletteSettings');
          const comparison = document.getElementById('paletteComparison');
          if (settings) settings.style.display = 'block';
          if (comparison) comparison.style.display = 'block';
          updatePalettePreview();
          showNotification('Image loaded successfully.', 'success');
        };
        img.src = (ev.target?.result as string) ?? '';
      };
      reader.readAsDataURL(file);
    });
  }

  [paletteType, dithering, colorMatching].forEach((el) => {
    el?.addEventListener('change', updatePalettePreview);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      paletteImage = null;
      if (paletteInput) paletteInput.value = '';
      const settings = document.getElementById('paletteSettings');
      const comparison = document.getElementById('paletteComparison');
      if (settings) settings.style.display = 'none';
      if (comparison) comparison.style.display = 'none';
      showNotification('Image cleared.', 'success');
    });
  }
}
