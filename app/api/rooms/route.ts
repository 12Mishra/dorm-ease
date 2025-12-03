import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/sql";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const user = session.user;

    const { searchParams } = new URL(request.url);
    const hostelId = searchParams.get("hostel_id");
    const roomType = searchParams.get("room_type");
    const minPrice = searchParams.get("min_price") || "0";
    const maxPrice = searchParams.get("max_price") || "999999";

    let genderFilter = "1=1"; 
    let yearFilter = "1=1";
    let genderParam = null;
    let yearParam: number | null = null;

    if (user && user.isLoggedIn && user.role === "student") {
      // Gender Filter
      if (user.gender === "Male") {
        genderFilter = "h.gender_allowed = ?";
        genderParam = "Male";
      } else if (user.gender === "Female") {
        genderFilter = "h.gender_allowed = ?";
        genderParam = "Female";
      }

      if (user.year) {
        yearFilter = "h.allowed_year = ?";
        yearParam = user.year;
      }
    }
    
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
        h.allowed_year,
        COUNT(b.bed_id) AS total_beds,
        COUNT(CASE WHEN b.status = 'available' THEN 1 END) AS available_beds,
        COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) AS occupied_beds
      FROM rooms r
      INNER JOIN hostels h ON r.hostel_id = h.hostel_id
      LEFT JOIN beds b ON b.room_id = r.room_id
      WHERE 
        (r.hostel_id = ? OR ? IS NULL)
        AND (r.room_type = ? OR ? IS NULL)
        AND (r.price_per_month BETWEEN ? AND ?)
        AND (${genderFilter})
        AND (${yearFilter})
      GROUP BY r.room_id, r.room_number, r.room_type, r.capacity, 
               r.price_per_month, r.has_ac, r.has_attached_washroom,
               h.hostel_id, h.name, h.type, h.gender_allowed, h.allowed_year
      ORDER BY r.price_per_month ASC
    `;
    
    const params: any[] = [
      hostelId, hostelId,
      roomType, roomType,
      minPrice, maxPrice
    ];

    if (genderParam) params.push(genderParam);
    if (yearParam) params.push(yearParam);
    
    const rooms = await executeQuery(query, params);
    
    return NextResponse.json({ success: true, rooms });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
