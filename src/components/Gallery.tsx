import { useState } from 'react';
import Modal from './Modal';
import { useLanguage } from '../contexts/LanguageContext';

const posts = [
  'https://www.instagram.com/p/DRM7U80iN5i/',
  'https://www.instagram.com/p/DQ6bIaKgIbB/',
  'https://www.instagram.com/p/DQWfOcPCGVG/',
  'https://www.instagram.com/p/DPlDQpSiL7D/',
  'https://www.instagram.com/p/DOrIZTHiKCO/',
  'https://www.instagram.com/p/DNceK4LI7-L/',
];

const Gallery = () => {
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const { t } = useLanguage();

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 bg-butter-yellow/20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 md:mb-16 text-pink-accent px-2">{t('ourRecentWork')}</h2>
        
        {/* Grid Layout - Better for Instagram embeds */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {posts.map((post, index) => (
            <div
              key={index}
              className="w-full"
            >
              <div 
                className="relative w-full bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer group active:scale-[0.98]"
                onClick={() => setSelectedPost(post)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedPost(post);
                  }
                }}
                aria-label={`View Instagram post ${index + 1}`}
              >
                {/* Instagram Embed Container */}
                <div className="relative w-full bg-white overflow-hidden">
                  <iframe
                    src={`${post}embed`}
                    width="100%"
                    height="500"
                    frameBorder="0"
                    scrolling="no"
                    allow="encrypted-media"
                    className="w-full rounded-xl sm:rounded-2xl"
                    loading="lazy"
                    title={`Instagram post ${index + 1}`}
                  />
                </div>
                
                {/* Hover Overlay Indicator */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl sm:rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-200">
                    <span className="text-sm font-semibold text-gray-800">Click to view</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Modal for viewing full post */}
      <Modal isOpen={!!selectedPost} onClose={() => setSelectedPost(null)}>
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Instagram Post</h3>
            <button 
              onClick={() => setSelectedPost(null)}
              className="text-gray-500 hover:text-gray-700 active:opacity-70 transition-opacity duration-200 p-2 rounded-lg hover:bg-gray-100 touch-manipulation"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="bg-white rounded-xl overflow-hidden shadow-lg">
            <iframe
              src={`${selectedPost}embed`}
              width="100%"
              height="600"
              frameBorder="0"
              scrolling="no"
              allow="encrypted-media"
              className="w-full"
              title="Instagram post detail"
            />
          </div>
          {selectedPost && (
            <div className="mt-4 text-center">
              <a 
                href={selectedPost} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-pink-accent hover:bg-pink-accent/90 active:scale-95 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation"
              >
                View on Instagram →
              </a>
            </div>
          )}
        </div>
      </Modal>
    </section>
  );
};

export default Gallery;