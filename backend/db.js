const mysql = require('mysql2/promise');
require('dotenv').config();

// Determine connection options
const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

let poolConfig = {};

if (dbUrl) {
  // Use connection URL if provided (standard on Render, Railway, PlanetScale, etc.)
  poolConfig = {
    uri: dbUrl,
    waitForConnections: true,
    connectionLimit: process.env.DB_CONNECTION_LIMIT ? parseInt(process.env.DB_CONNECTION_LIMIT, 10) : 10,
    queueLimit: 0,
  };
  
  if (process.env.DB_SSL === 'true' || (process.env.NODE_ENV === 'production' && process.env.DB_SSL !== 'false')) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
} else {
  // Standard discrete environment variables
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'pathlab_db',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    waitForConnections: true,
    connectionLimit: process.env.DB_CONNECTION_LIMIT ? parseInt(process.env.DB_CONNECTION_LIMIT, 10) : 10,
    queueLimit: 0,
  };

  if (process.env.DB_SSL === 'true' || (process.env.NODE_ENV === 'production' && process.env.DB_SSL !== 'false' && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1')) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
}

const pool = mysql.createPool(poolConfig);

// Enforce security check in production: Ensure credentials are provided
if (process.env.NODE_ENV === 'production' && !dbUrl && !process.env.DB_PASSWORD) {
  console.error('CRITICAL SECURITY ERROR: DB_PASSWORD or DATABASE_URL environment variable is missing in production!');
  process.exit(1);
}

module.exports = pool;
