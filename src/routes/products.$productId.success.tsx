import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { getPublishedProduct } from "@/lib/referrals.firestore";

export const Route = createFileRoute("/products/$productId/success")({
  head: () => ({ meta: [{ title: "Thank you — LinkProfit AI" }] }),
  component: DirectSuccessPage,
});

function DirectSuccessPage() {
  const { productId } = Route.useParams();
  const productQ = useQuery({
    queryKey: ["public-product", productId],
    queryFn: () => getPublishedProduct(productId),
  });

  if (productQ.isLoading) {
    return (
      <main className="min-h-screen grid place-items-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center px-6 py-12 bg-background">
      <div className="max-w-md w-full text-center rounded-3xl border border-border bg-surface p-10 shadow-elegant">
        <div className="mx-auto grid place-items-center size-14 rounded-2xl bg-gradient-primary text-primary-foreground shadow-elegant">
          <CheckCircle2 className="size-7" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">Purchase completed successfully</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you{productQ.data ? ` for your order — ${productQ.data.title}` : ""}. This was a direct platform
          purchase — no marketer commission applies.
        </p>
        {productQ.data && (
          <div className="mt-6 rounded-xl bg-surface-muted p-4 text-left text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Product</span>
              <span className="font-semibold">{productQ.data.title}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold">${Number(productQ.data.price).toFixed(2)}</span>
            </div>
          </div>
        )}
        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-95"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
