/**
 * Module 2 (Render Engine): Video & Photo Pre-Renderer Engine (Non-Realtime Client-side)
 */

/**
 * Fast Offscreen Video Pre-renderer (Muted Video)
 */
async function preRenderVideoMuted(videoFile, targetFps = 15, width = 80, height = 45, onProgress) {
  if (videoFile.size > 20 * 1024 * 1024) {
    throw new Error("Ukuran video melebihi batas maksimal 20MB!");
  }

  const video = document.createElement("video");
  video.style.position = "fixed";
  video.style.top = "-9999px";
  video.style.left = "-9999px";
  video.style.width = "1px";
  video.style.height = "1px";
  video.style.opacity = "0";
  video.style.pointerEvents = "none";
  video.muted = true; // Wajib: Menghindari audio decoding overhead saat extraction
  video.playsInline = true;
  video.preload = "auto";
  const objectUrl = URL.createObjectURL(videoFile);
  video.src = objectUrl;

  // Lampirkan ke DOM agar GPU decoder browser mendekode seluruh P/B frame secara penuh (mencegah stale duplicate frames)
  document.body.appendChild(video);

  try {
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = () => reject(new Error("Gagal memuat file video!"));
    });

    // Ambil durasi maksimal 15 detik (jika video < 15 detik, ambil durasi aslinya)
    const duration = Math.min(video.duration || 15, 15);
    const totalFrames = Math.max(1, Math.floor(duration * targetFps));
    const frameInterval = duration / totalFrames;
    const frames = [];

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // Putar video secara terurut (sequential playback) dari 0s untuk merekam setiap frame secara penuh tanpa dropped/stale keyframe
    video.currentTime = 0;
    video.playbackRate = 1.0;
    await video.play().catch(() => {});

    let lastCapturedTime = -1;

    await new Promise((resolve) => {
      function processFrame(now, metadata) {
        const mediaTime = metadata ? metadata.mediaTime : video.currentTime;

        if (video.ended || mediaTime >= duration || frames.length >= totalFrames) {
          video.pause();
          resolve();
          return;
        }

        if (lastCapturedTime === -1 || (mediaTime - lastCapturedTime) >= (frameInterval * 0.9)) {
          lastCapturedTime = mediaTime;
          drawCoverCropToCanvas(video, ctx, width, height);
          const colorFrame = convertCanvasToColorDots(ctx, width, height);
          frames.push(colorFrame);

          if (typeof onProgress === "function") {
            onProgress((frames.length / totalFrames) * 100);
          }
        }

        if ("requestVideoFrameCallback" in video) {
          video.requestVideoFrameCallback(processFrame);
        } else {
          requestAnimationFrame(() => processFrame(null, null));
        }
      }

      if ("requestVideoFrameCallback" in video) {
        video.requestVideoFrameCallback(processFrame);
      } else {
        requestAnimationFrame(() => processFrame(null, null));
      }
    });

    return { frames, duration, type: "video", fps: targetFps, width, height };
  } finally {
    video.pause();
    if (video.parentNode) {
      video.parentNode.removeChild(video);
    }
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Photo Pre-renderer (1 - 5 foto)
 * Pembagian durasi T = 15 / N detik per foto
 */
async function preRenderPhotos(photoFiles, targetFps = 15, width = 80, height = 45, onProgress) {
  const N = photoFiles.length;
  if (N < 1 || N > 5) {
    throw new Error("Jumlah foto harus antara 1 sampai 5 foto!");
  }

  const photoInterval = 15 / N; // Durasi tayang tiap foto (detik)
  const frames = [];

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  for (let i = 0; i < N; i++) {
    const file = photoFiles[i];
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error(`Gagal memuat foto ke-${i + 1}!`));
    });

    drawCoverCropToCanvas(img, ctx, width, height);
    const colorFrame = convertCanvasToColorDots(ctx, width, height);
    frames.push(colorFrame);

    URL.revokeObjectURL(objectUrl);

    if (typeof onProgress === "function") {
      onProgress(((i + 1) / N) * 100);
    }
  }

  return { frames, duration: 15, photoInterval, type: "photo", fps: targetFps, width, height };
}

window.preRenderVideoMuted = preRenderVideoMuted;
window.preRenderPhotos = preRenderPhotos;
