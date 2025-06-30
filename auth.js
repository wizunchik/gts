console.log("auth.js загружен");

const API_URL = "https://functions.yandexcloud.net/d4eik4r1p7bna7gcok5j";

function login() {
  const login = document.getElementById("loginInput")?.value;
  const password = document.getElementById("passwordInput")?.value;

  if (!login || !password) {
    console.warn("Логин или пароль пустые");
    return;
  }

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password })
  })
    .then(res => {
      if (!res.ok) throw new Error("Ошибка сервера");
      return res.json();
    })
    .then(data => {
      if (data.success) {
        localStorage.setItem("auth", "true");
        window.location.href = "/app/main";
      } else {
        const errEl = document.getElementById("errorMessage");
        if (errEl) errEl.innerText = "Неверный логин или пароль.";
      }
    })
    .catch(err => {
      console.error("Ошибка при авторизации:", err);
      const errEl = document.getElementById("errorMessage");
      if (errEl) errEl.innerText = "Ошибка соединения.";
    });
}

function logout() {
  localStorage.removeItem("auth");
  window.location.href = "/app/login";
}

function checkAuth() {
  if (localStorage.getItem("auth") !== "true") {
    window.location.href = "/app/login";
  }
}

// Назначаем глобально
window.login = login;
window.logout = logout;
window.checkAuth = checkAuth;
