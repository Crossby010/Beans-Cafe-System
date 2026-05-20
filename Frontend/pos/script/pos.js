// Beans Cafe - POS System (Point of Sale)
// Real-time order management with Socket.IO

let token = null;
let currentOrders = [];
let currentFilter = 'all';
let searchTerm = '';
let currentSelectedOrder = null;
let socket = null;
let notificationSound = null;
let audioContext = null;

// Check authentication
function checkAuth() {
    token = localStorage.getItem('admin_token');
    const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
    
    // Allow both admin and staff to access POS
    if (!token || (user.role !== 'admin' && user.role !== 'staff')) {
        window.location.href = '../Admin/login.html';  // Capital A
        return false;
    }
    return true;
}

// Initialize POS
document.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    
    // Initialize socket connection
    initSocket();
    
    // Load orders
    await loadOrders();
    await loadTodayStats();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start auto-refresh (every 10 seconds)
    setInterval(refreshOrders, 10000);
    
    // Initialize sound
    notificationSound = document.getElementById('notification-sound');
});

function initSocket() {
    // Connect to Socket.IO (same backend)
    socket = io('https://beans-cafe-backend.onrender.com', {
        transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
        console.log('🟢 POS connected to Socket.IO');
    });
    
    socket.on('new_order', (order) => {
        console.log('🆕 New order received:', order);
        playNotificationSound();
        loadOrders();
        showNotification('New Order!', `Order #${order.order_number} received`);
    });
    
    socket.on('order_status_update', (order) => {
        console.log('🔄 Order status updated:', order);
        loadOrders();
        
        if (currentSelectedOrder && currentSelectedOrder.id === order.id) {
            displayOrderDetails(order);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('🔴 POS disconnected from Socket.IO');
    });
}

function playNotificationSound() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        
        gain.gain.value = 0.2;
        
        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
        }, 200);
    } catch(e) {
        console.log('Sound not supported', e);
    }
}

function showNotification(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body: body, icon: '/favicon.ico' });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    
    const ordersList = document.querySelector('.orders-list');
    if (ordersList) {
        ordersList.style.animation = 'none';
        setTimeout(() => {
            ordersList.style.animation = '';
        }, 10);
    }
}

async function loadOrders() {
    try {
        const response = await fetch(`${API_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        currentOrders = data.orders || [];
        renderOrdersList();
        updateReadyQueue();
        updateOrdersCount();
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function renderOrdersList() {
    const container = document.getElementById('orders-list');
    if (!container) return;
    
    let filtered = [...currentOrders];
    
    if (currentFilter !== 'all') {
        filtered = filtered.filter(o => o.status === currentFilter);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(o => 
            o.order_number.toLowerCase().includes(searchTerm) ||
            o.customer_name.toLowerCase().includes(searchTerm) ||
            o.customer_phone.includes(searchTerm)
        );
    }
    
    filtered.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.created_at) - new Date(a.created_at);
    });
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No orders found</p></div>';
        return;
    }
    
    container.innerHTML = filtered.map(order => `
        <div class="order-card ${isNewOrder(order) ? 'new-order' : ''}" onclick="selectOrder(${order.id})">
            <div class="order-card-header">
                <span class="order-number">#${order.order_number}</span>
                <span class="order-time">${formatTime(order.created_at)}</span>
            </div>
            <div class="order-customer">${escapeHtml(order.customer_name)}</div>
            <div class="order-items">${order.items?.length || 0} items • ₱${parseFloat(order.total).toFixed(2)}</div>
            <span class="order-status status-${order.status}">${order.status}</span>
        </div>
    `).join('');
}

function isNewOrder(order) {
    const orderTime = new Date(order.created_at);
    const now = new Date();
    const diffSeconds = (now - orderTime) / 1000;
    return diffSeconds < 30 && order.status === 'pending';
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

async function selectOrder(orderId) {
    const order = currentOrders.find(o => o.id === orderId);
    if (!order) return;
    
    currentSelectedOrder = order;
    displayOrderDetails(order);
}

function displayOrderDetails(order) {
    const container = document.getElementById('order-details-panel');
    if (!container) return;
    
    const date = new Date(order.created_at);
    const formattedDate = date.toLocaleString();
    
    const itemsHtml = (order.items || []).map(item => `
        <div class="order-item">
            <div class="item-name">
                ${escapeHtml(item.name)}
                ${item.customizations ? `<div class="item-custom">${escapeHtml(item.customizations)}</div>` : ''}
            </div>
            <div class="item-qty">x${item.quantity}</div>
            <div class="item-price">₱${(item.price * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');
    
    container.innerHTML = `
        <div class="order-details">
            <div class="order-details-header">
                <h2>#${order.order_number}</h2>
                <span class="order-status status-${order.status}">${order.status}</span>
            </div>
            
            <div class="order-meta">
                <div class="meta-item">
                    <span class="meta-label">Customer</span>
                    <span class="meta-value">${escapeHtml(order.customer_name)}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Phone</span>
                    <span class="meta-value">${order.customer_phone}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Pickup Time</span>
                    <span class="meta-value">${order.pickup_time || 'ASAP'}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Ordered At</span>
                    <span class="meta-value">${formattedDate}</span>
                </div>
            </div>
            
            <div class="items-list">
                <h4>Items</h4>
                ${itemsHtml}
            </div>
            
            <div class="order-total">
                <span>Total</span>
                <span>₱${parseFloat(order.total).toFixed(2)}</span>
            </div>
            
            ${order.notes ? `<div class="order-notes"><strong>Notes:</strong> ${escapeHtml(order.notes)}</div>` : ''}
            
            <div class="status-actions">
                ${order.status !== 'completed' ? `
                    ${order.status === 'pending' ? `<button class="status-btn preparing" onclick="updateOrderStatus(${order.id}, 'preparing')">Start Preparing</button>` : ''}
                    ${order.status === 'preparing' ? `<button class="status-btn ready" onclick="updateOrderStatus(${order.id}, 'ready')">Mark as Ready</button>` : ''}
                    ${order.status === 'ready' ? `<button class="status-btn completed" onclick="updateOrderStatus(${order.id}, 'completed')">Complete Order</button>` : ''}
                ` : '<span style="color: #10b981;">✓ Order Completed</span>'}
            </div>
        </div>
    `;
}

async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: status })
        });
        
        if (response.ok) {
            await loadOrders();
            if (currentSelectedOrder && currentSelectedOrder.id === orderId) {
                const updated = currentOrders.find(o => o.id === orderId);
                if (updated) displayOrderDetails(updated);
            }
        }
    } catch (error) {
        console.error('Error updating order status:', error);
    }
}

