import { Wand2, Sparkles, Type } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  improveDescription,
  improveTitle,
  generateMarketingCopy,
} from "@/lib/product-ai";
import type { ProductFormValues } from "@/components/seller/ProductForm";

type ProductAiAssistProps = {
  values: Pick<ProductFormValues, "title" | "description" | "category" | "price" | "commission_percent">;
  onApply: (patch: Partial<ProductFormValues>) => void;
};

export function ProductAiAssist({ values, onApply }: ProductAiAssistProps) {
  const enhanceTitle = () => {
    const next = improveTitle(values.title, values.category);
    onApply({ title: next });
    toast.success("Title improved");
  };

  const enhanceDescription = () => {
    const next = improveDescription(values.title, values.description, values.category);
    onApply({ description: next });
    toast.success("Description enhanced");
  };

  const enhanceCopy = () => {
    const copy = generateMarketingCopy(values.title, values.price, values.commission_percent);
    onApply({ description: values.description ? `${values.description}\n\n---\n\n${copy}` : copy });
    toast.success("Marketing copy generated");
  };

  return (
    <div className="rounded-2xl border border-border bg-surface-muted/50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-primary" />
        AI product assistant
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Improve listing copy to attract more marketers and conversions.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={enhanceTitle}>
          <Type className="size-3.5" /> Improve title
        </Button>
        <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={enhanceDescription}>
          <Wand2 className="size-3.5" /> Improve description
        </Button>
        <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={enhanceCopy}>
          <Sparkles className="size-3.5" /> Generate marketing copy
        </Button>
      </div>
    </div>
  );
}
