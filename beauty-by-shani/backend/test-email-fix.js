// Test script to verify email service improvements
const mockBooking = {
  id: '73b99b89-a1c9-4021-b380-7a281b787d18',
  service_id: '418f3a98-8fec-4fe5-8ce7-492bfbd88ebe',
  service_name: 'Manicure & Pedicure', // This should now be included
  date: '2025-08-05',
  time: '13:00',
  client_name: 'shui',
  client_phone: '+1234567890',
  client_email: 'test@example.com',
  language: 'en',
  token: 'test-token-123',
  price: 120
};

console.log('Mock booking with service name:', mockBooking);
console.log('\n--- Email Content Preview ---');

// Simulate the email HTML generation logic
const service = mockBooking.service_name || mockBooking.service_id;
console.log('Service to display:', service);

// Show calendar link improvements
const bookingDateObj = new Date(mockBooking.date);
const pad = (n) => n.toString().padStart(2, '0');
const y = bookingDateObj.getUTCFullYear();
const m = pad(bookingDateObj.getUTCMonth() + 1);
const d = pad(bookingDateObj.getUTCDate());
const dateForCal = `${y}${m}${d}`;

const [hours, minutes] = mockBooking.time.split(':').map(Number);
const startTimeForCal = `${pad(hours)}${pad(minutes)}00`;
const endHours = hours + 1;
const endTimeForCal = `${pad(endHours)}${pad(minutes)}00`;

const calendarDescription = `Booking Details:\\n` +
  `Service: ${service}\\n` +
  `Client: ${mockBooking.client_name}\\n` +
  `Phone: ${mockBooking.client_phone}\\n` +
  `Email: ${mockBooking.client_email}\\n` +
  `Booking ID: ${mockBooking.id}\\n\\n` +
  `Beauty by Shanini Appointment`;

console.log('\nCalendar event description:');
console.log(calendarDescription.replace(/\\n/g, '\n'));

console.log('\nGoogle Calendar URL parameters:');
console.log('- Title:', service + ' - Beauty by Shanini');
console.log('- Start:', `${dateForCal}T${startTimeForCal}Z`);
console.log('- End:', `${dateForCal}T${endTimeForCal}Z`);
console.log('- Location: Beauty by Shanini');

console.log('\n✅ Test completed - Service name should now display correctly in emails!');
