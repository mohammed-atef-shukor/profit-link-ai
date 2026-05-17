import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Package, Pencil, Trash2, Eye, EyeOff, DollarSign, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  listMyProducts,
  deleteProduct,
  setProductStatus,
  type ProductStatus,
} from "@/lib/products.firestore";

export const Route = createFileRoute("/_authenticated/seller/")({
  head: () => ({ meta: [{ title: "Seller dashboard — LinkProfit AI" }] }),
  component: SellerDashboard,
});

function SellerDashboard() {
  const router = useRouter();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-products"],
    queryFn: listMyProducts,
  });

  const products = data ?? [];
  const published = products.filter((p) => p.status === "published").length;
  const totalValue = products.reduce((s, p) => s + Number(p.price), 0);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    try {
      await deleteProduct(id);
      toast.success("Product deleted");
      refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete");
    }
  };

  const handleToggle = async (id: string, current: ProductStatus) => {
    const next: ProductStatus = current === "published" ? "draft" : "published";
    try {
      await setProductStatus(id, next);
      toast.success(next === "published" ? "Published" : "Unpublished");
      refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update");
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Seller workspace</div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Your products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create offers and set marketer commissions.</p>
        </div>
        <Button onClick={() => router.navigate({ to: "/seller/products/new" })} className="gap-2">
          <Plus className="size-4" /> New product
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total products" value={String(products.length)} icon={<Package className="size-4" />} />
        <StatCard label="Published" value={String(published)} icon={<Eye className="size-4" />} />
        <StatCard label="Catalog value" value={`$${totalValue.toFixed(2)}`} icon={<DollarSign className="size-4" />} />
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Loading…</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto grid place-items-center size-12 rounded-2xl bg-gradient-primary text-primary-foreground shadow-elegant">
              <Package className="size-5" />
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">No products yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Add your first offer to start recruiting marketers.</p>
            <Button onClick={() => router.navigate({ to: "/seller/products/new" })} className="mt-5 gap-2">
              <Plus className="size-4" /> Create product
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Product</th>
                <th className="text-right px-5 py-3 font-semibold">Price</th>
                <th className="text-right px-5 py-3 font-semibold">Commission</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-5 py-4">
                    <div className="font-medium">{p.title}</div>
                    {p.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-md">{p.description}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right font-medium">${Number(p.price).toFixed(2)}</td>
                  <td className="px-5 py-4 text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                      <Percent className="size-3" />{Number(p.commission_percent)}%
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      p.status === "published"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      <span className={`size-1.5 rounded-full ${p.status === "published" ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleToggle(p.id, p.status)} title={p.status === "published" ? "Unpublish" : "Publish"}>
                        {p.status === "published" ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </Button>
                      <Link to="/seller/products/$productId" params={{ productId: p.id }}>
                        <Button size="sm" variant="ghost"><Pencil className="size-4" /></Button>
                      </Link>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
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
