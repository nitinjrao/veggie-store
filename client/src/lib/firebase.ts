import { initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let auth: Auth;

if (!firebaseConfig.apiKey) {
  console.warn('Firebase config missing — auth will not work. Set VITE_FIREBASE_* env vars.');
  // Create a minimal mock so the app renders without crashing
  const app = initializeApp({
    apiKey: 'dummy',
    authDomain: 'dummy',
    projectId: 'dummy',
    appId: 'dummy',
  });
  auth = getAuth(app);
} else {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export { auth };
