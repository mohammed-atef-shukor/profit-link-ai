import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAuth, type AppRole } from "@/hooks/useAuth";

type ProtectedRouteProps = {
  children: ReactNode;
  /** If set, only these roles may view the content. */
  allowedRoles?: AppRole[];
  /** Shown when authenticated but role is not allowed. */
  forbiddenFallback?: ReactNode;
};

/**
 * Client-side route guard wrapper.
 * TanStack layouts use `beforeLoad` + this component for loading UX.
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  forbiddenFallback,
}: ProtectedRouteProps) {
  const { currentUser, loading, role, roleLoading } = useAuth();

  if (loading || roleLoading) {
    return (
      <div className="min-h-[40vh] grid place-items-center text-muted-foreground" role="status">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        <span className="sr-only">Checking access…</span>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return (
      forbiddenFallback ?? (
        <div className="min-h-[40vh] grid place-items-center px-6 text-center text-sm text-muted-foreground">
          You don&apos;t have access to this page.
        </div>
      )
    );
  }

  return <>{children}</>;
}
