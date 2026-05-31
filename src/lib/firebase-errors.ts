import { FirebaseError } from "firebase/app";
import { ProfileIncompleteError } from "@/firebase/auth";

const AUTH_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "Enter a valid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Try again later.",
  "auth/popup-closed-by-user": "Sign-in popup was closed.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/expired-action-code": "This reset link has expired.",
  "auth/invalid-action-code": "This reset link is invalid.",
};

const FIRESTORE_MESSAGES: Record<string, string> = {
  "permission-denied":
    "Could not complete this action. If you are checking out, try again in a private/incognito window without signing in to a seller account.",
  "not-found": "The requested data was not found.",
  "unavailable": "Service temporarily unavailable. Try again.",
};

const STORAGE_MESSAGES: Record<string, string> = {
  "storage/unauthorized":
    "Image upload denied. Sign in again, then run npm run firebase:deploy:storage and npm run firebase:deploy:storage-cors if this persists.",
  "storage/canceled": "Image upload was canceled.",
  "storage/retry-limit-exceeded": "Image upload failed after several retries. Try again.",
  "storage/unknown": "Image upload failed. Check your connection and Storage CORS configuration.",
};

export function getFirebaseErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof ProfileIncompleteError) {
    return error.message;
  }
  if (error instanceof FirebaseError) {
    return (
      AUTH_MESSAGES[error.code] ??
      FIRESTORE_MESSAGES[error.code] ??
      STORAGE_MESSAGES[error.code] ??
      error.message ??
      fallback
    );
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
