"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, LogOut, User as UserIcon } from "lucide-react";

interface User {
  name: string;
  role: string;
  isLoggedIn: boolean;
}

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.isLoggedIn) {
        setUser(data.user);
      }
    } catch (error) {
      console.error("Session fetch error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Building2 className="w-8 h-8 text-indigo-600" />
          <span className="text-xl font-bold text-gray-800">DormEase</span>
        </Link>

        {/* Navigation Actions */}
        <div className="flex gap-4 items-center">
          <Link
            href="/hostels"
            className="px-4 py-2 text-gray-700 hover:text-indigo-600 transition-colors font-medium"
          >
            View Hostels
          </Link>

          {/* Conditional Rendering based on Role */}
          {user?.role === "admin" || user?.role === "super_admin" ? (
            <Link
              href="/admin"
              className="px-4 py-2 text-gray-700 hover:text-indigo-600 transition-colors font-medium"
            >
              Admin Dashboard
            </Link>
          ) : null}

          {/* Auth State */}
          {user ? (
            <div className="flex items-center gap-4 ml-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium">
                <UserIcon className="w-4 h-4" />
                <Link href="/dashboard">{user.name}</Link>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link
                href="/login"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg font-medium"
              >
                Login
              </Link>

            </div>
          )}
        </div>
      </div>
    </nav>
  );
}