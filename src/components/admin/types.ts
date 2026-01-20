export interface Booking {
  id: string;
  booking_reference?: string; // Human-readable booking reference (BBS{month/year}{number})
  service_id: string;
  date: string;
  time: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  service_name?: string;
  token: string;
  price?: number;
  google_event_id?: string;
  language?: string;
  created_at?: string;
  service_duration?: number;
  addons?: Array<{
    name: string;
    price: number;
    duration?: number;
  }>;
  custom_request?: string;
  custom_image?: string;
  status?: 'active' | 'cancelled';
  cancelled_at?: string;
}

export interface ClientSummary {
  phone: string;
  name: string;
  email: string;
  totalBookings: number;
  totalSpent: number;
  lastVisit?: string;
  firstVisit?: string;
  averageBookingValue: number;
  activeBookings: number;
  cancelledBookings: number;
}

export interface Client {
  phone: string;
  name: string;
  email: string;
  totalBookings: number;
  totalSpent: number;
  lastVisit?: string;
  firstVisit?: string;
  averageBookingValue: number;
  bookings: Booking[];
}

export interface Service {
  id: string;
  name: string;
  name_en?: string;
  name_he?: string;
  description_en?: string;
  description_he?: string;
  duration: number;
  price: number | string; // Can be a number or a range string like "10-80"
  is_addon: boolean;
  category?: string;
  is_active?: boolean;
}

export interface Analytics {
  mostBooked: string;
  revenueEstimate: number;
  vipClients: Array<{
    name: string;
    visits: number;
    totalSpent: number;
    lastVisit: string;
  }>;
  
  // Enhanced analytics data
  totalRevenue: number;
  revenueGrowth: number;
  totalBookings: number;
  bookingGrowth: number;
  totalClients: number;
  newClientsGrowth: number;
  avgBookingValue: number;
  
  revenueChart: Array<{ label: string; value: number }>;
  serviceStats: Array<{ name: string; bookings: number; revenue: number; percentage: number }>;
  peakHours: Array<{ time: string; bookings: number; percentage: number }>;
  
  repeatCustomerRate: number;
  newClientsThisPeriod: number;
  avgVisitsPerClient: number;
  clientRetentionRate: number;
  
  avgBookingsPerDay: number;
  busiestDay: string;
  cancellationRate: number;
  noShowRate: number;
  
  addonStats: Array<{ name: string; bookings: number; revenue: number; popularityRate: number; avgPerBooking: number }>;
  
  monthlyGoalProgress: number;
  currentMonthRevenue: number;
  monthlyGoal: number;
  bookingGoalProgress: number;
  currentMonthBookings: number;
  monthlyBookingGoal: number;
  satisfactionScore: number;
  totalReviews: number;
}

export type ServiceFormData = { 
  name: string; 
  name_en?: string;
  name_he?: string;
  description_en?: string;
  description_he?: string;
  duration: number; 
  price: number | string; 
  is_addon: boolean;
  category?: string;
  is_active?: boolean;
};

export type BlockTimeFormData = { start_time: string; end_time: string; reason: string };

export type OpenHoursFormData = { start_time: string; end_time: string };

export type BookingFormData = { service_id: string; date: string; time: string; client_name: string; client_email: string; client_phone: string; language: string };

