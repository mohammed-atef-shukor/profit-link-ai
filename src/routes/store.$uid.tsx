import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, ArrowLeft, Percent, Store } from "lucide-react";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ProductGridSkeleton } from "@/components/dashboard/ProductGridSkeleton";
import { DataTablePagination } from "@/components/dashboard/DataTablePagination";
import { getPublicSellerProfile } from "@/lib/users.firestore";
import { fetchPublishedProductsBySellerPage } from "@/lib/products.firestore";
import { useFirestorePagination } from "@/hooks/use-firestore-pagination";
import { MARKETPLACE_PAGE_SIZE } from "@/lib/firestore-pagination";

export const Route = createFileRoute("/store/$uid")({
  head: () => ({ meta: [{ title: "Store — LinkProfit AI" }] }),
  component: StorePage,
});

function StorePage() {
  const { uid } = Route.useParams();

  const profileQ = useQuery({
    queryKey: ["store-profile", uid],
    queryFn: () => getPublicSellerProfile(uid),
  });

  const fetchPage = useCallback(
    (pageSize: number, cursor: Parameters<typeof fetchPublishedProductsBySellerPage>[2]) =>
      fetchPublishedProductsBySellerPage(uid, pageSize, cursor),
    [uid],
  );

  const pagination = useFirestorePagination(fetchPage, [uid], {
    pageSize: MARKETPLACE_PAGE_SIZE,
    enabled: !!profileQ.data,
  });

  const profile = profileQ.data;
  const name = profile?.store_name || profile?.display_name || "Store";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="pt-32 pb-20">
        <div className="mx-auto max-w-6xl px-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Home
          </Link>

          {profileQ.isLoading ? (
            <div className="mt-10">
              <div className="flex items-center gap-5">
                <div className="size-20 rounded-2xl bg-muted animate-pulse shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="mt-10">
                <ProductGridSkeleton count={3} />
              </div>
            </div>
          ) : !profile ? (
            <div className="mt-10 rounded-2xl border border-border bg-surface shadow-soft">
              <EmptyState
                icon={Store}
                title="Store not found"
                description="This seller doesn't exist or hasn't set up a public storefront yet."
                action={{ label: "Back to home", to: "/" }}
              />
            </div>
          ) : (
            <>
              <header className="mt-8 flex items-center gap-5">
                <div className="size-20 rounded-2xl overflow-hidden border border-border bg-muted shrink-0 grid place-items-center">
                  {profile.logo_url ? (
                    <img src={profile.logo_url} alt={name} className="size-full object-cover" />
                  ) : (
                    <span className="font-display text-3xl font-bold text-muted-foreground">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary">Storefront</div>
                  <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight truncate">{name}</h1>
                  {profile.store_tagline && (
                    <p className="mt-1 text-sm text-muted-foreground">{profile.store_tagline}</p>
                  )}
                </div>
              </header>

              <section className="mt-10">
                <h2 className="font-display text-xl font-semibold">Products</h2>
                {pagination.isLoading && pagination.items.length === 0 ? (
                  <div className="mt-4">
                    <ProductGridSkeleton count={3} />
                  </div>
                ) : pagination.items.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-border bg-surface shadow-soft">
                    <EmptyState
                      icon={Package}
                      title="No published products yet"
                      description={`${name} hasn't published any products. Check back soon for new offers.`}
                    />
                  </div>
                ) : (
                  <>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {pagination.items.map((p) => (
                        <Link
                          key={p.id}
                          to="/products/$productId/checkout"
                          params={{ productId: p.id }}
                          className="group rounded-2xl border border-border bg-surface shadow-soft overflow-hidden flex flex-col hover:border-primary/50 transition-colors"
                        >
                          <div className="aspect-[16/9] bg-muted overflow-hidden">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.title} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                              <div className="size-full grid place-items-center bg-gradient-primary text-primary-foreground">
                                <Package className="size-8 opacity-80" />
                              </div>
                            )}
                          </div>
                          <div className="p-5 flex flex-col gap-3 flex-1">
                            <h3 className="font-display text-lg font-semibold leading-tight">{p.title}</h3>
                            {p.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                            )}
                            <div className="mt-auto flex items-center justify-between">
                              <div className="text-lg font-bold">${Number(p.price).toFixed(2)}</div>
                              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                                <Percent className="size-3" />{Number(p.commission_percent)}%
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-6 rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
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
                    </div>
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
