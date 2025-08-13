import pool from '../utils/db';
import { parseISO, addMinutes, isBefore, format } from 'date-fns';
// import { getBusySlots } from '../services/googleCalendarService';

export interface Availability {
  id: string;
  day: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  is_blocked: boolean;
  block_reason?: string;
}

export const getAvailabilities = async (day?: string): Promise<Availability[]> => {
  let query = 'SELECT * FROM availability';
  const params: any[] = [];
  if (day) {
    query += ' WHERE day = $1';
    params.push(day);
  }
  const res = await pool.query(query, params);
  return res.rows;
};

export const addAvailability = async (avail: Omit<Availability, 'id'>): Promise<Availability> => {
  const res = await pool.query(
    'INSERT INTO availability (day, start_time, end_time, is_blocked, block_reason) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [avail.day, avail.start_time, avail.end_time, avail.is_blocked, avail.block_reason]
  );
  return res.rows[0];
};

export const updateAvailability = async (id: string, updates: Partial<Availability>): Promise<Availability | null> => {
  const fields = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`).join(', ');
  const values = Object.values(updates);
  values.push(id);
  const res = await pool.query(`UPDATE availability SET ${fields} WHERE id = $${values.length} RETURNING *`, values);
  return res.rows[0] || null;
};

export const deleteAvailability = async (id: string): Promise<boolean> => {
  const res = await pool.query('DELETE FROM availability WHERE id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
};

// Returns available slots for a given day and service duration
export const getAvailableSlots = async (day: string, serviceDuration: number): Promise<string[]> => {
  const availRes = await pool.query(
    'SELECT start_time, end_time FROM availability WHERE day = $1 AND is_blocked = false',
    [day]
  );
  // Map DB fields to expected keys
  const openSlots: { start: string; end: string }[] = availRes.rows.map((row: any) => ({
    start: row.start_time,
    end: row.end_time
  }));
  console.log('Open slots for day', day, ':', openSlots);

  if (openSlots.length === 0) {
    console.log('No open slots for day', day);
    return [];
  }

  const bookingsRes = await pool.query(
    `SELECT time, 
            (SELECT duration FROM services WHERE id = bookings.service_id) as duration 
     FROM bookings WHERE date = $1`,
    [day]
  );
  const bookedIntervals: { start: Date; end: Date }[] = bookingsRes.rows.map((booking) => {
    const start = parseISO(`${day}T${booking.time}`);
    const end = addMinutes(start, booking.duration + 15);
    return { start, end };
  });
  console.log('Booked intervals for day', day, ':', bookedIntervals);

  // Google Calendar integration disabled for now
  const busyIntervals = [...bookedIntervals];

  const availableTimes: string[] = [];
  for (const open of openSlots) {
    let current = parseISO(`${day}T${open.start}`);
    const openEnd = parseISO(`${day}T${open.end}`);

    while (isBefore(addMinutes(current, serviceDuration + 15), openEnd)) {
      const slotEnd = addMinutes(current, serviceDuration + 15);
      const isBusy = busyIntervals.some((busy) => current < busy.end && slotEnd > busy.start);

      if (!isBusy) {
        availableTimes.push(format(current, 'HH:mm'));
      }

      current = addMinutes(current, 15);
    }
  }
  console.log('Available times calculated:', availableTimes);
  return availableTimes;
};
