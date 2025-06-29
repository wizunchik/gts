// auth.js
const AUTH_URL = 'https://functions.yandexcloud.net/d4eik4r1p7bna7gcok5j';

// Проверка авторизации при загрузке страницы
function checkAuth() {
  if (!localStorage.getItem('authToken')) {
    redirectToLogin();
  }
}

// Перенаправление на страницу входа
function redirectToLogin() {
  if (!window.location.pathname.includes('index.html')) {
    window.location.href = '/index.html';
  }
}

// Функция входа
async function login(login, password) {
  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ login, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('authToken', 'demoAuthToken');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
}

// Функция выхода
function logout() {
  localStorage.removeItem('authToken');
  redirectToLogin();
}

// Инициализация кнопки выхода
function initLogoutButton() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
}

export { checkAuth, login, logout, initLogoutButton };
