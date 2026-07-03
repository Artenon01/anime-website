/**
 * history.js
 * Fetches watch history for the logged‑in user and renders it.
 */

document.addEventListener('DOMContentLoaded', () => {
  const historyGrid = document.getElementById('history-grid');
  const token = localStorage.getItem('token');
  if (!token) {
    historyGrid.innerHTML = `<div class="no-data"><h2>Harus Masuk</h2><p>Silakan masuk untuk melihat riwayat tontonan Anda.</p><a href="login.html" class="btn btn-primary">Masuk / Daftar</a></div>`;
    return;
  }

  fetch('/api/history', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(res => {
      if (!res.ok) throw new Error('Gagal mengambil riwayat');
      return res.json();
    })
    .then(data => {
      if (data.length === 0) {
        historyGrid.innerHTML = `<div class="no-data"><h2>Belum ada riwayat</h2><p>Start menonton anime untuk menambah riwayat Anda.</p></div>`;
        return;
      }
      const cards = data.map(item => {
        const watchedAt = new Date(item.watched_at).toLocaleString();
        return `
          <div class="history-card">
            <img class="history-card-img" src="${item.thumbnail_url}" alt="${item.anime_judul}" />
            <div class="history-card-content">
              <div class="history-card-title" title="${item.anime_judul}">${item.anime_judul}</div>
              <div class="history-card-episode">Episode ${item.nomor_episode}${item.judul_episode ? `: ${item.judul_episode}` : ''}</div>
              <div class="history-card-time">${watchedAt}</div>
              <a href="watch.html?id=${item.episode_id}" class="btn btn-sm btn-primary" style="margin-top:8px;">Lanjut Nonton</a>
            </div>
          </div>
        `;
      }).join('');
      historyGrid.innerHTML = cards;
    })
    .catch(err => {
      console.error(err);
      historyGrid.innerHTML = `<div class="no-data"><h2>Terjadi Kesalahan</h2><p>${err.message}</p></div>`;
    });
});
