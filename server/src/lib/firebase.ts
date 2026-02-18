import dotenv from 'dotenv';
dotenv.config();

import admin from 'firebase-admin';

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!serviceAccountJson) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is required');
}

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

export const firebaseAuth = admin.auth();
