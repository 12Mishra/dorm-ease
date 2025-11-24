import { executeQuery } from "@/lib/sql";
import bcrypt from "bcryptjs";

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Check if user exists (student or admin)
export async function findUserByEmail(email: string) {
  // Check students first
  const students = await executeQuery(
    `SELECT 
      student_id as id, 
      name, 
      email, 
      password, 
      gender, 
      year,
      department,
      phone,
      'student' as role,
      (SELECT COUNT(*) FROM bookings WHERE student_id = students.student_id AND status IN ('active', 'pending')) > 0 as has_booking
    FROM students WHERE email = ?`,
    [email]
  );

  if (students.length > 0) {
    return students[0];
  }

  // Check admins
  const admins = await executeQuery(
    "SELECT admin_id as id, name, email, password, role FROM admins WHERE email = ?",
    [email]
  );

  if (admins.length > 0) {
    return admins[0];
  }

  return null;
}
