import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Hero = () => {
  const { t } = useLanguage();


  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-soft-pink to-butter-yellow opacity-80"
        style={{ willChange: 'transform, opacity' }}
        initial={shouldReduceMotion || isMobile ? undefined : { scale: 1.1 }}
        animate={shouldReduceMotion || isMobile ? undefined : { scale: 1 }}
        transition={shouldReduceMotion || isMobile ? undefined : { duration: 1.5 }}
      ></motion.div>
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <motion.h1 
          initial={shouldReduceMotion || isMobile ? undefined : { opacity: 0, y: 30 }}
          animate={shouldReduceMotion || isMobile ? undefined : { opacity: 1, y: 0 }}
          transition={shouldReduceMotion || isMobile ? undefined : { duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-pink-accent mb-6 leading-tight"
          style={{ willChange: 'transform, opacity' }}
        >
          {t('heroTitle')}
        </motion.h1>
        <motion.p 
          initial={shouldReduceMotion || isMobile ? undefined : { opacity: 0, y: 30 }}
          animate={shouldReduceMotion || isMobile ? undefined : { opacity: 1, y: 0 }}
          transition={shouldReduceMotion || isMobile ? undefined : { duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl mb-8 text-text-dark"
          style={{ willChange: 'transform, opacity' }}
        >
          {t('welcomeMessage')}
        </motion.p>
        <motion.div 
          initial={shouldReduceMotion || isMobile ? undefined : { opacity: 0, y: 30 }}
          animate={shouldReduceMotion || isMobile ? undefined : { opacity: 1, y: 0 }}
          transition={shouldReduceMotion || isMobile ? undefined : { duration: 0.6, delay: 0.3 }}
          style={{ willChange: 'transform, opacity' }}
        >
          <Link to="/book" className="bg-pink-accent text-white px-8 py-4 rounded-full shadow-soft hover:shadow-lg transition-all duration-300 text-lg font-semibold">
            {t('bookNow')}
          </Link>
        </motion.div>
      </div>
      {/* Subtle animation elements */}
      {!shouldReduceMotion && !isMobile && (
        <>
          <motion.div 
            className="absolute bottom-0 left-0 w-64 h-64 bg-baby-blue rounded-full filter blur-3xl opacity-30"
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ willChange: 'transform' }}
          ></motion.div>
          <motion.div 
            className="absolute top-0 right-0 w-96 h-96 bg-butter-yellow rounded-full filter blur-3xl opacity-30"
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ willChange: 'transform' }}
          ></motion.div>
        </>
      )}
    </section>
  );
};

export default Hero;