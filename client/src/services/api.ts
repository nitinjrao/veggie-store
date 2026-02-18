import axios from 'axios';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Only redirect if user was on a page that requires auth
      const isAdminRoute = error.config?.url?.includes('/admin');
      const isAuthRequired = ['/favorites', '/orders', '/addresses'].some(
        (path) => error.config?.url?.includes(path)
      );
      if (isAdminRoute || isAuthRequired) {
        await signOut(auth);
        localStorage.removeItem('user');
        window.location.href = isAdminRoute ? '/admin/login' : '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
