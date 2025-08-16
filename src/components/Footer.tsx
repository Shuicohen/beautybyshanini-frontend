import { FaInstagram, FaWhatsapp, FaEnvelope, FaPhone } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-pink-accent text-text-dark py-8">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-bold mb-2">{t('hoursContact')}</h3>
          <p><FaPhone className="inline mr-2" /> {t('phoneLabel')}: +972587594973</p>
          <p><FaEnvelope className="inline mr-2" /> {t('emailLabel')}: shanikad00@gmail.com</p>
        </div>
        <div>
          <h3 className="font-bold mb-2">{t('social')}</h3>
          <div className="flex space-x-4">
            <a href="https://www.instagram.com/shanikadcoh/" target="_blank" rel="noopener noreferrer"><FaInstagram size={24} /></a>
            <a href="https://wa.me/+972587594973" target="_blank" rel="noopener noreferrer"><FaWhatsapp size={24} /></a>
          </div>
        </div>
        <div>
          <p className="text-center md:text-right">© 2025 Beauty by Shani. {t('allRightsReserved')}.</p>
          <p className="text-center md:text-right mt-2 text-sm">
            Built by <a href="https://portfolio-page-kdqi.onrender.com/home.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">Shui</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;