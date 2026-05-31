import {
  collection,
  getAggregateFromServer,
  getCountFromServer,
  getDocs,
  limit,
  query,
  sum,
  where,
} from "firebase/firestore";
import { auth, db } from "@/firebase";

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  return uid;
}

export type SellerSalesTotals = {
  revenue: number;
  salesCount: number;
  marketerCommissions: number;
  platformFees: number;
  net: number;
};

export async function getSellerSalesTotals(sellerId?: string): Promise<SellerSalesTotals> {
  const uid = sellerId ?? requireUid();
  const base = query(collection(db, "sales"), where("seller_id", "==", uid));

  const [allAgg, countSnap, marketerAgg, platformAgg] = await Promise.all([
    getAggregateFromServer(base, { revenue: sum("price") }).catch(() => null),
    getCountFromServer(base).catch(() => null),
    getAggregateFromServer(
      query(base, where("commission_owner", "==", "marketer")),
      { commissions: sum("commission_amount") },
    ).catch(() => null),
    getAggregateFromServer(
      query(base, where("commission_owner", "==", "platform")),
      { fees: sum("commission_amount") },
    ).catch(() => null),
  ]);

  const revenue = allAgg?.data().revenue ?? 0;
  const marketerCommissions = marketerAgg?.data().commissions ?? 0;
  const platformFees = platformAgg?.data().fees ?? 0;

  return {
    revenue,
    salesCount: countSnap?.data().count ?? 0,
    marketerCommissions,
    platformFees,
    net: revenue - marketerCommissions - platformFees,
  };
}

export async function getSellerSalesCount(sellerId?: string): Promise<number> {
  const uid = sellerId ?? requireUid();
  const snap = await getCountFromServer(query(collection(db, "sales"), where("seller_id", "==", uid)));
  return snap.data().count;
}

export type SellerProductCounts = {
  total: number;
  published: number;
};

export async function getSellerProductCounts(sellerId?: string): Promise<SellerProductCounts> {
  const uid = sellerId ?? requireUid();
  const [totalSnap, publishedSnap] = await Promise.all([
    getCountFromServer(query(collection(db, "products"), where("seller_id", "==", uid))),
    getCountFromServer(
      query(
        collection(db, "products"),
        where("seller_id", "==", uid),
        where("status", "==", "published"),
      ),
    ),
  ]);
  return {
    total: totalSnap.data().count,
    published: publishedSnap.data().count,
  };
}

export type MarketerCommissionTotals = {
  totalEarned: number;
  pending: number;
  paid: number;
};

export async function getMarketerCommissionTotals(marketerId?: string): Promise<MarketerCommissionTotals> {
  const uid = marketerId ?? requireUid();
  const base = query(collection(db, "commissions"), where("marketer_id", "==", uid));

  const [totalAgg, pendingAgg, paidAgg] = await Promise.all([
    getAggregateFromServer(base, { total: sum("amount") }).catch(() => null),
    getAggregateFromServer(query(base, where("status", "==", "pending")), { total: sum("amount") }).catch(
      () => null,
    ),
    getAggregateFromServer(query(base, where("status", "==", "paid")), { total: sum("amount") }).catch(
      () => null,
    ),
  ]);

  return {
    totalEarned: totalAgg?.data().total ?? 0,
    pending: pendingAgg?.data().total ?? 0,
    paid: paidAgg?.data().total ?? 0,
  };
}

export async function getPlatformEarningsTotal(): Promise<number> {
  const snap = await getAggregateFromServer(collection(db, "platform_earnings"), {
    total: sum("commission_amount"),
  }).catch(() => null);
  return snap?.data().total ?? 0;
}

export type SellerSalesBreakdown = SellerSalesTotals & {
  referralSales: number;
  directSales: number;
  clicks: number;
};

