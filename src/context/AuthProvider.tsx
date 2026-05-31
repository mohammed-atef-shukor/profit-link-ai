import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import {
  fetchUserRole,
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  sendPasswordReset,
  signupWithEmail,
  subscribeToAuthState,
  type AppRole,
  type SignupRole,
} from "@/firebase/auth";

type AuthContextValue = {
  currentUser: User | null;
  loading: boolean;
  role: AppRole | null;
  roleLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (params: {
    email: string;
    password: string;
    displayName: string;
    role: SignupRole;
  }) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  googleLogin: (role?: SignupRole) => Promise<void>;
  refreshRole: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const activeUidRef = useRef<string | null>(null);

  const loadRole = useCallback(async (user: User | null) => {
    if (!user) {
      activeUidRef.current = null;
      setRole(null);
      setRoleLoading(false);
      return;
    }

    const uid = user.uid;
    activeUidRef.current = uid;
    setRoleLoading(true);

    try {
      const nextRole = await fetchUserRole(uid);
      if (activeUidRef.current !== uid) return;
      setRole(nextRole);
    } catch {
      if (activeUidRef.current === uid) setRole(null);
    } finally {
      if (activeUidRef.current === uid) setRoleLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = subscribeToAuthState((user) => {
      setCurrentUser(user);
      setLoading(false);
      if (user) {
        setRoleLoading(true);
      } else {
        setRole(null);
        setRoleLoading(false);
      }
      void loadRole(user);
    });
    return unsub;
  }, [loadRole]);

  const refreshRole = useCallback(async () => {
    await loadRole(currentUser);
  }, [currentUser, loadRole]);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      loading,
      role,
      roleLoading,
      login: async (email, password) => {
        const user = await loginWithEmail(email, password);
        await loadRole(user);
      },
      signup: async (params) => {
        const user = await signupWithEmail(params);
        await loadRole(user);
      },
      logout: async () => {
        await logoutUser();
      },
      resetPassword: async (email) => {
        await sendPasswordReset(email);
      },
      googleLogin: async (signupRole) => {
        const user = await loginWithGoogle(signupRole);
        await loadRole(user);
      },
      refreshRole,
    }),
    [currentUser, loading, role, roleLoading, refreshRole, loadRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

/** Safe hook for components that may render outside AuthProvider during SSR. */
export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext);
}

export type { AppRole, SignupRole };
