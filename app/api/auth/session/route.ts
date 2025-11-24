import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sessionOptions, User, SessionData } from "@/lib/session";
import { executeQuery } from "@/lib/sql";

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  if (session.user?.isLoggedIn) {
    // Fetch fresh booking status from database
    if (session.user.role === "student") {
      const bookingStatus = await executeQuery(
        "SELECT COUNT(*) as count FROM bookings WHERE student_id = ? AND status IN ('active', 'pending')",
        [session.user.id]
      );
      
      // Update the hasBooking flag with fresh data
      const hasBooking = bookingStatus[0]?.count > 0;
      
      return NextResponse.json({
        isLoggedIn: true,
        user: {
          ...session.user,
          hasBooking: hasBooking
        },
      });
    }
    
    return NextResponse.json({
      isLoggedIn: true,
      user: session.user,
    });
  }

  return NextResponse.json({
    isLoggedIn: false,
    user: null,
  });
}
