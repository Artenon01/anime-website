/**
 * login.js
 * Logika autentikasi Login & Register NimeFlix
 */

document.addEventListener('DOMContentLoaded', () => {
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const linkToRegister = document.getElementById('link-to-register');
  const authFooterText = document.getElementById('auth-footer-text');
  const authAlert = document.getElementById('auth-alert');

  // Cek jika sudah login, alihkan langsung ke home
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = 'index.html';
    return;
  }

  // Event switch ke tab Login
  tabLogin.addEventListener('click', showLoginForm);
  
  // Event switch ke tab Register
  tabRegister.addEventListener('click', showRegisterForm);
  
  // Event link footer "Daftar di sini"
  linkToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    showRegisterForm();
  });

  // Event handler Submit Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
      showAlert('error', 'Semua kolom input wajib diisi.');
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat masuk.');
      }

      // Simpan token dan user ke localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      showAlert('success', 'Berhasil masuk! Mengalihkan halaman...');

      // Redirect ke halaman sebelumnya atau ke index.html setelah 1.5 detik
      setTimeout(() => {
        const redirectUrl = document.referrer && !document.referrer.includes('login.html') 
          ? document.referrer 
          : 'index.html';
        window.location.href = redirectUrl;
      }, 1500);

    } catch (error) {
      showAlert('error', error.message);
    }
  });

  // Event handler Submit Register
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;

    if (!username || !password || !confirm) {
      showAlert('error', 'Semua kolom input wajib diisi.');
      return;
    }

    if (password.length < 6) {
      showAlert('error', 'Password harus minimal 6 karakter.');
      return;
    }

    if (password !== confirm) {
      showAlert('error', 'Konfirmasi password tidak cocok.');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat mendaftar.');
      }

      showAlert('success', 'Pendaftaran berhasil! Mengalihkan ke form masuk...');

      // Berpindah kembali ke form login setelah 1.5 detik
      setTimeout(() => {
        showLoginForm();
        document.getElementById('login-username').value = username;
        document.getElementById('login-password').focus();
      }, 1500);

    } catch (error) {
      showAlert('error', error.message);
    }
  });

  // Fungsi helper menampilkan form login
  function showLoginForm() {
    tabRegister.classList.remove('active');
    tabLogin.classList.add('active');
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    authFooterText.innerHTML = `Belum punya akun? <a href="#" id="link-to-register">Daftar di sini</a>`;
    
    // Bind ulang listener karena innerHTML di-replace
    document.getElementById('link-to-register').addEventListener('click', (e) => {
      e.preventDefault();
      showRegisterForm();
    });
    hideAlert();
  }

  // Fungsi helper menampilkan form register
  function showRegisterForm() {
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    authFooterText.innerHTML = `Sudah punya akun? <a href="#" id="link-to-login">Masuk di sini</a>`;
    
    document.getElementById('link-to-login').addEventListener('click', (e) => {
      e.preventDefault();
      showLoginForm();
    });
    hideAlert();
  }

  // Fungsi helper menampilkan pesan alert
  function showAlert(type, message) {
    authAlert.style.display = 'block';
    authAlert.className = `alert alert-${type}`;
    authAlert.textContent = message;
  }

  // Fungsi helper menyembunyikan alert
  function hideAlert() {
    authAlert.style.display = 'none';
    authAlert.textContent = '';
  }
});
