/**
 * Module (Audio Engine): Fluid ASCII Waveform Visualizer (▂▃▄▅▆▇█░▒▓)
 */

// Drawing Helper: Render Waveform ASCII Fluid & Simetris (Continuous Oscilloscope Waveform)
function drawVerticalASCIISpectrum(ctx, frequencyData, targetCanvas = null) {
  if (!frequencyData || frequencyData.length === 0) return;
  ctx.save();

  // Set karakter ASCII untuk presisi ketinggian & gelombang fluid (Sub-block + Density)
  const WAVE_CHARS = [" ", "▂", "▃", "▄", "▅", "▆", "▇", "█", "░", "▒", "▓"];

  const numColumns = 40; // 40 kolom resolusi gelombang
  const canvasW = targetCanvas ? targetCanvas.width : ctx.canvas.width;
  const canvasH = targetCanvas ? targetCanvas.height : ctx.canvas.height;

  const fontSize = 12;
  ctx.font = `700 ${fontSize}px "JetBrains Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Warna Putih Bersih dengan Efek Glowing Neon Menyala (#ffffff)
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(255, 255, 255, 0.95)";
  ctx.shadowBlur = 10;

  const totalWaveWidth = canvasW * 0.45; // Maksimal 45% lebar layar (tidak melebihi 50%)
  const colSpacing = totalWaveWidth / numColumns;
  const startX = (canvasW - totalWaveWidth) / 2;
  const baselineY = canvasH - 18;

  const halfCols = numColumns / 2;
  const time = Date.now() * 0.004; // Animasi mengalir kontinu (fluid ripple effect)

  for (let i = 0; i < numColumns; i++) {
    // Pemetaan Simetris Sejajar (Left-Right Mirrored Balance)
    const distFromCenter = Math.abs(i - halfCols + 0.5);
    const normalizedDist = 1 - (distFromCenter / halfCols); // 1.0 di tengah, 0.0 di ujung

    // Envelope sensitivitas melengkung (Hann windowing agar ujung halus)
    const edgeSensitivity = 0.25 + 0.75 * Math.pow(Math.sin(normalizedDist * Math.PI * 0.5), 1.6);

    // Ambil sampel frekuensi audio sesuai posisi kolom
    const binIdx = Math.floor((1 - normalizedDist) * (frequencyData.length * 0.45));
    const rawVal = frequencyData[binIdx] || 0;
    const audioAmp = (rawVal / 255) * edgeSensitivity;

    // Modulasi riak gelombang fluid tambahan
    const waveDisplacement = Math.sin(time + i * 0.35) * 0.15 * audioAmp;
    const totalAmp = Math.min(1.0, Math.max(0, audioAmp + waveDisplacement));

    const xPos = startX + i * colSpacing + colSpacing / 2;

    if (totalAmp < 0.03) {
      // Baseline resting wave symbol saat audio diam
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.fillText("~", xPos, baselineY);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(255, 255, 255, 0.95)";
      ctx.shadowBlur = 10;

      // Peta amplitudo ke indeks karakter sub-block (0 s/d WAVE_CHARS.length - 1)
      const charIdx = Math.floor(totalAmp * (WAVE_CHARS.length - 1));
      const charToDraw = WAVE_CHARS[charIdx];

      // Render gelombang oscillasi vertikal
      const heightOffset = Math.floor(totalAmp * fontSize * 1.2);
      
      // Layer Utama Baseline
      ctx.fillText(charToDraw, xPos, baselineY - (heightOffset * 0.5));

      // Layer Puncak Atas jika Amplitudo Tinggi (> 45%)
      if (totalAmp > 0.45) {
        const peakCharIdx = Math.floor((totalAmp - 0.45) * 1.8 * (WAVE_CHARS.length - 1));
        const peakChar = WAVE_CHARS[Math.min(WAVE_CHARS.length - 1, peakCharIdx)];
        ctx.fillText(peakChar, xPos, baselineY - heightOffset - 8);
      }
    }
  }

  ctx.restore();
}

window.drawVerticalASCIISpectrum = drawVerticalASCIISpectrum;
