import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertCircle, Lock, CreditCard } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import { getPublishedProduct } from "@/lib/referrals.firestore";
import { recordDirectCheckout } from "@/lib/sales.firestore";

export const Route = createFileRoute("/products/$productId/checkout")({
  head: () => ({ meta: [{ title: "Checkout — LinkProfit AI" }] }),
  component: DirectCheckoutPage,
});

const schema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
});

function DirectCheckoutPage() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const productQ = useQuery({
    queryKey: ["public-product", productId],
    queryFn: () => getPublishedProduct(productId),
  });

  const sale = useMutation({
    mutationFn: async () => {
      if (!productQ.data) throw new Error("Checkout data is still loading. Please try again.");
      await recordDirectCheckout(productId, name, email);
    },
    onSuccess: () => {
      toast.success("Purchase confirmed!");
      navigate({ to: "/products/$productId/success", params: { productId }, replace: true });
    },
    onError: (e) => {
      const message = getFirebaseErrorMessage(e, "Failed to record purchase");
      setErrors({ email: message });
      toast.error(message);
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email });
    if (!parsed.success) {
      const errs: typeof errors = {};
      parsed.error.issues.forEach((i) => {
        errs[i.path[0] as "name" | "email"] = i.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    if (!productQ.data) {
      toast.error("Checkout is still loading. Please wait a moment.");
      return;
    }
    sale.mutate();
  };

  if (productQ.isLoading) {
    return (
      <main className="min-h-screen grid place-items-center text-muted-foreground">
        <div className="inline-flex items-center gap-2">
          <Loader2 className="size-5 animate-spin" /> Loading…
        </div>
      </main>
    );
  }

  if (!productQ.data) {
    return (
      <main className="min-h-screen grid place-items-center px-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto grid place-items-center size-12 rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="size-5" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">Unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">This product is no longer available.</p>
          <Link to="/products" className="mt-6 inline-flex text-sm font-semibold text-primary hover:underline">
            Back to marketplace
          </Link>
        </div>
      </main>
    );
  }

  const product = productQ.data;

  return (
    <main className="min-h-screen bg-background py-16 px-6">
      <div className="mx-auto max-w-3xl grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <aside className="rounded-2xl border border-border bg-surface p-6 shadow-soft h-fit">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order summary</div>
          <div className="mt-4 flex gap-3">
            {product.image_url && (
              <img src={product.image_url} alt={product.title} className="size-16 rounded-lg object-cover" />
            )}
            <div className="min-w-0">
              <div className="font-semibold truncate">{product.title}</div>
              <div className="text-xs text-muted-foreground">Direct purchase</div>
            </div>
          </div>
          <div className="mt-6 space-y-2 text-sm">
            <Row label="Subtotal" value={`$${Number(product.price).toFixed(2)}`} />
            <Row label="Tax" value="$0.00" muted />
            <div className="my-3 h-px bg-border" />
            <Row label="Total" value={`$${Number(product.price).toFixed(2)}`} bold />
          </div>
        </aside>

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-soft">
          <h1 className="font-display text-2xl font-bold tracking-tight">Checkout</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Guest checkout — no account required. This is a direct platform purchase (no marketer referral).
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Full name</span>
              <Input
                className="mt-1.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
              />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
            </label>
            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <Input
                className="mt-1.5"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
            </label>

            <div className="rounded-xl border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground inline-flex items-center gap-2">
              <Lock className="size-3.5" /> No card needed for this demo checkout.
            </div>

            <Button type="submit" disabled={sale.isPending} className="w-full gap-2">
              {sale.isPending ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
              Confirm purchase · ${Number(product.price).toFixed(2)}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${muted ? "text-muted-foreground" : ""}`}>
      <span>{label}</span>
      <span className={bold ? "font-bold text-lg" : ""}>{value}</span>
    </div>
  );
}
