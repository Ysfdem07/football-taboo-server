import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language } from '../constants/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: keyof typeof translations['tr']) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'tr',
  setLanguage: async () => {},
  t: (key) => translations.tr[key] || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<Language>('tr');

  useEffect(() => {
    AsyncStorage.getItem('@app_language').then(savedLang => {
      if (savedLang === 'en' || savedLang === 'tr') {
        setLangState(savedLang);
      }
    });
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLangState(newLang);
    try {
      await AsyncStorage.setItem('@app_language', newLang);
    } catch (e) {
      console.warn('[i18n] Failed to save language preference:', e);
    }
  };

  const t = (key: keyof typeof translations['tr']): string => {
    const langDict = translations[language] || translations.tr;
    return langDict[key] || translations.tr[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
