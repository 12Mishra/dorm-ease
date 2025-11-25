import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/sql";

// POST /api/bookings - Create booking using stored procedure
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { student_id, bed_id, start_date, end_date } = body;
    
    if (!student_id || !bed_id || !start_date || !end_date) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }
    
    
    // Validate dates
    if (new Date(end_date) <= new Date(start_date)) {
      return NextResponse.json(
        { success: false, error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Check if bed exists and is available
    const bedCheck = await executeQuery(
      "SELECT status FROM beds WHERE bed_id = ?",
      [bed_id]
    );

    if (bedCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: "Bed not found" },
        { status: 404 }
      );
    }

    if (bedCheck[0].status !== 'available') {
      return NextResponse.json(
        { success: false, error: "Bed is not available" },
        { status: 400 }
      );
    }

    // Check for overlapping bookings
    const overlappingBookings = await executeQuery(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE bed_id = ? 
       AND status IN ('pending', 'active')
       AND (
         (? BETWEEN start_date AND end_date) OR
         (? BETWEEN start_date AND end_date) OR
         (start_date BETWEEN ? AND ?)
       )`,
      [bed_id, start_date, end_date, start_date, end_date]
    );

    if (overlappingBookings[0].count > 0) {
      return NextResponse.json(
        { success: false, error: "Bed is already booked for the selected dates" },
        { status: 400 }
      );
    }

    // Create booking
    const bookingResult = await executeQuery(
      "INSERT INTO bookings (student_id, bed_id, start_date, end_date, status) VALUES (?, ?, ?, ?, 'pending')",
      [student_id, bed_id, start_date, end_date]
    );

    const bookingId = (bookingResult as any).insertId;

    // Update bed status to occupied
    await executeQuery(
      "UPDATE beds SET status = 'occupied' WHERE bed_id = ?",
      [bed_id]
    );

    return NextResponse.json({ 
      success: true, 
      message: "Booking created successfully",
      booking_id: bookingId
    }, { status: 201 });
  } catch (error: any) {
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
