import { showNotification } from '../ui/notification.js';
import { createTarBlob } from '../utils/tar.js';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
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

export function initCsv(): void {
  const csvInput = document.getElementById('csvInput') as HTMLInputElement;
  const generateBtn = document.getElementById('generateBtn');

  if (csvInput && generateBtn) {
    csvInput.addEventListener('change', () => {
      generateBtn.disabled = !(csvInput.files && csvInput.files.length > 0);
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
      const files = Array.from((document.getElementById('csvInput') as HTMLInputElement)?.files || []);

      if (!files.length) {
        showNotification('Please select one or more CSV files.', 'error');
        return;
      }

      if (files.length === 1) {
        const progressWrap = document.getElementById('csvProgress');
        const progressBar = document.getElementById('csvProgressBar');
        const progressPct = document.getElementById('csvProgressPct');
        const progressLabel = document.getElementById('csvProgressLabel');
        const tarLink = document.getElementById('csvZipDownload') as HTMLAnchorElement;
        if (tarLink) tarLink.style.display = 'none';
        if (progressWrap) progressWrap.style.display = 'block';
        if (progressBar) progressBar.style.width = '0%';
        if (progressPct) progressPct.textContent = '0%';
        if (progressLabel) progressLabel.textContent = 'Processing...';

        try {
          const file = files[0];
          const text = await file.text();
          const lines = text.split('\n').filter((line) => line.trim() !== '');
          if (lines.length < 2) throw new Error('No data rows');
          const headers = parseCSVLine(lines[0]);
          const rows: string[][] = [];
          for (let r = 1; r < lines.length; r++) {
            const row = parseCSVLine(lines[r]);
            if (row.length === headers.length) rows.push(row);
          }
          if (!rows.length) throw new Error('No valid rows');

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

          const measure = document.createElement('canvas').getContext('2d')!;
          measure.font = font;
          const colWidths = headers.map((h, colIdx) => {
            let max = measure.measureText(h).width;
            for (const row of rows) {
              max = Math.max(max, measure.measureText(row[colIdx] || '').width);
            }
            return Math.ceil(max + cellPadding * 2);
          });
          const tableWidth = colWidths.reduce((a, b) => a + b, 0);
          const tableHeight = headerHeight + rowHeight * rows.length;

          const canvas = document.createElement('canvas');
          canvas.width = tableWidth;
          canvas.height = tableHeight;
          const c = canvas.getContext('2d')!;

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

          const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
          const url = pngBlob ? URL.createObjectURL(pngBlob) : canvas.toDataURL('image/png');
          const img = document.getElementById('tableImage') as HTMLImageElement;
          const link = document.getElementById('downloadTableImage') as HTMLAnchorElement;
          if (img && link) {
            img.src = url;
            link.href = url;
            link.download = `${file.name.replace(/\.[^/.]+$/, '')}_table.png`;
            const result = document.getElementById('imageResult');
            if (result) result.style.display = 'block';
          }
          if (progressWrap) progressWrap.style.display = 'none';
          showNotification('CSV image ready.', 'success');
        } catch (e) {
          console.error('CSV single image error:', e);
          showNotification('Error processing CSV: ' + (e instanceof Error ? e.message : String(e)), 'error');
        }
        return;
      }

      const progressWrap = document.getElementById('csvProgress');
      const progressBar = document.getElementById('csvProgressBar');
      const progressPct = document.getElementById('csvProgressPct');
      const progressLabel = document.getElementById('csvProgressLabel');
      const zipDownload = document.getElementById('csvZipDownload') as HTMLAnchorElement;

      if (zipDownload?.dataset.previousUrl) {
        try {
          URL.revokeObjectURL(zipDownload.dataset.previousUrl);
        } catch {
          /* ignore */
        }
        zipDownload.style.display = 'none';
      }
      if (progressWrap) progressWrap.style.display = 'block';
      if (progressBar) progressBar.style.width = '0%';
      if (progressPct) progressPct.textContent = '0%';
      if (progressLabel) progressLabel.textContent = 'Processing...';

      const tarEntries: { name: string; data: Uint8Array }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const text = await file.text();
          const lines = text.split('\n').filter((line) => line.trim() !== '');
          if (lines.length < 2) throw new Error('No data rows');
          const headers = parseCSVLine(lines[0]);
          const rows: string[][] = [];
          for (let r = 1; r < lines.length; r++) {
            const row = parseCSVLine(lines[r]);
            if (row.length === headers.length) rows.push(row);
          }
          if (!rows.length) throw new Error('No valid rows');

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
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

          const measure = document.createElement('canvas').getContext('2d')!;
          measure.font = font;
          const colWidths = headers.map((h, colIdx) => {
            let max = measure.measureText(h).width;
            for (const row of rows) {
              max = Math.max(max, measure.measureText(row[colIdx] || '').width);
            }
            return Math.ceil(max + cellPadding * 2);
          });
          const tableWidth = colWidths.reduce((a, b) => a + b, 0);
          const tableHeight = headerHeight + rowHeight * rows.length;
          canvas.width = tableWidth;
          canvas.height = tableHeight;
          const c = ctx;

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

          const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
          const buf = pngBlob ? await pngBlob.arrayBuffer() : new ArrayBuffer(0);
          const base = file.name.replace(/\.[^/.]+$/, '');
          tarEntries.push({ name: `${base}_table.png`, data: new Uint8Array(buf) });
        } catch (e) {
          console.warn('Skipping CSV file due to error:', file.name, e);
        }

        const pct = Math.round(((i + 1) / files.length) * 100);
        if (progressBar) progressBar.style.width = pct + '%';
        if (progressPct) progressPct.textContent = pct + '%';
        await new Promise((r) => setTimeout(r, 10));
      }

      if (progressLabel) progressLabel.textContent = 'Packaging...';
      const tarBlob = createTarBlob(tarEntries);
      const tarUrl = URL.createObjectURL(tarBlob);
      if (progressWrap) progressWrap.style.display = 'none';
      if (zipDownload) {
        zipDownload.href = tarUrl;
        zipDownload.download = `csv_tables_${files.length}files.tar`;
        zipDownload.dataset.previousUrl = tarUrl;
        zipDownload.textContent = 'Download All (TAR)';
        zipDownload.style.display = 'inline-block';
      }
      showNotification('CSV images ready. TAR prepared.', 'success');
    });
  }
}
