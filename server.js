/**
 * server.js
 * Express Server & SQLite Database Setup untuk Website Streaming Anime (NimeFlix)
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto'); // Add crypto

const app = express();
const PORT = process.env.PORT || 3001;

// Sesi aktif disimpan di memori
const activeSessions = new Map();

// Helper untuk hashing password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Middleware untuk autentikasi sesi token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>

  if (!token) {
    req.user = null;
    return next();
  }

  const user = activeSessions.get(token);
  if (!user) {
    req.user = null;
    return next();
  }

  req.user = user;
  next();
}

// Middleware proteksi: Harus login
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Anda harus masuk terlebih dahulu' });
  }
  next();
}

// Middleware proteksi: Harus admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak. Hanya Admin yang diperbolehkan' });
  }
  next();
}

// Middleware untuk memparsing body request berformat JSON
app.use(express.json({ limit: '5mb' })); // increase payload limit for avatar uploads

// Terapkan middleware token secara global
app.use(authenticateToken);

// Menyajikan file statis (HTML, CSS, JS) dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Inisialisasi Database SQLite
// SQLite akan otomatis membuat file 'database.db' jika file tersebut belum ada
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Gagal menghubungkan ke database SQLite:', err.message);
  } else {
    console.log('Terhubung ke database SQLite.');
    initializeDatabase();
  }
});

/**
 * Fungsi untuk menginisialisasi tabel-tabel database jika belum ada
 * Serta memasukkan data dummy (seed data) jika database kosong
 */
