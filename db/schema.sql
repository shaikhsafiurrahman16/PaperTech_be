CREATE DATABASE IF NOT EXISTS papertech;
USE papertech;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','customer') NOT NULL DEFAULT 'admin',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL 
);

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL UNIQUE,
  shop_name VARCHAR(150) NOT NULL,
  address TEXT,
  cnic VARCHAR(30),
  customer_type ENUM('star','local') NOT NULL DEFAULT 'local',
  credit_limit DECIMAL(12,2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  username VARCHAR(100),
  password VARCHAR(255),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY unique_star_customer (username)
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  product_type VARCHAR(120) NOT NULL,
  size VARCHAR(50),
  gram INT DEFAULT 0,
  unit_type VARCHAR(80) NOT NULL,
  sheets_per_pack INT DEFAULT 0,
  cost_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  current_stock INT NOT NULL DEFAULT 0,
  min_stock_alert INT NOT NULL DEFAULT 0,
  description TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(80) NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  user_id INT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(12,2) NOT NULL,
  payment_received DECIMAL(12,2) NOT NULL DEFAULT 0,
  remaining_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  sale_type ENUM('cash','credit') NOT NULL DEFAULT 'cash',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL UNIQUE,
  invoice_number VARCHAR(80) NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  user_id INT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(12,2) NOT NULL,
  payment_received DECIMAL(12,2) NOT NULL DEFAULT 0,
  remaining_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  sale_type ENUM('cash','credit') NOT NULL DEFAULT 'cash',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_sale_type ON invoices(sale_type);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);

CREATE TABLE IF NOT EXISTS invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  user_id INT NOT NULL,
  sale_id INT DEFAULT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(80) NOT NULL DEFAULT 'cash',
  notes TEXT,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  sale_id INT DEFAULT NULL,
  payment_id INT DEFAULT NULL,
  transaction_type ENUM('sale','payment','adjustment') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  previous_balance DECIMAL(12,2) NOT NULL,
  current_balance DECIMAL(12,2) NOT NULL,
  remarks TEXT,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS stock_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  change_type VARCHAR(80) NOT NULL,
  quantity INT NOT NULL,
  balance_after INT NOT NULL,
  reference_type VARCHAR(80),
  reference_id INT,
  notes TEXT,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Product attribute migration for existing databases.
SET @products_schema_name = DATABASE();

SET @add_product_size_sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE products ADD COLUMN size VARCHAR(50) NULL AFTER product_type',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @products_schema_name
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'size'
);
PREPARE add_product_size_stmt FROM @add_product_size_sql;
EXECUTE add_product_size_stmt;
DEALLOCATE PREPARE add_product_size_stmt;

SET @add_product_gram_sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE products ADD COLUMN gram INT DEFAULT 0 AFTER size',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @products_schema_name
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'gram'
);
PREPARE add_product_gram_stmt FROM @add_product_gram_sql;
EXECUTE add_product_gram_stmt;
DEALLOCATE PREPARE add_product_gram_stmt;

UPDATE products
SET sheets_per_pack = CASE
  WHEN LOWER(unit_type) = 'paper' THEN 500
  WHEN LOWER(unit_type) IN ('card', 'sticker') THEN 100
  ELSE sheets_per_pack
END;
