/**
 * admin.js
 * Handles admin panel interactions: adding/deleting anime and episodes.
 */

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    // Redirect to login if not authenticated
    window.location.href = 'login.html';
    return;
  }

  // Verify admin role via /api/auth/me
  fetch('/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.ok ? res.json() : Promise.reject('Unauthorized'))
    .then(data => {
      if (!data.loggedIn || !data.user || data.user.role !== 'admin') throw 'Access denied';
    })
    .catch(() => {
      alert('Hanya admin yang dapat mengakses panel ini.');
      window.location.href = 'index.html';
    });

  // UI toggle between Anime and Episode panels
  const btnAnime = document.getElementById('btn-anime');
  const btnEpisode = document.getElementById('btn-episode');
  const panelAnime = document.getElementById('panel-anime');
  const panelEpisode = document.getElementById('panel-episode');

  btnAnime.addEventListener('click', () => {
    btnAnime.classList.add('active');
    btnEpisode.classList.remove('active');
    panelAnime.classList.add('active');
    panelEpisode.classList.remove('active');
  });
  btnEpisode.addEventListener('click', () => {
    btnEpisode.classList.add('active');
    btnAnime.classList.remove('active');
    panelEpisode.classList.add('active');
    panelAnime.classList.remove('active');
  });

  // ---------- Anime Management ----------
  const animeForm = document.getElementById('anime-form');
  const animeTableBody = document.querySelector('#anime-table tbody');

  const fetchAnimeList = () => {
    fetch('/api/anime')
      .then(r => r.json())
      .then(data => {
        animeTableBody.innerHTML = data.map(a => `
          <tr data-id="${a.id}">
            <td>${a.id}</td>
            <td>${a.judul}</td>
            <td>${a.genre || ''}</td>
            <td><img src="${a.thumbnail_url}" alt="thumb" height="40"/></td>
            <td><button class="btn btn-sm btn-danger delete-anime">Delete</button></td>
          </tr>`).join('');
      })
      .catch(err => console.error('Failed to load anime list', err));
  };

  animeForm.addEventListener('submit', e => {
    e.preventDefault();
    const payload = {
      judul: document.getElementById('anime-judul').value.trim(),
      genre: document.getElementById('anime-genre').value.trim(),
      thumbnail_url: document.getElementById('anime-thumb').value.trim(),
      deskripsi: document.getElementById('anime-deskripsi').value.trim()
    };
    fetch('/api/anime', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then(r => {
        if (!r.ok) throw new Error('Gagal menambah anime');
        return r.json();
      })
      .then(() => {
        animeForm.reset();
        fetchAnimeList();
      })
      .catch(err => alert(err.message));
  });

  animeTableBody.addEventListener('click', e => {
    if (e.target.matches('.delete-anime')) {
      const tr = e.target.closest('tr');
      const animeId = tr.dataset.id;
      if (!confirm('Yakin hapus anime ini?')) return;
      fetch(`/api/admin/anime/${animeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => {
          if (!r.ok) throw new Error('Gagal menghapus');
          tr.remove();
        })
        .catch(err => alert(err.message));
    }
  });

  // ---------- Episode Management ----------
  const episodeForm = document.getElementById('episode-form');
  const episodeTableBody = document.querySelector('#episode-table tbody');

  const fetchEpisodeList = () => {
    fetch('/api/episode')
      .then(r => r.json())
      .then(data => {
        episodeTableBody.innerHTML = data.map(ep => `
          <tr data-id="${ep.id}">
            <td>${ep.id}</td>
            <td>${ep.anime_id}</td>
            <td>${ep.nomor_episode}</td>
            <td>${ep.judul_episode || ''}</td>
            <td>${ep.drive_video_id}</td>
            <td><button class="btn btn-sm btn-danger delete-episode">Delete</button></td>
          </tr>`).join('');
      })
      .catch(err => console.error('Failed load episodes', err));
  };

  episodeForm.addEventListener('submit', e => {
    e.preventDefault();
    const payload = {
      anime_id: Number(document.getElementById('episode-anime-id').value),
      nomor_episode: Number(document.getElementById('episode-number').value),
      judul_episode: document.getElementById('episode-judul').value.trim(),
      drive_video_id: document.getElementById('episode-drive-id').value.trim()
    };
    fetch('/api/episode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then(r => {
        if (!r.ok) throw new Error('Gagal menambah episode');
        return r.json();
      })
      .then(() => {
        episodeForm.reset();
        fetchEpisodeList();
      })
      .catch(err => alert(err.message));
  });

  episodeTableBody.addEventListener('click', e => {
    if (e.target.matches('.delete-episode')) {
      const tr = e.target.closest('tr');
      const epId = tr.dataset.id;
      if (!confirm('Yakin hapus episode ini?')) return;
      fetch(`/api/admin/episode/${epId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => {
          if (!r.ok) throw new Error('Gagal hapus');
          tr.remove();
        })
        .catch(err => alert(err.message));
    }
  });

  // Initial load
  fetchAnimeList();
  fetchEpisodeList();
});
