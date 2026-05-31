import { createFileRoute, Link, useRouter } from "@tanstack/react-router";

import { useCallback } from "react";

import { useQuery } from "@tanstack/react-query";

import { Plus, Package, Pencil, Trash2, Eye, EyeOff, DollarSign, Percent, BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { toast } from "sonner";

import {

  fetchMyProductsPage,

  deleteProduct,

  setProductStatus,

  type Product,

  type ProductStatus,

} from "@/lib/products.firestore";

import { getSellerProductCounts } from "@/lib/aggregates.firestore";

import { useFirestorePagination } from "@/hooks/use-firestore-pagination";

import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

import { getFirebaseErrorMessage } from "@/lib/firebase-errors";

import { EmptyState } from "@/components/dashboard/EmptyState";

import { TableSkeleton } from "@/components/dashboard/TableSkeleton";

import { DataTablePagination } from "@/components/dashboard/DataTablePagination";



export const Route = createFileRoute("/_authenticated/seller/products/")({

  head: () => ({ meta: [{ title: "Products — Seller — LinkProfit AI" }] }),

  component: SellerDashboard,

});



function SellerDashboard() {

  const router = useRouter();

  const { user, authReady } = useFirebaseAuth();



  const fetchPage = useCallback(

    (pageSize: number, cursor: Parameters<typeof fetchMyProductsPage>[1]) =>

      fetchMyProductsPage(pageSize, cursor),

    [],

  );



  const pagination = useFirestorePagination(fetchPage, [user?.uid], {

    enabled: authReady && !!user,

  });



  const countsQ = useQuery({

    queryKey: ["seller-product-counts", user?.uid],

    queryFn: () => getSellerProductCounts(),

    enabled: authReady && !!user,

  });



  const products = pagination.items;

  const catalogValue = products.reduce((s, p) => s + Number(p.price), 0);



  const handleDelete = async (id: string) => {

    if (!confirm("Delete this product? This cannot be undone.")) return;

    try {

      await deleteProduct(id);

      toast.success("Product deleted");

      pagination.reset();

      void countsQ.refetch();

    } catch (e) {

      toast.error(getFirebaseErrorMessage(e, "Failed to delete"));

    }

  };



  const handleToggle = async (id: string, current: ProductStatus) => {

    const next: ProductStatus = current === "published" ? "draft" : "published";

    try {

      await setProductStatus(id, next);

      toast.success(next === "published" ? "Published" : "Unpublished");

      pagination.reset();

      void countsQ.refetch();

    } catch (e) {

      toast.error(getFirebaseErrorMessage(e, "Failed to update"));

    }

  };



  return (

    <main>

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

        <StatCard label="Total products" value={String(countsQ.data?.total ?? "—")} icon={<Package className="size-4" />} />

        <StatCard label="Published" value={String(countsQ.data?.published ?? "—")} icon={<Eye className="size-4" />} />

        <StatCard

          label="Page catalog value"

          value={`$${catalogValue.toFixed(2)}`}

          icon={<DollarSign className="size-4" />}

        />

      </div>



      <div className="mt-8 rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">

        {pagination.isLoading && products.length === 0 ? (

          <TableSkeleton rows={5} />

        ) : pagination.error ? (

          <div className="p-12 text-center text-sm text-destructive">

            Could not load products. {pagination.error.message}

          </div>

        ) : products.length === 0 ? (

          <EmptyState

            icon={Package}

            title="No products in your catalog yet"

            description="Add your first offer with a competitive commission to recruit marketers and start generating sales."

            action={{ label: "Create product", to: "/seller/products/new" }}

          />

        ) : (

          <>

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

                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-md">

                        {p.category}

                        {p.description ? ` · ${p.description}` : ""}

                      </div>

                    </td>

                    <td className="px-5 py-4 text-right font-medium">${Number(p.price).toFixed(2)}</td>

                    <td className="px-5 py-4 text-right">

                      <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">

                        <Percent className="size-3" />{Number(p.commission_percent)}%

                      </span>

                    </td>

                    <td className="px-5 py-4">

                      <span

                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${

                          p.status === "published"

                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"

                            : "bg-muted text-muted-foreground"

                        }`}

                      >

                        <span

                          className={`size-1.5 rounded-full ${p.status === "published" ? "bg-emerald-500" : "bg-muted-foreground"}`}

                        />

                        {p.status}

                      </span>

                    </td>

                    <td className="px-5 py-4">

                      <div className="flex items-center justify-end gap-1">

                        <Button

                          size="sm"

                          variant="ghost"

                          onClick={() => handleToggle(p.id, p.status)}

                          title={p.status === "published" ? "Unpublish" : "Publish"}

                        >

                          {p.status === "published" ? <EyeOff className="size-4" /> : <Eye className="size-4" />}

                        </Button>

                        <Link to="/seller/products/$productId/analytics" params={{ productId: p.id }} title="Analytics">

                          <Button size="sm" variant="ghost">

                            <BarChart3 className="size-4" />

                          </Button>

                        </Link>

                        <Link to="/seller/products/$productId" params={{ productId: p.id }} title="Edit">

                          <Button size="sm" variant="ghost">

                            <Pencil className="size-4" />

                          </Button>

                        </Link>

                        <Button size="sm" variant="ghost" onClick={() => void handleDelete(p.id)} title="Delete">

                          <Trash2 className="size-4 text-destructive" />

                        </Button>

                      </div>

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


