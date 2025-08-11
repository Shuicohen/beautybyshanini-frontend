import { motion } from 'framer-motion';
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
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 bg-soft-pink shadow-soft z-50 p-4 flex justify-between items-center text-text-dark"
    >
      <Link to="/" className="text-pink-accent font-bold text-2xl">Beauty by Shani</Link>
      <nav className="hidden md:flex space-x-4">
        {navLinks.map((link) => (
          <Link key={link.to} to={link.to} className="hover:text-pink-accent">{t(link.label as any)}</Link>
        ))}
      </nav>
      <div className="flex items-center space-x-2">
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
        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>
      {isMenuOpen && (
        <motion.nav 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 w-full bg-soft-pink p-4 md:hidden"
        >
          <ul className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} onClick={() => setIsMenuOpen(false)} className="block hover:text-pink-accent">{t(link.label as any)}</Link>
              </li>
            ))}
          </ul>
        </motion.nav>
      )}
    </motion.header>
  );
};

export default StickyHeader;