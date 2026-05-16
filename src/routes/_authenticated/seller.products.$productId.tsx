import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ProductForm, type ProductFormValues } from "@/components/seller/ProductForm";
import { getProduct, updateProduct } from "@/lib/products.functions";

export const Route = createFileRoute("/_authenticated/seller/products/$productId")({
  head: () => ({ meta: [{ title: "Edit product — LinkProfit AI" }] }),
  component: EditProductPage,
});

function EditProductPage() {
  const { productId } = Route.useParams();
  const router = useRouter();
  const get = useServerFn(getProduct);
  const update = useServerFn(updateProduct);
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => get({ data: { id: productId } }),
  });

  const product = data?.product;

  const handleSubmit = async (values: ProductFormValues) => {
    setSubmitting(true);
    try {
      await update({ data: { id: productId, ...values } });
      toast.success("Product updated");
      router.navigate({ to: "/seller" });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/seller" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to products
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Edit product</h1>
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-soft">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : !product ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Product not found.</div>
        ) : (
          <ProductForm
            initial={{
              title: product.title,
              description: product.description ?? "",
              price: Number(product.price),
              commission_percent: Number(product.commission_percent),
              image_url: product.image_url ?? "",
              status: product.status,
            }}
            submitting={submitting}
            onSubmit={handleSubmit}
            submitLabel="Update product"
          />
        )}
      </div>
    </main>
  );
}
