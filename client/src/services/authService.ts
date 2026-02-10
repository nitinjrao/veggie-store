import api from './api';
import type { User } from '../types';

interface AuthResponse {
  token: string;
  user: User;
}

interface OtpResponse {
  message: string;
  phone: string;
}

export const authService = {
  adminLogin: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/admin/login', { email, password }).then((r) => r.data),

  customerRegister: (phone: string, name?: string) =>
    api.post<OtpResponse>('/auth/customer/register', { phone, name }).then((r) => r.data),

  customerLogin: (phone: string) =>
    api.post<OtpResponse>('/auth/customer/login', { phone }).then((r) => r.data),

  verifyOtp: (phone: string, otp: string) =>
    api.post<AuthResponse>('/auth/customer/verify-otp', { phone, otp }).then((r) => r.data),
};
