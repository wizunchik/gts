// Инициализация навигации
function initNavigation() {
    // Создаем основную панель навигации
    const navPanel = document.createElement('nav');
    navPanel.className = 'app-navigation';
    
    const navContent = document.createElement('div');
    navContent.className = 'nav-content';
    
    const navActions = document.createElement('div');
    navActions.className = 'nav-actions';
    
    // Добавляем кнопки (только "Выход" для главной страницы)
    if (!isMainPage()) {
        addNavButton(navActions, 'Главная', '/app/main', 'home');
    }
    
    // Важно: создаем кнопку выхода с правильным обработчиком
    const logoutBtn = addNavButton(navActions, 'Выход', '', 'logout', true);
    setupLogoutHandler(logoutBtn);
    
    // Собираем структуру
    navContent.appendChild(navActions);
    navPanel.appendChild(navContent);
    document.body.insertBefore(navPanel, document.body.firstChild);
}

// Проверка главной страницы
function isMainPage() {
    const path = window.location.pathname;
    return path.endsWith('/main') || path.endsWith('/app/main') || path.endsWith('/app/');
}

// Создание кнопки навигации
function addNavButton(container, text, url, icon, isButton = false) {
    const btn = isButton ? document.createElement('button') : document.createElement('a');
    btn.className = `nav-btn btn-${icon}`;
    
    if (!isButton && url) {
        btn.href = url;
    }
    
    btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            ${getIconSvg(icon)}
        </svg>
        <span>${text}</span>
    `;
    
    container.appendChild(btn);
    return btn;
}

// SVG для иконок
function getIconSvg(icon) {
    const icons = {
        home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>',
        logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>'
    };
    return icons[icon] || '';
}

// Обработчик выхода
function setupLogoutHandler(button) {
    button.addEventListener('click', async () => {
        try {
            // Проверяем наличие authService
            if (window.authService && typeof window.authService.logout === 'function') {
                await window.authService.logout();
            } else {
                // Резервный вариант, если authService не доступен
                localStorage.removeItem('gts_auth_token');
                localStorage.removeItem('gts_remember_data');
                window.location.href = '/app/login';
            }
        } catch (error) {
            console.error('Ошибка при выходе:', error);
            window.location.href = '/app/login';
        }
    });
}

export { initNavigation };
