// Beans Cafe - WhatsApp Order Button
// Direct ordering via WhatsApp

document.addEventListener('DOMContentLoaded', function() {
    if (APP_CONFIG.FEATURES.whatsappButton) {
        createWhatsAppButton();
    }
});

function createWhatsAppButton() {
    // Check if button already exists
    if (document.querySelector('.whatsapp-btn')) return;
    
    const whatsappNumber = APP_CONFIG.BUSINESS.whatsapp;
    const businessName = APP_CONFIG.BUSINESS.name;
    
    const button = document.createElement('div');
    button.className = 'whatsapp-btn';
    button.innerHTML = `
        <div class="whatsapp-tooltip">Order on WhatsApp</div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="28" height="28">
            <path fill="white" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.2-17.1-41.4-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
        </svg>
    `;
    
    document.body.appendChild(button);
    
    // Add styles
    addWhatsAppStyles();
    
    // Add click handler
    button.addEventListener('click', () => {
        openWhatsApp();
    });
}

function addWhatsAppStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .whatsapp-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #25D366;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            z-index: 9998;
        }
        
        .whatsapp-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }
        
        .whatsapp-tooltip {
            position: absolute;
            right: 70px;
            background: #1A1A1A;
            color: white;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .whatsapp-btn:hover .whatsapp-tooltip {
            opacity: 1;
            visibility: visible;
            transform: translateX(-5px);
        }
        
        @media (max-width: 768px) {
            .whatsapp-btn {
                bottom: 70px;
                right: 16px;
                width: 48px;
                height: 48px;
            }
            
            .whatsapp-btn svg {
                width: 24px;
                height: 24px;
            }
        }
    `;
    document.head.appendChild(style);
}

function openWhatsApp() {
    // Get current cart items if any
    const cart = getCart ? getCart() : [];
    let message = `Hello! I'd like to place an order from ${APP_CONFIG.BUSINESS.name}.%0a%0a`;
    
    if (cart.length > 0) {
        message += `*My Order:*%0a`;
        cart.forEach(item => {
            message += `- ${item.name} x${item.quantity} - ₱${(item.price * item.quantity).toFixed(2)}%0a`;
        });
        message += `%0a*Total:* ₱${getCartTotal ? getCartTotal().toFixed(2) : '0'}.00%0a%0a`;
    }
    
    message += `*Customer Details:*%0a`;
    message += `Name: %0a`;
    message += `Phone: %0a`;
    message += `Pickup Time: %0a%0a`;
    message += `Thank you! ☕`;
    
    const url = `https://wa.me/${APP_CONFIG.BUSINESS.whatsapp}?text=${message}`;
    window.open(url, '_blank');
}

// Also add to cart page - pre-fill order details
function addWhatsAppToCheckout() {
    const checkoutBtn = document.querySelector('#checkout-form button[type="submit"]');
    if (checkoutBtn && !document.querySelector('.whatsapp-order-btn')) {
        const whatsappBtn = document.createElement('button');
        whatsappBtn.type = 'button';
        whatsappBtn.className = 'btn btn-secondary whatsapp-order-btn';
        whatsappBtn.innerHTML = '💬 Order via WhatsApp';
        whatsappBtn.style.marginTop = '10px';
        whatsappBtn.onclick = (e) => {
            e.preventDefault();
            const name = document.getElementById('customer-name')?.value || '';
            const phone = document.getElementById('customer-phone')?.value || '';
            const pickupTime = document.getElementById('pickup-time')?.value || 'ASAP';
            
            let message = `Hello! I'd like to place an order from ${APP_CONFIG.BUSINESS.name}.%0a%0a`;
            
            const cart = getCart ? getCart() : [];
            if (cart.length > 0) {
                message += `*My Order:*%0a`;
                cart.forEach(item => {
                    message += `- ${item.name} x${item.quantity} - ₱${(item.price * item.quantity).toFixed(2)}%0a`;
                });
                message += `%0a*Total:* ₱${getCartTotal ? getCartTotal().toFixed(2) : '0'}.00%0a%0a`;
            }
            
            message += `*Customer Details:*%0a`;
            message += `Name: ${name}%0a`;
            message += `Phone: ${phone}%0a`;
            message += `Pickup Time: ${pickupTime}%0a%0a`;
            message += `Thank you! ☕`;
            
            const url = `https://wa.me/${APP_CONFIG.BUSINESS.whatsapp}?text=${message}`;
            window.open(url, '_blank');
        };
        
        checkoutBtn.parentElement.appendChild(whatsappBtn);
    }
}