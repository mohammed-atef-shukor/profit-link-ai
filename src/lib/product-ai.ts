/** Lightweight copy enhancement — no external API required. */

export function improveTitle(title: string, category: string): string {
  const base = title.trim();
  if (!base) return `Premium ${category} Offer`;
  if (base.length >= 40) return base.slice(0, 80);
  const hooks = ["Pro", "Complete", "Essential", "Ultimate"];
  const hook = hooks[base.length % hooks.length];
  if (/pro|complete|essential|ultimate/i.test(base)) return base;
  return `${hook} ${base}`;
}

export function improveDescription(title: string, description: string, category: string): string {
  const intro = description.trim()
    ? description.trim()
    : `${title.trim() || category} designed to deliver real results for your audience.`;
  const bullets = [
    "Clear value proposition for buyers",
    "Built for marketers who want high-converting offers",
    "Trusted quality backed by seller support",
  ];
  return `${intro}\n\nWhy promoters love it:\n• ${bullets.join("\n• ")}\n\nPerfect for audiences interested in ${category.toLowerCase()}.`;
}

export function generateMarketingCopy(title: string, price: number, commissionPercent: number): string {
  const earn = ((price * commissionPercent) / 100).toFixed(2);
  return [
    `🔥 New offer: ${title}`,
    `Earn $${earn} per sale (${commissionPercent}% commission).`,
    "Share your referral link and track clicks + conversions in real time.",
    "Limited-time momentum — promote while demand is high.",
  ].join("\n");
}

export type CommissionTier = "low" | "recommended" | "high" | "aggressive";

export function commissionTier(percent: number): CommissionTier {
  if (percent < 10) return "low";
  if (percent < 20) return "recommended";
  if (percent < 30) return "high";
  return "aggressive";
}

export function commissionTierLabel(tier: CommissionTier): string {
  switch (tier) {
    case "low":
      return "Low attraction";
    case "recommended":
      return "Recommended";
    case "high":
      return "High growth";
    case "aggressive":
      return "Aggressive";
  }
}

export function commissionTip(percent: number): string {
  const tier = commissionTier(percent);
  if (tier === "low") return "Products with 15%+ commissions attract more marketers.";
  if (tier === "recommended") return "This range balances margin and marketer motivation.";
  if (tier === "high") return "Strong commissions — expect faster marketer adoption.";
  return "Premium commission rate — ideal for launch campaigns.";
}
