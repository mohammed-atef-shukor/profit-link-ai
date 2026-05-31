import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getFirebaseApp } from "./config";
import { getDb } from "./firestore";

export type AppRole = "seller" | "marketer" | "admin";
export type SignupRole = "seller" | "marketer";

export class ProfileIncompleteError extends Error {
  constructor() {
    super("Your account profile is incomplete. Please register again or contact support.");
    this.name = "ProfileIncompleteError";
  }
}

let _auth: Auth | undefined;

export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(getFirebaseApp());
  return _auth;
}

/** @deprecated Use getFirebaseAuth() — kept for backward-compatible imports. */
export const auth = new Proxy({} as Auth, {
  get(_target, prop, receiver) {
    return Reflect.get(getFirebaseAuth(), prop, receiver);
  },
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

/** Wait until Firebase Auth has resolved the initial session. */
export function waitForAuthReady(): Promise<void> {
  return getFirebaseAuth().authStateReady();
}

/** Subscribe to auth state — returns unsubscribe. Used by AuthProvider only. */
export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export async function fetchUserRole(uid: string): Promise<AppRole | null> {
  await waitForAuthReady();

  const authUser = getFirebaseAuth().currentUser;
  if (!authUser || authUser.uid !== uid) return null;

  // Ensure Firestore requests include a fresh auth token (avoids permission-denied races).
  try {
    await authUser.getIdToken();
  } catch {
    // Continue — getDoc may still succeed with cached credentials.
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const snap = await getDoc(doc(getDb(), "users", uid));
      if (!snap.exists()) return null;
      const r = snap.data()?.role;
      return r === "seller" || r === "marketer" || r === "admin" ? r : null;
    } catch (error) {
      if (attempt === 2) {
        console.error("[fetchUserRole] failed after retries:", error);
        return null;
      }
      await new Promise((r) => setTimeout(r, 80 * (attempt + 1)));
    }
  }

  return null;
}

/** @deprecated Use fetchUserRole — kept for existing imports. */
export const getUserRole = fetchUserRole;

async function rollbackAuthUser(user: User): Promise<void> {
  try {
    await deleteUser(user);
  } catch {
    // Best-effort cleanup when Firestore profile creation fails.
  }
}

export async function createUserDocument(
  uid: string,
  payload: { display_name: string; role: SignupRole; email: string | null },
): Promise<void> {
  const ref = doc(getDb(), "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const existing = snap.data();
    const existingRole = existing?.role;
    if (existingRole === "seller" || existingRole === "marketer" || existingRole === "admin") {
      return;
    }
    await updateDoc(ref, {
      display_name: payload.display_name,
      role: payload.role,
      email: payload.email ?? existing?.email ?? null,
      updated_at: serverTimestamp(),
    });
    return;
  }

  await setDoc(ref, {
    display_name: payload.display_name,
    email: payload.email ?? null,
    role: payload.role,
    created_at: serverTimestamp(),
  });
}

/** @deprecated Use createUserDocument */
export async function ensureUserDoc(
  uid: string,
  payload: { display_name: string; role: SignupRole; email: string | null },
): Promise<void> {
  return createUserDocument(uid, payload);
}

async function ensureProfileOrSignOut(uid: string): Promise<AppRole> {
  const role = await fetchUserRole(uid);
  if (role === null) {
    await signOut(getFirebaseAuth());
    throw new ProfileIncompleteError();
  }
  return role;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  await ensureProfileOrSignOut(cred.user.uid);
  return cred.user;
}

export async function signupWithEmail(params: {
  email: string;
  password: string;
  displayName: string;
  role: SignupRole;
}): Promise<User> {
  const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), params.email, params.password);

  try {
    await updateProfile(cred.user, { displayName: params.displayName });
    await createUserDocument(cred.user.uid, {
      display_name: params.displayName,
      role: params.role,
      email: cred.user.email,
    });
    return cred.user;
  } catch (error) {
    await rollbackAuthUser(cred.user);
    throw error;
  }
}

export async function loginWithGoogle(role?: SignupRole): Promise<User> {
  const cred = await signInWithPopup(getFirebaseAuth(), googleProvider);
  const ref = doc(getDb(), "users", cred.user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    if (!role) {
      await signOut(getFirebaseAuth());
      throw new Error("No account found. Please register and choose seller or marketer.");
    }
    try {
      await createUserDocument(cred.user.uid, {
        display_name: cred.user.displayName ?? cred.user.email?.split("@")[0] ?? "User",
        role,
        email: cred.user.email,
      });
    } catch (error) {
      await rollbackAuthUser(cred.user);
      throw error;
    }
  }

  await ensureProfileOrSignOut(cred.user.uid);
  return cred.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(getFirebaseAuth());
}

export async function sendPasswordReset(email: string): Promise<void> {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  await sendPasswordResetEmail(getFirebaseAuth(), email, {
    url: `${origin}/login`,
  });
}

export async function fetchCurrentRole(): Promise<AppRole | null> {
  await waitForAuthReady();
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) return null;
  return fetchUserRole(uid);
}
