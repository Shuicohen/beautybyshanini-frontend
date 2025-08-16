import { motion, useReducedMotion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Gallery from '../components/Gallery';
import HoursContact from '../components/HoursContact';

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const Home = () => {
  const shouldReduceMotion = useReducedMotion();
  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [servicesRef, servicesInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [galleryRef, galleryInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [contactRef, contactInView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <div className="relative overflow-hidden">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_20%,rgba(255,179,198,0.1)_100%)] pointer-events-none"></div>
      <motion.div
        ref={heroRef}
        variants={sectionVariants}
        initial={shouldReduceMotion ? undefined : 'hidden'}
        animate={shouldReduceMotion ? undefined : heroInView ? 'visible' : 'hidden'}
        style={{ willChange: 'transform, opacity' }}
      >
        <Hero />
      </motion.div>
      <motion.div
        ref={servicesRef}
        variants={sectionVariants}
        initial={shouldReduceMotion ? undefined : 'hidden'}
        animate={shouldReduceMotion ? undefined : servicesInView ? 'visible' : 'hidden'}
        className="relative z-10"
        style={{ willChange: 'transform, opacity' }}
      >
        <Services />
      </motion.div>
      <motion.div
        ref={galleryRef}
        variants={sectionVariants}
        initial={shouldReduceMotion ? undefined : 'hidden'}
        animate={shouldReduceMotion ? undefined : galleryInView ? 'visible' : 'hidden'}
        className="relative z-10"
        style={{ willChange: 'transform, opacity' }}
      >
        <Gallery />
      </motion.div>
      <motion.div
        ref={contactRef}
        variants={sectionVariants}
        initial={shouldReduceMotion ? undefined : 'hidden'}
        animate={shouldReduceMotion ? undefined : contactInView ? 'visible' : 'hidden'}
        className="relative z-10"
        style={{ willChange: 'transform, opacity' }}
      >
        <HoursContact />
      </motion.div>
    </div>
  );
};

export default Home;