function initializeDatabase() {
  db.serialize(() => {
    // 1. Membuat tabel 'anime'
    db.run(`
      CREATE TABLE IF NOT EXISTS anime (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        judul TEXT NOT NULL,
        deskripsi TEXT,
        thumbnail_url TEXT,
        genre TEXT
      )
    `);

    // 2. Membuat tabel 'episode'
    // Menggunakan foreign key yang mereferensikan ke tabel 'anime'
    db.run(`
      CREATE TABLE IF NOT EXISTS episode (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        anime_id INTEGER,
        nomor_episode INTEGER NOT NULL,
        judul_episode TEXT,
        drive_video_id TEXT NOT NULL,
        FOREIGN KEY (anime_id) REFERENCES anime (id) ON DELETE CASCADE
      )
    `);

    // 3. Membuat tabel 'users'
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        avatar_url TEXT DEFAULT '',
        level INTEGER DEFAULT 1,
        exp INTEGER DEFAULT 0
      )
    `, () => {
      // Menambahkan kolom baru ke database SQLite jika user sudah memilikinya sebelumnya
      db.run("ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT ''", () => { });
      db.run("ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1", () => { });
      db.run("ALTER TABLE users ADD COLUMN exp INTEGER DEFAULT 0", () => { });
    });


    // 4. Membuat tabel 'watch_history'
    db.run(`
      CREATE TABLE IF NOT EXISTS watch_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        episode_id INTEGER,
        watched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (episode_id) REFERENCES episode (id) ON DELETE CASCADE,
        UNIQUE(user_id, episode_id)
      )
    `);

    // ---------- MESSAGES TABLE ----------
    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER,
        receiver_id INTEGER,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Cek apakah data anime kosong, jika ya, isi dengan data dummy untuk mempermudah testing
    db.get("SELECT COUNT(*) AS count FROM anime", (err, row) => {
      if (err) {
        return console.error("Gagal memeriksa data database:", err.message);
      }
      if (row.count === 0) {
        seedData();
      }
    });

    // Cek apakah data users kosong, jika ya, isi dengan user default
    db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
      if (err) {
        console.error("Gagal memeriksa data users:", err.message);
      } else if (row && row.count === 0) {
        const adminPassword = hashPassword('admin123');
        const userPassword = hashPassword('user123');
        db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`, ['admin', adminPassword, 'admin']);
        db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`, ['user', userPassword, 'user']);
        console.log("Users default berhasil dibuat (admin/admin123 dan user/user123).");
      }
    });
  });
}

/**
 * Fungsi pembantu (helper) untuk memasukkan data dummy awal
 */
function seedData() {
  console.log("Database kosong. Memasukkan data dummy...");

  // Masukkan default users
  const adminPassword = hashPassword('admin123');
  const userPassword = hashPassword('user123');

  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`, ['admin', adminPassword, 'admin']);
  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`, ['user', userPassword, 'user']);

  const dummyAnime = [
    {
      judul: "Frieren: Beyond Journey's End",
      deskripsi: "Penyihir Frieren dan rekan-rekannya telah berhasil mengalahkan Raja Iblis dan mengembalikan kedamaian. Setelah petualangan usai, mereka berpisah. Sebagai seorang Elf yang berumur panjang, Frieren menyaksikan teman-temannya menua dan meninggal satu demi satu. Dia menyadari betapa berharganya waktu yang dihabiskan bersama manusia dan memutuskan untuk memulai perjalanan baru demi lebih memahami perasaan manusia.",
      thumbnail_url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
      genre: "Fantasy, Adventure, Drama"
    },
    {
      judul: "Demon Slayer: Kimetsu no Yaiba",
      deskripsi: "Tanjiro Kamado menjalani kehidupan yang tenang di pegunungan sampai suatu hari keluarganya dibantai secara kejam oleh iblis, dan satu-satunya adik perempuannya yang selamat, Nezuko, berubah menjadi iblis. Tanjiro bertekad menjadi pembasmi iblis untuk membalaskan dendam keluarganya dan mencari cara untuk mengembalikan Nezuko menjadi manusia.",
      thumbnail_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
      genre: "Action, Fantasy, Shounen"
    },
    {
      judul: "Jujutsu Kaisen",
      deskripsi: "Yuji Itadori adalah siswa SMA biasa dengan kemampuan fisik luar biasa. Demi menyelamatkan teman-temannya dari serangan roh terkutuk, ia nekat memakan jari terkutuk milik Ryomen Sukuna, Raja Kutukan legendaris. Kini, Yuji harus berbagi tubuh dengan Sukuna dan bergabung ke SMA Jujutsu Tokyo untuk belajar mengendalikan kekuatan terkutuk serta membasmi kutukan jahat.",
      thumbnail_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
      genre: "Action, Supernatural, Fantasy"
    }
  ];

  // Memasukkan setiap anime dan menyisipkan episode yang berelasi
  dummyAnime.forEach((anime) => {
    db.run(
      `INSERT INTO anime (judul, deskripsi, thumbnail_url, genre) VALUES (?, ?, ?, ?)`,
      [anime.judul, anime.deskripsi, anime.thumbnail_url, anime.genre],
      function (err) {
        if (err) {
          return console.error("Gagal memasukkan anime dummy:", err.message);
        }

        const animeId = this.lastID; // Mendapatkan ID anime yang baru saja dimasukkan

        // Episode dummy - Gunakan ID Video Google Drive nyata atau dummy di sini.
        // User dapat mengganti 'drive_video_id' dengan ID file asli mereka dari Google Drive.
        if (anime.judul.startsWith("Frieren")) {
          db.run(`INSERT INTO episode (anime_id, nomor_episode, judul_episode, drive_video_id) VALUES 
            (?, 1, 'Perjalanan Dimulai', '1w498n_L0jG58-XgAOp4L3T3yH_DUMMY1'),
            (?, 2, 'Bukan Sekadar Sihir', '1w498n_L0jG58-XgAOp4L3T3yH_DUMMY2'),
            (?, 3, 'Api Biru yang Abadi', '1w498n_L0jG58-XgAOp4L3T3yH_DUMMY3')`,
            [animeId, animeId, animeId]
          );
        } else if (anime.judul.startsWith("Demon Slayer")) {
          db.run(`INSERT INTO episode (anime_id, nomor_episode, judul_episode, drive_video_id) VALUES 
            (?, 1, 'Kekejaman Iblis', '1w498n_L0jG58-XgAOp4L3T3yH_DUMMY4'),
            (?, 2, 'Guru Pembimbing Urokodaki', '1w498n_L0jG58-XgAOp4L3T3yH_DUMMY5')`,
            [animeId, animeId]
          );
        } else if (anime.judul.startsWith("Jujutsu Kaisen")) {
          db.run(`INSERT INTO episode (anime_id, nomor_episode, judul_episode, drive_video_id) VALUES 
            (?, 1, 'Ryomen Sukuna', '1w498n_L0jG58-XgAOp4L3T3yH_DUMMY6'),
            (?, 2, 'Demi Diri Sendiri', '1w498n_L0jG58-XgAOp4L3T3yH_DUMMY7'),
            (?, 3, 'Gadis Baja', '1w498n_L0jG58-XgAOp4L3T3yH_DUMMY8')`,
            [animeId, animeId, animeId]
          );
        }
      }
    );
  });
  console.log("Data dummy berhasil dimasukkan ke database.");
}

// Helper functions menggunakan Promise agar endpoint API bisa menggunakan async/await (lebih rapi & modern)
const dbQueryAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// ==========================================
//               API ENDPOINTS
// ==========================================

/**
 * GET /api/anime
 * Mengambil semua data anime.
 * Mendukung filter pencarian via query param 'search' (misal: /api/anime?search=frieren)
 */
app.get('/api/anime', async (req, res) => {
  try {
    const search = req.query.search;
    const genre = req.query.genre;
    let sql = 'SELECT * FROM anime';
    let params = [];
    let conditions = [];

    if (search) {
      conditions.push('judul LIKE ?');
      params.push(`%${search}%`);
    }

    if (genre) {
      conditions.push('genre LIKE ?');
      params.push(`%${genre}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const animeList = await dbQueryAll(sql, params);
    res.json(animeList);
  } catch (err) {
    console.error('Error GET /api/anime:', err.message);
    res.status(500).json({ error: 'Gagal mengambil data anime dari database' });
  }
});

