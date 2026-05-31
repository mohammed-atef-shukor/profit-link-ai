import { createFileRoute } from "@tanstack/react-router";

import { useCallback, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { DollarSign, Wallet, Clock, TrendingUp } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";

import { StatCardSkeleton } from "@/components/dashboard/StatCardSkeleton";

import { TableSkeleton } from "@/components/dashboard/TableSkeleton";

import { DataTablePagination } from "@/components/dashboard/DataTablePagination";

import { fetchMarketerCommissionsPage } from "@/lib/platform.firestore";

import { getMarketerCommissionTotals } from "@/lib/aggregates.firestore";

import { useFirestorePagination } from "@/hooks/use-firestore-pagination";

import { useFirebaseAuth } from "@/hooks/use-firebase-auth";



export const Route = createFileRoute("/_authenticated/marketer/earnings")({

  head: () => ({ meta: [{ title: "Earnings — Marketer — LinkProfit AI" }] }),

  component: MarketerEarnings,

});



function MarketerEarnings() {

  const { user, authReady } = useFirebaseAuth();



  const totalsQ = useQuery({

    queryKey: ["marketer-commission-totals", user?.uid],

    queryFn: () => getMarketerCommissionTotals(),

    enabled: authReady && !!user,

  });



  const fetchPage = useCallback(

    (pageSize: number, cursor: Parameters<typeof fetchMarketerCommissionsPage>[2]) => {

      if (!user?.uid) throw new Error("Not signed in");

      return fetchMarketerCommissionsPage(user.uid, pageSize, cursor);

    },

    [user?.uid],

  );



  const pagination = useFirestorePagination(fetchPage, [user?.uid], {

    enabled: authReady && !!user,

  });



  const months = useMemo(() => {

    const map = new Map<string, number>();

    for (const c of pagination.items) {

      const d = c.created_at?.toDate?.();

      if (!d) continue;

      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      map.set(key, (map.get(key) ?? 0) + Number(c.amount));

    }

    const entries = Array.from(map.entries()).sort(([a], [b]) => (a < b ? -1 : 1));

    const max = Math.max(1, ...entries.map(([, v]) => v));

    return { entries, max };

  }, [pagination.items]);



  const totals = totalsQ.data;



  return (

    <main>

      <div>

        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Marketer</div>

        <h1 className="font-display text-3xl font-bold tracking-tight">Earnings</h1>

        <p className="mt-1 text-sm text-muted-foreground">Commissions from Firestore commission records.</p>

      </div>



      {totalsQ.isLoading ? (

        <div className="mt-8">

          <StatCardSkeleton count={3} />

        </div>

      ) : (

        <div className="mt-8 grid gap-4 sm:grid-cols-3">

          <Stat label="Total earned" value={`$${(totals?.totalEarned ?? 0).toFixed(2)}`} icon={<DollarSign className="size-4" />} highlight />

          <Stat label="Pending payout" value={`$${(totals?.pending ?? 0).toFixed(2)}`} icon={<Clock className="size-4" />} />

          <Stat label="Paid out" value={`$${(totals?.paid ?? 0).toFixed(2)}`} icon={<Wallet className="size-4" />} />

        </div>

      )}



      <section className="mt-10 rounded-2xl border border-border bg-surface shadow-soft p-6">

        <h2 className="font-display text-lg font-semibold">Monthly commissions (current page)</h2>

        {months.entries.length === 0 && !pagination.isLoading ? (

          <EmptyState

            icon={TrendingUp}

            title="No commissions earned yet"

            description="Your earnings chart fills in as referral sales convert. Promote high-commission products to maximize payouts."

            action={{ label: "Browse marketplace", to: "/marketer/marketplace" }}

          />

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



      <section className="mt-10 rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">

        <h2 className="font-display text-lg font-semibold px-6 pt-6">Commission history</h2>

        {pagination.isLoading && pagination.items.length === 0 ? (

          <TableSkeleton rows={5} />

        ) : pagination.items.length === 0 && !pagination.isLoading ? (

          <div className="p-6 text-sm text-muted-foreground">No commission records yet.</div>

        ) : (

          <>

            <table className="w-full text-sm mt-4">

              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">

                <tr>

                  <th className="text-left px-5 py-3 font-semibold">Sale</th>

                  <th className="text-left px-5 py-3 font-semibold">Status</th>

                  <th className="text-right px-5 py-3 font-semibold">Amount</th>

                  <th className="text-right px-5 py-3 font-semibold">Date</th>

                </tr>

              </thead>

              <tbody>

                {pagination.items.map((c) => (

                  <tr key={c.id} className="border-t border-border">

                    <td className="px-5 py-3 font-mono text-xs">{c.sale_id.slice(0, 10)}…</td>

                    <td className="px-5 py-3 capitalize">{c.status}</td>

                    <td className="px-5 py-3 text-right font-semibold text-primary">+${c.amount.toFixed(2)}</td>

                    <td className="px-5 py-3 text-right text-xs text-muted-foreground">

                      {c.created_at?.toDate?.().toLocaleDateString() ?? "—"}

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


