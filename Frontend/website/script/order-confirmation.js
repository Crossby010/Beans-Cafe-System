// Beans Cafe - Order Confirmation JavaScript

let currentOrder = null;

document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    
    // Get order number from URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('order');
    
    console.log('Order number from URL:', orderNumber);
    
    if (orderNumber && orderNumber !== 'undefined' && orderNumber !== 'null') {
        document.getElementById('order-number').textContent = orderNumber;
        
        // Generate QR Code with order details
        const qrData = JSON.stringify({
            orderNumber: orderNumber,
            cafe: "Beans Cafe",
            timestamp: new Date().toISOString()
        });
        
        // Clear QR container first
        const qrcodeContainer = document.getElementById("qrcode");
        if (qrcodeContainer) {
            qrcodeContainer.innerHTML = '';
            
            // Create QR Code
            try {
                new QRCode(qrcodeContainer, {
                    text: qrData,
                    width: 200,
                    height: 200,
                    colorDark: "#6F4E37",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
                console.log('QR Code generated successfully');
            } catch (error) {
                console.error('QR Code error:', error);
                qrcodeContainer.innerHTML = '<p style="color: red;">Failed to generate QR code</p>';
            }
        }
    } else {
        console.log('No valid order number found');
        document.getElementById('order-number').textContent = '---';
    }
    
    // Get last order from localStorage
    const lastOrder = localStorage.getItem('last_order');
    console.log('Last order from localStorage:', lastOrder);
    
    if (lastOrder) {
        try {
            currentOrder = JSON.parse(lastOrder);
            displayReceipt(currentOrder);
        } catch (e) {
            console.error('Error parsing order:', e);
        }
    } else {
        // Try to get from session
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
});

function displayReceipt(order) {
    const receiptContainer = document.getElementById('receipt-content');
    
    if (!receiptContainer) return;
    
    const date = new Date().toLocaleString('en-PH');
    
    let receiptHtml = `
        <div style="font-family: monospace; font-size: 14px;">
            <div style="text-align: center; margin-bottom: 15px;">
                <strong>BEANS CAFE</strong><br>
                123 Coffee Street, Pasig City<br>
                Tel: (02) 1234 5678<br>
                ${date}
            </div>
            <div style="border-top: 1px dashed #333; border-bottom: 1px dashed #333; padding: 10px 0; margin: 10px 0;">
                <div style="display: flex; justify-content: space-between;">
                    <strong>Order #: ${order.order_number || 'N/A'}</strong>
                    <strong>Pickup</strong>
                </div>
            </div>
            <div style="margin-bottom: 10px;">
    `;
    
    if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
            receiptHtml += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>${escapeHtml(item.name)} x ${item.quantity}</span>
                    <span>₱${(item.price * item.quantity).toFixed(2)}</span>
                </div>
                ${item.customizations ? `<div style="font-size: 11px; color: #666; margin-left: 10px; margin-bottom: 5px;">${escapeHtml(item.customizations)}</div>` : ''}
            `;
        });
    } else {
        receiptHtml += `<div style="text-align: center;">Loading items...</div>`;
    }
    
    receiptHtml += `
            </div>
            <div style="border-top: 1px dashed #333; padding-top: 10px;">
                <div style="display: flex; justify-content: space-between;">
                    <strong>TOTAL</strong>
                    <strong>₱${(order.total || 0).toFixed(2)}</strong>
                </div>
            </div>
            <div style="text-align: center; margin-top: 15px; font-size: 11px;">
                Thank you for choosing Beans Cafe!<br>
                Please present this receipt upon pickup.
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
    
    const receiptHtml = document.getElementById('receipt-content').innerHTML;
    const orderNumber = currentOrder.order_number || 'N/A';
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Beans Cafe Receipt - ${orderNumber}</title>
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        padding: 20px;
                        max-width: 400px;
                        margin: 0 auto;
                    }
                    .receipt {
                        border: 1px solid #ccc;
                        padding: 20px;
                        border-radius: 8px;
                    }
                    .text-center { text-align: center; }
                    .divider { border-top: 1px dashed #333; margin: 10px 0; }
                    .flex { display: flex; justify-content: space-between; }
                    .bold { font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="receipt">
                    ${receiptHtml}
                </div>
                <div class="text-center" style="margin-top: 20px;">
                    <p>QR Code: ${orderNumber}</p>
                    <p>Scan at pickup for verification</p>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 1000);
                    }
                <\/script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}