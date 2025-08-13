import pool from '../utils/db';
import { sendConfirmationEmail, sendReminderEmail } from '../services/emailService';
import { addToGoogleCalendar, deleteFromGoogleCalendar } from '../services/googleCalendarService';
import { subHours, parseISO } from 'date-fns';

export interface Booking {
  id: string;
  service_id: string;
  addon_ids?: string[]; // Array of add-on IDs
  date: string;
  time: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  language: 'en' | 'he';
  token: string;
  google_event_id?: string;
  service_name?: string;
  service_duration?: number; // Service duration in minutes
  price?: number;
  addons?: Array<{id: string; name: string; price: number; duration?: number}>; // Add-on details
}

export const getBookings = async (): Promise<Booking[]> => {
  try {
    // First try to query with add-ons
    const res = await pool.query(`
      SELECT 
        b.*, 
        s.name as service_name, 
        s.duration as service_duration,
        s.price,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', sa.id, 'name', sa.name, 'price', sa.price, 'duration', sa.duration)
          ) FILTER (WHERE sa.id IS NOT NULL), 
          '[]'
        ) as addons
      FROM bookings b 
      JOIN services s ON b.service_id = s.id 
      LEFT JOIN booking_addons ba ON b.id = ba.booking_id
      LEFT JOIN services sa ON ba.addon_id = sa.id
      GROUP BY b.id, s.name, s.duration, s.price
      ORDER BY b.date, b.time
    `);
    return res.rows;
  } catch (error) {
    // If the booking_addons table doesn't exist, fall back to basic query
    console.log('booking_addons table not found, using basic query');
    const res = await pool.query('SELECT b.*, s.name as service_name, s.duration as service_duration, s.price from bookings b JOIN services s ON b.service_id = s.id ORDER BY b.date, b.time');
    return res.rows.map(row => ({ ...row, addons: [] }));
  }
};

