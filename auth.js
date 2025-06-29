const API_URL = 'https://functions.yandexcloud.net/your-function-id'; // замените на свою ЯФ

async function login() {
  const login = document.getElementById('login').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorEl = document.getElementById('error');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });

    const result = await response.json();

    if (result.success) {
      localStorage.setItem('auth', 'true');
      window.location.href = 'index.html'; // переадресация на главную
    } else {
      errorEl.textContent = result.message || 'Ошибка авторизации';
      errorEl.style.display = 'block';
    }
  } catch (e) {
    errorEl.textContent = 'Ошибка сети или сервера';
    errorEl.style.display = 'block';
  }
}
