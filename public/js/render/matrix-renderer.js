/**
 * Module (Render Engine): Color ASCII & Dot Matrix GPU Renderer
 */
const DEFAULT_ASCII_CHARS = " .:-=+*#%@abi8";

// Helper: Render Matriks Karakter ASCII (" .:-=+*#%@") Full Warna Akurat & Gradien Kaya
function drawColorASCIIMatrix(ctx, colorData, width = 280, height = 157, targetCanvas = null, customAsciiChars = DEFAULT_ASCII_CHARS) {
  if (!colorData) return;

  const canvasW = targetCanvas ? targetCanvas.width : ctx.canvas.width;
  const canvasH = targetCanvas ? targetCanvas.height : ctx.canvas.height;

  const cellWidth = canvasW / width;
  const cellHeight = canvasH / height;
  const fontSize = Math.floor(Math.min(cellWidth, cellHeight) * 1.3);

  ctx.font = `700 ${fontSize}px "JetBrains Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const asciiChars = customAsciiChars || DEFAULT_ASCII_CHARS;
  let colorIdx = 0;

  for (let y = 0; y < height; y++) {
    const yPos = y * cellHeight + cellHeight / 2;
    const verticalGrad = 0.94 + (y / height) * 0.12;

    for (let x = 0; x < width; x++) {
      const xPos = x * cellWidth + cellWidth / 2;

      const r = colorData[colorIdx++];
      const g = colorData[colorIdx++];
      const b = colorData[colorIdx++];

      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      const charIdx = Math.floor((brightness / 255) * (asciiChars.length - 1));
      const char = asciiChars[charIdx];

      // Peningkatan kontras & kejenuhan warna alami (+12%) agar warna kaya dan akurat
      const contrastFactor = 1.12;
      let enhancedR = Math.min(255, Math.max(0, Math.floor((r - 128) * contrastFactor + 128)));
      let enhancedG = Math.min(255, Math.max(0, Math.floor((g - 128) * contrastFactor + 128)));
      let enhancedB = Math.min(255, Math.max(0, Math.floor((b - 128) * contrastFactor + 128)));

      enhancedR = Math.min(255, Math.floor(enhancedR * verticalGrad));
      enhancedG = Math.min(255, Math.floor(enhancedG * verticalGrad));
      enhancedB = Math.min(255, Math.floor(enhancedB * verticalGrad));

      ctx.fillStyle = `rgb(${enhancedR},${enhancedG},${enhancedB})`;
      ctx.fillText(char, xPos, yPos);
    }
  }
}

// Helper: Render Matriks Circle Dot Full Warna & Gradien Radial Akurat (LED/Shader Matrix)
function drawColorDotMatrix(ctx, colorData, width = 280, height = 157, targetCanvas = null) {
  if (!colorData) return;

  const canvasW = targetCanvas ? targetCanvas.width : ctx.canvas.width;
  const canvasH = targetCanvas ? targetCanvas.height : ctx.canvas.height;

  const cellWidth = canvasW / width;
  const cellHeight = canvasH / height;
  const maxRadius = Math.min(cellWidth, cellHeight) * 0.44;
  const minRadius = Math.min(cellWidth, cellHeight) * 0.20;

  let colorIdx = 0;
  for (let y = 0; y < height; y++) {
    const yPos = y * cellHeight + cellHeight / 2;
    const verticalGrad = 0.94 + (y / height) * 0.12;

    for (let x = 0; x < width; x++) {
      const xPos = x * cellWidth + cellWidth / 2;

      const r = colorData[colorIdx++];
      const g = colorData[colorIdx++];
      const b = colorData[colorIdx++];

      // Dynamic radius berdasarkan luminance untuk halftone shader contrast
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const radius = minRadius + (luminance / 255) * (maxRadius - minRadius);

      // Peningkatan kontras & kejenuhan warna alami agar akurat dari file asli
      const contrastFactor = 1.12;
      let enhancedR = Math.min(255, Math.max(0, Math.floor((r - 128) * contrastFactor + 128)));
      let enhancedG = Math.min(255, Math.max(0, Math.floor((g - 128) * contrastFactor + 128)));
      let enhancedB = Math.min(255, Math.max(0, Math.floor((b - 128) * contrastFactor + 128)));

      enhancedR = Math.min(255, Math.floor(enhancedR * verticalGrad));
      enhancedG = Math.min(255, Math.floor(enhancedG * verticalGrad));
      enhancedB = Math.min(255, Math.floor(enhancedB * verticalGrad));

      // Gradien radial per dot untuk pendaran warna kaya & kedalaman visual 3D
      if (radius > 1.5) {
        const dotGrad = ctx.createRadialGradient(xPos, yPos, 0, xPos, yPos, radius);
        dotGrad.addColorStop(0, `rgb(${Math.min(255, enhancedR + 25)},${Math.min(255, enhancedG + 25)},${Math.min(255, enhancedB + 25)})`);
        dotGrad.addColorStop(0.7, `rgb(${enhancedR},${enhancedG},${enhancedB})`);
        dotGrad.addColorStop(1, `rgba(${Math.floor(enhancedR * 0.7)},${Math.floor(enhancedG * 0.7)},${Math.floor(enhancedB * 0.7)}, 0.85)`);
        ctx.fillStyle = dotGrad;
      } else {
        ctx.fillStyle = `rgb(${enhancedR},${enhancedG},${enhancedB})`;
      }

      ctx.beginPath();
      ctx.arc(xPos, yPos, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Helper: Membangun Offscreen Canvas Buffer per Frame Media (Hanya frame media asli, hemat memori)
async function buildFrameCanvases(renderData, renderStyle, defaultGridW = 280, defaultGridH = 157, targetCanvas = null, onProgress = null) {
  if (!renderData || !renderData.frames || renderData.frames.length === 0) return [];

  const frameCanvases = [];
  const width = renderData.width || defaultGridW;
  const height = renderData.height || defaultGridH;
  const canvasW = targetCanvas ? targetCanvas.width : 1280;
  const canvasH = targetCanvas ? targetCanvas.height : 720;
  const total = renderData.frames.length;

  for (let i = 0; i < total; i++) {
    const fCanvas = document.createElement("canvas");
    fCanvas.width = canvasW;
    fCanvas.height = canvasH;
    const fCtx = fCanvas.getContext("2d");

    // Gradien latar belakang kaya warna (Rich Color Ambient Gradient) untuk kontras sinematik
    const bgGrad = fCtx.createLinearGradient(0, 0, 0, canvasH);
    bgGrad.addColorStop(0, "#07070d");
    bgGrad.addColorStop(0.5, "#0b0b14");
    bgGrad.addColorStop(1, "#050508");
    fCtx.fillStyle = bgGrad;
    fCtx.fillRect(0, 0, canvasW, canvasH);

    const colorData = renderData.frames[i];
    if (renderStyle === "dots") {
      drawColorDotMatrix(fCtx, colorData, width, height, fCanvas);
    } else {
      drawColorASCIIMatrix(fCtx, colorData, width, height, fCanvas);
    }

    frameCanvases.push(fCanvas);

    if (typeof onProgress === "function") {
      onProgress(((i + 1) / total) * 100);
    }

    // Yield main thread setiap 5 frame agar UI tidak freeze
    if (i % 5 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  return frameCanvases;
}

window.drawColorASCIIMatrix = drawColorASCIIMatrix;
window.drawColorDotMatrix = drawColorDotMatrix;
window.buildFrameCanvases = buildFrameCanvases;
