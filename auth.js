// Конфигурация
const AUTH_API_URL = 'https://functions.yandexcloud.net/d4eik4r1p7bna7gcok5j';
const AUTH_TOKEN_KEY = 'gts_auth_token';
const AUTH_REMEMBER_KEY = 'gts_remember_data';

// Проверка валидности токена
function isValidToken(token) {
  if (!token) return false;
  
  // Проверяем структуру токена и временную метку
  const tokenParts = token.split('-');
  const timestamp = parseInt(tokenParts[tokenParts.length - 1]);
  
  return (
    token.startsWith('secure-token-') && 
    token.length > 20 &&
    !isNaN(timestamp) &&
    Date.now() - timestamp < 86400000 // 24 часа
  );
}

// Основные функции
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
        const token = data.token;
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

  logout() {
    // Полная очистка с принудительным редиректом
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_REMEMBER_KEY);
    sessionStorage.clear();
    window.location.href = `/app/login?r=${Date.now()}&reason=logged_out`;
  },

  checkAuth() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    return isValidToken(token);
  },

  checkAuthWithRedirect() {
    if (!this.checkAuth()) {
      const returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/app/login?return=${returnUrl}`;
      return false;
    }
    return true;
  },

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

// Автопроверка при загрузке модуля (кроме страницы логина)
if (!window.location.pathname.includes('/app/login')) {
  authService.checkAuthWithRedirect();
}
