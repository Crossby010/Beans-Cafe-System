// Beans Cafe - Cookie Consent Banner
// GDPR compliant cookie consent

document.addEventListener('DOMContentLoaded', function() {
    if (APP_CONFIG.FEATURES.cookieConsent) {
        initCookieConsent();
    }
});

function initCookieConsent() {
    // Check if already consented
    if (localStorage.getItem('cookie_consent')) {
        return;
    }
    
    createCookieBanner();
}

function createCookieBanner() {
    const banner = document.createElement('div');
    banner.className = 'cookie-consent';
    banner.innerHTML = `
        <div class="cookie-content">
            <div class="cookie-text">
                <strong>🍪 Cookie Consent</strong>
                <p>We use cookies to enhance your experience, analyze site traffic, and serve personalized content.</p>
            </div>
            <div class="cookie-buttons">
                <button class="cookie-btn cookie-settings">Settings</button>
                <button class="cookie-btn cookie-decline">Decline</button>
                <button class="cookie-btn cookie-accept">Accept All</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(banner);
    
    // Add styles
    addCookieStyles();
    
    // Setup event listeners
    const acceptBtn = banner.querySelector('.cookie-accept');
    const declineBtn = banner.querySelector('.cookie-decline');
    const settingsBtn = banner.querySelector('.cookie-settings');
    
    acceptBtn.addEventListener('click', () => {
        acceptAllCookies();
        banner.remove();
    });
    
    declineBtn.addEventListener('click', () => {
        declineCookies();
        banner.remove();
    });
    
    settingsBtn.addEventListener('click', () => {
        showCookieSettings();
    });
}

function addCookieStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .cookie-consent {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: var(--bg-card, #1A1A1A);
            border: 1px solid var(--border, #333);
            border-radius: 12px;
            padding: 16px 20px;
            z-index: 10000;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
            from {
                transform: translateY(100px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        .cookie-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
        }
        
        .cookie-text {
            flex: 1;
        }
        
        .cookie-text strong {
            display: block;
            margin-bottom: 4px;
            color: var(--primary, #C6A43F);
        }
        
        .cookie-text p {
            margin: 0;
            font-size: 13px;
            color: var(--text-secondary, #B0B0B0);
        }
        
        .cookie-buttons {
            display: flex;
            gap: 10px;
        }
        
        .cookie-btn {
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        
        .cookie-accept {
            background: var(--primary, #C6A43F);
            color: #000;
            border: none;
        }
        
        .cookie-decline {
            background: transparent;
            border: 1px solid var(--border, #333);
            color: var(--text-secondary, #B0B0B0);
        }
        
        .cookie-settings {
            background: transparent;
            border: 1px solid var(--border, #333);
            color: var(--text-secondary, #B0B0B0);
        }
        
        .cookie-btn:hover {
            transform: translateY(-2px);
        }
        
        /* Cookie Settings Modal */
        .cookie-settings-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            animation: fadeIn 0.3s ease;
        }
        
        .cookie-settings-content {
            background: var(--bg-card, #1A1A1A);
            border: 1px solid var(--border, #333);
            border-radius: 16px;
            padding: 24px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .cookie-setting-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid var(--border, #333);
        }
        
        .cookie-setting-item:last-child {
            border-bottom: none;
        }
        
        .cookie-switch {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 24px;
        }
        
        .cookie-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .cookie-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: 0.3s;
            border-radius: 24px;
        }
        
        .cookie-slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: 0.3s;
            border-radius: 50%;
        }
        
        input:checked + .cookie-slider {
            background-color: var(--primary, #C6A43F);
        }
        
        input:checked + .cookie-slider:before {
            transform: translateX(26px);
        }
        
        @media (max-width: 768px) {
            .cookie-content {
                flex-direction: column;
                text-align: center;
            }
            
            .cookie-buttons {
                width: 100%;
                justify-content: center;
            }
            
            .cookie-consent {
                left: 10px;
                right: 10px;
                bottom: 10px;
            }
        }
    `;
    document.head.appendChild(style);
}

function acceptAllCookies() {
    localStorage.setItem('cookie_consent', 'all');
    localStorage.setItem('cookie_preferences', JSON.stringify({
        necessary: true,
        analytics: true,
        marketing: true
    }));
    enableAnalytics();
}

function declineCookies() {
    localStorage.setItem('cookie_consent', 'necessary');
    localStorage.setItem('cookie_preferences', JSON.stringify({
        necessary: true,
        analytics: false,
        marketing: false
    }));
}

function showCookieSettings() {
    const modal = document.createElement('div');
    modal.className = 'cookie-settings-modal';
    modal.innerHTML = `
        <div class="cookie-settings-content">
            <h3 style="margin-bottom: 20px; color: var(--primary, #C6A43F);">Cookie Preferences</h3>
            <div class="cookie-setting-item">
                <div>
                    <strong>Necessary Cookies</strong>
                    <p style="font-size: 12px; margin-top: 4px;">Required for the website to function</p>
                </div>
                <label class="cookie-switch">
                    <input type="checkbox" id="cookie-necessary" checked disabled>
                    <span class="cookie-slider"></span>
                </label>
            </div>
            <div class="cookie-setting-item">
                <div>
                    <strong>Analytics Cookies</strong>
                    <p style="font-size: 12px; margin-top: 4px;">Help us improve our website</p>
                </div>
                <label class="cookie-switch">
                    <input type="checkbox" id="cookie-analytics">
                    <span class="cookie-slider"></span>
                </label>
            </div>
            <div class="cookie-setting-item">
                <div>
                    <strong>Marketing Cookies</strong>
                    <p style="font-size: 12px; margin-top: 4px;">Used for personalized ads</p>
                </div>
                <label class="cookie-switch">
                    <input type="checkbox" id="cookie-marketing">
                    <span class="cookie-slider"></span>
                </label>
            </div>
            <div class="cookie-buttons" style="margin-top: 24px;">
                <button class="cookie-btn cookie-decline" id="cookie-save-preferences">Save Preferences</button>
                <button class="cookie-btn cookie-accept" id="cookie-accept-all">Accept All</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load saved preferences
    const saved = localStorage.getItem('cookie_preferences');
    if (saved) {
        const prefs = JSON.parse(saved);
        const analyticsCheck = document.getElementById('cookie-analytics');
        const marketingCheck = document.getElementById('cookie-marketing');
        if (analyticsCheck) analyticsCheck.checked = prefs.analytics;
        if (marketingCheck) marketingCheck.checked = prefs.marketing;
    }
    
    document.getElementById('cookie-save-preferences').addEventListener('click', () => {
        const analytics = document.getElementById('cookie-analytics').checked;
        const marketing = document.getElementById('cookie-marketing').checked;
        
        localStorage.setItem('cookie_consent', 'custom');
        localStorage.setItem('cookie_preferences', JSON.stringify({
            necessary: true,
            analytics: analytics,
            marketing: marketing
        }));
        
        if (analytics) enableAnalytics();
        modal.remove();
    });
    
    document.getElementById('cookie-accept-all').addEventListener('click', () => {
        acceptAllCookies();
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function enableAnalytics() {
    // Add Google Analytics or other analytics here
    console.log('Analytics enabled');
}