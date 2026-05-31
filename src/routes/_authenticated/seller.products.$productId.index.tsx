import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ProductForm, type ProductFormValues } from "@/components/seller/ProductForm";
import { dashboardFormWidth } from "@/components/layout/DashboardShell";
import { getProduct, updateProductWithImage, type ProductInput } from "@/lib/products.firestore";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";

export const Route = createFileRoute("/_authenticated/seller/products/$productId/")({
  head: () => ({ meta: [{ title: "Edit product — LinkProfit AI" }] }),
  component: EditProductPage,
});

function toProductInput(values: ProductFormValues, existing: ProductInput): ProductInput {
  const nextImageUrl = values.image_url.trim();
  const isFirebaseStorageUrl =
    nextImageUrl.includes("firebasestorage.googleapis.com") || nextImageUrl.includes("firebasestorage.app");

  return {
    title: values.title,
    description: values.description || null,
    price: values.price,
    commission_percent: values.commission_percent,
    image_url: nextImageUrl || null,
    storage_path: nextImageUrl && isFirebaseStorageUrl ? existing.storage_path ?? null : null,
    category: values.category,
    discount_percent: values.discount_percent,
    status: values.status,
    seller_name: existing.seller_name ?? null,
  };
}

function EditProductPage() {
  const { productId } = Route.useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { user, authReady } = useFirebaseAuth();
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId, user?.uid],
    queryFn: () => getProduct(productId),
    enabled: authReady && !!user,
  });

  const handleSubmit = async (values: ProductFormValues, imageFile: File | null) => {
    if (!product) return;

    setSubmitting(true);
    setUploadProgress(imageFile ? 0 : null);

    try {
      const input = toProductInput(values, {
        title: product.title,
        description: product.description,
        price: product.price,
        commission_percent: product.commission_percent,
        image_url: product.image_url,
        storage_path: product.storage_path ?? null,
        category: product.category,
        discount_percent: product.discount_percent ?? null,
        status: product.status,
        seller_name: product.seller_name ?? null,
      });

      await updateProductWithImage(
        productId,
        input,
        imageFile,
        imageFile ? (p) => setUploadProgress(p) : undefined,
      );

      await qc.invalidateQueries({ queryKey: ["my-products"] });
      await qc.invalidateQueries({ queryKey: ["product", productId] });
      toast.success("Product updated");
      await router.navigate({ to: "/seller/products" });
    } catch (e) {
      toast.error(getFirebaseErrorMessage(e, "Failed to update product"));
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <main className={dashboardFormWidth}>
      <Link
        to="/seller/products"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
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
              category: product.category ?? "Other",
              discount_percent: product.discount_percent ?? null,
              status: product.status,
            }}
            submitting={submitting}
            uploadProgress={uploadProgress}
            onSubmit={handleSubmit}
            submitLabel="Update product"
          />
        )}
      </div>
    </main>
  );
}
