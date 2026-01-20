import { FaClock, FaMapMarkerAlt, FaWhatsapp } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';

const HoursContact = () => {
  const { t } = useLanguage();

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-br from-baby-blue/20 to-soft-pink/20">
      <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 md:mb-16 text-pink-accent px-2">{t('hoursContact')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-md">
          <h3 className="font-bold text-xl sm:text-2xl mb-4 sm:mb-6 flex items-center text-text-dark">
            <FaClock className="mr-3 text-pink-accent text-2xl sm:text-3xl flex-shrink-0" /> 
            <span>{t('businessHours')}</span>
          </h3>
          <p className="mb-2 text-base sm:text-lg">{t('sundayThursday')}</p>
          <p className="text-base sm:text-lg">{t('friday')}</p>
        </div>
        <div className="bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-md">
          <h3 className="font-bold text-xl sm:text-2xl mb-4 sm:mb-6 flex items-center text-text-dark">
            <FaMapMarkerAlt className="mr-3 text-pink-accent text-2xl sm:text-3xl flex-shrink-0" /> 
            <span>{t('location')}</span>
          </h3>
          <p className="mb-4 sm:mb-6 text-base sm:text-lg">{t('address')}</p>
          <a 
            href="https://wa.me/+972587594973" 
            className="block bg-pink-accent text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-center font-semibold active:bg-pink-accent/90 transition-colors duration-200 text-sm sm:text-base touch-manipulation"
          >
            <FaWhatsapp className="inline mr-2" /> {t('contactWhatsApp')}
          </a>
        </div>
      </div>
    </section>
  );
};

export default HoursContact;