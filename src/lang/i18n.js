import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import translationFR from './fr.json';
import translationEN from './en.json';

export const resources = {
  fr: { translation: translationFR },
  en: { translation: translationEN }
} ;

i18n
  .use(LanguageDetector) // Automatically detects the user's language
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    resources: {
      fr: {
        translation: translationFR
        },
        en: {
        translation: translationEN
        }
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;