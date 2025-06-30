// Конфигурация
const AUTH_API_URL = 'https://functions.yandexcloud.net/d4eik4r1p7bna7gcok5j';
const AUTH_TOKEN_KEY = 'gts_auth_token';
const AUTH_REMEMBER_KEY = 'gts_remember_data';

// Основная функция авторизации
async function performLogin(credentials, remember = false) {
  try {
    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) throw new Error('Ошибка сервера');

    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      
      if (remember) {
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 7);
        localStorage.setItem(AUTH_REMEMBER_KEY, JSON.stringify({
          username: credentials.username,
          expire: expireDate.getTime()
        }));
      }
      
      return true;
    }
    
    throw new Error(data.message || 'Неверные учетные данные');
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    throw error;
  }
}

// Проверка сохраненных данных
function getRememberedUser() {
  const rememberData = localStorage.getItem(AUTH_REMEMBER_KEY);
  if (!rememberData) return null;
  
  try {
    const { username, expire } = JSON.parse(rememberData);
    return Date.now() > expire ? null : username;
  } catch {
    return null;
  }
}

// Проверка авторизации с редиректом
function checkAuthWithRedirect() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    authService.logout();
    return false;
  }
  return true;
}

// Экспорт функций
export const authService = {
  login: performLogin,
  logout: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_REMEMBER_KEY);
    window.location.href = '/app/login'; // Редирект на логин
  },
  checkAuth: () => !!localStorage.getItem(AUTH_TOKEN_KEY),
  checkAuthWithRedirect, // Новая функция для принудительного редиректа
  getRememberedUser
};

// Глобальная проверка при загрузке скрипта (если не на странице логина)
if (!window.location.pathname.includes('/app/login') && !authService.checkAuth()) {
  authService.logout();
}
