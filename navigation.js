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
        <a href="/app/main">Главная</a>
        <a href="/app/supplies">Приёмки</a>
        <a href="/app/shipments">Отгрузки</a>
        <a href="/app/reports">Отчёты</a>
        <a href="/app/settings">Настройки</a>
      </nav>
    `;
    layout.prepend(sidebar);
  }

  const topbar = document.querySelector(".topbar");
  if (topbar && !topbar.querySelector(".menu-toggle")) {
    const toggle = document.createElement("span");
    toggle.className = "menu-toggle";
    toggle.textContent = "☰";
    toggle.style.fontSize = "24px";
    toggle.style.cursor = "pointer";
    toggle.style.marginRight = "16px";
    toggle.onclick = () => {
      document.querySelector(".sidebar").classList.toggle("open");
    };
    topbar.prepend(toggle);
  }

  if (topbar && !topbar.querySelector("button")) {
    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "Выход";
    logoutBtn.onclick = () => logout();
    topbar.appendChild(logoutBtn);
  }
});
