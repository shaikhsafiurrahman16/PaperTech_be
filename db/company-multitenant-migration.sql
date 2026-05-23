USE papertech;

CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  code VARCHAR(80) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_companies_name (name),
  UNIQUE KEY uq_companies_code (code)
);

SET @db_name = DATABASE();

SET @add_company_role_sql = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db_name
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'role'
      AND COLUMN_TYPE LIKE '%super_admin%'
    ),
    'SELECT 1',
    'ALTER TABLE users MODIFY COLUMN role ENUM(''super_admin'',''admin'',''customer'',''vendor'') NOT NULL DEFAULT ''admin''' 
  )
);
PREPARE stmt_add_company_role FROM @add_company_role_sql;
EXECUTE stmt_add_company_role;
DEALLOCATE PREPARE stmt_add_company_role;

INSERT INTO companies (name, code, status, created_at, updated_at)
SELECT 'Default Company', 'DEFAULT', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM companies LIMIT 1);

SET @default_company_id = (SELECT id FROM companies ORDER BY id ASC LIMIT 1);

ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER role;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER id;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER id;
ALTER TABLE products ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER id;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER id;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER id;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER id;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER id;
ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER id;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER id;
ALTER TABLE vendor_payments ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER id;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER id;
ALTER TABLE vendor_ledger_entries ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER id;
ALTER TABLE stock_history ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER id;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER id;

UPDATE users SET company_id = @default_company_id WHERE role <> 'super_admin' AND company_id IS NULL;
UPDATE customers SET company_id = @default_company_id WHERE company_id IS NULL;
UPDATE vendors SET company_id = @default_company_id WHERE company_id IS NULL;
UPDATE products SET company_id = @default_company_id WHERE company_id IS NULL;
UPDATE sales SET company_id = @default_company_id WHERE company_id IS NULL;
UPDATE invoices SET company_id = @default_company_id WHERE company_id IS NULL;
UPDATE sale_items si INNER JOIN sales s ON s.id = si.sale_id SET si.company_id = s.company_id WHERE si.company_id IS NULL;
UPDATE purchases SET company_id = @default_company_id WHERE company_id IS NULL;
UPDATE purchase_items pi INNER JOIN purchases p ON p.id = pi.purchase_id SET pi.company_id = p.company_id WHERE pi.company_id IS NULL;
UPDATE payments SET company_id = @default_company_id WHERE company_id IS NULL;
UPDATE vendor_payments SET company_id = @default_company_id WHERE company_id IS NULL;
UPDATE ledger_entries SET company_id = @default_company_id WHERE company_id IS NULL;
UPDATE vendor_ledger_entries SET company_id = @default_company_id WHERE company_id IS NULL;
UPDATE stock_history SET company_id = @default_company_id WHERE company_id IS NULL;
UPDATE chat_messages SET company_id = @default_company_id WHERE company_id IS NULL;

ALTER TABLE customers MODIFY COLUMN company_id INT NOT NULL;
ALTER TABLE vendors MODIFY COLUMN company_id INT NOT NULL;
ALTER TABLE products MODIFY COLUMN company_id INT NOT NULL;
ALTER TABLE sales MODIFY COLUMN company_id INT NOT NULL;
ALTER TABLE invoices MODIFY COLUMN company_id INT NOT NULL;
ALTER TABLE sale_items MODIFY COLUMN company_id INT NOT NULL;
ALTER TABLE purchases MODIFY COLUMN company_id INT NOT NULL;
ALTER TABLE purchase_items MODIFY COLUMN company_id INT NOT NULL;
ALTER TABLE payments MODIFY COLUMN company_id INT NOT NULL;
ALTER TABLE vendor_payments MODIFY COLUMN company_id INT NOT NULL;
ALTER TABLE ledger_entries MODIFY COLUMN company_id INT NOT NULL;
ALTER TABLE vendor_ledger_entries MODIFY COLUMN company_id INT NOT NULL;
ALTER TABLE stock_history MODIFY COLUMN company_id INT NOT NULL;
ALTER TABLE chat_messages MODIFY COLUMN company_id INT NOT NULL;

ALTER TABLE users ADD INDEX idx_users_company_id (company_id);
ALTER TABLE customers ADD INDEX idx_customers_company_id (company_id);
ALTER TABLE vendors ADD INDEX idx_vendors_company_id (company_id);
ALTER TABLE products ADD INDEX idx_products_company_id (company_id);
ALTER TABLE sales ADD INDEX idx_sales_company_id (company_id);
ALTER TABLE invoices ADD INDEX idx_invoices_company_id (company_id);
ALTER TABLE purchases ADD INDEX idx_purchases_company_id (company_id);
ALTER TABLE payments ADD INDEX idx_payments_company_id (company_id);
ALTER TABLE vendor_payments ADD INDEX idx_vendor_payments_company_id (company_id);
ALTER TABLE chat_messages ADD INDEX idx_chat_company_id (company_id);

ALTER TABLE users ADD CONSTRAINT fk_users_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;
ALTER TABLE customers ADD CONSTRAINT fk_customers_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;
ALTER TABLE vendors ADD CONSTRAINT fk_vendors_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;
ALTER TABLE products ADD CONSTRAINT fk_products_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;
ALTER TABLE sales ADD CONSTRAINT fk_sales_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;
ALTER TABLE sale_items ADD CONSTRAINT fk_sale_items_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;
ALTER TABLE purchases ADD CONSTRAINT fk_purchases_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;
ALTER TABLE purchase_items ADD CONSTRAINT fk_purchase_items_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;
ALTER TABLE payments ADD CONSTRAINT fk_payments_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;
ALTER TABLE vendor_payments ADD CONSTRAINT fk_vendor_payments_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;
ALTER TABLE ledger_entries ADD CONSTRAINT fk_ledger_entries_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;
ALTER TABLE vendor_ledger_entries ADD CONSTRAINT fk_vendor_ledger_entries_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;
ALTER TABLE stock_history ADD CONSTRAINT fk_stock_history_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;
ALTER TABLE chat_messages ADD CONSTRAINT fk_chat_messages_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

SET @seed_run_at = '2026-05-23 22:05:00';

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE chat_messages;
TRUNCATE TABLE stock_history;
TRUNCATE TABLE vendor_ledger_entries;
TRUNCATE TABLE ledger_entries;
TRUNCATE TABLE vendor_payments;
TRUNCATE TABLE payments;
TRUNCATE TABLE purchase_items;
TRUNCATE TABLE purchases;
TRUNCATE TABLE invoice_items;
TRUNCATE TABLE sale_items;
TRUNCATE TABLE invoices;
TRUNCATE TABLE sales;
TRUNCATE TABLE products;
TRUNCATE TABLE vendors;
TRUNCATE TABLE customers;
TRUNCATE TABLE users;
TRUNCATE TABLE companies;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO companies (name, code, address, phone, status, created_at, updated_at)
VALUES ('PaperTech Main', 'PTM-001', 'Karachi', '00000000000', 'active', @seed_run_at, @seed_run_at);

SET @company_id = LAST_INSERT_ID();

INSERT INTO users (full_name, username, password, role, company_id, created_at, updated_at)
VALUES ('Super Admin', 'super', 'Safi123.', 'super_admin', NULL, @seed_run_at, @seed_run_at);

INSERT INTO users (full_name, username, password, role, company_id, created_at, updated_at)
VALUES ('Company Admin', 'aar', 'Safi123.', 'admin', @company_id, @seed_run_at, @seed_run_at);
