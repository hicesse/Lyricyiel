# Panduan Hosting & Deployment: ASCII Music Player & Visualizer

Dokumen ini berisi panduan lengkap untuk melakukan *deployment* dan *hosting* aplikasi **ASCII Music Player & Synced Lyrics Visualizer**, termasuk penjelasan privasi media pengguna serta pilihan platform hosting **100% Gratis dan Murah**.

---

## 🔒 1. Privasi Upload Media Pengguna (Apakah File Tersimpan di Server?)

### **Jawabannya: TIDAK. File upload dari user SAMA SEKALI TIDAK TERSIMPAN di server.**

### **Penjelasan Teknis:**
1. **100% Client-Side Processing**:
   Ketika pengguna memilih file video atau foto melalui form upload, JavaScript mengolah file tersebut secara lokal di dalam browser pengguna menggunakan API `URL.createObjectURL(file)`.
2. **Tidak Ada File Transfer via Network**:
   Aplikasi **tidak pernah mengirimkan data file video/foto** ke server backend Express (`server.js`) melalui HTTP POST, `fetch`, `FormData`, maupun `multipart/form-data`.
3. **Offscreen Canvas Pre-Rendering**:
   Proses ekstraksi piksel dan konversi ke karakter/dot ASCII berjalan penuh di dalam RAM peramban pengguna (*Client-Side Offscreen Canvas*).
4. **Pembersihan Memori Otomatis**:
   Begitu pre-rendering selesai atau tab browser ditutup, memori sementara `URL.revokeObjectURL()` otomatis dihapus oleh sistem operasi & browser.

### **Keuntungan Besar bagi Pemilik Website (Hosting):**
- 🟢 **Bebas Biaya Storage**: Anda tidak perlu menyewa disk space berukuran Gigabyte/Terabyte.
- 🟢 **Bebas Biaya Bandwidth Upload**: Server Anda tidak akan terbeban oleh kuota data upload video user.
- 🟢 **Privasi Pengguna Terjamin**: Video/foto pribadi milik pengguna 100% aman dan tidak pernah keluar dari perangkat mereka.

---

## 🌐 2. Profil Traffic & Estimasi Pemakaian Kuota

Aplikasi ini bersifat **portofolio pribadi** dengan estimasi traffic sangat ringan:

| Parameter | Estimasi |
| :--- | :--- |
| **Visitor Harian** | 1 – 20 user/hari |
| **Beban Server Per Kunjungan** | ~1 request HTML + 4 JS + 1 CSS + 1 audio stream + 1 lyrics JSON = **~8 request** |
| **Ukuran Transfer Per Kunjungan** | ~50 KB (frontend) + 1–3 MB (audio stream) = **~3 MB** |
| **Bandwidth Harian Maksimal** | 20 user × 3 MB = **~60 MB/hari** |
| **Bandwidth Bulanan Maksimal** | ~60 MB × 30 = **~1.8 GB/bulan** |
| **Upload Video/Foto ke Server** | **0 Bytes** (100% client-side, tidak pernah menyentuh server) |

> [!TIP]
> Dengan pemakaian hanya **~1.8 GB/bulan**, semua platform hosting gratis di bawah ini memberikan kuota **100x lipat lebih besar** dari kebutuhan Anda. Anda **tidak akan pernah melampaui batas gratis** bahkan jika traffic naik 10 kali lipat.

---

## 🏆 3. Rekomendasi Platform Hosting untuk Portofolio

| Platform | Biaya | Vokasi/Verifikasi | Cold Start? | Rekomendasi |
| :--- | :--- | :--- | :--- | :--- |
| **Vercel** | **$0 (Gratis)** | 🟢 **TANPA Kartu Kredit** | 🟢 Tidak (Respon Instan) | **🥇 Rekomendasi #1 (Paling Mudah & Bebas CC)** |
| **Render.com** | **$0 (Gratis)** | 🔴 Wajib Kartu Kredit (Untuk Akun Baru) | Ya (~30 detik jika idle) | **🥈 Rekomendasi #2** |
| **Koyeb** | **$0 (Gratis)** | 🟢 TANPA Kartu Kredit | Tidak | Alternatif Node.js gratis |

### Mana yang Paling Cocok?

