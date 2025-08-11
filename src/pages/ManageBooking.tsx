import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface Booking {
  id: string;
  token: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  service_name: string;
  service_id: string;
  date: string;
  time: string;
  language: string;
  addons?: Array<{id: string; name: string; price: number}>; // Add-on details
}

const ManageBooking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, setLanguage, language, isRTL } = useLanguage();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string>('');

  const token = searchParams.get('token');
  const urlLanguage = searchParams.get('lang');

  useEffect(() => {
    // Set language from URL parameter if provided
    if (urlLanguage && (urlLanguage === 'en' || urlLanguage === 'he')) {
      setLanguage(urlLanguage);
    }

    if (!token) {
      setError(t('invalidBookingLink'));
      setLoading(false);
      return;
    }

    fetchBooking();
  }, [token, urlLanguage]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/bookings/details/${token}`);
      if (response.ok) {
        const bookingData = await response.json();
        setBooking(bookingData);
        
        // If no URL language was specified, use the booking's language
        if (!urlLanguage && bookingData.language) {
          setLanguage(bookingData.language);
        }
      } else {
        setError(t('bookingNotFoundOrExpired'));
      }
    } catch (err) {
      setError(t('failedToLoadBookingDetails'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!booking || !token) return;
    
    setActionLoading('cancel');
    try {
      const response = await fetch(`http://localhost:3000/api/bookings/manage?token=${token}&action=cancel`, {
        method: 'GET',
      });
      
      if (response.ok) {
        alert(t('appointmentCancelledSuccess'));
        navigate('/');
      } else {
        alert(t('cancelFailed'));
      }
    } catch (err) {
      alert(t('cancelFailed'));
    } finally {
      setActionLoading('');
    }
  };

  const handleReschedule = () => {
    if (!booking) return;
    
    // Navigate to booking page with prefilled data and language
    navigate(`/booking?reschedule=true&token=${token}&name=${encodeURIComponent(booking.client_name)}&email=${encodeURIComponent(booking.client_email)}&phone=${encodeURIComponent(booking.client_phone)}&service=${booking.service_id}&lang=${language}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loadingBookingDetails')}</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('bookingNotFound')}</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors"
            >
              {t('goToHomepage')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const bookingDate = new Date(booking.date);
  const formattedDate = bookingDate.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={`min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-12 px-4 ${isRTL ? 'font-hebrew' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white text-center">
              ✨ {t('manageYourAppointment')}
            </h1>
            <p className="text-pink-100 text-center mt-2">
              Beauty by Shanini
            </p>
          </div>

          {/* Booking Details */}
          <div className="p-8">
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className={`${isRTL ? 'ml-2' : 'mr-2'}`}>📅</span>
                {t('appointmentDetails')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{t('service')}</p>
                  <p className="text-lg text-gray-800">{booking.service_name}</p>
                </div>
                {booking.addons && booking.addons.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 font-medium">{t('addOns')}</p>
                    <p className="text-lg text-gray-800">{booking.addons.map(addon => addon.name).join(', ')}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 font-medium">{t('date')}</p>
                  <p className="text-lg text-gray-800">{formattedDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">{t('time')}</p>
                  <p className="text-lg text-gray-800">{booking.time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">{t('bookingId')}</p>
                  <p className="text-lg text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded">{booking.id}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 font-medium">{t('clientInformationLabel')}</p>
                <p className="text-gray-800">{booking.client_name}</p>
                <p className="text-gray-600">{booking.client_email}</p>
                <p className="text-gray-600">{booking.client_phone}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t('whatWouldYouLikeToDo')}
              </h3>

              {/* Reschedule Button */}
              <button
                onClick={handleReschedule}
                disabled={actionLoading === 'reschedule'}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <span className={`${isRTL ? 'ml-2' : 'mr-2'}`}>🔄</span>
                {actionLoading === 'reschedule' ? t('processing') : t('rescheduleAppointment')}
              </button>

              {/* Cancel Button */}
              <button
                onClick={handleCancel}
                disabled={actionLoading === 'cancel'}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <span className={`${isRTL ? 'ml-2' : 'mr-2'}`}>❌</span>
                {actionLoading === 'cancel' ? t('cancelling') : t('cancelAppointment')}
              </button>

              {/* Back to Home */}
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <span className={`${isRTL ? 'ml-2' : 'mr-2'}`}>🏠</span>
                {t('backToHomepage')}
              </button>
            </div>

            {/* Contact Info */}
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm text-yellow-800 text-center">
                <span className="font-medium">💌 {t('needHelp')}</span>
                <br />
                {t('contactUsDirectly')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageBooking;
