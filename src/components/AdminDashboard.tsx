import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { useForm } from 'react-hook-form';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, addMonths } from 'date-fns';
import { motion } from 'framer-motion';
import AnimatedBackground from './AnimatedBackground';

// Import extracted modules
import type { Booking, Service, ClientSummary, Client, ServiceFormData, BlockTimeFormData, OpenHoursFormData, BookingFormData } from './admin/types';
import { formatDuration, formatCurrency, formatPrice, getNumericPrice } from './admin/utils';
import { Sidebar } from './admin/Sidebar';
import { useAdminData } from './admin/useAdminData';
import { OverviewTab, ManageServicesTab, AvailabilityTab, BookingsTab, ClientsTab, AnalyticsTab } from './admin/tabs';
import { groupBookingsByDate, groupBookingsByWeek, groupBookingsByMonth, getDateRangeForFilter } from './admin/tabs/bookingHelpers';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, reset } = useForm<ServiceFormData & BlockTimeFormData & OpenHoursFormData & BookingFormData>();
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isAddingAddon, setIsAddingAddon] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!token);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  // Track calendar's active month/year for admin calendar
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [modalType, setModalType] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editTimes, setEditTimes] = useState<{ start_time: string; end_time: string } | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showPastBookings, setShowPastBookings] = useState<boolean>(false);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [isEditingBookingDetails, setIsEditingBookingDetails] = useState(false);
  const [editingBookingForm, setEditingBookingForm] = useState({
    service_id: '',
    date: '',
    time: '',
    price: '',
    addon_ids: [] as string[],
    customAddonPrices: {} as Record<string, string>,
    addonQuantities: {} as Record<string, number>
  });
  const [singleDayAction, setSingleDayAction] = useState<'editHours' | 'blockTime'>('editHours');
  const [showDateDetails, setShowDateDetails] = useState<boolean>(false);
  const [dateDetails, setDateDetails] = useState<{
    availableSlots: { start_time: string; end_time: string }[];
    blockedSlots: { id: string; start_time: string; end_time: string; reason?: string }[];
  } | null>(null);
  const [loadingDateDetails, setLoadingDateDetails] = useState<boolean>(false);
  const [selectedBookingAddOns, setSelectedBookingAddOns] = useState<Service[]>([]);
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [revenueChartType, setRevenueChartType] = useState<'daily' | 'weekly'>('weekly');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState<string>('');
  const [showAddClientModal, setShowAddClientModal] = useState<boolean>(false);
  const [showClientDetailsModal, setShowClientDetailsModal] = useState<boolean>(false);
  const [isEditingClient, setIsEditingClient] = useState<boolean>(false);
  const [editingClientForm, setEditingClientForm] = useState({ name: '', email: '', phone: '' });
  const [createBookingForClient, setCreateBookingForClient] = useState<boolean>(false);
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    phone: '',
    email: '',
    service_id: '',
    date: '',
    time: '',
    language: 'en'
  });

  // State for editing performance goals
  const [editingGoals, setEditingGoals] = useState(false);
  
  // Use the extracted hook for data management
  const {
    bookings,
    setBookings,
    services,
    setServices,
    mainServices,
    setMainServices,
    addOns,
    setAddOns,
    analytics,
    setAnalytics,
    availableDays,
    setAvailableDays,
    clients,
    setClients,
    loading,
    error,
    setError,
    loadingClients,
    api
  } = useAdminData({ isLoggedIn, token, activeTab, analyticsTimeRange });

  // State for selected month and year for goals
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [goalInputs, setGoalInputs] = useState({
    monthlyGoal: 0,
    monthlyBookingGoal: 0
  });

  // Redirect to login if no token
  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
    }
  }, [token, navigate]);

  // Sync goalInputs with analytics when analytics changes
  useEffect(() => {
    if (analytics.monthlyGoal !== undefined && analytics.monthlyBookingGoal !== undefined) {
      setGoalInputs({
        monthlyGoal: analytics.monthlyGoal || 0,
        monthlyBookingGoal: analytics.monthlyBookingGoal || 0
      });
    }
  }, [analytics.monthlyGoal, analytics.monthlyBookingGoal]);

  // Save updated goals to backend
  const handleSaveGoals = () => {
    api.post('/api/analytics/goals', {
      monthlyGoal: Number(goalInputs.monthlyGoal),
      monthlyBookingGoal: Number(goalInputs.monthlyBookingGoal)
    })
      .then((updated) => {
        setAnalytics((prev) => ({ ...prev, ...updated }));
        setEditingGoals(false);
        setShowSuccess('Goals updated!');
        setTimeout(() => setShowSuccess(null), 2000);
      })
      .catch((err) => setError(err.message));
  };

  // Fetch client details when a client is selected
  useEffect(() => {
    if (selectedClient?.phone && isLoggedIn && token) {
      api.get(`/api/clients/${encodeURIComponent(selectedClient.phone)}`)
        .then((clientData: Client) => {
          setSelectedClient(clientData);
        })
        .catch((err) => {
          if (import.meta.env.DEV) console.error('Error fetching client details:', err);
          setError(err.message);
        });
    }
  }, [selectedClient?.phone, isLoggedIn, token, api]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsLoggedIn(false);
    navigate('/admin/login');
  };

  const onSetOpenHours = (data: OpenHoursFormData) => {
    setError(null);
    const days = selectedDays.length > 0 ? selectedDays : [new Date()];
    
    if (!data.start_time || !data.end_time) {
      setError('Please provide both start time and end time');
      return;
    }
    
    Promise.all(
      days.map(day =>
        api.post('/api/availability', {
          day: format(day, 'yyyy-MM-dd'),
          start_time: data.start_time,
          end_time: data.end_time,
          is_blocked: false
        })
      )
    )
      .then(() => {
        setShowModal(false);
        setShowSuccess('Availability saved!');
        setSelectedDays([]); // Unselect dates after setting hours
        api.get('/api/availability/dates').then((data: { availableDates: string[] }) => {
          if (data && Array.isArray(data.availableDates)) setAvailableDays(data.availableDates);
        }).catch(() => {
          // Silently fail - availability was still set
        });
        setTimeout(() => setShowSuccess(null), 2000);
      })
      .catch(err => {
        const errorMessage = err?.message || err?.error || 'Failed to save availability. Please try again.';
        setError(errorMessage);
        if (import.meta.env.DEV) {
          console.error('Error setting availability:', err);
        }
      });
  };

  const onAddOrEditService = (data: ServiceFormData) => {
    if (editingService) {
      const { id, ...updateData } = data as any;
      api.put(`/api/services/${editingService.id}`, updateData)
        .then((updated) => {
          const updatedServices = services.map(s => s.id === editingService.id ? updated : s);
          setServices(updatedServices);
          setMainServices(updatedServices.filter(s => !s.is_addon));
          setAddOns(updatedServices.filter(s => s.is_addon));
          setShowModal(false);
          setEditingService(null);
          reset();
        })
        .catch(err => setError(err.message));
    } else {
      api.post('/api/services', data)
        .then((newService) => {
          const updatedServices = [...services, newService];
          setServices(updatedServices);
          setMainServices(updatedServices.filter(s => !s.is_addon));
          setAddOns(updatedServices.filter(s => s.is_addon));
          setShowModal(false);
          reset();
        })
        .catch(err => setError(err.message));
    }
  };

  const onEditBooking = (data: BookingFormData) => {
    if (!editingBooking) return;
    
    // Add selected add-on IDs to the booking data
    const bookingData = {
      ...data,
      addon_ids: selectedBookingAddOns.map(addon => addon.id)
    };
    
    api.put(`/api/bookings/${editingBooking.id}`, bookingData)
      .then((updatedBooking) => {
        setBookings(bookings.map(b => b.id === editingBooking.id ? updatedBooking : b));
        setShowModal(false);
        setEditingBooking(null);
        setSelectedBookingAddOns([]);
        reset();
        setShowSuccess('Booking updated successfully!');
        setTimeout(() => setShowSuccess(null), 2000);
      })
      .catch(err => setError(err.message));
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBooking(null);
    setEditingService(null);
    setIsAddingAddon(false);
    setEditDate(null);
    setEditTimes(null);
    setSingleDayAction('editHours');
    setShowDateDetails(false);
    setDateDetails(null);
    setLoadingDateDetails(false);
    setSelectedBookingAddOns([]);
    reset();
  };

  const onDeleteService = (id: string) => {
    api.del(`/api/services/${id}`)
      .then(() => {
        const updatedServices = services.filter(s => s.id !== id);
        setServices(updatedServices);
        setMainServices(updatedServices.filter(s => !s.is_addon));
        setAddOns(updatedServices.filter(s => s.is_addon));
      })
      .catch(err => setError(err.message));
  };

  const onBlockTime = (data: BlockTimeFormData) => {
    const days = selectedDays.length > 0 ? selectedDays : [new Date()];
    Promise.all(
      days.map(day =>
        api.post('/api/availability/block', {
          ...data,
          day: format(day, 'yyyy-MM-dd'),
        })
      )
    )
      .then(() => setShowModal(false))
      .catch(err => setError(err.message));
  };

  const onCancelBooking = (token: string) => {
    api.get(`/api/bookings/manage?token=${token}&action=cancel`)
      .then((res) => {
        if (res.success) {
          setBookings(bookings.filter(b => b.token !== token));
        } else {
          alert(res.message || 'Cannot cancel');
        }
      })
      .catch(err => setError(err.message));
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setIsAddingAddon(service.is_addon);
    // Ensure all fields are populated, including defaults for missing fields
    reset({
      name: service.name || '',
      name_en: service.name_en || service.name || '',
      name_he: service.name_he || '',
      description_en: service.description_en || '',
      description_he: service.description_he || '',
      duration: service.duration || 0,
      price: service.price || 0,
      is_addon: service.is_addon || false,
      category: service.category || '',
      is_active: service.is_active !== undefined ? service.is_active : true
    });
    setModalType('serviceForm');
    setShowModal(true);
  };

  const openEditBookingModal = (booking: Booking) => {
    setEditingBooking(booking);
    // Format date for HTML date input (YYYY-MM-DD)
    const formattedDate = booking.date ? new Date(booking.date).toISOString().split('T')[0] : '';
    
    // Initialize selected add-ons from booking
    const bookingAddOns: Service[] = [];
    if (booking.addons) {
      booking.addons.forEach(addon => {
        const matchingService = addOns.find(service => service.name === addon.name);
        if (matchingService) {
          bookingAddOns.push(matchingService);
        }
      });
    }
    setSelectedBookingAddOns(bookingAddOns);
    
    reset({
      service_id: booking.service_id,
      date: formattedDate,
      time: booking.time,
      client_name: booking.client_name,
      client_email: booking.client_email,
      client_phone: booking.client_phone || '',
    });
    setModalType('bookingForm');
    setShowModal(true);
  };

  const openBookingDetailsModal = (booking: any) => {
    setSelectedBooking(booking);
    setShowBookingDetailsModal(true);
  };

  // Add-on management functions for edit booking modal
  const addBookingAddOn = (addon: Service) => {
    if (!selectedBookingAddOns.find(item => item.id === addon.id)) {
      setSelectedBookingAddOns([...selectedBookingAddOns, addon]);
    }
  };

  const removeBookingAddOn = (addonId: string) => {
    setSelectedBookingAddOns(selectedBookingAddOns.filter(addon => addon.id !== addonId));
  };

  const calculateTotalPrice = () => {
    let total = 0;
    
    // Get base service price
    if (editingBooking) {
      const baseService = services.find(s => s.id === editingBooking.service_id);
      if (baseService) {
        total += Number(baseService.price || 0);
      }
    }
    
    // Add add-on prices
    selectedBookingAddOns.forEach(addon => {
      total += Number(addon.price || 0);
    });
    
    return total;
  };

  const calculateTotalDuration = () => {
    let total = 0;
    
    // Get base service duration
    if (editingBooking) {
      const baseService = services.find(s => s.id === editingBooking.service_id);
      if (baseService) {
        total += Number(baseService.duration || 0);
      }
    }
    
    // Add add-on durations
    selectedBookingAddOns.forEach(addon => {
      total += Number(addon.duration || 0);
    });
    
    return total;
  };

  // Handler for editing open hours for a single day
  const onEditOpenHours = (data: OpenHoursFormData) => {
    if (!editDate) return;
    setError(null);
    
    if (!data.start_time || !data.end_time) {
      setError('Please provide both start time and end time');
      return;
    }
    
    api.post('/api/availability', {
      day: format(editDate, 'yyyy-MM-dd'),
      start_time: data.start_time,
      end_time: data.end_time,
      is_blocked: false,
    })
      .then(() => {
        setShowSuccess('Availability updated!');
        setTimeout(() => setShowSuccess(null), 2000);
        
        // Refresh date details automatically
        fetchDateDetailsForDate(editDate);
        
        // Refresh available days
        api.get('/api/availability/dates').then((data: { availableDates: string[] }) => {
          if (data && Array.isArray(data.availableDates)) setAvailableDays(data.availableDates);
        }).catch(() => {
          // Silently fail - availability was still set
        });
      })
      .catch(err => {
        const errorMessage = err?.message || err?.error || 'Failed to update availability. Please try again.';
        setError(errorMessage);
        if (import.meta.env.DEV) {
          console.error('Error updating availability:', err);
        }
      });
  };

  // Handler for blocking time on a single day
  const onBlockSingleDay = (data: BlockTimeFormData) => {
    if (!editDate) return;
    
    const payload = {
      ...data,
      day: format(editDate, 'yyyy-MM-dd'),
    };
    
    // Validate required fields on frontend
    if (!payload.start_time || !payload.end_time || !payload.day) {
      setError('Please fill in all required fields (start time and end time)');
      return;
    }
    
    api.post('/api/availability/block', payload)
      .then(() => {
        setShowSuccess('Time blocked successfully!');
        setTimeout(() => setShowSuccess(null), 2000);
        
        // Refresh date details automatically
        fetchDateDetailsForDate(editDate);
        
        // Reset form
        reset();
        setSingleDayAction('editHours');
      })
      .catch(err => {
        const errorMessage = err?.message || err?.error || 'Failed to block time. Please try again.';
        setError(errorMessage);
        if (import.meta.env.DEV) {
          console.error('Error blocking time:', err);
        }
      });
  };

  // Handler for unblocking a specific time slot
  const onUnblockTime = (blockId: string) => {
    if (!editDate) return;
    
    if (!blockId || blockId === 'undefined') {
      if (import.meta.env.DEV) console.error('Invalid blockId:', blockId);
      setError('Cannot unblock: Invalid block ID');
      return;
    }
    
    api.del(`/api/availability/unblock/${blockId}`)
      .then(() => {
        setShowSuccess('Time unblocked successfully!');
        setTimeout(() => setShowSuccess(null), 2000);
        
        // Refresh date details automatically
        fetchDateDetailsForDate(editDate);
      })
      .catch(err => setError(err.message));
  };

  // Function to automatically fetch date details for a specific date
  const fetchDateDetailsForDate = async (date: Date) => {
    setLoadingDateDetails(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Use the new admin endpoint to get raw availability data
      const response = await api.get(`/api/availability/admin?day=${dateStr}`);
      
      
      setDateDetails({
        availableSlots: response?.availableSlots || [],
        blockedSlots: response?.blockedSlots || []
      });
      
      // Set edit times from first available slot
      const firstAvailable = response?.availableSlots?.[0];
      if (firstAvailable) {
        setEditTimes({
          start_time: firstAvailable.start_time,
          end_time: firstAvailable.end_time,
        });
      }
      
      setShowDateDetails(true);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching date details:', error);
      // Show empty state
      setDateDetails({
        availableSlots: [],
        blockedSlots: []
      });
      setShowDateDetails(true);
    } finally {
      setLoadingDateDetails(false);
    }
  };

  // Helper functions are now imported from './admin/tabs/bookingHelpers'

  // Filter bookings based on search term and past/upcoming toggle
  const filteredBookings = bookings.filter(booking => {
    // First filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        booking.client_name.toLowerCase().includes(searchLower) ||
        booking.client_email.toLowerCase().includes(searchLower) ||
        booking.client_phone.toLowerCase().includes(searchLower) ||
        booking.id.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }

    // Then filter by past/upcoming
    const bookingDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (showPastBookings) {
      if (bookingDate >= today) return false;
    } else {
      if (bookingDate < today) return false;
    }

    // Finally filter by time range
    const dateRange = getDateRangeForFilter(timeFilter);
    if (dateRange) {
      return bookingDate >= dateRange.start && bookingDate < dateRange.end;
    }
    
    return true;
  });

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-pink-accent"></div></div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}. <button onClick={() => window.location.reload()} className="ml-2 text-pink-accent underline">Retry</button></div>;

  // #region agent log
  useEffect(() => {
    const viewportWidth = window.innerWidth;
    const isMobile = viewportWidth < 768;
    fetch('http://127.0.0.1:7242/ingest/e7494785-1fe6-47f3-8df4-c77793040f40',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDashboard.tsx:1005',message:'Dashboard render - viewport check',data:{viewportWidth,isMobile,isMenuOpen,activeTab},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  }, [isMenuOpen, activeTab]);
  // #endregion

  return (
    <div 
      className="relative min-h-screen flex flex-col md:flex-row"
      ref={(el) => {
        // #region agent log
        if (el) {
          const rect = el.getBoundingClientRect();
          const styles = window.getComputedStyle(el);
          fetch('http://127.0.0.1:7242/ingest/e7494785-1fe6-47f3-8df4-c77793040f40',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDashboard.tsx:1006',message:'Container element dimensions',data:{width:rect.width,height:rect.height,top:rect.top,left:rect.left,display:styles.display,flexDirection:styles.flexDirection,viewportWidth:window.innerWidth},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        }
        // #endregion
      }}
    >
      <AnimatedBackground />
      <Sidebar
        activeTab={activeTab}
        isMenuOpen={isMenuOpen}
        onTabChange={setActiveTab}
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        onLogout={handleLogout}
      />
      {/* Main content area */}
      <main 
        className="relative z-10 flex-1 p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 overflow-x-hidden overflow-y-auto w-full min-h-screen md:min-h-screen pt-12 md:pt-0"
        ref={(el) => {
          // #region agent log
          if (el) {
            const rect = el.getBoundingClientRect();
            const styles = window.getComputedStyle(el);
            fetch('http://127.0.0.1:7242/ingest/e7494785-1fe6-47f3-8df4-c77793040f40',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDashboard.tsx:1060',message:'Main content element dimensions',data:{width:rect.width,height:rect.height,top:rect.top,left:rect.left,zIndex:styles.zIndex,display:styles.display,position:styles.position,isMenuOpen},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          }
          // #endregion
        }}
      >
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-full sm:max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8"
          ref={(el) => {
            // #region agent log
            if (el) {
              const rect = el.getBoundingClientRect();
              const parentRect = el.parentElement?.getBoundingClientRect();
              fetch('http://127.0.0.1:7242/ingest/e7494785-1fe6-47f3-8df4-c77793040f40',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDashboard.tsx:1067',message:'Content wrapper dimensions',data:{width:rect.width,height:rect.height,top:rect.top,left:rect.left,parentWidth:parentRect?.width,parentHeight:parentRect?.height,activeTab,isMenuOpen},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            }
            // #endregion
          }}
        >
          {activeTab === 'Overview' && (
            <OverviewTab
              bookings={bookings}
              mainServices={mainServices}
              addOns={addOns}
              analytics={analytics}
              onTabChange={setActiveTab}
            />
          )}
          {activeTab === 'Manage Services' && (
            <ManageServicesTab
              mainServices={mainServices}
              addOns={addOns}
              onEditService={openEditModal}
              onDeleteService={onDeleteService}
              onAddMainService={() => {
                setEditingService(null);
                setIsAddingAddon(false);
                reset({ is_addon: false });
                setModalType('serviceForm');
                setShowModal(true);
              }}
              onAddAddonService={() => {
                setEditingService(null);
                setIsAddingAddon(true);
                reset({ is_addon: true });
                setModalType('serviceForm');
                setShowModal(true);
              }}
            />
          )}
          {activeTab === 'Availability' && (
            <AvailabilityTab
              availableDays={availableDays}
              selectedDays={selectedDays}
              calendarDate={calendarDate}
              showSuccess={showSuccess}
              onCalendarDateChange={setCalendarDate}
              onDayClick={(value) => {
                const dateStr = format(value, 'yyyy-MM-dd');
                const isAvailable = availableDays.includes(dateStr);
                if (isAvailable) {
                  setEditDate(value);
                  setEditTimes(null);
                  setSingleDayAction('editHours');
                  setModalType('editSingleDay');
                  setShowModal(true);
                  fetchDateDetailsForDate(value);
                } else {
                  setSelectedDays((prev) => {
                    const exists = prev.some(d => d.toDateString() === value.toDateString());
                    return exists ? prev.filter(d => d.toDateString() !== value.toDateString()) : [...prev, value];
                  });
                }
              }}
              onBlockTime={() => { setModalType('blockTime'); setShowModal(true); }}
              onSetOpenHours={() => { setModalType('openHours'); setShowModal(true); }}
              onSyncGoogleCalendar={async () => {
                try {
                  setShowSuccess('🔄 Syncing Google Calendar (this may take up to 60 seconds)...');
                  const today = new Date();
                  const twoMonthsFromNow = addMonths(today, 2);
                  const startDate = format(today, 'yyyy-MM-dd');
                  const endDate = format(twoMonthsFromNow, 'yyyy-MM-dd');
                  
                  const result = await api.post('/api/availability/sync', { 
                    startDate,
                    endDate
                  });
                  
                  setShowSuccess(`✅ Synced ${result.synced || 0} time slots from Google Calendar`);
                  setTimeout(() => setShowSuccess(null), 8000);
                  
                  // Refresh available dates after sync
                  api.get('/api/availability/dates').then((data: { availableDates: string[] }) => {
                    if (data && Array.isArray(data.availableDates)) {
                      const today = new Date();
                      today.setHours(0,0,0,0);
                      const available = data.availableDates.filter((dateStr: string) => {
                        const dateObj = new Date(dateStr);
                        dateObj.setHours(0,0,0,0);
                        return dateObj >= today;
                      });
                      setAvailableDays(available);
                    }
                  });
                } catch (error: any) {
                  const errorMsg = error.message || 'Unknown error';
                  setShowSuccess(`❌ Sync failed: ${errorMsg}. Please try again.`);
                  setTimeout(() => setShowSuccess(null), 8000);
                }
              }}
              api={api}
              setAvailableDays={setAvailableDays}
            />
          )}
          {activeTab === 'Bookings' && (
            <BookingsTab
              bookings={bookings}
              onEditBooking={openEditBookingModal}
              onCancelBooking={onCancelBooking}
              onBookingDetails={openBookingDetailsModal}
            />
          )}
          {activeTab === 'Clients' && (
            <ClientsTab
              clients={clients}
              loadingClients={loadingClients}
              onAddClient={() => {
                setShowAddClientModal(true);
                setCreateBookingForClient(false);
              }}
              api={api}
              setSelectedClient={setSelectedClient}
              setShowClientDetailsModal={setShowClientDetailsModal}
              setError={setError}
            />
          )}
          {activeTab === 'Analytics' && (
            <AnalyticsTab
              analytics={analytics}
              bookings={bookings}
              analyticsTimeRange={analyticsTimeRange}
              onTimeRangeChange={setAnalyticsTimeRange}
              onSaveGoals={handleSaveGoals}
            />
          )}
          {/* Keep the old code below for reference - will be removed after full extraction */}
          {false && activeTab === 'Overview' && (
            <div className="space-y-6 sm:space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-pink-accent">Business Overview</h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">Today's summary and key metrics</p>
                </div>
                <div className="text-xs sm:text-sm text-gray-500 break-words">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="bg-gradient-to-br from-pink-50 to-pink-100 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft text-left hover:shadow-xl transition-all duration-300 cursor-pointer border border-pink-200 text-sm sm:text-base"
                  onClick={() => setActiveTab('Bookings')}
                  aria-label="View Bookings"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-pink-accent/20 rounded-xl">
                      <svg className="w-6 h-6 text-pink-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <svg className="w-5 h-5 text-pink-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Upcoming Appointments</h3>
                  <p className="text-3xl font-bold text-pink-accent">{bookings.filter(b => new Date(b.date) >= new Date()).length}</p>
                  <p className="text-sm text-gray-600 mt-1">appointments scheduled</p>
                </motion.button>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-green-200 text-sm sm:text-base"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500/20 rounded-xl">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                      All Time
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Total Revenue</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(bookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0))}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">from all bookings</p>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft text-left hover:shadow-xl transition-all duration-300 cursor-pointer border border-blue-200 text-sm sm:text-base"
                  onClick={() => setActiveTab('Manage Services')}
                  aria-label="View Services"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-baby-blue/20 rounded-xl">
                      <svg className="w-6 h-6 text-baby-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.586V5L8 4z" />
                      </svg>
                    </div>
                    <svg className="w-5 h-5 text-baby-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Main Services</h3>
                  <p className="text-3xl font-bold text-baby-blue">{mainServices.length}</p>
                  <p className="text-sm text-gray-600 mt-1">active services</p>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft text-left hover:shadow-xl transition-all duration-300 cursor-pointer border border-purple-200 text-sm sm:text-base"
                  onClick={() => setActiveTab('Manage Services')}
                  aria-label="View Add-ons"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Add-ons</h3>
                  <p className="text-3xl font-bold text-purple-600">{addOns.length}</p>
                  <p className="text-sm text-gray-600 mt-1">additional services</p>
                </motion.button>
              </div>

              {/* Today's Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Today's Appointments */}
                <div className="bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-white/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                      <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Today's Appointments
                    </h3>
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                      {(() => {
                        const today = new Date().toDateString();
                        return bookings.filter(b => new Date(b.date).toDateString() === today).length;
                      })()} today
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {(() => {
                      const today = new Date().toDateString();
                      const todaysBookings = bookings
                        .filter(b => new Date(b.date).toDateString() === today)
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .slice(0, 5); // Show first 5 appointments
                      
                      if (todaysBookings.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p>No appointments today</p>
                            <p className="text-sm">Enjoy your free day!</p>
                          </div>
                        );
                      }
                      
                      return todaysBookings.map((booking) => (
                        <div key={booking.id} className="flex items-center gap-4 p-3 bg-orange-50 rounded-xl border border-orange-200">
                          <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-lg font-semibold text-sm">
                            {booking.time}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{booking.client_name}</h4>
                            <p className="text-sm text-gray-600">{booking.service_name || 'Service'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-orange-600">{formatCurrency(Number(booking.price || 0))}</p>
                          </div>
                        </div>
                      ));
                    })()}
                    
                    {(() => {
                      const today = new Date().toDateString();
                      const todaysBookings = bookings.filter(b => new Date(b.date).toDateString() === today);
                      if (todaysBookings.length > 5) {
                        return (
                          <div className="text-center pt-3">
                            <button 
                              onClick={() => setActiveTab('Bookings')}
                              className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                            >
                              View all {todaysBookings.length} appointments →
                            </button>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-white/20">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-pink-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Quick Stats
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-pink-50 rounded-xl">
                      <span className="text-gray-700 font-medium">Most Booked Service</span>
                      <span className="font-bold text-pink-accent">{analytics.mostBooked || 'No data yet'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                      <span className="text-gray-700 font-medium">This Week</span>
                      <span className="font-bold text-baby-blue">
                        {(() => {
                          const startOfWeek = new Date();
                          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
                          const endOfWeek = new Date(startOfWeek);
                          endOfWeek.setDate(startOfWeek.getDate() + 6);
                          
                          return bookings.filter(b => {
                            const bookingDate = new Date(b.date);
                            return bookingDate >= startOfWeek && bookingDate <= endOfWeek;
                          }).length;
                        })()} appointments
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                      <span className="text-gray-700 font-medium">This Month Revenue</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency((() => {
                          const startOfMonth = new Date();
                          startOfMonth.setDate(1);
                          const monthRevenue = bookings
                            .filter(b => new Date(b.date) >= startOfMonth)
                            .reduce((sum, b) => sum + (Number(b.price) || 0), 0);
                          return isNaN(monthRevenue) ? 0 : Math.round(monthRevenue);
                        })())}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                      <span className="text-gray-700 font-medium">Total Clients</span>
                      <span className="font-bold text-purple-600">
                        {(() => {
                          const uniqueClients = new Set(bookings.map(b => b.client_email));
                          return uniqueClients.size;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-indigo-200">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <button
                    onClick={() => setActiveTab('Bookings')}
                    className="bg-white/70 p-4 rounded-xl hover:bg-white/90 transition flex items-center gap-3 text-left"
                  >
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-800">View All Bookings</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('Manage Services')}
                    className="bg-white/70 p-4 rounded-xl hover:bg-white/90 transition flex items-center gap-3 text-left"
                  >
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-800">Add New Service</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('Availability')}
                    className="bg-white/70 p-4 rounded-xl hover:bg-white/90 transition flex items-center gap-3 text-left"
                  >
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-800">Set Availability</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('Analytics')}
                    className="bg-white/70 p-4 rounded-xl hover:bg-white/90 transition flex items-center gap-3 text-left"
                  >
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-800">View Analytics</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Old code sections removed - using extracted components */}
          {false && activeTab === 'Manage Services' && (
            <div className="space-y-6 sm:space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-pink-accent">Manage Services</h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">Organize your main services and add-ons</p>
                </div>
                <div className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                  {mainServices.length + addOns.length} total services
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-pink-50 to-pink-100 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-pink-200 text-sm sm:text-base"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-pink-accent/20 rounded-xl">
                      <svg className="w-6 h-6 text-pink-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.586V5L8 4z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Main Services</h3>
                  <p className="text-3xl font-bold text-pink-accent">{mainServices.length}</p>
                  <p className="text-sm text-gray-600 mt-1">core offerings</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-purple-200 text-sm sm:text-base"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Add-ons</h3>
                  <p className="text-3xl font-bold text-purple-600">{addOns.length}</p>
                  <p className="text-sm text-gray-600 mt-1">additional services</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-green-200 text-sm sm:text-base"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500/20 rounded-xl">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Avg. Service Price</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency((() => {
                      const allServices = [...mainServices, ...addOns];
                      if (allServices.length === 0) return 0;
                      const avgPrice = allServices.reduce((sum, s) => sum + Number(s.price), 0) / allServices.length;
                      return Math.round(avgPrice);
                    })())}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">across all services</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-blue-200 text-sm sm:text-base"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Avg. Duration</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {(() => {
                      const allServices = [...mainServices, ...addOns];
                      if (allServices.length === 0) return '0m';
                      const avgDuration = allServices.reduce((sum, s) => sum + Number(s.duration), 0) / allServices.length;
                      return `${Math.round(avgDuration)}m`;
                    })()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">average service time</p>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => {
                    setEditingService(null);
                    setIsAddingAddon(false);
                    reset({ is_addon: false });
                    setModalType('serviceForm');
                    setShowModal(true);
                  }} 
                  className="bg-gradient-to-r from-pink-accent to-pink-accent/80 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Main Service
                </button>
                <button 
                  onClick={() => {
                    setEditingService(null);
                    setIsAddingAddon(true);
                    reset({ is_addon: true });
                    setModalType('serviceForm');
                    setShowModal(true);
                  }} 
                  className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Add-on Service
                </button>
              </div>

              <div className="bg-white/90 backdrop-blur-md p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-soft border border-white/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 bg-pink-accent/20 rounded-lg sm:rounded-xl">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-pink-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.586V5L8 4z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Main Services</h2>
                      <p className="text-xs sm:text-sm text-gray-600">Your core beauty services</p>
                    </div>
                  </div>
                  <span className="bg-pink-accent/10 text-pink-accent px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
                    {mainServices.length} service{mainServices.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {mainServices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {mainServices.map((service) => (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="bg-gradient-to-br from-pink-50 to-white p-6 rounded-2xl shadow-soft border border-pink-200/60 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-14 h-14 bg-pink-accent/10 rounded-xl flex items-center justify-center">
                            <svg className="w-7 h-7 text-pink-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <span className="bg-pink-accent text-white px-3 py-1 rounded-full text-xs font-bold">
                            MAIN
                          </span>
                        </div>
                        <h3 className="font-bold text-xl mb-3 text-gray-900 leading-tight">{service.name}</h3>
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 flex items-center gap-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Duration
                            </span>
                            <span className="font-semibold text-gray-800">{formatDuration(service.duration)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 flex items-center gap-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              Price
                            </span>
                            <span className="text-xl font-bold text-pink-accent">{formatPrice(service.price)}</span>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => openEditModal(service)} 
                            className="flex-1 bg-baby-blue text-white px-4 py-3 rounded-xl font-medium hover:bg-baby-blue/80 transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button 
                            onClick={() => onDeleteService(service.id)} 
                            className="flex-1 bg-red-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-red-600 transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-24 h-24 bg-pink-accent/10 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <svg className="w-12 h-12 text-pink-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.586V5L8 4z" />
                      </svg>
                    </motion.div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-3">No main services yet</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">Create your first main service to start offering beauty treatments to your clients</p>
                    <button 
                      onClick={() => {
                        setEditingService(null);
                        setIsAddingAddon(false);
                        reset({ is_addon: false });
                        setModalType('serviceForm');
                        setShowModal(true);
                      }}
                      className="bg-pink-accent text-white px-8 py-4 rounded-xl font-semibold hover:bg-pink-accent/90 transition-all duration-200 flex items-center gap-3 mx-auto"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Your First Main Service
                    </button>
                  </div>
                )}
              </div>

              {/* Add-ons Section */}
              <div className="bg-white/90 backdrop-blur-md p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-soft border border-white/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 bg-purple-500/20 rounded-lg sm:rounded-xl">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Add-on Services</h2>
                      <p className="text-xs sm:text-sm text-gray-600">Optional enhancements and extras</p>
                    </div>
                  </div>
                  <span className="bg-purple-100 text-purple-600 px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
                    {addOns.length} add-on{addOns.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {addOns.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {addOns.map((addon) => (
                      <motion.div
                        key={addon.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl shadow-soft border border-purple-200/60 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            ADD-ON
                          </span>
                        </div>
                        <h3 className="font-bold text-lg mb-3 text-gray-900 leading-tight">{addon.name}</h3>
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 flex items-center gap-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Duration
                            </span>
                            <span className="font-semibold text-gray-800">{formatDuration(addon.duration)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 flex items-center gap-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              Price
                            </span>
                            <span className="text-lg font-bold text-purple-600">{formatPrice(addon.price)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => openEditModal(addon)} 
                            className="flex-1 bg-baby-blue text-white px-3 py-2 rounded-xl font-medium hover:bg-baby-blue/80 transition-all duration-200 flex items-center justify-center gap-1 text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button 
                            onClick={() => onDeleteService(addon.id)} 
                            className="flex-1 bg-red-500 text-white px-3 py-2 rounded-xl font-medium hover:bg-red-600 transition-all duration-200 flex items-center justify-center gap-1 text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </motion.div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-3">No add-on services yet</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">Create optional add-on services to enhance your main treatments and increase revenue</p>
                    <button 
                      onClick={() => {
                        setEditingService(null);
                        setIsAddingAddon(true);
                        reset({ is_addon: true });
                        setModalType('serviceForm');
                        setShowModal(true);
                      }}
                      className="bg-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200 flex items-center gap-3 mx-auto"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Your First Add-on
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {false && activeTab === 'Availability' && (
            <div className="space-y-6 sm:space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-pink-accent">Manage Availability</h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">Set your working hours and manage your schedule</p>
                </div>
                <div className="text-xs sm:text-sm text-gray-500">
                  {availableDays.length} available days
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-green-200"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-green-500/20 rounded-lg sm:rounded-xl">
                      <svg className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-sm sm:text-lg font-bold text-gray-800 mb-1">Available Days</h3>
                  <p className="text-xl sm:text-3xl font-bold text-green-600">{availableDays.length}</p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">days with hours</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-blue-200"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-blue-500/20 rounded-lg sm:rounded-xl">
                      <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-sm sm:text-lg font-bold text-gray-800 mb-1">Selected Days</h3>
                  <p className="text-xl sm:text-3xl font-bold text-blue-600">{selectedDays.length}</p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">for batch ops</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-orange-200"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-orange-500/20 rounded-lg sm:rounded-xl">
                      <svg className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-sm sm:text-lg font-bold text-gray-800 mb-1">This Week</h3>
                  <p className="text-xl sm:text-3xl font-bold text-orange-600">
                    {(() => {
                      const startOfWeek = new Date();
                      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
                      const endOfWeek = new Date(startOfWeek);
                      endOfWeek.setDate(startOfWeek.getDate() + 6);
                      
                      return availableDays.filter(dateStr => {
                        const date = new Date(dateStr);
                        return date >= startOfWeek && date <= endOfWeek;
                      }).length;
                    })()}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">available days</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-purple-200"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-purple-500/20 rounded-lg sm:rounded-xl">
                      <svg className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-sm sm:text-lg font-bold text-gray-800 mb-1">Current Month</h3>
                  <p className="text-sm sm:text-lg font-bold text-purple-600">
                    {format(calendarDate, 'MMM yyyy')}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">viewing calendar</p>
                </motion.div>
              </div>

              {/* Calendar Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Calendar Container */}
                <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-accent/20 rounded-lg">
                        <svg className="w-5 h-5 text-pink-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">Calendar</h2>
                        <p className="text-sm text-gray-600">Click dates to manage</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-center text-xs">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-pink-accent/60 border-2 border-pink-accent"></span>
                        Available
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-blue-500/60 border-2 border-blue-500"></span>
                        Selected
                      </span>
                    </div>
                  </div>

                  {/* Custom Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      aria-label="Previous Month"
                      className="p-2 rounded-lg bg-pink-accent/10 hover:bg-pink-accent/20 text-pink-accent transition flex items-center justify-center"
                      onClick={() => setCalendarDate(prev => {
                        const prevMonth = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
                        return prevMonth;
                      })}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-lg font-bold text-gray-800">
                      {format(calendarDate, 'MMMM yyyy')}
                    </h3>
                    <button
                      aria-label="Next Month"
                      className="p-2 rounded-lg bg-pink-accent/10 hover:bg-pink-accent/20 text-pink-accent transition flex items-center justify-center"
                      onClick={() => setCalendarDate(prev => {
                        const nextMonth = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
                        return nextMonth;
                      })}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  <div className="max-w-full sm:max-w-md mx-auto overflow-x-auto">
                    <Calendar
                      selectRange={false}
                      onClickDay={(value) => {
                        const dateStr = format(value, 'yyyy-MM-dd');
                        const isAvailable = availableDays.includes(dateStr);
                        if (isAvailable) {
                          setEditDate(value);
                          setEditTimes(null);
                          setSingleDayAction('editHours');
                          setModalType('editSingleDay');
                          setShowModal(true);
                          fetchDateDetailsForDate(value);
                        } else {
                          setSelectedDays((prev) => {
                            const exists = prev.some(d => d.toDateString() === value.toDateString());
                            return exists ? prev.filter(d => d.toDateString() !== value.toDateString()) : [...prev, value];
                          });
                        }
                      }}
                      value={undefined}
                      activeStartDate={calendarDate}
                      tileClassName={({ date }) => {
                        const isSelected = selectedDays.some(d => d.toDateString() === date.toDateString());
                        const isAvailable = availableDays.includes(format(date, 'yyyy-MM-dd'));
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const dateObj = new Date(date);
                        dateObj.setHours(0,0,0,0);
                        if (isAvailable && dateObj >= today) return 'bg-pink-accent/60 text-gray-900 font-bold rounded-full border-2 border-pink-accent';
                        if (isSelected) return 'bg-blue-500/60 text-gray-900 font-bold rounded-full border-2 border-blue-500';
                        return '';
                      }}
                      className="rounded-xl shadow-sm w-full min-w-[280px]"
                      allowPartialRange={false}
                      minDetail="month"
                      showNeighboringMonth={false}
                      showDoubleView={false}
                      calendarType="gregory"
                      locale="en-US"
                      showNavigation={false}
                    />
                  </div>
                </div>

                {/* Right Sidebar - Selection Info & Actions */}
                <div className="space-y-6">
                  {/* Selected Days Display */}
                  <div className="bg-white p-6 rounded-2xl shadow-soft">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Selected Days
                    </h3>
                    {selectedDays.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {selectedDays.map((day, index) => (
                            <span key={index} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                              {format(day, 'MMM d')}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600">
                          {selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''} selected for batch operations
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-sm">No days selected</p>
                        <p className="text-gray-400 text-xs mt-1">Click calendar dates to select</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="bg-white p-6 rounded-2xl shadow-soft">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Quick Actions
                    </h3>
                    <div className="space-y-3">
                      <button 
                        onClick={() => { setModalType('blockTime'); setShowModal(true); }} 
                        className="w-full bg-gradient-to-r from-red-500 to-red-400 text-white px-4 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={selectedDays.length === 0}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12M6 6l12 12" />
                        </svg>
                        Block Selected Days
                      </button>
                      
                      <button 
                        onClick={() => { setModalType('openHours'); setShowModal(true); }} 
                        className="w-full bg-gradient-to-r from-green-500 to-green-400 text-white px-4 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={selectedDays.length === 0}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Set Open Hours
                      </button>
                      
                      <button 
                        onClick={async () => {
                          try {
                            setShowSuccess('🔄 Syncing Google Calendar (this may take up to 60 seconds)...');
                            const today = new Date();
                            const twoMonthsFromNow = addMonths(today, 2);
                            const startDate = format(today, 'yyyy-MM-dd');
                            const endDate = format(twoMonthsFromNow, 'yyyy-MM-dd');
                            
                            const result = await api.post('/api/availability/sync', { 
                              startDate,
                              endDate
                            });
                            
                            setShowSuccess(`✅ Synced ${result.synced || 0} time slots from Google Calendar`);
                            setTimeout(() => setShowSuccess(null), 8000);
                            
                            // Refresh available dates after sync
                            api.get('/api/availability/dates').then((data: { availableDates: string[] }) => {
                              if (data && Array.isArray(data.availableDates)) {
                                const today = new Date();
                                today.setHours(0,0,0,0);
                                const available = data.availableDates.filter((dateStr: string) => {
                                  const dateObj = new Date(dateStr);
                                  dateObj.setHours(0,0,0,0);
                                  return dateObj >= today;
                                });
                                setAvailableDays(available);
                              }
                            });
                          } catch (error: any) {
                            const errorMsg = error.message || 'Unknown error';
                            setShowSuccess(`❌ Sync failed: ${errorMsg}. Please try again.`);
                            setTimeout(() => setShowSuccess(null), 8000);
                          }
                        }} 
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-400 text-white px-4 py-3 rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 font-medium flex items-center justify-center gap-2 touch-manipulation"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Sync Google Calendar (Next 2 Months)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-xl text-center font-medium shadow-soft"
                >
                  {showSuccess}
                </motion.div>
              )}
            </div>
          )}
          {false && activeTab === 'Bookings' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex flex-col items-start">
                  <h1 className="text-3xl font-bold text-pink-accent">Bookings</h1>
                  <p className="text-gray-600 mt-1">
                    {searchTerm 
                      ? `${filteredBookings.length} of ${showPastBookings ? bookings.filter(b => new Date(b.date) < new Date()).length : bookings.filter(b => new Date(b.date) >= new Date()).length} ${showPastBookings ? 'past' : 'upcoming'} bookings`
                      : `${filteredBookings.length} ${showPastBookings ? 'past' : 'upcoming'} bookings`
                    }
                  </p>
                </div>
                <div className="relative w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, or booking ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-80 px-4 py-3 pl-10 pr-10 border border-baby-blue/50 rounded-xl focus:border-pink-accent outline-none bg-white/50"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-pink-accent transition"
                      aria-label="Clear search"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {/* Toggle for Past/Upcoming Bookings */}
              <div className="flex justify-center mb-4">
                <div className="bg-white/90 backdrop-blur-md rounded-full p-1 shadow-soft">
                  <button
                    onClick={() => setShowPastBookings(false)}
                    className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                      !showPastBookings 
                        ? 'bg-pink-accent text-white shadow-md' 
                        : 'text-gray-600 hover:text-pink-accent'
                    }`}
                  >
                    Upcoming Bookings
                  </button>
                  <button
                    onClick={() => setShowPastBookings(true)}
                    className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                      showPastBookings 
                        ? 'bg-pink-accent text-white shadow-md' 
                        : 'text-gray-600 hover:text-pink-accent'
                    }`}
                  >
                    Past Bookings
                  </button>
                </div>
              </div>

              {/* Time Filter Toggle - Mobile First */}
              <div className="mb-6">
                <div className="bg-white/90 backdrop-blur-md rounded-2xl p-2 shadow-soft grid grid-cols-4 gap-2">
                  {(['today', 'week', 'month', 'all'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTimeFilter(filter)}
                      className={`px-2 sm:px-4 py-3 rounded-xl font-medium transition-all duration-300 text-xs sm:text-sm ${
                        timeFilter === filter 
                          ? 'bg-baby-blue text-white shadow-md' 
                          : 'text-gray-600 hover:text-baby-blue hover:bg-baby-blue/10'
                      }`}
                    >
                      {filter === 'today' ? 'Today' : 
                       filter === 'week' ? 'This Week' : 
                       filter === 'month' ? 'This Month' : 'All'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                {(() => {
                  if (timeFilter === 'today') {
                    // For today view, group by date and show times prominently
                    const groupedByDate = groupBookingsByDate(filteredBookings);
                    return Object.keys(groupedByDate)
                      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                      .map(dateKey => (
                        <div key={dateKey} className="space-y-4">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-2 bg-pink-accent rounded-full"></div>
                            <h3 className="text-xl font-bold text-gray-800">
                              {new Date(dateKey).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </h3>
                            <span className="bg-pink-accent/10 text-pink-accent px-3 py-1 rounded-full text-sm font-medium">
                              {groupedByDate[dateKey].length} appointment{groupedByDate[dateKey].length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="space-y-3">
                            {groupedByDate[dateKey].map((booking) => (
                              <div 
                                key={booking.id} 
                                className="bg-white p-4 rounded-xl shadow-md border border-baby-blue/20 hover:shadow-lg transition cursor-pointer"
                                onClick={() => openBookingDetailsModal(booking)}
                              >
                                {/* Mobile Layout */}
                                <div className="block md:hidden space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="bg-pink-accent/10 text-pink-accent px-3 py-2 rounded-lg font-bold text-lg">
                                      {booking.time}
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-pink-accent">{formatCurrency(Number(booking.price || 0))}</p>
                                      <p className="text-xs text-gray-500">ID: {(booking.booking_reference || String(booking.id))}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-800 text-lg">{booking.client_name}</h4>
                                    <p className="text-gray-600 mb-1">{booking.service_name || booking.service_id}</p>
                                    <p className="text-sm text-gray-500">{booking.client_email}</p>
                                    <p className="text-sm text-gray-500">{booking.client_phone}</p>
                                  </div>
                                  {!showPastBookings && (
                                    <div className="flex gap-2 pt-2">
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditBookingModal(booking);
                                        }}
                                        className="flex-1 bg-baby-blue text-white py-2 px-3 rounded-lg hover:bg-baby-blue/80 transition text-sm font-medium"
                                      >
                                        Edit
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onCancelBooking(booking.token);
                                        }}
                                        className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition text-sm font-medium"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Desktop Layout */}
                                <div className="hidden md:flex items-center gap-4">
                                  <div className="flex-shrink-0">
                                    <div className="bg-pink-accent/10 text-pink-accent px-4 py-2 rounded-lg font-bold text-lg">
                                      {booking.time}
                                    </div>
                                  </div>
                                  <div className="flex-grow">
                                    <h4 className="font-semibold text-gray-800">{booking.client_name}</h4>
                                    <p className="text-gray-600">{booking.service_name || booking.service_id}</p>
                                    <p className="text-sm text-gray-500">{booking.client_email} • {booking.client_phone}</p>
                                  </div>
                                  <div className="flex-shrink-0 text-right">
                                    <p className="font-bold text-pink-accent">{formatCurrency(Number(booking.price || 0))}</p>
                                    <p className="text-xs text-gray-500">ID: {(booking.booking_reference || String(booking.id))}</p>
                                  </div>
                                  {!showPastBookings && (
                                    <div className="flex-shrink-0 flex gap-2">
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditBookingModal(booking);
                                        }}
                                        className="bg-baby-blue text-white px-3 py-2 rounded-lg hover:bg-baby-blue/80 transition text-sm"
                                      >
                                        Edit
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onCancelBooking(booking.token);
                                        }}
                                        className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition text-sm"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                  } else if (timeFilter === 'week') {
                    // For week view, group by date and show day names
                    const groupedByDate = groupBookingsByDate(filteredBookings);
                    return Object.keys(groupedByDate)
                      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                      .map(dateKey => (
                        <div key={dateKey} className="space-y-4">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-2 bg-baby-blue rounded-full"></div>
                            <h3 className="text-lg font-bold text-gray-800">
                              {new Date(dateKey).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </h3>
                            <span className="bg-baby-blue/10 text-baby-blue px-3 py-1 rounded-full text-sm font-medium">
                              {groupedByDate[dateKey].length} appointment{groupedByDate[dateKey].length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="grid gap-3">
                            {groupedByDate[dateKey].map((booking) => (
                              <div 
                                key={booking.id} 
                                className="bg-white p-4 rounded-xl shadow-md border border-baby-blue/20 hover:shadow-lg transition cursor-pointer"
                                onClick={() => openBookingDetailsModal(booking)}
                              >
                                {/* Mobile Layout */}
                                <div className="block md:hidden space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="bg-baby-blue/10 text-baby-blue px-3 py-1 rounded-lg font-semibold">
                                      {booking.time}
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-pink-accent">{formatCurrency(Number(booking.price || 0))}</p>
                                      <p className="text-xs text-gray-500">ID: {(booking.booking_reference || String(booking.id))}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-800 text-lg">{booking.client_name}</h4>
                                    <p className="text-gray-600 mb-1">{booking.service_name || booking.service_id}</p>
                                    <p className="text-sm text-gray-500">{booking.client_email}</p>
                                  </div>
                                  {!showPastBookings && (
                                    <div className="flex gap-2 pt-2">
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditBookingModal(booking);
                                        }}
                                        className="flex-1 bg-baby-blue text-white py-2 px-3 rounded-lg hover:bg-baby-blue/80 transition text-sm font-medium"
                                      >
                                        Edit
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onCancelBooking(booking.token);
                                        }}
                                        className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition text-sm font-medium"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Desktop Layout */}
                                <div className="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                  <div className="flex items-center gap-4">
                                    <div className="bg-baby-blue/10 text-baby-blue px-3 py-1 rounded-lg font-semibold">
                                      {booking.time}
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-800">{booking.client_name}</h4>
                                      <p className="text-gray-600">{booking.service_name || booking.service_id}</p>
                                      <p className="text-sm text-gray-500">{booking.client_email}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <p className="font-bold text-pink-accent">{formatCurrency(Number(booking.price || 0))}</p>
                                      <p className="text-xs text-gray-500">ID: {(booking.booking_reference || String(booking.id))}</p>
                                    </div>
                                    {!showPastBookings && (
                                      <div className="flex gap-2">
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openEditBookingModal(booking);
                                          }}
                                          className="bg-baby-blue text-white px-3 py-2 rounded-lg hover:bg-baby-blue/80 transition text-sm"
                                        >
                                          Edit
                                        </button>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onCancelBooking(booking.token);
                                          }}
                                          className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition text-sm"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                  } else if (timeFilter === 'month') {
                    // For month view, group by weeks
                    const groupedByWeek = groupBookingsByWeek(filteredBookings);
                    return Object.keys(groupedByWeek)
                      .sort((a, b) => new Date(a.split(' - ')[0]).getTime() - new Date(b.split(' - ')[0]).getTime())
                      .map(weekKey => (
                        <div key={weekKey} className="space-y-4">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <h3 className="text-lg font-bold text-gray-800">
                              Week of {weekKey}
                            </h3>
                            <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">
                              {groupedByWeek[weekKey].length} appointment{groupedByWeek[weekKey].length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="grid gap-3">
                            {groupedByWeek[weekKey].map((booking) => (
                              <div 
                                key={booking.id} 
                                className="bg-white p-4 rounded-xl shadow-md border border-purple-200 hover:shadow-lg transition cursor-pointer"
                                onClick={() => openBookingDetailsModal(booking)}
                              >
                                {/* Mobile Layout */}
                                <div className="block md:hidden space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="text-center">
                                      <div className="bg-purple-100 text-purple-600 px-3 py-1 rounded-lg font-semibold text-sm">
                                        {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </div>
                                      <div className="text-purple-500 text-xs mt-1">{booking.time}</div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-pink-accent">{formatCurrency(Number(booking.price || 0))}</p>
                                      <p className="text-xs text-gray-500">ID: {(booking.booking_reference || String(booking.id))}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-800 text-lg">{booking.client_name}</h4>
                                    <p className="text-gray-600 mb-1">{booking.service_name || booking.service_id}</p>
                                    <p className="text-sm text-gray-500">{booking.client_email}</p>
                                  </div>
                                  {!showPastBookings && (
                                    <div className="flex gap-2 pt-2">
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditBookingModal(booking);
                                        }}
                                        className="flex-1 bg-baby-blue text-white py-2 px-3 rounded-lg hover:bg-baby-blue/80 transition text-sm font-medium"
                                      >
                                        Edit
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onCancelBooking(booking.token);
                                        }}
                                        className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition text-sm font-medium"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Desktop Layout */}
                                <div className="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                  <div className="flex items-center gap-4">
                                    <div className="text-center">
                                      <div className="bg-purple-100 text-purple-600 px-3 py-1 rounded-lg font-semibold text-sm">
                                        {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </div>
                                      <div className="text-purple-500 text-xs mt-1">{booking.time}</div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-800">{booking.client_name}</h4>
                                      <p className="text-gray-600">{booking.service_name || booking.service_id}</p>
                                      <p className="text-sm text-gray-500">{booking.client_email}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <p className="font-bold text-pink-accent">{formatCurrency(Number(booking.price || 0))}</p>
                                      <p className="text-xs text-gray-500">ID: {(booking.booking_reference || String(booking.id))}</p>
                                    </div>
                                    {!showPastBookings && (
                                      <div className="flex gap-2">
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openEditBookingModal(booking);
                                          }}
                                          className="bg-baby-blue text-white px-3 py-2 rounded-lg hover:bg-baby-blue/80 transition text-sm"
                                        >
                                          Edit
                                        </button>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onCancelBooking(booking.token);
                                          }}
                                          className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition text-sm"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                  } else {
                    // For 'all' view, group by months
                    const groupedByMonth = groupBookingsByMonth(filteredBookings);
                    return Object.keys(groupedByMonth)
                      .sort((a, b) => {
                        // Parse month strings like "August 2025" for proper sorting
                        const dateA = new Date(a + ' 1');
                        const dateB = new Date(b + ' 1');
                        return dateA.getTime() - dateB.getTime();
                      })
                      .map(monthKey => (
                        <div key={monthKey} className="space-y-4">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                            <h3 className="text-lg font-bold text-gray-800">
                              {monthKey}
                            </h3>
                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                              {groupedByMonth[monthKey].length} appointment{groupedByMonth[monthKey].length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="grid gap-3">
                            {groupedByMonth[monthKey].map((booking) => (
                              <div 
                                key={booking.id} 
                                className="bg-white p-4 rounded-xl shadow-md border border-gray-300/20 hover:shadow-lg transition cursor-pointer"
                                onClick={() => openBookingDetailsModal(booking)}
                              >
                                {/* Mobile Layout */}
                                <div className="block md:hidden space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="text-center flex-shrink-0">
                                      <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg font-semibold text-sm">
                                        {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </div>
                                      <div className="text-gray-600 text-xs mt-1">{booking.time}</div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-pink-accent">{formatCurrency(Number(booking.price || 0))}</p>
                                      <p className="text-xs text-gray-500">ID: {(booking.booking_reference || String(booking.id))}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-800 text-lg">{booking.client_name}</h4>
                                    <p className="text-gray-600 mb-1">{booking.service_name || booking.service_id}</p>
                                    <p className="text-sm text-gray-500">{booking.client_email} • {booking.client_phone}</p>
                                  </div>
                                  {!showPastBookings && (
                                    <div className="flex gap-2 pt-2">
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditBookingModal(booking);
                                        }}
                                        className="flex-1 bg-baby-blue text-white py-2 px-3 rounded-lg hover:bg-baby-blue/80 transition text-sm font-medium"
                                      >
                                        Edit
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onCancelBooking(booking.token);
                                        }}
                                        className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition text-sm font-medium"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Desktop Layout */}
                                <div className="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                  <div className="flex items-center gap-4 flex-grow">
                                    <div className="text-center flex-shrink-0">
                                      <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg font-semibold text-sm">
                                        {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </div>
                                      <div className="text-gray-600 text-xs mt-1">{booking.time}</div>
                                    </div>
                                    <div className="flex-grow">
                                      <h4 className="font-semibold text-gray-800">{booking.client_name}</h4>
                                      <p className="text-gray-600">{booking.service_name || booking.service_id}</p>
                                      <p className="text-sm text-gray-500">{booking.client_email} • {booking.client_phone}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <p className="font-bold text-pink-accent">{formatCurrency(Number(booking.price || 0))}</p>
                                      <p className="text-xs text-gray-500">ID: {(booking.booking_reference || String(booking.id))}</p>
                                    </div>
                                    {!showPastBookings && (
                                      <div className="flex gap-2">
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openEditBookingModal(booking);
                                          }} 
                                          className="bg-baby-blue text-white px-3 py-2 rounded-lg hover:bg-baby-blue/80 transition text-sm"
                                        >
                                          Edit
                                        </button>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onCancelBooking(booking.token);
                                          }} 
                                          className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition text-sm"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                  }
                })()}
                {filteredBookings.length === 0 && (showPastBookings ? bookings.filter(b => new Date(b.date) < new Date()).length : bookings.filter(b => new Date(b.date) >= new Date()).length) > 0 && (
                  <div className="bg-baby-blue/10 p-8 rounded-2xl text-center text-lg text-gray-500 font-semibold">
                    No {showPastBookings ? 'past' : 'upcoming'} bookings match your search criteria for {timeFilter === 'today' ? 'today' : timeFilter === 'week' ? 'this week' : timeFilter === 'month' ? 'this month' : 'the selected period'}.
                  </div>
                )}
                {(showPastBookings ? bookings.filter(b => new Date(b.date) < new Date()).length : bookings.filter(b => new Date(b.date) >= new Date()).length) === 0 && (
                  <div className="bg-baby-blue/10 p-8 rounded-2xl text-center text-lg text-gray-500 font-semibold">
                    No {showPastBookings ? 'past' : 'upcoming'} bookings found.
                  </div>
                )}
              </div>
            </div>
          )}
          {false && activeTab === 'Clients' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex flex-col items-start">
                  <h1 className="text-3xl font-bold text-pink-accent">Clients</h1>
                  <p className="text-gray-600 mt-1">
                    {clientSearchTerm 
                      ? `${clients.filter(c => 
                          c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                          c.phone.includes(clientSearchTerm) ||
                          c.email.toLowerCase().includes(clientSearchTerm.toLowerCase())
                        ).length} of ${clients.length} clients`
                      : `${clients.length} clients`
                    }
                  </p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-80">
                    <input
                      type="text"
                      placeholder="Search by name, phone, or email..."
                      value={clientSearchTerm}
                      onChange={(e) => setClientSearchTerm(e.target.value)}
                      className="w-full px-4 py-3 pl-10 pr-10 border border-baby-blue/50 rounded-xl focus:border-pink-accent outline-none bg-white/50"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {clientSearchTerm && (
                      <button
                        onClick={() => setClientSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-pink-accent transition"
                        aria-label="Clear search"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowAddClientModal(true);
                      setCreateBookingForClient(false);
                    }}
                    className="bg-pink-accent text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-pink-accent/90 transition font-medium text-sm sm:text-base"
                  >
                    + Add Client
                  </button>
                </div>
              </div>

              {loadingClients ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-accent"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {clients.filter(c => 
                    !clientSearchTerm ||
                    c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                    c.phone.includes(clientSearchTerm) ||
                    c.email.toLowerCase().includes(clientSearchTerm.toLowerCase())
                  ).length === 0 ? (
                    <div className="bg-baby-blue/10 p-8 rounded-2xl text-center text-lg text-gray-500 font-semibold">
                      {clientSearchTerm ? 'No clients match your search' : 'No clients found'}
                    </div>
                  ) : (
                    clients
                      .filter(c => 
                        !clientSearchTerm ||
                        c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                        c.phone.includes(clientSearchTerm) ||
                        c.email.toLowerCase().includes(clientSearchTerm.toLowerCase())
                      )
                      .map((client) => (
                        <div
                          key={client.phone}
                          className="bg-white rounded-xl p-6 shadow-soft hover:shadow-md transition border border-baby-blue/20"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex-1">
                              <h3 
                                onClick={() => {
                                  setSelectedClient({
                                    ...client,
                                    bookings: []
                                  } as Client);
                                  setShowClientDetailsModal(true);
                                  api.get(`/api/clients/${encodeURIComponent(client.phone)}`)
                                    .then((clientData: Client) => {
                                      setSelectedClient(clientData);
                                    })
                                    .catch((err) => {
                                      if (import.meta.env.DEV) console.error('Error fetching client details:', err);
                                      setError(err.message);
                                    });
                                }}
                                className="text-xl font-bold text-pink-accent mb-2 cursor-pointer hover:text-pink-accent/80 transition"
                              >
                                {client.name}
                              </h3>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  {client.phone}
                                </p>
                                {client.email && (
                                  <p className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {client.email}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full sm:w-auto">
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Bookings</p>
                                <p className="text-lg font-bold text-pink-accent">{client.totalBookings}</p>
                                <p className="text-xs text-gray-400">
                                  {client.activeBookings} active, {client.cancelledBookings} cancelled
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Total Spent</p>
                                <p className="text-lg font-bold text-pink-accent">{formatCurrency(client.totalSpent)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Avg Booking</p>
                                <p className="text-lg font-bold text-pink-accent">{formatCurrency(client.averageBookingValue)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Last Visit</p>
                                <p className="text-sm font-semibold text-gray-700">
                                  {client.lastVisit ? format(new Date(client.lastVisit), 'MMM d') : 'Never'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          )}
          {false && activeTab === 'Analytics' && (
            <div className="space-y-6 sm:space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-pink-accent">Analytics Dashboard</h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">Business insights and performance metrics</p>
                </div>
                
                {/* Time Range Filter */}
                <div className="bg-white rounded-xl p-2 shadow-soft">
                  <select 
                    value={analyticsTimeRange} 
                    onChange={(e) => setAnalyticsTimeRange(e.target.value as 'week' | 'month' | 'quarter' | 'year')}
                    className="bg-transparent border-none focus:outline-none text-gray-700 font-medium"
                  >
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last 3 Months</option>
                    <option value="year">Last 12 Months</option>
                  </select>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-2xl shadow-soft border border-pink-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-pink-accent/20 rounded-xl">
                      <svg className="w-6 h-6 text-pink-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      +{typeof analytics.revenueGrowth === 'number' && !isNaN(analytics.revenueGrowth) ? analytics.revenueGrowth : 0}%
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Total Revenue</h3>
                  <p className="text-3xl font-bold text-pink-accent">
                    {typeof analytics.totalRevenue === 'number' && !isNaN(analytics.totalRevenue)
                      ? formatCurrency(analytics.totalRevenue)
                      : formatCurrency(0)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">vs. previous period</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-soft border border-blue-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-baby-blue/20 rounded-xl">
                      <svg className="w-6 h-6 text-baby-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {analytics.bookingGrowth || 0}%
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Total Bookings</h3>
                  <p className="text-3xl font-bold text-baby-blue">
                    {typeof analytics.totalBookings === 'number' && !isNaN(analytics.totalBookings) ? analytics.totalBookings : 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">appointments completed</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl shadow-soft border border-purple-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      +{analytics.newClientsGrowth || 0}%
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Total Clients</h3>
                  <p className="text-3xl font-bold text-purple-600">
                    {typeof analytics.totalClients === 'number' && !isNaN(analytics.totalClients) ? analytics.totalClients : 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">unique customers</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl shadow-soft border border-green-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500/20 rounded-xl">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Avg. Booking Value</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {typeof analytics.avgBookingValue === 'number' && !isNaN(analytics.avgBookingValue)
                      ? formatCurrency(analytics.avgBookingValue)
                      : formatCurrency(0)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">per appointment</p>
                </motion.div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-soft">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Revenue Trend</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setRevenueChartType('daily')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                          revenueChartType === 'daily' ? 'bg-pink-accent text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        Daily
                      </button>
                      <button 
                        onClick={() => setRevenueChartType('weekly')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                          revenueChartType === 'weekly' ? 'bg-pink-accent text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        Weekly
                      </button>
                    </div>
                  </div>
                  {/* Simple revenue bars visualization */}
                  <div className="space-y-3">
                    {analytics.revenueChart && analytics.revenueChart.length > 0 ? (
                      analytics.revenueChart.map((item: any, index: number) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-16 text-sm text-gray-600 font-medium">{item.label}</div>
                          <div className="flex-1 bg-gray-100 rounded-full h-3 relative overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-pink-accent to-pink-accent/80 rounded-full transition-all duration-500"
                              style={{ width: `${(item.value / Math.max(...analytics.revenueChart.map((i: any) => i.value))) * 100}%` }}
                            ></div>
                          </div>
                          <div className="w-20 text-sm text-gray-800 font-bold text-right">{formatCurrency(Number(item.value))}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p>No revenue trend data yet</p>
                        <p className="text-sm">Data will appear as bookings are completed</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Performance */}
                <div className="bg-white p-6 rounded-2xl shadow-soft">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Service Performance</h3>
                  <div className="space-y-4">
                    {analytics.serviceStats && analytics.serviceStats.length > 0 ? (
                      analytics.serviceStats.map((service: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{service.name}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-gray-600">{typeof service.bookings === 'number' && !isNaN(service.bookings) ? service.bookings : 0} bookings</span>
                              <span className="text-sm text-pink-accent font-medium">
                                {formatCurrency(Number(service.revenue))}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-800">{typeof service.percentage === 'number' && !isNaN(service.percentage) ? service.percentage : 0}%</div>
                            <div className="text-xs text-gray-500">of total</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.586V5L8 4z" />
                        </svg>
                        <p>No service performance data yet</p>
                        <p className="text-sm">Performance metrics will appear as services are booked</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed Analytics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Peak Hours */}
                <div className="bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-white/20">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Peak Hours
                  </h3>
                  <div className="space-y-3">
                    {analytics.peakHours && analytics.peakHours.length > 0 ? (
                      analytics.peakHours.map((hour: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">{hour.time}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                style={{ width: `${hour.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-12 text-right">{hour.bookings}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>No peak hours data yet</p>
                        <p className="text-sm">Patterns will appear as bookings accumulate</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Insights */}
                <div className="bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-white/20">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Customer Insights
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-700">Repeat Customers</span>
                        <span className="text-lg font-bold text-purple-600">{analytics.repeatCustomerRate}%</span>
                      </div>
                      <div className="w-full bg-purple-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${analytics.repeatCustomerRate}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">New Clients This Period</span>
                        <span className="font-bold text-gray-800">{analytics.newClientsThisPeriod}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Avg. Visits per Client</span>
                        <span className="font-bold text-gray-800">{analytics.avgVisitsPerClient}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Client Retention Rate</span>
                        <span className="font-bold text-green-600">{analytics.clientRetentionRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Trends */}
                <div className="bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-white/20">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Booking Trends
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">{analytics.avgBookingsPerDay}</div>
                        <div className="text-sm text-blue-700">Avg. bookings/day</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Busiest Day</span>
                        <span className="font-bold text-gray-800">{analytics.busiestDay}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Cancellation Rate</span>
                        <span className={`font-bold ${analytics.cancellationRate > 15 ? 'text-red-600' : 'text-green-600'}`}>
                          {analytics.cancellationRate}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">No-show Rate</span>
                        <span className={`font-bold ${analytics.noShowRate > 10 ? 'text-red-600' : 'text-green-600'}`}>
                          {analytics.noShowRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* VIP Clients & Add-ons Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* VIP Clients */}
                <div className="bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-white/20">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                      <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      VIP Clients
                    </h3>
                    <span className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
                      {analytics.vipClients?.length || 0} clients
                    </span>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {analytics.vipClients?.map((client: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                        <div>
                          <h4 className="font-semibold text-gray-800">{client.name}</h4>
                          <p className="text-sm text-gray-600">
                            {client.visits} visits • {
                              (() => {
                                let totalSpent = client.totalSpent;
                                if (Array.isArray(totalSpent)) {
                                  totalSpent = totalSpent.reduce((sum, v) => sum + (typeof v === 'number' ? v : parseFloat(v)), 0);
                                } else if (typeof totalSpent === 'string') {
                                  const matches = totalSpent.match(/\d+\.?\d*/g);
                                  if (matches) {
                                    totalSpent = matches.reduce((sum, v) => sum + parseFloat(v), 0);
                                  } else {
                                    totalSpent = parseFloat(totalSpent);
                                  }
                                }
                                if (isNaN(totalSpent)) totalSpent = 0;
                                return formatCurrency(totalSpent);
                              })()
                            } spent
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-yellow-700">
                            Last visit: {new Date(client.lastVisit).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!analytics.vipClients || analytics.vipClients.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p>No VIP clients yet</p>
                        <p className="text-sm">Clients with 3+ bookings will appear here</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add-ons Performance */}
                <div className="bg-white p-6 rounded-2xl shadow-soft">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add-ons Performance
                  </h3>
                  <div className="space-y-4">
                    {analytics.addonStats?.map((addon: any, index: number) => (
                      <div key={index} className="p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-800">{addon.name}</h4>
                          <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            {addon.popularityRate}% adoption
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Bookings</span>
                            <div className="font-bold text-gray-800">{addon.bookings}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Revenue</span>
                            <div className="font-bold text-green-600">{formatCurrency(Number(addon.revenue))}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Avg/Booking</span>
                            <div className="font-bold text-gray-800">{formatCurrency(Number(addon.avgPerBooking))}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!analytics.addonStats || analytics.addonStats.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <p>No add-on data yet</p>
                        <p className="text-sm">Add-on performance will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Monthly/Weekly Goals */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl shadow-soft border border-indigo-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Performance Goals
                  </h3>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="text-sm border rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                    {!editingGoals && (
                      <button
                        className="px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-semibold hover:bg-indigo-200 transition"
                        onClick={() => setEditingGoals(true)}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Monthly Revenue Goal */}
                  <div className="bg-white/70 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-700 font-medium">Monthly Revenue Goal</span>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="text-xs border rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={i}>
                            {new Date(2024, i).toLocaleDateString('en-US', { month: 'short' })}
                          </option>
                        ))}
                      </select>
                    </div>
                    {(() => {
                      const monthStart = new Date(selectedYear, selectedMonth, 1);
                      const monthEnd = new Date(selectedYear, selectedMonth + 1, 0);
                      const daysInMonth = monthEnd.getDate();
                      const monthRevenue = bookings
                        .filter(b => {
                          const bookingDate = new Date(b.date);
                          return bookingDate >= monthStart && bookingDate <= monthEnd;
                        })
                        .reduce((sum, b) => sum + (Number(b.price) || 0), 0);
                      const monthProgress = analytics.monthlyGoal > 0 
                        ? Math.min((monthRevenue / analytics.monthlyGoal) * 100, 100) 
                        : 0;
                      return (
                        <>
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                              style={{ width: `${monthProgress}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm items-center">
                            <span className="text-gray-600">{formatCurrency(monthRevenue)}</span>
                            {editingGoals ? (
                              <input
                                type="number"
                                className="border rounded px-2 py-1 w-24 text-right ml-2"
                                value={goalInputs.monthlyGoal}
                                onChange={e => setGoalInputs(g => ({ ...g, monthlyGoal: Number(e.target.value) }))}
                                min={0}
                              />
                            ) : (
                              <span className="text-gray-600">{formatCurrency(Number(analytics.monthlyGoal || 0))}</span>
                            )}
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="text-xs text-gray-500 text-right mb-1">
                              {monthProgress.toFixed(1)}% progress
                            </div>
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Avg. per day:</span>
                              <span className="font-semibold">
                                {formatCurrency(Math.round(monthRevenue / daysInMonth))}
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Booking Target */}
                  <div className="bg-white/70 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-700 font-medium">Booking Target</span>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="text-xs border rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={i}>
                            {new Date(2024, i).toLocaleDateString('en-US', { month: 'short' })}
                          </option>
                        ))}
                      </select>
                    </div>
                    {(() => {
                      const monthStart = new Date(selectedYear, selectedMonth, 1);
                      const monthEnd = new Date(selectedYear, selectedMonth + 1, 0);
                      const daysInMonth = monthEnd.getDate();
                      const monthBookings = bookings.filter(b => {
                        const bookingDate = new Date(b.date);
                        return bookingDate >= monthStart && bookingDate <= monthEnd;
                      }).length;
                      const bookingProgress = analytics.monthlyBookingGoal > 0 
                        ? Math.min((monthBookings / analytics.monthlyBookingGoal) * 100, 100) 
                        : 0;
                      return (
                        <>
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                              style={{ width: `${bookingProgress}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm items-center">
                            <span className="text-gray-600">{monthBookings}</span>
                            {editingGoals ? (
                              <input
                                type="number"
                                className="border rounded px-2 py-1 w-16 text-right ml-2"
                                value={goalInputs.monthlyBookingGoal}
                                onChange={e => setGoalInputs(g => ({ ...g, monthlyBookingGoal: Number(e.target.value) }))}
                                min={0}
                              />
                            ) : (
                              <span className="text-gray-600">{analytics.monthlyBookingGoal || 0}</span>
                            )}
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="text-xs text-gray-500 text-right mb-1">
                              {bookingProgress.toFixed(1)}% progress
                            </div>
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Avg. per day:</span>
                              <span className="font-semibold">
                                {(monthBookings / daysInMonth).toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Annual Revenue Total */}
                  <div className="bg-white/70 p-4 rounded-xl">
                    <div className="mb-3">
                      <span className="text-gray-700 font-medium">Annual Revenue Total</span>
                    </div>
                    {(() => {
                      const yearStart = new Date(selectedYear, 0, 1);
                      const yearEnd = new Date(selectedYear, 11, 31);
                      const annualRevenue = bookings
                        .filter(b => {
                          const bookingDate = new Date(b.date);
                          return bookingDate >= yearStart && bookingDate <= yearEnd;
                        })
                        .reduce((sum, b) => sum + (Number(b.price) || 0), 0);
                      // Calculate days in the year (handles leap years)
                      const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
                      const daysInYear = isLeapYear(selectedYear) ? 366 : 365;
                      return (
                        <>
                          <div className="text-2xl font-bold text-green-600 mb-2">
                            {formatCurrency(annualRevenue)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Total revenue for {selectedYear}
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Avg. per month:</span>
                              <span className="font-semibold">
                                {formatCurrency(Math.round(annualRevenue / 12))}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Avg. per day:</span>
                              <span className="font-semibold">
                                {formatCurrency(Math.round(annualRevenue / daysInYear))}
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                {editingGoals && (
                  <div className="flex gap-3 mt-6">
                    <button
                      className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
                      onClick={() => {
                        setEditingGoals(false);
                        setGoalInputs({
                          monthlyGoal: analytics.monthlyGoal,
                          monthlyBookingGoal: analytics.monthlyBookingGoal
                        });
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
                      onClick={handleSaveGoals}
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
        {/* ...existing code... */}
              {/* ...existing code... */}
        {modalType === 'editHours' && (
          <form onSubmit={handleSubmit(onEditOpenHours)}>
            <h2 className="text-2xl font-bold mb-4">Edit Open Hours for {format(editDate ?? new Date(), 'MMM d, yyyy')}</h2>
            <input {...register('start_time')} defaultValue={editTimes?.start_time || ''} placeholder="Start Time (HH:mm)" className="block w-full mb-4 p-2 border rounded" />
            <input {...register('end_time')} defaultValue={editTimes?.end_time || ''} placeholder="End Time (HH:mm)" className="block w-full mb-4 p-2 border rounded" />
            <button type="submit" className="bg-pink-accent text-white px-6 py-3 rounded-full w-full">Update Hours</button>
          </form>
        )}
        {/* ...existing code... */}
        {modalType === 'blockTime' && (
          <form onSubmit={handleSubmit(onBlockTime)}>
            <h2 className="text-2xl font-bold mb-4">Block Dates/Times</h2>
            <input {...register('start_time')} placeholder="Start Time (HH:mm)" className="block w-full mb-4 p-2 border rounded" />
            <input {...register('end_time')} placeholder="End Time (HH:mm)" className="block w-full mb-4 p-2 border rounded" />
            <input {...register('reason')} placeholder="Reason" className="block w-full mb-4 p-2 border rounded" />
            <button type="submit" className="bg-pink-accent text-white px-6 py-3 rounded-full w-full">Block</button>
          </form>
        )}
      </main>
      <Modal isOpen={showModal} onClose={closeModal}>
        {modalType === 'editSingleDay' && (
          <div className="w-full max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Manage Day - {format(editDate ?? new Date(), 'MMM d, yyyy')}</h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}
            {showSuccess && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-xl text-sm">
                {showSuccess}
              </div>
            )}

            {/* Date Details Section - Always Shown */}
            {loadingDateDetails ? (
              <div className="mb-6 p-4 sm:p-6 bg-gradient-to-br from-baby-blue/10 to-pink-accent/10 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-pink-accent"></div>
                  <span className="ml-2 text-gray-600">Loading date information...</span>
                </div>
              </div>
            ) : showDateDetails && dateDetails ? (
              <div className="mb-6 p-4 sm:p-6 bg-gradient-to-br from-baby-blue/10 to-pink-accent/10 rounded-2xl border border-gray-200">
                <h3 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-baby-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                  </svg>
                  Date Overview
                </h3>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Daily Schedule Timeline:
                  </h4>
                  {(() => {
                    // Helper function to convert time string to minutes
                    const timeToMinutes = (timeStr: string) => {
                      const [hours, minutes] = timeStr.split(':').map(Number);
                      return hours * 60 + minutes;
                    };

                    // Helper function to convert minutes back to time string
                    const minutesToTime = (minutes: number) => {
                      const hours = Math.floor(minutes / 60);
                      const mins = minutes % 60;
                      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                    };

                    if (dateDetails.availableSlots.length === 0) {
                      return (
                        <div className="bg-white/70 rounded-xl p-4 text-center">
                          <p className="text-gray-500">No schedule set for this day</p>
                        </div>
                      );
                    }

                    // Get the full available time range (assuming one continuous range)
                    const fullAvailable = dateDetails.availableSlots[0];
                    const startMinutes = timeToMinutes(fullAvailable.start_time);
                    const endMinutes = timeToMinutes(fullAvailable.end_time);

                    // Get blocked periods sorted by start time
                    const blockedPeriods = dateDetails.blockedSlots
                      .map(slot => ({
                        ...slot,
                        startMinutes: timeToMinutes(slot.start_time),
                        endMinutes: timeToMinutes(slot.end_time)
                      }))
                      .sort((a, b) => a.startMinutes - b.startMinutes);

                    // Calculate the actual timeline
                    const timeline = [];
                    let currentTime = startMinutes;

                    for (const blocked of blockedPeriods) {
                      // Add available time before this blocked period
                      if (currentTime < blocked.startMinutes) {
                        timeline.push({
                          type: 'available',
                          start: minutesToTime(currentTime),
                          end: minutesToTime(blocked.startMinutes)
                        });
                      }

                      // Add the blocked period
                      timeline.push({
                        type: 'blocked',
                        start: blocked.start_time,
                        end: blocked.end_time,
                        reason: blocked.reason,
                        id: blocked.id
                      });

                      currentTime = Math.max(currentTime, blocked.endMinutes);
                    }

                    // Add remaining available time after all blocked periods
                    if (currentTime < endMinutes) {
                      timeline.push({
                        type: 'available',
                        start: minutesToTime(currentTime),
                        end: minutesToTime(endMinutes)
                      });
                    }

                    if (timeline.length === 0) {
                      return (
                        <div className="bg-white/70 rounded-xl p-4 text-center">
                          <p className="text-gray-500">No schedule available for this day</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid gap-3">
                        {timeline.map((slot, index) => (
                          <div key={index} className={`bg-white/70 rounded-xl p-4 flex items-center justify-between ${
                            slot.type === 'available' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                slot.type === 'available' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {slot.type === 'available' ? 'Available' : 'Blocked'}
                              </div>
                              <span className="text-gray-800 font-medium">
                                {slot.start} - {slot.end}
                              </span>
                              {slot.reason && (
                                <span className="text-gray-600 text-sm">({slot.reason})</span>
                              )}
                            </div>
                            {slot.type === 'blocked' && slot.id && (
                              <button
                                onClick={() => onUnblockTime(slot.id)}
                                className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition text-sm"
                              >
                                Unblock
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : null}
            
            {/* Toggle between Edit Hours and Block Time */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 mb-6">
              <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => {
                    setSingleDayAction('editHours');
                    reset(); // Reset form when switching tabs
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg transition font-medium ${
                    singleDayAction === 'editHours'
                      ? 'bg-baby-blue text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Edit Hours
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSingleDayAction('blockTime');
                    reset(); // Reset form when switching tabs
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg transition font-medium ${
                    singleDayAction === 'blockTime'
                      ? 'bg-baby-blue text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Block Time
                </button>
              </div>

              {singleDayAction === 'editHours' ? (
                <form onSubmit={handleSubmit(onEditOpenHours)} className="space-y-6">
                  <div className="bg-gray-50/50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-baby-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Set or update the open hours for this day
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Time <span className="text-red-500">*</span>
                        </label>
                        <input 
                          {...register('start_time', { required: true })} 
                          type="time"
                          defaultValue={editTimes?.start_time || ''} 
                          className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-baby-blue focus:border-baby-blue transition" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Time <span className="text-red-500">*</span>
                        </label>
                        <input 
                          {...register('end_time', { required: true })} 
                          type="time"
                          defaultValue={editTimes?.end_time || ''} 
                          className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-baby-blue focus:border-baby-blue transition" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      type="button" 
                      onClick={closeModal}
                      className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-medium hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 bg-baby-blue text-white px-6 py-3 rounded-xl font-medium hover:bg-baby-blue/80 transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Update Hours
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit(onBlockSingleDay)} className="space-y-6">
                  <div className="bg-gray-50/50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      Block specific times on this day
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Time <span className="text-red-500">*</span>
                        </label>
                        <input 
                          {...register('start_time', { required: true })} 
                          type="time"
                          className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Time <span className="text-red-500">*</span>
                        </label>
                        <input 
                          {...register('end_time', { required: true })} 
                          type="time"
                          className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition" 
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for blocking (optional)
                      </label>
                      <input 
                        {...register('reason')} 
                        placeholder="e.g., Personal appointment, Lunch break, etc." 
                        className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      type="button" 
                      onClick={closeModal}
                      className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-medium hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      Block Time
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
        {modalType === 'blockTime' && (
          <div className="w-full max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Block Dates/Times</h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl p-4 sm:p-6 mb-6 border border-red-200">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                </svg>
                Blocking for Selected Dates:
              </h3>
              <p className="text-gray-700 font-medium">
                {selectedDays.map(d => format(d, 'MMM d, yyyy')).join(', ') || 'Selected day'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onBlockTime)} className="space-y-6">
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200">
                <div className="bg-gray-50/50 rounded-xl p-4 space-y-4">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Block Time Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time <span className="text-red-500">*</span>
                      </label>
                      <input 
                        {...register('start_time', { required: true })} 
                        type="time"
                        className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time <span className="text-red-500">*</span>
                      </label>
                      <input 
                        {...register('end_time', { required: true })} 
                        type="time"
                        className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for blocking (optional)
                    </label>
                    <input 
                      {...register('reason')} 
                      placeholder="e.g., Personal appointment, Lunch break, etc." 
                      className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-medium hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 transition flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Block Time
                </button>
              </div>
            </form>
          </div>
        )}
        {modalType === 'openHours' && (
          <div className="w-full max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Set Open Hours (Batch)</h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-4 sm:p-6 mb-6 border border-green-200">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                </svg>
                Setting open hours for Selected Dates:
              </h3>
              <p className="text-gray-700 font-medium">
                {selectedDays.map(d => format(d, 'MMM d, yyyy')).join(', ') || 'Selected day'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}
            {showSuccess && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-xl text-sm">
                {showSuccess}
              </div>
            )}
            <form onSubmit={handleSubmit(onSetOpenHours)} className="space-y-6">
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200">
                <div className="bg-gray-50/50 rounded-xl p-4 space-y-4">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Operating Hours
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time <span className="text-red-500">*</span>
                      </label>
                      <input 
                        {...register('start_time', { required: true })} 
                        type="time"
                        className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time <span className="text-red-500">*</span>
                      </label>
                      <input 
                        {...register('end_time', { required: true })} 
                        type="time"
                        className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-medium hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-green-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-600 transition flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Set Hours
                </button>
              </div>
            </form>
          </div>
        )}
        {modalType === 'serviceForm' && (
          <form onSubmit={handleSubmit(onAddOrEditService)}>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {editingService 
                ? (editingService.is_addon ? 'Edit Add-on' : 'Edit Service')
                : (isAddingAddon ? 'Add New Add-on' : 'Add New Service')
              }
            </h2>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Name (English) *</label>
                  <input 
                    {...register('name_en', { required: 'English name is required' })} 
                    placeholder="Enter service name in English" 
                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-accent focus:border-transparent transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Name (Hebrew)</label>
                  <input 
                    {...register('name_he')} 
                    placeholder="Enter service name in Hebrew" 
                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-accent focus:border-transparent transition"
                  />
                </div>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (English)</label>
                  <textarea 
                    {...register('description_en')} 
                    placeholder="Enter service description in English" 
                    rows={3}
                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-accent focus:border-transparent transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Hebrew)</label>
                  <textarea 
                    {...register('description_he')} 
                    placeholder="Enter service description in Hebrew" 
                    rows={3}
                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-accent focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes) *</label>
                  <input 
                    {...register('duration', { required: 'Duration is required', min: 0 })} 
                    type="number" 
                    placeholder="e.g. 60" 
                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-accent focus:border-transparent transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input 
                    {...register('category')} 
                    placeholder="e.g. Facial, Hair, Nails" 
                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-accent focus:border-transparent transition"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (₪) *</label>
                <input 
                  {...register('price', { 
                    required: 'Price is required',
                    validate: (value) => {
                      // Allow range format (e.g., "10-80") for Custom add-on
                      if (typeof value === 'string' && value.includes('-')) {
                        const parts = value.split('-').map(p => p.trim());
                        if (parts.length === 2) {
                          const min = Number(parts[0]);
                          const max = Number(parts[1]);
                          if (!isNaN(min) && !isNaN(max) && min >= 0 && max >= min) {
                            return true;
                          }
                          return 'Invalid price range. Use format: 10-80';
                        }
                        return 'Invalid price range format';
                      }
                      // For regular prices, validate as number
                      const numValue = Number(value);
                      if (isNaN(numValue) || numValue < 0) {
                        return 'Please enter a valid number';
                      }
                      return true;
                    }
                  })} 
                  type={editingService?.name?.toLowerCase().includes('custom') ? 'text' : 'number'}
                  step={editingService?.name?.toLowerCase().includes('custom') ? undefined : "0.01"}
                  placeholder={editingService?.name?.toLowerCase().includes('custom') ? "e.g. 10-80" : "e.g. 120.00"} 
                  className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-accent focus:border-transparent transition"
                />
                {editingService?.name?.toLowerCase().includes('custom') && (
                  <p className="text-xs text-gray-500 mt-1">Enter a price range (e.g., 10-80) for variable pricing</p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center">
                  <input 
                    {...register('is_addon')}
                    type="checkbox" 
                    id="is_addon"
                    className="w-4 h-4 text-pink-accent bg-gray-100 border-gray-300 rounded focus:ring-pink-accent focus:ring-2"
                  />
                  <label htmlFor="is_addon" className="ml-2 text-sm font-medium text-gray-700">
                    This is an add-on service
                    <span className="block text-xs text-gray-500">Add-ons can be selected during booking in addition to main services</span>
                  </label>
                </div>

                <div className="flex items-center">
                  <input 
                    {...register('is_active')}
                    type="checkbox" 
                    id="is_active"
                    defaultChecked={editingService?.is_active !== false}
                    className="w-4 h-4 text-pink-accent bg-gray-100 border-gray-300 rounded focus:ring-pink-accent focus:ring-2"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                    Service is active
                    <span className="block text-xs text-gray-500">Inactive services won't appear in booking options</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                type="button" 
                onClick={closeModal}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 bg-pink-accent text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-accent/90 transition"
              >
                {editingService 
                  ? (editingService.is_addon ? 'Update Add-on' : 'Update Service')
                  : (isAddingAddon ? 'Add Add-on' : 'Add Service')
                }
              </button>
            </div>
          </form>
        )}
        {modalType === 'bookingForm' && (
          <div className="w-full max-w-6xl mx-auto">{/* Wider modal container */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Edit Booking</h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Current booking info header */}
            {editingBooking && (
              <div className="bg-gradient-to-br from-baby-blue/10 to-pink-accent/10 rounded-2xl p-4 sm:p-6 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                  <div className="bg-pink-accent/20 text-pink-accent px-4 py-2 rounded-xl font-bold text-lg">
                    {editingBooking.time}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800">{editingBooking.client_name}</h3>
                    <p className="text-gray-600">{new Date(editingBooking.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white/70 rounded-xl p-3">
                    <p className="text-sm text-gray-600">Service</p>
                    <p className="font-medium text-gray-800">{editingBooking.service_name || editingBooking.service_id}</p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-3">
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium text-gray-800">
                      {(() => {
                        const service = services.find(s => s.id === editingBooking.service_id);
                        return service ? `${service.duration} min` : 'N/A';
                      })()}
                    </p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-3">
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="font-bold text-pink-accent">₪{Number(editingBooking.price || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onEditBooking)} className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-6">
                {/* Service Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-pink-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.586V5L8 4z" />
                    </svg>
                    Service <span className="text-red-500">*</span>
                  </label>
                  <select 
                    {...register('service_id')} 
                    className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-baby-blue focus:border-baby-blue transition text-gray-900 bg-white"
                  >
                    <option value="">Select Service</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>{service.name} - ₪{service.price}</option>
                    ))}
                  </select>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-baby-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input 
                      {...register('date')} 
                      type="date" 
                      className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-baby-blue focus:border-baby-blue transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-baby-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Time <span className="text-red-500">*</span>
                    </label>
                    <input 
                      {...register('time')} 
                      type="time" 
                      className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-baby-blue focus:border-baby-blue transition"
                    />
                  </div>
                </div>

                {/* Client Information */}
                <div className="bg-gray-50/50 rounded-xl p-4 space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-baby-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Client Information
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      {...register('client_name')} 
                      placeholder="Enter client name" 
                      className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-baby-blue focus:border-baby-blue transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input 
                        {...register('client_email')} 
                        type="email" 
                        placeholder="Enter email address" 
                        className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-baby-blue focus:border-baby-blue transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input 
                        {...register('client_phone')} 
                        placeholder="Enter phone number" 
                        className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-baby-blue focus:border-baby-blue transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language Preference
                    </label>
                    <select 
                      {...register('language')} 
                      className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-baby-blue focus:border-baby-blue transition text-gray-900 bg-white"
                    >
                      <option value="en">English</option>
                      <option value="he">Hebrew</option>
                    </select>
                  </div>
                </div>

                {/* Add-on Management */}
                <div className="bg-gray-50/50 rounded-xl p-4 space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-pink-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add-ons
                  </h3>

                  {/* Selected Add-ons */}
                  {selectedBookingAddOns.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Selected Add-ons:</p>
                      <div className="space-y-2">
                        {selectedBookingAddOns.map((addon) => (
                          <div key={addon.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{addon.name}</p>
                              <p className="text-sm text-gray-600">
                                ₪{Number(addon.price || 0).toFixed(2)} • {formatDuration(addon.duration)}
                              </p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => removeBookingAddOn(addon.id)}
                              className="text-red-500 hover:text-red-700 transition p-1"
                              title="Remove add-on"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available Add-ons */}
                  {addOns.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Available Add-ons:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {addOns.filter(addon => !selectedBookingAddOns.find(selected => selected.id === addon.id)).map((addon) => (
                          <button 
                            key={addon.id}
                            type="button"
                            onClick={() => addBookingAddOn(addon)}
                            className="text-left bg-white p-3 rounded-lg border border-gray-200 hover:border-baby-blue hover:bg-baby-blue/5 transition"
                          >
                            <p className="font-medium text-gray-800">{addon.name}</p>
                            <p className="text-sm text-gray-600">
                              ₪{Number(addon.price || 0).toFixed(2)} • {formatDuration(addon.duration)}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total Summary */}
                  <div className="bg-white rounded-lg p-3 border-l-4 border-baby-blue">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Duration</p>
                        <p className="font-bold text-gray-800">{formatDuration(calculateTotalDuration())}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Price</p>
                        <p className="font-bold text-pink-accent">₪{calculateTotalPrice().toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Metadata (Read-only) */}
                {editingBooking && (
                  <div className="bg-gray-50/50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Booking Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Booking ID:</p>
                        <p className="font-medium text-gray-800">{editingBooking.id}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Token:</p>
                        <p className="font-medium text-gray-800 break-all">{editingBooking.token}</p>
                      </div>
                      {editingBooking.google_event_id && (
                        <div className="sm:col-span-2">
                          <p className="text-gray-600">Calendar Event ID:</p>
                          <p className="font-medium text-gray-800 break-all">{editingBooking.google_event_id}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-medium hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-baby-blue text-white px-6 py-3 rounded-xl font-medium hover:bg-baby-blue/80 transition flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Update Booking
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Add Client Modal */}
      <Modal isOpen={showAddClientModal} onClose={() => {
        setShowAddClientModal(false);
        setCreateBookingForClient(false);
        setNewClientForm({
          name: '',
          phone: '',
          email: '',
          service_id: '',
          date: '',
          time: '',
          language: 'en'
        });
      }}>
        <div className="w-full max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Client</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            // Always create a booking to create the client (clients are derived from bookings)
            api.post('/api/bookings', {
              client_name: newClientForm.name,
              client_phone: newClientForm.phone,
              client_email: newClientForm.email,
              service_id: newClientForm.service_id,
              date: newClientForm.date,
              time: newClientForm.time,
              language: newClientForm.language
            })
              .then(() => {
                setShowAddClientModal(false);
                setShowSuccess(createBookingForClient ? 'Client and booking created successfully!' : 'Client created successfully!');
                setCreateBookingForClient(false);
                setNewClientForm({
                  name: '',
                  phone: '',
                  email: '',
                  service_id: '',
                  date: '',
                  time: '',
                  language: 'en'
                });
                // Refresh clients list
                if (activeTab === 'Clients') {
                  api.get('/api/clients')
                    .then((clientsData: ClientSummary[]) => {
                      setClients(clientsData);
                    })
                    .catch((err) => {
                      if (import.meta.env.DEV) console.error('Error refreshing clients:', err);
                    });
                }
                setTimeout(() => setShowSuccess(null), 2000);
              })
              .catch((err) => {
                setError(err.message || 'Failed to create client');
              });
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                required
                value={newClientForm.name}
                onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-accent focus:border-transparent"
                placeholder="Client name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel"
                required
                value={newClientForm.phone}
                onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-accent focus:border-transparent"
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={newClientForm.email}
                onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-accent focus:border-transparent"
                placeholder="Email address (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={newClientForm.language}
                onChange={(e) => setNewClientForm({ ...newClientForm, language: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-accent focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="he">Hebrew</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="createBooking"
                checked={createBookingForClient}
                onChange={(e) => setCreateBookingForClient(e.target.checked)}
                className="w-4 h-4 text-pink-accent border-gray-300 rounded focus:ring-pink-accent"
              />
              <label htmlFor="createBooking" className="text-sm font-medium text-gray-700">
                This is a confirmed appointment (uncheck if tentative)
              </label>
            </div>
            <div className="space-y-4 bg-baby-blue/10 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">A booking is required to create a client record</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                <select
                  required
                  value={newClientForm.service_id}
                  onChange={(e) => setNewClientForm({ ...newClientForm, service_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-accent focus:border-transparent"
                >
                  <option value="">Select a service</option>
                  {mainServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {formatPrice(service.price)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={newClientForm.date}
                  onChange={(e) => setNewClientForm({ ...newClientForm, date: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-accent focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                <input
                  type="time"
                  required
                  value={newClientForm.time}
                  onChange={(e) => setNewClientForm({ ...newClientForm, time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-accent focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddClientModal(false);
                  setCreateBookingForClient(false);
                  setNewClientForm({
                    name: '',
                    phone: '',
                    email: '',
                    service_id: '',
                    date: '',
                    time: '',
                    language: 'en'
                  });
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-pink-accent text-white px-6 py-3 rounded-xl font-medium hover:bg-pink-accent/90 transition"
              >
                {createBookingForClient ? 'Create Client & Booking' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Client Details Modal */}
      <Modal isOpen={showClientDetailsModal} onClose={() => {
        setShowClientDetailsModal(false);
        setSelectedClient(null);
        setIsEditingClient(false);
      }}>
        <div className="w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
          {selectedClient && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Client Details</h2>
                <div className="flex items-center gap-2">
                  {!isEditingClient ? (
                    <button
                      onClick={() => {
                        setIsEditingClient(true);
                        setEditingClientForm({
                          name: selectedClient.name,
                          email: selectedClient.email || '',
                          phone: selectedClient.phone
                        });
                      }}
                      className="text-pink-accent hover:text-pink-accent/80 transition flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-pink-50"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  ) : null}
                  <button
                    onClick={() => {
                      setShowClientDetailsModal(false);
                      setSelectedClient(null);
                      setIsEditingClient(false);
                    }}
                    className="text-gray-500 hover:text-gray-700 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Client Info Card */}
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                {isEditingClient ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={editingClientForm.name}
                        onChange={(e) => setEditingClientForm({ ...editingClientForm, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-pink-accent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={editingClientForm.email}
                        onChange={(e) => setEditingClientForm({ ...editingClientForm, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-pink-accent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="text"
                        value={editingClientForm.phone}
                        onChange={(e) => setEditingClientForm({ ...editingClientForm, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-pink-accent focus:outline-none"
                        placeholder="Phone number"
                      />
                      <p className="text-xs text-gray-500 mt-1">Changing phone number will update all associated bookings</p>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={async () => {
                          try {
                            if (!editingClientForm.phone || editingClientForm.phone.trim().length === 0) {
                              setError('Phone number is required');
                              return;
                            }
                            
                            const oldPhone = selectedClient.phone;
                            const newPhone = editingClientForm.phone.trim();
                            
                            await api.put(`/api/clients/${encodeURIComponent(oldPhone)}`, {
                              name: editingClientForm.name,
                              email: editingClientForm.email,
                              newPhone: newPhone
                            });
                            
                            // Refresh client data using the new phone number
                            const updatedClient = await api.get(`/api/clients/${encodeURIComponent(newPhone)}`);
                            setSelectedClient(updatedClient);
                            setIsEditingClient(false);
                            
                            // Refresh clients list
                            const clientsData = await api.get('/api/clients');
                            setClients(clientsData);
                            setError('');
                          } catch (err: any) {
                            if (import.meta.env.DEV) console.error('Error updating client:', err);
                            setError(err.message || 'Failed to update client');
                          }
                        }}
                        className="flex-1 bg-pink-accent text-white px-6 py-3 rounded-lg hover:bg-pink-accent/90 transition font-medium"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingClient(false);
                          setEditingClientForm({ name: '', email: '', phone: '' });
                        }}
                        className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-pink-accent">{selectedClient.name}</h2>
                      <div className="mt-2 space-y-1 text-gray-600">
                        <p className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {selectedClient.phone}
                        </p>
                        {selectedClient.email && (
                          <p className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {selectedClient.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-baby-blue/10 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-pink-accent">{selectedClient.totalBookings}</p>
                  </div>
                  <div className="bg-baby-blue/10 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-pink-accent">{formatCurrency(selectedClient.totalSpent)}</p>
                  </div>
                  <div className="bg-baby-blue/10 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Avg Booking</p>
                    <p className="text-2xl font-bold text-pink-accent">{formatCurrency(selectedClient.averageBookingValue)}</p>
                  </div>
                  <div className="bg-baby-blue/10 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Last Visit</p>
                    <p className="text-lg font-semibold text-gray-700">
                      {selectedClient.lastVisit ? format(new Date(selectedClient.lastVisit), 'MMM d, yyyy') : 'Never'}
                    </p>
                  </div>
                </div>

                {/* Bookings History */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Booking History</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedClient.bookings.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No bookings found</p>
                    ) : (
                      selectedClient.bookings.map((booking) => {
                        const isCancelled = booking.status === 'cancelled';
                        const appointmentDateTime = new Date(`${booking.date}T${booking.time}`);
                        const cancelledAt = booking.cancelled_at ? new Date(booking.cancelled_at) : null;
                        const hoursBeforeAppointment = cancelledAt 
                          ? Math.round((appointmentDateTime.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60) * 10) / 10
                          : null;

                        return (
                          <div
                            key={booking.id}
                            className={`border rounded-xl p-4 ${isCancelled ? 'bg-gray-50 border-gray-300 opacity-75' : 'bg-white border-baby-blue/30'}`}
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold text-lg text-gray-800">{booking.service_name}</h4>
                                  {isCancelled ? (
                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
                                      Cancelled
                                    </span>
                                  ) : (
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p>
                                    <span className="font-medium">Date & Time:</span> {format(new Date(booking.date), 'MMM d, yyyy')} at {booking.time}
                                  </p>
                                  {booking.booking_reference && (
                                    <p>
                                      <span className="font-medium">Reference:</span> {booking.booking_reference}
                                    </p>
                                  )}
                                  {booking.addons && booking.addons.length > 0 && (
                                    <p>
                                      <span className="font-medium">Add-ons:</span> {booking.addons.map(a => a.name).join(', ')}
                                    </p>
                                  )}
                                  <p>
                                    <span className="font-medium">Price:</span> {formatCurrency(getNumericPrice(booking.price || 0) + (booking.addons?.reduce((sum, a) => sum + getNumericPrice(a.price), 0) || 0))}
                                  </p>
                                  {isCancelled && cancelledAt && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                      <p className="text-red-600">
                                        <span className="font-medium">Cancelled:</span> {format(cancelledAt, 'MMM d, yyyy HH:mm')}
                                      </p>
                                      {hoursBeforeAppointment !== null && (
                                        <p className="text-red-600">
                                          <span className="font-medium">Hours before appointment:</span> {hoursBeforeAppointment}h
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Booking Details Modal */}
      {showBookingDetailsModal && selectedBooking && (
        <Modal isOpen={showBookingDetailsModal} onClose={() => setShowBookingDetailsModal(false)}>
          <div className="max-w-6xl mx-auto">{/* Wider modal container */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Booking Details</h2>
              <div className="flex items-center gap-2">
                {!isEditingBookingDetails ? (
                  <button
                    onClick={() => {
                      setIsEditingBookingDetails(true);
                      const bookingDate = new Date(selectedBooking.date);
                      const formattedDate = bookingDate.toISOString().split('T')[0];
                      const timeWithoutSeconds = selectedBooking.time.split(':').slice(0, 2).join(':');
                      
                      // Initialize quantities for individual nail add-ons
                      // Count occurrences of each addon ID (for individual nails with quantity > 1)
                      const addonIdCounts: Record<string, number> = {};
                      const uniqueAddonIds: string[] = [];
                      selectedBooking.addons?.forEach((addon: any) => {
                        if (addon && addon.id) {
                          if (!addonIdCounts[addon.id]) {
                            uniqueAddonIds.push(addon.id);
                            addonIdCounts[addon.id] = 0;
                          }
                          addonIdCounts[addon.id]++;
                        }
                      });
                      
                      const initialQuantities: Record<string, number> = {};
                      uniqueAddonIds.forEach(addonId => {
                        const addon = addOns.find(a => a.id === addonId);
                        if (addon?.name?.toLowerCase().includes('individual nail')) {
                          initialQuantities[addonId] = addonIdCounts[addonId] || 1;
                        }
                      });
                      
                      setEditingBookingForm({
                        service_id: selectedBooking.service_id || '',
                        date: formattedDate,
                        time: timeWithoutSeconds,
                        price: String(selectedBooking.price || ''),
                        addon_ids: uniqueAddonIds,
                        customAddonPrices: selectedBooking.addons?.reduce((acc: any, addon: any) => {
                          if (addon.name?.toLowerCase().includes('custom')) {
                            acc[addon.id] = String(addon.price || '');
                          }
                          return acc;
                        }, {}) || {},
                        addonQuantities: initialQuantities
                      });
                    }}
                    className="text-pink-accent hover:text-pink-accent/80 transition flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-pink-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                ) : null}
                <button 
                  onClick={() => {
                    setShowBookingDetailsModal(false);
                    setIsEditingBookingDetails(false);
                  }}
                  className="text-gray-500 hover:text-gray-700 active:opacity-70 transition-opacity duration-200 p-2 rounded-lg hover:bg-gray-100 touch-manipulation"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-baby-blue/10 to-pink-accent/10 rounded-2xl p-4 sm:p-6 mb-6 border border-pink-accent/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="bg-pink-accent text-white px-5 py-3 rounded-xl font-bold text-lg sm:text-xl shadow-md min-w-[100px] text-center">
                  {selectedBooking.time}
                </div>
                <div className="flex-1">
                  {selectedBooking.client_phone ? (
                    <h3 
                      onClick={async () => {
                        try {
                          setShowBookingDetailsModal(false);
                          setSelectedClient({
                            phone: selectedBooking.client_phone,
                            name: selectedBooking.client_name,
                            email: selectedBooking.client_email,
                            totalBookings: 0,
                            totalSpent: 0,
                            averageBookingValue: 0,
                            bookings: []
                          } as Client);
                          setShowClientDetailsModal(true);
                          const clientData = await api.get(`/api/clients/${encodeURIComponent(selectedBooking.client_phone)}`);
                          setSelectedClient(clientData);
                        } catch (err: any) {
                          if (import.meta.env.DEV) console.error('Error fetching client details:', err);
                          setError(err.message || 'Failed to load client details');
                          setShowClientDetailsModal(false);
                        }
                      }}
                      className="text-xl sm:text-2xl font-bold text-pink-accent mb-1 cursor-pointer hover:text-pink-accent/80 transition hover:underline"
                    >
                      {selectedBooking.client_name}
                    </h3>
                  ) : (
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">{selectedBooking.client_name}</h3>
                  )}
                  <p className="text-gray-600 text-sm sm:text-base">{new Date(selectedBooking.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                  {selectedBooking.booking_reference && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 font-mono">Ref: {selectedBooking.booking_reference}</p>
                  )}
                </div>
              </div>
            </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                {/* Client Information */}
                <div className="bg-white/80 rounded-xl p-4 sm:p-5 border border-gray-200/50 shadow-sm">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-base sm:text-lg">
                    <svg className="w-5 h-5 text-baby-blue flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Client Information
                  </h4>
                  <div className="space-y-3 text-sm sm:text-base">
                    <div className="pb-2 border-b border-gray-100">
                      <p className="text-gray-500 font-medium text-xs sm:text-sm mb-1">Name</p>
                      {selectedBooking.client_phone ? (
                        <p 
                          onClick={async () => {
                            try {
                              setShowBookingDetailsModal(false);
                              setSelectedClient({
                                phone: selectedBooking.client_phone,
                                name: selectedBooking.client_name,
                                email: selectedBooking.client_email,
                                totalBookings: 0,
                                totalSpent: 0,
                                averageBookingValue: 0,
                                bookings: []
                              } as Client);
                              setShowClientDetailsModal(true);
                              const clientData = await api.get(`/api/clients/${encodeURIComponent(selectedBooking.client_phone)}`);
                              setSelectedClient(clientData);
                            } catch (err: any) {
                              if (import.meta.env.DEV) console.error('Error fetching client details:', err);
                              setError(err.message || 'Failed to load client details');
                              setShowClientDetailsModal(false);
                            }
                          }}
                          className="text-gray-800 font-medium cursor-pointer hover:text-pink-accent transition hover:underline"
                        >
                          {selectedBooking.client_name}
                        </p>
                      ) : (
                        <p className="text-gray-800 font-medium">{selectedBooking.client_name}</p>
                      )}
                    </div>
                    <div className="pb-2 border-b border-gray-100">
                      <p className="text-gray-500 font-medium text-xs sm:text-sm mb-1">Email</p>
                      <p className="text-gray-800 break-all">{selectedBooking.client_email}</p>
                    </div>
                    <div className="pb-2 border-b border-gray-100">
                      <p className="text-gray-500 font-medium text-xs sm:text-sm mb-1">Phone</p>
                      <p className="text-gray-800">{selectedBooking.client_phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium text-xs sm:text-sm mb-1">Language</p>
                      <p className="text-gray-800">{selectedBooking.language === 'en' ? 'English' : selectedBooking.language === 'he' ? 'Hebrew' : selectedBooking.language || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Service Information */}
                <div className="bg-white/80 rounded-xl p-4 sm:p-5 border border-gray-200/50 shadow-sm">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-base sm:text-lg">
                    <svg className="w-5 h-5 text-pink-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.586V5L8 4z" />
                    </svg>
                    Service Details
                  </h4>
                  {isEditingBookingDetails ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Service *</label>
                        <select
                          value={editingBookingForm.service_id}
                          onChange={(e) => {
                            const selectedService = mainServices.find(s => s.id === e.target.value);
                            setEditingBookingForm({
                              ...editingBookingForm,
                              service_id: e.target.value,
                              price: selectedService ? String(selectedService.price) : editingBookingForm.price
                            });
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-accent focus:border-transparent"
                        >
                          <option value="">Select a service</option>
                          {mainServices.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name} - {formatPrice(service.price)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                          <input
                            type="date"
                            value={editingBookingForm.date}
                            onChange={(e) => setEditingBookingForm({ ...editingBookingForm, date: e.target.value })}
                            min={format(new Date(), 'yyyy-MM-dd')}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-accent focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                          <input
                            type="time"
                            value={editingBookingForm.time}
                            onChange={(e) => setEditingBookingForm({ ...editingBookingForm, time: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-accent focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Base Price (₪) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingBookingForm.price}
                          onChange={(e) => setEditingBookingForm({ ...editingBookingForm, price: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-accent focus:border-transparent"
                          placeholder="e.g. 120.00"
                        />
                      </div>
                      {editingBookingForm.service_id && (() => {
                        const selectedService = mainServices.find(s => s.id === editingBookingForm.service_id);
                        return selectedService ? (
                          <div className="text-sm text-gray-600">
                            <p>Duration: {formatDuration(selectedService.duration)}</p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm sm:text-base">
                      <div className="pb-2 border-b border-gray-100">
                        <p className="text-gray-500 font-medium text-xs sm:text-sm mb-1">Service</p>
                        <p className="text-gray-800 font-medium">{selectedBooking.service_name || selectedBooking.service_id}</p>
                      </div>
                      <div className="pb-2 border-b border-gray-100">
                        <p className="text-gray-500 font-medium text-xs sm:text-sm mb-1">Duration</p>
                        <p className="text-gray-800">{selectedBooking.service_duration ? formatDuration(selectedBooking.service_duration) : 'Not specified'}</p>
                      </div>
                      <div className="pb-2 border-b border-gray-100">
                        <p className="text-gray-500 font-medium text-xs sm:text-sm mb-1">Base Price</p>
                        <p className="text-pink-accent font-bold text-lg sm:text-xl">{formatCurrency(getNumericPrice(selectedBooking.price))}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium text-xs sm:text-sm mb-1">Date & Time</p>
                        <p className="text-gray-800">{selectedBooking.time} • {new Date(selectedBooking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Add-ons Section */}
              <div className="bg-white/80 rounded-xl p-4 sm:p-6 mb-6 border border-purple-200/50 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-base sm:text-lg">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add-ons ({isEditingBookingDetails ? editingBookingForm.addon_ids.length : (selectedBooking.addons?.length || 0)})
                </h4>
                {isEditingBookingDetails ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Add-ons</label>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {addOns.map((addon) => {
                          const isSelected = editingBookingForm.addon_ids.includes(addon.id);
                          const isCustom = addon.name?.toLowerCase().includes('custom');
                          const isIndividualNail = addon.name?.toLowerCase().includes('individual nail');
                          const quantity = editingBookingForm.addonQuantities[addon.id] || (isSelected ? 1 : 0);
                          
                          return (
                            <div key={addon.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditingBookingForm({
                                      ...editingBookingForm,
                                      addon_ids: [...editingBookingForm.addon_ids, addon.id],
                                      customAddonPrices: isCustom ? {
                                        ...editingBookingForm.customAddonPrices,
                                        [addon.id]: String(addon.price || '')
                                      } : editingBookingForm.customAddonPrices,
                                      addonQuantities: isIndividualNail ? {
                                        ...editingBookingForm.addonQuantities,
                                        [addon.id]: 1
                                      } : editingBookingForm.addonQuantities
                                    });
                                  } else {
                                    setEditingBookingForm({
                                      ...editingBookingForm,
                                      addon_ids: editingBookingForm.addon_ids.filter(id => id !== addon.id),
                                      customAddonPrices: isCustom ? (() => {
                                        const newPrices = { ...editingBookingForm.customAddonPrices };
                                        delete newPrices[addon.id];
                                        return newPrices;
                                      })() : editingBookingForm.customAddonPrices,
                                      addonQuantities: isIndividualNail ? (() => {
                                        const newQuantities = { ...editingBookingForm.addonQuantities };
                                        delete newQuantities[addon.id];
                                        return newQuantities;
                                      })() : editingBookingForm.addonQuantities
                                    });
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              />
                              <div className="flex-1">
                                <label className="font-medium text-gray-800 cursor-pointer">{addon.name}</label>
                                {addon.duration > 0 && (
                                  <p className="text-xs text-gray-600">{formatDuration(addon.duration)}</p>
                                )}
                              </div>
                              {isSelected && isIndividualNail ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">Quantity:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={quantity}
                                    onChange={(e) => {
                                      const qty = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                                      setEditingBookingForm({
                                        ...editingBookingForm,
                                        addonQuantities: {
                                          ...editingBookingForm.addonQuantities,
                                          [addon.id]: qty
                                        }
                                      });
                                    }}
                                    className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                    placeholder="Qty"
                                  />
                                  <span className="text-sm text-gray-600">× {formatPrice(addon.price)} = {formatPrice(getNumericPrice(addon.price) * quantity)}</span>
                                </div>
                              ) : isSelected && isCustom ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">Price:</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editingBookingForm.customAddonPrices[addon.id] || ''}
                                    onChange={(e) => setEditingBookingForm({
                                      ...editingBookingForm,
                                      customAddonPrices: {
                                        ...editingBookingForm.customAddonPrices,
                                        [addon.id]: e.target.value
                                      }
                                    })}
                                    className="w-24 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                    placeholder="Price"
                                  />
                                  <span className="text-sm text-gray-600">₪</span>
                                </div>
                              ) : (
                                <div className="text-right">
                                  <p className="font-semibold text-purple-600">{formatPrice(addon.price)}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {editingBookingForm.addon_ids.length > 0 && (
                      <div className="border-t-2 border-gray-300 pt-4">
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-gray-800 text-base">Total Add-ons:</p>
                          <p className="font-bold text-purple-600 text-lg">
                            {formatCurrency(editingBookingForm.addon_ids.reduce((sum, addonId) => {
                              const addon = addOns.find(a => a.id === addonId);
                              if (!addon) return sum;
                              const isIndividualNail = addon.name?.toLowerCase().includes('individual nail');
                              const quantity = editingBookingForm.addonQuantities[addonId] || 1;
                              
                              if (addon.name?.toLowerCase().includes('custom')) {
                                return sum + getNumericPrice(editingBookingForm.customAddonPrices[addonId] || '0');
                              }
                              if (isIndividualNail) {
                                return sum + (getNumericPrice(addon.price) * quantity);
                              }
                              return sum + getNumericPrice(addon.price);
                            }, 0))}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : selectedBooking.addons && selectedBooking.addons.length > 0 ? (
                  <div className="space-y-3">
                    {selectedBooking.addons.map((addon: any, index: number) => {
                      const addonPrice = addon.price !== undefined && addon.price !== null ? addon.price : 0;
                      return (
                        <div key={index} className="flex justify-between items-start sm:items-center bg-white/80 rounded-lg p-3 sm:p-4 border border-gray-200/50 hover:border-purple-300 transition-colors">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 text-base">{addon.name}</p>
                            {addon.duration && addon.duration > 0 && (
                              <p className="text-sm text-gray-600 mt-1">{addon.duration} minutes</p>
                            )}
                            {addon.name?.toLowerCase().includes('custom') && selectedBooking.custom_request && (
                              <p className="text-xs text-gray-500 mt-1 italic">Custom request included</p>
                            )}
                          </div>
                          <div className="ml-4 text-right">
                            <p className="font-bold text-purple-600 text-lg">{formatPrice(addonPrice)}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div className="border-t-2 border-gray-300 pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-gray-800 text-base">Total Add-ons:</p>
                        <p className="font-bold text-purple-600 text-lg">
                          {formatCurrency(selectedBooking.addons.reduce((sum: number, addon: any) => sum + getNumericPrice(addon.price), 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No add-ons selected</p>
                )}
              </div>

              {/* Custom Request Section */}
              {(selectedBooking.custom_request || selectedBooking.custom_image) && (
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-4 sm:p-6 mb-6 shadow-sm">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-base sm:text-lg">
                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Custom Request (Admin Only)
                  </h4>
                  <div className="space-y-4">
                    {selectedBooking.custom_request && (
                      <div className="bg-white rounded-lg p-4 border border-yellow-200 shadow-sm">
                        <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Request Details:</p>
                        <p className="text-gray-800 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                          {selectedBooking.custom_request}
                        </p>
                      </div>
                    )}
                    {selectedBooking.custom_image && (
                      <div className="bg-white rounded-lg p-4 border border-yellow-200 shadow-sm">
                        <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Attached Image:</p>
                        <div className="flex justify-center">
                          <img 
                            src={selectedBooking.custom_image} 
                            alt="Custom request reference" 
                            className="max-w-full max-h-96 rounded-lg border-2 border-yellow-200 bg-white p-2 shadow-md object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing Summary */}
              <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-4 sm:p-6 mb-6 border border-green-200/50 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-base sm:text-lg">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Pricing Summary
                </h4>
                <div className="space-y-3 text-sm sm:text-base">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Price:</span>
                    <span className="text-gray-800 font-medium">
                      {isEditingBookingDetails 
                        ? formatCurrency(getNumericPrice(editingBookingForm.price || '0'))
                        : formatCurrency(getNumericPrice(selectedBooking.price))
                      }
                    </span>
                  </div>
                  {(isEditingBookingDetails ? editingBookingForm.addon_ids.length > 0 : (selectedBooking.addons && selectedBooking.addons.length > 0)) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Add-ons:</span>
                      <span className="text-gray-800 font-medium">
                        {isEditingBookingDetails
                          ? formatCurrency(editingBookingForm.addon_ids.reduce((sum, addonId) => {
                              const addon = addOns.find(a => a.id === addonId);
                              if (!addon) return sum;
                              if (addon.name?.toLowerCase().includes('custom')) {
                                return sum + getNumericPrice(editingBookingForm.customAddonPrices[addonId] || '0');
                              }
                              return sum + getNumericPrice(addon.price);
                            }, 0))
                          : formatCurrency(selectedBooking.addons.reduce((sum: number, addon: any) => sum + getNumericPrice(addon.price), 0))
                        }
                      </span>
                    </div>
                  )}
                  <div className="border-t-2 border-gray-300 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800 text-base">Total Amount:</span>
                      <span className="font-bold text-pink-accent text-xl">
                        {isEditingBookingDetails
                          ? formatCurrency(
                              getNumericPrice(editingBookingForm.price || '0') +
                              editingBookingForm.addon_ids.reduce((sum, addonId) => {
                                const addon = addOns.find(a => a.id === addonId);
                                if (!addon) return sum;
                                const isIndividualNail = addon.name?.toLowerCase().includes('individual nail');
                                const quantity = editingBookingForm.addonQuantities[addonId] || 1;
                                
                                if (addon.name?.toLowerCase().includes('custom')) {
                                  return sum + getNumericPrice(editingBookingForm.customAddonPrices[addonId] || '0');
                                }
                                if (isIndividualNail) {
                                  return sum + (getNumericPrice(addon.price) * quantity);
                                }
                                return sum + getNumericPrice(addon.price);
                              }, 0)
                            )
                          : formatCurrency(
                              getNumericPrice(selectedBooking.price) + 
                              (selectedBooking.addons?.reduce((sum: number, addon: any) => sum + getNumericPrice(addon.price), 0) || 0)
                            )
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Metadata */}
              <div className="bg-white/80 rounded-xl p-4 sm:p-5 border border-gray-200/50 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-base sm:text-lg">
                  <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Booking Information
                </h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm sm:text-base">
                  <div className="pb-3 border-b border-gray-100 md:border-b-0 md:border-r md:pr-4">
                    <p className="text-gray-500 font-medium text-xs sm:text-sm mb-1">Booking Reference</p>
                    <p className="text-gray-800 font-mono font-semibold text-base break-all">
                      {selectedBooking.booking_reference || `ID: ${selectedBooking.id}`}
                    </p>
                  </div>
                  <div className="pb-3 border-b border-gray-100 md:border-b-0 md:pl-4">
                    <p className="text-gray-500 font-medium text-xs sm:text-sm mb-1">Status</p>
                    <p className="text-gray-800">
                      {new Date(selectedBooking.date) < new Date() ? 
                        <span className="inline-block text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium">Completed</span> : 
                        <span className="inline-block text-green-700 bg-green-100 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium">Upcoming</span>
                      }
                    </p>
                  </div>
                  <div className="pb-3 border-b border-gray-100 md:border-b-0 md:border-r md:pr-4">
                    <p className="text-gray-500 font-medium text-xs sm:text-sm mb-1">Token</p>
                    <p className="text-gray-800 font-mono break-all text-xs sm:text-sm">{selectedBooking.token}</p>
                  </div>
                  <div className="pb-3 border-b border-gray-100 md:border-b-0 md:pl-4">
                    <p className="text-gray-500 font-medium text-xs sm:text-sm mb-1">Booking Created</p>
                    <p className="text-gray-800">{new Date(selectedBooking.created_at || selectedBooking.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}</p>
                  </div>
                  {selectedBooking.google_event_id && (
                    <div className="md:col-span-2 pt-3 border-t border-gray-200">
                      <p className="text-gray-500 font-medium text-xs sm:text-sm mb-1">Calendar Event ID</p>
                      <p className="text-gray-800 font-mono break-all text-xs sm:text-sm">{selectedBooking.google_event_id}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {isEditingBookingDetails ? (
                <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button 
                    onClick={async () => {
                      try {
                        if (!editingBookingForm.service_id || !editingBookingForm.date || !editingBookingForm.time || !editingBookingForm.price) {
                          setError('Please fill in all required fields');
                          return;
                        }

                        // Calculate total price including add-ons with quantities
                        const basePrice = getNumericPrice(editingBookingForm.price || '0');
                        const addonsTotal = editingBookingForm.addon_ids.reduce((sum, addonId) => {
                          const addon = addOns.find(a => a.id === addonId);
                          if (!addon) return sum;
                          const isIndividualNail = addon.name?.toLowerCase().includes('individual nail');
                          const quantity = editingBookingForm.addonQuantities[addonId] || 1;
                          
                          if (addon.name?.toLowerCase().includes('custom')) {
                            return sum + getNumericPrice(editingBookingForm.customAddonPrices[addonId] || '0');
                          }
                          if (isIndividualNail) {
                            return sum + (getNumericPrice(addon.price) * quantity);
                          }
                          return sum + getNumericPrice(addon.price);
                        }, 0);
                        
                        // For individual nails, we need to insert the addon multiple times (once per nail)
                        // So we'll expand the addon_ids array to include duplicates
                        const expandedAddonIds: string[] = [];
                        editingBookingForm.addon_ids.forEach(addonId => {
                          const addon = addOns.find(a => a.id === addonId);
                          const isIndividualNail = addon?.name?.toLowerCase().includes('individual nail');
                          const quantity = editingBookingForm.addonQuantities[addonId] || 1;
                          
                          if (isIndividualNail && quantity > 1) {
                            // Insert the addon multiple times (once per nail)
                            for (let i = 0; i < quantity; i++) {
                              expandedAddonIds.push(addonId);
                            }
                          } else {
                            expandedAddonIds.push(addonId);
                          }
                        });
                        
                        // Prepare update data
                        const updateData: any = {
                          service_id: editingBookingForm.service_id,
                          date: editingBookingForm.date,
                          time: editingBookingForm.time,
                          price: basePrice + addonsTotal,
                          addon_ids: expandedAddonIds
                        };

                        // Update booking
                        const updatedBooking = await api.put(`/api/bookings/${selectedBooking.id}`, updateData);
                        
                        // Update selectedBooking with the response
                        setSelectedBooking(updatedBooking);
                        setIsEditingBookingDetails(false);
                        
                        // Refresh bookings list
                        const bookingsData = await api.get('/api/bookings');
                        setBookings(bookingsData);
                        
                        setError('');
                        setShowSuccess('Booking updated successfully!');
                        setTimeout(() => setShowSuccess(null), 2000);
                      } catch (err: any) {
                        if (import.meta.env.DEV) console.error('Error updating booking:', err);
                        setError(err.message || 'Failed to update booking');
                      }
                    }}
                    className="flex-1 bg-pink-accent text-white px-6 py-3 rounded-xl font-medium hover:bg-pink-accent/90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingBookingDetails(false);
                      setEditingBookingForm({
                        service_id: '',
                        date: '',
                        time: '',
                        price: '',
                        addon_ids: [],
                        customAddonPrices: {},
                        addonQuantities: {}
                      });
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-medium hover:bg-gray-300 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation shadow-md"
                  >
                    Cancel
                  </button>
                </div>
              ) : !showPastBookings && (
                <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button 
                    onClick={() => {
                      setShowBookingDetailsModal(false);
                      openEditBookingModal(selectedBooking);
                    }}
                    className="flex-1 bg-baby-blue text-white px-6 py-3 rounded-xl font-medium hover:bg-baby-blue/80 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Booking
                  </button>
                  <button 
                    onClick={() => {
                      setShowBookingDetailsModal(false);
                      onCancelBooking(selectedBooking.token);
                    }}
                    className="flex-1 bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Cancel Booking
                  </button>
                </div>
              )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default AdminDashboard;