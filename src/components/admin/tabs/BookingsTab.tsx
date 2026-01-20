import { useState, useMemo } from 'react';
import type { Booking } from '../types';
import { formatCurrency } from '../utils';
import { groupBookingsByDate, groupBookingsByWeek, groupBookingsByMonth, getDateRangeForFilter } from './bookingHelpers';

interface BookingsTabProps {
  bookings: Booking[];
  onEditBooking: (booking: Booking) => void;
  onCancelBooking: (token: string) => void;
  onBookingDetails: (booking: Booking) => void;
}

export const BookingsTab = ({
  bookings,
  onEditBooking,
  onCancelBooking,
  onBookingDetails
}: BookingsTabProps) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showPastBookings, setShowPastBookings] = useState<boolean>(false);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  // Filter bookings based on search term and past/upcoming toggle
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      // First filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
          booking.client_name.toLowerCase().includes(searchLower) ||
          booking.client_email.toLowerCase().includes(searchLower) ||
          booking.client_phone.toLowerCase().includes(searchLower) ||
          booking.id.toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      // Then filter by past/upcoming
      const bookingDate = new Date(booking.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (showPastBookings) {
        if (bookingDate >= today) return false;
      } else {
        if (bookingDate < today) return false;
      }

      // Finally filter by time range
      const dateRange = getDateRangeForFilter(timeFilter);
      if (dateRange) {
        return bookingDate >= dateRange.start && bookingDate < dateRange.end;
      }
      
      return true;
    });
  }, [bookings, searchTerm, showPastBookings, timeFilter]);

  const renderBookingCard = (booking: Booking) => (
    <div 
      key={booking.id} 
      className="bg-white p-4 rounded-xl shadow-md border border-baby-blue/20 hover:shadow-lg transition cursor-pointer"
      onClick={() => onBookingDetails(booking)}
    >
      {/* Mobile Layout */}
      <div className="block md:hidden space-y-3">
        <div className="flex items-center justify-between">
          <div className={`${timeFilter === 'today' ? 'bg-pink-accent/10 text-pink-accent px-3 py-2 rounded-lg font-bold text-lg' : timeFilter === 'week' ? 'bg-baby-blue/10 text-baby-blue px-3 py-1 rounded-lg font-semibold text-sm' : timeFilter === 'month' ? 'bg-purple-100 text-purple-600 px-3 py-1 rounded-lg font-semibold text-sm' : 'bg-gray-100 text-gray-700 px-3 py-1 rounded-lg font-semibold text-sm'}`}>
            {timeFilter === 'month' || timeFilter === 'all' ? (
              <>
                <div>{new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                <div className={`${timeFilter === 'month' ? 'text-purple-500' : 'text-gray-600'} text-xs mt-1`}>{booking.time}</div>
              </>
            ) : (
              booking.time
            )}
          </div>
          <div className="text-right">
            <p className="font-bold text-pink-accent">{formatCurrency(Number(booking.price || 0))}</p>
            <p className="text-xs text-gray-500">ID: {(booking.booking_reference || String(booking.id))}</p>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 text-lg">{booking.client_name}</h4>
          <p className="text-gray-600 mb-1">{booking.service_name || booking.service_id}</p>
          <p className="text-sm text-gray-500">{booking.client_email}</p>
          {timeFilter === 'today' && <p className="text-sm text-gray-500">{booking.client_phone}</p>}
          {timeFilter === 'all' && <p className="text-sm text-gray-500">{booking.client_email} • {booking.client_phone}</p>}
        </div>
        {!showPastBookings && (
          <div className="flex gap-2 pt-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEditBooking(booking);
              }}
              className="flex-1 bg-baby-blue text-white py-2 px-3 rounded-lg hover:bg-baby-blue/80 transition text-sm font-medium"
            >
              Edit
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onCancelBooking(booking.token);
              }}
              className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className={`hidden md:flex ${timeFilter === 'week' || timeFilter === 'month' || timeFilter === 'all' ? 'flex-col md:flex-row justify-between items-start md:items-center gap-4' : 'items-center gap-4'}`}>
        <div className={`flex items-center gap-4 ${timeFilter === 'week' || timeFilter === 'month' || timeFilter === 'all' ? '' : 'flex-grow'}`}>
          {(timeFilter === 'month' || timeFilter === 'all') && (
            <div className="text-center flex-shrink-0">
              <div className={`${timeFilter === 'month' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-700'} px-3 py-1 rounded-lg font-semibold text-sm`}>
                {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className={`${timeFilter === 'month' ? 'text-purple-500' : 'text-gray-600'} text-xs mt-1`}>{booking.time}</div>
            </div>
          )}
          {timeFilter !== 'month' && timeFilter !== 'all' && (
            <div className="flex-shrink-0">
              <div className={`${timeFilter === 'today' ? 'bg-pink-accent/10 text-pink-accent px-4 py-2 rounded-lg font-bold text-lg' : 'bg-baby-blue/10 text-baby-blue px-3 py-1 rounded-lg font-semibold'}`}>
                {booking.time}
              </div>
            </div>
          )}
          <div className={timeFilter === 'week' || timeFilter === 'month' || timeFilter === 'all' ? '' : 'flex-grow'}>
            <h4 className="font-semibold text-gray-800">{booking.client_name}</h4>
            <p className="text-gray-600">{booking.service_name || booking.service_id}</p>
            <p className="text-sm text-gray-500">{booking.client_email}{timeFilter === 'today' || timeFilter === 'all' ? ` • ${booking.client_phone}` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-bold text-pink-accent">{formatCurrency(Number(booking.price || 0))}</p>
            <p className="text-xs text-gray-500">ID: {(booking.booking_reference || String(booking.id))}</p>
          </div>
          {!showPastBookings && (
            <div className="flex gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEditBooking(booking);
                }}
                className="bg-baby-blue text-white px-3 py-2 rounded-lg hover:bg-baby-blue/80 transition text-sm"
              >
                Edit
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelBooking(booking.token);
                }}
                className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderBookingsContent = () => {
    if (timeFilter === 'today') {
      const groupedByDate = groupBookingsByDate(filteredBookings);
      return Object.keys(groupedByDate)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        .map(dateKey => (
          <div key={dateKey} className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-pink-accent rounded-full"></div>
              <h3 className="text-xl font-bold text-gray-800">
                {new Date(dateKey).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <span className="bg-pink-accent/10 text-pink-accent px-3 py-1 rounded-full text-sm font-medium">
                {groupedByDate[dateKey].length} appointment{groupedByDate[dateKey].length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-3">
              {groupedByDate[dateKey].map(renderBookingCard)}
            </div>
          </div>
        ));
    } else if (timeFilter === 'week') {
      const groupedByDate = groupBookingsByDate(filteredBookings);
      return Object.keys(groupedByDate)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        .map(dateKey => (
          <div key={dateKey} className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-baby-blue rounded-full"></div>
              <h3 className="text-lg font-bold text-gray-800">
                {new Date(dateKey).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </h3>
              <span className="bg-baby-blue/10 text-baby-blue px-3 py-1 rounded-full text-sm font-medium">
                {groupedByDate[dateKey].length} appointment{groupedByDate[dateKey].length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid gap-3">
              {groupedByDate[dateKey].map(renderBookingCard)}
            </div>
          </div>
        ));
    } else if (timeFilter === 'month') {
      const groupedByWeek = groupBookingsByWeek(filteredBookings);
      return Object.keys(groupedByWeek)
        .sort((a, b) => new Date(a.split(' - ')[0]).getTime() - new Date(b.split(' - ')[0]).getTime())
        .map(weekKey => (
          <div key={weekKey} className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-gray-800">
                Week of {weekKey}
              </h3>
              <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">
                {groupedByWeek[weekKey].length} appointment{groupedByWeek[weekKey].length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid gap-3">
              {groupedByWeek[weekKey].map(renderBookingCard)}
            </div>
          </div>
        ));
    } else {
      const groupedByMonth = groupBookingsByMonth(filteredBookings);
      return Object.keys(groupedByMonth)
        .sort((a, b) => {
          const dateA = new Date(a + ' 1');
          const dateB = new Date(b + ' 1');
          return dateA.getTime() - dateB.getTime();
        })
        .map(monthKey => (
          <div key={monthKey} className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-gray-800">
                {monthKey}
              </h3>
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                {groupedByMonth[monthKey].length} appointment{groupedByMonth[monthKey].length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid gap-3">
              {groupedByMonth[monthKey].map(renderBookingCard)}
            </div>
          </div>
        ));
    }
  };

  const totalPastBookings = bookings.filter(b => new Date(b.date) < new Date()).length;
  const totalUpcomingBookings = bookings.filter(b => new Date(b.date) >= new Date()).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex flex-col items-start">
          <h1 className="text-3xl font-bold text-pink-accent">Bookings</h1>
          <p className="text-gray-600 mt-1">
            {searchTerm 
              ? `${filteredBookings.length} of ${showPastBookings ? totalPastBookings : totalUpcomingBookings} ${showPastBookings ? 'past' : 'upcoming'} bookings`
              : `${filteredBookings.length} ${showPastBookings ? 'past' : 'upcoming'} bookings`
            }
          </p>
        </div>
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by name, email, phone, or booking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 px-4 py-3 pl-10 pr-10 border border-baby-blue/50 rounded-xl focus:border-pink-accent outline-none bg-white/50"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-pink-accent transition"
              aria-label="Clear search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Toggle for Past/Upcoming Bookings */}
      <div className="flex justify-center mb-4">
        <div className="bg-white/90 backdrop-blur-md rounded-full p-1 shadow-soft">
          <button
            onClick={() => setShowPastBookings(false)}
            className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
              !showPastBookings 
                ? 'bg-pink-accent text-white shadow-md' 
                : 'text-gray-600 hover:text-pink-accent'
            }`}
          >
            Upcoming Bookings
          </button>
          <button
            onClick={() => setShowPastBookings(true)}
            className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
              showPastBookings 
                ? 'bg-pink-accent text-white shadow-md' 
                : 'text-gray-600 hover:text-pink-accent'
            }`}
          >
            Past Bookings
          </button>
        </div>
      </div>

      {/* Time Filter Toggle - Mobile First */}
      <div className="mb-6">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-2 shadow-soft grid grid-cols-4 gap-2">
          {(['today', 'week', 'month', 'all'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-2 sm:px-4 py-3 rounded-xl font-medium transition-all duration-300 text-xs sm:text-sm ${
                timeFilter === filter 
                  ? 'bg-baby-blue text-white shadow-md' 
                  : 'text-gray-600 hover:text-baby-blue hover:bg-baby-blue/10'
              }`}
            >
              {filter === 'today' ? 'Today' : 
               filter === 'week' ? 'This Week' : 
               filter === 'month' ? 'This Month' : 'All'}
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-6">
        {renderBookingsContent()}
        {filteredBookings.length === 0 && (showPastBookings ? totalPastBookings : totalUpcomingBookings) > 0 && (
          <div className="bg-baby-blue/10 p-8 rounded-2xl text-center text-lg text-gray-500 font-semibold">
            No {showPastBookings ? 'past' : 'upcoming'} bookings match your search criteria for {timeFilter === 'today' ? 'today' : timeFilter === 'week' ? 'this week' : timeFilter === 'month' ? 'this month' : 'the selected period'}.
          </div>
        )}
        {(showPastBookings ? totalPastBookings : totalUpcomingBookings) === 0 && (
          <div className="bg-baby-blue/10 p-8 rounded-2xl text-center text-lg text-gray-500 font-semibold">
            No {showPastBookings ? 'past' : 'upcoming'} bookings found.
          </div>
        )}
      </div>
    </div>
  );
};
