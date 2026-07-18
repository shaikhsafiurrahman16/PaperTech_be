// const mysql = require('mysql2/promise');
// const dotenv = require('dotenv');

// dotenv.config();

// const pool = mysql.createPool({
//   host: process.env.DB_HOST || 'localhost',
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || 'Safi123.' ,
//   database: process.env.DB_NAME || 'papertech',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   connectTimeout: 10000,
// });

// module.exports = pool;


const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  uri: 'mysql://root:WqbSKxrhzwyIXQEhEUBmxCLjanbMnlnj@tokaido.proxy.rlwy.net:14397/railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 15000,
});

module.exports = pool;