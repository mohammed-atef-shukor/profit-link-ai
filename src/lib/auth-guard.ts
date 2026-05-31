import { redirect, isRedirect } from "@tanstack/react-router";
import { waitForAuthReady, getFirebaseAuth, fetchUserRole, type AppRole } from "@/firebase/auth";

/** Client-side auth guard for TanStack Router `beforeLoad`. SSR is skipped. */
export async function requireAuth(): Promise<{ uid: string } | null> {
  if (typeof window === "undefined") return null;

  try {
    await waitForAuthReady();
    const user = getFirebaseAuth().currentUser;
    if (!user) {
      throw redirect({ to: "/login" });
    }
    return { uid: user.uid };
  } catch (error) {
    if (isRedirect(error)) throw error;
    console.error("[auth-guard] requireAuth failed:", error);
    throw redirect({ to: "/login" });
  }
}

/** Redirect authenticated users away from guest-only routes (login/register). */
export async function redirectIfAuthenticated(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    await waitForAuthReady();
    const user = getFirebaseAuth().currentUser;
    if (!user) return;

    const role = await fetchUserRole(user.uid);
    // Incomplete profiles must reach /register or /dashboard — not bounce to dashboard loop.
    if (role === null) return;

    throw redirect({ to: roleHomePath(role) });
  } catch (error) {
    if (isRedirect(error)) throw error;
    // Allow guest routes if auth check fails transiently.
  }
}

/** Require marketer role — guests → /login, sellers/admins → /seller. */
export async function requireMarketer(): Promise<{ uid: string } | null> {
  if (typeof window === "undefined") return null;

  try {
    await waitForAuthReady();
    const user = getFirebaseAuth().currentUser;
    if (!user) {
      throw redirect({ to: "/login" });
    }

    const role = await fetchUserRole(user.uid);
    if (role === null) {
      throw redirect({ to: "/dashboard" });
    }
    if (role !== "marketer") {
      throw redirect({ to: roleHomePath(role) });
    }
    return { uid: user.uid };
  } catch (error) {
    if (isRedirect(error)) throw error;
    console.error("[auth-guard] requireMarketer failed:", error);
    throw redirect({ to: "/login" });
  }
}

/** Require a specific role — prefer client layout guards; avoid in beforeLoad (Firestore race). */
export async function requireRole(allowed: AppRole[]): Promise<AppRole | null> {
  if (typeof window === "undefined") return null;

  try {
    await waitForAuthReady();
    const user = getFirebaseAuth().currentUser;
    if (!user) {
      throw redirect({ to: "/login" });
    }

    const role = await fetchUserRole(user.uid);
    if (role === null) {
      throw redirect({ to: "/dashboard" });
    }
    if (!allowed.includes(role)) {
      throw redirect({ to: roleHomePath(role) });
    }
    return role;
  } catch (error) {
    if (isRedirect(error)) throw error;
    console.error("[auth-guard] requireRole failed:", error);
    throw redirect({ to: "/dashboard" });
  }
}

export function roleHomePath(role: AppRole | null): "/seller" | "/marketer" | "/dashboard" {
  if (role === "seller" || role === "admin") return "/seller";
  if (role === "marketer") return "/marketer";
  return "/dashboard";
}

/** True when auth + role are ready for navigation decisions. */
export function isAuthReady(
  loading: boolean,
  roleLoading: boolean,
  currentUser: { uid: string } | null,
): boolean {
  return !loading && !roleLoading && !!currentUser;
}
