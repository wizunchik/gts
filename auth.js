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

// Усиленная проверка авторизации
function checkAuth() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return false;
  
  // Проверяем структуру токена
  const isValidToken = token.startsWith('secure-token-') && token.length > 20;
  
  // Дополнительная проверка временной метки в токене
  const tokenTimestamp = parseInt(token.split('-').pop());
  const isNotExpired = Date.now() - tokenTimestamp < 86400000; // 24 часа
  
  return isValidToken && isNotExpired;
}

// Принудительный выход с очисткой
function forceLogout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_REMEMBER_KEY);
  sessionStorage.clear();
  window.location.href = `/app/login?r=${Date.now()}&reason=session_expired`;
}

// Экспорт функций
export const authService = {
  login: performLogin,
  logout: forceLogout,
  checkAuth,
  getRememberedUser
};

// Глобальная проверка при загрузке (если не на странице логина)
if (!window.location.pathname.includes('/app/login')) {
  if (!authService.checkAuth()) {
    authService.logout();
  }
}
