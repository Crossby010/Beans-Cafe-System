// Beans Cafe - Gallery Section

const GALLERY_IMAGES = [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1512568400610-62da28bc8a13?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop'
];

// Fallback images in case Unsplash is blocked
const FALLBACK_IMAGES = [
    'https://placehold.co/400x400/F5E6D3/6F4E37?text=Coffee+1',
    'https://placehold.co/400x400/F5E6D3/6F4E37?text=Coffee+2',
    'https://placehold.co/400x400/F5E6D3/6F4E37?text=Coffee+3',
    'https://placehold.co/400x400/F5E6D3/6F4E37?text=Coffee+4'
];

function loadGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    const galleryMasonry = document.getElementById('gallery-masonry');
    
    if (galleryGrid) {
        loadRegularGallery(galleryGrid);
    }
    
    if (galleryMasonry) {
        loadMasonryGallery(galleryMasonry);
    }
}

function loadRegularGallery(container) {
    container.innerHTML = GALLERY_IMAGES.map((img, index) => `
        <div class="gallery-item" data-aos="fade-up" data-aos-delay="${index * 0.05}">
            <img src="${img}" 
                 alt="Beans Cafe Gallery ${index + 1}" 
                 loading="lazy"
                 onerror="this.src='${FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]}'">
            <div class="gallery-overlay">
                <i class="fas fa-instagram"></i>
                <span>@beanscafe</span>
            </div>
        </div>
    `).join('');
    
    // Refresh animations
    if (typeof refreshAnimations === 'function') {
        refreshAnimations();
    }
}

function loadMasonryGallery(container) {
    const columnCount = window.innerWidth > 768 ? 3 : 2;
    const columns = Array(columnCount).fill().map(() => []);
    
    GALLERY_IMAGES.forEach((img, index) => {
        columns[index % columnCount].push(img);
    });
    
    let html = '<div class="gallery-masonry-grid">';
    
    columns.forEach(column => {
        html += '<div class="gallery-column">';
        column.forEach((img, idx) => {
            html += `
                <div class="gallery-item">
                    <img src="${img}" 
                         alt="Gallery" 
                         loading="lazy"
                         onerror="this.src='${FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]}'">
                    <div class="gallery-overlay">
                        <i class="fas fa-heart"></i>
                        <span>View</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Refresh animations
    if (typeof refreshAnimations === 'function') {
        refreshAnimations();
    }
}

// Add gallery styles
if (!document.querySelector('#gallery-styles')) {
    const galleryStyles = document.createElement('style');
    galleryStyles.id = 'gallery-styles';
    galleryStyles.textContent = `
        .gallery-masonry-grid {
            display: flex;
            gap: 20px;
        }
        
        .gallery-column {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .gallery-masonry-grid .gallery-item {
            border-radius: var(--radius-lg);
            overflow: hidden;
            position: relative;
            cursor: pointer;
        }
        
        .gallery-masonry-grid .gallery-item img {
            width: 100%;
            height: auto;
            display: block;
            transition: var(--transition-slow);
        }
        
        .gallery-masonry-grid .gallery-item:hover img {
            transform: scale(1.05);
        }
        
        .gallery-masonry-grid .gallery-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0,0,0,0.7));
            padding: 15px;
            transform: translateY(100%);
            transition: var(--transition);
            color: white;
            text-align: center;
        }
        
        .gallery-masonry-grid .gallery-item:hover .gallery-overlay {
            transform: translateY(0);
        }
        
        @media (max-width: 768px) {
            .gallery-masonry-grid {
                flex-direction: column;
            }
        }
    `;
    document.head.appendChild(galleryStyles);
}