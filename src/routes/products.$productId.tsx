import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Package, Percent, Link2, Loader2, Check, Copy, LogIn, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MarketerRouteGuard } from "@/components/auth/MarketerRouteGuard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { requireMarketer } from "@/lib/auth-guard";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import {
  getPublishedProduct,
  createReferralLink,
  findMyLinkForProduct,
  buildShareUrl,
} from "@/lib/referrals.firestore";

export const Route = createFileRoute("/products/$productId")({
  beforeLoad: async () => {
    await requireMarketer();
  },
  head: () => ({ meta: [{ title: "Product — LinkProfit AI" }] }),
  component: PublicProductDetail,
});

function PublicProductDetail() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { currentUser, loading: authLoading, role, roleLoading } = useAuth();

  const product = useQuery({
    queryKey: ["public-product", productId],
    queryFn: () => getPublishedProduct(productId),
  });

  const myLink = useQuery({
    queryKey: ["my-link-for", productId, currentUser?.uid],
    queryFn: () => findMyLinkForProduct(productId),
    enabled: !!currentUser && role === "marketer",
  });

  const create = useMutation({
    mutationFn: () => createReferralLink(product.data!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-link-for", productId] });
      qc.invalidateQueries({ queryKey: ["my-referral-links"] });
      toast.success("Referral link ready");
    },
    onError: (e) => toast.error(getFirebaseErrorMessage(e, "Failed to generate link")),
  });

  return (
    <MarketerRouteGuard>
      <div className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <main className="pt-32 pb-20">
        <div className="mx-auto max-w-5xl px-6">
          <Link to="/products" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to marketplace
          </Link>

          {product.isLoading ? (
            <div className="mt-10 rounded-2xl border border-border bg-surface p-12 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : !product.data ? (
            <div className="mt-10 rounded-2xl border border-border bg-surface p-12 text-center">
              <h2 className="font-display text-xl font-semibold">Product not available</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This product is no longer published or doesn't exist.
              </p>
              <Link to="/products" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
                Back to marketplace
              </Link>
            </div>
          ) : (
            <article className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
              <div className="rounded-3xl border border-border bg-surface overflow-hidden shadow-soft">
                {product.data.image_url ? (
                  <img src={product.data.image_url} alt={product.data.title} className="w-full aspect-[4/3] object-cover" />
                ) : (
                  <div className="aspect-[4/3] grid place-items-center bg-gradient-primary text-primary-foreground">
                    <Package className="size-16 opacity-80" />
                  </div>
                )}
              </div>

              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                  {product.data.title}
                </h1>
                <div className="mt-4 flex items-center gap-3">
                  <div className="text-3xl font-bold">${Number(product.data.price).toFixed(2)}</div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                    <Percent className="size-3" />
                    {product.data.commission_percent}% commission
                  </span>
                </div>
                {product.data.description && (
                  <p className="mt-6 text-muted-foreground leading-relaxed whitespace-pre-line">
                    {product.data.description}
                  </p>
                )}

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild className="gap-2">
                    <Link to="/products/$productId/checkout" params={{ productId }}>
                      <ShoppingCart className="size-4" /> Buy now
                    </Link>
                  </Button>
                </div>

                <div className="mt-8 rounded-2xl border border-border bg-surface-muted/50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Promote & earn
                  </div>
                  {authLoading || (currentUser && roleLoading) ? (
                    <div className="mt-3 text-sm text-muted-foreground" role="status">
                      Loading…
                    </div>
                  ) : !currentUser ? (
                    <>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Sign in as a marketer to generate your unique referral link for this product.
                      </p>
                      <Button onClick={() => navigate({ to: "/login" })} className="mt-4 gap-2">
                        <LogIn className="size-4" /> Sign in as marketer
                      </Button>
                    </>
                  ) : role === null ? (
                    <>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Finish account setup before generating referral links.
                      </p>
                      <Button onClick={() => navigate({ to: "/dashboard" })} className="mt-4 gap-2">
                        Complete setup
                      </Button>
                    </>
                  ) : role === "seller" || role === "admin" ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      You're signed in as a seller. Switch to a marketer account to promote products.
                    </p>
                  ) : myLink.data ? (
                    <CopyRow url={buildShareUrl(myLink.data.code)} />
                  ) : (
                    <Button
                      onClick={() => create.mutate()}
                      disabled={create.isPending}
                      className="mt-4 gap-2"
                    >
                      {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
                      Generate my referral link
                    </Button>
                  )}
                </div>
              </div>
            </article>
          )}
        </div>
      </main>
      <SiteFooter />
      </div>
    </MarketerRouteGuard>
  );
}

function CopyRow({ url }: { url: string }) {
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
    <div className="mt-3 flex items-center gap-2">
      <code className="flex-1 truncate rounded-md bg-surface border border-border px-3 py-2 text-xs">{url}</code>
      <Button size="sm" variant="outline" onClick={onCopy} className="gap-1.5">
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
