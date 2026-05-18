// Beans Cafe - Cart JavaScript

// Cart functions
function getCart() {
    const cart = localStorage.getItem('beans_cart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('beans_cart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(product, quantity = 1, customizations = null) {
    const cart = getCart();
    const existingIndex = cart.findIndex(item => 
        item.id === product.id && JSON.stringify(item.customizations) === JSON.stringify(customizations)
    );
    
    // Calculate final price (if customizations have extra cost)
    let finalPrice = product.price;
    if (customizations && customizations.totalPrice) {
        finalPrice = customizations.totalPrice;
    }
    
    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: finalPrice,
            originalPrice: product.price,
            image: product.image_url,
            quantity: quantity,
            customizations: customizations ? customizations.text : null,
            customizationDetails: customizations
        });
    }
    
    saveCart(cart);
    showMessage(`${product.name} added to cart!`, 'success');
    return true;
}

function removeFromCart(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    showMessage('Item removed from cart', 'success');
    if (window.location.pathname.includes('cart.html')) {
        loadCartPage();
    }
}

function updateQuantity(index, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(index);
        return;
    }
    
    const cart = getCart();
    cart[index].quantity = newQuantity;
    saveCart(cart);
    
    if (window.location.pathname.includes('cart.html')) {
        loadCartPage();
    }
}

function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('#cart-count');
    cartCountElements.forEach(el => {
        el.textContent = totalItems;
    });
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return sum + (price * quantity);
    }, 0);
}

// In loadCartPage function, make sure prices use ₱
cartContainer.innerHTML = cart.map((item, index) => {
    let imagePath = item.image || '/assets/images/coffee-placeholder.jpg';
    if (imagePath && !imagePath.startsWith('http') && !imagePath.startsWith('/')) {
        imagePath = '../' + imagePath;
    }
    
    return `
        <div class="cart-item">
            <img src="${imagePath}" 
                 alt="${escapeHtml(item.name)}" 
                 class="cart-item-image" 
                 onerror="this.src='https://placehold.co/80x80/F5E6D3/6F4E37?text=Coffee'">
            <div class="cart-item-details">
                <div class="cart-item-name">${escapeHtml(item.name)}</div>
                <div class="cart-item-price">₱${parseFloat(item.price).toFixed(2)}</div>
                ${item.customizations ? `<div style="font-size: 12px; color: #8B5E3C;">${escapeHtml(item.customizations)}</div>` : ''}
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="updateQuantity(${index}, ${item.quantity - 1})">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${index}, ${item.quantity + 1})">+</button>
            </div>
            <div class="cart-item-total">₱${(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
            <div class="remove-item" onclick="removeFromCart(${index})">🗑️</div>
        </div>
    `;
}).join('');

function clearCart() {
    localStorage.removeItem('beans_cart');
    updateCartCount();
}

// Load cart page content
function loadCartPage() {
    const cartContainer = document.querySelector('.cart-items');
    const cartSummary = document.querySelector('.cart-summary');
    
    if (!cartContainer) return;
    
    const cart = getCart();
    console.log('Cart items:', cart); // Debug: Check if cart has items
    
    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div style="text-align: center; padding: 60px;">
                <h3>Your cart is empty</h3>
                <p>Add some delicious drinks to get started!</p>
                <a href="menu.html" class="btn btn-primary" style="margin-top: 20px;">Browse Menu</a>
            </div>
        `;
        if (cartSummary) cartSummary.style.display = 'none';
        return;
    }
    
    if (cartSummary) cartSummary.style.display = 'block';
    
    cartContainer.innerHTML = cart.map((item, index) => {
        // Fix image path
        let imagePath = item.image || '/assets/images/coffee-placeholder.jpg';
        if (imagePath && !imagePath.startsWith('http') && !imagePath.startsWith('/')) {
            imagePath = '../' + imagePath;
        }
        
        return `
            <div class="cart-item">
                <img src="${imagePath}" 
                     alt="${escapeHtml(item.name)}" 
                     class="cart-item-image" 
                     onerror="this.src='https://placehold.co/80x80/F5E6D3/6F4E37?text=Coffee'">
                <div class="cart-item-details">
                    <div class="cart-item-name">${escapeHtml(item.name)}</div>
                    <div class="cart-item-price">₱${parseFloat(item.price).toFixed(2)}</div>
                    ${item.customizations ? `<div style="font-size: 12px; color: #8B5E3C;">${escapeHtml(item.customizations)}</div>` : ''}
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${index}, ${item.quantity + 1})">+</button>
                </div>
                <div class="cart-item-total">₱${(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
                <div class="remove-item" onclick="removeFromCart(${index})">🗑️</div>
            </div>
        `;
    }).join('');
    
    // Update summary
    const subtotal = getCartTotal();
    const total = subtotal;
    
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    
    if (subtotalEl) subtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `₱${total.toFixed(2)}`;
}

// Proceed to checkout
function proceedToCheckout() {
    const cart = getCart();
    if (cart.length === 0) {
        showMessage('Your cart is empty', 'error');
        return;
    }
    window.location.href = 'checkout.html';
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}