function updateReadyQueue() {
    const container = document.getElementById('ready-queue-list');
    if (!container) return;
    
    const readyOrders = currentOrders.filter(o => o.status === 'ready');
    
    if (readyOrders.length === 0) {
        container.innerHTML = '<div class="empty-queue">No orders ready</div>';
        return;
    }
    
    container.innerHTML = readyOrders.map(order => `
        <div class="ready-item">
            <div>
                <strong>#${order.order_number}</strong>
                <small>${order.customer_name}</small>
            </div>
            <button class="complete-ready-btn" onclick="updateOrderStatus(${order.id}, 'completed')">
                <i class="fas fa-check"></i> Complete
            </button>
        </div>
    `).join('');
}

function updateOrdersCount() {
    const activeOrders = currentOrders.filter(o => o.status !== 'completed').length;
    const countElement = document.getElementById('orders-count');
    if (countElement) countElement.textContent = activeOrders;
}

async function loadTodayStats() {
    try {
        const response = await fetch(`${API_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const orders = data.orders || [];
        
        const today = new Date().toDateString();
        const todayOrders = orders.filter(o => 
            new Date(o.created_at).toDateString() === today && o.status === 'completed'
        );
        
        const completedCount = todayOrders.length;
        const totalRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
        
        const statsCompleted = document.getElementById('stats-completed');
        const statsRevenue = document.getElementById('stats-revenue');
        
        if (statsCompleted) statsCompleted.textContent = completedCount;
        if (statsRevenue) statsRevenue.textContent = `₱${totalRevenue.toFixed(2)}`;
        
        const hourCount = {};
        orders.forEach(o => {
            const hour = new Date(o.created_at).getHours();
            hourCount[hour] = (hourCount[hour] || 0) + 1;
        });
        
        let peakHour = 9;
        let maxCount = 0;
        for (const [hour, count] of Object.entries(hourCount)) {
            if (count > maxCount) {
                maxCount = count;
                peakHour = parseInt(hour);
            }
        }
        
        const statsPeak = document.getElementById('stats-peak');
        if (statsPeak) statsPeak.textContent = `${peakHour}:00 - ${peakHour + 1}:00`;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function refreshOrders() {
    await loadOrders();
    await loadTodayStats();
}

function setupEventListeners() {
    const searchInput = document.getElementById('search-orders');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value.toLowerCase();
            renderOrdersList();
        });
    }
    
    const filters = document.querySelectorAll('.filter-chip');
    filters.forEach(filter => {
        filter.addEventListener('click', () => {
            filters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            currentFilter = filter.dataset.status;
            renderOrdersList();
        });
    });
}

function closeOrderModal() {
    const modal = document.getElementById('order-modal');
    if (modal) modal.classList.remove('active');
}

function logoutPOS() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '../Admin/login.html';  // Capital A
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.getElementById('enableSoundBtn')?.addEventListener('click', () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            playNotificationSound();
        });
    } else {
        playNotificationSound();
    }
});