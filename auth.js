// Конфигурация
const API_URL = 'https://functions.yandexcloud.net/d4eik4r1p7bna7gcok5j';
const TOKEN_KEY = 'cat_auth_token';
const REMEMBER_KEY = 'cat_remember_data';
const TOKEN_EXPIRE_DAYS = 7;

// Функция входа с запоминанием
export async function login(username, password, remember = false) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: username, password })
    });

    if (!response.ok) throw new Error('Ошибка сервера');

    const data = await response.json();
    
    if (data.success) {
      // Сохраняем токен
      localStorage.setItem(TOKEN_KEY, data.token);
      
      // Если выбрано "Запомнить меня"
      if (remember) {
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + TOKEN_EXPIRE_DAYS);
        
        const rememberData = {
          username,
          expire: expireDate.getTime()
        };
        localStorage.setItem(REMEMBER_KEY, JSON.stringify(rememberData));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      
      return true;
    }
    throw new Error(data.message || 'Неверные учетные данные');
  } catch (error) {
    console.error('Ошибка входа:', error);
    throw error;
  }
}

// Проверка сохранённых данных
export function checkRemembered() {
  const rememberData = localStorage.getItem(REMEMBER_KEY);
  if (!rememberData) return null;
  
  try {
    const { username, expire } = JSON.parse(rememberData);
    if (Date.now() > expire) {
      localStorage.removeItem(REMEMBER_KEY);
      return null;
    }
    return username;
  } catch {
    return null;
  }
}

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
