import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useApi from '../hooks/useApi';
import { FaPaintBrush } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  is_addon: boolean;
}

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

const formatDuration = (min: number) => {
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  return `${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : ''} ${minutes > 0 ? `${minutes} min` : ''}`.trim();
};

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [addOns, setAddOns] = useState<Service[]>([]);
  const api = useApi();
  const { t } = useLanguage();

  useEffect(() => {
    api.get('/api/services').then((data: Service[]) => {
      const mainServices = data.filter(service => !service.is_addon);
      const addOnServices = data.filter(service => service.is_addon);
      setServices(mainServices);
      setAddOns(addOnServices);
    });
  }, [api]);

  return (
    <section className="py-16 md:py-24 px-4 md:px-8 relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-baby-blue/5 via-soft-pink/5 to-butter-yellow/5"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,179,198,0.08)_0%,transparent_50%),radial-gradient(circle_at_70%_80%,rgba(173,216,230,0.08)_0%,transparent_50%)]"></div>
      
      <div className="relative max-w-7xl mx-auto">
        {/* Main Services Section */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-pink-accent tracking-tight"
          >
            {t('ourServices')}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-24 h-1 bg-gradient-to-r from-pink-accent to-baby-blue mx-auto mb-6"
          ></motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg md:text-xl text-text-dark/70 max-w-3xl mx-auto leading-relaxed"
          >
            {t('serviceDescription')}
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 mb-20">
          {services.map((service, index) => (
            <Link
              key={service.id}
              to={`/book?service=${service.id}`}
              className="block group"
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -12, scale: 1.02 }}
                className={`${colors[index % colors.length]} relative p-8 lg:p-10 rounded-3xl shadow-xl border border-white/40 text-center transition-all duration-500 hover:shadow-2xl hover:border-pink-accent/40 group min-h-[300px] flex flex-col items-center justify-between overflow-hidden cursor-pointer backdrop-blur-sm`}
              >
                {/* Subtle shine effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                
                {/* Icon with enhanced animation */}
                <div className="relative z-10 mb-6">
                  <div className="w-20 h-20 bg-white/30 rounded-full flex items-center justify-center mb-4 group-hover:bg-white/50 transition-all duration-300 shadow-lg">
                    <FaPaintBrush className="text-pink-accent text-3xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                  </div>
                </div>
                
                {/* Service details */}
                <div className="relative z-10 flex-grow flex flex-col justify-center">
                  <h3 className="font-bold text-xl lg:text-2xl mb-4 text-gray-900 leading-tight group-hover:text-pink-accent transition-colors duration-300">
                    {service.name}
                  </h3>
                  <div className="flex flex-col items-center gap-2 mb-6">
                    <span className="text-base lg:text-lg text-gray-700 font-medium bg-white/40 px-3 py-1 rounded-full">
                      {formatDuration(service.duration)}
                    </span>
                    <span className="text-3xl lg:text-4xl font-bold text-pink-accent">
                      ₪{Number(service.price).toFixed(0)}
                    </span>
                  </div>
                </div>
                
                {/* Enhanced book button */}
                <div className="relative z-10 bg-white/40 text-gray-800 py-3 px-8 rounded-full font-bold group-hover:bg-pink-accent group-hover:text-white transition-all duration-300 border-2 border-white/60 group-hover:border-pink-accent shadow-lg group-hover:shadow-xl transform group-hover:scale-105">
                  {t('bookNowService')}
                </div>
              </motion.div>
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
              <motion.h3
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-gray-700"
              >
                {t('addOns')}
              </motion.h3>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-16 h-1 bg-gradient-to-r from-gray-400 to-gray-600 mx-auto mb-4"
              ></motion.div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-base md:text-lg text-text-dark/60 max-w-2xl mx-auto leading-relaxed"
              >
                {t('addOnsDescription')}
              </motion.p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {addOns.map((addon, index) => (
                <motion.div
                  key={addon.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-gradient-to-br from-white/80 to-gray-50/80 relative p-6 lg:p-8 rounded-2xl shadow-lg border border-gray-200/60 text-center transition-all duration-300 hover:shadow-xl hover:border-gray-300/60 min-h-[240px] flex flex-col items-center justify-between backdrop-blur-sm group"
                >
                  {/* Subtle background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-transparent to-gray-100/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Enhanced icon */}
                  <div className="relative z-10 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-3 group-hover:from-pink-accent/20 group-hover:to-pink-accent/30 transition-all duration-300 shadow-md">
                      <span className="text-gray-600 text-2xl font-bold group-hover:text-pink-accent transition-colors duration-300">+</span>
                    </div>
                  </div>
                  
                  {/* Add-on details */}
                  <div className="relative z-10 flex-grow flex flex-col justify-center">
                    <h4 className="font-bold text-lg lg:text-xl mb-3 text-gray-800 leading-tight group-hover:text-gray-900 transition-colors duration-300">
                      {addon.name}
                    </h4>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-sm lg:text-base text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
                        {formatDuration(addon.duration)}
                      </span>
                      <span className="text-2xl lg:text-3xl font-bold text-gray-700 group-hover:text-pink-accent transition-colors duration-300">
                        ₪{Number(addon.price).toFixed(0)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Add-on note */}
                  <div className="relative z-10 mt-4">
                    <span className="text-xs text-gray-500 bg-gray-100/80 px-3 py-1 rounded-full">
                      {t('addDuringBooking')}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Enhanced floating animation styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(2deg); }
          50% { transform: translateY(-5px) rotate(0deg); }
          75% { transform: translateY(-3px) rotate(-2deg); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 179, 198, 0.3); }
          50% { box-shadow: 0 0 30px rgba(255, 179, 198, 0.5), 0 0 40px rgba(173, 216, 230, 0.3); }
        }
        
        .group:hover .icon-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .group:hover .glow-effect {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        /* Subtle backdrop blur for modern glass effect */
        .backdrop-blur-custom {
          backdrop-filter: blur(8px) saturate(180%);
        }
      `}</style>
    </section>
  );
};

export default Services;