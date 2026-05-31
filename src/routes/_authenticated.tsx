import { createFileRoute, Outlet, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { Sparkles, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { requireAuth } from "@/lib/auth-guard";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    await requireAuth();
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const { currentUser, loading, logout } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen grid place-items-center bg-background text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-5 animate-spin" aria-hidden />
        <span className="sr-only">Loading session…</span>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success("Signed out");
      await navigate({ to: "/" });
    } catch (e) {
      toast.error(getFirebaseErrorMessage(e, "Sign out failed"));
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid place-items-center size-8 rounded-xl bg-gradient-primary shadow-elegant">
              <Sparkles className="size-4 text-primary-foreground" />
            </span>
            <span className="font-display text-lg font-bold">
              LinkProfit <span className="text-gradient-primary">AI</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
