const API_URL = "https://functions.yandexcloud.net/d4eik4r1p7bna7gcok5j";

function login() {
  const login = document.getElementById("loginInput").value;
  const password = document.getElementById("passwordInput").value;

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem("auth", "true");
        window.location.href = "/app/main";
      } else {
        document.getElementById("errorMessage").innerText = "Неверный логин или пароль.";
      }
    })
    .catch(() => {
      document.getElementById("errorMessage").innerText = "Ошибка соединения.";
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
