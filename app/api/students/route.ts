import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const students = await prisma.students.findMany({
      orderBy: {
        created_at: "desc",
      },
    });
    
    return NextResponse.json({ success: true, students });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, department, year } = body;
    
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and email are required" },
        { status: 400 }
      );
    }
    
    const student = await prisma.students.create({
      data: {
        name,
        email,
        department,
        year: year ? parseInt(year) : null,
      },
    });
    
    return NextResponse.json({ success: true, student }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Email already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
