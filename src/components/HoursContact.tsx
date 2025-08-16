import { FaClock, FaMapMarkerAlt, FaWhatsapp } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';

const HoursContact = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-baby-blue/20 to-soft-pink/20">
      <h2 className="text-4xl font-bold text-center mb-16 text-pink-accent">{t('hoursContact')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-white p-8 rounded-2xl shadow-soft"
        >
          <h3 className="font-bold text-2xl mb-6 flex items-center text-text-dark"><FaClock className="mr-3 text-pink-accent text-3xl" /> {t('businessHours')}</h3>
          <p className="mb-2 text-lg">{t('sundayThursday')}</p>
          <p className="text-lg">{t('friday')}</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-white p-8 rounded-2xl shadow-soft"
        >
          <h3 className="font-bold text-2xl mb-6 flex items-center text-text-dark"><FaMapMarkerAlt className="mr-3 text-pink-accent text-3xl" /> {t('location')}</h3>
          <p className="mb-6 text-lg">{t('address')}</p>
          <a href="https://wa.me/+972587594973" className="block bg-pink-accent text-white px-6 py-3 rounded-full text-center font-semibold hover:bg-pink-accent/90 transition">
            <FaWhatsapp className="inline mr-2" /> {t('contactWhatsApp')}
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default HoursContact;