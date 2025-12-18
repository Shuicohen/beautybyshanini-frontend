import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import StickyHeader from './components/StickyHeader';
import Footer from './components/Footer';
import Home from './pages/Home';
import Booking from './pages/Booking';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ManageBooking from './pages/ManageBooking';

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, t } = useLanguage();
  const isRTL = language === 'he';
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className={isRTL ? 'font-hebrew' : ''}>
      {!isAdminRoute && (
        <>
          <StickyHeader isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
          <main className="min-h-screen text-text-dark">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/book" element={<Booking />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/manage" element={<ManageBooking />} />
            </Routes>
          </main>
          <Footer />
          <Link 
            to="/book" 
            className={`fixed bottom-4 ${isRTL ? 'left-4' : 'right-4'} bg-pink-accent text-white px-5 py-3 rounded-full shadow-lg md:hidden z-50 active:scale-95 transition-transform duration-200 touch-manipulation text-sm font-semibold`}
          >
            {t('bookNow')}
          </Link>
        </>
      )}
      {isAdminRoute && (
        <>
          <StickyHeader isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
        </>
      )}
      <Routes>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/login" element={<AdminLogin />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <Router>
        <AppContent />
      </Router>
    </LanguageProvider>
  );
}

export default App;
