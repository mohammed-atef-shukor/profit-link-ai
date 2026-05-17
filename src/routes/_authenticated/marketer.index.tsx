import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Megaphone,
  Link2,
  DollarSign,
  MousePointerClick,
  Search,
  Copy,
  Check,
  Sparkles,
  Percent,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  listPublishedProducts,
  listMyReferralLinks,
  createReferralLink,
  buildShareUrl,
  type ReferralLink,
} from "@/lib/referrals.firestore";
import type { Product } from "@/lib/products.firestore";

export const Route = createFileRoute("/_authenticated/marketer/")({
  head: () => ({ meta: [{ title: "Marketer dashboard — LinkProfit AI" }] }),
  component: MarketerDashboard,
});

function MarketerDashboard() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const products = useQuery({ queryKey: ["published-products"], queryFn: listPublishedProducts });
  const links = useQuery({ queryKey: ["my-referral-links"], queryFn: listMyReferralLinks });

  const create = useMutation({
    mutationFn: (p: Product) => createReferralLink(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-referral-links"] });
      toast.success("Referral link ready");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to create link"),
  });

  const linkByProduct = useMemo(() => {
    const m = new Map<string, ReferralLink>();
    (links.data ?? []).forEach((l) => m.set(l.product_id, l));
    return m;
  }, [links.data]);

  const totals = useMemo(() => {
    const all = links.data ?? [];
    return {
      clicks: all.reduce((s, l) => s + (l.clicks || 0), 0),
      sales: all.reduce((s, l) => s + (l.sales || 0), 0),
      commissions: all.reduce((s, l) => s + (l.commissions || 0), 0),
      campaigns: all.length,
    };
  }, [links.data]);

  const filtered = useMemo(() => {
    const list = products.data ?? [];
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter(
      (p) => p.title.toLowerCase().includes(s) || (p.description ?? "").toLowerCase().includes(s),
    );
  }, [products.data, search]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Marketer workspace
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Promote & earn</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse products, generate referral links, and track performance.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clicks" value={String(totals.clicks)} icon={<MousePointerClick className="size-4" />} />
        <StatCard label="Sales" value={String(totals.sales)} icon={<Link2 className="size-4" />} />
        <StatCard label="Commissions" value={`$${totals.commissions.toFixed(2)}`} icon={<DollarSign className="size-4" />} />
        <StatCard label="Active links" value={String(totals.campaigns)} icon={<Megaphone className="size-4" />} />
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-xl font-semibold">Your referral links</h2>
            <p className="text-sm text-muted-foreground">Share these anywhere to earn commission on each sale.</p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
          {links.isLoading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>
          ) : (links.data ?? []).length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto grid place-items-center size-12 rounded-2xl bg-gradient-primary text-primary-foreground shadow-elegant">
                <Sparkles className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">No links yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Pick a product below and generate your first link.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Product</th>
                  <th className="text-left px-5 py-3 font-semibold">Share URL</th>
                  <th className="text-right px-5 py-3 font-semibold">Clicks</th>
                  <th className="text-right px-5 py-3 font-semibold">Sales</th>
                  <th className="text-right px-5 py-3 font-semibold">Commissions</th>
                </tr>
              </thead>
              <tbody>
                {(links.data ?? []).map((l) => (
                  <tr key={l.id} className="border-t border-border">
                    <td className="px-5 py-4">
                      <div className="font-medium">{l.product_title}</div>
                      <div className="text-xs text-muted-foreground">
                        ${l.product_price.toFixed(2)} · {l.commission_percent}% commission
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <CopyUrl url={buildShareUrl(l.code)} />
                    </td>
                    <td className="px-5 py-4 text-right font-medium">{l.clicks}</td>
                    <td className="px-5 py-4 text-right">{l.sales}</td>
                    <td className="px-5 py-4 text-right font-semibold text-primary">
                      ${l.commissions.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-xl font-semibold">Marketplace</h2>
            <p className="text-sm text-muted-foreground">Published products available to promote.</p>
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

        <div className="mt-4">
          {products.isLoading ? (
            <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted-foreground">
              Loading marketplace…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-10 text-center">
              <div className="mx-auto grid place-items-center size-12 rounded-2xl bg-accent text-accent-foreground">
                <Package className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">No products found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {search ? "Try a different search term." : "Check back soon — sellers are still onboarding."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => {
                const existing = linkByProduct.get(p.id);
                return (
                  <article
                    key={p.id}
                    className="group rounded-2xl border border-border bg-surface shadow-soft overflow-hidden flex flex-col"
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
                          {Number(p.commission_percent)}% commission
                        </span>
                      </div>
                      {existing ? (
                        <CopyUrl url={buildShareUrl(existing.code)} compact />
                      ) : (
                        <Button
                          onClick={() => create.mutate(p)}
                          disabled={create.isPending}
                          className="gap-2 w-full"
                        >
                          <Link2 className="size-4" />
                          Generate referral link
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
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

function CopyUrl({ url, compact = false }: { url: string; compact?: boolean }) {
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
    <div className={`flex items-center gap-2 ${compact ? "" : "max-w-md"}`}>
      <code className="flex-1 truncate rounded-md bg-muted px-2 py-1.5 text-xs">{url}</code>
      <Button size="sm" variant="outline" onClick={onCopy} className="gap-1.5">
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
