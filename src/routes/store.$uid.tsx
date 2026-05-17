import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, ArrowLeft, Percent } from "lucide-react";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getUserProfile } from "@/lib/users.firestore";
import { getDocs, query, collection, where, orderBy } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import type { Product } from "@/lib/products.firestore";

export const Route = createFileRoute("/store/$uid")({
  head: () => ({ meta: [{ title: "Store — LinkProfit AI" }] }),
  component: StorePage,
});

async function fetchStore(uid: string) {
  const profile = await getUserProfile(uid);
  const snap = await getDocs(
    query(
      collection(db, "products"),
      where("seller_id", "==", uid),
      where("status", "==", "published"),
      orderBy("created_at", "desc"),
    ),
  );
  const products: Product[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) }));
  return { profile, products };
}

function StorePage() {
  const { uid } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["store", uid],
    queryFn: () => fetchStore(uid),
  });

  const profile = data?.profile;
  const products = data?.products ?? [];
  const name = profile?.store_name || profile?.display_name || "Store";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="pt-32 pb-20">
        <div className="mx-auto max-w-6xl px-6">
          <Link to="/products" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Marketplace
          </Link>

          {isLoading ? (
            <div className="mt-10 rounded-2xl border border-border bg-surface p-12 text-center text-sm text-muted-foreground">
              Loading store…
            </div>
          ) : !profile ? (
            <div className="mt-10 rounded-2xl border border-border bg-surface p-12 text-center">
              <h2 className="font-display text-xl font-semibold">Store not found</h2>
              <p className="mt-2 text-sm text-muted-foreground">This seller doesn't exist or has no public profile.</p>
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
                {products.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted-foreground">
                    No published products yet.
                  </div>
                ) : (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {products.map((p) => (
                      <Link
                        key={p.id}
                        to="/products/$productId"
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
