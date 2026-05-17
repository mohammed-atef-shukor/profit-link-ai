import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MousePointerClick, ShoppingBag, DollarSign, Users } from "lucide-react";
import { listSalesForProduct, listLinksForProduct } from "@/lib/sales.firestore";
import { getProduct } from "@/lib/products.firestore";

export const Route = createFileRoute("/_authenticated/seller/products/$productId/analytics")({
  head: () => ({ meta: [{ title: "Product analytics — LinkProfit AI" }] }),
  component: ProductAnalytics,
});

function ProductAnalytics() {
  const { productId } = Route.useParams();
  const product = useQuery({ queryKey: ["product", productId], queryFn: () => getProduct(productId) });
  const sales = useQuery({ queryKey: ["sales-for", productId], queryFn: () => listSalesForProduct(productId) });
  const links = useQuery({ queryKey: ["links-for", productId], queryFn: () => listLinksForProduct(productId) });

  const totals = (() => {
    const ls = links.data ?? [];
    const ss = sales.data ?? [];
    return {
      clicks: ls.reduce((s, l) => s + (l.clicks || 0), 0),
      sales: ss.length,
      revenue: ss.reduce((s, x) => s + Number(x.price), 0),
      marketers: new Set(ls.map((l) => l.marketer_id)).size,
    };
  })();

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <Link to="/seller" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to products
      </Link>

      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Analytics</div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {product.data?.title ?? "Product"}
        </h1>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Clicks" value={String(totals.clicks)} icon={<MousePointerClick className="size-4" />} />
        <Stat label="Sales" value={String(totals.sales)} icon={<ShoppingBag className="size-4" />} />
        <Stat label="Revenue" value={`$${totals.revenue.toFixed(2)}`} icon={<DollarSign className="size-4" />} />
        <Stat label="Active marketers" value={String(totals.marketers)} icon={<Users className="size-4" />} />
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <Panel title="Top marketers">
          {links.isLoading ? (
            <Empty>Loading…</Empty>
          ) : (links.data ?? []).length === 0 ? (
            <Empty>No referral links yet for this product.</Empty>
          ) : (
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
                {(links.data ?? []).map((l) => (
                  <tr key={l.id} className="border-t border-border">
                    <td className="py-3 font-mono text-xs">{l.marketer_id.slice(0, 10)}…</td>
                    <td className="py-3 text-right">{l.clicks}</td>
                    <td className="py-3 text-right">{l.sales}</td>
                    <td className="py-3 text-right font-semibold text-primary">${(l.commissions || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Recent sales">
          {sales.isLoading ? (
            <Empty>Loading…</Empty>
          ) : (sales.data ?? []).length === 0 ? (
            <Empty>No sales yet for this product.</Empty>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left py-2 font-semibold">Buyer</th>
                  <th className="text-right py-2 font-semibold">Price</th>
                  <th className="text-right py-2 font-semibold">Commission</th>
                </tr>
              </thead>
              <tbody>
                {(sales.data ?? []).slice(0, 20).map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="py-3">
                      <div className="font-medium">{s.buyer_name}</div>
                      <div className="text-xs text-muted-foreground">{s.buyer_email}</div>
                    </td>
                    <td className="py-3 text-right">${Number(s.price).toFixed(2)}</td>
                    <td className="py-3 text-right text-primary font-semibold">${s.commission_amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-8 text-center text-sm text-muted-foreground">{children}</div>;
}
