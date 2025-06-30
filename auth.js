/**
 * Система авторизации GTS ERP
 */

const API_ENDPOINT = 'https://functions.yandexcloud.net/d4eik4r1p7bna7gcok5j';

// Аутентификация пользователя
async function authenticateUser(username, password) {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'login',
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.token) {
            // Сохраняем токен и время его истечения
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('authExpiry', new Date().getTime() + (24 * 60 * 60 * 1000)); // 24 часа
            return { success: true };
        } else {
            return { success: false, message: data.message || 'Неверный логин или пароль' };
        }
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        return { success: false, message: 'Ошибка соединения с сервером' };
    }
}

// Проверка авторизации
async function checkAuth() {
    const token = localStorage.getItem('authToken');
    const expiry = localStorage.getItem('authExpiry');
    
    // Проверяем наличие и срок действия токена
    if (!token || !expiry || new Date().getTime() > parseInt(expiry)) {
        return false;
    }
    
    // Дополнительная проверка токена на сервере
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                action: 'validate'
            })
        });
        
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
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                action: 'userinfo'
            })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка получения информации о пользователе:', error);
        return null;
    }
}
