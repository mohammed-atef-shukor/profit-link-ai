// Backward-compatible re-exports — prefer `@/firebase` for new code.
export {
  auth,
  db,
  googleProvider,
  getFirebaseApp,
  getFirebaseAuth,
  getDb,
  fetchUserRole,
  getUserRole,
  fetchCurrentRole,
} from "@/firebase";

import { getFirebaseApp } from "@/firebase/config";

/** Lazy init — do not call at module load (SSR-safe). */
export function getFirebaseAppInstance() {
  return getFirebaseApp();
}
