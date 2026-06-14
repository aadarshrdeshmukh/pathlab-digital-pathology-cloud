const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const logAudit = require('../utils/auditLog');

// Apply auth middleware to all patient routes
router.use(authMiddleware);

// GET /api/patients
router.get('/', async (req, res) => {
  try {
    let { page, limit, search } = req.query;
    if (page || limit || search) {
      page = parseInt(page) || 1;
      limit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM patients';
      let countQuery = 'SELECT COUNT(*) AS total FROM patients';
      let params = [];
      let countParams = [];

      if (search) {
        query += ' WHERE name LIKE ? OR contact LIKE ?';
        countQuery += ' WHERE name LIKE ? OR contact LIKE ?';
        const wildSearch = `%${search}%`;
        params.push(wildSearch, wildSearch);
        countParams.push(wildSearch, wildSearch);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await pool.query(query, params);
      const [countResult] = await pool.query(countQuery, countParams);
      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      res.json({
        data: rows,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      });
    } else {
      const [rows] = await pool.query('SELECT * FROM patients ORDER BY created_at DESC');
      res.json(rows);
    }
  } catch (error) {
    console.error('Fetch patients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/patients
router.post('/', async (req, res) => {
  const { name, age, gender, contact } = req.body;

  if (!name || !age || !gender || !contact) {
    return res.status(400).json({ error: 'All fields (name, age, gender, contact) are required' });
  }

  if (!['Male', 'Female', 'Other'].includes(gender)) {
    return res.status(400).json({ error: 'Invalid gender value. Must be Male, Female, or Other' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO patients (name, age, gender, contact) VALUES (?, ?, ?, ?)',
      [name, age, gender, contact]
    );

    logAudit(req.user.id, 'CREATE', 'patient', result.insertId);

    res.status(201).json({
      message: 'Patient registered successfully',
      patientId: result.insertId,
      patient: { id: result.insertId, name, age, gender, contact }
    });
  } catch (error) {
    console.error('Add patient error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
