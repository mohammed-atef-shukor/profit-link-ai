import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { listMyReferralLinks, buildShareUrl } from "@/lib/referrals.firestore";

export const Route = createFileRoute("/_authenticated/marketer/links")({
  head: () => ({ meta: [{ title: "My Links — Marketer — LinkProfit AI" }] }),
  component: MarketerLinks,
});

function MarketerLinks() {
  const links = useQuery({ queryKey: ["my-referral-links"], queryFn: listMyReferralLinks });
  const rows = links.data ?? [];

  return (
    <main>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Marketer</div>
        <h1 className="font-display text-3xl font-bold tracking-tight">My referral links</h1>
        <p className="mt-1 text-sm text-muted-foreground">Share anywhere to earn commission on each sale.</p>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
        {links.isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto grid place-items-center size-12 rounded-2xl bg-gradient-primary text-primary-foreground shadow-elegant">
              <Sparkles className="size-5" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">No links yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Pick a product and generate your first link.</p>
            <Link to="/marketer/marketplace" className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Browse marketplace
            </Link>
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
              {rows.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-5 py-4">
                    <div className="font-medium">{l.product_title}</div>
                    <div className="text-xs text-muted-foreground">
                      ${l.product_price.toFixed(2)} · {l.commission_percent}% commission
                    </div>
                  </td>
                  <td className="px-5 py-4"><CopyUrl url={buildShareUrl(l.code)} /></td>
                  <td className="px-5 py-4 text-right font-medium">{l.clicks}</td>
                  <td className="px-5 py-4 text-right">{l.sales}</td>
                  <td className="px-5 py-4 text-right font-semibold text-primary">${l.commissions.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
    <div className="flex items-center gap-2 max-w-md">
      <code className="flex-1 truncate rounded-md bg-muted px-2 py-1.5 text-xs">{url}</code>
      <Button size="sm" variant="outline" onClick={onCopy} className="gap-1.5">
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
