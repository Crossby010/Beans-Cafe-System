// Beans Cafe - Customize Drink JavaScript
// Supports conditional customization based on product category

let currentProduct = null;
let selectedOptions = {
    size: null,
    milk: null,
    sweetness: null,
    ice: null
};

let basePrice = 0;
let totalPrice = 0;
let quantity = 1;

// Categories that are customizable
const CUSTOMIZABLE_CATEGORIES = ['Coffee', 'Tea', 'Frappe'];
const NON_CUSTOMIZABLE_CATEGORIES = ['Pastries', 'Food'];

// Load product for customization
async function loadProductForCustomization() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    const container = document.getElementById('customize-content');
    if (!container) return;
    
    if (!productId) {
        container.innerHTML = `
            <div class="error-container">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>No product selected</h3>
                <p>Please go back to the menu and select a product.</p>
                <a href="menu.html" class="btn btn-primary">Back to Menu</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading product...</p></div>';
    
    try {
        let product;
        
        if (API_MODE === 'mock') {
            product = MOCK_DATA.products.find(p => p.id == productId);
        } else {
            const response = await fetch(`${API_URL}/products/${productId}`);
            const data = await response.json();
            product = data.product;
        }
        
        if (!product) {
            container.innerHTML = `
                <div class="error-container">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Product not found</h3>
                    <p>The product you're looking for doesn't exist.</p>
                    <a href="menu.html" class="btn btn-primary">Back to Menu</a>
                </div>
            `;
            return;
        }
        
        currentProduct = product;
        basePrice = parseFloat(product.price) || 0;
        totalPrice = basePrice;
        quantity = 1;
        
        // Check if product is customizable
        const isCustomizable = CUSTOMIZABLE_CATEGORIES.includes(product.category);
        
        if (isCustomizable) {
            displayCustomizableProduct();
        } else {
            displayNonCustomizableProduct();
        }
        
        // Refresh animations for the new content
        if (typeof refreshAnimations === 'function') {
            refreshAnimations();
        }
        
    } catch (error) {
        console.error('Error loading product:', error);
        container.innerHTML = `
            <div class="error-container">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error loading product</h3>
                <p>Please try again later.</p>
                <a href="menu.html" class="btn btn-primary">Back to Menu</a>
            </div>
        `;
    }
}

// Display customizable product (Coffee, Tea, Frappe)
function displayCustomizableProduct() {
    const container = document.getElementById('customize-content');
    
    const placeholderImage = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.PLACEHOLDERS && APP_CONFIG.PLACEHOLDERS.product) 
        ? APP_CONFIG.PLACEHOLDERS.product 
        : 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop';
    
    container.innerHTML = `
        <div class="customize-grid">
            <div class="product-image-section" data-aos="fade-right">
                <img src="${currentProduct.image_url || placeholderImage}" 
                     alt="${escapeHtml(currentProduct.name)}" 
                     class="product-image-large"
                     onerror="this.src='${placeholderImage}'">
                <div class="product-badges">
                    ${currentProduct.is_featured ? '<span class="badge-featured"><i class="fas fa-star"></i> Featured</span>' : ''}
                    ${currentProduct.is_new ? '<span class="badge-new"><i class="fas fa-bolt"></i> New</span>' : ''}
                </div>
            </div>
            
            <div class="customize-options" data-aos="fade-left">
                <h2>${escapeHtml(currentProduct.name)}</h2>
                <p class="product-description-full">${escapeHtml(currentProduct.description || 'Customize your drink just the way you like it!')}</p>
                <p class="base-price">Base Price: ₱${basePrice.toFixed(2)}</p>
                
                <!-- Size Options -->
                <div class="option-group">
                    <h4><i class="fas fa-cup"></i> Select Size</h4>
                    <div class="option-buttons" id="size-options">
                        <button class="option-btn" data-type="size" data-value="Small" data-price="0">Small (+₱0)</button>
                        <button class="option-btn" data-type="size" data-value="Regular" data-price="20">Regular (+₱20)</button>
                        <button class="option-btn" data-type="size" data-value="Large" data-price="35">Large (+₱35)</button>
                    </div>
                </div>
                
                <!-- Milk Options -->
                <div class="option-group">
                    <h4><i class="fas fa-tint"></i> Milk Preference</h4>
                    <div class="option-buttons" id="milk-options">
                        <button class="option-btn" data-type="milk" data-value="Fresh Milk" data-price="0">Fresh Milk (+₱0)</button>
                        <button class="option-btn" data-type="milk" data-value="Oat Milk" data-price="30">Oat Milk (+₱30)</button>
                        <button class="option-btn" data-type="milk" data-value="Almond Milk" data-price="30">Almond Milk (+₱30)</button>
                        <button class="option-btn" data-type="milk" data-value="Soy Milk" data-price="30">Soy Milk (+₱30)</button>
                    </div>
                </div>
                
                <!-- Sweetness Level -->
                <div class="option-group">
                    <h4><i class="fas fa-candy-cane"></i> Sweetness Level</h4>
                    <div class="option-buttons" id="sweetness-options">
                        <button class="option-btn" data-type="sweetness" data-value="0%" data-price="0">0% (No sugar)</button>
                        <button class="option-btn" data-type="sweetness" data-value="25%" data-price="0">25% (Less)</button>
                        <button class="option-btn" data-type="sweetness" data-value="50%" data-price="0">50% (Regular)</button>
                        <button class="option-btn" data-type="sweetness" data-value="75%" data-price="0">75% (More)</button>
                        <button class="option-btn" data-type="sweetness" data-value="100%" data-price="0">100% (Full)</button>
                    </div>
                </div>
                
                <!-- Ice Level -->
                <div class="option-group">
                    <h4><i class="fas fa-ice-cream"></i> Ice Level</h4>
                    <div class="option-buttons" id="ice-options">
                        <button class="option-btn" data-type="ice" data-value="No Ice" data-price="0">No Ice</button>
                        <button class="option-btn" data-type="ice" data-value="Less Ice" data-price="0">Less Ice</button>
                        <button class="option-btn" data-type="ice" data-value="Regular Ice" data-price="0">Regular Ice</button>
                        <button class="option-btn" data-type="ice" data-value="Extra Ice" data-price="0">Extra Ice</button>
                    </div>
                </div>
                
                <!-- Quantity Selector -->
                <div class="option-group">
                    <h4><i class="fas fa-hashtag"></i> Quantity</h4>
                    <div class="quantity-selector">
                        <button class="qty-btn" id="qty-minus">-</button>
                        <span id="qty-value">1</span>
                        <button class="qty-btn" id="qty-plus">+</button>
                    </div>
                </div>
                
                <!-- Price and Add to Cart -->
                <div class="price-display" id="price-display">
                    Total: ₱${totalPrice.toFixed(2)}
                </div>
                
                <button class="add-to-cart-btn" id="addToCartBtn">
                    <i class="fas fa-cart-plus"></i> Add to Cart - ₱${totalPrice.toFixed(2)}
                </button>
            </div>
        </div>
    `;
    
    setupOptionListeners();
    setupQuantityListeners();
    
    const addBtn = document.getElementById('addToCartBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addCustomizedToCart);
    }
}

// Display non-customizable product (Pastries, Food)
function displayNonCustomizableProduct() {
    const container = document.getElementById('customize-content');
    
    const placeholderImage = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.PLACEHOLDERS && APP_CONFIG.PLACEHOLDERS.product) 
        ? APP_CONFIG.PLACEHOLDERS.product 
        : 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop';
    
    container.innerHTML = `
        <div class="customize-grid non-customizable">
            <div class="product-image-section" data-aos="fade-right">
                <img src="${currentProduct.image_url || placeholderImage}" 
                     alt="${escapeHtml(currentProduct.name)}" 
                     class="product-image-large"
                     onerror="this.src='${placeholderImage}'">
                <div class="product-badges">
                    ${currentProduct.is_featured ? '<span class="badge-featured"><i class="fas fa-star"></i> Featured</span>' : ''}
                    ${currentProduct.is_new ? '<span class="badge-new"><i class="fas fa-bolt"></i> New</span>' : ''}
                </div>
            </div>
            
            <div class="customize-options" data-aos="fade-left">
                <div class="non-customizable-badge">
                    <i class="fas fa-info-circle"></i> Ready to serve - No customization needed
                </div>
                <h2>${escapeHtml(currentProduct.name)}</h2>
                <p class="product-description-full">${escapeHtml(currentProduct.description || 'A delicious treat ready to enjoy!')}</p>
                <p class="base-price">Price: ₱${basePrice.toFixed(2)}</p>
                
                <!-- Quantity Selector -->
                <div class="option-group">
                    <h4><i class="fas fa-hashtag"></i> Quantity</h4>
                    <div class="quantity-selector">
                        <button class="qty-btn" id="qty-minus">-</button>
                        <span id="qty-value">1</span>
                        <button class="qty-btn" id="qty-plus">+</button>
                    </div>
                </div>
                
                <!-- Price and Add to Cart -->
                <div class="price-display" id="price-display">
                    Total: ₱${totalPrice.toFixed(2)}
                </div>
                
                <button class="add-to-cart-btn" id="addToCartBtn">
                    <i class="fas fa-cart-plus"></i> Add to Cart - ₱${totalPrice.toFixed(2)}
                </button>
            </div>
        </div>
    `;
    
    setupQuantityListeners();
    
    const addBtn = document.getElementById('addToCartBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addNonCustomizableToCart);
    }
}

// Setup option button listeners (for customizable products)
function setupOptionListeners() {
    const allOptionBtns = document.querySelectorAll('.option-btn');
    
    allOptionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const optionType = this.getAttribute('data-type');
            const optionValue = this.getAttribute('data-value');
            const optionPrice = parseFloat(this.getAttribute('data-price')) || 0;
            
            // Remove selected class from same group
            const parentGroup = this.parentElement;
            parentGroup.querySelectorAll('.option-btn').forEach(b => {
                b.classList.remove('selected');
            });
            
            this.classList.add('selected');
            
            selectedOptions[optionType] = {
                value: optionValue,
                price: optionPrice
            };
            
            updateTotalPrice();
        });
    });
}

// Setup quantity button listeners
function setupQuantityListeners() {
    const minusBtn = document.getElementById('qty-minus');
    const plusBtn = document.getElementById('qty-plus');
    const qtySpan = document.getElementById('qty-value');
    
    if (minusBtn) {
        minusBtn.addEventListener('click', () => {
            if (quantity > 1) {
                quantity--;
                if (qtySpan) qtySpan.textContent = quantity;
                updateTotalPrice();
            }
        });
    }
    
    if (plusBtn) {
        plusBtn.addEventListener('click', () => {
            if (quantity < 99) {
                quantity++;
                if (qtySpan) qtySpan.textContent = quantity;
                updateTotalPrice();
            }
        });
    }
}

// Update total price based on selected options and quantity
function updateTotalPrice() {
    let extras = 0;
    
    if (selectedOptions.size && selectedOptions.size.price) {
        extras += selectedOptions.size.price;
    }
    if (selectedOptions.milk && selectedOptions.milk.price) {
        extras += selectedOptions.milk.price;
    }
    if (selectedOptions.sweetness && selectedOptions.sweetness.price) {
        extras += selectedOptions.sweetness.price;
    }
    if (selectedOptions.ice && selectedOptions.ice.price) {
        extras += selectedOptions.ice.price;
    }
    
    const itemTotal = (basePrice + extras) * quantity;
    totalPrice = Math.round(itemTotal * 100) / 100;
    
    const priceDisplay = document.getElementById('price-display');
    const addToCartBtn = document.getElementById('addToCartBtn');
    
    if (priceDisplay) {
        priceDisplay.innerHTML = `Total: ₱${totalPrice.toFixed(2)}`;
    }
    if (addToCartBtn) {
        addToCartBtn.innerHTML = `<i class="fas fa-cart-plus"></i> Add to Cart - ₱${totalPrice.toFixed(2)}`;
    }
}

// Add customized product to cart (for customizable items)
function addCustomizedToCart() {
    if (!currentProduct) {
        showMessage('Product not loaded', 'error');
        return;
    }
    
    // Build customization text
    let customizationText = '';
    if (selectedOptions.size) customizationText += `${selectedOptions.size.value}, `;
    if (selectedOptions.milk) customizationText += `${selectedOptions.milk.value}, `;
    if (selectedOptions.sweetness) customizationText += `${selectedOptions.sweetness.value} sweetness, `;
    if (selectedOptions.ice) customizationText += `${selectedOptions.ice.value}`;
    customizationText = customizationText.replace(/, $/, '');
    
    const finalTotal = Math.round(totalPrice * 100) / 100;
    
    const cartItem = {
        id: currentProduct.id,
        name: currentProduct.name,
        price: finalTotal / quantity,
        originalPrice: basePrice,
        image_url: currentProduct.image_url,
        customizations: customizationText || 'Standard',
        quantity: quantity
    };
    
    // Add to cart using the existing function
    if (typeof addToCart === 'function') {
        addToCart(cartItem, quantity);
    } else {
        let cart = JSON.parse(localStorage.getItem('beans_cart') || '[]');
        cart.push({
            id: cartItem.id,
            name: cartItem.name,
            price: cartItem.price,
            image: cartItem.image_url,
            quantity: quantity,
            customizations: cartItem.customizations
        });
        localStorage.setItem('beans_cart', JSON.stringify(cart));
        if (typeof updateCartCount === 'function') updateCartCount();
        showMessage(`${cartItem.name} added to cart!`, 'success');
    }
    
    setTimeout(() => {
        window.location.href = 'cart.html';
    }, 1000);
}

// Add non-customizable product to cart (for pastries/food)
function addNonCustomizableToCart() {
    if (!currentProduct) {
        showMessage('Product not loaded', 'error');
        return;
    }
    
    const cartItem = {
        id: currentProduct.id,
        name: currentProduct.name,
        price: basePrice,
        originalPrice: basePrice,
        image_url: currentProduct.image_url,
        customizations: null,
        quantity: quantity
    };
    
    if (typeof addToCart === 'function') {
        addToCart(cartItem, quantity);
    } else {
        let cart = JSON.parse(localStorage.getItem('beans_cart') || '[]');
        cart.push({
            id: cartItem.id,
            name: cartItem.name,
            price: cartItem.price,
            image: cartItem.image_url,
            quantity: quantity,
            customizations: null
        });
        localStorage.setItem('beans_cart', JSON.stringify(cart));
        if (typeof updateCartCount === 'function') updateCartCount();
        showMessage(`${cartItem.name} added to cart!`, 'success');
    }
    
    setTimeout(() => {
        window.location.href = 'cart.html';
    }, 1000);
}

// Show message
function showMessage(message, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `toast-message toast-${type}`;
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
    
    setTimeout(() => {
        if (msgDiv.parentNode) msgDiv.remove();
    }, 3000);
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add customization styles (only if not already added)
if (!document.querySelector('#customize-styles')) {
    const customizeStyles = document.createElement('style');
    customizeStyles.id = 'customize-styles';
    customizeStyles.textContent = `
        .customize-section {
            padding: 100px 0 80px;
            min-height: 100vh;
        }
        
        .customize-header {
            margin-bottom: 30px;
        }
        
        .back-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: var(--primary);
            text-decoration: none;
            font-weight: 500;
            transition: var(--transition);
        }
        
        .back-btn:hover {
            gap: 12px;
        }
        
        .customize-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 50px;
            align-items: start;
        }
        
        .product-image-section {
            position: relative;
            border-radius: 24px;
            overflow: hidden;
            background: var(--bg-secondary);
        }
        
        .product-image-large {
            width: 100%;
            height: auto;
            display: block;
        }
        
        .product-badges {
            position: absolute;
            top: 16px;
            left: 16px;
            display: flex;
            gap: 8px;
        }
        
        .badge-featured {
            background: var(--primary);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .badge-new {
            background: #10b981;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            animation: pulse 1.5s infinite;
        }
        
        .customize-options {
            background: var(--bg-card);
            border-radius: 24px;
            padding: 30px;
            box-shadow: var(--shadow-sm);
        }
        
        .customize-options h2 {
            font-size: 28px;
            margin-bottom: 10px;
            color: var(--text-primary);
        }
        
        .product-description-full {
            color: var(--text-secondary);
            margin-bottom: 20px;
            line-height: 1.6;
        }
        
        .base-price {
            font-size: 18px;
            font-weight: 600;
            color: var(--primary);
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 1px solid var(--border);
        }
        
        .option-group {
            margin-bottom: 25px;
        }
        
        .option-group h4 {
            margin-bottom: 12px;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-primary);
        }
        
        .option-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .option-btn {
            padding: 8px 20px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 30px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
            color: var(--text-primary);
        }
        
        .option-btn:hover {
            border-color: var(--primary);
        }
        
        .option-btn.selected {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
        }
        
        .quantity-selector {
            display: flex;
            align-items: center;
            gap: 20px;
            background: var(--bg-secondary);
            padding: 10px;
            border-radius: 40px;
            width: fit-content;
        }
        
        .qty-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            background: var(--primary);
            color: white;
            font-size: 20px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .qty-btn:hover {
            background: var(--primary-dark);
            transform: scale(1.05);
        }
        
        #qty-value {
            font-size: 20px;
            font-weight: 600;
            min-width: 40px;
            text-align: center;
            color: var(--text-primary);
        }
        
        .price-display {
            font-size: 28px;
            font-weight: 700;
            color: var(--primary);
            margin: 25px 0;
            padding-top: 20px;
            border-top: 1px solid var(--border);
        }
        
        .add-to-cart-btn {
            width: 100%;
            padding: 16px;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 50px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .add-to-cart-btn:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
        }
        
        .non-customizable-badge {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            padding: 8px 16px;
            border-radius: 30px;
            font-size: 13px;
            display: inline-block;
            margin-bottom: 20px;
        }
        
        .non-customizable-badge i {
            margin-right: 8px;
        }
        
        .error-container {
            text-align: center;
            padding: 60px 20px;
            background: var(--bg-card);
            border-radius: 24px;
        }
        
        .error-container i {
            font-size: 64px;
            color: var(--primary);
            margin-bottom: 20px;
        }
        
        .error-container h3 {
            margin-bottom: 10px;
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
        
        @media (max-width: 768px) {
            .customize-grid {
                grid-template-columns: 1fr;
                gap: 30px;
            }
            
            .customize-options {
                padding: 20px;
            }
            
            .customize-options h2 {
                font-size: 24px;
            }
            
            .option-buttons {
                gap: 8px;
            }
            
            .option-btn {
                padding: 6px 14px;
                font-size: 12px;
            }
            
            .price-display {
                font-size: 24px;
            }
        }
    `;
    document.head.appendChild(customizeStyles);
}