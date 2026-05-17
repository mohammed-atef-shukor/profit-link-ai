import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { subscribeSalesForMarketer } from "@/lib/sales.firestore";
import { useFirestoreSubscription } from "@/hooks/use-firestore-subscription";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { getUserProfilesByIds, displayNameFor } from "@/lib/users.firestore";

export const Route = createFileRoute("/_authenticated/marketer/sales")({
  head: () => ({ meta: [{ title: "Sales — Marketer — LinkProfit AI" }] }),
  component: MarketerSales,
});

function MarketerSales() {
  const { user } = useFirebaseAuth();
  const sales = useFirestoreSubscription(
    (n, e) => subscribeSalesForMarketer(n, e),
    [user?.uid],
  );
  const rows = sales.data ?? [];

  const ids = useMemo(() => Array.from(new Set(rows.map((r) => r.seller_id))), [rows]);
  const profiles = useQuery({
    queryKey: ["user-profiles", ids.sort().join(",")],
    queryFn: () => getUserProfilesByIds(ids),
    enabled: ids.length > 0,
  });

  return (
    <main>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Marketer</div>
        <h1 className="font-display text-3xl font-bold tracking-tight">My sales</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live conversions from your referral links.</p>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
        {sales.isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto grid place-items-center size-12 rounded-2xl bg-accent text-accent-foreground">
              <ShoppingBag className="size-5" />
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">No sales yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Share your links to start earning.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Product</th>
                <th className="text-left px-5 py-3 font-semibold">Seller</th>
                <th className="text-left px-5 py-3 font-semibold">Buyer</th>
                <th className="text-left px-5 py-3 font-semibold">Referral</th>
                <th className="text-right px-5 py-3 font-semibold">Price</th>
                <th className="text-right px-5 py-3 font-semibold">Commission</th>
                <th className="text-right px-5 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const p = profiles.data?.get(s.seller_id) ?? null;
                return (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-5 py-4 font-medium">{s.product_title}</td>
                    <td className="px-5 py-4">{displayNameFor(p, s.seller_id)}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium">{s.buyer_name}</div>
                      <div className="text-xs text-muted-foreground">{s.buyer_email}</div>
                    </td>
                    <td className="px-5 py-4"><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{s.referral_code}</code></td>
                    <td className="px-5 py-4 text-right">${Number(s.price).toFixed(2)}</td>
                    <td className="px-5 py-4 text-right text-primary font-semibold">+${Number(s.commission_amount).toFixed(2)}</td>
                    <td className="px-5 py-4 text-right text-xs text-muted-foreground">
                      {s.created_at?.toDate?.().toLocaleDateString() ?? "—"}
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
