USE papertech;

ALTER TABLE sale_items ADD INDEX idx_sale_items_company_id (company_id);
ALTER TABLE purchase_items ADD INDEX idx_purchase_items_company_id (company_id);
ALTER TABLE ledger_entries ADD INDEX idx_ledger_entries_company_id (company_id);
ALTER TABLE vendor_ledger_entries ADD INDEX idx_vendor_ledger_entries_company_id (company_id);
ALTER TABLE stock_history ADD INDEX idx_stock_history_company_id (company_id);

ALTER TABLE sales ADD UNIQUE KEY uq_sales_company_invoice (company_id, invoice_number);
ALTER TABLE purchases ADD UNIQUE KEY uq_purchases_company_number (company_id, purchase_number);
ALTER TABLE invoices ADD UNIQUE KEY uq_invoices_company_invoice (company_id, invoice_number);

ALTER TABLE customers ADD UNIQUE KEY uq_customers_company_phone (company_id, phone);
ALTER TABLE customers ADD UNIQUE KEY uq_customers_username_global (username);
ALTER TABLE vendors ADD UNIQUE KEY uq_vendors_company_phone (company_id, phone);
ALTER TABLE vendors ADD UNIQUE KEY uq_vendors_username_global (username);
ALTER TABLE products ADD UNIQUE KEY uq_products_company_name (company_id, name);
