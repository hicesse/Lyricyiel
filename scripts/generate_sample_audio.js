const fs = require('fs');
const path = require('path');

// Ensure directory exists
const audioDir = path.join(__dirname, '..', 'public', 'assets', 'audio');
fs.mkdirSync(audioDir, { recursive: true });

const sampleRate = 44100;
const durationSeconds = 20; // 20 seconds of synth music
const numChannels = 2;
const bytesPerSample = 2; // 16-bit
const blockAlign = numChannels * bytesPerSample;
const byteRate = sampleRate * blockAlign;
const totalSamples = sampleRate * durationSeconds;
const dataSize = totalSamples * blockAlign;
const buffer = Buffer.alloc(44 + dataSize);

// Write WAV Header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // Subchunk1Size
buffer.writeUInt16LE(1, 20);  // AudioFormat (PCM)
buffer.writeUInt16LE(numChannels, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(byteRate, 28);
buffer.writeUInt16LE(blockAlign, 32);
buffer.writeUInt16LE(bytesPerSample * 8, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

// Chord progression: Am -> F -> C -> G
const chords = [
  [220, 261.63, 329.63], // A minor (A3, C4, E4)
  [174.61, 220, 261.63], // F major (F3, A3, C4)
  [261.63, 329.63, 392.00], // C major (C4, E4, G4)
  [196.00, 246.94, 293.66]  // G major (G3, B3, D4)
];

const melodyNotes = [440, 523.25, 659.25, 587.33, 523.25, 440, 392, 440];

let offset = 44;
for (let i = 0; i < totalSamples; i++) {
  const t = i / sampleRate;
  
  // Select chord every 2.5 seconds
  const chordIdx = Math.floor((t / 2.5) % chords.length);
  const currentChord = chords[chordIdx];
  
  // Synth chord pad
  let sampleLeft = 0;
  let sampleRight = 0;

  for (let freq of currentChord) {
    sampleLeft += Math.sin(2 * Math.PI * freq * t) * 0.15;
    sampleRight += Math.sin(2 * Math.PI * freq * 1.002 * t) * 0.15; // Stereo detune
  }

  // Lead synth melody (changing notes faster)
  const noteIdx = Math.floor((t * 3) % melodyNotes.length);
  const melFreq = melodyNotes[noteIdx];
  const melEnv = Math.exp(-((t * 3) % 1) * 3); // Decay envelope
  const leadTone = (Math.sin(2 * Math.PI * melFreq * t) + 0.3 * Math.sin(4 * Math.PI * melFreq * t)) * melEnv * 0.2;

  // Rhythmic bass pulse
  const bassFreq = currentChord[0] / 2;
  const bassPulse = Math.sin(2 * Math.PI * bassFreq * t) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 4 * t)) * 0.25;

  let totalL = (sampleLeft + leadTone + bassPulse) * 0.7;
  let totalR = (sampleRight + leadTone + bassPulse) * 0.7;

  // Soft clipping
  totalL = Math.max(-1, Math.min(1, totalL));
  totalR = Math.max(-1, Math.min(1, totalR));

  const intL = Math.floor(totalL * 32767);
  const intR = Math.floor(totalR * 32767);

  buffer.writeInt16LE(intL, offset);
  buffer.writeInt16LE(intR, offset + 2);
  offset += 4;
}

const outputPath = path.join(audioDir, 'cyberpunk_resonance.wav');
fs.writeFileSync(outputPath, buffer);
console.log(`Sample WAV audio generated successfully at: ${outputPath}`);
