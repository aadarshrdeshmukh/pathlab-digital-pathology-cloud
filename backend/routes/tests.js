const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const logAudit = require('../utils/auditLog');

// Apply auth middleware to all test routes
router.use(authMiddleware);

// GET /api/tests
router.get('/', async (req, res) => {
  try {
    let { page, limit, search } = req.query;
    if (page || limit || search) {
      page = parseInt(page) || 1;
      limit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
      const offset = (page - 1) * limit;

      let query = `
        SELECT tr.*, p.name AS patient_name, p.age AS patient_age, p.gender AS patient_gender 
        FROM test_requests tr
        JOIN patients p ON tr.patient_id = p.id
      `;
      let countQuery = `
        SELECT COUNT(*) AS total 
        FROM test_requests tr
        JOIN patients p ON tr.patient_id = p.id
      `;
      let params = [];
      let countParams = [];

      if (search) {
        query += ' WHERE p.name LIKE ? OR tr.test_type LIKE ?';
        countQuery += ' WHERE p.name LIKE ? OR tr.test_type LIKE ?';
        const wildSearch = `%${search}%`;
        params.push(wildSearch, wildSearch);
        countParams.push(wildSearch, wildSearch);
      }

      query += ' ORDER BY tr.created_at DESC LIMIT ? OFFSET ?';
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
      // Non-paginated path — supports optional ?status= filter for dropdown use
      let query = `
        SELECT tr.*, p.name AS patient_name, p.age AS patient_age, p.gender AS patient_gender 
        FROM test_requests tr
        JOIN patients p ON tr.patient_id = p.id
      `;
      let params = [];
      const { status } = req.query;
      if (status) {
        const statuses = Array.isArray(status) ? status : [status];
        const validStatuses = statuses.filter(s => ['pending', 'processing', 'completed'].includes(s));
        if (validStatuses.length > 0) {
          query += ` WHERE tr.status IN (${validStatuses.map(() => '?').join(',')})`;
          params.push(...validStatuses);
        }
      }
      query += ' ORDER BY tr.created_at DESC';
      const [rows] = await pool.query(query, params);
      res.json(rows);
    }
  } catch (error) {
    console.error('Fetch tests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tests
router.post('/', requireRole('admin', 'technician'), async (req, res) => {
  const { patient_id, test_type, priority } = req.body;

  if (!patient_id || !test_type || !priority) {
    return res.status(400).json({ error: 'All fields (patient_id, test_type, priority) are required' });
  }

  if (!['Low', 'Medium', 'High', 'Critical'].includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority. Must be Low, Medium, High, or Critical' });
  }

  try {
    // Check if patient exists
    const [patients] = await pool.query('SELECT id FROM patients WHERE id = ?', [patient_id]);
    if (patients.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const [result] = await pool.query(
      'INSERT INTO test_requests (patient_id, test_type, priority, status) VALUES (?, ?, ?, ?)',
      [patient_id, test_type, priority, 'pending']
    );

    res.status(201).json({
      message: 'Test request created successfully',
      testId: result.insertId,
      test: { id: result.insertId, patient_id, test_type, priority, status: 'pending' }
    });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/tests/:id
router.patch('/:id', requireRole('admin', 'technician'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'processing', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Valid status (pending, processing, completed) is required' });
  }

  try {
    const [tests] = await pool.query('SELECT id FROM test_requests WHERE id = ?', [id]);
    if (tests.length === 0) {
      return res.status(404).json({ error: 'Test request not found' });
    }

    await pool.query('UPDATE test_requests SET status = ? WHERE id = ?', [status, id]);
    logAudit(req.user.id, 'UPDATE', 'test_request', parseInt(id), { status });
    res.json({ message: 'Test status updated successfully', testId: id, status });
  } catch (error) {
    console.error('Update test status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
