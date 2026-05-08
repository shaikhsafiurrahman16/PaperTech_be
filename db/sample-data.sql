USE papertech;

INSERT INTO users (full_name, username, password, role, created_at, updated_at)
VALUES
  ('Admin User', 'admin', '$2b$12$/wYXZVA5CgK.nKtEZMBUmOo.Ppp6T3rMCQQxyIRO9L385XvelXGv.', 'admin', NOW(), NOW()),
  ('Kashif Khan', 'customer1', '$2b$12$cXHJVumIDVSBQTH7NqQKMOW0mRG1obVs9XgMd8fZKnCZMV9/G2eVy', 'customer', NOW(), NOW()),
  ('Aisha Malik', 'customer2', '$2b$12$cXHJVumIDVSBQTH7NqQKMOW0mRG1obVs9XgMd8fZKnCZMV9/G2eVy', 'customer', NOW(), NOW());

INSERT INTO customers (full_name, phone, shop_name, address, cnic, credit_limit, current_balance, username, password, created_at, updated_at)
VALUES
('Kashif Khan', '03001234567', 'Khan Paper House', 'Main Road, Lahore', '12345-6789012-3', 50000, 0, 'customer1', '$2b$12$cXHJVumIDVSBQTH7NqQKMOW0mRG1obVs9XgMd8fZKnCZMV9/G2eVy', NOW(), NOW()),
('Aisha Malik', '03101234567', 'Malik Stationery', 'Market Street, Karachi', '23456-7890123-4', 30000, 0, 'customer2', '$2b$12$cXHJVumIDVSBQTH7NqQKMOW0mRG1obVs9XgMd8fZKnCZMV9/G2eVy', NOW(), NOW());

INSERT INTO products (name, product_type, unit_type, sheets_per_pack, cost_price, sale_price, current_stock, min_stock_alert, description, created_at, updated_at)
VALUES
('A4 Paper Rim', 'Paper Rim', 'Pack', 500, 1200, 1500, 120, 20, '500 sheets premium A4 rim', NOW(), NOW()),
('Sticker Pack', 'Sticker Sheets', 'Pack', 100, 400, 500, 80, 15, '100 sheets sticker pack', NOW(), NOW()),
('Card Paper', 'Card Sheets', 'Pack', 100, 900, 1100, 50, 10, '100 sheets card paper pack', NOW(), NOW());
