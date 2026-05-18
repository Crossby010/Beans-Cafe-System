// Beans Cafe - Admin Dashboard

const API_URL = 'http://localhost:5000/api';
let token = null;

// Debug: Track page refresh
window.addEventListener('beforeunload', function() {
    console.log('🔴 PAGE REFRESHING!');
});

// Check authentication
function checkAuth() {
    token = localStorage.getItem('admin_token');
    const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
    
    if (!token || user.role !== 'admin') {
        window.location.href = 'login.html';
        return false;
    }
    
    const adminNameSpan = document.getElementById('admin-name');
    if (adminNameSpan) {
        adminNameSpan.textContent = user.firstName || 'Admin';
    }
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
    
    return response.json();
}

// Load dashboard stats
async function loadDashboardStats() {
    try {
        const products = await apiRequest('/products');
        const orders = await apiRequest('/orders');
        
        const totalProducts = (products.products || []).length;
        const pendingOrders = (orders.orders || []).filter(function(o) { return o.status === 'pending'; }).length;
        const totalOrders = (orders.orders || []).length;
        
        let totalRevenue = 0;
        if (orders.orders && orders.orders.length > 0) {
            totalRevenue = orders.orders.reduce(function(sum, o) { 
                return sum + (parseFloat(o.total) || 0); 
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
        const totalProductsEl = document.getElementById('total-products');
        const pendingOrdersEl = document.getElementById('pending-orders');
        const totalOrdersEl = document.getElementById('total-orders');
        const totalRevenueEl = document.getElementById('total-revenue');
        
        if (totalProductsEl) totalProductsEl.textContent = '0';
        if (pendingOrdersEl) pendingOrdersEl.textContent = '0';
        if (totalOrdersEl) totalOrdersEl.textContent = '0';
        if (totalRevenueEl) totalRevenueEl.textContent = '₱0.00';
    }
}

// Load modern dashboard data
async function loadModernDashboard() {
    try {
        const orders = await apiRequest('/orders');
        const products = await apiRequest('/products');
        
        const orderList = orders.orders || [];
        
        const today = new Date().toDateString();
        const todayOrders = orderList.filter(function(o) {
            return new Date(o.created_at).toDateString() === today;
        });
        const todaySales = todayOrders.reduce(function(sum, o) { return sum + (parseFloat(o.total) || 0); }, 0);
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekOrders = orderList.filter(function(o) {
            return new Date(o.created_at) >= weekAgo;
        });
        const weekSales = weekOrders.reduce(function(sum, o) { return sum + (parseFloat(o.total) || 0); }, 0);
        
        const totalRevenue = orderList.reduce(function(sum, o) { return sum + (parseFloat(o.total) || 0); }, 0);
        const pendingOrders = orderList.filter(function(o) { return o.status === 'pending'; }).length;
        
        document.getElementById('today-sales').textContent = '₱' + todaySales.toFixed(2);
        document.getElementById('week-sales').textContent = '₱' + weekSales.toFixed(2);
        document.getElementById('pending-orders').textContent = pendingOrders;
        document.getElementById('total-revenue').textContent = '₱' + totalRevenue.toFixed(2);
        
        loadTopItems(products.products || [], orderList);
        loadPeakHours(orderList);
        loadWeeklyChart(orderList);
        
    } catch (error) {
        console.error('Error loading modern dashboard:', error);
    }
}

function loadTopItems(products, orders) {
    var salesCount = {};
    for (var i = 0; i < orders.length; i++) {
        var items = orders[i].items || [];
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
    if (topItems.length === 0) {
        container.innerHTML = '<li style="text-align: center; color: #666;">No sales data yet</li>';
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
    
    for (var i = 0; i < orders.length; i++) {
        var date = new Date(orders[i].created_at);
        var dayIndex = date.getDay();
        var adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        dailySales[adjustedIndex] += parseFloat(orders[i].total) || 0;
    }
    
    var maxSale = Math.max.apply(null, dailySales);
    
    var container = document.getElementById('sales-chart');
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

// Load products
async function loadProducts() {
    try {
        const data = await apiRequest('/products');
        const products = data.products || [];
        
        const tbody = document.getElementById('products-table-body');
        if (!tbody) return;
        
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
            html += '<td class="action-buttons">';
            html += '<button class="btn-edit" onclick="editProduct(' + product.id + ')">Edit</button>';
            html += '<button class="btn-danger" onclick="deleteProduct(' + product.id + ')">Delete</button>';
            html += '</td>';
            html += '</tr>';
        }
        tbody.innerHTML = html;
        
        loadFeaturedTable(products);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Load featured table
function loadFeaturedTable(products) {
    var tbody = document.getElementById('featured-table-body');
    if (!tbody) return;
    
    var html = '';
    for (var i = 0; i < products.length; i++) {
        var product = products[i];
        html += '<tr>';
        html += '<td><img src="' + (product.image_url || '') + '" class="product-image" onerror="this.src=\'https://placehold.co/50x50/F5E6D3/6F4E37?text=No+Image\'"></td>';
        html += '<td>' + escapeHtml(product.name) + '</td>';
        html += '<td>' + (product.category || '-') + '</td>';
        html += '<td><label class="checkbox-label"><input type="checkbox" class="featured-checkbox" data-id="' + product.id + '"' + (product.is_featured ? ' checked' : '') + '></label></td>';
        html += '<td><label class="checkbox-label"><input type="checkbox" class="new-checkbox" data-id="' + product.id + '"' + (product.is_new ? ' checked' : '') + '></label></td>';
        html += '<td><button class="btn-success" onclick="updateProductFlags(' + product.id + ')">Save</button></td>';
        html += '</tr>';
    }
    tbody.innerHTML = html;
}

// Update product flags
async function updateProductFlags(productId) {
    var featuredCheckbox = document.querySelector('.featured-checkbox[data-id="' + productId + '"]');
    var newCheckbox = document.querySelector('.new-checkbox[data-id="' + productId + '"]');
    
    try {
        await apiRequest('/products/' + productId, {
            method: 'PUT',
            body: JSON.stringify({
                is_featured: featuredCheckbox ? featuredCheckbox.checked : false,
                is_new: newCheckbox ? newCheckbox.checked : false
            })
        });
        showMessage('Product flags updated!', 'success');
    } catch (error) {
        showMessage('Error updating flags', 'error');
    }
}

// Load orders
async function loadOrders() {
    try {
        var data = await apiRequest('/orders');
        var orders = data.orders || [];
        
        var tbody = document.getElementById('orders-table-body');
        if (!tbody) return;
        
        var html = '';
        for (var i = 0; i < orders.length; i++) {
            var order = orders[i];
            html += '<tr>';
            html += '<td><strong>' + order.order_number + '</strong></td>';
            html += '<td>' + escapeHtml(order.customer_name) + '<br><small>' + order.customer_phone + '</small></td>';
            html += '<td>' + (order.items ? order.items.length : 0) + ' items</div></td>';
            html += '<td>₱' + order.total + '</div></td>';
            html += '<td><span class="status-badge status-' + order.status + '">' + order.status + '</span></td>';
            html += '<td><select onchange="updateOrderStatus(' + order.id + ', this.value)" style="padding: 5px; border-radius: 6px;">';
            html += '<option value="pending"' + (order.status === 'pending' ? ' selected' : '') + '>Pending</option>';
            html += '<option value="preparing"' + (order.status === 'preparing' ? ' selected' : '') + '>Preparing</option>';
            html += '<option value="ready"' + (order.status === 'ready' ? ' selected' : '') + '>Ready</option>';
            html += '<option value="completed"' + (order.status === 'completed' ? ' selected' : '') + '>Completed</option>';
            html += '</select></td>';
            html += '</tr>';
        }
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Update order status
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

// Load users
async function loadUsers() {
    try {
        var data = await apiRequest('/users');
        var users = data.users || [];
        var currentUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
        
        var tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No users found</div></div>';
            return;
        }
        
        var html = '';
        for (var i = 0; i < users.length; i++) {
            var user = users[i];
            var isCurrentUser = user.id === currentUser.id;
            html += '<tr>';
            html += '<td>' + escapeHtml(user.first_name) + ' ' + escapeHtml(user.last_name) + (isCurrentUser ? ' <span style="color:#6F4E37; font-size:11px;">(You)</span>' : '') + '</div>';
            html += '<td>' + user.email + '</div>';
            html += '<td><span class="role-badge role-' + user.role + '">' + user.role + '</span></div>';
            html += '<td>';
            html += '<button class="btn-edit" onclick="editUser(' + user.id + ')">Edit</button> ';
            if (!isCurrentUser) {
                html += '<button class="btn-danger" onclick="deleteUser(' + user.id + ')">Delete</button>';
            } else {
                html += '<span style="color:#999; font-size:12px;">Cannot delete self</span>';
            }
            html += '</div>';
            html += '</tr>';
        }
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// ============ IMAGE UPLOAD - FIXED ============
function setupImageUpload() {
    var uploadArea = document.getElementById('upload-area');
    if (!uploadArea) return;
    
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.setAttribute('data-upload', 'true');
    document.body.appendChild(fileInput);
    
    var newArea = uploadArea.cloneNode(true);
    uploadArea.parentNode.replaceChild(newArea, uploadArea);
    
    newArea.onclick = function(clickEvent) {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        fileInput.click();
    };
    
    fileInput.onchange = function(changeEvent) {
        changeEvent.preventDefault();
        changeEvent.stopPropagation();
        
        var file = changeEvent.target.files[0];
        if (file) {
            uploadImageSimple(file);
        }
        fileInput.value = '';
    };
}

function uploadImageSimple(file) {
    if (file.size > 5 * 1024 * 1024) {
        showMessage('Image too large. Max 5MB', 'error');
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        showMessage('Please upload an image file', 'error');
        return;
    }
    
    var formData = new FormData();
    formData.append('image', file);
    
    showMessage('Uploading...', 'success');
    
    fetch(API_URL + '/upload', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        body: formData
    })
    .then(function(response) { 
        return response.json(); 
    })
    .then(function(result) {
        if (result.success) {
            var imageUrlHidden = document.getElementById('product-image-url');
            var imageUrlInput = document.getElementById('product-image-url-input');
            
            if (imageUrlHidden) {
                imageUrlHidden.value = result.url;
            }
            if (imageUrlInput) {
                imageUrlInput.value = result.url;
            }
            
            var previewContainer = document.getElementById('image-preview-container');
            var previewImg = document.getElementById('upload-preview');
            var placeholder = document.querySelector('.upload-placeholder');
            
            if (previewImg) {
                previewImg.src = result.url;
                previewImg.style.display = 'block';
            }
            if (previewContainer) {
                previewContainer.style.display = 'inline-block';
            }
            if (placeholder) {
                placeholder.style.display = 'none';
            }
            
            showMessage('Image uploaded! Click Save to finish.', 'success');
        } else {
            showMessage('Upload failed', 'error');
        }
    })
    .catch(function(error) {
        console.error('Upload error:', error);
        showMessage('Error uploading image', 'error');
    });
}

function removeImage() {
    var imageUrlHidden = document.getElementById('product-image-url');
    var imageUrlInput = document.getElementById('product-image-url-input');
    var previewContainer = document.getElementById('image-preview-container');
    var placeholder = document.querySelector('.upload-placeholder');
    var previewImg = document.getElementById('upload-preview');
    
    if (imageUrlHidden) imageUrlHidden.value = '';
    if (imageUrlInput) imageUrlInput.value = '';
    if (previewContainer) previewContainer.style.display = 'none';
    if (placeholder) placeholder.style.display = 'block';
    if (previewImg) previewImg.src = '';
}

// ============ PRODUCT MODAL ============
window.openProductModal = function(product) {
    product = product || null;
    
    var modal = document.getElementById('product-modal');
    if (!modal) {
        console.error('Modal not found!');
        return;
    }
    
    var productId = document.getElementById('product-id');
    var productName = document.getElementById('product-name');
    var productDesc = document.getElementById('product-description');
    var productPrice = document.getElementById('product-price');
    var productStock = document.getElementById('product-stock');
    var productCategory = document.getElementById('product-category');
    var productFeatured = document.getElementById('product-featured');
    var productNew = document.getElementById('product-new');
    
    if (productId) productId.value = '';
    if (productName) productName.value = '';
    if (productDesc) productDesc.value = '';
    if (productPrice) productPrice.value = '';
    if (productStock) productStock.value = '100';
    if (productCategory) productCategory.value = 'Coffee';
    if (productFeatured) productFeatured.checked = false;
    if (productNew) productNew.checked = false;
    
    removeImage();
    
    if (product) {
        var title = document.getElementById('product-modal-title');
        if (title) title.textContent = 'Edit Product';
        if (productId) productId.value = product.id || '';
        if (productName) productName.value = product.name || '';
        if (productDesc) productDesc.value = product.description || '';
        if (productPrice) productPrice.value = product.price || '';
        if (productStock) productStock.value = product.stock_quantity || 100;
        if (productCategory) productCategory.value = product.category || 'Coffee';
        if (productFeatured) productFeatured.checked = product.is_featured || false;
        if (productNew) productNew.checked = product.is_new || false;
        
        if (product.image_url) {
            var imageUrlHidden = document.getElementById('product-image-url');
            var imageUrlInput = document.getElementById('product-image-url-input');
            var previewImg = document.getElementById('upload-preview');
            var previewContainer = document.getElementById('image-preview-container');
            var placeholder = document.querySelector('.upload-placeholder');
            
            if (imageUrlHidden) imageUrlHidden.value = product.image_url;
            if (imageUrlInput) imageUrlInput.value = product.image_url;
            if (previewImg) {
                previewImg.src = product.image_url;
                previewImg.style.display = 'block';
            }
            if (previewContainer) previewContainer.style.display = 'inline-block';
            if (placeholder) placeholder.style.display = 'none';
        }
    } else {
        var title = document.getElementById('product-modal-title');
        if (title) title.textContent = 'Add Product';
    }
    
    setupImageUpload();
    setupFormValidation();
    modal.classList.add('active');
};

function closeProductModal() {
    var modal = document.getElementById('product-modal');
    if (modal) modal.classList.remove('active');
}

function setupFormValidation() {
    var productName = document.getElementById('product-name');
    var productPrice = document.getElementById('product-price');
    var saveBtn = document.querySelector('#product-form .btn-primary');
    
    if (!saveBtn) return;
    
    function validateForm() {
        var name = productName ? productName.value.trim() : '';
        var price = productPrice ? productPrice.value : '';
        var valid = name && price && parseFloat(price) > 0;
        saveBtn.disabled = !valid;
        saveBtn.style.opacity = valid ? '1' : '0.5';
        saveBtn.style.cursor = valid ? 'pointer' : 'not-allowed';
    }
    
    if (productName) productName.addEventListener('input', validateForm);
    if (productPrice) productPrice.addEventListener('input', validateForm);
    validateForm();
}

// Save product
async function saveProduct() {
    var productNameInput = document.getElementById('product-name');
    var productPriceInput = document.getElementById('product-price');
    
    var productName = productNameInput ? productNameInput.value.trim() : '';
    var productPrice = productPriceInput ? productPriceInput.value : '';
    
    if (!productName || !productPrice || parseFloat(productPrice) <= 0) {
        showMessage('Please fill in product name and price', 'error');
        return false;
    }
    
    var imageUrl = document.getElementById('product-image-url') ? document.getElementById('product-image-url').value : '';
    var manualUrl = document.getElementById('product-image-url-input') ? document.getElementById('product-image-url-input').value : '';
    
    var finalImageUrl = imageUrl || manualUrl;
    
    var submitBtn = document.querySelector('#product-form .btn-primary');
    var originalText = submitBtn ? submitBtn.textContent : 'Save Product';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
    }
    
    var roundedPrice = Math.round(parseFloat(productPrice) * 100) / 100;
    
    var productData = {
        name: productName,
        description: document.getElementById('product-description') ? document.getElementById('product-description').value : '',
        price: roundedPrice,
        stock_quantity: parseInt(document.getElementById('product-stock') ? document.getElementById('product-stock').value : 0) || 0,
        category: document.getElementById('product-category') ? document.getElementById('product-category').value : 'Coffee',
        image_url: finalImageUrl,
        is_featured: document.getElementById('product-featured') ? document.getElementById('product-featured').checked : false,
        is_new: document.getElementById('product-new') ? document.getElementById('product-new').checked : false
    };
    
    var productId = document.getElementById('product-id') ? document.getElementById('product-id').value : '';
    
    try {
        var response;
        if (productId) {
            response = await apiRequest('/products/' + productId, {
                method: 'PUT',
                body: JSON.stringify(productData)
            });
            showMessage('Product updated!', 'success');
        } else {
            response = await apiRequest('/products', {
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
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
    return false;
}

// Edit product
window.editProduct = async function(productId) {
    var data = await apiRequest('/products/' + productId);
    if (data.product) window.openProductModal(data.product);
};

// Delete product
window.deleteProduct = async function(productId) {
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
};

// ============ INVENTORY MANAGEMENT ============

// Load all inventory items
async function loadInventory() {
    try {
        const response = await apiRequest('/inventory');
        const items = response.items || [];
        
        const tbody = document.getElementById('inventory-table-body');
        if (!tbody) return;
        
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No ingredients found</div></div>';
            return;
        }
        
        checkLowStock(items);
        
        var html = '';
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var stockStatus = '';
            var statusText = '';
            
            var stockQty = parseFloat(item.stock_quantity) || 0;
            var minStock = parseFloat(item.min_stock_level) || 0;
            var costPerUnit = parseFloat(item.cost_per_unit) || 0;
            
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
            html += '<td>₱' + costPerUnit.toFixed(2) + '</td>';
            html += '<td>' + escapeHtml(item.supplier || '-') + '</td>';
            html += '<td class="action-buttons">';
            html += '<button class="btn-edit" onclick="openAddStockModal(' + item.id + ', \'' + escapeHtml(item.name) + '\', ' + stockQty + ', \'' + escapeHtml(item.unit) + '\')">➕ Add Stock</button>';
            html += '<button class="btn-danger" onclick="deleteInventoryItem(' + item.id + ')">Delete</button>';
            html += '</td>';
            html += '</tr>';
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
        html += '</div>';
        html += '</div>';
    }
    
    if (lowStockItems.length > 0) {
        html += '<div class="low-stock-alert">';
        html += '<div><strong>⚠️ Low Stock Alert!</strong> These items are running low:<br>';
        for (var i = 0; i < lowStockItems.length; i++) {
            var stockQty = parseFloat(lowStockItems[i].stock_quantity) || 0;
            html += '<span class="low-stock-item">' + escapeHtml(lowStockItems[i].name) + ' (' + stockQty + ' ' + lowStockItems[i].unit + ' left)</span>';
        }
        html += '</div>';
        html += '</div>';
    }
    
    alertContainer.innerHTML = html;
}

// Load recipes
async function loadRecipes() {
    try {
        const response = await apiRequest('/recipes');
        const recipes = response.recipes || [];
        const products = await apiRequest('/products');
        const productMap = {};
        if (products.products) {
            for (var i = 0; i < products.products.length; i++) {
                productMap[products.products[i].id] = products.products[i];
            }
        }
        
        const tbody = document.getElementById('recipes-table-body');
        if (!tbody) return;
        
        if (recipes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No recipes found</div></div>';
            return;
        }
        
        var html = '';
        for (var i = 0; i < recipes.length; i++) {
            var recipe = recipes[i];
            var product = productMap[recipe.product_id];
            var ingredientsList = '';
            var totalCost = 0;
            
            if (recipe.ingredients && recipe.ingredients.length > 0) {
                for (var j = 0; j < recipe.ingredients.length; j++) {
                    var ing = recipe.ingredients[j];
                    if (ing && ing.ingredient_name) {
                        var ingQuantity = parseFloat(ing.quantity) || 0;
                        var ingCost = parseFloat(ing.cost_per_unit) || 0;
                        ingredientsList += ing.ingredient_name + ': ' + ingQuantity + ' ' + ing.unit + '<br>';
                        totalCost += ingQuantity * ingCost;
                    }
                }
            } else {
                ingredientsList = 'No ingredients listed';
            }
            
            var sellingPrice = product ? (parseFloat(product.price) || 0) : 0;
            var profit = sellingPrice - totalCost;
            var profitPercent = sellingPrice > 0 ? (profit / sellingPrice * 100).toFixed(0) : 0;
            
            html += '<tr>';
            html += '<td><strong>' + escapeHtml(recipe.name) + '</strong><br><small>' + (product ? product.name : 'Unknown') + '</small></td>';
            html += '<td style="font-size: 13px;">' + ingredientsList + '</div>';
            html += '<td>' + (recipe.prep_time || 5) + ' min</div>';
            html += '<td>₱' + totalCost.toFixed(2) + '</div>';
            html += '<td>₱' + sellingPrice.toFixed(2) + '</div>';
            html += '<td style="color: ' + (profit >= 0 ? '#10b981' : '#ef4444') + ';">₱' + profit.toFixed(2) + ' (' + profitPercent + '%)</div>';
            html += '<td class="action-buttons">';
            html += '<button class="btn-edit" onclick="viewRecipe(' + recipe.id + ')">📖 View</button>';
            html += '<button class="btn-danger" onclick="deleteRecipe(' + recipe.id + ')">Delete</button>';
            html += '</div>';
            html += '</tr>';
        }
        tbody.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading recipes:', error);
    }
}

// Load transactions
async function loadTransactions() {
    try {
        const response = await apiRequest('/inventory/transactions/all');
        const transactions = response.transactions || [];
        
        const tbody = document.getElementById('transactions-table-body');
        if (!tbody) return;
        
        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No transactions yet</div></div>';
            return;
        }
        
        var html = '';
        for (var i = 0; i < transactions.length; i++) {
            var trans = transactions[i];
            var typeIcon = trans.transaction_type === 'add' ? '➕' : (trans.transaction_type === 'remove' ? '➖' : '🍽️');
            var typeColor = trans.transaction_type === 'add' ? '#10b981' : (trans.transaction_type === 'remove' ? '#ef4444' : '#3b82f6');
            var quantity = parseFloat(trans.quantity) || 0;
            
            html += '<tr>';
            html += '<td>' + new Date(trans.created_at).toLocaleString() + '</div>';
            html += '<td>' + escapeHtml(trans.item_name) + '</div>';
            html += '<td><span style="color: ' + typeColor + ';">' + typeIcon + ' ' + trans.transaction_type + '</span></div>';
            html += '<td>' + quantity + '</div>';
            html += '<td>' + escapeHtml(trans.note || '-') + '</div>';
            html += '</tr>';
        }
        tbody.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Add Stock Modal
function openAddStockModal(id, name, currentStock, unit) {
    document.getElementById('stock-item-id').value = id;
    document.getElementById('stock-item-name').value = name;
    document.getElementById('stock-current').value = currentStock + ' ' + unit;
    document.getElementById('stock-per-box').value = '';
    document.getElementById('stock-boxes').value = '1';
    document.getElementById('stock-cost-box').value = '';
    updateStockPreview();
    
    var modal = document.getElementById('add-stock-modal');
    if (modal) modal.classList.add('active');
}

function updateStockPreview() {
    var boxes = parseFloat(document.getElementById('stock-boxes').value) || 0;
    var perBox = parseFloat(document.getElementById('stock-per-box').value) || 0;
    var totalAdd = boxes * perBox;
    var currentText = document.getElementById('stock-current').value;
    var currentStock = parseFloat(currentText) || 0;
    var newStock = currentStock + totalAdd;
    
    document.getElementById('stock-total-add').value = totalAdd;
    document.getElementById('stock-new').value = newStock;
    
    var costBox = parseFloat(document.getElementById('stock-cost-box').value) || 0;
    var totalCost = costBox * boxes;
    document.getElementById('stock-total-cost').value = '₱' + totalCost.toFixed(2);
}

function closeAddStockModal() {
    var modal = document.getElementById('add-stock-modal');
    if (modal) modal.classList.remove('active');
}

// Add Inventory Item
function openAddInventoryModal() {
    document.getElementById('add-inventory-form').reset();
    var modal = document.getElementById('add-inventory-modal');
    if (modal) modal.classList.add('active');
}

function closeAddInventoryModal() {
    var modal = document.getElementById('add-inventory-modal');
    if (modal) modal.classList.remove('active');
}

// Add Recipe Modal
async function loadProductsForRecipe() {
    try {
        const response = await apiRequest('/products');
        const products = response.products || [];
        var select = document.getElementById('recipe-product-id');
        select.innerHTML = '<option value="">Select a drink...</option>';
        for (var i = 0; i < products.length; i++) {
            select.innerHTML += '<option value="' + products[i].id + '">' + escapeHtml(products[i].name) + ' (₱' + products[i].price + ')</option>';
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

async function loadIngredientsForRecipe() {
    try {
        const response = await apiRequest('/inventory');
        const items = response.items || [];
        var selects = document.querySelectorAll('.recipe-ingredient-select');
        for (var s = 0; s < selects.length; s++) {
            var select = selects[s];
            select.innerHTML = '<option value="">Select Ingredient</option>';
            for (var i = 0; i < items.length; i++) {
                select.innerHTML += '<option value="' + items[i].id + '" data-unit="' + items[i].unit + '">' + escapeHtml(items[i].name) + ' (' + items[i].unit + ')</option>';
            }
        }
    } catch (error) {
        console.error('Error loading ingredients:', error);
    }
}

function addRecipeIngredientRow() {
    var container = document.getElementById('recipe-ingredients-list');
    var newRow = document.createElement('div');
    newRow.className = 'recipe-ingredient-row';
    newRow.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px;';
    newRow.innerHTML = `
        <select class="recipe-ingredient-select" style="flex: 2;" required>
            <option value="">Select Ingredient</option>
        </select>
        <input type="number" class="recipe-ingredient-quantity" placeholder="Qty" style="flex: 1;" step="0.01" required>
        <input type="text" class="recipe-ingredient-unit" placeholder="Unit" style="flex: 1;" readonly>
        <button type="button" class="btn-danger" onclick="this.parentElement.remove()" style="padding: 5px 10px;">✕</button>
    `;
    container.appendChild(newRow);
    
    var newSelect = newRow.querySelector('.recipe-ingredient-select');
    var newUnitInput = newRow.querySelector('.recipe-ingredient-unit');
    newSelect.addEventListener('change', function() {
        var selectedOption = this.options[this.selectedIndex];
        var unit = selectedOption.getAttribute('data-unit');
        if (newUnitInput) newUnitInput.value = unit || '';
    });
    
    loadIngredientsForRecipe();
}

function openAddRecipeModal() {
    loadProductsForRecipe();
    loadIngredientsForRecipe();
    document.getElementById('add-recipe-form').reset();
    var modal = document.getElementById('add-recipe-modal');
    if (modal) modal.classList.add('active');
}

function closeAddRecipeModal() {
    var modal = document.getElementById('add-recipe-modal');
    if (modal) modal.classList.remove('active');
}

// View Recipe
async function viewRecipe(recipeId) {
    try {
        const response = await apiRequest('/recipes/' + recipeId);
        const recipe = response.recipe;
        
        if (!recipe) {
            showMessage('Recipe not found', 'error');
            return;
        }
        
        var html = '<div style="margin-bottom: 20px;">';
        html += '<h4>' + escapeHtml(recipe.name) + '</h4>';
        html += '<p><strong>Prep Time:</strong> ' + (recipe.prep_time || 5) + ' minutes</p>';
        html += '<h5>Instructions:</h5>';
        html += '<p style="white-space: pre-line;">' + escapeHtml(recipe.instructions || 'No instructions provided') + '</p>';
        html += '<h5>Ingredients:</h5>';
        html += '<ul>';
        
        var totalCost = 0;
        if (recipe.ingredients && recipe.ingredients.length > 0) {
            for (var i = 0; i < recipe.ingredients.length; i++) {
                var ing = recipe.ingredients[i];
                if (ing && ing.ingredient_name) {
                    var ingQuantity = parseFloat(ing.quantity) || 0;
                    var ingCost = parseFloat(ing.cost_per_unit) || 0;
                    html += '<li>' + ingQuantity + ' ' + ing.unit + ' - ' + escapeHtml(ing.ingredient_name) + '</li>';
                    totalCost += ingQuantity * ingCost;
                }
            }
        }
        html += '</ul>';
        html += '<p><strong>Estimated Cost per Serving:</strong> ₱' + totalCost.toFixed(2) + '</p>';
        html += '</div>';
        
        document.getElementById('recipe-details').innerHTML = html;
        document.getElementById('recipe-modal-title').textContent = '📖 ' + recipe.name;
        
        var modal = document.getElementById('view-recipe-modal');
        if (modal) modal.classList.add('active');
        
    } catch (error) {
        showMessage('Error loading recipe', 'error');
    }
}

function closeViewRecipeModal() {
    var modal = document.getElementById('view-recipe-modal');
    if (modal) modal.classList.remove('active');
}

// Delete functions
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

async function deleteRecipe(recipeId) {
    if (confirm('Are you sure you want to delete this recipe?')) {
        try {
            await apiRequest('/recipes/' + recipeId, { method: 'DELETE' });
            showMessage('Recipe deleted', 'success');
            loadRecipes();
        } catch (error) {
            showMessage('Error deleting recipe', 'error');
        }
    }
}

// Form submissions
document.getElementById('add-stock-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var itemId = document.getElementById('stock-item-id').value;
    var boxes = parseFloat(document.getElementById('stock-boxes').value) || 0;
    var perBox = parseFloat(document.getElementById('stock-per-box').value) || 0;
    var totalAdd = boxes * perBox;
    var costBox = parseFloat(document.getElementById('stock-cost-box').value) || 0;
    
    try {
        await apiRequest('/inventory/' + itemId + '/add-stock', {
            method: 'POST',
            body: JSON.stringify({ quantity: totalAdd, cost: costBox * boxes, note: 'Added ' + boxes + ' boxes x ' + perBox + ' per box' })
        });
        showMessage('Stock added successfully!', 'success');
        closeAddStockModal();
        loadInventory();
    } catch (error) {
        showMessage('Error adding stock', 'error');
    }
});

document.getElementById('add-inventory-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var itemData = {
        name: document.getElementById('inv-name').value,
        unit: document.getElementById('inv-unit').value,
        stock_quantity: parseFloat(document.getElementById('inv-stock').value) || 0,
        min_stock_level: parseFloat(document.getElementById('inv-min-stock').value) || 0,
        cost_per_unit: parseFloat(document.getElementById('inv-cost').value) || 0,
        supplier: document.getElementById('inv-supplier').value,
        category: document.getElementById('inv-category').value
    };
    
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
});

document.getElementById('add-recipe-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var ingredients = [];
    var rows = document.querySelectorAll('.recipe-ingredient-row');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var ingredientId = row.querySelector('.recipe-ingredient-select').value;
        var quantity = parseFloat(row.querySelector('.recipe-ingredient-quantity').value);
        if (ingredientId && quantity) {
            ingredients.push({
                inventory_item_id: ingredientId,
                quantity: quantity
            });
        }
    }
    
    var recipeData = {
        product_id: document.getElementById('recipe-product-id').value,
        name: document.getElementById('recipe-name').value,
        instructions: document.getElementById('recipe-instructions').value,
        prep_time: parseInt(document.getElementById('recipe-prep-time').value) || 5,
        ingredients: ingredients
    };
    
    try {
        await apiRequest('/recipes', {
            method: 'POST',
            body: JSON.stringify(recipeData)
        });
        showMessage('Recipe added!', 'success');
        closeAddRecipeModal();
        loadRecipes();
    } catch (error) {
        showMessage('Error adding recipe', 'error');
    }
});

// Tab switching
function switchInventoryTab(tabName) {
    var tabs = document.querySelectorAll('.inventory-tab');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }
    var contents = document.querySelectorAll('.inventory-tab-content');
    for (var i = 0; i < contents.length; i++) {
        contents[i].classList.remove('active');
    }
    
    var activeTab = document.querySelector('.inventory-tab[data-tab="' + tabName + '"]');
    if (activeTab) activeTab.classList.add('active');
    
    var activeContent = document.getElementById(tabName + '-tab');
    if (activeContent) activeContent.classList.add('active');
}

// ============ USER MODAL ============
window.openUserModal = function(user) {
    user = user || null;
    var modal = document.getElementById('user-modal');
    if (!modal) return;
    
    if (user) {
        var title = document.getElementById('user-modal-title');
        var userId = document.getElementById('user-id');
        var firstName = document.getElementById('user-firstname');
        var lastName = document.getElementById('user-lastname');
        var email = document.getElementById('user-email');
        var password = document.getElementById('user-password');
        var role = document.getElementById('user-role');
        
        if (title) title.textContent = 'Edit User';
        if (userId) userId.value = user.id;
        if (firstName) firstName.value = user.first_name;
        if (lastName) lastName.value = user.last_name;
        if (email) email.value = user.email;
        if (password) { password.value = ''; password.required = false; }
        if (role) role.value = user.role;
    } else {
        var title = document.getElementById('user-modal-title');
        var form = document.getElementById('user-form');
        var userId = document.getElementById('user-id');
        var password = document.getElementById('user-password');
        var role = document.getElementById('user-role');
        
        if (title) title.textContent = 'Add Staff Account';
        if (form) form.reset();
        if (userId) userId.value = '';
        if (password) password.required = true;
        if (role) role.value = 'staff';
    }
    
    modal.classList.add('active');
};

window.closeUserModal = function() {
    var modal = document.getElementById('user-modal');
    if (modal) modal.classList.remove('active');
};

window.saveUser = async function() {
    var userData = {
        first_name: document.getElementById('user-firstname') ? document.getElementById('user-firstname').value : '',
        last_name: document.getElementById('user-lastname') ? document.getElementById('user-lastname').value : '',
        email: document.getElementById('user-email') ? document.getElementById('user-email').value : '',
        password: document.getElementById('user-password') ? document.getElementById('user-password').value : '',
        role: document.getElementById('user-role') ? document.getElementById('user-role').value : ''
    };
    
    var userId = document.getElementById('user-id') ? document.getElementById('user-id').value : '';
    
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
};

window.editUser = async function(userId) {
    var data = await apiRequest('/users/' + userId);
    if (data.user) openUserModal(data.user);
};

window.deleteUser = async function(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            await apiRequest('/users/' + userId, { method: 'DELETE' });
            showMessage('User deleted', 'success');
            loadUsers();
        } catch (error) {
            showMessage('Error deleting user', 'error');
        }
    }
};

// ============ SETTINGS ============
async function loadSettings() {
    try {
        var response = await apiRequest('/settings');
        var settings = response.settings || {};
        
        var cafeName = document.getElementById('setting_cafe_name');
        var cafeAddress = document.getElementById('setting_cafe_address');
        var cafePhone = document.getElementById('setting_cafe_phone');
        var cafeEmail = document.getElementById('setting_cafe_email');
        var cafeHours = document.getElementById('setting_cafe_hours');
        var prepTime = document.getElementById('setting_prep_time');
        var ordersEnabled = document.getElementById('setting_orders_enabled');
        var facebookUrl = document.getElementById('setting_facebook_url');
        var instagramUrl = document.getElementById('setting_instagram_url');
        
        if (cafeName) cafeName.value = settings.cafe_name || '';
        if (cafeAddress) cafeAddress.value = settings.cafe_address || '';
        if (cafePhone) cafePhone.value = settings.cafe_phone || '';
        if (cafeEmail) cafeEmail.value = settings.cafe_email || '';
        if (cafeHours) cafeHours.value = settings.cafe_hours || '';
        if (prepTime) prepTime.value = settings.prep_time || '15';
        if (ordersEnabled) ordersEnabled.checked = settings.orders_enabled === 'true';
        if (facebookUrl) facebookUrl.value = settings.facebook_url || '';
        if (instagramUrl) instagramUrl.value = settings.instagram_url || '';
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function saveSettings(e) {
    e.preventDefault();
    
    var settingsData = {
        cafe_name: document.getElementById('setting_cafe_name') ? document.getElementById('setting_cafe_name').value : '',
        cafe_address: document.getElementById('setting_cafe_address') ? document.getElementById('setting_cafe_address').value : '',
        cafe_phone: document.getElementById('setting_cafe_phone') ? document.getElementById('setting_cafe_phone').value : '',
        cafe_email: document.getElementById('setting_cafe_email') ? document.getElementById('setting_cafe_email').value : '',
        cafe_hours: document.getElementById('setting_cafe_hours') ? document.getElementById('setting_cafe_hours').value : '',
        prep_time: document.getElementById('setting_prep_time') ? document.getElementById('setting_prep_time').value : '15',
        orders_enabled: (document.getElementById('setting_orders_enabled') ? document.getElementById('setting_orders_enabled').checked : false).toString(),
        facebook_url: document.getElementById('setting_facebook_url') ? document.getElementById('setting_facebook_url').value : '',
        instagram_url: document.getElementById('setting_instagram_url') ? document.getElementById('setting_instagram_url').value : ''
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
    
    var searchIngredients = document.getElementById('search-ingredients');
    if (searchIngredients) {
        searchIngredients.addEventListener('input', function(e) {
            var term = e.target.value.toLowerCase();
            var rows = document.querySelectorAll('#inventory-table-body tr');
            for (var i = 0; i < rows.length; i++) {
                var name = rows[i].cells[0] ? rows[i].cells[0].textContent.toLowerCase() : '';
                rows[i].style.display = name.indexOf(term) !== -1 ? '' : 'none';
            }
        });
    }
}

// ============ UTILITIES ============
function showMessage(message, type) {
    var msgDiv = document.createElement('div');
    msgDiv.className = 'admin-message message-' + type;
    msgDiv.textContent = message;
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
    
    // Stock input event listeners
    var stockBoxes = document.getElementById('stock-boxes');
    var stockPerBox = document.getElementById('stock-per-box');
    var stockCostBox = document.getElementById('stock-cost-box');
    
    if (stockBoxes) stockBoxes.addEventListener('input', updateStockPreview);
    if (stockPerBox) stockPerBox.addEventListener('input', updateStockPreview);
    if (stockCostBox) stockCostBox.addEventListener('input', updateStockPreview);
});