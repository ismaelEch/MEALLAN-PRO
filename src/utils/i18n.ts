import i18next from 'i18next';
import {initReactI18next} from 'react-i18next';

import en from '../locales/en.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const getDeviceLanguage = () => {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  return locale.split('-')[0];
};

const initI18n = async () => {
  const currentLanguage = await AsyncStorage.getItem('language');

  i18next.use(initReactI18next).init({
    resources: {
      en: {translation: en},
      es: {translation: es},
      fr: {translation: fr},
    },
    lng: currentLanguage || 'fr',
    fallbackLng: 'fr',
    saveMissing: true,
    interpolation: {
      escapeValue: false,
    },
  });
};

initI18n();

export default i18next;
