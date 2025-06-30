// Конфигурация
const AUTH_API_URL = 'https://functions.yandexcloud.net/d4eik4r1p7bna7gcok5j';
const AUTH_TOKEN_KEY = 'gts_auth_token';
const AUTH_REMEMBER_KEY = 'gts_remember_data';

// Проверка валидности токена
function isValidToken(token) {
  if (!token) return false;
  
  // Проверяем структуру: secure-token-<random>-<timestamp>
  const parts = token.split('-');
  if (parts.length < 4) return false;
  if (parts[0] !== 'secure' || parts[1] !== 'token') return false;
  
  const timestamp = parseInt(parts[parts.length - 1]);
  return !isNaN(timestamp) && Date.now() - timestamp < 86400000; // 24 часа
}

// Основные функции
export const authService = {
  // Вход в систему
  async login(credentials, remember = false) {
    try {
      const response = await fetch(AUTH_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) throw new Error('Ошибка сервера');

      const data = await response.json();
      
      if (data.success) {
        const token = `secure-token-${Math.random().toString(36).slice(2)}-${Date.now()}`;
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        
        if (remember) {
          localStorage.setItem(AUTH_REMEMBER_KEY, JSON.stringify({
            username: credentials.username,
            expire: Date.now() + 604800000 // 7 дней
          }));
        }
        
        return true;
      }
      
      throw new Error(data.message || 'Неверные учетные данные');
    } catch (error) {
      console.error('Ошибка авторизации:', error);
      throw error;
    }
  },

  // Выход из системы
  logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_REMEMBER_KEY);
    window.location.href = `/app/login?reason=logout&t=${Date.now()}`;
  },

  // Проверка авторизации
  isAuthenticated() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    return isValidToken(token);
  },

  // Проверка с редиректом
  checkAuth() {
    if (!this.isAuthenticated()) {
      const returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/app/login?return=${returnUrl}`;
      return false;
    }
    return true;
  },

  // Получение сохраненного логина
  getRememberedUser() {
    const data = localStorage.getItem(AUTH_REMEMBER_KEY);
    if (!data) return null;
    
    try {
      const { username, expire } = JSON.parse(data);
      return Date.now() > expire ? null : username;
    } catch {
      return null;
    }
  }
};
