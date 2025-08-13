

import { Request, Response } from 'express';
import { addAvailability, getAvailableSlots } from '../models/availability';
import { getBusySlots } from '../services/googleCalendarService';
import pool from '../utils/db';
import { format, parseISO } from 'date-fns';

export const getAvailability = async (req: Request, res: Response) => {
  const { day, serviceId } = req.query;

  if (!day || !serviceId) {
    return res.status(400).json({ error: 'Day and serviceId are required' });
  }

  try {
    console.log('getAvailability called with:', { day, serviceId });
    const serviceRes = await pool.query('SELECT duration FROM services WHERE id = $1', [serviceId]);
    if (!serviceRes.rows[0]) {
      console.log('Service not found for id:', serviceId);
      return res.status(404).json({ error: 'Service not found' });
    }
    const serviceDuration = serviceRes.rows[0].duration;
    console.log('Service duration:', serviceDuration);

    const availableTimes = await getAvailableSlots(day as string, serviceDuration);
    console.log('Available times returned:', availableTimes);
    res.json({ availableTimes });
  } catch (error) {
    console.error('Error in getAvailability:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const setAvailability = async (req: Request, res: Response) => {
  const { day, start_time, end_time } = req.body;

  if (!day || !start_time || !end_time) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const newAvail = await addAvailability({ day, start_time, end_time, is_blocked: false });
    res.status(201).json(newAvail);
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const blockTime = async (req: Request, res: Response) => {
  const { day, start_time, end_time, reason } = req.body;

  if (!day || !start_time || !end_time) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const blocked = await addAvailability({ day, start_time, end_time, is_blocked: true, block_reason: reason });
    res.status(201).json(blocked);
  } catch (error) {
    res.status(500).json({ error });
  }
};

// Returns all dates with at least one available slot for a service in the next 60 days
export const getAvailableDates = async (req: Request, res: Response) => {
  const { serviceId } = req.query;
  try {
    if (!serviceId) {
      // Return all available dates for all services (admin view)
      const result = await pool.query('SELECT DISTINCT day FROM availability WHERE is_blocked = false');
      const availableDates = result.rows.map(row => format(new Date(row.day), 'yyyy-MM-dd'));
      return res.json({ availableDates });
    }
    // Get the service duration
    const serviceRes = await pool.query('SELECT duration FROM services WHERE id = $1', [serviceId]);
    if (!serviceRes.rows[0]) {
      return res.status(404).json({ error: 'Service not found' });
    }
    const serviceDuration = serviceRes.rows[0].duration;

    // Check the next 14 days for available slots in parallel (much faster)
    const today = new Date();
    const days = Array.from({ length: 14 }, (_, i) => {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      return format(day, 'yyyy-MM-dd');
    });

    // Start timing
    const start = Date.now();
    const slotsResults = await Promise.all(days.map(dayStr => getAvailableSlots(dayStr, serviceDuration)));
    const availableDates = days.filter((dayStr, idx) => slotsResults[idx] && slotsResults[idx].length > 0);
    // End timing
    const end = Date.now();
    console.log(`getAvailableDates completed in ${end - start}ms, found ${availableDates.length} available days.`);
    res.json({ availableDates });
  } catch (error) {
    console.error('Error in getAvailableDates:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Google Calendar sync is disabled for now
export const syncGoogleCalendar = async (req: Request, res: Response) => {
  res.json({ message: 'Google Calendar sync is disabled.' });
};

// Get raw availability data for admin purposes
export const getAdminAvailability = async (req: Request, res: Response) => {
  const { day } = req.query;

  if (!day) {
    return res.status(400).json({ error: 'Day is required' });
  }

  try {
    console.log('getAdminAvailability called with day:', day);
    
    // Get all availability records for the day
    const result = await pool.query(
      'SELECT id, start_time, end_time, is_blocked, block_reason FROM availability WHERE day = $1 ORDER BY start_time',
      [day]
    );
    
    const availableSlots: { start_time: string; end_time: string }[] = [];
    const blockedSlots: { id: string; start_time: string; end_time: string; reason?: string }[] = [];
    
    result.rows.forEach(row => {
      if (row.is_blocked) {
        blockedSlots.push({
          id: row.id,
          start_time: row.start_time,
          end_time: row.end_time,
          reason: row.block_reason
        });
      } else {
        availableSlots.push({
          start_time: row.start_time,
          end_time: row.end_time
        });
      }
    });
    
    console.log('Admin availability data:', { availableSlots, blockedSlots });
    res.json({ availableSlots, blockedSlots });
  } catch (error) {
    console.error('Error in getAdminAvailability:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Unblock a specific time slot
export const unblockTime = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Block ID is required' });
  }

  try {
    console.log('unblockTime called with id:', id);
    
    // Delete the blocked time entry
    const result = await pool.query(
      'DELETE FROM availability WHERE id = $1 AND is_blocked = true RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blocked time not found' });
    }
    
    console.log('Successfully unblocked time:', result.rows[0]);
    res.json({ success: true, message: 'Time unblocked successfully', unblocked: result.rows[0] });
  } catch (error) {
    console.error('Error in unblockTime:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

