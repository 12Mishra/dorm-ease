import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/sql";

// GET /api/rooms/[id] - Get room details with beds
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Raw SQL query with multiple JOINs
    // Demonstrates: INNER JOIN, LEFT JOIN, complex multi-table query
    const query = `
      SELECT 
        r.room_id,
        r.room_number,
        r.room_type,
        r.capacity,
        r.price_per_month,
        r.has_ac,
        r.has_attached_washroom,
        h.hostel_id,
        h.name AS hostel_name,
        h.type AS hostel_type,
        h.gender_allowed,
        b.bed_id,
        b.bed_number,
        b.status AS bed_status
      FROM rooms r
      INNER JOIN hostels h ON r.hostel_id = h.hostel_id
      LEFT JOIN beds b ON b.room_id = r.room_id
      WHERE r.room_id = ?
      ORDER BY b.bed_number
    `;
    
    const results: any = await executeQuery(query, [id]);
    
    if (!results || results.length === 0) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }
    
    // Transform flat result into nested structure
    const room = {
      room_id: results[0].room_id,
      room_number: results[0].room_number,
      room_type: results[0].room_type,
      capacity: results[0].capacity,
      price_per_month: results[0].price_per_month,
      has_ac: Boolean(results[0].has_ac),
      has_attached_washroom: Boolean(results[0].has_attached_washroom),
      hostel: {
        hostel_id: results[0].hostel_id,
        hostel_name: results[0].hostel_name,
        hostel_type: results[0].hostel_type,
        gender_allowed: results[0].gender_allowed,
      },
      beds: results
        .filter((row: any) => row.bed_id !== null)
        .map((row: any) => ({
          bed_id: row.bed_id,
          bed_number: row.bed_number,
          bed_status: row.bed_status,
        })),
    };
    
    return NextResponse.json({ success: true, room });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
