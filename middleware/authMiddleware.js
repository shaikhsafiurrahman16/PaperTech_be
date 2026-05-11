const jwt = require('jsonwebtoken');
const pool = require('../config/db');

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
    
    // First check if user is an admin
    if (decoded.role === 'admin') {
      const [rows] = await pool.query('SELECT id, full_name, username, role FROM users WHERE id = ?', [decoded.id]);
      if (rows.length) {
        req.user = rows[0];
        return next();
      }
    }
    
    // Check if user is a customer
    if (decoded.role === 'customer') {
      const [rows] = await pool.query('SELECT id, full_name, username FROM customers WHERE id = ? AND customer_type = "star"', [decoded.id]);
      if (rows.length) {
        req.user = { ...rows[0], role: 'customer' };
        return next();
      }
    }

    return res.status(401).json({ success: false, message: 'Invalid token' });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token is not valid' });
  }
}

module.exports = { protect };
