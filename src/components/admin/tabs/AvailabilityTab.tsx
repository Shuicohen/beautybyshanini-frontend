import { motion } from 'framer-motion';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, addMonths } from 'date-fns';

interface AvailabilityTabProps {
  availableDays: string[];
  selectedDays: Date[];
  calendarDate: Date;
  showSuccess: string | null;
  onCalendarDateChange: (date: Date) => void;
  onDayClick: (date: Date) => void;
  onBlockTime: () => void;
  onSetOpenHours: () => void;
  onSyncGoogleCalendar: () => Promise<void>;
  api: any;
  setAvailableDays: (days: string[]) => void;
}

export const AvailabilityTab = ({
  availableDays,
  selectedDays,
  calendarDate,
  showSuccess,
  onCalendarDateChange,
  onDayClick,
  onBlockTime,
  onSetOpenHours,
  onSyncGoogleCalendar,
  api,
  setAvailableDays
}: AvailabilityTabProps) => {
  return (
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
              onClick={() => {
                const prevMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
                onCalendarDateChange(prevMonth);
              }}
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
              onClick={() => {
                const nextMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
                onCalendarDateChange(nextMonth);
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="max-w-full sm:max-w-md mx-auto overflow-x-auto">
            <Calendar
              selectRange={false}
              onClickDay={onDayClick}
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
                onClick={onBlockTime} 
                className="w-full bg-gradient-to-r from-red-500 to-red-400 text-white px-4 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedDays.length === 0}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12M6 6l12 12" />
                </svg>
                Block Selected Days
              </button>
              
              <button 
                onClick={onSetOpenHours} 
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
                    const today = new Date();
                    const twoMonthsFromNow = addMonths(today, 2);
                    const startDate = format(today, 'yyyy-MM-dd');
                    const endDate = format(twoMonthsFromNow, 'yyyy-MM-dd');
                    
                    const result = await api.post('/api/availability/sync', { 
                      startDate,
                      endDate
                    });
                    
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
                    
                    await onSyncGoogleCalendar();
                  } catch (error: any) {
                    console.error('Sync error:', error);
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
  );
};
