/**
 * Module (Config): Konfigurasi Timeline Media & Pemutar Per Template Lagu
 * File ini digunakan oleh Developer untuk mengatur waktu kapan media (video/foto)
 * masuk (start) dan keluar (end) serta durasi fade-out audio secara independen per template.
 */
window.TEMPLATE_TIMELINE_CONFIG = {
  // Template 1: Drop Dead / Lacy - Olivia Rodrigo
  "reff-dropdead": {
    id: "reff-dropdead",
    mediaStartTime: 18.0,   // Detik ke berapa video/foto mulai muncul (saat reff masuk)
    mediaEndTime: 33.0,     // Detik ke berapa video/foto keluar/menghilang (kembali hitam pekat)
    fadeOutStartTime: 45.0, // Detik ke berapa audio fade-out dimulai
    fadeOutDuration: 2.0    // Durasi fade-out audio
  }
};

/**
 * Helper function untuk mendapatkan konfigurasi timeline lagu aktif
 */
window.getTemplateTimelineConfig = function(songId) {
  if (!songId || !window.TEMPLATE_TIMELINE_CONFIG) {
    return {
      mediaStartTime: 0.0,
      mediaEndTime: 9999.0,
      fadeOutStartTime: 9999.0,
      fadeOutDuration: 2.0
    };
  }

  const config = window.TEMPLATE_TIMELINE_CONFIG[songId];
  if (config) {
    return config;
  }

  // Fallback default jika ID lagu belum terdaftar di config
  return {
    mediaStartTime: 0.0,
    mediaEndTime: 9999.0,
    fadeOutStartTime: 9999.0,
    fadeOutDuration: 2.0
  };
};
