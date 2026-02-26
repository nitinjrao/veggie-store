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
    const isDevBypass = import.meta.env.DEV && !import.meta.env.VITE_FIREBASE_API_KEY;
    if (error.response?.status === 401 && !isDevBypass) {
      // Only redirect if user was on a page that requires auth
      const isAdminRoute = error.config?.url?.includes('/admin');
      const isStaffRoute =
        error.config?.url?.includes('/staff') ||
        ['/producer', '/supplier', '/transporter'].some((p) =>
          window.location.pathname.startsWith(p)
        );
      const isAuthRequired = ['/favorites', '/orders', '/addresses'].some((path) =>
        error.config?.url?.includes(path)
      );
      if (isAdminRoute || isStaffRoute || isAuthRequired) {
        await signOut(auth);
        localStorage.removeItem('user');
        if (isAdminRoute) {
          window.location.href = '/admin/login';
        } else if (isStaffRoute) {
          window.location.href = '/staff/login';
        } else {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
