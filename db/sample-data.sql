USE papertech;

-- No demo users inserted. Please add users through the application.

INSERT INTO products (name, product_type, unit_type, sheets_per_pack, cost_price, sale_price, current_stock, min_stock_alert, description, created_at, updated_at)
VALUES
('A4 Paper Rim', 'Paper Rim', 'Pack', 500, 1200, 1500, 120, 20, '500 sheets premium A4 rim', NOW(), NOW()),
('Sticker Pack', 'Sticker Sheets', 'Pack', 100, 400, 500, 80, 15, '100 sheets sticker pack', NOW(), NOW()),
('Card Paper', 'Card Sheets', 'Pack', 100, 900, 1100, 50, 10, '100 sheets card paper pack', NOW(), NOW());
