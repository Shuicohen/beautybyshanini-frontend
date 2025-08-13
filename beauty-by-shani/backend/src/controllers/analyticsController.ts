import { Request, Response } from 'express';
import { getBookings } from '../models/booking';

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const bookings = await getBookings();
    let totalRevenue = 0;
    let totalBookings = 0;
    let totalClients = new Set();

    bookings.forEach((booking: any) => {
      // Main service price
      let bookingRevenue = Number(booking.price) || 0;
      // Add-ons
      if (Array.isArray(booking.addons)) {
        booking.addons.forEach((addon: any) => {
          bookingRevenue += Number(addon.price) || 0;
        });
      }
      totalRevenue += bookingRevenue;
      totalBookings += 1;
      if (booking.client_email) totalClients.add(booking.client_email);
    });

    res.json({
      totalRevenue,
      totalBookings,
      totalClients: totalClients.size
    });
  } catch (error) {
    console.error('Error in getAnalytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};
