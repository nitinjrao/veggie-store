import dotenv from 'dotenv';
dotenv.config();

import admin from 'firebase-admin';

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!serviceAccountJson) {
  console.warn('WARNING: FIREBASE_SERVICE_ACCOUNT_JSON not set — auth will not work');
} else {
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    // Railway converts \n to actual newlines, breaking JSON.parse.
    // Try base64 decoding as a fallback.
    serviceAccount = JSON.parse(Buffer.from(serviceAccountJson, 'base64').toString());
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const firebaseAuth = admin.apps.length ? admin.auth() : (null as unknown as admin.auth.Auth);
