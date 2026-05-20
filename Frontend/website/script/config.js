// Beans Cafe - Configuration System
// Easy client customization - change these values for each client

const APP_CONFIG = {
    // ========== THEME SETTINGS ==========
    // Options: 'coffee', 'dark-premium', 'modern-light'
    THEME: 'dark-premium',
    
    // ========== HERO SETTINGS ==========
    // Options: 'video', 'split', 'image'
    HERO_STYLE: 'video',
    
    // Video URL (YouTube or local) - for video hero
    HERO_VIDEO_URL: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-coffee-into-a-cup-22173-large.mp4',
    // Or use YouTube embed: 'https://www.youtube.com/embed/VIDEO_ID?autoplay=1&loop=1&mute=1'
    
    // ========== API SETTINGS ==========
    // Mode: 'real' (your backend) or 'mock' (demo mode)
    API_MODE: 'real',
    API_URL: 'https://beans-cafe-backend.onrender.com/api',
    
    // ========== FEATURE TOGGLES ==========
    FEATURES: {
        darkMode: true,           // Dark/light mode toggle
        whatsappButton: true,     // Floating WhatsApp order button
        backToTop: true,          // Back to top button
        cookieConsent: true,      // GDPR cookie consent banner
        pwa: true,                // Progressive Web App support
        newsletter: true,         // Newsletter signup
        gallery: true,            // Instagram-style gallery
        testimonials: true,       // Customer testimonials
        bestSellers: true,        // Best sellers carousel
        searchBar: false,         // Search functionality (optional)
        loyaltyBanner: true       // Loyalty program banner
    },
    
    // ========== BUSINESS INFO (fallback if API fails) ==========
    BUSINESS: {
        name: 'Beans Cafe',
        phone: '+63 (02) 1234 5678',
        whatsapp: '639632512612',  // WhatsApp number (no +, no 0 at start)
        email: 'hello@beanscafe.com',
        address: '123 Coffee Street, Barangay Kapitolyo, Pasig City',
        hours: 'Mon-Fri: 7am-9pm, Sat-Sun: 8am-10pm',
        facebook: 'https://facebook.com/beanscafe',
        instagram: 'https://instagram.com/beanscafe'
    },
    
    // ========== PLACEHOLDER IMAGES ==========
    // Unsplash coffee photos (will be replaced with real images)
    PLACEHOLDERS: {
        hero: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1920&h=1080&fit=crop',
        product: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop',
        cafeInterior: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&h=500&fit=crop',
        barista: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&h=500&fit=crop',
        beans: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&h=500&fit=crop',
        gallery: [
            'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1512568400610-62da28bc8a13?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=400&fit=crop'
        ]
    },
    
    // ========== ANIMATION SETTINGS ==========
    ANIMATIONS: {
        enabled: true,
        duration: 0.6,
        delay: 0.1,
        offset: 100,
        once: true  // Animate only once
    }
};

// Mock data for demo mode (when API_MODE = 'mock')
const MOCK_DATA = {
    products: [
        { id: 1, name: 'Caramel Macchiato', description: 'Rich espresso with caramel and steamed milk', price: 165, category: 'Coffee', image_url: null, is_featured: true, is_new: false, is_available: true },
        { id: 2, name: 'Matcha Latte', description: 'Premium Japanese matcha with oat milk', price: 175, category: 'Tea', image_url: null, is_featured: true, is_new: true, is_available: true },
        { id: 3, name: 'Dark Mocha', description: 'Bold chocolate and espresso combination', price: 170, category: 'Coffee', image_url: null, is_featured: true, is_new: false, is_available: true },
        { id: 4, name: 'Strawberry Frappe', description: 'Sweet strawberry blended with cream', price: 155, category: 'Frappe', image_url: null, is_featured: false, is_new: false, is_available: true },
        { id: 5, name: 'Croissant', description: 'Butter flaky pastry', price: 85, category: 'Pastries', image_url: null, is_featured: true, is_new: false, is_available: true },
        { id: 6, name: 'Spanish Latte', description: 'Sweetened condensed milk latte', price: 160, category: 'Coffee', image_url: null, is_featured: false, is_new: false, is_available: true }
    ],
    settings: {
        cafe_name: 'Beans Cafe',
        cafe_address: '123 Coffee Street, Barangay Kapitolyo, Pasig City',
        cafe_phone: '(02) 1234 5678',
        cafe_email: 'hello@beanscafe.com',
        cafe_hours: 'Mon-Fri: 7am-9pm, Sat-Sun: 8am-10pm'
    }
};

// Helper function to get API URL
function getApiUrl(endpoint) {
    if (APP_CONFIG.API_MODE === 'mock') {
        return null; // Will use mock data
    }
    return `${APP_CONFIG.API_URL}${endpoint}`;
}

// Helper to make API requests
async function apiRequest(endpoint, options = {}) {
    if (APP_CONFIG.API_MODE === 'mock') {
        // Return mock data
        if (endpoint.includes('/products')) {
            return { success: true, products: MOCK_DATA.products };
        }
        if (endpoint.includes('/products/')) {
            const id = parseInt(endpoint.split('/').pop());
            const product = MOCK_DATA.products.find(p => p.id === id);
            return { success: true, product: product };
        }
        if (endpoint.includes('/settings/public')) {
            return { success: true, settings: MOCK_DATA.settings };
        }
        return { success: true };
    }
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (localStorage.getItem('admin_token')) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('admin_token')}`;
    }
    
    const response = await fetch(`${APP_CONFIG.API_URL}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers }
    });
    
    return response.json();
}