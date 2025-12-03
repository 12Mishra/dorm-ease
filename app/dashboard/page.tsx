"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import {
    Building2,
    Bed,
    Calendar,
    CreditCard,
    User,
    Mail,
    Phone,
    GraduationCap,
    Download,
    MapPin,
    DollarSign,
    CheckCircle2,
    Clock,
    XCircle,
} from "lucide-react";

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    gender?: string;
    year?: number;
    department?: string;
    phone?: string;
}

interface Booking {
    booking_id: number;
    hostel_name: string;
    room_number: string;
    bed_number: string;
    start_date: string;
    end_date: string;
    booking_status: string;
    price_per_month: string;
    hostel_type: string;
}

interface Payment {
    payment_id: number;
    booking_id: number;
    amount: string;
    mode: string;
    status: string;
    transaction_id: string;
    created_at: string;
    hostel_name: string;
}

export default function StudentDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [booking, setBooking] = useState<Booking | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const sessionRes = await fetch("/api/auth/session");
            const sessionData = await sessionRes.json();

            if (!sessionData.isLoggedIn || sessionData.user.role !== "student") {
                router.push("/login");
                return;
            }

            setUser(sessionData.user);

            const bookingRes = await fetch(`/api/students/${sessionData.user.id}/booking`);
            const bookingData = await bookingRes.json();
            if (bookingData.success && bookingData.booking) {
                setBooking(bookingData.booking);
            }

            const paymentsRes = await fetch(`/api/students/${sessionData.user.id}/payments`);
            const paymentsData = await paymentsRes.json();
            if (paymentsData.success) {
                setPayments(paymentsData.payments);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const downloadReceipt = async (paymentId: number) => {
        alert(`Downloading receipt for payment #${paymentId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
                    <p className="text-gray-600 mt-1">Welcome back, {user.name}!</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Current Booking</h2>
                                    <p className="text-sm text-gray-500">Your active accommodation</p>
                                </div>
                            </div>

                            {booking ? (
                                <div className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="flex items-start gap-3">
                                            <Building2 className="w-5 h-5 text-indigo-500 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-gray-500">Hostel</p>
                                                <p className="font-semibold text-gray-900">{booking.hostel_name}</p>
                                                <p className="text-xs text-gray-500">{booking.hostel_type} Hostel</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <Bed className="w-5 h-5 text-indigo-500 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-gray-500">Room & Bed</p>
                                                <p className="font-semibold text-gray-900">
                                                    Room {booking.room_number}, Bed {booking.bed_number}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <Calendar className="w-5 h-5 text-indigo-500 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-gray-500">Duration</p>
                                                <p className="font-semibold text-gray-900">
                                                    {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <DollarSign className="w-5 h-5 text-indigo-500 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-gray-500">Monthly Rent</p>
                                                <p className="font-semibold text-gray-900">
                                                    ₹{parseFloat(booking.price_per_month).toLocaleString("en-IN")}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">Status:</span>
                                            {booking.booking_status === "active" ? (
                                                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Active
                                                </span>
                                            ) : booking.booking_status === "pending" ? (
                                                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                                                    <Clock className="w-3 h-3" />
                                                    Pending
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                                    {booking.booking_status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Bed className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 mb-4">No active booking found</p>
                                    <button
                                        onClick={() => router.push("/hostels")}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        Browse Hostels
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <CreditCard className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
                                    <p className="text-sm text-gray-500">All your transactions</p>
                                </div>
                            </div>

                            {payments.length > 0 ? (
                                <div className="space-y-3">
                                    {payments.map((payment) => (
                                        <div
                                            key={payment.payment_id}
                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                    <CreditCard className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        ₹{parseFloat(payment.amount).toLocaleString("en-IN")}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {payment.hostel_name} • {new Date(payment.created_at).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {payment.mode} • {payment.transaction_id}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {payment.status === "success" ? (
                                                    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Success
                                                    </span>
                                                ) : payment.status === "failed" ? (
                                                    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                                        <XCircle className="w-3 h-3" />
                                                        Failed
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                                                        <Clock className="w-3 h-3" />
                                                        Pending
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => downloadReceipt(payment.payment_id)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Download Receipt"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No payment history found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <User className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Profile</h2>
                                    <p className="text-sm text-gray-500">Your information</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <User className="w-5 h-5 text-purple-500 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500">Full Name</p>
                                        <p className="font-semibold text-gray-900">{user.name}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Mail className="w-5 h-5 text-purple-500 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-semibold text-gray-900 break-all">{user.email}</p>
                                    </div>
                                </div>

                                {user.phone && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-5 h-5 text-purple-500 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-500">Phone</p>
                                            <p className="font-semibold text-gray-900">{user.phone}</p>
                                        </div>
                                    </div>
                                )}

                                {user.department && (
                                    <div className="flex items-start gap-3">
                                        <GraduationCap className="w-5 h-5 text-purple-500 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-500">Department</p>
                                            <p className="font-semibold text-gray-900">{user.department}</p>
                                        </div>
                                    </div>
                                )}

                                {user.year && (
                                    <div className="flex items-start gap-3">
                                        <Calendar className="w-5 h-5 text-purple-500 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-500">Year</p>
                                            <p className="font-semibold text-gray-900">Year {user.year}</p>
                                        </div>
                                    </div>
                                )}

                                {user.gender && (
                                    <div className="flex items-start gap-3">
                                        <User className="w-5 h-5 text-purple-500 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-500">Gender</p>
                                            <p className="font-semibold text-gray-900">{user.gender}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => alert("Profile editing coming soon!")}
                                className="w-full mt-6 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all shadow hover:shadow-lg"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
