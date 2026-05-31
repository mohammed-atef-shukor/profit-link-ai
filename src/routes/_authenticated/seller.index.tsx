import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowRight,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchRecentMyProducts } from "@/lib/products.firestore";
import { fetchRecentSalesForSeller, saleSourceLabel } from "@/lib/sales.firestore";
import {
  getSellerActiveMarketerCount,
  getSellerProductCounts,
  getSellerSalesBreakdown,
  getPlatformEarningsTotal,
} from "@/lib/aggregates.firestore";
import {
  getUserProfile,
  getUserProfilesByIds,
  displayNameFor,
  dismissSellerOnboarding,
} from "@/lib/users.firestore";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatCardSkeleton } from "@/components/dashboard/StatCardSkeleton";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";
import { RECENT_PREVIEW_LIMIT } from "@/lib/firestore-pagination";
import {
  buildSellerOnboardingSteps,
  isSellerOnboardingComplete,
  onboardingProgress,
} from "@/lib/onboarding";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";

export const Route = createFileRoute("/_authenticated/seller/")({
  head: () => ({ meta: [{ title: "Seller dashboard — LinkProfit AI" }] }),
  component: SellerOverview,
});

function SellerOverview() {
  const { user, authReady, role } = useFirebaseAuth();
  const qc = useQueryClient();

  const profileQ = useQuery({
    queryKey: ["user-profile", user?.uid],
    queryFn: () => getUserProfile(user!.uid),
    enabled: authReady && !!user,
  });

  const statsQ = useQuery({
    queryKey: ["seller-dashboard-stats", user?.uid],
    queryFn: async () => {
      const [breakdown, productCounts, activeMarketers] = await Promise.all([
        getSellerSalesBreakdown(),
        getSellerProductCounts(),
        getSellerActiveMarketerCount(),
      ]);
      return { breakdown, productCounts, activeMarketers };
    },
    enabled: authReady && !!user,
  });

  const recentProductsQ = useQuery({
    queryKey: ["seller-recent-products", user?.uid],
    queryFn: () => fetchRecentMyProducts(RECENT_PREVIEW_LIMIT + 1),
    enabled: authReady && !!user,
  });

  const recentSalesQ = useQuery({
    queryKey: ["seller-recent-sales", user?.uid],
    queryFn: () => fetchRecentSalesForSeller(RECENT_PREVIEW_LIMIT + 1),
    enabled: authReady && !!user,
  });

  const platformTotalQ = useQuery({
    queryKey: ["platform-earnings-total"],
    queryFn: () => getPlatformEarningsTotal(),
    enabled: authReady && role === "admin",
  });

  const recentProducts = recentProductsQ.data ?? [];
  const recentSales = recentSalesQ.data ?? [];
  const breakdown = statsQ.data?.breakdown;
  const productCounts = statsQ.data?.productCounts;

  const marketerIds = useMemo(
    () => Array.from(new Set(recentSales.map((s) => s.marketer_id).filter(Boolean) as string[])),
    [recentSales],
  );
  const profiles = useQuery({
    queryKey: ["user-profiles", marketerIds.sort().join(",")],
    queryFn: () => getUserProfilesByIds(marketerIds),
    enabled: marketerIds.length > 0,
  });

  const onboardingSteps = useMemo(
    () => buildSellerOnboardingSteps(profileQ.data, recentProducts),
    [profileQ.data, recentProducts],
  );
  const onboardingComplete = isSellerOnboardingComplete(onboardingSteps);
  const showOnboarding =
    role === "seller" &&
    !profileQ.data?.seller_onboarding_dismissed &&
    !onboardingComplete;

  const dismissOnboarding = useMutation({
    mutationFn: dismissSellerOnboarding,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile", user?.uid] });
      toast.success("Onboarding checklist dismissed");
    },
    onError: (e) => toast.error(getFirebaseErrorMessage(e, "Could not dismiss checklist")),
  });

  const statsLoading = statsQ.isLoading;

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Seller overview</div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Live data from your store.</p>
        </div>
        <Link to="/seller/products/new">
          <Button className="gap-2"><Plus className="size-4" /> New product</Button>
        </Link>
      </div>

      {showOnboarding && (
        <OnboardingChecklist
          title="Launch your affiliate store"
          subtitle="Complete these steps to start attracting marketers."
          steps={onboardingSteps}
          progress={onboardingProgress(onboardingSteps)}
          onDismiss={() => dismissOnboarding.mutate()}
        />
      )}

      {statsLoading ? (
        <div className="mt-8">
          <StatCardSkeleton count={5} />
        </div>
      ) : (
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Stat label="Products" value={String(productCounts?.total ?? 0)} sub={`${productCounts?.published ?? 0} published`} icon={<Package className="size-4" />} />
        <Stat label="Sales" value={String(breakdown?.salesCount ?? 0)} sub="all-time" icon={<ShoppingBag className="size-4" />} />
        <Stat label="Revenue" value={`$${(breakdown?.revenue ?? 0).toFixed(2)}`} sub="gross" icon={<DollarSign className="size-4" />} />
        <Stat label="Marketers" value={String(statsQ.data?.activeMarketers ?? 0)} sub="promoting your products" icon={<Users className="size-4" />} />
        <Stat label="Commissions" value={`$${(breakdown?.marketerCommissions ?? 0).toFixed(2)}`} sub="owed to marketers" icon={<TrendingUp className="size-4" />} />
      </div>
      )}

      {role === "admin" && !statsLoading && (
        <section className="mt-8 rounded-2xl border border-primary/20 bg-surface p-5 shadow-soft">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Platform analytics</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Platform commissions"
              value={`$${(platformTotalQ.data ?? 0).toFixed(2)}`}
              sub="direct sales only"
              icon={<DollarSign className="size-4" />}
            />
            <Stat label="Referral sales" value={String(breakdown?.referralSales ?? 0)} sub="marketer attributed" icon={<ShoppingBag className="size-4" />} />
            <Stat label="Direct sales" value={String(breakdown?.directSales ?? 0)} sub="platform attributed" icon={<ShoppingBag className="size-4" />} />
            <Stat label="Platform fees (seller view)" value={`$${(breakdown?.platformFees ?? 0).toFixed(2)}`} sub="from direct checkouts" icon={<TrendingUp className="size-4" />} />
          </div>
        </section>
      )}

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Recent sales"
          action={<Link to="/seller/sales" className="text-xs font-semibold text-primary inline-flex items-center gap-1">View all <ArrowRight className="size-3" /></Link>}
        >
          {recentSalesQ.isLoading ? (
            <TableSkeleton rows={4} />
          ) : recentSales.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No sales recorded yet"
              description="When customers purchase through marketer links or direct checkout, sales appear here in real time."
              action={{ label: "View analytics", to: "/seller/analytics" }}
            />
          ) : (
            <ul className="divide-y divide-border">
              {recentSales.slice(0, RECENT_PREVIEW_LIMIT).map((s) => {
                const name = s.marketer_id
                  ? displayNameFor(profiles.data?.get(s.marketer_id) ?? null, s.marketer_id)
                  : null;
                const via =
                  s.commission_owner === "platform"
                    ? "Platform direct"
                    : `Marketer ${name ?? "—"}`;
                return (
                  <li key={s.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{s.product_title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {saleSourceLabel(s)} · {via} · buyer {s.buyer_email}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">${Number(s.price).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">−${Number(s.commission_amount).toFixed(2)} commission</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title="Your products"
          action={<Link to="/seller/products" className="text-xs font-semibold text-primary inline-flex items-center gap-1">Manage <ArrowRight className="size-3" /></Link>}
        >
          {recentProductsQ.isLoading ? (
            <TableSkeleton rows={4} />
          ) : recentProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products in your catalog yet"
              description="Create your first offer with a strong commission to attract marketers and drive sales."
              action={{ label: "Create product", to: "/seller/products/new" }}
            />
          ) : (
            <ul className="divide-y divide-border">
              {recentProducts.slice(0, RECENT_PREVIEW_LIMIT).map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.commission_percent}% commission</div>
                  </div>
                  <div className="text-sm font-semibold">${Number(p.price).toFixed(2)}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>
    </main>
  );
}

function Stat({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="grid place-items-center size-8 rounded-lg bg-accent text-accent-foreground">{icon}</span>
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-soft p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
