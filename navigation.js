document.addEventListener("DOMContentLoaded", () => {
  const layout = document.querySelector(".app-layout");

  if (layout && !document.querySelector(".sidebar")) {
    const sidebar = document.createElement("aside");
    sidebar.className = "sidebar";
    sidebar.innerHTML = `
      <div class="sidebar-logo">
        <img src="https://static.tildacdn.com/tild6130-3163-4265-b363-383632316137/GTS_LOGO_BLACK.png" alt="GTS Logo" />
      </div>
      <nav class="sidebar-nav">
        <a href="/app/main">Main</a>
        <a href="/app/purchase">Purchases</a>
        <a href="/app/supplies">Receiving</a>
        <a href="/app/shipments">Shipments</a>
        <a href="/app/reports">Reports</a>
        <a href="/app/settings">Settings</a>
      </nav>
    `;
    layout.prepend(sidebar);
  }

  // Кнопка Выход в topbar
  const topbar = document.querySelector(".topbar");
  if (topbar && !topbar.querySelector("button")) {
    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "Выход";
    logoutBtn.onclick = () => logout();
    topbar.appendChild(logoutBtn);
  }

  // Гамбургер
  const toggle = document.querySelector(".menu-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const sidebar = document.querySelector(".sidebar");
      sidebar.classList.toggle("open");
      document.body.classList.toggle("menu-open", sidebar.classList.contains("open"));
    });
  }

  // Клик вне меню
  document.addEventListener("click", (e) => {
    const sidebar = document.querySelector(".sidebar");
    const toggle = document.querySelector(".menu-toggle");
    if (
      sidebar &&
      sidebar.classList.contains("open") &&
      !sidebar.contains(e.target) &&
      e.target !== toggle
    ) {
      sidebar.classList.remove("open");
      document.body.classList.remove("menu-open");
    }
  });

  // Закрытие при переходе по ссылке
  document.querySelectorAll(".sidebar-nav a").forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        document.querySelector(".sidebar").classList.remove("open");
        document.body.classList.remove("menu-open");
      }
    });
  });
});
