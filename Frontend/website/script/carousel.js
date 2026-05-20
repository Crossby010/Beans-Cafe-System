// Beans Cafe - Best Sellers Carousel (with is_best_seller flag)

let currentCarouselIndex = 0;
let carouselProducts = [];

async function loadBestSellers() {
    const track = document.getElementById('best-sellers-track');
    if (!track) return;
    
    try {
        let products = [];
        
        if (API_MODE === 'mock') {
            // Only show products marked as best seller
            products = MOCK_DATA.products.filter(p => p.is_best_seller === true);
        } else {
            const response = await fetch(`${API_URL}/products`);
            const data = await response.json();
            const allProducts = data.products || [];
            
            // ONLY show products marked as best seller - NO FALLBACKS
            products = allProducts.filter(p => p.is_best_seller === true);
        }
        
        carouselProducts = products;
        
        if (products.length === 0) {
            track.innerHTML = `
                <div class="empty-best-sellers">
                    <i class="fas fa-star" style="font-size: 48px; color: var(--primary); opacity: 0.5; margin-bottom: 15px;"></i>
                    <h3>No Best Sellers Yet</h3>
                    <p>Mark products as "Best Seller" in the admin panel to feature them here.</p>
                    <a href="/admin/login.html" class="btn btn-primary" style="margin-top: 15px;">Go to Admin</a>
                </div>
            `;
            // Hide carousel controls
            const prevBtn = document.getElementById('carousel-prev');
            const nextBtn = document.getElementById('carousel-next');
            const dotsContainer = document.getElementById('carousel-dots');
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            if (dotsContainer) dotsContainer.style.display = 'none';
            return;
        }
        
        // Show carousel controls
        const prevBtn = document.getElementById('carousel-prev');
        const nextBtn = document.getElementById('carousel-next');
        const dotsContainer = document.getElementById('carousel-dots');
        if (prevBtn) prevBtn.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'flex';
        if (dotsContainer) dotsContainer.style.display = 'flex';
        
        const placeholderImage = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.PLACEHOLDERS && APP_CONFIG.PLACEHOLDERS.product) 
            ? APP_CONFIG.PLACEHOLDERS.product 
            : 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop';
        
        track.innerHTML = products.map(product => `
            <div class="product-card" onclick="goToProduct(${product.id})">
                <img src="${product.image_url || placeholderImage}" 
                     alt="${escapeHtml(product.name)}" 
                     class="product-image"
                     loading="lazy"
                     onerror="this.src='${placeholderImage}'">
                <div class="product-info">
                    <h3 class="product-title">${escapeHtml(product.name)}</h3>
                    <p class="product-price">₱${parseFloat(product.price).toFixed(2)}</p>
                    <button class="product-btn" onclick="event.stopPropagation(); addToCartFromProduct(${product.id})">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
        
        setupCarousel();
        createCarouselDots();
        
        if (typeof refreshAnimations === 'function') {
            refreshAnimations();
        }
        
    } catch (error) {
        console.error('Error loading best sellers:', error);
        track.innerHTML = '<div class="loading">Unable to load best sellers</div>';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setupCarousel() {
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const track = document.getElementById('best-sellers-track');
    
    if (!prevBtn || !nextBtn || !track) return;
    
    // Remove old listeners to prevent duplicates
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    
    const itemWidth = 304;
    const visibleItems = Math.floor(track.parentElement.clientWidth / itemWidth);
    const maxIndex = Math.max(0, carouselProducts.length - visibleItems);
    
    newPrevBtn.addEventListener('click', () => {
        if (currentCarouselIndex > 0) {
            currentCarouselIndex--;
            updateCarouselPosition();
        }
    });
    
    newNextBtn.addEventListener('click', () => {
        if (currentCarouselIndex < maxIndex) {
            currentCarouselIndex++;
            updateCarouselPosition();
        }
    });
    
    window.addEventListener('resize', () => {
        const newVisibleItems = Math.floor(track.parentElement.clientWidth / itemWidth);
        const newMaxIndex = Math.max(0, carouselProducts.length - newVisibleItems);
        if (currentCarouselIndex > newMaxIndex) {
            currentCarouselIndex = newMaxIndex;
            updateCarouselPosition();
        }
    });
}

function updateCarouselPosition() {
    const track = document.getElementById('best-sellers-track');
    const itemWidth = 304;
    const scrollAmount = currentCarouselIndex * itemWidth;
    track.scrollTo({ left: scrollAmount, behavior: 'smooth' });
    updateCarouselDots();
}

function createCarouselDots() {
    const dotsContainer = document.getElementById('carousel-dots');
    if (!dotsContainer) return;
    
    const visibleItems = Math.floor(document.querySelector('.carousel-container')?.clientWidth / 304) || 1;
    const dotCount = Math.ceil(carouselProducts.length / visibleItems);
    
    dotsContainer.innerHTML = '';
    for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('div');
        dot.className = `carousel-dot ${i === currentCarouselIndex ? 'active' : ''}`;
        dot.addEventListener('click', () => {
            currentCarouselIndex = i;
            updateCarouselPosition();
        });
        dotsContainer.appendChild(dot);
    }
}

function updateCarouselDots() {
    const dots = document.querySelectorAll('.carousel-dot');
    const visibleItems = Math.floor(document.querySelector('.carousel-container')?.clientWidth / 304) || 1;
    const dotIndex = Math.floor(currentCarouselIndex / visibleItems);
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === dotIndex);
    });
}