import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Analytics, Booking } from '../types';
import { formatCurrency } from '../utils';

interface AnalyticsTabProps {
  analytics: Analytics;
  bookings: Booking[];
  analyticsTimeRange: 'week' | 'month' | 'quarter' | 'year';
  onTimeRangeChange: (range: 'week' | 'month' | 'quarter' | 'year') => void;
  onSaveGoals: (goals: { monthlyGoal: number; monthlyBookingGoal: number }) => void;
}

export const AnalyticsTab = ({
  analytics,
  bookings,
  analyticsTimeRange,
  onTimeRangeChange,
  onSaveGoals
}: AnalyticsTabProps) => {
  const [revenueChartType, setRevenueChartType] = useState<'daily' | 'weekly'>('weekly');
  const [editingGoals, setEditingGoals] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [goalInputs, setGoalInputs] = useState({
    monthlyGoal: analytics.monthlyGoal || 0,
    monthlyBookingGoal: analytics.monthlyBookingGoal || 0
  });

  const handleSaveGoals = () => {
    onSaveGoals(goalInputs);
    setEditingGoals(false);
  };

  return (
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
            onChange={(e) => onTimeRangeChange(e.target.value as 'week' | 'month' | 'quarter' | 'year')}
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
                <span className="text-lg font-bold text-purple-600">{analytics.repeatCustomerRate || 0}%</span>
              </div>
              <div className="w-full bg-purple-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.repeatCustomerRate || 0}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">New Clients This Period</span>
                <span className="font-bold text-gray-800">{analytics.newClientsThisPeriod || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg. Visits per Client</span>
                <span className="font-bold text-gray-800">{analytics.avgVisitsPerClient || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Client Retention Rate</span>
                <span className="font-bold text-green-600">{analytics.clientRetentionRate || 0}%</span>
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
                <div className="text-2xl font-bold text-blue-600 mb-1">{analytics.avgBookingsPerDay || 0}</div>
                <div className="text-sm text-blue-700">Avg. bookings/day</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Busiest Day</span>
                <span className="font-bold text-gray-800">{analytics.busiestDay || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cancellation Rate</span>
                <span className={`font-bold ${(analytics.cancellationRate || 0) > 15 ? 'text-red-600' : 'text-green-600'}`}>
                  {analytics.cancellationRate || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">No-show Rate</span>
                <span className={`font-bold ${(analytics.noShowRate || 0) > 10 ? 'text-red-600' : 'text-green-600'}`}>
                  {analytics.noShowRate || 0}%
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
            {analytics.vipClients?.map((client: any, index: number) => {
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
              
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                  <div>
                    <h4 className="font-semibold text-gray-800">{client.name}</h4>
                    <p className="text-sm text-gray-600">
                      {client.visits} visits • {formatCurrency(totalSpent)} spent
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-yellow-700">
                      Last visit: {new Date(client.lastVisit).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
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
                  monthlyGoal: analytics.monthlyGoal || 0,
                  monthlyBookingGoal: analytics.monthlyBookingGoal || 0
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
  );
};
