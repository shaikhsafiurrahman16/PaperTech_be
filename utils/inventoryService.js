const pool = require('../config/db');

async function createStockHistory(connection, productId, quantity, balanceAfter, referenceType, referenceId, notes) {
  await connection.execute(
    `INSERT INTO stock_history (product_id, change_type, quantity, balance_after, reference_type, reference_id, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [productId, referenceType, quantity, balanceAfter, referenceType, referenceId, notes || null]
  );
}

async function updateProductStock(connection, productId, quantity, referenceType, referenceId, notes) {
  const [productRows] = await connection.execute('SELECT current_stock FROM products WHERE id = ?', [productId]);
  if (!productRows.length) {
    throw new Error('Product not found');
  }

  const currentStock = productRows[0].current_stock;
  const newStock = currentStock - quantity;
  if (newStock < 0) {
    throw new Error('Insufficient stock for product');
  }

  await connection.execute('UPDATE products SET current_stock = ?, updated_at = NOW() WHERE id = ?', [newStock, productId]);
  await createStockHistory(connection, productId, quantity, newStock, referenceType, referenceId, notes);
}

module.exports = { updateProductStock };
