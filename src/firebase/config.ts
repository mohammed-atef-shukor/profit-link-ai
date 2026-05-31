import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";

function requireEnv(name: string): string {
  const value = import.meta.env[name];
  if (!value || typeof value !== "string") {
    throw new Error(
      `Missing Firebase environment variable: ${name}. Copy .env.example to .env and fill in your Firebase project values.`,
    );
  }
  return value;
}

export function getFirebaseConfig(): FirebaseOptions {
  return {
    apiKey: requireEnv("VITE_FIREBASE_API_KEY"),
    authDomain: requireEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: requireEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: requireEnv("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: requireEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: requireEnv("VITE_FIREBASE_APP_ID"),
  };
}

/** Singleton Firebase app — safe for HMR and SSR re-entry. */
export function getFirebaseApp(): FirebaseApp {
  if (getApps().length) return getApp();
  return initializeApp(getFirebaseConfig());
}
