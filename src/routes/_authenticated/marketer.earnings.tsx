import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { DollarSign, Wallet, Clock } from "lucide-react";
import { listSalesForMarketer } from "@/lib/sales.firestore";

export const Route = createFileRoute("/_authenticated/marketer/earnings")({
  head: () => ({ meta: [{ title: "Earnings — Marketer — LinkProfit AI" }] }),
  component: MarketerEarnings,
});

function MarketerEarnings() {
  const sales = useQuery({ queryKey: ["marketer-sales"], queryFn: listSalesForMarketer });
  const data = sales.data ?? [];

  const totals = useMemo(() => {
    const earned = data.reduce((s, x) => s + Number(x.commission_amount), 0);
    return { earned, pending: earned, paid: 0 };
  }, [data]);

  const months = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of data) {
      const d = s.created_at?.toDate?.();
      if (!d) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + Number(s.commission_amount));
    }
    const entries = Array.from(map.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
    const max = Math.max(1, ...entries.map(([, v]) => v));
    return { entries, max };
  }, [data]);

  return (
    <main>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Marketer</div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Earnings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Commissions you've earned across all links.</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Total earned" value={`$${totals.earned.toFixed(2)}`} icon={<DollarSign className="size-4" />} highlight />
        <Stat label="Pending payout" value={`$${totals.pending.toFixed(2)}`} icon={<Clock className="size-4" />} />
        <Stat label="Paid out" value={`$${totals.paid.toFixed(2)}`} icon={<Wallet className="size-4" />} />
      </div>

      <section className="mt-10 rounded-2xl border border-border bg-surface shadow-soft p-6">
        <h2 className="font-display text-lg font-semibold">Monthly commissions</h2>
        {months.entries.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No commissions yet.</p>
        ) : (
          <div className="mt-6 flex items-end gap-3 h-48">
            {months.entries.map(([label, value]) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                <div className="text-xs font-semibold tabular-nums">${value.toFixed(0)}</div>
                <div className="w-full rounded-t-lg bg-gradient-primary" style={{ height: `${(value / months.max) * 100}%`, minHeight: 4 }} />
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
