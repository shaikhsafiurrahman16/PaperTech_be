const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { generateToken } = require('../utils/jwt');
const { normalizeModules } = require('../config/accessModules');

async function isPasswordValid(plainText, storedPassword) {
  if (!storedPassword) return false;
  if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$')) {
    return bcrypt.compare(plainText, storedPassword);
  }
  return plainText === storedPassword;
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const [superAdminRows] = await pool.query(
      'SELECT id, full_name, username, password, role, allowed_modules FROM users WHERE username = ? AND role = "super_admin"',
      [username]
    );
    if (superAdminRows.length) {
      const user = superAdminRows[0];
      const isMatch = await isPasswordValid(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      const token = generateToken(user);
      return res.json({
        success: true,
        data: { id: user.id, full_name: user.full_name, username: user.username, role: user.role, allowed_modules: normalizeModules(user.allowed_modules), token, company_id: null, company_name: 'Global' },
      });
    }

    const [adminRows] = await pool.query(
      `SELECT u.id, u.full_name, u.username, u.password, u.role, u.company_id, u.allowed_modules, c.name AS company_name
       FROM users u
       INNER JOIN companies c ON c.id = u.company_id
       WHERE u.username = ? AND u.role IN ("admin", "company_user")`,
      [username]
    );
    if (adminRows.length) {
      const user = adminRows[0];
      const isMatch = await isPasswordValid(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = generateToken(user);
      return res.json({
        success: true,
        data: { id: user.id, full_name: user.full_name, username: user.username, role: user.role, allowed_modules: normalizeModules(user.allowed_modules), token, company_id: user.company_id, company_name: user.company_name },
      });
    }

    const [customerRows] = await pool.query(
      `SELECT cu.id, cu.full_name, cu.username, cu.password, cu.company_id, c.name AS company_name
       FROM customers cu
       INNER JOIN companies c ON c.id = cu.company_id
       WHERE cu.username = ? AND cu.customer_type = "star"`,
      [username]
    );
    if (customerRows.length) {
      const customer = customerRows[0];
      const isMatch = await isPasswordValid(password, customer.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = generateToken({ id: customer.id, username: customer.username, role: 'customer', company_id: customer.company_id });
      return res.json({
        success: true,
        data: { id: customer.id, full_name: customer.full_name, username: customer.username, role: 'customer', token, company_id: customer.company_id, company_name: customer.company_name },
      });
    }

    const [vendorRows] = await pool.query(
      `SELECT v.id, v.full_name, v.username, v.password, v.company_id, c.name AS company_name
       FROM vendors v
       INNER JOIN companies c ON c.id = v.company_id
       WHERE v.username = ?`,
      [username]
    );
    if (vendorRows.length) {
      const vendor = vendorRows[0];
      const isMatch = await isPasswordValid(password, vendor.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = generateToken({ id: vendor.id, username: vendor.username, role: 'vendor', company_id: vendor.company_id });
      return res.json({
        success: true,
        data: { id: vendor.id, full_name: vendor.full_name, username: vendor.username, role: 'vendor', token, company_id: vendor.company_id, company_name: vendor.company_name },
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (error) {
    next(error);
  }
}

async function register(req, res, next) {
  try {
    const { full_name, username, password, role, company_id, allowed_modules } = req.body;
    const [exists] = await pool.query('SELECT id FROM users WHERE username = ? AND role IN ("admin", "super_admin")', [username]);
    if (exists.length) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }

    if (role !== 'super_admin' && !company_id) {
      return res.status(400).json({ success: false, message: 'company_id is required' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (full_name, username, password, role, company_id, allowed_modules, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [full_name, username, hashed, role || 'admin', role === 'super_admin' ? null : company_id, role === 'super_admin' ? null : JSON.stringify(normalizeModules(allowed_modules) || [])]
    );

    res.status(201).json({ success: true, data: { id: result.insertId, full_name, username, role: role || 'admin', company_id: role === 'super_admin' ? null : company_id, allowed_modules: normalizeModules(allowed_modules) } });
  } catch (error) {
    next(error);
  }
}

function getAuthTable(role) {
  if (role === 'super_admin' || role === 'admin' || role === 'company_user') {
    return {
      table: 'users',
      idColumn: 'id',
      selectColumns: 'id, full_name, username, password, role, company_id',
      updateColumns: ['password'],
    };
  }

  if (role === 'customer') {
    return {
      table: 'customers',
      idColumn: 'id',
      selectColumns: 'id, full_name, username, password, company_id',
      updateColumns: ['password'],
    };
  }

  if (role === 'vendor') {
    return {
      table: 'vendors',
      idColumn: 'id',
      selectColumns: 'id, full_name, username, password, company_id',
      updateColumns: ['password'],
    };
  }

  return null;
}

async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    const authTable = getAuthTable(req.user.role);

    if (!authTable) {
      return res.status(400).json({ success: false, message: 'Unsupported account type' });
    }

    const [rows] = await pool.query(
      `SELECT ${authTable.selectColumns} FROM ${authTable.table} WHERE ${authTable.idColumn} = ?`,
      [req.user.id],
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const account = rows[0];
    const currentPasswordValid = await isPasswordValid(current_password, account.password);

    if (!currentPasswordValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await pool.query(
      `UPDATE ${authTable.table} SET password = ?, updated_at = NOW() WHERE ${authTable.idColumn} = ?`,
      [hashedPassword, req.user.id],
    );

    return res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { login, register, changePassword };
