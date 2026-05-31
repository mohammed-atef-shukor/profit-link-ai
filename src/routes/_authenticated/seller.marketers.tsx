import { createFileRoute } from "@tanstack/react-router";

import { useCallback, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { Users } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";

import { TableSkeleton } from "@/components/dashboard/TableSkeleton";

import { DataTablePagination } from "@/components/dashboard/DataTablePagination";

import { fetchReferralLinksForSellerPage } from "@/lib/referrals.firestore";

import { useFirestorePagination } from "@/hooks/use-firestore-pagination";

import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

import { getUserProfilesByIds, displayNameFor } from "@/lib/users.firestore";



export const Route = createFileRoute("/_authenticated/seller/marketers")({

  head: () => ({ meta: [{ title: "Marketers — Seller — LinkProfit AI" }] }),

  component: SellerMarketers,

});



type Agg = {

  marketer_id: string;

  clicks: number;

  sales: number;

  revenue: number;

  commissions: number;

  last: Date | null;

};



function SellerMarketers() {

  const { user, authReady } = useFirebaseAuth();



  const fetchPage = useCallback(

    (pageSize: number, cursor: Parameters<typeof fetchReferralLinksForSellerPage>[2]) => {

      if (!user?.uid) throw new Error("Not signed in");

      return fetchReferralLinksForSellerPage(user.uid, pageSize, cursor);

    },

    [user?.uid],

  );



  const pagination = useFirestorePagination(fetchPage, [user?.uid], {

    enabled: authReady && !!user,

  });



  const rows = useMemo(() => {

    const map = new Map<string, Agg>();

    for (const l of pagination.items) {

      if (!l.marketer_id) continue;

      const a = map.get(l.marketer_id) ?? {

        marketer_id: l.marketer_id,

        clicks: 0,

        sales: 0,

        revenue: 0,

        commissions: 0,

        last: null,

      };

      a.clicks += l.clicks;

      a.sales += l.sales;

      a.commissions += l.commissions;

      a.revenue += l.sales * l.product_price;

      const linkDate = l.created_at?.toDate?.() ?? null;

      if (linkDate && (!a.last || linkDate > a.last)) a.last = linkDate;

      map.set(l.marketer_id, a);

    }

    return Array.from(map.values()).sort((a, b) => {

      if (b.commissions !== a.commissions) return b.commissions - a.commissions;

      return b.clicks - a.clicks;

    });

  }, [pagination.items]);



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

        <p className="mt-1 text-sm text-muted-foreground">Promoters driving traffic and sales to your products.</p>

      </div>



      <div className="mt-8 rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">

        {pagination.isLoading && pagination.items.length === 0 ? (

          <TableSkeleton rows={6} />

        ) : pagination.error ? (

          <div className="p-12 text-center text-sm text-destructive">

            Could not load marketer activity. {pagination.error.message}

          </div>

        ) : rows.length === 0 && !pagination.isLoading ? (

          <EmptyState

            icon={Users}

            title="No marketers promoting your products yet"

            description="Create attractive products with strong commissions to attract marketers. Once they generate referral links, they'll appear here."

            action={{ label: "Create product", to: "/seller/products/new" }}

          />

        ) : (

          <>

            <table className="w-full text-sm">

              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">

                <tr>

                  <th className="text-left px-5 py-3 font-semibold">Marketer</th>

                  <th className="text-right px-5 py-3 font-semibold">Clicks</th>

                  <th className="text-right px-5 py-3 font-semibold">Sales</th>

                  <th className="text-right px-5 py-3 font-semibold">Revenue</th>

                  <th className="text-right px-5 py-3 font-semibold">Commissions</th>

                  <th className="text-right px-5 py-3 font-semibold">Last activity</th>

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

                      <td className="px-5 py-4 text-right font-medium">{r.clicks}</td>

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


