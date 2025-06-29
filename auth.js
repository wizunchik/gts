// Конфигурация
const AUTH_URL = 'https://functions.yandexcloud.net/d4eik4r1p7bna7gcok5j';
const TOKEN_KEY = 'cat_auth';

// Проверка авторизации
export function checkAuth() {
  return !!localStorage.getItem(TOKEN_KEY);
}

// Вход в систему
export async function login(login, password) {
  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });
    
    if (!response.ok) throw new Error('Auth failed');
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem(TOKEN_KEY, data.token);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
}

// Выход из системы
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = '/auth/login.html';
}

// Инициализация кнопки выхода
export function initLogoutButton() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
}
