import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  DollarSign,
  MousePointerClick,
  ShoppingBag,
  TrendingUp,
  Users,
  ArrowRight,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { fetchRecentMyProducts } from "@/lib/products.firestore";
import { fetchSalesSampleForSeller } from "@/lib/sales.firestore";
import { fetchReferralLinksSampleForSeller } from "@/lib/referrals.firestore";
import { getSellerSalesBreakdown } from "@/lib/aggregates.firestore";
import { computeSellerAnalytics } from "@/lib/seller-analytics";
import { getUserProfilesByIds, displayNameFor } from "@/lib/users.firestore";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { StatCardSkeleton } from "@/components/dashboard/StatCardSkeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ANALYTICS_SAMPLE_LIMIT } from "@/lib/firestore-pagination";

export const Route = createFileRoute("/_authenticated/seller/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Seller — LinkProfit AI" }] }),
  component: SellerAnalyticsPage,
});

const revenueChartConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--primary))" },
};

const salesChartConfig = {
  sales: { label: "Sales", color: "hsl(var(--primary))" },
};

function SellerAnalyticsPage() {
  const { user, authReady } = useFirebaseAuth();

  const totalsQ = useQuery({
    queryKey: ["seller-analytics-totals", user?.uid],
    queryFn: () => getSellerSalesBreakdown(),
    enabled: authReady && !!user,
  });

  const sampleQ = useQuery({
    queryKey: ["seller-analytics-sample", user?.uid],
    queryFn: async () => {
      const uid = user!.uid;
      const [sales, links, products] = await Promise.all([
        fetchSalesSampleForSeller(ANALYTICS_SAMPLE_LIMIT),
        fetchReferralLinksSampleForSeller(uid, ANALYTICS_SAMPLE_LIMIT),
        fetchRecentMyProducts(50),
      ]);
      return { sales, links, products };
    },
    enabled: authReady && !!user,
  });

  const chartAnalytics = useMemo(
    () =>
      computeSellerAnalytics(
        sampleQ.data?.sales ?? [],
        sampleQ.data?.links ?? [],
        sampleQ.data?.products ?? [],
      ),
    [sampleQ.data],
  );

  const totals = totalsQ.data;
  const conversionRate =
    totals && totals.clicks > 0 ? (totals.salesCount / totals.clicks) * 100 : 0;

  const marketerIds = useMemo(
    () => chartAnalytics.topMarketers.map((m) => m.marketer_id),
    [chartAnalytics.topMarketers],
  );
  const profiles = useQuery({
    queryKey: ["user-profiles", marketerIds.sort().join(",")],
    queryFn: () => getUserProfilesByIds(marketerIds),
    enabled: marketerIds.length > 0,
  });

  const loading = totalsQ.isLoading || sampleQ.isLoading;
  const hasData = (totals?.salesCount ?? 0) > 0 || (totals?.clicks ?? 0) > 0;

  return (
    <main>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Seller</div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Revenue, conversion, and partner performance.</p>
      </div>

      {loading ? (
        <div className="mt-8">
          <StatCardSkeleton count={5} />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <Stat label="Revenue" value={`$${(totals?.revenue ?? 0).toFixed(2)}`} icon={<DollarSign className="size-4" />} />
            <Stat label="Sales" value={String(totals?.salesCount ?? 0)} icon={<ShoppingBag className="size-4" />} />
            <Stat label="Clicks" value={String(totals?.clicks ?? 0)} icon={<MousePointerClick className="size-4" />} />
            <Stat
              label="Conversion"
              value={`${conversionRate.toFixed(1)}%`}
              sub="click → sale"
              icon={<TrendingUp className="size-4" />}
            />
            <Stat
              label="Referral / Direct"
              value={`${totals?.referralSales ?? 0} / ${totals?.directSales ?? 0}`}
              sub="sales split"
              icon={<BarChart3 className="size-4" />}
            />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Stat
              label="Marketer commissions"
              value={`$${(totals?.marketerCommissions ?? 0).toFixed(2)}`}
              sub="referral sales"
              icon={<Users className="size-4" />}
            />
            <Stat
              label="Platform commissions"
              value={`$${(totals?.platformFees ?? 0).toFixed(2)}`}
              sub="direct sales"
              icon={<DollarSign className="size-4" />}
            />
          </div>

          {!hasData ? (
            <div className="mt-10 rounded-2xl border border-border bg-surface shadow-soft">
              <EmptyState
                icon={BarChart3}
                title="No analytics data yet"
                description="Publish products with competitive commissions. Once marketers promote them, revenue and conversion charts will appear here."
                action={{ label: "Create product", to: "/seller/products/new" }}
              />
            </div>
          ) : (
            <section className="mt-10 grid gap-6 lg:grid-cols-2">
              <Panel title="Revenue over time">
                {chartAnalytics.revenueSeries.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No revenue history yet.</p>
                ) : (
                  <ChartContainer config={revenueChartConfig} className="h-[220px] w-full aspect-auto">
                    <BarChart data={chartAnalytics.revenueSeries} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis tickLine={false} axisLine={false} fontSize={11} width={40} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </Panel>

              <Panel title="Sales over time">
                {chartAnalytics.salesSeries.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No sales history yet.</p>
                ) : (
                  <ChartContainer config={salesChartConfig} className="h-[220px] w-full aspect-auto">
                    <BarChart data={chartAnalytics.salesSeries} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis tickLine={false} axisLine={false} fontSize={11} width={32} allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="sales" fill="var(--color-sales)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </Panel>

              <Panel
                title="Conversion funnel"
                action={
                  <span className="text-xs text-muted-foreground">
                    {totals?.clicks ?? 0} clicks → {totals?.salesCount ?? 0} sales
                  </span>
                }
              >
                <div className="space-y-3 py-2">
                  <FunnelRow label="Referral clicks" value={totals?.clicks ?? 0} max={Math.max(totals?.clicks ?? 0, 1)} />
                  <FunnelRow label="Completed sales" value={totals?.salesCount ?? 0} max={Math.max(totals?.clicks ?? 0, 1)} />
                  <FunnelRow
                    label="Referral-attributed"
                    value={totals?.referralSales ?? 0}
                    max={Math.max(totals?.salesCount ?? 0, 1)}
                  />
                  <FunnelRow
                    label="Direct platform"
                    value={totals?.directSales ?? 0}
                    max={Math.max(totals?.salesCount ?? 0, 1)}
                  />
                </div>
              </Panel>

              <Panel title="Best performing products">
                {chartAnalytics.topProducts.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No product performance yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {chartAnalytics.topProducts.map((p) => (
                      <li key={p.product_id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.clicks} clicks · {p.sales} sales
                          </div>
                        </div>
                        <div className="text-sm font-semibold tabular-nums">${p.revenue.toFixed(2)}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel
                title="Top marketers"
                action={
                  <Link to="/seller/marketers" className="text-xs font-semibold text-primary inline-flex items-center gap-1">
                    View all <ArrowRight className="size-3" />
                  </Link>
                }
                className="lg:col-span-2"
              >
                {chartAnalytics.topMarketers.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No marketer activity yet. Strong commissions help attract promoters.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {chartAnalytics.topMarketers.map((m) => (
                      <li key={m.marketer_id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {displayNameFor(profiles.data?.get(m.marketer_id) ?? null, m.marketer_id)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {m.clicks} clicks · {m.sales} sales · ${m.revenue.toFixed(2)} revenue
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-primary tabular-nums">
                          ${m.commissions.toFixed(2)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft transition-shadow hover:shadow-elegant">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="grid place-items-center size-8 rounded-lg bg-accent text-accent-foreground">{icon}</span>
      </div>
      <div className="mt-3 font-display text-2xl sm:text-3xl font-bold">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-surface shadow-soft p-5 ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function FunnelRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-gradient-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
