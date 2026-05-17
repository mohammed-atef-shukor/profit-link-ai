import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { getLinkByCode, recordClick, getPublishedProduct } from "@/lib/referrals.firestore";
import type { Product } from "@/lib/products.firestore";

export const Route = createFileRoute("/r/$code")({
  head: () => ({ meta: [{ title: "Redirecting… — LinkProfit AI" }] }),
  component: ReferralRedirect,
});

function ReferralRedirect() {
  const { code } = Route.useParams();
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading");
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const link = await getLinkByCode(code);
        if (!link) {
          if (!cancelled) setStatus("missing");
          return;
        }
        // Fire-and-forget click tracking
        recordClick(link.id).catch(() => {});
        const p = await getPublishedProduct(link.product_id);
        if (cancelled) return;
        setProduct(p);
        setStatus("ok");
      } catch {
        if (!cancelled) setStatus("missing");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (status === "loading") {
    return (
      <main className="min-h-screen grid place-items-center text-muted-foreground">
        <div className="flex items-center gap-2">
          <Loader2 className="size-5 animate-spin" /> Tracking your click…
        </div>
      </main>
    );
  }

  if (status === "missing" || !product) {
    return (
      <main className="min-h-screen grid place-items-center px-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto grid place-items-center size-12 rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="size-5" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">Link unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This referral link is invalid or the product is no longer available.
          </p>
          <Link to="/" className="mt-6 inline-flex text-sm font-semibold text-primary hover:underline">
            Back home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center px-6 py-12">
      <article className="max-w-lg w-full rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
        {product.image_url && (
          <div className="aspect-[16/9] bg-muted overflow-hidden">
            <img src={product.image_url} alt={product.title} className="size-full object-cover" />
          </div>
        )}
        <div className="p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Referred offer
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold">{product.title}</h1>
          {product.description && (
            <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
          )}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-2xl font-bold">${Number(product.price).toFixed(2)}</div>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-90"
            >
              Continue to checkout <ExternalLink className="size-4" />
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Click tracked. Sale & commission will be credited to the referring marketer.
          </p>
        </div>
      </article>
    </main>
  );
}
