const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD, // Removed hardcoded default 'rootpassword'
  database: process.env.DB_NAME || 'pathlab_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Enforce security policy: DB_PASSWORD is mandatory in production environment
if (process.env.NODE_ENV === 'production' && !process.env.DB_PASSWORD) {
  console.error('CRITICAL SECURITY ERROR: DB_PASSWORD environment variable is missing in production!');
  process.exit(1);
}

module.exports = pool;
