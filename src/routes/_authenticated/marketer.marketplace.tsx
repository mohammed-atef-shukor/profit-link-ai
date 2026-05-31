import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, Search, Copy, Check, Percent, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import {
  listMyReferralLinks,
  createReferralLink,
  buildShareUrl,
  type ReferralLink,
} from "@/lib/referrals.firestore";
import { fetchPublishedProductsPage, type Product } from "@/lib/products.firestore";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { markMarketerMarketplaceVisited } from "@/lib/users.firestore";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ProductGridSkeleton } from "@/components/dashboard/ProductGridSkeleton";
import { DataTablePagination } from "@/components/dashboard/DataTablePagination";
import { useFirestorePagination } from "@/hooks/use-firestore-pagination";
import { MARKETPLACE_PAGE_SIZE } from "@/lib/firestore-pagination";

export const Route = createFileRoute("/_authenticated/marketer/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace — Marketer — LinkProfit AI" }] }),
  component: MarketerMarketplace,
});

function MarketerMarketplace() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { user, authReady } = useFirebaseAuth();

  useEffect(() => {
    if (!authReady || !user) return;
    void markMarketerMarketplaceVisited().catch(() => {});
  }, [authReady, user?.uid]);

  const fetchPage = useCallback(
    (pageSize: number, cursor: Parameters<typeof fetchPublishedProductsPage>[1]) =>
      fetchPublishedProductsPage(pageSize, cursor, "newest"),
    [],
  );

  const pagination = useFirestorePagination(fetchPage, [user?.uid], {
    pageSize: MARKETPLACE_PAGE_SIZE,
    enabled: authReady && !!user,
  });

  const links = useQuery({
    queryKey: ["my-referral-links", user?.uid],
    queryFn: listMyReferralLinks,
    enabled: authReady,
  });

  const create = useMutation({
    mutationFn: (p: Product) => createReferralLink(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-referral-links"] });
      toast.success("Referral link ready");
    },
    onError: (e) => toast.error(getFirebaseErrorMessage(e, "Failed to create link")),
  });

  const linkByProduct = useMemo(() => {
    const m = new Map<string, ReferralLink>();
    (links.data ?? []).forEach((l) => m.set(l.product_id, l));
    return m;
  }, [links.data]);

  const filtered = useMemo(() => {
    const list = pagination.items;
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter(
      (p) => p.title.toLowerCase().includes(s) || (p.description ?? "").toLowerCase().includes(s),
    );
  }, [pagination.items, search]);

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Marketer</div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="mt-1 text-sm text-muted-foreground">Browse products and generate a referral link.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-8">
        {pagination.isLoading && pagination.items.length === 0 ? (
          <ProductGridSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface shadow-soft">
            <EmptyState
              icon={Package}
              title={search ? "No matching products" : "Marketplace is warming up"}
              description={
                search
                  ? "Try another keyword or clear your search to browse all offers."
                  : "New seller products are added regularly. Check back soon for high-commission offers."
              }
              action={
                search
                  ? { label: "Clear search", to: "/marketer/marketplace", onClick: () => setSearch("") }
                  : undefined
              }
            />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => {
                const existing = linkByProduct.get(p.id);
                return (
                  <article key={p.id} className="group rounded-2xl border border-border bg-surface shadow-soft overflow-hidden flex flex-col">
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
                      <div>
                        <h3 className="font-display text-lg font-semibold leading-tight">{p.title}</h3>
                        {p.description && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                        )}
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="text-lg font-bold">${Number(p.price).toFixed(2)}</div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                          <Percent className="size-3" />{Number(p.commission_percent)}% commission
                        </span>
                      </div>
                      {existing ? (
                        <CopyUrl url={buildShareUrl(existing.code)} />
                      ) : (
                        <Button onClick={() => create.mutate(p)} disabled={create.isPending} className="gap-2 w-full">
                          <Link2 className="size-4" /> Generate referral link
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            {!search.trim() && (
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
            )}
          </>
        )}
      </div>
    </main>
  );
}

function CopyUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy");
    }
  };
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 truncate rounded-md bg-muted px-2 py-1.5 text-xs">{url}</code>
      <Button size="sm" variant="outline" onClick={onCopy} className="gap-1.5">
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
