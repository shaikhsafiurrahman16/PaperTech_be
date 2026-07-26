const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const pool = require('./config/db');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: 'TradeStack API is running' });
});

app.use(errorHandler);

async function ensureDefaultAdmin() {
  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE role = ?', ['super_admin']);
    if (rows.length === 0) {
      const defaultUsername = process.env.DEFAULT_SUPER_ADMIN_USERNAME || 'super';
      const defaultPassword = process.env.DEFAULT_SUPER_ADMIN_PASSWORD || 'Safi123.';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      await pool.query(
        'INSERT INTO users (full_name, username, password, role, company_id, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, NOW(), NOW())',
        ['Super Admin', defaultUsername, hashedPassword, 'super_admin']
      );
    }
  } catch (error) {
    console.error('Error ensuring default super admin user:', error);
  }
}

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, async () => {
//   console.log(`Server running on port ${PORT}`);
//   await ensureDefaultAdmin();
// });


const PORT = process.env.PORT || 5000;

// Local development ke liye listen karega
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await ensureDefaultAdmin();
  });
}

// Vercel deployment ke liye app ko export karna ZAROORI hai
module.exports = app;