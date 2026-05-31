import { Link, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import type { ComponentType } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export type DashboardNavItem = {
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
};

export function DashboardShell({
  title,
  items,
  children,
}: {
  title: string;
  items: DashboardNavItem[];
  children: React.ReactNode;
}) {
  const pathname = useRouterState({ select: (s: { location: { pathname: string } }) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const navLinks = (onNavigate?: () => void) =>
    items.map((it) => {
      const active = isActive(it.to, it.exact);
      const Icon = it.icon;
      return (
        <Link
          key={it.to}
          to={it.to}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            active
              ? "bg-gradient-primary text-primary-foreground shadow-elegant"
              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
          )}
        >
          <Icon className="size-4 shrink-0" />
          {it.label}
        </Link>
      );
    });

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] w-full">
      {/* Desktop sidebar — fixed column, full height */}
      <aside className="hidden lg:flex lg:w-[260px] lg:shrink-0 lg:flex-col border-r border-border bg-surface/50">
        <div className="sticky top-16 flex h-[calc(100dvh-4rem)] flex-col overflow-y-auto px-5 py-7">
          <div className="mb-8 px-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Workspace</p>
            <p className="mt-1 font-display text-base font-bold text-foreground">{title}</p>
          </div>
          <nav className="flex flex-col gap-1">{navLinks()}</nav>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile nav bar */}
        <div className="flex items-center gap-3 border-b border-border bg-surface/60 px-4 py-3 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open navigation menu"
                className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-muted"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(100vw-2rem,280px)] p-0">
              <SheetHeader className="border-b border-border px-5 py-4 text-left">
                <SheetTitle className="font-display text-left text-base">{title}</SheetTitle>
                <p className="text-xs text-muted-foreground">Navigation</p>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-4">{navLinks(() => setMobileOpen(false))}</nav>
            </SheetContent>
          </Sheet>
          <span className="font-display text-sm font-semibold">{title} dashboard</span>
        </div>

        {/* Page content — full available width with comfortable padding */}
        <div className="flex-1 w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10 xl:px-12">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Use on settings/forms for a professional readable width without feeling cramped. */
export const dashboardFormWidth = "w-full max-w-3xl xl:max-w-4xl";