export async function getSellerSalesBreakdown(sellerId?: string): Promise<SellerSalesBreakdown> {
  const uid = sellerId ?? requireUid();
  const base = query(collection(db, "sales"), where("seller_id", "==", uid));
  const linksBase = query(collection(db, "referral_links"), where("seller_id", "==", uid));

  const [totals, referralSnap, directSnap, clicksAgg] = await Promise.all([
    getSellerSalesTotals(uid),
    getCountFromServer(query(base, where("commission_owner", "==", "marketer"))).catch(() => null),
    getCountFromServer(query(base, where("commission_owner", "==", "platform"))).catch(() => null),
    getAggregateFromServer(linksBase, { clicks: sum("clicks") }).catch(() => null),
  ]);

  return {
    ...totals,
    referralSales: referralSnap?.data().count ?? 0,
    directSales: directSnap?.data().count ?? 0,
    clicks: clicksAgg?.data().clicks ?? 0,
  };
}

export async function getSellerActiveMarketerCount(sellerId?: string): Promise<number> {
  const uid = sellerId ?? requireUid();
  const snap = await getDocs(
    query(collection(db, "referral_links"), where("seller_id", "==", uid), limit(500)),
  );
  return new Set(snap.docs.map((d) => d.data().marketer_id).filter(Boolean)).size;
}

export type MarketerLinkTotals = {
  linkCount: number;
  clicks: number;
  sales: number;
  commissions: number;
};

export async function getMarketerLinkTotals(marketerId?: string): Promise<MarketerLinkTotals> {
  const uid = marketerId ?? requireUid();
  const base = query(collection(db, "referral_links"), where("marketer_id", "==", uid));

  const [countSnap, aggSnap] = await Promise.all([
    getCountFromServer(base),
    getAggregateFromServer(base, {
      clicks: sum("clicks"),
      sales: sum("sales"),
      commissions: sum("commissions"),
    }).catch(() => null),
  ]);

  return {
    linkCount: countSnap.data().count,
    clicks: aggSnap?.data().clicks ?? 0,
    sales: aggSnap?.data().sales ?? 0,
    commissions: aggSnap?.data().commissions ?? 0,
  };
}

export type PlatformSalesStats = {
  referralSales: number;
  directSales: number;
  marketerCommissions: number;
};

export async function getPlatformSalesStats(): Promise<PlatformSalesStats> {
  const salesCol = collection(db, "sales");
  const [referralSnap, directSnap, marketerAgg] = await Promise.all([
    getCountFromServer(query(salesCol, where("commission_owner", "==", "marketer"))).catch(() => null),
    getCountFromServer(query(salesCol, where("commission_owner", "==", "platform"))).catch(() => null),
    getAggregateFromServer(query(salesCol, where("commission_owner", "==", "marketer")), {
      total: sum("commission_amount"),
    }).catch(() => null),
  ]);

  return {
    referralSales: referralSnap?.data().count ?? 0,
    directSales: directSnap?.data().count ?? 0,
    marketerCommissions: marketerAgg?.data().total ?? 0,
  };
}

export type ProductAnalyticsTotals = {
  clicks: number;
  sales: number;
  revenue: number;
  marketers: number;
};

export async function getProductAnalyticsTotals(productId: string): Promise<ProductAnalyticsTotals> {
  const uid = requireUid();
  const salesBase = query(
    collection(db, "sales"),
    where("product_id", "==", productId),
    where("seller_id", "==", uid),
  );
  const linksBase = query(collection(db, "referral_links"), where("product_id", "==", productId));

  const [salesSnap, revenueAgg, clicksAgg, linksSnap] = await Promise.all([
    getCountFromServer(salesBase).catch(() => null),
    getAggregateFromServer(salesBase, { revenue: sum("price") }).catch(() => null),
    getAggregateFromServer(linksBase, { clicks: sum("clicks") }).catch(() => null),
    getDocs(query(linksBase, limit(500))),
  ]);

  return {
    sales: salesSnap?.data().count ?? 0,
    revenue: revenueAgg?.data().revenue ?? 0,
    clicks: clicksAgg?.data().clicks ?? 0,
    marketers: new Set(linksSnap.docs.map((d) => d.data().marketer_id).filter(Boolean)).size,
  };
}
