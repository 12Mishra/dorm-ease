
CREATE DATABASE IF NOT EXISTS hostelhive;
USE hostelhive;

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

-- Insert sample admin (password: admin123)
INSERT INTO admins (name, email, password, role) VALUES
('Super Admin', 'admin@dormease.com', '$2a$10$rQZ9vXqZ9vXqZ9vXqZ9vXOeKfNjKfNjKfNjKfNjKfNjKfNjKfNjKf', 'super_admin');

-- Insert sample hostels
INSERT INTO hostels (name, address, type, gender_allowed, total_rooms) VALUES
('Vivek Hall', '123 Campus Road, North Wing', 'Boys', 'Male', 50),
('Sarojini Hall', '456 University Avenue, East Block', 'Girls', 'Female', 40),
('International House', '789 Global Street, Central Campus', 'Co-ed', 'Both', 60),
('Nehru Hall', '321 Heritage Lane, South Campus', 'Boys', 'Male', 45),
('Indira Hall', '654 Garden View, West Wing', 'Girls', 'Female', 35);

-- Insert sample rooms for Vivek Hall (Boys)
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(1, '101', 'Single', 1, 9500.00, FALSE, FALSE),
(1, '102', 'Single', 1, 12000.00, TRUE, TRUE),
(1, '103', 'Double', 2, 8000.00, FALSE, FALSE),
(1, '104', 'Double', 2, 10000.00, TRUE, FALSE),
(1, '105', 'Triple', 3, 7000.00, FALSE, FALSE);

-- Insert sample rooms for Sarojini Hall (Girls)
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(2, '201', 'Single', 1, 10000.00, FALSE, TRUE),
(2, '202', 'Double', 2, 8500.00, FALSE, FALSE),
(2, '203', 'Double', 2, 11000.00, TRUE, TRUE),
(2, '204', 'Triple', 3, 7500.00, FALSE, FALSE);

-- Insert sample rooms for International House (Co-ed)
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(3, '301', 'Single', 1, 11000.00, TRUE, TRUE),
(3, '302', 'Double', 2, 9000.00, FALSE, TRUE),
(3, '303', 'Triple', 3, 8000.00, FALSE, FALSE),
(3, '304', 'Quad', 4, 7000.00, FALSE, FALSE);

-- Insert sample rooms for Nehru Hall (Boys)
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(4, '401', 'Single', 1, 9000.00, FALSE, FALSE),
(4, '402', 'Double', 2, 7500.00, FALSE, FALSE),
(4, '403', 'Triple', 3, 6500.00, FALSE, FALSE);

-- Insert sample rooms for Indira Hall (Girls)
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, price_per_month, has_ac, has_attached_washroom) VALUES
(5, '501', 'Single', 1, 10500.00, TRUE, TRUE),
(5, '502', 'Double', 2, 9000.00, FALSE, TRUE),
(5, '503', 'Triple', 3, 7500.00, FALSE, FALSE);

-- Insert beds for all rooms
-- Single rooms - 1 bed each
INSERT INTO beds (room_id, bed_number, status)
SELECT room_id, 1, 'available'
FROM rooms WHERE room_type = 'Single';

-- Double rooms - 2 beds each
INSERT INTO beds (room_id, bed_number, status)
SELECT room_id, 1, 'available' FROM rooms WHERE room_type = 'Double'
UNION ALL
SELECT room_id, 2, 'available' FROM rooms WHERE room_type = 'Double';

-- Triple rooms - 3 beds each
INSERT INTO beds (room_id, bed_number, status)
SELECT room_id, 1, 'available' FROM rooms WHERE room_type = 'Triple'
UNION ALL
SELECT room_id, 2, 'available' FROM rooms WHERE room_type = 'Triple'
UNION ALL
SELECT room_id, 3, 'available' FROM rooms WHERE room_type = 'Triple';

-- Quad rooms - 4 beds each
INSERT INTO beds (room_id, bed_number, status)
SELECT room_id, 1, 'available' FROM rooms WHERE room_type = 'Quad'
UNION ALL
SELECT room_id, 2, 'available' FROM rooms WHERE room_type = 'Quad'
UNION ALL
SELECT room_id, 3, 'available' FROM rooms WHERE room_type = 'Quad'
UNION ALL
SELECT room_id, 4, 'available' FROM rooms WHERE room_type = 'Quad';

