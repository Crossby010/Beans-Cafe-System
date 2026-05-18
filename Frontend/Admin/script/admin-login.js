// Beans Cafe - Admin Login

const API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    const token = localStorage.getItem('admin_token');
    const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
    
    if (token && user.role === 'admin') {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Setup login form
    const form = document.getElementById('admin-login-form');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    
    // Validation
    if (!email || !password) {
        showMessage('Please enter email and password', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('#admin-login-form button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    
    try {
        console.log('Attempting login for:', email);
        
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        console.log('Login response:', result);
        
        if (result.success && result.user && result.user.role === 'admin') {
            // Store admin session
            localStorage.setItem('admin_token', result.token);
            localStorage.setItem('admin_user', JSON.stringify(result.user));
            
            showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            const errorMsg = result.message || 'Invalid credentials or not an admin user';
            showMessage(errorMsg, 'error');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Network error. Please make sure backend is running on port 5000', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function showMessage(message, type) {
    // Remove existing message
    const existingMsg = document.querySelector('.admin-message');
    if (existingMsg) existingMsg.remove();
    
    // Create message element
    const msgDiv = document.createElement('div');
    msgDiv.className = 'admin-message';
    msgDiv.textContent = message;
    msgDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 9999;
        font-weight: 500;
    `;
    
    document.body.appendChild(msgDiv);
    
    setTimeout(() => {
        if (msgDiv.parentNode) msgDiv.remove();
    }, 3000);
}