import { motion } from 'framer-motion';
import type { Service } from '../types';
import { formatDuration, formatPrice, formatCurrency } from '../utils';

interface ManageServicesTabProps {
  mainServices: Service[];
  addOns: Service[];
  onEditService: (service: Service) => void;
  onDeleteService: (id: string) => void;
  onAddMainService: () => void;
  onAddAddonService: () => void;
}

export const ManageServicesTab = ({
  mainServices,
  addOns,
  onEditService,
  onDeleteService,
  onAddMainService,
  onAddAddonService
}: ManageServicesTabProps) => {
  return (
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
          onClick={onAddMainService}
          className="bg-gradient-to-r from-pink-accent to-pink-accent/80 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Main Service
        </button>
        <button 
          onClick={onAddAddonService}
          className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Add-on Service
        </button>
      </div>

      {/* Main Services Section */}
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
                    onClick={() => onEditService(service)} 
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
              onClick={onAddMainService}
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
                    onClick={() => onEditService(addon)} 
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
              onClick={onAddAddonService}
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
  );
};
