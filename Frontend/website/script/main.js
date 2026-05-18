// Beans Cafe - Main JavaScript

// API Base URL
const API_URL = 'https://beans-cafe-backend.onrender.com/api';
//const API_URL = 'http://localhost:5000/api';

// Global base URL for navigation
window.BASE_URL = window.location.origin;

// Setup navigation when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - setting up navigation');
    
    // Setup all navigation links
    setupNavigation();
    
    // Load featured products (only on homepage)
    if (document.getElementById('featured-products')) {
        loadFeaturedProducts();
    }
    
    // Update cart count
    updateCartCount();
    
    // Check URL hash on load (for homepage sections)
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        checkHash();
    }
});

// Setup navigation for all section links
function setupNavigation() {
    // Home page section links (data-section)
    const sectionLinks = document.querySelectorAll('[data-section]');
    console.log('Found section links:', sectionLinks.length);
    
    sectionLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            console.log('Navigating to section:', sectionId);
            showSection(sectionId);
        });
    });
}

// Show specific section (for homepage)
function showSection(sectionId) {
    console.log('Showing section:', sectionId);
    
    // Hide all sections
    const sections = ['home', 'howto', 'about'];
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
        console.log('Section activated:', sectionId);
    } else {
        console.error('Section not found:', `${sectionId}-section`);
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
    
    // Update logo data-section
    const logos = document.querySelectorAll('.logo, .footer-logo');
    logos.forEach(logo => {
        logo.setAttribute('data-section', sectionId);
    });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Update URL hash without reload
    window.location.hash = sectionId;
}

// Check URL hash on load
function checkHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'howto' || hash === 'about') {
        showSection(hash);
    } else {
        showSection('home');
    }
}

// Handle hash change (browser back/forward)
window.addEventListener('hashchange', function() {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'howto' || hash === 'about') {
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
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        
        const featuredProducts = data.products ? data.products.slice(0, 4) : [];
        
        if (featuredProducts.length === 0) {
            productsContainer.innerHTML = '<div class="loading">No products available</div>';
            return;
        }
        
        productsContainer.innerHTML = featuredProducts.map(product => `
            <div class="product-card" onclick="goToProduct(${product.id})">
                <img src="${product.image_url || '../assets/images/coffee-placeholder.jpg'}" 
                     alt="${product.name}" 
                     class="product-image"
                     onerror="this.src='https://placehold.co/300x200/F5E6D3/6F4E37?text=Coffee'">
                <div class="product-info">
                    <h3 class="product-title">${escapeHtml(product.name)}</h3>
                    <p class="product-description" style="font-size: 14px; color: #666; margin-bottom: 10px;">${escapeHtml(product.description || '')}</p>
                    <p class="product-price">₱${product.price}</p>
                    <button class="product-btn" onclick="event.stopPropagation(); addToCartFromProduct(${product.id})">Add to Cart</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading products:', error);
        productsContainer.innerHTML = '<div class="loading">Unable to load menu. Please try again later.</div>';
    }
}

// Go to product customization page
function goToProduct(productId) {
    console.log('Going to product with ID:', productId);
    if (productId) {
        window.location.href = `pages/customize.html?id=${productId}`;
    } else {
        console.error('No product ID provided');
    }
}

// Add to cart from homepage
async function addToCartFromProduct(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        const data = await response.json();
        
        if (data.product) {
            addToCart(data.product);
            showMessage(`${data.product.name} added to cart!`, 'success');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showMessage('Failed to add to cart', 'error');
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show temporary message
function showMessage(message, type) {
    const msgDiv = document.createElement('div');
    msgDiv.textContent = message;
    msgDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#6F4E37' : '#dc3545'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 9999;
        animation: fadeInOut 3s ease;
    `;
    document.body.appendChild(msgDiv);
    
    setTimeout(() => {
        msgDiv.remove();
    }, 3000);
}

// Load cafe settings from backend
async function loadCafeSettings() {
    try {
        const response = await fetch(`${API_URL}/settings/public`);
        const data = await response.json();
        const settings = data.settings || {};
        
        // Update cafe name in footer and logo
        const cafeNameElements = document.querySelectorAll('.cafe-name, .footer-logo');
        cafeNameElements.forEach(el => {
            if (el.tagName === 'A' && el.classList.contains('footer-logo')) {
                const name = settings.cafe_name || 'Beans Cafe';
                el.innerHTML = name.replace('Beans Cafe', '<span class="cafe-name-text">' + name + '</span>');
                if (!el.innerHTML.includes('span')) {
                    el.textContent = name;
                }
            } else if (el.classList.contains('cafe-name')) {
                el.textContent = settings.cafe_name || 'Beans Cafe';
            }
        });
        
        // Update address in footer
        const addressElements = document.querySelectorAll('.cafe-address');
        addressElements.forEach(el => {
            el.innerHTML = settings.cafe_address || '📍 123 Coffee Street, Barangay Kapitolyo, Pasig City';
        });
        
        // Update phone in footer
        const phoneElements = document.querySelectorAll('.cafe-phone');
        phoneElements.forEach(el => {
            el.innerHTML = settings.cafe_phone || '📞 (02) 1234 5678';
        });
        
        // Update email in footer
        const emailElements = document.querySelectorAll('.cafe-email');
        emailElements.forEach(el => {
            el.innerHTML = settings.cafe_email || '✉️ hello@beanscafe.com';
        });
        
        // Update hours in footer
        const hoursElements = document.querySelectorAll('.cafe-hours');
        hoursElements.forEach(el => {
            el.innerHTML = settings.cafe_hours || 'Mon-Fri: 7am-9pm, Sat-Sun: 8am-10pm';
        });
        
        // Update social links
        if (settings.facebook_url) {
            const fbLinks = document.querySelectorAll('.social-facebook');
            fbLinks.forEach(el => {
                el.href = settings.facebook_url;
            });
        }
        
        if (settings.instagram_url) {
            const igLinks = document.querySelectorAll('.social-instagram');
            igLinks.forEach(el => {
                el.href = settings.instagram_url;
            });
        }
        
        console.log('✅ Cafe settings loaded:', settings);
    } catch (error) {
        console.error('Error loading cafe settings:', error);
    }
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(20px); }
        15% { opacity: 1; transform: translateY(0); }
        85% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
    }
`;
document.head.appendChild(style);