-- Insert sample students
INSERT INTO students (name, email, password, phone, gender, department, year) VALUES
('Rahul Sharma', 'rahul.sharma@example.com', '$2a$10$hashedpassword1', '9876543210', 'Male', 'Computer Science', 2),
('Priya Patel', 'priya.patel@example.com', '$2a$10$hashedpassword2', '9876543211', 'Female', 'Electronics', 3),
('Amit Kumar', 'amit.kumar@example.com', '$2a$10$hashedpassword3', '9876543212', 'Male', 'Mechanical', 1),
('Sneha Reddy', 'sneha.reddy@example.com', '$2a$10$hashedpassword4', '9876543213', 'Female', 'Civil Engineering', 2),
('Vikram Singh', 'vikram.singh@example.com', '$2a$10$hashedpassword5', '9876543214', 'Male', 'Computer Science', 4);


SELECT student_id, name, email, password, gender, department, year 
FROM students 
WHERE email = 'rahul.sharma@example.com';

-- Login - Admin
-- Used by: /api/auth/login
SELECT admin_id, name, email, password, role 
FROM admins 
WHERE email = 'admin@dormease.com';

SELECT h.*, 
       (SELECT COUNT(*) FROM rooms WHERE hostel_id = h.hostel_id) as room_count
FROM hostels h
ORDER BY name ASC;

-- Get hostels filtered by gender (for students)
-- Used by: /api/hostels GET (when logged in as student)
SELECT h.*,
       (SELECT COUNT(*) FROM rooms WHERE hostel_id = h.hostel_id) as room_count
FROM hostels h
WHERE gender_allowed = 'Male'  -- or 'Female' based on student gender
ORDER BY name ASC;

-- Create new hostel
-- Used by: /api/hostels POST
INSERT INTO hostels (name, type, gender_allowed, address, total_rooms)
VALUES ('New Hostel', 'Boys', 'Male', '123 Street', 50);

