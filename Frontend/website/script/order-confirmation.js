// Beans Cafe - Order Confirmation JavaScript (FIXED - Theme QR + Proper Receipt)

let currentOrder = null;

document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    loadCafeSettings();
    
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('order');
    
    if (orderNumber && orderNumber !== 'undefined' && orderNumber !== 'null') {
        document.getElementById('order-number').textContent = orderNumber;
        generateThemeQRCode(orderNumber);
        calculateEstimatedTime();
    } else {
        document.getElementById('order-number').textContent = '---';
    }
    
    const lastOrder = localStorage.getItem('last_order');
    
    if (lastOrder) {
        try {
            currentOrder = JSON.parse(lastOrder);
            displayReceipt(currentOrder);
        } catch (e) {
            console.error('Error parsing order:', e);
        }
    } else {
        const urlOrder = urlParams.get('order');
        if (urlOrder) {
            currentOrder = {
                order_number: urlOrder,
                items: [],
                total: 0,
                customer_name: 'Customer'
            };
            displayReceipt(currentOrder);
        }
    }
    
    if (typeof refreshAnimations === 'function') {
        refreshAnimations();
    }
});

function getThemePrimaryColor() {
    const primaryColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary')
        .trim();
    return primaryColor || '#C6A43F';
}

function generateThemeQRCode(orderNumber) {
    const qrcodeContainer = document.getElementById("qrcode");
    if (!qrcodeContainer) return;
    
    qrcodeContainer.innerHTML = '';
    
    const primaryColor = getThemePrimaryColor();
    const qrData = JSON.stringify({
        orderNumber: orderNumber,
        cafe: (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.BUSINESS) ? APP_CONFIG.BUSINESS.name : "Beans Cafe",
        timestamp: new Date().toISOString()
    });
    
    // Use canvas-based QR code that supports custom colors
    if (typeof QRCode !== 'undefined') {
        try {
            // Create a wrapper div with custom styling
            const qrWrapper = document.createElement('div');
            qrWrapper.style.display = 'flex';
            qrWrapper.style.justifyContent = 'center';
            qrWrapper.style.alignItems = 'center';
            qrWrapper.style.padding = '10px';
            qrWrapper.style.background = 'white';
            qrWrapper.style.borderRadius = '12px';
            qrWrapper.style.display = 'inline-block';
            qrWrapper.style.margin = '0 auto';
            
            qrcodeContainer.appendChild(qrWrapper);
            
            new QRCode(qrWrapper, {
                text: qrData,
                width: 160,
                height: 160,
                colorDark: primaryColor,
                colorLight: "#FFFFFF",
                correctLevel: QRCode.CorrectLevel.H
            });
            
            // Add a border with theme color
            qrWrapper.style.border = `2px solid ${primaryColor}`;
            
        } catch (error) {
            console.error('QR Code error:', error);
            qrcodeContainer.innerHTML = createFallbackQR(orderNumber, primaryColor);
        }
    } else {
        qrcodeContainer.innerHTML = createFallbackQR(orderNumber, primaryColor);
    }
}

function createFallbackQR(orderNumber, primaryColor) {
    return `
        <div style="text-align: center;">
            <div style="width: 160px; height: 160px; background: white; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto; border: 2px solid ${primaryColor};">
                <i class="fas fa-receipt" style="font-size: 48px; color: ${primaryColor}; margin-bottom: 10px;"></i>
                <span style="font-size: 11px; color: #666;">Order #</span>
                <strong style="font-size: 14px; color: ${primaryColor};">${orderNumber}</strong>
            </div>
            <small style="display: block; margin-top: 10px;">Show this screen at pickup</small>
        </div>
    `;
}

