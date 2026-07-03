const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { normalizeModules } = require('../config/accessModules');

async function protect(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'super_admin') {
      const [rows] = await pool.query('SELECT id, full_name, username, role, allowed_modules FROM users WHERE id = ? AND role = "super_admin"', [decoded.id]);
      if (rows.length) {
        req.user = { ...rows[0], allowed_modules: normalizeModules(rows[0].allowed_modules) };
        return next();
      }
    }

    if (decoded.role === 'admin') {
      const [rows] = await pool.query('SELECT id, full_name, username, role, company_id, allowed_modules FROM users WHERE id = ? AND role = "admin"', [decoded.id]);
      if (rows.length) {
        req.user = { ...rows[0], allowed_modules: normalizeModules(rows[0].allowed_modules) };
        return next();
      }
    }

    if (decoded.role === 'company_user') {
      const [rows] = await pool.query('SELECT id, full_name, username, role, company_id, allowed_modules FROM users WHERE id = ? AND role = "company_user"', [decoded.id]);
      if (rows.length) {
        req.user = { ...rows[0], allowed_modules: normalizeModules(rows[0].allowed_modules) };
        return next();
      }
    }

    if (decoded.role === 'customer') {
      const [rows] = await pool.query('SELECT id, full_name, username, company_id FROM customers WHERE id = ? AND customer_type = "star"', [decoded.id]);
      if (rows.length) {
        req.user = { ...rows[0], role: 'customer' };
        return next();
      }
    }

    if (decoded.role === 'vendor') {
      const [rows] = await pool.query('SELECT id, full_name, username, company_id FROM vendors WHERE id = ?', [decoded.id]);
      if (rows.length) {
        req.user = { ...rows[0], role: 'vendor' };
        return next();
      }
    }

    return res.status(401).json({ success: false, message: 'Invalid token' });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token is not valid' });
  }
}

module.exports = { protect };
