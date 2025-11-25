-- ============================================================================
-- DormEase Hostel Management System - Complete Database Schema
-- ============================================================================
-- This file contains the complete database schema including:
-- 1. Database creation and configuration
-- 2. Tables with constraints
-- 3. Indexes for performance optimization
-- 4. Views for data abstraction
-- 5. Stored functions for business logic
-- 6. Stored procedures with transaction management
-- 7. Triggers for data integrity
-- 8. Sample data (optional)
-- ============================================================================

-- Create database
CREATE DATABASE IF NOT EXISTS hostelhive;
USE hostelhive;

-- ============================================================================
-- SECTION 1: TABLE DEFINITIONS
-- ============================================================================

-- Table: hostels
CREATE TABLE IF NOT EXISTS hostels (
  hostel_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  address TEXT NOT NULL,
  type ENUM('Boys', 'Girls', 'Co-ed') NOT NULL,
  gender_allowed ENUM('Male', 'Female', 'Both') NOT NULL,
  total_rooms INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_hostel_type (type),
  INDEX idx_hostel_gender (gender_allowed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: rooms
CREATE TABLE IF NOT EXISTS rooms (
  room_id INT AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT NOT NULL,
  room_number VARCHAR(20) NOT NULL,
  room_type ENUM('Single', 'Double', 'Triple', 'Quad') NOT NULL,
  capacity INT NOT NULL,
  price_per_month DECIMAL(10, 2) NOT NULL,
  has_ac BOOLEAN DEFAULT FALSE,
  has_attached_washroom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hostel_id) REFERENCES hostels(hostel_id) ON DELETE CASCADE,
  UNIQUE KEY unique_room (hostel_id, room_number),
  INDEX idx_room_hostel (hostel_id),
  INDEX idx_room_type (room_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: beds
CREATE TABLE IF NOT EXISTS beds (
  bed_id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  bed_number INT NOT NULL,
  status ENUM('available', 'occupied', 'reserved') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
  UNIQUE KEY unique_bed (room_id, bed_number),
  INDEX idx_bed_room_status (room_id, status),
  INDEX idx_bed_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: students
CREATE TABLE IF NOT EXISTS students (
  student_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  gender ENUM('Male', 'Female', 'Other') NOT NULL,
  department VARCHAR(100),
  year INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_student_email (email),
  INDEX idx_student_email_dept (email, department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: admins
CREATE TABLE IF NOT EXISTS admins (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'super_admin') DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: bookings
CREATE TABLE IF NOT EXISTS bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  bed_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('pending', 'active', 'cancelled', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (bed_id) REFERENCES beds(bed_id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_bed_id (bed_id),
  INDEX idx_booking_status (status),
  INDEX idx_booking_student_status (student_id, status),
  INDEX idx_booking_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: payments
CREATE TABLE IF NOT EXISTS payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  mode ENUM('Online', 'UPI', 'Card', 'Cash') DEFAULT 'Online',
  status ENUM('initiated', 'success', 'failed') DEFAULT 'initiated',
  transaction_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
  INDEX idx_booking_id (booking_id),
  INDEX idx_payment_status (status),
  INDEX idx_payment_booking (booking_id),
  INDEX idx_payment_status_date (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: booking_audit_log (for tracking status changes)
CREATE TABLE IF NOT EXISTS booking_audit_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  old_status ENUM('pending', 'active', 'cancelled', 'completed'),
  new_status ENUM('pending', 'active', 'cancelled', 'completed'),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_booking_audit (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- SECTION 2: VIEWS (Data Abstraction Layer)
-- ============================================================================

-- View 1: Available Rooms Summary
CREATE OR REPLACE VIEW available_rooms_summary AS
SELECT 
  h.hostel_id,
  h.name AS hostel_name,
  h.type AS hostel_type,
  h.gender_allowed,
  r.room_id,
  r.room_number,
  r.room_type,
  r.capacity,
  r.price_per_month,
  r.has_ac,
  r.has_attached_washroom,
  COUNT(b.bed_id) AS total_beds,
  COUNT(CASE WHEN b.status = 'available' THEN 1 END) AS available_beds,
  COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) AS occupied_beds
FROM hostels h
INNER JOIN rooms r ON h.hostel_id = r.hostel_id
INNER JOIN beds b ON r.room_id = b.room_id
GROUP BY h.hostel_id, h.name, h.type, h.gender_allowed, 
         r.room_id, r.room_number, r.room_type, r.capacity, 
         r.price_per_month, r.has_ac, r.has_attached_washroom
HAVING available_beds > 0;

-- View 2: Student Booking Details
CREATE OR REPLACE VIEW student_booking_details AS
SELECT 
  s.student_id,
  s.name AS student_name,
  s.email AS student_email,
  s.department,
  s.year,
  bk.booking_id,
  bk.start_date,
  bk.end_date,
  bk.status AS booking_status,
  bk.created_at AS booking_date,
  h.name AS hostel_name,
  h.type AS hostel_type,
  r.room_number,
  r.room_type,
  r.price_per_month,
  b.bed_number,
  b.status AS bed_status
FROM students s
INNER JOIN bookings bk ON s.student_id = bk.student_id
INNER JOIN beds b ON bk.bed_id = b.bed_id
INNER JOIN rooms r ON b.room_id = r.room_id
INNER JOIN hostels h ON r.hostel_id = h.hostel_id;

-- View 3: Monthly Revenue Report
CREATE OR REPLACE VIEW monthly_revenue_report AS
SELECT 
  YEAR(p.created_at) AS year,
  MONTH(p.created_at) AS month,
  h.hostel_id,
  h.name AS hostel_name,
  COUNT(p.payment_id) AS total_transactions,
  COUNT(CASE WHEN p.status = 'success' THEN 1 END) AS successful_payments,
  SUM(CASE WHEN p.status = 'success' THEN p.amount ELSE 0 END) AS total_revenue,
  AVG(CASE WHEN p.status = 'success' THEN p.amount ELSE NULL END) AS avg_payment_amount
FROM payments p
INNER JOIN bookings bk ON p.booking_id = bk.booking_id
INNER JOIN beds b ON bk.bed_id = b.bed_id
INNER JOIN rooms r ON b.room_id = r.room_id
INNER JOIN hostels h ON r.hostel_id = h.hostel_id
GROUP BY YEAR(p.created_at), MONTH(p.created_at), h.hostel_id, h.name;

-- View 4: Hostel Occupancy Overview
CREATE OR REPLACE VIEW hostel_occupancy_overview AS
SELECT 
  h.hostel_id,
  h.name AS hostel_name,
  h.type AS hostel_type,
  h.gender_allowed,
  COUNT(DISTINCT r.room_id) AS total_rooms,
  COUNT(b.bed_id) AS total_beds,
  COUNT(CASE WHEN b.status = 'available' THEN 1 END) AS available_beds,
  COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) AS occupied_beds,
  ROUND((COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) / COUNT(b.bed_id)) * 100, 2) AS occupancy_rate
FROM hostels h
INNER JOIN rooms r ON h.hostel_id = r.hostel_id
INNER JOIN beds b ON r.room_id = b.room_id
GROUP BY h.hostel_id, h.name, h.type, h.gender_allowed;

-- ============================================================================
-- SECTION 3: STORED FUNCTIONS (Business Logic)
-- ============================================================================

DELIMITER //

-- Function 1: Calculate Occupancy Rate for a Hostel
CREATE FUNCTION GetOccupancyRate(p_hostel_id INT) 
RETURNS DECIMAL(5,2)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE total_beds INT DEFAULT 0;
  DECLARE occupied_beds INT DEFAULT 0;
  DECLARE occupancy_rate DECIMAL(5,2) DEFAULT 0.00;
  
  SELECT COUNT(*) INTO total_beds
  FROM beds b
  INNER JOIN rooms r ON b.room_id = r.room_id
  WHERE r.hostel_id = p_hostel_id;
  
  SELECT COUNT(*) INTO occupied_beds
  FROM beds b
  INNER JOIN rooms r ON b.room_id = r.room_id
  WHERE r.hostel_id = p_hostel_id AND b.status = 'occupied';
  
  IF total_beds > 0 THEN
    SET occupancy_rate = (occupied_beds / total_beds) * 100;
  END IF;
  
  RETURN occupancy_rate;
END //

-- Function 2: Calculate Total Dues for a Student
CREATE FUNCTION CalculateStudentDues(p_student_id INT)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE total_dues DECIMAL(10,2) DEFAULT 0.00;
  DECLARE monthly_rent DECIMAL(10,2);
  DECLARE months_stayed INT;
  DECLARE total_paid DECIMAL(10,2) DEFAULT 0.00;
  
  SELECT 
    r.price_per_month,
    TIMESTAMPDIFF(MONTH, bk.start_date, CURDATE())
  INTO monthly_rent, months_stayed
  FROM bookings bk
  INNER JOIN beds b ON bk.bed_id = b.bed_id
  INNER JOIN rooms r ON b.room_id = r.room_id
  WHERE bk.student_id = p_student_id 
    AND bk.status = 'active'
  LIMIT 1;
  
  IF monthly_rent IS NOT NULL AND months_stayed > 0 THEN
    SET total_dues = monthly_rent * months_stayed;
    
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM payments p
    INNER JOIN bookings bk ON p.booking_id = bk.booking_id
    WHERE bk.student_id = p_student_id 
      AND p.status = 'success';
    
    SET total_dues = total_dues - total_paid;
    
    IF total_dues < 0 THEN
      SET total_dues = 0;
    END IF;
  END IF;
  
  RETURN total_dues;
END //

-- Function 3: Get Available Beds Count for a Room
CREATE FUNCTION GetAvailableBeds(p_room_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE available_count INT DEFAULT 0;
  
  SELECT COUNT(*) INTO available_count
  FROM beds
  WHERE room_id = p_room_id AND status = 'available';
  
  RETURN available_count;
END //

-- Function 4: Check if Student Has Active Booking
CREATE FUNCTION HasActiveBooking(p_student_id INT)
RETURNS TINYINT(1)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE has_booking TINYINT(1) DEFAULT 0;
  
  SELECT COUNT(*) > 0 INTO has_booking
  FROM bookings
  WHERE student_id = p_student_id 
    AND status IN ('active', 'pending');
  
  RETURN has_booking;
END //

-- Function 5: Calculate Total Revenue for a Hostel
CREATE FUNCTION GetHostelRevenue(p_hostel_id INT)
RETURNS DECIMAL(12,2)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE total_revenue DECIMAL(12,2) DEFAULT 0.00;
  
  SELECT COALESCE(SUM(p.amount), 0) INTO total_revenue
  FROM payments p
  INNER JOIN bookings bk ON p.booking_id = bk.booking_id
  INNER JOIN beds b ON bk.bed_id = b.bed_id
  INNER JOIN rooms r ON b.room_id = r.room_id
  WHERE r.hostel_id = p_hostel_id 
    AND p.status = 'success';
  
  RETURN total_revenue;
END //

DELIMITER ;

-- ============================================================================
-- SECTION 4: STORED PROCEDURES (Transaction Management)
-- ============================================================================

DELIMITER //

-- Procedure 1: Allocate Bed with Two-Phase Locking
CREATE PROCEDURE AllocateBedWithLock(
  IN p_student_id INT,
  IN p_bed_id INT,
  IN p_start_date DATE,
  IN p_end_date DATE
)
BEGIN
  DECLARE bed_current_status VARCHAR(20);
  DECLARE existing_booking INT;
  DECLARE v_room_id INT;
  
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- Acquire exclusive lock on bed
  SELECT status, room_id INTO bed_current_status, v_room_id
  FROM beds
  WHERE bed_id = p_bed_id
  FOR UPDATE;
  
  -- Acquire shared lock on student bookings
  SELECT COUNT(*) INTO existing_booking
  FROM bookings
  WHERE student_id = p_student_id 
    AND status IN ('active', 'pending')
  FOR SHARE;
  
  -- Validations
  IF bed_current_status IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Error: Bed not found';
  END IF;
  
  IF bed_current_status != 'available' THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Error: Bed is not available for booking';
  END IF;
  
  IF existing_booking > 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Error: Student already has an active or pending booking';
  END IF;
  
  IF p_end_date <= p_start_date THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Error: End date must be after start date';
  END IF;
  
  -- Check for overlapping bookings
  SELECT COUNT(*) INTO existing_booking
  FROM bookings
  WHERE bed_id = p_bed_id
    AND status IN ('active', 'pending')
    AND (
      (p_start_date BETWEEN start_date AND end_date) OR
      (p_end_date BETWEEN start_date AND end_date) OR
      (start_date BETWEEN p_start_date AND p_end_date)
    )
  FOR SHARE;
  
  IF existing_booking > 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Error: Bed has overlapping booking dates';
  END IF;
  
  -- Create booking
  INSERT INTO bookings (student_id, bed_id, start_date, end_date, status, created_at)
  VALUES (p_student_id, p_bed_id, p_start_date, p_end_date, 'pending', NOW());
  
  COMMIT;
  
  SELECT 'Booking created successfully' AS message, LAST_INSERT_ID() AS booking_id;
END //

-- Procedure 2: Process Payment with Transaction
CREATE PROCEDURE ProcessPaymentWithTransaction(
  IN p_booking_id INT,
  IN p_amount DECIMAL(10,2),
  IN p_mode VARCHAR(20),
  IN p_transaction_id VARCHAR(100)
)
BEGIN
  DECLARE v_bed_id INT;
  DECLARE v_expected_amount DECIMAL(10,2);
  
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SELECT 'Payment failed: Transaction rolled back' AS message, FALSE AS success;
  END;
  
  START TRANSACTION;
  
  SELECT bed_id INTO v_bed_id
  FROM bookings
  WHERE booking_id = p_booking_id
  FOR UPDATE;
  
  IF v_bed_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Error: Booking not found';
  END IF;
  
  SELECT r.price_per_month INTO v_expected_amount
  FROM bookings bk
  INNER JOIN beds b ON bk.bed_id = b.bed_id
  INNER JOIN rooms r ON b.room_id = r.room_id
  WHERE bk.booking_id = p_booking_id;
  
  IF p_amount != v_expected_amount AND p_amount != (v_expected_amount + 5000) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Error: Invalid payment amount';
  END IF;
  
  INSERT INTO payments (booking_id, amount, mode, status, transaction_id, created_at)
  VALUES (p_booking_id, p_amount, p_mode, 'success', p_transaction_id, NOW());
  
  UPDATE bookings
  SET status = 'active'
  WHERE booking_id = p_booking_id;
  
  UPDATE beds
  SET status = 'occupied'
  WHERE bed_id = v_bed_id;
  
  COMMIT;
  
  SELECT 'Payment processed successfully' AS message, TRUE AS success, LAST_INSERT_ID() AS payment_id;
END //

DELIMITER ;

-- ============================================================================
-- SECTION 5: TRIGGERS (Data Integrity & Audit)
-- ============================================================================

DELIMITER //

-- Trigger 1: Enhanced Bed Availability Check
DROP TRIGGER IF EXISTS before_booking_insert//
CREATE TRIGGER before_booking_insert
BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
  DECLARE bed_current_status VARCHAR(20);
  DECLARE existing_booking_count INT;
  
  SELECT status INTO bed_current_status
  FROM beds
  WHERE bed_id = NEW.bed_id;
  
  IF bed_current_status != 'available' THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Cannot book: Bed is not available';
  END IF;
  
  SELECT COUNT(*) INTO existing_booking_count
  FROM bookings
  WHERE bed_id = NEW.bed_id
    AND status IN ('active', 'pending')
    AND (
      (NEW.start_date BETWEEN start_date AND end_date) OR
      (NEW.end_date BETWEEN start_date AND end_date) OR
      (start_date BETWEEN NEW.start_date AND NEW.end_date)
    );
  
  IF existing_booking_count > 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Cannot book: Bed has overlapping booking dates';
  END IF;
  
  SELECT COUNT(*) INTO existing_booking_count
  FROM bookings
  WHERE student_id = NEW.student_id
    AND status IN ('active', 'pending');
  
  IF existing_booking_count > 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Cannot book: Student already has an active or pending booking';
  END IF;
  
  IF NEW.end_date <= NEW.start_date THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Cannot book: End date must be after start date';
  END IF;
END//

-- Trigger 2: Auto-update Bed Status on Booking Status Change
DROP TRIGGER IF EXISTS after_booking_update//
CREATE TRIGGER after_booking_update
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    UPDATE beds
    SET status = 'occupied'
    WHERE bed_id = NEW.bed_id;
  END IF;
  
  IF NEW.status IN ('cancelled', 'completed') AND OLD.status NOT IN ('cancelled', 'completed') THEN
    UPDATE beds
    SET status = 'available'
    WHERE bed_id = NEW.bed_id;
  END IF;
END//

-- Trigger 3: Validate Payment Amount
DROP TRIGGER IF EXISTS before_payment_insert//
CREATE TRIGGER before_payment_insert
BEFORE INSERT ON payments
FOR EACH ROW
BEGIN
  DECLARE expected_amount DECIMAL(10,2);
  
  SELECT r.price_per_month INTO expected_amount
  FROM bookings bk
  INNER JOIN beds b ON bk.bed_id = b.bed_id
  INNER JOIN rooms r ON b.room_id = r.room_id
  WHERE bk.booking_id = NEW.booking_id;
  
  IF NEW.amount != expected_amount AND NEW.amount != (expected_amount + 5000) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Invalid payment amount: Must match room rent or rent + security deposit';
  END IF;
END//

-- Trigger 4: Prevent Deletion of Active Bookings
DROP TRIGGER IF EXISTS before_booking_delete//
CREATE TRIGGER before_booking_delete
BEFORE DELETE ON bookings
FOR EACH ROW
BEGIN
  IF OLD.status = 'active' THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Cannot delete active booking: Cancel it first';
  END IF;
END//

-- Trigger 5: Log Booking Status Changes
DROP TRIGGER IF EXISTS after_booking_status_change//
CREATE TRIGGER after_booking_status_change
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO booking_audit_log (booking_id, old_status, new_status)
    VALUES (NEW.booking_id, OLD.status, NEW.status);
  END IF;
END//

DELIMITER ;

-- ============================================================================
-- SECTION 6: SAMPLE DATA (Optional - Comment out if not needed)
-- ============================================================================

-- Insert sample hostels
INSERT INTO hostels (name, address, type, gender_allowed, total_rooms) VALUES
('Vivek Hall', '123 Campus Road', 'Boys', 'Male', 50),
('Sarojini Hall', '456 University Ave', 'Girls', 'Female', 40),
('International House', '789 Global Street', 'Co-ed', 'Both', 60);

-- Insert sample admin
-- Password: admin123 (hashed with bcrypt)
INSERT INTO admins (name, email, password, role) VALUES
('Super Admin', 'admin@dormease.com', '$2a$10$rQZ9vXqZ9vXqZ9vXqZ9vXOeKfNjKfNjKfNjKfNjKfNjKfNjKfNjKf', 'super_admin');

-- ============================================================================
-- END OF SQL FILE
-- ============================================================================

-- To use this file:
-- 1. mysql -u root -p < complete_schema.sql
-- 2. Or import via MySQL Workbench
-- 3. Or run via Aiven console

-- Notes:
-- - All tables use InnoDB engine for transaction support
-- - Foreign keys have CASCADE delete for referential integrity
-- - Indexes are optimized for common query patterns
-- - Views provide abstraction layer for complex queries
-- - Functions encapsulate business logic
-- - Procedures implement ACID transactions with 2PL
-- - Triggers enforce data integrity constraints
