// Beans Cafe - Checkout JavaScript

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
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
            <div>
                <strong>${escapeHtml(item.name)}</strong> x ${item.quantity}
                ${item.customizations ? `<div style="font-size: 12px; color: #8B5E3C;">${escapeHtml(item.customizations)}</div>` : ''}
            </div>
            <div>₱${(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
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
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        return result;
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
            const pickupTime = document.getElementById('pickup-time').value;
            const orderNotes = document.getElementById('order-notes').value;
            
            if (!customerName || !customerPhone) {
                showMessage('Please fill in your name and phone number', 'error');
                return;
            }
            
            const cart = getCart();
            
            if (cart.length === 0) {
                showMessage('Your cart is empty', 'error');
                return;
            }
            
            const subtotal = getCartTotal();
            const total = subtotal;
            
            const orderData = {
                customerName: customerName,
                customerPhone: customerPhone,
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
                pickupTime: pickupTime,
                notes: orderNotes
            };
            
            isSubmitting = true;
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Placing Order...';
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
                window.location.href = `order-confirmation.html?order=${result.order.order_number}`;
            } else {
                showMessage(result.message || 'Failed to place order', 'error');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                isSubmitting = false;
            }
        });
    }
});

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}