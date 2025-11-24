import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/sql";

// GET /api/students/[id]/booking - Get current booking for a student
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;

    const query = `
      SELECT 
        bk.booking_id,
        bk.start_date,
        bk.end_date,
        bk.status AS booking_status,
        h.name AS hostel_name,
        h.type AS hostel_type,
        r.room_number,
        r.price_per_month,
        b.bed_number
      FROM bookings bk
      INNER JOIN beds b ON b.bed_id = bk.bed_id
      INNER JOIN rooms r ON r.room_id = b.room_id
      INNER JOIN hostels h ON h.hostel_id = r.hostel_id
      WHERE bk.student_id = ? AND bk.status IN ('active', 'pending')
      ORDER BY bk.created_at DESC
      LIMIT 1
    `;

    const result = await executeQuery(query, [studentId]);

    if (result.length > 0) {
      return NextResponse.json({
        success: true,
        booking: result[0],
      });
    }

    return NextResponse.json({
      success: true,
      booking: null,
    });
  } catch (error: any) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