-- ============================================================================
-- 3. ROOMS API (/api/rooms/*)
-- ============================================================================

-- Get all rooms with bed availability
-- Used by: /api/rooms GET
SELECT 
  r.room_id,
  r.room_number,
  r.room_type,
  r.capacity,
  r.price_per_month,
  r.has_ac,
  r.has_attached_washroom,
  h.hostel_id,
  h.name AS hostel_name,
  h.type AS hostel_type,
  h.gender_allowed,
  COUNT(b.bed_id) AS total_beds,
  COUNT(CASE WHEN b.status = 'available' THEN 1 END) AS available_beds,
  COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) AS occupied_beds
FROM rooms r
INNER JOIN hostels h ON r.hostel_id = h.hostel_id
LEFT JOIN beds b ON b.room_id = r.room_id
GROUP BY r.room_id, r.room_number, r.room_type, r.capacity, 
         r.price_per_month, r.has_ac, r.has_attached_washroom,
         h.hostel_id, h.name, h.type, h.gender_allowed
ORDER BY r.price_per_month ASC;

-- Get rooms filtered by hostel
-- Used by: /api/rooms GET?hostel_id=1
SELECT 
  r.room_id,
  r.room_number,
  r.room_type,
  r.capacity,
  r.price_per_month,
  r.has_ac,
  r.has_attached_washroom,
  h.hostel_id,
  h.name AS hostel_name,
  h.type AS hostel_type,
  h.gender_allowed,
  COUNT(b.bed_id) AS total_beds,
  COUNT(CASE WHEN b.status = 'available' THEN 1 END) AS available_beds,
  COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) AS occupied_beds
FROM rooms r
INNER JOIN hostels h ON r.hostel_id = h.hostel_id
LEFT JOIN beds b ON b.room_id = r.room_id
WHERE r.hostel_id = 1
GROUP BY r.room_id, r.room_number, r.room_type, r.capacity, 
         r.price_per_month, r.has_ac, r.has_attached_washroom,
         h.hostel_id, h.name, h.type, h.gender_allowed
ORDER BY r.price_per_month ASC;

-- Get rooms filtered by price range
-- Used by: /api/rooms GET?min_price=5000&max_price=10000
SELECT 
  r.room_id,
  r.room_number,
  r.room_type,
  r.capacity,
  r.price_per_month,
  r.has_ac,
  r.has_attached_washroom,
  h.hostel_id,
  h.name AS hostel_name,
  h.type AS hostel_type,
  h.gender_allowed,
  COUNT(b.bed_id) AS total_beds,
  COUNT(CASE WHEN b.status = 'available' THEN 1 END) AS available_beds,
  COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) AS occupied_beds
FROM rooms r
INNER JOIN hostels h ON r.hostel_id = h.hostel_id
LEFT JOIN beds b ON b.room_id = r.room_id
WHERE r.price_per_month BETWEEN 5000 AND 10000
GROUP BY r.room_id, r.room_number, r.room_type, r.capacity, 
         r.price_per_month, r.has_ac, r.has_attached_washroom,
         h.hostel_id, h.name, h.type, h.gender_allowed
ORDER BY r.price_per_month ASC;

-- Get single room details with beds
-- Used by: /api/rooms/[id] GET
SELECT 
  r.room_id,
  r.room_number,
  r.room_type,
  r.capacity,
  r.price_per_month,
  r.has_ac,
  r.has_attached_washroom,
  h.hostel_id,
  h.name AS hostel_name,
  h.type AS hostel_type,
  h.gender_allowed,
  b.bed_id,
  b.bed_number,
  b.status AS bed_status
FROM rooms r
INNER JOIN hostels h ON r.hostel_id = h.hostel_id
LEFT JOIN beds b ON b.room_id = r.room_id
WHERE r.room_id = 1
ORDER BY b.bed_number;

-- ============================================================================
-- 4. AVAILABILITY API (/api/availability)
-- ============================================================================

-- Get all available beds (not currently booked)
-- Used by: /api/availability GET
SELECT 
  b.bed_id,
  b.bed_number,
  b.status,
  r.room_id,
  r.room_number,
  r.room_type,
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

-- ============================================================================
-- 5. BOOKINGS API (/api/bookings)
-- ============================================================================

-- Get all bookings with full details
-- Used by: /api/bookings GET
SELECT 
  bk.booking_id,
  bk.start_date,
  bk.end_date,
  bk.status AS booking_status,
  bk.created_at,
  s.student_id,
  s.name AS student_name,
  s.email AS student_email,
  s.department,
  s.year,
  h.hostel_id,
  h.name AS hostel_name,
  h.type AS hostel_type,
  r.room_id,
  r.room_number,
  r.room_type,
  r.price_per_month,
  b.bed_id,
  b.bed_number,
  b.status AS bed_status
FROM bookings bk
INNER JOIN students s ON s.student_id = bk.student_id
INNER JOIN beds b ON b.bed_id = bk.bed_id
INNER JOIN rooms r ON r.room_id = b.room_id
INNER JOIN hostels h ON h.hostel_id = r.hostel_id
ORDER BY bk.created_at DESC;

-- Get single booking by ID
-- Used by: /api/bookings GET?id=1
SELECT 
  bk.booking_id,
  bk.start_date,
  bk.end_date,
  bk.status AS booking_status,
  bk.created_at,
  s.student_id,
  s.name AS student_name,
  s.email AS student_email,
  s.department,
  s.year,
  h.hostel_id,
  h.name AS hostel_name,
  h.type AS hostel_type,
  r.room_id,
  r.room_number,
  r.room_type,
  r.price_per_month,
  b.bed_id,
  b.bed_number,
  b.status AS bed_status
FROM bookings bk
INNER JOIN students s ON s.student_id = bk.student_id
INNER JOIN beds b ON b.bed_id = bk.bed_id
INNER JOIN rooms r ON r.room_id = b.room_id
INNER JOIN hostels h ON h.hostel_id = r.hostel_id
WHERE bk.booking_id = 1;

-- Create new booking (validation queries)
-- Used by: /api/bookings POST

-- Step 1: Check if bed exists and is available
SELECT status FROM beds WHERE bed_id = 1;

-- Step 2: Check for overlapping bookings
SELECT COUNT(*) as count FROM bookings 
WHERE bed_id = 1
AND status IN ('pending', 'active')
AND (
  ('2025-01-01' BETWEEN start_date AND end_date) OR
  ('2025-06-30' BETWEEN start_date AND end_date) OR
  (start_date BETWEEN '2025-01-01' AND '2025-06-30')
);

-- Step 3: Create booking
INSERT INTO bookings (student_id, bed_id, start_date, end_date, status) 
VALUES (1, 1, '2025-01-01', '2025-06-30', 'pending');

-- Step 4: Update bed status
UPDATE beds SET status = 'occupied' WHERE bed_id = 1;

-- ============================================================================
-- 6. STUDENTS API (/api/students/*)
-- ============================================================================

-- Get all students
-- Used by: /api/students GET
SELECT student_id, name, email, department, year, created_at
FROM students
ORDER BY created_at DESC;

-- Create new student
-- Used by: /api/students POST
INSERT INTO students (name, email, password, phone, gender, department, year)
VALUES ('John Doe', 'john@example.com', 'hashed_password', '1234567890', 'Male', 'CS', 2);

-- Get student's bookings
-- Used by: /api/students/[id]/booking GET
SELECT 
  bk.booking_id,
  bk.start_date,
  bk.end_date,
  bk.status,
  h.name AS hostel_name,
  r.room_number,
  r.room_type,
  r.price_per_month,
  b.bed_number
FROM bookings bk
INNER JOIN beds b ON bk.bed_id = b.bed_id
INNER JOIN rooms r ON b.room_id = r.room_id
INNER JOIN hostels h ON r.hostel_id = h.hostel_id
WHERE bk.student_id = 1
ORDER BY bk.created_at DESC;

-- Get student's payments
-- Used by: /api/students/[id]/payments GET
SELECT 
  p.payment_id,
  p.amount,
  p.mode,
  p.status,
  p.transaction_id,
  p.created_at,
  bk.booking_id,
  bk.start_date,
  bk.end_date
FROM payments p
INNER JOIN bookings bk ON p.booking_id = bk.booking_id
WHERE bk.student_id = 1
ORDER BY p.created_at DESC;

-- Step 1: Create payment record
INSERT INTO payments (booking_id, amount, mode, status, transaction_id) 
VALUES (1, 9500.00, 'UPI', 'success', 'TXN123456');

-- Step 2: Update booking status to active
UPDATE bookings SET status = 'active' WHERE booking_id = 1;

-- Step 3: Get bed_id from booking
SELECT bed_id FROM bookings WHERE booking_id = 1;

-- Step 4: Update bed status to occupied
UPDATE beds SET status = 'occupied' WHERE bed_id = 1;

-- ============================================================================
-- 8. ADMIN STATS API (/api/admin/stats)
-- ============================================================================

-- Get hostel occupancy statistics
-- Used by: /api/admin/stats GET
SELECT 
  h.hostel_id,
  h.name AS hostel_name,
  h.type AS hostel_type,
  COUNT(DISTINCT r.room_id) AS total_rooms,
  COUNT(DISTINCT bd.bed_id) AS total_beds,
  COUNT(CASE WHEN bd.status = 'occupied' THEN 1 END) AS occupied_beds,
  COUNT(CASE WHEN bd.status = 'available' THEN 1 END) AS available_beds,
  COUNT(DISTINCT bk.booking_id) AS active_bookings,
  ROUND(
    (COUNT(CASE WHEN bd.status = 'occupied' THEN 1 END) / COUNT(DISTINCT bd.bed_id) * 100), 
    2
  ) AS occupancy_rate
FROM hostels h
LEFT JOIN rooms r ON r.hostel_id = h.hostel_id
LEFT JOIN beds bd ON bd.room_id = r.room_id
LEFT JOIN bookings bk ON bk.bed_id = bd.bed_id AND bk.status = 'active'
GROUP BY h.hostel_id, h.name, h.type
ORDER BY h.name;

-- Get revenue by hostel
-- Used by: /api/admin/stats GET
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
GROUP BY h.hostel_id, h.name
ORDER BY h.name;

-- Get overall summary statistics
-- Used by: /api/admin/stats GET
SELECT 
  COUNT(DISTINCT s.student_id) AS total_students,
  COUNT(DISTINCT bk.booking_id) AS total_bookings,
  COUNT(CASE WHEN bk.status = 'active' THEN 1 END) AS active_bookings,
  COUNT(CASE WHEN bk.status = 'pending' THEN 1 END) AS pending_bookings,
  COUNT(CASE WHEN bk.status = 'completed' THEN 1 END) AS completed_bookings,
  SUM(CASE WHEN p.status = 'success' THEN p.amount ELSE 0 END) AS total_revenue,
  AVG(CASE WHEN p.status = 'success' THEN p.amount END) AS avg_payment,
  COUNT(DISTINCT h.hostel_id) AS total_hostels,
  COUNT(DISTINCT r.room_id) AS total_rooms,
  COUNT(DISTINCT b.bed_id) AS total_beds,
  COUNT(CASE WHEN b.status = 'available' THEN 1 END) AS available_beds,
  COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) AS occupied_beds
FROM students s
LEFT JOIN bookings bk ON bk.student_id = s.student_id
LEFT JOIN payments p ON p.booking_id = bk.booking_id
LEFT JOIN beds b ON b.bed_id = bk.bed_id
LEFT JOIN rooms r ON r.room_id = b.room_id
LEFT JOIN hostels h ON h.hostel_id = r.hostel_id;

-- Get recent bookings
-- Used by: /api/admin/stats GET
SELECT 
  bk.booking_id,
  s.name AS student_name,
  h.name AS hostel_name,
  r.room_number,
  b.bed_number,
  bk.start_date,
  bk.end_date,
  bk.status,
  bk.created_at
FROM bookings bk
INNER JOIN students s ON s.student_id = bk.student_id
INNER JOIN beds b ON b.bed_id = bk.bed_id
INNER JOIN rooms r ON r.room_id = b.room_id
INNER JOIN hostels h ON h.hostel_id = r.hostel_id
ORDER BY bk.created_at DESC
LIMIT 10;

-- ============================================================================
-- 9. ADMIN STUDENTS API (/api/admin/students)
-- ============================================================================

-- Get all students (admin view)
-- Used by: /api/admin/students GET
SELECT 
  s.student_id,
  s.name,
  s.email,
  s.phone,
  s.gender,
  s.department,
  s.year,
  s.created_at,
  COUNT(bk.booking_id) AS total_bookings,
  MAX(CASE WHEN bk.status IN ('active', 'pending') THEN 1 ELSE 0 END) AS has_active_booking
FROM students s
LEFT JOIN bookings bk ON bk.student_id = s.student_id
GROUP BY s.student_id, s.name, s.email, s.phone, s.gender, s.department, s.year, s.created_at
ORDER BY s.created_at DESC;

-- ============================================================================
-- TESTING QUERIES
-- ============================================================================
-- Use these queries to test the database after setup

-- Test 1: Check all hostels with room counts
SELECT h.name, h.type, h.gender_allowed, COUNT(r.room_id) as room_count
FROM hostels h
LEFT JOIN rooms r ON h.hostel_id = r.hostel_id
GROUP BY h.hostel_id, h.name, h.type, h.gender_allowed;

-- Test 2: Check bed availability
SELECT 
  h.name AS hostel,
  COUNT(b.bed_id) AS total_beds,
  COUNT(CASE WHEN b.status = 'available' THEN 1 END) AS available,
  COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) AS occupied
FROM beds b
JOIN rooms r ON b.room_id = r.room_id
JOIN hostels h ON r.hostel_id = h.hostel_id
GROUP BY h.hostel_id, h.name;

-- Test 3: Check sample students
SELECT student_id, name, email, gender, department, year FROM students;

-- Test 4: Check admin account
SELECT admin_id, name, email, role FROM admins;

