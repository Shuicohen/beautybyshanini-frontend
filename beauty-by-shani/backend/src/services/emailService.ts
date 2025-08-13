import nodemailer from 'nodemailer';
import { Booking } from '../models/booking';
import * as ics from 'ics';
import { EventAttributes } from 'ics';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS,
  },
});

const getSubject = (lang: string, type: 'confirmation' | 'reminder') => {
  if (type === 'confirmation') return lang === 'en' ? 'Booking Confirmation' : 'אישור הזמנה';
  return lang === 'en' ? 'Booking Reminder' : 'תזכורת הזמנה';
};

const generateICSAttachment = (booking: Booking) => {
  console.log('📧 Generating ICS for booking:', {
    id: booking.id,
    service_name: booking.service_name,
    service_duration: booking.service_duration,
    addons: booking.addons
  });

  const service = booking.service_name || booking.service_id;
  const bookingDateObj = typeof booking.date === 'string' ? new Date(booking.date) : booking.date;
  
  // Parse time
  const [hours, minutes] = booking.time.split(':').map(Number);
  
  // Calculate total duration: service duration + add-ons durations
  let totalDuration = booking.service_duration || 60; // Default to 60 minutes if no duration
  if (booking.addons && booking.addons.length > 0) {
    const addonDuration = booking.addons.reduce((sum, addon) => {
      return sum + (addon.duration || 0);
    }, 0);
    totalDuration += addonDuration;
  }
  
  // Create start and end date objects
  const startDate = new Date(bookingDateObj);
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + totalDuration);
  
  // Enhanced description for calendar with detailed breakdown
  let addOnsText = '';
  if (booking.addons && booking.addons.length > 0) {
    addOnsText = '\nAdd-ons:';
    addOnsText += booking.addons.map(a => `\n  - ${a.name}${a.duration ? ` (${a.duration} min)` : ''}`).join('');
  }
  const description = `Booking Details:
Service: ${service} (${booking.service_duration || 60} min)${addOnsText}
Total Duration: ${totalDuration} minutes
Client: ${booking.client_name}
Phone: ${booking.client_phone}
Email: ${booking.client_email}
Booking ID: ${booking.id}

Beauty by Shanini Appointment`;

  const event: EventAttributes = {
    start: [startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate(), startDate.getHours(), startDate.getMinutes()],
    end: [endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate(), endDate.getHours(), endDate.getMinutes()],
    title: `${service} - Beauty by Shanini`,
    description: description,
    location: 'Beauty by Shanini',
    uid: `${booking.id}@beautybyshanini.com`,
    status: 'CONFIRMED',
    alarms: [{
      action: 'display',
      description: `Reminder: ${service} appointment in 1 hour`,
      trigger: { hours: 1, before: true }
    }]
  };

  const { error, value } = ics.createEvent(event);
  
  if (error) {
    console.error('Error creating ICS:', error);
    return null;
  }
  
  return value;
};

