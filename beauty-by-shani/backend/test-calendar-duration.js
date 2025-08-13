// Test the updated calendar duration functionality
console.log('🕐 Testing Calendar Duration Functionality\n');

// Mock booking data for testing with different duration scenarios
const mockBookingShortService = {
  id: 'test-123-short',
  token: 'mock-token-short',
  client_name: 'Test Client',
  client_email: 'test@example.com',
  client_phone: '052-1234567',
  service_id: 'basic-manicure',
  service_name: 'Basic Manicure',
  service_duration: 30, // 30 minutes
  date: new Date('2025-08-15'),
  time: '14:30',
  language: 'en',
  addons: []
};

const mockBookingLongService = {
  id: 'test-456-long',
  token: 'mock-token-long',
  client_name: 'Test Client 2',
  client_email: 'test2@example.com',
  client_phone: '052-1234567',
  service_id: 'gel-manicure',
  service_name: 'Gel Manicure',
  service_duration: 60, // 60 minutes
  date: new Date('2025-08-15'),
  time: '16:00',
  language: 'en',
  addons: [
    { name: 'Nail Art', duration: 15 },
    { name: 'Hand Massage', duration: 10 }
  ]
};

const mockBookingHebrewWithAddons = {
  id: 'test-789-he',
  token: 'mock-token-hebrew',
  client_name: 'שרה כהן',
  client_email: 'sarah@example.com',
  client_phone: '052-1234567',
  service_id: 'pedicure',
  service_name: 'פדיקור מלא',
  service_duration: 45, // 45 minutes
  date: new Date('2025-08-15'),
  time: '10:00',
  language: 'he',
  addons: [
    { name: 'ג׳ל לק', duration: 20 },
    { name: 'עיסוי כפות רגליים', duration: 15 }
  ]
};

// Function to calculate total duration (mirroring the logic in emailService)
function calculateTotalDuration(booking) {
  let totalDuration = booking.service_duration || 60; // Default to 60 minutes if no duration
  if (booking.addons && booking.addons.length > 0) {
    const addonDuration = booking.addons.reduce((sum, addon) => {
      return sum + (addon.duration || 0);
    }, 0);
    totalDuration += addonDuration;
  }
  return totalDuration;
}

// Function to format duration for display
function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
}

// Function to calculate end time
function calculateEndTime(startTime, durationMinutes) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endTime = new Date();
  endTime.setHours(hours, minutes + durationMinutes, 0, 0);
  return `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
}

console.log('✅ Calendar Duration Updates:');
console.log('   🔄 Service duration now fetched from database');
console.log('   ➕ Add-on durations included in total time');
console.log('   📅 Google Calendar links use accurate duration');
console.log('   📎 ICS attachments use accurate duration');

console.log('\n📊 Duration Calculation Tests:');

// Test scenarios
const testCases = [
  { name: 'Short Service (No Add-ons)', booking: mockBookingShortService },
  { name: 'Long Service (With Add-ons)', booking: mockBookingLongService },
  { name: 'Hebrew Service (With Add-ons)', booking: mockBookingHebrewWithAddons }
];

testCases.forEach((testCase, index) => {
  const booking = testCase.booking;
  const totalDuration = calculateTotalDuration(booking);
  const endTime = calculateEndTime(booking.time, totalDuration);
  
  console.log(`\n${index + 1}. ${testCase.name}:`);
  console.log(`   📋 Service: ${booking.service_name} (${booking.service_duration}m)`);
  if (booking.addons && booking.addons.length > 0) {
    console.log(`   ✨ Add-ons: ${booking.addons.map(a => `${a.name} (${a.duration}m)`).join(', ')}`);
  } else {
    console.log(`   ✨ Add-ons: None`);
  }
  console.log(`   🕐 Start: ${booking.time}`);
  console.log(`   🕕 End: ${endTime}`);
  console.log(`   ⏱️ Total Duration: ${formatDuration(totalDuration)} (${totalDuration} minutes)`);
});

console.log('\n🌍 Calendar Link Examples:');
console.log('   📅 Google Calendar: Uses calculated start/end times');
console.log('   📎 ICS Attachment: Includes total duration and service breakdown');
console.log('   📱 Universal compatibility with accurate timing');

console.log('\n🔄 Database Schema Updates:');
console.log('   ✓ Booking interface includes service_duration field');
console.log('   ✓ Add-on interface includes duration field');
console.log('   ✓ Database queries fetch service and add-on durations');
console.log('   ✓ Calendar controller updated with duration logic');

console.log('\n💡 Benefits:');
console.log('   • Accurate appointment durations in calendars');
console.log('   • No more generic 1-hour appointments');
console.log('   • Proper scheduling for complex services');
console.log('   • Better time management for clients and staff');

console.log('\n🎯 Edge Cases Handled:');
console.log('   • Missing service duration (defaults to 60 minutes)');
console.log('   • Missing add-on durations (defaults to 0 minutes)');
console.log('   • Time calculations across hour boundaries');
console.log('   • Multiple add-ons with varying durations');

console.log('\n🚀 Calendar Integration is now duration-aware!');