- 🥇 **Vercel** — **Sangat direkomendasikan**. 100% Gratis, **tanpa kartu kredit**, dan tanpa *cold start*. File `vercel.json` sudah tersedia di proyek ini sehingga proses deploy selesai hanya dalam 30 detik. Lihat panduan lengkap di [panduan_deploy_vercel.md](file:///d:/kodonf/github/Lyric/documentation/panduan_deploy_vercel.md).

- 🥈 **Render.com** — Menjalankan server Node.js langsung, namun kebijakan akun baru saat ini mewajibkan verifikasi kartu kredit (Visa/Mastercard) meskipun di tier gratis.

---

## ⚡ 4. Panduan Deploy ke Vercel (Rekomendasi #1 — 100% Gratis & TANPA KARTU KREDIT)

Vercel menggunakan arsitektur *Serverless Functions* sehingga **bebas kartu kredit** dan **tanpa cold start** (response selalu instan).

### **Langkah 1: File `vercel.json` Sudah Tersedia**
File [vercel.json](file:///d:/kodonf/github/Lyric/vercel.json) sudah siap di root proyek Anda:

```json
{
  "version": 2,
  "builds": [
    { "src": "server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "server.js" }
  ]
}
```

### **Langkah 2: Deploy Cepat dalam 30 Detik**
1. Push kode ke GitHub (`git push origin main`).
2. Buka [Vercel.com](https://vercel.com) dan login memilih **"Continue with GitHub"** (Tanpa kartu kredit).
3. Klik **"Add New Project"** → Import repositori **`Lyric`**.
4. Klik **"Deploy"**.

Dalam 30 detik, website Anda live di: `https://lyric-ascii-player.vercel.app` ✅  
*Panduan detail di [panduan_deploy_vercel.md](file:///d:/kodonf/github/Lyric/documentation/panduan_deploy_vercel.md)*.

---

## 🚀 5. Panduan Deploy ke Render.com (Rekomendasi #2)

Render.com menjalankan server Node.js secara langsung (`node server.js`) persis seperti di komputer lokal Anda. Panduan langkah-demi-langkah didokumentasikan di [panduan_deploy_render.md](file:///d:/kodonf/github/Lyric/documentation/panduan_deploy_render.md).

### **Ringkasan Langkah Deploy di Render:**
1. **Push kode ke GitHub**:
   ```bash
   git add .
   git commit -m "feat: panduan deployment render"
   git push origin main
   ```
2. Buka [Render.com](https://render.com) dan masuk dengan akun GitHub Anda.
3. Klik **"New +"** → Pilih **"Web Service"** (⚠️ *Jangan pilih Blueprint*).
4. Hubungkan repositori GitHub Anda (`Lyric`).
5. Isi konfigurasi:
   - **Name**: `ascii-music-player`
   - **Runtime / Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: **Free** ($0/bulan)
6. Klik **"Create Web Service"**.
7. Tunggu 1–2 menit, lalu website Anda live di:
   `https://ascii-music-player.onrender.com` ✅

> [!NOTE]
> **Tentang Cold Start:** Pada tier gratis, jika tidak ada pengunjung selama ~15 menit, server akan *sleep*. Pengunjung pertama setelah idle akan menunggu ~30 detik. Untuk portofolio pribadi, ini sangat wajar. Detail selengkapnya di [panduan_deploy_render.md](file:///d:/kodonf/github/Lyric/documentation/panduan_deploy_render.md).

---

## 📋 6. Checklist Sebelum Hosting (Production Readiness)

- [x] **File Audio Sampel**: Pastikan file audio (MP3/WAV) ada di `public/assets/audio/`.
- [x] **File Lirik JSON**: Pastikan file lirik tersinkronisasi ada di `public/assets/lyrics/`.
- [x] **HTTP Range 206 Streaming**: `server.js` sudah mendukung partial content agar audio berjalan lancar di iOS/Android.
- [x] **Client-Side Processing**: Upload user 100% diproses di browser, tidak membebani server.
- [x] **File `vercel.json`**: Sudah dibuat untuk deployment instan di Vercel.

---

## 📌 Kesimpulan

Untuk portofolio dengan traffic **satuan hingga belasan user per hari**, baik **Render.com** maupun **Vercel** adalah pilihan yang **100% gratis dan lebih dari cukup**. Estimasi pemakaian bandwidth hanya ~1.8 GB/bulan, jauh di bawah kuota gratis kedua platform (100 GB+). Anda tidak perlu khawatir soal biaya hosting sama sekali.

