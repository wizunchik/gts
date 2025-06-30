document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("nav");
  if (nav) {
    nav.innerHTML = `
      <button onclick="window.location.href='/app/main'" style="margin-right: 10px">🏠 Главная</button>
      <button onclick="logout()">🚪 Выход</button>
    `;
  }
});
