"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import {
  CheckCircle2,
  CreditCard,
  Building2,
  Calendar,
  User,
  Wallet,
} from "lucide-react";

interface BookingDetails {
  booking_id: number;
  student_name: string;
  hostel_name: string;
  room_number: string;
  bed_number: string;
  price_per_month: string;
  start_date: string;
  end_date: string;
  status: string;
}

const SECURITY_DEPOSIT = 5000;

const calculateSemesterMonths = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 1;
  }

  const yearDiff = endDate.getFullYear() - startDate.getFullYear();
  const monthDiff = endDate.getMonth() - startDate.getMonth();
  let totalMonths = yearDiff * 12 + monthDiff;

  if (endDate.getDate() >= startDate.getDate()) {
    totalMonths += 1;
  }

  return Math.max(totalMonths, 1);
};

export default function PaymentPage() {
  const params = useParams();
  const bookingId = params.bookingId;
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      // We need an API to get single booking details.
      // For now, we might need to filter from the list or create a new endpoint.
      // Let's assume we can fetch it or use the existing bookings API with a filter?
      // Actually, let's create a specific endpoint or use the list one and filter client side for now if needed,
      // but better to have a specific one.
      // I'll try to fetch from /api/bookings?id={bookingId} if I update the API,
      // or just fetch all and find (not efficient but works for small scale).
      // Let's assume I'll update the GET /api/bookings to support ?id= param.

      const response = await fetch(`/api/bookings?id=${bookingId}`);
      const data = await response.json();

      if (data.success && data.bookings && data.bookings.length > 0) {
        setBooking(data.bookings[0]);
      } else {
        // Handle not found
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!booking) return;

    const pricePerMonth = Number.parseFloat(booking.price_per_month);
    const semesterMonths = calculateSemesterMonths(
      booking.start_date,
      booking.end_date
    );
    const semesterCharge = pricePerMonth * semesterMonths;
    const totalPayable = semesterCharge + SECURITY_DEPOSIT;

    setProcessing(true);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking_id: booking.booking_id,
          amount: totalPayable,
          payment_method: "Online", // Mock
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentStatus({
          success: true,
          message: "Payment successful! Your booking is confirmed.",
        });
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        setPaymentStatus({
          success: false,
          message: data.error || "Payment failed. Please try again.",
        });
      }
    } catch (error) {
      setPaymentStatus({
        success: false,
        message: "An error occurred during payment.",
      });
    } finally {
      setProcessing(false);
    }
  };

  // compute memoized values here so hooks order remains stable across renders
  const pricePerMonth = useMemo(() => {
    if (!booking) return 0;
    return Number.parseFloat(booking.price_per_month);
  }, [booking?.price_per_month]);

  const semesterMonths = useMemo(() => {
    if (!booking) return 1;
    return calculateSemesterMonths(booking.start_date, booking.end_date);
  }, [booking?.start_date, booking?.end_date]);

  const semesterCharge = useMemo(
    () => pricePerMonth * semesterMonths,
    [pricePerMonth, semesterMonths]
  );

  const totalPayable = useMemo(
    () => semesterCharge + SECURITY_DEPOSIT,
    [semesterCharge]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Booking not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-indigo-600 px-8 py-6 text-white">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              Complete Payment
            </h1>
            <p className="text-indigo-100 mt-1">
              Secure your booking for {booking.hostel_name}
            </p>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                  Booking Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Building2 className="w-5 h-5 text-indigo-500" />
                    <div>
                      <p className="font-medium">{booking.hostel_name}</p>
                      <p className="text-sm text-gray-500">
                        Room {booking.room_number}, Bed {booking.bed_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <User className="w-5 h-5 text-indigo-500" />
                    <p>{booking.student_name}</p>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    <p className="text-sm">
                      {new Date(booking.start_date).toLocaleDateString()} -{" "}
                      {new Date(booking.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                  Payment Summary
                </h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Room Charges (Monthly)</span>
                  <span className="font-medium">
                    ₹{pricePerMonth.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Semester Duration</span>
                  <span className="font-medium">
                    {semesterMonths} {semesterMonths > 1 ? "months" : "month"}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">Tuition for Semester</span>
                  <span className="font-medium">
                    ₹{semesterCharge.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">Security Deposit</span>
                  <span className="font-medium">
                    ₹
                    {SECURITY_DEPOSIT.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">
                    Total Payable
                  </span>
                  <span className="text-2xl font-bold text-indigo-600">
                    ₹{totalPayable.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {paymentStatus && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                  paymentStatus.success
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {paymentStatus.success ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Wallet className="w-5 h-5" />
                )}
                <p>{paymentStatus.message}</p>
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={processing || (paymentStatus?.success ?? false)}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  Pay Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
