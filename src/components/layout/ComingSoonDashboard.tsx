import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function ComingSoonDashboard({
  role, icon, stats, next,
}: {
  role: string;
  icon: ReactNode;
  stats: { label: string; value: string; icon: ReactNode }[];
  next: string[];
}) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-center gap-3">
        <span className="grid place-items-center size-10 rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
          {icon}
        </span>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">{role} workspace</div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back 👋</h1>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</span>
              <span className="grid place-items-center size-8 rounded-lg bg-accent text-accent-foreground">{s.icon}</span>
            </div>
            <div className="mt-3 font-display text-3xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-8 shadow-soft">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="size-3.5" /> Phase 2 coming soon
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold">Your full {role.toLowerCase()} dashboard is on the way.</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-prose">
            We've shipped your account, role and authenticated workspace. Next we'll wire up products, referral tracking, orders, payouts and the AI assistant — all powered by Lovable Cloud.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-gradient-soft p-6 shadow-soft">
          <h3 className="font-display text-lg font-semibold">Next steps</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {next.map((n, i) => (
              <li key={n} className="flex items-start gap-2">
                <span className="mt-0.5 grid place-items-center size-5 rounded-full bg-gradient-primary text-primary-foreground text-[10px] font-bold">
                  {i + 1}
                </span>
                {n}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
