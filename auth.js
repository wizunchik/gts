// Убедитесь, что файл auth.js содержит правильные экспорты
const AUTH_URL = 'https://functions.yandexcloud.net/d4eik4r1p7bna7gcok5j';
const TOKEN_KEY = 'cat_auth';

// Функция входа
async function login(login, password) {
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

// Функция выхода
function logout() {
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = '/auth/login.html';
}

// Проверка авторизации
function checkAuth() {
  return !!localStorage.getItem(TOKEN_KEY);
}

// Экспортируем функции
export { login, logout, checkAuth };
