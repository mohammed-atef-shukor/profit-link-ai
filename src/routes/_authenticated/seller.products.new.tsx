import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ProductForm, type ProductFormValues } from "@/components/seller/ProductForm";
import { createProduct } from "@/lib/products.firestore";

export const Route = createFileRoute("/_authenticated/seller/products/new")({
  head: () => ({ meta: [{ title: "New product — LinkProfit AI" }] }),
  component: NewProductPage,
});

function NewProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: ProductFormValues) => {
    setSubmitting(true);
    try {
      await createProduct({
        title: values.title,
        description: values.description || null,
        price: values.price,
        commission_percent: values.commission_percent,
        image_url: values.image_url || null,
        status: values.status,
      });
      toast.success(values.status === "published" ? "Product published" : "Draft saved");
      router.navigate({ to: "/seller" });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/seller" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to products
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">New product</h1>
      <p className="mt-1 text-sm text-muted-foreground">Set up your offer and the commission marketers will earn.</p>
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-soft">
        <ProductForm submitting={submitting} onSubmit={handleSubmit} />
      </div>
    </main>
  );
}
