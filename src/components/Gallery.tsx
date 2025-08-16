import { useState, useEffect } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import Modal from './Modal';
import { useLanguage } from '../contexts/LanguageContext';

const posts = [
  'https://www.instagram.com/p/DFpt9RbNzfS/',
  'https://www.instagram.com/p/DBELnNStbfy/',
  'https://www.instagram.com/p/DB9DrJoN7po/',
  'https://www.instagram.com/p/DA6MEcutBBC/',
  'https://www.instagram.com/p/C_kZdrxN11g/',
  'https://www.instagram.com/p/C_AfjgGN8rZ/',
];

const Gallery = () => {
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const { t } = useLanguage();

  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const galleryVariants: Variants = (shouldReduceMotion || isMobile)
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 60, damping: 18 } } };

  return (
    <section className="py-20 px-4 bg-butter-yellow/20">
      <h2 className="text-4xl font-bold text-center mb-16 text-pink-accent">{t('ourRecentWork')}</h2>
      <div className="columns-2 md:columns-3 gap-4 max-w-7xl mx-auto">
        {posts.map((post, index) => (
          <motion.div
            key={index}
            variants={galleryVariants}
            initial={shouldReduceMotion || isMobile ? 'hidden' : 'hidden'}
            whileInView={shouldReduceMotion || isMobile ? 'visible' : 'visible'}
            viewport={{ once: true, amount: 0.2 }}
            className="mb-4 break-inside-avoid"
            style={{ willChange: 'transform, opacity' }}
          >
            <iframe
              src={`${post}embed`}
              width="100%"
              height="400"
              frameBorder="0"
              scrolling="no"
              allow="encrypted-media"
              className="rounded-2xl shadow-soft"
            ></iframe>
          </motion.div>
        ))}
      </div>
      <Modal isOpen={!!selectedPost} onClose={() => setSelectedPost(null)}>
        <iframe
          src={`${selectedPost}embed`}
          width="100%"
          height="600"
          frameBorder="0"
          scrolling="no"
          allow="encrypted-media"
          className="rounded-2xl"
        ></iframe>
      </Modal>
    </section>
  );
};

export default Gallery;