/**
 * GET /api/genres
 * Mengambil daftar semua genre unik dari database
 */
app.get('/api/genres', async (req, res) => {
  try {
    const animeList = await dbQueryAll('SELECT genre FROM anime');
    const genreSet = new Set();

    animeList.forEach(anime => {
      if (anime.genre) {
        anime.genre.split(',').forEach(g => {
          const trimmed = g.trim();
          if (trimmed) {
            genreSet.add(trimmed);
          }
        });
      }
    });

    res.json(Array.from(genreSet).sort());
  } catch (err) {
    console.error('Error GET /api/genres:', err.message);
    res.status(500).json({ error: 'Gagal mengambil daftar genre dari database' });
  }
});


/**
 * GET /api/anime/:id
 * Mengambil detail 1 anime beserta daftar semua episodenya
 */
app.get('/api/anime/:id', async (req, res) => {
  try {
    const animeId = req.params.id;

    // Ambil info anime
    const anime = await dbGet('SELECT * FROM anime WHERE id = ?', [animeId]);
    if (!anime) {
      return res.status(404).json({ error: 'Anime tidak ditemukan' });
    }

    // Ambil daftar episode yang berelasi dengan anime tersebut
    const episodes = await dbQueryAll('SELECT * FROM episode WHERE anime_id = ? ORDER BY nomor_episode ASC', [animeId]);

    // Gabungkan detail anime dan daftar episodenya dalam satu response
    res.json({
      ...anime,
      episodes
    });
  } catch (err) {
    console.error(`Error GET /api/anime/${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Gagal mengambil detail anime dari database' });
  }
});

/**
 * GET /api/episode/:id
 * Mengambil data 1 episode spesifik, termasuk info navigasi (episode sebelumnya/selanjutnya)
 */
app.get('/api/episode/:id', async (req, res) => {
  try {
    const episodeId = req.params.id;

    // Ambil data episode saat ini beserta nama anime-nya (JOIN table)
    const episode = await dbGet(`
      SELECT e.*, a.judul AS anime_judul 
      FROM episode e 
      JOIN anime a ON e.anime_id = a.id 
      WHERE e.id = ?
    `, [episodeId]);

    if (!episode) {
      return res.status(404).json({ error: 'Episode tidak ditemukan' });
    }

    // Cari ID episode sebelumnya (nomor_episode - 1) untuk anime yang sama
    const prevEpisode = await dbGet(`
      SELECT id FROM episode 
      WHERE anime_id = ? AND nomor_episode = ?
    `, [episode.anime_id, episode.nomor_episode - 1]);

    // Cari ID episode selanjutnya (nomor_episode + 1) untuk anime yang sama
    const nextEpisode = await dbGet(`
      SELECT id FROM episode 
      WHERE anime_id = ? AND nomor_episode = ?
    `, [episode.anime_id, episode.nomor_episode + 1]);

    // Kembalikan data episode saat ini bersama navigasi id episode sebelumnya dan selanjutnya
    res.json({
      ...episode,
      prev_episode_id: prevEpisode ? prevEpisode.id : null,
      next_episode_id: nextEpisode ? nextEpisode.id : null
    });
  } catch (err) {
    console.error(`Error GET /api/episode/${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Gagal mengambil detail episode' });
  }
});

/**
 * GET /api/episode
 * Mengambil semua data episode untuk di-manage oleh admin
 */
app.get('/api/episode', async (req, res) => {
  try {
    const episodes = await dbQueryAll('SELECT * FROM episode ORDER BY anime_id, nomor_episode ASC');
    res.json(episodes);
  } catch (err) {
    console.error('Error GET /api/episode:', err.message);
    res.status(500).json({ error: 'Gagal mengambil daftar episode' });
  }
});

/**
 * POST /api/anime
 * Menambah anime baru (hanya untuk admin)
 */
app.post('/api/anime', requireAdmin, async (req, res) => {
  try {
    const { judul, deskripsi, thumbnail_url, genre } = req.body;

    if (!judul) {
      return res.status(400).json({ error: 'Judul anime harus diisi' });
    }

    const result = await dbRun(
      'INSERT INTO anime (judul, deskripsi, thumbnail_url, genre) VALUES (?, ?, ?, ?)',
      [judul, deskripsi, thumbnail_url, genre]
    );

    res.status(201).json({
      id: result.id,
      message: 'Anime baru berhasil ditambahkan!'
    });
  } catch (err) {
    console.error('Error POST /api/anime:', err.message);
    res.status(500).json({ error: 'Gagal menambahkan anime baru' });
  }
});

/**
 * POST /api/episode
 * Menambah episode baru ke anime tertentu (hanya untuk admin)
 */
app.post('/api/episode', requireAdmin, async (req, res) => {
  try {
    const { anime_id, nomor_episode, judul_episode, drive_video_id } = req.body;

    if (!anime_id || !nomor_episode || !drive_video_id) {
      return res.status(400).json({ error: 'anime_id, nomor_episode, dan drive_video_id wajib diisi' });
    }

    const result = await dbRun(
      'INSERT INTO episode (anime_id, nomor_episode, judul_episode, drive_video_id) VALUES (?, ?, ?, ?)',
      [anime_id, nomor_episode, judul_episode, drive_video_id]
    );

    res.status(201).json({
      id: result.id,
      message: 'Episode baru berhasil ditambahkan!'
    });
  } catch (err) {
    console.error('Error POST /api/episode:', err.message);
    res.status(500).json({ error: 'Gagal menambahkan episode baru' });
  }
});

/**
 * DELETE /api/admin/anime/:id
 * Menghapus anime beserta episodenya (hanya untuk admin)
 */
app.delete('/api/admin/anime/:id', requireAdmin, async (req, res) => {
  try {
    const animeId = req.params.id;
    const result = await dbRun('DELETE FROM anime WHERE id = ?', [animeId]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Anime tidak ditemukan' });
    }
    res.json({ message: 'Anime berhasil dihapus!' });
  } catch (err) {
    console.error('Error DELETE /api/admin/anime:', err.message);
    res.status(500).json({ error: 'Gagal menghapus anime' });
  }
});

/**
 * DELETE /api/admin/episode/:id
 * Menghapus episode spesifik (hanya untuk admin)
 */
app.delete('/api/admin/episode/:id', requireAdmin, async (req, res) => {
  try {
    const episodeId = req.params.id;
    const result = await dbRun('DELETE FROM episode WHERE id = ?', [episodeId]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Episode tidak ditemukan' });
    }
    res.json({ message: 'Episode berhasil dihapus!' });
  } catch (err) {
    console.error('Error DELETE /api/admin/episode:', err.message);
    res.status(500).json({ error: 'Gagal menghapus episode' });
  }
});

// ==========================================
// ---------- ADMIN ENDPOINTS ----------
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await dbQueryAll('SELECT id, username, password, role, avatar_url, level, exp FROM users');
    res.json(users);
  } catch (err) {
    console.error('Error GET /api/admin/users:', err.message);
    res.status(500).json({ error: 'Gagal mengambil data pengguna' });
  }
});

