/**
 * watch.js
 * Logika halaman pemutar video (Watch) NimeFlix
 */

document.addEventListener('DOMContentLoaded', () => {
  const playerLoading = document.getElementById('player-loading');
  const playerContent = document.getElementById('player-content');
  const videoIframe = document.getElementById('video-iframe');
  const btnBackDetail = document.getElementById('btn-back-detail');
  const btnPrevEp = document.getElementById('btn-prev-ep');
  const btnMiddleDetail = document.getElementById('btn-middle-detail');
  const btnNextEp = document.getElementById('btn-next-ep');
  const infoAnimeJudul = document.getElementById('info-anime-judul');
  const infoEpisodeJudul = document.getElementById('info-episode-judul');

  // Ambil ID episode dari query parameter URL (?id=X)
  const urlParams = new URLSearchParams(window.location.search);
  const episodeId = urlParams.get('id');

  // Jika ID tidak ada, kembalikan ke halaman utama
  if (!episodeId) {
    window.location.href = 'index.html';
    return;
  }

  // Panggil fungsi untuk mengambil detail episode berdasarkan ID
  fetchEpisodeDetail(episodeId);

  /**
   * Mengambil data detail episode dari API
   * @param {string|number} id - ID Episode
   */
  async function fetchEpisodeDetail(id) {
    try {
      const response = await fetch(`/api/episode/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          showError('Episode Tidak Ditemukan', 'Episode yang Anda cari tidak ada di database kami.');
        } else {
          throw new Error('Terjadi kesalahan koneksi server.');
        }
        return;
      }

      const episodeData = await response.json();
      renderVideoPlayer(episodeData);
    } catch (error) {
      console.error('Error fetching episode detail:', error);
      showError('Gagal Memuat Video', 'Tidak bisa terhubung ke server. Pastikan backend Anda berjalan.');
    }
  }

  /**
   * Mengatur pemutar video iframe dan navigasi episode
   * @param {Object} data - Objek detail episode yang dikembalikan dari API
   */
  function renderVideoPlayer(data) {
    // Sembunyikan loader dan tampilkan konten pemutar
    playerLoading.style.display = 'none';
    playerContent.style.display = 'block';

    // Set judul halaman browser
    document.title = `Nonton ${data.anime_judul} - Episode ${data.nomor_episode} | NimeFlix`;

    // Hubungkan link video Google Drive ke iframe
    // Mengekstrak ID jika user memasukkan URL lengkap Google Drive
    let driveId = data.drive_video_id;
    if (driveId && (driveId.includes('drive.google.com') || driveId.includes('docs.google.com') || driveId.includes('http'))) {
      const match = driveId.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || driveId.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (match) {
        driveId = match[1];
      }
    }
    videoIframe.src = `https://drive.google.com/file/d/${driveId}/preview`;

    // Update teks info episode
    infoAnimeJudul.textContent = data.anime_judul;
    infoEpisodeJudul.textContent = `Episode ${data.nomor_episode}: ${data.judul_episode || ''}`;

    // Konfigurasi tombol navigasi kembali ke detail anime
    const detailUrl = `detail.html?id=${data.anime_id}`;
    btnBackDetail.href = detailUrl;
    btnMiddleDetail.href = detailUrl;

    // Catat riwayat tontonan jika user login
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ episode_id: data.id })
      })
        .then(res => {
          if (!res.ok) console.warn('Gagal menyimpan riwayat tontonan');
          return res.json();
        })
        .then(resData => {
          if (resData && resData.leveledUp) {
            showLevelUpNotification(resData.level);
            
            // Perbarui cache data user lokal
            const cachedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : {};
            cachedUser.level = resData.level;
            cachedUser.exp = resData.exp;
            localStorage.setItem('user', JSON.stringify(cachedUser));
          } else if (resData && resData.exp !== undefined) {
            const cachedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : {};
            cachedUser.exp = resData.exp;
            localStorage.setItem('user', JSON.stringify(cachedUser));
          }
        })
        .catch(err => console.error('Error recording history:', err));
    }

    // Konfigurasi tombol Episode Sebelumnya
    if (data.prev_episode_id) {
      btnPrevEp.href = `watch.html?id=${data.prev_episode_id}`;
      btnPrevEp.className = 'btn btn-secondary'; // pastikan tombol aktif
    } else {
      btnPrevEp.removeAttribute('href');
      btnPrevEp.className = 'btn btn-disabled'; // nonaktifkan tombol jika eps 1
    }

    // Konfigurasi tombol Episode Selanjutnya
    if (data.next_episode_id) {
      btnNextEp.href = `watch.html?id=${data.next_episode_id}`;
      btnNextEp.className = 'btn btn-primary'; // pastikan tombol aktif
    } else {
      btnNextEp.removeAttribute('href');
      btnNextEp.className = 'btn btn-disabled'; // nonaktifkan tombol jika eps terakhir
    }
  }

  /**
   * Menampilkan pesan kesalahan di halaman jika fetch gagal
   */
  function showError(title, message) {
    playerLoading.style.display = 'none';
    playerContent.style.display = 'block';

    // Ganti isi pemutar dengan tampilan error
    playerContent.innerHTML = `
      <div class="no-data" style="margin-top: 20px;">
        <h2>${title}</h2>
        <p>${message}</p>
        <br>
        <a href="index.html" class="btn btn-secondary">&larr; Kembali ke Beranda</a>
      </div>
    `;
  }

  /**
   * Menampilkan popup notifikasi Level Up yang interaktif
   */
  function showLevelUpNotification(level) {
    const overlay = document.createElement('div');
    overlay.className = 'levelup-overlay';
    
    overlay.innerHTML = `
      <div class="levelup-modal">
        <div class="levelup-stars">✨ 🌟 ✨</div>
        <h2>LEVEL UP!</h2>
        <p>Keren! Level Anda telah meningkat karena rajin menonton anime di NimeFlix.</p>
        <div class="levelup-badge">${level}</div>
        <button class="btn btn-primary" id="btn-close-levelup" style="margin-top: 15px;">Lanjut Nonton</button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Memicu transisi CSS masuk
    setTimeout(() => {
      overlay.classList.add('active');
    }, 50);

    // Event listener tombol tutup
    overlay.querySelector('#btn-close-levelup').addEventListener('click', () => {
      overlay.classList.remove('active');
      setTimeout(() => {
        document.body.removeChild(overlay);
        window.location.reload(); // Refresh halaman agar header/avatar/level terupdate
      }, 300);
    });
  }
});
