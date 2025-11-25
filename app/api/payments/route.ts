import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/sql";

// POST /api/payments - Process payment
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

    // Check if payment already exists for this booking
    const existingPayment = await executeQuery(
      "SELECT payment_id FROM payments WHERE booking_id = ? AND status = 'success'",
      [booking_id]
    );

    if (existingPayment.length > 0) {
      return NextResponse.json(
        { success: false, error: "Payment already completed for this booking. You cannot pay twice for the same booking." },
        { status: 400 }
      );
    }

    // Start Transaction (Simulated with sequential queries for now, ideally use a transaction block if supported by lib)
    // 1. Create Payment Record
    await executeQuery(
      "INSERT INTO payments (booking_id, amount, mode, status, transaction_id) VALUES (?, ?, ?, 'success', ?)",
      [booking_id, amount, payment_method || "Online", transactionId]
    );

    // 2. Update Booking Status to 'active'
    await executeQuery(
      "UPDATE bookings SET status = 'active' WHERE booking_id = ?",
      [booking_id]
    );

    // 3. Update Bed Status to 'occupied' (Ensure it's occupied)
    // First get the bed_id from booking
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
