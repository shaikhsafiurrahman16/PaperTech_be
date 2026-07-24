USE papertech;


ALTER TABLE users
  MODIFY COLUMN role ENUM('super_admin','admin','company_user','customer','vendor') NOT NULL DEFAULT 'admin';

DROP PROCEDURE IF EXISTS add_column_if_missing;

DELIMITER $$

CREATE PROCEDURE add_column_if_missing(
  IN tableName VARCHAR(64),
  IN columnName VARCHAR(64),
  IN columnDefinition TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = tableName
      AND COLUMN_NAME = columnName
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN ', columnName, ' ', columnDefinition);
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

DELIMITER ;

CALL add_column_if_missing('users', 'allowed_modules', 'TEXT NULL AFTER company_id');
CALL add_column_if_missing('users', 'policy_id', 'INT NULL AFTER allowed_modules');
CALL add_column_if_missing('users', 'email', 'VARCHAR(150) NULL AFTER full_name');
CALL add_column_if_missing('users', 'cnic', 'VARCHAR(30) NULL AFTER email');
CALL add_column_if_missing('users', 'address', 'TEXT NULL AFTER cnic');

CALL add_column_if_missing('companies', 'field_type', 'ENUM(''paper'',''autos'',''karyana'',''computers'') NOT NULL DEFAULT ''paper'' AFTER code');

CALL add_column_if_missing('products', 'product_specs', 'JSON NULL AFTER sheets_per_pack');

UPDATE companies SET field_type = 'paper' WHERE field_type IS NULL;
UPDATE products SET product_specs = JSON_OBJECT() WHERE product_specs IS NULL;

DROP PROCEDURE add_column_if_missing;
