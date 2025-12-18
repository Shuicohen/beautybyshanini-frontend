import { motion } from 'framer-motion';
import type { Booking, Service, Analytics } from '../types';
import { formatCurrency } from '../utils';

interface OverviewTabProps {
  bookings: Booking[];
  mainServices: Service[];
  addOns: Service[];
  analytics: Analytics;
  onTabChange: (tab: string) => void;
}

export const OverviewTab = ({ bookings, mainServices, addOns, analytics, onTabChange }: OverviewTabProps) => {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-pink-accent">Business Overview</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Today's summary and key metrics</p>
        </div>
        <div className="text-xs sm:text-sm text-gray-500 break-words">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-gradient-to-br from-pink-50 to-pink-100 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft text-left hover:shadow-xl transition-all duration-300 cursor-pointer border border-pink-200 text-sm sm:text-base"
          onClick={() => onTabChange('Bookings')}
          aria-label="View Bookings"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-pink-accent/20 rounded-xl">
              <svg className="w-6 h-6 text-pink-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <svg className="w-5 h-5 text-pink-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Upcoming Appointments</h3>
          <p className="text-3xl font-bold text-pink-accent">{bookings.filter(b => new Date(b.date) >= new Date()).length}</p>
          <p className="text-sm text-gray-600 mt-1">appointments scheduled</p>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-green-200 text-sm sm:text-base"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              All Time
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(bookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0))}
          </p>
          <p className="text-sm text-gray-600 mt-1">from all bookings</p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft text-left hover:shadow-xl transition-all duration-300 cursor-pointer border border-blue-200 text-sm sm:text-base"
          onClick={() => onTabChange('Manage Services')}
          aria-label="View Services"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-baby-blue/20 rounded-xl">
              <svg className="w-6 h-6 text-baby-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.586V5L8 4z" />
              </svg>
            </div>
            <svg className="w-5 h-5 text-baby-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Main Services</h3>
          <p className="text-3xl font-bold text-baby-blue">{mainServices.length}</p>
          <p className="text-sm text-gray-600 mt-1">active services</p>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft text-left hover:shadow-xl transition-all duration-300 cursor-pointer border border-purple-200 text-sm sm:text-base"
          onClick={() => onTabChange('Manage Services')}
          aria-label="View Add-ons"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Add-ons</h3>
          <p className="text-3xl font-bold text-purple-600">{addOns.length}</p>
          <p className="text-sm text-gray-600 mt-1">additional services</p>
        </motion.button>
      </div>

      {/* Today's Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Today's Appointments */}
        <div className="bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Today's Appointments
            </h3>
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
              {(() => {
                const today = new Date().toDateString();
                return bookings.filter(b => new Date(b.date).toDateString() === today).length;
              })()} today
            </span>
          </div>
          
          <div className="space-y-3">
            {(() => {
              const today = new Date().toDateString();
              const todaysBookings = bookings
                .filter(b => new Date(b.date).toDateString() === today)
                .sort((a, b) => a.time.localeCompare(b.time))
                .slice(0, 5);
              
              if (todaysBookings.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>No appointments today</p>
                    <p className="text-sm">Enjoy your free day!</p>
                  </div>
                );
              }
              
              return todaysBookings.map((booking) => (
                <div key={booking.id} className="flex items-center gap-4 p-3 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-lg font-semibold text-sm">
                    {booking.time}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{booking.client_name}</h4>
                    <p className="text-sm text-gray-600">{booking.service_name || 'Service'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">{formatCurrency(Number(booking.price || 0))}</p>
                  </div>
                </div>
              ));
            })()}
            
            {(() => {
              const today = new Date().toDateString();
              const todaysBookings = bookings.filter(b => new Date(b.date).toDateString() === today);
              if (todaysBookings.length > 5) {
                return (
                  <div className="text-center pt-3">
                    <button 
                      onClick={() => onTabChange('Bookings')}
                      className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                    >
                      View all {todaysBookings.length} appointments →
                    </button>
                  </div>
                );
              }
            })()}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-white/20">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-pink-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Quick Stats
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-pink-50 rounded-xl">
              <span className="text-gray-700 font-medium">Most Booked Service</span>
              <span className="font-bold text-pink-accent">{analytics.mostBooked || 'No data yet'}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <span className="text-gray-700 font-medium">This Week</span>
              <span className="font-bold text-baby-blue">
                {(() => {
                  const startOfWeek = new Date();
                  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
                  const endOfWeek = new Date(startOfWeek);
                  endOfWeek.setDate(startOfWeek.getDate() + 6);
                  
                  return bookings.filter(b => {
                    const bookingDate = new Date(b.date);
                    return bookingDate >= startOfWeek && bookingDate <= endOfWeek;
                  }).length;
                })()} appointments
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <span className="text-gray-700 font-medium">This Month Revenue</span>
              <span className="font-bold text-green-600">
                {formatCurrency((() => {
                  const startOfMonth = new Date();
                  startOfMonth.setDate(1);
                  const monthRevenue = bookings
                    .filter(b => new Date(b.date) >= startOfMonth)
                    .reduce((sum, b) => sum + (Number(b.price) || 0), 0);
                  return isNaN(monthRevenue) ? 0 : Math.round(monthRevenue);
                })())}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
              <span className="text-gray-700 font-medium">Total Clients</span>
              <span className="font-bold text-purple-600">
                {(() => {
                  const uniqueClients = new Set(bookings.map(b => b.client_email));
                  return uniqueClients.size;
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-indigo-200">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => onTabChange('Bookings')}
            className="bg-white/70 p-4 rounded-xl hover:bg-white/90 transition flex items-center gap-3 text-left"
          >
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-medium text-gray-800">View All Bookings</span>
          </button>
          
          <button
            onClick={() => onTabChange('Manage Services')}
            className="bg-white/70 p-4 rounded-xl hover:bg-white/90 transition flex items-center gap-3 text-left"
          >
            <div className="p-2 bg-pink-100 rounded-lg">
              <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="font-medium text-gray-800">Add New Service</span>
          </button>
          
          <button
            onClick={() => onTabChange('Availability')}
            className="bg-white/70 p-4 rounded-xl hover:bg-white/90 transition flex items-center gap-3 text-left"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-medium text-gray-800">Set Availability</span>
          </button>
          
          <button
            onClick={() => onTabChange('Analytics')}
            className="bg-white/70 p-4 rounded-xl hover:bg-white/90 transition flex items-center gap-3 text-left"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="font-medium text-gray-800">View Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};

