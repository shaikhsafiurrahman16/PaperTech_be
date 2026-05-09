const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const pool = require('./config/db');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: 'PaperTech API is running' });
});

app.use(errorHandler);

async function ensureDefaultAdmin() {
  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE role = ?', ['admin']);
    if (rows.length === 0) {
      const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      await pool.query(
        'INSERT INTO users (full_name, username, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        ['Admin User', defaultUsername, hashedPassword, 'admin']
      );

      console.log(`Created default admin account: ${defaultUsername} / ${defaultPassword}`);
    }
  } catch (error) {
    console.error('Error ensuring default admin user:', error);
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await ensureDefaultAdmin();
});