app.post('/api/contact-admin', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content wajib diisi' });
    }
    const admin = await dbGet("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (!admin) {
      return res.status(500).json({ error: 'Admin tidak ditemukan' });
    }
    await dbRun(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [req.user.id, admin.id, content]
    );
    res.json({ success: true, message: 'Pesan terkirim ke admin' });
  } catch (err) {
    console.error('Error POST /api/contact-admin:', err.message);
    res.status(500).json({ error: 'Gagal mengirim pesan' });
  }
});

app.get('/api/admin/messages', requireAdmin, async (req, res) => {
  try {
    const msgs = await dbQueryAll(
      `SELECT m.id, m.sender_id, u.username AS sender_username, m.content, m.created_at\n       FROM messages m\n       JOIN users u ON m.sender_id = u.id\n       ORDER BY m.created_at DESC`
    );
    res.json(msgs);
  } catch (err) {
    console.error('Error GET /api/admin/messages:', err.message);
    res.status(500).json({ error: 'Gagal mengambil pesan' });
  }
});
//               AUTH ENDPOINTS
// ==========================================

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }

    const hashedPassword = hashPassword(password);

    await dbRun(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, 'user']
    );

    res.status(201).json({ message: 'Registrasi berhasil! Silakan login.' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Username sudah digunakan' });
    }
    console.error('Error /api/auth/register:', err.message);
    res.status(500).json({ error: 'Gagal melakukan registrasi' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }

    const hashedPassword = hashPassword(password);
    const user = await dbGet('SELECT * FROM users WHERE username = ? AND password = ?', [username, hashedPassword]);

    if (!user) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    activeSessions.set(token, {
      id: user.id,
      username: user.username,
      role: user.role,
      avatar_url: user.avatar_url || '',
      level: user.level || 1,
      exp: user.exp || 0
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        avatar_url: user.avatar_url || '',
        level: user.level || 1,
        exp: user.exp || 0
      }
    });
  } catch (err) {
    console.error('Error /api/auth/login:', err.message);
    res.status(500).json({ error: 'Gagal melakukan login' });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    activeSessions.delete(token);
  }
  res.json({ message: 'Logout berhasil' });
});

