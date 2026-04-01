-- FlexPOS Demo Data
-- Creates sample categories, products, and one admin cashier (PIN: 1234)

-- Admin cashier — PIN: 1234 (bcrypt hash inserted by the app, not raw SQL)
-- This file is run AFTER the app hashes the PIN programmatically.
-- See database/db.js seedDefaults or use the cashiers:create IPC handler.

-- Categories
INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (1, 'Hot Drinks', 1);
INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (2, 'Cold Drinks', 2);
INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (3, 'Pastries', 3);
INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (4, 'Meals', 4);
INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (5, 'Snacks', 5);

-- Products — Hot Drinks
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, is_available) VALUES (1, 'Brewed Coffee', 1, 85, 100, 1);
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, is_available) VALUES (2, 'Cappuccino', 1, 120, 100, 1);
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, is_available) VALUES (3, 'Cafe Latte', 1, 130, 100, 1);
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, is_available) VALUES (4, 'Hot Chocolate', 1, 110, 100, 1);
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, is_available) VALUES (5, 'Matcha Latte', 1, 140, 100, 1);

-- Products — Cold Drinks
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, is_available) VALUES (6, 'Iced Americano', 2, 100, 100, 1);
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, is_available) VALUES (7, 'Iced Mocha', 2, 135, 100, 1);
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, is_available) VALUES (8, 'Mango Smoothie', 2, 125, 100, 1);
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, is_available) VALUES (9, 'Lemon Iced Tea', 2, 80, 100, 1);
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, is_available) VALUES (10, 'Strawberry Frappe', 2, 145, 100, 1);

-- Products — Pastries
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, is_available) VALUES (11, 'Croissant', 3, 65, 50, 1);
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, is_available) VALUES (12, 'Blueberry Muffin', 3, 75, 50, 1);
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, is_available) VALUES (13, 'Chocolate Cake Slice', 3, 95, 30, 1);
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, is_available) VALUES (14, 'Cinnamon Roll', 3, 85, 40, 1);

-- Products — Meals
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, is_available) VALUES (15, 'Chicken Sandwich', 4, 165, 30, 1);
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, is_available) VALUES (16, 'Tuna Panini', 4, 155, 30, 1);
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, is_available) VALUES (17, 'Caesar Salad', 4, 145, 20, 1);

-- Products — Snacks
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, is_available) VALUES (18, 'Chips Original', 5, 45, 80, 1);
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, is_available) VALUES (19, 'Granola Bar', 5, 55, 60, 1);
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, is_available) VALUES (20, 'Cookie Pack', 5, 40, 70, 1);
