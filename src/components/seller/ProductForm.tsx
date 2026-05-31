import { useState, type FormEvent } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CommissionGuide } from "@/components/seller/CommissionGuide";
import { ProductAiAssist } from "@/components/seller/ProductAiAssist";
import { PRODUCT_CATEGORIES } from "@/lib/products.firestore";
import { validateImageFile } from "@/firebase/storage";

export type ProductFormValues = {
  title: string;
  description: string;
  price: number;
  commission_percent: number;
  image_url: string;
  category: string;
  discount_percent: number | null;
  status: "draft" | "published";
};

const baseSchema = z.object({
  title: z.string().trim().min(2, "Product name must be at least 2 characters").max(200),
  price: z.number().min(0.01, "Price must be greater than 0"),
  commission_percent: z
    .number()
    .min(0, "Commission must be at least 0%")
    .max(100, "Commission cannot exceed 100%"),
  category: z.string().trim().min(1, "Category is required"),
  discount_percent: z
    .number()
    .min(0, "Discount must be at least 0%")
    .max(100, "Discount cannot exceed 100%")
    .nullable(),
  image_url: z
    .string()
    .trim()
    .max(2048)
    .refine((v) => v === "" || z.string().url().safeParse(v).success, "Enter a valid image URL"),
});

const draftSchema = baseSchema.extend({
  description: z.string().trim().min(3, "Description must be at least 3 characters").max(5000),
});

const publishSchema = baseSchema.extend({
  description: z.string().trim().min(10, "Description must be at least 10 characters to publish").max(5000),
});

export function ProductForm({
  initial,
  submitting,
  uploadProgress,
  onSubmit,
  submitLabel = "Save product",
}: {
  initial?: Partial<ProductFormValues>;
  submitting?: boolean;
  uploadProgress?: number | null;
  onSubmit: (values: ProductFormValues, imageFile: File | null) => void | Promise<void>;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<ProductFormValues>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? 0,
    commission_percent: initial?.commission_percent ?? 10,
    image_url: initial?.image_url ?? "",
    category: initial?.category ?? PRODUCT_CATEGORIES[0],
    discount_percent: initial?.discount_percent ?? null,
    status: initial?.status ?? "draft",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormValues | "image_file", string>>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image_url || null);

  const update = <K extends keyof ProductFormValues>(k: K, v: ProductFormValues[K]) =>
    setValues((p) => ({ ...p, [k]: v }));

  const scrollToFirstError = (fieldErrors: typeof errors) => {
    const order: (keyof ProductFormValues | "image_file")[] = [
      "title",
      "description",
      "price",
      "commission_percent",
      "category",
      "discount_percent",
      "image_url",
      "image_file",
    ];
    const first = order.find((k) => fieldErrors[k]);
    if (!first) return;
    const el = document.getElementById(first === "image_file" ? "image" : first);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
  };

  const validate = (status: "draft" | "published") => {
    const parsed = (status === "published" ? publishSchema : draftSchema).safeParse(values);
    if (!parsed.success) {
      const next: typeof errors = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof ProductFormValues;
        next[key] = issue.message;
      });
      setErrors(next);
      toast.error("Fix the highlighted fields before saving.");
      scrollToFirstError(next);
      return false;
    }

    if (status === "published" && !imageFile && !values.image_url.trim()) {
      const next = {
        image_file: "Product image is required to publish (upload a file or paste a URL).",
      };
      setErrors(next);
      toast.error(next.image_file);
      scrollToFirstError(next);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: FormEvent, status: "draft" | "published") => {
    e.preventDefault();
    if (!validate(status)) return;
    await onSubmit({ ...values, status }, imageFile);
  };

  const onImagePick = (file: File | null) => {
    if (!file) return;
    try {
      validateImageFile(file);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, image_file: undefined }));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        image_file: err instanceof Error ? err.message : "Invalid image file",
      }));
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(values.image_url || null);
  };

  const busy = submitting || (uploadProgress != null && uploadProgress < 100);

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <div className="grid gap-2">
        <Label htmlFor="title">Product name</Label>
        <Input
          id="title"
          maxLength={200}
          value={values.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="e.g. Premium SaaS Onboarding Course"
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={5}
          maxLength={5000}
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="What's the value? Who's it for? (min 3 chars for draft, 10 to publish)"
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
      </div>

      <ProductAiAssist values={values} onApply={(patch) => setValues((p) => ({ ...p, ...patch }))} />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="price">Price (USD)</Label>
          <Input
            id="price"
            type="number"
            min={0}
            step="0.01"
            value={values.price || ""}
            onChange={(e) => update("price", Number(e.target.value))}
          />
          {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="commission">Marketer commission (%)</Label>
          <Input
            id="commission"
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={values.commission_percent}
            onChange={(e) => update("commission_percent", Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            Marketers earn ${((values.price * values.commission_percent) / 100).toFixed(2)} per sale.
          </p>
          <CommissionGuide percent={values.commission_percent} />
          {errors.commission_percent && (
            <p className="text-xs text-destructive">{errors.commission_percent}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={values.category}
            onChange={(e) => update("category", e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="discount">Discount (% optional)</Label>
          <Input
            id="discount"
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={values.discount_percent ?? ""}
            onChange={(e) =>
              update("discount_percent", e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder="0"
          />
          {errors.discount_percent && (
            <p className="text-xs text-destructive">{errors.discount_percent}</p>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        <Label>Product image</Label>
        {imagePreview ? (
          <div className="relative overflow-hidden rounded-xl border border-border bg-muted/30">
            <img src={imagePreview} alt="Product preview" className="max-h-56 w-full object-cover" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-full bg-background/90 border border-border hover:bg-muted"
              aria-label="Remove image"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-center hover:bg-muted/40">
          <Upload className="size-5 text-muted-foreground" />
          <span className="text-sm font-medium">Upload product image</span>
          <span className="text-xs text-muted-foreground">JPEG, PNG, WebP, GIF — max 5 MB</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => onImagePick(e.target.files?.[0] ?? null)}
          />
        </label>

        {uploadProgress != null && uploadProgress < 100 && (
          <div className="space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-gradient-primary transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Uploading… {uploadProgress}%</p>
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="image">Or paste image URL</Label>
          <Input
            id="image"
            type="url"
            maxLength={2048}
            value={values.image_url}
            onChange={(e) => {
              update("image_url", e.target.value);
              if (!imageFile) setImagePreview(e.target.value || null);
            }}
            placeholder="https://..."
          />
          {errors.image_url && <p className="text-xs text-destructive">{errors.image_url}</p>}
        </div>
        {errors.image_file && <p className="text-xs text-destructive">{errors.image_file}</p>}
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button
          type="button"
          disabled={busy}
          variant="outline"
          onClick={(e) => void handleSubmit(e, "draft")}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Save as inactive (draft)
        </Button>
        <Button type="button" disabled={busy} onClick={(e) => void handleSubmit(e, "published")}>
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {uploadProgress != null && uploadProgress < 100 ? `Uploading ${uploadProgress}%` : "Saving…"}
            </>
          ) : submitLabel === "Save product" ? (
            "Publish (active)"
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
