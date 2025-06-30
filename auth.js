// Конфигурация
const AUTH_API_URL = 'https://functions.yandexcloud.net/d4eik4r1p7bna7gcok5j';
const AUTH_TOKEN_KEY = 'gts_auth_token';

// Проверка авторизации с редиректом
function checkAuthWithRedirect() {
  console.log('[Auth] Checking auth status...');
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  
  if (!token) {
    console.log('[Auth] No token found, redirecting to login');
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/app/login?return=${returnUrl}`;
    return false;
  }
  
  console.log('[Auth] Token exists:', token);
  return true;
}

// Экспорт функций
export const authService = {
  login: async (credentials) => {
    console.log('[Auth] Attempting login with:', credentials.username);
    try {
      const response = await fetch(AUTH_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();
      console.log('[Auth] Login response:', data);

      if (data.success) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        console.log('[Auth] Login successful, token saved');
        return true;
      }
      throw new Error(data.message || 'Login failed');
    } catch (error) {
      console.error('[Auth] Login error:', error);
      throw error;
    }
  },
  checkAuthWithRedirect
};
