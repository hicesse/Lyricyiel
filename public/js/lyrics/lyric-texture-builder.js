/**
 * Module (Lyrics Effect Engine): Offscreen HD Lyric Panel Texture Builder (Dots/ASCII)
 */
function buildLyricTextures(
  lyricsJSON,
  renderStyle,
  width = 280,
  height = 157,
  fillStyle = "dark-gray",
  glowStyle = "on",
  targetCanvas = null
) {
  const map = {};
  if (!Array.isArray(lyricsJSON)) return map;

  const canvasW = targetCanvas ? targetCanvas.width : 1280;
  const canvasH = targetCanvas ? targetCanvas.height : 720;

  lyricsJSON.forEach((item) => {
    const text = item.text;
    if (!text || map[text]) return;

    // 1. Buat mask vektor HD (1280x720) agar kurva huruf presisi & tidak pecah
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = canvasW;
    maskCanvas.height = canvasH;
    const mCtx = maskCanvas.getContext("2d");
    mCtx.clearRect(0, 0, canvasW, canvasH);

    // Font size proporsional 16% dari tinggi canvas (~115px pada 720p height)
    let fontSizeHD = Math.floor(canvasH * 0.16);
    mCtx.font = `900 ${fontSizeHD}px "Outfit", sans-serif`;

    // Autoscale font size jika kalimat lirik panjang (melebihi 90% lebar canvas)
    const maxTextW = canvasW * 0.90;
    const measuredW = mCtx.measureText(text).width;
    if (measuredW > maxTextW) {
      fontSizeHD = Math.floor(fontSizeHD * (maxTextW / measuredW));
      mCtx.font = `900 ${fontSizeHD}px "Outfit", sans-serif`;
    }

    mCtx.textAlign = "center";
    mCtx.textBaseline = "middle";

    // Posisi lirik di area 30% tinggi layar dari bawah (aman di atas spektrum & tidak menutupi media)
    const bottomGapHD = Math.floor(canvasH * 0.22);
    const yPosHD = canvasH - bottomGapHD - (fontSizeHD / 2);
    const xPosHD = canvasW / 2;

    // Draw stroke putih (outline) & fill hitam (interior blockout)
    mCtx.strokeStyle = "#ffffff";
    mCtx.lineWidth = Math.max(4, Math.floor(fontSizeHD * 0.08));
    mCtx.lineJoin = "round";
    mCtx.miterLimit = 2;
    mCtx.strokeText(text, xPosHD, yPosHD);

    mCtx.fillStyle = "#000001";
    mCtx.fillText(text, xPosHD, yPosHD);

    const maskData = mCtx.getImageData(0, 0, canvasW, canvasH).data;

    // 2. Petakan sel grid pengguna ke mask HD
    const cellWidth = canvasW / width;
    const cellHeight = canvasH / height;
    const maxRadius = Math.min(cellWidth, cellHeight) * 0.44;
    const fontSizeGrid = Math.floor(Math.min(cellWidth, cellHeight) * 1.3);

    const tCanvas = document.createElement("canvas");
    tCanvas.width = canvasW;
    tCanvas.height = canvasH;
    const tCtx = tCanvas.getContext("2d");
    tCtx.clearRect(0, 0, canvasW, canvasH);

    for (let y = 0; y < height; y++) {
      const cyPos = y * cellHeight + cellHeight / 2;
      const sampleY = Math.floor(cyPos);

      for (let x = 0; x < width; x++) {
        const cxPos = x * cellWidth + cellWidth / 2;
        const sampleX = Math.floor(cxPos);

        const pixelIdx = (sampleY * canvasW + sampleX) * 4;
        const maskA = maskData[pixelIdx + 3];

        if (maskA > 30) {
          const maskR = maskData[pixelIdx];
          const maskG = maskData[pixelIdx + 1];
          const maskB = maskData[pixelIdx + 2];

          if (maskR > 100 && maskG > 100 && maskB > 100) {
            // 1. OUTLINE BORDER -> Render gaya pilihan user (ASCII atau Dot) dengan/tanpa glow
            tCtx.fillStyle = "#05050a";
            tCtx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);

            tCtx.fillStyle = "#ffffff";
            if (glowStyle === "on") {
              if (renderStyle === "dots") {
                tCtx.shadowColor = "#ffffff";
                tCtx.shadowBlur = 12;
              } else {
                tCtx.shadowColor = "rgba(255, 255, 255, 0.95)";
                tCtx.shadowBlur = 10;
              }
            } else {
              tCtx.shadowColor = "transparent";
              tCtx.shadowBlur = 0;
            }

            if (renderStyle === "dots") {
              tCtx.beginPath();
              tCtx.arc(cxPos, cyPos, maxRadius, 0, Math.PI * 2);
              tCtx.fill();
            } else {
              tCtx.font = `700 ${fontSizeGrid}px "JetBrains Mono", monospace`;
              tCtx.textAlign = "center";
              tCtx.textBaseline = "middle";
              tCtx.fillText("@", cxPos, cyPos);
            }
          } else {
            // 2. INTERIOR HOLLOW BODY (Warna pilihan: Hitam Pekat vs Abu-abu Gelap)
            tCtx.shadowColor = "transparent";
            tCtx.shadowBlur = 0;

            if (fillStyle === "black") {
              // Hitam Pekat (#05050a)
              tCtx.fillStyle = "#05050a";
              tCtx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
            } else {
              // Abu-abu Gelap (#12121c - Default Dark Charcoal)
              tCtx.fillStyle = "#12121c";
              tCtx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);

              if (renderStyle === "dots") {
                tCtx.fillStyle = "#222232";
                tCtx.beginPath();
                tCtx.arc(cxPos, cyPos, maxRadius * 0.45, 0, Math.PI * 2);
                tCtx.fill();
              } else {
                tCtx.font = `700 ${fontSizeGrid}px "JetBrains Mono", monospace`;
                tCtx.textAlign = "center";
                tCtx.textBaseline = "middle";
                tCtx.fillStyle = "#28283a";
                tCtx.fillText(".", cxPos, cyPos);
              }
            }
          }
        }
      }
    }

    map[text] = tCanvas;
  });

  return map;
}

window.buildLyricTextures = buildLyricTextures;
