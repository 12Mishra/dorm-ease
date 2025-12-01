import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/sql";

// PATCH /api/bookings/[id] - Update booking status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = id;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status is required" },
        { status: 400 }
      );
    }

    if (status === 'active') {
      // 1. Check if payment exists
      const payments = await executeQuery(
        "SELECT payment_id FROM payments WHERE booking_id = ? AND status = 'success'",
        [bookingId]
      );

      // 2. If no payment, create one with room price
      if (payments.length === 0) {
        // Get room price
        const priceResult = await executeQuery(
          `SELECT r.price_per_semester 
           FROM bookings bk
           JOIN beds bd ON bk.bed_id = bd.bed_id
           JOIN rooms r ON bd.room_id = r.room_id
           WHERE bk.booking_id = ?`,
          [bookingId]
        );

        if (priceResult.length > 0) {
          const amount = priceResult[0].price_per_semester;
          const transactionId = "ADMIN-" + crypto.randomUUID();
          
          await executeQuery(
            "INSERT INTO payments (booking_id, amount, mode, status, transaction_id) VALUES (?, ?, 'Admin Manual', 'success', ?)",
            [bookingId, amount, transactionId]
          );
        }
      }

      // 3. Update booking status
      await executeQuery(
        "UPDATE bookings SET status = 'active' WHERE booking_id = ?",
        [bookingId]
      );

      // 4. Get bed_id
      const booking = await executeQuery(
        "SELECT bed_id FROM bookings WHERE booking_id = ?",
        [bookingId]
      );

      if (booking.length > 0) {
        // 5. Update bed status to occupied
        await executeQuery(
          "UPDATE beds SET status = 'occupied' WHERE bed_id = ?",
          [booking[0].bed_id]
        );
      }

      return NextResponse.json({
        success: true,
        message: "Booking activated successfully"
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid status update" },
      { status: 400 }
    );

  } catch (error: any) {
    console.error("Update booking error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
