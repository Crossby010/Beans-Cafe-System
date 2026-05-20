// Beans Cafe - PWA Registration

if ('serviceWorker' in navigator && APP_CONFIG.FEATURES.pwa) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registered: ', registration);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

// Install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show install button (optional)
    showInstallPromotion();
});

function showInstallPromotion() {
    const installBanner = document.createElement('div');
    installBanner.className = 'install-banner';
    installBanner.innerHTML = `
        <div class="install-banner-content">
            <span>📱 Install Beans Cafe App</span>
            <button class="install-btn">Install</button>
            <button class="close-install">&times;</button>
        </div>
    `;
    
    document.body.appendChild(installBanner);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .install-banner {
            position: fixed;
            bottom: 80px;
            left: 20px;
            right: 20px;
            background: var(--bg-card, #1A1A1A);
            border: 1px solid var(--border, #333);
            border-radius: 12px;
            padding: 12px 16px;
            z-index: 10001;
            animation: slideUp 0.3s ease;
        }
        
        .install-banner-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .install-btn {
            background: var(--primary, #C6A43F);
            color: #000;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
        }
        
        .close-install {
            background: none;
            border: none;
            color: var(--text-secondary, #999);
            font-size: 20px;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
    
    const installBtn = installBanner.querySelector('.install-btn');
    const closeBtn = installBanner.querySelector('.close-install');
    
    installBtn.addEventListener('click', () => {
        installBanner.remove();
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
        });
    });
    
    closeBtn.addEventListener('click', () => {
        installBanner.remove();
    });
}