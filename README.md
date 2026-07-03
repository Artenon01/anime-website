# NimeFlix - Website Streaming Anime Sederhana 🎬

NimeFlix adalah proyek website streaming anime sederhana yang dirancang khusus untuk keperluan tugas kuliah. Website ini mengintegrasikan pemutar video menggunakan iframe dari Google Drive, yang dikelola melalui database SQLite dan disajikan menggunakan Express.js (Node.js) di backend serta HTML, CSS, dan JavaScript Vanilla di frontend.

## Fitur Utama
1. **Halaman Home**: Menampilkan daftar koleksi anime dengan layout grid yang responsif, dilengkapi search bar untuk menyaring judul anime.
2. **Halaman Detail**: Menampilkan poster, genre, sinopsis, dan daftar episode dari anime yang dipilih.
3. **Halaman Watch**: Pemutar video iframe Google Drive responsif (16:9) dengan kontrol navigasi antar episode (Sebelumnya/Selanjutnya).
4. **REST API**: API untuk mengambil data anime, detail anime, episode, serta menambahkan anime/episode baru (sebagai modul pengujian).
5. **Auto-Seed Database**: Aplikasi otomatis membuat database SQLite dan mengisi data dummy saat pertama kali dijalankan.

---

## Struktur Folder Proyek
```text
c:\Users\Velgrynd\Downloads\Coba Coba\
├── package.json          # File konfigurasi npm & dependensi proyek
├── server.js              # Server backend (Express, Rute API, & SQLite)
├── database.db           # File database SQLite (dibuat secara otomatis)
├── README.md             # Petunjuk penggunaan proyek ini
└── public/               # Folder berisi file frontend statis
    ├── index.html        # Halaman Utama (Daftar Anime)
    ├── detail.html       # Halaman Detail Anime
    ├── watch.html        # Halaman Pemutar Video
    ├── css/
    │   └── style.css     # Desain kustom responsif & estetika gelap premium
    └── js/
        ├── main.js       # Mengambil & merender list anime + fitur search
        ├── detail.js     # Mengambil & merender info anime + list episode
        └── watch.js      # Mengontrol pemutar video & tombol navigasi episode
```

---

## Prasyarat
Sebelum menjalankan proyek ini, pastikan komputer Anda telah terinstall:
- **Node.js** (Rekomendasi versi LTS terbaru) yang dapat diunduh di [nodejs.org](https://nodejs.org/).
- Setelah Node.js terinstall, perintah `npm` akan otomatis terpasang.

---

## Cara Menjalankan Proyek

1. **Unduh/Buka Folder Proyek**
   Buka terminal, command prompt (CMD), atau PowerShell di folder proyek ini (`c:\Users\Velgrynd\Downloads\Coba Coba`).

2. **Install Dependensi**
   Jalankan perintah berikut untuk mengunduh package `express` dan `sqlite3` yang dibutuhkan:
   ```bash
   npm install
   ```

3. **Jalankan Server**
   Jalankan server menggunakan perintah:
   ```bash
   npm start
   ```
   *Atau jika ingin menggunakan mode dev:*
   ```bash
   npm run dev
   ```

4. **Buka di Browser**
   Buka browser Anda lalu kunjungi alamat:
   ```text
   http://localhost:3000
   ```

---

## Cara Menggunakan Video Google Drive Anda Sendiri

Untuk menampilkan video anime milik Anda sendiri yang disimpan di Google Drive:

1. **Dapatkan ID File Google Drive Anda**
   - Upload video anime ke Google Drive Anda.
   - Klik kanan pada file video -> pilih **Share** (Bagikan) -> ubah hak akses menjadi **"Anyone with the link can view"** (Siapa saja yang memiliki link dapat melihat). *Ini langkah yang sangat krusial agar iframe bisa menampilkan video.*
   - Salin link bagikan tersebut. Format link-nya akan seperti ini:
     `https://drive.google.com/file/d/1w498n_L0jG58-XgAOp4L3T3yH_abcdef/view?usp=sharing`
   - Ambil bagian **ID File** yang terletak di antara `/d/` dan `/view`. Pada contoh di atas, ID-nya adalah:
     `1w498n_L0jG58-XgAOp4L3T3yH_abcdef`

2. **Memasukkan Data Baru via API**
   Anda bisa menggunakan aplikasi seperti **Postman**, **Insomnia**, atau ekstensi VS Code **REST Client** untuk menambahkan anime dan episode Anda ke database secara langsung melalui API.

   * **Tambah Anime Baru (`POST /api/anime`)**
     - URL: `http://localhost:3000/api/anime`
     - Method: `POST`
     - Headers: `Content-Type: application/json`
     - Body (JSON):
       ```json
       {
         "judul": "Naruto Shippuden",
         "deskripsi": "Kisah perjuangan Naruto Uzumaki menjadi Hokage.",
         "thumbnail_url": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600",
         "genre": "Action, Adventure, Shounen"
       }
       ```
     - Respons API akan mengembalikan `id` anime (misal: `4`).

   * **Tambah Episode Baru (`POST /api/episode`)**
     - URL: `http://localhost:3000/api/episode`
     - Method: `POST`
     - Headers: `Content-Type: application/json`
     - Body (JSON) (Gunakan `anime_id` dari langkah sebelumnya dan `drive_video_id` asli Anda):
       ```json
       {
         "anime_id": 4,
         "nomor_episode": 1,
         "judul_episode": "Kepulangan Sang Pahlawan",
         "drive_video_id": "1w498n_L0jG58-XgAOp4L3T3yH_abcdef"
       }
       ```

3. **Cara Alternatif (Langsung Edit Database)**
   Jika ingin mengedit data dummy secara langsung, Anda bisa menggunakan aplikasi gratis seperti **DB Browser for SQLite** lalu buka file `database.db`. Anda bisa langsung menyunting data di tabel `anime` dan `episode`.

---

## Logika & Alur Penting Kode (Untuk Pembelajaran/Presentasi)

* **Server & Koneksi Database (`server.js`)**: Menggunakan database relasional SQLite file tunggal (`database.db`). Kita membuat query tabel menggunakan helper berbasis *Promise* (`dbQueryAll`, `dbGet`, `dbRun`) sehingga kode router Express terlihat ringkas dan menggunakan struktur `async/await` modern.
* **Integrasi Iframe (`watch.js`)**: Kode JavaScript di frontend mengambil data dari backend `/api/episode/:id`, lalu merelasikan ID video Google Drive tersebut ke URL source iframe dengan pola `https://drive.google.com/file/d/{FILE_ID}/preview`.
* **Sistem Navigasi Episode**: Pada endpoint `GET /api/episode/:id`, backend secara cerdas memproses pencarian episode sebelumnya (`nomor_episode - 1`) dan episode setelahnya (`nomor_episode + 1`) pada anime yang sama. Nilai ID yang ditemukan dikembalikan ke frontend sehingga tombol navigasi di halaman nonton bisa diaktifkan/dinonaktifkan secara otomatis.
