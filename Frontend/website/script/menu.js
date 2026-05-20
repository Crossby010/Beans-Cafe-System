// Beans Cafe - Menu Page JavaScript (COMPLETE)

let allProducts = [];
let currentCategory = 'all';
let currentSearchTerm = '';

// Load all products
async function loadAllProducts() {
    const productsContainer = document.getElementById('all-products');
    if (!productsContainer) {
        console.error('Products container #all-products not found!');
        return;
    }
    
    try {
        let products = [];
        
        if (API_MODE === 'mock') {
            products = MOCK_DATA.products;
        } else {
            const response = await fetch(`${API_URL}/products`);
            const data = await response.json();
            products = data.products || [];
        }
        
        allProducts = products;
        
        if (allProducts.length === 0) {
            productsContainer.innerHTML = '<div class="loading">No products available in database. Please add products in admin panel.</div>';
            return;
        }
        
        displayProducts(allProducts);
        setupFilterButtons();
        
    } catch (error) {
        console.error('Error loading products:', error);
        productsContainer.innerHTML = '<div class="loading">Unable to load menu. Please try again later.</div>';
    }
}

// Display products
function displayProducts(products) {
    const productsContainer = document.getElementById('all-products');
    
    if (products.length === 0) {
        productsContainer.innerHTML = '<div class="loading">No products in this category</div>';
        return;
    }
    
    const placeholderImage = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.PLACEHOLDERS && APP_CONFIG.PLACEHOLDERS.product) 
        ? APP_CONFIG.PLACEHOLDERS.product 
        : 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop';
    
    productsContainer.innerHTML = products.map(product => {
        return `
            <div class="product-card" data-aos="fade-up" onclick="goToProduct(${product.id})">
                <img src="${product.image_url || placeholderImage}" 
                     alt="${escapeHtml(product.name)}" 
                     class="product-image"
                     loading="lazy"
                     onerror="this.src='${placeholderImage}'">
                <div class="product-info">
                    <div class="product-badges">
                        ${product.is_featured ? '<span class="badge-featured"><i class="fas fa-star"></i> Featured</span>' : ''}
                        ${product.is_new ? '<span class="badge-new"><i class="fas fa-bolt"></i> New</span>' : ''}
                    </div>
                    <h3 class="product-title">${escapeHtml(product.name)}</h3>
                    <p class="product-description">${escapeHtml(product.description || '').substring(0, 80)}</p>
                    <p class="product-price">₱${parseFloat(product.price).toFixed(2)}</p>
                    <button class="product-btn" onclick="event.stopPropagation(); addToCartFromMenu(${product.id})">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Refresh animations for the newly added product cards
    if (typeof refreshAnimations === 'function') {
        refreshAnimations();
    }
}

// Setup filter buttons
function setupFilterButtons() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            currentCategory = this.getAttribute('data-category');
            filterProducts();
        });
    });
}

// Filter products by category and search term
function filterProducts() {
    let filtered = [...allProducts];
    
    if (currentCategory !== 'all') {
        filtered = filtered.filter(product => product.category === currentCategory);
    }
    
    if (currentSearchTerm) {
        filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(currentSearchTerm) ||
            (product.description && product.description.toLowerCase().includes(currentSearchTerm)) ||
            (product.category && product.category.toLowerCase().includes(currentSearchTerm))
        );
    }
    
    displayProducts(filtered);
    
    const noResults = document.getElementById('no-results');
    if (noResults) {
        noResults.style.display = filtered.length === 0 ? 'block' : 'none';
    }
}

// Set search term from external input
window.setMenuSearchTerm = function(term) {
    currentSearchTerm = term.toLowerCase();
    filterProducts();
};

// Add to cart from menu page
async function addToCartFromMenu(productId) {
    try {
        let product;
        
        if (API_MODE === 'mock') {
            product = MOCK_DATA.products.find(p => p.id === productId);
        } else {
            const response = await fetch(`${API_URL}/products/${productId}`);
            const data = await response.json();
            product = data.product;
        }
        
        if (product) {
            if (typeof addToCart === 'function') {
                addToCart(product);
            } else {
                let cart = JSON.parse(localStorage.getItem('beans_cart') || '[]');
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: parseFloat(product.price),
                    image: product.image_url,
                    quantity: 1,
                    customizations: null
                });
                localStorage.setItem('beans_cart', JSON.stringify(cart));
                if (typeof updateCartCount === 'function') updateCartCount();
            }
            showMessage(`${product.name} added to cart!`, 'success');
            
            const btn = event?.target;
            if (btn) {
                btn.classList.add('btn-added');
                setTimeout(() => btn.classList.remove('btn-added'), 1000);
            }
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showMessage('Failed to add to cart', 'error');
    }
}

// Go to product customization page
function goToProduct(productId) {
    window.location.href = `customize.html?id=${productId}`;
}

// Show message function
function showMessage(message, type) {
    const msgDiv = document.createElement('div');
    msgDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
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
    setTimeout(() => { if (msgDiv.parentNode) msgDiv.remove(); }, 3000);
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add CSS for product badges
if (!document.querySelector('#menu-styles')) {
    const menuStyles = document.createElement('style');
    menuStyles.id = 'menu-styles';
    menuStyles.textContent = `
        .product-badges {
            display: flex;
            gap: 8px;
            margin-bottom: 10px;
        }
        
        .badge-featured {
            background: var(--primary);
            color: white;
            padding: 3px 8px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 600;
        }
        
        .badge-new {
            background: #10b981;
            color: white;
            padding: 3px 8px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 600;
            animation: pulse 1.5s infinite;
        }
        
        .product-description {
            font-size: 13px;
            color: var(--text-secondary);
            margin: 8px 0;
            line-height: 1.4;
        }
        
        .btn-added {
            background: #10b981 !important;
            transition: all 0.3s ease;
        }
        
        .menu-hero {
            background: linear-gradient(135deg, var(--primary-dark), var(--primary));
            padding: 100px 0 60px;
            text-align: center;
            color: white;
            margin-top: 0;
        }
        
        .menu-hero h1 {
            font-size: 48px;
            margin-bottom: 15px;
        }
        
        .menu-breadcrumb {
            margin-top: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
        }
        
        .menu-breadcrumb a {
            color: white;
            text-decoration: none;
        }
        
        .menu-filters-section {
            padding: 60px 0;
        }
        
        .menu-search {
            max-width: 400px;
            margin: 30px auto;
        }
        
        .search-wrapper {
            position: relative;
        }
        
        .search-wrapper i {
            position: absolute;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
        }
        
        .search-wrapper input {
            width: 100%;
            padding: 14px 20px 14px 45px;
            border: 1px solid var(--border);
            border-radius: 50px;
            background: var(--bg-card);
            color: var(--text-primary);
        }
        
        .clear-search {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            cursor: pointer;
            color: var(--text-muted);
        }
        
        .seasonal-banner {
            background: linear-gradient(135deg, #D4A373, #8B5E3C);
            padding: 60px 0;
            text-align: center;
            color: white;
        }
        
        .seasonal-badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 5px 15px;
            border-radius: 50px;
            font-size: 14px;
            margin-bottom: 20px;
        }
        
        .seasonal-content h3 {
            font-size: 32px;
            margin-bottom: 15px;
        }
        
        .no-results {
            text-align: center;
            padding: 60px 20px;
        }
        
        .no-results i {
            font-size: 64px;
            color: var(--text-muted);
            margin-bottom: 20px;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--border);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        @keyframes slideInRight {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fadeOut {
            to { opacity: 0; visibility: hidden; }
        }
    `;
    document.head.appendChild(menuStyles);
}