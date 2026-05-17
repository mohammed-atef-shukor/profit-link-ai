import { Link, useRouterState } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

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
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 lg:py-10 grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-border bg-surface shadow-soft p-3">
          <div className="px-3 pb-3 pt-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Workspace
            </div>
            <div className="font-display text-sm font-bold">{title}</div>
          </div>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {items.map((it) => {
              const active = isActive(it.to, it.exact);
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                    active
                      ? "bg-gradient-primary text-primary-foreground shadow-elegant"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
