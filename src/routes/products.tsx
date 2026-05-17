import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package, Percent, ArrowRight, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { listPublishedProducts } from "@/lib/referrals.firestore";

type Sort = "newest" | "commission" | "price";

export const Route = createFileRoute("/products")({
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
  const { data, isLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: listPublishedProducts,
  });

  const list = useMemo(() => {
    let l = data ?? [];
    if (search.trim()) {
      const s = search.toLowerCase();
      l = l.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          (p.description ?? "").toLowerCase().includes(s),
      );
    }
    const sorted = [...l];
    if (sort === "commission") sorted.sort((a, b) => b.commission_percent - a.commission_percent);
    else if (sort === "price") sorted.sort((a, b) => a.price - b.price);
    return sorted;
  }, [data, search, sort]);

  return (
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
            {isLoading ? (
              <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted-foreground">
                Loading marketplace…
              </div>
            ) : list.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface p-12 text-center">
                <div className="mx-auto grid place-items-center size-12 rounded-2xl bg-accent text-accent-foreground">
                  <Package className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">No products yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {search ? "No matches. Try another search." : "Check back soon — sellers are still onboarding."}
                </p>
              </div>
            ) : (
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
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
