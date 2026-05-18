// Beans Cafe - Customize Drink JavaScript

let currentProduct = null;
let selectedOptions = {
    size: null,
    milk: null,
    sweetness: null,
    ice: null
};

let basePrice = 0;
let totalPrice = 0;

// Load product for customization
async function loadProductForCustomization() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    console.log('Loading product ID:', productId);
    
    if (!productId) {
        window.location.href = 'menu.html';
        return;
    }
    
    const container = document.getElementById('customize-content');
    
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        const data = await response.json();
        
        console.log('Product data:', data);
        
        if (!data.product) {
            container.innerHTML = '<div class="loading">Product not found</div>';
            return;
        }
        
        currentProduct = data.product;
        basePrice = parseFloat(currentProduct.price);
        totalPrice = basePrice;
        
        console.log('Base price:', basePrice);
        
        displayCustomizationOptions();
        
    } catch (error) {
        console.error('Error loading product:', error);
        container.innerHTML = '<div class="loading">Error loading product. Please try again.</div>';
    }
}

// Display customization UI
function displayCustomizationOptions() {
    const container = document.getElementById('customize-content');
    
    container.innerHTML = `
        <div class="product-image-large">
            <img src="${currentProduct.image_url || '../assets/images/coffee-placeholder.jpg'}" 
                 alt="${escapeHtml(currentProduct.name)}" 
                 style="width: 100%; border-radius: 16px;"
                 onerror="this.src='https://placehold.co/500x500/F5E6D3/6F4E37?text=Coffee'">
        </div>
        
        <div class="customize-options">
            <h2 style="color: var(--dark-coffee); margin-bottom: 10px;">${escapeHtml(currentProduct.name)}</h2>
            <p style="color: #666; margin-bottom: 20px;">${escapeHtml(currentProduct.description || 'Customize your drink just the way you like it!')}</p>
            <p style="color: #6F4E37; margin-bottom: 20px; font-weight: bold;">Base Price: ₱${basePrice.toFixed(2)}</p>
            
            <!-- Size Options -->
            <div class="option-group">
                <h4>Select Size</h4>
                <div class="option-buttons" id="size-options">
                    <button class="option-btn" data-type="size" data-value="Small" data-price="0">Small (+₱0)</button>
                    <button class="option-btn" data-type="size" data-value="Regular" data-price="20">Regular (+₱20)</button>
                    <button class="option-btn" data-type="size" data-value="Large" data-price="35">Large (+₱35)</button>
                </div>
            </div>
            
            <!-- Milk Options -->
            <div class="option-group">
                <h4>Milk Preference</h4>
                <div class="option-buttons" id="milk-options">
                    <button class="option-btn" data-type="milk" data-value="Fresh Milk" data-price="0">Fresh Milk (+₱0)</button>
                    <button class="option-btn" data-type="milk" data-value="Oat Milk" data-price="30">Oat Milk (+₱30)</button>
                    <button class="option-btn" data-type="milk" data-value="Almond Milk" data-price="30">Almond Milk (+₱30)</button>
                </div>
            </div>
            
            <!-- Sweetness Level -->
            <div class="option-group">
                <h4>Sweetness Level</h4>
                <div class="option-buttons" id="sweetness-options">
                    <button class="option-btn" data-type="sweetness" data-value="0%" data-price="0">0% (No sugar)</button>
                    <button class="option-btn" data-type="sweetness" data-value="25%" data-price="0">25%</button>
                    <button class="option-btn" data-type="sweetness" data-value="50%" data-price="0">50%</button>
                    <button class="option-btn" data-type="sweetness" data-value="75%" data-price="0">75%</button>
                    <button class="option-btn" data-type="sweetness" data-value="100%" data-price="0">100%</button>
                </div>
            </div>
            
            <!-- Ice Level -->
            <div class="option-group">
                <h4>Ice Level</h4>
                <div class="option-buttons" id="ice-options">
                    <button class="option-btn" data-type="ice" data-value="No Ice" data-price="0">No Ice</button>
                    <button class="option-btn" data-type="ice" data-value="Less Ice" data-price="0">Less Ice</button>
                    <button class="option-btn" data-type="ice" data-value="Regular Ice" data-price="0">Regular Ice</button>
                    <button class="option-btn" data-type="ice" data-value="Extra Ice" data-price="0">Extra Ice</button>
                </div>
            </div>
            
            <!-- Price Display -->
            <div class="price-display" id="price-display" style="font-size: 24px; font-weight: bold; color: #6F4E37; margin: 20px 0;">
                Total: ₱${totalPrice.toFixed(2)}
            </div>
            
            <!-- Add to Cart Button -->
            <button class="add-to-cart-btn" id="addToCartBtn" style="width: 100%; padding: 15px; background: #6F4E37; color: white; border: none; border-radius: 12px; font-size: 18px; font-weight: bold; cursor: pointer;">
                Add to Cart - ₱${totalPrice.toFixed(2)}
            </button>
        </div>
    `;
    
    // Setup option click listeners
    setupOptionListeners();
    
    // Setup add to cart button listener
    const addBtn = document.getElementById('addToCartBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addCustomizedToCart);
    }
}

