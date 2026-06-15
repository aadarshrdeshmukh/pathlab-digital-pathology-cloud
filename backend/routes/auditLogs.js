const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// Protect all routes
router.use(authMiddleware);

// GET /api/audit-logs — Admin only, paginated
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [countResult] = await pool.query('SELECT COUNT(*) AS total FROM audit_logs');
    const total = countResult[0].total;

    const [logs] = await pool.query(
      `SELECT al.*, s.name AS staff_name, s.email AS staff_email
       FROM audit_logs al
       LEFT JOIN staff s ON al.staff_id = s.id
       ORDER BY al.timestamp DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
