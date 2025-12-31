import axios from 'axios';

const api = axios.create({
  baseURL: 'https://meallan-back-production.up.railway.app/api',
});

export default api;