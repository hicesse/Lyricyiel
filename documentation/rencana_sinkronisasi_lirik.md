# Spesifikasi Teknis & Desain Rendering Lirik Tersinkronisasi

Dokumen ini merinci penyesuaian arsitektur sistem lagu dan lirik serta spesifikasi desain visual lirik tersinkronisasi pada **ASCII Music Player**.

---

## 📐 1. Penyesuaian Konseptual & Arsitektur Lagu/Lirik

Terdapat koreksi penting pada asumsi alur kerja (*workflow*) lagu dan lirik:

- **Server-Side Data Source**: Lagu dan lirik tersinkronisasi disediakan sepenuhnya dari sisi server (*Server-Side*). Tidak ada fitur unggah lagu baru atau pembuatan sinkronisasi lirik secara dinamis dari sisi pengguna (*Client-Side*).
- **Pemilihan Template**: Pengguna di browser hanya bertindak sebagai konsumen yang memilih template lagu & lirik yang sudah terdaftar di server melalui dropdown.

---

## 🎨 2. Spesifikasi Desain Visual Rendering Lirik

Untuk meningkatkan legibilitas lirik di atas latar belakang matriks karakter/titik yang ramai, lirik akan dirender dengan spesifikasi visual berikut:

### A. Dimensi & Gaya Font
- **Ukuran Font (Font Size)**: Dibuat besar dan mencolok, menempati sekitar **25%** dari tinggi total canvas (misalnya: untuk tinggi canvas 720px, ukuran font sekitar `90px` hingga `100px`).
- **Gaya Font (Style)**: **Hollow / Outline Font** menggunakan font sans-serif tebal (seperti *Outfit* atau *sans-serif* tebal).

### B. Warna & Masking Kontras (Hollow Masking)
- **Stroke/Outline**: Berwarna **Putih (`#ffffff`)** menggunakan `ctx.strokeStyle`.
- **Fill/Interior**: Berwarna **Hitam (`#000000`)** menggunakan `ctx.fillStyle` dan `ctx.fillText()`.
- **Logika Masking**: Bagian dalam huruf yang berongga (*hollow*) dicat dengan warna hitam pekat untuk **menutup/memblokir render titik atau karakter latar belakang**. Hal ini memastikan teks lirik tetap terbaca dengan jelas (tidak terdistraksi oleh matriks warna-warni di belakangnya).

---

## 💻 3. Implementasi Kode pada Canvas 2D Loop

Berikut adalah draf implementasi fungsi rendering lirik baru yang disisipkan ke dalam *render loop* utama:

```javascript
/**
 * Render lirik terintegrasi dengan gaya Hollow Putih dan Fill Hitam (Legibilitas Tinggi)
 */
function drawLyricOverlayHollow(ctx, text, canvasWidth, canvasHeight) {
  ctx.save();
  
  // Set ukuran font sekitar 25% dari tinggi canvas
  const fontSize = Math.floor(canvasHeight * 0.14); // ~100px untuk height 720px
  ctx.font = `800 ${fontSize}px "Outfit", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const xPos = canvasWidth / 2;
  const yPos = canvasHeight / 2;

  // 1. Gambar Fill Hitam Pekat untuk memblokir dot/karakter latar belakang di dalam huruf
  ctx.fillStyle = "#000000";
  ctx.shadowColor = "transparent"; // Matikan bayangan untuk fill
  ctx.fillText(text, xPos, yPos);

  // 2. Gambar Stroke/Outline Putih di atas fill hitam
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(3, Math.floor(fontSize * 0.05)); // Outline proporsional (~5px)
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  
  // Tambahkan efek glow putih tipis pada outline agar lebih terbaca
  ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
  ctx.shadowBlur = 10;

  ctx.strokeText(text, xPos, yPos);
  
  ctx.restore();
}
```

---

## 🚀 4. Checklist Penerapan
- [ ] **Pemberitahuan Sistem**: Menghapus rancangan fitur Uploader dan LRC Editor di frontend karena lagu/lirik sepenuhnya template dari server.
- [ ] **Modifikasi Main Render Loop**: Mengganti fungsi `drawLyricOverlay` di `app.js` dengan fungsi `drawLyricOverlayHollow` yang mengimplementasikan stroke putih & fill hitam.
- [ ] **Verifikasi Legibilitas**: Memastikan teks lirik berukuran ~25% tinggi layar terbaca sempurna di atas dot matrix kerapatan tinggi ($240 \times 135$).
