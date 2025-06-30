/**
 * Система авторизации GTS ERP с поддержкой CORS
 */
const API_ENDPOINT = 'https://functions.yandexcloud.net/d4eik4r1p7bna7gcok5j';

// Аутентификация пользователя
async function authenticateUser(username, password) {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://geartechsol.com'
            },
            body: JSON.stringify({
                action: 'login',
                username: username,
                password: password
            }),
            credentials: 'include',
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.token) {
            // Сохраняем токен и время его истечения
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('authExpiry', Date.now() + (24 * 60 * 60 * 1000)); // 24 часа
            localStorage.setItem('userInfo', JSON.stringify(data.user));
            return { success: true };
        } else {
            return { 
                success: false, 
                message: data.message || 'Неверный логин или пароль' 
            };
        }
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        return { 
            success: false, 
            message: error.message || 'Ошибка соединения с сервером' 
        };
    }
}

// Проверка авторизации
async function checkAuth() {
    const token = localStorage.getItem('authToken');
    const expiry = localStorage.getItem('authExpiry');
    
    // Проверяем наличие и срок действия токена
    if (!token || !expiry || Date.now() > parseInt(expiry)) {
        return false;
    }
    
    // Дополнительная проверка токена на сервере
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Origin': 'https://geartechsol.com'
            },
            body: JSON.stringify({
                action: 'validate'
            }),
            credentials: 'include',
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.success === true;
    } catch (error) {
        console.error('Ошибка проверки токена:', error);
        return false;
    }
}

// Получение информации о пользователе
async function getUserInfo() {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Origin': 'https://geartechsol.com'
            },
            body: JSON.stringify({
                action: 'userinfo'
            }),
            credentials: 'include',
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Ошибка получения информации о пользователе:', error);
        // Возвращаем данные из localStorage, если запрос не удался
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    }
}

// Выход из системы
async function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authExpiry');
    localStorage.removeItem('userInfo');
    
    // Опционально: можно добавить вызов API для logout на сервере
    try {
        await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://geartechsol.com'
            },
            body: JSON.stringify({
                action: 'logout'
            }),
            credentials: 'include',
            mode: 'cors'
        });
    } catch (error) {
        console.error('Ошибка при выходе из системы:', error);
    }
}
