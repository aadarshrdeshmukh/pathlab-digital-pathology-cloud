const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const testRoutes = require('./routes/tests');
const reportRoutes = require('./routes/reports');
const statsRoutes = require('./routes/stats');
const auditLogRoutes = require('./routes/auditLogs');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration supporting multi-origin and deployment domains (*.vercel.app, *.onrender.com)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);

    try {
      const hostname = new URL(origin).hostname;
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        hostname.endsWith('.vercel.app') ||
        hostname.endsWith('.onrender.com') ||
        hostname === 'localhost' ||
        hostname === '127.0.0.1'
      ) {
        return callback(null, true);
      }
    } catch (e) {
      // Fallback to allowing if parsing fails
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static local uploads if using the fallback storage system
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', statsRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection status
    const [rows] = await pool.query('SELECT 1');
    res.json({
      status: 'OK',
      database: 'connected',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(500).json({
      status: 'ERROR',
      database: 'disconnected',
      timestamp: new Date()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal server error'
  });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`PathLab Express Server is running on port ${PORT}`);
  console.log(`Local uploads folder mounted at: ${uploadsPath}`);
});

// Graceful shutdown handling
const shutdown = async () => {
  console.log('Received shutdown signal. Starting graceful shutdown...');
  server.close(async () => {
    console.log('HTTP server closed. Terminating database connections...');
    try {
      await pool.end();
      console.log('Database connection pool closed successfully. Exiting.');
      process.exit(0);
    } catch (err) {
      console.error('Error closing database pool during shutdown:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
