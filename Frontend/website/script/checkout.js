// Beans Cafe - Checkout JavaScript (COMPLETE)

let isSubmitting = false;

// Load order summary on checkout page
function loadCheckoutSummary() {
    const cart = getCart();
    const container = document.getElementById('checkout-items');
    
    if (!container) return;
    
    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }
    
    container.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <div class="checkout-item-info">
                <div class="checkout-item-name">
                    <strong>${escapeHtml(item.name)}</strong>
                    ${item.customizations ? `<div class="checkout-item-custom">${escapeHtml(item.customizations)}</div>` : ''}
                </div>
                <div class="checkout-item-quantity">x${item.quantity}</div>
            </div>
            <div class="checkout-item-price">₱${(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');
    
    const subtotal = getCartTotal();
    const total = subtotal;
    
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total');
    
    if (subtotalEl) subtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `₱${total.toFixed(2)}`;
}

// Submit order
async function submitOrder(orderData) {
    try {
        let response;
        
        if (API_MODE === 'mock') {
            // Mock successful order
            const mockOrder = {
                success: true,
                order: {
                    id: Math.floor(Math.random() * 10000),
                    order_number: `BNS${Date.now()}`,
                    customer_name: orderData.customerName,
                    total: orderData.total,
                    status: 'pending'
                }
            };
            response = mockOrder;
        } else {
            const res = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            response = await res.json();
        }
        
        return response;
    } catch (error) {
        console.error('Error submitting order:', error);
        return { success: false, message: 'Network error: ' + error.message };
    }
}

// Handle checkout form submission
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (isSubmitting) {
                console.log('Already submitting, ignoring...');
                return;
            }
            
            const customerName = document.getElementById('customer-name').value.trim();
            const customerPhone = document.getElementById('customer-phone').value.trim();
            const customerEmail = document.getElementById('customer-email')?.value.trim() || '';
            const pickupTime = document.getElementById('pickup-time').value;
            const scheduleTime = document.getElementById('schedule-time')?.value || '';
            const orderNotes = document.getElementById('order-notes').value;
            
            let paymentMethod = 'pickup';
            if (document.getElementById('payment-gcash')?.checked) paymentMethod = 'gcash';
            if (document.getElementById('payment-card')?.checked) paymentMethod = 'card';
            
            if (!customerName || !customerPhone) {
                showMessage('Please fill in your name and phone number', 'error');
                return;
            }
            
            if (customerPhone.length < 10) {
                showMessage('Please enter a valid phone number', 'error');
                return;
            }
            
            const cart = getCart();
            
            if (cart.length === 0) {
                showMessage('Your cart is empty', 'error');
                return;
            }
            
            const subtotal = getCartTotal();
            const total = subtotal;
            
            const finalPickupTime = pickupTime === 'schedule' ? scheduleTime : pickupTime;
            
            const orderData = {
                customerName: customerName,
                customerPhone: customerPhone,
                customerEmail: customerEmail,
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: parseFloat(item.price),
                    quantity: item.quantity,
                    customizations: item.customizations || null
                })),
                subtotal: subtotal,
                total: total,
                orderType: 'pickup',
                source: 'website',
                pickupTime: finalPickupTime || 'ASAP',
                notes: orderNotes,
                paymentMethod: paymentMethod
            };
            
            isSubmitting = true;
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';
            submitBtn.disabled = true;
            
            const result = await submitOrder(orderData);
            
            if (result.success && result.order) {
                const orderToSave = {
                    order_number: result.order.order_number,
                    items: orderData.items,
                    total: orderData.total,
                    customer_name: customerName,
                    created_at: new Date().toISOString()
                };
                
                localStorage.setItem('last_order', JSON.stringify(orderToSave));
                clearCart();
                isSubmitting = false;
                
                showMessage('Order placed successfully! Redirecting...', 'success');
                
                setTimeout(() => {
                    window.location.href = `order-confirmation.html?order=${result.order.order_number}`;
                }, 1500);
            } else {
                showMessage(result.message || 'Failed to place order', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                isSubmitting = false;
            }
        });
    }
});

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add checkout styles
const checkoutStyles = document.createElement('style');
checkoutStyles.textContent = `
    .checkout-section {
        padding: 100px 0 80px;
    }
    
    .checkout-header {
        text-align: center;
        margin-bottom: 50px;
    }
    
    .checkout-grid {
        display: grid;
        grid-template-columns: 1fr 1.5fr;
        gap: 40px;
        max-width: 1200px;
        margin: 0 auto;
    }
    
    .checkout-summary,
    .checkout-form-container {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        padding: 30px;
        box-shadow: var(--shadow-sm);
    }
    
    .checkout-summary h3,
    .checkout-form-container h3 {
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .checkout-items {
        margin-bottom: 20px;
    }
    
    .checkout-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--border-light);
    }
    
    .checkout-item-info {
        flex: 1;
    }
    
    .checkout-item-custom {
        font-size: 12px;
        color: var(--text-muted);
        margin-top: 4px;
    }
    
    .checkout-item-quantity {
        font-size: 14px;
        color: var(--text-muted);
        margin-top: 4px;
    }
    
    .checkout-item-price {
        font-weight: 600;
        color: var(--primary);
    }
    
    .summary-totals {
        margin-top: 20px;
        padding-top: 15px;
        border-top: 2px solid var(--border);
    }
    
    .summary-line {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
    }
    
    .summary-line.total {
        font-size: 18px;
        font-weight: 700;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid var(--border);
        color: var(--primary);
    }
    
    .form-group {
        margin-bottom: 20px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
    }
    
    .form-group label i {
        margin-right: 8px;
        color: var(--primary);
    }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
        width: 100%;
        padding: 12px 15px;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        background: var(--bg-tertiary);
        color: var(--text-primary);
        font-family: var(--font-body);
    }
    
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: var(--primary);
    }
    
    .form-group small {
        display: block;
        margin-top: 5px;
        font-size: 12px;
        color: var(--text-muted);
    }
    
    .payment-methods {
        margin: 25px 0;
        padding: 20px;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
    }
    
    .payment-methods h4 {
        margin-bottom: 15px;
    }
    
    .payment-option {
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .payment-option input {
        width: auto;
    }
    
    .order-buttons {
        display: flex;
        gap: 15px;
        margin-top: 25px;
    }
    
    .order-buttons .btn {
        flex: 1;
    }
    
    .whatsapp-order-btn {
        background: #25D366 !important;
        color: white !important;
        border: none !important;
    }
    
    .whatsapp-order-btn:hover {
        background: #128C7E !important;
    }
    
    @media (max-width: 768px) {
        .checkout-grid {
            grid-template-columns: 1fr;
            gap: 20px;
        }
        
        .order-buttons {
            flex-direction: column;
        }
        
        .checkout-section {
            padding: 80px 0 60px;
        }
    }
`;
document.head.appendChild(checkoutStyles);