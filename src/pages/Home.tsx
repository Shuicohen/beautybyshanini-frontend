import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Gallery from '../components/Gallery';
import HoursContact from '../components/HoursContact';

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const Home = () => {
  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [servicesRef, servicesInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [galleryRef, galleryInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [contactRef, contactInView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <div className="relative overflow-hidden">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_20%,rgba(255,179,198,0.1)_100%)] pointer-events-none"></div>
      
      <motion.div ref={heroRef} variants={sectionVariants} initial="hidden" animate={heroInView ? 'visible' : 'hidden'}>
        <Hero />
      </motion.div>
      
      <motion.div ref={servicesRef} variants={sectionVariants} initial="hidden" animate={servicesInView ? 'visible' : 'hidden'} className="relative z-10">
        <Services />
      </motion.div>
      
      <motion.div ref={galleryRef} variants={sectionVariants} initial="hidden" animate={galleryInView ? 'visible' : 'hidden'} className="relative z-10">
        <Gallery />
      </motion.div>
      
      <motion.div ref={contactRef} variants={sectionVariants} initial="hidden" animate={contactInView ? 'visible' : 'hidden'} className="relative z-10">
        <HoursContact />
      </motion.div>
    </div>
  );
};

export default Home;