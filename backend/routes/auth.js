const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const logAudit = require('../utils/auditLog');
require('dotenv').config();

// Rate limiters for auth endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per window
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many registration attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('CRITICAL CONFIGURATION ERROR: JWT_SECRET environment variable is missing!');
  process.exit(1);
}

// POST /api/auth/register
router.post('/register', registerLimiter, authMiddleware, async (req, res) => {
  // Enforce role-based access control: Only admin staff can register new users
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Only administrators can register new staff.' });
  }
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields (name, email, password, role) are required' });
  }

  if (!['admin', 'technician', 'doctor'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be admin, technician, or doctor' });
  }

  try {
    // Check if user already exists
    const [existing] = await pool.query('SELECT id FROM staff WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO staff (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    res.status(201).json({
      message: 'Staff member registered successfully',
      userId: result.insertId,
      user: { name, email, role }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM staff WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, role, created_at FROM staff WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(users[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/staff — Admin & Technician, list all staff members
router.get('/staff', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'technician') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  try {
    const [staff] = await pool.query(
      'SELECT id, name, email, role, created_at FROM staff ORDER BY created_at DESC'
    );
    res.json(staff);
  } catch (error) {
    console.error('Fetch staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/auth/staff/:id — Admin only, delete a staff member
router.delete('/staff/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }

  const { id } = req.params;
  const staffId = parseInt(id);

  // Prevent self-deletion
  if (staffId === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account.' });
  }

  try {
    const [staff] = await pool.query('SELECT id, name, email FROM staff WHERE id = ?', [staffId]);
    if (staff.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    await pool.query('DELETE FROM staff WHERE id = ?', [staffId]);
    logAudit(req.user.id, 'DELETE', 'staff', staffId, { name: staff[0].name, email: staff[0].email });
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
