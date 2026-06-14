const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const logAudit = require('../utils/auditLog');
require('dotenv').config();

// Apply auth middleware to all report routes
router.use(authMiddleware);

// Set up multer memory storage for file buffers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF reports are allowed'), false);
    }
  }
});

// Check if AWS is configured (ignoring standard placeholder values)
const isS3Configured = 
  process.env.AWS_ACCESS_KEY_ID && 
  process.env.AWS_ACCESS_KEY_ID !== 'your_aws_access_key_id' &&
  process.env.AWS_SECRET_ACCESS_KEY && 
  process.env.AWS_SECRET_ACCESS_KEY !== 'your_aws_secret_access_key' &&
  process.env.AWS_BUCKET_NAME &&
  process.env.AWS_BUCKET_NAME !== 'your_s3_bucket_name';

let s3Client;
if (isS3Configured) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
}

// GET /api/reports/executive (admin-only aggregated executive summary)
router.get('/executive', requireRole('admin'), async (req, res) => {
  try {
    const [totalPatients] = await pool.query('SELECT COUNT(*) AS count FROM patients');
    const [totalTests] = await pool.query('SELECT COUNT(*) AS count FROM test_requests');
    const [completedTests] = await pool.query("SELECT COUNT(*) AS count FROM test_requests WHERE status = 'completed'");
    const [pendingTests] = await pool.query("SELECT COUNT(*) AS count FROM test_requests WHERE status = 'pending'");
    const [processingTests] = await pool.query("SELECT COUNT(*) AS count FROM test_requests WHERE status = 'processing'");
    const [totalReports] = await pool.query('SELECT COUNT(*) AS count FROM reports');
    const [totalStaff] = await pool.query('SELECT COUNT(*) AS count FROM staff');
    const [priorityBreakdown] = await pool.query(
      'SELECT priority, COUNT(*) AS count FROM test_requests GROUP BY priority'
    );
    const [recentActivity] = await pool.query(
      `SELECT tr.*, p.name AS patient_name FROM test_requests tr
       JOIN patients p ON tr.patient_id = p.id
       ORDER BY tr.updated_at DESC LIMIT 10`
    );
    const [staffBreakdown] = await pool.query(
      'SELECT role, COUNT(*) AS count FROM staff GROUP BY role'
    );

    res.json({
      overview: {
        totalPatients: totalPatients[0].count,
        totalTests: totalTests[0].count,
        completedTests: completedTests[0].count,
        pendingTests: pendingTests[0].count,
        processingTests: processingTests[0].count,
        totalReports: totalReports[0].count,
        totalStaff: totalStaff[0].count,
        completionRate: totalTests[0].count > 0
          ? ((completedTests[0].count / totalTests[0].count) * 100).toFixed(1)
          : '0.0',
      },
      priorityBreakdown,
      staffBreakdown,
      recentActivity,
    });
  } catch (error) {
    console.error('Executive report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports
router.get('/', async (req, res) => {
  try {
    let { page, limit, search } = req.query;
    if (page || limit || search) {
      page = parseInt(page) || 1;
      limit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
      const offset = (page - 1) * limit;

      let query = `
        SELECT r.*, tr.test_type, tr.priority, p.name AS patient_name 
        FROM reports r
        JOIN test_requests tr ON r.test_id = tr.id
        JOIN patients p ON tr.patient_id = p.id
      `;
      let countQuery = `
        SELECT COUNT(*) AS total 
        FROM reports r
        JOIN test_requests tr ON r.test_id = tr.id
        JOIN patients p ON tr.patient_id = p.id
      `;
      let params = [];
      let countParams = [];

      if (search) {
        query += ' WHERE p.name LIKE ? OR tr.test_type LIKE ? OR r.result_summary LIKE ?';
        countQuery += ' WHERE p.name LIKE ? OR tr.test_type LIKE ? OR r.result_summary LIKE ?';
        const wildSearch = `%${search}%`;
        params.push(wildSearch, wildSearch, wildSearch);
        countParams.push(wildSearch, wildSearch, wildSearch);
      }

      query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
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
      const query = `
        SELECT r.*, tr.test_type, tr.priority, p.name AS patient_name 
        FROM reports r
        JOIN test_requests tr ON r.test_id = tr.id
        JOIN patients p ON tr.patient_id = p.id
        ORDER BY r.created_at DESC
      `;
      const [rows] = await pool.query(query);
      res.json(rows);
    }
  } catch (error) {
    console.error('Fetch reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/reports (multipart/form-data upload)
router.post('/', upload.single('file'), async (req, res) => {
  const { test_id, result_summary } = req.body;

  if (!test_id || !result_summary) {
    return res.status(400).json({ error: 'test_id and result_summary are required' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Please upload a PDF report file' });
  }

  try {
    // Check if test request exists and is not already completed
    const [tests] = await pool.query('SELECT id, status FROM test_requests WHERE id = ?', [test_id]);
    if (tests.length === 0) {
      return res.status(404).json({ error: 'Test request not found' });
    }

    let fileUrl = '';

    // Sanitize the filename to prevent directory traversal and remove special characters
    const ext = path.extname(req.file.originalname);
    const baseName = path.basename(req.file.originalname, ext);
    const sanitizedBase = baseName
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .replace(/\s+/g, '_');
    const safeFilename = `${Date.now()}-${sanitizedBase || 'report'}${ext || '.pdf'}`;

    if (isS3Configured) {
      // S3 upload flow
      const s3Key = `reports/${safeFilename}`;
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      };

      await s3Client.send(new PutObjectCommand(uploadParams));
      fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;
      console.log('Report uploaded to S3 successfully:', fileUrl);
    } else {
      // Local fallback storage flow
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const localFilePath = path.join(uploadDir, safeFilename);
      fs.writeFileSync(localFilePath, req.file.buffer);

      // Construct API URL
      const host = req.get('host');
      const protocol = req.protocol;
      fileUrl = `${protocol}://${host}/uploads/${safeFilename}`;
      console.log('Report saved locally (fallback):', fileUrl);
    }

    // Begin a transaction to ensure DB consistency
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if report already exists for this test request (enforce unique constraint manually or replace)
      const [existingReport] = await connection.query('SELECT id FROM reports WHERE test_id = ?', [test_id]);
      
      let reportId;
      if (existingReport.length > 0) {
        // Update report
        await connection.query(
          'UPDATE reports SET result_summary = ?, file_url = ? WHERE test_id = ?',
          [result_summary, fileUrl, test_id]
        );
        reportId = existingReport[0].id;
      } else {
        // Insert new report
        const [insertResult] = await connection.query(
          'INSERT INTO reports (test_id, result_summary, file_url) VALUES (?, ?, ?)',
          [test_id, result_summary, fileUrl]
        );
        reportId = insertResult.insertId;
      }

      // Update test status to 'completed'
      await connection.query(
        "UPDATE test_requests SET status = 'completed' WHERE id = ?",
        [test_id]
      );

      await connection.commit();

      logAudit(req.user.id, 'CREATE', 'report', reportId, { test_id, file_url: fileUrl });

      res.status(201).json({
        message: 'Report uploaded and test marked as completed successfully',
        report: {
          id: reportId,
          test_id,
          result_summary,
          file_url: fileUrl
        }
      });
    } catch (txError) {
      await connection.rollback();
      throw txError;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Upload report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
