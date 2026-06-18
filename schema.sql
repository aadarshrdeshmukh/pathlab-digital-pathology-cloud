-- SQL Schema Setup for PathLab Digital Pathology Cloud
CREATE DATABASE IF NOT EXISTS pathlab_db;
USE pathlab_db;

-- 1. Create Staff Table
CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'technician', 'doctor') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Create Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INT NOT NULL,
  gender ENUM('Male', 'Female', 'Other') NOT NULL,
  contact VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Create Test Requests Table
CREATE TABLE IF NOT EXISTS test_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  test_type VARCHAR(255) NOT NULL,
  priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
  status ENUM('pending', 'processing', 'completed') DEFAULT 'pending',
  assigned_to INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES staff(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 4. Create Reports Table
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  test_id INT UNIQUE NOT NULL,
  result_summary TEXT NOT NULL,
  file_url VARCHAR(512) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (test_id) REFERENCES test_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Indexes for performance optimization
CREATE INDEX idx_patients_name ON patients(name);
CREATE INDEX idx_patients_contact ON patients(contact);
CREATE INDEX idx_test_requests_patient_id ON test_requests(patient_id);

-- 5. Create Audit Logs Table (Compliance & Auditability)
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NULL,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id INT NOT NULL,
  details JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_audit_logs_staff ON audit_logs(staff_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);

-- =========================================================================
-- SEED DATA SETUP (DEVELOPMENT / DEMO ONLY)
-- WARNING: DO NOT run this section in production environments!
-- These accounts use weak demo passwords and should be replaced with
-- properly secured credentials for any real deployment.
-- =========================================================================

-- Seed Staff Accounts (Password for all: <role>123 e.g., admin123, tech123, doc123)
INSERT INTO staff (name, email, password, role) VALUES
('Dr. Alan Administrator', 'admin@pathlab.com', '$2a$10$cIEN6dhnrl37kKQGszh4mOX9Pr4.YtEjApHVJlHTzIkUyEiX4Mqzm', 'admin'),
('Thomas Tech', 'tech@pathlab.com', '$2a$10$Yw0MHSRf0K7Gu1.lBMyR6.VAtQjiClmY2LKRXxAZqERHSrU5RaoEm', 'technician'),
('Dr. Denise Doctor', 'doc@pathlab.com', '$2a$10$io2X9bLLywBXTsJLrdKCKOpMTb2OFwx6v6DMDkgLGsdi.B2MErvBm', 'doctor')
ON DUPLICATE KEY UPDATE id=id;

-- Seed Patient Registry
INSERT INTO patients (id, name, age, gender, contact) VALUES
(1, 'Alice Watson', 29, 'Female', '+1 555-0144'),
(2, 'Bob Miller', 45, 'Male', '+1 555-0155'),
(3, 'Charlie Davis', 62, 'Male', '+1 555-0166'),
(4, 'Diana Prince', 34, 'Female', '+1 555-0177')
ON DUPLICATE KEY UPDATE id=id;

-- Seed Pathology Test Requests
INSERT INTO test_requests (id, patient_id, test_type, priority, status) VALUES
(1, 1, 'Complete Blood Count (CBC)', 'Medium', 'completed'),
(2, 2, 'Lipid Profile Screen', 'High', 'processing'),
(3, 3, 'Biopsy Histopathology Analysis', 'Critical', 'pending'),
(4, 4, 'Thyroid Panel (TSH, T3, T4)', 'Low', 'pending')
ON DUPLICATE KEY UPDATE id=id;

-- Seed Pathology Diagnostics Report
INSERT INTO reports (id, test_id, result_summary, file_url) VALUES
(1, 1, 'Patient CBC shows standard haemoglobin (14.2 g/dL) and platelets (250,000 /mcL). WBC count is elevated (11,500 /mcL) indicating minor immune response.', 'http://localhost:5001/uploads/sample_report.pdf')
ON DUPLICATE KEY UPDATE id=id;
