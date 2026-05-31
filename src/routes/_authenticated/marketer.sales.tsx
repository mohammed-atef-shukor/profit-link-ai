import { createFileRoute } from "@tanstack/react-router";

import { useCallback, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { ShoppingBag } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";

import { TableSkeleton } from "@/components/dashboard/TableSkeleton";

import { DataTablePagination } from "@/components/dashboard/DataTablePagination";

import { fetchSalesForMarketerPage } from "@/lib/sales.firestore";

import { useFirestorePagination } from "@/hooks/use-firestore-pagination";

import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

import { getUserProfilesByIds, displayNameFor } from "@/lib/users.firestore";



export const Route = createFileRoute("/_authenticated/marketer/sales")({

  head: () => ({ meta: [{ title: "Sales — Marketer — LinkProfit AI" }] }),

  component: MarketerSales,

});



function MarketerSales() {

  const { user, authReady } = useFirebaseAuth();



  const fetchPage = useCallback(

    (pageSize: number, cursor: Parameters<typeof fetchSalesForMarketerPage>[1]) =>

      fetchSalesForMarketerPage(pageSize, cursor),

    [],

  );



  const pagination = useFirestorePagination(fetchPage, [user?.uid], {

    enabled: authReady && !!user,

  });



  const rows = pagination.items;



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

        <p className="mt-1 text-sm text-muted-foreground">Conversions from your referral links.</p>

      </div>



      <div className="mt-8 rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">

        {pagination.isLoading && rows.length === 0 ? (

          <TableSkeleton rows={6} />

        ) : rows.length === 0 && !pagination.isLoading ? (

          <EmptyState

            icon={ShoppingBag}

            title="No conversions yet"

            description="Share your referral links on social, email, or your audience channels. Sales appear here instantly when customers checkout."

            action={{ label: "Get referral links", to: "/marketer/marketplace" }}

          />

        ) : (

          <>

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

                    <tr key={s.id} className="border-t border-border hover:bg-muted/30 transition-colors">

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

      </div>

    </main>

  );

}