// Setup option button listeners
function setupOptionListeners() {
    const allOptionBtns = document.querySelectorAll('.option-btn');
    console.log('Found option buttons:', allOptionBtns.length);
    
    allOptionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const optionType = this.getAttribute('data-type');
            const optionValue = this.getAttribute('data-value');
            const optionPrice = parseFloat(this.getAttribute('data-price')) || 0;
            
            console.log('Option clicked:', optionType, optionValue, optionPrice);
            
            // Remove selected class from same group
            const parentGroup = this.parentElement;
            parentGroup.querySelectorAll('.option-btn').forEach(b => {
                b.classList.remove('selected');
            });
            
            // Add selected class to clicked button
            this.classList.add('selected');
            
            // Update selected options
            selectedOptions[optionType] = {
                value: optionValue,
                price: optionPrice
            };
            
            // Update total price
            updateTotalPrice();
        });
    });
}

// Update total price based on selected options
function updateTotalPrice() {
    let extras = 0;
    
    if (selectedOptions.size && selectedOptions.size.price) {
        extras += parseFloat(selectedOptions.size.price);
    }
    if (selectedOptions.milk && selectedOptions.milk.price) {
        extras += parseFloat(selectedOptions.milk.price);
    }
    if (selectedOptions.sweetness && selectedOptions.sweetness.price) {
        extras += parseFloat(selectedOptions.sweetness.price);
    }
    if (selectedOptions.ice && selectedOptions.ice.price) {
        extras += parseFloat(selectedOptions.ice.price);
    }
    
    totalPrice = basePrice + extras;
    
    // Fix decimal precision - round to 2 decimal places
    totalPrice = Math.round(totalPrice * 100) / 100;
    
    console.log('Price update - Base:', basePrice, 'Extras:', extras, 'Total:', totalPrice);
    
    const priceDisplay = document.getElementById('price-display');
    const addToCartBtn = document.getElementById('addToCartBtn');
    
    if (priceDisplay) {
        priceDisplay.innerHTML = `Total: ₱${totalPrice.toFixed(2)}`;
    }
    if (addToCartBtn) {
        addToCartBtn.innerHTML = `Add to Cart - ₱${totalPrice.toFixed(2)}`;
    }
}

// Add customized product to cart
function addCustomizedToCart() {
    console.log('Adding to cart - Total price:', totalPrice);
    
    if (!currentProduct) return;
    
    // Build customization text
    let customizationText = '';
    if (selectedOptions.size) customizationText += `${selectedOptions.size.value}, `;
    if (selectedOptions.milk) customizationText += `${selectedOptions.milk.value}, `;
    if (selectedOptions.sweetness) customizationText += `${selectedOptions.sweetness.value} sweetness, `;
    if (selectedOptions.ice) customizationText += `${selectedOptions.ice.value}`;
    
    // Remove trailing comma and space
    customizationText = customizationText.replace(/, $/, '');
    
    // Round total price to 2 decimals
    const finalTotal = Math.round(totalPrice * 100) / 100;
    
    console.log('Final total:', finalTotal);
    console.log('Customizations:', customizationText);
    
    // Create cart item with customizations
    const cartItem = {
        id: currentProduct.id,
        name: currentProduct.name,
        price: finalTotal,
        originalPrice: basePrice,
        image_url: currentProduct.image_url,
        customizations: customizationText || 'Standard',
        customizationDetails: {
            text: customizationText || 'Standard',
            totalPrice: finalTotal,
            options: selectedOptions
        }
    };
    
    // Use the global addToCart function from cart.js
    if (typeof addToCart === 'function') {
        addToCart(cartItem, 1, cartItem.customizationDetails);
    } else {
        console.error('addToCart function not found');
        // Fallback: save directly to localStorage
        let cart = JSON.parse(localStorage.getItem('beans_cart') || '[]');
        cart.push({
            id: cartItem.id,
            name: cartItem.name,
            price: cartItem.price,
            image: cartItem.image_url,
            quantity: 1,
            customizations: cartItem.customizations
        });
        localStorage.setItem('beans_cart', JSON.stringify(cart));
        showMessage(`${cartItem.name} added to cart!`, 'success');
    }
    
    // Redirect to cart page after adding
    setTimeout(() => {
        window.location.href = 'cart.html';
    }, 1000);
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}