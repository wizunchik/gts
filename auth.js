// Конфигурация
const API_URL = 'https://functions.yandexcloud.net/d4eik4r1p7bna7gcok5j';
const TOKEN_KEY = 'cat_auth_token';

// Функция входа
export async function login(username, password) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: username, password })
    });

    if (!response.ok) throw new Error('Ошибка сервера');

    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem(TOKEN_KEY, data.token);
      return true;
    } else {
      throw new Error(data.message || 'Неверные учетные данные');
    }
  } catch (error) {
    console.error('Ошибка входа:', error);
    throw error;
  }
}

// Функция выхода
export function logout() {
  // 1. Удаляем токен
  localStorage.removeItem(TOKEN_KEY);
  
  // 2. Перенаправляем на страницу входа
  window.location.href = '/app/login';
  
  // 3. Для SPA: можно добавить событие
  if (window.onLogout) {
    window.onLogout();
  }
}

// Проверка авторизации
export function checkAuth() {
  return !!localStorage.getItem(TOKEN_KEY);
}

// Получение токена (для API запросов)
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
