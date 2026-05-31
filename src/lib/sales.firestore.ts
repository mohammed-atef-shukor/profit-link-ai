import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  Timestamp,
  type DocumentSnapshot,
} from "firebase/firestore";
import { auth, db } from "@/firebase";
import { getLinkByCode, getPublishedProduct } from "@/lib/referrals.firestore";
import { fetchPage, RECENT_PREVIEW_LIMIT, type PaginatedResult } from "@/lib/firestore-pagination";

export type CommissionOwner = "marketer" | "platform";

export type Sale = {
  id: string;
  product_id: string;
  product_title: string;
  seller_id: string;
  marketer_id: string | null;
  referral_link_id: string | null;
  referral_code: string | null;
  commission_owner: CommissionOwner;
  buyer_name: string;
  buyer_email: string;
  price: number;
  commission_percent: number;
  commission_amount: number;
  status: string;
  created_at: Timestamp | null;
};

function asNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeCommissionOwner(data: Record<string, unknown>): CommissionOwner {
  if (data.commission_owner === "platform") return "platform";
  return "marketer";
}

export function normalizeSale(id: string, data: Record<string, unknown>): Sale {
  const marketerId = data.marketer_id ? String(data.marketer_id) : null;
  return {
    id,
    product_id: String(data.product_id ?? ""),
    product_title: String(data.product_title ?? ""),
    seller_id: String(data.seller_id ?? ""),
    marketer_id: marketerId,
    referral_link_id: data.referral_link_id ? String(data.referral_link_id) : null,
    referral_code: data.referral_code ? String(data.referral_code) : null,
    commission_owner: normalizeCommissionOwner(data),
    buyer_name: String(data.buyer_name ?? ""),
    buyer_email: String(data.buyer_email ?? ""),
    price: asNumber(data.price, 0),
    commission_percent: asNumber(data.commission_percent, 0),
    commission_amount: asNumber(data.commission_amount, 0),
    status: String(data.status ?? "completed"),
    created_at: (data.created_at as Timestamp | null) ?? null,
  };
}

export function saleSourceLabel(s: Sale): string {
  return s.commission_owner === "platform" ? "Platform" : "Marketer";
}

/** Matches Firestore rules `commissionAmountValid` (±0.01). */
export function calcCommissionAmount(price: number, commissionPercent: number): number {
  return Math.round(price * commissionPercent) / 100;
}

type SaleWritePayload = {
  product_id: string;
  product_title: string;
  seller_id: string;
  marketer_id: string | null;
  referral_link_id: string | null;
  referral_code: string | null;
  commission_owner: CommissionOwner;
  buyer_name: string;
  buyer_email: string;
  price: number;
  commission_percent: number;
  commission_amount: number;
  status: "completed";
  created_at: ReturnType<typeof serverTimestamp>;
};

async function writeMarketerCommission(saleId: string, payload: SaleWritePayload): Promise<void> {
  if (!payload.marketer_id) return;
  await addDoc(collection(db, "commissions"), {
    marketer_id: payload.marketer_id,
    seller_id: payload.seller_id,
    product_id: payload.product_id,
    sale_id: saleId,
    amount: payload.commission_amount,
    status: "completed",
    created_at: serverTimestamp(),
  });
}

async function writePlatformEarning(saleId: string, payload: SaleWritePayload): Promise<void> {
  await addDoc(collection(db, "platform_earnings"), {
    sale_id: saleId,
    product_id: payload.product_id,
    seller_id: payload.seller_id,
    amount: payload.price,
    commission_amount: payload.commission_amount,
    created_at: serverTimestamp(),
  });
}

async function persistSale(payload: SaleWritePayload, referralLinkId: string | null): Promise<string> {
  const ref = await addDoc(collection(db, "sales"), payload);

  if (payload.commission_owner === "marketer") {
    await writeMarketerCommission(ref.id, payload);
    if (referralLinkId) {
      try {
        await updateDoc(doc(db, "referral_links", referralLinkId), {
          sales: increment(1),
          commissions: increment(payload.commission_amount),
        });
      } catch (linkErr) {
        console.error("[persistSale] referral link counters failed:", linkErr);
      }
    }
  } else {
    await writePlatformEarning(ref.id, payload);
  }

  return ref.id;
}

/**
 * Referral checkout — marketer earns commission.
 * Customer only supplies name + email; all merchant fields come from referral code.
 */
