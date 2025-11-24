import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/sql";

// GET /api/students/[id]/payments - Get payment history for a student
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;

    const query = `
      SELECT 
        p.payment_id,
        p.booking_id,
        p.amount,
        p.mode,
        p.status,
        p.transaction_id,
        p.created_at,
        h.name AS hostel_name
      FROM payments p
      INNER JOIN bookings bk ON bk.booking_id = p.booking_id
      INNER JOIN beds b ON b.bed_id = bk.bed_id
      INNER JOIN rooms r ON r.room_id = b.room_id
      INNER JOIN hostels h ON h.hostel_id = r.hostel_id
      WHERE bk.student_id = ?
      ORDER BY p.created_at DESC
    `;

    const payments = await executeQuery(query, [studentId]);

    return NextResponse.json({
      success: true,
      payments: payments,
    });
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
