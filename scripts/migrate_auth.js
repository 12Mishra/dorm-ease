const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

async function migrate() {
    console.log('Starting migration...');

    const connection = await mysql.createConnection({
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT || '3306'),
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        ssl: process.env.DATABASE_SSL_MODE === 'REQUIRED' ? { rejectUnauthorized: false } : undefined
    });

    try {
        // 1. Add columns to students table
        console.log('Adding columns to students table...');
        try {
            await connection.query(`
        ALTER TABLE students
        ADD COLUMN password VARCHAR(255),
        ADD COLUMN phone VARCHAR(15),
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
      `);
            console.log('Columns added.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('Columns already exist, skipping.');
            } else {
                throw e;
            }
        }

        // 2. Create admins table
        console.log('Creating admins table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        admin_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('Admins table created.');

        // 3. Update existing students with hashed email as password
        console.log('Updating student passwords...');
        const [students] = await connection.query('SELECT student_id, email FROM students WHERE password IS NULL');

        for (const student of students) {
            // Requirement: "default password for each student as the email only"
            // We will hash the email and store it.
            const hashedPassword = await bcrypt.hash(student.email, 10);
            await connection.query('UPDATE students SET password = ? WHERE student_id = ?', [hashedPassword, student.student_id]);
            console.log(`Updated password for student ${student.email}`);
        }

        // 4. Create default admin
        console.log('Creating default admin...');
        const adminEmail = 'admin@dormease.com';
        const [admins] = await connection.query('SELECT * FROM admins WHERE email = ?', [adminEmail]);

        if (admins.length === 0) {
            const adminPassword = await bcrypt.hash('admin123', 10);
            await connection.query('INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['System Admin', adminEmail, adminPassword, 'super_admin']);
            console.log('Default admin created: admin@dormease.com / admin123');
        } else {
            console.log('Default admin already exists.');
        }

        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
