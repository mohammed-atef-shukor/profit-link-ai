import { commissionTier, commissionTierLabel, commissionTip } from "@/lib/product-ai";

export function CommissionGuide({ percent }: { percent: number }) {
  const tier = commissionTier(percent);

  const tone =
    tier === "low"
      ? "border-amber-500/30 bg-amber-500/5"
      : tier === "recommended"
        ? "border-primary/30 bg-primary/5"
        : tier === "high"
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-violet-500/30 bg-violet-500/5";

  return (
    <div className={`rounded-xl border px-3 py-2.5 text-xs ${tone}`}>
      <div className="font-semibold">{commissionTierLabel(tier)} · {percent}% commission</div>
      <p className="mt-1 text-muted-foreground leading-relaxed">{commissionTip(percent)}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <span>5–10% low</span>
        <span>10–20% recommended</span>
        <span>20–30% high</span>
        <span>30%+ aggressive</span>
      </div>
    </div>
  );
}
