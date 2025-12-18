import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Hero = () => {
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative min-h-screen flex items-center justify-center text-center overflow-hidden px-4 py-12 md:py-0">
      {/* Background overlay - reduced opacity to show animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-soft-pink to-butter-yellow opacity-30"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 w-full">
        {/* Backdrop blur container for better readability */}
        <div className="backdrop-blur-md bg-white/40 rounded-2xl p-6 md:p-8 lg:p-10 shadow-lg border border-white/20">
          <motion.h1 
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={shouldReduceMotion ? {} : { duration: 0.5 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-pink-accent mb-4 md:mb-6 leading-tight drop-shadow-sm"
          >
            {t('heroTitle')}
          </motion.h1>
          <motion.p 
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={shouldReduceMotion ? {} : { duration: 0.5, delay: 0.1 }}
            className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 text-text-dark px-2 font-medium drop-shadow-sm"
          >
            {t('welcomeMessage')}
          </motion.p>
          <motion.div 
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={shouldReduceMotion ? {} : { duration: 0.5, delay: 0.2 }}
          >
            <Link 
              to="/book" 
              className="inline-block bg-pink-accent text-white px-6 py-3 md:px-8 md:py-4 rounded-full shadow-lg active:shadow-md active:scale-95 transition-all duration-200 text-base md:text-lg font-semibold touch-manipulation hover:bg-pink-accent/90"
            >
              {t('bookNow')}
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;