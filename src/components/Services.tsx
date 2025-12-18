import { useEffect, useState } from 'react';
import useApi from '../hooks/useApi';
import { FaPaintBrush } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number | string; // Can be a number or a range string like "10-80"
  is_addon: boolean;
}

// Helper function to format price (handles ranges like "10-80")
const formatPrice = (price: number | string): string => {
  if (typeof price === 'string' && price.includes('-')) {
    // Format as "10 - 80 ₪"
    const parts = price.split('-').map(p => p.trim());
    return `₪ ${parts.join(' - ')}`;
  }
  return `₪${Number(price).toFixed(0)}`;
};

const colors = [
  'bg-gradient-to-br from-baby-blue/80 to-white',
  'bg-gradient-to-br from-soft-pink/80 to-white',
  'bg-gradient-to-br from-butter-yellow/80 to-white',
  'bg-gradient-to-br from-pink-accent/80 to-white',
  'bg-gradient-to-br from-green-200/80 to-white',
  'bg-gradient-to-br from-purple-100/80 to-white',
  'bg-gradient-to-br from-orange-100/80 to-white',
  'bg-gradient-to-br from-cyan-100/80 to-white',
  'bg-gradient-to-br from-lime-100/80 to-white',
  'bg-gradient-to-br from-fuchsia-100/80 to-white',
  'bg-gradient-to-br from-rose-100/80 to-white',
  'bg-gradient-to-br from-amber-100/80 to-white',
];

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [addOns, setAddOns] = useState<Service[]>([]);
  const api = useApi();
  const { t, language } = useLanguage();

  useEffect(() => {
    api.get(`/api/services?language=${language}`).then((data: Service[]) => {
      const mainServices = data.filter(service => !service.is_addon);
      const addOnServices = data.filter(service => service.is_addon);
      setServices(mainServices);
      setAddOns(addOnServices);
    });
  }, [api, language]);

  return (
    <section className="py-16 md:py-24 px-4 md:px-8 relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-baby-blue/5 via-soft-pink/5 to-butter-yellow/5"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,179,198,0.08)_0%,transparent_50%),radial-gradient(circle_at_70%_80%,rgba(173,216,230,0.08)_0%,transparent_50%)]"></div>
      
      <div className="relative max-w-7xl mx-auto">
        {/* Main Services Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-pink-accent tracking-tight">
            {t('ourServices')}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-pink-accent to-baby-blue mx-auto mb-6"></div>
          <p className="text-lg md:text-xl text-text-dark/70 max-w-3xl mx-auto leading-relaxed">
            {t('serviceDescription')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-20">
          {services.map((service, index) => (
            <Link
              key={service.id}
              to={`/book?service=${service.id}`}
              className="block group h-full"
            >
              <div
                className={`${colors[index % colors.length]} relative p-6 sm:p-8 lg:p-10 rounded-2xl md:rounded-3xl shadow-lg border border-white/40 text-center transition-shadow duration-200 active:shadow-xl active:scale-[0.98] group h-full min-h-[320px] flex flex-col items-center justify-between overflow-hidden cursor-pointer touch-manipulation`}
              >
                {/* Icon */}
                <div className="relative z-10 mb-4 sm:mb-6 flex-shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/30 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                    <FaPaintBrush className="text-pink-accent text-2xl sm:text-3xl" />
                  </div>
                </div>
                
                {/* Service details */}
                <div className="relative z-10 flex-grow flex flex-col justify-center w-full px-2">
                  <h3 className="font-bold text-lg sm:text-xl lg:text-2xl mb-3 sm:mb-4 text-gray-900 leading-tight min-h-[3rem] flex items-center justify-center">
                    {service.name}
                  </h3>
                  <div className="flex flex-col items-center gap-2 mb-4 sm:mb-6">
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-pink-accent">
                      {formatPrice(service.price)}
                    </span>
                  </div>
                </div>
                
                {/* Book button */}
                <div className="relative z-10 w-full flex-shrink-0">
                  <div className="bg-white/60 backdrop-blur-sm text-gray-800 py-3 px-6 sm:py-3.5 sm:px-8 rounded-full font-bold text-sm sm:text-base border-2 border-white/80 shadow-md active:bg-pink-accent active:text-white active:border-pink-accent transition-all duration-200 text-center">
                    {t('bookNowService')}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Add-ons Section */}
        {addOns.length > 0 && (
          <div className="relative">
            {/* Section divider */}
            <div className="flex items-center justify-center mb-12">
              <div className="h-px bg-gradient-to-r from-transparent via-pink-accent/30 to-transparent flex-1"></div>
              <div className="mx-8">
                <div className="w-3 h-3 bg-pink-accent rounded-full"></div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-pink-accent/30 to-transparent flex-1"></div>
            </div>
            
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-gray-700">
                {t('addOns')}
              </h3>
              <div className="w-16 h-1 bg-gradient-to-r from-gray-400 to-gray-600 mx-auto mb-4"></div>
              <p className="text-base md:text-lg text-text-dark/60 max-w-2xl mx-auto leading-relaxed">
                {t('addOnsDescription')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {addOns.map((addon) => (
                <div
                  key={addon.id}
                  className="bg-gradient-to-br from-white/80 to-gray-50/80 relative p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-md border border-gray-200/60 text-center transition-shadow duration-200 active:shadow-lg active:scale-[0.98] h-full min-h-[220px] sm:min-h-[240px] flex flex-col items-center justify-between touch-manipulation"
                >
                  {/* Icon */}
                  <div className="relative z-10 mb-3 sm:mb-4 flex-shrink-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-2 sm:mb-3 shadow-md">
                      <span className="text-gray-600 text-xl sm:text-2xl font-bold">+</span>
                    </div>
                  </div>
                  
                  {/* Add-on details */}
                  <div className="relative z-10 flex-grow flex flex-col justify-center w-full px-2">
                    <h4 className="font-bold text-base sm:text-lg lg:text-xl mb-2 sm:mb-3 text-gray-800 leading-tight min-h-[2.5rem] flex items-center justify-center">
                      {addon.name}
                    </h4>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-700">
                        {formatPrice(addon.price)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Add-on note */}
                  <div className="relative z-10 mt-3 sm:mt-4 flex-shrink-0">
                    <span className="text-xs text-gray-500 bg-gray-100/80 px-2 sm:px-3 py-1 rounded-full">
                      {t('addDuringBooking')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Services;