const getHtml = (booking: Booking, type: 'confirmation' | 'reminder') => {
  const lang = booking.language;
  const base = process.env.BASE_URL;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const manageLink = `${frontendUrl}/manage?token=${booking.token}&lang=${lang}`;
  const bookingDateObj = typeof booking.date === 'string' ? new Date(booking.date) : booking.date;
  const bookingDateStr = bookingDateObj.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  const bookingTime = booking.time;
  
  // Use service_name if available, fallback to service_id
  const service = booking.service_name || booking.service_id;
  const bookingId = booking.id;

  // Format date and time for calendar links
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = bookingDateObj.getUTCFullYear();
  const m = pad(bookingDateObj.getUTCMonth() + 1);
  const d = pad(bookingDateObj.getUTCDate());
  const dateForCal = `${y}${m}${d}`;
  
  // Parse time and convert to UTC format for calendar
  const [hours, minutes] = bookingTime.split(':').map(Number);
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

  // Enhanced description for calendar with detailed breakdown
  let addOnsText = '';
  if (booking.addons && booking.addons.length > 0) {
    addOnsText = '\nAdd-ons:';
    addOnsText += booking.addons.map(a => `\n  - ${a.name}${a.duration ? ` (${a.duration} min)` : ''}`).join('');
  }
  const calendarDescription = `Booking Details:
Service: ${service} (${booking.service_duration || 60} min)${addOnsText}
Total Duration: ${totalDuration} minutes
Client: ${booking.client_name}
Phone: ${booking.client_phone}
Email: ${booking.client_email}
Booking ID: ${bookingId}

Beauty by Shanini Appointment`;

  // Google Calendar link with enhanced details
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(service + ' - Beauty by Shanini')}&dates=${dateForCal}T${startTimeForCal}Z/${dateForCal}T${endTimeForCal}Z&details=${encodeURIComponent(calendarDescription)}&location=${encodeURIComponent('Beauty by Shanini')}`;

  // Apple Calendar ICS file link - using dedicated endpoint for email compatibility
  const icsLink = `${base}/api/bookings/calendar/${booking.token}`;

  // Define text content based on language
  const content = lang === 'he' ? {
    title: '✨ ביוטי ביי שניני ✨',
    subtitle: type === 'confirmation' ? 'התור שלך אושר' : 'תזכורת לתור',
    confirmed: type === 'confirmation' ? 'תור אושר!' : 'תזכורת לתור',
    bookingDetails: '📋 פרטי התור',
    service: '💅 שירות:',
    addOns: '✨ תוספות:',
    date: '📅 תאריך:',
    time: '🕐 שעה:',
    name: '👤 שם:',
    bookingId: '🔖 מספר תור:',
    addToCalendar: '📅 הוסף ליומן שלך',
    addToGoogle: '📅 הוסף ליומן גוגל',
    calendarNote: '💡 קובץ יומן מצורף למייל זה - פתח אותו כדי להוסיף את התור ליומן שלך',
    needChanges: '⚠️ צריכה לשנות משהו?',
    manageLink: 'לבטל או לקבוע תור מחדש',
    changesNote: 'שינויים חייבים להיעשות לפחות 20 שעות לפני התור שלך',
    questionsTitle: '💌 יש שאלות? אנחנו כאן לעזור!',
    questionsText: 'פשוט השיבי למייל הזה או צרי איתנו קשר ישירות',
    footerText: '<strong>ביוטי ביי שניני</strong> • קליניקת ציפורניים מקצועי, נקי ונעים<br>✨ יוצרת אומנות בידיים שלך ✨',
    direction: 'rtl'
  } : {
    title: '✨ Beauty by Shanini ✨',
    subtitle: type === 'confirmation' ? 'Your appointment is confirmed!' : 'Appointment reminder',
    confirmed: type === 'confirmation' ? 'Booking Confirmed!' : 'Appointment Reminder',
    bookingDetails: '📋 Booking Details',
    service: '💅 Service:',
    addOns: '✨ Add-ons:',
    date: '📅 Date:',
    time: '🕐 Time:',
    name: '👤 Name:',
    bookingId: '🔖 Booking ID:',
    addToCalendar: '📅 Add to Your Calendar',
    addToGoogle: '📅 Add to Google Calendar',
    calendarNote: '� A calendar file is attached to this email - open it to add the appointment to your calendar',
    needChanges: '⚠️ Need to make changes?',
    manageLink: 'Cancel or Reschedule Appointment',
    changesNote: 'Changes must be made at least 20 hours before your appointment',
    questionsTitle: '💌 Questions? We\'re here to help!',
    questionsText: 'Simply reply to this email or contact us directly',
    footerText: '<strong>Beauty by Shanini</strong> • Your professional, clean and relaxing studio<br>✨ Creating art in your hands ✨',
    direction: 'ltr'
  };

  return `
    <!DOCTYPE html>
    <html dir="${content.direction}" lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${type === 'confirmation' ? 'Booking Confirmed' : 'Booking Reminder'}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;600;700&display=swap');
        body, table, td, p, h1, h2, h3 {
          font-family: ${lang === 'he' ? '"Rubik", ' : ''}'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        .rtl-text {
          direction: ${content.direction};
          text-align: ${lang === 'he' ? 'right' : 'left'};
        }
        .center-text {
          text-align: center;
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5;" class="rtl-text">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #FFF5F8 0%, #FFFFFF 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.12); max-width: 600px;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #FFB3C6 0%, #FF8FA3 100%); padding: 30px 40px;" class="center-text">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ${content.title}
                  </h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">
                    ${content.subtitle}
                  </p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px;" class="rtl-text">
                  
                  <!-- Success Icon & Title -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                    <tr>
                      <td align="center">
                        <table cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                          <tr>
                            <td align="center" style="width: 80px; height: 80px; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); border-radius: 40px; text-align: center; vertical-align: middle; box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3); line-height: 80px;">
                              <span style="color: white; font-size: 40px; display: inline-block; vertical-align: middle; line-height: 1;">✓</span>
                            </td>
                          </tr>
                        </table>
                        <h2 style="color: #333; margin: 0; font-size: 24px; font-weight: bold;">
                          ${content.confirmed}
                        </h2>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Booking Details Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); margin-bottom: 30px; border: 1px solid #f0f0f0;">
                    <tr>
                      <td style="padding: 30px;" class="rtl-text">
                        <h3 style="color: #FFB3C6; margin: 0 0 20px 0; font-size: 18px; font-weight: bold; border-bottom: 2px solid #FFE4E1; padding-bottom: 10px;">
                          ${content.bookingDetails}
                        </h3>
                        
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="font-weight: bold; color: #555; width: 30%; vertical-align: top; padding: 8px 0;" class="rtl-text">${content.service}</td>
                            <td style="color: #333; padding: 8px 0; font-size: 16px; font-weight: 600;" class="rtl-text">${service}</td>
                          </tr>
                          ${booking.addons && booking.addons.length > 0 ? `
                          <tr>
                            <td style="font-weight: bold; color: #555; width: 30%; vertical-align: top; padding: 8px 0;" class="rtl-text">${content.addOns}</td>
                            <td style="color: #333; padding: 8px 0; font-size: 16px;" class="rtl-text">${booking.addons.map(a => a.name).join(', ')}</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="font-weight: bold; color: #555; width: 30%; vertical-align: top; padding: 8px 0;" class="rtl-text">${content.date}</td>
                            <td style="color: #333; padding: 8px 0; font-size: 16px;" class="rtl-text">${bookingDateStr}</td>
                          </tr>
                          <tr>
                            <td style="font-weight: bold; color: #555; width: 30%; vertical-align: top; padding: 8px 0;" class="rtl-text">${content.time}</td>
                            <td style="color: #333; padding: 8px 0; font-size: 16px; font-weight: 600;" class="rtl-text">${bookingTime}</td>
                          </tr>
                          <tr>
                            <td style="font-weight: bold; color: #555; width: 30%; vertical-align: top; padding: 8px 0;" class="rtl-text">${content.name}</td>
                            <td style="color: #333; padding: 8px 0; font-size: 16px;" class="rtl-text">${booking.client_name}</td>
                          </tr>
                          <tr>
                            <td style="font-weight: bold; color: #555; width: 30%; vertical-align: top; padding: 8px 0;" class="rtl-text">${content.bookingId}</td>
                            <td style="color: #888; padding: 8px 0; font-size: 14px; font-family: monospace; background: #f8f9fa; padding: 6px 8px; border-radius: 4px;">${bookingId}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Calendar Buttons -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                    <tr>
                      <td align="center">
                        <h3 style="color: #333; margin: 0 0 20px 0; font-size: 18px; font-weight: bold;">
                          ${content.addToCalendar}
                        </h3>
                        
                        <!-- Google Calendar Button -->
                        <table cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
                          <tr>
                            <td>
                              <a href="${googleCalendarUrl}" style="display: inline-block; background: linear-gradient(135deg, #4285f4 0%, #3367d6 100%); color: white; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 16px rgba(66, 133, 244, 0.3); transition: all 0.3s ease;">
                                ${content.addToGoogle}
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="color: #888; font-size: 14px; margin: 15px 0 0 0; font-style: italic;">
                          ${content.calendarNote}
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Management Link -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border-radius: 12px; border: 1px solid #ffeaa7; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 20px; text-align: center;">
                        <p style="color: #856404; margin: 0 0 10px 0; font-weight: bold; font-size: 16px;">
                          ${content.needChanges}
                        </p>
                        <a href="${manageLink}" style="color: #FF6B6B; font-weight: bold; text-decoration: none; font-size: 16px; border-bottom: 2px solid #FF6B6B;">
                          ${content.manageLink}
                        </a>
                        <p style="color: #856404; margin: 10px 0 0 0; font-size: 14px;">
                          ${content.changesNote}
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #f8f9fa; padding: 30px 40px; border-top: 1px solid #e9ecef; text-align: center;">
                  <p style="color: #6c757d; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
                    ${content.questionsTitle}
                  </p>
                  <p style="color: #6c757d; margin: 0 0 15px 0; font-size: 14px;">
                    ${content.questionsText}
                  </p>
                  <p style="color: #6c757d; margin: 0; font-size: 14px;">
                    ${content.footerText}
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const sendConfirmationEmail = async (booking: Booking) => {
  // Generate ICS attachment
  const icsContent = generateICSAttachment(booking);
  const service = booking.service_name || booking.service_id;
  
  const mailOptions = {
    from: process.env.NODEMAILER_USER,
    to: booking.client_email,
    subject: getSubject(booking.language, 'confirmation'),
    html: getHtml(booking, 'confirmation'),
    attachments: icsContent ? [{
      filename: `beauty-appointment-${booking.id}.ics`,
      content: icsContent,
      contentType: 'text/calendar; charset=utf-8; method=REQUEST'
    }] : []
  };

  // Send to client
  await transporter.sendMail(mailOptions);
  
  // Send to admin (NODEMAILER_USER)
  await transporter.sendMail({
    from: process.env.NODEMAILER_USER,
    to: process.env.NODEMAILER_USER,
    subject: `New Booking: ${booking.client_name} on ${booking.date} at ${booking.time}`,
    html: getHtml(booking, 'confirmation'),
    attachments: icsContent ? [{
      filename: `beauty-appointment-${booking.id}.ics`,
      content: icsContent,
      contentType: 'text/calendar; charset=utf-8; method=REQUEST'
    }] : []
  });
};

export const sendReminderEmail = async (booking: Booking) => {
  // Generate ICS attachment
  const icsContent = generateICSAttachment(booking);
  
  await transporter.sendMail({
    from: process.env.NODEMAILER_USER,
    to: booking.client_email,
    subject: getSubject(booking.language, 'reminder'),
    html: getHtml(booking, 'reminder'),
    attachments: icsContent ? [{
      filename: `beauty-appointment-${booking.id}.ics`,
      content: icsContent,
      contentType: 'text/calendar; charset=utf-8; method=REQUEST'
    }] : []
  });
};