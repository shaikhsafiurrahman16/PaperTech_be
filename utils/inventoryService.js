const pool = require('../config/db');

async function createStockHistory(connection, companyId, productId, quantity, balanceAfter, referenceType, referenceId, notes) {
  await connection.execute(
    `INSERT INTO stock_history (company_id, product_id, change_type, quantity, balance_after, reference_type, reference_id, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [companyId, productId, referenceType, quantity, balanceAfter, referenceType, referenceId, notes || null]
  );
}

async function updateProductStock(connection, companyId, productId, quantity, referenceType, referenceId, notes) {
  const [productRows] = await connection.execute('SELECT current_stock FROM products WHERE id = ? AND company_id = ?', [productId, companyId]);
  if (!productRows.length) {
    throw new Error('Product not found');
  }

  const currentStock = productRows[0].current_stock;
  const newStock = currentStock - quantity;
  if (newStock < 0) {
    throw new Error('Insufficient stock for product');
  }

  await connection.execute('UPDATE products SET current_stock = ?, updated_at = NOW() WHERE id = ? AND company_id = ?', [newStock, productId, companyId]);
  await createStockHistory(connection, companyId, productId, quantity, newStock, referenceType, referenceId, notes);
}

async function increaseProductStock(connection, companyId, productId, quantity, referenceType, referenceId, notes) {
  const [productRows] = await connection.execute('SELECT current_stock FROM products WHERE id = ? AND company_id = ?', [productId, companyId]);
  if (!productRows.length) {
    throw new Error('Product not found');
  }

  const currentStock = Number(productRows[0].current_stock || 0);
  const newStock = currentStock + Number(quantity || 0);

  await connection.execute('UPDATE products SET current_stock = ?, updated_at = NOW() WHERE id = ? AND company_id = ?', [newStock, productId, companyId]);
  await createStockHistory(connection, companyId, productId, quantity, newStock, referenceType, referenceId, notes);
}

module.exports = { updateProductStock, increaseProductStock };
