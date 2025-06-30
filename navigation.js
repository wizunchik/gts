document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("nav");
  if (nav) {
    nav.innerHTML = `
      <button onclick="goHome()">🏠 Главная</button>
      <button onclick="logout()">🚪 Выйти</button>
    `;
  }
});

function goHome() {
  window.location.href = "/app/main";
}
