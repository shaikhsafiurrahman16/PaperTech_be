const pool = require('../config/db');

async function createCompany(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { name, code, address, phone, admin_full_name, admin_username, admin_password } = req.body;
    const [exists] = await connection.query('SELECT id FROM companies WHERE name = ? OR code = ?', [name, code]);
    if (exists.length) {
      return res.status(409).json({ success: false, message: 'Company already exists' });
    }
    const [adminExists] = await connection.query('SELECT id FROM users WHERE username = ?', [admin_username]);
    if (adminExists.length) {
      return res.status(409).json({ success: false, message: 'Admin username already exists' });
    }

    await connection.beginTransaction();
    const [result] = await connection.query(
      'INSERT INTO companies (name, code, address, phone, status, created_at, updated_at) VALUES (?, ?, ?, ?, "active", NOW(), NOW())',
      [name, code, address || null, phone || null]
    );
    const [adminResult] = await connection.query(
      'INSERT INTO users (full_name, username, password, role, company_id, created_at, updated_at) VALUES (?, ?, ?, "admin", ?, NOW(), NOW())',
      [admin_full_name || 'Company Admin', admin_username, admin_password, result.insertId]
    );
    await connection.commit();
    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        name,
        code,
        address: address || null,
        phone: phone || null,
        status: 'active',
        admin: {
          id: adminResult.insertId,
          full_name: admin_full_name || 'Company Admin',
          username: admin_username,
        },
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

async function listCompanies(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT id, name, code, address, phone, status, created_at FROM companies ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function getCompany(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id, name, code, address, phone, status, created_at, updated_at FROM companies WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
}

async function updateCompany(req, res, next) {
  try {
    const { id } = req.params;
    const { name, code, address, phone, status } = req.body;
    const [rows] = await pool.query('SELECT id FROM companies WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    await pool.query(
      'UPDATE companies SET name = ?, code = ?, address = ?, phone = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [name, code, address || null, phone || null, status || 'active', id]
    );
    res.json({ success: true, message: 'Company updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function deleteCompany(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id FROM companies WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    const [usageRows] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE company_id = ?) AS users_count,
        (SELECT COUNT(*) FROM customers WHERE company_id = ?) AS customers_count,
        (SELECT COUNT(*) FROM vendors WHERE company_id = ?) AS vendors_count,
        (SELECT COUNT(*) FROM sales WHERE company_id = ?) AS sales_count,
        (SELECT COUNT(*) FROM purchases WHERE company_id = ?) AS purchases_count`,
      [id, id, id, id, id]
    );
    const usage = usageRows[0];
    if (Number(usage.users_count || 0) > 0 || Number(usage.customers_count || 0) > 0 || Number(usage.vendors_count || 0) > 0 || Number(usage.sales_count || 0) > 0 || Number(usage.purchases_count || 0) > 0) {
      return res.status(400).json({ success: false, message: 'Company has linked data and cannot be deleted' });
    }
    await pool.query('DELETE FROM companies WHERE id = ?', [id]);
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = { createCompany, listCompanies, getCompany, updateCompany, deleteCompany };
