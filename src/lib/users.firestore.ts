import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { auth, db } from "@/firebase";

import type { AppRole } from "@/firebase/auth";

export type { AppRole };

export type UserProfile = {
  uid: string;
  email: string | null;
  display_name: string | null;
  role: AppRole | null;
  // Seller fields
  store_name?: string | null;
  store_tagline?: string | null;
  logo_url?: string | null;
  logo_storage_path?: string | null;
  // Payout
  payout_email?: string | null;
  payout_method?: "paypal" | "bank" | null;
  payout_details?: string | null;
  seller_onboarding_dismissed?: boolean;
  marketer_onboarding_dismissed?: boolean;
  marketer_marketplace_visited?: boolean;
  created_at?: Timestamp | null;
  updated_at?: Timestamp | null;
};

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<UserProfile, "uid">) };
}

/** Public storefront fields only — safe to render for anonymous visitors. */
export type PublicSellerProfile = Pick<
  UserProfile,
  "uid" | "display_name" | "store_name" | "store_tagline" | "logo_url"
>;

export async function getPublicSellerProfile(uid: string): Promise<PublicSellerProfile | null> {
  const profile = await getUserProfile(uid);
  if (!profile || (profile.role !== "seller" && profile.role !== "admin")) return null;
  return {
    uid: profile.uid,
    display_name: profile.display_name,
    store_name: profile.store_name,
    store_tagline: profile.store_tagline,
    logo_url: profile.logo_url,
  };
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
    | "logo_storage_path"
    | "payout_email"
    | "payout_method"
    | "payout_details"
    | "seller_onboarding_dismissed"
    | "marketer_onboarding_dismissed"
    | "marketer_marketplace_visited"
  >
>;

export async function updateUserProfile(patch: ProfilePatch): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("User profile not found. Please sign out and register again.");
  }
  await updateDoc(ref, { ...patch, updated_at: serverTimestamp() });
}

export async function dismissSellerOnboarding(): Promise<void> {
  await updateUserProfile({ seller_onboarding_dismissed: true });
}

export async function dismissMarketerOnboarding(): Promise<void> {
  await updateUserProfile({ marketer_onboarding_dismissed: true });
}

export async function markMarketerMarketplaceVisited(): Promise<void> {
  await updateUserProfile({ marketer_marketplace_visited: true });
}

export function displayNameFor(p: UserProfile | null | undefined, fallbackUid: string): string {
  return p?.display_name || p?.store_name || p?.email || `${fallbackUid.slice(0, 8)}…`;
}
