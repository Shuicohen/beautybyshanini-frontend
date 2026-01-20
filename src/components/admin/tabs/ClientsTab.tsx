import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import type { ClientSummary, Client } from '../types';
import { formatCurrency } from '../utils';

interface ClientsTabProps {
  clients: ClientSummary[];
  loadingClients: boolean;
  onAddClient: () => void;
  api: any;
  setSelectedClient: (client: Client) => void;
  setShowClientDetailsModal: (show: boolean) => void;
  setError: (error: string) => void;
}

export const ClientsTab = ({
  clients,
  loadingClients,
  onAddClient,
  api,
  setSelectedClient,
  setShowClientDetailsModal,
  setError
}: ClientsTabProps) => {
  const [clientSearchTerm, setClientSearchTerm] = useState<string>('');

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      !clientSearchTerm ||
      c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      c.phone.includes(clientSearchTerm) ||
      c.email.toLowerCase().includes(clientSearchTerm.toLowerCase())
    );
  }, [clients, clientSearchTerm]);

  const handleClientClick = (client: ClientSummary) => {
    setSelectedClient({
      ...client,
      bookings: []
    } as Client);
    setShowClientDetailsModal(true);
    api.get(`/api/clients/${encodeURIComponent(client.phone)}`)
      .then((clientData: Client) => {
        setSelectedClient(clientData);
      })
      .catch((err: any) => {
        if (import.meta.env.DEV) console.error('Error fetching client details:', err);
        setError(err.message);
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex flex-col items-start">
          <h1 className="text-3xl font-bold text-pink-accent">Clients</h1>
          <p className="text-gray-600 mt-1">
            {clientSearchTerm 
              ? `${filteredClients.length} of ${clients.length} clients`
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
            onClick={onAddClient}
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
          {filteredClients.length === 0 ? (
            <div className="bg-baby-blue/10 p-8 rounded-2xl text-center text-lg text-gray-500 font-semibold">
              {clientSearchTerm ? 'No clients match your search' : 'No clients found'}
            </div>
          ) : (
            filteredClients.map((client) => (
              <div
                key={client.phone}
                className="bg-white rounded-xl p-6 shadow-soft hover:shadow-md transition border border-baby-blue/20"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 
                      onClick={() => handleClientClick(client)}
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
  );
};
