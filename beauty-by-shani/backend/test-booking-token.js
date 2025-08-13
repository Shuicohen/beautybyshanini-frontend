// Test script to create a booking and get its token
const fetch = require('node-fetch');

const createTestBooking = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: '1', // Assuming service ID 1 exists
        date: '2025-08-10',
        time: '14:00',
        client_name: 'Test User',
        client_phone: '+1234567890',
        client_email: 'test@example.com',
        language: 'en'
      }),
    });

    if (response.ok) {
      const booking = await response.json();
      console.log('✅ Test booking created successfully!');
      console.log('📋 Booking ID:', booking.id);
      console.log('🔑 Token:', booking.token);
      console.log('🔗 Management URL: http://localhost:5173/manage?token=' + booking.token);
      
      // Test the booking details endpoint
      const detailsResponse = await fetch(`http://localhost:3000/api/bookings/details/${booking.token}`);
      if (detailsResponse.ok) {
        const details = await detailsResponse.json();
        console.log('✅ Booking details endpoint works!');
        console.log('📝 Details:', details);
      } else {
        console.log('❌ Booking details endpoint failed:', await detailsResponse.text());
      }
    } else {
      console.log('❌ Failed to create booking:', await response.text());
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

createTestBooking();
