const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function createCustomer(req, res, next) {
  try {
    const { full_name, phone, shop_name, address, cnic, credit_limit, username, password } = req.body;
    const [exists] = await pool.query('SELECT id FROM customers WHERE username = ? OR phone = ?', [username, phone]);
    if (exists.length) {
      return res.status(409).json({ success: false, message: 'Customer username or phone already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO customers
      (full_name, phone, shop_name, address, cnic, customer_type, credit_limit, current_balance, username, password, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'star', ?, 0, ?, ?, NOW(), NOW())`,
      [full_name, phone, shop_name, address, cnic || null, credit_limit || 0, username, hashedPassword]
    );

    res.status(201).json({ success: true, data: { id: result.insertId, full_name, phone, shop_name, address, cnic, customer_type: 'star', credit_limit: credit_limit || 0, current_balance: 0, username } });
  } catch (error) {
    next(error);
  }
}

async function listCustomers(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT id, full_name, phone, shop_name, address, cnic, customer_type, credit_limit, current_balance, username, created_at FROM customers WHERE username != ? ORDER BY created_at DESC",
      ['walkin_customer']
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function getCustomer(req, res, next) {
  try {
    const { id } = req.params;
    let query = 'SELECT id, full_name, phone, shop_name, address, cnic, credit_limit, current_balance, username, customer_type FROM customers WHERE id = ?';
    const params = [id];

    if (req.user.role === 'customer') {
      query += ' AND id = ?';
      params.push(req.user.id);
    }

    const [rows] = await pool.query(query, params);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
}

async function updateCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const { full_name, phone, shop_name, address, cnic, credit_limit } = req.body;
    const [rows] = await pool.query('SELECT id FROM customers WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await pool.query(
      'UPDATE customers SET full_name = ?, phone = ?, shop_name = ?, address = ?, cnic = ?, credit_limit = ?, updated_at = NOW() WHERE id = ?',
      [full_name, phone, shop_name, address, cnic || null, credit_limit || 0, id]
    );

    res.json({ success: true, message: 'Customer updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function deleteCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id, current_balance FROM customers WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const [transactionRows] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM sales WHERE customer_id = ?) AS sales_count,
        (SELECT COUNT(*) FROM invoices WHERE customer_id = ?) AS invoices_count,
        (SELECT COUNT(*) FROM payments WHERE customer_id = ?) AS payments_count,
        (SELECT COUNT(*) FROM ledger_entries WHERE customer_id = ?) AS ledger_count,
        (SELECT COUNT(*) FROM sales WHERE customer_id = ? AND remaining_balance > 0) AS unpaid_sales_count,
        (SELECT COUNT(*) FROM invoices WHERE customer_id = ? AND remaining_balance > 0) AS unpaid_invoices_count`,
      [id, id, id, id, id, id]
    );

    const transactionSummary = transactionRows[0] || {};
    const hasPendingBalance =
      Number(rows[0].current_balance || 0) > 0 ||
      Number(transactionSummary.unpaid_sales_count || 0) > 0 ||
      Number(transactionSummary.unpaid_invoices_count || 0) > 0;

    const hasAnyTransaction =
      Number(transactionSummary.sales_count || 0) > 0 ||
      Number(transactionSummary.invoices_count || 0) > 0 ||
      Number(transactionSummary.payments_count || 0) > 0 ||
      Number(transactionSummary.ledger_count || 0) > 0;

    if (hasPendingBalance) {
      return res.status(400).json({ success: false, message: 'Customer has pending balance. Clear payment before deleting.' });
    }

    if (hasAnyTransaction) {
      return res.status(400).json({ success: false, message: 'Customer has transaction history and cannot be deleted.' });
    }

    await pool.query('DELETE FROM customers WHERE id = ?', [id]);
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = { createCustomer, listCustomers, getCustomer, updateCustomer, deleteCustomer };
