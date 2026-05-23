const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, company_id: user.company_id || null },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

module.exports = { generateToken };
