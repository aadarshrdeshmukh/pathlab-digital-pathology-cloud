const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to stats
router.use(authMiddleware);

// GET /api/dashboard - Aggregated stats for the main dashboard
router.get('/', async (req, res) => {
  try {
    const [patientsCount] = await pool.query('SELECT COUNT(*) AS count FROM patients');
    const [pendingCount] = await pool.query("SELECT COUNT(*) AS count FROM test_requests WHERE status != 'completed'");
    const [completedCount] = await pool.query('SELECT COUNT(*) AS count FROM reports');
    const [staffCount] = await pool.query('SELECT COUNT(*) AS count FROM staff');

    res.json({
      totalPatients: patientsCount[0].count,
      pendingTests: pendingCount[0].count,
      completedReports: completedCount[0].count,
      activeStaff: staffCount[0].count
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
