import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import en from '../locales/en.json';
import he from '../locales/he.json';

type Language = 'en' | 'he';
type Translations = typeof en;

const translations: Record<Language, Translations> = { en, he };

interface LanguageContextType {
  language: Language;
  t: (key: keyof Translations) => string;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>((localStorage.getItem('language') as Language) || 'en');

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => setLanguage((prev) => (prev === 'en' ? 'he' : 'en'));
  const isRTL = language === 'he';

  const t = (key: keyof Translations) => translations[language][key] || key;

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage, setLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};