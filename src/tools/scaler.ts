import { showNotification } from '../ui/notification.js';

export function initScaler(): void {
  const scaleBtn = document.querySelector<HTMLButtonElement>('[data-scaler-scale]');
  if (!scaleBtn) return;

  scaleBtn.addEventListener('click', () => {
    const fileInput = document.getElementById('scaleInput') as HTMLInputElement;
    const factorInput = document.getElementById('scaleFactor') as HTMLInputElement;
    const factor = parseFloat(factorInput?.value ?? '');
    const fileInputEl = fileInput?.files?.[0];

    if (!fileInputEl || !Number.isFinite(factor) || factor <= 0) {
      showNotification('Please select an image and enter a scale factor.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.getElementById('scaleCanvas') as HTMLCanvasElement;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        canvas.width = img.width * factor;
        canvas.height = img.height * factor;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const out = canvas.toDataURL('image/png');
        const link = document.getElementById('scaleDownload') as HTMLAnchorElement;
        if (link) {
          link.href = out;
          link.download = `${fileInputEl.name.replace(/\.[^/.]+$/, '')}_upscaled.png`;
          link.style.display = 'inline-block';
        }
        showNotification('Image scaled successfully!', 'success');
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(fileInputEl);
  });
}
