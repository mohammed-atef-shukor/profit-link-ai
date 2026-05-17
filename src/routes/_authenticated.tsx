import { createFileRoute, Outlet, Link, useRouter, useNavigate } from "@tanstack/react-router";
import { Sparkles, LogOut, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { auth } from "@/integrations/firebase/client";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const router = useRouter();
  const navigate = useNavigate();
  const { user, loading } = useFirebaseAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  const handleSignOut = async () => {
    await signOut(auth);
    toast.success("Signed out");
    router.invalidate();
    router.navigate({ to: "/" });
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/70 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid place-items-center size-8 rounded-xl bg-gradient-primary shadow-elegant">
              <Sparkles className="size-4 text-primary-foreground" />
            </span>
            <span className="font-display text-lg font-bold">
              LinkProfit <span className="text-gradient-primary">AI</span>
            </span>
          </Link>
          <button
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
