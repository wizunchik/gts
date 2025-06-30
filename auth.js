// Конфигурация
const AUTH_API_URL = 'https://functions.yandexcloud.net/d4eik4r1p7bna7gcok5j';
const AUTH_TOKEN_KEY = 'gts_auth_token';
const AUTH_REMEMBER_KEY = 'gts_remember_data';

// Генерация токена
const generateToken = () => `secure-token-${Math.random().toString(36).slice(2)}-${Date.now()}`;

// Проверка валидности токена
const isValidToken = (token) => {
  if (!token) return false;
  const parts = token.split('-');
  return parts.length >= 4 && 
         parts[0] === 'secure' && 
         parts[1] === 'token' &&
         !isNaN(parseInt(parts[parts.length - 1])) &&
         Date.now() - parseInt(parts[parts.length - 1]) < 86400000; // 24 часа
};

export const authService = {
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
        const token = generateToken();
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
      console.error('Auth error:', error);
      throw error;
    }
  },

  logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_REMEMBER_KEY);
    window.location.href = `/app/login?reason=logout&t=${Date.now()}`;
  },

  isAuthenticated() {
    return isValidToken(localStorage.getItem(AUTH_TOKEN_KEY));
  },

  checkAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = `/app/login?return=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }
    return true;
  },

  getRememberedUser() {
    try {
      const data = JSON.parse(localStorage.getItem(AUTH_REMEMBER_KEY) || 'null');
      return data && Date.now() < data.expire ? data.username : null;
    } catch {
      return null;
    }
  }
};
