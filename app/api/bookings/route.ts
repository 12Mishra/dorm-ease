import { NextResponse } from "next/server";
import { callProcedure, executeQuery } from "@/lib/sql";

// POST /api/bookings - Create booking using stored procedure
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { student_id, bed_id, start_date, end_date, semester } = body;
    
    let finalStartDate = start_date;
    let finalEndDate = end_date;
    
    // If semester is provided, convert it to dates
    if (semester) {
      const { getSemesterDates } = await import('@/lib/semester');
      const dates = getSemesterDates(semester);
      
      if (!dates) {
        return NextResponse.json(
          { success: false, error: "Invalid semester format" },
          { status: 400 }
        );
      }
      
      finalStartDate = dates.start_date;
      finalEndDate = dates.end_date;
    }
    
    if (!student_id || !bed_id || !finalStartDate || !finalEndDate) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }
    
    // Check if student already has an active or pending booking
    const existingBookings = await executeQuery(
      "SELECT COUNT(*) as count FROM bookings WHERE student_id = ? AND status IN ('active', 'pending')",
      [student_id]
    );

    if (existingBookings[0].count > 0) {
      return NextResponse.json(
        { success: false, error: "You already have an active or pending booking." },
        { status: 400 }
      );
    }
    // Call stored procedure AllocateBed
    // Demonstrates: Stored procedure, Transaction, Trigger execution
    await callProcedure("AllocateBed", [
      student_id,
      bed_id,
      finalStartDate,
      finalEndDate,
    ]);
    
    // Get the ID of the newly created booking
    // Since callProcedure doesn't return the ID directly for this procedure, 
    // we fetch the latest booking for this student/bed.
    const newBooking = await executeQuery(
      "SELECT booking_id FROM bookings WHERE student_id = ? AND bed_id = ? ORDER BY created_at DESC LIMIT 1",
      [student_id, bed_id]
    );

    return NextResponse.json({ 
      success: true, 
      message: "Booking created successfully",
      booking_id: newBooking[0]?.booking_id
    }, { status: 201 });
  } catch (error: any) {
    // Trigger will throw error if bed already booked
    console.error("Booking error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.sqlMessage || error.message || "Failed to create booking"
      },
      { status: 400 }
    );
  }
}

// GET /api/bookings - List all bookings with details
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("id");

    // Raw SQL with 4-table JOIN
    // Demonstrates: Complex multi-table INNER JOIN
    let query = `
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
    `;
    
    const params: any[] = [];

    if (bookingId) {
      query += " WHERE bk.booking_id = ?";
      params.push(bookingId);
    }

    query += " ORDER BY bk.created_at DESC";
    
    const bookings = await executeQuery(query, params);
    
    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
