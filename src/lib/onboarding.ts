import type { Product } from "@/lib/products.firestore";
import type { ReferralLink } from "@/lib/referrals.firestore";
import type { UserProfile } from "@/lib/users.firestore";

export type OnboardingStep = {
  id: string;
  label: string;
  done: boolean;
  href?: string;
};

export function buildSellerOnboardingSteps(
  profile: UserProfile | null | undefined,
  products: Product[],
): OnboardingStep[] {
  const hasStore = Boolean(profile?.store_name?.trim());
  const hasLogo = Boolean(profile?.logo_url);
  const hasProduct = products.length > 0;
  const hasCommission = products.some((p) => Number(p.commission_percent) > 0);
  const hasPublished = products.some((p) => p.status === "published");

  return [
    { id: "store", label: "Create storefront", done: hasStore, href: "/seller/settings" },
    { id: "logo", label: "Upload logo", done: hasLogo, href: "/seller/settings" },
    { id: "product", label: "Create first product", done: hasProduct, href: "/seller/products/new" },
    { id: "commission", label: "Set commission", done: hasCommission, href: "/seller/products/new" },
    { id: "publish", label: "Publish product", done: hasPublished, href: "/seller/products" },
  ];
}

export function buildMarketerOnboardingSteps(
  profile: UserProfile | null | undefined,
  links: ReferralLink[],
): OnboardingStep[] {
  const visitedMarketplace = Boolean(profile?.marketer_marketplace_visited);
  const hasLink = links.length > 0;
  const totalClicks = links.reduce((s, l) => s + (l.clicks ?? 0), 0);
  const hasClick = totalClicks > 0;
  const hasSale = links.some((l) => (l.sales ?? 0) > 0);

  return [
    { id: "explore", label: "Explore marketplace", done: visitedMarketplace || hasLink, href: "/marketer/marketplace" },
    { id: "promote", label: "Promote first product", done: hasLink, href: "/marketer/marketplace" },
    { id: "link", label: "Generate referral link", done: hasLink, href: "/marketer/marketplace" },
    { id: "share", label: "Share your link", done: hasClick, href: "/marketer/links" },
    { id: "click", label: "Get first click", done: hasClick, href: "/marketer/links" },
    { id: "sale", label: "Earn first commission", done: hasSale, href: "/marketer/earnings" },
  ];
}

export function onboardingProgress(steps: OnboardingStep[]): number {
  if (steps.length === 0) return 100;
  const done = steps.filter((s) => s.done).length;
  return Math.round((done / steps.length) * 100);
}

export function nextOnboardingStep(steps: OnboardingStep[]): OnboardingStep | undefined {
  return steps.find((s) => !s.done);
}

export function marketerMotivation(steps: OnboardingStep[]): string {
  const next = nextOnboardingStep(steps);
  if (!next) return "You're all set — keep promoting to grow earnings.";
  if (next.id === "sale") return "You're one step away from your first commission.";
  if (next.id === "click") return "Share your link — your first click is closer than you think.";
  if (next.id === "link") return "Generate a referral link to start earning.";
  return "Complete the checklist to unlock your first commission.";
}

export function isSellerOnboardingComplete(steps: OnboardingStep[]): boolean {
  return steps.every((s) => s.done);
}

export function isMarketerOnboardingComplete(steps: OnboardingStep[]): boolean {
  return steps.filter((s) => s.id !== "sale").every((s) => s.done);
}
