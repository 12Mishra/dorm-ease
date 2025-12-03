import NavBar from '@/components/NavBar';
import { Building2, Users, Calendar, Clock, Wifi, BookOpen } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <NavBar />

      <main className="container mx-auto px-4">
        <section className="py-16 md:py-24 text-center">
          <div className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-6">
            College Hostel Management System
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent leading-tight">
            Your Home Away
            <br />
            From Home
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Streamlined hostel room booking and management for students. Find your perfect accommodation on campus.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <a
              href="/hostels"
              className="px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl font-semibold text-lg"
            >
              Browse Available Rooms
            </a>
            <a
              href="/hostels"
              className="px-8 py-4 bg-white text-gray-800 rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl font-semibold text-lg border-2 border-gray-200"
            >
              Check Availability
            </a>
          </div>
        </section>

        <section className="py-12 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
              <Calendar className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-800">Easy Booking</h3>
            <p className="text-gray-600 leading-relaxed">
              Book your hostel room for the semester with just a few clicks. Real-time availability updates.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <Building2 className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-800">Multiple Hostels</h3>
            <p className="text-gray-600 leading-relaxed">
              Choose from Boys' and Girls' hostels with various room types including single, double, and shared.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-800">Roommate Finder</h3>
            <p className="text-gray-600 leading-relaxed">
              Connect with fellow students and find compatible roommates for shared accommodation.
            </p>
          </div>
        </section>
        
        <section className="py-16 grid md:grid-cols-4 gap-8 max-w-5xl mx-auto text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-4xl font-bold text-indigo-600 mb-2">800+</div>
            <div className="text-gray-600">Total Beds</div>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-4xl font-bold text-indigo-600 mb-2">6</div>
            <div className="text-gray-600">Hostel Buildings</div>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-4xl font-bold text-indigo-600 mb-2">24/7</div>
            <div className="text-gray-600">Support Available</div>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-4xl font-bold text-indigo-600 mb-2">100%</div>
            <div className="text-gray-600">Student Satisfaction</div>
          </div>
        </section>

        <section className="py-16 max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              How to Book Your Room
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800 mb-1">Browse Available Hostels</h3>
                  <p className="text-gray-600">View all hostel options with room types and availability status.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800 mb-1">Select Your Preference</h3>
                  <p className="text-gray-600">Choose your preferred hostel, room type, and semester duration.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800 mb-1">Complete Booking</h3>
                  <p className="text-gray-600">Submit your details and receive instant confirmation of your room allocation.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-12 mt-24">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="w-6 h-6 text-indigo-500" />
            <span className="text-xl font-bold text-white">DormEase</span>
          </div>
          <p className="mb-4">College Hostel Management & Booking System</p>
          <p className="text-sm">Making campus living comfortable and convenient</p>
          <p className="text-sm mt-2">© 2024 DormEase. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}