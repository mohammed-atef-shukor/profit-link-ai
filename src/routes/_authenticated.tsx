import { createFileRoute, redirect, Outlet, Link, useRouter } from "@tanstack/react-router";
import { Sparkles, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } as never });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.invalidate();
    router.navigate({ to: "/" });
  };

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
            onClick={signOut}
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
