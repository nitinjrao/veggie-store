import {
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signOut,
  RecaptchaVerifier,
  type ConfirmationResult,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import api from './api';
import type { User } from '../types';

interface FirebaseLoginResponse {
  user: User;
}

let confirmationResult: ConfirmationResult | null = null;

export const authService = {
  sendOtp: async (phone: string, recaptchaVerifier: RecaptchaVerifier) => {
    // Firebase requires E.164 format (e.g., +919876543210)
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
  },

  verifyOtp: async (otp: string, name?: string): Promise<User> => {
    if (!confirmationResult) {
      throw new Error('No OTP request in progress');
    }
    await confirmationResult.confirm(otp);
    const idToken = await auth.currentUser!.getIdToken();
    const { data } = await api.post<FirebaseLoginResponse>('/auth/customer/firebase-login', {
      idToken,
      name,
    });
    confirmationResult = null;
    return data.user;
  },

  googleSignIn: async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    const idToken = await auth.currentUser!.getIdToken();
    const { data } = await api.post<FirebaseLoginResponse>('/auth/customer/firebase-login', {
      idToken,
    });
    return data.user;
  },

  adminLogin: async (email: string, password: string): Promise<User> => {
    await signInWithEmailAndPassword(auth, email, password);
    const idToken = await auth.currentUser!.getIdToken();
    const { data } = await api.post<FirebaseLoginResponse>('/auth/admin/firebase-login', {
      idToken,
    });
    return data.user;
  },

  logout: async () => {
    await signOut(auth);
  },
};
