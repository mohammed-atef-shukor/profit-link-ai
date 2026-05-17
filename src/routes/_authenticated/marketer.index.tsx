import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Megaphone,
  Link2,
  DollarSign,
  MousePointerClick,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { subscribeMyReferralLinks, type ReferralLink } from "@/lib/referrals.firestore";
import { useFirestoreSubscription } from "@/hooks/use-firestore-subscription";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

export const Route = createFileRoute("/_authenticated/marketer/")({
  head: () => ({ meta: [{ title: "Marketer dashboard — LinkProfit AI" }] }),
  component: MarketerOverview,
});

function MarketerOverview() {
  const { user } = useFirebaseAuth();
  const links = useFirestoreSubscription<ReferralLink[]>(
    (n, e) => subscribeMyReferralLinks(n, e),
    [user?.uid],
  );
  const all = links.data ?? [];

  const totals = useMemo(() => ({
    clicks: all.reduce((s, l) => s + (l.clicks || 0), 0),
    sales: all.reduce((s, l) => s + (l.sales || 0), 0),
    commissions: all.reduce((s, l) => s + (l.commissions || 0), 0),
    campaigns: all.length,
  }), [all]);

  const conversion = totals.clicks > 0 ? (totals.sales / totals.clicks) * 100 : 0;
  const top = [...all].sort((a, b) => b.commissions - a.commissions).slice(0, 5);

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Marketer overview</div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Promote & earn</h1>
          <p className="mt-1 text-sm text-muted-foreground">Live performance from Firebase.</p>
        </div>
        <Link to="/marketer/marketplace" className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant">
          Browse marketplace <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Clicks" value={String(totals.clicks)} icon={<MousePointerClick className="size-4" />} />
        <Stat label="Sales" value={String(totals.sales)} icon={<Link2 className="size-4" />} />
        <Stat label="Commissions" value={`$${totals.commissions.toFixed(2)}`} icon={<DollarSign className="size-4" />} />
        <Stat label="Active links" value={String(totals.campaigns)} icon={<Megaphone className="size-4" />} />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-soft flex items-center gap-4">
        <span className="grid place-items-center size-10 rounded-xl bg-accent text-accent-foreground">
          <TrendingUp className="size-5" />
        </span>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conversion rate</div>
          <div className="font-display text-2xl font-bold">{conversion.toFixed(2)}%</div>
        </div>
      </div>

      <section className="mt-10 rounded-2xl border border-border bg-surface shadow-soft p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-display text-lg font-semibold">Top performing links</h2>
          <Link to="/marketer/links" className="text-xs font-semibold text-primary inline-flex items-center gap-1">
            View all <ArrowRight className="size-3" />
          </Link>
        </div>
        {links.isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>
        ) : top.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No links yet — generate one from the marketplace.</p>
            <Link to="/marketer/marketplace" className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Browse marketplace
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {top.map((l) => (
              <li key={l.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{l.product_title}</div>
                  <div className="text-xs text-muted-foreground">{l.commission_percent}% · {l.clicks} clicks · {l.sales} sales</div>
                </div>
                <div className="text-sm font-semibold text-primary tabular-nums">${l.commissions.toFixed(2)}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="grid place-items-center size-8 rounded-lg bg-accent text-accent-foreground">{icon}</span>
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}
