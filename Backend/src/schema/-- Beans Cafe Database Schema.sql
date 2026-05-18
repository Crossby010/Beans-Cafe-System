-- Beans Cafe Database Schema

-- Users table (customers and staff)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Products table (menu items)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customization options (for drinks)
CREATE TABLE IF NOT EXISTS customization_options (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    option_type VARCHAR(50), -- size, milk, sweetness, ice, toppings
    option_name VARCHAR(100),
    price_extra DECIMAL(10,2) DEFAULT 0,
    display_order INT DEFAULT 0
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    customer_name VARCHAR(200),
    customer_phone VARCHAR(50),
    items JSONB NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    order_type VARCHAR(50) DEFAULT 'pickup',
    source VARCHAR(50) DEFAULT 'website', -- website, kiosk, pos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ready_at TIMESTAMP
);

-- Insert sample menu items
INSERT INTO products (name, description, price, category, image_url, is_featured, is_new, stock_quantity) VALUES
('Caramel Macchiato', 'Espresso with steamed milk, vanilla syrup, and caramel drizzle', 180, 'Coffee', '/images/caramel-macchiato.jpg', true, true, 100),
('Spanish Latte', 'Smooth espresso with condensed milk and fresh milk', 170, 'Coffee', '/images/spanish-latte.jpg', true, false, 100),
('Matcha Latte', 'Premium Japanese matcha with steamed milk', 190, 'Tea', '/images/matcha-latte.jpg', true, true, 80),
('Strawberry Cheesecake Frappe', 'Creamy strawberry frappe with cheesecake bits', 195, 'Frappe', '/images/strawberry-cheesecake.jpg', true, false, 60),
('Chocolate Croissant', 'Buttery flaky croissant with chocolate filling', 120, 'Pastries', '/images/chocolate-croissant.jpg', false, true, 30),
('Truffle Pasta', 'Creamy truffle pasta with mushrooms', 250, 'Food', '/images/truffle-pasta.jpg', true, false, 40),
('Iced Americano', 'Espresso shots with water and ice', 130, 'Coffee', '/images/iced-americano.jpg', false, false, 200),
('Cookies and Cream Frappe', 'Oreo cookies blended with cream and ice', 185, 'Frappe', '/images/cookies-cream.jpg', false, false, 70);

-- Insert customization options
INSERT INTO customization_options (product_id, option_type, option_name, price_extra, display_order) VALUES
-- Size options (applies to coffee/tea/frappe)
(1, 'size', 'Small (12oz)', 0, 1),
(1, 'size', 'Regular (16oz)', 20, 2),
(1, 'size', 'Large (22oz)', 35, 3),
(2, 'size', 'Small (12oz)', 0, 1),
(2, 'size', 'Regular (16oz)', 20, 2),
(3, 'size', 'Small (12oz)', 0, 1),
(3, 'size', 'Regular (16oz)', 20, 2),
-- Milk options
(1, 'milk', 'Fresh Milk', 0, 1),
(1, 'milk', 'Oat Milk', 30, 2),
(1, 'milk', 'Almond Milk', 30, 3),
(2, 'milk', 'Fresh Milk', 0, 1),
(2, 'milk', 'Oat Milk', 30, 2),
-- Sweetness level
(1, 'sweetness', '0% (No sugar)', 0, 1),
(1, 'sweetness', '25%', 0, 2),
(1, 'sweetness', '50%', 0, 3),
(1, 'sweetness', '75%', 0, 4),
(1, 'sweetness', '100%', 0, 5),
-- Ice level
(1, 'ice', 'No ice', 0, 1),
(1, 'ice', 'Less ice', 0, 2),
(1, 'ice', 'Regular ice', 0, 3),
(1, 'ice', 'Extra ice', 0, 4);

-- Insert sample admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@beanscafe.com', '$2b$10$YourHashWillBeGeneratedLater', 'Admin', 'Beans', 'admin');

-- Insert sample staff user
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('staff@beanscafe.com', '$2b$10$YourHashWillBeGeneratedLater', 'Staff', 'Cafe', 'staff');