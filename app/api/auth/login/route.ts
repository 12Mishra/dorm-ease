import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sessionOptions, SessionData, User } from "@/lib/session";
import { findUserByEmail, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // For migration: if password matches email (plain text), it's a first-time login
    // In a real app, we would force a password change here.
    // For this requirement ("default password... as the email"), we check:
    // 1. Is it a hashed password? (starts with $2a$ or similar)
    // 2. Or is it the plain text email?
    
    let isValid = false;
    
    // Check if stored password is a bcrypt hash
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      isValid = await verifyPassword(password, user.password);
    } else {
      // Fallback for legacy/plain text (shouldn't happen with our migration script, but good for safety)
      isValid = password === user.password;
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "student" | "admin" | "super_admin",
      gender: user.gender,
      year: user.year,
      department: user.department,
      phone: user.phone,
      hasBooking: Boolean(user.has_booking),
      isLoggedIn: true,
    };
    await session.save();

    return NextResponse.json({
      success: true,
      user: session.user,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
