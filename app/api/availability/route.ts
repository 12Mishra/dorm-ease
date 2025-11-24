import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/sql";

// GET /api/availability - Get available beds with subquery
export async function GET() {
  try {
    // Raw SQL query with subquery and NOT IN
    // Demonstrates: Subquery, NOT IN, multi-table JOIN
    const query = `
      SELECT 
        b.bed_id,
        b.bed_number,
        b.status,
        r.room_id,
        r.room_number,
        r.room_type,
        r.price_per_month,
        r.has_ac,
        r.has_attached_washroom,
        h.hostel_id,
        h.name AS hostel_name,
        h.type AS hostel_type
      FROM beds b
      INNER JOIN rooms r ON b.room_id = r.room_id
      INNER JOIN hostels h ON r.hostel_id = h.hostel_id
      WHERE b.status = 'available'
        AND b.bed_id NOT IN (
          SELECT bed_id 
          FROM bookings 
          WHERE status IN ('pending', 'active')
            AND CURDATE() BETWEEN start_date AND end_date
        )
      ORDER BY h.name, r.room_number, b.bed_number
    `;
    
    const availableBeds = await executeQuery(query);
    
    return NextResponse.json({ 
      success: true, 
      available_beds: availableBeds,
      count: Array.isArray(availableBeds) ? availableBeds.length : 0
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
