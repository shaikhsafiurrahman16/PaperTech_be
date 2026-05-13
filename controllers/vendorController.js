const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function createVendor(req, res, next) {
  try {
    const { full_name, phone, company_name, address, cnic, opening_balance, username, password } = req.body;
    const [exists] = await pool.query('SELECT id FROM vendors WHERE username = ? OR phone = ?', [username, phone]);
    if (exists.length) {
      return res.status(409).json({ success: false, message: 'Vendor username or phone already exists' });
    }

    const balance = Number(opening_balance || 0);
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO vendors
       (full_name, phone, company_name, address, cnic, opening_balance, current_balance, username, password, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [full_name, phone, company_name, address || null, cnic || null, balance, balance, username, hashedPassword]
    );

    if (balance > 0) {
      await pool.query(
        `INSERT INTO vendor_ledger_entries
         (vendor_id, transaction_type, amount, previous_balance, current_balance, remarks, created_at)
         VALUES (?, 'adjustment', ?, 0, ?, 'Opening balance', NOW())`,
        [result.insertId, balance, balance]
      );
    }

    res.status(201).json({
      success: true,
      data: { id: result.insertId, full_name, phone, company_name, address, cnic, opening_balance: balance, current_balance: balance, username },
    });
  } catch (error) {
    next(error);
  }
}

async function listVendors(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, phone, company_name, address, cnic, opening_balance, current_balance, username, created_at FROM vendors ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function getVendor(req, res, next) {
  try {
    const { id } = req.params;
    let query = 'SELECT id, full_name, phone, company_name, address, cnic, opening_balance, current_balance, username FROM vendors WHERE id = ?';
    const params = [id];

    if (req.user.role === 'vendor') {
      query += ' AND id = ?';
      params.push(req.user.id);
    }

    const [rows] = await pool.query(query, params);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
}

async function updateVendor(req, res, next) {
  try {
    const { id } = req.params;
    const { full_name, phone, company_name, address, cnic } = req.body;
    const [rows] = await pool.query('SELECT id FROM vendors WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    await pool.query(
      'UPDATE vendors SET full_name = ?, phone = ?, company_name = ?, address = ?, cnic = ?, updated_at = NOW() WHERE id = ?',
      [full_name, phone, company_name, address || null, cnic || null, id]
    );

    res.json({ success: true, message: 'Vendor updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function deleteVendor(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id, current_balance FROM vendors WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const [transactionRows] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM purchases WHERE vendor_id = ?) AS purchases_count,
        (SELECT COUNT(*) FROM vendor_payments WHERE vendor_id = ?) AS payments_count,
        (SELECT COUNT(*) FROM vendor_ledger_entries WHERE vendor_id = ?) AS ledger_count,
        (SELECT COUNT(*) FROM purchases WHERE vendor_id = ? AND remaining_balance > 0) AS unpaid_purchases_count`,
      [id, id, id, id]
    );

    const summary = transactionRows[0] || {};
    if (Number(rows[0].current_balance || 0) > 0 || Number(summary.unpaid_purchases_count || 0) > 0) {
      return res.status(400).json({ success: false, message: 'Vendor has pending payable balance. Clear payment before deleting.' });
    }

    if (Number(summary.purchases_count || 0) > 0 || Number(summary.payments_count || 0) > 0 || Number(summary.ledger_count || 0) > 0) {
      return res.status(400).json({ success: false, message: 'Vendor has transaction history and cannot be deleted.' });
    }

    await pool.query('DELETE FROM vendors WHERE id = ?', [id]);
    res.json({ success: true, message: 'Vendor deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = { createVendor, listVendors, getVendor, updateVendor, deleteVendor };
