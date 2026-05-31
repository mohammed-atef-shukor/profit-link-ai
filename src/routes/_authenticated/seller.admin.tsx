import { createFileRoute, Navigate } from "@tanstack/react-router";

import { useCallback } from "react";

import { useQuery } from "@tanstack/react-query";

import { DollarSign, ShoppingBag, TrendingUp, Users } from "lucide-react";

import { fetchPlatformEarningsPage } from "@/lib/platform.firestore";

import { getPlatformEarningsTotal, getPlatformSalesStats } from "@/lib/aggregates.firestore";

import { useFirestorePagination } from "@/hooks/use-firestore-pagination";

import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

import { StatCardSkeleton } from "@/components/dashboard/StatCardSkeleton";

import { TableSkeleton } from "@/components/dashboard/TableSkeleton";

import { DataTablePagination } from "@/components/dashboard/DataTablePagination";



export const Route = createFileRoute("/_authenticated/seller/admin")({

  head: () => ({ meta: [{ title: "Admin — LinkProfit AI" }] }),

  component: AdminDashboard,

});



function AdminDashboard() {

  const { authReady, role } = useFirebaseAuth();



  const statsQ = useQuery({

    queryKey: ["platform-admin-stats"],

    queryFn: async () => {

      const [platformTotal, salesStats] = await Promise.all([

        getPlatformEarningsTotal(),

        getPlatformSalesStats(),

      ]);

      return { platformTotal, salesStats };

    },

    enabled: authReady && role === "admin",

  });



  const fetchPage = useCallback(

    (pageSize: number, cursor: Parameters<typeof fetchPlatformEarningsPage>[1]) =>

      fetchPlatformEarningsPage(pageSize, cursor),

    [],

  );



  const pagination = useFirestorePagination(fetchPage, [], {

    enabled: authReady && role === "admin",

  });



  if (role !== "admin") {

    return <Navigate to="/seller" replace />;

  }



  const salesStats = statsQ.data?.salesStats;



  return (

    <main>

      <div>

        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Admin</div>

        <h1 className="font-display text-3xl font-bold tracking-tight">Platform overview</h1>

        <p className="mt-1 text-sm text-muted-foreground">Internal metrics for platform operations.</p>

      </div>



      {statsQ.isLoading ? (

        <div className="mt-8">

          <StatCardSkeleton count={4} />

        </div>

      ) : (

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <Stat label="Platform earnings" value={`$${(statsQ.data?.platformTotal ?? 0).toFixed(2)}`} icon={<DollarSign className="size-4" />} />

          <Stat label="Referral sales" value={String(salesStats?.referralSales ?? 0)} icon={<Users className="size-4" />} />

          <Stat label="Direct sales" value={String(salesStats?.directSales ?? 0)} icon={<ShoppingBag className="size-4" />} />

          <Stat label="Marketer commissions" value={`$${(salesStats?.marketerCommissions ?? 0).toFixed(2)}`} icon={<TrendingUp className="size-4" />} />

        </div>

      )}



      <section className="mt-10 rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">

        <div className="p-6 pb-0">

          <h2 className="font-display text-lg font-semibold">Platform earnings</h2>

        </div>

        {pagination.isLoading && pagination.items.length === 0 ? (

          <div className="p-6">

            <TableSkeleton rows={5} />

          </div>

        ) : pagination.items.length === 0 ? (

          <p className="px-6 pb-6 mt-4 text-sm text-muted-foreground">No direct platform commissions recorded yet.</p>

        ) : (

          <>

            <ul className="px-6 divide-y divide-border">

              {pagination.items.map((row) => (

                <li key={row.id} className="py-3 flex items-center justify-between gap-3 text-sm">

                  <span className="text-muted-foreground truncate">Sale {row.sale_id.slice(0, 8)}…</span>

                  <span className="font-semibold tabular-nums">${row.commission_amount.toFixed(2)}</span>

                </li>

              ))}

            </ul>

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