// GET /api/auth/me
app.get('/api/auth/me', async (req, res) => {
  if (req.user) {
    try {
      const user = await dbGet('SELECT id, username, role, avatar_url, level, exp FROM users WHERE id = ?', [req.user.id]);
      if (user) {
        res.json({ loggedIn: true, user });
      } else {
        res.json({ loggedIn: false });
      }
    } catch (err) {
      res.json({ loggedIn: true, user: req.user });
    }
  } else {
    res.json({ loggedIn: false });
  }
});

// PUT /api/user/profile
app.put('/api/user/profile', requireAuth, async (req, res) => {
  try {
    const { avatar_url } = req.body;
    await dbRun('UPDATE users SET avatar_url = ? WHERE id = ?', [avatar_url || '', req.user.id]);
    res.json({ success: true, message: 'Foto profil berhasil diperbarui!' });
  } catch (err) {
    console.error('Error PUT /api/user/profile:', err.message);
    res.status(500).json({ error: 'Gagal memperbarui profil' });
  }
});

// ==========================================
//               HISTORY ENDPOINTS
// ==========================================

// GET /api/history
app.get('/api/history', requireAuth, async (req, res) => {
  try {
    const historyList = await dbQueryAll(`
      SELECT h.id as history_id, h.watched_at, e.id as episode_id, e.nomor_episode, e.judul_episode, e.drive_video_id,
             a.id as anime_id, a.judul as anime_judul, a.thumbnail_url, a.genre
      FROM watch_history h
      JOIN episode e ON h.episode_id = e.id
      JOIN anime a ON e.anime_id = a.id
      WHERE h.user_id = ?
      ORDER BY h.watched_at DESC
    `, [req.user.id]);

    res.json(historyList);
  } catch (err) {
    console.error('Error GET /api/history:', err.message);
    res.status(500).json({ error: 'Gagal mengambil riwayat tontonan' });
  }
});

