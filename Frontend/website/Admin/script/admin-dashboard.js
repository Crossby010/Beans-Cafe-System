// Beans Cafe - Admin Dashboard (COMPLETE)
// Modern admin panel with full functionality

const API_URL = 'https://beans-cafe-backend.onrender.com/api';
let token = null;

// ============ AUTHENTICATION ============
function checkAuth() {
    token = localStorage.getItem('admin_token');
    const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
    
    if (!token || user.role !== 'admin') {
        window.location.href = 'login.html';
        return false;
    }
    
    const adminNameSpan = document.getElementById('admin-name');
    const adminNameHeader = document.getElementById('admin-name-header');
    if (adminNameSpan) adminNameSpan.textContent = user.firstName || 'Admin';
    if (adminNameHeader) adminNameHeader.textContent = user.firstName || 'Admin';
    return true;
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers }
    });
    
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
}

// ============ DASHBOARD STATS ============
async function loadDashboardStats() {
    try {
        const products = await apiRequest('/products');
        const orders = await apiRequest('/orders');
        
        const totalProducts = (products.products || []).length;
        const pendingOrders = (orders.orders || []).filter(function(o) { 
            return o.status === 'pending' || o.status === 'preparing'; 
        }).length;
        const totalOrders = (orders.orders || []).length;
        
        let totalRevenue = 0;
        if (orders.orders && orders.orders.length > 0) {
            totalRevenue = orders.orders.reduce(function(sum, o) { 
                if (o.status === 'completed' || o.status === 'delivered') {
                    return sum + (parseFloat(o.total) || 0);
                }
                return sum;
            }, 0);
        }
        
        const totalProductsEl = document.getElementById('total-products');
        const pendingOrdersEl = document.getElementById('pending-orders');
        const totalOrdersEl = document.getElementById('total-orders');
        const totalRevenueEl = document.getElementById('total-revenue');
        
        if (totalProductsEl) totalProductsEl.textContent = totalProducts;
        if (pendingOrdersEl) pendingOrdersEl.textContent = pendingOrders;
        if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
        if (totalRevenueEl) totalRevenueEl.textContent = '₱' + totalRevenue.toFixed(2);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadModernDashboard() {
    try {
        const orders = await apiRequest('/orders');
        const products = await apiRequest('/products');
        
        const orderList = orders.orders || [];
        
        const today = new Date().toDateString();
        const todayOrders = orderList.filter(function(o) {
            return new Date(o.created_at).toDateString() === today;
        });
        const todaySales = todayOrders.reduce(function(sum, o) { 
            if (o.status === 'completed' || o.status === 'delivered') {
                return sum + (parseFloat(o.total) || 0);
            }
            return sum;
        }, 0);
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekOrders = orderList.filter(function(o) {
            return new Date(o.created_at) >= weekAgo;
        });
        const weekSales = weekOrders.reduce(function(sum, o) { 
            if (o.status === 'completed' || o.status === 'delivered') {
                return sum + (parseFloat(o.total) || 0);
            }
            return sum;
        }, 0);
        
        const totalRevenue = orderList.reduce(function(sum, o) { 
            if (o.status === 'completed' || o.status === 'delivered') {
                return sum + (parseFloat(o.total) || 0);
            }
            return sum;
        }, 0);
        
        const pendingOrders = orderList.filter(function(o) { 
            return o.status === 'pending' || o.status === 'preparing'; 
        }).length;
        
        const todaySalesEl = document.getElementById('today-sales');
        const weekSalesEl = document.getElementById('week-sales');
        const pendingOrdersEl = document.getElementById('pending-orders');
        const totalRevenueEl = document.getElementById('total-revenue');
        
        if (todaySalesEl) todaySalesEl.textContent = '₱' + todaySales.toFixed(2);
        if (weekSalesEl) weekSalesEl.textContent = '₱' + weekSales.toFixed(2);
        if (pendingOrdersEl) pendingOrdersEl.textContent = pendingOrders;
        if (totalRevenueEl) totalRevenueEl.textContent = '₱' + totalRevenue.toFixed(2);
        
        loadTopItems(products.products || [], orderList);
        loadPeakHours(orderList);
        loadWeeklyChart(orderList);
        loadSalesChart();
        
    } catch (error) {
        console.error('Error loading modern dashboard:', error);
    }
}

function loadTopItems(products, orders) {
    var salesCount = {};
    var completedOrders = orders.filter(function(o) {
        return o.status === 'completed' || o.status === 'delivered';
    });
    
    for (var i = 0; i < completedOrders.length; i++) {
        var items = completedOrders[i].items || [];
        for (var j = 0; j < items.length; j++) {
            var itemName = items[j].name;
            if (!salesCount[itemName]) {
                salesCount[itemName] = { quantity: 0, revenue: 0 };
            }
            salesCount[itemName].quantity += items[j].quantity;
            salesCount[itemName].revenue += (items[j].price * items[j].quantity);
        }
    }
    
    var topItems = [];
    for (var name in salesCount) {
        topItems.push({
            name: name,
            quantity: salesCount[name].quantity,
            revenue: salesCount[name].revenue
        });
    }
    
    topItems.sort(function(a, b) { return b.quantity - a.quantity; });
    topItems = topItems.slice(0, 5);
    
    var container = document.getElementById('top-items-list');
    if (!container) return;
    
    if (topItems.length === 0) {
        container.innerHTML = '<li class="loading-item">No sales data yet</li>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < topItems.length; i++) {
        var item = topItems[i];
        html += '<li>';
        html += '<div class="item-rank">#' + (i + 1) + '</div>';
        html += '<div class="item-info">';
        html += '<div class="item-name">' + escapeHtml(item.name) + '</div>';
        html += '<div class="item-sales">' + item.quantity + ' sold</div>';
        html += '</div>';
        html += '<div class="item-price">₱' + item.revenue.toFixed(2) + '</div>';
        html += '</li>';
    }
    container.innerHTML = html;
}

function loadPeakHours(orders) {
    var hourCount = {};
    for (var i = 0; i < 24; i++) {
        hourCount[i] = 0;
    }
    
    for (var i = 0; i < orders.length; i++) {
        var date = new Date(orders[i].created_at);
        var hour = date.getHours();
        hourCount[hour]++;
    }
    
    var peakHours = [
        { label: '9-11 AM', hours: [9, 10, 11], count: 0 },
        { label: '11-1 PM', hours: [11, 12, 13], count: 0 },
        { label: '1-3 PM', hours: [13, 14, 15], count: 0 },
        { label: '3-5 PM', hours: [15, 16, 17], count: 0 },
        { label: '5-7 PM', hours: [17, 18, 19], count: 0 },
        { label: '7-9 PM', hours: [19, 20, 21], count: 0 }
    ];
    
    for (var i = 0; i < peakHours.length; i++) {
        var total = 0;
        for (var j = 0; j < peakHours[i].hours.length; j++) {
            total += hourCount[peakHours[i].hours[j]] || 0;
        }
        peakHours[i].count = total;
    }
    
    var maxCount = 0;
    for (var i = 0; i < peakHours.length; i++) {
        if (peakHours[i].count > maxCount) maxCount = peakHours[i].count;
    }
    
    var container = document.getElementById('peak-hours-container');
    if (!container) return;
    
    var html = '';
    for (var i = 0; i < peakHours.length; i++) {
        var percent = maxCount > 0 ? (peakHours[i].count / maxCount) * 100 : 0;
        var icon = '☕';
        if (peakHours[i].label === '11-1 PM' || peakHours[i].label === '1-3 PM') icon = '🍵';
        if (peakHours[i].label === '5-7 PM' || peakHours[i].label === '7-9 PM') icon = '🌙';
        
        html += '<div class="peak-hour-item">';
        html += '<div class="peak-hour-label">';
        html += '<span>' + icon + ' ' + peakHours[i].label + '</span>';
        html += '<span>' + peakHours[i].count + ' orders</span>';
        html += '</div>';
        html += '<div class="peak-hour-bar">';
        html += '<div class="peak-hour-fill" style="width: ' + percent + '%;">';
        if (percent > 30) html += Math.round(percent) + '%';
        html += '</div>';
        html += '</div>';
        html += '</div>';
    }
    container.innerHTML = html;
}

function loadWeeklyChart(orders) {
    var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var dailySales = [0, 0, 0, 0, 0, 0, 0];
    var completedOrders = orders.filter(function(o) {
        return o.status === 'completed' || o.status === 'delivered';
    });
    
    for (var i = 0; i < completedOrders.length; i++) {
        var date = new Date(completedOrders[i].created_at);
        var dayIndex = date.getDay();
        var adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        dailySales[adjustedIndex] += parseFloat(completedOrders[i].total) || 0;
    }
    
    var maxSale = Math.max.apply(null, dailySales);
    var container = document.getElementById('sales-chart');
    if (!container) return;
    
    var html = '';
    for (var i = 0; i < days.length; i++) {
        var percent = maxSale > 0 ? (dailySales[i] / maxSale) * 100 : 0;
        var height = Math.max(percent, 4);
        
        html += '<div class="chart-bar-wrapper">';
        html += '<div class="chart-value">₱' + dailySales[i].toFixed(0) + '</div>';
        html += '<div class="chart-bar" style="height: ' + height + 'px;"></div>';
        html += '<div class="chart-label">' + days[i] + '</div>';
        html += '</div>';
    }
    container.innerHTML = html;
}

async function loadSalesChart() {
    try {
        const orders = await apiRequest('/orders');
        const orderList = orders.orders || [];
        
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dailySales = [0, 0, 0, 0, 0, 0, 0];
        
        const completedOrders = orderList.filter(o => o.status === 'completed' || o.status === 'delivered');
        
        completedOrders.forEach(order => {
            const date = new Date(order.created_at);
            const dayIndex = date.getDay();
            const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
            dailySales[adjustedIndex] += parseFloat(order.total) || 0;
        });
        
        const ctx = document.getElementById('salesChart')?.getContext('2d');
        if (ctx && window.Chart) {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: days,
                    datasets: [{
                        label: 'Sales (₱)',
                        data: dailySales,
                        borderColor: '#C6A43F',
                        backgroundColor: 'rgba(198, 164, 63, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#C6A43F',
                        pointBorderColor: '#fff',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { labels: { color: '#B0B0B0' } }
                    },
                    scales: {
                        y: { ticks: { color: '#B0B0B0' }, grid: { color: '#2A2A2A' } },
                        x: { ticks: { color: '#B0B0B0' }, grid: { color: '#2A2A2A' } }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading sales chart:', error);
    }
}

// ============ PRODUCT MANAGEMENT ============
async function loadProducts() {
    try {
        const data = await apiRequest('/products');
        const products = data.products || [];
        
        const tbody = document.getElementById('products-table-body');
        if (!tbody) return;
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">No products found</td></tr>';
            return;
        }
        
        var html = '';
        for (var i = 0; i < products.length; i++) {
            var product = products[i];
            var roundedPrice = Math.round(parseFloat(product.price) * 100) / 100;
            html += '<tr>';
            html += '<td><img src="' + (product.image_url || '') + '" class="product-image" onerror="this.src=\'https://placehold.co/50x50/F5E6D3/6F4E37?text=No+Image\'"></td>';
            html += '<td><strong>' + escapeHtml(product.name) + '</strong><br><small>' + escapeHtml((product.description || '').substring(0, 50)) + '</small></td>';
            html += '<td>' + (product.category || '-') + '</td>';
            html += '<td>₱' + roundedPrice.toFixed(2) + '</td>';
            html += '<td>' + (product.stock_quantity || 0) + '</td>';
            html += '<td>' + (product.is_best_seller ? '<span style="color:#C6A43F; font-size:18px;">⭐</span>' : '-') + '<td>';
            html += '<td class="action-buttons">';
            html += '<button class="btn-edit" onclick="editProduct(' + product.id + ')"><i class="fas fa-edit"></i> Edit</button> ';
            html += '<button class="btn-danger" onclick="deleteProduct(' + product.id + ')"><i class="fas fa-trash"></i> Delete</button>';
            html += '</td>';
            html += '</tr>';
        }
        tbody.innerHTML = html;
        
        loadFeaturedTable(products);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function loadFeaturedTable(products) {
    var tbody = document.getElementById('featured-table-body');
    if (!tbody) return;
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-cell">No products found</td></tr>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < products.length; i++) {
        var product = products[i];
        html += '<tr>';
        html += '<td><img src="' + (product.image_url || '') + '" class="product-image" onerror="this.src=\'https://placehold.co/50x50/F5E6D3/6F4E37?text=No+Image\'"></td>';
        html += '<td>' + escapeHtml(product.name) + '</td>';
        html += '<td>' + (product.category || '-') + '</td>';
        html += '<td><label class="checkbox-label"><input type="checkbox" class="featured-checkbox" data-id="' + product.id + '"' + (product.is_featured ? ' checked' : '') + '></label></td>';
        html += '<td><label class="checkbox-label"><input type="checkbox" class="new-checkbox" data-id="' + product.id + '"' + (product.is_new ? ' checked' : '') + '></label></td>';
        html += '<td><label class="checkbox-label"><input type="checkbox" class="bestseller-checkbox" data-id="' + product.id + '"' + (product.is_best_seller ? ' checked' : '') + '></label></td>';
        html += '<td><button class="btn-success" onclick="updateProductFlags(' + product.id + ')"><i class="fas fa-save"></i> Save</button></td>';
        html += '</tr>';
    }
    tbody.innerHTML = html;
}

async function updateProductFlags(productId) {
    var featuredCheckbox = document.querySelector('.featured-checkbox[data-id="' + productId + '"]');
    var newCheckbox = document.querySelector('.new-checkbox[data-id="' + productId + '"]');
    var bestsellerCheckbox = document.querySelector('.bestseller-checkbox[data-id="' + productId + '"]');
    
    try {
        await apiRequest('/products/' + productId, {
            method: 'PUT',
            body: JSON.stringify({
                is_featured: featuredCheckbox ? featuredCheckbox.checked : false,
                is_new: newCheckbox ? newCheckbox.checked : false,
                is_best_seller: bestsellerCheckbox ? bestsellerCheckbox.checked : false
            })
        });
        showMessage('Product flags updated!', 'success');
    } catch (error) {
        showMessage('Error updating flags', 'error');
    }
}

// ============ ORDER MANAGEMENT ============
async function loadOrders() {
    try {
        var data = await apiRequest('/orders');
        var orders = data.orders || [];
        
        var tbody = document.getElementById('orders-table-body');
        if (!tbody) return;
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">No orders found</div></div>';
            return;
        }
        
        var html = '';
        for (var i = 0; i < orders.length; i++) {
            var order = orders[i];
            html += '<tr>';
            html += '<td><strong>' + order.order_number + '</strong></td>';
            html += '<td>' + escapeHtml(order.customer_name) + '<br><small>' + order.customer_phone + '</small></td>';
            html += '<td>' + (order.items ? order.items.length : 0) + ' items</div></td>';
            html += '<td>₱' + parseFloat(order.total).toFixed(2) + '</div></td>';
            html += '<td><span class="status-badge status-' + order.status + '">' + order.status + '</span></div></td>';
            html += '<td class="action-buttons">';
            html += '<select onchange="updateOrderStatus(' + order.id + ', this.value)" style="padding: 5px; border-radius: 6px; margin-right: 8px;">';
            html += '<option value="pending"' + (order.status === 'pending' ? ' selected' : '') + '>Pending</option>';
            html += '<option value="preparing"' + (order.status === 'preparing' ? ' selected' : '') + '>Preparing</option>';
            html += '<option value="ready"' + (order.status === 'ready' ? ' selected' : '') + '>Ready</option>';
            html += '<option value="completed"' + (order.status === 'completed' ? ' selected' : '') + '>Completed</option>';
            html += '</select>';
            html += '<button class="btn-danger" onclick="deleteOrder(' + order.id + ', \'' + order.order_number + '\')" style="padding: 5px 10px; margin-left: 5px;">';
            html += '<i class="fas fa-trash"></i> Delete</button>';
            html += '</div>';
            html += '</tr>';
        }
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        await apiRequest('/orders/' + orderId + '/status', {
            method: 'PUT',
            body: JSON.stringify({ status: status })
        });
        showMessage('Order status updated', 'success');
        loadOrders();
        loadDashboardStats();
        loadModernDashboard();
    } catch (error) {
        showMessage('Error updating status', 'error');
    }
}

async function deleteOrder(orderId, orderNumber) {
    if (confirm(`Are you sure you want to delete order ${orderNumber}? This action cannot be undone.`)) {
        try {
            await apiRequest('/orders/' + orderId, { method: 'DELETE' });
            showMessage('Order deleted successfully!', 'success');
            loadOrders();
            loadDashboardStats();
            loadModernDashboard();
        } catch (error) {
            console.error('Error deleting order:', error);
            showMessage('Error deleting order', 'error');
        }
    }
}

function filterOrdersByStatus(status) {
    const rows = document.querySelectorAll('#orders-table-body tr');
    if (status === 'all') {
        rows.forEach(row => row.style.display = '');
        return;
    }
    
    rows.forEach(row => {
        const statusCell = row.querySelector('.status-badge');
        if (statusCell && statusCell.textContent === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// ============ USER MANAGEMENT ============
async function loadUsers() {
    try {
        var data = await apiRequest('/users');
        var users = data.users || [];
        var currentUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
        
        var tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading-cell">No users found</td></tr>';
            return;
        }
        
        var html = '';
        for (var i = 0; i < users.length; i++) {
            var user = users[i];
            var isCurrentUser = user.id === currentUser.id;
            html += '<tr>';
            html += '<td>' + escapeHtml(user.first_name) + ' ' + escapeHtml(user.last_name) + (isCurrentUser ? ' <span style="color:#C6A43F; font-size:11px;">(You)</span>' : '') + '</td>';
            html += '<td>' + user.email + '</td>';
            html += '<td><span class="role-badge role-' + user.role + '">' + user.role + '</span></td>';
            html += '<td class="action-buttons">';
            html += '<button class="btn-edit" onclick="editUser(' + user.id + ')"><i class="fas fa-edit"></i> Edit</button> ';
            if (!isCurrentUser) {
                html += '<button class="btn-danger" onclick="deleteUser(' + user.id + ')"><i class="fas fa-trash"></i> Delete</button>';
            } else {
                html += '<span style="color:#666; font-size:12px;">Cannot delete self</span>';
            }
            html += '</td>';
            html += '</tr>';
        }
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// ============ PRODUCT MODAL ============
let currentProductId = null;

function openProductModal(product = null) {
    const modal = document.getElementById('product-modal');
    if (!modal) return;
    
    const title = document.getElementById('product-modal-title');
    const productId = document.getElementById('product-id');
    const productName = document.getElementById('product-name');
    const productDesc = document.getElementById('product-description');
    const productPrice = document.getElementById('product-price');
    const productStock = document.getElementById('product-stock');
    const productCategory = document.getElementById('product-category');
    const productFeatured = document.getElementById('product-featured');
    const productNew = document.getElementById('product-new');
    const productBestSeller = document.getElementById('product-bestseller'); 
    const imageUrlHidden = document.getElementById('product-image-url');
    const imageUrlInput = document.getElementById('product-image-url-input');
    const previewImg = document.getElementById('upload-preview');
    const previewContainer = document.getElementById('image-preview-container');
    const placeholder = document.querySelector('.upload-placeholder');
    
    // Reset form
    if (productId) productId.value = '';
    if (productName) productName.value = '';
    if (productDesc) productDesc.value = '';
    if (productPrice) productPrice.value = '';
    if (productStock) productStock.value = '100';
    if (productCategory) productCategory.value = 'Coffee';
    if (productFeatured) productFeatured.checked = false;
    if (productNew) productNew.checked = false;
    if (productBestSeller) productBestSeller.checked = false;
    if (imageUrlHidden) imageUrlHidden.value = '';
    if (imageUrlInput) imageUrlInput.value = '';
    if (previewImg) previewImg.src = '';
    if (previewContainer) previewContainer.style.display = 'none';
    if (placeholder) placeholder.style.display = 'block';
    
    if (product) {
        if (title) title.textContent = 'Edit Product';
        if (productId) productId.value = product.id;
        if (productName) productName.value = product.name;
        if (productDesc) productDesc.value = product.description || '';
        if (productPrice) productPrice.value = product.price;
        if (productStock) productStock.value = product.stock_quantity || 100;
        if (productCategory) productCategory.value = product.category || 'Coffee';
        if (productFeatured) productFeatured.checked = product.is_featured || false;
        if (productNew) productNew.checked = product.is_new || false;
        if (productBestSeller) productBestSeller.checked = product.is_best_seller || false;
        
        if (product.image_url) {
            if (imageUrlHidden) imageUrlHidden.value = product.image_url;
            if (imageUrlInput) imageUrlInput.value = product.image_url;
            if (previewImg) previewImg.src = product.image_url;
            if (previewContainer) previewContainer.style.display = 'inline-block';
            if (placeholder) placeholder.style.display = 'none';
        }
    } else {
        if (title) title.textContent = 'Add Product';
    }
    
    modal.classList.add('active');
    setupImageUpload();
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) modal.classList.remove('active');
}

async function saveProduct() {
    const productId = document.getElementById('product-id')?.value;
    const productName = document.getElementById('product-name')?.value.trim();
    const productPrice = document.getElementById('product-price')?.value;
    const imageUrl = document.getElementById('product-image-url')?.value || '';
    const manualUrl = document.getElementById('product-image-url-input')?.value || '';
    const finalImageUrl = imageUrl || manualUrl;
    
    if (!productName || !productPrice || parseFloat(productPrice) <= 0) {
        showMessage('Please fill in product name and price', 'error');
        return false;
    }
    
    const productData = {
        name: productName,
        description: document.getElementById('product-description')?.value || '',
        price: parseFloat(productPrice),
        stock_quantity: parseInt(document.getElementById('product-stock')?.value) || 0,
        category: document.getElementById('product-category')?.value || 'Coffee',
        image_url: finalImageUrl,
        is_featured: document.getElementById('product-featured')?.checked || false,
        is_new: document.getElementById('product-new')?.checked || false,
        is_best_seller: document.getElementById('product-bestseller')?.checked || false 
    };
    
    try {
        if (productId) {
            await apiRequest('/products/' + productId, {
                method: 'PUT',
                body: JSON.stringify(productData)
            });
            showMessage('Product updated!', 'success');
        } else {
            await apiRequest('/products', {
                method: 'POST',
                body: JSON.stringify(productData)
            });
            showMessage('Product added!', 'success');
        }
        
        closeProductModal();
        loadProducts();
        loadDashboardStats();
        loadModernDashboard();
    } catch (error) {
        console.error('Error saving product:', error);
        showMessage('Error saving product', 'error');
    }
    return false;
}

async function editProduct(productId) {
    try {
        const data = await apiRequest('/products/' + productId);
        if (data.product) openProductModal(data.product);
    } catch (error) {
        showMessage('Error loading product', 'error');
    }
}

async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await apiRequest('/products/' + productId, { method: 'DELETE' });
            showMessage('Product deleted', 'success');
            loadProducts();
            loadDashboardStats();
            loadModernDashboard();
        } catch (error) {
            showMessage('Error deleting product', 'error');
        }
    }
}

// ============ IMAGE UPLOAD ============
function setupImageUpload() {
    const uploadArea = document.getElementById('upload-area');
    if (!uploadArea) return;
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    const newArea = uploadArea.cloneNode(true);
    uploadArea.parentNode.replaceChild(newArea, uploadArea);
    
    newArea.onclick = function(e) {
        e.preventDefault();
        fileInput.click();
    };
    
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (file) uploadImage(file);
        fileInput.value = '';
    };
}

function uploadImage(file) {
    if (file.size > 5 * 1024 * 1024) {
        showMessage('Image too large. Max 5MB', 'error');
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        showMessage('Please upload an image file', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', file);
    
    showMessage('Uploading...', 'success');
    
    fetch(API_URL + '/upload', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            const imageUrlHidden = document.getElementById('product-image-url');
            const imageUrlInput = document.getElementById('product-image-url-input');
            const previewImg = document.getElementById('upload-preview');
            const previewContainer = document.getElementById('image-preview-container');
            const placeholder = document.querySelector('.upload-placeholder');
            
            if (imageUrlHidden) imageUrlHidden.value = result.url;
            if (imageUrlInput) imageUrlInput.value = result.url;
            if (previewImg) previewImg.src = result.url;
            if (previewContainer) previewContainer.style.display = 'inline-block';
            if (placeholder) placeholder.style.display = 'none';
            
            showMessage('Image uploaded! Click Save to finish.', 'success');
        } else {
            showMessage('Upload failed', 'error');
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        showMessage('Error uploading image', 'error');
    });
}

function removeImage() {
    const imageUrlHidden = document.getElementById('product-image-url');
    const imageUrlInput = document.getElementById('product-image-url-input');
    const previewContainer = document.getElementById('image-preview-container');
    const placeholder = document.querySelector('.upload-placeholder');
    const previewImg = document.getElementById('upload-preview');
    
    if (imageUrlHidden) imageUrlHidden.value = '';
    if (imageUrlInput) imageUrlInput.value = '';
    if (previewContainer) previewContainer.style.display = 'none';
    if (placeholder) placeholder.style.display = 'block';
    if (previewImg) previewImg.src = '';
}

// ============ USER MODAL ============
function openUserModal(user = null) {
    const modal = document.getElementById('user-modal');
    if (!modal) return;
    
    const title = document.getElementById('user-modal-title');
    const userId = document.getElementById('user-id');
    const firstName = document.getElementById('user-firstname');
    const lastName = document.getElementById('user-lastname');
    const email = document.getElementById('user-email');
    const password = document.getElementById('user-password');
    const role = document.getElementById('user-role');
    
    if (title) title.textContent = user ? 'Edit User' : 'Add Staff Account';
    if (userId) userId.value = user?.id || '';
    if (firstName) firstName.value = user?.first_name || '';
    if (lastName) lastName.value = user?.last_name || '';
    if (email) email.value = user?.email || '';
    if (password) { password.value = ''; password.required = !user; }
    if (role) role.value = user?.role || 'staff';
    
    modal.classList.add('active');
}

function closeUserModal() {
    const modal = document.getElementById('user-modal');
    if (modal) modal.classList.remove('active');
}

async function saveUser() {
    const userId = document.getElementById('user-id')?.value;
    const userData = {
        first_name: document.getElementById('user-firstname')?.value,
        last_name: document.getElementById('user-lastname')?.value,
        email: document.getElementById('user-email')?.value,
        password: document.getElementById('user-password')?.value,
        role: document.getElementById('user-role')?.value
    };
    
    if (!userData.first_name || !userData.last_name || !userData.email) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    if (!userId && !userData.password) {
        showMessage('Password is required for new users', 'error');
        return;
    }
    
    try {
        if (userId) {
            await apiRequest('/users/' + userId, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
            showMessage('User updated!', 'success');
        } else {
            await apiRequest('/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            showMessage('User added!', 'success');
        }
        
        closeUserModal();
        loadUsers();
    } catch (error) {
        showMessage('Error saving user', 'error');
    }
}

async function editUser(userId) {
    try {
        const data = await apiRequest('/users/' + userId);
        if (data.user) openUserModal(data.user);
    } catch (error) {
        showMessage('Error loading user', 'error');
    }
}

async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            await apiRequest('/users/' + userId, { method: 'DELETE' });
            showMessage('User deleted', 'success');
            loadUsers();
        } catch (error) {
            showMessage('Error deleting user', 'error');
        }
    }
}

// ============ INVENTORY MANAGEMENT ============
let inventoryItems = [];

async function loadInventory() {
    try {
        const response = await apiRequest('/inventory');
        const items = response.items || [];
        inventoryItems = items;
        
        const tbody = document.getElementById('inventory-table-body');
        if (!tbody) return;
        
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">No ingredients found</td></tr>';
            return;
        }
        
        checkLowStock(items);
        
        var html = '';
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var stockQty = parseFloat(item.stock_quantity) || 0;
            var minStock = parseFloat(item.min_stock_level) || 0;
            
            var stockStatus = '';
            var statusText = '';
            if (stockQty <= 0) {
                stockStatus = 'stock-critical';
                statusText = '⚠️ Out of Stock';
            } else if (stockQty <= minStock) {
                stockStatus = 'stock-low';
                statusText = '⚠️ Low Stock';
            } else {
                stockStatus = 'stock-good';
                statusText = '✅ In Stock';
            }
            
            html += '<tr>';
            html += '<td><strong>' + escapeHtml(item.name) + '</strong><br><small>' + escapeHtml(item.category || '') + '</small></td>';
            html += '<td>' + stockQty + ' ' + escapeHtml(item.unit) + '</td>';
            html += '<td>' + minStock + ' ' + escapeHtml(item.unit) + '</td>';
            html += '<td><span class="stock-badge ' + stockStatus + '">' + statusText + '</span></td>';
            html += '<td class="action-buttons">';
            html += '<button class="btn-edit" onclick="openAddStockModal(' + item.id + ', \'' + escapeHtml(item.name) + '\', ' + stockQty + ', \'' + escapeHtml(item.unit) + '\')"><i class="fas fa-plus"></i> Add Stock</button> ';
            html += '<button class="btn-danger" onclick="deleteInventoryItem(' + item.id + ')"><i class="fas fa-trash"></i> Delete</button>';
            html += '</td>';
            html += '<tr>';
        }
        tbody.innerHTML = html;
        
        loadRecipes();
        loadTransactions();
        
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

function checkLowStock(items) {
    var lowStockItems = [];
    var outOfStockItems = [];
    
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var stockQty = parseFloat(item.stock_quantity) || 0;
        var minStock = parseFloat(item.min_stock_level) || 0;
        
        if (stockQty <= 0) {
            outOfStockItems.push(item);
        } else if (stockQty <= minStock) {
            lowStockItems.push(item);
        }
    }
    
    var alertContainer = document.getElementById('low-stock-alert');
    if (!alertContainer) return;
    
    var html = '';
    if (outOfStockItems.length > 0) {
        html += '<div class="low-stock-alert warning">';
        html += '<div><strong>⚠️ Out of Stock!</strong> These items need immediate restock:<br>';
        for (var i = 0; i < outOfStockItems.length; i++) {
            html += '<span class="low-stock-item">' + escapeHtml(outOfStockItems[i].name) + '</span>';
        }
        html += '</div></div>';
    }
    
    if (lowStockItems.length > 0) {
        html += '<div class="low-stock-alert">';
        html += '<div><strong>⚠️ Low Stock Alert!</strong> These items are running low:<br>';
        for (var i = 0; i < lowStockItems.length; i++) {
            var stockQty = parseFloat(lowStockItems[i].stock_quantity) || 0;
            html += '<span class="low-stock-item">' + escapeHtml(lowStockItems[i].name) + ' (' + stockQty + ' ' + lowStockItems[i].unit + ' left)</span>';
        }
        html += '</div></div>';
    }
    
    alertContainer.innerHTML = html;
}

async function loadRecipes() {
    try {
        const response = await apiRequest('/recipes');
        const recipes = response.recipes || [];
        
        const tbody = document.getElementById('recipes-table-body');
        if (!tbody) return;
        
        if (recipes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading-cell">No recipes found</div></div>';
            return;
        }
        
        var html = '';
        for (var i = 0; i < recipes.length; i++) {
            var recipe = recipes[i];
            var ingredientsCount = recipe.ingredients ? recipe.ingredients.length : 0;
            html += '<tr>';
            html += '<td><strong>' + escapeHtml(recipe.name) + '</strong></td>';
            html += '<td>' + ingredientsCount + ' ingredients</div></td>';
            html += '<td>' + (recipe.prep_time || 5) + ' min</div></td>';
            html += '<td class="action-buttons">';
            html += '<button class="btn-edit" onclick="viewRecipe(' + recipe.id + ')"><i class="fas fa-eye"></i> View</button> ';
            html += '<button class="btn-danger" onclick="deleteRecipe(' + recipe.id + ')"><i class="fas fa-trash"></i> Delete</button>';
            html += '</div>';
            html += '</tr>';
        }
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading recipes:', error);
    }
}

async function loadTransactions() {
    try {
        const response = await apiRequest('/inventory/transactions/all');
        const transactions = response.transactions || [];
        
        const tbody = document.getElementById('transactions-table-body');
        if (!tbody) return;
        
        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading-cell">No transactions found</div></div>';
            return;
        }
        
        var html = '';
        for (var i = 0; i < transactions.length; i++) {
            var trans = transactions[i];
            var date = new Date(trans.created_at).toLocaleString();
            var typeIcon = trans.transaction_type === 'add' ? '+' : '-';
            var typeColor = trans.transaction_type === 'add' ? '#10b981' : '#ef4444';
            html += '<tr>';
            html += '<td>' + date + '</div>';
            html += '<td>' + escapeHtml(trans.item_name) + '</div>';
            html += '<td><span style="color: ' + typeColor + ';">' + typeIcon + ' ' + trans.transaction_type + '</span></div>';
            html += '<td>' + trans.quantity + '</div>';
            html += '</tr>';
        }
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

let currentStockItem = null;

function openAddStockModal(itemId, itemName, currentStock, unit) {
    currentStockItem = { id: itemId, name: itemName, currentStock: currentStock, unit: unit };
    
    const modal = document.getElementById('add-stock-modal');
    if (!modal) return;
    
    document.getElementById('stock-item-id').value = itemId;
    document.getElementById('stock-item-name').value = itemName;
    document.getElementById('stock-current').value = currentStock + ' ' + unit;
    document.getElementById('stock-boxes').value = '1';
    document.getElementById('stock-per-box').value = '1';
    document.getElementById('stock-cost-box').value = '';
    
    updateStockPreview();
    modal.classList.add('active');
}

function updateStockPreview() {
    const boxes = parseFloat(document.getElementById('stock-boxes')?.value) || 0;
    const perBox = parseFloat(document.getElementById('stock-per-box')?.value) || 0;
    const totalToAdd = boxes * perBox;
    const currentStock = currentStockItem?.currentStock || 0;
    const newStock = currentStock + totalToAdd;
    const costBox = parseFloat(document.getElementById('stock-cost-box')?.value) || 0;
    const totalCost = boxes * costBox;
    
    const totalAddEl = document.getElementById('stock-total-add');
    const newStockEl = document.getElementById('stock-new');
    const totalCostEl = document.getElementById('stock-total-cost');
    
    if (totalAddEl) totalAddEl.value = totalToAdd;
    if (newStockEl) newStockEl.value = newStock + ' ' + (currentStockItem?.unit || '');
    if (totalCostEl) totalCostEl.value = '₱' + totalCost.toFixed(2);
}

function closeAddStockModal() {
    const modal = document.getElementById('add-stock-modal');
    if (modal) modal.classList.remove('active');
    currentStockItem = null;
}

async function submitAddStock(e) {
    e.preventDefault();
    const itemId = document.getElementById('stock-item-id')?.value;
    const boxes = parseFloat(document.getElementById('stock-boxes')?.value) || 0;
    const perBox = parseFloat(document.getElementById('stock-per-box')?.value) || 0;
    const quantity = boxes * perBox;
    const cost = parseFloat(document.getElementById('stock-cost-box')?.value) || 0;
    
    if (quantity <= 0) {
        showMessage('Please enter a valid quantity', 'error');
        return;
    }
    
    try {
        await apiRequest('/inventory/' + itemId + '/add-stock', {
            method: 'POST',
            body: JSON.stringify({ quantity: quantity, cost: cost, note: 'Added via admin panel' })
        });
        showMessage('Stock added successfully!', 'success');
        closeAddStockModal();
        loadInventory();
    } catch (error) {
        showMessage('Error adding stock', 'error');
    }
}

function openAddInventoryModal() {
    const modal = document.getElementById('add-inventory-modal');
    if (modal) {
        document.getElementById('add-inventory-form')?.reset();
        modal.classList.add('active');
    }
}

function closeAddInventoryModal() {
    const modal = document.getElementById('add-inventory-modal');
    if (modal) modal.classList.remove('active');
}

async function submitAddInventory(e) {
    e.preventDefault();
    const itemData = {
        name: document.getElementById('inv-name')?.value,
        unit: document.getElementById('inv-unit')?.value,
        stock_quantity: parseFloat(document.getElementById('inv-stock')?.value) || 0,
        min_stock_level: parseFloat(document.getElementById('inv-min-stock')?.value) || 0,
        cost_per_unit: parseFloat(document.getElementById('inv-cost')?.value) || 0,
        supplier: document.getElementById('inv-supplier')?.value,
        category: document.getElementById('inv-category')?.value
    };

    console.log('Submitting inventory item:', itemData);
    
    if (!itemData.name || !itemData.unit) {
        showMessage('Please fill in name and unit', 'error');
        return;
    }
    
    try {
        await apiRequest('/inventory', {
            method: 'POST',
            body: JSON.stringify(itemData)
        });
        showMessage('Ingredient added!', 'success');
        closeAddInventoryModal();
        loadInventory();
    } catch (error) {
        showMessage('Error adding ingredient', 'error');
    }
}

async function deleteInventoryItem(itemId) {
    if (confirm('Are you sure you want to delete this ingredient?')) {
        try {
            await apiRequest('/inventory/' + itemId, { method: 'DELETE' });
            showMessage('Ingredient deleted', 'success');
            loadInventory();
        } catch (error) {
            showMessage('Error deleting ingredient', 'error');
        }
    }
}

// ============ RECIPE MODAL ============
let allProductsList = [];
let allIngredientsList = [];

async function loadProductsForRecipe() {
    try {
        const data = await apiRequest('/products');
        allProductsList = data.products || [];
        
        const select = document.getElementById('recipe-product-id');
        if (select) {
            select.innerHTML = '<option value="">Select a product</option>' + 
                allProductsList.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (₱${p.price})</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

async function loadIngredientsForRecipe() {
    try {
        const data = await apiRequest('/inventory');
        allIngredientsList = data.items || [];
        
        const selects = document.querySelectorAll('.recipe-ingredient-select');
        selects.forEach(select => {
            if (select && select.options.length <= 1) {
                select.innerHTML = '<option value="">Select Ingredient</option>' + 
                    allIngredientsList.map(i => `<option value="${i.id}" data-unit="${i.unit}">${escapeHtml(i.name)} (${i.stock_quantity} ${i.unit} left)</option>`).join('');
            }
        });
    } catch (error) {
        console.error('Error loading ingredients:', error);
    }
}

function addRecipeIngredientRow() {
    const container = document.getElementById('recipe-ingredients-list');
    if (!container) return;
    
    const row = document.createElement('div');
    row.className = 'recipe-ingredient-row';
    row.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px;';
    row.innerHTML = `
        <select class="recipe-ingredient-select" style="flex: 2;" required>
            <option value="">Select Ingredient</option>
            ${allIngredientsList.map(i => `<option value="${i.id}" data-unit="${i.unit}">${escapeHtml(i.name)} (${i.stock_quantity} ${i.unit} left)</option>`).join('')}
        </select>
        <input type="number" class="recipe-ingredient-quantity" placeholder="Qty" style="flex: 1;" step="0.01" required>
        <input type="text" class="recipe-ingredient-unit" placeholder="Unit" style="flex: 1;">
        <button type="button" class="btn-danger" onclick="this.parentElement.remove()" style="padding: 5px 10px;">✕</button>
    `;
    
    const quantityInput = row.querySelector('.recipe-ingredient-quantity');
    const unitInput = row.querySelector('.recipe-ingredient-unit');
    const select = row.querySelector('.recipe-ingredient-select');
    
    select.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const unit = selectedOption.getAttribute('data-unit');
        if (unitInput) unitInput.value = unit || '';
    });
    
    container.appendChild(row);
}

function openAddRecipeModal() {
    const modal = document.getElementById('add-recipe-modal');
    if (!modal) return;
    
    const container = document.getElementById('recipe-ingredients-list');
    if (container) {
        container.innerHTML = `
            <div class="recipe-ingredient-row" style="display: flex; gap: 10px; margin-bottom: 10px;">
                <select class="recipe-ingredient-select" style="flex: 2;" required>
                    <option value="">Select Ingredient</option>
                </select>
                <input type="number" class="recipe-ingredient-quantity" placeholder="Qty" style="flex: 1;" step="0.01" required>
                <input type="text" class="recipe-ingredient-unit" placeholder="Unit" style="flex: 1;">
                <button type="button" class="btn-danger" onclick="this.parentElement.remove()" style="padding: 5px 10px;">✕</button>
            </div>
        `;
    }
    
    document.getElementById('add-recipe-form')?.reset();
    document.getElementById('recipe-name').value = '';
    document.getElementById('recipe-instructions').value = '';
    document.getElementById('recipe-prep-time').value = '5';
    
    loadProductsForRecipe();
    loadIngredientsForRecipe();
    
    modal.classList.add('active');
}

function closeAddRecipeModal() {
    const modal = document.getElementById('add-recipe-modal');
    if (modal) modal.classList.remove('active');
}

async function submitAddRecipe(e) {
    e.preventDefault();
    
    const productId = document.getElementById('recipe-product-id')?.value;
    const recipeName = document.getElementById('recipe-name')?.value.trim();
    const instructions = document.getElementById('recipe-instructions')?.value;
    const prepTime = document.getElementById('recipe-prep-time')?.value;
    
    if (!productId || !recipeName) {
        showMessage('Please select a product and enter recipe name', 'error');
        return;
    }
    
    const ingredientRows = document.querySelectorAll('#recipe-ingredients-list .recipe-ingredient-row');
    const ingredients = [];
    
    for (var i = 0; i < ingredientRows.length; i++) {
        const row = ingredientRows[i];
        const ingredientId = row.querySelector('.recipe-ingredient-select')?.value;
        const quantity = row.querySelector('.recipe-ingredient-quantity')?.value;
        
        if (ingredientId && quantity && parseFloat(quantity) > 0) {
            ingredients.push({
                inventory_item_id: parseInt(ingredientId),
                quantity: parseFloat(quantity)
            });
        }
    }
    
    if (ingredients.length === 0) {
        showMessage('Please add at least one ingredient', 'error');
        return;
    }
    
    try {
        await apiRequest('/recipes', {
            method: 'POST',
            body: JSON.stringify({
                product_id: productId,
                name: recipeName,
                instructions: instructions,
                prep_time: prepTime || 5,
                ingredients: ingredients
            })
        });
        showMessage('Recipe added successfully!', 'success');
        closeAddRecipeModal();
        loadInventory();
    } catch (error) {
        showMessage('Error adding recipe', 'error');
    }
}

async function viewRecipe(recipeId) {
    try {
        const response = await apiRequest('/recipes/' + recipeId);
        const recipe = response.recipe;
        
        if (!recipe) {
            showMessage('Recipe not found', 'error');
            return;
        }
        
        const modal = document.getElementById('view-recipe-modal');
        const title = document.getElementById('recipe-modal-title');
        const details = document.getElementById('recipe-details');
        
        if (title) title.textContent = recipe.name;
        
        let ingredientsHtml = '<ul style="margin-top: 10px;">';
        if (recipe.ingredients && recipe.ingredients.length > 0) {
            for (var i = 0; i < recipe.ingredients.length; i++) {
                var ing = recipe.ingredients[i];
                ingredientsHtml += '<li>' + escapeHtml(ing.ingredient_name) + ' - ' + ing.quantity + ' ' + ing.unit + '</li>';
            }
        } else {
            ingredientsHtml += '<li>No ingredients listed</li>';
        }
        ingredientsHtml += '</ul>';
        
        if (details) {
            details.innerHTML = `
                <p><strong>Product:</strong> ${escapeHtml(recipe.product_name || 'N/A')}</p>
                <p><strong>Prep Time:</strong> ${recipe.prep_time || 5} minutes</p>
                <p><strong>Instructions:</strong></p>
                <p>${escapeHtml(recipe.instructions || 'No instructions provided')}</p>
                <p><strong>Ingredients:</strong></p>
                ${ingredientsHtml}
            `;
        }
        
        modal.classList.add('active');
    } catch (error) {
        showMessage('Error loading recipe', 'error');
    }
}

function closeViewRecipeModal() {
    const modal = document.getElementById('view-recipe-modal');
    if (modal) modal.classList.remove('active');
}

async function deleteRecipe(recipeId) {
    if (confirm('Are you sure you want to delete this recipe?')) {
        try {
            await apiRequest('/recipes/' + recipeId, { method: 'DELETE' });
            showMessage('Recipe deleted', 'success');
            loadInventory();
        } catch (error) {
            showMessage('Error deleting recipe', 'error');
        }
    }
}

function switchInventoryTab(tabName) {
    const tabs = document.querySelectorAll('.inventory-tab');
    const contents = document.querySelectorAll('.inventory-tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));
    
    const activeTab = document.querySelector(`.inventory-tab[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    const activeContent = document.getElementById(`${tabName}-tab`);
    if (activeContent) activeContent.classList.add('active');
}

// ============ SETTINGS ============
async function loadSettings() {
    try {
        var response = await apiRequest('/settings');
        var settings = response.settings || {};
        
        const cafeName = document.getElementById('setting_cafe_name');
        const cafeAddress = document.getElementById('setting_cafe_address');
        const cafePhone = document.getElementById('setting_cafe_phone');
        const cafeEmail = document.getElementById('setting_cafe_email');
        const cafeHours = document.getElementById('setting_cafe_hours');
        const prepTime = document.getElementById('setting_prep_time');
        const ordersEnabled = document.getElementById('setting_orders_enabled');
        const facebookUrl = document.getElementById('setting_facebook_url');
        const instagramUrl = document.getElementById('setting_instagram_url');
        const twitterUrl = document.getElementById('setting_twitter_url');
        
        if (cafeName) cafeName.value = settings.cafe_name || '';
        if (cafeAddress) cafeAddress.value = settings.cafe_address || '';
        if (cafePhone) cafePhone.value = settings.cafe_phone || '';
        if (cafeEmail) cafeEmail.value = settings.cafe_email || '';
        if (cafeHours) cafeHours.value = settings.cafe_hours || '';
        if (prepTime) prepTime.value = settings.prep_time || '15';
        if (ordersEnabled) ordersEnabled.checked = settings.orders_enabled === 'true';
        if (facebookUrl) facebookUrl.value = settings.facebook_url || '';
        if (instagramUrl) instagramUrl.value = settings.instagram_url || '';
        if (twitterUrl) twitterUrl.value = settings.twitter_url || '';
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function saveSettings(e) {
    e.preventDefault();
    
    var settingsData = {
        cafe_name: document.getElementById('setting_cafe_name')?.value || '',
        cafe_address: document.getElementById('setting_cafe_address')?.value || '',
        cafe_phone: document.getElementById('setting_cafe_phone')?.value || '',
        cafe_email: document.getElementById('setting_cafe_email')?.value || '',
        cafe_hours: document.getElementById('setting_cafe_hours')?.value || '',
        prep_time: document.getElementById('setting_prep_time')?.value || '15',
        orders_enabled: (document.getElementById('setting_orders_enabled')?.checked || false).toString(),
        facebook_url: document.getElementById('setting_facebook_url')?.value || '',
        instagram_url: document.getElementById('setting_instagram_url')?.value || '',
        twitter_url: document.getElementById('setting_twitter_url')?.value || ''
    };
    
    try {
        var response = await apiRequest('/settings', {
            method: 'PUT',
            body: JSON.stringify(settingsData)
        });
        if (response.success) {
            showMessage('Settings saved!', 'success');
        } else {
            showMessage('Error saving settings', 'error');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showMessage('Error saving settings', 'error');
    }
}

// ============ NAVIGATION ============
function setupNavigation() {
    var navItems = document.querySelectorAll('.nav-item');
    var pageTitle = document.getElementById('page-title');
    
    for (var i = 0; i < navItems.length; i++) {
        navItems[i].addEventListener('click', function() {
            var section = this.dataset.section;
            
            var allNavItems = document.querySelectorAll('.nav-item');
            for (var j = 0; j < allNavItems.length; j++) {
                allNavItems[j].classList.remove('active');
            }
            this.classList.add('active');
            
            var allSections = document.querySelectorAll('.section');
            for (var k = 0; k < allSections.length; k++) {
                allSections[k].classList.remove('active');
            }
            var targetSection = document.getElementById(section + '-section');
            if (targetSection) targetSection.classList.add('active');
            
            var titles = {
                dashboard: 'Dashboard',
                products: 'Products',
                featured: 'Featured Items',
                orders: 'Orders',
                users: 'Users',
                inventory: 'Inventory',
                settings: 'Settings'
            };
            if (pageTitle) pageTitle.textContent = titles[section] || 'Dashboard';
            
            if (section === 'products') loadProducts();
            if (section === 'featured') loadProducts();
            if (section === 'orders') loadOrders();
            if (section === 'users') loadUsers();
            if (section === 'settings') loadSettings();
            if (section === 'inventory') loadInventory();
            if (section === 'dashboard') loadModernDashboard();
        });
    }
}

// ============ SEARCH ============
function setupSearch() {
    var searchProducts = document.getElementById('search-products');
    if (searchProducts) {
        searchProducts.addEventListener('input', function(e) {
            var term = e.target.value.toLowerCase();
            var rows = document.querySelectorAll('#products-table-body tr');
            for (var i = 0; i < rows.length; i++) {
                var name = rows[i].cells[1] ? rows[i].cells[1].textContent.toLowerCase() : '';
                rows[i].style.display = name.indexOf(term) !== -1 ? '' : 'none';
            }
        });
    }
    
    var searchUsers = document.getElementById('search-users');
    if (searchUsers) {
        searchUsers.addEventListener('input', function(e) {
            var term = e.target.value.toLowerCase();
            var rows = document.querySelectorAll('#users-table-body tr');
            for (var i = 0; i < rows.length; i++) {
                var name = rows[i].cells[0] ? rows[i].cells[0].textContent.toLowerCase() : '';
                var email = rows[i].cells[1] ? rows[i].cells[1].textContent.toLowerCase() : '';
                rows[i].style.display = (name.indexOf(term) !== -1 || email.indexOf(term) !== -1) ? '' : 'none';
            }
        });
    }
    
    var orderFilter = document.getElementById('order-status-filter');
    if (orderFilter) {
        orderFilter.addEventListener('change', function() {
            filterOrdersByStatus(this.value);
        });
    }
}

// ============ SIDEBAR TOGGLE ============
function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            const icon = sidebarToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-chevron-left');
                icon.classList.toggle('fa-chevron-right');
            }
        });
    }
}

// ============ REFRESH ALL DATA ============
async function refreshAllData() {
    showMessage('Refreshing data...', 'success');
    await loadDashboardStats();
    await loadModernDashboard();
    await loadProducts();
    await loadOrders();
    await loadUsers();
    await loadInventory();
    await loadSettings();
}

// ============ UTILITIES ============
function showMessage(message, type) {
    var msgDiv = document.createElement('div');
    msgDiv.className = 'admin-message message-' + type;
    msgDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(msgDiv);
    
    setTimeout(function() {
        if (msgDiv.parentNode) msgDiv.remove();
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = 'login.html';
}

// ============ INITIALIZE ============
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    setupNavigation();
    setupSearch();
    setupSidebarToggle();
    loadDashboardStats();
    loadProducts();
    loadOrders();
    loadUsers();
    loadSettings();
    loadModernDashboard();
    loadInventory();
    
    var productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProduct();
            return false;
        });
    }
    
    var userForm = document.getElementById('user-form');
    if (userForm) {
        userForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveUser();
            return false;
        });
    }
    
    var settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveSettings(e);
            return false;
        });
    }
    
    var addStockForm = document.getElementById('add-stock-form');
    if (addStockForm) {
        addStockForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitAddStock(e);
            return false;
        });
    }
    
    var addInventoryForm = document.getElementById('add-inventory-form');
    if (addInventoryForm) {
        addInventoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitAddInventory(e);
            return false;
        });
    }
    
    var addRecipeForm = document.getElementById('add-recipe-form');
    if (addRecipeForm) {
        addRecipeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitAddRecipe(e);
            return false;
        });
    }
    
    var stockBoxes = document.getElementById('stock-boxes');
    var stockPerBox = document.getElementById('stock-per-box');
    var stockCostBox = document.getElementById('stock-cost-box');
    
    if (stockBoxes) stockBoxes.addEventListener('input', updateStockPreview);
    if (stockPerBox) stockPerBox.addEventListener('input', updateStockPreview);
    if (stockCostBox) stockCostBox.addEventListener('input', updateStockPreview);
});