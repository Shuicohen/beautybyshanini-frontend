import type { Booking, Service, Analytics, ClientSummary, Client } from '../types';

export interface AdminTabProps {
  // Data
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  mainServices: Service[];
  setMainServices: React.Dispatch<React.SetStateAction<Service[]>>;
  addOns: Service[];
  setAddOns: React.Dispatch<React.SetStateAction<Service[]>>;
  analytics: Analytics;
  setAnalytics: React.Dispatch<React.SetStateAction<Analytics>>;
  availableDays: string[];
  setAvailableDays: React.Dispatch<React.SetStateAction<string[]>>;
  clients: ClientSummary[];
  setClients: React.Dispatch<React.SetStateAction<ClientSummary[]>>;
  
  // UI State
  loading: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  showSuccess: string | null;
  setShowSuccess: React.Dispatch<React.SetStateAction<string | null>>;
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Navigation
  onTabChange: (tab: string) => void;
  
  // API
  api: any; // useApi hook return type
  
  // Form handlers (from react-hook-form)
  register: any;
  handleSubmit: any;
  reset: any;
  
  // Additional state (will be expanded as needed)
  [key: string]: any;
}

