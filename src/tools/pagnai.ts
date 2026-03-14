import { showNotification } from '../ui/notification.js';
import { audioBufferToWavBlob } from '../utils/wav.js';

let pagnaiAudioContext: AudioContext | null = null;
let pagnaiAudioBuffer: AudioBuffer | null = null;
let pagnaiSourceNode: AudioBufferSourceNode | null = null;
let pagnaiGainNode: GainNode | null = null;

function initPAGNAIAudioContext(): boolean {
  if (!pagnaiAudioContext) {
    try {
      pagnaiAudioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch (error) {
      showNotification('Audio context not supported in this browser.', 'error');
      console.error('Audio context error:', error);
      return false;
    }
  }
  if (pagnaiAudioContext.state === 'suspended') {
    pagnaiAudioContext.resume();
  }
  return true;
}

export function initPagnai(): void {
  const volumeSlider = document.getElementById('pagnaiVolume') as HTMLInputElement;
  const volumeValue = document.getElementById('pagnaiVolumeValue');
  const modulationCheck = document.getElementById('pagnaiModulation') as HTMLInputElement;
  const modControls = document.getElementById('pagnaiModControls');
  const generateBtn = document.querySelector<HTMLButtonElement>('[data-pagnai-generate]');
  const playBtn = document.getElementById('pagnaiPlayBtn') as HTMLButtonElement;
  const stopBtn = document.getElementById('pagnaiStopBtn') as HTMLButtonElement;

  if (volumeSlider && volumeValue) {
    volumeSlider.addEventListener('input', () => {
      volumeValue.textContent = Math.round(parseFloat(volumeSlider.value) * 100) + '%';
    });
  }

  if (modulationCheck && modControls) {
    modulationCheck.addEventListener('change', (e) => {
      modControls.style.display = (e.target as HTMLInputElement).checked ? 'block' : 'none';
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      if (!initPAGNAIAudioContext() || !pagnaiAudioContext) return;

      try {
        const waveType = (document.getElementById('pagnaiWaveType') as HTMLSelectElement)?.value || 'sine';
        const frequency = parseFloat((document.getElementById('pagnaiFrequency') as HTMLInputElement)?.value || '440');
        const duration = parseFloat((document.getElementById('pagnaiDuration') as HTMLInputElement)?.value || '2');
        const volume = parseFloat((document.getElementById('pagnaiVolume') as HTMLInputElement)?.value || '0.5');
        const useModulation = (document.getElementById('pagnaiModulation') as HTMLInputElement)?.checked ?? false;

        const sampleRate = pagnaiAudioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = pagnaiAudioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        const twoPi = 2 * Math.PI;

        if (waveType === 'noise') {
          for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1) * volume;
          }
        } else {
          let modPhase = 0;
          if (useModulation) {
            const modFreq = parseFloat((document.getElementById('pagnaiModFreq') as HTMLInputElement)?.value || '5');
            const modDepth = parseFloat((document.getElementById('pagnaiModDepth') as HTMLInputElement)?.value || '50');
            for (let i = 0; i < length; i++) {
              const modValue = Math.sin(modPhase) * modDepth;
              const currentFreq = frequency + modValue;
              const phase = (currentFreq * twoPi * i) / sampleRate;
              let sample = 0;
              switch (waveType) {
                case 'sine':
                  sample = Math.sin(phase);
                  break;
                case 'square':
                  sample = Math.sin(phase) >= 0 ? 1 : -1;
                  break;
                case 'sawtooth':
                  sample = (2 * (phase % twoPi)) / twoPi - 1;
                  break;
                case 'triangle':
                  sample = 2 * Math.abs((2 * (phase % twoPi)) / twoPi - 1) - 1;
                  break;
              }
              data[i] = sample * volume;
              modPhase += (modFreq * twoPi) / sampleRate;
            }
          } else {
            for (let i = 0; i < length; i++) {
              const phase = (frequency * twoPi * i) / sampleRate;
              let sample = 0;
              switch (waveType) {
                case 'sine':
                  sample = Math.sin(phase);
                  break;
                case 'square':
                  sample = Math.sin(phase) >= 0 ? 1 : -1;
                  break;
                case 'sawtooth':
                  sample = (2 * (phase % twoPi)) / twoPi - 1;
                  break;
                case 'triangle':
                  sample = 2 * Math.abs((2 * (phase % twoPi)) / twoPi - 1) - 1;
                  break;
              }
              data[i] = sample * volume;
            }
          }
        }

        pagnaiAudioBuffer = buffer;
        const wavBlob = audioBufferToWavBlob(buffer);
        const url = URL.createObjectURL(wavBlob);

        const audioElement = document.getElementById('pagnaiAudio') as HTMLAudioElement;
        const downloadLink = document.getElementById('pagnaiDownload') as HTMLAnchorElement;
        if (audioElement) audioElement.src = url;
        if (downloadLink) {
          downloadLink.href = url;
          downloadLink.download = 'pagnai_audio.wav';
        }

        const preview = document.getElementById('pagnaiPreview');
        if (preview) preview.style.display = 'block';
        if (playBtn) playBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = false;

        showNotification('Audio generated successfully!', 'success');
      } catch (error) {
        showNotification('Error generating audio: ' + (error instanceof Error ? error.message : String(error)), 'error');
        console.error('PAGNAI generation error:', error);
      }
    });
  }

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (!pagnaiAudioBuffer || !initPAGNAIAudioContext() || !pagnaiAudioContext) {
        showNotification('Please generate audio first!', 'error');
        return;
      }
      try {
        if (pagnaiSourceNode) {
          try {
            pagnaiSourceNode.stop();
          } catch {
            /* ignore */
          }
        }
        pagnaiSourceNode = pagnaiAudioContext.createBufferSource();
        pagnaiGainNode = pagnaiAudioContext.createGain();
        pagnaiSourceNode.buffer = pagnaiAudioBuffer;
        pagnaiGainNode.gain.value = parseFloat((document.getElementById('pagnaiVolume') as HTMLInputElement)?.value || '0.5');
        pagnaiSourceNode.connect(pagnaiGainNode);
        pagnaiGainNode.connect(pagnaiAudioContext.destination);
        pagnaiSourceNode.onended = () => {
          if (playBtn) playBtn.disabled = false;
          if (stopBtn) stopBtn.disabled = true;
        };
        pagnaiSourceNode.start(0);
        playBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
      } catch (error) {
        showNotification('Error playing audio: ' + (error instanceof Error ? error.message : String(error)), 'error');
      }
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      if (pagnaiSourceNode) {
        try {
          pagnaiSourceNode.stop();
        } catch {
          /* ignore */
        }
        pagnaiSourceNode = null;
        pagnaiGainNode = null;
        if (playBtn) playBtn.disabled = false;
        stopBtn.disabled = true;
      }
    });
  }
}
