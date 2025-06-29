// auth.js - расширенная версия
const AUTH_URL = 'https://functions.yandexcloud.net/d4eik4r1p7bna7gcok5j';
const TOKEN_KEY = 'cat_auth_token';

// Проверка авторизации при загрузке страницы
export function checkAuth() {
  if (!getToken() && !isLoginPage()) {
    redirectToLogin();
  }
}

// Получение токена
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Вход в систему
export async function login(username, password) {
  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem(TOKEN_KEY, 'generated-token');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Auth error:', error);
    return false;
  }
}

// Выход из системы
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  redirectToLogin();
}

// Вспомогательные функции
function redirectToLogin() {
  window.location.href = '/app/login.html';
}

function isLoginPage() {
  return window.location.pathname.includes('login.html');
}
