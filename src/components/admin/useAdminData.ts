import { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import type { Booking, Service, Analytics, ClientSummary } from './types';

interface UseAdminDataProps {
  isLoggedIn: boolean;
  token: string | null;
  activeTab: string;
  analyticsTimeRange: 'week' | 'month' | 'quarter' | 'year';
}

export const useAdminData = ({ isLoggedIn, token, activeTab, analyticsTimeRange }: UseAdminDataProps) => {
  const api = useApi(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [mainServices, setMainServices] = useState<Service[]>([]);
  const [addOns, setAddOns] = useState<Service[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({ 
    mostBooked: '', 
    revenueEstimate: 0, 
    vipClients: [],
    totalRevenue: 0,
    revenueGrowth: 0,
    totalBookings: 0,
    bookingGrowth: 0,
    totalClients: 0,
    newClientsGrowth: 0,
    avgBookingValue: 0,
    revenueChart: [],
    serviceStats: [],
    peakHours: [],
    repeatCustomerRate: 0,
    newClientsThisPeriod: 0,
    avgVisitsPerClient: 0,
    clientRetentionRate: 0,
    avgBookingsPerDay: 0,
    busiestDay: '',
    cancellationRate: 0,
    noShowRate: 0,
    addonStats: [],
    monthlyGoalProgress: 0,
    currentMonthRevenue: 0,
    monthlyGoal: 0,
    bookingGoalProgress: 0,
    currentMonthBookings: 0,
    monthlyBookingGoal: 0,
    satisfactionScore: 0,
    totalReviews: 0
  });
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingClients, setLoadingClients] = useState<boolean>(false);

  const toNum = (v: any, fallback = 0) => {
    const n = typeof v === 'number' ? v : parseFloat(v);
    return isNaN(n) ? fallback : n;
  };

  const sanitizeStats = (arr: any[], fields: string[]) =>
    Array.isArray(arr)
      ? arr.map(obj => {
          const newObj: any = { ...obj };
          fields.forEach(f => { newObj[f] = toNum(obj[f]); });
          return newObj;
        })
      : [];

  // Initial data fetch
  useEffect(() => {
    if (isLoggedIn && token) {
      setLoading(true);
      setError(null);
      Promise.all([
        api.get('/api/bookings').then(data => data).catch(err => { if (import.meta.env.DEV) console.error('Bookings error:', err); setError(err.message); }),
        api.get('/api/services').then(data => data).catch(err => { if (import.meta.env.DEV) console.error('Services error:', err); setError(err.message); }),
        api.get(`/api/analytics?range=${analyticsTimeRange}`).then(data => data).catch(err => {
          if (import.meta.env.DEV) console.error('Analytics fetch failed:', err);
          return { mostBooked: '', revenueEstimate: 0, vipClients: [] };
        }),
        api.get('/api/availability/dates').then(data => data).catch(err => { if (import.meta.env.DEV) console.error('Availability error:', err); setError(err.message); }),
      ])
        .then(([bookingsData, servicesData, analyticsData, availabilityData]) => {
          setBookings(bookingsData || []);
          setServices(servicesData || []);
          
          const allServices = servicesData || [];
          setMainServices(allServices.filter((s: Service) => !s.is_addon));
          setAddOns(allServices.filter((s: Service) => s.is_addon));
          
          const totalRevenue = (bookingsData || []).reduce((sum: number, b: any) => sum + (Number(b.price) || 0), 0);

          const mergedAnalytics = {
            mostBooked: analyticsData?.mostBooked || '',
            vipClients: Array.isArray(analyticsData?.vipClients) ? analyticsData.vipClients : [],
            revenueGrowth: toNum(analyticsData?.revenueGrowth),
            totalBookings: toNum(analyticsData?.totalBookings),
            bookingGrowth: toNum(analyticsData?.bookingGrowth),
            totalClients: toNum(analyticsData?.totalClients),
            newClientsGrowth: toNum(analyticsData?.newClientsGrowth),
            avgBookingValue: toNum(analyticsData?.avgBookingValue),
            revenueChart: Array.isArray(analyticsData?.revenueChart)
              ? analyticsData.revenueChart.map((item: any) => ({
                  label: item.label,
                  value: toNum(item.value)
                }))
              : [],
            serviceStats: sanitizeStats(analyticsData?.serviceStats, ['bookings', 'revenue', 'percentage']),
            peakHours: sanitizeStats(analyticsData?.peakHours, ['bookings', 'percentage']),
            repeatCustomerRate: toNum(analyticsData?.repeatCustomerRate),
            newClientsThisPeriod: toNum(analyticsData?.newClientsThisPeriod),
            avgVisitsPerClient: toNum(analyticsData?.avgVisitsPerClient),
            clientRetentionRate: toNum(analyticsData?.clientRetentionRate),
            avgBookingsPerDay: toNum(analyticsData?.avgBookingsPerDay),
            busiestDay: analyticsData?.busiestDay || '',
            cancellationRate: toNum(analyticsData?.cancellationRate),
            noShowRate: toNum(analyticsData?.noShowRate),
            addonStats: sanitizeStats(analyticsData?.addonStats, ['bookings', 'revenue', 'popularityRate', 'avgPerBooking']),
            monthlyGoalProgress: toNum(analyticsData?.monthlyGoalProgress),
            currentMonthRevenue: toNum(analyticsData?.currentMonthRevenue),
            monthlyGoal: toNum(analyticsData?.monthlyGoal),
            bookingGoalProgress: toNum(analyticsData?.bookingGoalProgress),
            currentMonthBookings: toNum(analyticsData?.currentMonthBookings),
            monthlyBookingGoal: toNum(analyticsData?.monthlyBookingGoal),
            satisfactionScore: toNum(analyticsData?.satisfactionScore),
            totalReviews: toNum(analyticsData?.totalReviews),
            revenueEstimate: toNum(analyticsData?.revenueEstimate, totalRevenue),
            totalRevenue: toNum(analyticsData?.totalRevenue, totalRevenue)
          };

          setAnalytics(mergedAnalytics);
          const today = new Date();
          today.setHours(0,0,0,0);
          const available = (availabilityData?.availableDates || []).filter((dateStr: string) => {
            const dateObj = new Date(dateStr);
            dateObj.setHours(0,0,0,0);
            return dateObj >= today;
          });
          setAvailableDays(available);
        })
        .catch(err => {
          if (import.meta.env.DEV) console.error('AdminDashboard: Promise.all error', err);
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, token]);

  // Fetch clients when Clients tab is active
  useEffect(() => {
    if (isLoggedIn && token && activeTab === 'Clients') {
      setLoadingClients(true);
      api.get('/api/clients')
        .then((clientsData: ClientSummary[]) => {
          setClients(clientsData);
          setLoadingClients(false);
        })
        .catch((err) => {
          if (import.meta.env.DEV) console.error('Error fetching clients:', err);
          setError(err.message);
          setLoadingClients(false);
        });
    }
  }, [isLoggedIn, token, activeTab, api]);

  // Fetch analytics when time range changes
  useEffect(() => {
    if (isLoggedIn && token && activeTab === 'Analytics') {
      api.get(`/api/analytics?range=${analyticsTimeRange}`)
        .then((analyticsData: any) => {
          const mergedAnalytics = {
            ...analytics,
            mostBooked: analyticsData?.mostBooked || '',
            vipClients: Array.isArray(analyticsData?.vipClients) ? analyticsData.vipClients : [],
            revenueGrowth: toNum(analyticsData?.revenueGrowth),
            totalBookings: toNum(analyticsData?.totalBookings),
            bookingGrowth: toNum(analyticsData?.bookingGrowth),
            totalClients: toNum(analyticsData?.totalClients),
            newClientsGrowth: toNum(analyticsData?.newClientsGrowth),
            avgBookingValue: toNum(analyticsData?.avgBookingValue),
            revenueChart: Array.isArray(analyticsData?.revenueChart)
              ? analyticsData.revenueChart.map((item: any) => ({
                  label: item.label,
                  value: toNum(item.value)
                }))
              : [],
            serviceStats: sanitizeStats(analyticsData?.serviceStats, ['bookings', 'revenue', 'percentage']),
            peakHours: sanitizeStats(analyticsData?.peakHours, ['bookings', 'percentage']),
            repeatCustomerRate: toNum(analyticsData?.repeatCustomerRate),
            newClientsThisPeriod: toNum(analyticsData?.newClientsThisPeriod),
            avgVisitsPerClient: toNum(analyticsData?.avgVisitsPerClient),
            clientRetentionRate: toNum(analyticsData?.clientRetentionRate),
            avgBookingsPerDay: toNum(analyticsData?.avgBookingsPerDay),
            busiestDay: analyticsData?.busiestDay || '',
            cancellationRate: toNum(analyticsData?.cancellationRate),
            noShowRate: toNum(analyticsData?.noShowRate),
            addonStats: sanitizeStats(analyticsData?.addonStats, ['bookings', 'revenue', 'popularityRate', 'avgPerBooking']),
            monthlyGoalProgress: toNum(analyticsData?.monthlyGoalProgress),
            currentMonthRevenue: toNum(analyticsData?.currentMonthRevenue),
            monthlyGoal: toNum(analyticsData?.monthlyGoal),
            bookingGoalProgress: toNum(analyticsData?.bookingGoalProgress),
            currentMonthBookings: toNum(analyticsData?.currentMonthBookings),
            monthlyBookingGoal: toNum(analyticsData?.monthlyBookingGoal),
            satisfactionScore: toNum(analyticsData?.satisfactionScore),
            totalReviews: toNum(analyticsData?.totalReviews),
            revenueEstimate: toNum(analyticsData?.revenueEstimate),
            totalRevenue: toNum(analyticsData?.totalRevenue)
          };
          setAnalytics(mergedAnalytics);
        })
        .catch((err: any) => {
          if (import.meta.env.DEV) console.error('Analytics fetch failed:', err);
        });
    }
  }, [analyticsTimeRange, activeTab, isLoggedIn, token, api]);

  return {
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
  };
};

