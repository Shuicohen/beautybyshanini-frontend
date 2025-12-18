import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { FiMenu, FiX } from 'react-icons/fi';

interface Props {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

const StickyHeader = ({ isMenuOpen, setIsMenuOpen }: Props) => {
  const { t, language, toggleLanguage } = useLanguage();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/book', label: 'Book Appointment' },
    { to: '/admin/dashboard', label: 'Admin' },
  ];

  return (
    <header className="sticky top-0 bg-soft-pink shadow-md z-50 p-3 sm:p-4 flex justify-between items-center text-text-dark">
      <Link to="/" className="text-pink-accent font-bold text-lg sm:text-xl md:text-2xl active:opacity-70 transition-opacity touch-manipulation">
        Beauty by Shani
      </Link>
      <nav className="hidden md:flex space-x-4 lg:space-x-6">
        {navLinks.map((link) => (
          <Link 
            key={link.to} 
            to={link.to} 
            className="hover:text-pink-accent active:text-pink-accent transition-colors duration-200 text-sm lg:text-base touch-manipulation"
          >
            {t(link.label as any)}
          </Link>
        ))}
      </nav>
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button 
          onClick={toggleLanguage} 
          className="w-7 h-5 sm:w-8 sm:h-6 overflow-hidden rounded border border-gray-300 active:opacity-70 transition-opacity touch-manipulation" 
          title={language === 'en' ? 'Switch to Hebrew' : 'Switch to English'}
          aria-label={language === 'en' ? 'Switch to Hebrew' : 'Switch to English'}
        >
          <img 
            src={language === 'en' ? '/israel-flag.png' : '/us-flag.png'}
            alt={language === 'en' ? 'Israeli flag' : 'US flag'}
            className="w-full h-full object-cover"
          />
        </button>
        <button 
          className="md:hidden p-2 -mr-2 active:opacity-70 transition-opacity touch-manipulation" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>
      {isMenuOpen && (
        <nav className="absolute top-full left-0 w-full bg-soft-pink p-4 md:hidden shadow-lg border-t border-pink-accent/20">
          <ul className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link 
                  to={link.to} 
                  onClick={() => setIsMenuOpen(false)} 
                  className="block py-2 px-3 rounded-lg hover:bg-pink-accent/10 active:bg-pink-accent/20 transition-colors duration-200 text-base font-medium touch-manipulation"
                >
                  {t(link.label as any)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
};

export default StickyHeader;