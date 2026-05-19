// Beans Cafe - Cart JavaScript

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
    let finalPrice = product.price;
    
    if (customizations && customizations.totalPrice) {
        finalPrice = customizations.totalPrice;
    }
    
    const existingIndex = cart.findIndex(item => 
        item.id === product.id && JSON.stringify(item.customizations) === JSON.stringify(customizations)
    );
    
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
            customizations: product.customizations || null
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
    if (typeof loadCartPage === 'function') {
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
    
    if (typeof loadCartPage === 'function') {
        loadCartPage();
    }
}

function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartCountElements = document.querySelectorAll('#cart-count');
    cartCountElements.forEach(el => {
        el.textContent = totalItems;
    });
    
    // Hide/show cart link based on items in cart
    updateCartVisibility();
}

// NEW FUNCTION: Hide cart link when cart is empty
function updateCartVisibility() {
    const cart = getCart();
    const cartLink = document.querySelector('.cart-link');
    const mobileCartLink = document.querySelector('.Mobile-Nav-Contents a[href*="cart.html"]');
    
    if (cart.length === 0) {
        // Hide on desktop
        if (cartLink) {
            cartLink.style.display = 'none';
        }
        // Hide on mobile
        if (mobileCartLink && mobileCartLink.parentElement) {
            mobileCartLink.parentElement.style.display = 'none';
        }
    } else {
        // Show on desktop
        if (cartLink) {
            cartLink.style.display = 'flex';
        }
        // Show on mobile
        if (mobileCartLink && mobileCartLink.parentElement) {
            mobileCartLink.parentElement.style.display = 'block';
        }
    }
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0);
}

function clearCart() {
    localStorage.removeItem('beans_cart');
    updateCartCount();
    updateCartVisibility();
}

function loadCartPage() {
    const cartContainer = document.querySelector('.cart-items');
    const cartSummary = document.querySelector('.cart-summary');
    
    if (!cartContainer) return;
    
    const cart = getCart();
    
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
        let imagePath = item.image || '../assets/images/coffee-placeholder.jpg';
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
                    <button class="quantity-btn" onclick="updateQuantity(${index}, ${(item.quantity || 1) - 1})">-</button>
                    <span>${item.quantity || 1}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${index}, ${(item.quantity || 1) + 1})">+</button>
                </div>
                <div class="cart-item-total">₱${(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}</div>
                <div class="remove-item" onclick="removeFromCart(${index})">🗑️</div>
            </div>
        `;
    }).join('');
    
    const subtotal = getCartTotal();
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    
    if (subtotalEl) subtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `₱${subtotal.toFixed(2)}`;
}

function proceedToCheckout() {
    const cart = getCart();
    if (cart.length === 0) {
        showMessage('Your cart is empty', 'error');
        return;
    }
    window.location.href = 'checkout.html';
}

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
        if (msgDiv.parentNode) msgDiv.remove();
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize cart visibility on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartVisibility();
});