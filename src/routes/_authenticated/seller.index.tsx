import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  ShoppingBag,
  DollarSign,
  MousePointerClick,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { listMyProducts } from "@/lib/products.firestore";
import { listSalesForSeller } from "@/lib/sales.firestore";

export const Route = createFileRoute("/_authenticated/seller/")({
  head: () => ({ meta: [{ title: "Seller dashboard — LinkProfit AI" }] }),
  component: SellerOverview,
});

function SellerOverview() {
  const products = useQuery({ queryKey: ["my-products"], queryFn: listMyProducts });
  const sales = useQuery({ queryKey: ["seller-sales"], queryFn: listSalesForSeller });

  const ps = products.data ?? [];
  const ss = sales.data ?? [];
  const published = ps.filter((p) => p.status === "published").length;
  const revenue = ss.reduce((s, x) => s + Number(x.price), 0);
  const commissions = ss.reduce((s, x) => s + Number(x.commission_amount), 0);
  const recent = ss.slice(0, 6);

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Seller overview</div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your store at a glance.</p>
        </div>
        <Link to="/seller/products/new">
          <Button className="gap-2"><Plus className="size-4" /> New product</Button>
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Products" value={String(ps.length)} sub={`${published} published`} icon={<Package className="size-4" />} />
        <Stat label="Sales" value={String(ss.length)} sub="all-time" icon={<ShoppingBag className="size-4" />} />
        <Stat label="Revenue" value={`$${revenue.toFixed(2)}`} sub="gross" icon={<DollarSign className="size-4" />} />
        <Stat label="Commissions" value={`$${commissions.toFixed(2)}`} sub="owed to marketers" icon={<TrendingUp className="size-4" />} />
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Recent sales"
          action={<Link to="/seller/sales" className="text-xs font-semibold text-primary inline-flex items-center gap-1">View all <ArrowRight className="size-3" /></Link>}
        >
          {sales.isLoading ? (
            <Empty>Loading…</Empty>
          ) : recent.length === 0 ? (
            <Empty>No sales yet.</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((s) => (
                <li key={s.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{s.product_title}</div>
                    <div className="text-xs text-muted-foreground truncate">{s.buyer_name} · {s.buyer_email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">${Number(s.price).toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">−${Number(s.commission_amount).toFixed(2)} commission</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Your products"
          action={<Link to="/seller/products" className="text-xs font-semibold text-primary inline-flex items-center gap-1">Manage <ArrowRight className="size-3" /></Link>}
        >
          {products.isLoading ? (
            <Empty>Loading…</Empty>
          ) : ps.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <MousePointerClick className="size-5 mx-auto mb-2 opacity-60" />
              Add your first product to get started.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {ps.slice(0, 6).map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.commission_percent}% commission</div>
                  </div>
                  <div className="text-sm font-semibold">${Number(p.price).toFixed(2)}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>
    </main>
  );
}

function Stat({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="grid place-items-center size-8 rounded-lg bg-accent text-accent-foreground">{icon}</span>
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-soft p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-6 text-center text-sm text-muted-foreground">{children}</div>;
}

// Avoid unused import warning if Users isn't referenced
void Users;
