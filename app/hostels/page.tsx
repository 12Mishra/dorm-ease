"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Bed, Droplets, Wind, Users } from "lucide-react";

interface Room {
  room_id: number;
  room_number: string;
  room_type: string;
  capacity: number;
  price_per_month: string;
  has_ac: number;
  has_attached_washroom: number;
  hostel_name: string;
  hostel_type: string;
  total_beds: number;
  available_beds: number;
  occupied_beds: number;
  gender_allowed: string;
}

interface Hostel {
  hostel_id: number;
  name: string;
  type: string;
  _count?: {
    rooms: number;
  };
}

interface User {
  name: string;
  role: string;
  isLoggedIn: boolean;
}

export default function HostelsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    hostel_id: "",
    room_type: "",
    min_price: "",
    max_price: "",
  });
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    fetchHostels();
  }, []);
  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.isLoggedIn) {
        console.log("data: ", data)
        setUser(data.user);
      }
    } catch (error) {
      console.error("Session fetch error:", error);
    }
  };
  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    fetchHostels();
  }, [user]);

  useEffect(() => {
    fetchRooms();
  }, [filters, user]);

  const fetchHostels = async () => {
    try {
      const response = await fetch("/api/hostels");
      const data = await response.json();
      if (data.success) {
        console.log("data: ", data)
        setHostels(data.hostels);

        if (filters.hostel_id) {
          const isAllowed = data.hostels.find((h: any) => h.hostel_id.toString() === filters.hostel_id);
          if (!isAllowed) {
            setFilters(prev => ({ ...prev, hostel_id: "" }));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching hostels:", error);
    }
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.hostel_id) params.append("hostel_id", filters.hostel_id);
      if (filters.room_type) params.append("room_type", filters.room_type);
      if (filters.min_price) params.append("min_price", filters.min_price);
      if (filters.max_price) params.append("max_price", filters.max_price);

      const response = await fetch(`/api/rooms?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        console.log("data: ", data)
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Building2 className="w-8 h-8 text-indigo-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                DormEase
              </span>
            </Link>
            <div className="flex gap-4">
              <Link href="/hostels" className="px-4 py-2 text-indigo-600 font-medium">
                Hostels
              </Link>
              {
                !user ? (
                  <Link href="/admin" className="px-4 py-2 text-gray-700 hover:text-indigo-600 transition-colors font-medium">
                    Admin
                  </Link>
                ) : null
              }
            </div>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24 border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Filters</h2>

              {/* Hostel Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-black mb-2">
                  Hostel
                </label>
                <select
                  value={filters.hostel_id}
                  onChange={(e) =>
                    setFilters({ ...filters, hostel_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-black"
                >
                  <option value="">All Hostels</option>
                  {hostels.map((hostel) => (
                    <option key={hostel.hostel_id} value={hostel.hostel_id}>
                      {hostel.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room Type Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Type
                </label>
                <select
                  value={filters.room_type}
                  onChange={(e) =>
                    setFilters({ ...filters, room_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-black"
                >
                  <option value="">All Types</option>
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Triple">Triple</option>
                  <option value="Quad">Quad</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range (₹/month)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.min_price}
                    onChange={(e) =>
                      setFilters({ ...filters, min_price: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.max_price}
                    onChange={(e) =>
                      setFilters({ ...filters, max_price: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                onClick={() =>
                  setFilters({ hostel_id: "", room_type: "", min_price: "", max_price: "" })
                }
                className="w-full px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Clear Filters
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Available Rooms ({rooms.length})</h1>
              <p className="text-gray-600">Find your perfect hostel accommodation</p>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading rooms...</p>
              </div>
            ) : rooms.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
                <p className="text-gray-600 text-lg">No rooms found matching your criteria.</p>
                <button
                  onClick={() => setFilters({ hostel_id: "", room_type: "", min_price: "", max_price: "" })}
                  className="mt-4 px-6 py-2 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                  <div
                    key={room.room_id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden border border-gray-100 group"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {room.hostel_name}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3" />
                            Room {room.room_number}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                          {room.room_type}
                        </span>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">{room.capacity} beds capacity</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Bed className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium text-green-600">
                            {room.available_beds} available
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 flex-wrap gap-2">
                          {room.has_ac ? (
                            <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-xs font-medium">
                              <Wind className="w-3 h-3" /> AC
                            </span>
                          ) : null}
                          {room.has_attached_washroom ? (
                            <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-xs font-medium">
                              <Droplets className="w-3 h-3" /> Attached Bath
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">
                            ₹{parseFloat(room.price_per_month).toLocaleString("en-IN")}
                          </p>
                          <p className="text-xs text-gray-500">per month</p>
                        </div>
                        <Link
                          href={`/rooms/${room.room_id}`}
                          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow hover:shadow-lg"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}