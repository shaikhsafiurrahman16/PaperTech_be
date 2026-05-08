const pool = require('../config/db');

async function addProduct(req, res, next) {
  try {
    const { name, product_type, unit_type, sheets_per_pack, cost_price, sale_price, current_stock, min_stock_alert, description } = req.body;
    const [exists] = await pool.query('SELECT id FROM products WHERE name = ?', [name]);
    if (exists.length) {
      return res.status(409).json({ success: false, message: 'Product already exists' });
    }

    const [result] = await pool.query(
      `INSERT INTO products
      (name, product_type, unit_type, sheets_per_pack, cost_price, sale_price, current_stock, min_stock_alert, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, product_type, unit_type, sheets_per_pack || 0, cost_price, sale_price, current_stock || 0, min_stock_alert || 0, description || null]
    );

    res.status(201).json({ success: true, data: { id: result.insertId, name, product_type, unit_type, sheets_per_pack, cost_price, sale_price, current_stock, min_stock_alert, description } });
  } catch (error) {
    next(error);
  }
}

async function listProducts(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function getProduct(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { name, product_type, unit_type, sheets_per_pack, cost_price, sale_price, current_stock, min_stock_alert, description } = req.body;
    const [rows] = await pool.query('SELECT id FROM products WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await pool.query(
      `UPDATE products SET
      name = ?, product_type = ?, unit_type = ?, sheets_per_pack = ?, cost_price = ?, sale_price = ?, current_stock = ?, min_stock_alert = ?, description = ?, updated_at = NOW()
      WHERE id = ?`,
      [name, product_type, unit_type, sheets_per_pack || 0, cost_price, sale_price, current_stock || 0, min_stock_alert || 0, description || null, id]
    );

    res.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id FROM products WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
}

async function updateStock(req, res, next) {
  try {
    const { id } = req.params;
    const { quantity_change } = req.body;
    
    const [rows] = await pool.query('SELECT id, current_stock FROM products WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const newStock = rows[0].current_stock + quantity_change;
    if (newStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock cannot be negative' });
    }

    await pool.query(
      'UPDATE products SET current_stock = ?, updated_at = NOW() WHERE id = ?',
      [newStock, id]
    );

    // Log stock change
    await pool.query(
      `INSERT INTO stock_history (product_id, change_type, quantity, balance_after, reference_type, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [id, quantity_change > 0 ? 'addition' : 'deduction', Math.abs(quantity_change), newStock, 'manual', `Stock updated by admin`, new Date()]
    );

    res.json({ success: true, message: 'Stock updated successfully', data: { id, new_stock: newStock } });
  } catch (error) {
    next(error);
  }
}

module.exports = { addProduct, listProducts, getProduct, updateProduct, deleteProduct, updateStock };
