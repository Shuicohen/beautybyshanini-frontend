import { Request, Response } from 'express';
import { createBooking, cancelBooking, getBookings, updateBooking, getBookingByToken } from '../models/booking';
import { sendConfirmationEmail } from '../services/emailService';

// Removed duplicate getAll function

// Removed duplicate 'create' function to fix redeclaration error.

export const manage = async (req: Request, res: Response) => {
  const { token, action } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  if (!action) {
    // If no action specified, this is probably a frontend request
    return res.status(400).json({ error: 'Action required' });
  }

  if (action === 'cancel') {
    const result = await cancelBooking(token as string);
    return result.success ? res.json({ success: true }) : res.status(400).json(result);
  }

  res.status(400).json({ error: 'Invalid action' });
};

export const getBookingDetails = async (req: Request, res: Response) => {
  const { token } = req.params;
  
  try {
    const booking = await getBookingByToken(token);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ error: 'Failed to fetch booking details' });
  }
};

export const getAll = async (req: Request, res: Response) => {
  const bookings = await getBookings();
  res.json(bookings);
};

export const create = async (req: Request, res: Response) => {
  console.log('Received booking request body:', req.body);
  try {
    const booking = await createBooking(req.body);
    console.log('Booking created:', booking);
    // Send confirmation email after booking is created
    try {
      console.log('Attempting to send confirmation email to:', booking.client_email);
      await sendConfirmationEmail(booking);
      console.log('Confirmation email sent successfully.');
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }
    res.status(201).json(booking);
  } catch (error) {
    console.error('Booking creation failed:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

export const getCalendarFile = async (req: Request, res: Response) => {
  const { token } = req.params;
  
  try {
    const booking = await getBookingByToken(token);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    console.log('📊 Booking object for calendar:', {
      id: booking.id,
      service_name: booking.service_name,
      service_duration: booking.service_duration,
      addons: booking.addons,
      hasAddons: booking.addons && booking.addons.length > 0
    });

    // Generate ICS content
    const service = booking.service_name || booking.service_id;
    const bookingDateObj = typeof booking.date === 'string' ? new Date(booking.date) : booking.date;
    
    // Format date and time for calendar
    const pad = (n: number) => n.toString().padStart(2, '0');
    const y = bookingDateObj.getUTCFullYear();
    const m = pad(bookingDateObj.getUTCMonth() + 1);
    const d = pad(bookingDateObj.getUTCDate());
    const dateForCal = `${y}${m}${d}`;
    
    // Parse time and convert to UTC format for calendar
    const [hours, minutes] = booking.time.split(':').map(Number);
    const startTimeForCal = `${pad(hours)}${pad(minutes)}00`;
    
    // Calculate total duration: service duration + add-ons durations
    let totalDuration = booking.service_duration || 60; // Default to 60 minutes if no duration
    if (booking.addons && booking.addons.length > 0) {
      const addonDuration = booking.addons.reduce((sum, addon) => {
        return sum + (addon.duration || 0);
      }, 0);
      totalDuration += addonDuration;
    }
    
    // Calculate end time based on total duration
    const endTime = new Date();
    endTime.setHours(hours, minutes + totalDuration, 0, 0);
    const endTimeForCal = `${pad(endTime.getHours())}${pad(endTime.getMinutes())}00`;

    // Enhanced description for calendar
    const addOnsText = booking.addons && booking.addons.length > 0 
      ? `\nAdd-ons: ${booking.addons.map(a => `${a.name} (${a.duration || 0} min)`).join(', ')}`
      : '';
    const calendarDescription = `Booking Details:
Service: ${service} (${booking.service_duration || 60} min)${addOnsText}
Total Duration: ${totalDuration} minutes
Client: ${booking.client_name}
Phone: ${booking.client_phone}
Email: ${booking.client_email}
Booking ID: ${booking.id}

Beauty by Shanini Appointment`;

    const icsDescription = calendarDescription.replace(/\n/g, '\\n');
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Beauty by Shanini//EN
BEGIN:VEVENT
UID:${booking.id}@beautybyshanini.com
DTSTART:${dateForCal}T${startTimeForCal}Z
DTEND:${dateForCal}T${endTimeForCal}Z
SUMMARY:${service} - Beauty by Shanini
DESCRIPTION:${icsDescription}
LOCATION:Beauty by Shanini
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Reminder: ${service} appointment in 1 hour
END:VALARM
END:VEVENT
END:VCALENDAR`;

    // Set proper headers for ICS download
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="beauty-appointment-${booking.id}.ics"`);
    res.send(icsContent);
    
  } catch (error) {
    console.error('Error generating calendar file:', error);
    res.status(500).json({ error: 'Failed to generate calendar file' });
  }
};

export const update = async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log('Received booking update request for ID:', id, 'Body:', req.body);
  
  try {
    const updatedBooking = await updateBooking(id, req.body);
    
    if (!updatedBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    console.log('Booking updated:', updatedBooking);
    res.json(updatedBooking);
  } catch (error) {
    console.error('Booking update failed:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
};