// Firebase configuration
// Get these values from Firebase Console > Project Settings > Your apps > Web app

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Helper to check if a value is a valid env var (not undefined, not empty, not the string "undefined")
const isValidEnvVar = (value: string | undefined): value is string => {
  return !!(value && value !== 'undefined' && value !== '' && value.length > 10);
};

// Check if we're in a browser environment (client-side)
const isBrowser = typeof window !== 'undefined';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase config is valid (has required values)
// More strict validation to prevent build-time errors
const isFirebaseConfigValid = 
  isValidEnvVar(firebaseConfig.apiKey) &&
  isValidEnvVar(firebaseConfig.authDomain) &&
  isValidEnvVar(firebaseConfig.projectId);

// Only initialize Firebase if:
// 1. We have a valid config
// 2. We're in a browser environment (prevents SSG/SSR build errors)
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigValid && isBrowser) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
    // Keep all values as null - app will work in degraded mode
  }
}

// Export with type assertions - consumers should check if these are null
// when used in contexts where Firebase might not be initialized
export { db, auth, storage };
export default app;
