import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/client";
import type { AppRole } from "@/hooks/use-firebase-auth";

function waitForUser(): Promise<string | null> {
  return new Promise((resolve) => {
    if (auth.currentUser) return resolve(auth.currentUser.uid);
    const unsub = onAuthStateChanged(auth, (u) => {
      unsub();
      resolve(u?.uid ?? null);
    });
  });
}

export async function fetchCurrentRole(): Promise<AppRole | null> {
  const uid = await waitForUser();
  if (!uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const r = snap.data()?.role;
  return r === "seller" || r === "marketer" || r === "admin" ? r : null;
}
