import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en/common.json'
import ar from './ar/common.json'

const savedLanguage = localStorage.getItem('language') || 'en'

i18n.use(initReactI18next).init({
  resources: {
    en: { common: en },
    ar: { common: ar },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common'],
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
