import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { DollarSign, TrendingUp, Wallet } from "lucide-react";
import { subscribeSalesForSeller, type Sale } from "@/lib/sales.firestore";
import { useFirestoreSubscription } from "@/hooks/use-firestore-subscription";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

export const Route = createFileRoute("/_authenticated/seller/earnings")({
  head: () => ({ meta: [{ title: "Earnings — Seller — LinkProfit AI" }] }),
  component: SellerEarnings,
});

function SellerEarnings() {
  const { user } = useFirebaseAuth();
  const sales = useFirestoreSubscription<Sale[]>(
    (n, e) => subscribeSalesForSeller(n, e),
    [user?.uid],
  );
  const data = sales.data ?? [];

  const totals = useMemo(() => {
    const revenue = data.reduce((s, x) => s + Number(x.price), 0);
    const commissions = data.reduce((s, x) => s + Number(x.commission_amount), 0);
    return { revenue, commissions, net: revenue - commissions };
  }, [data]);

  const months = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of data) {
      const d = s.created_at?.toDate?.();
      if (!d) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + (Number(s.price) - Number(s.commission_amount)));
    }
    const entries = Array.from(map.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
    const max = Math.max(1, ...entries.map(([, v]) => v));
    return { entries, max };
  }, [data]);

  return (
    <main>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Seller</div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Earnings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Revenue minus marketer commissions. Live.</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Gross revenue" value={`$${totals.revenue.toFixed(2)}`} icon={<DollarSign className="size-4" />} />
        <Stat label="Commissions owed" value={`$${totals.commissions.toFixed(2)}`} icon={<TrendingUp className="size-4" />} />
        <Stat label="Net earnings" value={`$${totals.net.toFixed(2)}`} icon={<Wallet className="size-4" />} highlight />
      </div>

      <section className="mt-10 rounded-2xl border border-border bg-surface shadow-soft p-6">
        <h2 className="font-display text-lg font-semibold">Monthly net</h2>
        {months.entries.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No revenue yet.</p>
        ) : (
          <div className="mt-6 flex items-end gap-3 h-48">
            {months.entries.map(([label, value]) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                <div className="text-xs font-semibold tabular-nums">${value.toFixed(0)}</div>
                <div
                  className="w-full rounded-t-lg bg-gradient-primary"
                  style={{ height: `${(value / months.max) * 100}%`, minHeight: 4 }}
                />
                <div className="text-[10px] text-muted-foreground truncate w-full text-center">{label}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value, icon, highlight }: { label: string; value: string; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-soft ${highlight ? "border-primary/40 bg-gradient-primary text-primary-foreground" : "border-border bg-surface"}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wider ${highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</span>
        <span className={`grid place-items-center size-8 rounded-lg ${highlight ? "bg-white/15" : "bg-accent text-accent-foreground"}`}>{icon}</span>
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}
