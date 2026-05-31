import { useAuth, type AppRole, type SignupRole } from "@/context/AuthProvider";

export { useAuth, type AppRole, type SignupRole };

/** Backward-compatible alias — includes role state for dashboard subscriptions. */
export function useFirebaseAuth() {
  const { currentUser, loading, role, roleLoading } = useAuth();
  const authReady = !!currentUser?.uid && !loading && !roleLoading;
  return {
    user: currentUser,
    loading,
    role,
    roleLoading,
    authReady,
  };
}

export { fetchUserRole as getUserRole, fetchUserRole } from "@/firebase/auth";
