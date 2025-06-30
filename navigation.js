// Храним историю переходов
const navigationHistory = {
    previous: null,
    current: null
};

// Инициализация навигации
function initNavigation() {
    // Обновляем историю при загрузке страницы
    updateNavigationHistory();
    
    // Обработчик для кнопок с data-screen
    document.querySelectorAll('[data-screen]').forEach(button => {
        button.addEventListener('click', function() {
            navigationHistory.previous = navigationHistory.current;
            navigationHistory.current = window.location.pathname;
            showScreen(this.getAttribute('data-screen'));
        });
    });
    
    // Инициализируем кнопки в шапке
    initHeaderButtons();
}

// Обновляем историю навигации
function updateNavigationHistory() {
    navigationHistory.previous = sessionStorage.getItem('prevPage');
    navigationHistory.current = window.location.pathname;
    sessionStorage.setItem('prevPage', navigationHistory.current);
}

// Показываем нужный экран
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => {
        el.style.display = 'none';
    });
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.style.display = 'block';
    }
}

// Инициализация кнопок в шапке
function initHeaderButtons() {
    const header = document.querySelector('header.app-header');
    if (!header) return;
    
    // Очищаем старые кнопки
    const actionsContainer = header.querySelector('.header-actions');
    if (actionsContainer) {
        actionsContainer.innerHTML = '';
    } else {
        return;
    }
    
    // Определяем текущую страницу
    const isMainPage = window.location.pathname.endsWith('/main') || 
                      window.location.pathname.endsWith('/app/main') || 
                      window.location.pathname.endsWith('/app/');
    
    // Если мы на главной - только кнопка Выход
    if (isMainPage) {
        addLogoutButton(actionsContainer);
        return;
    }
    
    // Если есть предыдущая страница в истории - добавляем Назад
    if (navigationHistory.previous && 
        navigationHistory.previous.includes('/app/') && 
        !navigationHistory.previous.endsWith('/login')) {
        addBackButton(actionsContainer);
    }
    
    // Всегда добавляем Домой и Выход
    addHomeButton(actionsContainer);
    addLogoutButton(actionsContainer);
}

// Создаем кнопку Назад
function addBackButton(container) {
    const backBtn = document.createElement('button');
    backBtn.className = 'btn-nav btn-back';
    backBtn.innerHTML = '← Назад';
    backBtn.addEventListener('click', () => {
        window.location.href = navigationHistory.previous;
    });
    container.appendChild(backBtn);
}

// Создаем кнопку Домой
function addHomeButton(container) {
    const homeBtn = document.createElement('button');
    homeBtn.className = 'btn-nav btn-home';
    homeBtn.innerHTML = 'Домой';
    homeBtn.addEventListener('click', () => {
        window.location.href = '/app/main';
    });
    container.appendChild(homeBtn);
}

// Создаем кнопку Выход
function addLogoutButton(container) {
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn-nav btn-logout';
    logoutBtn.innerHTML = 'Выход';
    logoutBtn.addEventListener('click', () => {
        // Предполагается, что authService доступен глобально
        if (typeof authService !== 'undefined') {
            authService.logout();
        } else {
            window.location.href = '/app/login';
        }
    });
    container.appendChild(logoutBtn);
}

export { initNavigation, showScreen };
