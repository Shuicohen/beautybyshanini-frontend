const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'beauty_booking',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function checkDatabaseSchema() {
  console.log('🔍 Checking Database Schema and Data\n');
  
  try {
    // Check services table structure
    console.log('📋 Services table structure:');
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'services'
      ORDER BY ordinal_position;
    `);
    console.table(tableInfo.rows);
    
    // Check actual services data
    console.log('\n📊 Services data:');
    const services = await pool.query('SELECT id, name, duration, price, is_addon FROM services LIMIT 10');
    console.table(services.rows);
    
    // Check booking table structure
    console.log('\n📋 Bookings table structure:');
    const bookingTableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position;
    `);
    console.table(bookingTableInfo.rows);
    
    // Check specific booking from the ICS file
    const bookingId = '78c8750b-ba35-46a1-904b-cf7966c55044';
    console.log(`\n🎯 Checking specific booking: ${bookingId}`);
    
    const booking = await pool.query(`
      SELECT 
        b.*, 
        s.name as service_name, 
        s.duration as service_duration,
        s.price
      FROM bookings b 
      JOIN services s ON b.service_id = s.id 
      WHERE b.id = $1
    `, [bookingId]);
    
    if (booking.rows.length > 0) {
      console.log('📊 Booking details:');
      console.log(JSON.stringify(booking.rows[0], null, 2));
    } else {
      console.log('❌ Booking not found');
    }
    
    // Check if booking_addons table exists
    console.log('\n🔍 Checking booking_addons table:');
    try {
      const addonsTableInfo = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'booking_addons'
        ORDER BY ordinal_position;
      `);
      console.table(addonsTableInfo.rows);
      
      // Check add-ons for the specific booking
      const bookingAddons = await pool.query(`
        SELECT ba.*, s.name, s.duration, s.price
        FROM booking_addons ba
        JOIN services s ON ba.addon_id = s.id
        WHERE ba.booking_id = $1
      `, [bookingId]);
      
      console.log('📊 Booking add-ons:');
      console.table(bookingAddons.rows);
      
    } catch (error) {
      console.log('❌ booking_addons table does not exist');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseSchema();
