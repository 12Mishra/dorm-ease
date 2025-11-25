"use client";

import { useState, useEffect, useCallback } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import { generateSemesters, type SemesterLabel } from "@/lib/semester";
import {
  ArrowLeft,
  Building2,
  Users,
  Wind,
  Droplets,
  Bed,
  CheckCircle2,
  XCircle,
  Calendar,
  LogIn,
} from "lucide-react";
import type { User } from "@/lib/session";

type Room = {
  room_id: number;
  room_number: string;
  room_type: string;
  capacity: number;
  price_per_month: string;
  has_ac: boolean;
  has_attached_washroom: boolean;
  hostel: {
    hostel_id: number;
    hostel_name: string;
    hostel_type: string;
    gender_allowed: string;
  };
  beds: Array<{
    bed_id: number;
    bed_number: number;
    bed_status: string;
  }>;
};

type BookingStatus = {
  type: "success" | "error" | null;
  message: string;
};

type RoomResponse = {
  success: boolean;
  room?: Room;
  error?: string;
};

export default function RoomDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const roomId = params.id;

  const [room, setRoom] = useState<Room | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedBed, setSelectedBed] = useState<number | null>(null);
  const [bookingData, setBookingData] = useState({ semester: "" });
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>({
    type: null,
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to fetch session");
      }

      const data = await res.json();
      if (data?.isLoggedIn) {
        setUser(data.user as User);
      } else {
        setUser(null);
      }
    } catch (sessionError) {
      console.error("Session fetch error:", sessionError);
    }
  }, []);

  const fetchRoomDetails = useCallback(async () => {
    if (!roomId) {
      setError("Missing room identifier.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/rooms/${roomId}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch room details.");
      }

      const data: RoomResponse = await response.json();
      if (!data.success || !data.room) {
        throw new Error(data.error ?? "Room not found.");
      }

      setRoom(data.room);
    } catch (fetchError) {
      setRoom(null);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load room details."
      );
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    fetchRoomDetails();
  }, [fetchRoomDetails]);

  const handleBookBed = (bedId: number) => {
    setSelectedBed(bedId);
    setBookingData({ semester: "" });
    setBookingStatus({ type: null, message: "" });
    setShowBookingDialog(true);
  };

  const handleDialogClose = () => {
    setShowBookingDialog(false);
    setSelectedBed(null);
    setBookingData({ semester: "" });
    setBookingStatus({ type: null, message: "" });
  };

  const handleBookingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || user.role !== "student") {
      setBookingStatus({
        type: "error",
        message: "Only students can book a bed.",
      });
      return;
    }

    if (!selectedBed) {
      setBookingStatus({
        type: "error",
        message: "Please select a bed to continue.",
      });
      return;
    }

    if (!bookingData.semester) {
      setBookingStatus({
        type: "error",
        message: "Select a semester before confirming.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setBookingStatus({ type: null, message: "" });

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: user.id,
          bed_id: selectedBed,
          semester: bookingData.semester,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to create booking.");
      }

      setBookingStatus({
        type: "success",
        message: data.message ?? "Bed booked successfully.",
      });

      setUser((prev) => (prev ? { ...prev, hasBooking: true } : prev));

      // If the API returned a booking_id, navigate to the payment page for that booking.
      const bookingId = data.booking_id ?? data.booking?.booking_id;

      // brief pause to show the success message
      await new Promise((resolve) => setTimeout(resolve, 900));

      handleDialogClose();

      if (bookingId) {
        // Navigate to payment page so user can complete semester payment
        await router.push(`/payments/${bookingId}`);
      } else {
        // Fallback: refresh room data and UI
        await fetchRoomDetails();
        router.refresh();
      }
    } catch (submissionError) {
      setBookingStatus({
        type: "error",
        message:
          submissionError instanceof Error
            ? submissionError.message
            : "Failed to create booking.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <NavBar />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium">
              Loading room details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <NavBar />
        <div className="flex items-center justify-center py-24 px-4">
          <div className="max-w-md text-center bg-white/80 backdrop-blur rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Unable to load room
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={fetchRoomDetails}
                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/hostels"
                className="px-6 py-2 border border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Back to Hostels
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <NavBar />
        <div className="flex items-center justify-center py-24 px-4">
          <div className="max-w-md text-center bg-white/80 backdrop-blur rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Room not found
            </h2>
            <p className="text-gray-600 mb-6">
              The room you are looking for does not exist.
            </p>
            <Link
              href="/hostels"
              className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Hostels
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const availableBeds = room.beds.filter(
    (bed) => bed.bed_status === "available"
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <NavBar />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link
          href="/hostels"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Rooms
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {room.hostel.hostel_name}
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Room {room.room_number}
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                ₹{parseFloat(room.price_per_month).toLocaleString("en-IN")}
              </p>
              <p className="text-sm text-gray-500 mt-1">per month</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-t border-b border-gray-100">
            <div>
              <p className="text-sm text-gray-500 mb-1">Room Type</p>
              <p className="text-lg font-semibold text-gray-900">
                {room.room_type}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                <Users className="w-3 h-3" /> Capacity
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {room.capacity} beds
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                <Wind className="w-3 h-3" /> Air Conditioning
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {room.has_ac ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                <Droplets className="w-3 h-3" /> Attached Bath
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {room.has_attached_washroom ? "Yes" : "No"}
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Hostel Type</p>
              <p className="text-base font-medium text-gray-900">
                {room.hostel.hostel_type} Hostel
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Gender Allowed</p>
              <p className="text-base font-medium text-gray-900">
                {room.hostel.gender_allowed}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Available Beds</p>
              <p className="text-base font-semibold text-green-600">
                {availableBeds} of {room.capacity}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Bed Availability
            </h2>
            {!user && (
              <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Login to book a bed
              </div>
            )}
          </div>

          <div className="grid gap-4">
            {room.beds.map((bed) => (
              <div
                key={bed.bed_id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Bed className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Bed {bed.bed_number}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {bed.bed_status === "available" ? (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3 h-3" />
                          Available
                        </span>
                      ) : bed.bed_status === "occupied" ? (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          <XCircle className="w-3 h-3" />
                          Occupied
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                          Reserved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {bed.bed_status === "available" &&
                  (user ? (
                    user.hasBooking ? (
                      <button
                        disabled
                        className="px-6 py-2 bg-gray-300 text-gray-500 text-sm font-semibold rounded-lg cursor-not-allowed"
                      >
                        Already Booked
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBookBed(bed.bed_id)}
                        className="px-6 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow hover:shadow-lg"
                      >
                        Book Bed
                      </button>
                    )
                  ) : (
                    <Link
                      href={`/login?redirect=/rooms/${roomId}`}
                      className="px-6 py-2 border border-indigo-600 text-indigo-600 text-sm font-semibold rounded-lg hover:bg-indigo-50 transition-all flex items-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      Login to Book
                    </Link>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showBookingDialog && user && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Book Bed</h3>
            </div>

            <form onSubmit={handleBookingSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                  {user.name} ({user.email})
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester
                </label>
                <select
                  required
                  value={bookingData.semester}
                  onChange={(event) =>
                    setBookingData({
                      ...bookingData,
                      semester: event.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  <option value="">Select a semester</option>
                  {generateSemesters().map((semester: SemesterLabel) => (
                    <option key={semester} value={semester}>
                      {semester}
                    </option>
                  ))}
                </select>
              </div>

              {bookingStatus.type && (
                <div
                  className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                    bookingStatus.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {bookingStatus.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm font-medium">{bookingStatus.message}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDialogClose}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
