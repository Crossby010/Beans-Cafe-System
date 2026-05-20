// Beans Cafe - Dark/Light Mode Toggle
// Supports multiple themes with easy client customization

function getThemeCssPath(themeFile) {
    const path = window.location.pathname;
    // If we're in /pos/ folder, go up one level to root, then to website/css/themes/
    if (path.includes('/pos/')) {
        return '/website/css/themes/' + themeFile;
    }
    // If we're in /pages/ or /admin/ folder
    if (path.includes('/pages/') || path.includes('/admin/')) {
        return '../css/themes/' + themeFile;
    }
    // Root directory
    return 'css/themes/' + themeFile;
}

// Theme definitions - ALL THREE THEMES (with dynamic paths)
const THEMES = {
    'coffee': {
        name: 'Coffee',
        icon: '☕',
        get css() { return getThemeCssPath('coffee.css'); }
    },
    'dark-premium': {
        name: 'Dark Premium',
        icon: '🌙',
        get css() { return getThemeCssPath('dark-premium.css'); }
    },
    'modern-light': {
        name: 'Modern Light',
        icon: '☀️',
        get css() { return getThemeCssPath('modern-light.css'); }
    }
};

// Initialize theme system
document.addEventListener('DOMContentLoaded', function() {
    initThemeSwitcher();
    loadSavedTheme();
});

// Create theme switcher button
function initThemeSwitcher() {
    // Check if switcher already exists
    if (document.querySelector('.theme-switcher')) return;
    
    // Create theme switcher container
    const switcher = document.createElement('div');
    switcher.className = 'theme-switcher';
    switcher.innerHTML = `
        <button class="theme-toggle-btn" id="themeToggleBtn">
            <span class="theme-icon">🌙</span>
        </button>
        <div class="theme-menu" id="themeMenu">
            <div class="theme-menu-header">
                <h4>Choose Theme</h4>
                <button class="close-theme-menu">&times;</button>
            </div>
            <div class="theme-options">
                ${Object.entries(THEMES).map(([key, theme]) => `
                    <button class="theme-option" data-theme="${key}">
                        <span>${theme.icon}</span>
                        <span>${theme.name}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(switcher);
    
    // Add styles for theme switcher
    addSwitcherStyles();
    
    // Setup event listeners
    setupSwitcherEvents();
}

// Add styles for the theme switcher
function addSwitcherStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .theme-switcher {
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 9999;
        }
        
        .theme-toggle-btn {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--bg-card, #1A1A1A);
            border: 1px solid var(--border, #333);
            color: var(--primary, #C6A43F);
            font-size: 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            box-shadow: var(--shadow, 0 4px 12px rgba(0,0,0,0.1));
        }
        
        .theme-toggle-btn:hover {
            transform: scale(1.1);
            border-color: var(--primary, #C6A43F);
        }
        
        .theme-menu {
            position: absolute;
            bottom: 60px;
            left: 0;
            background: var(--bg-card, #1A1A1A);
            border: 1px solid var(--border, #333);
            border-radius: 12px;
            padding: 12px;
            min-width: 160px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(10px);
            transition: all 0.3s ease;
            box-shadow: var(--shadow-lg, 0 8px 24px rgba(0,0,0,0.2));
        }
        
        .theme-menu.active {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
        
        .theme-menu-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 8px;
            margin-bottom: 8px;
            border-bottom: 1px solid var(--border, #333);
        }
        
        .theme-menu-header h4 {
            margin: 0;
            font-size: 14px;
            color: var(--text-primary, #fff);
        }
        
        .close-theme-menu {
            background: none;
            border: none;
            color: var(--text-secondary, #999);
            font-size: 20px;
            cursor: pointer;
        }
        
        .theme-options {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        
        .theme-option {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            background: none;
            border: none;
            border-radius: 8px;
            color: var(--text-primary, #fff);
            cursor: pointer;
            transition: all 0.2s ease;
            width: 100%;
            text-align: left;
        }
        
        .theme-option:hover {
            background: rgba(198, 164, 63, 0.1);
        }
        
        .theme-option.active {
            background: var(--primary, #C6A43F);
            color: #000;
        }
        
        @media (max-width: 768px) {
            .theme-switcher {
                bottom: 70px;
                left: 16px;
            }
        }
    `;
    document.head.appendChild(style);
}

// Setup theme switcher event listeners
function setupSwitcherEvents() {
    const toggleBtn = document.getElementById('themeToggleBtn');
    const themeMenu = document.getElementById('themeMenu');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            themeMenu.classList.toggle('active');
        });
    }
    
    // Close menu when clicking close button
    const closeBtn = document.querySelector('.close-theme-menu');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            themeMenu.classList.remove('active');
        });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.theme-switcher')) {
            if (themeMenu) themeMenu.classList.remove('active');
        }
    });
    
    // Theme option click handlers
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.getAttribute('data-theme');
            switchTheme(theme);
            themeMenu.classList.remove('active');
            
            // Update active state
            themeOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            // Update toggle button icon
            const themeIcon = document.querySelector('.theme-icon');
            if (themeIcon && THEMES[theme]) {
                themeIcon.textContent = THEMES[theme].icon;
            }
        });
    });
}

// Switch theme
function switchTheme(themeName) {
    if (!THEMES[themeName]) return;
    
    // Remove existing theme link
    const existingTheme = document.querySelector('link[data-theme]');
    if (existingTheme) {
        existingTheme.remove();
    }
    
    // Add new theme CSS
    const themeLink = document.createElement('link');
    themeLink.rel = 'stylesheet';
    themeLink.href = THEMES[themeName].css;
    themeLink.setAttribute('data-theme', themeName);
    document.head.appendChild(themeLink);
    
    // Save to localStorage
    localStorage.setItem('beans_theme', themeName);
    
    // Update body class
    document.body.classList.remove('theme-coffee', 'theme-dark-premium', 'theme-modern-light');
    document.body.classList.add(`theme-${themeName}`);
    
    // Dispatch event for other scripts
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeName } }));
}

// Load saved theme
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('beans_theme');
    const defaultTheme = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.THEME) ? APP_CONFIG.THEME : 'dark-premium';
    const themeToLoad = savedTheme || defaultTheme;
    
    if (THEMES[themeToLoad]) {
        switchTheme(themeToLoad);
        
        // Update active state in menu
        const activeOption = document.querySelector(`.theme-option[data-theme="${themeToLoad}"]`);
        if (activeOption) {
            activeOption.classList.add('active');
        }
        
        // Update toggle button icon
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon && THEMES[themeToLoad]) {
            themeIcon.textContent = THEMES[themeToLoad].icon;
        }
    }
}

// Auto-detect system preference (optional)
function detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        if (!localStorage.getItem('beans_theme')) {
            switchTheme('dark-premium');
        }
    }
}

// Listen for system theme changes
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('beans_theme')) {
            switchTheme(e.matches ? 'dark-premium' : 'modern-light');
        }
    });
}