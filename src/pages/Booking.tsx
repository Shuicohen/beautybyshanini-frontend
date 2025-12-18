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
import { FaCheckCircle, FaCheck } from 'react-icons/fa';
import AnimatedBackground from '../components/AnimatedBackground';

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
  price: number | string; // Can be a number or a range string like "10-80"
  is_addon: boolean;
}

// Helper function for calendar generation only (not displayed in UI)
const formatDuration = (min: number) => {
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  return `${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : ''} ${minutes > 0 ? `${minutes} min` : ''}`.trim();
};

// Helper function to format price (handles ranges like "10-80")
const formatPrice = (price: number | string): string => {
  if (typeof price === 'string' && price.includes('-')) {
    // Format as "10 - 80 ₪"
    const parts = price.split('-').map(p => p.trim());
    return `₪ ${parts.join(' - ')}`;
  }
  return `₪${Number(price).toFixed(0)}`;
};

// Helper function to get numeric price for calculations (uses minimum from range)
const getNumericPrice = (price: number | string): number => {
  if (typeof price === 'string' && price.includes('-')) {
    const parts = price.split('-').map(p => p.trim());
    return Number(parts[0]) || 0;
  }
  return Number(price) || 0;
};

const Booking = () => {
  // Cache for available dates per service
  const [datesCache, setDatesCache] = useState<{ [serviceId: string]: Date[] }>({});
  const [loadingDates, setLoadingDates] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [addOns, setAddOns] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<Service[]>([]);
  const [customRequest, setCustomRequest] = useState<string>('');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isCustomSelected, setIsCustomSelected] = useState<boolean>(false);
  // ...existing code...
  const { t, language, setLanguage } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // Track calendar's active month/year
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  useEffect(() => {
    // Available dates updated
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
    // Fetch main services and add-ons separately with language parameter
    Promise.all([
      api.get(`/api/services/main?language=${language}`),
      api.get(`/api/services/addons?language=${language}`)
    ]).then(([mainServicesData, addOnsData]: [Service[], Service[]]) => {
      setServices(mainServicesData);
      setAddOns(addOnsData);
      
      // Check if there's a service ID in URL and auto-select it (from homepage click)
      const serviceId = searchParams.get('service');
      const reschedule = searchParams.get('reschedule');
      if (serviceId && !reschedule && mainServicesData.length > 0) {
        const service = mainServicesData.find(s => s.id === serviceId);
        if (service && (!selectedService || selectedService.id !== serviceId)) {
          setSelectedService(service);
          // Only advance to step 2 if we're still on step 1 (initial load from homepage)
          if (step === 1) {
            setStep(2); // Go to add-ons selection step
          }
        }
      }
      
      // Preload available dates for main services only
      mainServicesData.forEach(service => {
        api.get(`/api/availability/dates?serviceId=${service.id}`)
          .then((data) => {
            setDatesCache(prev => ({
              ...prev,
              [service.id]: (data.availableDates || []).map((d: string) => {
                // Parse date string (YYYY-MM-DD) as local date to avoid timezone issues
                const [year, month, day] = d.split('-').map(Number);
                return new Date(year, month - 1, day);
              })
            }));
          })
          .catch((err) => {
            if (import.meta.env.DEV) console.error(`Error preloading available dates for service ${service.id}:`, err);
          });
      });
    }).catch((error) => {
      if (import.meta.env.DEV) console.error('Error fetching services:', error);
      // Fallback to the original endpoint if the new endpoints don't work
      api.get(`/api/services?language=${language}`).then((allServices: Service[]) => {
        const mainServices = allServices.filter(s => !s.is_addon);
        const addOnServices = allServices.filter(s => s.is_addon);
        setServices(mainServices);
        setAddOns(addOnServices);
        
        // Check if there's a service ID in URL and auto-select it (from homepage click)
        const serviceId = searchParams.get('service');
        const reschedule = searchParams.get('reschedule');
        if (serviceId && !reschedule && mainServices.length > 0) {
          const service = mainServices.find(s => s.id === serviceId);
          if (service && (!selectedService || selectedService.id !== serviceId)) {
            setSelectedService(service);
            // Only advance to step 2 if we're still on step 1 (initial load from homepage)
            if (step === 1) {
              setStep(2); // Go to add-ons selection step
            }
          }
        }
        
        // Preload available dates for main services only
        mainServices.forEach(service => {
          api.get(`/api/availability/dates?serviceId=${service.id}`)
            .then((data) => {
              setDatesCache(prev => ({
                ...prev,
                [service.id]: (data.availableDates || []).map((d: string) => {
                  // Parse date string (YYYY-MM-DD) as local date to avoid timezone issues
                  const [year, month, day] = d.split('-').map(Number);
                  return new Date(year, month - 1, day);
                })
              }));
            })
            .catch((err) => {
              if (import.meta.env.DEV) console.error(`Error preloading available dates for service ${service.id}:`, err);
            });
        });
      }).catch((fallbackError) => {
        if (import.meta.env.DEV) console.error('Error fetching services from fallback endpoint:', fallbackError);
      });
    });
  }, [api, language, searchParams]);
  // Fetch available dates when service is selected or calendar month changes
  useEffect(() => {
    if (selectedService) {
      // Always fetch fresh data to ensure availability updates are reflected
      setLoadingDates(true);
      api.get(`/api/availability/dates?serviceId=${selectedService.id}`)
        .then((data) => {
          const dates = (data.availableDates || []).map((d: string) => {
            // Parse date string (YYYY-MM-DD) as local date to avoid timezone issues
            const [year, month, day] = d.split('-').map(Number);
            return new Date(year, month - 1, day);
          });
          setAvailableDates(dates);
          // Update cache with fresh data
          setDatesCache(prev => ({ ...prev, [selectedService.id]: dates }));
        })
        .catch((err: any) => {
          if (import.meta.env.DEV) console.error('Error fetching available dates:', err);
          // If cached data exists, use it as fallback
          if (datesCache[selectedService.id]) {
            setAvailableDates(datesCache[selectedService.id]);
          }
          // If service not found, reload services list and clear selection
          if (err?.message?.includes('Service not found') || err?.error === 'Service not found') {
            if (import.meta.env.DEV) console.log('Service not found, reloading services...');
            api.get(`/api/services/main?language=${language}`).then((mainServicesData: Service[]) => {
              setServices(mainServicesData);
              // Clear selection if current service doesn't exist anymore
              const serviceExists = mainServicesData.some(s => s.id === selectedService.id);
              if (!serviceExists) {
                setSelectedService(null);
                setStep(1);
              }
            }).catch(() => {
              // Fallback to full services list
              api.get(`/api/services?language=${language}`).then((allServices: Service[]) => {
                const mainServices = allServices.filter(s => !s.is_addon);
                setServices(mainServices);
                const serviceExists = mainServices.some(s => s.id === selectedService.id);
                if (!serviceExists) {
                  setSelectedService(null);
                  setStep(1);
                }
              });
            });
          }
        })
        .finally(() => {
          setLoadingDates(false);
        });
    } else {
      setAvailableDates([]);
      setLoadingDates(false);
    }
  }, [selectedService, language, calendarDate]);
  useEffect(() => {
    if (selectedDate && selectedService) {
      const day = format(selectedDate, 'yyyy-MM-dd');
      api.get(`/api/availability?day=${day}&serviceId=${selectedService.id}`)
        .then((data) => setAvailableTimes(data.availableTimes))
        .catch((err: any) => {
          if (import.meta.env.DEV) console.error('Error fetching available times:', err);
          // If service not found, reload services list and clear selection
          if (err?.message?.includes('Service not found') || err?.error === 'Service not found') {
            if (import.meta.env.DEV) console.log('Service not found, reloading services...');
            api.get(`/api/services/main?language=${language}`).then((mainServicesData: Service[]) => {
              setServices(mainServicesData);
              // Clear selection if current service doesn't exist anymore
              const serviceExists = mainServicesData.some(s => s.id === selectedService.id);
              if (!serviceExists) {
                setSelectedService(null);
                setStep(1);
              }
            }).catch(() => {
              // Fallback to full services list
              api.get(`/api/services?language=${language}`).then((allServices: Service[]) => {
                const mainServices = allServices.filter(s => !s.is_addon);
                setServices(mainServices);
                const serviceExists = mainServices.some(s => s.id === selectedService.id);
                if (!serviceExists) {
                  setSelectedService(null);
                  setStep(1);
                }
              });
            });
          }
        });
    }
  }, [selectedDate, selectedService, language]);
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
          service_id: String(selectedService.id), // Ensure service_id is a string
          addon_ids: selectedAddOns.map(addon => String(addon.id)), // Ensure addon_ids are strings
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
          client_name: formData.name,
          client_phone: formData.phone,
          client_email: formData.email,
          language,
          custom_request: customRequest.trim() || null, // Include custom request if provided
          custom_image: customImage || null, // Include custom image if provided
        });
        
        setBookingCompleted(true);
        setShowSuccess(true);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Booking failed:', error);
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
    const totalPrice = getNumericPrice(selectedService.price || 0) + selectedAddOns.reduce((total, addon) => total + getNumericPrice(addon.price || 0), 0);

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
    <section className="relative py-8 sm:py-12 md:py-20 px-4 min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 md:mb-12 text-pink-accent px-2 backdrop-blur-sm bg-white/40 rounded-2xl p-4 shadow-lg drop-shadow-md">
          {isReschedule ? t('rescheduleYourAppointment') : t('bookYourAppointment')}
        </h1>
        <div className="flex justify-center mb-6 sm:mb-8 md:mb-12 overflow-x-auto pb-2">
          <div className="flex items-center">
            {steps.map((s) => (
              <div 
                key={s}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full mx-1 sm:mx-2 md:mx-3 flex items-center justify-center text-white text-sm sm:text-base font-bold step-number flex-shrink-0 ${
                  s <= step ? 'bg-pink-accent shadow-md' : 'bg-baby-blue/50'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
        <div 
          key={step}
          className="bg-white/90 backdrop-blur-md p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-md border border-white/20"
        >
          {step === 1 && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center text-text-dark px-2">{t('selectService')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {services.filter(s => !s.is_addon).map((s, idx) => {
                  const isSelected = selectedService?.id === s.id;
                  const serviceName = s.name || '';
                  const isIndividualNailFix = serviceName.toLowerCase().includes('individual') || serviceName.toLowerCase().includes('השלמת');
                  const cardColors = [
                    'bg-gradient-to-br from-baby-blue/80 to-white',
                    'bg-gradient-to-br from-soft-pink/80 to-white',
                    'bg-gradient-to-br from-butter-yellow/80 to-white',
                    'bg-gradient-to-br from-pink-accent/80 to-white',
                    'bg-gradient-to-br from-green-200/80 to-white',
                    'bg-gradient-to-br from-purple-100/80 to-white',
                  ];
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedService(s); setStep(2); }}
                      className={`${cardColors[idx % cardColors.length]} relative p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl shadow-md border-2 text-center transition-shadow duration-200 active:shadow-lg active:scale-[0.98] group min-h-[120px] sm:min-h-[140px] flex flex-col items-center justify-between overflow-hidden touch-manipulation ${
                        isSelected 
                          ? 'border-pink-accent bg-pink-accent/20 shadow-lg ring-2 ring-pink-accent/30' 
                          : 'border-white/60'
                      }`}
                    >
                      <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{background: 'linear-gradient(120deg,rgba(255,255,255,0.10) 0%,rgba(255,255,255,0.22) 100%)'}}></div>
                      
                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 z-20 bg-pink-accent text-white rounded-full p-1.5 shadow-lg">
                          <FaCheck className="text-sm" />
                        </div>
                      )}
                      
                      <div className="relative z-10 w-full flex-grow flex flex-col items-center justify-center">
                        <h3 className="font-extrabold text-lg md:text-xl mb-3 text-gray-900 leading-tight">{serviceName}</h3>
                        
                        {/* Individual Nail Fix description */}
                        {isIndividualNailFix && (
                          <p className="text-xs md:text-sm text-gray-600 mb-3 px-2 text-center italic">
                            {t('individualNailFixNote')}
                          </p>
                        )}
                        
                        <div className="mt-auto">
                          <span className="text-2xl md:text-3xl font-extrabold text-pink-accent tracking-tight">₪{Number(s.price).toFixed(0)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center text-text-dark px-2">{t('selectAddOns')}</h2>
              {addOns.length > 0 ? (
                <div className="space-y-6">
                  {/* Intro text */}
                  <p className="text-center text-gray-700 mb-6 text-base md:text-lg font-medium">
                    {t('nailArtAddOnsIntro')}
                  </p>
                  
                  {/* Add-ons grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {addOns.map((addon) => {
                      const isSelected = selectedAddOns.some(a => a.id === addon.id);
                      const isCustom = addon.name?.toLowerCase().includes('custom') || (addon as any).name_en?.toLowerCase().includes('custom');
                      
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => {
                            if (isCustom) {
                              setIsCustomSelected(!isCustomSelected);
                              if (!isCustomSelected) {
                                setSelectedAddOns([...selectedAddOns, addon]);
                              } else {
                                setSelectedAddOns(selectedAddOns.filter(a => a.id !== addon.id));
                                setCustomRequest('');
                                setCustomImage(null);
                              }
                            } else {
                              if (isSelected) {
                                setSelectedAddOns(selectedAddOns.filter(a => a.id !== addon.id));
                              } else {
                                setSelectedAddOns([...selectedAddOns, addon]);
                              }
                            }
                          }}
                          className={`relative p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-shadow duration-200 active:scale-[0.98] text-left touch-manipulation ${
                            isSelected 
                              ? 'border-pink-accent bg-pink-accent/15 shadow-md ring-2 ring-pink-accent/20' 
                              : 'border-gray-200 bg-white'
                          }`}
                          dir={language === 'he' ? 'rtl' : 'ltr'}
                        >
                          {/* Selected checkmark */}
                          {isSelected && (
                            <div className={`absolute top-2 ${language === 'he' ? 'left-2' : 'right-2'} bg-pink-accent text-white rounded-full p-1 shadow-sm`}>
                              <FaCheck className="text-xs" />
                            </div>
                          )}
                          
                          <div className={`flex ${language === 'he' ? 'flex-row-reverse' : 'flex-row'} justify-between items-center gap-3`}>
                            <div className="flex-grow">
                              <h3 className="font-bold text-base md:text-lg text-gray-900 mb-1">{addon.name}</h3>
                              {isCustom && (
                                <p className="text-xs text-gray-600 mt-1">{language === 'he' ? 'ציין מה תרצי' : 'Specify what you want'}</p>
                              )}
                            </div>
                            {!isCustom && (
                              <div className={`flex-shrink-0 ${language === 'he' ? 'text-left' : 'text-right'}`}>
                                <span className="text-lg md:text-xl font-extrabold text-pink-accent">{formatPrice(addon.price)}</span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Custom request text input and image upload */}
                  {isCustomSelected && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {language === 'he' ? 'מה תרצי? (למנהל בלבד - אופציונלי)' : 'What would you like? (For admin only - Optional)'}
                        </label>
                        <textarea
                          value={customRequest}
                          onChange={(e) => setCustomRequest(e.target.value)}
                          placeholder={language === 'he' ? 'תיאור הבקשה המותאמת אישית... (אופציונלי)' : 'Describe your custom request... (Optional)'}
                          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-pink-accent outline-none bg-white resize-none"
                          rows={3}
                          dir={language === 'he' ? 'rtl' : 'ltr'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {language === 'he' ? 'העלה תמונה (אופציונלי)' : 'Upload Image (Optional)'}
                        </label>
                        <div className="flex flex-col gap-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setCustomImage(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-pink-accent file:text-white hover:file:bg-pink-accent/90 cursor-pointer"
                          />
                          {customImage && (
                            <div className="relative inline-block">
                              <img 
                                src={customImage} 
                                alt="Custom request" 
                                className="max-w-xs max-h-48 rounded-xl border-2 border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => setCustomImage(null)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                                title={language === 'he' ? 'הסר תמונה' : 'Remove image'}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Continue button */}
                  <div className="text-center pt-4">
                    <button 
                      onClick={() => setStep(3)} 
                      className="bg-pink-accent text-white py-3 px-8 sm:px-10 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 font-semibold text-base sm:text-lg touch-manipulation min-w-[140px]"
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
                    className="bg-pink-accent text-white py-3 px-8 sm:px-10 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 font-semibold text-base sm:text-lg touch-manipulation min-w-[140px]"
                  >
                    {t('continue')}
                  </button>
                </div>
              )}
              <button 
                onClick={() => setStep(1)} 
                className="mt-6 text-pink-accent hover:text-pink-accent/80 active:opacity-70 transition-opacity duration-200 block mx-auto font-medium text-sm sm:text-base touch-manipulation"
              >
                {t('back')}
              </button>
            </div>
          )}
          {step === 3 && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-6 sm:mb-8 text-center text-pink-accent drop-shadow px-2">{t('selectDate')}</h2>
              <div className="flex justify-center items-center min-h-[500px]">
                {loadingDates ? (
                  <div className="flex flex-col items-center justify-center w-full max-w-2xl h-[500px]">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-accent mb-4"></div>
                    <span className="text-pink-accent font-semibold text-lg">Loading available dates...</span>
                  </div>
                ) : (
                  <div className="w-full max-w-2xl h-[500px] bg-white rounded-2xl shadow-soft p-4 md:p-6 flex flex-col items-center justify-center">
                    {/* Custom Calendar Header */}
                    <div className="flex items-center justify-between w-full mb-4 px-2">
                      <button
                        aria-label="Previous Month"
                        className="p-2.5 sm:p-3 rounded-full bg-baby-blue/60 hover:bg-baby-blue/80 active:scale-90 text-pink-accent shadow-md transition-all duration-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                        onClick={() => setCalendarDate(prev => {
                          const prevMonth = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
                          return prevMonth;
                        })}
                      >
                        &#8592;
                      </button>
                      <span className="font-bold text-lg sm:text-xl text-pink-accent px-2">
                        {format(calendarDate, 'MMMM yyyy')}
                      </span>
                      <button
                        aria-label="Next Month"
                        className="p-2.5 sm:p-3 rounded-full bg-baby-blue/60 hover:bg-baby-blue/80 active:scale-90 text-pink-accent shadow-md transition-all duration-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
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
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center text-text-dark px-2">{t('selectTime')}</h2>
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
                    <button
                      key={time}
                      onClick={() => { setSelectedTime(time); setStep(5); }}
                      className="bg-pink-accent/60 text-gray-900 font-bold rounded-full shadow-md border-2 border-pink-accent/30 hover:bg-pink-accent/80 active:scale-95 transition-all duration-200 w-full py-3.5 sm:py-4 max-w-[300px] mx-auto touch-manipulation text-base sm:text-lg"
                    >
                      {time}
                    </button>
                  ));
                })()}
              </div>
              <button 
                onClick={() => setStep(3)} 
                className="mt-6 text-pink-accent hover:text-pink-accent/80 active:opacity-70 transition-opacity duration-200 block mx-auto font-medium text-sm sm:text-base touch-manipulation"
              >
                {t('back')}
              </button>
            </div>
          )}
          {step === 5 && (
            <form onSubmit={handleSubmit(onSubmit)}>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center text-text-dark px-2">{t('clientInfo')}</h2>
              <div className="space-y-6">
                <input {...register('name', { required: true })} placeholder={t('name')} className="block w-full p-4 border border-baby-blue/50 rounded-xl focus:border-pink-accent outline-none bg-white/50" />
                {errors.name && <p className="text-red-500 text-center">{t('requiredField')}</p>}
                <input 
                  {...register('phone', { 
                    required: true,
                    validate: (value) => {
                      if (!value) return language === 'he' ? 'מספר טלפון נדרש' : 'Phone number is required';
                      
                      // Remove spaces, dashes, parentheses, and other formatting characters
                      const cleaned = value.replace(/[\s\-\(\)\.]/g, '');
                      
                      // Check if it's a valid Israeli mobile phone number
                      // Formats: 05X-XXXXXXX, +972-5X-XXXXXXX, 05XXXXXXXXX, etc.
                      // Must start with 05 or +9725 and have 9-10 digits total
                      const israeliMobileRegex = /^(\+972|0)?5[0-9]{8}$/;
                      const isValid = israeliMobileRegex.test(cleaned);
                      
                      if (!isValid) {
                        return language === 'he' 
                          ? 'מספר טלפון לא תקין. אנא הכנס מספר ישראלי (05X-XXXXXXX)' 
                          : 'Invalid phone number. Please enter a valid Israeli phone number (05X-XXXXXXX)';
                      }
                      
                      return true;
                    }
                  })} 
                  type="tel"
                  placeholder={language === 'he' ? 'טלפון (05X-XXXXXXX)' : 'Phone (05X-XXXXXXX)'} 
                  className="block w-full p-4 border border-baby-blue/50 rounded-xl focus:border-pink-accent outline-none bg-white/50" 
                />
                {errors.phone && (
                  <p className="text-red-500 text-center text-sm">
                    {errors.phone.type === 'required' 
                      ? t('requiredField') 
                      : errors.phone.message || (language === 'he' ? 'מספר טלפון לא תקין' : 'Invalid phone number')}
                  </p>
                )}
                <input 
                  {...register('email', { 
                    required: true, 
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: language === 'he' ? 'כתובת אימייל לא תקינה' : 'Invalid email address'
                    },
                    validate: (value) => {
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      return emailRegex.test(value) || (language === 'he' ? 'כתובת אימייל לא תקינה' : 'Invalid email address');
                    }
                  })} 
                  type="email"
                  placeholder={t('email')} 
                  className="block w-full p-4 border border-baby-blue/50 rounded-xl focus:border-pink-accent outline-none bg-white/50" 
                />
                {errors.email && (
                  <p className="text-red-500 text-center text-sm">
                    {errors.email.type === 'required' 
                      ? t('requiredField') 
                      : errors.email.message || (language === 'he' ? 'כתובת אימייל לא תקינה' : 'Invalid email address')}
                  </p>
                )}
              </div>
              <button 
                type="submit" 
                className="mt-6 sm:mt-8 w-full bg-pink-accent text-white py-3.5 sm:py-4 rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 font-semibold text-base sm:text-lg touch-manipulation"
              >
                {t('next')}
              </button>
              <button 
                type="button" 
                onClick={() => setStep(4)} 
                className="mt-4 text-pink-accent hover:text-pink-accent/80 active:opacity-70 transition-opacity duration-200 block mx-auto font-medium text-sm sm:text-base touch-manipulation"
              >
                {t('back')}
              </button>
            </form>
          )}
          {step === 6 && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center text-text-dark px-2">{t('confirmation')}</h2>
              <div className="bg-baby-blue/20 p-6 rounded-xl mb-8 space-y-2 booking-details">
                <p className="text-lg"><span className="font-bold">{t('service')}:</span> {selectedService?.name}</p>
                {selectedAddOns.length > 0 && (
                  <p className="text-lg">
                    <span className="font-bold">{t('addOns')}:</span> {selectedAddOns.map(addon => addon.name).join(', ')}
                  </p>
                )}
                {(customRequest.trim() || customImage) && (
                  <div className="space-y-2">
                    {customRequest.trim() && (
                      <p className="text-lg">
                        <span className="font-bold">{language === 'he' ? 'בקשה מותאמת אישית' : 'Custom Request'}:</span> {customRequest}
                      </p>
                    )}
                    {customImage && (
                      <div className="mt-2">
                        <p className="font-bold text-lg mb-2">{language === 'he' ? 'תמונה' : 'Image'}:</p>
                        <img src={customImage} alt="Custom request" className="max-w-xs max-h-48 rounded-xl border-2 border-gray-200" />
                      </div>
                    )}
                  </div>
                )}
                <p className="text-lg"><span className="font-bold">{t('date')}:</span> {selectedDate ? format(selectedDate, 'PPP') : ''}</p>
                <p className="text-lg"><span className="font-bold">{t('time')}:</span> {selectedTime}</p>
                <p className="text-lg"><span className="font-bold">{t('totalPrice')}:</span> ₪{
                  (() => {
                    const servicePrice = Number(selectedService?.price || 0);
                    const addOnsPrice = selectedAddOns.reduce((total, addon) => total + getNumericPrice(addon.price || 0), 0);
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
                  className="w-full py-3.5 sm:py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white font-semibold text-base sm:text-lg flex items-center justify-center touch-manipulation"
                >
                  <FaCheckCircle className="mr-2" />
                  {t('backToHome')}
                </Link>
              ) : (
                <button 
                  onClick={confirmBooking} 
                  disabled={isBookingLoading || bookingCompleted}
                  className={`w-full py-3.5 sm:py-4 rounded-xl shadow-md transition-all duration-200 font-semibold text-base sm:text-lg flex items-center justify-center touch-manipulation ${
                    isBookingLoading || bookingCompleted
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-pink-accent hover:shadow-lg hover:bg-pink-accent/90 active:scale-[0.98]'
                  } text-white`}
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
        </div>
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
            <p className="mb-6 font-semibold">{t('totalPrice')}: ₪{
              (() => {
                const servicePrice = getNumericPrice(selectedService?.price || 0);
                const addOnsPrice = selectedAddOns.reduce((total, addon) => total + getNumericPrice(addon.price || 0), 0);
                return (servicePrice + addOnsPrice).toFixed(2);
              })()
            }</p>
          </div>
          
          <div className="space-y-3 mb-6">
            <p className="text-lg font-semibold text-gray-700 mb-3">{t('addToCalendarLabel')}</p>
            <button 
              onClick={() => handleAddToCalendar('google')}
              className="block w-full bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-semibold text-base sm:text-lg touch-manipulation mb-3"
            >
              {t('addToGoogleCalendar')}
            </button>
            <button 
              onClick={() => handleAddToCalendar('ios')}
              className="block w-full bg-gray-600 hover:bg-gray-700 active:scale-[0.98] text-white py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-semibold text-base sm:text-lg touch-manipulation"
            >
              {t('addToAppleCalendar')}
            </button>
          </div>
          
          <Link 
            to="/" 
            className="block w-full bg-pink-accent hover:bg-pink-accent/90 active:scale-[0.98] text-white py-3.5 sm:py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-semibold text-center text-base sm:text-lg touch-manipulation"
          >
            {t('returnHome')}
          </Link>
        </motion.div>
      </Modal>
    </section>
  );
};

export default Booking;