// POST /api/history
app.post('/api/history', requireAuth, async (req, res) => {
  try {
    const { episode_id } = req.body;
    if (!episode_id) {
      return res.status(400).json({ error: 'episode_id wajib diisi' });
    }

    // Periksa apakah user sudah menonton episode ini sebelumnya
    const existing = await dbGet('SELECT 1 FROM watch_history WHERE user_id = ? AND episode_id = ?', [req.user.id, episode_id]);

    await dbRun(`
      INSERT OR REPLACE INTO watch_history (user_id, episode_id, watched_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `, [req.user.id, episode_id]);

    let leveledUp = false;
    let newLevel = 1;
    let newExp = 0;

    if (!existing) {
      // Dapatkan data user
      const user = await dbGet('SELECT level, exp FROM users WHERE id = ?', [req.user.id]);
      let level = user.level || 1;
      let exp = (user.exp || 0) + 100;
      let expNeeded = level * 100; // e.g. level 1 -> 100 XP, level 2 -> 200 XP, dll.

      while (exp >= expNeeded) {
        exp -= expNeeded;
        level += 1;
        expNeeded = level * 100;
        leveledUp = true;
      }

      newLevel = level;
      newExp = exp;
      await dbRun('UPDATE users SET level = ?, exp = ? WHERE id = ?', [level, exp, req.user.id]);
    } else {
      // Jika sudah pernah ditonton, ambil level dan exp saat ini
      const user = await dbGet('SELECT level, exp FROM users WHERE id = ?', [req.user.id]);
      newLevel = user.level || 1;
      newExp = user.exp || 0;
    }

    res.json({
      success: true,
      message: 'Riwayat tontonan berhasil disimpan',
      leveledUp,
      level: newLevel,
      exp: newExp
    });
  } catch (err) {
    console.error('Error POST /api/history:', err.message);
    res.status(500).json({ error: 'Gagal menyimpan riwayat tontonan' });
  }
});


// Penanganan fallback: Jika rute tidak dikenali, kembalikan ke index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Menjalankan server
app.listen(PORT, () => {
  console.log(`Server NimeFlix berjalan di http://localhost:${PORT}`);
});
