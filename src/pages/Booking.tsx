import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useLanguage } from '../contexts/LanguageContext';
import useApi from '../hooks/useApi';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Modal from '../components/Modal';
import { format } from 'date-fns';
import { Link, useSearchParams } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

type Step = 1 | 2 | 3 | 4 | 5 | 6;

interface FormData {
  name: string;
  phone: string;
  email: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  is_addon: boolean;
}

const formatDuration = (min: number) => {
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  return `${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : ''} ${minutes > 0 ? `${minutes} min` : ''}`.trim();
}

const Booking = () => {
  // Cache for available dates per service
  const [datesCache, setDatesCache] = useState<{ [serviceId: string]: Date[] }>({});
  const [loadingDates, setLoadingDates] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [addOns, setAddOns] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<Service[]>([]);
  // ...existing code...
  const { t, language, setLanguage } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // Track calendar's active month/year
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  useEffect(() => {
    console.log('Available Dates:', availableDates);
  }, [availableDates]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [formData, setFormData] = useState<FormData | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [bookingCompleted, setBookingCompleted] = useState(false);
  const api = useApi();
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>();
  const [searchParams] = useSearchParams();
  const [isReschedule, setIsReschedule] = useState(false);
  const [rescheduleToken, setRescheduleToken] = useState<string | null>(null);

  // Handle reschedule parameters and service pre-selection
  useEffect(() => {
    const reschedule = searchParams.get('reschedule');
    const token = searchParams.get('token');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const serviceId = searchParams.get('service');
    const urlLanguage = searchParams.get('lang');

    // Set language from URL parameter if provided
    if (urlLanguage && (urlLanguage === 'en' || urlLanguage === 'he')) {
      setLanguage(urlLanguage);
    }

    if (reschedule === 'true' && token) {
      setIsReschedule(true);
      setRescheduleToken(token);
      
      // Pre-fill form data
      if (name) setValue('name', decodeURIComponent(name));
      if (email) setValue('email', decodeURIComponent(email));
      if (phone) setValue('phone', decodeURIComponent(phone));
      
      // Pre-select service for reschedule
      if (serviceId && services.length > 0) {
        const service = services.find(s => s.id === serviceId);
        if (service) {
          setSelectedService(service);
          setStep(3); // Skip to date selection for reschedule
        }
      }
    } else if (serviceId && services.length > 0) {
      // Pre-select service from homepage click (not reschedule)
      const service = services.find(s => s.id === serviceId);
      if (service) {
        setSelectedService(service);
        setStep(2); // Go to add-ons selection step
      }
    }
  }, [searchParams, services, setValue]);
  useEffect(() => {
    // Fetch main services and add-ons separately
    Promise.all([
      api.get('/api/services/main'),
      api.get('/api/services/addons')
    ]).then(([mainServicesData, addOnsData]: [Service[], Service[]]) => {
      setServices(mainServicesData);
      setAddOns(addOnsData);
      
      // Preload available dates for main services only
      mainServicesData.forEach(service => {
        api.get(`/api/availability/dates?serviceId=${service.id}`)
          .then((data) => {
            setDatesCache(prev => ({
              ...prev,
              [service.id]: (data.availableDates || []).map((d: string) => new Date(d))
            }));
          })
          .catch((err) => {
            console.error(`Error preloading available dates for service ${service.id}:`, err);
          });
      });
    }).catch((error) => {
      console.error('Error fetching services:', error);
      // Fallback to the original endpoint if the new endpoints don't work
      api.get('/api/services').then((allServices: Service[]) => {
        const mainServices = allServices.filter(s => !s.is_addon);
        const addOnServices = allServices.filter(s => s.is_addon);
        setServices(mainServices);
        setAddOns(addOnServices);
        
        // Preload available dates for main services only
        mainServices.forEach(service => {
          api.get(`/api/availability/dates?serviceId=${service.id}`)
            .then((data) => {
              setDatesCache(prev => ({
                ...prev,
                [service.id]: (data.availableDates || []).map((d: string) => new Date(d))
              }));
            })
            .catch((err) => {
              console.error(`Error preloading available dates for service ${service.id}:`, err);
            });
        });
      }).catch((fallbackError) => {
        console.error('Error fetching services from fallback endpoint:', fallbackError);
      });
    });
  }, []);
  useEffect(() => {
    if (selectedService) {
      // If cached, use instantly
      if (datesCache[selectedService.id]) {
        setAvailableDates(datesCache[selectedService.id]);
        setLoadingDates(false);
      } else {
        setLoadingDates(true);
        api.get(`/api/availability/dates?serviceId=${selectedService.id}`)
          .then((data) => {
            const dates = (data.availableDates || []).map((d: string) => new Date(d));
            setAvailableDates(dates);
            setDatesCache(prev => ({ ...prev, [selectedService.id]: dates }));
          })
          .catch((err) => {
            console.error('Error fetching available dates:', err);
          })
          .finally(() => {
            setLoadingDates(false);
          });
      }
    } else {
      setAvailableDates([]);
      setLoadingDates(false);
    }
  }, [selectedService]);
  useEffect(() => {
    if (selectedDate && selectedService) {
      const day = format(selectedDate, 'yyyy-MM-dd');
      api.get(`/api/availability?day=${day}&serviceId=${selectedService.id}`).then((data) => setAvailableTimes(data.availableTimes));
    }
  }, [selectedDate, selectedService]);
  const onSubmit = (data: FormData) => {
    setFormData(data);
    setStep(6);
  };
  const confirmBooking = async () => {
    if (formData && selectedService && selectedDate && !isBookingLoading && !bookingCompleted) {
      setIsBookingLoading(true);
      try {
        // If this is a reschedule, cancel the old booking first
        if (isReschedule && rescheduleToken) {
          await api.get(`/api/bookings/manage?token=${rescheduleToken}&action=cancel`);
        }

        // Create new booking
        await api.post('/api/bookings', {
          service_id: selectedService.id,
          addon_ids: selectedAddOns.map(addon => addon.id), // Include selected add-ons
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
          client_name: formData.name,
          client_phone: formData.phone,
          client_email: formData.email,
          language,
        });
        
        setBookingCompleted(true);
        setShowSuccess(true);
      } catch (error) {
        console.error('Booking failed:', error);
        alert('Failed to create booking. Please try again.');
      } finally {
        setIsBookingLoading(false);
      }
    }
  };

  const generateCalendarLinks = () => {
    if (!selectedService || !selectedDate || !selectedTime || !formData) return { googleUrl: '', icsUrl: '' };

    // Calculate total duration including add-ons
    const totalDuration = selectedService.duration + selectedAddOns.reduce((total, addon) => total + addon.duration, 0);
    const totalPrice = Number(selectedService.price || 0) + selectedAddOns.reduce((total, addon) => total + Number(addon.price || 0), 0);

    // Format date and time for calendar
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = selectedDate.getFullYear();
    const month = pad(selectedDate.getMonth() + 1);
    const day = pad(selectedDate.getDate());
    const dateForCal = `${year}${month}${day}`;
    
    // Parse time and create start/end times with total duration
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startTimeForCal = `${pad(hours)}${pad(minutes)}00`;
    const endHours = hours + Math.floor(totalDuration / 60);
    const endMinutes = minutes + (totalDuration % 60);
    const finalHours = endHours + Math.floor(endMinutes / 60);
    const finalMinutes = endMinutes % 60;
    const endTimeForCal = `${pad(finalHours)}${pad(finalMinutes)}00`;

    // Enhanced description for calendar including add-ons
    const eventTitle = `${selectedService.name} - Beauty by Shanini`;
    const addOnsText = selectedAddOns.length > 0 ? `Add-ons: ${selectedAddOns.map(addon => addon.name).join(', ')}` : '';
    const calendarDescription = `Booking Details:
Service: ${selectedService.name}${addOnsText ? '\n' + addOnsText : ''}
Client: ${formData.name}
Phone: ${formData.phone}
Email: ${formData.email}
Duration: ${formatDuration(totalDuration)}
Price: ₪${totalPrice.toFixed(2)}

Beauty by Shanini Appointment`;

    // Google Calendar URL
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${dateForCal}T${startTimeForCal}Z/${dateForCal}T${endTimeForCal}Z&details=${encodeURIComponent(calendarDescription)}&location=${encodeURIComponent('Beauty by Shanini')}`;

    // Apple Calendar (ICS file)
    const icsDescription = calendarDescription.replace(/\n/g, '\\n');
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Beauty by Shanini//EN
BEGIN:VEVENT
UID:${Date.now()}@beautybyshanini.com
DTSTART:${dateForCal}T${startTimeForCal}Z
DTEND:${dateForCal}T${endTimeForCal}Z
SUMMARY:${eventTitle}
DESCRIPTION:${icsDescription}
LOCATION:Beauty by Shanini
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Reminder: ${selectedService.name} appointment in 1 hour
END:VALARM
END:VEVENT
END:VCALENDAR`;
    
    const icsBlob = encodeURIComponent(icsContent);
    const icsUrl = `data:text/calendar;charset=utf8,${icsBlob}`;

    return { googleUrl, icsUrl };
  };

  const handleAddToCalendar = (type: 'google' | 'ios') => {
    const { googleUrl, icsUrl } = generateCalendarLinks();
    
    if (type === 'google') {
      window.open(googleUrl, '_blank');
    } else {
      // For iOS/Apple Calendar, create and trigger download of ICS file
      const link = document.createElement('a');
      link.href = icsUrl;
      link.download = `beauty-appointment-${format(selectedDate!, 'yyyy-MM-dd')}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  const steps = [1, 2, 3, 4, 5, 6];
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-butter-yellow/20 to-soft-pink/20 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-pink-accent">
          {isReschedule ? t('rescheduleYourAppointment') : t('bookYourAppointment')}
        </h1>
        <div className="flex justify-center mb-12">
          {steps.map((s, index) => (
            <motion.div 
              key={s}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`w-10 h-10 rounded-full mx-3 flex items-center justify-center text-white font-bold step-number ${
                s <= step ? 'bg-pink-accent shadow-md' : 'bg-baby-blue/50'
              }`}
            >
              {s}
            </motion.div>
          ))}
        </div>
        <motion.div 
          key={step}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-2xl shadow-soft"
        >
          {step === 1 && (
            <div>
              <h2 className="text-3xl font-bold mb-8 text-center text-text-dark">{t('selectService')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {services.map((s, idx) => {
                  const cardColors = [
                    'bg-gradient-to-br from-baby-blue/80 to-white',
                    'bg-gradient-to-br from-soft-pink/80 to-white',
                    'bg-gradient-to-br from-butter-yellow/80 to-white',
                    'bg-gradient-to-br from-pink-accent/80 to-white',
                    'bg-gradient-to-br from-green-200/80 to-white',
                    'bg-gradient-to-br from-purple-100/80 to-white',
                    'bg-gradient-to-br from-orange-100/80 to-white',
                    'bg-gradient-to-br from-cyan-100/80 to-white',
                    'bg-gradient-to-br from-lime-100/80 to-white',
                    'bg-gradient-to-br from-fuchsia-100/80 to-white',
                    'bg-gradient-to-br from-rose-100/80 to-white',
                    'bg-gradient-to-br from-amber-100/80 to-white',
                  ];
                  return (
                    <motion.button
                      key={s.id}
                      onClick={() => { setSelectedService(s); setStep(2); }}
                      whileHover={{ y: -6, scale: 1.045, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
                      className={`${cardColors[idx % cardColors.length]} relative p-4 md:p-6 rounded-2xl shadow-xl border border-white/60 text-center transition-all duration-300 hover:border-pink-accent/60 group min-h-[100px] flex flex-col items-center justify-between overflow-hidden`}
                    >
                      <div className="absolute inset-0 pointer-events-none rounded-3xl" style={{background: 'linear-gradient(120deg,rgba(255,255,255,0.10) 0%,rgba(255,255,255,0.22) 100%)'}}></div>
                      <h3 className="relative z-10 font-extrabold text-xl md:text-2xl mb-2 text-gray-900 leading-tight hyphens-auto drop-shadow-sm">{s.name}</h3>
                      <div className="relative z-10 flex flex-col items-center gap-1 mb-2">
                        <span className="text-base md:text-lg text-gray-800 font-medium">{formatDuration(s.duration)}</span>
                        <span className="text-2xl md:text-3xl font-extrabold text-pink-accent/70 tracking-tight">₪{Number(s.price).toFixed(0)}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <h2 className="text-3xl font-bold mb-8 text-center text-text-dark">{t('selectAddOns')}</h2>
              {addOns.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-center text-gray-600 mb-6">
                    {t('selectAddOns')}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addOns.map((addon) => {
                      const isSelected = selectedAddOns.some(a => a.id === addon.id);
                      return (
                        <motion.div
                          key={addon.id}
                          whileHover={{ scale: 1.02 }}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-pink-accent bg-pink-accent/10' 
                              : 'border-gray-200 hover:border-pink-accent/50'
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAddOns(selectedAddOns.filter(a => a.id !== addon.id));
                            } else {
                              setSelectedAddOns([...selectedAddOns, addon]);
                            }
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-bold text-lg">{addon.name}</h3>
                              <p className="text-sm text-gray-600">{formatDuration(addon.duration)}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-bold text-pink-accent">₪{Number(addon.price).toFixed(0)}</span>
                              {isSelected && <div className="text-green-500">✓ Selected</div>}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  <div className="text-center mt-6">
                    <button 
                      onClick={() => setStep(3)} 
                      className="bg-pink-accent text-white py-3 px-8 rounded-xl shadow-soft hover:shadow-lg transition"
                    >
                      {t('continue')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-6">{t('noAddOnsAvailable')}</p>
                  <button 
                    onClick={() => setStep(3)} 
                    className="bg-pink-accent text-white py-3 px-8 rounded-xl shadow-soft hover:shadow-lg transition"
                  >
                    {t('continue')}
                  </button>
                </div>
              )}
              <button onClick={() => setStep(1)} className="mt-6 text-pink-accent hover:underline block mx-auto">{t('back')}</button>
            </div>
          )}
          {step === 3 && (
            <div>
              <h2 className="text-3xl font-extrabold mb-8 text-center text-pink-accent drop-shadow">{t('selectDate')}</h2>
              <div className="flex justify-center items-center min-h-[500px]">
                {loadingDates ? (
                  <div className="flex flex-col items-center justify-center w-full max-w-2xl h-[500px]">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-accent mb-4"></div>
                    <span className="text-pink-accent font-semibold text-lg">Loading available dates...</span>
                  </div>
                ) : (
                  <div className="w-full max-w-2xl h-[500px] bg-white rounded-2xl shadow-soft p-4 md:p-6 flex flex-col items-center justify-center">
                    {/* Custom Calendar Header */}
                    <div className="flex items-center justify-between w-full mb-4">
                      <button
                        aria-label="Previous Month"
                        className="p-2 rounded-full bg-baby-blue/60 hover:bg-baby-blue/80 text-pink-accent shadow transition"
                        onClick={() => setCalendarDate(prev => {
                          const prevMonth = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
                          return prevMonth;
                        })}
                      >
                        &#8592;
                      </button>
                      <span className="font-bold text-xl text-pink-accent">
                        {format(calendarDate, 'MMMM yyyy')}
                      </span>
                      <button
                        aria-label="Next Month"
                        className="p-2 rounded-full bg-baby-blue/60 hover:bg-baby-blue/80 text-pink-accent shadow transition"
                        onClick={() => setCalendarDate(prev => {
                          const nextMonth = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
                          return nextMonth;
                        })}
                      >
                        &#8594;
                      </button>
                    </div>
                    <div className="calendar-container" dir="ltr">
                      <Calendar
                        onChange={(date) => { setSelectedDate(date as Date); setStep(4); }}
                        value={selectedDate}
                        minDate={new Date()}
                        activeStartDate={calendarDate}
                        calendarType="gregory"
                        className="w-full h-[400px] rounded-2xl border-none focus:outline-none ring-4 ring-pink-accent/30 focus:ring-8 focus:ring-pink-accent/40 transition text-lg"
                        tileClassName={({ date, view }) => {
                        if (view === 'month') {
                          const isAvailable = availableDates.some(d =>
                            d.getFullYear() === date.getFullYear() &&
                            d.getMonth() === date.getMonth() &&
                            d.getDate() === date.getDate()
                          );
                          const isToday = date.toDateString() === new Date().toDateString();
                            return [
                            isAvailable ? 'bg-pink-accent/60 text-black font-bold rounded-full shadow-md border-2 border-pink-accent/30 hover:bg-pink-accent/80 transition' : 'text-gray-400 opacity-50 line-through',
                            isToday ? 'border-4 border-blue-400 shadow-lg ring-4 ring-blue-300/70' : '',
                            ].join(' ');
                        }
                        return '';
                      }}
                      tileDisabled={({ date, view }) => {
                        if (view === 'month') {
                          const isAvailable = availableDates.some(d =>
                            d.getFullYear() === date.getFullYear() &&
                            d.getMonth() === date.getMonth() &&
                            d.getDate() === date.getDate()
                          );
                          return !isAvailable;
                        }
                        return false;
                      }}
                      showNavigation={false}
                    />
                    </div>
                    {/* Legend */}
                    <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                      <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-pink-accent/60 border-2 border-pink-accent/30"></span>{t('available')}</span>
                      <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-gray-400 opacity-50 line-through"></span>{t('unavailable')}</span>
                      <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-4 border-blue-400 shadow-lg ring-2 blue-yellow-300/50"></span>{t('today')}</span>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setStep(1)} className="mt-8 text-pink-accent hover:underline block mx-auto font-semibold">{t('back')}</button>
            </div>
          )}
          {step === 4 && (
            <div>
              <h2 className="text-3xl font-bold mb-8 text-center text-text-dark">{t('selectTime')}</h2>
              <div className="max-h-[400px] overflow-y-auto flex flex-col gap-4 items-center">
                {(() => {
                  const filteredTimes = availableTimes.filter((time) => {
                    // Only show times on the hour or half hour
                    const [hour, minute] = time.split(':').map(Number);
                    const timeOnHourOrHalf = minute === 0 || minute === 30;
                    
                    // If today is selected, only show times after current time
                    if (selectedDate && selectedDate.toDateString() === new Date().toDateString()) {
                      const now = new Date();
                      const currentHour = now.getHours();
                      const currentMinute = now.getMinutes();
                      const timeInMinutes = hour * 60 + minute;
                      const currentTimeInMinutes = currentHour * 60 + currentMinute;
                      
                      // Add a buffer of 30 minutes for booking preparation
                      return timeOnHourOrHalf && timeInMinutes > (currentTimeInMinutes + 30);
                    }
                    
                    return timeOnHourOrHalf;
                  });

                  if (filteredTimes.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <div className="text-6xl mb-4">⏰</div>
                        <p className="text-xl font-semibold text-gray-600 mb-2">
                          {t('noAvailableTimesForDay')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedDate && selectedDate.toDateString() === new Date().toDateString() 
                            ? t('selectFutureDateOrTryTomorrow')
                            : t('selectDifferentDate')}
                        </p>
                      </div>
                    );
                  }

                  return filteredTimes.map((time) => (
                    <motion.button
                      key={time}
                      onClick={() => { setSelectedTime(time); setStep(5); }}
                      whileHover={{ scale: 1.05 }}
                      className="bg-pink-accent/60 text-black font-bold rounded-full shadow-md border-2 border-pink-accent/30 hover:bg-pink-accent/80 transition w-full py-4"
                      style={{ maxWidth: '300px' }}
                    >
                      {time}
                    </motion.button>
                  ));
                })()}
              </div>
              <button onClick={() => setStep(3)} className="mt-6 text-pink-accent hover:underline block mx-auto">{t('back')}</button>
            </div>
          )}
          {step === 5 && (
            <form onSubmit={handleSubmit(onSubmit)}>
              <h2 className="text-3xl font-bold mb-8 text-center text-text-dark">{t('clientInfo')}</h2>
              <div className="space-y-6">
                <input {...register('name', { required: true })} placeholder={t('name')} className="block w-full p-4 border border-baby-blue/50 rounded-xl focus:border-pink-accent outline-none bg-white/50" />
                {errors.name && <p className="text-red-500 text-center">{t('requiredField')}</p>}
                <input {...register('phone', { required: true })} placeholder={t('phone')} className="block w-full p-4 border border-baby-blue/50 rounded-xl focus:border-pink-accent outline-none bg-white/50" />
                {errors.phone && <p className="text-red-500 text-center">{t('requiredField')}</p>}
                <input {...register('email', { required: true, pattern: /^\S+@\S+$/i })} placeholder={t('email')} className="block w-full p-4 border border-baby-blue/50 rounded-xl focus:border-pink-accent outline-none bg-white/50" />
                {errors.email && <p className="text-red-500 text-center">{t('validEmailRequired')}</p>}
              </div>
              <button type="submit" className="mt-8 w-full bg-pink-accent text-white py-4 rounded-xl shadow-soft hover:shadow-lg transition">{t('next')}</button>
              <button type="button" onClick={() => setStep(4)} className="mt-4 text-pink-accent hover:underline block mx-auto">{t('back')}</button>
            </form>
          )}
          {step === 6 && (
            <div>
              <h2 className="text-3xl font-bold mb-8 text-center text-text-dark">{t('confirmation')}</h2>
              <div className="bg-baby-blue/20 p-6 rounded-xl mb-8 space-y-2 booking-details">
                <p className="text-lg"><span className="font-bold">{t('service')}:</span> {selectedService?.name}</p>
                {selectedAddOns.length > 0 && (
                  <p className="text-lg">
                    <span className="font-bold">{t('addOns')}:</span> {selectedAddOns.map(addon => addon.name).join(', ')}
                  </p>
                )}
                <p className="text-lg"><span className="font-bold">{t('date')}:</span> {selectedDate ? format(selectedDate, 'PPP') : ''}</p>
                <p className="text-lg"><span className="font-bold">{t('time')}:</span> {selectedTime}</p>
                <p className="text-lg"><span className="font-bold">{t('duration')}:</span> {formatDuration(
                  (selectedService?.duration || 0) + selectedAddOns.reduce((total, addon) => total + addon.duration, 0)
                )}</p>
                <p className="text-lg"><span className="font-bold">{t('totalPrice')}:</span> ₪{
                  (() => {
                    const servicePrice = Number(selectedService?.price || 0);
                    const addOnsPrice = selectedAddOns.reduce((total, addon) => total + Number(addon.price || 0), 0);
                    return (servicePrice + addOnsPrice).toFixed(2);
                  })()
                }</p>
                <p className="text-lg"><span className="font-bold">{t('name')}:</span> {formData?.name}</p>
                <p className="text-lg"><span className="font-bold">{t('phone')}:</span> {formData?.phone}</p>
                <p className="text-lg"><span className="font-bold">{t('email')}:</span> {formData?.email}</p>
              </div>
              
              {/* Booking Button with Loading State / Back Home Button */}
              {bookingCompleted ? (
                <Link 
                  to="/"
                  className="w-full py-4 rounded-xl shadow-soft transition-all duration-300 bg-green-500 hover:bg-green-600 hover:shadow-lg text-white font-semibold flex items-center justify-center"
                >
                  <FaCheckCircle className="mr-2" />
                  {t('backToHome')}
                </Link>
              ) : (
                <button 
                  onClick={confirmBooking} 
                  disabled={isBookingLoading || bookingCompleted}
                  className={`w-full py-4 rounded-xl shadow-soft transition-all duration-300 ${
                    isBookingLoading || bookingCompleted
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-pink-accent hover:shadow-lg hover:bg-pink-accent/90'
                  } text-white font-semibold flex items-center justify-center`}
                >
                  {isBookingLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      {t('creatingBooking')}
                    </>
                  ) : (
                    t('confirmBooking')
                  )}
                </button>
              )}
              
              {/* Loading/Completion Message */}
              {isBookingLoading && !bookingCompleted && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    {t('pleaseWait')}
                  </p>
                </div>
              )}
              
              {bookingCompleted && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-green-600 font-medium">
                    {t('bookingCreated')}
                  </p>
                </div>
              )}
              
              {/* Edit Button - Only show when not loading and not completed */}
              {!isBookingLoading && !bookingCompleted && (
                <button 
                  onClick={() => setStep(5)} 
                  className="mt-4 text-pink-accent hover:underline block mx-auto"
                >
                  {t('edit')}
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
      <Modal isOpen={showSuccess} onClose={() => setShowSuccess(false)}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center p-8">
          <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-6" />
          <p className="text-2xl font-bold mb-4">{t('bookingConfirmed')}</p>
          
          {/* Email Confirmation Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <span className="text-green-600 mr-2">📧</span>
              <span className="text-green-700 font-semibold">{t('confirmationEmailSent')}</span>
            </div>
            <p className="text-sm text-green-600">
              {t('emailSentTo')} {formData?.email}
            </p>
          </div>
          
          <div className="booking-details">
            <p className="mb-2">{t('service')}: {selectedService?.name}</p>
            {selectedAddOns.length > 0 && (
              <p className="mb-2">{t('addOns')}: {selectedAddOns.map(addon => addon.name).join(', ')}</p>
            )}
            <p className="mb-2">{t('date')}: {selectedDate ? format(selectedDate, 'PPP') : ''}</p>
            <p className="mb-2">{t('time')}: {selectedTime}</p>
            <p className="mb-2">{t('duration')}: {formatDuration(
              (selectedService?.duration || 0) + selectedAddOns.reduce((total, addon) => total + addon.duration, 0)
            )}</p>
            <p className="mb-6 font-semibold">{t('totalPrice')}: ₪{
              (() => {
                const servicePrice = Number(selectedService?.price || 0);
                const addOnsPrice = selectedAddOns.reduce((total, addon) => total + Number(addon.price || 0), 0);
                return (servicePrice + addOnsPrice).toFixed(2);
              })()
            }</p>
          </div>
          
          <div className="space-y-3 mb-6">
            <p className="text-lg font-semibold text-gray-700 mb-3">{t('addToCalendarLabel')}</p>
            <button 
              onClick={() => handleAddToCalendar('google')}
              className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl transition-colors duration-200 font-medium"
            >
              {t('addToGoogleCalendar')}
            </button>
            <button 
              onClick={() => handleAddToCalendar('ios')}
              className="block w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-xl transition-colors duration-200 font-medium"
            >
              {t('addToAppleCalendar')}
            </button>
          </div>
          
          <Link to="/" className="block bg-pink-accent text-white py-3 rounded-xl">{t('returnHome')}</Link>
        </motion.div>
      </Modal>
    </section>
  );
};

export default Booking;