import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MousePointerClick, ShoppingBag, DollarSign, Users, Link2 } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatCardSkeleton } from "@/components/dashboard/StatCardSkeleton";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";
import { DataTablePagination } from "@/components/dashboard/DataTablePagination";
import { fetchSalesForProductPage, fetchLinksForProductPage } from "@/lib/sales.firestore";
import { getProduct } from "@/lib/products.firestore";
import { getProductAnalyticsTotals } from "@/lib/aggregates.firestore";
import { getUserProfilesByIds, displayNameFor } from "@/lib/users.firestore";
import { useFirestorePagination } from "@/hooks/use-firestore-pagination";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

export const Route = createFileRoute("/_authenticated/seller/products/$productId/analytics")({
  head: () => ({ meta: [{ title: "Product analytics — LinkProfit AI" }] }),
  component: ProductAnalytics,
});

function ProductAnalytics() {
  const { productId } = Route.useParams();
  const { user, authReady } = useFirebaseAuth();

  const product = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId),
    enabled: authReady && !!user,
  });

  const fetchLinksPage = useCallback(
    (pageSize: number, cursor: Parameters<typeof fetchLinksForProductPage>[2]) =>
      fetchLinksForProductPage(productId, pageSize, cursor),
    [productId],
  );

  const fetchSalesPage = useCallback(
    (pageSize: number, cursor: Parameters<typeof fetchSalesForProductPage>[2]) =>
      fetchSalesForProductPage(productId, pageSize, cursor),
    [productId],
  );

  const linksPagination = useFirestorePagination(fetchLinksPage, [productId, user?.uid], {
    enabled: authReady && !!user,
  });

  const salesPagination = useFirestorePagination(fetchSalesPage, [productId, user?.uid], {
    enabled: authReady && !!user,
  });

  const totalsQ = useQuery({
    queryKey: ["product-analytics-totals", productId, user?.uid],
    queryFn: () => getProductAnalyticsTotals(productId),
    enabled: authReady && !!user,
  });

  const ids = useMemo(
    () => linksPagination.items.map((l) => l.marketer_id),
    [linksPagination.items],
  );
  const profiles = useQuery({
    queryKey: ["user-profiles", ids.sort().join(",")],
    queryFn: () => getUserProfilesByIds(ids),
    enabled: ids.length > 0,
  });

  const totals = totalsQ.data ?? { clicks: 0, sales: 0, revenue: 0, marketers: 0 };

  const pageError =
    product.error || totalsQ.error || linksPagination.error || salesPagination.error || profiles.error;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <Link to="/seller/products" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to products
      </Link>

      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Analytics</div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {product.data?.title ?? "Product"}
        </h1>
      </div>

      {product.isLoading || totalsQ.isLoading ? (
        <div className="mt-8">
          <StatCardSkeleton count={4} />
        </div>
      ) : (
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Clicks" value={String(totals.clicks)} icon={<MousePointerClick className="size-4" />} />
        <Stat label="Sales" value={String(totals.sales)} icon={<ShoppingBag className="size-4" />} />
        <Stat label="Revenue" value={`$${totals.revenue.toFixed(2)}`} icon={<DollarSign className="size-4" />} />
        <Stat label="Active marketers" value={String(totals.marketers)} icon={<Users className="size-4" />} />
      </div>
      )}

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <Panel title="Top marketers">
          {linksPagination.isLoading && linksPagination.items.length === 0 ? (
            <TableSkeleton rows={4} />
          ) : linksPagination.error ? (
            <Empty>Failed to load marketers. Please try again.</Empty>
          ) : linksPagination.items.length === 0 ? (
            <EmptyState
              icon={Link2}
              title="No marketers promoting this product yet"
              description="Increase the commission rate or share your storefront so marketers generate referral links for this offer."
              action={{ label: "Edit product", to: `/seller/products/${productId}` }}
            />
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left py-2 font-semibold">Marketer</th>
                    <th className="text-right py-2 font-semibold">Clicks</th>
                    <th className="text-right py-2 font-semibold">Sales</th>
                    <th className="text-right py-2 font-semibold">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {linksPagination.items.map((l) => (
                    <tr key={l.id} className="border-t border-border">
                      <td className="py-3">{displayNameFor(profiles.data?.get(l.marketer_id) ?? null, l.marketer_id)}</td>
                      <td className="py-3 text-right">{l.clicks}</td>
                      <td className="py-3 text-right">{l.sales}</td>
                      <td className="py-3 text-right font-semibold text-primary">${(l.commissions || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <DataTablePagination
                page={linksPagination.page}
                rangeStart={linksPagination.rangeStart}
                rangeEnd={linksPagination.rangeEnd}
                hasPrev={linksPagination.hasPrev}
                hasNext={linksPagination.hasNext}
                isLoading={linksPagination.isLoading}
                onPrev={linksPagination.prevPage}
                onNext={linksPagination.nextPage}
                className="px-0"
              />
            </>
          )}
        </Panel>

        <Panel title="Recent sales">
          {salesPagination.isLoading && salesPagination.items.length === 0 ? (
            <TableSkeleton rows={4} />
          ) : salesPagination.error ? (
            <Empty>Failed to load sales. Please try again.</Empty>
          ) : salesPagination.items.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No sales for this product yet"
              description="Once customers purchase through marketer referrals or direct checkout, sales for this product will show here."
              action={{ label: "View all sales", to: "/seller/sales" }}
            />
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left py-2 font-semibold">Buyer</th>
                    <th className="text-right py-2 font-semibold">Price</th>
                    <th className="text-right py-2 font-semibold">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {salesPagination.items.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="py-3">
                        <div className="font-medium">{s.buyer_name}</div>
                        <div className="text-xs text-muted-foreground">{s.buyer_email}</div>
                      </td>
                      <td className="py-3 text-right">${Number(s.price).toFixed(2)}</td>
                      <td className="py-3 text-right text-primary font-semibold">${Number(s.commission_amount ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <DataTablePagination
                page={salesPagination.page}
                rangeStart={salesPagination.rangeStart}
                rangeEnd={salesPagination.rangeEnd}
                hasPrev={salesPagination.hasPrev}
                hasNext={salesPagination.hasNext}
                isLoading={salesPagination.isLoading}
                onPrev={salesPagination.prevPage}
                onNext={salesPagination.nextPage}
                className="px-0"
              />
            </>
          )}
        </Panel>
      </section>
      {pageError ? (
        <p className="mt-4 text-sm text-destructive">Some analytics data failed to load.</p>
      ) : null}
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft overflow-hidden">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-8 text-center text-sm text-muted-foreground">{children}</div>;
}