export async function recordGuestCheckout(
  referralCode: string,
  buyerName: string,
  buyerEmail: string,
): Promise<string> {
  const code = referralCode.trim().toLowerCase();
  const name = buyerName.trim();
  const email = buyerEmail.trim().toLowerCase();

  if (!code) throw new Error("Invalid referral link.");
  if (name.length < 2) throw new Error("Enter your full name.");
  if (!email.includes("@")) throw new Error("Enter a valid email.");

  const link = await getLinkByCode(code);
  if (!link) throw new Error("This referral link is invalid or expired.");

  const product = await getPublishedProduct(link.product_id);
  if (!product) throw new Error("This product is no longer available.");

  const sellerId = product.seller_id || link.seller_id;
  if (!sellerId || !link.marketer_id) {
    throw new Error("This referral link is not configured correctly. Contact the seller.");
  }

  const price = Number(product.price);
  const commissionPercent = Number(product.commission_percent);
  const commission_amount = calcCommissionAmount(price, commissionPercent);

  const payload: SaleWritePayload = {
    product_id: product.id,
    product_title: product.title,
    seller_id: sellerId,
    marketer_id: link.marketer_id,
    referral_link_id: link.id,
    referral_code: link.code,
    commission_owner: "marketer",
    buyer_name: name,
    buyer_email: email,
    price,
    commission_percent: commissionPercent,
    commission_amount,
    status: "completed",
    created_at: serverTimestamp(),
  };

  return persistSale(payload, link.id);
}

/**
 * Direct checkout — no referral; platform earns the commission slot.
 */
export async function recordDirectCheckout(
  productId: string,
  buyerName: string,
  buyerEmail: string,
): Promise<string> {
  const name = buyerName.trim();
  const email = buyerEmail.trim().toLowerCase();

  if (!productId) throw new Error("Invalid product.");
  if (name.length < 2) throw new Error("Enter your full name.");
  if (!email.includes("@")) throw new Error("Enter a valid email.");

  const product = await getPublishedProduct(productId);
  if (!product) throw new Error("This product is no longer available.");

  const price = Number(product.price);
  const commissionPercent = Number(product.commission_percent);
  const commission_amount = calcCommissionAmount(price, commissionPercent);

  const payload: SaleWritePayload = {
    product_id: product.id,
    product_title: product.title,
    seller_id: product.seller_id,
    marketer_id: null,
    referral_link_id: null,
    referral_code: null,
    commission_owner: "platform",
    buyer_name: name,
    buyer_email: email,
    price,
    commission_percent: commissionPercent,
    commission_amount,
    status: "completed",
    created_at: serverTimestamp(),
  };

  return persistSale(payload, null);
}

export async function fetchSalesForSellerPage(
  pageSize: number,
  cursor: DocumentSnapshot | null,
): Promise<PaginatedResult<Sale>> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  return fetchPage(
    collection(db, "sales"),
    [where("seller_id", "==", uid), orderBy("created_at", "desc")],
    cursor,
    pageSize,
    normalizeSale,
  );
}

export async function fetchRecentSalesForSeller(limitCount = RECENT_PREVIEW_LIMIT): Promise<Sale[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  const q = query(
    collection(db, "sales"),
    where("seller_id", "==", uid),
    orderBy("created_at", "desc"),
    limit(limitCount),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeSale(d.id, d.data()));
}

export async function fetchSalesForMarketerPage(
  pageSize: number,
  cursor: DocumentSnapshot | null,
): Promise<PaginatedResult<Sale>> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  return fetchPage(
    collection(db, "sales"),
    [where("marketer_id", "==", uid), orderBy("created_at", "desc")],
    cursor,
    pageSize,
    normalizeSale,
  );
}

export async function fetchSalesForProductPage(
  productId: string,
  pageSize: number,
  cursor: DocumentSnapshot | null,
): Promise<PaginatedResult<Sale>> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  return fetchPage(
    collection(db, "sales"),
    [
      where("product_id", "==", productId),
      where("seller_id", "==", uid),
      orderBy("created_at", "desc"),
    ],
    cursor,
    pageSize,
    normalizeSale,
  );
}

export async function fetchSalesSampleForSeller(limitCount: number): Promise<Sale[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  const q = query(
    collection(db, "sales"),
    where("seller_id", "==", uid),
    orderBy("created_at", "desc"),
    limit(limitCount),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeSale(d.id, d.data()));
}

