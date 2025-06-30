export const authService = {
  login: async (credentials, remember) => {
    const response = await fetch('https://functions.yandexcloud.net/d4eaul7sebrbl8k79qjq?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const { message } = await response.json();
      throw new Error(message || 'Неверный логин или пароль');
    }

    const { token } = await response.json();
    localStorage.setItem('auth_token', token);

    if (remember) {
      localStorage.setItem('remembered_user', credentials.username);
    } else {
      localStorage.removeItem('remembered_user');
    }

    return true;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/app/login?reason=logged_out';
  },

  isAuthenticated: () => {
    return Boolean(localStorage.getItem('auth_token'));
  },

  getToken: () => {
    return localStorage.getItem('auth_token');
  },

  getRememberedUser: () => {
    return localStorage.getItem('remembered_user');
  },

  checkAuthOrRedirect: () => {
    if (!authService.isAuthenticated()) {
      const returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/app/login?reason=session_expired&return=${returnUrl}`;
    }
  }
};
