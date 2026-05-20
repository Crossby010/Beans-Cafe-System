// Beans Cafe - Admin Login
// Complete with loading states, error handling, and role-based redirect

const API_URL = 'https://beans-cafe-backend.onrender.com/api';

document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    const token = localStorage.getItem('admin_token');
    const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
    
    if (token && (user.role === 'admin' || user.role === 'staff')) {
        // Redirect based on role
        if (user.role === 'admin') {
            window.location.href = 'Dashboard.html';
        } else if (user.role === 'staff') {
            window.location.href = '../pos/index.html';
        }
        return;
    }
    
    // Setup login form
    const form = document.getElementById('admin-login-form');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
    
    // Setup password visibility toggle
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('admin-password');
    
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', function() {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }
    
    // Add enter key support
    const inputs = document.querySelectorAll('#admin-email, #admin-password');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const form = document.getElementById('admin-login-form');
                if (form) {
                    form.dispatchEvent(new Event('submit'));
                }
            }
        });
    });
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
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('.login-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        
        if (result.success && result.user) {
            // Check if user is admin OR staff
            if (result.user.role !== 'admin' && result.user.role !== 'staff') {
                showMessage('Access denied. Admin or Staff privileges required.', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            // Store admin session
            localStorage.setItem('admin_token', result.token);
            localStorage.setItem('admin_user', JSON.stringify(result.user));
            
            showMessage(`Login successful! Redirecting to ${result.user.role === 'admin' ? 'Dashboard' : 'POS'}...`, 'success');
            
            // Redirect based on role
            setTimeout(() => {
                if (result.user.role === 'admin') {
                    window.location.href = 'Dashboard.html';
                } else {
                    window.location.href = '../pos/index.html';
                }
            }, 1000);
        } else {
            const errorMsg = result.message || 'Invalid email or password';
            showMessage(errorMsg, 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            // Clear password field on error
            const passwordInput = document.getElementById('admin-password');
            if (passwordInput) passwordInput.value = '';
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function showMessage(message, type) {
    // Remove existing message
    const existingMsg = document.querySelector('.admin-message');
    if (existingMsg) existingMsg.remove();
    
    // Create message element
    const msgDiv = document.createElement('div');
    msgDiv.className = `admin-message message-${type}`;
    msgDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    
    // Add styles inline to ensure visibility
    msgDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 14px 24px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 9999;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
    `;
    
    if (type === 'success') {
        msgDiv.style.background = '#10b981';
        msgDiv.style.color = 'white';
    } else {
        msgDiv.style.background = '#ef4444';
        msgDiv.style.color = 'white';
    }
    
    document.body.appendChild(msgDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (msgDiv.parentNode) msgDiv.remove();
    }, 3000);
}

// Add animation keyframes if not already present
if (!document.querySelector('#login-animations')) {
    const style = document.createElement('style');
    style.id = 'login-animations';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes fadeOut {
            to {
                opacity: 0;
                visibility: hidden;
            }
        }
    `;
    document.head.appendChild(style);
}