function calculateEstimatedTime() {
    const estimatedTimeSpan = document.getElementById('estimated-time');
    if (!estimatedTimeSpan) return;
    
    const lastOrder = localStorage.getItem('last_order');
    if (lastOrder) {
        try {
            const order = JSON.parse(lastOrder);
            const itemCount = order.items?.length || 0;
            let minutes = 15;
            
            if (itemCount > 5) {
                minutes = 25;
            } else if (itemCount > 3) {
                minutes = 20;
            } else {
                minutes = 15;
            }
            
            estimatedTimeSpan.textContent = `${minutes}-${minutes + 5} minutes`;
        } catch (e) {
            estimatedTimeSpan.textContent = '15-20 minutes';
        }
    } else {
        estimatedTimeSpan.textContent = '15-20 minutes';
    }
}

function displayReceipt(order) {
    const receiptContainer = document.getElementById('receipt-content');
    
    if (!receiptContainer) return;
    
    const date = new Date().toLocaleString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const businessName = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.BUSINESS) ? APP_CONFIG.BUSINESS.name : 'Beans Cafe';
    const businessAddress = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.BUSINESS) ? APP_CONFIG.BUSINESS.address : '123 Coffee Street, Pasig City';
    const businessPhone = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.BUSINESS) ? APP_CONFIG.BUSINESS.phone : '(02) 1234 5678';
    
    let receiptHtml = `
        <div class="receipt">
            <div class="receipt-header">
                <i class="fas fa-mug-hot"></i>
                <h3>${businessName}</h3>
                <p>${businessAddress}</p>
                <p>Tel: ${businessPhone}</p>
                <div class="receipt-divider"></div>
                <p>${date}</p>
            </div>
            
            <div class="receipt-order-info">
                <div class="receipt-order-row">
                    <strong>Order #:</strong>
                    <span>${order.order_number || 'N/A'}</span>
                </div>
                <div class="receipt-order-row">
                    <strong>Type:</strong>
                    <span>Pickup</span>
                </div>
                <div class="receipt-order-row">
                    <strong>Customer:</strong>
                    <span>${escapeHtml(order.customer_name || 'Guest')}</span>
                </div>
            </div>
            
            <div class="receipt-divider"></div>
            
            <div class="receipt-items">
                <div class="receipt-items-header">
                    <span>Item</span>
                    <span>Qty</span>
                    <span>Price</span>
                </div>
    `;
    
    if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
            const itemTotal = (item.price * item.quantity);
            receiptHtml += `
                <div class="receipt-item">
                    <div class="receipt-item-name">
                        ${escapeHtml(item.name)}
                        ${item.customizations ? `<div class="receipt-item-custom">${escapeHtml(item.customizations)}</div>` : ''}
                    </div>
                    <div class="receipt-item-qty">x${item.quantity}</div>
                    <div class="receipt-item-price">₱${itemTotal.toFixed(2)}</div>
                </div>
            `;
        });
    } else {
        receiptHtml += `<div class="receipt-empty">Loading items...</div>`;
    }
    
    receiptHtml += `
            </div>
            
            <div class="receipt-divider"></div>
            
            <div class="receipt-total">
                <div class="receipt-total-row">
                    <span>Subtotal:</span>
                    <span>₱${(order.total || 0).toFixed(2)}</span>
                </div>
                <div class="receipt-total-row total">
                    <strong>TOTAL:</strong>
                    <strong>₱${(order.total || 0).toFixed(2)}</strong>
                </div>
            </div>
            
            <div class="receipt-divider"></div>
            
            <div class="receipt-footer">
                <p>Thank you for choosing ${businessName}!</p>
                <p>Please present this receipt upon pickup.</p>
            </div>
        </div>
    `;
    
    receiptContainer.innerHTML = receiptHtml;
}

