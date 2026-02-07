import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BaseUrl} from './BaseUrl';

export const axiosInstance = axios.create({
  baseURL: BaseUrl,
});

axiosInstance.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


axiosInstance.interceptors.response.use(
  value => {
    return value;
  },
  async error => {
    if (error?.response?.status === 401) {
      await AsyncStorage.clear();
    }
    throw error;
  },
);
