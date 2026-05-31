import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Sparkles, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

const links = [
  { label: "Features", href: "/#features" },
  { label: "Sellers", href: "/#sellers" },
  { label: "Marketers", href: "/#marketers" },
  { label: "AI Assistant", href: "/#ai" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useFirebaseAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "py-2" : "py-4"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 sm:px-6 py-3 transition-all",
            scrolled ? "glass shadow-glass" : "bg-transparent"
          )}
        >
          <Link to="/" className="flex items-center gap-2 group">
            <span className="grid place-items-center size-8 rounded-xl bg-gradient-primary shadow-elegant">
              <Sparkles className="size-4 text-primary-foreground" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              LinkProfit <span className="text-gradient-primary">AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-95 active:scale-[0.98] transition"
              >
                <LayoutDashboard className="size-4" /> Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-95 active:scale-[0.98] transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden grid place-items-center size-10 rounded-xl border border-border/60 bg-surface/70"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>

        {open && (
          <div className="md:hidden mt-2 rounded-2xl glass p-4 shadow-glass">
            <div className="flex flex-col gap-1">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60"
                >
                  {l.label}
                </a>
              ))}
              <div className="my-2 h-px bg-border" />
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-gradient-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="rounded-lg bg-gradient-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
