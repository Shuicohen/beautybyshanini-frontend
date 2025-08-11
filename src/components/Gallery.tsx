import { useState } from 'react';
import { motion } from 'framer-motion';
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

  return (
    <section className="py-20 px-4 bg-butter-yellow/20">
      <h2 className="text-4xl font-bold text-center mb-16 text-pink-accent">{t('ourRecentWork')}</h2>
      <div className="columns-2 md:columns-3 gap-4 max-w-7xl mx-auto">
        {posts.map((post, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="mb-4 break-inside-avoid"
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