import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/client";

export type AppRole = "seller" | "marketer" | "admin";

export type UserProfile = {
  uid: string;
  email: string | null;
  display_name: string | null;
  role: AppRole | null;
  // Seller fields
  store_name?: string | null;
  store_tagline?: string | null;
  logo_url?: string | null;
  // Payout
  payout_email?: string | null;
  payout_method?: "paypal" | "bank" | null;
  payout_details?: string | null;
  created_at?: Timestamp | null;
  updated_at?: Timestamp | null;
};

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<UserProfile, "uid">) };
}

export async function getUserProfilesByIds(uids: string[]): Promise<Map<string, UserProfile>> {
  const unique = Array.from(new Set(uids.filter(Boolean)));
  const results = await Promise.all(unique.map((uid) => getUserProfile(uid).catch(() => null)));
  const map = new Map<string, UserProfile>();
  results.forEach((p, i) => {
    if (p) map.set(unique[i], p);
  });
  return map;
}

export type ProfilePatch = Partial<
  Pick<
    UserProfile,
    | "display_name"
    | "store_name"
    | "store_tagline"
    | "logo_url"
    | "payout_email"
    | "payout_method"
    | "payout_details"
  >
>;

export async function updateUserProfile(patch: ProfilePatch): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: auth.currentUser?.email ?? null,
      role: null,
      ...patch,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return;
  }
  await updateDoc(ref, { ...patch, updated_at: serverTimestamp() });
}

export function displayNameFor(p: UserProfile | null | undefined, fallbackUid: string): string {
  return p?.display_name || p?.store_name || p?.email || `${fallbackUid.slice(0, 8)}…`;
}
