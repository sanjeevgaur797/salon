import axios from 'axios';
import { Platform } from 'react-native';

// Default host for local development:
// Android Emulator -> 10.0.2.2
// iOS Simulator / Web -> localhost
const DEFAULT_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

export const API_BASE_URL = DEFAULT_BASE_URL;

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

const mobileApi = axios.create({
  baseURL: DEFAULT_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

mobileApi.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export default mobileApi;
