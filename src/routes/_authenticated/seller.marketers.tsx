import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { subscribeSalesForSeller, type Sale } from "@/lib/sales.firestore";
import { useFirestoreSubscription } from "@/hooks/use-firestore-subscription";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { getUserProfilesByIds, displayNameFor } from "@/lib/users.firestore";

export const Route = createFileRoute("/_authenticated/seller/marketers")({
  head: () => ({ meta: [{ title: "Marketers — Seller — LinkProfit AI" }] }),
  component: SellerMarketers,
});

type Agg = {
  marketer_id: string;
  sales: number;
  revenue: number;
  commissions: number;
  last: Date | null;
};

function SellerMarketers() {
  const { user } = useFirebaseAuth();
  const sales = useFirestoreSubscription<Sale[]>(
    (n, e) => subscribeSalesForSeller(n, e),
    [user?.uid],
  );

  const rows = useMemo(() => {
    const map = new Map<string, Agg>();
    for (const s of sales.data ?? []) {
      const a = map.get(s.marketer_id) ?? {
        marketer_id: s.marketer_id,
        sales: 0,
        revenue: 0,
        commissions: 0,
        last: null,
      };
      a.sales += 1;
      a.revenue += Number(s.price);
      a.commissions += Number(s.commission_amount);
      const d = s.created_at?.toDate?.() ?? null;
      if (d && (!a.last || d > a.last)) a.last = d;
      map.set(s.marketer_id, a);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [sales.data]);

  const ids = useMemo(() => rows.map((r) => r.marketer_id), [rows]);
  const profiles = useQuery({
    queryKey: ["user-profiles", ids.sort().join(",")],
    queryFn: () => getUserProfilesByIds(ids),
    enabled: ids.length > 0,
  });

  return (
    <main>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Seller</div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Marketers</h1>
        <p className="mt-1 text-sm text-muted-foreground">Top promoters driving sales to your products.</p>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
        {sales.isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto grid place-items-center size-12 rounded-2xl bg-accent text-accent-foreground">
              <Users className="size-5" />
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">No marketers yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Once marketers generate links and convert sales, they show up here.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Marketer</th>
                <th className="text-right px-5 py-3 font-semibold">Sales</th>
                <th className="text-right px-5 py-3 font-semibold">Revenue</th>
                <th className="text-right px-5 py-3 font-semibold">Commissions</th>
                <th className="text-right px-5 py-3 font-semibold">Last sale</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const p = profiles.data?.get(r.marketer_id) ?? null;
                return (
                  <tr key={r.marketer_id} className="border-t border-border">
                    <td className="px-5 py-4">
                      <div className="font-medium">{displayNameFor(p, r.marketer_id)}</div>
                      {p?.email && <div className="text-xs text-muted-foreground">{p.email}</div>}
                    </td>
                    <td className="px-5 py-4 text-right font-medium">{r.sales}</td>
                    <td className="px-5 py-4 text-right font-semibold">${r.revenue.toFixed(2)}</td>
                    <td className="px-5 py-4 text-right text-primary font-semibold">${r.commissions.toFixed(2)}</td>
                    <td className="px-5 py-4 text-right text-xs text-muted-foreground">
                      {r.last ? r.last.toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
