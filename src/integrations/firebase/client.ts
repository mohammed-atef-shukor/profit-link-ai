// Firebase web SDK initialization.
// Config values are publishable; security is enforced by Firestore Rules + Auth.
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDMc6XFback8m_Dhe5deRSuBId2frnC__A",
  authDomain: "linkprofit-ai.firebaseapp.com",
  projectId: "linkprofit-ai",
  storageBucket: "linkprofit-ai.firebasestorage.app",
  messagingSenderId: "13916867960",
  appId: "1:13916867960:web:71730402db5d58fa518c8d",
};

// Avoid re-initializing during HMR / SSR.
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firebaseApp = app;
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
