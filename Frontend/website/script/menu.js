// Beans Cafe - Menu Page JavaScript

let allProducts = [];

// Load all products
async function loadAllProducts() {
    const productsContainer = document.getElementById('all-products');
    if (!productsContainer) return;
    
    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        
        allProducts = data.products || [];
        
        if (allProducts.length === 0) {
            productsContainer.innerHTML = '<div class="loading">No products available</div>';
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
    
    productsContainer.innerHTML = products.map(product => `
        <div class="product-card" onclick="goToProduct(${product.id})">
            <img src="${product.image_url || '../assets/images/coffee-placeholder.jpg'}" 
                 alt="${escapeHtml(product.name)}" 
                 class="product-image"
                 onerror="this.src='https://placehold.co/300x200/F5E6D3/6F4E37?text=Coffee'">
            <div class="product-info">
                <h3 class="product-title">${escapeHtml(product.name)}</h3>
                <p class="product-description" style="font-size: 14px; color: #666; margin-bottom: 10px;">${escapeHtml(product.description || '')}</p>
                <p class="product-price">₱${product.price}</p>
                <button class="product-btn" onclick="event.stopPropagation(); addToCartFromMenu(${product.id})">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

// Setup filter buttons
function setupFilterButtons() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const category = this.getAttribute('data-category');
            filterProductsByCategory(category);
        });
    });
}

// Filter products by category
function filterProductsByCategory(category) {
    if (category === 'all') {
        displayProducts(allProducts);
    } else {
        const filtered = allProducts.filter(product => product.category === category);
        displayProducts(filtered);
    }
}

// Add to cart from menu page
async function addToCartFromMenu(productId) {
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

// Go to product customization page
function goToProduct(productId) {
    window.location.href = `customize.html?id=${productId}`;
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}