const AUTH_URL = 'https://functions.yandexcloud.net/d4eik4r1p7bna7gcok5j';
const TOKEN_KEY = 'gts_auth';

async function login(username, password) {
  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ login: username, password }),
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = '/auth/login.html';
}

function checkAuth() {
  return !!localStorage.getItem(TOKEN_KEY);
}

export { login, logout, checkAuth };
