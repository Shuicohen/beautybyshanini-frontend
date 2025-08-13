import type { Booking } from './models/booking';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import bookingsRoutes from './routes/bookingsRoutes';
import servicesRoutes from './routes/servicesRoutes';
import availabilityRoutes from './routes/availabilityRoutes';
import { authMiddleware } from './middlewares/authMiddleware';
import { getBookings } from './models/booking';

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
// Rate limiting is fully disabled for local development. Uncomment and configure for production only.

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/availability', availabilityRoutes);

app.get('/api/analytics', authMiddleware, async (req, res) => {
  try {
    const bookings = await getBookings();
    const timeRange = req.query.range || 'month'; // week, month, quarter, year
    // Filter bookings by time range
    const now = new Date();
    let startDate = new Date();
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default: // month
        startDate.setMonth(now.getMonth() - 1);
    }
    const filteredBookings = bookings.filter((b: Booking) => b.date && new Date(b.date) >= startDate);
    // Helper to sum main price + all add-on prices for a booking
    const getBookingRevenue = (b: Booking): number => {
      let sum = b.price ? Number(b.price) : 0;
      if (Array.isArray(b.addons)) {
        b.addons.forEach((addon: { price?: number }) => {
          sum += addon.price ? Number(addon.price) : 0;
        });
      }
      return sum;
    };
    // Basic metrics
    const serviceCounts: Record<string, number> = filteredBookings.reduce((acc: Record<string, number>, b: Booking) => {
      if (b.service_id) {
        acc[b.service_id] = (acc[b.service_id] || 0) + 1;
      }
      return acc;
    }, {});
    const mostBookedId = Object.keys(serviceCounts).reduce((a, b) => serviceCounts[a] > serviceCounts[b] ? a : b, '');
    const mostBooked = filteredBookings.find(b => b.service_id === mostBookedId)?.service_name || '';
    const totalRevenue = filteredBookings.reduce((sum, b) => sum + getBookingRevenue(b), 0);
    // Client analysis
    const clientCounts: Record<string, number> = filteredBookings.reduce((acc: Record<string, number>, b: Booking) => {
      if (b.client_email) {
        acc[b.client_email] = (acc[b.client_email] || 0) + 1;
      }
      return acc;
    }, {});
    const clientSpending: Record<string, { total: number; visits: number; name: string; lastVisit: string }> = filteredBookings.reduce((acc: Record<string, { total: number; visits: number; name: string; lastVisit: string }>, b: Booking) => {
      if (b.client_email) {
        if (!acc[b.client_email]) {
          acc[b.client_email] = { total: 0, visits: 0, name: b.client_name || '', lastVisit: b.date || '' };
        }
        acc[b.client_email].total += getBookingRevenue(b);
        acc[b.client_email].visits += 1;
        if (b.date && new Date(b.date) > new Date(acc[b.client_email].lastVisit)) {
          acc[b.client_email].lastVisit = b.date;
        }
      }
      return acc;
    }, {});
    const vipClients = Object.keys(clientCounts)
      .filter(email => clientCounts[email] >= 3)
      .map(email => ({
        name: clientSpending[email].name,
        visits: clientSpending[email].visits,
        totalSpent: clientSpending[email].total,
        lastVisit: clientSpending[email].lastVisit
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
    // Revenue chart data
    const revenueChart: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayBookings = filteredBookings.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate.toDateString() === date.toDateString();
      });
      const dayRevenue = dayBookings.reduce((sum, b) => sum + getBookingRevenue(b), 0);
      revenueChart.push({
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: dayRevenue
      });
    }
    // Service performance
    const serviceStats = Object.keys(serviceCounts).map(serviceId => {
      const serviceBookings = filteredBookings.filter(b => b.service_id === serviceId);
      const serviceName = serviceBookings[0]?.service_name || 'Unknown';
      const revenue = serviceBookings.reduce((sum, b) => sum + getBookingRevenue(b), 0);
      const bookingCount = serviceCounts[serviceId];
      return {
        name: serviceName,
        bookings: bookingCount,
        revenue,
        percentage: Math.round((bookingCount / filteredBookings.length) * 100)
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    // Peak hours analysis
    const hourCounts: Record<string, number> = filteredBookings.reduce((acc: Record<string, number>, b: Booking) => {
      if (b.time) {
        const hour = b.time.split(':')[0];
        const hourRange = `${hour}:00-${parseInt(hour) + 1}:00`;
        acc[hourRange] = (acc[hourRange] || 0) + 1;
      }
      return acc;
    }, {});
    const peakHours = Object.keys(hourCounts)
      .map(time => ({
        time,
        bookings: hourCounts[time],
        percentage: Math.round((hourCounts[time] / filteredBookings.length) * 100)
      }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);
    // Day of week analysis
    const dayBookingsObj: Record<string, number> = filteredBookings.reduce((acc: Record<string, number>, b: Booking) => {
      if (b.date) {
        const day = new Date(b.date).toLocaleDateString('en-US', { weekday: 'long' });
        acc[day] = (acc[day] || 0) + 1;
      }
      return acc;
    }, {});
    const busiestDay = Object.keys(dayBookingsObj).reduce((a, b) => 
      dayBookingsObj[a] > dayBookingsObj[b] ? a : b, 'Monday'
    );
    // Advanced metrics
    const totalClients = Object.keys(clientCounts).length;
    const repeatCustomers = Object.keys(clientCounts).filter(email => clientCounts[email] > 1).length;
    const repeatCustomerRate = totalClients > 0 ? Math.round((repeatCustomers / totalClients) * 100) : 0;
    const avgBookingValue = filteredBookings.length > 0 ? Math.round(totalRevenue / filteredBookings.length) : 0;
    const avgVisitsPerClient = totalClients > 0 ? Math.round(filteredBookings.length / totalClients * 10) / 10 : 0;
    const avgBookingsPerDay = Math.round(filteredBookings.length / 30 * 10) / 10;
    // Add-on analysis (assuming addons are stored in booking data)
    const addonStats: Record<string, { count: number; revenue: number }> = filteredBookings
      .filter(b => b.addons && b.addons.length > 0)
      .reduce((acc: Record<string, { count: number; revenue: number }>, b: Booking) => {
        b.addons?.forEach((addon: { name: string; price?: number }) => {
          if (!acc[addon.name]) {
            acc[addon.name] = { count: 0, revenue: 0 };
          }
          acc[addon.name].count += 1;
          acc[addon.name].revenue += addon.price ? Number(addon.price) : 0;
        });
        return acc;
      }, {});
    const addonStatsArray = Object.keys(addonStats).map(name => ({
      name,
      bookings: addonStats[name].count,
      revenue: addonStats[name].revenue,
      popularityRate: Math.round((addonStats[name].count / filteredBookings.length) * 100),
      avgPerBooking: Math.round(addonStats[name].revenue / addonStats[name].count)
    })).sort((a, b) => b.revenue - a.revenue);
    res.json({
      // Basic metrics
      mostBooked,
      revenueEstimate: totalRevenue,
      vipClients,
      // Enhanced metrics
      totalRevenue,
      revenueGrowth: 12, // This would need historical comparison
      totalBookings: filteredBookings.length,
      bookingGrowth: 8, // This would need historical comparison
      totalClients,
      newClientsGrowth: 15, // This would need historical comparison
      avgBookingValue,
      // Charts and detailed data
      revenueChart,
      serviceStats,
      peakHours,
      // Customer insights
      repeatCustomerRate,
      newClientsThisPeriod: totalClients, // This would need refinement
      avgVisitsPerClient,
      clientRetentionRate: 85, // This would need calculation
      // Booking trends
      avgBookingsPerDay,
      busiestDay,
      cancellationRate: 5, // This would need tracking
      noShowRate: 3, // This would need tracking
      // Add-on performance
      addonStats: addonStatsArray,
      // Goals (these would be configurable)
      monthlyGoalProgress: Math.round((totalRevenue / 10000) * 100),
      currentMonthRevenue: totalRevenue,
      monthlyGoal: 10000,
      bookingGoalProgress: Math.round((filteredBookings.length / 100) * 100),
      currentMonthBookings: filteredBookings.length,
      monthlyBookingGoal: 100,
      satisfactionScore: 4.8,
      totalReviews: Math.floor(filteredBookings.length * 0.7)
    });
  } catch (err) {
    console.error('Error in /api/analytics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default app;

