import { useLanguage } from '../contexts/LanguageContext';

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button 
      onClick={toggleLanguage} 
      className="w-8 h-6 overflow-hidden rounded border border-gray-300" 
      title={language === 'en' ? 'Switch to Hebrew' : 'Switch to English'}
    >
      <img 
        src={language === 'en' ? '/israel-flag.png' : '/us-flag.png'}
        alt={language === 'en' ? 'Israeli flag' : 'US flag'}
        className="w-full h-full object-cover"
      />
    </button>
  );
};

export default LanguageToggle;