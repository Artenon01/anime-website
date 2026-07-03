/**
 * profile.js
 * Logika halaman profil pengguna NimeFlix (avatar, level, dan statistik)
 */

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  // Helper to fetch JSON with proper error handling
  async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status} - ${response.statusText}\n${text}`);
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Expected JSON but received ${contentType}\n${text}`);
    }
    return response.json();
  }


  // Elements
  const profileAlert = document.getElementById('profile-alert');
  const avatarDisplay = document.getElementById('profile-avatar-display');
  const levelBadge = document.getElementById('level-badge-display');
  const usernameDisplay = document.getElementById('username-display');
  const roleDisplay = document.getElementById('role-display');
  const levelText = document.getElementById('current-level-text');
  const xpText = document.getElementById('xp-text');
  const xpBarFill = document.getElementById('xp-bar-fill');
  const watchedCountText = document.getElementById('stat-watched-count');

  const customUrlInput = document.getElementById('custom-avatar-url');
  const profileForm = document.getElementById('profile-form');
  const localAvatarFileInput = document.getElementById('local-avatar-file');

  // Redirection if not logged in
  if (!token) {
    showAlert('error', 'Anda harus masuk terlebih dahulu untuk mengakses halaman profil.');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    return;
  }

  let selectedAvatarUrl = '';
  const defaultAvatar = ''; // Default avatar disabled

  // Initialize page
  initPage();

  async function initPage() {
    await fetchUserProfile();
    await fetchWatchHistoryCount();
  }

  /** Fetch user profile data */
  async function fetchUserProfile() {
    try {
      const data = await fetchJson('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (data.loggedIn && data.user) {
        renderUserData(data.user);
      } else {
        throw new Error('Sesi masuk telah berakhir.');
      }
    } catch (error) {
      console.error(error);
      showAlert('error', error.message);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    }
  }

  /** Fetch watch history count */
  async function fetchWatchHistoryCount() {
    try {
      const history = await fetchJson('/api/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      watchedCountText.textContent = history.length;
    } catch (error) {
      console.error('Gagal mengambil statistik riwayat:', error);
    }
  }

  /** Render user data onto profile dashboard */
  function renderUserData(user) {
    usernameDisplay.textContent = user.username;
    roleDisplay.textContent = user.role.toUpperCase();
    roleDisplay.className = `role-badge role-${user.role}`;

    // Avatar
    const avatarUrl = user.avatar_url || defaultAvatar;
    selectedAvatarUrl = avatarUrl;
    avatarDisplay.src = avatarUrl;

    // Level & XP
    const level = user.level || 1;
    const exp = user.exp || 0;
    const expNeeded = level * 100;
    const xpPercent = Math.min((exp / expNeeded) * 100, 100);

    levelBadge.textContent = level;
    levelText.textContent = level;
    xpText.textContent = `${exp} / ${expNeeded} XP`;
    xpBarFill.style.width = `${xpPercent}%`;
  }

  // Real‑time preview for custom URL input (no preset handling)
  customUrlInput.addEventListener('input', () => {
    const url = customUrlInput.value.trim();
    if (url) {
      selectedAvatarUrl = url;
      avatarDisplay.src = url;
    } else {
      selectedAvatarUrl = defaultAvatar;
      avatarDisplay.src = defaultAvatar;
    }
  });

  // Handle local file avatar upload
  localAvatarFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      const dataUrl = ev.target.result;
      selectedAvatarUrl = dataUrl;
      avatarDisplay.src = dataUrl;
      customUrlInput.value = '';
    };
    reader.readAsDataURL(file);
  });

  // Submit profile form
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const avatarUrlToSend = selectedAvatarUrl.trim();

    try {
      const data = await fetchJson('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar_url: avatarUrlToSend })
      });
      if (!data.success) throw new Error(data.message || 'Gagal menyimpan perubahan');

      // Update cached user data
      const cachedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : {};
      cachedUser.avatar_url = avatarUrlToSend;
      localStorage.setItem('user', JSON.stringify(cachedUser));

      showAlert('success', 'Profil Anda berhasil diperbarui!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error(error);
      showAlert('error', error.message);
    }
  });

  // Helper alerts
  function showAlert(type, message) {
    profileAlert.style.display = 'block';
    profileAlert.className = `alert alert-${type}`;
    profileAlert.textContent = message;
  }

  function hideAlert() {
    profileAlert.style.display = 'none';
    profileAlert.textContent = '';
  }

});
