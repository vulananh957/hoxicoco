import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import viTranslation from './locales/vi/translation.json';
import enTranslation from './locales/en/translation.json';
import zhTranslation from './locales/zh/translation.json';
import ruTranslation from './locales/ru/translation.json';
import jaTranslation from './locales/ja/translation.json';

const resources = {
  vi: { translation: viTranslation },
  en: { translation: enTranslation },
  zh: { translation: zhTranslation },
  ru: { translation: ruTranslation },
  ja: { translation: jaTranslation },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi',
    debug: false,
    
    interpolation: {
      escapeValue: false, // React already escapes
    },

    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator'],
      // Key to use in localStorage
      lookupLocalStorage: 'appLanguage',
      // Cache user language
      caches: ['localStorage'],
    },
  });

export default i18n;
