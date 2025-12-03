"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AddStudentForm from "@/components/AddStudentForm";
import AddHostelForm from "@/components/AddHostelForm";
import NavBar from "@/components/NavBar";

interface Summary {
  total_students: number;
  total_bookings: number;
  active_bookings: number;
  total_revenue: string;
  available_beds: number;
  occupied_beds: number;
}

interface Occupancy {
  hostel_name: string;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  occupancy_rate: number;
  hostel_id: number;
}

interface Revenue {
  hostel_name: string;
  total_bookings: number;
  total_revenue: string;
}

interface Booking {
  booking_id: number;
  student_name: string;
  hostel_name: string;
  room_number: string;
  bed_number: string;
  start_date: string;
  status: string;
  created_at: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<{
    summary: Summary | null;
    occupancy: Occupancy[];
    revenue: Revenue[];
    recent_bookings: Booking[];
  }>({
    summary: null,
    occupancy: [],
    revenue: [],
    recent_bookings: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateBooking = async (bookingId: number) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      const data = await response.json();
      if (data.success) {
        fetchStats(); 
      } else {
        alert("Failed to activate booking: " + data.error);
      }
    } catch (error) {
      console.error("Error activating booking:", error);
      alert("Error activating booking");
    }
  };

  const handleDeleteHostel = async (hostelId: number) => {
    if (!confirm("Are you sure you want to delete this hostel? This action cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch(`/api/hostels/${hostelId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        fetchStats(); 
      } else {
        alert("Failed to delete hostel: " + data.error);
      }
    } catch (error) {
      console.error("Error deleting hostel:", error);
      alert("Error deleting hostel");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-black">Admin Dashboard</h1>

        {stats.summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500 mb-2">Total Students</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.summary.total_students}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500 mb-2">Active Bookings</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.summary.active_bookings}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500 mb-2">Available Beds</p>
              <p className="text-3xl font-bold text-purple-600">
                {stats.summary.available_beds}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500 mb-2">Total Revenue</p>
              <p className="text-3xl font-bold text-orange-600">
                ₹{parseInt(stats.summary.total_revenue || "0").toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <AddStudentForm />
          <AddHostelForm />
        </div>

        <div className="bg-white rounded-lg shadow mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-black">Recent Bookings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Booking ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Hostel</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Room</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Bed</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Start Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_bookings.map((booking) => (
                  <tr key={booking.booking_id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-black">{booking.booking_id}</td>
                    <td className="py-3 px-4 text-black">{booking.student_name}</td>
                    <td className="py-3 px-4 text-black">{booking.hostel_name}</td>
                    <td className="py-3 px-4 text-black">{booking.room_number}</td>
                    <td className="py-3 px-4 text-black">{booking.bed_number}</td>
                    <td className="py-3 px-4 text-black">
                      {new Date(booking.start_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${booking.status === "active"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {booking.status === "pending" && (
                        <button
                          onClick={() => handleActivateBooking(booking.booking_id)}
                          className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                        >
                          Mark Active
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-black">Hostel Occupancy</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Hostel</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Total Beds</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Occupied</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Rate</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.occupancy.map((occ, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-black">{occ.hostel_name}</td>
                      <td className="py-3 px-4 text-black">{occ.total_beds}</td>
                      <td className="py-3 px-4 text-black">{occ.occupied_beds}</td>
                      <td className="py-3 px-4">
                        <span className="text-blue-600 font-semibold">
                          {parseFloat(occ.occupancy_rate?.toString() || "0").toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDeleteHostel(occ.hostel_id)}
                          className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-black">Revenue by Hostel</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Hostel</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Bookings</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.revenue.map((rev, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-black">{rev.hostel_name}</td>
                      <td className="py-3 px-4 text-black">{rev.total_bookings}</td>
                      <td className="py-3 px-4 text-green-600 font-semibold">
                        ₹{parseInt(rev.total_revenue?.toString() || "0").toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}