import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { roleHomePath } from "@/lib/auth-guard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LinkProfit AI" }] }),
  component: DashboardRouter,
});

function DashboardRouter() {
  const navigate = useNavigate();
  const { currentUser, role, roleLoading, loading, logout } = useAuth();

  useEffect(() => {
    if (loading || roleLoading || !currentUser) return;
    if (role === null) return;
    navigate({ to: roleHomePath(role), replace: true });
  }, [role, roleLoading, loading, currentUser, navigate]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-muted-foreground" role="status">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        <span className="sr-only">Loading dashboard…</span>
      </div>
    );
  }

  if (role === null) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-xl font-semibold">Account setup incomplete</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your Firebase account exists but your profile is missing a role. Choose seller or marketer below,
            or sign out and contact support.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Complete registration
            </Link>
            <button
              type="button"
              onClick={() => void logout().then(() => navigate({ to: "/login" }))}
              className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] grid place-items-center text-muted-foreground" role="status">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="sr-only">Redirecting to your workspace…</span>
    </div>
  );
}
