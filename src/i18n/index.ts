import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from './en';
import { vi } from './vi';

export const resources = {
  en: { translation: en },
  vi: { translation: vi },
} as const;

export function initI18n(language: 'en' | 'vi' = 'en'): void {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
    });
    return;
  }

  void i18n.changeLanguage(language);
}

export { i18n };
