import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/sql";

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
      const payments = await executeQuery(
        "SELECT payment_id FROM payments WHERE booking_id = ? AND status = 'success'",
        [bookingId]
      );

      if (payments.length === 0) {
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

      await executeQuery(
        "UPDATE bookings SET status = 'active' WHERE booking_id = ?",
        [bookingId]
      );

      const booking = await executeQuery(
        "SELECT bed_id FROM bookings WHERE booking_id = ?",
        [bookingId]
      );

      if (booking.length > 0) {
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
