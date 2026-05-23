DROP DATABASE IF EXISTS papertech;
CREATE DATABASE papertech;
USE papertech;

CREATE TABLE companies (
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

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('super_admin','admin','customer','vendor') NOT NULL DEFAULT 'admin',
  company_id INT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_users_company_id (company_id),
  CONSTRAINT fk_users_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT
);

CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
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
  UNIQUE KEY uq_customers_company_phone (company_id, phone),
  UNIQUE KEY uq_customers_username_global (username),
  INDEX idx_customers_company_id (company_id),
  CONSTRAINT fk_customers_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT
);

CREATE TABLE vendors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  company_name VARCHAR(150) NOT NULL,
  address TEXT,
  cnic VARCHAR(30),
  opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_vendors_company_phone (company_id, phone),
  UNIQUE KEY uq_vendors_username_global (username),
  INDEX idx_vendors_company_id (company_id),
  CONSTRAINT fk_vendors_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
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
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_products_company_name (company_id, name),
  INDEX idx_products_company_id (company_id),
  CONSTRAINT fk_products_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT
);

CREATE TABLE sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  invoice_number VARCHAR(80) NOT NULL,
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
  UNIQUE KEY uq_sales_company_invoice (company_id, invoice_number),
  INDEX idx_sales_company_id (company_id),
  CONSTRAINT fk_sales_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  CONSTRAINT fk_sales_customer_id FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_sales_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  sale_id INT NOT NULL,
  invoice_number VARCHAR(80) NOT NULL,
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
  UNIQUE KEY uq_invoices_sale_id (sale_id),
  UNIQUE KEY uq_invoices_company_invoice (company_id, invoice_number),
  INDEX idx_invoices_company_id (company_id),
  INDEX idx_invoices_customer_id (customer_id),
  INDEX idx_invoices_sale_type (sale_type),
  INDEX idx_invoices_created_at (created_at),
  CONSTRAINT fk_invoices_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  CONSTRAINT fk_invoices_sale_id FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoices_customer_id FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoices_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_sale_items_company_id (company_id),
  CONSTRAINT fk_sale_items_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  CONSTRAINT fk_sale_items_sale_id FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_sale_items_product_id FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_invoice_items_invoice_id FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoice_items_product_id FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  purchase_number VARCHAR(80) NOT NULL,
  vendor_id INT NOT NULL,
  user_id INT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(12,2) NOT NULL,
  payment_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  remaining_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  purchase_type ENUM('cash','credit') NOT NULL DEFAULT 'cash',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_purchases_company_number (company_id, purchase_number),
  INDEX idx_purchases_company_id (company_id),
  CONSTRAINT fk_purchases_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  CONSTRAINT fk_purchases_vendor_id FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  CONSTRAINT fk_purchases_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE purchase_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  purchase_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_purchase_items_company_id (company_id),
  CONSTRAINT fk_purchase_items_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  CONSTRAINT fk_purchase_items_purchase_id FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  CONSTRAINT fk_purchase_items_product_id FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  customer_id INT NOT NULL,
  user_id INT NOT NULL,
  sale_id INT DEFAULT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(80) NOT NULL DEFAULT 'cash',
  notes TEXT,
  created_at DATETIME NOT NULL,
  INDEX idx_payments_company_id (company_id),
  CONSTRAINT fk_payments_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payments_customer_id FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_payments_sale_id FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL
);

CREATE TABLE vendor_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  vendor_id INT NOT NULL,
  user_id INT NOT NULL,
  purchase_id INT DEFAULT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(80) NOT NULL DEFAULT 'cash',
  notes TEXT,
  created_at DATETIME NOT NULL,
  INDEX idx_vendor_payments_company_id (company_id),
  CONSTRAINT fk_vendor_payments_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  CONSTRAINT fk_vendor_payments_vendor_id FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  CONSTRAINT fk_vendor_payments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_vendor_payments_purchase_id FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE SET NULL
);

CREATE TABLE ledger_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  customer_id INT NOT NULL,
  sale_id INT DEFAULT NULL,
  payment_id INT DEFAULT NULL,
  transaction_type ENUM('sale','payment','adjustment') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  previous_balance DECIMAL(12,2) NOT NULL,
  current_balance DECIMAL(12,2) NOT NULL,
  remarks TEXT,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_ledger_entries_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  CONSTRAINT fk_ledger_entries_customer_id FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_ledger_entries_sale_id FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
  CONSTRAINT fk_ledger_entries_payment_id FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
);

CREATE TABLE vendor_ledger_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  vendor_id INT NOT NULL,
  purchase_id INT DEFAULT NULL,
  payment_id INT DEFAULT NULL,
  transaction_type ENUM('purchase','payment','adjustment') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  previous_balance DECIMAL(12,2) NOT NULL,
  current_balance DECIMAL(12,2) NOT NULL,
  remarks TEXT,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_vendor_ledger_entries_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  CONSTRAINT fk_vendor_ledger_entries_vendor_id FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  CONSTRAINT fk_vendor_ledger_entries_purchase_id FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE SET NULL,
  CONSTRAINT fk_vendor_ledger_entries_payment_id FOREIGN KEY (payment_id) REFERENCES vendor_payments(id) ON DELETE SET NULL
);

CREATE TABLE stock_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  product_id INT NOT NULL,
  change_type VARCHAR(80) NOT NULL,
  quantity INT NOT NULL,
  balance_after INT NOT NULL,
  reference_type VARCHAR(80),
  reference_id INT,
  notes TEXT,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_stock_history_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  CONSTRAINT fk_stock_history_product_id FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  sender_role ENUM('admin','customer','vendor') NOT NULL,
  sender_id INT NOT NULL,
  receiver_role ENUM('admin','customer','vendor') NOT NULL,
  receiver_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_chat_company_id (company_id),
  INDEX idx_chat_participants (sender_role, sender_id, receiver_role, receiver_id),
  INDEX idx_chat_created_at (created_at),
  CONSTRAINT fk_chat_messages_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT
);

SET @seed_run_at = '2026-05-23 22:15:00';

INSERT INTO companies (name, code, address, phone, status, created_at, updated_at)
VALUES ('PaperTech Main', 'PTM-001', 'Karachi', '00000000000', 'active', @seed_run_at, @seed_run_at);

SET @company_id = LAST_INSERT_ID();

INSERT INTO users (full_name, username, password, role, company_id, created_at, updated_at)
VALUES ('Super Admin', 'super', 'Safi123.', 'super_admin', NULL, @seed_run_at, @seed_run_at);

INSERT INTO users (full_name, username, password, role, company_id, created_at, updated_at)
VALUES ('Company Admin', 'aar', 'Safi123.', 'admin', @company_id, @seed_run_at, @seed_run_at);
