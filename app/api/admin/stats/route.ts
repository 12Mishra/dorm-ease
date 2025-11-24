import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/sql";

// GET /api/admin/stats - Dashboard statistics using views and aggregates
export async function GET() {
  try {
    // Query pre-built views
    // Demonstrates: Database VIEWS, Aggregate functions, GROUP BY
    
    // View: view_hostel_occupancy
    const occupancy: any = await executeQuery(
      "SELECT * FROM view_hostel_occupancy ORDER BY hostel_name"
    );
    
    // View: view_revenue_by_hostel
    const revenue: any = await executeQuery(
      "SELECT * FROM view_revenue_by_hostel ORDER BY hostel_name"
    );
    
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