function downloadReceipt() {
    if (!currentOrder) {
        showMessage('No receipt data available', 'error');
        return;
    }
    
    const orderNumber = currentOrder.order_number || 'N/A';
    const businessName = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.BUSINESS) ? APP_CONFIG.BUSINESS.name : 'Beans Cafe';
    const businessAddress = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.BUSINESS) ? APP_CONFIG.BUSINESS.address : '123 Coffee Street, Pasig City';
    const businessPhone = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.BUSINESS) ? APP_CONFIG.BUSINESS.phone : '(02) 1234 5678';
    const date = new Date().toLocaleString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Build receipt HTML for print/download (thermal receipt style)
    let itemsHtml = '';
    if (currentOrder.items && currentOrder.items.length > 0) {
        currentOrder.items.forEach(item => {
            const itemTotal = (item.price * item.quantity);
            itemsHtml += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <div style="flex: 2;">
                        ${escapeHtml(item.name)}
                        ${item.customizations ? `<div style="font-size: 9px; color: #666; margin-top: 2px;">${escapeHtml(item.customizations)}</div>` : ''}
                    </div>
                    <div style="width: 35px; text-align: center;">${item.quantity}</div>
                    <div style="width: 70px; text-align: right;">₱${itemTotal.toFixed(2)}</div>
                </div>
            `;
        });
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${businessName} Receipt - ${orderNumber}</title>
            <meta charset="UTF-8">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Courier New', 'Monaco', 'Monospace';
                    font-size: 12px;
                    padding: 16px;
                    max-width: 280px;
                    margin: 0 auto;
                    background: #ffffff;
                    color: #000000;
                }
                .receipt {
                    border: 1px dashed #999;
                    padding: 12px;
                }
                .receipt-header {
                    text-align: center;
                    margin-bottom: 12px;
                }
                .receipt-header h3 {
                    font-size: 14px;
                    margin: 4px 0;
                    letter-spacing: 1px;
                }
                .receipt-header p {
                    font-size: 9px;
                    margin: 2px 0;
                }
                .receipt-divider {
                    border-top: 1px dashed #999;
                    margin: 8px 0;
                }
                .receipt-order-info {
                    margin: 8px 0;
                    font-size: 10px;
                }
                .receipt-order-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 3px;
                }
                .receipt-items-header {
                    display: flex;
                    justify-content: space-between;
                    font-weight: bold;
                    margin-bottom: 6px;
                    border-bottom: 1px dotted #999;
                    padding-bottom: 3px;
                    font-size: 10px;
                }
                .receipt-items {
                    margin: 8px 0;
                }
                .receipt-total {
                    margin-top: 8px;
                }
                .receipt-total-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 3px;
                    font-size: 10px;
                }
                .receipt-total-row.total {
                    font-size: 12px;
                    font-weight: bold;
                    margin-top: 6px;
                    padding-top: 6px;
                    border-top: 1px dashed #999;
                }
                .receipt-footer {
                    text-align: center;
                    margin-top: 12px;
                    font-size: 9px;
                    color: #666;
                }
                
                /* Styled Buttons */
                .button-container {
                    text-align: center;
                    margin-top: 20px;
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }
                .btn-print, .btn-close {
                    padding: 10px 24px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    font-weight: bold;
                    cursor: pointer;
                    border: none;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }
                .btn-print {
                    background: #2D6A4F;
                    color: white;
                }
                .btn-print:hover {
                    background: #1B4332;
                    transform: translateY(-1px);
                }
                .btn-close {
                    background: #6c757d;
                    color: white;
                }
                .btn-close:hover {
                    background: #5a6268;
                    transform: translateY(-1px);
                }
                
                @media print {
                    body {
                        margin: 0;
                        padding: 8px;
                    }
                    .no-print {
                        display: none;
                    }
                    .receipt {
                        border: none;
                    }
                    .button-container {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="receipt-header">
                    <h3>${businessName}</h3>
                    <p>${businessAddress}</p>
                    <p>Tel: ${businessPhone}</p>
                    <div class="receipt-divider"></div>
                    <p>${date}</p>
                </div>
                
                <div class="receipt-order-info">
                    <div class="receipt-order-row">
                        <strong>Order #:</strong>
                        <span>${orderNumber}</span>
                    </div>
                    <div class="receipt-order-row">
                        <strong>Type:</strong>
                        <span>Pickup</span>
                    </div>
                    <div class="receipt-order-row">
                        <strong>Customer:</strong>
                        <span>${escapeHtml(currentOrder.customer_name || 'Guest')}</span>
                    </div>
                </div>
                
                <div class="receipt-divider"></div>
                
                <div class="receipt-items">
                    <div class="receipt-items-header">
                        <span>ITEM</span>
                        <span>QTY</span>
                        <span>AMOUNT</span>
                    </div>
                    ${itemsHtml}
                </div>
                
                <div class="receipt-divider"></div>
                
                <div class="receipt-total">
                    <div class="receipt-total-row">
                        <span>SUBTOTAL:</span>
                        <span>₱${(currentOrder.total || 0).toFixed(2)}</span>
                    </div>
                    <div class="receipt-total-row total">
                        <strong>TOTAL:</strong>
                        <strong>₱${(currentOrder.total || 0).toFixed(2)}</strong>
                    </div>
                </div>
                
                <div class="receipt-divider"></div>
                
                <div class="receipt-footer">
                    <p>Thank you for choosing ${businessName}!</p>
                    <p>Please present this receipt upon pickup.</p>
                </div>
            </div>
            
            <div class="button-container no-print">
                <button class="btn-print" onclick="window.print()">
                    🖨️ PRINT RECEIPT
                </button>
                <button class="btn-close" onclick="window.close()">
                    ✖️ CLOSE
                </button>
            </div>
            
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 300);
                }
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function shareOrder() {
    const orderNumber = document.getElementById('order-number')?.textContent || '';
    const businessName = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.BUSINESS) ? APP_CONFIG.BUSINESS.name : 'Beans Cafe';
    const message = `🎉 I just placed an order at ${businessName}!%0a%0aOrder #: ${orderNumber}%0aReady for pickup in 15-20 minutes!%0a%0a☕ ${businessName}`;
    const url = `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
}

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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add missing CSS styles
if (!document.querySelector('#confirmation-styles')) {
    const confirmationStyles = document.createElement('style');
    confirmationStyles.id = 'confirmation-styles';
    confirmationStyles.textContent = `
        .confirmation-section {
            padding: 100px 0 80px;
            min-height: 100vh;
        }
        
        .confirmation-card {
            max-width: 600px;
            margin: 0 auto;
            background: var(--bg-card);
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            box-shadow: var(--shadow-lg);
            border: 1px solid var(--border);
        }
        
        .success-animation {
            margin-bottom: 20px;
        }
        
        .success-checkmark {
            width: 80px;
            height: 80px;
            margin: 0 auto;
        }
        
        .check-icon {
            width: 80px;
            height: 80px;
            position: relative;
            border-radius: 50%;
            box-sizing: content-box;
            border: 4px solid #10b981;
        }
        
        .icon-line {
            height: 5px;
            background-color: #10b981;
            display: block;
            border-radius: 2px;
            position: absolute;
            z-index: 10;
        }
        
        .icon-line.line-tip {
            top: 46px;
            left: 14px;
            width: 25px;
            transform: rotate(45deg);
            animation: icon-line-tip 0.75s;
        }
        
        .icon-line.line-long {
            top: 38px;
            right: 8px;
            width: 47px;
            transform: rotate(-45deg);
            animation: icon-line-long 0.75s;
        }
        
        .icon-circle {
            top: -4px;
            left: -4px;
            z-index: 10;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            position: absolute;
            box-sizing: content-box;
            border: 4px solid rgba(16, 185, 129, 0.3);
        }
        
        @keyframes icon-line-tip {
            from { width: 0; opacity: 0; }
            to { width: 25px; opacity: 1; }
        }
        
        @keyframes icon-line-long {
            from { width: 0; opacity: 0; }
            to { width: 47px; opacity: 1; }
        }
        
        .confirmation-card h1 {
            font-size: 28px;
            margin-bottom: 10px;
            color: var(--text-primary);
        }
        
        .success-message {
            color: var(--text-secondary);
            margin-bottom: 30px;
        }
        
        .order-number-container {
            background: var(--bg-secondary);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .order-label {
            font-size: 12px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .order-number {
            font-size: 32px;
            font-family: monospace;
            margin: 10px 0;
            color: var(--primary);
        }
        
        .order-status-badge {
            display: inline-block;
            background: rgba(245, 158, 11, 0.1);
            color: #f59e0b;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
        }
        
        .estimated-time {
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            color: white;
            border-radius: 16px;
            padding: 15px 20px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .estimated-time i {
            font-size: 32px;
        }
        
        .estimated-time span {
            font-size: 12px;
            opacity: 0.9;
        }
        
        .estimated-time strong {
            font-size: 18px;
            display: block;
        }
        
        .qrcode-container {
            background: var(--bg-secondary);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .qrcode {
            display: flex;
            justify-content: center;
            margin: 15px 0;
        }
        
        .order-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--border);
        }
        
        .tab-btn {
            padding: 10px 20px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 14px;
            color: var(--text-secondary);
            transition: all 0.2s;
        }
        
        .tab-btn.active {
            color: var(--primary);
            border-bottom: 2px solid var(--primary);
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
            animation: fadeIn 0.3s ease;
        }
        
        .receipt-card {
            background: var(--bg-secondary);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 20px;
            max-height: 450px;
            overflow-y: auto;
        }
        
        .receipt {
            font-family: 'Courier New', monospace;
            font-size: 12px;
        }
        
        .receipt-header {
            text-align: center;
            margin-bottom: 15px;
        }
        
        .receipt-header i {
            font-size: 28px;
            color: var(--primary);
        }
        
        .receipt-header h3 {
            font-size: 16px;
            margin: 5px 0;
        }
        
        .receipt-divider {
            border-top: 1px dashed var(--border);
            margin: 8px 0;
        }
        
        .receipt-order-info {
            margin: 8px 0;
        }
        
        .receipt-order-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
        }
        
        .receipt-items-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            margin-bottom: 8px;
            border-bottom: 1px dotted var(--border);
            padding-bottom: 4px;
        }
        
        .receipt-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
        }
        
        .receipt-item-name {
            flex: 2;
            text-align: left;
        }
        
        .receipt-item-custom {
            font-size: 9px;
            color: var(--text-muted);
            margin-top: 2px;
        }
        
        .receipt-item-qty {
            width: 40px;
            text-align: center;
        }
        
        .receipt-item-price {
            width: 70px;
            text-align: right;
        }
        
        .receipt-total {
            margin-top: 8px;
        }
        
        .receipt-total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
        }
        
        .receipt-total-row.total {
            font-size: 14px;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px dashed var(--border);
            color: var(--primary);
        }
        
        .receipt-footer {
            text-align: center;
            margin-top: 12px;
            font-size: 10px;
            color: var(--text-muted);
        }
        
        .receipt-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .instructions-card {
            background: var(--bg-secondary);
            border-radius: 16px;
            padding: 20px;
            text-align: left;
        }
        
        .instructions-card h3 {
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .instructions-card ol {
            margin-left: 20px;
            margin-bottom: 20px;
        }
        
        .instructions-card li {
            margin-bottom: 10px;
        }
        
        .cafe-info, .hours-info {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid var(--border);
        }
        
        .confirmation-actions {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 20px;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInRight {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fadeOut {
            to { opacity: 0; visibility: hidden; }
        }
        
        @media (max-width: 768px) {
            .confirmation-card {
                padding: 25px;
                margin: 0 15px;
            }
            
            .confirmation-card h1 {
                font-size: 24px;
            }
            
            .order-number {
                font-size: 24px;
            }
            
            .confirmation-actions {
                flex-direction: column;
            }
            
            .confirmation-actions .btn {
                width: 100%;
            }
            
            .receipt-actions {
                flex-direction: column;
            }
        }
    `;
    document.head.appendChild(confirmationStyles);
}