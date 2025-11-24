"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
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

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  hasBooking?: boolean;
};

export default function RoomDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();

  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedBed, setSelectedBed] = useState<number | null>(null);
  const [bookingData, setBookingData] = useState({
    start_date: "",
    end_date: "",
  });
  const [bookingStatus, setBookingStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  useEffect(() => {
    params.then(({ id }) => {
      setRoomId(id);
    });
  }, [params]);

  useEffect(() => {
    if (roomId) {
      fetchRoomDetails();
      fetchSession();
    }
  }, [roomId]);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.isLoggedIn) {
        console.log("User is logged in", data.user);
        setUser(data.user);
      }
    } catch (error) {
      console.error("Session fetch error:", error);
    }
  };

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rooms/${roomId}`);
      const data = await response.json();
      if (data.success) {
        setRoom(data.room);
      }
    } catch (error) {
      console.error("Error fetching room details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookBed = (bedId: number) => {
    if (!user) {
      router.push("/login?redirect=/rooms/" + roomId);
      return;
    }
    setSelectedBed(bedId);
    setShowBookingDialog(true);
    setBookingStatus({ type: null, message: "" });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setBookingStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: user.id,
          bed_id: selectedBed,
          start_date: bookingData.start_date,
          end_date: bookingData.end_date,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBookingStatus({
          type: "success",
          message: "Booking created! Redirecting to payment...",
        });
        setTimeout(() => {
          router.push(`/payments/${data.booking_id}`);
        }, 1500);
      } else {
        setBookingStatus({
          type: "error",
          message: data.error || "Failed to create booking",
        });
      }
    } catch (error: any) {
      setBookingStatus({
        type: "error",
        message: error.message || "An error occurred",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading room details...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Room not found</p>
          <Link href="/hostels" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Back to Hostels
          </Link>
        </div>
      </div>
    );
  }

  const availableBeds = room.beds.filter(bed => bed.bed_status === "available").length;

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

        {/* Room Details Card */}
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
              <p className="text-lg font-semibold text-gray-900">{room.room_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                <Users className="w-3 h-3" /> Capacity
              </p>
              <p className="text-lg font-semibold text-gray-900">{room.capacity} beds</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                <Wind className="w-3 h-3" /> Air Conditioning
              </p>
              <p className="text-lg font-semibold text-gray-900">{room.has_ac ? "Yes" : "No"}</p>
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
              <p className="text-base font-medium text-gray-900">{room.hostel.hostel_type} Hostel</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Gender Allowed</p>
              <p className="text-base font-medium text-gray-900">{room.hostel.gender_allowed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Available Beds</p>
              <p className="text-base font-semibold text-green-600">{availableBeds} of {room.capacity}</p>
            </div>
          </div>
        </div>

        {/* Beds Availability */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Bed Availability</h2>
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
                    <p className="font-semibold text-gray-900">Bed {bed.bed_number}</p>
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
                {bed.bed_status === "available" && (
                  user ? (
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
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={bookingData.start_date}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, start_date: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={bookingData.end_date}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, end_date: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {bookingStatus.type && (
                <div
                  className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${bookingStatus.type === "success"
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
                  onClick={() => setShowBookingDialog(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow hover:shadow-lg"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}