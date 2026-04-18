-- FlexPOS Demo Data
-- Creates sample categories, products, customers, and gift cards.
-- Admin cashier (PIN: 1234) is created programmatically by seedDefaults().

-- ═══════════════════════════════════════
-- Categories
-- ═══════════════════════════════════════
INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (1, 'Hot Drinks', 1);
INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (2, 'Cold Drinks', 2);
INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (3, 'Pastries', 3);
INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (4, 'Meals', 4);
INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (5, 'Snacks', 5);

-- ═══════════════════════════════════════
-- Products — Hot Drinks
-- ═══════════════════════════════════════
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

-- ═══════════════════════════════════════
-- Demo Customers (varied profiles)
-- ═══════════════════════════════════════

-- Regular customer with 10% discount + 500 loyalty points
INSERT OR IGNORE INTO customers (id, name, phone, email, points, ewallet, discount_type, discount_value, discount_expiry)
VALUES (1, 'Maria Santos', '09171234567', 'maria@email.com', 500, 0, 'percent', 10, '2027-12-31');

-- Customer with ₱1,000 eWallet balance
INSERT OR IGNORE INTO customers (id, name, phone, email, points, ewallet, discount_type, discount_value, discount_expiry)
VALUES (2, 'Juan dela Cruz', '09181234567', 'juan@email.com', 150, 1000, NULL, 0, NULL);

-- Customer with expired discount
INSERT OR IGNORE INTO customers (id, name, phone, email, points, ewallet, discount_type, discount_value, discount_expiry)
VALUES (3, 'Ana Reyes', '09191234567', 'ana@email.com', 75, 250, 'percent', 15, '2025-12-31');

-- High-points customer
INSERT OR IGNORE INTO customers (id, name, phone, email, points, ewallet, discount_type, discount_value, discount_expiry)
VALUES (4, 'Carlos Garcia', '09201234567', 'carlos@email.com', 2500, 500, 'fixed', 50, '2027-06-30');

-- New customer (no perks)
INSERT OR IGNORE INTO customers (id, name, phone, email, points, ewallet, discount_type, discount_value, discount_expiry)
VALUES (5, 'Lea Fernandez', '09211234567', NULL, 0, 0, NULL, 0, NULL);

-- ═══════════════════════════════════════
-- Demo Gift Cards
-- ═══════════════════════════════════════
INSERT OR IGNORE INTO gift_cards (id, code, balance, expiry_date, is_active)
VALUES (1, 'GC-WELCOME-500', 500.00, '2027-12-31', 1);

INSERT OR IGNORE INTO gift_cards (id, code, balance, expiry_date, is_active)
VALUES (2, 'GC-PROMO-25', 25.00, '2027-06-30', 1);

-- ═══════════════════════════════════════
-- Default Store Info
-- ═══════════════════════════════════════
INSERT OR IGNORE INTO stores (id, name, address, phone, email, currency, receipt_note)
VALUES (1, 'FlexPOS Demo Store', '123 Main Street, Manila', '(02) 8123-4567', 'store@flexpos.ph', 'PHP', 'Thank you for shopping with us!');
