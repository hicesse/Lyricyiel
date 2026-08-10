# ⚡ Panduan Deploy Aplikasi ke Vercel (100% Gratis & TANPA KARTU KREDIT)

Dokumen ini berisi panduan langkah-demi-langkah (*step-by-step*) lengkap untuk me-hosting aplikasi **ASCII Music Player & Synced Lyrics Visualizer** ke platform **[Vercel.com](https://vercel.com)** secara **100% Gratis, Tanpa Kartu Kredit/Visa**, dan **Bebas Delay (Tanpa Cold Start)**.

---

## 🌟 Mengapa Vercel Adalah Pilihan Terbaik?

| Fitur | Vercel | Render.com |
| :--- | :--- | :--- |
| **Kartu Kredit / Visa** | 🟢 **100% TIDAK PERLU** | 🔴 Wajib Kartu Kredit (Untuk Akun Baru) |
| **Cold Start (Delay 30 Detik)** | 🟢 **TIDAK ADA** *(Respon Selalu Instan)* | 🔴 Ada (~30s jika idle 15 menit) |
| **Biaya** | 🟢 **100% Gratis** | 🟢 Gratis |
| **Waktu Deploy** | 🟢 **~30 Detik** | ~2 Menit |
| **Konfigurasi Repositori** | 🟢 Sudah disiapkan ([vercel.json](file:///d:/kodonf/github/Lyric/vercel.json)) | Memerlukan setup Web Service |

---

## 📋 1. Prasyarat Sebelum Deploy

1. **Akun GitHub**: Repositori proyek ini (`Lyric` atau nama repo Anda) sudah di-*push* ke GitHub.
2. **File `vercel.json`**: File [vercel.json](file:///d:/kodonf/github/Lyric/vercel.json) sudah tersedia di root proyek Anda.

---

## 🚀 2. Langkah-Langkah Deploy ke Vercel (Hanya 3 Menit)

### **Langkah 1: Push Kode ke GitHub**
Pastikan semua file terbaru sudah tersimpan di GitHub:
```bash
git add .
git commit -m "feat: persiapkan vercel.json untuk deployment tanpa kartu kredit"
git push origin main
```

### **Langkah 2: Login & Import Proyek di Vercel**
1. Buka [https://vercel.com](https://vercel.com) di peramban Anda.
2. Klik tombol **"Sign Up"** atau **"Log In"**, lalu pilih **"Continue with GitHub"**.  
   *(Anda TIDAK akan dimintai nomor kartu kredit / Visa sama sekali)*.
3. Setelah masuk ke Dashboard Vercel, klik tombol **"Add New..."** → pilih **"Project"**.
4. Di daftar repositori GitHub Anda, cari repositori **`Lyric`** (atau nama repositori proyek Anda).
5. Klik tombol **"Import"** di sebelah nama repositori tersebut.

### **Langkah 3: Jalankan Deployment**
1. Pada halaman **Configure Project**:
   - **Framework Preset**: Biarkan **Other** (Vercel otomatis membaca `vercel.json`).
   - **Root Directory**: `./` (biarkan *default*).
   - **Build and Output Settings**: Biarkan *default*.
   - **Environment Variables**: Tidak perlu diisi.
2. Klik tombol **"Deploy"** (tombol hitam/biru).
3. Tunggu proses instalasi dan build selama **20–40 detik**.
4. **SELESAI!** 🎈  
   Vercel akan menampilkan kembang api dan memberikan URL domain gratis aplikasi Anda, contohnya:  
   `https://lyric-ascii-player.vercel.app`

---

## 🔄 3. Update Otomatis (Auto-Deploy)

Setiap kali Anda melakukan perubahan kode di komputer Anda dan me-push ke GitHub:
```bash
git add .
git commit -m "update lirik & visualizer"
git push origin main
```
Vercel akan secara **otomatis mendeteksi push tersebut** dan me-redeploy aplikasi Anda hanya dalam hitungan detik.

---

## 🔍 4. Troubleshooting & Pertanyaan Umum

### **1. Apakah Vercel benar-benar tidak pernah meminta kartu kredit?**
- **Ya, 100% Gratis tanpa kartu kredit**. Tier Vercel Hobby didesain khusus untuk pengembang web dan proyek portofolio pribadi.

### **2. Apakah perlu mengisi `npm install` atau `node server.js` di Vercel?**
- **TIDAK PERLU SAMA SEKALI!** Vercel secara otomatis membaca file [vercel.json](file:///d:/kodonf/github/Lyric/vercel.json) dan `package.json`. Vercel akan otomatis mendownload dependensi (`express` & `cors`) dan mengonversi `server.js` menjadi *Serverless Function*.

### **3. Mengapa aplikasi berjalan lebih cepat di Vercel dibanding Render?**
- Vercel menggunakan arsitektur *Serverless Edge Functions*. Serverless tidak pernah mengalami *sleep/idle*, sehingga pengunjung web Anda tidak perlu menunggu 30 detik (*cold start*) saat membuka halaman pertama kali.

---

## 🔗 File Terkait

- 📄 [vercel.json](file:///d:/kodonf/github/Lyric/vercel.json) — Konfigurasi serverless build Vercel.
- 📄 [panduan_hosting.md](file:///d:/kodonf/github/Lyric/documentation/panduan_hosting.md) — Rangkuman perbandingan hosting.
- 📄 [server.js](file:///d:/kodonf/github/Lyric/server.js) — Backend Express server.
