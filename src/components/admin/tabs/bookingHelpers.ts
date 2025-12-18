import type { Booking } from '../types';

// Helper function to group bookings by date
export const groupBookingsByDate = (bookings: Booking[]) => {
  const groups: { [key: string]: Booking[] } = {};
  
  bookings.forEach(booking => {
    const dateKey = new Date(booking.date).toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(booking);
  });
  
  // Sort bookings within each group by time
  Object.keys(groups).forEach(dateKey => {
    groups[dateKey].sort((a, b) => a.time.localeCompare(b.time));
  });
  
  return groups;
};

// Helper function to group bookings by week for month view
export const groupBookingsByWeek = (bookings: Booking[]) => {
  const groups: { [key: string]: Booking[] } = {};
  
  bookings.forEach(booking => {
    const bookingDate = new Date(booking.date);
    const startOfWeek = new Date(bookingDate);
    startOfWeek.setDate(bookingDate.getDate() - bookingDate.getDay()); // Start from Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const weekKey = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
    if (!groups[weekKey]) {
      groups[weekKey] = [];
    }
    groups[weekKey].push(booking);
  });
  
  // Sort bookings within each group by date and time
  Object.keys(groups).forEach(weekKey => {
    groups[weekKey].sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare === 0) {
        return a.time.localeCompare(b.time);
      }
      return dateCompare;
    });
  });
  
  return groups;
};

// Helper function to group bookings by month for 'all' view
export const groupBookingsByMonth = (bookings: Booking[]) => {
  const groups: { [key: string]: Booking[] } = {};
  
  bookings.forEach(booking => {
    const bookingDate = new Date(booking.date);
    const monthKey = bookingDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(booking);
  });
  
  // Sort bookings within each group by date and time
  Object.keys(groups).forEach(monthKey => {
    groups[monthKey].sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare === 0) {
        return a.time.localeCompare(b.time);
      }
      return dateCompare;
    });
  });
  
  return groups;
};

// Helper function to get date range for filter
export const getDateRangeForFilter = (filter: 'today' | 'week' | 'month' | 'all') => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (filter === 'today') {
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    return { start: today, end: endOfDay };
  }
  
  if (filter === 'week') {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    return { start: startOfWeek, end: endOfWeek };
  }
  
  if (filter === 'month') {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return { start: startOfMonth, end: endOfMonth };
  }
  
  return null;
};

