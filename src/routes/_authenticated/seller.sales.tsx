import { createFileRoute } from "@tanstack/react-router";

import { useCallback, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { ShoppingBag } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";

import { TableSkeleton } from "@/components/dashboard/TableSkeleton";

import { DataTablePagination } from "@/components/dashboard/DataTablePagination";

import { fetchSalesForSellerPage, saleSourceLabel, type Sale } from "@/lib/sales.firestore";

import { useFirestorePagination } from "@/hooks/use-firestore-pagination";

import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

import { getUserProfilesByIds, displayNameFor } from "@/lib/users.firestore";



export const Route = createFileRoute("/_authenticated/seller/sales")({

  head: () => ({ meta: [{ title: "Sales — Seller — LinkProfit AI" }] }),

  component: SellerSales,

});



function SellerSales() {

  const { user, authReady } = useFirebaseAuth();



  const fetchPage = useCallback(

    (pageSize: number, cursor: Parameters<typeof fetchSalesForSellerPage>[1]) =>

      fetchSalesForSellerPage(pageSize, cursor),

    [],

  );



  const pagination = useFirestorePagination(fetchPage, [user?.uid], {

    enabled: authReady && !!user,

  });



  const rows = pagination.items;



  const ids = useMemo(

    () => Array.from(new Set(rows.map((r) => r.marketer_id).filter(Boolean) as string[])),

    [rows],

  );

  const profiles = useQuery({

    queryKey: ["user-profiles", ids.sort().join(",")],

    queryFn: () => getUserProfilesByIds(ids),

    enabled: ids.length > 0,

  });



  return (

    <main>

      <div>

        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Seller</div>

        <h1 className="font-display text-3xl font-bold tracking-tight">All sales</h1>

        <p className="mt-1 text-sm text-muted-foreground">Paginated sales history from Firestore.</p>

      </div>



      <div className="mt-8 rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">

        {pagination.isLoading && rows.length === 0 ? (

          <TableSkeleton rows={6} />

        ) : rows.length === 0 && !pagination.isLoading ? (

          <EmptyState

            icon={ShoppingBag}

            title="No sales recorded yet"

            description="Sales from marketer referrals and direct platform purchases will appear here as soon as customers checkout."

            action={{ label: "Boost commissions", to: "/seller/products" }}

          />

        ) : (

          <>

            <table className="w-full text-sm">

              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">

                <tr>

                  <th className="text-left px-5 py-3 font-semibold">Product</th>

                  <th className="text-left px-5 py-3 font-semibold">Buyer</th>

                  <th className="text-left px-5 py-3 font-semibold">Source</th>

                  <th className="text-left px-5 py-3 font-semibold">Marketer</th>

                  <th className="text-left px-5 py-3 font-semibold">Referral</th>

                  <th className="text-right px-5 py-3 font-semibold">Price</th>

                  <th className="text-right px-5 py-3 font-semibold">Commission</th>

                  <th className="text-right px-5 py-3 font-semibold">Date</th>

                </tr>

              </thead>

              <tbody>

                {rows.map((s) => {

                  const p = s.marketer_id ? profiles.data?.get(s.marketer_id) ?? null : null;

                  const source = saleSourceLabel(s);

                  return (

                    <tr key={s.id} className="border-t border-border">

                      <td className="px-5 py-4 font-medium">{s.product_title}</td>

                      <td className="px-5 py-4">

                        <div className="font-medium">{s.buyer_name}</div>

                        <div className="text-xs text-muted-foreground">{s.buyer_email}</div>

                      </td>

                      <td className="px-5 py-4">

                        <span

                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${

                            s.commission_owner === "platform"

                              ? "bg-muted text-muted-foreground"

                              : "bg-primary/10 text-primary"

                          }`}

                        >

                          {source}

                        </span>

                      </td>

                      <td className="px-5 py-4">

                        {s.marketer_id ? (

                          <>

                            <div className="font-medium">{displayNameFor(p, s.marketer_id)}</div>

                            {p?.email && <div className="text-xs text-muted-foreground">{p.email}</div>}

                          </>

                        ) : (

                          <span className="text-muted-foreground">—</span>

                        )}

                      </td>

                      <td className="px-5 py-4">

                        {s.referral_code ? (

                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{s.referral_code}</code>

                        ) : (

                          <span className="text-muted-foreground">—</span>

                        )}

                      </td>

                      <td className="px-5 py-4 text-right font-semibold">${Number(s.price).toFixed(2)}</td>

                      <td className="px-5 py-4 text-right text-primary font-semibold">−${Number(s.commission_amount).toFixed(2)}</td>

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


