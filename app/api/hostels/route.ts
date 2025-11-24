import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";

// GET /api/hostels - List hostels with Gender and Year Filtering
export async function GET() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const user = session.user;

    // Default: No filter (Admin sees all, or public sees all if you want)
    let whereClause: any = {};

    // FILTER LOGIC:
    // Only apply filters if the user is logged in AND is a student.
    // Admins will skip this block and see everything.
    if (user && user.isLoggedIn && user.role === "student") {
      const filters: any = {};

      // Gender Filter
      if (user.gender === "Male") {
        filters.gender_allowed = "Male";
      } else if (user.gender === "Female") {
        filters.gender_allowed = "Female";
      }

      // Year Filter
      if (user.year) {
        filters.allowed_year = user.year;
      }

      whereClause = filters;
    }

    const hostels = await prisma.hostels.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            rooms: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ success: true, hostels });
  } catch (error: any) {
    console.error("Hostel Fetch Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/hostels - Create new hostel
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, gender_allowed, address } = body;

    if (!name || !type || !gender_allowed) {
      return NextResponse.json(
        { success: false, error: "Name, type, and gender_allowed are required" },
        { status: 400 }
      );
    }

    const hostel = await prisma.hostels.create({
      data: {
        name,
        type,
        gender_allowed, // Ensure your DB stores "Male" or "Female" exactly
        address,
      },
    });

    return NextResponse.json({ success: true, hostel }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}