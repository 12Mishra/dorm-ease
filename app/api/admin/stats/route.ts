import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/sql";

// GET /api/admin/stats - Dashboard statistics using views and aggregates
export async function GET() {
  try {
    // Hostel occupancy statistics
    const occupancyQuery = `
      SELECT 
        h.hostel_id,
        h.name AS hostel_name,
        h.type AS hostel_type,
        COUNT(DISTINCT r.room_id) AS total_rooms,
        COUNT(DISTINCT bd.bed_id) AS total_beds,
        COUNT(CASE WHEN bd.status = 'occupied' THEN 1 END) AS occupied_beds,
        COUNT(CASE WHEN bd.status = 'available' THEN 1 END) AS available_beds,
        COUNT(DISTINCT bk.booking_id) AS active_bookings,
        ROUND(
          (COUNT(CASE WHEN bd.status = 'occupied' THEN 1 END) / COUNT(DISTINCT bd.bed_id) * 100), 
          2
        ) AS occupancy_rate
      FROM hostels h
      LEFT JOIN rooms r ON r.hostel_id = h.hostel_id
      LEFT JOIN beds bd ON bd.room_id = r.room_id
      LEFT JOIN bookings bk ON bk.bed_id = bd.bed_id AND bk.status = 'active'
      GROUP BY h.hostel_id, h.name, h.type
      ORDER BY h.name
    `;
    
    const occupancy: any = await executeQuery(occupancyQuery);
    
    // Revenue by hostel
    const revenueQuery = `
      SELECT 
        h.hostel_id,
        h.name AS hostel_name,
        COUNT(DISTINCT bk.booking_id) AS total_bookings,
        SUM(p.amount) AS total_revenue,
        AVG(p.amount) AS avg_payment,
        COUNT(DISTINCT p.payment_id) AS successful_payments
      FROM hostels h
      JOIN rooms r ON r.hostel_id = h.hostel_id
      JOIN beds bd ON bd.room_id = r.room_id
      JOIN bookings bk ON bk.bed_id = bd.bed_id
      JOIN payments p ON p.booking_id = bk.booking_id
      WHERE p.status = 'success'
      GROUP BY h.hostel_id, h.name
      ORDER BY h.name
    `;
    
    const revenue: any = await executeQuery(revenueQuery);
    
    // Additional aggregate queries for summary stats
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT s.student_id) AS total_students,
        COUNT(DISTINCT bk.booking_id) AS total_bookings,
        COUNT(CASE WHEN bk.status = 'active' THEN 1 END) AS active_bookings,
        COUNT(CASE WHEN bk.status = 'pending' THEN 1 END) AS pending_bookings,
        COUNT(CASE WHEN bk.status = 'completed' THEN 1 END) AS completed_bookings,
        SUM(CASE WHEN p.status = 'success' THEN p.amount ELSE 0 END) AS total_revenue,
        AVG(CASE WHEN p.status = 'success' THEN p.amount END) AS avg_payment,
        COUNT(DISTINCT h.hostel_id) AS total_hostels,
        COUNT(DISTINCT r.room_id) AS total_rooms,
        COUNT(DISTINCT b.bed_id) AS total_beds,
        COUNT(CASE WHEN b.status = 'available' THEN 1 END) AS available_beds,
        COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) AS occupied_beds
      FROM students s
      LEFT JOIN bookings bk ON bk.student_id = s.student_id
      LEFT JOIN payments p ON p.booking_id = bk.booking_id
      LEFT JOIN beds b ON b.bed_id = bk.bed_id
      LEFT JOIN rooms r ON r.room_id = b.room_id
      LEFT JOIN hostels h ON h.hostel_id = r.hostel_id
    `;
    
    const summaryResult: any = await executeQuery(summaryQuery);
    const summary = summaryResult[0];
    
    // Recent bookings
    const recentBookingsQuery = `
      SELECT 
        bk.booking_id,
        s.name AS student_name,
        h.name AS hostel_name,
        r.room_number,
        b.bed_number,
        bk.start_date,
        bk.end_date,
        bk.status,
        bk.created_at
      FROM bookings bk
      INNER JOIN students s ON s.student_id = bk.student_id
      INNER JOIN beds b ON b.bed_id = bk.bed_id
      INNER JOIN rooms r ON r.room_id = b.room_id
      INNER JOIN hostels h ON h.hostel_id = r.hostel_id
      ORDER BY bk.created_at DESC
      LIMIT 10
    `;
    
    const recentBookings = await executeQuery(recentBookingsQuery);
    
    return NextResponse.json({
      success: true,
      data: {
        summary,
        occupancy,
        revenue,
        recent_bookings: recentBookings,
      },
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
