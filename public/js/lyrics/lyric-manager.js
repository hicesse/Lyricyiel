/**
 * Module 3 (Lyrics Effect Engine): Fast O(1) Amortized Monotonic Lyric Sync Manager
 */
class LyricSyncManager {
  constructor(lyricsJSON) {
    this.lyrics = lyricsJSON || [];
    this.currentIndex = 0;
  }

  setLyrics(lyricsJSON) {
    this.lyrics = lyricsJSON || [];
    this.currentIndex = 0;
  }

  getActiveLyric(currentTime) {
    if (!this.lyrics || this.lyrics.length === 0) return "";

    // Geser pointer maju jika currentTime audio sudah melewati timestamp lirik berikutnya
    while (
      this.currentIndex < this.lyrics.length - 1 &&
      currentTime >= this.lyrics[this.currentIndex + 1].time
    ) {
      this.currentIndex++;
    }

    // Geser pointer mundur jika user melakukan seeking / rewind audio
    while (
      this.currentIndex > 0 &&
      currentTime < this.lyrics[this.currentIndex].time
    ) {
      this.currentIndex--;
    }

    const currentLyric = this.lyrics[this.currentIndex];
    return (currentTime >= currentLyric.time) ? currentLyric.text : "";
  }
}

window.LyricSyncManager = LyricSyncManager;
