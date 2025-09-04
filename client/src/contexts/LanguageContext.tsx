import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => void;
  availableLanguages: { code: string; name: string; nativeName: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  const availableLanguages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  ];

  const changeLanguage = async (language: string) => {
    try {
      await i18n.changeLanguage(language);
      setCurrentLanguage(language);
      localStorage.setItem('language', language);
      
      // Update document language attribute
      document.documentElement.lang = language;
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  useEffect(() => {
    // Set initial language from localStorage or browser setting
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && savedLanguage !== currentLanguage) {
      changeLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    // Listen to i18n language changes
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
      document.documentElement.lang = lng;
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const value: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    availableLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
