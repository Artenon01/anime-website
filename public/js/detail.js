/**
 * detail.js
 * Logika halaman detail anime NimeFlix
 */

document.addEventListener('DOMContentLoaded', () => {
  const detailLoading = document.getElementById('detail-loading');
  const detailContent = document.getElementById('detail-content');
  const animeTitle = document.getElementById('anime-title');
  const animeThumbnail = document.getElementById('anime-thumbnail');
  const animeGenres = document.getElementById('anime-genres');
  const animeDesc = document.getElementById('anime-desc');
  const episodeListContainer = document.getElementById('episode-list-container');

  // Ambil ID anime dari query parameter URL (?id=X)
  const urlParams = new URLSearchParams(window.location.search);
  const animeId = urlParams.get('id');

  // Jika ID tidak ada, kembalikan ke halaman utama
  if (!animeId) {
    window.location.href = 'index.html';
    return;
  }

  // Panggil fungsi untuk mengambil detail anime berdasarkan ID
  fetchAnimeDetail(animeId);

  /**
   * Mengambil data detail anime dan daftar episodenya dari API
   * @param {string|number} id - ID Anime
   */
  async function fetchAnimeDetail(id) {
    try {
      const response = await fetch(`/api/anime/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          showError('Anime Tidak Ditemukan', 'Anime yang Anda cari tidak ada di database kami.');
        } else {
          throw new Error('Terjadi kesalahan koneksi server.');
        }
        return;
      }

      const animeData = await response.json();
      renderAnimeDetail(animeData);
    } catch (error) {
      console.error('Error fetching anime detail:', error);
      showError('Gagal Memuat Data', 'Tidak bisa terhubung ke server. Pastikan backend Express Anda aktif.');
    }
  }

  /**
   * Merender data anime ke elemen-elemen HTML
   * @param {Object} anime - Objek detail anime beserta array 'episodes'
   */
  function renderAnimeDetail(anime) {
    // Sembunyikan loader dan tampilkan blok konten
    detailLoading.style.display = 'none';
    detailContent.style.display = 'block';

    // Isi metadata anime
    animeTitle.textContent = anime.judul;
    document.title = `${anime.judul} - NimeFlix`;
    
    animeThumbnail.src = anime.thumbnail_url || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600';
    animeThumbnail.alt = anime.judul;
    animeDesc.textContent = anime.deskripsi || 'Sinopsis belum ditambahkan.';

    // Render tag genre
    animeGenres.innerHTML = '';
    if (anime.genre) {
      // Split genre berdasarkan koma dan trim spasi kosongnya
      const genres = anime.genre.split(',').map(g => g.trim());
      genres.forEach((genre, index) => {
        const genreTag = document.createElement('a');
        genreTag.href = `index.html?genre=${encodeURIComponent(genre)}`;
        // Tag pertama diberi warna aksen Crunchyroll agar lebih estetik
        genreTag.className = index === 0 ? 'tag tag-accent' : 'tag';
        genreTag.textContent = genre;
        animeGenres.appendChild(genreTag);
      });
    } else {
      const genreTag = document.createElement('a');
      genreTag.href = 'index.html';
      genreTag.className = 'tag';
      genreTag.textContent = 'General';
      animeGenres.appendChild(genreTag);
    }


    // Render daftar episode
    episodeListContainer.innerHTML = '';
    const episodes = anime.episodes || [];

    if (episodes.length === 0) {
      episodeListContainer.innerHTML = `
        <div class="no-data" style="grid-column: 1 / -1; width: 100%;">
          <p>Belum ada episode yang tersedia untuk anime ini.</p>
        </div>
      `;
      return;
    }

    // Buat card link untuk setiap episode
    episodes.forEach(ep => {
      const epCard = document.createElement('a');
      epCard.href = `watch.html?id=${ep.id}`;
      epCard.className = 'episode-card';
      epCard.innerHTML = `
        <div class="episode-number-badge">
          EP ${ep.nomor_episode}
        </div>
        <div class="episode-info">
          <div class="episode-title">${ep.judul_episode || `Episode ${ep.nomor_episode}`}</div>
          <div class="episode-sub">Klik untuk menonton</div>
        </div>
      `;
      episodeListContainer.appendChild(epCard);
    });
  }

  /**
   * Menampilkan pesan kesalahan di halaman jika fetch gagal
   */
  function showError(title, message) {
    detailLoading.style.display = 'none';
    detailContent.style.display = 'block';
    
    // Set layout utama untuk pesan error
    detailContent.innerHTML = `
      <div class="no-data" style="margin-top: 30px;">
        <h2>${title}</h2>
        <p>${message}</p>
        <br>
        <a href="index.html" class="btn btn-secondary">&larr; Kembali ke Beranda</a>
      </div>
    `;
  }
});
