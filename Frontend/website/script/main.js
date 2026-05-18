// Beans Cafe - Main JavaScript

// API Base URL
const API_URL = 'http://localhost:5000/api';

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
    window.location.href = `pages/customize.html?id=${productId}`;
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