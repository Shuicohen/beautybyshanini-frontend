import { FiMenu, FiX } from 'react-icons/fi';
import { tabs } from './constants';

interface SidebarProps {
  activeTab: string;
  isMenuOpen: boolean;
  onTabChange: (tab: string) => void;
  onMenuToggle: () => void;
  onLogout: () => void;
}

export const Sidebar = ({ activeTab, isMenuOpen, onTabChange, onMenuToggle, onLogout }: SidebarProps) => {
  return (
    <>
      {/* Mobile menu button */}
      <button 
        className="md:hidden p-2.5 bg-white/95 backdrop-blur-md text-pink-accent fixed top-2 left-2 z-50 rounded-full shadow-lg border border-white/20"
        onClick={onMenuToggle}
        aria-label="Open menu"
      >
        {isMenuOpen ? <FiX size={18} /> : <FiMenu size={18} />}
      </button>
      
      {/* Mobile overlay */}
      {isMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={onMenuToggle}
        />
      )}
      
      {/* Sidebar navigation */}
      <nav
        className={`
          relative z-40 bg-white/95 backdrop-blur-md p-3 sm:p-4 md:p-6 shadow-soft flex flex-col
          w-72 max-w-[80vw] h-screen fixed top-0 left-0 transition-transform duration-300 ease-in-out
          md:static md:w-1/5 md:h-screen md:block md:translate-x-0
          ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 border-r border-white/20 overflow-y-auto
        `}
      >
        <h2 className="text-base sm:text-lg md:text-2xl font-bold text-pink-accent mb-4 sm:mb-6 md:mb-8 pt-12 md:pt-0">Admin Dashboard</h2>
        <ul className="space-y-1.5 sm:space-y-2 md:space-y-4 flex-grow">
          {tabs.map((tab) => (
            <li key={tab.name}>
              <button 
                onClick={() => {
                  onTabChange(tab.name);
                  onMenuToggle();
                }} 
                className={`w-full flex items-center py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4 rounded-lg transition ${
                  activeTab === tab.name ? 'bg-pink-accent text-white' : 'hover:bg-pink-accent/10'
                }`}
              >
                <tab.icon className="mr-2 sm:mr-2.5 md:mr-3 text-base sm:text-lg md:text-xl flex-shrink-0" size={18} />
                <span className="text-xs sm:text-sm md:text-base">{tab.name}</span>
              </button>
            </li>
          ))}
        </ul>
        <button 
          onClick={onLogout}
          className="w-full mt-4 sm:mt-6 md:mt-8 bg-pink-accent/80 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full shadow-soft hover:bg-pink-accent transition text-xs sm:text-sm md:text-base"
        >
          Logout
        </button>
      </nav>
    </>
  );
};