export async function fetchLinksForProductPage(
  productId: string,
  pageSize: number,
  cursor: DocumentSnapshot | null,
): Promise<PaginatedResult<LinkRow>> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  const productSnap = await getDoc(doc(db, "products", productId));
  if (!productSnap.exists() || productSnap.data()?.seller_id !== uid) {
    throw new Error("Product not found or access denied");
  }
  return fetchPage(
    collection(db, "referral_links"),
    [where("product_id", "==", productId), orderBy("clicks", "desc")],
    cursor,
    pageSize,
    normalizeLinkRow,
  );
}

export async function listSalesForSeller(): Promise<Sale[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  const q = query(
    collection(db, "sales"),
    where("seller_id", "==", uid),
    orderBy("created_at", "desc"),
    limit(200),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeSale(d.id, d.data()));
}

export async function listSalesForMarketer(): Promise<Sale[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  const q = query(
    collection(db, "sales"),
    where("marketer_id", "==", uid),
    orderBy("created_at", "desc"),
    limit(200),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeSale(d.id, d.data()));
}

export async function listSalesForProduct(productId: string): Promise<Sale[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  const q = query(
    collection(db, "sales"),
    where("product_id", "==", productId),
    where("seller_id", "==", uid),
    orderBy("created_at", "desc"),
    limit(200),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeSale(d.id, d.data()));
}

export type LinkRow = {
  id: string;
  marketer_id: string;
  code: string;
  clicks: number;
  sales: number;
  commissions: number;
};

function normalizeLinkRow(id: string, data: Record<string, unknown>): LinkRow {
  return {
    id,
    marketer_id: String(data.marketer_id ?? ""),
    code: String(data.code ?? ""),
    clicks: asNumber(data.clicks, 0),
    sales: asNumber(data.sales, 0),
    commissions: asNumber(data.commissions, 0),
  };
}

export async function listLinksForProduct(productId: string): Promise<LinkRow[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  const productSnap = await getDoc(doc(db, "products", productId));
  if (!productSnap.exists() || productSnap.data()?.seller_id !== uid) {
    throw new Error("Product not found or access denied");
  }
  const q = query(
    collection(db, "referral_links"),
    where("product_id", "==", productId),
    orderBy("clicks", "desc"),
    limit(100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeLinkRow(d.id, d.data()));
}

export function subscribeSalesForSeller(
  next: (data: Sale[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    next([]);
    return () => {};
  }
  const q = query(
    collection(db, "sales"),
    where("seller_id", "==", uid),
    orderBy("created_at", "desc"),
    limit(200),
  );
  return onSnapshot(
    q,
    (snap) => next(snap.docs.map((d) => normalizeSale(d.id, d.data()))),
    (e) => onError?.(e as Error),
  );
}

export function subscribeSalesForMarketer(
  next: (data: Sale[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    next([]);
    return () => {};
  }
  const q = query(
    collection(db, "sales"),
    where("marketer_id", "==", uid),
    orderBy("created_at", "desc"),
    limit(200),
  );
  return onSnapshot(
    q,
    (snap) => next(snap.docs.map((d) => normalizeSale(d.id, d.data()))),
    (e) => onError?.(e as Error),
  );
}

export function subscribeSalesForProduct(
  productId: string,
  next: (data: Sale[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    next([]);
    return () => {};
  }
  const q = query(
    collection(db, "sales"),
    where("product_id", "==", productId),
    where("seller_id", "==", uid),
    orderBy("created_at", "desc"),
    limit(200),
  );
  return onSnapshot(
    q,
    (snap) => next(snap.docs.map((d) => normalizeSale(d.id, d.data()))),
    (e) => onError?.(e as Error),
  );
}

export function subscribeLinksForProduct(
  productId: string,
  next: (data: LinkRow[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    next([]);
    return () => {};
  }

  let unsub: (() => void) | undefined;
  let cancelled = false;

  void (async () => {
    try {
      const productSnap = await getDoc(doc(db, "products", productId));
      if (cancelled) return;
      if (!productSnap.exists() || productSnap.data()?.seller_id !== uid) {
        onError?.(new Error("Product not found or access denied"));
        next([]);
        return;
      }
      const q = query(
        collection(db, "referral_links"),
        where("product_id", "==", productId),
        orderBy("clicks", "desc"),
        limit(100),
      );
      unsub = onSnapshot(
        q,
        (snap) => next(snap.docs.map((d) => normalizeLinkRow(d.id, d.data()))),
        (e) => onError?.(e as Error),
      );
    } catch (e) {
      if (!cancelled) onError?.(e as Error);
    }
  })();

  return () => {
    cancelled = true;
    unsub?.();
  };
}
