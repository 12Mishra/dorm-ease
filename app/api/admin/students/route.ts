import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/sql";
import { hashPassword } from "@/lib/auth";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.user?.isLoggedIn || session.user.role !== "admin" && session.user.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin access required" },
        { status: 401 }
      );
    }

    const { name, email, department, year, phone, gender } = await request.json();

    if (!name || !email || !department || !year || !phone || !gender) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(email);

    const query = `
      INSERT INTO students (name, email, department, year, phone, gender, password)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await executeQuery(query, [
      name,
      email,
      department,
      year,
      phone,
      gender,
      hashedPassword,
    ]);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Add student error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add student" },
      { status: 500 }
    );
  }
}
