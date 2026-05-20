// Beans Cafe - Back to Top Button

document.addEventListener('DOMContentLoaded', function() {
    if (APP_CONFIG.FEATURES.backToTop) {
        createBackToTopButton();
    }
});

function createBackToTopButton() {
    // Check if button already exists
    if (document.querySelector('.back-to-top')) return;
    
    const button = document.createElement('button');
    button.className = 'back-to-top';
    button.innerHTML = '↑';
    button.setAttribute('aria-label', 'Back to top');
    
    document.body.appendChild(button);
    
    // Add styles
    addBackToTopStyles();
    
    // Show/hide based on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            button.classList.add('visible');
        } else {
            button.classList.remove('visible');
        }
    });
    
    // Click handler
    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

function addBackToTopStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .back-to-top {
            position: fixed;
            bottom: 20px;
            right: 90px;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: var(--primary, #C6A43F);
            color: var(--bg-primary, #0D0D0D);
            border: none;
            font-size: 24px;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 9998;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .back-to-top.visible {
            opacity: 1;
            visibility: visible;
        }
        
        .back-to-top:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }
        
        @media (max-width: 768px) {
            .back-to-top {
                bottom: 70px;
                right: 80px;
                width: 40px;
                height: 40px;
                font-size: 20px;
            }
        }
    `;
    document.head.appendChild(style);
}