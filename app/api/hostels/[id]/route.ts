import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/sql";

// DELETE /api/hostels/[id] - Delete a hostel
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hostelId = id;

    // Delete hostel (ON DELETE CASCADE will handle rooms and beds)
    await executeQuery(
      "DELETE FROM hostels WHERE hostel_id = ?",
      [hostelId]
    );

    return NextResponse.json({
      success: true,
      message: "Hostel deleted successfully"
    });

  } catch (error: any) {
    console.error("Delete hostel error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
