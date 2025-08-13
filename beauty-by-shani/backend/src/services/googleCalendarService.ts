import { google } from 'googleapis';
import { formatISO, addMinutes, parseISO } from 'date-fns';
import pool from '../utils/db';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

export const addToGoogleCalendar = async (booking: any): Promise<string> => {
  const serviceRes = await pool.query('SELECT name, duration FROM services WHERE id = $1', [booking.service_id]);
  const service = serviceRes.rows[0];

  const start = formatISO(parseISO(`${booking.date}T${booking.time}`));
  const end = formatISO(addMinutes(parseISO(start), service.duration + 15));

  const eventResponse = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `Nail Appointment with ${booking.client_name}`,
      description: `Service: ${service.name}`,
      start: { dateTime: start },
      end: { dateTime: end },
    },
  });

  // eventResponse.data.id may be undefined, so handle safely
  return eventResponse.data.id || '';
};

export const deleteFromGoogleCalendar = async (eventId: string) => {
  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  });
};

export const getBusySlots = async (day: string): Promise<{ start: string; end: string }[]> => {
  const timeMin = formatISO(new Date(`${day}T00:00:00`));
  const timeMax = formatISO(new Date(`${day}T23:59:59`));

  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      items: [{ id: 'primary' }],
    },
  });

  const busy = res.data.calendars?.primary?.busy || [];
  return busy.map((slot) => ({
    start: slot.start!,
    end: slot.end!,
  }));
};