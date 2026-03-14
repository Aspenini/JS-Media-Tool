import { showNotification } from '../ui/notification.js';

function textToBrainfuck(text: string): string {
  let code = '';
  let prev = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    let diff = c - prev;
    if (diff > 127) diff -= 256;
    if (diff < -127) diff += 256;
    if (diff > 0) {
      code += '+'.repeat(diff);
    } else if (diff < 0) {
      code += '-'.repeat(-diff);
    }
    code += '.';
    prev = c;
  }
  return code;
}

export function initBrainfuck(): void {
  const input = document.getElementById('brainfuckInput') as HTMLTextAreaElement;
  const output = document.getElementById('brainfuckOutput') as HTMLTextAreaElement;
  const copyBtn = document.querySelector<HTMLButtonElement>('[data-brainfuck-copy]');
  const downloadBtn = document.querySelector<HTMLButtonElement>('[data-brainfuck-download]');

  function encode(): void {
    if (output) output.value = textToBrainfuck(input?.value ?? '');
  }

  if (input) input.addEventListener('input', encode);

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!output?.value) {
        showNotification('No code to copy!', 'error');
        return;
      }
      output.select();
      output.setSelectionRange(0, 99999);
      try {
        document.execCommand('copy');
        showNotification('Brainfuck code copied to clipboard!', 'success');
      } catch {
        navigator.clipboard.writeText(output.value).then(
          () => showNotification('Brainfuck code copied to clipboard!', 'success'),
          () => showNotification('Failed to copy code. Please select and copy manually.', 'error')
        );
      }
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (!output?.value) {
        showNotification('No code to download!', 'error');
        return;
      }
      const blob = new Blob([output.value], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'brainfuck_code.bf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('Brainfuck code downloaded!', 'success');
    });
  }
}