export const createBooking = async (booking: Omit<Booking, 'id' | 'token' | 'google_event_id'> & { addon_ids?: string[] }): Promise<Booking> => {
  const token = Math.random().toString(36).substring(2);
  
  // Start a transaction to ensure data consistency
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Insert the booking
    const res = await client.query(
      'INSERT INTO bookings (service_id, date, time, client_name, client_phone, client_email, language, token) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [booking.service_id, booking.date, booking.time, booking.client_name, booking.client_phone, booking.client_email, booking.language, token]
    );
    const newBooking = res.rows[0];
    
    // Insert add-ons if any
    if (booking.addon_ids && booking.addon_ids.length > 0) {
      // Create booking_addons table with correct data types (only if it doesn't exist)
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS booking_addons (
            booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
            addon_id UUID REFERENCES services(id) ON DELETE CASCADE,
            PRIMARY KEY (booking_id, addon_id)
          )
        `);
      } catch (error: any) {
        // If table creation fails due to incompatible types, drop and recreate
        if (error.code === '42804') {
          await client.query('DROP TABLE IF EXISTS booking_addons');
          await client.query(`
            CREATE TABLE booking_addons (
              booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
              addon_id UUID REFERENCES services(id) ON DELETE CASCADE,
              PRIMARY KEY (booking_id, addon_id)
            )
          `);
        } else {
          throw error;
        }
      }
      
      // Insert each add-on
      for (const addonId of booking.addon_ids) {
        await client.query(
          'INSERT INTO booking_addons (booking_id, addon_id) VALUES ($1, $2)',
          [newBooking.id, addonId]
        );
      }
    }
    
    await client.query('COMMIT');
    
    // Get the booking with service and add-ons details
    const detailedRes = await pool.query(`
      SELECT 
        b.*, 
        s.name as service_name, 
        s.price,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', sa.id, 'name', sa.name, 'price', sa.price)
          ) FILTER (WHERE sa.id IS NOT NULL), 
          '[]'
        ) as addons
      FROM bookings b 
      JOIN services s ON b.service_id = s.id 
      LEFT JOIN booking_addons ba ON b.id = ba.booking_id
      LEFT JOIN services sa ON ba.addon_id = sa.id
      WHERE b.id = $1
      GROUP BY b.id, s.name, s.price
    `, [newBooking.id]);
    
    const bookingWithDetails = detailedRes.rows[0];
    
    // Google Calendar integration disabled for local/dev
    // const eventId = await addToGoogleCalendar(bookingWithDetails);
    // await pool.query('UPDATE bookings SET google_event_id = $1 WHERE id = $2', [eventId, bookingWithDetails.id]);

    // Email sending disabled for local/dev
    // await sendConfirmationEmail(bookingWithDetails);

    // const appointmentTime = parseISO(`${bookingWithDetails.date}T${bookingWithDetails.time}`);
    // const reminderTime = subHours(appointmentTime, 24).getTime() - Date.now();
    // if (reminderTime > 0) {
    //   setTimeout(() => sendReminderEmail(bookingWithDetails), reminderTime);
    // }

    return bookingWithDetails;
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateBooking = async (id: string, updates: Partial<Omit<Booking, 'id' | 'token' | 'google_event_id'>>): Promise<Booking | null> => {
  const fields = Object.keys(updates).filter(key => key !== 'addon_ids').map((key, index) => `${key} = $${index + 2}`);
  const values = Object.values(updates).filter((_, index) => Object.keys(updates)[index] !== 'addon_ids');
  
  if (fields.length === 0 && !updates.addon_ids) return null;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Update booking fields if any
    if (fields.length > 0) {
      const query = `UPDATE bookings SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
      const res = await client.query(query, [id, ...values]);
      
      if (res.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }
    }
    
    // Update add-ons if provided
    if (updates.addon_ids !== undefined) {
      // Remove existing add-ons
      await client.query('DELETE FROM booking_addons WHERE booking_id = $1', [id]);
      
      // Add new add-ons
      if (updates.addon_ids && updates.addon_ids.length > 0) {
        for (const addonId of updates.addon_ids) {
          await client.query(
            'INSERT INTO booking_addons (booking_id, addon_id) VALUES ($1, $2)',
            [id, addonId]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    
    // Get the updated booking with service and add-ons details
    const detailedRes = await pool.query(`
      SELECT 
        b.*, 
        s.name as service_name, 
        s.price,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', sa.id, 'name', sa.name, 'price', sa.price)
          ) FILTER (WHERE sa.id IS NOT NULL), 
          '[]'
        ) as addons
      FROM bookings b 
      JOIN services s ON b.service_id = s.id 
      LEFT JOIN booking_addons ba ON b.id = ba.booking_id
      LEFT JOIN services sa ON ba.addon_id = sa.id
      WHERE b.id = $1
      GROUP BY b.id, s.name, s.price
    `, [id]);
    
    return detailedRes.rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getBookingByToken = async (token: string): Promise<Booking | null> => {
  try {
    // First try to query with add-ons
    const res = await pool.query(`
      SELECT 
        b.*, 
        s.name as service_name, 
        s.duration as service_duration,
        s.price,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', sa.id, 'name', sa.name, 'price', sa.price, 'duration', sa.duration)
          ) FILTER (WHERE sa.id IS NOT NULL), 
          '[]'
        ) as addons
      FROM bookings b 
      JOIN services s ON b.service_id = s.id 
      LEFT JOIN booking_addons ba ON b.id = ba.booking_id
      LEFT JOIN services sa ON ba.addon_id = sa.id
      WHERE b.token = $1
      GROUP BY b.id, s.name, s.duration, s.price
    `, [token]);
    return res.rows[0] || null;
  } catch (error) {
    // If the booking_addons table doesn't exist, fall back to basic query
    console.log('booking_addons table not found for getBookingByToken, using basic query');
    const res = await pool.query(
      'SELECT b.*, s.name as service_name, s.duration as service_duration, s.price from bookings b JOIN services s ON b.service_id = s.id WHERE b.token = $1', 
      [token]
    );
    return res.rows[0] ? { ...res.rows[0], addons: [] } : null;
  }
};

export const cancelBooking = async (token: string): Promise<{ success: boolean; message?: string }> => {
  try {
    // First try to query with add-ons
    const res = await pool.query(`
      SELECT 
        b.*, 
        s.name as service_name, 
        s.price,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', sa.id, 'name', sa.name, 'price', sa.price)
          ) FILTER (WHERE sa.id IS NOT NULL), 
          '[]'
        ) as addons
      FROM bookings b 
      JOIN services s ON b.service_id = s.id 
      LEFT JOIN booking_addons ba ON b.id = ba.booking_id
      LEFT JOIN services sa ON ba.addon_id = sa.id
      WHERE b.token = $1
      GROUP BY b.id, s.name, s.price
    `, [token]);
    
    const booking = res.rows[0];
    if (!booking) return { success: false };

    const appointmentTime = parseISO(`${booking.date}T${booking.time}`);
    if (Date.now() > subHours(appointmentTime, 20).getTime()) {
      return { success: false, message: 'Contact via WhatsApp for changes' };
    }

    await pool.query('DELETE FROM bookings WHERE token = $1', [token]);
    // Google Calendar integration disabled for local/dev
    // if (booking.google_event_id) await deleteFromGoogleCalendar(booking.google_event_id);
    return { success: true };
  } catch (error) {
    // If the booking_addons table doesn't exist, fall back to basic query
    console.log('booking_addons table not found for cancelBooking, using basic query');
    const res = await pool.query(
      'SELECT b.*, s.name as service_name, s.price from bookings b JOIN services s ON b.service_id = s.id WHERE b.token = $1', 
      [token]
    );
    const booking = res.rows[0];
    if (!booking) return { success: false };

    const appointmentTime = parseISO(`${booking.date}T${booking.time}`);
    if (Date.now() > subHours(appointmentTime, 20).getTime()) {
      return { success: false, message: 'Contact via WhatsApp for changes' };
    }

    await pool.query('DELETE FROM bookings WHERE token = $1', [token]);
    return { success: true };
  }
};