/**
 * main.js
 * Logika halaman utama (Home) NimeFlix dengan fitur pencarian & filter genre
 */

document.addEventListener('DOMContentLoaded', () => {
  const animeGridContainer = document.getElementById('anime-grid-container');
  const searchInput = document.getElementById('search-input');
  const searchForm = document.getElementById('search-form');
  const genreFiltersContainer = document.getElementById('genre-filters-container');

  // State pencarian & genre aktif
  let activeGenre = '';

  // Membaca pre-selected genre dari URL parameter (contoh: index.html?genre=Fantasy)
  const urlParams = new URLSearchParams(window.location.search);
  const initialGenre = urlParams.get('genre') || '';
  activeGenre = initialGenre;

  // Inisialisasi awal
  init();

  async function init() {
    await fetchGenres();
    fetchAnime(searchInput.value.trim(), activeGenre);
  }

  // Event listener saat form pencarian disubmit (ditekan enter atau tombol cari diklik)
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    fetchAnime(query, activeGenre);
  });

  // Fitur pencarian instan dengan debounce
  let debounceTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      const query = searchInput.value.trim();
      fetchAnime(query, activeGenre);
    }, 400); // Tunggu 400ms setelah user berhenti mengetik
  });

  /**
   * Mengambil daftar genre unik dari API dan merendernya sebagai pill/tombol filter
   */
  async function fetchGenres() {
    try {
      const response = await fetch('/api/genres');
      if (!response.ok) throw new Error('Gagal memuat daftar genre');
      const genres = await response.json();
      renderGenreFilters(genres);
    } catch (error) {
      console.error('Error fetching genres:', error);
      // Fallback jika API gagal, render minimal tombol "Semua"
      renderGenreFilters([]);
    }
  }

  /**
   * Merender tombol-tombol genre
   */
  function renderGenreFilters(genres) {
    if (!genreFiltersContainer) return;
    genreFiltersContainer.innerHTML = '';

    // Tombol default "Semua"
    const allPill = document.createElement('button');
    allPill.className = `genre-pill ${activeGenre === '' ? 'active' : ''}`;
    allPill.textContent = 'Semua';
    allPill.addEventListener('click', () => {
      selectGenre('');
    });
    genreFiltersContainer.appendChild(allPill);

    // Tombol untuk masing-masing genre dari database
    genres.forEach(genre => {
      const pill = document.createElement('button');
      pill.className = `genre-pill ${activeGenre === genre ? 'active' : ''}`;
      pill.textContent = genre;
      pill.addEventListener('click', () => {
        selectGenre(genre);
      });
      genreFiltersContainer.appendChild(pill);
    });
  }

  /**
   * Menangani aksi klik pada tombol filter genre
   */
  function selectGenre(genre) {
    activeGenre = genre;
    
    // Perbarui class active pada UI
    const pills = genreFiltersContainer.querySelectorAll('.genre-pill');
    pills.forEach(pill => {
      if (pill.textContent === (genre || 'Semua')) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    // Jalankan ulang query pencarian/filter
    fetchAnime(searchInput.value.trim(), activeGenre);
  }

  /**
   * Mengambil data anime dari REST API backend
   * @param {string} search - Kata kunci pencarian judul anime
   * @param {string} genre - Kategori genre yang disaring
   */
  async function fetchAnime(search = '', genre = '') {
    try {
      // Tampilkan animasi loading
      animeGridContainer.innerHTML = `
        <div class="loading" id="loader">
          <p>Memuat daftar anime...</p>
        </div>
      `;

      // Bangun URL endpoint dengan parameter pencarian dan genre
      let url = '/api/anime';
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (genre) params.append('genre', genre);

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Gagal mengambil data dari server');
      }

      const animeList = await response.json();
      renderAnimeList(animeList);
    } catch (error) {
      console.error('Error fetching anime:', error);
      animeGridContainer.innerHTML = `
        <div class="no-data">
          <h3>Terjadi Kesalahan</h3>
          <p>Gagal memuat data anime. Pastikan server sudah berjalan dengan benar.</p>
        </div>
      `;
    }
  }

  /**
   * Merender array anime ke dalam grid HTML
   * @param {Array} animeList - Daftar objek anime
   */
  function renderAnimeList(animeList) {
    // Bersihkan isi container
    animeGridContainer.innerHTML = '';

    // Jika data kosong
    if (animeList.length === 0) {
      animeGridContainer.innerHTML = `
        <div class="no-data" style="grid-column: 1 / -1;">
          <h3>Anime Tidak Ditemukan</h3>
          <p>Maaf, kami tidak bisa menemukan anime dengan kriteria tersebut.</p>
        </div>
      `;
      return;
    }

    // Loop data anime dan buat elemen card untuk masing-masing item
    animeList.forEach(anime => {
      const animeCard = document.createElement('div');
      animeCard.className = 'anime-card';
      
      // Menggunakan fallback jika thumbnail_url kosong
      const imgUrl = anime.thumbnail_url || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600';

      animeCard.innerHTML = `
        <a href="detail.html?id=${anime.id}">
          <div class="thumbnail-wrapper">
            <img src="${imgUrl}" alt="${anime.judul}" loading="lazy">
          </div>
        </a>
        <div class="anime-info">
          <div class="anime-genre">${anime.genre || 'General'}</div>
          <h3 class="anime-title" title="${anime.judul}">
            <a href="detail.html?id=${anime.id}">${anime.judul}</a>
          </h3>
          <div class="anime-card-footer">
            <span>Tonton Gratis</span>
            <a href="detail.html?id=${anime.id}" class="btn-detail">Lihat Info &rarr;</a>
          </div>
        </div>
      `;

      animeGridContainer.appendChild(animeCard);
    });
  }
});

