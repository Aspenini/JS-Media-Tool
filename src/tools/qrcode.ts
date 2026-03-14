import QRCode from 'qrcode';
import { showNotification } from '../ui/notification.js';

type ECL = 'L' | 'M' | 'Q' | 'H';

export function initQrcode(): void {
  const generateBtn = document.querySelector<HTMLButtonElement>('[data-qrcode-generate]');
  const contentInput = document.getElementById('qrcodeContent') as HTMLTextAreaElement;
  const eclSelect = document.getElementById('qrcodeEcl') as HTMLSelectElement;
  const sizeInput = document.getElementById('qrcodeSize') as HTMLInputElement;
  const marginInput = document.getElementById('qrcodeMargin') as HTMLInputElement;
  const darkColorInput = document.getElementById('qrcodeDark') as HTMLInputElement;
  const lightColorInput = document.getElementById('qrcodeLight') as HTMLInputElement;
  const formatSelect = document.getElementById('qrcodeFormat') as HTMLSelectElement;
  const previewContainer = document.getElementById('qrcodePreview');
  const downloadLink = document.getElementById('qrcodeDownload') as HTMLAnchorElement;

  if (!generateBtn || !contentInput || !previewContainer) return;

  if (sizeInput) {
    sizeInput.addEventListener('input', () => {
      const val = parseInt(sizeInput.value, 10);
      if (!isNaN(val) && val > 1024) {
        sizeInput.value = '1024';
      }
    });
    sizeInput.addEventListener('change', () => {
      const val = parseInt(sizeInput.value, 10);
      if (!isNaN(val) && val > 1024) {
        sizeInput.value = '1024';
      } else if (!isNaN(val) && val < 64) {
        sizeInput.value = '64';
      }
    });
  }

  generateBtn.addEventListener('click', async () => {
    const content = contentInput.value.trim();
    if (!content) {
      showNotification('Please enter content to encode.', 'error');
      return;
    }

    try {
      const ecl = (eclSelect?.value || 'M') as ECL;
      const width = parseInt(sizeInput?.value || '256', 10) || 256;
      const margin = parseInt(marginInput?.value || '2', 10) || 2;
      const darkColor = darkColorInput?.value || '#000000';
      const lightColor = lightColorInput?.value || '#ffffff';
      const format = formatSelect?.value || 'png';

      const options = {
        errorCorrectionLevel: ecl,
        width: Math.min(Math.max(width, 64), 1024),
        margin,
        color: {
          dark: darkColor,
          light: lightColor,
        },
      };

      if (format === 'svg') {
        const svgString = await QRCode.toString(content, {
          ...options,
          type: 'svg',
        });
        previewContainer.innerHTML = svgString;
        const svgEl = previewContainer.querySelector('svg');
        if (svgEl) {
          svgEl.style.maxWidth = '100%';
          svgEl.style.height = 'auto';
        }
        if (downloadLink) {
          const blob = new Blob([svgString], { type: 'image/svg+xml' });
          downloadLink.href = URL.createObjectURL(blob);
          downloadLink.download = 'qrcode.svg';
          downloadLink.style.display = 'inline-block';
          if (downloadLink.dataset.previousUrl) {
            URL.revokeObjectURL(downloadLink.dataset.previousUrl);
          }
          downloadLink.dataset.previousUrl = downloadLink.href;
        }
      } else {
        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(canvas, content, options);
        previewContainer.innerHTML = '';
        previewContainer.appendChild(canvas);
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';

        if (downloadLink) {
          const dataUrl = canvas.toDataURL('image/png');
          downloadLink.href = dataUrl;
          downloadLink.download = 'qrcode.png';
          downloadLink.style.display = 'inline-block';
          downloadLink.dataset.previousUrl = '';
        }
      }

      previewContainer.style.display = 'block';
      showNotification('QR Code generated successfully!', 'success');
    } catch (error) {
      console.error('QR Code error:', error);
      showNotification('Error generating QR Code: ' + (error instanceof Error ? error.message : String(error)), 'error');
    }
  });
}
