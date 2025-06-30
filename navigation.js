// Инициализация навигации
function initNavigation() {
    // Создаем контейнер для навигации если его нет
    let navContainer = document.getElementById('navContainer');
    if (!navContainer) {
        navContainer = document.createElement('div');
        navContainer.id = 'navContainer';
        navContainer.className = 'navigation-container';
        document.body.insertBefore(navContainer, document.body.firstChild);
    }

    // Создаем панель навигации
    const navPanel = document.createElement('div');
    navPanel.className = 'nav-panel';
    
    // Добавляем кнопки
    addHomeButton(navPanel);
    addLogoutButton(navPanel);
    
    // Очищаем и добавляем новую панель
    navContainer.innerHTML = '';
    navContainer.appendChild(navPanel);
}

// Создаем кнопку Домой
function addHomeButton(container) {
    const homeBtn = document.createElement('a');
    homeBtn.className = 'nav-btn btn-home';
    homeBtn.href = '/app/main';
    homeBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>Главная</span>
    `;
    container.appendChild(homeBtn);
}

// Создаем кнопку Выход
function addLogoutButton(container) {
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'nav-btn btn-logout';
    logoutBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>Выход</span>
    `;
    logoutBtn.addEventListener('click', () => {
        if (window.authService) {
            window.authService.logout();
        } else {
            window.location.href = '/app/login';
        }
    });
    container.appendChild(logoutBtn);
}

export { initNavigation };
