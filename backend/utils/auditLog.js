const pool = require('../db');

/**
 * Log an action to the audit_logs table for compliance tracking.
 * @param {number} staffId - ID of the staff member performing the action
 * @param {string} action - Action type: 'CREATE', 'UPDATE', 'DELETE'
 * @param {string} entity - Entity type: 'patient', 'test_request', 'report', 'staff'
 * @param {number} entityId - ID of the affected entity
 * @param {object|null} details - Optional JSON details of the change
 */
async function logAudit(staffId, action, entity, entityId, details = null) {
  try {
    await pool.query(
      'INSERT INTO audit_logs (staff_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [staffId, action, entity, entityId, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    console.error('Audit log write failed:', err.message);
    // Non-blocking: audit log failure should not break the main operation
  }
}

module.exports = logAudit;
