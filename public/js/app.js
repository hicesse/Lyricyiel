/**
 * Main Application Controller & 60 FPS Canvas Render Engine
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const songSelect = document.getElementById("song-select");
  const densitySelect = document.getElementById("density-select");
  const styleSelect = document.getElementById("style-select");
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const videoInput = document.getElementById("video-input");
  const photoInput = document.getElementById("photo-input");
  const videoFileInfo = document.getElementById("video-file-info");
  const photoFileInfo = document.getElementById("photo-file-info");
  const startBtn = document.getElementById("start-btn");

  const canvas = document.getElementById("ascii-canvas");
  const ctx = canvas.getContext("2d");

  const playPauseBtn = document.getElementById("play-pause-btn");
  const playIcon = document.getElementById("play-icon");
  const currentTimeSpan = document.getElementById("current-time");
  const totalDurationSpan = document.getElementById("total-duration");
  const seekSlider = document.getElementById("seek-slider");
  const volumeSlider = document.getElementById("volume-slider");
  const fullscreenBtn = document.getElementById("fullscreen-btn");
  const audioPlayer = document.getElementById("audio-player");

  // Mobile & Fullscreen Floating UI Controls Elements
  const mobileRotateBtn = document.getElementById("mobile-rotate-btn");
  const fullscreenSongTitle = document.getElementById("fullscreen-song-title");
  const fullscreenBottomBar = document.getElementById("fullscreen-bottom-bar");
  const fsPlayBtn = document.getElementById("fs-play-btn");
  const fsTimeDisplay = document.getElementById("fs-time-display");
  const fsSeekSlider = document.getElementById("fs-seek-slider");
  const fsExitBtn = document.getElementById("fs-exit-btn");

  const progressModal = document.getElementById("progress-modal");
  const progressBarFill = document.getElementById("progress-bar-fill");
  const progressPercent = document.getElementById("progress-percent");
  const progressStatus = document.getElementById("progress-status");

  // Character Set ASCII untuk Pemetaan Luminance
  const ASCII_CHARS = " .:-=+*#%@abi8";

  // State Variables
  let availableSongs = [];
  let selectedSong = null;
  let activeTab = "default"; // "default", "video", "photo"
  let preRenderedData = null;
  let lyricSyncManager = null;
  let animationFrameId = null;
  let isPlaying = false;
  let isSeeking = false;
  let audioAnalyser = null;

  // Grid Resolution Default: Ultra 8K Precision (280x157 = 43,960 Grid Points) untuk Presisi Layar Maksimal
  let GRID_WIDTH = 280;
  let GRID_HEIGHT = 157;

  function getGridResolution() {
    if (!densitySelect) return { width: 280, height: 157 };
    const [w, h] = densitySelect.value.split("x").map(Number);
    return { width: w || 280, height: h || 157 };
  }

  // 1. Inisialisasi: Fetch daftar lagu dari Server REST API
  async function loadSongDatabase() {
    try {
      const res = await fetch("/api/songs");
      if (!res.ok) throw new Error("Gagal mengambil data lagu");
      availableSongs = await res.json();

      songSelect.innerHTML = "";
      availableSongs.forEach((song) => {
        const opt = document.createElement("option");
        opt.value = song.id;
        opt.textContent = `${song.title} - ${song.artist} (${song.duration}s)`;
        songSelect.appendChild(opt);
      });

      if (availableSongs.length > 0) {
        selectedSong = availableSongs[0];
        if (fullscreenSongTitle) {
          fullscreenSongTitle.textContent = `${selectedSong.title} - ${selectedSong.artist}`;
        }
      }
    } catch (err) {
      console.error("Error loading songs:", err);
      songSelect.innerHTML = `<option value="">Error memuat lagu server</option>`;
    }
  }

  loadSongDatabase();

  // 2. Tab Navigation Handling
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeTab = btn.dataset.tab;

      tabContents.forEach((tc) => tc.classList.add("hidden"));
      if (activeTab === "video") {
        document.getElementById("tab-content-video").classList.remove("hidden");
      } else if (activeTab === "photo") {
        document.getElementById("tab-content-photo").classList.remove("hidden");
      }
    });
  });

  // File Upload Handlers & Validation
  videoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert("Ukuran video melebihi 20MB! Silakan pilih file yang lebih kecil.");
        videoInput.value = "";
        videoFileInfo.textContent = "";
        return;
      }
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      videoFileInfo.textContent = `✓ ${file.name} (${sizeMB} MB) - Siap dipotong 15s`;
    }
  });

  photoInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    if (files.length < 1 || files.length > 5) {
      alert("Silakan pilih 1 hingga 5 foto!");
      photoInput.value = "";
      photoFileInfo.textContent = "";
      return;
    }
    const interval = (15 / files.length).toFixed(1);
    photoFileInfo.textContent = `✓ ${files.length} Foto dipilih (${interval}s per foto)`;
  });

  // Song Select Change
  songSelect.addEventListener("change", (e) => {
    selectedSong = availableSongs.find((s) => s.id === e.target.value);
    if (selectedSong && fullscreenSongTitle) {
      fullscreenSongTitle.textContent = `${selectedSong.title} - ${selectedSong.artist}`;
    }
  });

  // Helper UI Progress Modal
  function showProgressModal(statusMsg) {
    progressStatus.textContent = statusMsg || "Memproses konversi ASCII...";
    progressBarFill.style.width = "0%";
    progressPercent.textContent = "0%";
    progressModal.classList.remove("hidden");
  }

  function updateProgressUI(percent) {
    const p = Math.min(100, Math.floor(percent));
    progressBarFill.style.width = `${p}%`;
    progressPercent.textContent = `${p}%`;
  }

  function hideProgressModal() {
    progressModal.classList.add("hidden");
  }

  // Default Preset: Tanpa media latar belakang (hanya merender lirik ASCII/Dot & spektrum audio di canvas hitam)
  function generateDefaultPresetFrames(durationSeconds = 20, fps = 15, width = GRID_WIDTH, height = GRID_HEIGHT) {
    return { frames: [], duration: durationSeconds, type: "default", fps, width, height };
  }

  let lyricTextureMap = {};

  // 3. Action Utama: START RENDER & PLAY
  startBtn.addEventListener("click", async () => {
    if (!selectedSong) {
      alert("Silakan pilih lagu terlebih dahulu!");
      return;
    }

    try {
      const { width: targetW, height: targetH } = getGridResolution();
      GRID_WIDTH = targetW;
      GRID_HEIGHT = targetH;

      // Step A: Unlock Web Audio API via User Gesture
      const { analyserNode } = await window.initAudioEngine(audioPlayer);
      audioAnalyser = analyserNode;

      // Step B: Fetch Lirik JSON & Pre-render Tekstur Lirik Unik Sesuai Render Style & Custom Kustomisasi
      showProgressModal("Memuat & Pre-rendering Lirik Tersinkronisasi...");
      const lyricRes = await fetch(selectedSong.lyricsUrl);
      const lyricsJSON = await lyricRes.json();
      lyricSyncManager = new window.LyricSyncManager(lyricsJSON);

      const renderStyle = styleSelect ? styleSelect.value : "ascii";
      const lyricFillSelect = document.getElementById("lyric-fill-select");
      const lyricGlowSelect = document.getElementById("lyric-glow-select");
      const lyricFillStyle = lyricFillSelect ? lyricFillSelect.value : "dark-gray";
      const lyricGlowStyle = lyricGlowSelect ? lyricGlowSelect.value : "on";

      lyricTextureMap = window.buildLyricTextures(
        lyricsJSON,
        renderStyle,
        GRID_WIDTH,
        GRID_HEIGHT,
        lyricFillStyle,
        lyricGlowStyle,
        canvas
      );

      // Step C: Pre-render Media Latar Belakang (jika ada)
      progressStatus.textContent = `Menjalankan Pre-Rendering Engine Media (${GRID_WIDTH}x${GRID_HEIGHT} Grid)...`;

      // Bersihkan RAM canvas lama sebelum membuat pre-rendering baru
      if (preRenderedData && preRenderedData.frameCanvases) {
        preRenderedData.frameCanvases.length = 0;
        preRenderedData.frameCanvases = null;
      }

      if (activeTab === "video") {
        const file = videoInput.files[0];
        if (!file) throw new Error("Silakan pilih file video terlebih dahulu!");
        preRenderedData = await window.preRenderVideoMuted(
          file, 15, GRID_WIDTH, GRID_HEIGHT, (pct) => updateProgressUI(pct * 0.6)
        );
      } else if (activeTab === "photo") {
        const files = Array.from(photoInput.files);
        if (files.length === 0) throw new Error("Silakan pilih 1 s/d 5 foto terlebih dahulu!");
        preRenderedData = await window.preRenderPhotos(
          files, 15, GRID_WIDTH, GRID_HEIGHT, (pct) => updateProgressUI(pct * 0.6)
        );
      } else {
        // Default Preset Visualizer
        updateProgressUI(30);
        preRenderedData = generateDefaultPresetFrames(selectedSong.duration || 20, 15, GRID_WIDTH, GRID_HEIGHT);
        updateProgressUI(60);
      }

      // Step D: Build GPU Frame Canvases Cache untuk Media
      progressStatus.textContent = "Membangun GPU Frame Cache (Zero-Lag 60 FPS)...";
      preRenderedData.frameCanvases = await window.buildFrameCanvases(
        preRenderedData, renderStyle, GRID_WIDTH, GRID_HEIGHT, canvas, (pct) => updateProgressUI(60 + pct * 0.4)
      );

      // Waktu tunggu 0.3 detik tambahan setelah render selesai
      progressStatus.textContent = "Pre-rendering selesai! Mempersiapkan player...";
      updateProgressUI(100);
      await new Promise((resolve) => setTimeout(resolve, 300));

      hideProgressModal();

      // Step E: Set Audio Source & Siapkan Pemutar (TANPA AUTOPLAY)
      audioPlayer.src = selectedSong.audioUrl;
      audioPlayer.volume = parseFloat(volumeSlider.value);
      audioPlayer.currentTime = 0;
      audioPlayer.load();

      isPlaying = false;
      playIcon.textContent = "▶";
      if (fsPlayBtn) fsPlayBtn.textContent = "▶";
      playPauseBtn.disabled = false;
      seekSlider.disabled = false;

      startRenderLoop();
    } catch (err) {
      hideProgressModal();
      alert(`Gagal memproses visualizer: ${err.message}`);
      console.error(err);
    }
  });

  // 4. Main 60 FPS Render Loop (requestAnimationFrame)
  function startRenderLoop() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    const frequencyData = new Uint8Array(audioAnalyser ? audioAnalyser.frequencyBinCount : 0);

    function renderFrame() {
      animationFrameId = requestAnimationFrame(renderFrame);

      const currentTime = audioPlayer.currentTime;
      const duration = audioPlayer.duration || selectedSong.duration || 20;

      // Update UI Slider & Display
      if (!isSeeking) {
        seekSlider.value = (currentTime / duration) * 100;
        if (fsSeekSlider) fsSeekSlider.value = (currentTime / duration) * 100;

        const formattedCurr = formatTime(currentTime);
        const formattedTotal = formatTime(duration);

        currentTimeSpan.textContent = formattedCurr;
        totalDurationSpan.textContent = formattedTotal;

        if (fsTimeDisplay) {
          fsTimeDisplay.textContent = `${formattedCurr} / ${formattedTotal}`;
        }
      }

      // 1. Clear Canvas Background (Pure Black #05050a)
      ctx.fillStyle = "#05050a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Render Media Background (jika ada & di dalam waktu tayang sesuai template config)
      let shouldDrawBackground = true;
      let targetFrameTime = currentTime;

      const songId = selectedSong ? selectedSong.id : null;
      const timelineConfig = window.getTemplateTimelineConfig ? window.getTemplateTimelineConfig(songId) : {};
      const mediaStart = (timelineConfig.mediaStartTime !== undefined) ? timelineConfig.mediaStartTime : 0.0;
      const mediaEnd = (timelineConfig.mediaEndTime !== undefined) ? timelineConfig.mediaEndTime : 9999.0;
      const fadeStart = (timelineConfig.fadeOutStartTime !== undefined) ? timelineConfig.fadeOutStartTime : mediaEnd;
      const fadeDur = timelineConfig.fadeOutDuration || 5.0;

      if (currentTime < mediaStart || currentTime >= mediaEnd) {
        shouldDrawBackground = false;
      } else {
        targetFrameTime = currentTime - mediaStart;
      }

      if (shouldDrawBackground && preRenderedData && preRenderedData.frameCanvases && preRenderedData.frameCanvases.length > 0) {
        let frameIdx = 0;
        const totalCanvases = preRenderedData.frameCanvases.length;

        if (preRenderedData.type === "photo") {
          const totalPhotoDur = preRenderedData.duration || 15;
          const loopedTime = targetFrameTime % totalPhotoDur;
          frameIdx = Math.min(
            Math.floor(loopedTime / (preRenderedData.photoInterval || 3)),
            totalCanvases - 1
          );
        } else if (preRenderedData.type === "default") {
          shouldDrawBackground = false; // Default preset: kanvas hitam bersih
        } else {
          // Video: Seamless Modulo Loop tanpa freeze jika targetFrameTime melebihi durasi video pre-rendered (misal >15s)
          const videoDur = preRenderedData.duration || (totalCanvases / (preRenderedData.fps || 15));
          const loopedTime = videoDur > 0 ? (targetFrameTime % videoDur) : 0;
          frameIdx = Math.floor(loopedTime * (preRenderedData.fps || 15)) % totalCanvases;
        }

        if (shouldDrawBackground && preRenderedData.frameCanvases[frameIdx]) {
          ctx.drawImage(preRenderedData.frameCanvases[frameIdx], 0, 0);
        }
      }

      // 3. Render Pre-rendered Lyric Texture (Instant Blitting 0.01ms)
      if (lyricSyncManager) {
        const activeText = lyricSyncManager.getActiveLyric(currentTime);
        if (activeText && lyricTextureMap[activeText]) {
          ctx.drawImage(lyricTextureMap[activeText], 0, 0);
        }
      }

      // 4. Software Audio Fade-out sesuai timeline config (misal detik 33.0 s/d 38.0)
      if (currentTime >= fadeStart && selectedSong) {
        const baseVolume = parseFloat(volumeSlider.value);
        const fadeFactor = Math.max(0, (fadeStart + fadeDur - currentTime) / fadeDur);
        audioPlayer.volume = baseVolume * fadeFactor;
      } else {
        audioPlayer.volume = parseFloat(volumeSlider.value);
      }

      // 5. Render Spektrum Equalizer ASCII Vertikal (Naik Turun) Minimalis dengan Karakter "░▒▓█"
      if (audioAnalyser) {
        audioAnalyser.getByteFrequencyData(frequencyData);
        if (window.drawVerticalASCIISpectrum) {
          window.drawVerticalASCIISpectrum(ctx, frequencyData, canvas);
        }
      }
    }

    renderFrame();
  }

  // Drawing Helper: Render Matriks Karakter ASCII (" .:-=+*#%@") Full Warna Akurat & Gradien Kaya
  function drawColorASCIIMatrix(ctx, colorData, width = GRID_WIDTH, height = GRID_HEIGHT) {
    if (!colorData) return;

    const cellWidth = canvas.width / width;
    const cellHeight = canvas.height / height;
    const fontSize = Math.floor(Math.min(cellWidth, cellHeight) * 1.3);

    ctx.font = `700 ${fontSize}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let colorIdx = 0;
    for (let y = 0; y < height; y++) {
      const yPos = y * cellHeight + cellHeight / 2;
      
      // Faktor gradien warna vertikal lembut (pencahayaan alami)
      const verticalGrad = 0.94 + (y / height) * 0.12;

      for (let x = 0; x < width; x++) {
        const xPos = x * cellWidth + cellWidth / 2;

        const r = colorData[colorIdx++];
        const g = colorData[colorIdx++];
        const b = colorData[colorIdx++];

        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        const charIdx = Math.floor((brightness / 255) * (ASCII_CHARS.length - 1));
        const char = ASCII_CHARS[charIdx];

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

  // Drawing Helper: Render Matriks Circle Dot Full Warna & Gradien Radial Akurat (LED/Shader Matrix)
  function drawColorDotMatrix(ctx, colorData, width = GRID_WIDTH, height = GRID_HEIGHT) {
    if (!colorData) return;

    const cellWidth = canvas.width / width;
    const cellHeight = canvas.height / height;
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

  // Drawing Helper: Render Overlay Lirik Teks di Bagian Bawah dengan Gaya Hollow Matrix (ASCII atau Dot) - HD Sampling
  function drawLyricOverlay(ctx, text) {
    if (!text) return;
    ctx.save();

    const renderStyle = styleSelect ? styleSelect.value : "ascii";
    const { width, height } = getGridResolution(); // Resolusi grid yang dipilih user (misal 240x135)

    // 1. Buat canvas mask HD pada resolusi penuh canvas (1280x720) agar rendering font 100% tajam & tidak hancur
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const mCtx = maskCanvas.getContext("2d");
    mCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Font size proporsional 16% dari tinggi canvas (~115px)
    let fontSizeHD = Math.floor(canvas.height * 0.16);
    mCtx.font = `900 ${fontSizeHD}px "Outfit", sans-serif`;

    // Autoscale font size jika teks melebihi 90% lebar canvas
    const maxTextW = canvas.width * 0.90;
    const measuredW = mCtx.measureText(text).width;
    if (measuredW > maxTextW) {
      fontSizeHD = Math.floor(fontSizeHD * (maxTextW / measuredW));
      mCtx.font = `900 ${fontSizeHD}px "Outfit", sans-serif`;
    }

    mCtx.textAlign = "center";
    mCtx.textBaseline = "middle";

    // Posisi lirik di area 30% tinggi layar dari bawah
    const bottomGapHD = Math.floor(canvas.height * 0.22);
    const yPosHD = canvas.height - bottomGapHD - (fontSizeHD / 2);
    const xPosHD = canvas.width / 2;

    // Stroke putih (Outline HD)
    mCtx.strokeStyle = "#ffffff";
    mCtx.lineWidth = Math.max(4, Math.floor(fontSizeHD * 0.08)); // Outline tebal proporsional
    mCtx.lineJoin = "round";
    mCtx.miterLimit = 2;
    mCtx.strokeText(text, xPosHD, yPosHD);

    // Fill hitam pekat (Interior Masking HD)
    mCtx.fillStyle = "#000001";
    mCtx.fillText(text, xPosHD, yPosHD);

    // Dapatkan data pixel HD mask
    const maskData = mCtx.getImageData(0, 0, canvas.width, canvas.height).data;

    // 2. Petakan sel grid pengguna (misal 240x135) ke mask HD (1280x720)
    const cellWidth = canvas.width / width;
    const cellHeight = canvas.height / height;
    const maxRadius = Math.min(cellWidth, cellHeight) * 0.44;
    const fontSize = Math.floor(Math.min(cellWidth, cellHeight) * 1.3);

    const cW = canvas.width;

    for (let y = 0; y < height; y++) {
      const cyPos = y * cellHeight + cellHeight / 2;
      const sampleY = Math.floor(cyPos);

      for (let x = 0; x < width; x++) {
        const cxPos = x * cellWidth + cellWidth / 2;
        const sampleX = Math.floor(cxPos);

        const pixelIdx = (sampleY * cW + sampleX) * 4;
        const maskA = maskData[pixelIdx + 3]; // Alpha channel

        if (maskA > 30) {
          const maskR = maskData[pixelIdx];
          const maskG = maskData[pixelIdx + 1];
          const maskB = maskData[pixelIdx + 2];

          // Hapus background asli pada sel ini agar menjadi hitam pekat (masking)
          ctx.fillStyle = "#05050a";
          ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);

          if (maskR > 100 && maskG > 100 && maskB > 100) {
            // Outline -> Render titik/karakter berwarna putih tegas sesuai kerapatan grid user
            ctx.fillStyle = "#ffffff";
            if (renderStyle === "dots") {
              ctx.beginPath();
              ctx.arc(cxPos, cyPos, maxRadius, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.font = `700 ${fontSize}px "JetBrains Mono", monospace`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText("@", cxPos, cyPos);
            }
          } else {
            // Interior -> Biarkan kosong/hitam pekat (hollow)
          }
        }
      }
    }
    ctx.restore();
  }

  // Playback Control Handlers (Main & Floating Controls)
  function togglePlayPause() {
    if (!audioPlayer.src) return;

    if (isPlaying) {
      audioPlayer.pause();
      isPlaying = false;
      playIcon.textContent = "▶";
      if (fsPlayBtn) fsPlayBtn.textContent = "▶";
    } else {
      audioPlayer.play();
      isPlaying = true;
      playIcon.textContent = "⏸";
      if (fsPlayBtn) fsPlayBtn.textContent = "⏸";
    }
  }

  playPauseBtn.addEventListener("click", togglePlayPause);
  if (fsPlayBtn) fsPlayBtn.addEventListener("click", togglePlayPause);

  audioPlayer.addEventListener("ended", () => {
    isPlaying = false;
    playIcon.textContent = "▶";
    if (fsPlayBtn) fsPlayBtn.textContent = "▶";
  });

  // Seek Listeners
  function handleSeekInput(e) {
    const targetPercent = parseFloat(e.target.value);
    const duration = audioPlayer.duration || (selectedSong ? selectedSong.duration : 20);
    const targetTime = (targetPercent / 100) * duration;

    const formattedCurr = formatTime(targetTime);
    const formattedTotal = formatTime(duration);

    currentTimeSpan.textContent = formattedCurr;
    if (fsTimeDisplay) fsTimeDisplay.textContent = `${formattedCurr} / ${formattedTotal}`;

    seekSlider.value = targetPercent;
    if (fsSeekSlider) fsSeekSlider.value = targetPercent;
  }

  function handleSeekChange(e) {
    const targetPercent = parseFloat(e.target.value);
    const duration = audioPlayer.duration || (selectedSong ? selectedSong.duration : 20);
    audioPlayer.currentTime = (targetPercent / 100) * duration;
    isSeeking = false;
  }

  seekSlider.addEventListener("mousedown", () => { isSeeking = true; });
  seekSlider.addEventListener("touchstart", () => { isSeeking = true; });
  seekSlider.addEventListener("input", handleSeekInput);
  seekSlider.addEventListener("change", handleSeekChange);

  if (fsSeekSlider) {
    fsSeekSlider.addEventListener("mousedown", () => { isSeeking = true; });
    fsSeekSlider.addEventListener("touchstart", () => { isSeeking = true; });
    fsSeekSlider.addEventListener("input", handleSeekInput);
    fsSeekSlider.addEventListener("change", handleSeekChange);
  }

  volumeSlider.addEventListener("input", (e) => {
    audioPlayer.volume = parseFloat(e.target.value);
  });

  // Fullscreen Landscape Toggle Engine
  async function enterFullscreenLandscape() {
    const container = document.getElementById("visualizer-container");
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          await container.webkitRequestFullscreen();
        }
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock("landscape").catch(() => { });
        }
      }
    } catch (err) {
      console.warn("Fullscreen Landscape Request:", err);
    }
  }

  async function exitFullscreenLandscape() {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn("Exit Fullscreen:", err);
    }
  }

  fullscreenBtn.addEventListener("click", () => {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      exitFullscreenLandscape();
    } else {
      enterFullscreenLandscape();
    }
  });

  if (mobileRotateBtn) {
    mobileRotateBtn.addEventListener("click", enterFullscreenLandscape);
  }

  if (fsExitBtn) {
    fsExitBtn.addEventListener("click", exitFullscreenLandscape);
  }

  // Mobile Orientation Validation Engine
  const orientationOverlay = document.getElementById("orientation-overlay");
  const overlayRotateBtn = document.getElementById("overlay-rotate-btn");

  function checkOrientationGuard() {
    if (!orientationOverlay) return;
    const isMobileDevice = window.innerWidth <= 900 || ('ontouchstart' in window && window.innerWidth < 1024);
    const isPortraitMode = window.innerHeight > window.innerWidth;

    if (isMobileDevice && isPortraitMode) {
      orientationOverlay.classList.remove("hidden");
      document.body.classList.add("orientation-locked");
    } else {
      orientationOverlay.classList.add("hidden");
      document.body.classList.remove("orientation-locked");
    }
  }

  checkOrientationGuard();
  window.addEventListener("resize", checkOrientationGuard);
  window.addEventListener("orientationchange", checkOrientationGuard);

  if (overlayRotateBtn) {
    overlayRotateBtn.addEventListener("click", enterFullscreenLandscape);
  }

  // Listener Perubahan Mode Fullscreen untuk Toggle Bar Melayang (Floating Controls)
  function handleFullscreenChange() {
    const isFS = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    if (fullscreenBottomBar) {
      if (isFS) {
        fullscreenBottomBar.classList.remove("hidden");
      } else {
        fullscreenBottomBar.classList.add("hidden");
      }
    }
  }

  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

  // Utility Time Formatter
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  // ==========================================
  // Idle State Engine: Auto-hide UI Controls Saat Inaktif
  // ==========================================
  const visualizerContainer = document.getElementById("visualizer-container");
  if (window.initIdleStateEngine) {
    const { resetIdleTimer } = window.initIdleStateEngine(
      () => isPlaying,
      visualizerContainer,
      3000
    );

    audioPlayer.addEventListener("play", resetIdleTimer);
    audioPlayer.addEventListener("pause", () => {
      if (visualizerContainer) visualizerContainer.classList.remove("idle-active");
    });
  }
});
