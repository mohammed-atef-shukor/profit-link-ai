import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isAuthReady, roleHomePath } from "@/lib/auth-guard";

/** Client-side guard: marketers only. Guests → /login, other roles → home dashboard. */
export function MarketerRouteGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { currentUser, loading, role, roleLoading } = useAuth();
  const ready = isAuthReady(loading, roleLoading, currentUser);

  useEffect(() => {
    if (!ready) return;

    if (!currentUser) {
      void navigate({ to: "/login", replace: true });
      return;
    }

    if (role === null) {
      void navigate({ to: "/dashboard", replace: true });
      return;
    }

    if (role !== "marketer") {
      void navigate({ to: roleHomePath(role), replace: true });
    }
  }, [currentUser, loading, role, roleLoading, ready, navigate]);

  if (!ready || !currentUser || role !== "marketer") {
    return (
      <div
        className="min-h-screen grid place-items-center bg-background text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-5 animate-spin" aria-hidden />
        <span className="sr-only">Checking access…</span>
      </div>
    );
  }

  return <>{children}</>;
}
