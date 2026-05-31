import { createFileRoute } from "@tanstack/react-router";

import { useCallback, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { DollarSign, TrendingUp, Wallet, BarChart3 } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";

import { TableSkeleton } from "@/components/dashboard/TableSkeleton";

import { DataTablePagination } from "@/components/dashboard/DataTablePagination";

import { StatCardSkeleton } from "@/components/dashboard/StatCardSkeleton";

import { fetchSalesForSellerPage } from "@/lib/sales.firestore";

import { getSellerSalesTotals } from "@/lib/aggregates.firestore";

import { useFirestorePagination } from "@/hooks/use-firestore-pagination";

import { useFirebaseAuth } from "@/hooks/use-firebase-auth";



export const Route = createFileRoute("/_authenticated/seller/earnings")({

  head: () => ({ meta: [{ title: "Earnings — Seller — LinkProfit AI" }] }),

  component: SellerEarnings,

});



function SellerEarnings() {

  const { user, authReady } = useFirebaseAuth();



  const totalsQ = useQuery({

    queryKey: ["seller-sales-totals", user?.uid],

    queryFn: () => getSellerSalesTotals(),

    enabled: authReady && !!user,

  });



  const fetchPage = useCallback(

    (pageSize: number, cursor: Parameters<typeof fetchSalesForSellerPage>[1]) =>

      fetchSalesForSellerPage(pageSize, cursor),

    [],

  );



  const pagination = useFirestorePagination(fetchPage, [user?.uid], {

    enabled: authReady && !!user,

  });



  const months = useMemo(() => {

    const map = new Map<string, number>();

    for (const s of pagination.items) {

      const d = s.created_at?.toDate?.();

      if (!d) continue;

      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      map.set(key, (map.get(key) ?? 0) + (Number(s.price) - Number(s.commission_amount)));

    }

    const entries = Array.from(map.entries()).sort(([a], [b]) => (a < b ? -1 : 1));

    const max = Math.max(1, ...entries.map(([, v]) => v));

    return { entries, max };

  }, [pagination.items]);



  const totals = totalsQ.data;



  return (

    <main>

      <div>

        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Seller</div>

        <h1 className="font-display text-3xl font-bold tracking-tight">Earnings</h1>

        <p className="mt-1 text-sm text-muted-foreground">

          Revenue minus commissions from real Firestore sales.

        </p>

      </div>



      {totalsQ.isLoading ? (

        <div className="mt-8">

          <StatCardSkeleton count={4} />

        </div>

      ) : (

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <Stat label="Gross revenue" value={`$${(totals?.revenue ?? 0).toFixed(2)}`} icon={<DollarSign className="size-4" />} />

          <Stat label="Marketer commissions" value={`$${(totals?.marketerCommissions ?? 0).toFixed(2)}`} icon={<TrendingUp className="size-4" />} />

          <Stat label="Platform fees" value={`$${(totals?.platformFees ?? 0).toFixed(2)}`} icon={<TrendingUp className="size-4" />} />

          <Stat label="Net earnings" value={`$${(totals?.net ?? 0).toFixed(2)}`} icon={<Wallet className="size-4" />} highlight />

        </div>

      )}



      <section className="mt-10 rounded-2xl border border-border bg-surface shadow-soft p-6">

        <h2 className="font-display text-lg font-semibold">Monthly net (current page)</h2>

        {months.entries.length === 0 && !pagination.isLoading ? (

          <EmptyState

            icon={BarChart3}

            title="No earnings history yet"

            description="Your net revenue chart fills in as sales come through marketer referrals and direct checkouts."

            action={{ label: "View sales", to: "/seller/sales" }}

          />

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



      <section className="mt-10 rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">

        <h2 className="font-display text-lg font-semibold px-6 pt-6">Sales history</h2>

        {pagination.isLoading && pagination.items.length === 0 ? (

          <TableSkeleton rows={5} />

        ) : pagination.items.length === 0 ? (

          <div className="p-6 text-sm text-muted-foreground">No sales on this page.</div>

        ) : (

          <>

            <table className="w-full text-sm mt-4">

              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">

                <tr>

                  <th className="text-left px-5 py-3 font-semibold">Product</th>

                  <th className="text-right px-5 py-3 font-semibold">Gross</th>

                  <th className="text-right px-5 py-3 font-semibold">Net</th>

                  <th className="text-right px-5 py-3 font-semibold">Date</th>

                </tr>

              </thead>

              <tbody>

                {pagination.items.map((s) => (

                  <tr key={s.id} className="border-t border-border">

                    <td className="px-5 py-3 font-medium">{s.product_title}</td>

                    <td className="px-5 py-3 text-right">${Number(s.price).toFixed(2)}</td>

                    <td className="px-5 py-3 text-right font-semibold text-primary">

                      ${(Number(s.price) - Number(s.commission_amount)).toFixed(2)}

                    </td>

                    <td className="px-5 py-3 text-right text-xs text-muted-foreground">

                      {s.created_at?.toDate?.().toLocaleDateString() ?? "—"}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

            <DataTablePagination

              page={pagination.page}

              rangeStart={pagination.rangeStart}

              rangeEnd={pagination.rangeEnd}

              hasPrev={pagination.hasPrev}

              hasNext={pagination.hasNext}

              isLoading={pagination.isLoading}

              onPrev={pagination.prevPage}

              onNext={pagination.nextPage}

            />

          </>

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


