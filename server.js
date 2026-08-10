const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Metadata list lagu sampel
const songDatabase = [
  {
    id: "reff-dropdead",
    title: "Drop Dead",
    artist: "Olivia Rodrigo",
    duration: 38,
    mediaStartTime: 18.0,
    filename: "reff_DropDead-OliviaRodrigo.mp3",
    lyricsFilename: "reff_DropDead-OliviaRodrigo.json"
  }
];

// Endpoint 1: Daftar Lagu
app.get('/api/songs', (req, res) => {
  const songs = songDatabase.map(song => ({
    id: song.id,
    title: song.title,
    artist: song.artist,
    duration: song.duration,
    audioUrl: `/api/audio/${song.id}`,
    lyricsUrl: `/api/lyrics/${song.id}`
  }));
  res.json(songs);
});

// Endpoint 2: Audio Stream dengan Support HTTP Range (206 Partial Content)
app.get('/api/audio/:id', (req, res) => {
  const song = songDatabase.find(s => s.id === req.params.id);
  if (!song) {
    return res.status(404).json({ error: "Lagu tidak ditemukan" });
  }

  const audioPath = path.join(__dirname, 'public', 'assets', 'audio', song.filename);
  if (!fs.existsSync(audioPath)) {
    return res.status(404).json({ error: "File audio tidak ditemukan di server" });
  }

  const stat = fs.statSync(audioPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(audioPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': song.filename.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Range',
      'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges'
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': song.filename.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg',
      'Access-Control-Allow-Origin': '*',
    };
    res.writeHead(200, head);
    fs.createReadStream(audioPath).pipe(res);
  }
});

// Endpoint 3: Lirik JSON Tersinkronisasi
app.get('/api/lyrics/:id', (req, res) => {
  const song = songDatabase.find(s => s.id === req.params.id);
  if (!song) {
    return res.status(404).json({ error: "Lagu tidak ditemukan" });
  }

  const lyricsPath = path.join(__dirname, 'public', 'assets', 'lyrics', song.lyricsFilename);
  if (!fs.existsSync(lyricsPath)) {
    return res.status(404).json({ error: "File lirik tidak ditemukan" });
  }

  try {
    const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf8'));
    res.json(lyricsData);
  } catch (err) {
    res.status(500).json({ error: "Gagal membaca format JSON lirik" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Lilynn — ASCII Music Player Server running at http://localhost:${PORT}`);
});
