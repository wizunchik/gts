const API_ENDPOINT = 'https://functions.yandexcloud.net/d4eik4r1p7bna7gcok5j';

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

        // Добавляем логирование ответа
        console.log('Auth response status:', response.status);
        const data = await response.json();
        console.log('Auth response data:', data);

        if (data.success && data.token) {
            // Сохраняем данные более надежно
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('authExpiry', Date.now() + 86400000); // 24 часа
            localStorage.setItem('userInfo', JSON.stringify(data.user));
            
            // Проверяем сохранение
            console.log('Stored token:', localStorage.getItem('authToken'));
            return { success: true };
        } else {
            return { 
                success: false, 
                message: data.message || 'Authentication failed' 
            };
        }
    } catch (error) {
        console.error('Auth error:', error);
        return { 
            success: false, 
            message: error.message || 'Connection error' 
        };
    }
}

async function checkAuth() {
    // Добавляем логирование проверки
    console.log('Checking auth...');
    const token = localStorage.getItem('authToken');
    const expiry = localStorage.getItem('authExpiry');
    
    console.log('Token from storage:', token);
    console.log('Expiry from storage:', expiry);

    if (!token || !expiry || Date.now() > parseInt(expiry)) {
        console.log('Auth check failed: no token or expired');
        return false;
    }
    
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Origin': 'https://geartechsol.com'
            },
            body: JSON.stringify({ action: 'validate' }),
            credentials: 'include',
            mode: 'cors'
        });

        console.log('Validation response status:', response.status);
        const data = await response.json();
        console.log('Validation response data:', data);

        return data.success === true;
    } catch (error) {
        console.error('Validation error:', error);
        return false;
    }
}
