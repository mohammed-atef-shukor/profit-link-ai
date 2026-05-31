import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { getLinkByCode, getPublishedProduct } from "@/lib/referrals.firestore";

export const Route = createFileRoute("/r/$code/success")({
  head: () => ({ meta: [{ title: "Thank you — LinkProfit AI" }] }),
  component: SuccessPage,
});

function SuccessPage() {
  const { code } = Route.useParams();
  const linkQ = useQuery({ queryKey: ["link-by-code", code], queryFn: () => getLinkByCode(code) });
  const productQ = useQuery({
    queryKey: ["public-product", linkQ.data?.product_id],
    queryFn: () => getPublishedProduct(linkQ.data!.product_id),
    enabled: !!linkQ.data,
  });

  if (linkQ.isLoading || productQ.isLoading) {
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
          Thank you{productQ.data ? ` for your order — ${productQ.data.title}` : ""}. The referring marketer&apos;s
          commission has been recorded. No account was required.
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
