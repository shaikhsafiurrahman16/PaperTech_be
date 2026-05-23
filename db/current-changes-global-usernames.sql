USE papertech;

ALTER TABLE customers DROP INDEX uq_customers_company_username;
ALTER TABLE vendors DROP INDEX uq_vendors_company_username;

ALTER TABLE customers ADD UNIQUE KEY uq_customers_username_global (username);
ALTER TABLE vendors ADD UNIQUE KEY uq_vendors_username_global (username);
