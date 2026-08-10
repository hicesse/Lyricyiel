/**
 * Module 4 (Audio Engine): Web Audio API Integration & Real-time Audio Spectrum Waveform
 */
let audioCtx = null;
let analyserNode = null;
let audioSourceNode = null;

/**
 * Menginisialisasi dan Membuka (Unlock) Web Audio API via User Gesture
 */
async function initAudioEngine(audioElement) {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }

  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  if (!analyserNode) {
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 128; // 64 frequency bins
  }

  if (!audioSourceNode && audioElement) {
    audioSourceNode = audioCtx.createMediaElementSource(audioElement);
    audioSourceNode.connect(analyserNode);
    analyserNode.connect(audioCtx.destination);
  }

  return { audioCtx, analyserNode };
}

/**
 * Menghasilkan string spektrum frekuensi audio berbasis karakter ASCII (░▒▓█)
 */
function getASCIIWaveformString(frequencyData, targetWidth = 40) {
  const bars = [" ", "░", "▒", "▓", "█"];
  let waveformStr = "";

  const step = Math.floor(frequencyData.length / targetWidth) || 1;

  for (let i = 0; i < targetWidth; i++) {
    const val = frequencyData[i * step] || 0;
    const barIndex = Math.floor((val / 255) * (bars.length - 1));
    waveformStr += bars[barIndex];
  }

  return waveformStr;
}

window.initAudioEngine = initAudioEngine;
window.getASCIIWaveformString = getASCIIWaveformString;
