/**
 * Module 1 (Render Effect): ASCII Converter & Cover Crop Canvas Helper
 */
/**
 * Menggambar frame media ke Canvas Landscape dengan skala Cover (Center Crop)
 * Mendukung input video vertikal (9:16), foto potret, maupun landscape.
 * Menjamin media pas (fit 100%) menutupi grid tanpa stretching.
 */
function drawCoverCropToCanvas(mediaElem, ctx, targetW, targetH) {
  const mediaW = mediaElem.videoWidth || mediaElem.naturalWidth || mediaElem.width;
  const mediaH = mediaElem.videoHeight || mediaElem.naturalHeight || mediaElem.height;

  if (!mediaW || !mediaH) return;

  const mediaAspect = mediaW / mediaH;
  const targetAspect = targetW / targetH;

  let renderW, renderH, offsetX, offsetY;

  if (mediaAspect > targetAspect) {
    // Media lebih lebar dari target -> crop sisi kiri dan kanan secara simetris
    renderH = mediaH;
    renderW = mediaH * targetAspect;
    offsetX = (mediaW - renderW) / 2;
    offsetY = 0;
  } else {
    // Media lebih tinggi / vertikal (9:16) -> crop bagian atas dan bawah secara simetris
    renderW = mediaW;
    renderH = mediaW / targetAspect;
    offsetX = 0;
    offsetY = (mediaH - renderH) / 2;
  }

  ctx.clearRect(0, 0, targetW, targetH);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    mediaElem,
    offsetX, offsetY, renderW, renderH,
    0, 0, targetW, targetH
  );
}

/**
 * Mengonversi piksel Canvas 2D menjadi array warna RGB (Uint8Array)
 * Digunakan untuk merender dot matrix full warna dari file asli (.)
 */
function convertCanvasToColorDots(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const pixels = imgData.data;
  const colorData = new Uint8Array(width * height * 3);

  let colorIdx = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      colorData[colorIdx++] = pixels[idx];     // R
      colorData[colorIdx++] = pixels[idx + 1]; // G
      colorData[colorIdx++] = pixels[idx + 2]; // B
    }
  }
  return colorData;
}

window.drawCoverCropToCanvas = drawCoverCropToCanvas;
window.convertCanvasToColorDots = convertCanvasToColorDots;
