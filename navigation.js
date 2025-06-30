// Инициализация навигации
function initNavigation() {
    // Обновляем текущую страницу в sessionStorage
    sessionStorage.setItem('currentPage', window.location.pathname);
    
    // Инициализируем кнопки в шапке
    initHeaderButtons();
}

// Инициализация кнопок в шапке
function initHeaderButtons() {
    const header = document.querySelector('header.app-header');
    if (!header) return;
    
    const actionsContainer = header.querySelector('.header-actions');
    if (!actionsContainer) return;
    
    // Очищаем старые кнопки
    actionsContainer.innerHTML = '';
    
    // Проверяем, главная ли это страница
    const isMainPage = ['/main', '/app/main', '/app/'].some(path => 
        window.location.pathname.endsWith(path));
    
    // Если не главная - добавляем кнопку "Домой"
    if (!isMainPage) {
        addHomeButton(actionsContainer);
    }
    
    // Всегда добавляем кнопку "Выход"
    addLogoutButton(actionsContainer);
}

// Создаем кнопку Домой
function addHomeButton(container) {
    const homeBtn = document.createElement('button');
    homeBtn.className = 'btn-nav btn-home';
    homeBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        Главная
    `;
    homeBtn.addEventListener('click', () => {
        window.location.href = '/app/main';
    });
    container.appendChild(homeBtn);
}

// Создаем кнопку Выход
function addLogoutButton(container) {
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn-nav btn-logout';
    logoutBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Выход
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

// Показываем нужный экран (если используется SPA-подход)
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => {
        el.style.display = 'none';
    });
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.style.display = 'block';
    }
}

export { initNavigation, showScreen };
