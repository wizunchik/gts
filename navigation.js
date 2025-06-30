/**
 * Система навигации GTS ERP
 * Поддерживает кнопки: home, logout
 */

// Инициализация навигации
function initNavigation(buttons = []) {
    const navContainer = document.getElementById('navContainer');
    if (!navContainer) return;
    
    navContainer.innerHTML = '';
    
    const navButtons = document.createElement('div');
    navButtons.className = 'nav-buttons';
    
    buttons.forEach(buttonType => {
        switch(buttonType) {
            case 'home':
                const homeBtn = document.createElement('button');
                homeBtn.className = 'nav-btn nav-btn-home';
                homeBtn.innerHTML = '🏠 Главная';
                homeBtn.onclick = () => window.location.href = '/app/main';
                navButtons.appendChild(homeBtn);
                break;
                
            case 'logout':
                const logoutBtn = document.createElement('button');
                logoutBtn.className = 'nav-btn nav-btn-logout';
                logoutBtn.innerHTML = '🚪 Выход';
                logoutBtn.onclick = logoutUser;
                navButtons.appendChild(logoutBtn);
                break;
        }
    });
    
    navContainer.appendChild(navButtons);
}

// Выход из системы
async function logoutUser() {
    try {
        // Очищаем данные авторизации
        localStorage.removeItem('authToken');
        localStorage.removeItem('authExpiry');
        
        // Перенаправляем на страницу входа
        window.location.href = '/app/login';
    } catch (error) {
        console.error('Ошибка при выходе из системы:', error);
        alert('Произошла ошибка при выходе из системы');
    }
}
