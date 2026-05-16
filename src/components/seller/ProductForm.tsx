import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ProductFormValues = {
  title: string;
  description: string;
  price: number;
  commission_percent: number;
  image_url: string;
  status: "draft" | "published";
};

export function ProductForm({
  initial,
  submitting,
  onSubmit,
  submitLabel = "Save product",
}: {
  initial?: Partial<ProductFormValues>;
  submitting?: boolean;
  onSubmit: (values: ProductFormValues) => void | Promise<void>;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<ProductFormValues>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? 0,
    commission_percent: initial?.commission_percent ?? 10,
    image_url: initial?.image_url ?? "",
    status: initial?.status ?? "draft",
  });

  const update = <K extends keyof ProductFormValues>(k: K, v: ProductFormValues[K]) =>
    setValues((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: FormEvent, status?: "draft" | "published") => {
    e.preventDefault();
    await onSubmit({ ...values, status: status ?? values.status });
  };

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
      <div className="grid gap-2">
        <Label htmlFor="title">Product title</Label>
        <Input
          id="title" required maxLength={200}
          value={values.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="e.g. Premium SaaS Onboarding Course"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description" rows={5} maxLength={5000}
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="What's the value? Who's it for?"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="price">Price (USD)</Label>
          <Input
            id="price" type="number" min={0} step="0.01" required
            value={values.price}
            onChange={(e) => update("price", Number(e.target.value))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="commission">Marketer commission (%)</Label>
          <Input
            id="commission" type="number" min={0} max={100} step="0.1" required
            value={values.commission_percent}
            onChange={(e) => update("commission_percent", Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            Marketers earn ${((values.price * values.commission_percent) / 100).toFixed(2)} per sale.
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="image">Cover image URL (optional)</Label>
        <Input
          id="image" type="url" maxLength={2048}
          value={values.image_url}
          onChange={(e) => update("image_url", e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={submitting} onClick={(e) => handleSubmit(e, "draft")}
          variant="outline">
          Save as draft
        </Button>
        <Button type="submit" disabled={submitting} onClick={(e) => handleSubmit(e, "published")}>
          {submitting ? "Saving…" : submitLabel === "Save product" ? "Publish" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
