import type { ReferralLink } from "@/lib/referrals.firestore";
import type { Sale } from "@/lib/sales.firestore";
import type { Product } from "@/lib/products.firestore";

export type TimeSeriesPoint = { label: string; revenue: number; sales: number };

export type ProductPerformance = {
  product_id: string;
  title: string;
  revenue: number;
  sales: number;
  clicks: number;
};

export type MarketerPerformance = {
  marketer_id: string;
  revenue: number;
  sales: number;
  clicks: number;
  commissions: number;
};

export type SellerAnalytics = {
  revenue: number;
  salesCount: number;
  clicks: number;
  conversionRate: number;
  referralSales: number;
  directSales: number;
  marketerCommissions: number;
  platformCommissions: number;
  revenueSeries: TimeSeriesPoint[];
  salesSeries: TimeSeriesPoint[];
  topProducts: ProductPerformance[];
  topMarketers: MarketerPerformance[];
};

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(key: string): string {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

export function computeSellerAnalytics(
  sales: Sale[],
  links: ReferralLink[],
  products: Product[],
): SellerAnalytics {
  const revenue = sales.reduce((s, x) => s + Number(x.price ?? 0), 0);
  const clicks = links.reduce((s, l) => s + (l.clicks ?? 0), 0);
  const salesCount = sales.length;
  const referralSales = sales.filter((s) => s.commission_owner === "marketer").length;
  const directSales = sales.filter((s) => s.commission_owner === "platform").length;
  const marketerCommissions = sales
    .filter((s) => s.commission_owner === "marketer")
    .reduce((s, x) => s + Number(x.commission_amount ?? 0), 0);
  const platformCommissions = sales
    .filter((s) => s.commission_owner === "platform")
    .reduce((s, x) => s + Number(x.commission_amount ?? 0), 0);
  const conversionRate = clicks > 0 ? (salesCount / clicks) * 100 : 0;

  const monthMap = new Map<string, { revenue: number; sales: number }>();
  for (const s of sales) {
    const d = s.created_at?.toDate?.();
    if (!d) continue;
    const key = monthKey(d);
    const row = monthMap.get(key) ?? { revenue: 0, sales: 0 };
    row.revenue += Number(s.price ?? 0);
    row.sales += 1;
    monthMap.set(key, row);
  }

  const sortedMonths = Array.from(monthMap.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
  const revenueSeries: TimeSeriesPoint[] = sortedMonths.map(([key, v]) => ({
    label: formatMonth(key),
    revenue: v.revenue,
    sales: v.sales,
  }));
  const salesSeries = revenueSeries;

  const productTitles = new Map(products.map((p) => [p.id, p.title]));
  const productAgg = new Map<string, ProductPerformance>();
  for (const s of sales) {
    const row = productAgg.get(s.product_id) ?? {
      product_id: s.product_id,
      title: s.product_title || productTitles.get(s.product_id) || "Product",
      revenue: 0,
      sales: 0,
      clicks: 0,
    };
    row.revenue += Number(s.price ?? 0);
    row.sales += 1;
    productAgg.set(s.product_id, row);
  }
  for (const l of links) {
    const row = productAgg.get(l.product_id) ?? {
      product_id: l.product_id,
      title: l.product_title || productTitles.get(l.product_id) || "Product",
      revenue: 0,
      sales: 0,
      clicks: 0,
    };
    row.clicks += l.clicks ?? 0;
    productAgg.set(l.product_id, row);
  }
  const topProducts = Array.from(productAgg.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const marketerAgg = new Map<string, MarketerPerformance>();
  for (const l of links) {
    if (!l.marketer_id) continue;
    const row = marketerAgg.get(l.marketer_id) ?? {
      marketer_id: l.marketer_id,
      revenue: 0,
      sales: 0,
      clicks: 0,
      commissions: 0,
    };
    row.clicks += l.clicks ?? 0;
    row.sales += l.sales ?? 0;
    row.commissions += l.commissions ?? 0;
    marketerAgg.set(l.marketer_id, row);
  }
  for (const s of sales) {
    if (!s.marketer_id) continue;
    const row = marketerAgg.get(s.marketer_id) ?? {
      marketer_id: s.marketer_id,
      revenue: 0,
      sales: 0,
      clicks: 0,
      commissions: 0,
    };
    row.revenue += Number(s.price ?? 0);
    marketerAgg.set(s.marketer_id, row);
  }
  const topMarketers = Array.from(marketerAgg.values())
    .sort((a, b) => b.commissions - a.commissions)
    .slice(0, 5);

  return {
    revenue,
    salesCount,
    clicks,
    conversionRate,
    referralSales,
    directSales,
    marketerCommissions,
    platformCommissions,
    revenueSeries,
    salesSeries,
    topProducts,
    topMarketers,
  };
}
