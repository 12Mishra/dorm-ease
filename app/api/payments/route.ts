import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/sql";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { booking_id, amount, payment_method } = body;

    if (!booking_id || !amount) {
      return NextResponse.json(
        { success: false, error: "Booking ID and amount are required" },
        { status: 400 }
      );
    }

    const transactionId = crypto.randomUUID();

    await executeQuery(
      "INSERT INTO payments (booking_id, amount, mode, status, transaction_id) VALUES (?, ?, ?, 'success', ?)",
      [booking_id, amount, payment_method || "Online", transactionId]
    );

    await executeQuery(
      "UPDATE bookings SET status = 'active' WHERE booking_id = ?",
      [booking_id]
    );


    const booking = await executeQuery(
      "SELECT bed_id FROM bookings WHERE booking_id = ?",
      [booking_id]
    );

    if (booking.length > 0) {
      await executeQuery(
        "UPDATE beds SET status = 'occupied' WHERE bed_id = ?",
        [booking[0].bed_id]
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Payment successful",
      transaction_id: transactionId 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Payment Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
