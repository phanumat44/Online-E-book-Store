CREATE DATABASE IF NOT EXISTS pdf_shop;
USE pdf_shop;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    image_url VARCHAR(255) -- Optional for display
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stripe_payment_intent_id VARCHAR(255) NOT NULL,
    user_id INT, -- Nullable for guest checkout
    status ENUM('pending', 'completed') DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    items JSON, -- Stores array of product IDs or objects
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Seed Data
INSERT INTO products (title, description, price, filename) VALUES
('The Ultimate Guide to Node.js', 'Master Node.js with this comprehensive guide.', 199.00, 'nodejs_guide.pdf'),
('Advanced CSS Techniques', 'Learn the secrets of modern CSS layout and animation.', 150.00, 'css_secrets.pdf'),
('Docker for Beginners', 'Zero to Hero in Docker containerization.', 250.00, 'dummy.pdf');
