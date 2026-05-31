import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ProductForm, type ProductFormValues } from "@/components/seller/ProductForm";
import { dashboardFormWidth } from "@/components/layout/DashboardShell";
import { createProductWithImage, type ProductInput } from "@/lib/products.firestore";
import { getUserProfile } from "@/lib/users.firestore";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";

export const Route = createFileRoute("/_authenticated/seller/products/new")({
  head: () => ({ meta: [{ title: "New product — LinkProfit AI" }] }),
  component: NewProductPage,
});

function toProductInput(values: ProductFormValues, sellerName: string | null): ProductInput {
  return {
    title: values.title,
    description: values.description || null,
    price: values.price,
    commission_percent: values.commission_percent,
    image_url: values.image_url || null,
    category: values.category,
    discount_percent: values.discount_percent,
    status: values.status,
    seller_name: sellerName,
  };
}

function NewProductPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, role, authReady, roleLoading } = useFirebaseAuth();
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleSubmit = async (values: ProductFormValues, imageFile: File | null) => {
    if (!authReady || roleLoading || !user) {
      toast.error("Please wait for sign-in to complete.");
      return;
    }

    if (role !== "seller" && role !== "admin") {
      toast.error("Only seller accounts can add products.");
      return;
    }

    setSubmitting(true);
    setUploadProgress(imageFile ? 0 : null);

    try {
      let sellerName: string | null = null;
      try {
        const profile = await getUserProfile(user.uid);
        sellerName = profile?.store_name ?? profile?.display_name ?? user.displayName ?? null;
      } catch {
        sellerName = user.displayName ?? null;
      }

      const input = toProductInput(values, sellerName);
      await createProductWithImage(
        input,
        imageFile,
        imageFile ? (p) => setUploadProgress(p) : undefined,
      );

      await qc.invalidateQueries({ queryKey: ["my-products"] });
      toast.success(values.status === "published" ? "Product published" : "Draft saved");
      await router.navigate({ to: "/seller/products" });
    } catch (e) {
      toast.error(getFirebaseErrorMessage(e, "Failed to create product"));
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
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">New product</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Set up your offer, upload a cover image, and set the commission marketers will earn.
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-soft">
        <ProductForm submitting={submitting} uploadProgress={uploadProgress} onSubmit={handleSubmit} />
      </div>
    </main>
  );
}
