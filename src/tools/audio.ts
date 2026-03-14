import { showNotification } from '../ui/notification.js';
import { createTarBlob } from '../utils/tar.js';
import { audioBufferToWavBlob } from '../utils/wav.js';

let audioContext: AudioContext | null = null;

function createSaturationCurve(amount: number): Float32Array<ArrayBuffer> {
  const samples = 44100;
  const curveBuffer = new ArrayBuffer(samples * Float32Array.BYTES_PER_ELEMENT);
  const curve = new Float32Array(curveBuffer);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
  }
  return curve as Float32Array<ArrayBuffer>;
}

async function applyVintageRadioEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineContext = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);

  const monoBuffer = offlineContext.createBuffer(1, buffer.length, buffer.sampleRate);
  const inputData =
    buffer.numberOfChannels > 1
      ? Array.from({ length: buffer.numberOfChannels }, (_, ch) => buffer.getChannelData(ch))
      : [buffer.getChannelData(0)];
  const monoData = monoBuffer.getChannelData(0);
  for (let i = 0; i < buffer.length; i++) {
    let sum = 0;
    for (let ch = 0; ch < inputData.length; ch++) sum += inputData[ch][i];
    monoData[i] = sum / inputData.length;
  }

  const source = offlineContext.createBufferSource();
  source.buffer = monoBuffer;

  const bandpass = offlineContext.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 3000;
  bandpass.Q.value = 0.7;
  source.connect(bandpass);

  const compressor = offlineContext.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 12;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;
  bandpass.connect(compressor);

  const saturation = offlineContext.createWaveShaper();
  saturation.curve = createSaturationCurve(0.25);
  compressor.connect(saturation);

  const noiseBuffer = offlineContext.createBuffer(1, buffer.length, buffer.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < buffer.length; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.008;
  }
  const noiseSource = offlineContext.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  const mixGain = offlineContext.createGain();
  mixGain.gain.value = 1.0;
  saturation.connect(mixGain);
  noiseSource.connect(mixGain);
  mixGain.connect(offlineContext.destination);

  source.start(0);
  noiseSource.start(0);

  return await offlineContext.startRendering();
}

async function applyBitcrusherEffect(buffer: AudioBuffer, targetBitDepth: number): Promise<AudioBuffer> {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const targetRate = targetBitDepth === 8 ? 11025 : 22050;
  const holdInterval = Math.max(1, Math.round(sampleRate / targetRate));

  const ctx = audioContext || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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

export function initAudio(): void {
  const processBtn = document.querySelector<HTMLButtonElement>('[data-audio-process]');
  if (!processBtn) return;

  processBtn.addEventListener('click', async () => {
    const fileInput = document.getElementById('audioInput') as HTMLInputElement;
    const effectSelect = document.getElementById('audioEffect') as HTMLSelectElement;
    const files = Array.from(fileInput?.files || []);

    if (!files.length) {
      showNotification('Please select one or more audio files.', 'error');
      return;
    }

    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const effect = effectSelect?.value || 'vintageRadio';
      const progressWrap = document.getElementById('audioProgress');
      const progressBar = document.getElementById('audioProgressBar');
      const progressPct = document.getElementById('audioProgressPct');
      const progressLabel = document.getElementById('audioProgressLabel');
      const zipDownload = document.getElementById('audioZipDownload') as HTMLAnchorElement;

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
        const arrayBuffer = await file.arrayBuffer();
        const inputBuffer = await audioContext.decodeAudioData(arrayBuffer);

        let processedBuffer: AudioBuffer;
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
            processedBuffer = await applyVintageRadioEffect(inputBuffer);
        }

        const exportBitDepth = effect === 'bitcrusher8' ? 8 : 16;
        const wavBlob = audioBufferToWavBlob(processedBuffer, exportBitDepth);
        const arrayBuf = await wavBlob.arrayBuffer();
        const outName = `${file.name.replace(/\.[^/.]+$/, '')}_${effect}.wav`;
        tarEntries.push({ name: outName, data: new Uint8Array(arrayBuf) });

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
        zipDownload.download = `audio_${effect}_${files.length}files.tar`;
        zipDownload.textContent = 'Download All (TAR)';
        zipDownload.dataset.previousUrl = tarUrl;
        zipDownload.style.display = 'inline-block';
      }

      showNotification(`${files.length} file(s) processed. TAR ready to download.`, 'success');
    } catch (error) {
      console.error('Bulk audio error:', error);
      showNotification('Error processing files: ' + (error instanceof Error ? error.message : String(error)), 'error');
    }
  });
}
