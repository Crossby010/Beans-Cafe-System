// Beans Cafe - Animation System
// Scroll animations with Intersection Observer

document.addEventListener('DOMContentLoaded', function() {
    // Check if animations are enabled in config
    if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.ANIMATIONS && !APP_CONFIG.ANIMATIONS.enabled) {
        return;
    }
    
    initScrollAnimations();
    initHoverEffects();
    initCounterAnimation();
    initNavbarScroll();
});

// Initialize scroll reveal animations
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-aos]');
    
    if (animatedElements.length === 0) return;
    
    // Set default animation values
    const defaultDuration = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.ANIMATIONS) ? APP_CONFIG.ANIMATIONS.duration : 0.6;
    const defaultDelay = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.ANIMATIONS) ? APP_CONFIG.ANIMATIONS.delay : 0.1;
    const defaultOffset = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.ANIMATIONS) ? APP_CONFIG.ANIMATIONS.offset : 100;
    const animateOnce = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.ANIMATIONS) ? APP_CONFIG.ANIMATIONS.once : true;
    
    // Check if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-animate');
                    if (animateOnce) {
                        observer.unobserve(entry.target);
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: `0px 0px -${defaultOffset}px 0px`
        });
        
        animatedElements.forEach(el => {
            // Set custom animation duration if specified
            const duration = el.getAttribute('data-aos-duration') || defaultDuration;
            const delay = el.getAttribute('data-aos-delay') || defaultDelay;
            
            el.style.transitionDuration = `${duration}s`;
            el.style.transitionDelay = `${delay}s`;
            
            observer.observe(el);
        });
    } else {
        // Fallback for older browsers - show all elements
        animatedElements.forEach(el => {
            el.classList.add('aos-animate');
        });
    }
}

// Re-initialize animations for dynamically loaded content (products, etc.)
function refreshAnimations() {
    const animatedElements = document.querySelectorAll('[data-aos]:not(.aos-initialized)');
    
    if (animatedElements.length === 0) return;
    
    const defaultDuration = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.ANIMATIONS) ? APP_CONFIG.ANIMATIONS.duration : 0.6;
    const defaultDelay = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.ANIMATIONS) ? APP_CONFIG.ANIMATIONS.delay : 0.1;
    const defaultOffset = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.ANIMATIONS) ? APP_CONFIG.ANIMATIONS.offset : 100;
    const animateOnce = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.ANIMATIONS) ? APP_CONFIG.ANIMATIONS.once : true;
    
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-animate');
                    if (animateOnce) {
                        observer.unobserve(entry.target);
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: `0px 0px -${defaultOffset}px 0px`
        });
        
        animatedElements.forEach(el => {
            const duration = el.getAttribute('data-aos-duration') || defaultDuration;
            const delay = el.getAttribute('data-aos-delay') || defaultDelay;
            
            el.style.transitionDuration = `${duration}s`;
            el.style.transitionDelay = `${delay}s`;
            el.classList.add('aos-initialized');
            
            observer.observe(el);
        });
    } else {
        // Fallback for older browsers - show all elements immediately
        animatedElements.forEach(el => {
            el.classList.add('aos-animate');
            el.classList.add('aos-initialized');
        });
    }
}

// Make refreshAnimations available globally for other scripts
window.refreshAnimations = refreshAnimations;

// Initialize hover effects
function initHoverEffects() {
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn, .product-btn, .add-to-cart-btn');
    buttons.forEach(btn => {
        btn.classList.add('btn-ripple');
    });
    
    // Add lift effect to cards
    const cards = document.querySelectorAll('.product-card, .step-card, .testimonial-card');
    cards.forEach(card => {
        card.classList.add('hover-lift');
    });
    
    // Add zoom effect to images
    const images = document.querySelectorAll('.product-image, .gallery-item img');
    images.forEach(img => {
        const wrapper = img.parentElement;
        if (wrapper && !wrapper.classList.contains('image-zoom')) {
            wrapper.classList.add('image-zoom');
        }
    });
}

// Initialize counter animation
function initCounterAnimation() {
    const counters = document.querySelectorAll('.counter, .stat-number[data-target]');
    
    if (counters.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target')) || parseInt(counter.textContent);
                const duration = parseInt(counter.getAttribute('data-duration')) || 2000;
                
                if (isNaN(target)) return;
                
                const increment = target / (duration / 16);
                let current = 0;
                
                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        counter.textContent = Math.floor(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                };
                
                updateCounter();
                observer.unobserve(counter);
            }
        });
    });
    
    counters.forEach(counter => observer.observe(counter));
}

// Initialize navbar scroll effect
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Add loading animation to images
function addImageLoadingAnimation() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        // Skip if already loaded or has no src
        if (!img.src) return;
        
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        
        if (img.complete) {
            img.style.opacity = '1';
        } else {
            img.addEventListener('load', () => {
                img.style.opacity = '1';
            });
        }
    });
}

// Add smooth scroll to anchor links
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    addImageLoadingAnimation();
});