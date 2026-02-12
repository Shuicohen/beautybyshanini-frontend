import { useEffect, useState } from 'react';
import useApi from '../hooks/useApi';
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
  const [loading, setLoading] = useState(true);
  const api = useApi();
  const { t, language } = useLanguage();

  useEffect(() => {
    setLoading(true);
    api.get(`/api/services?language=${language}`).then((data: Service[]) => {
      const mainServices = data.filter(service => !service.is_addon);
      const addOnServices = data.filter(service => service.is_addon);
      setServices(mainServices);
      setAddOns(addOnServices);
    }).finally(() => setLoading(false));
  }, [api, language]);

  return (
    <section className="py-16 md:py-24 px-4 md:px-8 relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-baby-blue/5 via-soft-pink/5 to-butter-yellow/5"></div>

      <div className="relative max-w-7xl mx-auto">
        {/* Main Services Section */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-pink-deep tracking-tight">
            {t('ourServices')}
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-pink-accent to-baby-blue mx-auto mb-4"></div>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-2">
            {t('serviceDescription')}
          </p>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-pink-accent mb-4"></div>
            <span className="text-pink-accent font-semibold text-lg">{t('loadingServices')}</span>
          </div>
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-20">
          {services.map((service, index) => (
            <Link
              key={service.id}
              to={`/book?service=${service.id}`}
              className="block group"
            >
              <div className={`${colors[index % colors.length]} p-5 sm:p-6 rounded-2xl border border-white/40 hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center cursor-pointer touch-manipulation active:scale-[0.98]`}>
                <h3 className="font-bold text-base sm:text-lg text-gray-800 leading-snug mb-3">
                  {service.name}
                </h3>
                <span className="text-2xl sm:text-3xl font-bold text-pink-accent mb-4">
                  {formatPrice(service.price)}
                </span>
                <span className="text-xs sm:text-sm text-pink-accent/80 font-semibold bg-pink-accent/10 px-4 py-1.5 rounded-full group-hover:bg-pink-accent group-hover:text-white transition-colors duration-200">
                  {t('bookNowService')}
                </span>
              </div>
            </Link>
          ))}
        </div>
        )}

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
            
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold mb-3 text-pink-deep">
                {t('addOns')}
              </h3>
              <p className="text-sm md:text-base text-gray-500 max-w-xl mx-auto">
                {t('addOnsDescription')}
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {addOns.map((addon) => (
                <div
                  key={addon.id}
                  className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-gray-100 hover:border-pink-accent/30 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center touch-manipulation"
                >
                  <span className="text-pink-accent/70 text-xs font-semibold uppercase tracking-wider mb-1">+</span>
                  <h4 className="font-semibold text-sm text-gray-800 leading-snug mb-2">
                    {addon.name}
                  </h4>
                  <span className="text-lg font-bold text-pink-accent">
                    {formatPrice(addon.price)}
                  </span>
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