/**
 * nav.js
 * Menangani navigasi dinamis (login status, role, logout)
 */

document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar-links');
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

  // Helper untuk menambah item navigasi
  function addNavItem(id, href, text, extraClass) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.id = id;
    a.href = href;
    a.textContent = text;
    if (extraClass) a.className = extraClass;
    li.appendChild(a);
    navbar.appendChild(li);
  }

  // Hapus semua item selain Home (yang sudah ada pada HTML)
  // Asumsi Home adalah li pertama, jadi kita bersihkan sisanya dulu
  const existingItems = Array.from(navbar.children).slice(1);
  existingItems.forEach(item => navbar.removeChild(item));

  if (user) {
    // Greeting with Mini Avatar
    const greetLi = document.createElement('li');
    greetLi.style.display = 'flex';
    greetLi.style.alignItems = 'center';
    greetLi.style.gap = '8px';

    const defaultAvatar = 'https://i.pinimg.com/736x/87/40/e9/8740e94bb5a4e76c125dfad2c72b2a65.jpg';
    const avatarUrl = user.avatar_url || defaultAvatar;

    const miniAvatar = document.createElement('img');
    miniAvatar.src = avatarUrl;
    miniAvatar.alt = user.username;
    miniAvatar.className = 'nav-avatar';

    const greetSpan = document.createElement('span');
    greetSpan.className = 'welcome-user';
    greetSpan.innerHTML = `Halo, <span>${user.role === 'admin' ? 'Admin' : user.username}</span>`;
    
    greetLi.appendChild(miniAvatar);
    greetLi.appendChild(greetSpan);
    navbar.appendChild(greetLi);

    if (user.role === 'admin') {
      addNavItem('nav-admin', 'admin.html', 'Admin Panel');
    } else {
      addNavItem('nav-history', 'history.html', 'Riwayat');
    }

    addNavItem('nav-profile', 'profile.html', 'Profil');
    addNavItem('nav-logout', '#', 'Keluar', 'logout-link');

    // Logout handler
    const logoutLink = document.getElementById('nav-logout');
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).finally(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html'; // Redirect to index
      });
    });
  } else {
    addNavItem('nav-login', 'login.html', 'Masuk');
  }
});

