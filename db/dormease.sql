-- ====================================================================
-- DormEase/HostelHive - Complete Database Schema
-- Hostel Room Management & Booking System
-- ====================================================================

-- Drop database if exists and create fresh
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS hostelhive;
CREATE DATABASE hostelhive;
USE hostelhive;

-- ====================================================================
-- TABLE DEFINITIONS
-- ====================================================================

-- Students table
CREATE TABLE students (
  student_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  department VARCHAR(50),
  year INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hostels table
CREATE TABLE hostels (
  hostel_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('Boys', 'Girls', 'Co-ed') NOT NULL,
  gender_allowed ENUM('Male', 'Female', 'Any') NOT NULL,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Rooms table
CREATE TABLE rooms (
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
  UNIQUE KEY unique_room (hostel_id, room_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Beds table
CREATE TABLE beds (
  bed_id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  bed_number VARCHAR(10) NOT NULL,
  status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
  UNIQUE KEY unique_bed (room_id, bed_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bookings table
CREATE TABLE bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  bed_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('pending', 'active', 'cancelled', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (bed_id) REFERENCES beds(bed_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payments table
CREATE TABLE payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  mode ENUM('Online', 'UPI', 'Card', 'Cash') DEFAULT 'Online',
  status ENUM('initiated', 'success', 'failed') DEFAULT 'initiated',
  transaction_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================

CREATE INDEX idx_hostel_id ON rooms(hostel_id);
CREATE INDEX idx_room_id ON beds(room_id);
CREATE INDEX idx_student_id ON bookings(student_id);
CREATE INDEX idx_bed_id ON bookings(bed_id);
CREATE INDEX idx_booking_id ON payments(booking_id);
CREATE INDEX idx_booking_status ON bookings(status);
CREATE INDEX idx_bed_status ON beds(status);
CREATE INDEX idx_payment_status ON payments(status);

-- ====================================================================
-- STORED PROCEDURES
-- ====================================================================

-- Procedure: AllocateBed
-- Purpose: Atomically allocate a bed to a student with transaction safety
DELIMITER //
CREATE PROCEDURE AllocateBed(
  IN p_student_id INT,
  IN p_bed_id INT,
  IN p_start_date DATE,
  IN p_end_date DATE
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- Insert booking record
  INSERT INTO bookings(student_id, bed_id, start_date, end_date, status)
  VALUES (p_student_id, p_bed_id, p_start_date, p_end_date, 'pending');
  
  -- Update bed status to occupied
  UPDATE beds
  SET status = 'occupied'
  WHERE bed_id = p_bed_id;
  
  COMMIT;
END//
DELIMITER ;

-- ====================================================================
-- TRIGGERS
-- ====================================================================

-- Trigger: prevent_double_booking
-- Purpose: Prevent booking a bed that's already occupied for overlapping dates
DELIMITER //
CREATE TRIGGER prevent_double_booking
BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
  DECLARE existing_booking INT;
  
  -- Check for overlapping bookings on the same bed
  SELECT COUNT(*) INTO existing_booking
  FROM bookings
  WHERE bed_id = NEW.bed_id 
    AND status IN ('pending', 'active')
    AND (
      (NEW.start_date BETWEEN start_date AND end_date)
      OR (NEW.end_date BETWEEN start_date AND end_date)
      OR (start_date BETWEEN NEW.start_date AND NEW.end_date)
    );
  
  IF existing_booking > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Bed already booked for the selected dates';
  END IF;
END//
DELIMITER ;

-- Trigger: update_booking_on_payment
-- Purpose: Automatically update booking status when payment is successful
DELIMITER //
CREATE TRIGGER update_booking_on_payment
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
  IF NEW.status = 'success' AND OLD.status != 'success' THEN
    UPDATE bookings
    SET status = 'active'
    WHERE booking_id = NEW.booking_id AND status = 'pending';
  END IF;
END//
DELIMITER ;

-- ====================================================================
-- VIEWS
-- ====================================================================

-- View: view_hostel_occupancy
-- Purpose: Show current occupancy statistics per hostel
CREATE VIEW view_hostel_occupancy AS
SELECT 
  h.hostel_id,
  h.name AS hostel_name,
  h.type AS hostel_type,
  COUNT(DISTINCT r.room_id) AS total_rooms,
  COUNT(DISTINCT bd.bed_id) AS total_beds,
  COUNT(CASE WHEN bd.status = 'occupied' THEN 1 END) AS occupied_beds,
  COUNT(CASE WHEN bd.status = 'available' THEN 1 END) AS available_beds,
  COUNT(CASE WHEN bd.status = 'maintenance' THEN 1 END) AS maintenance_beds,
  COUNT(DISTINCT bk.booking_id) AS active_bookings,
  ROUND(
    (COUNT(CASE WHEN bd.status = 'occupied' THEN 1 END) / COUNT(DISTINCT bd.bed_id) * 100), 
    2
  ) AS occupancy_rate
FROM hostels h
LEFT JOIN rooms r ON r.hostel_id = h.hostel_id
LEFT JOIN beds bd ON bd.room_id = r.room_id
LEFT JOIN bookings bk ON bk.bed_id = bd.bed_id AND bk.status = 'active'
GROUP BY h.hostel_id, h.name, h.type;

-- View: view_revenue_by_hostel
-- Purpose: Calculate total revenue per hostel from successful payments
CREATE VIEW view_revenue_by_hostel AS
SELECT 
  h.hostel_id,
  h.name AS hostel_name,
  COUNT(DISTINCT bk.booking_id) AS total_bookings,
  SUM(p.amount) AS total_revenue,
  AVG(p.amount) AS avg_payment,
  COUNT(DISTINCT p.payment_id) AS successful_payments
FROM hostels h
JOIN rooms r ON r.hostel_id = h.hostel_id
JOIN beds bd ON bd.room_id = r.room_id
JOIN bookings bk ON bk.bed_id = bd.bed_id
JOIN payments p ON p.booking_id = bk.booking_id
WHERE p.status = 'success'
GROUP BY h.hostel_id, h.name;

-- View: view_available_beds
-- Purpose: List all currently available beds with details
CREATE VIEW view_available_beds AS
SELECT 
  b.bed_id,
  b.bed_number,
  b.status,
  r.room_id,
  r.room_number,
  r.room_type,
  r.capacity,
  r.price_per_month,
  r.has_ac,
  r.has_attached_washroom,
  h.hostel_id,
  h.name AS hostel_name,
  h.type AS hostel_type
FROM beds b
INNER JOIN rooms r ON b.room_id = r.room_id
INNER JOIN hostels h ON r.hostel_id = h.hostel_id
WHERE b.status = 'available'
  AND b.bed_id NOT IN (
    SELECT bed_id 
    FROM bookings 
    WHERE status IN ('pending', 'active')
      AND CURDATE() BETWEEN start_date AND end_date
  )
ORDER BY h.name, r.room_number, b.bed_number;

-- ====================================================================
-- SAMPLE DATA - Based on Patiala Campus Hostel Fee Structure
-- ====================================================================

-- Insert Hostels (17 total from the uploaded data)
INSERT INTO hostels (name, type, gender_allowed, address) VALUES
('Agira Hall (A)', 'Boys', 'Male', 'Patiala Campus'),
('Amritam Hall (B)', 'Boys', 'Male', 'Patiala Campus'),
('Prithvi Hall (C)', 'Boys', 'Male', 'Patiala Campus'),
('Neeram Hall (D)', 'Girls', 'Female', 'Patiala Campus'),
('Hostel PRPG', 'Girls', 'Female', 'Patiala Campus'),
('Vasishtha Hall - E', 'Boys', 'Male', 'Patiala Campus'),
('Vasudha Hall - G', 'Girls', 'Female', 'Patiala Campus'),
('Vyan Hall (H)', 'Boys', 'Male', 'Patiala Campus'),
('Ira Hall (I)', 'Girls', 'Female', 'Patiala Campus'),
('Tejas Hall (J)', 'Boys', 'Male', 'Patiala Campus'),
('Ambaram Hall (K)', 'Boys', 'Male', 'Patiala Campus'),
('Viyat Hall (L)', 'Boys', 'Male', 'Patiala Campus'),
('Anantam Hall (M)', 'Co-ed', 'Any', 'Patiala Campus'),
('Ananta Hall (N)', 'Co-ed', 'Any', 'Patiala Campus'),
('Vyom Hall (O)', 'Boys', 'Male', 'Patiala Campus'),
('Hostel PG', 'Co-ed', 'Any', 'Patiala Campus'),
('Vahni Hall (Q)', 'Boys', 'Male', 'Patiala Campus');

-- Insert Rooms (Based on actual fee structure - converting semester to monthly)
-- Agira Hall
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(1, '101', 'Single', 1, 9416.67, FALSE, FALSE),  -- 56500/6 months
(1, '102', 'Single', 1, 9416.67, TRUE, FALSE);   -- 56500/6 months

-- Amritam Hall
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(2, '201', 'Double', 2, 8916.67, FALSE, FALSE),  -- 53500/6 months
(2, '202', 'Double', 2, 8916.67, FALSE, FALSE);

-- Prithvi Hall
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(3, '301', 'Double', 2, 8916.67, FALSE, FALSE),
(3, '302', 'Triple', 3, 7833.33, FALSE, FALSE);  -- 47000/6 months

-- Neeram Hall
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(4, '401', 'Double', 2, 9666.67, FALSE, TRUE),   -- 58000/6 months
(4, '402', 'Double', 2, 9666.67, FALSE, TRUE);

-- Hostel PRPG
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(5, '501', 'Triple', 3, 6250, FALSE, FALSE);     -- 37500/6 months

-- Vasishtha Hall
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(6, '601', 'Single', 1, 9416.67, FALSE, FALSE),
(6, '602', 'Double', 2, 8916.67, FALSE, FALSE),
(6, '603', 'Triple', 3, 7833.33, FALSE, FALSE),
(6, '604', 'Quad', 4, 7016.67, FALSE, FALSE);   -- 42100/6 months

-- Vasudha Hall
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(7, '701', 'Single', 1, 9416.67, FALSE, FALSE),
(7, '702', 'Quad', 4, 7016.67, FALSE, FALSE);

-- Vyan Hall
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(8, '801', 'Double', 2, 7250, FALSE, FALSE),     -- 43500/6 months
(8, '802', 'Double', 2, 8916.67, FALSE, FALSE),
(8, '803', 'Triple', 3, 5433.33, FALSE, FALSE);  -- 32600/6 months

-- Ira Hall
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(9, '901', 'Single', 1, 9416.67, TRUE, FALSE),
(9, '902', 'Double', 2, 8916.67, TRUE, FALSE),
(9, '903', 'Triple', 3, 6250, FALSE, FALSE),
(9, '904', 'Triple', 3, 7833.33, FALSE, FALSE);

-- Tejas Hall
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(10, '1001', 'Single', 1, 8166.67, FALSE, FALSE), -- 49000/6 months
(10, '1002', 'Quad', 4, 7016.67, FALSE, FALSE);

-- Ambaram Hall
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(11, '1101', 'Double', 2, 7250, FALSE, FALSE),
(11, '1102', 'Double', 2, 8916.67, FALSE, FALSE);

-- Viyat Hall
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(12, '1201', 'Double', 2, 8916.67, FALSE, FALSE);

-- Anantam Hall
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(13, '1301', 'Single', 1, 10833.33, FALSE, TRUE),  -- 65000/6 months
(13, '1302', 'Single', 1, 12500, TRUE, TRUE),      -- 75000/6 months
(13, '1303', 'Double', 2, 9666.67, FALSE, TRUE),
(13, '1304', 'Double', 2, 9666.67, TRUE, TRUE);

-- Ananta Hall
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(14, '1401', 'Single', 1, 10833.33, FALSE, TRUE),
(14, '1402', 'Single', 1, 12500, TRUE, TRUE),
(14, '1403', 'Double', 2, 9666.67, FALSE, TRUE);

-- Vyom Hall
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(15, '1501', 'Double', 2, 9666.67, FALSE, TRUE);

-- Hostel PG
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(16, '1601', 'Single', 1, 8166.67, FALSE, FALSE),
(16, '1602', 'Double', 2, 7250, FALSE, FALSE);

-- Vahni Hall
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(17, '1701', 'Double', 2, 9666.67, FALSE, TRUE);

-- Insert Beds (create beds based on room capacity)
-- Single rooms - 1 bed each
INSERT INTO beds (room_id, bed_number, status)
SELECT room_id, 'A', 'available'
FROM rooms WHERE room_type = 'Single';

-- Double rooms - 2 beds each
INSERT INTO beds (room_id, bed_number, status)
SELECT room_id, 'A', 'available' FROM rooms WHERE room_type = 'Double'
UNION ALL
SELECT room_id, 'B', 'available' FROM rooms WHERE room_type = 'Double';

-- Triple rooms - 3 beds each
INSERT INTO beds (room_id, bed_number, status)
SELECT room_id, 'A', 'available' FROM rooms WHERE room_type = 'Triple'
UNION ALL
SELECT room_id, 'B', 'available' FROM rooms WHERE room_type = 'Triple'
UNION ALL
SELECT room_id, 'C', 'available' FROM rooms WHERE room_type = 'Triple';

-- Quad rooms - 4 beds each
INSERT INTO beds (room_id, bed_number, status)
SELECT room_id, 'A', 'available' FROM rooms WHERE room_type = 'Quad'
UNION ALL
SELECT room_id, 'B', 'available' FROM rooms WHERE room_type = 'Quad'
UNION ALL
SELECT room_id, 'C', 'available' FROM rooms WHERE room_type = 'Quad'
UNION ALL
SELECT room_id, 'D', 'available' FROM rooms WHERE room_type = 'Quad';

-- Insert Sample Students
INSERT INTO students (name, email, department, year) VALUES
('Rahul Sharma', 'rahul.sharma@example.com', 'Computer Science', 2),
('Priya Patel', 'priya.patel@example.com', 'Electronics', 3),
('Amit Kumar', 'amit.kumar@example.com', 'Mechanical', 1),
('Sneha Reddy', 'sneha.reddy@example.com', 'Civil Engineering', 2),
('Vikram Singh', 'vikram.singh@example.com', 'Computer Science', 4),
('Anjali Desai', 'anjali.desai@example.com', 'Chemical Engineering', 3),
('Arjun Gupta', 'arjun.gupta@example.com', 'Electrical', 2),
('Pooja Nair', 'pooja.nair@example.com', 'Information Technology', 1),
('Rohan Mehta', 'rohan.mehta@example.com', 'Computer Science', 3),
('Kavya Iyer', 'kavya.iyer@example.com', 'Electronics', 2),
('Aditya Joshi', 'aditya.joshi@example.com', 'Mechanical', 4),
('Divya Krishnan', 'divya.krishnan@example.com', 'Civil Engineering', 1),
('Siddharth Roy', 'siddharth.roy@example.com', 'Computer Science', 2),
('Neha Verma', 'neha.verma@example.com', 'Chemical Engineering', 3),
('Karan Malhotra', 'karan.malhotra@example.com', 'Electrical', 1);

-- Insert Sample Bookings using the stored procedure
-- Note: These are sample bookings for demonstration
-- CALL AllocateBed(1, (SELECT bed_id FROM beds LIMIT 1), '2025-01-01', '2025-06-30');
-- CALL AllocateBed(2, (SELECT bed_id FROM beds LIMIT 1 OFFSET 1), '2025-01-01', '2025-06-30');
-- CALL AllocateBed(3, (SELECT bed_id FROM beds LIMIT 1 OFFSET 2), '2025-01-01', '2025-06-30');
-- CALL AllocateBed(4, (SELECT bed_id FROM beds LIMIT 1 OFFSET 3), '2025-01-01', '2025-06-30');
-- CALL AllocateBed(5, (SELECT bed_id FROM beds LIMIT 1 OFFSET 4), '2025-01-01', '2025-06-30');


-- Insert Sample Payments for the bookings
INSERT INTO payments (booking_id, amount, mode, status, transaction_id) VALUES
(1, 56500, 'UPI', 'success', 'TXN001'),
(2, 58000, 'Card', 'success', 'TXN002'),
(3, 47000, 'Online', 'success', 'TXN003'),
(4, 58000, 'UPI', 'success', 'TXN004'),
(5, 37500, 'Card', 'success', 'TXN005');

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- VERIFICATION QUERIES
-- ====================================================================

-- Test Views
-- SELECT * FROM view_hostel_occupancy;
-- SELECT * FROM view_revenue_by_hostel;
-- SELECT * FROM view_available_beds LIMIT 10;

-- Test Joins
-- SELECT 
--   bk.booking_id,
--   s.name AS student_name,
--   h.name AS hostel_name,
--   r.room_number,
--   b.bed_number,
--   bk.start_date,
--   bk.end_date,
--   bk.status
-- FROM bookings bk
-- INNER JOIN students s ON s.student_id = bk.student_id
-- INNER JOIN beds b ON b.bed_id = bk.bed_id
-- INNER JOIN rooms r ON r.room_id = b.room_id
-- INNER JOIN hostels h ON h.hostel_id = r.hostel_id;

-- ====================================================================
-- END OF SCHEMA
-- ====================================================================
