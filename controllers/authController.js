const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { generateToken } = require('../utils/jwt');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    const [adminRows] = await pool.query(
      'SELECT id, full_name, username, password, role FROM users WHERE username = ? AND role = "admin"',
      [username]
    );
    if (adminRows.length) {
      const user = adminRows[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = generateToken(user);
      return res.json({
        success: true,
        data: { id: user.id, full_name: user.full_name, username: user.username, role: user.role, token },
      });
    }

    const [customerRows] = await pool.query(
      'SELECT id, full_name, username, password FROM customers WHERE username = ? AND customer_type = "star"',
      [username]
    );
    if (customerRows.length) {
      const customer = customerRows[0];
      const isMatch = await bcrypt.compare(password, customer.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = generateToken({ id: customer.id, username: customer.username, role: 'customer' });
      return res.json({
        success: true,
        data: { id: customer.id, full_name: customer.full_name, username: customer.username, role: 'customer', token },
      });
    }

    const [vendorRows] = await pool.query(
      'SELECT id, full_name, username, password FROM vendors WHERE username = ?',
      [username]
    );
    if (vendorRows.length) {
      const vendor = vendorRows[0];
      const isMatch = await bcrypt.compare(password, vendor.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = generateToken({ id: vendor.id, username: vendor.username, role: 'vendor' });
      return res.json({
        success: true,
        data: { id: vendor.id, full_name: vendor.full_name, username: vendor.username, role: 'vendor', token },
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (error) {
    next(error);
  }
}

async function register(req, res, next) {
  try {
    const { full_name, username, password, role } = req.body;
    const [exists] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (exists.length) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (full_name, username, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [full_name, username, hashed, role || 'admin']
    );

    res.status(201).json({ success: true, data: { id: result.insertId, full_name, username, role: role || 'admin' } });
  } catch (error) {
    next(error);
  }
}

module.exports = { login, register };
