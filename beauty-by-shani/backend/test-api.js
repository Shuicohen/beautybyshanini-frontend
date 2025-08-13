// Test script to check services and create a booking
const fetch = require('node-fetch');

const testAPI = async () => {
  try {
    // First, check available services
    console.log('🔍 Checking available services...');
    const servicesResponse = await fetch('http://localhost:3000/api/services');
    if (servicesResponse.ok) {
      const services = await servicesResponse.json();
      console.log('✅ Services found:', services.length);
      services.forEach(service => {
        console.log(`  - ID: ${service.id}, Name: ${service.name}`);
      });
      
      if (services.length > 0) {
        // Try to create a booking with the first service
        const firstService = services[0];
        console.log(`\n📝 Creating test booking with service: ${firstService.name}`);
        
        const bookingResponse = await fetch('http://localhost:3000/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service_id: firstService.id,
            date: '2025-08-10',
            time: '14:00',
            client_name: 'Test User',
            client_phone: '+1234567890',
            client_email: 'test@example.com',
            language: 'en'
          }),
        });

        if (bookingResponse.ok) {
          const booking = await bookingResponse.json();
          console.log('✅ Test booking created successfully!');
          console.log('📋 Booking ID:', booking.id);
          console.log('🔑 Token:', booking.token);
          console.log('🔗 Management URL: http://localhost:5173/manage?token=' + booking.token);
        } else {
          const errorText = await bookingResponse.text();
          console.log('❌ Failed to create booking:', errorText);
        }
      } else {
        console.log('❌ No services found in database');
      }
    } else {
      const errorText = await servicesResponse.text();
      console.log('❌ Failed to get services:', errorText);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testAPI();
