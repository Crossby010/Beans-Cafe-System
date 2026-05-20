// Beans Cafe - Main JavaScript (UPDATED)

// API Base URL - Using config
const API_URL = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.API_URL : 'https://beans-cafe-backend.onrender.com/api';
const API_MODE = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.API_MODE : 'real';

// Global base URL for navigation
window.BASE_URL = window.location.origin;

// Setup navigation when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - Beans Cafe v2');
    
    // Setup all navigation links
    setupNavigation();
    
    // Load featured products (only on homepage)
    if (document.getElementById('featured-products')) {
        loadFeaturedProducts();
    }
    
    // Update cart count
    updateCartCount();
    
    // Load cafe settings
    loadCafeSettings();
    
    // Check URL hash on load (for homepage sections)
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        checkHash();
    }
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Fix mobile video
    fixMobileVideo();
});

// Setup navigation for all section links
function setupNavigation() {
    // Home page section links (data-section)
    const sectionLinks = document.querySelectorAll('[data-section]');
    
    sectionLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
        });
    });
    
    // Also handle nav links with data-section
    const navLinks = document.querySelectorAll('.nav-links a[data-section]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
        });
    });
}

// Show specific section (for homepage)
function showSection(sectionId) {
    // Hide all sections
    const sections = ['home', 'howto', 'about', 'gallery'];
    sections.forEach(id => {
        const section = document.getElementById(`${id}-section`);
        if (section) {
            section.classList.remove('active');
        }
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Scroll to section
        setTimeout(() => {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
    
    // Update active class on nav links
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Find and highlight active nav link
    const activeLink = document.querySelector(`.nav-links a[data-section="${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Update URL hash without reload
    window.location.hash = sectionId;
}

// Check URL hash on load
function checkHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'howto' || hash === 'about' || hash === 'gallery') {
        showSection(hash);
    } else {
        showSection('home');
    }
}

// Handle hash change (browser back/forward)
window.addEventListener('hashchange', function() {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'howto' || hash === 'about' || hash === 'gallery') {
        showSection(hash);
    } else if (!hash || hash === 'home') {
        showSection('home');
    }
});

// Load featured products from API
async function loadFeaturedProducts() {
    const productsContainer = document.getElementById('featured-products');
    if (!productsContainer) return;
    
    try {
        let products = [];
        
        if (API_MODE === 'mock') {
            if (typeof MOCK_DATA !== 'undefined') {
                products = MOCK_DATA.products.filter(p => p.is_featured === true).slice(0, 4);
            }
        } else {
            const response = await fetch(`${API_URL}/products`);
            const data = await response.json();
            // Get products that are featured, fallback to first 4 products if none featured
            const featuredProducts = data.products ? data.products.filter(p => p.is_featured === true) : [];
            if (featuredProducts.length > 0) {
                products = featuredProducts.slice(0, 4);
            } else {
                // If no featured products, show first 4 products
                products = (data.products || []).slice(0, 4);
            }
        }
        
        if (products.length === 0) {
            productsContainer.innerHTML = '<div class="loading">No products available</div>';
            return;
        }
        
        const placeholderImage = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop';
        
        productsContainer.innerHTML = products.map(product => `
            <div class="product-card" onclick="goToProduct(${product.id})">
                <img src="${product.image_url || placeholderImage}" 
                     alt="${escapeHtml(product.name)}" 
                     class="product-image"
                     loading="lazy"
                     onerror="this.src='${placeholderImage}'">
                <div class="product-info">
                    <h3 class="product-title">${escapeHtml(product.name)}</h3>
                    <p class="product-price">₱${parseFloat(product.price).toFixed(2)}</p>
                    <button class="product-btn" onclick="event.stopPropagation(); addToCartFromProduct(${product.id})">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
        
        // Refresh animations for new content
        if (typeof refreshAnimations === 'function') {
            refreshAnimations();
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
        productsContainer.innerHTML = '<div class="loading">Unable to load menu. Please try again later.</div>';
    }
}

// Go to product customization page
function goToProduct(productId) {
    if (productId) {
        window.location.href = `pages/customize.html?id=${productId}`;
    }
}

// Add to cart from homepage
async function addToCartFromProduct(productId) {
    try {
        let product;
        
        if (API_MODE === 'mock') {
            if (typeof MOCK_DATA !== 'undefined') {
                product = MOCK_DATA.products.find(p => p.id === productId);
            }
        } else {
            const response = await fetch(`${API_URL}/products/${productId}`);
            const data = await response.json();
            product = data.product;
        }
        
        if (product && typeof addToCart === 'function') {
            addToCart(product);
            showMessage(`${product.name} added to cart!`, 'success');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showMessage('Failed to add to cart', 'error');
    }
}

// Load cafe settings from backend
async function loadCafeSettings() {
    try {
        let settings = {};
        
        if (API_MODE === 'mock') {
            if (typeof MOCK_DATA !== 'undefined') {
                settings = MOCK_DATA.settings;
            }
        } else {
            const response = await fetch(`${API_URL}/settings/public`);
            const data = await response.json();
            settings = data.settings || {};
        }
        
        // Update cafe name
        const cafeNameElements = document.querySelectorAll('.cafe-name');
        cafeNameElements.forEach(el => {
            if (el.tagName === 'A') {
                const name = settings.cafe_name || 'Beans Cafe';
                if (el.querySelector('span')) {
                    const span = el.querySelector('span');
                    span.textContent = name;
                } else {
                    el.innerHTML = `<i class="fas fa-mug-hot"></i> ${name}`;
                }
            } else {
                el.textContent = settings.cafe_name || 'Beans Cafe';
            }
        });
        
        // Update address
        const addressElements = document.querySelectorAll('.cafe-address');
        addressElements.forEach(el => {
            el.innerHTML = settings.cafe_address || '123 Coffee Street, Barangay Kapitolyo, Pasig City';
        });
        
        // Update phone
        const phoneElements = document.querySelectorAll('.cafe-phone');
        phoneElements.forEach(el => {
            el.innerHTML = settings.cafe_phone || '(02) 1234 5678';
        });
        
        // Update email
        const emailElements = document.querySelectorAll('.cafe-email');
        emailElements.forEach(el => {
            el.innerHTML = settings.cafe_email || 'hello@beanscafe.com';
        });
        
        // Update hours
        const hoursElements = document.querySelectorAll('.cafe-hours');
        hoursElements.forEach(el => {
            el.innerHTML = settings.cafe_hours || 'Mon-Fri: 7am-9pm, Sat-Sun: 8am-10pm';
        });
        
        // Update social links
        if (settings.facebook_url) {
            const fbLinks = document.querySelectorAll('.social-facebook');
            fbLinks.forEach(el => { if (el.tagName === 'A') el.href = settings.facebook_url; });
        }
        
        if (settings.instagram_url) {
            const igLinks = document.querySelectorAll('.social-instagram');
            igLinks.forEach(el => { if (el.tagName === 'A') el.href = settings.instagram_url; });
        }
        
        console.log('✅ Cafe settings loaded');
    } catch (error) {
        console.error('Error loading cafe settings:', error);
    }
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show temporary message
function showMessage(message, type) {
    const msgDiv = document.createElement('div');
    msgDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    msgDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
    `;
    document.body.appendChild(msgDiv);
    
    setTimeout(() => {
        if (msgDiv.parentNode) msgDiv.remove();
    }, 3000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeOut {
        to { opacity: 0; visibility: hidden; }
    }
`;
document.head.appendChild(style);

// Initialize Mobile Menu - FIXED
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('Mobile_Menu_Toggle');
    const mobileNav = document.getElementById('MobileNav');
    const closeMenuBtn = document.getElementById('closeMenu');
    const overlay = document.getElementById('Overlay');
    
    if (!mobileMenuToggle || !mobileNav) return;
    
    function closeMobileMenu() {
        mobileNav.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    function openMobileMenu() {
        mobileNav.classList.add('active');
        if (overlay) overlay.classList.add('active');
        mobileMenuToggle.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Toggle menu on hamburger click
    mobileMenuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        if (mobileNav.classList.contains('active')) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });
    
    // Close menu when clicking close button
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeMobileMenu);
    }
    
    // Close menu when clicking overlay
    if (overlay) {
        overlay.addEventListener('click', closeMobileMenu);
    }
    
    // Close menu when clicking a link inside mobile nav
    const mobileLinks = mobileNav.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
    
    // Close menu when pressing Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
            closeMobileMenu();
        }
    });
    
    // Handle window resize - close menu when resizing to desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && mobileNav.classList.contains('active')) {
            closeMobileMenu();
        }
    });
}

// Fix mobile video (MOVED OUTSIDE initMobileMenu)
function fixMobileVideo() {
    const video = document.getElementById('hero-video');
    if (!video) return;
    
    // Check if mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        // On mobile, hide the video element completely to prevent any issues
        video.style.display = 'none';
        video.style.opacity = '0';
        
        // The CSS background will show instead
        const videoBg = document.querySelector('.hero-video-bg');
        if (videoBg) {
            videoBg.style.background = "url('https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1920&h=1080&fit=crop')";
            videoBg.style.backgroundSize = 'cover';
            videoBg.style.backgroundPosition = 'center';
        }
    } else {
        // Desktop: try to play video
        video.muted = true;
        video.play().catch(function(e) {
            console.log('Video autoplay prevented:', e);
        });
    }
}