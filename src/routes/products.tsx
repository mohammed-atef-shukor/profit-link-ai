import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package, Percent, ArrowRight, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MarketerRouteGuard } from "@/components/auth/MarketerRouteGuard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ProductGridSkeleton } from "@/components/dashboard/ProductGridSkeleton";
import { DataTablePagination } from "@/components/dashboard/DataTablePagination";
import { requireMarketer } from "@/lib/auth-guard";
import { fetchPublishedProductsPage, type PublishedProductSort } from "@/lib/products.firestore";
import { useFirestorePagination } from "@/hooks/use-firestore-pagination";
import { MARKETPLACE_PAGE_SIZE } from "@/lib/firestore-pagination";

type Sort = PublishedProductSort;

export const Route = createFileRoute("/products")({
  beforeLoad: async () => {
    await requireMarketer();
  },
  head: () => ({
    meta: [
      { title: "Marketplace — LinkProfit AI" },
      { name: "description", content: "Browse published products available to promote and earn commissions on." },
      { property: "og:title", content: "Marketplace — LinkProfit AI" },
      { property: "og:description", content: "Browse published products available to promote and earn commissions on." },
    ],
  }),
  component: PublicMarketplace,
});

function PublicMarketplace() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("newest");

  const fetchPage = useCallback(
    (pageSize: number, cursor: Parameters<typeof fetchPublishedProductsPage>[1]) =>
      fetchPublishedProductsPage(pageSize, cursor, sort),
    [sort],
  );

  const pagination = useFirestorePagination(fetchPage, [sort], {
    pageSize: MARKETPLACE_PAGE_SIZE,
  });

  const list = useMemo(() => {
    let l = pagination.items;
    if (search.trim()) {
      const s = search.toLowerCase();
      l = l.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          (p.description ?? "").toLowerCase().includes(s),
      );
    }
    return l;
  }, [pagination.items, search]);

  return (
    <MarketerRouteGuard>
      <div className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <main className="pt-32 pb-20">
        <section className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 backdrop-blur px-3 py-1 text-xs font-medium shadow-soft">
              <Sparkles className="size-3.5 text-primary" /> Marketplace
            </span>
            <h1 className="mt-5 font-display text-4xl sm:text-5xl font-bold tracking-tight">
              Discover products to <span className="text-gradient-primary">promote</span>
            </h1>
            <p className="mt-4 text-muted-foreground">
              Real offers from real sellers. Generate a referral link and earn on every sale.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Sort:</span>
              {(["newest", "commission", "price"] as Sort[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    sort === s
                      ? "bg-gradient-primary text-primary-foreground shadow-elegant"
                      : "border border-border bg-surface hover:bg-muted"
                  }`}
                >
                  {s === "newest" ? "Newest" : s === "commission" ? "Top commission" : "Price"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            {pagination.isLoading && pagination.items.length === 0 ? (
              <ProductGridSkeleton count={6} />
            ) : list.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface shadow-soft">
                <EmptyState
                  icon={Package}
                  title={search ? "No products match your search" : "Marketplace is warming up"}
                  description={
                    search
                      ? "Try a different keyword or browse all available offers."
                      : "Sellers are adding high-commission products. Check back soon — new offers land daily."
                  }
                  action={
                    search
                      ? { label: "Clear search", to: "/products", onClick: () => setSearch("") }
                      : { label: "Go to dashboard", to: "/marketer" }
                  }
                />
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((p) => (
                    <Link
                      key={p.id}
                      to="/products/$productId"
                      params={{ productId: p.id }}
                      className="group rounded-2xl border border-border bg-surface shadow-soft overflow-hidden flex flex-col hover:shadow-elegant hover:-translate-y-0.5 transition-all"
                    >
                      <div className="aspect-[16/9] bg-muted overflow-hidden">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.title}
                            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="size-full grid place-items-center bg-gradient-primary text-primary-foreground">
                            <Package className="size-8 opacity-80" />
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex flex-col gap-3 flex-1">
                        <div>
                          <h3 className="font-display text-lg font-semibold leading-tight">{p.title}</h3>
                          {p.description && (
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                          )}
                        </div>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="text-lg font-bold">${Number(p.price).toFixed(2)}</div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                            <Percent className="size-3" />
                            {Number(p.commission_percent)}%
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-primary inline-flex items-center gap-1">
                          View details <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {!search.trim() && (
                  <div className="mt-8 rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
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
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
      </div>
    </MarketerRouteGuard>
  );
}
